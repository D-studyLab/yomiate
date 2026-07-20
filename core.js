"use strict";
// yomiate core: 4-digit no-repeat Hit&Blow with purchasable hints and a live
// candidate counter. Pure logic shared by index.html and core.test.js.
(function (root) {
  function mulberry(seed) { let a = seed >>> 0;
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

  const N = 4; // default digit count (daily mode)

  function allCandidates(n) {
    n = n || N;
    const out = [];
    const rec = (prefix, used) => {
      if (prefix.length === n) { out.push(prefix.slice()); return; }
      for (let d = 0; d <= 9; d++) {
        if (used & (1 << d)) continue;
        prefix.push(d); rec(prefix, used | (1 << d)); prefix.pop();
      }
    };
    rec([], 0);
    return out; // 10P n (4桁=5040, 5桁=30240, 6桁=151200)
  }

  function hb(guess, ans) {
    let h = 0, b = 0;
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === ans[i]) h++;
      else if (ans.includes(guess[i])) b++;
    }
    return { h, b };
  }

  // hint answers computed on the true answer
  const HINTS = {
    sum:  { label: '全部の桁を足すといくつ？', fn: a => a.reduce((x, y) => x + y, 0), fmt: v => `合計は ${v}` },
    even: { label: '偶数は何個ある？', fn: a => a.filter(v => v % 2 === 0).length, fmt: v => `偶数は ${v}個` },
    max:  { label: '一番大きい数字は？', fn: a => Math.max(...a), fmt: v => `最大は ${v}` },
    one:  { label: '含まれる数字を1つ教えて', fn: (a, rng) => a[Math.floor(rng() * a.length)], fmt: v => `「${v}」が含まれる` },
    has:  { label: '数字Xはある？（Xを選ぶ）', fn: null, fmt: null }, // handled specially
  };

  // filter candidates against a history of constraints
  // history items: {type:'guess', guess, h, b} | {type:'hint', kind, value, digit?}
  function matches(cand, item) {
    if (item.type === 'guess') {
      const r = hb(item.guess, cand);
      return r.h === item.h && r.b === item.b;
    }
    if (item.kind === 'sum') return cand.reduce((x, y) => x + y, 0) === item.value;
    if (item.kind === 'even') return cand.filter(v => v % 2 === 0).length === item.value;
    if (item.kind === 'max') return Math.max(...cand) === item.value;
    if (item.kind === 'one') return cand.includes(item.value);
    if (item.kind === 'has') return cand.includes(item.digit) === item.value;
    return true;
  }
  function filterCandidates(cands, history) {
    return cands.filter(c => history.every(it => matches(c, it)));
  }

  function makeAnswer(rng, n) {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = digits.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [digits[i], digits[j]] = [digits[j], digits[i]]; }
    return digits.slice(0, n || N);
  }

  // score: fast & clean wins big; hints and extra turns cost. Loss = 0.
  function scoreOf(win, sec, hints, turns) {
    if (!win) return 0;
    return Math.max(0, 1000 - Math.round(sec * 4) - hints * 100 - (turns - 1) * 50);
  }

  // daily seed from a YYYY-MM-DD string (stable across timezones by using the string)
  function dailySeed(dateStr) {
    let h = 2166136261;
    for (const ch of dateStr) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  const api = { mulberry, N, allCandidates, hb, HINTS, matches, filterCandidates, makeAnswer, dailySeed, scoreOf };
  if (typeof module !== 'undefined') module.exports = api;
  else root.YOMIATE = api;
})(typeof window !== 'undefined' ? window : globalThis);
