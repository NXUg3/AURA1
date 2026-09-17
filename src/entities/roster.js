export const PART_LABELS = { horn:'CUERNO', back:'ESPALDA', tail:'COLA', mouth:'BOCA' };

const stats = (typeEs,typeEn,speedEs,speedEn,rangeEs,rangeEn,easeEs,easeEn) => ({
  type:{es:typeEs,en:typeEn,ja:typeEn}, speed:{es:speedEs,en:speedEn,ja:speedEn},
  range:{es:rangeEs,en:rangeEn,ja:rangeEn}, ease:{es:easeEs,en:easeEn,ja:easeEn}
});

export const CHAR_DATA = Object.freeze({
  oleg: {
    label:'Oleg', playable:true, element:'nature', color:'#3ddc61', accent:'#8fffb0',
    palette:{primary:'#3ddc61',rim:'#c8ff72'}, initial:'OLG',
    subtitle:{es:'GUARDIÁN VERDE · PLANTA',en:'GREEN GUARDIAN · PLANT',ja:'緑の守護者 · プラント'},
    combat:{hp:110,speed:4.0,basicDamage:7,specialDamage:17,hurtbox:{width:86,height:112}},
    parts:{horn:'Brote Espinoso',back:'Follaje Denso',tail:'Raíz Trepadora',mouth:'Pétalo Carnívoro'},
    stats:stats('Planta','Plant','Lenta','Slow','Cercano','Close','Fácil','Easy')
  },
  kotaro: {
    label:'Kotaro', playable:true, element:'beast', color:'#e8f2ff', accent:'#ffc94a',
    palette:{primary:'#f2f6ff',rim:'#78bfff'}, initial:'KTR',
    subtitle:{es:'MERCENARIO YETI · BESTIA',en:'YETI MERCENARY · BEAST',ja:'イエティ傭兵 · ビースト'},
    combat:{hp:100,speed:4.4,basicDamage:9,specialDamage:19,hurtbox:{width:86,height:126}},
    parts:{horn:'Cuernos Gemelos',back:'Espada Mercenaria',tail:'Manto Níveo',mouth:'Colmillo Bestial'},
    stats:stats('Bestia','Beast','Rápida','Fast','Medio','Mid-Range','Difícil','Hard')
  },
  pomodoro: {
    label:'Pomodoro', playable:true, element:'fire', color:'#ef4f71', accent:'#ffb347',
    palette:{primary:'#ef4f71',rim:'#ffcf4d'}, initial:'POM',
    subtitle:{es:'CORAZÓN ÍGNEO · FUEGO',en:'BLAZING HEART · FIRE',ja:'炎の心 · ファイア'},
    combat:{hp:95,speed:4.7,basicDamage:10,specialDamage:20,hurtbox:{width:84,height:128}},
    parts:{horn:'Llamas Gemelas',back:'Caparazón Ígneo',tail:'Cola de Espinas',mouth:'Mordida Ardiente'},
    stats:stats('Fuego','Fire','Muy rápida','Very Fast','Medio','Mid-Range','Media','Medium')
  },
  buba: {
    label:'Buba', playable:true, element:'water', color:'#299fe9', accent:'#ff9ad1',
    palette:{primary:'#299fe9',rim:'#9cecff'}, initial:'BUB',
    subtitle:{es:'TITÁN OCEÁNICO · ACUÁTICO',en:'OCEAN TITAN · AQUATIC',ja:'海の巨人 · アクアティック'},
    combat:{hp:120,speed:3.8,basicDamage:8,specialDamage:18,hurtbox:{width:92,height:130}},
    parts:{horn:'Cactus Real',back:'Alas Oceánicas',tail:'Aleta Rosada',mouth:'Colmillos Marinos'},
    stats:stats('Acuático','Aquatic','Media','Medium','Largo','Long-Range','Fácil','Easy')
  },
  momo: { label:'Momo', playable:false, locked:true, color:'#f26bb5', accent:'#ffd2eb', initial:'MOM' },
  trip: { label:'Trip', playable:false, locked:true, color:'#ffd04e', accent:'#fff0a6', initial:'TRP' },
  venoki: { label:'Venoki', playable:false, locked:true, color:'#8c5cff', accent:'#cbb8ff', initial:'VEN' },
  puff: { label:'Puff', playable:false, locked:true, color:'#6ee7f2', accent:'#d0fbff', initial:'PUF' }
});

export const CHAR_KEYS = Object.freeze(['oleg','momo','buba','pomodoro','trip','venoki','puff','kotaro']);
export const PLAYABLE_KEYS = Object.freeze(CHAR_KEYS.filter((key) => CHAR_DATA[key].playable));
export const GRID_COLS = 4;
