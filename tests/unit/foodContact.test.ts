import { describe, expect, it } from "vitest";

import { createFoodObject } from "../../src/world/food.js";
import { senseFoodContact } from "../../src/simulation/senses/foodContact.js";

describe("food contact sensing", () => {
  it("reports food inside interaction range", () => {
    const food = createFoodObject(
      "food-1",
      0.2,
      0,
      0.5,
    );

    const signal = senseFoodContact(
      { x: 0, y: 0 },
      food,
      0.25,
    );

    expect(signal.inRange).toBe(true);
  });

  it("reports food outside interaction range", () => {
    const food = createFoodObject(
      "food-1",
      1,
      0,
      0.5,
    );

    const signal = senseFoodContact(
      { x: 0, y: 0 },
      food,
      0.25,
    );

    expect(signal.inRange).toBe(false);
  });

  it("does not report consumed food as available contact", () => {
    const food = {
      ...createFoodObject(
        "food-1",
        0,
        0,
        0.5,
      ),
      consumed: true,
    };

    const signal = senseFoodContact(
      { x: 0, y: 0 },
      food,
      0.25,
    );

    expect(signal.inRange).toBe(false);
  });
});