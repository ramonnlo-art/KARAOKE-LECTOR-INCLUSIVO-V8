import { AppSettings, DictionaryItem, ProgressRecord, PupilProfile, ReadingText } from '../types';
import { PRELOADED_TEXTS } from '../data/preloadTexts';
import { getLocalPictoSvg, normText } from '../data/localPictos';

const SCHEMA_VERSION = 8;
const KEYS = {
  version: 'KLI_VERSION',
  texts: 'kli8_texts',
  progress: 'kli8_progress',
  dict: 'kli8_dict',
  settings: 'kli8_settings',
  emotion: 'kli8_emotion',
  backup: 'kli8_legacy_backup',
  pass: 'kli8_pass',
  pupils: 'kli8_pupils',
  currentPupil: 'kli8_current_pupil',
  pictoFallback: 'kli8_picto_fallback',
};

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 't-calmado',
  fs: 30,
  anim: false,
  simple: false,
  dys: false,
  pic: true,
  ruler: true,
  sy: true,
  focusMask: false,
  voiceIdx: 0,
  pitch: 1.0,
  beep: false,
  sound: true,
  ps: 450,
  pw: 600,
  pf: 1000,
  pp: 1800,
  pe: 5000,
  currentPupil: 'General',
};

class StorageService {
  private db: IDBDatabase | null = null;
  public pictoCache: Record<string, string> = {};
  public migrationReport: string = 'Iniciado.';

  public get<T>(key: string, defaultValue: T): T {
    try {
      const v = localStorage.getItem(key);
      return v == null ? defaultValue : JSON.parse(v);
    } catch {
      return defaultValue;
    }
  }

  public set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  public del(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }

  // --- IndexedDB for Custom Pictograms ---
  public async initDB(): Promise<IDBDatabase | null> {
    if (this.db) return this.db;
    if (typeof window === 'undefined' || !window.indexedDB) return null;

    return new Promise((resolve) => {
      try {
        const req = indexedDB.open('kli_pictos_v8', 1);
        req.onupgradeneeded = (e: IDBVersionChangeEvent) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains('img')) {
            db.createObjectStore('img', { keyPath: 'word' });
          }
        };
        req.onsuccess = (e) => {
          this.db = (e.target as IDBOpenDBRequest).result;
          resolve(this.db);
        };
        req.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    });
  }

  public async loadPictos(): Promise<void> {
    const db = await this.initDB();
    if (!db) {
      this.pictoCache = this.get(KEYS.pictoFallback, {});
      return;
    }

    return new Promise((resolve) => {
      try {
        const tx = db.transaction('img', 'readonly');
        const store = tx.objectStore('img');
        const req = store.getAll();
        req.onsuccess = () => {
          const list = req.result || [];
          list.forEach((item: { word: string; html: string }) => {
            this.pictoCache[item.word] = item.html;
          });
          resolve();
        };
        req.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  public async putPicto(word: string, html: string): Promise<void> {
    const key = normText(word);
    this.pictoCache[key] = html;

    const db = await this.initDB();
    if (!db) {
      const fb = this.get<Record<string, string>>(KEYS.pictoFallback, {});
      fb[key] = html;
      this.set(KEYS.pictoFallback, fb);
      return;
    }

    try {
      const tx = db.transaction('img', 'readwrite');
      tx.objectStore('img').put({ word: key, html });
    } catch {
      // Ignore error
    }
  }

  public getPictoHtml(word: string): string | null {
    const key = normText(word);
    return this.pictoCache[key] || null;
  }

  public getAnyPictoSvg(word: string): string {
    return this.getPictoHtml(word) || getLocalPictoSvg(word);
  }

  // --- Migrations ---
  public runMigration(): void {
    const oldVer = parseFloat(localStorage.getItem(KEYS.version) || '0');
    if (oldVer >= SCHEMA_VERSION) {
      this.migrationReport = `Esquema v${SCHEMA_VERSION} al día.`;
      return;
    }

    // Preserve legacy backup
    const legacyKeys = [
      'kli_texts', 'kli7_texts', 'kli_progress', 'kli7_progress',
      'kli_dict', 'kli7_dict', 'kli_settings', 'kli7_settings',
      'kli_custom_pictos', 'kli7_pass', 'kli_pass'
    ];
    const backup: Record<string, string> = {};
    let foundLegacy = false;
    legacyKeys.forEach((k) => {
      const raw = localStorage.getItem(k);
      if (raw != null) {
        backup[k] = raw;
        foundLegacy = true;
      }
    });
    if (foundLegacy) {
      this.set(KEYS.backup, { date: new Date().toISOString(), from: oldVer, data: backup });
    }

    // Migrate texts
    const legacyTexts = this.get<ReadingText[]>('kli7_texts', this.get<ReadingText[]>('kli_texts', []));
    if (Array.isArray(legacyTexts) && legacyTexts.length) {
      const current = this.getTexts();
      const currentIds = new Set(current.map((t) => t.id));
      let imported = 0;
      legacyTexts.forEach((t) => {
        if (!t || typeof t.text !== 'string' || !t.text.trim()) return;
        if (!currentIds.has(t.id)) {
          current.push({ ...t, pre: false, own: true });
          currentIds.add(t.id);
          imported++;
        }
      });
      this.set(KEYS.texts, current);
      this.migrationReport = `Migrado desde v${oldVer} a v${SCHEMA_VERSION}. Lecturas importadas: ${imported}.`;
    }

    // Migrate progress
    const lp = this.get<ProgressRecord[]>('kli7_progress', this.get<ProgressRecord[]>('kli_progress', []));
    if (Array.isArray(lp) && lp.length && !this.get<ProgressRecord[]>(KEYS.progress, []).length) {
      this.set(KEYS.progress, lp);
    }

    // Migrate dict
    const ld = this.get<DictionaryItem[]>('kli7_dict', this.get<DictionaryItem[]>('kli_dict', []));
    if (Array.isArray(ld) && ld.length && !this.get<DictionaryItem[]>(KEYS.dict, []).length) {
      this.set(KEYS.dict, ld);
    }

    // Migrate settings
    const ls = this.get<Partial<AppSettings>>('kli7_settings', this.get<Partial<AppSettings>>('kli_settings', null as unknown as Partial<AppSettings>));
    if (ls) {
      const merged = { ...DEFAULT_SETTINGS, ...ls };
      this.set(KEYS.settings, merged);
    }

    localStorage.setItem(KEYS.version, String(SCHEMA_VERSION));
  }

  // --- Reading Texts Management ---
  public getTexts(): ReadingText[] {
    let stored = this.get<ReadingText[] | null>(KEYS.texts, null);
    if (!Array.isArray(stored) || stored.length < 60) {
      stored = [];
    }
    const map = new Map<string, ReadingText>();
    stored.forEach((t) => {
      if (t && t.id && typeof t.text === 'string' && t.text.trim()) {
        map.set(t.id, t);
      }
    });

    PRELOADED_TEXTS.forEach((base) => {
      const s = map.get(base.id);
      if (!s || !s.text || s.text.trim().length < 3 || !Array.isArray(s.questions) || !s.questions.length) {
        map.set(base.id, JSON.parse(JSON.stringify(base)));
      } else {
        map.set(base.id, { ...base, ...s, pre: true });
      }
    });

    const result = Array.from(map.values()).sort(
      (a, b) => a.level - b.level || String(a.id).localeCompare(String(b.id))
    );
    this.set(KEYS.texts, result);
    return result;
  }

  public saveTexts(texts: ReadingText[]): void {
    this.set(KEYS.texts, texts);
  }

  public restore60(): ReadingText[] {
    const current = this.getTexts();
    const ownTexts = current.filter((t) => !t.pre);
    const restored = [...JSON.parse(JSON.stringify(PRELOADED_TEXTS)), ...ownTexts].sort(
      (a, b) => a.level - b.level || String(a.id).localeCompare(String(b.id))
    );
    this.saveTexts(restored);
    return restored;
  }

  // --- Progress Management ---
  public getProgress(): ProgressRecord[] {
    return this.get<ProgressRecord[]>(KEYS.progress, []);
  }

  public addProgress(record: Omit<ProgressRecord, 'id' | 'date'> & { id?: string; date?: string }): ProgressRecord {
    const list = this.getProgress();
    const newRecord: ProgressRecord = {
      id: record.id || 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      date: record.date || new Date().toLocaleString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      }),
      title: record.title,
      textId: record.textId,
      mode: record.mode,
      secs: record.secs,
      ppm: record.ppm,
      words: record.words,
      hits: record.hits,
      total: record.total,
      kind: record.kind,
      diffs: record.diffs || [],
      obs: record.obs || '',
      pupilName: record.pupilName || this.getCurrentPupil(),
    };
    list.push(newRecord);
    this.set(KEYS.progress, list);
    return newRecord;
  }

  public saveProgress(list: ProgressRecord[]): void {
    this.set(KEYS.progress, list);
  }

  public resetProgress(): void {
    this.set(KEYS.progress, []);
  }

  // --- Dictionary Management ---
  public getDict(): DictionaryItem[] {
    return this.get<DictionaryItem[]>(KEYS.dict, []);
  }

  public addDict(w: string, m: string = ''): boolean {
    const list = this.getDict();
    const cleanW = w.trim();
    if (!cleanW) return false;
    const exists = list.some((d) => normText(d.w) === normText(cleanW));
    if (!exists) {
      list.push({
        w: cleanW,
        m: m.trim(),
        date: new Date().toLocaleDateString('es-ES'),
        pupilName: this.getCurrentPupil(),
      });
      this.set(KEYS.dict, list);
      return true;
    }
    return false;
  }

  public removeDict(w: string): void {
    const list = this.getDict().filter((d) => d.w !== w);
    this.set(KEYS.dict, list);
  }

  // --- Settings Management ---
  public getSettings(): AppSettings {
    const stored = this.get<Partial<AppSettings>>(KEYS.settings, {});
    return { ...DEFAULT_SETTINGS, ...stored };
  }

  public saveSettings(settings: AppSettings): void {
    this.set(KEYS.settings, settings);
  }

  // --- Teacher Password ---
  public getTeacherPass(): string {
    return this.get<string>(KEYS.pass, 'profe2024');
  }

  public setTeacherPass(newPass: string): void {
    this.set(KEYS.pass, newPass.trim());
  }

  // --- Pupils / Profiles ---
  public getPupils(): PupilProfile[] {
    return this.get<PupilProfile[]>(KEYS.pupils, [
      { id: 'p_gen', name: 'General', group: 'Aula', notes: 'Perfil general' }
    ]);
  }

  public savePupils(list: PupilProfile[]): void {
    this.set(KEYS.pupils, list);
  }

  public getCurrentPupil(): string {
    return this.get<string>(KEYS.currentPupil, 'General');
  }

  public setCurrentPupil(name: string): void {
    this.set(KEYS.currentPupil, name);
  }

  // --- Full Backup & Restore ---
  public createFullBackup(): string {
    const backupData = {
      version: SCHEMA_VERSION,
      exportDate: new Date().toISOString(),
      lecturas: this.getTexts(),
      progreso: this.getProgress(),
      diccionario: this.getDict(),
      ajustes: this.getSettings(),
      alumnos: this.getPupils(),
      pictogramas: this.pictoCache,
    };
    return JSON.stringify(backupData, null, 2);
  }

  public async restoreFullBackup(jsonData: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonData);
      if (Array.isArray(data.lecturas)) {
        this.saveTexts(data.lecturas);
      }
      if (Array.isArray(data.progreso)) {
        this.saveProgress(data.progreso);
      }
      if (Array.isArray(data.diccionario)) {
        this.set(KEYS.dict, data.diccionario);
      }
      if (data.ajustes) {
        this.saveSettings({ ...DEFAULT_SETTINGS, ...data.ajustes });
      }
      if (Array.isArray(data.alumnos)) {
        this.savePupils(data.alumnos);
      }
      if (data.pictogramas && typeof data.pictogramas === 'object') {
        for (const [w, html] of Object.entries(data.pictogramas)) {
          await this.putPicto(w, html as string);
        }
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const Storage = new StorageService();
