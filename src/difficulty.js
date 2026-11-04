export function difficulty(mode,time,danger=false){
  const hard=mode==='hard',ramp=Math.min(1,Math.max(0,time-(hard?8:25))/100);
  return {interval:Math.max(hard?.48:.68,(hard?1.05:1.3)-ramp*.42-(danger?.18:0)),
    speed:(hard?1.35:1.1)+ramp*.5+(danger?.15:0),heavy:time>=(hard?8:30),cooldown:hard?1:1.3};
}
export function impact(mode,tier,count,direct){
  const hard=mode==='hard',strong=tier>=2;
  return {loss:Math.min(count,strong?Math.max(tier+(hard?2:1),Math.ceil(count*(hard?.6:.4))):(hard?3:2)),
    fatal:hard&&direct&&strong,stun:strong?(hard?.42:.28):0,life:direct&&!hard};
}
// Pure, single calculation of the loss. Every damaging hit hurts from the first second:
// friends scatter if any are in tow, otherwise a heart is lost (effect hazards never reach here).
export function damagePlan({mode,count,direct,stun=0},tier){
 const rules=impact(mode,tier,count,direct);
 const loss=rules.loss,life=!count?1:rules.life?1:0,stunAdded=Math.max(0,rules.stun-stun);
 return {loss,life,stunAdded,fatal:rules.fatal,harmful:loss>0||life>0||stunAdded>0};
}
// Arrival pressure: the run's area sets the base mix; friends in tow raise the stakes on top.
// Time only adds a small within-area drift, so progress (returns) and greed (carry) drive difficulty.
export const CARRY_FULL=20;
export function pressure(mode,{time=0,area,carry=0}={}){
 const hard=mode==='hard',load=Math.min(1,Math.max(0,carry)/CARRY_FULL),drift=Math.min(1,Math.max(0,time-(hard?8:25))/150);
 const a=area||{heavy:0,speed:1,interval:1};
 const interval=Math.max(hard?.46:.6,(hard?1.05:1.3)*a.interval*(1-load*.22)-drift*.1);
 const speed=(hard?1.35:1.1)*a.speed*(1+load*.15)+drift*.12;
 // Sky stays soft-and-food unless a big crowd is in tow; later areas add heavy hazards.
 let heavy=a.heavy>0?a.heavy+load*.25:load>=.5?(load-.5)*.3:0;
 if(hard)heavy+=.12;
 return {interval,speed,heavy:Math.min(.75,heavy),normal:Math.min(.85,.5+load*.3),load};
}
