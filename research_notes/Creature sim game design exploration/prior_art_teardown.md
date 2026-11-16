# Prior-art teardown: creature/ecosystem and player-programming games (as of 14 Nov 2026)

> **Research conditions (read first).** Page fetching was blocked in this session (hosts such as designer-notes.com, en.wikipedia.org, *.fandom.com, alanzucconi.com were outside the network allowlist), and the shared web-search budget ran out before the last batch of queries. Every cited finding below therefore comes from **search-result summaries/snippets, not full-page reads**. Quotes are as surfaced by search; verify wording against the linked original before publishing. Where a summary did not make clear which of several result URLs a claim came from, that is flagged "(attribution uncertain)". Anything I know only from memory and could not source this session is confined to the **Gaps** subsections and labelled "unverified recall".

---

## 1. Spore: how the creature creator worked, why it is loved, why the game was criticised

### Takeaway
The creator succeeded because it was a "magic crayon" (trivial input, impressive output) backed by procedural animation that made *any* body come alive; the game failed because five shallow stages gave those bodies almost no mechanical consequence, so parts were discrete ability tokens and the editor became cosmetic. The designers themselves say the unresolved question was whether the editor should be aesthetic freedom or gameplay consequence.

### Cited Findings
**Creator mechanics**
- DNA points are the Creature-Stage currency, earned by befriending or hunting other species and spent in the creator on parts; higher-level parts give stronger stats. — [Spore Wiki: Creature Stage](https://spore.fandom.com/wiki/Creature_Stage), [Spore Wiki: Creature Creator](https://spore.fandom.com/wiki/Creature_Creator)
- A second, separate limit is the complexity meter: "as you add parts, a meter tracks the complexity of the creature, and eventually it will max out"; at maximum you cannot add parts without removing some. — [Spore Wiki: Creature Creator](https://spore.fandom.com/wiki/Creature_Creator); [2008 player tips blog](https://hallower1980.blogspot.com/2008/06/spore-creature-creator-intro-tips.html) (attribution uncertain between these two)
- Parts grant abilities in three families: 4 combat, 4 social, 5 movement. Example: the herbivore Filter Mouth costs 15 points and grants Bite and Sing. — [GameFAQs Spore FAQ mirror](https://gopherproxy.meulie.net/tilde.pink/0/~bencollver/gamefaqs/text/pc/spore/spore-faqs-54025.txt) (community FAQ; the 4/4/5 count's exact source page is uncertain)
- The official tutorial exposes an "Abilities" button showing current and unlocked abilities. — [spore.com tutorial](https://www.spore.com/comm/tutorials/hero_creature_creation)
- Player-reported "stat stick" behaviour: "when buying 2 of the same part you pay the same amount of points for the 2nd as you did the 1st but don't get any stats with it." — [Steam discussion "Aesthetic vs Stats"](https://steamcommunity.com/app/17390/discussions/0/558750985878743384/)
- Parts are "rigblocks": reusable parts where clip names drive a hand-crafted animation through every part sharing that clip name. — [modder blog: Spore Rigblocks](https://janeng.com/?p=104)
- Chris Hecker joined Maxis in 2004 and led creature tessellation, painting, skinning and animation; the animation system is documented in the SIGGRAPH 2008 paper "Real-time Motion Retargeting to Highly Varied User-Created Morphologies". — [Wikipedia: Chris Hecker](https://en.wikipedia.org/wiki/Chris_Hecker), [chrishecker.com paper page](https://www.chrishecker.com/Real-time_Motion_Retargeting_to_Highly_Varied_User-Created_Morphologies), [Hecker: How To Animate a Character You've Never Seen Before](https://chrishecker.com/How_To_Animate_a_Character_You%27ve_Never_Seen_Before)

**Why the creator worked (Gingold)**
- Chaim Gingold's "magic crayon": a tool simple to use that still gives enough power to make something the user appreciates; he cited Kid Pix and the Mii creator as models. His phrase for the interaction loop: "Soft mastery, you do something, you look at what's done, you give and take." (GDC 2007) — [Engadget, 12 Mar 2007](https://www.engadget.com/2007-03-12-spores-power-struggle-freedom-vs-beauty.html); slides at [liminal.gg](https://www.liminal.gg/spores-magic-crayons-slides/)
- Gingold called the Creature Creator the most difficult design challenge: the first editor players touch but the hardest to build; leg manipulation was the last and hardest piece. (2008 keynote) — [Game Developer: Gingold Talks Spore's 'Magic Crayon' Approach](https://www.gamedeveloper.com/game-platforms/gingold-talks-i-spore-i-s-magic-crayon-approach)
- Gingold and Hecker credited cheap, agile, testable prototypes (including a leg-movement prototype) for getting there. — [Game Developer: MIGS keynote](https://www.gamedeveloper.com/game-platforms/migs-keynote-gingold-hecker-on-i-spore-i-prototyping)
- Art director Ken Quigley reportedly described editor accessibility as like "art-directing a million incompetents" (secondhand, fan wiki). — [Spore Wiki: Development of Spore](https://spore.fandom.com/wiki/Development_of_Spore)
- Soren Johnson on the art style: a more realistic style would have meant "a lot of really grotesque creatures"; the cartoony look was a creative choice. — [Game Developer interview](https://www.gamedeveloper.com/design/interview-soren-johnson---i-spore-i-s-strategist)

**Why the game was criticised (post-mortems)**
- Soren Johnson, "Spore: My View of the Elephant" (30 Sep 2013; cross-posted 2 Oct 2013): Spore was built on two ideas, powers-of-ten and procedural content; the second emerged in prototyping and the team never re-evaluated the first against it. — [Designer Notes](https://www.designer-notes.com/spore-my-view-of-the-elephant/), [Game Developer cross-post](https://www.gamedeveloper.com/design/spore-my-view-of-the-elephant)
- Johnson: play at each stage was "fairly shallow" because the team was "making five games at once"; limiting scope to the biological stages would have let them fully explore the intersection of procedural content and evolutionary gameplay. — [Designer Notes](https://www.designer-notes.com/spore-my-view-of-the-elephant/), [GamingBolt summary](https://gamingbolt.com/?p=174091)
- Johnson: the root issue was "a philosophical debate about the role of the editor in the game": unparalleled aesthetic customisation at the expense of gameplay consequence, or mechanics that respond to every player choice even if that limits the editor. The creature parts' gameplay effects were "unfortunately quite discrete", in contrast to the cell stage where editor choices have real consequences; in the later social stages editors "served a mostly cosmetic role". The gameplay-first group went on to make Darkspore. — [Designer Notes](https://www.designer-notes.com/spore-my-view-of-the-elephant/)
- Will Wright: "a fairly interesting dynamic between certain members of our team that we ended up calling the 'cute' team versus other members that we called the 'science' team." (2008) — [Time Techland](https://techland.time.com/?p=640)
- Hecker is quoted as saying "I was the founding member of the 'cute' team" (original outlet not identified in results; attribution uncertain). Players blamed him for the lack of hard science after a Seed Magazine piece, an interpretation Wright and producer Lucy Bradshaw rejected (Bradshaw: "Will very much remained the visionary and design leader"). — [Wikipedia: Chris Hecker](https://en.wikipedia.org/wiki/Chris_Hecker); fan discussion at [Quarter To Three](https://forum.quartertothree.com/t/how-spore-ended-up-cute-and-dumbed-down/48324) (opinion, not reporting)
- Hecker's verdict: Spore "had more magic in it than most games" but was "overall a failed game design". — [Wikipedia: Chris Hecker](https://en.wikipedia.org/wiki/Chris_Hecker)
- Wright in a later retrospective: "the biggest criticism of Spore, which I totally accept, is that it felt like five separate games that were kind of stuck together." — [wnhub retrospective](https://wnhub.io/news/other/item-51114) (attribution uncertain)
- Reader takeaway from the Johnson essay: Spore should not have hyped evolution, because the game was not built around it. — [MetaFilter thread](https://www.metafilter.com/132623/Spore-My-View-of-the-Elephant)

### Inferences
- Two orthogonal budgets (a spend currency plus a hard complexity cap) is a proven pattern: one prices power, the other protects performance and readability. Our game can use the same split (e.g. "biomass" cost and a part-count cap).
- Spore's failure mode is exactly the one to avoid: abilities keyed to "has part at level N" rather than to shape, size, placement or count. If body choices do not continuously change simulation outcomes (speed, energy cost, reach, sensing), the editor becomes dress-up and the friends' competition becomes a build-order lookup.
- Johnson's own counterfactual ("only the biological stages") is close to our scope. That is encouraging: one stage, deep consequence.
- "Soft mastery" implies instant feedback inside the editor (the test-drive loop). For us: a sandbox preview where the designed creature runs its behaviour program for 20 seconds before release.
- The cartoony style was a deliberate guard against grotesque user output. Constrained part vocabularies plus forgiving procedural animation make every player's creature look intentional, which matters for sharing among friends.

### Gaps
- I could not read the Johnson essay, the Gingold slides or the Hecker paper in full; the "four lessons" in Johnson's essay were not retrieved.
- Exact DNA budgets, complexity cap values and the per-part level tables were not retrieved. Unverified recall: abilities have levels 1 to 5 and only the highest-level part of each ability counts (consistent with the Steam thread above).
- Unverified recall: the standalone Creature Creator (June 2008) passed one million uploaded creatures in about a week. The search for this figure did not run.
- No retrieved source quantifies how many players disliked the stages versus the creator.

---

## 2. Creatures (Norns): brain, biochemistry, drives, genetics; attachment and opacity

### Takeaway
Creatures coupled a lobe-structured neural net to a chemical soup: drives are chemicals, reward and punishment are chemicals, and learning is drive reduction. That produced pets that seemed "genuinely alive" and also behaviour that even its creator called highly unpredictable, with failures players could not diagnose.

### Cited Findings
- Created by Steve Grand at Millennium Interactive, released 1996, originally pitched as a desktop pet with a brain. — [Wikipedia: Creatures (video game series)](https://en.wikipedia.org/wiki/Creatures_(video_game_series))
- The brain is organised into nine lobes; e.g. the Decision lobe picks the action and the Attention lobe picks the object of focus. — [Wikipedia: Creatures](https://en.wikipedia.org/wiki/Creatures_(video_game_series)); nine lobes also per [fan brain blog](https://madnornscientist.blogspot.com/2016/03/mucking-about-with-norn-brains.html)
- The concept lobe is the largest, 640 neurons in Creatures 1, and stores/recalls memories of events; perception is the second largest. — [Creatures Wiki: Concept lobe](https://creatures.fandom.com/wiki/Concept_lobe)
- Most Creatures 2 breeds have about 1,000 neurons (Kimahri Norns about 1,316). — [Creatures Wiki: Kimahri Norn](https://creatures.fandom.com/wiki/Kimahri_Norn)
- Drives punish when raised and reward when lowered; the decision model is behaviourist, built on Norns learning to reduce drives. Grand called it "primitively Behaviorist" and said the psychology was inspired by rats. — [Wikipedia: Creatures](https://en.wikipedia.org/wiki/Creatures_(video_game_series))
- Each drive is three chemicals: a raiser converts to the drive chemical plus Punishment; a reducer reacts with the drive chemical to yield Reward. — [Creatures Wiki (Fandom): Drive](https://creatures.fandom.com/wiki/Drive)
- Creatures 1 drives (13): Pain, Need for Pleasure, Hunger, Coldness, Hotness, Tiredness, Sleepiness, Loneliness, Crowdedness, Fear, Boredom, Anger, Sex Drive. Creatures 2 added Injury, Suffocation, Thirst, Stress. — [Creatures Wiki: Drive](https://creatures.wiki/Drive)
- "Need for Pleasure" is inverted because every drive had to be bad-when-high; happiness is modelled as a need that falls when pleasure arrives. — [Creatures Wiki: Need for Pleasure](https://creatures.wiki/Need_for_Pleasure)
- Genetics: a digital genome split into genes defines brain structure and biochemistry; Norns are haploid with no dominant/recessive genes. In the default Creatures 3/Docking Station breeds, brain structure does not mutate. — [Wikipedia: Creatures](https://en.wikipedia.org/wiki/Creatures_(video_game_series))
- Community brain mods exist (Canny Norns add Echo, Search and Choice lobes) but break interbreeding with the standard genome. — [Creatures Wiki: Canny Norn](https://creatures.fandom.com/wiki/Canny_Norn)
- Grand wanted players to feel rapport with creatures that seemed "genuinely alive"; in 2011 he said Norns could learn and react but not think, and that the biochemistry's complexity made behaviour highly unpredictable. — [Wikipedia: Creatures](https://en.wikipedia.org/wiki/Creatures_(video_game_series))
- Opacity in practice: players report Norns whose hunger "just shoots up and is constantly in the red" with no visible cause. — [Creatures Caves forum](http://creaturescaves.com/forum.php?thread=6150&view=3)
- The reward/punishment wiring is itself genetic and moddable: one widely shared story describes a Norn engineered so reward was tied to punishment and it could only feel pain. — [Tumblr repost](https://twitterfeedsifollowrss.tumblr.com/post/649322995665584128/video-game-creatures-or-how-the-us-navy) (anecdote)

### Inferences
- Attachment came from individual, named, long-lived creatures with visible needs and a teaching relationship, not from the neural net as such. A species-level survival game loses individual identity unless it surfaces "notable individuals" (oldest, most offspring, last survivor).
- A small set of legible drives (hunger, fear, crowding, sex) is a good vocabulary for a behaviour program's *inputs*: players already think in those terms.
- Opacity came from stacking learning on chemistry on genetics with no causal readout. For a competitive game among friends, "why did my species die?" must be answerable; avoid hidden intermediate state that the UI cannot show.
- Lifetime learning is the least transferable piece: it is unpredictable, hard to balance, and in a 3 to 7 day species contest the "learning" should be the player iterating between rounds.

### Gaps
- No retrieved source documents player grief/attachment directly (the search for it did not run). Alan Zucconi's "The AI of Creatures" ([link](https://www.alanzucconi.com/2020/07/27/the-ai-of-creatures/)) and Grand's own writing were not readable.
- Gene counts, the number of chemicals, and dendrite migration/learning-rule details were not retrieved. Unverified recall: 256 chemical slots.

---

## 3. The Bibites: brain editor, genes, energy economics, hand-design experience

### Takeaway
The Bibites exposes a NEAT-style graph brain (fixed sensor inputs, fixed actuator outputs, typed hidden nodes, weighted synapses) plus continuous genes, and uses energy as the only budget: there is no hard cap on brain or body, only birth and upkeep costs. Players who hand-build brains describe it as programming in an unfamiliar language that needs many tune-and-rerun iterations.

### Cited Findings
- The brain uses "a custom algorithm loosely based on the rt-NEAT algorithm"; brains start small and structure and weights change by mutation. The default bibite has 33 inputs and 15 outputs. — [Bibites Wiki: Brain](https://the-bibites.fandom.com/wiki/Brain)
- No hard size limit: bibites "can grow to have an infinite number of neurons and synapses (aside from energy limitations)". — [Bibites Wiki: Brain](https://the-bibites.fandom.com/wiki/Brain)
- Inputs/outputs are a fixed indexed table (examples: EnergyRatio, Maturity, NBibites). — [Bibites Wiki: Input and Output Neurons](https://the-bibites.fandom.com/wiki/Input_and_Output_Neurons)
- Hidden nodes apply a function to incoming signals, can both receive and send, and can carry a bias; a community guide recommends learning Linear, ReLU, Abs, Latch and Multiply first, and using in-game hover tooltips. — [Steam: Bibite brain guide](https://steamcommunity.com/app/2736860/discussions/0/591764116171928749/)
- Version 0.6.0 added Integrator (sums input with its previous output) and Inhibitor (self-inhibits, drifting to zero under constant input) node types, plus two egg-related brain nodes. — [0.6.0 devlog](https://thebibites.itch.io/the-bibites/devlog/809631/the-bibites-060-organs-and-science)
- Editor flow: pick an input neuron, an output neuron and a strength, click "add synapse"; add hidden neurons by choosing a type from a dropdown; an expanded tree view shows hidden neurons and synapse strengths. — [Bibites Wiki: Editing Bibites (Tutorial)](https://the-bibites.fandom.com/wiki/Editing_Bibites_(Tutorial))
- 0.5.0 added per-node icons to make brains easier to read. — [0.5.0 devlog](https://thebibites.itch.io/the-bibites/devlog/464605/the-bibites-050-modernity-and-progress)
- Brain cost is paid twice: at birth (defaults 0.25 E per hidden neuron, 0.05 E per synapse, added to egg cost) and as per-second upkeep. — [Bibites Wiki: Neuron Birth Cost](https://the-bibites.fandom.com/wiki/Neuron_Birth_Cost), [Synapse Birth Cost](https://the-bibites.fandom.com/wiki/Synapse_Birth_Cost)
- The developer tuned this lever directly: 0.4.1 lowered brain upkeep "to encourage bigger brains". — [0.4.1 devlog](https://itch.io/devlog/362871/the-bibites-v041.amp)
- Sensing has a price too: more precise sight/sensing costs more energy. — [developer comment on itch.io](https://itch.io/post/7103031) (attribution uncertain)
- Body budget since 0.6.0: seven internal organs compete for physical space inside the body, apportioned by "WAGG" genes (Weighted Apportionment Genetic Group); the metabolism gene scales all systems linearly (2.0 means roughly double speed, digestion and energy use). — [0.6.0 devlog](https://thebibites.itch.io/the-bibites/devlog/809631/the-bibites-060-organs-and-science)
- Other genes include metabolism speed, Gene Mutation Variance, Average Brain Mutations, Brain Mutation Variance, View Radius, Clock Period, and fat-storage threshold/deadband. — [Bibites Wiki: Genes](https://the-bibites.fandom.com/wiki/Genes); fat genes per [0.5.0 devlog](https://thebibites.itch.io/the-bibites/devlog/464605/the-bibites-050-modernity-and-progress) (attribution uncertain)
- Hand-design experience: a Steam guide author built a brain for the "apocalypse" challenge that survived 25 hours; it took "several small adjustments to the Bibites diet, metabolism, and brain weights until at version 7 it started to work mostly as intended", and a "problematic hibernation feature" was cut. The author calls the network "basically just another programming language, albeit written in a very different way than conventional languages". — [Steam guide: How I Programmed my first ever Bibite brain](https://steamcommunity.com/sharedfiles/filedetails/?id=3441916076)
- Players also edit save files directly in a text editor. — [Bibites Wiki: Modifying .bb8 files with Notepad](https://the-bibites.fandom.com/wiki/Modifying_.bb8_files_with_Notepad)
- Status: latest public version found is 0.6.2 (Steam Workshop sharing, Unity 6, settings to block pheromone colours); 0.6.3 "Seasons and Events" is planned; the developer aims to update the public branch every 3 to 4 months with community-voted features. — [0.6.2 devlog](https://thebibites.itch.io/the-bibites/devlog/973592/the-bibites-062-steam-workshop-and-toward-the-future), [SteamDB patch notes](https://steamdb.info/patchnotes/18995772)

### Inferences
- The Bibites answers "is there a constraint/budget system?" with "energy only". That works for open-ended evolution but not for a fair competitive design phase: a designer who understands the cost model can out-build friends massively. A visible point budget (Spore-style) layered over energy costs is the more legible choice for us.
- Organs competing for a fixed body volume (WAGG) is the strongest recent idea to borrow: trade-offs are forced by geometry, not by an abstract price list.
- Weighted-synapse graphs are powerful and hard to author on a phone: real-valued weights, many small targets, and behaviour that only shows itself in simulation. The "7 versions" anecdote implies the iterate-in-sandbox loop is where players spend their time; it must be fast.
- A fixed, named sensor/actuator vocabulary (about 33 in, 15 out) is itself a design asset: it defines what a species can know and do. For mobile, a much smaller set (8 to 12 each) with rule-style connections is likely enough.

### Gaps
- Full input/output and node-type lists were not retrieved (search budget). Unverified recall: node types include Sigmoid, Linear, TanH, Sine, ReLU, Gaussian, Latch, Differential, Abs, Mult, Integrator, Inhibitor; outputs include Accelerate, Rotate, Herding, Want2Lay, Want2Eat, Digestion, Grab, ClkReset, PhereOut1-3, Want2Grow, Want2Heal, Want2Attack.
- Whether 0.6.3 or later shipped by Nov 2026 is unconfirmed; the 0.6.2 post had no visible date in results.
- Reddit/Discord sentiment on hand-designed versus evolved brains was not retrieved; only one Steam guide and one Reddit anecdote surfaced.
- Current per-second upkeep formula not retrieved; the wiki's old formula (default cost x speed gene x size) is marked outdated for 0.6.0+. — [Bibites Wiki: Metabolism](https://the-bibites.fandom.com/wiki/Metabolism)

---

## 4. Lego Mindstorms and RoboZZle: what makes tiny block languages learnable and deep

### Takeaway
RoboZZle gets depth from four ingredients: about four primitive actions, a colour condition on any instruction, a handful of short function slots, and recursion with a call stack as the only loop. Mindstorms shows the opposite risk: icon-and-wire dataflow is approachable for short sequences but becomes crowded as programs grow, which is part of why later Lego software moved to Scratch-style blocks.

### Cited Findings
**RoboZZle**
- Instruction set: move forward; turn 90 degrees left or right; paint the current tile; call a function F1..F5. — [RoboZZle Wiki: Commands](https://robozzle.com/wiki/Print.aspx?Page=Commands)
- Any command can carry a colour condition; if the robot stands on a different-coloured tile, the command is skipped. — [RoboZZle Wiki: Commands](https://robozzle.com/wiki/Print.aspx?Page=Commands)
- Colours are red, green and blue; the goal is to collect all stars. — [player forum explanation](https://forumserver.twoplustwo.com/76/laughs-links/game-robozzle-540764/); paint/condition keys for the three colours in the [C64 port documentation](https://csdb.dk/release/?id=175879&show=summary&rss=)
- Functions may call themselves; on a call the current execution point is pushed on a stack so execution resumes after the call site. — [RoboZZle Wiki: Commands](https://robozzle.com/wiki/Print.aspx?Page=Commands)
- There is no loop instruction: "the subroutines are used to loop and branch". — [Robozzle Reboot](https://robozzle.nwidynski.com/)
- Depth comes from the stack: a conditional recursive call acts as a stop condition, and instructions after it run while the recursion unwinds, so the stack doubles as memory/counter. Fan tutorials teach "stack memory" as a technique. — [Robozzle Solutions: Stack Memory Tutorial](https://robozzle.blogspot.com/p/stack-memory-tutorial-1.html), [TeamLiquid thread](https://tl.net/forum/games/164564-robozzle-puzzle-game)
- Origin: a Microsoft Silverlight game by Igor Ostrovsky, since ported widely (C64 port 2019, iOS review, web reboot). — [CSDb](https://csdb.dk/release/?id=175879&show=summary&rss=), [148Apps review](https://www.148apps.com/robozzle/robozzle-review/)

**Mindstorms**
- NXT-G is a LabVIEW-based graphical language: icons are self-contained instruction units placed along a "sequence beam"; multiple beams run in parallel, which "complicates how the blocks are run and when the program ends". — [Brickimedia: Mindstorms NXT-G](https://en.brickimedia.org/wiki/Mindstorms_NXT-G), [No Starch NXT-G chapter](https://nostarch.com/download/nxt-g_ch2.pdf)
- A controlled usability study exists (Nguyen, PPIG 2011: 12 participants, 4 tasks, NXT-G plus robot). — [PPIG paper page](https://www.ppig.org/papers/2011-ppig-23rd-nguyen/)
- Critics say large graphical programs "become crowded and unmanageable". — [FLL team language survey](https://fll-pigeons.github.io/gamechangers/AltProgLangs.html) (attribution uncertain)
- Coaches comparing EV3-G with Scratch-based EV3 tools noted EV3-G's single math block was more compact than nested Scratch operators, while the early Scratch tool lacked group copy/delete. — [FIRST forums thread](https://forums.firstinspires.org/forum/general-discussions/first-programs/first-lego-league/the-challenge/programming-ab/92327-for-ev3-should-we-use-ev3-g-mindstorms-or-scratch-going-forward)

### Inferences
- RoboZZle's lesson is "condition as a modifier, not a block". Attaching a sensor condition to each instruction avoids nested if/else and keeps a program a flat row of chips, which suits a phone.
- Tight slot limits are the design, not a restriction: a puzzle with three slots in F1 and two in F2 is where the insight comes from. A slot budget is also the natural "brain cost" for a creature.
- For a creature in a continuous world, the analogous tiny language is: about 6 to 8 actions, about 6 to 8 sensor conditions, 2 to 3 short routines, and "restart" as the loop. Recursion/stack depth is probably too puzzle-like for an ecosystem game.
- Mindstorms' value was the physical feedback loop (build, run, watch). The equivalent here is watching the creature behave in a test tank immediately after each edit.

### Gaps
- Nguyen's findings, LEGO's stated reasons for moving to Scratch-based word blocks (EV3 Classroom, SPIKE, Robot Inventor), and any icon-blocks versus word-blocks research were not retrieved.
- Unverified recall: RoboZZle functions hold at most 10 slots each, with up to 5 functions per puzzle, and puzzles are community-authored and difficulty-voted.

---

## 5. "Program your units" games: interface patterns and retention/complexity problems

### Takeaway
The pattern that survives on small screens and with non-programmers is a priority-ordered list (or left-to-right tree) of "condition then action" rules evaluated top-down, stopping at the first match: FFXII gambits, Unicorn Overlord tactics, Gladiabots. General-purpose code (Screeps) retains only programmers and bleeds players on debugging, tooling and resets.

### Cited Findings
**Gladiabots (PC and mobile, most relevant)**
- Node types: conditions, actions, connectors (cosmetic, always valid) and sub-AIs (reusable trees). Nodes are checked left to right, then top to bottom; evaluation stops at the first node that resolves to an action. — [Gladiabots Wiki: BotProgramming Basics](https://wiki.gladiabots.com/index.php?title=BotProgramming_Basics)
- Described as "a visual logic editor with a series of if-then logic gates based on predefined conditions and actions". — [Save or Quit preview, Aug 2018](https://saveorquit.com/2018/08/22/preview-gladiabots/)
- Debugging aid: selecting a bot during a match shows its rules and how they are being evaluated. — [cordinc blog, 2016](https://www.cordinc.com/blog/2016/06/gladiabots.html)
- Players organise a library of AIs with folders and sub-AIs to keep debugging tractable. — [Steam guide: Welcome To Gladiabots](https://steamcommunity.com/sharedfiles/filedetails/?id=1759851189)
- Developer intent (Sébastien Dubois, GFX47): "I wanted to give access to this kind of strategic freedom to players that don't know 'real' programming." — [Medium interview](https://medium.com/@gofig.news/a-coffee-break-with-s%C3%A9bastien-dubois-gladiabots-45609a63e39f)
- Press: "the AI editor is incredibly simple to use and understand, while allowing you to give your units some pretty interesting tricks." — [GamingOnLinux, June 2018](https://gamingonlinux.com/2018/06/gladiabots-the-robot-arena-fighting-game-where-you-construct-their-ai-is-heading-to-steam)
- Reception: Steam "Very Positive" on roughly 830 to 870 reviews (one snapshot: 775 positive, 92 negative); left Early Access May 2019. — [Steam store](https://store.steampowered.com/app/871930), [aggregator snapshot](https://www.wasdland.com/game/gladiabots-ai-combat-arena-871930), [GamingOnLinux, May 2019](https://www.gamingonlinux.com/2019/05/create-your-ai-pick-your-robots-and-prepare-for-battle-as-gladiabots-has-left-early-access)
- Recurring complaint: steep learning curve, and debugging frustrates players unfamiliar with programming concepts. — [aggregator review summary](https://www.wasdland.com/game/gladiabots-ai-combat-arena-871930), [Google Play reviews](https://play.google.com/store/apps/details?id=com.GFX47.Gladiabots&hl=en_US)
- Mobile: a reviewer says "Gladiabots on mobile is great" with an "intuitive drag-and-drop interface"; the iOS listing is labelled designed for iPad; patch notes show mobile-specific fixes such as making node tooltips reachable on touch. — [LearnCodeByGaming review](https://learncodebygaming.com/blog/gladiabots-review-tips-for-new-programmers), [App Store listing](https://apps.apple.com/us/app/gladiabots/id1469623947), [itch.io changelog](https://itch.io/devlog/137457/1413-changelog-latest-dev-version.amp)
- Multiplayer is asynchronous: no queue; you are matched against an AI built by another player of similar rating and either side can watch the replay later; later campaign chapters reuse community-made AIs. — [LearnCodeByGaming review](https://learncodebygaming.com/blog/gladiabots-review-tips-for-new-programmers) (attribution uncertain between this and store reviews)

**Final Fantasy XII gambits (2006)**
- Hiroyuki Ito wanted a "single-player online game" in which party members act independently yet as the player intends; the team feared real-time plus commands would be too fast, and Takashi Katano said "We didn't want it to be overwhelming, so we went with the Gambit system." The idea descends from FFIV's monster AI scripts. — [Game Developer: Why FFIV was key to FFXII's Gambit system](https://www.gamedeveloper.com/design/why-i-final-fantasy-iv-i-was-key-to-i-ffxii-i-s-ai-driven-gambit-system), [PlayStation Blog, July 2017](https://blog.playstation.com/2017/07/07/extended-play-how-final-fantasy-xiis-gambit-created-one-of-the-most-distinct-rpgs-ever/)
- Cautionary sibling system: the License Board let players acquire everything, so characters stopped being differentiated as intended; the later Zodiac Job System restored constraints. — [FF Wiki: License Board](https://finalfantasy.fandom.com/wiki/License_Board)

**Unicorn Overlord (2024) and Dragon Age: Origins (2009)**
- Unicorn Overlord tactics are "if, then" rules; each active or passive skill takes up to two conditions; the list is checked from priority 1 downward, and a badly ordered rule means lower rules "will never be used". — [Prima Games guide](https://primagames.com/gaming/unicorn-overlord-tactics-and-conditions-explained)
- Reviewers compared it to gambits and called it "really in-depth without becoming too complex"; one review listed "a lot of time in menus" as a con. — [Zatu review](https://zatu.com/blogs/reviews/unicorn-overload-review), [board-game.co.uk review](https://board-game.co.uk/?p=3242727)
- Dragon Age: Origins gave each character Combat Tactics slots that automatically assign specific reactions to certain situations; the review framed this positively. — [GamesRadar review](https://www.gamesradar.com/dragon-age-origins-review/2/)

**Screeps (persistent MMO, JavaScript)**
- New players describe their AI as "a pile of spaghetti" and learning JavaScript, the API and the game at once as "daunting, but surmountable". — [Screeps forum: what was hard when you started](https://screeps.com/forum/topic/1994/what-did-you-find-annoying-hard-when-you-started-out-with-this-game/13)
- The CPU budget is the core constraint and a top frustration: performance-critical with little tooling; CPU blow-ups are hard to debug; every intent costs 0.2 CPU. — [Screeps forum thread](https://screeps.com/forum/topic/1994/what-did-you-find-annoying-hard-when-you-started-out-with-this-game/14), [negative-review discussion](https://screeps.com/forum/topic/2673/help-me-decide-to-buy-this-game-answering-me-these-negative-steam-reviews/10)
- On churn: developers' exit surveys reportedly show slow tick rate "is not even in TOP-10 of reasons players leave"; a veteran suspects churn peaks at wipes because "it is fun to build up to RCL 8 once, but it is tedious to do it the second time". — [Screeps forum: Future of Screeps](https://screeps.com/forum/post/8357)

**Bot Land, 7 Billion Humans**
- Bot Land offered three scripting levels selectable at any time, including a no-script default AI; it was discontinued in February 2020 and taken offline on 22 October 2020 (secondary listing). — [itch.io interview with Adam Damiano](https://itch.io/blog/102668/code-your-way-to-strategic-victories-in-bot-land-an-interview-with-adam-damiano), [DekuDeals listing](https://www.dekudeals.com/items/bot-land)
- Human Resource Machine is assembly-like for one worker; 7 Billion Humans uses a new language executed by many workers at once, across 60+ puzzles. — [Wikipedia: 7 Billion Humans](https://en.wikipedia.org/wiki/7_Billion_Humans)

### Inferences
- "First matching rule wins, top to bottom" is the most transferable behaviour model for a phone: one vertical list, drag to reorder, tap a row to pick a condition and an action from short menus. It is the same model across gambits, Unicorn Overlord and Gladiabots, so friends who play RPGs already know it.
- 7 Billion Humans is the right mental model for species programming: one program, many bodies, each in a different local situation.
- Slot scarcity does three jobs at once: balance, learnability and identity. FFXII's License Board shows what happens when the constraint is removable.
- The live "which rule is firing" readout (Gladiabots) is the single most important debugging feature; our spectator view should show the active rule on any tapped creature.
- Gladiabots' async model (your AI fights while you are away, watch later) maps directly to a 24/7 ecosystem; its learning-curve complaints suggest shipping starter behaviours players can tweak, not a blank canvas (Bot Land's "default AI" tier supports this).
- Screeps' wipe fatigue is a warning for multi-day rounds: each new round must ask a new question (new map, new rule, new parts), not the same climb again.

### Gaps
- No retrieved source evaluates the Gladiabots editor specifically on phone-sized screens (the iOS listing's iPad label hints the tree is cramped on phones, but that is inference). A summary cited a 0.025 s tick from a community post; unverified.
- Not researched (search budget exhausted): Carnage Heart, Autonauts, Bitburner, and criticism of Dragon Age tactics-slot gating. No Bot Land post-mortem found.
- The "FFXII plays itself" criticism was not sourced this session.

---

## 6. Evolution/ecosystem games: legibility, balance, designed versus evolved organisms

### Takeaway
Simulation-first evolution games repeatedly hit the same wall: players cannot see why things happen, and unconstrained evolution looks random. The games that read well gate change through a small visible budget (Thrive's 100 mutation points, Evolution's three trait slots, Cell Lab's finite mode table) and make every adaptation a trade-off.

### Cited Findings
**Thrive (open source; current as of Nov 2026)**
- Release cadence in 2026: 1.0.1 in March; 1.6 expected end of August (adds auto-evo for multicellular species, which can mutate and split); 1.7 in October ("works towards completing the multicellular stage", fresh auto-evo run on becoming multicellular); 1.9 in feature freeze as of the 7 Nov 2026 progress update. — [Progress Update 3/21/2026](https://www.revolutionarygamesstudio.com/progress-update-3-21-2026), [Progress Update 8/22/2026](https://www.revolutionarygamesstudio.com/progress-update-8-22-2026), [GamingOnLinux, Oct 2026](https://gamingonlinux.com/2026/10/open-source-evolution-sim-thrive-v1-7-works-towards-completing-the-multicellular-stage), [Thrive devblog index](https://revolutionarygamesstudio.com/devblog/)
- Editor budget: "We use an arbitrary currency called Mutation Points to prevent wild changes to a species within a single generation"; exactly 100 MP per editor session, no carry-over (cap varies with difficulty). The team says it "traded some realism" to let players choose their mutations. — [Devblog #5: Thrive vs Species](https://www.revolutionarygamesstudio.com/devblog-5-thrive-vs-species), [Thrive Developer Wiki: Editors and Mutations](https://wiki.revolutionarygamesstudio.com/wiki/Editors_And_Mutations)
- Non-player species evolve through a separate system called "auto-evo"; a recent update made the player's multicellular population also "depend on auto-evo's evaluation of its performance". — [Steam community: Thrive](https://steamcommunity.com/app/1779200?l=english)
- Early auto-evo design overrode results for the player species because the player "has no way to know what their editor changes would do" (community-wiki draft, low authority). — [Thrive Wiki talk page](https://thrive.fandom.com/wiki/Talk:Automatic_evolution)
- Thrive's view of the alternative: Species can run true Darwinian selection "because it takes place in a relatively small arena". — [Devblog #5](https://www.revolutionarygamesstudio.com/devblog-5-thrive-vs-species)

**Species: Artificial Life, Real Evolution**
- Self-described as "a scientifically-founded artificial life game wrapped around a complex, first-principles simulation of evolution by natural selection"; its legibility tools are a satellite map and a real-time clade diagram. — [Steam store](https://store.steampowered.com/app/774541), [game summary](https://nextquest.dev/games/species-artificial-life-real-evolution)

**Ecosystem (Tom Johnson / Slug Disco)**
- Bodies, swimming gaits and brains all evolve; swimming is physically simulated by torque at joints; brains are encoded in DNA. Players can also design creatures and share species via Steam Workshop. Single-player. — [Slug Disco game info](https://slugdisco.com/ecosystem-game-info/), [Steam store](https://store.steampowered.com/app/1133120/Ecosystem?l=dutch)
- Early Access from 16 March 2021; store page lists full release 8 November 2024; "Mostly Positive" on about 600 reviews. — [ModDB news](https://www.moddb.com/games/ecosystem/news/ecosystem-swims-into-early-access-on-march-16-2021), [Steam store](https://store.steampowered.com/app/1133120/Ecosystem?l=dutch)
- Review-summary complaints: evolution "appears random and doesn't lead to meaningful adaptations", and there are "too many factors driving evolution, making it hard for players to track". — [Vaporlens review digest](https://vaporlens.app/app/1133120/ecosystem.md)

**Cell Lab (mobile, Petter Säterskog)**
- A genome is a table of "modes"; exactly one mode is active per cell; each mode holds the cell type, split mass and other settings (some cell types add extra settings), including which modes its daughter cells take. — [Cell Lab Wiki: Genome](https://cell-lab.fandom.com/wiki/Genome)
- Scale: store listings say 20 modes per genome, 22+ parameters per mode, 16 cell types, 45 challenges, 4 tutorials, and a 27-parameter environment editor. An older listing says 15 modes; the fan wiki says 40. — [TapTap listing](https://www.taptap.io/app/16414), [cell-lab.net](https://www.cell-lab.net/), [Cell Lab Wiki: Genome](https://cell-lab.fandom.com/wiki/Genome)
- Structure: challenges give an environment and ask for an organism that survives; solving them unlocks new genes/cell types; an experimental mode allows free environment and organism design; random genomes can also evolve by small mutations. — [TapTap listing](https://www.taptap.io/app/16414)
- The listing itself warns it is "very challenging" and that reading the instructions is necessary. — [TapTap listing](https://www.taptap.io/app/16414)

**Evolution (North Star Games; board, then digital)**
- Designed by Dominic Crapuchettes with Dmitry Knorre and Sergei Machin; a species holds at most three traits, swappable each turn, which reviewers call the game's defining constraint. — [Wikipedia mirror: Evolution (board game)](https://cavac.at/cavacopedia/Evolution_%28board_game%29), [Sprites and Dice review](https://spritesanddice.com/reviews/evolution-review/) (attribution uncertain)
- Designer's principle: every adaptation that suits one situation is poorly suited to another. — [Games Precipice interview](https://www.gamesprecipice.com/dominic-crapuchettes/)
- Academic read: co-evolutionary competition between players' species drives play, so evolution is not just theme. — [Tampere University game lab](https://www.tuni.fi/playlab/the-game-of-survival-of-the-fittest/)

**Shared-ecology cautionary tale: Ultima Online (1997)**
- Popular account (Garriott): players slaughtered wildlife faster than it could respawn and the system was removed. Raph Koster's correction: it was a closed resource loop that collapsed because players hoarded outputs (sheep to wool to shirts), and it was removed in beta after a rewrite; the lesson he and Garriott both draw is that in-house testing does not predict real player behaviour at scale. — [Raph Koster: Did players destroy the UO ecology?](https://www.raphkoster.com/?p=46439), [Cracked retelling](https://cracked.com/article_34410_the-time-ultima-online-created-the-garden-of-eden-and-players-immediately-destroyed-it.html)

### Inferences
- Legibility needs first-class tools, not polish: clade/family tree, population-over-time graph, cause-of-death breakdown, and a "what is this creature doing and why" inspector. Ecosystem's reviews show what happens without them.
- A 5 to 20 player world is a "small arena" in Thrive's sense, so true individual-level simulation is feasible; we do not need an analytic auto-evo.
- Decide explicitly whether released species mutate. Player-designed plus frozen is legible and fair but static; designed plus slow drift gives stories ("my grazers got faster") but breaks attribution. Thrive's 100-MP cap suggests a middle path: no in-sim mutation, but a small per-day "patch" budget for the owner.
- Cell Lab proves a finite-state "mode table" genome is authorable on a phone: one screen per mode, a dozen sliders/pickers, transitions between modes. It is the closest existing mobile UI to "body plan plus behaviour states", and its challenge ladder (unlock parts by solving survival puzzles) is a ready-made onboarding structure.
- Evolution's three-trait cap and "every adaptation has a counter" rule are the cheapest balance tools available: few slots, strong rock-paper-scissors.
- Closed resource loops are fragile under real players (UO). An ecosystem that must run a week unattended needs a guaranteed external energy input (sunlight/plants that always regrow) so one dominant species cannot permanently zero the world.

### Gaps
- Not researched (search budget exhausted): Niche, Equilinox, Adapt, Sipho, Biogenesis, Crittermound. No findings; do not infer from silence.
- The Cell Lab mode-count conflict (15/20/40) is unresolved; likely version drift. Per-mode parameter names and phone UI layout were not retrieved. A Baidu wiki dates launch to 2018, which I could not confirm.
- No direct developer statement from Species ALRE on legibility was retrieved. A Devblog #5 snippet about mutations being "a random number between -1 and 1, multiplied by a modifier (background mutation rate and radiation exposure)" probably describes Species, not Thrive; attribution unclear.
- No player-review text for Cell Lab's editor usability was found.

---

## 7. Has anyone already combined player-designed species + programmable behaviour + shared persistent multiplayer ecosystem?

### Takeaway
I found no shipped game that combines all three for a casual audience. The closest precedent is Microsoft's .NET Terrarium (2002): coded creatures released into a peer-to-peer ecosystem to out-survive each other, aimed at developers. Everything else has two of the three legs.

### Cited Findings
- **.NET Terrarium (Microsoft, 2002; open-sourced later as Terrarium 2.0).** Developers wrote herbivores, carnivores or plants as .NET code and introduced them into a networked peer-to-peer ecosystem; the goal was to build the creature that out-survives the rest, with vital statistics compared on a companion website. — [Microsoft press release, 25 Feb 2002](https://news.microsoft.com/source/2002/02/25/microsoft-terrarium-game-demonstrates-continuing-developer-enthusiasm-for-net-platform/), [OSNews](https://www.osnews.com/story/710/peer-2-peer-survival-of-the-fittest-computing-game-attracts-developers/)
- Terrarium details: more than 9,000 developers downloaded it in its first week; each creature got 2 to 5 ms per turn and was destroyed if it overran; a roaming "teleporter" moved creatures to random peers. It began as an internal .NET test app. — [Microsoft press release](https://news.microsoft.com/source/2002/02/25/microsoft-terrarium-game-demonstrates-continuing-developer-enthusiasm-for-net-platform/), [Terrarium 2.0 announcement](https://weblogs.asp.net/bsimser/reintroducing-terrarium-now-with-2-0-goodness/), [GitHub: terrariumapp](https://github.com/terrariumapp/terrarium)
- **Screeps**: persistent shared world plus programmable units, but colonies not species, real JavaScript, and a programmer-only audience (see section 5). — [Screeps forum](https://screeps.com/forum/post/8357)
- **Gladiabots**: programmable behaviour plus asynchronous multiplayer, but short arena matches, no ecosystem and fixed bot classes. — [Gladiabots Wiki](https://wiki.gladiabots.com/index.php?title=BotProgramming_Basics)
- **The Bibites / Ecosystem**: designed bodies and brains in an ecosystem, shared only as files via Steam Workshop into single-player sims. — [Bibites 0.6.2 devlog](https://thebibites.itch.io/the-bibites/devlog/973592/the-bibites-062-steam-workshop-and-toward-the-future), [Slug Disco: Ecosystem](https://slugdisco.com/ecosystem-game-info/)
- **Eco (Strange Loop)**: a shared multiplayer simulated ecosystem where every action affects the environment and players vote laws, but players do not design species. — [Game Developer: Virtual worlds designed by their inhabitants](https://gamedeveloper.com/design/virtual-worlds-designed-by-their-inhabitants) (attribution uncertain)
- **Research precedents**: a 2006 NTNU master's thesis proposed an evolving food chain inside an MMOG and flagged real-time compute cost for thousands of players; Szerlip and Stanley (2014) note ALife researchers "operate in relative isolation" and cite Ludobots as a crowd-facing simulator. — [NTNU thesis](https://folk.idi.ntnu.no/elster/master-studs/thibault/thibault-collet-master.pdf), [arXiv 1407.3000](https://arxiv.org/pdf/1407.3000.pdf)
- A search for 2025 to 2026 browser/mobile releases matching the full concept returned only unrelated .io games and a space strategy title. — [search result example: Old Light browser strategy list](https://oldlight.io/blog/best-browser-strategy-games-2026/)

### Inferences
- The space looks open for a casual, mobile, friend-group version. Absence of evidence is weak here (one search for recent titles), so treat "nothing exists" as provisional.
- Terrarium validates the core fantasy (release it, walk away, check standings) and shows two structural needs: a per-creature compute cap and a public stats page as the social object. Its audience was limited by requiring real code.
- Each two-legged neighbour failed or plateaued on a different leg: Screeps on authoring difficulty, Bibites/Ecosystem on being solitary, Gladiabots on learning curve. A rule-list behaviour editor, a hard part budget and a small private world address each in turn.
- At 5 to 20 players the NTNU compute concern mostly disappears; one authoritative server tick loop is enough.

### Gaps
- Terrarium's attribute-point system and why it faded were not retrieved (unverified recall: creatures allocated a fixed pool of points across attributes such as speed, eyesight, attack, defence, camouflage).
- DarwinBots, Grobots, Framsticks, Core War-style and bot-arena services (Screeps Arena, yare.io) were not researched; the one search attempted returned nothing useful.
- Spore's asynchronous sharing of player creatures into other players' worlds is an obvious partial precedent that I did not source this session.
- No data on how long Terrarium ecosystems stayed interesting or what dominant strategies emerged.
