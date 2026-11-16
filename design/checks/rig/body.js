// From a species sheet to the numbers the rig's world uses. A stand-in: the numbers show direction, not balance.
// Every choice on the sheet that means something has to change at least one number here, or it does nothing.
// Rules are taken from design/body.md; where that document only proposes a rule, the simplest version of it is used.
const SHEET = require('../../sheet/sheet.js');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// how well each mover does on each kind of footing, from 0 to 1. Body design, section 9
const FOOTING = {
  legs:       { land: 1,    water: 0.35, shallows: 0.7,  mud: 0.6,  sand: 0.75, thicket: 0.8,  rock: 1 },
  longLegs:   { land: 0.9,  water: 0.3,  shallows: 1,    mud: 0.9,  sand: 0.8,  thicket: 0.45, rock: 0.8 },
  wideFeet:   { land: 0.88, water: 0.5,  shallows: 0.85, mud: 1,    sand: 1,    thicket: 0.7,  rock: 0.85 },
  fins:       { land: 0.22, water: 1,    shallows: 0.8,  mud: 0.3,  sand: 0.2,  thicket: 0.2,  rock: 0.15 },
  paddles:    { land: 0.72, water: 0.72, shallows: 0.8,  mud: 0.6,  sand: 0.6,  thicket: 0.6,  rock: 0.6 },
  cilia:      { land: 0.5,  water: 0.5,  shallows: 0.5,  mud: 0.5,  sand: 0.45, thicket: 0.5,  rock: 0.5 },
  suckerFoot: { land: 0.35, water: 0.3,  shallows: 0.35, mud: 0.35, sand: 0.3,  thicket: 0.35, rock: 0.4 },
  wave:       { land: 0.55, water: 0.9,  shallows: 0.9,  mud: 0.8,  sand: 0.5,  thicket: 0.95, rock: 0.5 },
};
const SIDES = ['front', 'flanks', 'back'];
function bodyOf(sheet0) {
  const s = SHEET.tidy(sheet0), round = s.plan === 'round', len = 1 + 0.9 * s.length, wid = 0.6 + 0.6 * s.width, sc = s.size;
  const tot = s.gut + s.fat + s.muscle + s.lungs + s.brood || 1, o = { gut: s.gut / tot, fat: s.fat / tot, muscle: s.muscle / tot, lungs: s.lungs / tot, brood: s.brood / tot };
  const mass = Math.pow(len * wid * sc * sc, 1.5), size = sc * Math.sqrt(len * wid);
  const skin = { front: round ? s.skinFlanks : s.skinFront, flanks: s.skinFlanks, back: s.skinBack }, has = (k) => SIDES.filter((x) => skin[x] === k).length;
  const armour = 0.12 * has('shell') + 0.035 * has('spikes') + (s.horns ? 0.03 : 0) + (s.club ? 0.03 : 0);
  const shape = clamp(0.85 + 0.17 * (len / wid - 1), 0.78, 1.15);                                  // long is fast, round is slow
  const eyes = { forward: [1.6, 120], side: [0.85, 300], stalk: [0.7, 360], none: [0, 0] }[s.eyes];
  const b = { sheet: s, round, size, mass, len, organs: o, skin, mover: s.mover, footing: FOOTING[s.mover],
    // ---- moving
    top: shape * (0.8 + 0.8 * o.muscle * 1.25) * (1 - 0.6 * (o.fat * 1.25 - 0.25)) * Math.pow(sc, 0.15) * (1 - armour) * (round ? 0.6 : 1) * (s.claws ? 0.94 : 1) * (1 + 0.12 * Math.max(0, -s.taper)),      // a heavy rear drives a faster run
    turn: round ? undefined : (0.22 / (len * sc)) * (s.mover === 'legs' ? 1.2 : 1) * (1 - 0.5 * Math.max(0, s.taper)),      // long, big and front-heavy bodies turn slowly
    quick: clamp(0.5 / (len * sc) * (1 + 0.7 * Math.min(0, s.taper)), 0.08, 1),                 // how fast it gets up to speed; a heavy rear is slow to start
    noSprint: round || s.mover === 'cilia' || s.mover === 'suckerFoot', silent: s.mover === 'cilia',
    burstWater: s.tailFin ? 1.5 : 1, burstLand: s.wings ? 1.6 : 1, holdsFast: s.mover === 'suckerFoot',
    stam: 0.5 + 2 * o.lungs * 1.25, dive: 20 + 200 * o.lungs,
    // ---- living
    hp: Math.max(1, Math.round(2 * Math.pow(mass, 0.67) + has('shell') * 0.34)),
    upkeep: Math.pow(mass, 0.75) * (1 + 0.6 * (o.muscle * 1.25 - 0.25)) * (1 + 0.3 * armour),
    store: mass * (0.6 + 1.6 * o.fat * 1.25), bulk: o.gut > 0.3, richOnly: o.gut < 0.12, mealGain: 0.3 * (0.8 + 0.8 * o.gut * 1.25),
    clutch: Math.max(1, Math.round(1 + 10 * o.brood)), eggCost: 1 / (0.45 + 2.75 * o.brood),      // a large brood organ lays more at a time and makes each egg from less food
    tempo: 1 / Math.pow(sc, 1.2),          // small bodies grow up, lay and die sooner
    warm: has('bristles') * 0.34 + clamp((sc - 0.7) / 0.8, 0, 1) * 0.4,                         // holds its heat: bristles, and bulk
    // ---- senses, each from its organ
    sight: 60 * (0.7 + 0.6 * s.eyeSize) * eyes[0], arc: round && s.eyes !== 'none' ? 360 : eyes[1],
    smell: s.nose ? 45 : 0, hearing: s.ears || s.ping ? 110 : 0, touch: s.whiskers ? 14 : 4, feelsWet: !!s.whiskers,
    feel: s.sideLine ? 30 : 0, heat: s.heatPits ? 40 : 0, ping: s.ping ? 70 : 0, compass: !!s.compass,
    // ---- being seen
    camo: s.camo === 'none' ? null : s.camo, falseEyes: s.falseEyes, puff: s.crest ? 1.6 : 1, glow: s.glow,
    // ---- skins
    slimeSides: SIDES.filter((x) => skin[x] === 'slime'), shellSides: SIDES.filter((x) => skin[x] === 'shell'), spikeSides: SIDES.filter((x) => skin[x] === 'spikes'), bristleSides: SIDES.filter((x) => skin[x] === 'bristles'),
    canWithdraw: skin.back === 'shell', fits: 1 + 0.15 * has('shell') + 0.1 * has('spikes'),      // how big it is when squeezing into a crevice or a burrow
    // ---- weapons
    mouth: s.mouth, gape: size * { plain: 0.45, jaws: 0.9, locking: 0.75, tongue: 0.6, beak: 0.8 }[s.mouth], dmg: { plain: 0.5, jaws: 1, locking: 0.7, tongue: 0.5, beak: 1 }[s.mouth] * (0.75 + o.muscle * 1.25) * (1 + 0.35 * Math.max(0, s.taper)),      // a heavy front puts weight behind the bite
    reach: s.mouth === 'tongue' ? 14 : null, crack: s.mouth === 'beak', biteCool: s.mouth === 'beak' ? 10 : 5, biteArc: round ? 360 : s.mouth === 'tongue' ? 120 : 100, locks: s.mouth === 'locking',
    sting: s.sting === 'none' ? null : s.sting, horns: s.horns, claws: s.claws, club: s.club, shedTail: s.shedTail, ink: s.ink,
    // ---- holding and carrying
    grip: s.grip === 'none' ? (s.mouth === 'locking' ? 'jaws' : null) : s.grip, carries: (s.pouch ? 3 : 1) + (s.grip === 'arms' ? 1 : 0), pouch: s.pouch, gland: s.gland,
    callRange: s.voice > 0.5 ? 160 : 60, calls: 1 + Math.round(s.voice * 2), markLasts: s.scent ? 2400 : 600, markReach: s.scent ? 60 : 40 };
  b.land = b.footing.land; b.water = b.footing.water;
  return b; }
// which side of a body something at (dx, dy) from it is on, given the way it faces. A body with no front has only flanks
const sideOf = (c, dx, dy) => { if (c.B.round) return 'flanks'; const d = Math.hypot(dx, dy) || 1, a = Math.acos(clamp((dx * c.hx + dy * c.hy) / d, -1, 1)); return a < 0.8 ? 'front' : a > 2.1 ? 'back' : 'flanks'; };
// what holds on what. Body design, section 6
const HOLDS = { suckers: { smooth: 1, shell: 1, bristles: 0, slime: 0, spikes: 0.6 }, hooks: { smooth: 0.5, shell: 0, bristles: 1, slime: 0, spikes: 0.6 }, arms: { smooth: 0.8, shell: 0.8, bristles: 0.8, slime: 0, spikes: 0 }, jaws: { smooth: 1, shell: 0, bristles: 1, slime: 0.12, spikes: 0.3 } };
module.exports = { bodyOf, sideOf, FOOTING, HOLDS, SIDES };
