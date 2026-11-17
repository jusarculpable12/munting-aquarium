export type SwimPosition = { x: number; y: number; direction: number; facing?: number };

/** Keep the nose aligned with movement and ease through a brief edge-on turn. */
export function swimToward(position: SwimPosition, target: { x: number; y: number }, seconds: number, speed: number): SwimPosition {
  const dx = target.x - position.x;
  const dy = target.y - position.y;
  const distance = Math.hypot(dx, dy);
  const dt = Math.max(0, Math.min(seconds, 0.05));
  const direction = Math.abs(dx) > 0.05 ? Math.sign(dx) : position.direction;
  const previousFacing = position.facing ?? position.direction;
  const facing = previousFacing + Math.sign(direction - previousFacing) * Math.min(Math.abs(direction - previousFacing), dt * 6);
  // Slow down for the turn and wait until the nose faces the new direction.
  const turningSpeed = facing * direction <= 0 ? 0 : Math.abs(facing);
  const step = Math.min(distance, speed * dt * turningSpeed);
  const fraction = distance > 0 ? step / distance : 0;
  return {
    x: position.x + dx * fraction,
    y: position.y + dy * fraction,
    direction,
    facing,
  };
}
