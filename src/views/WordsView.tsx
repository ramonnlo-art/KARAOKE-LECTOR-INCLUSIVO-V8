import React, { useState } from 'react';
import { DictionaryItem, ReadingText } from '../types';
import { Storage } from '../services/store';
import { Speech } from '../services/speech';
import { Sound } from '../services/sound';
import { normText } from '../data/localPictos';

interface WordsViewProps {
  text: ReadingText | null;
  dictionary: DictionaryItem[];
  onNavigate: (view: 'biblioteca') => void;
  onToast: (msg: string) => void;
  onAddToDictionary: (word: string, meaning?: string) => void;
  onRemoveFromDictionary: (word: string) => void;
}

export const WordsView: React.FC<WordsViewProps> = ({
  text,
  dictionary,
  onNavigate,
  onToast,
  onAddToDictionary,
  onRemoveFromDictionary,
}) => {
  const [newWord, setNewWord] = useState('');
  const [newMeaning, setNewMeaning] = useState('');
  const [dictSearch, setDictSearch] = useState('');

  const vocabWords = text
    ? (text.vocab && text.vocab.length > 0)
      ? text.vocab
      : Array.from(
          new Set(
            text.text
              .split(/\s+/)
              .map((w) => w.replace(/[^\wáéíóúñÁÉÍÓÚÑ]/gi, '').toLowerCase())
              .filter((w) => w.length > 4)
          )
        ).slice(0, 10)
    : [];

  const handleSay = (w: string) => {
    Sound.click();
    Speech.say(w, 0.85);
  };

  const handleAddTextWord = (w: string) => {
    onAddToDictionary(w, '');
    onToast(`📖 «${w}» guardada en Mi Diccionario`);
    Sound.ok();
  };

  const handleManualAddDict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.trim()) return;
    onAddToDictionary(newWord.trim(), newMeaning.trim());
    setNewWord('');
    setNewMeaning('');
    Sound.ok();
    onToast(`📖 «${newWord.trim()}» añadida a tu diccionario`);
  };

  const cleanSearch = normText(dictSearch);
  const filteredDict = dictionary.filter((d) => {
    if (!cleanSearch) return true;
    return normText(d.w).includes(cleanSearch) || normText(d.m).includes(cleanSearch);
  });

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>📝</span> Palabras & Mi Diccionario
          </h2>
          <p className="text-xs text-slate-500">
            Vocabulario ilustrado de la lectura actual y tu diccionario personal interactivo con pictogramas y voz.
          </p>
        </div>
        {text && (
          <span className="text-xs font-bold px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-xl self-start sm:self-auto">
            Texto actual: «{text.title}»
          </span>
        )}
      </div>

      {/* Two Columns Grid mirroring V7 .g2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Column 1: Palabras del texto actual */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <span>📝</span> Palabras del texto
            </h3>
            {text && (
              <span className="text-xs font-bold text-slate-500">
                {vocabWords.length} términos
              </span>
            )}
          </div>

          {!text ? (
            <div className="p-8 text-center text-slate-400 space-y-3">
              <span className="text-4xl block">📚</span>
              <p className="text-sm font-medium">Selecciona una lectura en la biblioteca para explorar sus palabras.</p>
              <button
                type="button"
                onClick={() => onNavigate('biblioteca')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95"
              >
                Abrir Biblioteca
              </button>
            </div>
          ) : vocabWords.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm">Esta lectura no tiene vocabulario específico definido.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {vocabWords.map((word) => (
                <div
                  key={word}
                  className="bg-slate-50 hover:bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs hover:border-blue-400 hover:shadow-sm transition-all flex flex-col items-center justify-between text-center gap-2"
                >
                  <div
                    className="w-16 h-16 shrink-0 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: Storage.getAnyPictoSvg(word) }}
                  />
                  <span className="font-extrabold text-sm text-slate-900 capitalize tracking-tight">
                    {word}
                  </span>
                  <div className="flex items-center gap-1.5 w-full pt-1">
                    <button
                      type="button"
                      onClick={() => handleSay(word)}
                      className="flex-1 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                      title="Escuchar pronunciación"
                    >
                      <span>🔊</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddTextWord(word)}
                      className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl transition-all cursor-pointer"
                      title="Guardar en Mi Diccionario"
                    >
                      📖 ➕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Mi Diccionario personal */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <span>📖</span> Mi diccionario
            </h3>
            <span className="text-xs font-bold text-slate-500">
              {dictionary.length} palabras
            </span>
          </div>

          {/* Quick Add Form (Word + Meaning + Add) */}
          <form onSubmit={handleManualAddDict} className="flex gap-2 flex-wrap sm:flex-nowrap">
            <input
              type="text"
              required
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              placeholder="Palabra..."
              className="w-full sm:w-1/3 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-blue-500"
            />
            <input
              type="text"
              value={newMeaning}
              onChange={(e) => setNewMeaning(e.target.value)}
              placeholder="Significado..."
              className="w-full sm:flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-blue-500 font-medium"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer shrink-0"
              title="Añadir al diccionario"
            >
              ➕
            </button>
          </form>

          {/* Search filter in dictionary */}
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={dictSearch}
              onChange={(e) => setDictSearch(e.target.value)}
              placeholder="🔍 Buscar en mi diccionario..."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-blue-500"
            />
          </div>

          {/* Dictionary Entries List */}
          <div className="max-h-[380px] overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
            {filteredDict.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1">
                <span className="text-3xl block">📖</span>
                <p className="text-xs">No hay palabras en el diccionario.</p>
                <p className="text-[11px] text-slate-400">Guarda términos desde la columna de la izquierda o escribe una arriba.</p>
              </div>
            ) : (
              filteredDict.map((d) => (
                <div
                  key={d.w}
                  className="flex items-center justify-between gap-3 pt-2.5 pb-1 hover:bg-slate-50/80 px-2 rounded-xl transition-colors"
                >
                  <div
                    className="w-9 h-9 shrink-0 flex items-center justify-center"
                    dangerouslySetInnerHTML={{ __html: Storage.getAnyPictoSvg(d.w) }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-extrabold text-xs text-slate-900 capitalize block truncate">
                      {d.w}
                    </span>
                    {d.m ? (
                      <span className="text-[11px] text-slate-500 block truncate">
                        {d.m}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">Sin definición</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSay(d.w)}
                      className="p-1.5 bg-slate-100 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold cursor-pointer"
                      title="Escuchar"
                    >
                      🔊
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onRemoveFromDictionary(d.w);
                        Sound.click();
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold cursor-pointer"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
