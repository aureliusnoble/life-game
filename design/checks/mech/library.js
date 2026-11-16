// The library of written behaviours: the mechanics pass, second question. design/plan.md, section 3.
// Each entry is a behaviour the design documents promise, written in full in the vocabulary as a player would read it
// (the notation of design/neural-blocks.md, read by ../rig/script.js), on a body the species sheet allows, with a setting to run it in.
// Four tests:
//   written   the whole program is read, and every word in it is one the rig has a rule for
//   fits      it is within the cap that keeps a brain readable: six moods, twenty-four instincts, two conditions on any one
//   does      run in the rig, the count that shows the behaviour reaches what the entry says it should
//   pays      it does better than each plainer version of the same animal, by more than the noise from map to map
// Run: node design/checks/mechaudit.js library [name]
const H = require('./harness.js'), { World, I, spawn, step, run, hunted, mean, sd, plain } = H, S = require('../rig/script.js'), SENSES = H.RIG.senses, MIND = H.RIG.mind;
const L = [], entry = (e) => L.push(e), TAU = Math.PI * 2;
const species = (kind, text, sheet = {}, more = {}) => Object.assign({ kind, sheet: Object.assign({}, plain, sheet), brain: S.brainOf(text) }, more);

entry({ name: 'Torn between food and fear', from: 'neural-blocks.md, section 11', unit: 'bites eaten in 1500 beats', atLeast: 6,
  says: 'It keeps clear of the big animal that bites, and goes in to feed only when it is very hungry',
  text: `
    see plant → approach                        only when hungry
    touch plant → bite
    see bigger creature → move away (strong)    not when very hungry
    always → wander (weak)`,
  plainer: { 'no fear': `
    see plant → approach                        only when hungry
    touch plant → bite
    always → wander (weak)`, 'always moves away': `
    see plant → approach                        only when hungry
    touch plant → bite
    see bigger creature → move away (strong)
    always → wander (weak)` },
  // all the food grows close to a big animal that bites whatever touches it
  run: (text, s) => { const w = new World(200, s, { light: 1 }); spawn(w, species('Biter', `
      touch smaller creature → bite (strong)      only when sometimes
      see smaller creature → face
      always → hold still`, { size: 1.5, eyes: 'stalk' }), { x: 100, y: 100 }); w.patch('plant', 100, 100, 7, { cap: 8, rate: 0.5, wear: 0 });
    const c = spawn(w, species('Forager', text, { size: 0.9 }), { x: 150, y: 100, energy: 0.32 }); run(w, 1500); return c.meals; } });

entry({ name: 'Remembering a place', from: 'neural-blocks.md, section 11', unit: 'bites eaten in 2000 beats', atLeast: 10,
  says: 'Having fed at a patch, it goes back there whenever it is hungry',
  text: `
    Mood
      Feast: Place, lingers until calmed
    see plant → approach                 only when hungry
    touch plant → bite
    touch plant → raise Feast (quickly)
    my Feast place → approach            only when hungry, only when Feast
    always → wander`,
  plainer: { 'no memory': `
    see plant → approach                 only when hungry
    touch plant → bite
    always → wander` },
  // one small patch where food keeps coming up, in wide empty country, and no nose
  run: (text, s) => { const w = new World(400, s, { light: 1 }); w.patch('plant', 200, 200, 14, { cap: 6, rate: 0.05, wear: 0 }); const c = spawn(w, species('Forager', text, { nose: false }), { x: 215, y: 200, energy: 0.45 }); run(w, 2000); return c.meals; } });

entry({ name: 'Pack hunt on big prey', from: 'neural-blocks.md, section 11', unit: 'hunters still alive when the prey is dead, of 8 (none if it never is)', atLeast: 4, seeds: 100,
  says: 'One sees the big prey and calls; the rest come; none goes in until enough of them are there, and then they all do',
  text: `
    Moods
      Hunting: lingers briefly
      Brave:   lingers briefly, kicks in high
    see bigger creature → raise Hunting (quickly)
    see a few my kind → raise Brave (quickly)
    always → call "Prey!"                       only when Hunting
    hear "Prey!" → approach                     not when Hunting
    see bigger creature → approach              only when Brave
    see bigger creature → keep apart (strong)   not when Brave
    touch bigger creature → bite
    always → wander (weak)`,
  plainer: { 'attack on sight': `
    see bigger creature → approach
    touch bigger creature → bite
    always → wander (weak)`, 'brave, but no call': `
    Moods
      Brave: lingers briefly, kicks in high
    see a few my kind → raise Brave (quickly)
    see bigger creature → approach              only when Brave
    see bigger creature → keep apart (strong)   not when Brave
    touch bigger creature → bite
    always → wander (weak)` },
  // one big animal that bites back hard, and eight small hunters scattered about. A hundred maps, as in the document's own test: the gain is a modest one
  run: (text, s) => { const w = new World(360, s, { light: 1, torus: true }), big = spawn(w, species('Big', `
      touch smaller creature → bite (strong)
      always → wander (weak)`, { size: 1.8, mouth: 'jaws', eyes: 'stalk', muscle: 0.5 }), { x: 180, y: 180 }); for (let i = 0; i < 8; i++) spawn(w, species('Hunter', text, { size: 0.9, mouth: 'jaws', ears: true, voice: 1 }), {}); const hs = w.creatures.filter((c) => c.kind === 'Hunter'); for (let t = 0; t < 1500 && big.alive; t++) step(w); return big.alive ? 0 : hs.filter((c) => c.alive).length; } });

entry({ name: 'Flocking', from: 'neural-blocks.md, section 11', unit: 'beats on which all eight are within 45 of their middle, of the last 400', atLeast: 250,
  says: 'They gather, keep a little apart from each other, and travel the same way',
  text: `
    see my group → stay near
    see my kind → keep apart (close)
    see my group → go the same way
    always → wander (weak)`,
  plainer: { 'wandering only': `
    always → wander (weak)`, 'gathering, but each going its own way': `
    see my group → stay near
    see my kind → keep apart (close)
    always → wander (weak)` },
  run: (text, s) => { const w = new World(300, s, { light: 1, torus: true }), cs = []; for (let i = 0; i < 8; i++) cs.push(spawn(w, species('Bird', text, { eyes: 'side' }), { x: 130 + w.rnd() * 40, y: 130 + w.rnd() * 40 })); let n = 0, moved = 0; const x0 = cs.map((c) => [c.x, c.y]);
    for (let i = 0; i < 900; i++) { step(w); if (i >= 500) { let ax = 0, ay = 0; for (const c of cs) { const [dx, dy] = w.off(cs[0], c); ax += dx; ay += dy; } const mid = { x: cs[0].x + ax / 8, y: cs[0].y + ay / 8 }; if (cs.every((c) => w.off(mid, c)[2] < 45) && cs.reduce((a, c) => a + c.spd, 0) / 8 > 0.15) n++; } } return n; } });

entry({ name: 'Flashing in time', from: 'neural-blocks.md, section 11', unit: 'beats on which all four are lit together, of the last 300', atLeast: 60,
  says: 'Each has its own slow rhythm of light; each hurries when it sees another lit; after a while they pulse together',
  text: `
    Mood
      Beat: Rhythm 120
    always → show glow                 only when Beat
    see my kind showing → hurry Beat (quickly)     not when Beat`,
  plainer: { 'no hurrying': `
    Mood
      Beat: Rhythm 120
    always → show glow                 only when Beat` },
  run: (text, s) => { const w = new World(80, s, { light: 1 }), cs = [0, 1, 2, 3].map((i) => spawn(w, species('Glow', text, { eyes: 'stalk' }), { x: 36 + (i % 2) * 8, y: 36 + Math.floor(i / 2) * 8 })); let n = 0; for (let i = 0; i < 1500; i++) { step(w); if (i >= 1200 && cs.every((c) => c.on.Beat)) n++; } return n; } });

// ---------------- judging
function written(text) { const bad = []; let brain = null; try { brain = S.brainOf(text); } catch (e) { return { brain: null, bad: [e.message] }; } const w = new World(100, 1, { light: 1 }), c = spawn(w, { kind: 'Probe', sheet: Object.assign({}, plain, { nose: true, ears: true, sideLine: true, whiskers: true, compass: true }), brain }, { x: 50, y: 50 });
  for (const ins of brain.instincts) for (const k of [ins, ...ins.only, ...ins.not, ...ins.more, ...ins.less]) { try { const r = MIND.sense(w, c, k); if (r.unknown) bad.push('no rule for "' + k.when + '"'); } catch (e) { bad.push('"' + k.when + '" cannot be read'); } const mood = /^am (?:a little |very )?(\w+)$/.exec(k.when); if (mood && /^[A-Z]/.test(mood[1]) && !(mood[1] in brain.moods)) bad.push('no mood called ' + mood[1]); }
  for (const ins of brain.instincts) if (['raise', 'calm', 'hurry'].includes(ins.act) && !(ins.arg in brain.moods)) bad.push('no mood called ' + ins.arg); return { brain, bad }; }
function judge(e, seeds = e.seeds || 10) { const wr = written(e.text), fit = wr.brain ? S.fits(wr.brain) : ['unread'], out = { name: e.name, from: e.from, says: e.says, unit: e.unit, written: !wr.bad.length, notes: wr.bad, fits: !fit.length, over: fit, lines: wr.brain ? wr.brain.instincts.length : 0, moods: wr.brain ? Object.keys(wr.brain.moods).length : 0 };
  if (!wr.brain) return Object.assign(out, { does: false, pays: false, pass: false }); const runs = (text) => { const a = []; for (let s = 1; s <= seeds; s++) a.push(e.run(text, s * 7 + 1)); return a; }, a = runs(e.text); out.with = mean(a); out.does = e.less ? out.with <= e.atMost : out.with >= e.atLeast; out.against = {}; out.pays = true;
  for (const [name, text] of Object.entries(e.plainer || {})) { const b = runs(text), noise = 2 * Math.sqrt((sd(a) ** 2 + sd(b) ** 2) / a.length) + 1e-9; out.against[name] = mean(b); if (!((e.less ? -1 : 1) * (mean(a) - mean(b)) > noise)) out.pays = false; }
  out.pass = out.written && out.fits && out.does && out.pays; return out; }
const report = (r) => `${r.pass ? '  ok    ' : '  FAIL  '}${r.name.padEnd(34)} ${r.lines} instincts, ${r.moods} moods; ${H.fmt(r.with ?? 0)} ${r.unit}${Object.entries(r.against || {}).map(([k, v]) => `; ${H.fmt(v)} with ${k}`).join('')}${r.pass ? '' : '   [' + [!r.written && 'cannot be written: ' + r.notes.join('; '), !r.fits && 'does not fit: ' + r.over.join(', '), r.written && !r.does && 'does not do what it says', r.written && r.does && !r.pays && 'does not pay'].filter(Boolean).join('; ') + ']'}\n          ${r.says}`;
module.exports = { L, judge, report, written, species };
