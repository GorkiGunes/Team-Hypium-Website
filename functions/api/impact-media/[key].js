
export async function onRequestGet({ params, env }) {
  if (!env.MEDIA) {
    return new Response("Medya deposu yapılandırılmamış.", {
      status: 500
    });
  }

  const key = params.key;

  // Yalnızca API'nin oluşturduğu UUID tabanlı dosya adlarına izin ver.
  if (
    typeof key !== "string" ||
    !/^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(key)
  ) {
    return new Response("Geçersiz dosya.", { status: 400 });
  }

  try {
    const object = await env.MEDIA.get(key);

    if (!object) {
      return new Response("Fotoğraf bulunamadı.", { status: 404 });
    }

    const contentType = object.httpMetadata?.contentType || "";

    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
      return new Response("Desteklenmeyen dosya türü.", { status: 415 });
    }

    return new Response(object.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("Public media error:", error);

    return new Response("Fotoğraf sunulamadı.", { status: 500 });
  }
}
