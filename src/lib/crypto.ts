import crypto from 'crypto';
import * as jose from 'jose';
import { SAFE_ALPHABET, SESSION_DURATION_SECONDS } from './constants';

/**
 * Defensive Constant-Time String Comparison
 * Mitigates side-channel timing attacks by hashing both strings with SHA-256
 * into uniform 32-byte buffers before executing timingSafeEqual.
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (!a || !b) return false;
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Generates an access token with format: LYX-XXX-XXX
 * Cryptographically secure randomness using Node.js crypto.randomBytes.
 * Alphabet: 32 characters (no 0/O, no 1/I)
 */
export function generateLyaxisToken(): string {
  const bytes = crypto.randomBytes(6);
  const alphabetLength = SAFE_ALPHABET.length; // 32

  let part1 = '';
  let part2 = '';

  for (let i = 0; i < 3; i++) {
    part1 += SAFE_ALPHABET[bytes[i] % alphabetLength];
  }
  for (let i = 3; i < 6; i++) {
    part2 += SAFE_ALPHABET[bytes[i] % alphabetLength];
  }

  return `LYX-${part1}-${part2}`;
}

/**
 * Anonymizes client IP address using SHA-256 with a salt
 * Complies with strict privacy & security audit guidelines.
 */
export function hashIp(ip: string): string {
  const salt = process.env.GATEKEEPER_IP_SALT || 'lyaxis_ip_salt_2026';
  return crypto
    .createHash('sha256')
    .update(`${ip}:${salt}`)
    .digest('hex');
}

/**
 * Resolves or derives the secret key for signing JWT sessions.
 */
function getJwtSecretKey(): Uint8Array {
  const masterKey =
    process.env.GATEKEEPER_MASTER_KEY ||
    process.env.JWT_SECRET ||
    'OscarNaim_LYAXIS_MasterKey_2026!';
  const encoder = new TextEncoder();
  return encoder.encode(masterKey.padEnd(32, '0').slice(0, 32));
}

/**
 * Signs a military-grade JWT session using HMAC-SHA256 (jose)
 */
export async function signSessionJwt(payload: Record<string, any> = {}): Promise<string> {
  const secret = getJwtSecretKey();
  return await new jose.SignJWT({
    role: 'founder',
    user: 'Oscar Naim Ambrocio Aguirre',
    ...payload,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setIssuer('lyaxis:gatekeeper')
    .setAudience('lyaxis:admin')
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

/**
 * Verifies and decodes a JWT session
 */
export async function verifySessionJwt(token: string): Promise<jose.JWTPayload | null> {
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jose.jwtVerify(token, secret, {
      issuer: 'lyaxis:gatekeeper',
      audience: 'lyaxis:admin',
    });
    return payload;
  } catch {
    return null;
  }
}
