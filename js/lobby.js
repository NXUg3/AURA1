import {el,button,group} from './dom.js';
import {localized} from './i18n.js';
export function renderLobby(panel,app){const t=app.t,lang=app.settings.lang,status=el('p','',{role:'status'}),code=el('input','',{maxLength:6,placeholder:'ABC123'}),token=Math.random().toString(36).slice(2);let channel=null,timeout=null,host=false,peer='';
  const say=(es,en,ja)=>status.textContent=localized(lang,es,en,ja);
  panel.append(el('p',localized(lang,'Lobby local entre pestañas del mismo navegador y URL. No sincroniza combates; el juego online requiere un servidor.','Local lobby between tabs at the same URL. Fights are not synchronized; online play requires a server.','同じURLのタブ間ロビーです。試合は同期されません。オンライン対戦はサーバーが必要です。')));
  const label=el('label',t('code'));label.append(code);panel.append(label);
  function close(){clearTimeout(timeout);if(channel){channel.postMessage({type:'leave',token});channel.close();}channel=null;peer='';}
  function connect(create){close();if(!window.BroadcastChannel){say('Navegador no compatible.','Browser unsupported.','非対応です。');return;}host=create;const value=create?Array.from(crypto.getRandomValues(new Uint8Array(6)),x=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[x%32]).join(''):code.value.trim().toUpperCase();if(!/^[A-Z2-9]{6}$/.test(value)){say('Código inválido.','Invalid code.','無効なコードです。');return;}code.value=value;channel=new BroadcastChannel('axie-room-'+value);say('Esperando…','Waiting…','待機中…');
    channel.onmessage=({data})=>{if(!data)return;if(host&&data.type==='join'){const accepted=!peer||peer===data.token;if(accepted)peer=data.token;channel.postMessage({type:accepted?'accepted':'full',target:data.token,token});if(accepted)say('Dos jugadores conectados.','Two players connected.','2人接続しました。');}else if(!host&&data.target===token){clearTimeout(timeout);if(data.type==='accepted'){peer=data.token;say('Conectado al lobby.','Joined lobby.','参加しました。');}else if(data.type==='full'){close();say('Sala llena.','Room full.','満員です。');}}else if(data.type==='leave'&&data.token===peer){if(!host)close();peer='';say('El otro jugador salió.','Player left.','相手が退出しました。');}};
    if(!host){channel.postMessage({type:'join',token});timeout=setTimeout(()=>{if(!peer){close();say('Sala no encontrada.','Room not found.','見つかりません。');}},2200);}
  }
  panel.append(group('actions',button(t('create'),()=>connect(true)),button(t('join'),()=>connect(false))),status);
  window.addEventListener('pagehide',close);return ()=>{close();window.removeEventListener('pagehide',close);};
}
