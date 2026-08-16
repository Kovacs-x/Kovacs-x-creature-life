import {
  describe,
  expect,
  it,
} from "vitest";

import {
  advanceM1Episode,
  createM1EpisodeState,
} from "../../src/simulation/core/m1Episode.js";

import {
  deriveM2EpisodeTelemetry,
} from "../../src/simulation/core/m2Telemetry.js";

import {
  advanceV0Habitat,
  deriveV0HabitatEnvironment,
  V0_SENSORY_OCCLUDER_ACTIVATION_TICK,
  V0_SENSORY_OCCLUDER_X,
} from "../../src/simulation/core/v0Habitat.js";

function createV0EnvironmentTestState() {
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
  "V0.4 causal habitat occlusion",
  () => {
    it("begins with direct sight unobstructed", () => {
      const initial =
        createV0EnvironmentTestState();

      const environment =
        deriveV0HabitatEnvironment(
          initial,
        );

      expect(
        initial.tickIndex,
      ).toBe(0);

      expect(
        V0_SENSORY_OCCLUDER_ACTIVATION_TICK,
      ).toBe(1);

      expect(
        environment
          .sensoryOccluder
          .active,
      ).toBe(false);

      expect(
        environment.foodOccluded,
      ).toBe(false);
    });

    it("allows legitimate direct perception before activating the screen", () => {
      const initial =
        createV0EnvironmentTestState();

      /*
       * This is the accepted episode result for
       * the first tick before the V0 environment
       * changes at the resulting simulation
       * time.
       */
      const acceptedFirstTick =
        advanceM1Episode(
          initial,
        );

      const firstV0Tick =
        advanceV0Habitat(
          initial,
        );

      expect(
        firstV0Tick.tickIndex,
      ).toBe(1);

      /*
       * Creature behaviour itself is unchanged
       * by the post-tick environment update.
       */
      expect(
        firstV0Tick.position,
      ).toEqual(
        acceptedFirstTick.position,
      );

      expect(
        firstV0Tick.brain,
      ).toEqual(
        acceptedFirstTick.brain,
      );

      expect(
        firstV0Tick.foodMemory,
      ).toEqual(
        acceptedFirstTick.foodMemory,
      );

      expect(
        firstV0Tick.foodMemory,
      ).not.toBeNull();

      /*
       * The only new fact is the current
       * environment at tick 1.
       */
      expect(
        acceptedFirstTick
          .foodOccluded,
      ).toBe(false);

      expect(
        firstV0Tick
          .foodOccluded,
      ).toBe(true);

      const environment =
        deriveV0HabitatEnvironment(
          firstV0Tick,
        );

      expect(
        environment
          .sensoryOccluder
          .active,
      ).toBe(true);

      expect(
        environment
          .sensoryOccluder
          .x,
      ).toBe(
        V0_SENSORY_OCCLUDER_X,
      );

      expect(
        environment.foodOccluded,
      ).toBe(true);
    });

    it("causes the next tick to use legitimate M2 recall rather than direct food perception", () => {
      const initial =
        createV0EnvironmentTestState();

      const afterDirectExperience =
        advanceV0Habitat(
          initial,
        );

      expect(
        afterDirectExperience
          .foodOccluded,
      ).toBe(true);

      const afterOccludedTick =
        advanceV0Habitat(
          afterDirectExperience,
        );

      const telemetry =
        deriveM2EpisodeTelemetry(
          afterDirectExperience,
          afterOccludedTick,
        );

      expect(
        telemetry.foodOccluded,
      ).toBe(true);

      expect(
        telemetry.directFoodSignal,
      ).toBeNull();

      expect(
        telemetry.recallSignal,
      ).not.toBeNull();

      expect(
        telemetry
          .foodEvidenceSource,
      ).toBe(
        "memory-recall",
      );

      expect(
        telemetry
          .directFoodInputActivation,
      ).toBe(0);

      expect(
        telemetry
          .rememberedFoodInputActivation,
      ).toBeGreaterThan(0);

      expect(
        telemetry.selectedActionId,
      ).toBe(
        "seek",
      );

      expect(
        telemetry
          .movementDirectionSource,
      ).toBe(
        "memory-recall",
      );

      expect(
        afterOccludedTick
          .position
          .x,
      ).toBeGreaterThan(
        afterDirectExperience
          .position
          .x,
      );
    });

    it("naturally restores direct visibility after the Creature crosses the non-solid screen", () => {
      const initial =
        createV0EnvironmentTestState();

      const afterFirst =
        advanceV0Habitat(
          initial,
        );

      const afterSecond =
        advanceV0Habitat(
          afterFirst,
        );

      expect(
        afterSecond.position.x,
      ).toBeLessThan(
        V0_SENSORY_OCCLUDER_X,
      );

      expect(
        afterSecond
          .foodOccluded,
      ).toBe(true);

      const afterThird =
        advanceV0Habitat(
          afterSecond,
        );

      expect(
        afterThird.position.x,
      ).toBeGreaterThan(
        V0_SENSORY_OCCLUDER_X,
      );

      expect(
        afterThird
          .foodOccluded,
      ).toBe(false);

      expect(
        deriveV0HabitatEnvironment(
          afterThird,
        ).foodOccluded,
      ).toBe(false);
    });

    it("is deterministic for identical initial state and environment schedule", () => {
      const run =
        () => {
          let state =
            createV0EnvironmentTestState();

          state =
            advanceV0Habitat(
              state,
            );

          state =
            advanceV0Habitat(
              state,
            );

          state =
            advanceV0Habitat(
              state,
            );

          return state;
        };

      expect(
        run(),
      ).toEqual(
        run(),
      );
    });
  },
);