```js
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function newId() {
  return crypto.randomUUID();
}

function validLanguage(language) {
  return ["tr", "en", "de", "fr"].includes(language);
}

function text(value, max = 5000) {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
}

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function published(value) {
  return value === true || value === 1;
}

async function readBody(request) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return null;
    }

    return body;
  } catch {
    return null;
  }
}

async function getImpact(env) {
  const db = env.DB;

  const [events, stats, points, media] = await Promise.all([
    db.prepare(`
      SELECT *
      FROM hypium_impact_events
      ORDER BY sort_order, created_at DESC
    `).all(),

    db.prepare(`
      SELECT *
      FROM hypium_impact_stats
      ORDER BY sort_order, stat_key
    `).all(),

    db.prepare(`
      SELECT *
      FROM hypium_impact_map_points
      ORDER BY sort_order
    `).all(),

    // object_key eklendi: Yönetim ekranı fotoğrafı R2 üzerinden bulabilir.
    db.prepare(`
      SELECT
        id,
        event_id,
        object_key,
        alt_text,
        sort_order,
        created_at
      FROM hypium_impact_media
      ORDER BY sort_order, created_at
    `).all()
  ]);

  const [eventTranslations, statTranslations, mapTranslations] =
    await Promise.all([
      db.prepare(`
        SELECT *
        FROM hypium_impact_event_translations
      `).all(),

      db.prepare(`
        SELECT *
        FROM hypium_impact_stat_translations
      `).all(),

      db.prepare(`
        SELECT *
        FROM hypium_impact_map_translations
      `).all()
    ]);

  return json({
    events: events.results,
    eventTranslations: eventTranslations.results,
    stats: stats.results,
    statTranslations: statTranslations.results,
    mapPoints: points.results,
    mapTranslations: mapTranslations.results,
    media: media.results
  });
}

export async function onRequestGet({ env }) {
  try {
    if (!env.DB) {
      return json(
        { error: "DB veritabanı bağlantısı bulunamadı." },
        500
      );
    }

    return await getImpact(env);
  } catch (error) {
    console.error("Impact GET error:", error);

    return json(
      { error: "Impact verileri alınamadı." },
      500
    );
  }
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return json(
        { error: "DB veritabanı bağlantısı bulunamadı." },
        500
      );
    }

    const body = await readBody(request);

    if (!body || typeof body.action !== "string") {
      return json({ error: "Geçersiz istek." }, 400);
    }

    const db = env.DB;

    // --------------------------------------------------
    // ETKİNLİK EKLEME / DÜZENLEME
    // --------------------------------------------------
    if (body.action === "save_event") {
      const id = text(body.id, 100) || newId();
      const language = text(body.language, 2).toLowerCase();

      if (!validLanguage(language)) {
        return json(
          { error: "Dil tr, en, de veya fr olmalı." },
          400
        );
      }

      const title = text(body.title, 200);
      const description = text(body.description, 5000);
      const locationName = text(body.location_name, 200);
      const eventDate = text(body.event_date, 30);
      const peopleReached = number(body.people_reached, 0);

      const latitude =
        body.latitude === "" || body.latitude == null
          ? null
          : Number(body.latitude);

      const longitude =
        body.longitude === "" || body.longitude == null
          ? null
          : Number(body.longitude);

      const sortOrder = number(body.sort_order, 0);
      const isPublished = published(body.is_published) ? 1 : 0;

      if (!title) {
        return json(
          { error: "Etkinlik başlığı zorunludur." },
          400
        );
      }

      if (
        !Number.isInteger(peopleReached) ||
        peopleReached < 0
      ) {
        return json(
          { error: "Ulaşılan kişi sayısı geçersiz." },
          400
        );
      }

      if (
        (latitude !== null &&
          (!Number.isFinite(latitude) ||
            latitude < -90 ||
            latitude > 90)) ||
        (longitude !== null &&
          (!Number.isFinite(longitude) ||
            longitude < -180 ||
            longitude > 180))
      ) {
        return json(
          { error: "Enlem veya boylam geçersiz." },
          400
        );
      }

      if ((latitude === null) !== (longitude === null)) {
        return json(
          {
            error:
              "Harita için hem enlem hem boylam girilmelidir."
          },
          400
        );
      }

      await db.prepare(`
        INSERT INTO hypium_impact_events
          (
            id,
            event_date,
            latitude,
            longitude,
            people_reached,
            sort_order,
            is_published,
            updated_at
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          event_date = excluded.event_date,
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          people_reached = excluded.people_reached,
          sort_order = excluded.sort_order,
          is_published = excluded.is_published,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        id,
        eventDate || null,
        latitude,
        longitude,
        peopleReached,
        sortOrder,
        isPublished
      ).run();

      await db.prepare(`
        INSERT INTO hypium_impact_event_translations
          (
            event_id,
            language,
            title,
            description,
            location_name
          )
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(event_id, language) DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          location_name = excluded.location_name
      `).bind(
        id,
        language,
        title,
        description,
        locationName
      ).run();

      return json({ success: true, id });
    }

    // --------------------------------------------------
    // ETKİNLİK SİLME
    // --------------------------------------------------
    if (body.action === "delete_event") {
      const id = text(body.id, 100);

      if (!id) {
        return json(
          { error: "Etkinlik kimliği gerekli." },
          400
        );
      }

      const existing = await db.prepare(`
        SELECT id
        FROM hypium_impact_events
        WHERE id = ?
      `).bind(id).first();

      if (!existing) {
        return json(
          { error: "Etkinlik bulunamadı." },
          404
        );
      }

      await db.prepare(`
        DELETE FROM hypium_impact_event_translations
        WHERE event_id = ?
      `).bind(id).run();

      // Fotoğraflar silinmez; etkinlikle bağlantıları kaldırılır.
      await db.prepare(`
        UPDATE hypium_impact_media
        SET event_id = NULL
        WHERE event_id = ?
      `).bind(id).run();

      await db.prepare(`
        UPDATE hypium_impact_map_points
        SET event_id = NULL
        WHERE event_id = ?
      `).bind(id).run();

      await db.prepare(`
        DELETE FROM hypium_impact_events
        WHERE id = ?
      `).bind(id).run();

      return json({ success: true });
    }

    // --------------------------------------------------
    // İSTATİSTİK EKLEME / DÜZENLEME
    // --------------------------------------------------
    if (body.action === "save_stat") {
      const id = text(body.id, 100) || newId();
      const language = text(body.language, 2).toLowerCase();
      const statKey = text(body.stat_key, 100);
      const title = text(body.title, 200);

      if (!validLanguage(language)) {
        return json(
          { error: "Dil tr, en, de veya fr olmalı." },
          400
        );
      }

      if (!statKey || !title) {
        return json(
          {
            error:
              "İstatistik anahtarı ve başlığı zorunludur."
          },
          400
        );
      }

      const value = Number(body.value);

      const target =
        body.target === "" || body.target == null
          ? null
          : Number(body.target);

      if (
        !Number.isFinite(value) ||
        (target !== null && !Number.isFinite(target))
      ) {
        return json(
          { error: "İstatistik değeri geçersiz." },
          400
        );
      }

      await db.prepare(`
        INSERT INTO hypium_impact_stats
          (
            id,
            stat_key,
            value,
            target,
            unit,
            sort_order,
            is_published,
            updated_at
          )
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(id) DO UPDATE SET
          stat_key = excluded.stat_key,
          value = excluded.value,
          target = excluded.target,
          unit = excluded.unit,
          sort_order = excluded.sort_order,
          is_published = excluded.is_published,
          updated_at = CURRENT_TIMESTAMP
      `).bind(
        id,
        statKey,
        value,
        target,
        text(body.unit, 40),
        number(body.sort_order, 0),
        published(body.is_published) ? 1 : 0
      ).run();

      await db.prepare(`
        INSERT INTO hypium_impact_stat_translations
          (stat_id, language, title, description)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(stat_id, language) DO UPDATE SET
          title = excluded.title,
          description = excluded.description
      `).bind(
        id,
        language,
        title,
        text(body.description, 1000)
      ).run();

      return json({ success: true, id });
    }

    // --------------------------------------------------
    // İSTATİSTİK SİLME
    // --------------------------------------------------
    if (body.action === "delete_stat") {
      const id = text(body.id, 100);

      if (!id) {
        return json(
          { error: "İstatistik kimliği gerekli." },
          400
        );
      }

      await db.prepare(`
        DELETE FROM hypium_impact_stat_translations
        WHERE stat_id = ?
      `).bind(id).run();

      await db.prepare(`
        DELETE FROM hypium_impact_stats
        WHERE id = ?
      `).bind(id).run();

      return json({ success: true });
    }

    // --------------------------------------------------
    // HARİTA NOKTASI EKLEME / DÜZENLEME
    // --------------------------------------------------
    if (body.action === "save_map_point") {
      const id = text(body.id, 100) || newId();
      const language = text(body.language, 2).toLowerCase();
      const title = text(body.title, 200);

      const latitude = Number(body.latitude);
      const longitude = Number(body.longitude);

      if (!validLanguage(language)) {
        return json(
          { error: "Dil tr, en, de veya fr olmalı." },
          400
        );
      }

      if (!title) {
        return json(
          { error: "Harita başlığı zorunludur." },
          400
        );
      }

      if (
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90 ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        return json(
          { error: "Enlem veya boylam geçersiz." },
          400
        );
      }

      const eventId = text(body.event_id, 100) || null;

      if (eventId) {
        const event = await db.prepare(`
          SELECT id
          FROM hypium_impact_events
          WHERE id = ?
        `).bind(eventId).first();

        if (!event) {
          return json(
            { error: "Bağlı etkinlik bulunamadı." },
            400
          );
        }
      }

      await db.prepare(`
        INSERT INTO hypium_impact_map_points
          (
            id,
            latitude,
            longitude,
            event_id,
            sort_order,
            is_published
          )
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          latitude = excluded.latitude,
          longitude = excluded.longitude,
          event_id = excluded.event_id,
          sort_order = excluded.sort_order,
          is_published = excluded.is_published
      `).bind(
        id,
        latitude,
        longitude,
        eventId,
        number(body.sort_order, 0),
        published(body.is_published) ? 1 : 0
      ).run();

      await db.prepare(`
        INSERT INTO hypium_impact_map_translations
          (point_id, language, title, description)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(point_id, language) DO UPDATE SET
          title = excluded.title,
          description = excluded.description
      `).bind(
        id,
        language,
        title,
        text(body.description, 2000)
      ).run();

      return json({ success: true, id });
    }

    // --------------------------------------------------
    // HARİTA NOKTASI SİLME
    // --------------------------------------------------
    if (body.action === "delete_map_point") {
      const id = text(body.id, 100);

      if (!id) {
        return json(
          { error: "Harita noktası kimliği gerekli." },
          400
        );
      }

      await db.prepare(`
        DELETE FROM hypium_impact_map_translations
        WHERE point_id = ?
      `).bind(id).run();

      await db.prepare(`
        DELETE FROM hypium_impact_map_points
        WHERE id = ?
      `).bind(id).run();

      return json({ success: true });
    }

    return json(
      { error: "Bilinmeyen işlem." },
      400
    );
  } catch (error) {
    console.error("Impact POST error:", error);

    return json(
      {
        error:
          "İşlem kaydedilemedi. Veritabanı şemasını kontrol edin."
      },
      500
    );
  }
}
```
