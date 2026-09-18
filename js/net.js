export const DEFAULT_SERVER_URL='https://axie-smash-server.onrender.com';
export class NetworkClient {
  constructor(options={}){this.options={url:DEFAULT_SERVER_URL,path:'/socket.io',timeout:60000,...options};this.listeners=new Map();this.room=null;this.socket=null;this.sequence=0;this.clockOffset=0;}
  on(event,fn){if(!this.listeners.has(event))this.listeners.set(event,new Set());this.listeners.get(event).add(fn);return()=>this.listeners.get(event)?.delete(fn);}
  publish(event,data){for(const fn of [...(this.listeners.get(event)||[])])fn(data);}
  async connect(){if(this.socket?.connected)return this;if(this.connecting)return this.connecting;this.connecting=this.open().finally(()=>this.connecting=null);return this.connecting;}
  async open(){
    const o=this.options;if(!o.url)throw Error('Configura la URL del servidor Socket.io');
    let factory=o.ioFactory||globalThis.io;
    if(!factory){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=o.clientScript||new URL(o.path.replace(/\/$/,'')+'/socket.io.js',o.url).href;const timer=setTimeout(()=>{script.remove();reject(Error('Tiempo agotado cargando Socket.io'));},o.timeout);script.onload=()=>{clearTimeout(timer);resolve();};script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error('No se pudo cargar Socket.io'));};document.head.append(script);});factory=globalThis.io;}
    if(typeof factory!=='function')throw Error('Cliente Socket.io no disponible');
    if(!this.socket){this.socket=factory(o.url,{path:o.path,auth:o.auth||{},autoConnect:false,reconnection:false,timeout:o.timeout});
      for(const event of ['selection:state','match:start','game:action','game:snapshot','room:peer-left'])this.socket.on(event,data=>{if(data?.roomId===this.room?.roomId)this.publish(event,data);});
      this.socket.on('room:ready',data=>{this.pendingReady=data;if(data?.roomId===this.room?.roomId)this.publish('room:ready',data);});
      this.socket.on('disconnect',reason=>{const hadRoom=!!this.room;this.room=null;this.pendingReady=null;if(hadRoom)this.publish('disconnect',reason);});
    }
    await new Promise((resolve,reject)=>{const s=this.socket;const cleanup=()=>{clearTimeout(timer);s.off('connect',ok);s.off('connect_error',fail);};const ok=()=>{cleanup();resolve();};const fail=e=>{cleanup();s.disconnect();reject(e);};const timer=setTimeout(()=>fail(Error('Servidor no disponible')),o.timeout);s.once('connect',ok);s.once('connect_error',fail);s.connect();});return this;
  }
  async request(event,data={}){await this.connect();const sent=Date.now();return new Promise((resolve,reject)=>this.socket.timeout(this.options.timeout).emit(event,data,(error,response)=>{if(error)return reject(Error('El servidor no respondió a '+event));if(!response?.ok)return reject(Error(response?.error||'Solicitud rechazada'));if(Number.isFinite(response.serverNow))this.clockOffset=response.serverNow-(sent+Date.now())/2;resolve(response);}));}
  async enter(event,data){if(this.room||this.entering)throw Error('Ya estás creando o dentro de una sala');this.entering=true;const generation=this.generation||0;try{const response=await this.request(event,data);if(generation!==(this.generation||0)){this.socket?.disconnect();throw Error('Entrada cancelada');}if(!/^[A-Z0-9]{6,12}$/.test(response.roomId)||!['P1','P2'].includes(response.role))throw Error('Respuesta de sala inválida');this.room={roomId:response.roomId,role:response.role};this.sequence=0;if(this.pendingReady?.roomId===response.roomId)queueMicrotask(()=>{if(this.room)this.publish('room:ready',this.pendingReady);});return {...this.room};}finally{this.entering=false;}}
  createRoom(){return this.enter('room:create',{});}
  joinRoom(roomId){const id=String(roomId||'').trim().toUpperCase();if(!/^[A-Z0-9]{6,12}$/.test(id))return Promise.reject(Error('Código alfanumérico de 6 a 12 caracteres requerido'));return this.enter('room:join',{roomId:id});}
  selectCharacter(character,ready=false){return this.request('selection:set',{roomId:this.room?.roomId,character,ready});}
  sendGameAction(data){if(!this.socket?.connected||!this.room)return false;this.socket.emit('game:action',{...data,roomId:this.room.roomId,seq:++this.sequence});return true;}
  sendSnapshot(data){if(!this.socket?.connected||this.room?.role!=='P1')return false;(data.match?.phase==='complete'?this.socket:this.socket.volatile).emit('game:snapshot',{...data,roomId:this.room.roomId});return true;}
  leaveRoom(){if(this.socket?.connected&&this.room)this.socket.emit('room:leave',{roomId:this.room.roomId});this.room=null;this.pendingReady=null;}
  disconnect(){this.generation=(this.generation||0)+1;this.leaveRoom();this.socket?.disconnect();}
}
