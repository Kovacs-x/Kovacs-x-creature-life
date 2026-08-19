import {
  assertM3AcquisitionStateShape,
  deserializeM3AcquisitionState,
  type M3AcquisitionState,
} from "./m3Acquisition.js";

import {
  assertM3PlayerFoodWorldEvent,
  type M3PlayerFoodWorldEvent,
} from "./m3PlayerWorld.js";

import {
  deserializeM3LifeHistory,
  type M3LifeHistory,
} from "./m3LifeHistory.js";

export const M3_PERSISTENCE_SCHEMA_VERSION =
  1 as const;

export const M3_PERSISTENCE_KIND =
  "m3-persistent-run" as const;

/*
 * M3.10A AUTHORITATIVE PERSISTENCE ENVELOPE
 *
 * This is the single versioned M3 persistence
 * shape referenced by the M3.10A task:
 *
 * authoritative M3AcquisitionState
 * + exploration state (inside acquisitionState)
 * + RNG state (inside acquisitionState)
 * + learned neural weights (inside brain)
 * + world/resource state (inside acquisitionState)
 * + persistent life history
 * + ordered player-world event history
 * + next deterministic player-event sequence
 *
 * This module performs storage/restoration
 * only. It does not evaluate cognition, sample
 * RNG, run a simulation tick or infer world
 * state. Deserializing a valid envelope
 * reproduces exactly the state that was
 * serialized.
 *
 * Presentation-only concerns (DOM state, CSS,
 * browser timers, renderer orientation,
 * animation phase, wall-clock timestamps,
 * Play/Pause scheduling) are deliberately
 * absent. Controller mode is derived from
 * `acquisitionState.complete` on restore rather
 * than persisted directly.
 */
export interface M3PersistentRunState {
  readonly schemaVersion:
    typeof M3_PERSISTENCE_SCHEMA_VERSION;

  readonly kind:
    typeof M3_PERSISTENCE_KIND;

  readonly acquisitionState:
    M3AcquisitionState;

  readonly lifeHistory:
    M3LifeHistory;

  /*
   * The ordered genuine M3PlayerFoodWorldEvent
   * records already produced by
   * applyM3PlayerFoodPlacement(...) during this
   * run.
   *
   * This is not a second player-event
   * representation; the same committed event
   * objects are simply retained here for
   * persistence and causal inspection.
   */
  readonly playerWorldEvents:
    readonly M3PlayerFoodWorldEvent[];

  /*
   * The next deterministic external player-event
   * sequence number a future placement should
   * receive.
   *
   * For an existing event sequence of
   * 0, 1, 2 this must be 3 - never a
   * wall-clock-derived identifier and never a
   * restart back to 0.
   */
  readonly nextPlayerEventSequence:
    number;
}

export interface M3PersistentRunConfig {
  readonly acquisitionState:
    M3AcquisitionState;

  readonly lifeHistory:
    M3LifeHistory;

  readonly playerWorldEvents:
    readonly M3PlayerFoodWorldEvent[];

  readonly nextPlayerEventSequence:
    number;
}

/*
 * Pure assembly of the persistence envelope from
 * already-authoritative pieces.
 *
 * This performs no simulation work. It only
 * validates that the supplied pieces are
 * internally consistent (ordered event sequence
 * numbers matching the declared next sequence)
 * before they are considered a valid persistent
 * run.
 */
export function createM3PersistentRunState(
  config:
    M3PersistentRunConfig,
): M3PersistentRunState {
  assertM3AcquisitionStateShape(
    config.acquisitionState,
  );

  for (
    const event of
    config.playerWorldEvents
  ) {
    assertM3PlayerFoodWorldEvent(
      event,
    );
  }

  assertOrderedPlayerWorldEvents(
    config.playerWorldEvents,

    config.nextPlayerEventSequence,
  );

  return {
    schemaVersion:
      M3_PERSISTENCE_SCHEMA_VERSION,

    kind:
      M3_PERSISTENCE_KIND,

    acquisitionState:
      config.acquisitionState,

    lifeHistory:
      config.lifeHistory,

    playerWorldEvents:
      config.playerWorldEvents,

    nextPlayerEventSequence:
      config.nextPlayerEventSequence,
  };
}

export function serializeM3PersistentRun(
  run:
    M3PersistentRunState,
): string {
  assertM3PersistentRunState(
    run,
  );

  return JSON.stringify(
    run,
  );
}

export function deserializeM3PersistentRun(
  serialized:
    string,
): M3PersistentRunState {
  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        serialized,
      ) as unknown;
  } catch (error) {
    throw new Error(
      "M3 persistent run is not valid JSON.",
      {
        cause:
          error,
      },
    );
  }

  assertM3PersistentRunState(
    parsed,
  );

  return parsed;
}

function assertM3PersistentRunState(
  value:
    unknown,
): asserts value is M3PersistentRunState {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "M3 persistent run must be an object.",
    );
  }

  if (
    value.schemaVersion !==
    M3_PERSISTENCE_SCHEMA_VERSION
  ) {
    throw new Error(
      "Unsupported M3 persistence schema version.",
    );
  }

  if (
    value.kind !==
    M3_PERSISTENCE_KIND
  ) {
    throw new Error(
      "M3 persistent run kind is invalid.",
    );
  }

  try {
    /*
     * Reuse the authoritative acquisition-state
     * deserializer rather than duplicating its
     * validation here.
     */
    deserializeM3AcquisitionState(
      JSON.stringify(
        value.acquisitionState,
      ),
    );
  } catch (error) {
    throw new Error(
      "M3 persistent run acquisition state is invalid.",
      {
        cause:
          error,
      },
    );
  }

  try {
    /*
     * Reuse the existing M3 life-history
     * deserializer/validator.
     */
    deserializeM3LifeHistory(
      JSON.stringify(
        value.lifeHistory,
      ),
    );
  } catch (error) {
    throw new Error(
      "M3 persistent run life history is invalid.",
      {
        cause:
          error,
      },
    );
  }

  if (
    !Array.isArray(
      value.playerWorldEvents,
    )
  ) {
    throw new Error(
      "M3 persistent run playerWorldEvents must be an array.",
    );
  }

  for (
    const event of
    value.playerWorldEvents
  ) {
    try {
      assertM3PlayerFoodWorldEvent(
        event,
      );
    } catch (error) {
      throw new Error(
        "M3 persistent run contains an invalid external player-world event.",
        {
          cause:
            error,
        },
      );
    }
  }

  if (
    !Number.isInteger(
      value.nextPlayerEventSequence,
    ) ||
    (
      value.nextPlayerEventSequence as number
    ) < 0
  ) {
    throw new Error(
      "M3 persistent run nextPlayerEventSequence is invalid.",
    );
  }

  assertOrderedPlayerWorldEvents(
    value.playerWorldEvents as readonly M3PlayerFoodWorldEvent[],

    value.nextPlayerEventSequence as number,
  );
}

/*
 * The persisted external event history must be
 * a genuine deterministic ordering:
 *
 * sequence 0, 1, 2, ...
 *
 * with the declared next sequence equal to the
 * count of recorded events. This is what lets a
 * placement after reload continue as
 * "3", never "0 again" and never a
 * wall-clock-derived identifier.
 */
function assertOrderedPlayerWorldEvents(
  events:
    readonly M3PlayerFoodWorldEvent[],

  nextPlayerEventSequence:
    number,
): void {
  for (
    let index = 0;
    index <
      events.length;
    index +=
      1
  ) {
    if (
      events[index]
        ?.sequence !==
        index
    ) {
      throw new Error(
        "M3 persistent run external player-world events must be ordered as a contiguous sequence starting at 0.",
      );
    }
  }

  if (
    nextPlayerEventSequence !==
      events.length
  ) {
    throw new Error(
      "M3 persistent run nextPlayerEventSequence does not match the recorded external event history.",
    );
  }
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
