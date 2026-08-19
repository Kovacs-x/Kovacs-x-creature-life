import type {
  M3AcquisitionTickEvidence,
} from "./m3Acquisition.js";

import type {
  M3PlayerFoodWorldEvent,
} from "./m3PlayerWorld.js";

export const M3_LIFE_HISTORY_SCHEMA_VERSION =
  1 as const;

export const M3_LIFE_HISTORY_ENTRY_KIND =
  "m3-life-history-entry" as const;

export type M3LifeHistoryEventType =
  | "first-autonomous-exploration"
  | "first-autonomous-food-discovery"
  | "first-food-consumption-after-discovery"
  | "first-learning-change"
  | "first-player-positioned-food-perception";

export interface M3LifeHistoryEntry {
  readonly kind:
    typeof M3_LIFE_HISTORY_ENTRY_KIND;

  readonly simulationTimeSeconds:
    number;

  readonly tickIndex:
    number;

  readonly eventType:
    M3LifeHistoryEventType;

  /*
   * Deterministically generated from genuine
   * recorded evidence.
   *
   * This is player-readable presentation text.
   * It is never supplied back into cognition.
   */
  readonly description:
    string;

  /*
   * Small deterministic pointer to the
   * evidence from which this biography entry
   * arose.
   *
   * M3 does not yet require a full event-sourced
   * replay database.
   */
  readonly causalReference:
    string;
}

export interface M3PendingPlayerFoodEvent {
  readonly sequence:
    number;

  readonly simulationTimeSeconds:
    number;

  readonly tickIndex:
    number;

  readonly eventType:
    M3PlayerFoodWorldEvent[
      "eventType"
    ];

  readonly foodId:
    string;
}

export interface M3LifeHistory {
  readonly schemaVersion:
    typeof M3_LIFE_HISTORY_SCHEMA_VERSION;

  /*
   * M3 biography is intentionally small.
   *
   * Each event class below records only its
   * first occurrence, so the history cannot
   * expand once per simulation tick.
   */
  readonly entries:
    readonly M3LifeHistoryEntry[];

  /*
   * Presentation-side causal bookkeeping only.
   *
   * This lets the biography later distinguish:
   *
   * player changed the world
   *      ↓
   * Creature later perceived the changed world
   *
   * from:
   *
   * player directly notified cognition
   *
   * This value is not Creature memory.
   */
  readonly pendingPlayerFoodEvent:
    M3PendingPlayerFoodEvent | null;
}

/*
 * M3 LIFE HISTORY
 *
 * This state is:
 *
 * - persistent player-facing biography;
 * - deterministic;
 * - derived from genuine simulation/external
 *   events;
 * - completely separate from cognitive memory.
 *
 * It must never be supplied to:
 *
 * - brain evaluation;
 * - memory recall;
 * - action competition;
 * - movement;
 * - reward;
 * - learning;
 * - exploration.
 */
export function createM3LifeHistory():
  M3LifeHistory {
  return {
    schemaVersion:
      M3_LIFE_HISTORY_SCHEMA_VERSION,

    entries:
      [],

    pendingPlayerFoodEvent:
      null,
  };
}

/*
 * Observe a genuine player-world event.
 *
 * The player event itself is not automatically
 * a Creature biography achievement.
 *
 * Instead we remember, outside cognition, that
 * the physical food resource was positioned by
 * the player.
 *
 * A biography entry is produced only if a later
 * ordinary sensory transformation legitimately
 * perceives that resource.
 */
export function observeM3PlayerWorldEventForLifeHistory(
  history:
    M3LifeHistory,

  event:
    M3PlayerFoodWorldEvent,
): M3LifeHistory {
  return {
    ...history,

    pendingPlayerFoodEvent: {
      sequence:
        event.sequence,

      simulationTimeSeconds:
        event.simulationTimeSeconds,

      tickIndex:
        event.tickIndex,

      eventType:
        event.eventType,

      foodId:
        event.affectedObjectId,
    },
  };
}

/*
 * Observe one already-completed authoritative
 * M3 simulation tick.
 *
 * This function does not advance simulation.
 *
 * The biography therefore sits strictly
 * downstream:
 *
 * authoritative simulation
 *      ↓
 * completed tick evidence
 *      ↓
 * life-history observer
 *
 * Never:
 *
 * life history
 *      ↓
 * cognition
 */
export function observeM3TickForLifeHistory(
  history:
    M3LifeHistory,

  evidence:
    M3AcquisitionTickEvidence,
): M3LifeHistory {
  let nextHistory =
    history;

  /*
   * FIRST AUTONOMOUS EXPLORATION
   *
   * We record this only when EXPLORE genuinely
   * won and the physical movement resolver
   * identifies exploration as the movement
   * source.
   */
  if (
    evidence.selectedActionId ===
      "explore" &&
    evidence.movementSource ===
      "exploration"
  ) {
    nextHistory =
      appendFirstLifeHistoryEvent(
        nextHistory,

        {
          kind:
            M3_LIFE_HISTORY_ENTRY_KIND,

          simulationTimeSeconds:
            evidence
              .simulationTimeSeconds,

          tickIndex:
            evidence.tickIndex,

          eventType:
            "first-autonomous-exploration",

          description:
            "First explored autonomously.",

          causalReference:
            createTickCausalReference(
              evidence,
            ),
        },
      );
  }

  /*
   * FIRST AUTONOMOUS FOOD DISCOVERY
   *
   * This flag already means:
   *
   * before perception = null
   * EXPLORE won
   * exploration movement happened
   * after perception = legitimate sensory signal
   *
   * No new definition of discovery is invented
   * by the biography.
   */
  if (
    evidence
      .autonomousDiscoveryOccurred
  ) {
    nextHistory =
      appendFirstLifeHistoryEvent(
        nextHistory,

        {
          kind:
            M3_LIFE_HISTORY_ENTRY_KIND,

          simulationTimeSeconds:
            evidence
              .simulationTimeSeconds,

          tickIndex:
            evidence.tickIndex,

          eventType:
            "first-autonomous-food-discovery",

          description:
            "First independently discovered food.",

          causalReference:
            createTickCausalReference(
              evidence,
            ),
        },
      );
  }

  /*
   * FIRST PLAYER-POSITIONED FOOD PERCEPTION
   *
   * A player event alone is insufficient.
   *
   * The food must subsequently appear in the
   * ordinary direct-perception evidence.
   *
   * This can happen:
   *
   * - before the action on the next tick; or
   * - after legitimate Creature movement.
   */
  const pendingPlayerFoodEvent =
    nextHistory
      .pendingPlayerFoodEvent;

  if (
    pendingPlayerFoodEvent !==
      null &&
    tickPerceivedFoodId(
      evidence,
      pendingPlayerFoodEvent
        .foodId,
    )
  ) {
    nextHistory =
      appendFirstLifeHistoryEvent(
        nextHistory,

        {
          kind:
            M3_LIFE_HISTORY_ENTRY_KIND,

          simulationTimeSeconds:
            evidence
              .simulationTimeSeconds,

          tickIndex:
            evidence.tickIndex,

          eventType:
            "first-player-positioned-food-perception",

          description:
            "First noticed food after it was positioned by the player.",

          causalReference:
            `player-event:${pendingPlayerFoodEvent.sequence}/tick:${evidence.tickIndex}`,
        },
      );

    /*
     * Once the changed resource has genuinely
     * entered direct perception, this particular
     * external event no longer needs to remain
     * pending.
     */
    nextHistory = {
      ...nextHistory,

      pendingPlayerFoodEvent:
        null,
    };
  }

  /*
   * FIRST FOOD CONSUMPTION AFTER AUTONOMOUS
   * DISCOVERY
   *
   * Successful EAT proves the Creature had
   * physically reached interaction distance.
   *
   * We require an earlier/current autonomous
   * discovery biography event before attributing
   * this consumption to that life-history
   * sequence.
   */
  if (
    evidence.ate &&
    hasLifeHistoryEvent(
      nextHistory,

      "first-autonomous-food-discovery",
    )
  ) {
    nextHistory =
      appendFirstLifeHistoryEvent(
        nextHistory,

        {
          kind:
            M3_LIFE_HISTORY_ENTRY_KIND,

          simulationTimeSeconds:
            evidence
              .simulationTimeSeconds,

          tickIndex:
            evidence.tickIndex,

          eventType:
            "first-food-consumption-after-discovery",

          description:
            "First reached and ate food after an independent discovery.",

          causalReference:
            createTickCausalReference(
              evidence,
            ),
        },
      );
  }

  /*
   * FIRST VALIDATED LEARNING CHANGE
   *
   * Biography wording remains conservative.
   *
   * We do not claim intelligence, preference,
   * personality or emotion.
   *
   * We record only that biological reward and
   * the accepted plasticity mechanism produced
   * an observable connection-weight change.
   */
  if (
    evidence.reward !==
      0 &&
    evidence.weightChanges.length >
      0
  ) {
    const changedConnectionCount =
      evidence.weightChanges
        .length;

    nextHistory =
      appendFirstLifeHistoryEvent(
        nextHistory,

        {
          kind:
            M3_LIFE_HISTORY_ENTRY_KIND,

          simulationTimeSeconds:
            evidence
              .simulationTimeSeconds,

          tickIndex:
            evidence.tickIndex,

          eventType:
            "first-learning-change",

          description:
            `First reward-driven learning changed ${changedConnectionCount} connection weight${changedConnectionCount === 1 ? "" : "s"}.`,

          causalReference:
            createTickCausalReference(
              evidence,
            ),
        },
      );
  }

  return nextHistory;
}

/*
 * Deterministic machine-readable persistence
 * representation.
 *
 * M3.10 will test this as part of the wider
 * save/reload continuation contract.
 */
export function serializeM3LifeHistory(
  history:
    M3LifeHistory,
): string {
  return JSON.stringify(
    history,
  );
}

export function deserializeM3LifeHistory(
  serialized:
    string,
): M3LifeHistory {
  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        serialized,
      ) as unknown;
  } catch (error) {
    throw new Error(
      "M3 life history is not valid JSON.",
      {
        cause:
          error,
      },
    );
  }

  assertM3LifeHistory(
    parsed,
  );

  return parsed;
}

/*
 * Player/debug export.
 *
 * Formatting is deterministic and does not add
 * wall-clock timestamps.
 */
export function exportM3LifeHistoryJson(
  history:
    M3LifeHistory,
): string {
  assertM3LifeHistory(
    history,
  );

  return JSON.stringify(
    history,
    null,
    2,
  );
}

function appendFirstLifeHistoryEvent(
  history:
    M3LifeHistory,

  entry:
    M3LifeHistoryEntry,
): M3LifeHistory {
  if (
    hasLifeHistoryEvent(
      history,
      entry.eventType,
    )
  ) {
    return history;
  }

  return {
    ...history,

    entries: [
      ...history.entries,
      entry,
    ],
  };
}

function hasLifeHistoryEvent(
  history:
    M3LifeHistory,

  eventType:
    M3LifeHistoryEventType,
): boolean {
  return history.entries.some(
    (entry) =>
      entry.eventType ===
      eventType,
  );
}

function tickPerceivedFoodId(
  evidence:
    M3AcquisitionTickEvidence,

  foodId:
    string,
): boolean {
  return (
    evidence
      .directFoodPerceptionBefore
      ?.foodId ===
      foodId ||
    evidence
      .directFoodPerceptionAfterMovement
      ?.foodId ===
      foodId
  );
}

function createTickCausalReference(
  evidence:
    M3AcquisitionTickEvidence,
): string {
  return `tick:${evidence.tickIndex}`;
}

function assertM3LifeHistory(
  value:
    unknown,
): asserts value is M3LifeHistory {
  if (
    !isRecord(
      value,
    ) ||
    value.schemaVersion !==
      M3_LIFE_HISTORY_SCHEMA_VERSION ||
    !Array.isArray(
      value.entries,
    )
  ) {
    throw new Error(
      "M3 life history does not satisfy the persistence contract.",
    );
  }

  for (
    const entry of
    value.entries
  ) {
    if (
      !isM3LifeHistoryEntry(
        entry,
      )
    ) {
      throw new Error(
        "M3 life history contains an invalid entry.",
      );
    }
  }

  const pending =
    value.pendingPlayerFoodEvent;

  if (
    pending !==
      null &&
    !isM3PendingPlayerFoodEvent(
      pending,
    )
  ) {
    throw new Error(
      "M3 life history contains invalid pending player-event state.",
    );
  }
}

function isM3LifeHistoryEntry(
  value:
    unknown,
): value is M3LifeHistoryEntry {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }

  return (
    value.kind ===
      M3_LIFE_HISTORY_ENTRY_KIND &&
    isFiniteNonNegativeNumber(
      value.simulationTimeSeconds,
    ) &&
    Number.isInteger(
      value.tickIndex,
    ) &&
    (
      value.tickIndex as number
    ) >=
      0 &&
    isM3LifeHistoryEventType(
      value.eventType,
    ) &&
    typeof value.description ===
      "string" &&
    value.description.length >
      0 &&
    typeof value.causalReference ===
      "string" &&
    value.causalReference.length >
      0
  );
}

function isM3PendingPlayerFoodEvent(
  value:
    unknown,
): value is M3PendingPlayerFoodEvent {
  if (
    !isRecord(
      value,
    )
  ) {
    return false;
  }

  return (
    Number.isInteger(
      value.sequence,
    ) &&
    (
      value.sequence as number
    ) >=
      0 &&
    isFiniteNonNegativeNumber(
      value.simulationTimeSeconds,
    ) &&
    Number.isInteger(
      value.tickIndex,
    ) &&
    (
      value.tickIndex as number
    ) >=
      0 &&
    (
      value.eventType ===
        "food-relocated" ||
      value.eventType ===
        "food-placed"
    ) &&
    typeof value.foodId ===
      "string" &&
    value.foodId.length >
      0
  );
}

function isM3LifeHistoryEventType(
  value:
    unknown,
): value is M3LifeHistoryEventType {
  return (
    value ===
      "first-autonomous-exploration" ||
    value ===
      "first-autonomous-food-discovery" ||
    value ===
      "first-food-consumption-after-discovery" ||
    value ===
      "first-learning-change" ||
    value ===
      "first-player-positioned-food-perception"
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