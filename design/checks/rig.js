// The rig: one stand-in world for the mechanics pass and the balance pass (design/plan.md, section 3 and section 8, step 2).
// It is made of four parts in design/checks/rig/: world.js (ground, water, shelter, time, weather and things lying about),
// body.js (a species sheet turned into the numbers a body has), senses.js (what a creature can notice and feel) and
// mind.js (a brain written in the vocabulary, the acts, moods and their functions, and a life from egg to death).
// Each word of the vocabulary (design/sheet/vocab.js) and each choice on the species sheet (design/sheet/sheet.js)
// that it models is named in KNOWS, so that design/checks/mechaudit.js can say exactly what is missing.
// A word or a part is added to KNOWS in the same change that gives it a mechanic here, and not before.
// Being named here means the rig has a rule for it. Whether the rule matters in play is what the mechanics pass tests.
const world = require('./rig/world.js'), body = require('./rig/body.js'), senses = require('./rig/senses.js'), mind = require('./rig/mind.js'), SHEET = require('../sheet/sheet.js'), VOCAB = require('../sheet/vocab.js');
const W = (kind, words) => words.map((w) => kind + ': ' + w);
const KNOWS = {
  words: new Set([].concat(
    W('reach', ['touch', 'near', 'see', 'far', 'hear', 'smell', 'feel']),
    W('count', ['no', 'a', 'a few', 'many', 'a crowd', 'my group', 'outnumbering', 'outnumbered']),
    W('which', ['nearest', 'biggest', 'smallest', 'weakest', 'lone', 'my [mood] one', 'the oldest', 'the youngest']),
    W('what', ['plant', 'meat', 'egg', 'my kind', 'male', 'female', 'young', 'adult', 'old', 'family', 'stranger', 'of my home', 'of another home', 'bigger than me', 'smaller than me', 'older than me', 'younger than me', 'a named form', 'bigger creature', 'smaller creature', 'creature about my size', 'spiked', 'shelled', 'slimy', 'fat', 'a species I have met', 'a kind I learned about', 'food to carry', 'seed', 'an egg to carry', 'a young one', 'building material', 'the dead', 'a smaller creature to carry', 'a call', 'my mark', 'my kind\'s mark', 'a stranger\'s mark', 'a display', 'a rider', 'a rider of my kind', 'open grass', 'tall grass', 'thicket', 'scrub', 'rock', 'scree', 'sand', 'mud', 'bare ground', 'snow and ice', 'still water', 'shallows', 'deep water', 'running water', 'a pool left by tide or flood', 'cover', 'a crevice', 'a cave', 'a hollow', 'a burrow', 'shade', 'a nest', 'a wall', 'a larder', 'a trail of marks', 'an edge of cover', 'the water\'s edge', 'a river bank', 'the tide line', 'a wall as a line', 'high ground', 'open ground', 'an island', 'a crossing', 'burnt ground', 'new growth', 'grazed ground', 'flooded ground', 'frozen water', 'a bloom', 'a stand in fruit', 'fallen seed', 'food left by the tide', 'a carcass', 'brighter', 'darker', 'warmer', 'cooler', 'uphill', 'downhill', 'deeper', 'shallower', 'wetter', 'drier', 'upstream', 'downstream', 'upwind', 'downwind', 'north', 'south', 'east', 'west', 'my [mood] place', 'toward my [mood] place', 'my keeper']),
    W('state', ['still', 'coming at me', 'going away', 'facing me', 'facing away', 'eating', 'resting', 'fighting', 'carrying', 'clinging', 'hurt', 'calling', 'showing [display]']),
    W('feeling', ['hungry', 'hurt', 'tired', 'cold', 'warm', 'carrying', 'covered', 'clung to', 'clinging', 'fertile', 'gravid', 'dark', 'light', 'crowded', 'alone', 'outnumbering', 'outnumbered', 'male', 'female', 'young', 'adult', 'old', 'the form it is', 'idle', 'torn', 'stuck', '[mood]', 'always', 'sometimes', 'day', 'night', 'dawn', 'dusk', 'spring', 'summer', 'autumn', 'winter', 'raining', 'windy', 'hot weather', 'freezing', 'snow lying', 'tide in', 'tide out', 'tide rising', 'tide falling', 'flood', 'low water', 'fire near', 'smoke', 'in water', 'out of my depth', 'in a current', 'being swept along', 'sinking', 'wet', 'dry', 'exposed', 'in shade', 'in sun', 'underground', 'high up', 'on [ground]']),
    W('degree', ['a little', 'very']),
    W('moment', ['just hatched', 'just ate', 'just bitten', 'just fed', 'just tended', 'just grabbed', 'startled', 'just bit', 'just killed', 'just mated', 'just laid', 'just lost sight of it', 'rain just started', 'rain just stopped', 'the tide just turned', 'the water just rose', 'the first frost', 'a fire just started', 'day just broke', 'night just fell', 'the season just turned', 'food just arrived', '[mood] just started', '[mood] just ended', 'keeper\'s touch', 'keeper\'s treat']),
    W('act', ['approach', 'move away', 'stay near', 'keep apart', 'circle', 'go along', 'go the same way', 'head off', 'face', 'wander', 'hold still', 'bite', 'rest', 'lay', 'mate', 'grab', 'drop', 'give', 'tend', 'roll', 'cling', 'let go', 'hide', 'shed', 'sting', 'spray', 'glow', 'puff up', 'play dead', 'crouch', 'mark', 'wipe', 'dig', 'build', 'call', 'show', 'raise', 'calm', 'hurry', 'ping']),
    W('pace', ['creeping', 'normal pace', 'sprinting']),
    W('aim', ['the one it is facing']),
    W('condition', ['only when', 'not when', 'more when', 'less when']),
    W('strength', ['weak', 'normal strength', 'strong']),
    W('setting', ['close', 'mid', 'far apart', 'tight', 'medium', 'wide']),
    W('mood', ['raised by', 'calmed by', 'quickly', 'normally', 'slowly', 'briefly', 'a while', 'a long time', 'until calmed', 'kicks in low', 'kicks in at half', 'kicks in high']),
    W('function', ['Bond', 'Place', 'Rhythm', 'Count', 'Born with', 'Catching', 'Learn', 'Takes over', 'Habit', 'For life']),
    W('signal', ['a call heard near', 'a call heard far', 'a mark that fades soon', 'a mark that lasts', 'a display', 'mine', 'my home\'s', 'another home\'s', 'a stranger\'s', 'facing while showing']),
    W('attention', ['eating sees only near', 'resting sees nothing', 'hiding sees nothing and is unseen', 'sprinting smells nothing and is loud', 'creeping is hard to hear or feel', 'holding still is unfelt']),
    W('species', ['alone', 'in pairs', 'one breeder with helpers', 'both sexes in one', 'splitting', 'share of each sex and form', 'a rule on the mix', 'each time', 'once and lay for life', 'nothing', 'the mother dies after laying', 'the father dies after mating', 'many small', 'a few large', 'laid', 'kept inside until they hatch', 'hatch at once', 'wait for a season', 'once, with everything', 'repeatedly', 'adults sleep through a season', 'no sleep']))),
  parts: new Set(['plan', 'length', 'width', 'taper', 'size', 'gut', 'fat', 'muscle', 'lungs', 'brood', 'skinFront', 'skinFlanks', 'skinBack', 'camo', 'falseEyes', 'shedTail', 'ink', 'eyes', 'eyeSize', 'nose', 'ears', 'whiskers', 'sideLine', 'heatPits', 'ping', 'compass', 'mover', 'tailFin', 'wings', 'mouth', 'sting', 'horns', 'claws', 'club', 'grip', 'pouch', 'gland', 'voice', 'scent', 'glow', 'crest']),
};
// what is missing, by family, for bodies and for brains
const gap = () => { const words = VOCAB.words.filter((v) => !KNOWS.words.has(v.id)), parts = SHEET.FIELDS.filter((f) => f.kind === 'rule' && !KNOWS.parts.has(f.id)); return { words, parts }; };
for (const id of KNOWS.words) if (!VOCAB.byId[id]) throw new Error('the rig says it knows a word that is not in the vocabulary: ' + id);
for (const id of KNOWS.parts) if (!SHEET.BY[id]) throw new Error('the rig says it knows a part that is not on the sheet: ' + id);
module.exports = Object.assign({ KNOWS, gap, world, body, senses, mind, World: world.World, bodyOf: body.bodyOf, SHEET, VOCAB }, { I: mind.I, spawn: mind.spawn, step: mind.step, run: mind.run });
