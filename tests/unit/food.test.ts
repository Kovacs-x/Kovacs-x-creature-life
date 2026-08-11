import { describe, expect, it } from "vitest";

import {
  createFoodObject,
  FOOD_OBJECT_KIND,
} from "../../src/world/food.js";

describe("createFoodObject", () => {
  it("creates a valid unconsumed food object", () => {
    const food = createFoodObject("food-1", 4, 7, 2);

    expect(food).toEqual({
      id: "food-1",
      kind: FOOD_OBJECT_KIND,
      position: { x: 4, y: 7 },
      energyValue: 2,
      consumed: false,
    });
  });

  it("rejects invalid energy values", () => {
    expect(() => createFoodObject("food-1", 0, 0, 0)).toThrow(
      RangeError,
    );
  });

  it("rejects non-finite coordinates", () => {
    expect(() => createFoodObject("food-1", Number.NaN, 0)).toThrow(
      RangeError,
    );
  });
});