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
  mountV0Habitat,
} from "./v0Habitat.js";

/*
 * V0.3 APPLICATION BOOTSTRAP
 *
 * Browser control intent
 *   ->
 * V0ApplicationController
 *   ->
 * accepted advanceM1Episode(...)
 *   ->
 * authoritative simulation state
 *   ->
 * V0PresentationModel
 *   ->
 * browser presentation
 *
 * Neither the controls nor the renderer can
 * select a Creature action directly.
 */

const root =
  requireV0BrowserRoot();

const initialState =
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

let controlView:
  V0ControlView | null =
    null;

let controller:
  V0ApplicationController;

/*
 * The current habitat is deliberately small.
 *
 * On every authoritative transition, the
 * browser is rebuilt from the new
 * presentation model.
 *
 * This avoids creating another mutable world
 * representation inside the browser.
 *
 * Later visual interpolation may maintain
 * transient presentation state, but must
 * never become simulation truth.
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
      },
    );

  controlView.setMode(
    controller.getMode(),
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
        renderState(
          current,
          previous,
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

function requireV0BrowserRoot():
  HTMLElement {
  const element =
    document.querySelector<HTMLElement>(
      "#app",
    );

  if (element === null) {
    throw new Error(
      "V0 browser root #app was not found.",
    );
  }

  return element;
}