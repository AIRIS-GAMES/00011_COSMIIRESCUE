import {updateSkills} from './skills.js';
import {RescueGame,seededRandom,overlap} from './engine.js';
import {stage} from './stage.js';
// Practice is isolated from normal runs, scores and saves.
export class TrainingGame extends RescueGame {
 constructor(){super(stage,seededRandom(32),{enabled:false});this.isTraining=true;this.practiceSkills=true;this.manualSkills=true;}
 startPractice(){super.start('normal');this.world={extend(){}};this.incoming={update(){}};this.stage.zones=[];this.stage.spawns=[];this.stage.props=[];this.obstacles=[];this.events=[];this.leftTravel=0;this.rightTravel=0;this.leftDone=false;this.rightDone=false;this.flapped=false;this.recoveries=0;this.passedObstacle=false;this.skillRetries=0;this.enterStep(0);}
 enterStep(step){this.practiceStep=step;this.player.x=600;this.player.y=650;this.player.vx=0;this.player.vy=0;this.homes=[];this.friends=[];this.stage.home={x:1250,y:650,radius:65};if(step===2)for(let i=0;i<3;i++)this.spawnFriend({x:760+i*45,y:650,kind:0});if(step===3)this.homes=[this.stage.home];if(step===4){this.setDirection(0);this.phaseLeft=0;this.skillLeft[0]=0;this.skillCharge[0]=3;this.passedObstacle=false;this.obstacles=[{id:'practice-ironball',asset:'ironball',x:880,y:650,baseX:880,baseY:650,r:65,size:150,damage:3,disabled:0,motion:{x:0,y:0,speed:0},phase:0}];}}
 activateSkill(kind){if(this.practiceStep!==4||kind!==0)return false;const activated=super.activateSkill(kind);if(activated){this.practiceStep=5;this.passedObstacle=false;}return activated;}
 // Practice never costs lives or friends, even if the skill ends inside the iron ball.
 hit(){return false;}
 flap(){if(this.practiceStep===4||this.practiceStep===6)return;super.flap();if(this.practiceStep===1)this.flapped=true;}
 rescue(f){const before=this.carry.length;super.rescue(f);if(this.practiceStep===2&&this.carry.length>before&&this.carry.length>=3)this.enterStep(3);}
 beginReturn(){const before=this.rescued;super.beginReturn();if(this.practiceStep===3&&this.rescued>before)this.enterStep(4);}
 update(dt){
  if(this.state!=='playing')return super.update(dt);
  if(this.practiceStep===4||this.practiceStep===6){while(this.bankQueue.length)this.bankOne();updateSkills(this,dt);return;}
  const step=this.practiceStep,x=this.player.x;super.update(dt);
  if(step===5){
   if(this.skillCutin)return;
   const obstacle=this.obstacles[0];
   if(this.phaseLeft>0&&obstacle&&overlap(this.player,obstacle))this.passedObstacle=true;
   if(this.passedObstacle&&this.phaseLeft>0&&this.player.x>obstacle.x+obstacle.r+this.player.r){this.practiceStep=6;this.player.vx=0;this.player.vy=0;return;}
   if(this.phaseLeft<=0||this.player.y<350||this.player.y>900||this.player.x<450||this.player.x>1150){this.skillRetries++;this.enterStep(4);}return;
  }
  if(step===0){
   this.player.y=650;this.player.vy=0;
   if(!this.direction){this.player.x=x;this.player.vx=0;}
   if(this.direction<-.25&&this.player.x<x-.1)this.leftTravel+=x-this.player.x;
   if(this.direction>.25&&this.player.x>x+.1)this.rightTravel+=this.player.x-x;
   this.leftDone=this.leftTravel>=35;this.rightDone=this.rightTravel>=35;
   if(this.leftDone&&this.rightDone)this.enterStep(1);
  }else if(step===1){this.player.x=600;this.player.vx=0;if(this.flapped&&this.player.y<620)this.enterStep(2);}
  if(this.practiceStep<4&&(this.player.x<100||this.player.x>(this.practiceStep===3?1550:1100)||this.player.y<350||this.player.y>900)){
   this.recoveries++;this.player.x=600;this.player.y=650;this.player.vx=0;this.player.vy=0;for(const f of this.carry){f.x=600;f.y=610;}
  }
 }
}
