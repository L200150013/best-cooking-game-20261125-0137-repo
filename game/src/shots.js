// DAPUR KILAT — staging screenshot.
// Dipakai hanya bila URL membawa #shot=<nama>. Staging TIDAK menulis
// statistik langsung: ia memanggil fungsi aksi game yang sama dengan klik
// pemain (actBin/actStation/actServe) dan memajukan waktu lewat update()
// yang sama dengan loop utama — hanya lebih cepat. Keadaan yang tertangkap
// layar adalah keadaan yang bisa dicapai pemain sungguhan.
import { STATIONS, DISHES } from './config.js';

// Majukan simulasi sejauh `secs`, langkah 0.05 dtk, berhenti bila `stopWhen` benar.
function ff(game, secs, stopWhen) {
  const steps = Math.ceil(secs / 0.05);
  for (let i = 0; i < steps; i++) {
    game.update(0.05);
    if (stopWhen && stopWhen(game)) break;
    if (game.screen !== 'play') break;
  }
}

// Tunggu sampai stasiun masuk zona perfect (progres >= 0.65), lalu ambil.
function takeWhenReady(game, stationId) {
  ff(game, 12, (g) => {
    const s = g.stations[stationId];
    return !s.ing || s.t >= s.dur * 0.65 || s.burnt;
  });
  game.actStation(stationId);
}

// Masak + sajikan tiket ke-`ticketIndex` sampai habis lewat aksi nyata.
function cookAndServe(game, ticketIndex) {
  const order = game.orders[ticketIndex];
  if (!order) return false;
  const dish = DISHES[order.dish];
  for (const ingId of dish.items) {
    const prep = { nasi: 'fry', mie: 'boil', ayam: 'fry', telur: 'fry', cabai: 'chop', kecap: 'raw', teh: 'raw', gula: 'raw' }[ingId];
    game.actBin(ingId);
    if (prep !== 'raw') {
      const st = STATIONS.find((s) => s.prep === prep);
      takeWhenReady(game, st.id);
    }
    if (game.screen !== 'play') return false;
  }
  return game.actServe(ticketIndex);
}

export function stageShot(name, game) {
  if (name === 'play') {
    game.startGame();
    // Tunggu sampai 3 tiket aktif.
    ff(game, 30, (g) => g.orders.length >= 3);
    // Susun hidangan tiket pertama sampai setengah jalan: tiap bahan
    // diproses berurutan; bahan terakhir yang butuh stasiun dibiarkan
    // memasak supaya layar menunjukkan mid-assembly.
    const order = game.orders[0];
    if (order) {
      const dish = DISHES[order.dish];
      const prepOf = (ingId) => ({ nasi: 'fry', mie: 'boil', ayam: 'fry', telur: 'fry', cabai: 'chop', kecap: 'raw', teh: 'raw', gula: 'raw' })[ingId];
      const stationOf = (prep) => STATIONS.find((s) => s.prep === prep);
      dish.items.forEach((ingId, idx) => {
        const prep = prepOf(ingId);
        game.actBin(ingId);
        if (prep === 'raw') return;
        // Bila ada bahan berikutnya yang butuh stasiun yang sama, ambil
        // yang ini sekarang; kalau tidak, biarkan memasak.
        const laterSame = dish.items.slice(idx + 1).some((x) => prepOf(x) === prep);
        if (laterSame) takeWhenReady(game, stationOf(prep).id);
      });
      ff(game, 1.5); // stasiun terlihat sedang memasak + uap
    }
  } else if (name === 'rush') {
    game.startGame();
    ff(game, 30, (g) => g.orders.length >= 3);
    // Sajikan 3 hidangan berturut-turut -> kombo x3.
    for (let n = 0; n < 3; n++) {
      if (!game.orders.length) break;
      cookAndServe(game, 0);
    }
    // Majukan sampai ada tiket merah (patience < 8 dtk) tapi belum hangus.
    ff(game, 40, (g) => g.orders.some((o) => o.patience < 8 && o.patience > 2));
    // Tinggalkan hidangan setengah jadi di piring (tiket berikutnya).
    const next = game.orders[0];
    if (next) {
      const dish = DISHES[next.dish];
      const prepOf = (ingId) => ({ nasi: 'fry', mie: 'boil', ayam: 'fry', telur: 'fry', cabai: 'chop', kecap: 'raw', teh: 'raw', gula: 'raw' })[ingId];
      for (const ingId of dish.items.slice(0, 2)) {
        game.actBin(ingId);
        if (prepOf(ingId) !== 'raw') takeWhenReady(game, STATIONS.find((s) => s.prep === prepOf(ingId)).id);
      }
    }
    // Terakhir: nyalakan satu stasiun supaya ada yang memasak (jangan
    // sampai gosong — langsung bekukan setelah 1 detik).
    const free = STATIONS.find((s) => !game.stations[s.id].ing);
    if (free) {
      const ingId = { chop: 'cabai', fry: 'ayam', boil: 'mie' }[free.id];
      game.actBin(ingId);
      ff(game, 1.0);
    }
  } else if (name === 'end') {
    game.startGame();
    ff(game, 30, (g) => g.orders.length >= 3);
    for (let n = 0; n < 3; n++) {
      if (!game.orders.length) break;
      cookAndServe(game, 0);
    }
    // Majukan sisa shift sampai layar hasil muncul.
    ff(game, 200, (g) => g.screen === 'results');
  }
  game.frozen = true; // bekukan frame untuk screenshot
}
