// node design/checks/framecost.js
// Where a frame's time goes in the paper study, at phone size, with the processor slowed. Needs Playwright.
// The test browser draws without a graphics chip, so read the ranking, not the numbers.
const { chromium } = require('playwright'); const fs = require('fs'); const os = require('os'); const path = require('path');
(async () => { const body = fs.readFileSync(path.join(__dirname, '..', 'mockups', 'paper-study.html'), 'utf8'), page = path.join(os.tmpdir(), 'paper-study-timing.html');
  fs.writeFileSync(page, '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;font:14px system-ui}</style></head><body>' + body + '</body></html>');
  const b = await chromium.launch();
  for (const [label, dpr, slow, who] of [['phone, 3 device pixels to 1, processor at full speed', 3, 1, 'Plain'], ['phone, 3 to 1, processor slowed to a quarter', 3, 4, 'Plain'], ['phone, 2 to 1, processor slowed to a quarter', 2, 4, 'Plain'], ['phone, 3 to 1, slowed to a quarter, the long creature', 3, 4, 'Long']]) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: dpr }); await p.goto('file://' + page); await p.waitForTimeout(2500);
    const cdp = await p.context().newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: slow });
    const r = await p.evaluate((who) => { window.__hold(); window.__who(who); window.__act('wander'); window.__tick(30); window.__timing = true; window.__cost(); const t0 = performance.now(), n = 60; for (let i = 0; i < n; i++) window.__tick(1); const total = (performance.now() - t0) / n, c = window.__cost(); for (const k in c) c[k] = +(c[k] / n).toFixed(1); return { total: +total.toFixed(1), c }; }, who);
    console.log(label + ': ' + r.total + ' ms a frame'); for (const [k, v] of Object.entries(r.c)) console.log('   ' + k.padEnd(22) + String(v).padStart(7) + ' ms'); await p.close(); }
  await b.close(); })();
