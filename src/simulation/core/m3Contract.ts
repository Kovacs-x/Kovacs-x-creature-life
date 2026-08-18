import type {
  ExplorationPressureConfig,
} from "../drives/exploration.js";

/*
 * M3.2 PROSPECTIVE BEHAVIOURAL CONTRACT
 *
 * These values are locked before EXPLORE is
 * connected to the brain or to the accepted
 * episode transition.
 *
 * They must not later be quietly changed
 * merely because an integrated behavioural
 * result is inconvenient.
 *
 * A genuine architectural or mathematical
 * problem may justify revision, but that
 * revision must be explicit and documented.
 */

/*
 * EXPLORATION PRESSURE
 *
 * Current accepted M1 action competition has:
 *
 * IDLE baseline:
 *   1.0 bias × 0.35 = 0.35
 *
 * Maximum hunger-only SEEK support while no
 * food evidence exists:
 *   1.0 hunger × 0.30 = 0.30
 *
 * M3 therefore uses a 0.50 exploration
 * connection weight.
 *
 * At initial pressure 0.20:
 *
 *   EXPLORE = 0.20 × 0.50 = 0.10
 *
 * so it cannot immediately dominate.
 *
 * At pressure 0.80:
 *
 *   EXPLORE = 0.80 × 0.50 = 0.40
 *
 * so it can legitimately beat the accepted
 * 0.35 IDLE baseline.
 */
export const M3_EXPLORATION_INITIAL_PRESSURE =
  0.2;

export const M3_EXPLORATION_PRESSURE_CONFIG:
  ExplorationPressureConfig = {
    minPressure: 0,

    maxPressure: 1,

    accumulationPerSecond:
      0.1,

    reductionPerSecondWhileExploring:
      0.3,
  };

export const M3_EXPLORATION_TO_EXPLORE_WEIGHT =
  0.5;

/*
 * Pressure ordering for future integration:
 *
 * 1. current pressure is supplied to cognition;
 * 2. normal action competition occurs;
 * 3. the selected action is physically resolved;
 * 4. exploration pressure advances for the tick,
 *    using isExploring = true only when EXPLORE
 *    actually won.
 *
 * Pressure must never force EXPLORE directly.
 */
export const M3_EXPLORATION_PRESSURE_UPDATE_ORDER =
  "after-action-resolution" as const;

/*
 * SEEDED MOTOR CONTRACT
 *
 * M3.1 already established:
 *
 * one nextFloat()
 * → angle over one full turn
 * → unit direction vector
 *
 * A valid unexpired heading consumes no RNG.
 *
 * Five simulated seconds allows a heading to
 * survive across nearby exploratory bouts
 * without turning exploration into a permanent
 * navigation target.
 */
export const M3_EXPLORATORY_HEADING_PERSISTENCE_SECONDS =
  5;

export const M3_EXPLORATORY_HEADING_ALGORITHM =
  "uniform-full-turn-from-one-nextFloat" as const;

export const M3_EXPLORATORY_RNG_CONSUMPTION_RULE =
  "one-nextFloat-only-when-sampling-new-heading" as const;

export const M3_EXPLORATORY_BOUNDARY_POLICY =
  "clamp-to-habitat-bounds" as const;

/*
 * PRIMARY CONTROLLED HABITAT
 *
 * These bounds deliberately reuse the accepted
 * M1 movement bounds.
 *
 * Food remains within the accepted ten-unit
 * perception range but starts behind a genuine
 * simulation-side sensory occluder.
 *
 * The Creature therefore has no direct food
 * evidence initially even though the resource
 * genuinely exists.
 */
export const M3_HABITAT_BOUNDS = {
  minX: 0,
  minY: 0,
  maxX: 10,
  maxY: 10,
} as const;

export const M3_ACQUISITION_CREATURE_START = {
  x: 0,
  y: 0,
} as const;

export const M3_ACQUISITION_FOOD = {
  id: "m3-acquisition-food",
  x: 8,
  y: 0,
  nutrition: 0.5,
} as const;

export const M3_ACQUISITION_OCCLUDER = {
  x: 4,
  minY: 0,
  maxY: 2,
  active: true,
} as const;

export const M3_ACQUISITION_PERCEPTION_RANGE =
  10;

export const M3_ACQUISITION_INTERACTION_RANGE =
  0.25;

export const M3_ACQUISITION_MOVE_DISTANCE =
  1;

export const M3_ACQUISITION_TICK_SECONDS =
  1;

/*
 * PRIMARY EXPERIENCE SEEDS
 *
 * These seeds are prospectively selected from
 * the isolated M3.1 seeded-heading mechanism,
 * before behavioural integration.
 *
 * Seed A's first three newly sampled headings
 * have strong positive X components.
 *
 * Seed B's first three newly sampled headings
 * have negative X components.
 *
 * The selection therefore creates a controlled
 * motor-history contrast without querying food
 * position during exploration.
 *
 * Once this contract is committed these seeds
 * must not be replaced merely because the later
 * integrated result is inconvenient.
 */
export const M3_PRIMARY_BRANCH_A_SEED =
  1018;

export const M3_PRIMARY_BRANCH_B_SEED =
  5379;

/*
 * EXPERIENCE ACQUISITION
 *
 * Three acquisition rounds deliberately reuse
 * the already accepted M1 finding that three
 * rewarded experiences are sufficient to
 * produce a behaviourally detectable learned
 * difference in the harder food-seeking probe.
 *
 * This is controlled experimental scaffolding,
 * not the eventual persistent gameplay loop.
 *
 * Between acquisition rounds the persistent
 * learned brain is preserved.
 *
 * World/transient experimental conditions are
 * reset so each round provides an equivalent
 * opportunity.
 *
 * The branch's prospectively locked exploration
 * seed is restarted for each controlled round.
 *
 * This lets the experiment test:
 *
 * repeated legitimate experience
 * → accumulated neural learning
 *
 * without adding uncontrolled between-round
 * environmental differences.
 *
 * Later M3 persistence tests separately require
 * uninterrupted RNG state to survive save/load.
 */
export const M3_ACQUISITION_ROUNDS =
  3;

export const M3_ACQUISITION_MAX_TICKS_PER_ROUND =
  32;

export const M3_ACQUISITION_RNG_POLICY =
  "reset-to-branch-seed-each-controlled-round" as const;

export const M3_ACQUISITION_PERSISTED_BETWEEN_ROUNDS =
  [
    "brain",
  ] as const;

export const M3_ACQUISITION_RESET_BETWEEN_ROUNDS =
  [
    "position",
    "hunger",
    "food",
    "foodMemory",
    "eligibilityTrace",
    "explorationState",
    "simulationTime",
    "rngState",
  ] as const;

export const M3_ACQUISITION_LEARNING_ENABLED =
  true;

export const M3_ACQUISITION_MEMORY_ENABLED =
  false;

/*
 * AUTONOMOUS DISCOVERY CONTRACT
 *
 * A primary M3 discovery requires:
 *
 * before:
 *   direct food perception absent
 *
 * then:
 *   EXPLORE wins normal competition
 *   → exploration-sourced movement occurs
 *
 * then:
 *   normal sensory transformation produces
 *   direct food perception
 *
 * The food may not be moved by an external
 * event during the discovery transition.
 */
export const M3_AUTONOMOUS_DISCOVERY_CONTRACT = {
  beforeDirectFoodPerception:
    "absent",

  requiredSelectedAction:
    "explore",

  requiredMovementSource:
    "exploration",

  afterDirectFoodPerception:
    "present",

  allowConcurrentExternalFoodMove:
    false,
} as const;

/*
 * PRIMARY ACQUISITION EXPECTATION
 *
 * These are prospective falsifiable outcomes.
 *
 * Branch A is expected to autonomously discover
 * and consume the food during each of the three
 * controlled acquisition rounds.
 *
 * Branch B is expected not to obtain equivalent
 * food experience during those locked rounds.
 *
 * Failure is evidence against the chosen
 * contract. It is not permission to silently
 * search for replacement seeds.
 */
export const M3_PRIMARY_BRANCH_A_EXPECTED_MIN_DISCOVERIES =
  3;

export const M3_PRIMARY_BRANCH_A_EXPECTED_MIN_CONSUMPTIONS =
  3;

export const M3_PRIMARY_BRANCH_B_EXPECTED_MAX_DISCOVERIES =
  0;

export const M3_PRIMARY_BRANCH_B_EXPECTED_MAX_CONSUMPTIONS =
  0;

/*
 * EXPLORATION-DISABLED CONTROL
 *
 * Same primary acquisition environment and
 * Branch A seed, but exploration is disabled.
 *
 * No replacement movement route is permitted.
 */
export const M3_EXPLORATION_DISABLED_CONTROL = {
  explorationEnabled:
    false,

  learningEnabled:
    true,

  memoryEnabled:
    false,

  seed:
    M3_PRIMARY_BRANCH_A_SEED,
} as const;

/*
 * LEARNING-DISABLED CONTROL
 *
 * Exploration remains genuine and may still
 * produce discovery and consumption.
 *
 * Neural plasticity is disabled so the later
 * standardized probe can distinguish movement
 * history from learned history.
 */
export const M3_LEARNING_DISABLED_CONTROL = {
  explorationEnabled:
    true,

  learningEnabled:
    false,

  memoryEnabled:
    false,

  seed:
    M3_PRIMARY_BRANCH_A_SEED,
} as const;

/*
 * HIDDEN-TARGET ADVERSARIAL CONDITION
 *
 * This alternate food location remains hidden
 * from the initial Creature position.
 *
 * With identical Creature state and RNG,
 * changing only the hidden food position from
 * the primary location to this location must
 * not change exploratory action or heading
 * before legitimate perception occurs.
 */
export const M3_HIDDEN_TARGET_ALTERNATE_FOOD = {
  id: "m3-hidden-alternate-food",
  x: 9,
  y: 0,
  nutrition: 0.5,
} as const;

/*
 * STANDARDIZED LATER PROBE
 *
 * This deliberately reuses the accepted M1
 * harder food-seeking probe rather than
 * inventing a new M3 threshold.
 *
 * Existing M1 evidence already established:
 *
 * naive / learning-disabled brain
 * → IDLE
 *
 * three rewarded learning experiences
 * → SEEK
 *
 * M3 therefore asks whether different
 * exploration-produced histories can create
 * the persistent learned-state difference
 * needed to cross that already established
 * behavioural threshold.
 */
export const M3_STANDARDIZED_PROBE = {
  creaturePosition: {
    x: 0,
    y: 0,
  },

  hungerEnergy:
    0.5,

  maxEnergy:
    1,

  food: {
    id: "m3-standardized-probe-food",
    x: 6,
    y: 0,
    nutrition: 0.5,
  },

  perceptionRange:
    10,

  interactionRange:
    0.25,

  memoryEnabled:
    false,

  explorationEnabled:
    false,
} as const;

/*
 * Probe normalization deliberately removes
 * immediate history except for persistent
 * learned neural connection weights.
 */
export const M3_STANDARDIZED_PROBE_NORMALIZED_STATE =
  [
    "position",
    "hunger",
    "world",
    "food",
    "directPerceptionConditions",
    "foodMemory",
    "eligibilityTrace",
    "explorationPressure",
    "activeExploratoryHeading",
    "rngState",
  ] as const;

export const M3_STANDARDIZED_PROBE_PRESERVED_STATE =
  [
    "learnedBrainConnectionWeights",
  ] as const;

/*
 * PRIMARY METRICS
 *
 * Persistent internal evidence:
 *   relevant neural connection weights differ.
 *
 * Behavioural evidence:
 *   under the same locked probe, Branch A
 *   selects SEEK while Branch B selects IDLE.
 *
 * SEEK activation must also be higher in the
 * experience-rich branch.
 */
export const M3_PRIMARY_PROBE_METRIC = {
  internalMetric:
    "learned-neural-connection-weights",

  neuralMetric:
    "seek-activation",

  behaviouralMetric:
    "selected-action",

  expectedBranchAAction:
    "seek",

  expectedBranchBAction:
    "idle",

  expectedLearningDisabledAction:
    "idle",

  expectedExplorationDisabledAction:
    "idle",
} as const;

/*
 * EXPERIENCE-STATE SWAP
 *
 * Only persistent learned neural connection
 * weights are transferred between identities.
 *
 * Immediate activations and eligibility traces
 * are normalized by the standardized probe.
 */
export const M3_EXPERIENCE_STATE_SWAP_FIELD =
  "learned-neural-connection-weights" as const;

export const M3_EXPERIENCE_STATE_SWAP_EXPECTATION =
  "behaviour-follows-learned-state-not-creature-id" as const;

/*
 * SAME-SEED DETERMINISM
 *
 * The canonical deterministic replay seed is
 * the primary Branch A seed.
 */
export const M3_SAME_SEED_REPLAY_SEED =
  M3_PRIMARY_BRANCH_A_SEED;