import {mkdir,writeFile} from 'node:fs/promises';
import {stage} from '../src/stage.js';
await mkdir('data',{recursive:true});
const write=(name,data)=>writeFile(`data/${name}.json`,JSON.stringify(data,null,2)+'\n');
await Promise.all([
  write('arcade-objects',{mapSize:{width:stage.width,height:stage.height},props:stage.props.map(p=>({...p,image:stage.art[p.asset],anchor:'center-bottom',repeat:false})),obstacles:stage.obstacles}),
  write('arcade-collision',{bounds:{x:0,y:0,w:stage.width,h:stage.height},blockers:stage.obstacles,homeTrigger:stage.home}),
  write('arcade-scene-hooks',{spawn:{x:stage.home.x,y:stage.home.y-15},friendSpawns:stage.spawns,zones:stage.zones}),
]);
console.log('Map objects, collision and scene hooks exported to data/');
