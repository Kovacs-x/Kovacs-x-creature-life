# M1 Specification - First Adaptive Creature

**Milestone:** M1  
**Status:** Active after M0 scaffold approval  
**Purpose:** Prove the core artificial-life learning loop before adding feature breadth or presentation complexity.

## Objective

Create one hungry Creature in a minimal 2D world containing one food object. The Creature must perceive the food, process its internal hunger, select a food-seeking action through an adaptive simulation pipeline, move to the food, consume it, experience a biological improvement, and update learned connection state through reinforcement.

A successful animation is insufficient. M1 must demonstrate measurable learning against a control.

## Required modules

Minimum expected conceptual modules:

- simulation clock/tick
- seeded RNG
- world + food object
- Creature serialisable state
- minimal Genome/init parameters
- Biology: hunger + energy
- Senses: food/vision + internal hunger
- Brain: neurons/nodes + weighted connections + activation
- Drives/valuation: hunger influence
- Action candidates: idle, move/seek, eat
- World interaction/contact
- Reinforcement/learning
- Telemetry
- save/load round-trip representation

Exact filenames may differ if the architecture review gives a better reasoned structure.

## Causal chain

```text
food visible + hunger
        -> sensory/internal activation
        -> concept/association processing
        -> hunger-weighted candidate actions
        -> seek/move selected
        -> movement toward perceived target
        -> contact
        -> eat action
        -> food removed/consumed
        -> hunger reduced / energy improved
        -> reward derived from consequence
        -> active relevant connection changes
```

## Acceptance criteria

### AC1 - Perception

Food inside defined sensory range produces a food sensory signal with position/direction information appropriate to the prototype. Food outside range does not.

### AC2 - Biology

Hunger changes over simulation time and is measurably reduced by eating. The UI cannot directly set hunger as part of the behaviour path.

### AC3 - Action competition

At low hunger, food-seeking activation is lower. At high hunger with food perceived, the food-seeking candidate receives higher valuation through the simulation pipeline. The selected action is the result of candidate competition, not an apple-specific conditional.

### AC4 - Movement

The selected movement action advances Creature position toward the perceived/selected target while respecting world bounds.

### AC5 - Consumption

Eating requires appropriate contact/range. Successful eating consumes/removes/depletes the food object and changes biological state.

### AC6 - Reinforcement

The positive biological consequence of eating produces a reward signal. At least one relevant recently active learned connection changes weight because of that reward.

### AC7 - Learning control

Run an equivalent control with learning disabled, reward withheld, or the critical experience withheld. The control must not show the same connection update or behavioural improvement.

### AC8 - Behavioural improvement

Across repeated controlled trials, the learning-enabled Creature should improve a defined metric such as time-to-food, successful food selection, or correct food-seeking rate relative to its naive baseline/control. Do not pick a metric after seeing the result; define it in the test first.

### AC9 - Determinism

A fixed seed, identical initial state, and identical input/timing stream reproduce the same trace within the project's deterministic scope.

### AC10 - Serialisation

World + Creature + brain weights + biology + RNG state round-trip through serialisation without changing meaningful state.

### AC11 - Telemetry

A debug trace can show at least:

- perceived food signal;
- hunger value;
- relevant brain/concept activation;
- candidate action activations/scores;
- selected action;
- eating consequence;
- reward magnitude;
- connection weight before/after.

## Forbidden shortcuts

M1 is rejected if success depends on:

- `if appleVisible then walkToApple()`;
- `if hungry then chooseFood()` bypassing brain/action competition;
- React or renderer directly commanding the creature to move/eat;
- a hidden state machine that implements the entire sequence;
- an LLM or text prompt deciding the action;
- a special `learnApple()` function that sets the correct connection;
- direct target coordinates treated as learned cognitive map knowledge;
- non-seeded random calls in simulation code;
- tests that assert only final animation/state without proving causal intermediate steps.

## Recommended test scenarios

1. Food visible / high hunger.
2. Food visible / low hunger.
3. Food out of sensory range.
4. Food removed before arrival.
5. Learning enabled repeated trials.
6. Learning disabled control.
7. Save midway through approach, reload, continue.
8. Fixed-seed replay.

## Required delivery evidence

Codex should report:

- files changed;
- architecture summary;
- tests added and passing;
- behavioural trial results;
- control comparison;
- example telemetry trace;
- known limitations;
- confirmation that no prohibited shortcut was used.

## M1 completion gate

Do not begin M2 until the user explicitly accepts M1 based on the above evidence.
