import {
  describe,
  expect,
  it,
} from "vitest";

import {
  advanceM1Episode,
  createM1EpisodeState,
  deserializeM1EpisodeState,
  serializeM1EpisodeState,
} from "../../src/simulation/core/m1Episode.js";

describe(
  "M2 stepped episode food occlusion",
  () => {
    it("preserves existing M1 behaviour when occlusion is omitted", () => {
      const implicitVisible =
        createM1EpisodeState({
          learningEnabled: false,
          foodX: 3,
        });

      const explicitVisible =
        createM1EpisodeState({
          learningEnabled: false,
          foodX: 3,
          foodOccluded: false,
        });

      expect(
        implicitVisible,
      ).toEqual(
        explicitVisible,
      );

      expect(
        advanceM1Episode(
          implicitVisible,
        ),
      ).toEqual(
        advanceM1Episode(
          explicitVisible,
        ),
      );
    });

    it("can keep food physically present while occlusion removes its behavioural perceptual support", () => {
      const initial =
        createM1EpisodeState({
          learningEnabled: false,

          /*
           * Three units keeps food outside
           * contact range after the first
           * one-unit SEEK movement.
           */
          foodX: 3,

          foodOccluded: false,
        });

      /*
       * TICK 1
       *
       * Food is genuinely visible.
       * Existing M1 perception supports
       * SEEK and movement toward it.
       */
      const afterVisibleTick =
        advanceM1Episode(
          initial,
        );

      expect(
        afterVisibleTick
          .position.x,
      ).toBeGreaterThan(
        initial.position.x,
      );

      expect(
        afterVisibleTick
          .food.consumed,
      ).toBe(false);

      const foodBeforeOcclusion =
        afterVisibleTick.food;

      /*
       * Environmental intervention:
       *
       * the food remains exactly where it
       * was and remains unconsumed, but is
       * no longer available to direct food
       * perception.
       */
      const occludedState = {
        ...afterVisibleTick,

        foodOccluded: true,
      };

      const visibleControlState = {
        ...afterVisibleTick,

        foodOccluded: false,
      };

      /*
       * TICK 2 — OCCLUDED
       *
       * No memory is connected to the brain
       * yet, so loss of direct perception
       * removes the food support for SEEK.
       */
      const afterOccludedTick =
        advanceM1Episode(
          occludedState,
        );

      /*
       * Identical control except food remains
       * directly perceptible.
       */
      const afterVisibleControlTick =
        advanceM1Episode(
          visibleControlState,
        );

      /*
       * The underlying food was not deleted,
       * moved or consumed to create null
       * perception.
       */
      expect(
        afterOccludedTick.food,
      ).toEqual(
        foodBeforeOcclusion,
      );

      expect(
        afterOccludedTick
          .food.consumed,
      ).toBe(false);

      /*
       * With no memory integration yet, the
       * occluded branch has no equivalent
       * second SEEK movement.
       */
      expect(
        afterOccludedTick.position,
      ).toEqual(
        afterVisibleTick.position,
      );

      /*
       * The otherwise equivalent visible
       * control still receives legitimate
       * direct perceptual support and moves
       * farther toward the food.
       */
      expect(
        afterVisibleControlTick
          .position.x,
      ).toBeGreaterThan(
        afterOccludedTick
          .position.x,
      );
    });

    it("preserves the current occlusion condition through episode serialization", () => {
      const initial =
        createM1EpisodeState({
          learningEnabled: false,
          foodX: 3,
          foodOccluded: true,
        });

      const serialized =
        serializeM1EpisodeState(
          initial,
        );

      const restored =
        deserializeM1EpisodeState(
          serialized,
        );

      expect(
        restored,
      ).toEqual(
        initial,
      );

      expect(
        restored.foodOccluded,
      ).toBe(true);

      expect(
        restored.food.consumed,
      ).toBe(false);
    });
  },
);