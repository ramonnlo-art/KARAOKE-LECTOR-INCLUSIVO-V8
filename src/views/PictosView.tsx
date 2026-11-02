import React, { useState } from 'react';
import { LOCAL_EMOJIS, normText } from '../data/localPictos';
import { Storage } from '../services/store';
import { searchArasaac, savePictoFromUrl } from '../services/arasaac';
import { Speech } from '../services/speech';
import { Sound } from '../services/sound';

interface PictosViewProps {
  onToast: (msg: string) => void;
  onInsertInEditor?: (word: string) => void;
}

export const PictosView: React.FC<PictosViewProps> = ({ onToast, onInsertInEditor }) => {
  const [query, setQuery] = useState('');
  const [isSearchingArasaac, setIsSearchingArasaac] = useState(false);
  const [arasaacResults, setArasaacResults] = useState<{ id: number; word: string; url: string }[]>([]);
  const [sequence, setSequence] = useState<string[]>([]);

  const cleanQuery = normText(query);
  const localKeys = Object.keys(LOCAL_EMOJIS).filter((w) => !cleanQuery || normText(w).includes(cleanQuery));

  // Add to sequence
  const handlePickPicto = (word: string) => {
    Sound.click();
    if (onInsertInEditor) {
      onInsertInEditor(word);
      return;
    }
    if (sequence.length >= 8) {
      onToast('⚠️ Máximo 8 pasos en la secuencia');
      return;
    }
    setSequence((prev) => [...prev, word]);
  };

  const handleClearSequence = () => {
    Sound.click();
    setSequence([]);
  };

  const handleSpeakSequence = () => {
    if (!sequence.length) {
      onToast('Añade primero pictogramas a la tira');
      return;
    }
    Sound.click();
    Speech.say(sequence.join('. '), 0.85);
  };

  // Search ARASAAC
  const handleSearchArasaac = async () => {
    if (!query.trim()) {
      onToast('Escribe una palabra para buscar en ARASAAC');
      return;
    }
    Sound.click();
    setIsSearchingArasaac(true);
    try {
      const results = await searchArasaac(query.trim());
      setArasaacResults(results);
      if (results.length === 0) {
        onToast('No se encontraron imágenes en ARASAAC');
      } else {
        onToast(`✅ ${results.length} pictogramas encontrados en ARASAAC`);
        Sound.ok();
      }
    } catch {
      onToast('⚠️ Error al conectar con ARASAAC');
      Sound.bad();
    } finally {
      setIsSearchingArasaac(false);
    }
  };

  const handleSaveArasaacPicto = async (word: string, url: string) => {
    Sound.click();
    onToast('Guardando pictograma offline…');
    const savedOffline = await savePictoFromUrl(word, url);
    if (savedOffline) {
      onToast(`✅ «${word}» guardado offline en el dispositivo`);
      Sound.ok();
    } else {
      onToast(`⚠️ Guardado como enlace`);
    }
  };

  // Custom photo upload
  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const wordName = prompt('¿Qué palabra o acción representa esta imagen?', file.name.replace(/\.[^/.]+$/, ''));
    if (!wordName || !wordName.trim()) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX = 240;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const compressedData = canvas.toDataURL('image/png');
          await Storage.putPicto(wordName.trim(), `<img src="${compressedData}" alt="${wordName}" class="w-full h-full object-contain" />`);
        } else {
          await Storage.putPicto(wordName.trim(), `<img src="${reader.result}" alt="${wordName}" class="w-full h-full object-contain" />`);
        }
        Sound.ok();
        onToast(`✅ Imagen «${wordName.trim()}» guardada offline`);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Search and tools header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>🖼️</span> Banco de Pictogramas
            </h2>
            <p className="text-xs text-slate-500">
              Banco local offline + buscador en vivo en ARASAAC (CC BY-NC-SA) + subida de fotos del aula
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-xs">
              <span>📤</span> Subir Foto
              <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
            </label>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchArasaac()}
            placeholder="🔍 Buscar pictograma (ej: perro, casa, comer, leer)..."
            className="flex-1 min-w-[200px] bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs md:text-sm text-slate-900 focus:outline-blue-500"
          />
          <button
            type="button"
            onClick={handleSearchArasaac}
            disabled={isSearchingArasaac}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold text-xs md:text-sm rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>🌐</span> {isSearchingArasaac ? 'Buscando…' : 'Buscar en ARASAAC'}
          </button>
        </div>

        {/* External Useful Links */}
        <div className="flex items-center gap-2 flex-wrap pt-1 text-xs text-slate-500">
          <span className="font-semibold">Recursos externos:</span>
          <a
            href="https://www.pictotraductor.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
          >
            🔗 PictoTraductor
          </a>
          <a
            href="https://www.pictofacile.com/es"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
          >
            🔗 PictoFacile
          </a>
          <a
            href="https://www.pictosonidos.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
          >
            🔗 PictoSonidos
          </a>
        </div>
      </div>

      {/* Visual Sequence Strip (Tira de Secuencia Visual para TEA) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-extrabold text-sm md:text-base text-slate-900 flex items-center gap-2">
            <span>🔗</span> Tira de Secuencia Visual (Rutinas y Pasos)
          </h3>
          <span className="text-xs text-slate-500 font-medium">Toca los pictogramas de abajo para añadirlos</span>
        </div>

        <div className="min-h-[100px] border-2 border-dashed border-blue-300 bg-blue-50/30 rounded-xl p-3 flex items-center gap-3 overflow-x-auto">
          {sequence.length === 0 ? (
            <span className="text-slate-400 text-xs italic m-auto select-none">
              Toca pictogramas del banco para construir una tira de anticipación o secuencia...
            </span>
          ) : (
            sequence.map((word, sIdx) => (
              <div
                key={sIdx}
                className="bg-white p-2 rounded-xl border-2 border-blue-200 shadow-xs flex flex-col items-center gap-1 min-w-[76px] shrink-0"
              >
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                  {sIdx + 1}
                </span>
                <div
                  className="w-12 h-12"
                  dangerouslySetInnerHTML={{ __html: Storage.getAnyPictoSvg(word) }}
                />
                <span className="text-[11px] font-bold text-slate-800 capitalize leading-tight">
                  {word}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleSpeakSequence}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>🔊</span> Leer Secuencia en voz alta
          </button>
          <button
            type="button"
            onClick={handleClearSequence}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            🧹 Vaciar
          </button>
        </div>
      </div>

      {/* ARASAAC Results Section (if active) */}
      {arasaacResults.length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <h3 className="font-extrabold text-sm md:text-base text-slate-900 flex items-center gap-2">
            <span>🌐</span> Resultados de ARASAAC para «{query}»
          </h3>
          <p className="text-xs text-slate-500">Toca un pictograma para guardarlo offline en la aplicación:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {arasaacResults.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSaveArasaacPicto(item.word, item.url)}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col items-center gap-2 hover:border-blue-500 hover:shadow-sm cursor-pointer transition-all"
              >
                <img src={item.url} alt={item.word} className="w-16 h-16 object-contain" />
                <span className="text-xs font-bold text-slate-700 text-center leading-tight">
                  {item.word}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Local Offline Bank Grid */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h3 className="font-extrabold text-sm md:text-base text-slate-900 flex items-center gap-2">
            <span>📦</span> Banco Local Offline ({localKeys.length} términos)
          </h3>
          <span className="text-xs text-slate-500">Disponibles sin internet</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 max-h-[460px] overflow-y-auto p-1">
          {localKeys.map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => handlePickPicto(w)}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-300 transition-all flex flex-col items-center gap-1.5 cursor-pointer text-center group active:scale-95"
            >
              <div
                className="w-12 h-12 shrink-0 group-hover:scale-105 transition-transform"
                dangerouslySetInnerHTML={{ __html: Storage.getAnyPictoSvg(w) }}
              />
              <span className="text-[11px] font-bold text-slate-700 capitalize leading-tight line-clamp-1">
                {w}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
