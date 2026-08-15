import type {
  BrainState,
} from "./contracts.js";

import {
  selectHighestActivation,
} from "../actions/competition.js";

import {
  M1_NODE_IDS,
} from "../brain/m1Brain.js";

import {
  advanceM1Episode,
  createM1EpisodeState,
  M1_EPISODE_PERCEPTION_RANGE,
  type M1EpisodeState,
} from "./m1Episode.js";

import {
  recallFoodMemory,
  type FoodMemoryRecallSignal,
} from "../memory/foodMemory.js";

import {
  perceiveFood,
} from "../senses/foodPerception.js";

import type {
  HungerState,
} from "../biology/hunger.js";

import type {
  FoodObjectState,
} from "../../world/food.js";

/*
 * This is the already-established M2 primary
 * behavioural probe distance.
 *
 * It is deliberately declared as experiment
 * configuration rather than hidden inside
 * behavioural mechanism.
 */
export const M2_EXPERIMENT_FOOD_X =
  3;

export interface M2ExperimentPosition {
  readonly x:
    number;

  readonly y:
    number;
}

/*
 * These values describe the controlled
 * conditions immediately before the
 * occluded probe tick.
 *
 * They are experiment-side observations.
 * They are not supplied to cognition.
 */
export interface M2ExperimentProbeStart {
  readonly position:
    M2ExperimentPosition;

  readonly hunger:
    HungerState;

  readonly food:
    FoodObjectState;

  readonly brain:
    BrainState;
}

export interface M2ExperimentBranchResult {
  readonly memoryEnabled:
    boolean;

  readonly probeStart:
    M2ExperimentProbeStart;

  /*
   * The food remains physically present
   * during the probe.
   */
  readonly physicalFoodPresent:
    boolean;

  /*
   * Must be false for both branches during
   * the primary occluded probe.
   */
  readonly directFoodPerceptionPresent:
    boolean;

  /*
   * Only the memory-enabled branch should
   * possess usable recall.
   */
  readonly recallPresent:
    boolean;

  readonly memoryConfidence:
    number | null;

  readonly idleActivation:
    number;

  readonly seekActivation:
    number;

  readonly eatActivation:
    number;

  readonly selectedActionId:
    string;

  readonly probeEndPosition:
    M2ExperimentPosition;

  readonly displacement:
    M2ExperimentPosition;

  /*
   * Signed movement projected onto the
   * legitimately remembered direction from
   * the memory-enabled branch.
   *
   * Positive means progress in that
   * remembered direction.
   */
  readonly rememberedDirectionMovement:
    number;
}

export interface M2ExperimentResult {
  /*
   * The comparison axis comes from legitimate
   * recall formed during the shared visible
   * experience.
   *
   * It is not reconstructed from current
   * hidden food position.
   */
  readonly referenceRememberedDirection:
    M2ExperimentPosition;

  readonly memoryEnabled:
    M2ExperimentBranchResult;

  readonly memoryDisabled:
    M2ExperimentBranchResult;
}

/*
 * M2.5 CONTROLLED BEHAVIOURAL EXPERIMENT
 *
 * This function does NOT implement another
 * simulation loop.
 *
 * It orchestrates the existing authoritative
 * episode transition:
 *
 * state
 *   ->
 * advanceM1Episode
 *   ->
 * new state
 *
 * for two otherwise equivalent conditions.
 */
export function runM2Experiment():
  M2ExperimentResult {
  const memoryEnabledBeforeProbe =
    createOccludedProbeInput(
      true,
    );

  const memoryDisabledBeforeProbe =
    createOccludedProbeInput(
      false,
    );

  /*
   * The experiment's movement comparison
   * direction must come from legitimate
   * memory, not current world truth.
   */
  const referenceRecall =
    recallFoodMemory(
      memoryEnabledBeforeProbe
        .foodMemory ??
        null,
    );

  if (referenceRecall === null) {
    throw new Error(
      "M2 experiment requires legitimate recall before the occluded probe.",
    );
  }

  const referenceRememberedDirection =
    normaliseRecallDirection(
      referenceRecall,
    );

  const memoryEnabledAfterProbe =
    advanceM1Episode(
      memoryEnabledBeforeProbe,
    );

  const memoryDisabledAfterProbe =
    advanceM1Episode(
      memoryDisabledBeforeProbe,
    );

  return {
    referenceRememberedDirection,

    memoryEnabled:
      measureBranch(
        memoryEnabledBeforeProbe,
        memoryEnabledAfterProbe,
        referenceRememberedDirection,
      ),

    memoryDisabled:
      measureBranch(
        memoryDisabledBeforeProbe,
        memoryDisabledAfterProbe,
        referenceRememberedDirection,
      ),
  };
}

function createOccludedProbeInput(
  memoryEnabled:
    boolean,
): M1EpisodeState {
  /*
   * Both experimental branches receive the
   * same initial world, biology, timing and
   * visible-food experience.
   *
   * The controlled difference is whether
   * usable food memory is enabled.
   */
  const initial =
    createM1EpisodeState(
      {
        learningEnabled:
          false,

        memoryEnabled,

        foodX:
          M2_EXPERIMENT_FOOD_X,

        foodOccluded:
          false,
      },
    );

  /*
   * Shared visible tick:
   *
   * direct perception is available to both.
   *
   * Only the memory-enabled branch retains
   * an internal memory trace afterward.
   */
  const afterVisibleTick =
    advanceM1Episode(
      initial,
    );

  /*
   * Environmental intervention:
   *
   * The food remains physically present,
   * but direct sensory access is removed.
   */
  return {
    ...afterVisibleTick,

    foodOccluded:
      true,
  };
}

function measureBranch(
  beforeProbe:
    M1EpisodeState,

  afterProbe:
    M1EpisodeState,

  referenceDirection:
    M2ExperimentPosition,
): M2ExperimentBranchResult {
  /*
   * Independently verify the sensory
   * condition at the beginning of the probe.
   *
   * This diagnostic query uses the real
   * sensory transformation rather than
   * assuming that occluded means null.
   */
  const directFoodSignal =
    perceiveFood(
      beforeProbe.position,

      beforeProbe.food,

      {
        maxRange:
          M1_EPISODE_PERCEPTION_RANGE,
      },

      {
        occluded:
          beforeProbe
            .foodOccluded ??
          false,
      },
    );

  const recall =
    recallFoodMemory(
      beforeProbe
        .foodMemory ??
        null,
    );

  const idleActivation =
    getBrainActivation(
      afterProbe,

      M1_NODE_IDS.idleOutput,
    );

  const seekActivation =
    getBrainActivation(
      afterProbe,

      M1_NODE_IDS.seekOutput,
    );

  const eatActivation =
    getBrainActivation(
      afterProbe,

      M1_NODE_IDS.eatOutput,
    );

  /*
   * Reconstruct the observable winner from
   * the same action activations using the
   * same generic competition mechanism.
   *
   * This does not affect simulation state.
   */
  const selection =
    selectHighestActivation(
      [
        {
          actionId:
            "idle",

          activation:
            idleActivation,
        },

        {
          actionId:
            "seek",

          activation:
            seekActivation,
        },

        {
          actionId:
            "eat",

          activation:
            eatActivation,
        },
      ],
    );

  const displacement = {
    x:
      afterProbe.position.x -
      beforeProbe.position.x,

    y:
      afterProbe.position.y -
      beforeProbe.position.y,
  };

  const rememberedDirectionMovement =
    displacement.x *
      referenceDirection.x +
    displacement.y *
      referenceDirection.y;

  return {
    memoryEnabled:
      beforeProbe
        .memoryEnabled ??
      false,

    probeStart: {
      position:
        beforeProbe.position,

      hunger:
        beforeProbe.hunger,

      food:
        beforeProbe.food,

      brain:
        beforeProbe.brain,
    },

    physicalFoodPresent:
      !beforeProbe
        .food
        .consumed,

    directFoodPerceptionPresent:
      directFoodSignal !==
      null,

    recallPresent:
      recall !==
      null,

    memoryConfidence:
      recall?.confidence ??
      null,

    idleActivation,

    seekActivation,

    eatActivation,

    selectedActionId:
      selection.selectedActionId,

    probeEndPosition:
      afterProbe.position,

    displacement,

    rememberedDirectionMovement,
  };
}

function normaliseRecallDirection(
  recall:
    FoodMemoryRecallSignal,
): M2ExperimentPosition {
  const magnitude =
    Math.hypot(
      recall.directionX,
      recall.directionY,
    );

  if (magnitude === 0) {
    throw new Error(
      "M2 experiment remembered direction must be non-zero.",
    );
  }

  return {
    x:
      recall.directionX /
      magnitude,

    y:
      recall.directionY /
      magnitude,
  };
}

function getBrainActivation(
  state:
    M1EpisodeState,

  nodeId:
    string,
): number {
  const node =
    state.brain.nodes.find(
      (candidate) =>
        candidate.id ===
        nodeId,
    );

  if (node === undefined) {
    throw new Error(
      `Missing brain node: ${nodeId}`,
    );
  }

  return node.activation;
}