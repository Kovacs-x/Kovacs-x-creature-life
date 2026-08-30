# Creature Life — Minimal Creature Embodiment Vertical Slice Specification

**Phase:** Post-M3 Minimal Creature Embodiment Vertical Slice  
**Status:** Prospectively defined before implementation  
**Prerequisites:** M0, M1, M2, V0 and M3 formally accepted  
**Accepted M3 baseline:** `996f4f2b6c281de3eb2dbb01aff5411a0edfc1a3`  
**Purpose:** Determine whether the already-accepted artificial-life mechanisms become more compelling when experienced as one persistent, embodied Creature in a minimal 3D habitat.

---

## 1. Purpose

This phase is an evidence-gathering vertical slice.

It is not the beginning of another major cognitive milestone.

The accepted Creature already possesses:

- biology and hunger;
- direct food perception;
- neural action competition;
- reward-modulated learning;
- persistent experience-shaped neural state;
- M2 sensory-derived food memory;
- M3 autonomous exploration;
- seeded stochastic exploratory movement;
- deterministic simulation time;
- persistent world state;
- life history;
- causal telemetry.

The purpose of this slice is to determine whether these already-accepted mechanisms become more understandable, more agentic and more personally meaningful when represented as one persistent embodied Creature in a minimal 3D environment.

The primary product questions are:

1. **Legibility:** Can the player understand what the Creature is physically doing and approximately why?
2. **Agency:** Does the same accepted autonomous behaviour feel more like behaviour originating from the Creature rather than a diagnostic demonstration?
3. **Attachment:** Does embodiment plus continuity make the player care more about preserving and returning to this particular Creature?

The phase must not claim new cognitive capability merely because the Creature looks more alive.

---

## 2. Existing Authoritative Baseline

The authoritative behavioural baseline remains the accepted integrated M3 Creature.

The existing authoritative transition is conceptually:

authoritative simulation state
        ↓
legitimate perception
        ↓
M2 memory update / recall where applicable
        ↓
biology
        ↓
M3 neural evaluation
        ↓
IDLE / SEEK / EAT / EXPLORE competition
        ↓
physical consequence
        ↓
biological consequence
        ↓
reward
        ↓
eligibility-based learning
        ↓
exploration-state update
        ↓
new authoritative simulation state

This vertical slice must reuse that transition.

It must not create another simulation loop.

It must not create a second embodiment-specific Creature state.

The existing M3 action-feasibility mechanism remains authoritative.

The existing M1, M2 and M3 constants, learning rules, exploration rules and causal mechanisms must not be tuned merely to make the 3D presentation look better.

---

## 3. Core Architectural Law

The accepted one-way presentation boundary remains mandatory:

simulation state
        ↓
presentation model
        ↓
renderer

Never:

renderer
        ↓
cognition

and never:

animation
        ↓
action selection

or:

camera
        ↓
Creature perception

or:

visual orientation
        ↓
Creature movement

or:

renderer
        ↓
simulation RNG

The renderer may enrich genuine state visually.

It must never manufacture authoritative behavioural state.

---

## 4. Scope

The minimal vertical slice includes:

- one persistent Creature;
- the existing bounded M3 habitat represented as a simple 3D floor;
- the existing single food resource;
- one visible geometry element corresponding to the existing sensory occluder;
- a procedural/primitive Creature body;
- readable Creature front/facing;
- state-faithful locomotion;
- presentation-only idle life;
- presentation-only eating animation following genuine eating;
- orientation derived from genuine movement;
- a third-person/orbit-style camera;
- player food placement/relocation through the existing authoritative world-action boundary;
- visible energy/hunger;
- useful food-perception and food-memory status;
- persistent Life History;
- read-only Why/diagnostic information;
- persistence across browser reload using the existing authoritative persistent-run representation;
- deterministic and presentation-invariance controls;
- diagnostics-hidden human evaluation;
- formal audit and explicit acceptance.

---

## 5. Explicit Scope Exclusions

This phase does not introduce:

- a new cognitive architecture;
- a new simulation loop;
- 3D Creature cognition;
- 3D navigation;
- vertical Creature movement;
- pathfinding;
- navigation meshes;
- obstacle planning;
- rigid-body physics;
- physics-driven Creature locomotion;
- physics-driven cognition;
- collision avoidance as a new behavioural system;
- procedural terrain;
- open-world environments;
- multiple simultaneous food resources;
- new food categories;
- multiple Creatures;
- social behaviour;
- player recognition;
- commands;
- language;
- planning;
- predictive world models;
- sophisticated novelty maps;
- explored/unexplored spatial maps;
- emotional systems;
- affection;
- fear;
- happiness;
- loneliness;
- named personality traits;
- genetics;
- reproduction;
- development;
- final Creature artwork;
- production-quality skeletal animation;
- complex animation state machines;
- audio systems unless later justified by evaluation evidence.

A later phase may introduce some of these capabilities only after separate specification and evidence.

---

## 6. Renderer Selection

The slice will use **Three.js** as the minimal 3D rendering dependency unless implementation reveals a concrete incompatibility that requires an explicit specification revision.

At the accepted M3 baseline, the project uses:

- TypeScript;
- Vite;
- Vitest;

and has no existing runtime rendering dependency.

Three.js is selected because it can be introduced as a narrow presentation dependency without changing the existing application architecture.

Three.js will provide only presentation concerns such as:

- WebGL rendering;
- scene graph;
- primitive geometry;
- camera;
- lighting;
- raycasting;
- orbit controls;
- visual interpolation.

Three.js must not become the owner of:

- Creature position;
- food position;
- Creature facing truth;
- simulation time;
- action state;
- hunger;
- memory;
- exploration;
- learning;
- RNG;
- collision-derived cognition.

No React, React Three Fiber or larger game engine is required for this slice.

---

## 7. Authoritative 2D Simulation, 3D Presentation

The current simulation remains planar.

The 3D scene is a presentation of that planar authoritative world.

The prospective coordinate mapping is:

simulation x
→
scene x

simulation y
→
scene z

scene y
→
presentation-only vertical height

Therefore:

simulation position (x, y)

is rendered approximately as:

scene position (x, visualHeight, y)

The Creature does not acquire a vertical cognitive coordinate.

Food does not acquire a vertical cognitive coordinate.

No Three.js object transform becomes authoritative simulation state.

---

## 8. Habitat

The 3D habitat should remain deliberately small.

It should contain:

- a flat bounded ground plane;
- clear visual indication of habitat limits;
- no complex terrain;
- no hidden navigation geometry;
- no physics simulation.

The floor represents the existing M3 habitat coordinate bounds.

Visual floor dimensions must correspond consistently to the authoritative M3 coordinate space.

---

## 9. Creature Representation

The Creature should use procedural primitive geometry.

Minimum useful anatomy should establish:

- a recognizable body mass;
- a readable front/head region;
- readable eyes or equivalent front-facing cue;
- a recognizable rear region;
- a distinctive enough silhouette to read as an organism rather than a debug token.

Optional inexpensive features may include:

- tail;
- crest;
- simple limb-like geometry;
- body taper;
- head tilt.

The goal is not final Creature design.

The goal is sufficient embodiment to test whether physical presence changes the experience of the accepted artificial-life mechanisms.

No art quality claim is part of acceptance.

---

## 10. Facing and Orientation

Creature facing must originate from genuine authoritative displacement.

Allowed:

previous authoritative position
+
current authoritative position
        ↓
displacement direction
        ↓
presentation facing

Forbidden:

food position
        ↓
visual facing

or:

memory direction
        ↓
visual facing

or:

exploratory heading state
        ↓
visual facing

unless genuine physical displacement occurred in that direction.

Once genuine movement establishes a facing direction, the renderer may retain the last genuine orientation while the Creature is stationary.

This retained orientation is presentation state only.

It must not feed back into simulation.

---

## 11. Locomotion Presentation

Authoritative Creature movement continues to occur only on simulation ticks.

The renderer may visually interpolate between consecutive authoritative positions to make movement readable.

Conceptually:

authoritative previous position
        ↓
authoritative current position
        ↓
presentation interpolation
        ↓
visible continuous locomotion

The interpolation does not represent additional simulation movement.

The Creature's authoritative position remains the simulation position.

Changing interpolation speed, frame rate or animation timing must not change:

- future simulation state;
- Creature cognition;
- RNG;
- telemetry;
- learning;
- memory.

---

## 12. Presentation Animation

The renderer may provide lightweight presentation-only animation such as:

- breathing;
- blinking;
- subtle idle body movement;
- gait/body bob during genuine movement;
- eating motion after genuine successful eating;
- small postural changes derived from genuine energy/hunger state.

Presentation animation may use browser wall-clock time.

It must not consume authoritative simulation RNG.

It must not generate actions.

It must not create artificial simulation events.

An eating animation must not occur merely because EAT was neurally selected.

It may represent eating only when genuine eating physically succeeded.

---

## 13. Unsupported Emotional Storytelling Is Forbidden

The renderer must not fabricate unsupported internal states such as:

- happiness;
- sadness;
- fear;
- affection;
- excitement;
- loneliness;
- pride;
- boredom;
- emotional curiosity;
- love for the player.

M3 contains primitive exploration pressure.

The presentation must not rename that mechanism into an unsupported emotional claim.

Visual liveliness is permitted.

Fabricated psychology is not.

---

## 14. Food Representation

The existing single authoritative food object remains the only food resource.

The renderer may present it as a simple 3D mesh or small collection of meshes.

Food rendering must follow authoritative state:

authoritative food available
→
food visible

authoritative food consumed
→
food absent

The renderer must not independently decide whether food exists.

---

## 15. Sensory Occluder Representation

The current M3 occluder is a sensory occluder.

It is not currently a general solid collision obstacle.

The 3D representation must not falsely imply a physical capability that the simulation does not possess.

Therefore the first slice should represent the occluder as something visually credible but obviously non-solid or traversable, such as:

- a screen;
- a foliage-like partition;
- a translucent sensory barrier;
- an equivalent simple presentation structure.

The occluder may explain why the player can see food while the Creature cannot directly perceive it.

A solid wall with implied collision must not be introduced unless collision becomes an explicit authoritative simulation mechanism in a separately justified change.

---

## 16. Camera

The vertical slice should use a perspective third-person/orbit-style camera.

Minimum camera capability:

- orbit around the habitat or Creature;
- modest zoom;
- useful default framing;
- stable presentation on desktop and mobile browser layouts where practical.

Camera state is presentation state.

Changing the camera must not alter:

- Creature perception;
- cognition;
- action competition;
- exploration;
- memory;
- learning;
- RNG;
- authoritative world state.

Camera state does not need to be part of Creature persistence.

---

## 17. Rendering Frame Loop

Three.js will require a visual frame loop, normally through `requestAnimationFrame`.

This is explicitly **not** a simulation loop.

The frame loop may:

- update camera controls;
- interpolate transforms;
- animate breathing/blinking/gait;
- update presentation-only effects;
- render the scene.

It must not:

- call the authoritative simulation tick;
- evaluate the brain;
- update memory;
- update hunger;
- change exploration pressure;
- sample simulation RNG;
- select an action;
- move authoritative food;
- move the authoritative Creature.

The authoritative simulation continues to advance only through the existing application controller.

---

## 18. Simulation Scheduling

The existing fixed-step M3 application controller remains authoritative.

Browser pacing may continue determining when a complete simulation tick is requested.

Each requested tick must still represent the existing fixed amount of simulation time.

Browser frame rate must not become simulation time.

A 30 FPS renderer and a 120 FPS renderer must produce the same authoritative simulation outcome under equivalent authoritative inputs.

---

## 19. Player Food Placement

The only initial player-to-world interaction remains food placement/relocation.

The 3D interaction route is:

player tap/click
        ↓
Three.js raycast against habitat floor
        ↓
selected floor position
        ↓
convert scene position to authoritative planar world coordinate
        ↓
M3ApplicationController.placeFood(...)
        ↓
applyM3PlayerFoodPlacement(...)
        ↓
authoritative food/world state changes
        ↓
Creature receives no cognitive notification
        ↓
later ordinary sensory transformation
        ↓
Creature may perceive, remember, ignore or later discover food

The raycaster exists only to interpret player intent.

It must never become a Creature sensory system.

Forbidden:

raycast sees food
        ↓
Creature sees food

or:

player clicks destination
        ↓
Creature target = destination

or:

player places food
        ↓
force SEEK

---

## 20. Player Influence Versus Player Control

The slice should preserve the important distinction:

player changes circumstances

not:

player controls Creature

It must remain possible for the player to place food and observe that the Creature:

- fails to perceive it;
- continues exploring;
- acts according to stale memory;
- approaches something else;
- eventually discovers it;
- does not immediately respond.

This is legitimate behaviour.

The UI must not attempt to hide or automatically correct such outcomes merely because immediate responsiveness feels more game-like.

---

## 21. Presentation Model

The existing pure M3 presentation-model architecture should be reused and extended only where required.

The renderer should consume a presentation-facing model rather than directly inspecting arbitrary simulation internals.

Useful renderer-facing information may include:

- authoritative planar Creature position;
- displacement-derived facing;
- motion state;
- genuine activity state;
- genuine eating consequence;
- movement source;
- energy/hunger;
- authoritative food position and availability;
- food-perception state;
- food-memory state;
- memory confidence/age where diagnostics require it;
- sensory-occluder geometry;
- simulation time;
- tick index.

Any added presentation field must be a deterministic transformation of already-authoritative simulation state or completed tick evidence.

---

## 22. Energy and Hunger Presentation

The player should be able to see the Creature's biological condition.

The slice should expose at minimum:

- current energy;
- hunger load or equivalent inverse-energy representation.

This information must remain read-only.

The UI cannot directly set hunger or energy as part of ordinary play.

---

## 23. Food Perception and Memory Presentation

The slice may expose factual food-evidence status where useful.

Suitable categories include:

- directly perceived;
- occluded;
- out of range;
- consumed;
- active/corroborated food memory;
- decaying/stale food memory;
- no usable food memory.

Diagnostic presentation may expose:

- memory confidence;
- memory age.

The presentation must preserve the distinction between:

food exists

and:

Creature currently perceives food

and:

Creature retains memory derived from a past perception

---

## 24. Why / Diagnostic Information

A compact Why view should make genuine causal evidence understandable without inventing a second reasoning system.

It should preferentially derive from existing completed tick evidence and telemetry.

Useful Why information may include:

- selected action;
- candidate action activations;
- movement source;
- direct food evidence;
- memory evidence;
- exploration pressure;
- successful eating;
- reward;
- relevant learning changes.

The Why view is observational.

Opening, closing, scrolling or refreshing diagnostics must not change authoritative simulation behaviour.

For human evaluation, developer diagnostics should initially be hidden.

---

## 25. Life History

The existing M3 Life History should be reused.

Life History remains:

- deterministic;
- player-facing;
- based on genuine events;
- separate from cognitive memory;
- incapable of altering cognition.

The slice should make Life History easier to interpret as the history of one persistent individual.

It must not convert biography text into Creature memory.

---

## 26. Persistent Individual

A central requirement of the slice is continuity of the same Creature.

The existing authoritative M3 persistent-run representation should be reused.

Browser persistence should store and restore the existing versioned run representation rather than inventing a second Creature-save format.

The persistent run should preserve where applicable:

- simulation tick/time;
- Creature position;
- biology;
- learned brain state;
- eligibility state;
- M2 food memory;
- exploration pressure;
- active exploration state;
- RNG state;
- food/resource state;
- Life History;
- ordered player-world events;
- next deterministic external-event sequence.

Browser storage is a transport for the authoritative persistent-run representation.

Browser storage is not cognition.

---

## 27. Browser Reload Continuity

After the persistence stage is implemented:

run Creature
        ↓
accumulate experience
        ↓
save persistent run
        ↓
browser reload/restart
        ↓
deserialize same persistent run
        ↓
continue

must preserve meaningful individual continuity.

Reloading must not:

- create a fresh brain;
- erase learning;
- erase memory;
- reset exploration pressure;
- reset RNG;
- silently change food state;
- erase Life History;
- restart player-event sequence numbers.

Presentation-only state such as:

- camera angle;
- animation phase;
- interpolation progress;
- blink timing;

does not need to be persisted.

---

## 28. Determinism Requirement

Equivalent:

- authoritative initial state;
- RNG state;
- simulation timing;
- ordered player world events;

must produce equivalent:

- cognition;
- actions;
- movement;
- perception;
- memory;
- exploration;
- reward;
- learning;
- authoritative final state;
- authoritative telemetry.

The following must not alter the authoritative result:

- Three.js rendering enabled versus not rendered;
- different camera orientation;
- camera movement;
- viewport resize;
- visual frame rate;
- animation timing;
- Why panel shown versus hidden;
- Life History shown versus hidden;
- diagnostic inspection;
- scene lighting;
- visual material choices.

---

## 29. Rendering RNG Isolation

Rendering must never consume authoritative simulation RNG.

Presentation-only stochastic visual effects are not required for this slice.

If later visual randomness is introduced, it must use an explicitly separate presentation-only source and must have no route back into simulation.

The simplest implementation is to avoid random presentation effects entirely during this slice.

---

## 30. Legibility Evaluation

Legibility asks:

**Can the player read the embodied Creature's physical behaviour without being misled by presentation?**

With diagnostics initially hidden, the observer should be able to understand at minimum:

- where the Creature's front is after genuine movement establishes facing;
- whether the Creature is stationary or moving;
- when the Creature is genuinely eating;
- where the food physically is;
- whether the Creature appears to be wandering/exploring or moving purposefully;
- that the visible occluder can block the Creature's direct food evidence even when the player can see the food.

After diagnostics are revealed, the player's interpretation should be compared with genuine causal evidence.

Legibility fails if presentation repeatedly communicates state that did not occur.

Examples of legibility failure include:

- eating animation without successful eating;
- Creature visually pointing toward hidden food despite no genuine displacement establishing that direction;
- visual lock-on before legitimate perception;
- a solid-looking obstacle that the simulation treats as nonexistent physical space;
- visual motion that substantially contradicts authoritative movement.

---

## 31. Agency Evaluation

This phase introduces no new agency mechanism.

Therefore it must not claim:

3D rendering
→
more autonomous cognition

The mechanistic agency remains the accepted M3 system.

The evaluation question is instead:

**Does the same accepted autonomous system become more perceptually convincing when embodied?**

The human evaluation should examine whether embodiment produces directional improvement in:

- perceived self-directed activity;
- reduced demonstration-like feeling;
- uncertainty about what the Creature will do next;
- interest in watching autonomous exploration;
- desire to alter the environment and observe consequences;
- understanding that food placement influences circumstances rather than directly issuing a command.

Presentation-invariance controls must show that the 3D renderer itself did not create the behaviour being interpreted as agency.

---

## 32. Attachment Evaluation

Strong emotional attachment is not required.

This phase instead asks whether embodiment and persistent continuity produce **directional evidence of attachment or individual significance**.

The observer should experience one continuing Creature long enough for genuine history to accumulate.

The evaluation should examine:

- whether replacing/resetting the Creature feels like losing anything;
- whether the observer would prefer to continue with the existing Creature rather than an equivalent fresh one;
- whether accumulated Life History feels relevant to the identity of the current individual;
- whether persistent learned differences make continuity more meaningful;
- whether the observer wants to return to this same Creature later;
- whether the Creature feels less replaceable than the accepted M3 browser presentation.

At minimum, the slice should seek directional improvement in one or more continuity/attachment dimensions.

If attachment remains unchanged, that result must be recorded honestly.

The slice must not fabricate attachment through unsupported emotional animation or narrative.

---

## 33. Human Evaluation Protocol

The human evaluation should occur after mechanistic integration and automated controls pass.

### Phase A — Blind embodied observation

Hide developer diagnostics.

Allow the observer to:

- watch the Creature;
- orbit the camera;
- place/relocate food;
- observe multiple interaction cycles;
- reload and return to the persistent Creature where appropriate.

### Phase B — Immediate interpretation

Before diagnostic reveal, record responses concerning:

- legibility;
- perceived agency;
- surprise;
- interest in watching;
- interaction desire;
- sense of individuality;
- continuity;
- attachment;
- replaceability.

### Phase C — Diagnostic reveal

Reveal:

- Why;
- food-perception/memory evidence;
- Life History;
- learning diagnostic;
- relevant telemetry.

### Phase D — Causal agreement

Compare observed interpretation with actual evidence.

If the embodiment implies cognition that telemetry does not support, the presentation must be corrected before acceptance.

---

## 34. Presentation-Invariance Control

A central control for the vertical slice is:

same authoritative initial state
+
same RNG
+
same external world-event sequence
+
same simulation ticks

with:

3D rendering active

versus an equivalent execution where rendering operations are absent or observational only.

Expected:

identical authoritative result

within the project's deterministic scope.

This should include:

- final authoritative state;
- RNG state;
- learning state;
- memory;
- exploration;
- action trace;
- telemetry.

---

## 35. Camera-Invariance Control

Equivalent authoritative execution with different camera operations must produce identical authoritative results.

Camera operations may include:

- orbit;
- zoom;
- resize;
- repeated movement during simulation play.

Expected:

camera activity
≠
simulation input

unless the player explicitly performs the separate legitimate food-placement world action.

---

## 36. Diagnostic-Invariance Control

Showing or hiding:

- Why;
- Life History;
- learning diagnostic;
- telemetry;

must not alter authoritative simulation results.

Diagnostics must remain downstream observers.

---

## 37. Frame-Rate Invariance

Different rendering frame rates must not change authoritative simulation progression.

The simulation remains fixed-step.

A visual frame must never implicitly become a simulation tick.

Authoritative RNG consumption must therefore be independent of render-frame count.

---

## 38. Player-World Boundary Control

The existing player food-placement boundary must remain intact after 3D integration.

A placement must modify only legitimate world/lifecycle state.

It must not directly alter:

- brain activations;
- selected action;
- Creature position;
- hunger;
- memory;
- exploration state;
- learned weights;
- eligibility;
- RNG.

Any later change in Creature behaviour must arise through the normal sensory/cognitive pathway.

---

## 39. Hidden-Target Adversarial Control

The accepted M3 hidden-target discipline remains mandatory.

Before direct perception becomes available:

- moving hidden food must not redirect exploration;
- camera visibility of food must not provide Creature knowledge;
- renderer knowledge of food coordinates must not become Creature knowledge.

Three.js necessarily knows physical food position in order to draw it.

That fact must remain strictly presentation-side.

---

## 40. Stale-Memory Adversarial Control

The accepted M2 stale-memory behaviour must survive embodiment.

Scenario:

Creature legitimately perceives food in Direction A
        ↓
memory forms
        ↓
food becomes unavailable to direct perception
        ↓
player relocates hidden food to Direction B

Before new legitimate perception:

Creature memory remains based on Direction A

or its deterministic decay.

The rendered food may visibly exist in Direction B for the player.

The Creature must not visually or behaviourally reveal knowledge of Direction B until legitimate evidence exists.

---

## 41. Eating-Fidelity Adversarial Control

The visual Creature must not display a successful eating consequence unless authoritative eating actually succeeded.

Selecting EAT without valid contact is insufficient.

The test should distinguish:

EAT selected
but
no physical consumption

from:

successful eating

Only the second supports eating-consequence animation.

---

## 42. Persistence Control

A meaningful run should be compared:

uninterrupted continuation

versus:

save
→
reload
→
continue

Expected equivalence includes:

- authoritative Creature state;
- future RNG results;
- exploration;
- memory;
- learning;
- world state;
- event sequence;
- relevant telemetry.

---

## 43. Acceptance Criteria

### AC1 — Existing Simulation Reused

The slice uses the accepted integrated M3 authoritative tick rather than creating another simulation pipeline.

### AC2 — No New Cognitive System

The 3D slice does not introduce a new cognitive mechanism merely to improve presentation.

### AC3 — Presentation Boundary

Three.js consumes downstream presentation data and cannot directly command cognition, memory, biology, learning or authoritative Creature movement.

### AC4 — Correct Coordinate Mapping

Authoritative planar Creature and food positions map deterministically into the 3D scene.

### AC5 — Authoritative Creature Position

The rendered Creature ultimately represents authoritative simulation position and does not maintain a competing authoritative physical state.

### AC6 — Genuine Facing

Visible facing derives from genuine authoritative displacement.

### AC7 — State-Faithful Locomotion

Visual locomotion corresponds to genuine authoritative movement.

### AC8 — Genuine Eating Presentation

Eating-consequence animation occurs only following genuine successful eating.

### AC9 — Presentation-Only Idle Life

Breathing, blinking and equivalent idle animation do not affect authoritative simulation.

### AC10 — Minimal Credible Creature

The procedural Creature has a readable body/front/silhouette sufficient for embodied evaluation.

### AC11 — Minimal 3D Habitat

The existing bounded habitat, food and sensory occluder are represented clearly without implying unsupported world mechanics.

### AC12 — Orbit Camera Isolation

Camera operation has no cognitive or RNG effect.

### AC13 — Player Food Interaction Boundary

3D floor interaction routes through the existing authoritative food-placement boundary and supplies no direct Creature command.

### AC14 — Energy/Hunger Legibility

The player can inspect genuine current biological energy/hunger.

### AC15 — Perception/Memory Legibility

The UI can distinguish current food perception, absence of perception and M2 retained food memory without conflating them.

### AC16 — Persistent Life History

The existing causal Life History remains visible and separate from cognition.

### AC17 — Why/Diagnostics Isolation

Why and diagnostic inspection remain read-only and downstream.

### AC18 — Persistent Individual Continuity

The same meaningful authoritative Creature state can survive browser reload and resume from the existing persistent-run representation.

### AC19 — Rendering RNG Isolation

Three.js rendering and presentation animation do not consume authoritative simulation RNG.

### AC20 — Presentation Invariance

Equivalent authoritative executions produce equivalent simulation results regardless of rendering activity.

### AC21 — Camera Invariance

Changing camera state does not alter authoritative simulation.

### AC22 — Diagnostic Invariance

Showing/hiding diagnostics does not alter authoritative simulation.

### AC23 — Frame-Rate Invariance

Render-frame count does not alter authoritative simulation behaviour.

### AC24 — Hidden-Target Integrity

Renderer knowledge of hidden food does not leak into exploration, movement, memory or cognition.

### AC25 — Stale-Memory Integrity

Hidden food relocation does not silently update M2 memory.

### AC26 — Persistence Determinism

Save/reload continuation matches uninterrupted continuation within deterministic scope.

### AC27 — Legibility Evaluation

Diagnostics-hidden human evaluation demonstrates that major visible behaviour can be interpreted without systematic contradiction from causal evidence.

### AC28 — Agency Evaluation

Human evaluation records whether the same accepted M3 behaviour shows directional improvement in perceived agency or reduced demonstration-like quality.

### AC29 — Attachment Evaluation

Human evaluation records whether persistent 3D embodiment produces directional improvement in continuity, individual significance, return desire, attachment or reduced replaceability.

Strong attachment is not required.

### AC30 — No Fabricated Psychology

Acceptance does not depend on unsupported emotional animation, personality claims or narrative attribution.

---

## 44. Failure Conditions

The vertical slice must not be accepted if any of the following occurs.

### Simulation duplication

A second independent Creature simulation loop is introduced.

### Renderer authority

Three.js transforms become authoritative Creature/world state independent of the accepted simulation.

### RNG contamination

Rendering or visual animation changes authoritative RNG state.

### Camera cognition

Camera orientation or visibility changes what the Creature knows.

### Hidden-target leakage

The renderer supplies hidden resource location to exploration, memory or SEEK.

### Pointer-to-cognition shortcut

Player pointer/raycast coordinates bypass the existing player-world boundary and directly control Creature cognition or movement.

### Fake facing

The Creature visually points toward food or remembered direction without genuine movement supporting that facing.

### Fake eating

Presentation depicts successful eating when no genuine physical consumption occurred.

### Misleading obstacle

Presentation strongly implies collision or navigation capabilities that do not exist.

### Persistence break

Reloading silently produces a new Creature, restarts RNG or erases meaningful learned/history state.

### Determinism break

Equivalent authoritative execution differs because rendering, camera, diagnostics or frame rate changed.

### Product failure

The 3D slice provides no useful improvement in legibility, perceived agency, continuity or attachment and offers no evidence that the embodied direction is worth pursuing.

Such a result is valid experimental evidence but should trigger a design review rather than automatic expansion.

---

## 45. Implementation Order

### E0 — Prospectively Lock This Specification

Commit this document before installing or integrating the 3D renderer.

Do not judge final success before the acceptance criteria are committed.

### E1 — 3D Presentation Foundation

Implement:

- Three.js dependency;
- renderer;
- scene;
- perspective camera;
- basic lights;
- ground plane;
- habitat bounds;
- resize handling;
- pure simulation-to-scene coordinate mapping.

Do not alter Creature cognition.

### E2 — State-Faithful Creature and Environment

Implement:

- primitive Creature mesh;
- readable front;
- food mesh;
- sensory-occluder presentation;
- authoritative position mapping;
- displacement-derived orientation;
- genuine activity-state rendering.

### E3 — Presentation Animation

Implement presentation-only:

- movement interpolation;
- simple locomotion;
- breathing;
- blinking;
- idle life;
- genuine eating-consequence animation.

Add presentation-invariance evidence.

### E4 — Camera and Player World Interaction

Implement:

- orbit camera;
- zoom;
- floor raycast;
- scene-to-world coordinate conversion;
- existing `placeFood()` integration.

Verify the player-world boundary remains authoritative.

### E5 — Persistent Browser Creature

Wire the existing persistent-run serialization/deserialization into browser persistence.

Verify:

- reload continuity;
- RNG continuation;
- learned-state continuation;
- memory continuation;
- world continuation;
- Life History continuation;
- event-sequence continuation.

### E6 — Why / History Presentation

Integrate:

- current factual state;
- Life History;
- learning diagnostic;
- compact Why information derived from existing evidence/telemetry.

Diagnostics remain hidden by default for evaluation.

### E7 — Controls and Adversarial Tests

Complete:

- presentation-invariance control;
- camera-invariance control;
- diagnostic-invariance control;
- frame-rate/RNG isolation evidence;
- player-world boundary control;
- hidden-target adversarial control;
- stale-memory control;
- eating-fidelity control;
- persistence control.

### E8 — Human Evaluation

Conduct diagnostics-hidden evaluation focused on:

- legibility;
- agency;
- attachment;
- continuity;
- replaceability;
- interaction desire.

Reveal diagnostics afterward and compare interpretation with causal evidence.

### E9 — Formal Audit

Before accepting the vertical slice:

1. run full type checking;
2. run full automated test suite;
3. verify M0/M1/M2/V0/M3 regressions;
4. inspect source for renderer-to-cognition paths;
5. inspect simulation RNG isolation;
6. inspect player-world interaction boundary;
7. inspect persistence;
8. inspect presentation-invariance evidence;
9. inspect stale-memory/hidden-target evidence;
10. inspect human-evaluation record;
11. conduct adversarial review where useful;
12. audit against this specification;
13. require explicit user acceptance.

---

## 46. Validation Order

For every implementation stage:

npm run typecheck

then:

npm test

Both must pass before the stage is treated as complete.

Existing accepted behaviour must remain passing unless an explicit later specification intentionally supersedes it.

---

## 47. Change Discipline

Before modifying an existing source file:

1. inspect the current committed GitHub version;
2. make the narrowest justified change;
3. preserve accepted behaviour;
4. avoid unrelated refactors;
5. normally provide the complete replacement file for the user's browser/Replit workflow.

New source files should be provided as complete files.

After validation passes, provide one exact concise commit message.

When the user reports that the change has been pushed, verify current GitHub before continuing.

---

## 48. Success Standard

This phase must not be accepted merely because:

the Creature looks nicer

or:

the scene is 3D

or:

the animations look alive

or:

the player says it is cute

The minimum successful result is:

accepted M1 + M2 + M3 Creature
        ↓
faithful persistent 3D embodiment
        ↓
same causal behaviour remains intact
        ↓
behaviour becomes more legible and/or
more convincingly agentic and/or
more personally meaningful

The artificial-life architecture must survive the transition unchanged in causal authority.

The product evidence should tell us whether this persistent embodied Creature is a stronger foundation for future Creature Life development than continuing immediately into additional headless cognitive milestones.

---

## 49. Post-Slice Decision

No later cognitive milestone begins automatically after this slice.

After formal evaluation, the project should decide among options such as:

embodiment clearly improves the experience
→
retain the embodied foundation
→
choose the next mechanism based on observed weakness

or:

legibility improves
but attachment remains weak
→
identify the smallest mechanism most likely to matter next

or:

3D embodiment adds little value
→
review presentation direction before increasing production scope

The next formal phase must be chosen from evidence.

It must not be assumed in advance.

---

## 50. Vertical Slice Claim

If accepted, the narrow claim of this phase is:

**The accepted M1/M2/M3 artificial-life Creature can be presented as one persistent minimal 3D embodied individual without changing the authoritative causal simulation, and that embodiment produces measurable evidence about whether legibility, perceived agency and attachment improve.**

This claim does not establish:

- sophisticated embodiment;
- general 3D intelligence;
- physics-based agency;
- sophisticated navigation;
- personality;
- emotional attachment as an internal mechanism;
- social intelligence;
- production-ready Creature art.

Those remain separate future questions.