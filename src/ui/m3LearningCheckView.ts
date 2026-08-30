import type {
  M3StandardizedLearningComparison,
} from "../simulation/core/m3Probe.js";

/*
 * M3.11R STANDARDIZED LEARNING CHECK PRESENTATION
 *
 * This renders an already-computed, read-only
 * M3StandardizedLearningComparison.
 *
 * It cannot:
 *
 * - run the comparison itself;
 * - advance simulation;
 * - modify the Creature's brain, biology,
 *   memory, exploration state or RNG;
 * - influence cognition, action competition or
 *   learning.
 *
 * Wording stays strictly factual. It never
 * claims the comparison is guaranteed to differ,
 * and it never attributes intelligence,
 * intent or emotion to either result.
 *
 * DIAGNOSTIC VISIBILITY (M3.11R correction)
 *
 * This is explicitly a developer diagnostic, not
 * ordinary player-facing presentation. M3 human-
 * evaluation Phase 1 requires developer
 * diagnostics to be hidden initially, so this
 * mounts inside a native <details> element that
 * starts collapsed. The observer can reveal it
 * later (Phase 3) with an ordinary disclosure
 * click.
 *
 * Opening/closing is native browser <details>
 * behaviour only: it consumes no RNG, advances no
 * tick, and changes no cognition or simulation
 * state. The caller (m3Main.ts's renderState())
 * rebuilds the surrounding habitat DOM from scratch
 * on every render (mountM3Habitat() resets
 * root.innerHTML before this function runs), so a
 * freshly created <details> element cannot itself
 * remember whether an observer opened it on a
 * previous render. A minimal module-level flag,
 * mirrored onto every newly created element and
 * updated only by the element's own native "toggle"
 * event, is the smallest way to keep an observer's
 * choice to reveal the panel from silently
 * re-collapsing on the next tick. This flag is pure
 * presentation state: it is private to this module,
 * is never read by simulation code, and cannot
 * influence cognition, action competition or
 * learning.
 */
let diagnosticsPanelOpen =
  false;

export function mountM3LearningCheck(
  root:
    HTMLElement,

  comparison:
    M3StandardizedLearningComparison,
): void {
  const section =
    requireElement(
      root,
      "[data-m3-learning-check]",
    );

  section.innerHTML =
    "";

  const details =
    document.createElement(
      "details",
    );

  details.className =
    "m3-learning-check-details";

  details.open =
    diagnosticsPanelOpen;

  details.addEventListener(
    "toggle",
    () => {
      diagnosticsPanelOpen =
        details.open;
    },
  );

  const summary =
    document.createElement(
      "summary",
    );

  summary.className =
    "m3-learning-check-summary";

  summary.textContent =
    "Diagnostics";

  details.appendChild(
    summary,
  );

  const heading =
    document.createElement(
      "div",
    );

  heading.className =
    "m3-section-heading";

  heading.innerHTML = `
    <div>
      <p class="m3-section-label">
        Diagnostic
      </p>

      <h2>
        Standardized learning check
      </h2>
    </div>
  `;

  details.appendChild(
    heading,
  );

  const note =
    document.createElement(
      "p",
    );

  note.className =
    "m3-learning-check-note";

  note.textContent =
    "Compares this Creature's current learned brain against a fresh, untrained equivalent under the same normalized conditions. This does not change the Creature.";

  details.appendChild(
    note,
  );

  const rows =
    document.createElement(
      "div",
    );

  rows.className =
    "m3-learning-check-rows";

  rows.appendChild(
    renderRow(
      "Fresh equivalent",
      formatActionId(
        comparison.freshEquivalent
          .selectedActionId,
      ),
    ),
  );

  rows.appendChild(
    renderRow(
      "Current learned state",
      formatActionId(
        comparison.currentLearned
          .selectedActionId,
      ),
    ),
  );

  rows.appendChild(
    renderRow(
      "Connection weights",
      comparison.connectionWeightsDiffer
        ? "Differ from a fresh brain"
        : "Match a fresh brain",
    ),
  );

  details.appendChild(
    rows,
  );

  section.appendChild(
    details,
  );
}

function renderRow(
  label:
    string,

  value:
    string,
): HTMLElement {
  const row =
    document.createElement(
      "div",
    );

  row.className =
    "m3-learning-check-row";

  const labelElement =
    document.createElement(
      "span",
    );

  labelElement.className =
    "m3-learning-check-row-label";

  labelElement.textContent =
    label;

  const valueElement =
    document.createElement(
      "span",
    );

  valueElement.className =
    "m3-learning-check-row-value";

  valueElement.textContent =
    value;

  row.appendChild(
    labelElement,
  );

  row.appendChild(
    valueElement,
  );

  return row;
}

function formatActionId(
  actionId:
    string,
): string {
  switch (actionId) {
    case "idle":
      return "IDLE";

    case "seek":
      return "SEEK";

    case "eat":
      return "EAT";

    case "explore":
      return "EXPLORE";

    default:
      return actionId.toUpperCase();
  }
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
      `M3 learning check view could not find ${selector}.`,
    );
  }

  return element;
}
