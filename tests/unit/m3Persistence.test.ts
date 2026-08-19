import {
  describe,
  expect,
  it,
} from "vitest";

import {
  advanceM3AcquisitionTick,
  createM3AcquisitionState,
  runM3AcquisitionBranch,
  runM3AcquisitionRound,
  type M3AcquisitionState,
  type M3AcquisitionTickEvidence,
} from "../../src/simulation/core/m3Acquisition.js";

import {
  applyM3PlayerFoodPlacement,
  type M3PlayerFoodWorldEvent,
} from "../../src/simulation/core/m3PlayerWorld.js";

import {
  createM3LifeHistory,
  observeM3PlayerWorldEventForLifeHistory,
  observeM3TickForLifeHistory,
  type M3LifeHistory,
} from "../../src/simulation/core/m3LifeHistory.js";

import {
  createM3PersistentRunState,
  deserializeM3PersistentRun,
  M3_PERSISTENCE_KIND,
  M3_PERSISTENCE_SCHEMA_VERSION,
  serializeM3PersistentRun,
  type M3PersistentRunState,
} from "../../src/simulation/core/m3Persistence.js";

import {
  runM3StandardizedProbe,
} from "../../src/simulation/core/m3Probe.js";

import {
  createM3Brain,
} from "../../src/simulation/brain/m3Brain.js";

import {
  M3_EXPLORATION_INITIAL_PRESSURE,
  M3_PRIMARY_BRANCH_A_SEED,
} from "../../src/simulation/core/m3Contract.js";

import {
  M3ApplicationController,
  restoreM3ApplicationController,
  type M3ControllerCallbacks,
  type M3ControllerMode,
  type M3TickScheduler,
} from "../../src/ui/m3Controller.js";

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

function emptyRunConfig(
  acquisitionState:
    M3AcquisitionState,
) {
  return {
    acquisitionState,

    lifeHistory:
      createM3LifeHistory(),

    playerWorldEvents:
      [] as readonly M3PlayerFoodWorldEvent[],

    nextPlayerEventSequence:
      0,
  };
}

interface ContinuationResult {
  readonly finalState:
    M3AcquisitionState;

  readonly evidences:
    readonly M3AcquisitionTickEvidence[];
}

function continueTicks(
  state:
    M3AcquisitionState,

  maxTicks:
    number,
): ContinuationResult {
  let current =
    state;

  const evidences:
    M3AcquisitionTickEvidence[] =
      [];

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

    evidences.push(
      result.evidence,
    );

    current =
      result.state;
  }

  return {
    finalState:
      current,

    evidences,
  };
}

interface ExplorationCheckpoint {
  readonly initialState:
    M3AcquisitionState;

  readonly checkpoint:
    M3AcquisitionState;

  readonly qualifyingEvidence:
    M3AcquisitionTickEvidence;
}

/*
 * Deterministically locate a point in the
 * locked Branch A run where:
 *
 * - EXPLORE has legitimately won;
 * - the tick's movement source is exploration;
 * - an active exploratory heading exists;
 * - the round is not yet complete.
 *
 * The locked M3 contract already establishes
 * that Branch A autonomously discovers and
 * consumes food within its round, so EXPLORE
 * must win before that happens.
 */
function findExplorationCheckpoint():
  ExplorationCheckpoint {
  const initialState =
    createBranchAState();

  let state =
    initialState;

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
      return {
        initialState,
        checkpoint:
          state,

        qualifyingEvidence:
          result.evidence,
      };
    }
  }

  throw new Error(
    "No qualifying exploration checkpoint was found within the locked Branch A round.",
  );
}

function createValidSerializedRun():
  string {
  const { checkpoint } =
    findExplorationCheckpoint();

  return serializeM3PersistentRun(
    createM3PersistentRunState(
      emptyRunConfig(
        checkpoint,
      ),
    ),
  );
}

class NoopM3TickScheduler
implements M3TickScheduler {
  public startCount =
    0;

  public stopCount =
    0;

  public start(): number {
    this.startCount +=
      1;

    return 1;
  }

  public stop(): void {
    this.stopCount +=
      1;
  }
}

interface ControllerSpies {
  readonly scheduler:
    NoopM3TickScheduler;

  readonly callbacks:
    M3ControllerCallbacks;

  readonly transitions:
    unknown[];

  readonly placements:
    Array<{
      readonly event:
        M3PlayerFoodWorldEvent;
    }>;

  readonly resets:
    unknown[];

  readonly modeChanges:
    M3ControllerMode[];
}

function createControllerSpies():
  ControllerSpies {
  const transitions:
    unknown[] =
      [];

  const placements:
    Array<{
      readonly event:
        M3PlayerFoodWorldEvent;
    }> =
      [];

  const resets:
    unknown[] =
      [];

  const modeChanges:
    M3ControllerMode[] =
      [];

  return {
    scheduler:
      new NoopM3TickScheduler(),

    transitions,
    placements,
    resets,
    modeChanges,

    callbacks: {
      onStateTransition: (
        _previous,
        _current,
        evidence,
      ) => {
        transitions.push(
          evidence,
        );
      },

      onPlayerFoodPlacement: (
        _previous,
        _current,
        event,
      ) => {
        placements.push(
          {
            event,
          },
        );
      },

      onStateReset: (
        current,
      ) => {
        resets.push(
          current,
        );
      },

      onModeChange: (
        mode,
      ) => {
        modeChanges.push(
          mode,
        );
      },
    },
  };
}

describe(
  "M3.10A deterministic run persistence",
  () => {
    describe(
      "round trip and schema validation",
      () => {
        it("round-trips a persistent run through serialization deterministically", () => {
          const { checkpoint } =
            findExplorationCheckpoint();

          const run =
            createM3PersistentRunState(
              emptyRunConfig(
                checkpoint,
              ),
            );

          const first =
            serializeM3PersistentRun(
              run,
            );

          const second =
            serializeM3PersistentRun(
              run,
            );

          expect(
            second,
          ).toBe(
            first,
          );

          const restored =
            deserializeM3PersistentRun(
              first,
            );

          expect(
            restored,
          ).toEqual(
            run,
          );

          expect(
            restored.schemaVersion,
          ).toBe(
            M3_PERSISTENCE_SCHEMA_VERSION,
          );

          expect(
            restored.kind,
          ).toBe(
            M3_PERSISTENCE_KIND,
          );
        });

        it("rejects an unsupported persistence schema version", () => {
          const parsed =
            JSON.parse(
              createValidSerializedRun(),
            ) as Record<
              string,
              unknown
            >;

          parsed.schemaVersion =
            999;

          expect(() =>
            deserializeM3PersistentRun(
              JSON.stringify(
                parsed,
              ),
            ),
          ).toThrow();
        });

        it("rejects an invalid persistence kind", () => {
          const parsed =
            JSON.parse(
              createValidSerializedRun(),
            ) as Record<
              string,
              unknown
            >;

          parsed.kind =
            "something-else";

          expect(() =>
            deserializeM3PersistentRun(
              JSON.stringify(
                parsed,
              ),
            ),
          ).toThrow();
        });

        it("rejects malformed JSON outright", () => {
          expect(() =>
            deserializeM3PersistentRun(
              "{not valid json",
            ),
          ).toThrow();
        });

        it.each(
          [
            [
              "wrong acquisition schema version",
              (
                state:
                  Record<
                    string,
                    unknown
                  >,
              ) => {
                state.schemaVersion =
                  42;
              },
            ],

            [
              "invalid tick index",
              (
                state:
                  Record<
                    string,
                    unknown
                  >,
              ) => {
                state.tickIndex =
                  -1;
              },
            ],

            [
              "non-finite simulation time",
              (
                state:
                  Record<
                    string,
                    unknown
                  >,
              ) => {
                state.simulationTimeSeconds =
                  Number
                    .NaN;
              },
            ],

            [
              "invalid position",
              (
                state:
                  Record<
                    string,
                    unknown
                  >,
              ) => {
                state.position =
                  {
                    x:
                      "not-a-number",

                    y:
                      0,
                  };
              },
            ],

            [
              "invalid hunger",
              (
                state:
                  Record<
                    string,
                    unknown
                  >,
              ) => {
                state.hunger =
                  {
                    energy:
                      5,

                    maxEnergy:
                      1,
                  };
              },
            ],

            [
              "missing brain",
              (
                state:
                  Record<
                    string,
                    unknown
                  >,
              ) => {
                delete state.brain;
              },
            ],

            [
              "malformed eligibility state",
              (
                state:
                  Record<
                    string,
                    unknown
                  >,
              ) => {
                state.eligibilityTrace =
                  [
                    {
                      connectionId:
                        7,

                      eligibility:
                        "bad",
                    },
                  ];
              },
            ],

            [
              "malformed RNG state",
              (
                state:
                  Record<
                    string,
                    unknown
                  >,
              ) => {
                state.rngState =
                  {
                    algorithm:
                      "not-xorshift32",

                    state:
                      1,
                  };
              },
            ],

            [
              "RNG state provided as a bare number",
              (
                state:
                  Record<
                    string,
                    unknown
                  >,
              ) => {
                state.rngState =
                  12345;
              },
            ],

            [
              "malformed exploration state",
              (
                state:
                  Record<
                    string,
                    unknown
                  >,
              ) => {
                state.explorationState =
                  {
                    schemaVersion:
                      1,

                    kind:
                      "exploration",

                    pressure:
                      99,

                    activeHeading:
                      null,
                  };
              },
            ],

            [
              "malformed food/resource state",
              (
                state:
                  Record<
                    string,
                    unknown
                  >,
              ) => {
                state.food =
                  {
                    id:
                      "",

                    kind:
                      "food",

                    position: {
                      x: 0,
                      y: 0,
                    },

                    energyValue:
                      -1,

                    consumed:
                      false,
                  };
              },
            ],
          ] as const,
        )(
          "rejects malformed acquisition state: %s",
          (
            _label,
            corrupt,
          ) => {
            const parsed =
              JSON.parse(
                createValidSerializedRun(),
              ) as Record<
                string,
                unknown
              >;

            corrupt(
              parsed.acquisitionState as Record<
                string,
                unknown
              >,
            );

            expect(() =>
              deserializeM3PersistentRun(
                JSON.stringify(
                  parsed,
                ),
              ),
            ).toThrow();
          },
        );

        it("rejects malformed life history", () => {
          const parsed =
            JSON.parse(
              createValidSerializedRun(),
            ) as Record<
              string,
              unknown
            >;

          parsed.lifeHistory =
            {
              schemaVersion:
                1,

              entries:
                "not-an-array",

              pendingPlayerFoodEvent:
                null,
            };

          expect(() =>
            deserializeM3PersistentRun(
              JSON.stringify(
                parsed,
              ),
            ),
          ).toThrow();
        });

        it("rejects a malformed external player-world event", () => {
          const parsed =
            JSON.parse(
              createValidSerializedRun(),
            ) as Record<
              string,
              unknown
            >;

          parsed.playerWorldEvents =
            [
              {
                schemaVersion:
                  1,

                kind:
                  "not-the-right-kind",
              },
            ];

          parsed.nextPlayerEventSequence =
            1;

          expect(() =>
            deserializeM3PersistentRun(
              JSON.stringify(
                parsed,
              ),
            ),
          ).toThrow();
        });

        it("rejects an external event history with a non-contiguous sequence", () => {
          const state =
            createBranchAState();

          const first =
            applyM3PlayerFoodPlacement(
              state,

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

              /*
               * Skips sequence 1, which must be
               * rejected as a malformed external
               * event history.
               */
              2,
            );

          expect(() =>
            createM3PersistentRunState(
              {
                acquisitionState:
                  second.state,

                lifeHistory:
                  createM3LifeHistory(),

                playerWorldEvents:
                  [
                    first.event,
                    second.event,
                  ],

                nextPlayerEventSequence:
                  3,
              },
            ),
          ).toThrow();
        });

        it("rejects a nextPlayerEventSequence that does not match the recorded event history", () => {
          const state =
            createBranchAState();

          const placement =
            applyM3PlayerFoodPlacement(
              state,

              {
                x: 2,
                y: 3,
              },

              0,
            );

          expect(() =>
            createM3PersistentRunState(
              {
                acquisitionState:
                  placement.state,

                lifeHistory:
                  createM3LifeHistory(),

                playerWorldEvents:
                  [
                    placement.event,
                  ],

                /*
                 * A wall-clock-derived or
                 * otherwise arbitrary sequence
                 * value must be rejected rather
                 * than silently accepted.
                 */
                nextPlayerEventSequence:
                  4711,
              },
            ),
          ).toThrow();
        });
      },
    );

    describe(
      "save during active autonomous exploration",
      () => {
        it("locates a checkpoint with an evolved pressure, an active heading and already-consumed RNG", () => {
          const {
            initialState,
            checkpoint,
            qualifyingEvidence,
          } =
            findExplorationCheckpoint();

          expect(
            checkpoint.complete,
          ).toBe(
            false,
          );

          expect(
            checkpoint
              .explorationState
              .activeHeading,
          ).not.toBeNull();

          expect(
            checkpoint
              .explorationState
              .pressure,
          ).not.toBe(
            M3_EXPLORATION_INITIAL_PRESSURE,
          );

          /*
           * RNG has already been consumed
           * relative to the freshly created
           * branch state.
           */
          expect(
            checkpoint.rngState,
          ).not.toEqual(
            initialState.rngState,
          );

          /*
           * The qualifying tick itself consumed
           * RNG to sample the currently active
           * heading.
           */
          expect(
            qualifyingEvidence
              .rngStateAfter,
          ).not.toEqual(
            qualifyingEvidence
              .rngStateBefore,
          );
        });

        it("continues identically to uninterrupted execution after serialize/deserialize", () => {
          const { checkpoint } =
            findExplorationCheckpoint();

          const uninterrupted =
            continueTicks(
              checkpoint,

              20,
            );

          const run =
            createM3PersistentRunState(
              emptyRunConfig(
                checkpoint,
              ),
            );

          const restoredRun =
            deserializeM3PersistentRun(
              serializeM3PersistentRun(
                run,
              ),
            );

          const restoredState =
            restoredRun.acquisitionState;

          /*
           * Reload must not consume RNG or alter
           * exploration state before any further
           * tick occurs.
           */
          expect(
            restoredState.rngState,
          ).toEqual(
            checkpoint.rngState,
          );

          expect(
            restoredState
              .explorationState,
          ).toEqual(
            checkpoint
              .explorationState,
          );

          const resumed =
            continueTicks(
              restoredState,

              20,
            );

          expect(
            resumed.evidences,
          ).toEqual(
            uninterrupted.evidences,
          );

          expect(
            resumed.finalState,
          ).toEqual(
            uninterrupted.finalState,
          );

          /*
           * The resumed run must eventually
           * complete, exactly like the
           * uninterrupted run, proving this is a
           * genuine continued execution rather
           * than a stalled/duplicated one.
           */
          expect(
            uninterrupted.finalState
              .complete,
          ).toBe(
            true,
          );

          expect(
            resumed.finalState
              .complete,
          ).toBe(
            true,
          );
        });

        it("does not resample an unexpired active heading merely because of reload", () => {
          const { checkpoint } =
            findExplorationCheckpoint();

          const headingBefore =
            checkpoint
              .explorationState
              .activeHeading;

          expect(
            headingBefore,
          ).not.toBeNull();

          const restoredState =
            deserializeM3PersistentRun(
              serializeM3PersistentRun(
                createM3PersistentRunState(
                  emptyRunConfig(
                    checkpoint,
                  ),
                ),
              ),
            ).acquisitionState;

          expect(
            restoredState
              .explorationState
              .activeHeading,
          ).toEqual(
            headingBefore,
          );

          /*
           * If the next tick still legitimately
           * selects EXPLORE while the restored
           * heading remains unexpired, it must be
           * reused rather than resampled, exactly
           * as the uninterrupted branch would.
           */
          const uninterruptedNext =
            advanceM3AcquisitionTick(
              checkpoint,
            );

          const restoredNext =
            advanceM3AcquisitionTick(
              restoredState,
            );

          expect(
            restoredNext.evidence,
          ).toEqual(
            uninterruptedNext.evidence,
          );

          if (
            uninterruptedNext.evidence
              .selectedActionId ===
              "explore" &&
            headingBefore !==
              null &&
            checkpoint
              .simulationTimeSeconds <
              headingBefore.expiresAtSimulationTimeSeconds
          ) {
            expect(
              restoredNext.evidence
                .rngStateBefore,
            ).toEqual(
              restoredNext.evidence
                .rngStateAfter,
            );
          }
        });

        it("exploration pressure continues evolving rather than restarting at the initial value", () => {
          const { checkpoint } =
            findExplorationCheckpoint();

          const restoredState =
            deserializeM3PersistentRun(
              serializeM3PersistentRun(
                createM3PersistentRunState(
                  emptyRunConfig(
                    checkpoint,
                  ),
                ),
              ),
            ).acquisitionState;

          expect(
            restoredState
              .explorationState
              .pressure,
          ).toBe(
            checkpoint
              .explorationState
              .pressure,
          );

          expect(
            restoredState
              .explorationState
              .pressure,
          ).not.toBe(
            M3_EXPLORATION_INITIAL_PRESSURE,
          );
        });
      },
    );

    describe(
      "learned neural state persistence",
      () => {
        it("preserves non-default learned brain weights bit-for-bit and reproduces the same standardized probe outcome", () => {
          const branch =
            runM3AcquisitionBranch(
              {
                seed:
                  M3_PRIMARY_BRANCH_A_SEED,

                learningEnabled:
                  true,

                explorationEnabled:
                  true,
              },
            );

          const freshBrain =
            createM3Brain();

          const learnedWeightChanged =
            branch.finalBrain
              .connections.some(
              (connection, index) =>
                connection.weight !==
                freshBrain
                  .connections[
                  index
                ]?.weight,
            );

          expect(
            learnedWeightChanged,
          ).toBe(
            true,
          );

          const stateWithLearnedBrain =
            createM3AcquisitionState(
              {
                seed:
                  M3_PRIMARY_BRANCH_A_SEED,

                learningEnabled:
                  true,

                explorationEnabled:
                  true,

                brain:
                  branch.finalBrain,
              },
            );

          const probeBeforeSave =
            runM3StandardizedProbe(
              "before-save",

              stateWithLearnedBrain.brain,
            );

          const restored =
            deserializeM3PersistentRun(
              serializeM3PersistentRun(
                createM3PersistentRunState(
                  emptyRunConfig(
                    stateWithLearnedBrain,
                  ),
                ),
              ),
            ).acquisitionState;

          expect(
            restored.brain,
          ).toEqual(
            branch.finalBrain,
          );

          expect(
            restored.brain
              .connections.map(
              (connection) =>
                connection.id,
            ),
          ).toEqual(
            branch.finalBrain
              .connections.map(
              (connection) =>
                connection.id,
            ),
          );

          const probeAfterRestore =
            runM3StandardizedProbe(
              "after-restore",

              restored.brain,
            );

          expect(
            probeAfterRestore
              .connectionWeights,
          ).toEqual(
            probeBeforeSave
              .connectionWeights,
          );

          expect(
            probeAfterRestore
              .selectedActionId,
          ).toBe(
            probeBeforeSave
              .selectedActionId,
          );

          expect(
            probeAfterRestore
              .seekActivation,
          ).toBe(
            probeBeforeSave
              .seekActivation,
          );

          expect(
            probeAfterRestore
              .positionAfter,
          ).toEqual(
            probeBeforeSave
              .positionAfter,
          );
        });

        it("preserves non-empty eligibility state exactly", () => {
          const { checkpoint } =
            findExplorationCheckpoint();

          /*
           * A tick immediately after a
           * successfully selected action always
           * leaves at least a decayed eligibility
           * entry once any prior tick contributed
           * one; assert against a later checkpoint
           * with genuine eligibility contribution.
           */
          const withEligibility =
            continueTicks(
              checkpoint,

              1,
            ).finalState;

          const restored =
            deserializeM3PersistentRun(
              serializeM3PersistentRun(
                createM3PersistentRunState(
                  emptyRunConfig(
                    withEligibility,
                  ),
                ),
              ),
            ).acquisitionState;

          expect(
            restored.eligibilityTrace,
          ).toEqual(
            withEligibility.eligibilityTrace,
          );
        });
      },
    );

    describe(
      "world/resource state persistence",
      () => {
        it("preserves player-relocated food state exactly", () => {
          const state =
            createBranchAState();

          const placement =
            applyM3PlayerFoodPlacement(
              state,

              {
                x: 2,
                y: 3,
              },

              0,
            );

          const restored =
            deserializeM3PersistentRun(
              serializeM3PersistentRun(
                createM3PersistentRunState(
                  {
                    acquisitionState:
                      placement.state,

                    lifeHistory:
                      createM3LifeHistory(),

                    playerWorldEvents:
                      [
                        placement.event,
                      ],

                    nextPlayerEventSequence:
                      1,
                  },
                ),
              ),
            ).acquisitionState;

          expect(
            restored.food,
          ).toEqual(
            placement.state.food,
          );

          expect(
            restored.sensoryOccluder,
          ).toEqual(
            placement.state
              .sensoryOccluder,
          );
        });
      },
    );

    describe(
      "life history persistence",
      () => {
        it("preserves recorded life-history entries exactly", () => {
          const {
            checkpoint,
            qualifyingEvidence,
          } =
            findExplorationCheckpoint();

          /*
           * The qualifying tick that produced
           * this checkpoint already satisfies
           * "first autonomous exploration":
           * EXPLORE won and the movement source
           * was exploration.
           */
          const history =
            observeM3TickForLifeHistory(
              createM3LifeHistory(),

              qualifyingEvidence,
            );

          expect(
            history.entries.length,
          ).toBeGreaterThan(
            0,
          );

          const restored =
            deserializeM3PersistentRun(
              serializeM3PersistentRun(
                createM3PersistentRunState(
                  {
                    acquisitionState:
                      checkpoint,

                    lifeHistory:
                      history,

                    playerWorldEvents:
                      [],

                    nextPlayerEventSequence:
                      0,
                  },
                ),
              ),
            ).lifeHistory;

          expect(
            restored,
          ).toEqual(
            history,
          );
        });

        it("preserves pendingPlayerFoodEvent across save/reload and clears it only once ordinary perception legitimately confirms it", () => {
          const state =
            createBranchAState();

          const placement =
            applyM3PlayerFoodPlacement(
              state,

              /*
               * On the Creature's side of the
               * real occluder and inside
               * perception range.
               */
              {
                x: 0.6,
                y: 0,
              },

              0,
            );

          const historyWithPending =
            observeM3PlayerWorldEventForLifeHistory(
              createM3LifeHistory(),

              placement.event,
            );

          expect(
            historyWithPending
              .pendingPlayerFoodEvent,
          ).not.toBeNull();

          const run =
            createM3PersistentRunState(
              {
                acquisitionState:
                  placement.state,

                lifeHistory:
                  historyWithPending,

                playerWorldEvents:
                  [
                    placement.event,
                  ],

                nextPlayerEventSequence:
                  1,
              },
            );

          const restored =
            deserializeM3PersistentRun(
              serializeM3PersistentRun(
                run,
              ),
            );

          /*
           * The pending bookkeeping survives
           * reload exactly, and restoring it does
           * not notify cognition: the restored
           * acquisition state is unchanged from
           * the saved authoritative state.
           */
          expect(
            restored.lifeHistory
              .pendingPlayerFoodEvent,
          ).toEqual(
            historyWithPending
              .pendingPlayerFoodEvent,
          );

          expect(
            restored.acquisitionState,
          ).toEqual(
            placement.state,
          );

          const tick =
            advanceM3AcquisitionTick(
              restored.acquisitionState,
            );

          expect(
            tick.evidence
              .directFoodPerceptionBefore,
          ).not.toBeNull();

          const historyAfterTick =
            observeM3TickForLifeHistory(
              restored.lifeHistory,

              tick.evidence,
            );

          expect(
            historyAfterTick.entries.some(
              (entry) =>
                entry.eventType ===
                "first-player-positioned-food-perception",
            ),
          ).toBe(
            true,
          );

          expect(
            historyAfterTick
              .pendingPlayerFoodEvent,
          ).toBeNull();
        });
      },
    );

    describe(
      "external player-world event persistence",
      () => {
        it("preserves ordered player-world events and continues the next placement using the restored sequence", () => {
          const state =
            createBranchAState();

          const first =
            applyM3PlayerFoodPlacement(
              state,

              {
                x: 2,
                y: 3,
              },

              0,
            );

          let history =
            observeM3PlayerWorldEventForLifeHistory(
              createM3LifeHistory(),

              first.event,
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

          history =
            observeM3PlayerWorldEventForLifeHistory(
              history,

              second.event,
            );

          const run =
            createM3PersistentRunState(
              {
                acquisitionState:
                  second.state,

                lifeHistory:
                  history,

                playerWorldEvents:
                  [
                    first.event,
                    second.event,
                  ],

                nextPlayerEventSequence:
                  2,
              },
            );

          const restored =
            deserializeM3PersistentRun(
              serializeM3PersistentRun(
                run,
              ),
            );

          expect(
            restored.playerWorldEvents,
          ).toEqual(
            [
              first.event,
              second.event,
            ],
          );

          expect(
            restored
              .nextPlayerEventSequence,
          ).toBe(
            2,
          );

          const third =
            applyM3PlayerFoodPlacement(
              restored.acquisitionState,

              {
                x: 4,
                y: 5,
              },

              restored
                .nextPlayerEventSequence,
            );

          expect(
            third.event.sequence,
          ).toBe(
            2,
          );

          /*
           * Ordinary sensory/cognitive ticks
           * continue normally, and no direct
           * cognition notification occurred
           * because of restore or placement:
           * brain, eligibility, exploration and
           * RNG remain exactly what was saved.
           */
          expect(
            third.state.brain,
          ).toBe(
            restored.acquisitionState.brain,
          );

          expect(
            third.state.eligibilityTrace,
          ).toBe(
            restored.acquisitionState
              .eligibilityTrace,
          );

          expect(
            third.state.explorationState,
          ).toBe(
            restored.acquisitionState
              .explorationState,
          );

          expect(
            third.state.rngState,
          ).toBe(
            restored.acquisitionState
              .rngState,
          );

          expect(() =>
            advanceM3AcquisitionTick(
              third.state,
            ),
          ).not.toThrow();
        });
      },
    );

    describe(
      "controller restore boundary",
      () => {
        it("restores paused with zero ticks, zero RNG consumption and no emitted player event", () => {
          const state =
            createBranchAState();

          const placement =
            applyM3PlayerFoodPlacement(
              state,

              {
                x: 2,
                y: 3,
              },

              0,
            );

          const run =
            createM3PersistentRunState(
              {
                acquisitionState:
                  placement.state,

                lifeHistory:
                  createM3LifeHistory(),

                playerWorldEvents:
                  [
                    placement.event,
                  ],

                nextPlayerEventSequence:
                  1,
              },
            );

          const restoredRun =
            deserializeM3PersistentRun(
              serializeM3PersistentRun(
                run,
              ),
            );

          const spies =
            createControllerSpies();

          const controller =
            restoreM3ApplicationController(
              restoredRun,

              spies.scheduler,

              spies.callbacks,
            );

          expect(
            controller.getState(),
          ).toEqual(
            restoredRun.acquisitionState,
          );

          expect(
            controller.getMode(),
          ).toBe(
            "paused",
          );

          expect(
            controller
              .getNextEventSequence(),
          ).toBe(
            1,
          );

          expect(
            spies.transitions,
          ).toHaveLength(
            0,
          );

          expect(
            spies.placements,
          ).toHaveLength(
            0,
          );

          expect(
            spies.scheduler
              .startCount,
          ).toBe(
            0,
          );

          controller.placeFood(
            {
              x: 5,
              y: 5,
            },
          );

          expect(
            spies.placements[0]
              ?.event.sequence,
          ).toBe(
            1,
          );

          expect(
            controller
              .getNextEventSequence(),
          ).toBe(
            2,
          );
        });

        it("restores a complete run as complete rather than running", () => {
          const completed =
            runM3AcquisitionRound(
              {
                seed:
                  M3_PRIMARY_BRANCH_A_SEED,

                learningEnabled:
                  true,

                explorationEnabled:
                  true,
              },
            ).finalState;

          expect(
            completed.complete,
          ).toBe(
            true,
          );

          const restoredRun =
            deserializeM3PersistentRun(
              serializeM3PersistentRun(
                createM3PersistentRunState(
                  emptyRunConfig(
                    completed,
                  ),
                ),
              ),
            );

          const spies =
            createControllerSpies();

          const controller =
            restoreM3ApplicationController(
              restoredRun,

              spies.scheduler,

              spies.callbacks,
            );

          expect(
            controller.getMode(),
          ).toBe(
            "complete",
          );

          expect(
            spies.transitions,
          ).toHaveLength(
            0,
          );
        });
      },
    );

    describe(
      "deterministic replay",
      () => {
        it("produces identical continuations from two independent restores of the same serialized run", () => {
          const { checkpoint } =
            findExplorationCheckpoint();

          const serialized =
            serializeM3PersistentRun(
              createM3PersistentRunState(
                emptyRunConfig(
                  checkpoint,
                ),
              ),
            );

          const firstRestore =
            continueTicks(
              deserializeM3PersistentRun(
                serialized,
              ).acquisitionState,

              15,
            );

          const secondRestore =
            continueTicks(
              deserializeM3PersistentRun(
                serialized,
              ).acquisitionState,

              15,
            );

          expect(
            secondRestore.evidences,
          ).toEqual(
            firstRestore.evidences,
          );

          expect(
            secondRestore.finalState,
          ).toEqual(
            firstRestore.finalState,
          );
        });
      },
    );
  },
);
