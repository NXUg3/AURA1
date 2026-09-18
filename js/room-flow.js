import {NetworkClient} from './net.js';
import {bindOnlineSession} from './online.js';
import {el,button,group} from './dom.js';
export function renderRoom(host,app){
  app.net ||= new NetworkClient(globalThis.AXIE_NET||{});app.onlineDispose?.();app.net.leaveRoom();app.mode='LOCAL';app.onlineDispose=bindOnlineSession(app);
  const input=el('input','',{placeholder:'ABC123',maxLength:12}),status=el('p',app.netError||'Introduce un código o crea una sala.',{role:'status'});app.netError=null;
  input.setAttribute('aria-label','Código de sala');input.autocomplete='off';let busy=false,cancelled=false;
  const create=button('Crear Sala',()=>enter(true)),join=button('Unirse a Sala',()=>enter(false));
  async function enter(isHost){if(busy||cancelled)return;busy=true;create.disabled=join.disabled=true;status.textContent='Conectando…';
    try{const room=await(isHost?app.net.createRoom():app.net.joinRoom(input.value));if(cancelled){if(app.state!=='select')app.net.disconnect();return;}input.value=room.roomId;input.disabled=true;status.textContent=`Sala ${room.roomId} · ${room.role} · Esperando rival…`;}
    catch(error){if(!cancelled){status.textContent=error.message;busy=false;create.disabled=join.disabled=false;}}
  }
  host.append(group('panel',el('h1',app.t('room')),input,group('actions',create,join),status,button(app.t('back'),()=>{cancelled=true;app.onlineDispose?.();app.net.disconnect();app.mode='LOCAL';app.show('menu',{group:'multi'});})));
  return()=>{cancelled=true;};
}
