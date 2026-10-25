// One visible notice; return reactions take priority over incidental pickups.
export class GameNotices {
 constructor(root){this.root=root;this.reset();}
 reset(){this.current=null;this.queue=[];this.root.hidden=true;this.root.replaceChildren();}
 push(text,{duration=2.5,priority=10,portrait=null,kind=null}={}){
  const notice={text,duration,priority,portrait,kind};
  if(!this.current||priority>=this.current.priority){if(priority>=90)this.queue=[];this.display(notice);}
  else if(this.queue.length<2)this.queue.push(notice);
 }
 display(notice){this.current=notice;this.root.replaceChildren();this.root.classList.toggle('return-notice',!!notice.kind);this.root.dataset.kind=notice.kind||'';
  if(notice.portrait){const img=document.createElement('img');img.src=notice.portrait;img.alt='';this.root.append(img);}
  const span=document.createElement('span');span.textContent=notice.text;this.root.append(span);this.root.hidden=false;
 }
 update(dt,visible){if(visible&&this.current){this.current.duration-=dt;if(this.current.duration<=0){this.current=null;if(this.queue.length)this.display(this.queue.shift());}}
  this.root.hidden=!visible||!this.current;
 }
}
