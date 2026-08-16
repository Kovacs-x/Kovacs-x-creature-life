import type {
  V0CausalHistory,
  V0CausalHistoryEntry,
} from "./v0History.js";

import {
  exportV0CausalHistoryJson,
} from "./v0History.js";

export interface V0InspectorFacts {
  readonly tick:
    string;

  readonly simulationTime:
    string;

  readonly creaturePosition:
    string;

  readonly energy:
    string;

  readonly foodPosition:
    string;

  readonly foodAvailability:
    string;

  readonly foodOcclusion:
    string;

  readonly directPerception:
    string;

  readonly activeMemory:
    string;

  readonly rememberedDirection:
    string;

  readonly memoryAge:
    string;

  readonly memoryConfidence:
    string;

  readonly recallSignal:
    string;

  readonly directFoodActivation:
    string;

  readonly rememberedFoodActivation:
    string;

  readonly idleActivation:
    string;

  readonly seekActivation:
    string;

  readonly eatActivation:
    string;

  readonly selectedAction:
    string;

  readonly movementSource:
    string;

  readonly movementDirection:
    string;

  readonly memoryTransitions:
    string;

  readonly eatingResult:
    string;

  readonly biologicalReward:
    string;

  readonly learningChanges:
    string;
}

/*
 * PURE INSPECTOR TRANSFORMATION
 *
 * recorded V0 causal history entry
 *      ↓
 * deterministic display strings
 *
 * This function does not infer motives and
 * does not inspect live simulation state.
 */
export function deriveV0InspectorFacts(
  entry:
    V0CausalHistoryEntry,
): V0InspectorFacts {
  const telemetry =
    entry.telemetry;

  const memory =
    telemetry.memory.after;

  const idleActivation =
    getActionActivation(
      entry,
      "idle",
    );

  const seekActivation =
    getActionActivation(
      entry,
      "seek",
    );

  const eatActivation =
    getActionActivation(
      entry,
      "eat",
    );

  return {
    tick:
      `${entry.tick}`,

    simulationTime:
      `${formatNumber(
        telemetry
          .simulationTimeAfterSeconds,
      )} s`,

    creaturePosition:
      formatVector(
        entry.creature
          .positionAfter,
      ),

    energy:
      `${formatNumber(
        entry.creature.energyAfter,
      )} / ${formatNumber(
        entry.creature.maxEnergy,
      )}`,

    foodPosition:
      formatVector(
        entry.food
          .positionAfter,
      ),

    foodAvailability:
      entry.food.availableAfter
        ? "Available"
        : "Consumed",

    foodOcclusion:
      telemetry.foodOccluded
        ? "Occluded"
        : "Not occluded",

    directPerception:
      telemetry.directFoodSignal ===
      null
        ? "None"
        : [
            "Present",
            `strength ${formatNumber(
              telemetry
                .directFoodSignal
                .strength,
            )}`,
            `direction ${formatVector(
              {
                x:
                  telemetry
                    .directFoodSignal
                    .directionX,

                y:
                  telemetry
                    .directFoodSignal
                    .directionY,
              },
            )}`,
          ].join(" · "),

    activeMemory:
      memory === null
        ? "None"
        : "Active",

    rememberedDirection:
      memory === null
        ? "None"
        : formatVector(
            {
              x:
                memory
                  .rememberedDirectionX,

              y:
                memory
                  .rememberedDirectionY,
            },
          ),

    memoryAge:
      memory === null
        ? "None"
        : `${formatNumber(
            memory.ageSeconds,
          )} s`,

    memoryConfidence:
      memory === null
        ? "None"
        : formatNumber(
            memory.confidence,
          ),

    recallSignal:
      telemetry.recallSignal ===
      null
        ? "None"
        : [
            "Present",
            `confidence ${formatNumber(
              telemetry
                .recallSignal
                .confidence,
            )}`,
            `direction ${formatVector(
              {
                x:
                  telemetry
                    .recallSignal
                    .directionX,

                y:
                  telemetry
                    .recallSignal
                    .directionY,
              },
            )}`,
          ].join(" · "),

    directFoodActivation:
      formatNumber(
        telemetry
          .directFoodInputActivation,
      ),

    rememberedFoodActivation:
      formatNumber(
        telemetry
          .rememberedFoodInputActivation,
      ),

    idleActivation:
      formatNumber(
        idleActivation,
      ),

    seekActivation:
      formatNumber(
        seekActivation,
      ),

    eatActivation:
      formatNumber(
        eatActivation,
      ),

    selectedAction:
      telemetry
        .selectedActionId
        .toUpperCase(),

    movementSource:
      formatMovementSource(
        telemetry
          .movementDirectionSource,
      ),

    movementDirection:
      telemetry.movementDirection ===
      null
        ? "None"
        : formatVector(
            telemetry
              .movementDirection,
          ),

    memoryTransitions:
      formatMemoryTransitions(
        entry,
      ),

    eatingResult:
      entry.ateThisTick
        ? "Eating succeeded"
        : "No eating event",

    biologicalReward:
      formatNumber(
        entry.biologicalReward,
      ),

    learningChanges:
      entry.learningChanges.length ===
      0
        ? "None"
        : `${entry.learningChanges.length} connection weight${entry.learningChanges.length === 1 ? "" : "s"} changed`,
  };
}

/*
 * Developer-facing Why / History inspector.
 *
 * The inspector receives only bounded
 * diagnostic history.
 *
 * It cannot:
 *
 * - advance simulation;
 * - modify Creature state;
 * - modify memory;
 * - set neural activations;
 * - choose actions;
 * - issue movement.
 */
export function mountV0Inspector(
  root:
    HTMLElement,

  history:
    V0CausalHistory,
): void {
  const footer =
    requireElement(
      root,
      ".v0-footer",
    );

  const parent =
    footer.parentElement;

  if (parent === null) {
    throw new Error(
      "V0 inspector could not find the footer parent.",
    );
  }

  const section =
    document.createElement(
      "section",
    );

  section.setAttribute(
    "aria-label",
    "Developer Why and History inspector",
  );

  section.style.marginTop =
    "20px";

  section.style.padding =
    "18px";

  section.style.border =
    "1px solid rgba(51, 64, 57, 0.22)";

  section.style.borderRadius =
    "20px";

  section.style.background =
    "rgba(35, 42, 39, 0.96)";

  section.style.color =
    "#f4f2e8";

  section.style.boxShadow =
    "0 16px 40px rgba(32, 39, 34, 0.10)";

  const details =
    document.createElement(
      "details",
    );

  const summary =
    document.createElement(
      "summary",
    );

  summary.textContent =
    history.entries.length ===
    0
      ? "Why / History — no recorded ticks yet"
      : `Why / History — ${history.entries.length} recorded tick${history.entries.length === 1 ? "" : "s"}`;

  summary.style.cursor =
    "pointer";

  summary.style.fontWeight =
    "800";

  summary.style.fontSize =
    "1.05rem";

  summary.style.letterSpacing =
    "0.02em";

  details.appendChild(
    summary,
  );

  const body =
    document.createElement(
      "div",
    );

  body.style.marginTop =
    "16px";

  details.appendChild(
    body,
  );

  section.appendChild(
    details,
  );

  parent.insertBefore(
    section,
    footer,
  );

  if (
    history.entries.length ===
    0
  ) {
    const empty =
      document.createElement(
        "p",
      );

    empty.textContent =
      "Advance the simulation to record causal evidence. This history is developer diagnostic state, not Creature memory.";

    empty.style.margin =
      "12px 0 0";

    empty.style.opacity =
      "0.82";

    body.appendChild(
      empty,
    );

    return;
  }

  const toolbar =
    document.createElement(
      "div",
    );

  toolbar.style.display =
    "flex";

  toolbar.style.flexWrap =
    "wrap";

  toolbar.style.gap =
    "8px";

  toolbar.style.alignItems =
    "center";

  toolbar.style.marginBottom =
    "14px";

  const exportButton =
    document.createElement(
      "button",
    );

  exportButton.type =
    "button";

  exportButton.textContent =
    "Export JSON";

  styleInspectorButton(
    exportButton,
  );

  exportButton.addEventListener(
    "click",
    () => {
      downloadV0HistoryJson(
        history,
      );
    },
  );

  toolbar.appendChild(
    exportButton,
  );

  const tickLabel =
    document.createElement(
      "span",
    );

  tickLabel.textContent =
    "Inspect tick:";

  tickLabel.style.marginLeft =
    "6px";

  tickLabel.style.fontSize =
    "0.85rem";

  tickLabel.style.opacity =
    "0.72";

  toolbar.appendChild(
    tickLabel,
  );

  const newestFirst =
    [
      ...history.entries,
    ].reverse();

  const tickButtons:
    HTMLButtonElement[] =
      [];

  const content =
    document.createElement(
      "div",
    );

  for (
    const entry of
    newestFirst
  ) {
    const button =
      document.createElement(
        "button",
      );

    button.type =
      "button";

    button.textContent =
      `${entry.tick}`;

    button.dataset
      .historyTick =
      `${entry.tick}`;

    styleInspectorButton(
      button,
    );

    button.addEventListener(
      "click",
      () => {
        renderEntry(
          content,
          entry,
        );

        selectTickButton(
          tickButtons,
          button,
        );
      },
    );

    tickButtons.push(
      button,
    );

    toolbar.appendChild(
      button,
    );
  }

  body.appendChild(
    toolbar,
  );

  body.appendChild(
    content,
  );

  const latest =
    newestFirst[0];

  if (latest === undefined) {
    throw new Error(
      "V0 inspector history unexpectedly contained no latest entry.",
    );
  }

  renderEntry(
    content,
    latest,
  );

  const latestButton =
    tickButtons[0];

  if (
    latestButton !==
    undefined
  ) {
    selectTickButton(
      tickButtons,
      latestButton,
    );
  }
}

function renderEntry(
  container:
    HTMLElement,

  entry:
    V0CausalHistoryEntry,
): void {
  const facts =
    deriveV0InspectorFacts(
      entry,
    );

  container.innerHTML =
    "";

  const whyHeading =
    document.createElement(
      "h3",
    );

  whyHeading.textContent =
    `Why — Tick ${entry.tick}`;

  whyHeading.style.margin =
    "0 0 10px";

  whyHeading.style.fontSize =
    "1rem";

  container.appendChild(
    whyHeading,
  );

  const whyList =
    document.createElement(
      "ul",
    );

  whyList.style.margin =
    "0 0 18px";

  whyList.style.paddingLeft =
    "20px";

  for (
    const statement of
    entry.why
  ) {
    const item =
      document.createElement(
        "li",
      );

    item.textContent =
      statement;

    item.style.marginBottom =
      "6px";

    whyList.appendChild(
      item,
    );
  }

  container.appendChild(
    whyList,
  );

  const causalHeading =
    document.createElement(
      "h3",
    );

  causalHeading.textContent =
    "Recorded causal facts";

  causalHeading.style.margin =
    "0 0 10px";

  causalHeading.style.fontSize =
    "1rem";

  container.appendChild(
    causalHeading,
  );

  const grid =
    document.createElement(
      "div",
    );

  grid.style.display =
    "grid";

  grid.style.gridTemplateColumns =
    "repeat(auto-fit, minmax(190px, 1fr))";

  grid.style.gap =
    "8px";

  const rows:
    readonly [
      string,
      string,
    ][] =
      [
        [
          "Tick",
          facts.tick,
        ],
        [
          "Simulation time",
          facts.simulationTime,
        ],
        [
          "Creature position",
          facts.creaturePosition,
        ],
        [
          "Biological energy",
          facts.energy,
        ],
        [
          "Food position",
          facts.foodPosition,
        ],
        [
          "Food",
          facts.foodAvailability,
        ],
        [
          "Food occlusion",
          facts.foodOcclusion,
        ],
        [
          "Direct perception",
          facts.directPerception,
        ],
        [
          "Active food memory",
          facts.activeMemory,
        ],
        [
          "Remembered direction",
          facts.rememberedDirection,
        ],
        [
          "Memory age",
          facts.memoryAge,
        ],
        [
          "Memory confidence",
          facts.memoryConfidence,
        ],
        [
          "Recall signal",
          facts.recallSignal,
        ],
        [
          "Direct-food activation",
          facts.directFoodActivation,
        ],
        [
          "Remembered-food activation",
          facts.rememberedFoodActivation,
        ],
        [
          "IDLE activation",
          facts.idleActivation,
        ],
        [
          "SEEK activation",
          facts.seekActivation,
        ],
        [
          "EAT activation",
          facts.eatActivation,
        ],
        [
          "Selected action",
          facts.selectedAction,
        ],
        [
          "Movement source",
          facts.movementSource,
        ],
        [
          "Movement direction",
          facts.movementDirection,
        ],
        [
          "Memory transition",
          facts.memoryTransitions,
        ],
        [
          "Eating result",
          facts.eatingResult,
        ],
        [
          "Biological reward",
          facts.biologicalReward,
        ],
        [
          "Learning",
          facts.learningChanges,
        ],
      ];

  for (
    const [
      label,
      value,
    ] of rows
  ) {
    grid.appendChild(
      createFactCard(
        label,
        value,
      ),
    );
  }

  container.appendChild(
    grid,
  );

  if (
    entry.learningChanges.length >
    0
  ) {
    const learningHeading =
      document.createElement(
        "h3",
      );

    learningHeading.textContent =
      "Weight changes";

    learningHeading.style.margin =
      "18px 0 8px";

    learningHeading.style.fontSize =
      "1rem";

    container.appendChild(
      learningHeading,
    );

    const learningList =
      document.createElement(
        "ul",
      );

    learningList.style.margin =
      "0";

    learningList.style.paddingLeft =
      "20px";

    for (
      const change of
      entry.learningChanges
    ) {
      const item =
        document.createElement(
          "li",
        );

      item.textContent =
        `${change.connectionId}: ${formatNumber(
          change.before,
        )} → ${formatNumber(
          change.after,
        )} (Δ ${formatSignedNumber(
          change.delta,
        )})`;

      learningList.appendChild(
        item,
      );
    }

    container.appendChild(
      learningList,
    );
  }
}

function createFactCard(
  label:
    string,

  value:
    string,
): HTMLElement {
  const card =
    document.createElement(
      "div",
    );

  card.style.padding =
    "10px 12px";

  card.style.border =
    "1px solid rgba(255, 255, 255, 0.12)";

  card.style.borderRadius =
    "12px";

  card.style.background =
    "rgba(255, 255, 255, 0.045)";

  const key =
    document.createElement(
      "div",
    );

  key.textContent =
    label;

  key.style.fontSize =
    "0.72rem";

  key.style.fontWeight =
    "700";

  key.style.textTransform =
    "uppercase";

  key.style.letterSpacing =
    "0.07em";

  key.style.opacity =
    "0.62";

  const fact =
    document.createElement(
      "div",
    );

  fact.textContent =
    value;

  fact.style.marginTop =
    "4px";

  fact.style.fontWeight =
    "650";

  fact.style.overflowWrap =
    "anywhere";

  card.appendChild(
    key,
  );

  card.appendChild(
    fact,
  );

  return card;
}

function selectTickButton(
  buttons:
    readonly HTMLButtonElement[],

  selected:
    HTMLButtonElement,
): void {
  for (
    const button of
    buttons
  ) {
    const isSelected =
      button ===
      selected;

    button.setAttribute(
      "aria-pressed",
      isSelected
        ? "true"
        : "false",
    );

    button.style.opacity =
      isSelected
        ? "1"
        : "0.68";

    button.style.outline =
      isSelected
        ? "2px solid rgba(255, 255, 255, 0.62)"
        : "none";
  }
}

function styleInspectorButton(
  button:
    HTMLButtonElement,
): void {
  button.style.padding =
    "7px 10px";

  button.style.border =
    "1px solid rgba(255, 255, 255, 0.18)";

  button.style.borderRadius =
    "10px";

  button.style.background =
    "rgba(255, 255, 255, 0.08)";

  button.style.color =
    "inherit";

  button.style.font =
    "inherit";

  button.style.fontWeight =
    "700";

  button.style.cursor =
    "pointer";
}

function downloadV0HistoryJson(
  history:
    V0CausalHistory,
): void {
  const json =
    exportV0CausalHistoryJson(
      history,
    );

  const blob =
    new Blob(
      [
        json,
      ],
      {
        type:
          "application/json",
      },
    );

  const url =
    URL.createObjectURL(
      blob,
    );

  const anchor =
    document.createElement(
      "a",
    );

  anchor.href =
    url;

  anchor.download =
    "creature-life-v0-history.json";

  anchor.style.display =
    "none";

  document.body.appendChild(
    anchor,
  );

  anchor.click();

  anchor.remove();

  URL.revokeObjectURL(
    url,
  );
}

function getActionActivation(
  entry:
    V0CausalHistoryEntry,

  actionId:
    "idle" |
    "seek" |
    "eat",
): number {
  const candidate =
    entry.telemetry
      .actionCandidates
      .find(
        (item) =>
          item.actionId ===
          actionId,
      );

  if (
    candidate ===
    undefined
  ) {
    throw new Error(
      `V0 inspector could not find ${actionId} action activation.`,
    );
  }

  return candidate.activation;
}

function formatMovementSource(
  source:
    V0CausalHistoryEntry[
      "telemetry"
    ]["movementDirectionSource"],
): string {
  switch (source) {
    case "direct-perception":
      return "Direct perception";

    case "memory-recall":
      return "Memory recall";

    case null:
      return "None";
  }
}

function formatMemoryTransitions(
  entry:
    V0CausalHistoryEntry,
): string {
  const memory =
    entry.telemetry.memory;

  const transitions:
    string[] =
      [];

  if (memory.encoded) {
    transitions.push(
      "Encoded",
    );
  }

  if (memory.refreshed) {
    transitions.push(
      "Refreshed",
    );
  }

  if (memory.corrected) {
    transitions.push(
      "Corrected",
    );
  }

  if (memory.decayed) {
    transitions.push(
      "Decayed",
    );
  }

  if (memory.expired) {
    transitions.push(
      "Expired",
    );
  }

  return transitions.length ===
    0
    ? "None"
    : transitions.join(
        ", ",
      );
}

function formatVector(
  vector: {
    readonly x:
      number;

    readonly y:
      number;
  },
): string {
  return `(${formatNumber(
    vector.x,
  )}, ${formatNumber(
    vector.y,
  )})`;
}

function formatNumber(
  value:
    number,
): string {
  return value.toFixed(
    3,
  );
}

function formatSignedNumber(
  value:
    number,
): string {
  return value >= 0
    ? `+${formatNumber(
        value,
      )}`
    : formatNumber(
        value,
      );
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
      `V0 inspector could not find ${selector}.`,
    );
  }

  return element;
}