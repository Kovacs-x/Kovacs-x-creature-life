import type {
  BrainState,
} from "./contracts.js";

import {
  SeededRng,
  type SeededRngState,
} from "./rng.js";

import {
  createBrainState,
} from "../brain/network.js";

import {
  createM3Brain,
  evaluateM3Brain,
} from "../brain/m3Brain.js";

import {
  createHungerState,
  type HungerState,
} from "../biology/hunger.js";

import {
  senseHunger,
} from "../senses/hungerSense.js";

import {
  perceiveFood,
  type FoodPerceptionSignal,
} from "../senses/foodPerception.js";

import {
  senseFoodContact,
} from "../senses/foodContact.js";

import {
  createFoodObject,
  type FoodObjectState,
} from "../../world/food.js";

import {
  createExplorationState,
  type ExplorationState,
} from "../drives/exploration.js";

import {
  moveAlongDirection,
} from "../actions/movement.js";

import {
  runM3ExperienceAcquisitionExperiment,
  type M3ExperienceAcquisitionExperimentResult,
} from "./m3Acquisition.js";

import {
  M3_ACQUISITION_MOVE_DISTANCE,
  M3_EXPLORATION_PRESSURE_CONFIG,
  M3_HABITAT_BOUNDS,
  M3_SAME_SEED_REPLAY_SEED,
  M3_STANDARDIZED_PROBE,
} from "./m3Contract.js";

export const M3_LEARNING_COMPARISON_FRESH_IDENTITY =
  "m3-learning-comparison-fresh-equivalent" as const;

export const M3_LEARNING_COMPARISON_CURRENT_IDENTITY =
  "m3-learning-comparison-current-learned" as const;

export const M3_PROBE_IDENTITY_A =
  "m3-probe-identity-a" as const;

export const M3_PROBE_IDENTITY_B =
  "m3-probe-identity-b" as const;

export const M3_PROBE_LEARNING_DISABLED_IDENTITY =
  "m3-probe-learning-disabled" as const;

export const M3_PROBE_EXPLORATION_DISABLED_IDENTITY =
  "m3-probe-exploration-disabled" as const;

export type M3ProbeMovementSource =
  "seek" |
  null;

export interface M3ProbeNormalizedState {
  readonly position: {
    readonly x: number;
    readonly y: number;
  };

  readonly hunger:
    HungerState;

  readonly food:
    FoodObjectState;

  readonly directPerceptionConditions: {
    readonly occluded:
      false;

    readonly perceptionRange:
      number;
  };

  readonly directFoodPerception:
    FoodPerceptionSignal;

  readonly foodContactInRange:
    boolean;

  /*
   * M2 memory is deliberately absent from the
   * standardized probe.
   *
   * The later behavioural difference therefore
   * cannot be attributed to current remembered
   * food evidence.
   */
  readonly foodMemory:
    null;

  /*
   * Eligibility is deliberately normalized.
   *
   * Only already-consolidated connection
   * weights survive from acquisition.
   */
  readonly eligibilityTrace:
    readonly [];

  /*
   * Exploration is disabled for the probe.
   *
   * Pressure and heading state are still made
   * explicit so the normalization is directly
   * inspectable.
   */
  readonly explorationEnabled:
    false;

  readonly explorationState:
    ExplorationState;

  /*
   * The probe itself does not consume RNG.
   *
   * A common canonical state is still recorded
   * to prove that current random state is not a
   * source of the behavioural difference.
   */
  readonly rngState:
    SeededRngState;
}

export interface M3StandardizedProbeResult {
  /*
   * Diagnostic identity is deliberately carried
   * outside cognition.
   *
   * It is never supplied to evaluateM3Brain().
   */
  readonly identity:
    string;

  readonly normalizedState:
    M3ProbeNormalizedState;

  /*
   * Brain immediately before probe evaluation.
   *
   * Historical node activations have been reset
   * to zero.
   *
   * Connection weights are preserved.
   */
  readonly normalizedBrainBefore:
    BrainState;

  readonly evaluatedBrain:
    BrainState;

  readonly connectionWeights:
    Readonly<Record<string, number>>;

  readonly idleActivation:
    number;

  readonly seekActivation:
    number;

  readonly eatActivation:
    number;

  readonly exploreActivation:
    number;

  readonly selectedActionId:
    string;

  readonly movementSource:
    M3ProbeMovementSource;

  readonly positionAfter: {
    readonly x: number;
    readonly y: number;
  };

  readonly distanceMoved:
    number;

  readonly rngStateAfter:
    SeededRngState;
}

export interface M3IndividualityProbeExperimentResult {
  readonly acquisition:
    M3ExperienceAcquisitionExperimentResult;

  readonly branchA:
    M3StandardizedProbeResult;

  readonly branchB:
    M3StandardizedProbeResult;

  readonly learningDisabledControl:
    M3StandardizedProbeResult;

  readonly explorationDisabledControl:
    M3StandardizedProbeResult;

  readonly identityAWithBranchBWeights:
    M3StandardizedProbeResult;

  readonly identityBWithBranchAWeights:
    M3StandardizedProbeResult;
}

/*
 * Normalize transient neural activation while
 * preserving the learned connection state.
 *
 * evaluateBrain() already recomputes activation
 * from current inputs rather than historical
 * node activation.
 *
 * M3.7 additionally resets stored node
 * activations explicitly so the standardized
 * probe makes the normalization visible and
 * inspectable.
 */
export function normalizeM3ProbeBrain(
  brain:
    BrainState,
): BrainState {
  return createBrainState(
    brain.nodes.map(
      (node) => ({
        ...node,

        activation:
          0,
      }),
    ),

    brain.connections.map(
      (connection) => ({
        ...connection,
      }),
    ),
  );
}

/*
 * Transfer only neural connection weights from
 * one otherwise compatible M3 brain into
 * another.
 *
 * This is the M3.7 experience-state swap
 * mechanism.
 *
 * It does not transfer:
 *
 * - identity;
 * - node activation;
 * - eligibility;
 * - biology;
 * - memory;
 * - exploration pressure;
 * - heading;
 * - RNG;
 * - position;
 * - world state.
 */
export function copyM3LearnedConnectionWeights(
  targetBrain:
    BrainState,

  sourceBrain:
    BrainState,
): BrainState {
  if (
    targetBrain.connections.length !==
    sourceBrain.connections.length
  ) {
    throw new Error(
      "M3 experience-state swap requires compatible brain connection counts.",
    );
  }

  const sourceConnections =
    new Map(
      sourceBrain.connections.map(
        (connection) => [
          connection.id,
          connection,
        ],
      ),
    );

  const connections =
    targetBrain.connections.map(
      (targetConnection) => {
        const sourceConnection =
          sourceConnections.get(
            targetConnection.id,
          );

        if (
          sourceConnection ===
          undefined
        ) {
          throw new Error(
            `M3 experience-state swap is missing source connection: ${targetConnection.id}`,
          );
        }

        if (
          sourceConnection.sourceNodeId !==
            targetConnection.sourceNodeId ||
          sourceConnection.targetNodeId !==
            targetConnection.targetNodeId
        ) {
          throw new Error(
            `M3 experience-state swap found incompatible connection endpoints: ${targetConnection.id}`,
          );
        }

        if (
          sourceConnection.enabled !==
          targetConnection.enabled
        ) {
          throw new Error(
            `M3 experience-state swap found incompatible enabled state: ${targetConnection.id}`,
          );
        }

        return {
          ...targetConnection,

          /*
           * Weight is the only transferred
           * experience-shaped field.
           */
          weight:
            sourceConnection.weight,
        };
      },
    );

  return createBrainState(
    targetBrain.nodes.map(
      (node) => ({
        ...node,

        /*
         * Historical activation is not part of
         * the transferred experience state.
         */
        activation:
          0,
      }),
    ),

    connections,
  );
}

/*
 * STANDARDIZED LATER PROBE
 *
 * The probe deliberately reproduces the locked
 * harder M1 food-seeking conditions:
 *
 * Creature:
 *   (0, 0)
 *
 * energy:
 *   0.5 / 1
 *
 * food:
 *   (6, 0)
 *
 * perception range:
 *   10
 *
 * eating/contact range:
 *   0.25
 *
 * Current memory:
 *   none
 *
 * Current exploration:
 *   disabled
 *
 * Eligibility:
 *   none
 *
 * Current RNG:
 *   identical canonical state
 *
 * The only branch-specific state intentionally
 * preserved is learned neural connection
 * weights.
 */
export function runM3StandardizedProbe(
  identity:
    string,

  learnedBrain:
    BrainState,
): M3StandardizedProbeResult {
  if (
    identity.trim().length ===
    0
  ) {
    throw new Error(
      "M3 standardized probe identity must not be empty.",
    );
  }

  const normalizedBrainBefore =
    normalizeM3ProbeBrain(
      learnedBrain,
    );

  const position = {
    x:
      M3_STANDARDIZED_PROBE
        .creaturePosition.x,

    y:
      M3_STANDARDIZED_PROBE
        .creaturePosition.y,
  };

  const hunger =
    createHungerState(
      M3_STANDARDIZED_PROBE
        .hungerEnergy,

      M3_STANDARDIZED_PROBE
        .maxEnergy,
    );

  const food =
    createFoodObject(
      M3_STANDARDIZED_PROBE
        .food.id,

      M3_STANDARDIZED_PROBE
        .food.x,

      M3_STANDARDIZED_PROBE
        .food.y,

      M3_STANDARDIZED_PROBE
        .food.nutrition,
    );

  /*
   * No occluder is present in the standardized
   * probe.
   *
   * Direct sensory evidence is therefore derived
   * legitimately from the ordinary perception
   * mechanism.
   */
  const directFoodPerception =
    perceiveFood(
      position,

      food,

      {
        maxRange:
          M3_STANDARDIZED_PROBE
            .perceptionRange,
      },

      {
        occluded:
          false,
      },
    );

  if (
    directFoodPerception ===
    null
  ) {
    throw new Error(
      "Locked M3 standardized probe food must be directly perceptible.",
    );
  }

  const hungerSignal =
    senseHunger(
      hunger,
    );

  const contactSignal =
    senseFoodContact(
      position,

      food,

      M3_STANDARDIZED_PROBE
        .interactionRange,
    );

  const explorationState =
    createExplorationState(
      0,

      M3_EXPLORATION_PRESSURE_CONFIG,
    );

  const probeRng =
    new SeededRng(
      M3_SAME_SEED_REPLAY_SEED,
    );

  const normalizedState:
    M3ProbeNormalizedState = {
      position,

      hunger,

      food,

      directPerceptionConditions: {
        occluded:
          false,

        perceptionRange:
          M3_STANDARDIZED_PROBE
            .perceptionRange,
      },

      directFoodPerception,

      foodContactInRange:
        contactSignal.inRange,

      foodMemory:
        null,

      eligibilityTrace:
        [],

      explorationEnabled:
        false,

      explorationState,

      rngState:
        probeRng.state,
    };

  /*
   * Identity is intentionally absent from this
   * call.
   *
   * M3 cognition receives only current sensory
   * and internal signals plus the learned brain.
   */
  const decision =
    evaluateM3Brain(
      normalizedBrainBefore,

      hungerSignal,

      directFoodPerception,

      /*
       * Exploration is normalized away.
       */
      0,

      contactSignal,

      /*
       * Memory is normalized away.
       */
      null,
    );

  /*
   * Explicitly widen these coordinates to
   * ordinary numbers.
   *
   * M3_STANDARDIZED_PROBE is declared `as const`,
   * so without this annotation TypeScript would
   * infer the initial value as exactly:
   *
   * { x: 0; y: 0 }
   *
   * SEEK movement must be able to replace those
   * coordinates with ordinary numeric results.
   */
  let positionAfter: {
    x: number;
    y: number;
  } = {
    x:
      position.x,

    y:
      position.y,
  };

  let movementSource:
    M3ProbeMovementSource =
      null;

  let distanceMoved =
    0;

  /*
   * Add the ordinary physical consequence so
   * the probe records not only neural/action
   * divergence but whether that divergence
   * actually changes movement.
   *
   * Movement direction still comes from the
   * legitimate direct sensory signal.
   */
  if (
    decision.selectedActionId ===
    "seek"
  ) {
    const movement =
      moveAlongDirection(
        position,

        directFoodPerception
          .directionX,

        directFoodPerception
          .directionY,

        M3_ACQUISITION_MOVE_DISTANCE,

        M3_HABITAT_BOUNDS,
      );

    positionAfter = {
      x:
        movement.position.x,

      y:
        movement.position.y,
    };

    movementSource =
      "seek";

    distanceMoved =
      movement.distanceMoved;
  }

  const connectionWeights:
    Record<string, number> =
      Object.fromEntries(
        normalizedBrainBefore
          .connections
          .map(
            (connection) => [
              connection.id,
              connection.weight,
            ],
          ),
      );

  /*
   * The standardized probe contains no
   * stochastic operation.
   *
   * Current RNG state therefore remains
   * unchanged.
   */
  const rngStateAfter =
    probeRng.state;

  return {
    identity,

    normalizedState,

    normalizedBrainBefore,

    evaluatedBrain:
      decision.brain,

    connectionWeights,

    idleActivation:
      decision.idleActivation,

    seekActivation:
      decision.seekActivation,

    eatActivation:
      decision.eatActivation,

    exploreActivation:
      decision.exploreActivation,

    selectedActionId:
      decision.selectedActionId,

    movementSource,

    positionAfter,

    distanceMoved,

    rngStateAfter,
  };
}

/*
 * CENTRAL M3 INDIVIDUALITY EXPERIMENT
 *
 * Phase A:
 *
 * prospectively locked exploration histories
 * → different legitimate experience
 * → different learned brain state
 *
 * Phase B:
 *
 * normalize current/transient state
 * → preserve learned connection weights
 * → compare later behaviour
 *
 * Then:
 *
 * swap learned connection weights between
 * diagnostic identities
 * → behaviour should follow learned state
 * → not identity.
 */
export function runM3IndividualityProbeExperiment():
  M3IndividualityProbeExperimentResult {
  const acquisition =
    runM3ExperienceAcquisitionExperiment();

  const branchA =
    runM3StandardizedProbe(
      M3_PROBE_IDENTITY_A,

      acquisition.branchA
        .finalBrain,
    );

  const branchB =
    runM3StandardizedProbe(
      M3_PROBE_IDENTITY_B,

      acquisition.branchB
        .finalBrain,
    );

  const learningDisabledControl =
    runM3StandardizedProbe(
      M3_PROBE_LEARNING_DISABLED_IDENTITY,

      acquisition
        .learningDisabledControl
        .finalBrain,
    );

  const explorationDisabledControl =
    runM3StandardizedProbe(
      M3_PROBE_EXPLORATION_DISABLED_IDENTITY,

      acquisition
        .explorationDisabledControl
        .finalBrain,
    );

  /*
   * Identity A receives Branch B's learned
   * weights.
   */
  const identityAWithBranchBWeights =
    runM3StandardizedProbe(
      M3_PROBE_IDENTITY_A,

      copyM3LearnedConnectionWeights(
        acquisition.branchA
          .finalBrain,

        acquisition.branchB
          .finalBrain,
      ),
    );

  /*
   * Identity B receives Branch A's learned
   * weights.
   */
  const identityBWithBranchAWeights =
    runM3StandardizedProbe(
      M3_PROBE_IDENTITY_B,

      copyM3LearnedConnectionWeights(
        acquisition.branchB
          .finalBrain,

        acquisition.branchA
          .finalBrain,
      ),
    );

  return {
    acquisition,

    branchA,

    branchB,

    learningDisabledControl,

    explorationDisabledControl,

    identityAWithBranchBWeights,

    identityBWithBranchAWeights,
  };
}

/*
 * M3.11R STANDARDIZED LEARNING COMPARISON
 *
 * A small READ-ONLY diagnostic that makes
 * whether this Creature's learned neural state
 * actually matters inspectable, without inventing
 * a second probe mechanism.
 *
 * It runs the already-accepted
 * runM3StandardizedProbe(...) exactly twice under
 * the identical locked normalized conditions:
 *
 * - once with a genuinely fresh, unlearned M3
 *   brain;
 * - once with this Creature's current brain,
 *   exactly as supplied.
 *
 * runM3StandardizedProbe(...) already normalizes
 * position, hunger, food, perception, memory,
 * eligibility, exploration and RNG and only ever
 * constructs new BrainState objects internally
 * (normalizeM3ProbeBrain/evaluateBrain never
 * mutate their input). Calling it here therefore:
 *
 * - does not modify the running Creature's brain,
 *   position, biology, memory, exploration state
 *   or RNG;
 * - does not rerun or alter the Creature's
 *   acquisition history;
 * - does not feed anything back into cognition;
 * - consumes no authoritative simulation RNG.
 *
 * The comparison may truthfully show no
 * difference. It must not be presented as
 * guaranteeing one.
 */
export interface M3StandardizedLearningComparison {
  readonly freshEquivalent:
    M3StandardizedProbeResult;

  readonly currentLearned:
    M3StandardizedProbeResult;

  readonly connectionWeightsDiffer:
    boolean;

  readonly selectedActionDiffers:
    boolean;
}

export function runM3StandardizedLearningComparison(
  currentBrain:
    BrainState,
): M3StandardizedLearningComparison {
  const freshEquivalent =
    runM3StandardizedProbe(
      M3_LEARNING_COMPARISON_FRESH_IDENTITY,

      createM3Brain(),
    );

  const currentLearned =
    runM3StandardizedProbe(
      M3_LEARNING_COMPARISON_CURRENT_IDENTITY,

      currentBrain,
    );

  const connectionWeightsDiffer =
    JSON.stringify(
      freshEquivalent
        .connectionWeights,
    ) !==
    JSON.stringify(
      currentLearned
        .connectionWeights,
    );

  const selectedActionDiffers =
    freshEquivalent
      .selectedActionId !==
    currentLearned
      .selectedActionId;

  return {
    freshEquivalent,

    currentLearned,

    connectionWeightsDiffer,

    selectedActionDiffers,
  };
}