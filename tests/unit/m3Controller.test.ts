import {
  describe,
  expect,
  it,
} from "vitest";

import {
  advanceM3AcquisitionTick,
  createM3AcquisitionState,
  type M3AcquisitionState,
} from "../../src/simulation/core/m3Acquisition.js";

import {
  applyM3PlayerFoodPlacement,
  type M3PlayerFoodWorldEvent,
} from "../../src/simulation/core/m3PlayerWorld.js";

import {
  M3_PRIMARY_BRANCH_A_SEED,
} from "../../src/simulation/core/m3Contract.js";

import {
  M3ApplicationController,
  M3_PLAY_TICK_INTERVAL_MS,
  type M3ControllerMode,
  type M3TickScheduler,
} from "../../src/ui/m3Controller.js";

class ManualM3TickScheduler
implements M3TickScheduler {
  public intervalMilliseconds:
    number | null =
      null;

  public active =
    false;

  public startCount =
    0;

  public stopCount =
    0;

  private callback:
    (() => void) | null =
      null;

  private nextHandle =
    1;

  public start(
    callback:
      () => void,

    intervalMilliseconds:
      number,
  ): number {
    this.callback =
      callback;

    this.intervalMilliseconds =
      intervalMilliseconds;

    this.active =
      true;

    this.startCount +=
      1;

    const handle =
      this.nextHandle;

    this.nextHandle +=
      1;

    return handle;
  }

  public stop(
    _handle:
      number,
  ): void {
    this.active =
      false;

    this.callback =
      null;

    this.stopCount +=
      1;
  }

  public pulse():
    void {
    if (
      !this.active ||
      this.callback ===
        null
    ) {
      return;
    }

    this.callback();
  }
}

interface ControllerHarness {
  readonly initialState:
    M3AcquisitionState;

  readonly scheduler:
    ManualM3TickScheduler;

  readonly controller:
    M3ApplicationController;

  readonly transitions:
    Array<{
      readonly previous:
        M3AcquisitionState;

      readonly current:
        M3AcquisitionState;

      readonly evidence:
        ReturnType<
          typeof advanceM3AcquisitionTick
        >["evidence"];
    }>;

  readonly placements:
    Array<{
      readonly previous:
        M3AcquisitionState;

      readonly current:
        M3AcquisitionState;

      readonly event:
        M3PlayerFoodWorldEvent;
    }>;

  readonly resets:
    M3AcquisitionState[];

  readonly modeChanges:
    M3ControllerMode[];
}

function createTestState():
  M3AcquisitionState {
  return createM3AcquisitionState(
    {
      seed:
        M3_PRIMARY_BRANCH_A_SEED,

      learningEnabled:
        true,

      explorationEnabled:
        true,
    },
  );
}

function createHarness():
  ControllerHarness {
  const initialState =
    createTestState();

  const scheduler =
    new ManualM3TickScheduler();

  const transitions:
    ControllerHarness["transitions"] =
      [];

  const placements:
    ControllerHarness["placements"] =
      [];

  const resets:
    M3AcquisitionState[] =
      [];

  const modeChanges:
    M3ControllerMode[] =
      [];

  const controller =
    new M3ApplicationController(
      initialState,

      scheduler,

      {
        onStateTransition: (
          previous,
          current,
          evidence,
        ) => {
          transitions.push(
            {
              previous,
              current,
              evidence,
            },
          );
        },

        onPlayerFoodPlacement: (
          previous,
          current,
          event,
        ) => {
          placements.push(
            {
              previous,
              current,
              event,
            },
          );
        },

        onStateReset: (
          current,
        ) => {
          resets.push(
            current,
          );
        },

        onModeChange: (
          mode,
        ) => {
          modeChanges.push(
            mode,
          );
        },
      },
    );

  return {
    initialState,
    scheduler,
    controller,
    transitions,
    placements,
    resets,
    modeChanges,
  };
}

/*
 * Advance the harness by Step until the state
 * completes or a safety bound is exceeded. The
 * locked M3 contract expects Branch A to
 * autonomously discover and consume food well
 * inside this bound.
 */
function stepUntilComplete(
  controller:
    M3ApplicationController,

  maxSteps =
    64,
): void {
  for (
    let index = 0;
    index < maxSteps &&
    !controller
      .getState()
      .complete;
    index += 1
  ) {
    controller.step();
  }

  if (
    !controller
      .getState()
      .complete
  ) {
    throw new Error(
      "Locked M3 Branch A did not complete within the test step bound.",
    );
  }
}

describe(
  "M3 fixed-step application controller",
  () => {
    it("starts paused without advancing simulation", () => {
      const {
        initialState,
        scheduler,
        controller,
        transitions,
        resets,
      } =
        createHarness();

      expect(
        controller.getMode(),
      ).toBe(
        "paused",
      );

      expect(
        controller.getState(),
      ).toBe(
        initialState,
      );

      expect(
        controller
          .getNextEventSequence(),
      ).toBe(0);

      expect(
        scheduler.active,
      ).toBe(false);

      expect(
        transitions,
      ).toHaveLength(0);

      expect(
        resets,
      ).toHaveLength(0);
    });

    it("Step produces exactly one authoritative M3 acquisition tick", () => {
      const {
        initialState,
        scheduler,
        controller,
        transitions,
      } =
        createHarness();

      const expected =
        advanceM3AcquisitionTick(
          initialState,
        );

      controller.step();

      expect(
        controller.getState(),
      ).toEqual(
        expected.state,
      );

      expect(
        controller
          .getState()
          .tickIndex,
      ).toBe(
        initialState.tickIndex +
          1,
      );

      expect(
        transitions,
      ).toHaveLength(1);

      expect(
        transitions[0]
          ?.previous,
      ).toBe(
        initialState,
      );

      expect(
        transitions[0]
          ?.current,
      ).toBe(
        controller.getState(),
      );

      /*
       * The controller must expose the exact
       * evidence returned by
       * advanceM3AcquisitionTick, not a
       * reconstruction.
       */
      expect(
        transitions[0]
          ?.evidence,
      ).toEqual(
        expected.evidence,
      );

      expect(
        scheduler.startCount,
      ).toBe(0);
    });

    it("Play requests a fixed authoritative tick interval rather than variable-delta simulation", () => {
      const {
        initialState,
        scheduler,
        controller,
      } =
        createHarness();

      controller.play();

      expect(
        controller.getMode(),
      ).toBe(
        "playing",
      );

      expect(
        scheduler.active,
      ).toBe(true);

      expect(
        scheduler
          .intervalMilliseconds,
      ).toBe(
        M3_PLAY_TICK_INTERVAL_MS,
      );

      /*
       * Starting Play does not itself advance
       * simulation.
       */
      expect(
        controller.getState(),
      ).toBe(
        initialState,
      );

      const expectedFirst =
        advanceM3AcquisitionTick(
          initialState,
        );

      scheduler.pulse();

      expect(
        controller.getState(),
      ).toEqual(
        expectedFirst.state,
      );

      const expectedSecond =
        advanceM3AcquisitionTick(
          expectedFirst.state,
        );

      scheduler.pulse();

      expect(
        controller.getState(),
      ).toEqual(
        expectedSecond.state,
      );

      /*
       * Each scheduler pulse advances by
       * exactly the fixed authoritative tick
       * duration, independent of wall-clock
       * timing.
       */
      expect(
        controller
          .getState()
          .simulationTimeSeconds,
      ).toBe(2);
    });

    it("Pause prevents later scheduler pulses from advancing simulation", () => {
      const {
        scheduler,
        controller,
      } =
        createHarness();

      controller.play();

      scheduler.pulse();

      expect(
        controller
          .getState()
          .tickIndex,
      ).toBe(1);

      controller.pause();

      expect(
        controller.getMode(),
      ).toBe(
        "paused",
      );

      expect(
        scheduler.active,
      ).toBe(false);

      const pausedState =
        controller.getState();

      scheduler.pulse();

      expect(
        controller.getState(),
      ).toBe(
        pausedState,
      );
    });

    it("player food placement performs no simulation tick", () => {
      const {
        initialState,
        controller,
        transitions,
      } =
        createHarness();

      controller.placeFood(
        {
          x: 2,
          y: 3,
        },
      );

      expect(
        controller
          .getState()
          .tickIndex,
      ).toBe(
        initialState.tickIndex,
      );

      expect(
        controller
          .getState()
          .simulationTimeSeconds,
      ).toBe(
        initialState
          .simulationTimeSeconds,
      );

      /*
       * Placement is not reported as an
       * ordinary simulation transition.
       */
      expect(
        transitions,
      ).toHaveLength(0);
    });

    it("player placement exposes the genuine M3PlayerFoodWorldEvent", () => {
      const {
        initialState,
        controller,
        placements,
      } =
        createHarness();

      const expected =
        applyM3PlayerFoodPlacement(
          initialState,

          {
            x: 5,
            y: 1,
          },

          0,
        );

      controller.placeFood(
        {
          x: 5,
          y: 1,
        },
      );

      expect(
        placements,
      ).toHaveLength(1);

      expect(
        placements[0]
          ?.event,
      ).toEqual(
        expected.event,
      );

      expect(
        placements[0]
          ?.previous,
      ).toBe(
        initialState,
      );

      expect(
        placements[0]
          ?.current,
      ).toEqual(
        expected.state,
      );

      expect(
        placements[0]
          ?.current
          .food
          .position,
      ).toEqual(
        {
          x: 5,
          y: 1,
        },
      );
    });

    it("player placement does not directly change Creature position, brain, exploration state or RNG", () => {
      const {
        initialState,
        controller,
      } =
        createHarness();

      controller.placeFood(
        {
          x: 7,
          y: 6,
        },
      );

      const after =
        controller.getState();

      expect(
        after.position,
      ).toEqual(
        initialState.position,
      );

      expect(
        after.brain,
      ).toEqual(
        initialState.brain,
      );

      expect(
        after.explorationState,
      ).toEqual(
        initialState
          .explorationState,
      );

      expect(
        after.rngState,
      ).toEqual(
        initialState.rngState,
      );

      expect(
        after.hunger,
      ).toEqual(
        initialState.hunger,
      );

      expect(
        after.eligibilityTrace,
      ).toEqual(
        initialState
          .eligibilityTrace,
      );
    });

    it("deterministic event sequences begin at 0 and increment predictably", () => {
      const {
        controller,
        placements,
      } =
        createHarness();

      expect(
        controller
          .getNextEventSequence(),
      ).toBe(0);

      controller.placeFood(
        {
          x: 1,
          y: 1,
        },
      );

      expect(
        placements[0]
          ?.event
          .sequence,
      ).toBe(0);

      expect(
        controller
          .getNextEventSequence(),
      ).toBe(1);

      controller.placeFood(
        {
          x: 2,
          y: 2,
        },
      );

      expect(
        placements[1]
          ?.event
          .sequence,
      ).toBe(1);

      expect(
        controller
          .getNextEventSequence(),
      ).toBe(2);

      controller.placeFood(
        {
          x: 3,
          y: 3,
        },
      );

      expect(
        placements[2]
          ?.event
          .sequence,
      ).toBe(2);

      expect(
        controller
          .getNextEventSequence(),
      ).toBe(3);
    });

    it("placing food after completion reactivates the resource and permits future simulation", () => {
      const {
        controller,
        modeChanges,
      } =
        createHarness();

      stepUntilComplete(
        controller,
      );

      expect(
        controller
          .getState()
          .complete,
      ).toBe(true);

      expect(
        controller.getMode(),
      ).toBe(
        "complete",
      );

      controller.placeFood(
        {
          x: 4,
          y: 4,
        },
      );

      expect(
        controller
          .getState()
          .complete,
      ).toBe(false);

      expect(
        controller.getMode(),
      ).toBe(
        "paused",
      );

      expect(
        modeChanges,
      ).toContain(
        "complete",
      );

      /*
       * Simulation genuinely continues: a
       * further Step performs a real
       * authoritative tick rather than
       * throwing on a completed round.
       */
      const stateBeforeStep =
        controller.getState();

      controller.step();

      expect(
        controller
          .getState()
          .tickIndex,
      ).toBe(
        stateBeforeStep.tickIndex +
          1,
      );
    });

    it("reset restores the predefined initial M3 state and resets event ordering", () => {
      const {
        controller,
        resets,
      } =
        createHarness();

      controller.step();

      controller.placeFood(
        {
          x: 6,
          y: 6,
        },
      );

      controller.placeFood(
        {
          x: 7,
          y: 7,
        },
      );

      expect(
        controller
          .getNextEventSequence(),
      ).toBe(2);

      const resetState =
        createTestState();

      controller.reset(
        resetState,
      );

      expect(
        controller.getState(),
      ).toBe(
        resetState,
      );

      expect(
        controller.getMode(),
      ).toBe(
        "paused",
      );

      expect(
        controller
          .getNextEventSequence(),
      ).toBe(0);

      expect(
        resets,
      ).toEqual(
        [
          resetState,
        ],
      );

      /*
       * A placement after reset uses sequence
       * 0 again, matching a fresh run.
       */
      controller.placeFood(
        {
          x: 1,
          y: 1,
        },
      );

      expect(
        controller
          .getNextEventSequence(),
      ).toBe(1);
    });

    it("Reset stops active Play before restoring the predefined state", () => {
      const {
        scheduler,
        controller,
      } =
        createHarness();

      controller.play();

      scheduler.pulse();

      const resetState =
        createTestState();

      controller.reset(
        resetState,
      );

      expect(
        scheduler.active,
      ).toBe(false);

      expect(
        controller.getState(),
      ).toBe(
        resetState,
      );

      scheduler.pulse();

      expect(
        controller.getState(),
      ).toBe(
        resetState,
      );
    });

    it("ordinary tick callback includes the exact committed M3AcquisitionTickEvidence", () => {
      const {
        initialState,
        controller,
        transitions,
      } =
        createHarness();

      controller.step();

      const directResult =
        advanceM3AcquisitionTick(
          initialState,
        );

      expect(
        transitions[0]
          ?.evidence,
      ).toEqual(
        directResult.evidence,
      );
    });

    it("reproduces identical controller progression from identical input/state", () => {
      function runScript(): M3AcquisitionState {
        const harness =
          createHarness();

        harness.controller.step();

        harness.controller.step();

        harness.controller.placeFood(
          {
            x: 3,
            y: 3,
          },
        );

        harness.controller.step();

        harness.controller.play();

        harness.scheduler.pulse();

        harness.scheduler.pulse();

        harness.controller.pause();

        return harness.controller.getState();
      }

      const first =
        runScript();

      const second =
        runScript();

      expect(
        second,
      ).toEqual(
        first,
      );
    });
  },
);
