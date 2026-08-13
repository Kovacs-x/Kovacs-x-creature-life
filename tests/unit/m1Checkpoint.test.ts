import {
  describe,
  expect,
  it,
} from "vitest";

import {
  advanceM1Episode,
  createM1EpisodeState,
  deserializeM1EpisodeState,
  serializeM1EpisodeState,
} from "../../src/simulation/core/m1Episode.js";

function getConnectionWeight(
  state: ReturnType<
    typeof createM1EpisodeState
  >,
  connectionId: string,
): number {
  const connection =
    state.brain.connections.find(
      (candidate) =>
        candidate.id ===
        connectionId,
    );

  if (
    connection === undefined
  ) {
    throw new Error(
      `Missing connection: ${connectionId}`,
    );
  }

  return connection.weight;
}

describe(
  "M1 mid-approach save and resume",
  () => {
    it("creates a genuine in-progress checkpoint before the creature reaches the food", () => {
      const initial =
        createM1EpisodeState({
          learningEnabled: true,

          /*
           * Food is 1.2 units away.
           *
           * SEEK moves one unit, leaving the
           * creature short of the food after
           * the first tick.
           */
          foodX: 1.2,
        });

      const checkpoint =
        advanceM1Episode(
          initial,
        );

      expect(
        checkpoint.tickIndex,
      ).toBe(1);

      expect(
        checkpoint.complete,
      ).toBe(false);

      expect(
        checkpoint.ate,
      ).toBe(false);

      expect(
        checkpoint.food.consumed,
      ).toBe(false);

      expect(
        checkpoint.position.x,
      ).toBeCloseTo(1);

      expect(
        checkpoint.position.x,
      ).toBeLessThan(
        checkpoint.food.position.x,
      );

      /*
       * Normal metabolic time advancement
       * also occurred before the save.
       */

      expect(
        checkpoint.hunger.energy,
      ).toBeCloseTo(0.08);
    });

    it("serializes the transient neural eligibility needed for delayed learning", () => {
      const initial =
        createM1EpisodeState({
          learningEnabled: true,
          foodX: 1.2,
        });

      const checkpoint =
        advanceM1Episode(
          initial,
        );

      const seekEligibility =
        checkpoint
          .eligibilityTrace
          .find(
            (entry) =>
              entry.connectionId ===
              "food-to-seek",
          );

      expect(
        seekEligibility,
      ).toBeDefined();

      expect(
        seekEligibility
          ?.eligibility ??
          0,
      ).toBeGreaterThan(0);

      const serialized =
        serializeM1EpisodeState(
          checkpoint,
        );

      const restored =
        deserializeM1EpisodeState(
          serialized,
        );

      expect(
        restored,
      ).toEqual(
        checkpoint,
      );

      expect(
        restored
          .eligibilityTrace,
      ).toEqual(
        checkpoint
          .eligibilityTrace,
      );
    });

    it("continues from a reloaded checkpoint with exactly the same outcome as uninterrupted simulation", () => {
      /*
       * UNINTERRUPTED PATH
       */

      const uninterruptedInitial =
        createM1EpisodeState({
          learningEnabled: true,
          foodX: 1.2,
        });

      const uninterruptedCheckpoint =
        advanceM1Episode(
          uninterruptedInitial,
        );

      const uninterruptedFinal =
        advanceM1Episode(
          uninterruptedCheckpoint,
        );

      expect(
        uninterruptedFinal
          .complete,
      ).toBe(true);

      expect(
        uninterruptedFinal
          .ate,
      ).toBe(true);

      /*
       * SAVE / RELOAD PATH
       */

      const resumableInitial =
        createM1EpisodeState({
          learningEnabled: true,
          foodX: 1.2,
        });

      const beforeSave =
        advanceM1Episode(
          resumableInitial,
        );

      const saved =
        serializeM1EpisodeState(
          beforeSave,
        );

      const reloaded =
        deserializeM1EpisodeState(
          saved,
        );

      const resumedFinal =
        advanceM1Episode(
          reloaded,
        );

      /*
       * Full-state equality means save/load
       * did not alter:
       *
       * - position
       * - biology
       * - food state
       * - brain activations
       * - learned weights
       * - eligibility trace
       * - reward
       * - tick count
       */

      expect(
        resumedFinal,
      ).toEqual(
        uninterruptedFinal,
      );
    });

    it("preserves cross-tick credit so the pre-save seek pathway is reinforced after eating", () => {
      const initial =
        createM1EpisodeState({
          learningEnabled: true,
          foodX: 1.2,
        });

      const initialSeekWeight =
        getConnectionWeight(
          initial,
          "food-to-seek",
        );

      const checkpoint =
        advanceM1Episode(
          initial,
        );

      const restored =
        deserializeM1EpisodeState(
          serializeM1EpisodeState(
            checkpoint,
          ),
        );

      const final =
        advanceM1Episode(
          restored,
        );

      const learnedSeekWeight =
        getConnectionWeight(
          final,
          "food-to-seek",
        );

      expect(
        final.ate,
      ).toBe(true);

      expect(
        final.cumulativeReward,
      ).toBeCloseTo(0.5);

      /*
       * The SEEK action happened before the
       * save.
       *
       * The food reward happened after the
       * reload.
       *
       * Therefore this weight increasing is
       * direct evidence that neural credit
       * crossed the persistence boundary.
       */

      expect(
        learnedSeekWeight,
      ).toBeGreaterThan(
        initialSeekWeight,
      );

      const seekWeightChange =
        final.weightChanges.find(
          (change) =>
            change.connectionId ===
            "food-to-seek",
        );

      expect(
        seekWeightChange,
      ).toBeDefined();

      expect(
        seekWeightChange
          ?.delta ??
          0,
      ).toBeGreaterThan(0);
    });

    it("rejects corrupted or unsupported checkpoint data", () => {
      const state =
        createM1EpisodeState({
          learningEnabled: true,
          foodX: 1.2,
        });

      const checkpoint =
        advanceM1Episode(
          state,
        );

      const unsupported =
        JSON.stringify({
          ...checkpoint,
          schemaVersion: 999,
        });

      expect(() =>
        deserializeM1EpisodeState(
          unsupported,
        ),
      ).toThrow(
        "Unsupported M1 episode schema version.",
      );

      expect(() =>
        deserializeM1EpisodeState(
          "{not-json",
        ),
      ).toThrow(
        "M1 episode state is not valid JSON.",
      );
    });
  },
);