import { describe, expect, it } from "vitest";

import { moveAlongDirection } from "../../src/simulation/actions/movement.js";

describe("movement execution", () => {
  const bounds = {
    minX: 0,
    minY: 0,
    maxX: 10,
    maxY: 10,
  };

  it("moves along a perceived direction", () => {
    const result = moveAlongDirection(
      { x: 1, y: 1 },
      1,
      0,
      2,
      bounds,
    );

    expect(result.position).toEqual({
      x: 3,
      y: 1,
    });

    expect(result.distanceMoved).toBeCloseTo(2);
  });

  it("normalises direction before applying movement distance", () => {
    const result = moveAlongDirection(
      { x: 0, y: 0 },
      3,
      4,
      5,
      bounds,
    );

    expect(result.position.x).toBeCloseTo(3);
    expect(result.position.y).toBeCloseTo(4);
    expect(result.distanceMoved).toBeCloseTo(5);
  });

  it("respects world bounds", () => {
    const result = moveAlongDirection(
      { x: 9, y: 5 },
      1,
      0,
      5,
      bounds,
    );

    expect(result.position).toEqual({
      x: 10,
      y: 5,
    });

    expect(result.distanceMoved).toBeCloseTo(1);
  });

  it("does not move when direction has zero magnitude", () => {
    const position = { x: 4, y: 4 };

    const result = moveAlongDirection(
      position,
      0,
      0,
      2,
      bounds,
    );

    expect(result.position).toEqual(position);
    expect(result.distanceMoved).toBe(0);
  });
});