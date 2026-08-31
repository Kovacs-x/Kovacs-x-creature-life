import {
  SRGBColorSpace,
  WebGLRenderer,
  type PerspectiveCamera,
  type Scene,
} from "three";

import {
  OrbitControls,
} from "three/examples/jsm/controls/OrbitControls.js";

import type {
  M3PresentationModel,
} from "../rendering/m3Presentation.js";

import {
  EMBODIMENT_CAMERA_TARGET,
  createEmbodimentScene,
} from "../rendering/embodimentScene.js";

import {
  raycastEmbodimentFloorToWorldPosition,
} from "../rendering/embodimentFloorRaycast.js";

import type {
  EmbodimentWorldPosition,
} from "../rendering/embodimentCoordinates.js";

import {
  EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
  registerEmbodimentPointerCancel,
  registerEmbodimentPointerDown,
  registerEmbodimentPointerMove,
  registerEmbodimentPointerUp,
} from "../rendering/embodimentPointerGesture.js";

/*
 * EMBODIMENT WEBGL RENDERER
 *
 * requestAnimationFrame is a presentation loop.
 *
 * It may:
 *
 * - sample locomotion interpolation;
 * - animate presentation-only idle life;
 * - update orbit camera controls;
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
 *
 * E4 PLAYER FOOD PLACEMENT
 *
 * This module also owns the narrow player-input
 * boundary:
 *
 * canvas tap/click
 *   -> normalized device coordinates
 *   -> raycastEmbodimentFloorToWorldPosition(...)
 *      (habitat floor mesh only)
 *   -> authoritative planar world position
 *   -> optional onPlaceFoodIntent(...) callback
 *
 * A camera-orbit or multi-touch/pinch gesture is
 * distinguished from a genuine single floor tap by
 * tracking the full pointerdown/move/up/cancel
 * lifecycle through embodimentPointerGesture.ts, so
 * releasing the pointer after orbiting the camera,
 * or after any gesture a second pointer ever joined,
 * never emits a placement intent - including when
 * the pointer drifts back near its original position
 * before release, and including a release delivered
 * outside the canvas while OrbitControls still held
 * pointer capture (rejected by
 * raycastEmbodimentFloorToWorldPosition(...) itself
 * via its NDC-viewport check).
 *
 * This renderer never receives the application
 * controller. It only ever calls the narrow
 * onPlaceFoodIntent callback supplied by the
 * caller; the caller decides what that means for
 * authoritative state (see m3Main.ts, which wires
 * it to controller.placeFood(...)).
 */

export interface EmbodimentThreeRendererConfig {
  /*
   * Invoked with an authoritative planar world
   * position exactly when the player performs a
   * genuine tap/click on the authoritative habitat
   * floor. Never invoked for an orbit drag, a miss,
   * or a hit outside the habitat floor.
   *
   * This callback is the entire outward boundary
   * of this renderer's player-input handling. It
   * receives a plain position, never the
   * application controller, the simulation state,
   * or any cognition-relevant object.
   */
  readonly onPlaceFoodIntent?:
    (
      position:
        EmbodimentWorldPosition,
    ) => void;
}

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

  config:
    EmbodimentThreeRendererConfig =
      {},
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

  /*
   * ORBIT CAMERA
   *
   * Camera state below is presentation-only. It
   * reads and writes only camera position/target
   * and never touches sceneBundle.actors,
   * simulation state, or RNG.
   */
  const controls =
    new OrbitControls(
      sceneBundle.camera,

      renderer.domElement,
    );

  controls.target.set(
    EMBODIMENT_CAMERA_TARGET.x,
    EMBODIMENT_CAMERA_TARGET.y,
    EMBODIMENT_CAMERA_TARGET.z,
  );

  controls.enableDamping =
    true;

  controls.dampingFactor =
    0.08;

  /*
   * Modest zoom and framing limits so the habitat
   * remains usable: the camera can neither zoom
   * inside the Creature nor retreat so far the
   * habitat becomes illegible, and cannot orbit
   * below the floor.
   */
  controls.minDistance =
    4;

  controls.maxDistance =
    30;

  controls.minPolarAngle =
    0.15;

  controls.maxPolarAngle =
    Math.PI /
      2 -
    0.05;

  controls.update();

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

  /*
   * FLOOR TAP / CLICK -> PLAYER FOOD PLACEMENT
   * INTENT
   *
   * Pointer gesture tracking distinguishes an
   * OrbitControls drag or multi-touch/pinch gesture
   * from a genuine single tap so releasing the
   * pointer after manipulating the camera never
   * emits a placement intent. This module never
   * calls preventDefault()/stopPropagation() and
   * never removes OrbitControls' own listeners, so
   * OrbitControls continues to receive and handle
   * every pointer event exactly as it would without
   * this tracking.
   */
  let activePointerGesture =
    EMBODIMENT_NO_ACTIVE_POINTER_GESTURE;

  const handlePointerDown =
    (
      event:
        PointerEvent,
    ): void => {
      activePointerGesture =
        registerEmbodimentPointerDown(
          activePointerGesture,
          event.pointerId,
          event.clientX,
          event.clientY,
          event.button,
        );
    };

  const handlePointerMove =
    (
      event:
        PointerEvent,
    ): void => {
      activePointerGesture =
        registerEmbodimentPointerMove(
          activePointerGesture,
          event.pointerId,
          event.clientX,
          event.clientY,
        );
    };

  const handlePointerUp =
    (
      event:
        PointerEvent,
    ): void => {
      const result =
        registerEmbodimentPointerUp(
          activePointerGesture,
          event.pointerId,
          event.clientX,
          event.clientY,
        );

      activePointerGesture =
        result.nextState;

      if (
        !result.qualifiesAsTap ||
        disposed ||
        config.onPlaceFoodIntent ===
          undefined
      ) {
        return;
      }

      const pointerNdc =
        computePointerNdc(
          renderer.domElement,

          event.clientX,

          event.clientY,
        );

      if (
        pointerNdc ===
        null
      ) {
        return;
      }

      /*
       * The raycaster intersects ONLY the
       * authoritative habitat floor mesh. It has
       * no access to the Creature, food, or any
       * other scene object, cannot select an
       * action, and consumes no simulation RNG.
       * It also independently rejects a pointer
       * NDC outside the canvas viewport (see
       * embodimentFloorRaycast.ts), which covers a
       * release delivered outside the canvas while
       * OrbitControls held pointer capture.
       */
      const worldPosition =
        raycastEmbodimentFloorToWorldPosition(
          sceneBundle.camera,

          sceneBundle.floor,

          pointerNdc,
        );

      if (
        worldPosition !==
        null
      ) {
        config.onPlaceFoodIntent(
          worldPosition,
        );
      }
    };

  const handlePointerCancel =
    (
      event:
        PointerEvent,
    ): void => {
      activePointerGesture =
        registerEmbodimentPointerCancel(
          activePointerGesture,
          event.pointerId,
        );
    };

  renderer.domElement.addEventListener(
    "pointerdown",
    handlePointerDown,
  );

  renderer.domElement.addEventListener(
    "pointermove",
    handlePointerMove,
  );

  renderer.domElement.addEventListener(
    "pointerup",
    handlePointerUp,
  );

  renderer.domElement.addEventListener(
    "pointercancel",
    handlePointerCancel,
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
       * Orbit damping/inertia is presentation-only
       * camera easing. It reads pointer history
       * already captured by OrbitControls' own
       * listeners and writes only camera
       * position/target.
       */
      controls.update();

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

      controls.update();

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

      renderer.domElement.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );

      renderer.domElement.removeEventListener(
        "pointermove",
        handlePointerMove,
      );

      renderer.domElement.removeEventListener(
        "pointerup",
        handlePointerUp,
      );

      renderer.domElement.removeEventListener(
        "pointercancel",
        handlePointerCancel,
      );

      controls.dispose();

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

/*
 * Convert a pointer client position into
 * normalized device coordinates over the renderer
 * canvas, or null when the canvas has no usable
 * size yet. This is pure DOM geometry; it does not
 * itself raycast or touch simulation state.
 */
function computePointerNdc(
  canvas:
    HTMLCanvasElement,

  clientX:
    number,

  clientY:
    number,
): {
  readonly x:
    number;

  readonly y:
    number;
} | null {
  const rect =
    canvas.getBoundingClientRect();

  if (
    rect.width <=
      0 ||
    rect.height <=
      0
  ) {
    return null;
  }

  return {
    x:
      (
        (
          clientX -
          rect.left
        ) /
        rect.width
      ) *
        2 -
      1,

    y:
      -(
        (
          (
            clientY -
            rect.top
          ) /
          rect.height
        ) *
          2 -
        1
      ),
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