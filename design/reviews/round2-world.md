# Second review: the world

15 November 2026. An independent reviewer, shown the pond scene large and at phone density, twelve stills across its route, twelve across a gust, the four other biomes large and small, the four events, and close crops of the three clusters. Sizes are CSS pixels at phone width; positions are a share of the frame from the top left; shadows are offset / blur / alpha.

## Verdict

Calming: yes. Made by hand: only the pond. The rest is a tidy illustration in a paper style.

## Scores (5 is a competent prototype)

| | First review | Now | Why |
|---|---|---|---|
| Composition | 4.5 | 6.5 | The lily is on a third, the path leads to it, there is one quiet field. But the pond is five rings inside each other, and no cluster has a big shape |
| Light and atmosphere | 4.5 | 6 | The light from the upper left is now felt, and shadows are cool. The land is one narrow, light band of values |
| Reads as cut paper | | 5.5 | The pond 7.5: stepped cut-away and a torn white shoreline. The meadow 4.5: smooth card with no grass. Props are stickers |
| World motion | 3 | 6 | Cloud shadow, the butterfly landing, the petal, the fish, drink rings and the drift all show. The gust does not: daisies never lean and reeds shift 2 pixels |
| Biome identity | 3.5 | 4.5 | Highlands 3.5, dunes 4.5, marsh 5, woodland 5.5. Each signature form misreads |
| Events | 3 | 6.5 | Rain 6, winter 7, fire 6, night 6.5 |

## Against the first review

| Fault | Now |
|---|---|
| No height | Fixed for the terraces and the pond. The top two terraces are still nearly one colour |
| Values too narrow | Partly: deep water is dark and the gradient is in, but the land is one band |
| Composition | Mostly fixed. There are four clusters, not three |
| Shade is not light | Fixed: it hangs from the tree. It has no bright gaps |
| Stickers | Partly: twin clumps and lone pebbles remain |
| Too small on a phone | Fixed. The glints overshot |
| Motion | Partly: everything but the wind |
| Depth | Partly: the tree is as sharp as the ground |
| Biomes | Partly |
| Events | Fixed |

## The pond: still wrong, worst first

1. **A bullseye.** Five ovals inside each other with an even pale band of sand. Keep sand from seven to eleven o'clock only; from twelve to four bring a grass bank over the water, with a 5 / 4 / .35 shadow. Sand to #e6d6a8, so the daisies stay the lightest thing.
2. **The meadow is card.** Cut a fringe of 15 to 25 blades, 6 to 10 pixels tall, along the lip of the middle terrace; lit #a9c784, shaded #86ab73, shadow 1 / 1 / .30. Top terrace to #c3d296.
3. **The path is a projected stripe, not pressed.** Opaque #cfd6a2, a 1-pixel dark line on its upper-left edge (#8fae78) and a pale one on its lower right (#e6eabc), shifted 3 pixels sideways at each step. Widen its mouth into the sand.
4. **Glints.** Five fat near-white crescents up to 25 pixels, the brightest marks in the frame. At most three, 12 by 1.5 pixels, #dff1ee, lying along the wind.
5. **The top-right cluster.** Ten things, all 10 to 20 pixels. The log is 54 by 11 pixels beside a 90-pixel creature: a twig. One log 150 by 34 pixels entering from the top edge, shadow 7 / 5 / .30; drop the blue flowers.
6. **Twins and strays.** The two daisy clumps match: make the left one grass with one small daisy. Delete the pebble at the bottom of the sand; move the far one to the landing.
7. **Pads** float over a hole two sheets deep with a 1-pixel shadow. Add a second shadow on the deep sheets only, 9 / 4 / .28 in #173f4c.
8. **The tree** is as sharp as the ground. Blur it 1.2 pixels; leave two bright gaps of 16 pixels in its shade.

## The four other biomes, weakest first

- **Highlands.** A stepped octagon with creases from its centre reads as a parasol, and a snow peak three creatures wide is the wrong scale. Draw an outcrop: a mass of rock entering from the top right, three or four overlapping slabs with uneven offsets of 14 to 30 pixels and parallel scores for strata; tops #c8c1b1, #b8b1a2, #a9a294, shaded facets #86807c, shadow 6 / 2 / .40. Turf #b4bd8e, gravel #cfc8b4 at the foot, scree as one fan from a notch, 30 to 40 pieces with the largest lowest. Snow as a torn drift in the lee, its shadow #9aa6d8. The tarn against the rock.
- **Dunes.** Three matching hoof prints. Vary their size three to one and join two into a ridge; swap the pale inner oval for a darker slip-face sheet, #c9a970; ripples as long scores, not dashes.
- **Marsh.** A dry lakebed with a river of tar. Cracks as dark gaps (#8f7d5c) on the far third only; a sheet of sedge, #7d9a5e, on the banks.
- **Woodland.** The mood is right. Roots with leaves strung along them read as branches seen from the side. Three roots, not five: 24 pixels at the trunk tapering to 3 over 140, with a folded ridge (lit #8a6248, shaded #5a3d2c), shadow 5 / 3 / .40, each diving under a slit in the floor. Litter off the roots and into two drifts of 12 to 20 overlapping leaves in the windward crooks, muted to #a86f3e and #8a5a36. Sun as light, not lime ovals: #fff2b0 at 35%, softened 3 pixels, falling across roots, litter and creature alike.

## Events

- **Rain.** Puddles with dark halos and rings inside each other read as eyes. No halo, one ring to a drop, fill #c9d8dc.
- **Winter.** The best. The lilac shadow is too saturated: #a9aed2.
- **Fire.** The airbrushed glow in the char is the least papery thing here. Two cut sheets, #c8641e and #7a3a1c.
- **Night.** The moon's slivers are a symmetric waveform; make them uneven.

## What would raise it most

1. End the uniform drop shadow. Each piece gets a contact shadow, 1 / 1 / .35, and a lift shadow from a copy turned 2 to 4 degrees about its glued end.
2. Hand-cut edges: break every curve into short straight cuts, with about half a pixel of wander every 10 pixels; a 1-pixel pale line on lit edges and a dark one on shaded edges.
3. Three stocks, with the grain turned for each piece and broken at every cut: fibrous for grass, toothy for sand, smooth for water.

## The ceiling

Shapes drawn in code top out near 8 for paper: a very good paper-cut illustration. Real curl, bounced light, torn fibre and camera focus need scanned paper and photographed edges loaded as images, or pictures lit with a stored surface direction.
