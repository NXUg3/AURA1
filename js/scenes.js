import {NetworkClient,EVENTS} from './net.js';
export function createRoomFlow({showSelection,setOnlineMode,resetSelection,playConfirm,onGameAction,onRoomEnded}) {
  const net=new NetworkClient();
  const status=document.getElementById('room-status'),code=document.getElementById('room-code');
  const create=document.getElementById('room-create'),join=document.getElementById('room-join');
  const server=document.getElementById('room-server');
  server.value=net.options.url;
  let busy=false,notice;
  function message(text){status.textContent=text;}
  function enabled(value){create.disabled=join.disabled=code.disabled=server.disabled=!value;}
  function reveal(){for(const id of ['room-code-label','room-code','room-status','room-leave'])document.getElementById(id).hidden=false;code.maxLength=12;}
  function cancel(){clearTimeout(notice);net.disconnect();busy=false;enabled(true);}
  net.on('status',message);
  net.on(EVENTS.ready,()=>{if(!net.room)return;clearTimeout(notice);playConfirm();setOnlineMode(net);resetSelection();showSelection();});
  net.on(EVENTS.action,onGameAction);
  net.on(EVENTS.peerLeft,()=>{cancel();onRoomEnded('El rival salió. El combate terminó; puedes crear otra sala.');});
  net.on('disconnect',()=>{cancel();onRoomEnded('Se perdió la conexión. Vuelve a crear una sala o unirte.');});
  document.getElementById('room-leave').addEventListener('click',cancel);
  window.addEventListener('pagehide',cancel,{once:true});
  const enter=async role=>{
    if(busy||!['create','join'].includes(role))return;
    reveal();
    try {
      const url=new URL(server.value);if(!['http:','https:'].includes(url.protocol))throw Error('Usa una dirección HTTP o HTTPS para el servidor.');
      if(location.protocol==='https:'&&url.protocol!=='https:')throw Error('El servidor debe usar HTTPS para esta página.');
      net.options.url=url.origin;net.disconnect();busy=true;enabled(false);
      notice=setTimeout(()=>message('El servidor tarda en responder. Puedes salir de la sala e intentarlo de nuevo.'),5000);
      const info=await(role==='create'?net.createRoom():net.joinRoom(code.value));
      clearTimeout(notice);code.value=info.roomId;
      if(role==='create')message('Sala '+info.roomId+' · Comparte el código y espera al rival.');
    } catch(error){clearTimeout(notice);busy=false;enabled(true);message(error.message);}
  };
  enter.cancel=cancel;enter.net=net;return enter;
}
