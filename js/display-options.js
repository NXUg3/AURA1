import {el} from './dom.js';
import {localized} from './i18n.js';
export function displayOptions(panel,app){const lang=app.settings.lang;
  function choice(label,key,values){const select=el('select');for(const value of values)select.append(el('option',String(value),{value,selected:String(app.settings[key])===String(value)}));const row=el('label',label+' ');row.append(select);panel.append(row);select.onchange=()=>{app.settings[key]=key==='fps'?+select.value:select.value;app.applyDisplay();app.saveSettings();};}
  choice(localized(lang,'Resolución','Resolution','解像度'),'resolution',['1280x720','1920x1080']);choice(localized(lang,'FPS de presentación','Presentation FPS','描画FPS'),'fps',[30,60]);
  panel.append(el('p',localized(lang,'La lógica permanece a 60 Hz y los sprites a 12/15 FPS en ambos modos.','Logic remains at 60 Hz and sprites at 12/15 FPS in either mode.','どちらのモードでも処理60Hz、スプライト12/15FPS。')));
  const slider=el('input','',{type:'range',min:0,max:100,value:app.settings.sfxVol});const row=el('label',localized(lang,'Volumen de efectos','Sound effects volume','効果音量'));row.append(slider);panel.append(row);slider.oninput=()=>{app.settings.sfxVol=+slider.value;app.audio.setSfxVolume(+slider.value/100);app.saveSettings();};
}
