import React, { useState } from 'react';
import { ViewType } from '../types';
import { Sound } from '../services/sound';
import { Speech } from '../services/speech';
import { Storage } from '../services/store';

interface ActivitiesViewProps {
  currentSubActivity: ViewType | null;
  onSelectActivity: (act: ViewType) => void;
  onBackToActivitiesHub: () => void;
  onRecordProgress: (title: string, mode: string, hits: number, total: number) => void;
  onToast: (msg: string) => void;
}

export const ActivitiesView: React.FC<ActivitiesViewProps> = ({
  currentSubActivity,
  onSelectActivity,
  onBackToActivitiesHub,
  onRecordProgress,
  onToast,
}) => {
  // Activity 1: Gym
  const gymSets: Record<number, string[]> = {
    1: ['sol', 'pan', 'mar', 'casa', 'mesa', 'gato', 'luna', 'pato', 'flor', 'reloj'],
    2: ['pelota', 'manzana', 'ventana', 'camino', 'zapato', 'mariposa', 'gallina', 'cuaderno', 'estrella', 'caballo'],
    3: ['murciélago', 'biblioteca', 'ferrocarril', 'extraordinario', 'constelación', 'refrigerador', 'maravilloso', 'electricidad'],
  };
  const [gymLevel, setGymLevel] = useState<1 | 2 | 3>(1);
  const [gymIdx, setGymIdx] = useState(0);
  const [gymIsRunning, setGymIsRunning] = useState(false);
  const [gymT0, setGymT0] = useState(0);
  const [gymCount, setGymCount] = useState(0);
  const [gymFeedback, setGymFeedback] = useState<string | null>(null);

  // Activity 2: Lab
  const [labConsonant, setLabConsonant] = useState('m');
  const [labVowel, setLabVowel] = useState('a');
  const labExamples: Record<string, [string, string]> = {
    ma: ['mamá', '👩'], me: ['mesa', '🪑'], mi: ['mirar', '👀'], mo: ['mono', '🐵'], mu: ['mundo', '🌍'],
    pa: ['pan', '🍞'], pe: ['perro', '🐶'], pi: ['pintar', '🖌️'], po: ['pollo', '🐔'], pu: ['puerta', '🚪'],
    la: ['lápiz', '✏️'], le: ['leer', '📖'], li: ['libro', '📚'], lo: ['lobo', '🐺'], lu: ['luna', '🌙'],
    sa: ['sal', '🧂'], se: ['semilla', '🌱'], si: ['silla', '🪑'], so: ['sol', '☀️'], su: ['subir', '⬆️'],
    ta: ['taza', '☕'], te: ['tren', '🚆'], ti: ['tijeras', '✂️'], to: ['tomate', '🍅'], tu: ['tumba', '🪦'],
    da: ['dar', '🎁'], de: ['dedo', '👆'], di: ['dibujar', '🎨'], do: ['dos', '2️⃣'], du: ['ducha', '🚿'],
  };

  // Activity 3: Build words
  const buildItems = [
    { w: 'CASA', s: ['CA', 'SA'], p: 'casa' },
    { w: 'PERRO', s: ['PE', 'RRO'], p: 'perro' },
    { w: 'PELOTA', s: ['PE', 'LO', 'TA'], p: 'pelota' },
    { w: 'MANZANA', s: ['MAN', 'ZA', 'NA'], p: 'manzana' },
    { w: 'ZAPATO', s: ['ZA', 'PA', 'TO'], p: 'zapato' },
    { w: 'MARIPOSA', s: ['MA', 'RI', 'PO', 'SA'], p: 'mariposa' },
    { w: 'ELEFANTE', s: ['E', 'LE', 'FAN', 'TE'], p: 'elefante' },
  ];
  const [buildIdx, setBuildIdx] = useState(0);
  const [buildSelected, setBuildSelected] = useState<string[]>([]);
  const [buildFeedback, setBuildFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // Activity 4: Order sentences
  const orderItems = [
    'El perro corre rápido',
    'La niña come una manzana',
    'El sol brilla en el cielo',
    'Me gusta leer cuentos',
    'El gato duerme en la cama',
    'Mi mamá me quiere mucho',
  ];
  const [orderIdx, setOrderIdx] = useState(0);
  const [orderSelected, setOrderSelected] = useState<string[]>([]);
  const [orderFeedback, setOrderFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // Activity 5: Detectives
  const detectiveItems = [
    { bad: 'El pero corre por el parke.', good: ['perro', 'parque'] },
    { bad: 'La kasa tiene una bentana.', good: ['casa', 'ventana'] },
    { bad: 'Mi ermano lee un livro.', good: ['hermano', 'libro'] },
    { bad: 'El sol yía mucho por el día.', good: ['brilla', 'día'] },
  ];
  const [detIdx, setDetIdx] = useState(0);
  const [detFixed, setDetFixed] = useState<Record<string, boolean>>({});

  // Activity 6: Ladder
  const ladderSentences = [
    'El perro juega en el parque',
    'La flor crece con el agua',
    'Mi amigo lee un libro',
    'El gato duerme en la silla',
  ];
  const [ladderIdx, setLadderIdx] = useState(0);
  const [ladderStep, setLadderStep] = useState(1);

  // Activity 7: Memory
  const memoryPool = ['casa', 'perro', 'gato', 'sol', 'luna', 'pelota', 'árbol', 'flor', 'pan', 'libro'];
  const [memLevel, setMemLevel] = useState<3 | 4>(3);
  const [memTargets, setMemTargets] = useState<string[]>([]);
  const [memHidden, setMemHidden] = useState(false);
  const [memPicked, setMemPicked] = useState<string[]>([]);
  const [memFeedback, setMemFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // Activity 8: Dictado
  const dictadoWords = ['casa', 'sol', 'perro', 'gato', 'luna', 'pelota', 'árbol', 'manzana', 'libro', 'pájaro'];
  const [dictadoIdx, setDictadoIdx] = useState(0);
  const [dictadoTarget, setDictadoTarget] = useState('casa');
  const [dictadoFeedback, setDictadoFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // Activity 9: Cadena
  const cadenaPairs = [
    { prev: 'CASA', syl: 'SA', next: 'SACO', distractors: ['MESA', 'PATO'] },
    { prev: 'SACO', syl: 'CO', next: 'COCO', distractors: ['LUNA', 'GATO'] },
    { prev: 'LUNA', syl: 'NA', next: 'NARIZ', distractors: ['PERRO', 'TREN'] },
    { prev: 'PATO', syl: 'TO', next: 'TOMATE', distractors: ['BARCO', 'SOL'] },
    { prev: 'GATO', syl: 'TO', next: 'TORTUGA', distractors: ['CASA', 'PAN'] },
  ];
  const [cadIdx, setCadIdx] = useState(0);
  const [cadFeedback, setCadFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // Activity 10: Intrusa
  const intrusaCats = [
    { cat: 'Animales', words: ['perro', 'gato', 'pájaro', 'mesa'], intrusa: 'mesa' },
    { cat: 'Frutas', words: ['manzana', 'pera', 'plátano', 'coche'], intrusa: 'coche' },
    { cat: 'Ropa', words: ['camisa', 'pantalón', 'zapato', 'manzana'], intrusa: 'manzana' },
    { cat: 'Transportes', words: ['coche', 'autobús', 'tren', 'flor'], intrusa: 'flor' },
  ];
  const [intIdx, setIntIdx] = useState(0);
  const [intFeedback, setIntFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // Activity 11: Rimas
  const rimasPairs = [
    { word: 'gato', correct: 'plato', wrong: ['mesa', 'sol'] },
    { word: 'luna', correct: 'cuna', wrong: ['perro', 'flor'] },
    { word: 'sol', correct: 'caracol', wrong: ['casa', 'lápiz'] },
    { word: 'casa', correct: 'masa', wrong: ['árbol', 'agua'] },
    { word: 'canción', correct: 'avión', wrong: ['gato', 'pan'] },
  ];
  const [rimIdx, setRimIdx] = useState(0);
  const [rimFeedback, setRimFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  // Hub of 12 cards
  const hubList: { id: ViewType; icon: string; title: string; skill: string; desc: string }[] = [
    { id: 'gym', icon: '🏋️', title: 'Gimnasio Lector', skill: 'Fluidez y velocidad', desc: 'Series graduadas de palabras con cronómetro PPM.' },
    { id: 'lab', icon: '🔬', title: 'Laboratorio de Sílabas', skill: 'Conciencia silábica', desc: 'Combina consonantes y vocales con audio e imágenes.' },
    { id: 'build', icon: '🧩', title: 'Formar Palabras', skill: 'Decodificación', desc: 'Une las sílabas correctas a partir del pictograma.' },
    { id: 'order', icon: '📝', title: 'Ordenar Frases', skill: 'Sintaxis y estructura', desc: 'Construye frases con sentido colocando las palabras.' },
    { id: 'detective', icon: '🕵️', title: 'Detectives Ortográficos', skill: 'Discriminación ortográfica', desc: 'Encuentra las erratas y escribe la palabra correcta.' },
    { id: 'ladder', icon: '🪜', title: 'Lectura en Escalera', skill: 'Amplitud de campo visual', desc: 'Lectura sintagmática progresiva paso a paso.' },
    { id: 'retos', icon: '🎯', title: 'Retos Sorpresa', skill: 'Comprensión global', desc: 'Preguntas aleatorias de historias con estrellas.' },
    { id: 'memory', icon: '🔤', title: 'Memoria Visual & TEA', skill: 'Memoria de trabajo', desc: 'Recuerda los pictogramas observados.' },
    { id: 'dictado', icon: '🎨', title: 'Dictado con Pictos', skill: 'Asociación fonema-imagen', desc: 'Escucha la palabra y toca su imagen correcta.' },
    { id: 'cadena', icon: '🔗', title: 'Cadena de Palabras', skill: 'Conciencia fonológica', desc: 'Encadena palabras uniendo la última sílaba.' },
    { id: 'intrusa', icon: '🎯', title: 'La Palabra Intrusa', skill: 'Categorización semántica', desc: 'Descubre la palabra que no pertenece al grupo.' },
    { id: 'rimas', icon: '🎵', title: 'Rimas Fonológicas', skill: 'Discriminación auditiva', desc: 'Escucha y selecciona la palabra que rima.' },
  ];

  // If on Hub
  if (!currentSubActivity || currentSubActivity === 'actividades') {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>🎮</span> Actividades Didácticas de Lectoescritura
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            12 actividades inclusivas y no competitivas diseñadas para potenciar la ruta fonológica, la fluidez y la comprensión lectora.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {hubList.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                Sound.click();
                onSelectActivity(item.id);
              }}
              className="bg-white rounded-2xl p-5 border-2 border-slate-200/90 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group active:scale-95"
            >
              <div>
                <span className="text-4xl block mb-2 group-hover:scale-110 transition-transform">{item.icon}</span>
                <h3 className="font-extrabold text-base text-slate-900 leading-tight mb-1">{item.title}</h3>
                <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full inline-block mb-2">
                  {item.skill}
                </span>
                <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
              </div>
              <button
                type="button"
                className="w-full py-2 bg-slate-100 group-hover:bg-blue-600 group-hover:text-white font-bold text-xs rounded-xl transition-colors text-slate-700 cursor-pointer"
              >
                Jugar ahora ▶️
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- SUB-ACTIVITIES RENDERERS ---

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
        <button
          type="button"
          onClick={() => {
            Sound.click();
            onBackToActivitiesHub();
          }}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <span>⬅️</span> Volver a Actividades
        </button>
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Actividad en curso</span>
      </div>

      {/* 1. GYM */}
      {currentSubActivity === 'gym' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-center">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <span>🏋️</span> Gimnasio de Fluidez Lectora
            </h3>
            <select
              value={gymLevel}
              onChange={(e) => {
                setGymLevel(Number(e.target.value) as 1 | 2 | 3);
                setGymIsRunning(false);
              }}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-xs cursor-pointer"
            >
              <option value="1">Nivel 1 (Palabras cortas)</option>
              <option value="2">Nivel 2 (Palabras medias)</option>
              <option value="3">Nivel 3 (Palabras largas)</option>
            </select>
          </div>

          <div className="py-12 px-6 rounded-2xl bg-blue-50/60 border-2 border-blue-200 min-h-[160px] flex items-center justify-center">
            <span className="text-3xl md:text-5xl font-black text-slate-900 tracking-wide">
              {gymIsRunning ? gymSets[gymLevel][gymIdx] : 'Pulsa ▶️ para entrenar'}
            </span>
          </div>

          {gymFeedback && (
            <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl font-bold text-sm">
              {gymFeedback}
            </div>
          )}

          <div className="flex items-center justify-center gap-3">
            {!gymIsRunning ? (
              <button
                type="button"
                onClick={() => {
                  Sound.click();
                  setGymIsRunning(true);
                  setGymIdx(0);
                  setGymCount(0);
                  setGymT0(Date.now());
                  setGymFeedback(null);
                }}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl shadow-md cursor-pointer"
              >
                ▶️ Empezar serie
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    Sound.click();
                    const next = gymIdx + 1;
                    if (next >= gymSets[gymLevel].length) {
                      const secs = Math.round((Date.now() - gymT0) / 1000) || 1;
                      const words = gymCount + 1;
                      const calcPpm = Math.round(words / (secs / 60));
                      setGymIsRunning(false);
                      setGymFeedback(`🎉 ¡Completado! ${words} palabras en ${secs}s (${calcPpm} PPM)`);
                      Sound.win();
                      onRecordProgress('Gimnasio Lector', 'fluidez', words, words);
                    } else {
                      setGymIdx(next);
                      setGymCount((prev) => prev + 1);
                    }
                  }}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md cursor-pointer"
                >
                  Siguiente palabra ➡️
                </button>
                <button
                  type="button"
                  onClick={() => setGymIsRunning(false)}
                  className="px-4 py-3 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  ⏹️ Parar
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 2. LAB */}
      {currentSubActivity === 'lab' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-center">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center justify-center gap-2">
            <span>🔬</span> Laboratorio de Sílabas
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">1. Elige la consonante:</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {['m', 'p', 'l', 's', 't', 'd'].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      Sound.click();
                      setLabConsonant(c);
                    }}
                    className={`w-12 h-12 rounded-xl text-lg font-black border-2 cursor-pointer transition-all ${
                      labConsonant === c ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    {c.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500 mb-2">2. Elige la vocal:</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {['a', 'e', 'i', 'o', 'u'].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      Sound.click();
                      setLabVowel(v);
                    }}
                    className={`w-12 h-12 rounded-xl text-lg font-black border-2 cursor-pointer transition-all ${
                      labVowel === v ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md' : 'bg-slate-100 text-slate-800 border-slate-300'
                    }`}
                  >
                    {v.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Result card */}
          <div className="p-8 bg-blue-50/60 rounded-2xl border-2 border-blue-300 max-w-sm mx-auto space-y-3">
            <span className="text-5xl font-black text-blue-900 tracking-wider">
              {(labConsonant + labVowel).toUpperCase()}
            </span>
            {labExamples[labConsonant + labVowel] && (
              <div className="pt-2">
                <span className="text-5xl block mb-1">{labExamples[labConsonant + labVowel][1]}</span>
                <p className="font-extrabold text-base text-slate-800 capitalize">
                  {labExamples[labConsonant + labVowel][0]}
                </p>
              </div>
            )}
            <div className="flex justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => Speech.say(labConsonant + labVowel, 0.65)}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <span>🔊</span> Oír Sílaba
              </button>
              {labExamples[labConsonant + labVowel] && (
                <button
                  type="button"
                  onClick={() => Speech.say(labExamples[labConsonant + labVowel][0], 0.85)}
                  className="px-4 py-2 bg-slate-200 text-slate-800 font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
                >
                  <span>📝</span> Oír Ejemplo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. BUILD */}
      {currentSubActivity === 'build' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-center">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center justify-center gap-2">
            <span>🧩</span> Formar Palabras con Sílabas
          </h3>

          {/* Picto Target */}
          <div className="space-y-2">
            <div
              className="w-24 h-24 mx-auto"
              dangerouslySetInnerHTML={{ __html: Storage.getAnyPictoSvg(buildItems[buildIdx].p) }}
            />
            <p className="text-xs text-slate-500 font-semibold">Toca las sílabas en orden para formar el nombre:</p>
          </div>

          {/* Slot */}
          <div className="min-h-[64px] max-w-md mx-auto p-3 bg-blue-50/50 border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center gap-2 text-2xl font-black text-blue-900">
            {buildSelected.length === 0 ? <span className="text-slate-300 text-base font-normal">Sílabas seleccionadas...</span> : buildSelected.join(' - ')}
          </div>

          {/* Options */}
          <div className="flex justify-center gap-2 flex-wrap">
            {buildItems[buildIdx].s.map((sy, sIdx) => {
              const isUsed = buildSelected.includes(sy);
              return (
                <button
                  key={sIdx}
                  type="button"
                  disabled={isUsed}
                  onClick={() => {
                    Sound.click();
                    setBuildSelected((prev) => [...prev, sy]);
                  }}
                  className={`px-5 py-3 rounded-xl border-2 font-black text-lg transition-all cursor-pointer ${
                    isUsed ? 'opacity-30 bg-slate-100 text-slate-400 border-slate-200' : 'bg-white hover:bg-blue-50 text-slate-900 border-slate-300 shadow-xs active:scale-95'
                  }`}
                >
                  {sy}
                </button>
              );
            })}
            {['MI', 'TU', 'RA'].map((fake, fIdx) => (
              <button
                key={fIdx}
                type="button"
                onClick={() => {
                  Sound.click();
                  setBuildSelected((prev) => [...prev, fake]);
                }}
                className="px-5 py-3 rounded-xl border-2 font-black text-lg bg-white hover:bg-slate-50 text-slate-800 border-slate-300 shadow-xs active:scale-95 cursor-pointer"
              >
                {fake}
              </button>
            ))}
          </div>

          {buildFeedback && (
            <div className={`p-3 max-w-md mx-auto rounded-xl font-bold text-sm ${buildFeedback.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
              {buildFeedback.text}
            </div>
          )}

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                const isCorrect = buildSelected.join('') === buildItems[buildIdx].w;
                if (isCorrect) {
                  Sound.win();
                  Speech.say(buildItems[buildIdx].w, 0.85);
                  setBuildFeedback({ text: `🎉 ¡Correcto! ${buildItems[buildIdx].w}`, ok: true });
                  onRecordProgress('Formar Palabra', 'sílabas', 1, 1);
                } else {
                  Sound.bad();
                  setBuildFeedback({ text: 'Revisa el orden de las sílabas 💪', ok: false });
                }
              }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md cursor-pointer"
            >
              ✅ Comprobar
            </button>
            <button
              type="button"
              onClick={() => {
                Sound.click();
                setBuildSelected([]);
                setBuildFeedback(null);
              }}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              🔄 Limpiar
            </button>
            <button
              type="button"
              onClick={() => {
                Sound.click();
                setBuildIdx((prev) => (prev + 1) % buildItems.length);
                setBuildSelected([]);
                setBuildFeedback(null);
              }}
              className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Siguiente palabra ➡️
            </button>
          </div>
        </div>
      )}

      {/* 4. ORDER SENTENCES */}
      {currentSubActivity === 'order' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-center">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center justify-center gap-2">
            <span>📝</span> Ordenar Palabras de la Frase
          </h3>

          <div className="min-h-[70px] max-w-lg mx-auto p-4 bg-blue-50/50 border-2 border-dashed border-blue-400 rounded-xl flex items-center justify-center gap-2 text-lg font-black text-slate-900 flex-wrap">
            {orderSelected.length === 0 ? <span className="text-slate-400 text-sm font-normal">Toca las palabras en orden...</span> : orderSelected.join(' ')}
          </div>

          <div className="flex justify-center gap-2 flex-wrap">
            {orderItems[orderIdx].split(' ').map((w, wIdx) => {
              const isUsed = orderSelected.includes(w);
              return (
                <button
                  key={wIdx}
                  type="button"
                  disabled={isUsed}
                  onClick={() => {
                    Sound.click();
                    setOrderSelected((prev) => [...prev, w]);
                  }}
                  className={`px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all cursor-pointer ${
                    isUsed ? 'opacity-30 bg-slate-100 text-slate-400 border-slate-200' : 'bg-white hover:bg-blue-50 text-slate-900 border-slate-300 shadow-xs active:scale-95'
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>

          {orderFeedback && (
            <div className={`p-3 max-w-md mx-auto rounded-xl font-bold text-sm ${orderFeedback.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
              {orderFeedback.text}
            </div>
          )}

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                const isCorrect = orderSelected.join(' ') === orderItems[orderIdx];
                if (isCorrect) {
                  Sound.win();
                  Speech.say(orderItems[orderIdx], 0.85);
                  setOrderFeedback({ text: '🌟 ¡Frase bien construida!', ok: true });
                  onRecordProgress('Ordenar Frases', 'sintaxis', 1, 1);
                } else {
                  Sound.bad();
                  setOrderFeedback({ text: 'Revisa el orden de las palabras 💪', ok: false });
                }
              }}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md cursor-pointer"
            >
              ✅ Comprobar
            </button>
            <button
              type="button"
              onClick={() => {
                Sound.click();
                setOrderSelected([]);
                setOrderFeedback(null);
              }}
              className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              🔄 Limpiar
            </button>
            <button
              type="button"
              onClick={() => {
                Sound.click();
                setOrderIdx((prev) => (prev + 1) % orderItems.length);
                setOrderSelected([]);
                setOrderFeedback(null);
              }}
              className="px-4 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Siguiente frase ➡️
            </button>
          </div>
        </div>
      )}

      {/* 5. DETECTIVES */}
      {currentSubActivity === 'detective' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <span>🕵️</span> Detectives de Errores Ortográficos
            </h3>
            <span className="text-xs text-slate-500 font-semibold">Toca la palabra con error para corregirla</span>
          </div>

          <div className="p-8 bg-slate-50 rounded-2xl border-2 border-slate-300 text-2xl font-bold leading-relaxed text-slate-900">
            {detectiveItems[detIdx].bad.split(' ').map((tok, tIdx) => {
              const cleanTok = tok.replace(/[.,;:]/g, '');
              const matchGood = detectiveItems[detIdx].good.find((g) => g.length >= 3 && (tok.includes(g.slice(0, 3)) || cleanTok.length === g.length));
              const isFixed = matchGood && detFixed[matchGood];

              if (matchGood && !isFixed) {
                return (
                  <span
                    key={tIdx}
                    onClick={() => {
                      const ans = prompt(`¿Cómo se escribe correctamente «${tok}»?`, matchGood);
                      if (ans && ans.trim().toLowerCase() === matchGood.toLowerCase()) {
                        Sound.ok();
                        setDetFixed((prev) => ({ ...prev, [matchGood]: true }));
                        onToast('✅ ¡Bien visto, detective!');
                        onRecordProgress('Detectives', 'ortografía', 1, 1);
                      } else if (ans) {
                        Sound.bad();
                        onToast(`Casi. Se escribe: ${matchGood}`);
                      }
                    }}
                    className="underline decoration-wavy decoration-rose-500 bg-rose-100 text-rose-900 px-1 rounded cursor-pointer mx-1"
                  >
                    {tok}{' '}
                  </span>
                );
              }

              if (isFixed) {
                return <span key={tIdx} className="bg-emerald-100 text-emerald-950 font-black px-1 rounded mx-1">{matchGood}{' '}</span>;
              }

              return <span key={tIdx}>{tok}{' '}</span>;
            })}
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                Sound.click();
                setDetIdx((prev) => (prev + 1) % detectiveItems.length);
                setDetFixed({});
              }}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
            >
              Siguiente reto detective ➡️
            </button>
          </div>
        </div>
      )}

      {/* 6. LADDER */}
      {currentSubActivity === 'ladder' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-center">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center justify-center gap-2">
            <span>🪜</span> Lectura en Escalera Progresiva
          </h3>

          <div className="flex flex-col-reverse gap-3 max-w-lg mx-auto p-4 bg-slate-50 border-2 border-slate-200 rounded-2xl min-h-[180px]">
            {ladderSentences[ladderIdx].split(' ').slice(0, ladderStep).map((_, k, arr) => {
              const textSoFar = arr.slice(0, k + 1).join(' ');
              const isCurrent = k === ladderStep - 1;
              return (
                <div
                  key={k}
                  className={`p-3 rounded-xl border-l-6 font-extrabold text-base md:text-xl transition-all ${
                    isCurrent ? 'bg-amber-300 text-slate-950 border-blue-600 shadow-sm scale-105' : 'bg-white text-slate-600 border-slate-300 opacity-60'
                  }`}
                >
                  {textSoFar}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => {
                const words = ladderSentences[ladderIdx].split(' ').slice(0, ladderStep).join(' ');
                Speech.say(words, 0.8);
              }}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <span>🔊</span> Escuchar escalón
            </button>
            <button
              type="button"
              onClick={() => {
                Sound.click();
                const total = ladderSentences[ladderIdx].split(' ').length;
                if (ladderStep < total) {
                  setLadderStep((prev) => prev + 1);
                } else {
                  Sound.win();
                  setLadderStep(1);
                  setLadderIdx((prev) => (prev + 1) % ladderSentences.length);
                  onRecordProgress('Escalera', 'campo_visual', 1, 1);
                }
              }}
              className="px-5 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Subir escalón ➡️
            </button>
          </div>
        </div>
      )}

      {/* 7. RETOS */}
      {currentSubActivity === 'retos' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 text-center">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center justify-center gap-2">
            <span>🎯</span> Retos Rápidos de Comprensión
          </h3>
          <p className="text-xs text-slate-500">¿Preparado para ganar estrellas de lectura?</p>
          <div className="p-6 bg-blue-50/80 border border-blue-200 rounded-xl max-w-md mx-auto space-y-4">
            <p className="font-extrabold text-base text-slate-900">
              «El gato mira al ratón. El ratón corre a su agujero. El gato se queda mirando.»
            </p>
            <p className="font-bold text-sm text-blue-900">¿Dónde se esconde el ratón?</p>
            <div className="grid grid-cols-1 gap-2">
              {['en el jardín', 'en su agujero', 'en el tejado'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    if (opt === 'en su agujero') {
                      Sound.win();
                      onToast('⭐ ¡Correcto! Ganaste una estrella');
                      onRecordProgress('Retos', 'comprensión', 1, 1);
                    } else {
                      Sound.bad();
                      onToast('Casi. Lee la segunda frase 💪');
                    }
                  }}
                  className="p-3 bg-white hover:bg-blue-100 border border-blue-200 rounded-xl font-bold text-sm text-slate-800 cursor-pointer transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. MEMORY */}
      {currentSubActivity === 'memory' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-center">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2">
              <span>🔤</span> Memoria Visual y Auditiva TEA
            </h3>
            <select
              value={memLevel}
              onChange={(e) => setMemLevel(Number(e.target.value) as 3 | 4)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-xs cursor-pointer"
            >
              <option value="3">3 imágenes (Fácil)</option>
              <option value="4">4 imágenes (Medio)</option>
            </select>
          </div>

          {!memHidden ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-bold">Memoriza estos pictogramas durante unos segundos:</p>
              <div className="flex justify-center gap-4 flex-wrap">
                {memoryPool.slice(0, memLevel).map((w) => (
                  <div key={w} className="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl flex flex-col items-center gap-2">
                    <div className="w-16 h-16" dangerouslySetInnerHTML={{ __html: Storage.getAnyPictoSvg(w) }} />
                    <span className="font-extrabold text-sm text-slate-800 capitalize">{w}</span>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  Sound.click();
                  setMemTargets(memoryPool.slice(0, memLevel));
                  setMemHidden(true);
                  setMemPicked([]);
                  setMemFeedback(null);
                }}
                className="px-6 py-2.5 bg-blue-600 text-white font-extrabold text-sm rounded-xl shadow-md cursor-pointer"
              >
                ¡Listo! Ya los memoricé 🙈
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-500 font-bold">¿Cuáles eran los pictogramas que viste?</p>
              <div className="flex justify-center gap-2 flex-wrap">
                {memoryPool.map((w) => {
                  const isPicked = memPicked.includes(w);
                  return (
                    <button
                      key={w}
                      type="button"
                      onClick={() => {
                        Sound.click();
                        setMemPicked((prev) => (prev.includes(w) ? prev.filter((x) => x !== w) : [...prev, w]));
                      }}
                      className={`p-3 rounded-xl border-2 font-bold text-xs flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        isPicked ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10" dangerouslySetInnerHTML={{ __html: Storage.getAnyPictoSvg(w) }} />
                      <span className="capitalize">{w}</span>
                    </button>
                  );
                })}
              </div>

              {memFeedback && (
                <div className={`p-3 max-w-md mx-auto rounded-xl font-bold text-sm ${memFeedback.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                  {memFeedback.text}
                </div>
              )}

              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    const isAll = memTargets.every((t) => memPicked.includes(t)) && memPicked.length === memTargets.length;
                    if (isAll) {
                      Sound.win();
                      setMemFeedback({ text: '🎉 ¡Perfecto! Recordaste todos los pictogramas.', ok: true });
                      onRecordProgress('Memoria TEA', 'memoria', memTargets.length, memTargets.length);
                    } else {
                      Sound.bad();
                      setMemFeedback({ text: `Casi. Eran: ${memTargets.join(', ')}`, ok: false });
                    }
                  }}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-extrabold text-sm rounded-xl cursor-pointer"
                >
                  ✅ Comprobar
                </button>
                <button
                  type="button"
                  onClick={() => setMemHidden(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  🔄 Jugar otra vez
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9. DICTADO */}
      {currentSubActivity === 'dictado' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-center">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center justify-center gap-2">
            <span>🎨</span> Dictado Fonema - Imagen
          </h3>
          <p className="text-xs text-slate-500 font-semibold">Pulsa para escuchar la palabra y toca la imagen correcta:</p>

          <button
            type="button"
            onClick={() => Speech.say(dictadoWords[dictadoIdx], 0.8)}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-lg rounded-2xl shadow-lg active:scale-95 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <span>🔊</span> Escuchar palabra
          </button>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto pt-2">
            {[dictadoWords[dictadoIdx], dictadoWords[(dictadoIdx + 1) % dictadoWords.length], dictadoWords[(dictadoIdx + 2) % dictadoWords.length], dictadoWords[(dictadoIdx + 3) % dictadoWords.length]]
              .sort(() => Math.random() - 0.5)
              .map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    if (w === dictadoWords[dictadoIdx]) {
                      Sound.win();
                      setDictadoFeedback({ text: `🎉 ¡Correcto! Es ${w}`, ok: true });
                      onRecordProgress('Dictado', 'fonema_imagen', 1, 1);
                      setTimeout(() => {
                        setDictadoIdx((prev) => (prev + 1) % dictadoWords.length);
                        setDictadoFeedback(null);
                      }, 1200);
                    } else {
                      Sound.bad();
                      setDictadoFeedback({ text: 'Escucha otra vez con atención 💪', ok: false });
                    }
                  }}
                  className="p-4 bg-slate-50 hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-400 rounded-2xl flex flex-col items-center gap-2 cursor-pointer transition-all active:scale-95"
                >
                  <div className="w-16 h-16" dangerouslySetInnerHTML={{ __html: Storage.getAnyPictoSvg(w) }} />
                  <span className="font-extrabold text-sm text-slate-800 capitalize">{w}</span>
                </button>
              ))}
          </div>

          {dictadoFeedback && (
            <div className={`p-3 max-w-md mx-auto rounded-xl font-bold text-sm ${dictadoFeedback.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
              {dictadoFeedback.text}
            </div>
          )}
        </div>
      )}

      {/* 10. CADENA */}
      {currentSubActivity === 'cadena' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-center">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center justify-center gap-2">
            <span>🔗</span> Cadena Fonológica de Palabras
          </h3>

          <div className="p-6 bg-blue-50/70 border-2 border-blue-200 rounded-2xl max-w-md mx-auto space-y-2">
            <span className="text-4xl font-black text-blue-950 tracking-wider">
              {cadenaPairs[cadIdx].prev}
            </span>
            <p className="text-xs font-bold text-slate-600">
              Termina en la sílaba: <b className="text-amber-700 font-black text-base">{cadenaPairs[cadIdx].syl}</b>
            </p>
          </div>

          <p className="text-xs text-slate-500 font-semibold">¿Qué palabra empieza con esa misma sílaba?</p>

          <div className="flex justify-center gap-3 flex-wrap">
            {[cadenaPairs[cadIdx].next, ...cadenaPairs[cadIdx].distractors].sort().map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  if (w === cadenaPairs[cadIdx].next) {
                    Sound.win();
                    setCadFeedback({ text: `🎉 ¡Correcto! ${cadenaPairs[cadIdx].prev} ➡️ ${w}`, ok: true });
                    onRecordProgress('Cadena', 'fonología', 1, 1);
                    setTimeout(() => {
                      setCadIdx((prev) => (prev + 1) % cadenaPairs.length);
                      setCadFeedback(null);
                    }, 1400);
                  } else {
                    Sound.bad();
                    setCadFeedback({ text: 'Esa palabra no empieza con esa sílaba 💪', ok: false });
                  }
                }}
                className="px-6 py-3 bg-white hover:bg-blue-50 border-2 border-slate-300 hover:border-blue-500 rounded-xl font-extrabold text-base text-slate-800 cursor-pointer transition-all active:scale-95 shadow-xs"
              >
                {w}
              </button>
            ))}
          </div>

          {cadFeedback && (
            <div className={`p-3 max-w-md mx-auto rounded-xl font-bold text-sm ${cadFeedback.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
              {cadFeedback.text}
            </div>
          )}
        </div>
      )}

      {/* 11. INTRUSA */}
      {currentSubActivity === 'intrusa' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-center">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center justify-center gap-2">
            <span>🎯</span> La Palabra Intrusa
          </h3>
          <p className="text-xs text-slate-500 font-semibold">
            Categoría: <b className="text-blue-700 font-bold text-sm">{intrusaCats[intIdx].cat}</b>. Toca la que NO pertenezca:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
            {intrusaCats[intIdx].words.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  if (w === intrusaCats[intIdx].intrusa) {
                    Sound.win();
                    setIntFeedback({ text: `🎉 ¡Exacto! «${w}» no es de la categoría ${intrusaCats[intIdx].cat}.`, ok: true });
                    onRecordProgress('Intrusa', 'categorización', 1, 1);
                    setTimeout(() => {
                      setIntIdx((prev) => (prev + 1) % intrusaCats.length);
                      setIntFeedback(null);
                    }, 1400);
                  } else {
                    Sound.bad();
                    setIntFeedback({ text: `«${w}» sí pertenece a ${intrusaCats[intIdx].cat}. Busca la intrusa 💪`, ok: false });
                  }
                }}
                className="p-4 bg-slate-50 hover:bg-amber-50 border-2 border-slate-200 hover:border-amber-400 rounded-xl font-extrabold text-base text-slate-800 cursor-pointer capitalize transition-all active:scale-95"
              >
                <div className="w-12 h-12 mx-auto mb-1" dangerouslySetInnerHTML={{ __html: Storage.getAnyPictoSvg(w) }} />
                {w}
              </button>
            ))}
          </div>

          {intFeedback && (
            <div className={`p-3 max-w-md mx-auto rounded-xl font-bold text-sm ${intFeedback.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
              {intFeedback.text}
            </div>
          )}
        </div>
      )}

      {/* 12. RIMAS */}
      {currentSubActivity === 'rimas' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-center">
          <h3 className="font-extrabold text-lg text-slate-900 flex items-center justify-center gap-2">
            <span>🎵</span> Rimas Fonológicas
          </h3>

          <div className="p-6 bg-amber-50/70 border-2 border-amber-300 rounded-2xl max-w-xs mx-auto space-y-1">
            <span className="text-3xl font-black text-amber-950 uppercase">
              {rimasPairs[rimIdx].word}
            </span>
            <button
              type="button"
              onClick={() => Speech.say(rimasPairs[rimIdx].word, 0.85)}
              className="block mx-auto text-xs text-blue-600 font-bold hover:underline cursor-pointer"
            >
              🔊 Escuchar palabra
            </button>
          </div>

          <p className="text-xs text-slate-500 font-semibold">¿Cuál de estas palabras rima con ella?</p>

          <div className="flex justify-center gap-3 flex-wrap">
            {[rimasPairs[rimIdx].correct, ...rimasPairs[rimIdx].wrong].sort().map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  if (w === rimasPairs[rimIdx].correct) {
                    Sound.win();
                    setRimFeedback({ text: `🎉 ¡Correcto! ${rimasPairs[rimIdx].word} rima con ${w}`, ok: true });
                    onRecordProgress('Rimas', 'fonología', 1, 1);
                    setTimeout(() => {
                      setRimIdx((prev) => (prev + 1) % rimasPairs.length);
                      setRimFeedback(null);
                    }, 1400);
                  } else {
                    Sound.bad();
                    setRimFeedback({ text: 'Esa no rima. Escucha la terminación de ambas palabras 💪', ok: false });
                  }
                }}
                className="px-6 py-3 bg-white hover:bg-amber-50 border-2 border-slate-300 hover:border-amber-400 rounded-xl font-extrabold text-base text-slate-800 cursor-pointer capitalize transition-all active:scale-95 shadow-xs"
              >
                {w}
              </button>
            ))}
          </div>

          {rimFeedback && (
            <div className={`p-3 max-w-md mx-auto rounded-xl font-bold text-sm ${rimFeedback.ok ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
              {rimFeedback.text}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
