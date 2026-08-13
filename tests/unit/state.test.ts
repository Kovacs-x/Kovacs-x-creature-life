import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createEmptyCreature,
  type BrainState,
  type CreatureState,
  type WorldState,
} from "../../src/simulation/core/contracts.js";

import {
  deserializeWorldState,
  serializeWorldState,
} from "../../src/simulation/core/serialization.js";

import { createEmptyWorld } from "../../src/simulation/core/world.js";
import { SeededRng } from "../../src/simulation/core/rng.js";
import { createM1Brain } from "../../src/simulation/brain/m1Brain.js";
import { createFoodObject } from "../../src/world/food.js";

describe("canonical world state", () => {
  it("round-trips an empty world through JSON without changing state", () => {
    const state =
      createEmptyWorld({
        worldId: "world-1",
        seed: 123,
        bounds: {
          min: {
            x: 0,
            y: 0,
          },
          max: {
            x: 100,
            y: 100,
          },
        },
      });

    const restored =
      deserializeWorldState(
        serializeWorldState(state),
      );

    expect(restored).toEqual(
      state,
    );
  });

  it("round-trips meaningful M1 creature, brain, biology, world, clock, and RNG state", () => {
    const rng =
      new SeededRng(123);

    /*
     * Advance the RNG before saving so this
     * is a real continuation state rather
     * than merely the original seed.
     */

    rng.nextUint32();
    rng.nextUint32();

    const baseBrain =
      createM1Brain();

    /*
     * Represent a brain that has already
     * learned something.
     *
     * The exact value is arbitrary here:
     * the important requirement is that a
     * learned weight survives save/load.
     */

    const learnedBrain: BrainState = {
      ...baseBrain,

      connections:
        baseBrain.connections.map(
          (connection) =>
            connection.id ===
            "food-to-seek"
              ? {
                  ...connection,
                  weight: 0.47,
                }
              : connection,
        ),
    };

    const creature: CreatureState = {
      ...createEmptyCreature(
        "creature-1",
        "M1 Creature",
      ),

      biology: {
        schemaVersion: 1,

        values: {
          energy: 0.42,
          maxEnergy: 1,
        },
      },

      brain:
        learnedBrain,

      position: {
        x: 4,
        y: 3,
      },

      telemetry: {
        enabled: true,
        maxEntries: 64,
      },
    };

    const food =
      createFoodObject(
        "food-1",
        6,
        3,
        0.5,
      );

    const emptyWorld =
      createEmptyWorld({
        worldId: "m1-world",
        seed: 123,

        bounds: {
          min: {
            x: 0,
            y: 0,
          },

          max: {
            x: 10,
            y: 10,
          },
        },
      });

    const state: WorldState = {
      ...emptyWorld,

      simulationTime: 12,
      tickIndex: 12,

      rngState:
        rng.state,

      objects: [
        food,
      ],

      creatures: [
        creature,
      ],
    };

    const serialized =
      serializeWorldState(
        state,
      );

    const restored =
      deserializeWorldState(
        serialized,
      );

    /*
     * Strongest basic assertion:
     * the complete meaningful state is
     * identical after JSON round-trip.
     */

    expect(
      restored,
    ).toEqual(
      state,
    );

    /*
     * Explicit assertions make failures
     * easier to diagnose and document
     * the M1 persistence contract.
     */

    expect(
      restored.simulationTime,
    ).toBe(12);

    expect(
      restored.tickIndex,
    ).toBe(12);

    expect(
      restored.creatures[0]
        ?.position,
    ).toEqual({
      x: 4,
      y: 3,
    });

    expect(
      restored.creatures[0]
        ?.biology.values.energy,
    ).toBeCloseTo(
      0.42,
    );

    expect(
      restored.creatures[0]
        ?.biology.values.maxEnergy,
    ).toBe(1);

    const restoredLearnedWeight =
      restored.creatures[0]
        ?.brain.connections.find(
          (connection) =>
            connection.id ===
            "food-to-seek",
        )
        ?.weight;

    expect(
      restoredLearnedWeight,
    ).toBeCloseTo(
      0.47,
    );

    expect(
      restored.objects,
    ).toEqual([
      food,
    ]);

    /*
     * RNG continuity matters independently
     * of merely preserving the numeric
     * state object.
     *
     * A restored RNG must generate exactly
     * the number the original RNG would
     * have generated next.
     */

    const resumedRng =
      new SeededRng(
        restored.rngState,
      );

    const expectedNextRandomValue =
      rng.nextUint32();

    expect(
      resumedRng.nextUint32(),
    ).toBe(
      expectedNextRandomValue,
    );
  });

  it("rejects unsupported schema versions", () => {
    const invalidState =
      JSON.stringify({
        ...createEmptyWorld({
          worldId:
            "world-1",

          seed: 123,

          bounds: {
            min: {
              x: 0,
              y: 0,
            },

            max: {
              x: 100,
              y: 100,
            },
          },
        }),

        schemaVersion: 999,
      });

    expect(() =>
      deserializeWorldState(
        invalidState,
      ),
    ).toThrow(
      "Unsupported world schema version.",
    );
  });
});