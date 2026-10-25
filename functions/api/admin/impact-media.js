
const MAX_FILE_SIZE = 8 * 1024 * 1024;

const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"]
]);

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function cleanText(value, max = 250) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isValidId(value) {
  return typeof value === "string" &&
    value.length > 0 &&
    value.length <= 100;
}

export async function onRequestPost({ request, env }) {
  let uploadedKey = null;

  try {
    if (!env.DB || !env.MEDIA) {
      return json({
        error: "DB veya MEDIA bağlantısı bulunamadı."
      }, 500);
    }

    const contentLength = Number(request.headers.get("Content-Length") || 0);

    if (contentLength > MAX_FILE_SIZE + 100_000) {
      return json({ error: "Dosya en fazla 8 MB olabilir." }, 413);
    }

    const form = await request.formData();
    const action = cleanText(form.get("action"), 30);

    // Fotoğraf silme
    if (action === "delete") {
      const id = cleanText(form.get("id"), 100);

      if (!isValidId(id)) {
        return json({ error: "Fotoğraf kimliği geçersiz." }, 400);
      }

      const media = await env.DB.prepare(`
        SELECT id, object_key
        FROM hypium_impact_media
        WHERE id = ?
      `).bind(id).first();

      if (!media) {
        return json({ error: "Fotoğraf bulunamadı." }, 404);
      }

      await env.MEDIA.delete(media.object_key);

      await env.DB.prepare(`
        DELETE FROM hypium_impact_media WHERE id = ?
      `).bind(id).run();

      return json({ success: true });
    }

    // Fotoğraf yükleme
    const file = form.get("file");

    if (!file || typeof file.arrayBuffer !== "function") {
      return json({ error: "Bir fotoğraf dosyası seçmelisin." }, 400);
    }

    if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
      return json({ error: "Fotoğraf 8 MB sınırını aşmamalı." }, 413);
    }

    const extension = ALLOWED_TYPES.get(file.type);

    if (!extension) {
      return json({
        error: "Yalnızca JPEG, PNG ve WebP dosyaları kabul edilir."
      }, 415);
    }

    const eventId = cleanText(form.get("event_id"), 100) || null;
    const altText = cleanText(form.get("alt_text"), 250);
    const sortOrder = Number(form.get("sort_order") || 0);

    if (!Number.isInteger(sortOrder) || sortOrder < 0) {
      return json({ error: "Fotoğraf sırası geçersiz." }, 400);
    }

    if (eventId) {
      const event = await env.DB.prepare(`
        SELECT id FROM hypium_impact_events WHERE id = ?
      `).bind(eventId).first();

      if (!event) {
        return json({ error: "Bağlanacak etkinlik bulunamadı." }, 400);
      }
    }

    const bytes = await file.arrayBuffer();
    const signature = new Uint8Array(bytes.slice(0, 12));

    // Dosya uzantısına veya tarayıcı bildirimine tek başına güvenme.
    const validSignature =
      (extension === "jpg" &&
        signature[0] === 0xff && signature[1] === 0xd8 &&
        signature[2] === 0xff) ||
      (extension === "png" &&
        signature[0] === 0x89 && signature[1] === 0x50 &&
        signature[2] === 0x4e && signature[3] === 0x47) ||
      (extension === "webp" &&
        String.fromCharCode(...signature.slice(0, 4)) === "RIFF" &&
        String.fromCharCode(...signature.slice(8, 12)) === "WEBP");

    if (!validSignature) {
      return json({ error: "Dosya içeriği geçerli bir görsel değil." }, 415);
    }

    const id = crypto.randomUUID();
    const key = `${id}.${extension}`;
    uploadedKey = key;

    await env.MEDIA.put(key, bytes, {
      httpMetadata: { contentType: file.type }
    });

    await env.DB.prepare(`
      INSERT INTO hypium_impact_media
        (id, event_id, object_key, alt_text, sort_order)
      VALUES (?, ?, ?, ?, ?)
    `).bind(id, eventId, key, altText, sortOrder).run();

    return json({
      success: true,
      media: {
        id,
        event_id: eventId,
        object_key: key,
        alt_text: altText,
        sort_order: sortOrder,
        url: `/api/impact-media/${key}`
      }
    }, 201);
  } catch (error) {
    console.error("Impact media error:", error);

    if (uploadedKey && env.MEDIA) {
      try {
        await env.MEDIA.delete(uploadedKey);
      } catch (cleanupError) {
        console.error("Media cleanup error:", cleanupError);
      }
    }

    return json({ error: "Fotoğraf işlemi tamamlanamadı." }, 500);
  }
}
