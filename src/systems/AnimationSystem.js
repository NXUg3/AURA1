export function getVisualState(fighter) {
  if (fighter.isDead) return 'defeat';
  if (fighter.hurtFlash > 0) return 'hurt';
  if (fighter.isAttacking) return fighter.attackType === 'special' ? 'special' : 'punch';
  if (fighter.overdriveActive) return 'overdrive';
  if (!fighter.onGround) return 'jump';
  return Math.abs(fighter.vx) > 0.5 ? 'walk' : 'idle';
}
export function getSteppedFps(state) { return ['punch','special','jump','hurt'].includes(state) ? 15 : 12; }
export function advanceSteppedAnimation(fighter,dtMs,overrideFps) {
  const next=getVisualState(fighter);
  if(next!==fighter.spriteState){fighter.spriteState=next;fighter.spriteTick=0;fighter.spriteFrame=0;return;}
  fighter.spriteTick+=dtMs;const interval=1000/(overrideFps||getSteppedFps(next));
  while(fighter.spriteTick>=interval){fighter.spriteTick-=interval;fighter.spriteFrame++;}
}
