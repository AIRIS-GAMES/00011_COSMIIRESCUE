// Renderer-owned transient state. No writes to the simulation, no gameplay RNG.
export const MAX_RESCUE_REACTIONS=24;
export class RescueReactions {
 constructor(enabled=true){this.enabled=enabled;this.reset();}
 reset(){this.time=0;this.buddies=new Map();this.hero=null;this.rings=[];}
 event(e,game){
  if(!this.enabled||!game)return;
  if(e.type==='rescue'){
   if(Number.isInteger(e.collaborationKind))return;
   // Existing rescue events carry the post-rescue count, without changing their schema.
   const atIndex=game.carry[e.count-1];
   const buddy=atIndex?.kind===e.kind?atIndex:game.carry.find(f=>f.kind===e.kind&&!this.buddies.has(f.id));
   if(buddy){if(this.buddies.size>=MAX_RESCUE_REACTIONS)this.buddies.delete(this.buddies.keys().next().value);this.buddies.set(buddy.id,{kind:e.kind,start:this.time});}
   this.hero={type:'rescue',start:this.time,direction:e.x<game.player.x?-1:1};
  }
  if(e.type==='lost')this.hero={type:'lost',start:this.time,direction:e.x<game.player.x?-1:1};
  if(e.type==='return'){
   this.hero={type:'return',start:this.time,direction:e.x<game.player.x?-1:1};
   if(this.rings.length===3)this.rings.shift();this.rings.push({x:e.x,y:e.y,start:this.time});
  }
 }
 advance(dt,paused=false){if(!this.enabled||paused)return;this.time+=Math.max(0,Math.min(.1,dt));for(const [id,r] of this.buddies)if(this.time-r.start>=.8)this.buddies.delete(id);if(this.hero&&this.time-this.hero.start>=1)this.hero=null;while(this.rings.length&&this.time-this.rings[0].start>=1.1)this.rings.shift();}
 applyBuddy(ctx,id,reduced){if(!this.enabled||reduced)return;const r=this.buddies.get(id);if(r)this.pose(ctx,r.kind,(this.time-r.start)/.8);}
 pose(ctx,kind,t){
  const wave=Math.sin(Math.PI*Math.max(0,Math.min(1,t)));
  if(kind===2){ctx.translate(0,-16*wave);ctx.scale(1+.06*wave,1-.06*wave);} // red: bounce
  else if(kind===1)ctx.rotate(Math.sin(t*Math.PI*2)*.12*wave); // blue: look around
  else if(kind===3){ctx.translate(0,-5*wave);ctx.rotate(-.08*wave);} // purple: a small proud tilt
  else ctx.translate(2*wave,-2*wave); // pink: barely reacts
 }
 applyHero(ctx,reduced,powered){if(!this.enabled||reduced||powered||!this.hero)return;const t=this.time-this.hero.start;ctx.rotate(Math.sin(Math.PI*t)*this.hero.direction*(this.hero.type==='lost'?.11:.065));}
 applyReturn(ctx,kind,t,reduced){if(this.enabled&&!reduced&&t>=0&&t<.8)this.pose(ctx,kind,t/.8);}
}
