import React, { useState } from 'react';
import { PupilProfile, ViewType } from '../types';
import { Sound } from '../services/sound';

interface HeaderProps {
  currentView: ViewType;
  onNavigate: (view: ViewType) => void;
  isSimpleMode: boolean;
  onOpenCalm: () => void;
  currentPupil: string;
  pupils: PupilProfile[];
  onSelectPupil: (name: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  isSimpleMode,
  onOpenCalm,
  currentPupil,
  pupils,
  onSelectPupil,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    Sound.click();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  const navItems: { id: ViewType; label: string; icon: string; simple: boolean }[] = [
    { id: 'inicio', label: 'Inicio', icon: '🏠', simple: true },
    { id: 'leer', label: 'Leer', icon: '📖', simple: true },
    { id: 'biblioteca', label: 'Biblioteca', icon: '📚', simple: true },
    { id: 'comprendo', label: 'Comprendo', icon: '🎯', simple: true },
    { id: 'palabras', label: 'Palabras', icon: '📝', simple: false },
    { id: 'pictos', label: 'Pictos', icon: '🖼️', simple: false },
    { id: 'crear', label: 'Crear', icon: '✏️', simple: false },
    { id: 'revisar', label: 'Revisar', icon: '🔧', simple: false },
    { id: 'actividades', label: 'Actividades', icon: '🎮', simple: false },
    { id: 'progreso', label: 'Progreso', icon: '⭐', simple: true },
    { id: 'ajustes', label: 'Ajustes', icon: '⚙️', simple: false },
    { id: 'profe', label: 'Profe', icon: '👩‍🏫', simple: false },
  ];

  const visibleItems = isSimpleMode
    ? navItems.filter((item) => item.simple)
    : navItems;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-3 py-2 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        {/* Brand & Pupil info */}
        <div className="flex items-center justify-between w-full md:w-auto gap-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl select-none" aria-hidden="true">📖</span>
            <div className="leading-tight">
              <h1 className="font-extrabold text-base md:text-lg text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Karaoke Lector</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">TEA · DUA</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">CEIP La Ardila · Maestro Ramón & Equipo Multidisciplinar</p>
            </div>
          </div>

          {/* Quick utility icons on mobile/desktop */}
          <div className="flex items-center gap-1.5 md:hidden">
            <button
              type="button"
              onClick={onOpenCalm}
              className="p-2 bg-pink-50 border border-pink-200 text-pink-700 rounded-xl font-bold text-sm shadow-xs active:scale-95 cursor-pointer flex items-center"
              title="Rincón de Calma"
              aria-label="Rincón de Calma"
            >
              🫧
            </button>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-sm shadow-xs active:scale-95 cursor-pointer"
              title="Pantalla completa"
              aria-label="Pantalla completa"
            >
              {isFullscreen ? '🗗' : '⛶'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav
          role="navigation"
          aria-label="Navegación principal"
          className="flex flex-wrap items-center justify-center gap-1.5 py-1 w-full lg:w-auto"
        >
          {visibleItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  Sound.click();
                  onNavigate(item.id);
                }}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 border border-slate-200/60'
                }`}
              >
                <span className="text-base leading-none">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Pupil Selector & Tools (Desktop) */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          {/* Pupil Profile Picker */}
          <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700">
            <span className="font-semibold text-slate-500">Alumno:</span>
            <select
              value={currentPupil}
              onChange={(e) => onSelectPupil(e.target.value)}
              className="bg-transparent font-bold text-slate-900 border-none outline-none focus:ring-0 cursor-pointer"
              aria-label="Seleccionar perfil de alumno"
            >
              {pupils.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name} ({p.group})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={onOpenCalm}
            className="px-3 py-1.5 bg-pink-50 hover:bg-pink-100 border border-pink-200 text-pink-700 rounded-xl font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
            title="Rincón de Calma para relajación y respiración"
          >
            <span className="text-base leading-none">🫧</span>
            <span>Calma</span>
          </button>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-xl font-semibold text-xs transition-all cursor-pointer"
            title="Pantalla Completa para PDI o Tablet"
            aria-label="Alternar pantalla completa"
          >
            {isFullscreen ? '🗗 Salir' : '⛶ Pantalla Completa'}
          </button>
        </div>
      </div>
    </header>
  );
};
