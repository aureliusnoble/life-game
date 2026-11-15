# Lifespan: fading, the end of a species, and the score

Draft 2, November 2026. Design area 7 in `design/plan.md`. Section 1 is decided. The rest is a proposal, with one direction check run in `design/checks/balancelab.js`; its numbers show direction only.

## 1. Decided

- **The score is total life:** a species' living weight added up over every hour it lasts. Weight is counted as it is. A hunter's weight counts for more than a grazer's. Longest-lived and highest peak are kept as records beside it.
- **Fading is the same for every species of the same age,** whatever state the species is in.
- **Two days of grace, then a ramp that is slower than doubling.** Few species are expected to get past seven or eight days, and a truly exceptional one lasting twenty is acceptable.
- **It keeps ramping forever, so that in the end everything dies.**
- **A better design lasts longer.**
- **Presets do not fade** and are not scored.
- **A player can release a new species whenever they choose.** If they have one already, releasing the new one retires the old.
- **Retiring means its eggs stop hatching and its living members die of old age.** Nothing is removed by hand. Presets step aside the same way.
- **No drift.** A living species changes by one mutation a day, which the player picks from three offered at random. That cannot escape the curve.
- **A species is extinct when its last member dies.**
- **At the end a player keeps** the design, anything it unlocked, its records, the named line's history, and a chronicle of the species' major events.

## 2. What fading is

One number for each species, set by its age and nothing else. It is 1 from release through two days of grace, and then climbs.

**What it weighs on.** Everything a species does, in equal measure:

- **The cost of living rises:** every animal needs more food for the same life.
- **Fewer eggs hatch.**

Two channels, not one, so that no way of life escapes. A species with food to spare but little breeding to spare is caught by the second, and the other way round by the first.

**How it should look.** The name suggests it: the creatures of an old species grow paler, as paper does in the sun. A player should be able to tell an old species from a young one at a glance.

## 3. The curve

How long a species lasts follows from how much handicap its design can absorb, which I'll call its slack. The check in section 4 says designs absorb two to five times.

**Proposed: after two days of grace, fading rises by about one step every two days, and each step is a little larger than the last.** It is 1 on day two, about 2 on day four, 3 on day six, and 13 by day twenty. The climb never stops and slowly steepens, so no design and no run of lucky mutations can keep ahead of it for good.

| A design that can absorb | Lasts about |
|---|---|
| One and a half times the handicap: a beginner's first species | 3 days |
| Twice | 4 days |
| Three times: a sound design | 6 days |
| Four times: a very good one | 8 days |
| Five times: the best the lab has found | 10 days |
| Thirteen times: truly exceptional | 20 days |

- **This matches the range you gave:** most players at seven or eight days at best, and twenty possible.
- **Everything dies in the end.** The budget never grows, so there is a ceiling on how good a design can be, and a climb that never stops passes it.
- **A doubling every three days was the alternative.** It gives five, eight and eleven days for the same designs, and would need a design sixty-four times as good to reach twenty, which nothing could be.
- **A mutation buys time, not escape.** One that makes a species a tenth better buys about half a day at day six. With one a day, drawn at random, a species cannot improve as fast as the climb steepens.

These figures are arithmetic on top of a stand-in. The step and the grace are for the balance pass.

## 4. Direction check: does a better design last longer?

Four designs of rising quality in the meadow with three hunters, under fading that doubles at a fixed interval after a grace period. Five runs. The figure is how many doublings each lasted.

| Design | Fading on the cost of living | On hatching | On both | Total life, with both |
|---|---|---|---|---|
| A poor design | 1.9 | 4.7 | 1.1 | 0.5 |
| The plain design | 2.1 | 3.7 | 1.4 | 0.7 |
| A good design | 2.3 | 5.2 | 2.3 | 0.9 |
| The best the lab's search found, which is the largest body | 1.4 | 6.8 | 1.8 | 2.0 |

- **Better designs did last longer, but not by much.** With fading on both, the spread from poor to good was a little over one doubling. Designs here have a slack of two to five times, which is why the curve in section 3 is slower than first proposed.
- **Total life separated the designs far more than lifespan did:** fourfold, against less than twofold. The score you chose does more of the telling apart than longevity would have.
- **The design with the most total life was not the longest-lived.** The largest body carries the most weight and has the least room when the cost of living rises. That is a real trade between how much and how long, which the score is meant to reward.
- **The hatching column overstates.** Nothing dies of age in the stand-in, so adults outlive their failed eggs for as long as they can avoid the hunters.

## 5. Seasons, and when a species is released

A year is about eight real days, so most species meet one winter, and a long-lived one meets two or three.

- **The first winter is the natural test.** A species released in spring meets winter on about its sixth day, with fading already at 3. Whether it sees the next spring is the drama of a long-lived species.
- **Release timing matters.** A species released in autumn meets its winter young and strong.
- **Decided: a player releases when they choose.** They can hold a finished design for a better season. The designer shows the season ahead, and records note the season of release.
- **Releasing a new species retires the current one.** Its eggs stop hatching and its members live out their lives, so for a while the player has an old species dwindling and a new one beginning. The old one goes on scoring until its last member dies.

## 6. What the player sees

- **Vigour:** how much of its slack the species has left, as a gauge.
- **A forecast in plain words:** "about two days left at this rate". It has to be honest, including when it is uncertain.
- **The generation number** and the named line's number.
- **The shape of its life so far:** living weight over time, with the area under it as the score.
- **Paler creatures** as the species ages.

## 7. The end

A species ends when its last member dies, whether it was worn down by fading or retired by its player. Then:

- **The death view** shows the shape of its whole life, the score, where it stood among friends' species, and what finally ended it.
- **What stays in the world:** remains, burrows, walls, worn ground, and any forest its forgotten seed planted.
- **What the player keeps:**
  - the design, to open again and change;
  - anything it unlocked;
  - its records;
  - the named line, as a list of every name-bearer and how each one died;
  - a chronicle of its major events: the first winter survived, a disaster and the recovery, a new home founded, a rival's arrival, its peak, the day the name passed on.
- **A preset returns** to the place the species took, unless the player has released another.

The chronicle is the species memory that the conversation idea in `design/plan.md` reads from: a record of game events, written only by the simulation.

## 8. Score and records

- **Total life** is the headline, and is what friends are ranked on.
- **A hunter's weight counts for more.** By how much is for the balance pass: enough that the best hunter and the best grazer score about alike.
- **Records beside it,** each a different way to be remembered: longest-lived, highest peak, most generations, widest spread across biomes, longest named line, most homes, largest single animal.
- **Presets are not scored,** and appear in the rankings only as a line to beat.

## 9. Answered

Decided on 15 November:

1. **The curve:** two days of grace, then a ramp slower than doubling, with twenty days possible for the exceptional. The steady climb in section 3 is my proposal for that ramp.
2. **Release:** whenever the player chooses. It retires the current species, whose eggs stop hatching and whose members die of old age.
3. **What a player keeps:** as proposed, with a chronicle of major events added.

## 10. Next

Step 7: the experience areas, beginning with the first hour and the daily visit as flows, at the wireframe stage the plan describes.
