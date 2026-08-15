# Creature Life — Project State

**Repository:** Kovacs-x/Kovacs-x-creature-life  
**Current milestone:** M2 — First Persistent Memory-Guided Creature  
**Last accepted milestone:** M1 — First Adaptive Creature  
**Current phase:** Workflow hardening before M2 implementation

---

## 1. Purpose

This file records the current authoritative project state.

It exists so future ChatGPT chats, coding agents, independent AI reviewers and human contributors do not have to reconstruct current truth from old conversations.

Use project sources in this order:

1. current committed GitHub code and tests;
2. docs/PROJECT_STATE.md for current project and milestone status;
3. the current milestone specification;
4. formally accepted milestone evidence;
5. technical and design documentation;
6. conversations as historical context only.

Old chat versions of source files are not authoritative when GitHub can be inspected.

If project sources conflict, repair or document the discrepancy rather than silently choosing whichever version is convenient.

---

## 2. Project Goal

Creature Life is a long-term artificial-life game.

The goal is to create persistent individual Creatures whose behaviour emerges from interacting internal systems such as:

- perception;
- biology;
- neural learning;
- memory;
- drives;
- development;
- environmental experience;
- relationships;
- communication;
- genetics;
- culture.

Behaviour should emerge through reusable mechanisms rather than increasingly large collections of scripted behavioural rules.

Creature Life ultimately has two separate success questions.

### Artificial-life success

Do internal mechanisms produce adaptive, coherent and surprising behaviour?

### Game success

Does the player understand, influence and care about the Creature?

Creature Life ultimately requires both.

---

## 3. Core Engineering Principles

The simulation should remain:

- deterministic where intended;
- serializable;
- inspectable;
- presentation-neutral;
- driven by explicit simulation time;
- reproducible through seeded randomness when stochastic behaviour is introduced.

Simulation state is authoritative.

UI, rendering and animation may represent simulation state.

They must not secretly determine cognition, biology, learning or memory.

Preferred causal architecture:

world truth  
→ sensory transformation  
→ internal state  
→ cognition  
→ action competition  
→ physical consequence  
→ biological consequence  
→ learning and/or memory

Avoid:

- hidden behavioural finite-state-machine shortcuts;
- omniscient world access;
- target-coordinate shortcuts;
- direct UI commands into cognition;
- test-only behavioural hacks;
- LLM-generated Creature actions;
- arbitrary tuning solely to force acceptance results.

Do not accept behaviour merely because it appears intelligent.

---

## 4. Milestone Status

### M0 — Foundation

Status: completed.

M0 established:

- explicit simulation time;
- deterministic seeded RNG;
- serializable simulation state;
- world and Creature contracts;
- headless simulation;
- TypeScript type checking;
- automated tests;
- separation of simulation from presentation.

### M1 — First Adaptive Creature

Status: formally accepted.

M1 established the causal pathway:

world truth  
→ sensory transformation  
→ biological hunger  
→ weighted neural network  
→ IDLE / SEEK / EAT competition  
→ action  
→ biological consequence  
→ reward  
→ eligibility-based neural plasticity  
→ changed neural weights  
→ changed later behaviour

M1 demonstrated:

- sensory-derived food perception;
- hunger and time-dependent metabolism;
- weighted connectionist cognition;
- generic action competition;
- bounded movement;
- contact-based eating;
- biological energy restoration;
- reward derived from biological improvement;
- neural eligibility;
- cross-tick credit assignment;
- reward-modulated learning;
- trained behaviour differing from a learning-disabled control;
- deterministic replay;
- seeded and restorable RNG;
- meaningful serialization;
- behavioural telemetry;
- save/reload learning continuity;
- rejection of stale hidden food targets.

M1 is now the accepted adaptive-organism baseline.

---

## 5. Important M1 Methodological Notes

The harder learning probe remained fixed.

Two rewarded training experiences initially did not cross the behavioural threshold.

After the credit-assignment mechanism was corrected, three rewarded experiences produced the required behavioural change.

The probe itself was not moved merely to force a pass.

This history must remain visible.

Current M1 Creature behaviour is mostly deterministic.

Future stochastic mechanisms such as exploration, mutation, attention variability or probabilistic action selection must use the seeded simulation RNG.

Current serialization is meaningful within prototype scope.

Save validation, schema migration and compatibility testing will require further hardening as the simulation becomes more complex.

---

## 6. M1 Adversarial Evidence

### Stale-target rejection

The Creature:

1. legitimately perceived food;
2. selected SEEK through normal neural competition;
3. began approaching;
4. then experienced an external world change where the food became unavailable before arrival.

On the next tick:

- food perception became null;
- the Creature did not continue following a hidden target coordinate;
- SEEK lost perceptual support;
- stale target information did not cause further target-following movement.

This provides evidence against hidden omniscient target tracking.

### Save/reload learning continuity

The Creature:

1. selected SEEK;
2. generated neural eligibility;
3. moved toward food;
4. was saved before receiving the delayed eating reward;
5. was reloaded;
6. later ate;
7. received biological reward.

The pre-save SEEK pathway was reinforced after reload.

The resumed final state matched uninterrupted execution.

This demonstrates that meaningful transient neural credit can cross a persistence boundary.

---

## 7. Current Milestone — M2

M2 is:

**First Persistent Memory-Guided Creature**

Authoritative specification:

docs/M2_SPEC.md

M2 asks:

Can information derived from a legitimate past sensory experience continue to influence the Creature after that information disappears from current perception, without giving the Creature hidden access to world truth?

Required causal direction:

past legitimate perception  
→ memory encoding  
→ persistent internal trace  
→ simulation time passes  
→ direct perception disappears  
→ recall  
→ weighted neural activation  
→ normal action competition  
→ memory-influenced behaviour

M2 is active.

No M2 cognitive implementation has yet been accepted.

---

## 8. M2 Locked Principles

Memory must originate from legitimate perception.

Memory encoding must not independently inspect hidden target coordinates.

Direct perception and recall must remain distinct.

Memory and neural learning must remain distinct.

Memory must:

- persist across simulation ticks;
- age through explicit simulation time;
- decay deterministically;
- eventually become unusable;
- be capable of becoming stale;
- be capable of becoming wrong;
- be corrected by new legitimate perception;
- survive meaningful save/load;
- be inspectable through telemetry.

Cognitive memory must not contain exact hidden target coordinates equivalent to:

- targetX;
- targetY;
- foodWorldPosition;
- lastKnownExactFoodPosition.

Object IDs may exist for diagnostics.

Object IDs must never be used during recall to retrieve hidden current target position.

Memory must not directly issue SEEK, MOVE or EAT.

Required behavioural route:

memory recall  
→ weighted neural input  
→ action activations  
→ generic competition  
→ selected action

M2 must demonstrate genuine forgetting.

Permanent perfect storage is insufficient.

More advanced reversal learning, generalisation and contextual association are important future questions but remain outside M2.

---

## 9. Locked Prospective M2 Memory Constants

The first M2 food-memory implementation begins with:

**Initial confidence:** 1.0

**Decay:** 0.125 per simulated second

**Minimum recall confidence:** 0.25

These values were selected before memory was connected to behaviour.

They must not be changed merely because a later behavioural result is inconvenient.

They are not sacred constants.

A change is permitted if implementation reveals a genuine mathematical, architectural or specification problem.

Any such change must have an explicit documented reason rather than being an undocumented adjustment made to force an acceptance test to pass.

---

## 10. M2 Implementation Order

### M2.1 — Pure memory primitives

Implement:

FoodPerceptionSignal  
→ memory encoding  
→ FoodMemoryTrace  
→ age and deterministic decay  
→ recall or expiration

Includes:

- encoding;
- persistence;
- age;
- confidence;
- deterministic decay;
- recall;
- forgetting.

No brain integration yet.

No behavioural change yet.

Unit tests must establish the primitive mechanism independently.

### M2.2 — Legitimate sensory occlusion

Establish:

food physically exists  
but  
direct food perception = null

Occlusion must occur through the real sensory and simulation pathway.

Tests must not inject fake memory or fake remembered direction directly into cognition.

### M2.2A — Lock behavioural integration tests before brain integration

Before remembered information is connected to the neural architecture, commit the behavioural and control integration tests that define the expected observable M2 difference.

These tests should express behavioural and causal outcomes rather than arbitrary exact internal activation numbers.

They should establish conditions equivalent to:

- direct food perception is absent;
- a valid memory-enabled Creature possesses legitimate recall;
- an otherwise equivalent memory-disabled control does not;
- recalled information increases SEEK activation relative to control;
- memory-enabled behaviour produces more remembered-direction movement than control;
- behaviour still depends on normal action competition.

The tests should define what successful memory-guided behaviour means before implementation is adjusted to produce it.

They should not prematurely dictate unnecessary internal implementation details.

### M2.3 — Neural memory integration

Add remembered-food information to the neural architecture.

Direct perception and recall remain separate inputs.

Memory influences weighted activation.

Memory does not directly command SEEK.

### M2.4 — Memory-guided movement

If SEEK wins:

direct perceived direction available  
→ use direct perceived direction

otherwise:

valid recalled direction available  
→ use recalled direction

Hidden current food coordinates must never be used.

Movement from recall occurs only after the corresponding action wins normal competition.

### M2.5 — Controlled behavioural experiment

Run the already-defined comparison between:

memory-enabled Creature

and:

otherwise equivalent memory-disabled Creature

after direct perception disappears.

Primary evidence includes:

- greater SEEK activation attributable to memory;
- remembered-direction movement attributable to memory.

### M2.6 — Stale-memory adversarial test

Scenario:

Creature sees food east  
→ memory represents east  
→ food becomes hidden  
→ hidden food moves west

Before re-perception:

memory must continue representing east, or a deterministically decayed form of east.

It must not secretly update to west.

Passing this provides evidence that memory is an internal retained representation rather than hidden current-world lookup.

M2 should still be described conservatively as primitive persistent sensory-derived memory.

Passing this test alone does not justify claiming a sophisticated episodic-memory architecture.

### M2.7 — Correction

Food becomes legitimately visible west.

New perception must correct or refresh stale memory.

Valid current sensory evidence must be capable of overriding contradictory stale memory.

### M2.8 — Forgetting

Memory confidence declines through simulation time.

Eventually recall stops.

Expired-memory behaviour should approach the equivalent memory-disabled control.

### M2.9 — Persistence, determinism and telemetry

Prove:

- active memory survives save/load;
- resumed execution matches uninterrupted execution;
- deterministic replay;
- telemetry distinguishes direct perception from recall;
- telemetry exposes memory age and confidence;
- telemetry identifies which information source influenced behaviour.

### M2.10 — Independent adversarial review and formal audit

When M2 appears complete:

1. run all existing M1 and M2 tests;
2. run memory-enabled and memory-disabled controls;
3. run no-prior-perception and expired-memory controls;
4. run stale-memory and correction adversarial cases;
5. inspect for prohibited shortcuts;
6. give a separate frontier AI the specification, project state, relevant code, tests and evidence;
7. ask that AI to attempt to falsify the memory claim;
8. evaluate its criticism against actual code and experiments;
9. conduct the primary formal M2 audit;
10. require explicit user acceptance before closing M2.

Do not begin the next milestone merely because the Creature appears to remember something.

---

## 11. What M2 Will Not Expand Into

M2 remains deliberately narrow.

M2 does not need to prove:

- sophisticated episodic memory;
- contextual associative reversal learning;
- broad generalisation;
- semantic memory;
- language;
- player teaching;
- social memory;
- multiple-Creature cognition;
- genetics;
- autobiographical memory;
- general-purpose navigation;
- planning;
- tool use.

These may become important later.

They must not be added to M2 solely because they are interesting.

---

## 12. Architectural Technical Debt

m1Trial.ts and m1Episode.ts currently contain overlapping M1 execution logic.

This duplication was tolerated during final M1 validation to avoid destabilising accepted behaviour.

M2 must not introduce a third independent simulation pipeline.

Long-term architecture should move toward:

state  
→ one simulation tick  
→ new state

Do not perform a large refactor during early M2 merely for cleanliness unless current duplication genuinely blocks correct implementation.

---

## 13. Multi-AI Development Strategy

This ChatGPT Project is the primary architecture and planning context.

### Primary AI role

Primary responsibilities include:

- architecture;
- artificial-life mechanism design;
- milestone specifications;
- experimental design;
- implementation sequencing;
- sensitive incremental code;
- debugging;
- evidence review;
- milestone audits.

### Coding-agent role

A repository-aware coding agent should be introduced when changes become broad enough that manual file-by-file implementation becomes inefficient.

Suitable coding-agent work includes:

- multi-file refactors;
- repository-wide migrations;
- large mechanical test changes;
- shared simulation-loop consolidation;
- implementation of already-agreed architecture.

Coding agents should not automatically determine Creature Life architecture.

### Independent adversarial AI role

At milestone completion, a separate frontier AI may receive:

- milestone specification;
- PROJECT_STATE.md;
- relevant source;
- relevant tests;
- milestone evidence.

Its job is to try to falsify the milestone claim.

It should search for:

- hidden shortcuts;
- invalid controls;
- world-state leakage;
- circular tests;
- persistence defects;
- causal ambiguity;
- regressions.

Agreement between multiple AIs is not evidence by itself.

Prefer:

mechanism  
+ tests  
+ controls  
+ adversarial cases  
+ telemetry  
+ reproducibility

---

## 14. Post-M2 Decision — V0 Embodiment

After M2 is formally accepted, Creature Life will not automatically continue through many additional headless cognitive milestones.

The next formal phase should be:

**V0 — Creature Embodiment Vertical Slice**

V0 moves the accepted organism into a minimal visible and interactive habitat.

V0 should prioritise:

- legibility;
- agency;
- attachment;
- causal fidelity;
- useful interaction;

rather than production-quality graphics.

Simulation remains authoritative.

Required direction:

simulation state  
→ presentation  
→ animation

Never:

animation or UI  
→ hidden cognitive decision

---

## 15. V0 Scope

The first embodiment slice should remain deliberately small.

Initial target:

- one Creature;
- food;
- simple habitat boundaries;
- one static obstacle or occluder;
- basic camera and interaction sufficient to observe the Creature;
- state-driven visual presentation;
- developer Why/History inspection.

The first V0 does not require a manipulable object.

Manipulable objects should be introduced later as an explicit mechanism when there is a concrete experiment requiring them.

Do not silently implement automatic carry-on-contact or similar shortcuts merely to make objects appear interactive.

V0 does not initially require:

- a second Creature;
- full rigid-body physics;
- pushing;
- carrying;
- stacking;
- throwing;
- heating/cooling;
- complex object categories;
- tool-use tests.

These capabilities should be introduced only when the relevant perception, motor and cognitive mechanisms exist.

---

## 16. Environmental and Cognitive Co-Development

Rich emergence requires more than neural complexity.

Long-term emergence depends on interaction between:

- cognition;
- perception;
- action capability;
- environmental affordances;
- persistent consequences;
- learning;
- memory.

A sophisticated Creature in an empty environment has little opportunity to produce interesting behaviour.

A complex world is equally unhelpful if the Creature cannot perceive or act on its relevant affordances.

After V0, development should increasingly alternate between cognitive capability and environmental opportunity.

Examples:

memory  
↔ persistent objects and occlusion

affordance learning  
↔ movable or blocking objects

planning  
↔ multi-step environmental problems

social cognition  
↔ multiple individuals

communication  
↔ teaching and shared attention

tool learning  
↔ consistent manipulable object physics

Do not build increasingly complex brains in an empty box.

Do not build increasingly complex physics that the Creature has no mechanism to use.

---

## 17. V0 Evaluation Criteria

V0 should answer four distinct questions.

### Legibility

Can the player approximately understand what the Creature is doing and what condition it is in?

### Agency

Does behaviour feel as though it belongs to the Creature rather than being a canned animation directly triggered by the player?

### Attachment

Does the player care about this particular individual and want to observe or interact with it again?

### Individual replaceability

Would replacing this Creature with an otherwise identical new Creature feel like losing something meaningful?

This is useful because Creature Life's central value depends partly on an individual's accumulated history becoming significant.

Do not adopt an arbitrary percentage threshold for commercial success at this stage.

Use several qualitative and quantitative signals rather than a single hypothetical death question.

Useful future user-testing questions include:

- Do you want to check on this Creature again?
- Did anything it did feel specific to its own history?
- Would an identical fresh Creature feel like the same individual?
- Did you ever want to help or interact without being prompted?
- Were you curious about what it might do next?
- Could you usually tell why it behaved as it did?

Creature Life ultimately needs:

legibility  
+ agency  
+ attachment  
+ meaningful individuality

---

## 18. First-Session Principle

The first minutes of the eventual game should expose genuine responsiveness quickly.

Do not create fake advanced abilities simply to make onboarding exciting.

Avoid scripted:

- instant name comprehension;
- artificial affection;
- fake player recognition;
- fake memory;
- fake panic;
- fake intelligence.

Instead, design early situations that reveal genuine mechanisms clearly.

For example:

hunger  
→ perception  
→ seeking  
→ eating

and later:

perception  
→ occlusion  
→ memory  
→ remembered searching

The scenario may be deliberately designed for clarity.

The Creature's response must remain causally genuine.

---

## 19. Presentation and Visual Enrichment

Visual enrichment is allowed and desirable.

Presentation does not need neural control over every blink, breath or idle motion.

Examples of legitimate presentation include:

- breathing;
- blinking;
- subtle idle movement;
- gaze/orientation;
- locomotion animation;
- expressive posture derived from real state.

Presentation may enrich the visible organism.

Presentation must not manufacture false cognitive evidence.

Good:

Creature is idle  
→ natural idle animation

Good:

Creature genuinely remembers food east  
→ presentation reflects eastward attention or searching

Bad:

Creature has no fear state  
→ terrified animation added solely for drama

Bad:

Creature remembers nothing  
→ purposeful search animation added to make it appear intelligent

Real internal state should increasingly have readable outward consequences.

Animation should communicate the simulation rather than replace it.

---

## 20. Emotional Presentation

Examples of future state-driven presentation may include:

- hunger affecting searching or posture;
- fatigue affecting movement;
- fear affecting avoidance;
- uncertainty affecting behaviour;
- relief following resolution of biological stress.

These should only be used when corresponding internal mechanisms genuinely exist.

Creature Life must not fabricate distress solely to manipulate attachment, retention or monetisation.

Dramatic tension should increasingly arise from real biological, cognitive and environmental consequences.

---

## 21. Why / History Inspector

V0 should begin a developer-facing Why/History inspector based on recorded causal telemetry.

It should help answer:

- what did the Creature perceive?
- what was its biological state?
- what did it remember?
- how old and confident was the memory?
- which action candidates competed?
- which action won?
- what information source guided movement?
- what consequence occurred?
- what learning happened?

The developer version may expose raw values.

A later player-facing version may translate evidence into readable language such as:

"The Creature is hungry and appears to remember finding food in this direction."

Explanations must come from recorded causal evidence.

They must not be invented after the fact.

---

## 22. Bounded Telemetry Export

During V0, the developer Why/History tooling should support exporting a bounded machine-readable causal trace.

The trace may represent:

- a selected episode;
- a selected interval;
- a recent bounded telemetry window.

It should not require permanently storing every simulation detail.

The purpose is to compare:

what the player believed happened

with:

what the simulation records actually caused.

Example use:

Player interpretation:

"The Creature was searching for remembered food."

Trace evidence might show:

- direct perception absent;
- active food memory;
- memory confidence above threshold;
- remembered direction;
- elevated SEEK activation;
- SEEK selected;
- movement source = memory.

If player interpretation and causal trace agree, visual communication is working.

If the player perceives intentional memory-guided behaviour but the trace shows unrelated wandering, presentation is misleading.

The exact export duration should not be arbitrarily fixed to 60 seconds.

It should be bounded and useful for the experiment being investigated.

---

## 23. Biography and Experience History

Long-term Creature Life should preserve important individual history such as:

- birth;
- significant learning;
- important memories;
- discoveries;
- frightening experiences;
- relationships;
- communication milestones;
- unusual habits;
- illness and recovery;
- offspring;
- death and legacy.

Do not store every micro-event forever at full resolution.

Important history should eventually be selected, compressed and made inspectable.

The purpose is to allow the biography of an individual to become meaningful rather than merely accumulating logs.

---

## 24. Experience Replay — Future Requirement

As emergent behaviour becomes more complex, debugging should eventually support reconstruction of significant experience histories.

Potential model:

initial checkpoint  
+ deterministic seed  
+ ordered external events  
= reproducible experience stream

External events may eventually include:

- player placed food;
- player moved an object;
- visibility changed;
- environmental event occurred;
- player interaction occurred.

This is not an early M2 task.

It becomes more important during or after embodiment.

---

## 25. Performance Strategy

Creature Life ultimately targets mobile hardware.

Do not prematurely optimise hypothetical bottlenecks.

During V0, measure:

- simulation tick duration;
- cognition evaluation time;
- rendering frame time;
- memory allocation;
- save size;
- later battery and thermal behaviour.

Possible future techniques include:

- multi-rate subsystem updates;
- background or worker execution;
- batching;
- reduced cognition frequency;
- simulation fidelity tiers.

Use these when profiling demonstrates a need.

Do not implement them merely because they are theoretically plausible.

---

## 26. Important Future Cognitive Questions

After V0, choose the next cognitive milestone partly based on what embodiment reveals is missing.

Important future areas include:

- generalisation;
- reversal learning;
- richer drives;
- object and category representation;
- affordance learning;
- teaching;
- social interaction;
- richer memory;
- primitive prediction and planning.

Do not lock their order prematurely.

### Generalisation

A future experiment should determine whether learned behaviour transfers beyond the exact training condition.

### Reversal learning

A future experiment may determine whether previously learned associations can change when consequences change.

This is not part of M2.

### Affordance learning

Future Creatures should increasingly learn what objects permit through consistent physical consequences rather than hard-coded TOOL labels.

### Teaching

Player teaching is strategically important because it may become a strong emotional interaction loop.

Teaching must not be faked simply to produce an impressive demonstration.

The project should eventually find the smallest legitimate mechanism through which the player can teach the Creature something.

### Multiple Creatures

Social interaction is important.

Do not introduce a second Creature merely because social systems appear on the long-term roadmap.

First establish that one embodied Creature is understandable, autonomous and compelling.

---

## 27. Commercial Direction

Do not treat AI-generated popularity scores, sales estimates or revenue forecasts as project facts.

Creature Life does not yet have sufficient evidence for credible unit-sales or revenue predictions.

Future commercial decisions should use evidence such as:

- playable prototype feedback;
- retention;
- audience research;
- wishlist or interest data;
- pricing tests;
- production costs;
- marketing evidence;
- platform discussions.

Creature Life should be capable of functioning as a premium independent product.

Publisher, subscription or platform deals are optional opportunities rather than dependencies.

Potential platform opportunities may be evaluated before broad commercial release where relevant, but no platform deal should be assumed in the core business plan.

---

## 28. Monetisation Principle

Core Creature cognition, learning, memory, biology, welfare and fundamental raising belong in the core game.

The Creature must never become a hostage to payment.

A preferred future expansion direction is world and environmental breadth, such as:

- new biomes;
- new ecosystems;
- meaningful systemic objects;
- exploration regions;
- habitat themes;
- substantial world expansions.

Conceptually:

core Creature mind and welfare  
= core game

new systemic worlds and environments  
= possible expansion content

Avoid monetising emotional vulnerability through:

- paid resurrection;
- required premium medicine;
- required premium food;
- paid intelligence;
- paid fertility or longevity;
- fabricated distress;
- subscription punishment.

Attachment should be protected rather than exploited.

Long-lived Creature histories should eventually have robust backup and recovery.

---

## 29. Commercial Discovery Checkpoint

After V0, conduct a deliberate product and commercial review before committing to a much larger production build.

Evaluate:

- Is the Creature understandable?
- Does it feel autonomous?
- Do players care about the individual?
- Does the individual feel replaceable?
- Is the first-session experience compelling?
- Which interactions do players want more of?
- Is the Why/History feature useful?
- Is the visual identity strong enough?
- Is iOS, Steam or both the right direction?
- Is premium pricing plausible?
- Are platform or publisher discussions worth pursuing?
- Which future systems create genuine player value?

Commercial strategy should follow evidence from the playable Creature.

---

## 30. Current Immediate Sequence

Current work is:

PROJECT_STATE.md  
→ GitHub CI  
→ fresh M2 implementation chat  
→ M2.1 food-memory primitives

Exact sequence:

1. save this file as docs/PROJECT_STATE.md;
2. run npm run typecheck;
3. run npm test;
4. commit and push PROJECT_STATE.md;
5. verify the GitHub commit;
6. add a minimal GitHub Actions CI workflow;
7. push the CI change;
8. verify GitHub CI runs successfully;
9. create a new Project chat called Creature Life — M2 Implementation;
10. the new chat reads PROJECT_STATE.md and M2_SPEC.md and inspects current GitHub source and tests;
11. implement M2.1 memory primitives;
12. implement M2.2 legitimate sensory occlusion;
13. commit the predefined M2 behavioural/control integration tests before neural memory integration;
14. implement M2.3 and M2.4;
15. complete controls, adversarial tests, forgetting, persistence, determinism and telemetry;
16. conduct independent adversarial review;
17. formally audit M2;
18. require explicit M2 acceptance;
19. after acceptance, begin V0.

Do not start M2 implementation before the lightweight workflow transition is complete.

---

## 31. Manual Validation Workflow

For manual development:

First run:

npm run typecheck

Then run:

npm test

When both pass, commit with a concise message.

When the user says a commit was pushed, verify GitHub before continuing.

Once CI is active, GitHub should independently rerun the validation.

---

## 32. Current Source-of-Truth Rule

If project sources disagree, resolve current implementation and status in this order:

1. current committed GitHub code and tests;
2. docs/PROJECT_STATE.md for current milestone and project state;
3. the current milestone specification;
4. formally accepted milestone evidence;
5. technical and design documentation;
6. old conversations as historical context only.

If a discrepancy is discovered, repair or document it.

Do not silently choose whichever version is most convenient.