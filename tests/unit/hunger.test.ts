import {
  describe,
  expect,
  it,
} from "vitest";

import {
  advanceHungerOverTime,
  consumeEnergy,
  createHungerState,
  getHungerLevel,
  restoreEnergy,
} from "../../src/simulation/biology/hunger.js";

describe("hunger biology", () => {
  it("derives hunger from current biological energy", () => {
    const state =
      createHungerState(
        0.25,
        1,
      );

    expect(
      getHungerLevel(state),
    ).toBeCloseTo(0.75);
  });

  it("consumes biological energy", () => {
    const state =
      createHungerState(
        0.8,
        1,
      );

    const result =
      consumeEnergy(
        state,
        0.3,
      );

    expect(
      result.energy,
    ).toBeCloseTo(0.5);
  });

  it("does not allow energy consumption below zero", () => {
    const state =
      createHungerState(
        0.2,
        1,
      );

    const result =
      consumeEnergy(
        state,
        1,
      );

    expect(
      result.energy,
    ).toBe(0);
  });

  it("restores biological energy", () => {
    const state =
      createHungerState(
        0.2,
        1,
      );

    const result =
      restoreEnergy(
        state,
        0.4,
      );

    expect(
      result.energy,
    ).toBeCloseTo(0.6);
  });

  it("does not restore biological energy above maximum", () => {
    const state =
      createHungerState(
        0.8,
        1,
      );

    const result =
      restoreEnergy(
        state,
        1,
      );

    expect(
      result.energy,
    ).toBe(1);
  });

  it("becomes hungrier as simulation time passes", () => {
    const state =
      createHungerState(
        0.8,
        1,
      );

    const result =
      advanceHungerOverTime(
        state,
        10,
        {
          energyLossPerSecond:
            0.02,
        },
      );

    expect(
      result.energy,
    ).toBeCloseTo(0.6);

    expect(
      getHungerLevel(result),
    ).toBeGreaterThan(
      getHungerLevel(state),
    );
  });

  it("produces the same metabolic result for equivalent elapsed time", () => {
    const initial =
      createHungerState(
        1,
        1,
      );

    const oneStep =
      advanceHungerOverTime(
        initial,
        10,
        {
          energyLossPerSecond:
            0.01,
        },
      );

    const firstHalf =
      advanceHungerOverTime(
        initial,
        5,
        {
          energyLossPerSecond:
            0.01,
        },
      );

    const twoSteps =
      advanceHungerOverTime(
        firstHalf,
        5,
        {
          energyLossPerSecond:
            0.01,
        },
      );

    expect(
      twoSteps.energy,
    ).toBeCloseTo(
      oneStep.energy,
    );
  });

  it("does not change energy when no simulation time passes", () => {
    const state =
      createHungerState(
        0.7,
        1,
      );

    const result =
      advanceHungerOverTime(
        state,
        0,
        {
          energyLossPerSecond:
            0.1,
        },
      );

    expect(
      result,
    ).toEqual(state);
  });

  it("rejects invalid elapsed simulation time", () => {
    const state =
      createHungerState(
        0.5,
        1,
      );

    expect(() =>
      advanceHungerOverTime(
        state,
        -1,
        {
          energyLossPerSecond:
            0.01,
        },
      ),
    ).toThrow(RangeError);
  });

  it("rejects invalid metabolic rate", () => {
    const state =
      createHungerState(
        0.5,
        1,
      );

    expect(() =>
      advanceHungerOverTime(
        state,
        1,
        {
          energyLossPerSecond:
            -0.01,
        },
      ),
    ).toThrow(RangeError);
  });

  it("rejects invalid starting energy", () => {
    expect(() =>
      createHungerState(
        2,
        1,
      ),
    ).toThrow(RangeError);
  });
});