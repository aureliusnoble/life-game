# Body designer: physical characteristics

Draft 1, November 2026. A proposal and an audit, not final rules.

Anything marked **tested** was run in `design/checks/bodyaudit.js`, a stand-in world. Its numbers show direction, not balance. Everything else is on paper.

## 1. Starting from Spore's creature creator

What it got right, from the research notes:

- It was simple to use and still produced something its maker valued; its lead designer called this a "magic crayon".
- The loop was do something, look at it, adjust.
- Any combination of parts moved believably.
- It had two limits: points to spend, and a separate cap on complexity.

Where it fell short: abilities were tied to owning a part at a given level, not to shape, size, placement or number. Its own designers said the parts' effects were "unfortunately quite discrete", and in the later stages the editors were mostly cosmetic.

This design goes further in seven ways:

1. **Form is function.** Shape, size and placement have continuous effects. Nothing has a level.
2. **Where a part sits matters.** Eyes, weapons and armour each cover an arc.
3. **The inside matters.** Organs share the room inside the body.
4. **Whole-body numbers are worked out, not bought.** Speed, turning, appetite and hit points come from the build and are shown live.
5. **No best build.** Every part should be the wrong choice somewhere.
6. **Looks carry meaning.** Camouflage, false eyes, displays and apparent size change how others react.
7. **Lives, not only bodies.** Eggs, growth, sexes, castes and young forms are part of the design.

Colour, pattern and proportion within a plan stay free, so two species with the same parts need not look alike.

## 2. How a body is made

| Step | The player chooses | What it sets |
|---|---|---|
| Plan | Front-and-back, or no front | Whether there is a rear to attack and a direction to face |
| Shape | The outline: length, width, taper | Speed, turning, room for parts |
| Size | Overall scale | Hit points, appetite, reserves, what can eat it |
| Outside | Parts placed on the outline, each with a size handle | Senses, movement, feeding, weapons, defence, signals |
| Inside | How the interior is split | Gut, fat, muscle, lungs; later brain and brood |
| Skin | Colour and pattern (free); camouflage and warning colours (costed) | How it looks and how easily it is seen |
| Life | Many small eggs or few large; sexes; castes; young form | How the species renews itself |

The designer shows the worked-out numbers as the player edits, next to a test tank.

## 3. What the body works out

These are the stand-in's formulas. The game will tune them, but the directions are the design.

| Number | Comes from |
|---|---|
| Speed | Long bodies are fast and round ones slow; muscle adds; armour and fat subtract; limbs decide how much of it applies on land and in water |
| Turning | Long and big bodies turn slowly; legs help |
| Hit points | Grow with mass, more slowly than mass |
| Appetite | Grows with mass, more slowly than mass, so big bodies burn less per unit of weight but more in total; muscle and armour add |
| Reserve | Mass times how much of the inside is fat |
| Stamina | How much of the inside is lungs |
| Sight | Eye size, and where the eyes sit |
| What it can bite | Anything smaller than its gape |

## 4. Audit

Each characteristic was run against its nearest alternative. A characteristic passes if it changes what happens and is the worse choice somewhere.

| Characteristic | What only it does | Result | Verdict |
|---|---|---|---|
| Eyes: forward, side or on stalks | Trade reach for arc | As prey against a stalker: forward eyes caught 34 of 60, side and stalk eyes 0. As a hunter: 3.6 of 8 caught with forward eyes, 1.9 with side, 1.4 with stalks | Keep |
| Body shape | Trades speed for turning | A long hunter caught 4.5 of 6 prey that run straight and 3.5 that swerve. A round one caught 1.4 and 3.2 | Keep |
| Size | Trades appetite against safety | With little food, 3.7 of 6 small grazers survived, 1.4 medium and 0 big. Against hunters, all the small and medium were lost and none of the big, which were too large to take | Keep |
| Back shell | Stops bites from behind | Lost 0.1 of 6 against 6.0 with no shell, whether hunters chased or cut ahead. A fleeing animal always shows its back | Keep; too strong |
| Full shell | Stops bites from anywhere | No safer than a back shell (0.0 against 0.1), slower (0.59 against 0.77) and fed less | Rework or cut |
| Shell-cracking beak | Ignores shells | Shelled grazers lost 6.0 and 5.9 of 6 | Keep, as the counter |
| Spikes | Hurt whoever bites | Lost 2.4 of 6 against 6.0. All-round spikes did worse than back spikes (2.9) because of the weight | Keep; one kind only |
| Legs, fins, paddles | Decide where the body is fast | Food in a pond with finned hunters: paddles lost 2.2 of 6 and ate 27 meals; legs 3.4 and 15; fins 5.9 and 9 | Keep |
| Skirt of cilia | Slow, and cannot be felt | Against hunters that feel movement: 0.0 of 6 lost against 5.1 on legs. Against hunters that see: 5.8 against 6.0 | Keep |
| Long tongue | Bites from a distance | A camouflaged hunter that waits caught 4.6 of 10 faster prey with a tongue and 0 with jaws | Keep |
| Sting at the back | Strikes what is behind | Fleeing prey lost 2.1 of 6 with a sting, 5.9 with jaws at the front and 5.9 unarmed | Keep |
| False eyes | Always seems to be facing you | A stalker caught 34 of 60 without them and 0 with. A chaser was unaffected | Keep; narrow |
| Body with no front | Sees and bites all round, and is slow | Five small attackers lost 4.1 of their number against 0.9, and killed it in 33 of 60 fights against 60 | Keep |
| Camouflage | Seen only from close while still | Lost 5.0 of 6 against 5.8 uncamouflaged. Only when made far stronger did it matter (2.6) | Keep; too weak as set |
| Inside: fat | Bigger reserve, slower body | Best survival in both steady and bursty food (4.2 and 4.4 of 5) | Rebalance |
| Inside: muscle | Faster, hungrier | Worst survival in both food worlds (2.6 and 1.9), but the muscular build was among the safest against hunters | Keep |
| Inside: gut | More from each meal | Never the best choice (3.8 and 3.4) | Rework |
| Inside: lungs | Longer sprints | Not tested on its own | Untested |

## 5. Whole builds against whole worlds

Eight builds, each alone as a group of six, in four worlds with different hunters and one with little food. The figure is survivors of six.

| Build | Hunters that chase | That cut ahead | That stalk | That feel movement | Little food |
|---|---|---|---|---|---|
| Sprinter: long, muscular | 5.7 | 5.7 | 6.0 | 5.8 | 0.6 |
| Tank: back shell and spikes | 5.8 | 5.8 | 5.7 | 5.9 | 1.1 |
| Giant: half as big again | 6.0 | 6.0 | 6.0 | 6.0 | 0.5 |
| Stinger: sting at the back | 4.0 | 4.1 | 5.9 | 4.4 | 2.2 |
| Ghost: camouflaged, holds still | 4.0 | 4.0 | 5.1 | 5.0 | 2.2 |
| Lookout: big eyes on stalks | 3.2 | 3.0 | 6.0 | 4.3 | 2.0 |
| Tiptoe: cilia and a movement sense | 1.0 | 1.6 | 5.3 | 4.8 | 2.4 |
| Mite: small | 0.8 | 1.2 | 5.8 | 3.3 | 1.6 |

No build is best everywhere. The three that hunters cannot touch are the three that starve first when food is short, and the frugal builds that survive a famine are the ones hunters catch. That is the trade the body budget should force.

## 6. Problems the audit found

- **Shells are close to total protection.** They need a real cost, partial cover, or counters that are common. A full shell currently has no reason to exist.
- **Fat is the best organ wherever food is the problem,** and gut is never best. The inside is not yet a real choice.
- **Camouflage is nearly worthless as set.** Patient hunters find a still animal eventually.
- **Any bite back is very strong.** A hurt hunter slows and can catch nothing, so a sting protected prey without killing anything.
- **Giants were safe only because the test hunters were all one size.** With player-made hunters this becomes a race in size, limited by food.
- **Hunters pay nothing for effort in the test world.** Chasing therefore beat ambush (9.2 of 10 caught against 4.6); an ambusher's saving in energy is not counted yet.
- **Unarmoured prey always died.** The standard hunters are too strong to be a fair baseline.

## 7. Not yet audited

No mechanic in the stand-in world yet, so nothing shows these earn their place.

| Family | Parts |
|---|---|
| Senses | Nose and ear ranges, eye size, heat pits, whiskers |
| Moving | Tail fin for bursts, jet, sucker foot, anchor |
| Feeding | Filter, sucker mouth |
| Weapons | Horns, spit, shock, claws |
| Defence | Poison skin, slime, a tail that drops off, ink |
| Looks and signals | Warning colours, glow, crests, voice, scent glands |
| Carrying and energy | Pouch, hooks for riders, sun-feeding leaf, float |
| Inside | Lungs, brain, brood |
| Life | Egg size and number, sexes, castes, young forms |
| Plan | A body made of repeating segments |

## 8. Builds this should allow

A test of breadth: each line is a distinct way to live. The first eight were run above.

- Sprinter, tank, giant, stinger, ghost, lookout, tiptoe, mite.
- **Tongue ambusher:** camouflaged, still, strikes passing prey (tested as a hunter).
- **Urchin:** no front, spiked, slow, grazes in the open.
- **Shell-cracker:** a beak that makes armoured prey its speciality.
- **Pond raider:** paddles, feeds in the water and escapes onto land.
- **Bluffer:** false eyes and a crest that makes it look bigger.
- **Sun-feeder:** a leaf, an anchor and no mouth; lives on light and many eggs.
- **Rider:** small, with a sucker foot; clings to a bigger species.
- **Carrier:** hooks or a pouch; young ride until grown.
- **Swarm:** tiny, cheap, many eggs; wins by numbers.
- **Night hunter:** no eyes, heat pits and a movement sense.
- **Lantern:** a glow that lures others in the dark.
- **Tail-dropper:** loses its tail to whoever grabs it and regrows it.
- **Two-form species:** finned young in the water, legged adults on land.
- **Caste species:** soldiers that grow jaws, workers that grow pouches.

## 9. Next

1. Fix the problems in section 6 in the stand-in world and re-run: shell cost and cover, the inside, camouflage, and what effort costs a hunter.
2. Give the unaudited parts mechanics and run each against its neighbour.
3. Run builds against each other, not only against fixed hunters, to see whether a mix of builds can coexist.
