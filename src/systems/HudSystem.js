export const HUD_CLASS_PALETTES = Object.freeze({
  oleg:{high:'#c8ff60',low:'#268f38',glow:'#7dff78',energy:'#baff66'},
  kotaro:{high:'#fff06a',low:'#c47a08',glow:'#ffd54f',energy:'#ffc13b'},
  pomodoro:{high:'#fff073',low:'#e42b16',glow:'#ff5b28',energy:'#ff8a24'},
  buba:{high:'#9b7bff',low:'#099fd1',glow:'#52e5ff',energy:'#79cfff'}
});

export function applyHudTheme(block,type) {
  const palette=HUD_CLASS_PALETTES[type]||HUD_CLASS_PALETTES.kotaro;
  block.style.setProperty('--hp-a',palette.high);
  block.style.setProperty('--hp-b',palette.low);
  block.style.setProperty('--hud-glow',palette.glow);
  block.style.setProperty('--energy',palette.energy);
}
