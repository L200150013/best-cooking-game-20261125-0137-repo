[![make.fun bounty](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/L200150013/best-cooking-game-20261125-0137-repo/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/L200150013/best-cooking-game-20261125-0137-repo/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

# Dapur Kilat — Wok Hei Rush

Entry for the [make.fun bounty "Make the best cooking game"](https://make.fun/bounty/best-cooking-game-20261125-0137).

Game masak arcade orisinal: warung malam, satu koki, shift 3 menit. Baca tiket di order board, cincang di talenan, goreng di wajan, rebus di panci, susun di piring, sajikan sebelum patience habis. Serve beruntun menaikkan kombo; timing pas di zona hijau memberi PERFECT.

## Cara main

- Mouse: klik semua aksi. Keyboard: `1–8` pilih bahan, `Q/W/E` ambil dari stasiun, `Spasi` sajikan, `P` jeda, `M` suara.
- Menu: Nasi Goreng, Mie Ayam, Mie Kuah, Es Teh.

## Menjalankan

Buka `game/index.html` di desktop Chrome (atau sajikan folder `game/` lewat server statis apa pun). Tanpa network, tanpa build step, tanpa library eksternal — semua gambar vektor dan suara synth dibuat di kode.

## Penyerahan

`main.ts` menyalin `game/` + `screenshots/` ke `/output` dan menulis `dossier.json` via `buildDossier` dari `vendor/makefun-game.ts` (salinan kit, tidak diubah).
