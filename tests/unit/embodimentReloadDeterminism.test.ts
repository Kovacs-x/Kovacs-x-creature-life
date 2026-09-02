import { describe, expect, it } from "vitest";

import {
  createM3AcquisitionState,
  type M3AcquisitionState,
  type M3AcquisitionTickEvidence,
} from "../../src/simulation/core/m3Acquisition.js";

import type { M3PlayerFoodWorldEvent } from "../../src/simulation/core/m3PlayerWorld.js";

import {
  createM3LifeHistory,
  observeM3PlayerWorldEventForLifeHistory,
  observeM3TickForLifeHistory,
  type M3LifeHistory,
} from "../../src/simulation/core/m3LifeHistory.js";

import {
  createM3PersistentRunState,
} from "../../src/simulation/core/m3Persistence.js";

import { M3_PRIMARY_BRANCH_A_SEED } from "../../src/simulation/core/m3Contract.js";

import {
  M3ApplicationController,
  restoreM3ApplicationController,
  type M3ControllerCallbacks,
  type M3ControllerMode,
  type M3TickScheduler,
} from "../../src/ui/m3Controller.js";

import {
  loadM3PersistentRunFromStorage,
  saveM3PersistentRunToStorage,
  type M3RunStorageLike,
} from "../../src/persistence/browserRunStorage.js";

/*
 * E5 RELOAD DETERMINISM CONTROL
 *
 * A. uninterrupted run
 *
 * versus
 *
 * B. an identical run split by:
 *    authoritative execution
 *    -> persistent save
 *    -> browser storage transport
 *    -> deserialize
 *    -> restored controller/state
 *    -> the same future authoritative operations
 *
 * Both branches use the real accepted M3
 * authoritative controller and tick transition
 * (memoryEnabled/learningEnabled/
 * explorationEnabled all true, matching the
 * ordinary browser Creature configuration). No
 * Creature cognition is mocked.
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
}

class NoopScheduler implements M3TickScheduler {
  public startCount = 0;
  public stopCount = 0;

  public start(): number {
    this.startCount += 1;
    return 1;
  }

  public stop(): void {
    this.stopCount += 1;
  }
}

interface RunTrackers {
  readonly lifeHistoryRef: { value: M3LifeHistory };
  readonly playerWorldEventsRef: { value: M3PlayerFoodWorldEvent[] };
  readonly evidenceLog: M3AcquisitionTickEvidence[];
  readonly transitionCount: { value: number };
}

function createTrackers(
  initialLifeHistory: M3LifeHistory,
  initialPlayerWorldEvents: readonly M3PlayerFoodWorldEvent[],
): RunTrackers {
  return {
    lifeHistoryRef: { value: initialLifeHistory },
    playerWorldEventsRef: { value: [...initialPlayerWorldEvents] },
    evidenceLog: [],
    transitionCount: { value: 0 },
  };
}

function createTrackingCallbacks(
  trackers: RunTrackers,
): M3ControllerCallbacks {
  return {
    onStateTransition: (_previous, _current, evidence) => {
      trackers.lifeHistoryRef.value = observeM3TickForLifeHistory(
        trackers.lifeHistoryRef.value,
        evidence,
      );
      trackers.evidenceLog.push(evidence);
      trackers.transitionCount.value += 1;
    },

    onPlayerFoodPlacement: (_previous, _current, event) => {
      trackers.lifeHistoryRef.value = observeM3PlayerWorldEventForLifeHistory(
        trackers.lifeHistoryRef.value,
        event,
      );
      trackers.playerWorldEventsRef.value = [
        ...trackers.playerWorldEventsRef.value,
        event,
      ];
    },

    onStateReset: () => undefined,

    onModeChange: (_mode: M3ControllerMode) => undefined,
  };
}

function createBrowserCreatureState(): M3AcquisitionState {
  return createM3AcquisitionState({
    seed: M3_PRIMARY_BRANCH_A_SEED,
    learningEnabled: true,
    explorationEnabled: true,
    memoryEnabled: true,
  });
}

const TICKS_BEFORE_BOUNDARY = 8;
const TICKS_AFTER_BOUNDARY = 12;

describe("E5 browser reload determinism control", () => {
  it("matches an uninterrupted run across acquisition state, RNG, brain, eligibility, exploration, food memory, food, life history, player events and next sequence", () => {
    /*
     * BRANCH A: uninterrupted continuous
     * execution.
     */
    const trackersA = createTrackers(createM3LifeHistory(), []);

    const controllerA = new M3ApplicationController(
      createBrowserCreatureState(),
      new NoopScheduler(),
      createTrackingCallbacks(trackersA),
    );

    for (let i = 0; i < TICKS_BEFORE_BOUNDARY; i += 1) {
      controllerA.step();
    }

    controllerA.placeFood({ x: 3, y: 4 });

    for (let i = 0; i < TICKS_AFTER_BOUNDARY; i += 1) {
      controllerA.step();
    }

    /*
     * BRANCH B: identical first phase, then a
     * genuine save -> browser storage ->
     * deserialize -> restored controller
     * boundary, then the same remaining
     * operations.
     */
    const trackersB1 = createTrackers(createM3LifeHistory(), []);

    const controllerB1 = new M3ApplicationController(
      createBrowserCreatureState(),
      new NoopScheduler(),
      createTrackingCallbacks(trackersB1),
    );

    for (let i = 0; i < TICKS_BEFORE_BOUNDARY; i += 1) {
      controllerB1.step();
    }

    controllerB1.placeFood({ x: 3, y: 4 });

    const runAtBoundary = createM3PersistentRunState({
      acquisitionState: controllerB1.getState(),
      lifeHistory: trackersB1.lifeHistoryRef.value,
      playerWorldEvents: trackersB1.playerWorldEventsRef.value,
      nextPlayerEventSequence: controllerB1.getNextEventSequence(),
    });

    const storage = new FakeStorage();

    saveM3PersistentRunToStorage(storage, runAtBoundary);

    const loadResult = loadM3PersistentRunFromStorage(storage);

    if (loadResult.status !== "valid") {
      throw new Error("Expected a valid load result at the reload boundary.");
    }

    const trackersB2 = createTrackers(
      loadResult.run.lifeHistory,
      loadResult.run.playerWorldEvents,
    );

    const schedulerB2 = new NoopScheduler();

    const controllerB2 = restoreM3ApplicationController(
      loadResult.run,
      schedulerB2,
      createTrackingCallbacks(trackersB2),
    );

    /*
     * Restoration itself must be a no-op on the
     * authoritative state: zero ticks, zero RNG
     * consumption, no emitted transition/
     * placement.
     */
    expect(controllerB2.getState()).toEqual(controllerB1.getState());
    expect(controllerB2.getState().rngState).toEqual(
      controllerB1.getState().rngState,
    );
    expect(controllerB2.getMode()).toBe("paused");
    expect(trackersB2.transitionCount.value).toBe(0);
    expect(schedulerB2.startCount).toBe(0);

    for (let i = 0; i < TICKS_AFTER_BOUNDARY; i += 1) {
      controllerB2.step();
    }

    /*
     * FINAL COMPARISON
     */
    const finalA = controllerA.getState();
    const finalB = controllerB2.getState();

    expect(finalB.position).toEqual(finalA.position);
    expect(finalB.hunger).toEqual(finalA.hunger);
    expect(finalB.brain).toEqual(finalA.brain);
    expect(finalB.eligibilityTrace).toEqual(finalA.eligibilityTrace);
    expect(finalB.explorationState).toEqual(finalA.explorationState);
    expect(finalB.foodMemory).toEqual(finalA.foodMemory);
    expect(finalB.food).toEqual(finalA.food);
    expect(finalB.rngState).toEqual(finalA.rngState);
    expect(finalB.tickIndex).toEqual(finalA.tickIndex);
    expect(finalB.simulationTimeSeconds).toEqual(finalA.simulationTimeSeconds);
    expect(finalB).toEqual(finalA);

    expect(trackersB2.playerWorldEventsRef.value).toEqual(
      trackersA.playerWorldEventsRef.value,
    );

    expect(controllerB2.getNextEventSequence()).toBe(
      controllerA.getNextEventSequence(),
    );

    expect(trackersB2.lifeHistoryRef.value).toEqual(
      trackersA.lifeHistoryRef.value,
    );

    /*
     * Completed tick evidence after the reload
     * boundary matches exactly, tick for tick.
     */
    expect(trackersB2.evidenceLog).toEqual(
      trackersA.evidenceLog.slice(TICKS_BEFORE_BOUNDARY),
    );
  });

  it("restores without executing any tick or consuming any RNG, independent of the main comparison run", () => {
    const trackers1 = createTrackers(createM3LifeHistory(), []);

    const controller1 = new M3ApplicationController(
      createBrowserCreatureState(),
      new NoopScheduler(),
      createTrackingCallbacks(trackers1),
    );

    for (let i = 0; i < 10; i += 1) {
      controller1.step();
    }

    const preSaveState = controller1.getState();

    const run = createM3PersistentRunState({
      acquisitionState: preSaveState,
      lifeHistory: trackers1.lifeHistoryRef.value,
      playerWorldEvents: trackers1.playerWorldEventsRef.value,
      nextPlayerEventSequence: controller1.getNextEventSequence(),
    });

    const storage = new FakeStorage();

    saveM3PersistentRunToStorage(storage, run);

    const loadResult = loadM3PersistentRunFromStorage(storage);

    if (loadResult.status !== "valid") {
      throw new Error("Expected a valid load result.");
    }

    const trackers2 = createTrackers(
      loadResult.run.lifeHistory,
      loadResult.run.playerWorldEvents,
    );

    const scheduler2 = new NoopScheduler();

    const restoredController = restoreM3ApplicationController(
      loadResult.run,
      scheduler2,
      createTrackingCallbacks(trackers2),
    );

    expect(restoredController.getState()).toEqual(preSaveState);
    expect(restoredController.getState().tickIndex).toBe(
      preSaveState.tickIndex,
    );
    expect(restoredController.getState().rngState).toEqual(
      preSaveState.rngState,
    );
    expect(trackers2.transitionCount.value).toBe(0);
    expect(trackers2.evidenceLog).toEqual([]);
    expect(scheduler2.startCount).toBe(0);
    expect(scheduler2.stopCount).toBe(0);
  });
});
