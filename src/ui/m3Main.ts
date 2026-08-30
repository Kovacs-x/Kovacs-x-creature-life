import "./m3.css";

import {
  deriveM3PresentationModel,
} from "../rendering/m3Presentation.js";

import {
  createM3AcquisitionState,
  type M3AcquisitionState,
  type M3AcquisitionTickEvidence,
} from "../simulation/core/m3Acquisition.js";

import {
  M3_PRIMARY_BRANCH_A_SEED,
} from "../simulation/core/m3Contract.js";

import {
  createM3LifeHistory,
  observeM3PlayerWorldEventForLifeHistory,
  observeM3TickForLifeHistory,
  type M3LifeHistory,
} from "../simulation/core/m3LifeHistory.js";

import {
  createBrowserM3TickScheduler,
  M3ApplicationController,
} from "./m3Controller.js";

import {
  mountM3Controls,
  type M3ControlView,
} from "./m3Controls.js";

import {
  mountM3Habitat,
} from "./m3Habitat.js";

import {
  mountM3LifeHistory,
} from "./m3LifeHistoryView.js";

import {
  runM3StandardizedLearningComparison,
} from "../simulation/core/m3Probe.js";

import {
  mountM3LearningCheck,
} from "./m3LearningCheckView.js";

/*
 * M3 APPLICATION BOOTSTRAP
 *
 * Browser control intent
 *   ->
 * M3ApplicationController
 *   ->
 * advanceM3AcquisitionTick(...) or
 * applyM3PlayerFoodPlacement(...)
 *   ->
 * new authoritative M3 state
 *   ->
 * deriveM3PresentationModel(...)
 *   ->
 * browser presentation
 *
 * Separately, outside cognition:
 *
 * completed authoritative tick evidence
 *   ->
 * observeM3TickForLifeHistory(...)
 *
 * committed player-world event
 *   ->
 * observeM3PlayerWorldEventForLifeHistory(...)
 *   ->
 * player-facing biography
 *
 * Life history is retained across ordinary
 * ticks and player placements during the same
 * run and is reset only when Reset starts a
 * new run. It is never supplied back into
 * cognition.
 */

const root =
  requireM3BrowserRoot();

const initialState =
  createInitialM3State();

let controlView:
  M3ControlView | null =
    null;

let lifeHistory:
  M3LifeHistory =
    createM3LifeHistory();

let controller:
  M3ApplicationController;

function renderState(
  current:
    M3AcquisitionState,

  previous:
    M3AcquisitionState | null,

  evidence:
    M3AcquisitionTickEvidence | null,
): void {
  const presentation =
    deriveM3PresentationModel(
      current,
      previous,
      evidence,
    );

  mountM3Habitat(
    root,
    presentation,

    {
      onSelectWorldPosition: (
        position,
      ) => {
        controller.placeFood(
          position,
        );
      },
    },
  );

  controlView =
    mountM3Controls(
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
            createInitialM3State(),
          );
        },
      },
    );

  controlView.setMode(
    controller.getMode(),
  );

  mountM3LifeHistory(
    root,
    lifeHistory,
  );

  /*
   * Read-only diagnostic. This never runs during
   * an authoritative tick and never mutates the
   * Creature; it only compares the already-
   * evaluated current.brain against a fresh
   * equivalent under the locked standardized
   * probe.
   */
  mountM3LearningCheck(
    root,

    runM3StandardizedLearningComparison(
      current.brain,
    ),
  );
}

controller =
  new M3ApplicationController(
    initialState,

    createBrowserM3TickScheduler(),

    {
      onStateTransition: (
        previous,
        current,
        evidence,
      ) => {
        /*
         * The biography observer only reads
         * already-completed authoritative tick
         * evidence. It cannot alter simulation
         * state.
         */
        lifeHistory =
          observeM3TickForLifeHistory(
            lifeHistory,
            evidence,
          );

        renderState(
          current,
          previous,
          evidence,
        );
      },

      onPlayerFoodPlacement: (
        previous,
        current,
        event,
      ) => {
        lifeHistory =
          observeM3PlayerWorldEventForLifeHistory(
            lifeHistory,
            event,
          );

        /*
         * Placement is a same-tick external
         * world update: no tick evidence
         * exists for this transition.
         */
        renderState(
          current,
          previous,
          null,
        );
      },

      onStateReset: (
        current,
      ) => {
        /*
         * Reset starts a new run. The
         * player-facing biography restarts
         * with it.
         */
        lifeHistory =
          createM3LifeHistory();

        renderState(
          current,
          null,
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
  null,
);

/*
 * For browser reproducibility this uses the
 * already locked M3 primary Branch A seed with
 * learning and exploration enabled, matching
 * the committed M3.2 experimental contract.
 * This is not a search for a prettier seed.
 *
 * M3.11R additionally enables M2 memory for the
 * ordinary browser Creature only. The locked
 * controlled acquisition experiment and
 * standardized probe are untouched by this and
 * continue to construct memory-disabled state
 * through their own existing call sites.
 */
function createInitialM3State():
  M3AcquisitionState {
  return createM3AcquisitionState(
    {
      seed:
        M3_PRIMARY_BRANCH_A_SEED,

      learningEnabled:
        true,

      explorationEnabled:
        true,

      memoryEnabled:
        true,
    },
  );
}

function requireM3BrowserRoot():
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
      "M3 browser root #app was not found.",
    );
  }

  return element;
}
