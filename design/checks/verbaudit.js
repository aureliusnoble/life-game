// Verb audit for design/neural-blocks.md. NOT the game's simulation.
// Asks of each act: does it do something in the world that its nearest neighbour does not?
// Adds the body rules the acts depend on: pace and stamina, view arcs, a movement sense,
// bite arcs, turning limits, injury, attention while eating, clinging and poses.
// Run: node design/checks/verbaudit.js [scenario]

const PACE = { creep: 0.35, normal: 0.65, sprint: 1 };
const DIST = { close: 12, mid: 30, far: 55 };
const STR = { weak: 0.5, normal: 1, strong: 2 };
const JITTER = { tight: 1.5, medium: 0.6, wide: 0.12 };
const RAISE = { slowly: 0.008, normally: 0.06, quickly: 0.4 };
const LINGER = { briefly: 0.3, 'a while': 0.05, 'a long time': 0.008, 'until calmed': 0 };
const TOUCH = 4, NEAR = 15;
const STATES = ['coming at me', 'going away', 'looking at me', 'looking away', 'facing me', 'facing away', 'still', 'hurt', 'eating'];

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const I = (when, act, o = {}) => ({ when, act, str: o.str ?? 'normal', pace: o.pace ?? 'normal', dist: o.dist ?? 'mid', turn: o.turn ?? 'medium', in: o.in ?? [], notIn: o.notIn ?? [], speed: o.speed ?? 'normally' });

class World {
  constructor(size, seed, torus = false) { this.size = size; this.rnd = rng(seed); this.t = 0; this.torus = torus; this.creatures = []; this.plants = []; this.meat = []; this.marks = []; this.covers = []; this.light = 1; this.log = { kills: [], meals: 0 }; }
  add(kind, brain, o = {}) {
    const a = o.heading ?? this.rnd() * Math.PI * 2;
    const c = { kind, brain, tag: o.tag ?? kind, young: !!o.young, x: o.x ?? this.rnd() * this.size, y: o.y ?? this.rnd() * this.size, hx: Math.cos(a), hy: Math.sin(a),
      size: brain.size ?? 1, top: brain.top ?? 1, sight: brain.sight ?? 60, arc: ((brain.arc ?? 360) * Math.PI) / 180, feel: brain.feel ?? 0,
      hp: o.hp ?? brain.hp ?? 1, hpMax: brain.hp ?? 1, energy: 0.8 * (brain.store ?? 1), stamina: 1, tired: false, alive: true, moods: {}, on: {}, headDown: 0, watching: false, pose: null,
      riding: null, riders: 0, spd: 0, pace: 'normal', vx: 0, vy: 0, biteCool: 0, wx: Math.cos(a), wy: Math.sin(a), side: this.rnd() < 0.5 ? 1 : -1, id: this.creatures.length, meals: 0 };
    for (const m of Object.keys(brain.moods ?? {})) { c.moods[m] = 0; c.on[m] = false; }
    this.creatures.push(c); return c;
  }
  off(a, b) { let dx = b.x - a.x, dy = b.y - a.y; if (this.torus) { const h = this.size / 2; if (dx > h) dx -= this.size; else if (dx < -h) dx += this.size; if (dy > h) dy -= this.size; else if (dy < -h) dy += this.size; } return [dx, dy, Math.hypot(dx, dy)]; }
  // Sight: within range and inside the view arc. Eating keeps the head down; watching reaches farther.
  canSee(c, o) { const [dx, dy, d] = this.off(c, o); let R = c.sight * (c.watching ? 1.6 : 1) * (c.brain.nightEyes ? 1 : this.light); if (c.headDown > 0 && !c.watching) R = Math.min(R, NEAR); if (o.brain && o.brain.camo && o.spd < 0.05) R *= o.brain.camo; if (d >= R) return false;
    if (o.brain && this.covers.length) { const pc = this.coverOf(o); if (pc && d > NEAR && !(d < 30 && this.coverOf(c) === pc)) return false; }
    if (c.arc < 6.28 && !c.watching) { const cs = (dx * c.hx + dy * c.hy) / (d || 1); if (Math.acos(Math.max(-1, Math.min(1, cs))) > c.arc / 2) return false; } return true; }
  // The movement sense: all round, but only things that are moving, and not things that creep.
  canFeel(c, o) { if (!c.feel || o.spd < 0.05 || o.pace === 'creep' || o.brain.silent) return false; return this.off(c, o)[2] < c.feel * (o.pace === 'sprint' ? 2 : 1); }
  isA(c, o, cat) { if (o === c || !o.alive || o.pose === 'dead') return false; const kin = o.kind === c.kind, sz = o.size * (o.pose === 'puff' ? 1.6 : 1);
    return cat === 'my kind' ? kin : cat === 'adult' ? kin && !o.young : cat === 'bigger creature' ? !kin && sz > c.size * 1.2 : cat === 'smaller creature' ? !kin && sz < c.size * 0.8 && sz >= c.size * (c.brain.minPrey ?? 0) : cat === 'movement' || cat === 'creature' ? !kin : false; }
  state(c, o, st) { const [dx, dy, d] = this.off(c, o); const toward = -(o.vx * dx + o.vy * dy) / (d || 1);
    if ((st === 'facing me' || st === 'facing away') && o.brain.falseEyes) return st === 'facing me';
    if (st === 'facing me' || st === 'facing away') { const inArc = o.arc >= 6.28 || Math.acos(Math.max(-1, Math.min(1, -(dx * o.hx + dy * o.hy) / (d || 1)))) <= o.arc / 2; return st === 'facing me' ? inArc : !inArc; }
    return st === 'still' ? o.spd < 0.05 : st === 'coming at me' ? toward > 0.2 : st === 'going away' ? toward < -0.2 : st === 'looking at me' ? this.canSee(o, c) : st === 'looking away' ? !this.canSee(o, c) : st === 'hurt' ? o.hp < o.hpMax : st === 'eating' ? o.headDown > 0 : false; }
  notice(c, when) {
    const sp = when.indexOf(' '), verb = sp < 0 ? when : when.slice(0, sp); let what = sp < 0 ? '' : when.slice(sp + 1);
    if (verb === 'always') return { s: 1 };
    if (verb === 'sometimes') return { s: ((Math.floor(this.t / 25) * 7 + c.id * 13) % 10) < 3 ? 1 : 0 }; // bouts of 25 beats, about a third of the time
    if (verb === 'am') return { s: what === 'hungry' ? 1 - c.energy : what === 'tired' ? (c.tired ? 1 : 0) : what in c.moods ? c.moods[what] : 0 };
    if (verb === 'smell' && (what === 'plant' || (this.foods && this.foods.includes(what)))) { const R = c.brain.nose ?? 0; let best = null, bd = R;
      for (const o of this.plants) { if (what === 'plant' ? !((c.brain.diet && typeof c.brain.diet === 'object' ? c.brain.diet[o.type ?? 'plant'] ?? 0 : 1) > 0) : o.type !== what) continue; const d = this.off(c, o)[2]; if (d < bd) { bd = d; best = o; } }
      if (!best) return { s: 0 }; const [dx, dy, d0] = this.off(c, best); return { s: Math.max(0.05, 1 - bd / R), dx: dx / (d0 || 1), dy: dy / (d0 || 1), d: d0, target: best }; }
    if (verb === 'smell') { let w = 0, cx = 0, cy = 0; for (const m of this.marks) if (m.type === what) { const [ox, oy, d] = this.off(c, m); if (d < 40) { const k = 1 - d / 40; w += k; cx += ox * k; cy += oy * k; } }
      if (w < 0.02) return { s: 0 }; const d = Math.hypot(cx / w, cy / w) || 1; return { s: Math.min(1, w / 2), dx: cx / w / d, dy: cy / w / d, d, trail: what }; }
    if (verb === 'see' && what === 'cover') { let best = null, bd = 160; for (const p of this.covers) { if (p.maxSize && c.size > p.maxSize) continue; const d = Math.max(0, this.off(c, p)[2] - p.r * 0.5); if (d < bd) { bd = d; best = p; } }
      if (!best) return { s: 0 }; const [dx, dy, d0] = this.off(c, best); return { s: 1, dx: dx / (d0 || 1), dy: dy / (d0 || 1), d: bd, target: best }; }
    if (verb === 'see' && what === 'land') { if (!this.inWater(c)) return { s: 0 }; const [dx, dy, d] = this.off(this.pond, c); return { s: 1, dx: dx / (d || 1), dy: dy / (d || 1), d: this.pond.r - d }; }
    let st = null, sel = null; for (const s of STATES) if (what.endsWith(' ' + s)) { st = s; what = what.slice(0, -s.length - 1); }
    if (what.startsWith('weakest ')) { sel = 'weakest'; what = what.slice(8); }
    const reach = (o) => verb === 'touch' ? this.off(c, o)[2] < (c.brain.reach ?? TOUCH) : verb === 'near' ? this.canSee(c, o) && this.off(c, o)[2] < NEAR : verb === 'far' ? this.canSee(c, o) && this.off(c, o)[2] >= NEAR : verb === 'feel' ? this.canFeel(c, o) : this.canSee(c, o);
    let list;
    const eats = (o) => (c.brain.diet && typeof c.brain.diet === 'object' ? c.brain.diet[o.type ?? 'plant'] ?? 0 : 1) > 0;
    if (what === 'meat') list = this.meat.filter((o) => reach(o));
    else if (what === 'plant' || (this.foods && this.foods.includes(what))) list = this.plants.filter((o) => (what === 'plant' ? eats(o) : o.type === what) && (verb === 'touch' || !o.buried) && reach(o));
    else list = this.creatures.filter((o) => this.isA(c, o, what) && reach(o) && (!st || this.state(c, o, st)));
    if (!list.length) return { s: 0 };
    const key = (o) => sel === 'weakest' ? o.hp / o.hpMax * 1000 + this.off(c, o)[2] : this.off(c, o)[2];
    const best = list.reduce((a, b) => (key(b) < key(a) ? b : a)); const [dx, dy, d0] = this.off(c, best), d = d0 || 1e-6;
    return { s: verb === 'see' || verb === 'far' ? Math.max(0.05, 1 - d / c.sight) : 1, dx: dx / d, dy: dy / d, d: d0, target: best };
  }
  inWater(c) { return !!this.pond && this.off(this.pond, c)[2] < this.pond.r; }
  coverOf(o) { for (const p of this.covers) if (this.off(p, o)[2] < p.r) return p; return null; }
  holds(c, f) { return f in c.moods ? c.on[f] : f === 'hungry' ? c.energy <= 0.5 * (c.brain.store ?? 1) : f === 'in water' ? this.inWater(c) : f === 'covered' ? !!this.coverOf(c) : f === 'dark' ? this.light < 0.5 : f === 'tired' ? c.tired : false; }
  step() {
    const plans = [];
    for (const c of this.creatures) {
      if (!c.alive) continue; c.watching = !!c.watchNext; c.watchNext = false; c.pose = null;
      let px = 0, py = 0, still = 0, bestW = 0, pace = 'normal', face = null; const urge = {}, up = {}, down = {};
      for (const ins of c.brain.instincts) {
        if (!ins.in.every((f) => this.holds(c, f)) || ins.notIn.some((f) => this.holds(c, f))) continue;
        const n = this.notice(c, ins.when); if (n.s <= 0) continue;
        const w = STR[ins.str], pull = w * (0.4 + 0.6 * n.s), act = ins.act, D = DIST[ins.dist]; let mx = 0, my = 0, moved = true;
        if (act === 'approach' && n.dx !== undefined) { mx = n.dx * pull; my = n.dy * pull; }
        else if (act === 'move away' && n.dx !== undefined) { mx = -n.dx * pull; my = -n.dy * pull; }
        else if (act === 'stay near' && n.dx !== undefined) { if (n.d > D) { mx = n.dx * pull; my = n.dy * pull; } }
        else if (act === 'keep apart' && n.dx !== undefined) { if (n.d < D) { const k = w * (1 - n.d / D) * 2; mx = -n.dx * k; my = -n.dy * k; } }
        else if (act === 'circle' && n.dx !== undefined) { mx = -n.dy * c.side * pull; my = n.dx * c.side * pull; }
        else if (act === 'go the same way' && n.target && n.target.hx !== undefined) { mx = n.target.hx * w; my = n.target.hy * w; }
        else if (act === 'head off' && n.target && n.target.vx !== undefined) { const lead = n.d / (c.top * PACE[ins.pace] || 1); const ax = n.dx * n.d + n.target.vx * lead, ay = n.dy * n.d + n.target.vy * lead, am = Math.hypot(ax, ay) || 1; mx = (ax / am) * pull; my = (ay / am) * pull; }
        else if (act === 'get behind' && n.target && n.target.hx !== undefined) { const back = 9; const ax = n.dx * n.d - n.target.hx * back, ay = n.dy * n.d - n.target.hy * back, am = Math.hypot(ax, ay);
          // swing wide around its side instead of walking through its view
          const ahead = n.dx * n.target.hx + n.dy * n.target.hy < 0.3; if (ahead) { mx = (-n.dy * c.side * 0.9 - n.dx * 0.1) * pull; my = (n.dx * c.side * 0.9 - n.dy * 0.1) * pull; } else if (am > 1) { mx = (ax / am) * pull; my = (ay / am) * pull; } }
        else if (act === 'go along' && n.trail) { let sxx = 0, sxy = 0, syy = 0, w0 = 0, cx = 0, cy = 0; const pts = [];
          for (const m of this.marks) if (m.type === n.trail) { const [ox, oy, d] = this.off(c, m); if (d < 40) { pts.push([ox, oy]); cx += ox; cy += oy; w0++; } }
          cx /= w0; cy /= w0; for (const [ox, oy] of pts) { sxx += (ox - cx) * (ox - cx); sxy += (ox - cx) * (oy - cy); syy += (oy - cy) * (oy - cy); }
          const th = 0.5 * Math.atan2(2 * sxy, sxx - syy); let ux = Math.cos(th), uy = Math.sin(th); if (ux * c.hx + uy * c.hy < 0) { ux = -ux; uy = -uy; }
          const off = cx * -uy + cy * ux; mx = (ux + -uy * off * 0.08) * pull; my = (uy + ux * off * 0.08) * pull; }
        else if (act === 'wander') { const a = (this.rnd() - 0.5) * JITTER[ins.turn]; const cs = Math.cos(a), sn = Math.sin(a); [c.wx, c.wy] = [c.wx * cs - c.wy * sn, c.wx * sn + c.wy * cs]; mx = c.wx * w * 0.6; my = c.wy * w * 0.6; }
        else { moved = false;
          if (act === 'hold still') still = Math.max(still, Math.min(1, w * n.s));
          else if (act === 'watch') { still = 1; c.watchNext = true; if (n.dx !== undefined) face = [n.dx, n.dy]; }
          else if (act === 'face' && n.dx !== undefined) { face = [n.dx, n.dy]; still = 1; }
          else if (act === 'puff up') c.pose = 'puff';
          else if (act.startsWith('raise ')) up[act.slice(6)] = (up[act.slice(6)] ?? 0) + RAISE[ins.speed];
          else if (act.startsWith('calm ')) down[act.slice(5)] = (down[act.slice(5)] ?? 0) + RAISE[ins.speed];
          else { const u = w * n.s; if (!urge[act] || u > urge[act].u) urge[act] = { u, n }; } }
        if (moved && (mx || my)) { px += mx; py += my; const mag = Math.hypot(mx, my); if (mag > bestW) { bestW = mag; pace = ins.pace; } }
      }
      plans.push({ c, px, py, still, pace, face, urge, up, down });
    }
    for (const { c, px, py, still, pace, face, urge, up, down } of plans) {
      if (!c.alive) continue;
      for (const m of Object.keys(c.moods)) { const def = c.brain.moods[m]; const fade = up[m] ? 0 : LINGER[def.lingers] * c.moods[m];
        c.moods[m] = Math.max(0, Math.min(1, c.moods[m] + (up[m] ?? 0) - (down[m] ?? 0) - fade)); c.on[m] = c.on[m] ? c.moods[m] >= 0.4 : c.moods[m] >= 0.5; }
      if (c.headDown > 0) c.headDown--; if (c.biteCool > 0) c.biteCool--;
      for (const [act, { u, n }] of Object.entries(urge)) { if (u < 0.5) continue;
        if (act === 'bite' && n.target && c.biteCool === 0) { const tg = n.target;
          if (tg.alive !== undefined) { const [dx, dy, d] = this.off(c, tg), cl = (v) => Math.acos(Math.max(-1, Math.min(1, v)));
            const fwd = (c.brain.biteDir === 'rear' ? -1 : 1) * (dx * c.hx + dy * c.hy) / (d || 1);
            const ok = (!c.brain.biteArc || cl(fwd) <= (c.brain.biteArc * Math.PI) / 360) && tg.size <= (c.brain.gape ?? Infinity);
            if (ok && tg.alive) { c.biteCool = c.brain.biteCool ?? 5;
              const rear = cl((dx * tg.hx + dy * tg.hy) / (d || 1)), within = (arc) => !!arc && rear <= (arc * Math.PI) / 360; // 0 = attacker directly behind the target
              if (within(tg.brain.spikes) && --c.hp <= 0) { c.alive = false; this.log.kills.push({ t: this.t, by: tg.tag, who: c.tag }); }
              if (within(tg.brain.shell) && !c.brain.crack) this.log.blocked = (this.log.blocked ?? 0) + 1;
              else if ((tg.hp -= c.brain.dmg ?? 1) <= 0) { tg.alive = false; this.log.kills.push({ t: this.t, by: c.tag, who: tg.tag }); if (c.brain.killGain) { c.energy = Math.min(c.brain.store ?? 1, c.energy + c.brain.killGain); c.meals++; } } } }
          else if (c.brain.diet !== 'meat' || this.meat.includes(tg)) { const arr = this.plants.includes(tg) ? this.plants : this.meat; const i = arr.indexOf(tg); const eff = arr === this.plants && c.brain.diet && typeof c.brain.diet === 'object' ? c.brain.diet[tg.type ?? 'plant'] ?? 0 : 1;
            // With `leftovers` on, an animal takes only what it has room for and leaves the rest of the plant; otherwise a plant is one meal for any body.
            if (i >= 0 && eff > 0) { const gain = (c.brain.mealGain ?? 0.3) * eff, left = tg.left ?? 1, take = this.leftovers ? Math.max(0, Math.min(left, ((c.brain.store ?? 1) - c.energy) / gain)) : left;
              if (take > 0) { if (take < left - 0.02) tg.left = left - take; else arr.splice(i, 1); c.energy = Math.min(c.brain.store ?? 1, c.energy + gain * take); c.headDown = this.headDownBeats ?? 8; c.meals++; this.log.meals++; } } } }
        else if (act === 'cling' && n.target && !c.riding) { c.riding = n.target; n.target.riders++; } }
      if (c.riding) { const h = c.riding; if (!h.alive) { c.riding = null; h.riders = 0; } else { c.x = h.x - h.hx * 5; c.y = h.y - h.hy * 5; c.vx = h.vx; c.vy = h.vy; c.spd = h.spd; c.pace = 'creep'; continue; } }
      // movement: strength gives direction and effort, pace gives speed, stamina limits sprinting
      let m = Math.hypot(px, py), dx = m ? px / m : c.hx, dy = m ? py / m : c.hy; let effort = Math.min(1, m) * (1 - still);
      let p = pace; if ((c.tired || c.brain.noSprint) && p === 'sprint') p = 'normal';
      let speed = c.top * effort * PACE[p] * (c.tired ? 0.7 : 1) * (c.hp < c.hpMax ? 0.6 : 1) * (1 - 0.12 * c.riders) * (this.inWater(c) ? c.brain.water ?? 1 : c.brain.land ?? 1) * (this.drag ? this.drag(c) : 1);
      if (effort < 0.02 && face) { dx = face[0]; dy = face[1]; }
      if (c.brain.turn) { const cur = Math.atan2(c.hy, c.hx), want = Math.atan2(dy, dx); let diff = ((want - cur + Math.PI * 3) % (Math.PI * 2)) - Math.PI; diff = Math.max(-c.brain.turn, Math.min(c.brain.turn, diff)); c.hx = Math.cos(cur + diff); c.hy = Math.sin(cur + diff); dx = c.hx; dy = c.hy; }
      else if (effort > 0.02 || face) { c.hx = dx; c.hy = dy; }
      c.vx = dx * speed; c.vy = dy * speed; c.spd = speed; c.pace = p;
      if (this.torus) { c.x = (c.x + c.vx + this.size) % this.size; c.y = (c.y + c.vy + this.size) % this.size; } else { c.x = Math.max(0, Math.min(this.size, c.x + c.vx)); c.y = Math.max(0, Math.min(this.size, c.y + c.vy)); }
      for (const pc of this.covers) if (pc.maxSize && c.size > pc.maxSize) { const [ox, oy, od] = this.off(pc, c); if (od < pc.r) { c.x = pc.x + (ox / (od || 1)) * pc.r; c.y = pc.y + (oy / (od || 1)) * pc.r; } }
      if (p === 'sprint' && speed > 0.3) c.stamina -= 0.01 / (c.brain.stam ?? 1); else c.stamina = Math.min(1, c.stamina + (speed < 0.05 ? 0.006 : 0.002));
      if (c.stamina <= 0) c.tired = true; else if (c.stamina > 0.3) c.tired = false;
      c.energy = Math.max(0, c.energy - 0.0012 * (c.brain.upkeep ?? 1));
      if (this.starve && c.energy <= 0) { c.alive = false; this.log.starved = (this.log.starved ?? 0) + 1; }
    }
    this.t++;
  }
}
const row = (name, ...cells) => console.log('  ' + name.padEnd(46), '| ' + cells.join(' | '));

// ---------------------------------------------------------------- scenarios
// 1. Chase or follow. Prey sprints from anything coming at it; nobody can sprint for long.
function chaseOrFollow() {
  const prey = { size: 0.5, top: 1, sight: 45, instincts: [I('see bigger creature coming at me', 'move away', { str: 'strong', pace: 'sprint' }), I('always', 'wander', { str: 'weak' })] };
  const bite = I('touch smaller creature', 'bite');
  const designs = {
    'chase: approach, sprinting': [I('see smaller creature', 'approach', { str: 'strong', pace: 'sprint' }), bite],
    'follow: stay near at a walk, sprint only when near': [I('see smaller creature', 'stay near', { str: 'strong', dist: 'close' }), I('near smaller creature', 'approach', { str: 'strong', pace: 'sprint' }), bite],
    'walk straight at it, never sprinting': [I('see smaller creature', 'approach', { str: 'strong' }), bite],
  };
  console.log('\n1. CHASE OR FOLLOW  (1 hunter, 1 prey with the same top speed, open wrapped plain, 3000 beats, 60 runs)');
  for (const [name, instincts] of Object.entries(designs)) { let caught = 0; const times = [], tired = [];
    for (let seed = 1; seed <= 60; seed++) { const w = new World(260, seed, true); w.add('prey', prey, { x: 130, y: 130 }); const h = w.add('hunter', { size: 1, top: 1, sight: 80, instincts }, { x: 130 + 40, y: 130 }); let tb = 0;
      while (w.t < 3000 && !w.log.kills.length) { w.step(); if (h.tired) tb++; } if (w.log.kills.length) { caught++; times.push(w.t); } tired.push(tb / w.t); }
    row(name, `caught ${String(caught).padStart(2)}/60`, `beats to catch ${mean(times).toFixed(0)}`, `hunter exhausted ${(100 * mean(tired)).toFixed(0)}% of the time`); }
}

// 2. Approach or head off. Prey crosses the plain in a straight line, faster than the hunter.
function headOff() {
  const prey = { size: 0.5, top: 1.15, sight: 0, instincts: [I('always', 'wander', { str: 'strong', turn: 'wide', pace: 'sprint' })] };
  const bite = I('touch smaller creature', 'bite');
  const designs = { 'approach': [I('see smaller creature', 'approach', { str: 'strong', pace: 'sprint' }), bite], 'head off': [I('see smaller creature', 'head off', { str: 'strong', pace: 'sprint' }), bite] };
  console.log('\n2. APPROACH OR HEAD OFF  (4 hunters, 1 prey crossing at 1.15x their speed, open wrapped plain, 600 beats, 150 runs)');
  for (const [name, instincts] of Object.entries(designs)) { let caught = 0;
    for (let seed = 1; seed <= 150; seed++) { const w = new World(300, seed, true); const p = w.add('prey', prey); p.stamina = 99;
      for (let i = 0; i < 4; i++) { const h = w.add('hunter', { size: 1, top: 1, sight: 90, instincts }); h.stamina = 99; }
      while (w.t < 600 && !w.log.kills.length) w.step(); if (w.log.kills.length) caught++; }
    row(name, `caught ${String(caught).padStart(3)}/150`); }
}

// 3. Stalking. Prey sees in a 240 degree arc ahead and feels nearby movement that is not creeping.
function stalking() {
  const preys = {
    'plain prey': { instincts: [I('see bigger creature', 'move away', { str: 'strong' }), I('near bigger creature', 'move away', { str: 'strong', pace: 'sprint' }), I('feel movement', 'move away', { str: 'strong' }), I('always', 'wander', { str: 'weak', turn: 'wide' })] },
    'wary prey (sprints once alarmed)': { moods: { Scared: { lingers: 'a while' } }, instincts: [I('see bigger creature', 'raise Scared', { speed: 'quickly' }), I('feel movement', 'raise Scared', { speed: 'quickly' }),
      I('see bigger creature', 'move away', { str: 'strong', pace: 'sprint', in: ['Scared'] }), I('feel movement', 'move away', { str: 'strong', pace: 'sprint', in: ['Scared'] }), I('always', 'wander', { str: 'weak', turn: 'wide' })] },
  };
  preys['wary prey that sometimes watches'] = { moods: preys['wary prey (sprints once alarmed)'].moods, instincts: [I('sometimes', 'watch', { str: 'strong', notIn: ['Scared'] }), ...preys['wary prey (sprints once alarmed)'].instincts] };
  const bite = I('touch smaller creature', 'bite'), creepIn = [I('near smaller creature', 'approach', { str: 'strong', pace: 'creep' }), I('far smaller creature facing away', 'approach', { str: 'strong' })], hold = I('see smaller creature facing me', 'keep apart', { str: 'strong', dist: 'far' });
  const designs = {
    'approach, sprinting': [I('see smaller creature', 'approach', { str: 'strong', pace: 'sprint' }), bite],
    'approach at a walk': [I('see smaller creature', 'approach', { str: 'strong' }), bite],
    'approach, creeping': [I('see smaller creature', 'approach', { str: 'strong', pace: 'creep' }), bite],
    'wait far off until it faces away, then walk in and creep': [...creepIn, hold, bite],
    'get behind it, then walk in and creep': [...creepIn, I('see smaller creature facing me', 'get behind', { str: 'strong' }), hold, bite],
    'circle while it faces me, then walk in and creep': [...creepIn, I('see smaller creature facing me', 'circle', { str: 'strong' }), hold, bite],
  };
  console.log('\n3. STALKING  (1 hunter starting 80 away, 1 prey as fast as it, open wrapped plain, 2500 beats, 60 runs)');
  for (const [pn, pb] of Object.entries(preys)) for (const [name, instincts] of Object.entries(designs)) { let caught = 0; const times = [];
    for (let seed = 1; seed <= 60; seed++) { const w = new World(300, seed, true); const a = w.rnd() * Math.PI * 2; w.add('prey', { size: 0.5, top: 1, sight: 50, arc: 240, feel: 14, ...pb }, { x: 150, y: 150 }); w.add('hunter', { size: 1, top: 1, sight: 110, instincts }, { x: 150 + Math.cos(a) * 80, y: 150 + Math.sin(a) * 80 });
      while (w.t < 2500 && !w.log.kills.length) w.step(); if (w.log.kills.length) { caught++; times.push(w.t); } }
    row(pn + ': ' + name, `caught ${String(caught).padStart(2)}/60`, `beats ${mean(times).toFixed(0)}`); }
}

// 4. Where to attack from, and whether the prey turns on its attackers. Big prey bites only what is in front of it and turns slowly.
function flanking() {
  const big = (how) => ({ size: 2, top: 0.5, hp: 10, sight: 60, arc: 200, biteArc: 100, turn: 0.05, instincts: [...(how ? [I('near smaller creature', how, { str: 'strong' })] : []), I('touch smaller creature', 'bite'), I('always', 'wander', { str: 'weak' })] });
  const bite = I('touch bigger creature', 'bite');
  const designs = {
    'approach and bite': [I('see bigger creature', 'approach', { str: 'strong' }), bite],
    'circle while closing in, and bite': [I('see bigger creature', 'approach'), I('near bigger creature', 'circle', { str: 'strong' }), bite],
    'circle while it faces me, approach when it faces away': [I('see bigger creature facing me', 'circle', { str: 'strong' }), I('see bigger creature facing me', 'stay near', { dist: 'close' }), I('see bigger creature facing away', 'approach', { str: 'strong' }), bite],
    'get behind, approach from there, and bite': [I('see bigger creature facing me', 'get behind', { str: 'strong' }), I('see bigger creature facing away', 'approach', { str: 'strong' }), bite],
  };
  console.log('\n4. WHERE TO ATTACK FROM  (5 attackers with 2 hit points, big prey with 10 that bites only ahead and turns slowly, 2500 beats, 80 runs)');
  for (const [pn, how] of [['prey ignores them', null], ['prey stops and faces the nearest', 'face'], ['prey approaches the nearest', 'approach']]) for (const [name, instincts] of Object.entries(designs)) { let kills = 0; const lost = [], times = [];
    for (let seed = 1; seed <= 80; seed++) { const w = new World(200, seed); const p = w.add('prey', big(how), { x: 100, y: 100, tag: 'prey' });
      for (let i = 0; i < 5; i++) w.add('pack', { size: 1, top: 1, sight: 200, hp: 2, instincts });
      while (w.t < 2500 && p.alive && w.creatures.some((c) => c.kind === 'pack' && c.alive)) w.step();
      if (!p.alive) { kills++; times.push(w.t); } lost.push(w.creatures.filter((c) => c.kind === 'pack' && !c.alive).length); }
    row(pn + ': ' + name, `prey killed ${String(kills).padStart(2)}/80`, `attackers lost ${mean(lost).toFixed(1)}`, `beats ${mean(times).toFixed(0)}`); }
}

// 5. Following a trail of scent marks to food at its far end.
function trail() {
  const designs = { 'smell Trail -> approach': [I('smell Trail', 'approach'), I('see plant', 'approach', { str: 'strong' }), I('touch plant', 'bite')], 'smell Trail -> go along': [I('smell Trail', 'go along'), I('see plant', 'approach', { str: 'strong' }), I('touch plant', 'bite')] };
  console.log('\n5. FOLLOWING A TRAIL  (a 260-long curved trail of marks from the start to food, sight 25, 1500 beats, 60 runs)');
  for (const [name, instincts] of Object.entries(designs)) { let reached = 0; const times = [];
    for (let seed = 1; seed <= 60; seed++) { const w = new World(320, seed); const bend = (w.rnd() - 0.5) * 120;
      for (let i = 0; i <= 52; i++) { const f = i / 52; w.marks.push({ type: 'Trail', x: 30 + f * 260, y: 160 + Math.sin(f * Math.PI) * bend }); }
      w.plants.push({ x: 296, y: 160 }); const c = w.add('k', { top: 1, sight: 25, instincts }, { x: 30, y: 160, heading: 0 });
      while (w.t < 1500 && !c.meals) w.step(); if (c.meals) { reached++; times.push(w.t); } }
    row(name, `reached the food ${String(reached).padStart(2)}/60`, `beats ${mean(times).toFixed(0)}`); }
}

// 6. Approach or stay near: living off a dangerous animal's leftovers.
function shadowing() {
  const giant = { size: 2, top: 0.45, sight: 30, instincts: [I('touch smaller creature', 'bite'), I('always', 'wander', { str: 'strong', turn: 'medium' })] };
  const eat = [I('see meat', 'approach', { str: 'strong' }), I('touch meat', 'bite')];
  const designs = { 'approach the big one': [I('see bigger creature', 'approach'), ...eat], 'stay near the big one (mid)': [I('see bigger creature', 'stay near', { dist: 'mid' }), ...eat], 'ignore it and wander': [I('always', 'wander'), ...eat], 'keep apart from it (close) and wander': [I('see bigger creature', 'keep apart', { str: 'strong', dist: 'close' }), I('always', 'wander'), ...eat],
    'stay near it (mid) and keep apart (close)': [I('see bigger creature', 'stay near', { dist: 'mid' }), I('see bigger creature', 'keep apart', { str: 'strong', dist: 'close' }), ...eat] };
  console.log('\n6. APPROACH OR STAY NEAR  (6 scavengers with sight 60, a big animal that bites what touches it and drops meat that rots in 120 beats, 4000 beats, 40 runs)');
  for (const [name, instincts] of Object.entries(designs)) { const meals = [], lost = [];
    for (let seed = 1; seed <= 40; seed++) { const w = new World(260, seed); const g = w.add('giant', giant, { x: 130, y: 130 });
      for (let i = 0; i < 6; i++) w.add('scav', { size: 1, top: 1, sight: 60, instincts });
      while (w.t < 4000) { w.step(); if (w.t % 60 === 0) w.meat.push({ x: g.x - g.hx * 14, y: g.y - g.hy * 14, born: w.t }); w.meat = w.meat.filter((m) => w.t - m.born < 120); }
      meals.push(w.log.meals / 6); lost.push(w.creatures.filter((c) => c.kind === 'scav' && !c.alive).length); }
    row(name, `meals each ${mean(meals).toFixed(1)}`, `scavengers lost ${mean(lost).toFixed(1)} of 6`); }
}

// 7. Move away or keep apart: feeding in a patch that a dangerous animal walks through.
function givingGround() {
  const roamer = { size: 2, top: 0.45, sight: 30, instincts: [I('touch smaller creature', 'bite'), I('always', 'wander', { str: 'strong' })] };
  const eat = [I('see plant', 'approach'), I('touch plant', 'bite'), I('always', 'wander', { str: 'weak' })];
  const designs = { 'no reaction': eat, 'move away on sight': [...eat, I('see bigger creature', 'move away', { str: 'strong' })], 'keep apart (close)': [...eat, I('see bigger creature', 'keep apart', { str: 'strong', dist: 'close' })], 'keep apart (mid)': [...eat, I('see bigger creature', 'keep apart', { str: 'strong', dist: 'mid' })] };
  console.log('\n7. MOVE AWAY OR KEEP APART  (8 grazers in a 140x140 food patch with 2 big animals wandering through, 4000 beats, 40 runs)');
  for (const [name, instincts] of Object.entries(designs)) { const meals = [], lost = [];
    for (let seed = 1; seed <= 40; seed++) { const w = new World(140, seed); for (let i = 0; i < 2; i++) w.add('roamer', roamer); for (let i = 0; i < 8; i++) w.add('grazer', { size: 1, top: 1, sight: 60, instincts });
      for (let i = 0; i < 20; i++) w.plants.push({ x: w.rnd() * 140, y: w.rnd() * 140 });
      while (w.t < 4000) { w.step(); if (w.plants.length < 20 && w.rnd() < 0.2) w.plants.push({ x: w.rnd() * 140, y: w.rnd() * 140 }); }
      meals.push(w.log.meals / 8); lost.push(w.creatures.filter((c) => c.kind === 'grazer' && !c.alive).length); }
    row(name, `meals each ${mean(meals).toFixed(1)}`, `grazers lost ${mean(lost).toFixed(1)} of 8`); }
}

// 8. Wander tight, medium or wide: food comes in patches far apart.
function searching() {
  const eat = [I('see plant', 'approach', { str: 'strong' }), I('touch plant', 'bite')];
  const designs = {
    'always tight': { instincts: [...eat, I('always', 'wander', { turn: 'tight' })] }, 'always medium': { instincts: [...eat, I('always', 'wander', { turn: 'medium' })] }, 'always wide': { instincts: [...eat, I('always', 'wander', { turn: 'wide' })] },
    'tight just after eating, wide otherwise': { moods: { Searching: { lingers: 'a while' } }, instincts: [...eat, I('touch plant', 'raise Searching', { speed: 'quickly' }), I('always', 'wander', { turn: 'tight', in: ['Searching'] }), I('always', 'wander', { turn: 'wide', notIn: ['Searching'] })] },
  };
  console.log('\n8. WANDER TIGHT, MEDIUM OR WIDE  (10 foragers, sight 14, food in 5 small patches on a 400x400 wrapped plain, 5000 beats, 30 runs)');
  for (const [name, d] of Object.entries(designs)) { const meals = [];
    for (let seed = 1; seed <= 30; seed++) { const w = new World(400, seed, true); const patches = Array.from({ length: 5 }, () => [w.rnd() * 400, w.rnd() * 400]);
      const grow = () => { const [px, py] = patches[Math.floor(w.rnd() * 5)]; const a = w.rnd() * Math.PI * 2, r = w.rnd() * 22; w.plants.push({ x: (px + Math.cos(a) * r + 400) % 400, y: (py + Math.sin(a) * r + 400) % 400 }); };
      for (let i = 0; i < 40; i++) grow(); for (let i = 0; i < 10; i++) w.add('k', { top: 1, sight: 14, ...d });
      while (w.t < 5000) { w.step(); if (w.plants.length < 40 && w.rnd() < 0.08) grow(); } meals.push(w.log.meals / 10); }
    row(name, `meals each ${mean(meals).toFixed(1)}`); }
}

// 9. Hold still or move away, against a hunter that sees and a hunter that only feels movement.
function freezing() {
  const hunters = { 'hunter that sees': { size: 1, top: 1, sight: 70, instincts: [I('see smaller creature', 'approach', { str: 'strong' }), I('touch smaller creature', 'bite'), I('always', 'wander', { str: 'weak' })] },
    'hunter that only feels movement': { size: 1, top: 1, sight: 0, feel: 45, instincts: [I('feel movement', 'approach', { str: 'strong' }), I('touch smaller creature', 'bite'), I('always', 'wander')] } };
  const preys = { 'moves away': [I('see bigger creature', 'move away', { str: 'strong' }), I('always', 'wander', { str: 'weak' })], 'holds still': [I('see bigger creature', 'hold still', { str: 'strong' }), I('always', 'wander', { str: 'weak' })] };
  console.log('\n9. HOLD STILL OR MOVE AWAY  (6 prey at 0.8x the hunter\'s speed, 2 hunters, 200x200 arena, 3000 beats, 40 runs)');
  for (const [hn, hb] of Object.entries(hunters)) for (const [pn, instincts] of Object.entries(preys)) { const lost = [];
    for (let seed = 1; seed <= 40; seed++) { const w = new World(200, seed); for (let i = 0; i < 2; i++) w.add('hunter', hb); for (let i = 0; i < 6; i++) w.add('prey', { size: 0.5, top: 0.8, sight: 60, instincts });
      while (w.t < 3000) w.step(); lost.push(w.log.kills.length); }
    row(hn + ', prey ' + pn, `prey lost ${mean(lost).toFixed(1)} of 6`); }
}

// 10. Stay near or cling: slow young, a fast parent, and a hunter between their speeds.
function riding() {
  const hunter = { size: 1.5, top: 0.8, sight: 80, instincts: [I('see smaller creature', 'approach', { str: 'strong' }), I('touch smaller creature', 'bite'), I('always', 'wander', { str: 'weak' })] };
  const adult = { size: 1, top: 1, sight: 60, instincts: [I('see bigger creature', 'move away', { str: 'strong' }), I('always', 'wander', { str: 'weak' })] };
  const youngs = { 'young stay near the adult': [I('see adult', 'stay near', { str: 'strong', dist: 'close' }), I('see bigger creature', 'move away')], 'young cling to the adult': [I('see adult', 'approach', { str: 'strong' }), I('touch adult', 'cling')] };
  console.log('\n10. STAY NEAR OR CLING  (3 adults each with 2 young at half their speed, 2 hunters at 0.8x adult speed, 250x250 arena, 3000 beats, 40 runs)');
  for (const [name, instincts] of Object.entries(youngs)) { const yl = [], al = [];
    for (let seed = 1; seed <= 40; seed++) { const w = new World(250, seed); for (let i = 0; i < 2; i++) w.add('hunter', hunter, { x: w.rnd() * 250, y: 10 });
      for (let i = 0; i < 3; i++) { const a = w.add('k', adult, { x: 60 + i * 60, y: 200 }); for (let j = 0; j < 2; j++) w.add('k', { size: 0.6, top: 0.5, sight: 60, instincts }, { x: a.x + j * 6 - 3, y: a.y + 5, young: true }); }
      while (w.t < 3000) w.step(); yl.push(w.creatures.filter((c) => c.young && !c.alive).length); al.push(w.creatures.filter((c) => c.kind === 'k' && !c.young && !c.alive).length); }
    row(name, `young lost ${mean(yl).toFixed(1)} of 6`, `adults lost ${mean(al).toFixed(1)} of 3`); }
}

// 11. Watching. Eating keeps the head down. The hunter rushes prey that has not seen it and tires after a short sprint.
function watching() {
  const hunter = { size: 1.5, top: 1, sight: 90, instincts: [I('near smaller creature', 'approach', { str: 'strong', pace: 'sprint' }), I('far smaller creature eating', 'approach', { str: 'strong' }), I('touch smaller creature', 'bite'), I('always', 'wander', { str: 'weak' })] };
  const base = [I('see bigger creature', 'move away', { str: 'strong', pace: 'sprint' }), I('see plant', 'approach'), I('touch plant', 'bite'), I('always', 'wander', { str: 'weak' })];
  const designs = { 'never watches': base, 'sometimes watches': [I('sometimes', 'watch', { str: 'strong' }), ...base] };
  console.log('\n11. WATCHING  (8 grazers at 0.8x the hunter\'s speed, 2 hunters that walk up on prey that is eating and sprint when close, plenty of food, open wrapped plain, 4000 beats, 40 runs)');
  for (const long of [false, true]) for (const [name, instincts] of Object.entries(designs)) { const lost = [], meals = [];
    for (let seed = 1; seed <= 40; seed++) { const w = new World(260, seed, true); w.headDownBeats = long ? 30 : 8; for (let i = 0; i < 2; i++) w.add('hunter', hunter); for (let i = 0; i < 8; i++) w.add('grazer', { size: 0.6, top: 0.8, sight: 45, instincts });
      for (let i = 0; i < 90; i++) w.plants.push({ x: w.rnd() * 260, y: w.rnd() * 260 });
      while (w.t < 4000) { w.step(); if (w.plants.length < 90 && w.rnd() < 0.5) w.plants.push({ x: w.rnd() * 260, y: w.rnd() * 260 }); }
      lost.push(w.log.kills.length); meals.push(w.log.meals / 8); }
    row((long ? 'long meals (head down 30 beats): ' : 'short meals (head down 8 beats): ') + name, `grazers lost ${mean(lost).toFixed(1)} of 8`, `meals each ${mean(meals).toFixed(1)}`); }
}

// 12. Nearest or weakest: healthy prey outrun the hunters, hurt prey do not.
function weakest() {
  const prey = { size: 0.5, top: 1.05, sight: 45, hp: 2, instincts: [I('see bigger creature', 'move away', { str: 'strong' }), I('always', 'wander', { str: 'weak' })] };
  const bite = I('touch smaller creature', 'bite');
  const designs = { 'approach the nearest': [I('see smaller creature', 'approach', { str: 'strong' }), bite, I('always', 'wander')], 'approach the weakest': [I('see weakest smaller creature', 'approach', { str: 'strong' }), bite, I('always', 'wander')] };
  console.log('\n12. NEAREST OR WEAKEST  (3 hunters, 18 prey that outrun them of which 5 are hurt and slowed, open wrapped plain, 2500 beats, 40 runs)');
  for (const [name, instincts] of Object.entries(designs)) { const hits = [];
    for (let seed = 1; seed <= 40; seed++) { const w = new World(300, seed, true); for (let i = 0; i < 18; i++) w.add('prey', prey, { hp: i < 5 ? 1 : 2 }); for (let i = 0; i < 3; i++) w.add('hunter', { size: 1, top: 1, sight: 80, instincts });
      while (w.t < 2500) w.step(); hits.push(w.log.kills.length); }
    row(name, `prey killed ${mean(hits).toFixed(1)}`); }
}

// 13. Puffing up: a hunter that attacks smaller creatures and avoids bigger ones.
function bluffing() {
  const hunter = { size: 1.3, top: 1, sight: 70, instincts: [I('see smaller creature', 'approach', { str: 'strong' }), I('touch smaller creature', 'bite'), I('see bigger creature', 'move away', { str: 'strong' }), I('always', 'wander', { str: 'weak' })] };
  const designs = { 'moves away': [I('see bigger creature', 'move away', { str: 'strong' }), I('always', 'wander', { str: 'weak' })], 'puffs up and stays': [I('see creature', 'puff up'), I('always', 'wander', { str: 'weak' })] };
  console.log('\n13. PUFFING UP  (6 prey at 0.8x the hunter\'s speed, 2 hunters that attack smaller and avoid bigger, 200x200 arena, 3000 beats, 40 runs)');
  for (const [name, instincts] of Object.entries(designs)) { const lost = [];
    for (let seed = 1; seed <= 40; seed++) { const w = new World(200, seed); for (let i = 0; i < 2; i++) w.add('hunter', hunter); for (let i = 0; i < 6; i++) w.add('prey', { size: 0.9, top: 0.8, sight: 60, instincts });
      while (w.t < 3000) w.step(); lost.push(w.log.kills.length); }
    row(name, `prey lost ${mean(lost).toFixed(1)} of 6`); }
}

module.exports = { World, I, mean, row, rng };
const all = [chaseOrFollow, headOff, stalking, flanking, trail, shadowing, givingGround, searching, freezing, riding, watching, weakest, bluffing];
if (require.main === module) { const only = process.argv[2]; for (const f of all) if (!only || f.name === only) f(); }
