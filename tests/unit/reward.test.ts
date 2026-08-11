import { describe, expect, it } from "vitest";

import { createHungerState } from "../../src/simulation/biology/hunger.js";
import { deriveEnergyReward } from "../../src/simulation/brain/reward.js";

describe("M1 biological reward derivation", () => {
  it("produces positive reward when biological energy improves", () => {
    const before = createHungerState(0.2, 1);
    const after = createHungerState(0.7, 1);

    const reward = deriveEnergyReward(before, after);

    expect(reward.energyChange).toBeCloseTo(0.5);
    expect(reward.value).toBeCloseTo(0.5);
  });

  it("produces zero reward when biological energy does not change", () => {
    const before = createHungerState(0.4, 1);
    const after = createHungerState(0.4, 1);

    const reward = deriveEnergyReward(before, after);

    expect(reward.energyChange).toBe(0);
    expect(reward.value).toBe(0);
  });

  it("produces negative reward when biological energy worsens", () => {
    const before = createHungerState(0.8, 1);
    const after = createHungerState(0.3, 1);

    const reward = deriveEnergyReward(before, after);

    expect(reward.energyChange).toBeCloseTo(-0.5);
    expect(reward.value).toBeCloseTo(-0.5);
  });

  it("normalises reward relative to maximum energy", () => {
    const before = createHungerState(2, 10);
    const after = createHungerState(7, 10);

    const reward = deriveEnergyReward(before, after);

    expect(reward.value).toBeCloseTo(0.5);
  });

  it("rejects incompatible maximum-energy states", () => {
    const before = createHungerState(0.5, 1);
    const after = createHungerState(1, 2);

    expect(() => deriveEnergyReward(before, after)).toThrow();
  });
});