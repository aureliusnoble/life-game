# Behaviour ("neural") editor design: representations and mobile authoring UX

> **Reliability note for the report writer (read first).** Researched 2026-11-14.
> - Full-text fetching failed for every host tried (kstolee.github.io, hcrlab.cs.washington.edu, developers.google.cn, www.gameaipro.com, itch.io, sites.bc.edu were all unreachable from this session), and the shared web-search budget ran out before the last batch of 12 queries. **Every "Cited Finding" below therefore rests on search-result summaries/abstract-level snippets, not on a read of the full paper or page.** Quotes are as returned by search; verify wording before quoting in a final report.
> - Anything I know from prior knowledge but could not confirm this session is listed under **Gaps** and tagged `UNVERIFIED RECALL`. Treat those as leads, not facts.
> - Design context assumed throughout: adult non-programmer friends, 6" portrait phone, **a ~15-minute daily check-in on a living species plus a longer, roughly weekly session designing the next species** (scope addition from the designer), thousands of agents simulated 24/7 server-side, fixed body+brain budget, blocks unlocked over time.
> - Sections 8-10 answer the three extra questions added mid-task; they had no search budget left, so they lean on evidence gathered for sections 1-7 plus flagged inference.

## 1. Representations compared: rule lists, behaviour trees, state machines, utility AI, node graphs, subsumption, drives, imperative blocks, tiny instruction languages, steering mixes, GOAP

### Takeaway
The evidence most favourable to non-programmers on constrained input devices is for **priority-ordered condition→action rules grouped into a few pages/modes** (Kodu, FF XII gambits, trigger-action programming studies); free-form graphs (Gladiabots trees, Bibites nets) are expressive but repeatedly described by players as messy or unreadable, and utility/steering weight mixes are powerful but hard to tune. I found almost no published per-agent cost numbers; cost conclusions below are reasoning, not citations.

### Cited Findings

**(a) Priority-ordered rule lists (FF XII gambits 2006, Dragon Age tactics 2009, Kodu 2009)**
- Guides describe gambits as programming with priority order: "A Gambit works like programming. They also have priority orders"; another calls it "a customisable battle system that very closely resembles programming code" — [StrategyWiki](https://strategywiki.org/wiki/Final_Fantasy_XII/Gambits); [Samurai Gamers](https://samurai-gamers.com/final-fantasy-12-zodiac-age-ffxii/gambits-systems/)
- A developer-community post frames it as beginner programming ("Final Fantasy XII's Gambit system was like programming for beginners") — [dev.to](https://dev.to/fihra/final-fantasy-xii-s-gambit-system-was-like-programming-for-beginners-7d1)
- Origin: FF IV's battle system already had a gambit-like mechanic driving monster AI, which the FF XII team developed further — [Game Developer](https://gamedeveloper.com/design/why-i-final-fantasy-iv-i-was-key-to-i-ffxii-i-s-ai-driven-gambit-system)
- Stated benefit is reduced micromanagement; stated criticism is that "the player is removed from the game, after they set the appropriate Gambits" (reviewer opinion), while PC Gamer (recent opinion piece) argues modern developers should revisit the idea — [Samurai Gamers](https://samurai-gamers.com/final-fantasy-12-zodiac-age-ffxii/gambits-systems/); [PC Gamer](https://www.pcgamer.com/games/final-fantasy/turn-based-rpgs-are-officially-back-in-fashion-but-i-want-more-its-time-for-modern-developers-to-take-another-pass-at-ff12s-gambit-system)
- Kodu rules are condition→action; all rules on a page are evaluated in a single frame, top to bottom (reported by search from an academic Kodu paper; I could not confirm which paper) — likely [Stolee & Fristoe, SIGCSE 2011](https://kstolee.github.io/assets/papers/sigcse2011.pdf)
- Kodu is described as "a novel graphical programming environment based on a concurrent rule system derived from contemporary robotics practice" and as "a natural state machine language inspired by behavior-based robotics" — [MacLaurin, FDG 2009 listing](https://www.researchgate.net/publication/220795042_Kodu_end-user_programming_and_design_for_games); [MacLaurin, POPL 2011](https://dl.acm.org/doi/10.1145/1926385.1926413)
- Despite the simple model, Kodu users "express and explore fundamental computer science concepts and exhibit sophistication through the use of complex control flow and boolean logic"; the language "is entirely event-driven and programming takes the form of 'when-do' clauses" — [Stolee & Fristoe, SIGCSE 2011](https://www.researchgate.net/publication/228414070_Expressing_computer_science_concepts_through_Kodu_game_lab)

**(b) Behaviour trees (Halo 2 2004/GDC 2005, Gladiabots 2018-, Unreal)**
- Isla's GDC 2005 Halo 2 talk poses the core problem as "How can you add complexity to a brain while maintaining the transparency of a small system?"; Halo 2 used an HFSM / behaviour DAG "on the order of 50 different behaviors" — [Game Developer, GDC 2005 proceeding](https://gamedeveloper.com/programming/gdc-2005-proceeding-handling-complexity-in-the-i-halo-2-i-ai)
- A 2020 academic analysis says the "widespread misuse" of BTs described by Bobby Anguelov yields monolithic trees that are very hard to extend or refactor, and that transparency and reusability get neglected — [arXiv 2008.11906 (2020)](https://ar5iv.labs.arxiv.org/html/2008.11906)
- BTs' strict hierarchy "clearly delineate[s] how the system selects behaviour" but "impairs reactivity" — [Dragert et al., McGill, 2012](https://www.sable.mcgill.ca/~clump/papers/dragert-12-statechart.pdf)
- Dedicated pitfalls literature exists: Francis, "Overcoming Pitfalls in Behavior Tree Design" (Game AI Pro 3, 2017) and the GDC 2017 talk by Anguelov, Vehkala and Weber on BT principles and common issues — [Game AI Pro 3 ch. 9](https://www.oreilly.com/library/view/game-ai-pro/9781351647748/xhtml/21_Chapter09.xhtml); [Game Developer video](https://gamedeveloper.com/design/video-cultivating-and-caring-for-great-ai-behavior-trees)
- Gladiabots (player-authored trees): node kinds are actions, conditions, connectors (layout-only white diamonds) and sub-AIs; node colour encodes target (red enemy, green self, light blue team) — [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1759851189)
- Gladiabots evaluation stops at the first valid action; sources conflict on traversal order (Steam guide: left→right then top→bottom; official wiki: sub-nodes traversed counter-clockwise) — [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1759851189); [Gladiabots wiki, Basics](https://wiki.gladiabots.com/index.php?title=BotProgramming_Basics)
- Player/reviewer verdicts on Gladiabots: learning curve "very high"; a Steam reviewer called debugging the hard part; a Google Play commenter said "great, but too messy"; others praise the tutorials and the block editor — [Google Play](https://play.google.com/store/apps/details?id=com.GFX47.Gladiabots&hl=en); [Steam reviews](https://steamcommunity.com/app/871930/reviews/?browsefilter=toprated); [LearnCodeByGaming](https://learncodebygaming.com/blog/gladiabots-review-tips-for-new-programmers)

**(c) Finite / hierarchical state machines**
- Isla's Halo 3 lecture slides list "explicit transitions, n² complexity" as the problem with the imperative FSM method — [WPI copy of Halo 3 slides](https://web.cs.wpi.edu/~rich/courses/imgd4000-d09/lectures/halo3.pdf)
- F.E.A.R. (2005; GDC 2006 "Three States and a Plan") cut the character FSM to three states (Goto, Animate, UseSmartObject) because layering behaviours was "getting unmanageable" with "only one A.I. programmer" — [DevThrottle summary](https://devthrottle.com/ai-library/milestones/2006-fear-goap)

**(d) Utility AI / scored considerations (Dave Mark's IAUS 2013/2015; The Sims 2000)**
- IAUS was presented at the GDC AI Summit in 2013 and again in 2015 ("Building a Better Centaur: AI at Massive Scale", Mark & Lewis, ArenaNet) as the architecture behind an MMO with hundreds of agent types — [Wikipedia: Utility system](https://en.wikipedia.org/wiki/Utility_system); [GDC Vault](https://www.gdcvault.com/play/1021848/Building-a-Better-Centaur-AI)
- Mechanics: each consideration is normalised to 0..1, shaped by a response curve, and the results are multiplied; a single zero vetoes the behaviour; scores shrink as considerations are added, so a "compensation factor" is applied (third-party documentation crediting Mark's talk) — [Utility Intelligence docs](https://uintel-go.utilityworlds.com/Documentation/UtilityIntelligence/Considerations/)
- Selection is by highest score or weighted random — [Mark slide deck (mirror)](https://api.sambuz.com/doc/improving-improving-ai-decision-modeling-ai-decision-ppt-presentation-788939)
- Authoring claim (vendor's own): designers build new NPC behaviour packages "in minutes rather than hours", with a time-lapse showing ~7 minutes — [Intrinsic Algorithm](https://www.intrinsicalgorithm.com/techs.php)
- A community IAUS implementation offers several response-curve types each with settings and a live preview for tuning — [Project Borealis IAUS wiki](https://github.com/ProjectBorealis/IAUS/wiki)
- Utility AI "is constantly reevaluating the situation and selecting the most appropriate option or options at each moment in time" (Dill co-authored paper) — [Dill, I/ITSEC](https://course.khoury.northeastern.edu/cs5150f14/readings/dill_iitsec-granny.docx)
- The Sims: objects "advertise" what needs they satisfy; a Sim scores every available interaction by motive levels, personality and proximity; Zubek ("Needs-Based AI", Game Programming Gems 8, 2011) describes attenuated-need scoring and warns distance attenuation can select a worse action — [draft wiki article citing Zubek](https://wiki.riteme.site/wiki/User:ElijahPepe/Artificial_intelligence_in_The_Sims)
- Cost shape of the Sims approach: "the NPC searches all the advertisements on all nearby objects, then scores each action based on its needs and selects the best-scoring advertisement" — [CEUR-WS Vol. 3926 paper](https://ceur-ws.org/Vol-3926/paper1.pdf)
- Will Wright: in early versions "the autonomy was too good" (players did worse than autopilot) — [PC Gamer](https://www.pcgamer.com/games/the-sims/will-wright-says-the-original-sims-ai-was-actually-too-good-almost-anything-the-player-did-was-worse-than-the-sims-running-on-autopilot)

**(e) Weighted sensor→motor graphs (The Bibites, in development, versions 0.5.0-0.6.2 cited; Braitenberg 1984)**
- Bibites brains have input, hidden and output neurons; input/output sets are fixed; older community guide counts 48 default nodes (33 inputs, 15 outputs) while a later guide says 23 inputs (version-dependent, conflicting) — [Bibites wiki: Brain](https://the-bibites.fandom.com/wiki/Brain); [community guide gist](https://gist.github.com/AndisGrossteins/449d1ac2bb7eeae198160a856d199d80)
- Node types players use when hand-wiring: Sigmoid (default, 0..1, rests at 0.5), Linear, ReLU, Abs, Latch (a switch that holds its value = 1-bit memory) and Multiply ("the most important hidden node", usable as an AND gate) — [Bibites wiki: Sigmoid](https://the-bibites.fandom.com/wiki/Sigmoid); [Steam "Bibite brain guide"](https://steamcommunity.com/app/2736860/discussions/0/591764116171928749/)
- Readability pain is visible in the forum: a thread titled "seemingly unreadable brains" exists (title only; body not retrieved), and players write guides such as "How I Programmed my first ever Bibite brain" — [itch.io thread](https://itch.io/t/2535360/seemingly-unreadable-brains); [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3441916076)
- Braitenberg's *Vehicles* (1984): "extremely simple robots made from nothing more than sensors, motors and a few wires", where complex behaviour emerges from direct sensor-motor coupling — [Artificial Human Companions](https://www.artificialhumancompanions.com/?p=465)

**(f) Subsumption (Brooks 1986)**
- Each layer is an independent sense-act loop that can be coded, tested and debugged separately; higher layers build on lower competencies — [Wikipedia: Subsumption architecture](https://Www.Wikipedia.org/wiki/Subsumption_architecture)
- Scaling weakness: "as task complexity increases, the Subsumption Architecture falls victim to the same complex task decomposition and higher level design problems"; emergence is "important but not well-understood" in reactive systems — [Liverpool COMP310 ch. 5 slides](https://cgi.csc.liv.ac.uk/~trp/COMP310_files/COMP310-Chapter5.pdf)
- Note a description conflict: the Liverpool slides say lower (more primitive) layers "have precedence over layers further up", whereas Brooks' own scheme is usually described as higher layers suppressing lower ones — [Liverpool slides](https://cgi.csc.liv.ac.uk/~trp/COMP310_files/COMP310-Chapter5.pdf); [Wikipedia](https://Www.Wikipedia.org/wiki/Subsumption_architecture)

**(g) Drive/needs systems** — see The Sims under (d); needs-based AI is described as a special case of utility AI — [draft wiki article citing Zubek](https://wiki.riteme.site/wiki/User:ElijahPepe/Artificial_intelligence_in_The_Sims)

**(h) Scratch/Blockly-style imperative blocks** — see section 4 for touch evidence. Non-programmers' natural descriptions are mostly not imperative (section 5).

**(i) Tiny instruction languages (Human Resource Machine 2015)**
- Reviewers call HRM a coding-style puzzler with gentle early pacing and ~25 core + 11 optional levels; it is puzzle-solving, not open-ended behaviour authoring — [Bonus Stage review](https://www.bonusstage.co.uk/archives/57306)

**(j) Steering-behaviour weight mixing (Reynolds 1999)**
- Simplest combination is a weighted linear sum of accelerations clamped to a maximum; "finding 'right' weight can be challenging"; characters can get stuck in equilibrium or conflict in constrained spaces; alternatives are fixed-priority and prioritised-dithering arbitration — [SDU lecture notes on steering](https://imada.sdu.dk/~rolf/Edu/DM842/E17/lec3.pdf); primary: [Reynolds 1999](http://www.red3d.com/cwr/papers/1999/gdc99steer.html)

**(k) GOAP (F.E.A.R. 2005)**
- Planner uses A* over STRIPS-style actions; the Game AI Pro (2013) overview chapter notes the designer trade-off: authored architectures let designers place intended behaviour directly, whereas planning gives "the NPC's ability to build plans that the designer might not have thought of" and control "isn't as straightforward as with architectures such as behavior trees" — [DevThrottle](https://devthrottle.com/ai-library/milestones/2006-fear-goap); [Game AI Pro ch. 4](https://www.gameaipro.com/GameAIPro/GameAIPro_Chapter04_Behavior_Selection_Algorithms.pdf)

### Inferences
Comparison matrix (researcher synthesis; "†" = directly supported by a cited finding above or in later sections, everything else is first-principles reasoning and should be presented as such).

| Representation | What a non-programmer authors | Group/social expression | Typical failure mode | Per-agent cost shape (reasoned) | Fit for 6" portrait |
|---|---|---|---|---|---|
| (a) Priority rule list, optionally paged into modes | Ordered "WHEN … DO …" cards; reorder = reprioritise † | Conditions on kin/signal sensors; mode pages per sex/caste/day-night | Rule-order surprises; state-vs-event misreadings † (sec. 5) | O(rules × conditions), first match wins; trivially cheap, branch-predictable | Excellent: vertical list is the native phone layout |
| (b) Behaviour tree | Tree of selectors/sequences | Tags + team conditions † | Monolithic trees, hard refactors †; "too messy" †; reduced reactivity † | O(nodes visited); cheap, but needs per-agent running-node state | Poor-to-fair: 2-D canvas needs pan/zoom |
| (c) FSM / HFSM | States + transitions | State per role | Transition explosion (n²) † | O(transitions of current state); cheapest | Fair if states are tabs and transitions are rules inside them (= Kodu pages) |
| (d) Utility / scored considerations | Behaviours with scores, curves | Considerations on neighbours/signals | Tuning opacity; multiplied scores shrink †; oscillation (unverified) | O(behaviours × considerations) every think | Fair: sliders/curves work on touch, but many hidden numbers |
| (e) Sensor→motor weighted graph | Wires and weights | Pheromone inputs/outputs † | Unreadable spaghetti † | O(synapses); cheap and vectorisable | Poor: wires are tiny touch targets |
| (f) Subsumption | Stack of layers, upper overrides lower | Layer per social urge | Does not scale with task complexity † | O(layers) | Good (it is a priority list by another name) |
| (g) Drives/needs | Need meters + what satisfies them | "Advertising" objects/kin † | Too-good autonomy / little player authorship † | O(nearby advertisers × needs) † | Good for display, weak as sole authoring surface |
| (h) Imperative blocks | Scripts with loops/ifs | Broadcast messages | Sequencing/loop bugs; drag-drop pain on touch † (sec. 4) | Interpreter with per-agent program counter; unbounded unless metered | Poor on phones † (sec. 4) |
| (i) Tiny instruction language | Short programs in limited slots | Hard | Puzzle-like; opaque to read later | Tiny VM, bounded | Good for puzzles, wrong tool for standing behaviour |
| (j) Steering weight mix | Sliders per urge (cohesion, separation, flee…) | Native: flocking/herding | Weights hard to find; equilibrium deadlock † | O(neighbours) with a spatial index | Good as *parameters of an action*, not as the whole language |
| (k) GOAP | Goals + action pre/post-conditions | Indirect | Loss of authorial control †; plans hard to explain | Search per replan; most expensive | Poor |

- Three of the eleven collapse into one family when authored on a phone: a rule list (a), subsumption layers (f) and a one-level selector tree (b) are all "first applicable item in a priority-ordered list wins". Kodu's own framing ("concurrent rule system derived from contemporary robotics practice") suggests this lineage.
- Rule lists express the required feature list without new concepts if sensors are rich enough: day/night and sex/caste are just conditions or pages; hunting/fleeing/territory are target-selecting sensors plus movement actions; mating rituals and parental care need a small amount of memory (a mode switch, a latch/flag, or a signal) rather than a richer control structure.
- Emergent group behaviour is best treated as **parameterised actions** (e.g. "stay with herd" internally runs Reynolds-style cohesion/separation with one or two sliders) triggered by rules, not as something the player wires from scratch; this keeps the weight-tuning failure mode contained to a couple of sliders.
- Cost: for every option except GOAP the decision logic is negligible next to **perception** ("nearest kin", "predator in range"). A server budget should therefore meter sensors (count and range), cache neighbour queries per tick in a spatial grid, and stagger "think" ticks (e.g. agents re-decide a few times per second, steer every tick). This is engineering reasoning, not a sourced figure.

### Gaps
- No published per-agent CPU/memory figures were found for any representation; the IAUS "massive scale" talk and Game AI Pro ch. 4 likely contain qualitative cost discussion but could not be read (gameaipro.com unreachable).
- Game AI Pro ch. 4 authorship (Dawe, Gargolinski, Dicken, Humphreys, Mark; 2013) came from my query, not from the search result; confirm.
- `UNVERIFIED RECALL`: utility-AI oscillation/dithering and the standard cures (inertia/commitment bonus, hysteresis, minimum-commit timers) are discussed by Dave Mark and Kevin Dill (GDC 2010 "Improving AI Decision Modeling Through Utility Theory"; Dill's "Dual-Utility Reasoning", Game AI Pro 2, 2015), but the search could not confirm the chapter covers them.
- `UNVERIFIED RECALL`: Creatures (1996; Grand, Cliff & Malhotra, Autonomous Agents '97) used ~1,000 neurons in ~9 lobes plus a simulated biochemistry of drives; no search result was obtained (budget exhausted).
- `UNVERIFIED RECALL`: boids neighbour search is O(n²) naively and near-linear with spatial bins (Reynolds 1987; Reynolds' 2006 PS3 "Big Fast Crowds" bin-lattice work); the steering search returned nothing on cost.
- `UNVERIFIED RECALL`: RoboZZle and Lightbot use a handful of command slots per function with tap-to-place icons; Lightbot and RoboZZle searches were not executed.
- Dragon Age tactics as a designer-facing rule list: only slot-unlock facts were found (section 7); no usability evidence.

## 2. Promising hybrids and what the game-AI literature says about designer-friendly authoring

### Takeaway
The best-evidenced hybrid is **"modes containing a short priority list of when→do rules"** (Kodu's pages; Cell Lab's per-mode genome), optionally extended with a *small* utility element (a drive or urgency value used as a rule condition or tie-breaker) rather than full response-curve authoring. Game-AI sources consistently value transparency and modular reuse over raw expressiveness.

### Cited Findings
- Kodu's model is characterised as both a concurrent rule system and "a natural state machine language", i.e. rules-inside-states — [MacLaurin POPL 2011](https://dl.acm.org/doi/10.1145/1926385.1926413); [MacLaurin FDG 2009 listing](https://www.researchgate.net/publication/220795042_Kodu_end-user_programming_and_design_for_games)
- Cell Lab (Android; phone-native) gives each genome a fixed number of **cell modes**, each with many parameters: the store description says "20 cell-modes per genome to program, 22+ parameters in each cell mode"; the wikis say 40 modes (M1-M40); another listing says 52 (counts conflict, probably version-dependent) — [BlueStacks/Play listing](https://www.bluestacks.com/campaign/com.saterskog.cell_lab/en/); [Cell Lab wiki: Genome Settings](http://wiki.cell-lab.net/Genome_Settings); [Cell Lab fandom: Genome](https://cell-lab.fandom.com/wiki/Genome)
- In Cell Lab each mode names the modes of its two daughter cells ("Both Child modes are independent of each other, and can be individually set with any of the 20 modes"), so differentiation/castes are expressed as a mode graph edited through per-mode settings, not wires — [Cell Lab wiki: Genome Settings](http://wiki.cell-lab.net/Genome_Settings)
- Cell Lab Stemocytes "can change into other modes when certain signal substance concentrations are high or low", i.e. signal-triggered mode switching — [Cell Lab fandom: Genome Editor](https://cell-lab.fandom.com/wiki/Genome_Editor)
- Bibites-style typed nodes: Latch gives memory, Multiply gives AND/gating (0.5.0 added node icons and the multiplication node) — [Bibites 0.5.0 devlog](https://thebibites.itch.io/the-bibites/devlog/464605/the-bibites-050-modernity-and-progress); [Steam brain guide](https://steamcommunity.com/app/2736860/discussions/0/591764116171928749/)
- Gladiabots adds reusable **sub-AIs** and counts only conditions and actions toward the node budget (connectors are free) — [Gladiabots wiki: Advanced](https://wiki.gladiabots.com/index.php?title=Advanced); [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1759851189)
- Combining architectures is established practice: Dill's "Angry Grandmother" character (I/ITSEC 2011) combines behaviour trees with utility-based selection; practitioner notes suggest "GOAP chooses high-level strategy, BT handles tactical execution" — [Dill, I/ITSEC](https://course.khoury.northeastern.edu/cs5150f14/readings/dill_iitsec-granny.docx); [engineering note, 2025](https://notes.muthu.co/2025/10/goal-oriented-action-planning-for-dynamic-problem-solving-in-adaptive-agents/)
- Designer-facing values in the literature: Isla frames the goal as transparency under growing complexity; the 2020 BT analysis names transparency and reusability as the neglected properties; the IAUS pitch is modularity plus fast authoring — [Game Developer, Halo 2](https://gamedeveloper.com/programming/gdc-2005-proceeding-handling-complexity-in-the-i-halo-2-i-ai); [arXiv 2008.11906](https://ar5iv.labs.arxiv.org/html/2008.11906); [Intrinsic Algorithm](https://www.intrinsicalgorithm.com/techs.php)
- Related Game AI Pro chapters located but not read: Dill, "Dual-Utility Reasoning" (Game AI Pro 2, 2015, applied in Zoo Tycoon 2); "Choosing Effective Utility-Based Considerations" (Game AI Pro 3, 2017) — [Game AI Pro 2 ch. 3](https://www.oreilly.com/library/view/game-ai-pro/9781482254792/K23980_C003.xhtml); [Game AI Pro 3 ch. 13](https://www.oreilly.com/library/view/game-ai-pro/9781351647748/xhtml/25_Chapter13.xhtml)

### Inferences
- Candidate hybrid A, "**mode pages × rule cards**": 2-6 named modes (e.g. Day, Night, Courting, Nesting, Fleeing); each holds ≤6-8 priority-ordered WHEN→DO cards; a card's action may be "switch to mode X". This is Kodu's structure mapped to a phone, and matches Cell Lab's proof that per-mode settings are editable on a phone.
- Candidate hybrid B, "**utility-scored behaviour cards**": each card has 1-3 considerations with a preset curve shape (rising/falling/peak) and one strength slider; the highest score wins. More expressive for trade-offs (hunger vs fear) but inherits the cited problems: multiplied scores shrink, and the reason a card lost is a number rather than a position in a list.
- Pragmatic blend: keep hybrid A as the language, expose **drives** (hunger, fear, libido, fatigue) as built-in sensors with thresholds ("WHEN hunger > ▮▮▯"), and unlock an optional "urgency" modifier later that lets a rule jump the queue in proportion to a drive. This gives utility-like nuance while every decision can still be explained as "rule 3 fired because hunger was high".
- Sexual dimorphism/castes map cleanly to "a mode set per sex/caste" or a first-rule condition ("WHEN I am female"); Cell Lab's child-mode idea suggests offspring could be born into a chosen starting mode.
- Typed nodes worth stealing from The Bibites even in a rule language: a **latch/flag** block (remember that X happened) and a **timer** block cover most "ritual" and "parental care" sequencing without loops.

### Gaps
- No controlled comparison of hybrids A vs B with non-programmers was found; the recommendation is argument from adjacent evidence.
- Cell Lab's exact per-mode parameter list and whether its neuron/sensor cells emit numbered signal substances (S1-S4) were not confirmed (`UNVERIFIED RECALL`: cell types such as Neurocyte, Senseocyte, Stereocyte and Stemocyte read/write signal substances).
- Kodu's limits (pages per character, rules per page, indentation semantics) were not confirmed (`UNVERIFIED RECALL`: 12 pages per character; indented child rules only run when the parent's WHEN is true; "switch page" action).

## 3. Expressing communication and social behaviour simply

### Takeaway
Shipping games express sociality with three cheap primitives: **coloured pheromone/signal channels** (emit as an action, sense strength and direction as inputs), **tags** written on self/others and read by team-mates' conditions, and **kin-count/nearest-kin sensors**. All three slot into a rule language as ordinary conditions and actions.

### Cited Findings
- The Bibites: outputs PhereOut1/2/3 emit red/green/blue pheromones; inputs PheroSense1-3 give strength and Phero1Angle-Phero3Angle give direction; NBibites reports the number of visible bibites (divided by 4) — [Bibites wiki: Brain](https://the-bibites.fandom.com/wiki/Brain); [Bibites wiki: Pheromones](https://the-bibites.fandom.com/wiki/Pheromones)
- Bibites outputs also include reproduction (community guide) and, since 0.6.0, an egg-production output with an eggs-stored input — [community guide gist](https://gist.github.com/AndisGrossteins/449d1ac2bb7eeae198160a856d199d80); [Bibites 0.6.0 devlog](https://thebibites.itch.io/the-bibites/devlog/809631/the-bibites-060-organs-and-science)
- Pheromone trails are visible in the world (a wiki screenshot shows "stripes of red pheromones") — [Bibites wiki](https://the-bibites.fandom.com/wiki/Bibites)
- Gladiabots: "tagging and counting actions" execute immediately during evaluation so later nodes can read them; tags and team tags have their own wiki page; node colour distinguishes self/ally/enemy targets — [Gladiabots wiki: Advanced](https://wiki.gladiabots.com/index.php?title=Advanced); [Gladiabots wiki](https://wiki.gladiabots.com)
- Gladiabots' node editor is organised as target type → selection → filters (with and/or) → action/condition, i.e. "who" is chosen by a filter pipeline rather than by variables — [Gladiabots tutorial mirror](https://historyapp.netlify.app/gladiabots-tutorial.html)
- Cell Lab: cells write to a signal-substance channel (e.g. "S1") and other modes' behaviour depends on its concentration; Stemocytes switch mode on signal levels — [NamuWiki strategy page](https://en.namu.wiki/w/Cell%20Lab:%20Evolution%20Sandbox/%EA%B3%B5%EB%9E%B5); [Cell Lab fandom: Genome Editor](https://cell-lab.fandom.com/wiki/Genome_Editor)
- The Sims' inverse pattern: instead of the agent searching for meaning, objects (and other Sims) **advertise** what they offer — [draft wiki article citing Zubek](https://wiki.riteme.site/wiki/User:ElijahPepe/Artificial_intelligence_in_The_Sims)
- AgentSheets (1991-) programs agent interaction with graphical rewrite rules and, from 1993, by dragging conditions and actions from palettes into rules — [Repenning, AgentCubes article](https://home.cs.colorado.edu/~ralex/papers/PDF/AgentCubes_JVLC_article_inpress.pdf)

### Inferences
- A minimal social kit for a rule language: (1) 2-3 **signal colours** per species with "emit signal" / "leave scent mark here" actions and "smell signal (strength, direction)" conditions; (2) **who-filters** on targets ("nearest kin", "nearest female kin", "weakest prey", "my mate", "my offspring", "pack leader = kin with highest rank"); (3) one or two **self tags/flags** ("I am guarding", "I have a nest") readable by kin.
- Packs and herds then emerge from a few rules per member ("WHEN kin signalling red → move toward signal"; "WHEN prey seen → emit red"), with flocking weights hidden inside a "stay with group" action.
- Mating rituals = signal exchange gated by sex ("female: WHEN fertile → emit green"; "male: WHEN smell green → approach; WHEN adjacent → display"); nesting grounds = scent-mark memory ("leave blue at good site", "WHEN gravid AND smell blue → lay eggs"); territoriality = "WHEN non-kin inside my blue scent → threaten/attack". These are constructions, not sourced examples.
- Server cost: pheromone fields are a coarse grid with decay (cost independent of agent count); tags are a few bits per agent; "nearest kin" is the expensive part and should share one neighbour query per think tick.
- Making signals visible in the world doubles as a debugging aid (see section 6).

### Gaps
- No source was found evaluating how well non-programmers understand pheromone/stigmergy mechanics versus explicit messaging.
- Kodu's own social primitives were not confirmed (`UNVERIFIED RECALL`: "say"/"hear" tiles, shared scores usable as global variables, "express" emotes).
- Screeps-style shared memory is code-level and was not researched as a non-programmer pattern.
- NetLogo/StarLogo "patches" as shared environmental memory: search returned nothing on these two systems.

## 4. Mobile/touch UX for visual programming on a 6" portrait screen

### Takeaway
The evidence is thin for phones specifically but consistent in direction: **drag-and-drop block assembly is the documented weak point on touch**, tap/keyboard-style insertion is faster and less error-prone, small-screen authoring tools score poorly on ergonomics, and the tools that work on small screens use few, large, icon-heavy blocks in linear layouts.

### Cited Findings
- A custom soft keyboard for Blockly on touchscreens reduced errors and made block entry faster than drag-and-drop (abstract reports a 71% speed gain), with lower frustration and user preference for the keyboard — [Almusaly, Metoyer et al., IEEE Xplore (c. 2018; year not confirmed)](https://ieeexplore.ieee.org/document/8506557/)
- In a combined block/text environment many users found drag-and-drop frustrating and some had serious difficulty completing tasks with it (search summary's paraphrase) — [Lessons in combining block-based and textual programming (c. 2017; year not confirmed)](https://www.researchgate.net/publication/320446541_Lessons_in_combining_block-based_and_textual_programming)
- A position paper on accessible block programming argues drag-and-drop is hard on touchscreens and cites Swift Playgrounds as offering a non-drag entry method alongside it — [Milne, NSF PAR](https://par.nsf.gov/servlets/purl/10181520)
- Touch devices can misread a tap as a drag and users may need many drag attempts to hit a target position (observed with 4-5-year-olds) — [Minnesota State thesis](https://cornerstone.lib.mnsu.edu/cgi/viewcontent.cgi?article=1353&context=etds)
- Pocket Code (phone-first block programming): an expert review of mobile authoring tools rated its usability 1.5/5 (features 4/5), stating that designing on a phone "considerably limits the ergonomic comfort" and that touch interactions can be inaccurate (reviewers' assessment, not a user study) — [arXiv 1812.00048 (2018)](https://arxiv.org/pdf/1812.00048)
- TU Graz tested Pocket Code's hybrid text/visual formula editor against Scratch's purely visual approach and found the hybrid more efficient and effective — [TU Graz publication record](https://tugraz.elsevierpure.com/en/publications/formula-composition-and-manipulation-in-educational-programming-l/)
- A consumer review of Pocket Code found a tutorial essential, and praised being able to run the program after each added brick — [FutureFive review](https://futurefive.co.nz/story/android-app-review-pocket-code)
- ScratchJr (tablet, 2013): Scratch's block count was judged "overwhelming and not necessary", so ScratchJr uses about 30 blocks, enlarged for touch and young children's motor skills; blocks are jigsaw-shaped so visual properties mirror syntax; developed and iterated with N=98 children in pilot studies; framed by "low floor, high ceiling" — [DevTech SRCD poster](https://sites.bc.edu/devtech/wp-content/uploads/sites/181/2018/02/EKazakoff-SRCD-.pdf); [Flannery et al., IDC 2013](https://www.media.mit.edu/publications/designing-scratchjr-support-for-early-childhood-learning-through-computer-programming/); [ScratchJr design in practice, IJCCI 2023](https://sites.bc.edu/devtech/wp-content/uploads/sites/181/2023/07/ScratchJr-design-in-practice-Low-fl_2023_International-Journal-of-Child-Com.pdf)
- Blockly team guidance (Pasternak, Fenichel & Marshall, IEEE Blocks and Beyond 2017): Blockly is a toolkit for making your own block language; vocabulary can be iconic, natural-language or computer-language; apps for younger users "should not use mutators" (in-block reconfiguration) — [Blockly publications](https://developers.google.com/blockly/publications/publications); [Blockly block design guide](https://docs.blockly.com/guides/design/blocks/)
- Human Resource Machine: commands are dragged into place and the UI "appears designed for tablets"; a player reported hit-detection trouble on an older iPhone while iPad was fine — [Bonus Stage review](https://www.bonusstage.co.uk/archives/57306); [TouchArcade thread](https://toucharcade.com/community/threads/288605)
- Gladiabots on mobile: a review says the mobile versions are "where the game really shines"; the editor is block-based drag-and-drop with no typing; yet a Play Store commenter calls it "great, but too messy" — [LearnCodeByGaming](https://learncodebygaming.com/blog/gladiabots-review-tips-for-new-programmers); [RAWG](https://rawg.io/games/gladiabots); [Google Play](https://play.google.com/store/apps/details?id=com.GFX47.Gladiabots&hl=en)
- Gladiabots' editor has canvas-management features: snap-to-grid, copy/paste, layout-only connector nodes, and a modifier to move a parent without its children — [Gladiabots changelog](https://wiki.gladiabots.com/index.php?title=Changelog); [1.4.13 devlog](https://gfx47.itch.io/gladiabots/devlog/137457/1413-changelog-latest-dev-version)
- Cell Lab (Android) authors behaviour through per-mode genome settings rather than a node graph — [Cell Lab wiki: Genome Settings](http://wiki.cell-lab.net/Genome_Settings)
- Kodu was designed to "work with just a game controller"; its model "can be navigated using a gaming controller or a combination of the keyboard and mouse", with children placing tiles in order to form each rule's condition and action — [eSchool News, 2010](https://www.eschoolnews.com/research/2010/01/14/microsoft-brings-kids-developer-tool-to-the-pc/); [Fowler, Fristoe & MacLaurin 2012](https://www.researchgate.net/publication/318236373_Kodu_Game_Lab_a_programming_environment)

### Inferences
- **Cards in a vertical list beat node graphs on a portrait phone.** A list needs one scroll axis, has full-width touch targets, and maps order to priority. A graph needs pan + zoom + precise wire dragging; Gladiabots' "too messy" complaint and the amount of layout tooling its editor needs (snap-to-grid, connectors, move-without-children) are the visible cost.
- **Tap-to-place beats drag-and-drop.** Use "tap an empty slot → bottom-sheet picker filtered to what is legal there → tap choice". Kodu's controller-driven tile placement is the precedent: a gamepad cannot drag, so the language had to work by stepping through tile choices (my reading; the paper's UI details were not accessible). Cell Lab's per-mode settings are the phone-native precedent for non-graph authoring. Reserve drag for a single gesture with a large target: reordering whole cards via a handle (and offer up/down arrows as an alternative).
- **Slot-filling makes syntax errors impossible** and lets the picker show only unlocked, type-correct blocks: this is the block-language property (shape = syntax) ScratchJr preserves, achieved without dragging.
- Numbers on touch: prefer 3-5-step segmented sliders or named levels ("near / mid / far") over continuous values and curve editors; the Pocket Code formula result suggests that when something must be precise, a compact hybrid text-like control outperforms purely visual assembly.
- Icons + short words together (Blockly's "iconic" vs "natural language" vocabulary): adult players benefit from words; icons make the watch view and thought bubbles reusable.
- Two zoom levels only: (1) species overview = mode tabs with rule counts and budget; (2) one mode = its card list. No free zoom.
- Radial/pie pickers: no evidence gathered either way; a bottom sheet is the safer default for thumb reach.

### Gaps
- No user study was found of block or rule editors specifically on **phone-sized** screens with **adult** non-programmers; nearly all touch evidence is tablets and children.
- Not researched (search budget exhausted): Scratch's official stance on phones, Swift Playgrounds specifics, Tynker, Lightbot, Apple Shortcuts/IFTTT builder usability, radial menus on touch, thumb-zone studies. `UNVERIFIED RECALL`: Scratch 3.0's editor is not supported on phones; Apple HIG recommends ≥44 pt and Material ≥48 dp touch targets; Shortcuts and IFTTT are vertical list/card builders with tap-to-add actions.
- The Blockly "Tips" paper and the ScratchJr IDC paper could not be read in full; only abstract-level points are reported.
- Gladiabots forum threads on mobile editor pain points were not retrievable.

## 5. End-user programming research: rules, mental models, gentle slope

### Takeaway
Non-programmers naturally describe behaviour as **event/condition-triggered rules**, and novices learn multi-condition trigger-action rules quickly; the well-documented traps are **ambiguity between events and states**, timing, and interactions between rules. Kodu demonstrates that a when→do language with a tiny vocabulary reaches real expressiveness.

### Cited Findings
- Pane, Ratanamahatana & Myers (IJHCS 2001): in non-programmers' written solutions, 54% of statements were event-based ("what should happen when/if/after some event"), and ~75% were event-based or easily convertible (figures via secondary summaries); the HANDS children's language was designed event-based as a result — [dblp record](https://dblp.uni-trier.de/rec/journals/ijmms/PaneRM01.html); [McInnes summary, 2016](https://allanmcinnes.github.io/2016/05/15/intuitive-functional-requirements); [Pane thesis, CMU 2002](https://www.csd.cmu.edu/sites/default/files/phd-thesis/CMU-CS-02-127.pdf)
- Ur et al. (CHI 2014) analysed 67,169 IFTTT programs and ran a 226-participant usability test: "inexperienced users can quickly learn to create programs containing multiple triggers or actions" — [CHI 2014 record](https://www.springerprofessional.de/doi/10.1145/2556288.2557420)
- Huang & Cakmak (UbiComp 2015) distinguish trigger types (**states vs events**) and action types (**instantaneous, extended, sustained**); two user studies found inconsistent interpretations of program behaviour and errors when creating programs — [UW HCR Lab](https://hcrlab.cs.washington.edu/publications/huang2015ubicomp)
- Brackenbury et al. (CHI 2019) identify ten classes of trigger-action bugs (control flow, timing, inaccurate user expectations); in a 153-participant study, "for most of the bug classes ... the presence of a bug made it harder for participants to correctly predict the behavior of the rule" — [dblp record](https://dblp.org/rec/conf/chi/BrackenburyDRVH19); [NSF PAR](https://par.nsf.gov/biblio/10106413)
- Follow-ups: users "do not always correctly understand how a sensor/effector works, which causes errors in user-created rules"; a 2023 qualitative study examines how wording and temporal aspects change trigger interpretation — [Zancanaro et al. 2022](https://iris.unitn.it/bitstream/11572/356861/1/Zancanaro%20et%20al.%202022-%20HCIS-12-48.pdf); [arXiv 2310.06509 (2023)](https://arxiv.org/pdf/2310.06509)
- Kodu (2009-): designed "specifically for young children to learn through independent exploration", "one of very few languages designed using user interface design principles and methodologies", accessible from about age 9, "blends ease of use with expressibility" — [MacLaurin POPL 2011](https://www.researchgate.net/publication/220997100_The_Design_of_Kodu_A_Tiny_Visual_Programming_Language_for_Children_on_the_Xbox_360); [Coy, XRDS 2013](https://dl.acm.org/doi/10.1145/2460436.2460450)
- Kodu users nonetheless reach "complex control flow and boolean logic" — [Stolee & Fristoe, SIGCSE 2011](https://www.researchgate.net/publication/228414070_Expressing_computer_science_concepts_through_Kodu_game_lab)
- AgentSheets/AgentCubes (Repenning): condition/action palettes dragged into rules (1993); a "gentle slope" of stepping stones (seven stages from watching, to pattern-based behaviour authoring, to programming) and the aim to raise "the ceiling of end-user development without raising the threshold"; abrupt transitions to a general language "may be too complex and result in frustration" — [AgentCubes JVLC article](https://home.cs.colorado.edu/~ralex/papers/PDF/AgentCubes_JVLC_article_inpress.pdf); [AgentCubes incremental 3D paper](https://typeset.io/pdf/agentcubes-incremental-3d-end-user-development-4p2wrc8muf.pdf)
- ScratchJr cut its vocabulary to about 30 blocks because Scratch's block count was "overwhelming and not necessary" for its audience — [DevTech SRCD poster](https://sites.bc.edu/devtech/wp-content/uploads/sites/181/2018/02/EKazakoff-SRCD-.pdf)

### Inferences
- Use **one trigger semantics only**: every WHEN is a *state* re-evaluated each think tick ("while hungry", "while predator near"), and every DO is *sustained while the rule is the winner*. This removes the event/state and instantaneous/sustained ambiguities that Huang & Cakmak found; one-shot events ("was just bitten") can be exposed as short-lived states ("recently hurt").
- Use **one conflict rule only**: the highest card whose WHEN is true wins the body this tick. Show the winner live. This addresses the rule-interaction bug classes by making precedence visible rather than implicit.
- Word blocks so the sensor's meaning is unmistakable (range rings drawn on the creature when a sensor card is selected), since misunderstanding what a sensor detects is a named error source.
- Gentle slope for this game: (1) pick a behaviour preset; (2) tweak thresholds on preset cards; (3) reorder/add/remove cards; (4) add modes; (5) signals, flags, timers; (6) optional urgency/utility modifiers. Each step should be a strict superset of the previous one so earlier species remain valid.
- "Wide walls" (many different viable species, not one optimal build) is a balance question for sensor/action variety and budget pricing more than for the language.

### Gaps
- The exact list of Brackenbury et al.'s ten bug classes was not retrieved.
- Not researched (budget): Parsons problems; progressive-disclosure studies; StarLogo TNG / NetLogo novice findings. `UNVERIFIED RECALL`: "low floor, high ceiling" is Papert's phrase and "wide walls" Resnick's; the threshold/ceiling framing is from Myers, Hudson & Pausch (2000); "gentle slope" from MacLean et al. (CHI 1990); Parsons-problem studies (e.g. Ericson et al. 2017) report similar learning in less time than writing code, which motivates "fix this broken creature" puzzles.
- The 54%/75% figures for Pane et al. come from secondary summaries; confirm in the original article. A slide deck also reports a "59%" natural-language figure whose context I could not determine — [UCSD slides](https://cseweb.ucsd.edu/~mcoblenz/teaching/291P_winter2026/slides/11_natural_programming.pdf)
- MacLaurin's paper text (design principles, vocabulary size, gamepad UI specifics) was not accessible; note there are two distinct MacLaurin papers (FDG 2009 "Kodu: end-user programming and design for games"; POPL 2011 "The design of Kodu", pp. 241-246) and one search result conflated their venues.

## 6. Debugging and legibility: showing why a creature did something

### Takeaway
Professional game-AI tooling has converged on **record-then-scrub decision traces drawn in the world**, live highlighting of the active node, and readable scores; player-facing games mostly lag behind this, and players of Gladiabots and The Bibites report debugging/readability as the hard part.

### Cited Findings
- CryEngine's AI Debug Recorder exists because "it is often one bad or wrong decision the agent made some time ago [that] caused a chain reaction of failures ... By the time the AI programmer can bring up any real-time debugging info, the problem may be severely masked" — [CryEngine AI Debugger docs](https://www.cryengine.com/docs/static/engines/cryengine-3/categories/1114113/pages/1048661)
- Its Debug Viewer replays a recording with a time cursor: "Any information that occurred at the moment of time depicted by the cursor is drawn in the world" — [CryEngine AI Debug Viewer docs](https://www.cryengine.com/docs/static/engines/cryengine-3/categories/1114113/pages/1048664)
- Guerrilla Games' ReView talk ("Out of Sight, Out of Mind: Improving Visualization of AI Info", GDC) says debugging moved from "what" to "why?" or "why not?" — [Guerrilla Games](https://www.guerrilla-games.com/read/out-of-sight-out-of-mind-improving-visualization-of-ai-info); [GDC Vault](https://gdcvault.com/play/1020590/Out-of-Sight-Out-of)
- Behaviour-tree debuggers colour nodes live (running / succeeded / failed) with an execution log and per-entity filter — [Olympe Engine BT debugger docs](https://atlasbruce.github.io/Olympe-Engine/user-guide/ai/bt-debugger)
- Unreal practice: log every decision with its cause to the Visual Logger and scrub a per-actor timeline afterwards; console commands can freeze brains while the world runs — [StraySpark guide](https://www.strayspark.studio/blog/debugging-unreal-enemy-ai-gameplay-debugger-visual-logger-ai-lod)
- Utility systems are described as self-explaining when scores are shown ("designers can see exactly why an NPC made a decision by reading the utility scores"), provided normalisation is consistent (low-authority tutorial source) — [The Neural Base](https://theneuralbase.com/ai-for-gaming/learn/beginner/utility-ai/)
- Gladiabots: a Steam reviewer singles out debugging as the hard part; tag/count actions execute immediately mid-evaluation and are visible to later nodes — [Steam reviews](https://steamcommunity.com/app/871930/reviews/?browsefilter=toprated); [Gladiabots wiki: Advanced](https://wiki.gladiabots.com/index.php?title=Advanced)
- The Bibites has an in-game brain panel (0.6.2 notes fix a bug where unattached node loops broke it), and a forum thread is titled "seemingly unreadable brains" — [Bibites 0.6.2 devlog](https://thebibites.itch.io/the-bibites/devlog/973592/the-bibites-062-steam-workshop-and-toward-the-future); [itch.io thread](https://itch.io/t/2535360/seemingly-unreadable-brains)
- Bibites pheromones are drawn in the world as coloured trails, so communication is watchable — [Bibites wiki](https://the-bibites.fandom.com/wiki/Bibites)
- Screeps (code-based): developers get heap statistics, a console-driven profiler package and a RoomVisual drawing API for overlays — [Screeps profiler](https://www.npmjs.org/package/screeps-profiler); [Screeps API](https://docs.screeps.com/api/)
- Pocket Code lets authors test after every added brick, which a reviewer valued — [FutureFive review](https://futurefive.co.nz/story/android-app-review-pocket-code)
- Cell Lab pairs its genome editor with 45 challenges ("presented with an environment and has to design an organism that will survive in it") and an experimental mode with settable environment parameters — [BlueStacks/Play listing](https://www.bluestacks.com/campaign/com.saterskog.cell_lab/en/)
- Gladiabots ships an interactive tutorial; Play Store commenters praise the tutorials — [Google Play](https://play.google.com/store/apps/details?id=com.GFX47.Gladiabots&hl=en)

### Inferences
- A rule-list brain has the cheapest possible "why": the answer is one integer (which card won) plus the handful of sensor values in its WHEN. That can be (a) highlighted live in the editor, (b) shown as a thought-bubble icon above the creature, and (c) logged as a compact trace for scrubbing.
- "Why not?" matters as much as "why": on tapping a card that did not fire, show which of its conditions was false and what the sensor read ("no kin within 6 m; nearest was 9 m"). This is the ReView "why not" idea translated to cards.
- CryEngine's rationale (the decisive mistake happened earlier) argues for **always-on low-rate tracing** of every individual, at least for a sampled few, so a death can be explained after the fact (see section 10).
- Sensor ranges, targets and signals drawn in the world (rings, lines to current target, coloured scent) make watching itself diagnostic.
- Challenge puzzles (Cell Lab's 45 challenges; Gladiabots' tutorial campaign) double as the tutorial for each newly unlocked block.

### Gaps
- What Kodu offers for debugging was not confirmed (`UNVERIFIED RECALL`: Kodu can highlight the currently firing rule and show sight/hearing lines in play mode).
- What Gladiabots offers was not confirmed (`UNVERIFIED RECALL`: replays with an AI-debug overlay showing the evaluated path, and a sandbox mode).
- Whether The Bibites' brain panel shows live activations for a followed individual was not confirmed (`UNVERIFIED RECALL`: it does, with per-node values).
- No research was found on *player-facing* explanation views (as opposed to developer tools) and their effect on comprehension.
- The Sims' thought bubbles/motive bars and Creatures' science kits as legibility devices: search not executed.

## 7. Gating/unlocking language features and pricing behaviour complexity

### Takeaway
Shipped games gate behaviour capacity by **slots** (FF XII, Dragon Age), **node caps** (Gladiabots), **metered compute** (Screeps) or **energy cost per brain element** (The Bibites); all of these are additive, so earlier designs stay valid. Vocabulary is unlocked through challenge/tutorial progression (Cell Lab).

### Cited Findings
- FF XII: gambit slots are bought on the Licence Board; "10 Gambit Slot panels that increase in cost from 15 LP to as much as 100 LP", each adding one slot to that character; guides advise that early on you may not need all ten — [Prima Games guide](https://primagames.com/eguides/final-fantasy-xii-the-zodiac-age-eguide/zodiac-job-system)
- Dragon Age: Origins: tactics slots grow with level (community-reported: 2 at level 1, +1 at levels 3, 6, 10, 15, 20, 25, 30) and with the Combat Tactics skill, whose ranks add slots and require Cunning (sources disagree on 14 vs 16) — [Dragon Age wiki](https://dragonage.fandom.com/wiki/Combat_Tactics); [Steam discussion](https://steamcommunity.com/app/47810/discussions/0/2579854400736575780/?l=latam); [Prima Games](https://primagames.com/eguides/dragon-age-origins-eguide/essentials/the-classes/skills)
- Gladiabots: there is a node count, and "the only nodes that count towards your node count are actions and conditions" (layout/connectors are free) — [Gladiabots wiki: Advanced](https://wiki.gladiabots.com/index.php?title=Advanced)
- The Bibites prices brain complexity in energy at reproduction: Neuron Birth Cost default 250 mE (0.25 E) per hidden neuron; Synapse Birth Cost default 50 mE (0.05 E); "the energy needed to lay an egg increases with the number of synapses and neurons"; upkeep per second is described as a separate factor — [Neuron Birth Cost](https://the-bibites.fandom.com/wiki/Neuron_Birth_Cost); [Synapse Birth Cost](https://the-bibites.fandom.com/wiki/Synapse_Birth_Cost)
- Screeps meters execution: unused CPU accumulates in a bucket up to 10,000; scripts may burst up to 500 CPU per tick from the bucket; if the bucket hits 0 while over the limit, execution halts; Steam owners without subscription get a flat 20 CPU; memory is capped at 2,097,152 characters — [Screeps docs: CPU limit](https://docs.screeps.com/cpu-limit.html); [Screeps community wiki: CPU](https://wiki.screepspl.us/CPU); [Useful Constants](https://wiki.screepspl.us/Useful_Constants)
- Cell Lab unlocks through challenges: 45 challenges, with genome parameters unlocked in later ones — [BlueStacks/Play listing](https://www.bluestacks.com/campaign/com.saterskog.cell_lab/en/); [NamuWiki](https://en.namu.wiki/w/Cell%20Lab:%20Evolution%20Sandbox)
- The Bibites adds brain vocabulary additively across versions: 0.5.0 multiplication node, 0.6.0 egg nodes, 0.6.2 rotation-speed input (whether old brains needed migration was not stated) — [0.5.0 devlog](https://thebibites.itch.io/the-bibites/devlog/464605/the-bibites-050-modernity-and-progress); [0.6.0 devlog](https://thebibites.itch.io/the-bibites/devlog/809631/the-bibites-060-organs-and-science); [0.6.2 devlog](https://thebibites.itch.io/the-bibites/devlog/973592/the-bibites-062-steam-workshop-and-toward-the-future)
- Human Resource Machine paces difficulty gently across ~25 core levels — [Bonus Stage review](https://www.bonusstage.co.uk/archives/57306)

### Inferences
- **Additive unlocks never invalidate old designs**: new sensors, new actions, more card slots, more modes, new modifiers. Avoid unlocks that change semantics of existing blocks.
- Pricing options that fit a shared body+brain budget: (1) each *sensor type* and *action type* a species uses costs budget once (like an organ), (2) each card slot/mode costs a little, (3) ranges/precision of sensors scale cost. Pricing sensors rather than rules aligns the player's cost with the server's real cost (perception queries) and with the biological trade-off.
- Bibites-style *energy upkeep* (bigger brain = hungrier individuals) is a second lever that creates an in-world trade-off instead of a hard cap; a hard cap is simpler to explain on a phone. Using both (hard cap on slots, soft energy cost per sensor) is plausible.
- Counting only "meaningful" elements (Gladiabots) is a good principle: never charge for organisation (mode names, comments, ordering).
- Version every species' brain with the ruleset version it was authored under so that later balance changes can be migrated or grandfathered.

### Gaps
- No source discussed migration of player-authored behaviour across language changes.
- The Bibites' per-second brain upkeep values and Gladiabots' actual node-cap number were not retrieved.
- Unlock pacing in HRM/7 Billion Humans/Lightbot (new command per level) was not researched (`UNVERIFIED RECALL`: each introduces commands one at a time via levels).
- Screeps' CPU-per-GCL schedule was not confirmed.

## 8. (Added scope) Which representations support small, safe, incremental edits to a species that is already alive?

### Takeaway
Representations where meaning is **local and positional** (priority rule cards, per-mode parameter lists, slot-limited gambits) support two-minute phone edits; representations where meaning is **distributed** across wires, weights, transitions or multiplied scores tend to require re-reading the whole program. This section is mostly inference from the evidence in sections 1-7; no search budget remained for dedicated sources.

### Cited Findings
- Rule lists: Kodu evaluates a page's rules top to bottom each frame and FF XII gambits act by priority order (so position in the list is the whole of a rule's precedence) — [Stolee & Fristoe 2011](https://kstolee.github.io/assets/papers/sigcse2011.pdf); [StrategyWiki](https://strategywiki.org/wiki/Final_Fantasy_XII/Gambits)
- But rules interact: in trigger-action programming, rule bugs (control flow, timing, expectation mismatches) made behaviour harder for participants to predict — [Brackenbury et al., CHI 2019](https://par.nsf.gov/biblio/10106413)
- Cell Lab's genome is a set of independent per-mode settings (each mode's two child modes are set individually) — [Cell Lab wiki: Genome Settings](http://wiki.cell-lab.net/Genome_Settings)
- Behaviour trees, as commonly misused, become monolithic and "very hard to extend or refactor" — [arXiv 2008.11906](https://ar5iv.labs.arxiv.org/html/2008.11906)
- FSMs: explicit transitions have n² complexity — [Halo 3 slides](https://web.cs.wpi.edu/~rich/courses/imgd4000-d09/lectures/halo3.pdf)
- Utility: with multiplied considerations, scores shrink as considerations are added (hence a compensation factor) and a single zero vetoes the behaviour — [Utility Intelligence docs](https://uintel-go.utilityworlds.com/Documentation/UtilityIntelligence/Considerations/)
- Steering weights: "finding 'right' weight can be challenging" and mixes can get stuck in equilibrium — [SDU lecture notes](https://imada.sdu.dk/~rolf/Edu/DM842/E17/lec3.pdf)
- Neural graphs: a Bibites forum thread is titled "seemingly unreadable brains" (body not retrieved) — [itch.io thread](https://itch.io/t/2535360/seemingly-unreadable-brains)
- Gladiabots' tree editor relies on layout aids (move parent without children, snap-to-grid, connector nodes) — [1.4.13 devlog](https://gfx47.itch.io/gladiabots/devlog/137457/1413-changelog-latest-dev-version); [Gladiabots changelog](https://wiki.gladiabots.com/index.php?title=Changelog)
- Subsumption layers can each be independently coded, tested and debugged — [Wikipedia: Subsumption architecture](https://Www.Wikipedia.org/wiki/Subsumption_architecture)

### Inferences
- Reading the cited findings together: in a list, a card's effect is bounded by its position, so reordering or inserting is a self-contained edit; in FSMs a new state needs new transitions to and from existing states; in multiplied-utility systems one added consideration rescales that behaviour against all others; in trees and graphs the edit also costs layout work. The table below applies that reasoning (all cells are inference).

Edit-locality ranking for the four requested micro-edits (tweak a threshold / add a rule / reorder / swap a block):

| Representation | Tweak one threshold | Add one rule | Reorder priority | Swap one block | Must re-read whole program? |
|---|---|---|---|---|---|
| Rule cards in modes | One slider on one card | One card; effect bounded by its position | Native gesture | Tap slot → picker | No: read only cards above the edit in that mode |
| Subsumption layers | Per-layer | Add a layer | Native | Per-layer | No |
| Per-mode parameter list (Cell Lab) | Native | n/a (fixed fields) | n/a | Native | No |
| Utility cards | Slider/curve, but shifts balance against all others | Changes competition globally | No ordering to reorder; must retune scores | Curve swap | Partly: need the score view |
| Behaviour tree | Per-node | Requires choosing a place in the hierarchy | Re-parenting subtrees | Per-node | Often |
| FSM | Per-transition | New state needs many transitions | n/a | Per-transition | Often |
| Weighted graph / neural | A weight, effect opaque | New wires interact with all paths | n/a | Rewire | Yes |
| Steering mix | Slider, but coupled to all others | New term rebalances all | n/a | n/a | Yes (retune) |
| Imperative blocks / tiny VM | Literal edit | Insert in sequence; control-flow risk | Reorder changes semantics | Possible | Yes |
| GOAP | Cost tweak | New action changes plans unpredictably | n/a | n/a | Yes (cannot predict plans) |

- For a 15-minute daily check-in the editor should make the four micro-edits first-class: threshold sliders directly on the card face; a "＋ rule" button that inserts at a suggested position; drag-handle/arrows to reorder; tap-to-swap blocks.
- **Safety for live species**: (1) edits apply to a *draft* and show a diff ("1 threshold changed") before "release to the wild"; (2) quick sandbox preview of the changed rule (a 10-second ghost run on a canned scene); (3) one-tap revert to the previous released version; (4) optionally, edits take effect on newly born individuals only, which is both biologically flavoured and a natural A/B test. These are design proposals, not sourced practices.
- A **per-card on/off toggle** is the safest edit of all (disable rather than delete) and is cheap to support in a list UI.
- Because rule interaction is the residual risk, show for each card how often it actually fired in the last day ("fired 312×, never fired, always shadowed by card 2"); "never fires" and "shadowed" warnings directly target the TAP bug classes.

### Gaps
- No empirical study was found comparing edit time/error across behaviour representations; the cognitive-dimensions literature would be the place to look (`UNVERIFIED RECALL`: Green & Petre 1996, "Usability analysis of visual programming environments", report box-and-wire languages as highly *viscous*, i.e. small changes need disproportionate layout work, with *hidden dependencies*; search not executed).
- Whether FF XII lets gambits be toggled on/off individually was not confirmed this session (`UNVERIFIED RECALL`: it does).
- No evidence on how live-service programming games (Screeps) handle hot-swapping code in a persistent world (`UNVERIFIED RECALL`: Screeps applies committed code on the next tick, with branches for staging).

## 9. (Added scope) Which representations support a satisfying read-only "watch my creature think" view for the daily check-in?

### Takeaway
A glanceable view needs three things the representation must be able to supply cheaply: **a current mode/mood, drive levels, and the single thing it is doing and why**. Rule-in-mode and drive/utility systems provide these natively (one active card, a few bars); trees provide a highlighted path; neural graphs and steering mixes provide activation values that players find hard to read. Largely inference; dedicated searches were not possible.

### Cited Findings
- Needs/drive systems carry an explicit internal state: Sims choose by current motive levels, personality and what nearby objects advertise — [draft wiki article citing Zubek](https://wiki.riteme.site/wiki/User:ElijahPepe/Artificial_intelligence_in_The_Sims)
- Reading utility scores shows "exactly why" a choice was made (tutorial-level source) — [The Neural Base](https://theneuralbase.com/ai-for-gaming/learn/beginner/utility-ai/)
- Tree debuggers highlight running/succeeded/failed nodes live — [Olympe Engine BT debugger docs](https://atlasbruce.github.io/Olympe-Engine/user-guide/ai/bt-debugger)
- Scrubbable recordings draw an agent's information in the world at the chosen moment — [CryEngine AI Debug Viewer](https://www.cryengine.com/docs/static/engines/cryengine-3/categories/1114113/pages/1048664)
- The Bibites offers a brain panel, yet players report unreadable brains — [0.6.2 devlog](https://thebibites.itch.io/the-bibites/devlog/973592/the-bibites-062-steam-workshop-and-toward-the-future); [itch.io thread title](https://itch.io/t/2535360/seemingly-unreadable-brains)
- World-visible signals (Bibites pheromone trails) and colour-coded target relations (Gladiabots node colours) are existing glanceable encodings — [Bibites wiki](https://the-bibites.fandom.com/wiki/Bibites); [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1759851189)
- Will Wright reported that The Sims' autonomy was initially "too good": almost anything the player did was worse than autopilot — [PC Gamer](https://www.pcgamer.com/games/the-sims/will-wright-says-the-original-sims-ai-was-actually-too-good-almost-anything-the-player-did-was-worse-than-the-sims-running-on-autopilot)

### Inferences
| Representation | What a watch view can show at a glance | Glanceability |
|---|---|---|
| Rules in modes + drives | Mode badge ("Night · Hunting"), 3-4 drive bars, thought bubble with the active card's icons ("prey seen → chase"), tap for "why / why not" | High |
| Drives / utility | Bars racing each other; top score wins | High for "mood", medium for "why" (numbers) |
| Behaviour tree | Lit path through a tree | Medium; needs the tree on screen, poor on a phone |
| FSM | Current state name | High but shallow (no reason within the state) |
| Subsumption | Which layer is in control | High |
| Neural / weighted graph | Heat-mapped nodes | Low (documented readability complaints) |
| Steering mix | Force arrows on the creature | Medium for movement only |
| Imperative / tiny VM | Program counter | Low meaning per glance |
| GOAP | Current plan as a step list | Medium-high to read, but hard to explain why that plan |

- Proposed daily check-in screen (design proposal): follow-cam on one individual; **mode badge**; **drive bars** (hunger, fear, energy, mating urge); **thought bubble** = icons of the winning card; a **ticker** of the last few decisions ("fled from Rex-tooth · fed · joined herd"); population-level strip ("62% foraging, 20% resting, 10% fleeing") with yesterday's deaths by cause. All of these are derivable from one small integer per agent (mode, active card) plus drive values the sim already has.
- Aggregate "what are my creatures doing right now" histograms by active card are nearly free to compute server-side and give the Tamagotchi-like glance without picking an individual.
- Drives are worth having in the sim even if the authoring language is rules, purely because they make the creature's "mood" displayable and give the thought bubble an emotional register.
- The Sims "too good autonomy" anecdote cuts both ways for a watch view: watching is engaging when the creature visibly has unmet needs and makes imperfect, player-authored choices; a built-in drive system that solves survival by itself would leave the player's rules with nothing to add.
- Tapping from the watch view into the exact card that is firing (read-only → edit) is the natural bridge from the daily check-in to a micro-edit (section 8).

### Gaps
- No sourced evidence on what players find satisfying in passive "watch it think" views (Tamagotchi-likes, The Sims' thought bubbles and motive panel, Creatures' Norn health/brain kits, RimWorld-style "current job + needs" inspectors); these searches were not executed. `UNVERIFIED RECALL`: The Sims shows motive bars and thought-bubble icons for the current want; RimWorld's inspect pane shows the pawn's current job and a needs tab; Creatures shipped applets graphing drives and brain activity.
- Whether Bibites' panel animates live activations was not confirmed.

## 10. (Added scope) How editors support a longer weekly design session

### Takeaway
The patterns visible in comparable games are **sandbox/experimental arenas with settable conditions, challenge puzzles, reusable sub-behaviours, copy/paste, file-level sharing of designs, and recorded traces for post-mortem**; versioning/diffing and design notebooks appear in none of the sources found and would be a differentiator. Evidence is partial; dedicated searches were not possible.

### Cited Findings
- Sandbox arenas: Cell Lab has "an experimental mode where the user can set the parameters of the environment and put designed organisms in it to see how they multiply (or die)", with an environment editor of 27 parameters, alongside 45 challenges — [BlueStacks/Play listing](https://www.bluestacks.com/campaign/com.saterskog.cell_lab/en/)
- Test-as-you-build: Pocket Code lets authors check behaviour after each new brick — [FutureFive review](https://futurefive.co.nz/story/android-app-review-pocket-code)
- Reuse and copying: Gladiabots supports sub-AIs (reusable sub-trees) and copy/paste of nodes — [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=1759851189); [Gladiabots changelog](https://wiki.gladiabots.com/index.php?title=Changelog)
- Sharing/forking: The Bibites 0.6.2 added Steam Workshop integration, and its creature files (.bb8) are plain enough that the wiki documents editing them in Notepad — [0.6.2 devlog](https://thebibites.itch.io/the-bibites/devlog/973592/the-bibites-062-steam-workshop-and-toward-the-future); [Bibites wiki: Modifying .bb8 files](https://the-bibites.fandom.com/wiki/Modifying_.bb8_files_with_Notepad)
- Learning from others' designs: community guides walk through hand-built brains ("How I Programmed my first ever Bibite brain"; a brain guide credited by a commenter with surviving a 25-hour challenge) — [Steam guide](https://steamcommunity.com/sharedfiles/filedetails/?id=3441916076); [Steam discussion](https://steamcommunity.com/app/2736860/discussions/0/591764116171928749/)
- Reuse by analogy is an established end-user-programming strategy (Repenning & Perrone, "Programming by Analogous Examples", CACM 2000) — [abstract](https://home.cs.colorado.edu/~ralex/papers/abstracts/cacm2000.html)
- Post-mortem traces: CryEngine records agents' inputs and decisions to a file precisely because the causal mistake is usually earlier than the visible failure; the viewer scrubs through it; Unreal's Visual Logger gives a per-actor timeline — [CryEngine AI Debugger](https://www.cryengine.com/docs/static/engines/cryengine-3/categories/1114113/pages/1048661); [StraySpark guide](https://www.strayspark.studio/blog/debugging-unreal-enemy-ai-gameplay-debugger-visual-logger-ai-lod)
- Profiling: Screeps players use a console profiler to see where their budget goes — [Screeps profiler](https://www.npmjs.org/package/screeps-profiler)
- Gentle-slope staging of a long session: AgentSheets' stepping stones run from watching, to pattern-based authoring, to programming — [AgentCubes JVLC article](https://home.cs.colorado.edu/~ralex/papers/PDF/AgentCubes_JVLC_article_inpress.pdf)

### Inferences
- **Sandbox test arena** (Cell Lab precedent): a private mini-world where the player drops N of the draft species plus chosen threats/food/weather, runs at high speed, and gets a summary. Scenario presets ("a predator arrives at dusk", "food runs out", "mating season") turn the feature list into test cases. Fast-forward is cheap if the brain is a rule list.
- **Drafts and a design notebook**: keep unlimited named drafts separate from released species; auto-capture a note per release ("v3: flee earlier at night"). A rule-card brain serialises to a few hundred bytes of text, so storing every version is trivial.
- **Fork/copy**: "start from my previous species" and "start from a friend's species (if they share it)" are the phone-friendly equivalents of Gladiabots' copy/paste and Bibites' Workshop. In a small friend group, forking a rival's published design is also a social mechanic.
- **Diffing**: with cards as the unit, a diff is human-readable without special tooling ("card 3 threshold near→mid; card 5 added; cards 2↔4 swapped"). This is a concrete advantage of list representations over graphs, where diffs are hard to present.
- **Learning from a dead species**: store per-species aggregates continuously (card-firing counts by time of day, deaths by cause and by the card active at death, time-in-mode) and a sampled set of full individual traces (mode, active card, drive levels every few seconds). Present as an "autopsy": "41% died while executing 'forage' with fear high: flee rule never outranked forage". CryEngine's rationale supports recording rather than relying on live inspection.
- **Session shape** for the weekly sitting: autopsy of last species → fork → edit in draft → sandbox scenarios → challenge puzzle for any newly unlocked block → release. The daily check-in reuses the same watch view and the micro-edit path (sections 8-9).
- Trace storage budget is modest: two small integers plus four drive bytes per sample; even every 5 s for a sampled 20 individuals per species is a few MB per week (back-of-envelope, not sourced).

### Gaps
- No source was found describing version history, diffing or design notebooks in any behaviour-authoring game; I cannot say whether this is absent in the genre or merely not surfaced by the searches run.
- Gladiabots' sandbox, replay and AI-sharing features and Screeps' simulation room/replay history were not confirmed this session (`UNVERIFIED RECALL`: both exist; Gladiabots shares AIs via export codes; Screeps offers a simulation mode and room history replay).
- Scratch's remix model as evidence for forking was not searched (`UNVERIFIED RECALL`: remixing is a core, heavily used Scratch community feature).
- No evidence on how long non-programmers are willing to spend in a phone editor per sitting.
