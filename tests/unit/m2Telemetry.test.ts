import {
  describe,
  expect,
  it,
} from "vitest";

import {
  advanceM1Episode,
  createM1EpisodeState,
  type M1EpisodeState,
} from "../../src/simulation/core/m1Episode.js";

import {
  deriveM2EpisodeTelemetry,
} from "../../src/simulation/core/m2Telemetry.js";

import {
  FOOD_MEMORY_MIN_RECALL_CONFIDENCE,
} from "../../src/simulation/memory/foodMemory.js";

function runVisibleThenOccluded() {
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

  const afterVisible =
    advanceM1Episode(
      initial,
    );

  const visibleTelemetry =
    deriveM2EpisodeTelemetry(
      initial,
      afterVisible,
    );

  const occludedInput:
    M1EpisodeState = {
      ...afterVisible,

      foodOccluded:
        true,
  };

  const afterOccluded =
    advanceM1Episode(
      occludedInput,
    );

  const occludedTelemetry =
    deriveM2EpisodeTelemetry(
      occludedInput,
      afterOccluded,
    );

  return {
    initial,
    afterVisible,
    visibleTelemetry,

    occludedInput,
    afterOccluded,
    occludedTelemetry,
  };
}

function advanceToMinimumRecall() {
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

  const afterVisible =
    advanceM1Episode(
      initial,
    );

  let state:
    M1EpisodeState = {
      ...afterVisible,

      foodOccluded:
        true,

      /*
       * Keep the physical food safely away
       * while the remembered representation
       * decays.
       */
      food: {
        ...afterVisible.food,

        position: {
          x: 10,
          y: 0,
        },
      },
    };

  for (
    let step = 0;
    step < 20;
    step += 1
  ) {
    const memory =
      state.foodMemory ??
      null;

    if (memory === null) {
      throw new Error(
        "Telemetry expiration probe forgot memory before the minimum recall boundary.",
      );
    }

    if (
      memory.confidence ===
      FOOD_MEMORY_MIN_RECALL_CONFIDENCE
    ) {
      return state;
    }

    state =
      advanceM1Episode(
        state,
      );
  }

  throw new Error(
    "Telemetry expiration probe did not reach the minimum recall boundary.",
  );
}

describe(
  "M2.9 memory telemetry",
  () => {
    it("distinguishes legitimate current perception from memory encoding", () => {
      const probe =
        runVisibleThenOccluded();

      const telemetry =
        probe.visibleTelemetry;

      expect(
        telemetry.type,
      ).toBe(
        "m2-episode-transition",
      );

      expect(
        telemetry.foodOccluded,
      ).toBe(false);

      /*
       * Current perception exists.
       */
      expect(
        telemetry
          .directFoodSignal,
      ).not.toBeNull();

      /*
       * Recall is deliberately not
       * double-counted while direct current
       * evidence exists.
       */
      expect(
        telemetry
          .recallSignal,
      ).toBeNull();

      expect(
        telemetry
          .foodEvidenceSource,
      ).toBe(
        "direct-perception",
      );

      expect(
        telemetry
          .directFoodInputActivation,
      ).toBeGreaterThan(0);

      expect(
        telemetry
          .rememberedFoodInputActivation,
      ).toBe(0);

      expect(
        telemetry
          .memory
          .encoded,
      ).toBe(true);

      expect(
        telemetry
          .memory
          .before,
      ).toBeNull();

      expect(
        telemetry
          .memory
          .after,
      ).not.toBeNull();

      expect(
        telemetry
          .memory
          .after
          ?.rememberedDirectionX ??
          0,
      ).toBeGreaterThan(0);

      expect(
        telemetry
          .memory
          .after
          ?.ageSeconds,
      ).toBeDefined();

      expect(
        telemetry
          .memory
          .after
          ?.confidence,
      ).toBeDefined();

      expect(
        telemetry
          .selectedActionId,
      ).toBe("seek");

      expect(
        telemetry
          .movementDirectionSource,
      ).toBe(
        "direct-perception",
      );
    });

    it("distinguishes recalled evidence from direct perception after occlusion", () => {
      const probe =
        runVisibleThenOccluded();

      const telemetry =
        probe.occludedTelemetry;

      expect(
        telemetry.foodOccluded,
      ).toBe(true);

      expect(
        telemetry
          .directFoodSignal,
      ).toBeNull();

      expect(
        telemetry
          .recallSignal,
      ).not.toBeNull();

      expect(
        telemetry
          .foodEvidenceSource,
      ).toBe(
        "memory-recall",
      );

      /*
       * The neural channels also remain
       * explicitly distinct.
       */
      expect(
        telemetry
          .directFoodInputActivation,
      ).toBe(0);

      expect(
        telemetry
          .rememberedFoodInputActivation,
      ).toBeGreaterThan(0);

      expect(
        telemetry
          .recallSignal
          ?.ageSeconds,
      ).toBeDefined();

      expect(
        telemetry
          .recallSignal
          ?.confidence,
      ).toBeDefined();

      expect(
        telemetry
          .recallSignal
          ?.directionX ??
          0,
      ).toBeGreaterThan(0);

      expect(
        telemetry
          .memory
          .decayed,
      ).toBe(true);

      expect(
        telemetry
          .memory
          .after
          ?.confidence ??
          1,
      ).toBeLessThan(
        telemetry
          .memory
          .before
          ?.confidence ??
          0,
      );

      expect(
        telemetry
          .selectedActionId,
      ).toBe("seek");

      expect(
        telemetry
          .movementDirectionSource,
      ).toBe(
        "memory-recall",
      );

      expect(
        telemetry
          .movementDirection
          ?.x ??
          0,
      ).toBeGreaterThan(0);
    });

    it("records action candidate competition as well as the selected action", () => {
      const probe =
        runVisibleThenOccluded();

      const telemetry =
        probe.occludedTelemetry;

      expect(
        telemetry
          .actionCandidates,
      ).toHaveLength(3);

      const idle =
        telemetry
          .actionCandidates
          .find(
            (candidate) =>
              candidate
                .actionId ===
              "idle",
          );

      const seek =
        telemetry
          .actionCandidates
          .find(
            (candidate) =>
              candidate
                .actionId ===
              "seek",
          );

      const eat =
        telemetry
          .actionCandidates
          .find(
            (candidate) =>
              candidate
                .actionId ===
              "eat",
          );

      expect(
        idle,
      ).toBeDefined();

      expect(
        seek,
      ).toBeDefined();

      expect(
        eat,
      ).toBeDefined();

      expect(
        seek?.activation ??
          0,
      ).toBeGreaterThan(
        idle?.activation ??
          0,
      );

      expect(
        telemetry
          .selectedActionId,
      ).toBe("seek");
    });

    it("records stale-memory correction separately from ordinary recall", () => {
      /*
       * First acquire eastward memory.
       */
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

      const afterEastVisible =
        advanceM1Episode(
          initial,
        );

      /*
       * Move the same hidden food west.
       */
      const hiddenWestInput:
        M1EpisodeState = {
          ...afterEastVisible,

          foodOccluded:
            true,

          food: {
            ...afterEastVisible
              .food,

            position: {
              x: 0,
              y: 0,
            },
          },
        };

      const afterHiddenWest =
        advanceM1Episode(
          hiddenWestInput,
        );

      /*
       * Now make that contradictory new
       * position legitimately visible.
       */
      const correctionInput:
        M1EpisodeState = {
          ...afterHiddenWest,

          foodOccluded:
            false,
      };

      const afterCorrection =
        advanceM1Episode(
          correctionInput,
        );

      const telemetry =
        deriveM2EpisodeTelemetry(
          correctionInput,
          afterCorrection,
        );

      expect(
        telemetry
          .directFoodSignal
          ?.directionX ??
          0,
      ).toBeLessThan(0);

      expect(
        telemetry
          .recallSignal,
      ).toBeNull();

      expect(
        telemetry
          .foodEvidenceSource,
      ).toBe(
        "direct-perception",
      );

      expect(
        telemetry
          .memory
          .refreshed,
      ).toBe(true);

      expect(
        telemetry
          .memory
          .corrected,
      ).toBe(true);

      /*
       * Before correction the persistent
       * memory still represented east.
       */
      expect(
        telemetry
          .memory
          .before
          ?.rememberedDirectionX ??
          0,
      ).toBeGreaterThan(0);

      /*
       * After legitimate new evidence the
       * persistent trace represents west.
       */
      expect(
        telemetry
          .memory
          .after
          ?.rememberedDirectionX ??
          0,
      ).toBeLessThan(0);

      expect(
        telemetry
          .movementDirectionSource,
      ).toBe(
        "direct-perception",
      );

      expect(
        telemetry
          .movementDirection
          ?.x ??
          0,
      ).toBeLessThan(0);
    });

    it("records expiration while also showing that the final valid recall was available during that tick", () => {
      const atMinimum =
        advanceToMinimumRecall();

      expect(
        atMinimum
          .foodMemory
          ?.confidence,
      ).toBe(
        FOOD_MEMORY_MIN_RECALL_CONFIDENCE,
      );

      const afterExpiration =
        advanceM1Episode(
          atMinimum,
        );

      const telemetry =
        deriveM2EpisodeTelemetry(
          atMinimum,
          afterExpiration,
        );

      /*
       * The tick began with a still-usable
       * memory.
       */
      expect(
        telemetry
          .recallSignal,
      ).not.toBeNull();

      expect(
        telemetry
          .recallSignal
          ?.confidence,
      ).toBe(
        FOOD_MEMORY_MIN_RECALL_CONFIDENCE,
      );

      /*
       * That final recall still participated
       * through the normal memory neural
       * channel.
       */
      expect(
        telemetry
          .rememberedFoodInputActivation,
      ).toBeGreaterThan(0);

      /*
       * But end-of-tick deterministic ageing
       * crossed the threshold and removed the
       * persistent trace.
       */
      expect(
        telemetry
          .memory
          .expired,
      ).toBe(true);

      expect(
        telemetry
          .memory
          .after,
      ).toBeNull();

      expect(
        afterExpiration
          .foodMemory,
      ).toBeNull();
    });

    it("shows no food-information source on the first tick after memory expiration", () => {
      const atMinimum =
        advanceToMinimumRecall();

      const expiredInput =
        advanceM1Episode(
          atMinimum,
        );

      expect(
        expiredInput
          .foodMemory,
      ).toBeNull();

      const afterExpiredTick =
        advanceM1Episode(
          expiredInput,
        );

      const telemetry =
        deriveM2EpisodeTelemetry(
          expiredInput,
          afterExpiredTick,
        );

      expect(
        telemetry
          .directFoodSignal,
      ).toBeNull();

      expect(
        telemetry
          .recallSignal,
      ).toBeNull();

      expect(
        telemetry
          .foodEvidenceSource,
      ).toBe("none");

      expect(
        telemetry
          .directFoodInputActivation,
      ).toBe(0);

      expect(
        telemetry
          .rememberedFoodInputActivation,
      ).toBe(0);

      expect(
        telemetry
          .movementDirectionSource,
      ).toBeNull();

      expect(
        telemetry
          .movementDirection,
      ).toBeNull();
    });

    it("rejects non-consecutive states instead of presenting misleading telemetry", () => {
      const initial =
        createM1EpisodeState(
          {
            learningEnabled:
              false,

            memoryEnabled:
              true,

            foodX:
              3,
          },
        );

      const afterFirst =
        advanceM1Episode(
          initial,
        );

      const afterSecond =
        advanceM1Episode(
          afterFirst,
        );

      expect(() =>
        deriveM2EpisodeTelemetry(
          initial,
          afterSecond,
        ),
      ).toThrow(
        "M2 telemetry requires consecutive episode states.",
      );
    });
  },
);