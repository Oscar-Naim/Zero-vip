import { NextRequest, NextResponse } from 'next/server';
import { atomicVerifyAndClaim } from '@/lib/db';
import { extractClientIp } from '@/lib/session';
import { hashIp, constantTimeCompare } from '@/lib/crypto';
import { VerifyTokenResponse } from '@/types';

// Regex to validate token syntax before hitting DB
const TOKEN_FORMAT_REGEX = /^LYX-[A-Z0-9]{3}-[A-Z0-9]{3}$/;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-lyaxis-service-key, x-lyaxis-client',
};

export async function POST(req: NextRequest) {
  const ip = extractClientIp(req);
  const ipHash = hashIp(ip);

  // 1. Optional System Service Key Validation (for LYAXIS IA or backend microservices)
  const systemServiceKey = process.env.LYAXIS_SERVICE_KEY;
  if (systemServiceKey) {
    const providedServiceKey = req.headers.get('x-lyaxis-service-key');
    if (!providedServiceKey || !constantTimeCompare(providedServiceKey, systemServiceKey)) {
      return NextResponse.json<VerifyTokenResponse>(
        {
          valid: false,
          reason: 'UNAUTHORIZED_SERVICE',
          message: 'Firma de servicio x-lyaxis-service-key ausente o no autorizada.',
        },
        { status: 403, headers: corsHeaders }
      );
    }
  }

  try {
    const body = await req.json();
    const token = body?.token?.trim()?.toUpperCase();

    if (!token || !TOKEN_FORMAT_REGEX.test(token)) {
      return NextResponse.json<VerifyTokenResponse>(
        {
          valid: false,
          reason: 'TOKEN_INVALID_OR_NOT_FOUND',
          message: 'Formato de token no válido. Debe seguir la estructura LYX-XXX-XXX.',
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const userAgent = req.headers.get('user-agent') || 'unknown';
    const metadata = {
      userAgent,
      clientType: req.headers.get('x-lyaxis-client') || 'LYAXIS_IA_CONSUMER',
      timestamp: new Date().toISOString(),
    };

    // 2. Perform Atomic SQL Verify & Claim
    const result = await atomicVerifyAndClaim(token, ipHash, metadata);

    if (!result.success) {
      const reasonMessages: Record<string, string> = {
        TOKEN_INVALID_OR_NOT_FOUND: 'La llave de acceso no existe en los registros de LYAXIS.',
        TOKEN_REVOKED: 'La llave de acceso ha sido revocada por el Fundador.',
        TOKEN_EXPIRED: 'La llave de acceso ha expirado.',
        TOKEN_EXHAUSTED: 'La llave de acceso ha alcanzado el límite máximo de activaciones.',
      };

      return NextResponse.json<VerifyTokenResponse>(
        {
          valid: false,
          reason: (result.reason as any) || 'TOKEN_INVALID_OR_NOT_FOUND',
          message: reasonMessages[result.reason] || 'Token no válido o agotado.',
        },
        { status: 401, headers: corsHeaders }
      );
    }

    const { key } = result;

    return NextResponse.json<VerifyTokenResponse>(
      {
        valid: true,
        tier: key.tier,
        assigned_to: key.assigned_to_name,
        assigned_to_email: key.assigned_to_email,
        current_uses: key.current_uses,
        max_uses: key.max_uses,
        status: key.status,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('Fatal error during token verification:', err);
    return NextResponse.json<VerifyTokenResponse>(
      {
        valid: false,
        reason: 'INTERNAL_ERROR',
        message: 'Error defensivo interno al verificar el token.',
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// OPTIONS for CORS preflight in case external clients call this
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}
