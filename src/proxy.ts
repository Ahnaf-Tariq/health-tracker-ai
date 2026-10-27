import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDevelopment = process.env.NODE_ENV === "development";
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://apis.google.com${isDevelopment ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.googleusercontent.com https://firebasestorage.googleapis.com https://*.firebasestorage.app https://res.cloudinary.com",
    "font-src 'self' data:",
    `connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://*.firebasestorage.app https://api.cloudinary.com${isDevelopment ? " ws: wss:" : ""}`,
    "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");

  // Next.js reads this request header to nonce its framework and hydration scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|pulse-mark.svg|favicon.ico|manus-routes.json).*)",
  ],
};
