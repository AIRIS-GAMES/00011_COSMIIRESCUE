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
// Pure, single calculation of the loss AFTER existing protection, BEFORE blue defense.
export function damagePlan({mode,time,count,direct,protectedReturn=false,stun=0},tier){
 const rules=impact(mode,tier,count,direct),opening=mode!=='hard'&&time<30&&!count;
 const loss=opening?0:protectedReturn?Math.min(rules.loss,Math.max(0,count-1)):rules.loss;
 const life=opening?0:!count?1:rules.life&&time>=30&&!protectedReturn?1:0;
 const stunAdded=opening?0:Math.max(0,rules.stun-stun);
 return {loss,life,stunAdded,fatal:!opening&&rules.fatal,harmful:loss>0||life>0||stunAdded>0};
}
