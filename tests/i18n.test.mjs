import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {EN} from '../src/i18n-en.js';
import {t,useLang} from '../src/i18n.js';

const jp=/[぀-ヿ㐀-鿿！-｠]/;
const unescape=body=>body.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|.)/g,(m,e)=>e[0]==='u'?String.fromCodePoint(parseInt(e.replace(/[u{}]/g,''),16)):e[0]==='x'?String.fromCharCode(parseInt(e.slice(1),16)):e==='n'?'\n':e==='t'?'\t':e);
function codeKeys(){
 const keys=new Map();
 for(const file of readdirSync(new URL('../src/',import.meta.url)).filter(f=>f.endsWith('.js'))){
  const src=readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
  for(const m of src.matchAll(/(?<![\w$.])_t\((?:'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)")/g))keys.set(unescape(m[1]??m[2]),file);
 }
 return keys;
}
const placeholders=s=>[...s.matchAll(/\{(\w+)\}/g)].map(m=>m[1]).sort().join();

test('every translated string in the code has an English entry with the same placeholders',()=>{
 const missing=[],bad=[];
 for(const [key,file] of codeKeys()){if(!(key in EN))missing.push(`${file}: ${key}`);else if(placeholders(key)!==placeholders(EN[key]))bad.push(key);}
 assert.deepEqual(missing,[]);assert.deepEqual(bad,[]);
});

test('Japanese text in index.html has English entries',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8').replace(/<(script|style|title)[\s\S]*?<\/\1>/g,'');
 const keys=new Set();
 for(const m of html.matchAll(/>([^<>]+)</g)){const k=m[1].trim();if(k&&jp.test(k))keys.add(k);}
 for(const m of html.matchAll(/\s(?:aria-label|title|alt|placeholder)="([^"]*)"/g))if(jp.test(m[1]))keys.add(m[1]);
 assert.deepEqual([...keys].filter(k=>!(k in EN)),[]);
});

test('English entries contain no Japanese text, except the language picker',()=>{
 assert.deepEqual(Object.entries(EN).filter(([k,v])=>jp.test(v)&&!k.includes('Language')).map(([k])=>k),[]);
});

test('t() fills placeholders and falls back to Japanese',()=>{
 useLang('en');
 assert.equal(t('{0}をもらった！ふれあいの部屋であげられるよ',['Apple']),'Got: Apple! Give it to a friend in the Room.');
 assert.equal(t('未登録の文字列'),'未登録の文字列');
 useLang('ja');
 assert.equal(t('{0}秒',[3]),'3秒');
});
