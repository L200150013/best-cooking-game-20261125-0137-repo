// DAPUR KILAT — semua gambar digambar vektor di canvas, tanpa aset luar.
import {
  W, H, SHIFT_SECONDS, INGREDIENTS, BIN_ORDER, STATIONS, DISHES,
  LAYOUT, binRect, stationRect, ticketRect, plateChipRect,
} from './config.js';

const CREAM = '#fff8ea';
const INK = '#2b2118';
const WOOD = '#8b5a2b';
const RED = '#b3402e';
const SAGE = '#7a9b6d';
const GOLD = '#e0a800';

export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, font, color, align) {
  ctx.font = font;
  ctx.fillStyle = color || INK;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

// Ikon bahan sederhana, digambar dari bentuk dasar.
export function drawIcon(ctx, icon, cx, cy, s, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, s * 0.08);
  if (icon === 'bowl') {
    ctx.beginPath(); ctx.arc(0, -s * 0.1, s * 0.42, 0, Math.PI); ctx.fill();
    ctx.fillRect(-s * 0.45, -s * 0.16, s * 0.9, s * 0.1);
    ctx.beginPath(); ctx.arc(0, -s * 0.22, s * 0.3, Math.PI, 0); ctx.fillStyle = '#fff'; ctx.fill();
  } else if (icon === 'noodle') {
    ctx.beginPath();
    for (let i = -2; i <= 2; i++) {
      ctx.moveTo(-s * 0.4, i * s * 0.16);
      ctx.quadraticCurveTo(0, i * s * 0.16 + s * 0.12, s * 0.4, i * s * 0.16);
    }
    ctx.stroke();
  } else if (icon === 'drum') {
    ctx.beginPath(); ctx.arc(-s * 0.08, s * 0.05, s * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#f5ead2'; ctx.lineWidth = s * 0.1;
    ctx.beginPath(); ctx.moveTo(s * 0.18, s * 0.22); ctx.lineTo(s * 0.42, s * 0.42); ctx.stroke();
    ctx.fillStyle = '#f5ead2';
    ctx.beginPath(); ctx.arc(s * 0.45, s * 0.45, s * 0.09, 0, Math.PI * 2); ctx.fill();
  } else if (icon === 'egg') {
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath(); ctx.ellipse(0, 0, s * 0.34, s * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f2a541';
    ctx.beginPath(); ctx.arc(0, s * 0.05, s * 0.18, 0, Math.PI * 2); ctx.fill();
  } else if (icon === 'chili') {
    ctx.beginPath();
    ctx.moveTo(-s * 0.35, -s * 0.25);
    ctx.quadraticCurveTo(s * 0.1, -s * 0.45, s * 0.38, -s * 0.05);
    ctx.quadraticCurveTo(s * 0.15, s * 0.35, -s * 0.3, s * 0.3);
    ctx.quadraticCurveTo(-s * 0.45, 0, -s * 0.35, -s * 0.25);
    ctx.fill();
    ctx.strokeStyle = SAGE; ctx.lineWidth = s * 0.08;
    ctx.beginPath(); ctx.moveTo(s * 0.32, -s * 0.12); ctx.quadraticCurveTo(s * 0.5, -s * 0.3, s * 0.42, -s * 0.45); ctx.stroke();
  } else if (icon === 'bottle') {
    ctx.fillRect(-s * 0.14, -s * 0.42, s * 0.28, s * 0.2);
    ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.2); ctx.lineTo(s * 0.2, -s * 0.2);
    ctx.lineTo(s * 0.3, s * 0.4); ctx.lineTo(-s * 0.3, s * 0.4); ctx.closePath(); ctx.fill();
  } else if (icon === 'cup') {
    ctx.fillRect(-s * 0.28, -s * 0.3, s * 0.56, s * 0.6);
    ctx.beginPath(); ctx.arc(s * 0.32, 0, s * 0.18, -Math.PI / 2, Math.PI / 2); ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.fillRect(-s * 0.24, -s * 0.26, s * 0.48, s * 0.08);
  } else { // cube (gula)
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#cbb98f';
    ctx.fillRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.6);
    ctx.strokeRect(-s * 0.3, -s * 0.3, s * 0.6, s * 0.6);
    ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.3); ctx.lineTo(s * 0.3, s * 0.3); ctx.stroke();
  }
  ctx.restore();
}

function patienceColor(frac) {
  if (frac > 0.5) return '#4caf50';
  if (frac > 0.25) return '#f2a541';
  return '#d32f2f';
}

export class Renderer {
  constructor(ctx) { this.ctx = ctx; }

  draw(game) {
    const ctx = this.ctx;
    this.background(game);
    if (game.screen === 'title') { this.titleScreen(game); return; }
    if (game.screen === 'results') { this.resultsScreen(game); this.hud(game); return; }
    this.hud(game);
    this.orderBoard(game);
    this.bins(game);
    this.stations(game);
    this.plateArea(game);
    this.messageBar(game);
    this.helpBar(game);
    this.particles(game);
    this.floaters(game);
    if (game.paused) {
      ctx.fillStyle = 'rgba(43,33,24,0.55)';
      ctx.fillRect(0, 0, W, H);
      text(ctx, 'JEDA', 640, 340, 'bold 64px Georgia, serif', '#fff8ea', 'center');
      text(ctx, 'Tekan P atau klik tombol jeda untuk lanjut', 640, 390, '20px system-ui, sans-serif', '#fff8ea', 'center');
    }
  }

  background(game) {
    const ctx = this.ctx;
    ctx.fillStyle = '#f6e8d3';
    ctx.fillRect(0, 0, W, H);
    // Lantai ubin bawah.
    ctx.fillStyle = '#e8d3ae';
    ctx.fillRect(0, 640, W, 80);
    ctx.strokeStyle = '#d9c193';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 640); ctx.lineTo(x, 720); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, 680); ctx.lineTo(W, 680); ctx.stroke();
    // Peralatan gantung (siluet) di strip atas dapur.
    ctx.fillStyle = '#d9c193';
    for (let i = 0; i < 9; i++) {
      const x = 340 + i * 96;
      ctx.beginPath(); ctx.arc(x, 62, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x - 1, 52, 2, 12);
    }
  }

  hud(game) {
    const ctx = this.ctx;
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(0, 0, W, 56);
    text(ctx, '🍳 DAPUR KILAT', 16, 36, 'bold 24px Georgia, serif', '#ffd98a');
    const left = game.timeLeft();
    const mm = Math.floor(left / 60);
    const ss = String(Math.floor(left % 60)).padStart(2, '0');
    const timerColor = left <= 30 ? '#ff6b5e' : '#fff8ea';
    text(ctx, `⏱ ${mm}:${ss}`, 560, 37, 'bold 26px system-ui, sans-serif', timerColor, 'center');
    // Koin.
    ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.arc(724, 28, 13, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a5b00';
    text(ctx, '¢', 724, 33, 'bold 16px system-ui, sans-serif', '#7a5b00', 'center');
    text(ctx, `${game.coins}`, 746, 37, 'bold 24px system-ui, sans-serif', '#fff8ea');
    // Kombo.
    const comboColor = game.combo >= 3 ? '#ff8a3d' : '#fff8ea';
    text(ctx, game.combo >= 3 ? `🔥 KOMBO x${game.combo}` : `Kombo x${game.combo}`, 880, 37, 'bold 22px system-ui, sans-serif', comboColor);
    // Tombol pause & mute.
    for (const [r, label] of [[LAYOUT.pauseBtn, game.paused ? '▶' : 'II'], [LAYOUT.muteBtn, game.sfx.muted ? '🔇' : '🔊']]) {
      rr(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fillStyle = '#5b4632'; ctx.fill();
      text(ctx, label, r.x + r.w / 2, r.y + 25, '18px system-ui, sans-serif', '#fff8ea', 'center');
    }
    text(ctx, 'Shift 1 · Warung Malam', 1060, 20, '12px system-ui, sans-serif', '#cbb98f', 'right');
    text(ctx, `Tersaji: ${game.served}`, 1060, 40, '12px system-ui, sans-serif', '#cbb98f', 'right');
  }

  orderBoard(game) {
    const ctx = this.ctx;
    const b = LAYOUT.board;
    rr(ctx, b.x, b.y, b.w, b.h, 12);
    ctx.fillStyle = CREAM; ctx.fill();
    ctx.strokeStyle = WOOD; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, '📋 ORDER BOARD', b.x + 14, b.y + 26, 'bold 17px system-ui, sans-serif', RED);
    if (!game.orders.length) {
      text(ctx, 'Belum ada pesanan…', b.x + 14, b.y + 70, '15px system-ui, sans-serif', '#8a7a63');
      text(ctx, 'Pesanan pertama', b.x + 14, b.y + 94, '15px system-ui, sans-serif', '#8a7a63');
      text(ctx, 'segera masuk!', b.x + 14, b.y + 116, '15px system-ui, sans-serif', '#8a7a63');
    }
    game.orders.forEach((o, i) => {
      const r = ticketRect(i);
      const dish = DISHES[o.dish];
      const frac = Math.max(0, o.patience / o.maxPatience);
      const urgent = frac <= 0.25;
      rr(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.fillStyle = urgent ? '#fff0ec' : '#ffffff'; ctx.fill();
      ctx.strokeStyle = urgent ? '#d32f2f' : WOOD; ctx.lineWidth = urgent ? 3 : 1.5; ctx.stroke();
      // Nama hidangan + harga.
      ctx.fillStyle = dish.color;
      ctx.fillRect(r.x, r.y, 8, r.h);
      text(ctx, dish.name, r.x + 18, r.y + 26, 'bold 17px system-ui, sans-serif', INK);
      text(ctx, `${dish.base}¢`, r.x + r.w - 12, r.y + 26, 'bold 15px system-ui, sans-serif', '#8a7a63', 'right');
      // Checklist bahan (centang bila sudah di piring).
      o.items.forEach((it, j) => {
        const done = game.plate.some((p) => p.ing === it.ing);
        const y = r.y + 50 + j * 20;
        ctx.fillStyle = done ? '#2e7d32' : '#b9a98d';
        ctx.beginPath(); ctx.arc(r.x + 24, y - 4, 7, 0, Math.PI * 2); ctx.fill();
        if (done) text(ctx, '✓', r.x + 24, y, 'bold 11px system-ui, sans-serif', '#fff', 'center');
        text(ctx, INGREDIENTS[it.ing].label, r.x + 38, y, '14px system-ui, sans-serif', done ? '#2e7d32' : INK);
        const prepName = { raw: 'langsung', chop: 'cincang', fry: 'goreng', boil: 'rebus' }[INGREDIENTS[it.ing].prep];
        text(ctx, prepName, r.x + r.w - 12, y, '12px system-ui, sans-serif', '#8a7a63', 'right');
      });
      // Patience bar.
      const barY = r.y + r.h - 18;
      ctx.fillStyle = '#e5d9c3';
      rr(ctx, r.x + 12, barY, r.w - 24, 10, 5); ctx.fill();
      ctx.fillStyle = patienceColor(frac);
      if (frac > 0) { rr(ctx, r.x + 12, barY, (r.w - 24) * frac, 10, 5); ctx.fill(); }
      if (urgent) text(ctx, 'CEPAT!', r.x + r.w - 12, barY - 4, 'bold 12px system-ui, sans-serif', '#d32f2f', 'right');
    });
  }

  bins(game) {
    const ctx = this.ctx;
    text(ctx, 'BAHAN — klik, lalu klik stasiun (1–8)', 312, 62, 'bold 13px system-ui, sans-serif', WOOD);
    BIN_ORDER.forEach((ingId, i) => {
      const r = binRect(i);
      const ing = INGREDIENTS[ingId];
      rr(ctx, r.x, r.y, r.w, r.h, 10);
      ctx.fillStyle = '#fffdf5'; ctx.fill();
      ctx.strokeStyle = WOOD; ctx.lineWidth = 1.5; ctx.stroke();
      drawIcon(ctx, ing.icon, r.x + r.w / 2, r.y + 34, 44, ing.color === '#ffffff' ? '#cbb98f' : ing.color);
      text(ctx, ing.label, r.x + r.w / 2, r.y + 76, 'bold 14px system-ui, sans-serif', INK, 'center');
      const prepName = { raw: 'langsung', chop: 'cincang', fry: 'goreng', boil: 'rebus' }[ing.prep];
      text(ctx, prepName, r.x + r.w / 2, r.y + 92, '11px system-ui, sans-serif', '#8a7a63', 'center');
      ctx.fillStyle = WOOD;
      ctx.beginPath(); ctx.arc(r.x + r.w - 14, r.y + 14, 10, 0, Math.PI * 2); ctx.fill();
      text(ctx, `${i + 1}`, r.x + r.w - 14, r.y + 18, 'bold 12px system-ui, sans-serif', '#fff', 'center');
    });
  }

  stations(game) {
    const ctx = this.ctx;
    text(ctx, 'STASIUN MASAK — klik untuk ambil saat SIAP (Q / W / E)', 312, 176, 'bold 13px system-ui, sans-serif', WOOD);
    STATIONS.forEach((st, i) => {
      const r = stationRect(i);
      const slot = game.stations[st.id];
      const prog = slot.ing ? Math.min(1, slot.t / slot.dur) : 0;
      const ready = slot.ing && prog >= 0.6 && !slot.burnt;
      rr(ctx, r.x, r.y, r.w, r.h, 12);
      ctx.fillStyle = ready ? '#e8f5e0' : '#fffdf5'; ctx.fill();
      ctx.strokeStyle = ready ? '#2e7d32' : WOOD; ctx.lineWidth = ready ? 3 : 1.5; ctx.stroke();
      if (ready) { ctx.save(); ctx.shadowColor = '#7dff8a'; ctx.shadowBlur = 24; ctx.strokeRect(r.x, r.y, r.w, r.h); ctx.restore(); }
      text(ctx, `${st.label} · ${st.sub}`, r.x + 16, r.y + 28, 'bold 16px system-ui, sans-serif', INK);
      text(ctx, `(${['Q', 'W', 'E'][i]})`, r.x + r.w - 16, r.y + 28, '13px system-ui, sans-serif', '#8a7a63', 'right');
      // Slot bahan.
      const slotY = r.y + 48;
      rr(ctx, r.x + 16, slotY, r.w - 32, 56, 8);
      ctx.fillStyle = '#f3e7cf'; ctx.fill();
      if (slot.ing) {
        const ing = INGREDIENTS[slot.ing];
        drawIcon(ctx, ing.icon, r.x + 48, slotY + 28, 40, ing.color === '#ffffff' ? '#cbb98f' : ing.color);
        text(ctx, ing.label, r.x + 80, slotY + 34, 'bold 15px system-ui, sans-serif', INK);
        if (slot.burnt) text(ctx, 'GOSONG — klik untuk buang', r.x + 80, slotY + 52, '12px system-ui, sans-serif', '#d32f2f');
        else if (ready && prog <= 0.95) text(ctx, 'SIAP! Zona hijau — PERFECT', r.x + 80, slotY + 52, 'bold 12px system-ui, sans-serif', '#2e7d32');
        else if (ready) text(ctx, 'SIAP! Klik untuk ambil', r.x + 80, slotY + 52, 'bold 12px system-ui, sans-serif', '#2e7d32');
        else text(ctx, 'Memasak…', r.x + 80, slotY + 52, '12px system-ui, sans-serif', '#8a7a63');
      } else {
        text(ctx, 'Kosong', r.x + r.w / 2, slotY + 34, '14px system-ui, sans-serif', '#b9a98d', 'center');
      }
      // Progress bar + zona perfect.
      const barY = r.y + 122;
      ctx.fillStyle = '#e5d9c3';
      rr(ctx, r.x + 16, barY, r.w - 32, 14, 7); ctx.fill();
      if (slot.ing) {
        const [p0, p1] = st.perfect;
        ctx.fillStyle = '#a8d5a2';
        ctx.fillRect(r.x + 16 + (r.w - 32) * p0, barY, (r.w - 32) * (p1 - p0), 14);
        ctx.fillStyle = slot.burnt ? '#5b4632' : '#d97b29';
        if (prog > 0) { rr(ctx, r.x + 16, barY, (r.w - 32) * prog, 14, 7); ctx.fill(); }
      }
      text(ctx, 'zona hijau = PERFECT (+2¢)', r.x + 16, barY + 30, '11px system-ui, sans-serif', '#8a7a63');
    });
  }

  plateArea(game) {
    const ctx = this.ctx;
    const p = LAYOUT.plate;
    rr(ctx, p.x, p.y, p.w, p.h, 12);
    ctx.fillStyle = CREAM; ctx.fill();
    ctx.strokeStyle = WOOD; ctx.lineWidth = 2; ctx.stroke();
    text(ctx, '🍽 PIRING — susun hidangan di sini', p.x + 14, p.y + 24, 'bold 15px system-ui, sans-serif', INK);
    // Piring bundar.
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(p.x + 90, p.y + 92, 62, 44, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d9c193'; ctx.lineWidth = 2; ctx.stroke();
    if (!game.plate.length) {
      text(ctx, 'Piring kosong', p.x + 90, p.y + 96, '13px system-ui, sans-serif', '#b9a98d', 'center');
    }
    game.plate.forEach((item, i) => {
      const r = plateChipRect(i);
      const ing = INGREDIENTS[item.ing];
      rr(ctx, r.x, r.y, r.w, r.h, 8);
      ctx.fillStyle = item.perfect ? '#e8f5e0' : '#fffdf5'; ctx.fill();
      ctx.strokeStyle = item.perfect ? '#2e7d32' : WOOD; ctx.lineWidth = 1.5; ctx.stroke();
      drawIcon(ctx, ing.icon, r.x + 26, r.y + 38, 36, ing.color === '#ffffff' ? '#cbb98f' : ing.color);
      text(ctx, ing.label, r.x + 50, r.y + 34, 'bold 13px system-ui, sans-serif', INK);
      text(ctx, item.perfect ? '★ PERFECT' : 'klik: lepas', r.x + 50, r.y + 54, '11px system-ui, sans-serif', item.perfect ? '#2e7d32' : '#8a7a63');
    });
    // Tombol SAJIKAN & BUANG.
    const s = LAYOUT.serveBtn;
    rr(ctx, s.x, s.y, s.w, s.h, 10);
    ctx.fillStyle = game.findMatchingTicket() ? '#2e7d32' : '#7a9b6d'; ctx.fill();
    text(ctx, 'SAJIKAN ✓', s.x + s.w / 2, s.y + 24, 'bold 18px system-ui, sans-serif', '#fff', 'center');
    text(ctx, '(Spasi)', s.x + s.w / 2, s.y + 44, '12px system-ui, sans-serif', '#e8f5e0', 'center');
    const t = LAYOUT.trashBtn;
    rr(ctx, t.x, t.y, t.w, t.h, 10);
    ctx.fillStyle = '#b3402e'; ctx.fill();
    text(ctx, '🗑 BUANG', t.x + t.w / 2, t.y + 24, 'bold 18px system-ui, sans-serif', '#fff', 'center');
    text(ctx, '(kosongkan piring)', t.x + t.w / 2, t.y + 44, '12px system-ui, sans-serif', '#ffd9d2', 'center');
  }

  messageBar(game) {
    const ctx = this.ctx;
    const m = LAYOUT.msg;
    if (game.messageT <= 0) return;
    ctx.fillStyle = 'rgba(58,42,26,0.92)';
    rr(ctx, m.x, m.y, m.w, m.h, 8); ctx.fill();
    text(ctx, game.message, m.x + 16, m.y + 24, 'bold 15px system-ui, sans-serif', '#ffd98a');
  }

  helpBar(game) {
    const ctx = this.ctx;
    const hb = LAYOUT.help;
    rr(ctx, hb.x, hb.y, hb.w, hb.h, 12);
    ctx.fillStyle = 'rgba(255,248,234,0.85)'; ctx.fill();
    ctx.strokeStyle = '#d9c193'; ctx.lineWidth = 1.5; ctx.stroke();
    text(ctx, 'CARA MAIN', hb.x + 16, hb.y + 26, 'bold 15px system-ui, sans-serif', RED);
    const lines = [
      '1. Klik bahan di counter — bahan mentah langsung ke piring, sisanya masuk stasiun.',
      '2. Ambil dari stasiun saat SIAP, usahakan di zona hijau (PERFECT +2¢). Jangan sampai gosong!',
      '3. Susun di piring sesuai tiket, lalu klik tiketnya (atau tombol SAJIKAN / Spasi).',
      '4. Sajikan cepat = bonus patience. Serve beruntun = kombo naik. Tiket merah = segera hangus!',
    ];
    lines.forEach((l, i) => text(ctx, l, hb.x + 16, hb.y + 50 + i * 23, '14px system-ui, sans-serif', INK));
    text(ctx, 'Menu: Nasi Goreng (nasi+telur+kecap+cabai) · Mie Ayam (mie+ayam+telur) · Mie Kuah (mie+ayam+cabai+kecap) · Es Teh (teh+gula)',
      hb.x + 16, hb.y + 148, '13px system-ui, sans-serif', '#8a7a63');
  }

  particles(game) {
    const ctx = this.ctx;
    for (const p of game.particles) {
      ctx.fillStyle = `rgba(255,255,255,${Math.max(0, p.life) * 0.55})`;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
    }
  }

  floaters(game) {
    const ctx = this.ctx;
    for (const f of game.floaters) {
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
      text(ctx, f.text, f.x, f.y, 'bold 30px Georgia, serif', f.color, 'center');
      ctx.globalAlpha = 1;
    }
  }

  titleScreen(game) {
    const ctx = this.ctx;
    // Spanduk.
    ctx.fillStyle = RED;
    ctx.fillRect(0, 90, W, 150);
    ctx.fillStyle = '#ffd98a';
    ctx.fillRect(0, 90, W, 6); ctx.fillRect(0, 234, W, 6);
    text(ctx, 'DAPUR KILAT', 640, 168, 'bold 76px Georgia, serif', '#fff8ea', 'center');
    text(ctx, '— WOK HEI RUSH —', 640, 212, 'bold 22px system-ui, sans-serif', '#ffd98a', 'center');
    text(ctx, 'Warung malam. Satu koki. Shift 3 menit. Pesanan tak berhenti datang.', 640, 280, '19px system-ui, sans-serif', INK, 'center');
    // Panel cara main.
    rr(ctx, 340, 310, 600, 180, 14);
    ctx.fillStyle = CREAM; ctx.fill();
    ctx.strokeStyle = WOOD; ctx.lineWidth = 2; ctx.stroke();
    const lines = [
      '📋 Baca tiket di order board — tiap hidangan punya resep sendiri.',
      '🥕 Klik bahan, masak di talenan / wajan / panci, susun di piring.',
      '⏱ Ambil saat SIAP di zona hijau = PERFECT. Sajikan sebelum patience habis.',
      '🔥 Serve beruntun menaikkan kombo. Tiket hangus atau salah serve = kombo reset.',
    ];
    lines.forEach((l, i) => text(ctx, l, 370, 348 + i * 30, '16px system-ui, sans-serif', INK));
    // Tombol mulai.
    const pulse = 1 + Math.sin(Date.now() / 300) * 0.03;
    ctx.save();
    ctx.translate(640, 552); ctx.scale(pulse, pulse);
    rr(ctx, -150, -32, 300, 64, 12);
    ctx.fillStyle = '#2e7d32'; ctx.fill();
    text(ctx, '▶ MULAI SHIFT', 0, 10, 'bold 26px system-ui, sans-serif', '#fff', 'center');
    ctx.restore();
    text(ctx, 'Mouse: klik semua aksi · Keyboard: 1–8 bahan · Q/W/E stasiun · Spasi sajikan · P jeda · M suara', 640, 622, '14px system-ui, sans-serif', '#8a7a63', 'center');
    text(ctx, 'Game orisinal — semua gambar & suara dibuat di kode, tanpa aset luar.', 640, 650, '13px system-ui, sans-serif', '#8a7a63', 'center');
  }

  resultsScreen(game) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(246,232,211,0.92)';
    ctx.fillRect(0, 56, W, H - 56);
    text(ctx, 'SHIFT SELESAI!', 640, 150, 'bold 52px Georgia, serif', RED, 'center');
    const stars = game.stars();
    for (let i = 0; i < 3; i++) {
      ctx.font = '64px Georgia, serif';
      ctx.fillStyle = i < stars ? GOLD : '#d9c193';
      ctx.textAlign = 'center';
      ctx.fillText('★', 540 + i * 100, 230);
    }
    const rows = [
      ['Koin didapat', `${game.coins}¢`],
      ['Hidangan tersaji', `${game.served}`],
      ['Kombo terbaik', `x${game.bestCombo}`],
      ['Bahan PERFECT', `${game.perfects}`],
    ];
    rows.forEach(([label, val], i) => {
      const y = 290 + i * 44;
      text(ctx, label, 480, y, '20px system-ui, sans-serif', INK);
      text(ctx, val, 800, y, 'bold 22px system-ui, sans-serif', INK, 'right');
    });
    const verdict = stars === 3 ? 'Koki legendaris! Wok hei-mu membara!' : stars === 2 ? 'Shift yang solid — hampir sempurna!' : stars === 1 ? 'Warung tetap buka. Latihan lagi!' : 'Dapur kacau… coba shift berikutnya!';
    text(ctx, verdict, 640, 500, 'bold 20px system-ui, sans-serif', INK, 'center');
    rr(ctx, 490, 560, 300, 64, 12);
    ctx.fillStyle = '#2e7d32'; ctx.fill();
    text(ctx, '↻ MAIN LAGI', 640, 600, 'bold 24px system-ui, sans-serif', '#fff', 'center');
  }
}
