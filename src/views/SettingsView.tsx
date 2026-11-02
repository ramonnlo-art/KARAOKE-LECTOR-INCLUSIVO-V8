import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Sound } from '../services/sound';
import { Speech } from '../services/speech';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onRestoreDefaults: () => void;
  onExportAll: () => void;
  onImportAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRestore60: () => void;
  onHardReset: () => void;
  onChangeTeacherPass: (newPass: string) => void;
  onToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onRestoreDefaults,
  onExportAll,
  onImportAll,
  onRestore60,
  onHardReset,
  onChangeTeacherPass,
  onToast,
}) => {
  const [newTeacherPass, setNewTeacherPass] = useState('');
  const allVoices = Speech.getAllVoices();

  const handleUpdate = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  const handleChangePass = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeacherPass.trim().length < 4) {
      onToast('⚠️ La contraseña debe tener al menos 4 caracteres');
      Sound.bad();
      return;
    }
    onChangeTeacherPass(newTeacherPass.trim());
    setNewTeacherPass('');
    Sound.ok();
    onToast('🔑 Contraseña docente actualizada');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>⚙️</span> Ajustes de Accesibilidad y Lectura
        </h2>
        <p className="text-xs text-slate-500">
          Personalización inclusiva adaptada a las necesidades sensoriales, cognitivas y motrices del alumnado.
        </p>
      </div>

      {/* 1. Visual & Accessibility */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b pb-2">
          <span>🎨</span> Aspecto Visual y DUA
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Tema Visual</label>
            <select
              value={settings.theme}
              onChange={(e) => handleUpdate('theme', e.target.value as AppSettings['theme'])}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs md:text-sm font-semibold cursor-pointer"
            >
              <option value="t-calmado">Calmado (Suave / TEA)</option>
              <option value="t-claro">Claro Estándar</option>
              <option value="t-oscuro">Modo Oscuro</option>
              <option value="t-contraste">Alto Contraste (Amarillo / Negro)</option>
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Tamaño del texto</label>
              <span className="text-xs font-mono font-bold text-blue-700">{settings.fs}px</span>
            </div>
            <input
              type="range"
              min="18"
              max="56"
              step="2"
              value={settings.fs}
              onChange={(e) => handleUpdate('fs', Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-2 pt-4">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.dys}
                onChange={(e) => handleUpdate('dys', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
              <span>Tipografía Dislexia (Lexend)</span>
            </label>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.anim}
                onChange={(e) => handleUpdate('anim', e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
              <span>Reducir animaciones</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer p-2 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              checked={settings.simple}
              onChange={(e) => handleUpdate('simple', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
            />
            <span>Modo Simplificado</span>
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer p-2 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              checked={settings.pic}
              onChange={(e) => handleUpdate('pic', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
            />
            <span>Mostrar Pictogramas</span>
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer p-2 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              checked={settings.ruler}
              onChange={(e) => handleUpdate('ruler', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
            />
            <span>Regla de Lectura</span>
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer p-2 bg-slate-50 rounded-xl">
            <input
              type="checkbox"
              checked={settings.sy}
              onChange={(e) => handleUpdate('sy', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
            />
            <span>Colores en Sílabas</span>
          </label>
        </div>
      </div>

      {/* 2. Voice & Sounds */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b pb-2">
          <span>🔊</span> Síntesis de Voz y Efectos Sonoros
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Voz del sintetizador</label>
            <select
              value={settings.voiceIdx}
              onChange={(e) => handleUpdate('voiceIdx', Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer"
            >
              {allVoices.map((v, idx) => (
                <option key={idx} value={idx}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700">Tono de voz (Pitch)</label>
              <span className="text-xs font-mono font-bold text-blue-700">{settings.pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="0.6"
              max="1.6"
              step="0.1"
              value={settings.pitch}
              onChange={(e) => handleUpdate('pitch', Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-4 pt-3">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.sound}
                onChange={(e) => {
                  handleUpdate('sound', e.target.checked);
                  Sound.enabled = e.target.checked;
                }}
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
              <span>Efectos de sonido</span>
            </label>

            <button
              type="button"
              onClick={() => Sound.test()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold rounded-xl cursor-pointer"
            >
              🔊 Probar Sonido
            </button>
          </div>
        </div>
      </div>

      {/* 3. Pauses Configuration */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b pb-2">
          <span>⏱️</span> Tiempos de Pausa Didáctica (Milisegundos)
        </h3>
        <p className="text-xs text-slate-500">
          Regula el tiempo que el karaoke espera entre unidades para respetar el procesamiento cognitivo:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Sílabas (ms)</label>
            <input
              type="number"
              step="50"
              min="100"
              max="5000"
              value={settings.ps}
              onChange={(e) => handleUpdate('ps', Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Palabras (ms)</label>
            <input
              type="number"
              step="50"
              min="100"
              max="6000"
              value={settings.pw}
              onChange={(e) => handleUpdate('pw', Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Frases (ms)</label>
            <input
              type="number"
              step="100"
              min="200"
              max="10000"
              value={settings.pf}
              onChange={(e) => handleUpdate('pf', Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Párrafos (ms)</label>
            <input
              type="number"
              step="100"
              min="500"
              max="15000"
              value={settings.pp}
              onChange={(e) => handleUpdate('pp', Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Eco / Guiada (ms)</label>
            <input
              type="number"
              step="500"
              min="1000"
              max="20000"
              value={settings.pe}
              onChange={(e) => handleUpdate('pe', Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onRestoreDefaults}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition-colors"
          >
            🔄 Restaurar pausas por defecto
          </button>
        </div>
      </div>

      {/* 4. Privacy & Backups */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b pb-2">
          <span>🔐</span> Privacidad, Copias de Seguridad y Datos
        </h3>
        <p className="text-xs text-slate-600">
          La aplicación almacena el 100% de los datos de forma local y offline en este dispositivo. Puedes exportar una copia completa en cualquier momento para migrarla a otra tablet, PDI o equipo.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onExportAll}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>📤</span> Exportar Copia de Seguridad Completa (.json)
          </button>

          <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer active:scale-95 transition-all flex items-center gap-1.5">
            <span>📥</span> Importar Copia de Seguridad
            <input type="file" accept=".json" className="hidden" onChange={onImportAll} />
          </label>

          <a
            href="/assets/aistudio/KARAOKE_LECTOR_INCLUSIVO_V8.HTML"
            download="KARAOKE_LECTOR_INCLUSIVO_V8.HTML"
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-extrabold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>🚀</span> Descargar Versión Autónoma v8 (HTML monofichero completo con 16 modos)
          </a>

          <a
            href="/assets/aistudio/KARAOKE5_c591a812.HTML"
            download="KARAOKE5_Original_v7.HTML"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>📜</span> Descargar Versión Original v7 (Archivo histórico intacto)
          </a>

          <a
            href="/assets/aistudio/copia_seguridad_ejemplo.json"
            download="copia_seguridad_ejemplo.json"
            className="px-4 py-2.5 bg-sky-50 hover:bg-sky-100 border border-sky-300 text-sky-900 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>📋</span> Descargar Copia de Ejemplo (.json)
          </a>

          <button
            type="button"
            onClick={onRestore60}
            className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-xl cursor-pointer"
          >
            🔄 Restaurar las 60 lecturas
          </button>

          <button
            type="button"
            onClick={onHardReset}
            className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold text-xs rounded-xl cursor-pointer"
          >
            🗑️ Borrar todos los datos locales
          </button>
        </div>

        {/* Parity & Limitations Note */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 space-y-1">
          <p className="font-bold text-slate-900 flex items-center gap-1">
            <span>ℹ️</span> Comparativa técnica entre la versión Web/React y la versión autónoma HTML v8:
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-600 pl-1">
            <li><strong>Común a ambas:</strong> 60 lecturas completas precargadas, 16 modos de lectura inclusivos, 280 pictogramas locales en SVG/vector, motor de silabación RAE, síntesis de voz con perro guardián anti-congelamiento, soporte táctil para PDI y modo 100% offline.</li>
            <li><strong>Diferencias técnicas:</strong> La aplicación Web/React gestiona múltiples perfiles de aula individualizados en IndexedDB/LocalStorage con gráficos de evolución por alumno, 12 actividades lúdicas avanzadas independientes y conexión en vivo a la API ARASAAC con caché persistente. La versión HTML monofichero v8 consolida todo el código en un único fichero ejecutable sin servidor, almacenando progreso general en localStorage de navegador.</li>
          </ul>
        </div>

        {/* Change teacher password */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-700 mb-1">Cambiar contraseña de la Zona Docente</h4>
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2 font-medium">
            ⚠️ <strong>Aviso de seguridad escolar:</strong> La clave docente (por defecto: <code>ardila</code>) es un mecanismo de conveniencia en cliente para evitar que el alumnado modifique ajustes o textos de forma accidental en la PDI o tablet. Al ejecutarse en el navegador del usuario, no es una barrera criptográfica frente a usuarios con acceso a las herramientas de desarrollo.
          </p>
          <form onSubmit={handleChangePass} className="flex items-center gap-2 max-w-sm">
            <input
              type="text"
              value={newTeacherPass}
              onChange={(e) => setNewTeacherPass(e.target.value)}
              placeholder="Nueva contraseña..."
              className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900"
            />
            <button
              type="submit"
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Guardar clave
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
