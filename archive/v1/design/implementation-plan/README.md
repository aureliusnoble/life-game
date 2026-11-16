# Life Game — Implementation Plan

This directory contains the comprehensive, step-by-step implementation plan for Life Game.

The plan is split into phases, each in its own file for manageability:

| File | Phase | Description |
|------|-------|-------------|
| `phase-01-foundation.md` | Phase 1 | Project scaffolding, shared types, database schema |
| `phase-02-simulation-core.md` | Phase 2 | Server simulation engine (math, spatial, energy, organisms) |
| `phase-03-simulation-systems.md` | Phase 3 | Brain, senses, actions, physics, eating, combat |
| `phase-04-simulation-lifecycle.md` | Phase 4 | Reproduction, death, genetics, mutations, environment |
| `phase-05-simulation-management.md` | Phase 5 | Species manager, event detector, world orchestrator |
| `phase-06-networking.md` | Phase 6 | WebSocket server, binary protocol, auth, broadcasting |
| `phase-07-persistence.md` | Phase 7 | Supabase integration, snapshots, leaderboard, events |
| `phase-08-client-foundation.md` | Phase 8 | React app, stores, WebSocket client, routing |
| `phase-09-client-rendering.md` | Phase 9 | Pixi.js renderer, organism rendering, LOD, particles |
| `phase-10-client-designer.md` | Phase 10 | Species designer UI (body, brain, deploy tabs) |
| `phase-11-client-world.md` | Phase 11 | World view, spectating, follow mode, overlays |
| `phase-12-client-screens.md` | Phase 12 | Dashboard, profile, leaderboard, admin screens |
| `phase-13-onboarding.md` | Phase 13 | Quick start, introductions, guides, unlock education |
| `phase-14-debug.md` | Phase 14 | Debug infrastructure, debug panel, testing utilities |
| `phase-15-integration.md` | Phase 15 | End-to-end integration, polish, deployment |

## How to Use This Plan

Each phase contains numbered **Steps**. Each step is designed to be:
- **Implementable in isolation** — clear inputs, outputs, and boundaries
- **Testable** — unit tests, integration tests, and QA checklists included
- **Reference-rich** — every step cites the exact design doc sections to consult

Work through phases sequentially. Within a phase, steps are ordered by dependency.

---

## General Guidance for the Developer

### Your Role

You are the **implementer**. Your job is to write code, write tests, and verify that each step works before moving on. You are NOT expected to set up infrastructure (Supabase projects, VPS servers, DNS, domain registration, CI/CD pipelines) — that is the **manager's** responsibility. When a step requires infrastructure that doesn't exist yet, **stop and ask the manager to set it up** before proceeding.

### Before Starting Any Step

1. **Read the design references first.** Every step lists specific design document sections under "Design References." Open those files and read the cited sections in full before writing a single line of code. The design docs are the source of truth — if this plan and a design doc disagree, the design doc wins.
2. **Read the step fully** before coding. Understand the data structures, algorithms, unit tests, and QA checklist. Don't start implementing halfway through reading.
3. **Check dependencies.** Make sure the previous steps in the phase are complete and passing tests. Some steps depend on modules from earlier phases — verify those are working.

### When to Ask the Manager

Flag the manager (stop work and send a message) when:

- **Infrastructure is needed.** If a step requires Supabase, a VPS, DNS configuration, a GitHub repo, CI/CD setup, or any external service — ask the manager to provision it. Don't try to set it up yourself.
- **A design doc is ambiguous or contradictory.** If two design docs say different things, or a section is unclear, ask rather than guessing. Note the specific sections and what's confusing.
- **A step is blocked.** If you can't proceed because of a missing dependency, a failing test in a prior step, or a tooling issue — flag it immediately rather than working around it.
- **You want to deviate from the plan.** If you think a different approach is better, propose it before implementing. Explain what the plan says, what you'd do differently, and why.
- **You've finished a phase.** At the end of each phase, tell the manager so they can do QA.

You MUST pause and let the manager know if some input is needed.

### Development Tracking

You MUST carefully track your current progress, noting in the implementation files each item that you have already implemented, and carefully noting where tests have passed (or if they have failed, what the issues were). You should also cross off QA items you are able to verify yourself, or once instructed to by the manager.

### QA Handoff

Each step includes a **QA Checklist**. When you've completed a step:

1. Run all unit tests and integration tests. Make sure they pass.
2. Go through the QA checklist yourself first. Check off everything you can verify.
3. For items that require **manual QA** (visual checks, UX review, performance feel) — tell the manager exactly what to do:
   - What command to run or URL to open
   - What to look at specifically
   - What "good" looks like vs what would indicate a bug
   - Any test data or setup needed

Don't just say "QA the rendering." Say: "Run `pnpm dev`, open `localhost:5173/world`, zoom in on an organism, and verify: (a) eyes are on the body rim not floating inside, (b) tails animate when moving, (c) diet color goes green→yellow→red as you adjust the diet slider."

You MUST finish QA before moving to the next step.

### Code Standards

- **TypeScript strict mode.** No `any` types. Enable `strictNullChecks`.
- **Test every public interface.** Every exported function/class needs at least one unit test.
- **Follow existing patterns.** If Phase 1 establishes a project structure or naming convention, follow it in later phases.
- **Don't gold-plate.** Implement what the step says. Don't add features, optimizations, or refactors not in the plan. If you see an improvement opportunity, note it and move on.
- **Commit after each step.** One step = one logical commit. Write clear commit messages.

### Key Design Document Locations

All design docs are in `design/`:

| Document | Path | Key Content |
|----------|------|-------------|
| Architecture | `design/architecture.md` | System overview, WS protocol, binary encoding, DB schema, performance budget |
| Core Gameplay | `design/core-gameplay-systems.md` | All game mechanics, formulas, brain/body design, lifecycle |
| Art & Rendering | `design/art.md` | Visual style, stat-to-visual mapping, LOD, animation |
| Game Components | `design/components/game-components.md` | 15 module specifications with interfaces and algorithms |
| Front-End | `design/components/front-end.md` | Client architecture, stores, screens, routing |
| Back-End | `design/components/back-end.md` | Server architecture, tick pipeline, WorldManager |
| Onboarding | `design/onboarding.md` | Teaching system, reference guide content |
| Debug | `design/debug.md` | Debug infrastructure, panel, overlays, test utilities |
| Organism Mockup | `design/mockups/preview.html` | Working Canvas 2D organism renderer (reference implementation) |
| UI Mockup | `design/mockups/ui-preview.html` | UI layout mockup |
