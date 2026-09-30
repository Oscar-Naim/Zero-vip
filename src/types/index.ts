export type TokenTier =
  | 'zero_vip_30'
  | 'early_access'
  | 'developer'
  | 'partner'
  | 'internal_core';

export type TokenStatus = 'active' | 'claimed' | 'revoked' | 'expired';

export interface AccessKey {
  id: string;
  token: string; // LYX-XXX-XXX
  tier: TokenTier;
  status: TokenStatus;
  max_uses: number;
  current_uses: number;
  assigned_to_name: string | null;
  assigned_to_email: string | null;
  notes: string | null;
  created_at: string;
  claimed_at: string | null;
  expires_at: string | null;
  created_by: string;
}

export type AuditAction = 'VERIFIED' | 'CLAIMED' | 'REVOKED' | 'RESET' | 'FAILED';

export interface TokenAuditLog {
  id: string;
  token_id: string | null;
  token_text: string;
  ip_hash: string;
  action: AuditAction;
  success: boolean;
  metadata: Record<string, any> | null;
  created_at: string;
}

export interface MetricSummary {
  total_keys: number;
  active_keys: number;
  claimed_keys: number;
  revoked_keys: number;
  expired_keys: number;
  zero_vip_count: number;
  zero_vip_max: number;
  total_uses: number;
}

export interface VerifyTokenRequest {
  token: string;
}

export interface VerifyTokenResponseSuccess {
  valid: true;
  tier: TokenTier;
  assigned_to: string | null;
  assigned_to_email: string | null;
  current_uses: number;
  max_uses: number;
  status: TokenStatus;
  timestamp: string;
}

export interface VerifyTokenResponseFailure {
  valid: false;
  reason:
    | 'TOKEN_INVALID_OR_NOT_FOUND'
    | 'TOKEN_REVOKED'
    | 'TOKEN_EXPIRED'
    | 'TOKEN_EXHAUSTED'
    | 'UNAUTHORIZED_SERVICE'
    | 'INTERNAL_ERROR';
  message: string;
}

export type VerifyTokenResponse =
  | VerifyTokenResponseSuccess
  | VerifyTokenResponseFailure;
