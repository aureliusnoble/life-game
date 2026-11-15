// Body audit for design/body.md. NOT the game's simulation.
// Asks of each physical characteristic: does it change what happens, and is it ever the wrong choice?
// Run: node design/checks/bodyaudit.js [scenario]
const { World, I, mean, row } = require('./verbaudit.js');

// A body is a shape, some outside parts and a split of the inside. Everything the world uses is worked out from those.
function build(s = {}) {
  const len = s.len ?? 1.2, wid = s.wid ?? 0.9, sc = s.scale ?? 1;
  const o = { gut: 0.25, fat: 0.25, muscle: 0.25, lungs: 0.25, ...(s.organs ?? {}) };
  const mass = Math.pow(len * wid * sc * sc, 1.5), size = sc * Math.sqrt(len * wid);
  const armour = { none: 0, back: 0.15, full: 0.35 }[s.shell ?? 'none'] + { none: 0, back: 0.05, all: 0.1 }[s.spikes ?? 'none'];
  const shape = Math.max(0.78, Math.min(1.15, 0.85 + 0.17 * (len / wid - 1)));            // long is fast, round is slow
  const move = { legs: [1, 0.35], fins: [0.25, 1], paddles: [0.72, 0.72], cilia: [0.5, 0.5] }[s.move ?? 'legs'];
  const eyes = { forward: [1.35, 120], side: [0.85, 300], stalk: [0.7, 360], none: [0, 0] }[s.eyes ?? 'side'];
  const b = {
    size, top: shape * (0.8 + 0.8 * o.muscle) * (1 - 0.6 * (o.fat - 0.25)) * Math.pow(sc, 0.15) * (1 - armour) * (s.radial ? 0.6 : 1), land: move[0], water: move[1],
    sight: 60 * (0.7 + 0.6 * (s.eyeSize ?? 0.5)) * eyes[0], arc: s.radial && s.eyes !== 'none' ? 360 : eyes[1],
    turn: s.radial ? undefined : (0.22 / (len * sc)) * ((s.move ?? 'legs') === 'legs' ? 1.2 : 1),   // long and big bodies turn slowly
    hp: Math.max(1, Math.round(2 * Math.pow(mass, 0.67) + (s.shell === 'full' ? 1 : 0))),
    upkeep: Math.pow(mass, 0.75) * (1 + 0.6 * (o.muscle - 0.25)) * (1 + 0.3 * armour),              // big bodies burn less per unit of mass
    store: mass * (0.6 + 1.6 * o.fat), mealGain: 0.3 * (0.6 + 1.6 * o.gut), stam: 0.5 + 2 * o.lungs,
    feel: s.sideLine ? 30 : 0, silent: s.move === 'cilia', noSprint: !!s.radial || s.move === 'cilia',
    shell: { back: 200, full: 360 }[s.shell], spikes: { back: 200, all: 360 }[s.spikes], camo: s.camo ? 0.25 : undefined, falseEyes: !!s.falseEyes,
  };
  if (s.weapon === 'jaws') { b.gape = size * 0.9; b.biteArc = s.radial ? undefined : 100; }
  if (s.weapon === 'tongue') { b.gape = size * 0.6; b.reach = 14; b.biteArc = 120; }
  if (s.weapon === 'stinger') { b.biteDir = 'rear'; b.biteArc = 140; }
  return b;
}
const cost = (s) => 3 * (s.scale ?? 1) ** 2 + { forward: 2, side: 2, stalk: 3, none: 0 }[s.eyes ?? 'side'] + ((s.eyeSize ?? 0.5) > 0.7 ? 1 : 0) + { legs: 2, fins: 2, paddles: 3, cilia: 1 }[s.move ?? 'legs']
  + { none: 0, back: 3, full: 5 }[s.shell ?? 'none'] + { none: 0, back: 2, all: 3 }[s.spikes ?? 'none'] + ({ jaws: 2, stinger: 3, tongue: 3 }[s.weapon] ?? 0) + (s.camo ? 2 : 0) + (s.sideLine ? 2 : 0) + (s.falseEyes ? 1 : 0);

// Shared behaviour, so that only the body differs between the designs being compared.
const SCARED = { Scared: { lingers: 'a while' } };
const flee = [I('see bigger creature', 'raise Scared', { speed: 'quickly' }), I('near bigger creature', 'move away', { str: 'strong', pace: 'sprint' }), I('far bigger creature', 'move away', { str: 'strong' }), I('always', 'wander', { str: 'strong', in: ['Scared'] })];
const graze = [I('see plant', 'approach'), I('touch plant', 'bite'), I('always', 'wander', { str: 'weak' })];
const bite = I('touch smaller creature', 'bite'), amble = I('always', 'wander', { str: 'weak' });
const HUNT = {
  chaser: [I('near smaller creature', 'approach', { str: 'strong', pace: 'sprint' }), I('far smaller creature', 'approach', { str: 'strong' }), bite, amble],
  flanker: [I('near smaller creature', 'head off', { str: 'strong', pace: 'sprint' }), I('far smaller creature', 'head off', { str: 'strong' }), bite, amble],
  stalker: [I('near smaller creature', 'approach', { str: 'strong', pace: 'creep' }), I('far smaller creature facing away', 'approach', { str: 'strong' }), I('see smaller creature facing me', 'circle', { str: 'strong' }), I('see smaller creature facing me', 'keep apart', { str: 'strong', dist: 'far' }), bite],
  feeler: [I('feel movement', 'approach', { str: 'strong' }), bite, I('always', 'wander')],
};
const hunterBody = { len: 1.5, wid: 1.0, scale: 1.25, eyes: 'forward', weapon: 'jaws' };
const hunter = (kind, extra = {}) => kind === 'feeler' ? { ...build({ ...hunterBody, eyes: 'none', sideLine: true }), feel: 45, ...extra, instincts: HUNT.feeler } : { ...build(hunterBody), ...extra, instincts: HUNT[kind] };
const prey = (spec, instincts, moods = SCARED) => ({ ...build(spec), moods, instincts });
function field(size, seed, { torus = true, plants = 0, regrow = 0, starve = false } = {}) { const w = new World(size, seed, torus); w.starve = starve; w.regrow = regrow; w.cap = plants; for (let i = 0; i < plants; i++) w.plants.push({ x: w.rnd() * size, y: w.rnd() * size }); return w; }
function run(w, beats) { while (w.t < beats) { w.step(); if (w.plants.length < w.cap && w.rnd() < w.regrow) w.plants.push({ x: w.rnd() * w.size, y: w.rnd() * w.size }); } }
const lostOf = (w, kind) => w.creatures.filter((c) => c.kind === kind && !c.alive).length;
const mealsOf = (w, kind) => mean(w.creatures.filter((c) => c.kind === kind).map((c) => c.meals));

// 1. Where the eyes sit. Forward eyes see far in a narrow arc; side eyes see nearly all round but not far; stalks see all round, shorter still.
function eyes() {
  console.log('\n1. WHERE THE EYES SIT  (60 runs each)');
  for (const e of ['forward', 'side', 'stalk']) { let caught = 0; const beats = []; const kills = [];
    for (let seed = 1; seed <= 60; seed++) { // as prey, against a stalker
      const w = field(300, seed); const a = w.rnd() * Math.PI * 2; w.add('prey', prey({ eyes: e }, [...flee, amble]), { x: 150, y: 150 }); w.add('hunter', { ...hunter('stalker'), sight: 110 }, { x: 150 + Math.cos(a) * 80, y: 150 + Math.sin(a) * 80 });
      while (w.t < 2500 && !w.log.kills.length) w.step(); if (w.log.kills.length) caught++; beats.push(w.t); }
    for (let seed = 1; seed <= 60; seed++) { // as a hunter, among scattered prey
      const w = field(420, seed); for (let i = 0; i < 8; i++) w.add('prey', prey({}, [...flee, amble])); w.add('hunter', { ...build({ ...hunterBody, eyes: e }), instincts: HUNT.chaser }); run(w, 3000); kills.push(w.log.kills.length); }
    const b = build({ eyes: e }); row(`${e} eyes (sees ${b.sight.toFixed(0)} across ${b.arc} degrees)`, `as prey: caught by a stalker ${String(caught).padStart(2)}/60, lasting ${mean(beats).toFixed(0)} beats`, `as a hunter: ${mean(kills).toFixed(1)} of 8 caught`); }
}

// 2. Body shape. A long body is fast and turns slowly; a round one is slow and turns sharply.
function shape() {
  const bodies = { 'long hunter': { ...hunterBody, len: 1.9, wid: 0.75 }, 'round hunter': { ...hunterBody, len: 1.0, wid: 1.15 } };
  const preys = { 'prey that runs straight': [...flee, amble], 'prey that swerves when it closes in': [I('near bigger creature coming at me', 'circle', { str: 'strong', pace: 'sprint' }), ...flee, amble] };
  console.log('\n2. BODY SHAPE  (1 hunter, 6 prey that see all round, open wrapped plain, 3000 beats, 40 runs)');
  for (const [hn, hs] of Object.entries(bodies)) for (const [pn, ins] of Object.entries(preys)) { const kills = []; const hb = build(hs);
    for (let seed = 1; seed <= 40; seed++) { const w = field(300, seed); for (let i = 0; i < 6; i++) w.add('prey', prey({ eyes: 'stalk', eyeSize: 1 }, ins)); w.add('hunter', { ...hb, instincts: HUNT.chaser }); run(w, 3000); kills.push(w.log.kills.length); }
    row(`${hn} (speed ${hb.top.toFixed(2)}, turns ${(hb.turn * 57.3).toFixed(0)} degrees a beat) against ${pn}`, `${mean(kills).toFixed(1)} of 6 caught`); }
}

// 3. Size. A big body needs more food and holds more; hunters can only take what is smaller than they are.
function size() {
  console.log('\n3. SIZE  (6 grazers of one size, 30 runs)');
  for (const [name, sc] of [['small', 0.7], ['medium', 1.0], ['big', 1.5]]) { const b = build({ scale: sc }); const out = [];
    for (const [plants, regrow] of [[40, 0.1], [30, 0.015]]) { const alive = [];
      for (let seed = 1; seed <= 30; seed++) { const w = field(260, seed, { plants, regrow, starve: true }); for (let i = 0; i < 6; i++) w.add('g', prey({ scale: sc }, [I('see plant', 'approach', { in: ['hungry'] }), I('touch plant', 'bite'), amble])); run(w, 6000); alive.push(6 - lostOf(w, 'g')); }
      out.push(mean(alive).toFixed(1)); }
    const lost = []; for (let seed = 1; seed <= 30; seed++) { const w = field(260, seed, { plants: 30, regrow: 0.05 }); for (let i = 0; i < 6; i++) w.add('g', prey({ scale: sc }, [...flee, ...graze])); for (let i = 0; i < 2; i++) w.add('hunter', hunter('chaser')); run(w, 3000); lost.push(lostOf(w, 'g')); }
    row(`${name} (needs ${b.upkeep.toFixed(2)}x the food, ${b.hp} hit points)`, `alive after 6000 beats with plenty of food ${out[0]} of 6`, `with little food ${out[1]} of 6`, `lost to 2 hunters ${mean(lost).toFixed(1)} of 6`); }
}

// 4. Shell. A back shell stops bites from behind; a full shell stops them all; both slow the wearer.
function shell() {
  console.log('\n4. SHELL  (6 grazers, 2 hunters, 3000 beats, 40 runs)');
  for (const sh of ['none', 'back', 'full']) for (const hk of ['chaser', 'flanker', 'cracker']) { const lost = [], meals = [], blocked = []; const b = build({ shell: sh });
    for (let seed = 1; seed <= 40; seed++) { const w = field(260, seed, { plants: 30, regrow: 0.05 }); for (let i = 0; i < 6; i++) w.add('g', prey({ shell: sh }, [...flee, ...graze])); for (let i = 0; i < 2; i++) w.add('hunter', hk === 'cracker' ? hunter('chaser', { crack: true }) : hunter(hk)); run(w, 3000); lost.push(lostOf(w, 'g')); meals.push(mealsOf(w, 'g')); blocked.push(w.log.blocked ?? 0); }
    row(`${sh} shell (speed ${b.top.toFixed(2)}) against ${hk === 'chaser' ? 'hunters that chase' : hk === 'flanker' ? 'hunters that head it off' : 'hunters with shell-cracking beaks'}`, `lost ${mean(lost).toFixed(1)} of 6`, `bites stopped ${mean(blocked).toFixed(0)}`, `meals each ${mean(meals).toFixed(1)}`); }
}

// 5. Spikes. Whoever bites into spikes is hurt.
function spikes() {
  console.log('\n5. SPIKES  (6 grazers, 2 hunters that chase, 3000 beats, 40 runs)');
  for (const sp of ['none', 'back', 'all']) { const lost = [], hl = [];
    for (let seed = 1; seed <= 40; seed++) { const w = field(260, seed, { plants: 30, regrow: 0.05 }); for (let i = 0; i < 6; i++) w.add('g', prey({ spikes: sp }, [...flee, ...graze])); for (let i = 0; i < 2; i++) w.add('hunter', hunter('chaser')); run(w, 3000); lost.push(lostOf(w, 'g')); hl.push(lostOf(w, 'hunter')); }
    row(`${sp} spikes`, `grazers lost ${mean(lost).toFixed(1)} of 6`, `hunters lost ${mean(hl).toFixed(1)} of 2`); }
}

// 6. Legs, fins or paddles. The food is in a pond, and so is a hunter that cannot follow onto land.
function amphibious() {
  console.log('\n6. LEGS, FINS OR PADDLES  (6 grazers, food only in a pond, 2 finned hunters in it, 4000 beats, 40 runs)');
  for (const mv of ['legs', 'fins', 'paddles']) { const lost = [], meals = [];
    for (let seed = 1; seed <= 40; seed++) { const w = new World(280, seed); w.pond = { x: 140, y: 140, r: 78 };
      const grow = () => { const a = w.rnd() * Math.PI * 2, r = Math.sqrt(w.rnd()) * 70; w.plants.push({ x: 140 + Math.cos(a) * r, y: 140 + Math.sin(a) * r }); }; for (let i = 0; i < 25; i++) grow();
      for (let i = 0; i < 6; i++) { const a = w.rnd() * Math.PI * 2; w.add('g', prey({ move: mv }, [I('see land', 'approach', { str: 'strong', pace: 'sprint', in: ['Scared'] }), ...flee, ...graze]), { x: 140 + Math.cos(a) * 95, y: 140 + Math.sin(a) * 95 }); }
      for (let i = 0; i < 2; i++) w.add('hunter', { ...build({ ...hunterBody, move: 'fins' }), instincts: HUNT.chaser }, { x: 130 + i * 20, y: 140 });
      while (w.t < 4000) { w.step(); if (w.plants.length < 25 && w.rnd() < 0.06) grow(); } lost.push(lostOf(w, 'g')); meals.push(mealsOf(w, 'g')); }
    const b = build({ move: mv }); row(`${mv} (${(b.land * 100).toFixed(0)}% speed on land, ${(b.water * 100).toFixed(0)}% in water)`, `lost ${mean(lost).toFixed(1)} of 6`, `meals each ${mean(meals).toFixed(1)}`); }
}

// 7. What fills the inside. More gut gets more from each meal, more fat stores more, more muscle is faster and hungrier.
function organs() {
  const kinds = { 'mostly gut': { gut: 0.55, fat: 0.15, muscle: 0.15, lungs: 0.15 }, 'mostly fat': { gut: 0.15, fat: 0.55, muscle: 0.15, lungs: 0.15 }, 'mostly muscle': { gut: 0.15, fat: 0.15, muscle: 0.55, lungs: 0.15 }, 'even split': {} };
  console.log('\n7. WHAT FILLS THE INSIDE  (5 grazers of each kind competing for the same food, 7000 beats, 30 runs)');
  for (const [wn, pulse] of [['food arrives steadily', false], ['food arrives in bursts with long gaps', true]]) { const alive = {}, meals = {}; for (const k of Object.keys(kinds)) { alive[k] = []; meals[k] = []; }
    for (let seed = 1; seed <= 30; seed++) { const w = field(300, seed, { starve: true }); for (const [k, o] of Object.entries(kinds)) for (let i = 0; i < 5; i++) w.add(k, prey({ organs: o }, [I('see plant', 'approach', { str: 'strong', in: ['hungry'] }), I('touch plant', 'bite'), I('always', 'wander')]));
      while (w.t < 7000) { w.step(); if (pulse) { if (w.t % 900 === 1) for (let i = 0; i < 70; i++) w.plants.push({ x: w.rnd() * 300, y: w.rnd() * 300 }); } else if (w.plants.length < 40 && w.rnd() < 0.085) w.plants.push({ x: w.rnd() * 300, y: w.rnd() * 300 }); }
      for (const k of Object.keys(kinds)) { alive[k].push(5 - lostOf(w, k)); meals[k].push(mealsOf(w, k)); } }
    for (const k of Object.keys(kinds)) row(`${wn}: ${k}`, `alive ${mean(alive[k]).toFixed(1)} of 5`, `meals each ${mean(meals[k]).toFixed(1)}`); }
}

// 8. Camouflage. A still, camouflaged creature is seen only from close by.
function camouflage() {
  const designs = { 'runs': [{}, [...flee, amble]], 'holds still': [{}, [I('see bigger creature', 'hold still', { str: 'strong' }), amble]], 'camouflaged, holds still': [{ camo: true }, [I('see bigger creature', 'hold still', { str: 'strong' }), amble]], 'camouflaged, runs': [{ camo: true }, [...flee, amble]], 'strongly camouflaged, holds still': [{ camo: true, strong: true }, [I('see bigger creature', 'hold still', { str: 'strong' }), amble]] };
  console.log('\n8. CAMOUFLAGE  (6 prey, 2 hunters, 3000 beats, 40 runs)');
  for (const hk of ['chaser', 'feeler']) for (const [name, [spec, ins]] of Object.entries(designs)) { const lost = [];
    for (let seed = 1; seed <= 40; seed++) { const w = field(260, seed); for (let i = 0; i < 6; i++) w.add('g', { ...prey(spec, ins), ...(spec.strong ? { camo: 0.08 } : {}) }); for (let i = 0; i < 2; i++) w.add('hunter', hunter(hk)); run(w, 3000); lost.push(lostOf(w, 'g')); }
    row(`${hk === 'chaser' ? 'hunters that see' : 'hunters that feel movement'}: prey ${name}`, `lost ${mean(lost).toFixed(1)} of 6`); }
}

// 9. Silent movement. A skirt of cilia is slow but cannot be felt.
function silent() {
  console.log('\n9. SILENT MOVEMENT  (6 prey, 2 hunters, 3000 beats, 40 runs)');
  for (const hk of ['chaser', 'feeler']) for (const mv of ['legs', 'cilia']) { const lost = [], meals = []; const b = build({ move: mv });
    for (let seed = 1; seed <= 40; seed++) { const w = field(260, seed, { plants: 30, regrow: 0.05 }); for (let i = 0; i < 6; i++) w.add('g', prey({ move: mv }, [...flee, ...graze])); for (let i = 0; i < 2; i++) w.add('hunter', hunter(hk)); run(w, 3000); lost.push(lostOf(w, 'g')); meals.push(mealsOf(w, 'g')); }
    row(`${hk === 'chaser' ? 'hunters that see' : 'hunters that feel movement'}: prey on ${mv} (speed ${(b.top * b.land).toFixed(2)})`, `lost ${mean(lost).toFixed(1)} of 6`, `meals each ${mean(meals).toFixed(1)}`); }
}

// 10. A long tongue. It bites from a distance, so a hunter can wait instead of chase.
function tongue() {
  const fast = prey({ organs: { muscle: 0.5, lungs: 0.3, gut: 0.1, fat: 0.1 } }, [...flee, I('always', 'wander')]);
  const wait = [I('always', 'hold still', { str: 'strong' }), bite];
  const designs = { 'jaws, chasing': { ...build(hunterBody), instincts: HUNT.chaser }, 'jaws, waiting camouflaged': { ...build({ ...hunterBody, camo: true }), instincts: wait }, 'tongue, waiting camouflaged': { ...build({ ...hunterBody, camo: true, weapon: 'tongue' }), gape: 9, instincts: wait }, 'tongue, waiting in plain sight': { ...build({ ...hunterBody, weapon: 'tongue' }), gape: 9, instincts: wait } };
  console.log(`\n10. A LONG TONGUE  (1 hunter, 10 prey faster than it (${fast.top.toFixed(2)} against ${build(hunterBody).top.toFixed(2)}), 5000 beats, 40 runs)`);
  for (const [name, hb] of Object.entries(designs)) { const kills = [];
    for (let seed = 1; seed <= 40; seed++) { const w = field(220, seed); for (let i = 0; i < 10; i++) w.add('g', fast); w.add('hunter', hb); run(w, 5000); kills.push(w.log.kills.length); }
    row(name, `${mean(kills).toFixed(1)} of 10 caught`); }
}

// 11. False eyes. A stalker that waits for its prey to face away never gets the chance.
function falseEyes() {
  console.log('\n11. FALSE EYES  (1 hunter starting 80 away, 1 prey with forward eyes, 2500 beats, 60 runs)');
  for (const hk of ['stalker', 'chaser']) for (const fe of [false, true]) { let caught = 0;
    for (let seed = 1; seed <= 60; seed++) { const w = field(300, seed); const a = w.rnd() * Math.PI * 2; w.add('prey', prey({ eyes: 'forward', falseEyes: fe }, [...flee, amble]), { x: 150, y: 150 }); w.add('hunter', { ...hunter(hk), sight: 110 }, { x: 150 + Math.cos(a) * 80, y: 150 + Math.sin(a) * 80 });
      while (w.t < 2500 && !w.log.kills.length) w.step(); if (w.log.kills.length) caught++; }
    row(`${hk}: prey ${fe ? 'with false eyes' : 'without'}`, `caught ${String(caught).padStart(2)}/60`); }
}

// 12. A sting in the tail. It strikes what is behind, which is where a chaser is.
function stinger() {
  console.log('\n12. A STING IN THE TAIL  (6 prey, 2 hunters, 3000 beats, 40 runs)');
  for (const hk of ['chaser', 'flanker']) for (const [wn, wp] of [['no weapon', null], ['jaws at the front', 'jaws'], ['a sting at the back', 'stinger']]) { const lost = [], hl = [];
    for (let seed = 1; seed <= 40; seed++) { const w = field(260, seed); for (let i = 0; i < 6; i++) w.add('g', { ...prey(wp ? { weapon: wp } : {}, [...(wp ? [I('touch bigger creature', 'bite')] : []), ...flee, amble]), gape: 9 }); for (let i = 0; i < 2; i++) w.add('hunter', hunter(hk)); run(w, 3000); lost.push(lostOf(w, 'g')); hl.push(lostOf(w, 'hunter')); }
    row(`${hk === 'chaser' ? 'hunters that chase' : 'hunters that head it off'}: prey with ${wn}`, `prey lost ${mean(lost).toFixed(1)} of 6`, `hunters lost ${mean(hl).toFixed(1)} of 2`); }
}

// 13. A body with no front. It sees and bites all round, and is slow.
function radial() {
  const attackers = [I('see bigger creature facing me', 'circle', { str: 'strong' }), I('see bigger creature facing me', 'stay near', { dist: 'close' }), I('see bigger creature facing away', 'approach', { str: 'strong' }), I('see bigger creature', 'approach', { str: 'weak' }), I('touch bigger creature', 'bite')];
  console.log('\n13. A BODY WITH NO FRONT  (5 small attackers with 2 hit points against one big animal, 2500 beats, 60 runs)');
  for (const rad of [false, true]) { let kills = 0; const lost = []; const b = build({ scale: 1.6, weapon: 'jaws', radial: rad });
    for (let seed = 1; seed <= 60; seed++) { const w = new World(200, seed); const p = w.add('big', { ...b, gape: 9, arc: rad ? 360 : 200, instincts: [I('touch smaller creature', 'bite'), amble] }, { x: 100, y: 100 });
      for (let i = 0; i < 5; i++) w.add('pack', { size: 1, top: 1, sight: 200, hp: 2, instincts: attackers });
      while (w.t < 2500 && p.alive && w.creatures.some((c) => c.kind === 'pack' && c.alive)) w.step(); if (!p.alive) kills++; lost.push(lostOf(w, 'pack')); }
    row(`${rad ? 'no front' : 'front and back'} (speed ${b.top.toFixed(2)}, ${b.hp} hit points)`, `killed ${String(kills).padStart(2)}/60`, `attackers lost ${mean(lost).toFixed(1)} of 5`); }
}

// 14. Whole builds against whole worlds: is any build best everywhere?
function builds() {
  const still = [I('see bigger creature', 'hold still', { str: 'strong' }), ...graze];
  const A = {
    sprinter: [{ len: 1.8, wid: 0.7, organs: { muscle: 0.45, lungs: 0.35, gut: 0.1, fat: 0.1 } }, [...flee, ...graze]],
    tank: [{ len: 1.1, wid: 1.1, shell: 'back', spikes: 'back' }, [...flee, ...graze]],
    ghost: [{ camo: true }, still],
    tiptoe: [{ move: 'cilia', sideLine: true }, [I('feel movement', 'move away', { str: 'strong' }), ...flee, ...graze]],
    lookout: [{ eyes: 'stalk', eyeSize: 1 }, [...flee, ...graze]],
    stinger: [{ weapon: 'stinger' }, [I('touch bigger creature', 'bite'), ...flee, ...graze]],
    giant: [{ scale: 1.5 }, [...flee, ...graze]],
    mite: [{ scale: 0.7 }, [...flee, ...graze]],
  };
  const worlds = { 'chasers': ['chaser', 0.25], 'flankers': ['flanker', 0.25], 'stalkers': ['stalker', 0.25], 'feelers': ['feeler', 0.25], 'little food': [null, 0.02] };
  console.log('\n14. WHOLE BUILDS AGAINST WHOLE WORLDS  (6 of one build, 2 hunters or none, starvation on, 4000 beats, 12 runs)  survivors of 6');
  console.log('  ' + 'build (cost)'.padEnd(18) + Object.keys(worlds).map((k) => k.padStart(12)).join(''));
  for (const [name, [spec, ins]] of Object.entries(A)) { const cells = [];
    for (const [hk, regrow] of Object.values(worlds)) { const alive = [];
      for (let seed = 1; seed <= 12; seed++) { const w = field(260, seed, { plants: 45, regrow, starve: true }); for (let i = 0; i < 6; i++) w.add('g', prey(spec, ins)); if (hk) for (let i = 0; i < 2; i++) w.add('hunter', hunter(hk)); run(w, 4000); alive.push(6 - lostOf(w, 'g')); }
      cells.push(mean(alive).toFixed(1).padStart(12)); }
    console.log('  ' + `${name} (${cost(spec).toFixed(0)})`.padEnd(18) + cells.join('')); }
}

module.exports = { build, cost, hunter, prey, flee, graze, SCARED, HUNT, hunterBody };
if (require.main === module) { const only = process.argv[2]; for (const f of [eyes, shape, size, shell, spikes, amphibious, organs, camouflage, silent, tongue, falseEyes, stinger, radial, builds]) if (!only || f.name === only) f(); }
