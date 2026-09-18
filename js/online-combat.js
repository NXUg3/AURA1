const FIELDS=['x','y','vx','vy','hp','axp','facing','onGround','isAttacking','attackType','attackTimer','attackDuration','hitApplied','spriteState','spriteFrame','spriteTick','overdriveTimer','isDead'];
export function onlineStep(app,fighters,match,ms){
  if(app.mode!=='ONLINE')return false;
  if(app.net?.room?.role==='P2'){
    app.snapshotTick=(app.snapshotTick||0)+ms;
    if(app.snapshotTick>=33){app.snapshotTick=0;app.net.sendGameAction({type:'input',matchId:app.matchId,keys:readKeys(app)});}
    return true;
  }
  return false;
}
function readKeys(app){const names={left:'a',right:'d',jump:'w',basic:'j',special:'k',overdrive:'l'},pad=navigator.getGamepads?.()[0];return Object.entries(names).filter(([action])=>app.controls.keys.has(app.controls.map.p1[action])||(action==='left'&&pad?.axes[0]<-.3)||(action==='right'&&pad?.axes[0]>.3)||pad?.buttons[{jump:0,basic:2,special:3,overdrive:1}[action]]?.pressed).map(([,key])=>key);}
export function applyRemoteControls(app,fighter,audio){const keys=app.controls.keys,names={a:'left',d:'right',w:'jump',j:'basic',k:'special',l:'overdrive'};app.controls.keys=new Set([...(Date.now()-(app.remoteAt||0)<500?app.remoteKeys||[]:[])].map(key=>app.controls.map.p1[names[key]]));try{app.controls.apply(fighter,'p1',-1,audio);}finally{app.controls.keys=keys;}}
export function publishSnapshot(app,fighters,match,ms){if(app.mode!=='ONLINE'||app.net.room?.role!=='P1')return;app.snapshotTick=(app.snapshotTick||0)+ms;if(app.snapshotTick<50)return;app.snapshotTick=0;app.net.sendSnapshot({matchId:app.matchId,seq:++app.snapshotSeq,fighters:fighters.map(f=>Object.fromEntries(FIELDS.map(key=>[key,f[key]]))),match:{phase:match.phase,elapsed:match.elapsed,remaining:match.remaining,wins:match.wins,round:match.round}});}
export function receiveSnapshot(app,fighters,match,data){
  if(!Number.isSafeInteger(data.seq)||data.seq<=app.lastSnapshot||!Array.isArray(data.fighters)||data.fighters.length!==2||!data.match)return;
  if(!data.fighters.every(f=>Number.isFinite(f.x)&&Number.isFinite(f.y)&&Number.isFinite(f.hp)))return;
  const m=data.match;if(!['countdown','active','round-end','complete'].includes(m.phase)||!Array.isArray(m.wins)||m.wins.length!==2||!m.wins.every(v=>Number.isInteger(v)&&v>=0&&v<=2)||!Number.isFinite(m.remaining))return;
  app.lastSnapshot=data.seq;data.fighters.forEach((state,i)=>{for(const field of FIELDS)if(Object.hasOwn(state,field))fighters[i][field]=state[field];});
  for(const key of ['phase','elapsed','remaining','wins','round'])match[key]=m[key];
  if(m.phase==='complete'&&app.state==='battle')app.show('victory',{side:m.wins[0]===2?0:1});
}
