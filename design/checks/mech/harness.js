// The mechanics pass: what its tests are made of. design/plan.md, section 3.
// A test takes one part, a setting, and a count that a player watching the tank could make (how long it lived, how many
// it caught, how many hatched). It runs the same design with the part, without it, and with its nearest neighbour in
// place of it, on several maps, and answers the four questions:
//   changes   with and without differ on at least one map
//   pays      with it does better than without, by more than the noise from map to map
//   its own   with it differs from the neighbour, by more than the noise
//   seen      the count is one a watcher could make, and the sentence says what they would see
// Nothing here is about balance: a part passes if there is one setting where it is the right choice.
const RIG = require('../rig.js'), { World, I, spawn, run, step, SHEET } = RIG, plain = SHEET.plain();
const mean = (a) => a.reduce((x, y) => x + y, 0) / (a.length || 1), sd = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) * (x - m)))); };
// a species from the plain sheet and its differences
const sp = (kind, sheet, instincts, more = {}) => Object.assign({ kind, sheet: Object.assign({}, plain, sheet), brain: { instincts: instincts.filter(Boolean), moods: more.moods || {}, signals: more.signals } }, more.species || {});
const WANDER = I('always', 'wander', { str: 'weak' });
// the stock hunter: bigger, with jaws, runs down what is smaller and eats it
const hunter = (sheet = {}, extra = [], o = {}) => sp(o.kind || 'Hunter', Object.assign({ size: 1.35, mouth: 'jaws', eyes: 'forward', muscle: 0.4 }, sheet), [...extra, I((o.reach || 'see') + ' smaller creature', 'approach', { pace: o.pace || 'sprint' }), I('touch smaller creature', 'bite', { str: 'strong' }), WANDER]);
// the stock prey: runs from what is bigger, and keeps running the same way for a while after it has lost sight of it
const prey = (sheet = {}, extra = [], o = {}) => sp(o.kind || 'Prey', Object.assign({ size: 0.85 }, sheet), [...extra, I((o.reach || 'see') + ' bigger creature', 'raise fear', { speed: 'quickly' }), I((o.reach || 'see') + ' bigger creature', 'move away', { pace: 'sprint', str: 'strong' }), I('am fear', 'wander', { turn: 'wide', pace: 'sprint' }), WANDER], { moods: Object.assign({ fear: { lingers: 'a long time' } }, o.moods) });
// how long the tested animals live when hunted: the mean number of beats alive, out of `beats`
function hunted(w, tested, beats) { const born = tested.map(() => beats); for (let i = 0; i < beats; i++) { step(w); tested.forEach((c, k) => { if (!c.alive && born[k] === beats) born[k] = i; }); if (tested.every((c) => !c.alive)) break; } return mean(born); }
// run a test: fn(which, seed) -> a count, for which = 'with' | 'without' | 'neighbour'
// A test may give `own`: a second setting, used only to tell the part from its neighbour, for when the two do the same in the first
function judge(t, seeds = t.seeds || 10) { const out = { with: [], without: [], neighbour: [], ownWith: [] }; for (let s = 1; s <= seeds; s++) { const sd0 = s * 7 + 1; out.with.push(t.run('with', sd0)); out.without.push(t.run('without', sd0)); if (t.neighbour) { out.neighbour.push((t.own || t.run)('neighbour', sd0)); out.ownWith.push(t.own ? t.own('with', sd0) : out.with[out.with.length - 1]); } }
  const a = out.with, b = out.without, n = out.neighbour, oa = out.ownWith, noise = (x, y) => 2 * Math.sqrt((sd(x) ** 2 + sd(y) ** 2) / x.length) + 1e-9, sign = t.less ? -1 : 1, d = sign * (mean(a) - mean(b));
  const r = { id: t.id, option: t.option, setting: t.setting, seen: t.seen, with: mean(a), without: mean(b), neighbour: n.length ? mean(n) : null, ownWith: t.own ? mean(oa) : null, ownSetting: t.ownSetting || null, changes: a.some((x, i) => Math.abs(x - b[i]) > 1e-9), pays: d > noise(a, b), own: n.length ? Math.abs(mean(oa) - mean(n)) > noise(oa, n) : null, unit: t.unit || '', ownUnit: t.ownUnit || t.unit || '', neighbourName: t.neighbour || null, less: !!t.less };
  r.pass = r.changes && r.pays && r.own !== false; return r; }
const fmt = (x) => (Math.abs(x) >= 100 ? Math.round(x) : Math.round(x * 10) / 10);
const report = (r) => `${r.pass ? '  ok    ' : '  FAIL  '}${(r.id + (r.option ? ': ' + r.option : '')).padEnd(28)} ${String(fmt(r.with)).padStart(6)} with, ${String(fmt(r.without)).padStart(6)} without ${r.unit}${r.neighbour !== null ? (r.ownWith !== null ? `; apart from ${r.neighbourName}: ${fmt(r.ownWith)} against ${fmt(r.neighbour)} ${r.ownUnit}` : `; ${fmt(r.neighbour)} with ${r.neighbourName}`) : ''}${r.pass ? '' : '   [' + [!r.changes && 'changes nothing', r.changes && !r.pays && 'does not pay', r.own === false && 'same as ' + r.neighbourName].filter(Boolean).join('; ') + ']'}\n          ${r.setting}. ${r.seen}${r.ownSetting ? '\n          Apart from ' + r.neighbourName + ': ' + r.ownSetting : ''}`;
module.exports = { RIG, World, I, spawn, run, step, SHEET, plain, sp, WANDER, hunter, prey, hunted, judge, report, mean, sd, fmt };
