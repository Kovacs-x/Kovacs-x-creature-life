import { describe, expect, it } from "vitest";

import { runM1Trial } from "../../src/simulation/core/m1Trial.js";

describe("M1 integrated multi-tick learning trial", () => {
  it("selects seek before reaching the food", () => {
    const result = runM1Trial({
      learningEnabled: true,
    });

    expect(
      result.ticks[0]?.selectedActionId,
    ).toBe("seek");
  });

  it("moves toward the perceived food after selecting seek", () => {
    const result = runM1Trial({
      learningEnabled: true,
    });

    expect(
      result.positionAfter.x,
    ).toBeGreaterThan(
      result.positionBefore.x,
    );
  });

  it("selects eat only after reaching food contact range", () => {
    const result = runM1Trial({
      learningEnabled: true,
    });

    expect(
      result.ticks[1]?.selectedActionId,
    ).toBe("eat");
  });

  it("consumes food only after the eat action is selected", () => {
    const result = runM1Trial({
      learningEnabled: true,
    });

    expect(result.ate).toBe(true);
    expect(
      result.foodAfter.consumed,
    ).toBe(true);
  });

  it("improves biological energy after eating", () => {
    const result = runM1Trial({
      learningEnabled: true,
    });

    expect(
      result.hungerAfter.energy,
    ).toBeGreaterThan(
      result.hungerBefore.energy,
    );
  });

  it("derives positive reward from biological improvement", () => {
    const result = runM1Trial({
      learningEnabled: true,
    });

    expect(
      result.reward,
    ).toBeGreaterThan(0);
  });

  it("changes eligible brain weights when learning is enabled", () => {
    const result = runM1Trial({
      learningEnabled: true,
    });

    expect(
      result.weightChanges.length,
    ).toBeGreaterThan(0);

    expect(
      result.weightChanges.some(
        (change) =>
          change.delta > 0,
      ),
    ).toBe(true);
  });

  it("does not change weights when learning is disabled", () => {
    const result = runM1Trial({
      learningEnabled: false,
    });

    expect(result.ate).toBe(true);

    expect(
      result.weightChanges,
    ).toHaveLength(0);
  });

  it("can carry a learned brain into a later experience", () => {
    const firstTrial = runM1Trial({
      learningEnabled: true,
    });

    const secondTrial = runM1Trial({
      learningEnabled: true,
      brain: firstTrial.brainAfter,
    });

    expect(
      secondTrial.brainBefore.connections,
    ).toEqual(
      firstTrial.brainAfter.connections,
    );
  });

  it("continues changing the carried brain after another rewarded experience", () => {
    const firstTrial = runM1Trial({
      learningEnabled: true,
    });

    const secondTrial = runM1Trial({
      learningEnabled: true,
      brain: firstTrial.brainAfter,
    });

    const firstWeights =
      firstTrial.brainAfter.connections.map(
        (connection) =>
          connection.weight,
      );

    const secondWeights =
      secondTrial.brainAfter.connections.map(
        (connection) =>
          connection.weight,
      );

    expect(
      secondWeights,
    ).not.toEqual(
      firstWeights,
    );
  });

  it("keeps the carried brain unchanged across control trials", () => {
    const firstTrial = runM1Trial({
      learningEnabled: false,
    });

    const secondTrial = runM1Trial({
      learningEnabled: false,
      brain: firstTrial.brainAfter,
    });

    expect(
      secondTrial.brainAfter.connections,
    ).toEqual(
      firstTrial.brainAfter.connections,
    );
  });
});