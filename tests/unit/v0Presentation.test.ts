import {
  describe,
  expect,
  it,
} from "vitest";

import {
  deriveV0PresentationModel,
  V0_PRESENTATION_MODEL_SCHEMA_VERSION,
} from "../../src/rendering/v0Presentation.js";

import {
  advanceM1Episode,
  createM1EpisodeState,
} from "../../src/simulation/core/m1Episode.js";

describe(
  "V0.1 presentation contract",
  () => {
    it("derives visible Creature and food state from authoritative simulation state", () => {
      const state =
        createM1EpisodeState(
          {
            learningEnabled:
              false,

            memoryEnabled:
              true,

            foodX:
              3,

            foodOccluded:
              false,
          },
        );

      const model =
        deriveV0PresentationModel(
          state,
        );

      expect(
        model.schemaVersion,
      ).toBe(
        V0_PRESENTATION_MODEL_SCHEMA_VERSION,
      );

      expect(
        model.tickIndex,
      ).toBe(
        state.tickIndex,
      );

      expect(
        model
          .simulationTimeSeconds,
      ).toBe(
        state
          .simulationTimeSeconds,
      );

      /*
       * Presentation position is copied from
       * authoritative simulation position.
       */
      expect(
        model
          .creature
          .position,
      ).toEqual(
        state.position,
      );

      expect(
        model
          .food
          .position,
      ).toEqual(
        state.food.position,
      );

      expect(
        model
          .food
          .consumed,
      ).toBe(
        state.food.consumed,
      );

      expect(
        model
          .food
          .available,
      ).toBe(
        !state.food.consumed,
      );

      expect(
        model
          .environment
          .foodOccludedForCreature,
      ).toBe(false);

      expect(
        model
          .creature
          .energy,
      ).toBe(
        state.hunger.energy,
      );

      expect(
        model
          .creature
          .maxEnergy,
      ).toBe(
        state.hunger.maxEnergy,
      );

      expect(
        model
          .creature
          .energyFraction,
      ).toBeCloseTo(
        state.hunger.energy /
          state.hunger.maxEnergy,
      );

      expect(
        model
          .creature
          .hungerFraction,
      ).toBeCloseTo(
        1 -
          state.hunger.energy /
            state.hunger.maxEnergy,
      );
    });

    it("derives motion and facing only from actual authoritative displacement", () => {
      const before =
        createM1EpisodeState(
          {
            learningEnabled:
              false,

            memoryEnabled:
              false,

            foodX:
              3,

            foodOccluded:
              false,
          },
        );

      const after =
        advanceM1Episode(
          before,
        );

      expect(
        after.position.x,
      ).toBeGreaterThan(
        before.position.x,
      );

      const model =
        deriveV0PresentationModel(
          after,
          before,
        );

      const expectedDeltaX =
        after.position.x -
        before.position.x;

      const expectedDeltaY =
        after.position.y -
        before.position.y;

      const expectedDistance =
        Math.hypot(
          expectedDeltaX,
          expectedDeltaY,
        );

      expect(
        model
          .creature
          .motionState,
      ).toBe("moving");

      expect(
        model
          .creature
          .distanceMoved,
      ).toBeCloseTo(
        expectedDistance,
      );

      expect(
        model
          .creature
          .facingDirection,
      ).not.toBeNull();

      expect(
        model
          .creature
          .facingDirection
          ?.x ??
          0,
      ).toBeGreaterThan(0);

      expect(
        model
          .creature
          .facingDirection
          ?.y ??
          1,
      ).toBeCloseTo(0);
    });

    it("does not invent facing toward food when the Creature does not physically move", () => {
      /*
       * Food physically exists east of the
       * Creature, but it begins genuinely
       * occluded and no memory exists.
       *
       * The Creature therefore has no
       * legitimate food evidence.
       */
      const before =
        createM1EpisodeState(
          {
            learningEnabled:
              false,

            memoryEnabled:
              false,

            foodX:
              3,

            foodOccluded:
              true,
          },
        );

      const after =
        advanceM1Episode(
          before,
        );

      expect(
        after.position,
      ).toEqual(
        before.position,
      );

      /*
       * World truth still contains food to
       * the east.
       */
      expect(
        after
          .food
          .position
          .x,
      ).toBeGreaterThan(
        after.position.x,
      );

      const model =
        deriveV0PresentationModel(
          after,
          before,
        );

      /*
       * Presentation must not use that hidden
       * target position to manufacture a
       * purposeful facing direction.
       */
      expect(
        model
          .creature
          .motionState,
      ).toBe(
        "stationary",
      );

      expect(
        model
          .creature
          .distanceMoved,
      ).toBe(0);

      expect(
        model
          .creature
          .facingDirection,
      ).toBeNull();
    });

    it("keeps physical food availability distinct from Creature sensory occlusion", () => {
      const state =
        createM1EpisodeState(
          {
            learningEnabled:
              false,

            memoryEnabled:
              true,

            foodX:
              3,

            foodOccluded:
              true,
          },
        );

      expect(
        state.food.consumed,
      ).toBe(false);

      const model =
        deriveV0PresentationModel(
          state,
        );

      /*
       * The physical food still exists in the
       * authoritative world.
       */
      expect(
        model
          .food
          .available,
      ).toBe(true);

      /*
       * But sensory accessibility from the
       * Creature's perspective is a separate
       * fact.
       */
      expect(
        model
          .environment
          .foodOccludedForCreature,
      ).toBe(true);
    });

    it("marks food unavailable when authoritative simulation state records consumption", () => {
      /*
       * The default food distance allows the
       * accepted simulation to SEEK first and
       * then legitimately EAT on the
       * following tick.
       */
      const initial =
        createM1EpisodeState(
          {
            learningEnabled:
              false,

            memoryEnabled:
              false,
          },
        );

      const afterSeek =
        advanceM1Episode(
          initial,
        );

      const afterEat =
        advanceM1Episode(
          afterSeek,
        );

      expect(
        afterEat.food.consumed,
      ).toBe(true);

      const model =
        deriveV0PresentationModel(
          afterEat,
          afterSeek,
        );

      expect(
        model
          .food
          .consumed,
      ).toBe(true);

      expect(
        model
          .food
          .available,
      ).toBe(false);
    });

    it("rejects non-consecutive states rather than deriving misleading motion", () => {
      const initial =
        createM1EpisodeState(
          {
            learningEnabled:
              false,

            memoryEnabled:
              false,

            foodX:
              3,
          },
        );

      const afterFirst =
        advanceM1Episode(
          initial,
        );

      const afterSecond =
        advanceM1Episode(
          afterFirst,
        );

      expect(() =>
        deriveV0PresentationModel(
          afterSecond,
          initial,
        ),
      ).toThrow(
        "V0 presentation motion requires consecutive simulation states.",
      );
    });

    it("observes simulation state without mutating it", () => {
      const before =
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

      const after =
        advanceM1Episode(
          before,
        );

      const beforeSnapshot =
        JSON.stringify(
          before,
        );

      const afterSnapshot =
        JSON.stringify(
          after,
        );

      const model =
        deriveV0PresentationModel(
          after,
          before,
        );

      expect(
        JSON.stringify(
          before,
        ),
      ).toBe(
        beforeSnapshot,
      );

      expect(
        JSON.stringify(
          after,
        ),
      ).toBe(
        afterSnapshot,
      );

      /*
       * The ordinary presentation model is
       * deliberately narrow.
       *
       * Cognitive internals belong in the
       * later developer Why/History path, not
       * in the basic renderer contract.
       */
      expect(
        model,
      ).not.toHaveProperty(
        "brain",
      );

      expect(
        model,
      ).not.toHaveProperty(
        "foodMemory",
      );

      expect(
        model.creature,
      ).not.toHaveProperty(
        "brain",
      );

      expect(
        model.creature,
      ).not.toHaveProperty(
        "foodMemory",
      );
    });
  },
);