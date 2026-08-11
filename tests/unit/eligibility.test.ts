import { describe, expect, it } from "vitest";

import { createBrainState } from "../../src/simulation/brain/network.js";
import { deriveConnectionEligibilities } from "../../src/simulation/brain/eligibility.js";

describe("connection eligibility", () => {
  it("derives eligibility from source and target activation", () => {
    const brain = createBrainState(
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
          weight: 0.5,
          enabled: true,
        },
      ],
    );

    const eligibilities = deriveConnectionEligibilities(
      brain,
      {
        input: 0.8,
        output: 0.5,
      },
    );

    expect(eligibilities).toEqual([
      {
        connectionId: "input-to-output",
        eligibility: 0.4,
      },
    ]);
  });

  it("produces zero eligibility when target activation is zero", () => {
    const brain = createBrainState(
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
          weight: 0.5,
          enabled: true,
        },
      ],
    );

    const eligibilities = deriveConnectionEligibilities(
      brain,
      {
        input: 1,
        output: 0,
      },
    );

    expect(eligibilities[0]?.eligibility).toBe(0);
  });

  it("produces zero eligibility for disabled connections", () => {
    const brain = createBrainState(
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
          weight: 0.5,
          enabled: false,
        },
      ],
    );

    const eligibilities = deriveConnectionEligibilities(
      brain,
      {
        input: 1,
        output: 1,
      },
    );

    expect(eligibilities[0]?.eligibility).toBe(0);
  });

  it("clamps activation before deriving eligibility", () => {
    const brain = createBrainState(
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
          weight: 0.5,
          enabled: true,
        },
      ],
    );

    const eligibilities = deriveConnectionEligibilities(
      brain,
      {
        input: 2,
        output: 0.5,
      },
    );

    expect(eligibilities[0]?.eligibility).toBeCloseTo(0.5);
  });
});