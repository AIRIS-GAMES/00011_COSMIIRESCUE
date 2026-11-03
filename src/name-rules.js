// Immediate feedback before local-only saving. SQL remains authoritative for public names.
const terms=['死ね','しね','殺す','ころす','自殺しろ','消えろ','きえろ','fuck','shit','bitch','nigger','faggot','ちんこ','ちんぽ','まんこ','せっくす','レイプ','強姦','児童ポルノ','運営公式','公式運営'];
export function normalizeName(value){return value.normalize('NFKC').toLowerCase().replace(/[ァ-ヴ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60)).replace(/[^\p{L}\p{N}]/gu,'');}
const normalizedTerms=terms.map(normalizeName);
export function checkNameRules(value){if(normalizedTerms.some(term=>normalizeName(value).includes(term)))throw Error('この名前は使用できません。別の名前に変更してください。');}
