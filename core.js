'use strict';

const DB_NAME='NovelWorldDB';
const DB_STORE='kv';
const STATE_KEY='state-v3';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const uid=()=>`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`;
const nowISO=()=>new Date().toISOString();
const esc=v=>String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmtDate=v=>{if(!v)return'';const d=new Date(v);return Number.isNaN(d.getTime())?v:d.toLocaleDateString('zh-CN',{year:'numeric',month:'short',day:'numeric'});};
const wordCount=t=>String(t||'').replace(/\s/g,'').length;

let state;
let route='home';
let currentModule=null;
let currentItem=null;
let sheetState=null;
let mapTool='select';
let selectedMapItem=null;
let selectedMapId=null;
let graphPositions={};
let saveTimer;
let unlocked=false;

function blankProject(title='我的世界'){
  const modules={}; MODULES.forEach(m=>modules[m.key]=[]);
  return {id:uid(),title,subtitle:'私人创作空间',createdAt:nowISO(),updatedAt:nowISO(),modules,maps:[{id:uid(),name:'世界地图',theme:'grid',background:'',items:[]}],settings:{accent:'gradient'}};
}
function defaultState(){const p=blankProject();return{version:3,activeProjectId:p.id,projects:[p],settings:{pinHash:'',lastBackup:'',compact:false}};}
function activeProject(){return state.projects.find(p=>p.id===state.activeProjectId)||state.projects[0];}

function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>req.result.createObjectStore(DB_STORE);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
async function dbGet(key){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(DB_STORE,'readonly');const r=tx.objectStore(DB_STORE).get(key);r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function dbSet(key,val){const db=await openDB();return new Promise((res,rej)=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put(val,key);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});}
function save(){clearTimeout(saveTimer);activeProject().updatedAt=nowISO();saveTimer=setTimeout(()=>dbSet(STATE_KEY,state).catch(console.error),180);}

async function init(){
  try{state=await dbGet(STATE_KEY)||defaultState();}catch(e){console.error(e);state=defaultState();}
  normalizeState();
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
  render();
  setTimeout(checkDueReminders,700);
}
function normalizeState(){
  if(!state.projects?.length)state=defaultState();
  state.settings=state.settings||{};
  state.projects.forEach(p=>{p.modules=p.modules||{};MODULES.forEach(m=>p.modules[m.key]=p.modules[m.key]||[]);p.maps=p.maps||[{id:uid(),name:'世界地图',theme:'grid',background:'',items:[]}];p.settings=p.settings||{};});
}

function render(){
  if(state.settings.pinHash&&!unlocked){renderLock();return;}
  const p=activeProject();
  const due=p.modules.reminders.filter(r=>r.status!=='已完成'&&r.due&&new Date(r.due)<=new Date()).length;
  $('#app').innerHTML=`<div class="app-shell">
    <header class="topbar">
      <button class="brand-btn" data-action="projects"><span class="brand-orb">${esc((p.title||'世')[0])}</span><span class="brand-copy"><b>${esc(p.title)}</b><small>${esc(p.subtitle||'私人创作空间')}</small></span></button>
      <div class="top-actions"><button class="icon-btn" data-action="search" aria-label="全局搜索">⌕</button><button class="icon-btn" data-open-module="reminders" aria-label="提醒">◷${due?'<i class="dot"></i>':''}</button></div>
    </header>
    <main id="view">${renderRoute()}</main>
    ${route!=='settings'&&route!=='editor'?'<button class="fab" data-action="quick-add" aria-label="新建">＋</button>':''}
    <nav class="bottom-nav">${navBtn('home','⌂','首页')}${navBtn('library','▦','设定')}${navBtn('writing','✎','创作')}${navBtn('visual','⌬','图谱')}${navBtn('settings','◉','我的')}</nav>
  </div><div id="portal"></div>`;
  bindInteractions();
  if(route==='map')bindMap();
  if(route==='graph')bindGraph();
  if(route==='editor')bindEditor();
}
function navBtn(r,i,t){const active=(route===r)||(r==='visual'&&['map','graph','calendar'].includes(route))||(r==='writing'&&route==='editor');return`<button class="nav-btn ${active?'active':''}" data-route="${r}"><i>${i}</i><span>${t}</span></button>`;}
function renderRoute(){
  if(route==='home')return renderHome();
  if(route==='library')return renderLibrary();
  if(route==='writing')return renderWritingHub();
  if(route==='visual')return renderVisualHub();
  if(route==='settings')return renderSettings();
  if(route==='module')return renderModulePage(currentModule);
  if(route==='detail')return renderDetail(currentModule,currentItem);
  if(route==='map')return renderMap();
  if(route==='graph')return renderGraph();
  if(route==='calendar')return renderCalendar();
  if(route==='stats')return renderStats();
  if(route==='audit')return renderAudit();
  if(route==='editor')return renderEditor(currentItem);
  return renderHome();
}
