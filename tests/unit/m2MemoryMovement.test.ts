import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createHungerState,
} from "../../src/simulation/biology/hunger.js";

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

describe(
  "M2.4 memory-guided movement",
  () => {
    it("moves along legitimately recalled direction when SEEK wins after direct perception disappears", () => {
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
       * The Creature legitimately perceives
       * food east of itself and forms memory.
       */
      const afterVisibleTick =
        advanceM1Episode(
          initial,
        );

      expect(
        afterVisibleTick
          .foodMemory,
      ).not.toBeNull();

      const recall =
        recallFoodMemory(
          afterVisibleTick
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
       * TICK 2 INPUT
       *
       * Food still physically exists but is
       * no longer directly perceptible.
       */
      const occludedInput = {
        ...afterVisibleTick,

        foodOccluded:
          true,
      };

      const directSignal =
        perceiveFood(
          occludedInput.position,

          occludedInput.food,

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

      expect(
        occludedInput
          .food.consumed,
      ).toBe(false);

      const afterOccludedTick =
        advanceM1Episode(
          occludedInput,
        );

      const seekActivation =
        getActivation(
          afterOccludedTick,

          M1_NODE_IDS.seekOutput,
        );

      const idleActivation =
        getActivation(
          afterOccludedTick,

          M1_NODE_IDS.idleOutput,
        );

      /*
       * First establish the causal gate:
       * SEEK won ordinary competition.
       */
      expect(
        seekActivation,
      ).toBeGreaterThan(
        idleActivation,
      );

      /*
       * Only then may the remembered direction
       * inform physical movement.
       */
      expect(
        afterOccludedTick
          .position.x,
      ).toBeGreaterThan(
        occludedInput
          .position.x,
      );

      expect(
        afterOccludedTick
          .position.y,
      ).toBeCloseTo(
        occludedInput
          .position.y,
      );
    });

    it("does not move from recalled direction when memory evidence loses normal action competition", () => {
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
       * Form a legitimate memory first.
       */
      const afterVisibleTick =
        advanceM1Episode(
          initial,
        );

      expect(
        afterVisibleTick
          .foodMemory,
      ).not.toBeNull();

      /*
       * The Creature is now satiated before
       * the occluded probe.
       *
       * Memory still exists, but hunger no
       * longer provides sufficient SEEK
       * support.
       */
      const occludedFullInput = {
        ...afterVisibleTick,

        foodOccluded:
          true,

        hunger:
          createHungerState(
            1,
            1,
          ),
      };

      const recallBeforeTick =
        recallFoodMemory(
          occludedFullInput
            .foodMemory ??
            null,
        );

      expect(
        recallBeforeTick,
      ).not.toBeNull();

      const afterTick =
        advanceM1Episode(
          occludedFullInput,
        );

      /*
       * Recalled evidence genuinely entered
       * the neural architecture.
       */
      expect(
        getActivation(
          afterTick,

          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBeGreaterThan(0);

      const seekActivation =
        getActivation(
          afterTick,

          M1_NODE_IDS.seekOutput,
        );

      const idleActivation =
        getActivation(
          afterTick,

          M1_NODE_IDS.idleOutput,
        );

      /*
       * But SEEK lost generic competition.
       */
      expect(
        seekActivation,
      ).toBeLessThan(
        idleActivation,
      );

      /*
       * Therefore memory is not allowed to
       * issue MOVE directly.
       */
      expect(
        afterTick.position,
      ).toEqual(
        occludedFullInput
          .position,
      );
    });

    it("does not move without either direct perception or valid recall even if SEEK state is otherwise evaluated", () => {
      const initial =
        createM1EpisodeState(
          {
            learningEnabled:
              false,

            memoryEnabled:
              true,

            foodX:
              3,

            /*
             * Occluded from the beginning:
             * there has been no legitimate
             * food perception to remember.
             */
            foodOccluded:
              true,
          },
        );

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
  },
);