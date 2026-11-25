// DAPUR KILAT — Wok Hei Rush: data & layout.
// Semua angka layout, resep, dan stasiun tinggal di sini supaya render,
// input, dan staging screenshot membaca satu sumber yang sama.

// Kanvas & waktu shift.
export const W = 1280;
export const H = 720;
export const SHIFT_SECONDS = 180;

// RNG deterministik berbasis tanggal (pesanan berubah tiap hari, tapi
// tetap sama sepanjang hari — adil dan bisa diuji ulang).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function daySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// Bahan: id, label, warna ikon, dan cara olahnya.
// prep: 'raw' (langsung ke piring), 'chop' (talenan), 'fry' (wajan), 'boil' (panci).
export const INGREDIENTS = {
  nasi:    { label: 'Nasi',    color: '#f5ead2', prep: 'fry',  icon: 'bowl' },
  mie:     { label: 'Mie',     color: '#f2c14e', prep: 'boil', icon: 'noodle' },
  ayam:    { label: 'Ayam',    color: '#e07856', prep: 'fry',  icon: 'drum' },
  telur:   { label: 'Telur',   color: '#fff3c4', prep: 'fry',  icon: 'egg' },
  cabai:   { label: 'Cabai',   color: '#c0392b', prep: 'chop', icon: 'chili' },
  kecap:   { label: 'Kecap',   color: '#5b3a1e', prep: 'raw',  icon: 'bottle' },
  teh:     { label: 'Teh',     color: '#a67c52', prep: 'raw',  icon: 'cup' },
  gula:    { label: 'Gula',    color: '#ffffff', prep: 'raw',  icon: 'cube' },
};
export const BIN_ORDER = ['nasi', 'mie', 'ayam', 'telur', 'cabai', 'kecap', 'teh', 'gula'];

// Stasiun: id, label, prep yang dilayani, durasi masak (detik), zona perfect.
export const STATIONS = [
  { id: 'chop', label: 'TALENAN', sub: 'Cincang', prep: 'chop', secs: 2.5, perfect: [0.6, 0.95] },
  { id: 'fry',  label: 'WAJAN',   sub: 'Goreng',  prep: 'fry',  secs: 4.0, perfect: [0.6, 0.95] },
  { id: 'boil', label: 'PANCI',   sub: 'Rebus',   prep: 'boil', secs: 5.0, perfect: [0.6, 0.95] },
];
export const READY_AT = 0.6; // progres 0.6+ = SIAP diambil; 0.6–0.95 = PERFECT
export const READY_GRACE = 3.0; // detik item boleh diambil setelah matang sebelum gosong

// Resep: id, nama, harga dasar, daftar bahan (urutan bebas, yang penting lengkap).
export const DISHES = {
  nasgor: {
    name: 'Nasi Goreng', base: 12, color: '#d97b29',
    items: ['nasi', 'telur', 'kecap', 'cabai'],
  },
  mieayam: {
    name: 'Mie Ayam', base: 11, color: '#e0a800',
    items: ['mie', 'ayam', 'telur'],
  },
  miekuah: {
    name: 'Mie Kuah', base: 12, color: '#c0392b',
    items: ['mie', 'ayam', 'cabai', 'kecap'],
  },
  esteh: {
    name: 'Es Teh', base: 6, color: '#a67c52',
    items: ['teh', 'gula'],
  },
};
export const DISH_ORDER = ['nasgor', 'mieayam', 'miekuah', 'esteh'];

// Ekonomi & kesulitan.
export const ECONOMY = {
  serveBase: 0,          // pakai DISHES[].base
  patienceBonusMax: 5,   // bonus sisa patience (proporsional)
  perfectBonus: 2,       // per bahan perfect
  failPenalty: 5,        // koin hilang saat serve salah
  star1: 40, star2: 80, star3: 130, // ambang bintang di layar hasil
};
export function spawnIntervalAt(elapsed) {
  // Pesanan datang makin cepat: 12 dtk -> 7 dtk selama shift.
  return 12 - (5 * elapsed) / SHIFT_SECONDS;
}
export function patienceAt(elapsed) {
  // Patience makin pendek: 45 dtk -> 30 dtk.
  return 45 - (15 * elapsed) / SHIFT_SECONDS;
}

// ---- Layout (semua hit-rect dibaca dari sini) ----
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 56 },
  board: { x: 12, y: 68, w: 284, h: 640 },
  ticket: { w: 268, h: 148, gap: 10 },
  bins: { x: 312, y: 68, w: 112, h: 96, gap: 8 },
  stations: { x: 312, y: 180, w: 304, h: 168, gap: 14 },
  plate: { x: 312, y: 364, w: 560, h: 132 },
  serveBtn: { x: 888, y: 380, w: 180, h: 56 },
  trashBtn: { x: 1084, y: 380, w: 180, h: 56 },
  msg: { x: 312, y: 504, w: 952, h: 36 },
  help: { x: 312, y: 548, w: 952, h: 160 },
  pauseBtn: { x: 1152, y: 10, w: 56, h: 36 },
  muteBtn: { x: 1212, y: 10, w: 56, h: 36 },
};

export function binRect(i) {
  const b = LAYOUT.bins;
  return { x: b.x + i * (b.w + b.gap), y: b.y, w: b.w, h: b.h };
}
export function stationRect(i) {
  const s = LAYOUT.stations;
  return { x: s.x + i * (s.w + s.gap), y: s.y, w: s.w, h: s.h };
}
export function ticketRect(i) {
  const t = LAYOUT.ticket;
  return { x: LAYOUT.board.x + 8, y: LAYOUT.board.y + 8 + i * (t.h + t.gap), w: t.w, h: t.h };
}
export function plateChipRect(i) {
  const p = LAYOUT.plate;
  return { x: p.x + 16 + i * 128, y: p.y + 56, w: 116, h: 76 };
}
export function inRect(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
