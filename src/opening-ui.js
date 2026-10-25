import {openingVideos} from './opening-videos.js';
const el=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text)n.textContent=text;return n;};
export class OpeningUI {
 constructor({show,close,measure,enabled=true}){
  this.show=show;this.onClose=close;this.measure=measure;this.enabled=enabled;this.active=false;
  this.root=el('section','overlay opening-screen');this.root.id='opening-screen';this.root.hidden=true;this.root.setAttribute('role','dialog');this.root.setAttribute('aria-modal','true');this.root.setAttribute('aria-label','Prologue');document.getElementById('game').append(this.root);
  this.root.addEventListener('keydown',e=>{
   if(e.code==='Escape'){e.preventDefault();e.stopPropagation();this.finish(true);}
   if(e.key==='Tab'){const controls=[...this.root.querySelectorAll('button:not(:disabled),video[tabindex]')],first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
  });
  this.visibility=()=>{this.root.classList.toggle('opening-paused',document.hidden||!document.hasFocus());if(document.hidden)this.video?.pause();};document.addEventListener('visibilitychange',this.visibility);window.addEventListener('blur',()=>{this.root.classList.add('opening-paused');this.video?.pause();});window.addEventListener('focus',this.visibility);
 }
 open(source='replay',opener=null){
  if(!this.enabled||this.active)return;this.source=source;this.opener=opener;this.index=0;this.active=true;this.measure?.('story_open',{source});this.renderVideo();this.show();this.visibility();this.video.focus();
 }
 disposeVideo(){if(!this.video)return;const video=this.video;this.video=null;video.onended=video.onerror=video.onplay=video.onpause=video.onclick=video.onkeydown=null;video.pause();video.removeAttribute('src');video.load();}
 renderVideo(reusableVideo=null){
  this.root.replaceChildren();this.root.dataset.scene='movie';this.root.removeAttribute('aria-labelledby');this.root.setAttribute('aria-label','Prologue');
  const video=reusableVideo||el('video','opening-video');this.video=video;video.playsInline=true;video.setAttribute('playsinline','');video.muted=false;video.defaultMuted=false;video.volume=1;video.controls=false;video.preload='metadata';video.src=openingVideos[this.index].src;video.tabIndex=0;video.setAttribute('aria-label','プロローグ動画。タップまたはEnterで音声つき再生');
  const status=el('p','opening-video-status');status.setAttribute('role','status');status.hidden=true;
  const play=()=>{if(video.error)video.load();video.muted=false;video.volume=1;this.playVideo(video,status);};
  video.onclick=play;video.onkeydown=e=>{if(['Space','Enter'].includes(e.code)){e.preventDefault();e.stopPropagation();play();}};
  const skip=el('button','opening-video-skip','SKIP');skip.id='opening-skip';skip.type='button';skip.setAttribute('aria-label','プロローグをスキップ');skip.onclick=()=>this.finish(true);this.nextButton=skip;
  video.onplay=()=>{status.hidden=true;};
  video.onended=()=>{if(this.active&&this.video===video)this.next();};
  video.onerror=()=>{if(this.video===video){status.hidden=false;status.textContent='読み込めませんでした。画面をタップして再試行、またはSKIP';}};
  this.root.append(video,status,skip);this.playVideo(video,status);
 }
 playVideo(video,status){video.play()?.catch(()=>{if(this.active&&this.video===video&&!video.error){status.hidden=false;status.textContent='画面をタップして音声つきで再生';}});}
 next(){if(!this.active)return;if(this.index===openingVideos.length-1){this.finish(false);return;}this.index++;this.disposeVideo();this.renderVideo();this.video.focus();}
 finish(skipped){if(!this.active)return;this.active=false;this.disposeVideo();this.measure?.(skipped?'story_skip':'story_complete',{source:this.source});this.root.hidden=true;this.onClose(this.source);this.opener?.focus();}
}
