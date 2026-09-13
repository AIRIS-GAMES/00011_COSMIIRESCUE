import {hazardArt} from './hazards.js';
// Compact free-flight room. Geometry is independent of every scenery pixel.
export const stage={
  id:'cosmii-arcade',width:1320,height:1000,
  home:{x:205,y:790,radius:59},
  art:{...hazardArt,base:'./Asset/stage/pop-background.png',home:'./Asset/stage/checkpoint-cosmii.png',shelf:'./Asset/stage/pop-shelf.svg',bumper:'./Asset/stage/pop-bumper.svg'},
  // Center-bottom sprite anchors. The HOME cabinet is an open trigger, not a wall.
  props:[
  ],
  obstacles:[
    {id:'shelf-a',asset:'shelf',x:225,y:310,w:210,h:29},
    {id:'shelf-b',asset:'shelf',x:395,y:493,w:144,h:23},
    {id:'shelf-c',asset:'shelf',x:580,y:585,w:205,h:30},
    {id:'shelf-d',asset:'shelf',x:900,y:445,w:172,h:27},
    {id:'shelf-e',asset:'shelf',x:900,y:695,w:192,h:28},
    {id:'shelf-f',asset:'shelf',x:630,y:203,w:142,h:23},
    {id:'bumper-a',asset:'bumper',x:910,y:295,r:32,motion:{x:72,y:0,speed:1.25},phase:0},
    {id:'bumper-b',asset:'bumper',x:1130,y:375,r:29,motion:{x:0,y:80,speed:1.55},phase:1},
    {id:'bumper-c',asset:'bumper',x:745,y:775,r:29,motion:{x:55,y:0,speed:1.4},phase:2},
  ],
  spawns:[
    {id:'p01',x:345,y:755,kind:0},{id:'p02',x:440,y:685,kind:1},
    {id:'p03',x:345,y:576,kind:2},{id:'p04',x:263,y:436,kind:3},
    {id:'p05',x:460,y:394,kind:0},{id:'p06',x:593,y:467,kind:1},
    {id:'p07',x:718,y:347,kind:2},{id:'p08',x:821,y:468,kind:3},
    {id:'p09',x:549,y:831,kind:0},{id:'p10',x:642,y:734,kind:2},
    {id:'p11',x:838,y:859,kind:1},{id:'p12',x:984,y:811,kind:3},
    {id:'p13',x:1181,y:627,kind:0},{id:'p14',x:1079,y:532,kind:1},
    {id:'p15',x:481,y:247,kind:2},{id:'p16',x:767,y:141,kind:3},
    {id:'r01',x:965,y:206,kind:3,rare:true,after:45},
    {id:'r02',x:1195,y:258,kind:2,rare:true,after:60},
    {id:'r03',x:995,y:626,kind:1,rare:true,after:45},
    {id:'r04',x:1190,y:748,kind:0,rare:true,after:60},
  ],
  zones:[{id:'express',label:'SPEED LANE',x:570,y:82,w:575,h:110,after:60}],
};
