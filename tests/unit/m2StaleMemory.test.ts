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

function runStaleMemoryProbe() {
  /*
   * TICK 0
   *
   * Food begins east of the Creature and is
   * legitimately perceptible.
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
   * The Creature directly perceives food,
   * moves east after SEEK wins, and forms
   * an eastward memory from that perception.
   */
  const afterVisibleTick =
    advanceM1Episode(
      initial,
    );

  const recallBeforeRelocation =
    recallFoodMemory(
      afterVisibleTick
        .foodMemory ??
        null,
    );

  if (
    recallBeforeRelocation ===
    null
  ) {
    throw new Error(
      "Stale-memory probe requires legitimate recall after the visible tick.",
    );
  }

  /*
   * EXTERNAL WORLD INTERVENTION
   *
   * The food remains the SAME world object
   * identity but is moved behind the Creature
   * while occluded.
   *
   * After the visible tick the Creature is
   * east of x=0, so x=0 is now west of it.
   *
   * This intervention changes world truth.
   * It does not edit memory.
   */
  const hiddenRelocatedInput:
    M1EpisodeState = {
      ...afterVisibleTick,

      foodOccluded:
        true,

      food: {
        ...afterVisibleTick.food,

        position: {
          x: 0,
          y: 0,
        },
      },
    };

  /*
   * Observer-only diagnostic:
   *
   * If the relocated food WERE perceptible,
   * current sensory evidence would point west.
   *
   * This signal is never supplied to the
   * Creature during the actual probe.
   */
  const relocatedSignalIfVisible =
    perceiveFood(
      hiddenRelocatedInput
        .position,

      hiddenRelocatedInput
        .food,

      {
        maxRange:
          M1_EPISODE_PERCEPTION_RANGE,
      },

      {
        occluded:
          false,
      },
    );

  if (
    relocatedSignalIfVisible ===
    null
  ) {
    throw new Error(
      "Relocated food should be within diagnostic perception range.",
    );
  }

  /*
   * Actual current sensory condition:
   *
   * the food physically exists but is
   * occluded, so cognition receives no
   * current food perception.
   */
  const actualOccludedSignal =
    perceiveFood(
      hiddenRelocatedInput
        .position,

      hiddenRelocatedInput
        .food,

      {
        maxRange:
          M1_EPISODE_PERCEPTION_RANGE,
      },

      {
        occluded:
          true,
      },
    );

  /*
   * TICK 2
   *
   * The Creature advances with contradictory
   * hidden world truth:
   *
   * current hidden food = west
   * stored memory = east
   */
  const afterStaleTick =
    advanceM1Episode(
      hiddenRelocatedInput,
    );

  const recallAfterRelocation =
    recallFoodMemory(
      afterStaleTick
        .foodMemory ??
        null,
    );

  return {
    afterVisibleTick,

    recallBeforeRelocation,

    hiddenRelocatedInput,

    relocatedSignalIfVisible,

    actualOccludedSignal,

    afterStaleTick,

    recallAfterRelocation,
  };
}

describe(
  "M2.6 stale-memory adversarial control",
  () => {
    it("creates contradictory hidden world truth while preserving the same food object identity", () => {
      const probe =
        runStaleMemoryProbe();

      /*
       * The original legitimate memory says
       * food was east.
       */
      expect(
        probe
          .recallBeforeRelocation
          .directionX,
      ).toBeGreaterThan(0);

      expect(
        probe
          .recallBeforeRelocation
          .directionY,
      ).toBeCloseTo(0);

      /*
       * The same food identity has now been
       * moved west in hidden world truth.
       *
       * Keeping the ID unchanged makes this
       * specifically adversarial against any
       * prohibited sourceFoodId -> current
       * position lookup.
       */
      expect(
        probe
          .hiddenRelocatedInput
          .food
          .id,
      ).toBe(
        probe
          .afterVisibleTick
          .food
          .id,
      );

      expect(
        probe
          .afterVisibleTick
          .foodMemory
          ?.sourceFoodId,
      ).toBe(
        probe
          .hiddenRelocatedInput
          .food
          .id,
      );

      /*
       * Current hidden world geometry now
       * places food west of the Creature.
       */
      expect(
        probe
          .hiddenRelocatedInput
          .food
          .position
          .x,
      ).toBeLessThan(
        probe
          .hiddenRelocatedInput
          .position
          .x,
      );

      /*
       * If visible, legitimate current
       * perception would therefore point west.
       */
      expect(
        probe
          .relocatedSignalIfVisible
          .directionX,
      ).toBeLessThan(0);

      /*
       * But during the real probe the food is
       * genuinely absent from current sensory
       * input.
       */
      expect(
        probe
          .actualOccludedSignal,
      ).toBeNull();
    });

    it("does not rewrite remembered direction from the hidden relocated food position", () => {
      const probe =
        runStaleMemoryProbe();

      const recallAfter =
        probe
          .recallAfterRelocation;

      expect(
        recallAfter,
      ).not.toBeNull();

      /*
       * Hidden current world truth points west.
       */
      expect(
        probe
          .relocatedSignalIfVisible
          .directionX,
      ).toBeLessThan(0);

      /*
       * Memory must remain an imperfect
       * retained representation of the old
       * eastward perception.
       */
      expect(
        recallAfter?.directionX ??
          0,
      ).toBeGreaterThan(0);

      expect(
        recallAfter?.directionX,
      ).toBeCloseTo(
        probe
          .recallBeforeRelocation
          .directionX,
      );

      expect(
        recallAfter?.directionY,
      ).toBeCloseTo(
        probe
          .recallBeforeRelocation
          .directionY,
      );

      /*
       * Time still affects confidence.
       *
       * Direction stays stale while confidence
       * decays normally.
       */
      expect(
        recallAfter?.confidence ??
          1,
      ).toBeLessThan(
        probe
          .recallBeforeRelocation
          .confidence,
      );
    });

    it("continues to act according to stale eastward memory rather than the hidden westward food position", () => {
      const probe =
        runStaleMemoryProbe();

      /*
       * Current direct-food neural evidence
       * is absent.
       */
      expect(
        getActivation(
          probe
            .afterStaleTick,

          M1_NODE_IDS.foodInput,
        ),
      ).toBe(0);

      /*
       * Recalled evidence genuinely enters the
       * distinct memory neural channel.
       */
      expect(
        getActivation(
          probe
            .afterStaleTick,

          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBeGreaterThan(0);

      const seekActivation =
        getActivation(
          probe
            .afterStaleTick,

          M1_NODE_IDS.seekOutput,
        );

      const idleActivation =
        getActivation(
          probe
            .afterStaleTick,

          M1_NODE_IDS.idleOutput,
        );

      /*
       * SEEK still has to win normal action
       * competition.
       */
      expect(
        seekActivation,
      ).toBeGreaterThan(
        idleActivation,
      );

      /*
       * The hidden food is currently west...
       */
      expect(
        probe
          .hiddenRelocatedInput
          .food
          .position
          .x,
      ).toBeLessThan(
        probe
          .hiddenRelocatedInput
          .position
          .x,
      );

      /*
       * ...but the Creature moves east because
       * that is what its retained sensory
       * memory still represents.
       */
      expect(
        probe
          .afterStaleTick
          .position
          .x,
      ).toBeGreaterThan(
        probe
          .hiddenRelocatedInput
          .position
          .x,
      );

      expect(
        probe
          .afterStaleTick
          .position
          .y,
      ).toBeCloseTo(
        probe
          .hiddenRelocatedInput
          .position
          .y,
      );
    });

    it("moves farther from the secretly relocated food rather than correcting toward information it cannot perceive", () => {
      const probe =
        runStaleMemoryProbe();

      const distanceBefore =
        Math.hypot(
          probe
            .hiddenRelocatedInput
            .position
            .x -
            probe
              .hiddenRelocatedInput
              .food
              .position
              .x,

          probe
            .hiddenRelocatedInput
            .position
            .y -
            probe
              .hiddenRelocatedInput
              .food
              .position
              .y,
        );

      const distanceAfter =
        Math.hypot(
          probe
            .afterStaleTick
            .position
            .x -
            probe
              .afterStaleTick
              .food
              .position
              .x,

          probe
            .afterStaleTick
            .position
            .y -
            probe
              .afterStaleTick
              .food
              .position
              .y,
        );

      /*
       * This is deliberately the "wrong"
       * behaviour with respect to current
       * hidden world truth.
       *
       * That wrongness is the evidence we
       * want: the Creature is acting from its
       * own stale internal representation.
       */
      expect(
        distanceAfter,
      ).toBeGreaterThan(
        distanceBefore,
      );
    });
  },
);