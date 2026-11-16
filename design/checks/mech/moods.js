// The mechanics pass for brains, third part: moods. How fast a mood is raised, how long it lingers, where it kicks in,
// and (further down, as they are written) the ten mood functions. Same four questions as harness.js.
// Run: node design/checks/mechaudit.js moods [word]
const H = require('./harness.js'), B = require('./body.js'), { World, I, spawn, step, run, sp, WANDER, hunter, hunted, mean } = H, { chase, kills, feed, pickOf } = B;
const T = [], test = (family, id, t) => T.push(Object.assign({ family, id }, t)), TAU = Math.PI * 2;
const bite = I('touch plant', 'bite'), animal = (kind, sheet, ins, moods = {}, more = {}) => sp(kind, sheet, ins.filter(Boolean), Object.assign({ moods }, more));
// prey that runs only once it is afraid: what it does depends on how its fear is set
const gated = (speed) => [I('see bigger creature', 'raise fear', { speed }), I('see bigger creature', 'move away', { pace: 'sprint', str: 'strong', only: ['fear'] }), I('am fear', 'wander', { turn: 'wide', pace: 'sprint' }), WANDER];
// a hunter that finds warm bodies comes through the dusk; the prey sees it only from as far as the light allows. The count is beats lived
const dusk = (s, fear, speed, light) => chase(s, animal('Prey', { size: 0.85 }, gated(speed), { fear }), hunter({ heatPits: true, muscle: 0.18 }), { light, gap: 44, n: 3 }).lived;
// a feeder on a rich patch, and a harmless neighbour that gives one call every forty beats. The count is bites eaten
function alarms(s, fear, speed) { const w = new World(160, s, { light: 1 }), c = spawn(w, animal('Feeder', { ears: true }, [I('hear a call x', 'raise fear', { speed }), I('am fear', 'hold still', { str: 'strong' }), I('smell plant', 'approach', { not: ['fear'] }), I('touch plant', 'bite', { not: ['fear'] }), WANDER], { fear }), { x: 80, y: 80, energy: 0.3 });
  spawn(w, animal('Crier', { size: 0.9, voice: 1 }, [I('tick just started', 'call x'), I('always', 'hold still')], { tick: { rhythm: { period: 40, random: false } } }), { x: 96, y: 80 }); w.patch('plant', 80, 80, 14, { cap: 10, rate: 0.5, wear: 0 }); run(w, 800); return c.meals; }
// a big harmless animal walks past once; afterwards there is food. The count is bites eaten
function scare(s, fear, extra = []) { const w = new World(200, s, { light: 1 }), c = spawn(w, animal('A', {}, [I('see bigger creature', 'raise fear', { speed: 'quickly' }), ...extra, I('am fear', 'hold still', { str: 'strong' }), I('smell plant', 'approach', { not: ['fear'] }), I('touch plant', 'bite', { not: ['fear'] }), WANDER], { fear }), { x: 100, y: 100, energy: 0.4 });
  spawn(w, animal('Giant', { size: 1.6, compass: true }, [I('see east', 'go the same way')]), { x: 40, y: 104, heading: 0 }); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; w.item('plant', 100 + Math.cos(a) * 30, 100 + Math.sin(a) * 30); } run(w, 900); return c.meals; }

const NORMAL = { lingers: 'a long time' };
test('mood / raised and calmed', 'quickly', { neighbour: 'normally', seeds: 30, unit: 'beats lived of 600', setting: 'Deep dusk. A hunter that finds warm bodies is seen only when it is nearly on them', seen: 'It is afraid at the first glimpse and gone; a fear that takes longer to rise is still rising when the jaws close',
  run: (k, s) => dusk(s, NORMAL, pickOf(k, 'quickly', 'slowly', 'normally'), 0.3) });
test('mood / raised and calmed', 'normally', { neighbour: 'quickly', seeds: 30, unit: 'beats lived of 600', ownUnit: 'bites eaten in 800 beats', setting: 'Broad day. A hunter is seen from far off', seen: 'Its fear has risen long before the hunter arrives; a fear that rises slowly has not',
  ownSetting: 'a harmless neighbour that calls now and then: a fear that rises at the ordinary rate ignores one call, and one that rises quickly stops its feeding every time',
  run: (k, s) => dusk(s, NORMAL, pickOf(k, 'normally', 'slowly'), 1), own: (k, s) => alarms(s, { lingers: 'a while' }, pickOf(k, 'normally', null, 'quickly')) });
test('mood / raised and calmed', 'slowly', { neighbour: 'normally', seeds: 30, unit: 'bites eaten in 800 beats', ownUnit: 'beats lived of 600', setting: 'A harmless neighbour that calls now and then', seen: 'One call does not frighten it and it goes on feeding; a fear that rises quickly stops it every time',
  ownSetting: 'a real hunter seen from far off: a fear that rises slowly is too late, one that rises at the ordinary rate is not',
  run: (k, s) => alarms(s, { lingers: 'a while' }, pickOf(k, 'slowly', 'quickly')), own: (k, s) => dusk(s, NORMAL, pickOf(k, 'slowly', null, 'normally'), 1) });

test('mood / lingers', 'briefly', { neighbour: 'a while', unit: 'bites eaten in 800 beats', setting: 'A harmless neighbour that calls now and then, and a fear that rises quickly', seen: 'It starts at each call and is feeding again at once',
  run: (k, s) => alarms(s, { lingers: pickOf(k, 'briefly', 'a long time', 'a while') }, 'quickly') });
test('mood / lingers', 'a while', { neighbour: 'a long time', unit: 'bites eaten in 800 beats', setting: 'A harmless neighbour that calls now and then, and a fear that rises quickly', seen: 'It stops for a few moments at each call and then feeds again; a fear that lingers a long time never lets it feed',
  run: (k, s) => alarms(s, { lingers: pickOf(k, 'a while', 'until calmed', 'a long time') }, 'quickly') });
test('mood / lingers', 'a long time', { neighbour: 'until calmed', unit: 'beats lived of 600', ownUnit: 'bites eaten in 900 beats', setting: 'A hunter of middling speed in open country, which drops behind where the prey cannot see it', seen: 'Its fear outlasts the sight of the hunter and it keeps running; a fear that is gone at once lets it stop while the hunter is still behind it',
  ownSetting: 'a big harmless animal passes once: a fear that lingers a long time does fade, and it feeds again; one that lasts until calmed, with nothing to calm it, never lets it feed again',
  run: (k, s) => chase(s, animal('Prey', { size: 0.85 }, [I('see bigger creature', 'raise fear', { speed: 'quickly' }), I('see bigger creature', 'move away', { pace: 'sprint', str: 'strong' }), I('am fear', 'wander', { turn: 'wide', pace: 'sprint' }), WANDER], { fear: { lingers: pickOf(k, 'a long time', 'briefly') } }), hunter({ muscle: 0.18 })).lived,
  own: (k, s) => scare(s, { lingers: pickOf(k, 'a long time', null, 'until calmed') }) });
// a young one born in a burrow wanders off to feed; then a hard frost comes. The burrow is the only shelter. The count is beats lived
function homing(s, mood, o = {}) { const w = new World(200, s, { light: 1 }); w.region('shelter', 'a burrow', 40, 100, 7); const c = spawn(w, animal('A', { compass: true }, [I('just hatched', 'raise home', { speed: 'quickly' }), I('see east', 'go the same way', { not: ['cold'], str: 'weak' }), I('see toward my home place', 'approach', { only: ['a little cold'], str: 'strong' }), I('am underground', 'hold still', { only: ['a little cold'] })], { home: mood }, { species: { grown: 50 } }), { x: 40, y: 100, age: 0, energy: 0.9, heading: 0 });
  run(w, o.away || 420); w.frost(true); w.fixedLight = 0.15; return hunted(w, [c], 1500); }
test('mood / lingers', 'until calmed', { neighbour: 'a long time', unit: 'beats lived through a frost, of 1500', setting: 'It hatches in a burrow, wanders far off, and long afterwards a hard frost comes. The burrow is the only shelter', seen: 'It still knows the way home, and goes; a memory that only lingers a long time has faded, and it dies in the open',
  run: (k, s) => homing(s, { place: true, lingers: pickOf(k, 'until calmed', 'a while', 'a long time') }) });

test('mood / kicks in', 'kicks in low', { neighbour: 'kicks in at half', seeds: 30, unit: 'beats lived of 600', setting: 'Deep dusk. A hunter that finds warm bodies is seen only when it is nearly on them, and fear rises at the ordinary rate', seen: 'A little fear is enough to make it run, and it runs in time',
  run: (k, s) => dusk(s, { lingers: 'a long time', kicks: pickOf(k, 'kicks in low', 'kicks in high', 'kicks in at half') }, 'normally', 0.3) });
test('mood / kicks in', 'kicks in at half', { neighbour: 'kicks in high', unit: 'bites eaten in 800 beats', setting: 'A harmless neighbour that calls now and then, and a fear that rises quickly', seen: 'It stops at each call, but not for long; a fear that kicks in low keeps it frozen most of the time, and one that kicks in high barely stops it at all',
  run: (k, s) => alarms(s, { lingers: 'a while', kicks: pickOf(k, 'kicks in at half', 'kicks in low', 'kicks in high') }, 'quickly') });
test('mood / kicks in', 'kicks in high', { neighbour: 'kicks in at half', unit: 'bites eaten in 800 beats', setting: 'A harmless neighbour that calls now and then, and a fear that rises quickly', seen: 'It takes a great deal to frighten it, and it barely pauses in its feeding',
  run: (k, s) => alarms(s, { lingers: 'a while', kicks: pickOf(k, 'kicks in high', 'kicks in low', 'kicks in at half') }, 'quickly') });

module.exports = { T, animal, gated, dusk, alarms, scare, homing };
