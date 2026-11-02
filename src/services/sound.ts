class SoundEngine {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  constructor() {
    this.setupUnlock();
  }

  private setupUnlock() {
    const unlock = () => {
      this.ready();
      document.removeEventListener('click', unlock);
      document.removeEventListener('keydown', unlock);
      document.removeEventListener('touchstart', unlock);
    };
    if (typeof window !== 'undefined') {
      document.addEventListener('click', unlock);
      document.addEventListener('keydown', unlock);
      document.addEventListener('touchstart', unlock);
    }
  }

  public ready() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch {
      this.ctx = null;
    }
  }

  public tone(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.16) {
    if (!this.enabled) return;
    this.ready();
    if (!this.ctx) return;

    try {
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, t);

      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + duration);
    } catch {
      // Audio playback failed silently
    }
  }

  public ok() {
    this.tone(523, 0.12, 'sine', 0.15);
    setTimeout(() => this.tone(659, 0.2, 'sine', 0.18), 120);
  }

  public bad() {
    // Soft, non-punitive gentle chime for neurodivergent pupils
    this.tone(310, 0.16, 'triangle', 0.12);
    setTimeout(() => this.tone(240, 0.22, 'triangle', 0.1), 130);
  }

  public click() {
    this.tone(740, 0.04, 'sine', 0.08);
  }

  public win() {
    this.tone(523, 0.12, 'sine', 0.15);
    setTimeout(() => this.tone(659, 0.12, 'sine', 0.16), 110);
    setTimeout(() => this.tone(784, 0.28, 'sine', 0.2), 220);
  }

  public beep() {
    this.tone(880, 0.08, 'sine', 0.06);
  }

  public test() {
    this.enabled = true;
    this.ok();
    setTimeout(() => this.bad(), 500);
    setTimeout(() => this.win(), 1000);
  }
}

export const Sound = new SoundEngine();
