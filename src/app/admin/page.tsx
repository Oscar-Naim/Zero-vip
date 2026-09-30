'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import CyberBackground from '@/components/CyberBackground';
import TelemetryBar from '@/components/TelemetryBar';
import HudMetrics from '@/components/HudMetrics';
import TacticalDataGrid from '@/components/TacticalDataGrid';
import TokenGeneratorModal from '@/components/TokenGeneratorModal';
import VerifySandboxModal from '@/components/VerifySandboxModal';
import AuditLogDrawer from '@/components/AuditLogDrawer';
import { AccessKey, MetricSummary } from '@/types';
import { Database, Sparkles, AlertCircle, RefreshCw, Cpu } from 'lucide-react';
import { playCyberBeep, playSuccessChime } from '@/lib/sound';

export default function AdminDashboardPage() {
  const router = useRouter();

  // State
  const [keys, setKeys] = useState<AccessKey[]>([]);
  const [metrics, setMetrics] = useState<MetricSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPostgresConfigured, setIsPostgresConfigured] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals & Drawers
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isSandboxOpen, setIsSandboxOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [selectedKeyForAudit, setSelectedKeyForAudit] = useState<AccessKey | null>(null);
  const [sandboxInitialToken, setSandboxInitialToken] = useState('');

  // Fetch Session & Data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();

      if (!sessionData.authenticated) {
        router.replace('/login');
        return;
      }

      setIsPostgresConfigured(sessionData.isPostgresConfigured);

      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (selectedTier !== 'all') params.set('tier', selectedTier);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);

      const keysRes = await fetch(`/api/keys?${params.toString()}`);
      if (keysRes.ok) {
        const data = await keysRes.json();
        setKeys(data.keys || []);
        setMetrics(data.metrics || null);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, [router, searchQuery, selectedTier, selectedStatus]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInspectToken = (key: AccessKey) => {
    setSelectedKeyForAudit(key);
    setIsAuditOpen(true);
    playCyberBeep(700, 'sine', 0.05);
  };

  const handleOpenSandboxWithToken = (token: string) => {
    setSandboxInitialToken(token);
    setIsSandboxOpen(true);
  };

  const handleRunMigration = async () => {
    playCyberBeep(800, 'triangle', 0.1);
    try {
      const res = await fetch('/api/setup/migrate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        playSuccessChime();
        alert(`Migración Vercel Postgres: ${data.message}`);
        fetchData();
      } else {
        alert(`Error en migración: ${data.message}`);
      }
    } catch (err: any) {
      alert(`Error al ejecutar migración: ${err.message}`);
    }
  };

  return (
    <div className="relative min-h-screen text-slate-100 flex flex-col">
      <CyberBackground />

      {/* Top Telemetry Bar */}
      <TelemetryBar
        isPostgresConfigured={isPostgresConfigured}
        onOpenSandbox={() => {
          setSandboxInitialToken('');
          setIsSandboxOpen(true);
        }}
        onOpenAudit={() => {
          setSelectedKeyForAudit(null);
          setIsAuditOpen(true);
        }}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Banner if in Local Safe Emulation Mode */}
        {!isPostgresConfigured && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-950/40 via-[#0c1322] to-amber-950/30 border border-amber-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-mono shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <span className="font-bold text-amber-300">
                  Modo de Emulación Segura Activo (Local / Zero Setup)
                </span>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  El Gatekeeper está listo para ser desplegado. En Vercel, al asociar tu{' '}
                  <strong className="text-white">Vercel Postgres (Storage)</strong>, el sistema se sincronizará automáticamente en la nube sin configuración manual.
                </p>
              </div>
            </div>
            <button
              onClick={handleRunMigration}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs shrink-0 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Verificar Conexión SQL</span>
            </button>
          </div>
        )}

        {/* Dashboard Title & Quick Action bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-mono font-black tracking-tight text-white">
                PANEL DE CONTROL TÁCTICO
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full font-bold">
                EN VIVO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Bóveda criptográfica de tokens <span className="text-cyan-400">LYX-XXX-XXX</span> y gestión del hito ZERO VIP 30.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playCyberBeep(900, 'sine', 0.05);
                setIsGeneratorOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#2563FF] to-[#00D9FF] hover:from-[#1d4ed8] hover:to-[#0284c7] text-white text-xs font-mono font-bold shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all"
            >
              <Cpu className="w-4 h-4" />
              <span>Emitir Nueva Llave</span>
            </button>
          </div>
        </div>

        {/* HUD Metrics Cards */}
        <HudMetrics metrics={metrics} loading={loading} />

        {/* Tactical Data Grid */}
        <TacticalDataGrid
          keys={keys}
          loading={loading}
          onRefresh={fetchData}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedTier={selectedTier}
          onTierChange={setSelectedTier}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          onInspectToken={handleInspectToken}
        />
      </main>

      {/* Modals & Drawers */}
      <TokenGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onKeyGenerated={fetchData}
        currentZeroVipCount={metrics?.zero_vip_count || 0}
      />

      <VerifySandboxModal
        isOpen={isSandboxOpen}
        onClose={() => setIsSandboxOpen(false)}
        initialToken={sandboxInitialToken}
      />

      <AuditLogDrawer
        isOpen={isAuditOpen}
        onClose={() => {
          setIsAuditOpen(false);
          setSelectedKeyForAudit(null);
        }}
        selectedKey={selectedKeyForAudit}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#172338] bg-[#050505] py-4 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            LYAXIS labs™ — ZERO VIP Gatekeeper © {new Date().getFullYear()}
          </span>
          <span className="text-slate-400">
            Diseñado para <strong className="text-cyan-400">Oscar Naim Ambrocio Aguirre</strong>
          </span>
          <span className="text-slate-600">
            Despliegue 100% Nativo en Vercel
          </span>
        </div>
      </footer>
    </div>
  );
}
