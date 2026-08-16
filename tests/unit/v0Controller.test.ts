import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createM1EpisodeState,
  type M1EpisodeState,
} from "../../src/simulation/core/m1Episode.js";

import {
  advanceV0Habitat,
} from "../../src/simulation/core/v0Habitat.js";

import {
  V0ApplicationController,
  V0_PLAY_TICK_INTERVAL_MS,
  type V0ControllerMode,
  type V0TickScheduler,
} from "../../src/ui/v0Controller.js";

class ManualV0TickScheduler
implements V0TickScheduler {
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
    M1EpisodeState;

  readonly scheduler:
    ManualV0TickScheduler;

  readonly controller:
    V0ApplicationController;

  readonly transitions:
    Array<{
      readonly previous:
        M1EpisodeState;

      readonly current:
        M1EpisodeState;
    }>;

  readonly modeChanges:
    V0ControllerMode[];
}

function createHarness():
  ControllerHarness {
  const initialState =
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

  const scheduler =
    new ManualV0TickScheduler();

  const transitions:
    ControllerHarness["transitions"] =
      [];

  const modeChanges:
    V0ControllerMode[] =
      [];

  const controller =
    new V0ApplicationController(
      initialState,

      scheduler,

      {
        onStateTransition: (
          previous,
          current,
        ) => {
          transitions.push(
            {
              previous,
              current,
            },
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
    modeChanges,
  };
}

describe(
  "V0 fixed-step application controller",
  () => {
    it("starts paused without advancing simulation", () => {
      const {
        initialState,
        scheduler,
        controller,
        transitions,
      } =
        createHarness();

      expect(
        controller.getMode(),
      ).toBe(
        "paused",
      );

      expect(
        controller
          .getState()
          .tickIndex,
      ).toBe(
        initialState.tickIndex,
      );

      expect(
        scheduler.active,
      ).toBe(false);

      expect(
        transitions,
      ).toHaveLength(0);
    });

    it("single-step produces exactly one authoritative V0 habitat tick", () => {
      const {
        initialState,
        scheduler,
        controller,
        transitions,
      } =
        createHarness();

      const expected =
        advanceV0Habitat(
          initialState,
        );

      controller.step();

      expect(
        controller.getState(),
      ).toEqual(
        expected,
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

      expect(
        scheduler.startCount,
      ).toBe(0);

      expect(
        controller.getMode(),
      ).toBe(
        "paused",
      );

      /*
       * After the legitimate first direct
       * experience, the deterministic V0
       * environment activates the sensory
       * screen and the resulting state records
       * food as occluded.
       */
      expect(
        controller
          .getState()
          .foodOccluded,
      ).toBe(true);
    });

    it("Play uses wall clock only to request fixed authoritative habitat ticks", () => {
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
        V0_PLAY_TICK_INTERVAL_MS,
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
        advanceV0Habitat(
          initialState,
        );

      scheduler.pulse();

      expect(
        controller.getState(),
      ).toEqual(
        expectedFirst,
      );

      const expectedSecond =
        advanceV0Habitat(
          expectedFirst,
        );

      scheduler.pulse();

      expect(
        controller.getState(),
      ).toEqual(
        expectedSecond,
      );

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

    it("does not allow Step to add an extra tick while Play is active", () => {
      const {
        scheduler,
        controller,
      } =
        createHarness();

      controller.play();

      controller.step();

      expect(
        controller
          .getState()
          .tickIndex,
      ).toBe(0);

      scheduler.pulse();

      expect(
        controller
          .getState()
          .tickIndex,
      ).toBe(1);
    });

    it("does not start multiple schedulers when Play is requested repeatedly", () => {
      const {
        scheduler,
        controller,
      } =
        createHarness();

      controller.play();

      controller.play();

      controller.play();

      expect(
        scheduler.startCount,
      ).toBe(1);

      expect(
        controller.getMode(),
      ).toBe(
        "playing",
      );
    });

    it("automatically stops Play when the authoritative episode completes", () => {
      const {
        scheduler,
        controller,
        modeChanges,
      } =
        createHarness();

      controller.play();

      for (
        let index = 0;
        index < 10 &&
        !controller
          .getState()
          .complete;
        index += 1
      ) {
        scheduler.pulse();
      }

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

      expect(
        scheduler.active,
      ).toBe(false);

      expect(
        modeChanges,
      ).toContain(
        "playing",
      );

      expect(
        modeChanges,
      ).toContain(
        "complete",
      );

      const completedState =
        controller.getState();

      scheduler.pulse();

      controller.step();

      controller.play();

      expect(
        controller.getState(),
      ).toBe(
        completedState,
      );

      expect(
        controller.getMode(),
      ).toBe(
        "complete",
      );
    });
  },
);