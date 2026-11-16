// One table of verdicts for the whole behaviour library, made from the results kept by `mechaudit.js library`.
// Run with `node design/checks/mech/verdicts.js`; it writes design/checks/mech/library-results/verdicts.md and prints the counts.
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, 'library-results');
const f = (x) => (x === null || x === undefined ? '?' : Math.abs(x) >= 100 ? String(Math.round(x)) : String(Math.round(x * 10) / 10));
const one = (s) => String(s || '').replace(/\s+/g, ' ').replace(/\|/g, '/').trim();
const TITLE = { recipes: 'Tested recipes (`neural-blocks.md`, section 11)', 'recipes-rest': 'Tested recipes, the last three (`neural-blocks.md`, section 11)', 'atlas-way-feed-alive': 'Atlas: finding the way, feeding, staying alive (`neural-blocks.md`, section 12)', 'atlas-year-breed-young': 'Atlas: day and year, breeding, raising young (`neural-blocks.md`, section 12)', 'atlas-groups-colonies-talk': 'Atlas: living in groups, colonies, talking (`neural-blocks.md`, section 12)', 'atlas-beyond-seasons': 'Atlas: beyond nature; seasons, journeys and societies; ways through the year (`neural-blocks.md`, section 12; `life-cycles.md`, section 7)', societies: 'Societies (`social.md`, section 5)', builds: 'Builds (`body.md`, section 12)', presets: 'The twenty presets (`presets.md`, section 3)' };
const ORDER = Object.keys(TITLE);
function verdict(r) { if (!r.written) return 'Cannot be written'; if (!r.fits) return 'Does not fit'; if (!r.does) return 'Does not do it'; if (!r.pays) return 'Does not pay'; return 'Passes'; }
function row(r) { const ag = Object.entries(r.against || {}).map(([k, v]) => f(v) + ' ' + k).join('; ');
  const why = [r.written ? '' : 'Not written: ' + one((r.notes || []).join('; ')), r.fits ? '' : 'Over the cap: ' + one((r.over || []).join(', ')), r.gap ? 'Gap in the notation: ' + one(r.gap) : '', one(r.note)].filter(Boolean).join(' ');
  const v = verdict(r); return '| ' + one(r.name) + ' | ' + (v === 'Passes' ? v : '**' + v + '**') + ' | ' + (r.lines === undefined ? '?' : r.lines + ' and ' + r.moods) + ' | ' + (r.with === undefined || r.with === null ? '' : f(r.with) + ' ' + one(r.unit)) + ' | ' + ag + ' | ' + why + ' |'; }
function main() { const files = fs.readdirSync(dir).filter((x) => x.endsWith('.json')).map((x) => x.slice(0, -5)).sort((a, b) => (ORDER.indexOf(a) < 0 ? 99 : ORDER.indexOf(a)) - (ORDER.indexOf(b) < 0 ? 99 : ORDER.indexOf(b)));
  let md = '# The behaviour library: a verdict for each\n\nMade by `node design/checks/mech/verdicts.js` from the results kept in this folder. Do not edit by hand. The four tests and what they mean are in `design/mechanics.md`, section 3. A verdict names the first test a behaviour fails.\n\n', all = [], sum = [];
  for (const g of files) { const A = JSON.parse(fs.readFileSync(path.join(dir, g + '.json'), 'utf8')); all.push(...A); const c = (k) => A.filter((r) => verdict(r) === k).length;
    sum.push('| ' + (TITLE[g] || g) + ' | ' + A.length + ' | ' + c('Passes') + ' | ' + c('Cannot be written') + ' | ' + c('Does not fit') + ' | ' + c('Does not do it') + ' | ' + c('Does not pay') + ' | ' + A.filter((r) => r.gap).length + ' |');
    md += '## ' + (TITLE[g] || g) + '\n\n' + c('Passes') + ' of ' + A.length + ' pass.\n\n| Behaviour | Verdict | Instincts and moods | Its count | The plainer versions | Notes |\n|---|---|---|---|---|---|\n' + A.map(row).join('\n') + '\n\n'; }
  const c = (k) => all.filter((r) => verdict(r) === k).length;
  const head = '| Source | Behaviours | Pass | Cannot be written | Do not fit | Do not do it | Do not pay | Gaps in the notation |\n|---|---|---|---|---|---|---|---|\n' + sum.join('\n') + '\n| **All** | **' + all.length + '** | **' + c('Passes') + '** | ' + c('Cannot be written') + ' | ' + c('Does not fit') + ' | ' + c('Does not do it') + ' | ' + c('Does not pay') + ' | ' + all.filter((r) => r.gap).length + ' |\n';
  md = md.replace('\n\n## ', '\n\n' + head + '\n## '); fs.writeFileSync(path.join(dir, 'verdicts.md'), md); console.log(head); return { all, head }; }
if (require.main === module) main();
module.exports = { main, verdict };
