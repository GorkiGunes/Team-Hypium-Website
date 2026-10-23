
import { verifySession } from "../../_lib/auth.js";

function jsonError(message, status) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Giriş endpoint'i kendi kullanıcı adı ve şifre kontrolünü yapar.
  if (url.pathname === "/api/admin/login") {
    return next();
  }

  // Oturum yoksa veya geçersizse yönetim API'sine erişim verme.
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)hypium_session=([^;]+)/);
  const token = match?.[1];

  const valid = await verifySession(
    token,
    env.SESSION_SECRET || ""
  );

  if (!valid) {
    return jsonError("Oturum açmanız gerekiyor.", 401);
  }

  return next();
}
