# Plan: full design first, then build

Draft 3, November 2026. Adds the larger world, how balance is tested, and the interface as a design area.

## 1. Decisions made

| Question | Decision |
|---|---|
| Hosting | A small fixed-price server at roughly €6 to €10 a month is fine |
| The group | 5 to 20 friends. Empty places in the ecosystem are filled by preset species we make |
| Order of building | The designers come before the shared world |
| Overlap | No. A player has one species alive at a time |
| Scope | Do the whole design now, as completely as possible, before building. This is the moment to find out which systems are not rich enough |
| The world | Much richer than one pond: several biomes, each with its own cycles, that respond to how species use them, recover after being overexploited, and offer niches for different bodies, life cycles and social organisation |
| Pet play | There must be Tamagotchi-like interaction with the species. It centres on one special individual: each species has a named founder that its player looks after closely, and whose fate matters more than the rest |
| World shape | One connected map. Biomes sit side by side, creatures spread wherever they can live, and the borders between biomes are places in their own right |
| World size | Eight biomes in one river basin: Highlands, Woodland, Heath, Grassland, Lakeland, Marsh, Dunes and Tidal flats. Each is a region about ten phone screens across with several habitats in it; the basin is about 26 screens across and 20 tall. Animals gather at water, food and cover, with emptier ground between |
| Time | A day is about one real hour and a season about two real days |
| Boom and bust | Stays. A species that breeds without restraint can eat its biome bare and die out; managing resources is part of designing it |
| Balance | Testing that the options are viable, different from each other and free of dominant strategies is treated as the hardest part of designing the mechanics. Every area is tested the way section 3 describes |
| Interface | Handcrafted, cute and intuitive without losing depth. Depth is revealed a little at a time, and the game teaches itself through onboarding with callouts. Researched before it is designed |
| Working arrangement | Reviewed changes into the main branch |

## 2. How the design process runs

Each area below goes through the same four steps, and is not called done until it passes.

1. **Write it down** as a design document.
2. **Test it.** Where the stand-in world can run it, the balance tests in section 3. Where it is about people, a mockup to react to.
3. **Questions and answers** on the choices that are yours.
4. **Close it** against its own checklist, and list what is still open.

## 3. How balance is tested

"Balanced" is broken into tests that can each pass or fail.

| Test | Passes when |
|---|---|
| Viable | Every option appears in at least one of the best designs somewhere |
| Not mandatory | No option appears in every winner |
| A real choice | Swapping it for another changes how a winner does in at least one habitat |
| Different winners | Each habitat's best design is best at home and worse away |
| Counters | Any winner can be beaten by some other design, when they share food or in another place |
| Skill shows | A searched design clearly beats a plain one, and a sensible hand-made one gets most of the way there |
| Lasting | A mixed world keeps several species going for a long time |

**The balance lab** (`design/checks/balancelab.js`) runs these.

- **Every choice is data.** Body options, behaviour kits and breeding rules are one list the lab combines under the budget. A new part or word is added once and is then tested everywhere.
- **A search plays the adversary.** In each habitat it breeds designs toward whatever does best there, as a player trying to break the game would. The earlier audits compared builds picked by hand, which is how they missed things.
- **A report gives verdicts:** who wins where on maps the search has not seen, how often each option is chosen, and whether winners hold their home against visitors.
- **A knockout test** changes one choice at a time in a winner, to show which choices matter and which make no difference.
- **The lab checks itself first:** that hunters are present for the whole run, that a blind design does badly, that removing hunters helps, and how much the same design varies from map to map. A difference smaller than that variation is not reported as a finding.
- **Results are kept** in `design/checks/balance/`, and the lab is re-run whenever a rule or a number changes, so a fix that breaks something else shows up.

**What a simulation cannot test** is whether any of it is fun, readable or satisfying. That is tested with people: mockups to react to in each area, a playable test tank with friends as the first thing built, and in the first season a record of which options get used and how species die.

**First run, 15 November.** Six habitat patches, about a hundred designs searched in each, grazers only. The lab's checks on itself pass. Scores run from 0 to about 2, and differences under about 0.15 are noise.

| Test | Result |
|---|---|
| Not mandatory | **Fails.** The smallest size and the fat-storing inside are in every winner. Any larger size costs 0.5 to 1.6. A large gut does as well as fat in two habitats; every other inside costs 0.3 to 1.0 |
| Viable | **Fails.** Never in a best design anywhere: every size but the smallest, the other three insides, the sting, eyes on stalks, paddles, and not laying when food is thin |
| A real choice | **Mixed.** Size, limbs and the inside matter in all six habitats; a nose and the response to threat in four; shape, eyes and shell in three. Sting, camouflage, false eyes and egg size changed nothing anywhere |
| Different winners | **Fails on land.** Each habitat's winner is the best or near it at home in five of six, but one design is as good as the best in five of the six habitats. Only water forces a different body |
| Counters | **Partly.** A winner holds its home against visiting winners in 24 of 30 pairings. Where two designs share one food, one usually starves the other out completely |
| Skill shows | **Yes.** Winners score about twice the plain design |
| Lasting | Not tested by the lab yet |

What it found:

- **Small wins everywhere, because a plant feeds a small animal as much as a large one.** Upkeep rises with size, so a large body needs about five and a half times the meals of a small one. With no hunters at all, in the meadow, small scored 1.74, plain 1.20 and large 0.56. A large body needs something only it can do: bigger bites, foods it alone can reach, or winning food from others.
- **Storing fat beats every other inside,** as the body audit suspected.
- **Spikes won everywhere at first, for a bad reason.** Test hunters bit spiked prey until they died, which left the habitat with no hunters for most of the run. With dead hunters replaced, spikes were in one winner of six. Hunters need a way to notice spikes and leave them alone, and a species that kills off its hunters is a question for the shared world.
- **The earlier build tables were wrong about what wins.** Their hunters starved about a quarter of the way through each run, because they gained nothing from a kill. Those tables show how hard each build is to catch early on, and say nothing about food or breeding. Large and armoured builds looked dominant there; large builds do worst here. The affected tables in `body.md`, `environment.md` and `world.md` now carry a correction.

Limits of the lab today:

- **The score is numbers,** which favours small bodies. The game's real measure is how long a species lasts, which is area 7.
- **Food regrows at a fixed rate,** so holding back from laying cannot pay. The root-stock rule from the world design has to go in.
- **It searches grazers only,** against three fixed hunters, with four behaviour choices out of a vocabulary of about a hundred words.
- **It runs the six habitat patches,** not the eight biomes, and about a hundred designs a habitat is a thin search.

Next for the lab: the root-stock food rule; hunter designs searched against the grazer winners and back again; many more behaviour choices; long runs of a mixed world for the "lasting" test; then the fixes to size, the inside, sting and camouflage, each re-run through it.

## 4. Design areas, in order

Earlier areas constrain later ones, so the order matters. Art runs alongside from the start.

| # | Area | Has to answer | Done when |
|---|---|---|---|
| 1 | **World** | Which biomes; what each one's ground, food and cycles are; how biomes respond to use and recover; how they connect; how a player sees it on a phone | Each biome has a different best build; an overexploited biome recovers; there is a map mockup |
| 2 | **Life cycles** | Eggs, growth, young forms, sexes, lifespans, death and what the dead become | At least four ways of living through a year each win somewhere |
| 3 | **Social organisation** | Loners, pairs, herds, packs, colonies with castes, territories | Each form can be built from the vocabulary and each pays in some biome |
| 4 | **Ecosystem balance** | Hunters and prey that persist together; the cast of preset species; how many player builds can coexist | A mixed world runs for a long time without collapsing to one species |
| 5 | **Bodies** | Fix shells, the inside and camouflage; audit the untested parts; set costs | No part is always right or always wrong |
| 6 | **Behaviour** | Audit the untested verbs and mood functions; check it can express areas 2 and 3 | Every word has passed its audit |
| 7 | **Lifespan and scoring** | Fading, what counts as doing well, what happens at death, the rhythm of play across weeks | Lifespans land in 3 to 7 days in simulation, and skill moves them |
| 8 | **Player loops** | The first hour and how the game teaches itself; the daily visit; the design session; death and what follows; unlocks and puzzles; long-term goals | Each loop is written as a sequence of screens and has a reason to return |
| 9 | **Pet play** | What a player can do with individuals, where, and what comes back | A mockup that is pleasant to poke at for five minutes |
| 10 | **Feedback** | Recap, watching it think, the death view, the food web, records | For any outcome, the player can find out why |
| 11 | **Playing with friends** | Relationships between species, seeing each other's work, sharing, rankings | Friends have reasons to talk about it |
| 12 | **Look, sound and feel** | Paper lagoon across every biome; bodies that show acts and moods; an interface that feels handmade and stays readable; sound | Mockups of each biome, of a creature in every mood, and of the interface style |
| 13 | **Screens** | Every screen and the paths between them; what is shown first and what is revealed later; onboarding with callouts | A click-through mockup of the whole game, tried by someone who has not seen it |
| 14 | **Build plan** | Architecture, phases, tests | Written against the finished design |

## 5. What exists already

| Area | Document | State |
|---|---|---|
| Behaviour | `design/neural-blocks.md` (draft 4) | Vocabulary written and audited; ten verbs and most functions untested |
| Bodies | `design/body.md` (draft 1) | Parts audited; size, the inside, sting, camouflage and spikes need rework. Its table of whole builds is superseded by the balance lab |
| World | `design/world.md` (draft 3), on top of `design/environment.md` | Eight biomes in one river basin, accepted, with a map mockup. Tested only as single habitat patches: an overused patch recovers, a species can be designed to manage its food, and patches have different casts. Nothing has been run at biome scale |
| Balance | `design/checks/balancelab.js`, section 3 above | First run done. Smallest size and fat storage are dominant; one design is near the best on every land habitat |
| Interface | `reports/Handcrafted game UI and onboarding.md` | Researched from search summaries only; not yet designed |
| Loop and lifespan | `design/world-and-loop.md` | Direction decided; fading and keeper actions proposed |
| Look | `design/art-direction.md` | Soft critters in the Paper lagoon direction |
| Technology | `reports/Creature sim game design exploration.md` | A recommended stack, unmeasured |

## 6. Building, once the design is closed

The order from draft 1 stands, with the designers first:

1. Foundations.
2. The simulation, with the audits as its tests.
3. The designers and a test tank on a phone, tried with friends.
4. The shared world.
5. The daily loop and pet play.
6. Look, sound and feel in production form.
7. A first season with the group.

## 7. Risks carried into the design

| Risk | Where it is dealt with |
|---|---|
| Hunters and prey cannot both persist | Area 4 |
| One build wins everywhere | Areas 1, 4 and 5 |
| Friends cannot build behaviours on a phone | Area 8 mockups, then building step 3 |
| A rich world is too much for a small server or a phone | Area 1 sets the size; measured in building step 2 |
| A test is broken and its result is taken as a finding | The balance lab checks itself before each run (section 3) |
| The design grows without end | Each area has a "done when", and area 14 does not start until the others are closed |
