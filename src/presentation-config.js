// Presentation-only flags. QA can compare ?opening=off&reactions=off.
export const presentationDefaults=Object.freeze({opening:true,reactions:true});
export function presentationFlags(search=globalThis.location?.search||''){
 const query=new URLSearchParams(search);
 return Object.fromEntries(Object.entries(presentationDefaults).map(([key,value])=>[key,query.get(key)==='off'?false:query.get(key)==='on'?true:value]));
}
