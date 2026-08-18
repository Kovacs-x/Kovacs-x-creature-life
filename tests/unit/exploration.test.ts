import {
  describe,
  expect,
  it,
} from "vitest";

import {
  SeededRng,
} from "../../src/simulation/core/rng.js";

import {
  advanceExplorationPressure,
  createExplorationState,
  deserializeExplorationState,
  ensureExploratoryHeading,
  serializeExplorationState,
  type ExplorationPressureConfig,
} from "../../src/simulation/drives/exploration.js";

const TEST_CONFIG:
  ExplorationPressureConfig = {
    minPressure: 0,
    maxPressure: 1,

    accumulationPerSecond:
      0.1,

    reductionPerSecondWhileExploring:
      0.25,
  };

describe(
  "M3 exploration primitives",
  () => {
    it(
      "creates explicit bounded exploration state",
      () => {
        const state =
          createExplorationState(
            0.2,
            TEST_CONFIG,
          );

        expect(
          state,
        ).toEqual({
          schemaVersion: 1,
          kind: "exploration",
          pressure: 0.2,
          activeHeading: null,
        });
      },
    );

    it(
      "accumulates pressure through explicit simulation time when not exploring",
      () => {
        const initial =
          createExplorationState(
            0.2,
            TEST_CONFIG,
          );

        const result =
          advanceExplorationPressure(
            initial,
            3,
            false,
            TEST_CONFIG,
          );

        expect(
          result.pressure,
        ).toBeCloseTo(
          0.5,
        );
      },
    );

    it(
      "reduces pressure through explicit simulation time while exploring",
      () => {
        const initial =
          createExplorationState(
            0.5,
            TEST_CONFIG,
          );

        const result =
          advanceExplorationPressure(
            initial,
            1,
            true,
            TEST_CONFIG,
          );

        expect(
          result.pressure,
        ).toBeCloseTo(
          0.25,
        );
      },
    );

    it(
      "keeps exploration pressure inside configured bounds",
      () => {
        const nearMaximum =
          createExplorationState(
            0.95,
            TEST_CONFIG,
          );

        const maximum =
          advanceExplorationPressure(
            nearMaximum,
            10,
            false,
            TEST_CONFIG,
          );

        expect(
          maximum.pressure,
        ).toBe(1);

        const nearMinimum =
          createExplorationState(
            0.1,
            TEST_CONFIG,
          );

        const minimum =
          advanceExplorationPressure(
            nearMinimum,
            10,
            true,
            TEST_CONFIG,
          );

        expect(
          minimum.pressure,
        ).toBe(0);
      },
    );

    it(
      "produces equivalent pressure for equivalent elapsed simulation time",
      () => {
        const initial =
          createExplorationState(
            0.2,
            TEST_CONFIG,
          );

        const oneStep =
          advanceExplorationPressure(
            initial,
            3,
            false,
            TEST_CONFIG,
          );

        const firstStep =
          advanceExplorationPressure(
            initial,
            1,
            false,
            TEST_CONFIG,
          );

        const splitSteps =
          advanceExplorationPressure(
            firstStep,
            2,
            false,
            TEST_CONFIG,
          );

        expect(
          splitSteps.pressure,
        ).toBeCloseTo(
          oneStep.pressure,
        );
      },
    );

    it(
      "does not change exploration pressure when no simulation time passes",
      () => {
        const initial =
          createExplorationState(
            0.4,
            TEST_CONFIG,
          );

        const result =
          advanceExplorationPressure(
            initial,
            0,
            false,
            TEST_CONFIG,
          );

        expect(
          result,
        ).toBe(
          initial,
        );
      },
    );

    it(
      "generates the same exploratory heading from the same seed",
      () => {
        const firstRng =
          new SeededRng(
            12345,
          );

        const secondRng =
          new SeededRng(
            12345,
          );

        const firstInitial =
          createExplorationState(
            0.5,
            TEST_CONFIG,
          );

        const secondInitial =
          createExplorationState(
            0.5,
            TEST_CONFIG,
          );

        const first =
          ensureExploratoryHeading(
            firstInitial,
            firstRng,
            5,
            3,
          );

        const second =
          ensureExploratoryHeading(
            secondInitial,
            secondRng,
            5,
            3,
          );

        expect(
          second,
        ).toEqual(
          first,
        );

        expect(
          secondRng.state,
        ).toEqual(
          firstRng.state,
        );

        expect(
          Math.hypot(
            first
              .activeHeading!
              .directionX,

            first
              .activeHeading!
              .directionY,
          ),
        ).toBeCloseTo(
          1,
        );
      },
    );

    it(
      "reuses an unexpired exploratory heading without consuming RNG",
      () => {
        const rng =
          new SeededRng(
            24680,
          );

        const initial =
          createExplorationState(
            0.5,
            TEST_CONFIG,
          );

        const sampled =
          ensureExploratoryHeading(
            initial,
            rng,
            0,
            3,
          );

        const rngStateAfterSample =
          rng.state;

        const reused =
          ensureExploratoryHeading(
            sampled,
            rng,
            2,
            3,
          );

        expect(
          reused,
        ).toBe(
          sampled,
        );

        expect(
          rng.state,
        ).toEqual(
          rngStateAfterSample,
        );
      },
    );

    it(
      "samples a new heading when the previous heading expires",
      () => {
        const rng =
          new SeededRng(
            13579,
          );

        const initial =
          createExplorationState(
            0.5,
            TEST_CONFIG,
          );

        const first =
          ensureExploratoryHeading(
            initial,
            rng,
            0,
            3,
          );

        const firstRngState =
          rng.state;

        const second =
          ensureExploratoryHeading(
            first,
            rng,
            3,
            3,
          );

        expect(
          second.activeHeading,
        ).not.toEqual(
          first.activeHeading,
        );

        expect(
          rng.state,
        ).not.toEqual(
          firstRngState,
        );

        expect(
          second
            .activeHeading!
            .sampledAtSimulationTimeSeconds,
        ).toBe(3);

        expect(
          second
            .activeHeading!
            .expiresAtSimulationTimeSeconds,
        ).toBe(6);
      },
    );

    it(
      "round-trips exploration state through serialization",
      () => {
        const rng =
          new SeededRng(
            98765,
          );

        const initial =
          createExplorationState(
            0.4,
            TEST_CONFIG,
          );

        const withHeading =
          ensureExploratoryHeading(
            initial,
            rng,
            10,
            4,
          );

        const serialized =
          serializeExplorationState(
            withHeading,
          );

        const restored =
          deserializeExplorationState(
            serialized,
          );

        expect(
          restored,
        ).toEqual(
          withHeading,
        );
      },
    );

    it(
      "continues exploratory RNG and heading state identically after save and reload",
      () => {
        const uninterruptedRng =
          new SeededRng(
            777,
          );

        const initial =
          createExplorationState(
            0.5,
            TEST_CONFIG,
          );

        const beforeSave =
          ensureExploratoryHeading(
            initial,
            uninterruptedRng,
            1,
            2,
          );

        const serializedState =
          serializeExplorationState(
            beforeSave,
          );

        const savedRngState =
          JSON.parse(
            JSON.stringify(
              uninterruptedRng.state,
            ),
          ) as typeof uninterruptedRng.state;

        const uninterrupted =
          ensureExploratoryHeading(
            beforeSave,
            uninterruptedRng,
            3,
            2,
          );

        const resumedState =
          deserializeExplorationState(
            serializedState,
          );

        const resumedRng =
          new SeededRng(
            savedRngState,
          );

        const resumed =
          ensureExploratoryHeading(
            resumedState,
            resumedRng,
            3,
            2,
          );

        expect(
          resumed,
        ).toEqual(
          uninterrupted,
        );

        expect(
          resumedRng.state,
        ).toEqual(
          uninterruptedRng.state,
        );
      },
    );

    it(
      "replays the complete primitive trace exactly from the same seed and timing",
      () => {
        const run =
          () => {
            const rng =
              new SeededRng(
                424242,
              );

            let state =
              createExplorationState(
                0.5,
                TEST_CONFIG,
              );

            const trace:
              Array<{
                readonly state:
                  typeof state;

                readonly rngState:
                  typeof rng.state;
              }> = [];

            const steps = [
              {
                deltaSeconds: 1,
                simulationTimeSeconds: 1,
                isExploring: false,
                requestHeading: false,
              },
              {
                deltaSeconds: 1,
                simulationTimeSeconds: 2,
                isExploring: true,
                requestHeading: true,
              },
              {
                deltaSeconds: 1,
                simulationTimeSeconds: 3,
                isExploring: true,
                requestHeading: true,
              },
              {
                deltaSeconds: 1,
                simulationTimeSeconds: 4,
                isExploring: false,
                requestHeading: false,
              },
              {
                deltaSeconds: 1,
                simulationTimeSeconds: 5,
                isExploring: true,
                requestHeading: true,
              },
            ] as const;

            for (
              const step of
              steps
            ) {
              state =
                advanceExplorationPressure(
                  state,
                  step.deltaSeconds,
                  step.isExploring,
                  TEST_CONFIG,
                );

              if (
                step.requestHeading
              ) {
                state =
                  ensureExploratoryHeading(
                    state,
                    rng,
                    step
                      .simulationTimeSeconds,
                    2,
                  );
              }

              trace.push({
                state,

                rngState:
                  rng.state,
              });
            }

            return trace;
          };

        expect(
          run(),
        ).toEqual(
          run(),
        );
      },
    );

    it(
      "rejects malformed or invalid exploration state",
      () => {
        expect(() =>
          deserializeExplorationState(
            "not json",
          ),
        ).toThrow();

        expect(() =>
          deserializeExplorationState(
            JSON.stringify({
              schemaVersion: 1,
              kind: "exploration",
              pressure: 2,
              activeHeading: null,
            }),
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          createExplorationState(
            -0.1,
            TEST_CONFIG,
          ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      "rejects invalid simulation timing and pressure configuration",
      () => {
        const state =
          createExplorationState(
            0.5,
            TEST_CONFIG,
          );

        expect(() =>
          advanceExplorationPressure(
            state,
            -1,
            false,
            TEST_CONFIG,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          createExplorationState(
            0.5,
            {
              ...TEST_CONFIG,

              minPressure: 0.8,
              maxPressure: 0.2,
            },
          ),
        ).toThrow(
          RangeError,
        );

        const rng =
          new SeededRng(
            123,
          );

        expect(() =>
          ensureExploratoryHeading(
            state,
            rng,
            -1,
            2,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          ensureExploratoryHeading(
            state,
            rng,
            1,
            0,
          ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);