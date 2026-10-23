
const encoder = new TextEncoder();

function base64url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeBase64url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - base64.length % 4) % 4);
  const binary = atob(padded);

  return Uint8Array.from(binary, char => char.charCodeAt(0));
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );

  return new Uint8Array(
    await crypto.subtle.sign("HMAC", key, encoder.encode(value))
  );
}

export async function createSession(secret) {
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET en az 32 karakter olmalıdır.");
  }

  const payload = base64url(
    encoder.encode(JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + 8 * 60 * 60
    }))
  );

  const signature = base64url(await sign(payload, secret));

  return `${payload}.${signature}`;
}

export async function verifySession(token, secret) {
  try {
    if (!token || !secret || token.length > 2048) return false;

    const parts = token.split(".");
    if (parts.length !== 2) return false;

    const [payload, signature] = parts;
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      decodeBase64url(signature),
      encoder.encode(payload)
    );

    if (!valid) return false;

    const data = JSON.parse(
      new TextDecoder().decode(decodeBase64url(payload))
    );

    return Number.isInteger(data.exp) &&
      data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
