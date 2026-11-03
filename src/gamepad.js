// Standard browser mapping: Xbox A/B/X, shoulders and Menu.
export class PadInput {
 constructor(){this.id=null;this.previous=[];this.context=null;this.repeatAt=0;this.move=0;}
 poll(pads,context,now){
  const pad=Array.from(pads||[]).find(p=>p?.connected!==false&&p?.mapping==='standard');
  const id=pad?`${pad.index}:${pad.id}`:null,changed=id!==this.id,disconnected=this.id!==null&&changed;
  const buttons=pad?Array.from(pad.buttons,b=>!!b.pressed):[];
  const fresh=changed||context!==this.context;
  const edges=buttons.map((b,i)=>b&&!this.previous[i]&&!fresh);
  this.id=id;this.previous=buttons;this.context=context;
  let axis=pad?.axes[0]||0;
  axis=Math.abs(axis)<.22?0:Math.sign(axis)*Math.min(1,(Math.abs(axis)-.22)/.78);
  if(buttons[14]||buttons[15])axis=Number(buttons[15])-Number(buttons[14]);
  const direction=buttons[12]?-1:buttons[13]?1:axis<-.5?-1:axis>.5?1:(pad?.axes[1]||0)<-.5?-1:(pad?.axes[1]||0)>.5?1:0;
  let navigate=0;
  if(fresh){this.move=direction;this.repeatAt=now+400;}
  else if(direction&&(direction!==this.move||now>=this.repeatAt)){navigate=direction;this.repeatAt=now+(direction!==this.move?400:150);}
  this.move=direction;
  return {connected:!!pad,disconnected,axis,edges,navigate};
 }
}

const visible=node=>!!node&&!node.closest('[hidden],[inert]')&&node.getClientRects().length>0&&getComputedStyle(node).visibility!=='hidden';
export class BrowserController {
 constructor(actions){
  this.actions=actions;this.input=new PadInput();this.selected=0;
  this.hint=document.createElement('div');this.hint.className='controller-hint';this.hint.hidden=true;document.getElementById('game').append(this.hint);
 }
 scope(state){
  const nativeDialogs=[...document.querySelectorAll('dialog[open]')].filter(visible);
  if(nativeDialogs.length)return nativeDialogs.at(-1);
  const dialogs=[...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].filter(visible);
  if(dialogs.length)return dialogs.at(-1);
  if(state.trainingDone)return document.getElementById('practice-guide');
  return document.getElementById(state.screen);
 }
 controls(scope){return scope?[...scope.querySelectorAll('button,a[href],input,select,textarea')].filter(n=>visible(n)&&!n.disabled):[];}
 focus(node){document.querySelectorAll('.controller-focus').forEach(n=>n.classList.remove('controller-focus'));if(node){node.classList.add('controller-focus');node.focus({preventScroll:true});node.scrollIntoView({block:'nearest',inline:'nearest'});}}
 back(scope,state){
  if(scope?.matches('dialog[open]')){if(scope.dispatchEvent(new Event('cancel',{cancelable:true})))scope.close();return;}
  const selectors=['.return-close','.room-focus-back','.room-decor-done','.result-social-back','.mode-rules-close','#opening-skip','.community-back','#close-records','#resume','#home','#tutorial-title'];
  for(const selector of selectors){const button=scope?.querySelector(selector);if(visible(button)&&!button.disabled){button.click();return;}}
  if(state.screen==='playing')this.actions.pause();
 }
 update(now){
  const state=this.actions.state(),scope=this.scope(state);
  const playing=state.screen==='playing'&&!state.trainingDone&&!scope;
  let pads=[];try{pads=navigator.getGamepads?.()||[];}catch{}
  const active=state.active&&!document.hidden&&document.hasFocus();
  const context=active?(scope||state.screen):'inactive';
  const input=this.input.poll(pads,context,now);
  document.documentElement.classList.toggle('controller-connected',input.connected);
  this.hint.hidden=!input.connected||!state.active;
  const hint=playing?'← → 移動　A 飛ぶ　LB/RB 技選択　X 発動　Menu 一時停止':'十字キー 選択　A 決定　B もどる';
  if(this.hint.textContent!==hint)this.hint.textContent=hint;
  this.actions.direction(active&&playing?input.axis:0);
  if(input.disconnected){this.actions.disconnected();document.querySelectorAll('.controller-focus').forEach(n=>n.classList.remove('controller-focus'));return;}
  if(!active||!input.connected)return;
  const buttons=[...document.querySelectorAll('#skill-bar button')];
  if(playing){
   if(input.edges[4])this.selected=(this.selected+3)%4;
   if(input.edges[5])this.selected=(this.selected+1)%4;
   buttons.forEach((b,i)=>b.classList.toggle('controller-selected',i===this.selected));
   if(input.edges[9]||input.edges[1]){this.actions.pause();return;}
   if(input.edges[0])this.actions.flap();
   if(input.edges[2])buttons[this.selected]?.click();
  }else{
   const controls=this.controls(scope);
   let target=controls.includes(document.activeElement)?document.activeElement:controls.find(n=>n.matches('#start,#retry,#resume,#tutorial-start,.result-social-back'))||controls[0];
   if(input.navigate&&controls.length)target=controls[(controls.indexOf(target)+input.navigate+controls.length)%controls.length];
   if(target&&!target.classList.contains('controller-focus'))this.focus(target);
   if(input.edges[1]){this.back(scope,state);return;}
   if(input.edges[9]&&state.screen==='pause-screen'){this.actions.pause();return;}
   if(input.edges[0]){if(target?.matches('input,select,textarea'))target.focus();else target?.click();}
  }
 }
}
