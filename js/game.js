import {WORLD,ROSTER,STATES,readSettings,SETTINGS_KEY} from './config.js';
import {Assets} from './assets.js';
import {AudioManager} from './audio.js';
import {FixedStepLoop} from './loop.js';
import {createFighterClass} from './fighter.js';
import {advanceSteppedAnimation} from './animation.js';
import {Renderer} from './renderer.js';
import {Controls} from './controls.js';
import {Match} from './match.js';
import {Hud} from './hud.js';
import {Scenes} from './scenes.js';
import {translate} from './i18n.js';
const assets=new Assets(),settings=readSettings(),audio=new AudioManager(settings.masterVol/100),controls=new Controls(),hud=new Hud(assets);
let storedStats={matches:0,p1Wins:0,p2Wins:0,overdrivesUsed:0};try{storedStats={...storedStats,...JSON.parse(localStorage.getItem('axieSmashModularStats')||'{}')};}catch{}
const app={assets,settings,audio,controls,hud,stats:storedStats,state:'loading',mode:'LOCAL',selected:['oleg','kotaro'],cursor:[0,7],t:key=>translate(settings.lang,key),saveSettings:()=>{try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(settings));}catch{}},saveStats:()=>{try{localStorage.setItem('axieSmashModularStats',JSON.stringify(app.stats));}catch{}}};
const scenes=new Scenes(app);app.show=(name,options)=>scenes.show(name,options);
const renderer=new Renderer(document.getElementById('game'),assets);let fighters=[],effects=[],aiCooldown=0;
app.applyDisplay=()=>{const canvas=document.getElementById('game'),large=settings.resolution==='1920x1080';canvas.width=large?1920:1280;canvas.height=large?1080:720;renderer.ctx.setTransform(canvas.width/WORLD.width,0,0,canvas.height/WORLD.height,0,0);document.getElementById('stage').style.maxWidth=canvas.width+'px';};app.applyDisplay();audio.setSfxVolume(settings.sfxVol/100);
function effect(x,y,text,type){effects.push({x,y,text,type,life:30});}
const Fighter=createFighterClass({worldWidth:WORLD.width,groundY:WORLD.ground,defaultSpriteHeight:130,gravity:WORLD.gravity,roster:ROSTER,spriteRegistry:assets.sprites,axpMax:100,axpGainBasic:10,axpGainSpecial:18,overdriveFrames:240,overdriveSpeedMultiplier:1.4,overdriveDamageMultiplier:1.5,animationSystem:advanceSteppedAnimation,renderer:f=>renderer.drawFighter(f),audio,statistics:app.stats,saveStatistics:app.saveStats,spawnOverdriveBanner:type=>effect(640,290,'OVERDRIVE',type),spawnDamageNumber:(x,y,text)=>effect(x,y,String(text)),onDefeated:f=>{if(app.state==='battle')match.award(f.side==='p1'?1:0);}});
const match=new Match(()=>{fighters=app.selected.map((type,i)=>new Fighter({x:i?950:250,facing:i?-1:1,type,side:i?'p2':'p1',label:'P'+(i+1)}));effects=[];aiCooldown=0;controls.keys.clear();hud.mount(fighters);},side=>{app.stats.matches++;app.stats[side?'p2Wins':'p1Wins']++;app.saveStats();app.show('victory',{side});});
app.startMatch=()=>{app.show(STATES.BATTLE);match.reset();};
hud.hide();
function ai(){const f=fighters[1],p=fighters[0],distance=p.x-f.x;f.vx=Math.abs(distance)>125?Math.sign(distance)*f.speed:0;if(aiCooldown-->0)return;aiCooldown=20+Math.random()*20;if(Math.abs(distance)<140)f.startAttack(Math.random()<.25?'special':'basic');if(f.axp>=100)f.activateOverdrive();}
function update(ms){if(app.state!=='battle')return;match.step(ms);if(match.phase!=='active')return;if(!match.remaining){const [p1,p2]=fighters;match.award(p1.hp===p2.hp?-1:p1.hp>p2.hp?0:1);return;}controls.apply(fighters[0],'p1',0,audio);if(app.mode==='AI')ai();else controls.apply(fighters[1],'p2',1,audio);fighters[0].update(fighters[1],ms);if(match.phase!=='active')return;fighters[1].update(fighters[0],ms);effects=effects.filter(e=>{e.y-=.5;return --e.life>0;});}
const loop=new FixedStepLoop({update,render:()=>{renderer.draw(app.state==='battle'?fighters:[],effects);if(app.state==='battle')hud.update(fighters,match,app.t);},logicHz:WORLD.logicHz,getRenderHz:()=>settings.fps===30?30:60});
async function boot(){try{await assets.load();app.show(STATES.INTRO);loop.start();}catch(error){const host=document.getElementById('scene');host.textContent=error.message+' — comprueba las carpetas assets.';}}
window.addEventListener('pointerdown',()=>audio.unlock(),{once:true});window.addEventListener('keydown',()=>audio.unlock(),{once:true});
window.addEventListener('pagehide',()=>{loop.stop();audio.channels.forEach(channel=>channel.pause());});
boot();
