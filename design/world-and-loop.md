# World, lifespan and the daily loop

November 2026. Decisions from discussion, plus proposals for how to carry them out. Where this differs from `reports/Creature sim game design exploration.md`, this is the later thinking.

## Decided

- **The world is populated mostly by player species.** There is no background cast of specialist enemies or parasites. Preset species we make fill the places that players leave empty.
- **One species at a time.** A player may not release a successor while the old species is still alive.
- **The world is many biomes, not one pond.** Each has its own cycles, responds to how species use it, and recovers after being overexploited. See `design/plan.md`.
- **Lifespan pressure depends on a species' age, not on how dominant it is.** It grows roughly exponentially with time.
- **Designs do not drift.** A species changes only through its owner's edits.
- **Daily edits can be strong,** a couple of upgrades a day applied to newborns, but never strong enough to escape the curve.
- **The daily check-in includes light, direct interaction** with the creatures, in the spirit of a Tamagotchi.
- **Creatures are soft critters, not microbes.** The look itself is still being developed; see `design/art-direction.md`.

## Lifespan pressure: proposal

Call it **fading**. Each species has one fading value that starts at release and, after a short grace period, roughly doubles every day. It is the same for every species of the same age.

- **What it acts on.** Proposed: the energy cost of living goes up and the share of eggs that hatch goes down. Both hit a struggling design sooner than a thriving one, so skill still decides how long a species lasts.
- **Why exponential fits a 3 to 7 day life.** If fading doubles daily, how long a species lasts is the logarithm of how much slack its design has. A species that could absorb an 8-fold handicap lasts about 3 days; one that could absorb 128-fold lasts about 7. Each doubling in how well a design does buys about one more day.
- **Why strong edits cannot escape it.** By the same arithmetic, an edit that makes the species 50% more efficient buys about 14 hours. Edits matter, and the curve still wins.
- **What the player sees.** A vigour meter on the species and a forecast ("about two days left at this rate").

Open: the doubling time and grace period; exactly which costs fading touches; how many preset species a small group needs for the world to feel full.

This is arithmetic, not a tested result. It needs a run in the simulation.

## Daily check-in: proposal

A visit is: read what happened, watch, make a couple of newborn upgrades, interact a little, and note ideas for the next design.

**Interacting through the creatures' own language.** The player's tools use the same signals the creatures use, so a species responds the way its instincts say it should.

| Action | What it does | Example |
|---|---|---|
| Drop a scent or sound a call | Places one of the species' own signals where the player taps | Drop the nest scent at a new site, and gravid females that follow that scent move there |
| Keeper's presence | Touch and hold makes a beacon the creatures can notice: "see my keeper", "keeper's touch" | New species start with "see my keeper → approach"; the player can rewire it, for example "keeper's touch → raise Calm" |
| Stir a mood | Raises one of the species' own moods in the creatures near the finger for a short while | Stir Brave before a fight |
| Affection | Pet, feed a treat, name an individual, keep its portrait | No effect beyond a happy reaction and a named favourite |

A small daily allowance keeps these as prompts, not control. Because every action passes through the instincts the player wrote, a species that was never taught to follow a scent will ignore the keeper's too.

## Art and tools: proposal

- **Parts are small vector drawings plus a short description.** Each part (an eye, an ear, a tail segment, a pattern) is an SVG file with a few named layers, and a few lines of data saying where it attaches, how it bends and which colours it takes from the species. Vector art stays sharp at tank size and portrait size from one file, and both a person and Claude can edit it.
- **Drawing tool.** Any vector editor that exports SVG: Figma, Inkscape or Affinity Designer. Claude can also write parts directly as SVG.
- **Engine.** PixiJS draws and animates the parts in the game. Movement (wobble, tails, blinking, squash and stretch) is code, not drawn frames.
- **A parts workbench.** A page in the repo that shows every part on a sample creature, in the tank and as a portrait, updating as files change. This is the tool for designing organisms, and it grows into the in-game creature editor.
- **Not proposed.** Skeletal animation tools such as Spine or Rive suit fixed characters, not bodies assembled by players. Rive could be revisited later for hand-animated portrait expressions. AI image generators are poor at keeping a set of parts in one style.

The mockups were built this way, with shapes written in code where the real pipeline would load SVG files.
