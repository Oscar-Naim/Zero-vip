import { NextResponse } from 'next/server';
import { ensureDatabaseSchema } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST() {
  const session = await getSession();
  if (!session.authenticated) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED_FOUNDER_ONLY' },
      { status: 401 }
    );
  }

  try {
    const result = await ensureDatabaseSchema();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: 'MIGRATION_FAILED', message: err.message },
      { status: 500 }
    );
  }
}
