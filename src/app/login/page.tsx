'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Shield,
  Key,
  Terminal,
  AlertTriangle,
  Fingerprint,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import CyberBackground from '@/components/CyberBackground';
import { FOUNDER_NAME, FOUNDER_TITLE } from '@/lib/constants';
import { playCyberBeep, playSuccessChime, playAlertWarning } from '@/lib/sound';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/admin';

  const [masterKey, setMasterKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockedCountdown, setLockedCountdown] = useState<number | null>(null);
  const [scanActive, setScanActive] = useState(false);

  useEffect(() => {
    // Check if already authenticated
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          router.replace(redirectUrl);
        }
      })
      .catch(() => {});
  }, [router, redirectUrl]);

  useEffect(() => {
    let timer: any;
    if (lockedCountdown && lockedCountdown > 0) {
      timer = setInterval(() => {
        setLockedCountdown((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lockedCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKey.trim() || loading || lockedCountdown) return;

    setError(null);
    setLoading(true);
    setScanActive(true);
    playCyberBeep(700, 'sine', 0.1);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ masterKey }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setLockedCountdown(data.retryAfterSeconds || 900);
        setError(data.message || 'Bloqueo por defensa perimetral.');
        playAlertWarning();
        return;
      }

      if (!res.ok || !data.success) {
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        setError(data.message || 'Acceso Denegado.');
        playAlertWarning();
        return;
      }

      // Success
      playSuccessChime();
      setTimeout(() => {
        router.replace(redirectUrl);
      }, 400);
    } catch (err: any) {
      setError(err.message || 'Fallo defensivo de comunicación.');
      playAlertWarning();
    } finally {
      setLoading(false);
      setScanActive(false);
    }
  };

  return (
    <div className="relative rounded-2xl bg-[#090d16]/95 border border-[#22395d] p-6 sm:p-8 shadow-2xl shadow-cyan-950/50 backdrop-blur-xl">
      {/* Top Decorative Cyber Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2563FF] via-[#00D9FF] to-[#7C3AED] rounded-t-2xl" />

      {/* Biometric Shield Icon */}
      <div className="flex flex-col items-center text-center mb-6">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-[#050505] border border-cyan-500/40 shadow-inner mb-3 group">
          <Fingerprint
            className={`w-9 h-9 text-cyan-400 transition-all duration-500 ${
              scanActive ? 'scale-110 text-cyan-300 animate-pulse' : 'group-hover:scale-105'
            }`}
          />
          <div className="absolute inset-0 rounded-2xl border border-cyan-400/20 animate-ping opacity-40 pointer-events-none" />
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono font-bold tracking-widest uppercase text-cyan-400">
          <Terminal className="w-3.5 h-3.5" />
          <span>TERMINAL BIOMÉTRICA DE ACCESO</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-mono font-black tracking-tight text-white mt-1">
          ZERO VIP Gatekeeper
        </h1>

        <div className="mt-2 px-3 py-1 rounded-full bg-[#050505] border border-[#172338] text-[11px] text-slate-400 font-mono">
          <span className="text-slate-200 font-medium">{FOUNDER_NAME}</span>
          <span className="mx-1.5 text-slate-600">•</span>
          <span className="text-cyan-400">{FOUNDER_TITLE}</span>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mb-5 p-3 rounded-xl bg-[#050505] border border-[#172338] text-[11px] font-mono text-slate-400 flex items-start gap-2.5">
        <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span>Acceso de Alta Seguridad Blindado. Comparación en tiempo constante y bloqueo tras 5 intentos fallidos.</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Llave Maestra del Fundador</span>
            <span className="text-[10px] text-cyan-400 font-semibold">GATEKEEPER_MASTER_KEY</span>
          </label>

          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              <Key className="w-4 h-4 text-cyan-400" />
            </div>
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="Introduce la Master Key..."
              value={masterKey}
              onChange={(e) => setMasterKey(e.target.value)}
              disabled={loading || Boolean(lockedCountdown)}
              className="w-full pl-10 pr-10 py-3 text-sm font-mono rounded-xl bg-[#050505] border border-[#172338] focus:border-cyan-400 focus:outline-none text-slate-100 placeholder:text-slate-600 transition-all shadow-inner"
              required
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-xs font-mono text-rose-300 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div>
              <div>{error}</div>
              {remainingAttempts !== null && remainingAttempts > 0 && (
                <div className="mt-1 text-[11px] text-rose-400 font-bold">
                  Intentos restantes antes de bloqueo: {remainingAttempts} / 5
                </div>
              )}
              {lockedCountdown !== null && (
                <div className="mt-1 text-[11px] text-amber-400 font-bold">
                  Desbloqueo en: {Math.floor(lockedCountdown / 60)}m {lockedCountdown % 60}s
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !masterKey.trim() || Boolean(lockedCountdown)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#2563FF] via-[#00D9FF] to-[#2563FF] bg-[length:200%_auto] hover:bg-right transition-all duration-500 text-white font-mono font-bold text-xs sm:text-sm tracking-wider uppercase disabled:opacity-40 shadow-lg shadow-cyan-500/25"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Validando Credenciales Criptográficas...</span>
            </>
          ) : (
            <>
              <span>Desbloquear Bóveda</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Footer Note */}
      <div className="mt-6 pt-4 border-t border-[#172338]/60 text-center">
        <p className="text-[10px] font-mono text-slate-500">
          LYAXIS labs™ — Zero-Trust Autonomous Architecture
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 selection:bg-cyan-500 selection:text-black">
      <CyberBackground />
      <div className="relative z-10 w-full max-w-md">
        <Suspense
          fallback={
            <div className="p-8 rounded-2xl bg-[#090d16] border border-[#22395d] text-center font-mono text-cyan-400 text-sm">
              Iniciando terminal segura...
            </div>
          }
        >
          <LoginFormContent />
        </Suspense>
      </div>
    </div>
  );
}
