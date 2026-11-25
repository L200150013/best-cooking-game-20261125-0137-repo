// DAPUR KILAT — loop utama & wiring.
import { W, H } from './config.js';
import { Game } from './state.js';
import { Renderer } from './render.js';
import { Sfx } from './audio.js';
import { Input } from './input.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = W;
canvas.height = H;
const ctx = canvas.getContext('2d');

const sfx = new Sfx();
const game = new Game(sfx);
const renderer = new Renderer(ctx);
new Input(canvas, game);

// Staging screenshot: #shot=play | rush | end
const shot = new URLSearchParams(location.hash.slice(1)).get('shot');
if (shot) {
  stageShot(shot, game);
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!game.frozen) game.update(dt);
  renderer.draw(game);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
