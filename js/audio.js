import {TRACKS,assetUrl} from './config.js';
export class AudioManager{
  constructor(volume=.8){this.volume=volume;this.channels=[new Audio(),new Audio()];this.channels.forEach(a=>{a.loop=true;a.preload='none';});this.index=0;this.track='';this.pending='title';this.unlocked=false;this.token=0;this.missing=new Set();}
  unlock(){this.unlocked=true;this.context??=new AudioContext();this.context.resume().catch(()=>{});this.play(this.pending);}
  setVolume(value){this.volume=Math.max(0,Math.min(1,value));this.channels[this.index].volume=this.volume;}
  setSfxVolume(value){this.sfxVolume=Math.max(0,Math.min(1,value));}
  async play(track){
    this.pending=track;if(!this.unlocked||this.track===track)return;
    if(this.missing.has(track)){++this.token;this.channels.forEach(a=>a.pause());this.track='';return;}
    const token=++this.token,old=this.channels[this.index],next=this.channels[1-this.index];
    next.pause();next.src=assetUrl('assets/audio/'+TRACKS[track]);next.volume=0;
    try{await next.play();}catch{if(token===this.token){this.missing.add(track);old.pause();this.track='';}return;}
    if(token!==this.token){next.pause();return;}this.index=1-this.index;this.track=track;
    const start=performance.now(),oldVolume=old.volume;
    const fade=now=>{if(token!==this.token)return;const p=Math.min(1,(now-start)/400);next.volume=this.volume*p;old.volume=oldVolume*(1-p);if(p<1)requestAnimationFrame(fade);else old.pause();};requestAnimationFrame(fade);
  }
  tone(frequency=660,duration=.08){if(!this.context||this.context.state!=='running')return;const level=this.volume*(this.sfxVolume??.8);if(!level)return;const osc=this.context.createOscillator(),gain=this.context.createGain(),now=this.context.currentTime;osc.type='triangle';osc.frequency.value=frequency;gain.gain.setValueAtTime(level*.15,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);osc.connect(gain).connect(this.context.destination);osc.start();osc.stop(now+duration);}
  hit(special){this.tone(special?180:280,.13);}
  overdrive(){this.tone(1000,.3);}
  jump(){this.tone(450);}
  refresh(){this.missing.clear();this.track='';this.play(this.pending);}
}
