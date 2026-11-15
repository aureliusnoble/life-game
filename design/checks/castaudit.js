// Cast audit for design/presets.md. NOT the game's simulation.
// Direction check: what lets hunters and the grazers they live on last together, as the preset cast must?
// Run: node design/checks/castaudit.js [scenario]
const { World, I, mean, row } = require('./verbaudit.js');
const { build, hunter, flee, SCARED, hunterBody } = require('./bodyaudit.js');
const { live, count, toCover } = require('./envaudit.js');

// Grazers with crevices to hide in, and hunters that live on them. Each line adds one thing that might steady the pair.
// "Together" is the share of the run in which both species have at least one member or egg.
function lasting() {
  const BEATS = 20000, RUNS = 6;
  const grazer = { ...build({}), moods: SCARED, breedAt: 0.7, eggCost: 0.3, cap: 40, instincts: [toCover, ...flee, I('see plant', 'approach', { in: ['hungry'], notIn: ['Scared'] }), I('touch plant', 'bite'), I('always', 'wander', { str: 'weak' })] };
  const hb = build(hunterBody), base = { ...hunter('chaser'), killGain: 0.6 * hb.store, breedAt: 0.8, eggCost: 0.4, cap: 8, adultAt: 400 };
  const nearKin = (c, w, R) => w.creatures.filter((o) => o !== c && o.alive && o.kind === c.kind && w.off(c, o)[2] < R).length;
  const variants = {
    'as before: hunters live on grazers alone': { h: base },
    'hunters can also graze, poorly': { h: { ...base, diet: { grass: 0.35 }, instincts: [...base.instincts, I('see plant', 'approach', { str: 'weak', in: ['hungry'] }), I('touch plant', 'bite', { in: ['hungry'] })] } },
    'hunters breed slowly and not when crowded': { h: { ...base, eggGap: 900, breedIf: (c, w) => nearKin(c, w, 150) < 2 } },
    'hunters rest when fed': { h: { ...base, instincts: base.instincts.map((x) => (x.act === 'wander' ? x : I(x.when, x.act, { str: x.str, pace: x.pace, in: ['hungry'] }))) } },
    'newcomers arrive when a species is gone': { h: base, arrive: true },
    'all four': { h: { ...base, diet: { grass: 0.35 }, eggGap: 900, breedIf: (c, w) => nearKin(c, w, 150) < 2, instincts: [...base.instincts.map((x) => (x.act === 'wander' ? x : I(x.when, x.act, { str: x.str, pace: x.pace, in: ['hungry'] }))), I('see plant', 'approach', { str: 'weak', in: ['hungry'] }), I('touch plant', 'bite', { in: ['hungry'] })] }, arrive: true },
  };
  console.log(`\nLASTING TOGETHER  (12 grazers with crevices to hide in, 2 hunters, both breeding, ${BEATS} beats, ${RUNS} runs)`);
  for (const [name, v] of Object.entries(variants)) { const tog = [], gN = [], hN = [], gLow = [], gHigh = [], hGone = [], gGone = [], arrivals = [];
    for (let seed = 1; seed <= RUNS; seed++) { const w = new World(300, seed); w.starve = true; let both = 0, n = 0, gs = 0, hs = 0, lo = 1e9, hi = 0, hOut = 0, gOut = 0, came = 0, hAway = 0, gAway = 0;
      for (let i = 0; i < 6; i++) w.covers.push({ x: 60 + (i % 3) * 90, y: 90 + Math.floor(i / 3) * 120, r: 20, maxSize: 1.2 });
      const open = () => { for (let k = 0; k < 20; k++) { const p = { x: w.rnd() * 300, y: w.rnd() * 300, type: 'grass' }; if (!w.coverOf(p)) return p; } return null; };
      for (let i = 0; i < 50; i++) { const p = open(); if (p) w.plants.push(p); }
      for (let i = 0; i < 12; i++) w.add('grazer', grazer); for (let i = 0; i < 2; i++) w.add('hunter', v.h);
      live(w, BEATS, { grow: (w) => { if (w.plants.length < 70 && w.rnd() < 0.3) { const p = open(); if (p) w.plants.push(p); }
        if (w.t % 100 === 0) { const g = count(w, 'grazer') + w.eggCount('grazer'), h = count(w, 'hunter') + w.eggCount('hunter'); n++; if (g && h) both++; gs += g; hs += h;
          if (w.t > 2000) { lo = Math.min(lo, g); hi = Math.max(hi, g); }
          if (!h) { if (!hAway) hOut++; hAway++; } else hAway = 0; if (!g) { if (!gAway) gOut++; gAway++; } else gAway = 0;
          if (v.arrive && hAway >= 10 && g >= 6) { for (let i = 0; i < 2; i++) w.add('hunter', v.h); came++; hAway = 0; }
          if (v.arrive && gAway >= 10) { for (let i = 0; i < 6; i++) w.add('grazer', grazer); came++; gAway = 0; } } } });
      tog.push(both / n); gN.push(gs / n); hN.push(hs / n); gLow.push(lo); gHigh.push(hi); hGone.push(hOut); gGone.push(gOut); arrivals.push(came); }
    row(name, `together ${(100 * mean(tog)).toFixed(0)}% of the run`, `grazers ${mean(gN).toFixed(0)} on average, between ${mean(gLow).toFixed(0)} and ${mean(gHigh).toFixed(0)}`, `hunters ${mean(hN).toFixed(1)} on average`, `hunters died out ${mean(hGone).toFixed(1)} times a run, grazers ${mean(gGone).toFixed(1)}`, v.arrive ? `arrivals ${mean(arrivals).toFixed(1)} a run` : ''); }
}

// The same pair, changing only how cheaply a hunter lives: its running cost as a share of the body audit's figure.
// If hunters cannot make a living even when grazers are plentiful, nothing about the pairing can be learned.
function frugal() {
  const BEATS = 20000, RUNS = 6;
  const grazer = { ...build({}), moods: SCARED, breedAt: 0.7, eggCost: 0.3, cap: 40, instincts: [toCover, ...flee, I('see plant', 'approach', { in: ['hungry'], notIn: ['Scared'] }), I('touch plant', 'bite'), I('always', 'wander', { str: 'weak' })] };
  const hb = build(hunterBody), nearKin = (c, w, R) => w.creatures.filter((o) => o !== c && o.alive && o.kind === c.kind && w.off(c, o)[2] < R).length;
  console.log(`\nA HUNTER THAT CAN MAKE A LIVING  (the same pair; ${BEATS} beats, ${RUNS} runs)`);
  for (const [cost, slow] of [[1, false], [0.5, false], [0.25, false], [0.12, false], [0.25, true], [0.12, true]]) { const tog = [], gN = [], hN = [], lo = [], hi = [], hLo = [], hHi = [], hGone = [], gGone = [];
    const hunt = { ...hunter('chaser'), upkeep: hb.upkeep * cost, killGain: 0.6 * hb.store, breedAt: 0.8, eggCost: 0.4, cap: 12, adultAt: 400, ...(slow ? { eggGap: 900, breedIf: (c, w) => nearKin(c, w, 150) < 2 } : {}) };
    for (let seed = 1; seed <= RUNS; seed++) { const w = new World(300, seed); w.starve = true; let both = 0, n = 0, gs = 0, hs = 0, l = 1e9, h1 = 0, hl = 1e9, hh = 0, hOut = 0, gOut = 0;
      for (let i = 0; i < 6; i++) w.covers.push({ x: 60 + (i % 3) * 90, y: 90 + Math.floor(i / 3) * 120, r: 20, maxSize: 1.2 });
      const open = () => { for (let k = 0; k < 20; k++) { const p = { x: w.rnd() * 300, y: w.rnd() * 300, type: 'grass' }; if (!w.coverOf(p)) return p; } return null; };
      for (let i = 0; i < 50; i++) { const p = open(); if (p) w.plants.push(p); }
      for (let i = 0; i < 12; i++) w.add('grazer', grazer); for (let i = 0; i < 2; i++) w.add('hunter', hunt);
      live(w, BEATS, { grow: (w) => { if (w.plants.length < 70 && w.rnd() < 0.3) { const p = open(); if (p) w.plants.push(p); }
        if (w.t % 100 === 0) { const g = count(w, 'grazer') + w.eggCount('grazer'), h = count(w, 'hunter') + w.eggCount('hunter'); n++; if (g && h) both++; gs += g; hs += h;
          if (w.t > 3000) { l = Math.min(l, g); h1 = Math.max(h1, g); hl = Math.min(hl, h); hh = Math.max(hh, h); } if (!h && !hOut) hOut = 1; if (!g && !gOut) gOut = 1; } } });
      tog.push(both / n); gN.push(gs / n); hN.push(hs / n); lo.push(l); hi.push(h1); hLo.push(hl); hHi.push(hh); hGone.push(hOut); gGone.push(gOut); }
    row(`running cost ${cost}${slow ? ', breeds slowly and not when crowded' : ''}`, `together ${(100 * mean(tog)).toFixed(0)}% of the run`, `grazers ${mean(gN).toFixed(0)} on average, between ${mean(lo).toFixed(0)} and ${mean(hi).toFixed(0)}`, `hunters ${mean(hN).toFixed(1)} on average, between ${mean(hLo).toFixed(0)} and ${mean(hHi).toFixed(0)}`, `hunters died out in ${hGone.reduce((a, b) => a + b, 0)}/${RUNS} runs, grazers in ${gGone.reduce((a, b) => a + b, 0)}/${RUNS}`); }
}

// The same pair in a world four times the area, with four times the crevices and food, to see whether room alone helps:
// a patch the hunters have emptied can be refilled from one they have not found. Slow to run, so it is not part of the default set.
function roomy() {
  const BEATS = 15000, RUNS = 2, S = 600, k = (S / 300) ** 2;
  const grazer = { ...build({}), moods: SCARED, breedAt: 0.7, eggCost: 0.3, cap: 40 * k, instincts: [toCover, ...flee, I('see plant', 'approach', { in: ['hungry'], notIn: ['Scared'] }), I('touch plant', 'bite'), I('always', 'wander', { str: 'weak' })] };
  const hb = build(hunterBody), nearKin = (c, w, R) => w.creatures.filter((o) => o !== c && o.alive && o.kind === c.kind && w.off(c, o)[2] < R).length;
  console.log(`\nROOM  (the same pair in four times the area; ${BEATS} beats, ${RUNS} runs)`);
  for (const [cost, slow] of [[0.5, false], [0.25, true]]) { const tog = [], gN = [], hN = [], lo = [], hi = [], hLo = [], hHi = [], hGone = [], gGone = [];
    const hunt = { ...hunter('chaser'), upkeep: hb.upkeep * cost, killGain: 0.6 * hb.store, breedAt: 0.8, eggCost: 0.4, cap: 12 * k, adultAt: 400, ...(slow ? { eggGap: 900, breedIf: (c, w) => nearKin(c, w, 150) < 2 } : {}) };
    for (let seed = 1; seed <= RUNS; seed++) { const w = new World(S, seed); w.starve = true; let both = 0, n = 0, gs = 0, hs = 0, l = 1e9, h1 = 0, hl = 1e9, hh = 0, hOut = 0, gOut = 0;
      for (let i = 0; i < 24; i++) w.covers.push({ x: 50 + (i % 6) * 100, y: 75 + Math.floor(i / 6) * 150, r: 20, maxSize: 1.2 });
      const open = () => { for (let j = 0; j < 20; j++) { const p = { x: w.rnd() * S, y: w.rnd() * S, type: 'grass' }; if (!w.coverOf(p)) return p; } return null; };
      for (let i = 0; i < 50 * k; i++) { const p = open(); if (p) w.plants.push(p); }
      for (let i = 0; i < 12 * k; i++) w.add('grazer', grazer); for (let i = 0; i < 2 * k; i++) w.add('hunter', hunt);
      live(w, BEATS, { cap: 40 * k, grow: (w) => { for (let j = 0; j < k; j++) if (w.plants.length < 70 * k && w.rnd() < 0.3) { const p = open(); if (p) w.plants.push(p); }
        if (w.t % 100 === 0) { const g = count(w, 'grazer') + w.eggCount('grazer'), h = count(w, 'hunter') + w.eggCount('hunter'); n++; if (g && h) both++; gs += g; hs += h;
          if (w.t > 3000) { l = Math.min(l, g); h1 = Math.max(h1, g); hl = Math.min(hl, h); hh = Math.max(hh, h); } if (!h && !hOut) hOut = 1; if (!g && !gOut) gOut = 1; } } });
      tog.push(both / n); gN.push(gs / n); hN.push(hs / n); lo.push(l); hi.push(h1); hLo.push(hl); hHi.push(hh); hGone.push(hOut); gGone.push(gOut); }
    row(`running cost ${cost}${slow ? ', breeds slowly and not when crowded' : ''}`, `together ${(100 * mean(tog)).toFixed(0)}% of the run`, `grazers ${mean(gN).toFixed(0)} on average, between ${mean(lo).toFixed(0)} and ${mean(hi).toFixed(0)}`, `hunters ${mean(hN).toFixed(1)} on average, between ${mean(hLo).toFixed(0)} and ${mean(hHi).toFixed(0)}`, `hunters died out in ${hGone.reduce((a, b) => a + b, 0)}/${RUNS} runs, grazers in ${gGone.reduce((a, b) => a + b, 0)}/${RUNS}`); }
}

if (require.main === module) { const only = process.argv[2]; for (const f of [lasting, frugal, roomy]) if (only ? f.name === only : f !== roomy) f(); }
