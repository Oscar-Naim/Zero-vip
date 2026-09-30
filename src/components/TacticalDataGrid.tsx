'use client';

import React, { useState } from 'react';
import { AccessKey, TokenTier, TokenStatus } from '@/types';
import { TIER_CONFIG } from '@/lib/constants';
import {
  Search,
  Copy,
  Check,
  RotateCcw,
  Ban,
  Trash2,
  Download,
  Filter,
  Eye,
  Key,
  Calendar,
  User,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { playCyberBeep, playSuccessChime, playAlertWarning } from '@/lib/sound';

interface TacticalDataGridProps {
  keys: AccessKey[];
  loading: boolean;
  onRefresh: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedTier: string;
  onTierChange: (t: string) => void;
  selectedStatus: string;
  onStatusChange: (s: string) => void;
  onInspectToken: (key: AccessKey) => void;
}

export default function TacticalDataGrid({
  keys,
  loading,
  onRefresh,
  searchQuery,
  onSearchChange,
  selectedTier,
  onTierChange,
  selectedStatus,
  onStatusChange,
  onInspectToken,
}: TacticalDataGridProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  const handleCopy = (token: string, id: string) => {
    navigator.clipboard.writeText(token);
    setCopiedId(id);
    playCyberBeep(1100, 'sine', 0.05);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevoke = async (key: AccessKey) => {
    const isAlreadyRevoked = key.status === 'revoked';
    const newStatus = isAlreadyRevoked ? 'active' : 'revoked';

    if (!confirm(`¿Confirmas ${isAlreadyRevoked ? 'reactivar' : 'revocar'} la llave ${key.token}?`)) {
      return;
    }

    setActionInProgress(key.id);
    playCyberBeep(450, 'sawtooth', 0.08);

    try {
      const res = await fetch(`/api/keys/${key.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        playSuccessChime();
        onRefresh();
      }
    } catch {
      playAlertWarning();
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResetUses = async (key: AccessKey) => {
    if (!confirm(`¿Restablecer el contador de activaciones de ${key.token} a 0?`)) {
      return;
    }

    setActionInProgress(key.id);
    playCyberBeep(700, 'triangle', 0.08);

    try {
      const res = await fetch(`/api/keys/${key.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_uses: true }),
      });
      if (res.ok) {
        playSuccessChime();
        onRefresh();
      }
    } catch {
      playAlertWarning();
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async (key: AccessKey) => {
    if (!confirm(`ATENCIÓN: ¿Eliminar de forma permanente la llave ${key.token}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setActionInProgress(key.id);
    playCyberBeep(250, 'sawtooth', 0.15);

    try {
      const res = await fetch(`/api/keys/${key.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        playSuccessChime();
        onRefresh();
      }
    } catch {
      playAlertWarning();
    } finally {
      setActionInProgress(null);
    }
  };

  const handleExportCsv = () => {
    playCyberBeep(900, 'sine', 0.05);
    const headers = 'Token,Tier,Status,Current_Uses,Max_Uses,Assigned_Name,Assigned_Email,Notes,Created_At,Claimed_At,Expires_At\n';
    const rows = keys
      .map(
        (k) =>
          `"${k.token}","${k.tier}","${k.status}",${k.current_uses},${k.max_uses},"${k.assigned_to_name || ''}","${
            k.assigned_to_email || ''
          }","${(k.notes || '').replace(/"/g, '""')}","${k.created_at}","${k.claimed_at || ''}","${k.expires_at || ''}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lyaxis_gatekeeper_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJson = () => {
    playCyberBeep(900, 'sine', 0.05);
    const jsonString = JSON.stringify(keys, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lyaxis_gatekeeper_export_${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (status: TokenStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ACTIVA
          </span>
        );
      case 'claimed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-purple-500/10 text-purple-400 border border-purple-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
            RECLAMADA
          </span>
        );
      case 'revoked':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            REVOCADA
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            EXPIRADA
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl bg-[#090d16] border border-[#172338] overflow-hidden shadow-xl shadow-black/40">
      {/* Top Filter Controls */}
      <div className="p-4 border-b border-[#172338] bg-[#0c1322]/50 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por Token (LYX-...), Creador, Correo o Notas..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg bg-[#050505] border border-[#172338] focus:border-cyan-400 focus:outline-none text-slate-200 placeholder:text-slate-600 font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 font-mono"
              >
                ✕
              </button>
            )}
          </div>

          {/* Export and Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050505] border border-[#172338] hover:border-cyan-500/40 text-xs font-mono text-slate-300 hover:text-cyan-300 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#050505] border border-[#172338] hover:border-purple-500/40 text-xs font-mono text-slate-300 hover:text-purple-300 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>JSON</span>
            </button>
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg bg-[#050505] border border-[#172338] hover:border-[#22395d] text-slate-400 hover:text-white transition-all"
              title="Recargar datos"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Filters: Statuses & Special Tier Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#172338]/60 text-xs font-mono">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-slate-500 text-[11px] mr-1 hidden sm:inline">Estado:</span>
            {[
              { id: 'all', label: 'Todos' },
              { id: 'active', label: 'Activos' },
              { id: 'claimed', label: 'Reclamados' },
              { id: 'revoked', label: 'Revocados' },
              { id: 'expired', label: 'Expirados' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  onStatusChange(st.id);
                  playCyberBeep(800, 'sine', 0.03);
                }}
                className={`px-3 py-1 rounded-md transition-all ${
                  selectedStatus === st.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111927]'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Tier Filter Dropdown / Tab */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">Nivel:</span>
            <select
              value={selectedTier}
              onChange={(e) => {
                onTierChange(e.target.value);
                playCyberBeep(800, 'sine', 0.03);
              }}
              className="px-2.5 py-1 text-xs font-mono rounded-md bg-[#050505] border border-[#172338] text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="all">Todos los Tiers</option>
              <option value="zero_vip_30">ZERO VIP 30 (Inaugural)</option>
              <option value="early_access">Early Access</option>
              <option value="developer">Developer</option>
              <option value="partner">Partner</option>
              <option value="internal_core">Internal Core</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-[#050505] border-b border-[#172338] text-slate-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Token de Acceso</th>
              <th className="py-3 px-4">Tier / Nivel</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Activaciones</th>
              <th className="py-3 px-4">Asignado a</th>
              <th className="py-3 px-4">Emisión / Expiración</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#172338]/60 text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <span>Cargando registros criptográficos...</span>
                  </div>
                </td>
              </tr>
            ) : keys.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="w-6 h-6 text-slate-600" />
                    <span>No se encontraron llaves de acceso que coincidan con los filtros.</span>
                  </div>
                </td>
              </tr>
            ) : (
              keys.map((key) => {
                const tierCfg = TIER_CONFIG[key.tier] || {
                  label: key.tier,
                  badgeColor: 'bg-slate-800 text-slate-300',
                };
                const isVip = key.tier === 'zero_vip_30';
                const isWorking = actionInProgress === key.id;

                return (
                  <tr
                    key={key.id}
                    className="hover:bg-[#0c1322]/80 transition-colors group"
                  >
                    {/* Token Column */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(key.token, key.id)}
                          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#050505] border border-[#172338] hover:border-cyan-400/80 group-hover:border-cyan-500/50 transition-all"
                          title="Haga clic para copiar el token"
                        >
                          <span className="font-bold text-cyan-400 text-sm tracking-wide">
                            {key.token}
                          </span>
                          {copiedId === key.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Tier Column */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${
                          isVip
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                            : tierCfg.badgeColor
                        }`}
                      >
                        {isVip ? 'ZERO VIP 30' : tierCfg.label.split(' ')[0]}
                      </span>
                    </td>

                    {/* Status Column */}
                    <td className="py-3 px-4">{getStatusBadge(key.status)}</td>

                    {/* Usage Column */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-semibold ${
                            key.current_uses >= key.max_uses
                              ? 'text-purple-400'
                              : 'text-slate-200'
                          }`}
                        >
                          {key.current_uses}
                        </span>
                        <span className="text-slate-600">/</span>
                        <span className="text-slate-400">{key.max_uses}</span>
                        {key.current_uses > 0 && (
                          <button
                            onClick={() => handleResetUses(key)}
                            title="Restablecer contador de activaciones a 0"
                            className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-cyan-400 ml-1 transition-all"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Assigned To Column */}
                    <td className="py-3 px-4">
                      {key.assigned_to_name ? (
                        <div>
                          <div className="font-medium text-slate-200 flex items-center gap-1">
                            <User className="w-3 h-3 text-cyan-500" />
                            <span>{key.assigned_to_name}</span>
                          </div>
                          {key.assigned_to_email && (
                            <div className="text-[11px] text-slate-500">
                              {key.assigned_to_email}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-600 italic">No asignado</span>
                      )}
                    </td>

                    {/* Dates Column */}
                    <td className="py-3 px-4 text-[11px] text-slate-400">
                      <div>
                        Creado: {new Date(key.created_at).toLocaleDateString()}
                      </div>
                      {key.claimed_at && (
                        <div className="text-purple-400">
                          Canje: {new Date(key.claimed_at).toLocaleDateString()}
                        </div>
                      )}
                      {key.expires_at && (
                        <div className="text-amber-400">
                          Exp: {new Date(key.expires_at).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Inspect Audit */}
                        <button
                          onClick={() => onInspectToken(key)}
                          title="Inspeccionar detalles y auditoría"
                          className="p-1.5 rounded-lg bg-[#050505] border border-[#172338] hover:border-cyan-500/50 text-slate-400 hover:text-cyan-300 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Revoke / Reactivate */}
                        <button
                          onClick={() => handleRevoke(key)}
                          disabled={isWorking}
                          title={key.status === 'revoked' ? 'Reactivar Llave' : 'Revocar Llave'}
                          className={`p-1.5 rounded-lg bg-[#050505] border transition-all ${
                            key.status === 'revoked'
                              ? 'border-emerald-900/60 text-emerald-400 hover:border-emerald-500'
                              : 'border-rose-900/60 text-rose-400 hover:border-rose-500'
                          }`}
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(key)}
                          disabled={isWorking}
                          title="Eliminar Llave"
                          className="p-1.5 rounded-lg bg-[#050505] border border-[#172338] hover:border-rose-800 text-slate-500 hover:text-rose-400 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-[#172338] bg-[#050505] flex items-center justify-between text-[11px] font-mono text-slate-500">
        <span>Mostrando {keys.length} registros cifrados</span>
        <span>LYAXIS labs™ Cryptographic Gatekeeper Database Engine</span>
      </div>
    </div>
  );
}
