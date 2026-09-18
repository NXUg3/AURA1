import {ORDER,ROSTER} from './config.js';
export function bindOnlineSession(app){
  const net=app.net;let startTimer,lastMatch=null;
  const selection=data=>{if(!Array.isArray(data.selected)||data.selected.length!==2||!data.selected.every(key=>ROSTER[key]?.playable))return false;app.selected=[...data.selected];app.cursor=data.selected.map(key=>ORDER.indexOf(key));return true;};
  const fail=()=>{clearTimeout(startTimer);net.leaveRoom();app.mode='LOCAL';app.netError='Rival desconectado. Crea o únete a otra sala.';app.show('room');};
  const off=[net.on('room:ready',data=>{if(app.state!=='room'||!selection(data))return;app.mode='ONLINE';app.room=net.room;app.controls.keys.clear();app.show('select');}),
    net.on('selection:state',data=>{if(app.state==='select'&&selection(data))app.refreshSelection?.();}),
    net.on('match:start',data=>{if(app.state!=='select'||!data.matchId||data.matchId===lastMatch||!Number.isFinite(data.startAt)||!selection(data))return;lastMatch=data.matchId;app.matchId=data.matchId;app.remoteSeq=0;app.remoteKeys=new Set();app.snapshotTick=0;app.snapshotSeq=0;app.lastSnapshot=-1;app.show('vs');clearTimeout(startTimer);startTimer=setTimeout(()=>{if(app.state==='vs')app.startMatch();},Math.max(0,data.startAt-Date.now()-net.clockOffset));}),
    net.on('game:action',data=>{if(app.mode==='ONLINE'&&net.room?.role==='P1'&&data.matchId===app.matchId&&data.role==='P2'&&data.type==='input'&&Number.isSafeInteger(data.seq)&&data.seq>(app.remoteSeq||0)&&Array.isArray(data.keys)){app.remoteAt=Date.now();app.remoteSeq=data.seq;app.remoteKeys=new Set(data.keys.filter(key=>['a','d','w','j','k','l'].includes(key)));}}),
    net.on('game:snapshot',data=>{if(app.mode==='ONLINE'&&net.room?.role==='P2'&&data.matchId===app.matchId)app.applyOnlineSnapshot?.(data);}),
    net.on('room:peer-left',fail),net.on('disconnect',fail)];
  return()=>{clearTimeout(startTimer);off.forEach(fn=>fn());app.refreshSelection=null;};
}
