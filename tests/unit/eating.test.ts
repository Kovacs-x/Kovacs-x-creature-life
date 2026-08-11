import { describe, expect, it } from "vitest";

import { createFoodObject } from "../../src/world/food.js";
import { createHungerState } from "../../src/simulation/biology/hunger.js";

import {
  canEatFood,
  eatFood,
} from "../../src/simulation/actions/eating.js";

describe("food interaction and eating", () => {
  it("detects food within interaction range", () => {
    const food = createFoodObject("food-1", 1, 0, 0.5);

    expect(
      canEatFood(
        { x: 0, y: 0 },
        food,
        1,
      ),
    ).toBe(true);
  });

  it("does not allow eating food outside interaction range", () => {
    const food = createFoodObject("food-1", 3, 0, 0.5);

    const result = eatFood(
      { x: 0, y: 0 },
      createHungerState(0.2, 1),
      food,
      1,
    );

    expect(result.ate).toBe(false);
    expect(result.food.consumed).toBe(false);
    expect(result.hunger.energy).toBeCloseTo(0.2);
  });

  it("consumes reachable food and restores energy", () => {
    const food = createFoodObject("food-1", 0.5, 0, 0.4);

    const result = eatFood(
      { x: 0, y: 0 },
      createHungerState(0.2, 1),
      food,
      1,
    );

    expect(result.ate).toBe(true);
    expect(result.food.consumed).toBe(true);
    expect(result.hunger.energy).toBeCloseTo(0.6);
  });

  it("does not allow already consumed food to be eaten again", () => {
    const food = {
      ...createFoodObject("food-1", 0, 0, 0.5),
      consumed: true,
    };

    const result = eatFood(
      { x: 0, y: 0 },
      createHungerState(0.2, 1),
      food,
      1,
    );

    expect(result.ate).toBe(false);
    expect(result.hunger.energy).toBeCloseTo(0.2);
  });

  it("caps restored energy at maximum energy", () => {
    const food = createFoodObject("food-1", 0, 0, 1);

    const result = eatFood(
      { x: 0, y: 0 },
      createHungerState(0.8, 1),
      food,
      1,
    );

    expect(result.ate).toBe(true);
    expect(result.hunger.energy).toBe(1);
  });
});