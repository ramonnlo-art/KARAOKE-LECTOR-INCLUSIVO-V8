import React, { useState } from 'react';
import { ProgressRecord } from '../types';
import { DIFFICULTIES } from '../data/preloadTexts';
import { Sound } from '../services/sound';

interface ProgressViewProps {
  progress: ProgressRecord[];
  dictCount: number;
  teacherAuthenticated: boolean;
  onSaveObservation: (recordId: string, obs: string, diffs: string[]) => void;
  onResetProgress: () => void;
  onToast: (msg: string) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  progress,
  dictCount,
  teacherAuthenticated,
  onSaveObservation,
  onResetProgress,
  onToast,
}) => {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(
    progress.length ? progress[progress.length - 1].id : null
  );
  const [obsInput, setObsInput] = useState('');
  const [selectedDiffs, setSelectedDiffs] = useState<string[]>([]);

  // Calculate metrics
  const readingSessions = progress.filter((p) => p.kind === 'lectura');
  const totalHits = progress.reduce((acc, p) => acc + (p.hits || 0), 0);
  const starsCount = readingSessions.length + Math.floor(totalHits / 3);
  const lastPpm = readingSessions.filter((p) => p.ppm > 0).slice(-1)[0]?.ppm || 0;

  // PPM Chart points (last 15 sessions with PPM > 0)
  const ppmPoints = readingSessions.filter((p) => p.ppm > 0).slice(-15);

  const handleExportCSV = () => {
    Sound.click();
    const rows: string[][] = [
      ['Fecha', 'Alumno', 'Texto', 'Modo', 'Segundos', 'PPM', 'Palabras', 'Aciertos', 'Total', 'Tipo', 'Dificultades', 'Observaciones'],
    ];

    progress.forEach((p) => {
      rows.push([
        p.date,
        p.pupilName || 'General',
        p.title,
        p.mode,
        String(p.secs || 0),
        String(p.ppm || 0),
        String(p.words || 0),
        String(p.hits || 0),
        String(p.total || ''),
        p.kind || '',
        (p.diffs || []).join(' / '),
        (p.obs || '').replace(/[\r\n]+/g, ' '),
      ]);
    });

    const csvContent = '\uFEFF' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progreso_lector_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onToast('📥 Archivo CSV descargado para Excel');
    Sound.ok();
  };

  const handleExportJSON = () => {
    Sound.click();
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progreso_lector_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onToast('📥 Historial descargado en JSON');
    Sound.ok();
  };

  const handleSaveObs = () => {
    if (!selectedRecordId) return;
    onSaveObservation(selectedRecordId, obsInput, selectedDiffs);
    Sound.ok();
    onToast('💾 Observaciones docentes guardadas');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>⭐</span> Mi Progreso y Esfuerzo
          </h2>
          <p className="text-xs text-slate-500">
            Seguimiento longitudinal de fluidez (PPM), precisión lectora y comprensión.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📊</span> Exportar CSV
          </button>
          <button
            type="button"
            onClick={handleExportJSON}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            Descargar JSON
          </button>
        </div>
      </div>

      {/* 5 KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-3xl font-black text-blue-600 font-mono block">{readingSessions.length}</span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Lecturas</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-3xl font-black text-emerald-600 font-mono block">{totalHits}</span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Aciertos</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-3xl font-black text-purple-600 font-mono block">{dictCount}</span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Diccionario</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center space-y-1">
          <span className="text-3xl font-black text-amber-500 font-mono block">{'⭐'.repeat(Math.min(5, starsCount)) || '0'}</span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">{starsCount} Estrellas</span>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs text-center space-y-1 col-span-2 sm:col-span-1">
          <span className="text-3xl font-black text-indigo-600 font-mono block">{lastPpm || '—'}</span>
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Último PPM</span>
        </div>
      </div>

      {/* SVG Chart: PPM Evolution */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-extrabold text-sm md:text-base text-slate-900 flex items-center gap-2">
          <span>📈</span> Evolución de la Velocidad Lectora (PPM)
        </h3>

        {ppmPoints.length < 2 ? (
          <div className="h-44 bg-slate-50 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 text-xs italic">
            Completa al menos 2 sesiones de lectura para trazar la gráfica de evolución.
          </div>
        ) : (
          <div className="h-48 bg-slate-50/70 rounded-xl p-4 border border-slate-200">
            {(() => {
              const maxPpm = Math.max(...ppmPoints.map((p) => p.ppm)) * 1.2 || 100;
              const pointsStr = ppmPoints
                .map((p, i) => {
                  const x = 5 + (i / (ppmPoints.length - 1)) * 90;
                  const y = 90 - (p.ppm / maxPpm) * 80;
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(' ');

              return (
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
                  <line x1="5" y1="90" x2="95" y2="90" stroke="#cbd5e1" strokeWidth="0.8" />
                  <polyline points={pointsStr} fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" />
                  {ppmPoints.map((p, i) => {
                    const x = 5 + (i / (ppmPoints.length - 1)) * 90;
                    const y = 90 - (p.ppm / maxPpm) * 80;
                    return (
                      <g key={i}>
                        <circle cx={x} cy={y} r="2.2" fill="#eab308" stroke="#ffffff" strokeWidth="0.8" />
                        <text x={x} y={y - 4} fontSize="3.8" textAnchor="middle" fill="#1e293b" fontWeight="bold">
                          {p.ppm}
                        </text>
                      </g>
                    );
                  })}
                  <text x="5" y="8" fontSize="4.2" fill="#64748b" fontWeight="600">
                    Máx: {Math.round(maxPpm)} PPM
                  </text>
                </svg>
              );
            })()}
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-extrabold text-sm md:text-base text-slate-900 flex items-center gap-2">
            <span>🗒️</span> Historial Detallado de Sesiones
          </h3>
          <button
            type="button"
            onClick={onResetProgress}
            className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
          >
            🗑️ Reiniciar historial
          </button>
        </div>

        <div className="overflow-x-auto max-h-[300px] scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 sticky top-0 font-bold text-slate-700">
              <tr>
                <th className="p-2.5">Fecha</th>
                <th className="p-2.5">Alumno</th>
                <th className="p-2.5">Lectura</th>
                <th className="p-2.5">Modo</th>
                <th className="p-2.5">Seg.</th>
                <th className="p-2.5">PPM</th>
                <th className="p-2.5">Aciertos</th>
                <th className="p-2.5">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {progress.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                    Aún no hay sesiones registradas.
                  </td>
                </tr>
              ) : (
                progress.slice(-25).reverse().map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => {
                      setSelectedRecordId(rec.id);
                      setObsInput(rec.obs || '');
                      setSelectedDiffs(rec.diffs || []);
                    }}
                    className={`hover:bg-blue-50/50 cursor-pointer transition-colors ${
                      selectedRecordId === rec.id ? 'bg-blue-50/80 font-bold' : ''
                    }`}
                  >
                    <td className="p-2.5 whitespace-nowrap">{rec.date}</td>
                    <td className="p-2.5 whitespace-nowrap font-bold text-blue-700">{rec.pupilName || 'General'}</td>
                    <td className="p-2.5 font-bold">{rec.title}</td>
                    <td className="p-2.5 capitalize">{rec.mode}</td>
                    <td className="p-2.5 font-mono">{rec.secs}s</td>
                    <td className="p-2.5 font-mono font-bold text-blue-600">{rec.ppm}</td>
                    <td className="p-2.5 font-mono font-bold text-emerald-600">{rec.hits}</td>
                    <td className="p-2.5 max-w-xs truncate text-slate-500">{rec.obs || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Teacher Observation Editor (Active if teacher authenticated) */}
      {teacherAuthenticated && selectedRecordId && (
        <div className="bg-white rounded-2xl p-5 border-2 border-blue-200 shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm md:text-base text-blue-950 flex items-center gap-2">
            <span>👩‍🏫</span> Registro Cualitativo del Docente
          </h3>
          <p className="text-xs text-slate-500">
            Anota dificultades observadas en la sesión seleccionada:
          </p>

          <div className="flex flex-wrap gap-2">
            {DIFFICULTIES.map((diff) => {
              const isChecked = selectedDiffs.includes(diff);
              return (
                <button
                  key={diff}
                  type="button"
                  onClick={() => {
                    setSelectedDiffs((prev) => (prev.includes(diff) ? prev.filter((d) => d !== diff) : [...prev, diff]));
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    isChecked
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {isChecked ? '✓ ' : '+ '}
                  {diff}
                </button>
              );
            })}
          </div>

          <textarea
            rows={3}
            value={obsInput}
            onChange={(e) => setObsInput(e.target.value)}
            placeholder="Observaciones psicopedagógicas sobre la sesión (ej: se muestra motivado, mejora en entonación)..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 leading-relaxed font-sans"
          />

          <button
            type="button"
            onClick={handleSaveObs}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            💾 Guardar Observaciones
          </button>
        </div>
      )}
    </div>
  );
};
