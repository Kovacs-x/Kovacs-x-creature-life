import {
  describe,
  expect,
  it,
} from "vitest";

import {
  M1_EXPERIMENT_TRAINING_TRIALS,
  runM1Experiment,
} from "../../src/simulation/core/m1Experiment.js";

describe(
  "M1 learning versus control experiment",
  () => {
    it("uses a predefined repeated training count", () => {
      expect(
        M1_EXPERIMENT_TRAINING_TRIALS,
      ).toBe(3);
    });

    it("the naive brain does not seek during the harder probe", () => {
      const experiment =
        runM1Experiment();

      expect(
        experiment.naiveProbe
          .seekActivation,
      ).toBeLessThan(
        experiment.naiveProbe
          .idleActivation,
      );

      expect(
        experiment.naiveProbe
          .selectedActionId,
      ).toBe("idle");
    });

    it("rewarded training increases later seek activation", () => {
      const experiment =
        runM1Experiment();

      expect(
        experiment.trainedProbe
          .seekActivation,
      ).toBeGreaterThan(
        experiment.naiveProbe
          .seekActivation,
      );
    });

    it("the trained brain seeks during the harder probe", () => {
      const experiment =
        runM1Experiment();

      expect(
        experiment.trainedProbe
          .seekActivation,
      ).toBeGreaterThan(
        experiment.trainedProbe
          .idleActivation,
      );

      expect(
        experiment.trainedProbe
          .selectedActionId,
      ).toBe("seek");
    });

    it("the learning-disabled control does not acquire the trained behaviour", () => {
      const experiment =
        runM1Experiment();

      expect(
        experiment.controlProbe
          .selectedActionId,
      ).toBe("idle");

      expect(
        experiment.controlProbe
          .seekActivation,
      ).toBeCloseTo(
        experiment.naiveProbe
          .seekActivation,
      );
    });

    it("trained behaviour exceeds the identical control condition", () => {
      const experiment =
        runM1Experiment();

      expect(
        experiment.trainedProbe
          .seekActivation,
      ).toBeGreaterThan(
        experiment.controlProbe
          .seekActivation,
      );
    });

    it("training changes brain connection weights while control does not", () => {
      const experiment =
        runM1Experiment();

      const trainedWeights =
        experiment.trainedBrain
          .connections.map(
            (connection) =>
              connection.weight,
          );

      const controlWeights =
        experiment.controlBrain
          .connections.map(
            (connection) =>
              connection.weight,
          );

      expect(
        trainedWeights,
      ).not.toEqual(
        controlWeights,
      );
    });
  },
);