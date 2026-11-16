// The mechanics pass, first question, for bodies: does every choice on the species sheet that means something matter?
// One test for each choice, or for each option where the options do different things. See harness.js for the four questions.
// Run: node design/checks/mechaudit.js body [id]
const H = require('./harness.js'), { World, I, spawn, step, run, sp, WANDER, hunter, prey, hunted, mean, plain } = H;
const T = [], test = (t) => T.push(t), pickOf = (which, a, b, n) => (which === 'with' ? a : which === 'without' ? b : n);
const TAU = Math.PI * 2;
// a hunt: `n` of one species spread round `hunters` of another; the count is how long the first live, in beats
function chase(seed, preySp, hunterSp, o = {}) { const w = new World(o.size || 260, seed, { light: o.light ?? 1, ground: o.ground, torus: o.torus ?? true }), mid = (o.size || 260) / 2; if (o.setup) o.setup(w, mid); const ps = [], hs = [];
  for (let i = 0; i < (o.n || 3); i++) { const a = w.rnd() * TAU, r = (o.gap || 45) * (0.8 + 0.4 * w.rnd()); ps.push(spawn(w, preySp, Object.assign({ x: mid + Math.cos(a) * r, y: mid + Math.sin(a) * r }, o.prey))); }
  for (let i = 0; i < (o.hunters ?? 1); i++) hs.push(spawn(w, hunterSp, Object.assign({ x: mid + i * 6, y: mid, energy: 0.9 }, o.hunter))); if (o.after) o.after(w, ps, hs);
  return { w, ps, hs, lived: hunted(w, ps, o.beats || 600) }; }
// a hunt seen from the hunter's side: the count is how many it kills
const kills = (seed, hunterSp, preySp, o = {}) => { const r = chase(seed, preySp, hunterSp, Object.assign({ n: 5, beats: 700 }, o)); return r.ps.filter((c) => !c.alive).length; };
// feeding: one animal and some food; the count is bites eaten
function feed(seed, species, o = {}) { const w = new World(o.size || 200, seed, { light: o.light ?? 1, ground: o.ground }), mid = (o.size || 200) / 2; if (o.setup) o.setup(w, mid); const c = spawn(w, species, Object.assign({ x: mid, y: mid, energy: 0.4 }, o.at));
  for (let i = 0; i < (o.food ?? 12); i++) { const a = w.rnd() * TAU, r = (o.spread || 60) * Math.sqrt(w.rnd()); w.item(o.kind || 'plant', mid + Math.cos(a) * r, mid + Math.sin(a) * r, Object.assign({}, o.item)); } run(w, o.beats || 500); return o.count ? o.count(w, c) : c.meals; }
const grazer = (sheet, extra = [], o = {}) => sp('Grazer', sheet, [...extra, I((o.reach || 'smell') + ' plant', 'approach'), I('touch plant', 'bite'), WANDER]);
// a hunter that gives up for a while when it is hurt, as a real one would
const wary = (sheet = {}, extra = []) => sp('Hunter', Object.assign({ size: 1.35, mouth: 'jaws', eyes: 'forward', muscle: 0.4 }, sheet), [...extra, I('just bitten', 'raise wary', { speed: 'quickly' }), I('see smaller creature', 'approach', { pace: 'sprint', not: ['wary'] }), I('touch smaller creature', 'bite', { str: 'strong', not: ['wary'] }), WANDER], { moods: { wary: { lingers: 'a long time' } } });
const breeders = (sheet, o = {}) => sp('Pair', sheet, [I('see my kind', 'approach', { only: ['fertile'] }), I('touch my kind', 'mate', { only: ['fertile'] }), I('am gravid', 'lay'), I('smell plant', 'approach', { only: ['a little hungry'] }), I('touch plant', 'bite'), WANDER], { species: Object.assign({ grown: 150 }, o) });
function brood(seed, species, o = {}) { const w = new World(140, seed, { light: 1 }); for (let i = 0; i < (o.n || 4); i++) spawn(w, species, { energy: 0.9, sex: i % 2 ? 'male' : 'female' }); w.patch('plant', 70, 70, 60, { cap: o.food || 30, rate: 0.2 }); run(w, o.beats || 900); return w.creatures.length + w.items.filter((x) => x.kind === 'egg').length - (o.n || 4); }

// ---------------- the body
const famine = (s, sheet, beats = 4000, energy = 0.6) => { const w = new World(100, s, { light: 1 }), c = spawn(w, sp('A', sheet, [WANDER]), { energy }); return hunted(w, [c], beats); };
// prey that jinks when it is afraid, to test who can turn with it
const jinker = (sheet = {}) => sp('Prey', Object.assign({ size: 0.85 }, sheet), [I('see bigger creature', 'raise fear', { speed: 'quickly' }), I('am fear', 'wander', { turn: 'tight', pace: 'sprint', str: 'strong' }), WANDER], { moods: { fear: { lingers: 'a long time' } } });
test({ id: 'plan', option: 'no front', neighbour: 'false eyes', unit: 'beats lived of 400', setting: 'A hunter comes from any side at an animal that stands its ground, with shell on its sides only', seen: 'Every bite on the body with no front lands on shell; the one with a front is bitten on its bare face or back',
  run: (k, s) => chase(s, sp('Prey', Object.assign({ size: 0.85, skinFlanks: 'shell' }, pickOf(k, { plan: 'round' }, {}, { falseEyes: true })), [I('always', 'hold still')]), hunter(), { n: 1, beats: 400, after: from((s % 8) / 8 * TAU) }).lived });
test({ id: 'length', option: 'long', neighbour: 'a narrow body', unit: 'beats lived of 600', ownUnit: 'beats lived of 4000', setting: 'A hunter of middling speed in open country', seen: 'The long body keeps ahead; the short one is run down',
  ownSetting: 'with no food at all, the long body has more inside it and starves later than the narrow one. For speed the two are one thing: it is the ratio of length to width that counts',
  run: (k, s) => chase(s, prey(pickOf(k, { length: 1 }, { length: 0 })), hunter({ muscle: 0.18 })).lived, own: (k, s) => famine(s, pickOf(k, { length: 1 }, null, { width: 0 })) });
test({ id: 'width', option: 'wide', neighbour: 'fat', unit: 'beats lived of 4000', ownUnit: 'beats lived of 600', setting: 'No food at all', seen: 'The wide body, with more room inside, starves later',
  ownSetting: 'chased by a hunter, the fat body is slower than the wide one',
  run: (k, s) => famine(s, pickOf(k, { width: 1 }, { width: 0 })), own: (k, s) => chase(s, prey(pickOf(k, { width: 1 }, null, { fat: 0.7 })), hunter({ muscle: 0.18 })).lived });
test({ id: 'taper', option: 'heavy at the front', neighbour: 'muscle', less: true, unit: 'beats a shelled animal lasts, of 400', ownUnit: 'kills of jinking prey, of 5', setting: 'A hunter works at an animal in a shell that stands its ground', seen: 'With its weight behind its jaws it breaks in sooner',
  ownSetting: 'after prey that jinks, the muscled hunter turns with it and the front-heavy one runs wide',
  run: (k, s) => chase(s, sp('Prey', { size: 0.95, skinFront: 'shell', skinFlanks: 'shell', skinBack: 'shell' }, [I('always', 'hold still')]), hunter(pickOf(k, { taper: 0.8 }, { taper: 0 })), { n: 1, beats: 400, after: from((s % 8) / 8 * TAU) }).lived,
  own: (k, s) => kills(s, hunter(pickOf(k, { taper: 0.8 }, null, { taper: 0, muscle: 0.6 })), jinker(), { beats: 400 }) });
test({ id: 'taper', option: 'heavy at the rear', neighbour: 'a long body', unit: 'beats lived of 600', ownUnit: 'kills of jinking prey, of 5', setting: 'A hunter of middling speed in open country', seen: 'Slow to get going, then it draws away',
  ownSetting: 'as a hunter after prey that jinks, the rear-heavy body turns with it and the long body cannot',
  run: (k, s) => chase(s, prey(pickOf(k, { taper: -0.8 }, { taper: 0 })), hunter({ muscle: 0.18 })).lived,
  own: (k, s) => kills(s, hunter(pickOf(k, { taper: -0.8 }, null, { taper: 0, length: 1 })), jinker(), { beats: 400 }) });
test({ id: 'size', option: 'small', neighbour: 'brood', seeds: 16, unit: 'young and eggs after 900 beats', setting: 'Plenty of food and no enemies', seen: 'The small species is on its second generation while the large one is still growing up',
  run: (k, s) => brood(s, breeders(pickOf(k, { size: 0.7 }, { size: 1.4 }, { size: 1.4, brood: 0.6 }))) });
test({ id: 'size', option: 'large', neighbour: 'spikes on the back', unit: 'beats lived of 600', setting: 'A hunter that takes what is smaller than itself', seen: 'The hunter passes the large one by',
  run: (k, s) => chase(s, prey(pickOf(k, { size: 1.5 }, { size: 0.85 }, { size: 0.85, skinBack: 'spikes' })), hunter()).lived });
test({ id: 'gut', neighbour: 'fat', unit: 'bites eaten in 500 beats', setting: 'Only coarse, bulky food', seen: 'The one with a big gut grazes; the other walks over the same food and starves',
  run: (k, s) => feed(s, grazer(pickOf(k, { gut: 0.6 }, { gut: 0.2 }, { gut: 0.2, fat: 0.6 })), { item: { bulky: true } }) });
test({ id: 'fat', neighbour: 'gut', unit: 'beats lived of 5000', setting: 'A feast and then nothing', seen: 'The fat one is still walking long after the lean one has died',
  run: (k, s) => { const w = new World(100, s, { light: 1 }), c = spawn(w, sp('A', pickOf(k, { fat: 0.6 }, { fat: 0.05 }, { fat: 0.05, gut: 0.6 }), [WANDER]), { energy: 1 }); return hunted(w, [c], 5000); } });
test({ id: 'muscle', neighbour: 'lungs', seeds: 16, unit: 'kills of 5 in 250 beats', setting: 'A hunter and five prey in open country, for a short while', seen: 'The muscled hunter closes the gap and kills in fewer bites',
  run: (k, s) => kills(s, hunter(pickOf(k, { muscle: 0.6 }, { muscle: 0.05 }, { muscle: 0.05, lungs: 0.6 })), prey(), { beats: 250 }) });
test({ id: 'lungs', neighbour: 'muscle', seeds: 16, unit: 'beats lived of 900', setting: 'A hunter no faster than its prey, which does not give up', seen: 'Both sprint; the one with small lungs is the first to slow to a walk, and that is when it is caught',
  run: (k, s) => chase(s, prey(pickOf(k, { lungs: 0.6 }, { lungs: 0.05 }, { lungs: 0.05, fat: 0.5 })), hunter({ muscle: 0.12 }), { beats: 900, gap: 40, n: 2 }).lived });
test({ id: 'brood', neighbour: 'fat', unit: 'young and eggs after 900 beats', setting: 'Plenty of food and no enemies', seen: 'Bigger clutches',
  run: (k, s) => brood(s, breeders(pickOf(k, { brood: 0.6 }, { brood: 0.05 }, { brood: 0.05, fat: 0.6 }))) });

// ---------------- skin: what each covering does, and that the side it is on is the side that counts.
// The prey stands still with its heading fixed, and what comes at it comes from the front, from the side or from behind
const SIDES = [['front', 'skinFront', 0], ['sides', 'skinFlanks', Math.PI / 2], ['back', 'skinBack', Math.PI]], still = (sheet) => sp('Prey', Object.assign({ size: 0.85 }, sheet), [I('always', 'hold still')]);
const from = (ang, gap = 26) => (w, ps, hs) => { const p = ps[0]; p.x = w.size / 2; p.y = w.size / 2; p.hx = 1; p.hy = 0; hs.forEach((h, i) => { h.x = p.x + Math.cos(ang + i * 0.2) * gap; h.y = p.y + Math.sin(ang + i * 0.2) * gap; h.hx = -Math.cos(ang + i * 0.2); h.hy = -Math.sin(ang + i * 0.2); }); };
const rider = (grip) => sp('Rider', { size: 0.7, grip }, [I('touch bigger creature', 'bite', { only: ['clinging'] }), I('touch bigger creature', 'cling', { not: ['clinging'] }), I('see bigger creature', 'approach'), WANDER]);
for (const [side, field, ang] of SIDES) { const other = field === 'skinBack' ? 'skinFront' : 'skinBack', one = (s, sheet, hunterSp, o = {}) => chase(s, still(sheet), hunterSp, Object.assign({ n: 1, beats: 400, after: from(ang) }, o)).lived;
  test({ id: field, option: 'shell', neighbour: 'shell on another side', unit: 'beats lived of 400', setting: `A hunter comes at its ${side}`, seen: 'Bite after bite lands on shell and does little',
    run: (k, s) => one(s, pickOf(k, { [field]: 'shell' }, {}, { [other]: 'shell' }), hunter()) });
  test({ id: field, option: 'spikes', neighbour: 'bristles there', unit: 'beats lived of 400', setting: `A hunter that backs off when hurt comes at its ${side}`, seen: 'The hunter bites once, flinches and leaves it alone',
    run: (k, s) => one(s, pickOf(k, { [field]: 'spikes' }, {}, { [field]: 'bristles' }), wary()) });
  test({ id: field, option: 'bristles', neighbour: 'shell there', unit: 'beats lived of 400', setting: `Two small riders with suckers come at its ${side} to cling on and feed`, seen: 'Suckers find nothing flat to hold on bristle; on bare skin or shell they stick and feed',
    run: (k, s) => one(s, pickOf(k, { [field]: 'bristles', size: 1.2 }, { size: 1.2 }, { [field]: 'shell', size: 1.2 }), rider('suckers'), { hunters: 2 }) });
  test({ id: field, option: 'slime', neighbour: 'bristles there', unit: 'beats lived of 400', setting: `Two small riders with hooks come at its ${side} to cling on and feed`, seen: 'They slide off and cannot get a hold; on bristle they hook on and eat it alive',
    run: (k, s) => one(s, pickOf(k, { [field]: 'slime', size: 1.2 }, { size: 1.2 }, { [field]: 'bristles', size: 1.2 }), rider('hooks'), { hunters: 2 }) }); }
test({ id: 'skinBack', option: 'bristles, for warmth', neighbour: 'fat', unit: 'beats lived of 3000', setting: 'A night of hard frost that does not end, with food about', seen: 'The bristled one keeps feeding; the bare one slows, stops and dies of cold',
  run: (k, s) => { const w = new World(120, s, { light: 0.15, season: 'winter' }); w.frost(true); const c = spawn(w, grazer(pickOf(k, { skinBack: 'bristles', skinFlanks: 'bristles' }, {}, { fat: 0.6 })), { x: 60, y: 60 }); w.patch('plant', 60, 60, 40, { cap: 10, rate: 0.1 }); return hunted(w, [c], 3000); } });

module.exports = { T, chase, kills, feed, grazer, wary, breeders, brood, pickOf };
