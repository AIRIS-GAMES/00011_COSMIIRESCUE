import {Leaderboard,newRunId,playerName} from './leaderboard.js';
import {leaderboardConfig} from './leaderboard-config.js';
import {AutoRanking} from './auto-ranking.js';
import {RankingSafetyUI} from './ranking-safety-ui.js';
const $=id=>document.getElementById(id);
export class LeaderboardUI {
  constructor(options={}){
    this.options=options;
    this.api=new Leaderboard(leaderboardConfig);this.auto=new AutoRanking(this.api);this.view=0;
    const records=document.querySelector('#records-screen .panel');
    records.querySelector('.eyebrow').textContent='COSMII RECORDS';
    records.querySelector('h2').textContent='RANKING';
    records.querySelector('p').id='records-caption';
    this.tabs=document.createElement('div');this.tabs.className='ranking-tabs';
    this.tabs.innerHTML='<button type="button" id="ranking-online">救出 TOP 20</button><button type="button" id="ranking-local">自分の TOP 5</button>';
    records.querySelector('h2').after(this.tabs);
    this.status=document.createElement('p');this.status.id='ranking-status';this.status.setAttribute('role','status');
    $('record-list').before(this.status);
    this.refresh=document.createElement('button');this.refresh.type='button';this.refresh.className='text-button';this.refresh.textContent='再読み込み';
    const footer=document.createElement('div');footer.className='ranking-footer';
    $('record-list').after(footer);footer.append(this.refresh,$('close-records'));this.refresh.onclick=()=>this.openOnline();
    $('ranking-online').onclick=()=>this.openOnline();$('ranking-local').onclick=()=>this.openLocal();
    this.form=document.createElement('form');this.form.className='ranking-entry';this.form.hidden=true;
    this.form.innerHTML='<input id="ranking-name" type="hidden"><button type="submit">ランキングに参加</button><p role="status" class="ranking-entry-status"></p>';
    $('unbanked').after(this.form);
    this.name=$('ranking-name');this.submit=this.form.querySelector('button');this.message=this.form.querySelector('[role="status"]');
    // Native keyboards follow the device viewport, not the CSS-rotated game.
    // Fit inside the visual viewport to leave room for the native keyboard.
    this.name.readOnly=true;this.name.setAttribute('aria-haspopup','dialog');
    this.editor=document.createElement('dialog');this.editor.className='ranking-name-dialog';this.editor.setAttribute('aria-labelledby','ranking-editor-title');
    this.editor.innerHTML='<form class="ranking-name-card"><h2 id="ranking-editor-title">ランキングに参加</h2><p>名前と自己ベストを公開します。次回から自動更新。</p><input id="ranking-editor-input" type="text" maxlength="24" placeholder="ニックネーム（12文字まで）" autocomplete="off" enterkeyhint="done" aria-label="ニックネーム" autofocus><p class="ranking-name-error" role="status"></p><div><button type="button" class="ranking-name-cancel">キャンセル</button><button type="submit">参加する</button></div></form>';
    document.body.append(this.editor);this.editorInput=$('ranking-editor-input');
    this.bgmRow=document.createElement('div');this.bgmRow.className='settings-bgm';this.bgmRow.hidden=true;
    this.bgmRow.innerHTML='<span>BGM</span><button type="button" id="settings-bgm-toggle" aria-pressed="true">ON</button>';
    this.editorInput.before(this.bgmRow);this.bgmButton=this.bgmRow.querySelector('button');
    this.safetyUI=new RankingSafetyUI(this);
    this.supportButton=document.createElement('button');this.supportButton.type='button';this.supportButton.className='settings-support';this.supportButton.textContent='ランキング・サポート';this.supportButton.hidden=true;this.bgmRow.after(this.supportButton);this.supportButton.onclick=()=>this.safetyUI.settings();
    const refreshBgm=()=>{const enabled=this.options.getBgm?.()!==false;this.bgmButton.textContent=enabled?'ON':'OFF';this.bgmButton.setAttribute('aria-pressed',String(enabled));};
    this.bgmButton.onclick=()=>{this.options.setBgm?.(!(this.options.getBgm?.()!==false));refreshBgm();};
    this.settingsButton=document.createElement('button');this.settingsButton.type='button';this.settingsButton.id='home-settings';this.settingsButton.textContent='⚙';this.settingsButton.setAttribute('aria-label','設定');
    this.settingsButton.textContent='';const settingsIcon=document.createElement('img');settingsIcon.src='./Asset/ui/menu/settings.png';settingsIcon.alt='';this.settingsButton.append(settingsIcon);
    $('title').append(this.settingsButton);this.settingsButton.onclick=()=>this.openEditor(true);
    const fitEditor=()=>{
      if(!this.editor.open)return;
      const viewport=window.visualViewport;
      const width=viewport?.width||innerWidth,height=viewport?.height||innerHeight;
      const rotated=this.settingsMode&&!this.editingName&&document.documentElement.classList.contains('landscape-auto');
      Object.assign(this.editor.style,{left:`${(viewport?.offsetLeft||0)+(rotated?width:0)}px`,top:`${viewport?.offsetTop||0}px`,width:`${rotated?height:width}px`,height:`${rotated?width:height}px`,transformOrigin:'0 0',transform:rotated?'rotate(90deg)':'none'});
      this.editor.dataset.compact=String((rotated?width:height)<230);
    };
    this.editorInput.addEventListener('focus',()=>{clearTimeout(this.nameBlurTimer);this.editingName=true;fitEditor();});
    this.editorInput.addEventListener('blur',()=>{this.nameBlurTimer=setTimeout(()=>{this.editingName=false;fitEditor();},150);});
    window.visualViewport?.addEventListener('resize',fitEditor);window.visualViewport?.addEventListener('scroll',fitEditor);window.addEventListener('resize',fitEditor);
    new MutationObserver(fitEditor).observe(document.documentElement,{attributes:true,attributeFilter:['class']});
    this.openEditor=(settingsMode=false)=>{
      if((!settingsMode&&(this.name.disabled||this.form.hidden))||this.editor.open)return;
      clearTimeout(this.nameBlurTimer);this.editingName=false;
      this.settingsMode=settingsMode;this.editor.classList.toggle('home-settings-dialog',settingsMode);this.bgmRow.hidden=!settingsMode;
      this.supportButton.hidden=!settingsMode;
      let saved={};try{saved=this.auto.read();}catch{}
      this.editorInput.value=saved.name||saved.nickname||this.name.value;this.editor.querySelector('[role="status"]').textContent=saved.deleting?'削除処理中です。「ランキング・サポート」から再試行してください。':saved.rejected||(settingsMode&&saved.pendingName?'名前は端末に保存済み。ランキングへ自動再送します。':'');
      $('ranking-editor-title').textContent=settingsMode?'設定':'ランキングに参加';
      this.editor.querySelector('.ranking-name-card>p').textContent=settingsMode?(saved.name?'名前を変更するとランキングにも反映されます。':'名前を保存できます。ランキング参加は結果画面から。'):'名前と自己ベストを公開します。次回から自動更新。';
      this.editor.querySelector('button[type="submit"]').textContent=settingsMode?'名前を保存':'参加する';
      this.editor.querySelector('.ranking-name-cancel').textContent=settingsMode?'とじる':'キャンセル';
      this.editorInput.autofocus=!settingsMode;refreshBgm();this.editor.showModal();fitEditor();(settingsMode?this.bgmButton:this.editorInput).focus({preventScroll:true});
    };
    this.name.onclick=()=>this.openEditor();
    this.name.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();this.openEditor();}});
    this.editor.querySelector('.ranking-name-cancel').onclick=()=>this.editor.close();
    this.editor.addEventListener('close',()=>{this.editorInput.blur();window.dispatchEvent(new Event('resize'));if(this.settingsMode)this.settingsButton.focus({preventScroll:true});else if(!this.form.hidden&&!this.submit.hidden)this.submit.focus({preventScroll:true});});
    this.editor.addEventListener('keydown',event=>event.stopPropagation());this.editor.addEventListener('keyup',event=>event.stopPropagation());
    this.editor.addEventListener('cancel',event=>{if(this.savingName)event.preventDefault();});
    this.editor.querySelector('form').onsubmit=async event=>{
      event.preventDefault();
      if(this.savingName)return;
      this.savingName=true;this.editor.querySelectorAll('button').forEach(button=>button.disabled=true);this.editorInput.readOnly=true;
      try{this.name.value=playerName(this.editorInput.value);if(this.settingsMode)this.auto.rename(this.name.value);else this.auto.join(this.name.value,this.run);this.editor.querySelector('[role="status"]').textContent='保存中…';await this.register(true);this.editor.close();}
      catch(error){this.editor.querySelector('[role="status"]').textContent=error.message;this.editorInput.focus();}
      finally{this.savingName=false;this.editorInput.readOnly=false;this.editor.querySelectorAll('button').forEach(button=>button.disabled=false);}
    };
    this.form.onsubmit=event=>{event.preventDefault();try{if(this.auto.read().name)this.register();else this.openEditor();}catch{this.message.textContent='端末に保存できません';}};
    this.form.addEventListener('keydown',event=>event.stopPropagation());
    this.form.addEventListener('keyup',event=>event.stopPropagation());
    $('records').textContent='RANKING ↗';
    window.addEventListener('online',()=>this.register());
    window.addEventListener('storage',event=>{if(event.key===this.auto.key)this.register();});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden)this.register();});
    // Resume previously consented, unsent bests after reopening the game.
    this.register();
  }
  beginRun(){this.run=null;this.form.hidden=true;}
  result(game){
    if(game.isTraining||game.mode!=='normal'){this.run=null;this.form.hidden=true;return;}
    this.run={id:newRunId(),mode:game.mode,score:game.rescued,rescued:game.rescued,seconds:game.time};
    this.form.hidden=!this.api.configured||game.mode!=='normal';
    this.name.disabled=false;this.submit.disabled=false;this.submit.hidden=false;this.submit.textContent='ランキングに参加';this.message.textContent='';
    try{if(this.auto.read().name){this.auto.offer(this.run);this.register();}}catch{this.message.textContent='端末に保存できません';}
  }
  async register(propagateError=false){
    clearTimeout(this.retryTimer);
    try{
      const data=this.auto.read();if(data.deleting){this.submit.hidden=true;this.message.textContent='データ削除中 · 設定から再試行';return;}if(!data.name){this.submit.hidden=false;this.submit.textContent='ランキングに参加';this.message.textContent='';return;}
      this.submit.hidden=true;this.message.textContent=data.pending||data.pendingName?'ランキング更新中…':'自己ベスト登録済み ✓';
      const result=await this.auto.flush();
      if(this.auto.read().deleting||this.auto.read().deleted)return;
      this.message.textContent=result?`自己ベスト ${result.score}匹 · ${result.rank}位`:'自己ベスト登録済み ✓';
    }catch(error){
      if(error.permanent){this.message.textContent=error.message;this.submit.hidden=true;if(propagateError)throw error;return;}
      this.message.textContent='未送信 · 後で自動再送';this.message.title=error.message;this.submit.hidden=false;this.submit.disabled=false;this.submit.textContent='再送';
      this.retryTimer=setTimeout(()=>{if(!document.hidden)this.register();},60000);
      if(propagateError)throw error;
    }
  }
  open(storage){this.storage=storage;if(this.api.configured&&!storage.key.endsWith('-hard'))this.openOnline();else this.openLocal();}
  select(online){
    $('ranking-online').setAttribute('aria-pressed',String(online));$('ranking-local').setAttribute('aria-pressed',String(!online));
    $('record-list').replaceChildren();this.status.textContent='';this.refresh.hidden=!online||!this.api.configured;
    $('records-caption').textContent=online?'NORMAL · 1人1枠の自己ベスト · 同数は同順位':`${this.storage.key.endsWith('-hard')?'HARD':'NORMAL'} · 自分の帰還数 · 同数は同順位`;
  }
  row(rank,name,score,detail='',entry=null){
    const li=document.createElement('li'),position=document.createElement('b'),label=document.createElement('span'),points=document.createElement('strong');
    position.textContent=String(rank).padStart(2,'0');label.textContent=name;points.textContent=Number(score).toLocaleString()+'体';
    label.title=detail;li.append(position,label,points);$('record-list').append(li);
    if(entry?.public_id){li.classList.add('ranking-row-actions');const button=document.createElement('button');button.type='button';button.textContent='…';button.className='ranking-row-menu';button.setAttribute('aria-label',`${name}のメニュー`);button.onclick=()=>this.safetyUI.row(entry);li.append(button);}
  }
  openLocal(){
    this.view++;this.select(false);
    let rank=0;this.storage.data.runs.forEach((run,i,runs)=>{if(!i||run.score!==runs[i-1].score)rank=i+1;this.row(rank,'自分の記録',run.score);});
    if(!this.storage.data.runs.length)this.status.textContent='まだ記録がありません。';
  }
  async openOnline(){
    const view=++this.view;this.select(true);this.status.textContent='読み込み中…';
    try{
      let hidden=[];try{hidden=this.safetyUI.safety.hidden().map(r=>r.id);}catch{}
      const rows=await this.api.top(hidden);if(this.view!==view)return;
      this.status.textContent=rows.length?'':'最初の記録を登録しよう！';
      rows.forEach(row=>this.row(row.rank,row.player_name,row.score,`${row.rescued} RESCUED`,row));
    }catch(error){if(this.view===view)this.status.textContent=error.message;}
  }
}
