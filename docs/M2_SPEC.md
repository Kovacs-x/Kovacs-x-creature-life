# M2 Specification - First Persistent Memory-Guided Creature

**Milestone:** M2  
**Status:** Active after M1 acceptance  
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
6. allow that recalled information to participate in normal neural/action competition;
7. behave differently because of the remembered experience;
8. gradually forget or weaken the memory over simulation time;
9. correct stale memory when new direct perception becomes available.

The Creature must not receive hidden access to the food's current coordinates while the food is not perceptible.

A Creature that simply continues moving toward a secretly stored target does not satisfy M2.

M2 is complete only when memory-guided behaviour is experimentally distinguishable from:

- current direct perception;
- scripted target following;
- an equivalent Creature with memory disabled.

---

## 2. What M2 Is Intended to Prove

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
```

M2 must establish:

```text
past perception
        ↓
memory encoding
        ↓
persistent internal trace
        ↓
time passes
direct perception disappears
        ↓
memory recall
        ↓
current biology
+
current perception
+
recalled information
        ↓
brain activation
        ↓
action competition
        ↓
memory-influenced behaviour
```

The key new causal capability is:

**Behaviour influenced by information that is no longer present in the current sensory stream.**

---

## 3. Scope

M2 implements only the smallest memory system needed to prove genuine memory-guided behaviour.

M2 includes:

- sensory-derived memory encoding;
- persistent memory state;
- memory age;
- deterministic memory decay;
- memory confidence/strength;
- recall of previously perceived food information;
- memory influence on neural activation;
- memory influence on action competition;
- movement informed by recalled sensory direction;
- forgetting/expiration;
- correction by new sensory evidence;
- sensory occlusion;
- memory serialization;
- deterministic replay;
- memory telemetry;
- memory-disabled controls;
- no-prior-perception controls;
- stale-memory experiments.

M2 does NOT include:

- human-like episodic memory;
- autobiographical narrative;
- semantic knowledge graphs;
- language memory;
- social memory;
- relationship memory;
- emotional autobiographical memory;
- long-term cognitive maps;
- pathfinding;
- navigation meshes;
- hippocampal simulation;
- sleep consolidation;
- dreams;
- genetics affecting memory;
- developmental memory differences;
- personality;
- curiosity;
- teaching;
- multiple Creatures;
- reproduction;
- culture.

Those capabilities belong to later milestones.

---

## 4. Architectural Principle

Memory is an internal reconstruction of past sensory experience.

Memory must NOT be a second channel into world truth.

Allowed information flow:

```text
WORLD TRUTH
    ↓
SENSORY TRANSFORMATION
    ↓
PERCEIVED SIGNAL
    ↓
MEMORY ENCODING
    ↓
MEMORY TRACE
```

Later recall:

```text
MEMORY TRACE
    ↓
DECAY / RETRIEVAL
    ↓
RECALLED SIGNAL
    ↓
BRAIN
```

Forbidden information flow:

```text
MEMORY
    ↓
query current hidden food object
    ↓
retrieve current exact location
```

Memory may only contain information that could have been derived from what the Creature previously perceived.

---

## 5. Memory Representation

The minimum M2 food memory trace should contain conceptually equivalent information to:

```text
FoodMemoryTrace

kind
source category
encoded tick
age
confidence
remembered direction X
remembered direction Y
remembered perceptual strength
```

Exact TypeScript names may differ if there is a justified architectural reason.

A memory trace may contain a source object identifier for diagnostics and traceability.

That identifier must NOT be used during recall to query the current hidden object's position or state.

The behavioural system must work from the stored memory content itself.

---

## 6. No Direct World Coordinates in Cognitive Memory

M2 cognitive memory must not store fields equivalent to:

```text
foodX
foodY
targetX
targetY
worldTargetPosition
lastKnownExactFoodPosition
```

Instead it should retain an imperfect sensory-derived representation such as:

```text
rememberedDirectionX
rememberedDirectionY
rememberedStrength
confidence
age
```

If the Creature subsequently moves, the remembered direction may become inaccurate.

That imperfection is intentional.

A memory that can become stale or wrong provides evidence that the Creature is not receiving omniscient world information.

---

## 7. Sensory Occlusion

M2 must distinguish:

```text
food physically exists
```

from:

```text
Creature can currently perceive food
```

Food may remain present while being unavailable to the food-perception system.

Conceptually:

```text
Food exists
     ↓
visibility / occlusion state
     ↓
sensory transformation
     ↓
food signal OR null
```

When occluded:

```text
food physically exists = true
direct perception = null
```

Occlusion must be implemented in the simulation/sensory pathway.

Tests must not fake memory by injecting a desired remembered signal directly into the brain.

---

## 8. Memory Encoding

A memory trace must be created or refreshed because a valid sensory signal was actually experienced.

Memory encoding must consume the sensory representation rather than independently inspecting world coordinates.

Example:

```text
direct perception:

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
```

Every encoded M2 food memory must therefore be causally attributable to a legitimate perception event.

---

## 9. Memory Persistence

After direct perception disappears, the memory trace must remain available for subsequent simulation ticks.

Example:

```text
Tick 1
food perceived
memory encoded

Tick 2
food occluded
memory remains

Tick 3
food still occluded
memory remains but weaker

Later
memory becomes too weak
memory expires
```

Persistence must depend on simulation time or simulation ticks.

Wall-clock time must not determine forgetting.

---

## 10. Memory Decay

M2 memory must be imperfect.

Memory confidence must deterministically weaken when simulation time passes without a new perception refreshing it.

Implementation must define prospective constants or configuration for:

- initial confidence;
- decay per simulation interval;
- minimum usable confidence or expiration threshold.

These values must be defined before behavioural acceptance results are evaluated.

They must not be retroactively tuned solely to force a desired test result.

Decay must be deterministic.

---

## 11. Recall

When direct perception is unavailable, a sufficiently strong stored memory may produce a recall signal.

Conceptually:

```text
stored memory
    ↓
age / confidence evaluation
    ↓
recall transformation
    ↓
MemoryRecallSignal
```

The recall signal should contain enough information to represent:

- remembered food evidence;
- memory confidence;
- remembered direction.

Recall must not access the hidden food's current coordinates.

---

## 12. Direct Perception and Memory Must Remain Distinct

The system must distinguish:

```text
currentFoodSignal
```

from:

```text
rememberedFoodSignal
```

The brain must not be told that food is currently visible when only memory is active.

Direct perception means:

```text
evidence about the world now
```

Memory means:

```text
retained information about an earlier perception
```

This distinction must remain observable in telemetry and tests.

---

## 13. Brain Integration

Memory must influence behaviour through the normal neural architecture.

The M2 brain should gain one or more memory-related input nodes, conceptually similar to:

```text
input:remembered-food
```

or an equivalent general mechanism.

Memory confidence contributes activation through weighted neural connections.

Memory must NOT directly issue:

```text
seek
move
eat
```

commands.

Required causal path:

```text
memory recall
    ↓
brain input activation
    ↓
weighted neural network
    ↓
candidate action activations
    ↓
generic competition
    ↓
selected action
```

---

## 14. Memory-Guided Movement

If SEEK wins while direct perception is absent but valid memory recall exists, movement may use the remembered directional estimate.

Conceptually:

```text
SEEK selected
      ↓
direct perceived direction available?
      ↓ yes
use direct direction

      ↓ no
valid recalled direction available?
      ↓ yes
use recalled direction
```

The movement executor must never be supplied with the hidden current food position.

Memory does not cause movement by itself.

SEEK must first win normal action competition.

---

## 15. Stale Memory

Memory must be capable of being wrong.

This is a required property.

Example:

```text
Tick 1
Creature perceives food east

Tick 2
food becomes occluded

Tick 3
food secretly moves west
```

Before the Creature directly perceives the new position:

```text
memory should still represent east
```

or a decayed version of that earlier representation.

It must NOT automatically change to west.

This is evidence against omniscient world access.

---

## 16. Memory Correction

When new direct sensory evidence becomes available, it must be capable of correcting or replacing stale memory.

Example:

```text
Tick 1
food perceived east

Tick 2
food occluded
memory says east

Tick 3
hidden food moves west
memory still says east

Tick 4
food becomes directly visible west
memory refreshes toward west
```

Current legitimate sensory evidence has greater epistemic authority than stale remembered evidence.

---

## 17. Forgetting

A sufficiently weak or old memory must cease influencing action selection.

Expected qualitative behaviour:

```text
recent memory
→ strong influence

older memory
→ weaker influence

expired memory
→ no memory influence
```

Expiration may use:

- confidence threshold;
- deterministic lifetime;
- deterministic strength decay;
- or a combination.

The mechanism must be explicit and testable.

---

## 18. Primary M2 Behavioural Probe

The primary behavioural experiment is defined before implementation results are evaluated.

Locked scenario:

```text
Initial condition:

Creature hungry
Food perceptible in one direction


Tick 1:

food visible
→ direct food perception
→ memory encoded


Following tick:

food remains physically present
food becomes occluded
direct food signal = null


Memory-enabled Creature:

memory recalled
→ remembered-food neural activation
→ increased SEEK activation
→ remembered-direction behaviour


Memory-disabled control:

no usable recall
→ lower SEEK activation
→ no equivalent remembered-direction behaviour
```

### Predefined primary metric

After direct perception disappears:

**Does the memory-enabled Creature produce greater SEEK activation and greater remembered-direction movement than an otherwise equivalent memory-disabled control?**

The experiment must examine both:

1. action-selection evidence;
2. physical movement evidence.

The metric must not be replaced after seeing results merely to create a passing test.

---

## 19. Acceptance Criteria

### AC1 - Memory Encoding

A valid direct food perception creates or refreshes a food memory trace.

The memory must be derived from sensory information rather than raw world coordinates.

### AC2 - Memory Persistence

Memory remains available after direct perception disappears.

The trace survives subsequent simulation ticks without direct sensory refresh.

### AC3 - Memory Decay

Memory confidence decreases predictably as simulation time passes without new direct perception.

Eventually the memory becomes unusable or expires.

### AC4 - Recall

A sufficiently strong stored memory produces a recall signal.

Recall does not query the hidden world object for its current position.

### AC5 - Memory Brain Integration

Recall influences neural activation through weighted connections.

Memory cannot directly command SEEK, MOVE or EAT.

### AC6 - Competitive Behaviour

After direct food perception disappears, the memory-enabled Creature shows greater food-seeking activation than an otherwise equivalent memory-disabled control.

The difference must be causally attributable to memory recall.

### AC7 - Memory-Guided Movement

When memory contributes to a winning SEEK action, the Creature can move according to the recalled directional estimate.

Hidden current food coordinates are not used.

### AC8 - Stale Memory / No Omniscience

If food changes position while occluded, the Creature does not automatically know the new position.

Recall continues to reflect the earlier sensory-derived information or its deterministic decay.

### AC9 - Correction by New Evidence

When food becomes directly perceptible in a different direction, new perception corrects or refreshes memory.

Stale memory must not permanently override valid direct sensory evidence.

### AC10 - Forgetting Control

After sufficient deterministic decay or expiration, previously remembered food ceases producing the same memory-driven behaviour.

Behaviour approaches the equivalent memory-disabled condition.

### AC11 - Serialization

Meaningful M2 state round-trips through serialization without changing relevant state, including:

- Creature position;
- biology;
- brain weights;
- food memory;
- memory age;
- memory confidence;
- remembered direction;
- eligibility trace required for learning;
- simulation tick/time;
- RNG state where applicable.

Save/reload continuation must match uninterrupted continuation within deterministic scope.

### AC12 - Determinism

Identical:

- initial world;
- Creature state;
- brain;
- memory state;
- simulation timing;
- occlusion sequence;
- seeded randomness where applicable;

must reproduce identical:

- memory encoding;
- memory decay;
- recall;
- neural activations;
- action selections;
- movement;
- learning;
- final state.

### AC13 - Telemetry

Debug telemetry must expose at least:

- direct food perception;
- food occlusion status;
- memory encoding;
- remembered direction;
- memory age;
- memory confidence;
- recalled memory signal;
- direct-perception neural activation;
- memory neural activation;
- candidate action scores;
- selected action;
- movement direction source;
- memory refresh/correction;
- memory decay;
- memory expiration.

The trace must make it possible to answer:

**Did the Creature behave this way because it currently perceived food, because it remembered food, or because of some other mechanism?**

---

## 20. Required Control Experiments

### Control A - Memory Disabled

Same:

- world;
- hunger;
- prior visible-food experience;
- timing;
- occlusion sequence;

but usable memory encoding/recall is disabled.

Expected:

```text
memory-enabled behaviour
≠
memory-disabled behaviour
```

during the occluded probe.

### Control B - No Prior Perception

Food begins occluded.

The Creature has never perceived it.

Expected:

```text
no food memory
no recall
no memory-guided search
```

This prevents hidden world knowledge from masquerading as memory.

### Control C - Expired Memory

The Creature previously perceived food but sufficient simulation time passes for the memory to expire.

Expected:

```text
expired-memory behaviour
approaches memory-disabled behaviour
```

### Control D - Stale Memory

Creature perceives food in Direction A.

Food becomes occluded.

Food moves to Direction B while hidden.

Expected before re-perception:

```text
memory still represents Direction A
```

not Direction B.

### Control E - Memory Correction

Following Control D, food becomes directly perceptible in Direction B.

Expected:

```text
new direct perception
→ memory corrected/refreshed
→ later recall represents Direction B
```

---

## 21. Forbidden Shortcuts

M2 is rejected if success depends on:

```text
if rememberedFood then seek
```

implemented outside neural/action competition;

or:

```text
if foodNotVisible then moveToLastFoodPosition
```

using hidden exact coordinates;

or a permanent behavioural flag such as:

```text
hasSeenFood = true
```

that directly activates food-seeking behaviour.

The following are also forbidden:

- storing exact hidden target coordinates in cognitive memory;
- using remembered object identity to query its hidden current location;
- refreshing memory while food is occluded without a legitimate sensory event;
- perfect non-decaying memory;
- tests injecting remembered direction directly into the brain instead of exercising encoding and recall;
- UI or renderer code controlling memory;
- a hidden state machine implementing see → remember → seek → eat;
- an LLM deciding Creature actions;
- non-seeded randomness inside deterministic simulation scope;
- tests asserting only final position without proving the causal memory mechanism.

---

## 22. Architectural Constraint - Do Not Duplicate the Simulation Loop

M1 currently contains both:

```text
m1Trial.ts
m1Episode.ts
```

with partially overlapping execution logic.

M2 must not create a third independent simulation pipeline.

M2 should build toward:

```text
state
  ↓
one simulation tick
  ↓
new state
```

Shared stepped simulation mechanisms should be reused or consolidated where reasonably possible.

This is important because later:

- memory;
- social behaviour;
- development;
- genetics;
- language;

all require persistent multi-tick simulation state.

---

## 23. State Ownership

M2 memory belongs to the Creature's simulation state.

It must not exist only inside:

- a test;
- a closure;
- React state;
- renderer state;
- UI state;
- a mutable global variable.

Memory must be:

- serializable;
- inspectable;
- deterministic;
- resumable;
- individually owned by the Creature.

---

## 24. Memory and Learning Are Different Mechanisms

M2 must preserve the distinction:

```text
MEMORY
=
stored and recalled information
```

versus:

```text
LEARNING
=
persistent neural-weight modification
```

They may interact:

```text
memory recall
→ action
→ biological consequence
→ reward
→ neural learning
```

But memory itself must not merely be represented as permanent neural weight modification.

Existing M1 reinforcement learning must continue functioning.

---

## 25. Direct Perception Has Priority Over Stale Recall

When direct perception and memory are both available, legitimate current sensory evidence must not be silently replaced by stale memory.

Conceptually:

```text
direct perception
=
current evidence

memory
=
historical evidence
```

Both may influence cognition, but contradictory valid direct perception must be capable of correcting stale memory.

---

## 26. Memory Must Be Creature-Specific

Memory belongs to the individual Creature that experienced the sensory event.

M2 must not introduce global shared food memory.

Although M2 uses only one Creature, its memory architecture must support the future possibility that different Creatures possess different experiential histories.

---

## 27. Telemetry Example

Illustrative only:

```text
TICK 1

food:
  present = yes
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
```

Later:

```text
TICK 2

food:
  present = yes
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
```

Later still:

```text
memory confidence below threshold
→ memory expires
→ remembered-food activation = 0
→ SEEK loses memory-derived support
```

Exact numbers above are examples only.

Acceptance constants must be defined prospectively in implementation and must not be copied merely to guarantee a passing outcome.

---

## 28. Recommended Test Scenarios

1. Food visible → memory encoded.

2. Food occluded → memory persists.

3. Memory-guided SEEK exceeds identical memory-disabled control.

4. Creature moves according to recalled direction while food remains hidden.

5. Food starts hidden with no prior perception → no recall.

6. Memory confidence decreases across simulation ticks.

7. Memory expires → behaviour approaches control.

8. Food moves while hidden → memory remains stale.

9. Food becomes visible at a new location → memory corrects.

10. Save while food is hidden but memory active → reload → identical continuation.

11. Identical initial state/timing reproduces identical memory trace.

12. Telemetry distinguishes direct perception from recall.

13. Existing M1 tests continue passing after memory integration.

---

## 29. Required Delivery Evidence

Before M2 can be accepted, the implementation review must provide:

- files changed;
- architecture summary;
- memory-state schema;
- explanation of how memory is derived from perception;
- explanation of why memory cannot query hidden world truth;
- decay configuration;
- behavioural probe definition;
- memory-enabled results;
- memory-disabled control results;
- no-prior-perception control results;
- forgetting results;
- stale-memory experiment;
- memory-correction experiment;
- save/reload continuity result;
- deterministic replay result;
- example telemetry trace;
- known limitations;
- confirmation that M1 learning still works;
- confirmation that no prohibited shortcut is used.

---

## 30. Known Expected Limitations

A successful M2 Creature will still have extremely primitive memory.

Its memory may effectively amount to:

```text
"I recently sensed food roughly in that direction."
```

That is sufficient for M2.

M2 does not require:

```text
"I remember that yesterday you placed an apple behind the red rock and I preferred it because I was hungry."
```

That richer capability requires later systems for:

- object concepts;
- episodic representation;
- temporal representation;
- places;
- relationships;
- language;
- autobiographical state.

M2 exists to establish the smallest credible causal foundation from which those capabilities can later grow.

---

## 31. M2 Success Definition

M2 succeeds when this claim is experimentally supported:

> After directly perceiving food, the Creature can later behave differently when that food is no longer directly perceptible because an internally stored, decaying, sensory-derived memory influences its neural action-selection system.

The implementation must also rule out, within prototype scope:

- hidden access to food coordinates;
- direct target following;
- permanent behavioural flags;
- scripted remember-and-seek rules;
- current perception masquerading as memory;
- perfect non-decaying memory;
- test-only memory injection;
- global memory not owned by the Creature.

---

## 32. M2 Completion Gate

Do not begin M3 merely because a Creature appears to remember something.

M2 may be closed only after:

1. all M2 acceptance criteria pass;
2. memory-enabled behaviour is compared against controls;
3. the no-prior-perception control passes;
4. stale-memory behaviour demonstrates lack of omniscience;
5. memory correction through new perception is demonstrated;
6. deterministic forgetting is demonstrated;
7. save/reload memory continuity is demonstrated;
8. deterministic replay is demonstrated;
9. telemetry exposes the causal memory pathway;
10. existing M1 tests continue passing;
11. the implementation is reviewed for prohibited shortcuts;
12. the user explicitly accepts M2.

Until explicit acceptance, M2 remains active.