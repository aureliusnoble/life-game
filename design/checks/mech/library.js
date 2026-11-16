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

// ---------------- judging
function written(text) { const bad = []; let brain = null; try { brain = S.brainOf(text); } catch (e) { return { brain: null, bad: [e.message] }; } const w = new World(100, 1, { light: 1 }), c = spawn(w, { kind: 'Probe', sheet: Object.assign({}, plain, { nose: true, ears: true, sideLine: true, whiskers: true, compass: true }), brain }, { x: 50, y: 50 });
  for (const ins of brain.instincts) for (const k of [ins, ...ins.only, ...ins.not, ...ins.more, ...ins.less]) { try { const r = MIND.sense(w, c, k); if (r.unknown) bad.push('no rule for "' + k.when + '"'); } catch (e) { bad.push('"' + k.when + '" cannot be read'); } const mood = /^am (?:a little |very )?(\w+)$/.exec(k.when); if (mood && /^[A-Z]/.test(mood[1]) && !(mood[1] in brain.moods)) bad.push('no mood called ' + mood[1]); }
  for (const ins of brain.instincts) if (['raise', 'calm', 'hurry'].includes(ins.act) && !(ins.arg in brain.moods)) bad.push('no mood called ' + ins.arg); return { brain, bad }; }
function judge(e, seeds = e.seeds || 10) { const wr = written(e.text), fit = wr.brain ? S.fits(wr.brain) : ['unread'], out = { name: e.name, from: e.from, says: e.says, unit: e.unit, written: !wr.bad.length, notes: wr.bad, fits: !fit.length, over: fit, lines: wr.brain ? wr.brain.instincts.length : 0, moods: wr.brain ? Object.keys(wr.brain.moods).length : 0 };
  if (!wr.brain) return Object.assign(out, { does: false, pays: false, pass: false }); const runs = (text) => { const a = []; for (let s = 1; s <= seeds; s++) a.push(e.run(text, s * 7 + 1)); return a; }, a = runs(e.text); out.with = mean(a); out.does = out.with >= e.atLeast; out.against = {}; out.pays = true;
  for (const [name, text] of Object.entries(e.plainer || {})) { const b = runs(text), noise = 2 * Math.sqrt((sd(a) ** 2 + sd(b) ** 2) / a.length) + 1e-9; out.against[name] = mean(b); if (!(mean(a) - mean(b) > noise)) out.pays = false; }
  out.pass = out.written && out.fits && out.does && out.pays; return out; }
const report = (r) => `${r.pass ? '  ok    ' : '  FAIL  '}${r.name.padEnd(34)} ${r.lines} instincts, ${r.moods} moods; ${H.fmt(r.with ?? 0)} ${r.unit}${Object.entries(r.against || {}).map(([k, v]) => `; ${H.fmt(v)} with ${k}`).join('')}${r.pass ? '' : '   [' + [!r.written && 'cannot be written: ' + r.notes.join('; '), !r.fits && 'does not fit: ' + r.over.join(', '), r.written && !r.does && 'does not do what it says', r.written && r.does && !r.pays && 'does not pay'].filter(Boolean).join('; ') + ']'}\n          ${r.says}`;
module.exports = { L, judge, report, written, species };
