import type {
  M3ControllerMode,
} from "./m3Controller.js";

export interface M3ControlActions {
  readonly onPlay:
    () => void;

  readonly onPause:
    () => void;

  readonly onStep:
    () => void;

  readonly onReset:
    () => void;
}

export interface M3ControlView {
  setMode(
    mode:
      M3ControllerMode,
  ): void;
}

/*
 * M3 CONTROL PRESENTATION
 *
 * These controls emit only application
 * execution intent:
 *
 * - Play;
 * - Pause;
 * - Step;
 * - Reset.
 *
 * They have no interface for:
 *
 * - IDLE / SEEK / EAT / EXPLORE;
 * - neural activation;
 * - exploration heading;
 * - Creature coordinates.
 *
 * Reset restores the predefined authoritative
 * M3 initial configuration. It does not
 * directly command the Creature.
 */
export function mountM3Controls(
  root:
    HTMLElement,

  actions:
    M3ControlActions,
): M3ControlView {
  const habitatPanel =
    requireElement(
      root,
      ".m3-habitat-panel",
    );

  const habitat =
    requireElement(
      root,
      ".m3-habitat",
    );

  const controls =
    document.createElement(
      "div",
    );

  controls.className =
    "m3-status-grid";

  controls.setAttribute(
    "aria-label",
    "Simulation controls",
  );

  controls.innerHTML = `
    <article class="m3-status-card">
      <span class="m3-status-key">
        Run state
      </span>

      <strong
        class="m3-status-value"
        data-m3-run-state
      >
        Paused
      </strong>
    </article>

    <button
      class="m3-status-card m3-control-button"
      type="button"
      data-m3-play
      aria-label="Play simulation"
    >
      <span class="m3-status-key">
        Control
      </span>

      <strong class="m3-status-value">
        Play
      </strong>
    </button>

    <button
      class="m3-status-card m3-control-button"
      type="button"
      data-m3-pause
      aria-label="Pause simulation"
    >
      <span class="m3-status-key">
        Control
      </span>

      <strong class="m3-status-value">
        Pause
      </strong>
    </button>

    <button
      class="m3-status-card m3-control-button"
      type="button"
      data-m3-step
      aria-label="Advance exactly one simulation tick"
    >
      <span class="m3-status-key">
        Control
      </span>

      <strong class="m3-status-value">
        Step
      </strong>
    </button>

    <button
      class="m3-status-card m3-control-button"
      type="button"
      data-m3-reset
      aria-label="Reset to the predefined M3 initial state"
    >
      <span class="m3-status-key">
        Control
      </span>

      <strong class="m3-status-value">
        Reset
      </strong>
    </button>
  `;

  habitatPanel.insertBefore(
    controls,
    habitat,
  );

  const playButton =
    requireButton(
      controls,
      "[data-m3-play]",
    );

  const pauseButton =
    requireButton(
      controls,
      "[data-m3-pause]",
    );

  const stepButton =
    requireButton(
      controls,
      "[data-m3-step]",
    );

  const resetButton =
    requireButton(
      controls,
      "[data-m3-reset]",
    );

  playButton.addEventListener(
    "click",
    actions.onPlay,
  );

  pauseButton.addEventListener(
    "click",
    actions.onPause,
  );

  stepButton.addEventListener(
    "click",
    actions.onStep,
  );

  resetButton.addEventListener(
    "click",
    actions.onReset,
  );

  const phaseBadge =
    requireElement(
      root,
      ".m3-phase-badge",
    );

  phaseBadge.textContent =
    "M3.9B2";

  const footer =
    requireElement(
      root,
      ".m3-footer",
    );

  footer.textContent =
    "M3.9B2 renders the real M3 simulation. Controls execute Play/Pause/Step/Reset only; the browser never selects a Creature action, sets neural activation or supplies coordinates to cognition.";

  const view:
    M3ControlView = {
      setMode: (
        mode,
      ) => {
        setText(
          controls,
          "[data-m3-run-state]",
          modeToLabel(
            mode,
          ),
        );

        playButton.disabled =
          mode !==
          "paused";

        pauseButton.disabled =
          mode !==
          "playing";

        stepButton.disabled =
          mode ===
            "playing" ||
          mode ===
            "complete";

        /*
         * Reset remains available while
         * paused, playing or complete.
         */
        resetButton.disabled =
          false;
      },
    };

  view.setMode(
    "paused",
  );

  return view;
}

function modeToLabel(
  mode:
    M3ControllerMode,
): string {
  switch (mode) {
    case "paused":
      return "Paused";

    case "playing":
      return "Playing";

    case "complete":
      return "Complete";
  }
}

function requireButton(
  root:
    HTMLElement,

  selector:
    string,
): HTMLButtonElement {
  const button =
    root.querySelector<HTMLButtonElement>(
      selector,
    );

  if (
    button ===
    null
  ) {
    throw new Error(
      `M3 controls could not find ${selector}.`,
    );
  }

  return button;
}

function requireElement(
  root:
    HTMLElement,

  selector:
    string,
): HTMLElement {
  const element =
    root.querySelector<HTMLElement>(
      selector,
    );

  if (
    element ===
    null
  ) {
    throw new Error(
      `M3 controls could not find ${selector}.`,
    );
  }

  return element;
}

function setText(
  root:
    HTMLElement,

  selector:
    string,

  value:
    string,
): void {
  requireElement(
    root,
    selector,
  ).textContent =
    value;
}
