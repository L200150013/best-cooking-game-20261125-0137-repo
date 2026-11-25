// DAPUR KILAT — input mouse + keyboard.
// Semua klik dipetakan ke aksi game; tidak ada state yang ditulis langsung
// dari luar — input hanya memanggil fungsi aksi di state.js.
import { BIN_ORDER, STATIONS, LAYOUT, binRect, stationRect, ticketRect, plateChipRect, inRect } from './config.js';

export class Input {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    canvas.addEventListener('pointerdown', (e) => this.onClick(e));
    window.addEventListener('keydown', (e) => this.onKey(e));
  }
  pos(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (this.canvas.width / r.width),
      y: (e.clientY - r.top) * (this.canvas.height / r.height),
    };
  }
  onClick(e) {
    const { x, y } = this.pos(e);
    this.game.sfx.ensure();
    this.game.click(x, y);
  }
  onKey(e) {
    if (e.repeat) return;
    const k = e.key.toLowerCase();
    this.game.sfx.ensure();
    if (k === 'p' || k === 'escape') { this.game.togglePause(); return; }
    if (k === 'm') { this.game.toggleMute(); return; }
    if (k === ' ') { e.preventDefault(); this.game.serveBest(); return; }
    if (k === 'enter') { this.game.confirm(); return; }
    const binIdx = ['1', '2', '3', '4', '5', '6', '7', '8'].indexOf(k);
    if (binIdx >= 0) { this.game.actBin(BIN_ORDER[binIdx]); return; }
    const stIdx = ['q', 'w', 'e'].indexOf(k);
    if (stIdx >= 0) { this.game.actStation(STATIONS[stIdx].id); return; }
    if (k === 'backspace' || k === 'delete') { this.game.actTrash(); return; }
  }
}

// Hit-test murni (dipakai game.click dan staging screenshot).
export function hitAt(x, y, screen) {
  if (inRect(LAYOUT.muteBtn, x, y)) return { kind: 'mute' };
  if (inRect(LAYOUT.pauseBtn, x, y)) return { kind: 'pause' };
  if (screen === 'title') {
    if (x >= 490 && x <= 790 && y >= 520 && y <= 584) return { kind: 'start' };
    return { kind: 'none' };
  }
  if (screen === 'results') {
    if (x >= 490 && x <= 790 && y >= 560 && y <= 624) return { kind: 'again' };
    return { kind: 'none' };
  }
  for (let i = 0; i < 8; i++) if (inRect(binRect(i), x, y)) return { kind: 'bin', index: i };
  for (let i = 0; i < 3; i++) if (inRect(stationRect(i), x, y)) return { kind: 'station', index: i };
  for (let i = 0; i < 4; i++) if (inRect(ticketRect(i), x, y)) return { kind: 'ticket', index: i };
  for (let i = 0; i < 4; i++) if (inRect(plateChipRect(i), x, y)) return { kind: 'plateChip', index: i };
  if (inRect(LAYOUT.serveBtn, x, y)) return { kind: 'serve' };
  if (inRect(LAYOUT.trashBtn, x, y)) return { kind: 'trash' };
  return { kind: 'none' };
}
