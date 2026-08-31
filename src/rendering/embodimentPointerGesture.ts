/*
 * EMBODIMENT POINTER GESTURE CLASSIFICATION
 *
 * E4 needs to distinguish a camera-orbit/pinch
 * gesture from a genuine single tap/click intended
 * as a food-placement request, so that releasing
 * the pointer after manipulating the camera never
 * accidentally relocates food.
 *
 * This module is deliberately independent of:
 *
 * - Three.js;
 * - OrbitControls' own internal state;
 * - the DOM;
 * - authoritative simulation state;
 * - simulation RNG.
 *
 * It tracks only pointer identity, button, and
 * client-pixel movement across a gesture's full
 * pointerdown -> pointermove* -> pointerup/cancel
 * lifecycle, which keeps it presentation/input
 * state only and trivially testable without a
 * browser or WebGL context.
 *
 * A gesture qualifies as a placement tap only when
 * ALL of the following hold:
 *
 * - it was initiated by the ordinary primary
 *   activation (mouse button 0, or a touch, which
 *   always reports button 0 on pointerdown);
 * - the initiating pointer never moved more than
 *   the tap threshold from its down position, at
 *   ANY point during the gesture (not just at the
 *   final up position) - a drag that moves away
 *   and back before release still does not
 *   qualify;
 * - no second pointer ever became simultaneously
 *   active during the gesture (a multi-touch
 *   camera gesture never qualifies, regardless of
 *   which pointer releases first);
 * - the gesture was never cancelled
 *   (pointercancel).
 *
 * Once any of these is violated the gesture is
 * permanently invalidated for the remainder of its
 * lifetime; only a subsequent, fresh gesture
 * (started once every pointer from the previous
 * gesture has been released) can qualify again.
 */

export const EMBODIMENT_POINTER_TAP_MAX_MOVEMENT_PIXELS =
  6;

/*
 * Only the ordinary primary mouse button (or a
 * touch/pen contact, which the Pointer Events spec
 * always reports as button 0 on pointerdown)
 * initiates a placement candidate. A secondary
 * (right, button 2) or auxiliary (middle, button 1)
 * click never does.
 */
const PRIMARY_POINTER_BUTTON =
  0;

export interface EmbodimentPointerGestureState {
  readonly primaryPointerId:
    number | null;

  readonly downX:
    number;

  readonly downY:
    number;

  readonly isPrimaryButton:
    boolean;

  /*
   * Once true, this gesture can never qualify as a
   * placement tap, regardless of what happens
   * afterward: excessive movement, a second
   * simultaneous pointer, and cancellation all set
   * this permanently for the remaining lifetime of
   * the gesture.
   */
  readonly invalidated:
    boolean;

  /*
   * Every pointer id currently down and considered
   * part of this gesture, including the primary
   * one.
   */
  readonly activePointerIds:
    readonly number[];
}

export const EMBODIMENT_NO_ACTIVE_POINTER_GESTURE:
  EmbodimentPointerGestureState = {
    primaryPointerId:
      null,

    downX:
      0,

    downY:
      0,

    isPrimaryButton:
      false,

    invalidated:
      false,

    activePointerIds:
      [],
  };

/*
 * Handle a pointerdown for any pointer.
 *
 * If no gesture is currently active, this pointer
 * becomes the new gesture's primary pointer.
 *
 * If a gesture is already active, this is a second
 * (or later) simultaneous pointer joining it: the
 * existing primary pointer and down-position are
 * kept, but the gesture is permanently invalidated
 * - it can never qualify as a placement tap even
 * once this joining pointer, or the original
 * primary pointer, is later released. OrbitControls
 * itself still receives and handles this pointer
 * entirely independently; this module only ever
 * observes positions, never suppresses or redirects
 * events.
 */
export function registerEmbodimentPointerDown(
  state:
    EmbodimentPointerGestureState,

  pointerId:
    number,

  x:
    number,

  y:
    number,

  button:
    number,
): EmbodimentPointerGestureState {
  assertFiniteCoordinate(
    x,
    "Embodiment pointer gesture x",
  );

  assertFiniteCoordinate(
    y,
    "Embodiment pointer gesture y",
  );

  if (
    state.primaryPointerId ===
    null
  ) {
    return {
      primaryPointerId:
        pointerId,

      downX: x,
      downY: y,

      isPrimaryButton:
        button ===
        PRIMARY_POINTER_BUTTON,

      invalidated:
        false,

      activePointerIds:
        [
          pointerId,
        ],
    };
  }

  if (
    state.activePointerIds.includes(
      pointerId,
    )
  ) {
    /*
     * A duplicate pointerdown for an id already
     * considered active (no matching up/cancel was
     * observed in between). Defensive no-op rather
     * than double-counting the same pointer as two
     * participants.
     */
    return state;
  }

  return {
    ...state,

    activePointerIds:
      [
        ...state.activePointerIds,
        pointerId,
      ],

    invalidated:
      true,
  };
}

/*
 * Handle a pointermove for any pointer.
 *
 * Only movement of the gesture's original primary
 * pointer is evaluated against the tap-movement
 * threshold: once a second pointer has joined, the
 * gesture is already permanently invalidated via
 * registerEmbodimentPointerDown(...) regardless of
 * how far anything moves.
 */
export function registerEmbodimentPointerMove(
  state:
    EmbodimentPointerGestureState,

  pointerId:
    number,

  x:
    number,

  y:
    number,

  maxMovementPixels:
    number =
      EMBODIMENT_POINTER_TAP_MAX_MOVEMENT_PIXELS,
): EmbodimentPointerGestureState {
  if (
    state.invalidated ||
    state.primaryPointerId !==
      pointerId
  ) {
    return state;
  }

  if (
    exceedsTapMovement(
      state,
      x,
      y,
      maxMovementPixels,
    )
  ) {
    return {
      ...state,

      invalidated:
        true,
    };
  }

  return state;
}

export interface EmbodimentPointerGestureUpResult {
  readonly nextState:
    EmbodimentPointerGestureState;

  /*
   * True only when this pointerup completes a
   * genuine, still-valid, single-primary-pointer,
   * primary-button tap that never exceeded the
   * movement threshold at any point (including this
   * final release position) and was never joined by
   * a second pointer or cancelled.
   */
  readonly qualifiesAsTap:
    boolean;
}

export function registerEmbodimentPointerUp(
  state:
    EmbodimentPointerGestureState,

  pointerId:
    number,

  x:
    number,

  y:
    number,

  maxMovementPixels:
    number =
      EMBODIMENT_POINTER_TAP_MAX_MOVEMENT_PIXELS,
): EmbodimentPointerGestureUpResult {
  const isPrimaryRelease =
    state.primaryPointerId ===
    pointerId;

  /*
   * The release position itself is one more
   * movement sample: a synthetic or coalesced
   * event stream might never have produced an
   * intermediate pointermove even though the final
   * position is far from the down position.
   */
  const invalidated =
    state.invalidated ||
    (
      isPrimaryRelease &&
      exceedsTapMovement(
        state,
        x,
        y,
        maxMovementPixels,
      )
    );

  const qualifiesAsTap =
    isPrimaryRelease &&
    state.isPrimaryButton &&
    !invalidated;

  const remainingActivePointerIds =
    state.activePointerIds.filter(
      (activeId) =>
        activeId !==
        pointerId,
    );

  if (
    remainingActivePointerIds.length ===
    0
  ) {
    return {
      nextState:
        EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,

      qualifiesAsTap,
    };
  }

  return {
    nextState: {
      ...state,

      activePointerIds:
        remainingActivePointerIds,

      invalidated,
    },

    qualifiesAsTap,
  };
}

/*
 * Handle a pointercancel for any pointer.
 *
 * A cancelled pointer (for example the platform
 * taking over the gesture for its own navigation
 * gesture, or losing pointer capture) can never
 * have been a genuine completed tap. This
 * permanently invalidates the whole gesture, not
 * only the cancelled pointer's contribution, and
 * removes the cancelled pointer from the active
 * set. Once every pointer belonging to the gesture
 * has gone (via up or cancel), the state resets to
 * a clean slate so a later, fresh gesture is
 * unaffected.
 */
export function registerEmbodimentPointerCancel(
  state:
    EmbodimentPointerGestureState,

  pointerId:
    number,
): EmbodimentPointerGestureState {
  const isPartOfGesture =
    state.primaryPointerId ===
      pointerId ||
    state.activePointerIds.includes(
      pointerId,
    );

  if (!isPartOfGesture) {
    return state;
  }

  const remainingActivePointerIds =
    state.activePointerIds.filter(
      (activeId) =>
        activeId !==
        pointerId,
    );

  if (
    remainingActivePointerIds.length ===
    0
  ) {
    return EMBODIMENT_NO_ACTIVE_POINTER_GESTURE;
  }

  return {
    ...state,

    activePointerIds:
      remainingActivePointerIds,

    invalidated:
      true,
  };
}

function exceedsTapMovement(
  state:
    EmbodimentPointerGestureState,

  x:
    number,

  y:
    number,

  maxMovementPixels:
    number,
): boolean {
  assertFiniteCoordinate(
    x,
    "Embodiment pointer gesture x",
  );

  assertFiniteCoordinate(
    y,
    "Embodiment pointer gesture y",
  );

  if (
    !Number.isFinite(
      maxMovementPixels,
    ) ||
    maxMovementPixels <
      0
  ) {
    throw new RangeError(
      "Embodiment pointer tap movement threshold must be finite and non-negative.",
    );
  }

  const movementPixels =
    Math.hypot(
      x -
        state.downX,

      y -
        state.downY,
    );

  return (
    movementPixels >
    maxMovementPixels
  );
}

function assertFiniteCoordinate(
  value:
    number,

  label:
    string,
): void {
  if (
    !Number.isFinite(
      value,
    )
  ) {
    throw new RangeError(
      `${label} must be finite.`,
    );
  }
}
