# Plan: full design first, then build

Draft 3, November 2026. Adds the larger world, how balance is tested, and the interface as a design area.

## 1. Decisions made

| Question | Decision |
|---|---|
| Hosting | A small fixed-price server at roughly €6 to €10 a month is fine |
| The group | 5 to 20 friends. Empty places in the ecosystem are filled by preset species we make |
| Order of building | The designers come before the shared world |
| Overlap | A player can release a new species whenever they choose. Releasing retires the current one: its eggs stop hatching and its living members die of old age |
| Scope | Do the whole design now, as completely as possible, before building. This is the moment to find out which systems are not rich enough |
| The world | Much richer than one pond: several biomes, each with its own cycles, that respond to how species use them, recover after being overexploited, and offer niches for different bodies, life cycles and social organisation |
| Pet play | There must be Tamagotchi-like interaction with the species. A species goes through many generations, the old die, and it is extinct when the last one dies. So the special individual is a line, not one animal: the player names a founder, and when it dies the name and some of its memories pass to an heir among its descendants. The details are area 9's to settle |
| World shape | One connected map. Biomes sit side by side, creatures spread wherever they can live, and the borders between biomes are places in their own right |
| World size | Eight biomes in one river basin: Highlands, Woodland, Heath, Grassland, Lakeland, Marsh, Dunes and Tidal flats. Each is a region about ten phone screens across with several habitats in it; the basin is about 26 screens across and 20 tall. Animals gather at water, food and cover, with emptier ground between |
| Time | A day is about one real hour and a season about two real days |
| Boom and bust | Stays. A species that breeds without restraint can eat its biome bare and die out; managing resources is part of designing it |
| Score | Total life: the living weight of a species added up over every hour it lasts, which is biomass times longevity. Weight is counted as it is, so that a species that carries more life on the same food scores for it. A hunter's weight counts for more than a grazer's, because it takes several grazers to make one hunter. Longest-lived and highest peak are kept as records beside it |
| Balance | Testing that the options are viable, different from each other and free of dominant strategies is treated as the hardest part of designing the mechanics. It is finalised at the end of the design process, not area by area. Until then the lab is used to check direction and to catch broken tests |
| Fading | The same for every species of the same age, whatever state the species is in. Two days of grace, then a ramp slower than doubling that never stops, so that everything dies in the end. A better design lasts longer: few are expected past seven or eight days, and twenty is acceptable for a truly exceptional one |
| Generations | Many in a species' life, set by size: about 25 for a small species, 10 for a plain one, and six or more even for a large one |
| Breeding | Chosen per species: alone, in pairs, one breeder with helpers, both sexes in one, or splitting. Young forms with their own body are in the first version |
| Forms | A species is made of forms: each sex, life stage and caste has its own body and its own page of instincts under the same combined allowance. Each is a variation on one base. Forms must not be completely divergent, and the more one differs the more it costs |
| Unkind behaviour | All of it is allowed |
| Changing a living species | One mutation a day, picked from three offered at random, applied to the newly hatched |
| Friends' designs | Open to all once the species has ended |
| Explaining | Little text. The game shows what happened and does not explain why; events are classified so they can be shown on the map, in the recap and in the chronicle |
| Attaching | Creatures can attach to each other and come off again, with defences against it. Bodies joined for good into one animal are out |
| Presets | Twenty preset species, with no advantages, no fading and no score. Each living player species takes the place of one. They are respawned if they die out, need not be equally successful, and together should form a fluctuating but stable ecosystem |
| Dominance | A species' dominance is expected to be cyclical and to depend on which other species are around. The aim is a world that keeps turning over, not one where every design does equally well at every moment |
| Unlocks | Unlocks should push players to explore different ways of playing, not only reward more of the same |
| Interface | Handcrafted, cute and intuitive without losing depth. Depth is revealed a little at a time, and the game teaches itself through onboarding with callouts. Researched before it is designed |
| Working arrangement | Reviewed changes into the main branch |

## 2. How the design process runs

Each area below goes through the same four steps, and is not called done until it passes.

1. **Write it down** as a design document.
2. **Test it for direction.** Where the stand-in world can run it, a check that each piece does something and that nothing is broken. Where it is about people, a mockup to react to. Tuning waits for the balance pass at the end.
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
| Open | Whatever a settled world holds, some different design can establish itself in it |
| Turning over | As newcomers are added one after another, no design stays on top and the world does not collapse to one |

The last three matter most. Balance in the game moves: what does well depends on which other species are around and how they are doing. A world with no hunters fills with grazers, and that is an opening for a hunter. So the lab's main test, once it can search hunters as well as grazers, is to fill a world with the current winners, search for a newcomer that can get in, add it and repeat. The game should also show players where the openings are.

**The balance lab** (`design/checks/balancelab.js`) runs these.

- **Every choice is data.** Body options, behaviour kits and breeding rules are one list the lab combines under the budget. A new part or word is added once and is then tested everywhere.
- **A search plays the adversary.** In each habitat it breeds designs toward whatever does best there, as a player trying to break the game would. The earlier audits compared builds picked by hand, which is how they missed things.
- **A report gives verdicts:** who wins where on maps the search has not seen, how often each option is chosen, and whether winners hold their home against visitors.
- **A knockout test** changes one choice at a time in a winner, to show which choices matter and which make no difference.
- **The lab checks itself first:** that hunters are present for the whole run, that a blind design does badly, that removing hunters helps, and how much the same design varies from map to map. A difference smaller than that variation is not reported as a finding.
- **Results are kept** in `design/checks/balance/`, and the lab is re-run whenever a rule or a number changes, so a fix that breaks something else shows up.

**What a simulation cannot test** is whether any of it is fun, readable or satisfying. That is tested with people: mockups to react to in each area, a playable test tank with friends as the first thing built, and in the first season a record of which options get used and how species die.

**First run, 15 November, scored by head count.** Six habitat patches, about a hundred designs searched in each, grazers only. The lab's checks on itself pass. Scores run from 0 to about 2, and differences under about 0.15 are noise.

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

**Second run, 15 November, scored by total life.** The same search, with the score you chose, counting weight two ways and then changing one body rule.

| Score | Sizes that win | Inside that wins | One design is near the best in |
|---|---|---|---|
| Head count (first run) | The smallest only | Fat storage, in every winner | 5 of 6 habitats |
| Total life, weight as it is | Large and largest only | A large gut, in 5 of 6 | 5 of 6 |
| Total life, weight counted by appetite | Plain, large and largest; never small | A large gut, in every winner | 4 of 6 |
| Total life, weight as it is, and every unit of weight costs the same to run | Plain and large; never the smallest or the largest | A large gut, in 4 of 6 | 4 of 6 |

- **How the score counts weight decides which body wins.** Count heads and the smallest wins. Count weight and the largest wins, because the same food carries more weight as fewer, larger animals.
- **Decided: weight is counted as it is.** Counting by appetite, or by food eaten, would be even-handed on size, but it would not reward a species for being efficient, and carrying more life on the same food is part of doing well. So the body rules, not the score, have to make both a swarm of small animals and a few large ones worth playing.
- **Why a swarm cannot win today.** In the stand-in a large body burns less food for each unit of weight, so the same food carries about 1.8 times the weight as a few of the largest animals as it does as many of the smallest. When every unit of weight costs the same to run, the largest size stops winning, and plain and large sizes share the habitats. The smallest still never wins: all three test hunters can eat it, and it breeds no faster than anything else.
- **Three failures do not depend on the score.** One inside wins everywhere, whichever it is. Small bodies have no place once heads are not counted. One design is near the best in most habitats.

Limits of the lab today:

- **Its hunters are a fixed cast, replaced when they die,** so nothing a design does to its hunters lasts. Spikes won everywhere while hunters could be killed off and nowhere once they were replaced. The truth is between the two, and needs hunters that are designs as well.
- **A run is 5,000 beats,** so the lasting half of total life is barely tested, and fading is not in it.
- **Food regrows at a fixed rate,** so holding back from laying cannot pay. The root-stock rule from the world design has to go in.
- **It searches grazers only,** against three fixed hunters, with four behaviour choices out of a vocabulary of about a hundred words.
- **It runs the six habitat patches,** not the eight biomes, and about a hundred designs a habitat is a thin search.

Two faults in the stand-in were found on 15 November while testing size (`design/body.md`, section 4): a plant was one meal for a body of any size, and the lab capped a species at 30 animals. Both have switches in the lab (`LEFTOVERS=1`, `CAP=90`), and neither is yet the default, so the runs above were made with the faults in.

Next for the lab: make those two fixes the default and re-run the search with the size rules from the body design; the root-stock food rule; hunter designs searched against the grazer winners and back again; many more behaviour choices; long runs of a mixed world for the "lasting" test; then the fixes to size, the inside, sting and camouflage, each re-run through it.

## 4. Design areas, in order

Earlier areas constrain later ones, so the order matters. The score, which is part of area 7, was settled first because every test depends on it. Art and the mockups in section 5 run alongside. After area 13 comes a balance pass over the whole design, using the tests in section 3, and only then the build plan.

| # | Area | Has to answer | Done when |
|---|---|---|---|
| 1 | **World** | Which biomes; what each one's ground, food and cycles are; how biomes respond to use and recover; how they connect; how a player sees it on a phone | Each biome has a different best build; an overexploited biome recovers; there is a map mockup |
| 2 | **Life cycles** | Eggs, growth, young forms, sexes, lifespans, death and what the dead become | At least four ways of living through a year each win somewhere |
| 3 | **Social organisation** | Loners, pairs, herds, packs, colonies with castes, territories | Each form can be built from the vocabulary and each pays in some biome |
| 4 | **Ecosystem balance** | Hunters and prey that persist together; the cast of preset species; how many player builds can coexist | A mixed world runs for a long time without collapsing to one species |
| 5 | **Bodies** | Fix shells, the inside and camouflage; audit the untested parts; set costs | No part is always right or always wrong |
| 6 | **Behaviour** | Fold in everything decided since draft 4: forms, home scent, For life, the additions from the social survey, attaching, and an extensive set of words for the world's events and directions. Audit the untested verbs and mood functions; check it can express areas 2 and 3 | Every word has passed its audit |
| 7 | **Lifespan and scoring** | Fading, what counts as doing well, what happens at death, the rhythm of play across weeks | Lifespans land in 3 to 7 days in simulation, and skill moves them |
| 8 | **Player loops** | The first hour and how the game teaches itself; the daily visit; the design session; death and what follows; unlocks and puzzles, and how unlocks draw players toward ways of playing they have not tried; long-term goals | Each loop is written as a sequence of screens and has a reason to return |
| 9 | **Pet play** | The named line: who the heir is, and which memories pass down. What a player can do with the name-bearer and with others, where, and what comes back. Whether the name-bearer can be talked to (below) | A mockup that is pleasant to poke at for five minutes |
| 10 | **Feedback** | Recap, watching it think, the death view, the food web, records, and the classified events | For any outcome, the player can see what happened by looking, with little text |
| 11 | **Playing with friends** | Relationships between species, seeing each other's work, sharing, rankings | Friends have reasons to talk about it |
| 12 | **Look, sound and feel** | Paper lagoon across every biome; bodies that show acts and moods; an interface that feels handmade and stays readable; sound | Mockups of each biome, of a creature in every mood, and of the interface style |
| 13 | **Screens** | Every screen and the paths between them; what is shown first and what is revealed later; onboarding with callouts | A click-through mockup of the whole game, tried by someone who has not seen it |
| 14 | **Build plan** | Architecture, phases, tests | Written against the finished design |

**How the interface gets from mockups to release quality.** The mockups made so far are concept tests. Each answers whether an idea works at all, and none of them is an interface design. The first one, the behaviour editor, was judged on 15 November to work as a concept and to be nowhere near a finished interface. The interface itself is designed in stages, and each stage is reviewed before the next begins.

1. **Concepts.** Rough and interactive, one question each. This is where the mockups are now.
2. **Flows.** Every screen and the paths between them as plain wireframes at phone size, with real content, before any styling. The wireframes settle what each screen is for and what it says. They are not layouts to be dressed.
3. **A style system.** The paper rulebook: type, colour, spacing, shapes, shadows, motion and sound, and every component drawn in every state it can be in.
4. **Key screens at full quality,** a few at a time, in several versions set side by side. This stage starts again from what each moment should feel like and do, with careful and deliberate thought about the design. It does not lean on the wireframes for layout.
5. **Tested on real phones** by two or three friends who have not seen it, then revised.
6. **Only then built** as the game's own components.

**Scoped for area 8: unlocks that widen play.** Ideas to design, not decisions.

- **Kits by way of life.** Parts and words come in small sets that suggest a style, such as a stalker's set, a swarm's set or a water set, so that an unlock is an invitation to try something.
- **Earned by doing something new.** A first hunter, a first species to winter in the Highlands or a first colony unlocks what the next step in that direction needs. Repeating the same design unlocks nothing more.
- **Pointed at the world's openings.** When a biome has no hunters or a food is going uneaten, the next offer leans that way.
- **Variety, not power,** as already decided: the budget stays fixed.

**Scoped for area 9: talking with your creature.** An idea to design. The player taps a few buttons to talk to the name-bearer, and it answers in character. Four things about it are decided: the interactions are a fixed set, the model cannot change the game, the two kinds of memory are kept apart, and memories are stored with the species.

- **What it draws on:** a personality that follows from the species' design, its mood and needs now, and memories: its own, its line's, and what others of its kind have been through.
- **What it is for:** affection, and finding out what happened in the world and what is troubling the species. The player can ask it to do things or give it things, and it may agree or refuse.
- **The model cannot change the game.** The simulation decides whether the creature agrees, from its real moods and instincts, and applies any effect itself. The model only puts the outcome into words, so talking cannot be used to cheat and the model cannot be talked into anything.
- **A fixed set of interactions, not open typing:** a short list of things to say, ask, request and give. It is cheaper and safer, and it suits a phone.
- **Two memories, kept apart.** Species memory is the record of game events and states: what happened to the line and its kind, written only by the simulation. Conversation memory is what the player and the creature have said to each other. The model can read both and add only to the second.
- **Where memories live:** on the server, with the species. How much is kept, what is forgotten and what an heir receives are still to design.
- **How it would run:** a small model on the game's own server is not practical. A server at this price has no graphics card, and a model small enough to run on its processor would be slow, would compete with the simulation, and would write poorly. A cheap hosted model with a daily limit for each player is practical: each reply is short and built from a few facts. The provider, the price and the speed are to be checked when it is designed.
- **It must be optional:** nothing in the game depends on it.
- **Five talks a day for each player** (decided), shown as pips beside the Talk button and refilled overnight.
- **Running out is shown in the game's own language, never as a limit or a credit** (decided): the named one has said what it has to say for today. It still answers a stroke or food with sounds and poses, the Talk button shows it settling down, and it turns back to its own life. The same thing happens if the service is down. Its place in the simulation is untouched, because the model cannot change the game.
- **Every call is the same bounded size,** so the cost has a ceiling: the standing instructions, the species' personality sheet, the last twenty or so events from the species memory, the named line's memories, its state now, and the last few exchanges. About 2,500 tokens in and a reply of a sentence or two, allowed up to 300 tokens out, with the model's extra reasoning turned off.

**The most it can cost.** Twenty players, each using all five talks every day, is 100 calls a day. With one more call a day for each player to shorten their conversation memory, and a personality sheet for each new species, that is about 125 calls a day, or 3,750 a month.

| Model | Price for each million tokens, in and out | Each call | A month at the maximum |
|---|---|---|---|
| Claude Haiku 5.5 | $0.10 and $0.50 | $0.0004 | About $1.50 |
| Gemini 2.5 Flash | $0.30 and $2.50 | $0.0015 | About $5.60 |
| Gemini 3.8 Flash | $0.75 and $3.75 until the end of 2026, then $1.50 and $7.50 | $0.003, then $0.006 | About $11, then $22.50 |
| Claude Sonnet 5.5, for comparison | $2 and $10 | $0.008 | About $30 |

- **Sources:** Claude prices are Anthropic's list as of 3 November 2026. Gemini prices are from a search summary of Google's pricing page on 15 November, not from the page itself.
- **Twenty talks a day each,** four times the proposal, would be about $5 a month on the cheapest model.
- **Two guards on the bill:** the server counts talks for each player and refuses the call past the limit, and the provider account carries a monthly spending limit, so that a fault cannot run it up.
- **Not measured:** how quickly a reply comes back, and whether the smallest model writes well enough in a creature's voice. Both need a trial before this is built.

## 5. Mockups still to make

Each is something to react to on a phone, and each belongs to one or more of the areas above.

| Mockup | Covers | Areas |
|---|---|---|
| Behaviour editor with "watch it think" | Building instincts, moods and signals, and seeing which urges are pulling. The core of the game, and the one piece the research found no precedent for. First pass made: `design/mockups/watch-it-think.html` | 6, 10 |
| Body designer | Parts, placement and the budget | 5 |
| Home screen and daily visit | The founder, the recap, pet play. Wireframes made: `design/mockups/loop-wireframes.html` | 8, 9 |
| Creature inspector | What a creature is doing and why | 10 |
| The recap and its instruments | Reading what happened from a record. Concept test made: `design/mockups/since-yesterday.html` | 10 |
| World views | Basin, biome and close-up; where each species lives; where the openings are | 1, 10 |
| Death and history | The shape of a species' life, what ended it, what carries over. Wireframes made, in `design/mockups/loop-wireframes.html` | 7, 10 |
| First hour | The guided first build, with callouts. Wireframes made, in the same file | 8, 13 |
| Friends and records | Seeing and comparing each other's species. Concept test made: `design/mockups/basin-ages.html` | 11 |
| Look | Each biome in the Paper lagoon direction, a creature in every mood, the interface style sheet | 12 |
| Click-through | Every screen joined up, tried by someone who has not seen it | 13 |

## 6. What exists already

| Area | Document | State |
|---|---|---|
| Behaviour | `design/neural-blocks.md` (draft 5) | Vocabulary written, with everything decided in the life-cycle and social designs folded in and the world's words worked out in full. Draft 4's verbs were audited; ten verbs, most functions and all of draft 5's additions are untested |
| Bodies | `design/body.md` (draft 2) | Reworked on paper: a body for each form, size as the tempo of a life, an inside where each organ answers a different problem, shells and spikes with real costs, camouflage matched to one ground, and grips against skins. Thirteen parts tested in draft 1; the reworks and about twenty parts are untested, and costs wait for the balance pass |
| World | `design/world.md` (draft 3), on top of `design/environment.md` | Eight biomes in one river basin, accepted, with a map mockup. Tested only as single habitat patches: an overused patch recovers, a species can be designed to manage its food, and patches have different casts. Nothing has been run at biome scale |
| Balance | `design/checks/balancelab.js`, section 3 above | Two runs done. Which body wins depends on how the score counts weight; one inside wins everywhere under every score; one design is near the best in most habitats |
| Interface | `reports/Handcrafted game UI and onboarding.md` | Researched from search summaries only; not yet designed |
| Preset species | `design/presets.md` (draft 1) | Twenty presets, one stepping aside for each living player species, with no advantages and no fading. The cast is accepted: ten foragers and farmers, seven hunters, two scavengers and one that lives off the others, chosen to show as wide a range of viable designs as possible, each spawned in one biome and free to spread, and none depending on a particular other species. In the stand-in, hunters and their prey do not last together by any means tried; only respawning keeps hunters present |
| Life cycles | `design/life-cycles.md` (draft 2) | Generations, stages, ways of breeding, life-history choices and the named line. Its four questions are answered |
| Social organisation | `design/social.md` (draft 3) | Building blocks for societies, about 35 societies and what each is built from, forms, a wider survey with the additions it led to, and attaching and letting go. Decided in outline. Two direction checks run: a sentinel by signal cuts losses and costs meals; hostile homes space themselves out but do not protect the food. Four checks wait on forms and on the body rework |
| Lifespan and score | `design/lifespan.md` (draft 2) | Decided: two days of grace and a ramp slower than doubling; release whenever the player chooses, retiring the old species; what a player keeps, including a chronicle. A steady climb is proposed for the ramp. Fading acts on the cost of living and on hatching alike |
| Pet play | `design/pet-play.md` (draft 2) | The named one and its character, the line and what an heir receives, tending, nudging and talking. Its questions are answered: nudges unlimited, only the line named, an heir that is young and meets its keeper as a stranger. A concept test of tending is in `design/mockups/tending.html` |
| Feedback | `design/feedback.md` (draft 1) | Five steps from an outcome to a change, what the simulation records, eleven instruments used the same way everywhere, the recap, and what is shown of other players' species. A paper check of twenty outcomes added two records. Four questions open. A concept test is in `design/mockups/since-yesterday.html` |
| Playing with friends | `design/friends.md` (draft 1) | Relationships between two species, measured and named; alliances as instincts; what is open of a living and an ended species; a board for each world year and for all time; titles and firsts; the basin's shared history; postcards; joining and leaving. Four questions open. A concept test is in `design/mockups/basin-ages.html` |
| Player loops | `design/loops.md` (draft 1), with keeper actions in `design/world-and-loop.md` | The first hour, the daily visit, the design session and the end, each written as a flow of screens; unlocks as kits; a classification of events. Its four questions are answered. The first hour and the daily visit are wireframed |
| Look | `design/art-direction.md` | Soft critters in the Paper lagoon direction |
| Technology | `reports/Creature sim game design exploration.md` | A recommended stack, unmeasured |

## 7. Building, once the design is closed

The order from draft 1 stands, with the designers first:

1. Foundations.
2. The simulation, with the audits as its tests.
3. The designers and a test tank on a phone, tried with friends.
4. The shared world.
5. The daily loop and pet play.
6. Look, sound and feel in production form.
7. A first season with the group.

## 8. Risks carried into the design

| Risk | Where it is dealt with |
|---|---|
| Hunters and prey cannot both persist, so a player's hunter species may be unable to last | Area 4 found no fix in the stand-in. To be tested first when the real simulation exists; respawning covers presets only |
| One build wins everywhere | Areas 1, 4 and 5 |
| Friends cannot build behaviours on a phone | Area 8 mockups, then building step 3 |
| A rich world is too much for a small server or a phone | Area 1 sets the size; measured in building step 2 |
| A test is broken and its result is taken as a finding | The balance lab checks itself before each run (section 3) |
| The design grows without end | Each area has a "done when", and area 14 does not start until the others are closed |
