import React, { useState } from 'react';
import { EmotionRecord, ReadingText } from '../types';
import { Sound } from '../services/sound';

interface HomeViewProps {
  currentText: ReadingText | null;
  onNavigate: (view: 'leer' | 'biblioteca' | 'comprendo' | 'progreso') => void;
  onStartReading: () => void;
  onOpenCalm: () => void;
  agendaSteps: boolean[];
  onSetAgendaStep: (stepIdx: number) => void;
  onToast: (msg: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  currentText,
  onNavigate,
  onStartReading,
  onOpenCalm,
  agendaSteps,
  onSetAgendaStep,
  onToast,
}) => {
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionRecord['state'] | null>(null);

  const emotions: { state: EmotionRecord['state']; emoji: string; label: string }[] = [
    { state: 'muy bien', emoji: '😄', label: 'Muy bien' },
    { state: 'bien', emoji: '🙂', label: 'Bien' },
    { state: 'regular', emoji: '😐', label: 'Regular' },
    { state: 'triste', emoji: '😢', label: 'Triste' },
    { state: 'enfadado', emoji: '😠', label: 'Enfadado' },
    { state: 'cansado', emoji: '🥱', label: 'Cansado' },
  ];

  const emotionMessages: Record<EmotionRecord['state'], string> = {
    'muy bien': '¡Qué alegría! Hoy va a ser un gran día para descubrir historias.',
    'bien': '¡Genial! Tu cerebro está preparado para leer y disfrutar.',
    'regular': 'Está bien sentirse así a veces. Iremos a tu ritmo, paso a paso.',
    'triste': 'Gracias por compartirlo. Tómate tu tiempo; si lo necesitas, respira en el Rincón de Calma.',
    'enfadado': 'Todas las emociones son válidas. Podemos respirar juntos antes de empezar.',
    'cansado': 'Si estás cansado, leeremos poquito y con pausas tranquilas.',
  };

  const handleSelectEmotion = (state: EmotionRecord['state']) => {
    Sound.tone(520, 0.12);
    setSelectedEmotion(state);
    onSetAgendaStep(0); // Mark check-in as done
  };

  const agendaItems = [
    { num: 1, icon: '👋', title: 'Saludo y check-in', desc: 'Toca la cara que mejor exprese cómo estás hoy.' },
    { num: 2, icon: '📖', title: 'Lectura guiada', desc: 'Escucha o lee la lectura a tu propio ritmo.' },
    { num: 3, icon: '🎯', title: 'Comprensión', desc: 'Responde retos y juegos sobre el texto.' },
    { num: 4, icon: '⭐', title: 'Progreso y estrellas', desc: 'Celebra tu esfuerzo y mira tus estrellas.' },
  ];

  // Calculate First - Then
  const firstUnfinishedIdx = agendaSteps.findIndex((s) => !s);
  const currentStepIdx = firstUnfinishedIdx === -1 ? 3 : firstUnfinishedIdx;
  const nextStepIdx = Math.min(3, currentStepIdx + 1);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-left">
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2 justify-center md:justify-start">
            <span>👋</span> ¡Hola! Vamos a leer juntos
          </h2>
          <p className="text-slate-600 text-sm">
            Sigue la agenda visual. Cada paso tiene su pictograma para que siempre sepas qué viene después.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onStartReading}
            className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md active:scale-95 transition-all text-base flex items-center gap-2 cursor-pointer"
          >
            <span>▶️</span> Empezar a leer
          </button>
          <button
            type="button"
            onClick={() => onNavigate('biblioteca')}
            className="px-4 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200 active:scale-95 transition-all text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <span>📚</span> Elegir lectura
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visual Agenda & First-Then */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <span>🗓️</span> Agenda Visual de Hoy
            </h3>
            <span className="text-xs font-semibold text-slate-500">
              {agendaSteps.filter(Boolean).length} de 4 completados
            </span>
          </div>

          <div className="space-y-3">
            {agendaItems.map((item, idx) => {
              const isDone = agendaSteps[idx];
              const isCurrent = currentStepIdx === idx && !isDone;
              return (
                <div
                  key={item.num}
                  className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                    isDone
                      ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                      : isCurrent
                      ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 text-blue-950'
                      : 'bg-slate-50 border-slate-200/70 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl select-none" aria-hidden="true">{item.icon}</span>
                    <div>
                      <h4 className="font-bold text-sm leading-snug">
                        {item.num}. {item.title}
                      </h4>
                      <p className="text-xs opacity-80">{item.desc}</p>
                    </div>
                  </div>
                  <span className="text-xl shrink-0 select-none" aria-label={isDone ? 'Completado' : 'Pendiente'}>
                    {isDone ? '✅' : isCurrent ? '👉' : '⬜'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Primero - Luego Schedule for Executive Function */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <span>🔁</span> Secuencia: Primero – Luego
            </h4>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <div className="flex-1 min-w-[130px] p-3 rounded-xl bg-blue-50 border-2 border-blue-400 text-center">
                <span className="text-2xl select-none">{agendaItems[currentStepIdx].icon}</span>
                <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wide mt-1">Primero</p>
                <p className="font-extrabold text-sm text-slate-900 leading-tight">{agendaItems[currentStepIdx].title}</p>
              </div>

              <span className="text-2xl text-amber-500 font-bold select-none" aria-hidden="true">➡️</span>

              <div className="flex-1 min-w-[130px] p-3 rounded-xl bg-slate-50 border-2 border-slate-300 text-center">
                <span className="text-2xl select-none">{agendaItems[nextStepIdx].icon}</span>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mt-1">Luego</p>
                <p className="font-bold text-sm text-slate-800 leading-tight">{agendaItems[nextStepIdx].title}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Emotional Check-in & Selected Text */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <span>😊</span> ¿Cómo te sientes ahora?
              </h3>
              <p className="text-xs text-slate-500">Toca tu estado de ánimo para autorregularte.</p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {emotions.map((emo) => {
                const isSelected = selectedEmotion === emo.state;
                return (
                  <button
                    key={emo.state}
                    type="button"
                    onClick={() => handleSelectEmotion(emo.state)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 shadow-sm scale-105'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-3xl select-none leading-none mb-1.5">{emo.emoji}</span>
                    <span className="text-xs font-bold text-slate-700 text-center leading-tight">
                      {emo.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedEmotion && (
              <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 text-center space-y-3 animate-fadeIn">
                <p className="font-bold text-sm text-blue-900">
                  {emotionMessages[selectedEmotion]}
                </p>
                {['regular', 'triste', 'enfadado', 'cansado'].includes(selectedEmotion) ? (
                  <button
                    type="button"
                    onClick={onOpenCalm}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>🫧</span> Ir al Rincón de Calma (2 minutos)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onStartReading}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>▶️</span> ¡Vamos a leer!
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Current Reading Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lectura seleccionada</span>
              <button
                type="button"
                onClick={() => onNavigate('biblioteca')}
                className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Cambiar lectura 📚
              </button>
            </div>

            {currentText ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                    Nivel {currentText.level}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{currentText.category}</span>
                </div>
                <h4 className="font-extrabold text-lg text-slate-900">{currentText.title}</h4>
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {currentText.text.replace(/\[picto:([^\]]+)\]/g, '$1').replace(/\[hueco:([^\]]+)\]/g, '____')}
                </p>
                <div className="pt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('leer')}
                    className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📖</span> Abrir en Karaoke
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('comprendo')}
                    className="px-3 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>🎯</span> Actividades
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-slate-500 space-y-2">
                <p className="text-sm">Aún no has elegido ninguna lectura.</p>
                <button
                  type="button"
                  onClick={() => onNavigate('biblioteca')}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 cursor-pointer"
                >
                  Abrir biblioteca (60 lecturas)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
