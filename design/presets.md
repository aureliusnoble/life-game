# Preset species: the standing cast

Draft 1, November 2026. Design area 4 in `design/plan.md`. The rules in section 1 are decided. The cast in section 3 is a proposal on paper. Section 4 reports a direction check run in `design/checks/castaudit.js`; its numbers show direction only.

## 1. Decided

- **Twenty preset species.** The world always holds twenty species: each player's living species takes the place of one preset.
- **A fluctuating but stable ecosystem.** Numbers should rise and fall, and the whole should not collapse.
- **They need not be equally successful.** Some will be common and some rare.
- **Reasonably persistent, and respawned if they die out.**
- **No advantages.** Presets are built in the same designer, under the same allowance, from the same vocabulary.
- **No fading, and no score.** The pressure that ends every player species does not apply to them.

## 2. How the rules work

Proposals, to be settled with you.

| Rule | Proposal |
|---|---|
| Which preset steps aside for a player's species | The one most like it in biome, food and size, so that the food web keeps its shape. A pack hunter on the Grassland replaces the preset pack hunter; something with no counterpart replaces whichever preset is doing worst |
| How it steps aside | It stops laying and is not respawned. Its living members finish their lives. Nothing vanishes |
| When it comes back | When that player's species is extinct, a founding group arrives in its home biome |
| Respawn after dying out | After a wait of about half a season, a founding group arrives at the edge of its home biome, and only if its food is there |
| What "reasonably persistent" means | In a world with no players, each preset is present at least four-fifths of the time. This is a target for the balance pass |
| What else presets are for | Players can open any preset in the designer to see how it is built, and copy it as a starting point. A few are built to be partners: one gives food when tended, one cleans riders off others |

## 3. The cast

Twelve foragers on different foods, five hunters, and three that live off the others. Between them they use most of the ways of living in the life-cycle and social designs, so they also work as examples. Names are placeholders.

### Foragers

| Name | Home | Eats | Body | Way of life |
|---|---|---|---|---|
| Pebblings | Highlands | Lichen | Small; fits crevices | A colony with a queen, workers and guards, nesting in the crags |
| Gloamers | Highland caves, Woodland floor | Fungus | Small, no eyes, a good nose | Loners that find each other only to breed |
| Snufflers | Woodland | Fruit, wherever it is fruiting | Plain, a good nose | Wanderers that call others to a find, and sleep through winter |
| Stashers | Woodland, Heath edge | Seeds and nuts | Plain, carries well | Pairs with a territory and a larder. Seed they forget sprouts |
| Cinderlings | Heath | Seeds; new shoots on burnt ground | Small, burrows | Fast and many. They follow the fires and boom after each |
| Lumbers | Grassland; Marsh edge in winter | Grass | Large, slow to breed | A herd led by its elders, who remember the winter route |
| Dewbacks | Grassland, Woodland glades | Flowers, by day | Small | One season's boom: lay once, die, and the eggs wait for spring. They give sweet dew when tended |
| Shimmers | Lakeland | Weed | Fins | A shoal that all spawns on the same night |
| Mudpups | Lakeland and Marsh | Litter and buried food, by smell | Young with fins, adults with legs | Young in the water, adults on the bank |
| Reedlings | Marsh | Reed seed | Small, hides well | Pairs with hidden nests; both parents tend |
| Driftfoots | Dunes | Seeds; what the sea leaves on the driftline | Wide feet, burrows | Lone wanderers that leave no trail |
| Tidelings | Tidal flats | Buried food, by smell and touch | Light, long-legged | A flock that follows the tide line out and back |

### Hunters

| Name | Home | Takes | Body | Way of life |
|---|---|---|---|---|
| Harriers | Grassland | The young, old and weak of the herds; Cinderlings on the Heath edge | Plain size, fast | A pack: one breeding pair and their grown young as helpers |
| Lurks | Marsh, Lakeland shores | Whatever comes to the water's edge | Large, camouflaged | Solitary ambushers, each with a stretch of bank |
| Gulpers | The lake's deep | Shimmers and young Mudpups | Large, fins | Few and slow-breeding. The deep has no winter, so they are always there |
| Prowlers | Woodland, Heath | Small foragers, by night and by smell | Small, heat pits | Loners. They also take eggs |
| Longstriders | Highlands, ranging everywhere | The largest prey, and carrion | The largest body in the cast | Very few, very wide-ranging, slow to breed |

### Living off the others

| Name | Home | Lives by | Body | Way of life |
|---|---|---|---|---|
| Pickers | Everywhere | Remains | Small, a good nose | They follow the hunters and clean up after them |
| Nabbers | Marsh, Dunes | Eggs | Small, quiet | Sneaks. They watch for unguarded nests |
| Hitchers | On Lumbers and other large bodies | Riding and feeding a little; or being fed on by Cleaners | Tiny, hooks | Riders. A second form, the Cleaner, eats riders off animals that ask |

### What the cast is built to give

- **Every biome has at least two foragers on different foods,** so they do not compete, which is what let species share a habitat in the earlier tests.
- **Every hunter has more than one prey,** and two of them eat carrion or eggs as well, so no hunter depends on one species.
- **Hunters are few and slow to breed,** and three of the five hold territories, which caps their numbers.
- **Several species link biomes:** Lumbers and Harriers between the Grassland and the Marsh, Snufflers and Stashers across the Woodland and Heath, Longstriders and Pickers everywhere.
- **Openings for players are deliberate.** There is no hunter on the Dunes or the Tidal flats, no large forager in the Woodland, nothing that farms, and no colony outside the Highlands.

## 4. Can hunters and their prey last together?

This is the part of "fluctuating but stable" that has never worked in the stand-in world, so I tested it before writing the cast. The pair is the simplest one: grazers with crevices to hide in, and hunters that live on them. Six runs of 20,000 beats in one small patch.

**Four things that might steady the pair, one at a time:**

| Change | Both present | Hunters died out |
|---|---|---|
| As before: hunters live on grazers alone | 9% of the run | Once a run, early |
| Hunters can also graze, poorly | 5% | Once a run |
| Hunters breed slowly, and not when crowded | 10% | Once a run |
| Hunters rest when fed | 6% | Once a run |
| Newcomers arrive when a species has been gone a while | 65% | 7 times a run, and returned each time |
| All four | 62% | 8 times a run |

**How cheaply a hunter lives.** The hunters above starve even when grazers are plentiful, so the second test changed only the hunter's running cost.

| Hunter's running cost | Both present | What happened |
|---|---|---|
| Full | 9% of the run | Hunters starve in every run; grazers untouched |
| Half | 27% | Hunters boom to 4, crash and die out in every run; grazers survive in 5 of 6 |
| A quarter | 18% | Hunters eat the grazers out in 5 of 6 runs, then starve |
| An eighth | 16% | Hunters eat the grazers out in every run, then starve |

**More room.** The same pair in a world four times the area, with four times the crevices and food. Two runs of 15,000 beats, which is all the stand-in could manage at that size.

| Hunter's running cost | Both present | What happened |
|---|---|---|
| Half | 30% of the run | Hunters reach 4 at most and die out in both runs; grazers stay between 90 and 160 |
| A quarter, breeding slowly | 41% | Hunters reach 24, eat the grazers out in both runs, then starve |

**What this says:**

- **Nothing kept the pair together by itself.** Either the hunters cannot make a living, or they eat the place out and starve. There was no setting in between. Breeding slowly, resting when fed and a second food did not make one, and neither did four times the room.
- **Arrivals are what kept hunters present,** for about two-thirds of the time. That is the respawn rule doing the work. It gives fluctuation without collapse, which meets the letter of "fluctuating but stable", and it is not persistence.
- **The hunters in these tests are very few,** between two and nine in most runs, so one bad stretch ends them. A hunter species of thirty or more spread across a biome, with several kinds of prey, may behave differently. The stand-in cannot run that.
- **This matters most for players, not presets.** A preset hunter that dies out is respawned. A player's hunter species is not, and it has to last for days to score. Whether a hunter can last at all is now the largest risk in the design, and the first thing to test when the real simulation exists.
- **What remains untried:** hunters with several kinds of prey, ground broken into patches that hunters cannot cross quickly, and prey refuges that only hold so many.

## 5. Where this area stands

| Done when | State |
|---|---|
| The cast of twenty is written | **Proposed** |
| The rules for stepping aside, respawn and fading are settled | **Decided in outline;** two proposals open |
| Hunters and prey last together | **No.** Not in one patch, and not with four times the room. Only arrivals kept hunters present |
| A mixed world of the whole cast runs for a long time without collapsing | **Not tested.** The stand-in cannot run twenty species |

## 6. Questions for you

1. **Which preset steps aside.** I've proposed the one most like the player's species, so the food web keeps its shape. The alternative is a fixed preset for each player. Which do you want?
2. **The cast.** Twelve foragers, five hunters and three others. Is that the right mix, and is anything missing that you want in the standing world?
3. **Names.** Placeholders. Keep, or do you have a style in mind?

## 7. Next

Step 5, the body rework: size as tempo, grips and skins, forms, and the parts not yet audited.
