import { describe, expect, it } from "vitest";
import { SeededRng } from "../../src/simulation/core/rng.js";

describe("SeededRng", () => {
  it("reproduces the same sequence for the same seed", () => {
    const first = new SeededRng(42);
    const second = new SeededRng(42);

    expect(Array.from({ length: 8 }, () => first.nextUint32())).toEqual(
      Array.from({ length: 8 }, () => second.nextUint32()),
    );
  });

  it("can resume from serialisable state", () => {
    const original = new SeededRng(7);
    original.nextUint32();
    const resumed = new SeededRng(original.state);

    expect(resumed.nextUint32()).toBe(original.nextUint32());
  });
});