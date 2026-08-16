import type {
  V0ControllerMode,
} from "./v0Controller.js";

export interface V0ControlActions {
  readonly onPlay:
    () => void;

  readonly onPause:
    () => void;

  readonly onStep:
    () => void;
}

export interface V0ControlView {
  setMode(
    mode:
      V0ControllerMode,
  ): void;
}

/*
 * V0.3 CONTROL PRESENTATION
 *
 * These controls emit only application
 * execution intent:
 *
 * - Play;
 * - Pause;
 * - Step.
 *
 * They have no interface for:
 *
 * - SEEK;
 * - MOVE;
 * - EAT;
 * - food memory;
 * - neural activation;
 * - Creature coordinates.
 */
export function mountV0Controls(
  root:
    HTMLElement,

  actions:
    V0ControlActions,
): V0ControlView {
  const habitatPanel =
    requireElement(
      root,
      ".v0-habitat-panel",
    );

  const habitat =
    requireElement(
      root,
      ".v0-habitat",
    );

  const controls =
    document.createElement(
      "div",
    );

  /*
   * Reuse the responsive V0.2 card layout.
   * No new CSS is required for the functional
   * controller phase.
   */
  controls.className =
    "v0-status-grid";

  controls.style.marginBottom =
    "14px";

  controls.setAttribute(
    "aria-label",
    "Simulation controls",
  );

  controls.innerHTML = `
    <article class="v0-status-card">
      <span class="v0-status-key">
        Run state
      </span>

      <strong
        class="v0-status-value"
        data-v0-run-state
      >
        Paused
      </strong>
    </article>

    <button
      class="v0-status-card"
      type="button"
      data-v0-play
      aria-label="Play simulation"
    >
      <span class="v0-status-key">
        Control
      </span>

      <strong class="v0-status-value">
        Play
      </strong>
    </button>

    <button
      class="v0-status-card"
      type="button"
      data-v0-pause
      aria-label="Pause simulation"
    >
      <span class="v0-status-key">
        Control
      </span>

      <strong class="v0-status-value">
        Pause
      </strong>
    </button>

    <button
      class="v0-status-card"
      type="button"
      data-v0-step
      aria-label="Advance exactly one simulation tick"
    >
      <span class="v0-status-key">
        Control
      </span>

      <strong class="v0-status-value">
        Step
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
      "[data-v0-play]",
    );

  const pauseButton =
    requireButton(
      controls,
      "[data-v0-pause]",
    );

  const stepButton =
    requireButton(
      controls,
      "[data-v0-step]",
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

  const phaseBadge =
    requireElement(
      root,
      ".v0-phase-badge",
    );

  phaseBadge.textContent =
    "V0.3";

  const footer =
    requireElement(
      root,
      ".v0-footer",
    );

  footer.textContent =
    "V0.3 controls request fixed authoritative simulation ticks. Browser timing does not supply cognition with a variable delta.";

  const view:
    V0ControlView = {
      setMode: (
        mode,
      ) => {
        setText(
          controls,
          "[data-v0-run-state]",
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
      },
    };

  view.setMode(
    "paused",
  );

  return view;
}

function modeToLabel(
  mode:
    V0ControllerMode,
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

  if (button === null) {
    throw new Error(
      `V0 controls could not find ${selector}.`,
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

  if (element === null) {
    throw new Error(
      `V0 controls could not find ${selector}.`,
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