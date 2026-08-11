export interface Position2D {
  readonly x: number;
  readonly y: number;
}

export interface MovementBounds {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

export interface MovementResult {
  readonly position: Position2D;
  readonly distanceMoved: number;
}

export function moveAlongDirection(
  position: Position2D,
  directionX: number,
  directionY: number,
  distance: number,
  bounds: MovementBounds,
): MovementResult {
  if (!Number.isFinite(directionX) || !Number.isFinite(directionY)) {
    throw new RangeError("Movement direction must be finite.");
  }

  if (!Number.isFinite(distance) || distance < 0) {
    throw new RangeError("Movement distance must be finite and non-negative.");
  }

  validateBounds(bounds);

  const magnitude = Math.hypot(directionX, directionY);

  if (magnitude === 0 || distance === 0) {
    return {
      position,
      distanceMoved: 0,
    };
  }

  const normalisedX = directionX / magnitude;
  const normalisedY = directionY / magnitude;

  const targetX = position.x + normalisedX * distance;
  const targetY = position.y + normalisedY * distance;

  const x = clamp(targetX, bounds.minX, bounds.maxX);
  const y = clamp(targetY, bounds.minY, bounds.maxY);

  return {
    position: { x, y },
    distanceMoved: Math.hypot(x - position.x, y - position.y),
  };
}

function validateBounds(bounds: MovementBounds): void {
  const values = [
    bounds.minX,
    bounds.minY,
    bounds.maxX,
    bounds.maxY,
  ];

  if (!values.every(Number.isFinite)) {
    throw new RangeError("Movement bounds must be finite.");
  }

  if (bounds.minX > bounds.maxX || bounds.minY > bounds.maxY) {
    throw new RangeError("Movement bounds are invalid.");
  }
}

function clamp(
  value: number,
  minimum: number,
  maximum: number,
): number {
  return Math.min(maximum, Math.max(minimum, value));
}