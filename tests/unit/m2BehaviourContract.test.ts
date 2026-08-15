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
  state: M1EpisodeState,
  nodeId: string,
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

function runOccludedMemoryProbe() {
  /*
   * Both branches begin physically and
   * biologically equivalent.
   *
   * The sole causal difference is whether
   * food memory is enabled.
   */
  const memoryEnabledInitial =
    createM1EpisodeState({
      learningEnabled: false,
      memoryEnabled: true,
      foodX: 3,
      foodOccluded: false,
    });

  const memoryDisabledInitial =
    createM1EpisodeState({
      learningEnabled: false,
      memoryEnabled: false,
      foodX: 3,
      foodOccluded: false,
    });

  /*
   * TICK 1
   *
   * Food is directly perceptible to both
   * branches.
   *
   * The memory-enabled branch must form its
   * trace from that legitimate perception.
   */
  const memoryEnabledAfterVisible =
    advanceM1Episode(
      memoryEnabledInitial,
    );

  const memoryDisabledAfterVisible =
    advanceM1Episode(
      memoryDisabledInitial,
    );

  /*
   * Environmental change before tick 2:
   *
   * food continues to physically exist but
   * direct sensory access is removed.
   */
  const memoryEnabledOccludedInput = {
    ...memoryEnabledAfterVisible,
    foodOccluded: true,
  };

  const memoryDisabledOccludedInput = {
    ...memoryDisabledAfterVisible,
    foodOccluded: true,
  };

  /*
   * TICK 2
   *
   * This is the locked behavioural probe.
   */
  const memoryEnabledAfterOcclusion =
    advanceM1Episode(
      memoryEnabledOccludedInput,
    );

  const memoryDisabledAfterOcclusion =
    advanceM1Episode(
      memoryDisabledOccludedInput,
    );

  return {
    memoryEnabledAfterVisible,
    memoryDisabledAfterVisible,

    memoryEnabledOccludedInput,
    memoryDisabledOccludedInput,

    memoryEnabledAfterOcclusion,
    memoryDisabledAfterOcclusion,
  };
}

describe(
  "M2.2A locked memory-guided behavioural contract",
  () => {
    it("constructs the probe from legitimate prior perception and real sensory occlusion", () => {
      const probe =
        runOccludedMemoryProbe();

      /*
       * Both branches had the same direct
       * experience during the visible tick.
       */
      expect(
        probe
          .memoryEnabledAfterVisible
          .position,
      ).toEqual(
        probe
          .memoryDisabledAfterVisible
          .position,
      );

      expect(
        probe
          .memoryEnabledAfterVisible
          .food,
      ).toEqual(
        probe
          .memoryDisabledAfterVisible
          .food,
      );

      /*
       * Only the enabled branch formed a
       * persistent trace.
       *
       * The trace was generated internally by
       * advanceM1Episode from its legitimate
       * FoodPerceptionSignal.
       */
      expect(
        probe
          .memoryEnabledAfterVisible
          .foodMemory,
      ).not.toBeNull();

      expect(
        probe
          .memoryDisabledAfterVisible
          .foodMemory,
      ).toBeNull();

      const recall =
        recallFoodMemory(
          probe
            .memoryEnabledAfterVisible
            .foodMemory ??
            null,
        );

      expect(
        recall,
      ).not.toBeNull();

      /*
       * The remembered direction points east
       * because that is the direction that was
       * legitimately sensed on tick 1.
       */
      expect(
        recall?.directionX ??
          0,
      ).toBeGreaterThan(0);

      expect(
        recall?.directionY ??
          1,
      ).toBeCloseTo(0);

      /*
       * Direct perception is genuinely absent
       * at the beginning of the probe tick.
       */
      const directFoodSignal =
        perceiveFood(
          probe
            .memoryEnabledOccludedInput
            .position,

          probe
            .memoryEnabledOccludedInput
            .food,

          {
            maxRange:
              M1_EPISODE_PERCEPTION_RANGE,
          },

          {
            occluded: true,
          },
        );

      expect(
        directFoodSignal,
      ).toBeNull();

      /*
       * The food still physically exists.
       */
      expect(
        probe
          .memoryEnabledOccludedInput
          .food
          .consumed,
      ).toBe(false);

      expect(
        probe
          .memoryEnabledOccludedInput
          .food,
      ).toEqual(
        probe
          .memoryDisabledOccludedInput
          .food,
      );

      /*
       * Memory survives the occluded tick and
       * remains recallable.
       */
      const laterRecall =
        recallFoodMemory(
          probe
            .memoryEnabledAfterOcclusion
            .foodMemory ??
            null,
        );

      expect(
        laterRecall,
      ).not.toBeNull();

      expect(
        probe
          .memoryDisabledAfterOcclusion
          .foodMemory,
      ).toBeNull();
    });

    it("the memory-disabled control does not continue seeking after direct perception disappears", () => {
      const probe =
        runOccludedMemoryProbe();

      const controlBefore =
        probe
          .memoryDisabledOccludedInput;

      const controlAfter =
        probe
          .memoryDisabledAfterOcclusion;

      expect(
        controlAfter.position,
      ).toEqual(
        controlBefore.position,
      );

      const seekActivation =
        getActivation(
          controlAfter,
          M1_NODE_IDS.seekOutput,
        );

      const idleActivation =
        getActivation(
          controlAfter,
          M1_NODE_IDS.idleOutput,
        );

      expect(
        seekActivation,
      ).toBeLessThan(
        idleActivation,
      );
    });

    it("a Creature with no prior perception has no food memory or memory-guided movement", () => {
      const initial =
        createM1EpisodeState({
          learningEnabled: false,

          memoryEnabled: true,

          /*
           * Food exists from the beginning,
           * but sensory occlusion prevents any
           * legitimate food perception.
           */
          foodX: 3,
          foodOccluded: true,
        });

      expect(
        initial.food.consumed,
      ).toBe(false);

      expect(
        initial.foodMemory,
      ).toBeNull();

      const afterTick =
        advanceM1Episode(
          initial,
        );

      expect(
        afterTick.foodMemory,
      ).toBeNull();

      expect(
        afterTick.position,
      ).toEqual(
        initial.position,
      );
    });

    /*
     * EXPECTED FAILURE UNTIL M2.3
     *
     * This assertion is committed before
     * memory is connected to the neural
     * architecture.
     *
     * Once M2.3 makes this succeed,
     * it.fails must be changed to ordinary
     * it. If the implementation changes the
     * wrong behaviour, this contract remains
     * unsatisfied.
     */
    it.fails("legitimate recall increases SEEK activation relative to the equivalent memory-disabled control", () => {
      const probe =
        runOccludedMemoryProbe();

      const memorySeekActivation =
        getActivation(
          probe
            .memoryEnabledAfterOcclusion,

          M1_NODE_IDS.seekOutput,
        );

      const controlSeekActivation =
        getActivation(
          probe
            .memoryDisabledAfterOcclusion,

          M1_NODE_IDS.seekOutput,
        );

      expect(
        memorySeekActivation,
      ).toBeGreaterThan(
        controlSeekActivation,
      );
    });

    /*
     * EXPECTED FAILURE UNTIL M2.3 + M2.4
     *
     * Successful behaviour requires BOTH:
     *
     * 1. SEEK to win ordinary neural/action
     *    competition;
     * 2. physical movement in the remembered
     *    direction.
     *
     * A direct memory-to-movement shortcut
     * would therefore still fail this
     * contract if SEEK did not win.
     */
    it.fails("memory-enabled behaviour wins normal SEEK competition and produces more remembered-direction movement than control", () => {
      const probe =
        runOccludedMemoryProbe();

      const memoryAfter =
        probe
          .memoryEnabledAfterOcclusion;

      const controlAfter =
        probe
          .memoryDisabledAfterOcclusion;

      const memorySeekActivation =
        getActivation(
          memoryAfter,
          M1_NODE_IDS.seekOutput,
        );

      const memoryIdleActivation =
        getActivation(
          memoryAfter,
          M1_NODE_IDS.idleOutput,
        );

      /*
       * Normal competition must first support
       * SEEK.
       */
      expect(
        memorySeekActivation,
      ).toBeGreaterThan(
        memoryIdleActivation,
      );

      /*
       * Remembered direction from the
       * legitimate tick-1 perception was east.
       *
       * Therefore the memory-enabled branch
       * must make more positive-X progress
       * than its otherwise equivalent
       * memory-disabled control.
       */
      expect(
        memoryAfter.position.x,
      ).toBeGreaterThan(
        controlAfter.position.x,
      );
    });
  },
);