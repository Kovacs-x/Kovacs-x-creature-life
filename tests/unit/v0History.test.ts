import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createM1EpisodeState,
} from "../../src/simulation/core/m1Episode.js";

import {
  advanceV0Habitat,
} from "../../src/simulation/core/v0Habitat.js";

import {
  appendV0CausalHistory,
  createV0CausalHistory,
  deriveV0CausalHistoryEntry,
  exportV0CausalHistoryJson,
  V0_HISTORY_SCHEMA_VERSION,
} from "../../src/ui/v0History.js";

function createInitialState(
  learningEnabled =
    false,
) {
  return createM1EpisodeState(
    {
      learningEnabled,

      memoryEnabled:
        true,

      foodX:
        3,

      foodOccluded:
        false,
    },
  );
}

describe(
  "V0.5 bounded causal history",
  () => {
    it("records direct perception, memory encoding and direct-guided SEEK on the first habitat tick", () => {
      const before =
        createInitialState();

      const after =
        advanceV0Habitat(
          before,
        );

      const entry =
        deriveV0CausalHistoryEntry(
          before,
          after,
        );

      expect(
        entry.tick,
      ).toBe(1);

      expect(
        entry.telemetry
          .directFoodSignal,
      ).not.toBeNull();

      expect(
        entry.telemetry
          .recallSignal,
      ).toBeNull();

      expect(
        entry.telemetry
          .foodEvidenceSource,
      ).toBe(
        "direct-perception",
      );

      expect(
        entry.telemetry
          .memory
          .encoded,
      ).toBe(true);

      expect(
        entry.telemetry
          .directFoodInputActivation,
      ).toBeGreaterThan(0);

      expect(
        entry.telemetry
          .rememberedFoodInputActivation,
      ).toBe(0);

      expect(
        entry.telemetry
          .selectedActionId,
      ).toBe(
        "seek",
      );

      expect(
        entry.telemetry
          .movementDirectionSource,
      ).toBe(
        "direct-perception",
      );

      expect(
        entry.ateThisTick,
      ).toBe(false);

      expect(
        entry.biologicalReward,
      ).toBe(0);

      expect(
        entry.learningChanged,
      ).toBe(false);

      expect(
        entry.why,
      ).toContain(
        "Direct food perception was available.",
      );

      expect(
        entry.why,
      ).toContain(
        "Food memory was encoded from direct perception.",
      );

      expect(
        entry.why,
      ).toContain(
        "SEEK won action competition.",
      );

      expect(
        entry.why,
      ).toContain(
        "Movement used the current perceived food direction after SEEK won.",
      );
    });

    it("records memory recall and remembered-direction movement while direct perception is occluded", () => {
      const initial =
        createInitialState();

      const afterDirect =
        advanceV0Habitat(
          initial,
        );

      const afterRecall =
        advanceV0Habitat(
          afterDirect,
        );

      const entry =
        deriveV0CausalHistoryEntry(
          afterDirect,
          afterRecall,
        );

      expect(
        entry.telemetry
          .foodOccluded,
      ).toBe(true);

      expect(
        entry.telemetry
          .directFoodSignal,
      ).toBeNull();

      expect(
        entry.telemetry
          .recallSignal,
      ).not.toBeNull();

      expect(
        entry.telemetry
          .foodEvidenceSource,
      ).toBe(
        "memory-recall",
      );

      expect(
        entry.telemetry
          .directFoodInputActivation,
      ).toBe(0);

      expect(
        entry.telemetry
          .rememberedFoodInputActivation,
      ).toBeGreaterThan(0);

      expect(
        entry.telemetry
          .memory
          .decayed,
      ).toBe(true);

      expect(
        entry.telemetry
          .selectedActionId,
      ).toBe(
        "seek",
      );

      expect(
        entry.telemetry
          .movementDirectionSource,
      ).toBe(
        "memory-recall",
      );

      expect(
        entry.why,
      ).toContain(
        "Environmental occlusion blocked direct food perception.",
      );

      expect(
        entry.why.some(
          (statement) =>
            statement.startsWith(
              "A usable food memory was recalled with confidence ",
            ),
        ),
      ).toBe(true);

      expect(
        entry.why,
      ).toContain(
        "Movement used remembered food direction after SEEK won.",
      );
    });

    it("keeps recent history bounded in deterministic chronological order", () => {
      let state =
        createInitialState();

      let history =
        createV0CausalHistory(
          2,
        );

      const beforeFirst =
        state;

      state =
        advanceV0Habitat(
          state,
        );

      history =
        appendV0CausalHistory(
          history,
          beforeFirst,
          state,
        );

      const beforeSecond =
        state;

      state =
        advanceV0Habitat(
          state,
        );

      history =
        appendV0CausalHistory(
          history,
          beforeSecond,
          state,
        );

      const beforeThird =
        state;

      state =
        advanceV0Habitat(
          state,
        );

      history =
        appendV0CausalHistory(
          history,
          beforeThird,
          state,
        );

      expect(
        history.schemaVersion,
      ).toBe(
        V0_HISTORY_SCHEMA_VERSION,
      );

      expect(
        history.entries,
      ).toHaveLength(2);

      expect(
        history.entries.map(
          (entry) =>
            entry.tick,
        ),
      ).toEqual(
        [
          2,
          3,
        ],
      );
    });

    it("records eating, biological reward and learning changes from accepted state consequences", () => {
      let state =
        createInitialState(
          true,
        );

      let history =
        createV0CausalHistory(
          8,
        );

      for (
        let index = 0;
        index < 10 &&
        !state.complete;
        index += 1
      ) {
        const before =
          state;

        state =
          advanceV0Habitat(
            state,
          );

        history =
          appendV0CausalHistory(
            history,
            before,
            state,
          );
      }

      expect(
        state.complete,
      ).toBe(true);

      const eatingEntry =
        history.entries.find(
          (entry) =>
            entry.ateThisTick,
        );

      expect(
        eatingEntry,
      ).toBeDefined();

      expect(
        eatingEntry
          ?.food
          .consumedThisTick,
      ).toBe(true);

      expect(
        eatingEntry
          ?.food
          .availableAfter,
      ).toBe(false);

      expect(
        eatingEntry
          ?.telemetry
          .selectedActionId,
      ).toBe(
        "eat",
      );

      expect(
        eatingEntry
          ?.biologicalReward ??
          0,
      ).toBeGreaterThan(0);

      expect(
        eatingEntry
          ?.learningChanged,
      ).toBe(true);

      expect(
        eatingEntry
          ?.learningChanges
          .length ??
          0,
      ).toBeGreaterThan(0);

      expect(
        eatingEntry
          ?.why,
      ).toContain(
        "Eating succeeded on this tick.",
      );

      expect(
        eatingEntry
          ?.why.some(
            (statement) =>
              statement.startsWith(
                "Biological reward was ",
              ),
          ),
      ).toBe(true);

      expect(
        eatingEntry
          ?.why.some(
            (statement) =>
              statement.startsWith(
                "Reward-driven learning changed ",
              ),
          ),
      ).toBe(true);
    });

    it("exports bounded history deterministically as machine-readable JSON", () => {
      const initial =
        createInitialState();

      const afterFirst =
        advanceV0Habitat(
          initial,
        );

      const history =
        appendV0CausalHistory(
          createV0CausalHistory(
            4,
          ),
          initial,
          afterFirst,
        );

      const firstExport =
        exportV0CausalHistoryJson(
          history,
        );

      const secondExport =
        exportV0CausalHistoryJson(
          history,
        );

      expect(
        firstExport,
      ).toBe(
        secondExport,
      );

      const parsed =
        JSON.parse(
          firstExport,
        ) as {
          readonly schemaVersion:
            number;

          readonly capacity:
            number;

          readonly entries:
            readonly {
              readonly tick:
                number;

              readonly telemetry: {
                readonly selectedActionId:
                  string;
              };
            }[];
        };

      expect(
        parsed.schemaVersion,
      ).toBe(
        V0_HISTORY_SCHEMA_VERSION,
      );

      expect(
        parsed.capacity,
      ).toBe(4);

      expect(
        parsed.entries,
      ).toHaveLength(1);

      expect(
        parsed.entries[0]
          ?.tick,
      ).toBe(1);

      expect(
        parsed.entries[0]
          ?.telemetry
          .selectedActionId,
      ).toBe(
        "seek",
      );
    });

    it("observes authoritative states without mutating them", () => {
      const before =
        createInitialState();

      const after =
        advanceV0Habitat(
          before,
        );

      const beforeSnapshot =
        JSON.stringify(
          before,
        );

      const afterSnapshot =
        JSON.stringify(
          after,
        );

      const history =
        appendV0CausalHistory(
          createV0CausalHistory(),
          before,
          after,
        );

      exportV0CausalHistoryJson(
        history,
      );

      expect(
        JSON.stringify(
          before,
        ),
      ).toBe(
        beforeSnapshot,
      );

      expect(
        JSON.stringify(
          after,
        ),
      ).toBe(
        afterSnapshot,
      );
    });

    it("rejects an invalid history capacity", () => {
      expect(() =>
        createV0CausalHistory(
          0,
        ),
      ).toThrow(
        "V0 history capacity must be a positive integer.",
      );

      expect(() =>
        createV0CausalHistory(
          1.5,
        ),
      ).toThrow(
        "V0 history capacity must be a positive integer.",
      );
    });
  },
);