// node design/checks/mechaudit.js [cover]
// The mechanics pass (design/plan.md, section 3). `cover` says which choices on the species sheet and which words of the
// vocabulary the rig models, family by family. The tests of whether each one matters are added here as the rig grows.
const SHEET = require('../sheet/sheet.js'), VOCAB = require('../sheet/vocab.js'), { KNOWS, gap } = require('./rig.js');
function cover() { const g = gap(), rule = SHEET.FIELDS.filter((f) => f.kind === 'rule');
  console.log(`cover: the rig models ${rule.length - g.parts.length} of ${rule.length} choices on the species sheet that mean something, and ${VOCAB.words.length - g.words.length} of ${VOCAB.words.length} words of the vocabulary`);
  console.log('\n  Body: not modelled\n    ' + g.parts.map((f) => SHEET.LABEL[f.id]).join(', '));
  console.log('\n  Brain, by family: modelled of all'); for (const [name, list] of VOCAB.families()) { const miss = list.filter((v) => !KNOWS.words.has(v.id)); console.log('    ' + (list.length - miss.length + '/' + list.length).padEnd(6) + name.padEnd(34) + (miss.length ? 'missing: ' + miss.map((v) => v.word).join(', ') : '')); }
  return !g.parts.length && !g.words.length; }
const ok = ({ cover })[process.argv[2] || 'cover'](); process.exit(ok ? 0 : 1);
