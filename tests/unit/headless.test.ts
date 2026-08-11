import { describe, expect, it } from "vitest";
import { HeadlessSimulation } from "../../src/simulation/core/headless.js";
import { createEmptyWorld } from "../../src/simulation/core/world.js";

describe("HeadlessSimulation", () => {
  it("constructs and advances without a renderer or creature behaviour", () => {
    const simulation = new HeadlessSimulation(
      createEmptyWorld({
        worldId: "world-1",
        seed: 123,
        bounds: {
          min: { x: 0, y: 0 },
          max: { x: 10, y: 10 },
        },
      }),
      2,
    );

    expect(simulation.getState().simulationTime).toBe(0);
    simulation.advance(1);
    simulation.advance(1);
    const result = simulation.advance(1);

    expect(result.state.simulationTime).toBe(3);
    expect(result.state.tickIndex).toBe(3);
    expect(result.state.creatures).toHaveLength(0);
    expect(result.telemetry).toHaveLength(2);
    expect(result.telemetry[0]?.tickIndex).toBe(2);
    expect(result.telemetry[1]?.tickIndex).toBe(3);
  });
});