import {
  describe,
  expect,
  it,
} from "vitest";

import {
  M2_EXPERIMENT_FOOD_X,
  runM2Experiment,
} from "../../src/simulation/core/m2Experiment.js";

describe(
  "M2.5 controlled memory behavioural experiment",
  () => {
    it("uses the established primary probe world condition", () => {
      expect(
        M2_EXPERIMENT_FOOD_X,
      ).toBe(3);
    });

    it("keeps the experimental branches equivalent before the occluded probe apart from usable memory", () => {
      const experiment =
        runM2Experiment();

      /*
       * Same physical starting position.
       */
      expect(
        experiment
          .memoryEnabled
          .probeStart
          .position,
      ).toEqual(
        experiment
          .memoryDisabled
          .probeStart
          .position,
      );

      /*
       * Same biology.
       */
      expect(
        experiment
          .memoryEnabled
          .probeStart
          .hunger,
      ).toEqual(
        experiment
          .memoryDisabled
          .probeStart
          .hunger,
      );

      /*
       * Same physical world state.
       */
      expect(
        experiment
          .memoryEnabled
          .probeStart
          .food,
      ).toEqual(
        experiment
          .memoryDisabled
          .probeStart
          .food,
      );

      /*
       * Same neural state and weights before
       * the memory-dependent probe.
       *
       * During the preceding visible tick,
       * recall was not double-counted.
       */
      expect(
        experiment
          .memoryEnabled
          .probeStart
          .brain,
      ).toEqual(
        experiment
          .memoryDisabled
          .probeStart
          .brain,
      );
    });

    it("removes direct perception while keeping food physically present in both branches", () => {
      const experiment =
        runM2Experiment();

      expect(
        experiment
          .memoryEnabled
          .physicalFoodPresent,
      ).toBe(true);

      expect(
        experiment
          .memoryDisabled
          .physicalFoodPresent,
      ).toBe(true);

      expect(
        experiment
          .memoryEnabled
          .directFoodPerceptionPresent,
      ).toBe(false);

      expect(
        experiment
          .memoryDisabled
          .directFoodPerceptionPresent,
      ).toBe(false);
    });

    it("gives the memory-enabled Creature legitimate recall while the equivalent control has none", () => {
      const experiment =
        runM2Experiment();

      expect(
        experiment
          .memoryEnabled
          .memoryEnabled,
      ).toBe(true);

      expect(
        experiment
          .memoryDisabled
          .memoryEnabled,
      ).toBe(false);

      expect(
        experiment
          .memoryEnabled
          .recallPresent,
      ).toBe(true);

      expect(
        experiment
          .memoryEnabled
          .memoryConfidence,
      ).not.toBeNull();

      expect(
        experiment
          .memoryDisabled
          .recallPresent,
      ).toBe(false);

      expect(
        experiment
          .memoryDisabled
          .memoryConfidence,
      ).toBeNull();
    });

    it("produces greater SEEK activation in the memory-enabled Creature after direct perception disappears", () => {
      const experiment =
        runM2Experiment();

      expect(
        experiment
          .memoryEnabled
          .seekActivation,
      ).toBeGreaterThan(
        experiment
          .memoryDisabled
          .seekActivation,
      );
    });

    it("produces a different action-selection outcome attributable to usable memory", () => {
      const experiment =
        runM2Experiment();

      /*
       * The winner is reconstructed from the
       * actual action-node activations through
       * the generic competition function.
       */
      expect(
        experiment
          .memoryEnabled
          .selectedActionId,
      ).toBe("seek");

      expect(
        experiment
          .memoryDisabled
          .selectedActionId,
      ).toBe("idle");
    });

    it("produces greater movement in the legitimately remembered direction than the equivalent control", () => {
      const experiment =
        runM2Experiment();

      expect(
        experiment
          .memoryEnabled
          .rememberedDirectionMovement,
      ).toBeGreaterThan(
        experiment
          .memoryDisabled
          .rememberedDirectionMovement,
      );

      expect(
        experiment
          .memoryEnabled
          .rememberedDirectionMovement,
      ).toBeGreaterThan(0);
    });

    it("shows the complete predefined behavioural difference in one experiment result", () => {
      const experiment =
        runM2Experiment();

      const memoryEnabled =
        experiment.memoryEnabled;

      const control =
        experiment.memoryDisabled;

      /*
       * Primary M2.5 evidence:
       *
       * no current perception
       * +
       * legitimate memory
       * ->
       * stronger SEEK
       * +
       * greater remembered-direction movement
       */
      expect(
        memoryEnabled
          .directFoodPerceptionPresent,
      ).toBe(false);

      expect(
        control
          .directFoodPerceptionPresent,
      ).toBe(false);

      expect(
        memoryEnabled
          .recallPresent,
      ).toBe(true);

      expect(
        control
          .recallPresent,
      ).toBe(false);

      expect(
        memoryEnabled
          .seekActivation,
      ).toBeGreaterThan(
        control
          .seekActivation,
      );

      expect(
        memoryEnabled
          .rememberedDirectionMovement,
      ).toBeGreaterThan(
        control
          .rememberedDirectionMovement,
      );
    });
  },
);