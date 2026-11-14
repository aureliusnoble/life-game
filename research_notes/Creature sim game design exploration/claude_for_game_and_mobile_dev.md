# Claude and Claude Code for game and mobile development (state as of November 2026)

Research date: 2026-11-14. Evidence grades used below:

- **[P]** primary page fetched and read in this session (all Anthropic docs and engineering posts).
- **[S]** search-result snippet only. The page itself could not be opened, because the host is outside this cloud session's network allowlist (hnshowcase.com, wccftech.com, colyseus.io, spacetimedb.com, app.cinevva.com and docs.expo.dev all failed to resolve) and third-party fetches were stopped after that. Treat [S] items as leads to verify, not settled facts.
- **[pre-2026]** older than 2026 and possibly outdated.

The web-search budget for the session ran out before the last batch of 11 searches. The affected topics are listed under Gaps in each section.

## 1. Case studies: which real games were built largely with Claude / Claude Code, and what did developers report?

### Takeaway
By late 2026 there are many publicly playable browser games built almost entirely by Claude Code, and a few Steam releases that disclose it. The polished ones took weeks of human-directed iteration (53 days and 731 commits; 12 major iterations and 321 commits), not one prompt. In every account the human acted as director and playtester, and the agent struggled most with game feel, camera, cross-browser determinism and judging its own work.

### Cited Findings

**Vibe Jam 2026 (Pieter Levels)**
- The 2026 jam ran 1 April to 1 May 2026, required at least 90% of code to be AI-written, and required games to be free and playable on the web without login. [S] — [levelsio launch post on X](https://x.com/levelsio/status/2039777677435908421?lang=en); [vibej.am/2026](https://vibej.am/2026/)
- Winners: Gold ($25,000) "A Game About Capybaras Delivering Food" by @leocooout; Silver ($10,000) "Fanto's Mega-Mart" by @e_c_t_o; Bronze ($5,000) "WenWare" by @underpaid_mom. Sponsors were Cursor, Bolt, Glif and Tripo AI. [S] — [levelsio winners post on X](https://x.com/levelsio/status/2067364066193203333)
- The launch post listed Gold at $20,000; the final site and winners post say $25,000. [S] — [launch post](https://x.com/levelsio/status/2039777677435908421?lang=en); [vibejam.com](https://vibejam.com/)
- Submission count: one third-party guide says 945; a participant blog says "just under a thousand". Neither is an official figure. [S] — [Summer Engine guide](https://www.summerengine.com/blog/cursor-vibe-jam-2026-guide); [dmnshd.gg](https://dmnshd.gg/blog/vibe-jam-2026-geobeat)
- The Gold winner was reportedly built with Claude Code in about two weeks by an iOS developer with nine years' experience, who ran 2-3 Claude Code sessions at once on separate parts of the code to avoid conflicts. [S] — [Wccftech](https://wccftech.com/ios-developer-made-capybara-game-using-vibe-coding-and-won-25000/)
- Levels' own results post is titled "Vibe Jam 2026 winners and how the games are getting close to real production quality" (title only; content not read). [S] — [levels.io](https://levels.io/vibe-jam-2026-winners-quality)
- Colyseus says 1 in 7 multiplayer jam games shipped with its framework (headline only; vendor blog). [S] — [Colyseus](https://colyseus.io/blog/vibe-jam-2026/)

**Simon Willison's browser games (October 2026)**
- Willison wrote that four game projects "have convinced me that the models are now capable of producing fun games with very little guidance". All are HTML and JavaScript running entirely in the browser. [S] — [The October inflection point for vibe game development, 28 Oct 2026](https://simonwillison.net/2026/Oct/28/vibe-game-development/)
- Tree Appreciator (spot-the-difference) came from a single prompt in ordinary Claude chat. Emberwick needed playtesting and repeated prompting for a larger area, mechanics, plot and a magic system. [S] — [same post](https://simonwillison.net/2026/Oct/28/vibe-game-development/)
- Battle Drones was built with Claude Code for web over 12 major iterations and 321 agent commits. The first version was a workable but unenjoyable Command & Conquer-style game; the prompt "Make it a LOT more fun" and a later port to three.js changed it substantially. It now has multiplayer, replays, maps and mutators, and Willison says he reviewed almost none of its TypeScript. [S] — [Battle Drones, 20 Oct 2026](https://simonwillison.net/2026/Oct/20/battledrones/); [kottke.org quote](https://kottke.org/26/10/0049863-simon-willison)
- Battle Drones replays desynced because Chrome and Safari compute `Math.sin()` and `Math.cos()` slightly differently (secondary write-up). [S] — [explainx.ai](https://explainx.ai/blog/battle-drones-simon-willison-vibe-coded-rts-audio-multiplayer-claude-code-321-commits-2026)
- A secondary summary says none of the four took more than four hours of Willison's own time, while Claude Code ran for many more hours. [S] — [neoteo](https://www.neoteo.com/en/simon-willison-built-four-claude-games-with-different-workflows)

**Mario Galaxy-style game (Show HN, 2026)**
- 731 commits over 53 days, about 95% of the code written by Claude Code (Opus). Stack: TypeScript, Three.js plus Pixi.js on a shared WebGL2 context, Rapier3D WASM physics. [S] — [Show HN](https://news.ycombinator.com/item?id=47600002)
- The author built custom skills: `/lets-build:plan` (spawns subagents to research the codebase, then asks clarifying questions), `/review-plan`, `/code-review`, `/retrospective`, `/ecs-review`. The CLAUDE.md is 164 lines of hard constraints learned from debugging sessions. [S] — [Show HN](https://news.ycombinator.com/item?id=47600002)
- The post has a "Where Claude struggled" section; the visible item is the camera, described elsewhere as "a collaborative effort with claude where claude wrote the actual code". [S] — [Show HN](https://news.ycombinator.com/item?id=47600002); [three.js forum](https://discourse.threejs.org/t/super-mario-galaxy-movie-game/90783)

**Other 2026 accounts**
- Grumbulus: two developers, two evenings, 15,000 lines of vanilla JavaScript with procedural audio and parallax rendering; one workflow used 8 parallel Claude Code agents, each on a different domain. [S] — [Cinevva](https://app.cinevva.com/news/2026-03-22-solo-devs-shipping-games-with-ai)
- Catvivors (roguelite auto-battler) entered Steam Early Access on 13 March 2026. Its Steam AI disclosure reads: "the game code was optimized with Claude Code (AI model). The trailer was partly generated with AI (initial 7 seconds)". It lists 24 levels, 6 characters and 15+ weapons. [S] — [Steam store page](https://store.steampowered.com/app/4450240)
- Further first-hand write-ups exist but were not read: a multiplayer 3D web game, an MMO, LennyRPG, a game-jam diary and a SpacetimeDB vendor post. [S] — [Show HN multiplayer](https://news.ycombinator.com/item?id=46639408); [MMO post](https://portfolio-9vb.pages.dev/post/building-an-mmo-with-claude-code); [LennyRPG](https://www.lennysnewsletter.com/p/how-i-built-lennyrpg); [Unmask the City](https://dev.to/furic/building-unmask-the-city-a-solo-game-jam-journey-with-ai-pair-programming-44b4); [SpacetimeDB](https://spacetimedb.com/blog/building-with-claude-code)
- Decrypt cautions that "built from scratch" claims for viral one-prompt demos are hard to credit fully. [S] — [Decrypt](https://decrypt.co/374560/dumbest-ai-prompt-claude-beat-careful-game-design)

**Anthropic's own evidence**
- Anthropic's Labs team gave Claude the prompt "Create a 2D retro game maker with features including a level editor, sprite editor, entity behaviors, and a playable test mode." A single-agent run (20 minutes, $9) produced a broken game: entities appeared but nothing responded to input. A planner/generator/evaluator harness (6 hours, $200) produced a playable game with a richer editor, though physics issues remained. [P] — [Harness design for long-running apps, 24 Mar 2026](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- [pre-2026] In November 2025 Anthropic reported that even Opus 4.5, given only a high-level prompt, fell short of a production-quality web app without a harness. [P] — [Effective harnesses for long-running agents, 26 Nov 2025](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)

**fly.pieter.com [pre-2026]**
- Levels started the flight sim in February 2025 with Cursor and Three.js; most sources say the first version took about three hours. Only one outlet names Claude 3.5 Sonnet as the model. [S] — [Indie Hackers](https://www.indiehackers.com/post/pieter-levels-used-ai-to-build-a-viral-flight-simulator-in-3-hours-with-no-background-in-game-development-7CPfMr1yRLEwH6cC8xhE); [Genbeta](https://www.genbeta.com/actualidad/este-desarrollador-creo-clon-flight-simulator-ia-30-minutos-esta-ganando-70-000-euros-al-mes-juego)
- Revenue claims conflict: Levels reported $87,000 MRR within about 17 days; other coverage cites about $5,000/month, and one retrospective is titled "...then it went to zero". [S] — [dev.to retrospective](https://dev.to/promptway/he-built-a-flight-simulator-in-three-hours-and-hit-1m-a-year-in-17-days-then-it-went-to-zero-1b1l); [Avgeekery](https://avgeekery.com/?p=39779)

**Productivity evidence**
- METR's February 2026 update did not give a clean number: it reported severe selection effects and is redesigning the study, while saying developers are likely more sped up than in early 2025. Secondary sources disagree on the exact figures. [S] — [METR, 24 Feb 2026](https://metr.org/blog/2026-02-24-uplift-update/); [Rob Bowley summary](https://blog.robbowley.net/2026/04/04/metrs-developer-productivity-research-2026-update/)

### Inferences
- Every documented agent-built game that looks polished uses the web stack (TypeScript or JavaScript with Canvas/WebGL, Three.js, Pixi). The jam rules, Willison's games, the Mario Galaxy game and Grumbulus all point the same way, which matches the planned mobile-first web game.
- Human effort did not disappear; it moved to playing the build and giving direction. Willison's "Make it a LOT more fun" result and Emberwick's repeated playtesting suggest that the limiting input is the developer's play feedback, not typing.
- No source describes a persistent, server-authoritative ecosystem simulation built by an agent. The closest relevant lesson is Battle Drones' replay desync: a simulation that must agree across devices should not rely on floating-point library functions in different browsers. Running the simulation on one server avoids this.
- Jam entries and one-evening games are evidence of speed, not of maintainability over months. The 53-day project is the only account found that describes accumulated constraints (the 164-line CLAUDE.md) from a longer build.

### Gaps
- The primary posts by Willison, the Show HN author, Levels and the Gold winner were not read in full; details above come from snippets. The full "Where Claude struggled" list is missing.
- The fourth of Willison's four games was not identified.
- No Anthropic customer story about a game studio was found (the search could not run).
- No verified data on player retention, performance or netcode quality of agent-built multiplayer games.
- No independent source confirms the Catvivors developer's process or the Codex involvement claimed in secondary coverage.

## 2. Claude Code workflow best practices relevant to games (official guidance, late 2026)

### Takeaway
Anthropic's current guidance reduces to three moves: write down only what Claude cannot learn from the repo, give it a pass/fail check it can run itself, and enforce the few absolute rules with hooks rather than prose. Much 2025 advice (aggressive context management, shouting in CLAUDE.md, "think harder") is now officially obsolete. Cloud sessions, Projects and scheduled tasks make a phone-driven workflow practical, with specific limits that affect setup.

### Cited Findings

**Core guidance**
- "Claude stops when the work looks done. If it has nothing to run that tells it whether the work actually *is* done, 'looks done' is all it has to go on." The check can be a test file, a build exit code, a linter, a script that diffs output against a fixture, or a browser screenshot next to the mockup. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- Ask for evidence: the command and its output, or the screenshot. "'All tests pass' on its own tells you very little." [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- CLAUDE.md should hold only what Claude cannot work out from code: the exact test, typecheck and lint commands; places where the code is misleading; decisions not in the repo; "anything you've had to correct twice already". The memory guide recommends staying under 200 lines. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- Rules that apply to one area go in `.claude/rules/` with a `paths:` filter; procedures go in skills at `.claude/skills/<name>/SKILL.md`, which load only when needed. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- Instructions are either non-deterministic (prompt, CLAUDE.md, skills: Claude decides) or deterministic (hooks, deny rules: the harness enforces). "If you keep adding emphasis to a `CLAUDE.md` line and Claude still misses it, that's a sign the line belongs in a hook." [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- A `Stop` hook that exits with code 2 sends Claude back to work until the check passes (overridden after eight consecutive blocks). `/goal <condition>` has a separate model check a condition after every turn. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- `/verify` "has Claude build and run the app and look at the result. That catches the kind of problem that tests and typechecks miss." `/run-skill-generator` records how to launch the project as a committed skill at `.claude/skills/run-<name>/`. [P] — [Best practices](https://code.claude.com/docs/en/best-practices); [Skills](https://code.claude.com/docs/en/skills)
- For unclear requirements, have Claude interview you and write `SPEC.md`, then build from it in a fresh session. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- "Claude tends to read a request conservatively and build the smallest thing that satisfies it"; saying "be ambitious" with the scope spelled out still helps. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- Independent review: `/code-review` uses a fresh subagent that never saw the conversation. When writing a review prompt, keep "skip style", because "a reviewer that's asked to find problems will always find *something*" and fixing everything adds needless abstraction and tests. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- After two failed corrections, `/clear` and write a better prompt instead of a third correction. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)

**What changed (the official "stop doing" list)**
- New terminal and VS Code sessions start in auto mode, where a classifier model checks actions; the default model is Claude Opus 5.5 at medium effort; conversations compact automatically; most current models have a 1M-token window. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- Advice now marked unnecessary: treating the context window as the main constraint, ALL-CAPS emphasis, using subagents to protect context or to get a better answer, "think hard" phrases, "don't be lazy" lines, and describing architecture and file layout in CLAUDE.md. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- Subagents give parallelism or a fresh reviewer, "but not a smarter answer", and cost extra tokens. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)

**Unattended runs**
- Before leaving a run, answer five questions: does it know what done looks like, can it check its own work, what may it touch, what stops it, and who signs off. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- Parallel work: each session needs its own checkout (`claude -w <name>` worktrees, the desktop app, or cloud sessions). `/batch` splits one mechanical change into 5 to 30 units, each in its own worktree with its own PR. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)

**Cloud sessions (formerly "Claude Code on the web")**
- Cloud sessions run on Anthropic-managed VMs, continue after you close your device, are available on Pro, Max, Ultra and Team plans, and count toward plan usage with no separate VM charge. They start from the browser, the Code tab of the Claude mobile app, the desktop app or `claude --cloud`. [P] — [Use Claude Code in the cloud](https://code.claude.com/docs/en/claude-code-on-the-web)
- Each VM is Ubuntu 24.04 on x86_64 with about 4 vCPUs, 16 GB RAM and 30 GB disk. Preinstalled: Node 20/21/22 with npm, pnpm, yarn; Python; Docker; PostgreSQL 16; Redis 7; and "Chrome for Testing at `/usr/bin/google-chrome`, with the `CHROME_PATH` environment variable set". [P] — [Cloud environments](https://code.claude.com/docs/en/cloud-environments)
- "You don't get a shell into the session VM. Claude runs every command for you." [P] — [Cloud environments](https://code.claude.com/docs/en/cloud-environments)
- Network access is Limited by default: package registries, GitHub and cloud SDK domains are allowed, and other hosts must be added per environment. API keys go in as "network secrets" that a proxy attaches outside the sandbox; GitHub credentials never enter the VM. [P] — [Cloud environments](https://code.claude.com/docs/en/cloud-environments)
- A single-repository cloud session loads the repo's CLAUDE.md, `.claude/settings.json` hooks and permissions, `.mcp.json` servers, and `.claude/skills/`, `agents/`, `commands/`. Anything only on your own machine is absent. [P] — [Cloud environments](https://code.claude.com/docs/en/cloud-environments)
- Time limits: a foreground command waits 2 minutes by default (up to 10), then moves to the background for up to 30 more minutes; setup scripts are cached only if they finish in roughly five minutes; idle VMs pause and can be reclaimed, which loses running background commands but keeps the conversation. [P] — [Cloud environments](https://code.claude.com/docs/en/cloud-environments); [Use Claude Code in the cloud](https://code.claude.com/docs/en/claude-code-on-the-web)
- Auto-fix: Claude can watch a pull request and push fixes when CI fails or a reviewer comments; it needs the Claude GitHub App on the repo. It cannot react to merge conflicts on its own. [P] — [Use Claude Code in the cloud](https://code.claude.com/docs/en/claude-code-on-the-web)
- "Plan locally, execute in the cloud": agree a plan, commit it to the repo, then start a cloud session to execute it. [P] — [Use Claude Code in the cloud](https://code.claude.com/docs/en/claude-code-on-the-web)

**Mobile**
- The Claude app for iOS and Android "is a client for Claude Code sessions rather than a place where code runs". From the phone you can start cloud sessions, open projects, or drive a session on your own computer through Remote Control. Bypass-permissions mode cannot be selected from the app. [P] — [Claude Code on mobile](https://code.claude.com/docs/en/mobile)

**Projects (public beta)**
- A project is one conversation in which Claude starts a thread (usually a cloud session) per task, runs them in parallel on separate branches and PRs, and shows an Overview of what is ready for review or waiting on you. Public beta on Pro, Max and Ultra. [P] — [Projects](https://code.claude.com/docs/en/claude-projects)
- Project threads share instructions (up to 16,000 characters) and file-based project memory with a `MEMORY.md` index. [P] — [Projects](https://code.claude.com/docs/en/claude-projects)
- Important limit: "Cloud threads load each repository's `CLAUDE.md` instructions but not its skills, `.mcp.json` servers, or `.claude/settings.json`." Repository hooks do not run in project threads. [P] — [Projects](https://code.claude.com/docs/en/claude-projects); [Cloud environments](https://code.claude.com/docs/en/cloud-environments)
- "A project uses your limits faster than a single session does, and on a Pro plan in particular you should expect to reach your limit sooner." [P] — [Projects](https://code.claude.com/docs/en/claude-projects)

**Scheduled tasks and the Agent SDK**
- Cloud scheduled tasks (formerly routines; research preview) run a saved prompt on a schedule, an API call or a GitHub event, and push to `claude/`-prefixed branches. Anthropic warns to protect `main` with a branch rule first and to watch the first few runs. [P] — [Scheduled tasks](https://code.claude.com/docs/en/routines); [Best practices](https://code.claude.com/docs/en/best-practices)
- The Agent SDK is "Claude Code as a library" for Python and TypeScript, with the same tools, hooks, subagents and MCP support. It requires API-key billing; third parties may not offer claude.ai login for products built on it. [P] — [Agent SDK overview](https://code.claude.com/docs/en/agent-sdk/overview)

**Long-running harness research**
- [pre-2026] Anthropic's November 2025 pattern: an initializer session writes a JSON feature list (each item with test steps and a `passes` flag), an `init.sh` and a progress file; later sessions do one feature at a time, test it end to end, and commit. "It is unacceptable to remove or edit tests." [P] — [Effective harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- March 2026 follow-up: with Opus 4.6 the sprint structure and context resets were dropped; the planner and a separate evaluator were kept. The evaluator "is now worth its cost mainly when a task sits beyond what the model reliably handles alone". [P] — [Harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps)

### Inferences
- For this project the highest-value setup items are, in order: one command that runs the headless simulation tests, one command that produces mobile-viewport screenshots, both named in CLAUDE.md; a `Stop` hook for typecheck and tests; and CI on every PR with branch protection on `main`.
- Hooks and `.mcp.json` work in ordinary single-repo cloud sessions but not in Project threads. If the workflow depends on a Stop hook or a browser MCP server, either use plain cloud sessions or duplicate the checks in CI, which Project threads do respond to through auto-fix.
- The 30-minute background-command ceiling and 4 vCPUs bound how large a balance-simulation batch can run inside one cloud session command. Longer sweeps belong in CI or need `BASH_DEFAULT_TIMEOUT_MS` raised.
- A design document, a feature list with pass flags and a decisions log committed to the repo serve the role Anthropic's harness posts give to handoff artifacts, and they survive compaction and new sessions.
- Deploy credentials are best kept out of agent sessions entirely by deploying from GitHub Actions on merge; the default network allowlist did not show common hosting providers when searched, so direct deploys from a cloud session would need extra allowed hosts anyway.

### Gaps
- The Claude Code changelog was not read, so "new in late 2026" is inferred from current docs rather than a dated list.
- Plan pricing and usage limits for Pro, Max and Ultra were not checked.
- "Ultracode mode" and dynamic workflows are mentioned in secondary coverage and linked from the SDK page but were not read.
- Whether Playwright's own browser download host is on the default allowlist is unconfirmed (a text search of the allowlist for "playwright" found nothing).

## 3. Closing the feedback loop: how agents verify visual and interactive game work

### Takeaway
The proven pattern is to give the agent a browser it can drive and a separate, sceptical evaluator, and to make the simulation testable without graphics. Canvas games need screenshots plus a text view of game state, with seeded randomness and frozen time. For balance work, sources favour cheap headless Monte Carlo runs over LLM "players". The web stack is where this tooling is strongest; evidence for Godot and Unity integrations is thin.

### Cited Findings
- Anthropic's evaluator agent used the Playwright MCP "which let it interact with the live page directly", clicking through the running app and grading it against criteria. [P] — [Harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- Without browser testing, Claude marked features complete after unit tests or `curl` checks that did not work end to end. "Providing Claude with these kinds of testing tools dramatically improved performance." [pre-2026] [P] — [Effective harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- Limits remain: "Claude can't see browser-native alert modals through the Puppeteer MCP", and vision limits make some bugs hard to catch. [pre-2026] [P] — [Effective harnesses](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
- Self-evaluation is unreliable: agents tend toward "confidently praising the work—even when, to a human observer, the quality is obviously mediocre". Out of the box Claude was a poor QA agent that found real issues and then talked itself into approving; tuning a separate evaluator to be sceptical was "far more tractable". [P] — [Harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- Even the full harness shipped a game with physics issues and an impassable wall, which the evaluator missed. [P] — [Harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- Cloud sessions ship Chrome for Testing and chromedriver, so headless browser checks can run there. [P] — [Cloud environments](https://code.claude.com/docs/en/cloud-environments)
- Canvas content has no DOM to query, so one tool recommends screenshots as primary evidence with a canvas-only capture. [S] — [browser-dev-mcp](https://www.pkgstats.com/pkg:@tanguito/browser-dev-mcp)
- A web-game skill recommends seeding the RNG, freezing time and fixing the viewport because pixel snapshots of canvas output flake, and notes headless WebGL canvases can screenshot blank, needing fallback capture methods or headed mode. [S] — [develop-web-game skill](https://skills.lc/platxa/platxa-skill-generator/platxa-platxa-skill-generator-skills-regenerated-develop-web-game-skill-md)
- Mobile emulation: a Playwright MCP skill resizes the window (for example 393x852) before snapshots; one write-up found a mobile flag was needed for true device dimensions; emulation is not proof of real-phone rendering. [S] — [mobile-testing skill](https://smithery.ai/skills/ramunasnognys/mobile-testing-playwright); [heyuan110](https://www.heyuan110.com/posts/ai/2026-07-21-claude-code-screenshot-mcp-frontend-debugging/); [itechguides](https://www.itechguides.com/?p=867893)
- A Phaser project publishes a Claude Code Playwright-testing skill. [S] — [phaserjs-oakwoods](https://skillselion.com/skills/chongdashu/phaserjs-oakwoods/playwright-testing)
- Balance testing: in a Hacker News discussion of an agentic play-testing harness, commenters suggested a Monte Carlo headless simulator instead of an LLM for deterministic games, citing speed and cost. [S] — [HN summary](https://ai-paper-delta.vercel.app/en/papers/hn_47947525)
- The open-source "Claude Code Game Studios" framework includes a balance-check skill that analyses balance data and formulas for outliers, degenerate strategies and economy imbalances. [S] — [balance-check skill](https://tessl.io/registry/skills/github/Donchitos/Claude-Code-Game-Studios/balance-check)
- Academic background: agent-based playtesting can cover in minutes what takes testers days. [pre-2026] [S] — [Exploring Gameplay With AI Agents](https://ar5iv.arxiv.org/html/1811.06962); [Winning Isn't Everything](https://arxiv.org/pdf/1903.10545)
- Godot: several MCP servers exist. Coding-Solo/godot-mcp (about 4.6k stars, MIT) launches projects and captures debug output; Godot MCP Pro is a paid server advertising 187 tools. No independent reviews were found. [S] — [Coding-Solo/godot-mcp](https://glama.ai/mcp/servers/Coding-Solo/godot-mcp); [Godot MCP Pro](https://mcpservers.org/de/servers/youichi-uda/godot-mcp-pro)
- Cross-browser determinism bit a real project: Battle Drones replays desynced over trig-function differences. [S] — [explainx.ai](https://explainx.ai/blog/battle-drones-simon-willison-vibe-coded-rts-audio-multiplayer-claude-code-321-commits-2026)

### Inferences
- An ecosystem simulation is unusually well suited to agent verification, because its core can be a pure function of (state, seed, tick) with no rendering. That allows fast unit tests, golden-state replays and thousands of headless runs, none of which need vision.
- A practical three-layer check: (1) deterministic simulation tests and replays; (2) a debug hook that returns game state as text or JSON so the agent can assert on it after driving the UI; (3) mobile-viewport screenshots reviewed by a fresh subagent against written criteria.
- Agent screenshots cannot judge feel: animation timing, touch ergonomics and readability on a real phone still need the developer's own play sessions, as the case studies show.
- For balance, the agent's role is to write the simulator harness, run sweeps, and analyse the output for dominant strategies; LLM-as-player is a costly supplement for checking whether the UI is understandable.
- The web stack suits agents because files are plain text, the toolchain is preinstalled in cloud sessions, and browser automation is mature. Godot's text scene format is workable in principle, but no first-hand quality evidence was found here.

### Gaps
- No first-hand report was read on Claude Code with Godot, Unity or Blender MCP servers; the comparison search could not run.
- The official Playwright MCP documentation was not checked for canvas or touch-emulation specifics.
- No documented case of golden-image testing for an agent-built game was found.
- Whether an Android emulator can run inside a cloud session VM is undocumented.

## 4. Art, animation and audio pipeline with AI assistance

### Takeaway
Evidence here is the weakest of all sections. What is documented: agent-built games commonly use code-generated audio and visuals, consistent style across many generated images is the known hard problem, and the 2026 jam was sponsored by image and 3D generation tools. Claude's strength is producing art as code and data, which is inherently consistent; its own aesthetic judgement needs explicit criteria.

### Cited Findings
- Grumbulus shipped with procedural audio and parallax rendering in 15,000 lines of vanilla JavaScript, with no mention of external asset tools. [S] — [Cinevva](https://app.cinevva.com/news/2026-03-22-solo-devs-shipping-games-with-ai)
- Vibe Jam 2026 sponsors included Glif (image workflows) and Tripo AI (3D model generation), indicating what entrants used for assets. [S] — [levelsio winners post](https://x.com/levelsio/status/2067364066193203333)
- Anthropic improved Claude's visual design output by grading it on four criteria: design quality ("Does the design feel like a coherent whole rather than a collection of parts?"), originality (custom decisions versus "AI-default patterns"), craft, and functionality. Design quality and originality were weighted more because Claude already handled craft and functionality. [P] — [Harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- Style consistency is the main obstacle with image models: "one great image is easy", keeping a whole game consistent is much harder; mitigations are custom style models, reference-image anchoring and fixed palettes. [S] — [Summer Engine 2D asset guide](https://www.summerengine.com/blog/ai-2d-game-asset-generator); [Inkration](https://inkration.com/ai-art-tools-for-game-studios-in-2026-what-actually-works-for-production/); [Flowith on Civitai](https://flowith.io/blog/how-indie-game-studios-use-civitai-custom-ai-art-styles)
- ZzFX is a tiny MIT-licensed sound generator with no asset files, called with a parameter array; jsfxr is a JavaScript port of sfxr for retro effects using the Web Audio API. [S] — [zzfx on npm](https://npmjs.com/package/zzfx); [jsfxr on npm](https://www.npmjs.com/jsfxr)
- Catvivors disclosed an AI-generated trailer segment separately from AI-assisted code. [S] — [Steam store page](https://store.steampowered.com/app/4450240)

### Inferences
- A creature designer built from parts favours procedural art: each part is an SVG or Canvas drawing function with parameters (size, colour, wobble), so one shared palette, stroke width and eye style guarantee coherence across every creature. Claude writes and maintains such code well, and changes are reviewable as diffs.
- A written style guide (palette, line weight, proportions, animation easing) plus a "style sheet" page rendering every part side by side gives the agent something to screenshot and a reviewer subagent something to grade, in the manner of Anthropic's design criteria.
- Animation by code (squash and stretch, bobbing, blinking through CSS or tweening) avoids skeletal-animation tools and keeps everything in text.
- Sound effects as ZzFX or jsfxr parameter arrays keep audio in the repo as text. The agent cannot hear, so the developer must audition the results.
- Image-generation models fit best for a small number of fixed assets (logo, backgrounds, store art) where consistency across hundreds of items is not required.

### Gaps
- No source was found describing Claude-generated SVG or procedural creature art in a shipped game; the dedicated search returned only image-pipeline material.
- Rive, Spine, ElevenLabs and Suno were not researched (the search could not run), including their commercial licence terms.
- No evidence on how well current Claude models judge "cute" or produce appealing character art unaided.

## 5. Game design with Claude: evidence, techniques and weaknesses

### Takeaway
There is solid evidence for two weaknesses, narrowed idea diversity and lenient self-assessment, and good practitioner evidence that play-driven iteration works. Direct evidence on LLMs as systems or balance designers is thin, so the recommended techniques rest mostly on inference from general findings.

### Cited Findings
- A Nature-published study across five experiments found ChatGPT can improve individual ideas but "significantly reduces the diversity of ideas within a group of ideas". [S] — [Wharton Mack Institute summary](https://mackinstitute.wharton.upenn.edu/?p=33528)
- A 36-participant study found ChatGPT users showed higher fluency and elaboration, but ideas across users were more similar. [pre-2026] [S] — [Homogenization Effects of LLMs on Human Creative Ideation](https://arxiv.org/html/2402.01536v2)
- "The Ink Splotch Effect" studied ChatGPT as a co-creative game designer and compared pure human design with AI-assisted design; its specific findings were not visible. [pre-2026] [S] — [arXiv 2403.02454](https://ar5iv.labs.arxiv.org/html/2403.02454)
- Agents over-praise their own work, especially on subjective tasks; a separate evaluator with explicit criteria is the tractable fix, though it remains "an LLM inclined to be lenient". [P] — [Harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- A planner agent that expands a short prompt into a full product spec was kept in Anthropic's harness even after other scaffolding was removed. [P] — [Harness design](https://www.anthropic.com/engineering/harness-design-long-running-apps)
- Anthropic recommends having Claude interview you with multiple-choice questions until it can write a spec. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- A reviewer asked to find problems "will always find *something*"; acting on everything causes over-engineering. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- Willison's Battle Drones went from unenjoyable to fun after a blunt "Make it a LOT more fun" prompt and play-driven iteration; Emberwick needed real playtesting. [S] — [Willison, 28 Oct 2026](https://simonwillison.net/2026/Oct/28/vibe-game-development/)
- The Mario Galaxy author added `/review-plan` and `/retrospective` skills, a sign that plan review and post-mortems became routine parts of the loop. [S] — [Show HN](https://news.ycombinator.com/item?id=47600002)
- A balance-analysis skill for Claude Code targets "outliers, broken progressions, degenerate strategies, and economy imbalances". [S] — [balance-check skill](https://tessl.io/registry/skills/github/Donchitos/Claude-Code-Game-Studios/balance-check)

### Inferences
- Use Claude where its output can be checked: content tables (parts, costs, unlocks, achievements) validated by schema and by simulation, and balance claims tested by running the simulator rather than by argument.
- Counter homogeneity by supplying the distinctive constraints yourself (theme, tone, the one mechanic that makes the game different) and asking for many varied options to select from, instead of asking for "a good design".
- Counter leniency by never asking the designing session whether its design is good. Use a fresh session with a hostile brief, for example "find the dominant creature build and prove it with simulation output".
- Counter over-scoping with a committed scope document listing what is explicitly out, and a feature list with pass flags; Claude's default is conservative per Anthropic, but planners expand scope when asked to be ambitious.
- Red-teaming for dominant strategies is well matched to an agent that can write search code (random search or evolutionary search over creature designs) against the headless simulator; the result is evidence, not opinion.

### Gaps
- No study was found on sycophancy specifically in game-design collaboration.
- No documented case of an LLM maintaining a game design document over months, or of LLM-driven analysis of real playtest data.
- No evidence on how good current Claude models are at original mechanic design versus recombining genre conventions.

## 6. Mobile app development with Claude

### Takeaway
Agent tooling for native mobile is mature on a developer's own Mac (Expo's official MCP server and skills, XcodeBuildMCP, Apple's own Xcode agent support) but does not transfer to Anthropic's cloud sandbox, which is x86 Linux. People do ship Claude-built iOS apps, with App Store review, signing and App Store Connect remaining manual pain points. For a phone-driven workflow, a web app or PWA avoids all of this, at the cost of iOS PWA limits.

### Cited Findings
- Expo hosts an official remote MCP server; Claude Code setup is `claude mcp add --transport http expo https://mcp.expo.dev/mcp`. It teaches agents the Expo SDK and lets them interact with mobile simulators and React Native DevTools, and manage EAS workflows. [S] — [Expo MCP docs](https://docs.expo.dev/eas/ai/mcp)
- Expo publishes official skills and a Claude Code plugin; two Expo pages give different install commands. [S] — [Expo skills](https://docs.expo.dev/skills/); [Expo Claude page](https://docs.expo.dev/agents/claude.md)
- Community servers add Detox or Maestro UI automation for Expo apps. [S] — [expo_ios_development_mcp](https://glama.ai/mcp/servers/@andreahaku/expo_ios_development_mcp/tree/92f87c13d2e1c7c022551d48285b546c81745eab); [DaveDev42/expo-mcp](https://glama.ai/mcp/servers/@DaveDev42/expo-mcp)
- XcodeBuildMCP is an open-source server for building and testing iOS apps from Claude, with 18 simulator tools; it was acquired by Sentry in early 2026 and needs the Xcode toolchain, so macOS only. [S] — [XcodeBuildMCP](https://glama.ai/mcp/servers/@cameroncooke/XcodeBuildMCP/tree); [guide](https://mcp.directory/blog/xcodebuildmcp-complete-guide-2026)
- Xcode 26.3 reportedly added a native 20-tool MCP server and agent launch through `xcrun mcpbridge` (secondhand; no Apple page was checked, and which of the two linked posts carries each detail is unconfirmed). [S] — [Blake Crosley](https://blakecrosley.com/de/blog/xcode-mcp-claude-code); [Daniel Vaughan](https://codex.danielvaughan.com/2026/06/11/xcode-27-codex-cli-mcp-bridge-apple-agentic-coding-ios-macos-development/)
- Cloud session VMs are Ubuntu 24.04 on x86_64; the base image cannot be replaced. [P] — [Cloud environments](https://code.claude.com/docs/en/cloud-environments)
- When work needs your own machine's tools, Remote Control lets the phone drive a Claude Code session running on that computer, which must stay on. [P] — [Claude Code on mobile](https://code.claude.com/docs/en/mobile)
- Shipping experience: one developer who wrote no code reported three App Store rejections before going live. [S] — [dev.to, asvid](https://dev.to/asvid/look-at-me-im-the-ios-developer-now-icj)
- Claude Code cannot operate the App Store Connect website; that work stayed manual. [S] — [dev.to, tanizya](https://dev.to/tanizya/i-built-an-ios-stock-prediction-app-with-claude-code-heres-how-it-went-2d2e)
- Other first-hand accounts (not read): an offline-first Swift app in 43 days, and "Idea to App Store in 72 hours". [S] — [dev.to, grommash9](https://dev.to/grommash9/i-built-an-offline-first-ios-app-in-43-days-with-swift-sqlite-and-claude-code-4o4j); [Needlebook](https://aidancbrady.com/blog/needlebook-app)
- Apple has no rule against AI-built apps. Its March 2026 enforcement against Replit, Vibecode and Anything cited Guideline 2.5.2, which bars apps from executing downloaded code that changes functionality after review. [S] — [TechRepublic](https://www.techrepublic.com/article/news-apple-vibe-coding-app-store-rules/); [The Next Web](https://thenextweb.com/news/vibe-coding-apple-app-store-surge-crackdown)
- App Store submissions are reported at a ten-year high. [S] — [Entrepreneur](https://www.entrepreneur.com/business-news/app-store-submissions-are-the-highest-in-10-years)
- iOS PWA limits: web push works only for apps installed to the home screen (iOS 16.4+); installation is manual; script-writable storage for non-installed sites faces a seven-day cap; background sync is unsupported. [S] — [MagicBell guide](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide); [bswen](https://docs.bswen.com/blog/2026-03-12-safari-pwa-limitations-ios)

### Inferences
- A cloud-session-only workflow cannot build, sign or simulate iOS apps, because that toolchain needs macOS. Native iOS work would require a Mac driven through Remote Control or a hosted build service such as EAS.
- A web app, optionally installable as a PWA, is the only target that the agent can build, run, screenshot and deploy entirely from cloud sessions started on a phone. This matches the game's stated mobile-first web design.
- Keeping persistent state on the server makes the iOS storage-eviction rules mostly irrelevant; the client only needs a login token, and losing it means logging in again.
- If the game is ever wrapped as a native app, Guideline 2.5.2 is worth checking against the player-programmed behaviour feature. Behaviour blocks interpreted as data by the app's own engine are a different thing from downloaded executable code, but this was not confirmed against Apple's text.
- A thin Capacitor wrapper later is a plausible route to push notifications on iOS without a rewrite, but no evidence about it was gathered.

### Gaps
- Capacitor, Flutter, Kotlin and Maestro/Detox agent workflows were not researched (the searches could not run).
- Expo's pages could not be opened, so requirements such as paid EAS plans or local-only capabilities are unconfirmed.
- One source claims Apple removed standalone PWAs in the EU from iOS 17.4; this conflicts with other reporting and should be verified against Apple's current documentation before relying on it.
- Sources disagree on iOS PWA storage quotas (50 MB versus a large share of disk) and on whether persistent storage requests are granted.
- No source was found on agent-built PWAs specifically.

## 7. Using Claude at runtime or in the game's content pipeline

### Takeaway
For about 20 players the cost of generated text is negligible on the current small model, roughly one dollar a month or less, and still modest on mid-tier models. The real risks are reception and trust: players react badly to visible low-quality AI narrative and to factual errors about game state. Generating text offline from structured facts, with strict schemas, avoids the latency and hallucination problems reported for live AI characters.

### Cited Findings

**Models and prices (first-party API, per million tokens)**
- Claude Haiku 5.5: $0.10 input, $0.50 output for prompts up to 100,000 tokens ($0.50 / $2.50 above that). [P] — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Claude Sonnet 5.5: $2 input, $10 output. Claude Opus 5.5: $4 / $20. Claude Fable 5.2: $8 / $40. Claude Haiku 4.5: $1 / $5. [P] — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- "The Batch API allows asynchronous processing of large volumes of requests with a 50 percent discount on both input and output tokens." Haiku 5.5 batch: $0.05 / $0.25. [P] — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Prompt caching: 5-minute cache writes cost 1.25x base input, 1-hour writes 2x, and cache reads 0.1x on most models (0.05x on Opus 5.5 and Sonnet 5.5). Caching and batch discounts stack. [P] — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)
- Web search as a server tool costs $10 per 1,000 searches plus tokens. [P] — [Pricing](https://platform.claude.com/docs/en/about-claude/pricing)

**Structured outputs**
- "Structured outputs constrain Claude's responses to follow a specific schema, ensuring valid, parseable output for downstream processing." The schema goes in `output_config.format`; tools can set `strict: true`. [P] — [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- Limits: no recursive schemas, no numeric or string-length constraints, objects must set `additionalProperties: false`; first use of a schema adds compilation latency and compiled grammars are cached for 24 hours; changing the format invalidates the prompt cache for that thread. [P] — [Structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)

**Reception, latency and disclosure**
- Vaudeville (2023), a detective game with LLM-generated dialogue: analysis of 132 Steam reviews found hallucinations and weak character memory as recurring complaints. [pre-2026] [S] — [CONVERSATIONS'23 paper](https://samucox.github.io/files/CONVERSATIONS'23%20Paper.pdf)
- Firmament players complained about lore content written by AI. [pre-2026] [S] — [Techdirt](https://www.techdirt.com/tag/firmament/)
- Vapor World launched on Steam to mostly negative reviews (36% approval at launch) after AI-generated cutscenes replaced in-engine ones. [S] — [Everything Edinburgh](https://everythingedinburgh.com/games/news/vapor-world-steam-ai-cutscene-backlash/)
- Experts panned 2026 chatbot characters as boring and cheap, with some optimism. [S] — [Rock Paper Shotgun via scour.ing](https://scour.ing/@tyler/p/https://www.rockpapershotgun.com/horrible-boring-and-cheap-experts-pan-new-chatbot-npcs-but-some-leave-room-for-optimism)
- A developer-run study claimed 96% of players enjoyed AI characters; it comes from a studio making such a game. [S] — [Wccftech](https://wccftech.com/genai-study-conducted-by-studio-making-game-with-ai-powered-npcs-claims-96-of-players-enjoy-ai-powered-npcs/amp/)
- Latency guidance for live dialogue (first words within about a second; never block player input on an LLM call) comes from low-quality guides. [S] — [abratabia](https://abratabia.com/llm-npcs/latency-and-cost.php); [Cinevva guide](https://app.cinevva.com/guides/ai-npcs-dialogue)
- Steam's January 2026 policy revision exempts AI-powered development tools from disclosure but still requires disclosure of AI-generated content players consume, including content generated during play. [S] — [TweakTown](https://www.tweaktown.com/news/109743/valve-changes-ai-disclosure-guidelines-ai-powered-tools-are-now-exempt/index.html); [GameMeca](https://www.gamemeca.com/en/view.php?gid=1770331)

### Inferences

**Cost estimate for about 20 players** (own arithmetic from the fetched price list; assumes 3 summaries per player per day, 1,800 calls a month):

| Scenario | Tokens per call | Haiku 5.5 | Sonnet 5.5 | Opus 5.5 |
|---|---|---|---|---|
| Lean | 3,000 in / 400 out | $0.90 / month | $18.00 / month | $36.00 / month |
| Rich | 10,000 in / 1,000 out | $2.70 / month | $54.00 / month | $108.00 / month |

- The Batch API halves each figure (for example $0.45 a month for lean Haiku 5.5). Hidden thinking tokens are billed as output, so real output counts may run above these assumptions; even doubling output leaves Haiku 5.5 under a few dollars a month.
- Daily recaps suit a nightly batch job: nothing is waiting on the response, so latency does not matter and the 50% discount applies. Generating all players' recaps back to back with a shared prefix (rules, species glossary, style guide) would also benefit from caching.
- Plausible uses, ordered by fit: (1) the daily "nature documentary" recap written from a structured event log; (2) names and flavour text generated once at creation and stored; (3) a "why did my species die" coach given the simulator's own cause-of-death data; (4) natural language to behaviour blocks, returned through a strict schema and validated by the game before use; (5) weekly events, generated ahead of time and reviewed by the developer before release.
- The reported failures (lore contradictions, memory lapses) come from letting the model invent facts. Passing computed facts in and asking only for narration, then showing numbers from the game beside the prose, limits that risk.
- With friends as the audience, moderation needs are small, but player-chosen creature names flow into prompts, so they should be treated as untrusted text and never as instructions.
- The API key must live on the server only, with a monthly spend cap, since any key shipped to the browser is public.
- Using Claude in the content pipeline at development time (generating part tables, achievement lists, event scripts that are reviewed and committed) carries none of the runtime risks and is the lower-risk first step.

### Gaps
- No developer post-mortem with real per-player cost figures for runtime text generation was found (the search could not run).
- No evidence on how players receive low-stakes generated recaps, as opposed to AI characters or AI art.
- A figure seen in search results (about 21% of 2025 Steam games using generative AI, with much poorer first-month reviews) could not be traced to a source and is not relied on here.
- Minimum cacheable prompt length per model and whether cache hits are guaranteed inside batches were not verified.
- Whether structured outputs are supported in the Batch API was not confirmed (the page was truncated before that point).

## 8. Risks and limits

### Takeaway
The best-documented risks are security defects in agent-built apps (exposed keys, missing database access rules), architectural drift when nobody reviews merged code, and agents declaring unfinished work done. Anthropic's cloud sandbox handles credential isolation well by design. Platform and copyright rules matter little for a private friends-only web game but would matter on Steam or the App Store.

### Cited Findings

**Security of what the agent builds**
(Attribution caveat for this subsection: the search summary reported these figures without tying each one to a single page, so each link is the result most likely to carry the figure, not a confirmed origin.)
- A scan by Escape of 5,600 publicly deployed vibe-coded apps found 2,000+ high-impact vulnerabilities, 400 exposed secrets and 175 instances of exposed personal data. [S] — [Cloud Security Alliance research note](https://labs.cloudsecurityalliance.org/research/csa-research-note-ai-generated-code-security-vibe-coding-202); [Wired summary via Freevacy](https://www.freevacy.com/news/wired/study-finds-security-gaps-in-thousands-of-vibe-coded-apps/7362)
- A scan of 1,645 Lovable apps found 170 (10.3%) with fully exposed databases lacking row-level security; the Moltbook incident paired a client-side Supabase key with absent row-level security. [S] — [Noqta](https://noqta.tn/en/blog/vibe-coding-security-gaps-2026); [CSA note](https://labs.cloudsecurityalliance.org/research/csa-research-note-ai-generated-code-security-vibe-coding-202)
- A controlled test of 15 apps from five AI coding platforms found none set security headers or CSRF protection. [S] — [SecurityWeek](https://www.securityweek.com/vibe-coded-apps-riddled-with-exploitable-security-flaws/amp/)
- AI-assisted commits were reported to introduce secrets at 3.2% versus a 1.5% human baseline. [S] — [CSA note](https://labs.cloudsecurityalliance.org/research/csa-research-note-ai-generated-code-security-vibe-coding-202)
- The widely quoted "91.5% of vibe-coded apps have vulnerabilities" comes from one consultancy's internal audit of a specific flaw category, not general prevalence. [S] — [SoftwareSeni](https://www.softwareseni.com/91-5-percent-of-vibe-coded-apps-have-vulnerabilities-and-what-the-q1-2026-research-actually-shows/)

**Security of running the agent**
- In Anthropic-hosted cloud sessions, git credentials stay outside the sandbox behind a proxy, and API keys added as network secrets are attached to requests after they leave the session. The GitHub proxy rejects branch deletions and non-branch pushes but does not limit which branches a push can update; branch protection must do that. [P] — [Cloud environments](https://code.claude.com/docs/en/cloud-environments)
- Environment variables and setup scripts are readable by anyone using the environment, and the docs warn against putting secrets there. [P] — [Cloud environments](https://code.claude.com/docs/en/cloud-environments)
- Auto mode "is a classifier model judging each action rather than a hard rule... it can be wrong", so "never" rules belong in deny rules or hooks. Deny rules such as `Read(./.env)` hold in every permission mode. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- Publicly shared sessions on individual plans "may contain code and credentials from private GitHub repositories". [P] — [Use Claude Code in the cloud](https://code.claude.com/docs/en/claude-code-on-the-web)

**Architecture quality and regressions over time**
- A May 2026 preprint finds agents leave a distinct pattern of technical debt and that judging by functional correctness hides maintainability costs. [S] — [AI-Generated Smells, arXiv 2605.02741](https://arxiv.org/html/2605.02741v1)
- Another 2026 preprint reports agent-authored code lowers success rates of later agent edits by up to 13.1% through behavioural drift, and a one-year study of 182 open-source projects finds lack of review the strongest predictor of maintenance burden. Which paper holds which result was not confirmed. [S] — [Beyond the Merge](https://www.alphaxiv.org/overview/2607.09902); [emergentmind 2606.21804](https://www.emergentmind.com/papers/2606.21804)
- Practitioners describe codebases that after six months feel "written by multiple teams with different opinions", and recommend architecture constraints enforced in CI over wiki documentation. [S] — [Planet Argon](https://blog.planetargon.com/blog/entries/when-agentic-coding-goes-off-the-rails); [Tian Pan](https://tianpan.co/blog/2026-04-20-vibe-code-at-scale-technical-debt); [Neil Kakkar](https://neilkakkar.com/agentic-debt.html)
- AI-co-authored pull requests produced 1.7 times more issues and 2.74 times more security problems than human-only ones in a CodeRabbit vendor study from December 2025 (320 AI-co-authored versus 150 human-only pull requests; the page carrying this figure is unconfirmed, same caveat as above). [pre-2026] [S] — [Cloud Security Alliance research note](https://labs.cloudsecurityalliance.org/research/csa-research-note-ai-generated-code-security-vibe-coding-202)
- Willison reviewed almost none of Battle Drones' code, an explicit trade of oversight for speed on a hobby project. [S] — [kottke.org](https://kottke.org/26/10/0049863-simon-willison)

**Context and cost limits**
- Running out of context is now rare (1M-token windows, automatic compaction), but long mixed sessions cost more because every request resends the conversation; `/clear` between unrelated tasks is still advised. [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- After compaction, earlier messages are replaced by a summary; a stated boundary such as "don't push until I've reviewed" "can get lost when the conversation compacts". [P] — [Best practices](https://code.claude.com/docs/en/best-practices)
- Parallel cloud sessions and Projects consume plan limits proportionately faster. [P] — [Use Claude Code in the cloud](https://code.claude.com/docs/en/claude-code-on-the-web); [Projects](https://code.claude.com/docs/en/claude-projects)

**Copyright and platform policy**
- The US Copyright Office's position: works created entirely by AI are not protected; prompting alone is insufficient; human selection, arrangement and modification can be protected, and AI material inside a larger human work does not bar copyright in the whole. Sources date the report to 29 January 2025, with one outlier citing March 2026. [pre-2026] [S] — [Jenner & Block](https://www.jenner.com/en/news-insights/publications/client-alert-us-copyright-office-issues-report-on-copyrightability-of-works-incorporating-ai-generated-material); [Finnegan](https://www.finnegan.com/en/insights/ip-updates/us-copyright-office-ai-prompts-alone-provide-insufficient-control-over-expression-to-protect-ai-generated-content.html)
- Steam (January 2026): AI coding tools need no disclosure; AI-generated content consumed by players does, including live-generated content. [S] — [TweakTown](https://www.tweaktown.com/news/109743/valve-changes-ai-disclosure-guidelines-ai-powered-tools-are-now-exempt/index.html)
- Apple: no AI-authorship disclosure rule was found; enforcement targets downloaded code that changes behaviour after review. [S] — [TechRepublic](https://www.techrepublic.com/article/news-apple-vibe-coding-app-store-rules/)

### Inferences
- The single most likely serious failure for this project is the well-documented one: a database or API reachable from the browser without proper authorisation. A small server that owns all writes, with no database keys in client code, removes that class of problem.
- Regression control over months depends on tests the agent cannot quietly weaken. Anthropic's rule against editing tests, a deterministic replay suite, and CI required on `main` together give that.
- Architecture drift is best limited by a few machine-checked boundaries (for example, the simulation core may not import UI or network code) and periodic agent-run refactoring sessions, since prose guidance in CLAUDE.md is explicitly non-binding.
- Reviewing every line is unrealistic for a solo hobbyist; reviewing the simulation core, the auth and data-access layer, and every schema migration is a workable minimum, with the rest covered by tests and a fresh-context review agent.
- For a private game among friends, Steam and App Store rules do not apply, and copyright in AI-generated assets matters only if the game is later commercialised.

### Gaps
- No incident reports specific to Claude Code (prompt injection through fetched content, leaked secrets) were researched.
- No long-horizon (six months or more) first-hand account of a solo Claude Code game project was found.
- Jurisdiction-specific copyright positions outside the US were not researched.
- Apple's and Valve's current policy texts were not read directly.
