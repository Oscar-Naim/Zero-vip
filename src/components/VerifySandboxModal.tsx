'use client';

import React, { useState } from 'react';
import { X, Terminal, CheckCircle2, XCircle, Send, Shield, Zap } from 'lucide-react';
import { playCyberBeep, playSuccessChime, playAlertWarning } from '@/lib/sound';

interface VerifySandboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialToken?: string;
}

export default function VerifySandboxModal({
  isOpen,
  onClose,
  initialToken = '',
}: VerifySandboxModalProps) {
  const [token, setToken] = useState(initialToken);
  const [serviceKey, setServiceKey] = useState('');
  const [useServiceKey, setUseServiceKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseData, setResponseData] = useState<any | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleTestVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseData(null);
    setResponseStatus(null);
    setLatencyMs(null);

    playCyberBeep(750, 'triangle', 0.08);
    const start = performance.now();

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-lyaxis-client': 'ADMIN_SANDBOX_TESTER',
      };
      if (useServiceKey && serviceKey) {
        headers['x-lyaxis-service-key'] = serviceKey;
      }

      const res = await fetch('/api/v1/keys/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify({ token: token.trim().toUpperCase() }),
      });

      const end = performance.now();
      const elapsed = Math.round(end - start);
      setLatencyMs(elapsed);
      setResponseStatus(res.status);

      const data = await res.json();
      setResponseData(data);

      if (res.ok && data.valid) {
        playSuccessChime();
      } else {
        playAlertWarning();
      }
    } catch (err: any) {
      setResponseStatus(500);
      setResponseData({ error: err.message || 'Error de conexión' });
      playAlertWarning();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-[#090d16] border border-[#22395d] shadow-2xl text-slate-200">
        <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500" />

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#172338]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0c1322] border border-[#22395d] text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-mono font-bold text-white tracking-wide flex items-center gap-2">
                <span>SIMULADOR DE VALIDACIÓN — LYAXIS IA</span>
                <span className="px-2 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded">
                  POST /api/v1/keys/verify
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Prueba la validación atómica y auditoría forense en tiempo real.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#0c1322] border border-[#172338] text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <form onSubmit={handleTestVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                Token de Acceso
              </label>
              <input
                type="text"
                placeholder="LYX-XXX-XXX"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full px-4 py-2.5 text-base font-mono font-bold tracking-widest uppercase rounded-lg bg-[#050505] border border-[#172338] focus:border-cyan-400 focus:outline-none text-cyan-400 placeholder:text-slate-700"
                required
              />
            </div>

            {/* Optional Service Key Header */}
            <div className="p-3 rounded-lg bg-[#050505] border border-[#172338] space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-slate-300 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>Cabecera de Firma del Sistema (x-lyaxis-service-key)</span>
                </label>
                <input
                  type="checkbox"
                  checked={useServiceKey}
                  onChange={(e) => setUseServiceKey(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-400 focus:ring-0 cursor-pointer"
                />
              </div>

              {useServiceKey && (
                <input
                  type="password"
                  placeholder="Introduce la Service Key para simular microservicios..."
                  value={serviceKey}
                  onChange={(e) => setServiceKey(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded bg-[#090d16] border border-[#22395d] text-slate-200 font-mono"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 disabled:opacity-50 text-white font-mono font-semibold text-xs transition-all shadow-lg shadow-cyan-950/50"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Ejecutando verificación atómica...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Validar Token (Simular Petición de LYAXIS IA)</span>
                </>
              )}
            </button>
          </form>

          {/* Response Console */}
          {responseData && (
            <div className="rounded-xl bg-[#050505] border border-[#172338] p-4 space-y-2 font-mono">
              <div className="flex items-center justify-between border-b border-[#172338] pb-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Respuesta HTTP:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      responseStatus === 200
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {responseStatus} {responseStatus === 200 ? 'OK' : 'ERROR'}
                  </span>
                </div>
                {latencyMs !== null && (
                  <div className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    <span>{latencyMs} ms</span>
                  </div>
                )}
              </div>

              {/* JSON Result Display */}
              <pre className="text-xs text-slate-200 overflow-x-auto p-2 bg-[#090d16] rounded border border-[#172338] max-h-52">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
