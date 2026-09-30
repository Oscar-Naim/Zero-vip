import { NextRequest, NextResponse } from 'next/server';
import { updateAccessKey, deleteAccessKey, logAudit, getKeyById } from '@/lib/db';
import { getSession, extractClientIp } from '@/lib/session';
import { hashIp } from '@/lib/crypto';
import { TokenStatus } from '@/types';

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.authenticated) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED_FOUNDER_ONLY' },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const ip = extractClientIp(req);
  const ipHash = hashIp(ip);

  try {
    const existing = await getKeyById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'KEY_NOT_FOUND', message: 'La llave de acceso no existe.' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const updates: any = {};

    if (body.status) {
      const validStatuses: TokenStatus[] = ['active', 'claimed', 'revoked', 'expired'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: 'INVALID_STATUS', message: 'Estado no válido.' },
          { status: 400 }
        );
      }
      updates.status = body.status;
    }

    if (body.reset_uses === true) {
      updates.current_uses = 0;
      updates.status = 'active';
      updates.claimed_at = null;
    }

    if (body.notes !== undefined) {
      updates.notes = body.notes;
    }

    if (body.assigned_to_name !== undefined) {
      updates.assigned_to_name = body.assigned_to_name;
    }

    if (body.assigned_to_email !== undefined) {
      updates.assigned_to_email = body.assigned_to_email;
    }

    const updated = await updateAccessKey(id, updates);

    // Audit log
    const action = body.status === 'revoked' ? 'REVOKED' : body.reset_uses ? 'RESET' : 'VERIFIED';
    await logAudit({
      tokenId: id,
      tokenText: existing.token,
      ipHash,
      action: action as any,
      success: true,
      metadata: {
        updates,
        modified_by: 'Oscar Naim (Founder)',
      },
    });

    return NextResponse.json({
      success: true,
      key: updated,
      message: 'Llave de acceso actualizada exitosamente.',
    });
  } catch (err: any) {
    console.error('Error updating key:', err);
    return NextResponse.json(
      { success: false, error: 'UPDATE_ERROR', message: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.authenticated) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED_FOUNDER_ONLY' },
      { status: 401 }
    );
  }

  const { id } = await context.params;
  const ip = extractClientIp(req);
  const ipHash = hashIp(ip);

  try {
    const existing = await getKeyById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'KEY_NOT_FOUND', message: 'La llave de acceso no existe.' },
        { status: 404 }
      );
    }

    await deleteAccessKey(id);

    await logAudit({
      tokenId: null,
      tokenText: existing.token,
      ipHash,
      action: 'REVOKED',
      success: true,
      metadata: { deleted: true, token: existing.token },
    });

    return NextResponse.json({
      success: true,
      message: `Llave ${existing.token} eliminada de forma permanente.`,
    });
  } catch (err: any) {
    console.error('Error deleting key:', err);
    return NextResponse.json(
      { success: false, error: 'DELETE_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
