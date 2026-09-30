interface RateLimitEntry {
  failedAttempts: number;
  firstAttemptTime: number;
  blockedUntil: number | null;
}

// In-memory sliding window rate limiter
// Survives across warm serverless invocations and handles brute force
const ipRateLimits = new Map<string, RateLimitEntry>();

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupStaleEntries() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;

  for (const [ip, entry] of ipRateLimits.entries()) {
    if (entry.blockedUntil && entry.blockedUntil < now) {
      ipRateLimits.delete(ip);
    } else if (!entry.blockedUntil && now - entry.firstAttemptTime > WINDOW_MS) {
      ipRateLimits.delete(ip);
    }
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
  failedAttempts: number;
}

export function checkRateLimit(ip: string): RateLimitResult {
  cleanupStaleEntries();

  const now = Date.now();
  const entry = ipRateLimits.get(ip);

  if (!entry) {
    return {
      allowed: true,
      remaining: MAX_FAILED_ATTEMPTS,
      retryAfterSeconds: 0,
      failedAttempts: 0,
    };
  }

  // Check if currently blocked
  if (entry.blockedUntil && entry.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((entry.blockedUntil - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
      failedAttempts: entry.failedAttempts,
    };
  }

  // Check if window has reset
  if (now - entry.firstAttemptTime > WINDOW_MS) {
    ipRateLimits.delete(ip);
    return {
      allowed: true,
      remaining: MAX_FAILED_ATTEMPTS,
      retryAfterSeconds: 0,
      failedAttempts: 0,
    };
  }

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - entry.failedAttempts);
  return {
    allowed: remaining > 0,
    remaining,
    retryAfterSeconds: 0,
    failedAttempts: entry.failedAttempts,
  };
}

export function recordFailedAttempt(ip: string): RateLimitResult {
  const now = Date.now();
  let entry = ipRateLimits.get(ip);

  if (!entry || now - entry.firstAttemptTime > WINDOW_MS) {
    entry = {
      failedAttempts: 1,
      firstAttemptTime: now,
      blockedUntil: null,
    };
  } else {
    entry.failedAttempts += 1;
  }

  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
  }

  ipRateLimits.set(ip, entry);

  const retryAfterSeconds = entry.blockedUntil
    ? Math.ceil((entry.blockedUntil - now) / 1000)
    : 0;
  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - entry.failedAttempts);

  return {
    allowed: entry.failedAttempts < MAX_FAILED_ATTEMPTS,
    remaining,
    retryAfterSeconds,
    failedAttempts: entry.failedAttempts,
  };
}

export function resetRateLimit(ip: string): void {
  ipRateLimits.delete(ip);
}
