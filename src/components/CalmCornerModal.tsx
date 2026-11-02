import React, { useEffect, useState } from 'react';
import { Sound } from '../services/sound';

interface CalmCornerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BREATH_PHRASES = [
  'Hincha la tripa como un globo… toma aire 🌬️',
  'Aguanta el aire un momento… siente la calma ✨',
  'Suelta el aire despacio… muy suavemente 🍃',
  'Tu cuerpo se relaja. Todo está bien. 🙂',
];

export const CalmCornerModal: React.FC<CalmCornerModalProps> = ({ isOpen, onClose }) => {
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    if (!isOpen) return;

    Sound.tone(330, 0.6, 'sine', 0.1);
    const interval = setInterval(() => {
      setPhraseIdx((prev) => (prev + 1) % BREATH_PHRASES.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calm-title"
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="max-w-md w-full text-center text-white flex flex-col items-center">
        <h2 id="calm-title" className="text-2xl font-bold tracking-tight mb-2">
          🫧 Rincón de Calma
        </h2>
        <p className="text-slate-300 text-sm mb-6">
          Respira a tu ritmo. No hay prisa ni exámenes.
        </p>

        {/* Breathing Circle */}
        <div className="relative my-8 flex items-center justify-center">
          <div className="w-48 h-48 rounded-full border-4 border-white/60 flex items-center justify-center animate-breathe shadow-2xl">
            <span className="text-xl font-bold text-white tracking-wide">
              Respira
            </span>
          </div>
        </div>

        <p className="text-lg font-medium min-h-[3rem] px-4 text-sky-200 transition-all duration-300">
          {BREATH_PHRASES[phraseIdx]}
        </p>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white text-slate-900 font-bold rounded-xl shadow-lg hover:bg-slate-100 transition-all active:scale-95 text-base cursor-pointer"
          >
            ✅ Me siento mejor, volver
          </button>
        </div>
      </div>
    </div>
  );
};
