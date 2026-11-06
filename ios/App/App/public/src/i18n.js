import {EN} from './i18n-en.js';
// UI language: Japanese is the source text; English comes from the dictionary in i18n-en.js.
// Chosen once per page load (device language by default, or the player's choice in Settings);
// switching saves the choice and reloads, so every screen and canvas label is rebuilt in one language.
export const LANG_KEY='cosmii-lang';
export const LANGS=Object.freeze(['ja','en']);
export function detectLang(){
 try{const saved=globalThis.localStorage?.getItem(LANG_KEY);if(LANGS.includes(saved))return saved;}catch{}
 // Outside a browser page (tests, tools) stay on the Japanese source text.
 const nav=globalThis.navigator;if(!nav||!globalThis.document)return 'ja';
 const first=String(nav.languages?.[0]||nav.language||'ja').toLowerCase();return first.startsWith('ja')?'ja':'en';
}
export let LANG=detectLang();
export function setLang(lang,{reload=true}={}){
 if(!LANGS.includes(lang))return;try{globalThis.localStorage?.setItem(LANG_KEY,lang);}catch{}LANG=lang;
 if(reload&&globalThis.location)globalThis.location.reload();
}
// Test hook: switch without touching storage or reloading.
export function useLang(lang){if(LANGS.includes(lang))LANG=lang;}
const fill=(text,params)=>params==null?text:text.replace(/\{(\w+)\}/g,(m,k)=>params[k]!==undefined?String(params[k]):m);
// t('日本語 {0}',[value]) → current-language text. Missing English falls back to the Japanese source.
export function t(ja,params){return fill(LANG==='en'?(EN[ja]??ja):ja,params);}
const jp=/[぀-ヿ㐀-鿿！-｠]/;
// Static HTML in index.html: translate Japanese text nodes and labels once at start-up.
export function translateStatic(root){
 if(LANG==='ja'||!root)return;
 const walker=root.ownerDocument.createTreeWalker(root,4);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){const raw=node.nodeValue,key=raw.trim();if(!key||!jp.test(key))continue;const en=EN[key];if(en!==undefined)node.nodeValue=raw.replace(key,en);}
 for(const el of root.querySelectorAll('[aria-label],[title],[alt],[placeholder]'))for(const attr of ['aria-label','title','alt','placeholder']){const v=el.getAttribute(attr);if(v&&jp.test(v)&&EN[v]!==undefined)el.setAttribute(attr,EN[v]);}
}
