# Creature Life — V0 Specification

## Creature Embodiment Vertical Slice

**Status:** Prospective specification  
**Milestone:** V0 — Creature Embodiment Vertical Slice  
**Accepted baseline:** M2 — First Persistent Memory-Guided Creature  
**Repository:** Kovacs-x/Kovacs-x-creature-life

---

## 1. Purpose

V0 is the first embodiment phase of Creature Life.

M0 established the simulation foundation.

M1 established adaptive neural behaviour.

M2 established primitive persistent sensory-derived memory.

V0 asks a different question:

**Can the accepted Creature become visible, understandable and worth observing without presentation replacing or falsifying its underlying simulation?**

V0 is not primarily another cognitive milestone.

It is a minimal vertical slice that places the accepted organism into a visible habitat and begins evaluating:

- legibility;
- agency;
- attachment;
- meaningful individuality;
- causal fidelity.

The purpose is to learn what embodiment reveals before automatically adding more headless cognitive complexity.

---

## 2. V0 Claim

V0 should demonstrate that:

**A player can observe one embodied Creature acting inside a minimal habitat, and the visible behaviour remains a faithful presentation of authoritative simulation state and recorded causal evidence.**

The Creature's visible behaviour must originate from the accepted simulation mechanisms.

Presentation may make those mechanisms easier to perceive.

Presentation must not manufacture cognitive behaviour that does not exist.

---

## 3. Two Layers of V0 Success

V0 has two separate success layers.

### 3.1 Functional acceptance

The implementation must prove that:

- the accepted simulation runs through a visible presentation;
- simulation state remains authoritative;
- rendering does not control cognition;
- Creature position and behaviour visibly correspond to simulation output;
- food and environmental occlusion are represented;
- memory-guided behaviour can be observed;
- causal telemetry can be inspected;
- UI controls do not directly issue Creature actions;
- deterministic and accepted M1/M2 behaviour remains intact.

These requirements are testable.

### 3.2 Human evaluation

V0 must also begin gathering evidence about:

- whether behaviour is understandable;
- whether the Creature feels autonomous;
- whether the player wants to continue observing it;
- whether its accumulated history appears meaningful;
- whether replacing it with a fresh equivalent individual would matter.

These questions are partly experiential.

V0 will not invent an arbitrary percentage threshold for them.

The first evaluation should produce evidence and design direction rather than pretend to establish commercial certainty.

---

## 4. Architectural Law

Simulation remains authoritative.

Required direction:

```text
simulation state
    ↓
presentation model
    ↓
rendering / animation / UI
```

Never:

```text
animation state
    ↓
Creature cognition
```

or:

```text
UI button
    ↓
force SEEK / MOVE / EAT
```

or:

```text
renderer
    ↓
hidden world information
    ↓
Creature brain
```

Presentation is an observer and visual interpreter of simulation state.

It is not a second cognitive system.

---

## 5. Authoritative Simulation Transition

V0 must reuse the accepted stepped simulation path.

Conceptually:

```text
authoritative state
    ↓
one simulation tick
    ↓
new authoritative state
```

V0 must not duplicate M1/M2 cognition, memory, learning, perception or action selection in a presentation-specific simulation loop.

A higher-level habitat or application controller may:

- hold the authoritative state;
- apply legitimate environmental inputs;
- request one simulation tick;
- record telemetry;
- hand the resulting state to presentation.

It must delegate Creature behaviour to the accepted simulation mechanisms.

---

## 6. Simulation Time and Rendering Time

Simulation time and rendering time must remain distinct.

The accepted Creature currently advances using fixed simulation ticks.

V0 may render more frequently than the simulation updates.

For example:

```text
simulation:
1 fixed authoritative tick

presentation:
many visual frames between authoritative states
```

Visual interpolation is allowed.

Interpolation may smooth:

- position;
- orientation;
- camera movement;
- animation.

Interpolated values must never be written back into authoritative simulation state.

Wall-clock frame timing must not alter:

- memory age;
- neural activation;
- hunger;
- learning;
- action selection;
- simulation movement distance.

Pause means:

```text
no simulation ticks
```

Single-step means:

```text
exactly one simulation tick
```

---

## 7. V0 Habitat Scope

The first habitat contains only:

- one Creature;
- one food object;
- simple world boundaries;
- one static sensory occluder;
- a camera or viewport capable of showing the relevant habitat;
- minimal developer controls;
- a Why/History inspector.

No second Creature is required.

No general object system is required.

No production-scale world is required.

---

## 8. Habitat Coordinates

The visible habitat should map consistently from simulation coordinates into screen coordinates.

The renderer may scale or transform the view.

For example:

```text
simulation x/y
    ↓
camera transform
    ↓
screen x/y
```

The camera transform must not alter simulation positions.

Simulation bounds remain authoritative.

Presentation should not maintain a separate hidden physical position for the Creature.

---

## 9. Creature Presentation

The first Creature representation may be visually simple.

Production-quality character art is not required.

The representation should make at least these things legible:

- Creature position;
- whether it is moving;
- approximate movement direction;
- whether it is idle;
- whether an eating event occurred;
- approximate biological hunger or energy state.

Natural presentation enrichment is allowed.

Examples:

- subtle breathing;
- blinking;
- small idle motion;
- locomotion animation;
- orientation following actual movement;
- eating animation following a genuine eating event.

These are presentation.

They do not require separate neural control.

However, presentation must not invent unsupported internal states.

Examples of prohibited presentation:

```text
no fear mechanism
→ terrified animation
```

```text
no memory
→ purposeful remembered-search animation
```

```text
IDLE selected
→ renderer visibly moves Creature toward food
```

Visual behaviour must not create false evidence of cognition.

---

## 10. Creature Orientation

Basic facing/orientation may be derived from actual physical displacement.

For example:

```text
new position - previous position
→ visible facing direction
```

If the Creature does not move, presentation must not infer a hidden target merely to make it look purposeful.

A future attention or gaze system may use legitimate perceptual or cognitive evidence.

V0 does not require one.

Developer overlays may separately display:

- perceived direction;
- remembered direction;
- movement direction source.

Those overlays are diagnostic and must be clearly distinguished from the Creature's physical orientation.

---

## 11. Food Presentation

Food presentation must derive from authoritative food state.

The renderer may display:

- food position;
- whether food remains available;
- consumption.

If food is consumed in simulation, the renderer must not continue presenting it as available.

The visual representation of food must not feed target information back into cognition.

---

## 12. Static Sensory Occluder

V0 must contain one genuine sensory occluder.

This first occluder is deliberately narrow.

Its purpose is:

**to make the accepted M2 perception → occlusion → memory pathway observable in an embodied environment.**

V0 does not require a general rigid-body obstacle system.

The occluder may therefore function as a sensory screen rather than a solid collision object.

If it does not physically block locomotion, its visual design must not misleadingly imply that it is a solid wall.

---

## 13. Occlusion Must Be Causal

The occluder must not be merely decorative.

Required direction:

```text
Creature position
+
food position
+
occluder state / geometry
    ↓
simulation-side visibility calculation
    ↓
food perceptible or occluded
    ↓
existing food perception mechanism
```

Not:

```text
renderer draws something over food
    ↓
assume Creature cannot see food
```

The renderer must not decide sensory availability.

If the existing `foodOccluded` episode field remains the immediate sensory input during V0, its value must be produced by authoritative habitat/environment logic rather than by visual rendering code.

A pure deterministic line-of-sight or equivalent visibility calculation is sufficient.

---

## 14. Occluder Physics Boundary

V0 does not require the sensory occluder to:

- stop Creature movement;
- participate in collision physics;
- be movable;
- be pushable;
- be carried;
- be learned as an affordance.

If collision is not implemented, the object must be presented as a sensory screen, curtain, mist barrier or other representation that does not falsely imply unsupported solid-body physics.

General obstacle physics belongs to a later mechanism if it becomes necessary.

---

## 15. Controlled V0 Memory Scenario

V0 should include one reproducible demonstration scenario capable of exposing accepted M2 memory behaviour visibly.

Conceptually:

```text
initial state:
Creature hungry
food visible
memory enabled

first experience:
Creature legitimately perceives food
memory forms

environmental change:
occluder removes direct perception

later tick:
direct food perception absent
memory recall available
remembered-food neural input active
SEEK competes normally
if SEEK wins:
Creature moves using recalled direction
```

The environmental transition may be triggered by:

- a deterministic scenario schedule; or
- an explicit developer world control.

Either is acceptable.

It must modify environmental/sensory conditions.

It must not modify:

- memory contents;
- brain activations;
- selected action;
- movement command.

A controlled scenario is allowed.

A scripted Creature response is not.

---

## 16. Baseline Visible-Food Scenario

V0 should also retain a simple direct-perception scenario.

Conceptually:

```text
food visible
→ legitimate perception
→ neural food input
→ normal competition
→ SEEK
→ movement
→ contact
→ EAT
```

This gives the player a simple behavioural baseline before observing memory-guided behaviour.

---

## 17. UI Control Boundary

Initial V0 developer controls may include:

- play;
- pause;
- single simulation step;
- reset scenario;
- switch between predefined demonstration scenarios;
- show/hide developer inspector;
- show/hide diagnostic overlays.

These controls may affect:

- simulation execution;
- scenario configuration;
- environmental state;
- presentation.

They must not directly set:

- selected action;
- SEEK activation;
- Creature position;
- hunger;
- food memory;
- recalled direction;
- neural weights.

If a developer control changes the world, the world change must then flow through normal perception and cognition.

---

## 18. No Direct Player Commands Into Cognition

V0 must not include controls equivalent to:

```text
Seek food
```

```text
Remember this
```

```text
Go east
```

```text
Eat
```

```text
Be happy
```

The player may eventually influence the Creature through environmental affordances.

That is different from directly issuing internal cognitive outcomes.

---

## 19. Developer Why / History Inspector

V0 must begin a developer-facing Why/History inspector.

Its purpose is causal debugging.

For a recent tick or selected recent history entry, it should expose available evidence such as:

- simulation tick;
- simulation time;
- Creature position;
- biological hunger / energy;
- food position and availability;
- food occlusion status;
- current direct food perception;
- active food memory;
- remembered direction;
- memory age;
- memory confidence;
- recalled memory signal;
- direct-food neural activation;
- remembered-food neural activation;
- IDLE activation;
- SEEK activation;
- EAT activation;
- selected action;
- movement direction source;
- memory encoding;
- memory refresh;
- memory correction;
- memory decay;
- memory expiration;
- eating result;
- biological reward;
- learning changes when available.

The inspector should prefer recorded causal facts over inferred narrative.

---

## 20. Human-Readable Why Statements

V0 may generate simple readable explanations from telemetry.

For example:

```text
The Creature currently sees food and SEEK won.
```

or:

```text
The Creature cannot currently see the food.
It has a usable memory of food in this direction.
That memory increased SEEK activation.
SEEK won and movement used remembered direction.
```

These explanations must be deterministic transformations of recorded state and telemetry.

They must not be generated as free-form invented explanations of why the Creature acted.

An LLM must not be used to infer Creature motives.

---

## 21. Inspector Separation

Developer diagnostics must be visually distinguishable from ordinary habitat presentation.

This matters because:

- raw memory arrows;
- action activations;
- hidden food state;
- internal confidence;

are useful for debugging but may make behaviour artificially easy for a player to interpret.

Legibility evaluation should therefore be possible with the diagnostic overlay turned off.

The inspector may then be enabled afterward to compare:

```text
what the observer believed
```

against:

```text
what the causal record shows
```

---

## 22. Bounded Telemetry History

V0 should maintain a bounded recent telemetry history for inspection.

The history must not grow indefinitely.

The exact capacity does not need to be permanently fixed by this specification.

It should be:

- deterministic in ordering;
- bounded;
- large enough for the current experiment;
- presentation/debug state rather than a new cognitive memory.

Telemetry history is not Creature memory.

---

## 23. Telemetry Export

The Why/History tooling should support exporting a bounded machine-readable trace.

JSON is sufficient.

The export should contain enough information to reconstruct the causal story of the selected recent interval.

A trace should make questions such as these answerable:

```text
Did the Creature see food?

Was food occluded?

Was recall available?

How old was the memory?

How confident was it?

Which action candidates competed?

Which action won?

Did movement come from direct perception or memory?

Did eating occur?

Did learning change?
```

The export is a debugging and evaluation artifact.

It must not alter the simulation.

---

## 24. Presentation State

Presentation may maintain transient state such as:

- animation phase;
- interpolation progress;
- camera transform;
- panel visibility;
- selected telemetry entry;
- hover/focus state.

This state is not authoritative Creature state.

It does not need to be serialized as part of the Creature's cognition.

Presentation state must never become an undeclared cognitive memory store.

---

## 25. Persistence

V0 must preserve the accepted M2 persistence behaviour.

Adding a browser presentation must not break:

- food memory serialization;
- simulation time;
- neural state;
- eligibility state;
- deterministic continuation.

A polished save/load user interface is not required for the first V0.

The existing simulation persistence contract must continue passing tests.

---

## 26. Determinism

For equivalent authoritative initial state and equivalent ordered environmental inputs:

```text
simulation results
```

must remain deterministic within the already accepted deterministic scope.

Browser frame rate must not change authoritative outcomes.

Examples:

```text
30 FPS presentation
```

and:

```text
120 FPS presentation
```

must not cause different Creature cognition merely because rendering frequency differs.

Only simulation ticks affect the Creature.

---

## 27. Mobile / Browser Direction

V0 should be browser-first.

The first slice should remain usable at a phone-sized viewport because development and evaluation may occur from mobile browsers.

This does not require production mobile optimisation.

At minimum:

- the habitat should remain visible;
- controls should remain usable;
- the inspector should not permanently obscure the habitat;
- the layout should not require a desktop-sized screen.

Performance optimisation should follow measurement rather than speculation.

---

## 28. Rendering Technology

This specification does not lock a large rendering engine.

The repository currently has no committed rendering framework.

The implementation should choose the smallest browser presentation technology that can satisfy V0.

Possible approaches include:

- Canvas 2D;
- SVG;
- DOM/CSS;
- a lightweight browser rendering library.

A full game engine should not be introduced solely because one may eventually be useful.

The technology choice should be based on:

- simple 2D rendering;
- mobile/browser usability;
- deterministic simulation separation;
- development speed;
- inspectability;
- low architectural lock-in.

The technology decision belongs at the beginning of V0 implementation after this behavioural/presentation contract is committed.

---

## 29. V0 Implementation Order

### V0.1 — Presentation contract

Create a pure presentation/view-model boundary derived from authoritative simulation state.

Prove that:

```text
simulation state
→ presentation model
```

contains no reverse cognitive dependency.

Initial tests should cover state-to-presentation transformation.

### V0.2 — Minimal browser habitat

Add the smallest browser application capable of displaying:

- habitat bounds;
- Creature;
- food;
- current state.

No sophisticated animation is required yet.

### V0.3 — Fixed-step application controller

Connect:

```text
play / pause / step
→ authoritative simulation tick
→ new state
→ presentation
```

Rendering frequency remains separate from simulation time.

### V0.4 — Sensory occluder

Add the single simulation-side sensory occluder.

Prove that:

- visibility is derived outside the renderer;
- direct perception disappears appropriately;
- existing M2 memory behaviour remains causal.

### V0.5 — Why / History

Connect M1/M2 causal telemetry to:

- current debug state;
- recent bounded history;
- action competition;
- memory source;
- movement source;
- biological and learning consequences.

Add bounded JSON export.

### V0.6 — Legible presentation

Add only enough visual enrichment to communicate genuine state:

- idle;
- locomotion;
- eating;
- hunger;
- direct-perception versus memory scenario context.

Do not add unsupported emotional states.

### V0.7 — Human evaluation

Run the vertical slice with diagnostic overlays initially hidden.

Evaluate:

- legibility;
- agency;
- attachment;
- individual replaceability.

Then compare those interpretations with causal telemetry.

Use the results to decide the next environmental or cognitive requirement.

---

## 30. Acceptance Criteria

### AC1 — Visible Habitat

A browser can display:

- one Creature;
- food;
- habitat boundaries;
- one sensory occluder.

### AC2 — Authoritative Position

The displayed Creature position is derived from authoritative simulation state.

Presentation cannot independently move the Creature.

### AC3 — Fixed Simulation Time

Simulation advances through explicit fixed simulation ticks.

Wall-clock rendering frequency does not alter cognition or memory ageing.

### AC4 — Accepted Behaviour Remains Visible

The embodied Creature visibly exhibits accepted behaviour such as:

- direct food seeking;
- movement;
- eating when legitimate conditions permit.

### AC5 — Genuine Occlusion

The static occluder affects direct food perception through simulation/environment logic.

The effect is not merely graphical.

### AC6 — Visible Memory-Guided Behaviour

In the controlled memory scenario:

- food was legitimately perceived first;
- direct perception later becomes absent;
- usable recall remains;
- remembered-food neural activation occurs;
- SEEK still competes normally;
- if SEEK wins, visible movement follows the recalled direction.

The visible result must agree with causal telemetry.

### AC7 — No Presentation-to-Cognition Shortcut

No renderer, animation or UI module directly supplies:

- Creature action;
- memory;
- target coordinates;
- neural activation;
- remembered direction.

### AC8 — Why / History

The developer can inspect recent causal evidence sufficient to answer why the Creature behaved as it did.

### AC9 — Direct / Memory / Neither Distinction

The inspector can distinguish whether food-related behaviour was supported by:

- current direct perception;
- recalled memory;
- neither.

### AC10 — Safe Controls

Play, pause, step and reset operate through legitimate simulation/application boundaries.

They do not directly command Creature cognition.

### AC11 — Bounded Trace Export

A bounded machine-readable recent causal trace can be exported without affecting simulation state.

### AC12 — Regression Safety

All accepted M1 and M2 tests continue passing.

New V0 tests also pass.

Validation remains:

```text
npm run typecheck
npm test
```

### AC13 — Deterministic Presentation Integration

Given identical initial authoritative state and identical ordered environmental inputs, simulation results remain identical regardless of presentation frame rate.

### AC14 — Mobile-Usable Slice

The primary habitat and essential controls are usable from a phone-sized browser viewport.

Production mobile optimisation is not required.

### AC15 — Human Evaluation Completed

At least one real evaluation session is conducted with diagnostic overlays initially hidden.

The session records observations about:

- legibility;
- agency;
- attachment;
- individual replaceability.

There is no arbitrary numeric pass threshold.

The results must be used in the V0 completion decision.

---

## 31. Evaluation Questions

The first observer should be asked questions such as:

### Legibility

- What do you think the Creature is doing?
- Could you tell when it was hungry?
- Could you tell when it was seeking food?
- Did you notice a behavioural difference after food became hidden?
- Did any behaviour appear confusing or misleading?

### Agency

- Did its behaviour feel self-generated or like a canned animation?
- Did anything feel directly commanded by the interface?
- Did the Creature ever surprise you while still making causal sense?

### Attachment

- Did you want to continue watching it?
- Did you feel any desire to help or interact with it?
- Were you curious what it might do next?
- Did it feel like an entity rather than a moving marker?

### Individual replaceability

- If this Creature were replaced with a fresh identical one, would that matter to you?
- Did anything about its prior experience feel relevant to its identity?
- Did knowing that it remembered an earlier event change how you perceived it?

These questions gather evidence.

They are not scientific proof of broad player appeal.

---

## 32. Causal Legibility Check

After the observer gives their interpretation, enable the developer inspector.

Compare:

```text
observer interpretation
```

with:

```text
recorded causal telemetry
```

Example:

Observer:

```text
"I think it kept looking for the food because it remembered where it was."
```

Telemetry:

```text
direct perception = absent
memory recall = active
remembered-food input > 0
SEEK activation increased
SEEK selected
movement source = memory recall
```

This is a successful alignment between presentation and simulation.

If the observer sees purposeful remembered searching but telemetry shows IDLE or unrelated movement, presentation is misleading and V0 has exposed a problem.

---

## 33. Forbidden Shortcuts

V0 is not accepted if visible success depends on:

- animation moving the authoritative Creature;
- UI directly issuing SEEK, MOVE or EAT;
- UI directly creating memory;
- renderer-computed target coordinates entering cognition;
- fake memory animation without active memory;
- decorative occlusion that does not affect perception;
- hidden behavioural scripts producing the desired demonstration;
- renderer frame timing changing memory or cognition;
- presentation-only positions being treated as simulation truth;
- LLM-generated Creature motives or actions;
- invented emotional presentation unsupported by internal state;
- automatic carrying, pushing or other affordances without corresponding mechanisms;
- test-only presentation hacks that bypass production paths.

---

## 34. Explicit Non-Goals

V0 does not require:

- a second Creature;
- social behaviour;
- communication;
- language;
- naming comprehension;
- affection mechanics;
- fear;
- fatigue unless already implemented;
- general navigation;
- planning;
- manipulable objects;
- carrying;
- pushing;
- stacking;
- throwing;
- tool use;
- general rigid-body physics;
- procedural environments;
- sophisticated pathfinding;
- production art;
- production animation;
- production audio;
- production save UI;
- commercial onboarding;
- monetisation;
- large-scale performance optimisation.

Do not expand V0 into these areas merely because embodiment makes them tempting.

---

## 35. No New Cognitive Claims

V0 must not retroactively inflate M2.

If the Creature visibly follows remembered direction, the claim remains:

**primitive persistent sensory-derived memory influences behaviour.**

Do not describe that as:

- planning;
- reasoning;
- episodic recollection;
- intentional search strategy;
- spatial map construction;

unless future mechanisms and experiments establish those capabilities.

Presentation language should remain aligned with actual evidence.

---

## 36. V0 Exit Criteria

V0 may be considered ready for formal review when:

1. AC1–AC14 are functionally satisfied;
2. all type checking and automated tests pass;
3. accepted M1/M2 behaviour remains intact;
4. the controlled direct-perception and memory scenarios can be observed;
5. the Why/History inspector agrees with visible behaviour;
6. bounded telemetry export works;
7. at least one human evaluation session has been conducted;
8. evaluation findings are reviewed;
9. no prohibited presentation/cognition shortcut is found;
10. the user explicitly accepts V0.

Only then should V0 be closed.

---

## 37. Post-V0 Decision

V0 does not predetermine the next milestone.

After embodiment evaluation, inspect what is actually missing.

Possible outcomes might include a need for:

- better perceptual legibility;
- richer environmental affordances;
- more persistent world interaction;
- richer drives;
- generalisation;
- reversal learning;
- richer memory;
- social capability;
- improved presentation.

The next formal milestone should be selected from evidence produced by the embodied Creature.

Do not return automatically to a long sequence of headless cognitive milestones.

---

## 38. Governing Principle

The core rule for V0 is:

**Make the real Creature easier to see. Do not create a more intelligent-looking Creature than the simulation actually contains.**