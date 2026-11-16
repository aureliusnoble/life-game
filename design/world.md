# World: a river basin of eight biomes

Draft 3, November 2026. Design area 1 in `design/plan.md`. It replaces draft 2, whose six "biomes" were each a single feature and far too small.

Anything marked **tested** was run in `design/checks/worldaudit.js`, a stand-in world. Its numbers show direction, not balance. The tests ran one patch of one habitat at a time; nothing has been run at the scale described here.

## 1. Why draft 2 was too small

Draft 2's whole map was about 27 phone screens. With 20 species of a few dozen each, plus presets, that is over a thousand creatures, and by arithmetic:

- every creature would have three or four others in view at all times;
- a creature could walk the whole map in about six minutes;
- a territory, a herd's range or a pack's chase would each cover most of a biome.

Nothing could be alone, hold ground, or travel. The behaviours the game is about need room.

## 2. Scale

What each behaviour needs, in phone screens at play zoom:

| Behaviour | Room it needs |
|---|---|
| Seeing | A creature sees about a fifth of a screen |
| A chase | One to three screens |
| A territory, for a pair or a pack | Two to three screens across |
| A herd's daily range | Four to six screens across |
| Nesting in one place and feeding in another | A few screens apart, a few minutes each way |
| A trail between a nest and food | Two to four screens long |
| Migrating between biomes | Far enough to take a real part of a day |
| Being out of sight of every other species | Empty stretches between the busy places |

**Proposed size:**

| | Draft 2 | Now |
|---|---|---|
| One biome | About 2 screens across | About 10 screens across |
| The whole map | About 6 by 4.5 screens | About 26 screens across and 20 tall |
| Walking across a biome | 2 to 3 minutes | About 10 minutes, a sixth of a game day |
| Walking across the map | About 6 minutes | About half a game day |
| Territories that fit in a biome | One | Ten or more |
| Other creatures in view, on average | 3 to 4 | One, about a third of the time; far more at busy places |

**Population.** 20 player species, or presets in their place, plus a standing cast of presets: 25 to 30 species of 30 to 80 members, so 1,500 to 3,000 creatures. That is no more than draft 2 assumed. The world is about twenty times larger in area with the same number of animals in it.

**Why it will not feel empty.** Food, water and cover are in patches, so animals gather at them and the stretches between are for travelling. A hunter wandering at random would still meet some creature about once a minute by arithmetic, but a particular prey species only every half hour or so, which means hunters have to know where their prey lives. That is what makes trails, scent and remembered places worth having.

All of this is arithmetic and proposal. Whether a small server carries a map this size is unmeasured; the cost should follow the number of creatures, not the area, if food is stored as patches and not as single plants.

## 3. Decided

- One connected map, and creatures spread wherever they can live.
- Biomes are regions, each with several features, not single features. There are several ponds and several brooks.
- There are eight biomes, each about ten phone screens across, in a basin about 26 screens across and 20 tall.
- Animals gather at water, food and cover, and the ground between is emptier.
- Preset species fill the places players leave empty.
- A day is about one real hour; a season about two real days.
- Boom and bust stays: managing a species' resources is part of designing it.

Draft 2 fixed the number of biomes at six. This draft has eight, because you asked for more environments, and you accepted it on 15 November.

## 4. The basin

The map is one river basin seen from above, from the high ground in the north to the sea in the south.

| Biome | Where | Borders |
|---|---|---|
| Highlands | North | Woodland, Heath, Grassland |
| Woodland | North-east | Highlands, Grassland, Lakeland |
| Heath | West | Highlands, Grassland, Dunes |
| Grassland | Centre | All but the Tidal flats |
| Lakeland | East | Woodland, Grassland, Marsh |
| Marsh | South-centre | Grassland, Lakeland, Tidal flats, Dunes |
| Dunes | South-west | Heath, Grassland, Marsh, Tidal flats |
| Tidal flats | South, along the sea | Marsh, Dunes |

**Water is a network.** Three brooks rise in the Highlands and the Woodland. They join into two rivers that cross the Grassland; one fills the lakes and seeps on through the Marsh, the other runs down the edge of the Heath, and both fan out across the Tidal flats to the sea. Running water carries drift, scent and floating eggs downstream; it is a road for swimmers and a barrier to small walkers.

**On a phone,** three levels: the basin, with each species' range as a wash of colour; one biome, with its features; and play zoom, following creatures. A mockup of the basin is in `design/mockups/world-map.html`.

## 5. Habitats

A biome is a mix of habitats under one climate. The same habitat can turn up in more than one biome, and its rule is the same wherever it is.

| Habitat | Its rule | Status |
|---|---|---|
| Open grass | Fast ground; nowhere to hide; tall grass hides small bodies until grazed | Tested |
| Thicket | Slows big bodies; dim; hides what is inside | Tested |
| Rock and crevice | Hard ground; gaps only small bodies fit; high ground sees farther | Tested |
| Reed stand | Hides what is inside; shallow water underfoot; slows big bodies | Tested |
| Still water | Needs fins or paddles; light shallows, dark deeps | Tested |
| Mud | Heavy and armoured bodies bog down; buried food | Tested |
| Running water | A current to swim with or against; carries scent and drift | Proposed |
| Sand | Slows legs; easy to dig; wind wipes scent and tracks | Proposed |
| Scrub | Thin cover; little food; burns | Proposed |
| Cave | No light at all; even temperature all year | Proposed |
| Island | Any habitat, cut off by water | Proposed |

## 6. The eight biomes

### Highlands

| | |
|---|---|
| Habitats | Crags and crevices; scree slopes; small cold pools; caves; springs where the brooks begin |
| Climate and cycle | Coldest, with the longest winter and snow on the tops. Hot days and freezing nights |
| Foods | Lichen; seeds blown up from below; weed in the pools; fungus in the caves |
| Advantage | The safest places to rest and nest, and the longest views |
| Cost | The least food on the map |
| Suits | Small bodies; baskers; colonies that nest here and feed lower down; cave dwellers that need no eyes |

### Woodland

| | |
|---|---|
| Habitats | Dense stands; glades of open grass; fallen logs; forest brooks; a gorge |
| Climate and cycle | Mild and sheltered. Always dim. Fruiting moves from stand to stand; autumn leaf fall feeds fungus |
| Foods | Fruit in bursts; fungus; seeds and nuts; small prey in the litter |
| Advantage | Rich food, out of reach of big hunters |
| Cost | Eyes work poorly, and the food moves about |
| Suits | Noses; hoarders; wanderers that call others to a find; pairs that hold a territory |

### Heath

| | |
|---|---|
| Habitats | Dry scrub; bare sandy patches; banks soft enough to burrow in; a few water holes |
| Climate and cycle | Dry, with hot summers. Late-summer fires burn patches of scrub, and the burnt ground flushes with new growth |
| Foods | Seeds; shoots on burnt ground; insects; whatever gathers at the water holes |
| Advantage | Few competitors, and a rush of food after a fire |
| Cost | Little water and thin cover |
| Suits | Burrowers; species that follow the fires; ambushers at water holes; lives that need little |

### Grassland

| | |
|---|---|
| Habitats | Open plain; tussock that hides small bodies; flower fields; copses; pools that fill in spring; river crossings |
| Climate and cycle | The strongest seasons: lush summers and dead winters |
| Foods | Grass; flowers by day; seed in late summer |
| Advantage | The most food, and room to run |
| Cost | Little cover, and the hardest winters |
| Suits | Speed and long sight; herds; packs; eggs that wait for spring; species that leave for the winter |

### Lakeland

| | |
|---|---|
| Habitats | Several ponds of different sizes; one deep lake; islands; channels between the waters; lily shallows; reed fringes |
| Climate and cycle | Mild. Water rises after rain and blooms follow. Pond edges freeze in winter; the lake's deep does not |
| Foods | Weed; drift where streams enter; litter on the bottom, found by smell; small prey |
| Advantage | Water to escape into, and a deep with no winter |
| Cost | Needs fins or paddles to use fully; each pond is small enough to be eaten out |
| Suits | Fins; shoals; big hunters of the deep; species that move from pond to pond; young in water and adults on land |

### Marsh

| | |
|---|---|
| Habitats | Reed stands; lanes of open water; floating mats; mud banks; drowned trees |
| Climate and cycle | Floods in spring. Reeds grow through summer and die back in winter, leaving no cover |
| Foods | Seed heads; weed; buried food in the mud; other species' eggs |
| Advantage | The best cover on the map, for hiding and for nests |
| Cost | Nothing can see far, and the cover is gone in winter |
| Suits | Hiders and stalkers; hidden nests; solitary and paired lives; waders |

### Dunes

| | |
|---|---|
| Habitats | Loose sand ridges; damp hollows with plants; grass tufts; the driftline; blown-out bowls |
| Climate and cycle | Windy. Scent marks and tracks vanish within the hour. Hot by day, cold at night |
| Foods | Seeds; plants in the hollows; whatever the sea leaves on the driftline |
| Advantage | Nothing can track you, and digging is easy |
| Cost | Legs are slow on sand; food is thin and far apart |
| Suits | Burrowers; wide feet; lone wanderers; species that cannot afford to be followed |

### Tidal flats

| | |
|---|---|
| Habitats | Mud; branching channels; sandbars; salt pans; pools left by the tide |
| Climate and cycle | The tide covers and uncovers them several times a day |
| Foods | Buried food found by smell and touch; whatever each tide strands; weed in the pools |
| Advantage | Restocked by every tide, and heavy hunters cannot cross the mud |
| Cost | No cover at all, and under water part of the day |
| Suits | Light bodies; flocks that follow the waterline; species that keep time; visitors from other biomes |

## 7. Time

| Cycle | Where | Length |
|---|---|---|
| Day and night | Everywhere; the Woodland floor, caves and lake deeps are always dim | About one real hour |
| Season | Everywhere; strongest in the Grassland and Highlands, weakest in caves and the lake deep | About two real days |
| Tide | Tidal flats | Several times a game day |
| Flood | Marsh in spring; Lakeland after rain | Days |
| Fruiting | Woodland | Irregular, stand by stand |
| Fire | Heath | Late summer, patch by patch |
| Wind | Dunes | Always |
| Rain | Everywhere: raises rivers and ponds, washes out scent, sets off blooms | Occasional |

With four seasons of two days each, a year is about eight real days. A species that lasts 3 to 7 days lives through two to four seasons, and which ones depends on when it is released.

## 8. Use and recovery

One rule covers every habitat.

- **Every food has a root stock that cannot be eaten.**
- **Food regrows fastest when about half of it is standing,** so moderate use yields the most.
- **Overuse leaves the ground worn for a while,** and worn ground plays by different rules: short grass gives no cover, a grazed-out pond is cloudy, flattened reeds hide nothing.
- **Worn and burnt ground is a niche of its own.**

At this scale overuse is local. A species can eat out one pond or one glade and move to the next, so how it moves between patches matters as much as how fast it breeds.

**Tested, one patch at a time:**

| Food rule | Food back to 70% | Grazers died out |
|---|---|---|
| No root stock | Never, in 6 runs | 6 of 6 runs |
| Root stock | Every run, in about 1,130 beats | 5 of 6 runs |

| Rule for laying | Grazers at the end | Died out |
|---|---|---|
| Whenever well fed | 1 | 5 of 6 runs |
| Not when crowded | 9 | 3 of 6 runs |
| Not when food is thin | 19 | 1 of 6 runs |

## 9. What the patch tests say

These ran on single patches of six habitats. They still hold for those habitats; they say nothing yet about whole biomes.

**Who can live where.** Nine grazing species from one pool, in a patch of each habitat with its own foods, left to breed.

| Species | Rock | Thicket | Open grass | Reed stand | Still water | Mud |
|---|---|---|---|---|---|---|
| Grazer (grass) | - | - | 14.0 | - | - | - |
| Sipper (flowers) | - | - | 4.3 | - | - | - |
| Cracker (seeds) | 0.3 | - | 8.3 | 6.3 | - | 0.7 |
| Fruit-nose (fruit, by smell) | - | 14.0 | - | - | - | - |
| Prober (buried food, by smell) | - | - | - | 13.7 | 6.3 | 14.0 |
| Swimmer (weed) | - | - | - | - | 13.0 | - |
| Filterer (drift) | - | - | - | - | 8.3 | - |
| Scraper (lichen) | 10.7 | - | - | - | - | - |
| **Species living there** | 1 | 1 | 3 | 2 | 3 | 1 |

A patch carries about as many grazers as it has well-supplied foods needing different equipment. A biome made of four or five habitats should carry the sum of their casts, plus hunters and scavengers; that is untested.

**Builds.** The first test of ten hand-picked builds in six habitats was flawed: its hunters starved about a quarter of the way through each run. The balance lab (`design/plan.md`, section 3) replaced it. It searched about a hundred designs in each habitat and found that the ground rules do change the winner's limbs, senses and armour, but that the smallest size and fat storage win in every habitat, and one design is as good as the best in five of the six. Only water forces a different body.

**Ways of living through the year.** A fast breeder leads with no winter and dies out in a long one; a species that sleeps through the cold leads wherever there is a winter; eggs that wait for spring come second everywhere. Storing fat without sleeping is never best.

## 10. Where this area stands

| Done when | State |
|---|---|
| The map is large enough for territories, herds, packs and migration | **Accepted as a proposal,** by arithmetic only |
| Each biome has several habitats and its own climate, foods, advantage and cost | **Written,** untested |
| Each biome carries several species, and a different cast from its neighbours | **Partly,** at patch scale |
| An overused patch recovers, and a species can be designed to manage its food | **Yes,** at patch scale |
| Each biome has a different best build | **Not yet.** In the balance lab one design is near the best on every land habitat |
| There is a map mockup | **Yes,** redrawn at this scale |

Not yet tested: anything at biome or basin scale, movement between patches and between biomes, running water, sand, scrub, caves, islands, fire, tide and wind.

## 11. Answered

You accepted this draft on 15 November: eight biomes, about ten screens across each, with emptier ground between the busy places. The sizes remain a proposal until something has been run at this scale.

## 12. Next

1. A stand-in world at biome scale, with patches of several habitats, to test movement between patches, territories and a herd's range.
2. Add hunters and scavengers to the cast test.
3. Give running water, sand, scrub, caves, fire, tide and wind their mechanics and run each.
4. Carry the shell and size fixes from the body area back into the build test.
