// The rig's world: ground, water, shelter, time and weather, and the things that lie about in it.
// A stand-in, not the game's simulation. It is small on purpose: every rule is a few lines, so that the mechanics pass
// can ask of each word and each body part whether it changes anything.
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const DAY = 400, SEASON = 4 * DAY * 3, SEASONS = ['spring', 'summer', 'autumn', 'winter'];      // a day is 400 beats; a season is three days
// Kinds of ground. `foot` is the footing a mover is scored on; `hide` is how small a body has to be for it to cover it; `drag` slows big bodies
const GROUND = {
  'open grass': { foot: 'land' }, 'tall grass': { foot: 'land', hide: 0.9 }, thicket: { foot: 'thicket', hide: 9, drag: 0.4, dim: 0.6 }, scrub: { foot: 'land', hide: 0.7, burns: true },
  rock: { foot: 'rock' }, scree: { foot: 'rock', slow: 0.8 }, sand: { foot: 'sand', digs: true }, mud: { foot: 'mud', bogs: true }, 'bare ground': { foot: 'land' }, 'snow and ice': { foot: 'land', slow: 0.75, cold: true },
};
const WATERS = ['still water', 'shallows', 'deep water', 'running water', 'a pool left by tide or flood'], SHELTERS = ['cover', 'a crevice', 'a cave', 'a hollow', 'a burrow', 'shade'];

class World {
  constructor(size, seed, o = {}) { this.size = size; this.rnd = rng(seed); this.t = o.t0 || 0; this.torus = !!o.torus; this.base = o.ground || 'open grass';
    this.creatures = []; this.items = []; this.marks = []; this.regions = []; this.hills = []; this.clouds = []; this.calls = [];
    this.wind = [1, 0]; this.windy = false; this.raining = false; this.hot = false; this.freezing = false; this.snow = false; this.flood = false; this.tidal = false; this.fire = [];
    this.fixedLight = o.light; this.fixedSeason = o.season; this.log = { kills: [], meals: 0, events: [] }; this.moments = {}; this.nextId = 1; }
  // ---- time
  get hour() { return (this.t % DAY) / DAY; }                                 // 0 is dawn, a quarter is noon, a half is dusk
  get timeOfDay() { const h = this.hour; return h < 0.06 ? 'dawn' : h < 0.5 ? 'day' : h < 0.56 ? 'dusk' : 'night'; }
  get light() { if (this.fixedLight !== undefined) return this.fixedLight; const h = this.hour; return h < 0.06 ? 0.5 : h < 0.5 ? 1 : h < 0.56 ? 0.5 : 0.15; }
  get season() { return this.fixedSeason || SEASONS[Math.floor(this.t / SEASON) % 4]; }
  get tide() { return this.tidal ? 0.5 + 0.5 * Math.sin((this.t / (DAY / 2)) * Math.PI * 2) : 0; }                      // two tides a day
  get tideRising() { return this.tidal && Math.cos((this.t / (DAY / 2)) * Math.PI * 2) > 0; }
  moment(name, beats = 3) { this.moments[name] = this.t + beats; }
  just(name) { return (this.moments[name] || -1) >= this.t; }
  // ---- distances
  off(a, b) { let dx = b.x - a.x, dy = b.y - a.y; if (this.torus) { const h = this.size / 2; if (dx > h) dx -= this.size; else if (dx < -h) dx += this.size; if (dy > h) dy -= this.size; else if (dy < -h) dy += this.size; } return [dx, dy, Math.hypot(dx, dy)]; }
  // ---- ground. A region is a disc of some kind of ground, water or shelter, or a made thing. Later regions lie over earlier ones
  region(kind, type, x, y, r, more = {}) { const g = Object.assign({ id: this.nextId++, kind, type, x, y, r }, more); this.regions.push(g); return g; }
  rOf(g) { return g.tidal ? g.r * (0.55 + 0.45 * this.tide) : g.flood ? (this.flood ? g.r : 0) : g.r; }                 // the tide and a flood change how far water reaches
  at(x, y, kind) { let best = null; for (const g of this.regions) if (g.kind === kind && this.off(g, { x, y })[2] < this.rOf(g)) best = g; return best; }
  groundAt(x, y) { const g = this.at(x, y, 'ground'); return g ? g.type : this.base; }
  waterAt(x, y) { return this.at(x, y, 'water'); }
  depthAt(x, y) { const w = this.waterAt(x, y); if (!w) return 0; const d = this.off(w, { x, y })[2], r = this.rOf(w), edge = (r - d) / r; return w.type === 'shallows' ? 0.3 : w.type === 'deep water' ? 1 : clamp(edge * 2.5, 0.1, 1) * (w.depth ?? 1); }
  shelterAt(x, y, size) { let best = null; for (const g of this.regions) if (g.kind === 'shelter' && this.off(g, { x, y })[2] < g.r && (!g.maxSize || size === undefined || size <= g.maxSize)) best = g; return best; }
  heightAt(x, y) { let h = 0; for (const k of this.hills) { const d = this.off(k, { x, y })[2]; h += k.h * Math.exp(-(d * d) / (2 * k.r * k.r)); } return h; }
  lightAt(x, y) { const sh = this.at(x, y, 'shelter'), gr = GROUND[this.groundAt(x, y)] || {}; return this.light * (sh ? 0.35 : 1) * (gr.dim || 1); }
  warmAt(x, y) { return (this.freezing ? -0.8 : this.hot ? 0.9 : this.season === 'winter' ? -0.4 : this.season === 'summer' ? 0.4 : 0.1) + (this.light - 0.5) * 0.6 * (this.shelterAt(x, y) ? 0.2 : 1) - this.heightAt(x, y) * 0.5 - (this.groundAt(x, y) === 'snow and ice' ? 0.5 : 0); }
  wetAt(x, y) { if (this.waterAt(x, y)) return 1; let best = this.raining ? 0.5 : 0; for (const g of this.regions) if (g.kind === 'water') { const d = this.off(g, { x, y })[2] - this.rOf(g); best = Math.max(best, clamp(1 - d / 120, 0, 0.9)); } return best + (this.groundAt(x, y) === 'mud' ? 0.3 : 0); }
  flowAt(x, y) { const w = this.waterAt(x, y); return w && w.flow ? w.flow : null; }
  // a quantity that changes from place to place, for the direction words: which way it increases
  field(name, x, y) { return name === 'bright' ? this.lightAt(x, y) : name === 'warm' ? this.warmAt(x, y) : name === 'high' ? this.heightAt(x, y) : name === 'deep' ? this.depthAt(x, y) : name === 'wet' ? this.wetAt(x, y) : 0; }
  slope(name, x, y, step = 8) { const gx = this.field(name, x + step, y) - this.field(name, x - step, y), gy = this.field(name, x, y + step) - this.field(name, x, y - step), m = Math.hypot(gx, gy); return m < 1e-4 ? null : [gx / m, gy / m, m]; }
  // the nearest of a kind of place in reach, as a point to go to and the line of its edge
  nearestRegion(c, test, reach) { let best = null, bd = reach; for (const g of this.regions) { if (!test(g)) continue; const [dx, dy, d] = this.off(c, g), r = this.rOf(g), gap = Math.max(0, d - r); if (r > 0 && gap < bd) { bd = gap; best = { g, dx: dx / (d || 1), dy: dy / (d || 1), d: gap, centre: d, inside: d < r }; } } return best; }
  // ---- things lying about: food, seed, eggs, material, the dead. Each has a kind, a place, and how much is left
  item(kind, x, y, more = {}) { const it = Object.assign({ id: this.nextId++, kind, x, y, left: 1, born: this.t }, more); this.items.push(it); return it; }
  take(it) { const i = this.items.indexOf(it); if (i >= 0) this.items.splice(i, 1); }
  // ---- marks, calls and clouds
  mark(c, name, lasts, reach) { this.marks.push({ name, x: c.x, y: c.y, t: this.t, until: this.t + lasts, reach, by: c.id, kind: c.kind, home: c.home }); }
  call(c, name, range) { this.calls.push({ name, x: c.x, y: c.y, t: this.t, range, by: c.id, kind: c.kind }); }
  cloud(x, y, r, beats) { this.clouds.push({ x, y, r, until: this.t + beats }); }
  inCloud(o) { for (const k of this.clouds) if (this.off(k, o)[2] < k.r) return true; return false; }
  // ---- what changes by itself each beat: marks fade, eggs and seeds wait, fire spreads and dies, the dead rot
  tick() { const t = this.t;
    if (t % DAY === 0) this.moment('day just broke'); if (t % DAY === Math.floor(DAY * 0.56)) this.moment('night just fell'); if (t > 0 && t % SEASON === 0) this.moment('the season just turned');
    if (this.tidal && Math.abs(Math.cos((t / (DAY / 2)) * Math.PI * 2)) < 0.02) this.moment('the tide just turned');
    this.marks = this.marks.filter((m) => m.until > t); this.calls = this.calls.filter((k) => k.t >= t - 1); this.clouds = this.clouds.filter((k) => k.until > t);
    for (const f of this.fire) { f.r += 0.15; f.left--; for (const g of this.regions) if (g.kind === 'ground' && g.type === 'scrub' && !g.burnt && this.off(f, g)[2] < f.r + g.r * 0.5) { g.burnt = t; g.was = g.type; g.type = 'bare ground'; } }
    this.fire = this.fire.filter((f) => f.left > 0);
    for (const g of this.regions) if (g.burnt && !g.regrown && t - g.burnt > 600) { g.regrown = t; g.fresh = t; }                    // new growth comes after a fire
    for (const it of this.items.slice()) { if (it.kind === 'seed' && !it.held && it.sprout && t >= it.sprout) { this.take(it); this.item('plant', it.x, it.y, { type: it.type || 'plant', sown: true }); }
      if ((it.kind === 'meat' || it.kind === 'the dead') && !it.kept && t - it.born > 1500) this.take(it); }
    this.t++; }
  // ---- setting things going from a test
  rain(on) { if (on !== this.raining) this.moment(on ? 'rain just started' : 'rain just stopped'); this.raining = on; }
  frost(on) { if (on && !this.freezing) this.moment('the first frost'); this.freezing = on; }
  flooding(on) { if (on && !this.flood) this.moment('the water just rose'); this.flood = on; }
  burn(x, y, beats = 300) { this.fire.push({ x, y, r: 6, left: beats }); this.moment('a fire just started', 6); }
  fireNear(c, reach = 70) { for (const f of this.fire) { const [dx, dy, d] = this.off(c, f); if (d - f.r < reach) return { dx: dx / (d || 1), dy: dy / (d || 1), d: Math.max(0, d - f.r), f }; } return null; }
}
module.exports = { World, GROUND, WATERS, SHELTERS, DAY, SEASON, SEASONS, clamp, rng };
