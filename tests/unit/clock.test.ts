import { describe, expect, it } from "vitest";
import { SimulationClock } from "../../src/simulation/core/clock.js";

describe("SimulationClock", () => {
  it("advances explicit simulation time independently of wall-clock APIs", () => {
    const clock = new SimulationClock();

    expect(clock.advance(0.25)).toEqual({ tickIndex: 1, timeSeconds: 0.25 });
    expect(clock.advance(0.75)).toEqual({ tickIndex: 2, timeSeconds: 1 });
  });

  it("rejects invalid deltas", () => {
    const clock = new SimulationClock();

    expect(() => clock.advance(-1)).toThrow(RangeError);
    expect(() => clock.advance(Number.NaN)).toThrow(RangeError);
  });
});