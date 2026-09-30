'use client';

import React, { useEffect, useState } from 'react';
import {
  Shield,
  Server,
  Database,
  Clock,
  LogOut,
  Volume2,
  VolumeX,
  Terminal,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Cpu,
} from 'lucide-react';
import { FOUNDER_NAME, FOUNDER_TITLE } from '@/lib/constants';
import { toggleSound, isSoundMuted, playCyberBeep } from '@/lib/sound';

interface TelemetryBarProps {
  isPostgresConfigured: boolean;
  onOpenSandbox: () => void;
  onOpenAudit: () => void;
  onOpenGenerator: () => void;
}

export default function TelemetryBar({
  isPostgresConfigured,
  onOpenSandbox,
  onOpenAudit,
  onOpenGenerator,
}: TelemetryBarProps) {
  const [utcTime, setUtcTime] = useState<string>('');
  const [muted, setMuted] = useState<boolean>(false);
  const [loggingOut, setLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(
        now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleSound = () => {
    const unmuted = toggleSound();
    setMuted(!unmuted);
    if (unmuted) {
      playCyberBeep(700, 'sine', 0.05);
    }
  };

  const handleLogout = async () => {
    playCyberBeep(300, 'sine', 0.1);
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-[#172338] bg-[#050505]/90 backdrop-blur-md">
      {/* Top micro-line indicator */}
      <div className="h-[2px] w-full bg-gradient-to-r from-[#2563FF] via-[#00D9FF] to-[#7C3AED]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Brand & Founder Identity */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-[#0c1322] border border-[#22395d] shadow-inner group">
            <Shield className="w-5 h-5 text-[#00D9FF] group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00D9FF] rounded-full animate-ping opacity-75" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00D9FF] rounded-full" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold tracking-wider text-sm sm:text-base text-white">
                LYAXIS labs<span className="text-[#00D9FF]">™</span>
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono tracking-widest uppercase bg-[#2563FF]/20 text-[#00D9FF] border border-[#2563FF]/40 rounded">
                GATEKEEPER v2.5
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="font-medium text-slate-200">{FOUNDER_NAME}</span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] text-[#00D9FF]/90 font-mono">{FOUNDER_TITLE}</span>
            </div>
          </div>
        </div>

        {/* Center: Live Telemetry Status Pills */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Vercel Status */}
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#090d16] border border-[#172338] text-[11px] font-mono text-slate-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <Server className="w-3.5 h-3.5 text-slate-400" />
            <span>VERCEL SERVERLESS ONLINE</span>
          </div>

          {/* Database Status */}
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded border text-[11px] font-mono ${
              isPostgresConfigured
                ? 'bg-[#090d16] border-[#172338] text-slate-300'
                : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#00D9FF]" />
            <span>
              {isPostgresConfigured ? 'POSTGRES ACTIVE' : 'SAFE LOCAL ADAPTER'}
            </span>
          </div>

          {/* UTC Clock */}
          <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#090d16] border border-[#172338] text-[11px] font-mono text-cyan-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>{utcTime || 'SYNCHRONIZING...'}</span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sound FX Toggle */}
          <button
            onClick={handleToggleSound}
            title={muted ? 'Activar sonido táctico' : 'Silenciar sonido táctico'}
            className="p-2 rounded-lg bg-[#0c1322] border border-[#172338] text-slate-400 hover:text-cyan-400 hover:border-[#22395d] transition-all"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Sandbox Validator Simulator */}
          <button
            onClick={() => {
              playCyberBeep(750, 'sine', 0.05);
              onOpenSandbox();
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c1322] border border-[#22395d] hover:border-cyan-500/50 text-xs font-mono text-slate-200 hover:text-cyan-300 transition-all shadow-sm"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>IA Sandbox</span>
          </button>

          {/* Forensic Audit Log */}
          <button
            onClick={() => {
              playCyberBeep(650, 'sine', 0.05);
              onOpenAudit();
            }}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0c1322] border border-[#172338] hover:border-[#7C3AED]/50 text-xs font-mono text-slate-300 hover:text-purple-300 transition-all"
          >
            <Activity className="w-3.5 h-3.5 text-purple-400" />
            <span>Auditoría</span>
          </button>

          {/* Generate Key Button */}
          <button
            onClick={() => {
              playCyberBeep(900, 'sine', 0.06);
              onOpenGenerator();
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#2563FF] to-[#00D9FF] hover:from-[#1d4ed8] hover:to-[#0284c7] text-white text-xs font-mono font-semibold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>+ Emitir Llave</span>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            title="Cerrar Sesión Segura"
            className="p-2 rounded-lg bg-[#0c1322] border border-[#172338] text-slate-400 hover:text-rose-400 hover:border-rose-900/50 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
