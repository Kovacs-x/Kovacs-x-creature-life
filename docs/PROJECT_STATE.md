# Creature Life — Project State

**Repository:** Kovacs-x/Kovacs-x-creature-life  
**Current milestone:** M3 — First Autonomous Experience-Shaped Creature  
**Last accepted milestone:** V0 — Creature Embodiment Vertical Slice  
**Current phase:** M3.11 complete (initial evaluation plus the M3.11R follow-up browser evaluation); M3.12 — Formal Audit is next; M3 remains active and NOT accepted.

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

### M3 — First Autonomous Experience-Shaped Creature

Status: prospectively accepted on 2026-08-18 and currently active.

Authoritative specification:

`docs/M3_SPEC.md`

Implementation is underway and committed through M3.9B2, followed by a regression fix.

Per the source-of-truth rule in Section 1 above, current committed GitHub code and tests outrank this section's prior stale "implementation not yet begun" text; that text was corrected here rather than left to mislead future readers.

Committed implementation stages include exploration pressure, seeded exploratory movement, neural EXPLORE integration, environmental discovery, the experience-acquisition experiment, the standardized individuality probe, player food-world interaction, Creature presentation and persistent life history, and browser embodiment integration.

Browser embodiment exposed a genuine SEEK overshoot edge case, in which repeated full-distance SEEK steps could oscillate across arbitrary player-positioned food without ever entering the interaction radius. This was fixed by clamping SEEK movement to the legitimately perceived sensory distance rather than always travelling the full locked move distance, using only existing legitimate direction/distance evidence already available to cognition.

M3.10 — Determinism, Persistence and Telemetry is now active. M3.10A (authoritative run persistence and deterministic save/reload continuation) is committed. M3.10B (complete observational causal telemetry and RNG-isolation evidence) is committed as the current completed technical substep.

M3.10's technical determinism/persistence/telemetry evidence is complete if and only if the M3.10A and M3.10B required automated tests pass; that evidence is not itself a claim of milestone acceptance.

The initial M3.11 (behavioural and human evaluation) was conducted against the browser-embodied Creature. Causal exploration and target independence passed: exploration was causally genuine, hidden food relocation did not alter the deterministic route, wandering → perception → SEEK → EAT was understandable, and target independence was demonstrable. However, the human/product evaluation showed insufficient directional improvement in agency and meaningful individuality, alongside further weak areas: perceived autonomy, similarity across repeated runs, exploration reading as demonstration-like rather than lived, unclear meaning of the life-history record, and learning being invisible to the observer.

Persistent play additionally exposed a genuine action-liveness defect, distinct from the weak-area findings above: repeated legitimate feeding can legitimately strengthen a contact-independent learned connection (e.g. hunger-to-eat) through the same accepted reward-modulated plasticity rule used throughout M1/M3, until that action's activation exceeds every other candidate even when no physically supported opportunity exists for it. Because an unsuccessful action produces no reward, the state becomes a permanent fixed point: a learned but currently infeasible action monopolizes ordinary neural competition and physical displacement stops indefinitely. This is a liveness defect in the persistent-play architecture, not an artifact of any individual accepted M1/M2/M3 mechanism.

M3.11R — Integrated Persistent Creature was triggered as a corrective integration substep addressing both findings. It integrates the already-accepted M1 learning, M2 food memory, M3 exploration, biology, player food relocation and life-history persistence into one continuing browser Creature, reusing the existing M2 memory primitives and the single authoritative M3 tick (no second simulation loop); the locked controlled M3 acquisition experiment remains memory-disabled by default and its causal claim is unchanged, while only the browser Creature enables food memory. M3.11R also corrects the persistent-play action-liveness defect by adding an explicit, legitimate-evidence-only action-feasibility gate to the generic M3 action competition (SEEK feasible only with a direct-perception or usable M2-recall direction; EAT feasible only with genuine food contact); this does not force a fallback action or hide any learned activation, it only restricts which candidate may win the same generic deterministic competition. No locked M3 seed, weight, learning rate or other constant was tuned to force a result. M3.11R is committed.

The M3.11R follow-up human evaluation is complete. M2 food memory became visibly meaningful in ordinary persistent play: legitimate perception formed memory; after player relocation behind occlusion the Creature initially acted according to the stale previous direction; that influence decayed deterministically; and ordinary exploration resumed. The observer raised a concern that relocated food appeared to be found faster than in the earlier browser build, but source inspection and direct observation found no evidence of hidden target knowledge: EXPLORE still has no food, perception, memory or hidden-coordinate input, and visible lock-on occurred only after direct food perception became available. The persistent-play liveness correction also held: continued movement and exploration occurred without reproducing the former permanent action stall.

Life History recorded a genuine reward-driven learning event that changed six neural connection weights. The read-only standardized learning diagnostic showed Fresh equivalent = IDLE and Current learned state = IDLE while confirming that the connection weights differed from a fresh brain. This particular continuing Creature had therefore accumulated learned neural differences, but those differences had not crossed the standardized behavioural threshold at the time inspected; this browser observation is not evidence of fresh-versus-learned behavioural divergence. The prospectively controlled Branch A/B standardized probe remains the evidence for the central M3 causal learning claim. Overall, M3.11 showed genuine directional experiential improvement after M3.11R, particularly through visible memory/history and restored persistent autonomy, while strong attachment and strong perceived individuality remain unestablished. M3.11 is complete and M3.12 is the next outstanding step.

No formal M3 acceptance has occurred. M3 remains active and not accepted.

M3 was selected from the evidence produced by V0 rather than from a predetermined cognitive milestone sequence.

V0 showed that the Creature's behaviour was genuine and understandable but still felt:

- too deterministic;
- too repetitive;
- weakly autonomous;
- highly replaceable;
- insufficiently shaped by visible individual history.

M3 therefore asks:

**Can an embodied Creature autonomously explore through seeded stochastic behaviour, encounter different legitimate experiences, and carry consequences of those experiences forward so that its later behaviour becomes meaningfully shaped by its own history?**

The central M3 causal claim is:

different legitimate experience histories  
→ different persistent internal state  
→ same later controlled situation  
→ different behaviour

M3 must not be accepted merely because:

- the Creature moves unpredictably;
- different RNG seeds produce different paths;
- the Creature appears more lively;
- presentation creates the impression of individuality.

M3 requires evidence that legitimate differences in lived experience create persistent internal differences that later alter behaviour under controlled equivalent conditions.

M3 remains active until its specification, controls, adversarial tests, persistence evidence, telemetry, human evaluation and formal audit are completed and the user explicitly accepts the milestone.

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

At V0 acceptance, the next formal milestone was intentionally left unselected.

It was to be chosen from the V0 evidence rather than automatically continuing a predetermined sequence of headless cognitive milestones.

The subsequent post-V0 evidence review selected M3 — First Autonomous Experience-Shaped Creature.

M3 was chosen specifically to address:

- deterministic and repetitive visible behaviour;
- weak perceived agency;
- high individual replaceability;
- insufficient opportunity for accumulated experience to make one Creature's future differ from another's.

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

M3 follows this principle by pairing a new autonomous exploration mechanism with only the minimum additional environmental opportunity needed for that exploration to have legitimate consequences.

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

M3 adds a further legitimate candidate sequence:

internal exploration pressure  
→ EXPLORE competition  
→ autonomous movement  
→ legitimate discovery  
→ normal perception  
→ consequence  
→ learning

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

M3 should extend causal inspection so it can also answer:

- what was the Creature's exploration pressure?
- did EXPLORE actually compete and win?
- was a new exploratory heading sampled?
- did exploration produce the discovery?
- did that experience generate reward or learning?
- did accumulated experience later change behaviour?

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

M3 introduces the first deliberately bounded player-facing life-history mechanism.

M3 life history must remain separate from cognitive memory.

Entries must derive from genuine causal events and must not feed back into Creature cognition merely because they are recorded or displayed.

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

This was not a V0 prerequisite.

M3 introduces a narrower precursor by requiring relevant player-generated world events to be recorded in deterministic order where necessary for causal inspection and reproducibility.

A general long-term experience replay system remains a future requirement.

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

M3 was selected from the evidence produced by embodiment.

Future milestones should continue to be chosen partly from evidence produced by the embodied Creature rather than locking a long cognitive sequence prematurely.

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

The V0 review showed that causal legibility was already substantially successful but agency, attachment and individuality remained weak.

M3 is therefore part of the evidence-gathering path required before a much larger production commitment.

---

## 30. Current Active Milestone — M3

M3 — First Autonomous Experience-Shaped Creature — was prospectively accepted on 2026-08-18.

Authoritative specification:

`docs/M3_SPEC.md`

M3 was selected after comparing plausible post-V0 directions including:

- seeded behavioural exploration;
- richer environmental choices and consequences;
- persistent biography;
- richer drives;
- improved embodiment;
- primitive player teaching.

The selected direction was chosen because it offered the strongest small next step combining:

- genuine artificial-life emergence;
- visible player value;
- increased perceived agency;
- increased surprise and curiosity;
- accumulated individual history;
- progress toward meaningful individuality and attachment.

M3 deliberately does not attempt to implement all of those candidate systems.

The central mechanism is primitive homeostatic exploration pressure entering ordinary neural action competition.

Required high-level route:

internal exploration pressure  
→ weighted EXPLORE activation  
→ normal action competition  
→ EXPLORE selected  
→ seeded target-independent exploratory motor choice  
→ physical movement  
→ legitimate sensory discovery opportunity  
→ existing cognition / memory / action  
→ biological consequence  
→ reward  
→ neural learning  
→ persistent experience-shaped state  
→ changed later behaviour

The strongest M3 claim is not:

different seeds  
→ different movement paths

The required claim is:

different legitimate experience histories  
→ different persistent internal state  
→ same later controlled situation  
→ different behaviour

This distinction is central.

Random variation alone is not individuality.

### M3 exploration boundary

M3 introduces a primitive homeostatic exploration pressure.

It does not introduce:

- sensory novelty calculation;
- unexplored-area knowledge;
- curiosity maps;
- hidden resource search;
- general probabilistic action selection.

Exploration direction must be target-independent.

Hidden food position must not influence an exploratory heading before legitimate perception occurs.

Exploration must be allowed to fail.

### M3 stochasticity boundary

M3 does not make all action selection probabilistic.

Normal action competition remains the cognitive selector.

Seeded stochasticity is introduced narrowly after EXPLORE wins, to determine the physical expression of an already-selected exploratory action.

All simulation stochasticity must remain seeded, serializable and reproducible.

Rendering and diagnostics must not consume authoritative simulation RNG.

### M3 experience-shaped individuality standard

M3 must prospectively lock a two-phase experiment.

Phase A:

equivalent starting Creatures  
+ different locked exploration RNG seeds  
→ different legitimate experience histories

The histories must produce a relevant persistent internal difference, preferably learned neural connection weights.

Phase B:

the branches are placed into a standardized controlled probe.

Current conditions and immediate stochastic effects are normalized.

The persistent experience-shaped learned state remains different.

M3 succeeds centrally only if that historical difference then changes neural activation and/or behaviour.

### M3 required adversarial evidence

M3 includes:

- exploration-disabled control;
- learning-disabled control;
- same-seed deterministic replay;
- different-seed behavioural variation;
- hidden-target adversarial test;
- experience-state swap adversarial test;
- save/reload continuation;
- RNG-isolation evidence;
- causal telemetry.

The experience-state swap should demonstrate that later behavioural difference follows transferred learned state rather than Creature identity.

### M3 player interaction

M3 introduces one deliberately narrow player-to-world interaction:

**food placement or relocation.**

Required route:

player changes authoritative world state  
→ normal sensory transformation  
→ Creature may perceive, fail to perceive, remember or discover  
→ ordinary cognition and action

The interaction must never directly issue:

- SEEK;
- EXPLORE;
- movement;
- food coordinates;
- remembered direction.

The player changes circumstances.

The Creature determines its response.

### M3 life history

M3 introduces a small persistent life-history presentation derived from genuine events.

It remains distinct from M2 cognitive memory.

Potential entries include:

- first autonomous exploration;
- first independently discovered food;
- food reached after autonomous discovery;
- significant validated learning;
- discovery of a player-relocated resource.

Biography must not feed back into cognition.

### M3 embodiment

M3 also includes a presentation pass intended to make the visible organism read less like an abstract test token.

The presentation may become more creature-like through:

- recognizable body mass;
- face/front region;
- eyes;
- tail, crest or appendage;
- natural idle motion;
- breathing/blinking;
- locomotion;
- genuine eating animation.

Presentation is not evidence for the M3 cognitive claim.

It must remain downstream of authoritative simulation state.

### M3 human evaluation

After mechanistic acceptance evidence is established, conduct a diagnostics-hidden human evaluation.

Compare against V0 on:

- agency;
- surprise;
- curiosity;
- interaction desire;
- individuality;
- attachment;
- replaceability;
- legibility.

M3 does not require strong attachment.

However, if the mechanism passes technically but produces no directional improvement in agency, curiosity or meaningful individuality, another design review is required before M3 is treated as sufficient game-design progress.

### M3 prospective locking rule

Before the integrated behavioural result is evaluated, M3 must lock:

- exploration-pressure constants;
- exploration neural weight;
- seeded heading-generation rules;
- heading persistence;
- boundary behaviour;
- environment geometry;
- primary acquisition seed pair or seed set;
- experience-phase stopping rule;
- autonomous-discovery metric;
- standardized probe;
- normalization procedure;
- primary metrics;
- controls;
- adversarial tests.

Do not quietly change these after observing results merely to obtain a pass.

### M3 implementation sequence

Current sequence:

M3 prospective specification accepted  
→ add M3 specification and authoritative project-state update  
→ validate clean documentation baseline  
→ commit / push / verify CI  
→ M3.1 Pure Exploration Mechanism  
→ M3.2 prospectively lock behavioural contract  
→ M3.3 neural EXPLORE integration  
→ M3.4 autonomous exploratory movement  
→ M3.5 environmental discovery  
→ M3.6 experience-acquisition experiment  
→ M3.7 standardized individuality probe  
→ M3.8 player world interaction  
→ M3.9 creature presentation and life history  
→ M3.10 determinism, persistence and telemetry  
→ M3.11 behavioural and human evaluation  
→ M3.12 independent adversarial review and formal audit  
→ explicit user acceptance

Do not begin M3.3 before the M3.2 behavioural contract is prospectively locked.

Current immediate engineering task after the documentation baseline is committed and CI-verified:

**M3.1 — Pure Exploration Mechanism**

M3.1 should establish only:

- exploration-pressure state;
- deterministic simulation-time accumulation;
- deterministic reduction;
- bounded pressure;
- serialization;
- seeded heading-generation primitive;
- heading persistence where needed;
- same-seed deterministic replay.

M3.1 must not yet connect exploration to Creature behaviour.

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