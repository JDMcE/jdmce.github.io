// Small WebAudio synth for game events. Created lazily on the first key press.
(function () {
'use strict';
const TGM = globalThis.TGM;

// Each upcoming piece has its own cue, as in the arcade games.
const PIECE_NOTE = { I: 523, Z: 392, S: 440, J: 587, L: 659, O: 349, T: 698 };
let ctx = null;

function tone(freq, dur, type, vol, slide, delay) {
  const t = ctx.currentTime + (delay || 0);
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.type = type || 'square';
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(slide, t + dur);
  gain.gain.setValueAtTime(vol || 0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t); osc.stop(t + dur + 0.02);
}

const SOUNDS = {
  lock: () => tone(140, 0.07, 'triangle', 0.2, 60),
  clear1: () => tone(660, 0.12, 'square', 0.07, 990),
  clear2: () => tone(740, 0.14, 'square', 0.07, 1110),
  clear3: () => tone(830, 0.16, 'square', 0.07, 1245),
  clear4: () => { tone(880, 0.1, 'square', 0.08); tone(1175, 0.1, 'square', 0.08, 0, 0.08); tone(1568, 0.25, 'square', 0.08, 0, 0.16); },
  hold: () => tone(300, 0.06, 'sine', 0.15, 600),
  irs: () => tone(1200, 0.04, 'sine', 0.1),
  garbage: () => tone(90, 0.2, 'sawtooth', 0.12, 50),
  section: () => { tone(784, 0.12, 'triangle', 0.15); tone(1047, 0.3, 'triangle', 0.15, 0, 0.1); },
  cool: () => { tone(1047, 0.1, 'sine', 0.15); tone(1319, 0.1, 'sine', 0.15, 0, 0.1); tone(1568, 0.3, 'sine', 0.15, 0, 0.2); },
  regret: () => tone(220, 0.5, 'sawtooth', 0.1, 110),
  ready: () => tone(440, 0.25, 'triangle', 0.15),
  go: () => tone(880, 0.4, 'triangle', 0.15),
  roll: () => { tone(523, 0.2, 'triangle', 0.12); tone(659, 0.2, 'triangle', 0.12, 0, 0.2); tone(784, 0.5, 'triangle', 0.12, 0, 0.4); },
  hanabi: () => tone(200 + Math.random() * 200, 0.3, 'triangle', 0.05, 60),
  gameover: () => tone(330, 0.9, 'sawtooth', 0.12, 55),
  complete: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.14, 0, i * 0.14)); },
};

TGM.Audio = {
  muted: false,
  unlock() {
    if (!ctx) { try { ctx = new (globalThis.AudioContext || globalThis.webkitAudioContext)(); } catch (e) { ctx = null; } }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  },
  play(ev) {
    if (!ctx || this.muted) return;
    if (ev.startsWith('piece:')) { tone(PIECE_NOTE[ev.slice(6)], 0.06, 'square', 0.035); return; }
    const f = SOUNDS[ev];
    if (f) f();
  },
};
})();
