export const SKILL_REQUIREMENTS=Object.freeze([3,4,5,6]);
export const SKILL_COLORS=['#ff65c4','#59ddff','#ff5c70','#c47aff'];
export const skillNames=['するり抜け','ふわふわガード','はね飛ばし','おたすけキャッチ'];
export const SKILL_SECONDS=5;
// Each use in a run raises that color's next requirement by one (pink 3 → 4 → 5 …), up to +3. Practice keeps the base.
export const SKILL_EXTRA_MAX=3;
export function skillRequirement(game,kind){return SKILL_REQUIREMENTS[kind]+(game.isTraining?0:Math.min(SKILL_EXTRA_MAX,game.skillUses?.[kind]||0));}
export function resetSkills(game){game.skillUses=[0,0,0,0];game.skillLeft=[0,0,0,0];game.skillPulse=[0,0,0,0];game.skillCharge=[0,0,0,0];game.skillCutin=null;game.phaseLeft=0;game.skillGuard=false;}
export function chargeSkill(game,friend,charge=true){
 if(!game.manualSkills||(game.isTraining&&!game.practiceSkills)||friend.skillCharged||Number.isInteger(friend.collaborationKind))return;
 friend.skillCharged=true;
 if(charge&&Number.isInteger(friend.kind)&&friend.kind>=0&&friend.kind<4)game.skillCharge[friend.kind]=Math.min(skillRequirement(game,friend.kind),game.skillCharge[friend.kind]+1);
}
export function activateSkill(game,kind){
 if(!game.manualSkills||(game.isTraining&&!game.practiceSkills)||game.state!=='playing'||game.skillCutin||game.skillCharge[kind]!==skillRequirement(game,kind)||game.skillLeft[kind]>0)return false;
 game.skillCharge[kind]=0;game.skillUses[kind]++;game.skillCutin={kind,left:.6};game.emit('skillStart',{kind,next:skillRequirement(game,kind)});return true;
}
function pulse(game,kind){
 if(kind===2){
  game.obstacles=game.obstacles.filter(o=>{if(Math.hypot(o.x-game.player.x,o.y-game.player.y)>400)return true;game.emit('break',{x:o.x,y:o.y,asset:o.asset,size:o.size,angle:o.angle,rainbow:true,cause:'redSkill'});return false;});
 }
 if(kind===3){
  const nearby=game.friends.filter(f=>!f.cooldown&&Math.hypot(f.x-game.player.x,f.y-game.player.y)<=450).sort((a,b)=>Math.hypot(a.x-game.player.x,a.y-game.player.y)-Math.hypot(b.x-game.player.x,b.y-game.player.y)).slice(0,3);
  for(const friend of nearby)game.rescue(friend,false);
 }
}
export function updateSkills(game,dt){
 if(!game.skillCutin){
  for(let kind=0;kind<4;kind++){
   const before=game.skillLeft[kind];game.skillLeft[kind]=Math.max(0,before-dt);
   if(before>0&&!game.skillLeft[kind])game.emit('skillExpired',{kind});
   if(kind>=2&&game.skillLeft[kind]>0){
    game.skillPulse[kind]-=dt;
    if(game.skillPulse[kind]<=0){pulse(game,kind);game.skillPulse[kind]=kind===2?.5:1;}
   }
  }
  game.phaseLeft=game.skillLeft[0];game.skillGuard=game.skillLeft[1]>0;
  return false;
 }
 const cutin=game.skillCutin;cutin.left=Math.max(0,cutin.left-dt);
 if(cutin.left>0)return true;
 game.skillCutin=null;game.cooldown=Math.max(game.cooldown,.8);game.stun=0;game.hitstop=0;
 game.skillLeft[cutin.kind]=SKILL_SECONDS;
 if(cutin.kind===0){game.phaseLeft=SKILL_SECONDS;for(const key of Object.keys(game.effects))game.effects[key]=0;}
 if(cutin.kind===1)game.skillGuard=true;
 pulse(game,cutin.kind);game.skillPulse[cutin.kind]=cutin.kind===2?.5:1;
 game.emit('skillEnd',{kind:cutin.kind});return true;
}
