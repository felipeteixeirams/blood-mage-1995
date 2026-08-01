import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Activity, Bug, Download, Trash2, X, Terminal, Cpu, Search, CheckCircle, AlertTriangle, ShieldAlert, Clock, RefreshCw } from 'lucide-react';
import { logger, LogEntry, LogLevel } from '../utils/logger';
import { telemetry, TelemetryMetrics } from '../utils/telemetry';

interface ObservabilityModalProps {
  onClose: () => void;
}

export const ObservabilityModal: React.FC<ObservabilityModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'logs' | 'telemetry' | 'system'>('logs');
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [metrics, setMetrics] = useState<TelemetryMetrics>(telemetry.getMetrics());

  useEffect(() => {
    const unsubscribe = logger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });

    const interval = setInterval(() => {
      setMetrics(telemetry.getMetrics());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel;
    const matchesQuery =
      searchQuery === '' ||
      log.namespace.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesQuery;
  });

  const handleExportJson = () => {
    const jsonStr = logger.exportLogsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bloodmage_diagnostics_${logger.getSessionId()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLevelBadge = (level: LogLevel) => {
    switch (level) {
      case 'ERROR':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-pixel bg-red-950 border border-red-600 text-red-400 flex items-center gap-1"><ShieldAlert className="w-3 h-3" /> ERROR</span>;
      case 'WARN':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-pixel bg-amber-950 border border-amber-600 text-amber-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> WARN</span>;
      case 'INFO':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-pixel bg-blue-950 border border-blue-600 text-blue-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> INFO</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-pixel bg-slate-900 border border-slate-700 text-slate-400">DEBUG</span>;
    }
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto"
    >
      <div className="bg-[#0f172a] border-4 border-slate-700 rounded-xl p-5 max-w-4xl w-full max-h-[92vh] flex flex-col text-slate-100 shadow-[0_0_40px_rgba(30,41,59,0.5)] font-mono">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-emerald-400 animate-pulse" />
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                PAINEL DE OBSERVABILIDADE & TELEMETRIA
              </h2>
              <p className="text-xs text-slate-400">Sessão: <code className="text-emerald-400">{logger.getSessionId()}</code></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics KPI Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-4">
          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1"><Cpu className="w-3 h-3 text-emerald-400" /> Frame Rate</span>
            <span className="text-lg font-bold text-emerald-400">{metrics.fps} FPS <span className="text-xs text-slate-500">({metrics.frameTimeMs}ms)</span></span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1"><Activity className="w-3 h-3 text-blue-400" /> Entidades Ativas</span>
            <span className="text-lg font-bold text-blue-400">{metrics.entityCount} <span className="text-xs text-slate-500">sprites</span></span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1"><Clock className="w-3 h-3 text-purple-400" /> Duração Sessão</span>
            <span className="text-lg font-bold text-purple-300">{formatDuration(metrics.sessionDurationSec)}</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1"><Terminal className="w-3 h-3 text-cyan-400" /> Buffer de Logs</span>
            <span className="text-lg font-bold text-cyan-300">{metrics.totalLogs} <span className="text-xs text-slate-500">entradas</span></span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase flex items-center gap-1"><Bug className="w-3 h-3 text-red-400" /> Erros Capturados</span>
            <span className={`text-lg font-bold ${metrics.errorCount > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`}>{metrics.errorCount}</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'logs' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" /> Logs Estruturados ({filteredLogs.length})
            </button>
            <button
              onClick={() => setActiveTab('telemetry')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'telemetry' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Eventos da Sessão
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'system' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" /> Diagnóstico do Sistema
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => logger.clear()}
              className="p-1.5 bg-slate-800 hover:bg-red-950/80 border border-slate-700 hover:border-red-700 text-slate-300 hover:text-red-300 rounded text-xs flex items-center gap-1 transition-colors cursor-pointer"
              title="Limpar Buffer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Limpar
            </button>
            <button
              onClick={handleExportJson}
              className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow"
            >
              <Download className="w-3.5 h-3.5" /> Exportar JSON
            </button>
          </div>
        </div>

        {/* Tab 1: Logs Viewer */}
        {activeTab === 'logs' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Filtrar por namespace ou mensagem..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-1">
                {['ALL', 'INFO', 'WARN', 'ERROR', 'DEBUG'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setSelectedLevel(lvl)}
                    className={`px-2 py-1 rounded text-[11px] font-bold border transition-colors cursor-pointer ${
                      selectedLevel === lvl
                        ? 'bg-slate-700 border-slate-500 text-white'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs List Container */}
            <div className="flex-1 overflow-y-auto bg-slate-950 border border-slate-800 rounded p-3 space-y-1.5 font-mono text-[11px] leading-relaxed">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-2 rounded bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      {getLevelBadge(entry.level)}
                      <span className="text-slate-500 text-[10px]">{entry.timestamp.split('T')[1].slice(0, 12)}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-semibold text-[10px]">
                        [{entry.namespace}]
                      </span>
                      <span className="text-slate-200 font-medium flex-1">{entry.message}</span>
                    </div>

                    {entry.data !== undefined && (
                      <pre className="mt-1 p-2 bg-black/60 rounded text-[10px] text-slate-400 overflow-x-auto border border-slate-800/50">
                        {JSON.stringify(entry.data, null, 2)}
                      </pre>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-slate-500">
                  <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Nenhum log encontrado para os filtros selecionados.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Telemetry Events */}
        {activeTab === 'telemetry' && (
          <div className="flex-1 overflow-y-auto bg-slate-950 border border-slate-800 rounded p-4 space-y-2 text-xs">
            <h3 className="text-slate-400 text-xs font-bold border-b border-slate-800 pb-2 mb-3">HISTÓRICO DE EVENTOS DE GAMEPLAY DA SESSÃO</h3>
            {telemetry.getEventHistory().length > 0 ? (
              telemetry.getEventHistory().map((ev, i) => (
                <div key={i} className="p-2.5 rounded bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-400 font-bold uppercase">{ev.eventName}</span>
                    <span className="text-slate-500 text-[10px]">{ev.timestamp.split('T')[1].slice(0, 12)}</span>
                  </div>
                  {ev.properties && (
                    <pre className="p-2 bg-black/60 rounded text-[10px] text-slate-400 border border-slate-800/60 overflow-x-auto">
                      {JSON.stringify(ev.properties, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            ) : (
              <p className="text-slate-500 italic text-center py-8">Nenhum evento registrado nesta sessão ainda.</p>
            )}
          </div>
        )}

        {/* Tab 3: System Diagnostic */}
        {activeTab === 'system' && (
          <div className="flex-1 overflow-y-auto bg-slate-950 border border-slate-800 rounded p-4 text-xs space-y-4">
            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <h4 className="font-bold text-emerald-400 mb-2 flex items-center gap-1.5"><Cpu className="w-4 h-4" /> Informações de Runtime</h4>
              <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
                <div><strong>User Agent:</strong> {navigator.userAgent.slice(0, 50)}...</div>
                <div><strong>Plataforma:</strong> {navigator.platform}</div>
                <div><strong>Resolução do Viewport:</strong> {window.innerWidth}x{window.innerHeight}</div>
                <div><strong>Vozes Áudio Sintético:</strong> {metrics.activeVoices} ativas</div>
              </div>
            </div>

            <div className="p-3 bg-slate-900 rounded border border-slate-800">
              <h4 className="font-bold text-blue-400 mb-2 flex items-center gap-1.5"><RefreshCw className="w-4 h-4" /> Traceability & Correlation</h4>
              <div className="space-y-1 text-slate-300 text-[11px]">
                <p><strong>Correlation Session ID:</strong> <code className="text-emerald-300">{logger.getSessionId()}</code></p>
                <p><strong>App Version:</strong> 1.5.0-Bloodmage-1995</p>
                <p><strong>Build Environment:</strong> Cloud Run / Vite Client</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-800 text-[11px] text-slate-400">
          <span>Pressione <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-200">O</kbd> a qualquer momento no jogo para alternar a Observabilidade.</span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-xs cursor-pointer transition-colors"
          >
            FECHAR PAINEL
          </button>
        </div>
      </div>
    </motion.div>
  );
};
