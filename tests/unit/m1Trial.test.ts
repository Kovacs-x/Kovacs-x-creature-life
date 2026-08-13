import {
  describe,
  expect,
  it,
} from "vitest";

import {
  M1_TRIAL_ENERGY_LOSS_PER_SECOND,
  M1_TRIAL_TICK_SECONDS,
  runM1Trial,
} from "../../src/simulation/core/m1Trial.js";

describe(
  "M1 integrated multi-tick learning trial",
  () => {
    it("selects seek before reaching the food", () => {
      const result =
        runM1Trial({
          learningEnabled: true,
        });

      expect(
        result.ticks[0]
          ?.selectedActionId,
      ).toBe("seek");
    });

    it("moves toward the perceived food after selecting seek", () => {
      const result =
        runM1Trial({
          learningEnabled: true,
        });

      expect(
        result.positionAfter.x,
      ).toBeGreaterThan(
        result.positionBefore.x,
      );
    });

    it("loses biological energy as simulation time advances", () => {
      const result =
        runM1Trial({
          learningEnabled: true,
        });

      const tick1 =
        result.ticks[0];

      const tick2 =
        result.ticks[1];

      expect(
        tick1,
      ).toBeDefined();

      expect(
        tick2,
      ).toBeDefined();

      expect(
        tick2?.energy,
      ).toBeLessThan(
        tick1?.energy ?? 0,
      );

      const expectedEnergyLoss =
        M1_TRIAL_TICK_SECONDS *
        M1_TRIAL_ENERGY_LOSS_PER_SECOND;

      expect(
        (tick1?.energy ?? 0) -
          (tick2?.energy ?? 0),
      ).toBeCloseTo(
        expectedEnergyLoss,
      );
    });

    it("has lower energy on tick two before eating occurs", () => {
      const result =
        runM1Trial({
          learningEnabled: true,
        });

      expect(
        result.ticks[0]
          ?.energy,
      ).toBeCloseTo(
        0.1,
      );

      expect(
        result.ticks[1]
          ?.energy,
      ).toBeCloseTo(
        0.08,
      );
    });

    it("selects eat only after reaching food contact range", () => {
      const result =
        runM1Trial({
          learningEnabled: true,
        });

      expect(
        result.ticks[1]
          ?.selectedActionId,
      ).toBe("eat");
    });

    it("consumes food only after the eat action is selected", () => {
      const result =
        runM1Trial({
          learningEnabled: true,
        });

      expect(
        result.ate,
      ).toBe(true);

      expect(
        result.foodAfter.consumed,
      ).toBe(true);
    });

    it("eating overcomes the metabolic energy loss", () => {
      const result =
        runM1Trial({
          learningEnabled: true,
        });

      expect(
        result.hungerAfter.energy,
      ).toBeGreaterThan(
        result.hungerBefore.energy,
      );

      expect(
        result.hungerAfter.energy,
      ).toBeCloseTo(
        0.58,
      );
    });

    it("derives reward from the immediate biological improvement caused by eating", () => {
      const result =
        runM1Trial({
          learningEnabled: true,
        });

      expect(
        result.reward,
      ).toBeCloseTo(
        0.5,
      );
    });

    it("changes eligible brain weights when learning is enabled", () => {
      const result =
        runM1Trial({
          learningEnabled: true,
        });

      expect(
        result.weightChanges.length,
      ).toBeGreaterThan(0);

      expect(
        result.weightChanges.some(
          (change) =>
            change.delta > 0,
        ),
      ).toBe(true);
    });

    it("does not change weights when learning is disabled", () => {
      const result =
        runM1Trial({
          learningEnabled: false,
        });

      expect(
        result.ate,
      ).toBe(true);

      expect(
        result.weightChanges,
      ).toHaveLength(0);
    });

    it("can carry a learned brain into a later experience", () => {
      const firstTrial =
        runM1Trial({
          learningEnabled: true,
        });

      const secondTrial =
        runM1Trial({
          learningEnabled: true,

          brain:
            firstTrial.brainAfter,
        });

      expect(
        secondTrial
          .brainBefore
          .connections,
      ).toEqual(
        firstTrial
          .brainAfter
          .connections,
      );
    });

    it("continues changing the carried brain after another rewarded experience", () => {
      const firstTrial =
        runM1Trial({
          learningEnabled: true,
        });

      const secondTrial =
        runM1Trial({
          learningEnabled: true,

          brain:
            firstTrial.brainAfter,
        });

      const firstWeights =
        firstTrial.brainAfter
          .connections.map(
            (connection) =>
              connection.weight,
          );

      const secondWeights =
        secondTrial.brainAfter
          .connections.map(
            (connection) =>
              connection.weight,
          );

      expect(
        secondWeights,
      ).not.toEqual(
        firstWeights,
      );
    });

    it("keeps the carried brain unchanged across control trials", () => {
      const firstTrial =
        runM1Trial({
          learningEnabled: false,
        });

      const secondTrial =
        runM1Trial({
          learningEnabled: false,

          brain:
            firstTrial.brainAfter,
        });

      expect(
        secondTrial
          .brainAfter
          .connections,
      ).toEqual(
        firstTrial
          .brainAfter
          .connections,
      );
    });
  },
);