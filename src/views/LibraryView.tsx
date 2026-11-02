import React, { useState } from 'react';
import { ReadingCategory, ReadingText } from '../types';
import { CATEGORIES } from '../data/preloadTexts';
import { Sound } from '../services/sound';
import { normText } from '../data/localPictos';

interface LibraryViewProps {
  texts: ReadingText[];
  onSelectText: (text: ReadingText) => void;
  onEdit: (text: ReadingText) => void;
  onDuplicate: (text: ReadingText) => void;
  onToggleFavorite: (id: string) => void;
  onRestore60: () => void;
  onNewText: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  texts,
  onSelectText,
  onEdit,
  onDuplicate,
  onToggleFavorite,
  onRestore60,
  onNewText,
}) => {
  const [query, setQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const cleanQuery = normText(query);

  const filtered = texts.filter((t) => {
    if (onlyFavorites && !t.favorite) return false;
    if (selectedLevel !== 'all' && Number(t.level) !== Number(selectedLevel)) return false;
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (cleanQuery) {
      const blob = normText(`${t.title} ${t.text} ${(t.tags || []).join(' ')} ${(t.vocab || []).join(' ')}`);
      if (!blob.includes(cleanQuery)) return false;
    }
    return true;
  });

  const clearFilters = () => {
    Sound.click();
    setQuery('');
    setSelectedLevel('all');
    setSelectedCategory('all');
    setOnlyFavorites(false);
  };

  return (
    <div className="space-y-4">
      {/* Header & Filter Controls */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>📚</span> Biblioteca Multinivel
            </h2>
            <p className="text-xs text-slate-500">
              {filtered.length} de {texts.length} lecturas graduadas disponibles
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onNewText}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>➕</span> Nueva Lectura
            </button>
            <button
              type="button"
              onClick={onRestore60}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
              title="Restaurar las 60 lecturas precargadas de CEIP La Ardila"
            >
              <span>🔄</span> Restaurar 60
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm">
          {/* Search Input */}
          <div className="flex-1 min-w-[180px]">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="🔍 Buscar por palabra, tema..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 text-xs md:text-sm focus:outline-blue-500"
            />
          </div>

          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold text-xs md:text-sm cursor-pointer"
          >
            <option value="all">Todos los niveles</option>
            <option value="0">Nivel 0 (Prelectura / Sílabas)</option>
            <option value="1">Nivel 1 (Lectura Inicial)</option>
            <option value="2">Nivel 2 (Afianzamiento)</option>
            <option value="3">Nivel 3 (Autónoma)</option>
            <option value="4">Nivel 4 (Reflexiva)</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-semibold text-xs md:text-sm cursor-pointer"
          >
            <option value="all">Todas las categorías</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Favorites toggle */}
          <button
            type="button"
            onClick={() => {
              Sound.click();
              setOnlyFavorites(!onlyFavorites);
            }}
            className={`px-3 py-2 rounded-xl text-xs md:text-sm font-bold border transition-all cursor-pointer flex items-center gap-1 ${
              onlyFavorites
                ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>{onlyFavorites ? '⭐' : '☆'}</span> Favoritos
          </button>

          {/* Clear filters */}
          <button
            type="button"
            onClick={clearFilters}
            className="px-3 py-2 rounded-xl text-xs md:text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer"
          >
            🧹 Quitar filtros
          </button>
        </div>
      </div>

      {/* Grid of Books / Texts */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-dashed border-amber-300 space-y-3">
          <span className="text-4xl">🔍</span>
          <h3 className="text-lg font-bold text-slate-800">No se encontraron lecturas con estos filtros</h3>
          <p className="text-slate-500 text-xs">Prueba a buscar otro término o pulsa el botón para limpiar los filtros.</p>
          <button
            type="button"
            onClick={clearFilters}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-xs cursor-pointer"
          >
            Mostrar todas las lecturas
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const wordCount = t.text.split(/\s+/).filter(Boolean).length;
            const preview = t.text
              .replace(/\[picto:([^\]]+)\]/g, '$1')
              .replace(/\[hueco:([^\]]+)\]/g, '____')
              .replace(/\{error:([^|]+)\|[^}]+\}/g, '$1')
              .slice(0, 140);

            return (
              <article
                key={t.id}
                className={`bg-white rounded-2xl p-5 border-2 transition-all hover:-translate-y-1 hover:shadow-md flex flex-col justify-between gap-3 ${
                  t.favorite ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/90'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-extrabold text-base text-slate-900 leading-snug">
                      {t.title}
                    </h3>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(t.id)}
                      className="text-xl leading-none select-none p-1 hover:scale-125 transition-transform cursor-pointer"
                      title={t.favorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                    >
                      {t.favorite ? '⭐' : '☆'}
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap text-[11px] mb-2.5">
                    <span className="px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800">
                      Nivel {t.level}
                    </span>
                    <span className="px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700">
                      {t.category}
                    </span>
                    <span className="text-slate-400 font-medium">·</span>
                    <span className="text-slate-500 font-semibold">{wordCount} pal.</span>
                    {!t.pre && (
                      <span className="px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800">
                        ✏️ Propia
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {preview}…
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectText(t)}
                    className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs shadow-xs active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>📖</span> Leer
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(t)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
                    title="Editar lectura"
                  >
                    ✏️
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicate(t)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs active:scale-95 transition-all cursor-pointer"
                    title="Duplicar para adaptar al alumno"
                  >
                    📑
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
