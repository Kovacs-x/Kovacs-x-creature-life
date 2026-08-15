import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createFoodObject,
} from "../../src/world/food.js";

import {
  perceiveFood,
} from "../../src/simulation/senses/foodPerception.js";

import {
  advanceFoodMemory,
  encodeFoodMemory,
  FOOD_MEMORY_DECAY_PER_SECOND,
  FOOD_MEMORY_INITIAL_CONFIDENCE,
  FOOD_MEMORY_MIN_RECALL_CONFIDENCE,
  recallFoodMemory,
} from "../../src/simulation/memory/foodMemory.js";

function perceiveTestFood() {
  const food =
    createFoodObject(
      "food-1",
      3,
      4,
      0.5,
    );

  const signal =
    perceiveFood(
      {
        x: 0,
        y: 0,
      },
      food,
      {
        maxRange: 10,
      },
    );

  if (signal === null) {
    throw new Error(
      "Expected test food to be legitimately perceived.",
    );
  }

  return signal;
}

describe(
  "M2.1 food memory primitives",
  () => {
    it("encodes a memory from a legitimate FoodPerceptionSignal", () => {
      const perception =
        perceiveTestFood();

      const memory =
        encodeFoodMemory(
          perception,
          12,
        );

      expect(
        memory.sourceFoodId,
      ).toBe(
        perception.foodId,
      );

      expect(
        memory.encodedAtSimulationTimeSeconds,
      ).toBe(12);

      expect(
        memory.ageSeconds,
      ).toBe(0);

      expect(
        memory.confidence,
      ).toBe(
        FOOD_MEMORY_INITIAL_CONFIDENCE,
      );

      expect(
        memory.rememberedDirectionX,
      ).toBeCloseTo(
        perception.directionX,
      );

      expect(
        memory.rememberedDirectionY,
      ).toBeCloseTo(
        perception.directionY,
      );

      expect(
        memory.rememberedPerceptualStrength,
      ).toBeCloseTo(
        perception.strength,
      );
    });

    it("does not store exact world-space target coordinates", () => {
      const memory =
        encodeFoodMemory(
          perceiveTestFood(),
          0,
        );

      expect(
        memory,
      ).not.toHaveProperty(
        "foodX",
      );

      expect(
        memory,
      ).not.toHaveProperty(
        "foodY",
      );

      expect(
        memory,
      ).not.toHaveProperty(
        "targetX",
      );

      expect(
        memory,
      ).not.toHaveProperty(
        "targetY",
      );

      expect(
        memory,
      ).not.toHaveProperty(
        "worldTargetPosition",
      );

      expect(
        memory,
      ).not.toHaveProperty(
        "lastKnownExactFoodPosition",
      );

      expect(
        memory,
      ).not.toHaveProperty(
        "position",
      );

      /*
       * Distance is also deliberately not
       * retained by this minimal memory.
       *
       * M2 only needs remembered sensory
       * direction and strength.
       */
      expect(
        memory,
      ).not.toHaveProperty(
        "distance",
      );
    });

    it("ages memory using explicit simulation time", () => {
      const memory =
        encodeFoodMemory(
          perceiveTestFood(),
          10,
        );

      const aged =
        advanceFoodMemory(
          memory,
          12,
        );

      expect(
        aged,
      ).not.toBeNull();

      expect(
        aged?.ageSeconds,
      ).toBe(2);

      expect(
        aged?.confidence,
      ).toBeCloseTo(
        FOOD_MEMORY_INITIAL_CONFIDENCE -
          FOOD_MEMORY_DECAY_PER_SECOND *
            2,
      );
    });

    it("supports fractional simulation-time ageing deterministically", () => {
      const memory =
        encodeFoodMemory(
          perceiveTestFood(),
          4,
        );

      const aged =
        advanceFoodMemory(
          memory,
          7.5,
        );

      expect(
        aged,
      ).not.toBeNull();

      expect(
        aged?.ageSeconds,
      ).toBeCloseTo(
        3.5,
      );

      expect(
        aged?.confidence,
      ).toBeCloseTo(
        0.5625,
      );
    });

    it("computes decay from original encoding time rather than accumulated update steps", () => {
      const original =
        encodeFoodMemory(
          perceiveTestFood(),
          0,
        );

      const direct =
        advanceFoodMemory(
          original,
          4,
        );

      const afterTwoSeconds =
        advanceFoodMemory(
          original,
          2,
        );

      expect(
        afterTwoSeconds,
      ).not.toBeNull();

      const stepped =
        afterTwoSeconds === null
          ? null
          : advanceFoodMemory(
              afterTwoSeconds,
              4,
            );

      expect(
        stepped,
      ).toEqual(
        direct,
      );
    });

    it("produces a recall signal while memory confidence remains usable", () => {
      const memory =
        encodeFoodMemory(
          perceiveTestFood(),
          0,
        );

      const aged =
        advanceFoodMemory(
          memory,
          3,
        );

      expect(
        aged,
      ).not.toBeNull();

      const recall =
        recallFoodMemory(
          aged,
        );

      expect(
        recall,
      ).not.toBeNull();

      expect(
        recall?.ageSeconds,
      ).toBe(3);

      expect(
        recall?.confidence,
      ).toBeCloseTo(
        0.625,
      );

      expect(
        recall?.directionX,
      ).toBeCloseTo(
        memory.rememberedDirectionX,
      );

      expect(
        recall?.directionY,
      ).toBeCloseTo(
        memory.rememberedDirectionY,
      );

      expect(
        recall?.strength,
      ).toBeCloseTo(
        memory.rememberedPerceptualStrength,
      );
    });

    it("keeps diagnostic food identity out of the cognitive recall signal", () => {
      const memory =
        encodeFoodMemory(
          perceiveTestFood(),
          0,
        );

      const recall =
        recallFoodMemory(
          memory,
        );

      expect(
        recall,
      ).not.toBeNull();

      expect(
        recall,
      ).not.toHaveProperty(
        "foodId",
      );

      expect(
        recall,
      ).not.toHaveProperty(
        "sourceFoodId",
      );
    });

    it("allows recall at exactly the locked minimum confidence", () => {
      const memory =
        encodeFoodMemory(
          perceiveTestFood(),
          0,
        );

      /*
       * 1.0 - (0.125 * 6)
       * =
       * 0.25
       */
      const aged =
        advanceFoodMemory(
          memory,
          6,
        );

      expect(
        aged,
      ).not.toBeNull();

      expect(
        aged?.confidence,
      ).toBe(
        FOOD_MEMORY_MIN_RECALL_CONFIDENCE,
      );

      expect(
        recallFoodMemory(
          aged,
        ),
      ).not.toBeNull();
    });

    it("deterministically forgets memory once confidence drops below the threshold", () => {
      const memory =
        encodeFoodMemory(
          perceiveTestFood(),
          0,
        );

      const forgotten =
        advanceFoodMemory(
          memory,
          7,
        );

      expect(
        forgotten,
      ).toBeNull();

      expect(
        recallFoodMemory(
          forgotten,
        ),
      ).toBeNull();
    });

    it("does not mutate the original memory while ageing it", () => {
      const original =
        encodeFoodMemory(
          perceiveTestFood(),
          0,
        );

      const snapshot = {
        ...original,
      };

      const aged =
        advanceFoodMemory(
          original,
          2,
        );

      expect(
        aged,
      ).not.toBeNull();

      expect(
        original,
      ).toEqual(
        snapshot,
      );

      expect(
        aged,
      ).not.toBe(
        original,
      );
    });

    it("re-encoding from fresh legitimate perception refreshes confidence and age", () => {
      const firstFood =
        createFoodObject(
          "food-1",
          3,
          0,
          0.5,
        );

      const firstSignal =
        perceiveFood(
          {
            x: 0,
            y: 0,
          },
          firstFood,
          {
            maxRange: 10,
          },
        );

      if (
        firstSignal === null
      ) {
        throw new Error(
          "Expected first food perception.",
        );
      }

      const firstMemory =
        encodeFoodMemory(
          firstSignal,
          0,
        );

      const aged =
        advanceFoodMemory(
          firstMemory,
          3,
        );

      expect(
        aged?.confidence,
      ).toBeCloseTo(
        0.625,
      );

      const secondFood =
        createFoodObject(
          "food-1",
          0,
          3,
          0.5,
        );

      const secondSignal =
        perceiveFood(
          {
            x: 0,
            y: 0,
          },
          secondFood,
          {
            maxRange: 10,
          },
        );

      if (
        secondSignal === null
      ) {
        throw new Error(
          "Expected second food perception.",
        );
      }

      const refreshed =
        encodeFoodMemory(
          secondSignal,
          3,
        );

      expect(
        refreshed.ageSeconds,
      ).toBe(0);

      expect(
        refreshed.confidence,
      ).toBe(
        FOOD_MEMORY_INITIAL_CONFIDENCE,
      );

      expect(
        refreshed.rememberedDirectionX,
      ).toBeCloseTo(0);

      expect(
        refreshed.rememberedDirectionY,
      ).toBeCloseTo(1);
    });

    it("round-trips through JSON without changing the trace", () => {
      const memory =
        encodeFoodMemory(
          perceiveTestFood(),
          5,
        );

      const aged =
        advanceFoodMemory(
          memory,
          7,
        );

      expect(
        aged,
      ).not.toBeNull();

      const serialized =
        JSON.stringify(
          aged,
        );

      const restored =
        JSON.parse(
          serialized,
        ) as unknown;

      expect(
        restored,
      ).toEqual(
        aged,
      );
    });

    it("produces identical results from identical inputs", () => {
      const firstPerception =
        perceiveTestFood();

      const secondPerception =
        perceiveTestFood();

      expect(
        secondPerception,
      ).toEqual(
        firstPerception,
      );

      const firstMemory =
        encodeFoodMemory(
          firstPerception,
          2,
        );

      const secondMemory =
        encodeFoodMemory(
          secondPerception,
          2,
        );

      expect(
        secondMemory,
      ).toEqual(
        firstMemory,
      );

      const firstAged =
        advanceFoodMemory(
          firstMemory,
          5.25,
        );

      const secondAged =
        advanceFoodMemory(
          secondMemory,
          5.25,
        );

      expect(
        secondAged,
      ).toEqual(
        firstAged,
      );

      expect(
        recallFoodMemory(
          secondAged,
        ),
      ).toEqual(
        recallFoodMemory(
          firstAged,
        ),
      );
    });

    it("rejects invalid simulation time", () => {
      expect(() =>
        encodeFoodMemory(
          perceiveTestFood(),
          -1,
        ),
      ).toThrow(
        "Simulation time must be finite and non-negative.",
      );

      expect(() =>
        encodeFoodMemory(
          perceiveTestFood(),
          Number.NaN,
        ),
      ).toThrow(
        "Simulation time must be finite and non-negative.",
      );
    });

    it("rejects ageing a memory backwards in simulation time", () => {
      const memory =
        encodeFoodMemory(
          perceiveTestFood(),
          10,
        );

      expect(() =>
        advanceFoodMemory(
          memory,
          9,
        ),
      ).toThrow(
        "Food memory cannot be advanced to a simulation time before it was encoded.",
      );
    });
  },
);