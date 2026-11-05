// Each incoming hazard moves in its own readable way. The base path still goes straight (so nothing
// homes in after launch); a motion only adds a sideways offset, a speed rhythm, or spin around that path.
// t = seconds since spawn. Offsets are perpendicular to travel unless noted ("up" = screen up).
// Spinning is kept rare and slow so the screen never gets dizzy: most spinners only rock gently,
// about 1 in 5 (decided at spawn, `o.spinning`) turns slowly; only the pinball star always turns.
export const SPIN_CHANCE=.2,SPIN_MAX=1.6;
export const MOTIONS=Object.freeze({
 float:{side:t=>Math.sin(t*2.2)*26,rise:32},            // bubble: drifts up while swaying
 drift:{side:t=>Math.sin(t*1.2)*14,speed:()=>.8},          // cloud: slow, lazy
 flutter:{side:t=>Math.sin(t*3)*40,tilt:t=>Math.sin(t*3)*.35}, // paper: zigzags like a falling flyer
 spin:{spin:6},                                             // banana, drink: rock (sometimes a slow twirl)
 frisbee:{spin:10,side:t=>Math.sin(t*1.6)*30},              // pancakes: curve (sometimes a slow spin)
 hop:{up:t=>Math.abs(Math.sin(t*3.6))*55},                  // apple: hops along
 swing:{side:t=>Math.sin(t*2.6)*45,tilt:t=>Math.sin(t*2.6)*.4}, // cherry: pendulum swing
 wobble:{up:t=>Math.abs(Math.sin(t*5))*18,tilt:t=>Math.sin(t*10)*.12}, // cake: jiggles
 tumble:{spin:3},                                           // crate, blocks: rock (sometimes a slow tumble)
 dash:{speed:t=>t%1.6<.6?.25:1.75,side:t=>Math.sin(t*6)*6}, // UFO: hovers, then dashes
 zap:{side:t=>Math.sin(t*1.8)*24,speed:t=>.9+Math.sin(t*2.2)*.2}, // lightning: smooth sway with a gentle surge
 heavy:{speed:()=>.8,side:t=>Math.sin(t*1.4)*20},          // iron ball: slow and swaying
 bounce:{up:t=>Math.abs(Math.sin(t*3))*80,spin:4},          // spike ball: big bounces
 boost:{speed:t=>.5+Math.min(1.2,t*.8)},                    // rocket: starts slow, then speeds up
 ricochet:{spin:2.5,bounces:3,always:true},                               // star: pinball off the screen edges
});
export function moveIncoming(o,dt,view){
 const m=o.move&&MOTIONS[o.move];
 if(!m){o.x+=o.vx*dt;o.y+=o.vy*dt;if(o.wave){o.phase+=dt*o.wave.speed;o.y+=Math.cos(o.phase)*o.wave.height*o.wave.speed*dt;}return;}
 o.age=(o.age||0)+dt;const t=o.age,k=m.speed?m.speed(t):1;
 o.bx??=o.x;o.by??=o.y;o.bx+=o.vx*k*dt;o.by+=(o.vy*k-(m.rise||0))*dt;
 if(m.bounces&&view){
  // Pinball star: once inside the view it bounces off the edges a few times, then flies away.
  const pad=(o.size||120)*.35,inside=o.bx>view.x+pad&&o.bx<view.x+view.w-pad&&o.by>view.y+pad&&o.by<view.y+view.h-pad;
  if(inside)o.entered=true;o.bounces??=m.bounces;
  if(o.entered&&o.bounces>0){let hit=false;
   if((o.bx<view.x+pad&&o.vx<0)||(o.bx>view.x+view.w-pad&&o.vx>0)){o.vx=-o.vx;hit=true;}
   if((o.by<view.y+pad&&o.vy<0)||(o.by>view.y+view.h-pad&&o.vy>0)){o.vy=-o.vy;hit=true;}
   if(hit){o.bounces--;o.bounced=(o.bounced||0)+1;o.life=Math.max(o.life,4);}
  }
 }
 const len=Math.hypot(o.vx,o.vy)||1,nx=-o.vy/len,ny=o.vx/len,side=m.side?m.side(t):0,up=m.up?m.up(t):0;
 o.x=o.bx+nx*side;o.y=o.by+ny*side-up;
 if(!o.directed){
  if(m.tilt)o.angle=m.tilt(t);
  else if(m.spin&&(m.always||o.spinning))o.angle=(o.angle||0)+Math.min(SPIN_MAX,m.spin)*dt*(o.vx<0?-1:1);
  else if(m.spin)o.angle=(Math.sin(t*2.2+(o.seed||0))-Math.sin(o.seed||0))*.2; // gentle rocking (starts level, no snap)
 }
}
