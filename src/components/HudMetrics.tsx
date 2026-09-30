'use client';

import React from 'react';
import { MetricSummary } from '@/types';
import { KeyRound, Award, CheckCircle2, Ban, Flame, Sparkles } from 'lucide-react';
import { ZERO_VIP_30_LIMIT } from '@/lib/constants';

interface HudMetricsProps {
  metrics: MetricSummary | null;
  loading: boolean;
}

export default function HudMetrics({ metrics, loading }: HudMetricsProps) {
  const zeroVipCount = metrics?.zero_vip_count || 0;
  const zeroVipPercentage = Math.min(Math.round((zeroVipCount / ZERO_VIP_30_LIMIT) * 100), 100);
  const remainingZeroVip = Math.max(0, ZERO_VIP_30_LIMIT - zeroVipCount);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. ZERO VIP 30 Inaugural Card (High Priority / Hero) */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#0c1629] to-[#080d1a] border border-cyan-500/40 p-4 shadow-lg shadow-cyan-950/30 group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
        
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-cyan-950/50 border border-cyan-500/30 text-cyan-400">
              <Award className="w-5 h-5 text-cyan-300 animate-pulse" />
            </div>
            <div>
              <div className="text-[11px] font-mono tracking-wider uppercase text-cyan-400 font-bold flex items-center gap-1">
                <span>ZERO VIP 30</span>
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              </div>
              <div className="text-[10px] text-slate-400">Hito Creadores 17 Oct</div>
            </div>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded">
            {remainingZeroVip} Libres
          </span>
        </div>

        <div className="my-3">
          <div className="flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
              {loading ? '...' : zeroVipCount}
              <span className="text-sm font-normal text-cyan-400/80 ml-1">/ 30</span>
            </span>
            <span className="text-xs font-mono font-semibold text-cyan-400">
              {zeroVipPercentage}%
            </span>
          </div>

          {/* Reactive Cyan Glowing Progress Bar */}
          <div className="w-full bg-slate-900 h-2 rounded-full mt-2 overflow-hidden border border-cyan-900/60 p-[1px]">
            <div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-[#00D9FF] rounded-full transition-all duration-700 shadow-sm shadow-cyan-400"
              style={{ width: `${zeroVipPercentage}%` }}
            />
          </div>
        </div>

        <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>Cupo inaugural blindado para creadores clave.</span>
        </p>
      </div>

      {/* 2. Total Tokens Generated */}
      <div className="rounded-xl bg-[#090d16] border border-[#172338] hover:border-[#22395d] p-4 transition-all group">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#0c1322] border border-[#172338] text-blue-400 group-hover:text-blue-300">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Total Bóveda
              </div>
              <div className="text-[10px] text-slate-500">Llaves emitidas</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            Escalable
          </span>
        </div>

        <div className="mt-2">
          <div className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
            {loading ? '...' : (metrics?.total_keys || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span className="text-emerald-400 font-mono font-semibold">
              {loading ? '...' : metrics?.active_keys || 0} Activas
            </span>
            <span>•</span>
            <span className="text-slate-400 font-mono">
              {loading ? '...' : metrics?.total_uses || 0} Activaciones
            </span>
          </div>
        </div>
      </div>

      {/* 3. Reclamadas / Canjeadas */}
      <div className="rounded-xl bg-[#090d16] border border-[#172338] hover:border-[#22395d] p-4 transition-all group">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#0c1322] border border-[#172338] text-purple-400 group-hover:text-purple-300">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Reclamadas
              </div>
              <div className="text-[10px] text-slate-500">Tokens consumidos</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Verificadas
          </span>
        </div>

        <div className="mt-2">
          <div className="text-2xl sm:text-3xl font-mono font-bold text-purple-300 tracking-tight">
            {loading ? '...' : (metrics?.claimed_keys || 0).toLocaleString()}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span className="text-purple-400 font-mono">
              {metrics && metrics.total_keys > 0
                ? Math.round((metrics.claimed_keys / metrics.total_keys) * 100)
                : 0}
              % de conversión
            </span>
          </div>
        </div>
      </div>

      {/* 4. Revocadas / Expiradas */}
      <div className="rounded-xl bg-[#090d16] border border-[#172338] hover:border-[#22395d] p-4 transition-all group">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#0c1322] border border-[#172338] text-rose-400 group-hover:text-rose-300">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Revocadas / Inactivas
              </div>
              <div className="text-[10px] text-slate-500">Bloqueadas o vencidas</div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Seguridad
          </span>
        </div>

        <div className="mt-2">
          <div className="text-2xl sm:text-3xl font-mono font-bold text-rose-400 tracking-tight">
            {loading ? '...' : ((metrics?.revoked_keys || 0) + (metrics?.expired_keys || 0)).toLocaleString()}
          </div>
          <div className="flex items-center gap-2 mt-2 text-[11px] text-slate-400">
            <span className="text-rose-400 font-mono">
              {loading ? '...' : metrics?.revoked_keys || 0} Revocadas
            </span>
            <span>•</span>
            <span className="text-amber-400 font-mono">
              {loading ? '...' : metrics?.expired_keys || 0} Expiradas
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
