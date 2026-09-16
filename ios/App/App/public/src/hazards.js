export const hazardTypes={
 cloud:{effect:'fog',duration:1.4},bubble:{effect:'slow',duration:2.2},flyer:{effect:'paper',duration:1.7},drink:{effect:'slip',duration:2.5},banana:{effect:'slip',duration:1.8},
 apple:{damage:1},cherry:{damage:1},cake:{damage:1},pancakes:{damage:1},crate:{damage:1},ufo:{damage:1},blocks:{damage:1},
 fork:{damage:2,directed:true},knife:{damage:2,directed:true},lightning:{damage:3},ironball:{damage:3},spikeball:{damage:3},rocket:{damage:3,directed:true},
};
export const hazardArt=Object.fromEntries(Object.keys(hazardTypes).map(id=>[id,`./Asset/objects/${id}.png`]));
export function sectionHazards(col,row,danger){
 const soft=['cloud','bubble','flyer','drink','banana'],normal=['apple','cherry','cake','pancakes','crate','ufo','blocks',],heavy=['fork','lightning','ironball','spikeball','rocket','knife'];
 const points=[[300,240],[500,390],[740,220],[980,420],[1150,650],[390,620],[610,800],[840,660],[1030,170],[690,490]];
 const offset=col+row*3;
 const list=points.map(([x,y],i)=>{const id=i%3===0?soft[(i+offset)%soft.length]:normal[(i+offset)%normal.length];return {id:`obj-${i}`,asset:id,x,y,r:48,size:144,...hazardTypes[id]};});
 if(danger)for(let i=0;i<4;i++){const id=heavy[(offset+i)%heavy.length];list.push({id:`danger-${i}`,asset:id,x:[140,700,1130,890][i],y:[450,70,850,940][i],r:57,size:176,...hazardTypes[id]});}
 return list;
}
