import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  RandomSource,
  SeededRngState,
} from "../../src/simulation/core/rng.js";

import {
  SeededRng,
} from "../../src/simulation/core/rng.js";

import {
  createExplorationState,
} from "../../src/simulation/drives/exploration.js";

import {
  createM3Brain,
  evaluateM3Brain,
} from "../../src/simulation/brain/m3Brain.js";

import {
  createHungerState,
} from "../../src/simulation/biology/hunger.js";

import {
  senseHunger,
} from "../../src/simulation/senses/hungerSense.js";

import {
  createFoodObject,
} from "../../src/world/food.js";

import {
  executeM3ExploratoryMovement,
  M3_EXPLORATION_MOVEMENT_SOURCE,
} from "../../src/simulation/actions/explorationMovement.js";

import {
  M3_ACQUISITION_CREATURE_START,
  M3_EXPLORATION_INITIAL_PRESSURE,
  M3_EXPLORATION_PRESSURE_CONFIG,
  M3_EXPLORATORY_HEADING_PERSISTENCE_SECONDS,
  M3_HABITAT_BOUNDS,
  M3_HIDDEN_TARGET_ALTERNATE_FOOD,
  M3_PRIMARY_BRANCH_A_SEED,
} from "../../src/simulation/core/m3Contract.js";

class FixedRandomSource
implements RandomSource {
  private index =
    0;

  public constructor(
    private readonly values:
      readonly number[],
  ) {}

  public get state():
    SeededRngState {
    return {
      algorithm:
        "xorshift32",

      state:
        this.index +
        1,
    };
  }

  public nextFloat():
    number {
    const value =
      this.values[
        this.index
      ];

    if (
      value === undefined
    ) {
      throw new Error(
        "FixedRandomSource has no remaining values.",
      );
    }

    this.index +=
      1;

    return value;
  }

  public nextInt(
    maxExclusive:
      number,
  ): number {
    if (
      !Number.isInteger(
        maxExclusive,
      ) ||
      maxExclusive <= 0
    ) {
      throw new RangeError(
        "maxExclusive must be a positive integer.",
      );
    }

    return Math.floor(
      this.nextFloat() *
      maxExclusive,
    );
  }

  public nextUint32():
    number {
    return Math.floor(
      this.nextFloat() *
      0x1_0000_0000,
    ) >>> 0;
  }
}

describe(
  "M3 autonomous exploratory movement",
  () => {
    it(
      "does not move or consume RNG when EXPLORE did not win",
      () => {
        const actions = [
          "idle",
          "seek",
          "eat",
        ] as const;

        for (
          const action of
          actions
        ) {
          const rng =
            new SeededRng(
              M3_PRIMARY_BRANCH_A_SEED,
            );

          const rngBefore =
            rng.state;

          const explorationState =
            createExplorationState(
              0.8,
              M3_EXPLORATION_PRESSURE_CONFIG,
            );

          const position = {
            x: 2,
            y: 2,
          };

          const result =
            executeM3ExploratoryMovement(
              position,
              explorationState,
              action,
              rng,
              5,
            );

          expect(
            result.position,
          ).toBe(
            position,
          );

          expect(
            result.explorationState,
          ).toBe(
            explorationState,
          );

          expect(
            result.movementSource,
          ).toBeNull();

          expect(
            result.directionX,
          ).toBeNull();

          expect(
            result.directionY,
          ).toBeNull();

          expect(
            result.distanceMoved,
          ).toBe(
            0,
          );

          expect(
            result.sampledNewHeading,
          ).toBe(
            false,
          );

          expect(
            rng.state,
          ).toEqual(
            rngBefore,
          );
        }
      },
    );

    it(
      "turns an actual neural EXPLORE winner into physical movement",
      () => {
        const brain =
          createM3Brain();

        const hunger =
          senseHunger(
            createHungerState(
              0,
              1,
            ),
          );

        const decision =
          evaluateM3Brain(
            brain,
            hunger,
            null,
            0.8,
          );

        expect(
          decision.selectedActionId,
        ).toBe(
          "explore",
        );

        const explorationState =
          createExplorationState(
            0.8,
            M3_EXPLORATION_PRESSURE_CONFIG,
          );

        const rng =
          new SeededRng(
            M3_PRIMARY_BRANCH_A_SEED,
          );

        const rngBefore =
          rng.state;

        const result =
          executeM3ExploratoryMovement(
            M3_ACQUISITION_CREATURE_START,
            explorationState,
            decision.selectedActionId,
            rng,
            0,
          );

        expect(
          result.movementSource,
        ).toBe(
          M3_EXPLORATION_MOVEMENT_SOURCE,
        );

        expect(
          result.sampledNewHeading,
        ).toBe(
          true,
        );

        expect(
          result.explorationState
            .activeHeading,
        ).not.toBeNull();

        expect(
          result.distanceMoved,
        ).toBeGreaterThan(
          0,
        );

        expect(
          result.position.x,
        ).toBeGreaterThan(
          M3_ACQUISITION_CREATURE_START.x,
        );

        expect(
          rng.state,
        ).not.toEqual(
          rngBefore,
        );
      },
    );

    it(
      "does not alter exploration pressure while resolving movement",
      () => {
        const explorationState =
          createExplorationState(
            0.8,
            M3_EXPLORATION_PRESSURE_CONFIG,
          );

        const rng =
          new SeededRng(
            M3_PRIMARY_BRANCH_A_SEED,
          );

        const result =
          executeM3ExploratoryMovement(
            {
              x: 2,
              y: 2,
            },
            explorationState,
            "explore",
            rng,
            0,
          );

        expect(
          result.explorationState
            .pressure,
        ).toBe(
          0.8,
        );
      },
    );

    it(
      "reuses an unexpired heading without consuming additional RNG",
      () => {
        const rng =
          new SeededRng(
            M3_PRIMARY_BRANCH_A_SEED,
          );

        const initialState =
          createExplorationState(
            0.8,
            M3_EXPLORATION_PRESSURE_CONFIG,
          );

        const first =
          executeM3ExploratoryMovement(
            {
              x: 1,
              y: 1,
            },
            initialState,
            "explore",
            rng,
            0,
          );

        const rngAfterFirst =
          rng.state;

        const second =
          executeM3ExploratoryMovement(
            first.position,
            first.explorationState,
            "explore",
            rng,
            1,
          );

        expect(
          second.sampledNewHeading,
        ).toBe(
          false,
        );

        expect(
          second.explorationState
            .activeHeading,
        ).toBe(
          first.explorationState
            .activeHeading,
        );

        expect(
          second.directionX,
        ).toBeCloseTo(
          first.directionX ??
            0,
        );

        expect(
          second.directionY,
        ).toBeCloseTo(
          first.directionY ??
            0,
        );

        expect(
          rng.state,
        ).toEqual(
          rngAfterFirst,
        );
      },
    );

    it(
      "retains a heading across another winning action without causing hidden exploratory movement",
      () => {
        const rng =
          new SeededRng(
            M3_PRIMARY_BRANCH_A_SEED,
          );

        const initialState =
          createExplorationState(
            0.8,
            M3_EXPLORATION_PRESSURE_CONFIG,
          );

        const firstExplore =
          executeM3ExploratoryMovement(
            {
              x: 1,
              y: 1,
            },
            initialState,
            "explore",
            rng,
            0,
          );

        const rngAfterFirst =
          rng.state;

        const seekTick =
          executeM3ExploratoryMovement(
            firstExplore.position,
            firstExplore.explorationState,
            "seek",
            rng,
            1,
          );

        expect(
          seekTick.position,
        ).toBe(
          firstExplore.position,
        );

        expect(
          seekTick.explorationState,
        ).toBe(
          firstExplore.explorationState,
        );

        expect(
          seekTick.distanceMoved,
        ).toBe(
          0,
        );

        expect(
          rng.state,
        ).toEqual(
          rngAfterFirst,
        );

        const secondExplore =
          executeM3ExploratoryMovement(
            seekTick.position,
            seekTick.explorationState,
            "explore",
            rng,
            2,
          );

        expect(
          secondExplore.sampledNewHeading,
        ).toBe(
          false,
        );

        expect(
          secondExplore.explorationState
            .activeHeading,
        ).toBe(
          firstExplore.explorationState
            .activeHeading,
        );

        expect(
          rng.state,
        ).toEqual(
          rngAfterFirst,
        );

        expect(
          secondExplore.distanceMoved,
        ).toBeGreaterThan(
          0,
        );
      },
    );

    it(
      "samples a new heading exactly when the previous heading expires",
      () => {
        const rng =
          new SeededRng(
            M3_PRIMARY_BRANCH_A_SEED,
          );

        const initialState =
          createExplorationState(
            0.8,
            M3_EXPLORATION_PRESSURE_CONFIG,
          );

        const first =
          executeM3ExploratoryMovement(
            {
              x: 2,
              y: 2,
            },
            initialState,
            "explore",
            rng,
            0,
          );

        const firstHeading =
          first.explorationState
            .activeHeading;

        const rngAfterFirst =
          rng.state;

        const second =
          executeM3ExploratoryMovement(
            first.position,
            first.explorationState,
            "explore",
            rng,
            M3_EXPLORATORY_HEADING_PERSISTENCE_SECONDS,
          );

        expect(
          second.sampledNewHeading,
        ).toBe(
          true,
        );

        expect(
          second.explorationState
            .activeHeading,
        ).not.toBe(
          firstHeading,
        );

        expect(
          rng.state,
        ).not.toEqual(
          rngAfterFirst,
        );
      },
    );

    it(
      "uses the locked habitat clamp when exploration points outside the world",
      () => {
        /*
         * nextFloat() = 0.5
         *
         * angle = PI
         *
         * direction = west
         */
        const rng =
          new FixedRandomSource(
            [
              0.5,
            ],
          );

        const state =
          createExplorationState(
            0.8,
            M3_EXPLORATION_PRESSURE_CONFIG,
          );

        const result =
          executeM3ExploratoryMovement(
            {
              x:
                M3_HABITAT_BOUNDS
                  .minX,

              y: 5,
            },
            state,
            "explore",
            rng,
            0,
          );

        expect(
          result.directionX,
        ).toBeCloseTo(
          -1,
        );

        expect(
          result.position.x,
        ).toBe(
          M3_HABITAT_BOUNDS
            .minX,
        );

        expect(
          result.position.x,
        ).toBeGreaterThanOrEqual(
          M3_HABITAT_BOUNDS
            .minX,
        );

        expect(
          result.position.x,
        ).toBeLessThanOrEqual(
          M3_HABITAT_BOUNDS
            .maxX,
        );

        expect(
          result.position.y,
        ).toBeGreaterThanOrEqual(
          M3_HABITAT_BOUNDS
            .minY,
        );

        expect(
          result.position.y,
        ).toBeLessThanOrEqual(
          M3_HABITAT_BOUNDS
            .maxY,
        );
      },
    );

    it(
      "produces identical exploratory movement from identical state, time and seed",
      () => {
        const run =
          () => {
            const rng =
              new SeededRng(
                M3_PRIMARY_BRANCH_A_SEED,
              );

            const state =
              createExplorationState(
                0.8,
                M3_EXPLORATION_PRESSURE_CONFIG,
              );

            const result =
              executeM3ExploratoryMovement(
                {
                  x: 2,
                  y: 2,
                },
                state,
                "explore",
                rng,
                0,
              );

            return {
              result,
              rngState:
                rng.state,
            };
          };

        expect(
          run(),
        ).toEqual(
          run(),
        );
      },
    );

    it(
      "cannot change exploratory movement merely because unrelated hidden food coordinates change",
      () => {
        const run =
          (
            hiddenFoodX:
              number,
          ) => {
            /*
             * The hidden food exists as world
             * data in this adversarial setup.
             *
             * It is deliberately never supplied
             * to the exploratory movement
             * executor.
             */
            const hiddenFood =
              createFoodObject(
                "hidden-food",
                hiddenFoodX,
                0,
                0.5,
              );

            expect(
              hiddenFood.position.x,
            ).toBe(
              hiddenFoodX,
            );

            const rng =
              new SeededRng(
                M3_PRIMARY_BRANCH_A_SEED,
              );

            const state =
              createExplorationState(
                0.8,
                M3_EXPLORATION_PRESSURE_CONFIG,
              );

            return {
              movement:
                executeM3ExploratoryMovement(
                  {
                    x: 2,
                    y: 2,
                  },
                  state,
                  "explore",
                  rng,
                  0,
                ),

              rngState:
                rng.state,
            };
          };

        const primaryTarget =
          run(
            8,
          );

        const alternateTarget =
          run(
            M3_HIDDEN_TARGET_ALTERNATE_FOOD.x,
          );

        expect(
          alternateTarget,
        ).toEqual(
          primaryTarget,
        );
      },
    );

    it(
      "rejects invalid starting position or simulation time",
      () => {
        const rng =
          new SeededRng(
            M3_PRIMARY_BRANCH_A_SEED,
          );

        const state =
          createExplorationState(
            M3_EXPLORATION_INITIAL_PRESSURE,
            M3_EXPLORATION_PRESSURE_CONFIG,
          );

        expect(() =>
          executeM3ExploratoryMovement(
            {
              x: -1,
              y: 0,
            },
            state,
            "explore",
            rng,
            0,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          executeM3ExploratoryMovement(
            {
              x: 0,
              y: 0,
            },
            state,
            "explore",
            rng,
            -1,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          executeM3ExploratoryMovement(
            {
              x:
                Number.NaN,

              y: 0,
            },
            state,
            "explore",
            rng,
            0,
          ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);