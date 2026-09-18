import assert from 'node:assert/strict';
import {NetworkClient,DEFAULT_SERVER_URL} from '../js/net.js';
assert.equal(new NetworkClient().options.url,'https://axie-smash-server.onrender.com');
assert.equal(DEFAULT_SERVER_URL,'https://axie-smash-server.onrender.com');
import {bindOnlineSession} from '../js/online.js';
const rooms=new Map();let count=0;
class Socket {
  constructor(){this.handlers=new Map();this.connected=false;this.volatile=this;this.id=++count;}
  on(e,f){if(!this.handlers.has(e))this.handlers.set(e,new Set());this.handlers.get(e).add(f);return this;}
  once(e,f){const wrapper=d=>{this.off(e,wrapper);f(d);};return this.on(e,wrapper);}
  off(e,f){this.handlers.get(e)?.delete(f);}
  receive(e,d){for(const f of [...this.handlers.get(e)||[]])f(d);}
  connect(){this.connected=true;queueMicrotask(()=>this.receive('connect'));}
  disconnect(){this.connected=false;this.receive('disconnect','test');}
  timeout(){return this;}
  emit(event,data,ack){
    const ok=d=>ack?.(null,{ok:true,serverNow:Date.now(),...d});
    if(event==='room:create'){rooms.set('ABC123',{players:[this],selected:['oleg','kotaro'],ready:[false,false]});this.role='P1';ok({roomId:'ABC123',role:'P1'});}
    if(event==='room:join'){const room=rooms.get(data.roomId);if(!room)return ack(null,{ok:false,error:'Sala no encontrada'});if(room.players.length===2)return ack(null,{ok:false,error:'Sala llena'});room.players.push(this);this.role='P2';room.players.forEach(s=>s.receive('room:ready',{roomId:data.roomId,selected:room.selected}));ok({roomId:data.roomId,role:'P2'});}
    if(event==='selection:set'){const room=rooms.get(data.roomId),side=this.role==='P1'?0:1;room.selected[side]=data.character;room.ready[side]=data.ready;room.players.forEach(s=>s.receive('selection:state',{roomId:data.roomId,selected:room.selected}));ok({});if(room.ready.every(Boolean))room.players.forEach(s=>s.receive('match:start',{roomId:data.roomId,matchId:'match1',selected:room.selected,startAt:Date.now()+50}));}
    if(event==='game:action'||event==='game:snapshot'){const room=rooms.get(data.roomId);room.players.filter(s=>s!==this).forEach(s=>s.receive(event,{...data,role:this.role}));}
  }
}
const factory=()=>new Socket();const p1=new NetworkClient({ioFactory:factory,url:'http://test'}),p2=new NetworkClient({ioFactory:factory,url:'http://test'});
const makeApp=net=>({net,state:'room',selected:['oleg','kotaro'],cursor:[0,7],controls:{keys:new Set()},show(name){this.state=name;},startMatch(){this.state='battle';}});
const a=makeApp(p1),b=makeApp(p2),offA=bindOnlineSession(a),offB=bindOnlineSession(b);
assert.deepEqual(await p1.createRoom(),{roomId:'ABC123',role:'P1'});assert.equal(a.state,'room');
await assert.rejects(p2.joinRoom('NO'),/Código/);await assert.rejects(p2.joinRoom('ZZZZZZ'),/no encontrada/);
assert.deepEqual(await p2.joinRoom(' abc123 '),{roomId:'ABC123',role:'P2'});await Promise.resolve();
assert.equal(a.state,'select');assert.equal(b.state,'select');
const third=new NetworkClient({url:'http://test',ioFactory:factory});await assert.rejects(third.joinRoom('ABC123'),/llena/);
await p1.selectCharacter('buba',true);assert.deepEqual(b.selected,['buba','kotaro']);assert.equal(a.state,'select');
await p2.selectCharacter('pomodoro',true);assert.equal(a.state,'vs');assert.equal(b.state,'vs');
p2.sendGameAction({matchId:'match1',type:'input',keys:['j','invalid']});assert.deepEqual([...a.remoteKeys],['j']);
await new Promise(resolve=>setTimeout(resolve,65));assert.equal(a.state,'battle');assert.equal(b.state,'battle');
offA();offB();p1.disconnect();assert.equal(p1.sendGameAction({}),false);p2.disconnect();third.disconnect();
console.log('OK: P1/P2, código normalizado, sala llena/inexistente, ready antes del ACK, selección compartida, VS sincronizado, inputs y desconexión.');
