// The same section identity controls scenery, hazards and rewards.
export const biomes=[
  {id:'sky',label:'SKY',top:'#49dbe5',bottom:'#b5f4d8',accent:'#fff8ba'},
  {id:'sunset',label:'BONUS',top:'#fa879d',bottom:'#ffd28d',accent:'#fff4ca'},
  {id:'neon',label:'DANGER',top:'#241638',bottom:'#493169',accent:'#ff89ca'},
  {id:'space',label:'SPACE',top:'#102f50',bottom:'#286e85',accent:'#9effdf'},
];
export const biomeAt=(col,row)=>biomes[((col+row*2)%biomes.length+biomes.length)%biomes.length];

export function drawBiome(r,theme){
  const c=r.ctx,w=r.width,h=r.height,t=r.reduced?0:r.clock;
  const gradient=c.createLinearGradient(0,0,0,h);gradient.addColorStop(0,theme.top);gradient.addColorStop(1,theme.bottom);c.fillStyle=gradient;c.fillRect(0,0,w,h);
  const wrap=(v,size)=>((v%size)+size)%size;
  if(theme.id==='sky'){
    c.save();c.globalAlpha=.55;const img=r.assets.base,bw=h*img.width/img.height;
    const x=-wrap(r.camera.x*.2,bw),y=-wrap(r.camera.y*.12,h);
    for(let i=0;i<Math.ceil(w/bw)+1;i++)for(let j=0;j<2;j++)c.drawImage(img,x+i*bw,y+j*h,bw,h);c.restore();
  }else if(theme.id==='sunset'){
    r.circle(w*.73-r.camera.x*.018%90,h*.4,85,'#fff0b080');
    for(let i=0;i<7;i++){const x=wrap(i*193-r.camera.x*.13,w+260)-130,y=wrap(i*101-r.camera.y*.12,h+140)-70;c.save();c.globalAlpha=.25;r.circle(x,y,65,'#fff9cd');r.circle(x+57,y+12,46,'#fff9cd');c.restore();}
  }else if(theme.id==='neon'){
    c.save();c.strokeStyle=theme.accent;c.lineWidth=3;c.globalAlpha=.18;
    for(let i=0;i<9;i++){const x=wrap(i*173-r.camera.x*.18,w+180)-90,y=wrap(i*109-r.camera.y*.15,h+200)-100;c.save();c.translate(x,y);c.rotate(-.3);c.strokeRect(-45,-60,90,120);c.restore();}
    c.restore();
  }else{
    c.save();c.globalAlpha=.15;r.circle(w*.76,h*.33,120,'#82a7ff');c.strokeStyle='#b3c9ff';c.lineWidth=12;c.beginPath();c.ellipse(w*.76,h*.33,180,40,-.35,0,Math.PI*2);c.stroke();c.restore();
  }
  for(let i=0;i<32;i++){const x=wrap(i*137.7-r.camera.x*.24,w),y=wrap(i*83.3-r.camera.y*.2,h);c.save();c.globalAlpha=.25+.3*(.5+.5*Math.sin(t*1.3+i));r.star(x,y,theme.id==='neon'?2:3+i%3,theme.accent,t*.05);c.restore();}
}
