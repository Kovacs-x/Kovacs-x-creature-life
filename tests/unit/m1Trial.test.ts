import { describe, expect, it } from "vitest";

import { runM1Trial } from "../../src/simulation/core/m1Trial.js";

describe("M1 integrated learning trial", () => {
  it("completes the perception-to-biological-consequence chain", () => {
    const result = runM1Trial({
      learningEnabled: true,
    });

    expect(result.selectedActionId).toBe("seek");

    expect(result.positionAfter.x).toBeGreaterThan(
      result.positionBefore.x,
    );

    expect(result.ate).toBe(true);

    expect(result.foodAfter.consumed).toBe(true);

    expect(result.hungerAfter.energy).toBeGreaterThan(
      result.hungerBefore.energy,
    );

    expect(result.reward).toBeGreaterThan(0);
  });

  it("changes at least one eligible brain connection when learning is enabled", () => {
    const result = runM1Trial({
      learningEnabled: true,
    });

    expect(result.weightChanges.length).toBeGreaterThan(0);

    expect(
      result.weightChanges.some(
        (change) => change.delta > 0,
      ),
    ).toBe(true);
  });

  it("produces the same biological consequence without changing weights when learning is disabled", () => {
    const result = runM1Trial({
      learningEnabled: false,
    });

    expect(result.ate).toBe(true);
    expect(result.reward).toBeGreaterThan(0);

    expect(result.weightChanges).toHaveLength(0);
  });
});