import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { isPostgresConfigured } from '@/lib/db';

export async function GET() {
  const session = await getSession();
  return NextResponse.json({
    authenticated: session.authenticated,
    user: session.user || null,
    isPostgresConfigured: isPostgresConfigured(),
  });
}
