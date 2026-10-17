// TGM3 qualification: the qualified grade, promotion exams and demotion exams for Master mode.
// Pure logic over a plain state object {qualified, history, demotion}; storage lives in main.js.
(function () {
'use strict';
const TGM = (globalThis.TGM = globalThis.TGM || {});

const HISTORY = 7;       // Master games remembered
const NEEDED = 4;        // games in the history that must reach the exam grade
const CHANCE = 3;        // a pending promotion exam starts one game in three
const DEMOTE_GAP = 7;    // grades below qualified before a game earns demotion points
const DEMOTE_AT = 30;    // demotion points that trigger a demotion exam
const MM = 31, GM = 32;

const Exam = {
  HISTORY, DEMOTE_AT,
  fresh: () => ({ qualified: 0, history: [], demotion: 0 }),

  // Highest grade reached in at least 4 of the last 7 games; GM is only offered to an MM.
  target(st) {
    if (st.history.length < HISTORY) return 0;
    const sorted = [...st.history].sort((a, b) => b - a);
    const t = sorted[NEEDED - 1];
    return t === GM && st.qualified < MM ? MM : t;
  },

  // Decide whether the next Master game is an exam. rand is a 0..1 random function.
  pick(st, rand) {
    if (st.demotion >= DEMOTE_AT) return { type: 'demotion', grade: st.qualified };
    const t = Exam.target(st);
    if (t > st.qualified && Math.floor(rand() * CHANCE) === 0) return { type: 'promotion', grade: t };
    return null;
  },

  // Apply a finished Master game. Returns {passed, from, to} for exam games, otherwise null.
  record(st, exam, grade) {
    const from = st.qualified;
    st.history.push(grade);
    while (st.history.length > HISTORY) st.history.shift();
    if (!exam) {
      if (grade < from - DEMOTE_GAP) st.demotion += from - grade - DEMOTE_GAP;
      return null;
    }
    let passed;
    if (exam.type === 'promotion') {
      passed = grade >= exam.grade;
      if (passed) { st.qualified = exam.grade; st.demotion = 0; }
    } else {
      passed = grade >= exam.grade;
      if (!passed) st.qualified = Math.max(0, exam.grade - 1);
      st.demotion = 0;
    }
    return { type: exam.type, passed, from, to: st.qualified };
  },
};

TGM.Exam = Exam;
})();
