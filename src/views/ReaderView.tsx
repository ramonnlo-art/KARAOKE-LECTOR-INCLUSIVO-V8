import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { AppSettings, ReadingMode, ReadingText } from '../types';
import { READING_MODES } from '../data/preloadTexts';
import { Syl } from '../services/syllables';
import { Sound } from '../services/sound';
import { Speech } from '../services/speech';
import { Storage } from '../services/store';

interface ReaderViewProps {
  text: ReadingText | null;
  settings: AppSettings;
  onNavigate: (view: 'biblioteca' | 'comprendo' | 'palabras' | 'progreso') => void;
  onFinishReading: (stats: { secs: number; ppm: number; words: number }) => void;
  onToast: (msg: string) => void;
}

interface WordToken {
  i: number;
  raw: string;
  txt: string;
  plain: string;
  fi: number;
  pi: number;
  picto?: string;
  gap?: boolean;
  err?: boolean;
  fix?: string;
  sids: number[];
}

interface SyllableToken {
  i: number;
  txt: string;
  wi: number;
  fi: number;
  pi: number;
}

interface SentenceToken {
  i: number;
  pi: number;
  txt: string;
  wids: number[];
}

interface ParagraphToken {
  i: number;
  txt: string;
  sents: number[];
}

interface UnitToken {
  txt: string;
  kind: 'syl' | 'word' | 'sent' | 'para';
  w?: number;
  s?: number;
  f?: number;
  p?: number;
  voice?: number;
  who?: string;
  step?: number;
  total?: number;
  parts?: string[];
}

type SpeedPreset = 'super' | 'muy' | 'lenta' | 'media' | 'rapida';

export const ReaderView: React.FC<ReaderViewProps> = ({
  text,
  settings,
  onNavigate,
  onFinishReading,
  onToast,
}) => {
  const [mode, setMode] = useState<ReadingMode>((text?.mode as ReadingMode) || 'silabico');
  const [speed, setSpeed] = useState<SpeedPreset>('media');
  const [customRate, setCustomRate] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [unitIdx, setUnitIdx] = useState(0);
  const [turnPrompt, setTurnPrompt] = useState<string | null>(null);

  // Visual Toggles
  const [showRuler, setShowRuler] = useState(settings.ruler);
  const [showSyColors, setShowSyColors] = useState(settings.sy);
  const [autoFollow, setAutoFollow] = useState(true);
  const [reinforceSize, setReinforceSize] = useState(false);
  const [showPictos, setShowPictos] = useState(settings.pic);
  const [focusMask, setFocusMask] = useState(settings.focusMask);

  // Interactive activities state inside reader
  const [gapAnswers, setGapAnswers] = useState<Record<number, string>>({});
  const [gapFeedback, setGapFeedback] = useState<string | null>(null);
  const [fixedErrors, setFixedErrors] = useState<Record<number, boolean>>({});
  const [repetitionCount, setRepetitionCount] = useState(0);

  // Stats
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const [readWordsCount, setReadWordsCount] = useState(0);
  const [ppm, setPpm] = useState(0);

  // Refs for audio playback loop and timing
  const t0Ref = useRef<number>(0);
  const effDurationRef = useRef<number>(0);
  const utStartRef = useRef<number>(0);
  const playTimerRef = useRef<number | null>(null);
  const pendingNextUnitRef = useRef<number | null>(null);
  const utteranceFinishedRef = useRef(false);
  const tickTimerRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const unitIdxRef = useRef(0);
  const speedRef = useRef<SpeedPreset>('media');
  const customRateRef = useRef<number>(1.0);
  const modeRef = useRef<ReadingMode>('silabico');
  const unitsRef = useRef<UnitToken[]>([]);

  const wrapRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);

  // Parsed structured text data
  const [words, setWords] = useState<WordToken[]>([]);
  const [syls, setSyls] = useState<SyllableToken[]>([]);
  const [sents, setSents] = useState<SentenceToken[]>([]);
  const [paras, setParas] = useState<ParagraphToken[]>([]);
  const [units, setUnits] = useState<UnitToken[]>([]);

  // Keep refs in sync
  isPlayingRef.current = isPlaying;
  unitIdxRef.current = unitIdx;
  speedRef.current = speed;
  customRateRef.current = customRate;
  modeRef.current = mode;
  unitsRef.current = units;

  // Rate calculator based on speed preset and custom multiplier
  const getSpeechRate = useCallback((sp: SpeedPreset, userRate: number): number => {
    let base = 1.0;
    switch (sp) {
      case 'super': base = 0.55; break;
      case 'muy': base = 0.70; break;
      case 'lenta': base = 0.85; break;
      case 'rapida': base = 1.30; break;
      default: base = 1.00; break;
    }
    return Math.max(0.4, Math.min(2.0, base * userRate));
  }, []);

  // Pause duration calculator based on unit kind, mode, speed and settings
  const getPauseMs = useCallback((u: UnitToken, sp: SpeedPreset): number => {
    const mult = { super: 3.0, muy: 2.0, lenta: 1.3, media: 0.7, rapida: 0.4 }[sp] || 1.0;
    if (modeRef.current === 'eco') return settings.pe;
    if (modeRef.current === 'guiada') {
      const pausesList = (text?.pauses || '').split(',').map((x) => parseInt(x, 10)).filter((n) => n > 0);
      if (u.f !== undefined && pausesList.includes(u.f + 1)) return settings.pe;
    }
    if (u.kind === 'syl') return settings.ps * mult;
    if (u.kind === 'word') return settings.pw * mult;
    if (u.kind === 'sent') return settings.pf * mult;
    return settings.pp * mult;
  }, [settings, text]);

  // Stop playback completely
  const handleStop = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (playTimerRef.current !== null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    if (tickTimerRef.current !== null) {
      window.clearInterval(tickTimerRef.current);
      tickTimerRef.current = null;
    }
    pendingNextUnitRef.current = null;
    Speech.stop();
    setUnitIdx(0);
    unitIdxRef.current = 0;
    t0Ref.current = 0;
    effDurationRef.current = 0;
    setElapsedSecs(0);
    setReadWordsCount(0);
    setPpm(0);
    setTurnPrompt(null);
  }, []);

  // Parse raw text into structured tokens
  const buildTokens = useCallback(() => {
    if (!text) {
      setWords([]);
      setSyls([]);
      setSents([]);
      setParas([]);
      return;
    }

    const newWords: WordToken[] = [];
    const newSyls: SyllableToken[] = [];
    const newSents: SentenceToken[] = [];
    const newParas: ParagraphToken[] = [];

    let wi = 0;
    let si = 0;
    let fi = 0;

    const rawParas = text.text.split(/\n+/).filter((p) => p.trim());
    rawParas.forEach((p, pi) => {
      const pSents = p.split(/(?<=[.!?…])\s+/).filter((s) => s.trim());
      const pInfo: ParagraphToken = { i: pi, txt: p, sents: [] };

      pSents.forEach((s) => {
        const f = fi++;
        const wids: number[] = [];
        const rawTokens = s.trim().split(/\s+/).filter(Boolean);

        rawTokens.forEach((tok) => {
          const w: WordToken = {
            i: wi,
            raw: tok,
            txt: tok,
            plain: '',
            fi: f,
            pi: pi,
            sids: [],
          };

          const picMatch = tok.match(/^\[picto:([^\]]+)\]$/);
          const gapMatch = tok.match(/^\[hueco:([^\]]+)\]$/);
          const errMatch = tok.match(/^\{error:([^|]+)\|([^}]+)\}$/);

          if (picMatch) {
            w.txt = picMatch[1];
            w.picto = picMatch[1];
          } else if (gapMatch) {
            w.txt = gapMatch[1];
            w.gap = true;
          } else if (errMatch) {
            w.txt = errMatch[1];
            w.fix = errMatch[2];
            w.err = true;
          }

          w.plain = w.txt.replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ]/g, '');
          const parts = Syl.split(w.plain || w.txt);
          parts.forEach((sy) => {
            w.sids.push(si);
            newSyls.push({ i: si, txt: sy, wi: w.i, fi: f, pi: pi });
            si++;
          });

          newWords.push(w);
          wids.push(wi);
          wi++;
        });

        newSents.push({ i: f, pi: pi, txt: s, wids });
        pInfo.sents.push(f);
      });

      newParas.push(pInfo);
    });

    setWords(newWords);
    setSyls(newSyls);
    setSents(newSents);
    setParas(newParas);
  }, [text]);

  // Generate units based on current mode and speed
  const generateUnits = useCallback((
    currentMode: ReadingMode,
    currentSpeed: SpeedPreset,
    parsedWords: WordToken[],
    parsedSyls: SyllableToken[],
    parsedSents: SentenceToken[],
    parsedParas: ParagraphToken[],
    rawText: ReadingText | null
  ): UnitToken[] => {
    if (!parsedWords.length) return [];

    const syUnits: UnitToken[] = parsedSyls.map((s) => ({
      txt: s.txt,
      kind: 'syl',
      w: s.wi,
      s: s.i,
      f: s.fi,
      p: s.pi,
    }));

    const woUnits: UnitToken[] = parsedWords.map((w) => ({
      txt: w.err ? w.fix || w.txt : w.txt,
      kind: 'word',
      w: w.i,
      f: w.fi,
      p: w.pi,
    }));

    const seUnits: UnitToken[] = parsedSents.map((s) => ({
      txt: s.wids.map((idx) => {
        const w = parsedWords[idx];
        return w ? (w.err ? w.fix || w.txt : w.gap ? '…' : w.txt) : '';
      }).join(' '),
      kind: 'sent',
      f: s.i,
      p: s.pi,
    }));

    const paUnits: UnitToken[] = parsedParas.map((p) => ({
      txt: p.txt.replace(/\[picto:([^\]]+)\]/g, '$1').replace(/\[hueco:[^\]]+\]/g, '…').replace(/\{error:[^|]+\|([^}]+)\}/g, '$1'),
      kind: 'para',
      p: p.i,
    }));

    // In V7: speed 'super' or 'muy' forces syllable breakdown; 'lenta' forces word breakdown
    if (currentSpeed === 'super' || currentSpeed === 'muy') {
      return syUnits;
    }
    if (currentSpeed === 'lenta') {
      return woUnits;
    }

    switch (currentMode) {
      case 'silabico':
        return syUnits;
      case 'palabra':
        return woUnits;
      case 'frase':
      case 'eco':
      case 'guiada':
      case 'repetida':
      case 'acompanada':
      case 'expresiva':
        return seUnits;
      case 'parrafo':
        return paUnits;
      case 'autonomo':
        return [];
      case 'huecos':
      case 'detectives':
        return seUnits;
      case 'dramatizada': {
        const lines: UnitToken[] = [];
        const names: string[] = [];
        (rawText?.text || '').split(/\n+/).forEach((line) => {
          const m = line.match(/^\s*([A-ZÁÉÍÓÚÑ0-9 ]{2,20}):\s*(.*)$/);
          if (m) {
            if (!names.includes(m[1])) names.push(m[1]);
            lines.push({ txt: m[2], kind: 'sent', voice: names.indexOf(m[1]), who: m[1] });
          } else if (line.trim()) {
            lines.push({ txt: line, kind: 'sent', voice: 0, who: 'Narrador' });
          }
        });
        return lines.length ? lines : seUnits;
      }
      case 'piramidal':
      case 'acumulativa':
      case 'escalera': {
        const st: UnitToken[] = [];
        parsedParas.forEach((p) => {
          let acc: string[] = [];
          p.sents.forEach((fIdx) => {
            const s = parsedSents[fIdx];
            if (!s) return;
            const ws = s.wids.map((i) => parsedWords[i]?.txt || '');
            ws.forEach((_, k) => {
              const upto = ws.slice(0, k + 1);
              const stepTxt = (currentMode === 'acumulativa' && acc.length)
                ? acc.concat(upto).join(' ')
                : upto.join(' ');
              st.push({
                txt: stepTxt,
                kind: 'word',
                f: fIdx,
                step: k + 1,
                total: ws.length,
                parts: upto,
              });
            });
            if (currentMode === 'acumulativa') {
              acc = acc.concat(ws);
            }
          });
        });
        return st;
      }
      default:
        return seUnits;
    }
  }, []);

  // Re-build structured tokens when text changes
  useEffect(() => {
    buildTokens();
    handleStop();
    setGapAnswers({});
    setGapFeedback(null);
    setFixedErrors({});
  }, [buildTokens, handleStop]);

  // Whenever words or structure change, generate initial units
  useEffect(() => {
    const initialUnits = generateUnits(mode, speed, words, syls, sents, paras, text);
    setUnits(initialUnits);
    setUnitIdx(0);
  }, [words, syls, sents, paras, mode, speed, text, generateUnits]);

  // Update Visual Ruler and Auto-scroll
  const updateVisualGuides = useCallback((u: UnitToken | undefined) => {
    if (!u) return;
    const wrap = wrapRef.current;
    if (!wrap) return;

    let targetEl: HTMLElement | null = null;
    if (u.s !== undefined) {
      targetEl = wrap.querySelector(`.sy[data-s="${u.s}"]`);
    } else if (u.w !== undefined) {
      targetEl = wrap.querySelector(`.w[data-w="${u.w}"]`);
    } else if (u.f !== undefined) {
      targetEl = wrap.querySelector(`.sent[data-f="${u.f}"]`);
    } else if (u.p !== undefined) {
      targetEl = wrap.querySelector(`.par[data-p="${u.p}"]`);
    }

    if (targetEl && rulerRef.current && showRuler) {
      const targetRect = targetEl.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const topOffset = targetRect.top - wrapRect.top + wrap.scrollTop;
      rulerRef.current.style.top = `${Math.max(0, topOffset - 4)}px`;
      rulerRef.current.style.height = `${targetRect.height + 8}px`;
      rulerRef.current.style.display = 'block';
    }

    if (targetEl && autoFollow) {
      targetEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [showRuler, autoFollow]);

  // Core Speech Execution Step
  const speakStep = useCallback((idxToPlay: number) => {
    const currentUnits = unitsRef.current;
    if (idxToPlay >= currentUnits.length) {
      // Completed text
      if (modeRef.current === 'repetida' && repetitionCount < 2) {
        setRepetitionCount((prev) => prev + 1);
        setUnitIdx(0);
        unitIdxRef.current = 0;
        onToast(`🔁 ¡Comenzando repetición ${repetitionCount + 2} de 3!`);
        Sound.win();
        pendingNextUnitRef.current = 0;
        playTimerRef.current = window.setTimeout(() => {
          playTimerRef.current = null;
          pendingNextUnitRef.current = null;
          if (isPlayingRef.current) speakStep(0);
        }, 1200);
        return;
      }
      setIsPlaying(false);
      isPlayingRef.current = false;
      setTurnPrompt(null);
      Sound.win();
      onToast('🎉 ¡Lectura completada!');
      return;
    }

    const currentUnit = currentUnits[idxToPlay];
    utteranceFinishedRef.current = false;
    setUnitIdx(idxToPlay);
    unitIdxRef.current = idxToPlay;
    setTurnPrompt(null);
    updateVisualGuides(currentUnit);

    const activeSpeed = speedRef.current;
    const activeCustomRate = customRateRef.current;
    const rate = getSpeechRate(activeSpeed, activeCustomRate);
    const pauseWait = getPauseMs(currentUnit, activeSpeed);

    let pitch = Number(settings.pitch) || 1.0;
    let voiceIdxToUse = settings.voiceIdx;

    if (modeRef.current === 'expresiva') {
      if (currentUnit.txt.includes('?') || currentUnit.txt.includes('¿')) pitch *= 1.25;
      else if (currentUnit.txt.includes('!') || currentUnit.txt.includes('¡')) pitch *= 1.20;
    } else if (modeRef.current === 'dramatizada' && currentUnit.voice !== undefined) {
      const allVoices = Speech.getAllVoices();
      if (allVoices.length > 1) {
        voiceIdxToUse = (settings.voiceIdx + currentUnit.voice) % allVoices.length;
      } else {
        pitch = 0.85 + (currentUnit.voice % 3) * 0.25;
      }
    }

    Speech.speak(currentUnit.txt, {
      rate,
      pitch,
      voiceIdx: voiceIdxToUse,
      onStart: () => {
        pendingNextUnitRef.current = null;
        utStartRef.current = performance.now();
      },
      onEnd: () => {
        utteranceFinishedRef.current = true;
        pendingNextUnitRef.current = idxToPlay + 1;
        if (!isPlayingRef.current) return;
        effDurationRef.current += performance.now() - utStartRef.current;
        setReadWordsCount((prev) => prev + (currentUnit.txt.split(/\s+/).filter(Boolean).length || 1));

        if (modeRef.current === 'eco') {
          setTurnPrompt('🎤 Tu turno: ¡Repite la frase!');
        } else if (modeRef.current === 'guiada' && pauseWait >= 3000) {
          setTurnPrompt('🧘 Pausa docente para reflexionar');
        }

        if (settings.beep && pauseWait > 280) {
          Sound.beep();
        }

        playTimerRef.current = window.setTimeout(() => {
          playTimerRef.current = null;
          pendingNextUnitRef.current = null;
          if (isPlayingRef.current) {
            speakStep(idxToPlay + 1);
          }
        }, pauseWait);
      },
      onError: () => {
        utteranceFinishedRef.current = true;
        pendingNextUnitRef.current = idxToPlay + 1;
        if (!isPlayingRef.current) return;
        playTimerRef.current = window.setTimeout(() => {
          playTimerRef.current = null;
          pendingNextUnitRef.current = null;
          if (isPlayingRef.current) {
            speakStep(idxToPlay + 1);
          }
        }, 150);
      },
    });
  }, [getSpeechRate, getPauseMs, repetitionCount, settings, onToast, updateVisualGuides]);

  // LIVE SPEED AND RHYTHM MODIFIER (Preserves place, seamlessly updates rate and ongoing pause)
  const changeSpeedAndRhythm = (newSpeed: SpeedPreset, newRateMultiplier?: number) => {
    const wasPlaying = isPlayingRef.current;
    pendingNextUnitRef.current = null;
    if (playTimerRef.current !== null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }

    // 1. Identify which word index was active right now
    const currentUnits = unitsRef.current;
    const currentU = currentUnits[unitIdxRef.current];
    let anchorWordIdx = 0;
    if (currentU) {
      if (currentU.w !== undefined) anchorWordIdx = currentU.w;
      else if (currentU.f !== undefined && sents[currentU.f]?.wids[0] !== undefined) {
        anchorWordIdx = sents[currentU.f].wids[0];
      }
    }

    const updatedSpeed = newSpeed;
    const updatedRate = newRateMultiplier !== undefined ? newRateMultiplier : customRateRef.current;

    setSpeed(updatedSpeed);
    speedRef.current = updatedSpeed;
    setCustomRate(updatedRate);
    customRateRef.current = updatedRate;

    // 2. Re-generate units with the new speed preset
    const newUnits = generateUnits(modeRef.current, updatedSpeed, words, syls, sents, paras, text);
    setUnits(newUnits);
    unitsRef.current = newUnits;

    // 3. Find the matching unit in the new set corresponding to anchorWordIdx
    let newUnitIdx = 0;
    if (anchorWordIdx > 0 && newUnits.length > 0) {
      const matchIdx = newUnits.findIndex((u) => {
        if (u.w !== undefined) return u.w >= anchorWordIdx;
        if (u.f !== undefined && sents[u.f]?.wids) {
          return sents[u.f].wids.includes(anchorWordIdx) || sents[u.f].wids[0] >= anchorWordIdx;
        }
        return false;
      });
      newUnitIdx = matchIdx >= 0 ? matchIdx : Math.min(unitIdxRef.current, newUnits.length - 1);
    }
    setUnitIdx(newUnitIdx);
    unitIdxRef.current = newUnitIdx;

    Sound.click();
    onToast(`⚡ Ritmo ajustado: ${updatedSpeed} (${Math.round(getSpeechRate(updatedSpeed, updatedRate) * 100)}%)`);

    // 4. If playing, immediately re-speak current unit with new cadence without stopping
    if (wasPlaying) {
      Speech.stop();
      speakStep(newUnitIdx);
    } else {
      updateVisualGuides(newUnits[newUnitIdx]);
    }
  };

  // Switch Mode dynamically preserving position
  const changeReadingMode = (newMode: ReadingMode) => {
    const wasPlaying = isPlayingRef.current;
    pendingNextUnitRef.current = null;
    if (playTimerRef.current !== null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }

    const currentUnits = unitsRef.current;
    const currentU = currentUnits[unitIdxRef.current];
    let anchorWordIdx = 0;
    if (currentU && currentU.w !== undefined) anchorWordIdx = currentU.w;
    else if (currentU && currentU.f !== undefined && sents[currentU.f]?.wids[0] !== undefined) {
      anchorWordIdx = sents[currentU.f].wids[0];
    }

    setMode(newMode);
    modeRef.current = newMode;

    const newUnits = generateUnits(newMode, speedRef.current, words, syls, sents, paras, text);
    setUnits(newUnits);
    unitsRef.current = newUnits;

    let newUnitIdx = 0;
    if (anchorWordIdx > 0 && newUnits.length > 0) {
      const matchIdx = newUnits.findIndex((u) => {
        if (u.w !== undefined) return u.w >= anchorWordIdx;
        if (u.f !== undefined && sents[u.f]?.wids) {
          return sents[u.f].wids.includes(anchorWordIdx) || sents[u.f].wids[0] >= anchorWordIdx;
        }
        return false;
      });
      newUnitIdx = matchIdx >= 0 ? matchIdx : 0;
    }
    setUnitIdx(newUnitIdx);
    unitIdxRef.current = newUnitIdx;

    Sound.click();
    onToast(`📖 Modo: ${READING_MODES.find(([m]) => m === newMode)?.[1] || newMode}`);

    if (wasPlaying && newMode !== 'autonomo') {
      Speech.stop();
      speakStep(newUnitIdx);
    } else {
      Speech.stop();
      setIsPlaying(false);
      isPlayingRef.current = false;
      updateVisualGuides(newUnits[newUnitIdx]);
    }
  };

  // Start Play
  const handlePlay = () => {
    if (!text) {
      onToast('Selecciona una lectura en la biblioteca');
      return;
    }
    pendingNextUnitRef.current = null;
    Sound.ready();
    setIsPlaying(true);
    isPlayingRef.current = true;
    if (!t0Ref.current) t0Ref.current = Date.now();

    if (mode === 'autonomo' || !units.length) {
      onToast('👀 Modo autónomo: Lee a tu ritmo. Toca cualquier palabra para escucharla.');
      return;
    }

    speakStep(unitIdx);
  };

  // Pause
  const handlePause = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    if (playTimerRef.current !== null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    window.setTimeout(() => {
      if (!isPlayingRef.current) {
        Speech.stop();
      }
    }, 300);
    onToast('⏸️ Lectura en pausa');
  };

  // Resume
  const handleResume = () => {
    setIsPlaying(true);
    isPlayingRef.current = true;
    if (mode === 'autonomo') return;
    const resumeIdx = utteranceFinishedRef.current
      ? (pendingNextUnitRef.current ?? unitIdxRef.current + 1)
      : unitIdxRef.current;
    pendingNextUnitRef.current = null;
    utteranceFinishedRef.current = false;
    speakStep(resumeIdx);
  };

  // Next / Prev step navigation
  const handleNext = () => {
    if (!units.length) return;
    pendingNextUnitRef.current = null;
    const nextIdx = Math.min(units.length - 1, unitIdx + 1);
    setUnitIdx(nextIdx);
    unitIdxRef.current = nextIdx;
    updateVisualGuides(units[nextIdx]);
    if (isPlaying) {
      if (playTimerRef.current !== null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
      Speech.stop();
      speakStep(nextIdx);
    }
  };

  const handlePrev = () => {
    if (!units.length) return;
    pendingNextUnitRef.current = null;
    const prevIdx = Math.max(0, unitIdx - 1);
    setUnitIdx(prevIdx);
    unitIdxRef.current = prevIdx;
    updateVisualGuides(units[prevIdx]);
    if (isPlaying) {
      if (playTimerRef.current !== null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
      Speech.stop();
      speakStep(prevIdx);
    }
  };

  const handleRepeatUnit = () => {
    if (!units.length) return;
    pendingNextUnitRef.current = null;
    if (playTimerRef.current !== null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    Speech.stop();
    setIsPlaying(true);
    isPlayingRef.current = true;
    speakStep(unitIdx);
  };

  const handleHome = () => {
    handleStop();
    setUnitIdx(0);
    unitIdxRef.current = 0;
    if (units.length > 0) updateVisualGuides(units[0]);
    onToast('⏮️ Regresado al inicio de la lectura');
  };

  // Timer Tick for PPM
  useEffect(() => {
    if (isPlaying) {
      tickTimerRef.current = window.setInterval(() => {
        const secs = t0Ref.current ? Math.round((Date.now() - t0Ref.current) / 1000) : 0;
        setElapsedSecs(secs);
        const effMins = effDurationRef.current / 60000;
        const totalWords = mode === 'autonomo' ? words.length : readWordsCount;
        const currentPpm = effMins > 0.002
          ? Math.round(totalWords / effMins)
          : (secs > 2 ? Math.round(totalWords / (secs / 60)) : 0);
        setPpm(currentPpm || 0);
      }, 500);
    } else {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    }
    return () => {
      if (tickTimerRef.current) clearInterval(tickTimerRef.current);
    };
  }, [isPlaying, words.length, readWordsCount, mode]);

  // Stop speech and pending timers when leaving ReaderView.
  useEffect(() => {
    return () => {
      if (playTimerRef.current !== null) {
        window.clearTimeout(playTimerRef.current);
        playTimerRef.current = null;
      }
      if (tickTimerRef.current !== null) {
        window.clearInterval(tickTimerRef.current);
        tickTimerRef.current = null;
      }
      Speech.stop();
    };
  }, []);

  // Measure Fluency
  const handleMeasureFluency = () => {
    if (!text) return;
    const totalW = words.length;
    const currSecs = elapsedSecs || 1;
    const calcPpm = Math.round(totalW / (currSecs / 60));
    onToast(`📏 ${totalW} palabras en ${currSecs}s · ${calcPpm} PPM`);
    Sound.ok();
  };

  // Finish Reading Session
  const handleFinish = () => {
    if (!text) return;
    handlePause();
    const finalSecs = elapsedSecs || 1;
    const totalW = words.length;
    const finalPpm = ppm || Math.round(totalW / (finalSecs / 60));

    onFinishReading({
      secs: finalSecs,
      ppm: finalPpm,
      words: totalW,
    });
  };

  // Pronounce word directly (Accessible touch feature)
  const handleWordClick = (wordText: string) => {
    const rate = getSpeechRate(speed, customRate);
    Speech.say(wordText, rate);
  };

  // Error Correction for Detectives Mode
  const handleFixError = (w: WordToken) => {
    const response = prompt('¿Cómo se escribe esta palabra correctamente?', w.fix || '');
    if (response === null) return;
    if (response.trim().toLowerCase() === (w.fix || '').trim().toLowerCase()) {
      setFixedErrors((prev) => ({ ...prev, [w.i]: true }));
      Sound.ok();
      onToast('✅ ¡Correcto! Has descubierto y corregido el error.');
    } else {
      Sound.bad();
      onToast(`Casi. Se escribe: ${w.fix}`);
    }
  };

  // Check Gaps for Huecos Mode
  const handleCheckGaps = () => {
    const gapWords = words.filter((w) => w.gap);
    if (!gapWords.length) return;
    let ok = 0;
    gapWords.forEach((w) => {
      if ((gapAnswers[w.i] || '').trim().toLowerCase() === w.txt.trim().toLowerCase()) {
        ok++;
      }
    });
    const msg = `${ok} de ${gapWords.length} huecos correctos`;
    setGapFeedback(msg);
    if (ok === gapWords.length) {
      Sound.win();
      onToast(`🎉 ¡Enhorabuena! ${msg}`);
    } else if (ok > 0) {
      Sound.ok();
      onToast(`👍 Buen esfuerzo: ${msg}`);
    } else {
      Sound.bad();
      onToast(`Revisa las opciones: ${msg}`);
    }
  };

  // RENDER DUAL CONTROLS TOOLBAR (Mirroring V7 top and bottom for PDI accessibility)
  const renderControlsBar = (positionKey: string) => (
    <div key={positionKey} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs md:text-sm">
      {/* 1. Reading Mode and Speed Presets */}
      <div className="flex items-center gap-2 flex-wrap">
        <label className="font-extrabold text-slate-800">Modo:</label>
        <select
          value={mode}
          onChange={(e) => changeReadingMode(e.target.value as ReadingMode)}
          className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 shadow-xs cursor-pointer focus:ring-2 focus:ring-blue-400"
        >
          {READING_MODES.map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <label className="font-extrabold text-slate-800 ml-1">Velocidad:</label>
        <select
          value={speed}
          onChange={(e) => changeSpeedAndRhythm(e.target.value as SpeedPreset)}
          className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 font-bold text-slate-900 shadow-xs cursor-pointer focus:ring-2 focus:ring-blue-400"
        >
          <option value="super">🐌 Superlenta</option>
          <option value="muy">🐢 Muy lenta</option>
          <option value="lenta">🚶 Lenta</option>
          <option value="media">🏃 Media</option>
          <option value="rapida">⚡ Rápida</option>
        </select>

        {/* Live Rhythm Stepper +/- Buttons for Instant Cadence Modification on PDI */}
        <div className="inline-flex items-center gap-1 bg-white border border-slate-300 rounded-xl px-2 py-1 shadow-2xs">
          <button
            type="button"
            onClick={() => changeSpeedAndRhythm(speed, Math.max(0.6, customRate - 0.1))}
            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center cursor-pointer active:scale-95"
            title="Hacer más lento el ritmo actual"
          >
            🐢 -
          </button>
          <span className="font-mono font-bold text-xs px-1 text-blue-700 min-w-[36px] text-center">
            {Math.round(getSpeechRate(speed, customRate) * 100)}%
          </span>
          <button
            type="button"
            onClick={() => changeSpeedAndRhythm(speed, Math.min(1.8, customRate + 0.1))}
            className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs flex items-center justify-center cursor-pointer active:scale-95"
            title="Acelerar el ritmo actual"
          >
            + 🐇
          </button>
        </div>
      </div>

      {/* 2. Playback Control Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {!isPlaying ? (
          <button
            type="button"
            onClick={handlePlay}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>▶️</span> Escuchar
          </button>
        ) : (
          <button
            type="button"
            onClick={handlePause}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>⏸️</span> Pausar
          </button>
        )}

        <button
          type="button"
          onClick={handleResume}
          disabled={isPlaying}
          className="px-3 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-40 text-slate-800 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
          title="Continuar"
        >
          ▶️ Continuar
        </button>

        <button
          type="button"
          onClick={handleStop}
          className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
          title="Detener lectura"
        >
          ⏹️ Detener
        </button>

        {/* Navigation Step Buttons */}
        <div className="flex items-center gap-1 border-l border-slate-300 pl-2 ml-1">
          <button
            type="button"
            onClick={handleHome}
            className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            title="Ir al inicio de la lectura"
          >
            ⏮️
          </button>
          <button
            type="button"
            onClick={handleRepeatUnit}
            className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            title="Repetir unidad actual"
          >
            🔁
          </button>
          <button
            type="button"
            onClick={handlePrev}
            className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            title="Unidad anterior"
          >
            ⬅️
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold rounded-xl active:scale-95 transition-all cursor-pointer"
            title="Unidad siguiente"
          >
            ➡️
          </button>
        </div>
      </div>

      {/* 3. Visual Assistive Toggles */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-200/60 w-full justify-end">
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none font-medium">
          <input
            type="checkbox"
            checked={showRuler}
            onChange={(e) => setShowRuler(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
          />
          <span>Regla</span>
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none font-medium">
          <input
            type="checkbox"
            checked={showSyColors}
            onChange={(e) => setShowSyColors(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
          />
          <span>Colores Sílabas</span>
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none font-medium">
          <input
            type="checkbox"
            checked={autoFollow}
            onChange={(e) => setAutoFollow(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
          />
          <span>Seguimiento</span>
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none font-medium">
          <input
            type="checkbox"
            checked={reinforceSize}
            onChange={(e) => setReinforceSize(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
          />
          <span>Refuerzo Zoom</span>
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none font-medium">
          <input
            type="checkbox"
            checked={showPictos}
            onChange={(e) => setShowPictos(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
          />
          <span>Pictogramas</span>
        </label>
        <label className="inline-flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none font-medium">
          <input
            type="checkbox"
            checked={focusMask}
            onChange={(e) => setFocusMask(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 cursor-pointer"
          />
          <span>Máscara de enfoque</span>
        </label>
      </div>
    </div>
  );

  if (!text) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs space-y-4">
        <span className="text-5xl">📚</span>
        <h3 className="text-xl font-bold text-slate-800">No hay ninguna lectura cargada</h3>
        <p className="text-slate-500 text-sm max-w-md mx-auto">
          Accede a la biblioteca para seleccionar una de las 60 lecturas graduadas o crear una nueva para tu aula.
        </p>
        <button
          type="button"
          onClick={() => onNavigate('biblioteca')}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 active:scale-95 transition-all cursor-pointer"
        >
          Ver Biblioteca de lecturas
        </button>
      </div>
    );
  }

  const activeUnit = units[unitIdx];
  const isPyramidMode = ['piramidal', 'acumulativa', 'escalera'].includes(mode);

  return (
    <div className={`space-y-4 ${showSyColors ? 'sycolor' : ''} ${focusMask ? 'focus-mask-on' : ''}`}>
      {/* Reader Header Title & Level Info */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-blue-100 text-blue-800">
              Nivel {text.level}
            </span>
            <span className="text-xs font-semibold text-slate-500">{text.category}</span>
            <span className="text-xs text-slate-400 font-mono">({words.length} palabras)</span>
          </div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>📖</span> {text.title}
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('biblioteca')}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 active:scale-95 cursor-pointer flex items-center gap-1.5"
          >
            <span>📚</span> Elegir otra
          </button>
        </div>
      </div>

      {/* TOP CONTROLS BAR */}
      {renderControlsBar('top-controls')}

      {/* TURN PROMPT BANNER (Echo reading or guided pauses) */}
      {turnPrompt && (
        <div className="p-3.5 bg-amber-300 text-slate-950 font-black text-center text-sm md:text-base rounded-2xl shadow-md border-2 border-amber-400 animate-pulse">
          {turnPrompt}
        </div>
      )}

      {/* Mode-specific interactive bar for Huecos & Detectives */}
      {mode === 'huecos' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-blue-900">
            🕳️ Completa los huecos seleccionando la palabra correcta en el texto.
          </span>
          <div className="flex items-center gap-2">
            {gapFeedback && <span className="text-xs font-black text-blue-800">{gapFeedback}</span>}
            <button
              type="button"
              onClick={handleCheckGaps}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-xs cursor-pointer active:scale-95"
            >
              ✅ Comprobar huecos
            </button>
          </div>
        </div>
      )}

      {mode === 'detectives' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-amber-900">
            🕵️ Modo Detectives: Encuentra las palabras con falta de ortografía (subrayadas en rojo) y corrígelas.
          </span>
          <span className="text-xs font-extrabold text-amber-950 bg-amber-200 px-3 py-1 rounded-xl">
            Corregidos: {Object.keys(fixedErrors).length} de {words.filter((w) => w.err).length}
          </span>
        </div>
      )}

      {/* MAIN READING STAGE */}
      <div
        ref={wrapRef}
        className="relative bg-white border-2 border-slate-300 rounded-2xl p-6 md:p-8 min-h-[300px] max-h-[65vh] overflow-y-auto shadow-inner"
        style={{ fontSize: `${settings.fs}px`, lineHeight: 2.1 }}
      >
        {/* Visual Reading Ruler */}
        {showRuler && <div ref={rulerRef} className="ruler-bar" />}

        {isPyramidMode ? (
          /* Stepped Pyramid / Escalera mode (Progressive Ladder representation) */
          <div className="space-y-4">
            <div className="flex flex-col-reverse gap-2 font-bold">
              {activeUnit?.parts ? (
                Array.from({ length: activeUnit.step || 1 }).map((_, stepIdx) => {
                  const lineText = activeUnit.parts?.slice(0, stepIdx + 1).join(' ');
                  const isCurrentStep = stepIdx + 1 === activeUnit.step;
                  return (
                    <div
                      key={stepIdx}
                      className={`p-2.5 rounded-xl border-l-8 transition-all ${
                        isCurrentStep
                          ? 'bg-amber-300 text-slate-950 font-black border-blue-600 shadow-md scale-[1.01]'
                          : 'bg-slate-100 text-slate-600 border-slate-300 opacity-60'
                      }`}
                    >
                      {lineText}
                    </div>
                  );
                })
              ) : (
                <div className="text-slate-400 text-sm">Inicia la lectura para ver la construcción piramidal</div>
              )}
            </div>

            {/* Base full text reference */}
            <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">
              <span className="font-bold block mb-1">Texto de referencia:</span>
              <p className="leading-relaxed opacity-75">{text.text}</p>
            </div>
          </div>
        ) : (
          /* Standard, Syllabic and Sentence View */
          <div className="rtext select-text transition-all">
            {paras.map((p) => {
              const isParaActive = activeUnit?.p === p.i;
              return (
                <div
                  key={p.i}
                  data-p={p.i}
                  className={`par mb-4 transition-all ${
                    isParaActive && mode === 'parrafo' ? 'sentline' : ''
                  }`}
                >
                  {p.sents.map((fIdx) => {
                    const sentence = sents[fIdx];
                    if (!sentence) return null;
                    const isSentActive = activeUnit?.f === fIdx;

                    return (
                      <span
                        key={fIdx}
                        data-f={fIdx}
                        className={`sent inline rounded-lg transition-all ${
                          isSentActive && (mode === 'frase' || mode === 'eco' || mode === 'guiada' || mode === 'dramatizada' || mode === 'repetida' || mode === 'acompanada' || mode === 'expresiva')
                            ? 'sentline'
                            : ''
                        }`}
                      >
                        {sentence.wids.map((wIdx) => {
                          const w = words[wIdx];
                          if (!w) return null;

                          const isWordActive = activeUnit?.w === w.i;
                          const isDimmed = focusMask && isPlaying && !isWordActive && !isSentActive && !isParaActive;

                          let wordContent: React.ReactNode = null;

                          if (w.err && mode === 'detectives' && !fixedErrors[w.i]) {
                            wordContent = (
                              <span
                                onClick={() => handleFixError(w)}
                                className="underline decoration-wavy decoration-red-500 bg-red-100 text-red-900 rounded px-1.5 py-0.5 font-bold cursor-pointer hover:bg-red-200"
                                title="¡Error ortográfico! Pulsa para corregir"
                              >
                                {w.txt}
                              </span>
                            );
                          } else if (w.err && fixedErrors[w.i]) {
                            wordContent = (
                              <span className="bg-emerald-100 text-emerald-900 font-black px-1.5 py-0.5 rounded">
                                {w.fix}
                              </span>
                            );
                          } else if (w.gap && mode === 'huecos') {
                            const isSelected = gapAnswers[w.i];
                            const isCorrect = isSelected?.toLowerCase() === w.txt.toLowerCase();
                            wordContent = (
                              <select
                                value={gapAnswers[w.i] || ''}
                                onChange={(e) => setGapAnswers((prev) => ({ ...prev, [w.i]: e.target.value }))}
                                className={`border-b-4 text-base font-black px-2 py-1 rounded mx-1 cursor-pointer ${
                                  isSelected
                                    ? isCorrect
                                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                                      : 'border-rose-500 bg-rose-50 text-rose-900'
                                    : 'border-blue-600 bg-blue-50 text-blue-900'
                                }`}
                              >
                                <option value="">¿...?</option>
                                <option value={w.txt}>{w.txt}</option>
                                {(text.vocab || []).filter((v) => v !== w.txt).slice(0, 2).map((voc) => (
                                  <option key={voc} value={voc}>{voc}</option>
                                ))}
                              </select>
                            );
                          } else {
                            // Syllables
                            wordContent = w.sids.map((sid) => {
                              const syObj = syls[sid];
                              const isSylActive = activeUnit?.s === sid;
                              return (
                                <span
                                  key={sid}
                                  data-s={sid}
                                  className={`sy ${isSylActive ? 'hl' : ''} ${isSylActive && reinforceSize ? 'rein' : ''}`}
                                >
                                  {syObj?.txt || ''}
                                </span>
                              );
                            });
                          }

                          return (
                            <span
                              key={w.i}
                              data-w={w.i}
                              className={`w inline-block rounded-md px-1 mx-0.5 cursor-pointer transition-all ${
                                isWordActive && (activeUnit?.kind === 'word' || activeUnit?.s === undefined) ? 'hlw' : ''
                              } ${isDimmed ? 'dimmed' : ''}`}
                              onClick={() => handleWordClick(w.txt)}
                              title="Haz clic para escuchar esta palabra"
                            >
                              {w.picto && showPictos && (
                                <span
                                  className="inline-flex flex-col items-center justify-center align-middle mx-1 w-9 h-9"
                                  dangerouslySetInnerHTML={{ __html: Storage.getAnyPictoSvg(w.picto) }}
                                />
                              )}
                              {wordContent}
                            </span>
                          );
                        })}{' '}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BOTTOM CONTROLS BAR (Dual bar for comfortable interactive PDI touch reach) */}
      {renderControlsBar('bottom-controls')}

      {/* LIVE STATS AND PROGRESS BAR */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6 font-bold text-slate-700 text-sm">
          <span className="flex items-center gap-1.5">
            <span>⏱️</span> Tiempo: <b className="text-slate-900 font-mono text-base">{elapsedSecs}s</b>
          </span>
          <span className="flex items-center gap-1.5">
            <span>📝</span> Palabras: <b className="text-slate-900 font-mono text-base">{mode === 'autonomo' ? words.length : readWordsCount}</b>
          </span>
          <span className="flex items-center gap-1.5">
            <span>🚀</span> Velocidad: <b className="text-blue-600 font-mono text-base">{ppm} PPM</b>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMeasureFluency}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-300 active:scale-95 transition-all cursor-pointer"
          >
            📏 Medir Fluidez
          </button>
          <button
            type="button"
            onClick={handleFinish}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-md active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>✅</span> He terminado
          </button>
        </div>
      </div>
    </div>
  );
};
