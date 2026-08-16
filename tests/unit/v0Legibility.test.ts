import {
  describe,
  expect,
  it,
} from "vitest";

import {
  deriveV0PresentationModel,
} from "../../src/rendering/v0Presentation.js";

import {
  createM1EpisodeState,
} from "../../src/simulation/core/m1Episode.js";

import {
  advanceV0Habitat,
} from "../../src/simulation/core/v0Habitat.js";

function createV0LegibilityState() {
  return createM1EpisodeState(
    {
      learningEnabled:
        false,

      memoryEnabled:
        true,

      foodX:
        3,

      foodOccluded:
        false,
    },
  );
}

describe(
  "V0.6 legible presentation",
  () => {
    it("begins idle in the direct-perception scenario context", () => {
      const initial =
        createV0LegibilityState();

      const model =
        deriveV0PresentationModel(
          initial,
        );

      expect(
        model.creature
          .activityState,
      ).toBe(
        "idle",
      );

      expect(
        model.environment
          .scenarioContext,
      ).toBe(
        "direct-perception",
      );

      expect(
        model.creature
          .hungerFraction,
      ).toBeCloseTo(
        0.9,
      );
    });

    it("reports locomotion from actual authoritative displacement", () => {
      const before =
        createV0LegibilityState();

      const after =
        advanceV0Habitat(
          before,
        );

      const model =
        deriveV0PresentationModel(
          after,
          before,
        );

      expect(
        after.position.x,
      ).toBeGreaterThan(
        before.position.x,
      );

      expect(
        model.creature
          .motionState,
      ).toBe(
        "moving",
      );

      expect(
        model.creature
          .activityState,
      ).toBe(
        "locomotion",
      );
    });

    it("marks the blocked-sight phase as a memory challenge without claiming an action cause", () => {
      const initial =
        createV0LegibilityState();

      const afterFirst =
        advanceV0Habitat(
          initial,
        );

      expect(
        afterFirst
          .foodOccluded,
      ).toBe(true);

      const model =
        deriveV0PresentationModel(
          afterFirst,
          initial,
        );

      expect(
        model.environment
          .scenarioContext,
      ).toBe(
        "memory-challenge",
      );

      /*
       * The ordinary presentation model still
       * does not expose raw memory internals or
       * claim that recall caused this tick's
       * movement.
       */
      expect(
        model,
      ).not.toHaveProperty(
        "foodMemory",
      );

      expect(
        model.creature,
      ).not.toHaveProperty(
        "foodMemory",
      );

      expect(
        model.environment,
      ).not.toHaveProperty(
        "movementDirectionSource",
      );
    });

    it("reports direct perception restored after crossing the active non-solid screen", () => {
      const initial =
        createV0LegibilityState();

      const afterFirst =
        advanceV0Habitat(
          initial,
        );

      const afterSecond =
        advanceV0Habitat(
          afterFirst,
        );

      const afterThird =
        advanceV0Habitat(
          afterSecond,
        );

      expect(
        afterThird
          .foodOccluded,
      ).toBe(false);

      const model =
        deriveV0PresentationModel(
          afterThird,
          afterSecond,
        );

      expect(
        model.environment
          .sensoryOccluder
          .active,
      ).toBe(true);

      expect(
        model.environment
          .scenarioContext,
      ).toBe(
        "direct-perception-restored",
      );
    });

    it("reports eating only from a genuine food-consumption transition", () => {
      let state =
        createV0LegibilityState();

      let previous =
        state;

      for (
        let index = 0;
        index < 10 &&
        !state.complete;
        index += 1
      ) {
        previous =
          state;

        state =
          advanceV0Habitat(
            state,
          );
      }

      expect(
        state.complete,
      ).toBe(true);

      expect(
        previous.food
          .consumed,
      ).toBe(false);

      expect(
        state.food
          .consumed,
      ).toBe(true);

      const model =
        deriveV0PresentationModel(
          state,
          previous,
        );

      expect(
        model.creature
          .activityState,
      ).toBe(
        "eating",
      );

      expect(
        model.environment
          .scenarioContext,
      ).toBe(
        "food-consumed",
      );

      expect(
        model.food.available,
      ).toBe(false);
    });

    it("does not turn stationary hidden-world information into locomotion or purposeful facing", () => {
      const state =
        createM1EpisodeState(
          {
            learningEnabled:
              false,

            memoryEnabled:
              false,

            foodX:
              3,

            foodOccluded:
              true,
          },
        );

      const model =
        deriveV0PresentationModel(
          state,
        );

      expect(
        model.creature
          .activityState,
      ).toBe(
        "idle",
      );

      expect(
        model.creature
          .motionState,
      ).toBe(
        "stationary",
      );

      expect(
        model.creature
          .facingDirection,
      ).toBeNull();
    });
  },
);