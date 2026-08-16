import {
  advanceV0Habitat,
} from "../simulation/core/v0Habitat.js";

import type {
  M1EpisodeState,
} from "../simulation/core/m1Episode.js";

/*
 * Browser pacing only.
 *
 * This value determines when the application
 * requests another complete authoritative
 * V0 habitat tick while Play is active.
 *
 * It is never supplied to cognition as a
 * variable delta.
 */
export const V0_PLAY_TICK_INTERVAL_MS =
  1000;

export type V0ControllerMode =
  | "paused"
  | "playing"
  | "complete";

export interface V0TickScheduler {
  start(
    callback:
      () => void,

    intervalMilliseconds:
      number,
  ): number;

  stop(
    handle:
      number,
  ): void;
}

export interface V0ControllerCallbacks {
  readonly onStateTransition:
    (
      previous:
        M1EpisodeState,

      current:
        M1EpisodeState,
    ) => void;

  readonly onModeChange:
    (
      mode:
        V0ControllerMode,
    ) => void;
}

/*
 * V0 FIXED-STEP APPLICATION CONTROLLER
 *
 * UI intent
 *   ->
 * controller
 *   ->
 * advanceV0Habitat(...)
 *   ->
 * environmental input synchronization
 *   ->
 * accepted advanceM1Episode(...)
 *   ->
 * new authoritative simulation state
 *
 * The habitat transition is still exactly one
 * authoritative Creature simulation tick.
 *
 * This controller cannot:
 *
 * - select Creature actions;
 * - set neural activations;
 * - create or edit memory;
 * - move the Creature directly;
 * - supply food coordinates to cognition;
 * - alter simulation tick duration.
 */
export class V0ApplicationController {
  private state:
    M1EpisodeState;

  private mode:
    V0ControllerMode;

  private schedulerHandle:
    number | null =
      null;

  public constructor(
    initialState:
      M1EpisodeState,

    private readonly scheduler:
      V0TickScheduler,

    private readonly callbacks:
      V0ControllerCallbacks,
  ) {
    this.state =
      initialState;

    this.mode =
      initialState.complete
        ? "complete"
        : "paused";
  }

  public getState():
    M1EpisodeState {
    return this.state;
  }

  public getMode():
    V0ControllerMode {
    return this.mode;
  }

  /*
   * Single-step means exactly one
   * authoritative V0 habitat transition.
   *
   * Step is ignored while Play is active so
   * two browser control pathways cannot add
   * ticks concurrently.
   */
  public step():
    void {
    if (
      this.mode ===
      "playing"
    ) {
      return;
    }

    this.advanceOneTick();
  }

  public play():
    void {
    if (
      this.state.complete ||
      this.mode ===
        "complete"
    ) {
      this.finish();
      return;
    }

    if (
      this.mode ===
      "playing"
    ) {
      return;
    }

    this.setMode(
      "playing",
    );

    this.schedulerHandle =
      this.scheduler.start(
        () => {
          if (
            this.mode ===
            "playing"
          ) {
            this.advanceOneTick();
          }
        },

        V0_PLAY_TICK_INTERVAL_MS,
      );
  }

  public pause():
    void {
    if (
      this.mode !==
      "playing"
    ) {
      return;
    }

    this.stopScheduler();

    this.setMode(
      "paused",
    );
  }

  private advanceOneTick():
    void {
    if (
      this.state.complete ||
      this.mode ===
        "complete"
    ) {
      this.finish();
      return;
    }

    const previous =
      this.state;

    const current =
      advanceV0Habitat(
        previous,
      );

    this.state =
      current;

    this.callbacks
      .onStateTransition(
        previous,
        current,
      );

    if (current.complete) {
      this.finish();
    }
  }

  private finish():
    void {
    this.stopScheduler();

    this.setMode(
      "complete",
    );
  }

  private stopScheduler():
    void {
    if (
      this.schedulerHandle ===
      null
    ) {
      return;
    }

    this.scheduler.stop(
      this.schedulerHandle,
    );

    this.schedulerHandle =
      null;
  }

  private setMode(
    nextMode:
      V0ControllerMode,
  ): void {
    if (
      this.mode ===
      nextMode
    ) {
      return;
    }

    this.mode =
      nextMode;

    this.callbacks
      .onModeChange(
        nextMode,
      );
  }
}

/*
 * Wall-clock scheduling decides only WHEN a
 * fixed authoritative tick is requested.
 *
 * It does not determine the amount of
 * simulation time represented by that tick.
 */
export function createBrowserV0TickScheduler():
  V0TickScheduler {
  return {
    start: (
      callback,
      intervalMilliseconds,
    ) =>
      window.setInterval(
        callback,
        intervalMilliseconds,
      ),

    stop: (
      handle,
    ) => {
      window.clearInterval(
        handle,
      );
    },
  };
}