# Tech stack, engines, architecture and hosting for a mobile-first creature-ecosystem web game (as of 14 Nov 2026)

Research conditions (read before relying on these notes): the shared web-search budget for this session ran out part-way through, and WebFetch could only reach `github.com` (blocked: spacetimedb.com, developers.cloudflare.com, colyseus.io, docs.screeps.com, chrishecker.com, firt.dev, en.wikipedia.org, pmc.ncbi.nlm.nih.gov, journals.plos.org, gamedeveloper.com). Consequences: (a) many vendor facts come from search-result summaries of the vendor page rather than a full read of it; (b) the designer's late scope addition (section 3) arrived after the search budget was gone, so most of its game examples are prior knowledge and are labelled as such. Version numbers and dates taken from GitHub release pages are the most reliable items here. Anything marked "[prior knowledge, unverified]" was not checked against a source in this session.

---

## 1. Client engine/renderer for mobile web (PixiJS, Phaser, Three.js, Babylon, PlayCanvas, Godot web, Unity Web, Defold, Bevy, Excalibur, KAPLAY, Canvas2D, UI + canvas; WebGPU status)

### Takeaway
For a touch-heavy editor plus a zoomable 2D world on mid-range phones, a JS-native renderer (PixiJS v8, or Phaser 4 if a full framework is wanted) with a DOM/framework UI layered over the canvas is the low-risk choice; WASM engines (Godot, Unity, Bevy) bring multi-megabyte payloads and documented iOS Safari fragility for no benefit at this game's scale. WebGPU is now shipped on iOS 26+ Safari and Android Chrome 121+, but WebGL2 must remain the baseline and nothing in this design needs WebGPU.

### Cited Findings

**PixiJS**
- Latest is v8.23.0 (11 Nov 2026); v8.22.0 (1 Oct 2026), v8.21.0 (17 Sep 2026), v8.20.0 (20 Aug 2026), v8.19.0 (4 Jun 2026). Release cadence is roughly monthly. — [PixiJS GitHub releases](https://github.com/pixijs/pixijs/releases)
- Mobile-relevant recent changes: v8.21 loads each renderer backend only when active (separate chunks), sizes pooled textures to the screen instead of powers of two ("saving GPU memory on phones"), and restores the WebGPU renderer after device loss; v8.19 and v8.22 add transient MSAA attachments that help tile-based mobile GPUs; v8.23 adds `SmoothGraphics` and a Safari 27.x WebKit workaround; v8.18 added a `preference` array to restrict the renderer fallback chain and `graphicsContextToSvg()`. — [PixiJS GitHub releases](https://github.com/pixijs/pixijs/releases)
- v8 integrated WebGPU as a core renderer alongside WebGL, with fallback to WebGL when WebGPU is unavailable; a single-package import root improved tree-shaking; the launch post's Bunnymark numbers compare v7 vs v8 only (large CPU/GPU frame-time gains at 100k sprites), not other engines or phones. — [PixiJS v8 launch post](https://pixijs.com/blog/pixi-v8-launches)
- A third-party article states the default renderer is still WebGL, with `preference: 'webgpu'` to opt in, and that the official docs treat WebGPU as experimental; other sources claim WebGPU is automatic. Conflict unresolved; set the preference explicitly. — [issoh.co.jp article](https://www.issoh.co.jp/md/tech/9180); contradicted in part by the generic claims summarised from [PixiJS v8 launch post](https://pixijs.com/blog/pixi-v8-launches)
- v8.16.0 added an experimental Canvas renderer for environments without WebGL/WebGPU. — [PixiJS 8.16.0 blog](https://pixijs.com/blog/8.16.0)
- Bundle size: no official gzipped figure found. Third-party pages conflict (PixiJS ~450 KB minified vs Phaser ~1.2 MB minified on one; ~150 KB gzipped core on another; 400–500 KB gzipped on a third table). Treat as unverified. — [abratabia PixiJS vs Phaser](https://abratabia.com/pixijs/pixijs-vs-phaser.php); [generalistprogrammer comparison](https://generalistprogrammer.com/comparisons/phaser-vs-pixijs)
- An official Spine runtime for PixiJS v8 exists. — [Esoteric Software blog](https://de.esotericsoftware.com/blog/spine-pixi-v8-runtime-released)

**Phaser**
- Phaser v4.0.0 "Caladan" shipped 10 Apr 2026; v4.1.0 (30 Apr), v4.2.0 (19 Jun), v4.2.1 (9 Jul 2026, bug-fix). Nothing newer was visible on the releases page as of this research. — [Phaser GitHub releases](https://github.com/phaserjs/phaser/releases); [phaser.io stable download](https://phaser.io/download/stable)
- v4 is a new node-based WebGL render architecture with a unified Filter system, `SpriteGPULayer` and `TilemapGPULayer`; v4.2 added `Mesh2D` triangle rendering, stencil objects and cone lights; an RC note reported large filter speedups on mobile and ~16 MB RAM/VRAM freed. — [Phaser GitHub releases](https://github.com/phaserjs/phaser/releases)
- "Almost everything exciting in Phaser 4 is WebGL-only"; the Canvas renderer is deprecated and WebGL is the default for new projects. There is no WebGPU renderer. — [Phaser 3 vs Phaser 4 (phaser.io, May 2026)](https://phaser.io/news/2026/05/phaser-3-vs-phaser-4); [Phaser 4 renderer article](https://phaser.io/news/2026/04/phaser-4-renderer-faster-cleaner-and-built-for-modern-games)

**Cross-engine rendering benchmark (old, desktop)**
- At 10,000 sprites: Kontra 60 FPS, Babylon.js 56, PixiJS 47, Phaser 43, Kaboom/KAPLAY 3. Test machine was a Ryzen 5 4500U laptop on Edge 109 (i.e. early 2023, pre-PixiJS v8 and pre-Phaser 4); no phone results, no library versions. — [Shirajuki/js-game-rendering-benchmark](https://github.com/Shirajuki/js-game-rendering-benchmark)

**Three.js / Babylon.js / PlayCanvas**
- Three.js latest is r187 (30 Oct 2026); r186 (24 Sep), r185 (1 Jul). Recent notes are dominated by WebGPURenderer/TSL work (parallel pipeline compilation, WebXR on WebGPU). — [three.js GitHub releases](https://github.com/mrdoob/three.js/releases)
- Third-party comparisons describe Three.js's WebGPURenderer as production-ready since about r171 (Sep 2025) with automatic WebGL2 fallback; Babylon.js 8.0 moved core shaders to native WGSL and 9.0 added compute-based features; PlayCanvas engine v2.0 (Aug 2024) dropped WebGL1 and is MIT. These are vendor/marketing-style pages. — [utsubo comparison](https://www.utsubo.com/blog/threejs-vs-babylonjs-vs-playcanvas-comparison); [cinevva Three.js vs Babylon.js](https://app.cinevva.com/guides/threejs-vs-babylonjs); [cinevva PlayCanvas vs Three.js](https://app.cinevva.com/guides/playcanvas-vs-threejs)

**Godot 4.x web export**
- Latest stable is Godot 4.7.2 (18 Aug 2026); 4.7 shipped 18 Jun 2026. — [Godot GitHub releases](https://github.com/godotengine/godot/releases)
- Official docs (master): web export "can run on mobile" but native exports perform significantly better; since 4.3 the single-threaded export is the default and "works well on macOS and iOS, where multi-threaded exports had compatibility problems"; threaded builds need SharedArrayBuffer and COOP/COEP headers (or the PWA service-worker workaround); Safari has WebGL 2.0 issues other browsers do not; only the Compatibility (WebGL 2) renderer works on web; WebGPU is not supported; Godot 4 C# projects cannot be exported to web; `.wasm` gzips to about a quarter of its size. — [godot-docs exporting_for_web.rst](https://github.com/godotengine/godot-docs/blob/master/tutorials/export/exporting_for_web.rst)
- 4.7's main web change is wasm64 export; rendering is still WebGL 2 only (a beta-era claim of WebGPU export was corrected). — [cinevva Godot 4.7 release note](https://app.cinevva.com/news/2026-06-19-godot-4-7-released)
- Payload size: one 2026 example reports a single-threaded Godot 4.7.2 `index.wasm` of 39,514,754 bytes before compression (≈10 MB at the docs' ~1/4 gzip ratio); guides give 10–30 MB typical uncompressed wasm. Exact source page for the byte count was not re-opened. — [Godot forum thread surfaced in search](https://forum.godotengine.org/t/web-export-with-minimal-custom-py-causes-self-crossoriginisolated-error-on-self-signed-https/136123); [ziva.sh guide](https://ziva.sh/blogs/godot-web-export)
- User reports of iOS trouble across 4.3–4.5: WebGL context loss on iOS 18, random crashes/reloads, audio-triggered crashes after 1–3 minutes, time-outs when streaming more than ~100 MB. — [forum: WebGL context loss 4.3 iOS](https://forum.godotengine.org/t/webgl-context-loss-and-app-crash-in-godot-4-3-exported-web-on-ios-browsers/81024); [forum: random crashes on iOS](https://forum.godotengine.org/t/game-crashes-randomly-on-ios-devices-html-export/114043); [forum: sounds crash on mobile, 4.5 dev5](https://forum.godotengine.org/t/sounds-crash-my-web-game-on-mobile-browser-godot-4-5-dev5-html-export-on-itch/113237); [forum: iOS web export suddenly crashing](https://forum.godotengine.org/t/web-export-to-ios-suddenly-crashing-after-working-for-ages/120627)

**Unity Web / Defold / Bevy**
- Empty-build sizes: an older Defold forum test measured Defold HTML5 at 881 KB gzipped (734 KB with app manifest) vs Unity wasm-only 2.7 MB gzipped; a community test lists Unity 6000.0.34f1 minimal web builds at 3.38 MB (built-in pipeline) and 6.10 MB (URP); a 2026 marketing guide claims ~1.14 MB Defold vs ~8 MB Unity vs ~9 MB Godot with no methodology. — [Defold forum](https://forum.defold.com/t/build-size-auto-stripping-or-manual-configuration/1819/65); [UnityWebGL-LoadingTest listing](https://awesome.ecosyste.ms/projects/github.com%2Fjohannesdeml%2Funitywebgl-loadingtest); [cinevva Unity alternatives guide](https://app.cinevva.com/guides/unity-alternatives-web-games)
- Bevy latest is v0.20.1 (28 Oct 2026); v0.20.0 (8 Oct), v0.19.1 (13 Aug). — [Bevy GitHub releases](https://github.com/bevyengine/bevy/releases)
- Bevy web builds default to WebGL2 with WebGPU opt-in; a maintainer said (2023) aggressive size optimisation gets a build to "12MB or less". — [Bevy + WebGPU post](https://bevy.org/news/bevy-webgpu/); [r/rust thread mirror](https://axebps-redlib.hf.space/r/rust/comments/13lb0h8/bevy_webgpu/jkpa8mx/?context=3)

**Excalibur / KAPLAY**
- Excalibur's latest found release is v0.32.0 (3 Nov 2025); still 0.x with a 1.0 roadmap. — [newreleases.io Excalibur v0.32.0](https://newreleases.io/project/github/excaliburjs/Excalibur/release/v0.32.0); [Excalibur GitHub](https://www.Github.com/excaliburjs/Excalibur)
- KAPLAY v4000 was still in alpha (alpha 26, 20 Jan 2026) in the latest material found; npm stable line is 3001.0.16. — [KAPLAY v4000 alpha 26 post](https://kaplay4000.pages.dev/blog/release-v4000-alpha-26); [kaplay on npm](https://npmjs.com/package/kaplay)

**WebGPU status**
- MDN browser-compat-data for the `GPU` interface: Chrome Android from 121; Safari from 26 (iOS Safari mirrors it); Firefox desktop from 141 (partial, platform-limited); Firefox Android: not supported; desktop Chrome full (incl. Linux) from 144. — [mdn/browser-compat-data api/GPU.json](https://github.com/mdn/browser-compat-data/blob/main/api/GPU.json)
- Chrome Android support requires Android 12+ and Qualcomm/ARM GPUs; Safari 26.0 (announced 15 Sep 2025) brought WebGPU to iOS 26/iPadOS 26/macOS; all iOS browsers inherit it because they use WebKit. — [web.dev: WebGPU supported in major browsers](https://web.dev/blog/webgpu-supported-major-browsers)
- A news item dated 17 Sep 2026 is titled for Safari 27 with WebGPU clip-plane support (title only seen), and PixiJS 8.23 carries a Safari 27.x-specific WebGPU workaround, i.e. WebKit's WebGPU is still changing release to release. — [cinevva Safari 27 news](https://app.cinevva.com/de/news/2026-09-17-safari-27-model-element-webgpu-clip-planes); [PixiJS GitHub releases](https://github.com/pixijs/pixijs/releases)

### Inferences
- Fit ranking for this game (2D creatures, editor UI, portrait phone, solo dev with AI agent): PixiJS v8 + DOM UI > Phaser 4 + DOM UI > Three.js orthographic (only if a 2.5D/tilted look is chosen) > plain Canvas2D (fine for prototypes and the design-time sandbox; struggles with hundreds of soft creatures plus effects) > Excalibur/KAPLAY (pre-1.0 or alpha; KAPLAY's sprite throughput in the only benchmark found was far behind) > Godot/Unity/Defold/Bevy web (payload, iOS risk, UI in-engine, weaker fit with a TypeScript shared-sim monorepo).
- PixiJS is a renderer, not a framework: the game supplies its own loop, camera and input. That suits a game whose simulation lives in a separate shared package and whose client is mostly "draw interpolated snapshots + editor UI".
- UI: build the editor, recaps, lists and settings in DOM (React, Svelte or Solid) over or beside the canvas. DOM gives text input, scrolling, accessibility and layout for free and is the thing AI coding agents are best at. Reserve the canvas for the world view and creature preview. Pinch-zoom/pan needs `touch-action: none` on the canvas and custom gesture handling. [prior knowledge, unverified]
- WebGPU: treat as optional progressive enhancement. Coverage gaps remain (iOS < 26, Android < 12, non-Qualcomm/ARM GPUs, Firefox Android), and nothing at "hundreds of 2D creatures" requires compute shaders.
- Godot's inability to export C# to web plus GDScript-only sim code would break the "same sim code on client and server" goal unless the sim is a separate WASM module.

### Gaps
- No phone benchmarks (mid-range Android or iPhone) comparing PixiJS v8, Phaser 4 and Canvas2D were found; the only cross-engine benchmark is a 2023 desktop test.
- No authoritative gzipped bundle sizes for PixiJS v8.23 or Phaser 4.2 (measure with a real Vite build).
- Unity 6 official mobile-browser support status and Defold's current HTML5 size were not verified from primary sources (the Defold build-size repo page shows only a graph image).
- Babylon.js 9 and PlayCanvas current versions/dates were not confirmed from release pages.
- Could not verify whether Phaser has announced a WebGPU roadmap.

---

## 2. Cute procedural creature rendering: techniques, feasibility on phones, and what reads as "cute"

### Takeaway
The cheapest believable route is physics-flavoured procedural animation of simple primitives (distance-constrained chains, a soft body of a few points, FABRIK legs), not retargeted keyframes; Spore's own system depended on animator-authored motion plus a research-grade IK solver. Cuteness is driven mainly by proportion and eyes (baby schema: round face, high forehead, big eyes, small nose/mouth), which cost almost nothing to render.

### Cited Findings
- Spore's creature animation (Hecker, Raabe, Enslow, DeWeese, Maynard, van Prooijen; ACM TOG 27(3), SIGGRAPH 2008) records animator-authored animation in a morphology-independent form, then at runtime applies it to a specific creature to produce pose goals for "a robust and efficient inverse kinematics solver"; animators keep a Maya-style keyframing workflow and specify the semantics of the animation. It is retargeting of hand-made animation, not animation from nothing. — [Chris Hecker's paper page](https://chrishecker.com/Real-time_Motion_Retargeting_to_Highly_Varied_User-Created_Morphologies); [ACM DOI](https://doi.org/10.1145/1360612.1360626); [PDF mirror](https://www.cse.chalmers.se/edu/year/2011/course/TDA361/Advanced%20Computer%20Graphics/027-hecker%20copy.pdf)
- argonaut's "procedural animation of a fish, a snake, and a lizard" is open source (MIT, Processing; `Chain.pde`, `Fish.pde`, `Snake.pde`, `Lizard.pde`; 721 stars; created Mar 2024) with an explanatory video. — [argonautcode/animal-proc-anim](https://github.com/argonautcode/animal-proc-anim); [video](https://www.youtube.com/watch?v=qlfh_rv6khY)
- The core technique: a chain of joints, each held at a fixed distance from its neighbour; the head follows a target and the rest only satisfy the distance constraint; legs use FABRIK (forward and backward passes of the same constraint); angle limits are added because distance alone gives a floppy chain. — [write-up of the technique](https://battesonb-github-io.pages.dev/2024/11/16/procedural-animation); [Observable notebook implementation](https://observablehq.com/@real-john-cheung/procedural-animation-1); [r/bevy post: chain constraints after argonaut's video](https://redlib.librenode.com/r/bevy/comments/1iz2j4c/implementing_chain_constraints_in_bevy_for_smooth)
- Rain World (GDC 2016 Animation Bootcamp, Joar Jakobsson and James Therrien): creature motion is produced by code and physics rather than drawn or rigged animation; the slugcat body is two physics chunks held at a fixed distance, with sprites drawn over the simulation. — [Game Developer coverage of the GDC talk](https://gamedeveloper.com/art/video-animating-i-rain-world-i-and-its-many-squishy-stretchy-creatures); [Unity blog on Rain World procedural design](https://unity.com/blog/exploring-procedural-design-rain-world)
- Other open examples: a LÖVE2D desktop "lizard pet" with IK-based procedural animation; a Unity Spore-inspired creature generator; `algovivo`, a JavaScript/WASM energy-based soft-body creature simulator (389 stars, updated Nov 2026). — [GitHub topic: procedural-animation](https://github.com/topics/procedural-animation); [juniorrojas/algovivo via GitHub topic artificial-life](https://github.com/topics/artificial-life)
- SDF blending: Inigo Quilez's polynomial smooth-minimum (`smin`) costs a few operations per pair and is the usual choice for a small number of shapes; exponential/power variants generalise to many shapes and are order-independent but cost `exp`/`pow` per evaluation; smooth-min results are not exact distances. — [iquilezles.org: smooth minimum](https://iquilezles.org/articles/smin); [iquilezles.org: distance functions](https://iquilezles.org/articles/distfunctions)
- Rive ships two web runtimes, `@rive-app/webgl2` (recommended) and `@rive-app/canvas`, and notes browsers cap the number of WebGL contexts per page; it has IK constraints; runtimes are MIT with no royalties. Spine runtimes require a Spine Editor licence to integrate. — [Rive docs: canvas vs WebGL](https://rive.app/docs/runtimes/web/canvas-vs-webgl); [Rive IK constraint docs](https://rive.app/docs/editor/constraints/ik-constraint); [Rive vs Spine (vendor page)](https://rive.app/rive-vs-spine); [Spine forum on runtime licence](https://ru.esotericsoftware.com/forum/d/24018-runtime-license-question)
- Baby schema: Glocker et al. (Ethology 115, 2009) manipulated 17 infant photos into high baby-schema (round face, high forehead, big eyes, small nose and mouth) and low baby-schema versions; high baby-schema faces were rated cuter and raised motivation for caretaking. The concept is Lorenz's (1943): large head relative to body, large low-set eyes, rounded cheeks. — [Glocker et al. 2009, UPenn repository](https://repository.upenn.edu/entities/publication/2bfa14b1-140d-43bc-94ac-6dbffa99194a); [PMC copy](https://pmc.ncbi.nlm.nih.gov/articles/PMC3596402)
- A later study/review reports that a large forehead with a small chin and large eyes makes a face look cute, and that cuteness ratings rise with the extent of Kindchenschema, in animal as well as human faces. — [Frontiers in Psychology 2014](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2014.00411/full)

### Inferences
- Technique fit for "assembled from player-chosen parts, cute, responsive to design":
  - Body: either a soft body of 6–16 perimeter points with pressure/shape-matching (gives squash-and-stretch for free) or a spine chain of circles with a smooth outline drawn around them (argonaut-style). Both are a few dozen floats per creature.
  - Attachments (ears, tails, antennae, fins): short verlet chains anchored to body points; they lag and settle, which is most of the perceived "life".
  - Face: eyes as separate sprites/shapes with pupil offset toward a look target, blink timer, and eyelid squash; mouth as 3–5 swappable shapes.
  - Rendering: draw the outline as a filled polygon/mesh (PixiJS `Graphics`/`SmoothGraphics`/mesh, or Phaser `Mesh2D`) rather than a per-pixel SDF. Use SDF/metaball shaders only for the close-up editor preview or microbe-style looks.
- Feasible budget for hundreds of on-screen creatures on phones (reasoned, not measured): simulate rigs on the CPU only for creatures that are on screen and above a zoom threshold; at mid zoom draw one baked sprite per species (render-to-texture whenever a design changes) with per-instance scale/rotation/squash and separate eye sprites; at far zoom draw tinted dots or tiny atlas sprites. Full-screen multi-shape SDF evaluation is the thing most likely to blow a mid-range phone's fragment budget, so confine SDFs to small quads.
- Rive/Spine/Lottie solve the wrong problem: they play authored animation on authored rigs. With player-assembled bodies the rig is not known in advance, so their strengths (timelines, state machines) do not transfer, although Rive could serve for fixed UI flourishes.
- Spore-style retargeting is out of scope for a solo hobbyist: it needs a library of authored motions and a solver robust to arbitrary morphologies. The same visible goal is reached more cheaply by restricting morphology (see section 3).

### Gaps
- No measurements exist in the sources found for shader or rig cost per creature on mid-range phones; a throwaway benchmark (N soft creatures at 3 LODs on a real Android and iPhone) should be an early spike.
- The Hecker paper and Rain World talk were not read in full (hosts blocked); details of body-part semantics, gait handling and secondary motion in Spore are not captured here.
- Rive and Spine current pricing was not confirmed from official pages.
- Research on eyes specifically (gaze following, blinking) as cuteness or attachment drivers was not retrieved.

---

## 3. Designer scope addition: creature complexity ladder, cuteness and attachment at low art cost, cheap rendering alternatives, camera, and world framing

### Takeaway
Rungs 1–3 (microbes, soft critters with faces, top-down limbed animals) are all achievable fully procedurally with no hand-keyed animation; the cost cliff is between rung 3 and rung 4 (side-view or 3D articulated animals), where Spore needed animator-authored motion and a research IK system. Rung 2 (soft-bodied critters with faces and attachable features) gives the most cuteness and attachment per unit of solo-dev effort, and can borrow rung-3 elements (tail chains, stubby stepping legs) incrementally.

### Cited Findings
- Rung 3 is demonstrably small in code: a fish, snake and lizard animated entirely by a shared distance-constraint chain plus per-animal files, in a two-commit MIT repo. — [argonautcode/animal-proc-anim](https://github.com/argonautcode/animal-proc-anim)
- Rung 3 animation is code and physics, not drawn frames, in a shipped commercial game (Rain World), with bodies as simple as two linked physics chunks. — [Game Developer coverage of the GDC 2016 talk](https://gamedeveloper.com/art/video-animating-i-rain-world-i-and-its-many-squishy-stretchy-creatures)
- Rung 4 in Spore was not hand-animation-free: animators authored motion in a morphology-independent form that an IK solver retargeted to each player creature. — [Hecker et al. 2008](https://chrishecker.com/Real-time_Motion_Retargeting_to_Highly_Varied_User-Created_Morphologies)
- Rung 1 reference points: The Bibites (2D microbe-like creatures) reports frame rates collapsing as entity counts grow and plans a Unity DOTS move for an expected 10–100x gain; Thrive (Godot + C#, 3.9k stars) and ALIEN (CUDA particles, 5.6k stars, updated Nov 2026) are the open-source microbe/particle-scale references. — [Bibites 0.6.2 devlog](https://thebibites.itch.io/the-bibites/devlog/973592/the-bibites-062-steam-workshop-and-toward-the-future); [Thrive](https://github.com/Revolutionary-Games/Thrive); [ALIEN](https://github.com/chrxh/alien)
- Cuteness evidence that maps directly to cheap geometry: round face, high forehead, big eyes, small nose and mouth raise cuteness ratings and caretaking motivation; the effect generalises to animal faces. — [Glocker et al. 2009](https://repository.upenn.edu/entities/publication/2bfa14b1-140d-43bc-94ac-6dbffa99194a); [Frontiers in Psychology 2014](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2014.00411/full)
- Procedural pixel-art sprites: the classic method (Dave Bollinger's pixel spaceships, reimplemented in JS under MIT) takes a 2D mask template, randomises the cells the mask allows, mirrors the result, and renders to canvas. — [zfedoran/pixel-sprite-generator](https://github.com/zfedoran/pixel-sprite-generator)
- Virtual-pet references in open source: a neural-network "pet squid" (Dosidicus, 334 stars) and an ESP32 virtual pet (catode32, 130 stars), both active in Nov 2026. — [GitHub topic: artificial-life](https://github.com/topics/artificial-life)

### Inferences

**The ladder (everything assembled from player-chosen parts)**

| Rung | Examples | What must move | Procedural recipe | Hand-keyed animation needed? | Solo-dev cost and risk | Cuteness / variety ceiling |
|---|---|---|---|---|---|---|
| 1. Microbes / cells | flOw, Osmos, Spore cell stage, Cell Lab, Bibites, Thrive | Membrane wobble, flagella/cilia, pulsing, drift | Noise on a blob outline or metaballs; sine-wave tails; parts stuck on the perimeter | None | Lowest. Days to a good look. Risk is sameness. | Low-to-medium. Abstract; variety is mostly colour, size and appendage count; hard to bond with an individual. |
| 2. Soft critters with faces and attachable features | LocoRoco, Kirby-like shapes, slimes, Pikmin Bloom / Neko Atsume level simplicity | Body squash-and-stretch, hop/waddle, eyes, attachments lagging behind | Soft body (few perimeter points) or scaled ellipse with squash; verlet chains for ears/tails/antennae; stub legs as alternating bobbing nubs (no IK); face layer | None | Low. One body system plus one attachment system covers every part. Risk: parts clipping on extreme designs. | Highest per unit effort: big head-is-body proportion and large eyes are baby schema by construction; silhouettes vary strongly with ears/tails/fins. |
| 3. Top-down limbed animals | Rain World, argonaut-style lizards/fish/snakes, insects | Spine curve, leg stepping, tail, head turn | Distance + angle constrained spine chain; FABRIK or 2-bone IK legs with step triggers; outline around chain | None | Medium. Gait tuning for arbitrary leg counts and placements, foot sliding, body self-overlap, more CPU per creature (needs LOD). | Medium-high variety (leg count, body length); cuteness harder because a top-down view shows backs, not faces, unless eyes are drawn on top. |
| 4. Side-view or 3D articulated | Spore creature stage | Weight, balance, ground contact, gaits per morphology, facing flips, occlusion/layering | Retargeted authored motion + robust IK, or learned/physics controllers | Yes in Spore's case (authored, then retargeted) | Very high; research-grade. Not realistic for a solo hobbyist. | Highest in principle, but failure modes (broken, creepy motion) are common. |

- Where the cost jumps: 1→2 is a small step with a large cuteness gain (add a face and springy attachments). 2→3 is a moderate step concentrated in gait logic and edge cases from player-designed bodies. 3→4 is a cliff: gravity, balance and facing make motion errors very visible, and no cheap fully procedural recipe produces reliably appealing results.
- A workable hybrid: ship rung 2 first, then let specific parts opt into rung-3 behaviour (a tail that is a real chain, 2–6 stepping legs with simple IK on a rounded body). This keeps the "one body system" simplicity while growing variety.

**What produces cuteness and attachment at low art cost** [prior knowledge, unverified, except the baby-schema items cited above]
- Eyes carry most of it: large, low on the face, widely spaced; visible pupils that track a target (the player's finger, food, another creature); random blinks; eyelids that half-close when tired or squint when happy. Each is a few lines of code and one or two sprites.
- Proportion: head-to-body ratio near 1:1 or head = body; short limbs; rounded silhouettes; small mouth. Stephen Jay Gould's essay on Mickey Mouse's drift toward juvenile proportions is the classic design-side reference.
- Motion: squash-and-stretch on landing and turning, anticipation before a hop, overshoot and settle on attachments (Disney's animation principles). Slight asynchrony between individuals avoids a "marching" look.
- Idle behaviours: looking around, yawning, sleeping at night, grooming, noticing nearby creatures. In an ecosystem sim these can be driven by real internal state (hunger, fear), which makes them informative as well as cute.
- Emotes and thought bubbles: a tiny icon (food, heart, zzz, !) above the head communicates the behaviour program's current state. Useful for debugging the player's program too.
- Sound: short pitched chirps whose pitch scales with body size, with small random variation; LocoRoco and Pikmin lean heavily on vocalisation for charm.
- Touch: tap to poke (jiggle + surprised eyes), hold to pet, drag a finger and have nearby creatures look at it. Reactivity to the player is a strong attachment driver in virtual pets.
- Perceived agency does not need detail: Heider and Simmel's 1944 experiment (viewers attribute intentions and emotions to moving triangles and circles) is the standard reference for behaviour mattering more than geometry.
- Attachment (Tamagotchi framing): persistent named individuals, a visible life course (baby → adult → elder over the 3–7 day lifespan), needs the player can influence, real loss, and a reason to check in (recaps, births, deaths, "your creature did X while you were away"). The "Tamagotchi effect" literature on emotional attachment to virtual agents is the keyword to follow up. Nittono et al. (2012, "The Power of Kawaii") is the reference for cute imagery changing viewer behaviour.
- Games loved for cuteness with very simple geometry: LocoRoco (coloured blobs with faces), Kirby (a ball with eyes and feet), Slime Rancher (spheres with faces), Neko Atsume (flat illustrated cats with a few poses; check-in loop very close to this game's cadence), the original Tamagotchi (tiny monochrome sprites), Pikmin Bloom, Osmos/flOw (appeal without faces, but calm rather than cute).

**Alternatives to shader-based procedural rendering**

| Approach | How design choices show up | Cost for solo dev + AI agent | Animation | Main risks |
|---|---|---|---|---|
| Procedural pixel art (Tamagotchi-like, e.g. 16–32 px) | Part choices select and place pixel templates; masks + mirroring + palette swaps give variation; baby/adult variants by scaling head ratio | Low. Tiny art surface; an agent can author templates as text grids. Very cheap to render (one atlas). | 2–4 generated frames (bob, blink, step) or procedural offsets per part | Parts read poorly at low resolution; fine distinctions between designs vanish; scaling/rotation looks rough unless kept on pixel grid. |
| Layered vector/SVG parts with tinting and procedural tweening | Each part is a vector shape with anchor points; colour, size, stretch and position are continuous parameters, so the result responds smoothly to the editor | Low-to-medium. Shapes can be written as code or SVG paths (agent-friendly, diffable); bake to textures per species for the world view. | Transforms on parts: squash, sway, bob, eye tracking; verlet for dangling parts | Looks flat unless outline, shading and overlap order are handled consistently. |
| Paper-cutout (rigid sprite parts on pivots) | Parts are swapped and pinned at joints; proportions change by scaling parts | Low if parts exist; art must be drawn or generated once per part | Rotation at pivots + bob; reads as puppet-like | Visible seams at joints; limited deformation; every new part needs art. |
| AI-image-generated part libraries | Discrete: the player picks from a catalogue; little continuous response | Low to generate, medium-to-high to curate | Same as cutout | Style and perspective drift between parts, inconsistent line weight and lighting, manual clean-up and alpha cut-outs, anchor points must be hand-set; licensing/copyright status of generated art varies by tool and jurisdiction and purely generated images may not be protectable. |
| Shader SDF / metaballs | Fully continuous; parts blend organically | Medium-to-high; hard for an agent to tune visually; GPU cost per pixel | Excellent squish | Phone fragment cost; hard to add crisp faces/patterns; debugging shaders on iOS. |

- Responsiveness ranking (how directly the player's design shows): SDF ≈ layered vector > procedural pixel art > cutout > AI-generated library. Cost ranking (cheapest first): pixel art ≈ layered vector < cutout < AI library (curation) < SDF. Layered vector parts with procedural motion is the best balance, and it is the natural rendering for rung 2.
- A pixel-art "portrait" of each species (or individual) can coexist with a vector world view: cheap to generate, strongly Tamagotchi-flavoured, and good for recaps, notifications and share images.

**Camera / perspective**
- Top-down: no gravity, no ground contact, no facing flips; movement is just heading rotation. Gaits can be faked (bobbing nubs) or done with simple IK. Cheapest for a large shared world and the natural fit for spatial ecosystem readability. Downside: faces point away from the camera.
- "Cheated" top-down (bodies seen from above, faces and eyes drawn toward the viewer on top of the body, as many cute top-down games do): keeps top-down costs while restoring the face. This is the recommended default.
- 3/4 view: adds depth sorting and usually 4–8 facing variants for sprites; with vector parts it means re-layering by facing. Moderate extra cost, nicer scenery.
- Side view: needs walk cycles with ground contact, turning, jump/fall, and terrain; highest animation cost and a very different (2D platformer-like) world model. Good for a single-creature close-up "habitat" screen, poor for a 1k–10k agent world.
- A separate close-up view (front-facing, large eyes, idle animations, touch reactions) can deliver the Tamagotchi feeling without changing the world camera.

**World framing by rung**
- Rung 1, microscope/petri dish: justifies blobs, drifting, simple chemistry (light, nutrients), no terrain. Visually calm; behaviours limited to chase/flee/eat/divide; little to hang nests, day/night or packs on.
- Rung 2, tide pool / pond / terrarium / garden: creatures small enough to be cute, world rich enough for features (rocks, plants, puddles, burrows). Supports nests, herding, sleeping at night, weather, seasons mapped to real days. A bounded container (terrarium, garden bed, pond) also explains a finite shared world and a spectating camera.
- Rung 3, garden/forest floor/reef at "bug and lizard" scale: supports predators with visible gaits, trails, territories and packs. More readable hunting behaviour, more animation and LOD work.
- Rung 4, savanna/island at animal scale: needs terrain traversal and believable locomotion; out of scope.

### Gaps
- This section was requested after the search budget was exhausted. LocoRoco, Neko Atsume, Tamagotchi (and the "Tamagotchi effect"), flOw, Osmos, Pikmin Bloom, Slime Rancher, Heider and Simmel (1944), Gould's Mickey Mouse essay, Nittono et al. (2012) and Disney's animation principles are cited from prior knowledge only; none was verified here. A follow-up pass should pull primary sources for each, especially design post-mortems for LocoRoco and Neko Atsume.
- No empirical source was retrieved on blinking, gaze tracking, sound or touch reactivity as attachment drivers; these are design-practice claims.
- No evidence gathered on AI image generation consistency for sprite part libraries (tools, workflows, 2026 licensing terms).
- Cell Lab's technology and look were not researched.

---

## 4. Simulation core: language/runtime, ECS, determinism, shared client/server code, fast-forward, persistence, tick rate

### Takeaway
TypeScript on Node or Bun with struct-of-arrays typed-array storage is sufficient for 1k–10k simple agents at 5–10 Hz and is the only option that trivially shares one sim package between the browser sandbox and the server; Rust/WASM is a later optimisation, not a starting point. Determinism is attainable in JS if the sim avoids `Math.sin`-style transcendental functions (or replaces them), uses a seeded PRNG and a fixed timestep.

### Cited Findings
- noctjs/ecs-benchmark (ops/sec, Node v17.8.0, variance 1–4%): bitECS packed_5 335,064 / simple_iter 115,954 / frag_iter 431,207 / entity_cycle 1,634 / add_remove 2,334; piecs 364,652 / 177,269 / 470,904 / 64,075 / 20,649; wolf-ecs 378,471 / 165,951 / 535,362 / 2,597 / 3,913; becsy 103,417 / 28,337 / 61,296 / 692 / 8,953; miniplex 109,296 / 36,316 / 20,372 / 310 / 6,645; ecsy 7,822 / 4,822 / 24,537 / 120 / 975. SoA libraries are roughly 3–10x faster at iteration than object-based ones; entity create/destroy is the weak spot of bitECS. No library versions or hardware given. — [noctjs/ecs-benchmark](https://github.com/noctjs/ecs-benchmark)
- A library author's test reports bitECS 0.4.0 at ~1.35 ns per entity on a 50,000-entity velocity→position loop vs ~12.15 ns for miniplex 2.0.0. (Author-run benchmark.) — [ecsia performance guide](https://andymai.github.io/ecsia/guide/performance)
- Another library's own benchmarks show rankings flipping by workload (bitECS ~8.7 ms vs Becsy ~13.5 ms on fragmented iteration; Becsy ~19 ms vs bitECS ~25 ms on add/remove). — [EliCS benchmarks](https://elixr-games.github.io/elics/benchmarks.html)
- bitECS: TypeScript, ~5 kB minzipped, zero dependencies, MPL-2.0, supports SoA and AoS, relations, built-in serialization, "thread-friendly"; 1.5k stars; used by Hubs and Third Room. — [bitECS README](https://github.com/NateTheGreatt/bitECS)
- Koota (pmndrs): ECS-based state management for TypeScript with React bindings, SoA storage for schema traits, relations, ISC licence, 771 stars, ships an `AGENTS.md` and a skills directory. — [pmndrs/koota](https://github.com/pmndrs/koota)
- WASM vs JS: no rigorous recent benchmark found; blog-level evidence says the JS↔WASM boundary and data copying erase gains unless data stays in linear memory or shared buffers; one 2026 post reports a Rust→WASM feature losing to TypeScript by 25% because of serialisation across the boundary. — [dev.to: Rust WASM vs TypeScript, why the faster language lost](https://dev.to/kunal_d6a8fea2309e1571ee7/rust-wasm-vs-typescript-performance-why-the-faster-language-lost-by-25-2026-4n51)
- Determinism: IEEE 754 guarantees identical results for `+ - * /` and `sqrt`, but `sin`, `exp`, `pow` etc. come from platform math libraries and can differ in the last bit; Rapier's JS docs say `Math.sin`/`Math.cos` are not cross-platform deterministic; a lockstep study got consistent runs across browsers, OSes and Intel/ARM after replacing `sin` with a custom approximation; deterministic WASM math libraries exist for JS. — [alice-det-math docs](https://docs.rs/alice-det-math); [Rapier JS determinism guide](https://rapier.rs/docs/user_guides/javascript/determinism); [arXiv 1705.09704, lock-step simulation](https://arxiv.org/pdf/1705.09704); [GbGr/deterministic_math](https://github.com/GbGr/deterministic_math)
- Spectator smoothing: the geckos snapshot-interpolation library keeps a "vault" of server snapshots and interpolates with a default buffer of three server frames (e.g. 50 ms frames + 50 ms latency → 200 ms buffer); pairs with a typed-array schema package for binary snapshots (BSD-3-Clause, 320 stars). — [geckosio/snapshot-interpolation](https://github.com/geckosio/snapshot-interpolation)
- A low snapshot rate such as 10 Hz adds interpolation delay on top of latency; quantising positions/orientations reduces bandwidth until artifacts appear. — [Gaffer on Games: Snapshot Compression](https://www.gafferongames.com/post/snapshot_compression/)
- Runtimes: Bun latest is v1.4.4 (22 Oct 2026); Screeps' open-source server requires Node.js 22 LTS or higher. — [Bun GitHub releases](https://github.com/oven-sh/bun/releases); [screeps/screeps](https://github.com/screeps/screeps)
- Cautionary reference: The Bibites (Unity, per-object simulation) degrades to single-digit FPS as populations grow and plans a data-oriented (DOTS) rewrite. — [Bibites 0.6.2 devlog](https://thebibites.itch.io/the-bibites/devlog/973592/the-bibites-062-steam-workshop-and-toward-the-future); [Bibites 0.5.0 devlog](https://thebibites.itch.io/the-bibites/devlog/464605/the-bibites-050-modernity-and-progress)

### Inferences
- Budget check (reasoned from the benchmark figures above): at 10,000 agents and 10 Hz the tick budget is 100 ms, i.e. 10 µs per agent per tick. A typed-array pass over 10k entities costs on the order of tens of microseconds per system, so raw ECS iteration is negligible; the costs that matter are the behaviour-program interpreter and neighbour queries. A uniform-grid spatial hash with integer cell keys in typed arrays keeps neighbour lookup near O(1) per agent. JS is comfortably adequate; measure before considering WASM.
- Because births and deaths are frequent in an ecosystem, prefer a fixed-capacity pool with free-list recycling over ECS add/remove churn (the benchmark shows entity cycling is where bitECS-style storage is slowest). A hand-rolled SoA "world" (a dozen `Float32Array`/`Int32Array` columns plus a free list) is small enough that an ECS library is optional.
- Design the sim as a pure package: `step(world, inputs) → world`, no I/O, no `Date.now()`, no `Math.random()`; seeded PRNG stored in world state; fixed timestep; integers or fixed-point where cheap; transcendental functions via lookup tables or a deterministic approximation. That single package then runs (a) in a Web Worker for the design-time sandbox, (b) on the server for the real world, (c) headless in Vitest/CLI for fast-forward balance runs, and (d) for replays (snapshot + input log).
- Fast-forward: with no rendering or networking, speed-up equals tick budget / tick cost. If a 10k-agent tick costs ~5 ms, a 10 Hz world fast-forwards ~20x on one core; batch balance tests can run many seeds in parallel with worker threads.
- Tick rate: with lifespans of 3–7 real days and players checking in a few times daily, 2–10 Hz is plenty; send spectators snapshots at 2–5 Hz and interpolate (buffer two to three snapshots). Higher rates mainly cost bandwidth and battery.
- Persistence: snapshot the SoA arrays as one binary blob (optionally compressed) every N minutes plus an append-only event log (births, deaths, design changes) for recaps; keep the last K snapshots for rollback. SQLite on the same machine is sufficient.
- Behaviour programs: run them in a tiny deterministic interpreter with an instruction budget per tick (Screeps-style CPU limit), never as raw JS. That gives safety, determinism and identical behaviour on client and server.
- Rust (Bevy ECS/hecs) native + WASM, Go or C# would all handle the load easily, but each breaks or complicates the one-language shared package and slows an AI-agent edit-test loop (compile times, FFI boundary). Reserve Rust/WASM for a proven hotspot.

### Gaps
- No direct JS-vs-WASM benchmark for spatial hashing or agent simulation was found; no 2025–2026 neutral ECS benchmark (the noctjs numbers are on Node 17).
- bitECS, Becsy and Miniplex current versions and release dates were not confirmed; Becsy's multithreading status was not checked.
- Go and C# server options were not researched beyond this inference.
- No source on whether V8's `Math.sin` etc. are bit-identical across current Chrome, Safari (JavaScriptCore) and Node; assume they are not.

---

## 5. Server, netcode and persistence: frameworks, always-on cost, auth, bandwidth

### Takeaway
A single always-on Node/Bun process with WebSockets and SQLite on a €5–7/month VPS is the simplest thing that satisfies "24/7 ticking world, 5–20 players", and it avoids the billing and eviction semantics of serverless actors. Colyseus 0.18 is the best-maintained TypeScript framework if batteries are wanted; SpacetimeDB 2.x is viable but couples the sim to a database runtime; Cloudflare Durable Objects can technically host one always-on world within included usage but are a poor fit for a CPU-heavy continuous tick.

### Cited Findings

**Frameworks and platforms**
- Colyseus: 0.17 added client auto-reconnection, a typed HTTP route API and `defineServer()`; 0.18 adds built-in client-side prediction and lag compensation, request/response messaging, Schema 5.0, `@colyseus/database` and `@colyseus/admin`, and is described as the last release before 1.0. Latest packages: `@colyseus/core` 0.18.28 and `@colyseus/sdk` 0.18.10 (10 Nov 2026), with transports for `ws`, uWebSockets, Bun WebSockets and h3, and new optional batching of per-tick messages into one socket write. — [Colyseus 0.17 post](https://colyseus.io/blog/colyseus-017-is-here/); [Colyseus 0.18 post](https://colyseus.io/blog/colyseus-018-is-here/); [Colyseus GitHub releases](https://github.com/colyseus/colyseus/releases)
- Colyseus pricing: self-hosting is free with no restrictions; Colyseus Cloud starts at $15/month. — [colyseus.io/pricing](https://colyseus.io/pricing); [Colyseus Cloud billing docs](https://docs.colyseus.io/cloud/pricing-billing)
- SpacetimeDB: 2.x line (crate 2.8.1; tag v2.7.0 seen); modules in Rust, C#, TypeScript (runs on V8; "new in 2.0"/beta) and C++; client SDKs for TypeScript, Rust, C#, Unreal; hot data in memory with an fsync'd commit log; clients connect directly and get "confirmed reads" by default since 2.0; BitCraft Online runs as a single module; licence is BSL 1.1 converting to AGPLv3 with a linking exception; self-host via `spacetime start` or Docker. — [SpacetimeDB GitHub README](https://github.com/clockworklabs/SpacetimeDB); [spacetimedb crate 2.8.1](https://docs.rs/crate/spacetimedb/2.8.1); [SpacetimeDB FAQ](https://spacetimedb.com/docs/intro/faq)
- SpacetimeDB ticking: "schedule tables" run a scheduled reducer at an interval; the docs' example is a 100 ms game tick; republishing a module can briefly interrupt scheduled reducers. — [SpacetimeDB schedule tables docs](https://spacetimedb.com/docs/tables/schedule-tables); [spacetimedb crate docs](https://docs.rs/crate/spacetimedb/2.8.1)
- SpacetimeDB pricing (Maincloud): Free $0/month with a monthly energy credit (the pricing page shows 2,500 TeV; the pricing announcement speaks of 1,000,000 TeV ≈ 650M reducer calls "free forever": the two figures do not obviously agree), Pro $25/month, Enterprise custom; billing is energy-based and includes bytes read. — [spacetimedb.com/pricing](https://spacetimedb.com/pricing); [pricing announcement](https://spacetimedb.com/blog/all-new-spacetimedb-pricing)
- SpacetimeDB scaling notes (third-party, unverified): reducers are serialised; a module cannot be sharded; rough estimates of 1–5 ms per tick at ~1K NPCs and 100–500 ms at 100K; claimed 100k+ TPS for TypeScript modules. — [repo-explainer: SpacetimeDB](https://repo-explainer.pages.dev/spacetimedb)
- Cloudflare Durable Objects pricing: Free plan 100,000 requests/day and 13,000 GB-s/day duration (SQLite-backed objects only; 5 GB storage, 100K rows written/day, 5M rows read/day); Paid plan 1M requests/month included then $0.15/M, 400,000 GB-s/month included then $12.50 per million GB-s; duration is billed at a fixed 128 MB whenever the object is active or idle-but-not-hibernatable; alarm invocations and incoming WebSocket messages (at 20:1) count as requests; outgoing WebSocket messages are free; each `setAlarm()` is a row written; paid SQLite storage includes 50M rows written/month and 5 GB. — [Cloudflare docs source: durable-objects-pricing.mdx](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/partials/durable-objects/durable-objects-pricing.mdx); [Durable Objects pricing page](https://developers.cloudflare.com/durable-objects/platform/pricing)
- Durable Objects hibernate after 10 s in a hibernatable state and stop accruing duration; `accept()`-style WebSockets and active JS keep billing; the WebSocket Hibernation API is recommended for sparse traffic. — [Durable Objects WebSocket best practices](https://developers.cloudflare.com/durable-objects/best-practices/websockets); [Durable Objects FAQ](https://developers.cloudflare.com/durable-objects/reference/faq)
- Billing foot-guns exist: posts titled around a $10,811 bill from an alarm loop in AI-written code and a "$34k in days" Durable Objects bug (titles only seen; details unverified). — [aiidelist post](https://aiidelist.com/blog/cloudflare-10811-bill-codex-durable-objects-alarm-loop); [promptzone post](https://www.promptzone.com/anika_bose/durable-objects-bug-bills-34k-in-days-b7p.md)
- PartyKit was acquired by Cloudflare in 2024; the repo now centres on PartyServer (a library on Durable Objects); trackers show last pushes in Apr–May 2026 and call momentum "stalling". — [cloudflare/partykit](https://github.com/cloudflare/partykit); [Cloudflare acquires PartyKit](https://blog.cloudflare.com/de-de/cloudflare-acquires-partykit)
- Hathora's game-server hosting shut down on 5 May 2026 after its acquisition by Fireworks AI (reported 4 Mar 2026). Remove from consideration. — [Edgegap comparison page](https://edgegap.com/comparison/edgegap-vs-hathora)
- Nakama is at 3.41.0 (18 Sep 2026); Go server with a managed Heroic Cloud option. — [tech-insider comparison](https://tech-insider.org/spacetimedb-vs-playfab-vs-nakama-2026/)
- Rivet: open-source (Apache-2.0) actor platform; self-hosted engine is a single Rust binary or container backed by Postgres, the file system or FoundationDB; each actor has in-memory state plus SQLite; managed-cloud pricing unclear. — [rivet-dev/rivet](https://github.com/rivet-dev/rivet); [rivet.dev](https://rivet.dev/)
- uWebSockets.js: C++ server exposed as a Node addon, installed from GitHub rather than npm (v20.70–20.71 current), claims 13x Fastify and 20x Socket.IO; a fork powers Bun's HTTP/WebSocket stack. A recent Socket.IO-level benchmark (Node 24.11.1, Bun 1.3.6) had Node + uWS winning; an older raw benchmark had Bun and uWS within a few percent (75.6k vs 73.1k msgs/s). — [uWebSockets.js README](https://github.com/uNetworking/uWebSockets.js); [dev.to Socket.IO server benchmark](https://dev.to/sahaj-b/benchmarking-socketio-servers-4n9k); [ntsd websocket benchmark](https://ntsd.pages.dev/projects/websocket-benchmark)

**Hosting cost of a 24/7 process**
- Hetzner raised cloud prices in April 2026 (up to ~37%) and again on 15 Jun 2026: CX23 €3.99 → €5.49/month and CAX11 €4.49 → €5.99/month (Germany/Finland, excl. VAT and IPv4). One source reports cost-optimised CX/CAX plans intermittently unavailable to create through 20 Oct 2026. — [Hetzner price adjustment page](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/); [wz-it analysis](https://wz-it.com/en/blog/hetzner-price-increase-june-2026-cpx-ccx-alternatives/); [Tom's Hardware on the April rise](https://www.tomshardware.com/tech-industry/hetzner-to-raise-prices-by-up-to-37-percent-from-april-1); [bitdoze on availability](https://www.bitdoze.com/hetzner-cloud-cost-optimized-plans/)
- PaaS (third-party comparisons, figures vary by assumed size): Fly.io smallest always-on machine about $2–5/month, ~1 vCPU/2 GB about $10–11; Render's cheapest always-on tier is $7/month (512 MB, 0.5 CPU) and free instances sleep; Railway bills usage, about $10/month for a small always-on app, Pro plan $20/month. — [findstack comparison](https://findstack.com/resources/railway-vs-render-vs-fly-io); [selfhost.dev PaaS pricing](https://selfhost.dev/blog-paas-pricing-comparison/); [fly.io PaaS pricing compared](https://fly.io/learn/paas-pricing-compared/)
- Supabase: free tier ~500 MB database, 50,000 MAU, 5 GB egress, two projects, and projects pause after about a week of inactivity; Pro is $25/month base (includes $10 compute credit) with usage overages. — [activepieces Supabase pricing guide](https://www.activepieces.com/blog/supabase-pricing-free-tier-limits-pro-costs-egress); [makerkit Supabase pricing](https://makerkit.dev/blog/saas/supabase-pricing)
- Convex: cloud free tier reported as ~1M function calls/month and 0.5 GB; Professional $25/developer/month; the backend is self-hostable under the FSL licence (converts to Apache 2.0 after two years). — [Convex self-hosting docs](https://docs.convex.dev/self-hosting); [get-convex/convex-backend](https://github.com/get-convex/convex-backend); [agentdeals Convex free tier](https://agentdeals.dev/vendor/convex)

**Auth and bandwidth**
- Better Auth: MIT, framework-agnostic TypeScript auth with a plugin ecosystem (2FA and multi-tenancy cited), 30.7k stars. — [better-auth/better-auth](https://github.com/better-auth/better-auth)
- Bandwidth patterns: send each client only entities in its area of interest; delta-encode against the last snapshot the client acknowledged; quantise values; interpolate remote entities 50–100 ms (or more at low rates) in the past. — [Gaffer on Games: Snapshot Compression](https://www.gafferongames.com/post/snapshot_compression/); [coherence optimisation docs](https://docs.coherence.io/manual/optimization); [bugnet bandwidth guide](https://bugnet.io/blog/how-to-reduce-bandwidth-in-a-networked-game)

### Inferences
- Monthly cost of one always-on world, by option (reasoned from the figures above):
  - Small VPS (Hetzner CX23/CAX11): about €5.5–6 + IPv4 + VAT, fixed. Runs sim, WebSocket server, SQLite and static files. Best cost predictability.
  - Fly.io: roughly $2–6 for a 256 MB–1 GB shared machine plus a small volume; Render $7; Railway ~$10.
  - Colyseus Cloud: from $15; SpacetimeDB Maincloud: $0 if a continuous tick fits the free energy credit (unverified), else $25.
  - Cloudflare Durable Object: one object awake all month is 2,592,000 s × 0.125–0.128 GB ≈ 324k–332k GB-s, inside the Paid plan's 400k included (and inside the Free plan's 13k GB-s/day), so duration is effectively covered; ticks driven by alarms at 10 Hz would be ~26M requests/month ≈ $3.75 over the included 1M. Total ≈ Workers Paid base fee [prior knowledge: $5/month, unverified] plus a few dollars. But: single-threaded, 128 MB, eviction/restart at the platform's discretion, per-invocation CPU limits, and usage billing that punishes bugs.
  - Supabase/Convex/Firebase as the sim host: not suitable (no long-running process); useful only for auth/storage, and Supabase's free tier pauses when idle.
- Interest management for spectating: divide the world into grid cells; each client subscribes to the cells under its viewport (+1 margin). Per-snapshot payload per entity can be ~6–8 bytes (id u16, x/y u16 quantised to the cell, heading u8, state/animation u8, species u8). 200 visible creatures × 8 B × 4 Hz ≈ 6.4 kB/s before delta or compression, about 23 MB/hour worst case; delta encoding and "sleeping entity" suppression cut it several-fold. When zoomed out, switch to an aggregated density/heat-map tile stream instead of entities.
- WebSocket (TCP) is fine: this is spectating at low tick rates, not twitch gameplay, so head-of-line blocking is irrelevant; WebTransport/WebRTC add complexity for no gain.
- Colyseus fit: rooms, reconnection, auth hooks and the Vite/tunnel dev workflow are valuable, but automatic schema state sync of 10k entities is not what the framework is tuned for; use Colyseus for sessions/presence/messages and send custom binary AOI snapshots, or skip it and use `ws`/uWebSockets.js directly (~200 lines).
- SpacetimeDB fit: attractive on paper (persistence, subscriptions as AOI queries, identity) but a 10k-agent world updated every tick means tens of thousands of row writes per tick through a transactional commit log, which is the opposite of an in-memory SoA sim; the practical pattern would be to keep agents in memory inside the module and only write coarse state, which forfeits most of its benefit. BSL licensing and runtime coupling add lock-in. Reasonable for player/design/meta data; questionable as the sim host.
- Auth for 5–20 friends: invite code to create an account, then passkey or emailed magic link; keep a long-lived session cookie/token because iOS home-screen web apps have storage separate from Safari. Avoid passwords. A self-hosted library (Better Auth) or ~100 lines of custom invite+token code is enough; a hosted auth product is unnecessary at this scale. [passkey and magic-link plugin availability in Better Auth: prior knowledge, unverified]
- Persistence: SQLite file on the VPS volume (WAL mode) for accounts, designs, event log and snapshot blobs; nightly copy of the file to object storage. Postgres/Redis add nothing at this scale.

### Gaps
- Could not open spacetimedb.com, colyseus.io or Cloudflare's docs site directly; SpacetimeDB free-tier energy figures conflict and the cost of a continuous 10 Hz reducer on Maincloud is unknown.
- Fly.io, Railway and Render exact current prices not verified from official pages; Hetzner prices exclude VAT/IPv4 and availability may have changed.
- Durable Object CPU-time limits, eviction behaviour with in-memory timers, and the Workers Paid base price were not verified this session.
- Colyseus `StateView`/filtering capabilities and practical entity-count limits were not verified.
- Firebase and Redis were not researched; Nakama details come from a third-party page.
- Better Auth's passkey, magic-link and invite features and SQLite adapter were not confirmed from its docs.

---

## 6. Mobile delivery: PWA vs wrappers vs native distribution

### Takeaway
PWA-only is viable for a friend group in late 2026: iOS supports home-screen web apps with Web Push (16.4+), Declarative Web Push (18.4+), and "open as web app" by default (iOS 26). The remaining iOS gaps are haptics (no Vibration API), runtime orientation lock, less reliable push subscriptions, and the need for each friend to add the app to the Home Screen manually. Capacitor 8 is the cheapest escape hatch if those gaps hurt; TestFlight suits a small group but builds expire every 90 days.

### Cited Findings
- Web Push on iOS/iPadOS works from 16.4 only for web apps added to the Home Screen; the permission prompt must follow a user gesture. — [WebKit: Web Push for Web Apps on iOS and iPadOS](https://webkit.org/?p=13878); [MagicBell iOS PWA guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- Declarative Web Push arrived in Safari 18.4 for Home Screen web apps (18.5 on macOS): notifications can be shown without a service worker and can update the app badge. — [WebKit: Meet Declarative Web Push](https://webkit.org/?p=16535)
- iOS 26: every site added to the Home Screen opens as a web app by default (even without a manifest); the user can switch that off per icon. — [MacRumors on iOS 26 Safari changes](https://www.macrumors.com/2025/06/18/safari-changes-on-ios-26/); [heise on iOS 26 web app behaviour](https://heise.de/-10749652)
- Reliability caveats: developers report push subscriptions disappearing on iOS; if the user taps "Don't Allow" the system prompt is not shown again for that web app; iOS notifications do not support images. — [webscraft: PWA push on iOS in 2026](https://webscraft.org/blog/pwa-pushspovischennya-na-ios-u-2026-scho-realno-pratsyuye?lang=en); [OneSignal iOS web push docs](https://documentation.onesignal.com/docs/web-push-for-ios)
- Home Screen web apps keep storage separate from Safari. — [OneSignal iOS web push docs](https://documentation.onesignal.com/docs/web-push-for-ios)
- No Vibration API on iOS in any browser (calls silently fail); Apple has indicated no plans as of 2026; articles describe "web haptics" workarounds for iOS Safari. — [bugnet: vibrate API not available on iOS Safari](https://bugnet.io/blog/fix-web-game-vibrate-api-not-available-ios-safari); [web-haptics browser support](https://www.mintlify.com/lochie/web-haptics/advanced/browser-support); [azukiazusa: WebHaptics on iOS Safari](https://azukiazusa.dev/blog/ios-safari-web-haptics.md)
- Screen orientation: WebKit exposes orientation but `lock()` is absent or fullscreen-only; the manifest `orientation` field is the workaround. Screen Wake Lock works in installed web apps from Safari 18.4. — [WebKit bug 257695](https://bugs.webkit.org/show_bug.cgi?id=257695); [MagicBell iOS PWA guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide)
- One source states Apple removed standalone PWAs in the EU with iOS 17.4. — [MagicBell iOS PWA guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide); contradicted by researcher's prior knowledge that Apple reversed this before 17.4 shipped [unverified; check if any player is in the EU]
- Capacitor 8 was released 8 Dec 2025 (Swift Package Manager default for iOS, Android edge-to-edge via SystemBars); requires iOS 15+, Xcode 26, Android SDK 36; 8.4.0 is the latest minor seen; it runs the app in WKWebView on iOS; iOS suspends WebView execution in the background. — [Ionic: Announcing Capacitor 8](https://ionic.io/blog/announcing-capacitor-8); [Capacitor 8 update guide](https://capacitorjs.com/docs/updating/8-0); [Capawesome on 8.4.0](https://capawesome.io/blog/whats-new-in-capacitor-8-4-0/); [Capacitor iOS docs](https://capacitorjs.com/docs/ios)
- Tauri: latest stable v2.12.5 (21 Oct 2026); v3.0.0-alpha.6 (6 Nov 2026) is in progress. — [Tauri GitHub releases](https://github.com/tauri-apps/tauri/releases)
- TestFlight: up to 100 internal testers (App Store Connect users), up to 10,000 external testers, builds expire after 90 days with no extension; the first build for an external group goes through App Review. — [Apple: Overview of TestFlight](https://developer.apple.com/help/app-store-connect/test-a-beta-version/overview-of-testflight/)
- React Native WebGPU: `react-native-wgpu` is pre-1.0 (v0.5.11), requires the New Architecture (RN 0.81+); Expo published a 2026 WebGPU/TypeGPU game write-up on Expo SDK 57 / RN 0.86; Shopify describes WebGPU-driven work in React Native Skia. — [pkgstats: react-native-wgpu](https://www.pkgstats.com/pkg:react-native-wgpu); [Expo blog: Purrkour](https://expo.dev/blog/purrkour-webgpu-typegpu-game-expo-three-days); [Shopify Engineering: WebGPU and Skia](https://shopify.engineering/webgpu-skia-web-graphics)

### Inferences
- What PWA-only costs on iOS today: (1) each friend must do "Share → Add to Home Screen" once (no install prompt) before push can be requested; (2) push can silently stop, so pair it with an in-app recap and perhaps a fallback channel (e.g. a group-chat webhook) for important events; (3) no real haptics; (4) portrait can be requested via the manifest but not enforced at runtime, so the layout must tolerate rotation; (5) audio must be started from a user gesture and stops when backgrounded; (6) storage can be evicted, so treat the device as a cache and the server as the source of truth. None of these blocks a check-in-and-spectate game.
- Android Chrome is the easy case: install prompt, reliable push, vibration and orientation lock all work. [prior knowledge, unverified]
- Wrapper decision: start PWA-only. If push reliability or haptics become real complaints, wrap the same Vite build with Capacitor 8 (native push, haptics, orientation plugins) and distribute to friends via TestFlight; the costs are an Apple Developer Program membership [prior knowledge: $99/year, unverified], Xcode on a Mac, and re-uploading a build at least every 90 days. Tauri mobile and React Native/Expo (Skia/WebGPU) mean a second rendering stack or a less mature mobile toolchain and are not justified for 5–20 players.
- A server-rendered daily recap that can also be delivered as a push payload or message link works with every delivery option and matches the "check in a few times a day" loop.

### Gaps
- Could not read firt.dev's iOS PWA compatibility notes or WebKit posts directly; iOS storage quota and eviction rules for Home Screen web apps were not sourced.
- No quantitative data on iOS web-push delivery reliability in 2026.
- Tauri 2 mobile maturity, and Capacitor plugin specifics for push/haptics, were not researched.
- Apple Developer Program pricing and Google Play internal-testing limits were not verified.

---

## 7. Dev tooling for an AI-agent-driven workflow

### Takeaway
An all-TypeScript, text-only stack (Vite client, shared sim package, Node/Bun server, Vitest for headless sim tests, Playwright for phone-viewport screenshots) is the most agent-friendly option because every artefact is diffable, type-checked and testable without an editor GUI. Avoid usage-billed platforms where an agent-written loop can generate a large bill.

### Cited Findings
- Vitest latest stable is v5.1.0 (2 Nov 2026) with browser mode (Playwright provider; the webdriverio package was removed in 5.0), `toMatchScreenshot` visual regression, and trace view improvements. — [Vitest GitHub releases](https://github.com/vitest-dev/vitest/releases)
- Playwright emulates devices via a registry of presets (e.g. iPhone 13) that set user agent, viewport, `deviceScaleFactor`, `isMobile` and `hasTouch`, and can run them on the WebKit engine ("Mobile Safari" project); behaviour is simulated, not a real device; offline emulation does not reliably simulate WebSocket loss. — [Playwright emulation docs](https://github.com/microsoft/playwright/blob/main/docs/src/emulation.md)
- PixiJS v8.21 added TypeScript 6 and 7 support. — [PixiJS GitHub releases](https://github.com/pixijs/pixijs/releases)
- Colyseus 0.18.12 lets `vite dev` share the game on a public URL with a QR code (via `@colyseus/tunnel`), useful for testing on a real phone. — [Colyseus GitHub releases](https://github.com/colyseus/colyseus/releases)
- Agent-oriented signals in candidate tools: SpacetimeDB publishes an LLM benchmark/evals page and agent skills; Koota ships `AGENTS.md` and skills; ALIEN ships a headless CLI and a built-in MCP server for AI agents. — [SpacetimeDB LLM benchmark](https://spacetimedb.com/llm-benchmark/evals); [SpacetimeDB skill listing](https://skills.sh/clockworklabs/spacetimedb/spacetimedb-concepts); [pmndrs/koota](https://github.com/pmndrs/koota); [chrxh/alien](https://github.com/chrxh/alien)
- Godot 4 C# projects cannot export to web, and web builds need per-export engine templates; Thrive insulated gameplay from engine changes by moving to an ECS before its Godot 4 migration. — [godot-docs exporting_for_web.rst](https://github.com/godotengine/godot-docs/blob/master/tutorials/export/exporting_for_web.rst); [Thrive devblog 41](https://revolutionarygames.itch.io/thrive/devlog/721881/devblog-41-godot-4-is-here)
- Reports exist of five-figure Durable Objects bills caused by runaway alarm loops, one explicitly attributed to AI-written code (titles only seen). — [aiidelist post](https://aiidelist.com/blog/cloudflare-10811-bill-codex-durable-objects-alarm-loop)

### Inferences
- Agent-friendliness ranking: (1) TypeScript + Vite + PixiJS/Phaser + plain Node/Bun server: everything is code, fast `tsc`/Vitest feedback, huge training-data footprint; (2) Colyseus (TypeScript, good docs, but pre-1.0 API churn between 0.16→0.17→0.18 means agents may emit outdated APIs; pin versions and give the agent the migration guides); (3) SpacetimeDB TypeScript modules (new in 2.0, fast-moving); (4) Godot (text scene files but editor-centric workflow, GDScript, heavy web export loop); (5) Unity/Defold/Bevy (binary or editor-driven assets, long builds).
- The highest-leverage tooling decision is the pure, deterministic sim package: an agent can then verify changes with headless tests ("run 50k ticks with seed 7; assert population stays within bounds; assert snapshot hash equals golden") in seconds, with no browser.
- Suggested test layers: Vitest unit and property tests for the sim and the behaviour-language interpreter; golden-snapshot determinism tests (same seed → same world hash on Node and in a browser via Vitest browser mode); headless balance batch runs as a CLI script that emits CSV/JSON for the agent to read; Playwright with iPhone and Pixel presets in portrait for screenshots of the editor and world view, with canvas screenshots compared against baselines at a tolerance; a manual real-device pass before each release because emulation is not Safari on a phone.
- Monorepo: keep the pnpm workspace the developer already knows, with three or four packages (`sim`, `protocol`, `server`, `client`); add Turborepo only if build caching becomes painful; Nx is overkill; Bun workspaces are attractive if Bun is also the server runtime. [not researched this session; prior knowledge]
- CI/CD: GitHub Actions running typecheck, Vitest, a short headless balance run and Playwright; client deployed as static files with preview deploys per pull request (Cloudflare Pages, Netlify or GitHub Pages); server deployed by pushing a container or via SSH to the VPS, with a staging world on a second port. [not researched this session; prior knowledge]
- Guardrails for agent-written server code: fixed-price hosting, a hard tick-time watchdog, and rate-limited sockets, so a bug costs CPU rather than money.

### Gaps
- Searches on monorepo tooling (pnpm vs Bun workspaces vs Turborepo vs Nx in 2026), preview-deploy hosts, and Vite's current major version were cut off by the search budget.
- No evidence gathered on how well current AI coding agents handle Phaser 4 or PixiJS v8 APIs versus older versions (training-data lag is a plausible risk for Phaser 4, released April 2026).
- Hot-reload behaviour for a long-running sim server (state-preserving reload) was not researched.

---

## 8. Reference implementations and what they teach

### Takeaway
Screeps is the closest architectural ancestor (persistent tick-based world, player-programmed units, sandboxed code, tick = compute then apply); ALIEN shows conservation-of-energy design, headless operation and save points; .io-game clones show server-authoritative, render-only clients; Bibites and Thrive show the performance and maintainability cost of per-object simulation inside a general engine.

### Cited Findings
- Screeps server architecture: each tick has two stages, player-script calculation and then command processing, synchronised through Redis; the documented stack was Node.js, MongoDB and Redis. — [Screeps architecture docs](https://docs.screeps.com/architecture.html)
- Screeps moved player code to `isolated-vm` in 2018: each player gets a separate V8 isolate with its own heap and GC (256 MB limit; exceeding it resets the VM). — [Screeps changelog 2018-03-05](https://blog.screeps.com/2018/03/changelog-2018-03-05/); [Screeps forum: isolated VM](https://screeps.com/forum/post/9331)
- The open-source standalone Screeps server (ISC licence, ~3.4k stars, Node 22 LTS+) runs as separate processes: launcher, storage (key-value store, database and pub/sub; default LokiJS persisting to `db.json`, swappable for MongoDB + Redis), backend (HTTP API + admin CLI), engine (game core shared with the official server) and driver (environment adapter). — [screeps/screeps](https://github.com/screeps/screeps)
- ALIEN (BSD-3, C++/CUDA, ~5.6k stars, active Nov 2026): 2D particle engine where every object is particles; creatures are cell networks built from genomes, each cell running a small neural network; energy is conserved (circulates between cells, free particles and an optional pool), mutation rates can themselves evolve; autosave "save points" and flashbacks; headless `alien-cli`, Docker image and MCP server; needs an NVIDIA GPU; won the ALIFE 2024 Virtual Creatures Competition. — [chrxh/alien](https://github.com/chrxh/alien)
- Thrive (Godot + C#, 3.9k stars): tuning lives in a `simulation_parameters` folder of JSON plus C# constants; an earlier ECS rework meant the Godot 4 migration did not require redoing gameplay. — [Revolutionary-Games/Thrive](https://github.com/Revolutionary-Games/Thrive); [Thrive devblog 41](https://revolutionarygames.itch.io/thrive/devlog/721881/devblog-41-godot-4-is-here)
- The Bibites: per-entity vision was de-synchronised to reduce stutter, pellet counts needed warnings, players report FPS falling to 5–6 after an hour as populations grow, and the team plans a DOTS rewrite. — [Bibites 0.5.0 devlog](https://thebibites.itch.io/the-bibites/devlog/464605/the-bibites-050-modernity-and-progress); [Bibites 0.6.2 devlog](https://thebibites.itch.io/the-bibites/devlog/973592/the-bibites-062-steam-workshop-and-toward-the-future)
- agar.io-clone (Node + Socket.IO + canvas, ~3k stars): all game logic on the server; the client only renders. — [huytd/agar.io-clone](https://github.com/huytd/agar.io-clone)
- Browser/JS artificial-life projects: `neuroparticles` (JS, neural particles evolving on a grid), `Cephalopods` (JS neuroevolution, stale since 2020), `algovivo` (JS/WASM soft-body creatures), `thehumanbox` (Rust/WASM browser civilisation sandbox, active Nov 2026). — [GitHub topic: artificial-life](https://github.com/topics/artificial-life)
- BitCraft Online runs its whole backend as a single SpacetimeDB module. — [SpacetimeDB GitHub README](https://github.com/clockworklabs/SpacetimeDB)

### Inferences
- From Screeps: separate "decide" from "apply" each tick (all agents read the same world state, emit intents, then a processor resolves conflicts); this gives order-independence and determinism, and makes per-agent CPU budgets enforceable. Give each player's behaviour program a hard instruction budget rather than a time budget, so results do not depend on server load.
- Screeps runs arbitrary JS and therefore needs `isolated-vm`; a small custom behaviour language (blocks or a tiny DSL compiled to bytecode) avoids that entire class of sandboxing and determinism problems, and can be run in the browser sandbox identically.
- From ALIEN: conserve a single currency (energy/biomass) so populations self-limit; provide save points and "flashbacks" for debugging ecosystems; provide a headless mode from day one.
- From Thrive: keep tuning in data files (JSON) separate from code, so balance changes are diffable and an agent or batch runner can sweep them.
- From Bibites: sensing (vision/neighbour queries) is the performance cliff; stagger sensing across ticks and use spatial partitioning from the start.
- From .io clones: clients never simulate the shared world; they interpolate. The client-side copy of the sim is for the private design sandbox only.

### Gaps
- Screeps docs and blog could not be opened directly (search summaries only); tick duration management and current storage details are not captured.
- Cell Lab's technology was not researched; The Bibites' use of Unity is consistent with its devlog (DOTS, URP) but engine version details are unverified.
- No open-source project was found that combines a persistent server ecosystem, player-designed creatures and a mobile web client; this exact shape appears unoccupied in the sources seen.

---

## 9. Candidate stacks (synthesis)

### Takeaway
Three coherent stacks emerge; Stack A (all-TypeScript monolith on a small VPS, PixiJS + DOM client, PWA) best matches the constraints (solo + AI agent, <$20–30/month, shared sim code, iOS Safari). Stack B adds Colyseus for session plumbing; Stack C trades hosting simplicity for a managed platform (SpacetimeDB or Cloudflare) and carries more risk for a continuous simulation.

### Cited Findings
- Version and maintenance anchors for the stacks: PixiJS v8.23.0 (11 Nov 2026) — [PixiJS releases](https://github.com/pixijs/pixijs/releases); Phaser v4.2.1 (9 Jul 2026) — [Phaser releases](https://github.com/phaserjs/phaser/releases); Colyseus core 0.18.28 (10 Nov 2026) — [Colyseus releases](https://github.com/colyseus/colyseus/releases); Vitest v5.1.0 (2 Nov 2026) — [Vitest releases](https://github.com/vitest-dev/vitest/releases); Bun v1.4.4 (22 Oct 2026) — [Bun releases](https://github.com/oven-sh/bun/releases); Capacitor 8 (8 Dec 2025) — [Ionic announcement](https://ionic.io/blog/announcing-capacitor-8); SpacetimeDB 2.8.x — [crate page](https://docs.rs/crate/spacetimedb/2.8.1).
- Cost anchors: Hetzner CX23 €5.49/month, CAX11 €5.99/month after 15 Jun 2026 — [Hetzner price adjustment](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/); Colyseus Cloud from $15/month — [colyseus.io/pricing](https://colyseus.io/pricing); SpacetimeDB Maincloud Free/$25 Pro — [spacetimedb.com/pricing](https://spacetimedb.com/pricing); Durable Objects paid plan includes 400,000 GB-s and 1M requests per month — [Cloudflare pricing source](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/partials/durable-objects/durable-objects-pricing.mdx).
- Platform risk anchors: Hathora exited game hosting in 2026 — [Edgegap comparison](https://edgegap.com/comparison/edgegap-vs-hathora); PartyKit momentum reported as stalling — [cloudflare/partykit](https://github.com/cloudflare/partykit); Hetzner raised prices repeatedly in 2026 — [wz-it analysis](https://wz-it.com/en/blog/hetzner-price-increase-june-2026-cpx-ccx-alternatives/).

### Inferences

**Stack A: "Boring TypeScript monolith" (recommended baseline)**
- Client: Vite + TypeScript; PixiJS v8 (WebGL2 default, WebGPU off or opt-in) for the world and creature preview; DOM UI in Svelte, Solid or React for editor, recaps and menus; installable PWA with Web Push.
- Creatures: rung-2 soft critters (section 3) drawn as layered vector parts with procedural motion; per-species baked textures for mid/far zoom; optional pixel-art portraits.
- Sim: shared `sim` package (hand-rolled SoA typed arrays or bitECS), fixed timestep at 5–10 Hz, seeded PRNG, deterministic math, bytecode interpreter for behaviour programs with an instruction budget; runs in a Web Worker for the sandbox and in the server process for the world.
- Server: one Node 22+/Bun process: tick loop, `ws` or uWebSockets.js, binary AOI snapshots at 2–5 Hz, SQLite (WAL) for accounts, designs, event log and snapshot blobs; invite code + passkey/magic-link auth.
- Hosting: one small VPS (about €6–8/month with IPv4 and VAT) or a Fly.io machine with a volume; static client on a free static host or served by the same process.
- Cost: roughly €6–10/month. Strengths: one language, one process, fully testable headless, no vendor coupling, predictable bill. Weaknesses: the developer owns deploys, backups, TLS and restarts (mitigated by a simple container plus a managed reverse proxy), and writes reconnection/session code.

**Stack B: Stack A with Colyseus 0.18 for the network/session layer**
- Same client, sim and persistence. Colyseus provides rooms (one "world" room plus per-player sandbox or lobby rooms), reconnection, auth hooks, typed messages, an admin panel and the phone-testing tunnel. Use custom binary messages for world snapshots and Colyseus schema only for small per-player state.
- Hosting: self-host on the same VPS (free) or Colyseus Cloud from $15/month.
- Cost: €6–10/month self-hosted; $15+ on Colyseus Cloud. Strengths: less plumbing to write, maintained TypeScript framework with frequent releases. Weaknesses: pre-1.0 API churn (agents may produce outdated code), framework abstractions aimed at short-lived match rooms rather than one eternal world, and extra concepts for a 5–20 player game.

**Stack C: managed-platform variant (SpacetimeDB 2.x, or Cloudflare Durable Object)**
- C1, SpacetimeDB: TypeScript module with a scheduled-reducer tick; tables for players, designs, events; clients subscribe with queries (viewport cells as subscriptions); Maincloud Free or $25 Pro, or self-host the Docker image on the same VPS. Strengths: persistence, sync and identity in one system; strong agent-facing docs. Weaknesses: every world mutation is a transactional row write (poor match for a 10k-agent tick unless agents are kept out of tables), TypeScript modules are new, BSL licence, energy-based billing hard to predict for an always-on tick, sim code must live inside the module runtime.
- C2, Cloudflare: static client on Pages, one SQLite-backed Durable Object as the world, alarms as heartbeat. Duration fits included usage (≈324k–332k of 400k GB-s). Strengths: zero servers, global edge, cheap. Weaknesses: 128 MB and single-threaded isolate, eviction and CPU limits on a compute-heavy loop, request-billed ticks, and documented runaway-bill incidents.
- Verdict: C1 is worth a one-day spike only if the developer wants to avoid running a server; C2 is better used for the static client, push fan-out or auth than for the simulation.

**Deferred options (not stacks to start with)**
- Rust sim core compiled to native + WASM: adopt only if profiling shows the TypeScript tick cannot meet budget at the target population.
- Capacitor 8 wrapper + TestFlight: adopt only if PWA push/haptics limits become real complaints.
- Godot/Unity/Bevy clients: no advantage for this design and clear costs on iOS Safari, payload size and shared-code goals.

**Suggested de-risking spikes, in order**
1. Headless sim: 10k agents with a toy behaviour interpreter and grid spatial hash in TypeScript; measure ms/tick on the intended VPS class.
2. Creature look: rung-2 critter with face, ears/tail chains and squash-and-stretch in PixiJS; test 300 on screen at three LODs on a mid-range Android phone and an iPhone in Safari.
3. Spectate pipeline: binary AOI snapshots at 4 Hz over WebSocket with interpolation; measure kB/s on mobile data.
4. PWA: install on iOS 26 and Android, request push, deliver a recap notification; observe reliability over a week.

### Gaps
- None of the stacks has been validated by measurement; the performance and bandwidth figures in this section are reasoned estimates.
- SpacetimeDB Maincloud cost for a continuous tick, Colyseus Cloud's smallest plan specification, and current Fly.io prices need checking on the vendors' own pages (not reachable from this session).
- The choice between Svelte, Solid and React for the DOM UI was not researched; it should follow the developer's familiarity and the AI agent's reliability with the framework.
