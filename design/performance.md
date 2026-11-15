# Performance, and what runs where

Draft 1, 15 November 2026. Two things were measured for this note, both with stand-ins. Everything else is reasoned and marked as such. Nothing here is decided.

## 1. The split

**The server decides and the phone shows.** There is one world, it keeps running while everyone is away, and every player has to see the same one. That fixes most of the split.

| What | Where | Why |
|---|---|---|
| The world's simulation: where every creature is, its needs and moods, births and deaths, food, weather, season, fire, flood and tide | Server | One shared truth, running all day |
| Scores, fading, unlocks and the day's mutations | Server | They depend on the whole world |
| What is recorded for feedback: tallies, moments, the recap | Server | Written as things happen, mostly while the player is away |
| Memories, and talking to a named one | Server | Already decided in the pet-play design |
| Species designs | Server, with a copy kept on the phone | Friends need them to draw each other's species |
| The body and behaviour designers | Phone | Nothing in them needs the world |
| The test tank | Phone | The same simulation code as the server, so a design behaves in the tank as it will in the world |
| Drawing everything | Phone | |
| How a creature moves between two updates: its steps, its ears and tail, blinking, breathing | Phone | Made from what the server sends: where it is, where it faces, what it is doing, how it is and how it feels |
| The world's own motion: wind, glints, cloud shadows, butterflies, petals | Phone | Looks only, so never sent. Taken from the shared clock, so two friends side by side see the same gust |
| Sound | Phone | |
| Nudges, strokes and treats | Sent to the server | They change something in the world. The creature's answer is drawn by the phone |

**Consequences.** The world cannot be watched with no connection; the designers and the tank can be used without one. Cheating matters little among friends, and this split closes it off anyway.

## 2. What crosses the connection

Reasoned, not measured.

| When | What is sent | How much |
|---|---|---|
| Looking at a place | About four updates a second for creatures in and near the view: which one, where, facing, what it is doing and at what, how it is, how it feels. Events as they happen: a bite, a call, a birth, a death | About 16 bytes for each creature in each update. Sixty creatures in view is about 4 kilobytes a second |
| Looking at the basin | A grid of how many of each species are where | Small; every 10 to 30 seconds |
| Opening the game | The recap | Once |
| Meeting a species for the first time | Its design | Once, then kept |

A fifteen-minute visit spent watching a busy place is under 4 megabytes. Twenty players doing that daily is about 2 gigabytes a month, far inside what a small server includes.

The phone keeps about half a second in hand and draws between updates, so four a second looks continuous.

## 3. The server

**Measured, with a stand-in.** `node design/checks/simcost.js [creatures]` is not the simulation. It has the shape of the work: a map of 26 by 20 screens, creatures that gather at forty busy places, each finding its neighbours through a grid and seeing only ahead, a dozen instincts added into one steer, lingering moods, eating from a food grid that regrows, hunting, dying and being replaced. Run on one processor of a four-processor test machine:

| Creatures | One step takes | Steps a second, flat out | At four steps a second, share of one processor |
|---|---|---|---|
| 1,500 | 0.34 ms | 2,900 | 0.14% |
| 3,000 | 0.81 ms | 1,240 | 0.32% |
| 6,000 | 1.95 ms | 510 | 0.78% |
| 12,000 | 5.13 ms | 195 | 2.05% |

The world is designed for 1,500 to 3,000 creatures.

**Reading it.** The real simulation will be heavier for each creature: more instincts, memory, calls, forms, records. A €6 to €10 server's processor is slower than the test machine's. Allow twenty times heavier and three times slower, and 3,000 creatures at four steps a second take about a fifth of one processor. The simulation is not the risk on the server.

**What follows:**

- **Four steps a second is enough.** A creature sees about a fifth of a screen and walks about 6 units a second, so it moves a fiftieth of its sight in one step.
- **Steps have a fixed length and do not read the clock,** so the same code can run faster than real time. With the allowance above that is about five times real time on the server and far more on a development machine. Balance runs and the audits use this.
- **The world runs the same whether or not anyone is watching.** It is cheap enough that no shortcut is needed, and a shortcut would make results depend on who was looking.
- **The simulation runs apart from the part that talks to phones,** so a slow step never stalls a connection.
- **Saving.** The whole state of 3,000 creatures is about a megabyte. It is saved every few minutes, with a log of events between saves, so a restart loses nothing a player would notice.

**Not measured:** the real simulation; this stand-in's creatures see fewer neighbours than a real gathering will hold.

## 4. The phone

**Measured, in the study.** `node design/checks/framecost.js` times `design/mockups/paper-study.html` at phone size, at three device pixels to one, in a test browser with the processor slowed to a quarter, one creature on screen:

| Part of a frame | Time | Share |
|---|---|---|
| Setting the creature down: two soft shadows cast from a whole-screen image | 209 ms | 37% |
| The tree: two soft shadows cast from whole-screen images, then the leaves | 276 ms | 49% |
| The photograph: two washes and grain over the whole screen | 29 ms | 5% |
| Low plants: 16 tufts and 13 flowers, cut afresh | 19 ms | 3% |
| Everything else, including drawing the creature's sheets | 32 ms | 6% |
| **A frame** | **565 ms** | |

A frame has to take under 16 ms. At two device pixels to one the frame took 245 ms.

**Reading it.** The test browser draws without a graphics chip, so these are not a phone's numbers. The ranking is the finding. The study cuts every sheet afresh on every frame and casts live, blurred shadows from images the size of the screen; two such shadows are 86% of the frame. It was built to find the look, and it cannot be the game's renderer. The look does not depend on drawing it this way.

**What the game would do instead. Proposed, to be proved on phones:**

| | The study | The game |
|---|---|---|
| A sheet: ground, prop or creature part | Cut, textured and edged on every frame | Drawn once into a stored picture, with its paper and edges. A frame only places stored pictures |
| Shadows | A live blur of a whole-screen image for each caster | Each layer's casters are drawn in one flat colour into a half-size layer, moved by their height, and the layer is laid over the ground once. One tone, already merged where they overlap, which is the asset rule. The softness of the edge comes from the layer's size |
| A part's lit edge after it turns | Worked out afresh | Stored for 16 headings to begin with. If that is too coarse or too heavy, the edge's direction is stored in the picture and lit as it is drawn |
| The photograph's washes and grain | Painted over every frame | One stored overlay |
| Ground | One stored picture for the screen, already | Stored tiles, a screen each, made as they come into view |

**Three ways of drawing, one for each distance** in the look design:

| Distance | What is drawn | How many |
|---|---|---|
| The basin | Washes of colour | A few |
| A biome | Each creature as one stored picture for its heading and pose: outline, eyes, signature and accent only | A few hundred |
| Close | Each creature's parts placed separately, with the springs and steps of the study | Twenty or so |

A phone's graphics chip places thousands of stored pictures in a frame, so the counts above are not the risk. The risks are the time to make a species' pictures when it first comes into view, and how much memory they take when many species are near.

**Other measures:** stop drawing when the game is hidden; draw at thirty frames a second when nothing on screen is moving close up; a setting for less motion.

**The kit runs on the phone.** A species' pictures are made from its row by the same code that draws the study. The body designer uses that code for its preview, so what a player designs is what the world shows.

## 5. What to measure, in order

1. The real simulation with real instincts, 3,000 creatures, on the server that will host it.
2. Stored pictures and shadow layers on two real phones, one of them old: a biome view with 150 creatures.
3. The close view with twenty creatures in parts.
4. The time to make one species' pictures on a phone, and the memory for thirty species.
5. The data used in a fifteen-minute visit.

The first belongs to building step 2 and the rest to step 3 in `design/plan.md`.

## 6. Questions

1. **Which is the oldest phone the game has to run well on?** It sets every budget in section 4.
2. **Is it acceptable that the world cannot be watched without a connection,** with the designers and the tank still usable?
3. **Should the wind and the small events be the same for everyone,** taken from the shared clock, or does it not matter?
