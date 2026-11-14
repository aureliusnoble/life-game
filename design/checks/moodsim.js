// Design check for design/neural-blocks.md. NOT the game's simulation.
// A minimal interpreter for the moods / instincts / signals language, plus a few
// scenarios that test whether the doc's worked examples behave as claimed.
// Run: node design/checks/moodsim.js

// Each step is roughly ten times the last, so one setting covers reflexes and another covers rituals.
const RAISE = { slowly: 0.008, normally: 0.06, quickly: 0.4 };
const LINGER = { briefly: 0.3, 'a while': 0.05, 'a long time': 0.008, 'until calmed': 0 };
const KICK = { low: 0.2, half: 0.5, high: 0.8 };
const STRENGTH = { weak: 0.5, normal: 1, strong: 2 };
const TOUCH = 4;

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
// An instinct: when <notice> -> do <act>, optionally only in / not in some feelings.
const I = (when, act, o = {}) => ({ when, act, str: o.str ?? 'normal', in: o.in ?? [], notIn: o.notIn ?? [], speed: o.speed ?? 'normally' });

class World {
  constructor(size, seed, torus = false) {
    this.size = size; this.rnd = rng(seed); this.t = 0; this.dark = 0; this.torus = torus;
    this.creatures = []; this.plants = []; this.marks = []; this.calls = []; this.eggs = []; this.covers = [];
    this.log = { catches: [], matings: [], lays: [] };
  }
  add(kind, brain, o = {}) {
    const a = this.rnd() * Math.PI * 2;
    const c = {
      kind, brain, tag: o.tag ?? kind, x: o.x ?? this.rnd() * this.size, y: o.y ?? this.rnd() * this.size,
      hx: Math.cos(a), hy: Math.sin(a), size: brain.size ?? 1, speed: brain.speed ?? 1, sight: brain.sight ?? 60,
      sex: o.sex ?? 'none', energy: 0.8, alive: true, hp: brain.hp ?? 1, biteCool: 0, show: null, fertile: o.sex === 'female', gravid: false, cool: 0,
      moods: {}, on: {}, about: {}, wx: Math.cos(a), wy: Math.sin(a), side: this.rnd() < 0.5 ? 1 : -1,
    };
    for (const m of Object.keys(brain.moods ?? {})) { c.moods[m] = 0; c.on[m] = false; }
    this.creatures.push(c); return c;
  }
  // Offset from a to b (wrapped on a torus world).
  off(a, b) {
    let dx = b.x - a.x, dy = b.y - a.y;
    if (this.torus) { const h = this.size / 2; if (dx > h) dx -= this.size; else if (dx < -h) dx += this.size; if (dy > h) dy -= this.size; else if (dy < -h) dy += this.size; }
    return [dx, dy, Math.hypot(dx, dy)];
  }
  // What a creature notices: strength 0..1 and, for things in the world, a direction.
  notice(c, when) {
    const sp = when.indexOf(' '); const verb = sp < 0 ? when : when.slice(0, sp); const what = sp < 0 ? '' : when.slice(sp + 1);
    if (verb === 'always') return { s: 1 };
    if (verb === 'feel') return { s: this.feeling(c, what) };
    if (verb === 'hear') {
      let best = null, bd = 150;
      for (const k of this.calls) if (k.type === what && k.from !== c) { const d = this.off(c, k)[2]; if (d < bd) { bd = d; best = k; } }
      if (!best) return { s: 0 };
      const [hx, hy] = this.off(c, best);
      return { s: 1 - bd / 150, dx: hx / (bd || 1), dy: hy / (bd || 1), d: bd };
    }
    if (verb === 'smell') {
      let w = 0, cx = 0, cy = 0; const R = 80;
      for (const m of this.marks) if (m.type === what) { const [ox, oy, d] = this.off(c, m); if (d < R) { const k = m.str * (1 - d / R); w += k; cx += ox * k; cy += oy * k; } }
      if (w < 0.02) return { s: 0 };
      const dx = cx / w, dy = cy / w, d = Math.hypot(dx, dy) || 1;
      return { s: Math.min(1, w / 2), dx: dx / d, dy: dy / d, d };
    }
    const range = verb === 'touch' ? TOUCH : verb === 'near' ? 15 : c.sight;
    const isA = (o, cat) => this.isA(c, o, cat);
    if (what === 'my group' || verb === 'many') { // several of a kind, taken together
      const cat = verb === 'many' ? what : 'my kind';
      const near = this.creatures.filter((o) => isA(o, cat)).map((o) => [o, ...this.off(c, o)]).filter((e) => e[3] < c.sight).sort((a, b) => a[3] - b[3]).slice(0, 6);
      if (!near.length || (verb === 'many' && near.length < 3)) return { s: 0 };
      const gx = mean(near.map((e) => e[1])), gy = mean(near.map((e) => e[2])), gd = Math.hypot(gx, gy) || 1e-6;
      const hx = mean(near.map((e) => e[0].hx)), hy = mean(near.map((e) => e[0].hy));
      return { s: verb === 'many' ? 1 : 1 - gd / c.sight, dx: gx / gd, dy: gy / gd, d: gd, target: { hx, hy } };
    }
    let best = null, bd = range;
    const consider = (o, d) => { if (d < bd) { bd = d; best = o; } };
    if (what === 'plant') for (const p of this.plants) consider(p, this.off(c, p)[2]);
    else if (what === 'cover') for (const p of this.covers) consider(p, Math.max(0, this.off(c, p)[2] - p.r));
    else for (const o of this.creatures) if (isA(o, what)) consider(o, this.off(c, o)[2]);
    if (!best) return { s: 0 };
    const [dx, dy, d0] = this.off(c, best); const d = d0 || 1e-6;
    return { s: verb === 'see' ? 1 - bd / range : 1, dx: dx / d, dy: dy / d, d: bd, target: best };
  }
  isA(c, o, cat) {
    if (o === c || !o.alive) return false; const kin = o.kind === c.kind;
    if (cat.startsWith('my ') && cat.endsWith(' one')) return c.about[cat.slice(3, -4)] === o; // the creature a mood is about
    return cat === 'my kind' ? kin : cat === 'male' ? kin && o.sex === 'male' : cat === 'female' ? kin && o.sex === 'female'
      : cat === 'male showing' ? kin && o.sex === 'male' && !!o.show : cat === 'bigger creature' ? !kin && o.size > c.size * 1.2
      : cat === 'smaller creature' ? !kin && o.size < c.size * 0.8 : false;
  }
  feeling(c, f) {
    if (f in c.moods) return c.moods[f];
    if (f === 'hungry') return 1 - c.energy; if (f === 'dark') return this.dark;
    if (f === 'female') return c.sex === 'female' ? 1 : 0; if (f === 'male') return c.sex === 'male' ? 1 : 0;
    if (f === 'fertile') return c.fertile ? 1 : 0; if (f === 'gravid') return c.gravid ? 1 : 0;
    if (f === 'covered') return this.covers.some((p) => this.off(c, p)[2] < p.r) ? 1 : 0;
    return 0;
  }
  holds(c, f) { return f in c.moods ? c.on[f] : this.feeling(c, f) >= 0.5; }
  step() {
    const plans = [];
    for (const c of this.creatures) {
      if (!c.alive) continue;
      let px = 0, py = 0, still = 0; const urge = {}; const up = {}; const down = {};
      for (const ins of c.brain.instincts) {
        if (!ins.in.every((f) => this.holds(c, f)) || ins.notIn.some((f) => this.holds(c, f))) continue;
        const n = this.notice(c, ins.when); if (n.s <= 0) continue;
        const w = STRENGTH[ins.str]; const pull = w * (0.4 + 0.6 * n.s);
        const sp = ins.act.indexOf(' '); const act = ins.act; const arg = sp < 0 ? '' : act.slice(sp + 1);
        if (act === 'approach' && n.dx !== undefined) { px += n.dx * pull; py += n.dy * pull; }
        else if (act === 'move away' && n.dx !== undefined) { px -= n.dx * pull; py -= n.dy * pull; }
        else if (act === 'keep apart' && n.dx !== undefined) { const space = c.sight * 0.35; if (n.d < space) { const k = w * (1 - n.d / space) * 2; px -= n.dx * k; py -= n.dy * k; } }
        else if (act === 'stay near' && n.dx !== undefined) { if (n.d > c.sight * 0.25) { px += n.dx * pull; py += n.dy * pull; } }
        else if (act === 'circle' && n.dx !== undefined) { px += -n.dy * c.side * pull; py += n.dx * c.side * pull; }
        else if (act === 'go the same way' && n.target && n.target.hx !== undefined) { px += n.target.hx * w; py += n.target.hy * w; }
        else if (act === 'wander') { const a = (this.rnd() - 0.5) * 0.8; const cs = Math.cos(a), sn = Math.sin(a); [c.wx, c.wy] = [c.wx * cs - c.wy * sn, c.wx * sn + c.wy * cs]; px += c.wx * w * 0.6; py += c.wy * w * 0.6; }
        else if (act === 'hold still') still = Math.max(still, Math.min(1, w * n.s));
        else if (act.startsWith('raise ')) {
          if (c.brain.moods[arg].about) {
            if (!n.target) continue;
            if (c.moods[arg] < 0.05 || !c.about[arg] || !c.about[arg].alive) c.about[arg] = n.target;
            const b = c.about[arg]; const sp2 = ins.when.indexOf(' '); const verb = ins.when.slice(0, sp2), cat = ins.when.slice(sp2 + 1);
            const reach = verb === 'touch' ? TOUCH : verb === 'near' ? 15 : c.sight;
            if (!this.isA(c, b, cat) || this.off(c, b)[2] >= reach) continue;
          }
          up[arg] = (up[arg] ?? 0) + RAISE[ins.speed] * (0.4 + 0.6 * n.s);
        }
        else if (act.startsWith('calm ')) down[arg] = (down[arg] ?? 0) + RAISE[ins.speed] * (0.4 + 0.6 * n.s);
        else { const u = w * n.s; if (!urge[act] || u > urge[act].u) urge[act] = { u, n }; }
      }
      plans.push({ c, px, py, still, urge, up, down });
    }
    this.calls = this.calls.filter((k) => --k.ttl > 0);
    for (const c of this.creatures) c.show = null;
    const wantMate = new Set();
    for (const { c, px, py, still, urge, up, down } of plans) {
      for (const m of Object.keys(c.moods)) {
        const def = c.brain.moods[m];
        const fade = up[m] ? 0 : LINGER[def.lingers] * c.moods[m]; // fades only while nothing is raising it
        c.moods[m] = Math.max(0, Math.min(1, c.moods[m] + (up[m] ?? 0) - (down[m] ?? 0) - fade));
        const th = KICK[def.kicksIn ?? 'half']; c.on[m] = c.on[m] ? c.moods[m] >= th - 0.1 : c.moods[m] >= th;
      }
      for (const [act, { u, n }] of Object.entries(urge)) {
        if (u < 0.5) continue;
        if (act === 'bite' && n.target) {
          if (n.target.alive !== undefined) {
            if (c.biteCool === 0 && n.target.alive) { c.biteCool = 5; if (--n.target.hp <= 0) { n.target.alive = false; this.log.catches.push({ t: this.t, by: c.tag, who: n.target.tag }); } }
          }
          else { const i = this.plants.indexOf(n.target); if (i >= 0) { this.plants.splice(i, 1); c.energy = Math.min(1, c.energy + 0.3); } }
        } else if (act.startsWith('call ')) this.calls.push({ x: c.x, y: c.y, type: act.slice(5), from: c, ttl: 3 });
        else if (act.startsWith('mark ')) this.marks.push({ x: c.x, y: c.y, type: act.slice(5), str: Math.min(1, u) * 0.5 });
        else if (act.startsWith('show ')) c.show = act.slice(5);
        else if (act === 'mate') { wantMate.add(c); c.mateWith = n.target; }
        else if (act === 'lay' && c.gravid) { c.gravid = false; c.cool = 150; this.eggs.push({ x: c.x, y: c.y }); this.log.lays.push({ t: this.t, x: c.x, y: c.y }); }
      }
      let m = Math.hypot(px, py); let vx = px, vy = py; if (m > 1) { vx /= m; vy /= m; m = 1; }
      const sp = c.speed * (1 - still);
      if (this.torus) { c.x = (c.x + vx * sp + this.size) % this.size; c.y = (c.y + vy * sp + this.size) % this.size; }
      else { c.x = Math.max(0, Math.min(this.size, c.x + vx * sp)); c.y = Math.max(0, Math.min(this.size, c.y + vy * sp)); }
      if (m > 0.05) { c.hx = vx / m; c.hy = vy / m; }
      c.energy = Math.max(0, c.energy - 0.0015); if (c.biteCool > 0) c.biteCool--;
      if (c.cool > 0 && --c.cool === 0 && c.sex === 'female') c.fertile = true;
    }
    for (const f of wantMate) if (f.sex === 'female' && f.fertile) {
      for (const m of wantMate) if (m.sex === 'male' && m.kind === f.kind && f.mateWith === m && this.off(f, m)[2] <= TOUCH) { // she mates with the one her instinct picked
        f.fertile = false; f.gravid = true; this.log.matings.push({ t: this.t, male: m.tag }); break;
      }
    }
    for (const m of this.marks) m.str *= 0.997; this.marks = this.marks.filter((m) => m.str > 0.02);
    this.t++;
  }
}

// ---------------------------------------------------------------- scenarios

// 1a. Small fast prey on an open (wrapped) plain: does calling the pack together help?
function fastPrey() {
  const base = [I('see smaller creature', 'approach'), I('touch smaller creature', 'bite'), I('always', 'wander', { str: 'weak' })];
  const hunting = { moods: { Hunting: { lingers: 'briefly' } } };
  const recruit = [I('see smaller creature', 'raise Hunting', { speed: 'quickly' }), I('hear Prey!', 'approach', { notIn: ['Hunting'] }), I('always', 'call Prey!', { in: ['Hunting'] })];
  const designs = {
    'A. chase on sight, no signals': { ...hunting, instincts: base },
    'B. + call "Prey!", others come to the caller': { ...hunting, instincts: [...base, ...recruit] },
    'C. B + keep apart and circle while Hunting': { ...hunting, instincts: [...base, ...recruit, I('see my kind', 'keep apart', { in: ['Hunting'] }), I('see smaller creature', 'circle', { in: ['Hunting'], str: 'weak' })] },
  };
  const prey = { size: 0.5, speed: 0.9, sight: 45, instincts: [I('see bigger creature', 'move away', { str: 'strong' }), I('always', 'wander', { str: 'weak' })] };
  console.log('\n1a. SMALL FAST PREY  (6 hunters scattered, 1 prey at 0.9x their speed, open wrapped plain, 1500 beats, 100 runs)');
  for (const [name, d] of Object.entries(designs)) {
    let caught = 0; const times = [];
    for (let seed = 1; seed <= 100; seed++) {
      const w = new World(250, seed, true);
      w.add('prey', prey, { x: 125, y: 125 });
      for (let i = 0; i < 6; i++) w.add('hunter', { size: 1, speed: 1.0, sight: 60, ...d });
      while (w.t < 1500 && !w.log.catches.length) w.step();
      if (w.log.catches.length) { caught++; times.push(w.t); }
    }
    console.log('  ' + name.padEnd(46), 'caught', String(caught).padStart(3) + '/100', '| mean beats when caught', mean(times).toFixed(0));
  }
}

// 1b. Big prey that bites back: one hunter alone loses, several together win.
function bigPrey() {
  const prey = { size: 2, speed: 0.5, hp: 8, sight: 40, instincts: [I('touch smaller creature', 'bite'), I('always', 'wander', { str: 'weak' })] };
  const moods = { Hunting: { lingers: 'briefly' }, Brave: { lingers: 'briefly', kicksIn: 'high' } };
  const wander = I('always', 'wander', { str: 'weak' });
  const designs = {
    'A. attack on sight': { moods, instincts: [I('see bigger creature', 'approach'), I('touch bigger creature', 'bite'), wander] },
    'B. attack only when Brave (many of my kind near)': { moods, instincts: [
      I('many my kind', 'raise Brave', { speed: 'quickly' }),
      I('see bigger creature', 'approach', { in: ['Brave'] }), I('see bigger creature', 'keep apart', { notIn: ['Brave'], str: 'strong' }),
      I('touch bigger creature', 'bite'), wander] },
    'C. B + call "Prey!" and gather on the caller': { moods, instincts: [
      I('many my kind', 'raise Brave', { speed: 'quickly' }),
      I('see bigger creature', 'raise Hunting', { speed: 'quickly' }), I('always', 'call Prey!', { in: ['Hunting'] }), I('hear Prey!', 'approach', { notIn: ['Hunting'] }),
      I('see bigger creature', 'approach', { in: ['Brave'] }), I('see bigger creature', 'keep apart', { notIn: ['Brave'], str: 'strong' }),
      I('touch bigger creature', 'bite'), wander] },
  };
  console.log('\n1b. BIG PREY THAT BITES BACK  (8 hunters with 2 hit points, prey with 8, 250x250 arena, 3000 beats, 100 runs)');
  for (const [name, d] of Object.entries(designs)) {
    let kills = 0; const lost = [], times = [];
    for (let seed = 1; seed <= 100; seed++) {
      const w = new World(250, seed);
      const p = w.add('prey', prey, { x: 125, y: 125, tag: 'prey' });
      for (let i = 0; i < 8; i++) w.add('hunter', { size: 1, speed: 1.0, sight: 60, hp: 2, ...d });
      while (w.t < 3000 && p.alive && w.creatures.some((c) => c.kind === 'hunter' && c.alive)) w.step();
      if (!p.alive) { kills++; times.push(w.t); }
      lost.push(w.creatures.filter((c) => c.kind === 'hunter' && !c.alive).length);
    }
    console.log('  ' + name.padEnd(50), 'prey killed', String(kills).padStart(3) + '/100', '| hunters lost per run', mean(lost).toFixed(1), '| mean beats to kill', mean(times).toFixed(0));
  }
}

// 2. Courtship. Males that display compete with males that never do, for four kinds of female.
function courtship() {
  const female = (kind) => ({
    speed: 0.8, moods: { Charmed: { lingers: 'briefly', kicksIn: 'high', about: kind === 'bond' } },
    instincts: [
      I('feel fertile', 'call Here'),
      ...(kind === 'any' ? [I('see male showing', 'raise Charmed', { speed: 'slowly' })] : []),
      ...(kind === 'near' || kind === 'bond' ? [I('near male showing', 'raise Charmed', { speed: 'slowly' })] : []),
      I(kind === 'bond' ? 'touch my Charmed one' : 'touch male', 'mate', kind === 'none' ? {} : { in: ['Charmed'] }),
      I('see plant', 'approach', { in: ['hungry'] }), I('touch plant', 'bite'), I('always', 'wander', { str: 'weak' }),
    ],
  });
  const maleBase = [I('hear Here', 'approach'), I('see female', 'approach'), I('touch female', 'mate'), I('see plant', 'approach', { in: ['hungry'], str: 'strong' }), I('touch plant', 'bite'), I('always', 'wander', { str: 'weak' })];
  const shower = { speed: 1, instincts: [...maleBase, I('see female', 'show red')] };
  const sneaker = { speed: 1, instincts: maleBase }; // identical, but never displays
  console.log('\n2. COURTSHIP  (10 females, 6 males that display, 6 that never do, plants regrowing, 4000 beats, 30 runs)');
  for (const [kind, label] of [['none', 'accepts any male at once'], ['any', 'Charmed by any showing male in sight'], ['near', 'Charmed only by a showing male close by'], ['bond', 'Charmed by one male, mates only with him']]) {
    const tally = { shower: 0, sneaker: 0 };
    for (let seed = 1; seed <= 30; seed++) {
      const w = new World(220, seed);
      for (let i = 0; i < 10; i++) w.add('k', female(kind), { sex: 'female' });
      for (let i = 0; i < 6; i++) { w.add('k', shower, { sex: 'male', tag: 'shower' }); w.add('k', sneaker, { sex: 'male', tag: 'sneaker' }); }
      for (let i = 0; i < 40; i++) w.plants.push({ x: w.rnd() * 220, y: w.rnd() * 220 });
      while (w.t < 4000) {
        w.step(); if (w.plants.length < 40 && w.rnd() < 0.3) w.plants.push({ x: w.rnd() * 220, y: w.rnd() * 220 });
        for (const c of w.creatures) if (c.gravid) { c.gravid = false; c.cool = 150; } // no nesting in this test
      }
      for (const m of w.log.matings) tally[m.male]++;
    }
    console.log('  female ' + label.padEnd(40), '| matings: displayers', tally.shower, 'non-displayers', tally.sneaker, '| displayers\' share', ((100 * tally.shower) / (tally.shower + tally.sneaker || 1)).toFixed(0) + '%');
  }
}

// 3. Nesting ground. Gravid females seek cover, lay once settled, and (optionally) scent the spot.
function nesting() {
  const design = (scent) => ({
    speed: 1, sight: 70, moods: { Settled: { lingers: 'briefly', kicksIn: 'high' } },
    instincts: [
      I('see cover', 'approach', { in: ['gravid'] }),
      I('feel covered', 'raise Settled', { speed: 'slowly', in: ['gravid'] }),
      I('see bigger creature', 'calm Settled', { speed: 'quickly' }), I('see bigger creature', 'move away', { str: 'strong' }),
      I('feel gravid', 'lay', { in: ['Settled'] }),
      ...(scent ? [I('feel gravid', 'mark Nest', { in: ['Settled'] }), I('smell Nest', 'approach', { in: ['gravid'], str: 'strong' })] : []),
      I('always', 'wander', { str: 'weak' }),
    ],
  });
  const roamer = { size: 2, speed: 0.6, instincts: [I('always', 'wander')] };
  console.log('\n3. NESTING GROUND  (16 females, 6 cover patches, 2 big roamers, 6000 beats, 30 runs)');
  for (const scent of [false, true]) {
    const top = [], used = [], total = [];
    for (let seed = 1; seed <= 30; seed++) {
      const w = new World(300, seed);
      for (let i = 0; i < 6; i++) w.covers.push({ x: 50 + (i % 3) * 100, y: 80 + Math.floor(i / 3) * 140, r: 18 });
      for (let i = 0; i < 16; i++) w.add('k', design(scent), { sex: 'female' });
      for (let i = 0; i < 2; i++) w.add('roamer', roamer);
      while (w.t < 6000) { w.step(); for (const c of w.creatures) if (c.sex === 'female' && c.fertile && w.rnd() < 0.01) { c.fertile = false; c.gravid = true; } }
      const counts = w.covers.map((p) => w.log.lays.filter((e) => Math.hypot(e.x - p.x, e.y - p.y) < p.r + 5).length);
      const late = w.log.lays.filter((e) => e.t > 3000);
      const lateCounts = w.covers.map((p) => late.filter((e) => Math.hypot(e.x - p.x, e.y - p.y) < p.r + 5).length);
      total.push(w.log.lays.length); top.push(Math.max(...lateCounts) / (late.length || 1)); used.push(lateCounts.filter((n) => n > 0).length);
    }
    console.log('  ' + (scent ? 'with scent mark   ' : 'without scent mark'), '| eggs laid', mean(total).toFixed(0), '| share of later eggs in the busiest patch', (100 * mean(top)).toFixed(0) + '%', '| patches still in use', mean(used).toFixed(1), 'of 6');
  }
}

// 4. Flocking, with the nearest neighbour only and with a "my group" sense.
function flocking() {
  const designs = {
    'wander only': [I('always', 'wander')],
    'nearest: stay near + keep apart': [I('see my kind', 'stay near'), I('see my kind', 'keep apart'), I('always', 'wander', { str: 'weak' })],
    'nearest: + go the same way': [I('see my kind', 'stay near'), I('see my kind', 'keep apart'), I('see my kind', 'go the same way'), I('always', 'wander', { str: 'weak' })],
    'group: stay near + keep apart': [I('see my group', 'stay near'), I('see my kind', 'keep apart'), I('always', 'wander', { str: 'weak' })],
    'group: + go the same way': [I('see my group', 'stay near'), I('see my kind', 'keep apart'), I('see my group', 'go the same way'), I('always', 'wander', { str: 'weak' })],
  };
  console.log('\n4. FLOCKING  (30 creatures, open wrapped plain, 1500 beats, 20 runs)  alignment: 0 = random headings, 1 = all the same way');
  for (const [name, instincts] of Object.entries(designs)) {
    const align = [], near = [];
    for (let seed = 1; seed <= 20; seed++) {
      const w = new World(300, seed, true);
      for (let i = 0; i < 30; i++) w.add('k', { speed: 1, sight: 60, instincts });
      while (w.t < 1500) w.step();
      align.push(Math.hypot(mean(w.creatures.map((c) => c.hx)), mean(w.creatures.map((c) => c.hy))));
      near.push(mean(w.creatures.map((c) => Math.min(...w.creatures.filter((o) => o !== c).map((o) => w.off(c, o)[2])))));
    }
    console.log('  ' + name.padEnd(34), '| alignment', mean(align).toFixed(2), '| mean distance to nearest neighbour', mean(near).toFixed(0));
  }
}

const only = process.argv[2];
for (const f of [fastPrey, bigPrey, courtship, nesting, flocking]) if (!only || f.name === only) f();
