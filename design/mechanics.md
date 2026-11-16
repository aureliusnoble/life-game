# The mechanics pass

Record of the pass set out in `design/plan.md` section 3: does every part matter, and can what the design promises be programmed. It runs on the rig (`design/checks/rig.js`), a stand-in for the simulation, and sets no costs and tunes no numbers. A part passes when there is one setting in which it is the right choice.

Status on 16 November 2026: bodies done; 350 of the 350 words of a brain done; the promised behaviours not yet begun.

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

Status on 16 November: 350 of the 350 words are done. Every word has now been through its tests. Four findings are open and wait for step 3.4: tight and medium wandering, pointing, one breeder with helpers, and mating each time.

### 2a. The words a brain notices with

Run with `node design/checks/mechaudit.js words`; the scenes are in `design/checks/mech/words.js`. For each family there is one small scene for each word, built so that the word should be true in it. Every word of the family is asked in every scene. A word passes when it is true in its own scene and its row of answers differs from every other word's row. Words that point (directions, which one) are checked by where they point, and moments by making them happen.

**Result: 243 of 243 words in 47 families are told apart from their neighbours.** That count includes whose a mark is (four words) and the six rules for what attention costs. This answers two of the four questions for these words: each changes something, and none is another under a second name. Whether each family pays in play is shown by the acts that use them, below and in section 3.

What it found, each now with its own rule:

| Finding | What was done |
|---|---|
| **A stranger and one of another home were the same thing** | A stranger is neither family nor of my home. One of another home may still be family |
| **Everyone was family** when no family had been set | Family needs a family to belong to |
| **Low water and the tide being out were the same thing** | Low water is a river or a pool in a dry spell, and has nothing to do with the tide |
| **A remembered place and the way toward it were the same thing** | The place itself is noticed from within reach. The way toward it is known from anywhere |
| **Fighting was never true on the first beat** of a world | A slip in the rule, put right |

### 2b. The words a brain acts with

Run with `node design/checks/mechaudit.js acts`; the tests are in `design/checks/mech/acts.js`. They are the same four questions as for bodies: one brain with the word, without it, and with its nearest neighbour in its place.

**Result: 55 of 57 pass.** The two that fail are one finding: see the table after this one.

| Word | Verdict | Setting | With it against without | Told from its neighbour | What a watcher sees |
|---|---|---|---|---|---|
| approach | Passes | Food it can smell | 20.1 against 2.7 bites eaten in 400 beats | stay near: 3.6 in the same setting | It walks up to the food and eats; told only to stay near, it stops short and never touches it |
| move away | Passes | A hunter in open country | 558 against 287 beats lived of 600 | keep apart: 0 against 42 bites eaten beside a big animal that only bites what touches it | It runs and keeps running |
| keep apart | Passes | A hunter that rushes anything it sees within its short sight | 600 against 465 beats lived of 600 | move away: 42 against 0 bites eaten beside a big harmless animal | It keeps its distance, and the hunter never sees it |
| stay near | Passes | A parent that walks steadily on | 365 against 92.9 beats within 40 of its parent, of 400 | approach: 30.2 against 9.1 mean distance from its parent | It trails after its parent at a little distance |
| go the same way | Passes | A leader that walks steadily on | 400 against 92.9 beats within 40 of its leader, of 400 | head off: 11.8 against 1.3 mean distance from a leader that stands still, facing east | It turns to the leader's heading and travels beside it |
| head off | Passes | Prey faster than the hunter runs across its front | 2.4 against 0 kills of 4 in 300 beats | go the same way: 0 in the same setting | It runs to where the prey will be and meets it; told only to approach, it falls in behind and is left |
| circle | Passes | A hunter that is fast in a straight line and slow to turn. The prey runs, and when the hunter is on it, it circles | 527 against 414 beats lived of 600 | go along: 414 in the same setting | It runs round the hunter, always at its side or behind, and the hunter cannot bring its jaws to bear; running straight, it is caught |
| go along | Passes | A trail of its kind's marks leads to food far off | 14.5 against 0 bites eaten in 560 beats | circle: 11.6 in the same setting | It follows the line of marks to the food; told to circle, it goes round the first marks it finds |
| face | Passes | A hunter comes from any side at an animal with a shell on its front only | 76 against 31 beats lived of 400 | hold still: 31 in the same setting | It turns its shell to the hunter; holding still, it is bitten wherever the hunter arrives |
| wander | Passes | Food scattered beyond where it can see, and no nose to find it | 25.8 against 0 bites eaten in 600 beats | hold still: 0 in the same setting | It drifts about and comes on food by chance; standing where it is, it sees none |
| hold still | Passes | A hunter that hunts by eye, and prey that matches the ground | 366 against 259 beats lived of 700 | rest: 490 against 286 beats lived when the hunter has seen it | It freezes and the hunter walks past; one that keeps moving is seen |
| sprinting | Passes | A hunter in open country | 558 against 449 beats lived of 600 | creeping: 367 in the same setting | It runs flat out and gets away |
| creeping | Passes | A dark night; prey that feels movement and bolts | 2.2 against 0 kills of 5 in 600 beats | sprinting: 0.1 in the same setting | It creeps up unfelt and takes them; at any other pace they feel it coming |
| normal pace | Passes | A dark night, food to be found, and a hunter that feels for movement | 489 against 356 beats lived of 600 | creeping: 22.1 against 17.3 bites eaten in 500 beats | At a walk it is felt only from close by; at a sprint the hunter feels it from twice as far and comes |
| bite | Passes | Food it can smell | 20.1 against 0 bites eaten in 400 beats | grab: 0 in the same setting | It eats; told to grab, it picks the food up and carries it about hungry |
| rest | Passes | No food at all | 5070 against 2901 beats lived of 6000 | hold still: 2901 in the same setting | It lies down, uses little, and lasts far longer |
| lay | Passes | Pairs, with plenty of food | 25.4 against 0 young and eggs after 900 beats | drop: 0 in the same setting | Eggs appear, and then young |
| mate | Passes | Pairs, with plenty of food | 25.4 against 0 young and eggs after 900 beats | tend: 0 in the same setting | Two meet, and one of them goes off to lay |
| grab | Passes | Food lying about, and a larder to fill | 4 against 0 pieces in the larder after 600 beats | bite: 0 in the same setting | It picks food up and carries it home; told to bite, it eats where it stands and the larder stays empty |
| drop | Passes | Food lying about, and a larder to fill | 4 against 0 pieces in the larder after 600 beats | give: 0 in the same setting | It sets its load down in the larder and goes back for more; without the word it carries the first piece for ever |
| give | Passes | Six newborn that cannot feed themselves, and one parent | 4.3 against 0 young alive after 3000 beats, of 6 | tend: 0 in the same setting | It feeds them and they live; tended but not fed, they starve |
| tend | Passes | Six newborn with enough inside them to last, and one parent | 2 against 0 young grown up after 500 beats, of 6 | give: 0 in the same setting | Tended, they are grown in a third of the time |
| roll | Passes | Two small riders cling to its back and feed on it | 600 against 42.7 beats lived of 600 | shed: 42.7 in the same setting | It rolls, and they are thrown off and crushed |
| cling | Passes | A big animal that runs when bitten, and small ones that feed on it | 11 against 5 bites the riders get in 600 beats | grab: 4.9 in the same setting | They take hold and ride, feeding as they go; without a hold they get one bite and are left behind |
| let go | Passes | It rides a bigger animal that walks past food far from where it started | 35.7 against 0 bites eaten in 700 beats | drop: 0 in the same setting | It lets go as it passes the food, and eats; without the word it is carried on past |
| hide | Passes | A hunter, and an animal with a shell on its back | 182 against 41.3 beats lived of 500 | hold still: 37.2 in the same setting | It pulls in under its shell and the hunter can do little to it |
| shed | Passes | A hunter with locking jaws, and prey with a tail that sheds | 475 against 410 beats lived of 500 | roll: 427 in the same setting | It is seized, drops its tail and runs |
| sting | Passes | A hunter runs it down from behind; it has a sting at its rear | 539 against 423 beats lived of 600 | bite: 422 in the same setting | It stings, and the hunter can only crawl after it |
| spray | Passes | A hunter a little faster than its prey, which carries ink | 480 against 423 beats lived of 600 | glow: 423 in the same setting | A cloud goes up between them and the hunter loses it |
| glow | Passes | A night that does not end; they have lights | 28.1 against 0.3 young and eggs after 900 beats | show: 0.3 in the same setting | They light up, find each other and breed; a display without a light is not seen in the dark |
| puff up | Passes | A hunter that takes what is smaller than itself; it has a crest | 467 against 276 beats lived of 600 | crouch: 342 in the same setting | It stands and puffs up, and the hunter leaves it |
| play dead | Passes | A hunter that wants live prey | 471 against 276 beats lived of 600 | crouch: 342 in the same setting | It drops and lies still, and the hunter walks over it |
| crouch | Passes | A hunter that hunts by eye, on open ground | 357 against 263 beats lived of 700 | hold still: 255 in the same setting | It flattens itself and is seen only from a third as far |
| mark | Passes | One of its kind walks to distant food. Another comes to the same starting place afterwards | 34.4 against 0 bites eaten by one that comes later | call: 0 in the same setting | The first leaves a line of marks and the second follows it; a call is gone by the time the second arrives |
| wipe | Passes | A trail of its kind's marks leads to food. A thief of another kind follows such trails. It walks home along the trail | 5.2 against 36 bites a thief gets, of the food at the end of the trail | mark: 36 in the same setting | It rubs the marks out behind it; the thief comes to where the trail stops and casts about |
| dig | Passes | Open ground with nowhere to hide. A hunter arrives after a while | 800 against 688 beats lived of 800 | build: 688 in the same setting | It digs a hollow, and is down it when the hunter comes |
| build | Passes | A hard frost, material lying about, and eggs to lay at nightfall | 5 against 0.8 young hatched after a frosty 700 beats | drop: 0 in the same setting | It carries material together, builds a nest and lays in it; eggs laid on bare ground freeze |
| call | Passes | A hunter comes up behind its kin, who are far off and looking the other way. It sees the hunter | 587 against 547 beats its kin live, of 600 | show: 547 in the same setting | It calls and they run; a display behind their backs is not seen |
| show | Passes | Two of a size at one small pile of food. The other backs off from a threat it can see | 12 against 6.3 bites eaten of about 12 | call: 6.3 in the same setting | It shows a threat, the rival draws back, and it eats |
| raise | Passes | A hunter of middling speed in open country | 558 against 398 beats lived of 600 | calm: 398 in the same setting | Its fear outlasts the sight of the hunter, and it keeps running after the hunter has dropped behind where it cannot see |
| calm | Passes | A big harmless animal passes by once. Its fear does not fade by itself | 36 against 0 bites eaten in 900 beats | raise: 0 in the same setting | When the big one has gone it calms down and goes back to feeding; without the word it cowers for the rest of its life |
| hurry | Passes | Four of a kind, each lit for half of a slow rhythm of its own | 89.7 against 26.9 beats on which all four are lit together, of the last 300 | raise: 26.9 in the same setting | Each sees another light up and hurries its own; after a while they pulse together |
| ping | Passes | A dark night; it can make a call that comes back | 4.6 against 0.6 kills of 5 in 600 beats | call: 0.6 in the same setting | It calls, and for a moment knows where everything near it is |
| the one it is facing | Passes | A hunter that backs off when hurt. It has a sting at its front, turns to face what frightens it, and stings when afraid | 500 against 274 beats lived of 500 |  | Afraid, it stings whatever is in front of it. Without the aim, being afraid points at nothing and the sting never goes in |
| only when | Passes | Food found by eye, through days and nights | 51.3 against 0.3 bites eaten in four days | not when: 6.8 in the same setting | It rests only at night and feeds by day; resting whenever it can, it starves, and resting only by day it blunders about in the dark |
| not when | Passes | Food found by eye, through days and nights | 42 against 0.3 bites eaten in four days | only when: 13 in the same setting | It rests except by day, and feeds by day |
| more when | Passes | Food lies round a big animal it is afraid of, which is in fact harmless | 13.6 against 0 bites eaten in 500 beats | less when: 0 in the same setting | When it is hungry enough its hunger wins and it goes in to feed |
| less when | Passes | Food lies round a big animal it is afraid of, which is in fact harmless | 8.8 against 0 bites eaten in 500 beats | more when: 0 in the same setting | When it is hungry its fear counts for less and it goes in to feed |
| strong | Passes | A hunter, in country full of food it would like to stop for | 527 against 354 beats lived of 600 | normal strength: 380 in the same setting | Its fear is stronger than its appetite and it does not stop |
| weak | Passes | Food lies round a big animal it is afraid of, which is in fact harmless | 37.8 against 0 bites eaten in 500 beats | normal strength: 0 in the same setting | Its fear is slight and it feeds under the big one's nose |
| normal strength | Passes | A hunter, in country full of food that tempts it a little | 517 against 326 beats lived of 600 | strong: 37.7 against 0 bites eaten beside a big harmless animal | An ordinary fear outweighs a slight appetite and it runs; a slight fear only matches it, and it dithers |
| close | Passes | Food round a big animal that bites whatever touches it | 1.8 against 0 bites eaten in 500 beats | mid: 0 in the same setting | It keeps just out of reach and can still get at the food |
| mid | Passes | A hunter that lunges at whatever comes near it | 600 against 561 beats lived of 600 | far apart: 522 against 600 beats lived of 600 | It keeps beyond the lunge; keeping only a little apart, it is inside it |
| far apart | Passes | A hunter that rushes anything it sees within its short sight | 600 against 460 beats lived of 600 | mid: 509 in the same setting | It keeps so far off that the hunter never sees it |
| wide | Passes | The food is all far away, and it has no nose | 7.1 against 2.9 bites eaten in 1600 beats | medium: 25.9 against 45.9 bites eaten on one small patch | It strikes out in long straight runs and comes on the food; turning tightly, it never leaves where it began |
| tight | **Fails: not told from medium** | One small patch where food keeps coming up, and it has no nose | 55.3 against 25.8 bites eaten in 2500 beats | medium: 4.5 against 6.9 bites eaten when the food is far away | It turns and turns about the patch and is there when food comes up; ranging wide, it leaves and does not find its way back |
| medium | **Fails: not told from tight** | One small patch where food keeps coming up, and it has no nose | 47.1 against 25.8 bites eaten on one small patch in 2500 beats | tight: 6.9 against 4.5 bites eaten when the food is far away | It stays about the patch better than the one that ranges wide |

What the tests found:

| Finding | What was done |
|---|---|
| **Tight and medium wandering cannot be told apart,** even on 48 maps. A body's turn rate caps how tightly it can wander, so both come to the same thing | **Open.** To settle in step 3.4: make the dial two settings, or space the three further apart. Long, big and front-heavy bodies cannot wander tightly at all, which is a consequence worth keeping |
| **Circling a prey never led to a bite.** A body moves the way it faces, so one that goes round its prey is never facing it | Circle is kept for what it does do: a small animal that circles a hunter which is fast but slow to turn stays at its flank, out of the jaws. Running straight, it is caught |
| **A hunter circling at a sprint cannot close.** Its turning circle is wider than its reach | Kept: it follows from turn rate and speed |
| **Go along went round a creature** as if it were a line | A line is an edge, a bank, a wall or a trail of marks. A creature is not one |
| **Sprinting to food cost nothing.** The rule that a sprinter smells nothing only made it stutter | No rule changed. A walk pays where something listens: a hunter that feels for movement feels a sprinter from twice as far |
| **An act set off by something seen far away does not fire.** How strongly a sight pulls falls with distance, and an act needs half strength | Kept, and to be written into the vocabulary's notes: a pose or a call meant for a distant threat has to be a strong instinct |
| **Crouching halved the distance it was seen from, and that was not enough** to matter | A crouching body is seen from a third as far |
| **Hiding in a shell bought little** | A withdrawn body takes a twentieth of a bite, not a tenth |
| **Eggs laid at the edge of a nest were not in it** | A nest it stands in or touches takes the eggs |
| **An empty slot in a brain stopped the world** | A slip in the stand-in, put right |

### 2c. The words a mood is set with, and the ten mood functions

Run with `node design/checks/mechaudit.js moods`; the tests are in `design/checks/mech/moods.js`.

**Result: 20 of 20 pass.**

| Word | Verdict | Setting | With it against without | Told from its neighbour | What a watcher sees |
|---|---|---|---|---|---|
| quickly | Passes | Deep dusk. A hunter that finds warm bodies is seen only when it is nearly on them | 414 against 327 beats lived of 600 | normally: 339 in the same setting | It is afraid at the first glimpse and gone; a fear that takes longer to rise is still rising when the jaws close |
| normally | Passes | Broad day. A hunter is seen from far off | 483 against 287 beats lived of 600 | quickly: 130 against 76.4 bites eaten in 800 beats | Its fear has risen long before the hunter arrives; a fear that rises slowly has not |
| slowly | Passes | A harmless neighbour that calls now and then | 130 against 76.4 bites eaten in 800 beats | normally: 287 against 483 beats lived of 600 | One call does not frighten it and it goes on feeding; a fear that rises quickly stops it every time |
| briefly | Passes | A harmless neighbour that calls now and then, and a fear that rises quickly | 124 against 0.2 bites eaten in 800 beats | a while: 75.7 in the same setting | It starts at each call and is feeding again at once |
| a while | Passes | A harmless neighbour that calls now and then, and a fear that rises quickly | 75.7 against 0.2 bites eaten in 800 beats | a long time: 0.2 in the same setting | It stops for a few moments at each call and then feeds again; a fear that lingers a long time never lets it feed |
| a long time | Passes | A hunter of middling speed in open country, which drops behind where the prey cannot see it | 558 against 376 beats lived of 600 | until calmed: 36 against 0 bites eaten in 900 beats | Its fear outlasts the sight of the hunter and it keeps running; a fear that is gone at once lets it stop while the hunter is still behind it |
| until calmed | Passes | It hatches in a burrow, wanders far off, and long afterwards a hard frost comes. The burrow is the only shelter | 1500 against 573 beats lived through a frost, of 1500 | a long time: 573 in the same setting | It still knows the way home, and goes; a memory that only lingers a long time has faded, and it dies in the open |
| kicks in low | Passes | Deep dusk. A hunter that finds warm bodies is seen only when it is nearly on them, and fear rises at the ordinary rate | 390 against 331 beats lived of 600 | kicks in at half: 339 in the same setting | A little fear is enough to make it run, and it runs in time |
| kicks in at half | Passes | A harmless neighbour that calls now and then, and a fear that rises quickly | 75.7 against 12.6 bites eaten in 800 beats | kicks in high: 109 in the same setting | It stops at each call, but not for long; a fear that kicks in low keeps it frozen most of the time, and one that kicks in high barely stops it at all |
| kicks in high | Passes | A harmless neighbour that calls now and then, and a fear that rises quickly | 109 against 12.6 bites eaten in 800 beats | kicks in at half: 75.7 in the same setting | It takes a great deal to frighten it, and it barely pauses in its feeding |
| Bond | Passes | A young one, its parent that walks steadily on, and three other adults milling about | 500 against 369 beats within 30 of its own parent, of 500 | Place: 369 in the same setting | It follows the one it first knew, through the others; without the bond it follows whichever is nearest and is soon with a stranger |
| Place | Passes | It hatches in a burrow, wanders far off, and then a hard frost comes. The burrow is the only shelter | 1500 against 573 beats lived through a frost, of 1500 | Bond: 573 in the same setting | It knows where it was born and goes back there |
| Rhythm | Passes | A dark night. A family keeps together by calling, and a hunter that listens for calls prowls not far off | 567 against 121 beats lived of 600 | Count: 122 against 0 bites its kin eat in 600 beats | They call in a slow pulse, enough to keep together and too little for the hunter to home on; calling without pause, they bring it straight to them |
| Count | Passes | A harmless neighbour that calls now and then. Its fear rises quickly | 130 against 75.7 bites eaten in 800 beats | Rhythm: 61.5 in the same setting | It takes three calls close together to frighten it, and one call at a time never does; without the count every call stops its feeding |
| Born with | Passes | Six that lay, and a small animal that eats every egg it finds | 139 against 101 young hatched in 1500 beats | For life: 101 in the same setting | A third of them are born guards: they go for the egg-eater and kill it, and the eggs hatch |
| Catching | Passes | Three with their backs to a hunter. One of their kind, in front of them, sees it | 500 against 256 beats lived of 500 | Learn: 256 in the same setting | They see fear on the one that faces them, take fright themselves and run, without ever seeing the hunter |
| Learn | Passes | Food all about, and big animals of another kind that bite whatever touches them | 900 against 115 beats lived of 900 | Catching: 115 in the same setting | Bitten once, it knows that kind and keeps clear of it; without the lesson it walks into them again and again |
| Takes over | Passes | A hunter, in country full of food that it wants badly | 556 against 389 beats lived of 600 | Habit: 360 in the same setting | Once afraid it has no thought for food and runs; without that, appetite outweighs fear and it stops to eat |
| Habit | Passes | It is drawn alike to rocks and to scrub. There is food by the rocks. In the scrub there is only a small animal that bites | 15.5 against 0 bites eaten in 2000 beats | Takes over: 0 in the same setting | Each bite it takes in the scrub makes the scrub draw it less, until it wanders off and finds the rocks. Without the habit it goes back to the scrub for as long as it lives |
| For life | Passes | A colony of helpers whose one breeder has died. Only a breeder lays | 57.9 against 0 young hatched in 1500 beats | Born with: 0 in the same setting | With no breeder in sight, one of them slowly changes, grows into a breeder and begins to lay. Without that the colony dies out |

"Raised by" and "calmed by" are the acts raise and calm seen from the mood's side, and are covered by those two tests in 2b.

What the tests found:

| Finding | What was done |
|---|---|
| **A remembered place was never forgotten,** whatever its mood was set to | A place is remembered for as long as any of its mood is left. A memory meant for life is one that lasts until calmed |
| **A weak pull still held a body's heading** once it had arrived somewhere, so it could not wander off | A body that has arrived turns to the thing only while it stays |
| **A habit could not weaken below a fifth,** and a fifth is enough to hold a wandering animal in place for ever | A habit can weaken almost to nothing |
| **An animal set to grow up slowly died of old age on the day it grew up** | However long it takes to grow up, it has a life after that |
| **Born watchers did not pay.** A call set off by a sight fires only when the hunter is already close, and feeders look up between bites anyway | "Born with" is shown with born guards, which kill an egg-eater. Whether sentinels can be made to pay is a question for the behaviours in section 3 |
| **A count needs a mood that fades between events,** or single events add up over a lifetime | Kept: a count with a lingering time is "this many, close together" |

### 2d. Signals, and the settings for a whole species

Run with `node design/checks/mechaudit.js species`; the tests are in `design/checks/mech/species.js`.

**Result: 25 of 28 pass.**

| Word | Verdict | Setting | With it against without | Told from its neighbour | What a watcher sees |
|---|---|---|---|---|---|
| a call heard far | Passes | It finds food and calls. Three of its kind are a long way off, hungry, with no way to find the food themselves | 97.8 against 0 bites its kin eat in 400 beats | a call heard near: 0 in the same setting | The call carries to them and they come; an ordinary call does not reach |
| a call heard near | Passes | A dark night. A family keeps together by calling, and a hunter that listens for calls is prowling not far off | 555 against 121 beats lived of 600 | a call heard far: 121 in the same setting | Their calls reach each other and no farther; an ordinary call brings the hunter |
| a mark that lasts | Passes | One of its kind walks to distant food, marking as it goes. Another comes to the start a good while afterwards | 18.4 against 0 bites eaten by one that follows the trail later | a mark that fades soon: 0 in the same setting | The trail is still there to follow; an ordinary mark has faded |
| a mark that fades soon | Passes | The food at the end of a trail has all been eaten, and there is new food near the start. Another of its kind comes to the start | 14.2 against 0 bites eaten in 500 beats | a mark that lasts: 0 in the same setting | The stale trail has gone, and it finds the new food; a trail that is still there leads it a long way to nothing |
| a display | Passes | Two of a size at one small pile of food. The other backs off from a threat it can see | 12 against 6.3 bites eaten of about 12 | a call heard near: 6.3 in the same setting | It shows a threat, the rival draws back, and it eats |
| facing while showing | **Fails: does not pay** | A scout that remembers where it found food, far off. A follower beside it has never been there | 0 against 0 bites the follower eats in 700 beats |  | The scout turns toward the place as it shows, and the follower sets off the way it points and finds the food. A scout that shows without turning sends the follower anywhere |
| alone | Passes | One founder on its own, with plenty of food | 12 against 0 more of them after 900 beats | splitting: 5.4 in the same setting | It lays without a mate and founds a population; one that needs a mate leaves nothing |
| splitting | Passes | Plenty of food, and an animal that eats every egg it finds | 39.3 against 3.7 more of them after 1200 beats | alone: 28 in the same setting | It divides in two with no egg for anything to eat; the ones that lay feed the egg-eater |
| both sexes in one | Passes | Two founders, whatever sex chance gives them | 274 against 20.1 more of them after 1200 beats | in pairs: 20.1 in the same setting | Any two can breed, and both lay; of two that are each one sex, half the time they are the same sex and leave nothing |
| in pairs | Passes | Four founders, two of each sex, with plenty of food | 81.4 against 0 more of them after 1200 beats | alone: 384 in the same setting | They pair and breed |
| one breeder with helpers | **Fails: does not pay** | One breeder, one male and four helpers that bring her food; only the breeder lays | 1.6 against 25.7 more of them after 1200 beats | in pairs: 25.7 in the same setting | The helpers feed her and she lays without stopping to feed |
| share of each sex and form | Passes | Pairs with plenty of food, over several generations | 185 against 110 more of them after 1800 beats | a rule on the mix: 72.4 in the same setting | Most of each brood are daughters, and the numbers climb faster than with as many sons as daughters |
| a rule on the mix | Passes | Layers, with an animal of another kind in sight. Guards are a second form | 20.4 against 0 guards among the brood after 700 beats | share of each sex and form: 9.9 in the same setting | When one of another kind is in sight the brood is all guards; with a fixed share most of the brood are still layers |
| once and lay for life | Passes | Three females and one male, and the male does not last long | 38 against 8.9 more of them after 1200 beats | each time: 8.9 in the same setting | Mated once, they go on laying after he is gone |
| each time | **Fails: not told from once and lay for life** | Pairs with plenty of food | 81.4 against 81.4 more of them after 1200 beats | once and lay for life: 97.2 in the same setting | They mate before each clutch |
| the mother dies after laying | Passes | No food for the young but what their mother leaves | 8 against 1.8 young alive after 1900 beats | nothing: 1.8 in the same setting | She dies at the nest and her brood feed on her; where she lives, they starve round her |
| the father dies after mating | Passes | Pairs with nothing else to eat | 10.2 against 3 eggs laid in 800 beats | nothing: 3 in the same setting | He dies when they have mated, she eats him, and lays the more for it |
| nothing | Passes | Plenty of food, and time for many clutches | 37.9 against 6 more of them after 1500 beats | the mother dies after laying: 6 in the same setting | She lives to lay again and again |
| many small | Passes | Plenty of food and no enemies | 24 against 5.5 more of them after 900 beats | a few large: 5.5 in the same setting | Clutches of many, and most of them make it |
| a few large | Passes | Nothing for the young to eat for a long while | 3 against 0 young alive after 1700 beats | many small: 0 in the same setting | Each hatches big, with enough inside it to reach the next meal; the small ones hatch hungry and die |
| kept inside until they hatch | Passes | Plenty of food, and an animal that eats every egg it finds | 57.2 against 30.2 more of them after 1200 beats | laid: 30.2 in the same setting | There is never an egg on the ground to be eaten; the young are born alive |
| laid | Passes | A hunter of middling speed, and mothers carrying a brood | 600 against 488 beats the mothers live, of 600 | kept inside until they hatch: 488 in the same setting | She has laid and runs light; one that carries her brood inside her is slow, and is caught |
| wait for a season | Passes | Eggs laid in a burrow in autumn, and a winter of hard frost | 8 against 0 young alive in the spring | hatch at once: 0 in the same setting | The eggs lie in the burrow all winter and hatch in spring; hatched at once, the young meet the frost |
| hatch at once | Passes | A good season with plenty of food | 24 against 0 young out of the egg after 900 beats | wait for a season: 0 in the same setting | The young are out and feeding while the eggs of the others are still waiting |
| once, with everything | Passes | A season too short for more than one clutch | 18 against 12 eggs and young after 250 beats | repeatedly: 12 in the same setting | She puts everything she has into one great clutch |
| repeatedly | Passes | Plenty of food, and time for many clutches | 37.9 against 12 more of them after 1500 beats | once, with everything: 12 in the same setting | She lays, feeds and lays again |
| adults sleep through a season | Passes | A winter with nothing to eat | 4 against 0 alive at the end of a winter with no food, of 4 | no sleep: 0 in the same setting | They sleep through it, using almost nothing, and wake thin in spring; the ones that stay awake starve |
| no sleep | Passes | A mild winter with food about | 362 against 240 more of them after a mild winter | adults sleep through a season: 240 in the same setting | They feed and breed all winter while the sleepers lie still |

The six words for what attention costs are rules, not choices. Each is checked in `mechaudit.js words`: a notice that is true without the rule is false with it (6 of 6). Four of them also decide a test above: creeping, a walk against a sprint, resting against holding still, and hiding.

What the tests found:

| Finding | What was done |
|---|---|
| **An instinct to lay "always" starved its owner.** An act that could not be done still used up the beat, so the animal never fed. It had also made the first Rhythm test pass for the wrong reason | Laying, mating, building, rolling, giving and tending no longer use the beat when they cannot be done. Rhythm was tested again in a fair setting (calling in pulses) and passes |
| **Eggs that "wait for a season" hatched at the start of winter** when laid in autumn | They lie through whatever is left of the year and hatch when spring comes |
| **One breeder with helpers does not pay.** Six in a colony leave far fewer young than three pairs, even with the helpers feeding the breeder | **Open.** A colony has to earn its keep through what helpers do: guard, build, carry, defend. That is a behaviour to write in section 3, and if none pays there the setting needs a rule of its own |
| **Mating each time has no advantage over mating once for life** | **Open.** It is the plain setting. To settle in 3.4: give mating once a cost, or keep one of the two |
| **Pointing is not shown.** A follower takes the heading of a scout that shows while facing a remembered place, but over a long walk it drifts off the line and misses the food | **Open.** To be written as a full behaviour in section 3 (the scout's dance), where the follower can be given a way to hold a heading |
| **A call set off by a sight far away never fired,** again | The same finding as in 2b. The far-call test uses a call set off by touching food |
| **The mother's death and the father's death each needed a use** | Both are shown as food: her brood feed on her, and the female eats him and lays the more for it. Whether that is the meaning the design wants is a question for the owner |

## 3. The promised behaviours

Not yet run.
