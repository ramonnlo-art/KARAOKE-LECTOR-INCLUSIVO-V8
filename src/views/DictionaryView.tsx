import React, { useState } from 'react';
import { DictionaryItem } from '../types';
import { Storage } from '../services/store';
import { Speech } from '../services/speech';
import { Sound } from '../services/sound';
import { normText } from '../data/localPictos';

interface DictionaryViewProps {
  dictionary: DictionaryItem[];
  onAddWord: (w: string, m: string) => void;
  onRemoveWord: (w: string) => void;
  onToast: (msg: string) => void;
}

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  dictionary,
  onAddWord,
  onRemoveWord,
  onToast,
}) => {
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    onAddWord(newWord.trim(), newMeaning.trim());
    setNewWord('');
    setNewMeaning('');
    Sound.ok();
    onToast(`📖 «${newWord.trim()}» añadida a tu diccionario`);
  };

  const cleanQuery = normText(searchQuery);
  const filtered = dictionary.filter((d) => {
    if (!cleanQuery) return true;
    return normText(d.w).includes(cleanQuery) || normText(d.m).includes(cleanQuery);
  });

  return (
    <div className="space-y-6">
      {/* Title & Add Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📖</span> Mi Diccionario Personal
          </h2>
          <p className="text-xs text-slate-500">
            Colección de palabras descubiertas en tus lecturas con su pictograma y significado.
          </p>
        </div>

        {/* Add new word form */}
        <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            placeholder="Palabra nueva (ej: constelación)..."
            className="sm:w-1/3 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs md:text-sm font-bold text-slate-900 focus:outline-blue-500"
          />
          <input
            type="text"
            value={newMeaning}
            onChange={(e) => setNewMeaning(e.target.value)}
            placeholder="Significado o qué significa para ti..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs md:text-sm text-slate-900 focus:outline-blue-500 font-medium"
          />
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
          >
            ➕ Añadir
          </button>
        </form>
      </div>

      {/* Search & List */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-bold text-slate-500">
            {filtered.length} de {dictionary.length} palabras guardadas
          </span>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Filtrar en el diccionario..."
            className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-blue-500"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <span className="text-4xl">📚</span>
            <p className="text-sm">Tu diccionario está vacío o no hay palabras que coincidan con la búsqueda.</p>
            <p className="text-xs text-slate-400">Guarda palabras desde la vista «Palabras» de cualquier lectura.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((item) => (
              <div
                key={item.w}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors px-2 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 shrink-0"
                    dangerouslySetInnerHTML={{ __html: Storage.getAnyPictoSvg(item.w) }}
                  />
                  <div>
                    <h3 className="font-extrabold text-sm md:text-base text-slate-900 capitalize">
                      {item.w}
                    </h3>
                    <p className="text-xs text-slate-600 font-medium">
                      {item.m || <span className="italic text-slate-400">Sin significado anotado</span>}
                    </p>
                    <span className="text-[10px] text-slate-400 font-mono">{item.date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      Sound.click();
                      Speech.say(item.w, 0.85);
                    }}
                    className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    title="Escuchar pronunciación"
                  >
                    🔊
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      Sound.click();
                      onRemoveWord(item.w);
                    }}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    title="Eliminar palabra del diccionario"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
