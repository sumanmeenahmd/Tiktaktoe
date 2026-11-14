class SoundEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;

  public setEnabled(value: boolean) {
    this.enabled = value;
  }

  private getContext(): AudioContext | null {
    if (!this.enabled || typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private playTone(
    freq: number,
    durationSec: number,
    type: OscillatorType = 'sine',
    gainPeak = 0.08,
    delaySec = 0
  ) {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime + delaySec;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + durationSec + 0.02);
    } catch {
      // Ignore audio errors when context is blocked
    }
  }

  public playPlayerMove() {
    this.playTone(520, 0.09, 'triangle', 0.08);
  }

  public playComputerMove() {
    this.playTone(360, 0.1, 'sine', 0.07);
  }

  public playWin() {
    this.playTone(523.25, 0.14, 'triangle', 0.08, 0);
    this.playTone(659.25, 0.14, 'triangle', 0.08, 0.08);
    this.playTone(783.99, 0.24, 'triangle', 0.09, 0.16);
  }

  public playLoss() {
    this.playTone(349.23, 0.14, 'sine', 0.07, 0);
    this.playTone(293.66, 0.22, 'sine', 0.07, 0.1);
  }

  public playDraw() {
    this.playTone(440, 0.12, 'sine', 0.06, 0);
    this.playTone(440, 0.15, 'sine', 0.06, 0.13);
  }

  public playReset() {
    this.playTone(480, 0.06, 'sine', 0.04);
  }
}

export const soundFx = new SoundEngine();
