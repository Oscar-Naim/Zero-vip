'use client';

import React, { useState } from 'react';
import { TokenTier, AccessKey } from '@/types';
import { TIER_CONFIG, ZERO_VIP_30_LIMIT } from '@/lib/constants';
import {
  X,
  Sparkles,
  Layers,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Cpu,
  User,
  Mail,
  Calendar,
  FileText,
} from 'lucide-react';
import { playSuccessChime, playCyberBeep, playAlertWarning } from '@/lib/sound';

interface TokenGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyGenerated: () => void;
  currentZeroVipCount: number;
}

export default function TokenGeneratorModal({
  isOpen,
  onClose,
  onKeyGenerated,
  currentZeroVipCount,
}: TokenGeneratorModalProps) {
  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [tier, setTier] = useState<TokenTier>('zero_vip_30');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [maxUses, setMaxUses] = useState(1);
  const [expiresAt, setExpiresAt] = useState('');
  const [batchCount, setBatchCount] = useState(5);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<AccessKey[] | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  if (!isOpen) return null;

  const remainingZeroVip = Math.max(0, ZERO_VIP_30_LIMIT - currentZeroVipCount);
  const isZeroVipCapped = tier === 'zero_vip_30' && (mode === 'single' ? remainingZeroVip <= 0 : batchCount > remainingZeroVip);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isZeroVipCapped) {
      playAlertWarning();
      setError(`No es posible emitir más llaves ZERO VIP 30. Límite estricto de 30 creadores (Disponibles: ${remainingZeroVip}).`);
      return;
    }

    setLoading(true);
    playCyberBeep(600, 'triangle', 0.1);

    try {
      const payload = {
        count: mode === 'single' ? 1 : batchCount,
        tier,
        assigned_to_name: name || undefined,
        assigned_to_email: email || undefined,
        notes: notes || undefined,
        max_uses: maxUses,
        expires_at: expiresAt || undefined,
      };

      const res = await fetch('/api/keys/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al emitir llaves');
      }

      playSuccessChime();
      setGeneratedResult(data.keys);
      onKeyGenerated();
    } catch (err: any) {
      playAlertWarning();
      setError(err.message || 'Fallo defensivo al generar llave(s).');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    playCyberBeep(1100, 'sine', 0.05);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleDownloadCsv = () => {
    if (!generatedResult) return;
    playCyberBeep(900, 'sine', 0.05);
    const headers = 'Token,Tier,Max_Uses,Assigned_Name,Assigned_Email,Notes,Expires_At,Created_At\n';
    const rows = generatedResult
      .map(
        (k) =>
          `"${k.token}","${k.tier}","${k.max_uses}","${k.assigned_to_name || ''}","${
            k.assigned_to_email || ''
          }","${k.notes || ''}","${k.expires_at || ''}","${k.created_at}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lyaxis_keys_${tier}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJson = () => {
    if (!generatedResult) return;
    playCyberBeep(900, 'sine', 0.05);
    const jsonString = JSON.stringify(generatedResult, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lyaxis_keys_${tier}_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setGeneratedResult(null);
    setError(null);
    setName('');
    setEmail('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl bg-[#090d16] border border-[#22395d] shadow-2xl shadow-cyan-950/40 text-slate-200">
        {/* Top Glow Bar */}
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#172338]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-mono font-bold text-white tracking-wide">
                BÓVEDA DE EMISIÓN CRIPTOGRÁFICA
              </h2>
              <p className="text-xs text-slate-400">
                Formato estándar blindado: <span className="font-mono text-cyan-400">LYX-XXX-XXX</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#0c1322] border border-[#172338] text-slate-400 hover:text-white hover:border-[#22395d] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {generatedResult ? (
            /* Result Screen */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/40 text-center">
                <div className="inline-flex p-2 rounded-full bg-cyan-500/20 text-cyan-300 mb-2">
                  <Check className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-mono font-bold text-white">
                  {generatedResult.length} Llave(s) Generada(s) con Éxito
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Persistidas en la base de datos de LYAXIS labs™ con garantía de no-colisión.
                </p>
              </div>

              {/* Tokens List Box */}
              <div className="space-y-2 max-h-60 overflow-y-auto p-3 rounded-xl bg-[#050505] border border-[#172338]">
                {generatedResult.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#090d16] border border-[#172338] hover:border-cyan-500/40 transition-all font-mono"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-cyan-400 tracking-wider">
                        {key.token}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase">
                        {key.tier}
                      </span>
                      {key.assigned_to_name && (
                        <span className="text-xs text-slate-400 hidden sm:inline">
                          ({key.assigned_to_name})
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleCopy(key.token)}
                      className="flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-[#0c1322] border border-[#22395d] text-slate-300 hover:text-cyan-300 hover:border-cyan-400 transition-all"
                    >
                      {copiedToken === key.token ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copiado</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#172338]">
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadCsv}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0c1322] border border-[#22395d] hover:border-cyan-500/50 text-xs font-mono text-slate-200 hover:text-cyan-300 transition-all"
                  >
                    <Download className="w-4 h-4 text-cyan-400" />
                    <span>Descargar CSV</span>
                  </button>
                  <button
                    onClick={handleDownloadJson}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0c1322] border border-[#22395d] hover:border-purple-500/50 text-xs font-mono text-slate-200 hover:text-purple-300 transition-all"
                  >
                    <Download className="w-4 h-4 text-purple-400" />
                    <span>Descargar JSON</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={resetForm}
                    className="px-4 py-2 rounded-lg bg-[#0c1322] border border-[#172338] text-xs font-mono text-slate-300 hover:text-white"
                  >
                    Emitir Nuevas
                  </button>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-xs font-mono font-semibold"
                  >
                    Finalizar
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* Mode Toggle (Single vs Batch) */}
              <div className="flex rounded-lg bg-[#050505] p-1 border border-[#172338]">
                <button
                  type="button"
                  onClick={() => {
                    setMode('single');
                    playCyberBeep(700, 'sine', 0.04);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-mono font-semibold rounded-md transition-all ${
                    mode === 'single'
                      ? 'bg-gradient-to-r from-[#2563FF] to-[#00D9FF] text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Individual (Personalizada)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('batch');
                    playCyberBeep(700, 'sine', 0.04);
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-mono font-semibold rounded-md transition-all ${
                    mode === 'batch'
                      ? 'bg-gradient-to-r from-[#2563FF] to-[#00D9FF] text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Modo Lote (1 - 100 Llaves)</span>
                </button>
              </div>

              {/* Tier Selection */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                  Nivel de Acceso (Tier)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(TIER_CONFIG) as TokenTier[]).map((t) => {
                    const cfg = TIER_CONFIG[t];
                    const isSelected = tier === t;
                    const isVip = t === 'zero_vip_30';
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTier(t);
                          setMaxUses(cfg.defaultMaxUses);
                          playCyberBeep(850, 'sine', 0.04);
                        }}
                        className={`text-left p-3 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-[#0f172a] border-cyan-400/80 shadow-sm shadow-cyan-500/20'
                            : 'bg-[#050505] border-[#172338] hover:border-[#22395d]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-mono font-bold ${
                              isSelected ? 'text-cyan-300' : 'text-slate-200'
                            }`}
                          >
                            {cfg.label}
                          </span>
                          {isVip && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              {remainingZeroVip}/30
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                          {cfg.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Warning for ZERO VIP 30 */}
              {tier === 'zero_vip_30' && (
                <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-500/40 text-xs text-cyan-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Hito Inaugural 17 de Octubre:</span> Quedan{' '}
                    <strong className="text-white">{remainingZeroVip} de 30</strong> cupos disponibles. La base de datos no permitirá exceder este límite bajo este tier.
                  </div>
                </div>
              )}

              {/* Batch Mode: Count Selector */}
              {mode === 'batch' ? (
                <div className="p-4 rounded-xl bg-[#050505] border border-[#172338] space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono uppercase tracking-wider text-slate-300">
                      Cantidad de llaves a generar
                    </label>
                    <span className="text-lg font-mono font-bold text-cyan-400">
                      {batchCount}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max={tier === 'zero_vip_30' ? Math.max(1, remainingZeroVip) : 100}
                    value={batchCount}
                    onChange={(e) => setBatchCount(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-slate-500">
                    <span>1 llave</span>
                    <span>25</span>
                    <span>50</span>
                    <span>{tier === 'zero_vip_30' ? Math.max(1, remainingZeroVip) : 100}</span>
                  </div>
                </div>
              ) : (
                /* Single Mode: Assignee Information */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Nombre del Creador / Asignatario</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Santiago Morales (Creador VIP)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#050505] border border-[#172338] focus:border-cyan-400 focus:outline-none text-slate-200"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Correo Electrónico (Opcional)</span>
                    </label>
                    <input
                      type="email"
                      placeholder="santiago@empresa.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-[#050505] border border-[#172338] focus:border-cyan-400 focus:outline-none text-slate-200"
                    />
                  </div>
                </div>
              )}

              {/* Extra Parameters: Max Uses, Expiration, Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Límite de Usos (Máximo de Activaciones)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={maxUses}
                    onChange={(e) => setMaxUses(Math.max(1, parseInt(e.target.value || '1', 10)))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#050505] border border-[#172338] focus:border-cyan-400 focus:outline-none text-slate-200 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Fecha de Expiración (Opcional)</span>
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-[#050505] border border-[#172338] focus:border-cyan-400 focus:outline-none text-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Notas Internas / Propósito</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej. Creador inaugural seleccionado para la beta del 17 de Octubre"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[#050505] border border-[#172338] focus:border-cyan-400 focus:outline-none text-slate-200"
                />
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/50 text-xs text-rose-300">
                  {error}
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#172338]">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-mono rounded-lg bg-[#0c1322] border border-[#172338] text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || isZeroVipCapped}
                  className="flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-semibold rounded-lg bg-gradient-to-r from-[#2563FF] to-[#00D9FF] hover:from-[#1d4ed8] hover:to-[#0284c7] disabled:opacity-50 text-white shadow-lg shadow-cyan-500/20"
                >
                  {loading ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Emitiendo en Bóveda...</span>
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      <span>
                        {mode === 'single'
                          ? 'Generar Llave Criptográfica'
                          : `Generar ${batchCount} Llaves en Lote`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
