import {
  describe,
  expect,
  it,
} from "vitest";

import {
  EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
  EMBODIMENT_POINTER_TAP_MAX_MOVEMENT_PIXELS,
  registerEmbodimentPointerCancel,
  registerEmbodimentPointerDown,
  registerEmbodimentPointerMove,
  registerEmbodimentPointerUp,
} from "../../src/rendering/embodimentPointerGesture.js";

const PRIMARY_BUTTON =
  0;

const SECONDARY_BUTTON =
  2;

const MIDDLE_BUTTON =
  1;

describe(
  "embodiment pointer gesture classification",
  () => {
    it(
      "recognizes a genuine tap: primary button, same pointer, released without meaningful movement",
      () => {
        let state =
          registerEmbodimentPointerDown(
            EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
            1,
            100,
            200,
            PRIMARY_BUTTON,
          );

        const result =
          registerEmbodimentPointerUp(
            state,
            1,
            101,
            199,
          );

        expect(
          result.qualifiesAsTap,
        ).toBe(
          true,
        );

        expect(
          result.nextState,
        ).toEqual(
          EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
        );
      },
    );

    it(
      "does not classify an orbit drag that moves away and back before release as a tap",
      () => {
        let state =
          registerEmbodimentPointerDown(
            EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
            1,
            100,
            100,
            PRIMARY_BUTTON,
          );

        /*
         * Move well beyond the tap threshold - a
         * genuine orbit gesture.
         */
        state =
          registerEmbodimentPointerMove(
            state,
            1,

            100 +
              EMBODIMENT_POINTER_TAP_MAX_MOVEMENT_PIXELS *
                20,

            100,
          );

        /*
         * Then move back to almost exactly the
         * original down position before releasing.
         * Endpoint-only displacement would wrongly
         * call this a tap.
         */
        state =
          registerEmbodimentPointerMove(
            state,
            1,
            100,
            100,
          );

        const result =
          registerEmbodimentPointerUp(
            state,
            1,
            100,
            100,
          );

        expect(
          result.qualifiesAsTap,
        ).toBe(
          false,
        );
      },
    );

    it(
      "treats movement exactly at the threshold as still a tap, and just beyond it as not",
      () => {
        const down =
          registerEmbodimentPointerDown(
            EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
            1,
            0,
            0,
            PRIMARY_BUTTON,
          );

        const atThreshold =
          registerEmbodimentPointerUp(
            down,
            1,

            EMBODIMENT_POINTER_TAP_MAX_MOVEMENT_PIXELS,

            0,
          );

        expect(
          atThreshold.qualifiesAsTap,
        ).toBe(
          true,
        );

        const beyondThreshold =
          registerEmbodimentPointerUp(
            down,
            1,

            EMBODIMENT_POINTER_TAP_MAX_MOVEMENT_PIXELS +
              0.01,

            0,
          );

        expect(
          beyondThreshold.qualifiesAsTap,
        ).toBe(
          false,
        );
      },
    );

    describe(
      "multi-pointer gestures",
      () => {
        it(
          "never qualifies a two-pointer gesture as a placement tap, whichever pointer releases first",
          () => {
            let state =
              registerEmbodimentPointerDown(
                EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
                1,
                100,
                100,
                PRIMARY_BUTTON,
              );

            state =
              registerEmbodimentPointerDown(
                state,
                2,
                140,
                140,
                PRIMARY_BUTTON,
              );

            /*
             * Neither pointer moves at all - a
             * stationary two-finger touch would
             * still incorrectly qualify under
             * movement-only classification.
             */
            const primaryReleaseFirst =
              registerEmbodimentPointerUp(
                state,
                1,
                100,
                100,
              );

            expect(
              primaryReleaseFirst.qualifiesAsTap,
            ).toBe(
              false,
            );

            const secondaryReleaseAfter =
              registerEmbodimentPointerUp(
                primaryReleaseFirst.nextState,
                2,
                140,
                140,
              );

            expect(
              secondaryReleaseAfter.qualifiesAsTap,
            ).toBe(
              false,
            );

            expect(
              secondaryReleaseAfter.nextState,
            ).toEqual(
              EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
            );
          },
        );

        it(
          "never qualifies when the secondary pointer releases before the primary pointer",
          () => {
            let state =
              registerEmbodimentPointerDown(
                EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
                1,
                100,
                100,
                PRIMARY_BUTTON,
              );

            state =
              registerEmbodimentPointerDown(
                state,
                2,
                140,
                140,
                PRIMARY_BUTTON,
              );

            const secondaryReleaseFirst =
              registerEmbodimentPointerUp(
                state,
                2,
                140,
                140,
              );

            expect(
              secondaryReleaseFirst.qualifiesAsTap,
            ).toBe(
              false,
            );

            const primaryReleaseAfter =
              registerEmbodimentPointerUp(
                secondaryReleaseFirst.nextState,
                1,
                100,
                100,
              );

            expect(
              primaryReleaseAfter.qualifiesAsTap,
            ).toBe(
              false,
            );

            expect(
              primaryReleaseAfter.nextState,
            ).toEqual(
              EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
            );
          },
        );

        it(
          "allows a later, fresh single-pointer tap to qualify normally after a two-pointer gesture fully ends",
          () => {
            let state =
              registerEmbodimentPointerDown(
                EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
                1,
                100,
                100,
                PRIMARY_BUTTON,
              );

            state =
              registerEmbodimentPointerDown(
                state,
                2,
                140,
                140,
                PRIMARY_BUTTON,
              );

            const firstUp =
              registerEmbodimentPointerUp(
                state,
                1,
                100,
                100,
              );

            const secondUp =
              registerEmbodimentPointerUp(
                firstUp.nextState,
                2,
                140,
                140,
              );

            expect(
              secondUp.nextState,
            ).toEqual(
              EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
            );

            const freshDown =
              registerEmbodimentPointerDown(
                secondUp.nextState,
                3,
                50,
                50,
                PRIMARY_BUTTON,
              );

            const freshUp =
              registerEmbodimentPointerUp(
                freshDown,
                3,
                51,
                49,
              );

            expect(
              freshUp.qualifiesAsTap,
            ).toBe(
              true,
            );
          },
        );

        it(
          "does not interfere with the joining pointer's own tracked identity",
          () => {
            let state =
              registerEmbodimentPointerDown(
                EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
                1,
                100,
                100,
                PRIMARY_BUTTON,
              );

            state =
              registerEmbodimentPointerDown(
                state,
                2,
                140,
                140,
                PRIMARY_BUTTON,
              );

            expect(
              state.activePointerIds,
            ).toEqual(
              [
                1,
                2,
              ],
            );

            expect(
              state.invalidated,
            ).toBe(
              true,
            );
          },
        );
      },
    );

    describe(
      "pointer cancellation",
      () => {
        it(
          "clears a single-pointer gesture back to a clean slate on cancel",
          () => {
            const down =
              registerEmbodimentPointerDown(
                EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
                1,
                100,
                100,
                PRIMARY_BUTTON,
              );

            const cancelled =
              registerEmbodimentPointerCancel(
                down,
                1,
              );

            expect(
              cancelled,
            ).toEqual(
              EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
            );
          },
        );

        it(
          "invalidates a still-active multi-pointer gesture rather than allowing the remaining pointer to complete a tap",
          () => {
            let state =
              registerEmbodimentPointerDown(
                EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
                1,
                100,
                100,
                PRIMARY_BUTTON,
              );

            state =
              registerEmbodimentPointerDown(
                state,
                2,
                140,
                140,
                PRIMARY_BUTTON,
              );

            const afterCancel =
              registerEmbodimentPointerCancel(
                state,
                2,
              );

            expect(
              afterCancel.activePointerIds,
            ).toEqual(
              [
                1,
              ],
            );

            const result =
              registerEmbodimentPointerUp(
                afterCancel,
                1,
                100,
                100,
              );

            expect(
              result.qualifiesAsTap,
            ).toBe(
              false,
            );
          },
        );

        it(
          "leaves an unrelated pointer id untouched",
          () => {
            const down =
              registerEmbodimentPointerDown(
                EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
                1,
                100,
                100,
                PRIMARY_BUTTON,
              );

            const unaffected =
              registerEmbodimentPointerCancel(
                down,
                999,
              );

            expect(
              unaffected,
            ).toBe(
              down,
            );
          },
        );

        it(
          "allows a fresh gesture to qualify normally after a cancelled one",
          () => {
            const down =
              registerEmbodimentPointerDown(
                EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
                1,
                100,
                100,
                PRIMARY_BUTTON,
              );

            const cancelled =
              registerEmbodimentPointerCancel(
                down,
                1,
              );

            const freshDown =
              registerEmbodimentPointerDown(
                cancelled,
                1,
                50,
                50,
                PRIMARY_BUTTON,
              );

            const freshUp =
              registerEmbodimentPointerUp(
                freshDown,
                1,
                50,
                50,
              );

            expect(
              freshUp.qualifiesAsTap,
            ).toBe(
              true,
            );
          },
        );
      },
    );

    describe(
      "primary button only",
      () => {
        it(
          "rejects a secondary (right) click even without any movement",
          () => {
            const down =
              registerEmbodimentPointerDown(
                EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
                1,
                100,
                100,

                SECONDARY_BUTTON,
              );

            const result =
              registerEmbodimentPointerUp(
                down,
                1,
                100,
                100,
              );

            expect(
              result.qualifiesAsTap,
            ).toBe(
              false,
            );
          },
        );

        it(
          "rejects a middle-button click even without any movement",
          () => {
            const down =
              registerEmbodimentPointerDown(
                EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
                1,
                100,
                100,

                MIDDLE_BUTTON,
              );

            const result =
              registerEmbodimentPointerUp(
                down,
                1,
                100,
                100,
              );

            expect(
              result.qualifiesAsTap,
            ).toBe(
              false,
            );
          },
        );

        it(
          "accepts an ordinary primary-button click",
          () => {
            const down =
              registerEmbodimentPointerDown(
                EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
                1,
                100,
                100,

                PRIMARY_BUTTON,
              );

            const result =
              registerEmbodimentPointerUp(
                down,
                1,
                100,
                100,
              );

            expect(
              result.qualifiesAsTap,
            ).toBe(
              true,
            );
          },
        );

        it(
          "accepts a touch contact, which always reports button 0 on pointerdown",
          () => {
            const down =
              registerEmbodimentPointerDown(
                EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
                1,
                100,
                100,

                PRIMARY_BUTTON,
              );

            const result =
              registerEmbodimentPointerUp(
                down,
                1,
                100,
                100,
              );

            expect(
              result.qualifiesAsTap,
            ).toBe(
              true,
            );
          },
        );
      },
    );

    it(
      "ignores a pointer-up from a different pointer id than the one that went down",
      () => {
        const down =
          registerEmbodimentPointerDown(
            EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
            1,
            100,
            200,
            PRIMARY_BUTTON,
          );

        const result =
          registerEmbodimentPointerUp(
            down,
            2,
            100,
            200,
          );

        expect(
          result.qualifiesAsTap,
        ).toBe(
          false,
        );
      },
    );

    it(
      "ignores a pointer-up when no gesture is currently active",
      () => {
        const result =
          registerEmbodimentPointerUp(
            EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
            1,
            100,
            200,
          );

        expect(
          result.qualifiesAsTap,
        ).toBe(
          false,
        );
      },
    );

    it(
      "honours an explicit movement threshold override",
      () => {
        const down =
          registerEmbodimentPointerDown(
            EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
            1,
            0,
            0,
            PRIMARY_BUTTON,
          );

        expect(
          registerEmbodimentPointerUp(
            down,
            1,
            50,
            0,

            100,
          ).qualifiesAsTap,
        ).toBe(
          true,
        );

        expect(
          registerEmbodimentPointerUp(
            down,
            1,
            50,
            0,

            10,
          ).qualifiesAsTap,
        ).toBe(
          false,
        );
      },
    );

    it(
      "rejects non-finite coordinates",
      () => {
        expect(() =>
          registerEmbodimentPointerDown(
            EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
            1,

            Number.NaN,

            0,
            PRIMARY_BUTTON,
          ),
        ).toThrow(
          RangeError,
        );

        const down =
          registerEmbodimentPointerDown(
            EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
            1,
            0,
            0,
            PRIMARY_BUTTON,
          );

        expect(() =>
          registerEmbodimentPointerMove(
            down,
            1,

            Number.POSITIVE_INFINITY,

            0,
          ),
        ).toThrow(
          RangeError,
        );

        expect(() =>
          registerEmbodimentPointerUp(
            down,
            1,

            Number.NaN,

            0,
          ),
        ).toThrow(
          RangeError,
        );
      },
    );

    it(
      "rejects a negative movement threshold",
      () => {
        const down =
          registerEmbodimentPointerDown(
            EMBODIMENT_NO_ACTIVE_POINTER_GESTURE,
            1,
            0,
            0,
            PRIMARY_BUTTON,
          );

        expect(() =>
          registerEmbodimentPointerUp(
            down,
            1,
            0,
            0,

            -1,
          ),
        ).toThrow(
          RangeError,
        );
      },
    );
  },
);
