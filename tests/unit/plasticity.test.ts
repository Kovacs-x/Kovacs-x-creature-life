import { describe, expect, it } from "vitest";

import { createBrainState } from "../../src/simulation/brain/network.js";
import { applyRewardPlasticity } from "../../src/simulation/brain/plasticity.js";

function createTestBrain() {
  return createBrainState(
    [
      {
        id: "input",
        module: "input",
        activation: 0,
      },
      {
        id: "output",
        module: "action",
        activation: 0,
      },
    ],
    [
      {
        id: "input-to-output",
        sourceNodeId: "input",
        targetNodeId: "output",
        weight: 0.2,
        enabled: true,
      },
    ],
  );
}

describe("reward-modulated plasticity", () => {
  it("strengthens an eligible connection after positive reward", () => {
    const brain = createTestBrain();

    const result = applyRewardPlasticity(
      brain,
      [
        {
          connectionId: "input-to-output",
          eligibility: 0.8,
        },
      ],
      0.5,
      {
        learningRate: 0.25,
        minWeight: -1,
        maxWeight: 1,
        learningEnabled: true,
      },
    );

    expect(
      result.brain.connections[0]?.weight,
    ).toBeCloseTo(0.3);

    expect(result.changes).toHaveLength(1);
    expect(result.changes[0]?.before).toBeCloseTo(0.2);
    expect(result.changes[0]?.after).toBeCloseTo(0.3);
  });

  it("weakens an eligible connection after negative reward", () => {
    const brain = createTestBrain();

    const result = applyRewardPlasticity(
      brain,
      [
        {
          connectionId: "input-to-output",
          eligibility: 1,
        },
      ],
      -0.5,
      {
        learningRate: 0.2,
        minWeight: -1,
        maxWeight: 1,
        learningEnabled: true,
      },
    );

    expect(
      result.brain.connections[0]?.weight,
    ).toBeCloseTo(0.1);
  });

  it("does not change an ineligible connection", () => {
    const brain = createTestBrain();

    const result = applyRewardPlasticity(
      brain,
      [],
      1,
      {
        learningRate: 0.5,
        minWeight: -1,
        maxWeight: 1,
        learningEnabled: true,
      },
    );

    expect(
      result.brain.connections[0]?.weight,
    ).toBeCloseTo(0.2);

    expect(result.changes).toHaveLength(0);
  });

  it("does not learn when learning is disabled", () => {
    const brain = createTestBrain();

    const result = applyRewardPlasticity(
      brain,
      [
        {
          connectionId: "input-to-output",
          eligibility: 1,
        },
      ],
      1,
      {
        learningRate: 0.5,
        minWeight: -1,
        maxWeight: 1,
        learningEnabled: false,
      },
    );

    expect(
      result.brain.connections[0]?.weight,
    ).toBeCloseTo(0.2);

    expect(result.changes).toHaveLength(0);
  });

  it("respects configured weight limits", () => {
    const brain = createTestBrain();

    const result = applyRewardPlasticity(
      brain,
      [
        {
          connectionId: "input-to-output",
          eligibility: 1,
        },
      ],
      1,
      {
        learningRate: 10,
        minWeight: -1,
        maxWeight: 1,
        learningEnabled: true,
      },
    );

    expect(result.brain.connections[0]?.weight).toBe(1);
  });
});