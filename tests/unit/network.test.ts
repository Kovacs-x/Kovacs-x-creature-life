import { describe, expect, it } from "vitest";

import {
  createBrainState,
  evaluateBrain,
} from "../../src/simulation/brain/network.js";

describe("weighted brain network", () => {
  it("propagates activation through an enabled weighted connection", () => {
    const brain = createBrainState(
      [
        {
          id: "input-a",
          module: "input",
          activation: 0,
        },
        {
          id: "output-a",
          module: "output",
          activation: 0,
        },
      ],
      [
        {
          id: "connection-1",
          sourceNodeId: "input-a",
          targetNodeId: "output-a",
          weight: 0.5,
          enabled: true,
        },
      ],
    );

    const result = evaluateBrain(
      brain,
      {
        "input-a": 0.8,
      },
    );

    expect(
      result.activations[
        "input-a"
      ],
    ).toBeCloseTo(0.8);

    expect(
      result.activations[
        "output-a"
      ],
    ).toBeCloseTo(0.4);
  });

  it("does not propagate through a disabled connection", () => {
    const brain = createBrainState(
      [
        {
          id: "input-a",
          module: "input",
          activation: 0,
        },
        {
          id: "output-a",
          module: "output",
          activation: 0,
        },
      ],
      [
        {
          id: "connection-1",
          sourceNodeId: "input-a",
          targetNodeId: "output-a",
          weight: 1,
          enabled: false,
        },
      ],
    );

    const result = evaluateBrain(
      brain,
      {
        "input-a": 1,
      },
    );

    expect(
      result.activations[
        "output-a"
      ],
    ).toBe(0);
  });

  it("combines activation from multiple inputs", () => {
    const brain = createBrainState(
      [
        {
          id: "input-a",
          module: "input",
          activation: 0,
        },
        {
          id: "input-b",
          module: "input",
          activation: 0,
        },
        {
          id: "output-a",
          module: "output",
          activation: 0,
        },
      ],
      [
        {
          id: "connection-1",
          sourceNodeId: "input-a",
          targetNodeId: "output-a",
          weight: 0.4,
          enabled: true,
        },
        {
          id: "connection-2",
          sourceNodeId: "input-b",
          targetNodeId: "output-a",
          weight: 0.5,
          enabled: true,
        },
      ],
    );

    const result = evaluateBrain(
      brain,
      {
        "input-a": 0.5,
        "input-b": 0.8,
      },
    );

    expect(
      result.activations[
        "output-a"
      ],
    ).toBeCloseTo(0.6);
  });

  it("produces the same result regardless of connection order", () => {
    const nodes = [
      {
        id: "input-a",
        module: "input",
        activation: 0,
      },
      {
        id: "input-b",
        module: "input",
        activation: 0,
      },
      {
        id: "output-a",
        module: "output",
        activation: 0,
      },
    ];

    const firstBrain =
      createBrainState(
        nodes,
        [
          {
            id: "connection-1",
            sourceNodeId: "input-a",
            targetNodeId: "output-a",
            weight: 0.8,
            enabled: true,
          },
          {
            id: "connection-2",
            sourceNodeId: "input-b",
            targetNodeId: "output-a",
            weight: -0.4,
            enabled: true,
          },
        ],
      );

    const secondBrain =
      createBrainState(
        nodes,
        [
          {
            id: "connection-2",
            sourceNodeId: "input-b",
            targetNodeId: "output-a",
            weight: -0.4,
            enabled: true,
          },
          {
            id: "connection-1",
            sourceNodeId: "input-a",
            targetNodeId: "output-a",
            weight: 0.8,
            enabled: true,
          },
        ],
      );

    const inputs = {
      "input-a": 1,
      "input-b": 0.5,
    };

    const first =
      evaluateBrain(
        firstBrain,
        inputs,
      );

    const second =
      evaluateBrain(
        secondBrain,
        inputs,
      );

    expect(
      first.activations[
        "output-a"
      ],
    ).toBeCloseTo(0.6);

    expect(
      second.activations[
        "output-a"
      ],
    ).toBeCloseTo(0.6);

    expect(
      first.activations[
        "output-a"
      ],
    ).toBeCloseTo(
      second.activations[
        "output-a"
      ] ?? 0,
    );
  });

  it("does not accidentally propagate through multiple network hops in one evaluation", () => {
    const brain = createBrainState(
      [
        {
          id: "input",
          module: "input",
          activation: 0,
        },
        {
          id: "hidden",
          module: "association",
          activation: 0,
        },
        {
          id: "output",
          module: "output",
          activation: 0,
        },
      ],
      [
        {
          id: "input-hidden",
          sourceNodeId: "input",
          targetNodeId: "hidden",
          weight: 1,
          enabled: true,
        },
        {
          id: "hidden-output",
          sourceNodeId: "hidden",
          targetNodeId: "output",
          weight: 1,
          enabled: true,
        },
      ],
    );

    const result = evaluateBrain(
      brain,
      {
        input: 1,
      },
    );

    expect(
      result.activations[
        "hidden"
      ],
    ).toBe(1);

    expect(
      result.activations[
        "output"
      ],
    ).toBe(0);
  });

  it("rejects connections that reference missing nodes", () => {
    expect(() =>
      createBrainState(
        [
          {
            id: "input-a",
            module: "input",
            activation: 0,
          },
        ],
        [
          {
            id: "invalid-connection",
            sourceNodeId: "input-a",
            targetNodeId:
              "missing-node",
            weight: 1,
            enabled: true,
          },
        ],
      ),
    ).toThrow();
  });
});