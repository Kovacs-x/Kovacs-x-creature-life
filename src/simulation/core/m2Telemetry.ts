import {
  selectHighestActivation,
} from "../actions/competition.js";

import {
  M1_NODE_IDS,
} from "../brain/m1Brain.js";

import {
  recallFoodMemory,
  type FoodMemoryRecallSignal,
  type FoodMemoryTrace,
} from "../memory/foodMemory.js";

import {
  perceiveFood,
  type FoodPerceptionSignal,
} from "../senses/foodPerception.js";

import {
  M1_EPISODE_PERCEPTION_RANGE,
  M1_EPISODE_TICK_SECONDS,
  type M1EpisodeState,
} from "./m1Episode.js";

export type M2ActionId =
  | "idle"
  | "seek"
  | "eat";

export type M2FoodEvidenceSource =
  | "direct-perception"
  | "memory-recall"
  | "none";

export type M2MovementDirectionSource =
  | "direct-perception"
  | "memory-recall"
  | null;

export interface M2ActionCandidateTelemetry {
  readonly actionId:
    M2ActionId;

  readonly activation:
    number;
}

export interface M2MemoryTelemetrySnapshot {
  readonly encodedAtSimulationTimeSeconds:
    number;

  readonly ageSeconds:
    number;

  readonly confidence:
    number;

  readonly rememberedDirectionX:
    number;

  readonly rememberedDirectionY:
    number;

  readonly rememberedPerceptualStrength:
    number;
}

export interface M2MemoryTransitionTelemetry {
  readonly before:
    M2MemoryTelemetrySnapshot | null;

  readonly after:
    M2MemoryTelemetrySnapshot | null;

  /*
   * These are separate flags because more
   * than one diagnostic property may matter
   * during a transition.
   *
   * They observe state change only.
   * They never affect simulation behaviour.
   */
  readonly encoded:
    boolean;

  readonly refreshed:
    boolean;

  readonly corrected:
    boolean;

  readonly decayed:
    boolean;

  readonly expired:
    boolean;
}

export interface M2EpisodeTelemetryEntry {
  readonly type:
    "m2-episode-transition";

  readonly tick:
    number;

  readonly simulationTimeBeforeSeconds:
    number;

  readonly simulationTimeAfterSeconds:
    number;

  readonly positionBefore: {
    readonly x:
      number;

    readonly y:
      number;
  };

  readonly positionAfter: {
    readonly x:
      number;

    readonly y:
      number;
  };

  /*
   * Environmental sensory condition.
   */
  readonly foodOccluded:
    boolean;

  /*
   * Current legitimate food evidence.
   */
  readonly directFoodSignal:
    FoodPerceptionSignal | null;

  /*
   * Distinct retained evidence from earlier
   * legitimate perception.
   */
  readonly recallSignal:
    FoodMemoryRecallSignal | null;

  /*
   * Which food-related information source was
   * available to cognition on this tick.
   *
   * "none" means neither current perception
   * nor usable recall supplied food evidence.
   */
  readonly foodEvidenceSource:
    M2FoodEvidenceSource;

  readonly memory:
    M2MemoryTransitionTelemetry;

  /*
   * Distinct neural channels make it possible
   * to verify that memory is not masquerading
   * as current perception.
   */
  readonly directFoodInputActivation:
    number;

  readonly rememberedFoodInputActivation:
    number;

  readonly actionCandidates:
    readonly M2ActionCandidateTelemetry[];

  readonly selectedActionId:
    M2ActionId;

  /*
   * Direction source used only after SEEK
   * wins normal action competition.
   */
  readonly movementDirectionSource:
    M2MovementDirectionSource;

  readonly movementDirection: {
    readonly x:
      number;

    readonly y:
      number;
  } | null;
}

/*
 * Pure diagnostic observer for one completed
 * authoritative episode transition.
 *
 * before
 *   ->
 * advanceM1Episode(before)
 *   ->
 * after
 *
 * This function does not perform a second
 * simulation tick and does not modify either
 * state.
 *
 * It reconstructs diagnostic facts from the
 * state transition and the same public
 * sensory/memory representations already used
 * by the simulation.
 */
export function deriveM2EpisodeTelemetry(
  before:
    M1EpisodeState,

  after:
    M1EpisodeState,
): M2EpisodeTelemetryEntry {
  if (
    after.tickIndex !==
    before.tickIndex + 1
  ) {
    throw new Error(
      "M2 telemetry requires consecutive episode states.",
    );
  }

  const simulationTimeBeforeSeconds =
    before.simulationTimeSeconds ??
    before.tickIndex *
      M1_EPISODE_TICK_SECONDS;

  const simulationTimeAfterSeconds =
    after.simulationTimeSeconds ??
    after.tickIndex *
      M1_EPISODE_TICK_SECONDS;

  const foodOccluded =
    before.foodOccluded ??
    false;

  const memoryEnabled =
    before.memoryEnabled ??
    false;

  const directFoodSignal =
    perceiveFood(
      before.position,

      before.food,

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
   * Recall is intentionally diagnostic from
   * the Creature's stored internal trace.
   *
   * It does not inspect current hidden food
   * coordinates or use sourceFoodId to query
   * world state.
   */
  const recallSignal =
    memoryEnabled &&
    directFoodSignal === null
      ? recallFoodMemory(
          before.foodMemory ??
          null,
        )
      : null;

  const directFoodInputActivation =
    getNodeActivation(
      after,

      M1_NODE_IDS.foodInput,
    );

  const rememberedFoodInputActivation =
    getNodeActivation(
      after,

      M1_NODE_IDS
        .rememberedFoodInput,
    );

  const idleActivation =
    getNodeActivation(
      after,

      M1_NODE_IDS.idleOutput,
    );

  const seekActivation =
    getNodeActivation(
      after,

      M1_NODE_IDS.seekOutput,
    );

  const eatActivation =
    getNodeActivation(
      after,

      M1_NODE_IDS.eatOutput,
    );

  const actionCandidates:
    readonly M2ActionCandidateTelemetry[] =
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
      ];

  /*
   * Reconstruct the selected action from the
   * recorded action-node activations using the
   * same generic competition primitive.
   *
   * This is diagnostic only.
   */
  const selected =
    selectHighestActivation(
      actionCandidates,
    );

  const selectedActionId =
    asM2ActionId(
      selected.selectedActionId,
    );

  const foodEvidenceSource:
    M2FoodEvidenceSource =
      directFoodSignal !== null
        ? "direct-perception"
        : recallSignal !== null
          ? "memory-recall"
          : "none";

  let movementDirectionSource:
    M2MovementDirectionSource =
      null;

  let movementDirection: {
    readonly x:
      number;

    readonly y:
      number;
  } | null =
    null;

  /*
   * Movement direction exists only after SEEK
   * has already won normal competition.
   *
   * Current perception has epistemic priority.
   * Recall is only the fallback when direct
   * perception is absent.
   */
  if (
    selectedActionId ===
    "seek"
  ) {
    if (
      directFoodSignal !==
      null
    ) {
      movementDirectionSource =
        "direct-perception";

      movementDirection = {
        x:
          directFoodSignal
            .directionX,

        y:
          directFoodSignal
            .directionY,
      };
    } else if (
      recallSignal !==
      null
    ) {
      movementDirectionSource =
        "memory-recall";

      movementDirection = {
        x:
          recallSignal
            .directionX,

        y:
          recallSignal
            .directionY,
      };
    }
  }

  const beforeMemory =
    before.foodMemory ??
    null;

  const afterMemory =
    after.foodMemory ??
    null;

  const encoded =
    memoryEnabled &&
    directFoodSignal !== null &&
    beforeMemory === null &&
    afterMemory !== null;

  const refreshed =
    memoryEnabled &&
    directFoodSignal !== null &&
    beforeMemory !== null &&
    afterMemory !== null;

  const corrected =
    refreshed &&
    beforeMemory !== null &&
    afterMemory !== null &&
    (
      beforeMemory
        .rememberedDirectionX !==
        afterMemory
          .rememberedDirectionX ||
      beforeMemory
        .rememberedDirectionY !==
        afterMemory
          .rememberedDirectionY
    );

  /*
   * "decayed" means an existing trace survived
   * an occluded/no-perception transition with
   * lower confidence.
   *
   * Encoding and refresh are reported
   * separately even though the episode stores
   * its trace at end-of-tick simulation time.
   */
  const decayed =
    memoryEnabled &&
    directFoodSignal === null &&
    beforeMemory !== null &&
    afterMemory !== null &&
    afterMemory.confidence <
      beforeMemory.confidence;

  const expired =
    memoryEnabled &&
    directFoodSignal === null &&
    beforeMemory !== null &&
    afterMemory === null;

  return {
    type:
      "m2-episode-transition",

    tick:
      after.tickIndex,

    simulationTimeBeforeSeconds,

    simulationTimeAfterSeconds,

    positionBefore: {
      ...before.position,
    },

    positionAfter: {
      ...after.position,
    },

    foodOccluded,

    directFoodSignal:
      directFoodSignal === null
        ? null
        : {
            ...directFoodSignal,
          },

    recallSignal:
      recallSignal === null
        ? null
        : {
            ...recallSignal,
          },

    foodEvidenceSource,

    memory: {
      before:
        snapshotMemory(
          beforeMemory,
        ),

      after:
        snapshotMemory(
          afterMemory,
        ),

      encoded,

      refreshed,

      corrected,

      decayed,

      expired,
    },

    directFoodInputActivation,

    rememberedFoodInputActivation,

    actionCandidates,

    selectedActionId,

    movementDirectionSource,

    movementDirection,
  };
}

function snapshotMemory(
  memory:
    FoodMemoryTrace | null,
): M2MemoryTelemetrySnapshot | null {
  if (memory === null) {
    return null;
  }

  return {
    encodedAtSimulationTimeSeconds:
      memory
        .encodedAtSimulationTimeSeconds,

    ageSeconds:
      memory.ageSeconds,

    confidence:
      memory.confidence,

    rememberedDirectionX:
      memory
        .rememberedDirectionX,

    rememberedDirectionY:
      memory
        .rememberedDirectionY,

    rememberedPerceptualStrength:
      memory
        .rememberedPerceptualStrength,
  };
}

function getNodeActivation(
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

function asM2ActionId(
  actionId:
    string,
): M2ActionId {
  switch (actionId) {
    case "idle":
    case "seek":
    case "eat":
      return actionId;

    default:
      throw new Error(
        `Unknown M2 action: ${actionId}`,
      );
  }
}