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
 * This is a browser presentation loop only.
 *
 * requestAnimationFrame here may:
 *
 * - render the Three.js scene;
 * - later support presentation interpolation;
 * - later support presentation-only animation.
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
 * State updates enter only as an already-derived
 * M3PresentationModel.
 */

export interface EmbodimentThreeRenderer {
  readonly canvas:
    HTMLCanvasElement;

  readonly scene:
    Scene;

  readonly camera:
    PerspectiveCamera;

  /*
   * Forward one already-derived presentation
   * model into the state-faithful Three.js
   * actor graph.
   */
  readonly updatePresentation:
    (
      model:
        M3PresentationModel,
    ) => void;

  /*
   * Render the current presentation scene once.
   *
   * This performs no simulation work.
   */
  readonly renderOnce:
    () => void;

  /*
   * Stop the presentation frame loop and
   * release browser/Three.js resources.
   */
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

  /*
   * The container owns this presentation
   * canvas. No simulation state is stored in
   * the DOM.
   */
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
    (): void => {
      if (
        disposed
      ) {
        return;
      }

      /*
       * Render only.
       *
       * No simulation tick is called from this
       * frame loop.
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

      sceneBundle.updatePresentation(
        model,
      );
    },

    renderOnce: () => {
      if (
        disposed
      ) {
        return;
      }

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

/*
 * Zero-sized elements can occur briefly while
 * browser layout is settling.
 *
 * A one-pixel presentation fallback avoids an
 * invalid camera aspect ratio without changing
 * authoritative habitat geometry.
 */
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

/*
 * Device pixel density is strictly a visual
 * concern.
 *
 * Capping it prevents unnecessary GPU load on
 * very high-density mobile displays.
 */
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