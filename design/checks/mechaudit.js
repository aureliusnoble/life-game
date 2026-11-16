// node design/checks/mechaudit.js [cover | handles | wired | smoke | all | long | body [choice]]
// The mechanics pass (design/plan.md, section 3), as far as it has got.
//   cover    which choices on the species sheet and which words of the vocabulary the rig says it models, family by family
//   handles  whether the rig really has a rule for each word it names: the word is taken by the parser or the table that
//            should take it, and is not quietly read as nothing
//   wired    whether every choice on the sheet changes a number of the body, and every number is read by the rig
//   smoke    five short lives: a grazer eats, a hunter kills and eats, pairs breed, a mood binds to one creature, a brood comes in two forms
//   body     the mechanics pass for bodies: each choice on the sheet with it, without it and with its nearest neighbour
//            (design/checks/mech/body.js). Slow, so it runs only when named; give a choice's id to run that one
//   long     a mixed world of grazers and hunters, both of them designs, over two seasons. Slow, so it runs only when named
// These say that a rule exists. Whether each rule matters in play is the mechanics pass itself, which comes next.
const fs = require('fs'), path = require('path');
const RIG = require('./rig.js'), { KNOWS, gap, SHEET, VOCAB, World, bodyOf, senses: S, mind: M } = RIG, { I, spawn, run } = M;
const SRC = ['mind.js', 'senses.js', 'world.js', 'body.js'].map((f) => fs.readFileSync(path.join(__dirname, 'rig', f), 'utf8')).join('\n');
const line = (ok, text) => { console.log((ok ? '  ok    ' : '  FAIL  ') + text); return ok; };

function cover() { const g = gap(), rule = SHEET.FIELDS.filter((f) => f.kind === 'rule');
  console.log(`cover: the rig models ${rule.length - g.parts.length} of ${rule.length} choices on the species sheet that mean something, and ${VOCAB.words.length - g.words.length} of ${VOCAB.words.length} words of the vocabulary`);
  if (g.parts.length) console.log('\n  Body: not modelled\n    ' + g.parts.map((f) => SHEET.LABEL[f.id]).join(', '));
  if (g.words.length) { console.log('\n  Brain, by family: modelled of all'); for (const [name, list] of VOCAB.families()) { const miss = list.filter((v) => !KNOWS.words.has(v.id)); if (miss.length) console.log('    ' + (list.length - miss.length + '/' + list.length).padEnd(6) + name.padEnd(34) + 'missing: ' + miss.map((v) => v.word).join(', ')); } }
  return !g.parts.length && !g.words.length; }

// ---- handles: one small world with a creature that has every sense, and a probe for each kind of word
function handles() { const w = new World(200, 1), sheet = Object.assign(SHEET.plain(), { compass: true, sideLine: true, ears: true, nose: true, whiskers: true }), sp = { kind: 'A', sheet, brain: { instincts: [], moods: { fear: {} } }, forms: { soldier: { sheet: { horns: true } } } }, c = spawn(w, sp, { x: 100, y: 100 }); spawn(w, sp, { x: 110, y: 100, form: 'soldier' });
  const known = (text) => { try { const r = S.notice(w, c, S.parse(text)); return !r.unknown && typeof r.s === 'number' && !Number.isNaN(r.s); } catch (e) { return false; } }, has = (re) => re.test(SRC), q = (s) => new RegExp('[\'"`]' + s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/'/g, "\\\\?'") + '[\'"`]');
  const reachFor = (v) => (v.family === 'signals' ? (/mark/.test(v.word) ? 'smell ' : v.word === 'a call' ? 'hear ' : 'see ') : v.word === 'a trail of marks' ? 'smell ' : v.needs === 'nose' ? 'smell ' : 'see ');
  const sub = (x) => ({ 'a named form': 'form soldier', 'a species I have met': 'species A', 'a kind I learned about': 'one that hurt me', 'my [mood] place': 'my fear place', 'toward my [mood] place': 'toward my fear place', 'a display': 'display threat' })[x] || x;
  const FUNC = { Bond: /def\.bond/, Place: /def\.place/, Rhythm: /def\.rhythm/, Count: /def\.count/, 'Born with': /def\.bornWith/, Catching: /def\.catching/, Learn: /d\.learn/, 'Takes over': /\.takesOver/, Habit: /ins\.habit/, 'For life': /def\.forLife/ };
  const ATT = { 'eating sees only near': /c\.headDown > 0\) R = Math\.min\(R, NEAR\)/, 'resting sees nothing': /c\.resting > 0 \|\| c\.hiding\) return false/, 'hiding sees nothing and is unseen': /if \(o\.hiding\) return true/, 'sprinting smells nothing and is loud': /sprinting smells nothing/, 'creeping is hard to hear or feel': /o\.pace !== 'creep'/, 'holding still is unfelt': /o\.spd > 0\.05/ };
  const SIG = { mine: /whose === 'my'/, 'my home\'s': /my home\\'s/, 'another home\'s': /another home\\'s/, 'a stranger\'s': /a stranger\\'s/, 'facing while showing': /act === 'show'\) \{ c\.show = arg; if \(n\.dx !== undefined\) P\.face/ };
  const HOW = {
    reach: (v) => ['touch', 'near', 'see', 'far', 'hear', 'smell', 'feel'].includes(v.word) && has(new RegExp("'" + v.word + "'")),
    count: (v) => (v.family === 'how many' ? v.word === 'no' || v.word === 'a' || v.word in S.COUNTS : v.word === 'my group' ? known('see my group') : S.FEELINGS.includes(v.word)),
    which: (v) => known(v.word === 'my [mood] one' ? 'see my fear one' : 'see ' + (v.word === 'nearest' ? '' : (v.word.startsWith('the ') ? v.word : 'the ' + v.word) + ' ') + 'my kind') && (v.word === 'nearest' || v.word === 'my [mood] one' || has(new RegExp(v.word.replace('the ', '') + ': \\(o\\)'))),
    what: (v) => known(reachFor(v) + sub(v.word)), state: (v) => known('see my kind ' + v.word.replace('[display]', 'threat')),
    feeling: (v) => { const n = v.word.replace('[mood]', 'fear').replace('on [ground]', 'on sand').replace('the form it is', 'form soldier'); return n === 'always' || n === 'sometimes' ? known(n) : typeof S.feeling(w, c, n) === 'number' && (S.FEELINGS.includes(n) || /^(on |form )/.test(n) || n in c.moods); },
    degree: (v) => typeof S.feels(w, c, v.word + ' hungry') === 'number' && has(new RegExp("'" + v.word + " '")),
    moment: (v) => (/\[mood\]/.test(v.word) ? has(/' just started' : ' just ended'/) : has(q(v.word)) || has(new RegExp("'" + v.word.replace(/'/g, "\\\\'") + "'"))),
    act: (v) => M.VERBS.includes(v.word) && has(new RegExp("act === '" + v.word + "'")), pace: (v) => !!I('always', 'wander', { pace: v.word }).pace, aim: () => has(/ins\.aim === 'facing'/),
    condition: (v) => has(new RegExp('ins\\.' + v.word.split(' ')[0] + '\\b')), strength: (v) => v.word in M.STR, setting: (v) => v.word in M.DIST || has(new RegExp('\\b' + v.word + ':')),
    mood: (v) => (v.word === 'raised by' ? has(/act === 'raise'/) : v.word === 'calmed by' ? has(/act === 'calm'/) : v.word in M.RAISE || v.word in M.LINGER || v.word in M.KICK),
    function: (v) => FUNC[v.word] && has(FUNC[v.word]), signal: (v) => (SIG[v.word] ? has(SIG[v.word]) : has(q(v.word)) || v.word === 'a display'), attention: (v) => ATT[v.word] && has(ATT[v.word]),
    species: (v) => has(new RegExp("'" + v.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "'")) || (v.family === 'brood mix' && (v.word.startsWith('share') ? has(/mix\.forms/) : has(/br\.rule/))) || (v.word === 'nothing' && has(/cost: 'nothing'/)) || (v.word === 'laid' && has(/where: 'laid'/)),
  };
  const bad = VOCAB.words.filter((v) => KNOWS.words.has(v.id) && !(HOW[v.kind] && HOW[v.kind](v)));
  console.log(`handles: ${KNOWS.words.size} words are named as modelled`); line(!bad.length, bad.length ? 'no rule found for: ' + bad.map((v) => v.id).join('; ') : 'a rule was found for each of them'); return !bad.length; }

// ---- wired: every choice changes the body, and every number of the body is read
function wired() { const base = bodyOf(SHEET.plain()), flat = (b) => JSON.stringify(b, (k, v) => (k === 'sheet' ? undefined : v)), dead = [];
  for (const f of SHEET.FIELDS.filter((x) => x.kind === 'rule')) { const tries = f.type === 'num' ? [f.range[0], f.range[1]] : f.type === 'flag' ? [!f.def] : f.options.filter((o) => o !== f.def); if (!tries.some((v) => flat(bodyOf(Object.assign(SHEET.plain(), { [f.id]: v }))) !== flat(base))) dead.push(SHEET.LABEL[f.id] || f.id); }
  const INPUT = ['sheet', 'len', 'mover', 'mouth', 'land', 'water', 'bristleSides'], unread = Object.keys(base).filter((k) => !INPUT.includes(k) && !new RegExp('B\\.' + k + '\\b').test(SRC));
  console.log('wired: ' + SHEET.FIELDS.filter((x) => x.kind === 'rule').length + ' choices that mean something, ' + Object.keys(base).length + ' numbers of a body');
  const a = line(!dead.length, dead.length ? 'these choices change nothing in a body: ' + dead.join(', ') : 'every choice changes at least one number of the body'), b = line(!unread.length, unread.length ? 'these numbers are never read: ' + unread.join(', ') : 'every number of the body is read by the mind or the senses'); return a && b; }

// ---- smoke: four short lives
function smoke() { let ok = true; const plain = SHEET.plain();
  { const w = new World(200, 1), sp = { kind: 'Grazer', sheet: plain, brain: { instincts: [I('smell plant', 'approach'), I('touch plant', 'bite'), I('always', 'wander', { str: 'weak' })], moods: {} } }, c = spawn(w, sp, { x: 100, y: 100, energy: 0.3 }); for (let i = 0; i < 6; i++) w.item('plant', 100 + 30 * Math.cos(i), 100 + 30 * Math.sin(i)); run(w, 400); ok = line(c.meals > 6 && c.energy > 0.8 * c.store, `a grazer smells food, walks to it and eats: ${c.meals} bites, ${Math.round(100 * c.energy / c.store)}% full`) && ok; }
  { const w = new World(200, 2), prey = { kind: 'Prey', sheet: Object.assign({}, plain, { size: 0.8 }), brain: { instincts: [I('see bigger creature', 'move away', { pace: 'sprint' }), I('always', 'wander', { str: 'weak' })], moods: {} } }, hunter = { kind: 'Hunter', sheet: Object.assign({}, plain, { size: 1.3, mouth: 'jaws', eyes: 'forward', muscle: 0.5 }), brain: { instincts: [I('see smaller creature', 'approach', { pace: 'sprint' }), I('touch smaller creature', 'bite', { str: 'strong' }), I('touch meat', 'bite'), I('see meat', 'approach'), I('always', 'wander', { str: 'weak' })], moods: {} } };
    const h = spawn(w, hunter, { x: 100, y: 100, energy: 0.4 }); for (let i = 0; i < 5; i++) spawn(w, prey, {}); run(w, 1500); ok = line((h.kills || 0) >= 1 && h.meals >= 2, `a hunter runs prey down, kills it and eats the body: ${h.kills || 0} kills, ${h.meals} bites of meat`) && ok; }
  { const w = new World(120, 3), sp = { kind: 'Pair', sheet: plain, grown: 200, brain: { instincts: [I('see my kind', 'approach', { only: ['fertile'] }), I('touch my kind', 'mate', { only: ['fertile'] }), I('am gravid', 'lay'), I('smell plant', 'approach', { only: ['hungry'] }), I('touch plant', 'bite'), I('always', 'wander', { str: 'weak' })], moods: {} } };
    for (let i = 0; i < 6; i++) spawn(w, sp, { energy: 0.9 }); for (let i = 0; i < 40; i++) w.item('plant', w.rnd() * 120, w.rnd() * 120); run(w, 1500); ok = line(w.creatures.length > 12, `pairs find each other, mate, lay, and the eggs hatch: 6 became ${w.creatures.length}`) && ok; }
  { const w = new World(120, 4, { light: 1 }), sp = { kind: 'Moody', sheet: plain, brain: { instincts: [I('see my kind', 'raise fond', { speed: 'quickly' }), I('see my fond one', 'stay near', { dist: 'close', str: 'strong' }), I('always', 'wander', { str: 'weak' })], moods: { fond: { bond: true, place: true, lingers: 'until calmed' } } } }, a = spawn(w, sp, { x: 50, y: 50 }), b = spawn(w, sp, { x: 60, y: 50 }); run(w, 300); ok = line(a.bonds.fond === b && w.off(a, b)[2] < 20, `a mood binds to the one that raised it, and the two stay together: ${w.off(a, b)[2].toFixed(0)} apart after 300 beats of wandering`) && ok; }
  { const w = new World(120, 5, { light: 1 }), sp = { kind: 'Colony', sheet: plain, grown: 100, breed: { way: 'alone', mix: { forms: { soldier: 0.5 } } }, forms: { soldier: { sheet: { horns: true, size: 1.3 } } }, brain: { instincts: [I('always', 'lay'), I('smell plant', 'approach'), I('touch plant', 'bite'), I('always', 'wander', { str: 'weak' })], moods: {} } };
    spawn(w, sp, { energy: 1, x: 60, y: 60 }); for (let i = 0; i < 30; i++) w.item('plant', 40 + w.rnd() * 40, 40 + w.rnd() * 40); run(w, 500); const so = w.creatures.filter((c) => c.form === 'soldier'), pl = w.creatures.filter((c) => !c.form);
    ok = line(so.length > 0 && pl.length > 1 && so[0].B.horns && !pl[0].B.horns, `a brood comes in two forms, each with its own body: ${pl.length} plain and ${so.length} soldiers with horns`) && ok; }
  return ok; }

// ---- long: a mixed world over two seasons. Both species are designs: a sheet and a brain. It is here to show that such a run can be made and read;
// whether hunters and their prey last together is a question for the balance pass
function long() { const plain = SHEET.plain(), w = new World(300, 7), beats = 9600; for (const [x, y] of [[70, 80], [220, 90], [150, 230], [60, 240]]) w.patch('plant', x, y, 34, { cap: 16, rate: 0.05 }); w.region('ground', 'thicket', 150, 150, 30); w.region('water', 'still water', 250, 250, 28);
  const breed = [I('see my kind', 'approach', { only: ['fertile'], not: ['hungry'] }), I('touch my kind', 'mate', { only: ['fertile'] }), I('am gravid', 'lay')];
  const grazer = { kind: 'Grazer', grown: 300, sheet: Object.assign({}, plain, { size: 0.8, gut: 0.4, eyes: 'side' }), brain: { instincts: [I('see bigger creature', 'move away', { pace: 'sprint', str: 'strong' }), I('smell plant', 'approach', { only: ['a little hungry'] }), I('touch plant', 'bite', { only: ['a little hungry'] }), ...breed, I('am night', 'rest', { not: ['hungry'] }), I('always', 'wander', { str: 'weak' })], moods: {} } };
  const hunter = { kind: 'Hunter', grown: 500, breed: { eggs: 'a few large' }, sheet: Object.assign({}, plain, { size: 1.3, mouth: 'jaws', eyes: 'forward', muscle: 0.4, lungs: 0.3 }), brain: { instincts: [I('see smaller creature', 'approach', { pace: 'sprint', only: ['a little hungry'] }), I('touch smaller creature', 'bite', { str: 'strong', only: ['a little hungry'] }), I('see meat', 'approach', { only: ['a little hungry'] }), I('touch meat', 'bite', { only: ['a little hungry'] }), ...breed, I('always', 'wander', { str: 'weak' })], moods: {} } };
  for (let i = 0; i < 18; i++) spawn(w, grazer, { energy: 0.8 }); for (let i = 0; i < 3; i++) spawn(w, hunter, { energy: 0.8 }); const t0 = Date.now(), count = (k) => w.creatures.filter((c) => c.kind === k).length;
  console.log('long: 18 grazers and 3 hunters, four patches of food that wear out when overgrazed, a thicket and a pond\n\n  day  season   grazers  hunters  eggs  plants   died so far, by cause');
  for (let i = 0; i < beats; i++) { M.step(w); if (i % 1200 === 1199) { const by = w.log.kills.reduce((a, k) => (a[k.by] = (a[k.by] || 0) + 1, a), {}); console.log('  ' + String((i + 1) / 400).padEnd(5) + w.season.padEnd(9) + String(count('Grazer')).padEnd(9) + String(count('Hunter')).padEnd(9) + String(w.items.filter((x) => x.kind === 'egg').length).padEnd(6) + String(w.items.filter((x) => x.kind === 'plant').length).padEnd(9) + Object.entries(by).map(([k, v]) => k.toLowerCase() + ' ' + v).join(', ')); } }
  console.log(''); line(true, `it ran ${beats} beats at ${Math.round(beats / ((Date.now() - t0) / 1000))} beats a second`); return line(count('Grazer') > 0 && count('Hunter') > 0, `both kinds are alive after two seasons: ${count('Grazer')} grazers and ${count('Hunter')} hunters`); }

// ---- body: the four questions, for every choice on the sheet
function body() { const { T } = require('./mech/body.js'), H = require('./mech/harness.js'), only = process.argv[3], rule = SHEET.FIELDS.filter((f) => f.kind === 'rule'), res = []; let ok = true;
  for (const t of T) { if (only && t.id !== only) continue; const r = H.judge(t); console.log(H.report(r)); res.push(r); ok = ok && r.pass; }
  if (!only) { const untested = rule.filter((f) => !T.some((t) => t.id === f.id)); console.log(`\nbody: ${res.filter((r) => r.pass).length} of ${res.length} tests pass, on ${new Set(T.map((t) => t.id)).size} of ${rule.length} choices`); if (untested.length) { console.log('  not yet tested: ' + untested.map((f) => SHEET.LABEL[f.id]).join(', ')); ok = false; }
    fs.writeFileSync(path.join(__dirname, 'mech', 'body-results.json'), JSON.stringify(res, null, 1)); }
  return ok; }

const CHECKS = { cover, handles, wired, smoke, long, body }, which = process.argv[2] || 'all', list = which === 'all' ? Object.keys(CHECKS).filter((k) => k !== 'long' && k !== 'body') : [which];
if (!list.every((k) => CHECKS[k])) { console.log('usage: node design/checks/mechaudit.js [' + Object.keys(CHECKS).join(' | ') + ' | all]'); process.exit(2); }
let all = true; for (const k of list) { const ok = CHECKS[k](); all = all && ok; console.log(''); } console.log(all ? 'All of these pass.' : 'Some of these fail.'); process.exit(all ? 0 : 1);
