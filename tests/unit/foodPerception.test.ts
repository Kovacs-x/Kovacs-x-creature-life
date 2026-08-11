import { describe, expect, it } from "vitest";

import { createFoodObject } from "../../src/world/food.js";
import { perceiveFood } from "../../src/simulation/senses/foodPerception.js";

describe("food perception", () => {
  it("perceives visible food within range", () => {
    const food = createFoodObject("food-1", 3, 4, 1);

    const signal = perceiveFood(
      { x: 0, y: 0 },
      food,
      { maxRange: 10 },
    );

    expect(signal).not.toBeNull();
    expect(signal?.foodId).toBe("food-1");
    expect(signal?.distance).toBeCloseTo(5);
    expect(signal?.directionX).toBeCloseTo(0.6);
    expect(signal?.directionY).toBeCloseTo(0.8);
    expect(signal?.strength).toBeCloseTo(0.5);
  });

  it("does not perceive food outside range", () => {
    const food = createFoodObject("food-1", 20, 0, 1);

    const signal = perceiveFood(
      { x: 0, y: 0 },
      food,
      { maxRange: 10 },
    );

    expect(signal).toBeNull();
  });

  it("does not perceive consumed food", () => {
    const food = {
      ...createFoodObject("food-1", 2, 0, 1),
      consumed: true,
    };

    const signal = perceiveFood(
      { x: 0, y: 0 },
      food,
      { maxRange: 10 },
    );

    expect(signal).toBeNull();
  });
});