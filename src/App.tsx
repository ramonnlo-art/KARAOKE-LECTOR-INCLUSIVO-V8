import React, { useEffect, useState, useCallback } from 'react';
import { AppSettings, DictionaryItem, ProgressRecord, PupilProfile, ReadingText, ViewType } from './types';
import { Storage, DEFAULT_SETTINGS } from './services/store';
import { Sound } from './services/sound';
import { Header } from './components/Header';
import { Toast } from './components/Toast';
import { CalmCornerModal } from './components/CalmCornerModal';
import { MasterPromptModal } from './components/MasterPromptModal';
import { HomeView } from './views/HomeView';
import { ReaderView } from './views/ReaderView';
import { LibraryView } from './views/LibraryView';
import { ComprehensionView } from './views/ComprehensionView';
import { WordsView } from './views/WordsView';
import { DictionaryView } from './views/DictionaryView';
import { PictosView } from './views/PictosView';
import { CreateView } from './views/CreateView';
import { ReviewView } from './views/ReviewView';
import { ActivitiesView } from './views/ActivitiesView';
import { ProgressView } from './views/ProgressView';
import { SettingsView } from './views/SettingsView';
import { TeacherView } from './views/TeacherView';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('inicio');
  const [texts, setTexts] = useState<ReadingText[]>([]);
  const [currentText, setCurrentText] = useState<ReadingText | null>(null);
  const [dictionary, setDictionary] = useState<DictionaryItem[]>([]);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [pupils, setPupils] = useState<PupilProfile[]>([]);
  const [currentPupil, setCurrentPupil] = useState<string>('General');
  const [teacherAuth, setTeacherAuth] = useState(false);

  // Agenda steps tracking (1: Saludo, 2: Lectura, 3: Comprensión, 4: Progreso)
  const [agendaSteps, setAgendaSteps] = useState<boolean[]>([false, false, false, false]);

  // Modals & Popups
  const [isCalmOpen, setIsCalmOpen] = useState(false);
  const [isPromptMasterOpen, setIsPromptMasterOpen] = useState(false);
  const [countdownNum, setCountdownNum] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? null : curr));
    }, 2800);
  }, []);

  // Initial load & migration
  useEffect(() => {
    Storage.runMigration();
    Storage.loadPictos();
    const loadedTexts = Storage.getTexts();
    setTexts(loadedTexts);
    if (loadedTexts.length > 0) {
      setCurrentText(loadedTexts[0]);
    }
    setDictionary(Storage.getDict());
    setProgress(Storage.getProgress());
    const loadedSettings = Storage.getSettings();
    setSettings(loadedSettings);
    setPupils(Storage.getPupils());
    setCurrentPupil(Storage.getCurrentPupil());
  }, []);

  // Sync Body Classes & CSS Variables with Settings
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    body.className = `${settings.theme} ${settings.dys ? 'f-dys' : ''} ${settings.anim ? 'no-anim' : ''} ${
      settings.sy ? 'sycolor' : ''
    } ${settings.focusMask ? 'focus-mask-on' : ''} min-h-screen`;
    document.documentElement.style.setProperty('--fs', `${settings.fs}px`);
  }, [settings]);

  // Global Keyboard Shortcuts (Space, Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCalmOpen(false);
        setIsPromptMasterOpen(false);
        setCountdownNum(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Start Reading with 3-2-1 countdown
  const handleStartCountdown = () => {
    Sound.tone(440, 0.1);
    setCountdownNum(3);
    const interval = setInterval(() => {
      setCountdownNum((prev) => {
        if (prev === null) return null;
        if (prev > 1) {
          Sound.tone(440, 0.1);
          return prev - 1;
        }
        // When reaches 1 -> start reading
        clearInterval(interval);
        Sound.win();
        setTimeout(() => {
          setCountdownNum(null);
          setCurrentView('leer');
          setAgendaSteps((s) => [s[0], true, s[2], s[3]]);
        }, 500);
        return 0;
      });
    }, 750);
  };

  // Pupil Management
  const handleSelectPupil = (name: string) => {
    setCurrentPupil(name);
    Storage.setCurrentPupil(name);
    showToast(`👤 Alumno activo: ${name}`);
  };

  const handleAddPupil = (name: string, group: string) => {
    const newPupil: PupilProfile = {
      id: 'pupil_' + Date.now().toString(36),
      name,
      group,
    };
    const updated = [...pupils, newPupil];
    setPupils(updated);
    Storage.savePupils(updated);
    handleSelectPupil(name);
  };

  const handleRemovePupil = (id: string) => {
    const updated = pupils.filter((p) => p.id !== id);
    setPupils(updated);
    Storage.savePupils(updated);
  };

  // Text management
  const handleSelectText = (selected: ReadingText) => {
    setCurrentText(selected);
    setCurrentView('leer');
    setAgendaSteps((s) => [s[0], true, s[2], s[3]]);
    showToast(`📖 «${selected.title}» cargada en el Karaoke`);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = texts.map((t) => (t.id === id ? { ...t, favorite: !t.favorite } : t));
    setTexts(updated);
    Storage.saveTexts(updated);
  };

  const handleDuplicateText = (original: ReadingText) => {
    const copy: ReadingText = {
      ...JSON.parse(JSON.stringify(original)),
      id: 'custom_' + Date.now().toString(36),
      title: `${original.title} (Adaptada)`,
      pre: false,
      own: true,
      favorite: false,
    };
    const updated = [...texts, copy];
    setTexts(updated);
    Storage.saveTexts(updated);
    showToast(`📑 Copia «${copy.title}» creada`);
  };

  const handleSaveText = (saved: ReadingText) => {
    const idx = texts.findIndex((t) => t.id === saved.id);
    let updated: ReadingText[];
    if (idx >= 0) {
      updated = texts.map((t) => (t.id === saved.id ? saved : t));
    } else {
      updated = [...texts, saved];
    }
    setTexts(updated);
    Storage.saveTexts(updated);
    setCurrentText(saved);
    setCurrentView('leer');
    showToast(`💾 Lectura «${saved.title}» guardada`);
  };

  const handleDeleteText = (textId: string) => {
    const updated = texts.filter((t) => t.id !== textId);
    setTexts(updated);
    Storage.saveTexts(updated);
    if (currentText?.id === textId) {
      setCurrentText(updated[0] || null);
    }
    setCurrentView('biblioteca');
    showToast('🗑️ Lectura eliminada');
  };

  const handleRestore60 = () => {
    if (confirm('¿Restaurar las 60 lecturas precargadas de CEIP La Ardila conservando tus lecturas propias?')) {
      const restored = Storage.restore60();
      setTexts(restored);
      Sound.ok();
      showToast('✅ Las 60 lecturas graduadas han sido restauradas');
    }
  };

  // Teacher Login
  const handleTeacherLogin = (pass: string) => {
    const expected = Storage.getTeacherPass();
    if (pass === expected) {
      setTeacherAuth(true);
      return true;
    }
    return false;
  };

  // Finish reading session handler
  const handleFinishReading = (stats: { secs: number; ppm: number; words: number }) => {
    if (!currentText) return;
    const newRecord = Storage.addProgress({
      title: currentText.title,
      textId: currentText.id,
      mode: currentText.mode || 'silabico',
      secs: stats.secs,
      ppm: stats.ppm,
      words: stats.words,
      hits: 0,
      kind: 'lectura',
      pupilName: currentPupil,
    });
    setProgress((prev) => [...prev, newRecord]);
    setAgendaSteps((s) => [s[0], true, true, s[3]]);
    Sound.win();
    showToast(`⭐ ¡Enhorabuena! Sesión registrada (${stats.ppm} PPM)`);
    setCurrentView('comprendo');
  };

  // Save teacher observations
  const handleSaveObservation = (recordId: string, obs: string, diffs: string[]) => {
    const updated = progress.map((p) => (p.id === recordId ? { ...p, obs, diffs } : p));
    setProgress(updated);
    Storage.saveProgress(updated);
  };

  // Dictionary handlers
  const handleAddToDictionary = (w: string, m: string = '') => {
    const added = Storage.addDict(w, m);
    if (added) {
      setDictionary(Storage.getDict());
    }
  };

  const handleRemoveFromDictionary = (w: string) => {
    Storage.removeDict(w);
    setDictionary(Storage.getDict());
    showToast(`🗑️ «${w}» eliminada del diccionario`);
  };

  // Backup & Restore
  const handleExportAll = () => {
    const jsonStr = Storage.createFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `karaoke_lector_copia_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast('📥 Copia de seguridad completa descargada');
    Sound.ok();
  };

  const handleImportAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const ok = await Storage.restoreFullBackup(String(reader.result || ''));
      if (ok) {
        setTexts(Storage.getTexts());
        setDictionary(Storage.getDict());
        setProgress(Storage.getProgress());
        setSettings(Storage.getSettings());
        setPupils(Storage.getPupils());
        Sound.ok();
        showToast('✅ Copia de seguridad importada con éxito');
      } else {
        Sound.bad();
        showToast('⚠️ Archivo de copia no válido');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleHardReset = () => {
    if (confirm('⚠️ ATENCIÓN: Se borrarán TODOS los datos locales, progreso y configuraciones. ¿Continuar?')) {
      try {
        localStorage.clear();
        indexedDB.deleteDatabase('kli_pictos_v8');
      } catch {}
      window.location.reload();
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header */}
      <Header
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        isSimpleMode={settings.simple}
        onOpenCalm={() => setIsCalmOpen(true)}
        currentPupil={currentPupil}
        pupils={pupils}
        onSelectPupil={handleSelectPupil}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 transition-all">
        {currentView === 'inicio' && (
          <HomeView
            currentText={currentText}
            onNavigate={(v) => setCurrentView(v)}
            onStartReading={handleStartCountdown}
            onOpenCalm={() => setIsCalmOpen(true)}
            agendaSteps={agendaSteps}
            onSetAgendaStep={(stepIdx) => {
              setAgendaSteps((prev) => {
                const next = [...prev];
                next[stepIdx] = true;
                return next;
              });
            }}
            onToast={showToast}
          />
        )}

        {currentView === 'leer' && (
          <ReaderView
            text={currentText}
            settings={settings}
            onNavigate={(v) => setCurrentView(v)}
            onFinishReading={handleFinishReading}
            onToast={showToast}
          />
        )}

        {currentView === 'biblioteca' && (
          <LibraryView
            texts={texts}
            onSelectText={handleSelectText}
            onEdit={(t) => {
              setCurrentText(t);
              setCurrentView('crear');
            }}
            onDuplicate={handleDuplicateText}
            onToggleFavorite={handleToggleFavorite}
            onRestore60={handleRestore60}
            onNewText={() => {
              setCurrentText(null);
              setCurrentView('crear');
            }}
          />
        )}

        {currentView === 'comprendo' && (
          <ComprehensionView
            text={currentText}
            onNavigate={(v) => setCurrentView(v)}
            onToast={showToast}
            onRecordHit={() => setAgendaSteps((s) => [s[0], s[1], true, s[3]])}
          />
        )}

        {currentView === 'palabras' && (
          <WordsView
            text={currentText}
            dictionary={dictionary}
            onNavigate={(v) => setCurrentView(v)}
            onToast={showToast}
            onAddToDictionary={(w, m) => handleAddToDictionary(w, m)}
            onRemoveFromDictionary={handleRemoveFromDictionary}
          />
        )}

        {currentView === 'diccionario' && (
          <DictionaryView
            dictionary={dictionary}
            onAddWord={handleAddToDictionary}
            onRemoveWord={handleRemoveFromDictionary}
            onToast={showToast}
          />
        )}

        {currentView === 'pictos' && (
          <PictosView onToast={showToast} />
        )}

        {currentView === 'crear' && (
          <CreateView
            initialText={currentText}
            teacherAuthenticated={teacherAuth}
            onTeacherLogin={handleTeacherLogin}
            onSaveText={handleSaveText}
            onDeleteText={handleDeleteText}
            onCancel={() => setCurrentView('biblioteca')}
            onOpenPromptMaster={() => setIsPromptMasterOpen(true)}
            onToast={showToast}
          />
        )}

        {currentView === 'revisar' && (
          <ReviewView
            text={currentText}
            onUpdateText={(updated) => {
              handleSaveText(updated);
            }}
            onToast={showToast}
            onNavigate={(v) => setCurrentView(v)}
          />
        )}

        {/* 12 Activities hub and sub-views */}
        {[
          'actividades', 'gym', 'lab', 'build', 'order', 'detective',
          'ladder', 'retos', 'memory', 'dictado', 'cadena', 'intrusa', 'rimas'
        ].includes(currentView) && (
          <ActivitiesView
            currentSubActivity={currentView}
            onSelectActivity={(act) => setCurrentView(act)}
            onBackToActivitiesHub={() => setCurrentView('actividades')}
            onRecordProgress={(title, actMode, hits, total) => {
              Storage.addProgress({
                title,
                mode: actMode,
                secs: 0,
                ppm: 0,
                words: total,
                hits,
                total,
                kind: 'actividad',
                pupilName: currentPupil,
              });
              setProgress(Storage.getProgress());
            }}
            onToast={showToast}
          />
        )}

        {currentView === 'progreso' && (
          <ProgressView
            progress={progress}
            dictCount={dictionary.length}
            teacherAuthenticated={teacherAuth}
            onSaveObservation={handleSaveObservation}
            onResetProgress={() => {
              Storage.resetProgress();
              setProgress([]);
              showToast('Historial reiniciado');
            }}
            onToast={showToast}
          />
        )}

        {currentView === 'ajustes' && (
          <SettingsView
            settings={settings}
            onUpdateSettings={(updated) => {
              setSettings(updated);
              Storage.saveSettings(updated);
              showToast('💾 Ajustes guardados');
            }}
            onRestoreDefaults={() => {
              setSettings(DEFAULT_SETTINGS);
              Storage.saveSettings(DEFAULT_SETTINGS);
              showToast('Ajustes restaurados por defecto');
            }}
            onExportAll={handleExportAll}
            onImportAll={handleImportAll}
            onRestore60={handleRestore60}
            onHardReset={handleHardReset}
            onChangeTeacherPass={(p) => Storage.setTeacherPass(p)}
            onToast={showToast}
          />
        )}

        {currentView === 'profe' && (
          <TeacherView
            authenticated={teacherAuth}
            onLogin={handleTeacherLogin}
            onLogout={() => {
              setTeacherAuth(false);
              showToast('🔒 Sesión docente cerrada');
            }}
            onNavigate={(v) => setCurrentView(v)}
            progress={progress}
            pupils={pupils}
            onAddPupil={handleAddPupil}
            onRemovePupil={handleRemovePupil}
            migrationReport={Storage.migrationReport}
            onExportReport={() => {
              const full = Storage.createFullBackup();
              const blob = new Blob([full], { type: 'application/json;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `informe_docente_grupo_${new Date().toISOString().slice(0, 10)}.json`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              showToast('📥 Informe docente descargado');
            }}
            onExportCSV={() => {
              const rows: string[][] = [
                ['Fecha', 'Alumno', 'Lectura', 'Modo', 'Segundos', 'PPM', 'Aciertos', 'Dificultades', 'Observaciones'],
              ];
              progress.forEach((p) => {
                rows.push([
                  p.date,
                  p.pupilName || 'General',
                  p.title,
                  p.mode,
                  String(p.secs || 0),
                  String(p.ppm || 0),
                  String(p.hits || 0),
                  (p.diffs || []).join(' / '),
                  (p.obs || '').replace(/[\r\n]+/g, ' '),
                ]);
              });
              const csv = '\uFEFF' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `informe_alumnos_${new Date().toISOString().slice(0, 10)}.csv`;
              document.body.appendChild(a);
              a.click();
              a.remove();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
              showToast('📥 Informe CSV descargado');
            }}
            onToast={showToast}
          />
        )}
      </main>

      {/* Floating Action Button (FAB) for Calm Corner */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsCalmOpen(true)}
          className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-pink-300 via-sky-200 to-indigo-200 shadow-xl border-2 border-white flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-transform cursor-pointer"
          aria-label="Abrir Rincón de Calma"
          title="Rincón de Calma para respirar y relajarse"
        >
          🫧
        </button>
      </div>

      {/* Modals */}
      <CalmCornerModal isOpen={isCalmOpen} onClose={() => setIsCalmOpen(false)} />
      <MasterPromptModal isOpen={isPromptMasterOpen} onClose={() => setIsPromptMasterOpen(false)} onToast={showToast} />

      {/* 3-2-1 Countdown Modal */}
      {countdownNum !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center space-y-4 shadow-2xl animate-scaleIn">
            <h3 className="font-extrabold text-lg text-slate-800">🔔 ¡Nos preparamos para leer!</h3>
            <div className="text-7xl font-black text-blue-600 font-mono my-4">
              {countdownNum > 0 ? countdownNum : '¡Vamos! 🚀'}
            </div>
            <p className="text-xs text-slate-500">Respira hondo y abre bien los ojos.</p>
          </div>
        </div>
      )}

      {/* Toast */}
      <Toast message={toastMsg} />
    </div>
  );
}
