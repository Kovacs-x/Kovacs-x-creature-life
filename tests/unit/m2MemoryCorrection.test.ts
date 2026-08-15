import {
  describe,
  expect,
  it,
} from "vitest";

import {
  M1_NODE_IDS,
} from "../../src/simulation/brain/m1Brain.js";

import {
  advanceM1Episode,
  createM1EpisodeState,
  M1_EPISODE_PERCEPTION_RANGE,
  type M1EpisodeState,
} from "../../src/simulation/core/m1Episode.js";

import {
  recallFoodMemory,
} from "../../src/simulation/memory/foodMemory.js";

import {
  perceiveFood,
} from "../../src/simulation/senses/foodPerception.js";

function getActivation(
  state:
    M1EpisodeState,

  nodeId:
    string,
): number {
  const node =
    state.brain.nodes.find(
      (candidate) =>
        candidate.id ===
        nodeId,
    );

  if (node === undefined) {
    throw new Error(
      `Missing brain node: ${nodeId}`,
    );
  }

  return node.activation;
}

function runCorrectionProbe() {
  /*
   * TICK 0
   *
   * Food begins visibly east.
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

  /*
   * TICK 1
   *
   * Legitimate eastward perception creates
   * the original memory.
   */
  const afterEastVisible =
    advanceM1Episode(
      initial,
    );

  const eastRecall =
    recallFoodMemory(
      afterEastVisible
        .foodMemory ??
        null,
    );

  if (eastRecall === null) {
    throw new Error(
      "Correction probe requires an initial legitimate eastward memory.",
    );
  }

  /*
   * WORLD INTERVENTION
   *
   * The same food object is relocated west
   * while hidden.
   */
  const hiddenWestInput:
    M1EpisodeState = {
      ...afterEastVisible,

      foodOccluded:
        true,

      food: {
        ...afterEastVisible.food,

        position: {
          x: 0,
          y: 0,
        },
      },
    };

  /*
   * TICK 2
   *
   * While the contradictory new world state
   * remains hidden, the Creature still acts
   * from stale eastward memory.
   */
  const afterHiddenWest =
    advanceM1Episode(
      hiddenWestInput,
    );

  const staleRecall =
    recallFoodMemory(
      afterHiddenWest
        .foodMemory ??
        null,
    );

  if (staleRecall === null) {
    throw new Error(
      "Correction probe requires usable stale memory before re-perception.",
    );
  }

  /*
   * RE-PERCEPTION INPUT
   *
   * The relocated westward food becomes
   * legitimately visible.
   */
  const westVisibleInput:
    M1EpisodeState = {
      ...afterHiddenWest,

      foodOccluded:
        false,
    };

  const westDirectSignal =
    perceiveFood(
      westVisibleInput.position,

      westVisibleInput.food,

      {
        maxRange:
          M1_EPISODE_PERCEPTION_RANGE,
      },

      {
        occluded:
          false,
      },
    );

  if (westDirectSignal === null) {
    throw new Error(
      "Correction probe requires legitimate westward re-perception.",
    );
  }

  /*
   * TICK 3
   *
   * Current legitimate evidence must replace
   * the contradictory stale memory.
   */
  const afterWestVisible =
    advanceM1Episode(
      westVisibleInput,
    );

  const correctedRecall =
    recallFoodMemory(
      afterWestVisible
        .foodMemory ??
        null,
    );

  if (correctedRecall === null) {
    throw new Error(
      "Correction probe requires refreshed memory after re-perception.",
    );
  }

  return {
    afterEastVisible,
    eastRecall,

    hiddenWestInput,
    afterHiddenWest,
    staleRecall,

    westVisibleInput,
    westDirectSignal,

    afterWestVisible,
    correctedRecall,
  };
}

describe(
  "M2.7 correction by new sensory evidence",
  () => {
    it("begins with a legitimate eastward memory that becomes stale after hidden relocation west", () => {
      const probe =
        runCorrectionProbe();

      expect(
        probe.eastRecall.directionX,
      ).toBeGreaterThan(0);

      /*
       * The hidden relocation does not alter
       * the same object's identity.
       */
      expect(
        probe
          .hiddenWestInput
          .food
          .id,
      ).toBe(
        probe
          .afterEastVisible
          .food
          .id,
      );

      /*
       * While hidden, memory remains eastward
       * even though current world truth has
       * moved west.
       */
      expect(
        probe.staleRecall.directionX,
      ).toBeGreaterThan(0);

      expect(
        probe
          .hiddenWestInput
          .food
          .position
          .x,
      ).toBeLessThan(
        probe
          .hiddenWestInput
          .position
          .x,
      );
    });

    it("receives legitimate contradictory westward perception when the relocated food becomes visible", () => {
      const probe =
        runCorrectionProbe();

      /*
       * Before visibility returns, retained
       * memory still points east.
       */
      expect(
        probe.staleRecall.directionX,
      ).toBeGreaterThan(0);

      /*
       * Current legitimate perception now
       * points west.
       */
      expect(
        probe
          .westDirectSignal
          .directionX,
      ).toBeLessThan(0);

      expect(
        probe
          .westDirectSignal
          .directionY,
      ).toBeCloseTo(0);
    });

    it("gives current direct perception neural priority over stale recall during correction", () => {
      const probe =
        runCorrectionProbe();

      /*
       * Direct current evidence is active.
       */
      expect(
        getActivation(
          probe.afterWestVisible,

          M1_NODE_IDS.foodInput,
        ),
      ).toBeGreaterThan(0);

      /*
       * The stale memory channel must not be
       * simultaneously double-counted when
       * direct perception is available.
       */
      expect(
        getActivation(
          probe.afterWestVisible,

          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBe(0);
    });

    it("refreshes stale eastward memory into a westward memory from the new legitimate perception", () => {
      const probe =
        runCorrectionProbe();

      /*
       * Prior retained information said east.
       */
      expect(
        probe.staleRecall.directionX,
      ).toBeGreaterThan(0);

      /*
       * New direct evidence says west.
       */
      expect(
        probe
          .westDirectSignal
          .directionX,
      ).toBeLessThan(0);

      /*
       * Persistent memory after that direct
       * evidence must now also represent west.
       */
      expect(
        probe
          .correctedRecall
          .directionX,
      ).toBeLessThan(0);

      expect(
        probe
          .correctedRecall
          .directionX,
      ).toBeCloseTo(
        probe
          .westDirectSignal
          .directionX,
      );

      expect(
        probe
          .correctedRecall
          .directionY,
      ).toBeCloseTo(
        probe
          .westDirectSignal
          .directionY,
      );
    });

    it("refreshes memory provenance time and confidence rather than merely mutating the old stale trace", () => {
      const probe =
        runCorrectionProbe();

      const staleMemory =
        probe
          .afterHiddenWest
          .foodMemory;

      const correctedMemory =
        probe
          .afterWestVisible
          .foodMemory;

      expect(
        staleMemory,
      ).not.toBeNull();

      expect(
        correctedMemory,
      ).not.toBeNull();

      /*
       * A new legitimate perception should
       * create a newly encoded trace at the
       * current simulation time.
       */
      expect(
        correctedMemory
          ?.encodedAtSimulationTimeSeconds,
      ).toBeGreaterThan(
        staleMemory
          ?.encodedAtSimulationTimeSeconds ??
          -1,
      );

      /*
       * The refreshed trace should be younger
       * than the stale trace it replaced.
       *
       * End-of-tick ageing still applies, so
       * we compare relative age instead of
       * requiring age === 0.
       */
      expect(
        correctedMemory
          ?.ageSeconds ??
          Number.POSITIVE_INFINITY,
      ).toBeLessThan(
        staleMemory
          ?.ageSeconds ??
          0,
      );

      expect(
        correctedMemory
          ?.confidence ??
          0,
      ).toBeGreaterThan(
        staleMemory
          ?.confidence ??
          1,
      );
    });

    it("changes behaviour toward the newly perceived westward direction", () => {
      const probe =
        runCorrectionProbe();

      const seekActivation =
        getActivation(
          probe.afterWestVisible,

          M1_NODE_IDS.seekOutput,
        );

      const idleActivation =
        getActivation(
          probe.afterWestVisible,

          M1_NODE_IDS.idleOutput,
        );

      /*
       * SEEK still wins normal action
       * competition rather than being
       * directly commanded by correction.
       */
      expect(
        seekActivation,
      ).toBeGreaterThan(
        idleActivation,
      );

      /*
       * Immediately before re-perception the
       * stale memory was eastward.
       */
      expect(
        probe.staleRecall.directionX,
      ).toBeGreaterThan(0);

      /*
       * After genuine westward perception,
       * movement reverses west.
       */
      expect(
        probe
          .afterWestVisible
          .position
          .x,
      ).toBeLessThan(
        probe
          .westVisibleInput
          .position
          .x,
      );
    });

    it("uses the corrected westward memory on a later occluded tick", () => {
      const probe =
        runCorrectionProbe();

      /*
       * Hide the food again after correction.
       *
       * Now any direction used by cognition
       * must come from the refreshed memory.
       */
      const reOccludedInput:
        M1EpisodeState = {
          ...probe.afterWestVisible,

          foodOccluded:
            true,
      };

      const directSignal =
        perceiveFood(
          reOccludedInput.position,

          reOccludedInput.food,

          {
            maxRange:
              M1_EPISODE_PERCEPTION_RANGE,
          },

          {
            occluded:
              true,
          },
        );

      expect(
        directSignal,
      ).toBeNull();

      const recallBeforeTick =
        recallFoodMemory(
          reOccludedInput
            .foodMemory ??
            null,
        );

      expect(
        recallBeforeTick,
      ).not.toBeNull();

      expect(
        recallBeforeTick?.directionX ??
          0,
      ).toBeLessThan(0);

      const afterReOcclusion =
        advanceM1Episode(
          reOccludedInput,
        );

      /*
       * Direct neural food evidence is absent.
       */
      expect(
        getActivation(
          afterReOcclusion,

          M1_NODE_IDS.foodInput,
        ),
      ).toBe(0);

      /*
       * Corrected memory now drives the
       * distinct recalled-food input.
       */
      expect(
        getActivation(
          afterReOcclusion,

          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBeGreaterThan(0);

      /*
       * Behaviour follows the corrected
       * westward memory rather than reverting
       * to the older eastward trace.
       */
      expect(
        afterReOcclusion
          .position
          .x,
      ).toBeLessThan(
        reOccludedInput
          .position
          .x,
      );
    });
  },
);