// Environment audit for design/environment.md. NOT the game's simulation.
// Asks of each feature of the world: does it change who thrives, and does it make room for more than one way to live?
// Adds breeding, hatching and populations on top of the stand-in world.
// Run: node design/checks/envaudit.js [scenario]
const { World, I, mean, row } = require('./verbaudit.js');
const { build, hunter, prey, flee, graze, SCARED, hunterBody } = require('./bodyaudit.js');

const toCover = I('see cover', 'approach', { str: 'strong', pace: 'sprint', in: ['Scared'] });
const scatter = (w, n, kind, band) => { for (let i = 0; i < n; i++) w.plants.push({ x: band ? (band[0] + w.rnd() * (band[1] - band[0])) * w.size : w.rnd() * w.size, y: w.rnd() * w.size, type: kind }); };
const count = (w, kind) => w.creatures.filter((c) => c.alive && c.kind === kind).length;

// Run a world in which creatures breed, eggs hatch and the old die. grow(w) adds food each beat.
function live(w, beats, { grow, cap = 20, respawn } = {}) {
  const eggs = [];
  while (w.t < beats) {
    const before = w.log.kills.length; w.step(); if (grow) grow(w);
    if (respawn) for (let i = before; i < w.log.kills.length; i++) if (w.log.kills[i].who === respawn.kind) w.add(respawn.kind, respawn.brain);
    const n = {}; for (const c of w.creatures) if (c.alive) n[c.kind] = (n[c.kind] ?? 0) + 1; for (const e of eggs) n[e.kind] = (n[e.kind] ?? 0) + 1; // eggs count toward a species' ceiling
    for (const c of w.creatures) { if (!c.alive) continue; const b = c.brain, st = b.store ?? 1; c.age = (c.age ?? 0) + 1;
      if (c.eggCool > 0) c.eggCool--;
      else if (b.breedAt && c.age > (b.adultAt ?? 250) && c.energy >= b.breedAt * st && (n[c.kind] ?? 0) < (b.cap ?? cap) && (!b.breedIf || b.breedIf(c, w))) { c.energy -= (b.eggCost ?? 0.35) * st; c.eggCool = b.eggGap ?? 200; n[c.kind]++; eggs.push({ x: c.x, y: c.y, kind: c.kind, brain: b, at: w.t + (b.hatch ?? 150), home: c.home, homeAt: c.homeAt }); } }
    for (let i = eggs.length - 1; i >= 0; i--) if (eggs[i].at <= w.t) { const e = eggs.splice(i, 1)[0]; const y = w.add(e.kind, e.brain, { x: e.x, y: e.y }); y.home = e.home; y.homeAt = e.homeAt; y.energy = (e.brain.eggCost ?? 0.35) * (e.brain.store ?? 1) * 0.9; }
    if (w.t % 100 === 0) w.creatures = w.creatures.filter((c) => c.alive);
    w.eggCount = (k) => eggs.filter((e) => e.kind === k).length;
  }
}

// 1. Kinds of food. Four species share a world: three that each eat one food well, and one that eats everything poorly.
function foods() {
  const diets = { 'grass-eater': { grass: 1 }, 'seed-eater': { seed: 1 }, 'weed-eater': { weed: 1 }, 'eats anything': { grass: 0.55, seed: 0.55, weed: 0.55 } };
  const worlds = { 'one food': [['grass'], false], 'two foods, mixed together': [['grass', 'seed'], false], 'three foods, mixed together': [['grass', 'seed', 'weed'], false], 'three foods, each in its own region': [['grass', 'seed', 'weed'], false, true], 'three foods, each in its own season': [['grass', 'seed', 'weed'], true] };
  console.log('\n1. KINDS OF FOOD  (4 species, 5 of each to start, the same total food in every world, 7000 beats, 5 runs)  final numbers; in brackets, runs survived');
  console.log('  ' + ''.padEnd(40) + Object.keys(diets).map((k) => k.padStart(16)).join('') + '   species left');
  for (const [wn, [kinds, turns, zoned]] of Object.entries(worlds)) { const band = (k) => zoned ? [kinds.indexOf(k) / kinds.length, (kinds.indexOf(k) + 1) / kinds.length] : null; const fin = {}, kept = {}; const left = []; for (const k of Object.keys(diets)) { fin[k] = []; kept[k] = 0; }
    for (let seed = 1; seed <= 5; seed++) { const w = new World(300, seed, true); w.starve = true; w.foods = ['grass', 'seed', 'weed'];
      for (const k of kinds) scatter(w, Math.round(60 / kinds.length), k, band(k));
      for (const [name, diet] of Object.entries(diets)) for (let i = 0; i < 5; i++) w.add(name, { ...build({}), diet, breedAt: 0.75, eggCost: 0.35, instincts: [I('see plant', 'approach', { str: 'strong' }), I('touch plant', 'bite'), I('always', 'wander')] });
      live(w, 7000, { cap: 18, grow: (w) => { const k = turns ? kinds[Math.floor(w.t / 1200) % kinds.length] : kinds[Math.floor(w.rnd() * kinds.length)]; const have = w.plants.filter((p) => p.type === k).length;
        if (have < (turns ? 60 : 60 / kinds.length) && w.rnd() < 0.25) scatter(w, 1, k, band(k)); } });
      let alive = 0; for (const k of Object.keys(diets)) { const c = count(w, k); fin[k].push(c); if (c > 0) { kept[k]++; alive++; } } left.push(alive); }
    console.log('  ' + wn.padEnd(40) + Object.keys(diets).map((k) => `${mean(fin[k]).toFixed(1)} (${kept[k]}/5)`.padStart(16)).join('') + '   ' + mean(left).toFixed(1)); }
}

// 2. Refuges. Grazers and the hunters that live on them, with and without crevices the hunters cannot enter.
function refuges() {
  const grazer = { ...build({}), moods: SCARED, breedAt: 0.7, eggCost: 0.3, cap: 40, instincts: [toCover, ...flee, I('see plant', 'approach', { in: ['hungry'], notIn: ['Scared'] }), I('touch plant', 'bite'), I('always', 'wander', { str: 'weak' })] };
  const hb = build(hunterBody); const hunt = { ...hunter('chaser'), killGain: 0.6 * hb.store, breedAt: 0.8, eggCost: 0.4, cap: 8, adultAt: 400 };
  const worlds = { 'no hunters': [false, false], 'hunters, open ground': [true, false], 'hunters, with crevices': [true, true] };
  console.log('\n2. REFUGES  (12 grazers and 2 hunters to start, both breeding, food only in the open, 12000 beats, 5 runs)');
  for (const [wn, [hunters, crev]] of Object.entries(worlds)) { const g = [], h = [], pl = [], gone = [], hgone = [];
    for (let seed = 1; seed <= 5; seed++) { const w = new World(300, seed); w.starve = true; let gAt = null, hAt = null, plants = 0, samples = 0;
      if (crev) for (let i = 0; i < 6; i++) w.covers.push({ x: 60 + (i % 3) * 90, y: 90 + Math.floor(i / 3) * 120, r: 20, maxSize: 1.2 });
      const open = () => { for (let k = 0; k < 20; k++) { const p = { x: w.rnd() * 300, y: w.rnd() * 300, type: 'grass' }; if (!w.coverOf(p)) return p; } return null; };
      for (let i = 0; i < 50; i++) { const p = open(); if (p) w.plants.push(p); }
      for (let i = 0; i < 12; i++) w.add('grazer', grazer); if (hunters) for (let i = 0; i < 2; i++) w.add('hunter', hunt);
      live(w, 12000, { grow: (w) => { if (w.plants.length < 70 && w.rnd() < 0.3) { const p = open(); if (p) w.plants.push(p); }
        if (w.t % 200 === 0) { plants += w.plants.length; samples++; if (gAt === null && count(w, 'grazer') === 0 && !w.eggCount('grazer')) gAt = w.t; if (hunters && hAt === null && count(w, 'hunter') === 0 && !w.eggCount('hunter')) hAt = w.t; } } });
      g.push(count(w, 'grazer')); h.push(count(w, 'hunter')); pl.push(plants / samples); gone.push(gAt); hgone.push(hAt); }
    row(wn, `grazers at the end ${mean(g).toFixed(1)}, died out in ${gone.filter((x) => x !== null).length}/5 runs`, hunters ? `hunters at the end ${mean(h).toFixed(1)}, died out in ${hgone.filter((x) => x !== null).length}/5` : 'no hunters', `food standing ${mean(pl).toFixed(0)} of 70`); }
}

// 3. Day and night. At night eyes reach a fifth as far. Prey that are killed are replaced, so the figures are rates.
function dayNight() {
  const builds = { 'plain grazer': [{}, [...flee, ...graze]], 'silent grazer with a movement sense': [{ move: 'cilia', sideLine: true }, [I('feel movement', 'move away', { str: 'strong' }), ...flee, ...graze]], 'grazer with eyes that work in the dark': [{ night: true }, [...flee, ...graze]] };
  const guilds = { 'hunters that see': ['chaser', 'chaser'], 'hunters that feel movement': ['feeler', 'feeler'] };
  console.log('\n3. DAY AND NIGHT  (8 prey, 2 hunters, two days and two nights of 1500 beats each, 12 runs)  kills per day and per night');
  for (const [gn, guild] of Object.entries(guilds)) for (const [bn, [spec, ins]] of Object.entries(builds)) { const day = [], night = [];
    for (let seed = 1; seed <= 12; seed++) { const w = new World(280, seed, true); w.cap = 45; scatter(w, 45, 'grass'); let d = 0, n = 0;
      const brain = { ...prey(spec, ins), nightEyes: !!spec.night }; for (let i = 0; i < 8; i++) w.add('g', brain); for (const k of guild) w.add('hunter', hunter(k));
      live(w, 6000, { respawn: { kind: 'g', brain }, grow: (w) => { w.light = Math.floor(w.t / 1500) % 2 === 0 ? 1 : 0.2; if (w.plants.length < 45 && w.rnd() < 0.2) scatter(w, 1, 'grass'); } });
      for (const k of w.log.kills) if (k.who === 'g') (Math.floor(k.t / 1500) % 2 === 0 ? d++ : n++); day.push(d / 2); night.push(n / 2); }
    row(`${gn}: ${bn}`, `by day ${mean(day).toFixed(1)}`, `by night ${mean(night).toFixed(1)}`); }
}

// 4. Cover. Reed beds hide whatever is inside them from anything that is not close by.
function reeds() {
  const runs = [...flee, ...graze], hides = [toCover, I('always', 'hold still', { str: 'strong', in: ['Scared', 'covered'] }), ...flee, ...graze];
  const cases = [['open ground, prey runs', false, runs], ['reed beds, prey runs', true, runs], ['reed beds, prey runs to cover and holds still', true, hides]];
  console.log('\n4. COVER  (8 prey, 2 hunters, 4000 beats, 12 runs)  kills, with the dead replaced');
  for (const hk of ['chaser', 'feeler']) for (const [name, cover, ins] of cases) { const kills = [], meals = [];
    for (let seed = 1; seed <= 12; seed++) { const w = new World(280, seed, true); scatter(w, 45, 'grass'); if (cover) for (let i = 0; i < 7; i++) w.covers.push({ x: w.rnd() * 280, y: w.rnd() * 280, r: 24 });
      const brain = prey({}, ins); for (let i = 0; i < 8; i++) w.add('g', brain); for (let i = 0; i < 2; i++) w.add('hunter', hunter(hk));
      live(w, 4000, { respawn: { kind: 'g', brain }, grow: (w) => { if (w.plants.length < 45 && w.rnd() < 0.2) scatter(w, 1, 'grass'); } }); kills.push(w.log.kills.filter((k) => k.who === 'g').length); meals.push(w.log.meals); }
    row(`${hk === 'chaser' ? 'hunters that see' : 'hunters that feel movement'}: ${name}`, `kills ${mean(kills).toFixed(1)}`, `meals eaten by the prey ${mean(meals).toFixed(0)}`); }
}

// 5. Seasons. Three ways of living compete for one food: breed fast, store fat, or lay eggs that wait.
function seasons() {
  const eat = [I('see plant', 'approach', { str: 'strong', in: ['hungry'] }), I('touch plant', 'bite'), I('always', 'wander')];
  const lean = { organs: { fat: 0.1, muscle: 0.35, gut: 0.3, lungs: 0.25 } };
  const kinds = { 'fast breeder': { ...build(lean), breedAt: 0.6, eggCost: 0.25, eggGap: 120, instincts: eat }, 'fat storer': { ...build({ organs: { fat: 0.55, muscle: 0.15, gut: 0.15, lungs: 0.15 } }), breedAt: 0.85, eggCost: 0.35, eggGap: 250, instincts: eat }, 'layer of waiting eggs': { ...build(lean), breedAt: 0.6, eggCost: 0.25, eggGap: 120, hatch: 1150, instincts: eat } };
  console.log('\n5. SEASONS  (3 species, 6 of each to start, one food, 10000 beats, 5 runs)  final numbers; in brackets, runs survived');
  for (const [wn, seasonal] of [['food all year', false], ['summer of 1400 beats, winter of 1100 with no growth', true]]) { const fin = {}, kept = {}; for (const k of Object.keys(kinds)) { fin[k] = []; kept[k] = 0; }
    for (let seed = 1; seed <= 5; seed++) { const w = new World(300, seed, true); w.starve = true; scatter(w, 50, 'grass'); for (const [k, b] of Object.entries(kinds)) for (let i = 0; i < 6; i++) w.add(k, b);
      live(w, 10000, { cap: 25, grow: (w) => { const summer = !seasonal || w.t % 2500 < 1400; if (summer && w.plants.length < (seasonal ? 80 : 60) && w.rnd() < (seasonal ? 0.45 : 0.2)) scatter(w, 1, 'grass'); } });
      for (const k of Object.keys(kinds)) { const c = count(w, k) + w.eggCount(k); fin[k].push(c); if (c > 0) kept[k]++; } }
    row(wn, ...Object.keys(kinds).map((k) => `${k} ${mean(fin[k]).toFixed(1)} (${kept[k]}/5)`)); }
}

// 6. Crevices. Gaps in the rocks that only small bodies fit into.
function crevices() {
  console.log('\n6. CREVICES  (6 grazers, 2 hunters that chase, 3000 beats, 30 runs)  survivors of 6');
  for (const [name, sc] of [['small grazers', 0.7], ['medium grazers', 1.0]]) { const out = [];
    for (const rocks of [false, true]) { const alive = [];
      for (let seed = 1; seed <= 30; seed++) { const w = new World(260, seed, true); scatter(w, 40, 'grass'); if (rocks) for (let i = 0; i < 7; i++) w.covers.push({ x: w.rnd() * 260, y: w.rnd() * 260, r: 16, maxSize: 0.9 });
        for (let i = 0; i < 6; i++) w.add('g', prey({ scale: sc }, [toCover, I('see cover', 'stay near', { dist: 'close' }), I('always', 'hold still', { str: 'strong', in: ['Scared', 'covered'] }), ...flee, ...graze])); for (let i = 0; i < 2; i++) w.add('hunter', hunter('chaser'));
        live(w, 3000, { grow: (w) => { if (w.plants.length < 40 && w.rnd() < 0.2) scatter(w, 1, 'grass'); } }); alive.push(count(w, 'g')); }
      out.push(mean(alive).toFixed(1)); }
    row(name, `open ground ${out[0]}`, `among rocks with crevices ${out[1]}`); }
}

// 7. The same eight builds in five kinds of place. Is a different build best in each?
function places() {
  const still = [I('see bigger creature', 'hold still', { str: 'strong' }), ...graze], run = [toCover, ...flee, ...graze];
  const B = { sprinter: [{ len: 1.8, wid: 0.7, organs: { muscle: 0.45, lungs: 0.35, gut: 0.1, fat: 0.1 } }, run], tank: [{ len: 1.1, wid: 1.1, shell: 'back', spikes: 'back' }, run], ghost: [{ camo: true }, still],
    tiptoe: [{ move: 'cilia', sideLine: true }, [I('feel movement', 'move away', { str: 'strong' }), ...run]], lookout: [{ eyes: 'stalk', eyeSize: 1 }, run], stinger: [{ weapon: 'stinger' }, [I('touch bigger creature', 'bite'), ...run]], giant: [{ scale: 1.5 }, run], mite: [{ scale: 0.7 }, run] };
  // thick: big bodies are slowed to a third inside, and the food grows there. mud: armoured bodies are slowed to 40% everywhere.
  const P = { 'open meadow': { }, 'day and night': { cycle: 1000 }, 'reed beds': { covers: 7, r: 24 }, 'thicket': { covers: 7, r: 30, thick: true }, 'mudflat': { mud: true }, 'rocks': { covers: 7, r: 16, maxSize: 0.9 }, 'lean season': { regrow: 0.02, none: true } };
  console.log('\n7. EIGHT BUILDS IN FIVE PLACES  (6 of one build, one hunter that sees and one that feels movement, starvation on, 4000 beats, 10 runs)  survivors of 6');
  console.log('  ' + 'build'.padEnd(12) + Object.keys(P).map((k) => k.padStart(15)).join(''));
  for (const [name, [spec, ins]] of Object.entries(B)) { const cells = [];
    for (const p of Object.values(P)) { const alive = [];
      for (let seed = 1; seed <= 10; seed++) { const w = new World(260, seed, true); w.starve = true; for (let i = 0; i < (p.covers ?? 0); i++) w.covers.push({ x: w.rnd() * 260, y: w.rnd() * 260, r: p.r, maxSize: p.maxSize });
        if (p.thick) w.drag = (c) => (c.size > 1.2 && w.coverOf(c) ? 0.33 : 1); if (p.mud) w.drag = (c) => (c.brain.shell ? 0.4 : 1);
        const sow = () => { for (let k = 0; k < 40; k++) { const q = { x: w.rnd() * 260, y: w.rnd() * 260, type: 'grass' }; const c = w.coverOf(q); if (p.thick ? c : !c || !c.maxSize) { w.plants.push(q); return; } } }; for (let i = 0; i < 45; i++) sow();
        for (let i = 0; i < 6; i++) w.add('g', prey(spec, ins)); if (!p.none) { w.add('hunter', hunter('chaser')); w.add('hunter', hunter('feeler')); }
        live(w, 4000, { grow: (w) => { if (p.cycle) w.light = Math.floor(w.t / p.cycle) % 2 === 0 ? 1 : 0.2; if (w.plants.length < 45 && w.rnd() < (p.regrow ?? 0.25)) sow(); } }); alive.push(count(w, 'g')); }
      cells.push(mean(alive).toFixed(1).padStart(15)); }
    console.log('  ' + name.padEnd(12) + cells.join('')); }
}

module.exports = { live, scatter, count, toCover };
if (require.main === module) { const only = process.argv[2]; for (const f of [foods, refuges, dayNight, reeds, seasons, crevices, places]) if (!only || f.name === only) f(); }
