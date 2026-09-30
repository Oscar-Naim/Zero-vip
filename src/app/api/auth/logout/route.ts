import { NextResponse } from 'next/server';
import { SESSION_COOKIE_NAME } from '@/lib/constants';

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: 'Sesión destruida de forma segura.',
  });

  response.cookies.set(SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 0,
  });

  return response;
}
