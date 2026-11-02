import React, { useState } from 'react';
import { ReadingText } from '../types';
import { Sound } from '../services/sound';

interface ReviewViewProps {
  text: ReadingText | null;
  onUpdateText: (updated: ReadingText) => void;
  onToast: (msg: string) => void;
  onNavigate: (view: 'biblioteca') => void;
}

export const ReviewView: React.FC<ReviewViewProps> = ({
  text,
  onUpdateText,
  onToast,
  onNavigate,
}) => {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [replaceWordInput, setReplaceWordInput] = useState('');
  const [fragOriginal, setFragOriginal] = useState('');
  const [fragNew, setFragNew] = useState('');
  const [globalText, setGlobalText] = useState(text?.text || '');
  const [undoStack, setUndoStack] = useState<string[]>([]);

  if (!text) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
        <span className="text-5xl">🔧</span>
        <h3 className="text-xl font-bold text-slate-800">Elige primero una lectura para revisar y corregir</h3>
        <button
          type="button"
          onClick={() => onNavigate('biblioteca')}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 cursor-pointer"
        >
          Ir a Biblioteca
        </button>
      </div>
    );
  }

  const tokens = text.text.split(/(\s+)/);

  const pushUndo = () => {
    setUndoStack((prev) => [...prev, text.text]);
  };

  const handleSelectWord = (w: string) => {
    Sound.click();
    setSelectedWord(w);
    setReplaceWordInput(w.replace(/[.,;:]/g, ''));
  };

  const handleReplaceOne = () => {
    if (!selectedWord || !replaceWordInput.trim()) return;
    pushUndo();
    const idx = text.text.indexOf(selectedWord);
    if (idx === -1) return;
    const newText = text.text.slice(0, idx) + replaceWordInput.trim() + text.text.slice(idx + selectedWord.length);
    onUpdateText({ ...text, text: newText });
    setGlobalText(newText);
    Sound.ok();
    onToast(`✅ «${selectedWord}» sustituida por «${replaceWordInput}»`);
  };

  const handleReplaceAll = () => {
    if (!selectedWord || !replaceWordInput.trim()) return;
    pushUndo();
    const newText = text.text.split(selectedWord).join(replaceWordInput.trim());
    onUpdateText({ ...text, text: newText });
    setGlobalText(newText);
    Sound.ok();
    onToast(`✅ Todas las apariciones de «${selectedWord}» han sido sustituidas`);
  };

  const handleReplaceFragment = () => {
    if (!fragOriginal.trim() || !fragNew.trim()) return;
    if (!text.text.includes(fragOriginal.trim())) {
      onToast('⚠️ Fragmento no encontrado en el texto');
      Sound.bad();
      return;
    }
    pushUndo();
    const newText = text.text.split(fragOriginal.trim()).join(fragNew.trim());
    onUpdateText({ ...text, text: newText });
    setGlobalText(newText);
    setFragOriginal('');
    setFragNew('');
    Sound.ok();
    onToast('✅ Fragmento sustituido correctamente');
  };

  const handleGlobalApply = () => {
    pushUndo();
    onUpdateText({ ...text, text: globalText.trim() });
    Sound.ok();
    onToast('✅ Corrección global aplicada');
  };

  const handleUndo = () => {
    if (undoStack.length === 0) {
      onToast('Nada que deshacer');
      return;
    }
    const previous = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    onUpdateText({ ...text, text: previous });
    setGlobalText(previous);
    Sound.click();
    onToast('↩️ Cambios deshechos');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🔧</span> Revisar y corregir lectura
          </h2>
          <p className="text-xs text-slate-500">
            Lectura actual: <b className="text-slate-800">{text.title}</b>
          </p>
        </div>
        <button
          type="button"
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>↩️</span> Deshacer
        </button>
      </div>

      {/* Interactive Word Inspection Box */}
      <div className="bg-white rounded-2xl p-6 border-2 border-slate-300 shadow-inner">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Toca cualquier palabra del texto para seleccionarla y corregirla:
        </h3>
        <div className="leading-loose text-lg font-semibold text-slate-800 select-none">
          {tokens.map((tk, idx) => {
            if (/^\s+$/.test(tk)) return <span key={idx}>{tk}</span>;
            const isSelected = selectedWord === tk;
            return (
              <span
                key={idx}
                onClick={() => handleSelectWord(tk)}
                className={`px-1 rounded-md cursor-pointer transition-colors ${
                  isSelected ? 'bg-amber-300 text-slate-950 font-black shadow-xs ring-2 ring-amber-400' : 'hover:bg-blue-100'
                }`}
              >
                {tk}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Replace Word */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
            <span>✏️</span> Corregir palabra seleccionada
          </h3>
          <p className="text-xs text-slate-500">
            Palabra actual: <b className="text-blue-700 font-bold">{selectedWord || '(ninguna seleccionada)'}</b>
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={replaceWordInput}
              onChange={(e) => setReplaceWordInput(e.target.value)}
              placeholder="Nueva palabra..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
            />
            <button
              type="button"
              onClick={handleReplaceOne}
              disabled={!selectedWord}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Solo esta
            </button>
            <button
              type="button"
              onClick={handleReplaceAll}
              disabled={!selectedWord}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              Todas
            </button>
          </div>
        </div>

        {/* Replace Fragment */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
            <span>✂️</span> Corregir fragmento o frase
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={fragOriginal}
              onChange={(e) => setFragOriginal(e.target.value)}
              placeholder="Texto original..."
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
            />
            <input
              type="text"
              value={fragNew}
              onChange={(e) => setFragNew(e.target.value)}
              placeholder="Nuevo texto..."
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium"
            />
          </div>
          <button
            type="button"
            onClick={handleReplaceFragment}
            disabled={!fragOriginal.trim()}
            className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Sustituir fragmento
          </button>
        </div>
      </div>

      {/* Global Text Edit */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
          <span>📝</span> Edición global del texto completo
        </h3>
        <textarea
          rows={5}
          value={globalText}
          onChange={(e) => setGlobalText(e.target.value)}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs md:text-sm text-slate-900 leading-relaxed font-sans"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleGlobalApply}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
          >
            💾 Aplicar cambios al texto
          </button>
        </div>
      </div>
    </div>
  );
};
