export function getVisualState(fighter) {
  if (fighter.isAttacking) return 'punch';
  if (!fighter.onGround) return 'jump';
  return Math.abs(fighter.vx) > 0.5 ? 'walk' : 'idle';
}

export function getSteppedFps(state) {
  return state === 'punch' || state === 'jump' ? 15 : 12;
}

export function advanceSteppedAnimation(fighter, dtMs) {
  const nextState = getVisualState(fighter);
  if (nextState !== fighter.spriteState) {
    fighter.spriteState = nextState;
    fighter.spriteTick = 0;
    fighter.spriteFrame = 0;
    return;
  }
  const interval = 1000 / getSteppedFps(nextState);
  fighter.spriteTick += dtMs;
  while (fighter.spriteTick >= interval) {
    fighter.spriteTick -= interval;
    fighter.spriteFrame++;
  }
}
