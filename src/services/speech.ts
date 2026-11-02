
class SpeechService {
  private keepAliveTimer: number | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private requestId = 0;

  public getVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    const all = window.speechSynthesis.getVoices() || [];
    return all.filter((v) => /^es/i.test(v.lang) || v.lang === '');
  }

  public getAllVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices() || [];
  }

  public stop(): void {
    // Invalidar primero cualquier evento pendiente de la locución anterior.
    this.requestId++;
    this.stopKeepAlive();

    const previousUtterance = this.currentUtterance;
    this.currentUtterance = null;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Speech cancellation handled safely.
      }
    }
  }

  private isCurrent(
    utterance: SpeechSynthesisUtterance,
    requestId: number
  ): boolean {
    return (
      this.requestId === requestId &&
      this.currentUtterance === utterance
    );
  }

  private startKeepAlive(
    utterance: SpeechSynthesisUtterance,
    requestId: number
  ): void {
    this.stopKeepAlive();

    this.keepAliveTimer = window.setInterval(() => {
      if (!this.isCurrent(utterance, requestId)) {
        this.stopKeepAlive();
        return;
      }

      if (window.speechSynthesis?.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      }
    }, 9000);
  }

  private stopKeepAlive(): void {
    if (this.keepAliveTimer !== null) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  public speak(
    text: string,
    options: {
      rate?: number;
      pitch?: number;
      voiceIdx?: number;
      onStart?: () => void;
      onEnd?: () => void;
      onError?: () => void;
    } = {}
  ): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return;
    }

    this.stop();

    const requestId = ++this.requestId;
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = 'es-ES';
    utterance.rate = options.rate ?? 1.0;
    utterance.pitch = options.pitch ?? 1.0;

    const allVoices = this.getAllVoices();

    if (
      options.voiceIdx !== undefined &&
      allVoices[options.voiceIdx]
    ) {
      utterance.voice = allVoices[options.voiceIdx];
    } else {
      const esVoice = allVoices.find((v) => /^es/i.test(v.lang));
      if (esVoice) utterance.voice = esVoice;
    }

    utterance.onstart = () => {
      if (!this.isCurrent(utterance, requestId)) return;

      this.startKeepAlive(utterance, requestId);
      options.onStart?.();
    };

    utterance.onend = () => {
      if (!this.isCurrent(utterance, requestId)) return;

      this.stopKeepAlive();
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = () => {
      if (!this.isCurrent(utterance, requestId)) return;

      this.stopKeepAlive();
      this.currentUtterance = null;
      options.onError?.();
    };

    this.currentUtterance = utterance;

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      if (!this.isCurrent(utterance, requestId)) return;

      this.stopKeepAlive();
      this.currentUtterance = null;
      options.onError?.();
    }
  }

  public say(text: string, rate: number = 0.9): void {
    this.speak(text, { rate });
  }
}

export const Speech = new SpeechService();
