import {
  describe,
  expect,
  it,
} from "vitest";

import {
  runM1Trial,
} from "../../src/simulation/core/m1Trial.js";

import {
  M1_NODE_IDS,
} from "../../src/simulation/brain/m1Brain.js";

import type {
  M1DecisionTelemetryEntry,
  M1LearningTelemetryEntry,
  M1TelemetryEntry,
} from "../../src/simulation/core/m1Telemetry.js";

function getDecisionEntries(
  telemetry:
    readonly M1TelemetryEntry[],
): readonly M1DecisionTelemetryEntry[] {
  return telemetry.filter(
    (
      entry,
    ): entry is M1DecisionTelemetryEntry =>
      entry.type ===
      "m1-decision",
  );
}

function getLearningEntry(
  telemetry:
    readonly M1TelemetryEntry[],
): M1LearningTelemetryEntry {
  const entry =
    telemetry.find(
      (
        candidate,
      ): candidate is M1LearningTelemetryEntry =>
        candidate.type ===
        "m1-learning",
    );

  if (entry === undefined) {
    throw new Error(
      "Expected M1 learning telemetry.",
    );
  }

  return entry;
}

describe("M1 telemetry", () => {
  it("records what the creature perceived and its biological hunger", () => {
    const result =
      runM1Trial({
        learningEnabled: true,
      });

    const decisions =
      getDecisionEntries(
        result.telemetry,
      );

    expect(
      decisions,
    ).toHaveLength(2);

    const first =
      decisions[0];

    expect(
      first,
    ).toBeDefined();

    expect(
      first?.tick,
    ).toBe(1);

    expect(
      first?.energy,
    ).toBeCloseTo(0.1);

    expect(
      first?.hungerLevel,
    ).toBeCloseTo(0.9);

    expect(
      first?.foodSignal
        ?.foodId,
    ).toBe("food-1");

    expect(
      first?.foodSignal
        ?.distance,
    ).toBeCloseTo(1);

    expect(
      first?.foodSignal
        ?.strength,
    ).toBeCloseTo(0.9);

    expect(
      first?.contactInRange,
    ).toBe(false);
  });

  it("records brain activation and candidate action competition", () => {
    const result =
      runM1Trial({
        learningEnabled: true,
      });

    const first =
      getDecisionEntries(
        result.telemetry,
      )[0];

    expect(
      first,
    ).toBeDefined();

    expect(
      first?.brainActivations[
        M1_NODE_IDS.hungerInput
      ],
    ).toBeCloseTo(0.9);

    expect(
      first?.brainActivations[
        M1_NODE_IDS.foodInput
      ],
    ).toBeCloseTo(0.9);

    const idle =
      first?.actionCandidates.find(
        (candidate) =>
          candidate.actionId ===
          "idle",
      );

    const seek =
      first?.actionCandidates.find(
        (candidate) =>
          candidate.actionId ===
          "seek",
      );

    const eat =
      first?.actionCandidates.find(
        (candidate) =>
          candidate.actionId ===
          "eat",
      );

    expect(
      idle,
    ).toBeDefined();

    expect(
      seek,
    ).toBeDefined();

    expect(
      eat,
    ).toBeDefined();

    expect(
      seek?.activation ?? 0,
    ).toBeGreaterThan(
      idle?.activation ?? 0,
    );

    expect(
      first?.selectedActionId,
    ).toBe("seek");
  });

  it("records the second decision after movement and food contact", () => {
    const result =
      runM1Trial({
        learningEnabled: true,
      });

    const second =
      getDecisionEntries(
        result.telemetry,
      )[1];

    expect(
      second,
    ).toBeDefined();

    expect(
      second?.tick,
    ).toBe(2);

    expect(
      second?.energy,
    ).toBeCloseTo(0.08);

    expect(
      second?.hungerLevel,
    ).toBeCloseTo(0.92);

    expect(
      second?.foodSignal
        ?.distance,
    ).toBeCloseTo(0);

    expect(
      second?.contactInRange,
    ).toBe(true);

    expect(
      second?.selectedActionId,
    ).toBe("eat");

    const eat =
      second?.actionCandidates.find(
        (candidate) =>
          candidate.actionId ===
          "eat",
      );

    const seek =
      second?.actionCandidates.find(
        (candidate) =>
          candidate.actionId ===
          "seek",
      );

    expect(
      eat?.activation ?? 0,
    ).toBeGreaterThan(
      seek?.activation ?? 0,
    );
  });

  it("records eating consequence and reward", () => {
    const result =
      runM1Trial({
        learningEnabled: true,
      });

    const learning =
      getLearningEntry(
        result.telemetry,
      );

    expect(
      learning.tick,
    ).toBe(2);

    expect(
      learning.ate,
    ).toBe(true);

    expect(
      learning.foodConsumed,
    ).toBe(true);

    expect(
      learning.energyBeforeConsequence,
    ).toBeCloseTo(0.08);

    expect(
      learning.energyAfterConsequence,
    ).toBeCloseTo(0.58);

    expect(
      learning.reward,
    ).toBeCloseTo(0.5);
  });

  it("records neural connection weights before and after learning", () => {
    const result =
      runM1Trial({
        learningEnabled: true,
      });

    const learning =
      getLearningEntry(
        result.telemetry,
      );

    expect(
      learning.learningEnabled,
    ).toBe(true);

    expect(
      learning.weightChanges.length,
    ).toBeGreaterThan(0);

    const seekChange =
      learning.weightChanges.find(
        (change) =>
          change.connectionId ===
            "food-to-seek" ||
          change.connectionId ===
            "hunger-to-seek",
      );

    expect(
      seekChange,
    ).toBeDefined();

    expect(
      seekChange?.after ?? 0,
    ).toBeGreaterThan(
      seekChange?.before ?? 0,
    );

    expect(
      seekChange?.delta ?? 0,
    ).toBeGreaterThan(0);
  });

  it("shows reward but no weight update in the learning-disabled control", () => {
    const result =
      runM1Trial({
        learningEnabled: false,
      });

    const learning =
      getLearningEntry(
        result.telemetry,
      );

    expect(
      learning.learningEnabled,
    ).toBe(false);

    expect(
      learning.ate,
    ).toBe(true);

    expect(
      learning.reward,
    ).toBeGreaterThan(0);

    expect(
      learning.weightChanges,
    ).toHaveLength(0);
  });
});