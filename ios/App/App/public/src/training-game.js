import {RescueGame,seededRandom} from './engine.js';
import {stage} from './stage.js';
// Practice is isolated from normal runs, scores and saves.
export class TrainingGame extends RescueGame {
 constructor(){super(stage,seededRandom(32),{enabled:false});this.isTraining=true;}
 startPractice(){super.start('normal');this.world={extend(){}};this.incoming={update(){}};this.stage.zones=[];this.stage.spawns=[];this.stage.props=[];this.obstacles=[];this.events=[];this.leftTravel=0;this.rightTravel=0;this.leftDone=false;this.rightDone=false;this.flapped=false;this.recoveries=0;this.enterStep(0);}
 enterStep(step){this.practiceStep=step;this.player.x=600;this.player.y=650;this.player.vx=0;this.player.vy=0;this.homes=[];this.friends=[];this.stage.home={x:820,y:650,radius:65};if(step===2)this.spawnFriend({x:780,y:650,kind:0});if(step===3)this.homes=[this.stage.home];}
 flap(){super.flap();if(this.practiceStep===1)this.flapped=true;}
 rescue(f){const before=this.carry.length;super.rescue(f);if(this.practiceStep===2&&this.carry.length>before)this.enterStep(3);}
 beginReturn(){const before=this.rescued;super.beginReturn();if(this.practiceStep===3&&this.rescued>before)this.practiceStep=4;}
 update(dt){
  if(this.state!=='playing')return super.update(dt);
  if(this.practiceStep===4){while(this.bankQueue.length)this.bankOne();return;}
  const step=this.practiceStep,x=this.player.x;super.update(dt);
  if(step===0){
   this.player.y=650;this.player.vy=0;
   if(!this.direction){this.player.x=x;this.player.vx=0;}
   if(this.direction<-.25&&this.player.x<x-.1)this.leftTravel+=x-this.player.x;
   if(this.direction>.25&&this.player.x>x+.1)this.rightTravel+=this.player.x-x;
   this.leftDone=this.leftTravel>=35;this.rightDone=this.rightTravel>=35;
   if(this.leftDone&&this.rightDone)this.enterStep(1);
  }else if(step===1){this.player.x=600;this.player.vx=0;if(this.flapped&&this.player.y<620)this.enterStep(2);}
  if(this.practiceStep<4&&(Math.abs(this.player.x-600)>500||this.player.y<350||this.player.y>900)){
   this.recoveries++;this.player.x=600;this.player.y=650;this.player.vx=0;this.player.vy=0;for(const f of this.carry){f.x=600;f.y=610;}
  }
 }
}
