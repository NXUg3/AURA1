import { AssetLoader, ASSET_MANIFEST, ASSET_PATHS } from './core/AssetLoader.js';
import { AudioManager } from './core/AudioManager.js';
import { FixedStepLoop } from './core/FixedStepLoop.js';
import { PART_LABELS, CHAR_DATA, CHAR_KEYS, PLAYABLE_KEYS, GRID_COLS } from './entities/roster.js';
import { createFighterClass } from './entities/Fighter.js';
import { advanceSteppedAnimation, getVisualState } from './systems/AnimationSystem.js';
import { applyHudTheme } from './systems/HudSystem.js';
import { createSpriteRegistry } from './systems/SpriteRegistry.js';

(function(){
  "use strict";

  // ===========================================================
  // CONFIGURACIÓN / PERSISTENCIA
  // ===========================================================
  const DEFAULT_SETTINGS = { resolution: '1280x720', fps: 60, lang: 'es', masterVol: 80, sfxVol: 80 };
  function loadSettings() {
    try { const raw = localStorage.getItem('axieSmashSettings'); if (raw) return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw)); } catch (e) {}
    return Object.assign({}, DEFAULT_SETTINGS);
  }
  function saveSettingsToStorage() { try { localStorage.setItem('axieSmashSettings', JSON.stringify(settings)); } catch (e) {} }
  let settings = loadSettings();

  const DEFAULT_STATS = { matchesPlayed: 0, p1Wins: 0, p2Wins: 0, cpuWins: 0, overdrivesUsed: 0 };
  function loadStats() {
    try { const raw = localStorage.getItem('axieSmashStats'); if (raw) return Object.assign({}, DEFAULT_STATS, JSON.parse(raw)); } catch (e) {}
    return Object.assign({}, DEFAULT_STATS);
  }
  function saveStatsToStorage() { try { localStorage.setItem('axieSmashStats', JSON.stringify(playerStats)); } catch (e) {} }
  let playerStats = loadStats();

  const DEFAULT_CONTROLS = {
    keyboard: {
      p1: { left:'a', right:'d', jump:'w', basic:'j', special:'k', overdrive:'l' },
      p2: { left:'arrowleft', right:'arrowright', jump:'arrowup', basic:'control', special:'shift', overdrive:'/' }
    },
    gamepad: {
      p1: { jump:0, basic:1, special:2, overdrive:3 },
      p2: { jump:0, basic:1, special:2, overdrive:3 }
    },
    touchEnabled: false
  };
  function loadControls() {
    try { const raw = localStorage.getItem('axieSmashControls'); if (raw) {
      const parsed = JSON.parse(raw);
      return {
        keyboard: { p1: Object.assign({}, DEFAULT_CONTROLS.keyboard.p1, parsed.keyboard && parsed.keyboard.p1), p2: Object.assign({}, DEFAULT_CONTROLS.keyboard.p2, parsed.keyboard && parsed.keyboard.p2) },
        gamepad: { p1: Object.assign({}, DEFAULT_CONTROLS.gamepad.p1, parsed.gamepad && parsed.gamepad.p1), p2: Object.assign({}, DEFAULT_CONTROLS.gamepad.p2, parsed.gamepad && parsed.gamepad.p2) },
        touchEnabled: !!parsed.touchEnabled
      };
    } } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_CONTROLS));
  }
  function saveControlsToStorage() { try { localStorage.setItem('axieSmashControls', JSON.stringify(controls)); } catch (e) {} }
  let controls = loadControls();
  let remapListening = null; // { device:'keyboard'|'gamepad', player:'p1'|'p2', action:'left'... }

  // ===========================================================
  // i18n
  // ===========================================================
  const LANG = {
    es: {
      press_start: 'PRESS START', menu_title: 'MENÚ PRINCIPAL',
      m_arcade: 'ARCADE', m_arcade_desc: 'Enfréntate a la IA en una escalera de combates.',
      m_versus: 'VERSUS', m_versus_desc: 'Pelea local contra un amigo en la misma pantalla.',
      m_multi: 'MULTIJUGADOR', m_multi_desc: 'Modo online en desarrollo.', m_soon: 'PRÓXIMAMENTE',
      m_pdata: 'PLAYER DATA', m_pdata_desc: 'Consulta tus récords y estadísticas de combate.',
      m_help: 'AYUDA', m_help_desc: 'Conoce el combate, clases, atributos y controles.',
      m_controls: 'CONTROLES', m_controls_desc: 'Remapea teclado, mando o activa controles táctiles.',
      m_options: 'OPCIONES', m_options_desc: 'Configura resolución, FPS, idioma y volumen de audio.',
      m_credits: 'CRÉDITOS', m_credits_desc: 'Ficha técnica del equipo y herramientas de desarrollo.',
      m_exit: 'EXIT / SALIR', m_exit_desc: 'Cierra o reinicia la sesión del juego.',
      options_title: 'OPCIONES', opt_res: 'RESOLUCIÓN', opt_fps: 'FPS', opt_lang: 'IDIOMA',
      opt_master: 'VOL. MASTER', opt_sfx: 'VOL. SFX', opt_save: 'GUARDAR Y REGRESAR',
      controls_title: 'CONTROLES', tab_keyboard: 'TECLADO', tab_gamepad: 'MANDO', tab_touch: 'TÁCTIL',
      ctrl_left:'IZQUIERDA', ctrl_right:'DERECHA', ctrl_jump:'SALTAR', ctrl_basic:'BÁSICO', ctrl_special:'ESPECIAL', ctrl_overdrive:'OVERDRIVE',
      ctrl_remap:'REMAPEAR', ctrl_listening:'PRESIONA...', ctrl_p1:'JUGADOR 1', ctrl_p2:'JUGADOR 2',
      ctrl_gamepad_ok:'Mando detectado ✔', ctrl_gamepad_none:'No se detecta ningún mando. Presiona un botón para conectar.',
      ctrl_touch_toggle:'Mostrar controles táctiles en combate',
      pd_title: 'PLAYER DATA', pd_matches: 'COMBATES JUGADOS', pd_p1: 'VICTORIAS J1', pd_p2: 'VICTORIAS J2', pd_cpu: 'VICTORIAS CPU', pd_overdrive: 'OVERDRIVES USADOS',
      cs_title:'SELECCIONA PERSONAJES', cs_confirm: '✕ CONFIRMAR', cs_back: '◯ REGRESAR', cs_random: '□ ALEATORIO', cs_commandlist: '△ LISTA DE COMANDOS', cs_settings: '⚙ AJUSTES DE CONTROL',
      kotaro_subtitle:'EL GUARDIÁN BLANCO · ESPÍRITU', beast_subtitle:'EL AXIE BESTIA · PODER', verdozo_subtitle:'EL AXIE VERDE · PLANTA', fuerino_subtitle:'EL AXIE ÍGNEO · FUEGO', toyho_subtitle:'EL AXIE AZUL · ACUÁTICO',
      cs_grid_label: '1P: WASD  ·  2P: FLECHAS',
      stat_type: 'TIPO', stat_speed: 'VELOCIDAD', stat_range: 'RANGO EFECTIVO', stat_ease: 'FACILIDAD DE USO',
      hud_j1: 'JUGADOR 1', hud_j2: 'JUGADOR 2', hud_cpu: 'CPU',
      victory_of: '¡VICTORIA DE ', draw_text: '¡EMPATE!',
      victory_rematch:'REVANCHA', victory_menu:'MENÚ PRINCIPAL',
      watermark: '⚠️ PROTOTIPO EN DESARROLLO - NO ES UNA VERSIÓN FINAL — ⚠️ PROTOTIPO EN DESARROLLO - NO ES UNA VERSIÓN FINAL —',
      back: '◀ REGRESAR',
      controls_local: 'P1: A/D mover·W saltar·J básico·K especial·L OVERDRIVE   |   P2: ←/→ mover·↑ saltar·Ctrl básico·Shift especial·/ OVERDRIVE',
      controls_ai: 'P1: A/D mover · W saltar · J básico · K especial · L OVERDRIVE (con AXP lleno)',
      cl_title: 'LISTA DE COMANDOS', cl_close: 'CERRAR',
      credits_role_direction:'Dirección y diseño', credits_role_engine:'Motor y programación', credits_role_ai:'Desarrollo asistido por IA',
      help_title:'AYUDA', help_lead:'Axie Smash es un juego de combate arcade local: elige a tu Axie, domina sus movimientos y vacía la barra de vida rival antes de que termine el tiempo.',
      help_combat_title:'COMBATE', help_combat:'Muévete, salta y ataca. El golpe básico es rápido; el especial alcanza más lejos y causa mayor daño. Con AXP completo, activa OVERDRIVE para potenciar tu ofensiva.',
      help_classes_title:'CLASES', help_classes:'Plant destaca por resistencia; Beast por potencia; Fuerino por velocidad y fuego; Toyho por alcance acuático; y Kotaro, el Guardián Blanco, combina movilidad rápida con energía espiritual.',
      help_stats_title:'ATRIBUTOS Y ESTADÍSTICAS', help_stats:'TIPO define el estilo. VELOCIDAD determina movilidad. RANGO EFECTIVO indica la distancia segura de ataque. FACILIDAD DE USO orienta la complejidad del luchador.',
      help_controls_title:'CONTROLES', help_controls:'J1: A/D para mover, W para saltar, J básico, K especial y L OVERDRIVE. J2: flechas para mover/saltar, Ctrl básico, Shift especial y / OVERDRIVE. Puedes remapearlos en Controles.',
      credits_role_art:'Arte y herramientas de IA', credits_role_design:'Referencias de diseño UI/UX', credits_role_partners:'PARTNERS', credits_subtitle:'JUEGO DE LUCHA ARCADE', credits_thanks:'AGRADECIMIENTOS ESPECIALES', credits_created:'CREADO POR',
    },
    en: {
      press_start: 'PRESS START', menu_title: 'MAIN MENU',
      m_arcade: 'ARCADE', m_arcade_desc: 'Face the CPU in a ladder of battles.',
      m_versus: 'VERSUS', m_versus_desc: 'Local fight against a friend on the same screen.',
      m_multi: 'MULTIPLAYER', m_multi_desc: 'Online mode in development.', m_soon: 'COMING SOON',
      m_pdata: 'PLAYER DATA', m_pdata_desc: 'Check your combat records and stats.',
      m_help: 'HELP', m_help_desc: 'Learn combat, classes, attributes and controls.',
      m_controls: 'CONTROLS', m_controls_desc: 'Remap keyboard, gamepad, or enable touch controls.',
      m_options: 'OPTIONS', m_options_desc: 'Configure resolution, FPS, language and audio volume.',
      m_credits: 'CREDITS', m_credits_desc: 'Team roster and development tools.',
      m_exit: 'EXIT', m_exit_desc: 'Closes or resets the game session.',
      options_title: 'OPTIONS', opt_res: 'RESOLUTION', opt_fps: 'FPS', opt_lang: 'LANGUAGE',
      opt_master: 'MASTER VOL.', opt_sfx: 'SFX VOL.', opt_save: 'SAVE & RETURN',
      controls_title: 'CONTROLS', tab_keyboard: 'KEYBOARD', tab_gamepad: 'GAMEPAD', tab_touch: 'TOUCH',
      ctrl_left:'LEFT', ctrl_right:'RIGHT', ctrl_jump:'JUMP', ctrl_basic:'BASIC', ctrl_special:'SPECIAL', ctrl_overdrive:'OVERDRIVE',
      ctrl_remap:'REMAP', ctrl_listening:'PRESS...', ctrl_p1:'PLAYER 1', ctrl_p2:'PLAYER 2',
      ctrl_gamepad_ok:'Gamepad detected ✔', ctrl_gamepad_none:'No gamepad detected. Press any button to connect.',
      ctrl_touch_toggle:'Show touch controls in battle',
      pd_title: 'PLAYER DATA', pd_matches: 'MATCHES PLAYED', pd_p1: 'P1 WINS', pd_p2: 'P2 WINS', pd_cpu: 'CPU WINS', pd_overdrive: 'OVERDRIVES USED',
      cs_title:'SELECT CHARACTERS', cs_confirm: '✕ CONFIRM', cs_back: '◯ BACK', cs_random: '□ RANDOM', cs_commandlist: '△ COMMAND LIST', cs_settings: '⚙ CONTROL SETTINGS',
      kotaro_subtitle:'THE WHITE GUARDIAN · SPIRIT', beast_subtitle:'THE BEAST AXIE · POWER', verdozo_subtitle:'THE GREEN AXIE · PLANT', fuerino_subtitle:'THE FIERY AXIE · FIRE', toyho_subtitle:'THE BLUE AXIE · AQUATIC',
      cs_grid_label: '1P: WASD  ·  2P: ARROWS',
      stat_type: 'TYPE', stat_speed: 'SPEED', stat_range: 'EFFECTIVE RANGE', stat_ease: 'EASE OF USE',
      hud_j1: 'PLAYER 1', hud_j2: 'PLAYER 2', hud_cpu: 'CPU',
      victory_of: 'VICTORY FOR ', draw_text: 'DRAW!',
      victory_rematch:'REMATCH', victory_menu:'MAIN MENU',
      watermark: '⚠️ PROTOTYPE IN DEVELOPMENT - NOT A FINAL VERSION — ⚠️ PROTOTYPE IN DEVELOPMENT - NOT A FINAL VERSION —',
      back: '◀ BACK',
      controls_local: 'P1: A/D move·W jump·J basic·K special·L OVERDRIVE   |   P2: ←/→ move·↑ jump·Ctrl basic·Shift special·/ OVERDRIVE',
      controls_ai: 'P1: A/D move · W jump · J basic · K special · L OVERDRIVE (AXP full)',
      cl_title: 'COMMAND LIST', cl_close: 'CLOSE',
      credits_role_direction:'Direction & Design', credits_role_engine:'Engine & Programming', credits_role_ai:'AI-assisted development',
      help_title:'HELP', help_lead:'Axie Smash is a local arcade fighting game: choose an Axie, master its moves, and empty the opponent’s health bar before time runs out.',
      help_combat_title:'COMBAT', help_combat:'Move, jump and attack. Basic attacks are fast; specials have more reach and damage. With full AXP, activate OVERDRIVE to boost your offense.',
      help_classes_title:'CLASSES', help_classes:'Plant excels at durability; Beast at raw power; Fuerino at speed and fire; Toyho at aquatic reach; and Kotaro, the White Guardian, combines fast movement with spirit energy.',
      help_stats_title:'ATTRIBUTES & STATS', help_stats:'TYPE defines the style. SPEED determines mobility. EFFECTIVE RANGE shows safe attack distance. EASE OF USE indicates a fighter’s complexity.',
      help_controls_title:'CONTROLS', help_controls:'P1: A/D move, W jump, J basic, K special and L OVERDRIVE. P2: arrows move/jump, Ctrl basic, Shift special and / OVERDRIVE. Remap them in Controls.',
      credits_role_art:'Art & AI tools', credits_role_design:'UI/UX design references', credits_role_partners:'PARTNERS', credits_subtitle:'ARCADE FIGHTING GAME', credits_thanks:'SPECIAL ACKNOWLEDGMENTS', credits_created:'CREATED BY',
    },
    ja: {
      press_start:'PRESS START', menu_title:'メインメニュー', m_arcade:'ARCADE', m_arcade_desc:'CPUとの連続バトルに挑戦します。',
      m_versus:'VERSUS', m_versus_desc:'同じ画面で友達と対戦します。', m_multi:'マルチプレイヤー', m_multi_desc:'オンラインモードは開発中です。', m_soon:'近日公開',
      m_pdata:'PLAYER DATA', m_pdata_desc:'戦績とバトル統計を確認します。', m_help:'ヘルプ', m_help_desc:'バトル、クラス、能力、操作を確認します。',
      m_controls:'操作設定', m_controls_desc:'キーボード、ゲームパッド、タッチ操作を設定します。', m_options:'オプション', m_options_desc:'解像度、FPS、言語、音量を設定します。',
      m_credits:'クレジット', m_credits_desc:'制作チームと開発ツール。', m_exit:'終了', m_exit_desc:'タイトル画面に戻ります。',
      options_title:'オプション', opt_res:'解像度', opt_fps:'FPS', opt_lang:'言語', opt_master:'マスター音量', opt_sfx:'効果音', opt_save:'保存して戻る',
      controls_title:'操作設定', tab_keyboard:'キーボード', tab_gamepad:'ゲームパッド', tab_touch:'タッチ', ctrl_left:'左', ctrl_right:'右', ctrl_jump:'ジャンプ', ctrl_basic:'通常攻撃', ctrl_special:'必殺技', ctrl_overdrive:'オーバードライブ',
      ctrl_remap:'変更', ctrl_listening:'入力待機中...', ctrl_p1:'プレイヤー 1', ctrl_p2:'プレイヤー 2', ctrl_gamepad_ok:'ゲームパッドを検出 ✔', ctrl_gamepad_none:'ゲームパッドが見つかりません。ボタンを押して接続してください。', ctrl_touch_toggle:'バトルでタッチ操作を表示',
      pd_title:'PLAYER DATA', pd_matches:'対戦数', pd_p1:'P1 勝利', pd_p2:'P2 勝利', pd_cpu:'CPU 勝利', pd_overdrive:'OVERDRIVE 使用数',
      cs_title:'キャラクターセレクト', cs_confirm:'✕ 決定', cs_back:'◯ 戻る', cs_random:'□ ランダム', cs_commandlist:'△ コマンド一覧', cs_settings:'⚙ 操作設定', kotaro_subtitle:'白き守護者 · スピリット', beast_subtitle:'ビーストアクシー · パワー', verdozo_subtitle:'緑のアクシー · プラント', fuerino_subtitle:'炎のアクシー · ファイア', toyho_subtitle:'青のアクシー · アクアティック', cs_grid_label:'1P: WASD · 2P: 矢印キー',
      stat_type:'タイプ', stat_speed:'スピード', stat_range:'有効範囲', stat_ease:'使いやすさ', hud_j1:'プレイヤー 1', hud_j2:'プレイヤー 2', hud_cpu:'CPU', victory_of:'勝者：', draw_text:'引き分け！', victory_rematch:'再戦', victory_menu:'メインメニュー',
      watermark:'⚠️ 開発中のプロトタイプです — ⚠️ 開発中のプロトタイプです —', back:'◀ 戻る', controls_local:'P1: A/D 移動・W ジャンプ・J 通常・K 必殺・L OVERDRIVE | P2: 矢印 移動・Ctrl 通常・Shift 必殺・/ OVERDRIVE', controls_ai:'P1: A/D 移動 · W ジャンプ · J 通常 · K 必殺 · L OVERDRIVE', cl_title:'コマンド一覧', cl_close:'閉じる',
      credits_role_direction:'ディレクション＆デザイン', credits_role_engine:'エンジン＆プログラミング', credits_role_ai:'AI支援開発', credits_role_art:'アート＆AIツール', credits_role_design:'UI/UX デザイン参考', credits_role_partners:'パートナー', credits_subtitle:'アーケード格闘ゲーム', credits_thanks:'スペシャルサンクス', credits_created:'制作',
      help_title:'ヘルプ', help_lead:'Axie Smashはローカル対戦アーケードゲームです。Axieを選び、技を使いこなし、時間切れ前に相手の体力をゼロにしましょう。',
      help_combat_title:'バトル', help_combat:'移動、ジャンプ、攻撃を使います。通常攻撃は速く、必殺技は射程とダメージに優れます。AXPが満タンならOVERDRIVEで攻撃力を高められます。',
      help_classes_title:'クラス', help_classes:'Plantは耐久力、Beastはパワー、Fuerinoは炎とスピード、Toyhoは水属性のリーチに優れます。白き守護者Kotaroは、素早い移動とスピリットの力を兼ね備えています。',
      help_stats_title:'能力とステータス', help_stats:'タイプは戦い方、スピードは機動力、有効範囲は安全な攻撃距離、使いやすさは操作の難しさを表します。',
      help_controls_title:'操作', help_controls:'P1: A/D移動、Wジャンプ、J通常、K必殺、L OVERDRIVE。P2: 矢印移動/ジャンプ、Ctrl通常、Shift必殺、/ OVERDRIVE。操作設定で変更できます。'
    }
  };
  function t(key) { return (LANG[settings.lang] && LANG[settings.lang][key]) || LANG.es[key] || key; }

  // ===========================================================
  // AUDIO — Web Audio API
  // ===========================================================
  const AudioMgr = {
    ctx: null, master: null, sfx: null,
    ensureCtx() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain(); this.sfx = this.ctx.createGain();
        this.sfx.connect(this.master); this.master.connect(this.ctx.destination);
        this.setMaster(settings.masterVol); this.setSfx(settings.sfxVol);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    },
    setMaster(v) { if (this.master) this.master.gain.value = v / 100; },
    setSfx(v) { if (this.sfx) this.sfx.gain.value = v / 100; },
    tone(freq, dur, type, startGain) {
      if (!this.ctx) return;
      const t0 = this.ctx.currentTime;
      const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
      osc.type = type || 'sine'; osc.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(startGain || 0.25, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(g); g.connect(this.sfx); osc.start(t0); osc.stop(t0 + dur);
    },
    move() { this.ensureCtx(); this.tone(440, 0.06, 'square', 0.12); },
    confirm() { this.ensureCtx(); this.tone(660, 0.1, 'square', 0.18); this.tone(880, 0.12, 'square', 0.12); },
    hit(special) { this.ensureCtx(); this.tone(special ? 180 : 120, special ? 0.22 : 0.1, 'sawtooth', special ? 0.3 : 0.22); },
    jump() { this.ensureCtx(); this.tone(320, 0.08, 'triangle', 0.14); },
    overdrive() { this.ensureCtx(); this.tone(200, 0.4, 'sawtooth', 0.28); this.tone(520, 0.4, 'square', 0.18); },
  };
  const MusicMgr = new AudioManager({ volume:(settings.masterVol / 100) * 0.7 });
  const unlockMusic = () => MusicMgr.unlock();
  window.addEventListener('pointerdown', unlockMusic, { capture:true, passive:true });
  window.addEventListener('keydown', unlockMusic, { capture:true });

  // ===========================================================
  // REFERENCIAS DOM
  // ===========================================================
  const gameContainer = document.getElementById('game-container');
  const canvas = document.getElementById('game-canvas');
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const GROUND_Y = H - 100;
  // La plataforma visible empieza 55 px debajo del horizonte del escenario.
  const FIGHTER_GROUND_Y = GROUND_Y + 55;
  const SPRITE_HEIGHT = 136;
  const GRAVITY = 0.7;

  const screens = {
    INTRO: document.getElementById('screen-intro'),
    TITLE: document.getElementById('screen-title'),
    MENU: document.getElementById('screen-menu'),
    OPTIONS: document.getElementById('screen-options'),
    CONTROLS: document.getElementById('screen-controls'),
    PLAYER_DATA: document.getElementById('screen-playerdata'),
    HELP: document.getElementById('screen-help'),
    CREDITS: document.getElementById('screen-credits'),
    CHAR_SELECT: document.getElementById('screen-charselect'),
    VS: document.getElementById('screen-vs'),
    ROOM: document.getElementById('screen-room'),
    VICTORY: document.getElementById('screen-victory'),
  };
  const hud = document.getElementById('hud');
  const timerEl = document.getElementById('timer');
  const timerValueEl = document.getElementById('timer-value');
  const controlsHint = document.getElementById('controls-hint');
  const globalBackBtn = document.getElementById('global-back-btn');
  const watermarkText = document.getElementById('watermark-text');
  const touchControlsEl = document.getElementById('touch-controls');

  const p1HpBar = document.getElementById('p1-hp-bar');
  const p2HpBar = document.getElementById('p2-hp-bar');
  const p1AxpBar = document.getElementById('p1-axp-bar');
  const p2AxpBar = document.getElementById('p2-axp-bar');
  const p1AxpOuter = document.getElementById('p1-axp-outer');
  const p2AxpOuter = document.getElementById('p2-axp-outer');
  const p1HpLabel = document.getElementById('p1-hp-label');
  const p2HpLabel = document.getElementById('p2-hp-label');
  const p1ClassStatus = document.getElementById('p1-class-status');
  const p2ClassStatus = document.getElementById('p2-class-status');
  const p1HudLogo = document.getElementById('p1-hud-logo');
  const p2HudLogo = document.getElementById('p2-hud-logo');
  const victoryText = document.getElementById('victory-text');
  const introVideo = document.getElementById('intro-video');
  const introPlayBtn = document.getElementById('intro-play-btn');
  const introSkipBtn = document.getElementById('intro-skip-btn');

  // ===========================================================
  // MÁQUINA DE ESTADOS
  // ===========================================================
  let STATE = 'INTRO';
  let optionsReturnState = 'MENU';
  let controlsReturnState = 'MENU';
  const BACK_ALLOWED = ['MENU', 'OPTIONS', 'CONTROLS', 'PLAYER_DATA', 'HELP', 'CREDITS', 'ROOM'];

  function goTo(newState) {
    if (STATE === 'INTRO' && newState !== 'INTRO') introVideo.pause();
    STATE = newState;
    MusicMgr.transitionToState(newState);
    Object.values(screens).forEach(el => el.classList.add('hidden'));
    hud.classList.add('hidden'); timerEl.classList.add('hidden'); controlsHint.classList.add('hidden');
    touchControlsEl.classList.add('hidden');
    if (newState !== 'BATTLE') document.getElementById('round-callout').classList.add('hidden');

    if (screens[newState]) screens[newState].classList.remove('hidden');
    if (newState === 'INTRO') {
      introVideo.currentTime = 0;
      introPlayBtn.classList.add('hidden');
      introVideo.play().catch(() => introPlayBtn.classList.remove('hidden'));
    }
    if (newState === 'BATTLE') {
      hud.classList.remove('hidden'); timerEl.classList.remove('hidden'); controlsHint.classList.remove('hidden');
      if (controls.touchEnabled) touchControlsEl.classList.remove('hidden');
    }
    if (newState === 'MENU') renderMenuScreen();
    if (newState === 'OPTIONS') renderOptionsScreen();
    if (newState === 'CONTROLS') renderControlsScreen(ctrlActiveTab);
    if (newState === 'PLAYER_DATA') renderPlayerDataScreen();
    if (newState === 'HELP') renderHelpScreen();
    if (newState === 'CREDITS') renderCreditsScreen();
    if (newState === 'ROOM') renderRoomScreen();
    if (newState === 'CHAR_SELECT') refreshCharSelectUI();
    if (newState === 'VS') renderVsScreen();
    if (newState === 'VICTORY') {
      document.getElementById('rematch-btn').textContent = t('victory_rematch');
      document.getElementById('menu-btn').textContent = t('victory_menu');
    }

    document.getElementById('press-start').textContent = t('press_start');

    globalBackBtn.classList.toggle('hidden', !BACK_ALLOWED.includes(newState));
    globalBackBtn.textContent = t('back');
  }
  function handleGlobalBack() {
    AudioMgr.move();
    if (STATE === 'MENU' && menuGroup !== 'root') { menuGroup='root'; menuSelectedIndex=0; renderMenuScreen(); }
    else if (STATE === 'MENU') goTo('TITLE');
    else if (STATE === 'OPTIONS') goTo(optionsReturnState);
    else if (STATE === 'CONTROLS') goTo(controlsReturnState);
    else if (STATE === 'PLAYER_DATA') goTo('MENU');
    else if (STATE === 'HELP') goTo('MENU');
    else if (STATE === 'CREDITS') goTo('MENU');
    else if (STATE === 'ROOM') { leaveRoom(); goTo('MENU'); }
  }
  globalBackBtn.addEventListener('click', handleGlobalBack);

  // ===========================================================
  // ARTE Y LOGOS DEL ROSTER OFICIAL
  // ===========================================================
  const CHAR_PORTRAIT_IMG = {
    oleg:ASSET_PATHS.ui.portraits.oleg, kotaro:ASSET_PATHS.ui.portraits.kotaro,
    pomodoro:ASSET_PATHS.ui.portraits.pomodoro, buba:ASSET_PATHS.ui.portraits.buba
  };
  const CHAR_LOGOS = Object.fromEntries(CHAR_KEYS.map((key) => [key, ASSET_PATHS.sprites[key].logo]));

  // ===========================================================
  // Hojas ligeras para el roster completo: IDLE, WALK y PUNCH.
  // ===========================================================
  const FIGHTER_SPRITES = createSpriteRegistry();

  const assetLoader = new AssetLoader(ASSET_MANIFEST);
  let rosterAssetsReady = false;
  async function loadRosterAssets() {
    await assetLoader.loadAll();
    [['oleg','sprite.oleg.atlas'],['kotaro','sprite.kotaro.atlas'],['pomodoro','sprite.pomodoro.atlas'],['buba','sprite.buba.atlas']]
      .forEach(([type,key]) => {
        const sprite = FIGHTER_SPRITES[type];
        sprite.img = assetLoader.get(key);
        prepareSpriteSheet(sprite);
      });

    // Si existen idle.png, walk.png, jump.png o attack.png en la carpeta de un
    // personaje, sustituyen únicamente ese estado. atlas.png queda como respaldo.
    await Promise.all(PLAYABLE_KEYS.map(async (type) => {
      const states = await assetLoader.loadCharacterStates(type);
      Object.entries(states).forEach(([fileState,image]) => {
        if (image) installStandardStateSheet(FIGHTER_SPRITES[type], fileState, image);
      });
    }));
    rosterAssetsReady = true;
  }
  loadRosterAssets().catch(error => console.error('Error cargando el roster:', error));

  // Las hojas incluyen un fondo oscuro de referencia. Se convierte una sola vez
  // a alfa transparente y se reutiliza el canvas resultante durante todo el combate.
  function prepareSpriteSheet(sprite) {
    const surface = document.createElement('canvas');
    surface.width = sprite.img.naturalWidth; surface.height = sprite.img.naturalHeight;
    const surfaceCtx = surface.getContext('2d', { alpha:true });
    surfaceCtx.drawImage(sprite.img, 0, 0);
    const pixels = surfaceCtx.getImageData(0, 0, surface.width, surface.height);
    const data = pixels.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      // Conserva contornos oscuros y elimina solo el fondo de referencia de cada hoja.
      const transparentPanel = sprite.tint === 'red'
        ? r < 30 && g < 18 && b < 18 && r >= g + 2
        : sprite.tint === 'blue'
          ? r < 20 && g < 42 && b < 78 && b >= g + 20
          : r < 28 && g < 42 && b < 52 && b >= r + 7;
      if (transparentPanel) data[i + 3] = 0;
    }
    surfaceCtx.putImageData(pixels, 0, 0);
    sprite.surface = surface;
    sprite.styledFrames = new Map();
  }

  function prepareKotaroStateSheet(sprite, sheet) {
    const surface = document.createElement('canvas');
    surface.width = sheet.img.naturalWidth; surface.height = sheet.img.naturalHeight;
    const surfaceCtx = surface.getContext('2d', { alpha:true });
    surfaceCtx.drawImage(sheet.img, 0, 0);
    sheet.surface = surface;
    if (!sprite.styledFrames) sprite.styledFrames = new Map();
  }

  // Elimina únicamente el fondo claro conectado a los bordes. Así se conservan
  // los blancos internos del pelaje, la espada y los brillos del personaje.
  function removeConnectedSpriteBackground(surfaceCtx, width, height) {
    const pixels = surfaceCtx.getImageData(0, 0, width, height);
    const data = pixels.data;
    const visited = new Uint8Array(width * height);
    const queue = new Int32Array(width * height);
    let head = 0, tail = 0;
    const isBackground = (index) => {
      const offset = index * 4;
      const r=data[offset], g=data[offset+1], b=data[offset+2];
      return Math.max(r,g,b)-Math.min(r,g,b) <= 20 && (r+g+b)/3 >= 90;
    };
    const enqueue = (index) => {
      if (index < 0 || index >= visited.length || visited[index] || !isBackground(index)) return;
      visited[index] = 1; queue[tail++] = index;
    };
    for (let x=0; x<width; x++) { enqueue(x); enqueue((height-1)*width+x); }
    for (let y=0; y<height; y++) { enqueue(y*width); enqueue(y*width+width-1); }
    while (head < tail) {
      const index=queue[head++], x=index%width;
      data[index*4+3]=0;
      if (x>0) enqueue(index-1);
      if (x<width-1) enqueue(index+1);
      enqueue(index-width); enqueue(index+width);
    }
    surfaceCtx.putImageData(pixels,0,0);
  }

  // Convención para estados nuevos: tira PNG horizontal, fondo transparente.
  // Se conserva el conteo del estado equivalente del registro del personaje.
  function installStandardStateSheet(sprite, fileState, image) {
    const engineState = fileState === 'attack' ? 'punch' : fileState;
    const fallback = sprite.frames[engineState] || sprite.frames.idle;
    const layout = sprite.standardLayouts && sprite.standardLayouts[fileState];
    const count = Math.max(1, (layout && layout.count) || fallback.count || 1);
    const columns = Math.max(1, (layout && layout.columns) || count);
    const rows = Math.max(1, (layout && layout.rows) || Math.ceil(count / columns));
    const sheetKey = `standard-${fileState}`;
    if (!sprite.stateSheets) sprite.stateSheets = {};
    const sheet = { img:image };
    sprite.stateSheets[sheetKey] = sheet;
    prepareKotaroStateSheet(sprite, sheet);
    if (layout && layout.removeConnectedBackground) {
      const cleanCtx = sheet.surface.getContext('2d', { alpha:true });
      removeConnectedSpriteBackground(cleanCtx, sheet.surface.width, sheet.surface.height);
    }
    sprite.frames[engineState] = {
      sheet:sheetKey,
      cellWidth:image.naturalWidth / columns,
      cellHeight:image.naturalHeight / rows,
      cropX:0, cropY:0,
      frameWidth:image.naturalWidth / columns,
      frameHeight:image.naturalHeight / rows,
      count, columns
    };
  }


  // ===========================================================
  // DATOS DE PERSONAJES — AXIE CORE
  // ===========================================================


  let gameMode = 'LOCAL';
  let p1CursorIndex = 0, p2CursorIndex = 7;
  let p1Selection = CHAR_KEYS[p1CursorIndex], p2Selection = CHAR_KEYS[p2CursorIndex];

  function renderCoreParts(containerEl, type) {
    const parts = CHAR_DATA[type].parts;
    containerEl.innerHTML = ['horn','back','tail','mouth'].map(key =>
      '<span class="core-chip" title="' + PART_LABELS[key] + ': ' + parts[key] + '">' + PART_LABELS[key].slice(0,2) + '</span>'
    ).join('');
  }
  function renderStatsPanel(containerEl, type) {
    const s = CHAR_DATA[type].stats, lang = settings.lang;
    const stat = key => s[key][lang] || s[key].en || s[key].es;
    containerEl.innerHTML =
      '<div class="stat-row"><span class="stat-label">' + t('stat_type') + '</span><span class="stat-value">' + stat('type') + '</span></div>' +
      '<div class="stat-row"><span class="stat-label">' + t('stat_speed') + '</span><span class="stat-value">' + stat('speed') + '</span></div>' +
      '<div class="stat-row"><span class="stat-label">' + t('stat_range') + '</span><span class="stat-value">' + stat('range') + '</span></div>' +
      '<div class="stat-row"><span class="stat-label">' + t('stat_ease') + '</span><span class="stat-value">' + stat('ease') + '</span></div>';
  }

  // ===========================================================
  // MENÚ PRINCIPAL
  // ===========================================================
  const menuListEl = document.getElementById('menu-list');
  const menuDescPanel = document.getElementById('menu-desc-panel');
  const menuTitleText = document.getElementById('menu-title-text');
  let menuSelectedIndex = 0;
  let menuGroup = 'root';
  const uiText = (es,en,ja) => settings.lang === 'ja' ? ja : settings.lang === 'en' ? en : es;
  function openMenuGroup(group) { menuGroup=group; menuSelectedIndex=0; renderMenuScreen(); }

  function getMenuItems() {
    const item=(id,label,action,disabled=false)=>({id,label,action,disabled,soon:disabled?t('m_soon'):null,desc:disabled?t('m_soon'):label});
    const back=item('back',t('back'),()=>openMenuGroup('root'));
    if (menuGroup==='local') return [
      item('arcade',t('m_arcade'),()=>{gameMode='AI';goTo('CHAR_SELECT');}),
      item('versus',t('m_versus'),()=>{gameMode='LOCAL';goTo('CHAR_SELECT');}),
      item('campaign',uiText('CAMPAÑA','CAMPAIGN','キャンペーン'),null,true),
      item('tournament',uiText('TORNEOS','TOURNAMENTS','トーナメント'),null,true),back];
    if (menuGroup==='multi') return [
      item('quick',uiText('PARTIDA RÁPIDA','QUICK MATCH','クイックマッチ'),null,true),
      item('ranked',uiText('CLASIFICATORIA','RANKED','ランク戦'),null,true),
      item('room',uiText('SALA','ROOM','ルーム'),()=>goTo('ROOM')),back];
    if (menuGroup==='help') return [
      item('guide',uiText('GUÍA DEL JUEGO','GAME GUIDE','ゲームガイド'),()=>goTo('HELP')),
      item('controls',t('m_controls'),()=>{controlsReturnState='MENU';goTo('CONTROLS');}),
      item('credits',t('m_credits'),()=>goTo('CREDITS')),back];
    return [
      item('local',uiText('LOCAL','LOCAL','ローカル'),()=>openMenuGroup('local')),
      item('multi',t('m_multi'),()=>openMenuGroup('multi')),
      item('help',t('m_help'),()=>openMenuGroup('help')),
      item('profile',uiText('PERFIL','PROFILE','プロフィール'),()=>goTo('PLAYER_DATA')),
      item('options',t('m_options'),()=>{optionsReturnState='MENU';goTo('OPTIONS');}),
      item('exit',t('m_exit'),()=>{player1=null;player2=null;goTo('TITLE');})];
  }
  function renderMenuScreen() {
    menuTitleText.textContent = menuGroup==='root'?t('menu_title'):menuGroup==='local'?uiText('LOCAL','LOCAL','ローカル'):menuGroup==='multi'?t('m_multi'):t('m_help');
    const items = getMenuItems();
    menuSelectedIndex=Math.min(menuSelectedIndex,items.length-1);
    menuListEl.innerHTML = '';
    items.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'menu-item' + (idx === menuSelectedIndex ? ' active' : '') + (item.disabled ? ' disabled' : '');
      div.textContent = item.label;
      if (item.soon) { const badge = document.createElement('span'); badge.className='badge-soon'; badge.textContent=item.soon; div.appendChild(badge); }
      div.addEventListener('mouseenter', () => { menuSelectedIndex = idx; updateMenuHighlight(items); });
      div.addEventListener('click', () => { menuSelectedIndex = idx; confirmMenuSelection(items); });
      menuListEl.appendChild(div);
    });
    menuDescPanel.textContent = items[menuSelectedIndex].desc;
  }
  function updateMenuHighlight(items) {
    [...menuListEl.children].forEach((el, idx) => el.classList.toggle('active', idx === menuSelectedIndex));
    menuDescPanel.textContent = items[menuSelectedIndex].desc;
  }
  function confirmMenuSelection(items) {
    const item = items[menuSelectedIndex];
    if (item.disabled) { AudioMgr.move(); return; }
    AudioMgr.confirm();
    if (item.action) item.action();
  }

  // Local lobby transport: no Internet matchmaking is simulated.
  let roomChannel=null, roomTimeout=null, roomHost=false, roomPeer='';
  const roomToken=Math.random().toString(36).slice(2);
  const roomStatus=document.getElementById('room-status');
  function leaveRoom() {
    clearTimeout(roomTimeout);
    if(roomChannel){roomChannel.postMessage({type:'leave',token:roomToken});roomChannel.close();}
    roomChannel=null;roomPeer='';roomHost=false;
    roomStatus.textContent=uiText('Sin sala activa.','No active room.','参加中のルームはありません。');
  }
  function renderRoomScreen() {
    document.getElementById('room-title').textContent=uiText('SALA','ROOM','ルーム');
    document.getElementById('room-description').textContent=uiText('Sala local entre pestañas del mismo navegador y dirección web. El juego por Internet requiere un servidor; esta sala no sincroniza combates.','Local lobby between tabs at the same web address. Internet play requires a server; this lobby does not synchronize fights.','同じブラウザーとURLのタブ間ロビーです。オンライン対戦にはサーバーが必要です。このロビーは試合を同期しません。');
    document.getElementById('room-create').textContent=uiText('CREAR','CREATE','作成');
    document.getElementById('room-join').textContent=uiText('UNIRSE','JOIN','参加');
    document.getElementById('room-code-label').textContent=uiText('CÓDIGO DE SALA','ROOM CODE','ルームコード');
    document.getElementById('room-leave').textContent=uiText('SALIR DE SALA','LEAVE ROOM','退出');
    if(!roomChannel)leaveRoom();
  }
  function connectRoom(host) {
    leaveRoom();
    if(typeof BroadcastChannel==='undefined'){roomStatus.textContent=uiText('Tu navegador no admite salas locales.','Local lobbies are unsupported in this browser.','このブラウザーはローカルロビー非対応です。');return;}
    const input=document.getElementById('room-code');
    const code=host?Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[n%32]).join(''):input.value.trim().toUpperCase();
    if(!/^[A-Z2-9]{6}$/.test(code)){roomStatus.textContent=uiText('Introduce un código válido de 6 caracteres.','Enter a valid 6-character code.','6文字の有効なコードを入力してください。');return;}
    input.value=code;roomHost=host;roomChannel=new BroadcastChannel('axie-smash-room-'+code);
    roomStatus.textContent=host?uiText('Sala creada. Esperando jugador…','Room created. Waiting for a player…','作成済み。プレイヤーを待っています…'):uiText('Buscando sala…','Finding room…','検索中…');
    roomChannel.onmessage=({data})=>{
      if(!data||typeof data.type!=='string')return;
      if(roomHost&&data.type==='join'){
        const accepted=!roomPeer||roomPeer===data.token;
        if(accepted)roomPeer=data.token;
        roomChannel.postMessage({type:accepted?'accepted':'full',target:data.token,token:roomToken});
        if(accepted)roomStatus.textContent=uiText('Dos jugadores conectados al lobby local.','Two players connected to the local lobby.','ローカルロビーに2人接続しました。');
      }else if(!roomHost&&data.target===roomToken&&data.type==='accepted'){
        clearTimeout(roomTimeout);roomPeer=data.token;roomStatus.textContent=uiText('Te has unido al lobby local.','Joined the local lobby.','ローカルロビーに参加しました。');
      }else if(!roomHost&&data.target===roomToken&&data.type==='full'){
        leaveRoom();roomStatus.textContent=uiText('La sala está llena.','Room is full.','ルームが満員です。');
      }else if(data.type==='leave'&&data.token===roomPeer){
        if(roomHost){roomPeer='';roomStatus.textContent=uiText('El otro jugador salió. Esperando…','Player left. Waiting…','相手が退出しました。待機中…');}
        else {leaveRoom();roomStatus.textContent=uiText('El anfitrión cerró la sala.','Host closed the room.','ホストがルームを閉じました。');}
      }
    };
    if(!host){roomChannel.postMessage({type:'join',token:roomToken});roomTimeout=setTimeout(()=>{if(!roomPeer){leaveRoom();roomStatus.textContent=uiText('Sala no encontrada. Abre otra pestaña en esta dirección y crea una sala.','Room not found. Create a room in another tab at this address.','見つかりません。同じURLの別タブでルームを作成してください。');}},2200);}
  }
  document.getElementById('room-create').addEventListener('click',()=>connectRoom(true));
  document.getElementById('room-join').addEventListener('click',()=>connectRoom(false));
  document.getElementById('room-leave').addEventListener('click',leaveRoom);
  window.addEventListener('pagehide',leaveRoom);

  // ===========================================================
  // OPCIONES
  // ===========================================================
  const optResEl = document.getElementById('opt-resolution');
  const optFpsEl = document.getElementById('opt-fps');
  const optLangEl = document.getElementById('opt-lang');
  const optMasterSlider = document.getElementById('opt-master-vol');
  const optSfxSlider = document.getElementById('opt-sfx-vol');
  const optMasterValue = document.getElementById('opt-master-value');
  const optSfxValue = document.getElementById('opt-sfx-value');

  function buildPillRow(container, choices, currentValue, onSelect) {
    container.innerHTML = '';
    choices.forEach(choice => {
      const pill = document.createElement('div');
      pill.className = 'opt-pill' + (choice.value === currentValue ? ' active' : '');
      pill.textContent = choice.label;
      pill.addEventListener('click', () => { AudioMgr.confirm(); onSelect(choice.value); renderOptionsScreen(); });
      container.appendChild(pill);
    });
  }
  function renderOptionsScreen() {
    document.getElementById('options-title-text').textContent = t('options_title');
    document.getElementById('opt-label-res').textContent = t('opt_res');
    document.getElementById('opt-label-fps').textContent = t('opt_fps');
    document.getElementById('opt-label-lang').textContent = t('opt_lang');
    document.getElementById('opt-label-master').textContent = t('opt_master');
    document.getElementById('opt-label-sfx').textContent = t('opt_sfx');
    document.getElementById('options-save-btn').textContent = t('opt_save');
    globalBackBtn.textContent = t('back');
    buildPillRow(optResEl, [{label:'1280x720',value:'1280x720'},{label:'1920x1080',value:'1920x1080'}], settings.resolution, v => { settings.resolution=v; applyResolutionSetting(); });
    buildPillRow(optFpsEl, [{label:'30 FPS',value:30},{label:'60 FPS',value:60}], settings.fps, v => { settings.fps=v; });
    buildPillRow(optLangEl, [{label:'Español',value:'es'},{label:'English',value:'en'},{label:'日本語',value:'ja'}], settings.lang, v => { settings.lang=v; });
    optMasterSlider.value = settings.masterVol; optSfxSlider.value = settings.sfxVol;
    optMasterValue.textContent = settings.masterVol; optSfxValue.textContent = settings.sfxVol;
  }
  optMasterSlider.addEventListener('input', () => { settings.masterVol = parseInt(optMasterSlider.value,10); optMasterValue.textContent = settings.masterVol; AudioMgr.setMaster(settings.masterVol); MusicMgr.setVolume((settings.masterVol / 100) * 0.7); });
  optSfxSlider.addEventListener('input', () => { settings.sfxVol = parseInt(optSfxSlider.value,10); optSfxValue.textContent = settings.sfxVol; AudioMgr.ensureCtx(); AudioMgr.setSfx(settings.sfxVol); });
  optSfxSlider.addEventListener('change', () => AudioMgr.move());
  document.getElementById('options-save-btn').addEventListener('click', () => { AudioMgr.confirm(); saveSettingsToStorage(); goTo(optionsReturnState); });
  function applyResolutionSetting() { gameContainer.classList.toggle('res-1080', settings.resolution === '1920x1080'); }

  // ===========================================================
  // CONTROLES (remapeo teclado / gamepad / táctil)
  // ===========================================================
  let ctrlActiveTab = 'keyboard';
  const ctrlTabsEl = document.getElementById('ctrl-tabs');
  const ctrlBodyEl = document.getElementById('ctrl-panel-body');

  function renderControlsScreen(tab) {
    ctrlActiveTab = tab || 'keyboard';
    document.getElementById('controls-title-text').textContent = t('controls_title');
    document.getElementById('controls-save-btn').textContent = t('opt_save');

    ctrlTabsEl.innerHTML = '';
    [['keyboard', t('tab_keyboard')], ['gamepad', t('tab_gamepad')], ['touch', t('tab_touch')]].forEach(([id, label]) => {
      const tabEl = document.createElement('div');
      tabEl.className = 'ctrl-tab' + (ctrlActiveTab === id ? ' active' : '');
      tabEl.textContent = label;
      tabEl.addEventListener('click', () => { AudioMgr.move(); renderControlsScreen(id); });
      ctrlTabsEl.appendChild(tabEl);
    });

    if (ctrlActiveTab === 'keyboard') renderKeyboardTab();
    else if (ctrlActiveTab === 'gamepad') renderGamepadTab();
    else renderTouchTab();
  }

  const ACTIONS = ['left','right','jump','basic','special','overdrive'];
  const ACTION_LABEL_KEYS = { left:'ctrl_left', right:'ctrl_right', jump:'ctrl_jump', basic:'ctrl_basic', special:'ctrl_special', overdrive:'ctrl_overdrive' };
  function keyDisplayName(k) {
    if (!k) return '—';
    const map = { arrowleft:'←', arrowright:'→', arrowup:'↑', arrowdown:'↓', control:'CTRL', shift:'SHIFT', ' ':'SPACE' };
    return (map[k] || k).toUpperCase();
  }

  function renderKeyboardTab() {
    let html = '';
    ['p1','p2'].forEach(player => {
      html += '<div class="ctrl-group-title">' + t(player === 'p1' ? 'ctrl_p1' : 'ctrl_p2') + '</div>';
      ACTIONS.forEach(action => {
        const isListening = remapListening && remapListening.device === 'keyboard' && remapListening.player === player && remapListening.action === action;
        const keyLabel = isListening ? t('ctrl_listening') : keyDisplayName(controls.keyboard[player][action]);
        html += '<div class="ctrl-row"><span class="ctrl-label">' + t(ACTION_LABEL_KEYS[action]) + '</span>' +
          '<span class="ctrl-key' + (isListening ? ' listening' : '') + '" data-player="' + player + '" data-action="' + action + '">' + keyLabel + '</span>' +
          '<button class="ctrl-remap-btn" data-player="' + player + '" data-action="' + action + '">' + t('ctrl_remap') + '</button></div>';
      });
    });
    ctrlBodyEl.innerHTML = html;
    ctrlBodyEl.querySelectorAll('.ctrl-remap-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        AudioMgr.move();
        remapListening = { device:'keyboard', player: btn.dataset.player, action: btn.dataset.action };
        renderControlsScreen('keyboard');
      });
    });
  }

  function renderGamepadTab() {
    const pads = (navigator.getGamepads ? navigator.getGamepads() : []) || [];
    const connected = [...pads].filter(p => p);
    let html = '<div class="ctrl-gamepad-status">' + (connected.length ? t('ctrl_gamepad_ok') + ' (' + connected.length + ')' : t('ctrl_gamepad_none')) + '</div>';
    ['p1','p2'].forEach(player => {
      html += '<div class="ctrl-group-title">' + t(player === 'p1' ? 'ctrl_p1' : 'ctrl_p2') + '</div>';
      ['jump','basic','special','overdrive'].forEach(action => {
        const isListening = remapListening && remapListening.device === 'gamepad' && remapListening.player === player && remapListening.action === action;
        const btnIdx = controls.gamepad[player][action];
        const keyLabel = isListening ? t('ctrl_listening') : ('BTN ' + btnIdx);
        html += '<div class="ctrl-row"><span class="ctrl-label">' + t(ACTION_LABEL_KEYS[action]) + '</span>' +
          '<span class="ctrl-key' + (isListening ? ' listening' : '') + '">' + keyLabel + '</span>' +
          '<button class="ctrl-remap-btn" data-player="' + player + '" data-action="' + action + '">' + t('ctrl_remap') + '</button></div>';
      });
    });
    ctrlBodyEl.innerHTML = html;
    ctrlBodyEl.querySelectorAll('.ctrl-remap-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        AudioMgr.move();
        remapListening = { device:'gamepad', player: btn.dataset.player, action: btn.dataset.action };
        renderControlsScreen('gamepad');
      });
    });
  }

  function renderTouchTab() {
    let html = '<div class="ctrl-toggle-row"><div class="ctrl-toggle' + (controls.touchEnabled ? ' on' : '') + '" id="touch-toggle-el"><div class="knob"></div></div>' +
      '<span style="color:#fff;font-size:12px;">' + t('ctrl_touch_toggle') + '</span></div>';
    ctrlBodyEl.innerHTML = html;
    document.getElementById('touch-toggle-el').addEventListener('click', () => {
      AudioMgr.move();
      controls.touchEnabled = !controls.touchEnabled;
      renderControlsScreen('touch');
    });
  }

  document.getElementById('controls-save-btn').addEventListener('click', () => {
    AudioMgr.confirm(); remapListening = null; saveControlsToStorage(); goTo(controlsReturnState);
  });

  // Captura de teclado para remapeo (se revisa antes que cualquier otra lógica de tecla)
  window.addEventListener('keydown', (e) => {
    if (remapListening && remapListening.device === 'keyboard') {
      e.preventDefault();
      const k = e.key.toLowerCase();
      if (k === 'escape') { remapListening = null; renderControlsScreen('keyboard'); return; }
      controls.keyboard[remapListening.player][remapListening.action] = k;
      remapListening = null;
      AudioMgr.confirm();
      renderControlsScreen('keyboard');
    }
  }, true);

  // ===========================================================
  // PLAYER DATA
  // ===========================================================
  function renderPlayerDataScreen() {
    document.getElementById('pd-title-text').textContent = uiText('PERFIL','PROFILE','プロフィール');
    const grid = document.getElementById('pd-grid');
    const rows = [
      [t('pd_matches'), playerStats.matchesPlayed], [t('pd_p1'), playerStats.p1Wins],
      [t('pd_p2'), playerStats.p2Wins], [t('pd_cpu'), playerStats.cpuWins], [t('pd_overdrive'), playerStats.overdrivesUsed],
    ];
    grid.innerHTML = rows.map(r => '<div class="pd-stat"><div class="pd-label">' + r[0] + '</div><div class="pd-value">' + r[1] + '</div></div>').join('');
  }

  // ===========================================================
  // HELP
  // ===========================================================
  function renderHelpScreen() {
    document.getElementById('help-title-text').textContent = t('help_title');
    document.getElementById('help-lead-text').textContent = t('help_lead');
    const cards = [
      ['help_combat_title', 'help_combat'],
      ['help_classes_title', 'help_classes'],
      ['help_stats_title', 'help_stats'],
      ['help_controls_title', 'help_controls'],
    ];
    document.getElementById('help-grid').innerHTML = cards.map(([title, body]) =>
      '<article class="help-card"><h3>' + t(title) + '</h3><p>' + t(body) + '</p></article>'
    ).join('');
  }

  // ===========================================================
  // CRÉDITOS
  // ===========================================================
  function renderCreditsScreen() {
    const el = document.getElementById('credits-crawl-content');
    const roleBlock = (role, name) => '<div class="credit-block"><div class="credit-role">' + role + '</div><div class="credit-name">' + name + '</div></div>';
    el.innerHTML =
      '<img class="credits-logo-img" src="./assets/ui/game-logo.png" alt="Axie Smash">' +
      '<h2>VibeAthon Edition</h2>' +
      roleBlock(t('credits_role_direction'), 'GameX') +
      roleBlock(t('credits_role_engine'), 'HTML5 Canvas + JavaScript') +
      roleBlock(t('credits_role_ai'), 'Codex - OpenAI • Claude Code - Anthropic') +
      roleBlock(t('credits_role_art'), 'GPT · Gemini · Qwen') +
      roleBlock(t('credits_role_design'), 'Marvel vs. Capcom 3 · Street Fighter 6 · Ultra Street Fighter IV') +
      roleBlock(t('credits_thanks'), 'Axie Infinity · Sky Mavis') +
      roleBlock(t('credits_created'), 'GameX') +
      '<div class="credit-block"><div class="credit-name" style="font-size:13px;color:#888;">© 2026 AXIE SMASH</div></div>';
  }

  // ===========================================================
  // CHAR SELECT
  // ===========================================================
  const sharedGrid = document.getElementById('shared-char-grid');
  const p1PortraitImg = document.getElementById('p1-portrait-img');
  const p2PortraitImg = document.getElementById('p2-portrait-img');
  const p1PortraitLabel = document.getElementById('p1-portrait-label');
  const p2PortraitLabel = document.getElementById('p2-portrait-label');
  const p1PreviewLogo = document.getElementById('p1-preview-logo');
  const p2PreviewLogo = document.getElementById('p2-preview-logo');
  const p2PortraitTag = document.getElementById('p2-portrait-tag');
  const p1CorePartsSelect = document.getElementById('p1-core-parts-select');
  const p2CorePartsSelect = document.getElementById('p2-core-parts-select');
  const p1CorePartsHud = document.getElementById('p1-core-parts-hud');
  const p2CorePartsHud = document.getElementById('p2-core-parts-hud');
  const p1StatsPanel = document.getElementById('p1-stats-panel');
  const p2StatsPanel = document.getElementById('p2-stats-panel');
  const csGridLabel = document.getElementById('cs-grid-label');
  const commandListModal = document.getElementById('command-list-modal');
  const vsP1Art = document.getElementById('vs-p1-art');
  const vsP2Art = document.getElementById('vs-p2-art');
  const vsP1Logo = document.getElementById('vs-p1-logo');
  const vsP2Logo = document.getElementById('vs-p2-logo');
  const vsP1Name = document.getElementById('vs-p1-name');
  const vsP2Name = document.getElementById('vs-p2-name');
  let vsTransitionTimer = null;

  function buildSharedGrid() {
    sharedGrid.innerHTML = '';
    CHAR_KEYS.forEach((key, idx) => {
      const data = CHAR_DATA[key];
      const cell = document.createElement('div');
      cell.className = 'char-cell' + (data.locked ? ' locked' : ''); cell.dataset.index = idx;
      const avatar = document.createElement('img');
      avatar.className = 'cell-avatar'; avatar.src = CHAR_LOGOS[key]; avatar.alt = data.label;
      cell.appendChild(avatar);
      const name = document.createElement('span'); name.className='char-cell-name'; name.textContent=data.label.toUpperCase(); cell.appendChild(name);
      if (data.locked) { const lock=document.createElement('span'); lock.className='char-lock'; lock.textContent='🔒'; cell.appendChild(lock); }
      cell.addEventListener('click', () => setCursor('p1', idx));
      cell.addEventListener('pointerenter', () => setCursor('p1', idx));
      cell.setAttribute('aria-label', data.label + (data.locked ? ' — bloqueado' : ''));
      sharedGrid.appendChild(cell);
    });
  }
  buildSharedGrid();

  function setCursor(side, idx) {
    if (!CHAR_DATA[CHAR_KEYS[idx]]) return;
    AudioMgr.move();
    if (side === 'p1') { p1CursorIndex = idx; if (CHAR_DATA[CHAR_KEYS[idx]].playable) p1Selection = CHAR_KEYS[idx]; }
    else { p2CursorIndex = idx; if (CHAR_DATA[CHAR_KEYS[idx]].playable) p2Selection = CHAR_KEYS[idx]; }
    refreshCharSelectUI();
  }
  function refreshCharSelectUI() {
    document.getElementById('cs-title-text').textContent = t('cs_title');
    csGridLabel.textContent = t('cs_grid_label');
    document.getElementById('btn-confirm').textContent = t('cs_confirm');
    document.getElementById('btn-confirm').disabled = !CHAR_DATA[CHAR_KEYS[p1CursorIndex]].playable || !CHAR_DATA[CHAR_KEYS[p2CursorIndex]].playable;
    document.getElementById('btn-back-cs').textContent = t('cs_back');
    document.getElementById('btn-random').textContent = t('cs_random');
    document.getElementById('btn-commandlist').textContent = t('cs_commandlist');
    document.getElementById('btn-settings-cs').textContent = t('cs_settings');

    [...sharedGrid.children].forEach((cell, idx) => {
      cell.classList.toggle('p1-cursor', idx === p1CursorIndex);
      cell.classList.toggle('p2-cursor', idx === p2CursorIndex);
      [...cell.querySelectorAll('.cell-badge')].forEach(b => b.remove());
      if (idx === p1CursorIndex) { const b=document.createElement('div'); b.className='cell-badge badge-1p'; b.textContent='1P'; cell.appendChild(b); }
      if (idx === p2CursorIndex) { const b=document.createElement('div'); b.className='cell-badge badge-2p'; b.textContent = gameMode==='AI' ? 'CPU' : '2P'; cell.appendChild(b); }
    });

    p1PortraitLabel.textContent = CHAR_DATA[p1Selection].label.toUpperCase();
    p2PortraitLabel.textContent = CHAR_DATA[p2Selection].label.toUpperCase();
    document.getElementById('p1-portrait-subtitle').textContent = CHAR_DATA[p1Selection].subtitle[settings.lang] || CHAR_DATA[p1Selection].subtitle.en;
    document.getElementById('p2-portrait-subtitle').textContent = CHAR_DATA[p2Selection].subtitle[settings.lang] || CHAR_DATA[p2Selection].subtitle.en;
    p1PortraitImg.src = CHAR_PORTRAIT_IMG[p1Selection] || '';
    p2PortraitImg.src = CHAR_PORTRAIT_IMG[p2Selection] || '';
    p1PreviewLogo.src = CHAR_LOGOS[p1Selection]; p2PreviewLogo.src = CHAR_LOGOS[p2Selection];
    p2PortraitTag.textContent = gameMode === 'AI' ? 'CPU' : '2P';
    renderCoreParts(p1CorePartsSelect, p1Selection);
    renderCoreParts(p2CorePartsSelect, p2Selection);
    renderStatsPanel(p1StatsPanel, p1Selection);
    renderStatsPanel(p2StatsPanel, p2Selection);
  }

  function renderVsScreen() {
    vsP1Art.src=CHAR_PORTRAIT_IMG[p1Selection]; vsP2Art.src=CHAR_PORTRAIT_IMG[p2Selection];
    vsP1Logo.src=CHAR_LOGOS[p1Selection]; vsP2Logo.src=CHAR_LOGOS[p2Selection];
    vsP1Name.textContent=CHAR_DATA[p1Selection].label.toUpperCase();
    vsP2Name.textContent=CHAR_DATA[p2Selection].label.toUpperCase();
  }
  function startVsTransition() {
    if (!CHAR_DATA[CHAR_KEYS[p1CursorIndex]].playable || !CHAR_DATA[CHAR_KEYS[p2CursorIndex]].playable) return;
    clearTimeout(vsTransitionTimer); goTo('VS');
    vsTransitionTimer=setTimeout(() => { if (STATE==='VS') startBattle(); }, 1900);
  }
  document.getElementById('btn-confirm').addEventListener('click', () => { AudioMgr.confirm(); startVsTransition(); });
  document.getElementById('btn-back-cs').addEventListener('click', () => { AudioMgr.move(); goTo('MENU'); });
  document.getElementById('btn-random').addEventListener('click', () => {
    AudioMgr.confirm();
    p1Selection = PLAYABLE_KEYS[Math.floor(Math.random() * PLAYABLE_KEYS.length)];
    p2Selection = PLAYABLE_KEYS[Math.floor(Math.random() * PLAYABLE_KEYS.length)];
    p1CursorIndex = CHAR_KEYS.indexOf(p1Selection); p2CursorIndex = CHAR_KEYS.indexOf(p2Selection);
    refreshCharSelectUI();
  });
  document.getElementById('btn-settings-cs').addEventListener('click', () => { AudioMgr.move(); controlsReturnState='CHAR_SELECT'; goTo('CONTROLS'); });
  document.getElementById('btn-commandlist').addEventListener('click', () => {
    AudioMgr.move();
    document.getElementById('cl-title').textContent = t('cl_title');
    const rows = [];
    ACTIONS.forEach(a => rows.push('<div class="cl-row"><span>P1 ' + t(ACTION_LABEL_KEYS[a]) + '</span><span>' + keyDisplayName(controls.keyboard.p1[a]) + '</span></div>'));
    ACTIONS.forEach(a => rows.push('<div class="cl-row"><span>P2 ' + t(ACTION_LABEL_KEYS[a]) + '</span><span>' + keyDisplayName(controls.keyboard.p2[a]) + '</span></div>'));
    document.getElementById('cl-body').innerHTML = rows.join('');
    document.getElementById('cl-close-btn').textContent = t('cl_close');
    commandListModal.classList.remove('hidden');
  });
  document.getElementById('cl-close-btn').addEventListener('click', () => { AudioMgr.move(); commandListModal.classList.add('hidden'); });

  function moveGridCursor(side, dRow, dCol) {
    const total = CHAR_KEYS.length, rows = Math.ceil(total / GRID_COLS);
    let idx = side === 'p1' ? p1CursorIndex : p2CursorIndex;
    let row = Math.floor(idx / GRID_COLS), col = idx % GRID_COLS;
    row = (row + dRow + rows) % rows; col = (col + dCol + GRID_COLS) % GRID_COLS;
    let newIdx = row * GRID_COLS + col; if (newIdx >= total) newIdx = total - 1;
    setCursor(side, newIdx);
  }

  // ===========================================================
  // TÍTULO
  // ===========================================================
  function finishIntro() { if (STATE === 'INTRO') goTo('TITLE'); }
  introVideo.addEventListener('ended', finishIntro);
  introVideo.addEventListener('error', finishIntro);
  introSkipBtn.addEventListener('click', finishIntro);
  introPlayBtn.addEventListener('click', () => {
    introPlayBtn.classList.add('hidden');
    introVideo.play().catch(() => introPlayBtn.classList.remove('hidden'));
  });
  function advanceFromTitle() { AudioMgr.ensureCtx(); AudioMgr.confirm(); if (STATE === 'TITLE') goTo('MENU'); }
  screens.TITLE.addEventListener('click', advanceFromTitle);

  window.addEventListener('keydown', (e) => {
    if (remapListening) return; // ya gestionado por el listener de remapeo (capture phase)
    const k = e.key.toLowerCase();
    if (STATE === 'INTRO') { finishIntro(); return; }
    if (STATE === 'TITLE') { advanceFromTitle(); return; }
    if (k === 'escape' && BACK_ALLOWED.includes(STATE)) { handleGlobalBack(); return; }
    if (STATE === 'CHAR_SELECT' && k === 'escape') { AudioMgr.move(); goTo('MENU'); return; }

    if (STATE === 'MENU') {
      const items = getMenuItems();
      if (k === 'arrowdown' || k === 's') { menuSelectedIndex = (menuSelectedIndex + 1) % items.length; AudioMgr.move(); updateMenuHighlight(items); }
      else if (k === 'arrowup' || k === 'w') { menuSelectedIndex = (menuSelectedIndex - 1 + items.length) % items.length; AudioMgr.move(); updateMenuHighlight(items); }
      else if (k === 'enter') confirmMenuSelection(items);
      return;
    }
    if (STATE === 'CHAR_SELECT') {
      if (k === 'w') moveGridCursor('p1', -1, 0);
      else if (k === 's') moveGridCursor('p1', 1, 0);
      else if (k === 'a') moveGridCursor('p1', 0, -1);
      else if (k === 'd') moveGridCursor('p1', 0, 1);
      else if (k === 'arrowup') moveGridCursor('p2', -1, 0);
      else if (k === 'arrowdown') moveGridCursor('p2', 1, 0);
      else if (k === 'arrowleft') moveGridCursor('p2', 0, -1);
      else if (k === 'arrowright') moveGridCursor('p2', 0, 1);
      else if (k === 'enter') { AudioMgr.confirm(); startVsTransition(); }
      return;
    }
  });

  document.getElementById('rematch-btn').addEventListener('click', () => { AudioMgr.confirm(); startBattle(); });
  document.getElementById('menu-btn').addEventListener('click', () => { AudioMgr.move(); goTo('MENU'); });

  // ===========================================================
  // UTILIDAD DE COLOR
  // ===========================================================
  function shadeColor(hex, percent) {
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) + percent, g = ((num >> 8) & 0x00FF) + percent, b = (num & 0x0000FF) + percent;
    r = Math.min(255, Math.max(0, r)); g = Math.min(255, Math.max(0, g)); b = Math.min(255, Math.max(0, b));
    return '#' + (0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1);
  }

  // ===========================================================
  // RELOJ GLOBAL DE ANIMACIÓN
  // ===========================================================
  let ANIM_CLOCK = 0;
  function typeSeed(type) { let h = 0; for (let i = 0; i < type.length; i++) h = (h * 31 + type.charCodeAt(i)) % 997; return h; }

  // ===========================================================
  // DIBUJO COMPARTIDO DE UN AXIE (combate, retratos, mascota)
  // ===========================================================
  function drawAxieBody(c, type, opts) {
    const data = CHAR_DATA[type];
    const flashing = !!opts.flashing, silhouette = !!opts.silhouette;
    const glowColor = opts.glowColor || '#222';
    const armX = opts.armX, armY = opts.armY, legOffset = opts.legOffset || 0;
    const attacking = !!opts.attacking, attackType = opts.attackType || null;
    const t = opts.t !== undefined ? opts.t : ANIM_CLOCK;
    const seed = typeSeed(type);
    const breathe = attacking ? 0 : Math.sin((t + seed) * 0.04) * 1.6;
    const blinkPhase = (t + seed * 3) % 260, isBlinking = blinkPhase < 7;
    const wig = Math.sin((t + seed) * 0.05), wigFast = Math.sin((t + seed) * 0.12);
    const bodyFill = silhouette ? shadeColor(data.color, -150) : data.color;
    const accentFill = silhouette ? shadeColor(data.accent, -150) : data.accent;

    c.strokeStyle = silhouette ? glowColor : '#222';
    c.lineWidth = silhouette ? 3.5 : 3;
    if (silhouette) { c.shadowColor = glowColor; c.shadowBlur = 14; }

    c.fillStyle = flashing ? '#ffffff' : accentFill;
    if (type === 'beast') { c.beginPath(); c.ellipse(-32 + wig, -32, 9, 13, 0.4, 0, Math.PI*2); c.fill(); c.stroke(); }
    else if (type === 'plant') {
      c.beginPath(); c.moveTo(-24, -28); c.quadraticCurveTo(-44 + wig*2, -20, -30 + wig, -4); c.lineTo(-22, -10);
      c.quadraticCurveTo(-34, -18, -18, -24); c.closePath(); c.fill(); c.stroke();
    } else if (type === 'bird') {
      c.beginPath(); c.moveTo(-26, -30); c.lineTo(-46, -34 + wigFast*3); c.lineTo(-40, -18); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(-24, -22); c.lineTo(-42, -20 + wigFast*3); c.lineTo(-36, -8); c.closePath(); c.fill(); c.stroke();
    } else if (type === 'aquatic') {
      c.beginPath(); c.moveTo(-24, -30); c.lineTo(-48 + wigFast*4, -40); c.lineTo(-44 + wigFast*4, -20); c.lineTo(-24,-14);
      c.closePath(); c.fill(); c.stroke();
    } else if (type === 'reptile') {
      c.beginPath(); c.moveTo(-24, -26); c.quadraticCurveTo(-50, -22 + wig*3, -46, 4 + wig*2); c.lineTo(-38, 2);
      c.quadraticCurveTo(-42, -18, -20, -18); c.closePath(); c.fill(); c.stroke();
    } else if (type === 'bug') {
      c.beginPath(); c.ellipse(-30, -26, 10, 14, 0.3, 0, Math.PI*2); c.fill(); c.stroke();
      c.fillStyle = '#ff4d6d'; c.beginPath(); c.moveTo(-38,-16); c.lineTo(-44+wig*2,-8); c.lineTo(-34,-10); c.fill();
    }

    c.fillStyle = flashing ? '#ffffff' : bodyFill;
    c.beginPath(); c.ellipse(0, -55, 26, 34 + breathe, 0, 0, Math.PI*2); c.fill(); c.stroke();
    if (type === 'bird') { c.fillStyle = flashing ? '#ffffff' : accentFill; c.beginPath(); c.ellipse(-30, -50 + wigFast*2, 16, 26, 0.5, 0, Math.PI*2); c.fill(); c.stroke(); }

    c.beginPath(); c.arc(0, -95, 24, 0, Math.PI*2);
    c.fillStyle = flashing ? '#ffffff' : accentFill; c.fill(); c.stroke();

    if (type === 'beast') {
      c.fillStyle = silhouette ? shadeColor('#ffdd55', -100) : '#ffdd55';
      c.beginPath(); c.moveTo(-16,-112); c.lineTo(-28+wig,-140); c.lineTo(-6,-114); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(16,-112); c.lineTo(28+wig,-140); c.lineTo(6,-114); c.fill(); c.stroke();
    } else if (type === 'plant') {
      c.fillStyle = silhouette ? shadeColor('#3ddc61', -100) : '#3ddc61';
      c.beginPath(); c.ellipse(-14, -128, 12, 20, -0.5 + wig*0.02, 0, Math.PI*2); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(14, -128, 12, 20, 0.5 - wig*0.02, 0, Math.PI*2); c.fill(); c.stroke();
    } else if (type === 'bird') {
      c.fillStyle = silhouette ? shadeColor('#ffcf40', -100) : '#ffcf40';
      c.beginPath(); c.moveTo(-6,-116); c.lineTo(-2+wig,-142); c.lineTo(4,-114); c.fill(); c.stroke();
      c.fillStyle = silhouette ? shadeColor('#ffb347', -100) : '#ffb347';
      c.beginPath(); c.moveTo(22,-95); c.lineTo(38,-92); c.lineTo(22,-86); c.fill(); c.stroke();
    } else if (type === 'aquatic') {
      c.fillStyle = silhouette ? shadeColor('#1793a3', -60) : '#1793a3';
      c.beginPath(); c.moveTo(-4,-116); c.lineTo(0+wig,-145); c.lineTo(10,-113); c.fill(); c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.5)';
      const bubbleY1 = -100 - ((t*0.6) % 30), bubbleY2 = -108 - (((t+40)*0.6) % 30);
      c.beginPath(); c.arc(-14,bubbleY1,3,0,Math.PI*2); c.fill();
      c.beginPath(); c.arc(-20,bubbleY2,2,0,Math.PI*2); c.fill();
    } else if (type === 'reptile') {
      c.fillStyle = silhouette ? shadeColor('#c8e06a', -100) : '#c8e06a';
      c.beginPath(); c.moveTo(-10,-114); c.lineTo(-6,-134); c.lineTo(-2,-114); c.fill(); c.stroke();
      c.beginPath(); c.moveTo(2,-114); c.lineTo(6,-138); c.lineTo(10,-114); c.fill(); c.stroke();
      c.strokeStyle = '#ff4d6d'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(24,-92); c.lineTo(34+wig,-90); c.moveTo(34+wig,-90); c.lineTo(40,-94); c.moveTo(34+wig,-90); c.lineTo(40,-86); c.stroke();
      c.strokeStyle = silhouette ? glowColor : '#222'; c.lineWidth = silhouette ? 3.5 : 3;
    } else if (type === 'bug') {
      c.strokeStyle = silhouette ? glowColor : '#222'; c.lineWidth = silhouette ? 3.5 : 3;
      c.beginPath(); c.moveTo(-8,-118); c.lineTo(-16+wigFast*2,-146); c.stroke();
      c.beginPath(); c.moveTo(8,-118); c.lineTo(16-wigFast*2,-146); c.stroke();
      c.fillStyle = silhouette ? shadeColor('#ffb84f', -100) : '#ffb84f';
      c.beginPath(); c.arc(-16+wigFast*2,-146,4,0,Math.PI*2); c.fill();
      c.beginPath(); c.arc(16-wigFast*2,-146,4,0,Math.PI*2); c.fill();
      c.fillStyle = silhouette ? shadeColor('#8a4fbf', -100) : '#8a4fbf';
      c.beginPath(); c.moveTo(20,-92); c.lineTo(34,-96); c.lineTo(30,-88); c.fill(); c.stroke();
    }

    c.shadowBlur = 0; c.fillStyle = '#111';
    if (isBlinking && !attacking) { c.strokeStyle = '#111'; c.lineWidth = 2; c.beginPath(); c.moveTo(4,-97); c.lineTo(12,-97); c.stroke(); }
    else { c.beginPath(); c.arc(8,-97,4,0,Math.PI*2); c.fill(); }
    if (silhouette) { c.shadowColor = glowColor; c.shadowBlur = 14; }

    c.fillStyle = flashing ? '#ffffff' : bodyFill;
    c.beginPath(); c.ellipse(-12 + legOffset, -8, 10, 16, 0, 0, Math.PI*2); c.fill(); c.stroke();
    c.beginPath(); c.ellipse(12 - legOffset, -8, 10, 16, 0, 0, Math.PI*2); c.fill(); c.stroke();

    c.fillStyle = flashing ? '#ffffff' : accentFill;
    if (attacking && attackType === 'special') c.fillStyle = silhouette ? shadeColor('#ffcf40', -60) : '#ffcf40';
    c.beginPath(); c.ellipse(armX, armY, 12, 12, 0, 0, Math.PI*2); c.fill(); c.stroke();
    if (attacking && attackType === 'special') { c.fillStyle = 'rgba(255,207,64,0.5)'; c.beginPath(); c.ellipse(armX - 20, armY, 24, 18, 0, 0, Math.PI*2); c.fill(); }
    c.shadowBlur = 0;
  }

  // ===========================================================
  // RETRATOS ANIMADOS
  // ===========================================================
  const portraitCtxCache = new Map();
  function drawPortrait(canvasEl, type, side) {
    let pctx = portraitCtxCache.get(canvasEl);
    if (!pctx) { pctx = canvasEl.getContext('2d'); portraitCtxCache.set(canvasEl, pctx); }
    const cw = canvasEl.width, ch = canvasEl.height;
    pctx.clearRect(0, 0, cw, ch);
    const glowColor = side === 'p1' ? '#22c3ff' : '#ff2d4d';
    pctx.save(); pctx.translate(cw / 2, ch - 16); pctx.scale(1.55, 1.55);
    drawAxieBody(pctx, type, { flashing:false, armX:24, armY:-55, legOffset:0, attacking:false, silhouette:true, glowColor, t: ANIM_CLOCK });
    pctx.restore();
  }
  function updateCharSelectPortraits() { drawPortrait(p1PortraitCanvas, p1Selection, 'p1'); drawPortrait(p2PortraitCanvas, p2Selection, 'p2'); }
  // Nota: la mascota vectorial animada del menú (drawMenuMascot) fue removida a pedido —
  // el fondo oficial del Axie Bestia cubre ese rol visual en #screen-menu.

  // ===========================================================
  // FIGHTER
  // ===========================================================
  const AXP_MAX = 100, AXP_GAIN_BASIC = 10, AXP_GAIN_SPECIAL = 18;
  const OVERDRIVE_FRAMES = 300, OVERDRIVE_SPEED_MULT = 1.25, OVERDRIVE_DMG_MULT = 1.5;

  // ===========================================================
  // RENDERIZADO DEL ROSTER POR SPRITES
  // ===========================================================
  function isSpriteFrameReady(sprite, def) {
    if (def.sheet) {
      const sheet = sprite.stateSheets && sprite.stateSheets[def.sheet];
      return !!(sheet && sheet.img.complete && sheet.img.naturalWidth > 0 && sheet.surface);
    }
    return !!(sprite.img && sprite.img.complete && sprite.img.naturalWidth > 0 && sprite.surface);
  }
  function resolveFrameSource(sprite, def, frameIdx) {
    if (def.sheet) {
      const sheet = sprite.stateSheets[def.sheet];
      const column = frameIdx % def.columns, row = Math.floor(frameIdx / def.columns);
      return {
        surface:sheet.surface,
        sx:column * def.cellWidth + (def.cropX || 0),
        sy:row * def.cellHeight + (def.cropY || 0),
        sw:def.frameWidth, sh:def.frameHeight
      };
    }
    return { surface:sprite.surface, sx:def.x + frameIdx * (def.w / def.count), sy:def.y, sw:def.w / def.count, sh:def.h };
  }
  function drawSpritePlaceholder(type) {
    ctx.save();
    ctx.fillStyle = '#555';
    ctx.fillRect(-35, -150, 70, 150);
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.strokeRect(-35, -150, 70, 150);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`CARGANDO ${type.toUpperCase()}`, 0, -75);
    ctx.restore();
  }

  // Genera una sola vez cada celda estilizada. El caché evita filtros y múltiples
  // pasadas de dibujo durante el combate, manteniendo estable el presupuesto de 60 FPS.
  function getCelShadedFrame(sprite, def, frameIdx, rimColor) {
    const source = resolveFrameSource(sprite, def, frameIdx);
    const frameW = Math.floor(source.sw), frameH = Math.floor(source.sh);
    const key = `${def.sheet || 'main'}:${source.sx}:${source.sy}:${frameW}:${frameH}:${rimColor}`;
    if (sprite.styledFrames && sprite.styledFrames.has(key)) return sprite.styledFrames.get(key);
    const pad = 5;
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = frameW + pad * 2; frameCanvas.height = frameH + pad * 2;
    const frameCtx = frameCanvas.getContext('2d', { alpha:true });
    frameCtx.imageSmoothingEnabled = false;
    const drawSource = (dx, dy) => frameCtx.drawImage(source.surface, source.sx, source.sy, source.sw, source.sh, dx, dy, frameW, frameH);

    // Silueta oscura expandida: contorno uniforme alrededor del alfa del personaje.
    frameCtx.filter = 'brightness(0)';
    [[-3,0],[3,0],[0,-3],[0,3],[-2,-2],[2,-2],[-2,2],[2,2]].forEach(([ox,oy]) => drawSource(pad + ox, pad + oy));
    frameCtx.filter = 'none';

    // Silueta desplazada hacia la luz, recortada por alfa, para el rim lighting.
    const rimCanvas = document.createElement('canvas');
    rimCanvas.width = frameCanvas.width; rimCanvas.height = frameCanvas.height;
    const rimCtx = rimCanvas.getContext('2d', { alpha:true });
    rimCtx.drawImage(source.surface, source.sx, source.sy, source.sw, source.sh, pad - 2, pad - 2, frameW, frameH);
    rimCtx.globalCompositeOperation = 'source-in';
    rimCtx.fillStyle = rimColor; rimCtx.fillRect(0, 0, rimCanvas.width, rimCanvas.height);
    frameCtx.globalAlpha = 0.82; frameCtx.drawImage(rimCanvas, 0, 0); frameCtx.globalAlpha = 1;

    // Imagen principal con contraste moderado para separar planos de color.
    frameCtx.filter = 'contrast(1.16) saturate(1.08)';
    drawSource(pad, pad);
    frameCtx.filter = 'none';
    if (sprite.styledFrames) sprite.styledFrames.set(key, frameCanvas);
    return frameCanvas;
  }

  function drawFighterSprite(f, flashing) {
    const sprite = FIGHTER_SPRITES[f.type];
    if (!sprite) { drawSpritePlaceholder(f.type); return; }
    const animKey = getVisualState(f);
    const def = sprite.frames[animKey] || sprite.frames.idle;
    if (!isSpriteFrameReady(sprite, def)) { drawSpritePlaceholder(f.type); return; }
    const frameW = def.frameWidth || def.w / def.count;
    const frameH = def.frameHeight || def.h;
    const frameIdx = animKey === 'jump' && sprite.frames.jump === def ? Math.min(f.spriteFrame, def.count - 1) : f.spriteFrame % def.count;
    const dh = sprite.renderHeight || SPRITE_HEIGHT;
    const dw = frameW * (dh / frameH);
    const styledFrame = getCelShadedFrame(sprite, def, frameIdx, CHAR_DATA[f.type].palette.rim);
    const padScale = 5 * (dh / frameH);
    ctx.save();
    if (flashing) ctx.globalAlpha = 0.55;
    ctx.globalCompositeOperation = 'source-over';
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(styledFrame, -dw / 2 - padScale, -dh - padScale, dw + padScale * 2, dh + padScale * 2);
    ctx.restore();
  }

  function renderFighterEntity(fighter) {
    const baseY = fighter.y;
    const bob = fighter.onGround && Math.abs(fighter.vx) > 0.5 ? Math.sin(fighter.animTimer * 0.3) * 4 : 0;
    const drawY = baseY + bob;
    ctx.save(); ctx.translate(fighter.x + fighter.w / 2, drawY); ctx.scale(fighter.facing, 1);
    ctx.save(); ctx.translate(-fighter.x - fighter.w/2, -drawY);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath();
    ctx.ellipse(fighter.x + fighter.w/2, FIGHTER_GROUND_Y + 5, 40, 10, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();
    if (fighter.overdriveActive) {
      const pulse = 0.35 + 0.2 * Math.sin(fighter.animTimer * 0.35);
      ctx.save(); ctx.globalAlpha = pulse; ctx.fillStyle = '#ffd54f';
      ctx.beginPath(); ctx.arc(0, -55, 50, 0, Math.PI*2); ctx.fill(); ctx.restore();
    }
    const flashing = fighter.hurtFlash > 0 && Math.floor(fighter.hurtFlash / 2) % 2 === 0;
    drawFighterSprite(fighter, flashing);
    ctx.restore();
  }

  const Fighter = createFighterClass({
    worldWidth:W, groundY:FIGHTER_GROUND_Y, defaultSpriteHeight:SPRITE_HEIGHT, gravity:GRAVITY,
    roster:CHAR_DATA, spriteRegistry:FIGHTER_SPRITES,
    axpMax:AXP_MAX, axpGainBasic:AXP_GAIN_BASIC, axpGainSpecial:AXP_GAIN_SPECIAL,
    overdriveFrames:OVERDRIVE_FRAMES, overdriveSpeedMultiplier:OVERDRIVE_SPEED_MULT,
    overdriveDamageMultiplier:OVERDRIVE_DMG_MULT, animationSystem:advanceSteppedAnimation,
    renderer:renderFighterEntity, audio:AudioMgr, statistics:playerStats, saveStatistics:saveStatsToStorage,
    spawnPartCard, spawnOverdriveBanner, spawnDamageNumber, spawnImpactFlash, shakeScreen,
    onDefeated:onFighterDefeated
  });

  // ===========================================================
  // EFECTOS
  // ===========================================================
  let damageNumbers = [], impactFlashes = [], partCards = [], overdriveBanners = [];
  let screenShake = { time: 0, intensity: 0 };
  function spawnDamageNumber(x, y, amount, type) { damageNumbers.push({ x, y, amount, life:40, vy:-2, special: type==='special' }); }
  function spawnImpactFlash(x, y) { impactFlashes.push({ x, y, life:12, maxLife:12 }); }
  function shakeScreen(intensity) { screenShake.time = 10; screenShake.intensity = intensity; }
  function spawnPartCard(x, y, axieType, partKey, attackType) {
    const partName = CHAR_DATA[axieType].parts[partKey], label = PART_LABELS[partKey];
    let color = '#7fdfff'; if (attackType === 'special') color = '#ff9f40'; if (attackType === 'overdrive') color = '#ffd54f';
    partCards.push({ x, y, life:46, maxLife:46, label, partName, color, vy:-0.6 });
  }
  function spawnOverdriveBanner(axieType) {
    const parts = CHAR_DATA[axieType].parts;
    overdriveBanners.push({ life:100, maxLife:100, text:'¡AXIE CORE OVERDRIVE!', sub: parts.back + ' + ' + parts.tail });
  }
  function updateEffects() {
    for (let i = damageNumbers.length - 1; i >= 0; i--) { const d = damageNumbers[i]; d.y += d.vy; d.vy += 0.05; d.life--; if (d.life <= 0) damageNumbers.splice(i,1); }
    for (let i = impactFlashes.length - 1; i >= 0; i--) { impactFlashes[i].life--; if (impactFlashes[i].life <= 0) impactFlashes.splice(i,1); }
    for (let i = partCards.length - 1; i >= 0; i--) { const p = partCards[i]; p.y += p.vy; p.life--; if (p.life <= 0) partCards.splice(i,1); }
    for (let i = overdriveBanners.length - 1; i >= 0; i--) { overdriveBanners[i].life--; if (overdriveBanners[i].life <= 0) overdriveBanners.splice(i,1); }
    if (screenShake.time > 0) screenShake.time--;
  }
  function roundRect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x+r,y); c.arcTo(x+w,y,x+w,y+h,r); c.arcTo(x+w,y+h,x,y+h,r); c.arcTo(x,y+h,x,y,r); c.arcTo(x,y,x+w,y,r); c.closePath(); }
  function drawEffects() {
    damageNumbers.forEach(d => {
      ctx.save(); ctx.globalAlpha = Math.max(0, d.life / 40);
      ctx.font = d.special ? 'bold 32px Arial' : 'bold 24px Arial'; ctx.fillStyle = d.special ? '#ffcf40' : '#ff4040';
      ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.textAlign = 'center';
      ctx.strokeText('-' + d.amount, d.x, d.y); ctx.fillText('-' + d.amount, d.x, d.y); ctx.restore();
    });
    impactFlashes.forEach(f => {
      ctx.save(); ctx.globalAlpha = f.life / f.maxLife; const r = 30 * (1 - f.life / f.maxLife) + 10;
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, Math.PI*2); ctx.stroke(); ctx.restore();
    });
    partCards.forEach(p => {
      ctx.save(); ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      const cw = 116, chh = 34;
      ctx.fillStyle = 'rgba(10,10,20,0.85)'; ctx.strokeStyle = p.color; ctx.lineWidth = 2;
      roundRect(ctx, p.x - cw/2, p.y - chh/2, cw, chh, 6); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'center'; ctx.fillStyle = p.color; ctx.font = 'bold 12px Arial'; ctx.fillText(p.label, p.x, p.y - 3);
      ctx.fillStyle = '#fff'; ctx.font = '9px Arial'; ctx.fillText(p.partName, p.x, p.y + 10);
      ctx.restore();
    });
    overdriveBanners.forEach(b => {
      ctx.save(); ctx.globalAlpha = Math.max(0, Math.min(1, b.life / b.maxLife) * 1.2);
      ctx.textAlign = 'center'; ctx.fillStyle = '#ffd54f'; ctx.strokeStyle = '#000'; ctx.lineWidth = 4;
      ctx.font = 'bold 30px Arial'; ctx.strokeText(b.text, W/2, 100); ctx.fillText(b.text, W/2, 100);
      ctx.font = 'bold 15px Arial'; ctx.fillStyle = '#fff'; ctx.strokeText(b.sub, W/2, 124); ctx.fillText(b.sub, W/2, 124);
      ctx.restore();
    });
  }

  // ===========================================================
  // FONDO
  // ===========================================================
  const skyGrad = ctx.createLinearGradient(0,0,0,H); skyGrad.addColorStop(0, '#3a7bd5'); skyGrad.addColorStop(1, '#87ceeb');
  const groundGrad = ctx.createLinearGradient(0, GROUND_Y, 0, H); groundGrad.addColorStop(0, '#5cb85c'); groundGrad.addColorStop(1, '#3d8b3d');
  function drawBackground() {
    ctx.fillStyle = skyGrad; ctx.fillRect(0,0,W,H);
    ctx.fillStyle = 'rgba(255,240,180,0.9)'; ctx.beginPath(); ctx.arc(770, 90, 45, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 4; i++) { const cx = ((i * 260 + ANIM_CLOCK * 0.4) % (W + 200)) - 100; drawCloud(cx, 60 + i * 30); }
    ctx.fillStyle = '#6a8caf';
    ctx.beginPath(); ctx.moveTo(0, GROUND_Y); ctx.lineTo(120, GROUND_Y - 140); ctx.lineTo(260, GROUND_Y);
    ctx.lineTo(420, GROUND_Y - 100); ctx.lineTo(560, GROUND_Y); ctx.lineTo(720, GROUND_Y - 160);
    ctx.lineTo(900, GROUND_Y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = groundGrad; ctx.fillRect(0, GROUND_Y + 55, W, H - GROUND_Y - 55);
    ctx.strokeStyle = '#2f6b2f'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, GROUND_Y + 55); ctx.lineTo(W, GROUND_Y + 55); ctx.stroke();
    ctx.fillStyle = '#ff8fd9';
    for (let i = 0; i < 10; i++) { const fx = (i * 95 + 30) % W, fy = GROUND_Y + 70 + (i % 3) * 12; ctx.beginPath(); ctx.arc(fx, fy, 3, 0, Math.PI*2); ctx.fill(); }
  }
  function drawCloud(x, y) { ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI*2); ctx.arc(x + 22, y - 8, 24, 0, Math.PI*2); ctx.arc(x + 46, y, 18, 0, Math.PI*2); ctx.fill(); }

  // ===========================================================
  // INSTANCIAS
  // ===========================================================
  let player1, player2;
  function createFighters() {
    player1 = new Fighter({ x:180, facing:1, type:p1Selection, label:'JUGADOR 1', side:'p1' });
    player2 = new Fighter({ x:650, facing:-1, type:p2Selection, label: gameMode==='AI' ? 'CPU' : 'JUGADOR 2', side:'p2' });
    p1HpLabel.textContent = t('hud_j1') + ' — ' + CHAR_DATA[p1Selection].label.toUpperCase();
    p2HpLabel.textContent = (gameMode==='AI' ? t('hud_cpu') : t('hud_j2')) + ' — ' + CHAR_DATA[p2Selection].label.toUpperCase();
    const p1Class = CHAR_DATA[p1Selection].stats.type[settings.lang] || CHAR_DATA[p1Selection].stats.type.en;
    const p2Class = CHAR_DATA[p2Selection].stats.type[settings.lang] || CHAR_DATA[p2Selection].stats.type.en;
    p1ClassStatus.dataset.baseLabel = p1Class.toUpperCase(); p1ClassStatus.textContent = p1ClassStatus.dataset.baseLabel;
    p2ClassStatus.dataset.baseLabel = p2Class.toUpperCase(); p2ClassStatus.textContent = p2ClassStatus.dataset.baseLabel;
    p1HudLogo.src = CHAR_LOGOS[p1Selection]; p1HudLogo.alt = CHAR_DATA[p1Selection].label;
    p2HudLogo.src = CHAR_LOGOS[p2Selection]; p2HudLogo.alt = CHAR_DATA[p2Selection].label;
    applyHudTheme(document.getElementById('p1-hp-block'), p1Selection);
    applyHudTheme(document.getElementById('p2-hp-block'), p2Selection);
    renderCoreParts(p1CorePartsHud, p1Selection); renderCoreParts(p2CorePartsHud, p2Selection);
    controlsHint.textContent = gameMode === 'LOCAL' ? t('controls_local') : t('controls_ai');
  }

  // ===========================================================
  // CONTROLES — TECLADO EN COMBATE (usa esquema remapeable)
  // ===========================================================
  const keys = {};
  window.addEventListener('keydown', e => { if (!remapListening) keys[e.key.toLowerCase()] = true; });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });

  function handlePlayerInput(fighter, scheme) {
    if (STATE !== 'BATTLE' || fighter.isDead) return;
    fighter.vx = 0;
    if (!fighter.isAttacking) {
      if (keys[scheme.left]) { fighter.vx = -fighter.speed; fighter.walking = true; }
      else if (keys[scheme.right]) { fighter.vx = fighter.speed; fighter.walking = true; }
      else fighter.walking = false;
      if (keys[scheme.jump] && fighter.onGround) { fighter.vy = fighter.jumpPower; fighter.onGround = false; AudioMgr.jump(); }
      if (keys[scheme.basic]) fighter.startAttack('basic');
      if (keys[scheme.special]) fighter.startAttack('special');
    }
    if (keys[scheme.overdrive]) fighter.activateOverdrive();
  }

  // ===========================================================
  // GAMEPAD — lectura en combate + captura para remapeo
  // ===========================================================
  function pollGamepadsForRemap() {
    if (!(remapListening && remapListening.device === 'gamepad')) return;
    const pads = (navigator.getGamepads ? navigator.getGamepads() : []) || [];
    for (const pad of pads) {
      if (!pad) continue;
      for (let i = 0; i < pad.buttons.length; i++) {
        if (pad.buttons[i].pressed) {
          controls.gamepad[remapListening.player][remapListening.action] = i;
          remapListening = null; AudioMgr.confirm();
          if (STATE === 'CONTROLS') renderControlsScreen('gamepad');
          return;
        }
      }
    }
  }
  function applyGamepadInput(fighter, gpScheme, padIndex) {
    if (STATE !== 'BATTLE' || fighter.isDead) return;
    const pads = (navigator.getGamepads ? navigator.getGamepads() : []) || [];
    const pad = pads[padIndex];
    if (!pad) return;
    const axisX = pad.axes && pad.axes.length ? pad.axes[0] : 0;
    const dpadLeft = pad.buttons[14] && pad.buttons[14].pressed;
    const dpadRight = pad.buttons[15] && pad.buttons[15].pressed;
    if (!fighter.isAttacking) {
      if (axisX < -0.4 || dpadLeft) { fighter.vx = -fighter.speed; fighter.walking = true; }
      else if (axisX > 0.4 || dpadRight) { fighter.vx = fighter.speed; fighter.walking = true; }
      if (pad.buttons[gpScheme.jump] && pad.buttons[gpScheme.jump].pressed && fighter.onGround) { fighter.vy = fighter.jumpPower; fighter.onGround = false; AudioMgr.jump(); }
      if (pad.buttons[gpScheme.basic] && pad.buttons[gpScheme.basic].pressed) fighter.startAttack('basic');
      if (pad.buttons[gpScheme.special] && pad.buttons[gpScheme.special].pressed) fighter.startAttack('special');
    }
    if (pad.buttons[gpScheme.overdrive] && pad.buttons[gpScheme.overdrive].pressed) fighter.activateOverdrive();
  }

  // ===========================================================
  // CONTROLES TÁCTILES — vinculan botones a la misma tabla `keys`
  // ===========================================================
  function bindTouchButton(id, key) {
    const el = document.getElementById(id);
    const press = (e) => { e.preventDefault(); keys[key] = true; };
    const release = (e) => { e.preventDefault(); keys[key] = false; };
    el.addEventListener('touchstart', press, { passive:false });
    el.addEventListener('touchend', release, { passive:false });
    el.addEventListener('mousedown', press);
    el.addEventListener('mouseup', release);
    el.addEventListener('mouseleave', release);
  }
  function setupTouchControls() {
    bindTouchButton('tb-left', controls.keyboard.p1.left);
    bindTouchButton('tb-right', controls.keyboard.p1.right);
    bindTouchButton('tb-jump', controls.keyboard.p1.jump);
    bindTouchButton('tb-basic', controls.keyboard.p1.basic);
    bindTouchButton('tb-special', controls.keyboard.p1.special);
    bindTouchButton('tb-overdrive', controls.keyboard.p1.overdrive);
  }
  setupTouchControls();

  // ===========================================================
  // IA SIMPLE
  // ===========================================================
  let aiState = { decisionTimer:0, action:'idle' };
  function handleAI() {
    if (STATE !== 'BATTLE' || player2.isDead) return;
    if (player2.axp >= AXP_MAX) player2.activateOverdrive();
    if (player2.isAttacking) { player2.vx = 0; return; }
    aiState.decisionTimer--;
    const dist = player1.x - player2.x, absDist = Math.abs(dist);
    if (aiState.decisionTimer <= 0) {
      aiState.decisionTimer = 20 + Math.random() * 30;
      const roll = Math.random();
      if (absDist < 90) { if (roll < 0.55) aiState.action = roll < 0.25 ? 'special' : 'basic'; else if (roll < 0.8) aiState.action='retreat'; else aiState.action='jump'; }
      else if (absDist < 260) aiState.action = roll < 0.75 ? 'approach' : 'jump';
      else aiState.action = 'approach';
    }
    switch (aiState.action) {
      case 'approach': player2.vx = (dist > 0 ? 1 : -1) * player2.speed * 0.85; break;
      case 'retreat': player2.vx = (dist > 0 ? -1 : 1) * player2.speed * 0.85; break;
      case 'jump': if (player2.onGround) { player2.vy = player2.jumpPower; player2.onGround = false; } player2.vx = 0; aiState.action='idle'; break;
      case 'basic': player2.startAttack('basic'); player2.vx = 0; aiState.action='idle'; break;
      case 'special': player2.startAttack('special'); player2.vx = 0; aiState.action='idle'; break;
      default: player2.vx = 0;
    }
  }

  // ===========================================================
  // LOOP PRINCIPAL — actualización fija y render independiente
  // ===========================================================
  const LOGIC_STEP_MS = 1000 / 60;
  let lastGamepadStatusTime = 0;

  function stepSimulation(dtMs, timestamp) {
    pollGamepadsForRemap();
    if (STATE === 'CONTROLS' && ctrlActiveTab === 'gamepad' && !remapListening && timestamp - lastGamepadStatusTime >= 700) {
      lastGamepadStatusTime = timestamp; renderGamepadTab();
    }
    ANIM_CLOCK++;
    if (STATE !== 'BATTLE') return;
    if (matchPhase !== 'active') { advanceMatchPhase(dtMs); return; }
    roundRemainingMs = Math.max(0, roundRemainingMs - dtMs);
    const seconds = Math.ceil(roundRemainingMs / 1000);
    if (seconds !== roundTime) { roundTime = seconds; timerValueEl.textContent = seconds; }
    if (!roundRemainingMs) {
      const side = player1.hp === player2.hp ? 'draw' : player1.hp > player2.hp ? 'p1' : 'p2';
      endRound(side === 'p1' ? t('hud_j1') : gameMode === 'AI' ? t('hud_cpu') : t('hud_j2'), side);
      return;
    }
    handlePlayerInput(player1, controls.keyboard.p1);
    applyGamepadInput(player1, controls.gamepad.p1, 0);
    if (gameMode === 'AI') handleAI();
    else { handlePlayerInput(player2, controls.keyboard.p2); applyGamepadInput(player2, controls.gamepad.p2, 1); }
    player1.update(player2, dtMs);
    if (matchPhase !== 'active') return;
    player2.update(player1, dtMs);
    updateEffects();
  }

  function renderFrame() {
    ctx.save();
    if (screenShake.time > 0) ctx.translate((Math.random()-0.5)*screenShake.intensity, (Math.random()-0.5)*screenShake.intensity);
    drawBackground();
    if (player1 && player2) {
      const back = player1.x < player2.x ? player1 : player2;
      const front = player1.x < player2.x ? player2 : player1;
      back.draw(); front.draw(); drawEffects();
    }
    ctx.restore();
    if (STATE === 'BATTLE') updateHUD();
  }

  const gameLoop = new FixedStepLoop({
    update: stepSimulation,
    render: renderFrame,
    logicHz: 60,
    getRenderHz: () => settings.fps || 60
  });

  let lastHudSnapshot = { p1hp:-1, p2hp:-1, p1axp:-1, p2axp:-1 };
  function updateHUD() {
    const p1hp = Math.max(0, Math.round(player1.hp / player1.maxHp * 100));
    const p2hp = Math.max(0, Math.round(player2.hp / player2.maxHp * 100));
    const p1axp = player1.axp, p2axp = player2.axp;
    if (p1hp !== lastHudSnapshot.p1hp) { p1HpBar.style.width = p1hp+'%'; p1HpBar.classList.toggle('critical', p1hp <= 20); lastHudSnapshot.p1hp = p1hp; }
    if (p2hp !== lastHudSnapshot.p2hp) { p2HpBar.style.width = p2hp+'%'; p2HpBar.classList.toggle('critical', p2hp <= 20); lastHudSnapshot.p2hp = p2hp; }
    if (p1axp !== lastHudSnapshot.p1axp) { p1AxpBar.style.width = p1axp+'%'; p1AxpOuter.classList.toggle('axp-full', p1axp >= AXP_MAX); lastHudSnapshot.p1axp = p1axp; }
    if (p2axp !== lastHudSnapshot.p2axp) { p2AxpBar.style.width = p2axp+'%'; p2AxpOuter.classList.toggle('axp-full', p2axp >= AXP_MAX); lastHudSnapshot.p2axp = p2axp; }
    const p1Overdrive = player1.overdriveActive, p2Overdrive = player2.overdriveActive;
    p1ClassStatus.classList.toggle('overdrive', p1Overdrive); p2ClassStatus.classList.toggle('overdrive', p2Overdrive);
    const p1StatusText = (p1ClassStatus.dataset.baseLabel || '') + (p1Overdrive ? ' · OVERDRIVE' : '');
    const p2StatusText = (p2ClassStatus.dataset.baseLabel || '') + (p2Overdrive ? ' · OVERDRIVE' : '');
    if (p1ClassStatus.textContent !== p1StatusText) p1ClassStatus.textContent = p1StatusText;
    if (p2ClassStatus.textContent !== p2StatusText) p2ClassStatus.textContent = p2StatusText;
  }

  // ===========================================================
  // RONDA / TEMPORIZADOR / VICTORIA
  // ===========================================================
  let roundTime = 60, roundRemainingMs = 60000;
  let matchPhase = 'inactive', phaseElapsedMs = 0, roundNumber = 1;
  let roundWins = { p1:0, p2:0 }, lastRoundSide = 'draw';
  const roundCallout = document.getElementById('round-callout');
  const roundCaption = document.getElementById('round-caption');
  const roundWord = document.getElementById('round-word');
  let displayedRoundWord = '';

  function showRoundCallout(caption, word) {
    roundCallout.classList.remove('hidden');
    roundCaption.textContent = caption;
    if (displayedRoundWord === word) return;
    displayedRoundWord = word; roundWord.textContent = word;
    roundWord.classList.remove('callout-pop');
    void roundWord.offsetWidth;
    roundWord.classList.add('callout-pop');
  }
  function updateRoundMarkers() {
    for (const side of ['p1','p2']) {
      const holder = document.getElementById(side + '-round-wins');
      [...holder.children].forEach((orb, i) => orb.classList.toggle('won', i < roundWins[side]));
      holder.setAttribute('aria-label', `${roundWins[side]} / 2`);
    }
  }
  function advanceMatchPhase(dtMs) {
    phaseElapsedMs += dtMs;
    if (matchPhase === 'countdown') {
      const words = settings.lang === 'ja' ? ['準備！','構え！','FIGHT!'] : settings.lang === 'en' ? ['READY!','STEADY!','FIGHT!'] : ['¡Prepárense!','¡Listos!','¡FIGHT!'];
      const caption = roundWins.p1 === 1 && roundWins.p2 === 1 ? (settings.lang === 'ja' ? '最終ラウンド' : settings.lang === 'en' ? 'FINAL ROUND' : 'ROUND FINAL') : `ROUND ${roundNumber}`;
      if (phaseElapsedMs < 2700) showRoundCallout(caption, words[Math.min(2, Math.floor(phaseElapsedMs / 900))]);
      else { roundCallout.classList.add('hidden'); matchPhase = 'active'; phaseElapsedMs = 0; }
    } else if (matchPhase === 'round-end' && phaseElapsedMs >= 1700) {
      if (lastRoundSide !== 'draw') roundNumber++;
      beginRound();
    }
  }
  function onFighterDefeated(fighter) {
    if (STATE !== 'BATTLE' || matchPhase !== 'active') return;
    const p2Label = gameMode === 'AI' ? t('hud_cpu') : t('hud_j2');
    endRound((fighter === player1) ? p2Label : t('hud_j1'), fighter === player1 ? 'p2' : 'p1');
  }
  function endRound(winnerLabel, winnerSide) {
    if (matchPhase !== 'active') return;
    matchPhase = 'round-end'; phaseElapsedMs = 0; lastRoundSide = winnerSide;
    if (winnerSide !== 'draw') roundWins[winnerSide]++;
    updateRoundMarkers();
    if (winnerSide === 'draw' || roundWins[winnerSide] < 2) {
      showRoundCallout(`ROUND ${roundNumber}`, winnerSide === 'draw' ? t('draw_text') : CHAR_DATA[winnerSide === 'p1' ? p1Selection : p2Selection].label.toUpperCase() + ' WINS');
      return;
    }
    matchPhase = 'complete'; roundCallout.classList.add('hidden');
    playerStats.matchesPlayed++;
    if (winnerSide === 'p1') playerStats.p1Wins++;
    else if (winnerSide === 'p2') { if (gameMode === 'AI') playerStats.cpuWins++; else playerStats.p2Wins++; }
    saveStatsToStorage();
    victoryText.textContent = winnerSide === 'draw' ? t('draw_text') : (t('victory_of') + winnerLabel.toUpperCase() + '!');
    goTo('VICTORY');
  }
  function startBattle() {
    if (!CHAR_DATA[p1Selection].playable || !CHAR_DATA[p2Selection].playable) return;
    roundWins = {p1:0,p2:0}; roundNumber = 1;
    beginRound();
  }
  function beginRound() {
    createFighters();
    aiState = { decisionTimer:0, action:'idle' };
    damageNumbers = []; impactFlashes = []; partCards = []; overdriveBanners = [];
    lastHudSnapshot = { p1hp:-1, p2hp:-1, p1axp:-1, p2axp:-1 };
    roundTime = 60; roundRemainingMs = 60000; timerValueEl.textContent = roundTime;
    matchPhase = 'countdown'; phaseElapsedMs = 0; displayedRoundWord = '';
    goTo('BATTLE'); updateRoundMarkers(); advanceMatchPhase(0);
  }

  // ===========================================================
  // INICIALIZACIÓN
  // ===========================================================
  applyResolutionSetting();
  watermarkText.textContent = t('watermark');
  goTo('INTRO');
  gameLoop.start();

})();
