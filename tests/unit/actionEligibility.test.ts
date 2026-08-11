import { describe, expect, it } from "vitest";

import { createBrainState } from "../../src/simulation/brain/network.js";
import { keepEligibilitiesForTarget } from "../../src/simulation/brain/actionEligibility.js";

describe("selected action eligibility", () => {
  it("keeps eligibility only for connections feeding the selected target", () => {
    const brain = createBrainState(
      [
        {
          id: "input",
          module: "input",
          activation: 0,
        },
        {
          id: "idle",
          module: "action",
          activation: 0,
        },
        {
          id: "seek",
          module: "action",
          activation: 0,
        },
      ],
      [
        {
          id: "input-idle",
          sourceNodeId: "input",
          targetNodeId: "idle",
          weight: 0.5,
          enabled: true,
        },
        {
          id: "input-seek",
          sourceNodeId: "input",
          targetNodeId: "seek",
          weight: 0.5,
          enabled: true,
        },
      ],
    );

    const result =
      keepEligibilitiesForTarget(
        brain,
        [
          {
            connectionId: "input-idle",
            eligibility: 0.7,
          },
          {
            connectionId: "input-seek",
            eligibility: 0.8,
          },
        ],
        "seek",
      );

    expect(result).toEqual([
      {
        connectionId: "input-idle",
        eligibility: 0,
      },
      {
        connectionId: "input-seek",
        eligibility: 0.8,
      },
    ]);
  });

  it("rejects eligibility for an unknown connection", () => {
    const brain = createBrainState(
      [
        {
          id: "input",
          module: "input",
          activation: 0,
        },
      ],
      [],
    );

    expect(() =>
      keepEligibilitiesForTarget(
        brain,
        [
          {
            connectionId: "missing",
            eligibility: 1,
          },
        ],
        "seek",
      ),
    ).toThrow();
  });
});