import {ROSTER} from './config.js';
function surface(image){const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;c.getContext('2d').drawImage(image,0,0);return c;}
export function prepareSheet(sprite){
  const c=surface(sprite.img),ctx=c.getContext('2d'),pixels=ctx.getImageData(0,0,c.width,c.height),d=pixels.data;
  for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];const background=sprite.tint==='red'?r<30&&g<18&&b<18&&r>=g+2:sprite.tint==='blue'?r<20&&g<42&&b<78&&b>=g+20:r<28&&g<42&&b<52&&b>=r+7;if(background)d[i+3]=0;}
  ctx.putImageData(pixels,0,0);sprite.surface=c;sprite.cache=new Map();
}
function clearConnectedGray(canvas){const ctx=canvas.getContext('2d'),pixels=ctx.getImageData(0,0,canvas.width,canvas.height),d=pixels.data,w=canvas.width,h=canvas.height,seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let head=0,tail=0;
  const push=i=>{if(i<0||i>=seen.length||seen[i])return;const p=i*4,r=d[p],g=d[p+1],b=d[p+2];if(Math.max(r,g,b)-Math.min(r,g,b)>20||(r+g+b)/3<90)return;seen[i]=1;queue[tail++]=i;};
  for(let x=0;x<w;x++){push(x);push((h-1)*w+x);}for(let y=0;y<h;y++){push(y*w);push(y*w+w-1);}while(head<tail){const i=queue[head++];d[i*4+3]=0;if(i%w)push(i-1);if(i%w<w-1)push(i+1);push(i-w);push(i+w);}ctx.putImageData(pixels,0,0);
}
export function installState(sprite,state,image){const target=state==='attack'?'punch':state,layout=sprite.standardLayouts?.[state],count=layout?.count||sprite.frames[target]?.count||6,cols=layout?.columns||count,rows=layout?.rows||Math.ceil(count/cols),c=surface(image);if(layout?.removeConnectedBackground)clearConnectedGray(c);sprite.frames[target]={surface:c,count,cols,cellW:c.width/cols,cellH:c.height/rows};}
export function frame(sprite,state,index,key){
  const def=sprite.frames[state]||sprite.frames.idle,n=index%def.count,id=state+':'+n;if(sprite.cache.has(id))return sprite.cache.get(id);
  const w=Math.floor(def.cellW||def.w/def.count),h=Math.floor(def.cellH||def.h),sx=def.surface?(n%def.cols)*def.cellW:def.x+n*def.w/def.count,sy=def.surface?Math.floor(n/def.cols)*def.cellH:def.y;
  const raw=document.createElement('canvas');raw.width=w;raw.height=h;const rc=raw.getContext('2d');rc.drawImage(def.surface||sprite.surface,sx,sy,w,h,0,0,w,h);
  const d=rc.getImageData(0,0,w,h).data;let left=w,right=0,top=h,bottom=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>30){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  if(left>right){left=0;right=w-1;top=0;bottom=h-1;}
  const cw=right-left+1,ch=bottom-top+1,pad=4,c=document.createElement('canvas');c.width=cw+8;c.height=ch+8;const cc=c.getContext('2d'),mask=document.createElement('canvas');mask.width=cw;mask.height=ch;const mc=mask.getContext('2d');mc.drawImage(raw,left,top,cw,ch,0,0,cw,ch);mc.globalCompositeOperation='source-in';mc.fillStyle='#09121f';mc.fillRect(0,0,cw,ch);
  for(const [x,y]of [[-2,0],[2,0],[0,-2],[0,2],[-1,-1],[1,1]])cc.drawImage(mask,pad+x,pad+y);
  mc.fillStyle=ROSTER[key].palette.rim;mc.fillRect(0,0,cw,ch);cc.drawImage(mask,pad+1,pad-1);cc.drawImage(raw,left,top,cw,ch,pad,pad,cw,ch);
  const result={canvas:c,width:cw,height:ch,pad};sprite.cache.set(id,result);return result;
}
export function cacheFrames(sprite,key){for(const [state,def]of Object.entries(sprite.frames))for(let i=0;i<def.count;i++)frame(sprite,state,i,key);}
