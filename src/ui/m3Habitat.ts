import type {
  M3PresentationModel,
} from "../rendering/m3Presentation.js";

import type {
  M3PlayerWorldPosition,
} from "../simulation/core/m3PlayerWorld.js";

import {
  m3ViewportFractionToWorldPosition,
  worldXToViewportPercent,
  worldYToViewportPercent,
} from "./m3Viewport.js";

export interface M3HabitatActions {
  /*
   * The renderer converts a tap/click into a
   * clamped authoritative world position and
   * hands it upward.
   *
   * This module never places food itself; it
   * only reports player intent. It supplies no
   * information to Creature cognition.
   */
  readonly onSelectWorldPosition:
    (
      position:
        M3PlayerWorldPosition,
    ) => void;
}

/*
 * M3 BROWSER RENDERER
 *
 * This renderer accepts only the presentation
 * model plus a narrow player-intent callback.
 *
 * It cannot:
 *
 * - advance simulation;
 * - evaluate cognition;
 * - choose an action;
 * - create memories;
 * - move the authoritative Creature;
 * - move the authoritative food;
 * - determine whether food is perceptible
 *   (that already comes from the presentation
 *   model).
 *
 * Anatomy is a temporary 2D presentation pass:
 * a body, a front/head region with eyes, and a
 * tail/crest silhouette feature, all rotated as
 * one rigid group by
 * presentationModel.creature.facingDirection.
 * Nothing here invents a heading; when facing
 * is null the directional head/tail/crest
 * anatomy is hidden (see m3.css) and the body
 * renders as a direction-neutral symmetric
 * silhouette rather than visually pointing
 * along any world direction.
 */
export function mountM3Habitat(
  root:
    HTMLElement,

  model:
    M3PresentationModel,

  actions:
    M3HabitatActions,
): void {
  root.innerHTML = `
    <main class="m3-shell">
      <header class="m3-header">
        <div>
          <p class="m3-eyebrow">
            Creature Life
          </p>

          <h1>
            M3 Embodiment
          </h1>

          <p class="m3-subtitle">
            The real M3 acquisition simulation,
            rendered without browser-side
            cognition.
          </p>
        </div>

        <div
          class="m3-phase-badge"
          aria-label="Current development phase"
        >
          M3.9B2
        </div>
      </header>

      <section
        class="m3-habitat-panel"
        aria-labelledby="m3-habitat-title"
      >
        <div class="m3-section-heading">
          <div>
            <p class="m3-section-label">
              Habitat
            </p>

            <h2 id="m3-habitat-title">
              Creature-1
            </h2>
          </div>

          <p
            class="m3-tick-readout"
            data-m3-tick
          ></p>
        </div>

        <div
          class="m3-habitat"
          role="img"
          aria-label="Creature Life M3 habitat"
          data-m3-habitat
        >
          <div
            class="m3-world-grid"
            aria-hidden="true"
          ></div>

          <div
            data-m3-sensory-screen
            aria-label="Non-solid sensory occluder"
          ></div>

          <div
            class="m3-food"
            data-m3-food
            aria-label="Food"
          >
            <span
              class="m3-food-core"
              aria-hidden="true"
            ></span>
          </div>

          <div
            class="m3-creature"
            data-m3-creature
            data-facing="unknown"
            data-motion="stationary"
            data-activity="idle"
            aria-label="Creature-1"
          >
            <span
              class="m3-creature-tail"
              aria-hidden="true"
            ></span>

            <span
              class="m3-creature-crest"
              aria-hidden="true"
            ></span>

            <span
              class="m3-creature-body"
              aria-hidden="true"
            ></span>

            <span
              class="m3-creature-head"
              aria-hidden="true"
            >
              <span
                class="m3-creature-eye m3-creature-eye--left"
                aria-hidden="true"
              ></span>

              <span
                class="m3-creature-eye m3-creature-eye--right"
                aria-hidden="true"
              ></span>
            </span>
          </div>
        </div>

        <p class="m3-habitat-instruction">
          Tap the habitat to reposition food.
        </p>
      </section>

      <section
        class="m3-status-panel"
        aria-labelledby="m3-status-title"
      >
        <div class="m3-section-heading">
          <div>
            <p class="m3-section-label">
              Current state
            </p>

            <h2 id="m3-status-title">
              Visible facts
            </h2>
          </div>
        </div>

        <div class="m3-status-grid">
          <article class="m3-status-card">
            <span class="m3-status-key">
              Activity
            </span>

            <strong
              class="m3-status-value"
              data-m3-activity
            ></strong>
          </article>

          <article class="m3-status-card">
            <span class="m3-status-key">
              Food
            </span>

            <strong
              class="m3-status-value"
              data-m3-food-status
            ></strong>
          </article>

          <article class="m3-status-card">
            <span class="m3-status-key">
              Food perception
            </span>

            <strong
              class="m3-status-value"
              data-m3-food-perception
            ></strong>
          </article>

          <article class="m3-status-card">
            <span class="m3-status-key">
              Food memory
            </span>

            <strong
              class="m3-status-value"
              data-m3-food-memory
            ></strong>
          </article>

          <article class="m3-status-card">
            <span class="m3-status-key">
              Simulation time
            </span>

            <strong
              class="m3-status-value"
              data-m3-time
            ></strong>
          </article>
        </div>

        <div class="m3-energy-block">
          <div class="m3-energy-heading">
            <span>
              Biological energy
            </span>

            <strong
              data-m3-energy-label
            ></strong>
          </div>

          <div
            class="m3-energy-track"
            role="progressbar"
            aria-label="Creature biological energy"
            aria-valuemin="0"
            aria-valuemax="100"
            data-m3-energy-track
          >
            <div
              class="m3-energy-fill"
              data-m3-energy-fill
            ></div>
          </div>

          <div class="m3-energy-context">
            <span>
              Hunger load
            </span>

            <strong
              data-m3-hunger-label
            ></strong>
          </div>
        </div>
      </section>

      <section
        class="m3-life-history-panel"
        aria-labelledby="m3-life-history-title"
        data-m3-life-history
      ></section>

      <section
        class="m3-learning-check-panel"
        aria-labelledby="m3-learning-check-title"
        data-m3-learning-check
      ></section>

      <footer class="m3-footer">
        M3.9B2 renders the real M3 simulation.
      </footer>
    </main>
  `;

  const habitat =
    requireElement(
      root,
      "[data-m3-habitat]",
    );

  habitat.addEventListener(
    "click",
    (
      pointerEvent,
    ) => {
      const rect =
        habitat.getBoundingClientRect();

      if (
        rect.width <=
          0 ||
        rect.height <=
          0
      ) {
        return;
      }

      const fractionX =
        (
          pointerEvent.clientX -
          rect.left
        ) /
        rect.width;

      const fractionY =
        (
          pointerEvent.clientY -
          rect.top
        ) /
        rect.height;

      const worldPosition =
        m3ViewportFractionToWorldPosition(
          {
            fractionX,
            fractionY,
          },
        );

      actions.onSelectWorldPosition(
        worldPosition,
      );
    },
  );

  const creature =
    requireElement(
      root,
      "[data-m3-creature]",
    );

  const food =
    requireElement(
      root,
      "[data-m3-food]",
    );

  const sensoryScreen =
    requireElement(
      root,
      "[data-m3-sensory-screen]",
    );

  configureSensoryScreen(
    sensoryScreen,
    model.environment
      .sensoryOccluder,
  );

  positionWorldElement(
    creature,
    model.creature.position.x,
    model.creature.position.y,
  );

  positionWorldElement(
    food,
    model.food.position.x,
    model.food.position.y,
  );

  creature.dataset.motion =
    model.creature.motionState;

  creature.dataset.activity =
    model.creature
      .activityState;

  const facing =
    model.creature.facingDirection;

  if (facing === null) {
    creature.dataset.facing =
      "unknown";

    creature.style.removeProperty(
      "--m3-facing-angle",
    );
  } else {
    creature.dataset.facing =
      "known";

    /*
     * Simulation Y increases upward because
     * the habitat uses CSS bottom positioning.
     *
     * CSS rotation uses the opposite visible
     * sign for this coordinate convention.
     */
    const facingAngle =
      -Math.atan2(
        facing.y,
        facing.x,
      );

    creature.style.setProperty(
      "--m3-facing-angle",
      `${facingAngle}rad`,
    );
  }

  creature.setAttribute(
    "aria-label",
    [
      "Creature-1",
      `at x ${formatNumber(
        model.creature.position.x,
      )}`,
      `y ${formatNumber(
        model.creature.position.y,
      )}`,
      formatActivityState(
        model.creature
          .activityState,
      ),
    ].join(", "),
  );

  food.hidden =
    !model.food.available;

  food.dataset.perception =
    model.environment
      .foodPerceptionState;

  food.setAttribute(
    "aria-label",
    model.food.available
      ? [
          "Food available",
          `at x ${formatNumber(
            model.food.position.x,
          )}`,
          `y ${formatNumber(
            model.food.position.y,
          )}`,
        ].join(", ")
      : "Food consumed",
  );

  const activityLabel =
    formatActivityState(
      model.creature
        .activityState,
    );

  setText(
    root,
    "[data-m3-tick]",
    `Tick ${model.tickIndex}`,
  );

  setText(
    root,
    "[data-m3-activity]",
    activityLabel,
  );

  setText(
    root,
    "[data-m3-food-status]",
    model.food.available
      ? "Available"
      : "Consumed",
  );

  setText(
    root,
    "[data-m3-food-perception]",
    formatFoodPerceptionState(
      model.environment
        .foodPerceptionState,
    ),
  );

  setText(
    root,
    "[data-m3-food-memory]",
    formatFoodMemoryState(
      model.environment
        .foodMemoryState,
    ),
  );

  setText(
    root,
    "[data-m3-time]",
    `${formatNumber(
      model.simulationTimeSeconds,
    )} s`,
  );

  setText(
    root,
    "[data-m3-energy-label]",
    `${formatNumber(
      model.creature.energy,
    )} / ${formatNumber(
      model.creature.maxEnergy,
    )}`,
  );

  const energyPercent =
    clamp(
      model.creature.energyFraction,
      0,
      1,
    ) *
    100;

  const hungerPercent =
    clamp(
      model.creature.hungerFraction,
      0,
      1,
    ) *
    100;

  setText(
    root,
    "[data-m3-hunger-label]",
    `${hungerPercent.toFixed(
      0,
    )}%`,
  );

  const energyFill =
    requireElement(
      root,
      "[data-m3-energy-fill]",
    );

  energyFill.style.width =
    `${energyPercent}%`;

  const energyTrack =
    requireElement(
      root,
      "[data-m3-energy-track]",
    );

  energyTrack.setAttribute(
    "aria-valuenow",
    energyPercent.toFixed(1),
  );
}

function configureSensoryScreen(
  element:
    HTMLElement,

  occluder:
    M3PresentationModel[
      "environment"
    ]["sensoryOccluder"],
): void {
  const bottomPercent =
    worldYToViewportPercent(
      occluder.minY,
    );

  const topPercent =
    worldYToViewportPercent(
      occluder.maxY,
    );

  const heightPercent =
    Math.max(
      0,
      topPercent -
      bottomPercent,
    );

  element.dataset.active =
    occluder.active
      ? "true"
      : "false";

  element.style.left =
    `${worldXToViewportPercent(
      occluder.x,
    )}%`;

  element.style.bottom =
    `${bottomPercent}%`;

  element.style.height =
    `${heightPercent}%`;

  element.setAttribute(
    "aria-label",
    occluder.active
      ? "Active non-solid sensory occluder blocking the current food sight line"
      : "Inactive non-solid sensory occluder",
  );
}

function formatActivityState(
  activity:
    M3PresentationModel[
      "creature"
    ]["activityState"],
): string {
  switch (activity) {
    case "idle":
      return "Idle";

    case "exploring":
      return "Exploring";

    case "seeking":
      return "Seeking";

    case "eating":
      return "Eating";
  }
}

function formatFoodPerceptionState(
  state:
    M3PresentationModel[
      "environment"
    ]["foodPerceptionState"],
): string {
  switch (state) {
    case "visible":
      return "Visible";

    case "occluded":
      return "Occluded";

    case "out-of-range":
      return "Out of range";

    case "consumed":
      return "Consumed";
  }
}

function formatFoodMemoryState(
  state:
    M3PresentationModel[
      "environment"
    ]["foodMemoryState"],
): string {
  switch (state) {
    case "none":
      return "None";

    case "active":
      return "Active";

    case "decayed":
      return "Decayed";
  }
}

function positionWorldElement(
  element:
    HTMLElement,

  x:
    number,

  y:
    number,
): void {
  element.style.left =
    `${worldXToViewportPercent(
      x,
    )}%`;

  element.style.bottom =
    `${worldYToViewportPercent(
      y,
    )}%`;
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
      `M3 renderer could not find ${selector}.`,
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

function formatNumber(
  value:
    number,
): string {
  return value.toFixed(2);
}

function clamp(
  value:
    number,

  minimum:
    number,

  maximum:
    number,
): number {
  return Math.min(
    maximum,
    Math.max(
      minimum,
      value,
    ),
  );
}
