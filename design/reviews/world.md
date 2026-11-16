# Review: the world, its design and motion

15 November 2026. An independent reviewer, shown screenshots only: the pond scene, the same at phone density, six frames of it over 12.5 seconds, and the range tests of four other biomes and four events. Sizes are CSS pixels; 1 mm is about 6 px on the phone.

## Scores (5 is a competent prototype)

| | Score | Why |
|---|---|---|
| Composition | 4.5 | Three heavy corners, an empty centre, and the best asset, the pond, cropped off the bottom right |
| Light and atmosphere | 4.5 | Pleasant pastel but flat; no felt light direction, no darks, shade reads as smudges |
| World motion | 3 | Over 12.5 s only the butterfly and the fish visibly change |
| Biome identity | 3.5 | Woodland reads; the other three are a recolour plus one pattern |
| Events | 3 | Overlays and icons on an unchanged world; only night has mood |

## What works

- The pond's stepped cut-away depths with a white cut edge: the one place that reads as layered paper. Make it the template.
- Stacked stones, the log with toadstool discs, the serrated folded canopy leaves.
- The coral creature as the only warm saturated shape.

## The main scene, worst first

1. **No height.** Terraces are split by a thin dark line and read as map zones. Use one light from the upper left and a ladder of shadows, as offset / blur / alpha: props 2/2/.30; a terrace step 4/3/.35 plus a soft pass 10/14/.12; creature 6/5/.30; bush 12/8/.25; canopy 28/14/.20. A 1 px pale lip on light-facing edges only. Higher sheets lighter and warmer, about 6% for each step.
2. **Values too narrow.** Take deep water down to about 25% lightness. Shadows a cool multiply, not grey. A frame-wide gradient, 6% warmer at the top left to 8% cooler at the bottom right. Cut the corner foliage's saturation by a fifth.
3. **Composition.** Props are evenly scattered and the creature stands in the emptiest field. Put the pink lily on a thirds point with the whole deep pool in frame. Cut a pressed, lighter path about 45 px wide in an S from the top left to the sand. Keep three clusters only: the log, the landing, one clump of grass on a terrace edge. Remove the bottom-left bush and the pale disc right of the pond.
4. **Shade is not light.** Blurred patches with no caster in view read as stains. Cast shade only from something on screen, as overlapping leaf shapes, blur 3 to 6 px, with bright gaps.
5. **Stickers.** Tufts are identical and isolated. Clump 3 to 7, scale 0.6 to 1.4, overlapping, rooted at edges.
6. **Phone size.** Ripple slivers, the small flowers, the fish and the butterfly are too small. At least 12 px for an object and 1.5 px for a line.
7. **Motion.** A sway of 2.5° moves a tuft's tip under a pixel. Replace the separate wobbles with one wind field: angle = A·sin(2πt/T − k·distance along the wind). T 4 s, wavelength 1.5 screens, A 3° at rest and 9° in a 2.5 s gust every 9 to 14 s. Reeds 5° with a 0.3 s lag; canopy 3°, its dapples riding with it. Glints on the water fading over 1.2 s. Pads ±4° and ±1.5% in size on 5 to 6 s cycles. A rise-ring every 20 to 40 s, and rings where the creature drinks. Grass within 30 px of the creature bends away and springs back in 0.6 s. The butterfly lands for a few seconds. A cloud shadow every 45 to 60 s.
8. **Depth.** A follow-drift of ±12 px with the canopy moving half as far again, and the canopy blurred 1 px. A drifting petal now and then, its shadow 10 px off.

## Biomes and events

- **Highlands:** concentric ovals read as a target. Angular off-centre faceted sheets in warm grey with hard step shadows; fans of scree at each foot; snow with a blue shadow and rock poking through; a dark tarn.
- **Woodland:** shade blobs read as ponds, litter as confetti, the stump as a turtle. Invert it: a dark floor with a few sharp coins of sun; litter banked in drifts against long tapering roots.
- **Dunes:** the scallop pattern is fish-scale wallpaper. Crescents all facing one wind, a sharp lee shadow and a soft windward side; broken ripple scores on windward faces only; marram leaning on crests with arcs scribed in the sand.
- **Marsh:** one braided channel entering and leaving the frame; tea-dark water with one pale sliver of sky; a glossy wet margin, then cracked plates; reeds in stands of 10 to 30 on outer bends.
- **Rain:** darker, more saturated ground, cast shadows nearly gone; rain at two depths with splash rings; puddles appearing in the lowest terrace.
- **Winter:** an off-white sheet on each terrace with lilac-blue step shadows and a fringe of grass at lee edges; shadows two and a half times longer; ice as vellum with scored cracks; pressed tracks.
- **Fire:** a moving front: a browned curl, a glowing rim, char, ash; tongues along the front only; an orange pool of light on ground and creature; smoke sheets downwind casting shadow.
- **Night:** long cool moon shadows and a pale rim on edges; each firefly a warm pool; the moon a crisp disc broken into sliding slivers.

## Rules for composing any screen

1. At most three terraces and one cut-down; overhang on one corner only.
2. Sixty per cent quiet paper, in one piece, where the creature walks; no more than twelve per cent dense detail.
3. Three clusters, at junctions: where an edge meets water, at the foot of a trunk or rock. Nothing isolated or evenly scattered.
4. One S or C line, a path or a shore, leading from a screen edge to a focal feature on a thirds point. Water leaves by one edge at most.
5. One light direction for the whole game. Shadow length is height. Warm light, cool shadow. The strongest contrast at the focal feature. One mass of shade, 15 to 25% of the frame, attached to what casts it.
6. The creature is always the most saturated shape. The scene reads in three values at thumbnail size.
7. One hero mover and one secondary. Ambient movement under 3 px except in gusts; no ambient cycle shorter than 3 s.
8. Weather and time are built in order: the state of the ground, then the light (angle, length, temperature), then a layer in the air with its own shadows, then the creature's reaction. Never a tint alone.

## First five

1. The shadow ladder, the lit lip, cool shadows.
2. Recompose: pond to thirds, a path, three clusters, one corner cleared.
3. Widen the values; dapples in place of smudges.
4. A wind field, glints, grass that reacts, follow-drift.
5. Events as ground, light and air; then one signature form for each biome.
