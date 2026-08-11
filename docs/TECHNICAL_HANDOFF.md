# Creature Life
## Technical Handoff Specification v3.0

**Engineering architecture, milestone contracts, testing rules, Codex
operating protocol and long-term scalability guardrails**

| Field | Value |
| --- | --- |
| Document status | Locked technical handoff aligned to Creature Life GDD v1.0 |
| Intended repository | `Kovacs-x/creature-life` |
| Current active scope | M0 scaffold and M1 first adaptive organism |
| Primary target | Mobile-first PWA; iPhone baseline |
| Date | August 2026 |

## Executive Engineering Summary

Creature Life is an original artificial-life game. The engineering challenge
is not plausible scripted behaviour; it is a causal, testable, serialisable
simulation in which increasingly complex behaviour can emerge from interacting
general mechanisms.

The repository is simulation-first. React and rendering are adapters around
an authoritative TypeScript simulation. The creature is never an LLM or
personality prompt. When behaviour fails to emerge, repair the missing
capability rather than adding a special-case rule.

The first milestone is deliberately minimal: one hungry creature and one
food object. M1 is accepted only when learning is measurable against a
control, the decision chain is inspectable in telemetry, state is
serialisable, and a fixed seed can replay the defined trace.

The long-term architecture anticipates memory, development, player teaching,
social cognition, genetics, cultural transmission, deep biology, offline
catch-up, stylised 3D presentation and optional multiplayer. None may
destabilise the core boundary or become a prerequisite for proving M1.

## 1. Purpose and Document Authority

This document translates the locked GDD into an engineering plan. It does not
replace the GDD. The GDD controls product intent; this document controls
current technical implementation unless an approved ADR changes it.

Authority order:

1. Creature Life GDD v1.0.
2. `docs/TECHNICAL_HANDOFF.md`.
3. `AGENTS.md`.
4. Current milestone specification, beginning with `docs/M1_SPEC.md`.
5. Approved ADRs.
6. Implementation and tests.

A coding agent must not silently reinterpret a higher-level document because a
shortcut is easier to implement.

## 2. Product Definition

Creature Life is an original artificial-life game in which the player raises
persistent alien organisms whose bodies, minds, relationships, abilities,
language and descendants emerge from genetics plus lived experience. It is
not a scripted virtual pet with a conversational facade.

The long-term product includes developmental ageing, multidimensional
relationships, learned human vocabulary, creature-created communication,
social learning, reproduction, mutation, population evolution, cultural
transmission, disease, mortality, lineage archives and optional
cross-population contact. These are long-term capabilities; implementation
must earn them incrementally.

## 3. Non-negotiable Architecture Principles

### 3.1 Simulation is authoritative

There is one canonical simulation state. React, rendering, menus, animations
and explanatory UI observe or issue inputs; they do not contain authoritative
creature logic. The simulation runs without React or a renderer. Tests can
instantiate a world, advance time, provide inputs and inspect state in
TypeScript.

### 3.2 No LLM as the creature brain

An LLM, chatbot prompt, personality prompt, text-generation service or hidden
narrative system must not determine authoritative actions, memories,
language, relationships or emotional state. Optional future LLM use may assist
player-facing explanation or tooling only when grounded in recorded telemetry.

### 3.3 No scripted substitute for emergence

Do not patch failed behaviour with `if (cold) goToShelter()` or
`if (appleVisible) walkToApple()`. Identify and repair missing perception,
association, memory, valuation, affordance, navigation or reinforcement.
Hard-coded reflexes are allowed only as explicit, narrow biological reflexes.

### 3.4 Causality and inspectability

Important actions must be explainable from actual state. The engine should
record active stimuli, internal drives, retrieved memories, candidate actions,
selected action, random contribution, consequence and learning update.

### 3.5 Deterministic where practical

All stochastic systems use an explicit seeded PRNG whose state can be
persisted. Reproducibility is expected for the same state, inputs, timing and
RNG stream. Perfect cross-platform bit identity is not mandatory.

### 3.6 Serialisable from the start

Creature state, world state, genome, brain topology/weights, memories,
relationships, biological state, world time and RNG state have explicit
serialization contracts. Canonical state contains no closures, DOM objects,
renderer handles or browser-only references.

### 3.7 Earn complexity

Add a subsystem only after the underlying layer passes behavioural acceptance
tests. Do not implement the whole GDD in one pass.

## 4. Originality and IP Guardrails

The final game is called Creature Life. Legacy terminology based on another
franchise must not appear in new production code, filenames, classes, UI,
lore, species names or assets.

Use generic/original terms such as Creature, Organism, Genome, Brain, Memory,
World and Population until in-world terminology is approved. Do not copy or
reconstruct proprietary source, assets, characters, lore, audio, UI or
distinctive expression. Final code, art, animation, audio, typography and
packages require original or appropriately licensed provenance.

## 5. Recommended Technology Stack

### Prototype and early production

- Language: strict TypeScript.
- App shell: React.
- Build/dev server: Vite.
- Tests: Vitest for unit/integration; Playwright later for browser flows.
- Initial renderer: minimal HTML Canvas or lightweight DOM debug renderer for
  M1–M6.
- Persistence: IndexedDB behind a repository abstraction.
- PWA: service worker and manifest once the core prototype is stable.
- Hosting: Vercel or equivalent HTTPS static deployment for iPhone testing.

### Later presentation and native iOS

The locked art direction targets stylised 3D. Three.js or another approved
browser/mobile 3D solution can be introduced when the simulation is ready;
React Three Fiber is an integration layer only. Start web-first and evaluate
Capacitor or equivalent packaging after PWA and touch UX are stable. Native
APIs sit behind adapters.

### Performance escalation

Start with clear TypeScript. Use typed arrays and
structure-of-arrays representations only when profiling justifies them.
Consider workers, WASM or WebGPU only after measurement identifies a
bottleneck. Do not introduce Rust/WASM/WebGPU merely because a future brain
may be large.

## 6. Target Repository Structure

The target boundary map is:

```text
creature-life/
├── AGENTS.md
├── CODEX_START_PROMPT.md
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── docs/
│   ├── GDD.md
│   ├── M1_SPEC.md
│   ├── TECHNICAL_HANDOFF.md
│   └── decisions/
├── src/
│   ├── app/
│   ├── simulation/
│   │   ├── core/
│   │   ├── creature/
│   │   ├── brain/
│   │   ├── biology/
│   │   ├── senses/
│   │   ├── drives/
│   │   ├── actions/
│   │   ├── memory/
│   │   ├── genetics/
│   │   ├── social/
│   │   └── telemetry/
│   ├── world/
│   ├── persistence/
│   ├── rendering/
│   └── ui/
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── behavioural/
│   ├── long-run/
│   └── performance/
└── public/
```

Do not create empty folders for every future feature on day one. M1 creates
only what it needs plus inexpensive stable seams.

## 7. Canonical Simulation Model

At minimum, the world owns:

```text
WorldState
- id
- schemaVersion
- simulationTime
- rngState
- environment
- objects
- creatures
```

Each creature owns or references:

```text
CreatureState
- id
- displayName
- birthTime
- developmentalState
- genome
- biology
- senses/currentPerception
- brain
- drives
- memory
- relationships
- position/orientation
- currentAction
- actionHistorySummary
- telemetry settings
```

Meshes, sprites, animation controllers, camera references and DOM nodes stay
outside canonical state.

## 8. Simulation Loop and Multi-rate Scheduling

The logical causal order is:

1. Apply scheduled world/environment updates.
2. Advance biology and internal homeostasis.
3. Build external and internal sensory inputs.
4. Update neural activation and associative processing.
5. Retrieve relevant memories and concepts.
6. Evaluate drives, predicted consequences and candidate activations.
7. Select an action using deterministic scoring plus controlled stochasticity.
8. Execute the motor/world action.
9. Resolve physical/social interactions.
10. Apply biological and environmental consequences.
11. Compute reinforcement/learning signals.
12. Update weights, associations and later structural plasticity.
13. Record diagnostic telemetry and important events.
14. Persist/checkpoint when required.

Do not tie this cycle to render frames. M1 may use one fixed logical tick, but
interfaces must not assume every subsystem runs every animation frame.

## 9. Brain and Learning Architecture

### 9.1 General direction

Use a small, explicit, inspectable connectionist architecture first. The
long-term direction is sparse, modular, recurrent adaptive processing with
reinforcement, structural plasticity, explicit memory interfaces and later a
limited predictive/world-model layer.

### 9.2 Initial units

A node has an ID, module/type, activation, bias or threshold where applicable,
and metadata. A connection has source, target, weight, learning/plasticity
parameters, enabled state and optional future eligibility traces.

Initial conceptual modules include sensory input, object/concept association,
internal/body signals, drive/value and action/motor candidates. Social,
language, episodic recall, planning and metacognitive modules are later scope.

### 9.3 Reinforcement

Consequences alter learning through a general reinforcement mechanism. Eating
when hungry reduces discomfort and strengthens relevant recently active
pathways. There is no `learnApple()` routine. Learning supports strengthening,
weakening/decay and eventual reversal.

### 9.4 Structural plasticity

Do not implement major structural plasticity in M1 unless required. Data
contracts should allow connections to be added, pruned, enabled or disabled
later.

### 9.5 Development

The genome specifies developmental rules, not a finished adult brain. It may
influence region sizes, connection probabilities, plasticity windows,
sensory biases and neuromodulatory sensitivity; experience realises the
adult network.

## 10. Drives, Agency and Action Competition

Drives are continuous motivational pressures, not state-machine modes.
Examples include hunger, thirst, fatigue, safety/fear, pain avoidance,
curiosity, social need, attachment, reproduction and comfort.

Player commands are strong inputs, not absolute motor overrides. Action
selection combines sensory evidence, internal biology, memories, habits,
social context, command signals and limited stochasticity. Candidate actions
compete and the highest-valued feasible option is selected.

## 11. Memory Architecture

Memory is a distinct system connected to the adaptive brain, not a giant event
array. Long-term classes are working, episodic, semantic/conceptual, spatial
and social memory. Memories are imperfect; consolidation, emotional salience,
repetition, retrieval, interference, decay and ageing influence retention.
Sleep later contributes to consolidation. M1 needs no full memory subsystem;
its learning-weight update is sufficient. M4 introduces explicit persistent
memory.

## 12. Biology and Embodied Cognition

The final architecture does not use a single authoritative health bar.
Early milestones use simplified biology and expand later. Long-term systems
include energy, hunger, hydration, nutrients, temperature, sleep, stress,
pain, injury, healing, immunity, pathogens, ageing and development.

Biology directly modulates cognition: hunger increases food salience, fatigue
reduces attention, pain biases action selection and chronic stress affects
learning and health. M1 requires only hunger/energy change and meaningful
reward from eating.

## 13. World and Affordances

The world is persistent and causally consistent. Creatures do not receive
omniscient labels exposing hidden truth. Perception provides observable
properties, and the creature learns implications.

Long-term objects support affordances such as movable, graspable, edible,
hard, heavy, climbable, breakable, stackable or warm. For M1, a simple food
object with position and food-relevant sensory features is sufficient.

Spatial knowledge belongs to a learned representation. Navigation helpers may
assist locomotion but must not provide unlearned semantic map knowledge.

## 14. Player Interaction, Language and Social Systems

The player is a persistent social entity. Relationships are multidimensional:
familiarity, trust, attachment, fear, social reward, dependence and
expectations arise from history.

Concepts exist independently of words. Speech recognition converts audio to a
signal/token; it does not grant semantics. Joint attention, repetition and
consequence build associations. Comprehension and production are separate.
Creatures may mislearn, overgeneralise, invent signals and transmit them.

Social intelligence arises from accumulated interaction: recognition,
observation, cooperation, conflict, parenting, reputation, social learning,
groups and culture. A population should eventually know what no individual
was born knowing.

## 15. Genetics, Reproduction and Cultural Inheritance

The genome is a compact set of developmental instructions influencing
morphology, physiology, senses, neural development, plasticity, metabolism,
lifespan and reproductive parameters. It must not encode finished
personality or learned memory.

Reproduction combines compatible contributions through recombination and
mutation. Siblings resemble parents while differing meaningfully. Traits
have trade-offs. Learned knowledge is not genetically inherited: genes pass
possibilities; teaching, imitation and communication pass knowledge.

## 16. Persistence, Saves and Offline Simulation

### 16.1 Local-first architecture

Early builds use IndexedDB behind a `SaveRepository` interface. Core
simulation does not require a backend.

### 16.2 Transactional snapshots

Use versioned snapshots. Save a candidate, validate it, mark it authoritative
and retain a previous recovery point where practical. Persisted structures
have schema versions and migrations.

### 16.3 Snapshot plus significant-event history

Keep canonical state, important events, bounded recent telemetry and
aggregated older history. Do not store every tick forever. The Life Archive
derives from significant events.

### 16.4 Offline catch-up

Closing the app pauses computation, not world history. On resume, elapsed
world time advances with adaptive resolution: routine safe periods take larger
steps, important interactions higher fidelity. “While You Were Away”
summaries are derived from actual events.

## 17. Rendering, Animation and UI Boundaries

The normal UI shows life first and machinery second. Initial M1 rendering may
use simple 2D shapes sufficient to observe creature, food, movement and
telemetry. Long-term presentation is stylised 3D with heritable phenotype
parameters, but renderer and animation controllers consume simulation
snapshots and never become behaviour authority.

Layered UI targets are Home/companion, Creature/Life, Care, Laboratory/brain
and Lineage/Society. The “Why did it do that?” feature reads causal telemetry.

## 18. Performance Architecture

iPhone is the baseline. Rendering frequency is independent of simulation
frequency; subsystems run only as often as causally necessary. Distant
creatures can run at reduced fidelity, remote ecology can use aggregate or
event-driven models, and memory/logs are bounded.

Track frame time, simulation-step time, memory, save size, catch-up duration,
battery/thermal behaviour and serialization cost. Prefer sparse networks.
Profile before typed-array rewrites, workers, WASM or GPU compute.

## 19. Testing Philosophy: Emergence Must Be Measurable

Definition of done:

1. Implemented.
2. Unit/integration tested.
3. Behaviourally observable.
4. Causally explainable through telemetry.
5. Reproducible or statistically demonstrated where stochastic.

### Emergence Test Protocol

1. Define the target behaviour.
2. Measure a naive baseline.
3. Provide relevant experience.
4. Retest behaviour.
5. Compare with a control lacking experience or learning.
6. Inspect the internal mechanism that changed.
7. Where applicable, test reversal/extinction.

### Ablation, identical-genome and long-run tests

Disable systems one at a time, including reinforcement, episodic memory,
curiosity and social learning, and measure capability changes. Run identical
starting genomes under different environments and different genomes under
similar conditions. Accelerated worlds must detect unbounded memory, population
explosion, neural saturation, numerical instability, save growth,
pathological loops and lineage corruption.

## 20. M1 — First Adaptive Organism

M1 is intentionally tiny.

### Required world

- one creature;
- one food object (an apple is acceptable as a neutral prototype object);
- bounded minimal 2D space.

### Required creature systems

- stable unique ID and serialisable state;
- simplified genome parameters;
- hunger and energy;
- external food perception plus internal hunger;
- small neural/connection network;
- food/object concept activation;
- hunger-driven valuation;
- candidate action selection;
- idle, move and eat;
- physical movement and contact;
- food consumption and biological consequence;
- reinforcement updating at least one learned connection;
- deterministic seeded RNG;
- diagnostic telemetry.

### Required causal chain

```text
food visible + hunger
  -> sensory/internal activation
  -> associative/concept processing
  -> competing action activation
  -> seek/move selected
  -> contact with food
  -> eat
  -> hunger decreases / energy improves
  -> positive reinforcement signal
  -> relevant connection weight changes
```

### Forbidden shortcuts

- `if apple visible then move to apple`;
- direct UI commands to alter hunger or weights;
- action animation bypassing simulation;
- hard-coded apple-specific learning;
- React owning intelligence;
- hidden LLM call;
- unseeded random behaviour.

### M1 acceptance tests

1. Perception: food inside range creates expected input; food outside does not.
2. Biology: hunger changes over time and falls after eating.
3. Decision: high hunger plus perception raises food-seeking activation
   through the drive/brain pipeline.
4. Movement: selected movement changes position toward the target under
   world constraints.
5. Consumption: contact plus eat consumes food and applies consequences.
6. Learning: eating changes a relevant connection through reinforcement.
7. Control: learning-disabled or reward-withheld equivalent does not show the
   same improvement.
8. Improvement: success/latency improves under a predefined metric and
   controlled seeds or statistical test.
9. Serialization: world/creature round-trip preserves meaningful state.
10. Determinism: fixed seed and identical input stream reproduce the trace.
11. Telemetry: stimulus, hunger, activations, candidates, selection,
    consequence, reward and weight update are inspectable.

M1 is not accepted merely because a creature visibly walks to food once.

## 21. Milestone Roadmap

- **M0:** constitution and scaffold: documents, agent rules, TypeScript/Vite/
  React direction, test harness, deterministic RNG and simulation boundary.
- **M1:** first adaptive organism.
- **M2:** embodied drives.
- **M3:** general learning.
- **M4:** memory.
- **M5:** development.
- **M6:** habitat/world.
- **M7:** player teaching.
- **M8:** social cognition.
- **M9:** social learning.
- **M10:** genetics/reproduction.
- **M11:** cultural transmission.
- **M12:** advanced biology.
- **M13:** presentation.
- **M14:** long-duration persistence.
- **M15:** iOS production and mobile optimisation.

Multiplayer is post-1.0 unless explicitly revised.

## 22. Version 1.0 Scope Boundary

Version 1.0 should demonstrate a genuinely developing organism; perception,
adaptive learning, memory and agency; player teaching and a persistent
relationship; multiple creatures with recognition and relationships; social
learning; genetics, reproduction and lineage; meaningful food, sleep, health,
ageing and mortality; an explorable habitat; local persistence, offline
continuity, biography, lineage archive and a causal brain/behaviour viewer;
and a polished mobile-first experience.

Public multiplayer, a huge planet, hundreds of high-fidelity agents,
advanced epidemics, advanced grammar, global migration and
civilisation-scale culture do not block 1.0 unless the production plan is
explicitly revised.

## 23. Coding Standards

Use TypeScript strict mode, explicit state transitions and dependency
injection for RNG, clock, persistence and platform adapters. Keep browser
globals out of core simulation. Use stable IDs, schema versions, documented
units, named tunables and explicit public types. Prefer composition and
data-driven modules over inheritance. Require justification, licence review,
bundle/performance consideration and approval for material dependencies.

## 24. Git and Change Management

Make small coherent commits, one architectural concern per PR where
practical, and include tests with behavioural changes. Do not perform
repository-wide rewrites or reintroduce legacy terminology.

Recommended commit style:

```text
feat(sim): add seeded simulation rng
feat(brain): implement connection reinforcement
test(m1): add food-learning control experiment
docs(adr): record action-selection scoring decision
```

## 25. Architecture Decision Records

Use `docs/decisions/ADR-XXXX-title.md` for decisions that materially alter
boundaries, persistence, brain architecture, rendering, networking or
simulation semantics. Each ADR contains status, context/problem, options,
decision, trade-offs, migration/backwards-compatibility impact and testing
implications. Present major changes before writing the ADR unless explicitly
delegated.

## 26. Codex Operating Protocol

On first entry, Codex must read AGENTS, the GDD, this handoff and M1 spec;
inspect the tree and Git history; run existing tests/build; identify
inconsistencies; produce an architecture assessment and M1 plan; and wait
for approval before simulation implementation unless explicitly instructed.

During implementation, work only on the active milestone, avoid speculative
systems, preserve inexpensive seams, state assumptions, test after meaningful
changes, include acceptance evidence and stop before major architecture
changes.

## 27. Immediate Next Actions

1. Create or rename the GitHub repository to `Kovacs-x/creature-life`.
2. Add AGENTS, Technical Handoff, M1 spec and GDD.
3. Open the repository as a Codex project.
4. Give Codex the start prompt.
5. Review the architecture assessment before implementation.
6. Complete M0 scaffold.
7. Implement M1 only.
8. Demonstrate M1 through tests and telemetry before M2.

## 28. Definition of Engineering Success

Engineering succeeds when complexity increases without losing causality,
testability, performance or continuity. Behaviour remains grounded in
simulation state; long-lived worlds survive software evolution; and genuine
learning and social transmission can be distinguished from animation,
randomness and scripted special cases.

## Appendix A — Repository Codex Instruction Pack

Commit AGENTS.md, `docs/TECHNICAL_HANDOFF.md`, `docs/M1_SPEC.md` and
`CODEX_START_PROMPT.md` so every Codex session receives the same constraints
without chat history.

## Appendix B — First Codex Review Gate

Before implementation Codex returns repository status, architecture
assessment, document-compliance gaps, minimal M0 scaffold plan, M1 plan
mapped to every acceptance criterion, decisions requiring approval and the
exact first small commit. Implementation begins only after approval.