import React, { useEffect, useState, useMemo } from 'react';
import { ReadingText } from '../types';
import { Sound } from '../services/sound';
import { Storage } from '../services/store';

interface ComprehensionViewProps {
  text: ReadingText | null;
  onNavigate: (view: 'biblioteca') => void;
  onToast: (msg: string) => void;
  onRecordHit: () => void;
}

type TabType = 'preguntas' | 'orden' | 'vf' | 'relacionar' | 'huecos' | 'idea';

export const ComprehensionView: React.FC<ComprehensionViewProps> = ({
  text,
  onNavigate,
  onToast,
  onRecordHit,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('preguntas');
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // Sub-states
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [orderedPicked, setOrderedPicked] = useState<string[]>([]);
  const [vfAnswers, setVfAnswers] = useState<Record<number, boolean>>({});
  const [relAnswers, setRelAnswers] = useState<Record<number, string>>({});
  const [clozeAnswers, setClozeAnswers] = useState<Record<number, string>>({});
  const [ideaAnswer, setIdeaAnswer] = useState<string | null>(null);

  // Extract clean sentences
  const sentences = useMemo(() => {
    if (!text) return [];
    return text.text
      .replace(/\[picto:([^\]]+)\]/g, '$1')
      .replace(/\[hueco:([^\]]+)\]/g, '$1')
      .replace(/\{error:([^|]+)\|[^}]+\}/g, '$1')
      .split(/(?<=[.!?…])\s+|\n+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 4);
  }, [text]);

  // Tab definitions
  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'preguntas', label: 'Preguntas', icon: '❓' },
    { id: 'orden', label: 'Ordenar historia', icon: '🔢' },
    { id: 'vf', label: 'Verdadero / Falso', icon: '✅' },
    { id: 'relacionar', label: 'Imagen - Palabra', icon: '🖼️' },
    { id: 'huecos', label: 'Completar texto', icon: '🕳️' },
    { id: 'idea', label: 'Idea principal', icon: '💡' },
  ];

  // VF items with real True and False statements
  const vfItems = useMemo(() => {
    if (!text || !sentences.length) return [];
    const list: { s: string; isTrue: boolean }[] = [];
    sentences.slice(0, 3).forEach((s) => {
      list.push({ s, isTrue: true });
      const ws = s.split(/\s+/);
      const cand = (text.vocab || []).filter((v) => !s.toLowerCase().includes(v.toLowerCase()));
      if (ws.length > 3 && cand.length > 0) {
        const idx = ws.findIndex((w) => w.length > 4);
        if (idx >= 0) {
          const fake = [...ws];
          fake[idx] = cand[0];
          list.push({ s: fake.join(' '), isTrue: false });
        }
      }
    });
    return list.slice(0, 4);
  }, [text, sentences]);

  // Reset state when text changes or tab changes
  const resetTab = () => {
    setUserAnswers({});
    setOrderedPicked([]);
    setVfAnswers({});
    setRelAnswers({});
    setClozeAnswers({});
    setIdeaAnswer(null);
    setFeedback(null);
  };

  useEffect(() => {
    resetTab();
  }, [text, activeTab]);

  if (!text) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
        <span className="text-5xl">🎯</span>
        <h3 className="text-xl font-bold text-slate-800">Elige primero una lectura para comprobar comprensión</h3>
        <p className="text-slate-500 text-sm">Visita la biblioteca para abrir un texto.</p>
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

  // --- Handlers for checking ---
  const handleCheck = () => {
    let hits = 0;
    let total = 0;

    if (activeTab === 'preguntas') {
      const qs = text.questions || [];
      total = qs.length;
      qs.forEach((q, idx) => {
        if (userAnswers[idx] === q[1]) hits++;
      });
    } else if (activeTab === 'orden') {
      const targetSentences = sentences.slice(0, 4);
      total = targetSentences.length;
      if (orderedPicked.length === targetSentences.length && orderedPicked.every((s, i) => s === targetSentences[i])) {
        hits = total;
      }
    } else if (activeTab === 'vf') {
      total = vfItems.length;
      vfItems.forEach((item, idx) => {
        if (vfAnswers[idx] !== undefined && vfAnswers[idx] === item.isTrue) {
          hits++;
        }
      });
    } else if (activeTab === 'relacionar') {
      const vocabList = (text.vocab || []).slice(0, 4);
      total = vocabList.length;
      vocabList.forEach((v, idx) => {
        if ((relAnswers[idx] || '').trim().toLowerCase() === v.trim().toLowerCase()) hits++;
      });
    } else if (activeTab === 'huecos') {
      const vocabList = (text.vocab || []).slice(0, 3);
      total = vocabList.length;
      vocabList.forEach((v, idx) => {
        if ((clozeAnswers[idx] || '').trim().toLowerCase() === v.trim().toLowerCase()) hits++;
      });
    } else if (activeTab === 'idea') {
      total = 1;
      if (ideaAnswer === sentences[0] || ideaAnswer === text.title) hits = 1;
    }

    const isAllGood = hits === total && total > 0;
    if (isAllGood) {
      Sound.win();
      onRecordHit();
      setFeedback({ text: `🎉 ¡Excelente! ${hits} de ${total} aciertos. ¡Has comprendido perfectamente la lectura!`, ok: true });
    } else if (hits > 0) {
      Sound.ok();
      onRecordHit();
      setFeedback({ text: `👏 ¡Buen esfuerzo! Has acertado ${hits} de ${total}. Revisa los fallos.`, ok: true });
    } else {
      Sound.bad();
      setFeedback({ text: `💪 ¡Ánimo! Inténtalo otra vez o pulsa el botón de pista 💡.`, ok: false });
    }

    Storage.addProgress({
      title: text.title,
      textId: text.id,
      mode: `comprendo:${activeTab}`,
      secs: 0,
      ppm: 0,
      words: 0,
      hits,
      total,
      kind: 'comprensión',
    });
  };

  const handleHint = () => {
    Sound.click();
    const hintText = sentences[0] || text.text.slice(0, 70);
    onToast(`💡 Pista del texto: «${hintText.slice(0, 80)}…»`);
  };

  return (
    <div className="space-y-4">
      {/* Title Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>🎯</span> Comprendo lo que leo
            </h2>
            <p className="text-xs text-slate-500">
              Actividades didácticas de comprensión para: <b className="text-slate-800">«{text.title}»</b>
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 self-start sm:self-auto">
            Nivel {text.level} · {text.category}
          </span>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  Sound.click();
                  setActiveTab(tab.id);
                }}
                className={`px-3 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Activity Canvas */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        {/* Tab 1: Multiple Choice Questions */}
        {activeTab === 'preguntas' && (
          <div className="space-y-4">
            {(!text.questions || text.questions.length === 0) ? (
              <p className="text-slate-500 text-sm">Esta lectura no tiene preguntas precargadas.</p>
            ) : (
              text.questions.map((q, idx) => {
                const questionText = q[0];
                const options = q.slice(1);
                return (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <h4 className="font-extrabold text-sm md:text-base text-slate-900">
                      {idx + 1}. {questionText}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                      {options.map((opt, oIdx) => {
                        const isSelected = userAnswers[idx] === opt;
                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => setUserAnswers((prev) => ({ ...prev, [idx]: opt }))}
                            className={`p-3 rounded-xl border text-left text-xs md:text-sm font-bold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Tab 2: Ordering the Story */}
        {activeTab === 'orden' && (
          <div className="space-y-4">
            <p className="text-xs md:text-sm text-slate-600 font-semibold">
              Toca cada frase en el orden en que sucedieron los hechos:
            </p>

            {/* Target Slot */}
            <div className="min-h-[90px] border-2 border-dashed border-blue-400 bg-blue-50/40 rounded-xl p-4 flex flex-col gap-2">
              {orderedPicked.length === 0 ? (
                <span className="text-slate-400 text-xs italic m-auto">
                  Las frases que selecciones se colocarán aquí ordenadas...
                </span>
              ) : (
                orderedPicked.map((phrase, pIdx) => (
                  <div key={pIdx} className="flex items-center gap-2 p-2 bg-white rounded-lg shadow-xs border border-blue-200">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                      {pIdx + 1}
                    </span>
                    <span className="text-xs md:text-sm font-bold text-slate-800">{phrase}</span>
                  </div>
                ))
              )}
            </div>

            {/* Available Chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {sentences.slice(0, 4).map((phrase, pIdx) => {
                const isUsed = orderedPicked.includes(phrase);
                return (
                  <button
                    key={pIdx}
                    type="button"
                    disabled={isUsed}
                    onClick={() => setOrderedPicked((prev) => [...prev, phrase])}
                    className={`px-4 py-2.5 rounded-xl border font-bold text-xs md:text-sm transition-all cursor-pointer ${
                      isUsed
                        ? 'opacity-30 pointer-events-none bg-slate-100 text-slate-400 border-slate-200'
                        : 'bg-white hover:bg-blue-50 text-slate-800 border-slate-300 shadow-xs active:scale-95'
                    }`}
                  >
                    {phrase}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: True / False */}
        {activeTab === 'vf' && (
          <div className="space-y-3">
            {vfItems.map((item, sIdx) => (
              <div key={sIdx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-xs md:text-sm font-bold text-slate-800">
                  {sIdx + 1}. {item.s}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setVfAnswers((prev) => ({ ...prev, [sIdx]: true }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      vfAnswers[sIdx] === true
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    ✅ Verdadero
                  </button>
                  <button
                    type="button"
                    onClick={() => setVfAnswers((prev) => ({ ...prev, [sIdx]: false }))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      vfAnswers[sIdx] === false
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    ❌ Falso
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Match Image with Word */}
        {activeTab === 'relacionar' && (
          <div className="space-y-4">
            <p className="text-xs md:text-sm text-slate-600 font-semibold">
              Empareja cada pictograma con su palabra correspondiente:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(text.vocab || []).slice(0, 4).map((voc, vIdx) => (
                <div key={vIdx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 shrink-0"
                      dangerouslySetInnerHTML={{ __html: Storage.getAnyPictoSvg(voc) }}
                    />
                    <span className="text-xs font-bold text-slate-500">Imagen {vIdx + 1}</span>
                  </div>
                  <select
                    value={relAnswers[vIdx] || ''}
                    onChange={(e) => setRelAnswers((prev) => ({ ...prev, [vIdx]: e.target.value }))}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-xs md:text-sm text-slate-800 cursor-pointer"
                  >
                    <option value="">Selecciona palabra...</option>
                    {(text.vocab || []).map((word) => (
                      <option key={word} value={word}>{word}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Cloze Gaps */}
        {activeTab === 'huecos' && (
          <div className="space-y-4">
            <p className="text-xs md:text-sm text-slate-600 font-semibold">
              Elige la palabra que falta en cada fragmento:
            </p>
            <div className="space-y-3">
              {(text.vocab || []).slice(0, 3).map((v, vIdx) => {
                const s = sentences.find((sent) => sent.toLowerCase().includes(v.toLowerCase())) || `${text.title} ...`;
                const cleanS = s.replace(new RegExp(v, 'i'), '_______');
                return (
                  <div key={vIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <p className="font-bold text-xs md:text-sm text-slate-800">{cleanS}</p>
                    <div className="flex gap-2 flex-wrap pt-1">
                      {[(text.vocab || [])[vIdx], (text.vocab || [])[(vIdx + 1) % (text.vocab?.length || 1)] || 'sol']
                        .filter(Boolean)
                        .map((opt, oIdx) => {
                          const isSel = clozeAnswers[vIdx] === opt;
                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => setClozeAnswers((prev) => ({ ...prev, [vIdx]: opt }))}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                isSel
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 6: Main Idea */}
        {activeTab === 'idea' && (
          <div className="space-y-3">
            <h4 className="font-bold text-sm text-slate-800">
              ¿Cuál es la idea principal de esta historia?
            </h4>
            <div className="space-y-2">
              {[sentences[0] || text.title, 'Es una historia divertida para pasar el tiempo', 'Habla sobre las estrellas en el espacio'].map((idea, iIdx) => {
                const isSelected = ideaAnswer === idea;
                return (
                  <button
                    key={iIdx}
                    type="button"
                    onClick={() => setIdeaAnswer(idea)}
                    className={`w-full p-4 rounded-xl border text-left font-bold text-xs md:text-sm transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                    }`}
                  >
                    {idea}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Feedback Bar */}
        {feedback && (
          <div className={`p-4 rounded-xl text-center font-extrabold text-sm border ${
            feedback.ok ? 'bg-emerald-50 text-emerald-900 border-emerald-300' : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}>
            {feedback.text}
          </div>
        )}

        {/* Actions Toolbar */}
        <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap">
          <button
            type="button"
            onClick={handleCheck}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>✅</span> Comprobar Respuestas
          </button>
          <button
            type="button"
            onClick={resetTab}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs md:text-sm rounded-xl border border-slate-300 active:scale-95 transition-all cursor-pointer"
          >
            🔄 Reiniciar
          </button>
          <button
            type="button"
            onClick={handleHint}
            className="px-4 py-3 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs md:text-sm rounded-xl border border-amber-300 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>💡</span> Pedir Pista
          </button>
        </div>
      </div>
    </div>
  );
};
