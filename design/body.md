# Body designer: physical characteristics

Draft 3, 16 November 2026. Adds the species sheet in section 16: one list of every choice about a body, read by the rules, the drawing and the designer. Sections 1 to 14 are draft 2, a rework after the life-cycle and social designs and the first runs of the balance lab. Earlier drafts are in git history.

Anything marked **tested** was run in `design/checks/bodyaudit.js` or `design/checks/balancelab.js`, stand-in worlds whose numbers show direction, not balance. Everything else is on paper. Costs are left for the balance pass at the end of the design process.

## 1. Starting from Spore's creature creator

What it got right, from the research notes:

- It was simple to use and still produced something its maker valued; its lead designer called this a "magic crayon".
- The loop was do something, look at it, adjust.
- Any combination of parts moved believably.

Where it fell short: abilities were tied to owning a part at a given level, not to shape, size, placement or number. Its own designers said the parts' effects were "unfortunately quite discrete", and players reported that the design "didn't actually make any difference".

This design goes further in seven ways:

1. **Form is function.** Shape, size and placement have continuous effects. Nothing has a level.
2. **Where a part sits matters.** Eyes, weapons, armour and grips each cover an arc.
3. **The inside matters.** Organs share the room inside the body.
4. **Whole-body numbers are worked out, not bought.** Speed, turning, appetite and hit points come from the build and are shown live.
5. **No best build.** Every part should be the wrong choice somewhere.
6. **Others can see what you are.** Armour, weapons and size are visible, and other creatures can act on them.
7. **Lives, not only bodies.** A species is made of forms, and each form is a body of its own.

Colour, pattern and proportion stay free, so two species with the same parts need not look alike.

## 2. A species is made of forms

Decided in `design/social.md`, section 9. A form is one kind of individual: a sex, a life stage or a caste.

- **Each form has its own body, as a variation on the species' base body,** designed under the same combined allowance for body and brain.
- **Forms may not be completely divergent.** The body plan and the look are shared. Leaving a part out is free; every other difference costs extra, and the extra rises with each further difference.
- **Changing form takes time in proportion.** Growing from a finned young form into a legged adult, or from a worker into a queen, takes longer the more the two differ, and the animal is slow and exposed meanwhile.
- **A first species has one form.** Young forms and two sexes are forms, and so are castes.
- **The reason to have several** is that a body built for one job is cheaper and better at it: a guard that never forages, a forager that never fights, a breeder that is little more than an egg organ.
- **The price** is that specialists are helpless alone.

## 3. How a body is made

| Step | The player chooses | What it sets |
|---|---|---|
| Plan | Front-and-back, or no front | Whether there is a rear to attack and a direction to face |
| Shape | The outline: length, width, taper | Speed, turning, room for parts |
| Size | Overall scale | The tempo of its whole life (section 4) |
| Outside | Parts placed on the outline, each with a size handle | Senses, movement, feeding, weapons, grips, signals |
| Skin | What covers each side: smooth, bristled, slimy, spiked or shelled | What can bite it, cling to it and see it |
| Inside | How the interior is split | Gut, fat, muscle, lungs, brood |
| Look | Colour and pattern, free; camouflage for one kind of ground, costed | How it looks and how easily it is seen |

Breeding is set for the species, not the body: see `design/life-cycles.md`.

Since draft 3 these steps are written out as one sheet of 69 choices, in section 16. The sheet adds a step for looks, which this table lacked: a head, a tail, how the body is cut, a face and the style of each covering.

**What the body works out,** shown live beside a test tank as the player edits:

| Number | Comes from |
|---|---|
| Speed | Long bodies are fast and round ones slow; muscle adds; armour, fat and a full gut subtract; limbs decide how much applies on each kind of ground |
| Quickness | Small and short bodies start and turn fast |
| Hit points | Grow with weight, more slowly than weight |
| Appetite | Grows with weight, more slowly than weight; muscle and armour add |
| Bite | What it takes in one mouthful grows with the mouth, so a small animal leaves most of a plant |
| Reserve | Weight times how much of the inside is fat |
| Stamina | How much of the inside is lungs |
| Tempo | How soon it grows up, lays and dies: sooner the smaller it is |
| What it can bite | Anything its mouth can open around, and anything it is clinging to |

## 4. Size: fast lives and slow lives

The score is a species' living weight added up over the time it lasts. A swarm of small animals and a few large ones should both be worth playing, each in its own situations. Size therefore sets the tempo of a whole life: **small lives fast and large lives slow.**

| What size changes | Small | Large | Where it decides things | Status |
|---|---|---|---|---|
| Running cost | Burns more food for each unit of weight | Carries more weight on the same food | Steady, lean places favour large | In the stand-in |
| Tempo | Grows up, lays and hatches sooner, so many generations | Slow to breed and slow to replace losses | After a disaster, a bloom or a fire, small fills the gap first | Tested |
| Eating | Takes a small bite and leaves the rest of the plant | Finishes a plant in one bite and strips a patch quickly | Scattered scraps suit small; large needs big patches | Tested |
| Reserves | Starves soon without food | Sits out a famine or a winter on its stores | Long winters and failed seasons favour large | In the stand-in |
| Who hunts it | Not worth a big hunter's chase, but anything middling can eat it | Few things can take it, but each loss is a large share of the species | Big hunters about favours small; many small hunters favours large | Tested |
| Numbers | Many heads: some survive any disaster; more eyes and more scouts | Few heads: one bad day can end the species | Disaster-prone places, and food that is scattered | Tested |
| Hiding and fitting | Hidden by tall grass; fits crevices, burrows and thicket; carried by mud, lily pads and floating mats | Seen from afar, shut out of tight places, bogs down | Marsh, Woodland, Highlands, Tidal flats | Partly in the stand-in |
| Moving | Quick off the mark and turns on the spot; tires soon; swept along by currents | Slow to start and to turn; fast over distance; wades rivers | Chases in clutter favour small; open ground and crossings favour large | Turning is in the stand-in; the rest is proposed |
| Food | Needs rich food such as seeds, fruit, flowers and prey | Can live on poor, bulky food such as grass, reeds and weed, given a large gut | Bulk in the Grassland and Marsh favours large; scraps in the Woodland and Heath favour small | Proposed |
| Pushing | Gives way at a food patch to anything bigger; can mob, with many small bites | Pushes smaller animals off food and nests | Any shared patch | Proposed |
| Warmth | Chills quickly, so cold nights slow it unless it huddles or burrows | Holds its heat, and overheats when it sprints in a hot place | Highland nights; Heath and Dune days | Proposed |

**Tested in the balance lab,** with four sizes of the same grazer scored by weight over time. Differences under about 0.15 are noise.

| Situation | Small | Plain | Large | Largest |
|---|---|---|---|---|
| Steady habitat, hunters of mixed sizes | 1.3 to 1.5 | 1.6 to 1.7 | 2.0 to 2.4 | 2.0 to 2.8 |
| Steady habitat, large hunters only | 1.3 to 1.5 | 1.6 to 1.8 | 1.8 to 2.0 | 0.7 to 2.2 |
| Large hunters only, and a disaster four times a run that kills four in five | 1.1 to 1.3 | 1.1 to 1.3 | 0.8 to 1.4 | 0.4 to 1.3 |

- **Large wins where things are steady, and small catches up where they are not.**
- **The swarm is the steadiest design:** 1.1 to 1.5 everywhere, where the largest swings from 0.4 to 2.8.
- **Not enough yet.** Nothing makes small the best choice in a steady place. The rows on food, hiding, pushing and warmth are what would give it places of its own.

## 5. The inside

**The problem.** In every run of the balance lab one inside won everywhere: fat when the score counted heads, a large gut when it counted weight. Muscle and lungs were never chosen. The cause was that a large gut simply gave more energy from every plant, and nothing else could compete with that on scarce food.

**The rework.** Each organ answers a different problem, and none of them is plain efficiency.

| Organ | What it is for | Where it pays | What it costs |
|---|---|---|---|
| Gut | Using poor, bulky food: grass, reeds, weed, litter. A small gut can only live on rich food: seeds, fruit, flowers, meat, eggs | Wherever bulk is plentiful and rich food is not | Weight. A full gut slows the body, and a big meal takes time to digest with the head down |
| Fat | Reserves: lasting through a winter, a famine, a journey or a sleep. Bigger eggs | Seasons, bad years, migration | Slower and sooner tired. A fat animal is a better meal, and hunters can tell |
| Muscle | Speed off the mark, top speed, bite, carrying and digging | Chases, fights, hauling food home | Burns food even at rest |
| Lungs | How long it can sprint, how long it can stay under water, how soon it recovers | Long chases; diving | Room that could be something else |
| Brood | How many eggs, or how large; the breeder's egg organ | Any species that leans on numbers; queens | Room, and a slower body while carrying |

The change that matters is to the gut: it no longer multiplies what every plant is worth. It decides which foods a body can live on. A large-gutted grazer and a small-gutted seed-eater then stop competing, which is also what lets species share a habitat.

Untested. The lab's search is to be re-run on this in the balance pass.

## 6. Skin, armour and grips

Every covering sits on one side of the body or more: front, flanks, back. What covers a side decides what can bite it, what can cling to it, and what it costs.

| Skin | What it does | What it costs | What gets past it |
|---|---|---|---|
| Smooth | Nothing; the default | Nothing | Everything; suckers hold on it |
| Bristles or fur | Keeps warmth on cold nights | Hooks hold on it | Bites |
| Slime | Nothing can cling | Dries out away from water and in the heat | Bites |
| Spikes | Hurt whatever bites or clings there | Weight. Its own young cannot ride there, it cannot huddle for warmth, and its kin cannot carry it | A hunter that has learned, or can see, that it is spiked simply leaves it; a sting; an attack on an unspiked side |
| Shell | Stops bites on that side | Weight; bogs down in mud; shut out of crevices and burrows | A shell-cracking beak; a sting or a bite on an uncovered side; being carried off whole, if small |

**Shells, reworked.** The audit found a back shell close to total protection and a full shell pointless.

- **A shell covers the sides it is put on.** The head and limbs are out while the animal moves, eats or looks about, so the front is always open then.
- **Protection all round comes only from withdrawing,** which is the "hide" act. A withdrawn animal cannot move, eat or see. A full shell therefore buys safety with time, and a hunter that can wait, or crack, beats it.

**Spikes, reworked.** The lab found spikes in every winning design at first, because test hunters bit spiked prey until they died.

- **Spikes can be seen and learned.** "Spiked" is a thing another creature can notice, and a hunter with the Learn function avoids what hurt it. Against such hunters spikes are a deterrent, not a weapon.
- **Their real costs are social:** no riding young, no huddle, no being carried.

**Camouflage, reworked.** The audit found it nearly worthless.

- **It is matched to one kind of ground,** chosen in the designer: grass, reed, sand, rock, mud or leaf litter.
- **On that ground, still or creeping, it cannot be seen except from very close.** Anywhere else it does nothing.
- **It never hides from a nose, heat pits or a movement sense.**

**Other coverings and tricks:** false eyes, which make a stalker think it is being watched (tested); a tail or patch of skin that sheds; a cloud of ink or spray that works as cover. Warning colours and looking like another species remain deferred.

**Grips.** For anything that attaches to another creature or holds on to the world (`design/social.md`, section 11). No grip holds everywhere.

| Grip | Holds on | Fails on | Limit |
|---|---|---|---|
| Suckers | Smooth skin, shell, wet bodies, rock | Bristles and slime | Slow to attach |
| Hooks | Bristles and rough skin, stems | Shell and slime | Easily scraped off |
| Locking jaws | Anything soft | Shell; hurt by spikes | The mouth is busy, so it cannot bite again |

## 7. Weapons and what beats them

| Weapon | What it does | Its limit | What beats it |
|---|---|---|---|
| Jaws | Bite in the front arc. The gape sets the largest thing it can take | Must face the target | Speed, a shell, spikes |
| Locking jaws | Bite and hold on | One target at a time | Slime, shell, spikes, rolling |
| Long tongue | Strikes from a distance (tested) | A weak bite | Staying out of reach; a shell |
| Sting | Placed at the front or the rear. Built to wound, or to tire | Needs time to refill | A shell on that side |
| Shell-cracking beak | Ignores shells (tested) | Slow | Speed |
| Horns | Push others off food; tip over a shelled animal; contests among its own kind | Weight on the head | Staying behind it |
| Digging claws | Dig burrows and buried food; wound | Slower on open ground | |
| Spit, shock | Untested | | |

Two rules sit behind these:

- **An attached creature can wound a carrier of any size.** This is what lets a pack of small hunters take large prey, and it is why the defences against riders matter.
- **Effort has to cost a hunter.** In the stand-in, sprinting costs nothing but breath, so chasing beat ambush nine catches to five. Sprinting should burn food as well, so that waiting is a way of life.

## 8. Senses

| Organ | Gives | Blind to | Status |
|---|---|---|---|
| Eyes facing forward | Long reach in a narrow arc | Anything behind or to the side | Tested |
| Eyes on the sides | A wide arc, shorter reach | Far things | Tested |
| Eyes on stalks | All round, shortest reach | Far things | Tested |
| Larger eyes | More reach | Costs more | In the stand-in |
| Nose | Scent in the dark and through cover; tells upwind from downwind | Anything upwind of nothing; short reach | In the lab, as a food sense |
| Ears | Calls from all directions | Silent things | In the social checks |
| Skin and whiskers | Touch; warmth; wet and dry | Anything not close | Partly |
| Side line | Movement nearby, unseen (tested); the current in water | Still things | Tested |
| Heat pits | Warm bodies in the dark | Cold things; short reach | Untested |
| Voice and ears | A ping that shows what is near | It gives its own position away | Untested |
| Compass | North, south, east and west | Everything else | New; untested |

## 9. Limbs and movers

| Part | Good on | Poor on | Status |
|---|---|---|---|
| Legs | Land | Water | Tested |
| Long legs | Shallows and mud; wading | Thicket and burrows | Proposed |
| Wide feet | Sand and mud | Hard ground, slightly | Proposed |
| Fins | Water | Land | Tested |
| Paddles | Both, moderately | Neither well | Tested |
| Skirt of cilia | Silence: a movement sense cannot feel it | Speed | Tested |
| Tail fin | Short bursts in water | Stamina | Untested |
| Sucker foot | Holding on to rock or stem against a current | Speed | Untested |

## 10. Carrying, giving and signalling

| Part | What it does | Status |
|---|---|---|
| Pouch | Carries more food or seed; carries young | Untested |
| Brood organ | Sets how many eggs and how large; lets a breeder lay for life | Untested |
| Gland that gives | Makes food to give without first eating it: dew, or milk for the young | Untested |
| Voice | The range and number of calls | In the social checks |
| Scent glands | Marks, and how long they last | Untested |
| Glow | A display that works in the dark | Untested |
| Crest or sac | Puffing up to look bigger | In the stand-in |

## 11. What has been tested

**Parts, each against its nearest alternative** (`bodyaudit.js`). A part passes if it changes what happens and is the worse choice somewhere.

| Part | Result | Verdict |
|---|---|---|
| Eyes: forward, side or on stalks | As prey against a stalker, forward eyes were caught 34 times in 60, side and stalk eyes never. As a hunter, forward eyes caught 3.6 of 8, side 1.9, stalks 1.4 | Keep |
| Body shape | A long hunter caught 4.5 of 6 prey that run straight and 3.5 that swerve; a round one 1.4 and 3.2 | Keep |
| Back shell | Lost 0.1 of 6 against 6.0 with no shell | Reworked in section 6 |
| Full shell | No safer than a back shell, slower, and fed less | Reworked in section 6 |
| Shell-cracking beak | Shelled grazers lost 6.0 and 5.9 of 6 | Keep, as the counter |
| Spikes | Lost 2.4 of 6 against 6.0 | Reworked in section 6 |
| Legs, fins, paddles | Food in a pond with finned hunters: paddles lost 2.2 of 6 and ate 27 meals; legs 3.4 and 15; fins 5.9 and 9 | Keep |
| Skirt of cilia | Against hunters that feel movement, none lost against 5.1 on legs | Keep |
| Long tongue | A waiting hunter caught 4.6 of 10 faster prey with a tongue and none with jaws | Keep |
| Sting at the back | Fleeing prey lost 2.1 of 6 with a sting and 5.9 without | Keep |
| False eyes | A stalker caught 34 of 60 without them and none with | Keep; narrow |
| Body with no front | Five small attackers lost 4.1 of their number against 0.9 | Keep |
| Camouflage | Lost 5.0 of 6 against 5.8 without | Reworked in section 6 |

**Whole designs, searched** (`balancelab.js`; `design/plan.md`, section 3).

- **Size:** which size wins depends on how the score counts weight, and on the body rules in section 4.
- **The inside:** one inside won everywhere under every score. Reworked in section 5.
- **Never mattered in any habitat:** sting, camouflage, false eyes and egg size. The first two are reworked here; the others were tested against hunters that do not stalk.
- **Draft 1's table of eight builds in five worlds is withdrawn.** Its hunters starved a quarter of the way through each run.

## 12. Builds this should allow

A test of breadth. Each line is a distinct way to live, and the preset cast in `design/presets.md` is twenty of them.

- **Sprinter, tank, giant, stinger, ghost, lookout, tiptoe, mite:** the eight from draft 1.
- **Tongue ambusher:** camouflaged for one ground, still, strikes passing prey.
- **Urchin:** no front, spiked, slow, grazes in the open.
- **Shell-cracker:** a beak that makes armoured prey its speciality.
- **Bulk grazer:** large, with a large gut, living on what nothing small can use.
- **Swarm:** tiny, quick to breed, wins by numbers and recovers from anything.
- **Clinging pack:** small hunters with locking jaws that take prey many times their size.
- **Rider:** hooks or suckers; lives on a larger animal.
- **Slime body:** nothing can ride it; has to stay wet.
- **Carrier:** a pouch; the young ride until grown.
- **Night hunter:** no eyes, heat pits and a movement sense.
- **Tail-dropper:** leaves its tail with whatever grabs it.
- **Two-form species:** finned young in the water, legged adults on land.
- **Caste species:** a guard with a sting and no gut to speak of, a forager with a pouch, a breeder that is mostly brood organ.
- **Wintering sleeper:** fat, slow, and absent for a season.
- **Wader:** long legs and eyes on stalks, working the tide line.

## 13. Open, and not yet audited

- **Untested reworks:** the inside, shells, spikes that can be seen and learned, camouflage by ground, and effort that costs a hunter food.
- **Untested parts:** grips and the skins they fail on, heat pits, ping, compass, long legs, wide feet, tail fin, sucker foot, pouch, brood organ, a gland that gives, scent glands, glow, horns, digging claws, spit, shock, a tail that sheds, ink.
- **Two social checks wait on this:** a pack against large prey, and riders against a carrier (`design/social.md`, section 13).
- **Costs** are not set. They are for the balance pass.
- **Deferred:** warning colours, looking like another species, a body made of repeating segments, and feeding on light.

## 14. Next

Step 6: lifespan, the fading curve and what it acts on.

## 15. What the look asks of the body designer

Added 15 November 2026. The owner asked that the body designer let a player be as expressive as the creature kit in `design/mockups/paper-study.html`, which draws sixteen very different creatures. An independent reviewer compared those sixteen with the seven steps in section 3 (`design/reviews/round2-creature-designs.md`). Nothing in this section is decided.

**The finding.** As written, the designer can make four of the sixteen. Six more it can make in the rules but not in looks. Six it cannot make at all.

| | Creatures | What is missing |
|---|---|---|
| Can be made | Shelled, Two forms, Puffle, Swarm | Nothing |
| The rules allow it, the looks do not | Plain, Plated, Hunter, Swimmer, Hopper, Bolster | A head and its size and shape; a tail; a shell drawn as bands; fronds; legs that fold; cheeks; young that ride, which is the pouch |
| Cannot be made | Long, Ribbon, Stilt, Lugg, Bloom, Flit | Segments; a curve of the spine; moving without limbs; an eye set on top; a thing worn; arms and a face on a body with no front; wings |

**The largest gap is that the designer has no head.** Its shape is one outline, and nearly every drawing in the kit depends on a separate head and how large it is.

**Additions that change only the look.** These cost nothing in balance, and together they are most of the difference:

1. **A head:** its size and shape, or none.
2. **A tail:** its length and its tip.
3. **How the body is cut:** one piece, a number of rounds, or with holes.
4. **A curve of the spine, and a resting pose.**
5. **A face:** the style and number of eyes, lids, and a mouth; and parts allowed on top of the body, not only on its outline.
6. **A style for each covering:** a shell as a dome or as bands; bristles as a fringe or a ruff; gills as fronds.
7. **How many arms,** for the plan with no front.

**Additions that would have to mean something in the rules.** Each needs a decision:

| Addition | The cheapest meaning | What it touches |
|---|---|---|
| Wings | A new mover: short bursts over land, the twin of the tail fin in water | Section 9; no flight over water or cover unless decided |
| Moving without limbs | A body-wave mover; or count a frill as a fin | Section 9 |
| Arms | The skirt of cilia, drawn as arms; or a grip, if they hold | Sections 6 and 9 |
| A thing worn | How camouflage for one kind of ground is drawn; or found things become objects in the world | Sections 3 and 6 |
| A club of a tail | A weapon at the rear, like a sting that wounds | Section 7 |
| Segments | Already deferred in section 13: "a body made of repeating segments" | Section 13 |

**Two rules the kit already keeps, which the designer should keep too:** the player picks hues and the kit sets the steps of lightness between touching parts; and eyes are placed by ratio and pulled inside the outline, whatever the head.

**The owner's answer, 16 November: it cuts both ways.** The look has to be able to show every body part that is designed, and the parts and choices have to be shown clearly and be flexible enough to make creatures that look far beyond the presets. This is now design area 13 in `design/plan.md`, the species sheet, which sets out the rules of fit, the checks, and a proposed answer to each question below. The questions stay open until that area is worked.

**Questions for the owner:**

1. Should the seven look-only choices go into the designer as a step of their own, after Shape?
2. Which of the six in the second table should mean something, and which should be left out of the first version?
3. Should segments come back from the deferred list, since two of the most liked creatures depend on them?

**Working answers, 16 November.** The owner said the plan looked good and to proceed, so the proposals in `design/plan.md` stand as working answers until the owner says otherwise. They are built into the sheet in section 16.

1. Yes. The look-only choices are on the sheet as a kind of their own, free, and the designer shows them in groups after the ones that cost.
2. Wings are a mover for short bursts over land. A body wave is a mover, slow on open ground and quick in water and reeds. Arms are a grip. A club is a weapon at the rear. A thing worn is how camouflage for one kind of ground is drawn. Found objects wait for a later version.
3. Yes, as a look. Rounds are how a body is cut and cost nothing; length is what means something. A body that moves by a wave is always cut in rounds.

Each of the new parts still has to be shown to matter, in the mechanics pass.

## 16. The species sheet

Added 16 November 2026. Design area 13 in `design/plan.md`. The sheet is `design/sheet/sheet.js`. The balance lab reads it for what a body can be given, the paper kit draws a creature from it, and the body designer in `design/mockups/body-designer.html` writes it. The page is built by `node design/sheet/make.js` from the sheet, a template and the kit, so none of the three is kept twice.

**Three kinds of line.** Forty-one choices mean something in play and cost budget. Twenty-eight change only the look and are free. What is never chosen is worked out when the sheet is turned into a drawing: how light each part is against its neighbours, where the eyes sit, shadows, gait, and where limbs attach.

### Choices that mean something

Each has to be seen, so each names how. "In the lab" says whether the stand-in world models it yet; the twenty-five that it does not are the first work of the mechanics pass.

| Choice | Options | What it does | How it is seen | In the lab |
|---|---|---|---|---|
| Plan | front and back, no front | Whether there is a rear to attack and a way to face | A body with a head end, or a bell with arms all round | No |
| Length | a slider | Long bodies are fast and turn slowly | The length of the outline | Yes |
| Width | a slider | Room inside for organs; a wide body is slow | The width of the outline | Yes |
| Taper | a slider | Where the weight sits: a heavy front turns slowly, a heavy rear starts slowly | Which end of the outline is wider | No |
| Size | a slider | The tempo of its whole life: small lives fast, large lives slow | How big it is beside others | Yes |
| Gut | a slider | Lets it live on poor, bulky food | A wide middle | Yes |
| Fat | a slider | Reserves for a winter, a famine or a sleep | Plump all over, with blunt ends | Yes |
| Muscle | a slider | Speed off the mark, bite, carrying and digging | Wide shoulders and haunches | Yes |
| Lungs | a slider | How long it can sprint or stay under water | A deep chest | Yes |
| Brood | a slider | How many eggs, or how large | Wide hips | No |
| Skin on its front | smooth, bristles, slime, spikes, shell | What can bite or cling to its front | A ruff, a slick, a brow of spikes or a hood over the head | No |
| Skin on its sides | smooth, bristles, slime, spikes, shell | What can bite or cling to its sides | A fringed outline, a slick, spines standing out sideways or a rim of shell | No |
| Skin on its back | smooth, bristles, slime, spikes, shell | What can bite or cling to its back | A pelt, a slick, a row of spikes or a shell | Yes |
| Camouflage | none, grass, reed, sand, rock, mud, leaf litter | On that one ground, still or creeping, it cannot be seen except from very close | It wears a piece of that ground on its back | Yes |
| False eyes | has it or not | A stalker thinks it is being watched | Two eye spots on its rear | Yes |
| A tail that sheds | has it or not | Leaves its tail with whatever grabs it | A bright tail with a ring where it breaks | No |
| Ink | has it or not | A cloud that works as cover | A short nozzle at its rear | No |
| Eyes | none, facing forward, on the sides, on stalks | Forward: far and narrow. Side: wide and shorter. Stalks: all round and shortest | Close together at the front, far apart at the sides, or out on stalks | Yes |
| Eye size | a slider | Larger eyes see farther and cost more | The size of the eyes | Yes |
| Nose | has it or not | Scent in the dark and through cover | A dark nose on a pale muzzle | Yes |
| Ears | has it or not | Hears calls from all directions | Ears | No |
| Touch | has it or not | Touch, warmth, wet and dry, close by | Feelers or barbels at its front | No |
| Side line | has it or not | Feels movement nearby without seeing it | A row of dots along each flank | Yes |
| Heat pits | has it or not | Warm bodies in the dark | Two warm-coloured pits ahead of its eyes | No |
| Echo | has it or not | A call that shows what is near, and gives its own place away | Two great dishes for ears | No |
| Compass | has it or not | Knows north from south | One bright lozenge on the crown of its head | No |
| Moves on | legs, stilts, webbed feet, fins, paddles, a skirt of cilia, one broad foot, body waves | What ground it is good on | Paws, stilts, webbed feet, fins, paddles, a skirt of fringe, one broad foot, or a body that goes in waves | Yes |
| Tail fin | has it or not | Short bursts in water | A fan of a tail | No |
| Wings | has it or not | Short bursts over land. Proposed in area 13 | Two pairs of wings | No |
| Mouth | plain, jaws, locking jaws, tongue, beak | Jaws bite what they can open round; locking jaws hold on; a tongue strikes from a distance; a beak cracks shells | Tusks, crossed pincers, a coiled tongue or a hard beak | No |
| Sting | none, front, rear | Wounds or tires, and needs time to refill | A lance at its front, or a barb on its tail | Yes |
| Horns | has it or not | Pushes others off food and tips over a shelled animal | Horns | No |
| Digging claws | has it or not | Digs burrows and buried food, and wounds | Long pale claws on its fore feet | No |
| Club tail | has it or not | A weapon at the rear. Proposed in area 13 | A tail that ends in a club | No |
| Grip | none, suckers, hooks, arms | Holds on to another creature or to the world. Suckers hold smooth and wet; hooks hold bristles and stems; arms hold what they are put round | Fore limbs that end in round pads, in hooks, or plain arms | No |
| Pouch | has it or not | Carries more food or seed, and carries young | A pocket on its back | No |
| Gland that gives | has it or not | Makes food to give: dew, or milk for the young | Pale beads along its back | No |
| Voice | a slider | The range and number of its calls | Two pale sacs at its throat, once it is more than a small voice | No |
| Scent glands | has it or not | Marks, and how long they last | Two ochre glands at its hips | No |
| Glow | has it or not | A display that works in the dark | A pale lantern on a stalk | No |
| Crest | has it or not | Puffs up to look bigger | A crest | No |

The five organs are shares of one inside. An even split leaves the outline alone; a large share swells its part of the body and a small one pinches it.

### Looks

| Choice | Options | What it changes |
|---|---|---|
| Head | round, wedge, spade, none, a face on the body | The shape of the head, or a face set on the body itself |
| Head size | a slider | How big the head is for the body |
| Face length | a slider | A short face or a long one |
| Blunt ends | a slider | Pointed ends or blunt ones |
| Cut in rounds | a slider | One piece, or a row of rounds |
| Curve | a slider | A body in rounds held straight or in an S |
| Arms | a slider | How many arms a body with no front has |
| Pairs of limbs | a slider | How many pairs of limbs |
| Limb length | a slider | Short limbs or long ones |
| Legs as | paws, pillars, hopper | Legs as paws, as round feet, or with the hind pair folded to hop |
| Toes | cream, accent | The colour of its toes |
| Tail | none, tuft, whip, stub, fork, knob | The tail, where no part has already decided it |
| Tail length | a slider | How long the tail is |
| Eye style | plain, ring, dome, one | Plain eyes, eyes in pale rings, eyes in domes, or one great eye |
| Eye colour | dark, accent | Dark eyes, or eyes in its bright paper |
| Lids | a slider | Wide eyes or sleepy lids |
| Mouth as | muzzle, smile, line, dot, none | The mouth, where no weapon has already decided it |
| Jaws as | tusks, fang | Jaws as two tusks or as one fang |
| Cheeks | a slider | How rosy its cheeks are |
| Ears as | round, point | Round ears or pointed ones |
| Touch as | feelers, barbels | Feelers on the head or barbels at the mouth |
| Ornament | none, fronds, frill | Fronds behind the head, or a frill down the spine of a body in rounds |
| Bristles as | pelt, fringe | Bristles on the back as a pelt or as rings of soft fringe |
| Shell as | dome, bands | A shell as one dome or as overlapping bands |
| Pattern | none, saddle, bib, bands, spots, mask | A patch on the back, a paler front, bands, spots or a mask over the eyes |
| Main paper | 24 papers | Its main paper. The kit sets how light each part is |
| Second paper | 24 papers | The paper for its shell, bands and coverings |
| Bright paper | 24 papers | Its bright paper, for tips, spots and signals |

**A look never stands in for a part.** Ears are drawn only on a body that hears, a muzzle with a nose only on one that smells, horns only on one that has them. Where a weapon, a sense or a mover has decided a piece of the body, the look for that piece is not offered: a club decides the tail, a beak decides the mouth. The designer shows such choices as not in use and says why.

### What the checks found

Run with `node design/checks/sheetaudit.js`, which draws sheets in the designer page.

| Check | Result on 16 November |
|---|---|
| Cover, both ways | Passes. The sheet names 99 entries in the kit, the kit has 99, and none is left over on either side. To get there the kit gained about thirty entries, and four entries the kit had with no meaning became choices of looks: folded legs, round feet, rings of fringe and a frill |
| The presets fit | Passes. The study's sixteen creatures, a helper form, and the twenty preset species of `design/presets.md` are each written as the plain sheet and its differences, and each draws |
| Seen | Passes, after a first run in which 18 of 69 options changed fewer than 14 pixels of a creature a centimetre long. Slime, bristles, back spikes, heat pits, a pouch, grips, a tail that sheds, ink, a compass and a front sting were redrawn |
| Any combination | Passes. Two hundred sheets made by chance, half of them pushed to the ends of every range, were drawn 4,800 times: standing, in mid-step, and in each of the twelve states and eight bearings. None threw an error, drew nothing or ran off its picture. Every body is measured before it is drawn so that it fits |
| Variety | Measured: of a hundred budgeted random outlines a centimetre long, the nearest other differs in 28% of its area at the median and none has a near twin. An independent reviewer's judgement is in `design/reviews/` |
| A person | Not done. It needs someone who has not seen the designer |

**What the checks cannot see.** Whether a part is where it should be, whether two parts lie across each other badly, and whether the whole is appealing. Those are for the reviewers and for the owner.

### Known limits

- **A body with no front uses fewer choices.** Fourteen of the forty-one do nothing on it, among them every mover, the tail, grips and the sting, because it has no ends and its arms are its limbs. Either that plan is given its own drawing for each, or it is offered as a simpler body. Not decided.
- **Forms.** A form is a second sheet that differs from the base, and the sheet can price the difference. The designer does not edit a second form yet.
- **Costs are placeholders.** They exist so the designer can show a budget.
- **Left off the sheet on purpose:** spit and shock, which are untested and undefined; warning colours and looking like another species, which are deferred.
