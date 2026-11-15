# World: six biomes on one connected map

Draft 1, November 2026. Design area 1 in `design/plan.md`. It builds on the layers and findings in `design/environment.md`.

Anything marked **tested** was run in `design/checks/worldaudit.js`, a stand-in world. Its numbers show direction, not balance. The tests ran one biome at a time; nothing here has been run as a connected map.

## 1. Decided

- One connected map. Biomes sit side by side and creatures spread wherever they can live.
- About six biomes, fixed.
- Preset species fill the places players leave empty.

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

**On a phone,** three views: the whole map with each species' range as a wash of colour; one biome; and following one creature. In the Paper lagoon look each biome is a layer of the stack, from the Rocks at the top to the deep middle of the Pond.

Size is a proposal: each biome a few screens across, and the whole map crossable by a middling creature in several minutes.

## 3. The six biomes

### Rocks

| | |
|---|---|
| Ground | Hard and fast. Crevices that only small bodies fit. Hot by day, cold at night. High ground sees farther |
| Food | Lichen, slow to regrow; a little weed in pools |
| Its own cycle | The daily swing from hot to cold |
| When overused | Lichen takes longer to return than any other food. The crevices are untouched |
| Suits | Small bodies; baskers; species that nest here in safety and feed elsewhere; colonies |

### Thicket

| | |
|---|---|
| Ground | A tangle that slows big bodies. Dim even by day. Leaf litter underfoot |
| Food | Fruit in bursts, one bush at a time; fungus on litter and on the dead |
| Its own cycle | Fruiting moves from bush to bush; autumn leaf fall feeds the fungus |
| When overused | A stripped bush misses its next fruiting. Trampling opens a glade, which closes again |
| Suits | Small and middling bodies; noses; hoarders; wanderers that call others to a find; pairs that hold a territory |

### Meadow

| | |
|---|---|
| Ground | Open and fast. Grass grows tall in summer and hides small bodies, until grazing cuts it short |
| Food | Grass, quick to regrow and quickest when about half is left; flowers by day; seed in late summer |
| Its own cycle | The strongest seasons on the map: lush summers and dead winters |
| When overused | Bare patches regrow from the roots. Heavy grazing strips the cover small animals depend on |
| Suits | Speed and long sight; herds; packs; eggs that wait for spring |

### Reed bed

| | |
|---|---|
| Ground | Stems hide whatever is inside. Shallow water underfoot. Big bodies are slowed |
| Food | Seed heads in season; small prey among the stems; other species' eggs |
| Its own cycle | Reeds grow through summer and die back in winter, leaving no cover; a spring flood |
| When overused | Trampling and crowded nesting flatten the reeds, which regrow the next summer |
| Suits | Hiders and stalkers; hidden nests; solitary and paired lives |

### Pond

| | |
|---|---|
| Ground | Water. The shallows are light and warm; the middle is deep, dark and cold |
| Food | Weed in the shallows; drift at the brook mouth; litter on the bottom |
| Its own cycle | Blooms after rain; the edges freeze in winter |
| When overused | With the weed grazed out the water clouds and sight shortens, until the weed returns |
| Suits | Fins; shoals; big hunters of the deep; filter feeders; species whose young live in water and adults on land |

### Mudflat

| | |
|---|---|
| Ground | Soft, so heavy and armoured bodies bog down. Floods and dries every few hours |
| Food | Buried food found by smell and touch, not sight; whatever each flood strands |
| Its own cycle | The flood rhythm; baked hard in summer, under water in winter |
| When overused | Every flood restocks it, so it recovers fastest of all |
| Suits | Light bodies and wide feet; flocks that follow the waterline; species that keep time; wanderers from elsewhere |

## 4. Cycles

| Cycle | Where | Proposed length |
|---|---|---|
| Day and night | Everywhere; weakest in the Thicket and the deep Pond, which are always dim | A few real hours |
| Seasons | Everywhere; strongest in the Meadow, weakest in the deep Pond | About two real days |
| Rain | Everywhere: raises the brook and the pond, washes out scent, sets off blooms | Occasional |
| Flood | Mudflat, and the Reed bed in spring | Hours |
| Fruiting | Thicket | Irregular, bush by bush |
| Hot and cold | Rocks | Daily |

## 5. Use and recovery

One rule covers every biome.

- **Every food has a root stock that cannot be eaten:** grass roots, bush stems, reed roots, lichen in cracks, weed beds, the mud itself.
- **Food regrows fastest when about half of it is standing,** so moderate use yields the most and heavy use slows its own supply.
- **Overuse leaves the ground worn for a while,** and a worn biome plays by different rules: short grass gives no cover, a grazed-out pond is cloudy, flattened reeds hide nothing, a stripped bush skips a fruiting.
- **The worn state is a niche of its own,** for whatever does well on bare ground or in cloudy water.

**Tested,** with breeding grazers on food that regrows from what is standing:

| Food rule | Food fell to | Food back to 70% | Grazers died out |
|---|---|---|---|
| No root stock | 0 of 80 | Never, in 6 runs | 6 of 6 runs |
| Root stock | 0 of 80 | Every run, in about 1,130 beats | 5 of 6 runs |
| Root stock, and worn ground rests first | 0 of 80 | Every run, in about 2,780 beats | 6 of 6 runs |

The biome comes back. The species that overused it mostly does not: the grazers bred to a peak of about 50, ate everything and starved together before the food returned. A species that survives its own success has to hold back its breeding or move on, and both are things a player designs.

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

- **The ground rules do move builds a long way.** The mite goes from 0.4 in the Meadow to 5.9 on the Mudflat; the giant from 4.3 on the Rocks to 0 in the Pond; the wader from 0.6 in the Meadow to 3.3 in the Reeds.
- **But only three builds are ever best, and two of them win five biomes.** Shells and size are still too strong, as the body audit found. Until that is fixed, biomes cannot each have their own winner.
- **The Pond does not reward the plain swimmer.** Fins stop it being slow there, but it has no defence, and the shelled tank does better even at a crawl.

### Ways of living through the year

Four species competing for one food, in three climates. Adults at the end; the last column counts eggs.

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
| An overused biome recovers | **Yes,** in one biome at a time |
| There is a map mockup | **Not yet** |

Not yet tested at all: the connected map, borders, the brook, each biome's own cycle, worn states, movement between biomes, and the social forms in section 6.

## 9. Questions for you

1. **Boom and bust.** In testing, a species that bred without restraint ate its biome bare and died out, while the biome recovered. Should that be able to end a player's species early, as a consequence of their design, or should the game soften it?
2. **Time.** A day of a few real hours and a year of about two real days would give a species that lasts 3 to 7 days one to three winters. Does that rhythm suit how you want to check in?
3. **The six.** Rocks, Thicket, Meadow, Reed bed, Pond and Mudflat, joined by a brook. Is there a kind of place you were hoping for that is not here?

## 10. Next

1. A map mockup in the Paper lagoon look.
2. Run the six biomes as one connected map, with movement across borders.
3. Carry the shell and size fixes from the body area back into the biome table.
