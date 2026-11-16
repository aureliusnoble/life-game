// node design/sheet/make.js
// Writes design/mockups/body-designer.html from three things, so that none of them is kept twice:
//   designer.template.html   the page and the designer's own code
//   sheet.js                 the species sheet
//   ../mockups/paper-study.html   the paper kit, taken from between its "<share>" marks
// The page it writes is a build product: change the template, the sheet or the kit, and run this again.
const fs = require('fs'), path = require('path'), at = (f) => path.join(__dirname, f);
const study = fs.readFileSync(at('../mockups/paper-study.html'), 'utf8');
const parts = [...study.matchAll(/^[ \t]*\/\/ <share>[^\n]*\n([\s\S]*?)^[ \t]*\/\/ <\/share>[^\n]*$/gm)].map((m) => m[1]);
if (parts.length !== 6) { console.error('expected six shared parts in the study, found ' + parts.length); process.exit(1); }
const out = fs.readFileSync(at('designer.template.html'), 'utf8').replace('/*SHEET*/', () => fs.readFileSync(at('sheet.js'), 'utf8')).replace('/*KIT*/', () => parts.join('\n'));
fs.writeFileSync(at('../mockups/body-designer.html'), out);
console.log('wrote design/mockups/body-designer.html, ' + Math.round(out.length / 1024) + ' KB, ' + parts.length + ' shared parts');
