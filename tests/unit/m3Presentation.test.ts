import {
  describe,
  expect,
  it,
} from "vitest";

import {
  deriveM3PresentationModel,
  M3_PRESENTATION_MODEL_SCHEMA_VERSION,
} from "../../src/rendering/m3Presentation.js";

import {
  advanceM3AcquisitionTick,
  createM3AcquisitionState,
  type M3AcquisitionState,
  type M3AcquisitionTickResult,
} from "../../src/simulation/core/m3Acquisition.js";

import {
  applyM3PlayerFoodPlacement,
} from "../../src/simulation/core/m3PlayerWorld.js";

import {
  M3_PRIMARY_BRANCH_A_SEED,
} from "../../src/simulation/core/m3Contract.js";

function createState():
  M3AcquisitionState {
  return createM3AcquisitionState({
    seed:
      M3_PRIMARY_BRANCH_A_SEED,

    learningEnabled:
      true,

    explorationEnabled:
      true,
  });
}

function findActionTransition(
  actionId:
    "explore" |
    "seek" |
    "eat",
): {
  readonly before:
    M3AcquisitionState;

  readonly result:
    M3AcquisitionTickResult;
} {
  let state =
    createState();

  for (
    let index = 0;
    index < 32;
    index += 1
  ) {
    const before =
      state;

    const result =
      advanceM3AcquisitionTick(
        before,
      );

    if (
      result.evidence
        .selectedActionId ===
      actionId
    ) {
      return {
        before,
        result,
      };
    }

    state =
      result.state;

    if (
      state.complete
    ) {
      break;
    }
  }

  throw new Error(
    `Locked M3 Branch A did not produce ${actionId}.`,
  );
}

describe(
  "M3 presentation contract",
  () => {
    it(
      "derives visible world and biological state from authoritative M3 state",
      () => {
        const state =
          createState();

        const model =
          deriveM3PresentationModel(
            state,
          );

        expect(
          model.schemaVersion,
        ).toBe(
          M3_PRESENTATION_MODEL_SCHEMA_VERSION,
        );

        expect(
          model.tickIndex,
        ).toBe(
          state.tickIndex,
        );

        expect(
          model
            .simulationTimeSeconds,
        ).toBe(
          state
            .simulationTimeSeconds,
        );

        expect(
          model
            .creature
            .position,
        ).toEqual(
          state.position,
        );

        expect(
          model
            .food
            .position,
        ).toEqual(
          state.food.position,
        );

        expect(
          model
            .food
            .available,
        ).toBe(
          true,
        );

        expect(
          model
            .creature
            .energy,
        ).toBe(
          state.hunger.energy,
        );

        expect(
          model
            .creature
            .maxEnergy,
        ).toBe(
          state.hunger.maxEnergy,
        );

        expect(
          model
            .creature
            .energyFraction,
        ).toBeCloseTo(
          state.hunger.energy /
            state.hunger.maxEnergy,
        );

        expect(
          model
            .creature
            .hungerFraction,
        ).toBeCloseTo(
          1 -
            state.hunger.energy /
              state.hunger.maxEnergy,
        );

        expect(
          model
            .environment
            .sensoryOccluder,
        ).toEqual({
          active:
            state
              .sensoryOccluder
              .active,

          x:
            state
              .sensoryOccluder
              .x,

          minY:
            state
              .sensoryOccluder
              .minY,

          maxY:
            state
              .sensoryOccluder
              .maxY,
        });
      },
    );

    it(
      "shows the initially hidden acquisition food as occluded rather than visible",
      () => {
        const state =
          createState();

        const model =
          deriveM3PresentationModel(
            state,
          );

        expect(
          model
            .food
            .available,
        ).toBe(
          true,
        );

        expect(
          model
            .environment
            .foodDirectlyPerceived,
        ).toBe(
          false,
        );

        expect(
          model
            .environment
            .foodPerceptionState,
        ).toBe(
          "occluded",
        );
      },
    );

    it(
      "derives facing exclusively from real authoritative displacement",
      () => {
        const transition =
          findActionTransition(
            "explore",
          );

        const model =
          deriveM3PresentationModel(
            transition
              .result
              .state,

            transition.before,

            transition
              .result
              .evidence,
          );

        expect(
          model
            .creature
            .motionState,
        ).toBe(
          "moving",
        );

        expect(
          model
            .creature
            .distanceMoved,
        ).toBeGreaterThan(
          0,
        );

        expect(
          model
            .creature
            .facingDirection,
        ).not.toBeNull();

        const deltaX =
          transition
            .result
            .state
            .position.x -
          transition
            .before
            .position.x;

        const deltaY =
          transition
            .result
            .state
            .position.y -
          transition
            .before
            .position.y;

        const distance =
          Math.hypot(
            deltaX,
            deltaY,
          );

        expect(
          model
            .creature
            .facingDirection
            ?.x,
        ).toBeCloseTo(
          deltaX /
            distance,
        );

        expect(
          model
            .creature
            .facingDirection
            ?.y,
        ).toBeCloseTo(
          deltaY /
            distance,
        );
      },
    );

    it(
      "does not invent facing toward hidden food while the Creature is stationary",
      () => {
        const state =
          createState();

        /*
         * Physical world truth contains food
         * east of the Creature.
         *
         * Presentation still cannot use that
         * hidden target to invent facing.
         */
        expect(
          state.food.position.x,
        ).toBeGreaterThan(
          state.position.x,
        );

        const model =
          deriveM3PresentationModel(
            state,
          );

        expect(
          model
            .creature
            .motionState,
        ).toBe(
          "stationary",
        );

        expect(
          model
            .creature
            .facingDirection,
        ).toBeNull();
      },
    );

    it(
      "labels exploration only when EXPLORE genuinely won",
      () => {
        const transition =
          findActionTransition(
            "explore",
          );

        expect(
          transition
            .result
            .evidence
            .selectedActionId,
        ).toBe(
          "explore",
        );

        const model =
          deriveM3PresentationModel(
            transition
              .result
              .state,

            transition.before,

            transition
              .result
              .evidence,
          );

        expect(
          model
            .creature
            .activityState,
        ).toBe(
          "exploring",
        );

        expect(
          model
            .creature
            .movementSource,
        ).toBe(
          "exploration",
        );
      },
    );

    it(
      "labels seeking only from a genuine SEEK-winning transition",
      () => {
        const transition =
          findActionTransition(
            "seek",
          );

        expect(
          transition
            .result
            .evidence
            .selectedActionId,
        ).toBe(
          "seek",
        );

        const model =
          deriveM3PresentationModel(
            transition
              .result
              .state,

            transition.before,

            transition
              .result
              .evidence,
          );

        expect(
          model
            .creature
            .activityState,
        ).toBe(
          "seeking",
        );

        expect(
          model
            .creature
            .movementSource,
        ).toBe(
          "seek",
        );
      },
    );

    it(
      "labels eating only after genuine physical consumption succeeds",
      () => {
        const transition =
          findActionTransition(
            "eat",
          );

        expect(
          transition
            .result
            .evidence
            .selectedActionId,
        ).toBe(
          "eat",
        );

        expect(
          transition
            .result
            .evidence
            .ate,
        ).toBe(
          true,
        );

        const model =
          deriveM3PresentationModel(
            transition
              .result
              .state,

            transition.before,

            transition
              .result
              .evidence,
          );

        expect(
          model
            .creature
            .activityState,
        ).toBe(
          "eating",
        );

        expect(
          model.food.available,
        ).toBe(
          false,
        );

        expect(
          model
            .environment
            .foodPerceptionState,
        ).toBe(
          "consumed",
        );
      },
    );

    it(
      "supports same-tick player world updates without pretending the Creature moved or acted",
      () => {
        const before =
          createState();

        const placement =
          applyM3PlayerFoodPlacement(
            before,

            {
              x: 2,
              y: 3,
            },

            0,
          );

        expect(
          placement
            .state
            .tickIndex,
        ).toBe(
          before.tickIndex,
        );

        expect(
          placement
            .state
            .simulationTimeSeconds,
        ).toBe(
          before
            .simulationTimeSeconds,
        );

        const model =
          deriveM3PresentationModel(
            placement.state,

            before,

            null,
          );

        expect(
          model.food.position,
        ).toEqual({
          x: 2,
          y: 3,
        });

        expect(
          model
            .environment
            .foodDirectlyPerceived,
        ).toBe(
          true,
        );

        expect(
          model
            .environment
            .foodPerceptionState,
        ).toBe(
          "visible",
        );

        expect(
          model
            .creature
            .motionState,
        ).toBe(
          "stationary",
        );

        expect(
          model
            .creature
            .distanceMoved,
        ).toBe(
          0,
        );

        expect(
          model
            .creature
            .activityState,
        ).toBe(
          "idle",
        );

        expect(
          model
            .creature
            .movementSource,
        ).toBeNull();
      },
    );

    it(
      "rejects missing or mismatched transition evidence",
      () => {
        const before =
          createState();

        const result =
          advanceM3AcquisitionTick(
            before,
          );

        expect(() =>
          deriveM3PresentationModel(
            result.state,
            before,
            null,
          ),
        ).toThrow(
          "M3 consecutive presentation states require completed tick evidence.",
        );

        expect(() =>
          deriveM3PresentationModel(
            result.state,
            null,
            result.evidence,
          ),
        ).toThrow(
          "M3 presentation cannot attach tick evidence without a previous authoritative state.",
        );

        expect(() =>
          deriveM3PresentationModel(
            result.state,

            before,

            {
              ...result.evidence,

              positionAfter: {
                x:
                  result
                    .evidence
                    .positionAfter
                    .x +
                  1,

                y:
                  result
                    .evidence
                    .positionAfter
                    .y,
              },
            },
          ),
        ).toThrow(
          "M3 presentation evidence positionAfter does not match current authoritative position.",
        );
      },
    );

    it(
      "rejects a same-tick external presentation update that moves the Creature",
      () => {
        const before =
          createState();

        const invalid: M3AcquisitionState = {
          ...before,

          position: {
            x:
              before.position.x +
              1,

            y:
              before.position.y,
          },
        };

        expect(() =>
          deriveM3PresentationModel(
            invalid,
            before,
            null,
          ),
        ).toThrow(
          "M3 external world presentation update cannot move the Creature.",
        );
      },
    );

    it(
      "observes authoritative state without mutating simulation or evidence",
      () => {
        const before =
          createState();

        const result =
          advanceM3AcquisitionTick(
            before,
          );

        const beforeSnapshot =
          JSON.stringify(
            before,
          );

        const stateSnapshot =
          JSON.stringify(
            result.state,
          );

        const evidenceSnapshot =
          JSON.stringify(
            result.evidence,
          );

        deriveM3PresentationModel(
          result.state,

          before,

          result.evidence,
        );

        expect(
          JSON.stringify(
            before,
          ),
        ).toBe(
          beforeSnapshot,
        );

        expect(
          JSON.stringify(
            result.state,
          ),
        ).toBe(
          stateSnapshot,
        );

        expect(
          JSON.stringify(
            result.evidence,
          ),
        ).toBe(
          evidenceSnapshot,
        );
      },
    );

    it(
      "keeps neural, learning and RNG internals outside the basic renderer contract",
      () => {
        const state =
          createState();

        const model =
          deriveM3PresentationModel(
            state,
          );

        expect(
          model,
        ).not.toHaveProperty(
          "brain",
        );

        expect(
          model,
        ).not.toHaveProperty(
          "rngState",
        );

        expect(
          model,
        ).not.toHaveProperty(
          "eligibilityTrace",
        );

        expect(
          model,
        ).not.toHaveProperty(
          "weightChanges",
        );

        expect(
          model.creature,
        ).not.toHaveProperty(
          "brain",
        );

        expect(
          model.creature,
        ).not.toHaveProperty(
          "rngState",
        );

        expect(
          model.creature,
        ).not.toHaveProperty(
          "explorationState",
        );
      },
    );

    it(
      "reproduces identical presentation from identical authoritative inputs",
      () => {
        const before =
          createState();

        const result =
          advanceM3AcquisitionTick(
            before,
          );

        const first =
          deriveM3PresentationModel(
            result.state,

            before,

            result.evidence,
          );

        const second =
          deriveM3PresentationModel(
            result.state,

            before,

            result.evidence,
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