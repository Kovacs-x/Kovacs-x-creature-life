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
  V0_SENSORY_OCCLUDER_X,
  V0_SENSORY_OCCLUDER_MIN_Y,
  V0_SENSORY_OCCLUDER_MAX_Y,
} from "../../src/simulation/core/v0Habitat.js";

describe(
  "V0.4 sensory occluder presentation",
  () => {
    it("presents the screen as inactive before the first direct experience", () => {
      const initial =
        createM1EpisodeState(
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

      const model =
        deriveV0PresentationModel(
          initial,
        );

      expect(
        model
          .environment
          .sensoryOccluder
          .active,
      ).toBe(false);

      expect(
        model
          .environment
          .sensoryOccluder
          .x,
      ).toBe(
        V0_SENSORY_OCCLUDER_X,
      );

      expect(
        model
          .environment
          .sensoryOccluder
          .minY,
      ).toBe(
        V0_SENSORY_OCCLUDER_MIN_Y,
      );

      expect(
        model
          .environment
          .sensoryOccluder
          .maxY,
      ).toBe(
        V0_SENSORY_OCCLUDER_MAX_Y,
      );

      expect(
        model
          .environment
          .foodOccludedForCreature,
      ).toBe(false);
    });

    it("presents an active screen and authoritative occlusion after the first V0 tick", () => {
      const initial =
        createM1EpisodeState(
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

      const afterFirst =
        advanceV0Habitat(
          initial,
        );

      const model =
        deriveV0PresentationModel(
          afterFirst,
          initial,
        );

      expect(
        model
          .environment
          .sensoryOccluder
          .active,
      ).toBe(true);

      expect(
        model
          .environment
          .foodOccludedForCreature,
      ).toBe(true);

      /*
       * Physical food remains visible in the
       * world presentation even though direct
       * sensory access from the Creature is
       * blocked.
       */
      expect(
        model
          .food
          .available,
      ).toBe(true);

      expect(
        model
          .food
          .position,
      ).toEqual(
        afterFirst.food.position,
      );
    });

    it("keeps the screen active while visibility naturally returns after crossing it", () => {
      const initial =
        createM1EpisodeState(
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

      const model =
        deriveV0PresentationModel(
          afterThird,
          afterSecond,
        );

      expect(
        model
          .environment
          .sensoryOccluder
          .active,
      ).toBe(true);

      expect(
        model
          .environment
          .foodOccludedForCreature,
      ).toBe(false);

      expect(
        afterThird.position.x,
      ).toBeGreaterThan(
        V0_SENSORY_OCCLUDER_X,
      );
    });
  },
);