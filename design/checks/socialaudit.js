// Social audit for design/social.md. NOT the game's simulation.
// Direction checks only: does a social block do anything at all, and in the direction the design says?
// Run: node design/checks/socialaudit.js [scenario]
const { World, I, mean, row } = require('./verbaudit.js');
const { build, flee, graze, SCARED, HUNT, hunterBody } = require('./bodyaudit.js');
const { live, count } = require('./envaudit.js');

// 1. A sentinel by signal. The setup is the earlier vigilance test: eight short-sighted grazers that are slower than the two hunters,
//    with long meals during which they see nothing. A call carries farther than they can see. Lost grazers are replaced, so the
//    pressure is the same throughout. The lab checks itself first: with no hunters, nothing is lost.
function sentinel() {
  const hunter = { size: 1.5, top: 1, sight: 90, instincts: [I('near smaller creature', 'approach', { str: 'strong', pace: 'sprint' }), I('far smaller creature eating', 'approach', { str: 'strong' }), I('touch smaller creature', 'bite'), I('always', 'wander', { str: 'weak' })] };
  const SC = { Scared: { lingers: 'briefly' } };
  const run = [I('see bigger creature', 'raise Scared', { speed: 'quickly' }), I('see bigger creature', 'move away', { str: 'strong', pace: 'sprint' }), I('see cover', 'approach', { str: 'strong', pace: 'sprint', in: ['Scared'] }), I('always', 'hold still', { str: 'strong', in: ['Scared', 'covered'] })];
  const herd = [I('see my kind', 'stay near', { dist: 'close', str: 'weak' })], eat = (not) => [I('see plant', 'approach', { notIn: not }), I('touch plant', 'bite', { notIn: not }), I('always', 'wander', { str: 'weak' })];
  const alarm = [I('see bigger creature', 'call Alarm'), I('hear Alarm', 'raise Scared', { speed: 'quickly' })];
  const watch = [I('sometimes', 'raise Watch', { notIn: ['see my kind showing Watch'] }), I('always', 'show Watch', { in: ['Watch'] }), I('always', 'hold still', { str: 'strong', in: ['Watch'], notIn: ['Scared'] })];
  const designs = {
    'each for itself': { moods: SC, instincts: [...run, ...herd, ...eat(['Scared'])] },
    'anyone who sees a hunter calls': { moods: SC, instincts: [...alarm, ...run, ...herd, ...eat(['Scared'])] },
    'calls, and a sentinel by signal': { moods: { ...SC, Watch: { lingers: 'a while' } }, instincts: [...watch, ...alarm, ...run, ...herd, ...eat(['Watch', 'Scared'])] },
  };
  console.log('\n1. A SENTINEL BY SIGNAL  (8 short-sighted grazers with long meals, 2 faster hunters, losses replaced, 4000 beats, 20 runs)');
  const trial = (d, seed, hunters = 2, burrows = 0) => { const w = new World(260, seed, true); w.headDownBeats = 30; let lostN = 0, one = 0, any = 0, n = 0, al = 0;
    for (let i = 0; i < burrows; i++) w.covers.push({ x: w.rnd() * 260, y: w.rnd() * 260, r: 14 });
    for (let i = 0; i < 90; i++) w.plants.push({ x: w.rnd() * 260, y: w.rnd() * 260 });
    const brain = { size: 0.6, top: 0.8, sight: 45, ...d }, gs = []; for (let i = 0; i < hunters; i++) w.add('hunter', hunter); for (let i = 0; i < 8; i++) gs.push(w.add('g', brain));
    while (w.t < 4000) { w.step(); if (w.plants.length < 90 && w.rnd() < 0.5) w.plants.push({ x: w.rnd() * 260, y: w.rnd() * 260 });
      gs.forEach((c, i) => { if (!c.alive) { lostN++; gs[i] = w.add('g', brain); } });
      if (w.t % 10 === 0) { const k = gs.filter((c) => c.shown === 'Watch').length; n++; if (k === 1) one++; if (k >= 1) any++; if (gs.some((c) => c.called === 'Alarm')) al++; }
      if (w.t % 100 === 0) w.creatures = w.creatures.filter((c) => c.alive); }
    return { lost: lostN, meals: w.log.meals / 8, one: one / n, any: any / n, alarm: al / n }; };
  const calm = [1, 2, 3].map((s) => trial(designs['each for itself'], s, 0).lost); console.log(`  ${mean(calm) === 0 ? 'pass' : 'FAIL'}  with no hunters nothing is lost (${mean(calm).toFixed(1)})`);
  for (const [burrows, label] of [[0, 'open ground'], [10, 'ground with burrows']]) for (const [name0, d] of Object.entries(designs)) { const r = [], name = label + ': ' + name0; for (let seed = 1; seed <= 20; seed++) r.push(trial(d, seed, 2, burrows));
    const sd = (xs) => Math.sqrt(mean(xs.map((x) => (x - mean(xs)) ** 2)) / xs.length);
    row(name, `give or take ${sd(r.map((x) => x.lost)).toFixed(1)}`, `lost ${mean(r.map((x) => x.lost)).toFixed(1)}`, `meals each ${mean(r.map((x) => x.meals)).toFixed(1)}`, `someone on watch ${(100 * mean(r.map((x) => x.any))).toFixed(0)}% of the time, exactly one ${(100 * mean(r.map((x) => x.one))).toFixed(0)}%`, `an alarm sounding ${(100 * mean(r.map((x) => x.alarm))).toFixed(0)}% of the time`); }
}

// 2. Two homes of one species, and three stances toward the other home. Food regrows from what is standing, so it can be overgrazed.
function homes() {
  const eat = [I('see plant', 'approach', { str: 'strong', in: ['hungry'] }), I('touch plant', 'bite'), I('see home', 'stay near', { dist: 'far', str: 'weak' }), I('always', 'wander')];
  const stances = { 'friends: no notice taken': [], 'avoid: keep apart from the other home': [I('near other home', 'keep apart', { dist: 'far', str: 'strong' })],
    'enemies: attack the other home': [I('near other home', 'approach', { str: 'strong', pace: 'sprint' }), I('touch other home', 'bite')] };
  console.log('\n2. TWO HOMES OF ONE SPECIES  (6 breeding grazers at each of two homes, food that regrows from what stands, 12000 beats, 8 runs)');
  for (const [gap, label] of [[150, 'homes far apart'], [50, 'homes close together']]) for (const [name0, extra] of Object.entries(stances)) { const name = label + ', ' + name0; const end = [], low = [], fed = [], gone = [], fights = [], mixed = [];
    for (let seed = 1; seed <= 8; seed++) { const w = new World(300, seed, true); w.starve = true; const K = 80; let lowest = K, food = 0, n = 0, mix = 0, mixN = 0;
      const sow = () => w.plants.push({ x: w.rnd() * 300, y: w.rnd() * 300, type: 'grass' }); for (let i = 0; i < 60; i++) sow();
      const H = [{ x: 150 - gap / 2, y: 150 }, { x: 150 + gap / 2, y: 150 }], brain = { ...build({}), breedAt: 0.7, eggCost: 0.3, cap: 60, instincts: [...extra, ...eat] };
      H.forEach((h, k) => { for (let i = 0; i < 6; i++) { const c = w.add('g', brain, { x: h.x + (w.rnd() - 0.5) * 40, y: h.y + (w.rnd() - 0.5) * 40 }); c.home = k; c.homeAt = h; } });
      live(w, 12000, { cap: 60, grow: (w) => { const N = w.plants.length; if (w.rnd() < 0.012 + 0.006 * N * (1 - N / K)) sow();
        if (w.t % 100 === 0 && w.t > 500) { lowest = Math.min(lowest, N); food += N; n++; for (const c of w.creatures) if (c.alive) { mixN++; if (w.creatures.some((o) => o.alive && o.home !== c.home && w.off(c, o)[2] < 30)) mix++; } } } });
      end.push(count(w, 'g')); low.push(lowest); fed.push(food / n); gone.push(count(w, 'g') === 0 && !w.eggCount('g') ? 1 : 0); fights.push(w.log.kills.length); mixed.push(mixN ? mix / mixN : 0); }
    row(name, `at the end ${mean(end).toFixed(0)}`, `died out ${gone.reduce((a, b) => a + b, 0)}/8`, `food averaged ${mean(fed).toFixed(0)} of 80, fell to ${mean(low).toFixed(0)}`, `killed by their own kind ${mean(fights).toFixed(0)}`, `with a member of the other home close by ${(100 * mean(mixed)).toFixed(0)}% of the time`); }
}

if (require.main === module) { const only = process.argv[2]; for (const f of [sentinel, homes]) if (!only || f.name === only) f(); }
