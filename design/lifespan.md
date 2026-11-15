# Lifespan: fading, the end of a species, and the score

Draft 1, November 2026. Design area 7 in `design/plan.md`. Section 1 is decided. The rest is a proposal, with one direction check run in `design/checks/balancelab.js`; its numbers show direction only.

## 1. Decided

- **The score is total life:** a species' living weight added up over every hour it lasts. Weight is counted as it is. A hunter's weight counts for more than a grazer's. Longest-lived and highest peak are kept as records beside it.
- **Fading is the same for every species of the same age,** whatever state the species is in.
- **It keeps rising,** so pushing against it gets harder all the time and in the end is almost impossible.
- **A better design lasts longer.** A beginner's species may last a few days, and there is room for a really successful one to last a good deal longer.
- **Presets do not fade** and are not scored.
- **One species at a time,** with no drift. Daily edits can be strong and still cannot escape the curve.
- **A species is extinct when its last member dies.**

## 2. What fading is

One number for each species, set by its age and nothing else. It is 1 from release through a grace period, and then doubles at a fixed interval.

**What it weighs on.** Everything a species does, in equal measure:

- **The cost of living rises:** every animal needs more food for the same life.
- **Fewer eggs hatch.**

Two channels, not one, so that no way of life escapes. A species with food to spare but little breeding to spare is caught by the second, and the other way round by the first.

**How it should look.** The name suggests it: the creatures of an old species grow paler, as paper does in the sun. A player should be able to tell an old species from a young one at a glance.

## 3. The curve

How long a species lasts follows from how much handicap its design can absorb, which I'll call its slack:

> lifespan = grace + doubling time × the number of doublings its slack covers

Each doubling a species survives needs a design twice as good. That is what makes pushing against it harder and harder, and it never becomes a wall.

The earlier proposal was a doubling every day, which assumed designs could absorb handicaps of eight to over a hundred times. The check below says they absorb two to five times. With a daily doubling everything would be gone a day or two after its grace.

**Proposed: a day of grace, then a doubling about every two days.**

| A design that can absorb | Lasts about |
|---|---|
| Twice the handicap: a beginner's first species | 3 days |
| Four times: a sound design | 5 days |
| Eight times: a very good one | 7 days |
| Sixteen times | 9 days |
| Thirty-two times: exceptional | 11 days |

An edit that makes a species half as efficient again buys a little over a day. Edits matter, and the curve still wins.

These figures are arithmetic on top of a stand-in. The doubling time and the grace are for the balance pass.

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

A year is about eight real days and a species lasts three to eleven, so most species meet one winter and few meet two.

- **The first winter is the natural ending.** A species released in spring meets winter on about its sixth day, with fading already high. Whether it sees the next spring is the drama of a long-lived species.
- **Release timing matters.** A species released in autumn meets its winter young and strong, and then has three easy seasons while fading climbs.
- **Proposal:** a player can hold a finished design and release it when they choose. The designer shows the season ahead, and records note the season of release, so that a spring species and an autumn one are compared knowingly.

## 6. What the player sees

- **Vigour:** how much of its slack the species has left, as a gauge.
- **A forecast in plain words:** "about two days left at this rate". It has to be honest, including when it is uncertain.
- **The generation number** and the named line's number.
- **The shape of its life so far:** living weight over time, with the area under it as the score.
- **Paler creatures** as the species ages.

## 7. The end

A species ends when its last member dies. Then:

- **The death view** shows the shape of its whole life, the score, where it stood among friends' species, and what finally ended it.
- **What stays in the world:** remains, burrows, walls, worn ground, and any forest its forgotten seed planted.
- **What the player keeps:** the design, to open again and change; anything it unlocked; its records; and the named line, kept as a list of every name-bearer and how each one died.
- **A preset returns** to the place the species took.
- **The next species** can be released at once or held for a better season.

## 8. Score and records

- **Total life** is the headline, and is what friends are ranked on.
- **A hunter's weight counts for more.** By how much is for the balance pass: enough that the best hunter and the best grazer score about alike.
- **Records beside it,** each a different way to be remembered: longest-lived, highest peak, most generations, widest spread across biomes, longest named line, most homes, largest single animal.
- **Presets are not scored,** and appear in the rankings only as a line to beat.

## 9. Questions for you

1. **A slower curve.** A day of grace and then a doubling about every two days, in place of every day. It gives beginners about three days and leaves room for eleven. Does that range suit?
2. **Holding a design for a better season.** Allow it, as proposed, or should a new species always be released when it is made?
3. **What a player keeps at the end:** the design, unlocks, records and the named line's history. Anything to add or take away?

## 10. Next

Step 7: the experience areas, beginning with the first hour and the daily visit as flows, at the wireframe stage the plan describes.
