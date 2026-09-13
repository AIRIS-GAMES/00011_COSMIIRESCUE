export const RAINBOW_TARGET=20,RAINBOW_SECONDS=12;
export class RainbowMode {
  constructor(){this.left=0;this.elapsed=0;this.activations=0;}
  get active(){return this.left>0;}
  returnGroup(game,count){if(count<RAINBOW_TARGET)return;this.left=Math.min(24,this.left+RAINBOW_SECONDS);this.elapsed=0;this.activations++;game.stun=0;game.cooldown=0;for(const key of Object.keys(game.effects))game.effects[key]=0;game.emit('rainbowStart',{x:game.player.x,y:game.player.y});}
  update(game,dt){if(!this.active)return;this.elapsed+=dt;this.left=Math.max(0,this.left-dt);if(!this.active){game.cooldown=Math.max(game.cooldown,.8);game.emit('rainbowEnd');}}
}
// Same sprite-local eye coordinates and transform are used for drawing and hits.
export function eyeBeams(game){
  const p=game.player,v=p.tap>0?Math.sin(p.tap/.28*Math.PI)*.07:0,c=Math.cos(p.angle),s=Math.sin(p.angle);
  const forward=game.direction<-.15?-1:1;
  // A gentle +/- 7 degree sweep every 2.4 seconds, shared by both eyes.
  const sway=Math.sin(game.rainbow.elapsed*Math.PI*2/2.4)*Math.PI*7/180;
  return [[-5.5,5.5],[8.5,11.5]].map(([x,y])=>{x*=1+v;y*=1-v;return {x:p.x+x*c-y*s,y:p.y+x*s+y*c,dx:forward*Math.cos(sway),dy:Math.sin(sway),length:1100};});
}
export function beamTargetVisible(game,o){const v=game.view;if(!v)return true;return o.x>v.x+60&&o.x<v.x+v.w-60&&o.y>v.y+40&&o.y<v.y+v.h-40;}
export function beamHits(beam,object){
  const x=object.r?object.x:object.x+object.w/2,y=object.r?object.y:object.y+object.h/2;
  const radius=object.r||Math.hypot(object.w,object.h)/2;
  const along=Math.max(0,Math.min(beam.length,(x-beam.x)*beam.dx+(y-beam.y)*beam.dy));
  return Math.hypot(x-beam.x-along*beam.dx,y-beam.y-along*beam.dy)<radius+10;
}
