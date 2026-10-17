// Canvas renderer. Reads game state only; never mutates it.
(function () {
'use strict';
const TGM = globalThis.TGM;

const VW = 640, VH = 740;
const CELL = 28, FX = 180, FY = 124, FW = 280, FH = 560;
const COLORS = {
  classic: { I: '#e8322e', Z: '#2fc23a', S: '#c838c8', J: '#2f55e8', L: '#f08a24', O: '#ecd32b', T: '#2ac8dc' },
  world: { I: '#2ac8dc', Z: '#e8322e', S: '#2fc23a', J: '#2f55e8', L: '#f08a24', O: '#ecd32b', T: '#a53fe0' },
};
const GARBAGE = '#8a8f9c';
const FONT = '"Trebuchet MS", "Segoe UI", system-ui, sans-serif';

const shadeCache = new Map();
function shade(hex, f) {
  const key = hex + f;
  let v = shadeCache.get(key);
  if (v) return v;
  const n = parseInt(hex.slice(1), 16);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((c) => Math.round(f < 0 ? c * (1 + f) : c + (255 - c) * f));
  v = `rgb(${ch[0]},${ch[1]},${ch[2]})`;
  shadeCache.set(key, v);
  return v;
}

class Renderer {
  constructor(canvas) {
    this.cv = canvas;
    this.ctx = canvas.getContext('2d');
    this.sparks = [];
    this.resize();
  }
  resize() {
    const dpr = Math.min(3, globalThis.devicePixelRatio || 1);
    this.cv.width = VW * dpr; this.cv.height = VH * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  block(x, y, s, color, o) {
    const c = this.ctx;
    o = o || {};
    c.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (o.bone) {
      c.fillStyle = '#0c0c10'; c.fillRect(x, y, s, s);
      c.strokeStyle = o.dim ? '#9a9a9a' : '#f0f0f0'; c.lineWidth = Math.max(1.5, s / 12);
      const m = s * 0.2, e = s * 0.28;
      c.beginPath();
      c.moveTo(x + m + e, y + m); c.lineTo(x + m, y + m); c.lineTo(x + m, y + s - m); c.lineTo(x + m + e, y + s - m);
      c.moveTo(x + s - m - e, y + m); c.lineTo(x + s - m, y + m); c.lineTo(x + s - m, y + s - m); c.lineTo(x + s - m - e, y + s - m);
      c.stroke();
    } else {
      const d = o.dim || 0, b = Math.max(2, s / 8);
      c.fillStyle = shade(color, -d); c.fillRect(x, y, s, s);
      c.fillStyle = shade(color, 0.45 - d * 0.6);
      c.fillRect(x, y, s, b); c.fillRect(x, y, b, s);
      c.fillStyle = shade(color, -0.45 - d * 0.3);
      c.fillRect(x, y + s - b, s, b); c.fillRect(x + s - b, y, b, s);
      if (o.gem) {
        c.fillStyle = '#fff'; c.beginPath(); c.arc(x + s / 2, y + s / 2, s * 0.28, 0, 7); c.fill();
        c.fillStyle = '#ff5fa8'; c.beginPath(); c.arc(x + s / 2, y + s / 2, s * 0.18, 0, 7); c.fill();
      }
    }
    if (o.flash) { c.globalAlpha = o.flash; c.fillStyle = '#fff'; c.fillRect(x, y, s, s); }
    c.globalAlpha = 1;
  }

  // Draw a piece in its spawn orientation with its top-left at (x, y).
  preview(g, type, x, y, s, alpha) {
    const cells = g.rule.shapes[type][0];
    const minY = Math.min(...cells.map((c) => c[1]));
    const col = COLORS[g.rule.colors][type];
    for (const [cx, cy] of cells) this.block(x + cx * s, y + (cy - minY) * s, s, col, { alpha });
  }

  text(str, x, y, size, color, align, weight) {
    const c = this.ctx;
    c.font = `${weight || 700} ${size}px ${FONT}`;
    c.textAlign = align || 'left';
    c.fillStyle = color || '#fff';
    c.fillText(str, x, y);
  }

  draw(g, paused) {
    const c = this.ctx, mode = g.mode, col = COLORS[g.rule.colors];
    const over = g.state === 'over';
    c.fillStyle = '#07080d'; c.fillRect(0, 0, VW, VH);
    const bg = c.createRadialGradient(VW / 2, VH / 2, 60, VW / 2, VH / 2, 520);
    bg.addColorStop(0, shade(mode.color, -0.72)); bg.addColorStop(1, '#07080d');
    c.fillStyle = bg; c.fillRect(0, 0, VW, VH);

    // field frame
    c.fillStyle = mode.color; c.fillRect(FX - 8, FY - 8, FW + 16, FH + 16);
    c.fillStyle = shade(mode.color, -0.5); c.fillRect(FX - 4, FY - 4, FW + 8, FH + 8);
    c.fillStyle = 'rgba(4,5,10,0.94)'; c.fillRect(FX, FY, FW, FH);

    const s = FH / g.VIS, HID = g.HID;
    c.strokeStyle = 'rgba(255,255,255,0.045)'; c.lineWidth = 1;
    c.beginPath();
    for (let x = 1; x < g.W; x++) { c.moveTo(FX + x * s + 0.5, FY); c.lineTo(FX + x * s + 0.5, FY + FH); }
    for (let y = 1; y < g.VIS; y++) { c.moveTo(FX, FY + y * s + 0.5); c.lineTo(FX + FW, FY + y * s + 0.5); }
    c.stroke();

    c.save();
    c.beginPath(); c.rect(FX, FY, FW, FH); c.clip();

    // locked stack
    const rollType = !over && g.roll ? g.roll.type : null;
    const vis = (cell) => {
      const age = g.frame - cell.t;
      if (rollType === 'invisible') return age < 4 ? 1 : 0;
      if (rollType === 'fading') return age < 240 ? 1 : Math.max(0, 1 - (age - 240) / 60);
      return 1;
    };
    const shown = (x, y) => { const cell = g.field[y][x]; return !!cell && vis(cell) > 0.5; };
    const clearing = g.clearRows || [];
    const clearK = clearing.length ? g.timer / Math.max(1, g.tm.clear) : 0;
    for (let y = HID; y < g.H; y++) {
      const isClear = clearing.includes(y);
      for (let x = 0; x < g.W; x++) {
        const cell = g.field[y][x];
        if (!cell) continue;
        let a = vis(cell);
        if (a <= 0) continue;
        const age = g.frame - cell.t;
        const o = { alpha: a, dim: 0.3, bone: cell.bone, gem: cell.gem };
        if (age < 3) o.flash = 0.85;
        if (isClear) { o.alpha = a * clearK; o.flash = 0.6 * clearK; o.dim = 0; }
        this.block(FX + x * s, FY + (y - HID) * s, s, cell.c === 'G' ? GARBAGE : col[cell.c], o);
      }
    }
    // white outline around the stack, as on the arcade boards
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2;
    c.beginPath();
    for (let y = HID; y < g.H; y++) {
      if (clearing.includes(y)) continue;
      for (let x = 0; x < g.W; x++) {
        if (!shown(x, y)) continue;
        const px = FX + x * s, py = FY + (y - HID) * s;
        if (x > 0 && !shown(x - 1, y)) { c.moveTo(px, py); c.lineTo(px, py + s); }
        if (x < g.W - 1 && !shown(x + 1, y)) { c.moveTo(px + s, py); c.lineTo(px + s, py + s); }
        if (y > HID && !shown(x, y - 1)) { c.moveTo(px, py); c.lineTo(px + s, py); }
        if (y < g.H - 1 && !shown(x, y + 1) && !clearing.includes(y + 1)) { c.moveTo(px, py + s); c.lineTo(px + s, py + s); }
      }
    }
    c.stroke();

    // ghost and active piece
    const p = g.piece;
    if (p) {
      const cells = g.rule.shapes[p.type][p.rot];
      if (!over && mode.ghost(g)) {
        const gy = g.ghostY();
        if (gy !== p.y) for (const [cx, cy] of cells) this.block(FX + (p.x + cx) * s, FY + (gy + cy - HID) * s, s, col[p.type], { alpha: 0.28, bone: p.bone });
      }
      const dim = over ? 0.3 : 0.45 * Math.min(1, g.lockTimer / Math.max(1, g.tm.lock));
      for (const [cx, cy] of cells) this.block(FX + (p.x + cx) * s, FY + (p.y + cy - HID) * s, s, col[p.type], { dim, bone: p.bone });
    }
    c.restore();

    // sparks (line clears, fireworks)
    this.sparks = this.sparks.filter((k) => k.life > 0);
    for (const k of this.sparks) {
      k.x += k.vx; k.y += k.vy; k.vy += 0.12; k.life--;
      c.globalAlpha = Math.min(1, k.life / 20); c.fillStyle = k.c;
      c.fillRect(k.x, k.y, 3, 3);
    }
    c.globalAlpha = 1;

    // next queue and hold
    this.text('NEXT', FX + 3 * CELL, FY - 88, 13, '#9aa3b5');
    if (g.next[0]) this.preview(g, g.next[0], FX + 3 * CELL, FY - 76, CELL);
    for (let i = 1; i < g.next.length; i++) this.preview(g, g.next[i], FX + 208 + (i - 1) * 62, FY - 76, 13);
    if (g.holdEnabled) {
      this.text('HOLD', FX - 4, FY - 88, 13, '#9aa3b5');
      if (g.hold) this.preview(g, g.hold, FX - 4, FY - 76, 13, g.holdUsed ? 0.4 : 1);
    }

    // left panel
    const LX = 20;
    this.text(mode.game === 'ti' ? 'TGM3' : 'TGM2', LX, 138, 13, '#9aa3b5');
    this.text(mode.name, LX, 162, 22, mode.color);
    if (mode.game === 'ti') this.text(g.rule.name + ' RULE', LX, 182, 12, '#9aa3b5');
    const grade = mode.gradeText(g);
    const exam = g.exam;
    if (exam && !over) {
      // The running grade is hidden during an exam; only the grade at stake is shown.
      const promo = exam.type === 'promotion';
      this.text(promo ? 'PROMOTION EXAM' : 'DEMOTION EXAM', LX, 232, 13, promo ? '#7fe0ff' : '#ff7a6a');
      this.text(TGM.TI_GRADES[exam.grade], LX, 286, 54, promo ? '#7fe0ff' : '#ff7a6a', 'left', 800);
    } else if (grade) {
      this.text('GRADE', LX, 232, 13, '#9aa3b5');
      this.text(grade, LX, 286, 54, '#ffe27a', 'left', 800);
    }
    let hy = 340;
    for (const [label, value] of mode.hud(g)) {
      this.text(label, LX, hy, 12, '#9aa3b5');
      this.text(String(value), LX, hy + 24, 20, '#fff');
      hy += 58;
    }

    // right panel
    const RX = FX + FW + 24;
    const [cur, goal] = mode.levelText(g);
    this.text(mode.noLevel ? 'STAGE' : 'LEVEL', RX, FY + FH - 88, 13, '#9aa3b5');
    this.text(String(cur).padStart(3, '0'), RX, FY + FH - 54, 30, '#fff');
    c.fillStyle = '#fff'; c.fillRect(RX, FY + FH - 46, 62, 3);
    this.text(String(goal).padStart(3, '0'), RX, FY + FH - 12, 30, '#fff');
    if (g.sectionTimes.length) {
      this.text('SECTIONS', RX, 138, 12, '#9aa3b5');
      g.sectionTimes.forEach((t, i) => {
        const cool = g.coolFlags && g.coolFlags[i];
        this.text(TGM.fmt(t), RX, 160 + i * 19, 14, cool ? '#7fe0ff' : '#d5d9e2', 'left', 600);
      });
    }
    if (g.roll && !over) {
      this.text('STAFF ROLL', RX, FY + FH - 150, 12, '#9aa3b5');
      this.text(TGM.fmt(g.roll.left), RX, FY + FH - 128, 18, '#ffe27a');
    }

    // timer
    this.text(TGM.fmt(g.time), FX + FW / 2, FY + FH + 44, 32, '#fff', 'center', 800);

    // overlays
    const cx = FX + FW / 2;
    if (g.state === 'ready') {
      this.text(g.timer > TGM.READY_FRAMES / 2 ? 'READY' : 'GO!', cx, FY + 250, 44, '#fff', 'center', 800);
      if (exam) {
        const promo = exam.type === 'promotion';
        this.text(promo ? 'PROMOTION EXAM' : 'DEMOTION EXAM', cx, FY + 300, 22, promo ? '#7fe0ff' : '#ff7a6a', 'center', 800);
        this.text((promo ? 'reach ' : 'hold ') + TGM.TI_GRADES[exam.grade], cx, FY + 326, 16, '#d5d9e2', 'center');
      }
    } else if (g.msg && g.frame < g.msg.until && !over) {
      const cool = g.msg.text.startsWith('COOL');
      this.text(g.msg.text, cx, FY + 250, 34, cool ? '#7fe0ff' : g.msg.text.startsWith('REGRET') ? '#ff7a6a' : '#fff', 'center', 800);
    }
    if (over || paused) {
      c.fillStyle = 'rgba(0,0,0,0.72)'; c.fillRect(FX, FY + 170, FW, over ? 220 : 110);
      if (paused && !over) {
        this.text('PAUSED', cx, FY + 235, 34, '#fff', 'center', 800);
      } else {
        const title = { topout: 'GAME OVER', clear: 'EXCELLENT!', torikan: 'TIME OVER AT LEVEL STOP', timeup: 'TIME UP' }[g.result];
        this.text(title, cx, FY + 215, g.result === 'torikan' ? 18 : 32, g.result === 'clear' ? '#ffe27a' : '#fff', 'center', 800);
        if (grade) this.text('GRADE  ' + grade, cx, FY + 262, 26, '#ffe27a', 'center', 800);
        this.text(mode.noLevel ? `STAGES CLEARED  ${g.cleared}` : `LEVEL  ${g.level}`, cx, FY + 296, 16, '#d5d9e2', 'center');
        this.text('TIME  ' + TGM.fmt(g.time), cx, FY + 320, 16, '#d5d9e2', 'center');
        const er = g.examResult;
        if (er) {
          const G = TGM.TI_GRADES;
          const line = er.type === 'promotion'
            ? (er.passed ? 'EXAM PASSED  ' + G[er.from] + ' → ' + G[er.to] : 'EXAM FAILED')
            : (er.passed ? 'DEMOTION AVOIDED' : 'DEMOTED  ' + G[er.from] + ' → ' + G[er.to]);
          this.text(line, cx, FY + 348, 17, er.passed ? '#7fe0ff' : '#ff7a6a', 'center', 800);
        }
        this.text('ENTER  retry      ESC  menu', cx, FY + 376, 13, '#9aa3b5', 'center');
      }
    }
  }

  burst(n, color) {
    const x = FX + 30 + Math.random() * (FW - 60), y = FY + 60 + Math.random() * 260;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, v = 1 + Math.random() * 3.5;
      this.sparks.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 30 + Math.random() * 30, c: color });
    }
  }
}

TGM.Renderer = Renderer;
TGM.VIEW = { w: VW, h: VH };
})();
