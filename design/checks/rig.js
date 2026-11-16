// The rig: one stand-in world for the mechanics pass and the balance pass (design/plan.md, section 3 and section 8, step 2).
// It grows out of the worlds the earlier audits used: verbaudit.js for noticing and moving, bodyaudit.js for bodies.
// Each word of the vocabulary (design/sheet/vocab.js) and each choice on the species sheet (design/sheet/sheet.js)
// that it models is named in KNOWS, so that design/checks/mechaudit.js can say exactly what is still missing.
// A word or a part is added to KNOWS in the same change that gives it a mechanic here, and not before.
const { World, I } = require('./verbaudit.js'), body = require('./bodyaudit.js'), SHEET = require('../sheet/sheet.js'), VOCAB = require('../sheet/vocab.js');

// What the stand-in already modelled when the rig was begun, on 16 November 2026: read off verbaudit.js and bodyaudit.js
const W = (kind, words) => words.map((w) => kind + ': ' + w);
const KNOWS = {
  words: new Set([].concat(
    W('reach', ['touch', 'near', 'see', 'far', 'hear', 'smell', 'feel']), W('count', ['no', 'a']), W('which', ['nearest', 'weakest']),
    W('what', ['plant', 'meat', 'my kind', 'adult', 'of my home', 'of another home', 'bigger creature', 'smaller creature', 'a call', 'my kind\'s mark', 'a display', 'cover', 'a trail of marks']),
    W('state', ['still', 'coming at me', 'going away', 'facing me', 'facing away', 'eating', 'hurt']),
    W('feeling', ['hungry', 'tired', 'covered', 'clinging', 'dark', 'in water', '[mood]', 'always', 'sometimes']),
    W('act', ['approach', 'move away', 'stay near', 'keep apart', 'circle', 'go along', 'go the same way', 'head off', 'face', 'wander', 'hold still', 'bite', 'give', 'cling', 'puff up', 'call', 'show', 'raise', 'calm']),
    W('pace', ['creeping', 'normal pace', 'sprinting']), W('condition', ['only when', 'not when']), W('strength', ['weak', 'normal strength', 'strong']), W('setting', ['close', 'mid', 'far apart', 'tight', 'medium', 'wide']),
    W('mood', ['raised by', 'calmed by', 'quickly', 'normally', 'slowly', 'briefly', 'a while', 'a long time', 'until calmed']),
    W('attention', ['eating sees only near', 'creeping is hard to hear or feel', 'holding still is unfelt']))),
  parts: new Set(['length', 'width', 'size', 'gut', 'fat', 'muscle', 'lungs', 'skinBack', 'camo', 'falseEyes', 'eyes', 'eyeSize', 'nose', 'sideLine', 'mover', 'sting']),
};
// what is missing, by family, for bodies and for brains
const gap = () => { const words = VOCAB.words.filter((v) => !KNOWS.words.has(v.id)), parts = SHEET.FIELDS.filter((f) => f.kind === 'rule' && !KNOWS.parts.has(f.id)); return { words, parts }; };
for (const id of KNOWS.words) if (!VOCAB.byId[id]) throw new Error('the rig says it knows a word that is not in the vocabulary: ' + id);
for (const id of KNOWS.parts) if (!SHEET.BY[id]) throw new Error('the rig says it knows a part that is not on the sheet: ' + id);
module.exports = { World, I, body, KNOWS, gap };
