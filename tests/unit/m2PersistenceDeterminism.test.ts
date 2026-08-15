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
  type M1EpisodeState,
} from "../../src/simulation/core/m1Episode.js";

import {
  deriveM2EpisodeTelemetry,
} from "../../src/simulation/core/m2Telemetry.js";

import {
  recallFoodMemory,
} from "../../src/simulation/memory/foodMemory.js";

function createActiveMemoryCheckpoint():
  M1EpisodeState {
  const initial =
    createM1EpisodeState(
      {
        learningEnabled:
          true,

        memoryEnabled:
          true,

        /*
         * Far enough away that several
         * memory-guided ticks can occur
         * without reaching the food.
         */
        foodX:
          5,

        foodOccluded:
          false,
      },
    );

  /*
   * Legitimate direct perception forms the
   * memory.
   */
  const afterVisibleTick =
    advanceM1Episode(
      initial,
    );

  /*
   * Direct perception then disappears.
   */
  const occludedInput:
    M1EpisodeState = {
      ...afterVisibleTick,

      foodOccluded:
        true,
  };

  /*
   * Memory is now actively participating in
   * cognition and has aged further.
   */
  return advanceM1Episode(
    occludedInput,
  );
}

function runDeterministicM2Trace() {
  let state =
    createM1EpisodeState(
      {
        learningEnabled:
          true,

        memoryEnabled:
          true,

        foodX:
          5,

        foodOccluded:
          false,
      },
    );

  const occlusionSequence =
    [
      false,
      true,
      true,
      true,
    ] as const;

  const states:
    M1EpisodeState[] = [];

  const telemetry:
    ReturnType<
      typeof deriveM2EpisodeTelemetry
    >[] = [];

  for (
    const foodOccluded
    of occlusionSequence
  ) {
    const before:
      M1EpisodeState = {
        ...state,

        foodOccluded,
    };

    const after =
      advanceM1Episode(
        before,
      );

    telemetry.push(
      deriveM2EpisodeTelemetry(
        before,
        after,
      ),
    );

    states.push(
      after,
    );

    state =
      after;
  }

  return {
    states,
    telemetry,
    finalState:
      state,
  };
}

describe(
  "M2.9 persistence and deterministic replay",
  () => {
    it("round-trips active memory and all relevant episode state through serialization", () => {
      const checkpoint =
        createActiveMemoryCheckpoint();

      expect(
        checkpoint.foodMemory,
      ).not.toBeNull();

      expect(
        recallFoodMemory(
          checkpoint
            .foodMemory ??
            null,
        ),
      ).not.toBeNull();

      expect(
        checkpoint
          .simulationTimeSeconds,
      ).toBeDefined();

      expect(
        checkpoint
          .eligibilityTrace
          .length,
      ).toBeGreaterThan(0);

      const serialized =
        serializeM1EpisodeState(
          checkpoint,
        );

      const restored =
        deserializeM1EpisodeState(
          serialized,
        );

      /*
       * Full-state equality proves that the
       * checkpoint preserves:
       *
       * - Creature position
       * - biology
       * - food/world state
       * - occlusion
       * - brain activations and weights
       * - neural eligibility
       * - food memory
       * - memory age
       * - memory confidence
       * - remembered direction
       * - tick/time
       */
      expect(
        restored,
      ).toEqual(
        checkpoint,
      );

      expect(
        restored.foodMemory,
      ).toEqual(
        checkpoint.foodMemory,
      );

      expect(
        restored
          .foodMemory
          ?.ageSeconds,
      ).toBe(
        checkpoint
          .foodMemory
          ?.ageSeconds,
      );

      expect(
        restored
          .foodMemory
          ?.confidence,
      ).toBe(
        checkpoint
          .foodMemory
          ?.confidence,
      );

      expect(
        restored
          .foodMemory
          ?.rememberedDirectionX,
      ).toBe(
        checkpoint
          .foodMemory
          ?.rememberedDirectionX,
      );

      expect(
        restored
          .foodMemory
          ?.rememberedDirectionY,
      ).toBe(
        checkpoint
          .foodMemory
          ?.rememberedDirectionY,
      );

      expect(
        restored.brain,
      ).toEqual(
        checkpoint.brain,
      );

      expect(
        restored
          .eligibilityTrace,
      ).toEqual(
        checkpoint
          .eligibilityTrace,
      );

      expect(
        restored.tickIndex,
      ).toBe(
        checkpoint.tickIndex,
      );

      expect(
        restored
          .simulationTimeSeconds,
      ).toBe(
        checkpoint
          .simulationTimeSeconds,
      );
    });

    it("preserves the same usable recall across save and reload", () => {
      const checkpoint =
        createActiveMemoryCheckpoint();

      const recallBeforeSave =
        recallFoodMemory(
          checkpoint
            .foodMemory ??
            null,
        );

      expect(
        recallBeforeSave,
      ).not.toBeNull();

      const restored =
        deserializeM1EpisodeState(
          serializeM1EpisodeState(
            checkpoint,
          ),
        );

      const recallAfterReload =
        recallFoodMemory(
          restored
            .foodMemory ??
            null,
        );

      expect(
        recallAfterReload,
      ).toEqual(
        recallBeforeSave,
      );
    });

    it("continues identically after reloading an active memory checkpoint", () => {
      const checkpoint =
        createActiveMemoryCheckpoint();

      /*
       * UNINTERRUPTED
       */
      const uninterrupted =
        advanceM1Episode(
          checkpoint,
        );

      /*
       * SAVE / RELOAD
       */
      const restored =
        deserializeM1EpisodeState(
          serializeM1EpisodeState(
            checkpoint,
          ),
        );

      const resumed =
        advanceM1Episode(
          restored,
        );

      expect(
        resumed,
      ).toEqual(
        uninterrupted,
      );

      /*
       * This equality includes the next
       * deterministic memory decay, neural
       * activation, selected action,
       * movement, biology and eligibility.
       */
      expect(
        resumed.foodMemory,
      ).toEqual(
        uninterrupted
          .foodMemory,
      );

      expect(
        resumed.position,
      ).toEqual(
        uninterrupted
          .position,
      );

      expect(
        resumed.brain,
      ).toEqual(
        uninterrupted.brain,
      );

      expect(
        resumed
          .eligibilityTrace,
      ).toEqual(
        uninterrupted
          .eligibilityTrace,
      );
    });

    it("produces an identical full M2 trace from identical initial conditions and occlusion timing", () => {
      const first =
        runDeterministicM2Trace();

      const second =
        runDeterministicM2Trace();

      expect(
        second.states,
      ).toEqual(
        first.states,
      );

      expect(
        second.telemetry,
      ).toEqual(
        first.telemetry,
      );

      expect(
        second.finalState,
      ).toEqual(
        first.finalState,
      );
    });

    it("reproduces memory encoding, decay, action competition and movement exactly", () => {
      const first =
        runDeterministicM2Trace();

      const second =
        runDeterministicM2Trace();

      expect(
        first.states.length,
      ).toBeGreaterThan(2);

      for (
        let index = 0;
        index <
        first.states.length;
        index += 1
      ) {
        const firstState =
          first.states[index]!;

        const secondState =
          second.states[index]!;

        expect(
          secondState
            .foodMemory,
        ).toEqual(
          firstState
            .foodMemory,
        );

        expect(
          secondState.brain,
        ).toEqual(
          firstState.brain,
        );

        expect(
          secondState.position,
        ).toEqual(
          firstState.position,
        );

        expect(
          secondState.hunger,
        ).toEqual(
          firstState.hunger,
        );

        expect(
          secondState
            .simulationTimeSeconds,
        ).toBe(
          firstState
            .simulationTimeSeconds,
        );
      }
    });
  },
);