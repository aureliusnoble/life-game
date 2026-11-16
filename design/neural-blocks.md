# Neural editor: instincts, moods and signals

Draft 5, November 2026. Earlier drafts are in git history.

Anything marked **tested** was run in `design/checks/moodsim.js` or `design/checks/verbaudit.js`, small stand-in worlds that implement the rules below. It is not the game, and its numbers show direction, not balance. Everything else is on paper.

**What changed since draft 2.** The vocabulary was audited against behaviour seen in nature and in other simulation games, and widened where it could not say something:

- A notice is now a phrase built from slots: reach, how many or which one, what, and what it is doing.
- Quantity has five steps instead of two, including "no", which lets a creature act on absence.
- New words for choosing among several, for what another creature is doing, for things that just happened, and for a creature's own state of mind (idle, torn, stuck).
- New acts: go along, head off, face, cling, tend, wipe, dig, build, plus a pace on any movement.
- Conditions gained degree words (a little, very) and graded forms (more when, less when).
- A section on how competing urges are settled, and a rule for attention.
- Mood functions grew: Place replaces Home, Rhythm can be hurried, and several new ones.
- Four more recipes tested, and an atlas of about a hundred behaviours.

**What changed in draft 4.** Every act was audited against its nearest neighbour (section 14). Two verbs were cut, "near" and "far" were redefined, one pair of state words was replaced, and the body rules the verbs depend on are now written down.

**What changed in draft 5.** Everything decided since draft 4 in the life-cycle and social designs is folded in, and the words for the world are worked out in full. None of the additions has been run.

- A species is made of **forms**, each with its own body and its own page of instincts (section 9).
- **The world** has its own vocabulary: ground and features, time, weather, water, fire, where I am, and directions (section 3).
- Among my own kind a creature can tell **homes** apart and compare **size and age**.
- New acts and wider ones: roll, shed, lay on a carrier, grab from a carrier, tend a plant or a store, cling to the world, and a sting that tires.
- An act can be aimed at **the one another creature is facing**, and a display can point at a **remembered place**.
- One new mood function, **For life**.
- **Species settings** for breeding are listed in section 9.

## 1. The idea

A species' brain is a list of **instincts** and a handful of **moods**.

- An instinct is one small reaction: notice something, do something. All instincts run at once and their effects add up.
- A mood is a named meter the player defines. Instincts raise it and calm it, it lingers for a set time, and other instincts can be switched on or off by it.
- Creatures affect each other only through the world: what they do, and the **signals** they make.

Nothing in the vocabulary is a behaviour. Hunting, courting, flocking and nesting are what the instincts add up to.

## 2. How a brain is written

```
instinct   =  notice → act  (strength)  + up to two conditions

notice     =  reach · how many or which one · what · what it is doing
           or feel [feeling]  |  just [moment]  |  always  |  sometimes

condition  =  only when / not when / more when / less when
              + (a little | very) + a feeling
```

An example using every slot:

```
see · the weakest · smaller creature · going away → head off (strong, sprinting)
      only when Hunting, not when very hungry
```

Each slot offers a short list, and most instincts leave most slots at their default. The lists are what unlock over time.

A species has one page of instincts and moods for each of its forms, and can have a common page that forms share (section 9).

### The rules

1. Thinking happens in beats. Every beat, each instinct whose conditions hold makes its contribution.
2. Movement contributions add as arrows, and nearer things pull harder. The body moves along the sum. Its speed comes from the pace of the strongest pull (creeping, walking or sprinting) and from how strong the sum is.
3. Other acts (bite, call, lay) happen when the notice behind them is strong enough and the body allows it.
4. A mood rises while anything is raising it, drops when something calms it, and fades at its own rate only while nothing is raising it.
5. A mood is on above its kick-in point, with a small margin so it does not flicker.
6. "Only when" and "not when" switch an instinct on or off. "More when" and "less when" scale it with how strong the feeling is.
7. What a creature is doing limits what it can notice (section 6).
8. An act is aimed at the thing noticed. It can instead be aimed at **the one that thing is facing**, which is how a creature joins a friend's fight or attacks what its leader attacks.
9. There are no loops, sequences or free-form numbers. Settings come in three to five named steps.

## 3. Senses: what a creature can notice

### Sense organs

The body decides which senses a species has. Each has a strength and a blind spot, and those differences are what make niches.

| Organ | Gives | Good at | Blind to |
|---|---|---|---|
| Eyes | see, far | Long reach; tells size, kind and what the other is doing | Anything behind cover; little in the dark. Wide-set eyes see all round but not far; forward eyes see far but only ahead |
| Nose | smell | Works in the dark and through cover; reads scent marks | Short reach; scent drifts with any current |
| Ears | hear | All directions, long range, through cover | Anything silent; says little about what made the sound |
| Skin, whiskers | touch, near | Certain, and works anywhere | Anything more than a few body lengths away |
| Side line | feel | Senses anything moving nearby, even unseen | Cannot tell what it is; a still creature is invisible to it |
| Heat pits | see, for warm bodies | Works in the dark | Cold things; short reach |
| Voice and ears | ping | A call whose echo shows everything nearby for a moment | The ping is itself a call that others hear |

### Reach

| Word | Meaning | When |
|---|---|---|
| touch | In contact | Start |
| near | Seen, and within a few body lengths | Early |
| see | Anywhere in view; nearer is stronger | Start |
| far | Seen, but not near | Mid |
| hear | A sound, from any direction | Early |
| smell | A scent; points toward where it is stronger | Early |
| feel | Movement nearby | Mid |

"Near" and "far" are bands of sight, not senses of their own. Only touch and feel work all round at close range. When "near" was a free all-round sense, nothing could ever be crept up on (section 14).

### How many

| Word | Roughly | Use |
|---|---|---|
| no | None in reach | Acting on absence: safety, loneliness, an empty nest |
| a | One or more; means the nearest unless a "which one" word is used | The default |
| a few | Three or more | Small groups, a quorum |
| many | Eight or more | Herds, safety in numbers |
| a crowd | Twenty or more | Swarms and mass events |

Two more forms treat several as one thing:

- **my group**: the few nearest of my kind taken together, giving their centre and their average heading. Flocking needs it (tested).
- **outnumbering** and **outnumbered**: feelings that compare how many of my kind and how many of another kind are in view.

### Which one

When several things match, the nearest is used unless one of these is chosen.

| Word | Picks | When |
|---|---|---|
| nearest | The closest (default) | Start |
| biggest, smallest | By size | Mid |
| weakest | The most hurt | Mid |
| lone | The one farthest from others of its own kind | Mid |
| my [mood] one | The creature a Bond mood is about | Late |
| the oldest, the youngest | By age, among my kind | Late |

### What

| Kind | Options | When |
|---|---|---|
| Food | plant, meat, egg | Start to Mid |
| My kind | any; male, female; young, adult, old; family, stranger; of my home, of another home; bigger, smaller, older or younger than me; a named form | Start; refinements Early to Late |
| Other creatures | bigger, smaller, about my size; spiked, shelled, slimy, fat | Start; what it is covered in, Mid |
| A species I have met | Picked from the species this lineage has encountered | Mid |
| A kind I learned about | See Learn in section 7 | Late |
| Things to carry | food, seed, egg, young, building material, the dead, a smaller creature | Mid |
| Signals | a call, a scent mark (mine, my kind's, a stranger's), a display | Early |
| A rider | Something clinging to me: where it holds, and whether it is my kind | Mid |
| Places | Ground, shelter, lines and made things: see The world, below | Early to Late |
| Directions | brighter, warmer, uphill, upstream, upwind and the rest: see The world, below | Mid to Late |
| A remembered place | my [mood] place | Late |
| My keeper | The player's touch-and-hold beacon | Start |

### The world

A creature can notice the ground it is on, what is around it, the time, the weather and the state of the water, and it can feel which way things change. Seasonal lives, migration and each biome's own cycle are built from these. Every word needs a sense that can detect it.

**Ground and features.** Things to notice, like any other "what".

| Kind | Words | Sense |
|---|---|---|
| Ground | open grass, tall grass, thicket, scrub, rock, scree, sand, mud, bare ground, snow and ice | Eyes; touch for what is underfoot |
| Water | still water, shallows, deep water, running water, a pool left by tide or flood | Eyes; smell from farther off |
| Shelter | cover of any kind, a crevice, a cave, a hollow, a burrow, shade | Eyes |
| Made things | a nest, a wall, a larder, a trail of marks | Eyes; smell for marks |
| Lines | an edge of cover, the water's edge, a river bank, the tide line, a wall | Eyes; touch |
| High and open | high ground, open ground, an island, a crossing | Eyes |
| Changed ground | burnt ground, new growth, grazed ground, flooded ground, frozen water | Eyes |
| Plenty | a bloom, a stand in fruit, fallen seed, food left by the tide, a carcass | Eyes; smell |

**Time, weather and water.** These are feelings, so they are what conditions test: "only in autumn", "not when the tide is in".

| Kind | Words | Sense |
|---|---|---|
| Time of day | day, night, dawn, dusk | Any |
| Season | spring, summer, autumn, winter | Any |
| Weather | raining, windy, hot, freezing, snow lying | Skin |
| Water | tide in, tide out, tide rising, tide falling, flood, low water | Eyes on the water, or skin when in it |
| Fire | fire near, smoke | Eyes; nose |

**Where I am.** Also feelings.

| Words | Sense |
|---|---|
| in water, out of my depth, in a current, being swept along, sinking | Skin |
| wet, dry, hot, cold | Skin |
| covered, exposed, in shade, in sun, underground, high up | Any |
| on any ground word: "on mud", "on burnt ground" | Touch |

**Moments in the world.** Rain just started; rain just stopped; the tide just turned; the water just rose; the first frost; a fire just started; day just broke; night just fell; the season just turned; food just arrived.

**Directions.** A direction is noticed like a scent: it points the way things increase. Approach climbs it, move away goes down it, and go along keeps it level, so "go along deeper" follows the tide line and "go along uphill" follows a contour.

| Direction | Sense | What it is for |
|---|---|---|
| brighter, darker | Eyes | Finding cover or sun; retreats by day or night |
| warmer, cooler | Skin; heat pits | Basking, shade, wintering low |
| uphill, downhill | Any | Refuges; following water down |
| upstream, downstream | Side line or skin, in running water | River journeys; breeding at the head of a brook |
| deeper, shallower | Skin, in water | Following the tide; keeping to one depth |
| wetter, drier | Skin; nose | Finding water in dry country |
| upwind, downwind | Nose; whiskers | Approaching unsmelled; tracking a scent to its source |
| north, south, east, west | A compass organ, which is a new body part | Long journeys with no landmark |
| toward my [mood] place | Memory | Home, larder, birthplace |

### What it is doing

A creature seen clearly can also be noticed by its state. This is how one creature reads another without any signal being sent.

| Word | Meaning |
|---|---|
| still | Not moving |
| coming at me, going away | Its motion relative to me |
| facing me, facing away | Whether I am inside its arc of view |
| eating, resting, fighting, carrying, clinging | What it is busy with |
| hurt | Visibly wounded |
| calling, showing [display] | Signalling |

### Feelings

Feelings have no direction. They are what conditions test, and they can also start an instinct ("feel cold → ...").

| Kind | Options |
|---|---|
| Body | hungry, hurt, tired, cold, warm, carrying, covered, clung to, clinging |
| Breeding | fertile, gravid |
| Surroundings | dark, light, crowded; and the feelings listed under The world |
| Company | alone, outnumbering, outnumbered |
| Traits | male, female; young, adult, old; the form it is |
| State of mind | idle (nothing but wandering is firing), torn (its pulls nearly cancel), stuck (trying to move and getting nowhere) |
| Moods | Any mood the player has made |
| Constants | always, sometimes |

Degree words work on any graded feeling: **a little** hungry, hungry, **very** hungry.

### Moments

A moment is something that just happened. It lasts a beat or two, so to act on it for longer an instinct raises a mood.

| Kind | Options |
|---|---|
| To me | just hatched, just ate, just bitten, just fed, just tended, just grabbed, startled (something appeared close by) |
| By me | just bit, just killed, just mated, just laid |
| Losing track | just lost sight of it |
| The world | See The world, above |
| Moods | [mood] just started, [mood] just ended |
| Keeper | keeper's touch, keeper's treat |

## 4. Acts: what a creature can do

### Moving

| Act | Effect | Setting | When |
|---|---|---|---|
| approach | Go to it | | Start |
| move away | Leave it behind | | Start |
| stay near | Approach only when farther than a set distance | close, mid, far | Early |
| keep apart | Move away only when nearer than a set distance | close, mid, far | Early |
| circle | Go around it sideways; each individual has a fixed side | | Mid |
| go along | Follow its line, such as an edge or a trail of marks, keeping it to one side | | Mid |
| go the same way | Match its heading | | Mid |
| head off | Aim for where it is going | | Mid |
| face | Stop and turn toward it | | Mid |
| wander | Drift with a slowly changing heading | tight, medium, wide | Start |
| hold still | Damp all movement | | Mid |

Any moving instinct can also carry a **pace**: creeping (slow and hard to hear or feel), normal, or sprinting (fast, costly, loud).

### Body

| Act | Effect | When |
|---|---|---|
| bite | Eat or wound what it is touching; the target decides which | Start |
| rest | Recover; lower energy use | Start |
| lay | Lay an egg here, or on what it is touching or carrying | Start; on a carrier, Late |
| mate | With the one it is touching, if both want to | Early |
| grab, drop | Pick up and carry food, a seed, an egg, a young one, material or a smaller creature. Grab can also take from a creature that is carrying. A dropped seed can sprout | Mid |
| give | Hand over what it carries, or share food it has eaten | Mid |
| tend | Care for what it is touching: an egg hatches sooner, a young one grows faster, another creature is cleaned of riders and calmed, a plant grows faster, stored food keeps and ripens | Mid |
| cling, let go | Hold on to what it is touching and be carried along, or hold on to a rock or a stem. How well it holds depends on its grip and the other's skin | Mid |
| hide | Withdraw, if the body has a shell or burrow | Mid |
| roll | Turn over. Riders on the back are thrown or crushed; the creature is belly up for a moment | Mid |
| shed | Drop the tail or the patch of skin being held, leaving an attacker holding it | Late |

Body parts add their own: sting, spit, shock, spray (a cloud that works as cover), glow, shed a tail. Some parts add **poses** that change how others perceive the creature: puff up (seen as bigger), play dead, crouch (harder to see while still).

A sting can be built to wound or to tire. A tired victim cannot sprint and can be carried off alive.

While it is clinging, a creature can bite, sting, tend, give, lay, signal or let go. It cannot steer. A small, slow bite from a clinging creature feeds it without wounding the carrier badly, and a clinging creature can wound a carrier of any size.

### Changing the world

| Act | Effect | When |
|---|---|---|
| mark | Leave a named scent (see Signals) | Early |
| wipe | Remove the marks here | Mid |
| dig | Make a hollow that works as cover | Late |
| build | Set down material so that it stays, as a wall or a nest | Late |

### Signals and moods

| Act | Effect | When |
|---|---|---|
| call | Make a named sound | Early |
| show | Make a named display | Mid |
| ping | A call whose echo reveals what is nearby | Late |
| raise, calm | Fill or drain a mood: quickly, normally or slowly | Start |
| hurry | Nudge a Rhythm mood toward its next pulse | Late |

### Verbs that look alike

| Pair | Difference |
|---|---|
| approach, stay near | Approach keeps closing in; stay near stops once close enough |
| move away, keep apart | Move away keeps going; keep apart stops once far enough |
| circle, go along | Circle orbits a point; go along traces a line |
| go the same way, head off | Travel beside it, or cut across its path |
| hold still, face, rest, hide | Not moving; not moving and turned toward it; recovering; out of sight |
| grab, cling | Grab carries the other; cling makes the other carry you |
| give, tend | Give moves food; tend moves care |
| call, mark, show | Heard now and far; smelled later and near; seen while in view |

### Verbs deliberately left out

- **Eat and attack as separate verbs.** One verb, bite, and the target decides.
- **Flee, chase, stalk, follow, guard, patrol, search.** Each is a movement act with a pace or a second instinct: flee is move away sprinting; stalk is approach creeping while the target is facing away; patrol is go along the edge of my own marks.
- **Get behind.** Cut in the audit: circling while the target faces me, then approaching when it faces away, did the same job. It may return if travelling close behind another is ever made to save effort.
- **Watch.** Cut in the audit: stopping to look farther changed almost nothing. A creature that is not eating or resting already has its full senses.
- **Push, block, dodge.** Bodies already get in each other's way, so these come from approach, head off and circle.
- **Copy.** Covered by noticing what another creature is doing.
- **Grow, heal, digest.** Automatic. Clutch size and egg size are body settings; when to breed is left to instincts.
- **Hunt, court, nest, flock.** Not verbs, by design.

## 5. Moods

A mood has four settings.

| Setting | Options | What it gives the player |
|---|---|---|
| Raised by | Any notice, at a speed | What the mood is about |
| Calmed by | Any notice, at a speed | One urge quietening another |
| Lingers | briefly, a while, a long time, until calmed | Memory |
| Kicks in | low, half, high | How much it takes before it matters |

Timing comes from the raise speed: a mood raised slowly ignores a glimpse and responds only to something sustained. Each speed step is about ten times the last.

A mood is a timer and a latch, not a measure of how much. Under rule 4 any stimulus fills it eventually. "How hungry" and "how close" come from graded feelings and from "more when".

## 6. How competing urges are settled

A creature usually has several things it could be doing. These are the tools for deciding, from softest to hardest.

| Tool | What it does | Example |
|---|---|---|
| Blending | Movement pulls add, giving a compromise path | Skirting a threat on the way to food |
| Strength | Weak, normal or strong sets each instinct's share of the blend | Fear outweighs appetite |
| More when, less when | Scales an instinct with a feeling | Flee harder the nearer the threat; forage harder the hungrier |
| Only when, not when | Switches an instinct on or off | Feed only when dark |
| Degree words | Put the switch at a different level | Ignore danger when very hungry (tested) |
| Calmed by | One mood drains another | Scared calms Curious |
| Blocking a raise | "Raise A, not when B" and "raise B, not when A": whichever starts first holds | Either courting or feeding, never both |
| Lingers | A mood outlasts what caused it, so the creature does not flip back at once | Stay wary after a scare |
| Kicks in | Sets how much it takes to change course | Bold and timid designs |
| Bond | Fixes attention on one creature | Chase one prey instead of whichever is nearest |
| Idle, torn, stuck | Let a creature notice its own indecision | "Feel torn → wander" breaks a deadlock |
| Mood moments | "[Mood] just ended → raise the next one" hands over | Steps in a ritual; a pause after a panic |
| Takes over | While on, silences every instinct not tied to this mood | Blind panic |

**Attention** (rule 7, on paper). What a creature is doing dulls its senses:

| While | Effect on its senses |
|---|---|
| Eating, tending, mating | Sees only what is near |
| Resting | Sees nothing; still hears and feels |
| Hiding | Sees nothing and cannot be seen |
| Sprinting | Smells nothing, and is easy to hear and feel |
| Creeping | Hard to hear or feel |
| Holding still | Invisible to a side line |

This gives eating and resting a cost in awareness, so sentinels, taking turns to keep their heads up and safety in numbers have something to trade against.

**What emerges from these.** A creature whose fear always outweighs its appetite hovers at the edge of danger and starves beside food (tested). One that drops its fear only when very hungry feeds in spite of the danger and survives (tested). A hunter without Bond switches target whenever another prey comes nearer. A mood that takes over makes a creature blind to everything else while it lasts.

## 7. Mood functions

Each is one switch on a mood, and each is an unlock.

| Function | What it does | What it makes possible | Status |
|---|---|---|---|
| Bond | The mood is about one creature: whoever first raised it. Instincts can refer to "my [mood] one" | Mate choice, pair bonds, parent and young, one target, grudges, imprinting | Tested |
| Place | The mood remembers where it was last raised. Instincts can refer to "my [mood] place" | Home, hoards, returning to a food patch, avoiding where it was hurt, breeding where it hatched | Tested |
| Rhythm | The mood rises and falls by itself at a set tempo. It can start at a random point for each individual, and can be hurried by a notice | Patrols, shifts, pulsing calls, flashing in time, mass spawning | Tested |
| Count | Steps up once per event and switches on at a set number | "After three failed chases, move on"; a quorum of visits | On paper |
| Born with | A set share of newborns start with the mood on for life. Optionally every individual gets its own kick-in point | Castes, sentinels, bold and shy individuals, division of labour | On paper |
| Catching | The mood shows on the body and rises in others of its kind who see it | Panic, excitement, synchronised breeding | On paper |
| Learn | Experience fills in kinds: one that hurt me, one that hurt my kind, one I have eaten, one that made me ill, one that fed or tended me, a familiar one | Enemies and allies formed by what happened; returning favours; knowing neighbours from strangers | On paper |
| Takes over | While on, silences instincts not tied to this mood | Panic, frenzy, single-mindedness | On paper |
| Habit | Marks one instinct, not a mood: it strengthens when soon followed by eating, mating or being tended, and weakens when followed by pain | Individuals that differ by experience; creatures a keeper can train | On paper |
| For life | Once on, the mood never fades, and the creature grows into another form over a few days | Queens that are made, sex change, soldiers on demand, founders with their own bodies | On paper |

Imprinting is a pattern, not a function: a Bond mood raised only when young that lingers until calmed.

## 8. Signals

| Signal | Reach | Lasts | Typical use |
|---|---|---|---|
| Call | Near or far (a setting); all directions | A moment | Alarm, recruiting, advertising, keeping in touch |
| Mark | Close; followed by smell | Short or long (a setting), fading | Trails, territory, nest sites, warnings |
| Display | Line of sight | While shown | Courtship, threat, begging, bluff |

- **Signals are public.** There is a small shared set of sounds, scents and displays, and any species with the right sense can notice any of them. A player names what a sound means for their own species; nothing stops another species reacting to it, or making it.
- **Signals can be graded.** A call made by a strong instinct, or one scaled with "more when Scared", is louder.
- **Signals can lie.** A species can make another's mating call, lay a nest scent where there is no nest, or show a display it does not mean.
- **Telling who made it.** Marks can be told apart as mine, my home's, another home's of my kind, or a stranger's. Every creature carries the scent of the home where it hatched, and takes on the scent of a home that tends or feeds it for long enough. Calls and displays cannot be told apart at first; "from my kind" is a later refinement that a mimic body part can defeat.
- **Pointing.** Facing something while showing a display gives watchers a direction: "see my kind showing → go the same way" sends them where it points. A creature can also face a remembered place while showing, which tells others where food is without leading them there.
- **Treaties.** Because displays are public, two players can agree a convention, such as "mine will not bite anything showing blue". Nothing enforces it.

## 9. Forms and species settings

### Forms

A species is made of forms. A form is one kind of individual: a sex, a life stage or a caste. Each form has its own body and its own page of instincts and moods, and a first species has one form. The reasoning is in `design/social.md`, section 9.

- **The body sets the vocabulary.** A form can only use the senses and acts its parts provide.
- **Shared by the species:** being one kind, the home scent, the named sounds, scents and displays, the settings below, and an optional common page of instincts that a form can take or leave.
- **Separate for each form:** the body, the instincts and moods, and the cost. Each form is a variation on the species' base under the same combined allowance. Leaving something out is free; other differences cost extra, more with each one.
- **Becoming a form.** By sex; by stage, as young grow up and adults grow old; at laying, by brood mix; or later, when a For life mood comes on.
- **Roles without a new body:** "only when young", a signal that others defer to, or a count of who is doing what.

### Species settings

These are set once for the species and are not instincts. They are worked out in `design/life-cycles.md` and `design/social.md`.

| Setting | Options |
|---|---|
| Way of breeding | Alone; in pairs; one breeder with helpers; both sexes in one; splitting |
| Brood mix | The share of eggs that become each sex and each form, with up to two rules, such as "more founders in autumn" or "unfathered eggs become males" |
| Mating | Each time, or once and lay for life |
| What breeding costs the parent | Nothing; the mother dies after laying; the father dies after mating |
| Eggs | Many small or a few large; laid or kept inside until they hatch; hatch at once or wait for a season, or for several |
| Lay once or again and again | Once, with everything; or repeatedly |
| Sleep | Adults sleep through a season, or do not |

When to breed, where, how much care to give and who leaves home are instincts.

## 10. How relationships between species arise

None of these is a setting. Each falls out of pieces that exist for other reasons.

| Relationship | How it arises |
|---|---|
| Predator and prey | Size senses and bite |
| Learned enemies and allies | Learn: "see one that hurt me → move away" |
| Returning favours | Learn: "see one that fed me, while carrying → give" |
| Eavesdropping | Reacting to another species' alarm call or trail |
| Luring | Making another species' mating call |
| Nest raiding | Following another species' nest scent to its eggs |
| Decoys | Laying nest scent where there is no nest |
| Brood parasitism | Laying where another species' nest scent is strong; the host tends what it finds |
| Cleaning | One species tends; the other holds still when tended |
| Riding | A small species clings to a big one and is carried |
| Parasites | Cling, then bite |
| Following | Staying near a bigger species to eat what it leaves |
| Guarding | A small species' alarm call that a big species has chosen to heed |
| Herding | Staying near another species, driving off its enemies, and being fed by it |
| Tribute | Giving food to a bigger species that has learned to spare whoever feeds it |
| Treaty | A shared display both species have agreed to respect |

Warning colours, camouflage and mimicry of appearance need senses tuned to colour or pattern. That layer is still deferred.

## 11. Tested recipes

Each list is what was run, apart from grazing and wandering rows noted where they were left out. "(weak)" and "(strong)" are instinct strengths.

### Pack hunt on big prey

Prey is bigger, slower, has 8 hit points and bites back; hunters have 2.

```
Moods
  Hunting: lingers briefly
  Brave:   lingers briefly, kicks in high

see bigger creature → raise Hunting (quickly)
see a few my kind → raise Brave (quickly)
always → call "Prey!"                  only when Hunting
hear "Prey!" → approach                not when Hunting
see bigger creature → approach         only when Brave
see bigger creature → keep apart (strong)   not when Brave
touch bigger creature → bite
always → wander (weak)
```

| Design (8 hunters, 100 runs) | Prey killed | Hunters lost per run | Beats to kill |
|---|---|---|---|
| Attack on sight | 90 | 3.7 | 1008 |
| Attack only when Brave, no call | 2 | 0.6 | 1506 |
| Brave plus the call (above) | 100 | 3.1 | 445 |

### Choosy courtship

Each sex ran only its own rows. Both also grazed and wandered.

```
Mood
  Charmed: Bond, lingers briefly, kicks in high

Female
  feel fertile → call "Here"
  near male showing → raise Charmed (slowly)
  touch my Charmed one → mate          only when Charmed

Male
  hear "Here" → approach
  see female → approach
  see female → show red
  touch female → mate
```

| Female design (30 runs) | Share of matings going to males that display |
|---|---|
| Accepts any male at once | 50% |
| Charmed by any displaying male in sight | 66% |
| Charmed only by a displaying male close by | 77% |
| Charmed is a Bond; mates only with that male | 100% |

### Nesting ground

```
Mood
  Settled: lingers briefly, kicks in high

see cover → approach                   only when gravid
feel covered → raise Settled (slowly)  only when gravid
see bigger creature → calm Settled (quickly)
see bigger creature → move away (strong)
feel gravid → lay                      only when Settled
feel gravid → mark "Nest"              only when Settled
smell "Nest" → approach (strong)       only when gravid
always → wander (weak)
```

With six equal patches of cover (30 runs), the busiest patch took 36% of later eggs without the scent rows and 45% with them.

### Flocking

```
see my group → stay near
see my kind → keep apart
see my group → go the same way
always → wander (weak)
```

Alignment (0 is random headings, 1 is all the same way) was 0.86. With only the nearest neighbour it was 0.14.

### Choosing a target

Three hunters against a shoal of 24 flocking prey slightly slower than them (25 runs). Every chase was strong, and each hunter also had "touch smaller creature → bite" and a weak wander.

| Hunter design | Prey caught per run |
|---|---|
| see smaller creature → approach | 10.3 |
| see lone smaller creature → approach | 4.3 |
| Bond: lock on to one, then approach it | 11.4 |
| see smaller creature → head off | 10.9 |
| Bond, then head off | 11.9 |

Locking on caught about a tenth more than taking the nearest, heading off about half that, and both together about a sixth more. Picking the straggler did far worse.

### Torn between food and fear

All the food grows close to a creature that bites on touch (one forager, 40 runs).

```
see plant → approach                   only when hungry
touch plant → bite
see bigger creature → move away (strong)    not when very hungry
always → wander (weak)
```

| Forager design | Alive at the end | Killed by the big one | Meals |
|---|---|---|---|
| No fear | 23 of 40 | 5 | 15.1 |
| Always moves away | 0 of 40 | 0 | 0 |
| Moves away, but not when very hungry (above) | 31 of 40 | 0 | 19.3 |

### Flashing in time

```
Mood
  Beat: Rhythm

always → show glow                     only when Beat
see my kind showing → hurry Beat
```

Twenty-four creatures started at random points in their rhythm (30 runs). Togetherness (1 is all flashing at once) was 0.20 without the second row and 1.00 with it.

### Remembering a place

One food patch regrows far from where ten foragers start (20 runs).

```
Mood
  Feast: Place, lingers until calmed

see plant → approach                   only when hungry
touch plant → bite
touch plant → raise Feast (quickly)
my Feast place → approach              only when hungry, only when Feast
always → wander
```

Meals per forager rose from 10.9 to 20.7, and time spent very hungry fell from 76% to 59%.

## 12. Behaviour atlas

Short forms. None has been run unless marked. "Needs" names the latest piece required.

### Finding the way

| Behaviour | Built from | Needs |
|---|---|---|
| Following a gradient | see warmer → approach | Mid |
| Gathering where it is comfortable | feel cold → wander wide; feel warm → hold still | Start |
| Searching where food was | just ate → raise Searching; only when Searching → wander tight | Mid |
| Returning to a food patch | Tested above | Place |
| Avoiding where it was hurt | Fright: Place, raised by just bitten; my Fright place → keep apart (far) | Place |
| Following an edge | see edge → go along | Mid |
| Following a trail | smell "Trail" → go along | Mid |
| Patrolling a border | always → mark; smell the edge of my own marks → go along | Mid |
| Migration | when cold → approach warmer, with flocking rows | Mid |
| Leaving home | only when adult: my Birth place → keep apart (far) | Place |
| Breeding where it hatched | Birth: Place, raised by just hatched; when fertile → approach my Birth place | Place |
| Searching where it lost something | just lost sight of it → raise Seeking (Place); my Seeking place → approach, wander tight | Place |

### Feeding

| Behaviour | Built from | Needs |
|---|---|---|
| Grazing | see plant → approach, only when hungry; touch plant → bite | Start |
| Scavenging | see meat → approach; touch meat → bite | Early |
| Pursuit | see smaller creature → approach (strong, sprinting) | Start |
| Stalking | Tested in section 14: see smaller creature facing me → circle, keep apart (far); far and facing away → approach; near → approach (creeping) | Mid |
| Ambush | feel covered and hungry → hold still; near smaller creature → approach (sprinting), bite | Mid |
| Cutting off | Tested above | Mid |
| Fixing on one prey | Tested above | Bond |
| Pack hunt on big prey | Tested above | Mid |
| Joining a feast | see my kind eating → approach | Mid |
| Stealing | see creature carrying → approach; touch it → grab | Mid |
| Hoarding | carrying food → approach my Home place; there → drop | Place |
| Defending a kill | near meat: see creature coming at me → show threat, bite | Mid |
| Food trails | carrying food → approach my Home place and mark "Trail"; not carrying → go along "Trail", keep apart from home | Place |
| Passing food along | carrying, near my kind not carrying → give | Mid |
| Feeding in a current | hold still facing upstream; bite what touches | Mid |
| Raiding when starving | Tested above | Start |
| Fattening before winter | when cold → approach plant even when not hungry | Mid |
| Keeping another species | see [species] → stay near; touch it → tend, and it feeds me | Late |

### Staying alive

| Behaviour | Built from | Needs |
|---|---|---|
| Fleeing | see bigger creature → move away (sprinting) | Start |
| Staying wary | Wary: raised by just bitten, lingers a long time; only when Wary → stay near cover | Early |
| Freezing or hiding | see bigger creature → hold still, or hide | Mid |
| Flight distance | far bigger creature → face; near bigger creature → move away | Mid |
| Reading intent | bigger creature coming at me → move away; facing away → carry on | Mid |
| Getting used to it | Used: raised slowly by see bigger creature; move away, not when Used | Early |
| Alarm calls | see bigger creature → call "Danger"; hear "Danger" → raise Scared | Early |
| Different alarms | A different call for each kind of threat, each raising a different mood | Mid |
| Graded alarm | call "Danger", more when Scared | Mid |
| Mobbing | see a few my kind → raise Brave; only when Brave → approach bigger creature, bite | Mid |
| Standing ground in numbers | feel outnumbering → approach; feel outnumbered → move away | Mid |
| Hiding in the herd | only when Scared → approach my group | Mid |
| Sentinels | Watchful: Born with, one in eight; only when Watchful → hold still, never eat, and call on seeing a bigger creature | Born with |
| Keeping heads up in shifts | Alert: Rhythm starting at a random point; feeding rows not when Alert | Rhythm |
| Bluff | see bigger creature coming at me → puff up | Mid |
| Playing dead | just bitten → play dead | Mid |
| Leading danger away | near my egg, see bigger creature → show "hurt", move away (creeping) | Mid |
| Fighting when cornered | feel stuck, only when Scared → bite | Mid |
| A wave of panic | Scared: Catching; Scared just ended → raise Spent; raise Scared, not when Spent | Catching |

### Day and year

| Behaviour | Built from | Needs |
|---|---|---|
| Night habits | feeding rows only when dark; when light → approach cover, rest | Start |
| Shared roosts | resting → mark "Roost"; when light → approach "Roost" | Early |
| Winter sleep | when cold → approach cover, rest | Mid |
| Basking | when cold → approach brighter, hold still | Mid |
| Huddling | when cold → approach my group, hold still | Mid |
| Flashing in time | Tested above | Rhythm |
| Breeding all at once | Ready: Rhythm, hurried by see my kind showing; only when Ready → lay and show | Rhythm |

### Breeding

| Behaviour | Built from | Needs |
|---|---|---|
| Finding mates | feel fertile → call or mark; hear or smell it → approach | Early |
| Choosy courtship | Tested above | Bond |
| Gifts | male, carrying food, near female → give; female: just fed → raise Charmed | Mid |
| Contests | see bigger male → move away; see smaller male → approach, show threat | Mid |
| Gathering to display | males: hear male calling → approach, and call; females approach a few males showing | Mid |
| Hanging about a displayer | see male showing → stay near; see female → approach | Mid |
| Cheating | Emerged unprompted in the courtship test | |
| Guarding a mate | see my Mate one → stay near; near male → show threat | Bond |
| Pair bonds | Mate: Bond, lingers a long time; see my Mate one → stay near | Bond |
| Breeding alone | feel alone and fertile → lay, if the body can clone | Early |
| A last effort | only when old → lay whenever fertile, even when hungry | Early |

### Raising young

| Behaviour | Built from | Needs |
|---|---|---|
| Choosing a nest site | Tested above | Early |
| Nesting together | Tested above | Early |
| Sitting on eggs | touch my egg → tend | Mid |
| Guarding eggs | Brooding: raised by just laid; only when Brooding → stay near egg, bite smaller creatures near it | Mid |
| Feeding young | carrying food, near young → give | Mid |
| Begging | young: feel hungry → show "beg"; adult: see young showing "beg" → approach, give | Mid |
| Carrying young | touch young → grab; or young: touch adult → cling | Mid |
| Following the parent | Parent: Bond, raised only when young by see adult; see my Parent one → stay near | Bond |
| A nursery | only when young → approach a few young | Mid |
| Helpers | adult, not fertile, near family young → give | Late |
| Throwing out strangers' eggs | touch stranger's egg → grab; carrying it → move away from my Home place, drop | Late |
| Laying in another's nest | smell a stranger's "Nest" → approach, lay | Mid |

### Living in groups

| Behaviour | Built from | Needs |
|---|---|---|
| Flocking | Tested above | Mid |
| Spacing out | always → mark; smell a stranger's mark → move away | Early |
| Neighbours and strangers | see a familiar one → carry on; see a stranger of my kind in my Home place → approach, bite | Learn |
| Rank | just bit one of my kind → raise Confident; see bigger of my kind → keep apart, not when Confident | Mid |
| Following a leader | Leader: Bond, raised by see biggest of my kind; see my Leader one → stay near, go the same way | Bond |
| Deciding together | at a candidate site: see a few my kind → raise Settled; only when Settled → call "Here" | Mid |
| Castes | Born with moods that switch on different instincts | Born with |
| Division of labour | A Born with mood whose kick-in point varies between individuals | Born with |
| Age roles | only when young → stay near my Home place; only when adult → wander wide | Place |
| Returning favours | see one that fed me, while carrying → give | Learn |
| Grudges | see one that hurt me → bite | Learn |
| Learning enemies from others | see one that hurt my kind → move away | Learn |
| Removing the dead | touch the dead of my kind → grab; carrying it → keep apart from my Home place, drop | Place |

### Colonies

| Behaviour | Built from | Needs |
|---|---|---|
| One breeder | Queen: Born with, rare; only when Queen → lay, mark "Queen"; others: smell "Queen" → not lay | Born with |
| Nurses and foragers | only when young → tend eggs near home; only when adult → forage | Place |
| Recruiting to food | carrying food → mark "Trail"; smell "Trail" → go along | Place |
| Building a mound | carrying material: smell "Build" → drop, mark "Build" | Late |
| Living chains | at an edge: touch my kind clinging → cling | Mid |
| Founding a new nest | feel crowded, only when Queen → wander wide, call "Follow"; hear "Follow" → approach | Born with |
| Raiding a rival nest | smell a stranger's "Nest" → approach; touch egg → grab; carrying egg → approach my Home place | Place |

### Talking

| Behaviour | Built from | Needs |
|---|---|---|
| Keeping in touch | sometimes → call "Here"; see no my kind, hear "Here" → approach | Early |
| Food calls | just ate → call "Food" | Mid |
| Pointing the way | at home, only when Feast → face my Feast place, show "dance"; see my kind showing "dance" → go the same way | Place |
| Passing a message on | hear "Danger" → call "Danger", not when Spent | Mid |
| No-entry marks | at a dead end → mark "Keep out"; smell "Keep out" → move away | Mid |
| Overmarking | smell a stranger's mark → wipe, mark | Mid |
| A false alarm | near meat: see creature coming at me → call "Danger" | Mid |

### Beyond nature

| Behaviour | Built from | Needs |
|---|---|---|
| Decoys | Decoy: Born with, one in ten; only when Decoy: see bigger creature → approach, call | Born with |
| Lighthouses | Beacon: Born with, rare; only when Beacon → hold still at my Home place, call "Home"; others, carrying → approach "Home" | Born with |
| Toll gates | In a narrow gap → hold still; just fed → raise Paid (lingers briefly); only when Paid → move away | Mid |
| A population on one clock | A shared Rhythm, hurried by each other, switching the whole species between feeding and hiding | Rhythm |
| A raid on a signal | Ready: Count of "Muster" calls heard; only when Ready → call "Go"; hear "Go" → approach a stranger's "Nest" | Count |
| A flock that follows the player | Tame: raised only when young by see my keeper, lingers until calmed; only when Tame: see my keeper → stay near | Early |
| Trained individuals | Habit on chosen instincts, with keeper's touch as the reward | Habit |

### Seasons, journeys and societies, new in draft 5

None of these has been run. "Needs" names the newest piece each relies on.

| Behaviour | Built from | Needs |
|---|---|---|
| Breeding on the spring flood | the water just rose → raise Ready (lingers a while); only when Ready and gravid → lay | The world |
| Following the tide out | only when the tide is falling: deeper → go along, creeping; see food left by the tide → approach; only when the tide is rising: shallower → approach | The world |
| Wintering low | only in autumn: downhill → approach; only in spring: uphill → approach | The world |
| Breeding at the head of a brook | only when gravid: upstream → approach (strong); on shallows, no upstream → lay | The world |
| Hunting from downwind | smell smaller creature → approach, creeping; see it facing me → hold still. A hunter led by scent alone always arrives from downwind | Early |
| A long journey with no landmark | only in autumn: south → approach; only in spring: north → approach | A compass organ |
| A colony that lasts one year | Brood mix: more founders in autumn. Founders: only in winter → rest at my Home place; in spring → dig, lay | Forms |
| One sentinel at a time | see no my kind showing "Watch" → show "Watch", hold still; showing "Watch", see bigger creature → call "Alarm"; hear "Alarm" → move away, sprinting | Mid |
| A queen's mark | Breeder: always → mark "Queen" at my Home place. Workers: lay, not when smell "Queen" | Homes |
| A queen replaced | Heir: For life, raised slowly by smell no "Queen", until calmed by smell "Queen"; once on, the worker grows into the breeder form | For life |
| Soldiers after an attack | Young: smell my home's "Alarm" mark → raise Soldier (For life, kicks in high) | For life |
| Border wars | see my kind of another home → approach, bite; more when near my Home place | Homes |
| Raiders | smell another home's "Nest" → approach; touch egg → grab; carrying egg → approach my Home place, drop. The eggs hatch with the raiders' scent | Homes |
| Joining a friend's fight | Ally: Bond. See my Ally one fighting → approach the one it is facing, bite | The one it is facing |
| Telling where food is | Found: Place, raised by just ate. At my Home place, only when Found → face my Found place, show "Found"; see my kind showing "Found" → go the same way | Pointing at a place |
| A garden | carrying seed → approach my Garden place, drop; touch plant, at my Garden place → tend; see stranger, at my Garden place → approach, bite | Seeds that sprout |
| A larder that ripens | carrying food → approach my Larder place, drop; touch stored food → tend | Tended stores |
| A parasite | see bigger creature facing away → approach, creeping; touch → cling; clinging, hungry → bite; clinging, not hungry → let go | Riders |
| Throwing off a rider | feel clung to → roll; clung to, see my kind → show "Clean me"; see my kind showing "Clean me" → approach, tend | Riders |
| A larder of living prey | touch smaller creature → sting, to tire; touch tired creature → grab; carrying → approach my Nest place, drop; at my Nest place, see tired creature → lay | A sting that tires |
| Young that eat their host | touch bigger creature facing away → lay on it. Young: just hatched → cling; clinging → bite | Lay on a carrier |

## 13. What the vocabulary still cannot say

- **Comparing two things noticed.** "Is the food nearer than the threat?" can only be approximated by blending.
- **Placing itself relative to two things at once:** getting between its young and a threat, or driving a herd toward a chosen place.
- **More than one place per mood,** or a route between places.
- **Knowing individuals** beyond one Bond per mood and "familiar".
- **Exact counting** of what is in view, or arithmetic of any kind.
- **A fixed plan** whose steps happen in order whatever the world does.
- **Messages with content** beyond a name, a loudness and, through pointing, a direction.
- **Teaching a skill** as opposed to passing on what to fear or favour.
- **Appearance.** Warning colours, camouflage and mimicry of looks remain deferred.
- **Signals that are learned,** such as a call that differs from home to home. Scent does differ by home.
- **Acting inside another body, or on another creature's moods directly.** A creature can deceive, ride on and feed on another, and can tire it with a sting.

**What the world must provide** for parts of this vocabulary to mean anything: cover that blocks sight; darkness; warmth and cold; water depth or current; carcasses, eggs and young as things that can be carried; building material; heavy things that need several carriers; and eggs and young that do better when tended.

## 14. Verb audit

Every act has to earn its place: it must do something in the world that its nearest neighbour does not, and that difference must change what happens. Each was run against its neighbour in `design/checks/verbaudit.js`.

### Body rules the verbs depend on

Without these, several verbs collapse into one another. They have to be in the game.

- **Pace and stamina.** Sprinting drains stamina and an exhausted creature slows down. Walking does not drain it.
- **Noise.** The movement sense cannot feel a creature that is still or creeping, and feels a sprinting one from twice as far.
- **View arcs.** Eyes cover an arc ahead and leave a blind rear.
- **Reach of a bite.** A bite reaches only what is in front, and big bodies turn slowly.
- **Injury.** A hurt creature is slower.
- **Head down.** While eating, a creature sees only what is near.
- **Load.** A rider slows whoever carries it.

### Results

| Verb | What only it does | Run against | Result | Verdict |
|---|---|---|---|---|
| stay near | Holds a distance instead of closing | approach | Living off a dangerous animal's leftovers: 7.8 meals each and 1.6 of 6 lost, against 1.3 meals and 3.6 lost | Keep |
| keep apart | Gives ground only when crowded | move away | Grazing beside dangerous animals: 77.5 meals each against 27.3, with the same losses (0.1 and 0.2 of 8) | Keep |
| go along | Travels a line | smell → approach | Following a scent trail to food: 60 of 60 against 0 of 60 | Keep |
| go the same way | Uses another's heading, not its position | stay near with keep apart | Flocking: alignment 0.86 against 0.12 | Keep |
| head off | Aims where the target will be | approach | Prey crossing faster than the hunters: caught in 146 of 150 runs against 117 | Keep |
| circle | Moves sideways around the target | waiting; approach | Stalking: reached the prey in 335 beats against 477 for waiting until it turned. In a five-against-one fight it cut attackers' losses from 1.9 to 1.4 when the prey turned on them, and raised them from 1.3 to 1.8 when it did not | Keep; situational |
| wander (tight, medium, wide) | Sets how sharply it turns | each other | Food in far-apart patches: 8.7, 17.6 and 21.2 meals; tight just after eating and wide otherwise gave 22.5 | Keep |
| hold still | Invisible to the movement sense | move away | Against a hunter that feels movement: 1.6 of 6 lost against 3.2. Against a hunter that sees: 5.6 against 5.2 | Keep |
| pace: sprinting | Fast, and drains stamina | walking | One hunter and one equally fast prey: sprinting after it never caught it (0 of 60) and left the hunter exhausted 81% of the time; walking after it and sprinting only when near caught it every time | Keep |
| pace: creeping | Slow, and cannot be felt | walking | Stalking prey that walks away from whatever it notices: walking in caught it in 0 of 60 runs; creeping in, 60 of 60 | Keep |
| face | Stops and turns, bringing the bite to bear | ignoring; approach | Big prey attacked head-on: attackers lost 1.9 when it faced them, 1.3 when it ignored them and 2.3 when it approached them | Keep; weak |
| cling | Travels at another's speed | stay near | Slow young with fast parents: 1.6 of 6 young lost against 2.4, with adults' losses about the same | Keep; modest |
| puff up | Changes how others class it | move away | Against hunters that attack smaller creatures and avoid bigger ones: 0 of 6 lost against 5.2 | Keep; only works on hunters that judge by size |
| weakest | Picks out the hurt | nearest | Prey that outrun the hunters unless hurt: 5.7 killed against 4.9 | Keep; modest |
| get behind | Goes to the target's back | circle while it faces me | Stalking, three kinds of prey: 322, 323 and 342 beats against 335, 334 and 356. In the fight it was never better than circling | **Cut** |
| watch | Stops, looks all round and farther | not watching | Against a hunter that walks up on feeding prey: losses of 0.7 and 7.9 of 8 became 0.6 and 7.9, and meals fell by a quarter. Against a stalker it delayed capture by 5 to 10% | **Cut** |

Call, mark, show, bite, raise, calm and hurry were each shown to matter in the earlier recipe tests.

### Words changed

- **"Near" and "far" are now bands of sight.** As a free all-round sense, "near" let prey notice anything within a few body lengths, so creeping and approaching from behind could never work.
- **"Facing me" and "facing away" replace "looking at me" and "looking away".** A creature can observe which way another is pointed, not what it can see. Whether its head is down is covered by "eating".

### Not yet audited

These have no mechanic in the stand-in world yet, so nothing shows they differ from their neighbours. None should go into a first prototype until it passes the same test.

| Verb | What it is meant to do that nothing else does |
|---|---|
| rest | Recovers faster than holding still, with the senses off |
| hide | Cannot be seen or bitten, and sees nothing; needs a shell or burrow |
| grab, drop | Moves things, eggs, young and smaller creatures |
| give | Moves food from one creature to another |
| tend | Moves care: eggs hatch sooner, young grow faster. Filler unless the world gives eggs and young something to gain |
| wipe, dig, build | Change the world. Deferred until marks are worth removing and structures exist |
| ping | Sensing that gives the sensor away. Deferred |
| play dead, crouch | Poses that change how others class it |

### What else the audit turned up

- **A sprint chase fails against equal prey.** It never closes the gap and it exhausts the hunter.
- **Prey that sprints from everything can be walked down.** Prey designs need the same care over pace as hunters.
- **A fleeing creature cannot see what is behind it.** To keep running it needs a mood that lingers or a movement sense.
- **Following for scraps did not pay.** Staying near the dangerous animal and keeping out of its reach gave 10.0 meals; simply wandering while keeping out of its reach gave 10.4. Stay near is different from approach, but following was not worth it in that world.
- **Circling can backfire.** It cost more attackers than a plain approach when the prey did not defend itself.
- **Four scenarios were redesigned** after their first run could not separate the verbs, for example because arena walls cornered the prey whatever the hunter did. The redesigns changed the test world, not the verbs.

## 15. What testing changed

1. **How moods fill.** At first a mood faded continuously, so one raised slowly could never reach its kick-in point: courtship and nesting produced no matings and no eggs. Rule 4 now says a mood fades only while nothing is raising it.
2. **Wider speed steps.** Now about a factor of ten apart. This was a judgement call; the tests did not show it changing an outcome.
3. **Flocking needs "my group".** The nearest neighbour alone gives cohesion but no shared heading.
4. **Calling the pack together can make things worse.** Against small prey on an open plain, six scattered hunters with no signals caught it in 95 of 100 runs; adding "call, and come to the caller" cut that to 35, most likely because the pack bunched up behind the prey.
5. **Packs pay off against prey one hunter cannot take.** See the pack hunt table.
6. **Mate choice needs Bond.** Without it, males that never display took a third of matings.
7. **Choosiness did not reward attentive males** over males strongly drawn to food: their share stayed at about two-thirds whatever the females required.
8. **Strength sets speed.** With a normal-strength chase, hunters caught 1.6 prey per run from a shoal; with a strong one, 10.3. A chase that is not marked strong ambles. Rule 2 now says so, and the designer should make it visible.
9. **Target choice mattered less than expected.** Locking on and heading off together caught about a sixth more than taking the nearest. Picking the straggler cut catches by more than half.
10. **Degree words earn their place.** "Not when very hungry" turned a forager that always starved into one that survived in 31 of 40 runs and was never caught.
11. **Rhythm is "hurried by", not "restarted by".** Being nudged toward the next pulse brought 24 creatures fully into step. Restarting on each flash seen was the first idea; it was dropped on reasoning, not tested.
12. **Place memory doubled feeding** in a patchy world.

Findings 4, 6, 7, 8 and 9 were not predicted. Recipes in the atlas should not be trusted until run.

## 16. Keeping a large vocabulary learnable

The vocabulary is now about seven reaches, five quantities, six ways of choosing, twenty-five kinds, a dozen states, about thirty acts and nine functions. Four things keep that manageable:

- **Slots.** A notice is assembled from short lists, one slot at a time, and most slots are left at their default.
- **The body.** A species sees only the words its parts provide. A blind burrower's lists are short.
- **Unlocks.** A new player starts with about a dozen words.
- **Puzzles.** Each new word arrives with a small tank challenge that needs it.

## 17. The designer on a phone

- **A tab for each form,** and one for the common page. A first species has a single tab.
- **Mood board.** Moods appear as large bubbles, plus an "always" group for instincts with no condition. The game draws arrows between moods that raise or calm each other; the player never routes anything.
- **Mood card.** Tapping a mood opens its settings, what raises and calms it, and the instincts that run only when it is on.
- **Instinct row.** A notice phrase, an arrow, an act, and condition chips. Tapping a slot opens a sheet showing only what this body can sense or do and what is unlocked. Order has no effect.
- **Strength and pace are visible** on every moving instinct, because a chase left at normal strength ambles.
- **Test tank.** The top half of the screen runs the creature live, with buttons to drop food, add a bigger creature, add ten of its own kind, switch day to night, or bring in the species currently alive in the shared world.
- **Watching it think.** Mood bubbles fill, firing instincts glow, and the creature shows its strongest mood as an emote using the player's own name and icon for it. The same view opens on any creature in the live world.
- **Warnings.** The designer flags an instinct that has never fired, a mood that can never reach its kick-in point, and a creature that spends long periods torn or idle.
- **After a death.** A strip shows the species' moods over its last hours and which instincts were firing.
- **Changes to a living species.** One mutation a day, picked from three offered at random, applied to newborns.
- **Puzzles.** A ladder of tank challenges that introduce each word, and a daily puzzle scored on fewest rows among friends.

## 18. Budget and unlocks

One fixed budget covers body and brain for each form, and it never grows.

- Body parts cost points, and the senses and acts they bring come with them.
- Each mood, instinct and function costs points. Moods also cost energy to run.
- A separate cap keeps brains readable: about six moods, twenty-four instincts and two conditions per instinct. These numbers are placeholders.

| Stage | Opens up |
|---|---|
| Start | touch, see; a, no; plants, sizes, own kind, my keeper; approach, move away, wander, bite, rest, lay; hungry, dark; only when, not when; two moods |
| Early | hear, smell, near; sexes and mating; calls and marks; stay near, keep apart; cover; young and adult; degree words; "until calmed" |
| Mid | far, feel; a few, many, a crowd, my group; biggest, smallest, weakest, lone; what it is doing; moments; idle, torn, stuck; more when, less when; go along, go the same way, head off, circle, face, hold still; pace; grab, give, tend, cling; show, poses, wipe; gradients; species I have met; ground, shelter and lines; time of day and season; weather; where I am; the simpler directions; a rider, roll |
| Late | The mood functions, one at a time; family and stranger; dig, build; ping; more sounds, scents and displays; a second form, and more after it; homes; older and younger; the one it is facing; water and fire words; upwind, compass headings; lay on a carrier, shed; pointing at a place |

## 19. Risks

- **Size.** The vocabulary has more than doubled. Section 16 is a plan for keeping it learnable, not evidence that it is.
- **Tuning.** Outcomes flipped on single settings in testing.
- **The stand-in world is crude.** Bites are instant, there is no terrain, and prey are simple.
- **Untested with people.** Whether friends can build these on a phone, and read them back a week later, is still the largest unknown.

## 20. Next

0. **Six direction checks on the social blocks** (`design/social.md`, section 13), which need the stand-in world extended with displays that can be heard, giving, home scent and forms.
1. A phone prototype of the designer and test tank with the Start and Early vocabulary, tried on two or three friends.
2. Run the atlas through the stand-in world, starting with the pieces nothing has exercised yet: moments, what-it-is-doing, attention, and the Catching, Count, Born with and Learn functions.
3. **Finish the verb audit.** Give rest, hide, grab, give, tend and the poses a mechanic in the stand-in world and run each against its neighbour (section 14).
4. **Carry the body rules from section 14 into the prototype's simulation,** since the verbs are only distinct with them in place.
