import {
  advanceM3AcquisitionTick,
  type M3AcquisitionState,
  type M3AcquisitionTickEvidence,
} from "../simulation/core/m3Acquisition.js";

import {
  applyM3PlayerFoodPlacement,
  type M3PlayerFoodWorldEvent,
  type M3PlayerWorldPosition,
} from "../simulation/core/m3PlayerWorld.js";

/*
 * Browser pacing only.
 *
 * This value determines when the application
 * requests another complete authoritative
 * M3 acquisition tick while Play is active.
 *
 * It is never supplied to cognition as a
 * variable delta. advanceM3AcquisitionTick(...)
 * always advances by the fixed authoritative
 * M3_ACQUISITION_TICK_SECONDS regardless of
 * how this browser interval is chosen.
 */
export const M3_PLAY_TICK_INTERVAL_MS =
  1000;

export type M3ControllerMode =
  | "paused"
  | "playing"
  | "complete";

export interface M3TickScheduler {
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

export interface M3ControllerCallbacks {
  /*
   * Fired after exactly one authoritative
   * advanceM3AcquisitionTick(...) transition.
   *
   * evidence is returned unmodified from that
   * call; the controller does not reconstruct
   * or approximate it.
   */
  readonly onStateTransition:
    (
      previous:
        M3AcquisitionState,

      current:
        M3AcquisitionState,

      evidence:
        M3AcquisitionTickEvidence,
    ) => void;

  /*
   * Fired after a player food placement/
   * relocation.
   *
   * This is a same-tick authoritative world
   * update, not a simulation transition. It
   * carries the genuine M3PlayerFoodWorldEvent
   * returned by applyM3PlayerFoodPlacement(...).
   */
  readonly onPlayerFoodPlacement:
    (
      previous:
        M3AcquisitionState,

      current:
        M3AcquisitionState,

      event:
        M3PlayerFoodWorldEvent,
    ) => void;

  /*
   * Reset is not a simulation transition.
   *
   * It replaces the current authoritative
   * state with an explicitly supplied
   * authoritative initial state.
   */
  readonly onStateReset:
    (
      current:
        M3AcquisitionState,
    ) => void;

  readonly onModeChange:
    (
      mode:
        M3ControllerMode,
    ) => void;
}

/*
 * M3 FIXED-STEP APPLICATION CONTROLLER
 *
 * UI intent
 *   ->
 * controller
 *   ->
 * advanceM3AcquisitionTick(...)
 *   ->
 * new authoritative M3 state
 *   + committed M3AcquisitionTickEvidence
 *
 * Player food placement is a distinct
 * pathway:
 *
 * UI habitat-tap intent
 *   ->
 * controller
 *   ->
 * applyM3PlayerFoodPlacement(...)
 *   ->
 * new authoritative world state
 *   + committed M3PlayerFoodWorldEvent
 *
 * No simulation tick occurs during placement.
 *
 * Reset is deliberately different again:
 *
 * UI reset intent
 *   ->
 * stop browser scheduler
 *   ->
 * replace authoritative state with the
 * predefined M3 controlled initial
 * configuration
 *   ->
 * reset the deterministic external event
 * sequence
 *   ->
 * render that state
 *
 * This controller cannot:
 *
 * - select a Creature action;
 * - set neural activation;
 * - move the Creature directly;
 * - supply pointer/food coordinates to
 *   cognition;
 * - consume simulation RNG;
 * - alter simulation tick duration;
 * - run a second simulation loop.
 */
export class M3ApplicationController {
  private state:
    M3AcquisitionState;

  private mode:
    M3ControllerMode;

  private schedulerHandle:
    number | null =
      null;

  private nextEventSequence:
    number =
      0;

  public constructor(
    initialState:
      M3AcquisitionState,

    private readonly scheduler:
      M3TickScheduler,

    private readonly callbacks:
      M3ControllerCallbacks,
  ) {
    this.state =
      initialState;

    this.mode =
      initialState.complete
        ? "complete"
        : "paused";
  }

  public getState():
    M3AcquisitionState {
    return this.state;
  }

  public getMode():
    M3ControllerMode {
    return this.mode;
  }

  /*
   * The next deterministic external-event
   * sequence number that a player food
   * placement will receive.
   */
  public getNextEventSequence():
    number {
    return this.nextEventSequence;
  }

  /*
   * Single-step means exactly one
   * authoritative M3 acquisition transition.
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

        M3_PLAY_TICK_INTERVAL_MS,
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

  /*
   * Restore an explicitly supplied
   * authoritative M3 initial state.
   *
   * No simulation tick occurs.
   *
   * The deterministic external event sequence
   * restarts for the new run.
   */
  public reset(
    nextState:
      M3AcquisitionState,
  ): void {
    this.stopScheduler();

    this.state =
      nextState;

    this.nextEventSequence =
      0;

    this.setMode(
      nextState.complete
        ? "complete"
        : "paused",
    );

    this.callbacks
      .onStateReset(
        nextState,
      );
  }

  /*
   * M3.8 PLAYER FOOD PLACEMENT
   *
   * This performs exactly one call to the
   * committed applyM3PlayerFoodPlacement(...)
   * boundary.
   *
   * It never executes a simulation tick, never
   * evaluates the brain and never consumes
   * simulation RNG.
   */
  public placeFood(
    destination:
      M3PlayerWorldPosition,
  ): void {
    const previous =
      this.state;

    const wasComplete =
      previous.complete;

    const sequence =
      this.nextEventSequence;

    const placement =
      applyM3PlayerFoodPlacement(
        previous,

        destination,

        sequence,
      );

    this.state =
      placement.state;

    this.nextEventSequence =
      sequence +
      1;

    /*
     * Reactivating a previously completed
     * resource must not silently resume
     * cognition. The player explicitly opts
     * back into Step/Play afterward.
     *
     * An ordinary relocation while paused or
     * playing leaves the current mode
     * unchanged; the next scheduled or
     * requested tick independently senses the
     * changed world.
     */
    if (wasComplete) {
      this.stopScheduler();

      this.setMode(
        "paused",
      );
    }

    this.callbacks
      .onPlayerFoodPlacement(
        previous,

        this.state,

        placement.event,
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

    const result =
      advanceM3AcquisitionTick(
        previous,
      );

    this.state =
      result.state;

    this.callbacks
      .onStateTransition(
        previous,
        this.state,
        result.evidence,
      );

    if (this.state.complete) {
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
      M3ControllerMode,
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
export function createBrowserM3TickScheduler():
  M3TickScheduler {
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
