import type {
  M3AcquisitionTickEvidence,
} from "./m3Acquisition.js";

import {
  assertM3PlayerFoodWorldEvent,
  type M3PlayerFoodWorldEvent,
} from "./m3PlayerWorld.js";

import type {
  M3LifeHistory,
  M3LifeHistoryEntry,
} from "./m3LifeHistory.js";

import type {
  M3IndividualityProbeExperimentResult,
  M3StandardizedProbeResult,
} from "./m3Probe.js";

export const M3_TELEMETRY_TRACE_SCHEMA_VERSION =
  1 as const;

export const M3_TICK_TELEMETRY_ENTRY_KIND =
  "m3-tick-telemetry" as const;

export const M3_PLAYER_EVENT_TELEMETRY_ENTRY_KIND =
  "m3-player-event-telemetry" as const;

export const M3_LIFE_HISTORY_TELEMETRY_ENTRY_KIND =
  "m3-life-history-telemetry" as const;

/*
 * M3.10B OBSERVATIONAL TELEMETRY
 *
 * This module is strictly downstream of the
 * authoritative simulation. It never evaluates
 * cognition, samples RNG, generates headings or
 * causes life-history/world events.
 *
 * Each telemetry entry wraps an already-existing
 * authoritative or diagnostic object exactly as
 * it was produced:
 *
 * - M3AcquisitionTickEvidence from
 *   advanceM3AcquisitionTick(...);
 * - the genuine M3PlayerFoodWorldEvent from
 *   applyM3PlayerFoodPlacement(...);
 * - the genuine M3LifeHistoryEntry objects
 *   actually added by
 *   observeM3TickForLifeHistory(...) /
 *   observeM3PlayerWorldEventForLifeHistory(...).
 *
 * No second player-event or life-history schema
 * is invented here.
 */
export interface M3TickTelemetryEntry {
  readonly kind:
    typeof M3_TICK_TELEMETRY_ENTRY_KIND;

  readonly evidence:
    M3AcquisitionTickEvidence;
}

export interface M3PlayerEventTelemetryEntry {
  readonly kind:
    typeof M3_PLAYER_EVENT_TELEMETRY_ENTRY_KIND;

  readonly event:
    M3PlayerFoodWorldEvent;
}

export interface M3LifeHistoryTelemetryEntry {
  readonly kind:
    typeof M3_LIFE_HISTORY_TELEMETRY_ENTRY_KIND;

  readonly entry:
    M3LifeHistoryEntry;
}

export type M3TelemetryEntry =
  | M3TickTelemetryEntry
  | M3PlayerEventTelemetryEntry
  | M3LifeHistoryTelemetryEntry;

export interface M3TelemetryTrace {
  readonly schemaVersion:
    typeof M3_TELEMETRY_TRACE_SCHEMA_VERSION;

  readonly entries:
    readonly M3TelemetryEntry[];
}

export function createM3TelemetryTrace():
  M3TelemetryTrace {
  return {
    schemaVersion:
      M3_TELEMETRY_TRACE_SCHEMA_VERSION,

    entries:
      [],
  };
}

/*
 * Observe one already-completed authoritative
 * M3 acquisition tick.
 *
 * This does not re-run
 * advanceM3AcquisitionTick(...), evaluate
 * cognition or consume RNG. It appends exactly
 * the supplied evidence object.
 */
export function observeM3AcquisitionTickForTelemetry(
  trace:
    M3TelemetryTrace,

  evidence:
    M3AcquisitionTickEvidence,
): M3TelemetryTrace {
  return {
    ...trace,

    entries: [
      ...trace.entries,

      {
        kind:
          M3_TICK_TELEMETRY_ENTRY_KIND,

        evidence,
      },
    ],
  };
}

/*
 * Observe one already-committed genuine
 * M3PlayerFoodWorldEvent, exactly as returned by
 * applyM3PlayerFoodPlacement(...).
 *
 * This does not construct a second player-event
 * representation and does not itself change
 * world/food state.
 */
export function observeM3PlayerWorldEventForTelemetry(
  trace:
    M3TelemetryTrace,

  event:
    M3PlayerFoodWorldEvent,
): M3TelemetryTrace {
  return {
    ...trace,

    entries: [
      ...trace.entries,

      {
        kind:
          M3_PLAYER_EVENT_TELEMETRY_ENTRY_KIND,

        event,
      },
    ],
  };
}

/*
 * Observe a completed M3LifeHistory transition.
 *
 * This is a pure comparison of an
 * already-produced historyBefore/historyAfter
 * pair (for example the two states either side
 * of an observeM3TickForLifeHistory(...) or
 * observeM3PlayerWorldEventForLifeHistory(...)
 * call). It does not regenerate biography
 * wording and does not itself cause any
 * biography entry: it only reports the entries
 * that genuinely already exist in historyAfter
 * but not in historyBefore.
 *
 * M3 life history is append-only (entries are
 * never removed or reordered), so any entry
 * beyond historyBefore's length is newly added.
 */
export function observeM3LifeHistoryChangeForTelemetry(
  trace:
    M3TelemetryTrace,

  historyBefore:
    M3LifeHistory,

  historyAfter:
    M3LifeHistory,
): M3TelemetryTrace {
  if (
    historyAfter.entries.length <
    historyBefore.entries.length
  ) {
    throw new Error(
      "M3 life history telemetry requires an append-only history transition.",
    );
  }

  for (
    let index = 0;
    index <
      historyBefore.entries.length;
    index +=
      1
  ) {
    if (
      JSON.stringify(
        historyAfter.entries[
          index
        ],
      ) !==
      JSON.stringify(
        historyBefore.entries[
          index
        ],
      )
    ) {
      throw new Error(
        "M3 life history telemetry requires that previously recorded entries remain unchanged.",
      );
    }
  }

  const newEntries =
    historyAfter.entries.slice(
      historyBefore.entries.length,
    );

  return newEntries.reduce(
    (
      nextTrace,
      entry,
    ) => ({
      ...nextTrace,

      entries: [
        ...nextTrace.entries,

        {
          kind:
            M3_LIFE_HISTORY_TELEMETRY_ENTRY_KIND,

          entry,
        } as const,
      ],
    }),

    trace,
  );
}

/*
 * Deterministic ordering.
 *
 * The primary key is simulation time, then
 * simulation tick, then (for player-world
 * events sharing the same simulation time) the
 * existing deterministic external-event
 * sequence, then a fixed kind priority as a
 * final tie-break. No wall-clock timestamp,
 * random identifier or browser frame order is
 * used.
 */
interface M3TelemetryOrderingKey {
  readonly simulationTimeSeconds:
    number;

  readonly tickIndex:
    number;

  readonly sequence:
    number | null;

  readonly kindPriority:
    number;
}

function getM3TelemetryOrderingKey(
  entry:
    M3TelemetryEntry,
): M3TelemetryOrderingKey {
  switch (entry.kind) {
    case M3_TICK_TELEMETRY_ENTRY_KIND:
      return {
        simulationTimeSeconds:
          entry.evidence
            .simulationTimeSeconds,

        tickIndex:
          entry.evidence
            .tickIndex,

        sequence:
          null,

        kindPriority:
          0,
      };

    case M3_PLAYER_EVENT_TELEMETRY_ENTRY_KIND:
      return {
        simulationTimeSeconds:
          entry.event
            .simulationTimeSeconds,

        tickIndex:
          entry.event
            .tickIndex,

        sequence:
          entry.event
            .sequence,

        kindPriority:
          1,
      };

    case M3_LIFE_HISTORY_TELEMETRY_ENTRY_KIND:
      return {
        simulationTimeSeconds:
          entry.entry
            .simulationTimeSeconds,

        tickIndex:
          entry.entry
            .tickIndex,

        sequence:
          null,

        kindPriority:
          2,
      };
  }
}

export function compareM3TelemetryEntries(
  a:
    M3TelemetryEntry,

  b:
    M3TelemetryEntry,
): number {
  const keyA =
    getM3TelemetryOrderingKey(
      a,
    );

  const keyB =
    getM3TelemetryOrderingKey(
      b,
    );

  if (
    keyA.simulationTimeSeconds !==
    keyB.simulationTimeSeconds
  ) {
    return (
      keyA.simulationTimeSeconds -
      keyB.simulationTimeSeconds
    );
  }

  if (
    keyA.tickIndex !==
    keyB.tickIndex
  ) {
    return (
      keyA.tickIndex -
      keyB.tickIndex
    );
  }

  if (
    keyA.sequence !==
      null &&
    keyB.sequence !==
      null &&
    keyA.sequence !==
      keyB.sequence
  ) {
    return (
      keyA.sequence -
      keyB.sequence
    );
  }

  return (
    keyA.kindPriority -
    keyB.kindPriority
  );
}

/*
 * Sorts a copy of the supplied entries
 * deterministically. Array.prototype.sort is
 * stable, so entries that compare equal retain
 * their existing relative (already-deterministic)
 * order.
 */
export function sortM3TelemetryEntriesDeterministically(
  entries:
    readonly M3TelemetryEntry[],
): M3TelemetryEntry[] {
  return [
    ...entries,
  ].sort(
    compareM3TelemetryEntries,
  );
}

export function serializeM3TelemetryTrace(
  trace:
    M3TelemetryTrace,
): string {
  assertM3TelemetryTraceShape(
    trace,
  );

  return JSON.stringify(
    trace,
  );
}

export function deserializeM3TelemetryTrace(
  serialized:
    string,
): M3TelemetryTrace {
  let parsed:
    unknown;

  try {
    parsed =
      JSON.parse(
        serialized,
      ) as unknown;
  } catch (error) {
    throw new Error(
      "M3 telemetry trace is not valid JSON.",
      {
        cause:
          error,
      },
    );
  }

  assertM3TelemetryTraceShape(
    parsed,
  );

  return parsed;
}

function assertM3TelemetryTraceShape(
  value:
    unknown,
): asserts value is M3TelemetryTrace {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "M3 telemetry trace must be an object.",
    );
  }

  if (
    value.schemaVersion !==
    M3_TELEMETRY_TRACE_SCHEMA_VERSION
  ) {
    throw new Error(
      "Unsupported M3 telemetry trace schema version.",
    );
  }

  if (
    !Array.isArray(
      value.entries,
    )
  ) {
    throw new Error(
      "M3 telemetry trace entries must be an array.",
    );
  }

  for (
    const entry of
    value.entries
  ) {
    assertM3TelemetryEntryShape(
      entry,
    );
  }
}

function assertM3TelemetryEntryShape(
  value:
    unknown,
): asserts value is M3TelemetryEntry {
  if (
    !isRecord(
      value,
    )
  ) {
    throw new Error(
      "M3 telemetry entry must be an object.",
    );
  }

  switch (value.kind) {
    case M3_TICK_TELEMETRY_ENTRY_KIND: {
      if (
        !isRecord(
          value.evidence,
        )
      ) {
        throw new Error(
          "M3 tick telemetry entry is missing evidence.",
        );
      }

      return;
    }

    case M3_PLAYER_EVENT_TELEMETRY_ENTRY_KIND: {
      assertM3PlayerFoodWorldEvent(
        value.event,
      );

      return;
    }

    case M3_LIFE_HISTORY_TELEMETRY_ENTRY_KIND: {
      if (
        !isRecord(
          value.entry,
        ) ||
        typeof value.entry
          .description !==
          "string"
      ) {
        throw new Error(
          "M3 life-history telemetry entry is invalid.",
        );
      }

      return;
    }

    default:
      throw new Error(
        "M3 telemetry entry kind is invalid.",
      );
  }
}

/*
 * STANDARDIZED PROBE TELEMETRY
 *
 * Purely observational summary derived from an
 * ALREADY-COMPLETED
 * M3IndividualityProbeExperimentResult. This
 * does not re-run the acquisition experiment or
 * the standardized probe.
 *
 * Field names deliberately describe only what
 * the evidence mechanically shows (weights
 * differ, behaviour follows transferred weights)
 * and avoid stronger interpretive labels such as
 * "personality" or "intelligence".
 */
export interface M3StandardizedProbeTelemetry {
  readonly branchASeed:
    number;

  readonly branchBSeed:
    number;

  readonly experienceHistoryDiffers:
    boolean;

  readonly learnedConnectionWeightsDiffer:
    boolean;

  readonly branchALearnedConnectionWeights:
    Readonly<Record<string, number>>;

  readonly branchBLearnedConnectionWeights:
    Readonly<Record<string, number>>;

  /*
   * True when every normalized Phase B
   * condition (position, hunger, world, direct
   * perception, absent memory, eligibility,
   * RNG) is structurally identical between
   * Branch A and Branch B, so only persistent
   * learned weights differ going into the
   * probe.
   */
  readonly normalizedConditionsEquivalent:
    boolean;

  readonly currentMemoryAbsent:
    true;

  readonly explorationDisabledDuringProbe:
    true;

  readonly rngNormalized:
    boolean;

  readonly eligibilityNormalized:
    boolean;

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

  /*
   * True when the identity that received the
   * other branch's learned weights reproduces
   * that other branch's own selected action,
   * rather than its own original identity's
   * selected action.
   */
  readonly behaviourFollowsLearnedWeightsRatherThanIdentity:
    boolean;
}

export function deriveM3StandardizedProbeTelemetry(
  result:
    M3IndividualityProbeExperimentResult,
): M3StandardizedProbeTelemetry {
  const experienceHistoryDiffers =
    JSON.stringify(
      result.acquisition
        .branchA.rounds,
    ) !==
    JSON.stringify(
      result.acquisition
        .branchB.rounds,
    );

  const learnedConnectionWeightsDiffer =
    JSON.stringify(
      result.branchA
        .connectionWeights,
    ) !==
    JSON.stringify(
      result.branchB
        .connectionWeights,
    );

  const normalizedConditionsEquivalent =
    JSON.stringify(
      result.branchA
        .normalizedState,
    ) ===
    JSON.stringify(
      result.branchB
        .normalizedState,
    );

  const rngNormalized =
    JSON.stringify(
      result.branchA
        .normalizedState.rngState,
    ) ===
    JSON.stringify(
      result.branchB
        .normalizedState.rngState,
    );

  const eligibilityNormalized =
    result.branchA
      .normalizedState
      .eligibilityTrace.length ===
      0 &&
    result.branchB
      .normalizedState
      .eligibilityTrace.length ===
      0;

  const behaviourFollowsLearnedWeightsRatherThanIdentity =
    result
      .identityAWithBranchBWeights
      .selectedActionId ===
      result.branchB
        .selectedActionId &&
    result
      .identityBWithBranchAWeights
      .selectedActionId ===
      result.branchA
        .selectedActionId;

  return {
    branchASeed:
      result.acquisition
        .branchA.seed,

    branchBSeed:
      result.acquisition
        .branchB.seed,

    experienceHistoryDiffers,

    learnedConnectionWeightsDiffer,

    branchALearnedConnectionWeights:
      result.branchA
        .connectionWeights,

    branchBLearnedConnectionWeights:
      result.branchB
        .connectionWeights,

    normalizedConditionsEquivalent,

    currentMemoryAbsent:
      true,

    explorationDisabledDuringProbe:
      true,

    rngNormalized,

    eligibilityNormalized,

    branchA:
      result.branchA,

    branchB:
      result.branchB,

    learningDisabledControl:
      result
        .learningDisabledControl,

    explorationDisabledControl:
      result
        .explorationDisabledControl,

    identityAWithBranchBWeights:
      result
        .identityAWithBranchBWeights,

    identityBWithBranchAWeights:
      result
        .identityBWithBranchAWeights,

    behaviourFollowsLearnedWeightsRatherThanIdentity,
  };
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
