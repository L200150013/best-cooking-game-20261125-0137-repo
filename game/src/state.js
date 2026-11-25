// DAPUR KILAT — logika game: pesanan, stasiun, piring, skor, shift.
// Semua aksi pemain masuk lewat fungsi act* di sini; staging screenshot
// memakai fungsi yang sama (bukan menulis state langsung).
import {
  W, H, SHIFT_SECONDS, STATIONS, DISHES, DISH_ORDER, INGREDIENTS,
  BIN_ORDER, ECONOMY, READY_AT, READY_GRACE, spawnIntervalAt, patienceAt,
  mulberry32, daySeed,
} from './config.js';
import { hitAt } from './input.js';

let nextOrderId = 1;

export class Game {
  constructor(sfx) {
    this.sfx = sfx;
    this.screen = 'title';
    this.paused = false;
    this.time = 0;
    this.coins = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.served = 0;
    this.perfects = 0;
    this.orders = [];
    this.stations = {};
    for (const s of STATIONS) this.stations[s.id] = { ing: null, t: 0, dur: 0, burnt: false };
    this.plate = [];
    this.particles = [];
    this.floaters = [];
    this.message = 'Selamat datang di Dapur Kilat!';
    this.messageT = 0;
    this.spawnTimer = 2;
    this.rng = mulberry32(daySeed());
    this.lastTickSecond = -1;
  }

  startGame() {
    this.screen = 'play';
    this.paused = false;
    this.time = 0;
    this.coins = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.served = 0;
    this.perfects = 0;
    this.orders = [];
    for (const s of STATIONS) this.stations[s.id] = { ing: null, t: 0, dur: 0, burnt: false };
    this.plate = [];
    this.particles = [];
    this.floaters = [];
    this.spawnTimer = 2;
    this.rng = mulberry32(daySeed());
    this.setMessage('Shift dimulai! Baca tiket, masak, sajikan!');
    this.sfx.ensure();
  }

  setMessage(text) { this.message = text; this.messageT = 4; }

  stationForPrep(prep) { return STATIONS.find((s) => s.prep === prep); }

  // --- Aksi pemain ---
  actBin(ingId) {
    if (this.screen !== 'play' || this.paused) return false;
    const ing = INGREDIENTS[ingId];
    if (!ing) return false;
    if (ing.prep === 'raw') {
      if (this.plate.length >= 4) { this.setMessage('Piring penuh! Sajikan dulu.'); this.sfx.buzz(); return false; }
      this.plate.push({ ing: ingId, perfect: false });
      this.sfx.pop();
      return true;
    }
    const st = this.stationForPrep(ing.prep);
    const slot = this.stations[st.id];
    if (slot.ing) { this.setMessage(`${st.label} sedang dipakai!`); return false; }
    slot.ing = ingId; slot.t = 0; slot.dur = st.secs; slot.burnt = false;
    if (st.prep === 'fry') this.sfx.sizzle();
    else this.sfx.thock();
    return true;
  }

  actStation(stationId) {
    if (this.screen !== 'play' || this.paused) return false;
    const slot = this.stations[stationId];
    if (!slot.ing) return false;
    if (slot.burnt) {
      slot.ing = null; slot.t = 0; slot.burnt = false;
      this.setMessage('Bahan gosong dibuang.');
      return true;
    }
    const st = STATIONS.find((s) => s.id === stationId);
    const prog = slot.t / slot.dur;
    if (prog < READY_AT) { this.setMessage(`${st.label} belum matang — tunggu zona hijau!`); return false; }
    if (this.plate.length >= 4) { this.setMessage('Piring penuh! Sajikan dulu.'); this.sfx.buzz(); return false; }
    const perfect = prog >= st.perfect[0] && prog <= st.perfect[1];
    this.plate.push({ ing: slot.ing, perfect });
    if (perfect) { this.perfects++; this.sfx.ding(); this.setMessage('PERFECT! Timing pas.'); }
    else this.sfx.pop();
    slot.ing = null; slot.t = 0; slot.burnt = false;
    return true;
  }

  removePlateChip(i) {
    if (this.screen !== 'play' || this.paused) return false;
    if (i < 0 || i >= this.plate.length) return false;
    this.plate.splice(i, 1);
    this.sfx.pop();
    return true;
  }

  actTrash() {
    if (this.screen !== 'play' || this.paused) return false;
    if (!this.plate.length) return false;
    this.plate = [];
    this.sfx.buzz();
    this.setMessage('Piring dikosongkan.');
    return true;
  }

  plateMatches(dishId) {
    const need = [...DISHES[dishId].items].sort();
    const have = this.plate.map((p) => p.ing).sort();
    return need.length === have.length && need.every((v, i) => v === have[i]);
  }

  findMatchingTicket() {
    return this.orders.find((o) => this.plateMatches(o.dish));
  }

  actServe(ticketIndex) {
    if (this.screen !== 'play' || this.paused) return false;
    const order = this.orders[ticketIndex];
    if (!order) return false;
    if (!this.plateMatches(order.dish)) {
      this.coins = Math.max(0, this.coins - ECONOMY.failPenalty);
      this.combo = 0;
      this.sfx.buzz();
      this.setMessage(`Salah! ${DISHES[order.dish].name} butuh bahan lain. -${ECONOMY.failPenalty} koin.`);
      return false;
    }
    const dish = DISHES[order.dish];
    const patienceFrac = Math.max(0, order.patience / order.maxPatience);
    const perfectCount = this.plate.filter((p) => p.perfect).length;
    const gain = dish.base + Math.round(ECONOMY.patienceBonusMax * patienceFrac)
      + ECONOMY.perfectBonus * perfectCount + this.combo;
    this.coins += gain;
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.served++;
    this.orders.splice(ticketIndex, 1);
    this.plate = [];
    this.sfx.coin();
    this.setMessage(`+${gain} koin — ${dish.name} tersaji! Kombo x${this.combo}`);
    this.addFloater(640, 300, `+${gain}`, '#2e7d32');
    return true;
  }

  serveBest() {
    if (this.screen !== 'play' || this.paused) return false;
    const t = this.findMatchingTicket();
    if (!t) { this.setMessage('Piring belum cocok dengan tiket mana pun.'); return false; }
    return this.actServe(this.orders.indexOf(t));
  }

  togglePause() {
    if (this.screen !== 'play') return;
    this.paused = !this.paused;
    this.setMessage(this.paused ? 'Jeda — tekan P untuk lanjut.' : 'Lanjut!');
  }
  toggleMute() { this.sfx.toggleMute(); }

  confirm() {
    if (this.screen === 'title') this.startGame();
    else if (this.screen === 'results') this.startGame();
  }

  click(x, y) {
    const hit = hitAt(x, y, this.screen);
    switch (hit.kind) {
      case 'mute': this.toggleMute(); return;
      case 'pause': this.togglePause(); return;
      case 'start': this.startGame(); return;
      case 'again': this.startGame(); return;
      case 'bin': this.actBin(BIN_ORDER[hit.index]); return;
      case 'station': this.actStation(STATIONS[hit.index].id); return;
      case 'ticket': this.actServe(hit.index); return;
      case 'plateChip': this.removePlateChip(hit.index); return;
      case 'serve': this.serveBest(); return;
      case 'trash': this.actTrash(); return;
      default: return;
    }
  }

  // --- Simulasi ---
  spawnOrder() {
    const dish = DISH_ORDER[Math.floor(this.rng() * DISH_ORDER.length)];
    const patience = patienceAt(this.time);
    this.orders.push({
      id: nextOrderId++, dish,
      items: DISHES[dish].items.map((ing) => ({ ing, done: false })),
      patience, maxPatience: patience,
    });
  }

  addFloater(x, y, text, color) {
    this.floaters.push({ x, y, text, color, life: 1.2 });
  }

  update(dt) {
    if (this.screen !== 'play' || this.paused) return;
    this.time += dt;
    if (this.messageT > 0) this.messageT -= dt;
    // Pesanan baru.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.orders.length < 4) {
      this.spawnOrder();
      this.spawnTimer = spawnIntervalAt(this.time);
    }
    // Patience tiket.
    for (let i = this.orders.length - 1; i >= 0; i--) {
      const o = this.orders[i];
      o.patience -= dt;
      if (o.patience <= 0) {
        this.orders.splice(i, 1);
        this.combo = 0;
        this.sfx.buzz();
        this.setMessage(`Tiket ${DISHES[o.dish].name} hangus! Kombo reset.`);
      }
    }
    // Stasiun masak.
    for (const s of STATIONS) {
      const slot = this.stations[s.id];
      if (!slot.ing) continue;
      slot.t += dt;
      if (slot.t >= slot.dur + READY_GRACE && !slot.burnt) {
        slot.burnt = true;
        this.setMessage(`${s.label}: gosong! Klik stasiun untuk membuang.`);
      }
      if (Math.random() < dt * 6) {
        this.particles.push({
          x: 320 + STATIONS.indexOf(s) * 318 + 150 + (Math.random() - 0.5) * 60,
          y: 210, vy: -28 - Math.random() * 20, life: 0.9, size: 5 + Math.random() * 7,
        });
      }
    }
    // Partikel & teks melayang.
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.y += p.vy * dt; p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.y -= 34 * dt; f.life -= dt;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }
    // Detik genting: bunyi tick saat <10 detik.
    const remain = Math.ceil(SHIFT_SECONDS - this.time);
    if (remain <= 10 && remain !== this.lastTickSecond) {
      this.lastTickSecond = remain;
      this.sfx.tick();
    }
    // Akhir shift.
    if (this.time >= SHIFT_SECONDS) {
      this.screen = 'results';
      this.sfx.ding();
    }
  }

  stars() {
    if (this.coins >= ECONOMY.star3) return 3;
    if (this.coins >= ECONOMY.star2) return 2;
    if (this.coins >= ECONOMY.star1) return 1;
    return 0;
  }

  timeLeft() { return Math.max(0, SHIFT_SECONDS - this.time); }
}
