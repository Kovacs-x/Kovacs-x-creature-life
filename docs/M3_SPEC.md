# M3 Specification — First Autonomous Experience-Shaped Creature

**Milestone:** M3  
**Status:** Prospectively accepted on 2026-08-18 — implementation not started  
**Prerequisites:** M0, M1, M2 and V0 formally accepted  
**Purpose:** Establish the Creature's first genuine autonomous exploration mechanism and prove that legitimate differences in lived experience can produce persistent, causally genuine differences in later behaviour.

---

## 1. Objective

M3 responds directly to the human evidence produced by V0.

V0 established that the Creature's embodied behaviour is:

- causally genuine;
- reasonably legible;
- faithfully presented;
- inspectable through causal telemetry.

However, V0 also found that:

- perceived agency was weak;
- repeated behaviour felt deterministic and demonstration-like;
- attachment was absent;
- individual replaceability remained high;
- the Creature had little opportunity to do something unexpected;
- the abstract embodiment contributed to the impression of a test object rather than a living organism.

M3 must address those findings through genuine simulation mechanisms rather than presentation tricks or arbitrary randomness.

The central M3 question is:

**Can an embodied Creature autonomously explore through seeded stochastic behaviour, encounter different legitimate experiences, and carry consequences of those experiences forward so that its later behaviour becomes meaningfully shaped by its own history?**

M3 is not complete merely because different RNG seeds produce different movement paths.

The central M3 causal claim is:

```text
different legitimate experience histories
        ↓
different persistent internal state
        ↓
same later controlled situation
        ↓
different behaviour
```

The later behavioural difference must be attributable to accumulated experience rather than:

- immediate randomness;
- hidden Creature identity rules;
- different current biological state;
- different current memories;
- different current world state;
- hidden target information.

---

## 2. M3 Claim

M3 should establish the following narrow claim:

**The Creature can autonomously explore without hidden target knowledge, and differences in the experiences produced by that exploration can cause persistent differences in later behaviour through legitimate learning mechanisms.**

M3 does not establish:

- human-like curiosity;
- personality;
- free will;
- planning;
- general-purpose navigation;
- sophisticated episodic memory;
- language learning;
- player recognition;
- emotional attachment;
- general object understanding.

Those require later mechanisms and evidence.

---

## 3. Product Purpose

M3 is simultaneously an artificial-life milestone and a game milestone.

### Artificial-life purpose

M3 should establish:

- internally generated exploratory motivation;
- controlled seeded behavioural variation;
- target-independent autonomous movement;
- different legitimate sensory histories;
- different consequence histories;
- persistent experience-dependent neural divergence;
- later behavioural divergence caused by that history;
- deterministic reproduction when seed and external inputs are identical.

### Game purpose

M3 should make the Creature:

- less repetitive;
- less demonstration-like;
- more capable of doing something the observer did not know would happen;
- more obviously responsible for some of its own experiences;
- more interesting to watch over time;
- more meaningfully shaped by its own history;
- somewhat less replaceable after accumulating experience;
- interactable through changes to its environment without becoming directly player-controlled.

The intended progression is:

```text
M1
Creature can learn

M2
Creature can remember

V0
Creature can be seen and understood

M3
Creature can begin living differently
because of what it experiences
```

---

## 4. Core Causal Architecture

The accepted causal discipline remains mandatory.

M3 extends the existing architecture approximately as follows:

```text
internal exploration pressure
        ↓
neural exploration input
        ↓
weighted EXPLORE activation
        ↓
normal action competition
        ↓
EXPLORE selected
        ↓
seeded exploratory motor choice
        ↓
physical movement
        ↓
legitimate sensory consequences
        ↓
discovery / perception
        ↓
normal cognition and behaviour
        ↓
biological consequence
        ↓
reward
        ↓
neural learning
        ↓
persistent changed internal state
        ↓
changed later behaviour
```

Exploration must not be implemented as:

```text
random destination
        ↓
move Creature there
```

where the destination depends on hidden world knowledge.

Exploration must also not become:

```text
random chance
        ↓
perform something visually interesting
```

for presentation purposes.

Seeded randomness must operate only through explicit simulation mechanisms.

---

## 5. Primitive Homeostatic Exploration Pressure

M3 introduces a primitive internal exploration pressure.

This is not yet a sophisticated novelty or curiosity model.

The required mechanism class is:

```text
time passes without exploratory activity
        ↓
exploration pressure increases deterministically
        ↓
EXPLORE receives greater neural support
        ↓
if EXPLORE wins:
exploratory activity reduces the accumulated pressure
```

Exploration pressure must be:

- explicit;
- bounded;
- simulation-time-driven;
- deterministic except for explicitly seeded motor variation;
- serializable;
- inspectable;
- individually owned;
- independent of hidden resource positions.

M3 must prospectively define before behavioural integration:

- minimum exploration pressure;
- maximum exploration pressure;
- accumulation rate;
- reduction rule following exploratory activity;
- initial pressure;
- neural connection weight into EXPLORE.

These numeric values are not locked by this document.

They must be locked during M3.1/M3.2 before the primary behavioural results are evaluated.

They must not later be altered merely because the acceptance experiment produces an inconvenient result.

---

## 6. M3 Does Not Implement Novelty Detection

M3 exploration pressure must not depend on undeclared knowledge such as:

- whether a location is unexplored;
- whether the current area is familiar;
- a semantic map of visited regions;
- sensory novelty scoring;
- prediction error;
- hidden object novelty;
- a list of undiscovered resources.

M3 therefore does not yet implement:

```text
novelty(current sensory state, sensory history)
```

or:

```text
unexplored region
        ↓
increase curiosity
```

Those may become legitimate later mechanisms.

M3's exploration pressure is a simpler endogenous pressure to engage in exploratory activity.

---

## 7. Exploration Is Not Target Seeking

Exploration must be intrinsically target-independent.

When EXPLORE is selected, its motor direction must not be calculated from:

- food position;
- remembered food direction;
- hidden object locations;
- undiscovered-object coordinates;
- nearest-interesting-object queries;
- player pointer location;
- diagnostic object IDs;
- renderer state.

A valid exploratory movement may accidentally approach:

- food;
- an occluder;
- a boundary;
- another future object.

That approach must arise because the sampled exploratory motor choice happened to lead there.

Example:

```text
EXPLORE wins

seeded heading = northwest

Creature moves northwest

food becomes legitimately perceptible

        ↓

normal food perception

        ↓

food-related neural activation

        ↓

later SEEK may win
```

This is valid.

The following is forbidden:

```text
food exists northwest

        ↓

exploration system queries food

        ↓

"random" exploration chooses northwest
```

---

## 8. EXPLORE Must Enter Normal Action Competition

M3 extends the accepted candidate-action system with an action conceptually equivalent to:

```text
EXPLORE
```

The required route is:

```text
exploration pressure
        ↓
neural input
        ↓
weighted EXPLORE activation
        ↓
same generic competition
        ↓
selected action
```

EXPLORE must compete normally with the existing actions:

```text
IDLE
SEEK
EAT
```

There must not be an external rule equivalent to:

```text
if noFoodVisible:
    EXPLORE
```

or:

```text
if explorationPressure > threshold:
    force EXPLORE
```

outside ordinary neural/action competition.

Internal state may alter activation.

Competition determines the selected action.

---

## 9. Scope of Stochasticity

M3 does not introduce general probabilistic action selection.

The first M3 stochastic mechanism is deliberately narrower:

```text
normal action competition
        ↓
EXPLORE wins
        ↓
seeded exploratory motor variation
```

Randomness determines how an already-selected exploratory action is physically expressed.

Randomness does not randomly replace the action that won cognitive competition.

A later milestone may investigate probabilistic action selection if evidence justifies it.

M3 must not make all behaviour noisy merely to increase visible variety.

---

## 10. Seeded Exploratory Movement

When EXPLORE wins, the motor system may consume authoritative seeded RNG to select an exploratory heading or equivalent bounded motor variation.

Conceptually:

```text
EXPLORE selected
        ↓
no current exploratory heading
        ↓
consume simulation RNG
        ↓
sample exploratory heading
        ↓
ordinary movement mechanism
```

A sampled heading may persist for a bounded exploratory bout.

The implementation must prospectively define:

- heading-generation rule;
- heading persistence;
- when a new heading is sampled;
- when a heading is discarded;
- how boundaries are handled;
- how RNG consumption is ordered.

If active exploratory-heading state is retained across ticks, it must be:

- authoritative simulation state;
- serializable;
- simulation-time-driven;
- inspectable;
- restorable;
- incapable of causing movement unless EXPLORE legitimately wins.

If SEEK, EAT or IDLE wins, a retained exploratory heading must not secretly move the Creature.

---

## 11. Exploration May Fail

Exploration is not guaranteed to produce a discovery.

A valid sequence may be:

```text
EXPLORE
→ move
→ nothing new perceived
→ EXPLORE later loses competition
```

or:

```text
EXPLORE
→ move
→ boundary encountered
→ later action competition continues normally
```

This is not an M3 failure.

Exploration must be capable of failing because guaranteed success would create pressure to use hidden environmental knowledge.

M3 evaluates whether autonomous exploration **can** produce legitimate discovery under a prospectively controlled environment.

It does not require every exploratory bout to succeed.

---

## 12. Randomness Must Be Reproducible

Equivalent:

- authoritative initial state;
- RNG state;
- simulation timing;
- ordered environmental events;
- ordered player world events;

must reproduce equivalent:

- exploration-pressure evolution;
- neural activations;
- selected actions;
- RNG consumption;
- exploratory headings;
- movements;
- perceptions;
- memories;
- rewards;
- learning;
- final state;
- telemetry.

Different seeds may produce different exploratory trajectories.

The RNG state must remain authoritative simulation state.

Browser frame rate must not affect RNG consumption.

Rendering must never consume simulation RNG.

---

## 13. Minimal Environmental Opportunity

M3 must give exploration something legitimate to discover.

A larger world is not required.

The M3 controlled habitat must provide:

- one Creature;
- bounded space;
- one food/resource object compatible with the accepted perception system;
- spatial conditions in which the food is initially outside direct perception;
- sufficient space for different exploratory trajectories to either reveal or fail to reveal it;
- existing sensory occlusion where useful.

The environment should remain deliberately small.

M3 does not require:

- procedural terrain;
- multiple food categories;
- large maps;
- general rigid-body physics;
- complex ecology;
- tool use;
- multiple Creatures.

The environment exists to create meaningful consequences for autonomous exploration.

---

## 14. Operational Definition of Autonomous Discovery

For the primary M3 experiment:

**An autonomous food discovery occurs when exploration-caused physical movement changes the Creature from having no direct food perception to having legitimate direct food perception.**

The causal sequence must be observable:

```text
before:

direct food perception = null

EXPLORE wins

movement source = exploration

        ↓

Creature physically moves

        ↓

normal sensory transformation

        ↓

after:

direct food perception = non-null
```

For the controlled primary experiment, the food must not simultaneously be moved into perception by a player/environment event during the discovery transition.

The system must not contain a cognitive flag such as:

```text
discoveredFood = true
```

that bypasses sensory transformation.

Discovery means the existing sensory pathway produced legitimate new evidence because the Creature physically changed its relationship to the world.

---

## 15. Discovery Must Not Automatically Cause Seeking

Discovery produces perception.

Perception then enters the existing cognitive pathway.

Required:

```text
autonomous movement
        ↓
food becomes perceptible
        ↓
food sensory signal
        ↓
brain activation
        ↓
normal competition
        ↓
SEEK may or may not win
```

Forbidden:

```text
food discovered
        ↓
force SEEK
```

The Creature is allowed to discover food and still select another action if ordinary competition produces that outcome.

---

## 16. Existing Learning Should Produce Individual Divergence

M3 should preferentially reuse the accepted M1 learning pathway:

```text
behaviour
        ↓
biological consequence
        ↓
reward
        ↓
eligibility-based neural plasticity
        ↓
changed weights
```

Different exploration histories may therefore create different:

- perception histories;
- SEEK opportunities;
- consumption opportunities;
- biological reward histories;
- eligibility histories;
- neural weight changes.

M3 must not introduce a `personality` variable merely to force two individuals to differ.

The intended result is:

```text
same starting Creature state
+
different legitimate experience
        ↓
different learned neural state
        ↓
later behavioural divergence
```

---

## 17. Individuality Must Not Be Identity Scripting

Creature identity may exist for persistence and diagnostics.

Identity must not determine behaviour through rules such as:

```text
if creatureId == "Creature-1":
    explore left
```

or:

```text
identitySeed
        ↓
behaviour table
```

M3 individuality must arise from causal experience-dependent state.

Object and Creature IDs may remain diagnostic identifiers.

They must not encode behavioural answers.

---

## 18. Primary M3 Experiment — Phase A: Experience Acquisition

The primary experiment contains two phases.

Phase A begins with two otherwise equivalent Creature branches.

They must initially match in all relevant state, including:

- brain connection weights;
- neural activations where relevant;
- eligibility state;
- biology;
- food memory;
- exploration pressure;
- position;
- world configuration;
- learning configuration.

The branches receive different prospectively locked exploration RNG seeds.

The world geometry and external event sequence remain equivalent.

Seeded exploration should be capable of causing different legitimate experience histories.

Potential differences include:

- exploratory path;
- timing of food discovery;
- whether food is discovered during the locked experience window;
- timing of SEEK;
- consumption opportunities;
- reward history;
- neural weight changes.

The primary seed pair or predefined seed set must be locked during M3.2.

Seeds must not be searched repeatedly after observing results merely to find a visually dramatic success case.

---

## 19. Phase A Must Produce a Relevant Persistent Difference

Different movement trajectories alone are insufficient.

Before proceeding to the standardized probe, the experiment must establish whether the branches accumulated a persistent internal difference relevant to the M3 claim.

The preferred persistent difference is:

```text
different learned neural connection weights
```

caused by different legitimate reward/eligibility histories.

If Phase A produces different paths but no persistent relevant internal difference, then:

```text
different paths
≠
experience-shaped individuality
```

and the central M3 claim has not yet been established.

---

## 20. Primary M3 Experiment — Phase B: Standardized Later Probe

After the experience phase, both branches enter a controlled diagnostic probe.

The purpose is to remove immediate factors that could trivially explain behavioural divergence while preserving experience-shaped learned state.

The probe should retain from each branch:

- persistent learned neural connection weights.

Where relevant to the claimed learned effect, the probe should normalize:

- Creature position;
- hunger/energy;
- world configuration;
- food position;
- food availability;
- current direct food perceptual conditions;
- active food memory;
- eligibility trace;
- exploration pressure;
- active exploratory heading;
- RNG state;
- simulation-relative probe conditions.

The preferred M3 probe should use:

- food directly perceptible;
- food outside eating/contact range;
- no active food memory contributing independent historical information;
- equal biology;
- equal exploration contribution;
- equal immediate RNG conditions.

During the diagnostic probe, exploration must either:

- be explicitly disabled through the experimental control configuration; or
- be identically neutralized in both branches.

The probe is an experimental operation.

It is not a gameplay feature available to the player.

---

## 21. Why the Standardized Probe Uses Direct Perception

The standardized probe should preferentially use current direct food perception rather than hidden food.

This isolates learned neural history from M2 memory and immediate exploratory randomness.

The intended causal comparison becomes:

```text
same current hunger
+
same current direct food evidence
+
same current environment
+
same exploration contribution
        ↓

different learned neural weights
        ↓

different SEEK activation
and/or
different selected action
and/or
different physical behaviour
```

This is a cleaner test of experience-shaped learning than a probe requiring stale or active memory.

---

## 22. Primary M3 Metric

The primary probe configuration and behavioural threshold must be prospectively locked in M3.2.

The primary metric must include both:

### Persistent internal evidence

For example:

- different relevant learned connection weights.

### Behavioural evidence

For example:

- different SEEK activation;
- different selected action;
- different movement outcome.

M3 must not claim individuality solely because stored weights differ.

The learned difference must influence behaviour.

---

## 23. Exploration-Disabled Control

An otherwise equivalent control must disable the exploration mechanism through an explicit configuration or state condition.

The control must not receive a hidden replacement route to food.

Expected:

```text
exploration-enabled Creature
        ↓
may independently discover food

exploration-disabled Creature
        ↓
does not produce equivalent autonomous discovery
unless another legitimate mechanism explains the event
```

This establishes that autonomous exploration creates the new opportunity.

---

## 24. Learning-Disabled Control

An otherwise equivalent branch should preserve exploration and sensory discovery but disable the relevant neural learning mechanism.

This control separates:

```text
different movement histories
```

from:

```text
different learned histories
```

If persistent later divergence is attributed to learning:

```text
learning-enabled branches
        ↓
different relevant weights
        ↓
different standardized-probe behaviour
```

while:

```text
learning-disabled branches
        ↓
may explore differently
but
should not show the same claimed learned behavioural divergence
```

---

## 25. Same-Seed Replay Control

Two equivalent runs with:

- identical initial state;
- identical RNG state;
- identical external environmental events;
- identical simulation timing;

must produce the same:

- exploration pressure;
- action competition;
- exploratory motor choices;
- sensory history;
- reward history;
- learning;
- final state;
- telemetry.

This establishes reproducible seeded stochasticity.

---

## 26. Different-Seed Variation Control

Different prospectively selected seeds may produce different exploratory motor histories.

This establishes genuine behavioural variation.

However:

**Different-seed path divergence alone does not satisfy M3.**

The standardized later probe remains required.

---

## 27. Hidden-Target Adversarial Test

M3 must test against disguised target seeking.

Construct two otherwise equivalent runs with:

- same Creature state;
- same exploration pressure;
- same RNG state;
- same environment except for hidden food position.

Before the Creature legitimately perceives food:

```text
exploratory action selection
and
exploratory heading
```

must remain equivalent.

Moving an unperceived food object must not influence exploration.

The Creature may therefore explore in a direction that moves it farther away from hidden food.

That is positive evidence against omniscient exploration.

---

## 28. Experience-State Swap Adversarial Test

M3 must separate learned experience state from Creature identity.

After Phase A, establish:

```text
Identity A
+
learned neural weights A

Identity B
+
learned neural weights B
```

and first confirm the expected behavioural difference under the standardized probe.

Then construct controlled probe branches equivalent to:

```text
Identity A
+
learned neural weights B

Identity B
+
learned neural weights A
```

The rest of the standardized probe state must remain equivalent.

Immediate neural activations and eligibility traces should be normalized rather than blindly swapped with the persistent learned weights.

Expected:

```text
behaviour follows the transferred
experience-shaped learned weights
```

rather than:

```text
behaviour follows Creature identity
```

This test rejects hidden identity-based personality scripting.

---

## 29. Exploration RNG Isolation

Authoritative simulation RNG may only be consumed through documented simulation mechanisms.

The following must not consume simulation RNG:

- rendering frames;
- visual animation;
- Why/History inspection;
- telemetry recording;
- telemetry export;
- viewport changes;
- UI panel changes;
- pausing without simulation ticks;
- biography rendering.

Equivalent simulation execution with diagnostics shown or hidden must produce the same authoritative result.

---

## 30. Save / Reload Continuation

Meaningful M3 state must survive serialization.

This includes where applicable:

- simulation tick/time;
- Creature position;
- biology;
- brain;
- learned neural weights;
- eligibility state;
- M2 memory;
- exploration pressure;
- active exploratory heading;
- RNG state;
- world/resource state;
- persistent life-history entries.

A run saved during autonomous exploration and then reloaded must continue identically to uninterrupted execution within deterministic scope.

Reloading must not:

- restart exploration pressure;
- generate a new exploratory heading;
- restart RNG;
- erase learned history;
- change future RNG results.

---

## 31. Player Interaction — Food Placement / Relocation

M3 introduces one narrow player-to-world interaction:

**The player may place or relocate the existing food resource at a valid habitat location.**

The exact UI may use tap/click interaction.

Required causal pathway:

```text
player selects valid habitat location
        ↓
authoritative food/world state changes
        ↓
Creature receives no direct cognitive notification
        ↓
normal sensory transformation
        ↓
Creature may perceive, remember, fail to notice,
or later discover the food
        ↓
normal cognition and behaviour
```

Forbidden:

```text
player places food
        ↓
Creature receives food coordinates
```

or:

```text
player places food
        ↓
EXPLORE heads toward placement
```

or:

```text
player taps habitat
        ↓
force SEEK
```

Player interaction modifies circumstances.

It does not directly issue Creature cognition.

---

## 32. Food Lifecycle Scope

M3 should reuse the existing food mechanism where practical.

The player interaction must not silently expand M3 into:

- general object spawning;
- multiple simultaneous resource ecosystems;
- food categories;
- complex inventories.

If the current episode lifecycle assumes completion after food consumption, M3 implementation must resolve the minimum architectural change needed to support the controlled interaction loop without duplicating the simulation pipeline.

That change must be explicit and narrow.

---

## 33. External Event Recording

Player-generated world changes used during persistent experience should be recorded sufficiently for causal inspection and deterministic reconstruction.

At minimum, an external-event record should contain conceptually equivalent information to:

```text
simulation time
event type
affected authoritative object
resulting world change
```

Examples:

```text
T+30s
food-relocated
new world position = ...
```

The event record is not Creature cognition.

Long-term full experience replay remains a future requirement unless implementation demonstrates that more is necessary for M3 reproducibility.

---

## 34. Minimal Persistent Life History

M3 introduces a small persistent individual life-history record.

Its purpose is to make genuine accumulated experience visible to the player.

It remains separate from cognitive memory.

Each life-history entry should minimally contain:

```text
simulation time
event type
deterministically derived player-readable description
causal evidence/reference where practical
```

Potential M3 event types include:

- first autonomous exploration;
- first independently discovered food;
- first food reached following autonomous discovery;
- significant validated learning event;
- first player-relocated resource discovered without direct command.

Example:

```text
T+42s
autonomous-food-discovery
First independently discovered food.
```

Descriptions must be deterministic transformations of genuine recorded events.

---

## 35. Biography Is Not Cognitive Memory

M3 life history must remain distinct from M2 cognitive memory.

```text
Creature cognitive memory
        ≠
persistent player-facing life history
```

Life-history records may describe past events.

They must not automatically become inputs to:

- the brain;
- action competition;
- memory recall;
- movement;
- reward.

Removing the life-history UI must not change Creature behaviour.

Editing its presentation wording must not change Creature behaviour.

If autobiography later becomes cognitively meaningful, that requires a separate mechanism and claim.

---

## 36. Creature-Like Presentation Pass

M3 should improve the visible Creature alongside the new mechanism.

This is a presentation requirement.

It is not evidence for the M3 cognitive claim.

The V0 abstract circular representation should be replaced or substantially enriched with a simple organism-like representation containing enough anatomy to establish:

- a recognizable body;
- readable front/facing region;
- recognizable silhouette;
- locomotion;
- idle life;
- eating.

Possible minimal elements include:

- body mass;
- face region;
- visible eyes;
- tail, crest or sensory appendage;
- simple limb-like or body deformation during locomotion.

Production-quality character art is not required.

The goal is to reduce the impression that the Creature is merely a diagnostic token.

---

## 37. Presentation May Enrich Real State

Legitimate presentation includes:

- breathing;
- blinking;
- small idle movement;
- locomotion animation;
- eating animation after genuine eating;
- facing based on actual physical movement;
- attention cues derived from legitimate current perception where supported;
- state-dependent posture derived from real biological state.

M3 may visibly communicate exploration when:

```text
EXPLORE actually won
```

It must not fabricate:

- happiness;
- fear;
- affection;
- pride;
- boredom;
- excitement;
- loneliness;
- curiosity as an emotional interpretation.

The internal M3 mechanism is primitive exploration pressure.

The renderer must not promote that into unsupported emotional storytelling.

---

## 38. Presentation Must Remain One-Way

The V0 architectural law remains:

```text
simulation state
        ↓
presentation model
        ↓
renderer
```

Never:

```text
animation
        ↓
exploration system
```

or:

```text
renderer
        ↓
simulation RNG
```

or:

```text
visual gaze
        ↓
Creature chooses target
```

Presentation must not affect:

- exploration pressure;
- RNG state;
- action selection;
- learning;
- memory;
- biology.

---

## 39. Human Evaluation Protocol

M3 must include another human evaluation after the mechanistic experiment passes.

Developer diagnostics must initially be hidden.

The evaluation should proceed in this order:

### Phase 1 — Blind embodied observation

The observer watches and interacts with the Creature without:

- raw neural values;
- RNG state;
- hidden food information;
- developer Why/History explanation.

The observer may use the legitimate M3 player-world interaction.

### Phase 2 — Immediate interpretation

Before revealing diagnostics, record the observer's interpretation.

Questions should include:

- Did the Creature seem more capable of acting on its own than during V0?
- Did its behaviour feel less like a repeated demonstration?
- Did anything it did surprise you?
- Were you curious about where it would go or what it would discover?
- Did you want to alter the environment to see what happened?
- Did anything about its behaviour seem specific to its previous experience?
- Would replacing it with a fresh equivalent Creature now feel like losing more than during V0?
- Would you want to return to the same Creature later?
- Could you approximately understand what it was doing?

Optional numeric ratings may be collected for longitudinal comparison.

M3 does not lock an arbitrary numeric acceptance threshold.

### Phase 3 — Diagnostic reveal

After the observer gives their interpretation:

- reveal Why/History;
- reveal relevant life history;
- inspect telemetry;
- compare perceived behaviour with actual causal evidence.

### Phase 4 — Causal agreement assessment

Determine whether apparent autonomous behaviour was genuine.

Example observer interpretation:

```text
It wandered around and found food by itself.
```

Expected causal evidence:

```text
exploration pressure active
EXPLORE activation competed normally
EXPLORE won
seeded heading selected
Creature physically moved
food was not directly perceived beforehand
movement produced legitimate food perception
later SEEK competed normally
food was reached
biological reward occurred
learning changed
```

If presentation implies autonomous discovery but telemetry shows hidden target following, M3 fails.

---

## 40. Human Evaluation Success Interpretation

M3 is not required to produce strong attachment.

Attachment is expected to remain an emerging long-term property.

However, M3 exists specifically because V0 showed weak agency, low curiosity and high replaceability.

Therefore the post-M3 human evaluation should show **directional improvement in at least some of the targeted experiential dimensions**, particularly:

- perceived agency;
- surprise/uncertainty;
- curiosity;
- interaction desire;
- meaningful individuality;
- reduced replaceability.

If the mechanistic criteria pass but the human evaluation shows no directional experiential improvement at all, M3 should not automatically be considered sufficient game-design progress.

The result should trigger another evidence review.

---

## 41. Required Telemetry

M3 telemetry must make it possible to answer:

**Why did the Creature go there, what did it discover, and did that experience actually alter its later behaviour?**

Where applicable, telemetry should record:

- simulation tick/time;
- auditable RNG transition information;
- exploration pressure;
- exploration input activation;
- EXPLORE activation;
- IDLE activation;
- SEEK activation;
- EAT activation;
- selected action;
- active exploratory heading;
- whether a new heading was sampled;
- movement source;
- position before/after;
- direct perception before/after;
- active M2 memory relevant to action;
- autonomous discovery event;
- eating outcome;
- biological reward;
- eligibility state relevant to learning;
- neural weight changes;
- player/environment events;
- life-history event generation;
- standardized-probe comparison evidence.

Telemetry must remain observational.

It must not create another simulation loop.

---

## 42. Acceptance Criteria

### AC1 — Explicit Exploration Pressure

The Creature possesses an explicit primitive homeostatic exploration pressure.

It is bounded, deterministic, simulation-time-driven and independent of hidden target locations.

### AC2 — Exploration Pressure Dynamics

Time without exploratory activity changes the exploration pressure according to prospectively locked rules.

Legitimate exploratory activity reduces the accumulated pressure according to prospectively locked rules.

### AC3 — Neural Exploration Integration

Exploration pressure influences EXPLORE through the accepted weighted neural/action architecture.

EXPLORE cannot bypass ordinary action competition.

### AC4 — Seeded Exploratory Motor Variation

When EXPLORE wins, exploratory motor variation uses authoritative seeded simulation RNG.

No unseeded randomness is used.

### AC5 — Target Independence

Exploratory heading selection does not inspect hidden food position, remembered food direction, renderer state or undiscovered-object data.

### AC6 — Legitimate Autonomous Discovery

Exploration-caused physical movement can transform:

```text
direct food perception = null
```

into:

```text
direct food perception = valid sensory signal
```

through the ordinary sensory pipeline.

### AC7 — Normal Post-Discovery Cognition

Discovery does not directly cause SEEK or movement toward food.

Current perception participates through normal neural/action competition.

### AC8 — Competitive Behaviour

IDLE, SEEK, EAT and EXPLORE compete through the normal action-selection mechanism.

### AC9 — Exploration-Disabled Control

An otherwise equivalent exploration-disabled branch does not produce equivalent autonomous discovery unless another legitimate mechanism explains the event.

### AC10 — Same-Seed Determinism

Identical state, seed and external events reproduce identical exploration, learning, telemetry and final state.

### AC11 — Different-Seed Behavioural Variation

Prospectively controlled different seeds can produce different legitimate exploratory histories.

This criterion alone does not establish experience-shaped individuality.

### AC12 — Experience-Dependent Persistent State

Different legitimate experience histories produce a persistent relevant internal difference, preferably in learned neural connection weights.

### AC13 — Standardized Later Behavioural Divergence

After normalizing current state and immediate stochastic effects, different historical branches show a measurable behavioural difference attributable to their persistent experience-shaped state.

This is the central M3 acceptance criterion.

### AC14 — Learning Control

A learning-disabled equivalent control does not show the same claimed persistent learned divergence.

### AC15 — Identity Independence

The experience-state swap test demonstrates that behavioural divergence follows learned state rather than Creature identity.

### AC16 — Hidden-Target Adversarial Test

Changing only an unperceived food position does not alter exploration action or heading before legitimate sensory evidence occurs.

### AC17 — Exploration Failure Is Permitted

Exploration is capable of producing no discovery.

The system does not secretly guarantee success.

### AC18 — RNG Isolation

Rendering, telemetry, UI inspection and non-simulation operations do not consume authoritative simulation RNG.

### AC19 — Persistence

Exploration pressure, relevant learned state, active exploration state and RNG state survive meaningful serialization.

Save/reload continuation matches uninterrupted continuation.

### AC20 — Player Interaction Boundary

Player food placement/relocation modifies authoritative world state only.

It does not directly command cognition, memory or movement.

### AC21 — External Event Evidence

Player world events required to understand M3 causal history are recorded in deterministic order with sufficient contextual information.

### AC22 — Life-History Separation

Persistent life-history entries derive from genuine events and do not influence cognition.

### AC23 — Presentation Separation

Creature-like visual enrichment remains downstream of authoritative state and does not alter simulation behaviour.

### AC24 — Telemetry

Telemetry is sufficient to reconstruct exploration, discovery, consequence, learning and later behavioural divergence.

### AC25 — Human Evaluation

A diagnostics-hidden post-M3 human evaluation is conducted against the V0 evidence.

It examines:

- agency;
- surprise;
- curiosity;
- interaction;
- individuality;
- attachment;
- replaceability;
- legibility.

---

## 43. Formal Failure Conditions

M3 must not be accepted if any of the following are true:

### Mechanistic failure

```text
same state
+
same seed
+
same external events
```

fails deterministic replay.

### Hidden-target failure

Exploration changes merely because an unperceived food object's hidden position changes.

### Discovery failure

The prospectively locked M3 experiment cannot demonstrate legitimate exploration-caused food discovery.

### Experience failure

Different exploratory histories produce no persistent internal difference relevant to later behaviour.

### Persistence-of-effect failure

The experience-dependent difference disappears when immediate current conditions are normalized.

### Behavioural failure

Persistent experience-shaped state differs but produces no measurable behavioural consequence in the locked standardized probe.

### Learning-control failure

A learning-disabled control produces the same claimed learned divergence.

### Identity failure

Behaviour follows Creature ID rather than transferred learned experience state.

### Persistence failure

Save/reload changes future exploratory RNG behaviour, exploration state or learned behavioural outcome.

### Presentation-boundary failure

Renderer, UI, biography or telemetry influences Creature cognition.

### Product failure

The mechanistic milestone passes but human evaluation shows no directional improvement at all in agency, curiosity or meaningful individuality relative to V0.

In that case, the implementation evidence remains useful, but the project must conduct another design review before treating M3 as sufficient progress toward the game experience.

---

## 44. Forbidden Shortcuts

M3 fails if success depends on any mechanism equivalent to:

```text
if food not visible:
    move randomly toward food
```

```text
EXPLORE = target nearest unseen resource
```

```text
random chance:
    perform interesting animation
```

```text
if creatureId == X:
    choose distinctive behaviour
```

```text
player taps food:
    Creature receives food coordinates
```

```text
player taps Creature:
    force EXPLORE
```

```text
different seed
        ↓
claim personality
```

without persistent experience-dependent evidence.

Also forbidden:

- unseeded simulation randomness;
- renderer-controlled randomness affecting cognition;
- hidden finite-state exploration scripts;
- test-only discovery paths;
- omniscient unexplored-object lookup;
- hidden navigation toward unknown resources;
- direct random modification of neural weights merely to create individuality;
- arbitrary personality parameters introduced only to differentiate individuals;
- biography text influencing cognition;
- fabricated emotional animation;
- tests that only compare final positions;
- acceptance based solely on different paths;
- arbitrary tuning solely to force the primary experiment to pass.

---

## 45. Scope Exclusions

M3 does not require:

- sensory novelty detection;
- explored/unexplored region maps;
- prediction error;
- multiple competing biological needs;
- thirst;
- fatigue;
- fear;
- trust;
- attachment as an internal mechanism;
- player recognition;
- named personality traits;
- language;
- commands;
- joint attention;
- general object categories;
- affordance learning;
- manipulation;
- carrying;
- pushing;
- tool use;
- multiple Creatures;
- social interaction;
- reproduction;
- genetics-driven behavioural variation;
- structural neural plasticity;
- planning;
- predictive world models;
- sophisticated navigation;
- production-quality creature art.

These remain future milestone candidates.

---

## 46. Architectural Constraint — Continue Toward One Simulation Tick

M3 must not introduce another independent simulation loop.

Continue toward the reusable architecture:

```text
authoritative state
        ↓
one simulation tick
        ↓
new authoritative state
```

Existing accepted:

- biology;
- sensory processing;
- brain evaluation;
- action competition;
- movement;
- memory;
- reward;
- plasticity;
- V0 habitat/environment mechanisms;

should be reused or narrowly consolidated.

Exploration becomes another legitimate subsystem participating in the same authoritative transition.

The browser continues to consume simulation output rather than implement Creature cognition.

---

## 47. Prospective Locking Rule

Before the primary behavioural experiment is evaluated, M3 must lock:

### Exploration mechanism

- initial exploration pressure;
- minimum/maximum pressure;
- accumulation rate;
- reduction rule;
- exploration neural weight.

### Motor stochasticity

- heading-generation algorithm;
- RNG consumption rule;
- heading persistence;
- boundary behaviour.

### Environment

- habitat geometry;
- food starting state/location;
- Creature starting state/location;
- perception/occlusion arrangement.

### Experiment

- primary acquisition seed pair or predefined seed set;
- experience-phase duration or stopping rule;
- discovery metric;
- standardized later probe;
- probe normalization procedure;
- primary neural metric;
- primary behavioural metric.

### Controls

- exploration-disabled control;
- learning-disabled control;
- same-seed control;
- different-seed control;
- hidden-target adversarial test;
- experience-state swap test.

If implementation reveals a genuine architectural or mathematical flaw, the locked contract may be revised with an explicit documented reason.

It must not be quietly altered after seeing results solely to obtain acceptance.

---

## 48. Recommended Implementation Order

### M3.1 — Pure Exploration Mechanism

Implement and test:

- exploration-pressure state;
- deterministic accumulation;
- deterministic reduction;
- bounds;
- serialization;
- seeded heading generation primitive;
- heading-state persistence where required;
- same-seed replay.

Do not connect exploration to behaviour yet.

### M3.2 — Prospectively Lock Behavioural Contract

Before EXPLORE enters the brain, commit the experimental contract covering:

- exploration constants;
- exploration neural weight;
- heading rules;
- environment geometry;
- autonomous-discovery definition;
- primary acquisition seed pair/set;
- experience-phase rule;
- standardized probe;
- normalization procedure;
- primary metrics;
- controls;
- adversarial tests.

This stage occurs before seeing the final integrated behavioural outcome.

### M3.3 — Neural Action Integration

Add EXPLORE to normal weighted action competition.

Prove:

```text
exploration pressure
        ↓
neural input
        ↓
EXPLORE activation
        ↓
normal competition
```

No direct exploration command.

### M3.4 — Autonomous Exploratory Movement

Connect seeded exploratory heading to physical movement only after EXPLORE wins.

Verify:

- RNG isolation;
- target independence;
- heading persistence;
- boundary handling.

### M3.5 — Environmental Discovery

Implement the prospectively defined discovery environment.

Prove:

```text
EXPLORE
→ physical movement
→ legitimate new perception
```

and run the hidden-target adversarial control.

### M3.6 — Experience Acquisition Experiment

Run the locked Phase A branches.

Demonstrate:

```text
different seeded exploration
→ different legitimate experience
→ different reward / eligibility history
→ different persistent learned state
```

### M3.7 — Standardized Individuality Probe

Construct the locked normalized later probe.

Demonstrate:

```text
same current controlled situation
+
different experience-shaped learned state
        ↓
different later behaviour
```

Run:

- learning-disabled control;
- experience-state swap adversarial test.

### M3.8 — Player World Interaction

Add the narrow food placement/relocation interaction.

Verify:

```text
player changes world
→ normal perception
→ normal cognition
```

with no cognitive shortcut.

### M3.9 — Creature Presentation and Life History

Introduce:

- more creature-like embodiment;
- state-faithful animation;
- persistent causal life-history entries.

Verify both remain downstream of simulation.

### M3.10 — Determinism, Persistence and Telemetry

Complete:

- save/reload exploration continuity;
- RNG continuation;
- deterministic replay;
- external-event records;
- complete M3 telemetry;
- life-history persistence;
- diagnostics isolation.

### M3.11 — Behavioural and Human Evaluation

Conduct:

- full automated behavioural experiment;
- locked controls;
- adversarial tests;
- diagnostics-hidden human evaluation;
- comparison against V0 findings;
- causal diagnostic reveal afterward.

### M3.12 — Formal Audit

Before acceptance:

1. run complete type checking;
2. run all automated tests;
3. verify M0/M1/M2/V0 regressions;
4. inspect source for prohibited shortcuts;
5. inspect RNG use and isolation;
6. inspect persistence evidence;
7. inspect Phase A experience evidence;
8. inspect standardized Phase B probe evidence;
9. inspect learning and identity controls;
10. inspect human-evaluation evidence;
11. conduct independent adversarial review;
12. audit against this prospectively locked specification;
13. require explicit user acceptance.

---

## 49. Validation Order

Repository validation remains:

```text
npm run typecheck
```

then:

```text
npm test
```

Both must pass before an M3 implementation stage is treated as complete.

Existing accepted behaviour must remain passing unless an explicit and justified specification change intentionally supersedes it.

---

## 50. M3 Success Standard

M3 must not be accepted because:

```text
the Creature looks more alive
```

or:

```text
the Creature moves unpredictably
```

or:

```text
different seeds produce different paths
```

or:

```text
the observer says it looks intelligent
```

Those may be useful observations, but they are insufficient.

The central mechanistic success condition is:

```text
autonomous seeded exploration
        ↓
different legitimate lived experience
        ↓
persistent causal learned difference
        ↓
same later controlled situation
        ↓
different later behaviour
```

The central game-design success question is:

**Does making the Creature responsible for more of its own experience make it feel more autonomous, more interesting to observe and more like a particular individual whose history is worth preserving?**

M3 therefore represents the first deliberate transition from:

**an embodied artificial-life demonstration**

toward:

**an individual artificial Creature whose own experiences begin to make its future meaningfully different.**