/**
 * Spanish Syllabification Engine (Reglas ortográficas de la RAE)
 * Hiatos, diptongos, triptongos y grupos consonánticos inseparables.
 */

export const Syl = {
  V: 'aeiouáéíóúü',
  S: 'aeoáéó', // vocales fuertes / abiertas
  W: 'iuü',   // vocales débiles / cerradas sin tilde
  T: 'íú',    // vocales débiles con tilde (rompen diptongo)
  groups: [
    'bl', 'br', 'cl', 'cr', 'dr', 'fl', 'fr', 'gl', 'gr', 'pl', 'pr', 'tr', 'tl',
    'ch', 'll', 'rr'
  ],

  nuclei(w: string): [number, number][] {
    const r: [number, number][] = [];
    let i = 0;
    while (i < w.length) {
      if (this.V.includes(w[i])) {
        let j = i;
        while (j + 1 < w.length && this.V.includes(w[j + 1])) {
          const a = w[j];
          const b = w[j + 1];

          // Dos abiertas distintas o iguales forman hiato
          if (this.S.includes(a) && this.S.includes(b)) break;
          // Tilde en débil rompe diptongo
          if (this.T.includes(a) || this.T.includes(b)) break;
          // Dos débiles iguales forman hiato (ej: chi-i-ta)
          if (a === b && (a === 'i' || a === 'u')) break;

          j++;
        }
        r.push([i, j + 1]);
        i = j + 1;
      } else {
        i++;
      }
    }
    return r;
  },

  split(word: string): string[] {
    const clean = word.replace(/[^\wáéíóúüñÁÉÍÓÚÜÑ]/g, '');
    if (clean.length < 4) return [word];

    const w = clean.toLowerCase();
    const n = this.nuclei(w);
    if (n.length < 2) return [word];

    const cuts: number[] = [];
    for (let k = 0; k < n.length - 1; k++) {
      const end = n[k][1];
      const start = n[k + 1][0];
      const mid = w.slice(end, start);

      let pos = end;
      if (mid.length === 0) {
        pos = end;
      } else if (mid.length === 1) {
        // Una consonante entre dos núcleos va con el segundo: V-CV
        pos = end;
      } else if (mid.length === 2) {
        // Dos consonantes: si forman grupo trabado van con la segunda, si no se separan: VC-CV
        pos = this.groups.includes(mid) ? end : end + 1;
      } else if (mid.length === 3) {
        // Tres consonantes: si las dos últimas forman grupo, se separan VC-CCV
        pos = this.groups.includes(mid.slice(1)) ? end + 1 : end + 2;
      } else {
        // Cuatro consonantes: VCC-CCV
        pos = end + 2;
      }

      cuts.push(Math.max(end, Math.min(start, pos)));
    }

    const out: string[] = [];
    let prev = 0;
    cuts.forEach((c) => {
      if (c > prev) {
        out.push(clean.slice(prev, c));
        prev = c;
      }
    });
    if (prev < clean.length) {
      out.push(clean.slice(prev));
    }

    return out.length ? out : [word];
  },
};
