import { NextRequest, NextResponse } from 'next/server';
import { getAccessKeys, getMetricsSummary, getAuditLogs } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.authenticated) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED_FOUNDER_ONLY' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get('search') || undefined;
  const tier = searchParams.get('tier') || undefined;
  const status = searchParams.get('status') || undefined;
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);
  const includeAudit = searchParams.get('include_audit') === 'true';

  try {
    const { keys, total } = await getAccessKeys({ search, tier, status, page, limit });
    const metrics = await getMetricsSummary();
    const auditLogs = includeAudit ? await getAuditLogs(25) : [];

    return NextResponse.json({
      success: true,
      keys,
      total,
      page,
      limit,
      metrics,
      auditLogs,
    });
  } catch (err: any) {
    console.error('Error fetching access keys:', err);
    return NextResponse.json(
      { success: false, error: 'DB_FETCH_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
