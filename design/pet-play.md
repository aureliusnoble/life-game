# Pet play: the named line, tending and talking

Draft 2, November 2026. Design area 9 in `design/plan.md`. Section 1 is decided. The rest is a proposal on paper.

## 1. Decided

- **There must be Tamagotchi-like play,** and it centres on a named line: the player names a founder, and when it dies the name and some of its memories pass to an heir.
- **The name-bearer is no stronger than any other member.** It is the one the player tends and talks to.
- **Time with the named one is part of day one.**
- **Talking is through a fixed set of things to say,** five times a day for each player. A language model puts the creature's answers into words, and the simulation decides everything that happens.
- **Two memories, kept apart:** species memory, which is the record of game events and is written only by the simulation, and conversation memory, which is what the player and the creature have said.
- **Running out of talks is shown in the game's own language:** the named one has said what it has to say for today.
- **The player's tools work through the creatures' own language,** so a species responds the way its instincts say it should.
- **Little text.** The creature shows how it is; it is not described.
- **Only the line is named.** Other individuals cannot be given names.
- **An heir meets its keeper as a stranger.** Memories pass down the line; trust does not.
- **The heir is not too old.** It is chosen to have most of its life ahead of it.
- **Nudges are not rationed.** They are short-lived.
- **No marker is left** where a name-bearer falls.

## 2. The named one

One member of the species at a time carries the name. It lives in the simulation exactly as the others do: it forages, flees, breeds, grows old and can be killed.

- **Always one tap away.** The game opens on it, and a button returns to it from anywhere.
- **What the player sees of it:** its portrait, its number in the line, its age against a full life, what it is doing, and its strongest mood as an emote.
- **It shows how it is.** It limps when hurt, shivers when cold, drags when hungry, yawns when tired, and looks about when scared. This is the same expression every creature has, seen close.
- **It has a character.** Three traits are read from the species' design, and each individual sits a little to one side of them:

| Trait | Read from | Shows as |
|---|---|---|
| Bold or shy | How strongly it flees, and how soon | Whether it comes to the finger or hangs back |
| Sociable or solitary | How strongly it keeps near its own kind | Whether it brings others with it |
| Busy or placid | How much it wanders and how much it rests | How long it stays for a stroke |

Each individual also has one quirk of its own, such as a liking for the water's edge or for sleeping late. Quirks change nothing in the simulation.

## 3. The line

- **The heir** is a descendant with most of its life ahead of it: a young adult if there is one, and otherwise the oldest of the young. Children come before grandchildren. If there is no descendant, the nearest living relative is chosen by the same test.
- **In a colony** the line is the breeder's.
- **In a species that splits,** one of the two halves keeps the name.
- **In a species that lays once and dies,** the name waits in an egg through the winter.
- **The line ends only when the species does.**

**When the name passes.** It is a major event, and the day's headline when it happens. The player is shown the heir, and how the last name-bearer died.

**What an heir receives:**

| Passed down | What it is | What it does |
|---|---|---|
| The name and its number | "Pip the Fourth" | The count of generations is a visible age for the species |
| The line's memories | A short list of major events that happened to name-bearers: where the nest was, what killed the last one, the worst winter | The creature can speak of them, and the player can read them |
| A summary of what was said | The conversation memory, shortened | The heir knows the line's stories. It still meets its keeper as a stranger, and is as wary of the finger as any other |

An heir does not receive its parent's places, bonds or learned enemies. Those belong to an individual, and each creature makes its own.

## 4. Tending

What the player does with the named one, close in. None of it is rationed, and none of it changes how the species fares.

| Action | What the creature does | Effect in the simulation |
|---|---|---|
| Stroke | Leans in, or flinches and settles, by its character | "Keeper's touch", which the species' instincts can answer |
| Feed a treat | Eats it, and looks for more | A mouthful, no more than it would find for itself |
| Call it | Comes if its instincts allow, and can refuse | "See my keeper", which new species answer by approaching |
| Groom | Holds still; anything clinging to it comes off | The same as being tended by its own kind |
| Follow | Carries on with its life | None. The view stays with it |
| Keep its portrait | Looks up | None. The portrait goes into the line's album |

The album holds every name-bearer: its portrait, its number, how long it lived and how it died.

A stroke or a call reaches the creature as something it notices. What it does about it is the species' own instincts, which the player wrote. A species can be designed to be calmed by its keeper, or emboldened, or to ignore them.

## 5. Nudging the species

The keeper's tools from `design/world-and-loop.md`: drop one of the species' own scents or calls, stir one of its moods, or hold a finger down as a beacon. These reach many creatures, not one, and so they can move a species.

- **They work through the species' instincts,** like everything else. A species that was not built to follow a scent will not follow one.
- **They are not rationed.** A player can use them as often as they like while they are there.
- **They are short-lived.** A dropped scent fades and a stirred mood settles, so a nudge helps for a moment and cannot stand in for a design. How long each lasts is for the balance pass.

## 6. Talking

Each talk is one thing from a fixed set, and uses one of the day's five.

| Kind | Things to say | What comes back |
|---|---|---|
| Ask | How are you? What happened? What is wrong? Who troubles you? | A line of a few words and an emote, from its state now and the species memory |
| Ask where | Where is the food? Where is home? Where is the danger? | It turns to face the place, and the view follows |
| Ask about the past | Tell me about the one before you | A line from the line's memories |
| Request | Come with me. Stay close. Be careful. Go home | It agrees or refuses. The simulation decides, from its moods and instincts, and does whatever follows |
| Give | A treat. Something found | It takes it or does not |

- **Short.** A reply is one sentence at most, and often an emote says it.
- **It works without the model.** The same set returns plain stock lines if the service is off. The model gives the creature a voice of its own; it is not what makes the talking work.
- **It is a way to look into the world.** "What happened?" and "What is wrong?" are how a player hears what the species went through, in the creature's words and from recorded events only.
- **It can say no.** A scared creature will not come. That is the simulation's answer, put into words.

## 7. What keeps this fair

- **Nothing here makes the named one stronger,** and its death is as likely as any other's.
- **Tending touches one animal.** At the scale of a species it is nothing.
- **Nudges fade,** and only work while the player is there.
- **The model changes nothing in the game.**

## 8. Answered

Decided on 15 November:

1. **Nudges** are unlimited and short-lived.
2. **Only the line is named.**
3. **No marker** where a name-bearer fell.
4. **An heir meets its keeper as a stranger,** and is chosen so that it is not too old.

## 9. Next

A concept mockup of tending, to see whether it is pleasant to poke at for five minutes, and then feedback and friends.
