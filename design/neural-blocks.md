# Neural editor: instincts, moods and signals

Draft 2, November 2026. This replaces the wired-blocks draft (still in git history), which was judged too low-level: players should not have to build memory or timing out of loops and thresholds. This draft keeps behaviour emergent but supplies that machinery as settings.

Anything marked **tested** was run in `design/checks/moodsim.js`, a small stand-in world that implements the rules below. It is not the game, and its numbers show direction, not balance. Everything else is on paper.

## The idea

A species' brain is a list of **instincts** and a handful of **moods**.

- An instinct is one small reaction: notice something, do something. All instincts run at once and their effects add up.
- A mood is a named meter the player defines. Instincts raise it and calm it, it lingers for a set time, and other instincts can be switched on or off by it.
- Creatures affect each other only through the world: what they do, and the **signals** (calls, scent marks, displays) they make.

Nothing in the vocabulary is a behaviour. Hunting, courting, flocking and nesting are what the instincts add up to.

## The rules

1. Thinking happens in beats. Every beat, each instinct whose conditions hold makes its contribution.
2. Movement contributions add as arrows, and nearer things pull harder. The body moves along the sum, so two urges produce a compromise path nobody wrote.
3. Other acts (bite, call, lay) happen when the notice behind them is strong enough and the body allows it: it must be touching, have the energy, and not be on cooldown.
4. A mood rises while anything is raising it, drops when something calms it, and fades at its own rate only while nothing is raising it.
5. A mood is "on" above its kick-in point, with a small margin so it does not flicker.
6. An instinct can carry up to two conditions: **only when** a feeling is on, and **not when** a feeling is on. Feelings are moods, body states (hungry, dark) and fixed traits (female, young).
7. That is everything. There are no loops, sequences or free-form numbers. Settings come in three or four named steps.

Two of these rules exist because the first version failed in testing; see "What testing changed".

## Vocabulary

"When" shows roughly where in the unlock order a piece would arrive: Start, Early, Mid or Late.

### What a creature can notice

Every notice has a strength, and things in the world also have a direction.

**Reach**

| Word | Meaning | When |
|---|---|---|
| touch | In contact | Start |
| see | Within eyesight; nearer is stronger | Start |
| near | Within a few body lengths | Early |
| hear | A call, from any direction, at long range | Early |
| smell | A scent mark; points toward where it is stronger | Early |

**How many**

| Word | Meaning | When |
|---|---|---|
| (none) | The nearest one | Start |
| many | Three or more in view | Mid |
| my group | The few nearest of my kind taken together: their centre and their average heading | Mid |

**Things in the world**

| Kind | Options | When |
|---|---|---|
| Food | plant, meat, egg | Start, Early, Mid |
| My kind | any, male, female, young, adult, showing a display, carrying something | Start; sex and age Early |
| Other creatures | bigger, smaller, about my size | Start |
| A species I have met | Picked from the list of species this lineage has encountered | Mid |
| A kind I learned about | one that hurt me, one I have eaten, one that fed or groomed me | Late (Learn) |
| One particular creature | "my [mood] one": the creature a mood is about | Late (Bond) |
| Signals | a call, a scent mark (mine, my kind's, a stranger's), a display | Early |
| Places | cover, open ground, water's edge, warmer, cooler, brighter, darker | Early to Mid |
| A remembered place | home | Late (Home) |

**Feelings (no direction)**

| Kind | Options | When |
|---|---|---|
| Body | hungry, hurt, in pain, tired, carrying, covered | Start to Early |
| Breeding | fertile, gravid | Early |
| Surroundings | dark, light, cold, warm, crowded, alone | Start to Mid |
| Traits | male, female, young, adult, old | Early |
| Moods | any mood the player has made | Start |
| Constants | always, sometimes | Start |

### What a creature can do

| Kind | Act | Effect | When |
|---|---|---|---|
| Move | approach | Toward what was noticed | Start |
| | move away | Away from it | Start |
| | wander | Drift in a slowly changing direction | Start |
| | keep apart | Away only when too close | Early |
| | stay near | Toward only when too far | Early |
| | go the same way | Match its heading | Mid |
| | circle | Sideways around it; each individual has a fixed side | Mid |
| | hold still | Damps all movement | Mid |
| | sprint | Faster, at an energy cost | Mid |
| Body | bite | Eat or wound what it is touching | Start |
| | rest | Recover; lower energy use | Start |
| | lay | Lay an egg here | Start |
| | mate | With the one it is touching, if both want to | Early |
| | grab, drop, give | Carry things; hand food to another | Mid |
| | hide | Withdraw, if the body has a shell or burrow | Mid |
| | groom | Clean another creature; feeds the groomer | Late |
| Signal | call | A named sound, heard at once and far | Early |
| | mark | A named scent left on the ground | Early |
| | show | A named display others can see | Mid |
| Mood | raise, calm | Fill or drain a mood: quickly, normally or slowly | Start |

Body parts add their own acts: sting, glow, dig, spray.

### Moods

A mood has four settings.

| Setting | Options | What it gives the player |
|---|---|---|
| Raised by | Any notice, at a speed | What the mood is about |
| Calmed by | Any notice, at a speed | Choosing: "Scared calms Hungry" |
| Lingers | briefly, a while, a long time, until calmed | Memory: "Wary lingers a long time" |
| Kicks in | low, half, high | How much it takes before it matters |

Timing comes from the raise speed: a mood raised slowly ignores a glimpse and responds only to something sustained. Each speed step is about ten times the last, so one setting suits reflexes and another suits rituals.

### Mood functions

These are the unlockable "neural functions". Each is one switch on a mood.

| Function | What it does | What it makes possible | Status |
|---|---|---|---|
| Bond | The mood is about one creature: whoever first raised it. Only that creature keeps raising it, and instincts can refer to "my [mood] one" | Mate choice, pair bonds, parent and young, sticking to one target, grudges | Tested |
| Rhythm | The mood rises and falls by itself at a set tempo | Patrols, pulsing calls, taking shifts | On paper |
| Count | The mood steps up once per event and switches on at a set number | "After three failed chases, move on" | On paper |
| Born with | A set share of newborns start with the mood full, for life | Castes, sentinels, bold and shy individuals | On paper |
| Catching | The mood rises on seeing one's own kind in it | Panic, excitement, synchronised breeding | On paper |
| Learn | Experience fills in three kinds: one that hurt me, one I have eaten, one that fed me | Enemies and allies formed by what actually happened | On paper |
| Home | Remembers a place: where it hatched, or where the mood was last full | Returning to a nest, hoarding, trails | On paper |

### Signals

| Signal | Reach | Lasts | Typical use |
|---|---|---|---|
| Call | Far, all directions | A moment | Alarm, recruiting, advertising |
| Mark | Close; followed by smell | Minutes to hours, fading | Trails, territory, nest sites |
| Display | Line of sight | While shown | Courtship, threat, warning |

Signals are public. There is a small shared set of sounds, scents and displays, and any species with the right sense can notice any of them. A player names what a sound means for their own species; nothing stops another species reacting to it.

## Body, sex and age

- **The body sets the vocabulary.** Eyes give see and its range; a nose gives smell; ears give hear; a voice, scent gland or crest gives call, mark or show; a mouth type decides what bite can eat. A brain can only use what the body has.
- **Sex.** A species is either cloning or two-sexed. In a two-sexed species every individual runs the same brain, and "only when female" or "only when male" makes the sexes behave differently. Parts can also be grown by one sex only.
- **Age.** "Only when young" and "only when adult" do the same for life stages.

## How relationships between species arise

None of these is a setting. Each falls out of pieces that exist for other reasons.

| Relationship | How it arises |
|---|---|
| Predator and prey | Size senses and bite |
| Learned enemies and allies | Learn: "see one that hurt me → move away" |
| Eavesdropping | Reacting to another species' alarm call or trail |
| Luring | Making another species' mating call |
| Nest raiding | Following another species' nest scent to its eggs |
| Brood parasitism | Laying where another species' nest scent is strong |
| Cleaning | One species grooms, the other holds still when groomed |
| Following | Staying near a bigger species to eat what it leaves |
| Guarding | A small species' alarm call that a big species has chosen to heed |

Warning colours, camouflage and mimicry need senses tuned to appearance. That layer is deferred; see "Gaps".

## Tested recipes

Each list is exactly what was run. "(weak)" and "(strong)" are instinct strengths.

### Pack hunt on big prey

Prey is bigger, slower, has 8 hit points and bites back; hunters have 2.

```
Moods
  Hunting: lingers briefly
  Brave:   lingers briefly, kicks in high

see bigger creature → raise Hunting (quickly)
many my kind → raise Brave (quickly)
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

Courage without a way to gather is useless; with the call, the pack kills every time and in under half the time.

### Choosy courtship

In the check, each sex ran only its own rows.

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

Males that display competed with identical males that never do (30 runs).

| Female design | Displayers' share of matings |
|---|---|
| Accepts any male at once | 50% |
| Charmed by any displaying male in sight | 66% |
| Charmed only by a displaying male close by | 77% |
| Charmed is a Bond; mates only with that male | 100% |

Without Bond, one male's display charms her and a male that never displays takes the mating. Cheating emerged without being designed, and Bond is what closes it.

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

With six equal patches of cover (30 runs), the busiest patch took 36% of later eggs without the scent rows and 45% with them, and the number of patches still in use fell from 5.6 to 4.8. The scent concentrates laying, but modestly.

### Flocking

```
see my group → stay near
see my kind → keep apart
see my group → go the same way
always → wander (weak)
```

Alignment (0 is random headings, 1 is all the same way) was 0.86 with these rows. The same rows using only the nearest neighbour gave 0.14. Flocking needs "my group".

## Recipes on paper

Short forms; none of these has been run.

| Behaviour | Built from | Needs |
|---|---|---|
| **Feeding** | | |
| Grazing | see plant → approach, only when hungry; touch plant → bite | Start |
| Scavenging | see meat → approach; touch meat → bite | Early |
| Ambush | in cover and hungry → hold still; near smaller creature → sprint, bite | Mid |
| Hoarding | carrying → approach home; at home → drop | Home |
| Food trails | carrying → approach home and mark "Trail"; not carrying → approach "Trail" and move away from home (weak) | Home; trail direction is a known hard case |
| Egg raiding | smell a stranger's "Nest" → approach; touch egg → bite | Mid |
| **Defence** | | |
| Fleeing | see bigger creature → move away | Start |
| Staying wary | Wary: raised by pain, lingers a long time; only when Wary → stay near cover | Early |
| Freezing or hiding | see bigger creature → hold still, or hide | Mid |
| Alarm calls | see bigger creature → call "Danger"; hear "Danger" → raise Scared; only when Scared → approach cover | Early |
| Mobbing | many my kind → raise Brave; only when Brave → approach bigger creature, bite | Mid |
| Sentinels | Watchful: Born with, one in eight; only when Watchful → hold still, and call on seeing a bigger creature | Born with |
| **Daily and seasonal** | | |
| Nocturnal habits | feeding rows "only when dark"; when light → approach cover, rest | Start |
| Shared roosts | resting → mark "Roost"; when light → approach "Roost" | Early |
| Winter sleep | when cold → approach cover, rest | Mid |
| Migration | when cold → approach warmer | Mid |
| **Breeding** | | |
| Finding mates | feel fertile → call or mark; hear or smell it → approach | Early |
| Male contests | see male showing → show, approach; Rival raised by it; touch male → bite, only when Rival | Mid |
| Pair bonds | Mate: Bond, lingers a long time; see my Mate one → stay near | Bond |
| Guarding eggs | Brooding raised by laying; only when Brooding → stay near egg, bite smaller creatures near it | Mid |
| Feeding young | carrying and near young → give | Mid |
| Young keeping close | only when young → stay near adult | Early |
| **Social** | | |
| Herding under threat | flocking rows, plus only when Scared → stay near my group (strong) | Mid |
| Spacing and territory | always → mark; smell a stranger's mark → move away | Early |
| Castes | Born with moods that switch on different sets of instincts | Born with |
| Age roles | only when young → stay near home; only when adult → roam | Home |
| Panic | Scared with Catching | Catching |

## What testing changed

1. **How moods fill.** At first a mood faded continuously, so one raised slowly could never reach its kick-in point: courtship and nesting produced no matings and no eggs. Rule 4 now says a mood fades only while nothing is raising it.
2. **Wider speed steps.** With speeds a factor of three apart, "slowly" was too quick to tell a persistent suitor from a passing one. The steps are now about a factor of ten apart.
3. **"My group" is required for flocking.** The nearest neighbour alone gives cohesion but no shared heading.
4. **Calling the pack together can make things worse.** Against small prey slightly slower than the hunters on an open plain, six scattered hunters with no signals caught it in 95 of 100 runs. Adding "call, and come to the caller" cut that to 35, because the pack bunched up behind the prey and lost the spread that had been cornering it. Adding keep apart and circle recovered it to 81, still below no signals at all.
5. **Packs pay off against prey one hunter cannot take.** That is the table under "Pack hunt on big prey". The body side of the game has to supply such prey for pack designs to be worth their cost.
6. **Mate choice needs Bond.** Without it, choosiness is exploitable, as the courtship table shows.

Findings 4 and 6 were not predicted. They are the kind of result the game is meant to produce, and also a warning that recipes cannot be trusted until run.

## The designer on a phone

- **Mood board.** The brain screen shows the moods as large bubbles, plus an "always" group for instincts with no condition. The game draws arrows between moods that raise or calm each other; the player never routes anything.
- **Mood card.** Tapping a mood opens its settings and two lists: what raises and calms it, and the instincts that run only when it is on.
- **Instinct row.** `[notice] → [do]`, a strength, and up to two condition chips. Each slot is filled by tapping it and choosing from a sheet that shows only what this body can sense or do and what is unlocked. Nothing is typed or dragged except to reorder rows for tidiness; order has no effect.
- **Test tank.** The top half of the screen runs the creature live. Buttons drop food, add a bigger creature, add ten of its own kind, switch day to night, or bring in the species currently alive in the shared world.
- **Watching it think.** Mood bubbles fill as the creature feels them, firing instincts glow, and the creature shows its strongest mood as an emote using the player's own name and icon for it. The same view opens on any of the player's creatures in the live world, which is the daily check-in.
- **After a death.** A strip shows the species' moods over its last hours and which instincts were firing, so the player can see what it was doing when it failed.
- **Small edits to a living species.** One change at a time: one setting, one row added or removed, or one condition. Changes apply to newborns.
- **Puzzles.** A ladder of small tank challenges ("reach the food without being caught, four rows") introduces each piece and gates its unlock, with a daily puzzle scored on fewest rows among friends.

## Budget and unlocks

One fixed budget covers body and brain, and it never grows.

- Body parts cost points, and the senses and acts they bring come with them.
- Each mood, each instinct and each mood function costs points. Moods also cost energy to run, so a large brain needs a better diet.
- A separate cap keeps brains readable: about six moods, twenty-four instincts and two conditions per instinct. These numbers are placeholders until the simulation can price them.

Unlocks add kinds of piece, not capacity:

| Stage | Opens up |
|---|---|
| Start | Plants, sizes, own kind; approach, move away, wander, bite, rest, lay; two moods |
| Early | Sexes and mating; calls and marks; near; keep apart, stay near; cover; "until calmed" |
| Mid | Many, my group; go the same way, circle, hold still, sprint; carrying; displays; species I have met; eggs as food |
| Late | The mood functions, one at a time; grooming; more sounds, scents and displays |

## Gaps and risks

- **Which one?** A notice reports the nearest match. "Many", "my group" and Bond cover the cases found so far, but others will appear, such as choosing the weakest of several prey.
- **No sequences.** A fixed order of steps can only be approximated with moods that raise one another. Whether players miss it is unknown.
- **Direction is not remembered,** except through Home and through marks left in the world.
- **Appearance is deferred.** Senses use plain kinds (bigger, my kind, a species I have met). Warning colours, camouflage and mimicry need senses tuned to colour or pattern, which adds a layer of difficulty and is left for later.
- **Tuning.** Outcomes flipped on single settings in testing. The game needs a fast test loop to make that enjoyable.
- **The stand-in world is crude.** Bites are instant, there is no terrain, and prey are simple. Results show whether a recipe works at all, not how well it would do in the game.
- **Untested with people.** Whether friends can build these on a phone, and read them back a week later, is the largest unknown.

## Next

1. A phone prototype of the designer and test tank, with the Start and Early vocabulary, tried on two or three friends.
2. Run the paper recipes through the stand-in world, starting with alarm calls, guarding eggs and food trails, and add the remaining mood functions to it.
