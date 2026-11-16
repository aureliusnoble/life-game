# Species sheet, first blind quiz: can each part be told from its drawing

16 November 2026. An independent reviewer (a fresh agent on Fable 5.2) was shown 63 pictures, each the plain creature with one thing added, and the list of everything a body can be given. It wrote down what it saw before opening the list, then named each picture. This is the "can it be told" check of area 13 (`design/plan.md` section 4), run by `node design/checks/sheetaudit.js quiz`.

## Result

59 of 63 right. Of the answers, 22 were given with high confidence, 25 with medium and 16 with low, and many of the low ones were reached by elimination, not by recognising the drawing. Three of the four wrong answers were the test's fault: the plain creature already had a nose, ears and its eyes, so those pictures were the plain creature again.

## What was done about it

Every finding was accepted. None was rejected.

| Finding | Change |
|---|---|
| The plain creature already has a nose and ears, so three pictures show nothing | The quiz now starts from a bare body: no nose, no ears |
| Fat shows no change | A fat body is about a third wider and its ends are fuller |
| A big gut is a diamond, and the other organs barely show | A gut is a round belly; chest, hips and shoulders swell further |
| Jaws read as horns | Jaws are a dark underjaw past the face with a row of teeth |
| Locking jaws do not say that they lock | A pale pin where the pincers cross, and teeth along them |
| The crest cannot be read | A row of bright feathers from brow to nape. The old feathered shape became a third style of feeler |
| Horns are small and far back | Horns for pushing are stout, set at the brow and point forward |
| Grips beside the ears read as parts of the head | Grips sit at mid-body and point sideways; an arm ends in a hand with a thumb |
| Fins and paddles look alike | A fin is thin and swept back, with rays |
| The broad foot reads as a rim of fat | It trails behind the body and is creased, like a slug's |
| Club, lantern and feelers are all a yellow ball on a stalk | The club is a dark mace with studs; the lantern is pale with rays |
| A sting at the front does not look like the one at the rear | Both end in the same barb |
| A skirt of cilia looks like bristles | The skirt is pale and fine |
| Shell on the front and sides is a plain brown band | Both are scored into plates, like the shell on a back |
| Slime reads as blue spikes or water | Round drops, in a yellow green tinted toward the body |
| Heat pits, scent glands and false eyes are all pairs of rings | Heat pits are two warm slits; scent glands carry the arcs of a scent |
| The compass reads as a glow | A needle in two colours on a pale dial |
| Grass worn on the back reads as leaves | Thin blades |
| A body in rounds reads as plates | Its rounds alternate two tones of its own paper |
| Webbed feet have pale tips that read as claws | No tips; the web between the toes is scored |

A second quiz, on a bare body, followed these changes: see `sheet-quiz-round2.md`.

## The reviewer's answers

How I looked: first at the three sheets at their real size, then at enlarged copies (3x to 5x) of the same pictures, side by side with the plain one. Nothing else: no measuring, no pixel comparison. The "What I see" column was written before I opened `choices.md`. Where the real-size picture read differently from the enlarged one, I say so, because a player sees the small one.

| No. | What I see | My answer (item: option) | How sure |
|---|---|---|---|
| 1 | Body is a wedge: broad at the shoulders, narrowing to the rear. At real size I took it for the plain one. | Lungs | low |
| 2 | Two big yellow eyes with white rims on its rump | False eyes | high |
| 3 | Two olive-gold rings, like doughnuts, on the rear flanks | Scent glands | medium |
| 4 | No difference I can point to. Perhaps a touch rounder, but I would not swear to it. | Fat | low |
| 5 | Pale sandy speckled patch over the back | Camouflage: sand | high |
| 6 | Front legs reach out and end in one big curved white claw each. At real size I read them as horns on the head. | Grip: hooks | medium |
| 7 | Tail is a yellow ball on a short red stalk | Club tail | medium |
| 8 | All four paws are soft pink rounded lobes, no toes | Moves on: fins | low |
| 9 | Pink spiral where the nose and muzzle were | Mouth: tongue | medium |
| 10 | Front legs end in round cream pads with a pink dot. At real size I read them as eyes on stalks. | Grip: suckers | high |
| 11 | Four pale blue-white beads in a diamond on the back | Gland that gives | medium |
| 12 | Smooth brown band across the neck, behind the eyes | Skin on its front: shell | medium |
| 13 | Red tube beside the tail squirting dark purple blobs. At real size I read it as a black-tipped sting. | Ink | high |
| 14 | White spikes fanning forward round the face | Skin on its front: spikes | high |
| 15 | Brown saw-toothed fringe right round the body; paws gone | Moves on: a skirt of cilia | medium |
| 16 | Two yellow rings with dark red centres between the eyes and the nose | Heat pits | medium |
| 17 | Brown segmented shell on the back, yellow boss in the middle | Skin on its back: shell | high |
| 18 | Fine dark hairs along both flanks; paws still there | Skin on its sides: bristles | high |
| 19 | Tail is a pink fish tail | Tail fin | high |
| 20 | Two long ivory tusks sweeping forward from the mouth; muzzle replaced by a dark red mouth | Mouth: jaws | low |
| 21 | Smooth dark brown bands along both flanks | Skin on its sides: shell | medium |
| 22 | All four paws are red rounded stubs, like oar blades, no toes | Moves on: paddles | low |
| 23 | Orange criss-cross triangles on the head between eye and ear, like little woven fans or gills | Crest | low |
| 24 | Two red feelers with yellow knobs, pointing forward from the brow | Touch | medium |
| 25 | Brown moth wings with a yellow spot on each | Wings | high |
| 26 | No difference from the plain one that I can see | Eyes: on the sides | low |
| 27 | Three long straight white tines from each front paw. At real size I read them as whiskers. | Digging claws | medium |
| 28 | Glowing yellow ball on a red stalk from the forehead | Glow | high |
| 29 | Eyes out on red stalks at the sides of the head | Eyes: on stalks | high |
| 30 | Reeds lying on the back: green stems with brown heads | Camouflage: reed | high |
| 31 | Paws broader, fan-shaped, with small white points along the edge. At real size I read them as claws. | Moves on: webbed feet | medium |
| 32 | Brown lumps or clods on the back | Camouflage: mud | medium |
| 33 | Yellow diamond with a white edge on top of the head | Compass | medium |
| 34 | Front legs longer, ending in a red point beyond the toes | Grip: arms | low |
| 35 | Pale half-moon on the back, like a pocket | Pouch | medium |
| 36 | White spikes along both flanks | Skin on its sides: spikes | high |
| 37 | Body pinched at the shoulders and flaring at the hips. At real size I took it for the plain one. | Muscle | low |
| 38 | Grey stones on the back | Camouflage: rock | high |
| 39 | Pale pink rim all round the body, wider behind; paws gone, tail nearly hidden | Moves on: one broad foot | medium |
| 40 | Tail is a yellow stub crossed by white rings | A tail that sheds | low |
| 41 | Dark brown patch with a jagged edge and pale dashes on the back | Skin on its back: bristles | medium |
| 42 | Two big red pincers from the mouth; muzzle replaced by a dark red mouth | Mouth: locking jaws | low |
| 43 | Body in orange and brown bands, like segments; no paws | Moves on: body waves | medium |
| 44 | Brown jagged ruff round the neck, like a mane | Skin on its front: bristles | medium |
| 45 | One big brown dead leaf over the back | Camouflage: leaf litter | high |
| 46 | Eyes close together at the front, looking ahead | Eyes: facing forward | high |
| 47 | No difference from the plain one that I can see | Nose | low |
| 48 | Four long thin red legs with yellow knees | Moves on: stilts | high |
| 49 | Body a triangle, very wide at the rear | Brood | low |
| 50 | A row of dark dots along each side of the back | Side line | high |
| 51 | Yellow needle with a black tip sticking out of the muzzle, like a pencil | Sting: front | medium |
| 52 | Tail is a red stalk with a yellow arrowhead | Sting: rear | high |
| 53 | No difference from the plain one that I can see | Moves on: legs | low |
| 54 | Small cream curved pieces at the front edge of each ear | Horns | low |
| 55 | Six pale cone spikes standing on the back | Skin on its back: spikes | high |
| 56 | Two pale blue teardrops on the back and pale blue drops trailing behind the tail | Skin on its back: slime | medium |
| 57 | Huge round ears with rings in them, like dishes | Ears | medium |
| 58 | Yellow beak, open, in place of the muzzle | Mouth: beak | high |
| 59 | Body a diamond: pointed bulges out to each side in the middle | Gut | low |
| 60 | Green leaves or blades lying on the back | Camouflage: grass | medium |
| 61 | Pale blue pointed shapes along both flanks and drops behind the tail | Skin on its sides: slime | medium |
| 62 | Pale blue shapes round the head (by each ear and on the brow) and drops behind the tail | Skin on its front: slime | medium |
| 63 | A different animal: a pink five-sided disc with five long red arms tipped yellow, a tiny face in the middle | Plan: no front | high |

Totals: 22 high, 25 medium, 16 low.

Two things from the list I never found a picture for: **Echo** and **Plan: front and back**. They may be among the pictures I could not tell from the plain one, or I have given their pictures to something else.

## Hard to tell

- **4, 26, 47, 53: I could not see any difference from the plain one**, even enlarged five times beside it. My answers for these four are not readings of the picture. I gave them the things the plain creature already seems to have (side eyes, a nose, legs) and, for No. 4, the one organ I had no picture for. Any of the four could equally be Plan: front and back, Ears, or Echo. If one of them is meant to show "a lot of" an organ, it does not show.
- **1, 37, 49, 59: the body's outline changes, and that is all.** I can see where each one is wider (1 at the shoulders, 37 and 49 at the hips, 59 in the middle) but nothing says what is inside. Lungs, Muscle, Brood, Gut and Fat were dealt out by where I imagine the organ sits. At real size 1 and 37 passed for the plain one; only 49 and 59 are obvious on a phone.
- **20 and 42:** both are clearly mouths that grab (ivory tusks, red pincers), but I cannot say which is jaws and which is locking jaws. Nothing in either picture says "locks". Without the mouth clue (the dark red mouth replacing the muzzle) I would have called 20 horns or tusks.
- **23:** I do not know what the criss-cross fans are. I guessed Crest because they look like folded fans; Echo is as likely. My first thought was gills.
- **54:** small cream crescents by the ears. Horns is a guess; they are too small and too far back to look like something that pushes. They could be a kind of ear.
- **34:** a red point on a longer front leg. I gave it Grip: arms only because 6 looked more like a hook and 27 more like digging claws.
- **6, 27, 34 as a group:** three different things on the front paws, three list items (Digging claws, Grip: hooks, Grip: arms). I am fairly sure of the group and not of who is who.
- **8 and 22:** both are legs turned into toeless lobes. One is fins and one is paddles, and I cannot tell which.
- **40:** ringed yellow stub. The rings could be break lines (a tail that sheds), a rattle, or a club. A tail that sheds is a guess.
- **39:** a pale rim round the body. My first reading, before the list, was a layer of fat. I chose one broad foot because the paws have gone.
- **57:** big ears say hearing, so Ears; but dish ears would also suit Echo.
- **3, 11:** rings on the flanks and beads on the back. I am fairly sure these two are the two glands, less sure which is which. The beads could be eggs.

## Easily confused

- **The front paws sit right beside the ears.** At real size anything added to a front paw reads as part of the head: 6 looked like horns, 10 like eyes on stalks, 27 like whiskers. 54 (by the ears) and 34 (on the paws) are hard to tell apart in kind for the same reason.
- **7 and 28:** the same yellow ball on a red stalk, one at the tail and one at the brow. Only the pale halo on 28 says "light". 24 has small yellow knobs too, so Touch, Glow and Club tail share one look.
- **7, 40, 52:** three yellow-tipped tails. Only 52 (the arrowhead) says what it does.
- **51 and 52:** the two stings do not look alike (a pencil at the front, an arrowhead at the rear), so I did not read them as the same weapon.
- **15, 18, 41, 44:** four brown jagged things. 15 and 18 differ mainly in whether the paws are hidden; I would not expect a player to notice that this makes one a way of moving and the other a skin.
- **44 and Crest:** a ruff round the neck is what I would expect a crest to look like. Seen alone I would have called 44 the Crest.
- **12 and 21 against 17:** the shell on the back is plainly a shell. The "shell" on the front and sides are plain brown bands, and I only called them shell because spikes, bristles and slime were taken.
- **61 and 36:** slime on the sides is drawn as pale blue points and reads as blue spikes or fins. The drops behind the tail are what separate slime from spikes, and they are tiny.
- **56, 61, 62:** I read pale blue as water or ice, not slime.
- **14 and Horns:** spikes round the face look more like horns than 54 does.
- **20 and Horns; 42 and Grip:** tusks read as horns, pincers read as something that grips.
- **16 and 2 and 3:** three pairs of rings (by the nose, on the rump, on the flanks). 2 is clearly eyes. 16 could be nostrils or a second pair of eyes.
- **33:** the diamond could be Compass, Glow or a mark; it shares its yellow with the glow.
- **32, 38, 5:** mud, rock and sand are told apart mostly by colour. 32 could pass for stones or dung.
- **60 and 45, 30:** the "grass" is drawn as leaves, so grass, reed and leaf litter are all "plants on its back"; the reed heads and the single dead leaf carry the difference.
- **43:** the bands read as armour plates (a woodlouse) as easily as a body that moves in waves.
- **39 and Fat; 59 and Wings:** the pale rim reads as blubber, and the diamond body reads as a gliding flap.
- **31 and Digging claws:** the white points on the webbed feet read as claws at real size.

## Guessable without the list

**I would have known what it is for from the picture alone:**
- 2 (false eyes: to fool a watcher), 13 (squirts something dark behind it), 17 (shell: protection), 14, 36, 55 (spikes: do not bite me), 19 (fish tail: swimming), 25 (wings), 28 (a light), 46 and 29 (eyes that look forward, eyes that look all round), 48 (long legs), 52 (a sting in the tail), 58 (a beak), 57 (big ears: hearing), 24 (feelers), 10 (suckers: clinging), 35 (a pocket: carrying), 20 and 42 (grabbing and biting), 27 and 6 (claws), 8 and 22 (flippers: swimming).
- 5, 30, 32, 38, 45, 60: I would have known these are for hiding, since they are bits of the ground worn on the back. I would not have guessed that each works on one ground only, though the picture does suggest it.
- 63: I would have known it is a different kind of body, but not what that means in play (no rear to attack, no way to face).

**Half a hint:**
- 9 (a coiled tongue, but not that it strikes from a distance), 51 (a needle: sting or sipping tube), 7 (a knob: club or lamp), 40 (a rattle?), 18, 41, 44, 15 (hair: warmth? I would not have guessed "hard to bite or cling to"), 31 (webbed or clawed), 50 (I happen to know a fish's side line; most players would see a row of dots), 16 (pits, if you know snakes), 56, 61, 62 (wet, dripping: I would have guessed water-keeping or ice, not slime).

**No hint of its purpose:**
- 4, 26, 47, 53 (nothing to see).
- 1, 37, 49, 59 (a shape, with no sign of lungs, muscle, eggs or gut).
- 3 (rings), 11 (beads), 33 (diamond), 23 (criss-cross fans), 54 (cream crescents), 34 (red points), 12 and 21 (brown bands), 39 (pale rim), 43 (bands).
- Nothing I saw said Echo, Compass, Scent glands or Gland that gives; I reached those by matching leftovers to the list.
