// The eight tested recipes of design/neural-blocks.md, section 11. See ../library.js for the form of an entry.
module.exports = ({ entry, species, World, spawn, step, run, hunted, TAU }) => {
entry({ name: 'Torn between food and fear', from: 'neural-blocks.md, section 11', unit: 'bites eaten in 1500 beats', atLeast: 6,
  says: 'It keeps clear of the big animal that bites, and goes in to feed only when it is very hungry',
  text: `
    see plant → approach                        only when hungry
    touch plant → bite
    see bigger creature → move away (strong)    not when very hungry
    always → wander (weak)`,
  plainer: { 'no fear': `
    see plant → approach                        only when hungry
    touch plant → bite
    always → wander (weak)`, 'always moves away': `
    see plant → approach                        only when hungry
    touch plant → bite
    see bigger creature → move away (strong)
    always → wander (weak)` },
  // all the food grows close to a big animal that bites whatever touches it
  run: (text, s) => { const w = new World(200, s, { light: 1 }); spawn(w, species('Biter', `
      touch smaller creature → bite (strong)      only when sometimes
      see smaller creature → face
      always → hold still`, { size: 1.5, eyes: 'stalk' }), { x: 100, y: 100 }); w.patch('plant', 100, 100, 7, { cap: 8, rate: 0.5, wear: 0 });
    const c = spawn(w, species('Forager', text, { size: 0.9 }), { x: 150, y: 100, energy: 0.32 }); run(w, 1500); return c.meals; } });

entry({ name: 'Remembering a place', from: 'neural-blocks.md, section 11', unit: 'bites eaten in 2000 beats', atLeast: 10,
  says: 'Having fed at a patch, it goes back there whenever it is hungry',
  text: `
    Mood
      Feast: Place, lingers until calmed
    see plant → approach                 only when hungry
    touch plant → bite
    touch plant → raise Feast (quickly)
    my Feast place → approach            only when hungry, only when Feast
    always → wander`,
  plainer: { 'no memory': `
    see plant → approach                 only when hungry
    touch plant → bite
    always → wander` },
  // one small patch where food keeps coming up, in wide empty country, and no nose
  run: (text, s) => { const w = new World(400, s, { light: 1 }); w.patch('plant', 200, 200, 14, { cap: 6, rate: 0.05, wear: 0 }); const c = spawn(w, species('Forager', text, { nose: false }), { x: 215, y: 200, energy: 0.45 }); run(w, 2000); return c.meals; } });

entry({ name: 'Pack hunt on big prey', from: 'neural-blocks.md, section 11', unit: 'hunters still alive when the prey is dead, of 8 (none if it never is)', atLeast: 4, seeds: 100,
  says: 'One sees the big prey and calls; the rest come; none goes in until enough of them are there, and then they all do',
  text: `
    Moods
      Hunting: lingers briefly
      Brave:   lingers briefly, kicks in high
    see bigger creature → raise Hunting (quickly)
    see a few my kind → raise Brave (quickly)
    always → call "Prey!"                       only when Hunting
    hear "Prey!" → approach                     not when Hunting
    see bigger creature → approach              only when Brave
    see bigger creature → keep apart (strong)   not when Brave
    touch bigger creature → bite
    always → wander (weak)`,
  plainer: { 'attack on sight': `
    see bigger creature → approach
    touch bigger creature → bite
    always → wander (weak)`, 'brave, but no call': `
    Moods
      Brave: lingers briefly, kicks in high
    see a few my kind → raise Brave (quickly)
    see bigger creature → approach              only when Brave
    see bigger creature → keep apart (strong)   not when Brave
    touch bigger creature → bite
    always → wander (weak)` },
  // one big animal that bites back hard, and eight small hunters scattered about. A hundred maps, as in the document's own test: the gain is a modest one
  run: (text, s) => { const w = new World(360, s, { light: 1, torus: true }), big = spawn(w, species('Big', `
      touch smaller creature → bite (strong)
      always → wander (weak)`, { size: 1.8, mouth: 'jaws', eyes: 'stalk', muscle: 0.5 }), { x: 180, y: 180 }); for (let i = 0; i < 8; i++) spawn(w, species('Hunter', text, { size: 0.9, mouth: 'jaws', ears: true, voice: 1 }), {}); const hs = w.creatures.filter((c) => c.kind === 'Hunter'); for (let t = 0; t < 1500 && big.alive; t++) step(w); return big.alive ? 0 : hs.filter((c) => c.alive).length; } });

entry({ name: 'Flocking', from: 'neural-blocks.md, section 11', unit: 'beats on which all eight are within 45 of their middle, of the last 400', atLeast: 250,
  says: 'They gather, keep a little apart from each other, and travel the same way',
  text: `
    see my group → stay near
    see my kind → keep apart (close)
    see my group → go the same way
    always → wander (weak)`,
  plainer: { 'wandering only': `
    always → wander (weak)`, 'gathering, but each going its own way': `
    see my group → stay near
    see my kind → keep apart (close)
    always → wander (weak)` },
  run: (text, s) => { const w = new World(300, s, { light: 1, torus: true }), cs = []; for (let i = 0; i < 8; i++) cs.push(spawn(w, species('Bird', text, { eyes: 'side' }), { x: 130 + w.rnd() * 40, y: 130 + w.rnd() * 40 })); let n = 0, moved = 0; const x0 = cs.map((c) => [c.x, c.y]);
    for (let i = 0; i < 900; i++) { step(w); if (i >= 500) { let ax = 0, ay = 0; for (const c of cs) { const [dx, dy] = w.off(cs[0], c); ax += dx; ay += dy; } const mid = { x: cs[0].x + ax / 8, y: cs[0].y + ay / 8 }; if (cs.every((c) => w.off(mid, c)[2] < 45) && cs.reduce((a, c) => a + c.spd, 0) / 8 > 0.15) n++; } } return n; } });

entry({ name: 'Flashing in time', from: 'neural-blocks.md, section 11', unit: 'beats on which all four are lit together, of the last 300', atLeast: 60,
  says: 'Each has its own slow rhythm of light; each hurries when it sees another lit; after a while they pulse together',
  text: `
    Mood
      Beat: Rhythm 120
    always → show glow                 only when Beat
    see my kind showing → hurry Beat (quickly)     not when Beat`,
  plainer: { 'no hurrying': `
    Mood
      Beat: Rhythm 120
    always → show glow                 only when Beat` },
  run: (text, s) => { const w = new World(80, s, { light: 1 }), cs = [0, 1, 2, 3].map((i) => spawn(w, species('Glow', text, { eyes: 'stalk' }), { x: 36 + (i % 2) * 8, y: 36 + Math.floor(i / 2) * 8 })); let n = 0; for (let i = 0; i < 1500; i++) { step(w); if (i >= 1200 && cs.every((c) => c.on.Beat)) n++; } return n; } });
};
