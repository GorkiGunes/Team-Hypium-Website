const ALLOWED = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
  ['image/gif', 'gif']
]);
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' } });
export async function onRequestPost({ request, env }) {
  const email = (request.headers.get('Cf-Access-Authenticated-User-Email') || '').trim().toLowerCase();
  const allowedEmails = (env.ADMIN_EMAILS || '').split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
  if (!email || !allowedEmails.includes(email)) return json({ error: 'Yetkisiz erişim.' }, 403);
  if (!env.MEDIA) return json({ error: 'R2 bucket MEDIA binding ayarı bulunamadı.' }, 500);
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 8 * 1024 * 1024 + 100_000) return json({ error: 'Dosya boyutu 8 MB sınırını aşamaz.' }, 413);
  let form;
  try { form = await request.formData(); } catch { return json({ error: 'Dosya formu okunamadı.' }, 400); }
  const file = form.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') return json({ error: 'Görsel dosyası bulunamadı.' }, 400);
  if (file.size > 8 * 1024 * 1024) return json({ error: 'Dosya boyutu 8 MB sınırını aşamaz.' }, 413);
  const ext = ALLOWED.get(file.type);
  if (!ext) return json({ error: 'Yalnızca JPG, PNG, WEBP veya GIF yükleyebilirsiniz.' }, 415);
  const key = `hypium/${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${ext}`;
  await env.MEDIA.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type, cacheControl: 'public, max-age=31536000, immutable' }, customMetadata: { uploadedBy: email } });
  const base = (env.MEDIA_PUBLIC_BASE_URL || '').replace(/\/$/, '');
  if (!base) return json({ error: 'MEDIA_PUBLIC_BASE_URL ayarı eksik. R2 dosyası yüklendi ancak bağlantı üretilemedi.' }, 500);
  return json({ key, url: `${base}/${key}` }, 201);
}
