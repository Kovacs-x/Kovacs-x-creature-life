# M2 Specification - First Persistent Memory-Guided Creature

**Milestone:** M2  
**Status:** Specification pending approval  
**Prerequisite:** M1 accepted  
**Purpose:** Prove that past sensory experience can persist internally and influence later behaviour after direct perception is lost, without giving the Creature omniscient access to world state.

---

## 1. Objective

M2 introduces the Creature's first genuine persistent memory mechanism.

The Creature must be able to:

1. directly perceive food;
2. form an internal memory trace derived from that perception;
3. lose direct sensory access to the food;
4. retain the memory across later simulation ticks;
5. recall an imperfect representation of the earlier experience;
6. allow that recalled signal to participate in normal neural/action competition;
7. behave differently because of the remembered experience;
8. gradually forget or weaken the memory over simulation time;
9. correct or replace stale memory when new direct perception becomes available.

The Creature must not receive hidden access to the food's current coordinates while the food is not perceptible.

A Creature that simply continues moving toward a secretly stored target does not satisfy M2.

M2 is complete only when memory-guided behaviour is experimentally distinguishable from:

- current direct perception;
- scripted target following;
- an equivalent Creature with memory disabled.

---

# 2. What M2 Is Intended to Prove

M1 established:

```text
current perception
        ↓
internal biology
        ↓
brain activation
        ↓
action competition
        ↓
behaviour
        ↓
biological consequence
        ↓
reward
        ↓
learning
3. Scope

M2 implements only the smallest memory system needed to prove genuine memory-guided behaviour.

M2 includes:

sensory-derived memory encoding;
persistent memory state;
memory age;
deterministic memory decay;
memory confidence/strength;
recall of previously perceived food information;
memory influence on neural activation;
memory influence on action competition;
movement informed by recalled sensory direction;
forgetting/expiration;
correction by new sensory evidence;
memory serialization;
deterministic memory replay;
memory telemetry;
memory-disabled controls;
no-prior-perception controls;
stale-memory experiments.

M2 does NOT include:

human-like episodic memory;
language memory;
autobiographical narrative;
semantic knowledge graphs;
multiple advanced memory systems;
procedural skill learning;
social memory;
relationship memory;
emotional autobiographical memory;
long-term cognitive maps;
pathfinding;
navigation meshes;
hippocampal simulation;
sleep consolidation;
dreams;
advanced memory reconsolidation;
genetics affecting memory;
developmental memory differences;
personality;
curiosity;
teaching;
multiple Creatures;
reproduction;
culture.

Those capabilities belong to later milestones.

4. Architectural Principle

Memory is an internal reconstruction of past sensory experience.

Memory must NOT be a second channel into world truth.

The allowed information flow is:

WORLD TRUTH
    ↓
SENSORY TRANSFORMATION
    ↓
PERCEIVED SIGNAL
    ↓
MEMORY ENCODING
    ↓
MEMORY TRACE

Later recall is:

MEMORY TRACE
    ↓
DECAY / RETRIEVAL
    ↓
RECALLED SIGNAL
    ↓
BRAIN

The forbidden information flow is:

MEMORY
    ↓
query current food object
    ↓
retrieve exact hidden location

Memory may only contain information that could have been derived from what the Creature previously perceived.

5. Memory Representation

The minimum M2 memory trace should contain conceptually equivalent information to:

MemoryTrace

kind
source category
encoded tick
age
confidence / strength
remembered direction
remembered perceptual strength

Exact TypeScript names may differ if implementation gives a justified reason.

A memory trace may optionally contain a source object identifier for diagnostics and traceability.

An object identifier must NOT be used to query the current hidden world object during recall.

The behavioural system must work from the stored memory content itself.

6. No Direct World Coordinates in Cognitive Memory

M2 must not store fields equivalent to:

foodX
foodY
targetX
targetY
worldTargetPosition
lastKnownExactWorldPosition

inside the Creature's cognitive memory representation.

The memory should instead retain an imperfect sensory-derived representation, such as:

rememberedDirectionX
rememberedDirectionY
rememberedStrength
confidence
age

This is intentionally limited.

If the Creature moves, the remembered direction may become inaccurate.

That imperfection is desirable because it demonstrates that memory is not hidden omniscience.

7. Sensory Occlusion

M2 must introduce a legitimate distinction between:

food exists in world

and:

Creature can currently perceive food

A food object may remain physically present while being unavailable to the food-perception system.

The occlusion mechanism belongs to the simulation/sensory layer.

The test must NOT fake memory by simply passing a desired remembered signal directly into the brain.

Conceptually:

Food exists
     ↓
visibility / occlusion rule
     ↓
perceiveFood(...)
     ↓
signal OR null

When occluded:

food still exists
perception = null

This is different from the M1 adversarial case where food became unavailable because it was consumed or removed.

8. Memory Encoding

A memory trace must be created or refreshed because a valid sensory signal was experienced.

Memory encoding must not inspect raw world coordinates independently.

Example:

food perception:

directionX = 1
directionY = 0
strength = 0.8

        ↓

memory encoding

        ↓

rememberedDirectionX = 1
rememberedDirectionY = 0
rememberedPerceptualStrength = 0.8
confidence = initial confidence
age = 0

A memory trace must therefore be causally attributable to a real perception event.

9. Memory Persistence

After direct perception disappears, the memory trace must remain present for more than one simulation tick.

Example:

Tick 1
food perceived
memory encoded

Tick 2
food occluded
memory remains

Tick 3
food still occluded
memory remains but weaker

Tick N
memory confidence becomes too weak
memory expires or ceases influencing behaviour

Persistence must be based on simulation time or simulation ticks.

Wall-clock time must not determine forgetting.

10. Memory Decay

M2 memory must be imperfect.

Memory confidence or strength must deterministically weaken as simulation time passes without reinforcement or refreshing perception.

The implementation must define explicit constants or configuration for:

initial encoding strength or confidence;
decay rate;
minimum usable confidence or expiration threshold.

Those values must be defined before behavioural acceptance results are evaluated.

Do not tune the constants after seeing an acceptance-test result solely to force the expected behavioural outcome.

Decay must be deterministic.

11. Recall

When no direct food perception is available, a sufficiently strong memory trace may produce a recalled sensory-like signal.

Conceptually:

stored memory
    ↓
age / confidence check
    ↓
recall transformation
    ↓
MemoryRecallSignal

A recalled signal should contain enough information for the brain to represent:

remembered food evidence;
memory confidence;
remembered direction.

Recall must not access current hidden food coordinates.

12. Current Perception vs Memory

Direct perception and memory must remain distinguishishable internal signals.

The brain must not be told:

foodVisible = true

when only memory is active.

Conceptually:

currentFoodSignal
rememberedFoodSignal

must remain distinct.

This distinction is required for:

debugging;
action competition;
stale-memory tests;
future expansion of the cognitive architecture.

Direct perception represents evidence about the world now.

Memory represents retained information about past perception.

13. Brain Integration

Memory must influence behaviour through the normal neural architecture.

The brain should gain one or more memory-related input nodes, conceptually similar to:

input:remembered-food

or an equivalent general mechanism.

Memory strength or confidence contributes activation through weighted neural connections.

Memory must NOT directly issue:

seek
move
eat

commands.

The causal path must remain:

memory recall
    ↓
brain input activation
    ↓
weighted network
    ↓
candidate action activations
    ↓
competition
    ↓
selected action
14. Memory-Guided Movement

If SEEK wins while direct perception is absent but a valid recalled directional signal exists, movement may use that remembered directional estimate.

The movement executor must never receive the food object's hidden current position.

Conceptually:

SEEK selected

direct perception available?
    ↓
use direct perceived direction

otherwise valid memory recall?
    ↓
use remembered direction

This direction-source resolution is an action-execution concern.

It must not bypass action competition.

A memory signal must not automatically produce movement unless the corresponding action wins normal competition.

15. Stale Memory

Memory must be capable of being wrong.

This is a required property.

If food moves while occluded:

Creature remembers old direction
food moves elsewhere
Creature cannot see movement

then the Creature must NOT magically update its memory.

Its behaviour may therefore initially be directed toward the old remembered direction.

This is positive evidence that the Creature does not have omniscient world access.

16. Memory Correction

When new direct sensory evidence becomes available, it must be capable of refreshing, correcting, or replacing stale memory.

Example:

Tick 1
food perceived east

Tick 2
food hidden
Creature remembers east

Tick 3
food secretly moves west
Creature still remembers east

Tick 4
food becomes visible west
new perception detected
memory updates toward west

New direct perception should generally have greater epistemic authority than an older recalled trace.

The exact correction mechanism may remain simple in M2.

17. Forgetting

A sufficiently old or weak memory must cease influencing action selection.

The Creature must not remember food perfectly forever.

Expected qualitative behaviour:

recent memory
→ meaningful influence

older memory
→ weaker influence

expired memory
→ no meaningful influence

The expiration mechanism may use:

confidence threshold;
finite lifetime;
deterministic strength decay;
or a combination of these.

The mechanism must be explicit and testable.

18. Primary M2 Behavioural Probe

The primary behavioural experiment must be defined before evaluating results.

Locked scenario:

Initial world:

Creature is hungry
Food is positioned perceptibly in one direction

Tick 1:
food visible
Creature receives direct food perception
memory encoded

Following tick:
food remains physically present
food becomes perceptually occluded
direct food perception = null

Memory-enabled Creature:
recalled food signal exists
memory contributes to SEEK activation

Memory-disabled control:
no recalled signal exists

Primary predefined behavioural metric:

After direct perception disappears, does memory cause SEEK activation and remembered-direction movement to exceed the otherwise identical memory-disabled control?

The experiment must include both:

action-selection evidence;
physical movement evidence.

Expected qualitative result:

memory-enabled Creature:

memory recalled
→ SEEK activation elevated
→ SEEK wins or is measurably strengthened
→ movement occurs in remembered direction


memory-disabled control:

direct perception absent
→ no recall
→ lower SEEK activation
→ IDLE wins or remembered-direction movement is absent

Do not replace the metric after seeing the result merely to obtain a passing test.

19. Acceptance Criteria
AC1 - Memory Encoding

A valid direct food perception creates or refreshes a memory trace.

The memory content must be derived from sensory information rather than raw world coordinates.

AC2 - Memory Persistence

The memory remains available after direct perception disappears.

The trace must survive subsequent simulation ticks without direct sensory refresh.

AC3 - Memory Decay

Memory confidence or strength decreases predictably as simulation time passes without refreshing perception.

Eventually the trace must become unusable or expire.

AC4 - Recall

A sufficiently strong stored memory produces a recall signal when appropriate.

No current hidden world-object query may be required to reconstruct the remembered information.

AC5 - Memory Brain Integration

The recalled signal influences neural activation through weighted connections.

Memory does not directly command SEEK, MOVE, or EAT.

AC6 - Competitive Behaviour

After direct food perception disappears, the memory-enabled Creature must show greater food-seeking activation than an otherwise equivalent memory-disabled control where the difference is causally attributable to recalled memory.

AC7 - Memory-Guided Movement

When memory contributes to a winning SEEK action, Creature movement may follow the recalled directional estimate.

The movement must not use hidden current food coordinates.

AC8 - Stale Memory / No Omniscience

If food changes position while occluded, the Creature must not automatically know the new location.

Until new direct perception occurs, recall must continue reflecting the previously encoded information or deterministic decay from it.

AC9 - Correction by New Evidence

When food becomes directly visible in a different direction, the Creature must respond to the new sensory evidence and update or refresh memory accordingly.

A stale memory must not permanently override valid direct perception.

AC10 - Forgetting Control

After sufficient deterministic decay or expiration, a previously remembered Creature must cease showing the same memory-driven behaviour.

Its behaviour should approach the otherwise equivalent memory-disabled condition.

AC11 - Serialization

A checkpoint containing meaningful M2 state must round-trip through serialization without changing relevant state, including:

Creature position;
biology;
brain weights;
memory trace;
memory age;
memory confidence;
remembered direction;
eligibility state required for ongoing learning;
simulation tick/time;
RNG state where applicable.

A save/reload sequence must produce the same later result as uninterrupted execution within deterministic scope.

AC12 - Determinism

Identical:

initial world;
Creature state;
brain;
memory state;
simulation timing;
occlusion sequence;
seeded randomness where applicable;

must reproduce the same:

memory encoding;
memory decay;
recall;
neural activations;
actions;
movement;
learning;
final state.
AC13 - Telemetry

The debug trace must expose at least:

current direct food perception;
whether food is occluded;
memory encoding event;
stored remembered direction;
memory age;
memory confidence;
recalled memory signal;
direct-perception activation;
memory activation;
candidate action scores;
selected action;
movement direction source;
memory refresh/correction;
memory decay;
memory expiration where applicable.

It must be possible to answer:

"Did the Creature do this because it currently saw the food, because it remembered the food, or for some other reason?"

20. Required Control Experiments
Control A - Memory Disabled

Same:

world;
hunger;
previous visible-food experience;
timing;
occlusion sequence;

but memory encoding or recall is disabled.

Expected:

memory-enabled behaviour
≠
memory-disabled behaviour

during the occluded probe.

Control B - No Prior Perception

Food begins occluded.

Creature has never perceived it.

Expected:

no food memory
no food recall
no memory-guided search

This prevents hidden world knowledge from masquerading as memory.

Control C - Expired Memory

Creature previously perceived food but enough simulation time passes for the memory trace to expire.

Expected:

expired-memory behaviour
approaches memory-disabled behaviour
Control D - Stale Memory

Creature sees food in Direction A.

Food becomes occluded.

Food moves to Direction B while hidden.

Expected before re-perception:

memory continues representing Direction A

not Direction B.

Control E - Memory Correction

Following the stale-memory experiment, food becomes directly perceptible in Direction B.

Expected:

new perception
→ memory corrected or refreshed
→ later recall reflects Direction B
21. Forbidden Shortcuts

M2 is rejected if success depends on any of the following.

A direct behaviour rule such as:

if rememberedFood then seek

implemented outside normal neural/action competition.

A hidden target-following rule such as:

if foodNotVisible then moveToLastFoodPosition

using stored exact world coordinates.

A permanent behavioural flag such as:

hasSeenFood = true

directly activating food-seeking behaviour without a graded memory representation.

Storing raw cognitive target fields such as:

targetX
targetY
foodWorldPosition
lastKnownExactFoodPosition

inside memory.

Using remembered object identity to query the hidden food's current position.

Refreshing memory while an object is occluded without a legitimate sensory event.

Allowing memory to remain perfect indefinitely.

Tests injecting the expected remembered direction directly into the brain instead of exercising memory encoding and recall.

UI or rendering code controlling memory.

A hidden state machine implementing:

see
→ remember
→ seek
→ eat

without neural competition.

An LLM deciding Creature actions.

Non-seeded randomness inside deterministic simulation scope.

Tests that assert only final position without proving the causal memory pathway.

22. Architectural Constraint - Do Not Duplicate the Simulation Loop

M1 currently contains:

m1Trial.ts
m1Episode.ts

with partially overlapping execution logic.

M2 must not introduce a third independent full simulation pipeline.

Before or during early M2 implementation, shared stepped simulation mechanisms should be reused or consolidated where reasonably possible.

M2 should build toward:

state
  ↓
one simulation tick
  ↓
new state

rather than increasingly large hard-coded episode functions.

This is important because future:

memory;
social behaviour;
development;
genetics;
language;

will all require persistent multi-tick state.

23. State Ownership

M2 memory belongs to the Creature's simulation state.

It must not live only inside:

a test;
a closure;
React state;
renderer state;
UI state;
global mutable variables.

Memory must be:

serializable;
inspectable;
deterministic;
resumable.
24. Memory and Learning Are Different Mechanisms

M2 must preserve the conceptual distinction:

MEMORY
=
stored and recalled information

LEARNING
=
persistent neural-weight modification

The two mechanisms may interact.

For example:

memory recall
→ action
→ biological consequence
→ reward
→ neural learning

But memory itself must not simply be represented as a permanent neural weight change.

Existing M1 reinforcement learning must continue functioning.

25. Direct Perception Has Priority Over Recall

When both valid direct perception and memory are available, current legitimate sensory evidence must not be silently replaced by stale recalled information.

Conceptually:

direct perception
=
current evidence

memory
=
historical evidence

The architecture may allow both signals to influence cognition, but a stale memory must not cause the Creature to ignore clearly contradictory direct sensory information.

This rule is particularly important for the memory-correction experiment.

26. Memory Must Be Creature-Specific

Memory belongs to the individual Creature that experienced the sensory event.

M2 must not introduce shared global food memory.

Future multiple-Creature systems must be able to give different Creatures different remembered histories.

Even though M2 uses only one Creature, memory state should therefore be designed as Creature-owned state rather than world-global cognition.

27. Telemetry Example

An acceptable conceptual trace might resemble:

TICK 1

food:
  physically present = yes
  occluded = no

direct perception:
  direction = east
  strength = 0.80

memory:
  encoded = yes
  direction = east
  confidence = 0.80
  age = 0

brain:
  direct-food activation = 0.80
  remembered-food activation = 0

actions:
  idle = 0.35
  seek = 0.51
  eat = 0.18

selected:
  seek

movement source:
  direct perception


TICK 2

food:
  physically present = yes
  occluded = yes

direct perception:
  none

memory:
  direction = east
  confidence = 0.60
  age = 1

recall:
  active = yes

brain:
  direct-food activation = 0
  remembered-food activation = 0.60

actions:
  idle = 0.35
  seek = 0.41
  eat = 0.18

selected:
  seek

movement source:
  memory


LATER

direct perception:
  none

memory:
  confidence = below threshold
  expired = yes

brain:
  remembered-food activation = 0

actions:
  seek = below idle

selected:
  idle

Exact numbers are illustrative only.

Acceptance-test constants must be defined prospectively in implementation rather than copied from this example solely to guarantee a passing result.

28. Recommended Test Scenarios
Food visible → memory encoded.
Food occluded one tick later → memory persists.
Memory-guided SEEK exceeds identical memory-disabled control.
Creature moves in recalled direction while food remains hidden.
Food hidden without any previous perception → no recall.
Memory confidence decreases across simulation ticks.
Memory eventually expires → behaviour approaches control.
Food moves while hidden → memory remains stale.
Food becomes visible at a new location → memory corrects.
Save while food is hidden but memory active → reload → same recalled behaviour.
Fixed initial state and timing reproduce identical memory traces.
Telemetry distinguishes direct perception from recalled information.
Existing M1 learning behaviour remains passing after memory integration.
29. Required Delivery Evidence

Before M2 can be accepted, the implementation review must provide:

files changed;
architecture summary;
memory-state schema;
explanation of how memory is derived from perception;
explanation of why memory cannot query hidden world truth;
decay configuration;
behavioural probe definition;
memory-enabled results;
memory-disabled control results;
no-prior-perception control results;
forgetting results;
stale-memory experiment;
memory-correction experiment;
save/reload continuity result;
deterministic replay result;
example telemetry trace;
known limitations;
confirmation that M1 learning still works;
confirmation that no prohibited shortcut is used.
30. Known Expected Limitations

A successful M2 Creature will still have extremely primitive memory.

Its memory may effectively amount to:

"I recently sensed food roughly in that direction."

That is sufficient for M2.

M2 does not require:

"I remember that yesterday you placed an apple behind the red rock and I preferred it because I was hungry."

That level of representation requires later:

object concepts;
richer episodic memory;
temporal representation;
places;
relationships;
language;
autobiographical state.

The purpose of M2 is to establish the smallest credible causal foundation from which those systems can later grow.

31. M2 Success Definition

M2 succeeds when the following claim is experimentally supported:

After directly perceiving food, the Creature can later behave differently when that food is no longer directly perceptible because an internally stored, decaying, sensory-derived memory influences its neural action-selection system.

The implementation must also rule out the following alternative explanations within the prototype's scope:

hidden access to food coordinates;
direct target following;
permanent behavioural flags;
scripted remember-and-seek rules;
current perception masquerading as memory;
perfect non-decaying memory;
test-only signal injection;
global memory not owned by the Creature.
32. M2 Completion Gate

Do not begin M3 merely because a Creature appears to remember something.

M2 may be closed only after:

all M2 acceptance criteria pass;
memory-enabled behaviour is compared against controls;
no-prior-perception control passes;
stale-memory behaviour demonstrates lack of omniscience;
memory correction by new perception is demonstrated;
deterministic forgetting is demonstrated;
save/reload memory continuity is demonstrated;
deterministic replay is demonstrated;
telemetry exposes the causal memory pathway;
existing M1 tests continue passing;
the implementation is reviewed for prohibited shortcuts;
the user explicitly accepts M2.

Until explicit acceptance, M2 remains active.