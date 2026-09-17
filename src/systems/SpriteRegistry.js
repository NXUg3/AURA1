const basicHitboxes = [null,{forward:24,top:-104,width:46,height:62},{forward:30,top:-108,width:58,height:66},{forward:34,top:-104,width:62,height:64},null,null];
const specialHitboxes = [null,null,{forward:36,top:-114,width:76,height:82},{forward:42,top:-110,width:84,height:80},{forward:34,top:-106,width:72,height:74},null];

export function createSpriteRegistry() {
  return {
    oleg: {
      img:new Image(),
      frames:{
        idle:{x:20,y:44,w:354,h:122,count:6}, walk:{x:398,y:44,w:366,h:122,count:6},
        punch:{x:20,y:222,w:330,h:122,count:6}
      },
      hitboxes:{basic:basicHitboxes,special:specialHitboxes}
    },
    kotaro: {
      img:new Image(),
      standardLayouts:{idle:{count:12,columns:4,rows:3,removeConnectedBackground:true}},
      frames:{
        idle:{x:20,y:50,w:450,h:105,count:6}, walk:{x:500,y:50,w:480,h:105,count:6},
        punch:{x:500,y:225,w:480,h:105,count:6}
      },
      hitboxes:{basic:basicHitboxes,special:specialHitboxes}
    },
    pomodoro: {
      img:new Image(), tint:'red',
      frames:{
        idle:{x:18,y:46,w:360,h:112,count:6}, walk:{x:414,y:46,w:345,h:112,count:6},
        punch:{x:18,y:210,w:350,h:118,count:6}
      },
      hitboxes:{basic:basicHitboxes,special:specialHitboxes}
    },
    buba: {
      img:new Image(), tint:'blue',
      frames:{
        idle:{x:18,y:48,w:368,h:120,count:6}, walk:{x:418,y:48,w:360,h:120,count:6},
        punch:{x:18,y:212,w:360,h:120,count:6}
      },
      hitboxes:{basic:basicHitboxes,special:specialHitboxes}
    }
  };
}
