// Game mode definitions: speed curves, timings, grading and mode-specific rules.
(function () {
'use strict';
const TGM = (globalThis.TGM = globalThis.TGM || {});

const lookup = (tbl, lv) => {
  let v = tbl[0][1];
  for (const [l, x] of tbl) { if (lv >= l) v = x; else break; }
  return v;
};
const T = (are, lineAre, das, lock, clear) => ({ are, lineAre, das, lock, clear });
const sec = (s) => Math.round(s * 60);
const G20 = 5120; // gravity is in 1/256 rows per frame

// Shared by TGM2 Master, TGM+ and TGM3 Master.
const MASTER_GRAVITY = [
  [0, 4], [30, 6], [35, 8], [40, 10], [50, 12], [60, 16], [70, 32], [80, 48], [90, 64], [100, 80],
  [120, 96], [140, 112], [160, 128], [170, 144], [200, 4], [220, 32], [230, 64], [233, 96], [236, 128],
  [239, 160], [243, 192], [247, 224], [251, 256], [300, 512], [330, 768], [360, 1024], [400, 1280],
  [420, 1024], [450, 768], [500, G20],
];
const NORMAL_GRAVITY = [
  [0, 4], [8, 5], [19, 6], [35, 8], [40, 10], [50, 12], [60, 16], [80, 32], [90, 48], [101, 64],
  [120, 80], [140, 96], [160, 112], [170, 128], [200, 144], [220, 16], [230, 48], [233, 80], [236, 112],
  [239, 144], [243, 176], [247, 192], [251, 208], [261, 224], [271, 240], [281, 260],
];
const EASY_GRAVITY = NORMAL_GRAVITY.filter(([l]) => l <= 200);

const TAP_MASTER_TIMING = [
  [0, T(27, 27, 16, 30, 40)], [500, T(27, 27, 10, 30, 25)], [600, T(27, 18, 10, 30, 16)],
  [700, T(18, 14, 10, 30, 12)], [800, T(14, 8, 10, 30, 6)], [900, T(14, 8, 8, 17, 6)],
];
const DEATH_TIMING = [
  [0, T(18, 14, 12, 30, 12)], [100, T(14, 8, 12, 26, 6)], [200, T(14, 8, 11, 22, 6)],
  [300, T(8, 8, 10, 18, 6)], [400, T(7, 7, 8, 15, 5)], [500, T(6, 6, 8, 15, 4)],
];
const TI_MASTER_TIMING = [
  [0, T(27, 27, 15, 30, 40)], [500, T(27, 27, 9, 30, 25)], [600, T(27, 18, 9, 30, 16)],
  [700, T(18, 14, 9, 30, 12)], [800, T(14, 8, 9, 30, 6)], [900, T(14, 8, 7, 17, 6)],
  [1000, T(8, 8, 7, 17, 6)], [1100, T(7, 7, 7, 15, 6)], [1200, T(6, 6, 7, 15, 6)],
];
const SHIRASE_TIMING = [
  [0, T(12, 8, 10, 18, 6)], [100, T(12, 7, 8, 18, 5)], [200, T(12, 6, 8, 17, 4)],
  [300, T(6, 6, 8, 15, 4)], [500, T(6, 5, 6, 13, 3)], [600, T(6, 5, 6, 12, 3)],
  [1100, T(6, 5, 6, 10, 3)], [1200, T(6, 5, 6, 8, 3)], [1300, T(6, 6, 6, 15, 6)],
];

// ---- internal grade system (TGM2 Master and TGM3 Master)
const GRADE_DECAY = [125, 80, 80, 50, 45, 45, 45, 40, 40, 40, 40, 40, 30, 30, 30, 20, 20, 20, 20, 20,
  15, 15, 15, 15, 15, 15, 15, 15, 15, 15, 10, 10];
const GRADE_POINTS = [
  [10, 10, 10, 10, 10, 5, 5, 5, 5, 5, 2],
  [20, 20, 20, 15, 15, 15, 10, 10, 10, 10, 12],
  [40, 30, 30, 30, 20, 20, 20, 15, 15, 15, 13],
  [50, 40, 40, 40, 40, 30, 30, 30, 30, 30, 30],
];
const GRADE_COMBO = [
  [1, 1.2, 1.2, 1.4, 1.4, 1.4, 1.4, 1.5, 1.5, 2],
  [1, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2, 2.1, 2.5],
  [1, 1.5, 1.8, 2, 2.2, 2.3, 2.4, 2.5, 2.6, 3],
];
// internal grade -> displayed grade steps
const GRADE_MAP = [0, 1, 2, 3, 4, 5, 5, 6, 6, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10, 11, 12, 12, 12, 13, 13, 14,
  14, 15, 15, 16, 16, 17];
const BASE_GRADES = ['9', '8', '7', '6', '5', '4', '3', '2', '1', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'S9'];
const TI_GRADES = BASE_GRADES.concat(['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'M', 'MK', 'MV', 'MO', 'MM', 'GM']);

function gradeInit(g) { g.ig = 0; g.gp = 0; g.gcombo = 0; g.gdecay = 0; }
function gradeFrame(g) {
  if (g.state !== 'active' || g.roll || g.gp <= 0 || g.gcombo > 0) return;
  if (++g.gdecay >= GRADE_DECAY[g.ig]) { g.gdecay = 0; g.gp--; }
}
function gradeLock(g, lines, levelBefore) {
  if (!lines) { g.gcombo = 0; return; }
  if (g.gcombo === 0) g.gcombo = 1; else if (lines >= 2) g.gcombo++;
  const base = GRADE_POINTS[lines - 1][Math.min(g.ig, 10)];
  const mult = lines === 1 ? 1 : GRADE_COMBO[lines - 2][Math.min(g.gcombo, 10) - 1];
  g.gp += Math.ceil(base * mult) * Math.min(4, 1 + Math.floor(levelBefore / 250));
  if (g.gp >= 100 && g.ig < 31) { g.ig++; g.gp = 0; g.gdecay = 0; }
}

const sectionGoal = (g) => Math.min(g.maxLevel, (Math.floor(g.level / 100) + 1) * 100);
const base = {
  lineLevels: null,
  onLock() {},
  ghost: (g) => g.level < 100,
  levelText: (g) => [g.level, sectionGoal(g)],
  gradeText: () => '',
  hud: (g) => [['SCORE', g.score]],
};

const MODES = {};

// ---------------------------------------------------------------- TGM2
MODES['tap-normal'] = Object.assign({}, base, {
  name: 'NORMAL', game: 'tap', color: '#3fbf5f', max: 300, scoreMult: 6,
  desc: 'Beginner mode. Reach level 300.',
  init() {},
  gravity: (g) => (g.roll ? G20 : lookup(NORMAL_GRAVITY, g.level)),
  timings: () => T(27, 27, 16, 30, 40),
  ghost: () => true,
  onMax(g) { g.startRoll('normal', 1800); },
});

MODES['tap-master'] = Object.assign({}, base, {
  name: 'MASTER', game: 'tap', color: '#3f7fdf', max: 999,
  desc: 'The TGM2 grade challenge. Level 999, grades 9 to GM.',
  init(g) { gradeInit(g); g.secTetris = []; g.override = null; },
  gravity: (g) => lookup(MASTER_GRAVITY, g.level),
  timings: (g) => lookup(TAP_MASTER_TIMING, g.level),
  onFrame: gradeFrame,
  onLock(g, lines, info) {
    if (g.roll) return;
    gradeLock(g, lines, info.levelBefore);
    if (lines === 4) { const s = Math.floor(info.levelBefore / 100); g.secTetris[s] = (g.secTetris[s] || 0) + 1; }
  },
  onMax(g) {
    const t = g.sectionTimes, n = (s) => g.secTetris[s] || 0;
    let ok = g.time <= sec(525) && GRADE_MAP[g.ig] === 17;
    for (let s = 0; s < 5; s++) ok = ok && n(s) >= 2 && t[s] <= sec(65);
    const avg = (t[0] + t[1] + t[2] + t[3] + t[4]) / 5;
    ok = ok && n(5) >= 1 && t[5] <= avg + 120;
    for (let s = 6; s < 9; s++) ok = ok && n(s) >= 1 && t[s] <= t[s - 1] + 120;
    ok = ok && t[9] <= t[8] + 120;
    g.mroll = ok;
    g.startRoll(ok ? 'invisible' : 'fading', 3694);
  },
  onRollEnd(g) { if (g.mroll) g.override = 'GM'; },
  onEnd(g, result) { if (result === 'topout' && g.roll && g.mroll) g.override = 'M'; },
  gradeText: (g) => g.override || BASE_GRADES[GRADE_MAP[g.ig]],
});

// 24-row repeating garbage pattern of TGM+
const PLUS_PATTERN = [
  '.XXXXXXXXX', '.XXXXXXXXX', '.XXXXXXXXX', '.XXXXXXXXX', 'XXXXXXXXX.', 'XXXXXXXXX.', 'XXXXXXXXX.', 'XXXXXXXXX.',
  '..XXXXXXXX', '.XXXXXXXXX', '.XXXXXXXXX', 'XXXXXXXX..', 'XXXXXXXXX.', 'XXXXXXXXX.', 'XX.XXXXXXX', 'X..XXXXXXX',
  'X.XXXXXXXX', 'XXXXXXX.XX', 'XXXXXXX..X', 'XXXXXXXX.X', 'XXXX..XXXX', 'XXXX..XXXX', 'XXXXX.XXXX', 'XXX....XXX',
].map((r) => [...r].map((c) => c === 'X'));

MODES['tap-plus'] = Object.assign({}, base, {
  name: 'TGM+', game: 'tap', color: '#3fbfbf', max: 999,
  desc: 'Master speeds with a fixed pattern of rising garbage.',
  init(g) { g.garbage = 0; g.garbageRow = 0; },
  gravity: (g) => lookup(MASTER_GRAVITY, g.level),
  timings: (g) => lookup(TAP_MASTER_TIMING, g.level),
  onLock(g, lines) {
    if (lines || g.roll) return;
    if (++g.garbage >= 13 - Math.floor(g.level / 100)) {
      g.garbage = 0;
      g.raiseGarbage(PLUS_PATTERN[g.garbageRow++ % PLUS_PATTERN.length]);
    }
  },
  onMax(g) { g.startRoll('normal', 3694); },
});

MODES['tap-death'] = Object.assign({}, base, {
  name: 'T.A. DEATH', game: 'tap', color: '#df3f3f', max: 999,
  desc: '20G from the first piece. Reach 500 within 3:25 to continue.',
  init(g) { g.override = null; },
  gravity: () => G20,
  timings: (g) => lookup(DEATH_TIMING, g.level),
  onSection(g, s) {
    if (s !== 4) return;
    if (g.time > sec(205)) g.end('torikan'); else g.override = 'M';
  },
  onMax(g) { g.override = 'GM'; g.startRoll('normal', 3694); },
  gradeText: (g) => g.override || '',
});

// ---------------------------------------------------------------- TGM3
const TI_LINE_LEVELS = [0, 1, 2, 4, 6];
const tiLines = (n) => TI_LINE_LEVELS[n];

const HANABI_BASE = [0, 1, 2.9, 3.8, 4.7];
MODES['ti-easy'] = Object.assign({}, base, {
  name: 'EASY', game: 'ti', color: '#3fbf5f', max: 200, rules: true,
  desc: 'Beginner mode. Reach level 200 and launch fireworks.',
  init(g) { g.hanabi = 0; g.hcombo = 0; },
  gravity: (g) => (g.roll ? 256 : lookup(EASY_GRAVITY, g.level)),
  timings: () => T(27, 27, 15, 30, 40),
  lineLevels: tiLines,
  ghost: () => true,
  onLock(g, lines) {
    if (!lines) { g.hcombo = 0; return; }
    g.hcombo++;
    const n = Math.max(1, Math.floor(HANABI_BASE[lines] * (1 + (g.hcombo - 1) * 0.5) * (g.roll ? 1.5 : 1)));
    g.hanabi += n;
    for (let i = 0; i < n; i++) g.events.push('hanabi');
  },
  onMax(g) { g.startRoll('normal', 3238); },
  hud: (g) => [['HANABI', g.hanabi], ['SCORE', g.score]],
});

const COOL_TIME = [52, 52, 49, 45, 45, 42, 42, 38, 38].map(sec);
const REGRET_TIME = [90, 75, 75, 68, 60, 60, 50, 50, 50, 50].map(sec);
const ROLL_POINTS = { fading: [0, 0.04, 0.08, 0.12, 0.26], invisible: [0, 0.1, 0.2, 0.3, 1] };
const tiSpeed = (g) => g.level + 100 * g.cools;

MODES['ti-master'] = Object.assign({}, base, {
  name: 'MASTER', game: 'ti', color: '#3f7fdf', max: 999, rules: true,
  desc: 'COOL sections speed the game up. Grades 9 to GM. Torikan 7:00 at 500.',
  init(g) {
    gradeInit(g);
    g.cools = 0; g.regrets = 0; g.rollPts = 0;
    g.coolNow = false; g.coolShown = false; g.prevCool = false; g.prev70 = 0; g.coolFlags = [];
  },
  gravity: (g) => lookup(MASTER_GRAVITY, tiSpeed(g)),
  timings: (g) => lookup(TI_MASTER_TIMING, tiSpeed(g)),
  lineLevels: tiLines,
  ghost: (g) => tiSpeed(g) < 100,
  onFrame: gradeFrame,
  onLevel(g, old, nl) {
    const s = Math.floor(old / 100);
    if (s < 9 && old % 100 < 70 && (nl % 100 >= 70 || Math.floor(nl / 100) > s)) {
      const t = g.time - g.sectionStart;
      g.coolNow = t <= COOL_TIME[s] && (!g.prevCool || t <= g.prev70 + 120);
      g.prev70 = t;
    }
    if (g.coolNow && !g.coolShown && Math.floor(nl / 100) === s && nl % 100 >= 82) {
      g.coolShown = true; g.say('COOL!!'); g.events.push('cool');
    }
  },
  onSection(g, s, t) {
    if (t > REGRET_TIME[s]) { g.regrets++; g.say('REGRET!!'); g.events.push('regret'); }
    if (g.coolNow) g.cools++;
    g.coolFlags[s] = g.coolNow;
    g.prevCool = g.coolNow; g.coolNow = false; g.coolShown = false;
    if (s === 4 && g.time > sec(420)) g.end('torikan');
  },
  onLock(g, lines, info) {
    if (g.roll) { g.rollPts += ROLL_POINTS[g.roll.type][lines]; return; }
    gradeLock(g, lines, info.levelBefore);
  },
  onMax(g) {
    g.mroll = g.cools >= 9 && g.regrets === 0;
    g.startRoll(g.mroll ? 'invisible' : 'fading', 3238);
  },
  onRollEnd(g) { g.rollPts += g.mroll ? 1.6 : 0.5; },
  gradeIndex: (g) => Math.max(0, Math.min(32, GRADE_MAP[g.ig] + g.cools - g.regrets + Math.floor(g.rollPts))),
  gradeText(g) { return TI_GRADES[this.gradeIndex(g)]; },
  hud: (g) => [['SCORE', g.score], ['COOL', g.cools], ['REGRET', g.regrets]],
});

const SHIRASE_GARBAGE = { 5: 20, 6: 18, 7: 10, 8: 9, 9: 8 };
MODES['ti-shirase'] = Object.assign({}, base, {
  name: 'SHIRASE', game: 'ti', color: '#bf3fdf', max: 1300, rules: true,
  desc: '20G to level 1300. Rising garbage from 500, bone blocks from 1000.',
  init(g) { g.regrets = 0; g.garbage = 0; },
  gravity: () => G20,
  timings: (g) => lookup(SHIRASE_TIMING, g.level),
  lineLevels: tiLines,
  bone: (g) => g.level >= 1000 && !g.roll && !g.pendingRoll,
  onSection(g, s, t) {
    if (t > sec(60)) { g.regrets++; g.say('REGRET!!'); g.events.push('regret'); }
    const world = g.rule.id === 'world';
    if (s === 4 && g.time > sec(world ? 183 : 148)) g.end('torikan');
    else if (s === 9 && g.time > sec(world ? 366 : 296)) g.end('torikan');
  },
  onLock(g, lines) {
    const quota = SHIRASE_GARBAGE[Math.floor(g.level / 100)];
    if (lines || g.roll || !quota) return;
    if (++g.garbage >= quota) {
      g.garbage = 0;
      g.raiseGarbage(g.field[g.H - 1].map((c) => c !== null));
    }
  },
  onMax(g) { g.startRoll('big', 3238); },
  gradeText(g) {
    const n = Math.floor(g.level / 100) - g.regrets;
    return n >= 1 ? 'S' + n : '';
  },
  hud: (g) => [['SCORE', g.score], ['REGRET', g.regrets]],
});

// Sakura: the arcade's stage maps are not reproduced; stages are generated from fixed seeds.
const SAKURA_STAGES = 20;
function sakuraLoad(g) {
  const n = g.stage, r = TGM.rng(1000 + n * 7919);
  g.setSize(10, 20);
  const h = Math.min(12, 4 + Math.floor(n / 2));
  let hole = Math.floor(r() * 10);
  const filled = [];
  for (let i = 0; i < h; i++) {
    const y = g.H - 1 - i;
    const open = new Set([hole]);
    if (r() < 0.35) open.add((hole + 1 + Math.floor(r() * 3)) % 10);
    for (let x = 0; x < 10; x++) {
      if (open.has(x)) continue;
      g.field[y][x] = { c: 'G', t: -1e9, bone: false, gem: false };
      filled.push(g.field[y][x]);
    }
    if (r() < 0.5) hole = Math.max(0, Math.min(9, hole + Math.floor(r() * 5) - 2));
  }
  for (let k = Math.min(8, 2 + Math.floor(n / 3)); k > 0;) {
    const c = filled[Math.floor(r() * filled.length)];
    if (!c.gem) { c.gem = true; k--; }
  }
  g.piece = null; g.clearRows = null; g.onCollapsed = null;
  g.state = 'are'; g.timer = 60;
  g.stageLeft = sec(60);
  g.say('STAGE ' + (n + 1), 60);
}
function sakuraNext(g, cleared) {
  if (cleared) { g.cleared++; g.totalLeft += sec(15); }
  if (++g.stage >= SAKURA_STAGES) g.end('clear'); else sakuraLoad(g);
}
MODES['ti-sakura'] = Object.assign({}, base, {
  name: 'SAKURA', game: 'ti', color: '#ef7fbf', max: Infinity, rules: true, noLevel: true,
  desc: 'Puzzle mode: clear every jewel block before time runs out. (Custom stages.)',
  init(g) {
    // Sakura always deals the same piece sequence.
    g.randomizer = TGM.tiRandomizer(TGM.rng(3));
    g.next = [];
    while (g.next.length < g.nextCount) g.next.push(g.randomizer());
    g.stage = 0; g.cleared = 0; g.totalLeft = sec(180);
    sakuraLoad(g);
    g.state = 'ready'; g.timer = TGM.READY_FRAMES;
  },
  gravity: () => 4,
  timings: () => T(27, 27, 15, 30, 25),
  ghost: () => true,
  onFrame(g) {
    if (--g.totalLeft <= 0) { g.end('timeup'); return; }
    if (--g.stageLeft <= 0) sakuraNext(g, false);
  },
  onLock(g, lines, info) {
    if (lines && info.gemsLeft === 0) g.onCollapsed = () => sakuraNext(g, true);
  },
  levelText: (g) => [g.stage + 1, SAKURA_STAGES],
  hud: (g) => [['STAGE TIME', TGM.fmt(g.stageLeft)], ['LIMIT TIME', TGM.fmt(g.totalLeft)], ['CLEARED', g.cleared]],
});

TGM.MODES = MODES;
TGM.TI_GRADES = TI_GRADES;
TGM.MODE_ORDER = ['ti-easy', 'ti-master', 'ti-shirase', 'ti-sakura', 'tap-normal', 'tap-master', 'tap-plus', 'tap-death'];
for (const id in MODES) MODES[id].id = id;
})();
