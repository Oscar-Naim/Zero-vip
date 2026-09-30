'use client';

import React, { useEffect, useState } from 'react';
import { TokenAuditLog, AccessKey } from '@/types';
import {
  X,
  Activity,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Hash,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { playCyberBeep } from '@/lib/sound';

interface AuditLogDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedKey?: AccessKey | null;
}

export default function AuditLogDrawer({
  isOpen,
  onClose,
  selectedKey,
}: AuditLogDrawerProps) {
  const [logs, setLogs] = useState<TokenAuditLog[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const url = selectedKey
        ? `/api/keys?search=${encodeURIComponent(selectedKey.token)}&include_audit=true`
        : `/api/keys?include_audit=true`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.auditLogs) {
        setLogs(data.auditLogs);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen, selectedKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-xl h-full bg-[#090d16] border-l border-[#22395d] shadow-2xl flex flex-col text-slate-200">
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#172338]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-950/50 border border-purple-500/40 text-purple-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-mono font-bold text-white tracking-wide">
                AUDITORÍA FORENSE DE ACCESO
              </h2>
              <p className="text-xs text-slate-400">
                {selectedKey
                  ? `Registros del token: ${selectedKey.token}`
                  : 'Historial global de verificaciones y eventos'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playCyberBeep(700, 'sine', 0.04);
                fetchLogs();
              }}
              className="p-1.5 rounded-lg bg-[#0c1322] border border-[#172338] text-slate-400 hover:text-white"
              title="Actualizar registros"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-[#0c1322] border border-[#172338] text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono">
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <span className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin inline-block mb-2" />
              <p className="text-xs">Extrayendo registros de la base de datos...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-20 text-center text-slate-500 text-xs">
              No hay eventos forenses registrados aún.
            </div>
          ) : (
            logs.map((log) => {
              const isSuccess = log.success;
              return (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-xl border text-xs transition-all ${
                    isSuccess
                      ? 'bg-[#050505] border-[#172338] hover:border-cyan-500/40'
                      : 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {isSuccess ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400" />
                      )}
                      <span className="font-bold text-white tracking-wide">
                        {log.token_text}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                          log.action === 'CLAIMED'
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                            : log.action === 'VERIFIED'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : log.action === 'FAILED'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : 'bg-slate-700 text-slate-300 border-slate-600'
                        }`}
                      >
                        {log.action}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  {/* IP Hash */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                    <Hash className="w-3 h-3 text-cyan-500" />
                    <span className="text-slate-500">IP Hash:</span>
                    <span className="text-cyan-400/90 truncate max-w-xs">
                      {log.ip_hash.slice(0, 16)}...{log.ip_hash.slice(-8)}
                    </span>
                  </div>

                  {/* Metadata */}
                  {log.metadata && (
                    <div className="mt-2 p-2 rounded bg-[#090d16] border border-[#172338] text-[10px] text-slate-400 break-words">
                      {JSON.stringify(log.metadata)}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[#172338] bg-[#050505] text-[11px] font-mono text-slate-500 flex justify-between">
          <span>Privacidad con Hash SHA-256</span>
          <span>Zero-Trust Audit Trail</span>
        </div>
      </div>
    </div>
  );
}
