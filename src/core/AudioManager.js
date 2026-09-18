import { ASSET_PATHS } from './AssetLoader.js';

const TRACK_BY_STATE = Object.freeze({
  TITLE: ASSET_PATHS.audio.pressStart,
  MENU: ASSET_PATHS.audio.mainMenu,
  OPTIONS: ASSET_PATHS.audio.mainMenu,
  HELP: ASSET_PATHS.audio.mainMenu,
  CONTROLS: ASSET_PATHS.audio.mainMenu,
  CREDITS: ASSET_PATHS.audio.mainMenu,
  PLAYER_DATA: ASSET_PATHS.audio.mainMenu,
  ROOM: ASSET_PATHS.audio.mainMenu,
  CHAR_SELECT: ASSET_PATHS.audio.characterSelect,
  VS: ASSET_PATHS.audio.characterSelect,
  BATTLE: ASSET_PATHS.audio.combatTheme,
  VICTORY: ASSET_PATHS.audio.combatTheme
});

export class AudioManager {
  constructor({ volume = 0.62, fadeMs = 520 } = {}) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.fadeMs = fadeMs;
    this.activeIndex = 0;
    this.channels = [new Audio(), new Audio()];
    this.channels.forEach((channel) => { channel.loop = true; channel.preload = 'auto'; });
    this.currentPath = '';
    this.pendingState = 'TITLE';
    this.unlocked = false;
    this.transitionToken = 0;
    this.warnedPaths = new Set();
  }
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value) || 0));
    const active = this.channels[this.activeIndex];
    if (!active.paused) active.volume = this.volume;
  }
  unlock() {
    if (!this.unlocked) this.unlocked = true;
    return this.transitionToState(this.pendingState);
  }
  async transitionToState(state) {
    const path = TRACK_BY_STATE[state];
    if (!path) return false;
    this.pendingState = state;
    if (!this.unlocked) return false;
    const current = this.channels[this.activeIndex];
    if (this.currentPath === path && !current.paused) return true;
    const token = ++this.transitionToken;
    const nextIndex = 1 - this.activeIndex;
    const next = this.channels[nextIndex];
    next.pause(); next.src = path; next.currentTime = 0; next.volume = 0; next.load();
    try { await next.play(); }
    catch (error) {
      if (!this.warnedPaths.has(path)) {
        this.warnedPaths.add(path);
        console.info(`[AudioManager] Pista pendiente o no disponible: ${path}`, error);
      }
      return false;
    }
    if (token !== this.transitionToken) { next.pause(); return false; }
    const old = current;
    const oldStartVolume = old.paused ? 0 : old.volume;
    this.activeIndex = nextIndex;
    this.currentPath = path;
    const startedAt = performance.now();
    const fade = (now) => {
      if (token !== this.transitionToken) return;
      const progress = Math.min(1, (now - startedAt) / this.fadeMs);
      next.volume = this.volume * progress;
      if (!old.paused) old.volume = oldStartVolume * (1 - progress);
      if (progress < 1) requestAnimationFrame(fade);
      else { old.pause(); old.currentTime = 0; old.removeAttribute('src'); }
    };
    requestAnimationFrame(fade);
    return true;
  }
  stop() {
    ++this.transitionToken;
    this.channels.forEach((channel) => { channel.pause(); channel.currentTime = 0; });
    this.currentPath = '';
  }
}
