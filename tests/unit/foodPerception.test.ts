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

describe(
  "food perception",
  () => {
    it("perceives visible food within range", () => {
      const food =
        createFoodObject(
          "food-1",
          3,
          4,
          1,
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

      expect(
        signal,
      ).not.toBeNull();

      expect(
        signal?.foodId,
      ).toBe(
        "food-1",
      );

      expect(
        signal?.distance,
      ).toBeCloseTo(
        5,
      );

      expect(
        signal?.directionX,
      ).toBeCloseTo(
        0.6,
      );

      expect(
        signal?.directionY,
      ).toBeCloseTo(
        0.8,
      );

      expect(
        signal?.strength,
      ).toBeCloseTo(
        0.5,
      );
    });

    it("does not perceive food outside range", () => {
      const food =
        createFoodObject(
          "food-1",
          20,
          0,
          1,
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

      expect(
        signal,
      ).toBeNull();
    });

    it("does not perceive consumed food", () => {
      const food = {
        ...createFoodObject(
          "food-1",
          2,
          0,
          1,
        ),

        consumed: true,
      };

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

      expect(
        signal,
      ).toBeNull();
    });

    it("does not perceive in-range unconsumed food while it is occluded", () => {
      const food =
        createFoodObject(
          "food-1",
          2,
          0,
          1,
        );

      expect(
        food.consumed,
      ).toBe(false);

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
          {
            occluded: true,
          },
        );

      expect(
        signal,
      ).toBeNull();

      /*
       * Null perception is caused by the
       * sensory gate, not by removing or
       * consuming the food.
       */
      expect(
        food.consumed,
      ).toBe(false);

      expect(
        food.position,
      ).toEqual({
        x: 2,
        y: 0,
      });
    });

    it("restores legitimate direct perception when occlusion is removed", () => {
      const food =
        createFoodObject(
          "food-1",
          2,
          0,
          1,
        );

      const occludedSignal =
        perceiveFood(
          {
            x: 0,
            y: 0,
          },
          food,
          {
            maxRange: 10,
          },
          {
            occluded: true,
          },
        );

      expect(
        occludedSignal,
      ).toBeNull();

      const visibleSignal =
        perceiveFood(
          {
            x: 0,
            y: 0,
          },
          food,
          {
            maxRange: 10,
          },
          {
            occluded: false,
          },
        );

      expect(
        visibleSignal,
      ).not.toBeNull();

      expect(
        visibleSignal?.foodId,
      ).toBe(
        "food-1",
      );

      expect(
        visibleSignal?.distance,
      ).toBeCloseTo(
        2,
      );

      expect(
        visibleSignal?.directionX,
      ).toBeCloseTo(
        1,
      );

      expect(
        visibleSignal?.directionY,
      ).toBeCloseTo(
        0,
      );

      expect(
        visibleSignal?.strength,
      ).toBeCloseTo(
        0.8,
      );
    });

    it("does not mutate the food object when applying sensory occlusion", () => {
      const food =
        createFoodObject(
          "food-1",
          3,
          4,
          1,
        );

      const originalId =
        food.id;

      const originalKind =
        food.kind;

      const originalPosition = {
        ...food.position,
      };

      const originalEnergyValue =
        food.energyValue;

      const originalConsumed =
        food.consumed;

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
          {
            occluded: true,
          },
        );

      expect(
        signal,
      ).toBeNull();

      expect(
        food.id,
      ).toBe(
        originalId,
      );

      expect(
        food.kind,
      ).toBe(
        originalKind,
      );

      expect(
        food.position,
      ).toEqual(
        originalPosition,
      );

      expect(
        food.energyValue,
      ).toBe(
        originalEnergyValue,
      );

      expect(
        food.consumed,
      ).toBe(
        originalConsumed,
      );
    });
  },
);