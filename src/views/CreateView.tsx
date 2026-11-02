import React, { useState, useEffect } from 'react';
import { ReadingCategory, ReadingLevel, ReadingText } from '../types';
import { CATEGORIES, READING_MODES } from '../data/preloadTexts';
import { Storage } from '../services/store';
import { Sound } from '../services/sound';

interface CreateViewProps {
  initialText: ReadingText | null;
  teacherAuthenticated: boolean;
  onTeacherLogin: (pass: string) => boolean;
  onSaveText: (text: ReadingText) => void;
  onDeleteText: (id: string) => void;
  onCancel: () => void;
  onOpenPromptMaster: () => void;
  onToast: (msg: string) => void;
}

export const CreateView: React.FC<CreateViewProps> = ({
  initialText,
  teacherAuthenticated,
  onTeacherLogin,
  onSaveText,
  onDeleteText,
  onCancel,
  onOpenPromptMaster,
  onToast,
}) => {
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState(false);

  // Form fields
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [level, setLevel] = useState<ReadingLevel>(1);
  const [category, setCategory] = useState<ReadingCategory>('Cuento');
  const [mode, setMode] = useState<string>('silabico');
  const [collection, setCollection] = useState('general');
  const [tags, setTags] = useState('');
  const [text, setText] = useState('');
  const [pauses, setPauses] = useState('');
  const [vocabList, setVocabList] = useState<string[]>([]);
  const [newVocab, setNewVocab] = useState('');
  const [questions, setQuestions] = useState<{ q: string; a: string; b: string; c: string }[]>([]);

  useEffect(() => {
    if (initialText) {
      setId(initialText.id);
      setTitle(initialText.title);
      setLevel(initialText.level);
      setCategory(initialText.category as ReadingCategory);
      setMode(initialText.mode || 'silabico');
      setCollection(initialText.collection || 'general');
      setTags((initialText.tags || []).join(', '));
      setText(initialText.text);
      setPauses(initialText.pauses || '');
      setVocabList(initialText.vocab || []);
      setQuestions(
        (initialText.questions || []).map((q) => ({
          q: q[0] || '',
          a: q[1] || '',
          b: q[2] || '',
          c: q[3] || '',
        }))
      );
    } else {
      setId('');
      setTitle('');
      setLevel(1);
      setCategory('Cuento');
      setMode('silabico');
      setCollection('general');
      setTags('');
      setText('');
      setPauses('');
      setVocabList([]);
      setQuestions([{ q: '', a: '', b: '', c: '' }]);
    }
  }, [initialText]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onTeacherLogin(passwordInput);
    if (!success) {
      setAuthError(true);
      Sound.bad();
    } else {
      setAuthError(false);
      Sound.ok();
    }
  };

  const handleAddQuestion = () => {
    setQuestions((prev) => [...prev, { q: '', a: '', b: '', c: '' }]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddVocab = () => {
    if (!newVocab.trim()) return;
    if (!vocabList.includes(newVocab.trim().toLowerCase())) {
      setVocabList((prev) => [...prev, newVocab.trim().toLowerCase()]);
    }
    setNewVocab('');
  };

  const handleRemoveVocab = (v: string) => {
    setVocabList((prev) => prev.filter((item) => item !== v));
  };

  const handleAutoPictos = () => {
    let replacedText = text;
    let count = 0;
    vocabList.forEach((v) => {
      const regex = new RegExp(`(^|\\s|[.,;:¡!¿?"])${v}($|\\s|[.,;:¡!¿?"])`, 'gi');
      replacedText = replacedText.replace(regex, (match, p1, p2) => {
        count++;
        return `${p1}[picto:${v}]${p2}`;
      });
    });
    setText(replacedText);
    if (count > 0) {
      Sound.ok();
      onToast(`🖼️ ${count} pictogramas insertados automáticamente`);
    } else {
      onToast('Añade palabras de vocabulario que aparezcan en el texto');
    }
  };

  const handleImportTxt = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      const lines = content.split(/\r?\n/).filter((l) => l.trim());
      if (!title && lines[0]) {
        setTitle(lines[0].slice(0, 50));
        setText(lines.slice(1).join('\n'));
      } else {
        setText(content);
      }
      Sound.ok();
      onToast('📂 Archivo .txt importado');
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) {
      onToast('⚠️ Por favor completa el título y el texto');
      Sound.bad();
      return;
    }

    const cleanQuestions = questions
      .filter((q) => q.q.trim() && q.a.trim())
      .map((q) => [q.q.trim(), q.a.trim(), q.b.trim(), q.c.trim()].filter(Boolean));

    const newReadingText: ReadingText = {
      id: id || 'custom_' + Date.now().toString(36),
      title: title.trim(),
      level,
      category,
      mode,
      collection: collection.trim() || 'general',
      tags: tags.split(',').map((s) => s.trim()).filter(Boolean),
      text: text.trim(),
      pauses: pauses.trim(),
      questions: cleanQuestions,
      vocab: vocabList,
      favorite: initialText?.favorite || false,
      pre: initialText?.pre || false,
      own: true,
    };

    onSaveText(newReadingText);
    Sound.ok();
  };

  const handleDelete = () => {
    if (!id) return;
    if (initialText?.pre) {
      onToast('Las 60 lecturas precargadas de CEIP La Ardila no se eliminan. Puedes duplicarla o editarla.');
      return;
    }
    if (confirm(`¿Estás seguro de eliminar la lectura «${title}»?`)) {
      onDeleteText(id);
      Sound.ok();
    }
  };

  // If not teacher authenticated
  if (!teacherAuthenticated) {
    return (
      <div className="bg-white rounded-2xl p-8 max-w-md mx-auto border border-slate-200 shadow-sm space-y-4 text-center">
        <span className="text-4xl">🔒</span>
        <h3 className="font-extrabold text-xl text-slate-900">Zona Docente Protegida</h3>
        <p className="text-xs text-slate-500">
          Para crear o editar lecturas introduce la clave docente (por defecto: <b>profe2024</b>).
        </p>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Introduce contraseña..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-center text-slate-900 focus:outline-blue-500"
          />
          {authError && <p className="text-xs font-bold text-rose-600">Contraseña incorrecta</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl cursor-pointer"
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm rounded-xl cursor-pointer"
            >
              Volver
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Master Prompt Card */}
      <div className="bg-gradient-to-r from-purple-700/10 via-indigo-600/10 to-blue-600/10 border-2 border-purple-500 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✨</span>
          <div>
            <h3 className="font-extrabold text-base text-purple-950">
              Prompt Maestro para Inteligencia Artificial
            </h3>
            <p className="text-xs text-purple-900">
              Copia la plantilla con criterios TEA/DUA para crear cuentos o textos informativos adaptados en ChatGPT, Claude o Gemini.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenPromptMaster}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
        >
          ✨ Ver Prompt Maestro
        </button>
      </div>

      {/* Editor Form */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span>✏️</span> {id ? 'Editar Lectura' : 'Crear Nueva Lectura'}
          </h2>
          <span className="text-xs text-slate-400 font-semibold">{id || 'Nuevo borrador'}</span>
        </div>

        {/* Basic Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Título de la lectura *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: El gato y la mariposa"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-blue-500 font-semibold"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Etiquetas (separadas por coma)</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ej: animales, primavera, proyecto"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:outline-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Nivel didáctico</label>
            <select
              value={level}
              onChange={(e) => setLevel(Number(e.target.value) as ReadingLevel)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold cursor-pointer"
            >
              <option value="0">0 (Prelectura / Sílabas)</option>
              <option value="1">1 (Inicial)</option>
              <option value="2">2 (Afianzamiento)</option>
              <option value="3">3 (Autónoma)</option>
              <option value="4">4 (Reflexiva)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ReadingCategory)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Modo por defecto</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold cursor-pointer"
            >
              {READING_MODES.map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Colección</label>
            <input
              type="text"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              placeholder="general"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-900 font-semibold"
            />
          </div>
        </div>

        {/* Text Area with Tools */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Texto de la lectura * (Escribe una frase por línea)
            </label>
            <div className="flex items-center gap-2">
              <label className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors">
                📂 Importar .txt
                <input type="file" accept=".txt" className="hidden" onChange={handleImportTxt} />
              </label>
              <button
                type="button"
                onClick={handleAutoPictos}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              >
                🖼️ Auto-Pictos
              </button>
            </div>
          </div>

          <textarea
            required
            rows={7}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe el texto aquí. Puedes usar etiquetas como [picto:perro], [hueco:sol] o {error:kasa|casa}..."
            className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-sm text-slate-900 leading-relaxed font-sans focus:outline-blue-500 font-medium"
          />
          <p className="text-[11px] text-slate-500">
            Sintaxis didáctica: <code className="bg-slate-100 px-1 py-0.5 rounded text-blue-700">[picto:palabra]</code> para añadir imagen, <code className="bg-slate-100 px-1 py-0.5 rounded text-amber-700">[hueco:palabra]</code> para cloze, <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-700">{'{error:err|correct}'}</code> para detectives.
          </p>
        </div>

        {/* Vocabulary Manager */}
        <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <label className="text-xs font-bold text-slate-700">Vocabulario clave de la lectura</label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newVocab}
              onChange={(e) => setNewVocab(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVocab())}
              placeholder="Palabra nueva (ej: manzana)..."
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-sm text-slate-900 focus:outline-blue-500"
            />
            <button
              type="button"
              onClick={handleAddVocab}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              ➕ Añadir
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {vocabList.map((v) => (
              <span
                key={v}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-2xs"
              >
                <span>{v}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveVocab(v)}
                  className="text-slate-400 hover:text-rose-600 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Questions Manager */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="font-extrabold text-sm text-slate-800">❓ Preguntas de Comprensión</h3>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold rounded-lg cursor-pointer"
            >
              ➕ Añadir Pregunta
            </button>
          </div>

          {questions.map((q, qIdx) => (
            <div key={qIdx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-xs text-slate-500">Pregunta #{qIdx + 1}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(qIdx)}
                  className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                >
                  🗑️ Eliminar
                </button>
              </div>

              <input
                type="text"
                value={q.q}
                onChange={(e) => {
                  const val = e.target.value;
                  setQuestions((prev) => prev.map((item, i) => (i === qIdx ? { ...item, q: val } : item)));
                }}
                placeholder="Enunciado de la pregunta (ej: ¿Dónde vive el perro?)"
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={q.a}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuestions((prev) => prev.map((item, i) => (i === qIdx ? { ...item, a: val } : item)));
                  }}
                  placeholder="✅ Respuesta correcta"
                  className="bg-emerald-50 border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-bold text-emerald-900"
                />
                <input
                  type="text"
                  value={q.b}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuestions((prev) => prev.map((item, i) => (i === qIdx ? { ...item, b: val } : item)));
                  }}
                  placeholder="Opción 2 (Distractor)"
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                />
                <input
                  type="text"
                  value={q.c}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuestions((prev) => prev.map((item, i) => (i === qIdx ? { ...item, c: val } : item)));
                  }}
                  placeholder="Opción 3 (Distractor)"
                  className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-800"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Guided Pauses */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700">
            Pausas guiadas (Números de frase para detener la voz y reflexionar, ej: 2, 4)
          </label>
          <input
            type="text"
            value={pauses}
            onChange={(e) => setPauses(e.target.value)}
            placeholder="2, 4, 6"
            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold"
          />
        </div>

        {/* Form Action Buttons */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-200 flex-wrap">
          <button
            type="submit"
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>💾</span> Guardar Lectura
          </button>
          {id && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl active:scale-95 transition-all cursor-pointer"
            >
              🗑️ Eliminar
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            ❌ Cancelar
          </button>
        </div>
      </form>
    </div>
  );
};
