import { describe, expect, it } from "vitest";
import { createEmptyWorld } from "../../src/simulation/core/world.js";
import {
  deserializeWorldState,
  serializeWorldState,
} from "../../src/simulation/core/serialization.js";

describe("canonical world state", () => {
  it("round-trips through JSON without changing state", () => {
    const state = createEmptyWorld({
      worldId: "world-1",
      seed: 123,
      bounds: {
        min: { x: 0, y: 0 },
        max: { x: 100, y: 100 },
      },
    });

    expect(deserializeWorldState(serializeWorldState(state))).toEqual(state);
  });

  it("rejects unsupported schema versions", () => {
    const invalidState = JSON.stringify({
      ...createEmptyWorld({
        worldId: "world-1",
        seed: 123,
        bounds: {
          min: { x: 0, y: 0 },
          max: { x: 100, y: 100 },
        },
      }),
      schemaVersion: 999,
    });

    expect(() => deserializeWorldState(invalidState)).toThrow(
      "Unsupported world schema version.",
    );
  });
});