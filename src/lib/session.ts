import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, SESSION_DURATION_SECONDS } from './constants';
import { verifySessionJwt } from './crypto';

export async function getSession(): Promise<{ authenticated: boolean; user?: any }> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return { authenticated: false };
  }

  const payload = await verifySessionJwt(token);
  if (!payload) {
    return { authenticated: false };
  }

  return { authenticated: true, user: payload };
}

export function extractClientIp(req: Request | NextRequest): string {
  // Check Vercel and proxy headers
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

export function getSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    name: SESSION_COOKIE_NAME,
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: SESSION_DURATION_SECONDS,
  };
}
