import {ROSTER} from './config.js';
import {el,button,image,group} from './dom.js';
import {renderSelection} from './selection.js';
import {renderPanel} from './panels.js';
import {menuDescription} from './menu-copy.js';
export class Scenes{
  constructor(app){this.app=app;this.host=document.getElementById('scene');this.dispose=null;}
  show(name,options={}){const app=this.app,t=app.t,host=this.host;this.dispose?.();this.dispose=null;app.state=name;app.hud.hide();host.hidden=name==='battle';host.replaceChildren();host.className='screen';document.documentElement.lang=app.settings.lang;
    const music=['select','vs'].includes(name)?'select':['battle','victory'].includes(name)?'battle':['intro','title'].includes(name)?'title':'menu';app.audio.play(music);
    document.getElementById('touch').hidden=name!=='battle'||!matchMedia('(pointer:coarse)').matches;
    if(name==='battle')return;
    if(name==='intro'){host.classList.add('intro');const video=el('video','',{src:app.assets.url('assets/video/intro.mp4'),playsInline:true,preload:'metadata'}),skip=button(t('skip'),()=>app.show('title'));host.append(video,skip);video.onended=()=>app.show('title');video.onerror=()=>app.show('title');video.play().catch(()=>{const play=button(t('play'),()=>{video.play().catch(()=>app.show('title'));play.remove();});play.style.right='25%';host.append(play);});this.dispose=()=>{video.pause();video.removeAttribute('src');video.load();};}
    else if(name==='title'){host.classList.add('title');host.append(image(app.assets.url('assets/ui/game-logo.png'),'Axie Smash'),button('PRESS START',()=>app.show('menu')));const handler=()=>app.show('menu');window.addEventListener('keydown',handler,{once:true});this.dispose=()=>window.removeEventListener('keydown',handler);}
    else if(name==='menu')this.menu(options.group||'root');
    else if(name==='select')this.dispose=renderSelection(host,app);
    else if(name==='vs'){host.classList.add('vs');app.selected.forEach(key=>host.append(group('versus-art',image(app.assets.portrait(key),ROSTER[key].label),el('h1',ROSTER[key].label))));host.append(el('strong','VS',{className:'vs-mark'}));const timer=setTimeout(()=>app.startMatch(),1900);this.dispose=()=>clearTimeout(timer);}
    else if(name==='victory'){host.append(group('panel',el('h1',t('victory')+' · '+ROSTER[app.selected[options.side]].label),group('actions',button(t('rematch'),()=>app.startMatch()),button(t('menu'),()=>app.show('menu')))));}
    else{this.dispose=renderPanel(host,app,name);host.append(button(t('back'),()=>app.show(options.returnTo||'menu',options.returnTo?{}:{group:['guide','controls','credits'].includes(name)?'help':'root'}),false));host.lastChild.className='back';}
  }
  menu(name){const app=this.app,t=app.t,host=this.host;host.classList.add('menu');host.append(el('h1',t(name==='root'?'menu':name)));const list=group('menu-list');
    const menus={root:['arcade','versus','multi','profile','help','controls','options','credits','exit'],local:['arcade','versus','campaign','tournaments'],multi:['quick','ranked','room'],help:['guide','local']},blocked=new Set(['campaign','tournaments','quick','ranked']);
    const open=id=>{app.audio.tone();if(menus[id])app.show('menu',{group:id});else if(id==='arcade'||id==='versus'){app.mode=id==='arcade'?'AI':'LOCAL';app.show('select');}else if(id==='exit')app.show('title');else app.show(id);};
    const description=el('p',menuDescription(app.settings.lang,menus[name][0]),{className:'menu-description'});
    for(const id of menus[name]){const b=button(t(id),()=>open(id),blocked.has(id));b.onmouseenter=b.onfocus=()=>{description.textContent=menuDescription(app.settings.lang,id);};if(blocked.has(id))b.append(el('span',t('soon'),{className:'soon'}));list.append(b);}host.append(list,description);
    if(name!=='root'){const back=button(t('back'),()=>app.show('menu'));back.className='back';host.append(back);}
    const handler=e=>{if(e.key==='Escape')app.show(name==='root'?'title':'menu');if(['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();const enabled=[...list.children].filter(b=>!b.disabled),i=enabled.indexOf(document.activeElement);enabled[(i+(e.key==='ArrowDown'?1:-1)+enabled.length)%enabled.length]?.focus();}};window.addEventListener('keydown',handler);this.dispose=()=>window.removeEventListener('keydown',handler);
  }
}
