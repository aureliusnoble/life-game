# World: six biomes on one connected map

Draft 2, November 2026. Design area 1 in `design/plan.md`. It builds on the layers and findings in `design/environment.md`.

Anything marked **tested** was run in `design/checks/worldaudit.js`, a stand-in world. Its numbers show direction, not balance. The tests ran one biome at a time; nothing here has been run as a connected map.

## 1. Decided

- One connected map. Biomes sit side by side and creatures spread wherever they can live.
- Six biomes, fixed: Rocks, Thicket, Meadow, Reed bed, Pond and Mudflat.
- Preset species fill the places players leave empty.
- **A day is about one real hour. A season is about two real days.**
- **Boom and bust stays.** A species that breeds without restraint can eat its biome bare and die out early. Managing its resources is part of designing it.
- Each biome must be large enough, carry several different species, and have its own resources, advantages and disadvantages.

## 2. The map

The map is a small watershed seen from above, and the six biomes follow the water downhill.

| Order | Biome | Borders |
|---|---|---|
| 1 | Rocks | Thicket, Meadow |
| 2 | Thicket | Rocks, Meadow |
| 3 | Meadow | Rocks, Thicket, Reed bed |
| 4 | Reed bed | Meadow, Pond, Mudflat |
| 5 | Pond | Reed bed, Mudflat |
| 6 | Mudflat | Reed bed, Pond |

A **brook** rises in the Rocks, runs through the Thicket and the Meadow and empties into the Pond. It is a feature, not a biome: its current carries drifting food, scent and floating eggs downstream, it is a road for swimmers, and it is a barrier to small walkers.

**Borders are places in their own right.** The thicket edge is where hunters wait for grazers leaving the meadow; the shore is where land and water bodies meet; the waterline on the mudflat moves every few hours.

**On a phone,** three views: the whole map with each species' range as a wash of colour; one biome; and following one creature. A mockup of the map is in `design/mockups/world-map.html`.

**Size, as a proposal.** Each biome is about two phone screens wide and two tall at play zoom, and the whole map about six screens wide and four and a half tall. A middling creature crosses a biome in two or three minutes, so a species can nest in one biome and feed in the next within a single day. The aim is four to six species and several hundred creatures in each biome, which is three to five thousand on the map. Whether a small server carries that is unmeasured.

## 3. The six biomes

Each biome has three foods that are reached in different ways, one clear advantage and one clear cost.

### Rocks

| | |
|---|---|
| Ground | Hard and fast. Crevices that only small bodies fit. High ground sees farther |
| Foods | Lichen, scraped from the rock; seeds blown in; weed in a few pools |
| Advantage | The safest place to rest and nest |
| Cost | The least food on the map; cold nights |
| Its own cycle | The daily swing from hot to cold |
| When overused | Lichen takes longer to return than any other food. The crevices are untouched |
| Suits | Small bodies; baskers; species that nest here and feed elsewhere; colonies |

### Thicket

| | |
|---|---|
| Ground | A tangle that slows big bodies. Dim even by day. Leaf litter underfoot |
| Foods | Fruit in bursts, one bush at a time; fungus on litter and on the dead; seeds |
| Advantage | Rich food, out of reach of big hunters |
| Cost | Eyes work poorly; the food moves about |
| Its own cycle | Fruiting moves from bush to bush; autumn leaf fall feeds the fungus |
| When overused | A stripped bush misses its next fruiting. Trampling opens a glade, which closes again |
| Suits | Small and middling bodies; noses; hoarders; wanderers that call others to a find; pairs that hold a territory |

### Meadow

| | |
|---|---|
| Ground | Open and fast. Grass grows tall in summer and hides small bodies, until grazing cuts it short |
| Foods | Grass, anywhere; flowers, by day only; seed in late summer |
| Advantage | The most food, and room to run |
| Cost | Nowhere to hide; the hardest winters |
| Its own cycle | The strongest seasons on the map |
| When overused | Bare patches regrow from the roots. Heavy grazing strips the cover small animals depend on |
| Suits | Speed and long sight; herds; packs; eggs that wait for spring |

### Reed bed

| | |
|---|---|
| Ground | Stems hide whatever is inside. Shallow water underfoot. Big bodies are slowed |
| Foods | Seed heads in season; weed between the stems; buried food in the mud below |
| Advantage | Cover for hiding and for nests |
| Cost | Nothing can see far; the cover is gone in winter |
| Its own cycle | Reeds grow through summer and die back in winter; a spring flood |
| When overused | Trampling and crowded nesting flatten the reeds, which regrow the next summer |
| Suits | Hiders and stalkers; hidden nests; solitary and paired lives |

### Pond

| | |
|---|---|
| Ground | Water. The shallows are light and warm; the middle is deep, dark and cold |
| Foods | Weed in the shallows; drift at the brook mouth, strained from the water; litter on the bottom, found by smell |
| Advantage | Out of reach of land hunters; the deep has no winter |
| Cost | Needs fins or paddles; the deep is dark |
| Its own cycle | Blooms after rain; the edges freeze in winter |
| When overused | With the weed grazed out the water clouds and sight shortens, until the weed returns |
| Suits | Fins; shoals; big hunters of the deep; filter feeders; species whose young live in water and adults on land |

### Mudflat

| | |
|---|---|
| Ground | Soft, so heavy and armoured bodies bog down. Floods and dries every few hours |
| Foods | Buried food found by smell and touch; weed and carrion stranded by each flood; seeds washed down |
| Advantage | Restocked by every flood, and heavy hunters cannot cross it |
| Cost | No cover at all; under water part of the day |
| Its own cycle | The flood rhythm; baked hard in summer, under water in winter |
| When overused | Every flood restocks it, so it recovers fastest of all |
| Suits | Light bodies and wide feet; flocks that follow the waterline; species that keep time; wanderers from elsewhere |

## 4. Time and cycles

| Cycle | Where | Length |
|---|---|---|
| Day and night | Everywhere; weakest in the Thicket and the deep Pond, which are always dim | About one real hour |
| Season | Everywhere; strongest in the Meadow, weakest in the deep Pond | About two real days |
| Flood | Mudflat, and the Reed bed in spring | A few game days (proposed) |
| Fruiting | Thicket | Irregular, bush by bush |
| Rain | Everywhere: raises the brook and the pond, washes out scent, sets off blooms | Occasional |
| Hot and cold | Rocks | Daily |

With four seasons of two days each, a year is about eight real days. A species that lasts 3 to 7 days therefore lives through two to four seasons, not a whole year, and which ones depends on when it is released. A species released in spring can ignore winter; one released in autumn has to be built for it. If you meant a whole year to pass in two days, this section changes.

At one real hour a day, a player who checks in for fifteen minutes sees about a quarter of a day pass.

## 5. Use and recovery

One rule covers every biome.

- **Every food has a root stock that cannot be eaten:** grass roots, bush stems, reed roots, lichen in cracks, weed beds, the mud itself.
- **Food regrows fastest when about half of it is standing,** so moderate use yields the most and heavy use slows its own supply.
- **Overuse leaves the ground worn for a while,** and a worn biome plays by different rules: short grass gives no cover, a grazed-out pond is cloudy, flattened reeds hide nothing, a stripped bush skips a fruiting.
- **The worn state is a niche of its own,** for whatever does well on bare ground or in cloudy water.

**Tested: the biome comes back.**

| Food rule | Food fell to | Food back to 70% | Grazers died out |
|---|---|---|---|
| No root stock | 0 of 80 | Never, in 6 runs | 6 of 6 runs |
| Root stock | 0 of 80 | Every run, in about 1,130 beats | 5 of 6 runs |
| Root stock, and worn ground rests first | 0 of 80 | Every run, in about 2,780 beats | 6 of 6 runs |

**Tested: a species can be designed to manage its food.** The same grazers on the same food, with three rules for when to lay.

| Rule for laying | Peak numbers | Grazers at the end | Died out |
|---|---|---|---|
| Whenever well fed | 52 | 1 | 5 of 6 runs |
| Not when crowded | 43 | 9 | 3 of 6 runs |
| Not when food is thin | 46 | 19 | 1 of 6 runs |

Holding back when food is thin is something the behaviour vocabulary can already say: "lay, not when" a mood that is raised by seeing no food.

## 6. Niches

| Biome | Body | Life through the year | Social form |
|---|---|---|---|
| Rocks | Small; sun-loving | Breeds here, feeds elsewhere | Colonies at safe sites |
| Thicket | Small to middling; led by the nose | Hoards fruit for winter | Pairs with territories; small families |
| Meadow | Fast; far-sighted | Eggs that wait for spring; or leaves for the winter | Herds and packs |
| Reed bed | Hidden; quiet | Nests in summer cover, leaves when the reeds die back | Solitary or paired |
| Pond | Finned | Steady breeding in the deep; young in the shallows | Shoals; lone hunters |
| Mudflat | Light; wide-footed | Comes and goes with the water | Flocks |

## 7. Audit

### Who can live where

Nine grazing species from one pool were put into every biome, each biome with its own three foods, and left to breed with no hunters. Numbers at the end; a dash means it died out.

| Species | Rocks | Thicket | Meadow | Reeds | Pond | Mudflat |
|---|---|---|---|---|---|---|
| Grazer (grass) | - | - | 14.0 | - | - | - |
| Sipper (flowers) | - | - | 4.3 | - | - | - |
| Cracker (seeds) | 0.3 | - | 8.3 | 6.3 | - | 0.7 |
| Fruit-nose (fruit, by smell) | - | 14.0 | - | - | - | - |
| Prober (buried food, by smell) | - | - | - | 13.7 | 6.3 | 14.0 |
| Swimmer (weed) | - | - | - | - | 13.0 | - |
| Filterer (drift) | - | - | - | - | 8.3 | - |
| Scraper (lichen) | 10.7 | - | - | - | - | - |
| Eats most things | - | 0.7 | - | - | - | - |
| **Species living there** | 1 | 1 | 3 | 2 | 3 | 1 |

- **Every biome ends up with a different cast,** and eight of the nine species found a home somewhere.
- **A biome carries about as many grazing species as it has well-supplied foods that need different equipment.** In a first attempt the second and third foods were too scarce and the biomes carried 0, 1, 1, 2, 2 and 1 species.
- **Three biomes still carry only one.** In the Thicket, seed-eaters that hunt by sight starved in the dim light; a seed-eater with a nose would be a second species there. The Rocks and the Mudflat need their second and third foods to be worth a specialist's while.
- **This counted grazers only.** Hunters and scavengers would add to each cast, and have not been tested.

### Ten builds in six biomes

Six of one build in each biome, with a middling hunter, a big hunter and a hunter that feels movement. Survivors of six.

| Build | Rocks | Thicket | Meadow | Reeds | Pond | Mudflat |
|---|---|---|---|---|---|---|
| Sprinter | 3.1 | 1.3 | 5.1 | 3.0 | 0.5 | 6.0 |
| Tank | 3.9 | 2.6 | 5.8 | 4.0 | 2.3 | 3.0 |
| Giant | 4.3 | 2.1 | 4.1 | 4.3 | 0.0 | 3.0 |
| Ghost | 2.1 | 2.5 | 2.6 | 3.0 | 2.3 | 2.9 |
| Lookout | 1.8 | 1.0 | 2.3 | 3.3 | 0.1 | 5.8 |
| Stinger | 2.1 | 1.3 | 3.0 | 3.1 | 0.4 | 5.9 |
| Tiptoe | 0.8 | 0.9 | 1.6 | 3.0 | 1.4 | 2.0 |
| Mite | 1.8 | 1.1 | 0.4 | 2.4 | 0.1 | 5.9 |
| Swimmer | 0.3 | 0.4 | 0.6 | 0.5 | 0.4 | 0.6 |
| Wader | 0.5 | 2.0 | 0.6 | 3.3 | 0.5 | 4.1 |
| **Best** | Giant | Tank | Tank | Giant | Tank | Sprinter |

- **The ground rules move builds a long way.** The mite goes from 0.4 in the Meadow to 5.9 on the Mudflat; the giant from 4.3 on the Rocks to 0 in the Pond.
- **But only three builds are ever best, and two of them win five biomes.** Shells and size are still too strong, as the body audit found.

### Ways of living through the year

Four species competing for one food, in three climates. Adults at the end.

| Climate | Fast breeder | Fat storer | Sleeps through the cold | Eggs that wait |
|---|---|---|---|---|
| No winter | 25.0 | 4.6 | 16.0 | 20.8, plus 4.2 eggs |
| Short winter | 10.2 | 2.6 | 22.0 | 7.6, plus 2.8 eggs |
| Long winter | Died out | 0.2 | 21.8 | 9.0, plus 11.8 eggs |

The fast breeder leads where there is no winter and dies out where winter is long. The sleeper leads wherever there is a winter. Eggs that wait come second everywhere and never die out. Storing fat without sleeping is never the best.

## 8. Where this area stands

| Done when | State |
|---|---|
| Each biome has a different best build | **Not yet.** Three winners across six biomes. Depends on the body rework |
| Each biome carries several species, and a different cast from its neighbours | **Partly.** Different casts, yes; three biomes carry three or two grazers, three carry one |
| An overused biome recovers | **Yes,** one biome at a time |
| A species can be designed to manage its food | **Yes** |
| There is a map mockup | **Yes,** first pass |

Not yet tested at all: the connected map, borders, the brook, each biome's own cycle, worn states, movement between biomes, hunters and scavengers within a biome's cast, and the social forms in section 6.

## 9. Next

1. Give the Rocks, the Thicket and the Mudflat second and third foods that carry their own species, and add hunters and scavengers to the cast test.
2. Run the six biomes as one connected map, with movement across borders and the brook.
3. Carry the shell and size fixes from the body area back into the build table.
4. Test each biome's own cycle: fruiting, flood, reed die-back, tall grass, cloudy water.
