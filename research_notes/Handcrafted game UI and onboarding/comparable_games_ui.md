# Comparable games: interface design of creature, ecosystem, pet and cozy sims (as of November 2026)

*How to read these notes.* Research was done on 15 November 2026 with 26 web searches. **Every page fetch failed** (the session's network does not allow gamedeveloper.com, gamespot.com, spore.fandom.com, medium.com, nekoatsume.fandom.com or thebibites.itch.io, and fetching was stopped after six hosts failed), so **all cited findings rest on search-result snippets and summaries only; no page was opened**. Three tags are used:

- **[S]** = taken from a search snippet/summary this session; the link is the page the snippet came from.
- **[S?]** = snippet, but the search summary did not tie the quote to one URL; the link is the most probable result. Treat the wording as real and the attribution as unconfirmed.
- **[R]** = recalled from the researcher's prior knowledge (training data to mid-2026), **not verified this session**. These appear only under Inferences, with the page where they can be checked.

Game UI Database and Interface In Game were not consulted: they are screenshot libraries, snippets carry nothing useful, and fetches were blocked.

## 1. Creature and character editors: how body editing and stats are presented, and what makes Spore's editor approachable

### Takeaway
Spore's editor is approachable because of deliberate rules its designers stated in public (one click per action, features revealed gradually, "soft mastery", a creature that always works and always animates), and its best-documented weakness is that the numbers come from the labels on parts rather than from the shape, so the design "didn't actually make any difference". Later games in the genre (Thrive, The Bibites, Niche) add what Spore lacked: a prediction of what the edit will do to the population, shown inside the editor.

### Cited Findings

**Spore creature creator (PC, 2008): stated design principles**
- Chaim Gingold's GDC 2007 talk "Spore's Magic Crayons" covered the design problems of the creature, building, vehicle and planet editors; the stated goal was an editor easy and fun for anyone that still produces creatures that work in the game. (2007) [S] — [GameSpot, "GDC 07: Creating Spore"](https://www.gamespot.com/articles/gdc-07-creating-spore/1100-6167215/)
- A "magic crayon" is described as a toy that is simple to use yet gives the user enough power to make something they will appreciate. (2007) [S] — [Engadget, "Spore's power struggle: freedom vs. beauty"](https://www.engadget.com/2007/03/12/spores-power-struggle-freedom-vs-beauty/)
- The team wanted the interface to grow with the player and reveal features gradually, and held to a one-click principle. (2007) [S] — [Game Developer, "Gingold talks Spore's magic crayon approach"](https://www.gamedeveloper.com/game-platforms/gingold-talks-i-spore-i-s-magic-crayon-approach)
- Gingold called the creature creator the hardest of the editors, said the team "went more the route of soft mastery", and said leg manipulation was the last part finished and the hardest. (2007) [S?] — [Game Developer](https://www.gamedeveloper.com/game-platforms/gingold-talks-i-spore-i-s-magic-crayon-approach); also covered by [GameSpot](https://www.gamespot.com/articles/gdc-07-creating-spore/1100-6167215/)
- The building editor's early prototype had "no apparent structure"; the fix was to name the kinds of part (roof, body, window, door, chimney). (2007) [S?] — [GameSpot](https://www.gamespot.com/articles/gdc-07-creating-spore/1100-6167215/)
- Gingold argued that customising a creature creates emotional investment in it. [S] — [Hacker News comment by Don Hopkins summarising the talk](https://hn.svelte.dev/item/36280831)
- Gingold gave a later keynote, "Magic Crayons: Spore and Beyond", at the Dutch Festival of Games. (2008) [S] — [BeyondSims](https://beyondsims.com/2008/06/spores-crayon-approach-discussion-with-chaim-gingold/)
- Procedural animation makes a many-limbed creature walk convincingly whatever its shape. [S] — [Soren Johnson, "Spore: My View of the Elephant"](https://www.designer-notes.com/?p=654)

**Spore: budget and limits**
- DNA points are the budget for parts ("acts like a bank account"); parts cost roughly 5 to 250 DNA points depending on level; the balance sits in a corner of the editor (one source says bottom left). [S?] — [Spore Wiki, DNA](https://spore.fandom.com/wiki/DNA)
- A second limit sits beside the budget: "a complexity meter which when full stops letting you add parts". [S?] — [Giant Bomb user review of Spore Creature Creator](https://www.giantbomb.com/spore-creature-creator/3030-20746/user-reviews/2200-5254/)
- Each editor has a built-in complexity limit "to prevent the overpowering of vehicles or creatures", which players routinely override with a console command. [S?] — [Spore Wiki, Creature Creator](https://spore.fandom.com/wiki/Creature_Creator)

**Spore: documented weaknesses**
- A creature's attributes are simply the sum of its named body parts. [S] — [Soren Johnson, designer-notes.com](https://www.designer-notes.com/?p=654)
- Player verdict: "But when you were done, it didn't actually make any difference"; and "The best thing about it by far, as others have said, was the creature creator". [S?] — [Straight Dope thread, "Spore (2008)"](https://boards.straightdope.com/t/spore-2008/915281)
- Retrospectives say the creator is a small share of the game and the stages around it are shallower. [S] — [TechRaptor, "10 years of Spore"](https://techraptor.net/content/10-years-of-spore-a-reputation-well-deserved)

**Spore on small screens**
- Spore Creatures (Nintendo DS, 2008): "players simply drag the different body parts to the desired location and can resize and rotate them", all on the touch screen. [S] — [Vooks review](https://vooks.net/spore-creatures-nds)
- Spore Origins (iPhone, 2008): the creature editor uses touch controls, and a creature can be skinned with a picture from the phone's photo album; a pre-release hands-on warned that touch would have to be "really spot-on" for detailed shaping. [S?] — [Pocket Gamer hands-on](https://www.pocketgamer.com/spore-origins/hands-on-with-spore-on-mobile/); [iMore review, 4.5 stars, "lacks some depth"](https://imore.com/review-spore-origins-for-iphone)

**Thrive (PC, open source, in development through 2026)**
- The editor is three areas in order: Report, Patch Map, Cell Editor; the Cell Editor is split into Structure, Appearance and Behavior tabs. (Old wiki page; may not match the current build.) [S] — [Thrive wiki, Microbe Editor talk page](https://thrive.fandom.com/wiki/Talk:Microbe_Editor/@comment-26147399-20190128003421?oldid=6468)
- v0.5.6 added a panel in the editor showing the predicted population of the player's species under the current edits. [S] — [Thrive v0.5.6 release notes](https://github.com/Revolutionary-Games/Thrive/releases/tag/v0.5.6)
- The patch map shows each patch's depth and light level; the report shows the in-game year and was restyled to match the rest of the UI. [S] — [Revolutionary Games devblog #26](https://www.revolutionarygamesstudio.com/devblog-26-learning-the-basics)
- 2026: players reported very long loading before entering the editor and the population simulation freezing; the developers cut its memory use in half. [S] — [Thrive progress update, 30 May 2026](https://www.revolutionarygamesstudio.com/progress-update-5-30-2026)

**The Bibites (PC)**
- 0.5.0 introduced icons on brain nodes and listed an in-game Bibite editor/creator; the developer said an in-game brain editor was being built for 0.6. [S] — [The Bibites 0.5.0 devlog](https://thebibites.itch.io/the-bibites/devlog/464605/the-bibites-050-modernity-and-progress)
- 0.6.0.1 fixed the "brain panel getting out of screen for certain ui scales" and "hidden nodes sometimes being yeeted out of the brain panel". [S] — [The Bibites 0.6.0.1 hotfix](https://thebibites.itch.io/the-bibites/devlog/811452/the-bibites-0601-hotfix)
- 0.6.2 (25 June 2025) fixed crashes in "the bibite brain editor" and added Steam Workshop; the next major version was said to be about a year away. [S] — [The Bibites 0.6.2 devlog](https://thebibites.itch.io/the-bibites/devlog/973592/the-bibites-062-steam-workshop-and-toward-the-future)

**Niche: a genetics survival game (PC)**
- Steam review summaries call the UI "clunky"; a reviewer said it "feels more like I'm playing a board game than controlling the genetics of an entire species". [S?] — [Vaporlens summary of Steam reviews (machine-generated; weigh lightly)](https://vaporlens.app/app/440650/niche_a_genetics_survival_game); [KeenGamer review](https://www.keengamer.com/articles/reviews/niche-a-genetics-survival-game-review/)
- Breeding is "probably the most important thing you do in this game, but can also be the biggest pain"; picking mutations gives "some control, but you still roll the dice". [S] — [KeenGamer review](https://www.keengamer.com/articles/reviews/niche-a-genetics-survival-game-review/)

**Wobbledogs (PC; console edition reviewed 2023)**
- Console reviews say "the interface and controls get in the way of engaging with your virtual pups", list "Cannot rebind controls", "Really slow starter", "The controls are not always ideal", and note a grid for placing items in edit mode. [S?] — [OpenCritic review index for Wobbledogs](https://opencritic.com/game/12952/view); [Gert Lush Gaming PS4 review](https://gertlushgaming.co.uk/wobbledogs-review-playstation-4/)

### Inferences
- **Borrow from Spore: one gesture per action and nothing that can fail.** The stated rules (one click, gradual reveal, named kinds of part, a creature that always works) translate directly to touch: one drag places a part, the palette starts small and grows, and every arrangement is legal. The DS version shows the same editor reduced to drag, resize and rotate survived on a small touch screen.
- **Do not copy Spore's stats.** The lasting criticism is that numbers came from part labels. An editor whose stats come from where and how big a part is (and says so while the finger is still down) answers the complaint that the design "didn't make any difference".
- **Two limits read as one too many.** Spore had a currency (DNA) and a separate cap (complexity), and players defeated the cap with a console command. A single visible budget is easier to explain on a phone.
- **Put the consequence inside the editor.** Thrive's predicted-population panel is the clearest borrowable pattern in this set: the editor answers "what will this change do out there?" before the player commits. Thrive's order (Report, then Map, then Editor) also suits a weekly session: what happened, where, then what to change.
- **A behaviour graph needs a fixed layout on a phone.** The Bibites had to patch nodes escaping the panel and the panel leaving the screen at some UI scales. A free-form node graph is a PC pattern; on a portrait phone a fixed list or a small number of slots is safer.
- [R] Spore's layout: parts palette down the left with tabs by kind (mouths, senses, limbs, hands, feet, weapons, details); creature on a turntable in the middle; three mode buttons (Build, Paint, Test Drive); budget bottom left; ability ratings (levels 1 to 5 for bite, charge, spit, strike, sing, dance, charm, pose, plus speed, sneak, jump, glide, health) that update as parts are added, with only the highest-level part counting for each ability. Verify at [Spore Wiki, Creature Creator](https://spore.fandom.com/wiki/Creature_Creator).
- [R] Spore's direct manipulation: drag vertebrae to bend the spine, scroll to fatten or thin, parts snap to the body surface and mirror automatically, a selected part shows rotate, scale and part-specific morph handles; the creature blinks, watches the cursor and reacts to each new part while being edited; asymmetry arrived only in a later patch behind a modifier key. Verify at [Spore Wiki, Creature Creator](https://spore.fandom.com/wiki/Creature_Creator).
- [R] Niche shows each animal's genes as two alleles per slot, lets the player pick genes to favour before breeding, and has a family tree. Verify at [Steam store page](https://store.steampowered.com/app/440650/_/).

### Gaps
- No usable material surfaced for the editors or stat screens of Equilinox, Ecosystem (the evolution game), Species: Artificial Life Real Evolution, Monster Rancher, Ooblets, Pokemon-style apps or Pikmin Bloom's Pikmin detail screen. One search on Equilinox and Ecosystem returned nothing relevant.
- The original GDC "Magic Crayons" slides or recording were not reached; all Gingold material is second-hand press coverage from 2007.
- The exact layout of Spore's editor (handles, tabs, stat panel) is from recall, not from a source read this session.
- How Spore Origins' touch editor was judged after release (beyond one pre-release worry and a star score) was not found.
- Whether Thrive's editor still opens on the Report tab in 2026 builds is unconfirmed; the description is from an old wiki page.

## 2. Inspecting a living thing: how games show what a creature is doing, feeling or thinking

### Takeaway
The games split into two families: instrument panels (Creatures' kits, The Bibites' brain panel), which are powerful and repeatedly described as hard to read, and field-guide patterns (Viva Pinata's requirement lists, Bugsnax's scan, Slime Rancher's Slimepedia), which show a few plain facts on the creature itself and file the rest in a journal. Only the second family is built for a small screen.

### Cited Findings

**Instrument panels (PC)**
- Creatures: Norns have simulated biological drives; the Observation Kit gives a health summary per Norn, with the warning "Norns can be perfectly healthy, yet still close to death!". [S] — [Creatures Wiki, Observation Kit](https://creatures.fandom.com/wiki/Observation_Kit)
- Creatures: the Science Kit's Biochemistry tab lets the player look inside a creature's bloodstream. [S] — [Alan Zucconi, "The AI of Creatures" (2020)](https://www.alanzucconi.com/2020/07/27/the-ai-of-creatures/)
- Creatures: a Brain Viewer is one of several tools for studying Norn brains; the perception lobe holds what the Norn is attending to, what it senses and its drives. (2016) [S] — [Mad Norn Scientist blog](https://madnornscientist.blogspot.com/2016/03/mucking-about-with-norn-brains.html)
- Creatures: a fan tool, PowerKit, exists to replace the science kit, health kit and observation kit when they are used only for monitoring. [S] — [Creatures Wiki, PowerKit](https://creatures.fandom.com/wiki/PowerKit)
- A player thread titled "seemingly unreadable brains" drew a how-to-read answer: brains are read top to bottom, hovering a neuron shows its readout, neurons are yellow when active positive, purple when active negative and white when neutral, and every creature has the same inputs and outputs. The search summary says this thread concerns a similar neural-network creature simulator, Critters, not The Bibites. [S?] — [itch.io thread](https://itch.io/t/2535360/seemingly-unreadable-brains)

**Field-guide patterns (console and PC)**
- Viva Pinata: the Journal's Encyclopedia lists which wild pinatas are visiting and the specific requirements for each to become a resident; requirements can also be read by pointing at the animal and pressing one button. [S] — [TrueAchievements walkthrough](https://www.trueachievements.com/game/Viva-Pinata-Trouble-In-Paradise/walkthrough/3); [Pinata Journal wiki](https://pinatajournal.wiki/wiki/Pinata)
- Bugsnax: scanning a creature with the SnaxScope shows its set movement path and "some quick facts about it that'll help you catch it"; the facts are then kept in the journal. [S] — [PC Gamer Bugsnax guide](https://pcgamer.com/bugsnax-guide); [Push Square guide](https://www.pushsquare.com/guides/bugsnax-guide-tips-tricks-and-how-to-catch-every-bugsnak)
- Slime Rancher: the Slimepedia is opened from the pause menu; each slime's entry has "a portion of lore about the slime, its Plortonomics, Rancher Risks, its general diet and favored food". [S?] — [Slime Rancher wiki, Slimepedia](https://slimerancher.fandom.com/wiki/Talk:Slimepedia/@comment-46331752-20200712152900)

**Pet apps (phone)**
- My Tamagotchi Forever (2018): the pet's needs are toilet, washing, eating, sleeping and play. [S] — [Digital Trends](https://www.digitaltrends.com/?p=1347390)
- Finch: quests are completed one at a time from the top of the list, which a 2026 critique credits with reducing overload; finishing tasks "energizes" the pet, which then goes exploring. [S] — [Pratt IxD critique, Feb 2026](https://ixd.prattsi.org/2026/02/design-critique-finch-self-care-pet-ios-app/); [Screens Design showcase](https://screensdesign.com/showcase/finch-self-care-pet)
- Pikmin Bloom: a 2026 critique says managing the creatures leans too heavily on the player's memory and asks for a clearer picture of the collection's state at a glance. [S] — [Pratt IxD critique by Yung-Wei Chen, 9 Feb 2026](https://ixd.prattsi.org/2026/02/design-critique-pikmin-bloom-iphone-app/)

### Inferences
- **Requirements as a checklist on the animal** (Viva Pinata) is the most borrowable inspection pattern: point at a creature, see three or four plain conditions with ticks. It fits a bottom sheet on a phone.
- **Scan, then file** (Bugsnax): the first inspection draws the creature's route on the world itself and adds a page to a journal. Drawing a path on the map is legible at phone size where a panel of numbers is not.
- **Consolidate the instruments.** Creatures players built PowerKit to merge three monitoring kits into one, which suggests one creature sheet beats several specialised panels.
- **A health summary must not contradict the outcome.** The Creatures wiki has to warn that a "perfectly healthy" Norn can be near death. If a summary says fine, the creature should be fine.
- **Brain viewers are a PC pattern that does not survive portrait.** Hover readouts have no touch equivalent, and the one sim guide found needs a three-colour code plus a reading order to be usable. A phone version would have to show the one rule currently firing, in words or icons.
- [R] The original Tamagotchi shows Hungry and Happy as four hearts each plus a discipline bar, behind a status icon, with an attention icon that lights when care is needed. Verify at [Wikipedia, Tamagotchi](https://en.wikipedia.org/wiki/Tamagotchi).
- [R] The Bibites' brain panel is a node graph with inputs on one side and outputs on the other, connection colour for sign and thickness for strength, and node shading for live activation (moderate confidence). Verify at [The Bibites wiki](https://the-bibites.fandom.com/wiki/Bibites).
- [R] Neko Atsume shows no need bars at all; each cat's Catbook page records visit count, favourite items and a one-word personality. Verify at [Neko Atsume Wiki](https://nekoatsume.fandom.com/wiki/Game_Menu).

### Gaps
- No source found describing The Bibites' brain panel layout in its own terms (three searches); the colour-and-reading-order description comes from a different simulator.
- Nothing found on thought bubbles or mood icons specifically, or on any study of which inspection style players read correctly on phones. The legibility judgements above are inference.
- Wobbledogs' dog panel and gut-flora view, Niche's gene panel and Equilinox's species panel were not described in any snippet.
- Pokemon Sleep's and Pikmin Bloom's per-creature detail screens were not covered.

## 3. Ecosystem and map views: large worlds, population summaries and "while you were away" recaps on a phone

### Takeaway
The strongest phone pattern found is Pikmin Bloom's scheduled lookback: a short animation of the day drawn on the map, played once, replayable from a log, with a weekly version on Sundays. On PC, Thrive's Report tab is the closest equivalent for an ecosystem. Idle games show that a recap must be skippable and must never look like a loading gate.

### Cited Findings

**Recaps**
- Pikmin Bloom's Daily Lookback "summarizes the day's progress in an animation, showing where you walked, where you planted flowers, and your step count"; it plays automatically at 9:00 p.m. by default. [S] — [Niantic help centre, Daily Lookback](https://niantic.helpshift.com/hc/en/23-pikmin-bloom/faq/2859-daily-lookback)
- The lookback time can be moved to 10 PM, 11 PM or midnight. [S] — [SuperParent guide](https://www.superparent.com/?p=7618)
- The lookback is triggered by opening the app after about 8:50 pm, lets the player write a short journal entry and rate the day with Happy, Ok or Sad stickers, and past lookbacks can be replayed from the lifelog. [S] — [Pikipedia, Lifelog](https://www.pikminwiki.com/Lifelog)
- A Weekly Lookback plays after the daily one every Sunday: total steps, total flowers planted, artwork of the most-planted flower, artwork of the Pikmin gained. [S] — [GoNintendo](https://gonintendo.com/contents/14208-pikmin-bloom-gets-weekly-lookback-feature)
- Thrive's report gained a timeline tab that records when species went extinct, and shows the current in-game year. [S?] — [Revolutionary Games progress update, 7 May 2022](https://www.revolutionarygamesstudio.com/progress-update-05-07-2022)
- Idle games: "The 'welcome back' screen showing accumulated earnings is one of the most satisfying moments in an idle game." [S?] — [Game Bootcamp module on idle games](https://seanking11.github.io/gamebootcamp/modules/34-idle-incremental)
- Idle games, failure 1: players questioned a loading bar on the welcome-back popup, one saying that cancelling it means "you are not welcome, and you are intruding". [S] — [Warzone Idle forum thread](https://www.warzone.com/Forum/581561-purpose-loading-bar-welcome-back-popup)
- Idle games, failure 2: a player reported offline gains sometimes arriving "without the 'you've been away for ...' message". [S?] — [r/incremental_games thread (mirror)](https://red.127.pp.ua/r/incremental_games/comments/1kox7d2/scratch_inc_now_available_on_android_and_ios)

**Maps and summaries**
- Thrive's patch map shows depth and light for each region, and sits between the report and the editor. [S] — [Revolutionary Games devblog #26](https://www.revolutionarygamesstudio.com/devblog-26-learning-the-basics)
- Pikmin Bloom's main screen has three small buttons at the top (decor collection, friends, news) and three in the lower right (flower planting, planter pack, and a whistle that opens the garden screen); the wiki notes the game "makes little distinction between menu screen and gameplay". Screenshot dated to v79.0 with an "Outdated Interface" section. [S] — [Pikipedia, Pikmin Bloom interface](https://www.pikminwiki.com/Pikmin_Bloom_interface)
- Pikmin Bloom's creature list puts the active squad at the top and those on standby below. [S] — [Pikipedia, Pikmin Bloom interface](https://www.pikminwiki.com/Pikmin_Bloom_interface)
- Terra Nil on phones (Netflix, March 2023): the touch conversion was judged a success overall, but "some menu options need small touch targets" and the UI scale setting could not fully fix two buttons. [S] — [TouchArcade review](https://toucharcade.com/2023/03/29/terra-nil-mobile-review-netflix-graphics-performance-ipad-pro-iphone/)

### Inferences
- **Borrow the lookback whole.** One animation on the map, a handful of totals, played once on the first open after a set hour, kept in a log, with a larger weekly edition. The weekly edition matches a weekly design session; the daily one fits a 15-minute check-in.
- **Draw the recap on the map, not in a table.** Pikmin Bloom shows where things happened; Thrive lists numbers and a timeline. For a phone the map trace is the headline and the numbers are the footnote.
- **The recap is not a gate.** The idle-game complaints are about a bar the player must wait for. Make it skippable in one tap and reachable again later.
- **Order of a weekly session:** Thrive's Report, Map, Editor sequence gives the player what happened, where, and what to change, in that order.
- **Phone map buttons live in the lower right** (Pikmin Bloom), where a right thumb reaches; top-edge buttons are for rarely used destinations.
- [R] Neko Atsume's recap is also its reward: cats that visited while the app was closed leave fish, collected from one list with an accept-all button. Verify at [Neko Atsume Wiki](https://nekoatsume.fandom.com/wiki/Game_Menu).
- [R] Pokemon GO's map screen puts the main menu bottom centre, nearby creatures bottom right and the player's profile bottom left, and shows a weekly walking summary on open. Verify at [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_GO).
- [R] Mini Motorways pauses each in-game week to offer a choice of one of two upgrades, a compact model for a weekly decision. Verify at [Wikipedia, Mini Motorways](https://en.wikipedia.org/wiki/Mini_Motorways).

### Gaps
- Nothing found on food-web displays in any of the named games, or on how Equilinox, Ecosystem or Niche summarise populations.
- Nothing found on Dorfromantik or Mini Motorways on phones (one combined search returned only Terra Nil).
- Pokemon GO's and Neko Atsume's recap screens are from recall only.
- No source on how any of these games show a large multi-biome world in portrait specifically; Terra Nil and Mini Motorways are landscape games.
- Whether Pikmin Bloom's renewed home screen (in testing per its wiki) has shipped to all players by November 2026 is unknown.

## 4. Daily check-in games: the home screen, what a returning player sees first, and taps to the core action

### Takeaway
The check-in games that are praised open directly on the living scene (Neko Atsume's yard, Pikmin Bloom's map, Finch's bird) with the core action one or two taps away and everything else behind a single menu button. The ones that are criticised (Pokemon Sleep's morning, Pocket Camp) put a chain of screens between opening the app and doing the thing.

### Cited Findings

**Neko Atsume and Neko Atsume 2**
- Neko Atsume 2 is a separate current app with its own store listing. [S] — [App Store, Neko Atsume 2](https://apps.apple.com/us/app/neko-atsume-2/id6499131935)
- The menu opens from one paw icon at the top left; entries are Cats, Shop, Goodies, Camera, Yard, Gifts, Settings, News and Other. (Guide about 11 years old.) [S] — [GameSkinny, "How to play Neko Atsume with no Japanese knowledge"](https://www.gameskinny.com/tips/how-to-play-neko-atsume-with-no-japanese-knowledge/); [Neko Atsume Wiki, Game Menu](https://nekoatsume.fandom.com/wiki/Game_Menu)
- The centre icon returns to the yard, and actions take two taps, which makes mistakes easy to back out of. [S] — [Medium, "A UI so good, it breaks language barriers"](https://medium.com/@strawburrymiwk/a-ui-so-good-it-breaks-language-barriers-83b6e11ae4d2)
- The yard uses a calm palette of greens and warm browns so the toys stand out. [S] — [Mechanics of Magic analysis](https://mechanicsofmagic.com/?p=16102)
- "Menus are easy to navigate" with confusion kept minimal. (2016) [S] — [LWHS student blog](https://blogs.lwhs.org/hyphen/2016/03/16/neko-atsume)
- Neko Atsume 2 renamed and moved some entries (Expansion under Shop and Items; Settings inside Other). [S] — [Neko Atsume Wiki, Game Menu](https://nekoatsume.fandom.com/wiki/Game_Menu)

**Pikmin Bloom (2021, still live in 2026)**
- The game was still being promoted at events in 2026. [S] — [Kotaku, "Nintendo Skipped PAX West 2026, But Its Pikmin Didn't"](https://kotaku.com/nintendo-pax-west-2026-pikmin-bloom-2000732118)
- A renewed home screen was being tested with a subset of players; v126 added a "Play Guide" to the home menu. [S] — [Pikipedia, Update](https://pikminwiki.com/Update); [Pikmin Bloom community, v126 release notes](https://community.pikminbloom.com/t/release-information-v126/10687)
- A February 2026 critique finds the gamification works but lists usability friction, says discoverability is a hurdle for new players, and proposes a home screen change for "a more natural mapping between the home screen and key gameplay actions". [S] — [Pratt IxD critique, 9 Feb 2026](https://ixd.prattsi.org/2026/02/design-critique-pikmin-bloom-iphone-app/)
- A 2021 launch review was harsh on the interface. [S] — [TheSixthAxis review, Nov 2021](https://www.thesixthaxis.com/2021/11/22/pikmin-bloom-review/)

**Pokemon Sleep (2023)**
- "For a free-to-play mobile game, Pokemon Sleep has a fantastic UI." [S] — [TechRadar](https://techradar.com/gaming/my-sleep-has-gotten-worse-since-playing-pokemon-sleep-but-i-still-wont-stop)
- "If you have things to do in the morning, it can be especially frustrating waiting through menus before finally starting your day." [S?] — [GosuGamers impressions](https://gosugamers.net/entertainment/features/69058-pokemon-sleep-impressions-why-catch-pokemon-when-you-can-catch-some-zs)
- App-review digests flag "overly verbose UI/UX in the post-sleep review phase" and quote "Loading screens for loading screens just to hit ok." (Machine-generated digest updated 17 April 2026; weigh lightly.) [S] — [Marlvel report on Pokemon Sleep](https://marlvel.ai/apps/jp-pokemon-pokemonsleep)

**Finch (self-care pet)**
- Onboarding is conversational: the pet asks the player's name and the player picks an egg; one capture of the flow runs to 46 steps and ends by generating personal goals. [S] — [Screens Design, Finch onboarding](https://screensdesign.com/articles/finch-app-onboarding-design/); [Lazyweb onboarding flow](https://lazyweb.com/canvas/flows/finch/onboarding)
- A teardown warns that copying the pet and reward currency without a credible care loop "can make the experience feel manipulative". [S] — [Screens Design, Finch](https://screensdesign.com/apps/finch-self-care-pet/)

**Animal Crossing: Pocket Camp (2017; live service since ended) and Pocket Camp Complete**
- Of the paid offline successor: "the UI can be truly obtuse sometimes", carrying the legacy of its free-to-play systems. [S] — [Eurogamer review of Pocket Camp Complete](https://meilu.jpshuntong.com/url-68747470733a2f2f7777772e6575726f67616d65722e6e6574/animal-crossing-pocket-camp-complete-review)
- A 2020 critique titled "Pocket Camp is a UX nightmare" centres on its two currencies pushing spending. [S] — [UX Planet](https://uxplanet.org/pocket-camp-is-a-ux-nightmare-c7969ca03d2e)
- Launch-era notes: some menus "use really small icons", and the tutorial locks the interface step by step. (2017) [S?] — [CGMagazine review](https://www.cgmagonline.com/reviews/animal-crossing-pocket-camp-review-vacation-pocket/)

**Cats & Soup; Tamagotchi apps**
- Cats & Soup's interface is praised as consistent, which keeps navigation simple; adverts are opt-in for rewards. [S] — [DEV Community write-up](https://dev.to/jpdengler/exploring-the-charming-uiux-design-of-catssoup-3l9a); [Metaphors and Moonlight review](https://metaphorsandmoonlight.com/game-review-cats-soup-by-hidea/)
- My Tamagotchi Forever (2018) sends a notification whenever the pet is hungry, sleepy or needs the toilet, and sells skipping of waits; one review calls it "even more annoying than actual Tamagotchi". [S] — [App Trigger](https://apptrigger.com/2018/03/19/my-tamagotchi-forever-annoying); [TechCrunch](https://techcrunch.com/2018/03/15/my-tamagotchi-forever-brings-the-90s-to-your-smartphone)

### Inferences
- **Home is the scene.** Neko Atsume and Pikmin Bloom blur menu and play: the first thing seen is the living place, not a dashboard. For a creature game the first frame should be the named individual in its surroundings.
- **One menu button, a fixed "home" control, two taps per action.** Neko Atsume's whole structure is one icon opening nine entries, and it is the game most often praised for being usable without reading the language. That is a strong argument for icon-first labels and a shallow menu.
- **Count the screens between open and care.** Pokemon Sleep's praised visuals do not save it from the complaint that the morning is a queue of confirmations. Whatever the recap is, the first care action should be reachable before or beside it.
- **One task at a time** (Finch) suits a short daily visit better than a list of ten daily quests.
- **Do not notify per need.** The Tamagotchi app's per-need alerts are the criticised version; Pikmin Bloom's single daily moment at a chosen hour is the tolerated one.
- [R] Pocket Camp's live service ended in late November 2024 and was replaced in December 2024 by the paid, offline Pocket Camp Complete, so its free-to-play interface criticism is historical. Verify at [Eurogamer's review](https://meilu.jpshuntong.com/url-68747470733a2f2f7777772e6575726f67616d65722e6e6574/animal-crossing-pocket-camp-complete-review).
- [R] Pokemon Sleep's home is a field with Snorlax in the middle and helper Pokemon walking around it carrying food to tap, with one large sleep button at the bottom centre; the morning flow runs sleep report, then a tap-through of each sleeping Pokemon found, then feeding, before the home screen returns. Verify at [Bulbapedia, Pokemon Sleep](https://bulbapedia.bulbagarden.net/wiki/Pokémon_Sleep).
- [R] Finch's home is the bird in its room with an energy meter above and the day's goals below; ticking goals fills the meter and the bird then leaves on an adventure and returns with something to show. Verify at [Screens Design, Finch](https://screensdesign.com/apps/finch-self-care-pet/).

### Gaps
- Exact tap counts to the core action were found only for Neko Atsume (two taps per action, from one write-up). No source gave counts for Pikmin Bloom, Pokemon Sleep, Finch, Pocket Camp or Cats & Soup.
- The layouts of Pokemon Sleep's, Finch's and Cats & Soup's home screens are from recall, not from a source read this session.
- The content of the Pratt critique's home screen proposal for Pikmin Bloom was cut off in the snippet.
- Nothing found from Hit-Point on Neko Atsume's design or from Niantic on Pikmin Bloom's (no developer talks or postmortems surfaced).
- No Deconstructor of Fun, Naavik or Mobile Free to Play teardown surfaced for any of these games.

## 5. Recurring UI criticisms of these games on mobile

### Takeaway
The complaints that recur are about waiting and nagging more than about looks: chains of confirmation screens, alerts for every need, permanent red dots, and touch targets or icons that are too small. Clutter from currencies was confirmed only for Pocket Camp.

### Cited Findings
- **Screen chains and loading.** Pokemon Sleep: "Loading screens for loading screens just to hit ok" (machine-generated review digest); waiting through menus in the morning is "especially frustrating" (hands-on impressions; which page is unconfirmed). [S?] — [Marlvel report, updated 17 Apr 2026](https://marlvel.ai/apps/jp-pokemon-pokemonsleep); [GosuGamers](https://gosugamers.net/entertainment/features/69058-pokemon-sleep-impressions-why-catch-pokemon-when-you-can-catch-some-zs)
- **Red dots.** One analysis lists "five red notification dots, a list of 10 Daily Quests, and social pressure from the Clan/Guild" as what makes players hesitate before opening a game, and says the fatigue comes from the layer around the game, not from play itself. [S] — [Gamota analysis](https://gamota.com/en_GB/?p=2753%2F)
- **Red dots lose meaning.** "If it's always there, it might as well not be there at all." [S] — [Braze, "Beware red dot badging"](https://www.braze.com/resources/articles/beware-red-dot-badging.md)
- **Two kinds of badge.** An "action needed" badge and an "FYI" badge need different rules; treating them alike causes badge fatigue. [S] — [Dolfy blog](https://www.dolfy.ai/blog/notification-badge-problem-red-dot-mobile-apps)
- **Badge hygiene.** Keep counts low and clear the badge once the user acts. (Dec 2024) [S] — [WebEngage](https://webengage.com/blog/what-are-app-icon-badges/)
- **A stuck dot.** A player bug report about a persistent dot on a Quests tab says they "genuinely cannot stand that red dot anymore". [S] — [BetaHub issue](https://app.betahub.io/projects/pr-5642738318/issues/g-115567)
- **Notification nagging.** My Tamagotchi Forever alerts for each need. (2018) [S] — [App Trigger](https://apptrigger.com/2018/03/19/my-tamagotchi-forever-annoying)
- **Small targets.** Terra Nil on phones: small touch targets that the UI scale setting did not fully fix. (2023) [S] — [TouchArcade](https://toucharcade.com/2023/03/29/terra-nil-mobile-review-netflix-graphics-performance-ipad-pro-iphone/)
- **Small icons and obtuse menus.** Pocket Camp: "really small icons" (2017) and "the UI can be truly obtuse sometimes" (successor review). [S?] — [CGMagazine](https://www.cgmagonline.com/reviews/animal-crossing-pocket-camp-review-vacation-pocket/); [Eurogamer](https://meilu.jpshuntong.com/url-68747470733a2f2f7777772e6575726f67616d65722e6e6574/animal-crossing-pocket-camp-complete-review)
- **Currencies.** Pocket Camp's two currencies are the core of a 2020 UX critique. [S] — [UX Planet](https://uxplanet.org/pocket-camp-is-a-ux-nightmare-c7969ca03d2e)
- **Memory load and discoverability.** Pikmin Bloom: players send the wrong creature on errands and the app does not record which postcards went to which friend; features are hard for new players to find. (Feb 2026) [S] — [Pratt IxD critique](https://ixd.prattsi.org/2026/02/design-critique-pikmin-bloom-iphone-app/)
- **Panels that do not scale.** The Bibites had to fix its brain panel leaving the screen at some UI scales. [S] — [The Bibites 0.6.0.1 hotfix](https://thebibites.itch.io/the-bibites/devlog/811452/the-bibites-0601-hotfix)
- **Slow entry to the editor.** Thrive players met very long loading before the editor in 2026. [S] — [Thrive progress update, 30 May 2026](https://www.revolutionarygamesstudio.com/progress-update-5-30-2026)
- **Recap as a gate.** A loading bar on an idle game's welcome-back popup was resented. [S] — [Warzone Idle forum](https://www.warzone.com/Forum/581561-purpose-loading-bar-welcome-back-popup)
- **Rewards that feel hollow or manipulative.** A teardown of Finch warns that pet and currency without a credible loop feels manipulative. [S] — [Screens Design](https://screensdesign.com/apps/finch-self-care-pet/)

### Inferences
- A friends-only game with no shop can avoid the currency and red-dot complaints entirely, and should say so by having at most one kind of marker, shown only when something needs the player and cleared the moment they look.
- The most damaging pattern for a 15-minute daily visit is the confirmation chain. A budget worth setting: no more than one screen between opening the game and touching the creature.
- Touch target and icon size complaints appear even in well-reviewed ports (Terra Nil), so sizes should be tested on a small phone, not scaled down from a desktop layout.
- "Leans on memory" is the complaint closest to a creature-collection game: the screen should show which creature is where and what was last done to it, so the player does not have to remember.

### Gaps
- "Text too small" was not confirmed as a recurring complaint for any named game; the nearest evidence is small icons (Pocket Camp) and small touch targets (Terra Nil).
- No app store or Reddit threads were read directly; the Pokemon Sleep review quotes come through a machine-generated digest.
- No evidence gathered on cluttered HUDs in Cats & Soup or similar idle games; the one source found praised its consistency.
- The red-dot sources are marketing and UX blogs about apps in general, not studies and not about these specific games.
- Nothing found on slow menus in Tamagotchi apps other than My Tamagotchi Forever (2018); the current Tamagotchi apps were not covered.
