// A brain as it is written in design/neural-blocks.md, turned into the rig's form.
// The library of behaviours (design/checks/mech/library.js) is kept in this notation, so that what is tested is what a player would read.
//
//   Moods
//     Fear: lingers a long time, kicks in high, Bond
//   Signals
//     Prey!: a call heard far
//   see bigger creature → move away (strong, sprinting)     not when very hungry
//   Female
//     feel fertile → call "Here"
//
// A line with one capitalised word (Female, Male, or the name of a form) starts a block of instincts for that sex or form only.
const { I } = require('./mind.js');
const STR = ['weak', 'strong'], PACE = { creeping: 'creep', sprinting: 'sprint' }, SPEED = ['quickly', 'slowly', 'normally'], DIST = { close: 'close', mid: 'mid', far: 'far', 'far apart': 'far' }, TURN = ['tight', 'wide', 'medium'], WHICH = ['biggest', 'smallest', 'weakest', 'lone', 'oldest', 'youngest'];
const CAP = { moods: 6, instincts: 24, conditions: 2 };      // the cap that keeps a brain readable (neural-blocks, section 18). Placeholders
function when(text) { let t = text.trim().replace(/\s+/g, ' ');
  t = t.replace(/^feel /, 'am ').replace(/^hear "([^"]+)"$/, 'hear a call $1').replace(/^smell "([^"]+)"$/, "smell my kind's mark $1").replace(/^(touch |near |see )?my (\w+) place$/, (m, r, mood) => (r ? r + 'my ' + mood + ' place' : 'see toward my ' + mood + ' place')).replace(/^my (\w+) one$/, 'see my $1 one');
  t = t.replace(/ showing$/, ' showing any').replace(/ showing "?(\w+)"?$/, ' showing $1'); for (const k of WHICH) t = t.replace(new RegExp('^(\\w+) ' + k + ' '), '$1 the ' + k + ' '); return t; }
const act = (text) => text.trim().replace(/\s+/g, ' ').replace(/^(call|mark|show) "([^"]+)"$/, '$1 $2').replace(/^build (nest|wall|larder)$/, 'build a $1');
function instinct(line, extra = []) { const [left, right0] = line.split('→'); if (right0 === undefined) throw new Error('not an instinct: ' + line); let right = right0, o = { only: extra.slice(), not: [], more: [], less: [] };
  right = right.replace(/\b(only|not|more|less) when ([^,]+?)(?=\s*,|\s{2,}|\s+(?:only|not|more|less) when|$)/g, (m, k, c) => { o[k].push(c.trim().replace(/^feel /, '')); return ''; }).replace(/,/g, ' ');
  const par = /\(([^)]*)\)/.exec(right); if (par) { right = right.replace(par[0], ''); for (const p of par[1].split(',').map((x) => x.trim())) { if (STR.includes(p)) o.str = p; else if (PACE[p]) o.pace = PACE[p]; else if (SPEED.includes(p)) o.speed = p; else if (DIST[p]) o.dist = DIST[p]; else if (TURN.includes(p)) o.turn = p; else if (p === 'habit') o.habit = true; else if (p === 'facing' || p === 'the one it is facing') o.aim = 'facing'; else throw new Error('not a setting: ' + p + ' in ' + line); } }
  for (const k of ['only', 'not', 'more', 'less']) o[k] = o[k].map((c) => (/^(see|near|far|touch|hear|smell) /.test(c) ? when(c) : c)); return I(when(left), act(right), o); }
function mood(props) { const d = {}; for (const p of props.split(',').map((x) => x.trim()).filter(Boolean)) { let m; if ((m = /^lingers (.+)$/.exec(p))) d.lingers = m[1]; else if (/^kicks in/.test(p)) d.kicks = p; else if (p === 'Bond') d.bond = true; else if (p === 'Place') d.place = true; else if ((m = /^Rhythm ?(\d+)?( in step)?$/.exec(p))) d.rhythm = { period: +(m[1] || 120), random: !m[2] }; else if ((m = /^Count (\d+)$/.exec(p))) d.count = +m[1];
    else if ((m = /^Born with ([\d.]+)$/.exec(p))) d.bornWith = { share: +m[1] }; else if (p === 'Catching') d.catching = true; else if (p === 'Learn') d.learn = true; else if (p === 'Takes over') d.takesOver = true; else if ((m = /^For life ?(\w+)?$/.exec(p))) d.forLife = m[1] ? { form: m[1] } : {}; else throw new Error('not a setting of a mood: ' + p); } return d; }
function brainOf(text) { const brain = { instincts: [], moods: {}, signals: {} }; let sect = null, block = null;
  for (const raw of text.split('\n')) { const line = raw.replace(/\s+$/, ''); if (!line.trim() || line.trim().startsWith('#')) continue; const t = line.trim();
    if (/^Moods?$/.test(t)) { sect = 'moods'; continue; } if (/^Signals?$/.test(t)) { sect = 'signals'; continue; } if (/^[A-Z]\w*$/.test(t) && !t.includes('→')) { sect = null; block = t; continue; }
    if (t.includes('→')) { sect = null; const cond = block ? [/^(Female|Male)$/.test(block) ? block.toLowerCase() : 'form ' + block.toLowerCase()] : []; if (block && !/^\s/.test(line)) block = null; brain.instincts.push(instinct(t, block ? cond : [])); continue; }
    const m = /^([^:]+):\s*(.*)$/.exec(t); if (!m) throw new Error('cannot read: ' + t); if (sect === 'signals') brain.signals[m[1].trim()] = m[2].trim(); else brain.moods[m[1].trim()] = mood(m[2]); }
  return brain; }
// does it fit the cap that keeps a brain readable?
const fits = (brain) => { const over = []; if (Object.keys(brain.moods).length > CAP.moods) over.push(Object.keys(brain.moods).length + ' moods'); if (brain.instincts.length > CAP.instincts) over.push(brain.instincts.length + ' instincts'); const c = Math.max(0, ...brain.instincts.map((i) => i.only.length + i.not.length + i.more.length + i.less.length)); if (c > CAP.conditions) over.push(c + ' conditions on one instinct'); return over; };
module.exports = { brainOf, instinct, when, act, fits, CAP };
