
import { verifySession } from "../_lib/auth.js";

function unauthorized(request) {
  const url = new URL(request.url);
  const acceptsHtml =
    request.headers.get("Accept")?.includes("text/html");

  if (acceptsHtml) {
    return Response.redirect(
      new URL("/admin/login.html", url.origin),
      302
    );
  }

  return new Response("Unauthorized", {
    status: 401,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Giriş sayfasına ve URL'nin iki biçimine de izin ver.
  if (
    pathname === "/admin/login.html" ||
    pathname === "/admin/login"
  ) {
    return next();
  }

  // Yönetim panelinin statik dosyalarının yüklenmesine izin ver.
  if (
    pathname.startsWith("/admin/") &&
    (
      pathname.endsWith(".css") ||
      pathname.endsWith(".js") ||
      pathname.endsWith(".png") ||
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".svg") ||
      pathname.endsWith(".webp") ||
      pathname.endsWith(".ico") ||
      pathname.endsWith(".woff") ||
      pathname.endsWith(".woff2")
    )
  ) {
    return next();
  }

  // Diğer yönetim sayfaları için oturumu doğrula.
  const cookieHeader = request.headers.get("Cookie") || "";
  const match = cookieHeader.match(
    /(?:^|;\s*)hypium_session=([^;]+)/
  );
  const token = match?.[1];

  const valid = await verifySession(
    token,
    env.SESSION_SECRET || ""
  );

  if (!valid) {
    return unauthorized(request);
  }

  return next();
}

