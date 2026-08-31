import "./m3.css";
import "./embodiment.css";

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

import {
  mountEmbodimentThreeRenderer,
} from "./embodimentThreeRenderer.js";

/*
 * POST-M3 EMBODIMENT APPLICATION BOOTSTRAP
 *
 * The authoritative application path remains:
 *
 * browser control intent
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
 * presentation consumers
 *
 * The same presentation model is now consumed
 * by:
 *
 * - the persistent Three.js renderer;
 * - the existing M3 DOM presentation.
 *
 * The Three.js renderer does not receive raw
 * simulation state.
 *
 * Browser root
 *   |
 *   +-> persistent Three.js presentation host
 *   |
 *   +-> existing M3 UI root
 *
 * The Three.js requestAnimationFrame loop is a
 * rendering loop only.
 *
 * It never:
 *
 * - advances simulation;
 * - evaluates cognition;
 * - chooses an action;
 * - updates memory;
 * - updates biology;
 * - changes exploration;
 * - consumes authoritative simulation RNG.
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
 * Life History remains outside cognition.
 */

const browserRoot =
  requireM3BrowserRoot();

const browserShell =
  createEmbodimentBrowserShell(
    browserRoot,
  );

/*
 * E4 PLAYER FOOD PLACEMENT
 *
 * The Three.js renderer never receives the
 * controller itself. It only ever calls this one
 * narrow callback with an authoritative planar
 * world position derived from a genuine floor
 * tap/click, exactly mirroring the existing
 * onSelectWorldPosition boundary used by the
 * legacy DOM habitat below.
 */
const threeRenderer =
  mountEmbodimentThreeRenderer(
    browserShell.threeHost,

    {
      onPlaceFoodIntent: (
        position,
      ) => {
        controller.placeFood(
          position,
        );
      },
    },
  );

/*
 * Explicitly release presentation resources
 * when the page is being discarded.
 *
 * This has no simulation consequence.
 */
window.addEventListener(
  "beforeunload",
  () => {
    threeRenderer.dispose();
  },
  {
    once:
      true,
  },
);

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

  /*
   * The Three.js scene receives only the same
   * already-derived presentation model used by
   * the existing browser presentation.
   *
   * It does not receive current, previous,
   * evidence, brain state, RNG state or memory
   * internals directly.
   */
  threeRenderer.updatePresentation(
    presentation,
  );

  /*
   * Existing M3 DOM presentation continues to
   * render inside its own subtree.
   *
   * Rebuilding this subtree cannot destroy or
   * recreate the sibling Three.js canvas.
   */
  mountM3Habitat(
    browserShell.m3Root,
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
      browserShell.m3Root,
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
    browserShell.m3Root,
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
    browserShell.m3Root,

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
         * world update: no tick evidence exists
         * for this transition.
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
         *
         * The presentation-only Three.js
         * renderer remains mounted because
         * resetting the Creature does not mean
         * recreating the browser renderer.
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
 * the committed M3 experimental contract.
 *
 * This is not a search for a prettier seed.
 *
 * M3.11R additionally enables M2 memory for the
 * ordinary browser Creature only. The locked
 * controlled acquisition experiment and
 * standardized probe remain untouched.
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

interface EmbodimentBrowserShell {
  readonly threeHost:
    HTMLElement;

  readonly m3Root:
    HTMLElement;
}

/*
 * Create the browser presentation partition
 * exactly once.
 *
 * The Three.js host is outside the subtree that
 * the legacy M3 DOM habitat renderer rebuilds.
 *
 * This is presentation structure only.
 */
function createEmbodimentBrowserShell(
  root:
    HTMLElement,
): EmbodimentBrowserShell {
  const foundationPanel =
    document.createElement(
      "section",
    );

  foundationPanel.className =
    "embodiment-foundation-panel";

  foundationPanel.setAttribute(
    "aria-labelledby",
    "embodiment-foundation-title",
  );

  const heading =
    document.createElement(
      "div",
    );

  heading.className =
    "embodiment-foundation-heading";

  const headingText =
    document.createElement(
      "div",
    );

  const eyebrow =
    document.createElement(
      "p",
    );

  eyebrow.className =
    "embodiment-foundation-eyebrow";

  eyebrow.textContent =
    "Embodiment slice";

  const title =
    document.createElement(
      "h2",
    );

  title.id =
    "embodiment-foundation-title";

  title.textContent =
    "Persistent 3D habitat";

  const description =
    document.createElement(
      "p",
    );

  description.className =
    "embodiment-foundation-description";

  description.textContent =
    "The Creature, food and non-solid sensory screen below are driven only by the existing M3 presentation model.";

  headingText.append(
    eyebrow,
    title,
    description,
  );

  const badge =
    document.createElement(
      "span",
    );

  badge.className =
    "embodiment-foundation-badge";

  badge.textContent =
    "E2";

  heading.append(
    headingText,
    badge,
  );

  const threeHost =
    document.createElement(
      "div",
    );

  threeHost.className =
    "embodiment-three-host";

  threeHost.setAttribute(
    "data-embodiment-three-host",
    "",
  );

  const note =
    document.createElement(
      "p",
    );

  note.className =
    "embodiment-foundation-note";

  note.textContent =
    "The visual frame loop renders presentation state only; authoritative simulation still advances exclusively through the M3 controller.";

  foundationPanel.append(
    heading,
    threeHost,
    note,
  );

  const m3Root =
    document.createElement(
      "div",
    );

  m3Root.setAttribute(
    "data-m3-ui-root",
    "",
  );

  root.replaceChildren(
    foundationPanel,
    m3Root,
  );

  return {
    threeHost,
    m3Root,
  };
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