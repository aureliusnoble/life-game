# Art direction

November 2026. Work in progress. Nothing here is final art. `design/look.md` takes this further: the paper rules, body language, the eight places, the interface's direction and sound.

## Decided

- **Soft critters, not microbes.** Chosen after the first mockup (`design/mockups/creature-styles.html`).
- **Paper lagoon is the favourite** of the four directions in the second study, and the one to take further.
- **"Expressive" means two things.** More variety in the parts a creature can be built from, and bodies that show what the creature is doing and feeling. The second matters a great deal because there are so many moods and acts to show.
- **The second study has rendering artifacts** to track down and fix.
- **The first mockup was only a start.** The brief from that review:
  - a cute look that is the game's own, found by exploring the design space;
  - critters that are far more varied and expressive;
  - environments that feel designed, beautiful and relaxing;
  - a real rendering approach: shaders, lighting, and drawn assets placed by procedural rules.

## Second study: four directions

`design/mockups/art-directions.html` renders one pond and one cast of critters four ways, each at morning, golden hour and night.

| Direction | Material | Feel | Notes |
|---|---|---|---|
| Clay hollow | Matte modelled clay | Stop-motion, dappled shade | Parts melt into the body, so any combination looks deliberate |
| Jelly cove | Translucent, glossy | Toy-like, bright; glows at night | The most distinctive in motion |
| Felt garden | Needle felt and stitching | Warm, handmade | Needs the least lighting, so the cheapest to draw |
| Paper lagoon | Cut and layered paper | Picture book | Likely the best for portraits and share cards |

How it is built:

- **One scene, four materials.** The pond, the props and the critters are described once. Each look is a different way of shading the same shapes.
- **Bodies are blended shapes, not sprites.** A critter is a body plan (bun, tadpole, pear, bean, noodle, chonk) with parts merged into it, so parts never look stuck on.
- **One light.** Bodies and props are shaded from a single light, cast shadows, and change with the time of day.
- **Placement rules.** Reeds along the shore, flowers in sun, mushrooms in shade, lily pads over deeper water.

What it does not have: any drawn texture or painted plant, any composed landmark, sound, or a measured frame rate on a phone. The whole scene is computed per pixel, which is heavier than a production renderer would be.

## Principles to hold to

For critters:

- A big head, large low-set eyes and a tiny mouth close to the eyes.
- One signature feature per species that reads in silhouette.
- Expression through eyes, posture and movement, not through detail.
- A material that looks touchable.
- Colours that stand clear of the ground they live on.

For places:

- A limited palette per place, with large calm areas and detail gathered in clusters.
- Soft, directional light that changes through the day.
- Slow ambient movement: water shimmer, swaying plants, drifting leaves.
- Things placed for a reason, so the scene reads as a habitat.
- A visible edge to the world, like a terrarium or a diorama.

## Engine and pipeline: proposal

- **Stay on the web.** Shaders and lighting are available there, as the study shows, and the web is still the only target that can be built and shipped from cloud sessions.
- **PixiJS for sprites, assets and interface; custom shaders for critters, lighting and finishing effects.**
- **A hand-made asset kit.** Ground textures, plants and stones painted as images with a matching height map, so the same light falls on them as on the critters.
- **Rules place the assets;** a person arranges the landmarks.
- **A scene workbench page** in the repo for composing and lighting a place by eye.
- **Godot** has a better scene editor and built-in 2D lighting. The earlier research found its web export weak on iPhones, so choosing it would mean shipping native apps. Worth revisiting only if arranging scenes by hand becomes the bottleneck.

## Next

1. ~~Choose a direction.~~ Paper lagoon.
2. Take Paper lagoon deeper: more body plans and parts, a way of showing each act and mood on the body, and a place composed with landmarks.
3. Measure frame rate on a mid-range phone and move the heavy parts out of the per-pixel path.
