// DAPUR KILAT — efek suara synth WebAudio, tanpa file suara.
// AudioContext dibuat saat gestur pertama (klik), sesuai aturan browser.
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }
  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.25;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(vol || 0.5, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  noise(dur, vol, freq) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'bandpass'; f.frequency.value = freq || 1800; f.Q.value = 0.8;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol || 0.4, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(t0);
  }
  thock() { this.noise(0.08, 0.6, 900); this.tone(140, 0.08, 'triangle', 0.5, 70); }
  sizzle() { this.noise(0.35, 0.25, 3200); }
  ding() { this.tone(880, 0.18, 'sine', 0.5); this.tone(1318, 0.28, 'sine', 0.4); }
  coin() { this.tone(988, 0.09, 'square', 0.25); this.tone(1319, 0.16, 'square', 0.22); }
  buzz() { this.tone(160, 0.25, 'sawtooth', 0.4, 90); }
  pop() { this.tone(520, 0.07, 'sine', 0.4, 780); }
  tick() { this.tone(1200, 0.05, 'square', 0.15); }
  toggleMute() { this.muted = !this.muted; return this.muted; }
}
