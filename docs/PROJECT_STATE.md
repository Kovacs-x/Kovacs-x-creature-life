# Creature Life — Project State

**Repository:** Kovacs-x/Kovacs-x-creature-life  
**Current milestone:** None — post-V0 decision phase  
**Last accepted milestone:** V0 — Creature Embodiment Vertical Slice  
**Current phase:** Post-V0 evidence review and next-milestone selection

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

M1 is the accepted adaptive-organism baseline.

### M2 — First Persistent Memory-Guided Creature

Status: formally accepted on 2026-08-15.

M2 established the causal pathway:

past legitimate perception  
→ sensory-derived memory encoding  
→ persistent internal trace  
→ deterministic simulation-time decay  
→ direct perception disappears  
→ recall  
→ distinct remembered-food neural input  
→ weighted neural activation  
→ normal action competition  
→ selected SEEK  
→ recalled direction may guide movement

M2 demonstrated:

- memory originating from legitimate food perception;
- persistent sensory-derived memory traces;
- explicit memory age and confidence;
- deterministic memory decay;
- recall after current food perception disappears;
- strict separation of direct perception and recall;
- strict separation of memory and neural learning;
- remembered-food evidence entering a distinct neural input;
- memory influencing SEEK through weighted neural competition;
- no direct memory-to-SEEK command;
- no direct memory-to-MOVE command;
- remembered-direction movement only after SEEK wins;
- a predefined memory-enabled versus memory-disabled behavioural control;
- a no-prior-perception control;
- stale memory remaining wrong after hidden food relocation;
- no hidden object-ID-to-current-position recall path;
- correction of stale memory by new legitimate perception;
- deterministic forgetting and loss of behavioural influence;
- expired-memory behaviour matching an equivalent memory-disabled control;
- active memory surviving serialization;
- save/reload continuation matching uninterrupted execution;
- deterministic replay of M2 state and telemetry;
- telemetry distinguishing direct perception, memory recall and absence of food evidence;
- telemetry exposing memory encoding, refresh, correction, decay and expiration;
- reuse of the existing stepped episode transition rather than introduction of a third simulation pipeline.

The implementation evidence through M2.9 was committed at:

`9e58b4ac36d1f103b0562cab1d85828743e0309e`

and passed GitHub CI before formal acceptance.

M2.10 included:

- full M1 and M2 validation;
- source inspection for prohibited shortcuts;
- independent adversarial AI review;
- evaluation of the review against the prospectively locked M2 specification and committed tests;
- primary formal audit;
- explicit user acceptance.

The independent reviewer found the architecture sound but raised three evidence objections.

The primary audit determined that none constituted an acceptance failure:

1. the proposed memory-removed primary control was not the prospectively locked Control A; the specification deliberately defined memory-disabled encoding/recall as the primary control and separately defined expired memory as Control C;
2. direction-reversal evidence was already provided by the separately required stale-memory adversarial control;
3. exact forgetting timing was already explicitly tested at the primitive level, with confidence 0.25 recallable at six simulated seconds and expiration occurring at seven simulated seconds.

M2 is therefore accepted within its deliberately narrow claim:

**The Creature possesses primitive persistent sensory-derived memory that can influence later neural competition and behaviour after the originating information leaves current perception.**

This does not establish sophisticated episodic memory, planning, semantic memory or general-purpose navigation.

M2 is now the accepted persistent-memory organism baseline.

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

## 7. Accepted Milestone — M2

M2 is:

**First Persistent Memory-Guided Creature**

Authoritative specification:

docs/M2_SPEC.md

M2 asked:

Can information derived from a legitimate past sensory experience continue to influence the Creature after that information disappears from current perception, without giving the Creature hidden access to world truth?

Accepted causal direction:

past legitimate perception  
→ memory encoding  
→ persistent internal trace  
→ simulation time passes  
→ direct perception disappears  
→ recall  
→ weighted neural activation  
→ normal action competition  
→ memory-influenced behaviour

M2 is formally accepted.

The accepted implementation preserves the distinction between:

current world truth;

current sensory evidence;

persistent memory;

neural activation;

action competition;

physical movement.

The strongest adversarial evidence is the stale-memory experiment.

The Creature first legitimately perceives food east.

While food is occluded, the same food object is secretly moved west.

Before new perception occurs:

- direct food perception is absent;
- memory continues to represent east;
- the diagnostic object identity remains unchanged;
- remembered-food neural activation remains available;
- SEEK must still win ordinary action competition;
- movement continues east;
- the Creature moves farther from the hidden current food position.

This deliberately incorrect behaviour relative to hidden world truth is positive evidence that the Creature is acting from a stale internal representation rather than omniscient access to the current target.

When the relocated food later becomes legitimately visible west:

- current perception points west;
- stale recalled evidence is not double-counted;
- memory is refreshed from the new sensory signal;
- remembered direction changes west;
- later occluded recall also represents west.

Memory therefore can be wrong, can remain wrong, and can later be corrected by legitimate evidence.

Forgetting is also behaviourally meaningful.

At the locked minimum confidence, recall remains usable.

After deterministic decay crosses the threshold:

- the persistent trace expires;
- remembered-food neural activation disappears;
- memory-guided movement stops;
- behaviour matches an otherwise identical memory-disabled control.

The M2 acceptance claim is intentionally narrow.

No stronger cognitive claim should be inferred without later mechanism and evidence.

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

More advanced reversal learning, generalisation and contextual association remain outside accepted M2 scope.

These principles remain constraints on future code that interacts with the accepted memory system.

---

## 9. Locked Prospective M2 Memory Constants

The accepted M2 food-memory implementation uses:

**Initial confidence:** 1.0

**Decay:** 0.125 per simulated second

**Minimum recall confidence:** 0.25

These values were selected before memory was connected to behaviour.

They were not subsequently tuned merely because a behavioural result was inconvenient.

They are not sacred constants.

A future change is permitted if later implementation reveals a genuine mathematical, architectural or design reason.

Any such change must have an explicit documented reason rather than being an undocumented adjustment made to force a behavioural result to pass.

---

## 10. M2 Implementation Record

All stages M2.1 through M2.10 were completed before formal acceptance.

The order below is retained as methodological history because the sequencing itself was part of the evidence.

### M2.1 — Pure memory primitives

Implemented:

FoodPerceptionSignal  
→ memory encoding  
→ FoodMemoryTrace  
→ age and deterministic decay  
→ recall or expiration

Included:

- encoding;
- persistence;
- age;
- confidence;
- deterministic decay;
- recall;
- forgetting.

The primitive mechanism was established independently before behavioural integration.

### M2.2 — Legitimate sensory occlusion

Established:

food physically exists  
but  
direct food perception = null

Occlusion occurs through the real sensory and episode pathway.

Tests do not inject fake remembered direction directly into cognition.

### M2.2A — Behavioural integration contract locked before brain integration

Before remembered information was connected to the neural architecture, behavioural and control integration tests were committed.

They established the required conditions:

- direct food perception absent;
- valid memory-enabled Creature possessing legitimate recall;
- otherwise equivalent memory-disabled control without usable recall;
- recalled information increasing SEEK activation relative to control;
- memory-enabled behaviour producing more remembered-direction movement than control;
- behaviour remaining dependent on normal action competition.

This prospectively defined what successful memory-guided behaviour meant before the brain mechanism was modified to produce it.

### M2.3 — Neural memory integration

Remembered-food information was added as a distinct neural input.

Direct perception and recall remain separate inputs.

Memory contributes through weighted activation.

Memory does not directly command SEEK.

### M2.4 — Memory-guided movement

When SEEK wins:

direct perceived direction available  
→ use direct perceived direction

otherwise:

valid recalled direction available  
→ use recalled direction

Hidden current food coordinates are not supplied to the movement executor.

Movement from recall occurs only after SEEK wins normal action competition.

### M2.5 — Controlled behavioural experiment

The prospectively defined comparison was run between:

memory-enabled Creature

and:

otherwise equivalent memory-disabled Creature

after direct perception disappeared.

The memory-enabled branch demonstrated:

- legitimate recall;
- greater SEEK activation attributable to remembered evidence;
- SEEK winning normal competition;
- greater remembered-direction movement.

The control did not produce equivalent remembered-direction behaviour.

### M2.6 — Stale-memory adversarial test

Scenario:

Creature sees food east  
→ memory represents east  
→ food becomes hidden  
→ same hidden food object moves west

Before re-perception:

memory continues representing east and decays deterministically.

It does not secretly update to west.

The Creature continues moving east when SEEK wins despite the hidden food now being west.

This provides strong evidence that memory is an internal retained representation rather than a hidden current-world lookup.

### M2.7 — Correction

The hidden relocated food becomes legitimately visible west.

New perception refreshes the memory.

Current direct sensory evidence has priority over stale recall.

The corrected persistent memory later recalls west when direct perception is removed again.

### M2.8 — Forgetting

Memory confidence declines through explicit simulation time.

Exactly the minimum confidence remains usable.

After confidence crosses below the threshold, the trace expires.

After expiration:

- recall is absent;
- remembered-food neural activation is absent;
- remembered-direction movement stops;
- behaviour matches an equivalent memory-disabled control.

### M2.9 — Persistence, determinism and telemetry

Established:

- active memory survives save/load;
- resumed execution matches uninterrupted execution;
- memory age, confidence and direction survive serialization;
- deterministic M2 replay;
- deterministic telemetry replay;
- telemetry distinguishes direct perception from recall;
- telemetry exposes memory age and confidence;
- telemetry exposes encoding, refresh, correction, decay and expiration;
- telemetry identifies the information source available to cognition;
- telemetry records normal action competition;
- telemetry identifies the movement direction source.

M2 telemetry is observational.

It operates on consecutive before/after episode states and does not constitute another simulation loop.

### M2.10 — Independent adversarial review and formal audit

Completed:

1. all existing M1 and M2 tests passed;
2. memory-enabled and memory-disabled controls passed;
3. no-prior-perception and expired-memory controls passed;
4. stale-memory and correction adversarial cases passed;
5. implementation was inspected for prohibited shortcuts;
6. a separate frontier AI received the specification, project state, code, tests and evidence;
7. that reviewer attempted to falsify the memory claim;
8. its objections were evaluated against the committed implementation and prospectively locked specification;
9. the primary formal M2 audit found no unresolved acceptance blocker;
10. the user explicitly accepted M2 on 2026-08-15.

M2 is closed.

---

## 11. M2 Scope Boundary

M2 was deliberately narrow.

M2 does not prove:

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

They must not be retroactively attributed to M2 merely because the accepted primitive memory mechanism exists.

---

## 12. Architectural Technical Debt

m1Trial.ts and m1Episode.ts currently contain overlapping M1 execution logic.

This duplication was tolerated during final M1 validation to avoid destabilising accepted behaviour.

M2 did not introduce a third independent simulation pipeline.

M2 behaviour uses the reusable stepped episode transition:

state  
→ one simulation tick  
→ new state

Long-term architecture should continue moving toward this reusable transition model.

Do not perform a large refactor merely for cleanliness unless embodiment or a later mechanism genuinely requires it.

Accepted M1 and M2 behaviour must remain preserved through any later consolidation.

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

## 14. Accepted Milestone — V0 Creature Embodiment Vertical Slice

Status: formally accepted on 2026-08-18.

V0 asked:

**Can the accepted Creature become visible, understandable and worth observing without presentation replacing or falsifying its underlying simulation?**

V0 established the presentation architecture:

simulation state  
→ presentation model  
→ rendering / animation / UI

with no reverse cognitive dependency.

The accepted implementation includes:

- one visible Creature;
- one food object;
- visible habitat bounds;
- a genuine simulation-side sensory occluder;
- deterministic fixed-step Play, Pause and Step controls;
- safe scenario Reset;
- presentation derived from authoritative state;
- locomotion orientation derived from actual displacement;
- state-derived idle, locomotion and eating presentation;
- biological energy and hunger presentation;
- direct-perception and memory-challenge scenario context;
- a bounded developer Why / History inspector;
- deterministic human-readable causal explanations;
- bounded JSON causal-trace export;
- browser and phone-sized presentation.

The sensory occluder is causal rather than decorative.

Creature position  
+ food position  
+ sensory-screen geometry  
→ simulation-side visibility  
→ existing food perception  
→ cognition

The renderer does not decide whether food is perceptible.

The controlled embodied sequence demonstrated:

direct food perception  
→ legitimate memory encoding  
→ environmental occlusion  
→ direct perception absent  
→ usable recall  
→ remembered-food neural activation  
→ normal SEEK competition  
→ remembered-direction movement  
→ direct perception restored  
→ legitimate eating and reward

Why / History telemetry agreed with the visible behaviour.

The browser controller does not directly command SEEK, MOVE or EAT.

Reset restores a fresh predefined authoritative scenario and clears browser diagnostic history without executing a Creature simulation tick.

The formal V0 audit found AC1 through AC15 satisfied.

No prohibited V0 presentation/cognition shortcut was found.

### V0 human evaluation

The first human evaluation was conducted with Why / History initially hidden.

Findings:

**Legibility:** successful.

The visible sequence was understandable and was not reported as misleading or unclear.

**Agency:** weak.

Although behaviour was genuinely produced by the simulation, the short deterministic sequence felt like a scripted demonstration because repeated runs produced the same visible outcome.

**Attachment:** absent at this stage.

Creature-1 still felt primarily like an anonymous test object rather than an individual the observer wanted to preserve or continue following.

**Individual replaceability:** high.

Replacing Creature-1 with an otherwise equivalent fresh Creature would not currently feel like a meaningful loss.

**Primary design signal:**

The embodied Creature needs greater opportunity for genuine behavioural divergence and accumulated individual history, and its visible embodiment should become more creature-like.

This does not justify:

- random cosmetic surprises;
- scripted personality;
- fabricated emotions;
- canned autonomous-looking actions;
- arbitrary stochastic behaviour added solely to appear alive.

Future variation must arise from legitimate simulation mechanisms and use seeded randomness where stochasticity is introduced.

V0 therefore succeeded as an embodiment experiment while revealing that causal correctness and legibility alone are not sufficient to create perceived agency, attachment or meaningful individuality.

The next formal milestone is intentionally not selected yet.

It must be chosen from the V0 evidence rather than automatically continuing a predetermined sequence of headless cognitive milestones.

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

This is not a V0 prerequisite unless embodiment work demonstrates a concrete need for it.

It becomes more important as persistent interactive experiences grow longer and harder to reproduce.

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

This was not part of M2.

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

V0 was formally accepted on 2026-08-18.

Current work is:

accepted V0 baseline  
→ authoritative V0 acceptance record  
→ clean GitHub / CI baseline  
→ post-V0 evidence review  
→ choose next formal milestone  
→ write its prospective specification  
→ implementation only after the specification is locked

The post-V0 review must begin from the evidence actually produced by embodiment.

Primary findings to investigate:

- behaviour is causally genuine but currently feels too deterministic and repetitive;
- the Creature currently shows weak perceived agency;
- attachment has not yet emerged;
- the individual currently feels highly replaceable;
- the abstract circular embodiment contributes to weak creature identity;
- genuine behavioural divergence and accumulated history appear more important than additional explanation tooling;
- environmental opportunity and cognitive capability should continue to co-develop.

Do not solve these findings by adding fake autonomous behaviour, unsupported emotions or presentation-only personality.

Possible future mechanisms may include seeded behavioural variation, richer environmental choice, persistent consequences, richer individual history or improved creature embodiment.

These are candidates, not yet accepted requirements.

The next milestone must define a falsifiable mechanism and acceptance experiment before implementation begins.

---

## 31. Manual Validation Workflow

For manual development:

First run:

npm run typecheck

Then run:

npm test

When both pass, commit with a concise message.

The user may simply report that both passed rather than pasting successful output.

When the user says a commit was pushed, verify the exact GitHub commit and CI before continuing.

After a pushed change is verified and CI succeeds, continue immediately with concrete next implementation steps rather than stopping at a description of the next phase.

GitHub CI independently reruns validation after pushes.

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