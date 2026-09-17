import {ORDER,PLAYABLE,ROSTER} from './config.js';
import {el,button,image,group} from './dom.js';
export function renderSelection(host,app){const t=app.t;host.className='screen select';const title=el('h1',t('select')),previews=group('previews'),slots=group('slots');const panels=[group('preview'),group('preview')];previews.append(...panels);const confirm=button(t('confirm'),()=>{if(valid())app.show('vs');});
  const valid=()=>app.cursor.every(i=>ROSTER[ORDER[i]].playable);
  function refresh(){for(let side=0;side<2;side++){const key=ORDER[app.cursor[side]],d=ROSTER[key];panels[side].replaceChildren(image(app.assets.portrait(key),d.label),el('h2',d.label.toUpperCase()+(d.playable?'':' 🔒')),el('p',side===1&&app.mode==='AI'?'CPU':'P'+(side+1)));}for(const [i,slot]of [...slots.children].entries()){slot.classList.toggle('p1',i===app.cursor[0]);slot.classList.toggle('p2',i===app.cursor[1]);}confirm.disabled=!valid();}
  function cursor(side,index){app.cursor[side]=(index+8)%8;const key=ORDER[app.cursor[side]];if(ROSTER[key].playable)app.selected[side]=key;app.audio.tone();refresh();}
  ORDER.forEach((key,index)=>{const d=ROSTER[key],slot=button('',()=>cursor(0,index));slot.className='slot'+(d.playable?'':' locked');slot.setAttribute('aria-label',d.label+(d.playable?'':' 🔒'));slot.append(image(app.assets.logo(key),d.label),el('span',d.label.toUpperCase()+(d.playable?'':' 🔒')));slot.onpointerenter=()=>cursor(0,index);slots.append(slot);});
  const random=button(t('random'),()=>{for(let side=0;side<2;side++){const key=PLAYABLE[Math.floor(Math.random()*4)];app.selected[side]=key;app.cursor[side]=ORDER.indexOf(key);}refresh();});
  host.append(title,previews,slots,group('select-actions',confirm,random,button(t('controls'),()=>app.show('controls',{returnTo:'select'})),button(t('back'),()=>app.show('menu',{group:'local'}))));refresh();
  const keys={w:[0,-4],s:[0,4],a:[0,-1],d:[0,1],arrowup:[1,-4],arrowdown:[1,4],arrowleft:[1,-1],arrowright:[1,1]};
  const handler=e=>{const key=e.key.toLowerCase();if(keys[key]){e.preventDefault();const [side,delta]=keys[key];cursor(side,app.cursor[side]+delta);}else if(key==='enter'&&valid()){e.preventDefault();app.show('vs');}else if(key==='escape')app.show('menu',{group:'local'});};window.addEventListener('keydown',handler);return ()=>window.removeEventListener('keydown',handler);
}
