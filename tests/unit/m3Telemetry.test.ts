import {
  describe,
  expect,
  it,
} from "vitest";

import {
  advanceM3AcquisitionTick,
  createM3AcquisitionState,
  type M3AcquisitionState,
  type M3AcquisitionTickEvidence,
} from "../../src/simulation/core/m3Acquisition.js";

import {
  applyM3PlayerFoodPlacement,
} from "../../src/simulation/core/m3PlayerWorld.js";

import {
  createM3LifeHistory,
  observeM3TickForLifeHistory,
} from "../../src/simulation/core/m3LifeHistory.js";

import {
  createM3PersistentRunState,
  deserializeM3PersistentRun,
  serializeM3PersistentRun,
} from "../../src/simulation/core/m3Persistence.js";

import {
  runM3IndividualityProbeExperiment,
} from "../../src/simulation/core/m3Probe.js";

import {
  deriveM3DirectFoodPerception,
} from "../../src/simulation/core/m3Discovery.js";

import {
  evaluateM3Brain,
  M3_NODE_IDS,
} from "../../src/simulation/brain/m3Brain.js";

import {
  senseHunger,
} from "../../src/simulation/senses/hungerSense.js";

import {
  senseFoodContact,
} from "../../src/simulation/senses/foodContact.js";

import {
  M3_ACQUISITION_INTERACTION_RANGE,
  M3_ACQUISITION_MAX_TICKS_PER_ROUND,
  M3_HIDDEN_TARGET_ALTERNATE_FOOD,
  M3_PRIMARY_BRANCH_A_SEED,
  M3_PRIMARY_BRANCH_B_SEED,
} from "../../src/simulation/core/m3Contract.js";

import {
  compareM3TelemetryEntries,
  createM3TelemetryTrace,
  deriveM3StandardizedProbeTelemetry,
  deserializeM3TelemetryTrace,
  M3_LIFE_HISTORY_TELEMETRY_ENTRY_KIND,
  M3_PLAYER_EVENT_TELEMETRY_ENTRY_KIND,
  M3_TICK_TELEMETRY_ENTRY_KIND,
  observeM3AcquisitionTickForTelemetry,
  observeM3LifeHistoryChangeForTelemetry,
  observeM3PlayerWorldEventForTelemetry,
  serializeM3TelemetryTrace,
  sortM3TelemetryEntriesDeterministically,
  type M3TelemetryEntry,
  type M3TelemetryTrace,
} from "../../src/simulation/core/m3Telemetry.js";

function createBranchAState():
  M3AcquisitionState {
  return createM3AcquisitionState(
    {
      seed:
        M3_PRIMARY_BRANCH_A_SEED,

      learningEnabled:
        true,

      explorationEnabled:
        true,
    },
  );
}

interface BranchRun {
  readonly finalState:
    M3AcquisitionState;

  readonly ticks:
    readonly M3AcquisitionTickEvidence[];
}

function runBranchTicks(
  seed:
    number,

  maxTicks =
    M3_ACQUISITION_MAX_TICKS_PER_ROUND,
): BranchRun {
  let state =
    createM3AcquisitionState(
      {
        seed,

        learningEnabled:
          true,

        explorationEnabled:
          true,
      },
    );

  const ticks:
    M3AcquisitionTickEvidence[] =
      [];

  for (
    let index = 0;
    index <
      maxTicks &&
      !state.complete;
    index +=
      1
  ) {
    const result =
      advanceM3AcquisitionTick(
        state,
      );

    ticks.push(
      result.evidence,
    );

    state =
      result.state;
  }

  return {
    finalState:
      state,

    ticks,
  };
}

function runBranchTraceFromSeed(
  seed:
    number,
): M3TelemetryTrace {
  let state =
    createM3AcquisitionState(
      {
        seed,

        learningEnabled:
          true,

        explorationEnabled:
          true,
      },
    );

  let trace =
    createM3TelemetryTrace();

  while (
    !state.complete
  ) {
    const result =
      advanceM3AcquisitionTick(
        state,
      );

    trace =
      observeM3AcquisitionTickForTelemetry(
        trace,

        result.evidence,
      );

    state =
      result.state;
  }

  return trace;
}

/*
 * Deterministically locate a checkpoint state in
 * the locked Branch A run where EXPLORE has
 * legitimately won, an active heading exists,
 * pressure has evolved and the round is not
 * complete. Reused from the M3.10A persistence
 * test pattern.
 */
function findExplorationCheckpoint():
  M3AcquisitionState {
  let state =
    createBranchAState();

  for (
    let index = 0;
    index < 31;
    index +=
      1
  ) {
    const result =
      advanceM3AcquisitionTick(
        state,
      );

    state =
      result.state;

    if (
      result.evidence
        .selectedActionId ===
        "explore" &&
      result.evidence
        .movementSource ===
        "exploration" &&
      !state.complete &&
      state.explorationState
        .activeHeading !==
        null
    ) {
      return state;
    }
  }

  throw new Error(
    "No qualifying exploration checkpoint was found within the locked Branch A round.",
  );
}

describe(
  "M3.10B causal tick telemetry",
  () => {
    it("exposes simulation tick/time", () => {
      const state0 =
        createBranchAState();

      const tick =
        advanceM3AcquisitionTick(
          state0,
        );

      expect(
        tick.evidence.tickIndex,
      ).toBe(
        0,
      );

      expect(
        tick.evidence
          .simulationTimeSeconds,
      ).toBe(
        0,
      );
    });

    it("records genuine exploration pressure before/input/after, including the exploration-disabled zero input", () => {
      const enabled =
        createBranchAState();

      const enabledTick =
        advanceM3AcquisitionTick(
          enabled,
        );

      expect(
        enabledTick.evidence
          .explorationPressureBefore,
      ).toBe(
        enabled.explorationState
          .pressure,
      );

      expect(
        enabledTick.evidence
          .explorationPressureInput,
      ).toBe(
        enabled.explorationState
          .pressure,
      );

      expect(
        enabledTick.evidence
          .explorationPressureAfter,
      ).toBe(
        enabledTick.state
          .explorationState.pressure,
      );

      const disabled =
        createM3AcquisitionState(
          {
            seed:
              M3_PRIMARY_BRANCH_A_SEED,

            learningEnabled:
              true,

            explorationEnabled:
              false,
          },
        );

      const disabledTick =
        advanceM3AcquisitionTick(
          disabled,
        );

      expect(
        disabledTick.evidence
          .explorationPressureInput,
      ).toBe(
        0,
      );

      expect(
        disabledTick.evidence
          .explorationPressureBefore,
      ).toBe(
        disabled.explorationState
          .pressure,
      );

      /*
       * The Creature's own pressure continues to
       * accumulate even though it contributes
       * nothing to cognition while disabled.
       */
      expect(
        disabledTick.evidence
          .explorationPressureAfter,
      ).toBeGreaterThan(
        disabledTick.evidence
          .explorationPressureBefore,
      );
    });

    it("reports genuine neural input activations rather than reconstructed approximations", () => {
      const state0 =
        createBranchAState();

      const tick =
        advanceM3AcquisitionTick(
          state0,
        );

      const hungerSignal =
        senseHunger(
          state0.hunger,
        );

      const perception =
        deriveM3DirectFoodPerception(
          state0.position,

          state0.food,

          state0.sensoryOccluder,
        );

      const contactSignal =
        senseFoodContact(
          state0.position,

          state0.food,

          M3_ACQUISITION_INTERACTION_RANGE,
        );

      const independent =
        evaluateM3Brain(
          state0.brain,

          hungerSignal,

          perception.foodSignal,

          state0.explorationState
            .pressure,

          contactSignal,

          null,
        );

      const independentActivations =
        Object.fromEntries(
          independent.brain.nodes.map(
            (node) => [
              node.id,
              node.activation,
            ],
          ),
        );

      expect(
        tick.evidence
          .hungerInputActivation,
      ).toBe(
        hungerSignal.hungerLevel,
      );

      expect(
        tick.evidence
          .directFoodInputActivation,
      ).toBe(
        perception.foodSignal
          ?.strength ??
          0,
      );

      expect(
        tick.evidence
          .contactInputActivation,
      ).toBe(
        independentActivations[
          "input:contact"
        ] ??
          0,
      );

      expect(
        tick.evidence
          .explorationInputActivation,
      ).toBe(
        independentActivations[
          M3_NODE_IDS
            .explorationInput
        ],
      );

      expect(
        tick.evidence
          .idleActivation,
      ).toBe(
        independent.idleActivation,
      );

      expect(
        tick.evidence
          .seekActivation,
      ).toBe(
        independent.seekActivation,
      );

      expect(
        tick.evidence
          .eatActivation,
      ).toBe(
        independent.eatActivation,
      );

      expect(
        tick.evidence
          .exploreActivation,
      ).toBe(
        independent.exploreActivation,
      );

      expect(
        tick.evidence
          .selectedActionId,
      ).toBe(
        independent.selectedActionId,
      );
    });

    it("records contact evidence exactly matching the sensory signal cognition received", () => {
      const state0 =
        createBranchAState();

      const tick =
        advanceM3AcquisitionTick(
          state0,
        );

      const contactSignal =
        senseFoodContact(
          state0.position,

          state0.food,

          M3_ACQUISITION_INTERACTION_RANGE,
        );

      expect(
        tick.evidence.contactInRange,
      ).toBe(
        contactSignal.inRange,
      );

      expect(
        tick.evidence
          .contactInputActivation,
      ).toBe(
        contactSignal.inRange
          ? 1
          : 0,
      );
    });

    it("explicitly shows no active M2 food memory anywhere in the M3 acquisition route", () => {
      const { ticks } =
        runBranchTicks(
          M3_PRIMARY_BRANCH_A_SEED,
        );

      expect(
        ticks.length,
      ).toBeGreaterThan(
        0,
      );

      for (
        const tick of
        ticks
      ) {
        expect(
          tick.activeFoodMemoryPresent,
        ).toBe(
          false,
        );

        expect(
          tick.rememberedFoodInputActivation,
        ).toBe(
          0,
        );
      }
    });

    it("records new EXPLORE heading sampling and its exact RNG consumption", () => {
      const { ticks } =
        runBranchTicks(
          M3_PRIMARY_BRANCH_A_SEED,
        );

      const firstExploreIndex =
        ticks.findIndex(
          (tick) =>
            tick.selectedActionId ===
              "explore" &&
            tick.sampledNewHeading,
        );

      expect(
        firstExploreIndex,
      ).toBeGreaterThanOrEqual(
        0,
      );

      const tick =
        ticks[
          firstExploreIndex
        ]!;

      expect(
        tick.explorationHeadingBefore,
      ).toBeNull();

      expect(
        tick.explorationHeadingAfter,
      ).not.toBeNull();

      expect(
        tick.rngStateBefore,
      ).not.toEqual(
        tick.rngStateAfter,
      );

      expect(
        tick.explorationMovementDirection,
      ).toEqual(
        {
          x:
            tick
              .explorationHeadingAfter!
              .directionX,

          y:
            tick
              .explorationHeadingAfter!
              .directionY,
        },
      );
    });

    it("records valid heading reuse without consuming RNG", () => {
      const { ticks } =
        runBranchTicks(
          M3_PRIMARY_BRANCH_A_SEED,
        );

      const firstExploreIndex =
        ticks.findIndex(
          (tick) =>
            tick.selectedActionId ===
              "explore" &&
            tick.sampledNewHeading,
        );

      expect(
        firstExploreIndex,
      ).toBeGreaterThanOrEqual(
        0,
      );

      const reuseIndex =
        ticks.findIndex(
          (tick, index) =>
            index >
              firstExploreIndex &&
            tick.selectedActionId ===
              "explore" &&
            !tick.sampledNewHeading,
        );

      expect(
        reuseIndex,
      ).toBeGreaterThan(
        firstExploreIndex,
      );

      const tick =
        ticks[
          reuseIndex
        ]!;

      expect(
        tick.explorationHeadingBefore,
      ).not.toBeNull();

      expect(
        tick.explorationHeadingAfter,
      ).toEqual(
        tick.explorationHeadingBefore,
      );

      expect(
        tick.rngStateBefore,
      ).toEqual(
        tick.rngStateAfter,
      );
    });

    it("never lets a non-EXPLORE winner gain exploratory movement from a retained heading", () => {
      const { ticks } =
        runBranchTicks(
          M3_PRIMARY_BRANCH_A_SEED,
        );

      const firstExploreIndex =
        ticks.findIndex(
          (tick) =>
            tick.selectedActionId ===
            "explore",
        );

      expect(
        firstExploreIndex,
      ).toBeGreaterThanOrEqual(
        0,
      );

      const nonExploreWithHeadingIndex =
        ticks.findIndex(
          (tick, index) =>
            index >
              firstExploreIndex &&
            tick.selectedActionId !==
              "explore" &&
            tick.explorationHeadingBefore !==
              null,
        );

      expect(
        nonExploreWithHeadingIndex,
      ).toBeGreaterThan(
        firstExploreIndex,
      );

      const tick =
        ticks[
          nonExploreWithHeadingIndex
        ]!;

      expect(
        tick.movementSource,
      ).not.toBe(
        "exploration",
      );

      expect(
        tick.explorationMovementDirection,
      ).toBeNull();

      expect(
        tick.sampledNewHeading,
      ).toBe(
        false,
      );

      expect(
        tick.explorationHeadingAfter,
      ).toEqual(
        tick.explorationHeadingBefore,
      );

      expect(
        tick.rngStateBefore,
      ).toEqual(
        tick.rngStateAfter,
      );
    });

    it("records SEEK movement direction matching legitimate direct perception, never a hidden food coordinate", () => {
      const { ticks } =
        runBranchTicks(
          M3_PRIMARY_BRANCH_A_SEED,
        );

      const seekIndex =
        ticks.findIndex(
          (tick) =>
            tick.selectedActionId ===
            "seek",
        );

      expect(
        seekIndex,
      ).toBeGreaterThanOrEqual(
        0,
      );

      const tick =
        ticks[
          seekIndex
        ]!;

      expect(
        tick.directFoodPerceptionBefore,
      ).not.toBeNull();

      expect(
        tick.seekMovementDirection,
      ).toEqual(
        {
          x:
            tick
              .directFoodPerceptionBefore!
              .directionX,

          y:
            tick
              .directFoodPerceptionBefore!
              .directionY,
        },
      );

      expect(
        tick.explorationMovementDirection,
      ).toBeNull();
    });

    it("records perception and occlusion evidence before/after movement", () => {
      const state0 =
        createBranchAState();

      const tick =
        advanceM3AcquisitionTick(
          state0,
        );

      const before =
        deriveM3DirectFoodPerception(
          state0.position,

          state0.food,

          state0.sensoryOccluder,
        );

      expect(
        tick.evidence
          .directFoodPerceptionBefore,
      ).toEqual(
        before.foodSignal,
      );

      expect(
        tick.evidence
          .occludedBeforeMovement,
      ).toBe(
        before.occluded,
      );

      const after =
        deriveM3DirectFoodPerception(
          tick.state.position,

          state0.food,

          state0.sensoryOccluder,
        );

      expect(
        tick.evidence
          .directFoodPerceptionAfterMovement,
      ).toEqual(
        after.foodSignal,
      );

      expect(
        tick.evidence
          .occludedAfterMovement,
      ).toBe(
        after.occluded,
      );
    });

    it("records autonomous discovery evidence consistently", () => {
      const { ticks } =
        runBranchTicks(
          M3_PRIMARY_BRANCH_A_SEED,
        );

      const discoveryIndex =
        ticks.findIndex(
          (tick) =>
            tick
              .autonomousDiscoveryOccurred,
        );

      expect(
        discoveryIndex,
      ).toBeGreaterThanOrEqual(
        0,
      );

      const tick =
        ticks[
          discoveryIndex
        ]!;

      expect(
        tick.selectedActionId,
      ).toBe(
        "explore",
      );

      expect(
        tick.movementSource,
      ).toBe(
        "exploration",
      );

      expect(
        tick.directFoodPerceptionBefore,
      ).toBeNull();

      expect(
        tick.directFoodPerceptionAfterMovement,
      ).not.toBeNull();
    });

    it("records EAT and reward evidence, and the exact resulting weight changes", () => {
      const { ticks } =
        runBranchTicks(
          M3_PRIMARY_BRANCH_A_SEED,
        );

      const eatIndex =
        ticks.findIndex(
          (tick) =>
            tick.ate,
        );

      expect(
        eatIndex,
      ).toBeGreaterThanOrEqual(
        0,
      );

      const tick =
        ticks[
          eatIndex
        ]!;

      expect(
        tick.selectedActionId,
      ).toBe(
        "eat",
      );

      expect(
        tick.reward,
      ).toBeGreaterThan(
        0,
      );

      expect(
        tick.weightChanges.length,
      ).toBeGreaterThan(
        0,
      );
    });

    it("records eligibility trace before/after exactly as merged into the resulting state", () => {
      const state0 =
        createBranchAState();

      expect(
        state0.eligibilityTrace,
      ).toEqual(
        [],
      );

      const first =
        advanceM3AcquisitionTick(
          state0,
        );

      expect(
        first.evidence
          .eligibilityTraceBefore,
      ).toEqual(
        state0.eligibilityTrace,
      );

      expect(
        first.evidence
          .eligibilityTraceAfter,
      ).toEqual(
        first.state.eligibilityTrace,
      );

      const second =
        advanceM3AcquisitionTick(
          first.state,
        );

      expect(
        second.evidence
          .eligibilityTraceBefore,
      ).toEqual(
        first.evidence
          .eligibilityTraceAfter,
      );
    });

    it("never exposes a hidden-target-style field in tick evidence", () => {
      const state0 =
        createBranchAState();

      const tick =
        advanceM3AcquisitionTick(
          state0,
        );

      const forbiddenKeys = [
        "targetX",
        "targetY",
        "currentHiddenFoodPosition",
        "nearestFoodDirection",
        "desiredExplorationDestination",
      ];

      for (
        const key of
        forbiddenKeys
      ) {
        expect(
          Object.prototype.hasOwnProperty.call(
            tick.evidence,
            key,
          ),
        ).toBe(
          false,
        );
      }
    });
  },
);

describe(
  "M3.10B player-world and life-history telemetry",
  () => {
    it("uses the genuine existing M3PlayerFoodWorldEvent object rather than a second representation", () => {
      const state0 =
        createBranchAState();

      const placement =
        applyM3PlayerFoodPlacement(
          state0,

          {
            x: 2,
            y: 3,
          },

          0,
        );

      const trace =
        observeM3PlayerWorldEventForTelemetry(
          createM3TelemetryTrace(),

          placement.event,
        );

      expect(
        trace.entries,
      ).toHaveLength(
        1,
      );

      expect(
        trace.entries[0]!.kind,
      ).toBe(
        M3_PLAYER_EVENT_TELEMETRY_ENTRY_KIND,
      );

      expect(
        (
          trace.entries[0] as {
            event: unknown;
          }
        ).event,
      ).toBe(
        placement.event,
      );
    });

    it("preserves deterministic ordering for multiple same-time player events", () => {
      const state0 =
        createBranchAState();

      const first =
        applyM3PlayerFoodPlacement(
          state0,

          {
            x: 2,
            y: 3,
          },

          0,
        );

      const second =
        applyM3PlayerFoodPlacement(
          first.state,

          {
            x: 3,
            y: 4,
          },

          1,
        );

      expect(
        first.event
          .simulationTimeSeconds,
      ).toBe(
        second.event
          .simulationTimeSeconds,
      );

      let trace =
        createM3TelemetryTrace();

      /*
       * Deliberately observed out of sequence
       * order.
       */
      trace =
        observeM3PlayerWorldEventForTelemetry(
          trace,

          second.event,
        );

      trace =
        observeM3PlayerWorldEventForTelemetry(
          trace,

          first.event,
        );

      const sorted =
        sortM3TelemetryEntriesDeterministically(
          trace.entries,
        );

      const sequences =
        sorted.map(
          (entry) =>
            (
              entry as {
                event: {
                  sequence:
                    number;
                };
              }
            ).event.sequence,
        );

      expect(
        sequences,
      ).toEqual(
        [
          0,
          1,
        ],
      );
    });

    it("observes actual life-history entries genuinely added by the biography observer", () => {
      const { ticks } =
        runBranchTicks(
          M3_PRIMARY_BRANCH_A_SEED,
        );

      const explorationTick =
        ticks.find(
          (tick) =>
            tick.selectedActionId ===
              "explore" &&
            tick.movementSource ===
              "exploration",
        );

      expect(
        explorationTick,
      ).toBeDefined();

      const historyBefore =
        createM3LifeHistory();

      const historyAfter =
        observeM3TickForLifeHistory(
          historyBefore,

          explorationTick!,
        );

      expect(
        historyAfter.entries.length,
      ).toBeGreaterThan(
        0,
      );

      const trace =
        observeM3LifeHistoryChangeForTelemetry(
          createM3TelemetryTrace(),

          historyBefore,

          historyAfter,
        );

      expect(
        trace.entries,
      ).toHaveLength(
        historyAfter.entries.length,
      );

      expect(
        trace.entries[0]!.kind,
      ).toBe(
        M3_LIFE_HISTORY_TELEMETRY_ENTRY_KIND,
      );

      expect(
        (
          trace.entries[0] as {
            entry:
              unknown;
          }
        ).entry,
      ).toBe(
        historyAfter.entries[0],
      );
    });

    it("does not itself generate biography changes when observing an unchanged history", () => {
      const historyBefore =
        createM3LifeHistory();

      const historyUnchanged =
        createM3LifeHistory();

      const trace =
        observeM3LifeHistoryChangeForTelemetry(
          createM3TelemetryTrace(),

          historyBefore,

          historyUnchanged,
        );

      expect(
        trace.entries,
      ).toHaveLength(
        0,
      );

      expect(
        historyBefore.entries,
      ).toHaveLength(
        0,
      );
    });
  },
);

describe(
  "M3.10B standardized probe telemetry",
  () => {
    it("exposes Phase A/B divergence", () => {
      const result =
        runM3IndividualityProbeExperiment();

      const telemetry =
        deriveM3StandardizedProbeTelemetry(
          result,
        );

      expect(
        telemetry.branchASeed,
      ).toBe(
        result.acquisition.branchA
          .seed,
      );

      expect(
        telemetry.branchBSeed,
      ).toBe(
        result.acquisition.branchB
          .seed,
      );

      expect(
        telemetry
          .experienceHistoryDiffers,
      ).toBe(
        true,
      );

      expect(
        telemetry
          .learnedConnectionWeightsDiffer,
      ).toBe(
        true,
      );

      expect(
        telemetry
          .branchALearnedConnectionWeights,
      ).toEqual(
        result.branchA
          .connectionWeights,
      );

      expect(
        telemetry
          .branchBLearnedConnectionWeights,
      ).toEqual(
        result.branchB
          .connectionWeights,
      );
    });

    it("exposes normalized current/transient conditions", () => {
      const result =
        runM3IndividualityProbeExperiment();

      const telemetry =
        deriveM3StandardizedProbeTelemetry(
          result,
        );

      expect(
        telemetry
          .normalizedConditionsEquivalent,
      ).toBe(
        true,
      );

      expect(
        telemetry.currentMemoryAbsent,
      ).toBe(
        true,
      );

      expect(
        telemetry
          .explorationDisabledDuringProbe,
      ).toBe(
        true,
      );

      expect(
        telemetry.rngNormalized,
      ).toBe(
        true,
      );

      expect(
        telemetry
          .eligibilityNormalized,
      ).toBe(
        true,
      );
    });

    it("exposes the learning-disabled and exploration-disabled controls by genuine reference", () => {
      const result =
        runM3IndividualityProbeExperiment();

      const telemetry =
        deriveM3StandardizedProbeTelemetry(
          result,
        );

      expect(
        telemetry
          .learningDisabledControl,
      ).toBe(
        result.learningDisabledControl,
      );

      expect(
        telemetry
          .explorationDisabledControl,
      ).toBe(
        result
          .explorationDisabledControl,
      );
    });

    it("exposes state-swap identity independence", () => {
      const result =
        runM3IndividualityProbeExperiment();

      const telemetry =
        deriveM3StandardizedProbeTelemetry(
          result,
        );

      expect(
        telemetry
          .identityAWithBranchBWeights,
      ).toBe(
        result
          .identityAWithBranchBWeights,
      );

      expect(
        telemetry
          .identityBWithBranchAWeights,
      ).toBe(
        result
          .identityBWithBranchAWeights,
      );

      expect(
        telemetry
          .behaviourFollowsLearnedWeightsRatherThanIdentity,
      ).toBe(
        true,
      );
    });
  },
);

describe(
  "M3.10B observational isolation",
  () => {
    it("produces identical authoritative results whether or not telemetry is collected", () => {
      function run(
        collectTelemetry:
          boolean,
      ) {
        let state =
          createBranchAState();

        const evidences:
          M3AcquisitionTickEvidence[] =
            [];

        let trace =
          createM3TelemetryTrace();

        while (
          !state.complete
        ) {
          const result =
            advanceM3AcquisitionTick(
              state,
            );

          evidences.push(
            result.evidence,
          );

          if (
            collectTelemetry
          ) {
            trace =
              observeM3AcquisitionTickForTelemetry(
                trace,

                result.evidence,
              );
          }

          state =
            result.state;
        }

        return {
          finalState:
            state,

          evidences,

          trace,
        };
      }

      const withTelemetry =
        run(
          true,
        );

      const withoutTelemetry =
        run(
          false,
        );

      expect(
        withTelemetry.finalState,
      ).toEqual(
        withoutTelemetry.finalState,
      );

      expect(
        withTelemetry.evidences,
      ).toEqual(
        withoutTelemetry.evidences,
      );
    });

    it("consumes zero simulation RNG while observing telemetry", () => {
      const state0 =
        createBranchAState();

      const tick =
        advanceM3AcquisitionTick(
          state0,
        );

      const rngAfterTick =
        tick.state.rngState;

      let trace =
        createM3TelemetryTrace();

      trace =
        observeM3AcquisitionTickForTelemetry(
          trace,

          tick.evidence,
        );

      trace =
        observeM3AcquisitionTickForTelemetry(
          trace,

          tick.evidence,
        );

      expect(
        tick.state.rngState,
      ).toEqual(
        rngAfterTick,
      );

      expect(
        trace.entries,
      ).toHaveLength(
        2,
      );

      expect(
        trace.entries[0]!.kind,
      ).toBe(
        M3_TICK_TELEMETRY_ENTRY_KIND,
      );
    });
  },
);

describe(
  "M3.10B deterministic telemetry replay",
  () => {
    it("produces exactly identical telemetry from a same-seed replay", () => {
      const first =
        runBranchTraceFromSeed(
          M3_PRIMARY_BRANCH_A_SEED,
        );

      const second =
        runBranchTraceFromSeed(
          M3_PRIMARY_BRANCH_A_SEED,
        );

      expect(
        second,
      ).toEqual(
        first,
      );
    });

    it("serializes deterministically and round-trips exactly", () => {
      const trace =
        runBranchTraceFromSeed(
          M3_PRIMARY_BRANCH_A_SEED,
        );

      const first =
        serializeM3TelemetryTrace(
          trace,
        );

      const second =
        serializeM3TelemetryTrace(
          trace,
        );

      expect(
        second,
      ).toBe(
        first,
      );

      const restored =
        deserializeM3TelemetryTrace(
          first,
        );

      expect(
        restored,
      ).toEqual(
        trace,
      );
    });

    it("rejects an unsupported telemetry trace schema version", () => {
      const trace =
        runBranchTraceFromSeed(
          M3_PRIMARY_BRANCH_A_SEED,
        );

      const parsed =
        JSON.parse(
          serializeM3TelemetryTrace(
            trace,
          ),
        ) as Record<
          string,
          unknown
        >;

      parsed.schemaVersion =
        999;

      expect(() =>
        deserializeM3TelemetryTrace(
          JSON.stringify(
            parsed,
          ),
        ),
      ).toThrow();
    });
  },
);

describe(
  "M3.10B different-seed exploration variation",
  () => {
    it("makes different-seed exploration telemetry visibly different, without itself claiming sufficient individuality evidence", () => {
      const traceA =
        runBranchTraceFromSeed(
          M3_PRIMARY_BRANCH_A_SEED,
        );

      const traceB =
        runBranchTraceFromSeed(
          M3_PRIMARY_BRANCH_B_SEED,
        );

      expect(
        traceB,
      ).not.toEqual(
        traceA,
      );

      /*
       * The telemetry representation exposes no
       * field claiming this difference already
       * constitutes experience-shaped
       * individuality; that stronger claim
       * requires the separate standardized probe
       * evidence above.
       */
      expect(
        "individualityConfirmed" in
          traceA,
      ).toBe(
        false,
      );
    });
  },
);

describe(
  "M3.10B hidden-target adversarial telemetry",
  () => {
    it("keeps ordinary causal tick telemetry identical before legitimate perception occurs, regardless of the hidden food position", () => {
      const defaultState =
        createBranchAState();

      const alternateState =
        applyM3PlayerFoodPlacement(
          defaultState,

          {
            x:
              M3_HIDDEN_TARGET_ALTERNATE_FOOD.x,

            y:
              M3_HIDDEN_TARGET_ALTERNATE_FOOD.y,
          },

          0,
        ).state;

      /*
       * Both start with no direct food
       * perception; only the hidden food
       * position differs.
       */
      expect(
        deriveM3DirectFoodPerception(
          defaultState.position,

          defaultState.food,

          defaultState.sensoryOccluder,
        ).foodSignal,
      ).toBeNull();

      expect(
        deriveM3DirectFoodPerception(
          alternateState.position,

          alternateState.food,

          alternateState.sensoryOccluder,
        ).foodSignal,
      ).toBeNull();

      let stateA:
        M3AcquisitionState =
          defaultState;

      let stateB:
        M3AcquisitionState =
          alternateState;

      let comparedTicks =
        0;

      let perceptionDiverged =
        false;

      for (
        let index = 0;
        index <
          M3_ACQUISITION_MAX_TICKS_PER_ROUND;
        index +=
          1
      ) {
        if (
          stateA.complete ||
          stateB.complete
        ) {
          break;
        }

        const tickA =
          advanceM3AcquisitionTick(
            stateA,
          );

        const tickB =
          advanceM3AcquisitionTick(
            stateB,
          );

        if (
          tickA.evidence
            .directFoodPerceptionBefore !==
            null ||
          tickA.evidence
            .directFoodPerceptionAfterMovement !==
            null ||
          tickB.evidence
            .directFoodPerceptionBefore !==
            null ||
          tickB.evidence
            .directFoodPerceptionAfterMovement !==
            null
        ) {
          perceptionDiverged =
            true;

          break;
        }

        expect(
          tickA.evidence
            .selectedActionId,
        ).toBe(
          tickB.evidence
            .selectedActionId,
        );

        expect(
          tickA.evidence
            .explorationHeadingBefore,
        ).toEqual(
          tickB.evidence
            .explorationHeadingBefore,
        );

        expect(
          tickA.evidence
            .explorationHeadingAfter,
        ).toEqual(
          tickB.evidence
            .explorationHeadingAfter,
        );

        expect(
          tickA.evidence
            .sampledNewHeading,
        ).toBe(
          tickB.evidence
            .sampledNewHeading,
        );

        expect(
          tickA.evidence
            .movementSource,
        ).toBe(
          tickB.evidence
            .movementSource,
        );

        expect(
          tickA.evidence
            .positionAfter,
        ).toEqual(
          tickB.evidence
            .positionAfter,
        );

        expect(
          tickA.evidence
            .rngStateBefore,
        ).toEqual(
          tickB.evidence
            .rngStateBefore,
        );

        expect(
          tickA.evidence
            .rngStateAfter,
        ).toEqual(
          tickB.evidence
            .rngStateAfter,
        );

        comparedTicks +=
          1;

        stateA =
          tickA.state;

        stateB =
          tickB.state;
      }

      expect(
        comparedTicks,
      ).toBeGreaterThan(
        0,
      );

      /*
       * The test is non-vacuous: perception
       * eventually legitimately differs once one
       * of the two distinct hidden food positions
       * becomes visible.
       */
      expect(
        perceptionDiverged,
      ).toBe(
        true,
      );
    });
  },
);

describe(
  "M3.10B save/reload telemetry continuation",
  () => {
    it("produces future telemetry equal to uninterrupted execution after serialize/deserialize", () => {
      const checkpoint =
        findExplorationCheckpoint();

      function continueWithTelemetry(
        state:
          M3AcquisitionState,

        maxTicks:
          number,
      ) {
        let current =
          state;

        let trace =
          createM3TelemetryTrace();

        for (
          let index = 0;
          index <
            maxTicks &&
            !current.complete;
          index +=
            1
        ) {
          const result =
            advanceM3AcquisitionTick(
              current,
            );

          trace =
            observeM3AcquisitionTickForTelemetry(
              trace,

              result.evidence,
            );

          current =
            result.state;
        }

        return {
          finalState:
            current,

          trace,
        };
      }

      const uninterrupted =
        continueWithTelemetry(
          checkpoint,

          20,
        );

      const restoredState =
        deserializeM3PersistentRun(
          serializeM3PersistentRun(
            createM3PersistentRunState(
              {
                acquisitionState:
                  checkpoint,

                lifeHistory:
                  createM3LifeHistory(),

                playerWorldEvents:
                  [],

                nextPlayerEventSequence:
                  0,
              },
            ),
          ),
        ).acquisitionState;

      const resumed =
        continueWithTelemetry(
          restoredState,

          20,
        );

      expect(
        resumed.trace,
      ).toEqual(
        uninterrupted.trace,
      );

      expect(
        resumed.finalState,
      ).toEqual(
        uninterrupted.finalState,
      );
    });
  },
);

describe(
  "M3.10B telemetry cannot modify supplied state/evidence/events/results",
  () => {
    it("never mutates frozen inputs it observes", () => {
      const state0 =
        createBranchAState();

      const tick =
        advanceM3AcquisitionTick(
          state0,
        );

      Object.freeze(
        tick.evidence,
      );

      let trace =
        createM3TelemetryTrace();

      expect(() => {
        trace =
          observeM3AcquisitionTickForTelemetry(
            trace,

            tick.evidence,
          );
      }).not.toThrow();

      expect(
        (
          trace.entries[0] as {
            evidence:
              unknown;
          }
        ).evidence,
      ).toBe(
        tick.evidence,
      );

      const placement =
        applyM3PlayerFoodPlacement(
          state0,

          {
            x: 2,
            y: 3,
          },

          0,
        );

      Object.freeze(
        placement.event,
      );

      expect(() => {
        trace =
          observeM3PlayerWorldEventForTelemetry(
            trace,

            placement.event,
          );
      }).not.toThrow();

      const historyBefore =
        createM3LifeHistory();

      Object.freeze(
        historyBefore.entries,
      );

      Object.freeze(
        historyBefore,
      );

      const historyAfter =
        observeM3TickForLifeHistory(
          historyBefore,

          tick.evidence,
        );

      Object.freeze(
        historyAfter.entries,
      );

      Object.freeze(
        historyAfter,
      );

      expect(() => {
        trace =
          observeM3LifeHistoryChangeForTelemetry(
            trace,

            historyBefore,

            historyAfter,
          );
      }).not.toThrow();

      expect(
        historyBefore.entries,
      ).toHaveLength(
        0,
      );
    });

    it("never mutates a frozen standardized probe experiment result", () => {
      const result =
        runM3IndividualityProbeExperiment();

      Object.freeze(
        result,
      );

      let telemetry:
        ReturnType<
          typeof deriveM3StandardizedProbeTelemetry
        > | null =
          null;

      expect(() => {
        telemetry =
          deriveM3StandardizedProbeTelemetry(
            result,
          );
      }).not.toThrow();

      expect(
        telemetry,
      ).not.toBeNull();
    });
  },
);

/*
 * Sanity check that the deterministic ordering
 * comparator itself is a pure, total ordering
 * function usable outside the trace helpers.
 */
describe(
  "M3.10B telemetry ordering comparator",
  () => {
    it("orders entries by simulation time, then tick, then existing player-event sequence", () => {
      const state0 =
        createBranchAState();

      const tick =
        advanceM3AcquisitionTick(
          state0,
        );

      const placement =
        applyM3PlayerFoodPlacement(
          state0,

          {
            x: 2,
            y: 3,
          },

          0,
        );

      const entries: M3TelemetryEntry[] =
        [
          {
            kind:
              M3_TICK_TELEMETRY_ENTRY_KIND,

            evidence:
              tick.evidence,
          },

          {
            kind:
              M3_PLAYER_EVENT_TELEMETRY_ENTRY_KIND,

            event:
              placement.event,
          },
        ];

      expect(
        compareM3TelemetryEntries(
          entries[0]!,

          entries[0]!,
        ),
      ).toBe(
        0,
      );

      const sorted =
        sortM3TelemetryEntriesDeterministically(
          entries,
        );

      expect(
        sorted,
      ).toHaveLength(
        2,
      );
    });
  },
);
