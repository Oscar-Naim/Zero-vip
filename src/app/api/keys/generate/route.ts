import { NextRequest, NextResponse } from 'next/server';
import { generateUniqueKey, getMetricsSummary, logAudit } from '@/lib/db';
import { getSession, extractClientIp } from '@/lib/session';
import { hashIp } from '@/lib/crypto';
import { TokenTier } from '@/types';
import { ZERO_VIP_30_LIMIT, TIER_CONFIG } from '@/lib/constants';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.authenticated) {
    return NextResponse.json(
      { success: false, error: 'UNAUTHORIZED_FOUNDER_ONLY' },
      { status: 401 }
    );
  }

  const ip = extractClientIp(req);
  const ipHash = hashIp(ip);

  try {
    const body = await req.json();
    const count = Math.min(Math.max(parseInt(body.count || '1', 10), 1), 100);
    const tier: TokenTier = body.tier || 'early_access';
    const assignedToName = body.assigned_to_name?.trim() || null;
    const assignedToEmail = body.assigned_to_email?.trim() || null;
    const notes = body.notes?.trim() || null;
    const expiresAt = body.expires_at || null;
    const maxUses = body.max_uses ? parseInt(body.max_uses, 10) : TIER_CONFIG[tier]?.defaultMaxUses || 1;

    // Check ZERO VIP 30 milestone quota
    if (tier === 'zero_vip_30') {
      const metrics = await getMetricsSummary();
      if (metrics.zero_vip_count + count > ZERO_VIP_30_LIMIT) {
        return NextResponse.json(
          {
            success: false,
            error: 'ZERO_VIP_QUOTA_EXCEEDED',
            message: `El cupo inaugural de ZERO VIP 30 (17 de Octubre) solo admite 30 creadores. Actual: ${metrics.zero_vip_count}/30. No es posible generar ${count} adicionales.`,
            currentCount: metrics.zero_vip_count,
            maxAllowed: ZERO_VIP_30_LIMIT,
          },
          { status: 400 }
        );
      }
    }

    const createdKeys = [];

    for (let i = 0; i < count; i++) {
      const singleAssignedName = count === 1 ? assignedToName : (assignedToName ? `${assignedToName} #${i + 1}` : null);
      const key = await generateUniqueKey({
        tier,
        max_uses: maxUses,
        assigned_to_name: singleAssignedName,
        assigned_to_email: count === 1 ? assignedToEmail : null,
        notes: count > 1 ? `Generación en Lote (${i + 1}/${count})${notes ? `: ${notes}` : ''}` : notes,
        expires_at: expiresAt,
        created_by: 'Oscar Naim (Founder)',
      });
      createdKeys.push(key);
    }

    // Forensic logging
    await logAudit({
      tokenText: count === 1 ? createdKeys[0].token : `BATCH_${count}_KEYS`,
      ipHash,
      action: 'VERIFIED',
      success: true,
      metadata: {
        type: 'KEY_GENERATION',
        tier,
        count,
        founder: 'Oscar Naim Ambrocio Aguirre',
      },
    });

    return NextResponse.json({
      success: true,
      count: createdKeys.length,
      keys: createdKeys,
      message: `${createdKeys.length} llave(s) generada(s) con éxito en la bóveda de LYAXIS labs™.`,
    });
  } catch (err: any) {
    console.error('Error generating access keys:', err);
    return NextResponse.json(
      { success: false, error: 'GENERATION_ERROR', message: err.message },
      { status: 500 }
    );
  }
}
