import { describe, expect, it } from "vitest";

import { createFoodObject } from "../../src/world/food.js";
import { createHungerState } from "../../src/simulation/biology/hunger.js";
import { perceiveFood } from "../../src/simulation/senses/foodPerception.js";
import { senseHunger } from "../../src/simulation/senses/hungerSense.js";

import {
  createM1Brain,
  evaluateM1Brain,
} from "../../src/simulation/brain/m1Brain.js";

describe("M1 brain integration", () => {
  it("produces stronger seek activation when hungry than when full", () => {
    const brain = createM1Brain();
    const food = createFoodObject("food-1", 2, 0);

    const foodSignal = perceiveFood(
      { x: 0, y: 0 },
      food,
      { maxRange: 10 },
    );

    const fullResult = evaluateM1Brain(
      brain,
      senseHunger(createHungerState(1, 1)),
      foodSignal,
    );

    const hungryResult = evaluateM1Brain(
      brain,
      senseHunger(createHungerState(0, 1)),
      foodSignal,
    );

    expect(hungryResult.seekActivation).toBeGreaterThan(
      fullResult.seekActivation,
    );
  });

  it("selects idle when full even if food is visible", () => {
    const brain = createM1Brain();
    const food = createFoodObject("food-1", 2, 0);

    const foodSignal = perceiveFood(
      { x: 0, y: 0 },
      food,
      { maxRange: 10 },
    );

    const result = evaluateM1Brain(
      brain,
      senseHunger(createHungerState(1, 1)),
      foodSignal,
    );

    expect(result.selectedActionId).toBe("idle");
  });

  it("can select seek when hungry and food is strongly perceived", () => {
    const brain = createM1Brain();
    const food = createFoodObject("food-1", 1, 0);

    const foodSignal = perceiveFood(
      { x: 0, y: 0 },
      food,
      { maxRange: 10 },
    );

    const result = evaluateM1Brain(
      brain,
      senseHunger(createHungerState(0, 1)),
      foodSignal,
    );

    expect(result.seekActivation).toBeGreaterThan(
      result.idleActivation,
    );

    expect(result.selectedActionId).toBe("seek");
  });

  it("selects idle when hungry but no food is perceived", () => {
    const brain = createM1Brain();

    const result = evaluateM1Brain(
      brain,
      senseHunger(createHungerState(0, 1)),
      null,
    );

    expect(result.selectedActionId).toBe("idle");
  });

  it("does not select eat when food is not in contact range", () => {
    const brain = createM1Brain();
    const food = createFoodObject("food-1", 1, 0);

    const foodSignal = perceiveFood(
      { x: 0, y: 0 },
      food,
      { maxRange: 10 },
    );

    const result = evaluateM1Brain(
      brain,
      senseHunger(createHungerState(0, 1)),
      foodSignal,
      {
        inRange: false,
      },
    );

    expect(result.selectedActionId).toBe("seek");
  });

  it("selects eat when hungry food is in contact range", () => {
    const brain = createM1Brain();
    const food = createFoodObject("food-1", 0, 0);

    const foodSignal = perceiveFood(
      { x: 0, y: 0 },
      food,
      { maxRange: 10 },
    );

    const result = evaluateM1Brain(
      brain,
      senseHunger(createHungerState(0, 1)),
      foodSignal,
      {
        inRange: true,
      },
    );

    expect(result.eatActivation).toBeGreaterThan(
      result.seekActivation,
    );

    expect(result.selectedActionId).toBe("eat");
  });
});