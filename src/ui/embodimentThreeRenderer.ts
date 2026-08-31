import {
  SRGBColorSpace,
  WebGLRenderer,
  type PerspectiveCamera,
  type Scene,
} from "three";

import type {
  M3PresentationModel,
} from "../rendering/m3Presentation.js";

import {
  createEmbodimentScene,
} from "../rendering/embodimentScene.js";

/*
 * EMBODIMENT WEBGL RENDERER
 *
 * requestAnimationFrame is a presentation loop.
 *
 * It may:
 *
 * - sample locomotion interpolation;
 * - later animate presentation-only idle life;
 * - later update camera controls;
 * - render.
 *
 * It must never:
 *
 * - advance the authoritative simulation;
 * - evaluate the brain;
 * - update memory;
 * - update hunger;
 * - update exploration pressure;
 * - sample simulation RNG;
 * - choose an action;
 * - move authoritative Creature/world state.
 *
 * RAF timestamp is used only as absolute
 * presentation time.
 */

export interface EmbodimentThreeRenderer {
  readonly canvas:
    HTMLCanvasElement;

  readonly scene:
    Scene;

  readonly camera:
    PerspectiveCamera;

  readonly updatePresentation:
    (
      model:
        M3PresentationModel,
    ) => void;

  readonly renderOnce:
    () => void;

  readonly dispose:
    () => void;
}

export function mountEmbodimentThreeRenderer(
  container:
    HTMLElement,
): EmbodimentThreeRenderer {
  const initialViewport =
    readViewportSize(
      container,
    );

  const sceneBundle =
    createEmbodimentScene(
      initialViewport.width /
        initialViewport.height,
    );

  const renderer =
    new WebGLRenderer(
      {
        antialias:
          true,

        alpha:
          false,
      },
    );

  renderer.outputColorSpace =
    SRGBColorSpace;

  renderer.setPixelRatio(
    readPresentationPixelRatio(),
  );

  renderer.setSize(
    initialViewport.width,
    initialViewport.height,
    false,
  );

  renderer.domElement.className =
    "embodiment-three-canvas";

  renderer.domElement.setAttribute(
    "role",
    "img",
  );

  renderer.domElement.setAttribute(
    "aria-label",
    "Creature Life three-dimensional embodiment habitat",
  );

  container.replaceChildren(
    renderer.domElement,
  );

  let disposed =
    false;

  let animationFrameId:
    number | null =
      null;

  const resizeObserver =
    new ResizeObserver(
      () => {
        if (
          disposed
        ) {
          return;
        }

        resizeRenderer(
          container,
          renderer,
          sceneBundle.camera,
        );
      },
    );

  resizeObserver.observe(
    container,
  );

  const renderFrame =
    (
      frameTimeMilliseconds:
        number,
    ): void => {
      if (
        disposed
      ) {
        return;
      }

      const presentationTimeSeconds =
        millisecondsToSeconds(
          frameTimeMilliseconds,
        );

      /*
       * Presentation-only interpolation.
       *
       * The number of RAF calls cannot accumulate
       * additional movement because updateFrame
       * samples from absolute time.
       */
      sceneBundle.updateFrame(
        presentationTimeSeconds,
      );

      /*
       * Render only.
       *
       * There is no simulation tick anywhere in
       * this RAF path.
       */
      renderer.render(
        sceneBundle.scene,
        sceneBundle.camera,
      );

      animationFrameId =
        requestAnimationFrame(
          renderFrame,
        );
    };

  animationFrameId =
    requestAnimationFrame(
      renderFrame,
    );

  return {
    canvas:
      renderer.domElement,

    scene:
      sceneBundle.scene,

    camera:
      sceneBundle.camera,

    updatePresentation: (
      model,
    ) => {
      if (
        disposed
      ) {
        return;
      }

      /*
       * performance.now() and RAF timestamps use
       * the same browser performance time origin.
       *
       * This time is presentation-only and never
       * becomes simulation time.
       */
      sceneBundle.updatePresentation(
        model,
        readPresentationTimeSeconds(),
      );
    },

    renderOnce: () => {
      if (
        disposed
      ) {
        return;
      }

      sceneBundle.updateFrame(
        readPresentationTimeSeconds(),
      );

      renderer.render(
        sceneBundle.scene,
        sceneBundle.camera,
      );
    },

    dispose: () => {
      if (
        disposed
      ) {
        return;
      }

      disposed =
        true;

      if (
        animationFrameId !==
        null
      ) {
        cancelAnimationFrame(
          animationFrameId,
        );

        animationFrameId =
          null;
      }

      resizeObserver.disconnect();

      sceneBundle.dispose();

      renderer.dispose();

      if (
        renderer.domElement.parentElement ===
        container
      ) {
        container.removeChild(
          renderer.domElement,
        );
      }
    },
  };
}

function resizeRenderer(
  container:
    HTMLElement,

  renderer:
    WebGLRenderer,

  camera:
    PerspectiveCamera,
): void {
  const viewport =
    readViewportSize(
      container,
    );

  camera.aspect =
    viewport.width /
    viewport.height;

  camera.updateProjectionMatrix();

  renderer.setSize(
    viewport.width,
    viewport.height,
    false,
  );
}

function readViewportSize(
  container:
    HTMLElement,
): {
  readonly width:
    number;

  readonly height:
    number;
} {
  return {
    width:
      Math.max(
        1,
        container.clientWidth,
      ),

    height:
      Math.max(
        1,
        container.clientHeight,
      ),
  };
}

function readPresentationPixelRatio():
  number {
  const devicePixelRatio =
    window.devicePixelRatio;

  if (
    !Number.isFinite(
      devicePixelRatio,
    )
  ) {
    return 1;
  }

  return Math.min(
    2,
    Math.max(
      1,
      devicePixelRatio,
    ),
  );
}

function readPresentationTimeSeconds():
  number {
  return millisecondsToSeconds(
    performance.now(),
  );
}

function millisecondsToSeconds(
  milliseconds:
    number,
): number {
  return (
    milliseconds /
    1000
  );
}