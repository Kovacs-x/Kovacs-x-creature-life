import { describe, expect, it } from "vitest";

import { mergeEligibilityTrace } from "../../src/simulation/brain/eligibilityTrace.js";

describe("eligibility trace", () => {
  it("carries previous eligibility forward with decay", () => {
    const result = mergeEligibilityTrace(
      [
        {
          connectionId: "seek-connection",
          eligibility: 0.8,
        },
      ],
      [],
      {
        decay: 0.5,
      },
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.connectionId).toBe("seek-connection");
    expect(result[0]?.eligibility).toBeCloseTo(0.4);
  });

  it("keeps stronger current eligibility", () => {
    const result = mergeEligibilityTrace(
      [
        {
          connectionId: "connection-1",
          eligibility: 0.6,
        },
      ],
      [
        {
          connectionId: "connection-1",
          eligibility: 0.8,
        },
      ],
      {
        decay: 0.5,
      },
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.connectionId).toBe("connection-1");
    expect(result[0]?.eligibility).toBeCloseTo(0.8);
  });

  it("keeps decayed previous eligibility when it remains stronger", () => {
    const result = mergeEligibilityTrace(
      [
        {
          connectionId: "connection-1",
          eligibility: 0.8,
        },
      ],
      [
        {
          connectionId: "connection-1",
          eligibility: 0.1,
        },
      ],
      {
        decay: 0.75,
      },
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.connectionId).toBe("connection-1");
    expect(result[0]?.eligibility).toBeCloseTo(0.6);
  });

  it("preserves different connections from different ticks", () => {
    const result = mergeEligibilityTrace(
      [
        {
          connectionId: "seek",
          eligibility: 0.8,
        },
      ],
      [
        {
          connectionId: "eat",
          eligibility: 0.9,
        },
      ],
      {
        decay: 0.5,
      },
    );

    const seek = result.find(
      (entry) => entry.connectionId === "seek",
    );

    const eat = result.find(
      (entry) => entry.connectionId === "eat",
    );

    expect(seek?.eligibility).toBeCloseTo(0.4);
    expect(eat?.eligibility).toBeCloseTo(0.9);
  });

  it("rejects invalid decay", () => {
    expect(() =>
      mergeEligibilityTrace(
        [],
        [],
        {
          decay: 1.5,
        },
      ),
    ).toThrow(RangeError);
  });
});