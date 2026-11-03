// Count every arrival; only retain the visible surface of an overlapping pile.
export const RAIN_SECONDS=1.4;
const SPAWN=.72,FALL=.68;
export function returnCounts(total,counts){
 const n=Math.max(0,Math.floor(Number(total)||0));
 const values=Array.from({length:4},(_,i)=>Math.max(0,Math.floor(Number(counts?.[i])||0)));
 const sum=values.reduce((a,b)=>a+b,0);
 if(sum===n)return values;
 if(!sum)return [n,0,0,0];
 return allocate(values,n,true);
}
function allocate(counts,limit,rescale=false){
 const sum=counts.reduce((a,b)=>a+b,0);if(sum<=limit&&!rescale)return [...counts];
 const exact=counts.map(n=>n/sum*limit),out=exact.map(Math.floor);
 const order=[0,1,2,3].sort((a,b)=>(exact[b]-out[b])-(exact[a]-out[a]));
 for(let i=0,rest=limit-out.reduce((a,b)=>a+b,0);i<rest;i++)out[order[i]]++;
 return out;
}
function sample(counts,starts,limit){
 const slots=allocate(counts,limit),items=[];
 for(let j=0;j<Math.max(...slots);j++)for(let color=0;color<4;color++)if(j<slots[color]){
  items.push({color,index:starts[color]+counts[color]-slots[color]+j});
 }
 return items;
}
export function rainFrame(counts,seconds){
 const progress=t=>Math.max(0,Math.min(1,t/SPAWN));
 const emitted=counts.map(n=>Math.floor(n*progress(seconds)));
 const landed=counts.map(n=>Math.floor(n*progress(seconds-FALL)));
 const total=counts.reduce((a,b)=>a+b,0);let births;
 if(total<=108){
  const order=counts.flatMap((n,color)=>Array.from({length:n},(_,index)=>({color,index,time:(index+1)/n}))).sort((a,b)=>a.time-b.time||a.color-b.color);
  births=new Map();emitted.fill(0);landed.fill(0);
  order.forEach((item,i)=>{const birth=(i+1)/total*SPAWN;births.set(item.color+':'+item.index,birth);if(seconds>=birth)emitted[item.color]++;if(seconds>=birth+FALL)landed[item.color]++;});
 }
 if(seconds>=RAIN_SECONDS)for(let i=0;i<4;i++)emitted[i]=landed[i]=counts[i];
 const flying=emitted.map((n,i)=>n-landed[i]);
 return {emitted,landed,
  pile:sample(landed,[0,0,0,0],108),
  falling:sample(flying,landed,72).map(item=>({...item,progress:Math.max(0,Math.min(1,(seconds-(births?.get(item.color+':'+item.index)??(item.index+1)/counts[item.color]*SPAWN))/FALL))})),
  done:seconds>=RAIN_SECONDS};
}
