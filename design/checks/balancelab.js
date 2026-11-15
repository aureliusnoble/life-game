// Balance lab for design/plan.md. NOT the game's simulation.
// It searches the space of designs for the ones that do best in each habitat, then asks three things:
//   is any option in every winner (too strong)?  is any option in no good design anywhere (dead weight)?
//   and does changing one choice in a winner change how it does (a real choice)?
// Run: node design/checks/balancelab.js check | search <habitat> | report | knockout <habitat>
const fs = require('fs'), path = require('path');
const { I, mean, rng } = require('./verbaudit.js');
const { build, cost, flee, graze, SCARED, HUNT, hunterBody } = require('./bodyaudit.js');
const { live, count, toCover } = require('./envaudit.js');
const { BIOMES, makeBiome } = require('./worldaudit.js');

// ---------- the design space: every choice a player can make, as data ----------
const GENES = {
  scale: [0.7, 0.85, 1, 1.25, 1.5], shape: ['round', 'mid', 'long'], eyes: ['side', 'forward', 'stalk', 'none'], bigEyes: [false, true],
  move: ['legs', 'paddles', 'fins', 'cilia'], shell: ['none', 'back', 'full'], spikes: ['none', 'back', 'all'], sting: [false, true],
  camo: [false, true], sideLine: [false, true], falseEyes: [false, true], inside: ['even', 'runner', 'storer', 'digester'], nose: [false, true],
  threat: ['run', 'hide', 'freeze', 'ignore'], herd: [false, true], laying: ['always', 'not crowded', 'not when food is thin'], eggs: ['many small', 'few large'],
};
const PLAIN = { scale: 1, shape: 'mid', eyes: 'side', bigEyes: false, move: 'legs', shell: 'none', spikes: 'none', sting: false, camo: false, sideLine: false, falseEyes: false, inside: 'even', nose: false, threat: 'run', herd: false, laying: 'always', eggs: 'many small' };
const SHAPE = { round: [1.0, 1.1], mid: [1.2, 0.9], long: [1.8, 0.7] };
const INSIDE = { even: {}, runner: { muscle: 0.45, lungs: 0.35, gut: 0.1, fat: 0.1 }, storer: { fat: 0.55, muscle: 0.15, gut: 0.15, lungs: 0.15 }, digester: { gut: 0.55, fat: 0.15, muscle: 0.15, lungs: 0.15 } };
const BUDGET = 13, CAP = +(process.env.CAP ?? 30),   // CAP is the lab's own ceiling on a species' numbers, there to bound running time
   SHARE = 12, BEATS = 5000, PLAIN_MASS = Math.pow(1.2 * 0.9, 1.5), HABITATS = Object.keys(BIOMES), EXP = +(process.env.LIFE_EXP ?? 1), UPKEEP_EXP = +(process.env.UPKEEP_EXP ?? 0.75), GEN_EXP = +(process.env.GEN_EXP ?? 0),
  MIN_PREY = +(process.env.MIN_PREY ?? 0), PULSE = +(process.env.PULSE ?? 0),
  TAG = process.env.LAB_TAG ?? (EXP === 1 ? '' : 'exp' + EXP), OUT = path.join(__dirname, TAG ? 'balance-' + TAG : 'balance');
// MIN_PREY makes hunters ignore prey smaller than that share of their own size, as not worth the chase. PULSE, in beats,
// adds a disaster at that interval which kills four in five of every grazer, whatever its design; eggs survive it.
// UPKEEP_EXP sets how running costs rise with weight: 0.75 means a large body burns less per unit of weight (the body
// audit's rule), 1 means every unit of weight costs the same at any size. GEN_EXP above 0 makes small bodies grow up,
// lay and hatch faster and large ones slower. LAB_TAG names the folder the results go to.
// LIFE_EXP sets how weight is counted in the score: 1 counts living weight as it is; 0.75 counts it by appetite,
// which is the share of the habitat's food the species turns into life. Results for other settings go to their own folder.
const specOf = (g) => ({ len: SHAPE[g.shape][0], wid: SHAPE[g.shape][1], scale: g.scale, eyes: g.eyes, eyeSize: g.bigEyes ? 1 : 0.5, move: g.move, shell: g.shell, spikes: g.spikes, weapon: g.sting ? 'stinger' : undefined, camo: g.camo, sideLine: g.sideLine, falseEyes: g.falseEyes, organs: INSIDE[g.inside] });
const price = (g) => cost(specOf(g)) + (g.nose ? 2 : 0) + (g.herd ? 1 : 0) + (g.threat === 'hide' ? 1 : 0) + (g.laying === 'always' ? 0 : 1);
const keyOf = (g) => Object.keys(GENES).map((k) => g[k]).join('|');
const label = (g) => Object.keys(GENES).filter((k) => g[k] !== PLAIN[k]).map((k) => (typeof g[k] === 'boolean' ? k : `${k} ${g[k]}`)).join(', ') || 'plain';

// A design as the stand-in world runs it: a body, a short list of instincts, and a way of breeding.
function express(g) {
  const b = build(specOf(g)), ins = [], near = (w, c, list, R) => list.filter((o) => o !== c && (o.alive ?? true) && w.off(c, o)[2] < R).length;
  if (g.sting) ins.push(I('touch bigger creature', 'bite'));
  if (g.sideLine && g.threat !== 'ignore') ins.push(I('feel movement', 'move away', { str: 'strong' }));
  if (g.threat === 'hide') ins.push(toCover, I('always', 'hold still', { str: 'strong', in: ['Scared', 'covered'] }));
  if (g.threat === 'freeze') ins.push(I('see bigger creature', 'hold still', { str: 'strong' }));
  if (g.threat === 'run' || g.threat === 'hide') ins.push(...flee);
  if (g.herd) ins.push(I('see my kind', 'stay near', { dist: 'close', str: 'weak' }));
  if (g.nose) ins.push(I('smell plant', 'approach', { str: 'strong' }));
  ins.push(...graze);
  const breedIf = { always: null, 'not crowded': (c, w) => near(w, c, w.creatures.filter((o) => o.kind === c.kind), 70) < 5, 'not when food is thin': (c, w) => near(w, c, w.plants, 50) >= 3 }[g.laying];
  const eggs = g.eggs === 'many small' ? { breedAt: 0.6, eggCost: 0.25, eggGap: 120 } : { breedAt: 0.8, eggCost: 0.45, eggGap: 300 };
  const sp = specOf(g), mass = Math.pow(sp.len * sp.wid * sp.scale * sp.scale, 1.5), rel = mass / PLAIN_MASS, pace = Math.pow(rel, GEN_EXP);
  return { ...b, mass, upkeep: b.upkeep * Math.pow(rel, UPKEEP_EXP - 0.75), moods: SCARED, nose: g.nose ? 60 : undefined, breedAt: eggs.breedAt, eggCost: eggs.eggCost, eggGap: eggs.eggGap * pace, adultAt: 250 * pace, hatch: 150 * pace, cap: CAP, breedIf, instincts: ins };
}

// One trial: six of the design in a habitat with three hunters that never tire, and that are replaced if they die,
// so that a design cannot pass the test by removing the hunters. Food is kept short, so the habitat
// carries only ten to fifteen plain grazers and a design is limited by what it can find, eat and keep alive.
// The score is total life: the living weight of the species, added up over the whole run. It is scaled so that
// twelve plain animals alive from start to finish score 1, and a species that dies out early keeps what it had.
// With `versus`, six of a second design share the same food, and both are scored.
function trial(g, habitat, seed, o = {}) {
  const w = makeBiome(habitat, seed), hb = BIOMES[habitat].water ? { ...hunterBody, move: 'fins' } : hunterBody, brain = express(g);
  const H = (spec, ins, extra = {}) => { const b = { ...build(spec), ...extra, minPrey: MIN_PREY, instincts: ins }; if (!o.hungryHunters) b.upkeep = 0; return b; };
  const supply = (0.03 + 0.1 * BIOMES[habitat].regrow) / BIOMES[habitat].regrow;
  const other = o.versus ? express(o.versus) : null; for (let i = 0; i < 6; i++) { w.add('mine', brain); if (other) w.add('rival', other); }
  w.leftovers = process.env.LEFTOVERS === '1';   // LEFTOVERS=1: an animal eats what it has room for and leaves the rest of the plant
  const big = H({ ...hb, scale: 1.9 }, HUNT.chaser);   // CAST=big makes all three hunters large ones
  const cast = o.noHunters ? [] : process.env.CAST === 'big' ? [big, big, big] : [H(hb, HUNT.chaser), big, H({ ...hb, eyes: 'none', sideLine: true }, HUNT.feeler, { feel: 45 })], hs = cast.map((b) => w.add('hunter', b));
  let sum = 0, n = 0, hunterBeats = 0, rsum = 0, slain = 0, heads = 0;
  const weight = (kind) => w.creatures.reduce((a, c) => a + (c.alive && c.kind === kind ? Math.pow(c.brain.mass ?? 1, EXP) : 0), 0);
  live(w, BEATS, { grow: (w) => { if (w.rnd() < supply) w.grow(w);
    if (PULSE && w.t % PULSE === 0) for (const c of w.creatures) if (c.alive && c.kind !== 'hunter' && w.rnd() < 0.8) c.alive = false;
    if (w.t % 50 === 0 && !o.hungryHunters) hs.forEach((c, i) => { if (!c.alive) { slain++; hs[i] = w.add('hunter', cast[i]); } });
    if (w.t % 100 === 0) { hunterBeats += count(w, 'hunter'); sum += weight('mine'); rsum += weight('rival'); heads += count(w, 'mine'); n++; } } });
  return { score: sum / n / SHARE / Math.pow(PLAIN_MASS, EXP), rival: rsum / n / SHARE / Math.pow(PLAIN_MASS, EXP), heads: heads / n, hunters: hunterBeats / (BEATS / 100) / 3, kills: w.log.kills.length - slain, slain };
}
const memo = new Map();
function score(g, habitat, seeds) { const k = `${habitat}#${seeds.join(',')}#${keyOf(g)}`; if (!memo.has(k)) memo.set(k, mean(seeds.map((s) => trial(g, habitat, s).score))); return memo.get(k); }

// ---------- the search: breed designs toward whatever does best in one habitat ----------
function randomDesign(r) { for (;;) { const g = {}; for (const [k, v] of Object.entries(GENES)) g[k] = v[Math.floor(r() * v.length)]; if (price(g) <= BUDGET) return g; } }
function mutate(g, r) { for (;;) { const c = { ...g }, n = 1 + Math.floor(r() * 3), keys = Object.keys(GENES); for (let i = 0; i < n; i++) { const k = keys[Math.floor(r() * keys.length)]; c[k] = GENES[k][Math.floor(r() * GENES[k].length)]; } if (price(c) <= BUDGET && keyOf(c) !== keyOf(g)) return c; } }
function cross(a, b, r) { const c = {}; for (const k of Object.keys(GENES)) c[k] = r() < 0.5 ? a[k] : b[k]; return price(c) <= BUDGET ? c : mutate(a, r); }
function search(habitat, { pop = 18, keep = 6, gens = 10, seeds = [1, 2, 3] } = {}) {
  const r = rng(HABITATS.indexOf(habitat) * 97 + 5), seen = new Map(), rate = (g) => { const k = keyOf(g); if (!seen.has(k)) seen.set(k, { g, s: score(g, habitat, seeds) }); return seen.get(k); };
  let pool = [PLAIN, ...Array.from({ length: pop - 1 }, () => randomDesign(r))].map(rate);
  for (let gen = 0; gen < gens; gen++) { pool.sort((a, b) => b.s - a.s); const top = pool.slice(0, keep);
    const kids = Array.from({ length: pop - keep }, (_, i) => (i % 3 === 2 ? cross(top[Math.floor(r() * keep)].g, top[Math.floor(r() * keep)].g, r) : mutate(top[Math.floor(r() * Math.min(keep, 3 + i % 4))].g, r)));
    pool = [...top, ...kids.map(rate)]; }
  const all = [...seen.values()].sort((a, b) => b.s - a.s);
  return { habitat, tried: all.length, top: all.slice(0, 5).map((x) => ({ g: x.g, s: +x.s.toFixed(3), price: +price(x.g).toFixed(1) })), plain: +seen.get(keyOf(PLAIN)).s.toFixed(3) };
}
// Results are kept one file per habitat in design/checks/balance/, so that searches can run side by side.
const load = () => { const all = {}; if (fs.existsSync(OUT)) for (const f of fs.readdirSync(OUT)) if (f.endsWith('.json')) all[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); return all; };
const save = (k, v) => { fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, k + '.json'), JSON.stringify(v, null, 1) + '\n'); };

// ---------- checks on the lab itself, so that a broken test cannot pass as a finding ----------
function check() {
  console.log('\nCHECKS ON THE LAB ITSELF');
  const seeds = [1, 2, 3, 4, 5, 6], runs = seeds.map((s) => trial(PLAIN, 'meadow', s)), old = seeds.slice(0, 3).map((s) => trial(PLAIN, 'meadow', s, { hungryHunters: true }));
  const sc = runs.map((x) => x.score), sd = Math.sqrt(mean(sc.map((x) => (x - mean(sc)) ** 2)));
  const blind = mean(seeds.slice(0, 3).map((s) => trial({ ...PLAIN, eyes: 'none' }, 'meadow', s).score)), safe = mean(seeds.slice(0, 3).map((s) => trial(PLAIN, 'meadow', s, { noHunters: true }).score));
  const line = (ok, text) => console.log(`  ${ok ? 'pass' : 'FAIL'}  ${text}`);
  line(mean(runs.map((x) => x.hunters)) > 0.99, `hunters are present for the whole run (${(100 * mean(runs.map((x) => x.hunters))).toFixed(0)}% of hunter-beats; with hunters that can starve, as in the earlier audits, ${(100 * mean(old.map((x) => x.hunters))).toFixed(0)}%)`);
  line(mean(sc) > 0.2 && safe > mean(sc) * 1.15, `the plain design is neither wiped out nor untroubled, so better and worse designs can both show (${mean(sc).toFixed(2)})`);
  const spiky = seeds.slice(0, 3).map((s) => trial({ ...PLAIN, spikes: 'all', threat: 'ignore' }, 'meadow', s));
  line(mean(spiky.map((x) => x.slain)) > 0 && mean(spiky.map((x) => x.hunters)) > 0.9, `a design that kills hunters still faces hunters: against a spiked design ${mean(spiky.map((x) => x.slain)).toFixed(1)} hunters die a run and are replaced, and hunters are present ${(100 * mean(spiky.map((x) => x.hunters))).toFixed(0)}% of the time`);
  line(mean(runs.map((x) => x.kills)) > 3, `hunters catch something (${mean(runs.map((x) => x.kills)).toFixed(1)} kills a run)`);
  line(safe > mean(sc) + sd, `removing the hunters helps the plain design (${mean(sc).toFixed(2)} with, ${safe.toFixed(2)} without)`);
  line(blind < mean(sc) - sd, `a design with no eyes and no nose does worse than the plain one (${blind.toFixed(2)} against ${mean(sc).toFixed(2)})`);
  console.log(`  note  the same design on six different maps scores ${mean(sc).toFixed(2)} give or take ${sd.toFixed(2)}; differences smaller than about ${(2 * sd / Math.sqrt(3)).toFixed(2)} between three-map averages mean nothing`);
  const t0 = Date.now(); trial(PLAIN, 'meadow', 9); console.log(`  note  one trial takes ${((Date.now() - t0) / 1000).toFixed(2)} s`);
}

// ---------- the report: who wins where, and which options are always or never chosen ----------
function report() {
  const res = load(), have = HABITATS.filter((h) => res[h]); if (!have.length) return console.log('No search results yet. Run: node design/checks/balancelab.js search <habitat>');
  const fresh = [101, 102, 103, 104, 105];
  console.log(`\nBALANCE REPORT  (budget ${BUDGET}; each design lives in a habitat with scarce food and three hunters; score = total life, where 1 is twelve plain animals alive throughout)`);
  console.log('\n1. The best design the search found in each habitat');
  for (const h of have) console.log(`  ${h.padEnd(9)} ${res[h].top[0].s.toFixed(2)} (plain design ${res[h].plain.toFixed(2)}; ${res[h].tried} designs tried)  ${label(res[h].top[0].g)}`);
  console.log('\n2. Each winner in every habitat, on maps it has not seen  (rows: winner of; columns: tested in)');
  console.log('  ' + ''.padEnd(10) + have.map((h) => h.padStart(9)).join('') + '     mean');
  const table = {}; for (const h of have) { table[h] = have.map((t) => score(res[h].top[0].g, t, fresh)); console.log('  ' + h.padEnd(10) + table[h].map((x) => x.toFixed(2).padStart(9)).join('') + mean(table[h]).toFixed(2).padStart(9)); }
  table.plain = have.map((t) => score(PLAIN, t, fresh)); console.log('  ' + 'plain'.padEnd(10) + table.plain.map((x) => x.toFixed(2).padStart(9)).join('') + mean(table.plain).toFixed(2).padStart(9));
  const best = have.map((_, i) => have.reduce((a, b) => (table[b][i] > table[a][i] ? b : a))); console.log('  ' + 'best here'.padEnd(10) + best.map((x) => x.padStart(9)).join(''));
  const TOL = 0.15, peak = have.map((_, i) => Math.max(...have.map((h) => table[h][i]))), close = (h) => have.filter((_, i) => table[h][i] >= peak[i] - TOL).length;
  const homeWins = have.filter((h, i) => table[h][i] >= peak[i] - TOL).length, top = have.reduce((a, b) => (close(b) > close(a) ? b : a));
  console.log('  ' + 'hunters killed by each winner at home, a run: ' + have.map((h) => `${h} ${mean(fresh.map((s) => trial(res[h].top[0].g, h, s).slain)).toFixed(1)}`).join(', '));
  console.log('\n3. How often each option is chosen  (winners: in how many of the habitat winners; top five: share of the five best designs across all habitats)');
  const flags = [];
  for (const [k, vals] of Object.entries(GENES)) { const cells = vals.map((v) => { const w = have.filter((h) => res[h].top[0].g[k] === v).length, t5 = mean(have.flatMap((h) => res[h].top.map((x) => (x.g[k] === v ? 1 : 0))));
      if (w === have.length) flags.push(`"${k}: ${v}" is in every winner`); if (t5 === 0) flags.push(`"${k}: ${v}" is in none of the best designs anywhere`); return `${v} ${w}/${have.length} (${(100 * t5).toFixed(0)}%)`; });
    console.log('  ' + k.padEnd(10) + cells.join('   ')); }
  console.log('\n4. Sharing the food: each habitat\'s winner at home against each other winner as a visitor  (home score : visitor score)');
  let held = 0, fights = 0;
  for (const h of have) { const cells = have.filter((v) => v !== h).map((v) => { const r = [301, 302, 303].map((s) => trial(res[h].top[0].g, h, s, { versus: res[v].top[0].g })), a = mean(r.map((x) => x.score)), b = mean(r.map((x) => x.rival)); fights++; if (a >= b) held++; return `${v} ${a.toFixed(2)}:${b.toFixed(2)}`; });
    console.log('  ' + h.padEnd(10) + cells.join('   ')); }
  console.log('\n5. Verdicts');
  console.log(`  ${held >= fights * 0.8 ? 'pass' : 'FAIL'}  a habitat's winner holds its home against visiting winners: ${held} of ${fights}`);
  console.log(`  ${homeWins >= have.length - 1 ? 'pass' : 'FAIL'}  each habitat's own winner is the best there, or within ${TOL} of it, on new maps: ${homeWins} of ${have.length}`);
  console.log(`  ${close(top) <= have.length / 2 ? 'pass' : 'FAIL'}  no one design is as good as the best in most habitats: the strongest all-rounder (winner of ${top}) is within ${TOL} of the best in ${close(top)} of ${have.length}`);
  console.log(`  ${flags.length ? 'FAIL' : 'pass'}  no option is in every winner, and none is unused everywhere${flags.length ? ':' : ''}`); for (const f of flags) console.log('          ' + f);
}

// ---------- knockout: change one choice in a habitat's winner and see whether anything happens ----------
function knockout(habitat) {
  const res = load(); if (!res[habitat]) return console.log('Search that habitat first.'); const g = res[habitat].top[0].g, seeds = [201, 202, 203, 204], base = score(g, habitat, seeds), rows = [];
  for (const [k, vals] of Object.entries(GENES)) { const alts = vals.filter((v) => v !== g[k]).map((v) => ({ v, c: { ...g, [k]: v } })).filter((x) => price(x.c) <= BUDGET + 2).map((x) => ({ v: x.v, d: score(x.c, habitat, seeds) - base }));
    if (alts.length) rows.push({ k, has: g[k], worst: alts.reduce((a, b) => (b.d < a.d ? b : a)), best: alts.reduce((a, b) => (b.d > a.d ? b : a)) }); }
  save('knockout-' + habitat, { base: +base.toFixed(3), rows: rows.map((r) => ({ k: r.k, has: r.has, worst: [r.worst.v, +r.worst.d.toFixed(3)], best: [r.best.v, +r.best.d.toFixed(3)] })) });
  console.log(`\nKNOCKOUT in ${habitat}: the winner scores ${base.toFixed(2)} (${label(g)}). Each line changes one choice; the change is allowed up to 2 points over budget.`);
  for (const r of rows) console.log(`  ${r.k.padEnd(10)} has ${String(r.has).padEnd(22)} worst swap: ${String(r.worst.v).padEnd(22)} ${(r.worst.d >= 0 ? '+' : '') + r.worst.d.toFixed(2)}   best swap: ${String(r.best.v).padEnd(22)} ${(r.best.d >= 0 ? '+' : '') + r.best.d.toFixed(2)}`);
}

module.exports = { GENES, PLAIN, price, express, trial, score, search, label };
if (require.main === module) { const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'check') check();
  else if (cmd === 'search') { const t0 = Date.now(), r = search(arg); save(arg, r); console.log(`${arg}: best ${r.top[0].s} (plain ${r.plain}) after ${r.tried} designs in ${((Date.now() - t0) / 1000).toFixed(0)} s: ${label(r.top[0].g)}`); }
  else if (cmd === 'knockout') knockout(arg);
  else report(); }
