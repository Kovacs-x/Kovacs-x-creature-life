import { describe, expect, it } from "vitest";

import {
  consumeEnergy,
  createHungerState,
  getHungerLevel,
  restoreEnergy,
} from "../../src/simulation/biology/hunger.js";

describe("hunger biology", () => {
  it("derives hunger from current energy", () => {
    const state = createHungerState(0.25, 1);

    expect(getHungerLevel(state)).toBeCloseTo(0.75);
  });

  it("consumes energy without going below zero", () => {
    const state = createHungerState(0.2, 1);

    expect(consumeEnergy(state, 0.5).energy).toBe(0);
  });

  it("restores energy without exceeding maximum", () => {
    const state = createHungerState(0.8, 1);

    expect(restoreEnergy(state, 0.5).energy).toBe(1);
  });

  it("rejects invalid starting energy", () => {
    expect(() => createHungerState(2, 1)).toThrow(RangeError);
  });
});