import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {ORDER,ROSTER} from '../js/config.js';
import {Match} from '../js/match.js';
import {advanceSteppedAnimation} from '../js/animation.js';
import {createFighterClass} from '../js/fighter.js';
const root=path.resolve(import.meta.dirname,'..');
assert.deepEqual(ORDER,['oleg','momo','buba','pomodoro','trip','venoki','puff','kotaro']);
for(const key of ORDER)assert(fs.existsSync(path.join(root,'assets/sprites',key,'logo.png')));
assert.equal(ORDER.filter(key=>ROSTER[key].playable).length,4);
const match=new Match();match.step(2699);assert.equal(match.phase,'countdown');assert.equal(match.remaining,60000);match.step(1);assert.equal(match.phase,'active');match.award(0);match.award(0);assert.deepEqual(match.wins,[1,0]);match.step(1700);match.step(2700);match.award(1);match.step(1700);assert.equal(match.final,true);assert.equal(match.round,3);match.step(2700);match.award(0);assert.equal(match.phase,'complete');assert.deepEqual(match.wins,[2,1]);
match.reset();match.step(2700);match.award(-1);match.step(1700);assert.deepEqual(match.wins,[0,0]);assert.equal(match.round,1);match.step(2700);match.award(0);match.step(1700);match.step(2700);match.award(0);assert.equal(match.phase,'complete');assert.equal(match.round,2);
for(const [state,fps]of [['walk',12],['jump',15]]){const f={spriteState:state,spriteFrame:0,spriteTick:0,isAttacking:false,onGround:state==='walk',vx:2};for(let i=0;i<60;i++)advanceSteppedAnimation(f,1000/60);assert(Math.abs(f.spriteFrame-fps)<=1);}
let defeated=0;
const Fighter=createFighterClass({worldWidth:1280,groundY:650,defaultSpriteHeight:130,gravity:.75,roster:ROSTER,spriteRegistry:{kotaro:{hitboxes:{basic:[null,{forward:24,top:-104,width:46,height:62},{forward:30,top:-108,width:58,height:66}]}}},axpMax:100,axpGainBasic:10,axpGainSpecial:18,overdriveFrames:240,overdriveSpeedMultiplier:1.4,overdriveDamageMultiplier:1.5,animationSystem:advanceSteppedAnimation,renderer:()=>{},audio:{hit(){},overdrive(){}},statistics:{overdrivesUsed:0},saveStatistics:()=>{},spawnOverdriveBanner:()=>{},spawnDamageNumber:()=>{},onDefeated:()=>defeated++});
for(const direction of [1,-1]){const attacker=new Fighter({x:direction===1?250:350,type:'kotaro',facing:direction}),target=new Fighter({x:direction===1?340:250,type:'oleg',facing:-direction});attacker.startAttack('basic');for(let i=0;i<16;i++)attacker.update(target,1000/60);assert.equal(target.hp,target.maxHp-9);assert.equal(attacker.axp,10);assert.equal(attacker.y,650);target.receiveDamage(999,direction);target.receiveDamage(999,direction);}
assert.equal(defeated,2);
for(const dir of ['js','css'])for(const name of fs.readdirSync(path.join(root,dir))){const file=path.join(root,dir,name),source=fs.readFileSync(file,'utf8');assert(fs.statSync(file).size<6144,`${name} debe ser menor de 6 KB`);assert(!source.includes('.svg'));assert(!source.includes('base64'));if(name.endsWith('.js'))for(const [,relative]of source.matchAll(/from ['"](\.[^'"]+)['"]/g))assert(fs.existsSync(path.resolve(path.dirname(file),relative)),relative);}
assert(fs.statSync(path.join(root,'index.html')).size<2048);
console.log('OK: roster, medios, imports, tamaño (<6 KB), colisiones simétricas, 12/15 FPS, cuenta regresiva, 2–1, 2–0 y empate.');
