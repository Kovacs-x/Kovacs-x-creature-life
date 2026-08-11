import { describe, expect, it } from "vitest";

import { selectHighestActivation } from "../../src/simulation/actions/competition.js";

describe("action competition", () => {
  it("selects the candidate with the highest activation", () => {
    const selection = selectHighestActivation([
      {
        actionId: "idle",
        activation: 0.2,
      },
      {
        actionId: "seek",
        activation: 0.8,
      },
      {
        actionId: "eat",
        activation: 0.1,
      },
    ]);

    expect(selection).toEqual({
      selectedActionId: "seek",
      activation: 0.8,
    });
  });

  it("keeps deterministic first-candidate priority on an exact tie", () => {
    const selection = selectHighestActivation([
      {
        actionId: "idle",
        activation: 0.5,
      },
      {
        actionId: "seek",
        activation: 0.5,
      },
    ]);

    expect(selection.selectedActionId).toBe("idle");
  });

  it("rejects an empty candidate set", () => {
    expect(() => selectHighestActivation([])).toThrow();
  });

  it("rejects non-finite activation", () => {
    expect(() =>
      selectHighestActivation([
        {
          actionId: "idle",
          activation: Number.NaN,
        },
      ]),
    ).toThrow(RangeError);
  });
});