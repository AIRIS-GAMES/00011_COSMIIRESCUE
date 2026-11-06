// Presentation-only flags. QA can compare ?opening=off&reactions=off&goal=off (goal = start-of-run goal slide).
export const presentationDefaults=Object.freeze({opening:true,reactions:true,goal:true});
export function presentationFlags(search=globalThis.location?.search||''){
 const query=new URLSearchParams(search);
 return Object.fromEntries(Object.entries(presentationDefaults).map(([key,value])=>[key,query.get(key)==='off'?false:query.get(key)==='on'?true:value]));
}
