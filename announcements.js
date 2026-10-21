const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'public, max-age=30, s-maxage=30',
  'x-content-type-options': 'nosniff'
};
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

// Public read-only endpoint. Only published announcements are exposed.
export async function onRequest({ request, env }) {
  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405);
  if (!env.DB) return json({ error: 'D1 binding DB is missing' }, 500);
  try {
    const result = await env.DB.prepare(
      "SELECT id, title, summary, body, image_url, updated_at FROM content_items WHERE type = 'announcements' AND status = 'published' ORDER BY sort_order ASC, updated_at DESC LIMIT 20"
    ).all();
    return json({ announcements: result.results || [] });
  } catch {
    return json({ error: 'Unable to load announcements' }, 500);
  }
}
