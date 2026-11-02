import React from 'react';
import { Sound } from '../services/sound';

interface MasterPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
}

const MASTER_PROMPT_TEXT = `# PROMPT MAESTRO DEFINITIVO · LECTURA INCLUSIVA TEA & DUA

## 1. TU ROL
Actúas como un equipo multidisciplinar: logopeda especialista en TEA, pedagogo de Educación Primaria, maestro de Audición y Lenguaje (AL) y diseñador accesible DUA.

## 2. REGLAS DE LENGUAJE Y ESTRUCTURA COGNITIVA
- Frases cortas y directas: ESTRUCTURA SUJETO + VERBO + COMPLEMENTOS.
- Vocabulario concreto, tangible y literal. Un solo significado por término.
- PROHIBIDO: metáforas abstractas, ironías, dobles sentidos, lenguaje figurado o refranes.
- Longitud adaptada a la memoria de trabajo del alumnado.

## 3. NIVELES DIDÁCTICOS (0 al 4)
- NIVEL 0 (Prelectura / Fonología): 3-6 líneas, 3-5 palabras por frase. Sílabas directas o palabras bisílabas.
- NIVEL 1 (Lectura Inicial): 4-8 frases, 5-7 palabras por frase.
- NIVEL 2 (Afianzamiento): 1 párrafo, 6-12 frases, 8-10 palabras por frase.
- NIVEL 3 (Comprensión autónoma): 2-3 párrafos breves, 10-12 palabras por frase.
- NIVEL 4 (Lectura reflexiva): 3-4 párrafos estructurados, hasta 15 palabras por frase.

## 4. FORMATO OBLIGATORIO DE SALIDA

### TITULO
(Máximo 6 palabras, descriptivo y directo)

### TEXTO
(Una frase por línea, separadas con punto)
Usa etiquetas opcionales:
- [picto:palabra] para acompañar de pictograma
- [hueco:palabra] para palabras a rellenar
- {error:palabra_errónea|palabra_correcta} para detectives de ortografía

### PREGUNTAS
Pregunta|Respuesta Correcta|Distractor 1|Distractor 2

### VOCABULARIO
palabra1, palabra2, palabra3

### PICTOGRAMAS CLAVE
palabra1, palabra2, palabra3

## 5. GENERAR AHORA:
TEMA: [Indica el tema o interés del alumno]
NIVEL: [0, 1, 2, 3 o 4]
CATEGORÍA: [Cuento, Noticia, Instructivo, Poema, Diálogo, etc.]`;

export const MasterPromptModal: React.FC<MasterPromptModalProps> = ({ isOpen, onClose, onToast }) => {
  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(MASTER_PROMPT_TEXT);
      } else {
        const ta = document.createElement('textarea');
        ta.value = MASTER_PROMPT_TEXT;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      Sound.ok();
      onToast('📋 ¡Prompt copiado al portapapeles!');
    } catch {
      onToast('Selecciona y copia con Ctrl+C');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="prompt-title"
      className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        <div className="p-4 bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <div>
              <h2 id="prompt-title" className="font-bold text-lg leading-tight">Prompt Maestro para IA</h2>
              <p className="text-xs text-purple-100">Genera nuevas lecturas en ChatGPT, Claude o Gemini respetando criterios TEA</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-950 text-emerald-300 leading-relaxed whitespace-pre-wrap select-all">
          {MASTER_PROMPT_TEXT}
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopy}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
          >
            <span>📋</span> Copiar Prompt
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
