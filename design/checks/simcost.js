// node design/checks/simcost.js [creatures] [steps]
// A stand-in for the cost of the world's simulation, not the simulation. It has the shape of the real work:
// a map of 26 by 20 screens, creatures that gather at busy places, each sensing its neighbours through a grid,
// a dozen instincts added into one steer, moving, eating from a food grid that regrows, breeding and dying.
const N = +(process.argv[2] || 3000), TICKS = +(process.argv[3] || 2000), W = 26 * 360, H = 20 * 360, SEE = 72, CELL = SEE, GW = Math.ceil(W / CELL), GH = Math.ceil(H / CELL), FC = 36, FW = Math.ceil(W / FC), FH = Math.ceil(H / FC);
let seed = 12345; const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
const x = new Float32Array(N), y = new Float32Array(N), hx = new Float32Array(N), hy = new Float32Array(N), en = new Float32Array(N), mood = new Float32Array(N * 3), sp = new Uint8Array(N), hunts = new Uint8Array(N), next = new Int32Array(N), head = new Int32Array(GW * GH), food = new Float32Array(FW * FH).fill(1);
const hot = Array.from({ length: 40 }, () => [rnd() * W, rnd() * H]);
for (let i = 0; i < N; i++) { if (rnd() < 0.6) { const h = hot[(rnd() * 40) | 0], a = rnd() * 6.283, d = Math.sqrt(rnd()) * 150; x[i] = Math.min(W - 1, Math.max(0, h[0] + Math.cos(a) * d)); y[i] = Math.min(H - 1, Math.max(0, h[1] + Math.sin(a) * d)); } else { x[i] = rnd() * W; y[i] = rnd() * H; } sp[i] = (rnd() * 28) | 0; hunts[i] = sp[i] < 7 ? 1 : 0; en[i] = 0.5 + rnd() * 0.5; hx[i] = 1; }
let seen = 0;
function tick() { head.fill(-1); for (let i = 0; i < N; i++) { const c = ((y[i] / CELL) | 0) * GW + ((x[i] / CELL) | 0); next[i] = head[c]; head[c] = i; }
  for (let i = 0; i < N; i++) { const cx = (x[i] / CELL) | 0, cy = (y[i] / CELL) | 0; let kinX = 0, kinY = 0, kin = 0, thrX = 0, thrY = 0, thrD = 1e9, preyX = 0, preyY = 0, preyD = 1e9, crowd = 0;
    for (let gy = cy - 1; gy <= cy + 1; gy++) { if (gy < 0 || gy >= GH) continue; for (let gx = cx - 1; gx <= cx + 1; gx++) { if (gx < 0 || gx >= GW) continue; for (let j = head[gy * GW + gx]; j >= 0; j = next[j]) { if (j === i) continue; const dx = x[j] - x[i], dy = y[j] - y[i], d2 = dx * dx + dy * dy; if (d2 > SEE * SEE) continue; if (dx * hx[i] + dy * hy[i] < -0.5 * Math.sqrt(d2)) continue; seen++;      // behind it: not seen
          crowd++; if (sp[j] === sp[i]) { kinX += dx; kinY += dy; kin++; } else if (hunts[j] && !hunts[i]) { if (d2 < thrD) { thrD = d2; thrX = dx; thrY = dy; } } else if (hunts[i] && !hunts[j]) { if (d2 < preyD) { preyD = d2; preyX = dx; preyY = dy; } } } } }
    const m = i * 3; mood[m] += ((thrD < 1e9 ? 1 : 0) - mood[m]) * 0.2; mood[m + 1] += ((1 - en[i]) - mood[m + 1]) * 0.05; mood[m + 2] += ((kin > 3 ? 1 : 0) - mood[m + 2]) * 0.1;      // moods: wary, hungry, among kin, each lingering
    const fi = ((y[i] / FC) | 0) * FW + ((x[i] / FC) | 0); let fx = 0, fy = 0, best = food[fi]; for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = fi + oy * FW + ox; if (k >= 0 && k < food.length && food[k] > best) { best = food[k]; fx = ox; fy = oy; } }
    let sx = hx[i] * 0.4, sy = hy[i] * 0.4;      // a dozen instincts, each a small push, added
    if (thrD < 1e9) { const l = Math.sqrt(thrD) || 1; sx -= thrX / l * 2 * (0.5 + mood[m]); sy -= thrY / l * 2 * (0.5 + mood[m]); }
    if (preyD < 1e9) { const l = Math.sqrt(preyD) || 1; sx += preyX / l * 1.6 * mood[m + 1]; sy += preyY / l * 1.6 * mood[m + 1]; }
    if (kin) { sx += kinX / kin / SEE * 0.6; sy += kinY / kin / SEE * 0.6; } if (crowd > 6) { sx -= kinX / (kin || 1) / SEE * 0.5; sy -= kinY / (kin || 1) / SEE * 0.5; }
    sx += fx * mood[m + 1]; sy += fy * mood[m + 1]; sx += (rnd() - 0.5) * 0.3; sy += (rnd() - 0.5) * 0.3; sx += Math.sin(i + en[i] * 9) * 0.05; sy += Math.cos(i * 1.7) * 0.05; if (x[i] < 60) sx += 1; if (x[i] > W - 60) sx -= 1; if (y[i] < 60) sy += 1; if (y[i] > H - 60) sy -= 1;
    const l = Math.sqrt(sx * sx + sy * sy) || 1; hx[i] += (sx / l - hx[i]) * 0.3; hy[i] += (sy / l - hy[i]) * 0.3; const v = thrD < 1e9 || preyD < 400 ? 6 : 2.5; x[i] = Math.min(W - 1, Math.max(0, x[i] + hx[i] * v)); y[i] = Math.min(H - 1, Math.max(0, y[i] + hy[i] * v));
    en[i] -= 0.0008 * (v > 3 ? 3 : 1); if (!hunts[i] && food[fi] > 0.05 && mood[m + 1] > 0.2) { food[fi] -= 0.05; en[i] = Math.min(1, en[i] + 0.02); } if (hunts[i] && preyD < 100) en[i] = Math.min(1, en[i] + 0.3);
    if (en[i] <= 0) { en[i] = 0.6; x[i] = rnd() * W; y[i] = rnd() * H; } }      // a death, and a birth elsewhere to keep the count level
  for (let k = (tickNo % 8); k < food.length; k += 8) if (food[k] < 1) food[k] = Math.min(1, food[k] + 0.004); tickNo++; }
let tickNo = 0; for (let i = 0; i < 200; i++) tick(); seen = 0; const t0 = process.hrtime.bigint(); for (let i = 0; i < TICKS; i++) tick(); const ms = Number(process.hrtime.bigint() - t0) / 1e6 / TICKS;
console.log(`${N} creatures: ${ms.toFixed(3)} ms a tick; ${(seen / TICKS / N).toFixed(1)} neighbours seen by each; ${(1000 / ms).toFixed(0)} ticks a second flat out; at 4 ticks a second that is ${(ms * 4 / 10).toFixed(2)}% of one processor`);
