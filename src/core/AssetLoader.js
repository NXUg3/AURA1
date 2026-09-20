export const CHARACTER_STATES=Object.freeze(['idle','walk','jump','attack']);
export const ROSTER_KEYS=Object.freeze(['olek','momo','buba','pomodoro','trip','venoki','puff','kotaro']);

export const KOTARO_SHEETS=Object.freeze({
  idle:Object.freeze({image:'./assets/sprites/kotaro/idle.png',config:'./assets/sprites/kotaro/idle.json'}),
  walk:Object.freeze({image:'./assets/sprites/kotaro/walk.png',config:'./assets/sprites/kotaro/walk.json'}),
  hurt:Object.freeze({image:'./assets/sprites/kotaro/Hit.png',config:'./assets/sprites/kotaro/Hit.json'}),
  defeat:Object.freeze({image:'./assets/sprites/kotaro/K.O. Animation.png',config:'./assets/sprites/kotaro/K.O. Animation.json'}),
  overdrive:Object.freeze({image:'./assets/sprites/kotaro/Overdrive.png',config:'./assets/sprites/kotaro/Overdrive.json'}),
  basic1:Object.freeze({image:'./assets/sprites/kotaro/punch attack 1.png',config:'./assets/sprites/kotaro/punch attack 1.json'}),
  basic2:Object.freeze({image:'./assets/sprites/kotaro/punch attack 2.png',config:'./assets/sprites/kotaro/punch attack 2.json'}),
  special:Object.freeze({image:'./assets/sprites/kotaro/sword attack.png',config:'./assets/sprites/kotaro/sword attack.json'})
});

export const BUBA_SHEETS=Object.freeze({
  idle:Object.freeze({image:'./assets/sprites/buba/idle.png',config:'./assets/sprites/buba/idle.json'}),
  walk:Object.freeze({image:'./assets/sprites/buba/walk.png',config:'./assets/sprites/buba/walk.json'}),
  hurt:Object.freeze({image:'./assets/sprites/buba/Hit.png',config:'./assets/sprites/buba/Hit.json'}),
  defeat:Object.freeze({image:'./assets/sprites/buba/KO Animation.png',config:'./assets/sprites/buba/KO Animation.json'}),
  overdrive:Object.freeze({image:'./assets/sprites/buba/Overdrive.png',config:'./assets/sprites/buba/Overdrive.json'}),
  basic1:Object.freeze({image:'./assets/sprites/buba/kunai attack.png',config:'./assets/sprites/buba/kunai attack.json'}),
  special:Object.freeze({image:'./assets/sprites/buba/kunai attack 2.png',config:'./assets/sprites/buba/kunai attack 2.json'})
});

export const OLEK_SHEETS=Object.freeze({
  idle:Object.freeze({image:'./assets/sprites/olek/idle.png',config:'./assets/sprites/olek/idle.json'}),
  walk:Object.freeze({image:'./assets/sprites/olek/walk.png',config:'./assets/sprites/olek/walk.json'}),
  hurt:Object.freeze({image:'./assets/sprites/olek/hit.png',config:'./assets/sprites/olek/hit.json'}),
  defeat:Object.freeze({image:'./assets/sprites/olek/K.O. Animation.png',config:'./assets/sprites/olek/K.O. Animation.json'}),
  overdrive:Object.freeze({image:'./assets/sprites/olek/overdrive.png',config:'./assets/sprites/olek/overdrive.json'}),
  basic1:Object.freeze({image:'./assets/sprites/olek/maze attack 1.png',config:'./assets/sprites/olek/maze attack 1.json'}),
  special:Object.freeze({image:'./assets/sprites/olek/maze attack 2.png',config:'./assets/sprites/olek/maze attack 2.json'})
});

export const POMODORO_SHEETS=Object.freeze({
  idle:Object.freeze({image:'./assets/sprites/pomodoro/idle.png',config:'./assets/sprites/pomodoro/idle.json'}),
  walk:Object.freeze({image:'./assets/sprites/pomodoro/walk.png',config:'./assets/sprites/pomodoro/walk.json'}),
  hurt:Object.freeze({image:'./assets/sprites/pomodoro/hit.png',config:'./assets/sprites/pomodoro/hit.json'}),
  defeat:Object.freeze({image:'./assets/sprites/pomodoro/KO Animation.png',config:'./assets/sprites/pomodoro/KO Animation.json'}),
  overdrive:Object.freeze({image:'./assets/sprites/pomodoro/overdrive.png',config:'./assets/sprites/pomodoro/overdrive.json'}),
  basic1:Object.freeze({image:'./assets/sprites/pomodoro/frying attack 1.png',config:'./assets/sprites/pomodoro/frying attack 1.json'}),
  special:Object.freeze({image:'./assets/sprites/pomodoro/pelon attack 2.png',config:'./assets/sprites/pomodoro/pelon attack 2.json'})
});

const characterPaths=(name)=>Object.freeze({
  folder:`./assets/sprites/${name}`, logo:`./assets/sprites/${name}/logo.png`,
  atlas:`./assets/sprites/${name}/atlas.png`, idle:`./assets/sprites/${name}/idle.png`,
  walk:`./assets/sprites/${name}/walk.png`, jump:`./assets/sprites/${name}/jump.png`,
  attack:`./assets/sprites/${name}/attack.png`
});

export const ASSET_PATHS=Object.freeze({
  sprites:Object.freeze(Object.fromEntries(ROSTER_KEYS.map((name)=>[name,characterPaths(name)]))),
  ui:Object.freeze({
    gameLogo:'./assets/ui/game-logo.png',
    portraits:Object.freeze({
      olek:'./assets/sprites/olek/portrait.png', kotaro:'./assets/sprites/kotaro/portrait.png',
      pomodoro:'./assets/sprites/pomodoro/portrait.png', buba:'./assets/sprites/buba/portrait.png'
    })
  }),
  audio:Object.freeze({
    pressStart:'./assets/audio/press_start.mp3', mainMenu:'./assets/audio/main_menu.wav',
    characterSelect:'./assets/audio/character_select.wav', combatTheme:'./assets/audio/final_assault_theme.mp3'
  })
});

const logoManifest=Object.fromEntries(ROSTER_KEYS.map((name)=>[`logo.${name}`,ASSET_PATHS.sprites[name].logo]));
const kotaroManifest=Object.fromEntries(Object.entries(KOTARO_SHEETS).flatMap(([state,files])=>[
  [`sprite.kotaro.${state}`,files.image],[`sprite.kotaro.${state}.json`,files.config]
]));
const bubaManifest=Object.fromEntries(Object.entries(BUBA_SHEETS).flatMap(([state,files])=>[
  [`sprite.buba.${state}`,files.image],[`sprite.buba.${state}.json`,files.config]
]));
const olekManifest=Object.fromEntries(Object.entries(OLEK_SHEETS).flatMap(([state,files])=>[
  [`sprite.olek.${state}`,files.image],[`sprite.olek.${state}.json`,files.config]
]));
const pomodoroManifest=Object.fromEntries(Object.entries(POMODORO_SHEETS).flatMap(([state,files])=>[
  [`sprite.pomodoro.${state}`,files.image],[`sprite.pomodoro.${state}.json`,files.config]
]));
export const ASSET_MANIFEST=Object.freeze({
  ...kotaroManifest,
  ...bubaManifest,
  ...olekManifest,
  ...pomodoroManifest,
  'ui.gameLogo':ASSET_PATHS.ui.gameLogo,
  'ui.portrait.olek':ASSET_PATHS.ui.portraits.olek,
  'ui.portrait.kotaro':ASSET_PATHS.ui.portraits.kotaro,
  'ui.portrait.pomodoro':ASSET_PATHS.ui.portraits.pomodoro,
  'ui.portrait.buba':ASSET_PATHS.ui.portraits.buba,
  ...logoManifest
});

export class AssetLoader {
  constructor(manifest=ASSET_MANIFEST){this.manifest=manifest;this.cache=new Map();this.pending=new Map();this.missingOptional=new Set();}
  loadImage(key){const path=this.manifest[key];if(!path)return Promise.reject(new Error(`Recurso no registrado: ${key}`));return this.loadPath(path,key);}
  loadPath(path,cacheKey=path){
    if(this.cache.has(cacheKey))return Promise.resolve(this.cache.get(cacheKey));
    if(this.pending.has(cacheKey))return this.pending.get(cacheKey);
    const request=new Promise((resolve,reject)=>{const image=new Image();image.decoding='async';image.onload=()=>{this.cache.set(cacheKey,image);this.pending.delete(cacheKey);resolve(image);};image.onerror=()=>{this.pending.delete(cacheKey);reject(new Error(`No se pudo cargar: ${path}`));};image.src=path;});
    this.pending.set(cacheKey,request);return request;
  }
  async loadOptionalPath(path,cacheKey=path){try{return await this.loadPath(path,cacheKey);}catch{this.missingOptional.add(path);return null;}}
  loadJson(key){
    const source=this.manifest[key];
    if(!source)return Promise.reject(new Error(`Recurso no registrado: ${key}`));
    if(this.cache.has(key))return Promise.resolve(this.cache.get(key));
    if(this.pending.has(key))return this.pending.get(key);
    const request=fetch(source).then(response=>{if(!response.ok)throw new Error(`No se pudo cargar: ${source}`);return response.json();})
      .then(value=>{this.cache.set(key,value);this.pending.delete(key);return value;})
      .catch(error=>{this.pending.delete(key);throw error;});
    this.pending.set(key,request);return request;
  }
  async loadCharacterStates(character,states=CHARACTER_STATES){const paths=ASSET_PATHS.sprites[character];if(!paths)throw new Error(`Personaje no registrado: ${character}`);const entries=await Promise.all(states.filter(state=>this.manifest[`sprite.${character}.${state}`]).map(async(state)=>[state,await this.loadPath(paths[state],`sprite.${character}.${state}`)]));return Object.fromEntries(entries);}
  async loadAll(){await Promise.all(Object.keys(this.manifest).map((key)=>key.endsWith('.json')?this.loadJson(key):this.loadImage(key)));return this.cache;}
  get(key){return this.cache.get(key)||null;}
}
