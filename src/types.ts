export type ReadingLevel = 0 | 1 | 2 | 3 | 4;

export type ReadingCategory =
  | 'Prelectura'
  | 'Cuento'
  | 'Rima'
  | 'Adivinanza'
  | 'Trabalenguas'
  | 'Informativo'
  | 'Instructivo'
  | 'Diálogo'
  | 'Canción'
  | 'Fábula'
  | 'Poema'
  | 'Noticia'
  | 'Científico'
  | 'Biografía'
  | 'Teatro'
  | 'Divulgativo'
  | 'Inferencial';

export type ReadingMode =
  | 'silabico'
  | 'palabra'
  | 'frase'
  | 'parrafo'
  | 'eco'
  | 'guiada'
  | 'acompanada'
  | 'repetida'
  | 'expresiva'
  | 'autonomo'
  | 'piramidal'
  | 'acumulativa'
  | 'dramatizada'
  | 'huecos'
  | 'detectives'
  | 'escalera';

export interface ReadingText {
  id: string;
  level: ReadingLevel;
  category: ReadingCategory | string;
  title: string;
  text: string;
  questions: string[][]; // [question, correct, distractor1, distractor2, ...]
  vocab: string[];
  tags: string[];
  collection?: string;
  favorite?: boolean;
  mode?: string;
  pauses?: string;
  pre?: boolean;
  own?: boolean;
}

export interface ProgressRecord {
  id: string;
  date: string;
  title: string;
  textId?: string;
  mode: string;
  secs: number;
  ppm: number;
  words: number;
  hits: number;
  total?: number;
  kind: 'lectura' | 'comprensión' | 'actividad' | 'fluidez';
  diffs?: string[];
  obs?: string;
  pupilName?: string;
}

export interface DictionaryItem {
  w: string;
  m: string;
  date: string;
  pupilName?: string;
}

export interface PupilProfile {
  id: string;
  name: string;
  group: string;
  notes?: string;
  avatar?: string;
}

export interface AppSettings {
  theme: 't-calmado' | 't-claro' | 't-oscuro' | 't-contraste';
  fs: number; // font size in px
  anim: boolean;
  simple: boolean;
  dys: boolean;
  pic: boolean;
  ruler: boolean;
  sy: boolean;
  focusMask: boolean;
  voiceIdx: number;
  pitch: number;
  beep: boolean;
  sound: boolean;
  ps: number; // pause syllables in ms
  pw: number; // pause words in ms
  pf: number; // pause sentences in ms
  pp: number; // pause paragraphs in ms
  pe: number; // pause echo/guided in ms
  currentPupil: string;
}

export type ViewType =
  | 'inicio'
  | 'leer'
  | 'biblioteca'
  | 'comprendo'
  | 'palabras'
  | 'diccionario'
  | 'pictos'
  | 'crear'
  | 'revisar'
  | 'actividades'
  | 'gym'
  | 'lab'
  | 'build'
  | 'order'
  | 'detective'
  | 'ladder'
  | 'retos'
  | 'memory'
  | 'dictado'
  | 'cadena'
  | 'intrusa'
  | 'rimas'
  | 'progreso'
  | 'ajustes'
  | 'profe';

export interface EmotionRecord {
  state: 'muy bien' | 'bien' | 'regular' | 'triste' | 'enfadado' | 'cansado';
  date: string;
  pupilName?: string;
}
