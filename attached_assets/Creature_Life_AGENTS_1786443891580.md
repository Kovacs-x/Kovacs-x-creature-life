# AGENTS.md - Creature Life Repository Instructions

These instructions apply repository-wide unless a more specific `AGENTS.md` exists in a subdirectory. They are mandatory for Codex and other coding agents.

## 1. Project purpose

Creature Life is an original mobile-first artificial-life simulation. Creatures must behave through a causal simulation of perception, biology, drives, adaptive neural/connection processing, memory, action, consequence, and learning. The project is not an LLM pet, chatbot, scripted NPC system, or clone of an existing franchise.

## 2. Authority hierarchy

When instructions conflict, follow this order:

1. Creature Life GDD v1.0
2. `docs/TECHNICAL_HANDOFF.md`
3. this `AGENTS.md`
4. active milestone specification, currently `docs/M1_SPEC.md`
5. approved ADRs
6. existing implementation

Do not silently change product intent to match existing code.

## 3. Current milestone

The active implementation target is **M0/M1 only** until the user approves advancement.

M1 goal: one hungry creature perceives food, chooses a food-seeking action through the simulation pipeline, moves, eats, experiences reduced hunger, and receives reinforcement that measurably changes learned connection state.

Do not implement future features merely because they are in the GDD.

## 4. Hard prohibitions

You MUST NOT:

- use an LLM/chatbot/personality prompt as the creature's brain or authoritative decision-maker;
- hard-code normal emergent behaviour with rules such as `if appleVisible then walkToApple()`;
- place authoritative simulation logic inside React components;
- make animation state the source of creature behaviour;
- use unseeded randomness scattered through the codebase;
- copy proprietary game code, extracted assets, reverse-engineered implementations, character names, world lore, terminology, or distinctive expression from another franchise;
- introduce legacy `Norn`/`Creatures` naming into new production code;
- add backend, multiplayer, 3D production rendering, cloud infrastructure, WebGPU, WASM, or other large systems before the active milestone requires them;
- make major architecture changes without first explaining the need and receiving approval;
- fabricate causal explanations after an action. Explanations must come from telemetry recorded during the actual decision.

## 5. Simulation boundary

`src/simulation/**` must be usable without React, DOM, Canvas, browser APIs, or renderer objects.

Core simulation must accept explicit inputs/dependencies and produce state transitions. UI reads state and sends player inputs. Renderer consumes state snapshots/interpolation data.

Persisted canonical state must not contain DOM nodes, React objects, Three.js objects, functions/closures, or platform handles.

## 6. Determinism and randomness

All stochastic behaviour must go through the project's seeded RNG abstraction. Tests must be able to set and replay a seed. Store RNG state as part of canonical world state where required.

Do not call `Math.random()` inside simulation modules except inside the approved RNG implementation.

## 7. Serialization

State required to continue a creature's life must have explicit serialisable types and schema versions. Save/load round-trip tests are required when persisted structures are introduced or changed.

Use stable IDs for cross-object references. Do not rely on in-memory object identity across persistence boundaries.

## 8. Brain and learning rules

- Start small and inspectable.
- Prefer sparse meaningful connections over raw scale.
- Learning must update general connection/association mechanisms, not apple-specific code.
- Player commands are future motivational/social inputs, not direct motor overrides.
- Genetics will eventually define developmental predispositions, not finished personality.
- Learned memories are not genetically inherited.
- Structural plasticity is future scope unless an active milestone explicitly requires it.

## 9. Behaviour implementation rule

When a desired behaviour is missing, diagnose the missing general mechanism.

Example: if the creature fails to seek shelter when cold, investigate temperature perception, discomfort valuation, shelter memory, affordance knowledge, navigation, or action competition. Do not add `if (cold) seekShelter()` as the default fix.

Innate reflexes are allowed only when explicitly documented as biological reflexes and kept narrow.

## 10. Causal telemetry

Behavioural decisions should be inspectable. Where relevant, telemetry should include:

- external stimuli
- internal biological signals
- active concepts/neurons
- retrieved memories (when memory exists)
- candidate action scores/activations
- selected action
- RNG contribution
- consequence/reward
- learning update

Telemetry must be bounded/configurable so it does not become an unbounded save log.

## 11. Testing requirements

A feature is not done because the UI appears to work.

Use:

- unit tests for mechanisms;
- integration tests for simulation pipelines;
- behavioural tests for learned capability;
- control groups/conditions for claims of learning;
- fixed-seed tests for deterministic scope;
- serialisation round-trip tests;
- long-run/performance tests when complexity warrants them.

For learning claims, compare against an equivalent condition with learning disabled, reward withheld, or experience withheld.

## 12. Definition of done

For simulation work, done means:

1. implemented;
2. tested;
3. behaviourally observable;
4. causally explainable;
5. acceptance criteria demonstrated.

If one is missing, the milestone is not complete.

## 13. M1 forbidden shortcuts

M1 specifically fails if any of the following is the real cause of success:

- apple-specific movement rule;
- direct hunger manipulation by UI;
- scripted eat animation bypassing world interaction;
- reward function directly setting the correct action;
- hard-coded target coordinate supplied as cognitive knowledge;
- learning that cannot be turned off for the control experiment;
- non-serialisable creature/brain state.

## 14. Time and units

Use explicit simulation time. Do not infer all creature age from wall-clock date. Document units for delta time, distance, energy, activation, and rates.

Rendering FPS and simulation update rates are separate concerns.

## 15. Performance discipline

iPhone is the baseline target. Do not prematurely optimise, but avoid designs that require all future creatures/systems to update at render frequency.

Profile before introducing typed-array rewrites, workers, WASM, or GPU compute. Performance work must identify the measured bottleneck it addresses.

## 16. Persistence discipline

Early persistence is local-first behind an abstraction. Never make cloud services a requirement for core simulation.

Long-term saves require schema versions and migration paths. Avoid irreversible format changes without an ADR.

## 17. UI and rendering discipline

The default interface shows the life; laboratory/debug interfaces show machinery.

Do not make UI statistics the authoritative state. Do not invent emotions through animations that are not grounded in simulation variables.

Initial M1 rendering may be extremely simple. Visual polish is not an M1 acceptance criterion.

## 18. IP and naming

The project name is **Creature Life**. New code should use neutral/original terminology such as `Creature` or `Organism`. Do not use another franchise's species names or other distinctive terms.

All final code/assets must be original or appropriately licensed. Do not fetch or reconstruct proprietary source or assets.

## 19. Dependencies

Before adding a dependency, check whether the active milestone truly requires it. For material dependencies, state:

- purpose;
- why existing code/platform APIs are insufficient;
- licence;
- bundle/performance impact;
- long-term architectural impact.

Do not add a state-machine/AI framework that would become the creature's hidden behaviour engine.

## 20. Code quality

- TypeScript strict mode.
- Avoid `any` except at deliberate external boundaries.
- Prefer composition/data over deep inheritance.
- Keep functions/modules cohesive.
- Centralise tunable parameters; avoid unexplained magic numbers.
- Make public interfaces explicit and testable.
- Keep simulation code free from browser globals.
- Preserve readability until profiling justifies specialised representation.

## 21. Git workflow

- Inspect repository and history before editing.
- Run current tests/build before making assumptions.
- Make small coherent changes.
- Include tests in the same change as behaviour.
- Do not perform large unrelated refactors.
- Use clear commit messages such as `feat(brain): implement reward-based weight update`.

## 22. Architecture changes

Before replacing or materially changing brain architecture, persistence model, renderer technology, networking boundary, or simulation semantics:

1. explain the problem;
2. list realistic alternatives;
3. state trade-offs;
4. describe migration/backwards-compatibility impact;
5. recommend one approach;
6. wait for approval;
7. then record an ADR and implement.

## 23. First-entry protocol for Codex

Before coding:

1. read this file;
2. read `docs/TECHNICAL_HANDOFF.md`;
3. read the GDD;
4. read `docs/M1_SPEC.md`;
5. inspect repository tree and Git history;
6. run tests/build;
7. report current architecture, gaps, risks, and proposed M0/M1 plan;
8. wait for approval unless the user explicitly directs implementation.

## 24. Guiding principles

- Earn complexity.
- Fix missing capabilities instead of scripting missing behaviour.
- Emergence must be measurable, not merely believable.
- Aim for coherent surprise.
- Children inherit possibilities, not their parents' lives.
- A population may eventually know things no individual was born knowing.
- Closing the app pauses computation, not history.
- Spend computation only where it can materially affect observable behaviour.
