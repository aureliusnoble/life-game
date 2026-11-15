# Plan: full design first, then build

Draft 2, November 2026. Replaces the "one pond" first version of draft 1.

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
| World size | Six biomes, fixed: Rocks, Thicket, Meadow, Reed bed, Pond and Mudflat. Each must be large enough, carry several different species, and have its own resources, advantages and costs |
| Time | A day is about one real hour and a season about two real days |
| Boom and bust | Stays. A species that breeds without restraint can eat its biome bare and die out; managing resources is part of designing it |
| Working arrangement | Reviewed changes into the main branch |

## 2. How the design process runs

Each area below goes through the same four steps, and is not called done until it passes.

1. **Write it down** as a design document.
2. **Test it for richness.** Where the stand-in world can run it, an audit: does each piece change what happens, and is each the wrong choice somewhere? Where it is about people, a mockup to react to.
3. **Questions and answers** on the choices that are yours.
4. **Close it** against its own checklist, and list what is still open.

## 3. Design areas, in order

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
| 8 | **Player loops** | The first hour; the daily visit; the design session; death and what follows; unlocks and puzzles; long-term goals | Each loop is written as a sequence of screens and has a reason to return |
| 9 | **Pet play** | What a player can do with individuals, where, and what comes back | A mockup that is pleasant to poke at for five minutes |
| 10 | **Feedback** | Recap, watching it think, the death view, the food web, records | For any outcome, the player can find out why |
| 11 | **Playing with friends** | Relationships between species, seeing each other's work, sharing, rankings | Friends have reasons to talk about it |
| 12 | **Look, sound and feel** | Paper lagoon across every biome; bodies that show acts and moods; interface style; sound | Mockups of each biome and of a creature in every mood |
| 13 | **Screens** | Every screen and the paths between them | A click-through mockup of the whole game |
| 14 | **Build plan** | Architecture, phases, tests | Written against the finished design |

## 4. What exists already

| Area | Document | State |
|---|---|---|
| Behaviour | `design/neural-blocks.md` (draft 4) | Vocabulary written and audited; ten verbs and most functions untested |
| Bodies | `design/body.md` (draft 1) | Parts audited; shells, the inside and camouflage need rework |
| World | `design/world.md` (draft 2), on top of `design/environment.md` | Six biomes on one connected map, with a map mockup. An overused biome recovers and a species can be designed to manage its food. Biomes have different casts, but three carry only one grazing species, and they do not yet each have their own best build |
| Loop and lifespan | `design/world-and-loop.md` | Direction decided; fading and keeper actions proposed |
| Look | `design/art-direction.md` | Soft critters in the Paper lagoon direction |
| Technology | `reports/Creature sim game design exploration.md` | A recommended stack, unmeasured |

## 5. Building, once the design is closed

The order from draft 1 stands, with the designers first:

1. Foundations.
2. The simulation, with the audits as its tests.
3. The designers and a test tank on a phone, tried with friends.
4. The shared world.
5. The daily loop and pet play.
6. Look, sound and feel in production form.
7. A first season with the group.

## 6. Risks carried into the design

| Risk | Where it is dealt with |
|---|---|
| Hunters and prey cannot both persist | Area 4 |
| One build wins everywhere | Areas 1, 4 and 5 |
| Friends cannot build behaviours on a phone | Area 8 mockups, then building step 3 |
| A rich world is too much for a small server or a phone | Area 1 sets the size; measured in building step 2 |
| The design grows without end | Each area has a "done when", and area 14 does not start until the others are closed |
