# life-game

A mobile-first online creature/ecosystem game for a small group of friends. The project was restarted from scratch in November 2026 and is moving from design exploration into planning.

- `archive/` holds the superseded first version. Ignore it: do not read it for guidance, build on it, or run its tooling unless explicitly asked.
- `reports/` holds research reports; `research_notes/` holds the source notes behind each report.
- `design/` holds the current design proposals. Where a design doc and a report disagree, the design doc is the later thinking.
- `design/mockups/` holds visual studies published as pages. They are explorations, not game code.
- `design/checks/` holds small scripts that test claims made in the design docs. They are stand-ins, not the game's code; run with `node design/checks/moodsim.js [scenario]` (recipes), `node design/checks/verbaudit.js [scenario]` (whether each verb differs from its neighbour), `node design/checks/bodyaudit.js [scenario]` (whether each body part changes outcomes) or `node design/checks/envaudit.js [scenario]` (whether each feature of the world changes who thrives).
- `design/plan.md` is the draft plan for building the first playable version.
