const basicHitboxes = [null,{forward:24,top:-104,width:46,height:62},{forward:30,top:-108,width:58,height:66},{forward:34,top:-104,width:62,height:64},null,null];
const specialHitboxes = [null,null,{forward:36,top:-114,width:76,height:82},{forward:42,top:-110,width:84,height:80},{forward:34,top:-106,width:72,height:74},null];

export function createSpriteRegistry() {
  return {
    olek: {
      img:new Image(),
      frames:{},
      hitboxes:{basic:basicHitboxes,special:specialHitboxes}
    },
    kotaro: {
      img:new Image(),
      frames:{},
      hitboxes:{basic:basicHitboxes,special:specialHitboxes}
    },
    pomodoro: {
      img:new Image(), tint:'red',
      frames:{},
      hitboxes:{basic:basicHitboxes,special:specialHitboxes}
    },
    buba: {
      img:new Image(), tint:'blue',
      frames:{
        idle:{x:18,y:52,w:382,h:114,count:5}, walk:{x:418,y:52,w:357,h:114,count:5},
        punch:{x:18,y:225,w:364,h:116,count:4}, jump:{x:1118,y:44,w:393,h:128,count:5},
        hurt:{x:610,y:391,w:306,h:111,count:4}, defeat:{x:395,y:558,w:334,h:98,count:3}
      },
      hitboxes:{basic:basicHitboxes,special:specialHitboxes}
    }
  };
}
