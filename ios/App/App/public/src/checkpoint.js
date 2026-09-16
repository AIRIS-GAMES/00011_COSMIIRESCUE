// A depth gate: its central flight corridor passes through the opening;
// the upper/lower oval rim is solid and never costs rescued friends.
export function checkpointRimContact(player,home){
  const x=player.x-home.x,y=player.y-home.y,r=player.r;
  if(Math.abs(y)<=64)return false;
  const outer=(x/(140+r))**2+(y/(154+r))**2;
  const inner=(x/Math.max(1,76-r))**2+(y/Math.max(1,93-r))**2;
  return outer<=1&&inner>=1;
}
export function attachedSlot(index){const angle=-Math.PI/2+(index%14)*Math.PI*2/14;return {x:Math.cos(angle)*(110+Math.floor(index/14)*8),y:Math.sin(angle)*(125+Math.floor(index/14)*8)};}
