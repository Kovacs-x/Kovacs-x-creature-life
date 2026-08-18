import "./v0.css";

import {
  deriveV0PresentationModel,
} from "../rendering/v0Presentation.js";

import {
  createM1EpisodeState,
  type M1EpisodeState,
} from "../simulation/core/m1Episode.js";

import {
  createBrowserV0TickScheduler,
  V0ApplicationController,
} from "./v0Controller.js";

import {
  mountV0Controls,
  type V0ControlView,
} from "./v0Controls.js";

import {
  appendV0CausalHistory,
  createV0CausalHistory,
  type V0CausalHistory,
} from "./v0History.js";

import {
  mountV0Inspector,
} from "./v0Inspector.js";

import {
  mountV0Habitat,
} from "./v0Habitat.js";

/*
 * V0 APPLICATION BOOTSTRAP
 *
 * Browser control intent
 *   ->
 * V0ApplicationController
 *   ->
 * authoritative V0 habitat transition
 *   ->
 * new authoritative simulation state
 *   ->
 * presentation model
 *   ->
 * browser presentation
 *
 * Separately:
 *
 * completed authoritative transition
 *   ->
 * bounded diagnostic history
 *   ->
 * Why / History inspector
 *
 * Reset:
 *
 * browser reset intent
 *   ->
 * stop execution
 *   ->
 * construct predefined authoritative scenario
 *   ->
 * clear presentation/debug history
 *   ->
 * render
 *
 * Diagnostic history never flows back into
 * Creature cognition.
 */

const root =
  requireV0BrowserRoot();

const initialState =
  createInitialV0State();

let controlView:
  V0ControlView | null =
    null;

/*
 * Presentation/debug state only.
 *
 * This collection is deliberately separate
 * from M1EpisodeState and FoodMemoryTrace.
 */
let history:
  V0CausalHistory =
    createV0CausalHistory();

let controller:
  V0ApplicationController;

/*
 * The current habitat remains rebuilt from
 * authoritative simulation state.
 *
 * The inspector is then mounted from bounded
 * diagnostic history.
 *
 * Neither representation becomes simulation
 * truth.
 */
function renderState(
  current:
    M1EpisodeState,

  previous:
    M1EpisodeState | null,
): void {
  const presentation =
    deriveV0PresentationModel(
      current,
      previous,
    );

  mountV0Habitat(
    root,
    presentation,
  );

  controlView =
    mountV0Controls(
      root,
      {
        onPlay: () => {
          controller.play();
        },

        onPause: () => {
          controller.pause();
        },

        onStep: () => {
          controller.step();
        },

        onReset: () => {
          controller.reset(
            createInitialV0State(),
          );
        },
      },
    );

  controlView.setMode(
    controller.getMode(),
  );

  mountV0Inspector(
    root,
    history,
  );
}

controller =
  new V0ApplicationController(
    initialState,

    createBrowserV0TickScheduler(),

    {
      onStateTransition: (
        previous,
        current,
      ) => {
        /*
         * Record only after the authoritative
         * transition has completed.
         *
         * appendV0CausalHistory is a pure
         * observer and cannot alter either
         * episode state.
         */
        history =
          appendV0CausalHistory(
            history,
            previous,
            current,
          );

        renderState(
          current,
          previous,
        );
      },

      onStateReset: (
        current,
      ) => {
        /*
         * Reset starts a new demonstration
         * interval.
         *
         * Recent browser diagnostic history is
         * therefore cleared rather than
         * misrepresenting reset as an ordinary
         * consecutive simulation tick.
         *
         * This is presentation/debug state,
         * not Creature memory.
         */
        history =
          createV0CausalHistory();

        renderState(
          current,
          null,
        );
      },

      onModeChange: (
        mode,
      ) => {
        controlView?.setMode(
          mode,
        );
      },
    },
  );

renderState(
  initialState,
  null,
);

function createInitialV0State():
  M1EpisodeState {
  return createM1EpisodeState(
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
}

function requireV0BrowserRoot():
  HTMLElement {
  const element =
    document.querySelector<HTMLElement>(
      "#app",
    );

  if (
    element ===
    null
  ) {
    throw new Error(
      "V0 browser root #app was not found.",
    );
  }

  return element;
}