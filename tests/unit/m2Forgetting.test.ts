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
  FOOD_MEMORY_MIN_RECALL_CONFIDENCE,
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

function advanceUntilMinimumRecall(
  input:
    M1EpisodeState,
): {
  readonly state:
    M1EpisodeState;

  readonly confidenceHistory:
    readonly number[];
} {
  let state =
    input;

  const confidenceHistory:
    number[] = [];

  /*
   * The bound is only a safety guard against
   * an accidental non-decaying implementation.
   *
   * It does not define the forgetting time.
   * The locked memory constants do.
   */
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
        "Memory expired before reaching the locked minimum recall confidence.",
      );
    }

    confidenceHistory.push(
      memory.confidence,
    );

    if (
      memory.confidence ===
      FOOD_MEMORY_MIN_RECALL_CONFIDENCE
    ) {
      return {
        state,
        confidenceHistory,
      };
    }

    if (
      memory.confidence <
      FOOD_MEMORY_MIN_RECALL_CONFIDENCE
    ) {
      throw new Error(
        "Memory crossed below the recall threshold without expiring.",
      );
    }

    state =
      advanceM1Episode(
        state,
      );
  }

  throw new Error(
    "Memory did not reach the locked minimum recall confidence within the safety bound.",
  );
}

function runForgettingProbe() {
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
   * Legitimate direct perception forms the
   * memory.
   */
  const afterVisibleTick =
    advanceM1Episode(
      initial,
    );

  const initialRecall =
    recallFoodMemory(
      afterVisibleTick
        .foodMemory ??
        null,
    );

  if (initialRecall === null) {
    throw new Error(
      "Forgetting probe requires legitimate food memory.",
    );
  }

  /*
   * WORLD INTERVENTION
   *
   * Keep food physically present but hidden.
   *
   * Move it farther east so the Creature
   * cannot accidentally reach and consume it
   * during the several seconds required for
   * deterministic memory decay.
   *
   * Memory is not edited by this intervention.
   */
  const occludedInput:
    M1EpisodeState = {
      ...afterVisibleTick,

      foodOccluded:
        true,

      food: {
        ...afterVisibleTick.food,

        position: {
          x: 10,
          y: 0,
        },
      },
    };

  const minimumResult =
    advanceUntilMinimumRecall(
      occludedInput,
    );

  const atMinimumRecall =
    minimumResult.state;

  const minimumRecall =
    recallFoodMemory(
      atMinimumRecall
        .foodMemory ??
        null,
    );

  if (minimumRecall === null) {
    throw new Error(
      "Memory at the locked minimum confidence must still be recallable.",
    );
  }

  /*
   * Equivalent control at the exact same
   * physical, biological and neural state.
   *
   * The only causal difference is removal of
   * usable memory.
   */
  const minimumControlInput:
    M1EpisodeState = {
      ...atMinimumRecall,

      memoryEnabled:
        false,

      foodMemory:
        null,
    };

  /*
   * This tick begins with confidence exactly
   * at the minimum usable value.
   *
   * Memory is therefore allowed to influence
   * cognition during this tick.
   *
   * At the end of the tick, one more second
   * of simulation time causes expiration.
   */
  const afterMinimumRecallTick =
    advanceM1Episode(
      atMinimumRecall,
    );

  const minimumControlAfterTick =
    advanceM1Episode(
      minimumControlInput,
    );

  /*
   * Memory has now expired.
   *
   * Construct an equivalent disabled control
   * from this exact post-expiration state.
   *
   * This avoids confounding the control with
   * the different movement history that the
   * Creature had while memory was still
   * usable.
   */
  const expiredInput =
    afterMinimumRecallTick;

  const expiredControlInput:
    M1EpisodeState = {
      ...expiredInput,

      memoryEnabled:
        false,

      foodMemory:
        null,
    };

  const expiredAfterTick =
    advanceM1Episode(
      expiredInput,
    );

  const expiredControlAfterTick =
    advanceM1Episode(
      expiredControlInput,
    );

  return {
    afterVisibleTick,
    initialRecall,

    occludedInput,

    atMinimumRecall,
    minimumRecall,

    confidenceHistory:
      minimumResult
        .confidenceHistory,

    minimumControlInput,

    afterMinimumRecallTick,
    minimumControlAfterTick,

    expiredInput,
    expiredControlInput,

    expiredAfterTick,
    expiredControlAfterTick,
  };
}

describe(
  "M2.8 deterministic forgetting control",
  () => {
    it("decays integrated memory confidence monotonically while direct perception remains absent", () => {
      const probe =
        runForgettingProbe();

      expect(
        probe
          .confidenceHistory
          .length,
      ).toBeGreaterThan(1);

      for (
        let index = 1;
        index <
        probe.confidenceHistory.length;
        index += 1
      ) {
        /*
         * The loop bounds guarantee that both
         * indexed entries exist.
         *
         * The explicit non-null assertions
         * satisfy TypeScript's strict indexed
         * access checking without changing
         * runtime behaviour.
         */
        const previous =
          probe
            .confidenceHistory[
              index - 1
            ]!;

        const current =
          probe
            .confidenceHistory[
              index
            ]!;

        expect(
          current,
        ).toBeLessThan(
          previous,
        );
      }

      /*
       * The real sensory pathway remains
       * occluded during ageing.
       */
      const directSignal =
        perceiveFood(
          probe
            .atMinimumRecall
            .position,

          probe
            .atMinimumRecall
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

      expect(
        directSignal,
      ).toBeNull();
    });

    it("keeps memory usable at exactly the locked minimum confidence", () => {
      const probe =
        runForgettingProbe();

      expect(
        probe
          .atMinimumRecall
          .foodMemory
          ?.confidence,
      ).toBe(
        FOOD_MEMORY_MIN_RECALL_CONFIDENCE,
      );

      expect(
        probe.minimumRecall,
      ).not.toBeNull();

      expect(
        probe
          .minimumRecall
          .confidence,
      ).toBe(
        FOOD_MEMORY_MIN_RECALL_CONFIDENCE,
      );
    });

    it("still produces a behavioural difference from an equivalent memory-disabled control at the minimum usable confidence", () => {
      const probe =
        runForgettingProbe();

      /*
       * Both branches begin this probe tick
       * physically and biologically
       * equivalent.
       */
      expect(
        probe
          .atMinimumRecall
          .position,
      ).toEqual(
        probe
          .minimumControlInput
          .position,
      );

      expect(
        probe
          .atMinimumRecall
          .hunger,
      ).toEqual(
        probe
          .minimumControlInput
          .hunger,
      );

      expect(
        probe
          .atMinimumRecall
          .food,
      ).toEqual(
        probe
          .minimumControlInput
          .food,
      );

      expect(
        probe
          .atMinimumRecall
          .brain,
      ).toEqual(
        probe
          .minimumControlInput
          .brain,
      );

      /*
       * Only the memory-enabled branch
       * receives recalled-food neural input.
       */
      expect(
        getActivation(
          probe
            .afterMinimumRecallTick,

          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBeGreaterThan(0);

      expect(
        getActivation(
          probe
            .minimumControlAfterTick,

          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBe(0);

      /*
       * The final still-valid memory produces
       * greater SEEK activation.
       */
      expect(
        getActivation(
          probe
            .afterMinimumRecallTick,

          M1_NODE_IDS.seekOutput,
        ),
      ).toBeGreaterThan(
        getActivation(
          probe
            .minimumControlAfterTick,

          M1_NODE_IDS.seekOutput,
        ),
      );

      /*
       * And greater remembered-direction
       * movement.
       */
      expect(
        probe
          .afterMinimumRecallTick
          .position
          .x,
      ).toBeGreaterThan(
        probe
          .minimumControlAfterTick
          .position
          .x,
      );
    });

    it("expires the persistent memory after one more simulated second below the usable threshold", () => {
      const probe =
        runForgettingProbe();

      /*
       * The tick began with a valid recall.
       */
      expect(
        probe.minimumRecall,
      ).not.toBeNull();

      /*
       * End-of-tick ageing has now crossed
       * below the locked minimum, so the
       * persistent trace is removed.
       */
      expect(
        probe
          .afterMinimumRecallTick
          .foodMemory,
      ).toBeNull();

      expect(
        recallFoodMemory(
          probe
            .afterMinimumRecallTick
            .foodMemory ??
            null,
        ),
      ).toBeNull();
    });

    it("produces no remembered-food neural activation on the first tick after expiration", () => {
      const probe =
        runForgettingProbe();

      expect(
        probe
          .expiredInput
          .foodMemory,
      ).toBeNull();

      /*
       * Direct perception is still absent.
       */
      const directSignal =
        perceiveFood(
          probe
            .expiredInput
            .position,

          probe
            .expiredInput
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

      expect(
        directSignal,
      ).toBeNull();

      /*
       * With no current perception and no
       * surviving memory, the memory neural
       * channel must be zero.
       */
      expect(
        getActivation(
          probe
            .expiredAfterTick,

          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBe(0);
    });

    it("makes expired-memory behaviour match an otherwise identical memory-disabled control", () => {
      const probe =
        runForgettingProbe();

      /*
       * The post-expiration branches begin
       * from the exact same physical,
       * biological and neural state.
       *
       * Neither contains usable memory.
       */
      expect(
        probe
          .expiredInput
          .position,
      ).toEqual(
        probe
          .expiredControlInput
          .position,
      );

      expect(
        probe
          .expiredInput
          .hunger,
      ).toEqual(
        probe
          .expiredControlInput
          .hunger,
      );

      expect(
        probe
          .expiredInput
          .food,
      ).toEqual(
        probe
          .expiredControlInput
          .food,
      );

      expect(
        probe
          .expiredInput
          .brain,
      ).toEqual(
        probe
          .expiredControlInput
          .brain,
      );

      expect(
        probe
          .expiredInput
          .foodMemory,
      ).toBeNull();

      expect(
        probe
          .expiredControlInput
          .foodMemory,
      ).toBeNull();

      /*
       * Once memory has expired, retaining
       * memoryEnabled=true must provide no
       * behavioural advantage over the
       * disabled control.
       */
      expect(
        getActivation(
          probe
            .expiredAfterTick,

          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      ).toBe(
        getActivation(
          probe
            .expiredControlAfterTick,

          M1_NODE_IDS
            .rememberedFoodInput,
        ),
      );

      expect(
        getActivation(
          probe
            .expiredAfterTick,

          M1_NODE_IDS.seekOutput,
        ),
      ).toBeCloseTo(
        getActivation(
          probe
            .expiredControlAfterTick,

          M1_NODE_IDS.seekOutput,
        ),
      );

      expect(
        getActivation(
          probe
            .expiredAfterTick,

          M1_NODE_IDS.idleOutput,
        ),
      ).toBeCloseTo(
        getActivation(
          probe
            .expiredControlAfterTick,

          M1_NODE_IDS.idleOutput,
        ),
      );

      expect(
        probe
          .expiredAfterTick
          .position,
      ).toEqual(
        probe
          .expiredControlAfterTick
          .position,
      );
    });

    it("stops the previous remembered-direction movement after expiration", () => {
      const probe =
        runForgettingProbe();

      /*
       * The final valid recall moved the
       * Creature east.
       */
      expect(
        probe
          .afterMinimumRecallTick
          .position
          .x,
      ).toBeGreaterThan(
        probe
          .atMinimumRecall
          .position
          .x,
      );

      /*
       * On the following tick the trace is
       * gone, direct food perception remains
       * absent, and no further remembered
       * movement occurs.
       */
      expect(
        probe
          .expiredAfterTick
          .position,
      ).toEqual(
        probe
          .expiredInput
          .position,
      );
    });
  },
);