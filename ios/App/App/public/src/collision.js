// Find the nearest point on the same expanded, rotated ellipse used by overlap().
export function pushOutEllipse(player,object){
  const c=Math.cos(object.angle||0),s=Math.sin(object.angle||0),dx=player.x-object.x,dy=player.y-object.y;
  const x=dx*c+dy*s,y=-dx*s+dy*c,a=object.r+player.r+1,b=object.ry+player.r+1;
  const distance=t=>(a*Math.cos(t)-x)**2+(b*Math.sin(t)-y)**2;
  const step=Math.PI/16;let best=0;
  for(let i=1;i<32;i++)if(distance(i*step)<distance(best))best=i*step;
  let lo=best-step,hi=best+step;
  for(let i=0;i<24;i++){const l=lo+(hi-lo)/3,r=hi-(hi-lo)/3;if(distance(l)<distance(r))hi=r;else lo=l;}
  const t=(lo+hi)/2,px=a*Math.cos(t),py=b*Math.sin(t);
  player.x=object.x+px*c-py*s;player.y=object.y+px*s+py*c;
}
