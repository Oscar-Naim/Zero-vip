import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';
import { SESSION_COOKIE_NAME } from '@/lib/constants';
import { checkRateLimit } from '@/lib/rate-limiter';

function getClientIp(req: NextRequest): string {
  const xForwardedFor = req.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim();
  }
  const xRealIp = req.headers.get('x-real-ip');
  if (xRealIp) return xRealIp.trim();

  const cfConnectingIp = req.headers.get('cf-connecting-ip');
  if (cfConnectingIp) return cfConnectingIp.trim();

  return '127.0.0.1';
}

function getJwtSecret(): Uint8Array {
  const masterKey =
    process.env.GATEKEEPER_MASTER_KEY ||
    process.env.JWT_SECRET ||
    'OscarNaim_LYAXIS_MasterKey_2026!';
  const encoder = new TextEncoder();
  return encoder.encode(masterKey.padEnd(32, '0').slice(0, 32));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // 1. Rate Limit Protection on Login Endpoint
  if (pathname === '/api/auth/login' && request.method === 'POST') {
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'RATE_LIMIT_EXCEEDED',
          message: `Acceso bloqueado por seguridad defensiva. Ha superado el límite de 5 intentos fallidos. Reintente en ${rateLimit.retryAfterSeconds} segundos.`,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfterSeconds),
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }
  }

  // 2. Protect Admin Frontend Pages (/admin, /admin/*) and Protected API Routes
  const isAdminPage = pathname.startsWith('/admin');
  const isProtectedApi = pathname.startsWith('/api/keys') || pathname.startsWith('/api/setup');

  if (isAdminPage || isProtectedApi) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    let validSession = false;
    if (sessionCookie) {
      try {
        const secret = getJwtSecret();
        await jose.jwtVerify(sessionCookie, secret, {
          issuer: 'lyaxis:gatekeeper',
          audience: 'lyaxis:admin',
        });
        validSession = true;
      } catch {
        validSession = false;
      }
    }

    if (!validSession) {
      if (isProtectedApi) {
        return NextResponse.json(
          {
            success: false,
            error: 'UNAUTHORIZED_FOUNDER_ONLY',
            message: 'Acceso restringido exclusivamente a Oscar Naim Ambrocio Aguirre (Fundador).',
          },
          { status: 401 }
        );
      }

      // Redirect to login page for admin UI requests
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/keys/:path*',
    '/api/setup/:path*',
    '/api/auth/login',
  ],
};
