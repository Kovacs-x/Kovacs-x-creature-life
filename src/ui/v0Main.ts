import "./v0.css";

import {
  deriveV0PresentationModel,
} from "../rendering/v0Presentation.js";

import {
  createM1EpisodeState,
} from "../simulation/core/m1Episode.js";

import {
  mountV0Habitat,
} from "./v0Habitat.js";

/*
 * V0.2 APPLICATION BOOTSTRAP
 *
 * This file is allowed to know about both:
 *
 * - authoritative simulation state;
 * - presentation.
 *
 * It is the one-way application boundary:
 *
 * simulation
 *   ->
 * presentation model
 *   ->
 * renderer
 *
 * The browser renderer itself receives only
 * V0PresentationModel.
 *
 * No simulation tick occurs yet.
 * Fixed-step execution belongs to V0.3.
 */
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

const presentation =
  deriveV0PresentationModel(
    initialState,
  );

const root =
  document.querySelector<HTMLElement>(
    "#app",
  );

if (root === null) {
  throw new Error(
    "V0 browser root #app was not found.",
  );
}

mountV0Habitat(
  root,
  presentation,
);