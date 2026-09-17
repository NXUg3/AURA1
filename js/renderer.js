import {WORLD,ROSTER} from './config.js';
import {frame} from './sprite-cache.js';
export class Renderer{
  constructor(canvas,assets){this.ctx=canvas.getContext('2d',{alpha:false});this.assets=assets;const c=this.ctx;this.sky=c.createLinearGradient(0,0,0,WORLD.height);this.sky.addColorStop(0,'#183a62');this.sky.addColorStop(1,'#6bbdcf');}
  drawFighter(f){const ctx=this.ctx,sprite=this.assets.sprites[f.type],cached=frame(sprite,f.spriteState,f.spriteFrame,f.type),scale=130/cached.height,cx=f.x+f.w/2;
    ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(cx,WORLD.ground+3,48,9,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(cx,f.y);ctx.scale(f.facing,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.globalAlpha=f.hurtFlash%2?.55:1;ctx.drawImage(cached.canvas,-(cached.width/2+cached.pad)*scale,-(cached.height+cached.pad)*scale,cached.canvas.width*scale,cached.canvas.height*scale);ctx.restore();
  }
  draw(fighters,effects=[]){const c=this.ctx;c.fillStyle=this.sky;c.fillRect(0,0,WORLD.width,WORLD.height);c.fillStyle='#203a53';for(let i=0;i<6;i++){c.beginPath();c.moveTo(i*270-150,WORLD.ground);c.lineTo(i*270+100,380);c.lineTo(i*270+300,WORLD.ground);c.fill();}c.fillStyle='#193f36';c.fillRect(0,WORLD.ground,WORLD.width,70);c.strokeStyle='#8ae1b7';c.lineWidth=3;c.beginPath();c.moveTo(0,WORLD.ground);c.lineTo(WORLD.width,WORLD.ground);c.stroke();for(const f of fighters)f.draw();c.textAlign='center';c.font='900 25px Arial';for(const e of effects){c.fillStyle=ROSTER[e.type]?.color||'#fff';c.fillText(e.text,e.x,e.y);}}
}
