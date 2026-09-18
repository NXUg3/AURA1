export const CHARACTER_STATES=Object.freeze(['idle','walk','jump','attack']);
export const ROSTER_KEYS=Object.freeze(['oleg','momo','buba','pomodoro','trip','venoki','puff','kotaro']);

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
      oleg:'./assets/ui/plant-icon.png', kotaro:'./assets/ui/beast-icon.png',
      pomodoro:'./assets/ui/fuerino-portrait.png', buba:'./assets/ui/toyho-portrait.png'
    })
  }),
  audio:Object.freeze({
    pressStart:'./assets/audio/press_start.mp3', mainMenu:'./assets/audio/main_menu.mp3',
    characterSelect:'./assets/audio/character_select.mp3', combatTheme:'./assets/audio/combat_theme.mp3'
  })
});

const logoManifest=Object.fromEntries(ROSTER_KEYS.map((name)=>[`logo.${name}`,ASSET_PATHS.sprites[name].logo]));
export const ASSET_MANIFEST=Object.freeze({
  'sprite.oleg.atlas':ASSET_PATHS.sprites.oleg.atlas,
  'sprite.kotaro.atlas':ASSET_PATHS.sprites.kotaro.atlas,
  'sprite.pomodoro.atlas':ASSET_PATHS.sprites.pomodoro.atlas,
  'sprite.buba.atlas':ASSET_PATHS.sprites.buba.atlas,
  'ui.gameLogo':ASSET_PATHS.ui.gameLogo,
  'ui.portrait.oleg':ASSET_PATHS.ui.portraits.oleg,
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
  async loadCharacterStates(character,states=CHARACTER_STATES){const paths=ASSET_PATHS.sprites[character];if(!paths)throw new Error(`Personaje no registrado: ${character}`);const entries=await Promise.all(states.map(async(state)=>[state,await this.loadOptionalPath(paths[state],`sprite.${character}.${state}`)]));return Object.fromEntries(entries);}
  async loadAll(){await Promise.all(Object.keys(this.manifest).map((key)=>this.loadImage(key)));return this.cache;}
  get(key){return this.cache.get(key)||null;}
}
