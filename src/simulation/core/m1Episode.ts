import type {
  BrainState,
} from "./contracts.js";

import {
  advanceHungerOverTime,
  createHungerState,
  type HungerState,
} from "../biology/hunger.js";

import {
  createM1Brain,
  evaluateM1Brain,
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
  perceiveFood,
} from "../senses/foodPerception.js";

import {
  senseHunger,
} from "../senses/hungerSense.js";

import {
  senseFoodContact,
} from "../senses/foodContact.js";

import {
  advanceFoodMemory,
  encodeFoodMemory,
  FOOD_MEMORY_INITIAL_CONFIDENCE,
  FOOD_MEMORY_KIND,
  FOOD_MEMORY_SOURCE,
  FOOD_MEMORY_TRACE_SCHEMA_VERSION,
  recallFoodMemory,
  type FoodMemoryTrace,
} from "../memory/foodMemory.js";

import {
  createFoodObject,
  type FoodObjectState,
} from "../../world/food.js";

export const M1_EPISODE_SCHEMA_VERSION =
  1 as const;

export const M1_EPISODE_TICK_SECONDS =
  1;

export const M1_EPISODE_ENERGY_LOSS_PER_SECOND =
  0.02;

export const M1_EPISODE_MOVE_DISTANCE =
  1;

export const M1_EPISODE_INTERACTION_RANGE =
  0.25;

export const M1_EPISODE_PERCEPTION_RANGE =
  10;

export interface M1EpisodeConfig {
  readonly learningEnabled:
    boolean;

  readonly brain?:
    BrainState;

  /*
   * Optional only so adversarial tests can
   * place food at a different distance.
   *
   * This does not expose coordinates to the
   * Creature's brain. It configures world
   * truth before the episode begins.
   */
  readonly foodX?:
    number;

  /*
   * Current environmental visibility
   * condition for food perception.
   *
   * false is the M1-compatible default.
   *
   * This is world/sensory state, not
   * cognitive memory.
   */
  readonly foodOccluded?:
    boolean;

  /*
   * Enables formation and use of the M2
   * food-memory trace.
   *
   * false preserves the accepted M1
   * behaviour and provides the required
   * memory-disabled control.
   */
  readonly memoryEnabled?:
    boolean;
}

export interface M1EpisodeState {
  readonly schemaVersion:
    typeof M1_EPISODE_SCHEMA_VERSION;

  readonly tickIndex:
    number;

  /*
   * Explicit simulation time used by the
   * M2 memory mechanism.
   *
   * Optional so earlier schema-1 M1
   * checkpoints remain readable.
   */
  readonly simulationTimeSeconds?:
    number;

  readonly learningEnabled:
    boolean;

  /*
   * Optional for backward compatibility
   * with earlier schema-1 M1 checkpoints.
   *
   * Missing means false.
   */
  readonly memoryEnabled?:
    boolean;

  readonly position: {
    readonly x: number;
    readonly y: number;
  };

  readonly hunger:
    HungerState;

  readonly food:
    FoodObjectState;

  /*
   * Current sensory accessibility of food.
   *
   * Missing means false.
   */
  readonly foodOccluded?:
    boolean;

  /*
   * Persistent sensory-derived memory.
   *
   * It is part of simulation state and not
   * a test closure, UI value or hidden world
   * lookup.
   */
  readonly foodMemory?:
    FoodMemoryTrace | null;

  readonly brain:
    BrainState;

  readonly eligibilityTrace:
    readonly ConnectionEligibility[];

  readonly complete:
    boolean;

  readonly ate:
    boolean;

  readonly cumulativeReward:
    number;

  readonly weightChanges:
    readonly WeightChange[];
}

export function createM1EpisodeState(
  config:
    M1EpisodeConfig,
): M1EpisodeState {
  const foodX =
    config.foodX ??
    1.2;

  if (
    !Number.isFinite(
      foodX,
    ) ||
    foodX <= 0
  ) {
    throw new RangeError(
      "M1 episode foodX must be a positive finite number.",
    );
  }

  return {
    schemaVersion:
      M1_EPISODE_SCHEMA_VERSION,

    tickIndex:
      0,

    simulationTimeSeconds:
      0,

    learningEnabled:
      config.learningEnabled,

    memoryEnabled:
      config.memoryEnabled ??
      false,

    position: {
      x: 0,
      y: 0,
    },

    hunger:
      createHungerState(
        0.1,
        1,
      ),

    food:
      createFoodObject(
        "food-1",
        foodX,
        0,
        0.5,
      ),

    foodOccluded:
      config.foodOccluded ??
      false,

    foodMemory:
      null,

    brain:
      config.brain ??
      createM1Brain(),

    eligibilityTrace:
      [],

    complete:
      false,

    ate:
      false,

    cumulativeReward:
      0,

    weightChanges:
      [],
  };
}

export function advanceM1Episode(
  state:
    M1EpisodeState,
): M1EpisodeState {
  if (state.complete) {
    throw new Error(
      "Cannot advance a completed M1 episode.",
    );
  }

  /*
   * Earlier M1 checkpoints do not contain
   * explicit simulationTimeSeconds.
   *
   * The episode has always used one-second
   * ticks, so tickIndex reconstructs the
   * corresponding explicit simulation time.
   */
  const simulationTimeSeconds =
    state.simulationTimeSeconds ??
    state.tickIndex *
      M1_EPISODE_TICK_SECONDS;

  const nextSimulationTimeSeconds =
    simulationTimeSeconds +
    M1_EPISODE_TICK_SECONDS;

  const memoryEnabled =
    state.memoryEnabled ??
    false;

  const foodOccluded =
    state.foodOccluded ??
    false;

  /*
   * Direct perception is rebuilt from the
   * current world and sensory conditions on
   * every tick.
   */
  const foodSignal =
    perceiveFood(
      state.position,

      state.food,

      {
        maxRange:
          M1_EPISODE_PERCEPTION_RANGE,
      },

      {
        occluded:
          foodOccluded,
      },
    );

  /*
   * MEMORY STATE UPDATE
   *
   * Memory may only come from:
   *
   * 1. a legitimate direct perception; or
   * 2. the Creature's previous trace.
   *
   * This code does not inspect hidden food
   * coordinates while recalling.
   */
  let foodMemory:
    FoodMemoryTrace | null =
      state.foodMemory ??
      null;

  if (!memoryEnabled) {
    foodMemory =
      null;
  } else if (
    foodSignal !== null
  ) {
    /*
     * Current legitimate evidence refreshes
     * the memory trace.
     */
    foodMemory =
      encodeFoodMemory(
        foodSignal,
        simulationTimeSeconds,
      );
  } else if (
    foodMemory !== null
  ) {
    /*
     * Without direct perception, the
     * previous internal trace simply ages.
     */
    foodMemory =
      advanceFoodMemory(
        foodMemory,
        simulationTimeSeconds,
      );
  }

  /*
   * RECALL
   *
   * Recall is exposed only while current
   * direct food perception is absent.
   *
   * Direct evidence therefore retains
   * epistemic priority and is not combined
   * with a freshly encoded representation of
   * the same evidence.
   */
  const foodMemoryRecall =
    memoryEnabled &&
    foodSignal === null
      ? recallFoodMemory(
          foodMemory,
        )
      : null;

  const hungerSignal =
    senseHunger(
      state.hunger,
    );

  const contactSignal =
    senseFoodContact(
      state.position,
      state.food,
      M1_EPISODE_INTERACTION_RANGE,
    );

  /*
   * Recall participates through the normal
   * weighted neural architecture.
   *
   * It does not directly choose an action.
   */
  const decision =
    evaluateM1Brain(
      state.brain,

      hungerSignal,

      foodSignal,

      contactSignal,

      foodMemoryRecall,
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
        decay: 0.5,
      },
    );

  let position =
    state.position;

  let hunger =
    state.hunger;

  let food =
    state.food;

  let ateThisTick =
    false;

  /*
   * M2.4 MEMORY-GUIDED MOVEMENT
   *
   * Direction does not cause movement.
   *
   * SEEK must already have won the same
   * generic neural/action competition used
   * elsewhere.
   *
   * Once SEEK has won:
   *
   * 1. current direct direction has priority;
   * 2. otherwise a valid recalled direction
   *    may be used;
   * 3. otherwise no movement occurs.
   *
   * Neither route provides the movement
   * executor with a food object, object ID or
   * hidden target coordinates.
   */
  if (
    decision.selectedActionId ===
    "seek"
  ) {
    const movementDirection =
      foodSignal ??
      foodMemoryRecall;

    if (
      movementDirection !==
      null
    ) {
      const movement =
        moveAlongDirection(
          position,

          movementDirection
            .directionX,

          movementDirection
            .directionY,

          M1_EPISODE_MOVE_DISTANCE,

          {
            minX: 0,
            minY: 0,
            maxX: 10,
            maxY: 10,
          },
        );

      position =
        movement.position;
    }
  }

  const hungerBeforeConsequence =
    hunger;

  if (
    decision.selectedActionId ===
    "eat"
  ) {
    const eatingResult =
      eatFood(
        position,
        hunger,
        food,
        M1_EPISODE_INTERACTION_RANGE,
      );

    hunger =
      eatingResult.hunger;

    food =
      eatingResult.food;

    ateThisTick =
      eatingResult.ate;
  }

  /*
   * Reward continues to derive only from
   * biological consequence.
   */
  const reward =
    deriveEnergyReward(
      hungerBeforeConsequence,
      hunger,
    ).value;

  const plasticity =
    applyRewardPlasticity(
      decision.brain,

      eligibilityTrace,

      reward,

      {
        learningRate:
          0.25,

        minWeight:
          -1,

        maxWeight:
          1,

        learningEnabled:
          state.learningEnabled,
      },
    );

  if (!ateThisTick) {
    hunger =
      advanceHungerOverTime(
        hunger,

        M1_EPISODE_TICK_SECONDS,

        {
          energyLossPerSecond:
            M1_EPISODE_ENERGY_LOSS_PER_SECOND,
        },
      );
  }

  /*
   * Store memory at the end-of-tick
   * simulation time.
   *
   * Decay remains based only on explicit
   * simulation time.
   */
  if (
    memoryEnabled &&
    foodMemory !== null
  ) {
    foodMemory =
      advanceFoodMemory(
        foodMemory,
        nextSimulationTimeSeconds,
      );
  }

  return {
    schemaVersion:
      M1_EPISODE_SCHEMA_VERSION,

    tickIndex:
      state.tickIndex +
      1,

    simulationTimeSeconds:
      nextSimulationTimeSeconds,

    learningEnabled:
      state.learningEnabled,

    memoryEnabled,

    position,

    hunger,

    food,

    foodOccluded,

    foodMemory,

    brain:
      plasticity.brain,

    eligibilityTrace,

    complete:
      food.consumed,

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
  };
}

export function serializeM1EpisodeState(
  state:
    M1EpisodeState,
): string {
  assertM1EpisodeStateShape(
    state,
  );

  return JSON.stringify(
    state,
  );
}

export function deserializeM1EpisodeState(
  serialized:
    string,
): M1EpisodeState {
  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        serialized,
      ) as unknown;
  } catch (error) {
    throw new Error(
      "M1 episode state is not valid JSON.",
      {
        cause:
          error,
      },
    );
  }

  assertM1EpisodeStateShape(
    parsed,
  );

  return parsed;
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

    default:
      throw new Error(
        `Unknown M1 action: ${actionId}`,
      );
  }
}

function assertM1EpisodeStateShape(
  value:
    unknown,
): asserts value is M1EpisodeState {
  if (!isRecord(value)) {
    throw new Error(
      "M1 episode state must be an object.",
    );
  }

  if (
    value.schemaVersion !==
    M1_EPISODE_SCHEMA_VERSION
  ) {
    throw new Error(
      "Unsupported M1 episode schema version.",
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
      "M1 episode tickIndex is invalid.",
    );
  }

  if (
    (
      value.simulationTimeSeconds !==
        undefined &&
      (
        !isFiniteNumber(
          value.simulationTimeSeconds,
        ) ||
        value.simulationTimeSeconds <
          0
      )
    ) ||

    typeof value.learningEnabled !==
      "boolean" ||

    (
      value.memoryEnabled !==
        undefined &&
      typeof value.memoryEnabled !==
        "boolean"
    ) ||

    !isVector(
      value.position,
    ) ||

    !isHungerState(
      value.hunger,
    ) ||

    !isFoodState(
      value.food,
    ) ||

    (
      value.foodOccluded !==
        undefined &&
      typeof value.foodOccluded !==
        "boolean"
    ) ||

    (
      value.foodMemory !==
        undefined &&
      value.foodMemory !==
        null &&
      !isFoodMemoryTrace(
        value.foodMemory,
      )
    ) ||

    !isBrainState(
      value.brain,
    ) ||

    !isEligibilityTrace(
      value.eligibilityTrace,
    ) ||

    typeof value.complete !==
      "boolean" ||

    typeof value.ate !==
      "boolean" ||

    !isFiniteNumber(
      value.cumulativeReward,
    ) ||

    !isWeightChanges(
      value.weightChanges,
    )
  ) {
    throw new Error(
      "M1 episode state does not satisfy the checkpoint contract.",
    );
  }
}

/*
 * Exported so other checkpoint-shape
 * validators (for example M3's acquisition
 * persistence contract) can reuse these
 * primitive shape checks instead of
 * duplicating them.
 */
export function isVector(
  value:
    unknown,
): value is {
  readonly x:
    number;

  readonly y:
    number;
} {
  return (
    isRecord(value) &&
    isFiniteNumber(
      value.x,
    ) &&
    isFiniteNumber(
      value.y,
    )
  );
}

export function isHungerState(
  value:
    unknown,
): value is HungerState {
  if (!isRecord(value)) {
    return false;
  }

  if (
    !isFiniteNumber(
      value.energy,
    ) ||
    !isFiniteNumber(
      value.maxEnergy,
    )
  ) {
    return false;
  }

  return (
    value.maxEnergy >
      0 &&
    value.energy >=
      0 &&
    value.energy <=
      value.maxEnergy
  );
}

export function isFoodState(
  value:
    unknown,
): value is FoodObjectState {
  return (
    isRecord(value) &&

    typeof value.id ===
      "string" &&

    value.kind ===
      "food" &&

    isVector(
      value.position,
    ) &&

    isFiniteNumber(
      value.energyValue,
    ) &&

    value.energyValue >
      0 &&

    typeof value.consumed ===
      "boolean"
  );
}

function isFoodMemoryTrace(
  value:
    unknown,
): value is FoodMemoryTrace {
  if (!isRecord(value)) {
    return false;
  }

  if (
    value.schemaVersion !==
      FOOD_MEMORY_TRACE_SCHEMA_VERSION ||

    value.kind !==
      FOOD_MEMORY_KIND ||

    value.source !==
      FOOD_MEMORY_SOURCE ||

    typeof value.sourceFoodId !==
      "string" ||

    !value.sourceFoodId.trim()
  ) {
    return false;
  }

  if (
    !isFiniteNumber(
      value.encodedAtSimulationTimeSeconds,
    ) ||

    value.encodedAtSimulationTimeSeconds <
      0 ||

    !isFiniteNumber(
      value.ageSeconds,
    ) ||

    value.ageSeconds <
      0 ||

    !isFiniteNumber(
      value.confidence,
    ) ||

    value.confidence <
      0 ||

    value.confidence >
      FOOD_MEMORY_INITIAL_CONFIDENCE
  ) {
    return false;
  }

  if (
    !isDirectionComponent(
      value.rememberedDirectionX,
    ) ||

    !isDirectionComponent(
      value.rememberedDirectionY,
    )
  ) {
    return false;
  }

  return (
    isFiniteNumber(
      value.rememberedPerceptualStrength,
    ) &&

    value.rememberedPerceptualStrength >=
      0 &&

    value.rememberedPerceptualStrength <=
      1
  );
}

function isDirectionComponent(
  value:
    unknown,
): value is number {
  return (
    isFiniteNumber(value) &&
    value >= -1 &&
    value <= 1
  );
}

export function isBrainState(
  value:
    unknown,
): value is BrainState {
  if (
    !isRecord(value) ||

    value.schemaVersion !==
      1 ||

    !Array.isArray(
      value.nodes,
    ) ||

    !Array.isArray(
      value.connections,
    )
  ) {
    return false;
  }

  const nodesValid =
    value.nodes.every(
      (node) =>
        isRecord(node) &&

        typeof node.id ===
          "string" &&

        typeof node.module ===
          "string" &&

        isFiniteNumber(
          node.activation,
        ),
    );

  const connectionsValid =
    value.connections.every(
      (connection) =>
        isRecord(
          connection,
        ) &&

        typeof connection.id ===
          "string" &&

        typeof connection.sourceNodeId ===
          "string" &&

        typeof connection.targetNodeId ===
          "string" &&

        isFiniteNumber(
          connection.weight,
        ) &&

        typeof connection.enabled ===
          "boolean",
    );

  return (
    nodesValid &&
    connectionsValid
  );
}

export function isEligibilityTrace(
  value:
    unknown,
): value is readonly ConnectionEligibility[] {
  return (
    Array.isArray(value) &&

    value.every(
      (entry) =>
        isRecord(entry) &&

        typeof entry.connectionId ===
          "string" &&

        isFiniteNumber(
          entry.eligibility,
        ),
    )
  );
}

export function isWeightChanges(
  value:
    unknown,
): value is readonly WeightChange[] {
  return (
    Array.isArray(value) &&

    value.every(
      (change) =>
        isRecord(change) &&

        typeof change.connectionId ===
          "string" &&

        isFiniteNumber(
          change.before,
        ) &&

        isFiniteNumber(
          change.after,
        ) &&

        isFiniteNumber(
          change.delta,
        ),
    )
  );
}

export function isFiniteNumber(
  value:
    unknown,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    )
  );
}

export function isRecord(
  value:
    unknown,
): value is Record<
  string,
  unknown
> {
  return (
    typeof value ===
      "object" &&
    value !==
      null &&
    !Array.isArray(
      value,
    )
  );
}