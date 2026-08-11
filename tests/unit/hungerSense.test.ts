import { describe, expect, it } from "vitest";

import { createHungerState } from "../../src/simulation/biology/hunger.js";
import { senseHunger } from "../../src/simulation/senses/hungerSense.js";

describe("hunger sensing", () => {
  it("converts biological energy state into an internal hunger signal", () => {
    const hunger = createHungerState(0.25, 1);

    const signal = senseHunger(hunger);

    expect(signal.hungerLevel).toBeCloseTo(0.75);
  });

  it("reports no hunger when energy is full", () => {
    const hunger = createHungerState(1, 1);

    const signal = senseHunger(hunger);

    expect(signal.hungerLevel).toBe(0);
  });

  it("reports maximum hunger when energy is empty", () => {
    const hunger = createHungerState(0, 1);

    const signal = senseHunger(hunger);

    expect(signal.hungerLevel).toBe(1);
  });
});