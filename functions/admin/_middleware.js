
import { verifySession } from "../_lib/auth.js";

function unauthorized(request) {
  const url = new URL(request.url);
  const acceptsHtml = request.headers.get("Accept")?.includes("text/html");

  if (acceptsHtml) {
    return Response.redirect(new URL("/admin/login.html", url.origin), 302);
  }

  return new Response("Unauthorized", {
    status: 401,
    headers: { "Cache-Control": "no-store" }
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);

  // Giriş ekranı ve statik dosyalar bu middleware tarafından engellenmez.
  if (url.pathname === "/admin/login.html") {
    return next();
  }

  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(/(?:^|;\s*)hypium_session=([^;]+)/);
  const token = match?.[1];

  const valid = await verifySession(token, env.SESSION_SECRET || "");

  if (!valid) {
    return unauthorized(request);
  }

  return next();
}
