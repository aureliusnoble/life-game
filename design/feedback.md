# Feedback: seeing what happened

Draft 2, November 2026. Design area 10 in `design/plan.md`. Sections 1 and 13 are decided. The rest is a proposal on paper, and nothing here has been tried on a person.

## 1. Decided

- **Little text.** The game shows what happened and does not explain why.
- **The simulation records facts:** what an event was, where, when, who was involved and how big it was. It never guesses at a cause.
- **Events are classified** into the nine families in `design/loops.md`, section 7, and one list of events feeds everything that reports on the world.
- **The named one is the voice.** Asking it "What happened?" is how a player hears the species' story in words, from recorded events only.
- **A friend's design opens once the species has ended.** While it lives, what it thinks is its owner's.
- **At most one notification a day,** asked for only once the player has a reason to want it.

## 2. The problem

The player is away for nearly all of every day. A species is hundreds of animals over many generations, and the player's tools act on it indirectly, through instincts and bodies. Between an outcome and a change to the design there are five steps, and feedback fails if any one of them is missing.

| Step | The player's question | For example |
|---|---|---|
| 1. What | What happened to the species? | It fell by half overnight |
| 2. What kind | What were they dying of, or failing at? | Hunted, mostly |
| 3. In what situation | Where, when, doing what, and which of them? | At the pool, at dusk, while eating; the young |
| 4. Which behaviour or part | What was pulling them when it happened? | "touch a plant → bite" was outpulling "see a bigger creature → move away" |
| 5. Did the change help | After a mutation, is it better? | Those hatched with the change are caught half as often |

The game supplies facts at every step and the player draws the conclusion. This is what "show, don't explain" means here: no screen says "your species is too slow". A screen shows that eleven of the fourteen caught were eating, and that nine of them had seen the hunter.

## 3. What is recorded

Everything below is written by the simulation as it runs. The feedback screens only read it.

| Record | Kept | What it holds |
|---|---|---|
| The count | Each hour, for each species and form | How many are alive and their living weight; eggs laid, hatched and lost; deaths by cause; food eaten by kind |
| Where | Each hour, for each species | How many are in each piece of the map, one piece being about a phone screen |
| Each death | Once | Cause; the killer's species if there was one; place; time of day; age and form; what it was doing, meaning which instinct was winning; its strongest mood; whether it had noticed its killer |
| Each lost egg | Once | Cause: eaten and by whom, cold, flooded, dried out, or failed to hatch through fading |
| The use of each instinct | Each hour, for each form | How much of the creatures' time its condition held, and how much of their time it was the one winning. The average level of each mood |
| Lost meals | Each hour | Food a creature was heading for that another ate first, and which species took it |
| Energy | Each hour | What came in, by food; what went out on living, moving, keeping warm, growing, eggs and young, and wounds |
| Events | As they happen | The classified list from `design/loops.md` |
| The named one | Continuously | Its path, what it did hour by hour, who it met, and its last moments in full |
| Moments | For major events | A few seconds of every creature on that screen: where each was and what each was doing |

- **Size.** None of this is large: hourly rows, a short record for each death, and a handful of moments a day. An estimate of a few megabytes over a species' life is arithmetic and has not been measured.
- **Two records came out of the check in section 12:** lost meals, and whether a creature had noticed its killer. Without them two common outcomes could not be told apart from others.

## 4. The instruments

There are few of them, and each looks and works the same in the test tank, in the world, in the recap and at the end. A player learns each one once.

| Instrument | What it shows | Step | First appears |
|---|---|---|---|
| The world itself | Bodies that show how they are; ground that shows use; remains where things died | 1, 3 | From the start |
| The creature card | One creature: what it is doing, the pull behind it, its mood, age, hunger and hurts, its day so far | 3, 4 | The first tap on a creature |
| Watch it think | One creature's page of instincts, lit by what is pulling, and what it has noticed | 4 | The first build, in the tank |
| The line | The species' living weight over time, with events marked on it. The area under it is the score | 1 | The first return |
| The tally | Deaths by cause, as counts. It can be turned to show doing what, where, when, or which of them | 2, 3 | The first deaths |
| The day | How the species spends its time, as shares: eating, fleeing, resting, wandering, courting, fighting | 3, 4 | With the tally |
| The page, used | The instincts page with each row's use on it: how often its condition held and how often it won. Each mood's level through the day | 4 | The first design session |
| Lenses on the map | The same map seen for food, for deaths, for where my kind went, for who else is here; and the map run through time | 1, 3 | One at a time, as each has something to show |
| The web | My species in the middle: who eats it, what it eats, and who eats the same | 2, 3 | The first meeting with another species |
| Energy | What came in and where it went | 4 | Late, with the inside of the body |
| Before and after | Any instrument split by those hatched with a change and those without | 5 | The first mutation |

**Every instrument can be split by form.** A colony's workers and its breeder, or a species' young and its adults, have their own line, tally, day and page.

**Yesterday is drawn behind today.** The line carries yesterday's as a dashed line, the tally shows yesterday's count, and the day sits over yesterday's. A number means little without something to set it against.

**The line is the score made visible.** Total life is living weight added up over time, which is the area under the line. Other species' lines can be laid over it: a hunter's line rising behind its prey's, or a rival's rising as the player's falls.

**The tally turns.** One count of deaths, cut four ways. By cause is the default. A tap turns it to what they were doing, to where, to the time of day or season, or to which form and age. The hunted row also shows how many had noticed the hunter first.

**The day and the page are the same record at two scales.** The day adds up every creature's winning instinct by the kind of act. A tap on "fleeing" opens the page with the rows behind it lit.

**The page, used, shows three kinds of row** that a player cannot see any other way: a row whose condition never holds, a row whose condition holds and which never wins, and a row that wins nearly all the time.

## 5. The recap

"Since yesterday" is the first thing after the named one on a return visit.

- **It is the map run through the time away,** in ten to fifteen seconds. The species spreads and thins as it did, the line draws itself along the bottom, and events land as pins at their time and place.
- **It stops once, on the headline,** and plays that moment back: the few seconds that were recorded when it happened.
- **It ends on now,** with the named one, and one pointer.
- **The pointer is a place to look, not advice.** It lights the instrument that changed most since the day before: a row of the tally, a lens, a face in the web.
- **It can be skipped, scrubbed and played again.** Skipped, it leaves its pins on the map.
- **Longer absences** play at the same length, with one headline for each day away, up to three.
- **If the species ended while the player was away,** the recap is its end, as in `design/loops.md` section 5.

Which event is the headline follows a fixed order: an ending, then the named line, then numbers halving or doubling, then a new hunter or rival, then homes and spread, then the world, then records.

## 6. One creature

**The creature card** opens on a tap, for any creature of any species.

| For any creature | For the player's own, as well |
|---|---|
| Its species, form and age against a full life | What is pulling it, strongest first |
| What it is doing, in the words of the act | A button to watch it think |
| Its mood, as the emote it is showing | Its day so far, as a strip of acts |
| Whether it is fed, hurt, cold or carrying | Its parent and its young |

**Watch it think** is the behaviour editor's live view, used as an instrument. The concept test is `design/mockups/watch-it-think.html`.

- **It shows what the creature has noticed.** The reach of each sense is drawn, and things it has noticed are ringed. Many failures are a creature that never saw the thing: its eyes face the wrong way, or it was too far.
- **It works in three places:** on the player's own creatures in the world, in the test tank with pause and step, and on a recorded moment.
- **It is the player's own.** It is not offered on another player's living species.

## 7. Deaths

**One creature.** Remains can be tapped. The card shows who it was, its age, what killed it, and what it was doing. For the named one, its last moments can be played back with its page lit.

**The species.** The end is laid out in `design/loops.md` section 5 and `design/lifespan.md`. It uses the same instruments over the whole life:

- **The line from release to the end,** with fading drawn as a band that rises above it.
- **The tally for the last day,** set beside the tally for the whole life.
- **The page, used,** over the whole life.
- **The chronicle** of major events, and the named line from first to last.

## 8. The web

A drawing of every species and every link is unreadable on a phone with twenty or more species. The web is always centred on one species.

- **Above it,** the species that eat it, each face sized by how many it took.
- **Below it,** what it eats, each food or face sized by its share of the diet.
- **Beside it,** the species that eat the same things, sized by meals lost to them.
- **A missing face** is shown as a gap when a species this one ate, rode on or lived beside is gone.
- **A tap on any face** puts that species in the middle.

Every link is drawn from meals and deaths recorded over the last day, never from a design. The web is open to everyone for every species: what any creature could be watched doing is not private.

## 9. Before and after

A mutation applies to the newly hatched, so for a while two kinds of the same species live side by side. That is a fair trial run by the world itself.

- **Each mutation leaves a mark on the line.**
- **Any instrument can be split** into those hatched with the change and those without.
- **The comparison is by age,** because the new ones are all young at first. Those with the change are set against how those without it did at the same age.
- **In the test tank,** two runs can be played side by side on the same start: the design as it is, and with the change.
- **Each of the day's three mutations can be tried in the tank** before one is picked. The tank is not the world, so this is a hint and not a promise.

## 10. Records and what is ahead

- **Records** are stamped on the line and in the chronicle when they are set. Which records exist is part of `design/friends.md`.
- **Ahead** is one line at the end of a visit: the season about to turn, or how long the species has at this rate. The forecast comes from fading and the line's recent slope, and is shown as a range.

## 11. What is shown of other players' species

| Open to everyone | The owner's until the species ends |
|---|---|
| Everything visible in the world: bodies, acts, moods as emotes | The page of instincts, and watching it think |
| The creature card's first column | The page, used |
| Its line, its tally by cause, and its place in the web | The inside of its body, and its energy |
| Its events, as they appear on the map | Its settings |

## 12. A check on paper

Twenty outcomes were walked through the five steps, to see whether a player could get from each to its cause by looking. Seven are shown in full.

| Outcome | What kind | The situation | The behaviour or part |
|---|---|---|---|
| Hunted out | Tally: hunted, with the hunter's face | Tally turned: at the pool, at dusk, eating; most had not noticed | The day: little fleeing. The page: the flee row's condition seldom held |
| Ate its place bare | Tally: starved, after a peak on the line | Food lens run through time: the ground empties under them | The count: eggs laid against food. Nothing points at a restraint that is not there |
| Pushed out by a rival | Tally: starved, on a slow fall | The web: a rival beside it. Lost meals, and to whom | The day: more wandering, less eating |
| Winter kill | Tally: cold | Where: the Highlands. Which: the young | Energy: most of it went on keeping warm |
| Eggs fail | The count: laid against hatched. Lost eggs by cause | The lens: where they were laid, and who was there | The page: where and when the laying row wins |
| Cannot find mates | The count: adults and no eggs | The day: little courting | The page: the courting row's condition almost never holds |
| A row that fires too often | The line is low with few deaths of any kind | The day: a large share of fleeing | The page: one row winning nearly all the time |

The other thirteen, in brief:

| Outcome | Seen in | Reaches the behaviour or part |
|---|---|---|
| Fading | The line with its fading band; lost eggs marked as fading; the forecast | Yes. There is nothing to fix, by design |
| Flood, fire or drowning | The event's pin; the tally; the season line | Partly. A missing "leave when the water rises" is an absence |
| Killed by its own kind | Tally: own kind, at homes, while fighting | Yes: the row that bites its own kind |
| An instinct that never fires | The page, used | Yes, directly |
| A mood stuck on, or never raised | Watch it think; the mood's level through the day | Yes |
| The wrong mix of forms | Every instrument, split by form | Yes |
| Thriving | The day, the web, and which rows carry the load | Yes |
| Never spread | The lens for where my kind went, run through time | Partly. Absence again |
| A species it relied on is gone | The event; the gap in the web; the two lines laid together | Yes |
| Retired by a new release | The player's own mark on the line | Yes |
| A nudge that did nothing | The creatures' response, and the keeper rows on the page | Partly. Only while the player is watching |
| The named one died | Its card, and its last moments played back | Yes |
| A call nobody answers | The page of the form that should hear it: how often the hearing row's condition held, and how often it won | Partly. The player has to think to look at the hearers |

What the check found:

- **Two records were missing** and have been added: lost meals, and whether a creature had noticed its killer.
- **Absence cannot be pointed at.** The instruments show a row that fires at the wrong time. They cannot show a row or a part that the design lacks. The recipes in the atlas, the mutation that offers an untried word, and friends' ended designs are the help for this, and none of them is a diagnosis.
- **The other side of a meeting is private.** When a friend's hunter catches the player's creatures, the player sees their own side in full and only the outside of the hunter.
- **The tank is not the world.** A change that helps in the tank can fail among other species.
- **This is a check that an instrument exists for each step.** Whether a person can read the instruments is a different question, and it is what the concept test is for.

## 13. Answered

Decided on 15 November:

1. **Recorded moments** are kept for the day's headline and for each name-bearer's death, and for nothing else.
2. **Each of the day's three mutations can be tried in the tank** before one is picked.
3. **A friend's living species shows its outside:** what can be seen in the world, with its line, its tally and its web. Nothing of what it thinks is shown until it ends.
4. **Energy is in,** and revealed late.

## 14. Next

A concept test is in `design/mockups/since-yesterday.html`: five days in a toy world, each with one thing changed, to be read from the map run through time, the line, the tally and the day. It leaves out the pointer, watching a creature think and the web. Whether the five can be told apart by looking has been checked only by its author. Then playing with friends, in `design/friends.md`.
