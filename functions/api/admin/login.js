
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    return json({ error: "Giriş sistemi henüz yapılandırılmadı." }, 503);
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

  // Oturum imzalama ve güvenli cookie,
  // ortak kimlik doğrulama modülü eklendiğinde tamamlanacak.
  return json({
    error: "Oturum güvenliği henüz tamamlanmadı. Lütfen sonraki kurulumu bekleyin."
  }, 501);
}
