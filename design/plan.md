# Plan: from spec to a first playable version

Draft 1, November 2026. A first pass for discussion. Nothing here is committed to until the decisions in section 7 are made.

## 1. Where the spec stands

| Area | Document | State |
|---|---|---|
| Behaviour editor | `design/neural-blocks.md` (draft 4) | Vocabulary written and audited. Ten verbs still untested. Not yet tried by people |
| Bodies | `design/body.md` (draft 1) | Parts audited. Shells, the inside and camouflage need rebalancing. Many parts untested |
| World and daily loop | `design/world-and-loop.md` | Direction decided. Fading and keeper actions are proposals, untested |
| Look | `design/art-direction.md` | Soft critters and the Paper lagoon direction chosen. Needs deepening and a real asset kit |
| Technology | `reports/Creature sim game design exploration.md` | A recommended stack, unmeasured |

Three things are missing from the spec entirely: the life cycle (eggs, growth, death), the unlock order with its puzzles, and the recap.

## 2. What the first playable version is

One pond, one group of friends, one week.

**In:**

- A shared pond that runs all day on a server, with each friend's species living in it.
- A body designer with the parts that passed the audit.
- A behaviour designer with the vocabulary that has been tested, and a test tank.
- Fading, so a species lasts days, not for ever.
- A plain daily recap, a couple of newborn edits a day, and two keeper actions: dropping a scent and the touch-and-hold beacon.
- Death, with a view of what the species was doing when it failed.
- The Paper lagoon look, on a phone, in a browser.
- Invite-only sign-in.

**Out, for later:** most mood functions, appearance-based senses, building, castes and young forms, generated narration, native apps, more than one pond.

## 3. How it is built

As recommended by the research, and still to be measured:

- **One language throughout:** TypeScript.
- **A simulation package** with no knowledge of screens or networks, giving the same result from the same starting point every time. It replaces the stand-in scripts, and the audits become its tests.
- **A client** that draws with PixiJS and uses ordinary web interface for the designers, installable to a phone's home screen.
- **A server** that is one process with a small database file, on a fixed-price machine.
- **Workbench pages** for parts, scenes and brains, which grow into the in-game designers.

## 4. Phases

Each phase ends with something that can be checked.

| Phase | Builds | Done when |
|---|---|---|
| 0. Foundations | Repository layout, tests, automatic checks on every change, a deploy path | A change can go from this branch to a running page with its tests passing |
| 1. Simulation | The real simulation: world, bodies and their worked-out numbers, senses, instincts, moods, signals, energy, eggs and growth, fading | The recipe, verb and body audits run as its tests; it replays identically; it is fast enough for the target population on the target machine |
| 2. Designers | Body designer, behaviour designer and test tank on a phone, with no server | Two or three friends each build a working species in one sitting, and the tested recipes can be built comfortably |
| 3. Shared world | The server, saving and restoring, sign-in, releasing a species, watching the pond live | Several phones watch the same pond for a day without it drifting or stopping |
| 4. Daily loop | Fading in the live world, recap, newborn edits, keeper actions, death view, a first unlock ladder with puzzles | A species lives and dies over several days and its owner can say why |
| 5. Look and feel | Paper lagoon in production form, an asset kit, bodies that show acts and moods, portraits, sound | A friend who has not seen it before calls it cute without being asked |
| 6. First season | A one-week trial with the whole group | Lifespans fall in the 3 to 7 day range, and people come back daily |

Phase 2 comes before phase 3 because the largest unknown is whether friends can use the designers at all. If they cannot, the vocabulary changes before a world is built around it.

**Design work alongside the build:**

- Fix the balance problems in `design/body.md` section 6.
- Audit the untested verbs and parts.
- Write the life cycle, the unlock order and the recap.
- Deepen Paper lagoon: more parts, a way of showing every act and mood, a composed pond.
- Tune fading in the simulation once phase 1 exists.

## 5. How the work is done

- Every piece of simulation work comes with a test that passes or fails; the audits are the first of these.
- Checks run automatically on every change, and the same checks gate what is deployed.
- The simulation, sign-in and saved-data changes get a second review with fresh eyes.
- What only a person can judge stays with a person: whether it is fun, whether it is cute, and whether it feels right on a real phone.

## 6. Main risks, and what retires each

| Risk | Retired by |
|---|---|
| Friends cannot build behaviours on a phone | Phase 2 |
| The simulation is too slow for a full pond | Phase 1 measurement |
| Fading does not produce 3 to 7 day lives | Phase 1 tuning, then phase 6 |
| No mix of builds can coexist; one design wins | Body audit follow-up, then phase 6 |
| The look does not hold up on a phone | A frame-rate test early in phase 5, or sooner |
| The game is not worth a daily visit | Phase 4, then phase 6 |

## 7. Decisions needed first

1. **Hosting.** Is a small fixed-price server at roughly €6 to €10 a month acceptable?
2. **The group.** About how many friends, and what mix of iPhone and Android?
3. **Order.** Designers before the shared world, as proposed here?
4. **Overlap.** May a player release a successor while the old species still lives?
5. **Scope of the first version.** Is anything in section 2 misplaced, in or out?
6. **Working arrangement.** Keep building on this branch, or move to reviewed changes into the main one?
