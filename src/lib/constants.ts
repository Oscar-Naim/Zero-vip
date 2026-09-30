import { TokenTier } from '@/types';

// Alphabet strictly excluding confusing characters 0/O and 1/I
// 32 characters total (perfect 5-bit entropy)
export const SAFE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export const SESSION_COOKIE_NAME = 'lyaxis_gatekeeper_session';
export const SESSION_DURATION_SECONDS = 7200; // 2 hours

export const FOUNDER_NAME = 'Oscar Naim Ambrocio Aguirre';
export const FOUNDER_TITLE = 'Fundador de LYAXIS labs™';
export const SYSTEM_CODENAME = 'LYAXIS labs™ — ZERO VIP Gatekeeper (All-in-One Vercel)';

export const TIER_CONFIG: Record<
  TokenTier,
  { label: string; badgeColor: string; description: string; defaultMaxUses: number }
> = {
  zero_vip_30: {
    label: 'ZERO VIP 30 (Inaugural Oct 17)',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    description: 'Hito inaugural exclusivo para los 30 creadores fundadores del 17 de octubre',
    defaultMaxUses: 1,
  },
  early_access: {
    label: 'Early Access Pioneer',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    description: 'Acceso anticipado a módulos experimentales de LYAXIS',
    defaultMaxUses: 1,
  },
  developer: {
    label: 'Developer & API Integration',
    badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    description: 'Acceso para ingenieros con cuota extendida de consumo',
    defaultMaxUses: 5,
  },
  partner: {
    label: 'Strategic Partner',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    description: 'Aliados institucionales y corporativos de LYAXIS labs™',
    defaultMaxUses: 10,
  },
  internal_core: {
    label: 'LYAXIS Internal Core',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    description: 'Acceso ilimitado para el equipo de desarrollo de LYAXIS',
    defaultMaxUses: 9999,
  },
};

export const ZERO_VIP_30_LIMIT = 30;
