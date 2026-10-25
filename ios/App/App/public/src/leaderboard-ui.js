import {Leaderboard,newRunId,playerName} from './leaderboard.js';
import {leaderboardConfig} from './leaderboard-config.js';
const $=id=>document.getElementById(id);
export class LeaderboardUI {
  constructor(){
    this.api=new Leaderboard(leaderboardConfig);this.view=0;
    const records=document.querySelector('#records-screen .panel');
    records.querySelector('.eyebrow').textContent='COSMII RECORDS';
    records.querySelector('h2').textContent='RANKING';
    records.querySelector('p').id='records-caption';
    this.tabs=document.createElement('div');this.tabs.className='ranking-tabs';
    this.tabs.innerHTML='<button type="button" id="ranking-online">EVENT TOP 20</button><button type="button" id="ranking-local">MY TOP 5</button>';
    records.querySelector('h2').after(this.tabs);
    this.status=document.createElement('p');this.status.id='ranking-status';this.status.setAttribute('role','status');
    $('record-list').before(this.status);
    this.refresh=document.createElement('button');this.refresh.type='button';this.refresh.className='text-button';this.refresh.textContent='再読み込み';
    const footer=document.createElement('div');footer.className='ranking-footer';
    $('record-list').after(footer);footer.append(this.refresh,$('close-records'));this.refresh.onclick=()=>this.openOnline();
    $('ranking-online').onclick=()=>this.openOnline();$('ranking-local').onclick=()=>this.openLocal();
    this.form=document.createElement('form');this.form.className='ranking-entry';this.form.hidden=true;
    this.form.innerHTML='<label for="ranking-name">イベントランキングに登録</label><div class="ranking-entry-row"><input id="ranking-name" name="nickname" type="text" maxlength="24" placeholder="ニックネーム（12文字まで）" autocomplete="off" required aria-label="公開するニックネーム"><button type="submit">登録</button></div><small>名前とスコアが公開されます · NORMAL</small><p role="status" class="ranking-entry-status"></p>';
    $('unbanked').after(this.form);
    this.name=$('ranking-name');this.submit=this.form.querySelector('button');this.message=this.form.querySelector('[role="status"]');
    // The game can be CSS-rotated; native keyboards always follow the browser.
    // Edit outside .arcade so the field and keyboard share the same orientation.
    this.name.readOnly=true;this.name.setAttribute('aria-haspopup','dialog');
    this.editor=document.createElement('dialog');this.editor.className='ranking-name-dialog';this.editor.setAttribute('aria-labelledby','ranking-editor-title');
    this.editor.innerHTML='<form class="ranking-name-card"><h2 id="ranking-editor-title">ニックネームを入力</h2><p>12文字まで · 名前とスコアが公開されます</p><input id="ranking-editor-input" type="text" maxlength="24" autocomplete="off" enterkeyhint="done" aria-label="ニックネーム" autofocus><p class="ranking-name-error" role="status"></p><div><button type="button" class="ranking-name-cancel">キャンセル</button><button type="submit">決定</button></div></form>';
    document.body.append(this.editor);this.editorInput=$('ranking-editor-input');
    const fitEditor=()=>{
      if(!this.editor.open)return;
      const viewport=window.visualViewport;
      Object.assign(this.editor.style,{left:`${viewport?.offsetLeft||0}px`,top:`${viewport?.offsetTop||0}px`,width:`${viewport?.width||innerWidth}px`,height:`${viewport?.height||innerHeight}px`});
    };
    window.visualViewport?.addEventListener('resize',fitEditor);window.visualViewport?.addEventListener('scroll',fitEditor);window.addEventListener('resize',fitEditor);
    this.openEditor=()=>{
      if(this.name.disabled||this.form.hidden||this.editor.open)return;
      this.editorInput.value=this.name.value;this.editor.querySelector('[role="status"]').textContent='';
      this.editor.showModal();fitEditor();this.editorInput.focus({preventScroll:true});
    };
    this.name.onclick=this.openEditor;
    this.name.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();this.openEditor();}});
    this.editor.querySelector('.ranking-name-cancel').onclick=()=>this.editor.close();
    this.editor.addEventListener('close',()=>{this.editorInput.blur();if(!this.form.hidden&&!this.name.disabled)this.name.focus({preventScroll:true});});
    this.editor.addEventListener('keydown',event=>event.stopPropagation());this.editor.addEventListener('keyup',event=>event.stopPropagation());
    this.editor.querySelector('form').onsubmit=event=>{
      event.preventDefault();
      try{this.name.value=playerName(this.editorInput.value);this.message.textContent='';this.editor.close();}
      catch(error){this.editor.querySelector('[role="status"]').textContent=error.message;this.editorInput.focus();}
    };
    this.form.onsubmit=event=>{event.preventDefault();this.register();};
    this.form.addEventListener('keydown',event=>event.stopPropagation());
    this.form.addEventListener('keyup',event=>event.stopPropagation());
    $('records').textContent='RANKING ↗';
  }
  beginRun(){this.run=null;this.form.hidden=true;this.name.value='';}
  result(game){
    if(game.psfRules&&game.mode==='normal'){this.run=null;this.form.hidden=true;return;}
    this.run={id:newRunId(),mode:game.mode,score:Math.floor(game.score),rescued:game.rescued,seconds:game.time};
    this.form.hidden=!this.api.configured||game.mode!=='normal';
    this.name.disabled=false;this.submit.disabled=false;this.submit.textContent='登録';this.message.textContent='';
  }
  async register(){
    if(!this.run||this.submit.disabled)return;
    let name;try{name=playerName(this.name.value);}catch(error){this.message.textContent=error.message;this.openEditor();return;}
    const run=this.run;this.submit.disabled=true;this.name.disabled=true;this.message.textContent='登録中…';
    try{
      const result=await this.api.submit(run,name);
      if(this.run!==run)return;
      this.message.textContent=`登録しました！ 現在 ${result.rank} 位`;this.submit.textContent='登録済み';
    }catch(error){
      if(this.run!==run)return;
      // The server may have accepted a timed-out request. Retry the same name/run.
      this.message.textContent=error.message;this.submit.disabled=false;this.submit.textContent='再試行';
    }
  }
  open(storage){this.storage=storage;if(this.api.configured&&storage.key!=='cosmii-endless-psf-v1')this.openOnline();else this.openLocal();}
  select(online){
    $('ranking-online').setAttribute('aria-pressed',String(online));$('ranking-local').setAttribute('aria-pressed',String(!online));
    $('record-list').replaceChildren();this.status.textContent='';this.refresh.hidden=!online||!this.api.configured;
    $('records-caption').textContent=online?'NORMAL · EVENT TOP 20':`${this.storage.key.endsWith('-hard')?'HARD':this.storage.key==='cosmii-endless-psf-v1'?'NORMAL PSF v1':'NORMAL'} · MY TOP 5`;
  }
  row(rank,name,score,detail=''){
    const li=document.createElement('li'),position=document.createElement('b'),label=document.createElement('span'),points=document.createElement('strong');
    position.textContent=String(rank).padStart(2,'0');label.textContent=name;points.textContent=Number(score).toLocaleString();
    label.title=detail;li.append(position,label,points);$('record-list').append(li);
  }
  openLocal(){
    this.view++;this.select(false);
    this.storage.data.runs.forEach((run,i)=>this.row(i+1,`${run.rescued} RESCUED`,run.score));
    if(!this.storage.data.runs.length)this.status.textContent='まだ記録がありません。';
  }
  async openOnline(){
    const view=++this.view;this.select(true);this.status.textContent='読み込み中…';
    try{
      const rows=await this.api.top();if(this.view!==view)return;
      this.status.textContent=rows.length?'':'最初の記録を登録しよう！';
      rows.forEach(row=>this.row(row.rank,row.player_name,row.score,`${row.rescued} RESCUED`));
    }catch(error){if(this.view===view)this.status.textContent=error.message;}
  }
}
