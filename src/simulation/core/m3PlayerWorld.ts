import type {
  M3AcquisitionState,
} from "./m3Acquisition.js";

import {
  M3_HABITAT_BOUNDS,
} from "./m3Contract.js";

export const M3_PLAYER_WORLD_EVENT_SCHEMA_VERSION =
  1 as const;

export const M3_PLAYER_WORLD_EVENT_KIND =
  "player-world-event" as const;

export const M3_PLAYER_WORLD_EVENT_SOURCE =
  "player" as const;

export const M3_PLAYER_FOOD_RELOCATED_EVENT =
  "food-relocated" as const;

export const M3_PLAYER_FOOD_PLACED_EVENT =
  "food-placed" as const;

export type M3PlayerFoodWorldEventType =
  | typeof M3_PLAYER_FOOD_RELOCATED_EVENT
  | typeof M3_PLAYER_FOOD_PLACED_EVENT;

export interface M3PlayerWorldPosition {
  readonly x: number;
  readonly y: number;
}

export interface M3PlayerFoodWorldSnapshot {
  readonly position:
    M3PlayerWorldPosition;

  readonly consumed:
    boolean;
}

export interface M3PlayerFoodWorldEvent {
  readonly schemaVersion:
    typeof M3_PLAYER_WORLD_EVENT_SCHEMA_VERSION;

  readonly kind:
    typeof M3_PLAYER_WORLD_EVENT_KIND;

  /*
   * Explicit ordering supplied by the
   * authoritative caller/event log.
   *
   * Multiple player actions may legitimately
   * occur at the same simulation time, so
   * simulation time alone is not a sufficient
   * total ordering key.
   */
  readonly sequence:
    number;

  readonly simulationTimeSeconds:
    number;

  readonly tickIndex:
    number;

  readonly source:
    typeof M3_PLAYER_WORLD_EVENT_SOURCE;

  readonly eventType:
    M3PlayerFoodWorldEventType;

  readonly affectedObjectKind:
    "food";

  readonly affectedObjectId:
    string;

  readonly previousWorldState:
    M3PlayerFoodWorldSnapshot;

  readonly resultingWorldState:
    M3PlayerFoodWorldSnapshot;
}

export interface M3PlayerFoodPlacementResult {
  readonly state:
    M3AcquisitionState;

  readonly event:
    M3PlayerFoodWorldEvent;
}

/*
 * M3.8 PLAYER → WORLD BOUNDARY
 *
 * This function performs exactly one external
 * world action:
 *
 * player chooses valid habitat position
 *      ↓
 * authoritative existing food state changes
 *      ↓
 * external event evidence is emitted
 *
 * Nothing here:
 *
 * - evaluates the Creature brain;
 * - changes neural activation;
 * - selects an action;
 * - creates or changes cognitive memory;
 * - changes eligibility;
 * - changes exploration pressure;
 * - samples exploration heading;
 * - consumes RNG;
 * - moves the Creature;
 * - supplies the destination to cognition.
 *
 * The Creature can only become aware of the
 * resulting food position when the ordinary
 * sensory pipeline subsequently evaluates the
 * changed world.
 *
 * FOOD LIFECYCLE
 *
 * If the existing food has not been consumed,
 * this is a relocation.
 *
 * If the single existing food resource has
 * already been consumed, placing it again
 * reactivates that same authoritative resource
 * slot:
 *
 * - same object ID;
 * - same object kind;
 * - same energy value;
 * - consumed becomes false;
 * - episode complete becomes false.
 *
 * No second food object is spawned and no
 * Creature state is reset.
 */
export function applyM3PlayerFoodPlacement(
  state:
    M3AcquisitionState,

  destination:
    M3PlayerWorldPosition,

  eventSequence:
    number,
): M3PlayerFoodPlacementResult {
  validateM3PlayerWorldPosition(
    destination,
  );

  validateM3PlayerWorldEventSequence(
    eventSequence,
  );

  const eventType:
    M3PlayerFoodWorldEventType =
      state.food.consumed
        ? M3_PLAYER_FOOD_PLACED_EVENT
        : M3_PLAYER_FOOD_RELOCATED_EVENT;

  const previousWorldState:
    M3PlayerFoodWorldSnapshot = {
      position: {
        x:
          state.food.position.x,

        y:
          state.food.position.y,
      },

      consumed:
        state.food.consumed,
    };

  /*
   * Preserve the existing authoritative food
   * identity and properties.
   *
   * Only physical placement state changes.
   */
  const food = {
    ...state.food,

    position: {
      x:
        destination.x,

      y:
        destination.y,
    },

    consumed:
      false,
  };

  /*
   * The external player action changes only
   * world/lifecycle state.
   *
   * In particular, all Creature-owned state is
   * retained exactly:
   *
   * brain
   * hunger
   * position
   * eligibility
   * exploration state
   * RNG
   * learning history
   *
   * A previously completed single-food
   * interaction may continue because the same
   * resource has now been placed again.
   */
  const nextState:
    M3AcquisitionState = {
      ...state,

      food,

      complete:
        false,
    };

  const event:
    M3PlayerFoodWorldEvent = {
      schemaVersion:
        M3_PLAYER_WORLD_EVENT_SCHEMA_VERSION,

      kind:
        M3_PLAYER_WORLD_EVENT_KIND,

      sequence:
        eventSequence,

      simulationTimeSeconds:
        state.simulationTimeSeconds,

      tickIndex:
        state.tickIndex,

      source:
        M3_PLAYER_WORLD_EVENT_SOURCE,

      eventType,

      affectedObjectKind:
        state.food.kind,

      affectedObjectId:
        state.food.id,

      previousWorldState,

      resultingWorldState: {
        position: {
          x:
            food.position.x,

          y:
            food.position.y,
        },

        consumed:
          false,
      },
    };

  return {
    state:
      nextState,

    event,
  };
}

/*
 * M3.10A persistence needs to validate
 * previously committed M3PlayerFoodWorldEvent
 * records read back from storage.
 *
 * This lives alongside the event's producing
 * boundary rather than being duplicated inside
 * the persistence envelope module.
 */
export function assertM3PlayerFoodWorldEvent(
  value:
    unknown,
): asserts value is M3PlayerFoodWorldEvent {
  if (
    !isM3PlayerFoodWorldEvent(
      value,
    )
  ) {
    throw new Error(
      "M3 player world event does not satisfy the persistence contract.",
    );
  }
}

function isM3PlayerFoodWorldEvent(
  value:
    unknown,
): value is M3PlayerFoodWorldEvent {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }

  if (
    value.schemaVersion !==
      M3_PLAYER_WORLD_EVENT_SCHEMA_VERSION ||
    value.kind !==
      M3_PLAYER_WORLD_EVENT_KIND ||
    value.source !==
      M3_PLAYER_WORLD_EVENT_SOURCE ||
    value.affectedObjectKind !==
      "food"
  ) {
    return false;
  }

  if (
    !Number.isInteger(
      value.sequence,
    ) ||
    (
      value.sequence as number
    ) < 0
  ) {
    return false;
  }

  if (
    !isFiniteNonNegativeNumber(
      value.simulationTimeSeconds,
    )
  ) {
    return false;
  }

  if (
    !Number.isInteger(
      value.tickIndex,
    ) ||
    (
      value.tickIndex as number
    ) < 0
  ) {
    return false;
  }

  if (
    value.eventType !==
      M3_PLAYER_FOOD_RELOCATED_EVENT &&
    value.eventType !==
      M3_PLAYER_FOOD_PLACED_EVENT
  ) {
    return false;
  }

  if (
    typeof value.affectedObjectId !==
      "string" ||
    value.affectedObjectId.length ===
      0
  ) {
    return false;
  }

  return (
    isM3PlayerFoodWorldSnapshot(
      value.previousWorldState,
    ) &&
    isM3PlayerFoodWorldSnapshot(
      value.resultingWorldState,
    )
  );
}

function isM3PlayerFoodWorldSnapshot(
  value:
    unknown,
): value is M3PlayerFoodWorldSnapshot {
  return (
    isRecord(
      value,
    ) &&
    isM3PlayerWorldPosition(
      value.position,
    ) &&
    typeof value.consumed ===
      "boolean"
  );
}

function isM3PlayerWorldPosition(
  value:
    unknown,
): value is M3PlayerWorldPosition {
  return (
    isRecord(
      value,
    ) &&
    isFiniteCoordinate(
      value.x,
    ) &&
    isFiniteCoordinate(
      value.y,
    )
  );
}

function isFiniteCoordinate(
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

function isFiniteNonNegativeNumber(
  value:
    unknown,
): value is number {
  return (
    typeof value ===
      "number" &&
    Number.isFinite(
      value,
    ) &&
    value >=
      0
  );
}

function isRecord(
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

function validateM3PlayerWorldPosition(
  position:
    M3PlayerWorldPosition,
): void {
  if (
    !Number.isFinite(
      position.x,
    ) ||
    !Number.isFinite(
      position.y,
    )
  ) {
    throw new RangeError(
      "M3 player food placement requires finite world coordinates.",
    );
  }

  if (
    position.x <
      M3_HABITAT_BOUNDS.minX ||
    position.x >
      M3_HABITAT_BOUNDS.maxX ||
    position.y <
      M3_HABITAT_BOUNDS.minY ||
    position.y >
      M3_HABITAT_BOUNDS.maxY
  ) {
    throw new RangeError(
      "M3 player food placement must remain inside habitat bounds.",
    );
  }
}

function validateM3PlayerWorldEventSequence(
  sequence:
    number,
): void {
  if (
    !Number.isInteger(
      sequence,
    ) ||
    sequence < 0
  ) {
    throw new RangeError(
      "M3 player world event sequence must be a non-negative integer.",
    );
  }
}