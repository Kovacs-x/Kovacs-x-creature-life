import type {
  RandomSource,
} from "./rng.js";

import type {
  Position2D,
} from "../actions/movement.js";

import type {
  ExplorationState,
} from "../drives/exploration.js";

import type {
  FoodObjectState,
} from "../../world/food.js";

import type {
  FoodPerceptionSignal,
} from "../senses/foodPerception.js";

import type {
  SensoryOccluderState,
} from "../../world/sensoryOccluder.js";

import {
  perceiveFood,
} from "../senses/foodPerception.js";

import {
  isLineOfSightOccludedBySensoryOccluder,
} from "../../world/sensoryOccluder.js";

import {
  executeM3ExploratoryMovement,
  M3_EXPLORATION_MOVEMENT_SOURCE,
  type M3ExploratoryMovementResult,
} from "../actions/explorationMovement.js";

import {
  M3_ACQUISITION_PERCEPTION_RANGE,
} from "./m3Contract.js";

export interface M3DirectFoodPerceptionSnapshot {
  readonly occluded:
    boolean;

  readonly foodSignal:
    FoodPerceptionSignal | null;
}

export interface M3DiscoveryStepResult {
  readonly beforePerception:
    M3DirectFoodPerceptionSnapshot;

  readonly movement:
    M3ExploratoryMovementResult;

  readonly afterPerception:
    M3DirectFoodPerceptionSnapshot;

  /*
   * Observational event evidence only.
   *
   * This boolean is not Creature cognitive
   * state and is not supplied back into:
   *
   * - the brain;
   * - memory;
   * - action competition;
   * - movement.
   *
   * Later telemetry/life-history systems may
   * observe it.
   */
  readonly autonomousDiscoveryOccurred:
    boolean;
}

/*
 * Legitimate M3 food sensory transformation.
 *
 * World geometry is allowed to inspect:
 *
 * - Creature position;
 * - food position;
 * - sensory-occluder geometry.
 *
 * The result exposed to cognition is only the
 * existing FoodPerceptionSignal or null.
 *
 * This function does not:
 *
 * - select an action;
 * - create exploration pressure;
 * - sample RNG;
 * - alter memory;
 * - command movement.
 */
export function deriveM3DirectFoodPerception(
  position:
    Position2D,

  food:
    FoodObjectState,

  sensoryOccluder:
    SensoryOccluderState,
): M3DirectFoodPerceptionSnapshot {
  const occluded =
    !food.consumed &&
    isLineOfSightOccludedBySensoryOccluder(
      position,
      food.position,
      sensoryOccluder,
    );

  const foodSignal =
    perceiveFood(
      position,

      food,

      {
        maxRange:
          M3_ACQUISITION_PERCEPTION_RANGE,
      },

      {
        occluded,
      },
    );

  return {
    occluded,
    foodSignal,
  };
}

/*
 * M3.5 ENVIRONMENTAL DISCOVERY TRANSITION
 *
 * This function joins two already established
 * mechanisms:
 *
 * already-selected action
 *      ↓
 * M3.4 exploratory physical movement
 *      ↓
 * new physical Creature position
 *      ↓
 * real occlusion geometry
 *      ↓
 * existing food-perception transformation
 *
 * The same immutable food state is used before
 * and after movement.
 *
 * There is no external food relocation inside
 * this transition.
 *
 * Therefore a discovery event can only occur
 * because the Creature itself physically
 * changed its sensory relationship to the
 * world.
 */
export function resolveM3DiscoveryStep(
  position:
    Position2D,

  explorationState:
    ExplorationState,

  selectedActionId:
    string,

  randomSource:
    RandomSource,

  simulationTimeSeconds:
    number,

  food:
    FoodObjectState,

  sensoryOccluder:
    SensoryOccluderState,
): M3DiscoveryStepResult {
  const beforePerception =
    deriveM3DirectFoodPerception(
      position,
      food,
      sensoryOccluder,
    );

  /*
   * The movement resolver itself has no food,
   * perception, memory or target argument.
   *
   * Its heading therefore cannot use anything
   * calculated below by the sensory system.
   */
  const movement =
    executeM3ExploratoryMovement(
      position,

      explorationState,

      selectedActionId,

      randomSource,

      simulationTimeSeconds,
    );

  const afterPerception =
    deriveM3DirectFoodPerception(
      movement.position,
      food,
      sensoryOccluder,
    );

  const autonomousDiscoveryOccurred =
    beforePerception.foodSignal ===
      null &&
    selectedActionId ===
      "explore" &&
    movement.movementSource ===
      M3_EXPLORATION_MOVEMENT_SOURCE &&
    movement.distanceMoved >
      0 &&
    afterPerception.foodSignal !==
      null;

  return {
    beforePerception,
    movement,
    afterPerception,
    autonomousDiscoveryOccurred,
  };
}