
import { createSession } from "../../../_lib/auth.js";

function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...extraHeaders
    }
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json({ error: "Giriş sistemi yapılandırması eksik." }, 503);
  }

  if (new URL(request.url).protocol !== "https:") {
    return json({ error: "Güvenli HTTPS bağlantısı gerekli." }, 403);
  }

  if (request.headers.get("Origin") !== new URL(request.url).origin) {
    return json({ error: "İstek reddedildi." }, 403);
  }

  let data;

  try {
    data = await request.json();
  } catch {
    return json({ error: "Geçersiz istek." }, 400);
  }

  const username = String(data.username || "");
  const password = String(data.password || "");

  if (
    username.length > 100 ||
    password.length > 1024 ||
    username !== env.ADMIN_USERNAME ||
    password !== env.ADMIN_PASSWORD
  ) {
    return json({ error: "Kullanıcı adı veya şifre hatalı." }, 401);
  }

  try {
    const token = await createSession(env.SESSION_SECRET);

    return json(
      { success: true },
      200,
      {
        "Set-Cookie":
          `hypium_session=${token}; Path=/; Max-Age=28800; HttpOnly; Secure; SameSite=Strict`
      }
    );
  } catch {
    return json({ error: "Oturum oluşturulamadı." }, 500);
  }
}

