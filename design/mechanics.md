# The mechanics pass

Record of the pass set out in `design/plan.md` section 3: does every part matter, and can what the design promises be programmed. It runs on the rig (`design/checks/rig.js`), a stand-in for the simulation, and sets no costs and tunes no numbers. A part passes when there is one setting in which it is the right choice.

Status on 16 November 2026: bodies done. Brains and the promised behaviours follow.

## 1. Bodies: every choice on the species sheet that means something

Run with `node design/checks/mechaudit.js body`. The tests are in `design/checks/mech/body.js`. Each test runs one design three ways on ten or more maps: with the part, without it, and with its nearest neighbour in its place. It counts something a player watching could count.

| Question | Passes when |
|---|---|
| It changes something | With and without differ on at least one map |
| It is worth choosing somewhere | With it does better than without, by more than twice the map-to-map error of the difference |
| It is not another part under a second name | With it differs from its nearest neighbour by the same margin, in the same setting or in a second one named in the table |
| Its effect can be seen | The count is one a watcher could make, and the last column says what they would see |

**Result: 73 of 73 tests pass, covering all 41 choices.** Where a choice has options that do different things, each option has its own test.

| Choice | Setting | With it against without | Told from its neighbour | What a watcher sees |
|---|---|---|---|---|
| Plan: no front | A hunter comes from any side at an animal that stands its ground, with shell on its sides only | 77 against 42 beats lived of 400 | false eyes: 42 in the same setting | Every bite on the body with no front lands on shell; the one with a front is bitten on its bare face or back |
| Length: long | A hunter of middling speed in open country | 571 against 533 beats lived of 600 | a narrow body: 2562 against 1624 beats lived of 4000, where with no food at all, the long body has more inside it and starves later than the narrow one. For speed the two are one thing: it is the ratio of length to width that counts | The long body keeps ahead; the short one is run down |
| Width: wide | No food at all | 2247 against 1624 beats lived of 4000 | fat: 527 against 423 beats lived of 600, where chased by a hunter, the fat body is slower than the wide one | The wide body, with more room inside, starves later |
| Taper: heavy at the front | A hunter works at an animal in a shell that stands its ground | 71 against 86 beats a shelled animal lasts, of 400 | muscle: 1.4 against 2.2 kills of jinking prey, of 5, where after prey that jinks, the muscled hunter turns with it and the front-heavy one runs wide | With its weight behind its jaws it breaks in sooner |
| Taper: heavy at the rear | A hunter of middling speed in open country | 600 against 567 beats lived of 600 | a long body: 2151 against 2562 beats lived of 4000, where with no food at all, the long body has more inside it and outlasts the one that is only heavy behind | Slow to get going, then it draws away |
| Size: small | Plenty of food and no enemies | 46.1 against 12.4 young and eggs after 900 beats | brood: 20.4 in the same setting | The small species is on its second generation while the large one is still growing up |
| Size: large | A hunter that takes what is smaller than itself | 600 against 460 beats lived of 600 | spikes on the back: 441 in the same setting | The hunter passes the large one by |
| Gut | Only coarse, bulky food | 22.5 against 0 bites eaten in 500 beats | fat: 0 in the same setting | The one with a big gut grazes; the other walks over the same food and starves |
| Fat | A feast and then nothing | 5000 against 2464 beats lived of 5000 | gut: 2470 in the same setting | The fat one is still walking long after the lean one has died |
| Muscle | A hunter and five prey in open country, for a short while | 0.9 against 0 kills of 5 in 250 beats | lungs: 0 in the same setting | The muscled hunter closes the gap and kills in fewer bites |
| Lungs | A hunter no faster than its prey, which does not give up | 894 against 745 beats lived of 900 | muscle: 513 in the same setting | Both sprint; the one with small lungs is the first to slow to a walk, and that is when it is caught |
| Brood | Plenty of food and no enemies | 43.2 against 4 young and eggs after 900 beats | fat: 0 in the same setting | Bigger clutches |
| Skin on its front: shell | A hunter comes at its front | 57 against 27 beats lived of 400 | shell on another side: 27 in the same setting | Bite after bite lands on shell and does little |
| Skin on its front: spikes | A hunter that backs off when hurt comes at its front | 373 against 27 beats lived of 400 | bristles there: 32 in the same setting | The hunter bites once, flinches and leaves it alone |
| Skin on its front: bristles | Two small riders with suckers come at its front to cling on and feed | 400 against 53 beats lived of 400 | shell there: 53 in the same setting | Suckers find nothing flat to hold on bristle; on bare skin or shell they stick and feed |
| Skin on its front: slime | Two small riders with hooks come at its front to cling on and feed | 400 against 54.7 beats lived of 400 | bristles there: 53 in the same setting | They slide off and cannot get a hold; on bristle they hook on and eat it alive |
| Skin on its sides: shell | A hunter comes at its sides | 57 against 27 beats lived of 400 | shell on another side: 27 in the same setting | Bite after bite lands on shell and does little |
| Skin on its sides: spikes | A hunter that backs off when hurt comes at its sides | 373 against 27 beats lived of 400 | bristles there: 32 in the same setting | The hunter bites once, flinches and leaves it alone |
| Skin on its sides: bristles | Two small riders with suckers come at its sides to cling on and feed | 400 against 53 beats lived of 400 | shell there: 53 in the same setting | Suckers find nothing flat to hold on bristle; on bare skin or shell they stick and feed |
| Skin on its sides: slime | Two small riders with hooks come at its sides to cling on and feed | 400 against 54.7 beats lived of 400 | bristles there: 53 in the same setting | They slide off and cannot get a hold; on bristle they hook on and eat it alive |
| Skin on its back: shell | A hunter comes at its back | 57 against 27 beats lived of 400 | shell on another side: 27 in the same setting | Bite after bite lands on shell and does little |
| Skin on its back: spikes | A hunter that backs off when hurt comes at its back | 373 against 27 beats lived of 400 | bristles there: 32 in the same setting | The hunter bites once, flinches and leaves it alone |
| Skin on its back: bristles | Two small riders with suckers come at its back to cling on and feed | 400 against 53 beats lived of 400 | shell there: 128 in the same setting | Suckers find nothing flat to hold on bristle; on bare skin or shell they stick and feed |
| Skin on its back: slime | Two small riders with hooks come at its back to cling on and feed | 400 against 54.7 beats lived of 400 | bristles there: 78 in the same setting | They slide off and cannot get a hold; on bristle they hook on and eat it alive |
| Skin on its back: bristles, for warmth | A night of hard frost that does not end, with food about | 3000 against 562 beats lived of 3000 | fat: 562 in the same setting | The bristled one keeps feeding; the bare one slows, stops and dies of cold |
| Camouflage: grass | A hunter that hunts by eye, on open grass, and prey that freezes when it sees it | 640 against 216 beats lived of 700 | the wrong camouflage: 216 in the same setting | The hunter walks past the one that matches the ground and finds the others |
| Camouflage: reed | A hunter that hunts by eye, on thicket, and prey that freezes when it sees it | 687 against 427 beats lived of 700 | the wrong camouflage: 427 in the same setting | The hunter walks past the one that matches the ground and finds the others |
| Camouflage: sand | A hunter that hunts by eye, on sand, and prey that freezes when it sees it | 684 against 268 beats lived of 700 | the wrong camouflage: 268 in the same setting | The hunter walks past the one that matches the ground and finds the others |
| Camouflage: rock | A hunter that hunts by eye, on rock, and prey that freezes when it sees it | 640 against 216 beats lived of 700 | the wrong camouflage: 216 in the same setting | The hunter walks past the one that matches the ground and finds the others |
| Camouflage: mud | A hunter that hunts by eye, on mud, and prey that freezes when it sees it | 685 against 315 beats lived of 700 | the wrong camouflage: 315 in the same setting | The hunter walks past the one that matches the ground and finds the others |
| Camouflage: litter | A hunter that hunts by eye, on scrub, and prey that freezes when it sees it | 640 against 216 beats lived of 700 | the wrong camouflage: 216 in the same setting | The hunter walks past the one that matches the ground and finds the others |
| False eyes | A stalker that only goes for what is facing away from it | 700 against 649 beats lived of 700 | no front: 558 against 343 beats lived of 600, where chased by a hunter that does not care, the body with false eyes can run and the body with no front cannot | The stalker comes up behind, meets two eyes, and turns away |
| A tail that sheds | A hunter with locking jaws | 475 against 410 beats lived of 500 | ink: 427 in the same setting | It is seized, drops its tail, and the hunter is left holding the tail |
| Ink | A hunter a little faster than its prey | 480 against 423 beats lived of 600 | a tail that sheds: 423 in the same setting | A cloud goes up between them, the hunter loses sight of it and casts about |
| Eyes: facing forward | A hunter, and six prey that graze with their heads down and do not look up | 1.8 against 0.2 kills of 6 in 700 beats | eyes on the sides: 1.1 in the same setting | It picks out prey from twice as far off and goes straight for it |
| Eyes: on the sides | A hunter comes from behind and to one side | 538 against 163 beats lived of 600 | eyes facing forward: 166 in the same setting | It sees the hunter without turning its head, and is gone |
| Eyes: on stalks | A hunter comes from straight behind, where eyes on the sides of a head cannot see | 600 against 479 beats lived of 600 | false eyes: 479 in the same setting | It sees all round, and runs while the hunter is still far off |
| Eye size: large | A hunter of middling speed in open country | 600 against 551 beats lived of 600 | eyes facing forward: 396 in the same setting | It sees the hunter sooner and has a longer start |
| Nose | A dark night, with food scattered about | 22.7 against 5.4 bites eaten in 500 beats | large eyes: 6 in the same setting | It walks straight to food it cannot see |
| Touch | A dark night, with food thick on the ground | 34.4 against 20 bites eaten in 500 beats | a nose: 54.7 in the same setting | It feels its way from one piece to the next |
| Ears | A hunter comes up from behind. A big animal of another kind, which it passes on the way, calls when it sees one | 575 against 536 beats lived of 600 | a side line: 536 in the same setting | The ones with ears run at the call, long before they could see anything; the others never look round |
| Side line | A dark night, and a hunter that finds warm bodies | 600 against 392 beats lived of 600 | ears: 392 in the same setting | It feels the rush coming through the dark and bolts |
| Heat pits | A dark night | 2.8 against 0.6 kills of 5 in 600 beats | a nose: 1.3 against 0 kills of 5 that feel it coming, where prey that feels the rush coming and runs: heat pits follow it at a sprint, and a nose smells nothing at a sprint | It turns toward warm bodies it cannot see and runs them down |
| Echo | A dark night | 4.6 against 0.6 kills of 5 in 600 beats | heat pits: 0.6 against 2.8 kills of 5 that have ears, where prey with ears hear the call and are gone before it arrives; heat pits make no sound | It calls, and for a moment knows where everything near it is |
| Compass | The only food is far to the north, out of sight and out of smell | 32.1 against 0 bites eaten in 1500 beats | large eyes: 0 in the same setting | It sets off north across empty ground and arrives; the other wanders where it is |
| Moves on: legs | A hunter on bare rock | 558 against 367 beats lived of 600 | paddles: 442 in the same setting | Legs grip the rock and it keeps its lead |
| Moves on: stilts | A hunter in the shallows | 600 against 474 beats lived of 600 | webbed feet: 534 in the same setting | It wades at a run while the hunter flounders |
| Moves on: webbed feet | A hunter on sand | 600 against 516 beats lived of 600 | stilts: 544 in the same setting | It runs on top of the sand and the hunter sinks in |
| Moves on: fins | A hunter that swims, in deep water | 600 against 123 beats lived of 600 | paddles: 479 in the same setting | It swims away from it; anything with legs out here tires and goes under |
| Moves on: paddles | Half the food is out in a pond and half is on the land round it | 30 against 9 bites eaten in 700 beats | fins: 27 in the same setting | It feeds in the water, walks out and feeds on land; legs tire and go under in the pond, and fins are stranded on the bank |
| Moves on: a skirt of cilia | A dark night, and a hunter that feels for movement | 587 against 415 beats lived of 600 | one broad foot: 428 in the same setting | It glides past without a sound and the hunter never turns |
| Moves on: one broad foot | Food on the bed of a fast stream | 28.7 against 3.3 bites eaten in 500 beats | a skirt of cilia: 3.6 in the same setting | It holds to the bed and feeds while the current carries the others off |
| Moves on: body waves | A hunter that swims, in deep water | 600 against 123 beats lived of 600 | fins: 20.6 against 7.2 bites eaten in a thicket, where out of the water, in a thicket, the body that moves in waves slips through to food and fins barely move | It swims well enough to keep ahead for a long while |
| Tail fin | A fast hunter with fins, in deep water | 509 against 444 beats lived of 600 | wings: 444 in the same setting | A flick of the tail and it shoots clear |
| Wings | A fast hunter in open country | 540 against 460 beats lived of 600 | a tail fin: 460 in the same setting | It takes off in a skimming burst and leaves the hunter behind |
| Mouth: jaws | A slow hunter among fast prey that bolt at the first bite, so that every meeting is one bite | 5.4 against 1.9 kills of 6 in 800 beats | a tongue: 4.8 in the same setting | Two meetings and the prey is dead; a plain mouth needs four and rarely gets them |
| Mouth: locking jaws | Fast prey that bolts at the first bite | 3.9 against 0.7 kills of 5 in 600 beats | jaws: 2.3 in the same setting | It is carried off hanging on, still biting, where plain jaws are left behind after one bite |
| Mouth: tongue | A slow hunter, and prey that keeps just out of its reach | 4.8 against 0.1 kills of 5 in 600 beats | jaws: 0.3 in the same setting | The tongue flicks out across the gap |
| Mouth: beak | Only hard-shelled food | 20.3 against 0 bites eaten in 500 beats | jaws: 0 in the same setting | It cracks them; the others turn them over and give up |
| Sting: rear | A hunter of middling speed runs it down from behind | 539 against 423 beats lived of 600 | a club tail: 422 in the same setting | It is caught, stings, and the hunter can only crawl after it |
| Sting: front | Fast prey that bolts at the first touch | 3.8 against 2.3 kills of 5 in 600 beats | locking jaws: 3.3 against 1.3 kills of 5 slimy prey, where on prey covered in slime the jaws cannot lock and the sting still goes in | One sting and the prey can only crawl; it is caught again at a walk |
| Horns | Two animals of a size at one small pile of food; the rival is in a shell and cannot be bitten away | 9 against 3.4 bites eaten of about 12 | a beak: 222 against 41 beats a shelled animal lasts, of 400, where against an animal in a shell: horns tip it over to get at its belly, and a beak goes through the shell | The horned one shoves its rival off the pile, tips it on its back, and eats |
| Digging claws | All the food is buried | 33.4 against 0.6 bites eaten in 500 beats | muscle: 0.3 in the same setting | It smells food, digs and eats; the other scrabbles and mostly goes without |
| Club tail | A hunter that backs off when hurt runs it down from behind | 600 against 422 beats lived of 600 | a sting at the rear: 422 in the same setting | The club swings back, the hunter is knocked away and thinks better of it |
| Grip: suckers | A small animal that feeds on a host in a shell, which runs when bitten | 48 against 0 bites it gets in 500 beats | hooks: 0 in the same setting | It takes hold, is carried along, and feeds as it rides |
| Grip: hooks | A small animal that feeds on a host covered in bristles, which runs when bitten | 10 against 0 bites it gets in 500 beats | suckers: 0 in the same setting | It takes hold, is carried along, and feeds as it rides |
| Grip: arms | Food lying about, and a larder to fill | 7.8 against 4 pieces in the larder after 600 beats | a pouch: 9.6 in the same setting | It carries two at a time |
| Pouch | Food lying about, and a larder to fill | 9.6 against 4 pieces in the larder after 600 beats | arms: 7.8 in the same setting | It fills its pouch before it turns for home |
| Gland that gives | Six newborn that cannot feed themselves, and one parent | 4.3 against 1.9 young alive after 3000 beats, of 6 | a pouch: 1.9 in the same setting | It feeds them from itself and they live; without the gland it has too little to give and they starve one by one |
| Voice: loud | A hunter comes up behind its kin, who are a long way off. It sees the hunter and calls | 587 against 547 beats its kin live, of 600 | scent glands: 547 in the same setting | They hear it from far off and run |
| Scent glands | One of its kind walks to distant food, marking as it goes. Another comes to the start of the trail much later | 34.4 against 0 bites eaten by one that follows the trail later | a loud voice: 0 in the same setting | The trail is still there to follow, long after the marker has gone |
| Glow | A night that does not end | 28.1 against 0.3 young and eggs after 900 beats | large eyes: 3.7 in the same setting | They find each other by their lights and breed; the dark ones pass within a few steps and never meet |
| Crest | A hunter that takes what is smaller than itself | 499 against 350 beats lived of 600 | false eyes: 350 in the same setting | It stands, puffs up to half as big again, and the hunter thinks better of it |

### What the tests found, and what was changed

None of these was visible until a part was tested alone. Each change is to the stand-in's rules, and each has to be carried into `design/body.md` and the real simulation.

| Finding | What was done |
|---|---|
| **Taper only ever cost.** A heavy front turned slowly, a heavy rear started slowly, and a body with neither was best at both | Each end now gains something: a heavy front puts weight behind the bite, a heavy rear runs faster. The sheet's wording says so |
| **The brood organ did nothing.** Clutches were limited by food, never by the organ | A large brood organ makes each egg from less food as well as laying more at a time |
| **Length and narrowness are one thing for speed.** It is the ratio of length to width that counts | Kept, and said plainly. They differ in what the body holds: a long body has more inside it than a narrow one |
| **A body with no front was too slow for that to matter** when it fled | Its test is standing its ground: with skin on its sides only, every bite lands on that skin |
| **Bristles did almost nothing to a bite** | A mouthful of bristle makes the biter slow to bite again. Their other uses stand: warmth, and suckers cannot hold them |
| **Slime on one side did not stop a rider,** which walked through its host and clung on elsewhere | Bodies no longer pass through bigger bodies, so the side that is approached is the side that counts. Locking jaws now slip off slime nearly every time |
| **A tail that sheds bought a few beats.** The hunter let go and seized it again at once | Whatever held the tail is left busy with it for a while, and eats it |
| **Ink hid nothing** once its owner left the cloud | A cloud hides what is behind it as well as what is in it |
| **Eyes facing forward found no more prey than eyes on the sides.** Far and narrow covered the same ground as near and wide | They see farther than before: 1.6 times, not 1.35 |
| **A plain mouth killed as often as jaws** when the hunter was faster than its prey | No rule changed. Jaws pay where every meeting is one bite: two meetings kill, where a plain mouth needs four |
| **Whiskers lengthened the reach of a bite** | They feel farther but do not bite farther |
| **A gland gave little more than a shared meal** | With a gland, giving costs the giver half as much and feeds the other more |
| **Puffing up, crouching and playing dead were never seen.** A pose was cleared before anyone else could look | A pose lasts until its owner next acts |
| **One act that could not be done blocked every other.** A sting still refilling used up the beat, so its owner never bit | What cannot be done this beat does not use the beat up |
| **A hunter overshot prey that stood still,** walked through it and lost sight of it | Approach stops on arrival, and a body turns to what it acts on |
| **Prey stopped running as soon as the hunter was behind it,** in the gap its eyes cannot see | The stock prey used in tests has a fear that lasts, and wandering carries on from the way a body is already going. This is a recipe, not a rule: a brain without it is caught, which is how it should be |
| **Hatchlings started with more than their egg cost** | A young one starts with what its egg held |

### What the tests do not show

- That anything is balanced. A part can pass and be far too strong.
- That the settings are common. Some are narrow: a compass pays when the only food is out of sight to the north.
- The organs by name. A watcher sees a body that starves later or sprints longer, not the organ.

## 2. Brains: every word of the vocabulary

Not yet run. The rig has a rule for each of the 350 words (`node design/checks/mechaudit.js handles`).

## 3. The promised behaviours

Not yet run.
