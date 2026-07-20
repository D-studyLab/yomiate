"use strict";
// yomiate core gates.
const Y = require("./core.js");

let pass = true;
function check(n, c, d) { console.log(`${c ? "PASS" : "FAIL"}  ${n}  ${d || ""}`); if (!c) pass = false; }

// T1: candidate space is exactly 10*9*8*7 = 5040, all unique, no repeated digits
{
  const all = Y.allCandidates();
  const keys = new Set(all.map(c => c.join("")));
  const okDigits = all.every(c => new Set(c).size === 4);
  check("T1 candidate space", all.length === 5040 && keys.size === 5040 && okDigits, `${all.length}`);
}

// T2: H&B judge on known cases
{
  const cases = [
    [[1, 2, 3, 4], [1, 2, 3, 4], 4, 0],
    [[1, 2, 3, 4], [4, 3, 2, 1], 0, 4],
    [[1, 2, 3, 4], [1, 2, 4, 3], 2, 2],
    [[5, 6, 7, 8], [1, 2, 3, 4], 0, 0],
    [[0, 1, 2, 3], [0, 4, 5, 6], 1, 0],
    [[0, 1, 2, 3], [4, 0, 5, 6], 0, 1],
  ];
  let ok = true;
  for (const [g, a, h, b] of cases) {
    const r = Y.hb(g, a);
    if (r.h !== h || r.b !== b) { ok = false; console.log("  bad", g, a, r); break; }
  }
  check("T2 H&B judge", ok, `${cases.length} cases`);
}

// T3: the true answer always survives filtering (1000 random games)
{
  const rng = Y.mulberry(7);
  const all = Y.allCandidates();
  let ok = true;
  for (let t = 0; t < 1000; t++) {
    const ans = Y.makeAnswer(rng);
    const history = [];
    // 3 random guesses + all hint types
    for (let i = 0; i < 3; i++) {
      const g = Y.makeAnswer(rng);
      const r = Y.hb(g, ans);
      history.push({ type: "guess", guess: g, h: r.h, b: r.b });
    }
    history.push({ type: "hint", kind: "sum", value: ans.reduce((x, y) => x + y, 0) });
    history.push({ type: "hint", kind: "even", value: ans.filter(v => v % 2 === 0).length });
    history.push({ type: "hint", kind: "max", value: Math.max(...ans) });
    history.push({ type: "hint", kind: "one", value: ans[Math.floor(rng() * 4)] });
    const dg = Math.floor(rng() * 10);
    history.push({ type: "hint", kind: "has", digit: dg, value: ans.includes(dg) });
    const left = Y.filterCandidates(all, history);
    if (!left.some(c => c.join("") === ans.join(""))) { ok = false; break; }
  }
  check("T3 answer survives filters", ok, "1000 games");
}

// T4: filtering strictly narrows (a full-information history pins to exactly 1)
{
  const rng = Y.mulberry(21);
  const all = Y.allCandidates();
  let ok = true;
  for (let t = 0; t < 100; t++) {
    const ans = Y.makeAnswer(rng);
    const history = [{ type: "guess", guess: ans, h: 4, b: 0 }];
    const left = Y.filterCandidates(all, history);
    if (left.length !== 1 || left[0].join("") !== ans.join("")) { ok = false; break; }
  }
  check("T4 4H pins candidate", ok, "100 games");
}

// T5: daily seed stability + spread
{
  const s1 = Y.dailySeed("2026-07-20"), s2 = Y.dailySeed("2026-07-20"), s3 = Y.dailySeed("2026-07-21");
  const a1 = Y.makeAnswer(Y.mulberry(s1)), a2 = Y.makeAnswer(Y.mulberry(s2));
  // 30 days of answers should be mostly distinct
  const seen = new Set();
  for (let d = 1; d <= 30; d++) {
    const ds = `2026-08-${String(d).padStart(2, "0")}`;
    seen.add(Y.makeAnswer(Y.mulberry(Y.dailySeed(ds))).join(""));
  }
  check("T5 daily seeds", s1 === s2 && s1 !== s3 && a1.join("") === a2.join("") && seen.size >= 28, `30days->${seen.size} uniq`);
}

console.log(pass ? "\nYOMIATE CORE PASS" : "\nYOMIATE CORE FAIL");
process.exit(pass ? 0 : 1);
