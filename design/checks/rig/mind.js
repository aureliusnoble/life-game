// The rig's mind: creatures that run a brain written in the vocabulary, on a body made from a species sheet.
// A stand-in, not the game's simulation. Every rule is short on purpose, so that the mechanics pass can ask of each
// word and each body part whether it changes anything. Numbers show direction, not balance.
//
// A species is { kind, sheet, brain: { instincts, moods, signals }, breed, forms }.
//   instincts   made with I(when, act, options)
//   moods       name -> { lingers, kicks, and any of the ten functions: bond, place, rhythm, count, bornWith, catching, learn, takesOver, forLife }
//   signals     name -> 'a call heard near' | 'a call heard far' | 'a mark that fades soon' | 'a mark that lasts' | 'a display'
//   breed       the settings for the whole species (BREED below)
//   forms       name -> { sheet: differences from the base sheet, brain: optional }
const { GROUND, clamp, DAY, SEASON, SEASONS } = require('./world.js'), { bodyOf, sideOf, HOLDS } = require('./body.js'), S = require('./senses.js'), VOCAB = require('../../sheet/vocab.js');
const TAU = Math.PI * 2;
const PACE = { creep: 0.35, normal: 0.65, sprint: 1 }, PACES = { creeping: 'creep', 'normal pace': 'normal', sprinting: 'sprint', creep: 'creep', normal: 'normal', sprint: 'sprint' };
const DIST = { close: 12, mid: 30, far: 55, 'far apart': 55 }, STR = { weak: 0.5, normal: 1, 'normal strength': 1, strong: 2 }, JITTER = { tight: 1.5, medium: 0.6, wide: 0.12 };
const RAISE = { slowly: 0.008, normally: 0.06, quickly: 0.4 }, LINGER = { briefly: 0.3, 'a while': 0.05, 'a long time': 0.008, 'until calmed': 0 }, KICK = { 'kicks in low': 0.25, 'kicks in at half': 0.5, 'kicks in high': 0.75 };
const VERBS = ['go the same way', 'move away', 'stay near', 'keep apart', 'go along', 'head off', 'hold still', 'play dead', 'puff up', 'let go', 'approach', 'circle', 'face', 'wander', 'bite', 'rest', 'lay', 'mate', 'grab', 'drop', 'give', 'tend', 'roll', 'cling', 'hide', 'shed', 'sting', 'spray', 'glow', 'crouch', 'mark', 'wipe', 'dig', 'build', 'call', 'show', 'ping', 'raise', 'calm', 'hurry'];
const MOVES = ['approach', 'move away', 'stay near', 'keep apart', 'circle', 'go along', 'go the same way', 'head off', 'wander'];
const MOMENT = new Set(VOCAB.words.filter((v) => v.kind === 'moment').map((v) => v.word)), REACHES = ['touch', 'near', 'see', 'far', 'hear', 'smell', 'feel', 'am', 'just', 'always', 'sometimes'];
const BREED = { way: 'in pairs', mix: { male: 0.5 }, mating: 'each time', cost: 'nothing', eggs: 'many small', where: 'laid', hatch: 'hatch at once', lay: 'repeatedly', sleep: 'no sleep', sleepSeason: 'winter' };

// ---- writing a brain
const cond = (text) => { const t = REACHES.includes(text.split(' ')[0]) || MOMENT.has(text) || / just (started|ended)$/.test(text) ? text : 'am ' + text; return { when: t, n: S.parse(t), mood: t.replace(/^am (a little |very )?/, '') }; };
const I = (when, act, o = {}) => { const verb = VERBS.find((v) => act === v || act.startsWith(v + ' ')); if (!verb) throw new Error('not an act: ' + act);
  return { when, n: S.parse(when), act: verb, arg: act.slice(verb.length + 1), str: o.str || 'normal', pace: PACES[o.pace || 'normal'], dist: o.dist || 'mid', turn: o.turn || 'medium', speed: o.speed || 'normally', aim: o.aim,
    only: (o.only || []).map(cond), not: (o.not || []).map(cond), more: (o.more || []).map(cond), less: (o.less || []).map(cond), habit: !!o.habit }; };

// ---- a creature
function spawn(w, sp, o = {}) { const br = sp.breed = Object.assign({}, BREED, sp.breed), rnd = w.rnd, a = o.heading ?? rnd() * TAU, form = o.form || null, F = form && sp.forms && sp.forms[form];
  if (!sp.B) sp.B = bodyOf(sp.sheet); const B = F ? (F.B || (F.B = bodyOf(Object.assign({}, sp.sheet, F.sheet)))) : sp.B, brain = (F && F.brain) || sp.brain, grown = Math.round((sp.grown || 500) / B.tempo), old = Math.round((sp.old || 8000) / B.tempo);
  const c = { id: w.nextId++, kind: sp.kind, sp, brain, B, form, tag: o.tag || sp.kind, x: o.x ?? rnd() * w.size, y: o.y ?? rnd() * w.size, hx: Math.cos(a), hy: Math.sin(a), wx: Math.cos(a), wy: Math.sin(a), vx: 0, vy: 0, spd: 0, pace: 'normal', side: rnd() < 0.5 ? 1 : -1,
    age: o.age ?? grown, grown, old, sz: B.size, hp: B.hp, hpMax: B.hp, store: B.store, energy: (o.energy ?? 0.7) * B.store, stamina: 1, tired: false, heat: 0, alive: true,
    sex: o.sex || (br.way === 'in pairs' || br.way === 'one breeder with helpers' ? (rnd() < (br.mix.male ?? 0.5) ? 'male' : 'female') : br.way === 'both sexes in one' ? 'both' : 'female'), home: o.home ?? null, family: o.family ?? null,
    moods: {}, on: {}, kick: {}, fixed: {}, phase: {}, wasUp: {}, bonds: {}, places: {}, learned: {}, just: {}, justWho: {}, habit: brain.instincts.map(() => 1), fired: brain.instincts.map(() => -99), saw: {},
    carry: [], riders: [], riding: null, locked: null, holding: false, hiding: 0, resting: 0, headDown: 0, pose: null, glowing: 0, belly: 0, show: null, shown: null, call: null, called: null,
    fertile: false, gravid: 0, mated: 0, nextLay: 0, spent: false, asleep: false, biteCool: 0, stingCool: 0, inkCool: 0, callCool: 0, markCool: 0, venom: 0, ill: 0, digging: 0, shedDone: false, echo: -1, idle: false, torn: false, stuck: 0, swept: false, fought: -99, under: 0, meals: 0, laid: 0, born: w.t };
  for (const [m, def] of Object.entries(brain.moods || {})) { c.moods[m] = 0; c.on[m] = false; c.kick[m] = KICK[def.kicks || 'kicks in at half']; c.phase[m] = def.rhythm ? (def.rhythm.random === false ? 0 : rnd()) : 0;
    if (def.bornWith) { if (def.bornWith.ownKick) c.kick[m] = 0.15 + 0.7 * rnd(); if (rnd() < (def.bornWith.share ?? 0)) { c.fixed[m] = true; c.moods[m] = 1; c.on[m] = true; } } }
  grow(c); if (o.age === 0) moment(w, c, 'just hatched', null, 8); w.creatures.push(c); return c; }
const grow = (c) => { c.sz = c.B.size * (c.age >= c.grown ? 1 : 0.45 + 0.55 * c.age / c.grown); };
const moment = (w, c, name, who, beats = 3) => { c.just[name] = w.t + beats; c.justWho[name] = who || undefined; };
const learn = (c, key, kind) => { if (!c.brain.learns && !Object.values(c.brain.moods || {}).some((d) => d.learn)) return; (c.learned[key] || (c.learned[key] = new Set())).add(kind); };
// a habit grows when its instinct is soon followed by something good, and shrinks when it is followed by pain
const reward = (w, c, k) => { c.brain.instincts.forEach((ins, i) => { if (ins.habit && w.t - c.fired[i] < 25) c.habit[i] = clamp(c.habit[i] * k, 0.2, 2.5); }); };
const holds = (w, c, k) => sense(w, c, k).s > 0;

// ---- noticing: the senses, with what the mind adds (moments, attention, losing sight)
function sense(w, c, x) { const t = x.when;
  if (MOMENT.has(t) || / just (started|ended)$/.test(t) || t === 'startled') return { s: c.just[t] >= w.t || w.just(t) ? 1 : 0, target: c.justWho[t] };
  if (x.n.reach === 'smell' && c.pace === 'sprint' && c.spd > 0.6 * c.B.top) return { s: 0 };                           // sprinting smells nothing
  if (c.echo >= w.t && (x.n.reach === 'see' || x.n.reach === 'near' || x.n.reach === 'far')) { const keep = [c.B.sight, c.B.arc]; c.B = Object.assign({}, c.B, { sight: Math.max(c.B.sight, c.B.ping), arc: 360 }); const L = w.fixedLight; w.fixedLight = 1; const r = S.notice(w, c, x.n); w.fixedLight = L; c.B = Object.assign({}, c.B, { sight: keep[0], arc: keep[1] }); return r; }      // an echo shows what is near, in the dark and all round
  return S.notice(w, c, x.n); }

// ---- one beat of thought: every instinct that applies adds a pull or an urge
function think(w, c) { const br = c.brain, P = { px: 0, py: 0, still: 0, pace: 'normal', face: null, urge: [], up: {}, down: {}, hurry: {}, want: 0 }; let best = 0, mags = 0, fired = 0;
  const took = Object.keys(c.moods).filter((m) => c.on[m] && br.moods[m].takesOver);
  br.instincts.forEach((ins, i) => {
    if (took.length && !ins.only.some((k) => took.includes(k.mood)) && !(ins.act === 'calm' && took.includes(ins.arg))) return;                 // a mood that takes over silences what is not tied to it
    if (!ins.only.every((k) => holds(w, c, k)) || ins.not.some((k) => holds(w, c, k))) return;
    const n = sense(w, c, ins); if (ins.n.what && n.target && n.target.B) { c.saw[i] = { o: n.target, x: n.target.x, y: n.target.y, t: w.t }; } else if (c.saw[i] && c.saw[i].t === w.t - 1 && c.saw[i].o.alive && ins.n.reach !== 'touch') { moment(w, c, 'just lost sight of it', { x: c.saw[i].x, y: c.saw[i].y }, 40); }
    if (!(n.s > 0)) return; if (ins.aim === 'facing') { const f = facing(w, c); if (!f) return; Object.assign(n, S.notice(w, c, { reach: 'always' }), toward(w, c, f)); }
    let wt = STR[ins.str] * (ins.habit ? c.habit[i] : 1); for (const k of ins.more) if (holds(w, c, k)) wt *= 1.7; for (const k of ins.less) if (holds(w, c, k)) wt *= 0.45;
    c.fired[i] = w.t; if (ins.n.reach !== 'always' && ins.n.reach !== 'sometimes') fired++;
    const pull = wt * (0.4 + 0.6 * n.s), act = ins.act, D = DIST[ins.dist]; let mx = 0, my = 0;
    if (act === 'approach' && n.dx !== undefined) { const tg = n.target; if (tg && !n.dir && tg.x !== undefined && n.d < (4 + (tg.sz || 0) * 2) * 0.7) { P.face = P.face || [n.dx, n.dy]; P.stay = Math.max(P.stay || 0, pull); } else { mx = n.dx * pull; my = n.dy * pull; } }      // it goes to the thing and stops there, turned toward it
    else if (act === 'move away' && n.dx !== undefined) { mx = -n.dx * pull; my = -n.dy * pull; }
    else if (act === 'stay near' && n.dx !== undefined) { if (n.d > D) { mx = n.dx * pull; my = n.dy * pull; } }
    else if (act === 'keep apart' && n.dx !== undefined) { if (n.d < D) { const k = wt * (1 - n.d / D) * 2; mx = -n.dx * k; my = -n.dy * k; } }
    else if (act === 'circle' && n.dx !== undefined) { mx = -n.dy * c.side * pull; my = n.dx * c.side * pull; }
    else if (act === 'go the same way' && n.dx !== undefined) { const tg = n.target; if (n.dir) { mx = n.dx * wt; my = n.dy * wt; } else if (tg && tg.hx !== undefined) { mx = tg.hx * wt; my = tg.hy * wt; } }
    else if (act === 'head off' && n.target && n.target.vx !== undefined) { const lead = n.d / (c.B.top * PACE[ins.pace] || 1), ax = n.dx * n.d + n.target.vx * lead, ay = n.dy * n.d + n.target.vy * lead, am = Math.hypot(ax, ay) || 1; mx = (ax / am) * pull; my = (ay / am) * pull; }
    else if (act === 'go along' && n.dx !== undefined) { if (n.trail) { const v = trail(w, c, n); mx = v[0] * pull; my = v[1] * pull; } else { const k = n.inside ? -1 : clamp((n.d - 5) / 10, -1, 1); mx = (-n.dy * c.side + n.dx * k * 0.7) * pull; my = (n.dx * c.side + n.dy * k * 0.7) * pull; } }      // keep the line to one side, a little way off
    else if (act === 'wander') { const a = (w.rnd() - 0.5) * JITTER[ins.turn], cs = Math.cos(a), sn = Math.sin(a), bx = c.spd > 0.05 ? c.hx : c.wx, by = c.spd > 0.05 ? c.hy : c.wy; [c.wx, c.wy] = [bx * cs - by * sn, bx * sn + by * cs]; mx = c.wx * wt * 0.6; my = c.wy * wt * 0.6; }      // it drifts on from the way it is already going
    else if (act === 'hold still') P.still = Math.max(P.still, Math.min(1, wt * n.s));
    else if (act === 'face') { if (n.dx !== undefined) { P.face = [n.dx, n.dy]; P.still = 1; } }
    else if (act === 'raise' || act === 'calm' || act === 'hurry') { const m = ins.arg, def = br.moods[m]; if (!def) return; const k = RAISE[ins.speed] * (ins.str === 'strong' ? 1.5 : ins.str === 'weak' ? 0.6 : 1);
      if (act === 'raise') { P.up[m] = (P.up[m] || 0) + k; if (def.bond && !c.bonds[m] && n.target && n.target.B) c.bonds[m] = n.target; if (def.place) c.places[m] = { x: c.x, y: c.y }; } else if (act === 'calm') P.down[m] = (P.down[m] || 0) + k; else P.hurry[m] = (P.hurry[m] || 0) + k * 4; }
    else P.urge.push({ act, arg: ins.arg, u: wt * n.s, n, ins });
    if (mx || my) { P.px += mx; P.py += my; const mag = Math.hypot(mx, my); mags += mag; if (mag > best) { best = mag; P.pace = ins.pace; } }
  });
  c.idle = fired === 0; c.torn = mags > 0.8 && Math.hypot(P.px, P.py) < 0.35 * mags; P.want = Math.hypot(P.px, P.py); if (P.stay && P.want < P.stay * 0.6) P.still = 1;      // having arrived, it stays unless something pulls harder
  return P; }
const toward = (w, c, o) => { const [dx, dy, d] = w.off(c, o); return { dx: dx / (d || 1), dy: dy / (d || 1), d, target: o }; };
const facing = (w, c) => { let best = null, bd = 1e9; for (const o of w.creatures) { if (o === c || !o.alive) continue; const [dx, dy, d] = w.off(c, o); if (d < S.NEAR + o.sz * 2 && (dx * c.hx + dy * c.hy) / (d || 1) > 0.7 && d < bd) { bd = d; best = o; } } return best; };
// the line of a trail of marks: the long axis of the marks in reach, taken the way the creature already faces
function trail(w, c, n) { let sxx = 0, sxy = 0, syy = 0, k = 0, cx = 0, cy = 0; const pts = []; for (const m of w.marks) { if (n.trail !== '*' && m.name !== n.trail) continue; const [ox, oy, d] = w.off(c, m); if (d < m.reach) { pts.push([ox, oy]); cx += ox; cy += oy; k++; } } if (!k) return [n.dx, n.dy];
  cx /= k; cy /= k; for (const [ox, oy] of pts) { sxx += (ox - cx) * (ox - cx); sxy += (ox - cx) * (oy - cy); syy += (oy - cy) * (oy - cy); } const th = 0.5 * Math.atan2(2 * sxy, sxx - syy); let ux = Math.cos(th), uy = Math.sin(th); if (ux * c.hx + uy * c.hy < 0) { ux = -ux; uy = -uy; } const off = cx * -uy + cy * ux; return [ux + -uy * off * 0.08, uy + ux * off * 0.08]; }

// ---- moods: raised, calmed and fading, each with its kick-in point and its functions
function feel(w, c, P) { const br = c.brain;
  for (const m of Object.keys(c.moods)) { const def = br.moods[m]; if (def.catching) for (const o of w.creatures) if (o !== c && o.alive && o.kind === c.kind && o.wasOn && o.wasOn[m] && S.canSee(w, c, o)) { P.up[m] = (P.up[m] || 0) + 0.05; break; } }      // a catching mood shows, and rises in those who see it
  for (const m of Object.keys(c.moods)) { const def = br.moods[m], up = P.up[m] || 0, down = P.down[m] || 0; let v = c.moods[m];
    if (def.rhythm) { c.phase[m] += (1 + (P.hurry[m] || 0)) / def.rhythm.period; v = 0.5 + 0.5 * Math.sin(TAU * c.phase[m]); }
    else if (c.fixed[m]) v = 1;
    else if (def.count) { if (up && !c.wasUp[m]) v += 1 / def.count + 1e-9; c.wasUp[m] = !!up; v -= down + LINGER[def.lingers || 'until calmed'] * v; }
    else v += up - down - (up ? 0 : LINGER[def.lingers || 'a while'] * v);
    v = clamp(v, 0, 1); const was = c.on[m]; c.on[m] = def.count ? v >= 1 - 1e-6 || (was && v > 0.5) : was ? v >= c.kick[m] - 0.1 : v >= c.kick[m]; c.moods[m] = v;
    if (c.on[m] !== was) moment(w, c, m + (c.on[m] ? ' just started' : ' just ended'));
    if (c.on[m] && def.forLife && !c.fixed[m]) { c.fixed[m] = true; if (def.forLife.form) c.becoming = { form: def.forLife.form, at: w.t + (def.forLife.after ?? 200) }; }      // for life: it never fades, and the body follows
    if (v < 0.03 && def.bond && def.lingers !== 'until calmed') delete c.bonds[m]; }
  if (c.becoming && w.t >= c.becoming.at) { const F = c.sp.forms && c.sp.forms[c.becoming.form]; c.form = c.becoming.form; c.becoming = null; if (F) { c.B = F.B || (F.B = bodyOf(Object.assign({}, c.sp.sheet, F.sheet))); c.hpMax = c.B.hp; c.store = c.B.store; grow(c); if (F.brain) { c.brain = F.brain; c.habit = F.brain.instincts.map(() => 1); c.fired = F.brain.instincts.map(() => -99); for (const k of Object.keys(F.brain.moods || {})) if (!(k in c.moods)) { c.moods[k] = 0; c.on[k] = false; c.kick[k] = KICK[F.brain.moods[k].kicks || 'kicks in at half']; c.phase[k] = 0; } } } } }

// ---- acts of the body
const TOUCH = 4, reachOf = (c, o) => (c.B.reach && o.B ? Math.max(c.B.reach, TOUCH) : TOUCH) + (o.sz || 0) * 2 + c.sz;      // whiskers feel farther than a body can reach
const inArc = (w, c, o, deg, rear) => { const [dx, dy, d] = w.off(c, o); if (c.B.round || d < 1e-6) return true; return Math.acos(clamp((rear ? -1 : 1) * (dx * c.hx + dy * c.hy) / d, -1, 1)) <= deg * Math.PI / 360; };
const release = (w, o) => { if (o.riding) { const h = o.riding; h.riders = h.riders.filter((r) => r !== o); o.riding = null; } o.locked = null; o.holding = false; };
function hurt(w, tg, by, dmg, how = 'just bitten') { tg.hp -= dmg; tg.fought = w.t; moment(w, tg, how, by, 4); if (by) { by.fought = w.t; learn(tg, 'one that hurt me', by.kind); for (const o of w.creatures) if (o !== tg && o.alive && o.kind === tg.kind && S.canSee(w, o, tg)) learn(o, 'one that hurt my kind', by.kind); if (!S.canSee(w, tg, by)) moment(w, tg, 'startled', by, 4); }
  reward(w, tg, 0.8); tg.resting = 0; if (tg.hp <= 0) die(w, tg, by); }
function die(w, c, by) { if (!c.alive) return; c.alive = false; c.pose = 'dead'; release(w, c); for (const r of c.riders.slice()) release(w, r); for (const it of c.carry) { it.held = null; it.x = c.x; it.y = c.y; } c.carry = []; for (const o of w.creatures) if (o.locked === c) o.locked = null;
  const body = w.item('the dead', c.x, c.y, { type: 'meat', left: Math.max(0.3, c.B.mass * (c.sz / c.B.size) * 0.8 + Math.max(0, c.energy) * 0.3), of: c.kind }); w.log.kills.push({ t: w.t, kind: c.kind, tag: c.tag, by: by ? by.kind : c.cause || 'want', byTag: by ? by.tag : null }); if (by) { moment(w, by, 'just killed', body, 6); by.kills = (by.kills || 0) + 1; } w.creatures = w.creatures.filter((o) => o !== c); }
function eat(w, c, it) { if (it.hard && !c.B.crack) return false; if (it.buried && !c.B.claws) return false; if (it.held && it.held !== c) return false; const bite = Math.min(it.left, 0.34), rich = it.rich ?? (it.kind === 'the dead' || it.kind === 'meat' || it.kind === 'egg' ? 1.4 : 1);
  it.left -= bite; c.energy = Math.min(c.store, c.energy + bite * rich * c.B.mealGain / 0.3); c.headDown = 6; c.biteCool = c.B.biteCool; c.meals++; w.log.meals++; moment(w, c, 'just ate', it, 6); reward(w, c, 1.15); if (it.of && it.of !== c.kind) learn(c, 'one that I ate', it.of);
  if (it.ill) { c.ill = 60; learn(c, 'one that made me ill', it.of || it.type); reward(w, c, 0.6); } const g = w.at(it.x, it.y, 'ground'); if (g && it.kind === 'plant') g.grazed = w.t; if (it.left <= 0.01) { w.take(it); c.carry = c.carry.filter((x) => x !== it); } return true; }
function bite(w, c, n) { const tg = n.target; if (!tg || c.biteCool > 0 || c.riding && c.riding !== tg && !c.locked) return; if (tg.B === undefined) { if (tg.kind && w.off(c, tg)[2] <= reachOf(c, tg) + 1) eat(w, c, tg); return; }
  if (!tg.alive) return; const [dx, dy, d] = w.off(c, tg); if (d > reachOf(c, tg)) return; const B = c.B;
  if (!inArc(w, c, tg, B.biteArc)) { if (B.club && inArc(w, c, tg, 140, true)) { c.biteCool = 8; shove(w, c, tg, 7); hurt(w, tg, c, 0.8 * (0.75 + B.organs.muscle * 1.25)); } return; }      // a club strikes what is behind it
  c.biteCool = B.biteCool; c.bites = (c.bites || 0) + 1; const side = tg.belly > 0 ? 'belly' : sideOf(tg, -dx, -dy), skin = tg.B.skin[side] || 'smooth'; if (skin === 'bristles') c.biteCool *= 2;      // a mouthful of bristle: slow to bite again
  if (tg.sz <= B.gape * 0.6 && skin !== 'spikes' && !tg.hiding) { c.energy = Math.min(c.store, c.energy + tg.B.mass * 0.5); c.meals++; moment(w, c, 'just ate', tg, 6); reward(w, c, 1.15); learn(c, 'one that I ate', tg.kind); hurt(w, tg, c, 99); return; }      // small enough to swallow
  let dmg = B.dmg * (B.claws ? 1.3 : 1) * (tg.hiding && tg.B.canWithdraw && tg.belly <= 0 ? 0.1 : 1) * (skin === 'shell' && !B.crack ? 0.2 : 1) * (skin === 'bristles' ? 0.8 : 1) * (skin === 'slime' ? 0.7 : 1);
  if (skin === 'spikes') { c.hp -= 0.3; moment(w, c, 'just bitten', tg, 4); reward(w, c, 0.8); if (c.hp <= 0) { die(w, c, tg); return; } }                                  // spikes wound the mouth that bites them
  if (side === 'front' && tg.B.horns && !tg.hiding) { c.hp -= 0.2; if (c.hp <= 0) { die(w, c, tg); return; } }
  if (B.horns && side !== 'back') { shove(w, c, tg, 9); tg.headDown = 0; if (tg.B.shellSides.includes('back') && tg.sz <= c.sz * 1.3 && !tg.B.holdsFast) tg.belly = 14; }      // horns push it off its food, and tip over a shelled animal
  moment(w, c, 'just bit', tg, 4); if (tg.B.shedTail && !tg.shedDone && (side === 'back') && tg.autoShed) shedTail(w, tg);
  if (B.locks && !c.locked && w.rnd() < HOLDS.jaws[skin]) { c.locked = tg; c.riding = tg; tg.riders.push(c); moment(w, tg, 'just grabbed', c, 4); }                       // locking jaws hold on
  hurt(w, tg, c, dmg); }
const shove = (w, c, tg, far) => { if (tg.B.holdsFast || tg.holding) return; const [dx, dy, d] = w.off(c, tg), k = far * clamp(c.B.mass / tg.B.mass, 0.3, 2) / (d || 1); tg.x += dx * k; tg.y += dy * k; tg.vx = tg.vy = 0; };
function shedTail(w, c) { if (!c.B.shedTail || c.shedDone) return false; c.shedDone = true; c.regrow = w.t + 1500; const tail = w.item('meat', c.x - c.hx * 3, c.y - c.hy * 3, { left: 0.25, of: c.kind, tail: true });
  for (const o of w.creatures) { if (o.locked === c || o.riding === c) { release(w, o); o.headDown = 12; o.biteCool = 12; o.busy = w.t + 45; o.tailOf = tail; } /* whatever held it is left busy with the tail */ if (o.carry.includes(c)) { o.carry = o.carry.filter((x) => x !== c); c.heldBy = null; o.headDown = 12; } } c.riders = []; return true; }
function sting(w, c, n) { const tg = n.target, B = c.B; if (!B.sting || c.stingCool > 0 || !tg || !tg.B || !tg.alive || w.off(c, tg)[2] > reachOf(c, tg) || !inArc(w, c, tg, 120, B.sting === 'rear')) return; c.stingCool = 80; const skin = tg.B.skin[sideOf(tg, -w.off(c, tg)[0], -w.off(c, tg)[1])];
  if (skin === 'shell' && !(tg.belly > 0)) return; tg.venom = 50; hurt(w, tg, c, 0.3, 'just bitten'); moment(w, c, 'just bit', tg, 4); }
function carryable(c, o) { return o.B === undefined ? ['plant', 'meat', 'egg', 'seed', 'material', 'the dead', 'food'].includes(o.kind) && (o.left ?? 1) <= 1.5 * c.B.mass + 0.5 : o.sz < c.sz * 0.8 || (o.kind === c.kind && o.age < o.grown); }
function grab(w, c, n) { let tg = n.target; if (!tg || c.carry.length >= c.B.carries) return; if (w.off(c, tg)[2] > reachOf(c, tg) + 1) return;
  if (tg.B && tg.carry.length && !(tg.kind === c.kind && tg.age < tg.grown)) { const it = tg.carry.pop(); it.held = c; c.carry.push(it); moment(w, tg, 'just grabbed', c, 4); return; }      // take what another is carrying
  if (!carryable(c, tg) || tg.held || tg.heldBy) return; if (tg.B) { if (tg.riding || tg.B.holdsFast || tg.holding) return; tg.heldBy = c; moment(w, tg, 'just grabbed', c, 4); } else { if (tg.buried && !c.B.claws) return; tg.held = c; tg.buried = false; } c.carry.push(tg); }
function drop(w, c, which) { const it = which || c.carry[c.carry.length - 1]; if (!it) return null; c.carry = c.carry.filter((x) => x !== it); if (it.B) { it.heldBy = null; it.x = c.x + c.hx * 2; it.y = c.y + c.hy * 2; } else { it.held = null; it.x = c.x; it.y = c.y; const lar = w.at(c.x, c.y, 'made'); it.kept = !!(lar && lar.type === 'a larder');
    if (it.kind === 'seed' && !it.sprout && !w.waterAt(c.x, c.y)) it.sprout = w.t + 400; } return it; }
function give(w, c, n) { const tg = n.target; if (!tg || !tg.B || !tg.alive || w.off(c, tg)[2] > reachOf(c, tg) + 1) return; const it = c.carry.find((x) => !x.B);
  if (it) { c.carry = c.carry.filter((x) => x !== it); if (['plant', 'meat', 'food', 'the dead', 'egg'].includes(it.kind) && tg.energy < tg.store * 0.9) { it.held = tg; tg.carry.push(it); eat(w, tg, it); if (it.left > 0.01 && tg.carry.length > tg.B.carries) drop(w, tg, it); } else { it.held = tg; tg.carry.push(it); } }
  else { const out = Math.min(c.energy - 0.25 * c.store, 0.06); if (out <= 0) return; c.energy -= out * (c.B.gland ? 0.5 : 1); tg.energy = Math.min(tg.store, tg.energy + out * (c.B.gland ? 2 : 0.7)); }      // a gland makes more of what it gives than a shared meal does
  moment(w, tg, 'just fed', c, 6); reward(w, tg, 1.15); learn(tg, 'one that fed me', c.kind); }
function tend(w, c, n) { const tg = n.target; if (!tg || w.off(c, tg)[2] > reachOf(c, tg) + 1) return; c.headDown = 3;
  if (tg.B) { if (!tg.alive) return; for (const r of tg.riders.slice()) if (r.kind !== tg.kind) { release(w, r); r.x += (w.rnd() - 0.5) * 6; r.y += (w.rnd() - 0.5) * 6; } if (tg.age < tg.grown) tg.age += 2; tg.hp = Math.min(tg.hpMax, tg.hp + 0.004); for (const m of Object.keys(tg.moods)) if (!tg.fixed[m] && !tg.brain.moods[m].rhythm) tg.moods[m] = Math.max(0, tg.moods[m] - 0.05); moment(w, tg, 'just tended', c, 6); reward(w, tg, 1.15); learn(tg, 'one that fed me', c.kind); }
  else if (tg.kind === 'egg') { if (tg.hatch) tg.hatch -= 2; tg.tended = w.t; } else if (tg.kind === 'plant') tg.left = Math.min(tg.cap || 2, tg.left + 0.006); else if (tg.kind === 'seed' && tg.sprout) tg.sprout -= 3; else tg.kept = true; }
function cling(w, c, n) { const tg = n.target, g = c.B.grip; if (!g || c.riding || c.holding) return; if (tg && tg.B && tg.alive) { if (w.off(c, tg)[2] > reachOf(c, tg) + 1 || tg === c) return; const [dx, dy] = w.off(c, tg), skin = tg.B.skin[sideOf(tg, -dx, -dy)] || 'smooth'; if (w.rnd() < HOLDS[g][skin]) { c.riding = tg; tg.riders.push(c); c.gripOn = skin; moment(w, tg, 'just grabbed', c, 4); } }
  else if (g !== 'arms' || (tg && tg.kind === 'ground')) { const gr = w.groundAt(c.x, c.y); if (g === 'suckers' ? ['rock', 'scree'].includes(gr) || !!w.waterAt(c.x, c.y) : ['thicket', 'tall grass', 'scrub'].includes(gr)) c.holding = true; } }      // suckers hold rock; hooks hold stems
function roll(w, c) { if (c.belly > 0 || c.rollCool > w.t) return; c.rollCool = w.t + 30; c.belly = 4; for (const r of c.riders.slice()) { release(w, r); if (c.B.spikeSides.includes('back') || c.B.mass > r.B.mass * 2) hurt(w, r, c, 0.5 * clamp(c.B.mass / r.B.mass, 0.5, 3)); r.x += (w.rnd() - 0.5) * 8; r.y += (w.rnd() - 0.5) * 8; } }
function hide(w, c) { const sh = w.shelterAt(c.x, c.y, c.sz * c.B.fits); if (c.B.canWithdraw || (sh && ['a burrow', 'a hollow', 'a crevice', 'a cave'].includes(sh.type))) c.hiding = 2; }
function lay(w, c, n) { const br = c.sp.breed; if (c.asleep || c.age < c.grown || c.spent || c.nextLay > w.t) return;
  if (br.way === 'splitting') { if (c.energy < 0.8 * c.store) return; c.energy *= 0.5; const k = spawn(w, c.sp, { x: c.x + 2, y: c.y, age: Math.round(c.grown * 0.5), home: c.home, family: c.family, form: c.form }); k.energy = c.energy; c.nextLay = w.t + 150 / c.B.tempo; c.laid++; moment(w, c, 'just laid', k, 6); return; }
  if (br.way === 'one breeder with helpers' && c.form !== (br.breeder || 'breeder') && !c.breeder) return; if (c.sex === 'male') return; if (br.way !== 'alone' && !c.gravid && !(br.mating === 'once and lay for life' && c.mated)) return; if (br.where === 'kept inside until they hatch' && w.t < c.gravid + 200 / c.B.tempo) return;
  const big = br.eggs === 'a few large', each = (big ? 0.5 : 0.14) * c.B.mass, all = br.lay === 'once, with everything', spend = all ? c.energy * 0.95 : Math.min(c.energy - 0.3 * c.store, c.B.clutch * (big ? 0.45 : 1.5) * each); let k = Math.floor(spend / (each * c.B.eggCost)); if (all) k = Math.max(k, 1); if (k < 1) return;
  c.energy -= Math.min(c.energy, k * each * c.B.eggCost); c.gravid = 0; c.nextLay = w.t + 300 / c.B.tempo; c.laid += k; const tg = n && n.target, on = tg && tg.B && tg !== c ? tg : null, nest = w.at(c.x, c.y, 'made');
  for (let i = 0; i < k; i++) { const mix = mixOf(w, c), sex = br.way === 'both sexes in one' ? 'both' : br.way === 'alone' ? 'female' : w.rnd() < (mix.male ?? 0.5) ? 'male' : 'female'; let form = null, r = w.rnd(); for (const [f, share] of Object.entries(mix.forms || {})) { if (r < share) { form = f; break; } r -= share; }
    const kid = { sp: c.sp, sex, form, home: c.home, family: c.family ?? c.id, start: big ? 0.35 : 0, energy: clamp(each * 0.9 / c.B.store, 0.08, 0.9) };      // a young one starts with what its egg held, and no more
    if (br.where === 'kept inside until they hatch') hatch(w, Object.assign(kid, { x: c.x + (w.rnd() - 0.5) * 4, y: c.y + (w.rnd() - 0.5) * 4 }));
    else { const at = br.hatch === 'wait for a season' ? (Math.floor(w.t / SEASON) + 1) * SEASON + Math.floor(w.rnd() * 40) : w.t + Math.round((big ? 260 : 160) / c.B.tempo); const egg = w.item('egg', c.x + (w.rnd() - 0.5) * 3, c.y + (w.rnd() - 0.5) * 3, Object.assign(kid, { of: c.kind, left: each / c.B.mass + 0.1, hatch: at, nest: nest && nest.type === 'a nest' ? nest : null })); if (on) { egg.held = on; on.carry.push(egg); egg.onHost = true; } } }
  moment(w, c, 'just laid', null, 6); if (all) c.spent = true; if (br.cost === 'the mother dies after laying') { c.cause = 'laying'; die(w, c, null); } }
const mixOf = (w, c) => { const br = c.sp.breed; for (const r of br.rule || []) if (holds(w, c, r.c || (r.c = cond(r.when)))) return r.mix; return br.mix || {}; };      // a rule on the mix: the first condition that holds decides
function hatch(w, e) { const k = spawn(w, e.sp, { x: e.x, y: e.y, age: 0, sex: e.sex, form: e.form, home: e.home, family: e.family, energy: e.energy }); k.age = Math.round(k.grown * (e.start || 0)); grow(k); return k; }
function mate(w, c, n) { const tg = n.target, br = c.sp.breed; if (!tg || !tg.B || tg.kind !== c.kind || !c.fertile || !tg.fertile || w.off(c, tg)[2] > reachOf(c, tg) + 1 || !tg.wants) return; if (br.way === 'alone' || br.way === 'splitting') return; if (c.sex !== 'both' && c.sex === tg.sex) return;
  for (const [a, b] of [[c, tg], [tg, c]]) { if (a.sex !== 'male') { a.gravid = w.t; a.mated = w.t; } moment(w, a, 'just mated', b, 6); reward(w, a, 1.15); a.fertile = false; a.nextMate = w.t + 60; if (a.sex === 'male' && br.cost === 'the father dies after mating') { a.cause = 'mating'; die(w, a, null); } } }
function mark(w, c, name) { if (c.markCool > 0) return; c.markCool = 4; const kind = (c.brain.signals || {})[name], k = kind === 'a mark that lasts' ? 1.5 : kind === 'a mark that fades soon' ? 0.2 : 1; w.mark(c, name || 'mark', c.B.markLasts * k, c.B.markReach); }
function wipe(w, c) { const n0 = w.marks.length; w.marks = w.marks.filter((m) => w.off(c, m)[2] > 8); return n0 - w.marks.length; }
function dig(w, c, n) { const gr = w.groundAt(c.x, c.y), soft = (GROUND[gr] || {}).digs || ['mud', 'bare ground', 'open grass', 'sand'].includes(gr); c.headDown = 3;
  for (const it of w.items) if (it.buried && w.off(c, it)[2] < 7 && (c.B.claws || w.rnd() < 0.03)) { it.buried = false; return; }                                 // buried food comes up
  if (!soft || w.waterAt(c.x, c.y) || w.shelterAt(c.x, c.y)) return; c.digging += (c.B.claws ? 3 : 0.6) * (0.6 + c.B.organs.muscle * 2); if (c.digging >= 60) { c.digging = 0; w.region('shelter', c.B.claws ? 'a burrow' : 'a hollow', c.x, c.y, 5 + c.sz * 2, { maxSize: c.sz * c.B.fits * 1.15, made: true, by: c.kind, home: c.home }); } }
function build(w, c, what) { const it = c.carry.find((x) => !x.B && x.kind === 'material'); if (!it) return; c.carry = c.carry.filter((x) => x !== it); w.take(it); const type = ['a nest', 'a wall', 'a larder'].includes(what) ? what : 'a nest', near = w.nearestRegion(c, (g) => g.kind === 'made' && g.type === type, 4);
  if (near) { near.g.r = Math.min(type === 'a wall' ? 30 : 14, near.g.r + 1.2); near.g.size = (near.g.size || 1) + 1; } else w.region('made', type, c.x, c.y, 4, { by: c.kind, home: c.home, size: 1, solid: type === 'a wall' }); }
function call(w, c, name) { if (c.callCool > 0) return; const names = c.names || (c.names = []); if (!names.includes(name)) { if (names.length >= c.B.calls) return; names.push(name); } c.callCool = 3; c.call = name; const kind = (c.brain.signals || {})[name]; w.call(c, name, c.B.callRange * (kind === 'a call heard far' ? 1.7 : kind === 'a call heard near' ? 0.45 : 1)); }

function act(w, c, P) { let used = false; c.wants = false; c.pose = null; P.urge.sort((a, b) => b.u - a.u);      // a pose lasts until its owner next acts, so that others have a beat in which to see it
  for (const { act, arg, u, n } of P.urge) { if (u < 0.5) continue;
    if (act === 'show') { c.show = arg; if (n.dx !== undefined) P.face = P.face || [n.dx, n.dy]; continue; } if (act === 'call') { call(w, c, arg); continue; } if (act === 'mark') { mark(w, c, arg); continue; } if (act === 'glow') { if (c.B.glow) c.glowing = 2; continue; }
    if (act === 'ping') { if (c.B.ping && c.callCool <= 0) { c.echo = w.t + 8; c.callCool = 10; w.call(c, 'ping', c.B.ping * 2.5); } continue; } if (act === 'puff up') { if (c.B.puff > 1) c.pose = 'puff'; continue; } if (act === 'crouch') { c.pose = 'crouch'; P.still = Math.max(P.still, 0.9); continue; }
    if (act === 'play dead') { c.pose = 'dead'; P.still = 1; continue; } if (act === 'let go') { release(w, c); continue; } if (act === 'spray') { if (c.B.ink && c.inkCool <= 0) { c.inkCool = 120; w.cloud(c.x, c.y, 18, 45); } continue; } if (act === 'shed') { shedTail(w, c); continue; }
    if (act === 'rest') { c.resting = 2; P.still = 1; continue; } if (act === 'hide') { hide(w, c); if (c.hiding) P.still = 1; continue; } if (act === 'mate') c.wants = true;
    if (used) continue; if (act === 'sting' && (!c.B.sting || c.stingCool > 0) || act === 'bite' && c.biteCool > 0 || act === 'grab' && c.carry.length >= c.B.carries || act === 'drop' && !c.carry.length || act === 'cling' && (!c.B.grip || c.riding)) continue;      // what cannot be done this beat does not use the beat up
    used = true; if (n.target && n.dx !== undefined && ['bite', 'sting', 'grab', 'give', 'tend', 'cling', 'mate'].includes(act) && !(act === 'sting' && c.B.sting === 'rear')) P.face = [n.dx, n.dy];      // it turns to what it acts on
    if (act === 'bite') bite(w, c, n); else if (act === 'sting') sting(w, c, n); else if (act === 'grab') grab(w, c, n); else if (act === 'drop') drop(w, c); else if (act === 'give') give(w, c, n); else if (act === 'tend') tend(w, c, n); else if (act === 'cling') cling(w, c, n);
    else if (act === 'roll') roll(w, c); else if (act === 'lay') lay(w, c, n); else if (act === 'mate') mate(w, c, n); else if (act === 'wipe') wipe(w, c); else if (act === 'dig') dig(w, c, n); else if (act === 'build') build(w, c, arg); else used = false; } }

// ---- moving: pace and stamina, footing, turning, water, currents, walls, riding and carrying
function move(w, c, P) { const B = c.B, t = w.t; if (c.heldBy) { const h = c.heldBy; if (!h.alive || !h.carry.includes(c)) c.heldBy = null; else { c.x = h.x; c.y = h.y; c.spd = 0; c.vx = c.vy = 0; if (h.B.pouch) c.hiding = 2; return; } }      // a young one in a pouch is out of sight and out of reach
  if (c.riding) { const h = c.riding; if (!h.alive) release(w, c); else { const skin = c.gripOn || 'smooth', hold = c.locked ? HOLDS.jaws[h.B.skin.back] ?? 1 : HOLDS[B.grip] ? HOLDS[B.grip][skin] : 0; if (h.spd > 0.8 * h.B.top && w.rnd() > 0.9 + 0.1 * hold) release(w, c); else { c.x = h.x - h.hx * 1.5; c.y = h.y - h.hy * 1.5; c.hx = h.hx; c.hy = h.hy; c.vx = h.vx; c.vy = h.vy; c.spd = 0; return; } } }
  const water = w.waterAt(c.x, c.y), depth = w.depthAt(c.x, c.y), gr = GROUND[w.groundAt(c.x, c.y)] || {}, foot = water ? (depth > 0.6 ? 'water' : 'shallows') : gr.foot || 'land', footing = B.footing[foot] ?? 0.5;
  let pace = P.pace; if (c.tired && pace === 'sprint' || B.noSprint && pace === 'sprint') pace = 'normal'; if (c.venom > 0) pace = 'creep';
  const still = c.belly > 0 || c.asleep || c.holding && P.want < 0.3 ? 1 : P.still, burst = pace === 'sprint' ? (foot === 'water' || foot === 'shallows' ? B.burstWater : B.burstLand) : 1, load = c.carry.reduce((a, it) => a + (it.B ? it.B.mass : (it.left ?? 1) * 0.4), 0) + c.riders.reduce((a, r) => a + r.B.mass, 0);
  const top = B.top * footing * burst * (gr.slow || 1) * (gr.drag ? 1 - gr.drag * clamp(c.sz - 0.7, 0, 1) : 1) * (c.age < c.grown ? 0.8 : 1) * clamp(1 - 0.35 * load / (B.mass * B.carries * (0.6 + B.organs.muscle * 2)), 0.3, 1) * (c.gravid && c.sp.breed.where === 'kept inside until they hatch' ? 0.8 : 1) * (c.heat < -0.6 ? 0.7 : 1);
  let want = P.want > 0.05 ? PACE[pace] * top * (1 - still) * Math.min(1, P.want * 2) : 0; if (c.holding && want > 0) c.holding = false;
  if (P.want > 0.05 || P.face) { const [tx, ty] = P.face || [P.px / P.want, P.py / P.want]; if (B.turn === undefined) { c.hx = tx; c.hy = ty; } else { const a0 = Math.atan2(c.hy, c.hx); let da = Math.atan2(ty, tx) - a0; da = Math.atan2(Math.sin(da), Math.cos(da)); const lim = B.turn * (c.spd > 0.6 * B.top ? 0.6 : 1), a = a0 + clamp(da, -lim, lim); c.hx = Math.cos(a); c.hy = Math.sin(a); if (Math.abs(da) > 1.2) want *= 0.5; } }
  c.spd += (want - c.spd) * (want > c.spd ? B.quick : 0.6); if (c.spd < 0.004) c.spd = 0; c.pace = pace; let nx = c.x + c.hx * c.spd, ny = c.y + c.hy * c.spd;
  const flow = w.flowAt(c.x, c.y); c.swept = false; if (flow && !c.holding && !B.holdsFast) { const push = Math.hypot(flow[0], flow[1]) * (1 - 0.75 * B.footing.water) * (depth > 0.3 ? 1 : 0.4); nx += flow[0] / (Math.hypot(flow[0], flow[1]) || 1) * push; ny += flow[1] / (Math.hypot(flow[0], flow[1]) || 1) * push; c.swept = push > c.spd + 0.05; }
  if (w.windy && B.burstLand > 1 && pace === 'sprint') { nx += w.wind[0] * 0.2; ny += w.wind[1] * 0.2; }
  const wall = w.at(nx, ny, 'made'); if (wall && wall.solid && w.at(c.x, c.y, 'made') !== wall) { nx = c.x; ny = c.y; c.spd = 0; }                                    // a wall stops what walks into it
  const sh = w.shelterAt(nx, ny); if (sh && sh.maxSize && c.sz * B.fits > sh.maxSize && w.shelterAt(c.x, c.y) !== sh) { nx = c.x; ny = c.y; c.spd = 0; }               // too big for the crevice
  for (const o of w.creatures) { if (o === c || !o.alive || o.sz <= c.sz || o.heldBy === c || c.heldBy === o || o.riding) continue; const reachIn = (o.sz + c.sz) * 0.9, d1 = Math.hypot(o.x - nx, o.y - ny); if (d1 < reachIn && d1 < Math.hypot(o.x - c.x, o.y - c.y)) { nx = c.x; ny = c.y; c.spd = 0; break; } }      // a body does not walk through a bigger one
  if (w.torus) { nx = (nx + w.size) % w.size; ny = (ny + w.size) % w.size; } else { nx = clamp(nx, 0, w.size); ny = clamp(ny, 0, w.size); }
  const moved = Math.hypot(nx - c.x, ny - c.y); c.vx = nx - c.x; c.vy = ny - c.y; c.x = nx; c.y = ny; c.stuck = P.want > 0.3 && still < 0.5 && moved < 0.03 ? c.stuck + 1 : 0;
  // stamina: a sprint spends it, and so does swimming badly or holding breath under water
  const swim = depth > 0.6 && B.footing.water < 0.6; c.under = depth > 0.6 && B.footing.water < 0.6 ? c.under + 1 : 0;
  if (pace === 'sprint' && c.spd > 0.5 * top) c.stamina -= (burst > 1 ? 1.6 : 1) / (70 * B.stam); else if (swim) c.stamina -= 1 / (B.dive * 1.2); else c.stamina = Math.min(1, c.stamina + (c.resting > 0 ? 0.03 : 0.008) * (c.heat > 0.7 ? 0.5 : 1));
  if (c.venom > 0) { c.venom--; c.stamina = Math.min(c.stamina, 0.2); } if (c.stamina <= 0) { c.stamina = 0; c.tired = true; if (swim) { c.cause = 'drowning'; c.hp -= 0.03; } } else if (c.stamina > 0.5) c.tired = false;
  for (const it of c.carry) { it.x = c.x; it.y = c.y; } }

// ---- living: energy, warmth, growing up, breeding, sleeping and dying
function live(w, c) { const B = c.B, br = c.sp.breed, x = c.x, y = c.y, adult = c.age >= c.grown;
  c.asleep = br.sleep === 'adults sleep through a season' && adult && w.season === br.sleepSeason; if (c.asleep) c.resting = 2;
  const wet = !!w.waterAt(x, y) || w.raining && !w.shelterAt(x, y), nest = w.at(x, y, 'made'), sheltered = !!w.shelterAt(x, y) || !!nest, felt = w.warmAt(x, y) + (B.warm - 0.15) * (w.warmAt(x, y) < 0 ? 1.6 : -0.4) - (wet ? 0.2 : 0) + (sheltered ? 0.15 : 0);
  let huddle = 0; if (felt < -0.2) for (const o of w.creatures) if (o !== c && o.alive && w.off(c, o)[2] < 4 + o.sz + c.sz) huddle += 0.12; c.heat += (clamp(felt + Math.min(0.4, huddle), -1, 1) - c.heat) * 0.03;
  const work = 0.5 + 1.3 * Math.pow(c.spd / (B.top || 1), 2); c.energy -= B.upkeep * 0.0005 * work * (c.resting > 0 ? 0.55 : 1) * (c.asleep ? 0.2 : 1) * (c.heat < -0.4 ? 1.6 : 1) * (c.age < c.grown ? 0.7 : 1) * (c.ill > 0 ? 2 : 1);
  if (c.ill > 0) c.ill--; if (c.energy <= 0) { c.energy = 0; c.cause = 'hunger'; c.hp -= 0.012; } else if (c.heat < -0.85) { c.cause = 'cold'; c.hp -= 0.006; } else if (c.heat > 0.92) { c.cause = 'heat'; c.hp -= 0.006; } else if (c.hp < c.hpMax && c.energy > 0.3 * c.store) c.hp = Math.min(c.hpMax, c.hp + (c.resting > 0 ? 0.004 : 0.001));
  const fire = w.fireNear(c, 0); if (fire) { c.cause = 'fire'; c.hp -= 0.05; }
  c.age += 1; if (!adult) grow(c); if (c.age > c.old && w.rnd() < 0.002) { c.cause = 'age'; c.hp = 0; }
  if (c.tailOf && c.busy <= w.t) { if (w.items.includes(c.tailOf)) { c.energy = Math.min(c.store, c.energy + c.tailOf.left); w.take(c.tailOf); } c.tailOf = null; }
  if (c.regrow && w.t > c.regrow) { c.shedDone = false; c.regrow = 0; } if (c.belly > 0) c.belly--; if (c.hiding > 0) c.hiding--; if (c.resting > 0) c.resting--; if (c.headDown > 0) c.headDown--; if (c.glowing > 0) c.glowing--;
  for (const k of ['biteCool', 'stingCool', 'inkCool', 'callCool', 'markCool']) if (c[k] > 0) c[k]--;
  const breeder = br.way !== 'one breeder with helpers' || c.form === (br.breeder || 'breeder') || c.breeder || c.sex === 'male';
  c.fertile = adult && !c.asleep && !c.spent && breeder && c.energy > 0.5 * c.store && (c.nextMate || 0) <= w.t && c.nextLay <= w.t && !c.gravid && (!br.season || w.season === br.season);
  if (c.gravid && br.where === 'kept inside until they hatch' && w.t >= c.gravid + 200 / B.tempo && !c.brain.instincts.some((i) => i.act === 'lay')) lay(w, c, null);
  if (c.hp <= 0) die(w, c, null); }

// eggs wait where they were laid, colder outside a nest, and hatch when their time comes
function eggs(w) { for (const e of w.items.slice()) { if (e.kind !== 'egg' || !e.hatch || !e.sp) continue; if (e.held && e.held.alive === false) e.held = null; if (e.held) { e.x = e.held.x; e.y = e.held.y; }
  if (w.freezing && !e.nest && !e.held && !w.shelterAt(e.x, e.y) && w.rnd() < 0.004) { w.take(e); continue; } if (w.t >= e.hatch) { w.take(e); if (e.held) e.held.carry = e.held.carry.filter((x) => x !== e); const k = hatch(w, e); if (e.onHost && e.held) { k.energy = k.store; hurt(w, e.held, k, 0.6); } } } }      // an egg laid on a host hatches fed, at the host's cost

function step(w) { for (const c of w.creatures) { c.shown = c.show; c.show = null; c.called = c.call; c.call = null; c.wasOn = Object.assign({}, c.on); }
  const plans = []; for (const c of w.creatures) if (c.alive) plans.push([c, c.asleep || c.busy > w.t || c.heldBy && c.age < c.grown * 0.2 ? { px: 0, py: 0, still: 1, pace: 'normal', face: null, urge: [], up: {}, down: {}, hurry: {}, want: 0 } : think(w, c)]);
  for (const [c, P] of plans) if (c.alive) feel(w, c, P); for (const [c, P] of plans) if (c.alive) act(w, c, P); for (const [c, P] of plans) if (c.alive) move(w, c, P); for (const [c] of plans) if (c.alive) live(w, c); eggs(w); w.tick(); }
const run = (w, beats, each) => { for (let i = 0; i < beats; i++) { step(w); if (each && each(w, i) === false) break; } return w; };
// what a keeper does to one creature
const keeper = { touch: (w, c) => { moment(w, c, 'keeper\'s touch', w.keeper, 6); reward(w, c, 1.15); }, treat: (w, c) => { c.energy = Math.min(c.store, c.energy + 0.3); moment(w, c, 'keeper\'s treat', w.keeper, 6); moment(w, c, 'just fed', w.keeper, 6); reward(w, c, 1.3); } };
module.exports = { I, cond, spawn, step, run, think, sense, holds, moment, hurt, die, hatch, keeper, BREED, VERBS, PACE, DIST, STR, RAISE, LINGER, KICK };
