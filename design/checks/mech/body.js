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
test({ id: 'taper', option: 'heavy at the rear', neighbour: 'a long body', unit: 'beats lived of 600', ownUnit: 'beats lived of 4000', setting: 'A hunter of middling speed in open country', seen: 'Slow to get going, then it draws away',
  ownSetting: 'with no food at all, the long body has more inside it and outlasts the one that is only heavy behind',
  run: (k, s) => chase(s, prey(pickOf(k, { taper: -0.8 }, { taper: 0 })), hunter({ muscle: 0.18 })).lived,
  own: (k, s) => famine(s, pickOf(k, { taper: -0.8 }, null, { taper: 0, length: 1 })) });
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

// ---------------- defences
const GROUNDS = { grass: 'open grass', reed: 'thicket', sand: 'sand', rock: 'rock', mud: 'mud', litter: 'scrub' }, freezer = (sheet) => sp('Prey', Object.assign({ size: 0.85 }, sheet), [I('see bigger creature', 'hold still', { str: 'strong' }), I('always', 'wander', { str: 'weak', pace: 'creep' })]);
for (const [camo, ground] of Object.entries(GROUNDS)) { const wrong = camo === 'sand' ? 'rock' : 'sand';
  test({ id: 'camo', option: camo, neighbour: 'the wrong camouflage', unit: 'beats lived of 700', setting: `A hunter that hunts by eye, on ${ground}, and prey that freezes when it sees it`, seen: 'The hunter walks past the one that matches the ground and finds the others',
    run: (k, s) => chase(s, freezer(pickOf(k, { camo }, {}, { camo: wrong })), hunter({ muscle: 0.2 }), { ground, size: 150, beats: 700, n: 4, gap: 50 }).lived }); }
const stalker = () => sp('Stalker', { size: 1.35, mouth: 'jaws', eyes: 'forward' }, [I('see smaller creature facing away', 'approach'), I('touch smaller creature facing away', 'bite', { str: 'strong' }), WANDER]), dull = (sheet) => sp('Prey', Object.assign({ size: 0.85 }, sheet), [WANDER]);
test({ id: 'falseEyes', neighbour: 'no front', unit: 'beats lived of 700', ownUnit: 'beats lived of 600', setting: 'A stalker that only goes for what is facing away from it', seen: 'The stalker comes up behind, meets two eyes, and turns away',
  ownSetting: 'chased by a hunter that does not care, the body with false eyes can run and the body with no front cannot',
  run: (k, s) => chase(s, dull(pickOf(k, { falseEyes: true }, {})), stalker(), { size: 160, beats: 700, n: 4 }).lived, own: (k, s) => chase(s, prey(pickOf(k, { falseEyes: true }, null, { plan: 'round' })), hunter({ muscle: 0.18 })).lived });
test({ id: 'shedTail', neighbour: 'ink', unit: 'beats lived of 500', setting: 'A hunter with locking jaws', seen: 'It is seized, drops its tail, and the hunter is left holding the tail',
  run: (k, s) => chase(s, prey(pickOf(k, { shedTail: true }, {}, { ink: true }), [I('just grabbed', 'shed'), I('near bigger creature', 'spray')]), hunter({ mouth: 'locking', muscle: 0.2 }), { beats: 500, gap: 30 }).lived });
test({ id: 'ink', neighbour: 'a tail that sheds', unit: 'beats lived of 600', setting: 'A hunter a little faster than its prey', seen: 'A cloud goes up between them, the hunter loses sight of it and casts about',
  run: (k, s) => chase(s, prey(pickOf(k, { ink: true }, {}, { shedTail: true }), [I('near bigger creature', 'spray'), I('just grabbed', 'shed')]), hunter({ muscle: 0.3 }), { beats: 600, gap: 30 }).lived });

// ---------------- senses
const NIGHT = 0.15, behind = (gap = 40) => (w, ps, hs) => { ps.forEach((p, i) => { p.x = w.size / 2 + i * 9; p.y = w.size / 2; p.hx = 1; p.hy = 0; }); hs.forEach((h) => { h.x = w.size / 2 - gap; h.y = w.size / 2 + 2; h.hx = 1; h.hy = 0; }); };
test({ id: 'eyes', option: 'facing forward', neighbour: 'eyes on the sides', seeds: 48, unit: 'kills of 6 in 700 beats', setting: 'A hunter, and six prey that graze with their heads down and do not look up', seen: 'It picks out prey from twice as far off and goes straight for it',
  run: (k, s) => kills(s, hunter(pickOf(k, { eyes: 'forward' }, { eyes: 'none' }, { eyes: 'side' })), sp('Prey', { size: 0.85 }, [WANDER]), { size: 420, gap: 150, beats: 700, n: 6 }) });
test({ id: 'eyes', option: 'on the sides', neighbour: 'eyes facing forward', unit: 'beats lived of 600', setting: 'A hunter comes from behind and to one side', seen: 'It sees the hunter without turning its head, and is gone',
  run: (k, s) => chase(s, prey(pickOf(k, { eyes: 'side' }, { eyes: 'none' }, { eyes: 'forward' })), hunter({ muscle: 0.18 }), { n: 2, after: (w, ps, hs) => { behind(40)(w, ps, hs); hs[0].y += 24; } }).lived });
test({ id: 'eyes', option: 'on stalks', neighbour: 'false eyes', unit: 'beats lived of 600', setting: 'A hunter comes from straight behind, where eyes on the sides of a head cannot see', seen: 'It sees all round, and runs while the hunter is still far off',
  ownSetting: 'the same hunter and a body with false eyes: it never sees the hunter coming',
  run: (k, s) => chase(s, prey(pickOf(k, { eyes: 'stalk' }, { eyes: 'side' }, { eyes: 'side', falseEyes: true })), hunter({ muscle: 0.18 }), { n: 2, after: behind(40) }).lived });
test({ id: 'eyeSize', option: 'large', neighbour: 'eyes facing forward', unit: 'beats lived of 600', setting: 'A hunter of middling speed in open country', seen: 'It sees the hunter sooner and has a longer start',
  run: (k, s) => chase(s, prey(pickOf(k, { eyeSize: 1 }, { eyeSize: 0 }, { eyeSize: 0, eyes: 'forward' })), hunter({ muscle: 0.18 }), { gap: 70 }).lived });
const forager = (sheet) => sp('Grazer', sheet, [I('smell plant', 'approach'), I('near plant', 'approach'), I('see plant', 'approach'), I('touch plant', 'bite'), WANDER]);
test({ id: 'nose', neighbour: 'large eyes', unit: 'bites eaten in 500 beats', setting: 'A dark night, with food scattered about', seen: 'It walks straight to food it cannot see',
  run: (k, s) => feed(s, forager(pickOf(k, { nose: true }, { nose: false }, { nose: false, eyeSize: 1 })), { light: NIGHT }) });
test({ id: 'whiskers', neighbour: 'a nose', unit: 'bites eaten in 500 beats', setting: 'A dark night, with food thick on the ground', seen: 'It feels its way from one piece to the next',
  run: (k, s) => feed(s, forager(pickOf(k, { whiskers: true, nose: false }, { nose: false }, { nose: true })), { light: NIGHT, food: 40, spread: 50 }) });
test({ id: 'ears', neighbour: 'a side line', unit: 'beats lived of 600', setting: 'A hunter comes up from behind. A big animal of another kind, which it passes on the way, calls when it sees one', seen: 'The ones with ears run at the call, long before they could see anything; the others never look round',
  run: (k, s) => { const sheet = pickOf(k, { ears: true }, { ears: false }, { ears: false, sideLine: true }), listen = [I('hear a call alarm', 'raise fear', { speed: 'quickly' }), I('hear a call alarm', 'move away', { pace: 'sprint', str: 'strong' })], w = new World(500, s, { light: 1, torus: true });
    spawn(w, hunter({}, [I('always', 'wander', { turn: 'wide', pace: 'sprint', str: 'normal' })]), { x: 110, y: 250, heading: 0, energy: 0.9 }); spawn(w, sp('Watcher', { size: 1.6, voice: 1, eyeSize: 1 }, [I('see species Hunter', 'call alarm'), I('always', 'hold still')]), { x: 190, y: 256, heading: Math.PI });
    const ps = [0, 1, 2].map((i) => spawn(w, prey(sheet, listen), { x: 262 + i * 8, y: 245 + i * 5, heading: 0 })); return hunted(w, ps, 600); } });
test({ id: 'sideLine', neighbour: 'ears', unit: 'beats lived of 600', setting: 'A dark night, and a hunter that finds warm bodies', seen: 'It feels the rush coming through the dark and bolts',
  run: (k, s) => chase(s, prey(pickOf(k, { sideLine: true }, {}, { ears: true }), [I('feel movement', 'raise fear', { speed: 'quickly' }), I('feel movement', 'move away', { pace: 'sprint', str: 'strong' })]), hunter({ heatPits: true, muscle: 0.18 }), { light: NIGHT, gap: 50 }).lived });
const nightHunter = (sheet, extra = []) => hunter(sheet, [...extra, I('smell smaller creature', 'approach', { pace: 'sprint' })]);
test({ id: 'heatPits', neighbour: 'a nose', seeds: 16, unit: 'kills of 5 in 600 beats', ownUnit: 'kills of 5 that feel it coming', setting: 'A dark night', seen: 'It turns toward warm bodies it cannot see and runs them down',
  ownSetting: 'prey that feels the rush coming and runs: heat pits follow it at a sprint, and a nose smells nothing at a sprint',
  run: (k, s) => kills(s, nightHunter(pickOf(k, { heatPits: true, nose: false }, { nose: false })), prey(), { light: NIGHT, beats: 600, size: 200, gap: 60 }),
  own: (k, s) => kills(s, nightHunter(pickOf(k, { heatPits: true, nose: false }, null, { nose: true })), prey({ sideLine: true }, [I('feel movement', 'raise fear', { speed: 'quickly' }), I('feel movement', 'move away', { pace: 'sprint', str: 'strong' })]), { light: NIGHT, beats: 600, size: 200, gap: 60 }) });
test({ id: 'ping', neighbour: 'heat pits', seeds: 16, unit: 'kills of 5 in 600 beats', ownUnit: 'kills of 5 that have ears', setting: 'A dark night', seen: 'It calls, and for a moment knows where everything near it is',
  ownSetting: 'prey with ears hear the call and are gone before it arrives; heat pits make no sound',
  run: (k, s) => kills(s, hunter(pickOf(k, { ping: true, nose: false }, { nose: false }), [I('always', 'ping')]), prey(), { light: NIGHT, beats: 600, size: 200, gap: 60 }),
  own: (k, s) => kills(s, hunter(pickOf(k, { ping: true, nose: false }, null, { heatPits: true, nose: false }), [I('always', 'ping')]), prey({ ears: true }, [I('hear a call ping', 'raise fear', { speed: 'quickly' }), I('hear a call ping', 'move away', { pace: 'sprint', str: 'strong' })]), { light: NIGHT, beats: 600, size: 200, gap: 60 }) });
test({ id: 'compass', neighbour: 'large eyes', unit: 'bites eaten in 1500 beats', setting: 'The only food is far to the north, out of sight and out of smell', seen: 'It sets off north across empty ground and arrives; the other wanders where it is',
  run: (k, s) => { const w = new World(600, s, { light: 1 }), c = spawn(w, sp('Rover', pickOf(k, { compass: true }, {}, { eyeSize: 1 }), [I('see north', 'go the same way'), I('smell plant', 'approach', { str: 'strong' }), I('touch plant', 'bite'), WANDER]), { x: 300, y: 560, energy: 0.8 }); for (let i = 0; i < 14; i++) w.item('plant', 240 + w.rnd() * 120, 20 + w.rnd() * 50); run(w, 1500); return c.meals; } });

// ---------------- ways of moving: each on the ground it is for
const water = (type) => (w, mid) => w.region('water', type, mid, mid, 900), swimmer = (sheet = {}) => hunter(Object.assign({ mover: 'paddles' }, sheet));
test({ id: 'mover', option: 'legs', neighbour: 'paddles', unit: 'beats lived of 600', setting: 'A hunter on bare rock', seen: 'Legs grip the rock and it keeps its lead',
  run: (k, s) => chase(s, prey(pickOf(k, { mover: 'legs' }, { mover: 'fins' }, { mover: 'paddles' })), hunter({ muscle: 0.18 }), { ground: 'rock' }).lived });
test({ id: 'mover', option: 'stilts', neighbour: 'webbed feet', unit: 'beats lived of 600', setting: 'A hunter in the shallows', seen: 'It wades at a run while the hunter flounders',
  run: (k, s) => chase(s, prey(pickOf(k, { mover: 'longLegs' }, { mover: 'legs' }, { mover: 'wideFeet' })), hunter({ muscle: 0.55 }), { setup: water('shallows') }).lived });
test({ id: 'mover', option: 'webbed feet', neighbour: 'stilts', unit: 'beats lived of 600', setting: 'A hunter on sand', seen: 'It runs on top of the sand and the hunter sinks in',
  run: (k, s) => chase(s, prey(pickOf(k, { mover: 'wideFeet' }, { mover: 'legs' }, { mover: 'longLegs' })), hunter({ muscle: 0.3 }), { ground: 'sand' }).lived });
test({ id: 'mover', option: 'fins', neighbour: 'paddles', unit: 'beats lived of 600', setting: 'A hunter that swims, in deep water', seen: 'It swims away from it; anything with legs out here tires and goes under',
  run: (k, s) => chase(s, prey(pickOf(k, { mover: 'fins' }, { mover: 'legs' }, { mover: 'paddles' })), swimmer(), { setup: water('deep water') }).lived });
test({ id: 'mover', option: 'paddles', neighbour: 'fins', unit: 'bites eaten in 700 beats', setting: 'Half the food is out in a pond and half is on the land round it', seen: 'It feeds in the water, walks out and feeds on land; legs tire and go under in the pond, and fins are stranded on the bank',
  run: (k, s) => feed(s, grazer(pickOf(k, { mover: 'paddles' }, { mover: 'legs' }, { mover: 'fins' })), { beats: 700, food: 0, at: { x: 100 + 46, y: 100 }, setup: (w, mid) => { w.region('water', 'deep water', mid, mid, 40); for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; w.item('plant', mid + Math.cos(a) * 20, mid + Math.sin(a) * 20); w.item('plant', mid + Math.cos(a + 0.3) * 62, mid + Math.sin(a + 0.3) * 62); } } }) });
test({ id: 'mover', option: 'a skirt of cilia', neighbour: 'one broad foot', unit: 'beats lived of 600', setting: 'A dark night, and a hunter that feels for movement', seen: 'It glides past without a sound and the hunter never turns',
  run: (k, s) => chase(s, sp('Prey', Object.assign({ size: 0.85 }, pickOf(k, { mover: 'cilia' }, { mover: 'legs' }, { mover: 'suckerFoot' })), [WANDER]), sp('Hunter', { size: 1.35, mouth: 'jaws', sideLine: true }, [I('feel movement', 'approach', { pace: 'sprint' }), I('touch smaller creature', 'bite', { str: 'strong' }), WANDER]), { light: NIGHT, size: 160, n: 4 }).lived });
test({ id: 'mover', option: 'one broad foot', neighbour: 'a skirt of cilia', unit: 'bites eaten in 500 beats', setting: 'Food on the bed of a fast stream', seen: 'It holds to the bed and feeds while the current carries the others off',
  run: (k, s) => feed(s, grazer(pickOf(k, { mover: 'suckerFoot' }, { mover: 'legs' }, { mover: 'cilia' })), { food: 14, spread: 26, setup: (w, mid) => w.region('water', 'running water', mid, mid, 70, { flow: [1.1, 0], depth: 0.5 }) }) });
test({ id: 'mover', option: 'body waves', neighbour: 'fins', unit: 'beats lived of 600', ownUnit: 'bites eaten in a thicket', setting: 'A hunter that swims, in deep water', seen: 'It swims well enough to keep ahead for a long while',
  ownSetting: 'out of the water, in a thicket, the body that moves in waves slips through to food and fins barely move',
  run: (k, s) => chase(s, prey(pickOf(k, { mover: 'wave' }, { mover: 'legs' })), swimmer(), { setup: water('deep water') }).lived, own: (k, s) => feed(s, grazer(pickOf(k, { mover: 'wave' }, null, { mover: 'fins' })), { ground: 'thicket' }) });
test({ id: 'tailFin', neighbour: 'wings', unit: 'beats lived of 600', setting: 'A fast hunter with fins, in deep water', seen: 'A flick of the tail and it shoots clear',
  run: (k, s) => chase(s, prey(Object.assign({ mover: 'fins' }, pickOf(k, { tailFin: true }, {}, { wings: true }))), hunter({ mover: 'fins' }), { setup: water('deep water') }).lived });
test({ id: 'wings', neighbour: 'a tail fin', unit: 'beats lived of 600', setting: 'A fast hunter in open country', seen: 'It takes off in a skimming burst and leaves the hunter behind',
  run: (k, s) => chase(s, prey(pickOf(k, { wings: true }, {}, { tailFin: true })), hunter()).lived });

// ---------------- weapons
const bolter = (sheet = {}) => sp('Prey', Object.assign({ size: 0.85, muscle: 0.5, lungs: 0.5 }, sheet), [I('just bitten', 'raise fear', { speed: 'quickly' }), I('am fear', 'wander', { turn: 'wide', pace: 'sprint', str: 'strong' }), WANDER], { moods: { fear: { lingers: 'a long time' } } });
test({ id: 'mouth', option: 'jaws', neighbour: 'a tongue', seeds: 16, unit: 'kills of 6 in 800 beats', setting: 'A slow hunter among fast prey that bolt at the first bite, so that every meeting is one bite', seen: 'Two meetings and the prey is dead; a plain mouth needs four and rarely gets them',
  run: (k, s) => kills(s, hunter(Object.assign({ muscle: 0.12 }, pickOf(k, { mouth: 'jaws' }, { mouth: 'plain' }, { mouth: 'tongue' }))), bolter(), { beats: 800, size: 180, gap: 50, n: 6 }) });
test({ id: 'mouth', option: 'locking jaws', neighbour: 'jaws', seeds: 16, unit: 'kills of 5 in 600 beats', setting: 'Fast prey that bolts at the first bite', seen: 'It is carried off hanging on, still biting, where plain jaws are left behind after one bite',
  run: (k, s) => kills(s, hunter(Object.assign({ muscle: 0.12 }, pickOf(k, { mouth: 'locking' }, { mouth: 'plain' }, { mouth: 'jaws' }))), bolter({ size: 1.05 }), { beats: 600, size: 200, gap: 50 }) });
test({ id: 'mouth', option: 'tongue', neighbour: 'jaws', seeds: 16, unit: 'kills of 5 in 600 beats', setting: 'A slow hunter, and prey that keeps just out of its reach', seen: 'The tongue flicks out across the gap',
  run: (k, s) => kills(s, hunter(Object.assign({ muscle: 0.05, width: 1 }, pickOf(k, { mouth: 'tongue' }, { mouth: 'plain' }, { mouth: 'jaws' }))), sp('Prey', { size: 0.75, eyes: 'stalk' }, [I('see bigger creature', 'keep apart', { dist: 'close', pace: 'sprint', str: 'strong' }), WANDER]), { beats: 600, size: 160, gap: 40 }) });
test({ id: 'mouth', option: 'beak', neighbour: 'jaws', unit: 'bites eaten in 500 beats', setting: 'Only hard-shelled food', seen: 'It cracks them; the others turn them over and give up',
  run: (k, s) => feed(s, grazer(pickOf(k, { mouth: 'beak' }, { mouth: 'plain' }, { mouth: 'jaws' })), { item: { hard: true } }) });
test({ id: 'sting', option: 'rear', neighbour: 'a club tail', unit: 'beats lived of 600', setting: 'A hunter of middling speed runs it down from behind', seen: 'It is caught, stings, and the hunter can only crawl after it',
  run: (k, s) => chase(s, prey(pickOf(k, { sting: 'rear' }, {}, { club: true }), [I('touch bigger creature', 'sting')]), hunter({ muscle: 0.3 }), { gap: 30 }).lived });
test({ id: 'sting', option: 'front', neighbour: 'locking jaws', seeds: 16, unit: 'kills of 5 in 600 beats', ownUnit: 'kills of 5 slimy prey', setting: 'Fast prey that bolts at the first touch', seen: 'One sting and the prey can only crawl; it is caught again at a walk',
  ownSetting: 'on prey covered in slime the jaws cannot lock and the sting still goes in',
  run: (k, s) => kills(s, hunter(Object.assign({ muscle: 0.12 }, pickOf(k, { sting: 'front' }, {})), [I('touch smaller creature', 'sting', { str: 'strong' })]), bolter({ size: 1.05 }), { beats: 600, size: 200, gap: 50 }),
  own: (k, s) => kills(s, hunter(Object.assign({ muscle: 0.12 }, pickOf(k, { sting: 'front' }, null, { mouth: 'locking' })), [I('touch smaller creature', 'sting', { str: 'strong' })]), bolter({ size: 1.05, skinFront: 'slime', skinFlanks: 'slime', skinBack: 'slime' }), { beats: 600, size: 200, gap: 50 }) });
// two of a size at one pile of food: the count is how much the tested one eats
const contest = (s, sheet) => { const w = new World(160, s, { light: 1 }), brain = [I('touch creature about my size', 'bite', { str: 'strong' }), I('smell plant', 'approach'), I('touch plant', 'bite'), WANDER], a = spawn(w, sp('A', sheet, brain), { x: 70, y: 80, energy: 0.3 }); spawn(w, sp('B', { skinFront: 'shell', skinFlanks: 'shell', skinBack: 'shell' }, [I('smell plant', 'approach'), I('touch plant', 'bite'), WANDER]), { x: 90, y: 80, energy: 0.3 }); for (let i = 0; i < 4; i++) w.item('plant', 78 + w.rnd() * 4, 78 + w.rnd() * 4); run(w, 300); return a.meals; };
test({ id: 'horns', neighbour: 'a beak', unit: 'bites eaten of about 12', ownUnit: 'beats a shelled animal lasts, of 400', setting: 'Two animals of a size at one small pile of food; the rival is in a shell and cannot be bitten away', seen: 'The horned one shoves its rival off the pile, tips it on its back, and eats',
  ownSetting: 'against an animal in a shell: horns tip it over to get at its belly, and a beak goes through the shell',
  run: (k, s) => contest(s, pickOf(k, { horns: true }, {})), own: (k, s) => chase(s, sp('Prey', { size: 0.95, skinFront: 'shell', skinFlanks: 'shell', skinBack: 'shell' }, [I('always', 'hold still')]), hunter(pickOf(k, { horns: true }, null, { mouth: 'beak' })), { n: 1, beats: 400, after: from((s % 8) / 8 * TAU) }).lived });
test({ id: 'claws', neighbour: 'muscle', unit: 'bites eaten in 500 beats', setting: 'All the food is buried', seen: 'It smells food, digs and eats; the other scrabbles and mostly goes without',
  run: (k, s) => feed(s, sp('Digger', pickOf(k, { claws: true }, {}, { muscle: 0.6 }), [I('smell plant', 'approach'), I('touch plant', 'bite'), I('smell plant', 'dig'), WANDER]), { item: { buried: true }, spread: 40 }) });
test({ id: 'club', neighbour: 'a sting at the rear', unit: 'beats lived of 600', setting: 'A hunter that backs off when hurt runs it down from behind', seen: 'The club swings back, the hunter is knocked away and thinks better of it',
  run: (k, s) => chase(s, prey(pickOf(k, { club: true }, {}, { sting: 'rear' }), [I('touch bigger creature', 'bite', { str: 'strong' })]), wary({ muscle: 0.3 }), { gap: 30 }).lived });

// ---------------- holding, carrying, giving and signalling
const host = (skin) => sp('Host', { size: 1.3, skinFront: skin, skinFlanks: skin, skinBack: skin }, [I('just bitten', 'raise fear', { speed: 'quickly' }), I('am fear', 'wander', { turn: 'wide', pace: 'sprint', str: 'strong' }), WANDER], { moods: { fear: { lingers: 'a while' } } });
const ride = (s, sheet, skin) => { const w = new World(200, s, { light: 1, torus: true }), h = spawn(w, host(skin), { x: 100, y: 100 }), r = spawn(w, rider(sheet.grip || 'none'), { x: 112, y: 100 }); r.sp.sheet = Object.assign({}, r.sp.sheet, sheet); run(w, 500); return r.bites || 0; };
for (const [grip, skin, other, what] of [['suckers', 'shell', 'hooks', 'a host in a shell'], ['hooks', 'bristles', 'suckers', 'a host covered in bristles']])
  test({ id: 'grip', option: grip, neighbour: other, unit: 'bites it gets in 500 beats', setting: `A small animal that feeds on ${what}, which runs when bitten`, seen: 'It takes hold, is carried along, and feeds as it rides',
    run: (k, s) => { const g = pickOf(k, grip, 'none', other), w = new World(200, s, { light: 1, torus: true }); spawn(w, host(skin), { x: 100, y: 100 }); const r = spawn(w, rider(g), { x: 112, y: 100 }); run(w, 500); return r.bites || 0; } });
// hoarding: food lies about, a larder stands in the middle; the count is how much is in the larder at the end
const hoard = (s, sheet) => { const w = new World(200, s, { light: 1 }), brain = [I('touch food to carry', 'grab', { not: ['very carrying'] }), I('see food to carry', 'approach', { not: ['very carrying'] }), I('see a larder', 'approach', { only: ['very carrying'], str: 'strong' }), I('touch a larder', 'drop', { only: ['a little carrying'] }), WANDER];
  w.region('made', 'a larder', 100, 100, 7); spawn(w, sp('Hoarder', sheet, brain), { x: 100, y: 100, energy: 0.9 }); for (let i = 0; i < 24; i++) { const a = w.rnd() * TAU; w.item('plant', 100 + Math.cos(a) * 34, 100 + Math.sin(a) * 34, { left: 0.5 }); } run(w, 600); return w.items.filter((it) => it.kept).length; };
test({ id: 'grip', option: 'arms', neighbour: 'a pouch', unit: 'pieces in the larder after 600 beats', setting: 'Food lying about, and a larder to fill', seen: 'It carries two at a time',
  run: (k, s) => hoard(s, pickOf(k, { grip: 'arms' }, {}, { pouch: true })) });
test({ id: 'pouch', neighbour: 'arms', unit: 'pieces in the larder after 600 beats', setting: 'Food lying about, and a larder to fill', seen: 'It fills its pouch before it turns for home',
  run: (k, s) => hoard(s, pickOf(k, { pouch: true }, {}, { grip: 'arms' })) });
test({ id: 'gland', neighbour: 'a pouch', seeds: 16, unit: 'young alive after 3000 beats, of 6', setting: 'Six newborn that cannot feed themselves, and one parent', seen: 'It feeds them from itself and they live; without the gland it has too little to give and they starve one by one',
  run: (k, s) => { const w = new World(120, s, { light: 1 }), kind = sp('Nurse', pickOf(k, { gland: true }, {}, { pouch: true }), [I('touch a young one', 'give', { not: ['hungry'] }), I('see a young one', 'stay near', { dist: 'close', not: ['a little hungry'] }), I('smell plant', 'approach', { only: ['a little hungry'] }), I('touch plant', 'bite'), WANDER], { species: { grown: 9000 } });
    spawn(w, kind, { x: 60, y: 60, energy: 0.9 }); const young = [0, 1, 2, 3, 4, 5].map((i) => { const y = spawn(w, kind, { x: 57 + i * 1.5, y: 62, age: 0, energy: 0.15 }); y.brain = { instincts: [I('always', 'hold still')], moods: {} }; y.habit = [1]; y.fired = [-99]; return y; }); w.patch('plant', 60, 60, 16, { cap: 8, rate: 0.2 }); run(w, 3000); return young.filter((y) => y.alive).length; } });
test({ id: 'voice', option: 'loud', neighbour: 'scent glands', unit: 'beats its kin live, of 600', setting: 'A hunter comes up behind its kin, who are a long way off. It sees the hunter and calls', seen: 'They hear it from far off and run',
  run: (k, s) => { const w = new World(500, s, { light: 1, torus: true }), listen = [I('hear a call alarm', 'raise fear', { speed: 'quickly' }), I('hear a call alarm', 'move away', { pace: 'sprint', str: 'strong' })];
    spawn(w, hunter({}, [I('always', 'wander', { turn: 'wide', pace: 'sprint', str: 'normal' })]), { x: 80, y: 250, heading: 0, energy: 0.9 }); spawn(w, sp('Prey', Object.assign({ size: 0.85, eyeSize: 1 }, pickOf(k, { voice: 1 }, { voice: 0 }, { voice: 0, scent: true })), [I('see bigger creature', 'call alarm'), I('always', 'hold still')]), { x: 150, y: 262, heading: Math.PI });
    const ps = [0, 1, 2].map((i) => spawn(w, prey({ ears: true }, listen), { x: 268 + i * 8, y: 245 + i * 5, heading: 0 })); return hunted(w, ps, 600); } });
test({ id: 'scent', neighbour: 'a loud voice', unit: 'bites eaten by one that follows the trail later', setting: 'One of its kind walks to distant food, marking as it goes. Another comes to the start of the trail much later', seen: 'The trail is still there to follow, long after the marker has gone',
  run: (k, s) => { const w = new World(400, s, { light: 1 }), sheet = pickOf(k, { scent: true }, {}, { voice: 1 }), m = spawn(w, sp('Ant', Object.assign({ compass: true }, sheet), [I('always', 'mark trail'), I('see east', 'go the same way')], { signals: { trail: 'a mark that lasts' } }), { x: 60, y: 200, heading: 0 });
    for (let i = 0; i < 12; i++) w.item('plant', 330 + w.rnd() * 20, 190 + w.rnd() * 20); run(w, 520); m.alive = false; w.creatures = w.creatures.filter((c) => c !== m); run(w, 1000);
    const f = spawn(w, sp('Ant', {}, [I('smell plant', 'approach', { str: 'strong' }), I('touch plant', 'bite'), I('smell my kind\'s mark trail', 'go along'), WANDER]), { x: 60, y: 200, heading: 0, energy: 0.5 }); run(w, 700); return f.meals; } });
test({ id: 'glow', neighbour: 'large eyes', unit: 'young and eggs after 900 beats', setting: 'A night that does not end', seen: 'They find each other by their lights and breed; the dark ones pass within a few steps and never meet',
  run: (k, s) => { const w = new World(160, s, { light: NIGHT }), sheet = pickOf(k, { glow: true }, {}, { eyeSize: 1 }), kind = sp('Pair', sheet, [I('always', 'glow'), I('see my kind', 'approach', { only: ['fertile'] }), I('touch my kind', 'mate', { only: ['fertile'] }), I('am gravid', 'lay'), I('smell plant', 'approach', { only: ['a little hungry'] }), I('touch plant', 'bite'), WANDER], { species: { grown: 150 } });
    for (let i = 0; i < 4; i++) spawn(w, kind, { energy: 0.9, sex: i % 2 ? 'male' : 'female' }); w.patch('plant', 80, 80, 70, { cap: 30, rate: 0.2 }); run(w, 900); return w.creatures.length + w.items.filter((x) => x.kind === 'egg').length - 4; } });
test({ id: 'crest', neighbour: 'false eyes', unit: 'beats lived of 600', setting: 'A hunter that takes what is smaller than itself', seen: 'It stands, puffs up to half as big again, and the hunter thinks better of it',
  run: (k, s) => chase(s, sp('Prey', Object.assign({ size: 0.85 }, pickOf(k, { crest: true }, {}, { falseEyes: true })), [I('see bigger creature', 'puff up'), I('see bigger creature', 'hold still'), WANDER]), hunter(), { gap: 40 }).lived });

module.exports = { T, chase, kills, feed, grazer, wary, breeders, brood, pickOf, from };
