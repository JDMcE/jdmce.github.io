// Headless smoke test: node test/sim.js
require('../js/core.js');
require('../js/modes.js');
require('../js/exam.js');
const assert = require('assert');
const TGM = globalThis.TGM;
const idle = {};

function fresh(mode, rule) {
  const g = new TGM.Game({ mode, rule, seed: 1 });
  for (let i = 0; i < TGM.READY_FRAMES; i++) g.step(idle);
  return g;
}
function place(g, type, rot, x, y) {
  g.piece = { type, rot, x, y, bone: false, soft: 0, sonic: 0, frames: 0, moves: 0, rots: 0, kicked: false };
  g.state = 'active'; g.lockTimer = 0;
}
const fill = (g, x, y) => { g.field[y][x] = { c: 'G', t: 0 }; };

// --- rotation rules
{
  // I never kicks in TGM2, kicks off the wall in TGM3 Classic.
  let g = fresh('tap-master');
  place(g, 'I', 1, -2, 10); // vertical I in column 0
  assert.strictEqual(g.rotate(1), false, 'TAP I must not wall kick');
  g = fresh('ti-master', 'classic');
  place(g, 'I', 1, -2, 10);
  assert.strictEqual(g.rotate(1), true, 'Ti I wall kick');
  assert.strictEqual(g.piece.x, 0);

  // I floor kick: only when grounded, once per piece.
  g = fresh('ti-master', 'classic');
  place(g, 'I', 0, 3, g.H - 2);
  assert.strictEqual(g.rotate(1), true, 'Ti I floor kick');
  assert.strictEqual(g.piece.y, g.H - 4);

  // Centre-column rule: L flat with a block above its centre cannot rotate.
  g = fresh('tap-master');
  place(g, 'L', 0, 3, 10);
  fill(g, 4, 10);
  assert.strictEqual(g.rotate(1), false, 'centre column blocks kick');
  // ...but a blocked side cell alone still kicks.
  g = fresh('tap-master');
  place(g, 'L', 0, 3, 10);
  fill(g, 3, 10);
  assert.strictEqual(g.rotate(1), true, 'side collision kicks');
  assert.strictEqual(g.piece.x, 4);

  // SRS T-spin triple style kick exists (0->L fifth test).
  g = fresh('ti-master', 'world');
  place(g, 'T', 0, 0, 10);
  assert.strictEqual(g.rotate(-1), true);
}

// --- 20G: piece is on the floor on its first frame
{
  const g = fresh('tap-death');
  assert.strictEqual(g.state, 'active');
  assert.ok(g.grounded(), '20G spawn lands immediately');
}

// --- randomizers: no early S/Z/O, reasonable droughts
for (const mk of [TGM.tapRandomizer, TGM.tiRandomizer]) {
  for (let s = 0; s < 200; s++) {
    const r = mk(TGM.rng(s));
    assert.ok('IJLT'.includes(r()));
  }
  const r = mk(TGM.rng(42));
  const last = {}; let worst = 0;
  for (let i = 0; i < 20000; i++) { const p = r(); worst = Math.max(worst, i - (last[p] ?? i)); last[p] = i; }
  console.log(mk.name, 'worst drought over 20000 pieces:', worst);
}

// --- every mode survives random play without throwing
for (const mode of TGM.MODE_ORDER) {
  const rules = TGM.MODES[mode].game === 'ti' ? ['classic', 'world'] : ['classic'];
  for (const rule of rules) {
    for (let seed = 0; seed < 5; seed++) {
      const g = new TGM.Game({ mode, rule, seed });
      const r = TGM.rng(seed + 99);
      let inp = {};
      let f = 0;
      for (; f < 60000 && g.state !== 'over'; f++) {
        if (f % 4 === 0) {
          inp = { left: r() < 0.3, right: r() < 0.3, up: r() < 0.3, down: r() < 0.1, a: r() < 0.2, b: r() < 0.2, hold: r() < 0.05 };
        }
        g.step(inp);
        g.events.length = 0;
        assert.ok(g.field.length === g.H && g.field.every((row) => row.length === g.W));
      }
      if (seed === 0) console.log(mode.padEnd(11), rule.padEnd(8), 'frames', f, 'level', g.level, 'result', g.result, 'grade', g.mode.gradeText(g));
    }
  }
}

// --- force each mode to its ending to exercise section, roll and grading paths
for (const mode of TGM.MODE_ORDER) {
  if (mode === 'ti-sakura') continue;
  const g = fresh(mode, 'classic');
  let guard = 0;
  while (!g.pendingRoll && g.state !== 'over' && guard++ < 5000) { g.addLevel(4, true); g.time += 1500; }
  assert.ok(g.pendingRoll || g.result === 'torikan', mode + ' reaches its ending');
  const g2 = fresh(mode, 'classic');
  while (!g2.pendingRoll && g2.state !== 'over') g2.addLevel(4, true);
  assert.ok(g2.pendingRoll, mode + ' reaches roll when fast');
  for (let i = 0; i < 6000 && g2.state !== 'over'; i++) g2.step(idle);
  console.log(mode.padEnd(11), 'roll:', g2.roll && g2.roll.type, 'result', g2.result, 'grade', g2.mode.gradeText(g2), 'size', g2.W + 'x' + g2.VIS);
}
// --- qualification exams
{
  const E = TGM.Exam, never = () => 0.99, always = () => 0;
  const st = E.fresh();
  for (let i = 0; i < 6; i++) E.record(st, null, 12);
  assert.strictEqual(E.pick(st, always), null, 'no exam before 7 games');
  E.record(st, null, 3);
  assert.strictEqual(E.target(st), 12);
  assert.strictEqual(E.pick(st, never), null, 'exam is a 1-in-3 chance');
  const ex = E.pick(st, always);
  assert.deepStrictEqual(ex, { type: 'promotion', grade: 12 });
  assert.strictEqual(E.record(st, ex, 11).passed, false);
  assert.strictEqual(st.qualified, 0);
  assert.strictEqual(E.record(st, ex, 14).to, 12);
  // GM is only offered once MM is held
  const hi = { qualified: 20, history: [32, 32, 32, 32, 32, 32, 32], demotion: 0 };
  assert.strictEqual(E.target(hi), 31);
  hi.qualified = 31;
  assert.strictEqual(E.target(hi), 32);
  // demotion: grades 7+ below qualified add points; 30 points forces an exam
  const lo = { qualified: 20, history: [], demotion: 0 };
  E.record(lo, null, 13);
  assert.strictEqual(lo.demotion, 0);
  for (let i = 0; i < 3; i++) E.record(lo, null, 3);
  assert.strictEqual(lo.demotion, 30);
  const dx = E.pick(lo, never);
  assert.deepStrictEqual(dx, { type: 'demotion', grade: 20 });
  const res = E.record(lo, dx, 5);
  assert.deepStrictEqual([res.passed, lo.qualified, lo.demotion], [false, 19, 0]);
}
console.log('ok');
