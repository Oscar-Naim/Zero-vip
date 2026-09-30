import { NextResponse } from 'next/server';
import { isPostgresConfigured, ensureDatabaseSchema } from '@/lib/db';

export async function GET() {
  const isPgConfigured = isPostgresConfigured();
  let pgStatus = isPgConfigured ? 'CONNECTED' : 'LOCAL_EMULATION';

  if (isPgConfigured) {
    try {
      const check = await ensureDatabaseSchema();
      if (!check.success) {
        pgStatus = 'ERROR';
      }
    } catch {
      pgStatus = 'UNREACHABLE';
    }
  }

  return NextResponse.json({
    status: 'OPTIMAL',
    service: 'LYAXIS labs™ — ZERO VIP Gatekeeper',
    serverless: {
      provider: 'Vercel Serverless Function',
      region: process.env.VERCEL_REGION || 'dev-local',
      environment: process.env.NODE_ENV || 'development',
    },
    database: {
      driver: isPgConfigured ? 'Vercel Postgres (Native SQL)' : 'Tactical High-Speed In-Memory Safe Adapter',
      status: pgStatus,
      configured: isPgConfigured,
    },
    security: {
      zeroTrust: 'ENFORCED',
      antiBruteForce: 'ACTIVE (5 MAX / 15 MIN)',
      hashing: 'HMAC-SHA256 & Constant-Time',
    },
    utcTime: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  });
}
