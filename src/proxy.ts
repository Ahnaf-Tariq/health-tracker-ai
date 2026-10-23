import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const isDevelopment = process.env.NODE_ENV === 'development';
  const policy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'${isDevelopment ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self'${isDevelopment ? ' ws: wss:' : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  // Next.js reads this request header to nonce its framework and hydration scripts.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', policy);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|pulse-mark.svg|favicon.ico|manus-routes.json).*)'],
};
