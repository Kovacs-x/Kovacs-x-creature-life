import type {
  M3LifeHistory,
  M3LifeHistoryEntry,
} from "../simulation/core/m3LifeHistory.js";

/*
 * M3 LIFE HISTORY PRESENTATION
 *
 * This renders the committed M3LifeHistory
 * entries as a small player-readable
 * biography.
 *
 * It receives only already-recorded history
 * state.
 *
 * It cannot:
 *
 * - advance simulation;
 * - create history entries;
 * - influence cognition, memory, action
 *   competition, movement or reward.
 *
 * pendingPlayerFoodEvent is deliberately never
 * displayed here. It is presentation-side
 * causal bookkeeping, not a Creature memory or
 * a biography entry in its own right.
 */
export function mountM3LifeHistory(
  root:
    HTMLElement,

  history:
    M3LifeHistory,
): void {
  const section =
    requireElement(
      root,
      "[data-m3-life-history]",
    );

  section.innerHTML =
    "";

  const heading =
    document.createElement(
      "div",
    );

  heading.className =
    "m3-section-heading";

  heading.innerHTML = `
    <div>
      <p class="m3-section-label">
        Biography
      </p>

      <h2>
        Life so far
      </h2>
    </div>
  `;

  section.appendChild(
    heading,
  );

  if (
    history.entries.length ===
    0
  ) {
    const empty =
      document.createElement(
        "p",
      );

    empty.className =
      "m3-life-history-empty";

    empty.textContent =
      "No notable life events recorded yet.";

    section.appendChild(
      empty,
    );

    return;
  }

  const list =
    document.createElement(
      "ul",
    );

  list.className =
    "m3-life-history-list";

  for (
    const entry of
    history.entries
  ) {
    list.appendChild(
      renderEntry(
        entry,
      ),
    );
  }

  section.appendChild(
    list,
  );
}

function renderEntry(
  entry:
    M3LifeHistoryEntry,
): HTMLElement {
  const item =
    document.createElement(
      "li",
    );

  item.className =
    "m3-life-history-entry";

  const time =
    document.createElement(
      "span",
    );

  time.className =
    "m3-life-history-time";

  time.textContent =
    `T+${entry.simulationTimeSeconds.toFixed(0)}s`;

  const description =
    document.createElement(
      "span",
    );

  description.className =
    "m3-life-history-description";

  description.textContent =
    entry.description;

  item.appendChild(
    time,
  );

  item.appendChild(
    description,
  );

  return item;
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
      `M3 life history view could not find ${selector}.`,
    );
  }

  return element;
}
