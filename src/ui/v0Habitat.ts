import type {
  V0PresentationModel,
  V0ScenarioContext,
} from "../rendering/v0Presentation.js";

/*
 * The accepted prototype episode currently
 * operates inside the 0..10 movement space.
 *
 * These values configure only the visible
 * camera transform.
 *
 * They are not supplied to Creature
 * cognition.
 */
export const V0_VIEW_WORLD_MIN =
  0;

export const V0_VIEW_WORLD_MAX =
  10;

/*
 * A small screen-space margin keeps entities
 * centred on the world boundaries from being
 * visually clipped.
 *
 * This is presentation geometry only.
 */
export const V0_VIEW_PADDING_PERCENT =
  7;

export function worldCoordinateToViewportPercent(
  value:
    number,
): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(
      "V0 viewport coordinate must be finite.",
    );
  }

  const worldSpan =
    V0_VIEW_WORLD_MAX -
    V0_VIEW_WORLD_MIN;

  const normalized =
    (
      value -
      V0_VIEW_WORLD_MIN
    ) /
    worldSpan;

  const usablePercent =
    100 -
    V0_VIEW_PADDING_PERCENT *
      2;

  return (
    V0_VIEW_PADDING_PERCENT +
    normalized *
      usablePercent
  );
}

/*
 * V0 BROWSER RENDERER
 *
 * This renderer accepts only the
 * presentation model.
 *
 * It cannot:
 *
 * - advance simulation;
 * - inspect M1EpisodeState;
 * - evaluate cognition;
 * - create memories;
 * - choose actions;
 * - move the authoritative Creature;
 * - determine whether food is perceptible.
 *
 * V0.6 adds only legibility cues derived from
 * genuine presentation facts.
 */
export function mountV0Habitat(
  root:
    HTMLElement,

  model:
    V0PresentationModel,
): void {
  root.innerHTML = `
    <main class="v0-shell">
      <header class="v0-header">
        <div>
          <p class="v0-eyebrow">
            Creature Life
          </p>

          <h1>
            V0 Embodiment
          </h1>

          <p class="v0-subtitle">
            Authoritative simulation state,
            rendered without browser-side cognition.
          </p>
        </div>

        <div
          class="v0-phase-badge"
          aria-label="Current development phase"
        >
          V0.6
        </div>
      </header>

      <section
        class="v0-habitat-panel"
        aria-labelledby="v0-habitat-title"
      >
        <div class="v0-section-heading">
          <div>
            <p class="v0-section-label">
              Habitat
            </p>

            <h2 id="v0-habitat-title">
              Creature-1
            </h2>
          </div>

          <p
            class="v0-tick-readout"
            data-v0-tick
          ></p>
        </div>

        <div
          class="v0-habitat"
          role="img"
          aria-label="Creature Life prototype habitat"
          data-v0-scenario-context
        >
          <div
            class="v0-world-grid"
            aria-hidden="true"
          ></div>

          <div
            class="
              v0-habitat-context
              v0-habitat-context--scenario
            "
            data-v0-scenario-label
          ></div>

          <div
            class="
              v0-habitat-context
              v0-habitat-context--activity
            "
            data-v0-activity-label
          ></div>

          <div
            data-v0-sensory-screen
            aria-label="Non-solid sensory screen"
          ></div>

          <div
            class="v0-food"
            data-v0-food
            aria-label="Food"
          >
            <span
              class="v0-food-core"
              aria-hidden="true"
            ></span>
          </div>

          <div
            class="v0-creature"
            data-v0-creature
            data-facing="unknown"
            data-motion="stationary"
            data-activity="idle"
            aria-label="Creature-1"
          >
            <span
              class="v0-creature-core"
              aria-hidden="true"
            ></span>

            <span
              class="v0-creature-facing-mark"
              aria-hidden="true"
            ></span>
          </div>
        </div>

        <p class="v0-habitat-note">
          Activity cues represent genuine physical
          state changes. The sensory screen affects
          sight only and remains non-solid.
        </p>
      </section>

      <section
        class="v0-status-panel"
        aria-labelledby="v0-status-title"
      >
        <div class="v0-section-heading">
          <div>
            <p class="v0-section-label">
              Current state
            </p>

            <h2 id="v0-status-title">
              Visible facts
            </h2>
          </div>
        </div>

        <div class="v0-status-grid">
          <article class="v0-status-card">
            <span class="v0-status-key">
              Activity
            </span>

            <strong
              class="v0-status-value"
              data-v0-activity
            ></strong>
          </article>

          <article class="v0-status-card">
            <span class="v0-status-key">
              Scenario context
            </span>

            <strong
              class="v0-status-value"
              data-v0-context
            ></strong>
          </article>

          <article class="v0-status-card">
            <span class="v0-status-key">
              Food
            </span>

            <strong
              class="v0-status-value"
              data-v0-food-status
            ></strong>
          </article>

          <article class="v0-status-card">
            <span class="v0-status-key">
              Food visibility
            </span>

            <strong
              class="v0-status-value"
              data-v0-visibility
            ></strong>
          </article>

          <article class="v0-status-card">
            <span class="v0-status-key">
              Simulation time
            </span>

            <strong
              class="v0-status-value"
              data-v0-time
            ></strong>
          </article>
        </div>

        <div class="v0-energy-block">
          <div class="v0-energy-heading">
            <span>
              Biological energy
            </span>

            <strong
              data-v0-energy-label
            ></strong>
          </div>

          <div
            class="v0-energy-track"
            role="progressbar"
            aria-label="Creature biological energy"
            aria-valuemin="0"
            aria-valuemax="100"
            data-v0-energy-track
          >
            <div
              class="v0-energy-fill"
              data-v0-energy-fill
            ></div>
          </div>

          <div class="v0-energy-context">
            <span>
              Hunger load
            </span>

            <strong
              data-v0-hunger-label
            ></strong>
          </div>
        </div>
      </section>

      <footer class="v0-footer">
        V0.6 adds presentation-only cues for genuine
        activity, hunger and scenario context.
      </footer>
    </main>
  `;

  const habitat =
    requireElement(
      root,
      ".v0-habitat",
    );

  habitat.dataset
    .v0ScenarioContext =
    model.environment
      .scenarioContext;

  const creature =
    requireElement(
      root,
      "[data-v0-creature]",
    );

  const food =
    requireElement(
      root,
      "[data-v0-food]",
    );

  const sensoryScreen =
    requireElement(
      root,
      "[data-v0-sensory-screen]",
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
      "--v0-facing-angle",
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
      "--v0-facing-angle",
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

  const contextLabel =
    formatScenarioContext(
      model.environment
        .scenarioContext,
    );

  const foodVisibilityLabel =
    !model.food.available
      ? "No food available"
      : model.environment
          .foodOccludedForCreature
        ? "Occluded from Creature"
        : "Visible to Creature";

  setText(
    root,
    "[data-v0-tick]",
    `Tick ${model.tickIndex}`,
  );

  setText(
    root,
    "[data-v0-activity-label]",
    activityLabel,
  );

  setText(
    root,
    "[data-v0-scenario-label]",
    contextLabel,
  );

  setText(
    root,
    "[data-v0-activity]",
    activityLabel,
  );

  setText(
    root,
    "[data-v0-context]",
    contextLabel,
  );

  setText(
    root,
    "[data-v0-food-status]",
    model.food.available
      ? "Available"
      : "Consumed",
  );

  setText(
    root,
    "[data-v0-visibility]",
    foodVisibilityLabel,
  );

  setText(
    root,
    "[data-v0-time]",
    `${formatNumber(
      model.simulationTimeSeconds,
    )} s`,
  );

  setText(
    root,
    "[data-v0-energy-label]",
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
    "[data-v0-hunger-label]",
    `${hungerPercent.toFixed(
      0,
    )}%`,
  );

  const energyFill =
    requireElement(
      root,
      "[data-v0-energy-fill]",
    );

  energyFill.style.width =
    `${energyPercent}%`;

  const energyTrack =
    requireElement(
      root,
      "[data-v0-energy-track]",
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
    V0PresentationModel[
      "environment"
    ]["sensoryOccluder"],
): void {
  const bottomPercent =
    worldCoordinateToViewportPercent(
      occluder.minY,
    );

  const topPercent =
    worldCoordinateToViewportPercent(
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

  element.style.position =
    "absolute";

  element.style.zIndex =
    "1";

  element.style.left =
    `${worldCoordinateToViewportPercent(
      occluder.x,
    )}%`;

  element.style.bottom =
    `${bottomPercent}%`;

  element.style.width =
    "18px";

  element.style.height =
    `${heightPercent}%`;

  element.style.transform =
    "translateX(-50%)";

  element.style.borderRadius =
    "999px";

  element.style.pointerEvents =
    "none";

  element.style.transition =
    "none";

  if (occluder.active) {
    element.style.opacity =
      "1";

    element.style.border =
      "1px solid rgba(65, 91, 98, 0.48)";

    element.style.background =
      "repeating-linear-gradient(135deg, rgba(89, 126, 136, 0.30) 0 6px, rgba(132, 163, 169, 0.16) 6px 12px)";

    element.style.boxShadow =
      "0 0 0 4px rgba(91, 124, 132, 0.08)";

    element.setAttribute(
      "aria-label",
      "Active non-solid sensory screen blocking the current food sight line",
    );
  } else {
    element.style.opacity =
      "0.45";

    element.style.border =
      "1px dashed rgba(65, 91, 98, 0.45)";

    element.style.background =
      "rgba(89, 126, 136, 0.06)";

    element.style.boxShadow =
      "none";

    element.setAttribute(
      "aria-label",
      "Inactive non-solid sensory screen",
    );
  }
}

function formatActivityState(
  activity:
    V0PresentationModel[
      "creature"
    ]["activityState"],
): string {
  switch (activity) {
    case "idle":
      return "Idle";

    case "locomotion":
      return "Locomotion";

    case "eating":
      return "Eating";
  }
}

function formatScenarioContext(
  context:
    V0ScenarioContext,
): string {
  switch (context) {
    case "direct-perception":
      return "Direct sight";

    case "memory-challenge":
      return "Memory challenge · sight blocked";

    case "direct-perception-restored":
      return "Direct sight restored";

    case "food-consumed":
      return "Food consumed";
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
    `${worldCoordinateToViewportPercent(
      x,
    )}%`;

  element.style.bottom =
    `${worldCoordinateToViewportPercent(
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
      `V0 renderer could not find ${selector}.`,
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