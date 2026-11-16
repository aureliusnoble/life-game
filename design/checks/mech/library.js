// The library of written behaviours: the mechanics pass, second question. design/plan.md, section 3.
// Each entry is a behaviour the design documents promise, written in full in the vocabulary as a player would read it
// (the notation of design/neural-blocks.md, read by ../rig/script.js), on a body the species sheet allows, with a setting to run it in.
// Four tests:
//   written   the whole program is read, and every word in it is one the rig has a rule for
//   fits      it is within the cap that keeps a brain readable: six moods, twenty-four instincts, two conditions on any one
//   does      run in the rig, the count that shows the behaviour reaches what the entry says it should
//   pays      it does better than each plainer version of the same animal, by more than the noise from map to map
// Run: node design/checks/mechaudit.js library [group | name]
//
// The entries are in ./library/, one file for each source. A file is `module.exports = (kit) => { kit.entry({...}); ... }`.
// An entry:
//   name      the behaviour, as its source names it
//   from      where it is promised, e.g. 'neural-blocks.md, section 12, Feeding'
//   says      one sentence: what a player watching would see
//   text      the whole program, in the document's notation
//   plainer   { 'what is left out': text, ... }: the same animal without the idea, and any nearest simpler version. It has to beat each
//   sheet     optional: the body, as differences from the plain sheet. Give it inside run() through species(kind, text, sheet)
//   run       (text, seed) => a count a watcher could make. The same setting is used for the text and for each plainer version
//   unit      what the count is
//   atLeast   what the count has to reach for the behaviour to be there at all (or atMost, with less: true, where lower is better)
//   seeds     how many maps (10 unless given)
//   brain     optional, only where the notation cannot yet say it: (I) => ({ instincts, moods, signals }) in the rig's own form.
//             `gap` then says what the notation lacks. The text is still given, as near as the notation allows
//   note      optional: anything a reader of the record should know (a rule that seems wrong, a setting that had to be narrow)
// A behaviour that fails as written is recorded as failing. It is not rewritten to pass, and the rig's rules are not changed to suit it.
const fs = require('fs'), path = require('path');
const H = require('./harness.js'), { World, I, spawn, step, run, hunted, mean, sd, plain } = H, S = require('../rig/script.js'), SENSES = H.RIG.senses, MIND = H.RIG.mind;
const L = [], TAU = Math.PI * 2;
const species = (kind, text, sheet = {}, more = {}) => Object.assign({ kind, sheet: Object.assign({}, plain, sheet), brain: typeof text === 'string' ? S.brainOf(text) : text }, more);
for (const f of fs.readdirSync(path.join(__dirname, 'library')).filter((x) => x.endsWith('.js')).sort()) { const group = f.replace(/\.js$/, ''); require('./library/' + f)({ entry: (e) => L.push(Object.assign({ group }, e)), species, World, I, spawn, step, run, hunted, mean, sd, plain, TAU, H, SENSES, MIND, SHEET: H.SHEET }); }

// ---------------- judging
function written(text, given) { const bad = []; let brain = null; try { brain = given ? given(I) : S.brainOf(text); if (given) { brain.moods = brain.moods || {}; brain.signals = brain.signals || {}; } } catch (e) { return { brain: null, bad: [e.message] }; } const w = new World(100, 1, { light: 1 }), c = spawn(w, { kind: 'Probe', sheet: Object.assign({}, plain, { nose: true, ears: true, sideLine: true, whiskers: true, compass: true }), brain }, { x: 50, y: 50 });
  for (const ins of brain.instincts) for (const k of [ins, ...ins.only, ...ins.not, ...ins.more, ...ins.less]) { try { const r = MIND.sense(w, c, k); if (r.unknown) bad.push('no rule for "' + k.when + '"'); } catch (e) { bad.push('"' + k.when + '" cannot be read'); } const mood = /^am (?:a little |very )?(\w+)$/.exec(k.when); if (mood && /^[A-Z]/.test(mood[1]) && !(mood[1] in brain.moods)) bad.push('no mood called ' + mood[1]); }
  for (const ins of brain.instincts) if (['raise', 'calm', 'hurry'].includes(ins.act) && !(ins.arg in brain.moods)) bad.push('no mood called ' + ins.arg); return { brain, bad }; }
function judge(e, seeds = e.seeds || 10) { const wr = written(e.text, e.brain), fit = wr.brain ? S.fits(wr.brain) : ['unread'], out = { name: e.name, group: e.group, from: e.from, says: e.says, unit: e.unit, gap: e.gap || null, note: e.note || null, text: e.text, written: !wr.bad.length, notes: wr.bad, fits: !fit.length, over: fit, lines: wr.brain ? wr.brain.instincts.length : 0, moods: wr.brain ? Object.keys(wr.brain.moods).length : 0 };
  if (!wr.brain) return Object.assign(out, { does: false, pays: false, pass: false }); const runs = (text) => { const a = []; for (let s = 1; s <= seeds; s++) a.push(e.run(text, s * 7 + 1)); return a; }, a = runs(e.brain ? wr.brain : e.text); out.with = mean(a); out.does = e.less ? out.with <= e.atMost : out.with >= e.atLeast; out.against = {}; out.pays = true;
  for (const [name, text] of Object.entries(e.plainer || {})) { const b = runs(text), noise = 2 * Math.sqrt((sd(a) ** 2 + sd(b) ** 2) / a.length) + 1e-9; out.against[name] = mean(b); if (!((e.less ? -1 : 1) * (mean(a) - mean(b)) > noise)) out.pays = false; }
  out.pass = out.written && out.fits && out.does && out.pays; return out; }
const report = (r) => `${r.pass ? '  ok    ' : '  FAIL  '}${r.name.padEnd(34)} ${r.lines} instincts, ${r.moods} moods; ${H.fmt(r.with ?? 0)} ${r.unit}${Object.entries(r.against || {}).map(([k, v]) => `; ${H.fmt(v)} with ${k}`).join('')}${r.pass ? '' : '   [' + [!r.written && 'cannot be written: ' + r.notes.join('; '), !r.fits && 'does not fit: ' + r.over.join(', '), r.written && !r.does && 'does not do what it says', r.written && r.does && !r.pays && 'does not pay'].filter(Boolean).join('; ') + ']'}\n          ${r.says}`;
module.exports = { L, judge, report, written, species };
