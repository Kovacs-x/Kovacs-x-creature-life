import {
  describe,
  expect,
  it,
} from "vitest";

import type {
  BrainState,
} from "../../src/simulation/core/contracts.js";

import type {
  FoodObjectState,
} from "../../src/world/food.js";

import type {
  ExplorationState,
} from "../../src/simulation/drives/exploration.js";

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
  createSensoryOccluder,
} from "../../src/world/sensoryOccluder.js";

import {
  deriveM3DirectFoodPerception,
  resolveM3DiscoveryStep,
  type M3DiscoveryStepResult,
} from "../../src/simulation/core/m3Discovery.js";

import {
  M3_ACQUISITION_CREATURE_START,
  M3_ACQUISITION_FOOD,
  M3_ACQUISITION_OCCLUDER,
  M3_EXPLORATION_PRESSURE_CONFIG,
  M3_EXPLORATORY_HEADING_PERSISTENCE_SECONDS,
  M3_HIDDEN_TARGET_ALTERNATE_FOOD,
  M3_PRIMARY_BRANCH_A_SEED,
  M3_PRIMARY_BRANCH_B_SEED,
} from "../../src/simulation/core/m3Contract.js";

interface ControlledDiscoverySequence {
  readonly steps:
    readonly M3DiscoveryStepResult[];

  readonly finalPosition: {
    readonly x: number;
    readonly y: number;
  };

  readonly finalExplorationState:
    ExplorationState;

  readonly finalBrain:
    BrainState;

  readonly finalRngState:
    ReturnType<
      typeof getRngState
    >;
}

function getRngState(
  rng:
    SeededRng,
) {
  return rng.state;
}

/*
 * These times deliberately produce the exact
 * M3.2 prospectively tested heading-use pattern:
 *
 * heading 1:
 *   two uses
 *
 * heading 2:
 *   two uses
 *
 * heading 3:
 *   one use
 *
 * The pattern is therefore:
 *
 * 0, 0, 1, 1, 2
 *
 * No seed or environmental constant is chosen
 * here.
 */
const LOCKED_FIVE_MOVE_TIMES = [
  0,
  1,
  M3_EXPLORATORY_HEADING_PERSISTENCE_SECONDS,
  M3_EXPLORATORY_HEADING_PERSISTENCE_SECONDS +
    1,
  M3_EXPLORATORY_HEADING_PERSISTENCE_SECONDS *
    2,
] as const;

function createLockedPrimaryFood():
  FoodObjectState {
  return createFoodObject(
    M3_ACQUISITION_FOOD.id,

    M3_ACQUISITION_FOOD.x,

    M3_ACQUISITION_FOOD.y,

    M3_ACQUISITION_FOOD.nutrition,
  );
}

function createLockedAlternateFood():
  FoodObjectState {
  return createFoodObject(
    M3_HIDDEN_TARGET_ALTERNATE_FOOD.id,

    M3_HIDDEN_TARGET_ALTERNATE_FOOD.x,

    M3_HIDDEN_TARGET_ALTERNATE_FOOD.y,

    M3_HIDDEN_TARGET_ALTERNATE_FOOD.nutrition,
  );
}

function createLockedOccluder() {
  return createSensoryOccluder(
    M3_ACQUISITION_OCCLUDER.x,

    M3_ACQUISITION_OCCLUDER.minY,

    M3_ACQUISITION_OCCLUDER.maxY,

    M3_ACQUISITION_OCCLUDER.active,
  );
}

/*
 * Controlled M3.5 discovery sequence.
 *
 * At each step:
 *
 * 1. legitimate current perception is derived;
 * 2. the actual M3 brain evaluates it;
 * 3. normal competition selects the action;
 * 4. the discovery transition resolves movement;
 * 5. perception is rebuilt after movement.
 *
 * Exploration pressure is fixed at 0.8 only for
 * this mechanism-isolation test.
 *
 * Full pressure evolution belongs to the
 * integrated M3.6 episode experiment.
 */
function runControlledDiscoverySequence(
  seed:
    number,

  food:
    FoodObjectState =
      createLockedPrimaryFood(),
): ControlledDiscoverySequence {
  const rng =
    new SeededRng(
      seed,
    );

  const sensoryOccluder =
    createLockedOccluder();

  let position: {
    x: number;
    y: number;
  } = {
    x:
      M3_ACQUISITION_CREATURE_START.x,

    y:
      M3_ACQUISITION_CREATURE_START.y,
  };

  let explorationState =
    createExplorationState(
      0.8,
      M3_EXPLORATION_PRESSURE_CONFIG,
    );

  let brain =
    createM3Brain();

  const hungerSignal =
    senseHunger(
      createHungerState(
        0,
        1,
      ),
    );

  const steps:
    M3DiscoveryStepResult[] =
      [];

  for (
    const simulationTimeSeconds of
    LOCKED_FIVE_MOVE_TIMES
  ) {
    const currentPerception =
      deriveM3DirectFoodPerception(
        position,
        food,
        sensoryOccluder,
      );

    const decision =
      evaluateM3Brain(
        brain,

        hungerSignal,

        currentPerception
          .foodSignal,

        0.8,
      );

    brain =
      decision.brain;

    const result =
      resolveM3DiscoveryStep(
        position,

        explorationState,

        decision.selectedActionId,

        rng,

        simulationTimeSeconds,

        food,

        sensoryOccluder,
      );

    steps.push(
      result,
    );

    position = {
      x:
        result.movement
          .position.x,

      y:
        result.movement
          .position.y,
    };

    explorationState =
      result.movement
        .explorationState;

    /*
     * Once food has been legitimately
     * discovered the M3.5 discovery claim has
     * been established.
     *
     * Do not force further EXPLORE actions after
     * the sensory evidence changes.
     */
    if (
      result.autonomousDiscoveryOccurred
    ) {
      break;
    }
  }

  return {
    steps,

    finalPosition:
      position,

    finalExplorationState:
      explorationState,

    finalBrain:
      brain,

    finalRngState:
      getRngState(
        rng,
      ),
  };
}

describe(
  "M3 environmental discovery",
  () => {
    it(
      "begins with food physically present but legitimately unavailable to direct perception",
      () => {
        const food =
          createLockedPrimaryFood();

        const sensoryOccluder =
          createLockedOccluder();

        const perception =
          deriveM3DirectFoodPerception(
            M3_ACQUISITION_CREATURE_START,

            food,

            sensoryOccluder,
          );

        expect(
          food.consumed,
        ).toBe(
          false,
        );

        expect(
          perception.occluded,
        ).toBe(
          true,
        );

        expect(
          perception.foodSignal,
        ).toBeNull();
      },
    );

    it(
      "allows the prospectively locked Branch A motor history to create legitimate autonomous discovery",
      () => {
        const sequence =
          runControlledDiscoverySequence(
            M3_PRIMARY_BRANCH_A_SEED,
          );

        expect(
          sequence.steps,
        ).toHaveLength(
          5,
        );

        for (
          const result of
          sequence.steps.slice(
            0,
            4,
          )
        ) {
          expect(
            result.beforePerception
              .foodSignal,
          ).toBeNull();

          expect(
            result.afterPerception
              .foodSignal,
          ).toBeNull();

          expect(
            result.autonomousDiscoveryOccurred,
          ).toBe(
            false,
          );

          expect(
            result.movement
              .movementSource,
          ).toBe(
            "exploration",
          );
        }

        const discovery =
          sequence.steps[
            4
          ];

        expect(
          discovery,
        ).toBeDefined();

        expect(
          discovery!
            .beforePerception
            .foodSignal,
        ).toBeNull();

        expect(
          discovery!
            .movement
            .movementSource,
        ).toBe(
          "exploration",
        );

        expect(
          discovery!
            .movement
            .distanceMoved,
        ).toBeGreaterThan(
          0,
        );

        expect(
          discovery!
            .afterPerception
            .foodSignal,
        ).not.toBeNull();

        expect(
          discovery!
            .afterPerception
            .foodSignal
            ?.foodId,
        ).toBe(
          M3_ACQUISITION_FOOD.id,
        );

        expect(
          discovery!
            .autonomousDiscoveryOccurred,
        ).toBe(
          true,
        );

        expect(
          sequence.finalPosition.x,
        ).toBeGreaterThan(
          M3_ACQUISITION_OCCLUDER.x,
        );
      },
    );

    it(
      "shows that the locked Branch B contrast does not produce the same discovery in the same five-move opportunity",
      () => {
        const sequence =
          runControlledDiscoverySequence(
            M3_PRIMARY_BRANCH_B_SEED,
          );

        expect(
          sequence.steps,
        ).toHaveLength(
          5,
        );

        expect(
          sequence.steps.some(
            (step) =>
              step
                .autonomousDiscoveryOccurred,
          ),
        ).toBe(
          false,
        );

        expect(
          sequence.steps.every(
            (step) =>
              step
                .afterPerception
                .foodSignal ===
              null,
          ),
        ).toBe(
          true,
        );

        expect(
          sequence.finalPosition.x,
        ).toBe(
          0,
        );
      },
    );

    it(
      "uses normal neural competition before every pre-discovery exploratory movement",
      () => {
        const rng =
          new SeededRng(
            M3_PRIMARY_BRANCH_A_SEED,
          );

        const food =
          createLockedPrimaryFood();

        const sensoryOccluder =
          createLockedOccluder();

        const explorationState =
          createExplorationState(
            0.8,
            M3_EXPLORATION_PRESSURE_CONFIG,
          );

        const before =
          deriveM3DirectFoodPerception(
            M3_ACQUISITION_CREATURE_START,

            food,

            sensoryOccluder,
          );

        const decision =
          evaluateM3Brain(
            createM3Brain(),

            senseHunger(
              createHungerState(
                0,
                1,
              ),
            ),

            before.foodSignal,

            explorationState
              .pressure,
          );

        expect(
          decision.selectedActionId,
        ).toBe(
          "explore",
        );

        const result =
          resolveM3DiscoveryStep(
            M3_ACQUISITION_CREATURE_START,

            explorationState,

            decision.selectedActionId,

            rng,

            0,

            food,

            sensoryOccluder,
          );

        expect(
          result.movement
            .movementSource,
        ).toBe(
          "exploration",
        );
      },
    );

    it(
      "does not label already visible food as a new autonomous discovery",
      () => {
        const food =
          createLockedPrimaryFood();

        const sensoryOccluder =
          createLockedOccluder();

        const visiblePosition = {
          x: 5,
          y: 0,
        };

        const before =
          deriveM3DirectFoodPerception(
            visiblePosition,

            food,

            sensoryOccluder,
          );

        expect(
          before.foodSignal,
        ).not.toBeNull();

        const rng =
          new SeededRng(
            M3_PRIMARY_BRANCH_A_SEED,
          );

        const result =
          resolveM3DiscoveryStep(
            visiblePosition,

            createExplorationState(
              0.8,
              M3_EXPLORATION_PRESSURE_CONFIG,
            ),

            "explore",

            rng,

            0,

            food,

            sensoryOccluder,
          );

        expect(
          result.beforePerception
            .foodSignal,
        ).not.toBeNull();

        expect(
          result.autonomousDiscoveryOccurred,
        ).toBe(
          false,
        );
      },
    );

    it(
      "does not create discovery or consume exploratory RNG when EXPLORE did not win",
      () => {
        const food =
          createLockedPrimaryFood();

        const sensoryOccluder =
          createLockedOccluder();

        const rng =
          new SeededRng(
            M3_PRIMARY_BRANCH_A_SEED,
          );

        const rngBefore =
          rng.state;

        const position =
          M3_ACQUISITION_CREATURE_START;

        const result =
          resolveM3DiscoveryStep(
            position,

            createExplorationState(
              0.8,
              M3_EXPLORATION_PRESSURE_CONFIG,
            ),

            "idle",

            rng,

            0,

            food,

            sensoryOccluder,
          );

        expect(
          result.movement.position,
        ).toBe(
          position,
        );

        expect(
          result.movement.distanceMoved,
        ).toBe(
          0,
        );

        expect(
          result.autonomousDiscoveryOccurred,
        ).toBe(
          false,
        );

        expect(
          rng.state,
        ).toEqual(
          rngBefore,
        );
      },
    );

    it(
      "does not alter the food object while producing discovery",
      () => {
        const food =
          createLockedPrimaryFood();

        const originalFood =
          JSON.parse(
            JSON.stringify(
              food,
            ),
          );

        runControlledDiscoverySequence(
          M3_PRIMARY_BRANCH_A_SEED,
          food,
        );

        expect(
          food,
        ).toEqual(
          originalFood,
        );
      },
    );

    it(
      "keeps exploratory motor choices identical when only the hidden target position changes",
      () => {
        const primaryFood =
          createLockedPrimaryFood();

        const alternateFood =
          createLockedAlternateFood();

        const run =
          (
            food:
              FoodObjectState,
          ) => {
            const rng =
              new SeededRng(
                M3_PRIMARY_BRANCH_A_SEED,
              );

            const sensoryOccluder =
              createLockedOccluder();

            let position: {
              x: number;
              y: number;
            } = {
              x:
                M3_ACQUISITION_CREATURE_START.x,

              y:
                M3_ACQUISITION_CREATURE_START.y,
            };

            let explorationState =
              createExplorationState(
                0.8,
                M3_EXPLORATION_PRESSURE_CONFIG,
              );

            const trace:
              Array<{
                readonly beforeVisible:
                  boolean;

                readonly position: {
                  readonly x:
                    number;

                  readonly y:
                    number;
                };

                readonly directionX:
                  number | null;

                readonly directionY:
                  number | null;

                readonly sampledNewHeading:
                  boolean;

                readonly rngState:
                  ReturnType<
                    typeof getRngState
                  >;
              }> = [];

            for (
              const simulationTimeSeconds of
              LOCKED_FIVE_MOVE_TIMES
            ) {
              const before =
                deriveM3DirectFoodPerception(
                  position,
                  food,
                  sensoryOccluder,
                );

              /*
               * The adversarial comparison is
               * restricted to periods where the
               * target is still genuinely hidden
               * before action selection.
               */
              expect(
                before.foodSignal,
              ).toBeNull();

              const movement =
                resolveM3DiscoveryStep(
                  position,

                  explorationState,

                  "explore",

                  rng,

                  simulationTimeSeconds,

                  food,

                  sensoryOccluder,
                );

              trace.push({
                beforeVisible:
                  before.foodSignal !==
                  null,

                position: {
                  x:
                    movement
                      .movement
                      .position.x,

                  y:
                    movement
                      .movement
                      .position.y,
                },

                directionX:
                  movement
                    .movement
                    .directionX,

                directionY:
                  movement
                    .movement
                    .directionY,

                sampledNewHeading:
                  movement
                    .movement
                    .sampledNewHeading,

                rngState:
                  getRngState(
                    rng,
                  ),
              });

              position = {
                x:
                  movement
                    .movement
                    .position.x,

                y:
                  movement
                    .movement
                    .position.y,
              };

              explorationState =
                movement
                  .movement
                  .explorationState;

              if (
                movement
                  .afterPerception
                  .foodSignal !==
                null
              ) {
                break;
              }
            }

            return trace;
          };

        const primaryTrace =
          run(
            primaryFood,
          );

        const alternateTrace =
          run(
            alternateFood,
          );

        expect(
          alternateTrace,
        ).toEqual(
          primaryTrace,
        );
      },
    );

    it(
      "replays discovery identically from the same initial state and seed",
      () => {
        const first =
          runControlledDiscoverySequence(
            M3_PRIMARY_BRANCH_A_SEED,
          );

        const second =
          runControlledDiscoverySequence(
            M3_PRIMARY_BRANCH_A_SEED,
          );

        expect(
          second,
        ).toEqual(
          first,
        );
      },
    );
  },
);