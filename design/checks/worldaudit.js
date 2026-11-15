// World audit for design/world.md. NOT the game's simulation.
// Three questions: does each biome have a different best build, does a biome recover after being overused,
// and do different ways of living through the year win in different climates?
// Run: node design/checks/worldaudit.js [scenario]
const { World, I, mean, row } = require('./verbaudit.js');
const { build, hunter, prey, flee, graze, hunterBody, HUNT } = require('./bodyaudit.js');
const { live, count, toCover } = require('./envaudit.js');

// Each biome as the stand-in world can express it: its ground rule, its cover, its light and where its food grows.
const BIOMES = {
  rocks:   { cover: { n: 8, r: 15, maxSize: 0.9 }, food: 'open', plants: 30, regrow: 0.12 },      // crevices only small bodies fit; thin food
  thicket: { cover: { n: 7, r: 30 }, bigDrag: 0.33, light: 0.6, food: 'inside', plants: 45, regrow: 0.25 }, // tangle slows big bodies; dim
  meadow:  { plants: 60, regrow: 0.35 },                                                           // open, fast, rich
  reeds:   { cover: { n: 9, r: 26 }, bigDrag: 0.6, food: 'inside', plants: 45, regrow: 0.25 },     // hides what is inside
  pond:    { water: true, plants: 45, regrow: 0.25 },                                              // everything swims
  mudflat: { mud: true, plants: 45, regrow: 0.25 },                                                // heavy and armoured bodies bog down
};
function makeBiome(name, seed, size = 260) {
  const b = BIOMES[name], w = new World(size, seed, true); w.starve = true; w.light = b.light ?? 1;
  if (b.cover) for (let i = 0; i < b.cover.n; i++) w.covers.push({ x: w.rnd() * size, y: w.rnd() * size, r: b.cover.r, maxSize: b.cover.maxSize });
  if (b.water) w.pond = { x: size / 2, y: size / 2, r: 1e6 };
  w.drag = (c) => (b.bigDrag && c.size > 1.2 && w.coverOf(c) ? b.bigDrag : 1) * (b.mud ? (c.brain.shell ? 0.4 : 1) * (c.size > 1.3 ? 0.55 : 1) : 1);
  w.sow = () => { for (let k = 0; k < 40; k++) { const q = { x: w.rnd() * size, y: w.rnd() * size, type: 'grass' }, c = w.coverOf(q); if (b.food === 'inside' ? c : b.food === 'open' ? !c : true) { w.plants.push(q); return; } } };
  for (let i = 0; i < b.plants; i++) w.sow();
  w.grow = (w) => { if (w.plants.length < b.plants && w.rnd() < b.regrow) w.sow(); };
  return w;
}

// 1. Ten builds in six biomes, with a middling hunter, a big hunter and a hunter that feels movement in each.
function biomes() {
  const run = [toCover, I('always', 'hold still', { str: 'strong', in: ['Scared', 'covered'] }), ...flee, ...graze], still = [I('see bigger creature', 'hold still', { str: 'strong' }), ...graze];
  const B = { sprinter: [{ len: 1.8, wid: 0.7, organs: { muscle: 0.45, lungs: 0.35, gut: 0.1, fat: 0.1 } }, run], tank: [{ len: 1.1, wid: 1.1, shell: 'back', spikes: 'back' }, run], giant: [{ scale: 1.5 }, run], ghost: [{ camo: true }, still],
    lookout: [{ eyes: 'stalk', eyeSize: 1 }, run], stinger: [{ weapon: 'stinger' }, [I('touch bigger creature', 'bite'), ...run]], tiptoe: [{ move: 'cilia', sideLine: true }, [I('feel movement', 'move away', { str: 'strong' }), ...run]],
    mite: [{ scale: 0.7 }, run], swimmer: [{ move: 'fins' }, run], wader: [{ move: 'paddles' }, run] };
  console.log('\n1. TEN BUILDS IN SIX BIOMES  (6 of one build; a middling hunter, a big one and one that feels movement; starvation on; 4000 beats, 8 runs)  survivors of 6');
  console.log('  ' + 'build'.padEnd(10) + Object.keys(BIOMES).map((k) => k.padStart(10)).join(''));
  const table = {};
  for (const [name, [spec, ins]] of Object.entries(B)) { const cells = []; table[name] = [];
    for (const bn of Object.keys(BIOMES)) { const alive = [];
      for (let seed = 1; seed <= 8; seed++) { const w = makeBiome(bn, seed), wet = !!BIOMES[bn].water, hb = wet ? { ...hunterBody, move: 'fins' } : hunterBody;
        for (let i = 0; i < 6; i++) w.add('g', prey(spec, ins));
        w.add('hunter', { ...build(hb), instincts: HUNT.chaser }); w.add('hunter', { ...build({ ...hb, scale: 1.9 }), instincts: HUNT.chaser }); w.add('hunter', { ...build({ ...hb, eyes: 'none', sideLine: true }), feel: 45, instincts: HUNT.feeler });
        live(w, 4000, { grow: w.grow }); alive.push(count(w, 'g')); }
      table[name].push(mean(alive)); cells.push(mean(alive).toFixed(1).padStart(10)); }
    console.log('  ' + name.padEnd(10) + cells.join('')); }
  const names = Object.keys(B); console.log('  ' + 'best'.padEnd(10) + Object.keys(BIOMES).map((_, i) => names.reduce((a, b) => (table[b][i] > table[a][i] ? b : a)).padStart(10)).join(''));
  console.log('  ' + 'worst'.padEnd(10) + Object.keys(BIOMES).map((_, i) => names.reduce((a, b) => (table[b][i] < table[a][i] ? b : a)).padStart(10)).join(''));
}

// 2. Overuse and recovery. Food grows faster the more of it stands, up to a ceiling, so heavy grazing slows its own regrowth.
// With a root stock a little always comes back; without one, food eaten to nothing is gone.
function recovery() {
  const grazer = { ...build({}), breedAt: 0.7, eggCost: 0.3, cap: 70, instincts: [I('see plant', 'approach', { str: 'strong', in: ['hungry'] }), I('touch plant', 'bite'), I('always', 'wander')] };
  console.log('\n2. OVERUSE AND RECOVERY  (10 breeding grazers on food that regrows from what is standing, 14000 beats, 6 runs)');
  for (const [name, roots, rest] of [['no root stock', 0, false], ['root stock: a trickle always regrows', 0.012, false], ['root stock, and grazed ground rests before regrowing fast', 0.012, true]]) { const low = [], peak = [], endFood = [], endG = [], gone = [], back = [];
    for (let seed = 1; seed <= 6; seed++) { const w = new World(300, seed, true); w.starve = true; const K = 80; let lowest = K, most = 0, tLow = null, tBack = null, worn = 0;
      const sow = () => w.plants.push({ x: w.rnd() * 300, y: w.rnd() * 300, type: 'grass' }); for (let i = 0; i < 60; i++) sow(); for (let i = 0; i < 10; i++) w.add('g', grazer);
      live(w, 14000, { grow: (w) => { const N = w.plants.length; if (rest) worn = Math.max(0, worn * 0.999 + (N < 10 ? 0.002 : 0)); const g = 0.006 * (rest ? 1 - Math.min(0.8, worn) : 1);
        if (w.rnd() < roots + g * N * (1 - N / K)) sow(); if (w.t % 100 === 0 && w.t > 500) { const n = count(w, 'g'); most = Math.max(most, n); if (N < lowest) { lowest = N; tLow = w.t; tBack = null; } if (tLow !== null && tBack === null && N >= 0.7 * K) tBack = w.t - tLow; } } });
      low.push(lowest); peak.push(most); endFood.push(w.plants.length); endG.push(count(w, 'g')); gone.push(count(w, 'g') === 0 && !w.eggCount('g') ? 1 : 0); back.push(tBack); }
    const rec = back.filter((x) => x !== null);
    row(name, `grazers peaked at ${mean(peak).toFixed(0)}`, `food fell to ${mean(low).toFixed(0)} of 80`, `food back to 70% in ${rec.length}/6 runs${rec.length ? `, taking ${mean(rec).toFixed(0)} beats` : ''}`, `at the end: food ${mean(endFood).toFixed(0)}, grazers ${mean(endG).toFixed(0)}, died out ${gone.reduce((a, b) => a + b, 0)}/6`); }
}

// 3. Ways of living through the year, in three climates.
function lifeCycles() {
  const eat = [I('see plant', 'approach', { str: 'strong', in: ['hungry'] }), I('touch plant', 'bite'), I('always', 'wander')], lean = { organs: { fat: 0.1, muscle: 0.35, gut: 0.3, lungs: 0.25 } };
  const kinds = { 'fast breeder': { ...build(lean), breedAt: 0.6, eggCost: 0.25, eggGap: 120, instincts: eat }, 'fat storer': { ...build({ organs: { fat: 0.55, muscle: 0.15, gut: 0.15, lungs: 0.15 } }), breedAt: 0.85, eggCost: 0.35, eggGap: 250, instincts: eat },
    'layer of waiting eggs': { ...build(lean), breedAt: 0.6, eggCost: 0.25, eggGap: 120, hatch: 1150, instincts: eat }, 'sleeper': { ...build({ organs: { fat: 0.45, muscle: 0.2, gut: 0.2, lungs: 0.15 } }), breedAt: 0.8, eggCost: 0.3, eggGap: 200, sleeps: true, instincts: eat } };
  console.log('\n3. WAYS OF LIVING THROUGH THE YEAR  (4 species, 6 of each, one food, 10000 beats, 5 runs)  adults at the end, plus eggs; in brackets, runs survived');
  for (const [wn, winter] of [['no winter', 0], ['short winter (500 beats in 2500)', 500], ['long winter (1100 beats in 2500)', 1100]]) { const fin = {}, kept = {}; for (const k of Object.keys(kinds)) { fin[k] = []; kept[k] = 0; }
    for (let seed = 1; seed <= 5; seed++) { const w = new World(300, seed, true); w.starve = true; for (let i = 0; i < 50; i++) w.plants.push({ x: w.rnd() * 300, y: w.rnd() * 300, type: 'grass' });
      for (const [k, b] of Object.entries(kinds)) for (let i = 0; i < 6; i++) w.add(k, b);
      live(w, 10000, { cap: 25, grow: (w) => { const cold = winter && w.t % 2500 >= 2500 - winter; w.cold = cold; if (!cold && w.plants.length < 70 && w.rnd() < 0.3) w.plants.push({ x: w.rnd() * 300, y: w.rnd() * 300, type: 'grass' });
        if (cold) for (const c of w.creatures) if (c.alive && c.brain.sleeps) { c.energy += 0.0012 * (c.brain.upkeep ?? 1) * 0.75; c.x -= c.vx; c.y -= c.vy; } } }); // a sleeper lies still through the cold and burns a quarter as much
      for (const k of Object.keys(kinds)) { const a = count(w, k), e = w.eggCount(k); fin[k].push([a, e]); if (a + e > 0) kept[k]++; } }
    row(wn, ...Object.keys(kinds).map((k) => `${k} ${mean(fin[k].map((x) => x[0])).toFixed(1)}+${mean(fin[k].map((x) => x[1])).toFixed(1)} (${kept[k]}/5)`)); }
}

// 4. Restraint. The same grazers on the same food, with three rules for when to lay.
function restraint() {
  const eat = [I('see plant', 'approach', { str: 'strong', in: ['hungry'] }), I('touch plant', 'bite'), I('always', 'wander')];
  const near = (w, c, list, R) => list.filter((o) => o !== c && (o.alive ?? true) && w.off(c, o)[2] < R).length;
  const rules = { 'lays whenever it is well fed': null, 'does not lay when crowded (5 or more of its kind near)': (c, w) => near(w, c, w.creatures.filter((o) => o.kind === c.kind), 70) < 5,
    'does not lay when food is thin (fewer than 4 plants in view)': (c, w) => near(w, c, w.plants, 51) >= 4 };
  console.log('\n4. RESTRAINT  (10 breeding grazers on food with a root stock, 14000 beats, 6 runs)');
  for (const [name, rule] of Object.entries(rules)) { const peak = [], low = [], endG = [], gone = [], fed = [];
    for (let seed = 1; seed <= 6; seed++) { const w = new World(300, seed, true); w.starve = true; const K = 80; let most = 0, lowest = K, food = 0, n = 0;
      const sow = () => w.plants.push({ x: w.rnd() * 300, y: w.rnd() * 300, type: 'grass' }); for (let i = 0; i < 60; i++) sow();
      for (let i = 0; i < 10; i++) w.add('g', { ...build({}), breedAt: 0.7, eggCost: 0.3, cap: 70, breedIf: rule, instincts: eat });
      live(w, 14000, { grow: (w) => { const N = w.plants.length; if (w.rnd() < 0.012 + 0.006 * N * (1 - N / K)) sow(); if (w.t % 100 === 0 && w.t > 500) { most = Math.max(most, count(w, 'g')); lowest = Math.min(lowest, N); food += N; n++; } } });
      peak.push(most); low.push(lowest); endG.push(count(w, 'g')); gone.push(count(w, 'g') === 0 && !w.eggCount('g') ? 1 : 0); fed.push(food / n); }
    row(name, `peaked at ${mean(peak).toFixed(0)}`, `food fell to ${mean(low).toFixed(0)} of 80, averaged ${mean(fed).toFixed(0)}`, `grazers at the end ${mean(endG).toFixed(0)}`, `died out ${gone.reduce((a, b) => a + b, 0)}/6`); }
}

// 5. Who can live where. Nine species from one pool are put into every biome, each biome with its own foods, and left to breed.
const FOODS_THIN = { // first attempt: secondary foods too scarce to carry a population
  rocks:   [['lichen', 16, 0.02, 'open'], ['seeds', 8, 0.015, 'open']],
  thicket: [['fruit', 22, 0.09, 'inside', 'pulse'], ['fungus', 16, 0.05, 'inside'], ['seeds', 10, 0.03, 'inside']],
  meadow:  [['grass', 40, 0.2, 'any'], ['flowers', 16, 0.1, 'any', 'day'], ['seeds', 10, 0.03, 'any']],
  reeds:   [['seeds', 18, 0.06, 'inside'], ['weed', 16, 0.06, 'inside'], ['worms', 12, 0.04, 'any', 'buried']],
  pond:    [['weed', 30, 0.12, 'any'], ['drift', 18, 0.09, 'inflow']],
  mudflat: [['worms', 30, 0.12, 'any', 'buried'], ['weed', 14, 0.25, 'any', 'flood']],
};
const FOODS = { // second attempt: every food in every biome is plentiful enough to carry a population of its own
  rocks:   [['lichen', 30, 0.06, 'open'], ['seeds', 14, 0.05, 'open']],
  thicket: [['fruit', 24, 0.1, 'inside', 'pulse'], ['fungus', 22, 0.08, 'inside'], ['seeds', 16, 0.06, 'inside']],
  meadow:  [['grass', 40, 0.2, 'any'], ['flowers', 28, 0.22, 'any', 'day'], ['seeds', 20, 0.07, 'any']],
  reeds:   [['seeds', 20, 0.07, 'inside'], ['weed', 20, 0.08, 'inside'], ['worms', 18, 0.07, 'any', 'buried']],
  pond:    [['weed', 30, 0.12, 'any'], ['drift', 22, 0.1, 'inflow'], ['worms', 18, 0.07, 'any', 'buried']],
  mudflat: [['worms', 30, 0.12, 'any', 'buried'], ['weed', 20, 0.3, 'any', 'flood'], ['seeds', 14, 0.05, 'any']],
};
function diversity(F = FOODS, label = 'every food plentiful enough to carry a population') {
  const see = [I('see plant', 'approach', { str: 'strong' }), I('touch plant', 'bite'), I('always', 'wander')], nose = [I('smell plant', 'approach', { str: 'strong' }), ...see];
  const pool = { grazer: [{}, { grass: 1, weed: 0.4 }, see], sipper: [{ scale: 0.8, organs: { fat: 0.45, gut: 0.25, muscle: 0.15, lungs: 0.15 } }, { flowers: 1, fruit: 0.5 }, see], cracker: [{}, { seeds: 1 }, see], 'fruit-nose': [{ scale: 0.85, nose: 70 }, { fruit: 1, fungus: 0.6 }, nose],
    prober: [{ scale: 0.8, nose: 60 }, { worms: 1 }, nose], swimmer: [{ move: 'fins' }, { weed: 1 }, see], filterer: [{ move: 'fins' }, { drift: 1 }, see], scraper: [{ scale: 0.7 }, { lichen: 1, fungus: 0.4 }, see],
    'eats most things': [{ move: 'paddles' }, { grass: 0.5, seeds: 0.5, weed: 0.5, fruit: 0.5, fungus: 0.5 }, see] };
  console.log(`\n5. WHO CAN LIVE WHERE: ${label}  (9 species, 4 of each, put into every biome and left to breed; no hunters; 6000 beats, 3 runs)  numbers at the end`);
  console.log('  ' + 'species'.padEnd(18) + Object.keys(F).map((k) => k.padStart(9)).join(''));
  const fin = {}; for (const k of Object.keys(pool)) fin[k] = {};
  for (const bn of Object.keys(F)) { const acc = {}; for (const k of Object.keys(pool)) acc[k] = [];
    for (let seed = 1; seed <= 3; seed++) { const w = makeBiome(bn, seed); w.plants = []; w.foods = ['grass', 'flowers', 'seeds', 'fruit', 'fungus', 'lichen', 'weed', 'drift', 'worms'];
      const place = (type, where, mode) => { for (let k = 0; k < 40; k++) { const q = { x: w.rnd() * w.size, y: w.rnd() * w.size, type, buried: mode === 'buried' };
          if (where === 'inflow') { const a = w.rnd() * 6.28, r = w.rnd() * 45; q.x = 60 + Math.cos(a) * r; q.y = 60 + Math.sin(a) * r; }
          const c = w.coverOf(q); if (mode === 'pulse') { const bush = w.covers[Math.floor(w.t / 800) % w.covers.length]; const a = w.rnd() * 6.28, r = w.rnd() * bush.r; q.x = bush.x + Math.cos(a) * r; q.y = bush.y + Math.sin(a) * r; w.plants.push(q); return; }
          if (where === 'inside' ? c : where === 'open' ? !c : true) { w.plants.push(q); return; } } };
      for (const [type, cap, , where, mode] of F[bn]) for (let i = 0; i < cap * 0.7; i++) place(type, where, mode);
      for (const [name, [spec, diet, ins]] of Object.entries(pool)) for (let i = 0; i < 4; i++) w.add(name, { ...build(spec), nose: spec.nose, diet, breedAt: 0.75, eggCost: 0.35, cap: 14, instincts: ins });
      live(w, 6000, { grow: (w) => { w.light = Math.floor(w.t / 600) % 2 === 0 ? 1 : 0.2; const flood = w.t % 1200 < 300;
        for (const [type, cap, regrow, where, mode] of F[bn]) { const have = w.plants.filter((p) => p.type === type).length;
          if (mode === 'day' && w.light < 0.5) { if (w.t % 600 === 0) w.plants = w.plants.filter((p) => p.type !== type); continue; }
          if (mode === 'flood' && !flood) continue;
          if (have < cap && w.rnd() < regrow) place(type, where, mode); } } });
      for (const k of Object.keys(pool)) acc[k].push(count(w, k)); }
    for (const k of Object.keys(pool)) fin[k][bn] = mean(acc[k]); }
  for (const k of Object.keys(pool)) console.log('  ' + k.padEnd(18) + Object.keys(F).map((b) => (fin[k][b] < 0.05 ? '-' : fin[k][b].toFixed(1)).padStart(9)).join(''));
  console.log('  ' + 'species living'.padEnd(18) + Object.keys(F).map((b) => String(Object.keys(pool).filter((k) => fin[k][b] >= 1).length).padStart(9)).join(''));
}

if (require.main === module) { const only = process.argv[2]; const thin = () => diversity(FOODS_THIN, 'first attempt, secondary foods scarce'); Object.defineProperty(thin, 'name', { value: 'thin' });
  for (const f of [biomes, recovery, lifeCycles, restraint, thin, diversity]) if (!only || f.name === only) f(); }
