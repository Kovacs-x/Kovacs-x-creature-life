import type {
  BrainState,
} from "./contracts.js";

import {
  SeededRng,
  type SeededRngState,
} from "./rng.js";

import {
  advanceHungerOverTime,
  createHungerState,
  type HungerState,
} from "../biology/hunger.js";

import {
  createM3Brain,
  evaluateM3Brain,
  M3_NODE_IDS,
} from "../brain/m3Brain.js";

import {
  M1_NODE_IDS,
} from "../brain/m1Brain.js";

import {
  deriveConnectionEligibilities,
} from "../brain/eligibility.js";

import {
  keepEligibilitiesForTarget,
} from "../brain/actionEligibility.js";

import {
  mergeEligibilityTrace,
} from "../brain/eligibilityTrace.js";

import {
  applyRewardPlasticity,
  type ConnectionEligibility,
  type WeightChange,
} from "../brain/plasticity.js";

import {
  deriveEnergyReward,
} from "../brain/reward.js";

import {
  moveAlongDirection,
} from "../actions/movement.js";

import {
  eatFood,
} from "../actions/eating.js";

import {
  senseHunger,
} from "../senses/hungerSense.js";

import {
  senseFoodContact,
} from "../senses/foodContact.js";

import type {
  FoodPerceptionSignal,
} from "../senses/foodPerception.js";

import {
  advanceExplorationPressure,
  createExplorationState,
  deserializeExplorationState,
  type ExplorationState,
  type ExploratoryHeadingState,
} from "../drives/exploration.js";

import {
  createFoodObject,
  type FoodObjectState,
} from "../../world/food.js";

import {
  createSensoryOccluder,
  SENSORY_OCCLUDER_KIND,
  type SensoryOccluderState,
} from "../../world/sensoryOccluder.js";

import {
  deriveM3DirectFoodPerception,
  resolveM3DiscoveryStep,
} from "./m3Discovery.js";

import {
  isBrainState,
  isEligibilityTrace,
  isFiniteNumber,
  isFoodState,
  isHungerState,
  isRecord,
  isVector,
  isWeightChanges,
  M1_EPISODE_ENERGY_LOSS_PER_SECOND,
} from "./m1Episode.js";

import {
  M3_ACQUISITION_CREATURE_START,
  M3_ACQUISITION_FOOD,
  M3_ACQUISITION_INTERACTION_RANGE,
  M3_ACQUISITION_LEARNING_ENABLED,
  M3_ACQUISITION_MAX_TICKS_PER_ROUND,
  M3_ACQUISITION_MEMORY_ENABLED,
  M3_ACQUISITION_MOVE_DISTANCE,
  M3_ACQUISITION_OCCLUDER,
  M3_ACQUISITION_ROUNDS,
  M3_ACQUISITION_TICK_SECONDS,
  M3_EXPLORATION_DISABLED_CONTROL,
  M3_EXPLORATION_INITIAL_PRESSURE,
  M3_EXPLORATION_PRESSURE_CONFIG,
  M3_HABITAT_BOUNDS,
  M3_LEARNING_DISABLED_CONTROL,
  M3_PRIMARY_BRANCH_A_SEED,
  M3_PRIMARY_BRANCH_B_SEED,
} from "./m3Contract.js";

export const M3_ACQUISITION_STATE_SCHEMA_VERSION =
  1 as const;

/*
 * These are inherited accepted M1 values,
 * not newly tuned M3 parameters.
 *
 * M1 already uses:
 *
 * initial energy = 0.1 / 1
 * eligibility decay = 0.5
 * learning rate = 0.25
 * weight bounds = [-1, 1]
 *
 * M3.6 deliberately reuses those values so the
 * experiment changes the route by which
 * experience is obtained, not the learning rule.
 */
const M3_ACQUISITION_INITIAL_ENERGY =
  0.1;

const M3_ACQUISITION_MAX_ENERGY =
  1;

const M3_ACQUISITION_ELIGIBILITY_DECAY =
  0.5;

const M3_ACQUISITION_LEARNING_RATE =
  0.25;

const M3_ACQUISITION_MIN_WEIGHT =
  -1;

const M3_ACQUISITION_MAX_WEIGHT =
  1;

export type M3AcquisitionMovementSource =
  "exploration" |
  "seek" |
  null;

export interface M3AcquisitionState {
  readonly schemaVersion:
    typeof M3_ACQUISITION_STATE_SCHEMA_VERSION;

  readonly tickIndex:
    number;

  readonly simulationTimeSeconds:
    number;

  readonly learningEnabled:
    boolean;

  readonly explorationEnabled:
    boolean;

  /*
   * M3.2 explicitly disables M2 memory during
   * the controlled acquisition experiment.
   *
   * This keeps discovery/learning history
   * separate from remembered-food guidance.
   */
  readonly memoryEnabled:
    false;

  readonly position: {
    readonly x: number;
    readonly y: number;
  };

  readonly hunger:
    HungerState;

  readonly food:
    FoodObjectState;

  readonly sensoryOccluder:
    SensoryOccluderState;

  readonly explorationState:
    ExplorationState;

  readonly brain:
    BrainState;

  readonly eligibilityTrace:
    readonly ConnectionEligibility[];

  /*
   * RNG is authoritative simulation state.
   *
   * The mutable SeededRng object exists only
   * during one tick and is reconstructed from
   * this serializable state.
   */
  readonly rngState:
    SeededRngState;

  readonly discoveryCount:
    number;

  readonly consumptionCount:
    number;

  readonly ate:
    boolean;

  readonly cumulativeReward:
    number;

  readonly weightChanges:
    readonly WeightChange[];

  readonly complete:
    boolean;
}

export interface M3AcquisitionRoundConfig {
  readonly seed:
    number;

  readonly learningEnabled:
    boolean;

  readonly explorationEnabled:
    boolean;

  /*
   * Supplying a brain allows the controlled
   * experiment to preserve learned neural state
   * between acquisition rounds.
   */
  readonly brain?:
    BrainState;
}

export interface M3AcquisitionTickEvidence {
  readonly tickIndex:
    number;

  readonly simulationTimeSeconds:
    number;

  /*
   * M3.10B: genuine per-tick configuration
   * evidence, already known to the tick and not
   * recomputed.
   */
  readonly learningEnabled:
    boolean;

  readonly explorationEnabled:
    boolean;

  readonly selectedActionId:
    string;

  readonly positionBefore: {
    readonly x: number;
    readonly y: number;
  };

  readonly positionAfter: {
    readonly x: number;
    readonly y: number;
  };

  readonly explorationPressureBefore:
    number;

  /*
   * The exact exploration-pressure value
   * actually supplied to evaluateM3Brain() this
   * tick. Under the exploration-disabled control
   * this is 0 even though
   * explorationPressureBefore/After continue to
   * reflect the Creature's own owned pressure
   * state.
   */
  readonly explorationPressureInput:
    number;

  readonly explorationPressureAfter:
    number;

  /*
   * Genuine neural input activations, read
   * directly from the already-evaluated brain
   * rather than recomputed.
   */
  readonly hungerInputActivation:
    number;

  readonly directFoodInputActivation:
    number;

  readonly rememberedFoodInputActivation:
    number;

  /*
   * The M3 acquisition route always evaluates
   * cognition with M2 memory explicitly absent
   * (memoryEnabled is locked false; recall is
   * never supplied to evaluateM3Brain()). This
   * literal makes that fact directly inspectable
   * in telemetry instead of requiring an
   * inference from rememberedFoodInputActivation
   * alone.
   */
  readonly activeFoodMemoryPresent:
    false;

  readonly contactInputActivation:
    number;

  readonly contactInRange:
    boolean;

  readonly explorationInputActivation:
    number;

  /*
   * Genuine action-node activations, taken
   * directly from the brain evaluation result.
   */
  readonly idleActivation:
    number;

  readonly seekActivation:
    number;

  readonly eatActivation:
    number;

  readonly exploreActivation:
    number;

  /*
   * Active exploratory heading immediately
   * before this tick resolved its selected
   * action, and again after resolution. Both are
   * the genuine ExplorationState heading objects,
   * not reconstructed.
   */
  readonly explorationHeadingBefore:
    ExploratoryHeadingState | null;

  readonly explorationHeadingAfter:
    ExploratoryHeadingState | null;

  readonly sampledNewHeading:
    boolean;

  /*
   * Legitimate direction sources, distinguished
   * by cause. Exploration direction comes only
   * from the sampled/reused heading; SEEK
   * direction comes only from the current direct
   * FoodPerceptionSignal. Neither is inferred
   * from hidden food coordinates.
   */
  readonly explorationMovementDirection: {
    readonly x: number;
    readonly y: number;
  } | null;

  readonly seekMovementDirection: {
    readonly x: number;
    readonly y: number;
  } | null;

  readonly movementSource:
    M3AcquisitionMovementSource;

  readonly distanceMoved:
    number;

  readonly directFoodPerceptionBefore:
    FoodPerceptionSignal | null;

  readonly directFoodPerceptionAfterMovement:
    FoodPerceptionSignal | null;

  /*
   * Legitimate sensory-occlusion facts already
   * computed while deriving the perception
   * signals above. These are perceptual facts,
   * not hidden world coordinates.
   */
  readonly occludedBeforeMovement:
    boolean;

  readonly occludedAfterMovement:
    boolean;

  readonly autonomousDiscoveryOccurred:
    boolean;

  readonly ate:
    boolean;

  readonly reward:
    number;

  readonly eligibilityTraceBefore:
    readonly ConnectionEligibility[];

  readonly eligibilityTraceAfter:
    readonly ConnectionEligibility[];

  readonly weightChanges:
    readonly WeightChange[];

  readonly rngStateBefore:
    SeededRngState;

  readonly rngStateAfter:
    SeededRngState;
}

export interface M3AcquisitionTickResult {
  readonly state:
    M3AcquisitionState;

  readonly evidence:
    M3AcquisitionTickEvidence;
}

export interface M3AcquisitionRoundResult {
  readonly initialState:
    M3AcquisitionState;

  readonly finalState:
    M3AcquisitionState;

  readonly ticks:
    readonly M3AcquisitionTickEvidence[];
}

export interface M3AcquisitionBranchConfig {
  readonly seed:
    number;

  readonly learningEnabled:
    boolean;

  readonly explorationEnabled:
    boolean;
}

export interface M3AcquisitionBranchResult {
  readonly seed:
    number;

  readonly learningEnabled:
    boolean;

  readonly explorationEnabled:
    boolean;

  readonly rounds:
    readonly M3AcquisitionRoundResult[];

  readonly discoveryCount:
    number;

  readonly consumptionCount:
    number;

  readonly cumulativeReward:
    number;

  readonly finalBrain:
    BrainState;

  readonly weightChanges:
    readonly WeightChange[];
}

export interface M3ExperienceAcquisitionExperimentResult {
  readonly branchA:
    M3AcquisitionBranchResult;

  readonly branchB:
    M3AcquisitionBranchResult;

  readonly learningDisabledControl:
    M3AcquisitionBranchResult;

  readonly explorationDisabledControl:
    M3AcquisitionBranchResult;
}

/*
 * Create one controlled acquisition round.
 *
 * Transient/world conditions restart from the
 * M3.2 contract.
 *
 * An optional supplied brain is the only state
 * intentionally preserved from a previous
 * controlled round.
 */
export function createM3AcquisitionState(
  config:
    M3AcquisitionRoundConfig,
): M3AcquisitionState {
  const rng =
    new SeededRng(
      config.seed,
    );

  return {
    schemaVersion:
      M3_ACQUISITION_STATE_SCHEMA_VERSION,

    tickIndex:
      0,

    simulationTimeSeconds:
      0,

    learningEnabled:
      config.learningEnabled,

    explorationEnabled:
      config.explorationEnabled,

    memoryEnabled:
      M3_ACQUISITION_MEMORY_ENABLED,

    position: {
      x:
        M3_ACQUISITION_CREATURE_START.x,

      y:
        M3_ACQUISITION_CREATURE_START.y,
    },

    hunger:
      createHungerState(
        M3_ACQUISITION_INITIAL_ENERGY,
        M3_ACQUISITION_MAX_ENERGY,
      ),

    food:
      createFoodObject(
        M3_ACQUISITION_FOOD.id,
        M3_ACQUISITION_FOOD.x,
        M3_ACQUISITION_FOOD.y,
        M3_ACQUISITION_FOOD.nutrition,
      ),

    sensoryOccluder:
      createSensoryOccluder(
        M3_ACQUISITION_OCCLUDER.x,
        M3_ACQUISITION_OCCLUDER.minY,
        M3_ACQUISITION_OCCLUDER.maxY,
        M3_ACQUISITION_OCCLUDER.active,
      ),

    explorationState:
      createExplorationState(
        M3_EXPLORATION_INITIAL_PRESSURE,
        M3_EXPLORATION_PRESSURE_CONFIG,
      ),

    brain:
      config.brain ??
      createM3Brain(),

    eligibilityTrace:
      [],

    rngState:
      rng.state,

    discoveryCount:
      0,

    consumptionCount:
      0,

    ate:
      false,

    cumulativeReward:
      0,

    weightChanges:
      [],

    complete:
      false,
  };
}

/*
 * ONE AUTHORITATIVE M3 ACQUISITION TICK
 *
 * state
 *   ↓
 * legitimate perception
 *   ↓
 * M3 neural evaluation
 *   ↓
 * ordinary action competition
 *   ↓
 * eligibility
 *   ↓
 * physical action consequence
 *   ↓
 * biological consequence
 *   ↓
 * biological reward
 *   ↓
 * existing reward plasticity
 *   ↓
 * exploration-pressure update
 *   ↓
 * new state
 *
 * No alternative simulation loop or hidden
 * behavioural FSM exists here.
 */
export function advanceM3AcquisitionTick(
  state:
    M3AcquisitionState,
): M3AcquisitionTickResult {
  if (state.complete) {
    throw new Error(
      "Cannot advance a completed M3 acquisition round.",
    );
  }

  const rng =
    new SeededRng(
      state.rngState,
    );

  const rngStateBefore =
    rng.state;

  const positionBefore = {
    x:
      state.position.x,

    y:
      state.position.y,
  };

  const directFoodPerceptionBefore =
    deriveM3DirectFoodPerception(
      state.position,
      state.food,
      state.sensoryOccluder,
    );

  const hungerSignal =
    senseHunger(
      state.hunger,
    );

  const contactSignal =
    senseFoodContact(
      state.position,
      state.food,
      M3_ACQUISITION_INTERACTION_RANGE,
    );

  /*
   * Exploration-disabled control:
   *
   * the Creature receives no exploration
   * contribution to cognition.
   *
   * No substitute action or movement route is
   * introduced.
   */
  const explorationPressureForBrain =
    state.explorationEnabled
      ? state.explorationState
          .pressure
      : 0;

  const decision =
    evaluateM3Brain(
      state.brain,

      hungerSignal,

      directFoodPerceptionBefore
        .foodSignal,

      explorationPressureForBrain,

      contactSignal,

      null,
    );

  const activations:
    Record<string, number> =
      Object.fromEntries(
        decision.brain.nodes.map(
          (node) => [
            node.id,
            node.activation,
          ],
        ),
      );

  const rawEligibilities =
    deriveConnectionEligibilities(
      decision.brain,
      activations,
    );

  const selectedEligibilities =
    keepEligibilitiesForTarget(
      decision.brain,

      rawEligibilities,

      actionIdToNodeId(
        decision.selectedActionId,
      ),
    );

  const eligibilityTrace =
    mergeEligibilityTrace(
      state.eligibilityTrace,

      selectedEligibilities,

      {
        decay:
          M3_ACQUISITION_ELIGIBILITY_DECAY,
      },
    );

  /*
   * First resolve the M3.4/M3.5 exploratory
   * consequence.
   *
   * For IDLE, SEEK or EAT this consumes no RNG
   * and causes no exploratory movement.
   */
  const discoveryStep =
    resolveM3DiscoveryStep(
      state.position,

      state.explorationState,

      decision.selectedActionId,

      rng,

      state.simulationTimeSeconds,

      state.food,

      state.sensoryOccluder,
    );

  let position =
    discoveryStep.movement
      .position;

  let movementSource:
    M3AcquisitionMovementSource =
      discoveryStep.movement
        .movementSource;

  let distanceMoved =
    discoveryStep.movement
      .distanceMoved;

  /*
   * Legitimate SEEK direction evidence, set only
   * when SEEK movement actually occurs below.
   * This is the same direct FoodPerceptionSignal
   * direction already used to move the Creature,
   * never a hidden food coordinate.
   */
  let seekMovementDirection: {
    x: number;
    y: number;
  } | null =
    null;

  /*
   * Existing food-directed SEEK movement remains
   * driven only by legitimate direct sensory
   * direction.
   *
   * M3.6 memory is disabled, so there is no
   * remembered-food movement route here.
   *
   * M3_ACQUISITION_MOVE_DISTANCE is the maximum
   * distance a single SEEK tick may travel, not
   * a mandatory fixed step. Arbitrary M3.8
   * player-positioned food is not guaranteed to
   * lie on a trajectory where repeated exact
   * full-distance steps ever enter the 0.25
   * interaction radius, which could otherwise
   * produce indefinite oscillation across the
   * food. Clamping to the legitimately perceived
   * sensory distance lets the Creature stop at
   * the perceived food location instead of
   * overshooting it. This still uses only the
   * existing legitimate direction/distance
   * evidence already available to cognition; it
   * does not read hidden food coordinates, force
   * EAT or consume food during this tick.
   */
  if (
    decision.selectedActionId ===
      "seek" &&
    directFoodPerceptionBefore
      .foodSignal !==
      null
  ) {
    const seekDistance =
      Math.min(
        M3_ACQUISITION_MOVE_DISTANCE,

        directFoodPerceptionBefore
          .foodSignal
          .distance,
      );

    const movement =
      moveAlongDirection(
        position,

        directFoodPerceptionBefore
          .foodSignal
          .directionX,

        directFoodPerceptionBefore
          .foodSignal
          .directionY,

        seekDistance,

        M3_HABITAT_BOUNDS,
      );

    position =
      movement.position;

    movementSource =
      "seek";

    distanceMoved =
      movement.distanceMoved;

    seekMovementDirection = {
      x:
        directFoodPerceptionBefore
          .foodSignal
          .directionX,

      y:
        directFoodPerceptionBefore
          .foodSignal
          .directionY,
    };
  }

  /*
   * Perception is rebuilt after physical
   * movement.
   *
   * This is observational evidence for this
   * tick and the world state from which the next
   * tick will sense.
   */
  const directFoodPerceptionAfterMovement =
    deriveM3DirectFoodPerception(
      position,
      state.food,
      state.sensoryOccluder,
    );

  let hunger =
    state.hunger;

  let food =
    state.food;

  let ateThisTick =
    false;

  const hungerBeforeConsequence =
    hunger;

  /*
   * EAT remains the accepted physical eating
   * mechanism.
   *
   * Eating does not happen merely because food
   * was discovered; EAT must independently win
   * normal competition on a later/current tick.
   */
  if (
    decision.selectedActionId ===
    "eat"
  ) {
    const eating =
      eatFood(
        position,
        hunger,
        food,
        M3_ACQUISITION_INTERACTION_RANGE,
      );

    hunger =
      eating.hunger;

    food =
      eating.food;

    ateThisTick =
      eating.ate;
  }

  /*
   * Reward is still caused only by the genuine
   * biological energy consequence.
   *
   * Discovery itself has no reward value.
   */
  const reward =
    deriveEnergyReward(
      hungerBeforeConsequence,
      hunger,
    ).value;

  /*
   * Reuse accepted M1 reward-modulated
   * plasticity unchanged.
   */
  const plasticity =
    applyRewardPlasticity(
      decision.brain,

      eligibilityTrace,

      reward,

      {
        learningRate:
          M3_ACQUISITION_LEARNING_RATE,

        minWeight:
          M3_ACQUISITION_MIN_WEIGHT,

        maxWeight:
          M3_ACQUISITION_MAX_WEIGHT,

        learningEnabled:
          state.learningEnabled,
      },
    );

  /*
   * As in the accepted episode, metabolism
   * advances on ticks that did not successfully
   * eat.
   */
  if (!ateThisTick) {
    hunger =
      advanceHungerOverTime(
        hunger,

        M3_ACQUISITION_TICK_SECONDS,

        {
          energyLossPerSecond:
            M1_EPISODE_ENERGY_LOSS_PER_SECOND,
        },
      );
  }

  /*
   * M3.2 locked pressure update ordering:
   *
   * cognition
   * → action resolution
   * → pressure update.
   *
   * A true exploratory-pressure reduction is
   * permitted only when EXPLORE actually won
   * and exploration is enabled.
   */
  const explorationState =
    advanceExplorationPressure(
      discoveryStep.movement
        .explorationState,

      M3_ACQUISITION_TICK_SECONDS,

      state.explorationEnabled &&
        decision.selectedActionId ===
          "explore",

      M3_EXPLORATION_PRESSURE_CONFIG,
    );

  const nextState:
    M3AcquisitionState = {
      schemaVersion:
        M3_ACQUISITION_STATE_SCHEMA_VERSION,

      tickIndex:
        state.tickIndex +
        1,

      simulationTimeSeconds:
        state.simulationTimeSeconds +
        M3_ACQUISITION_TICK_SECONDS,

      learningEnabled:
        state.learningEnabled,

      explorationEnabled:
        state.explorationEnabled,

      memoryEnabled:
        false,

      position,

      hunger,

      food,

      sensoryOccluder:
        state.sensoryOccluder,

      explorationState,

      brain:
        plasticity.brain,

      eligibilityTrace,

      rngState:
        rng.state,

      discoveryCount:
        state.discoveryCount +
        (
          discoveryStep
            .autonomousDiscoveryOccurred
            ? 1
            : 0
        ),

      consumptionCount:
        state.consumptionCount +
        (
          ateThisTick
            ? 1
            : 0
        ),

      ate:
        state.ate ||
        ateThisTick,

      cumulativeReward:
        state.cumulativeReward +
        reward,

      weightChanges: [
        ...state.weightChanges,
        ...plasticity.changes,
      ],

      complete:
        food.consumed,
    };

  return {
    state:
      nextState,

    evidence: {
      tickIndex:
        state.tickIndex,

      simulationTimeSeconds:
        state.simulationTimeSeconds,

      learningEnabled:
        state.learningEnabled,

      explorationEnabled:
        state.explorationEnabled,

      selectedActionId:
        decision.selectedActionId,

      positionBefore,

      positionAfter: {
        x:
          position.x,

        y:
          position.y,
      },

      explorationPressureBefore:
        state.explorationState
          .pressure,

      explorationPressureInput:
        explorationPressureForBrain,

      explorationPressureAfter:
        explorationState
          .pressure,

      hungerInputActivation:
        activations[
          M1_NODE_IDS.hungerInput
        ] ??
        0,

      directFoodInputActivation:
        activations[
          M1_NODE_IDS.foodInput
        ] ??
        0,

      rememberedFoodInputActivation:
        activations[
          M1_NODE_IDS
            .rememberedFoodInput
        ] ??
        0,

      activeFoodMemoryPresent:
        false,

      contactInputActivation:
        activations[
          M1_NODE_IDS.contactInput
        ] ??
        0,

      contactInRange:
        contactSignal.inRange,

      explorationInputActivation:
        activations[
          M3_NODE_IDS
            .explorationInput
        ] ??
        0,

      idleActivation:
        decision.idleActivation,

      seekActivation:
        decision.seekActivation,

      eatActivation:
        decision.eatActivation,

      exploreActivation:
        decision.exploreActivation,

      explorationHeadingBefore:
        state.explorationState
          .activeHeading,

      explorationHeadingAfter:
        explorationState
          .activeHeading,

      sampledNewHeading:
        discoveryStep.movement
          .sampledNewHeading,

      explorationMovementDirection:
        discoveryStep.movement
          .directionX ===
          null ||
        discoveryStep.movement
          .directionY ===
          null
          ? null
          : {
              x:
                discoveryStep
                  .movement
                  .directionX,

              y:
                discoveryStep
                  .movement
                  .directionY,
            },

      seekMovementDirection,

      directFoodPerceptionBefore:
        directFoodPerceptionBefore
          .foodSignal,

      directFoodPerceptionAfterMovement:
        directFoodPerceptionAfterMovement
          .foodSignal,

      occludedBeforeMovement:
        directFoodPerceptionBefore
          .occluded,

      occludedAfterMovement:
        directFoodPerceptionAfterMovement
          .occluded,

      movementSource,

      distanceMoved,

      autonomousDiscoveryOccurred:
        discoveryStep
          .autonomousDiscoveryOccurred,

      ate:
        ateThisTick,

      reward,

      eligibilityTraceBefore:
        state.eligibilityTrace,

      eligibilityTraceAfter:
        eligibilityTrace,

      weightChanges:
        plasticity.changes,

      rngStateBefore,

      rngStateAfter:
        rng.state,
    },
  };
}

/*
 * Controlled experiment runner.
 *
 * This is not an alternate simulation engine.
 *
 * It repeatedly invokes the single authoritative
 * state → one tick → state transition above and
 * stops at the prospectively locked round limit.
 */
export function runM3AcquisitionRound(
  config:
    M3AcquisitionRoundConfig,
): M3AcquisitionRoundResult {
  const initialState =
    createM3AcquisitionState(
      config,
    );

  let state =
    initialState;

  const ticks:
    M3AcquisitionTickEvidence[] =
      [];

  while (
    !state.complete &&
    ticks.length <
      M3_ACQUISITION_MAX_TICKS_PER_ROUND
  ) {
    const result =
      advanceM3AcquisitionTick(
        state,
      );

    ticks.push(
      result.evidence,
    );

    state =
      result.state;
  }

  return {
    initialState,

    finalState:
      state,

    ticks,
  };
}

/*
 * Run the prospectively locked three-round
 * experience history for one branch.
 *
 * Between rounds:
 *
 * preserved:
 *   brain
 *
 * reset:
 *   position
 *   hunger
 *   food
 *   eligibility
 *   exploration state
 *   simulation time
 *   RNG state back to branch seed
 *
 * This is the M3.2 controlled-history contract.
 */
export function runM3AcquisitionBranch(
  config:
    M3AcquisitionBranchConfig,
): M3AcquisitionBranchResult {
  let brain =
    createM3Brain();

  const rounds:
    M3AcquisitionRoundResult[] =
      [];

  const weightChanges:
    WeightChange[] =
      [];

  let discoveryCount =
    0;

  let consumptionCount =
    0;

  let cumulativeReward =
    0;

  for (
    let roundIndex = 0;
    roundIndex <
      M3_ACQUISITION_ROUNDS;
    roundIndex +=
      1
  ) {
    const round =
      runM3AcquisitionRound({
        seed:
          config.seed,

        learningEnabled:
          config.learningEnabled,

        explorationEnabled:
          config.explorationEnabled,

        brain,
      });

    rounds.push(
      round,
    );

    brain =
      round.finalState
        .brain;

    discoveryCount +=
      round.finalState
        .discoveryCount;

    consumptionCount +=
      round.finalState
        .consumptionCount;

    cumulativeReward +=
      round.finalState
        .cumulativeReward;

    weightChanges.push(
      ...round.finalState
        .weightChanges,
    );
  }

  return {
    seed:
      config.seed,

    learningEnabled:
      config.learningEnabled,

    explorationEnabled:
      config.explorationEnabled,

    rounds,

    discoveryCount,

    consumptionCount,

    cumulativeReward,

    finalBrain:
      brain,

    weightChanges,
  };
}

/*
 * Primary M3.6 experience-acquisition
 * experiment plus the two prospectively locked
 * causal controls.
 */
export function runM3ExperienceAcquisitionExperiment():
  M3ExperienceAcquisitionExperimentResult {
  return {
    branchA:
      runM3AcquisitionBranch({
        seed:
          M3_PRIMARY_BRANCH_A_SEED,

        learningEnabled:
          M3_ACQUISITION_LEARNING_ENABLED,

        explorationEnabled:
          true,
      }),

    branchB:
      runM3AcquisitionBranch({
        seed:
          M3_PRIMARY_BRANCH_B_SEED,

        learningEnabled:
          M3_ACQUISITION_LEARNING_ENABLED,

        explorationEnabled:
          true,
      }),

    learningDisabledControl:
      runM3AcquisitionBranch({
        seed:
          M3_LEARNING_DISABLED_CONTROL
            .seed,

        learningEnabled:
          M3_LEARNING_DISABLED_CONTROL
            .learningEnabled,

        explorationEnabled:
          M3_LEARNING_DISABLED_CONTROL
            .explorationEnabled,
      }),

    explorationDisabledControl:
      runM3AcquisitionBranch({
        seed:
          M3_EXPLORATION_DISABLED_CONTROL
            .seed,

        learningEnabled:
          M3_EXPLORATION_DISABLED_CONTROL
            .learningEnabled,

        explorationEnabled:
          M3_EXPLORATION_DISABLED_CONTROL
            .explorationEnabled,
      }),
  };
}

function actionIdToNodeId(
  actionId:
    string,
): string {
  switch (actionId) {
    case "idle":
      return M1_NODE_IDS
        .idleOutput;

    case "seek":
      return M1_NODE_IDS
        .seekOutput;

    case "eat":
      return M1_NODE_IDS
        .eatOutput;

    case "explore":
      return M3_NODE_IDS
        .exploreOutput;

    default:
      throw new Error(
        `Unknown M3 action: ${actionId}`,
      );
  }
}

/*
 * M3.10A AUTHORITATIVE ACQUISITION PERSISTENCE
 *
 * This is storage/restoration only.
 *
 * Deserializing a checkpoint does not execute
 * a tick, evaluate cognition, sample RNG or
 * regenerate exploration state. It reproduces
 * exactly the authoritative M3AcquisitionState
 * that was serialized.
 *
 * Validation reuses the existing M1 checkpoint
 * primitive-shape checks (position, hunger,
 * food, brain, eligibility, weight changes)
 * plus the existing exploration-state and RNG
 * validators rather than duplicating them.
 */
export function serializeM3AcquisitionState(
  state:
    M3AcquisitionState,
): string {
  assertM3AcquisitionStateShape(
    state,
  );

  return JSON.stringify(
    state,
  );
}

export function deserializeM3AcquisitionState(
  serialized:
    string,
): M3AcquisitionState {
  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        serialized,
      ) as unknown;
  } catch (error) {
    throw new Error(
      "M3 acquisition state is not valid JSON.",
      {
        cause:
          error,
      },
    );
  }

  assertM3AcquisitionStateShape(
    parsed,
  );

  return parsed;
}

export function assertM3AcquisitionStateShape(
  value:
    unknown,
): asserts value is M3AcquisitionState {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "M3 acquisition state must be an object.",
    );
  }

  if (
    value.schemaVersion !==
    M3_ACQUISITION_STATE_SCHEMA_VERSION
  ) {
    throw new Error(
      "Unsupported M3 acquisition state schema version.",
    );
  }

  if (
    !Number.isInteger(
      value.tickIndex,
    ) ||
    (
      value.tickIndex as number
    ) < 0
  ) {
    throw new Error(
      "M3 acquisition tickIndex is invalid.",
    );
  }

  if (
    !isFiniteNumber(
      value.simulationTimeSeconds,
    ) ||
    value.simulationTimeSeconds <
      0
  ) {
    throw new Error(
      "M3 acquisition simulationTimeSeconds is invalid.",
    );
  }

  if (
    typeof value.learningEnabled !==
    "boolean"
  ) {
    throw new Error(
      "M3 acquisition learningEnabled must be a boolean.",
    );
  }

  if (
    typeof value.explorationEnabled !==
    "boolean"
  ) {
    throw new Error(
      "M3 acquisition explorationEnabled must be a boolean.",
    );
  }

  /*
   * M3.2 locks memoryEnabled to false for the
   * authoritative acquisition state. A persisted
   * checkpoint claiming otherwise does not match
   * the contract this state was created under.
   */
  if (
    value.memoryEnabled !==
    false
  ) {
    throw new Error(
      "M3 acquisition memoryEnabled must be false.",
    );
  }

  if (
    !isVector(
      value.position,
    )
  ) {
    throw new Error(
      "M3 acquisition position is invalid.",
    );
  }

  if (
    !isHungerState(
      value.hunger,
    )
  ) {
    throw new Error(
      "M3 acquisition hunger state is invalid.",
    );
  }

  if (
    !isFoodState(
      value.food,
    )
  ) {
    throw new Error(
      "M3 acquisition food state is invalid.",
    );
  }

  if (
    !isSensoryOccluderState(
      value.sensoryOccluder,
    )
  ) {
    throw new Error(
      "M3 acquisition sensory occluder state is invalid.",
    );
  }

  assertValidExplorationStateField(
    value.explorationState,
  );

  if (
    !isBrainState(
      value.brain,
    )
  ) {
    throw new Error(
      "M3 acquisition brain state is invalid.",
    );
  }

  if (
    !isEligibilityTrace(
      value.eligibilityTrace,
    )
  ) {
    throw new Error(
      "M3 acquisition eligibility trace is invalid.",
    );
  }

  assertValidRngStateField(
    value.rngState,
  );

  if (
    !Number.isInteger(
      value.discoveryCount,
    ) ||
    (
      value.discoveryCount as number
    ) < 0
  ) {
    throw new Error(
      "M3 acquisition discoveryCount is invalid.",
    );
  }

  if (
    !Number.isInteger(
      value.consumptionCount,
    ) ||
    (
      value.consumptionCount as number
    ) < 0
  ) {
    throw new Error(
      "M3 acquisition consumptionCount is invalid.",
    );
  }

  if (
    typeof value.ate !==
    "boolean"
  ) {
    throw new Error(
      "M3 acquisition ate flag is invalid.",
    );
  }

  if (
    !isFiniteNumber(
      value.cumulativeReward,
    )
  ) {
    throw new Error(
      "M3 acquisition cumulativeReward is invalid.",
    );
  }

  if (
    !isWeightChanges(
      value.weightChanges,
    )
  ) {
    throw new Error(
      "M3 acquisition weightChanges are invalid.",
    );
  }

  if (
    typeof value.complete !==
    "boolean"
  ) {
    throw new Error(
      "M3 acquisition complete flag is invalid.",
    );
  }
}

function isSensoryOccluderState(
  value:
    unknown,
): value is SensoryOccluderState {
  return (
    isRecord(
      value,
    ) &&
    value.kind ===
      SENSORY_OCCLUDER_KIND &&
    typeof value.active ===
      "boolean" &&
    isFiniteNumber(
      value.x,
    ) &&
    isFiniteNumber(
      value.minY,
    ) &&
    isFiniteNumber(
      value.maxY,
    ) &&
    (
      value.maxY as number
    ) >=
      (
        value.minY as number
      )
  );
}

/*
 * Reuses the existing authoritative
 * ExplorationState validator via
 * deserializeExplorationState(...) rather than
 * duplicating its shape checks here.
 */
function assertValidExplorationStateField(
  value:
    unknown,
): void {
  try {
    deserializeExplorationState(
      JSON.stringify(
        value,
      ),
    );
  } catch (error) {
    throw new Error(
      "M3 acquisition exploration state is invalid.",
      {
        cause:
          error,
      },
    );
  }
}

/*
 * Reuses the authoritative SeededRng
 * constructor validation rather than
 * duplicating its shape/range checks here.
 */
function assertValidRngStateField(
  value:
    unknown,
): void {
  /*
   * The SeededRng constructor treats a bare
   * number as a raw seed rather than a
   * serialized state. A persisted checkpoint
   * must supply the structured
   * { algorithm, state } form, so that lenient
   * constructor path must not be reached here.
   */
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "M3 acquisition RNG state must be an object.",
    );
  }

  try {
    // eslint-disable-next-line no-new
    new SeededRng(
      value as unknown as SeededRngState,
    );
  } catch (error) {
    throw new Error(
      "M3 acquisition RNG state is invalid.",
      {
        cause:
          error,
      },
    );
  }
}