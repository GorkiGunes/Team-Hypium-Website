const ALLOWED_TYPES = new Set(['announcements', 'posts', 'projects', 'gallery', 'members']);
const ALLOWED_STATUSES = new Set(['draft', 'published']);
const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
const cleanText = (value, max) => typeof value === 'string' ? value.trim().slice(0, max) : '';

function authenticatedEmail(request, env) {
  // Only trust this header when Cloudflare Access is configured to protect /admin/* and /api/admin/*.
  const email = (request.headers.get('Cf-Access-Authenticated-User-Email') || '').trim().toLowerCase();
  const allowed = (env.ADMIN_EMAILS || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
  return email && allowed.includes(email) ? email : null;
}
function validatePayload(input) {
  const type = cleanText(input?.type, 40);
  const title = cleanText(input?.title, 180);
  const status = cleanText(input?.status, 20) || 'draft';
  const imageUrl = cleanText(input?.image_url, 1000);
  const sortOrder = Number(input?.sort_order ?? 0);
  if (!ALLOWED_TYPES.has(type)) throw new Error('Geçersiz içerik türü.');
  if (!title) throw new Error('Başlık zorunludur.');
  if (!ALLOWED_STATUSES.has(status)) throw new Error('Geçersiz yayın durumu.');
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 99999) throw new Error('Sıralama 0 ile 99999 arasında bir tam sayı olmalıdır.');
  if (imageUrl && !/^https:\/\//i.test(imageUrl) && !imageUrl.startsWith('/')) throw new Error('Görsel adresi HTTPS URL veya site içi yol olmalıdır.');
  return { type, title, summary: cleanText(input?.summary, 600), body: cleanText(input?.body, 20000), image_url: imageUrl, status, sort_order: sortOrder };
}

export async function onRequest({ request, env, params }) {
  const email = authenticatedEmail(request, env);
  if (!email) return json({ error: 'Yetkisiz erişim. Cloudflare Access hesabınızı ve ADMIN_EMAILS ayarını kontrol edin.' }, 403);
  if (!env.DB) return json({ error: 'D1 veritabanı DB binding ayarı bulunamadı.' }, 500);
  const segments = params.path ? (Array.isArray(params.path) ? params.path : [params.path]) : [];
  const id = segments[0] || null;
  const method = request.method.toUpperCase();
  try {
    if (method === 'GET') {
      const url = new URL(request.url);
      const type = url.searchParams.get('type');
      if (type && !ALLOWED_TYPES.has(type)) return json({ error: 'Geçersiz içerik türü.' }, 400);
      const result = type
        ? await env.DB.prepare('SELECT id, type, title, summary, body, image_url, status, sort_order, created_by, updated_by, created_at, updated_at FROM content_items WHERE type = ? ORDER BY sort_order ASC, updated_at DESC').bind(type).all()
        : await env.DB.prepare('SELECT id, type, title, summary, body, image_url, status, sort_order, created_by, updated_by, created_at, updated_at FROM content_items ORDER BY updated_at DESC LIMIT 300').all();
      return json({ items: result.results || [], userEmail: email });
    }
    if (method === 'POST') {
      if (id) return json({ error: 'Yeni kayıt için bu URL kullanılmaz.' }, 400);
      const payload = validatePayload(await request.json());
      const newId = crypto.randomUUID();
      await env.DB.prepare('INSERT INTO content_items (id, type, title, summary, body, image_url, status, sort_order, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
        .bind(newId, payload.type, payload.title, payload.summary, payload.body, payload.image_url, payload.status, payload.sort_order, email, email).run();
      return json({ id: newId }, 201);
    }
    if (method === 'PUT') {
      if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'Geçersiz kayıt kimliği.' }, 400);
      const payload = validatePayload(await request.json());
      const result = await env.DB.prepare('UPDATE content_items SET type = ?, title = ?, summary = ?, body = ?, image_url = ?, status = ?, sort_order = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .bind(payload.type, payload.title, payload.summary, payload.body, payload.image_url, payload.status, payload.sort_order, email, id).run();
      if (!result.meta?.changes) return json({ error: 'Kayıt bulunamadı.' }, 404);
      return json({ ok: true });
    }
    if (method === 'DELETE') {
      if (!id || !/^[0-9a-f-]{36}$/i.test(id)) return json({ error: 'Geçersiz kayıt kimliği.' }, 400);
      const result = await env.DB.prepare('DELETE FROM content_items WHERE id = ?').bind(id).run();
      if (!result.meta?.changes) return json({ error: 'Kayıt bulunamadı.' }, 404);
      return json({ ok: true });
    }
    return json({ error: 'Desteklenmeyen HTTP yöntemi.' }, 405);
  } catch (error) {
    if (error instanceof SyntaxError) return json({ error: 'İstek gövdesi geçerli JSON değil.' }, 400);
    if (error instanceof Error && !error.message.includes('D1')) return json({ error: error.message }, 400);
    return json({ error: 'Sunucu tarafında beklenmeyen bir hata oluştu.' }, 500);
  }
}
