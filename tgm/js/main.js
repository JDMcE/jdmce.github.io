// Menu, input and the fixed 60 Hz game loop.
(function () {
'use strict';
const TGM = globalThis.TGM;
const $ = (id) => document.getElementById(id);

const ACTIONS = [
  ['left', 'Left'], ['right', 'Right'], ['up', 'Up (sonic / hard drop)'], ['down', 'Down (soft drop)'],
  ['a', 'A (rotate)'], ['b', 'B (rotate other way)'], ['c', 'C (rotate)'], ['hold', 'Hold (TGM3)'],
];
const DEFAULT_KEYS = { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', a: 'ArrowLeft', b: 'ArrowRight', c: 'ArrowUp', hold: 'Space' };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } },
};
let keys = Object.assign({}, DEFAULT_KEYS, store.get('tgm-keys', {}));
let rule = store.get('tgm-rule', 'classic');
// Qualification is kept per rule, since Classic and World play differently.
const qualKey = (r) => 'tgm-qual-' + r;
const loadQual = (r) => Object.assign(TGM.Exam.fresh(), store.get(qualKey(r), {}));
let sel = Math.max(0, TGM.MODE_ORDER.indexOf(store.get('tgm-mode', 'ti-master')));

const canvas = $('screen');
const renderer = new TGM.Renderer(canvas);
const held = new Set();
let game = null, paused = false, rebinding = null, recorded = false;

// ---- menu
const menu = $('menu'), list = $('modes');
function buildMenu() {
  list.innerHTML = '';
  let group = null;
  TGM.MODE_ORDER.forEach((id, i) => {
    const m = TGM.MODES[id];
    if (m.game !== group) {
      group = m.game;
      const h = document.createElement('h2');
      h.textContent = group === 'ti' ? 'TGM3 · Terror-Instinct' : 'TGM2 · The Absolute Plus';
      list.appendChild(h);
    }
    const b = document.createElement('button');
    b.className = 'mode' + (i === sel ? ' sel' : '');
    b.style.setProperty('--c', m.color);
    b.innerHTML = `<span class="name"></span><span class="desc"></span>`;
    b.children[0].textContent = m.name;
    b.children[1].textContent = m.desc;
    b.onmouseenter = () => { sel = i; refreshMenu(); };
    b.onclick = () => { sel = i; start(); };
    list.appendChild(b);
  });
  refreshMenu();
}
function refreshMenu() {
  [...list.querySelectorAll('.mode')].forEach((b, i) => b.classList.toggle('sel', i === sel));
  const ti = TGM.MODES[TGM.MODE_ORDER[sel]].game === 'ti';
  $('rule').classList.toggle('off', !ti);
  const q = loadQual(rule), G = TGM.TI_GRADES, E = TGM.Exam;
  $('qual').hidden = TGM.MODE_ORDER[sel] !== 'ti-master';
  $('qual-grade').textContent = G[q.qualified];
  const target = E.target(q);
  $('qual-note').textContent = q.demotion >= E.DEMOTE_AT
    ? 'Demotion exam next game.'
    : q.history.length < E.HISTORY
      ? `Exams begin after ${E.HISTORY} Master games (${q.history.length} played).`
      : target > q.qualified ? `Eligible for a ${G[target]} promotion exam.` : 'No exam pending.';
  $('qual-history').textContent = q.history.length ? 'Recent: ' + q.history.map((i) => G[i]).join(' ') : '';
  $('rule-classic').classList.toggle('on', !ti || rule === 'classic');
  $('rule-world').classList.toggle('on', ti && rule === 'world');
  $('rule-note').textContent = !ti
    ? 'TGM2 modes always use the Classic rule: one next piece, no hold.'
    : rule === 'world'
      ? 'World: SRS kicks, Up locks instantly, lock delay resets on movement, A/C rotate clockwise.'
      : 'Classic: ARS kicks, Up is a sonic drop, Down locks, A/C rotate counter-clockwise.';
}
function setRule(r) { rule = r; store.set('tgm-rule', r); refreshMenu(); }
$('rule-classic').onclick = () => setRule('classic');
$('rule-world').onclick = () => setRule('world');

function buildKeys() {
  const box = $('keys');
  box.innerHTML = '';
  for (const [id, label] of ACTIONS) {
    const row = document.createElement('label');
    const span = document.createElement('span');
    span.textContent = label;
    const b = document.createElement('button');
    b.textContent = rebinding === id ? 'press a key…' : keys[id].replace(/^Key|^Arrow/, '');
    b.className = rebinding === id ? 'wait' : '';
    b.onclick = () => { rebinding = id; buildKeys(); };
    row.append(span, b);
    box.appendChild(row);
  }
}
$('qual-reset').onclick = () => {
  if (confirm('Reset the qualified grade and game history for the ' + rule + ' rule?')) { store.set(qualKey(rule), TGM.Exam.fresh()); refreshMenu(); }
};
$('keys-reset').onclick = () => { keys = Object.assign({}, DEFAULT_KEYS); store.set('tgm-keys', keys); buildKeys(); };
$('mute').onclick = () => { TGM.Audio.muted = !TGM.Audio.muted; $('mute').textContent = TGM.Audio.muted ? 'Sound: off' : 'Sound: on'; };

function start() {
  const id = TGM.MODE_ORDER[sel];
  store.set('tgm-mode', id);
  TGM.Audio.unlock();
  const exam = id === 'ti-master' ? TGM.Exam.pick(loadQual(rule), Math.random) : null;
  game = new TGM.Game({ mode: id, rule, exam });
  recorded = false;
  paused = false;
  acc = 0;
  menu.hidden = true;
}
function toMenu() { game = null; menu.hidden = false; refreshMenu(); }

// ---- input
addEventListener('keydown', (e) => {
  if (rebinding) {
    e.preventDefault();
    if (e.code !== 'Escape') { keys[rebinding] = e.code; store.set('tgm-keys', keys); }
    rebinding = null; buildKeys();
    return;
  }
  if (Object.values(keys).includes(e.code) || e.code.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
  if (e.repeat) return;
  held.add(e.code);
  if (!game) {
    const n = TGM.MODE_ORDER.length;
    if (e.code === 'ArrowDown') { sel = (sel + 1) % n; refreshMenu(); }
    else if (e.code === 'ArrowUp') { sel = (sel + n - 1) % n; refreshMenu(); }
    else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { setRule(rule === 'classic' ? 'world' : 'classic'); }
    else if (e.code === 'Enter') { e.preventDefault(); start(); }
    return;
  }
  if (e.code === 'Escape') toMenu();
  else if (e.code === 'Enter' && game.state === 'over') start();
  else if (e.code === 'KeyP' && game.state !== 'over') paused = !paused;
});
addEventListener('keyup', (e) => held.delete(e.code));
addEventListener('blur', () => { held.clear(); if (game && game.state !== 'over') paused = true; });
addEventListener('resize', () => renderer.resize());

function readInput() {
  const inp = {};
  for (const k in keys) inp[k] = held.has(keys[k]);
  return inp;
}

// ---- loop: the engine always advances in whole 1/60 s frames
const STEP = 1000 / 60;
let last = performance.now(), acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(100, now - last);
  last = now;
  if (!game) return;
  if (!paused) {
    acc += dt;
    while (acc >= STEP) {
      acc -= STEP;
      game.step(readInput());
      for (const ev of game.events) {
        TGM.Audio.play(ev);
        if (ev === 'hanabi') renderer.burst(40, ['#ff7a6a', '#ffe27a', '#7fe0ff', '#b0ff8a', '#ff9be0'][Math.floor(Math.random() * 5)]);
        else if (ev === 'clear4') renderer.burst(30, '#ffffff');
      }
      game.events.length = 0;
      if (game.state === 'over' && !recorded) {
        recorded = true;
        if (game.mode.id === 'ti-master') {
          const q = loadQual(game.rule.id);
          game.examResult = TGM.Exam.record(q, game.exam, game.mode.gradeIndex(game));
          store.set(qualKey(game.rule.id), q);
        }
      }
    }
  }
  renderer.draw(game, paused);
}

buildMenu();
buildKeys();
requestAnimationFrame(frame);
})();
