import React, { useState } from 'react';
import { ProgressRecord, PupilProfile } from '../types';
import { Sound } from '../services/sound';

interface TeacherViewProps {
  authenticated: boolean;
  onLogin: (pass: string) => boolean;
  onLogout: () => void;
  onNavigate: (view: 'crear' | 'pictos' | 'progreso') => void;
  progress: ProgressRecord[];
  pupils: PupilProfile[];
  onAddPupil: (name: string, group: string) => void;
  onRemovePupil: (id: string) => void;
  migrationReport: string;
  onExportReport: () => void;
  onExportCSV: () => void;
  onToast: (msg: string) => void;
}

export const TeacherView: React.FC<TeacherViewProps> = ({
  authenticated,
  onLogin,
  onLogout,
  onNavigate,
  progress,
  pupils,
  onAddPupil,
  onRemovePupil,
  migrationReport,
  onExportReport,
  onExportCSV,
  onToast,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);
  const [newPupilName, setNewPupilName] = useState('');
  const [newPupilGroup, setNewPupilGroup] = useState('Aula Primaria');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onLogin(passwordInput);
    if (!ok) {
      setAuthError(true);
      Sound.bad();
    } else {
      setAuthError(false);
      Sound.ok();
    }
  };

  const handleCreatePupil = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPupilName.trim()) return;
    onAddPupil(newPupilName.trim(), newPupilGroup.trim());
    setNewPupilName('');
    Sound.ok();
    onToast(`✅ Perfil de alumno «${newPupilName.trim()}» creado`);
  };

  if (!authenticated) {
    return (
      <div className="bg-white rounded-2xl p-8 max-w-md mx-auto border border-slate-200 shadow-sm space-y-4 text-center">
        <span className="text-4xl">👩‍🏫</span>
        <h2 className="text-xl font-extrabold text-slate-900">Panel Docente Protegido</h2>
        <p className="text-xs text-slate-500">
          Introduce la contraseña docente para acceder a las estadísticas de grupo, gestión de alumnos y configuración avanzada (por defecto: <b>profe2024</b>).
        </p>

        <form onSubmit={handleLoginSubmit} className="space-y-3">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Introduce contraseña..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-center text-slate-900 font-bold focus:outline-blue-500"
          />
          {authError && <p className="text-xs font-bold text-rose-600">Contraseña incorrecta</p>}
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl cursor-pointer shadow-xs active:scale-95"
          >
            Acceder al Panel Docente
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>👩‍🏫</span> Panel de Gestión Docente y AL
            </h2>
            <p className="text-xs text-slate-500">
              Evaluación formativa, diagnóstico cualitativo y gestión de perfiles de alumnado.
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer self-start sm:self-auto"
          >
            🔒 Cerrar Sesión
          </button>
        </div>

        {/* Quick Tools Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('crear')}
            className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>✏️</span> Crear Lectura
          </button>
          <button
            type="button"
            onClick={() => onNavigate('pictos')}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>🖼️</span> Banco Pictos
          </button>
          <button
            type="button"
            onClick={onExportReport}
            className="p-3 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>📥</span> Informe JSON
          </button>
          <button
            type="button"
            onClick={onExportCSV}
            className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>📊</span> Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => onNavigate('progreso')}
            className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>⭐</span> Historial
          </button>
        </div>
      </div>

      {/* Pupil Profiles Manager */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b pb-2">
          <span>👥</span> Perfiles de Alumnado (Almacenamiento 100% Local y Privado)
        </h3>
        <p className="text-xs text-slate-500">
          Crea perfiles para asociar el progreso de lectura a cada alumno sin transmitir ningún dato fuera del equipo:
        </p>

        {/* Add pupil form */}
        <form onSubmit={handleCreatePupil} className="flex flex-col sm:flex-row gap-2 max-w-lg">
          <input
            type="text"
            required
            value={newPupilName}
            onChange={(e) => setNewPupilName(e.target.value)}
            placeholder="Nombre o alias (ej: Hugo, Aula Azul)..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-blue-500"
          />
          <input
            type="text"
            value={newPupilGroup}
            onChange={(e) => setNewPupilGroup(e.target.value)}
            placeholder="Grupo / Clase..."
            className="sm:w-36 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:outline-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            ➕ Añadir Alumno
          </button>
        </form>

        <div className="flex flex-wrap gap-2 pt-2">
          {pupils.map((pupil) => (
            <div
              key={pupil.id}
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2 shadow-2xs"
            >
              <span className="font-extrabold text-xs text-slate-800">{pupil.name}</span>
              <span className="text-[10px] text-slate-400 font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {pupil.group}
              </span>
              {pupil.name !== 'General' && (
                <button
                  type="button"
                  onClick={() => onRemovePupil(pupil.id)}
                  className="text-slate-400 hover:text-rose-600 text-xs font-bold ml-1 cursor-pointer"
                  title="Eliminar perfil"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions Audit Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b pb-2">
          <span>📋</span> Registro de Evaluaciones y Sesiones Recientes
        </h3>

        <div className="overflow-x-auto max-h-[360px] scrollbar-thin">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 font-bold text-slate-700 sticky top-0">
              <tr>
                <th className="p-2.5">Fecha</th>
                <th className="p-2.5">Alumno</th>
                <th className="p-2.5">Lectura</th>
                <th className="p-2.5">Modo</th>
                <th className="p-2.5">PPM</th>
                <th className="p-2.5">Aciertos</th>
                <th className="p-2.5">Dificultades Notadas</th>
                <th className="p-2.5">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {progress.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                    Sin registros todavía.
                  </td>
                </tr>
              ) : (
                progress.slice(-30).reverse().map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50">
                    <td className="p-2.5 whitespace-nowrap">{rec.date}</td>
                    <td className="p-2.5 font-bold text-blue-700">{rec.pupilName || 'General'}</td>
                    <td className="p-2.5 font-bold">{rec.title}</td>
                    <td className="p-2.5 capitalize">{rec.mode}</td>
                    <td className="p-2.5 font-mono font-bold text-blue-600">{rec.ppm || 0}</td>
                    <td className="p-2.5 font-mono font-bold text-emerald-600">{rec.hits || 0}</td>
                    <td className="p-2.5 text-amber-700 font-semibold">{(rec.diffs || []).join(', ') || '—'}</td>
                    <td className="p-2.5 text-slate-500 max-w-xs truncate">{rec.obs || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Migration and System Report */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1">
        <h4 className="font-bold text-slate-700">Estado de la Base de Datos Local y Migración:</h4>
        <p className="font-mono text-slate-500">{migrationReport}</p>
      </div>
    </div>
  );
};
