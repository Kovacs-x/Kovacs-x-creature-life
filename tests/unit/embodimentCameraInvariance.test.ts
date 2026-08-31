import {
  describe,
  expect,
  it,
} from "vitest";

import {
  PerspectiveCamera,
} from "three";

import {
  advanceM3AcquisitionTick,
  createM3AcquisitionState,
  serializeM3AcquisitionState,
  type M3AcquisitionState,
  type M3AcquisitionTickEvidence,
} from "../../src/simulation/core/m3Acquisition.js";

import {
  M3_PRIMARY_BRANCH_A_SEED,
} from "../../src/simulation/core/m3Contract.js";

const TICK_COUNT =
  20;

/*
 * Repeatedly mutates a standalone Three.js camera
 * object between authoritative ticks: position,
 * orientation and projection all change, exactly as
 * an observer freely orbiting/zooming the embodiment
 * camera would produce.
 *
 * This camera is never passed into
 * advanceM3AcquisitionTick(...), createM3AcquisitionState(...)
 * or any other simulation function - it exists only
 * to prove that manipulating a real camera object
 * alongside the authoritative transition has no
 * observable effect on it. No WebGL context or
 * renderer is required for this: Three.js camera
 * objects are pure math/state containers.
 */
function disturbPresentationCamera(
  camera:
    PerspectiveCamera,

  tickIndex:
    number,
): void {
  const angle =
    tickIndex *
    0.37;

  camera.position.set(
    5 +
      Math.cos(
        angle,
      ) *
        8,

    3 +
      (
        tickIndex %
        5
      ),

    5 +
      Math.sin(
        angle,
      ) *
        8,
  );

  camera.lookAt(
    5,
    0,
    5,
  );

  camera.fov =
    35 +
    (
      tickIndex %
      10
    );

  camera.aspect =
    1 +
    (
      tickIndex %
      3
    ) *
      0.25;

  camera.near =
    0.05 +
    (
      tickIndex %
      2
    ) *
      0.05;

  camera.far =
    80 +
    tickIndex;

  camera.updateProjectionMatrix();

  camera.updateMatrixWorld(
    true,
  );
}

function runSeededTicks(
  disturbCamera:
    boolean,
): {
  readonly finalState:
    M3AcquisitionState;

  readonly evidenceSequence:
    readonly M3AcquisitionTickEvidence[];
} {
  let state =
    createM3AcquisitionState(
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

  const camera =
    disturbCamera
      ? new PerspectiveCamera(
          45,
          1,
          0.1,
          100,
        )
      : null;

  const evidenceSequence:
    M3AcquisitionTickEvidence[] =
      [];

  for (
    let tickIndex = 0;
    tickIndex <
      TICK_COUNT &&
    !state.complete;
    tickIndex += 1
  ) {
    if (
      camera !==
      null
    ) {
      disturbPresentationCamera(
        camera,
        tickIndex,
      );
    }

    const result =
      advanceM3AcquisitionTick(
        state,
      );

    evidenceSequence.push(
      result.evidence,
    );

    state =
      result.state;

    if (
      camera !==
      null
    ) {
      /*
       * Disturb the camera again after the tick
       * too, so camera activity both before and
       * after each authoritative transition is
       * covered.
       */
      disturbPresentationCamera(
        camera,

        tickIndex +
          100,
      );
    }
  }

  return {
    finalState:
      state,

    evidenceSequence,
  };
}

describe(
  "embodiment camera-invariance control",
  () => {
    it(
      "produces an identical authoritative result whether or not a presentation camera is manipulated between ticks",
      () => {
        const clean =
          runSeededTicks(
            false,
          );

        const withCameraActivity =
          runSeededTicks(
            true,
          );

        expect(
          serializeM3AcquisitionState(
            withCameraActivity.finalState,
          ),
        ).toBe(
          serializeM3AcquisitionState(
            clean.finalState,
          ),
        );

        expect(
          JSON.stringify(
            withCameraActivity.evidenceSequence,
          ),
        ).toBe(
          JSON.stringify(
            clean.evidenceSequence,
          ),
        );
      },
    );

    it(
      "leaves RNG, learned brain weights and exploration state identical under camera activity",
      () => {
        const clean =
          runSeededTicks(
            false,
          );

        const withCameraActivity =
          runSeededTicks(
            true,
          );

        expect(
          withCameraActivity.finalState
            .rngState,
        ).toEqual(
          clean.finalState
            .rngState,
        );

        expect(
          withCameraActivity.finalState
            .brain,
        ).toEqual(
          clean.finalState
            .brain,
        );

        expect(
          withCameraActivity.finalState
            .explorationState,
        ).toEqual(
          clean.finalState
            .explorationState,
        );

        expect(
          withCameraActivity.finalState
            .foodMemory,
        ).toEqual(
          clean.finalState
            .foodMemory,
        );

        expect(
          withCameraActivity.finalState
            .tickIndex,
        ).toBeGreaterThan(
          0,
        );
      },
    );
  },
);
