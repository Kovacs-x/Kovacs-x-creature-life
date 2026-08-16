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
  deriveV0CausalHistoryEntry,
} from "../../src/ui/v0History.js";

import {
  deriveV0InspectorFacts,
} from "../../src/ui/v0Inspector.js";

describe(
  "V0.5 Why / History inspector facts",
  () => {
    it("reports direct-perception causal facts for the first V0 tick", () => {
      const before =
        createM1EpisodeState(
          {
            learningEnabled:
              false,

            memoryEnabled:
              true,

            foodX:
              3,

            foodOccluded:
              false,
          },
        );

      const after =
        advanceV0Habitat(
          before,
        );

      const entry =
        deriveV0CausalHistoryEntry(
          before,
          after,
        );

      const facts =
        deriveV0InspectorFacts(
          entry,
        );

      expect(
        facts.tick,
      ).toBe(
        "1",
      );

      expect(
        facts.foodOcclusion,
      ).toBe(
        "Not occluded",
      );

      expect(
        facts.directPerception,
      ).toContain(
        "Present",
      );

      expect(
        facts.recallSignal,
      ).toBe(
        "None",
      );

      expect(
        facts.activeMemory,
      ).toBe(
        "Active",
      );

      expect(
        facts.memoryTransitions,
      ).toContain(
        "Encoded",
      );

      expect(
        facts.selectedAction,
      ).toBe(
        "SEEK",
      );

      expect(
        facts.movementSource,
      ).toBe(
        "Direct perception",
      );

      expect(
        Number(
          facts.directFoodActivation,
        ),
      ).toBeGreaterThan(0);

      expect(
        Number(
          facts.rememberedFoodActivation,
        ),
      ).toBe(0);
    });

    it("reports memory-recall causal facts while food is occluded", () => {
      const initial =
        createM1EpisodeState(
          {
            learningEnabled:
              false,

            memoryEnabled:
              true,

            foodX:
              3,

            foodOccluded:
              false,
          },
        );

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

      const facts =
        deriveV0InspectorFacts(
          entry,
        );

      expect(
        facts.tick,
      ).toBe(
        "2",
      );

      expect(
        facts.foodOcclusion,
      ).toBe(
        "Occluded",
      );

      expect(
        facts.directPerception,
      ).toBe(
        "None",
      );

      expect(
        facts.recallSignal,
      ).toContain(
        "Present",
      );

      expect(
        facts.memoryTransitions,
      ).toContain(
        "Decayed",
      );

      expect(
        facts.selectedAction,
      ).toBe(
        "SEEK",
      );

      expect(
        facts.movementSource,
      ).toBe(
        "Memory recall",
      );

      expect(
        Number(
          facts.directFoodActivation,
        ),
      ).toBe(0);

      expect(
        Number(
          facts.rememberedFoodActivation,
        ),
      ).toBeGreaterThan(0);
    });

    it("reports accepted eating and learning consequences without inferring them", () => {
      let state =
        createM1EpisodeState(
          {
            learningEnabled:
              true,

            memoryEnabled:
              true,

            foodX:
              3,

            foodOccluded:
              false,
          },
        );

      let eatingFacts:
        ReturnType<
          typeof deriveV0InspectorFacts
        > |
        null =
          null;

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

        const entry =
          deriveV0CausalHistoryEntry(
            before,
            state,
          );

        if (
          entry.ateThisTick
        ) {
          eatingFacts =
            deriveV0InspectorFacts(
              entry,
            );
        }
      }

      expect(
        eatingFacts,
      ).not.toBeNull();

      expect(
        eatingFacts
          ?.selectedAction,
      ).toBe(
        "EAT",
      );

      expect(
        eatingFacts
          ?.eatingResult,
      ).toBe(
        "Eating succeeded",
      );

      expect(
        Number(
          eatingFacts
            ?.biologicalReward ??
            "0",
        ),
      ).toBeGreaterThan(0);

      expect(
        eatingFacts
          ?.learningChanges,
      ).not.toBe(
        "None",
      );
    });
  },
);