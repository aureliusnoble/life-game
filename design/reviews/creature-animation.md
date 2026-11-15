# Review: creature animation

15 November 2026. An independent reviewer, shown film strips of each act (walk, startle, settling to sleep, nibble, drink, a look toward a tap, and the many-part creature walking) and the motion code. `u` is a creature unit, the creature being about 95u long; `f` is a frame at 60 a second.

## Score: 3 out of 10

Appealing poses and rendering, but only the look and the end pose of sleep read as animation. Startle, nibble and drink are in effect still pictures. Stills and code show poses, amplitudes, spacing and staging; they do not show how easing feels or whether feet slip.

## What works

The sleep pose, the only real change of silhouette. The head turning on a pin at the neck. Legs phased in diagonal pairs and in threes. The shadow separating for height.

## Problems, worst first, with fixes

**A. The startle is nearly invisible.** Over 35f only the shadow changes. The hop starts at its peak and decays in a straight line, with no rise, hang or landing. Eyes and ears snap and then hold rigid for 70f. It never moves away from the finger.

- f0 to 3, a flinch: size 0.95, shadow offset down, head in 4u, ears back 25°, eyes 1.3 times.
- f3 to 25, a hop on the curve 4p(1−p): size 1.18, shadow out 14u, the body 7u away from the tap and turned 10°, paws splayed 4u.
- f25 to 28, it lands at 1.04, and is back at 1.0 by f36. It holds 25f, blinks, and looks at the tap.

**B. One ease for everything: a tenth of the remainder each frame.** Top speed on the first frame, half done by f7, then drift.

- Anticipation of 3 to 4f, 10 to 15% the opposite way; the move over 10 to 14f, easing in and out; overshoot 10 to 15%; settle over 8 to 10f.
- Ears, tails and feelers on underdamped springs, about 2.5 Hz with damping 0.45.
- Hold poses for 5f, twelve a second; travel smoothly.

**C. The walk: pistons under a glider.** Paws slide along their own axes, more sideways than forward, and are never planted. 2.4 cycles a second at 0.3 body lengths a second: pattering feet under a crawling body. No bob or lift. It stops dead in one frame.

- A cycle of 36f. Stance 22f, the paw pinned to the ground; swing 14f along the heading by ±4.7u, the paw 8% larger and its shadow 1.5u further.
- With each step: speed ±15%, body size +2.5%, shadow +1u.
- Yaw ±5°; the head counter-yaws 3°, 3f late; the tail 9f late; ears bob ±4°, 4f late.
- To stop: overshoot 1.5u and settle over 10f.

**D. Nibble and drink show no action.** The bite is filtered down to about 1u, and the flower never reacts. The drink moves ±1u; a reed covers one eye; the ripples keep their own clock.

- Nibble: head out 5u in 4f, hold 2f, back 6u in 5f with a 6° twist; two to four chews of 8f (the snout wider and shorter, ears bobbing 5°, 3f late); a pause of 20 to 40f. The flower tips 10° at the bite and springs back over 14f.
- Drink: move the reeds; nose 4u past the waterline; head out 9u; lids half shut. Bursts of five or six laps, ±1.5u every 15f, a ripple at each dip; lift 4u, swallow, pause 30f.

**E. Sleep collapses.** The head is most of the way round and the eyes shut by f14. The tail wraps away from the head, making an S and not a curl. The 2% breath cannot be seen.

- Over 130f. f0 to 30, lids half, ears droop 15°. f30 to 55, the body yaws 10° toward the side it will curl. f55 to 100, the head comes round, easing in and out, with 4° of overshoot; the tail 8f later, to the head's side; paws tuck hind first, 6f apart; eyes shut at f95; ears last.
- Then breathe 5% over 240f, the head riding it 0.8u, 10f late.

**F. The look: a head on a pin.** Eyes shift first (4f); anticipation of −4°; a swing over 12f; overshoot 6°; settle 8f; the two ears 2f and 5f late; the body follows by 15%, 6f later.

**G. The many-part creature: armour without weight.** Legs move rigidly and it glides. The tail's joints are in phase, a stiff arc wagging fast: the busiest thing on the heaviest creature. Plates never move.

- A cycle of 48f; hips ±14°, knees ∓20° a quarter-cycle late, feet pinned.
- Each tail joint 4f later than the one before.
- Each plate takes 70% of the yaw of the plate ahead, 2f later.
- Feelers tap in turn, ±12° at 0.8 Hz.

## Rules for animating any creature a player builds

1. A foot on the ground is pinned to the ground. Speed is stride times cadence.
2. Each part is a driver, a follower (2 to 4f late for each joint, 10 to 20% overshoot, left and right 2f apart) or rigid.
3. Paper does not stretch. Height is a change of size, 20% at most, and the shadow's offset. Never bend or shear.
4. Anticipate, move, overshoot, settle, in held poses. Eyes lead, then the head, the body, and what hangs off it.
5. Mass sets tempo: more parts, a longer cycle and less overshoot.
6. Every kind of part answers to perk, droop, trail and twitch, so that a creature with no ears still startles and sleeps.
7. An act must change the silhouette by at least 3u, and the world must answer it.

## First five

The startle; planted feet and the walk's timing; keyed easing with held poses; a nibble and a drink that can be seen; sleep restaged with the tail fixed.
