import { NextRequest, NextResponse } from 'next/server';
import { constantTimeCompare, signSessionJwt } from '@/lib/crypto';
import { checkRateLimit, recordFailedAttempt, resetRateLimit } from '@/lib/rate-limiter';
import { extractClientIp, getSessionCookieOptions } from '@/lib/session';

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req);

  // Check rate limit status
  const currentLimit = checkRateLimit(ip);
  if (!currentLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Acceso temporalmente bloqueado por múltiples intentos no autorizados. Reintente en ${currentLimit.retryAfterSeconds} segundos.`,
        retryAfterSeconds: currentLimit.retryAfterSeconds,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const { masterKey } = body;

    if (!masterKey || typeof masterKey !== 'string') {
      const record = recordFailedAttempt(ip);
      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'Se requiere la Llave Maestra del Fundador.',
          remainingAttempts: record.remaining,
        },
        { status: 400 }
      );
    }

    const expectedKey =
      process.env.GATEKEEPER_MASTER_KEY || 'OscarNaim_LYAXIS_MasterKey_2026!';
    const isValid = constantTimeCompare(masterKey, expectedKey);

    if (!isValid) {
      const record = recordFailedAttempt(ip);
      return NextResponse.json(
        {
          success: false,
          error: 'ACCESS_DENIED',
          message: 'Llave Maestra incorrecta. Intento registrado en la auditoría de seguridad.',
          remainingAttempts: record.remaining,
          retryAfterSeconds: record.retryAfterSeconds,
        },
        { status: 401 }
      );
    }

    // Success: Clear failed attempts for this IP
    resetRateLimit(ip);

    // Issue JWT session
    const jwt = await signSessionJwt({
      founder: 'Oscar Naim Ambrocio Aguirre',
      title: 'Fundador de LYAXIS labs™',
      ip,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Acceso concedido. Bienvenido, Fundador Oscar Naim.',
      founder: 'Oscar Naim Ambrocio Aguirre',
      role: 'Supreme Gatekeeper',
    });

    const cookieOptions = getSessionCookieOptions();
    response.cookies.set(cookieOptions.name, jwt, cookieOptions);

    return response;
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: 'SERVER_ERROR',
        message: 'Fallo al procesar autenticación.',
      },
      { status: 500 }
    );
  }
}
