import {ORDER,ROSTER} from './config.js';
import {el,button,group} from './dom.js';
import {localized} from './i18n.js';
import {renderLobby} from './lobby.js';
import {displayOptions} from './display-options.js';
export function renderPanel(host,app,page){const t=app.t,lang=app.settings.lang,panel=group('panel',el('h1',t(page)));host.append(panel);if(page==='room')return renderLobby(panel,app);
  if(page==='options'){
    displayOptions(panel,app);
    const select=el('select');for(const [value,text]of [['es','Español'],['en','English'],['ja','日本語']])select.append(el('option',text,{value,selected:lang===value}));const label=el('label',t('language'));label.append(select);panel.append(label);
    select.onchange=()=>{app.settings.lang=select.value;app.saveSettings();app.show('options');};const slider=el('input','',{type:'range',min:0,max:100,value:app.settings.masterVol});const volume=el('label',t('volume'));volume.append(slider);panel.append(volume);slider.oninput=()=>{app.settings.masterVol=+slider.value;app.audio.setVolume(+slider.value/100);app.saveSettings();};panel.append(button(t('reload'),async()=>{panel.replaceChildren(el('p',t('loading')));try{await app.assets.refresh();app.audio.refresh();app.show('options');}catch(error){panel.append(el('p',error.message),button(t('back'),()=>app.show('menu')));}}));
  }else if(page==='controls'){
    panel.append(el('p',localized(lang,'Pulsa un botón para reasignar su tecla. Gamepad: eje horizontal, A salto, X básico, Y especial, B Overdrive.','Click a button to remap its key. Gamepad: horizontal axis, A jump, X basic, Y special, B Overdrive.','ボタンを押してキーを変更。ゲームパッド：横軸移動、Aジャンプ、X通常、Y必殺、Bオーバードライブ。')));
    let listening=null;const labels={es:['Izquierda','Derecha','Salto','Básico','Especial','Overdrive'],en:['Left','Right','Jump','Basic','Special','Overdrive'],ja:['左','右','ジャンプ','通常','必殺','オーバードライブ']};
    for(const side of ['p1','p2']){panel.append(el('h2',side.toUpperCase()));const buttons=group('actions');Object.entries(app.controls.map[side]).forEach(([action,key],i)=>{const b=button(labels[lang][i]+': '+key,()=>{listening={side,action,b,label:labels[lang][i]};b.textContent='…';});buttons.append(b);});panel.append(buttons);}
    const handler=e=>{if(!listening)return;e.preventDefault();e.stopImmediatePropagation();if(e.key!=='Escape'){app.controls.map[listening.side][listening.action]=e.key.toLowerCase();app.controls.save();listening.b.textContent=listening.label+': '+e.key;}else listening.b.textContent=listening.label+': '+app.controls.map[listening.side][listening.action];listening=null;};window.addEventListener('keydown',handler,true);return ()=>window.removeEventListener('keydown',handler,true);
  }else if(page==='credits'){
    panel.append(el('h2','Axie Smash'),el('p','VibeAthon Edition'),el('p','GameX · Axie Infinity · Sky Mavis'),el('p','AI Assisted: Codex - OpenAI • Claude Code - Anthropic'),el('p','Art: GPT · Gemini · Qwen'));
  }else if(page==='profile')panel.append(el('p',JSON.stringify(app.stats)));
  else{
    panel.append(el('p',localized(lang,'Lucha 1 contra 1. Gana dos rondas; con 1–1 se juega Round Final. El empate repite la ronda.','Fight 1 versus 1. Win two rounds; 1–1 triggers Final Round. A draw repeats the round.','1対1対戦。2ラウンド先取で勝利。1対1で最終ラウンド。引き分けは再試合。')),el('p',localized(lang,'Muévete, salta y combina ataques básicos y especiales. Los golpes cargan AXP. Con 100 AXP activa Overdrive para mejorar velocidad y daño temporalmente.','Move, jump and combine basic and special attacks. Hits charge AXP. At 100 AXP, activate Overdrive for a temporary speed and damage boost.','移動、ジャンプ、通常攻撃と必殺技を使用。命中でAXPを獲得。100でオーバードライブを発動し速度とダメージを強化。')));
    for(const key of ORDER){const d=ROSTER[key];if(d.playable)panel.append(el('p',`${d.label} · ${d.element} · HP ${d.combat.hp} · SPD ${d.combat.speed} · DMG ${d.combat.basicDamage}/${d.combat.specialDamage}`));}
  }
}
