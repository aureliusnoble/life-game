# Environment: places, features and cycles

Draft 1, November 2026. A proposal and an audit, not final rules.

Anything marked **tested** was run in `design/checks/envaudit.js`, a stand-in world with breeding and populations added. Its numbers show direction, not balance. Everything else is on paper.

## 1. What the world is for

- **Room for more than one way to live.** If one body and one brain suit everywhere, there is nothing to design.
- **Something for every body part and verb to act on.** Cover for stalking, ground for limbs, dark for the senses that are not eyes.
- **Change over time,** so that what works this morning is not what works tonight or next season.
- **A place worth looking at.** In the Paper lagoon look, each region is a sheet of the layered pond: deep water at the bottom of the stack, rocks at the top.

## 2. What a place is made of

| Layer | Options | What it acts on |
|---|---|---|
| Ground | Open ground, mud, thicket, rock, shallow water, deep water, running water | Which limbs are fast; which bodies are slowed or shut out |
| Cover | Reed beds, crevices, burrowable banks, lily pads, deep shade | Who can be seen, and who fits |
| Light | Day and night; shade; depth | Eyes against the other senses |
| Warmth | Sun and shade; season | How active a body is; fat, huddling, basking |
| Food | Grass, seeds and fruit, pond weed, drift in the current, flowers, litter, meat, eggs, fungus | Mouths, guts, and where a species has to be |
| Water | Depth; current that carries scent and drift | Fins and lungs; who smells whom |
| Cycles | Day and night, seasons, water level, weather, blooms and fruiting | Life histories and timing |
| Landmarks | A brook, a big rock, a fallen log, an island, a warm spring | Where things gather; home, nest and meeting places |

## 3. Regions of the pond

Each region has its own ground, food and rhythm, and so its own small ecosystem.

| Region | Ground and cover | Food | Favours | Punishes |
|---|---|---|---|---|
| Deep water | Dark, cold, open | Litter on the bottom; whatever sinks | Fins, senses that are not eyes, size | Legs, lungs |
| Shallows | Light, warm, some weed cover | Pond weed; flowers on lily pads | Paddles, grazers, young | Deep-water hunters |
| Reed bed | Dense cover that hides | Weed and insects among the stems | Hiding, stalking, nests | Bodies that rely on long sight |
| Mudflat and shore | Soft ground; floods and dries | Litter, worms, stranded food | Light bodies, wide feet | Armour and weight |
| Meadow | Open, fast ground | Grass and flowers | Speed, long sight, herds | Anything slow |
| Thicket | Shade, tangled stems | Fruit in pulses; fungus | Small bodies, noses | Big bodies |
| Rocks | Hard ground, crevices, sun | Little; lichen and what hides there | Small bodies, baskers | Big bodies; diggers |
| Brook | Current in one direction | Drift | Filter feeders, strong swimmers | Weak swimmers; scent carried downstream gives positions away |
| Island | Any of the above, cut off by water | Untouched food | Whatever can cross | Whatever cannot |

## 4. Cycles

| Cycle | Proposed length | What changes | What it makes room for |
|---|---|---|---|
| Day and night | A few real hours, so that daily check-ins fall in different phases | Light, warmth, which flowers are open | Night species and day species sharing one place |
| Season | About two real days, so a species lasting 3 to 7 days sees one to three winters | How fast food grows; warmth | Stored fat, eggs that wait, hoards, migration |
| Water level | Hours | Mudflats flood and dry; the pond grows and shrinks | Species that follow the edge |
| Weather | Occasional | Rain washes out scent and masks movement; wind carries scent; heat and cold | Senses that still work when others fail |
| Blooms and fruiting | Irregular | A burst of one food in one region | Fast breeders and wanderers |

The lengths are proposals. Nothing about them has been tested.

**Food and richness, on paper.** Food grows from light and from the richness of the ground. The dead and their droppings return richness where they fall, and the brook brings a fixed inflow, so the system cannot run down to nothing. The research notes record a shared ecology that collapsed when it was a closed loop.

## 5. Audit

A feature passes if it changes who thrives.

| Feature | What it does | Result | Verdict |
|---|---|---|---|
| Day and night | At night eyes reach a fifth as far | Hunters that see killed 10.2 prey a day and 1.8 a night. Hunters that feel movement killed 4.1 a day and 6.7 a night. A silent grazer was never caught by the second kind | Keep |
| Reed beds | Hide what is inside from anything not close | Kills fell from 26.4 to 12.6 only when prey ran to cover and held still, and those prey ate a fifth less. Prey that merely ran lost almost as many as on open ground (23.8) | Keep |
| Crevices | Only small bodies fit | 1.7 of 6 small grazers survived against 0.6 of medium ones; on open ground none of either. They had to be given the habit of staying near the rocks | Keep; modest |
| Kinds of food, mixed together | Different mouths for different foods | With three foods mixed evenly, the species that eats anything dominated (17.8) and the three specialists hung on at low numbers (5.2, 2.2 and 5.6) | Not enough alone |
| Kinds of food, each in its own region | The same foods, separated in space | All three specialists thrived (about 17 each) and the generalist nearly vanished | Keep |
| Kinds of food, each in its own season | The same foods, separated in time | Only the generalist survived | Keep |
| Seasons | A winter with no growth | With food all year, a fast breeder held 25.0. With a winter, it died out in every run; the species whose eggs wait for spring held 19.6, and a fat storer hung on in 3 of 5 runs | Keep |
| Ground that slows some bodies | Thicket slows big bodies; mud slows armoured ones | Giants fell from 6.0 survivors to 3.7 in thicket; tanks from 5.6 to 3.2 on mud; small builds rose in thicket (2.4 to 4.4) | Keep |
| Refuges with breeding populations | Prey can hide where hunters cannot follow | On open ground hunters wiped out the grazers in 2 of 5 runs; with crevices in none. The hunters died out in every run either way | Unresolved |

### The same eight builds in seven places

Survivors of six, with one hunter that sees and one that feels movement.

**Correction, 15 November.** In this test the hunters starved about a quarter of the way through each run, because they gained nothing from a kill. The table therefore shows how hard each build is to catch in the first part of a run, and says nothing about breeding or competing for food. The balance lab (`design/plan.md`, section 3) repeats the comparison with hunters that stay, scarce food and breeding, and finds the opposite of what the large and armoured builds suggest here: the smallest bodies do best and the largest worst.

| Build | Open meadow | Day and night | Reed beds | Thicket | Mudflat | Rocks | Lean season |
|---|---|---|---|---|---|---|---|
| Sprinter | 5.7 | 0.6 | 3.8 | 4.0 | 5.7 | 5.3 | 0.7 |
| Tank | 5.6 | 0.7 | 5.7 | 5.0 | 3.2 | 5.7 | 1.2 |
| Giant | 6.0 | 3.0 | 6.0 | 3.7 | 6.0 | 6.0 | 0.6 |
| Ghost | 4.5 | 1.0 | 4.3 | 4.5 | 4.5 | 5.0 | 2.1 |
| Lookout | 4.0 | 1.2 | 3.1 | 4.7 | 4.0 | 3.7 | 2.0 |
| Stinger | 4.2 | 1.3 | 2.8 | 4.3 | 4.2 | 4.1 | 2.1 |
| Tiptoe | 3.3 | 0.3 | 3.2 | 4.6 | 3.3 | 3.5 | 2.3 |
| Mite | 2.4 | 0.3 | 2.3 | 4.4 | 2.4 | 2.9 | 1.5 |

## 6. What the audit found

- **Light and cover make a place harsher or kinder; ground decides who wins there.** Before thicket and mud were given rules that slow particular bodies, the same three builds came top in every place with hunters. Each region needs a rule that makes an otherwise strong body weak in it.
- **Regions make room for specialists, and seasons make room for generalists.** A world with several foods mixed evenly has neither.
- **Night starves anything that finds food by sight.** With day and night alternating, most builds starved. A night niche needs food that can be smelled.
- **There is no lasting balance between hunters and prey yet.** Hunters either ate the prey out or starved once the prey could hide. Since the world is to be filled mostly by player species, this is the largest open problem.
- **Storing fat barely carried a species through winter;** eggs that wait did, and so did sleeping through it (`design/world.md`). Together with the body audit, this says the inside of the body needs rework.
- **Giants still lead in four of seven places,** because the test hunters cannot take them. Until hunters come in all sizes, size is under-priced. This rested on the flawed test described in the correction above; in the balance lab large bodies do worst.
- **Grazing never ran the food down,** so the loop between food, grazers and richness is untested.

These figures were re-run after a counting error was fixed: eggs waiting to hatch did not count toward a species' ceiling, which flattered the species whose eggs wait.

Two artefacts were removed along the way: a permanent night, which only measured starvation, and food growing inside crevices, which left big grazers pushing at rocks until they starved.

## 7. Not yet audited

Water depth and current, warmth, water level, weather, burrows, lily pads, the richness loop, landmarks, and more than one pond.

## 8. Scope

This draft was written for one pond. The decision since is for a much richer world: several biomes, each with its own cycles, that respond to how species use them, recover after being overexploited, and offer niches for different bodies, life cycles and social organisation. That design is the first area in `design/plan.md`, and it starts from the layers, regions and findings here.

## 9. Next

1. Find a setup in which hunters and prey both persist: hunters that can switch food, food near refuges, slower-breeding hunters.
2. Make food smellable and re-run day and night.
3. Give depth, current, warmth and water level mechanics in the stand-in world and run each.
4. Run player-style builds against each other across the four first-version regions, to see how many can coexist.
