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

function runOccludedMemoryProbe() {
  /*
   * Both branches begin physically and
   * biologically equivalent.
   *
   * Their brains also have the same neural
   * architecture.
   *
   * The causal difference is whether usable
   * memory is enabled.
   */
  const memoryEnabledInitial =
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

  const memoryDisabledInitial =
    createM1EpisodeState(
      {
        learningEnabled:
          false,

        memoryEnabled:
          false,

        foodX:
          3,

        foodOccluded:
          false,
      },
    );

  /*
   * TICK 1
   *
   * Both branches receive genuine direct
   * food perception.
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
   * Food remains physically present but
   * becomes unavailable to direct sensory
   * perception.
   */
  const memoryEnabledOccludedInput = {
    ...memoryEnabledAfterVisible,

    foodOccluded:
      true,
  };

  const memoryDisabledOccludedInput = {
    ...memoryDisabledAfterVisible,

    foodOccluded:
      true,
  };

  /*
   * TICK 2
   *
   * The M2 behavioural probe.
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
       * The enabled branch forms its memory
       * from legitimate direct perception.
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

      expect(
        recall?.directionX ??
          0,
      ).toBeGreaterThan(0);

      expect(
        recall?.directionY ??
          1,
      ).toBeCloseTo(0);

      /*
       * During genuine current perception,
       * the direct neural channel is active
       * and the remembered channel is not
       * double-counted.
       */
      expect(
        getActivation(
          probe
            .memoryEnabledAfterVisible,

          M1_NODE_IDS.foodInput,
        ),
      ).toBeGreaterThan(0);

      expect(
        getActivation(
          probe
            .memoryEnabledAfterVisible,

          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBe(0);

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

      /*
       * On the occluded tick, the current
       * direct-food neural channel is zero.
       */
      expect(
        getActivation(
          probe
            .memoryEnabledAfterOcclusion,

          M1_NODE_IDS.foodInput,
        ),
      ).toBe(0);

      /*
       * Only the memory-enabled Creature has
       * recalled-food neural activation.
       */
      expect(
        getActivation(
          probe
            .memoryEnabledAfterOcclusion,

          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBeGreaterThan(0);

      expect(
        getActivation(
          probe
            .memoryDisabledAfterOcclusion,

          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBe(0);
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
        createM1EpisodeState(
          {
            learningEnabled:
              false,

            memoryEnabled:
              true,

            /*
             * Food physically exists but is
             * occluded from the beginning.
             */
            foodX:
              3,

            foodOccluded:
              true,
          },
        );

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
        getActivation(
          afterTick,

          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBe(0);

      expect(
        afterTick.position,
      ).toEqual(
        initial.position,
      );
    });

    /*
     * M2.3 SATISFIED
     *
     * This was committed as an expected
     * failure during M2.2A.
     *
     * It is now an ordinary passing contract.
     *
     * Recall must increase SEEK activation
     * through the neural architecture, not by
     * directly selecting an action.
     */
    it("legitimate recall increases SEEK activation relative to the equivalent memory-disabled control", () => {
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
     * EXPECTED FAILURE UNTIL M2.4
     *
     * M2.3 may allow memory to make SEEK win,
     * but it still must not move using recall.
     *
     * M2.4 will add remembered-direction
     * movement only after SEEK has already won
     * normal action competition.
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
       * Normal neural competition must first
       * support SEEK.
       */
      expect(
        memorySeekActivation,
      ).toBeGreaterThan(
        memoryIdleActivation,
      );

      /*
       * M2.4 must then produce physical
       * progress in the legitimately
       * remembered eastward direction.
       */
      expect(
        memoryAfter.position.x,
      ).toBeGreaterThan(
        controlAfter.position.x,
      );
    });
  },
);