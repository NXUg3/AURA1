import {ORDER,PLAYABLE,assetUrl} from './config.js';
import {createSpriteRegistry} from './frames.js';
import {prepareSheet,installState,cacheFrames} from './sprite-cache.js';
export class Assets{
  constructor(){this.version=new URLSearchParams(location.search).get('assetsVersion')||Date.now().toString();this.images=new Map();this.sprites=createSpriteRegistry();}
  url(path){return assetUrl(path,this.version);}
  logo(key){return this.url(`assets/sprites/${key}/logo.png`);}
  portrait(key){return this.url(`assets/sprites/${key}/portrait.png`);}
  async image(path,optional=false){const url=this.url(path);if(this.images.has(url))return this.images.get(url);const request=new Promise((resolve,reject)=>{const image=new Image();image.decoding='async';image.onload=()=>resolve(image);image.onerror=()=>optional?resolve(null):reject(new Error('Recurso no disponible: '+path));image.src=url;});this.images.set(url,request);return request;}
  async load(){
    await Promise.all(ORDER.map(key=>this.image(`assets/sprites/${key}/logo.png`,true)));
    await Promise.all(PLAYABLE.map(async key=>{
      const sprite=this.sprites[key];sprite.img=await this.image(`assets/sprites/${key}/atlas.png`);prepareSheet(sprite);
      const states=await Promise.all(['idle','walk','jump','attack'].map(async state=>[state,await this.image(`assets/sprites/${key}/${state}.png`,true)]));
      for(const [state,image]of states)if(image)installState(sprite,state,image);
      cacheFrames(sprite,key);
    }));
  }
  async refresh(){const next=new Assets();next.version=Date.now().toString()+'-'+Math.random().toString(36).slice(2,6);await next.load();this.version=next.version;this.images=next.images;Object.assign(this.sprites,next.sprites);}
}
