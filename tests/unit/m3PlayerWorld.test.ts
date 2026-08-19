import {
  describe,
  expect,
  it,
} from "vitest";

import {
  advanceM3AcquisitionTick,
  createM3AcquisitionState,
  runM3AcquisitionRound,
} from "../../src/simulation/core/m3Acquisition.js";

import {
  deriveM3DirectFoodPerception,
} from "../../src/simulation/core/m3Discovery.js";

import {
  applyM3PlayerFoodPlacement,
  M3_PLAYER_FOOD_PLACED_EVENT,
  M3_PLAYER_FOOD_RELOCATED_EVENT,
  M3_PLAYER_WORLD_EVENT_KIND,
  M3_PLAYER_WORLD_EVENT_SCHEMA_VERSION,
  M3_PLAYER_WORLD_EVENT_SOURCE,
} from "../../src/simulation/core/m3PlayerWorld.js";

import {
  M3_ACQUISITION_MOVE_DISTANCE,
  M3_HABITAT_BOUNDS,
  M3_HIDDEN_TARGET_ALTERNATE_FOOD,
  M3_PRIMARY_BRANCH_A_SEED,
} from "../../src/simulation/core/m3Contract.js";

function createInteractiveState() {
  return createM3AcquisitionState({
    seed:
      M3_PRIMARY_BRANCH_A_SEED,

    learningEnabled:
      true,

    explorationEnabled:
      true,
  });
}

describe(
  "M3 player world interaction",
  () => {
    it(
      "relocates the existing unconsumed food resource in authoritative world state",
      () => {
        const state =
          createInteractiveState();

        const originalFoodId =
          state.food.id;

        const originalEnergyValue =
          state.food.energyValue;

        const result =
          applyM3PlayerFoodPlacement(
            state,

            {
              x: 2,
              y: 3,
            },

            0,
          );

        expect(
          result.state.food.id,
        ).toBe(
          originalFoodId,
        );

        expect(
          result.state.food.kind,
        ).toBe(
          "food",
        );

        expect(
          result.state.food.energyValue,
        ).toBe(
          originalEnergyValue,
        );

        expect(
          result.state.food.position,
        ).toEqual({
          x: 2,
          y: 3,
        });

        expect(
          result.state.food.consumed,
        ).toBe(
          false,
        );

        expect(
          result.event.eventType,
        ).toBe(
          M3_PLAYER_FOOD_RELOCATED_EVENT,
        );
      },
    );

    it(
      "records the minimum deterministic external-event evidence required by M3",
      () => {
        const state =
          createInteractiveState();

        const result =
          applyM3PlayerFoodPlacement(
            state,

            {
              x: 2,
              y: 3,
            },

            7,
          );

        expect(
          result.event,
        ).toEqual({
          schemaVersion:
            M3_PLAYER_WORLD_EVENT_SCHEMA_VERSION,

          kind:
            M3_PLAYER_WORLD_EVENT_KIND,

          sequence:
            7,

          simulationTimeSeconds:
            state.simulationTimeSeconds,

          tickIndex:
            state.tickIndex,

          source:
            M3_PLAYER_WORLD_EVENT_SOURCE,

          eventType:
            M3_PLAYER_FOOD_RELOCATED_EVENT,

          affectedObjectKind:
            "food",

          affectedObjectId:
            state.food.id,

          previousWorldState: {
            position: {
              x:
                state.food.position.x,

              y:
                state.food.position.y,
            },

            consumed:
              false,
          },

          resultingWorldState: {
            position: {
              x: 2,
              y: 3,
            },

            consumed:
              false,
          },
        });
      },
    );

    it(
      "does not directly modify Creature cognition, biology, learning, exploration or RNG",
      () => {
        const state =
          createInteractiveState();

        const result =
          applyM3PlayerFoodPlacement(
            state,

            {
              x: 2,
              y: 3,
            },

            0,
          );

        expect(
          result.state.tickIndex,
        ).toBe(
          state.tickIndex,
        );

        expect(
          result.state.simulationTimeSeconds,
        ).toBe(
          state.simulationTimeSeconds,
        );

        expect(
          result.state.position,
        ).toBe(
          state.position,
        );

        expect(
          result.state.hunger,
        ).toBe(
          state.hunger,
        );

        expect(
          result.state.brain,
        ).toBe(
          state.brain,
        );

        expect(
          result.state.eligibilityTrace,
        ).toBe(
          state.eligibilityTrace,
        );

        expect(
          result.state.explorationState,
        ).toBe(
          state.explorationState,
        );

        expect(
          result.state.rngState,
        ).toBe(
          state.rngState,
        );

        expect(
          result.state.discoveryCount,
        ).toBe(
          state.discoveryCount,
        );

        expect(
          result.state.consumptionCount,
        ).toBe(
          state.consumptionCount,
        );

        expect(
          result.state.cumulativeReward,
        ).toBe(
          state.cumulativeReward,
        );

        expect(
          result.state.weightChanges,
        ).toBe(
          state.weightChanges,
        );
      },
    );

    it(
      "allows the changed world to become perceptible only through the ordinary sensory transformation",
      () => {
        const state =
          createInteractiveState();

        const before =
          deriveM3DirectFoodPerception(
            state.position,

            state.food,

            state.sensoryOccluder,
          );

        /*
         * Locked acquisition food initially
         * exists behind the real occluder.
         */
        expect(
          before.foodSignal,
        ).toBeNull();

        const placement =
          applyM3PlayerFoodPlacement(
            state,

            {
              /*
               * This location is on the
               * Creature's side of the
               * occluder and inside normal
               * perception range.
               */
              x: 2,
              y: 3,
            },

            0,
          );

        const after =
          deriveM3DirectFoodPerception(
            placement.state.position,

            placement.state.food,

            placement.state.sensoryOccluder,
          );

        expect(
          after.foodSignal,
        ).not.toBeNull();

        expect(
          after.foodSignal
            ?.foodId,
        ).toBe(
          state.food.id,
        );

        /*
         * The next authoritative simulation
         * tick independently rebuilds that same
         * sensory evidence.
         *
         * The player event itself did not
         * inject a perception signal.
         */
        const tick =
          advanceM3AcquisitionTick(
            placement.state,
          );

        expect(
          tick.evidence
            .directFoodPerceptionBefore,
        ).toEqual(
          after.foodSignal,
        );
      },
    );

    it(
      "does not notify cognition when the player relocates food to another still-hidden location",
      () => {
        const state =
          createInteractiveState();

        const rngBefore =
          state.rngState;

        const result =
          applyM3PlayerFoodPlacement(
            state,

            {
              x:
                M3_HIDDEN_TARGET_ALTERNATE_FOOD.x,

              y:
                M3_HIDDEN_TARGET_ALTERNATE_FOOD.y,
            },

            0,
          );

        const perception =
          deriveM3DirectFoodPerception(
            result.state.position,

            result.state.food,

            result.state.sensoryOccluder,
          );

        expect(
          perception.foodSignal,
        ).toBeNull();

        const tick =
          advanceM3AcquisitionTick(
            result.state,
          );

        /*
         * Initial pressure remains below the
         * locked EXPLORE threshold, and hidden
         * food provides no SEEK evidence.
         *
         * Therefore relocation itself cannot
         * force either SEEK or EXPLORE.
         */
        expect(
          tick.evidence
            .selectedActionId,
        ).toBe(
          "idle",
        );

        expect(
          tick.evidence
            .movementSource,
        ).toBeNull();

        expect(
          tick.evidence
            .positionAfter,
        ).toEqual(
          state.position,
        );

        /*
         * IDLE also consumes no exploratory
         * RNG, so the hidden player relocation
         * cannot perturb future randomness.
         */
        expect(
          tick.state.rngState,
        ).toEqual(
          rngBefore,
        );
      },
    );

    it(
      "re-places the same single food resource after consumption without resetting the Creature",
      () => {
        const completedRound =
          runM3AcquisitionRound({
            seed:
              M3_PRIMARY_BRANCH_A_SEED,

            learningEnabled:
              true,

            explorationEnabled:
              true,
          });

        const completed =
          completedRound.finalState;

        expect(
          completed.complete,
        ).toBe(
          true,
        );

        expect(
          completed.food.consumed,
        ).toBe(
          true,
        );

        expect(
          completed.consumptionCount,
        ).toBe(
          1,
        );

        const placement =
          applyM3PlayerFoodPlacement(
            completed,

            {
              x: 2,
              y: 3,
            },

            12,
          );

        /*
         * Reuse the same authoritative resource.
         * No second food object is created.
         */
        expect(
          placement.state.food.id,
        ).toBe(
          completed.food.id,
        );

        expect(
          placement.state.food.kind,
        ).toBe(
          completed.food.kind,
        );

        expect(
          placement.state.food.energyValue,
        ).toBe(
          completed.food.energyValue,
        );

        expect(
          placement.state.food.consumed,
        ).toBe(
          false,
        );

        expect(
          placement.state.food.position,
        ).toEqual({
          x: 2,
          y: 3,
        });

        /*
         * This is the narrow M3 lifecycle
         * adjustment:
         *
         * a newly placed active resource means
         * the controlled world may continue.
         */
        expect(
          placement.state.complete,
        ).toBe(
          false,
        );

        expect(
          placement.event.eventType,
        ).toBe(
          M3_PLAYER_FOOD_PLACED_EVENT,
        );

        /*
         * Previous life and learned state are
         * retained rather than reset.
         */
        expect(
          placement.state.tickIndex,
        ).toBe(
          completed.tickIndex,
        );

        expect(
          placement.state.simulationTimeSeconds,
        ).toBe(
          completed.simulationTimeSeconds,
        );

        expect(
          placement.state.position,
        ).toBe(
          completed.position,
        );

        expect(
          placement.state.hunger,
        ).toBe(
          completed.hunger,
        );

        expect(
          placement.state.brain,
        ).toBe(
          completed.brain,
        );

        expect(
          placement.state.eligibilityTrace,
        ).toBe(
          completed.eligibilityTrace,
        );

        expect(
          placement.state.explorationState,
        ).toBe(
          completed.explorationState,
        );

        expect(
          placement.state.rngState,
        ).toBe(
          completed.rngState,
        );

        expect(
          placement.state.discoveryCount,
        ).toBe(
          completed.discoveryCount,
        );

        expect(
          placement.state.consumptionCount,
        ).toBe(
          completed.consumptionCount,
        );

        expect(
          placement.state.cumulativeReward,
        ).toBe(
          completed.cumulativeReward,
        );

        expect(
          placement.state.weightChanges,
        ).toBe(
          completed.weightChanges,
        );

        /*
         * Because complete was reopened by the
         * legitimate world placement, the
         * ordinary M3 tick can continue.
         */
        expect(() =>
          advanceM3AcquisitionTick(
            placement.state,
          ),
        ).not.toThrow();
      },
    );

    it(
      "preserves the fact that the Creature has eaten before when the resource is placed again",
      () => {
        const completed =
          runM3AcquisitionRound({
            seed:
              M3_PRIMARY_BRANCH_A_SEED,

            learningEnabled:
              true,

            explorationEnabled:
              true,
          }).finalState;

        expect(
          completed.ate,
        ).toBe(
          true,
        );

        const placement =
          applyM3PlayerFoodPlacement(
            completed,

            {
              x: 2,
              y: 3,
            },

            1,
          );

        expect(
          placement.state.ate,
        ).toBe(
          true,
        );

        expect(
          placement.state.consumptionCount,
        ).toBe(
          completed.consumptionCount,
        );
      },
    );

    it(
      "accepts habitat-edge placements and rejects invalid world coordinates",
      () => {
        const state =
          createInteractiveState();

        const edge =
          applyM3PlayerFoodPlacement(
            state,

            {
              x:
                M3_HABITAT_BOUNDS.maxX,

              y:
                M3_HABITAT_BOUNDS.maxY,
            },

            0,
          );

        expect(
          edge.state.food.position,
        ).toEqual({
          x:
            M3_HABITAT_BOUNDS.maxX,

          y:
            M3_HABITAT_BOUNDS.maxY,
        });

        expect(() =>
          applyM3PlayerFoodPlacement(
            state,

            {
              x:
                M3_HABITAT_BOUNDS.minX -
                0.001,

              y: 0,
            },

            0,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          applyM3PlayerFoodPlacement(
            state,

            {
              x:
                M3_HABITAT_BOUNDS.maxX +
                0.001,

              y: 0,
            },

            0,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          applyM3PlayerFoodPlacement(
            state,

            {
              x: 0,

              y:
                Number.NaN,
            },

            0,
          ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      "requires deterministic non-negative integer external-event sequence numbers",
      () => {
        const state =
          createInteractiveState();

        expect(() =>
          applyM3PlayerFoodPlacement(
            state,

            {
              x: 2,
              y: 3,
            },

            -1,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          applyM3PlayerFoodPlacement(
            state,

            {
              x: 2,
              y: 3,
            },

            1.5,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          applyM3PlayerFoodPlacement(
            state,

            {
              x: 2,
              y: 3,
            },

            Number.NaN,
          ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      "produces identical world state and event evidence from identical inputs",
      () => {
        const run =
          () => {
            const state =
              createInteractiveState();

            return applyM3PlayerFoodPlacement(
              state,

              {
                x: 2,
                y: 3,
              },

              4,
            );
          };

        expect(
          run(),
        ).toEqual(
          run(),
        );
      },
    );

    it(
      "does not let SEEK overshoot arbitrary player-positioned food and reach it through ordinary contact and EAT instead",
      () => {
        /*
         * Regression coverage for a genuine
         * simulation integration bug exposed by
         * the M3.9B2 browser smoke test.
         *
         * Arbitrary M3.8 player-positioned food
         * is not guaranteed to sit on a
         * trajectory where repeated exact
         * M3_ACQUISITION_MOVE_DISTANCE steps ever
         * enter the interaction radius. Before
         * this fix, SEEK could oscillate back and
         * forth across food placed at 0.6 world
         * units away without ever making contact.
         */
        const state =
          createInteractiveState();

        const placement =
          applyM3PlayerFoodPlacement(
            state,

            {
              /*
               * On the Creature's side of the
               * real occluder (x = 4) and well
               * inside perception range, so this
               * exercises legitimate direct
               * perception rather than occlusion.
               */
              x: 0.6,
              y: 0,
            },

            0,
          );

        /*
         * 1. Player placement itself executes no
         * Creature tick.
         */
        expect(
          placement.state.tickIndex,
        ).toBe(
          state.tickIndex,
        );

        expect(
          placement.state
            .simulationTimeSeconds,
        ).toBe(
          state.simulationTimeSeconds,
        );

        expect(
          placement.state.position,
        ).toBe(
          state.position,
        );

        /*
         * 2. Food is legitimately directly
         * perceptible.
         */
        const perception =
          deriveM3DirectFoodPerception(
            placement.state.position,

            placement.state.food,

            placement.state
              .sensoryOccluder,
          );

        expect(
          perception.foodSignal,
        ).not.toBeNull();

        expect(
          perception.foodSignal
            ?.distance,
        ).toBeCloseTo(
          0.6,
        );

        const rngBeforeFirstTick =
          placement.state.rngState;

        /*
         * 3. First ordinary tick selects SEEK
         * through normal competition.
         */
        const firstTick =
          advanceM3AcquisitionTick(
            placement.state,
          );

        expect(
          firstTick.evidence
            .selectedActionId,
        ).toBe(
          "seek",
        );

        expect(
          firstTick.evidence
            .movementSource,
        ).toBe(
          "seek",
        );

        /*
         * 4. SEEK movement distance does not
         * exceed the locked
         * M3_ACQUISITION_MOVE_DISTANCE.
         */
        expect(
          firstTick.evidence
            .distanceMoved,
        ).toBeLessThanOrEqual(
          M3_ACQUISITION_MOVE_DISTANCE,
        );

        /*
         * 5. The Creature does not overshoot the
         * legitimately perceived food; it stops
         * exactly at the perceived location
         * rather than travelling the full locked
         * move distance past it.
         */
        expect(
          firstTick.evidence
            .distanceMoved,
        ).toBeCloseTo(
          0.6,
        );

        expect(
          firstTick.state.position.x,
        ).toBeCloseTo(
          0.6,
        );

        expect(
          firstTick.state.position.y,
        ).toBeCloseTo(
          0,
        );

        /*
         * 6. No food is eaten during the SEEK
         * tick itself.
         */
        expect(
          firstTick.evidence.ate,
        ).toBe(
          false,
        );

        expect(
          firstTick.state.food.consumed,
        ).toBe(
          false,
        );

        /*
         * This fix consumes no additional
         * simulation RNG: SEEK movement remains
         * driven only by legitimate direct
         * sensory evidence, exactly as before.
         */
        expect(
          firstTick.evidence
            .rngStateAfter,
        ).toEqual(
          rngBeforeFirstTick,
        );

        /*
         * 7. The next ordinary tick's cognition
         * receives genuine physical contact
         * because the Creature legitimately
         * stopped at the food.
         */
        const secondTick =
          advanceM3AcquisitionTick(
            firstTick.state,
          );

        /*
         * 8. EAT independently wins through
         * normal action competition on this
         * later tick; nothing forced it.
         *
         * 9. Genuine eating succeeds.
         */
        expect(
          secondTick.evidence
            .selectedActionId,
        ).toBe(
          "eat",
        );

        expect(
          secondTick.evidence.ate,
        ).toBe(
          true,
        );

        /*
         * 10. Food becomes consumed.
         */
        expect(
          secondTick.state.food.consumed,
        ).toBe(
          true,
        );
      },
    );

    it(
      "supports deterministic ordering of multiple external player events without advancing simulation time",
      () => {
        const initial =
          createInteractiveState();

        const first =
          applyM3PlayerFoodPlacement(
            initial,

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

        const events = [
          first.event,
          second.event,
        ];

        expect(
          events.map(
            (event) =>
              event.sequence,
          ),
        ).toEqual([
          0,
          1,
        ]);

        expect(
          events[0]
            ?.simulationTimeSeconds,
        ).toBe(
          events[1]
            ?.simulationTimeSeconds,
        );

        expect(
          events[0]
            ?.tickIndex,
        ).toBe(
          events[1]
            ?.tickIndex,
        );

        expect(
          second.state
            .simulationTimeSeconds,
        ).toBe(
          initial
            .simulationTimeSeconds,
        );

        expect(
          second.state
            .tickIndex,
        ).toBe(
          initial.tickIndex,
        );

        expect(
          second.state.food.position,
        ).toEqual({
          x: 3,
          y: 4,
        });
      },
    );
  },
);