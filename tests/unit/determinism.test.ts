import {
  describe,
  expect,
  it,
} from "vitest";

import {
  runM1Trial,
} from "../../src/simulation/core/m1Trial.js";

import {
  createM1Brain,
} from "../../src/simulation/brain/m1Brain.js";

import {
  HeadlessSimulation,
} from "../../src/simulation/core/headless.js";

import {
  createEmptyWorld,
} from "../../src/simulation/core/world.js";

import {
  SeededRng,
} from "../../src/simulation/core/rng.js";

describe("M1 deterministic replay", () => {
  it("reproduces the exact same M1 behavioural and learning trace from identical initial conditions", () => {
    const first =
      runM1Trial({
        learningEnabled: true,
        brain: createM1Brain(),
      });

    const second =
      runM1Trial({
        learningEnabled: true,
        brain: createM1Brain(),
      });

    expect(
      second,
    ).toEqual(
      first,
    );

    expect(
      second.ticks,
    ).toEqual(
      first.ticks,
    );

    expect(
      second.positionAfter,
    ).toEqual(
      first.positionAfter,
    );

    expect(
      second.hungerAfter,
    ).toEqual(
      first.hungerAfter,
    );

    expect(
      second.foodAfter,
    ).toEqual(
      first.foodAfter,
    );

    expect(
      second.reward,
    ).toBe(
      first.reward,
    );

    expect(
      second.weightChanges,
    ).toEqual(
      first.weightChanges,
    );

    expect(
      second.brainAfter,
    ).toEqual(
      first.brainAfter,
    );
  });

  it("reproduces the same learned sequence across multiple experiences", () => {
    const firstSequenceBrain =
      createM1Brain();

    const firstTrialA =
      runM1Trial({
        learningEnabled: true,
        brain: firstSequenceBrain,
      });

    const firstTrialB =
      runM1Trial({
        learningEnabled: true,
        brain:
          firstTrialA.brainAfter,
      });

    const firstTrialC =
      runM1Trial({
        learningEnabled: true,
        brain:
          firstTrialB.brainAfter,
      });

    const secondSequenceBrain =
      createM1Brain();

    const secondTrialA =
      runM1Trial({
        learningEnabled: true,
        brain: secondSequenceBrain,
      });

    const secondTrialB =
      runM1Trial({
        learningEnabled: true,
        brain:
          secondTrialA.brainAfter,
      });

    const secondTrialC =
      runM1Trial({
        learningEnabled: true,
        brain:
          secondTrialB.brainAfter,
      });

    expect(
      secondTrialA,
    ).toEqual(
      firstTrialA,
    );

    expect(
      secondTrialB,
    ).toEqual(
      firstTrialB,
    );

    expect(
      secondTrialC,
    ).toEqual(
      firstTrialC,
    );

    expect(
      secondTrialC.brainAfter,
    ).toEqual(
      firstTrialC.brainAfter,
    );
  });

  it("reproduces the same seeded RNG stream", () => {
    const first =
      new SeededRng(12345);

    const second =
      new SeededRng(12345);

    const firstSequence =
      Array.from(
        {
          length: 16,
        },
        () =>
          first.nextUint32(),
      );

    const secondSequence =
      Array.from(
        {
          length: 16,
        },
        () =>
          second.nextUint32(),
      );

    expect(
      secondSequence,
    ).toEqual(
      firstSequence,
    );

    expect(
      second.state,
    ).toEqual(
      first.state,
    );
  });

  it("reproduces the same world trace for identical seed and timing input", () => {
    const createSimulation =
      () =>
        new HeadlessSimulation(
          createEmptyWorld({
            worldId:
              "deterministic-world",

            seed: 12345,

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
          }),
          16,
        );

    const first =
      createSimulation();

    const second =
      createSimulation();

    const timingStream = [
      0.25,
      0.5,
      1,
      0.125,
      2,
    ];

    const firstTrace =
      timingStream.map(
        (deltaSeconds) =>
          first.advance(
            deltaSeconds,
          ),
      );

    const secondTrace =
      timingStream.map(
        (deltaSeconds) =>
          second.advance(
            deltaSeconds,
          ),
      );

    expect(
      secondTrace,
    ).toEqual(
      firstTrace,
    );

    expect(
      second.getState(),
    ).toEqual(
      first.getState(),
    );

    expect(
      second.getTelemetry(),
    ).toEqual(
      first.getTelemetry(),
    );
  });

  it("can resume RNG deterministically from saved state", () => {
    const original =
      new SeededRng(777);

    original.nextUint32();
    original.nextUint32();
    original.nextUint32();

    const savedState =
      original.state;

    const resumed =
      new SeededRng(
        savedState,
      );

    const originalContinuation =
      Array.from(
        {
          length: 8,
        },
        () =>
          original.nextUint32(),
      );

    const resumedContinuation =
      Array.from(
        {
          length: 8,
        },
        () =>
          resumed.nextUint32(),
      );

    expect(
      resumedContinuation,
    ).toEqual(
      originalContinuation,
    );
  });
});