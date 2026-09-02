import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createM3AcquisitionState,
  advanceM3AcquisitionTick,
  type M3AcquisitionState,
} from "../../src/simulation/core/m3Acquisition.js";

import {
  applyM3PlayerFoodPlacement,
  type M3PlayerFoodWorldEvent,
} from "../../src/simulation/core/m3PlayerWorld.js";

import {
  createM3LifeHistory,
  observeM3TickForLifeHistory,
} from "../../src/simulation/core/m3LifeHistory.js";

import {
  createM3PersistentRunState,
  serializeM3PersistentRun,
  type M3PersistentRunState,
} from "../../src/simulation/core/m3Persistence.js";

import {
  M3_PRIMARY_BRANCH_A_SEED,
} from "../../src/simulation/core/m3Contract.js";

import {
  loadM3PersistentRunFromStorage,
  M3_BROWSER_RUN_STORAGE_KEY,
  saveM3PersistentRunToStorage,
  type M3RunStorageLike,
} from "../../src/persistence/browserRunStorage.js";

/*
 * Minimal in-memory fake satisfying the narrow
 * M3RunStorageLike contract, so these tests never
 * require a real browser.
 */
class FakeStorage implements M3RunStorageLike {
  private readonly values = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.values.has(key) ? (this.values.get(key) as string) : null;
  }

  public setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  public removeItem(key: string): void {
    this.values.delete(key);
  }

  public rawEntryCount(): number {
    return this.values.size;
  }
}

function createBrowserLikeState(): M3AcquisitionState {
  return createM3AcquisitionState({
    seed: M3_PRIMARY_BRANCH_A_SEED,
    learningEnabled: true,
    explorationEnabled: true,
    memoryEnabled: true,
  });
}

function createNonTrivialRun(): M3PersistentRunState {
  let state = createBrowserLikeState();
  let history = createM3LifeHistory();

  for (let index = 0; index < 5; index += 1) {
    const result = advanceM3AcquisitionTick(state);
    state = result.state;
    history = observeM3TickForLifeHistory(history, result.evidence);
  }

  const placement = applyM3PlayerFoodPlacement(state, { x: 3, y: 4 }, 0);

  return createM3PersistentRunState({
    acquisitionState: placement.state,
    lifeHistory: history,
    playerWorldEvents: [placement.event],
    nextPlayerEventSequence: 1,
  });
}

describe("browser run storage transport", () => {
  it("distinguishes missing storage from a valid save", () => {
    const storage = new FakeStorage();

    expect(loadM3PersistentRunFromStorage(storage)).toEqual({
      status: "missing",
    });

    saveM3PersistentRunToStorage(storage, createNonTrivialRun());

    const result = loadM3PersistentRunFromStorage(storage);

    expect(result.status).toBe("valid");
  });

  it("round-trips a valid M3PersistentRunState exactly", () => {
    const storage = new FakeStorage();
    const run = createNonTrivialRun();

    saveM3PersistentRunToStorage(storage, run);

    const result = loadM3PersistentRunFromStorage(storage);

    if (result.status !== "valid") {
      throw new Error("Expected a valid load result.");
    }

    expect(result.run).toEqual(run);
  });

  it("saves text exactly equal to the existing M3 persistence serialization", () => {
    const storage = new FakeStorage();
    const run = createNonTrivialRun();

    saveM3PersistentRunToStorage(storage, run);

    expect(storage.getItem(M3_BROWSER_RUN_STORAGE_KEY)).toBe(
      serializeM3PersistentRun(run),
    );
  });

  it("rejects malformed JSON as invalid rather than throwing or partially loading", () => {
    const storage = new FakeStorage();

    storage.setItem(M3_BROWSER_RUN_STORAGE_KEY, "{not valid json");

    const result = loadM3PersistentRunFromStorage(storage);

    expect(result.status).toBe("invalid");

    if (result.status === "invalid") {
      expect(result.reason.length).toBeGreaterThan(0);
    }
  });

  it("rejects an unsupported persisted schema version as invalid", () => {
    const storage = new FakeStorage();
    const run = createNonTrivialRun();

    const parsed = JSON.parse(serializeM3PersistentRun(run)) as Record<
      string,
      unknown
    >;

    parsed.schemaVersion = 999;

    storage.setItem(M3_BROWSER_RUN_STORAGE_KEY, JSON.stringify(parsed));

    const result = loadM3PersistentRunFromStorage(storage);

    expect(result.status).toBe("invalid");
  });

  it("does not mutate the authoritative run object while saving", () => {
    const storage = new FakeStorage();
    const run = createNonTrivialRun();
    const before = serializeM3PersistentRun(run);

    saveM3PersistentRunToStorage(storage, run);

    expect(serializeM3PersistentRun(run)).toBe(before);
  });

  it("never persists camera or presentation-only state", () => {
    const storage = new FakeStorage();

    saveM3PersistentRunToStorage(storage, createNonTrivialRun());

    const saved = storage.getItem(M3_BROWSER_RUN_STORAGE_KEY) ?? "";

    expect(saved).not.toMatch(/camera/i);
    expect(saved).not.toMatch(/orbit/i);
    expect(saved).not.toMatch(/animationPhase/i);
    expect(saved).not.toMatch(/interpolation/i);
    expect(saved).not.toMatch(/blink/i);
    expect(saved).not.toMatch(/wallClock/i);
    expect(saved).not.toMatch(/timestamp/i);
  });

  it("does not consume authoritative simulation RNG while saving or loading", () => {
    const storage = new FakeStorage();
    const run = createNonTrivialRun();
    const rngBefore = run.acquisitionState.rngState;

    saveM3PersistentRunToStorage(storage, run);

    const result = loadM3PersistentRunFromStorage(storage);

    if (result.status !== "valid") {
      throw new Error("Expected a valid load result.");
    }

    expect(result.run.acquisitionState.rngState).toEqual(rngBefore);
    expect(run.acquisitionState.rngState).toEqual(rngBefore);
  });

  it("preserves the player event sequence across save/load instead of restarting it at zero", () => {
    const storage = new FakeStorage();
    const run = createNonTrivialRun();

    expect(run.nextPlayerEventSequence).toBe(1);

    saveM3PersistentRunToStorage(storage, run);

    const result = loadM3PersistentRunFromStorage(storage);

    if (result.status !== "valid") {
      throw new Error("Expected a valid load result.");
    }

    expect(result.run.nextPlayerEventSequence).toBe(1);
    expect(result.run.playerWorldEvents).toEqual(run.playerWorldEvents);

    const events: readonly M3PlayerFoodWorldEvent[] =
      result.run.playerWorldEvents;

    expect(events[0]?.sequence).toBe(0);
  });

  it("round-trips a fresh reset persistent run with empty history and sequence zero", () => {
    const storage = new FakeStorage();

    const freshRun = createM3PersistentRunState({
      acquisitionState: createBrowserLikeState(),
      lifeHistory: createM3LifeHistory(),
      playerWorldEvents: [],
      nextPlayerEventSequence: 0,
    });

    saveM3PersistentRunToStorage(storage, freshRun);

    const result = loadM3PersistentRunFromStorage(storage);

    if (result.status !== "valid") {
      throw new Error("Expected a valid load result.");
    }

    expect(result.run.lifeHistory.entries).toEqual([]);
    expect(result.run.playerWorldEvents).toEqual([]);
    expect(result.run.nextPlayerEventSequence).toBe(0);
  });
});
