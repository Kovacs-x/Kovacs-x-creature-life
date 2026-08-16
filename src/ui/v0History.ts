import type {
  WeightChange,
} from "../simulation/brain/plasticity.js";

import type {
  M1EpisodeState,
} from "../simulation/core/m1Episode.js";

import {
  deriveM2EpisodeTelemetry,
  type M2EpisodeTelemetryEntry,
} from "../simulation/core/m2Telemetry.js";

export const V0_HISTORY_SCHEMA_VERSION =
  1 as const;

export const V0_HISTORY_ENTRY_TYPE =
  "v0-causal-history-entry" as const;

export const V0_HISTORY_DEFAULT_CAPACITY =
  16;

/*
 * V0 WHY / HISTORY
 *
 * This is developer diagnostic state.
 *
 * It is NOT:
 *
 * - Creature memory;
 * - authoritative simulation state;
 * - an input to cognition;
 * - an action selector;
 * - a second simulation loop.
 *
 * It observes already-completed authoritative
 * state transitions.
 */
export interface V0CausalHistoryEntry {
  readonly type:
    typeof V0_HISTORY_ENTRY_TYPE;

  readonly tick:
    number;

  /*
   * Accepted M2 causal telemetry remains the
   * primary evidence for perception, memory,
   * neural activation, action competition and
   * movement source.
   */
  readonly telemetry:
    M2EpisodeTelemetryEntry;

  readonly creature: {
    readonly positionAfter: {
      readonly x:
        number;

      readonly y:
        number;
    };

    readonly energyBefore:
      number;

    readonly energyAfter:
      number;

    readonly maxEnergy:
      number;
  };

  readonly food: {
    readonly positionAfter: {
      readonly x:
        number;

      readonly y:
        number;
    };

    readonly availableAfter:
      boolean;

    readonly consumedThisTick:
      boolean;
  };

  /*
   * after.ate is cumulative in the accepted
   * episode state.
   *
   * This diagnostic field identifies only the
   * current transition's eating event.
   */
  readonly ateThisTick:
    boolean;

  /*
   * Accepted cumulativeReward is converted
   * back into the biological reward generated
   * by this specific transition.
   */
  readonly biologicalReward:
    number;

  /*
   * Accepted episode weightChanges are
   * cumulative.
   *
   * History stores only the changes appended
   * by this transition.
   */
  readonly learningChanges:
    readonly WeightChange[];

  readonly learningChanged:
    boolean;

  /*
   * Deterministic statements derived entirely
   * from recorded causal facts.
   *
   * These are not free-form interpretations
   * of motive.
   */
  readonly why:
    readonly string[];
}

export interface V0CausalHistory {
  readonly schemaVersion:
    typeof V0_HISTORY_SCHEMA_VERSION;

  readonly capacity:
    number;

  /*
   * Oldest retained entry first.
   *
   * The collection is bounded and never
   * becomes authoritative Creature state.
   */
  readonly entries:
    readonly V0CausalHistoryEntry[];
}

export function createV0CausalHistory(
  capacity:
    number =
      V0_HISTORY_DEFAULT_CAPACITY,
): V0CausalHistory {
  validateCapacity(
    capacity,
  );

  return {
    schemaVersion:
      V0_HISTORY_SCHEMA_VERSION,

    capacity,

    entries:
      [],
  };
}

/*
 * Pure observer for one completed transition.
 *
 * before
 *   ->
 * authoritative V0 habitat tick
 *   ->
 * after
 *   ->
 * deriveV0CausalHistoryEntry(...)
 *
 * No state is advanced here.
 */
export function deriveV0CausalHistoryEntry(
  before:
    M1EpisodeState,

  after:
    M1EpisodeState,
): V0CausalHistoryEntry {
  const telemetry =
    deriveM2EpisodeTelemetry(
      before,
      after,
    );

  if (
    after.weightChanges.length <
    before.weightChanges.length
  ) {
    throw new Error(
      "V0 history requires cumulative weight-change continuity.",
    );
  }

  const consumedThisTick =
    !before.food.consumed &&
    after.food.consumed;

  const ateThisTick =
    consumedThisTick &&
    after.ate;

  const biologicalReward =
    after.cumulativeReward -
    before.cumulativeReward;

  if (
    !Number.isFinite(
      biologicalReward,
    )
  ) {
    throw new RangeError(
      "V0 history biological reward must be finite.",
    );
  }

  const learningChanges =
    after.weightChanges
      .slice(
        before.weightChanges.length,
      )
      .map(
        (change) => ({
          ...change,
        }),
      );

  const why =
    deriveV0WhyStatements(
      telemetry,
      {
        ateThisTick,
        biologicalReward,
        learningChanges,
      },
    );

  return {
    type:
      V0_HISTORY_ENTRY_TYPE,

    tick:
      after.tickIndex,

    telemetry,

    creature: {
      positionAfter: {
        ...after.position,
      },

      energyBefore:
        before.hunger.energy,

      energyAfter:
        after.hunger.energy,

      maxEnergy:
        after.hunger.maxEnergy,
    },

    food: {
      positionAfter: {
        ...after.food.position,
      },

      availableAfter:
        !after.food.consumed,

      consumedThisTick,
    },

    ateThisTick,

    biologicalReward,

    learningChanges,

    learningChanged:
      learningChanges.length >
      0,

    why,
  };
}

/*
 * Immutable bounded append.
 *
 * Old diagnostic entries fall out of the
 * history when capacity is reached.
 *
 * Nothing is written into the Creature's
 * authoritative state.
 */
export function appendV0CausalHistory(
  history:
    V0CausalHistory,

  before:
    M1EpisodeState,

  after:
    M1EpisodeState,
): V0CausalHistory {
  validateCapacity(
    history.capacity,
  );

  const entry =
    deriveV0CausalHistoryEntry(
      before,
      after,
    );

  const retained =
    history.capacity ===
    1
      ? []
      : history.entries.slice(
          -(
            history.capacity -
            1
          ),
        );

  return {
    schemaVersion:
      V0_HISTORY_SCHEMA_VERSION,

    capacity:
      history.capacity,

    entries: [
      ...retained,
      entry,
    ],
  };
}

/*
 * Machine-readable debugging artifact.
 *
 * No wall-clock timestamp is added because
 * export must remain a deterministic
 * transformation of recorded history.
 */
export function exportV0CausalHistoryJson(
  history:
    V0CausalHistory,
): string {
  validateCapacity(
    history.capacity,
  );

  return JSON.stringify(
    history,
    null,
    2,
  );
}

export function deriveV0WhyStatements(
  telemetry:
    M2EpisodeTelemetryEntry,

  consequences: {
    readonly ateThisTick:
      boolean;

    readonly biologicalReward:
      number;

    readonly learningChanges:
      readonly WeightChange[];
  },
): readonly string[] {
  const statements:
    string[] =
      [];

  if (
    telemetry.directFoodSignal !==
    null
  ) {
    statements.push(
      "Direct food perception was available.",
    );
  } else if (
    telemetry.foodOccluded
  ) {
    statements.push(
      "Environmental occlusion blocked direct food perception.",
    );
  } else {
    statements.push(
      "No direct food perception was available.",
    );
  }

  if (
    telemetry.recallSignal !==
    null
  ) {
    statements.push(
      `A usable food memory was recalled with confidence ${telemetry.recallSignal.confidence.toFixed(3)}.`,
    );
  }

  if (
    telemetry.memory.encoded
  ) {
    statements.push(
      "Food memory was encoded from direct perception.",
    );
  }

  if (
    telemetry.memory.refreshed
  ) {
    statements.push(
      telemetry.memory.corrected
        ? "Direct perception refreshed and corrected the food memory."
        : "Direct perception refreshed the food memory.",
    );
  }

  if (
    telemetry.memory.decayed
  ) {
    statements.push(
      "Food memory confidence decayed.",
    );
  }

  if (
    telemetry.memory.expired
  ) {
    statements.push(
      "Food memory expired and became unusable.",
    );
  }

  statements.push(
    `${formatActionId(
      telemetry.selectedActionId,
    )} won action competition.`,
  );

  switch (
    telemetry.movementDirectionSource
  ) {
    case "direct-perception":
      statements.push(
        "Movement used the current perceived food direction after SEEK won.",
      );
      break;

    case "memory-recall":
      statements.push(
        "Movement used remembered food direction after SEEK won.",
      );
      break;

    case null:
      break;
  }

  if (
    consequences.ateThisTick
  ) {
    statements.push(
      "Eating succeeded on this tick.",
    );
  }

  if (
    consequences.biologicalReward !==
    0
  ) {
    statements.push(
      `Biological reward was ${consequences.biologicalReward.toFixed(3)}.`,
    );
  }

  if (
    consequences.learningChanges.length >
    0
  ) {
    statements.push(
      `Reward-driven learning changed ${consequences.learningChanges.length} connection weight${consequences.learningChanges.length === 1 ? "" : "s"}.`,
    );
  }

  return statements;
}

function formatActionId(
  actionId:
    M2EpisodeTelemetryEntry[
      "selectedActionId"
    ],
): string {
  switch (actionId) {
    case "idle":
      return "IDLE";

    case "seek":
      return "SEEK";

    case "eat":
      return "EAT";
  }
}

function validateCapacity(
  capacity:
    number,
): void {
  if (
    !Number.isInteger(
      capacity,
    ) ||
    capacity <= 0
  ) {
    throw new RangeError(
      "V0 history capacity must be a positive integer.",
    );
  }
}