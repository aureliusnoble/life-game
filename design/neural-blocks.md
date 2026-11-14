# Neural blocks: what level, what kinds, and how they meet

Draft 1, November 2026. A proposal to react to, not a decision. It replaces the "rule cards in mode pages" editor recommended in `reports/Creature sim game design exploration.md`, which treated behaviours such as courting or hunting as things the player picks. Here they are things the player's wiring produces.

## The level: one link is one tendency

Three levels are possible. The proposal is the middle one.

| Level | A block is | Courting is | Problem |
|---|---|---|---|
| Raw neurons (The Bibites) | A number with a weight and an activation function | Emergent | Angle maths, weight tuning, unreadable graphs |
| **Tendencies (this proposal)** | A sense, a muscle or gland, or a tiny piece of timing | Emergent | Untested with players |
| Behaviour cards (the report) | A whole behaviour | A card or mode you select | Nothing emerges; you are swapping parts |

At the middle level the smallest meaningful act is one link: "the smell of scent A pulls me toward it". A creature is a dozen such tendencies running at once, and behaviour is what happens when they add up, suppress one another, and meet other creatures doing the same.

## Signals: two kinds

- **Level**: how much, from nothing to full. Hunger, brightness, the strength of a smell.
- **Pull**: which way and how strongly, as an arrow relative to the body. Toward the nearest green thing; up a scent gradient.

Pulls are the main simplification over The Bibites, which splits every sight into separate angle and closeness numbers that the player must wire to separate turn and thrust outputs with correctly signed weights. With Pulls, approaching is one link, fleeing is the same link set to "away", and two Pulls into the legs add as arrows, so a creature drawn to food and pushed from a threat takes a detour without anyone designing detours. A Pull plugged into a Level input reads as its strength.

## Blocks: three families

**Senses** come with body parts. Each is tuned to a physical cue, never to a role. There is no "predator" or "mate" sense.

- Eye, tuned to a colour, to bigger or smaller than me, or to moving things: where it is (Pull), how many (Level), which way it is heading (Pull).
- Nose, tuned to a scent: which way it gets stronger (Pull), how strong (Level).
- Touch and pain: where (Pull), how much (Level).
- Body states: hunger, health, age, fertile, carrying, sex (fixed per individual), light, warmth.

**Actions** come with body parts and are muscles and glands, not behaviours: Move (takes Pulls), Bite, Grab, Give, Mate, Lay, Emit a scent, Display a colour, Rest. Parts add their own: Sting, Glow, Dig, Call.

**Inner blocks** are what the brain budget buys. The starting kit is four:

- **Trigger**: off until its input passes low, mid or high, then fully on.
- **Slow**: follows its input gradually (quick, medium or long), rising and fading.
- **Noise**: a random Level, or a wandering Pull.
- **Always**: constantly on.

## How blocks meet: add, only when, unless

A link carries one block's output into another. Links into the same block add. Each link has:

- a strength: weak, normal or strong (no free-form weights);
- for Pulls, toward or away;
- two optional modifiers: **only when** a Level is high, and **unless** a Level is high.

That is the whole mediating logic. "Only when" and "unless" are RoboZZle's idea of a condition attached to any instruction, applied to links: the brain's equivalents are a signal that enables a pathway and a signal that suppresses it. Day and night differences are an "only when Light" on a link. Sexual dimorphism is an "unless Female".

Loops are allowed, and every block takes one beat to respond. That delay is what turns loops into memory and rhythm.

## Circuits that fall out of the starting kit

Checked in a throwaway script (not kept in the repo) using exactly the rules above:

| Circuit | Built from | Result |
|---|---|---|
| Memory | A Trigger linked to itself, "unless" a reset signal | Works: stays on after a one-beat pulse until reset |
| Clock | Always → Trigger, "unless" a second Trigger fed by a Slow copy of the first | Works with 3 blocks; the Slow setting sets the tempo. A cleaner, slower beat took 5 |
| Getting-stronger detector | A signal, "unless" a Slow copy of itself | Works with 2 blocks: fires on a rise, then fades |
| Rivalry (only the stronger urge wins) | Two blocks, each "unless" the other | The obvious version fails: equal inputs flicker in lockstep, and graded versions settle on a mushy compromise. It works when both blocks are Slows with strong links |

The rivalry result matters. Choosing between urges is the hardest thing to build from this kit, so it is the first candidate for a dedicated block.

## Worked examples

Notation: `source → target`, then link settings. Only the pack hunt has been simulated; the rest are constructions on paper.

**Skittish grazer** (no inner blocks)

```
Eye[green] → Move        only when Hunger, unless Eye[bigger]
Eye[bigger] → Move       away, strong
Touch[green] → Bite
Noise → Move             weak
```

**Courtship** (two inner blocks). Nothing here is called courting.

```
Fertile → Emit[scent A]                    only when Female
Nose[scent A] → Move                       unless Female
Eye[own colour] → Display[red]             unless Female
Eye[red] → Slow(long) → Trigger(high) → Mate    only when Female
Touch[own colour] → Mate                   unless Female
```

Females advertise, males follow the scent and show red near their own kind, and a female accepts only after seeing red for a sustained time. Males that wander off to feed lose the mating. Another species that emits scent A can lure the males.

**Pack hunt** (no inner blocks)

```
Eye[smaller, moving] → Move
Eye[own colour] → Move        away, only when Eye[smaller, moving]
Eye[smaller, moving] → Emit[scent B]
Nose[scent B] → Move          weak
Touch[smaller] → Bite
```

In a toy simulation (5 hunters starting bunched, prey fleeing at 85% of their speed, 200 runs), the first link alone left the pack strung out in a line behind the prey. Adding the second link fanned it out to cover more than half the circle around the prey and caught it slightly sooner (140 beats against 157). Setting that link to strong spread the pack further but it then caught the prey in only 10 of 200 runs. Surrounding emerges, and how hard packmates repel each other is a real design choice.

**Nesting ground** (two inner blocks)

```
Light → Move                  away, only when Fertile
Nose[scent C] → Move          only when Fertile
Always → Slow(long)           unless Light, unless Eye[bigger]
Slow → Trigger(high) → Lay    only when Fertile
Trigger → Emit[scent C]
```

A fertile female seeks dark cover, lays only after the spot has stayed dark and safe for a while, and scents it. Later females are drawn to the scent, so a traditional nesting ground forms and lasts only while it is used. Anything that can smell scent C can find the eggs.

## Where the emergence comes from

1. **Inside one brain.** Tendencies add and suppress each other; loops add memory and rhythm.
2. **Between individuals.** No block talks to another creature. Coordination goes through the world: scent left behind, colours shown, bodies seen.
3. **Between species.** Cues are public. Any species with the right sense can read another's scent or colour, which is what makes eavesdropping, lures, mimicry and warning colours possible. Relationships are wired, not declared.

## Phone interface

- Senses along the top and actions along the bottom, both fixed by the body. Inner blocks sit between. Portrait, scrolling vertically.
- Tap a source, then a target, to link them. Tap a link to set strength, toward or away, only when, unless. No dragging wires.
- A second view lists every link as a one-line sentence, as in the examples above. Which view people edit in is a question for the prototype.
- Links glow with live signal and Pulls draw as arrows on the creature, in a test tank on the top half of the screen.
- **Clusters**: select a few blocks, name them, and collapse them to one tile. This keeps a brain larger than one screen readable, and it means "Courting" is something the player built and named.

## Budget and unlocks

Every sense organ, gland, inner block and link draws on the one fixed body-and-brain budget, and inner blocks also cost energy to run. Unlocks add kinds, not capacity:

- new cues to sense (motion, size, sound, heat) and new glands (more scents, displays, glow, calls);
- new inner blocks: Turn (swing a Pull sideways, for circling), Clock, Memory, Rival, Count, Home (remember a place), Learn (a link that strengthens with reward);
- several of these compress circuits players will already have built by hand, so the unlock rewards understanding. Whether the compressed block should be cheaper than the hand-built circuit is open.

RoboZZle also suggests the teaching method: a ladder of tiny tank puzzles ("reach the food without touching the big thing, three links") that introduce each block and gate its unlock, plus a daily puzzle scored on fewest blocks among friends.

## Risks

- **Harder than picking behaviours.** The research found Bibites players struggle to hand-wire brains. This design removes three causes (angle maths, free-form weights, activation functions) but whether that is enough is untested.
- **Tuning.** The pack hunt flipped from working to failing on one strength setting. That is the game, but only with a fast test loop.
- **Beat races.** The naive rivalry circuit flickers. Players will hit this.
- **Which one?** A sense reports the nearest match only. Targets defined by two cues at once need a compound tuning.
- **Reading your own brain a week later.** Clusters, live glow and the sentence view are the answer on paper only.

## What to build first

A phone sandbox: one tank, the starting kit, and an attempt to build the four examples above. If they cannot be built comfortably on a phone, the level is wrong and should change before anything else is designed around it.
