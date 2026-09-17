export const WORLD=Object.freeze({width:1280,height:720,ground:650,gravity:.75,logicHz:60});
export const STATES=Object.freeze({INTRO:'intro',TITLE:'title',MENU:'menu',SELECT:'select',VS:'vs',BATTLE:'battle',VICTORY:'victory'});
export const ORDER=Object.freeze(['oleg','momo','buba','pomodoro','trip','venoki','puff','kotaro']);
function fighter(label,element,color,rim,hp,speed,basicDamage,specialDamage,width,height){
  return {label,element,color,playable:true,palette:{rim},combat:{hp,speed,basicDamage,specialDamage,hurtbox:{width,height}}};
}
export const ROSTER=Object.freeze({
  oleg:fighter('Oleg','Plant','#53df60','#c8ff72',110,4,7,17,86,112),
  momo:{label:'Momo',playable:false,color:'#f26bb5'},
  buba:fighter('Buba','Aquatic','#299fe9','#9cecff',120,3.8,8,18,92,130),
  pomodoro:fighter('Pomodoro','Fire','#ef4f71','#ffcf4d',95,4.7,10,20,84,128),
  trip:{label:'Trip',playable:false,color:'#ffd04e'},
  venoki:{label:'Venoki',playable:false,color:'#8c5cff'},
  puff:{label:'Puff',playable:false,color:'#6ee7f2'},
  kotaro:fighter('Kotaro','Beast','#ffc94a','#78bfff',100,4.4,9,19,86,126)
});
export const PLAYABLE=ORDER.filter(key=>ROSTER[key].playable);
export const ROOT=new URL('../',import.meta.url);
export const TRACKS={title:'press_start.mp3',menu:'main_menu.mp3',select:'character_select.mp3',battle:'combat_theme.mp3'};
export const SETTINGS_KEY='axieSmashSettings';
export function readSettings(){const defaults={lang:'es',masterVol:80,sfxVol:80,resolution:'1280x720',fps:60};try{return {...defaults,...JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}')};}catch{return defaults;}}
export function assetUrl(path,version){const url=new URL(path,ROOT);if(version)url.searchParams.set('v',version);return url.href;}
