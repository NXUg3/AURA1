import {localized} from './i18n.js';
export function menuDescription(lang,id){const copy={
arcade:['Desafía a la CPU en combate individual.','Challenge the CPU in a single match.','CPUと対戦。'],
versus:['Dos jugadores, una arena: combate local.','Two players, one arena: local versus.','ローカルで2人対戦。'],
multi:['Crea o únete a una sala local. Los modos online están en preparación.','Create or join a local room. Online modes are coming later.','ローカルルームを作成・参加。オンラインは近日公開。'],
profile:['Consulta tus partidas, victorias y Overdrives.','View your matches, wins and Overdrives.','対戦・勝利の記録を確認。'],
help:['Aprende las mecánicas y explora los modos de juego.','Learn the mechanics and explore game modes.','ゲームの仕組みとモード。'],
controls:['Configura teclado; también puedes usar gamepad y controles táctiles.','Configure keys; gamepad and touch controls are also supported.','キーボード・パッド・タッチ操作。'],
options:['Ajusta resolución, presentación, idioma y audio.','Adjust resolution, presentation, language and audio.','解像度・表示・言語・音量設定。'],
credits:['Conoce los créditos de Axie Smash.','See the Axie Smash credits.','クレジットを表示。'],
exit:['Regresa a la pantalla de inicio.','Return to the title screen.','タイトルに戻る。']};return localized(lang,...(copy[id]||['Elige una opción.','Choose an option.','項目を選択。']));}
