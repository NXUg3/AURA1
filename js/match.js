export class Match{
  constructor(onRound,onVictory){this.onRound=onRound;this.onVictory=onVictory;this.reset();}
  reset(){this.wins=[0,0];this.round=1;this.begin();}
  begin(){this.phase='countdown';this.elapsed=0;this.remaining=60000;this.onRound?.();}
  get final(){return this.wins[0]===1&&this.wins[1]===1;}
  step(ms){if(this.phase==='countdown'){this.elapsed+=ms;if(this.elapsed>=2700)this.phase='active';}else if(this.phase==='round-end'){this.elapsed+=ms;if(this.elapsed>=1700){if(this.winner!==-1)this.round++;this.begin();}}else if(this.phase==='active')this.remaining=Math.max(0,this.remaining-ms);}
  award(side){if(this.phase!=='active')return;this.winner=side;if(side!==-1)this.wins[side]++;this.elapsed=0;this.phase='round-end';if(side!==-1&&this.wins[side]===2){this.phase='complete';this.onVictory?.(side);}}
}
