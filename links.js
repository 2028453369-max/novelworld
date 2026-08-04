'use strict';

/* Linked-world database layer: adds cross-module references without breaking old records. */
const NW_ALL_LINKABLE = MODULES.filter(m=>!['statistics','graphs','archiveAudit','mapCenter'].includes(m.key)).map(m=>m.key);
const NW_ENTITY_MODULES = ['characters','organizations','geography','items','nature','civilization','soulFaith','powerSystem','knowledge','economy','languages','worldPlot','plotLines','stories','manuscripts'];
const NW_LINK_RULES = {
  characters:{location:{modules:['geography'],multiple:true}},
  appearance:{owner:{modules:['characters','civilization','nature'],multiple:false}},
  relationships:{
    source:{modules:NW_ENTITY_MODULES,multiple:false,required:true},
    target:{modules:NW_ENTITY_MODULES,multiple:false,required:true}
  },
  organizations:{
    hq:{modules:['geography'],multiple:true},
    leader:{modules:['characters'],multiple:true},
    members:{modules:['characters'],multiple:true},
    relations:{modules:['organizations'],multiple:true}
  },
  characterJourney:{
    character:{modules:['characters'],multiple:false,required:true},
    place:{modules:['geography'],multiple:false},
    links:{modules:NW_ALL_LINKABLE,multiple:true}
  },
  worldPlot:{
    scope:{modules:['geography','civilization','organizations'],multiple:true},
    winners:{modules:['characters','organizations','civilization'],multiple:true},
    losers:{modules:['characters','organizations','civilization'],multiple:true}
  },
  powerSystem:{users:{modules:['characters','organizations','civilization'],multiple:true}},
  nature:{habitat:{modules:['geography'],multiple:true}},
  economy:{
    issuer:{modules:['organizations','civilization'],multiple:true},
    circulation:{modules:['geography'],multiple:true},
    trade:{modules:['geography','organizations','economy'],multiple:true}
  },
  soulFaith:{clergy:{modules:['organizations','characters'],multiple:true}},
  knowledge:{
    tools:{modules:['items','nature'],multiple:true},
    masters:{modules:['characters','organizations','civilization'],multiple:true}
  },
  geography:{parent:{modules:['geography'],multiple:false}},
  items:{
    owner:{modules:['characters','organizations'],multiple:true},
    origin:{modules:['characters','organizations','knowledge','geography'],multiple:true},
    plot:{modules:['plotLines','worldPlot','stories','manuscripts'],multiple:true}
  },
  bonds:{
    parties:{modules:['characters','organizations'],multiple:true,required:true,min:2},
    plot:{modules:['plotLines','worldPlot','manuscripts'],multiple:true}
  },
  plotLines:{
    characters:{modules:['characters'],multiple:true},
    clues:{modules:['items','stories','communications'],multiple:true},
    dependencies:{modules:['plotLines'],multiple:true}
  },
  stories:{
    speaker:{modules:['characters'],multiple:false},
    timePlace:{modules:['geography','worldPlot'],multiple:true}
  },
  communications:{
    sender:{modules:['characters','organizations'],multiple:false},
    receiver:{modules:['characters','organizations'],multiple:true},
    channel:{modules:['items','languages'],multiple:true}
  },
  reminders:{linked:{modules:NW_ALL_LINKABLE,multiple:true}},
  languages:{users:{modules:['civilization','organizations','geography','characters'],multiple:true}}
};

const nwBaseBindInteractions = bindInteractions;
const nwBaseHandleAction = handleAction;
const nwBaseBindEditor = bindEditor;

function nwToken(module,id){return `${module}:${id}`;}
function nwParseToken(token){const i=String(token||'').indexOf(':');return i<1?null:{module:token.slice(0,i),id:token.slice(i+1)};}
function nwGetRecord(token){const p=nwParseToken(token);if(!p)return null;const item=activeProject().modules[p.module]?.find(x=>x.id===p.id);return item?{...p,item,moduleDef:moduleMap[p.module]}:null;}
function nwTitle(token){const r=nwGetRecord(token);return r?.item?.title||'已删除档案';}
function nwNormalizeRefs(v){return [...new Set((Array.isArray(v)?v:[]).map(String).filter(x=>nwParseToken(x)))];}
function nwRefs(item,key){return nwNormalizeRefs(item?._refs?.[key]);}
function nwRelated(item){return nwNormalizeRefs(item?._related);}
function nwRule(moduleKey,fieldKey){return NW_LINK_RULES[moduleKey]?.[fieldKey]||null;}
function nwItemsForModules(modules,excludeToken=''){
  const p=activeProject();
  return modules.flatMap(k=>(p.modules[k]||[]).map(item=>({token:nwToken(k,item.id),module:k,item})))
    .filter(x=>x.token!==excludeToken)
    .sort((a,b)=>String(a.item.title||'').localeCompare(String(b.item.title||''),'zh-CN'));
}
function nwRefText(tokens){return nwNormalizeRefs(tokens).map(nwTitle).filter(x=>x!=='已删除档案').join('、');}
function nwMakeRefChip(token,removable=false,field=''){
  const r=nwGetRecord(token);const label=r?.item?.title||'已删除档案';
  return `<button type="button" class="ref-chip ${r?'':'broken'}" ${removable?`data-remove-ref="${esc(token)}" data-ref-field="${esc(field)}"`:`data-linked-ref="${esc(token)}"`}><i>${esc(r?.moduleDef?.icon||'×')}</i><span>${esc(label)}</span><small>${esc(r?.moduleDef?.name||'失效')}</small>${removable?'<b>×</b>':''}</button>`;
}
function nwRenderRefControl(moduleKey,f,item){
  const rule=nwRule(moduleKey,f.key);const refs=nwRefs(item,f.key);const legacy=String(item?.[f.key]||'').trim();
  return `<div class="ref-control" data-ref-control="${esc(f.key)}">
    <div class="ref-chip-box" data-ref-chips="${esc(f.key)}">${refs.length?refs.map(t=>nwMakeRefChip(t,true,f.key)).join(''):'<span class="ref-empty">尚未选择档案</span>'}</div>
    <button type="button" class="ref-pick-btn" data-pick-ref="${esc(f.key)}">＋ 选择已有档案</button>
    ${legacy&&!refs.length?`<div class="legacy-ref">旧文字：${esc(legacy)}（保存时会保留）</div>`:''}
    <input type="hidden" name="${esc(f.key)}" value="${esc(legacy)}">
    ${rule?.required?'<small class="ref-hint">此项必须从已有档案中选择</small>':''}
  </div>`;
}
function nwRenderGeneralRelated(item){
  const refs=nwRelated(item);
  return `<div class="field full linked-field"><label>关联档案</label><div class="ref-control" data-ref-control="__related"><div class="ref-chip-box" data-ref-chips="__related">${refs.length?refs.map(t=>nwMakeRefChip(t,true,'__related')).join(''):'<span class="ref-empty">可关联人物、地点、组织、道具、剧情线、章节等</span>'}</div><button type="button" class="ref-pick-btn" data-pick-ref="__related">＋ 添加关联档案</button></div><small>关联后，对方档案会自动显示“被哪些内容引用”。</small></div>`;
}

openForm = function(key,item=null){
  const m=moduleMap[key];if(m.special==='writing'){newManuscript(item);return;}
  sheetState={type:'form',key,itemId:item?.id||null,image:item?.image||'',tags:parseTags(item?.tags),refs:JSON.parse(JSON.stringify(item?._refs||{})),related:nwRelated(item)};
  showSheet(item?`编辑${m.name}`:`新建${m.name}`,m.desc,renderForm(m,item),`<button class="secondary" data-action="close-sheet">取消</button><button class="primary" data-action="save-form">保存</button>`);
  bindFormExtras();
};
renderForm = function(m,item={}){
  return `<form id="itemForm" class="form-grid">${m.fields.map(f=>renderField(f,item?.[f.key],m.key,item)).join('')}${nwRenderGeneralRelated(item)}</form>`;
};
renderField = function(f,val='',moduleKey=currentModule,item={}){
  const full=['textarea','image','tags'].includes(f.type)||!!nwRule(moduleKey,f.key);const req=f.required?' *':'';let control='';
  if(nwRule(moduleKey,f.key))control=nwRenderRefControl(moduleKey,f,item);
  else if(f.type==='textarea')control=`<textarea name="${f.key}" placeholder="${esc(f.placeholder||'')}">${esc(val)}</textarea>`;
  else if(f.type==='select')control=`<select name="${f.key}"><option value="">请选择</option>${f.options.map(o=>`<option ${val===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
  else if(f.type==='image')control=`<button type="button" class="image-picker" data-action="pick-image">${val?`<img src="${val}" alt="已选择图片">`:'<span>＋ 插入照片、角色立绘或参考图</span>'}</button>`;
  else if(f.type==='tags')control=`<div class="tag-input" id="tagBox">${parseTags(val).map(t=>`<span>${esc(t)} ×</span>`).join('')}<input id="tagEntry" placeholder="输入标签后回车"></div>`;
  else control=`<input name="${f.key}" type="${f.type||'text'}" value="${esc(val)}" placeholder="${esc(f.placeholder||'')}" ${f.min?`min="${f.min}"`:''} ${f.max?`max="${f.max}"`:''}>`;
  return `<div class="field ${full?'full':''}"><label>${esc(f.label)}${req}</label>${control}${f.hint?`<small>${esc(f.hint)}</small>`:''}</div>`;
};

bindFormExtras = function(){
  const tagEntry=$('#tagEntry');if(tagEntry){tagEntry.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const v=e.target.value.trim();if(v&&!sheetState.tags.includes(v)){sheetState.tags.push(v);e.target.value='';refreshTagBox();}}});const tagBox=$('#tagBox');if(tagBox)tagBox.addEventListener('click',e=>{if(e.target.tagName==='SPAN'){const text=e.target.textContent.replace(/\s*×\s*$/,'').trim();sheetState.tags=sheetState.tags.filter(t=>t!==text);refreshTagBox();}});}
  $$('[data-pick-ref]').forEach(b=>b.onclick=()=>nwOpenPicker(b.dataset.pickRef));
  $$('[data-remove-ref]').forEach(b=>b.onclick=()=>{const field=b.dataset.refField,token=b.dataset.removeRef;if(field==='__related')sheetState.related=nwNormalizeRefs(sheetState.related).filter(x=>x!==token);else sheetState.refs[field]=nwNormalizeRefs(sheetState.refs[field]).filter(x=>x!==token);nwRefreshRefControl(field);});
};
function nwRefreshRefControl(field){
  const box=$(`[data-ref-chips="${field}"]`);if(!box)return;const refs=field==='__related'?nwNormalizeRefs(sheetState.related):nwNormalizeRefs(sheetState.refs[field]);
  box.innerHTML=refs.length?refs.map(t=>nwMakeRefChip(t,true,field)).join(''):`<span class="ref-empty">${field==='__related'?'可关联人物、地点、组织、道具、剧情线、章节等':'尚未选择档案'}</span>`;
  bindFormExtras();
}
function nwOpenPicker(field){
  const moduleKey=sheetState.key;const rule=field==='__related'?{modules:NW_ALL_LINKABLE,multiple:true}:nwRule(moduleKey,field);if(!rule)return;
  const selected=new Set(field==='__related'?nwNormalizeRefs(sheetState.related):nwNormalizeRefs(sheetState.refs[field]));
  const exclude=sheetState.itemId?nwToken(moduleKey,sheetState.itemId):'';const choices=nwItemsForModules(rule.modules,exclude);
  const picker=document.createElement('div');picker.className='nested-picker';picker.innerHTML=`<div class="nested-backdrop"></div><section class="picker-card"><header><div><h3>${field==='__related'?'添加关联档案':'选择'+esc(moduleMap[moduleKey].fields.find(x=>x.key===field)?.label||'档案')}</h3><p>${rule.multiple?'可以选择多个':'只能选择一个'}</p></div><button type="button" class="close-btn" data-picker-close>×</button></header><div class="searchbar"><input data-picker-search placeholder="搜索名称、标签或板块"></div><div class="picker-groups" data-picker-list>${nwPickerChoices(choices,selected)}</div><footer><span data-picker-count>已选择 ${selected.size} 项</span><button type="button" class="primary" data-picker-done>完成</button></footer></section>`;
  $('#portal').appendChild(picker);
  const close=()=>picker.remove();picker.querySelector('[data-picker-close]').onclick=close;picker.querySelector('.nested-backdrop').onclick=close;
  const list=picker.querySelector('[data-picker-list]');
  const bindRows=()=>{list.querySelectorAll('[data-ref-choice]').forEach(row=>row.onclick=()=>{const t=row.dataset.refChoice;if(rule.multiple){selected.has(t)?selected.delete(t):selected.add(t);}else{selected.clear();selected.add(t);}row.closest('.picker-groups').innerHTML=nwPickerChoices(choices,selected);bindRows();picker.querySelector('[data-picker-count]').textContent=`已选择 ${selected.size} 项`;});};bindRows();
  picker.querySelector('[data-picker-search]').oninput=e=>{const q=e.target.value.trim().toLowerCase();const filtered=choices.filter(x=>(x.item.title+' '+(x.item.alias||'')+' '+(x.item.tags||'')+' '+moduleMap[x.module].name).toLowerCase().includes(q));list.innerHTML=nwPickerChoices(filtered,selected);bindRows();};
  picker.querySelector('[data-picker-done]').onclick=()=>{const arr=[...selected];if(field==='__related')sheetState.related=arr;else sheetState.refs[field]=arr;nwRefreshRefControl(field);close();};
}
function nwPickerChoices(choices,selected){
  if(!choices.length)return '<div class="picker-empty">没有可选择的档案，请先在相应板块创建内容。</div>';
  const grouped={};choices.forEach(x=>(grouped[x.module]||(grouped[x.module]=[])).push(x));
  return Object.entries(grouped).map(([module,items])=>`<section class="picker-group"><h4>${moduleMap[module].icon} ${moduleMap[module].name}<small>${items.length}</small></h4>${items.map(x=>`<button type="button" class="picker-row ${selected.has(x.token)?'selected':''}" data-ref-choice="${esc(x.token)}"><span>${x.item.image?`<img src="${x.item.image}" alt="">`:moduleMap[module].icon}</span><div><b>${esc(x.item.title||'未命名')}</b><small>${esc(x.item.alias||x.item.summary||moduleMap[module].desc)}</small></div><i>${selected.has(x.token)?'✓':'＋'}</i></button>`).join('')}</section>`).join('');
}

saveForm = function(){
  const {key,itemId}=sheetState;const m=moduleMap[key];const form=$('#itemForm');const data={};new FormData(form).forEach((v,k)=>data[k]=v);data.image=sheetState.image;data.tags=sheetState.tags;data._refs={};
  Object.entries(sheetState.refs||{}).forEach(([field,refs])=>{const clean=nwNormalizeRefs(refs);if(clean.length){data._refs[field]=clean;data[field]=nwRefText(clean);}});
  data._related=nwNormalizeRefs(sheetState.related);
  if(key==='relationships'){
    const a=nwTitle(data._refs.source?.[0]),b=nwTitle(data._refs.target?.[0]);data.source=a;data.target=b;
    if(!data.title||data.title==='未命名')data.title=`${a} · ${data.relation||'关系'} · ${b}`;
  }
  if(key==='bonds'&&data._refs.parties){data.parties=nwRefText(data._refs.parties);if(!data.title||data.title==='未命名')data.title=`${data.parties} · ${data.kind||'羁绊'}`;}
  const missing=m.fields.find(f=>{const rule=nwRule(key,f.key);if(rule?.required){const n=nwNormalizeRefs(data._refs[f.key]).length;return n<(rule.min||1);}return f.required&&!String(data[f.key]||'').trim();});
  if(missing){toast(`请填写或选择：${missing.label}`);return;}
  const arr=activeProject().modules[key];if(itemId){const old=arr.find(x=>x.id===itemId);Object.assign(old,data,{updatedAt:nowISO()});currentItem=itemId;}else{const rec={id:uid(),...data,createdAt:nowISO(),updatedAt:nowISO()};arr.unshift(rec);currentItem=rec.id;}
  save();closeSheet();route='detail';currentModule=key;render();toast('已保存，关联档案已同步');
};

function nwOutgoing(item){
  const groups=[];Object.entries(item?._refs||{}).forEach(([field,refs])=>{const clean=nwNormalizeRefs(refs);if(clean.length)groups.push({label:moduleMap[currentModule]?.fields.find(f=>f.key===field)?.label||field,refs:clean});});
  const related=nwRelated(item);if(related.length)groups.push({label:'关联档案',refs:related});return groups;
}
function nwBacklinks(moduleKey,id){
  const token=nwToken(moduleKey,id),out=[];
  MODULES.forEach(m=>(activeProject().modules[m.key]||[]).forEach(item=>{
    const fields=Object.entries(item._refs||{}).filter(([,refs])=>nwNormalizeRefs(refs).includes(token)).map(([k])=>m.fields.find(f=>f.key===k)?.label||k);
    if(nwRelated(item).includes(token))fields.push('关联档案');
    if(fields.length)out.push({module:m.key,item,fields});
  }));
  return out;
}
function nwRenderLinkSection(item){
  const outgoing=nwOutgoing(item),backs=nwBacklinks(currentModule,item.id);
  if(!outgoing.length&&!backs.length)return `<section class="card detail-section linked-section"><div class="section-title-line"><h3>关联网络</h3><button data-action="edit-item">＋ 添加关联</button></div><p class="ref-empty">还没有关联。编辑档案后，可以选择人物、组织、地点、道具、剧情线或稿件。</p></section>`;
  return `<section class="card detail-section linked-section"><h3>关联网络</h3>${outgoing.map(g=>`<div class="link-group"><b>${esc(g.label)}</b><div class="ref-chip-box">${g.refs.map(t=>nwMakeRefChip(t)).join('')}</div></div>`).join('')}${backs.length?`<div class="link-group backlinks"><b>被以下档案引用</b><div class="linked-list">${backs.map(x=>`<button data-linked-ref="${esc(nwToken(x.module,x.item.id))}"><i>${moduleMap[x.module].icon}</i><span><strong>${esc(x.item.title||'未命名')}</strong><small>${esc(moduleMap[x.module].name)} · ${esc(x.fields.join('、'))}</small></span><em>›</em></button>`).join('')}</div></div>`:''}</section>`;
}

renderDetail = function(key,id){
  const m=moduleMap[key];const item=activeProject().modules[key].find(x=>x.id===id);if(!item){route='module';return renderModulePage(key);}
  const rows=m.fields.filter(f=>!['title','image','tags'].includes(f.key)&&item[f.key]).map(f=>{
    const refs=nwRefs(item,f.key);const value=refs.length?`<div class="ref-chip-box">${refs.map(t=>nwMakeRefChip(t)).join('')}</div>`:`<div>${esc(item[f.key])}</div>`;
    return `<div class="detail-row"><span>${esc(f.label)}</span>${value}</div>`;
  }).join('');
  return `<div class="page"><div class="page-title"><button class="back-btn" data-open-module="${key}">‹</button><div><h1>${m.name}</h1><p>最后编辑 ${fmtDate(item.updatedAt)}</p></div><button class="tiny-btn" data-action="edit-item">编辑</button></div><div class="detail-cover">${item.image?`<img src="${item.image}" alt="">`:`<div class="cover-letter">${esc((item.title||m.name)[0])}</div>`}</div><div class="detail-head"><h2>${esc(item.title||'未命名')}</h2><p>${esc(item.summary||item.alias||item.type||m.desc)}</p></div>${parseTags(item.tags).length?`<div class="chip-row">${parseTags(item.tags).map(t=>`<i class="chip">${esc(t)}</i>`).join('')}</div>`:''}<section class="card detail-section"><h3>档案内容</h3>${rows||'<p style="color:var(--muted);font-size:13px">暂未填写详细内容。</p>'}</section>${nwRenderLinkSection(item)}<div class="hero-row" style="margin-top:12px"><button class="secondary" data-action="duplicate-item">复制档案</button><button class="danger-btn" data-action="delete-item">删除</button></div></div>`;
};
itemSubtitle = function(item,m){
  if(m.key==='relationships'){const s=nwRefs(item,'source')[0],t=nwRefs(item,'target')[0];if(s&&t)return `${nwTitle(s)} → ${nwTitle(t)} · ${item.relation||'关系'}`;}
  return item.summary||item.role||item.type||item.character||item.source&&item.target&&`${item.source} → ${item.target}`||item.content?.slice(0,52)||m.desc;
};

bindInteractions = function(root=document){
  nwBaseBindInteractions(root);
  root.querySelectorAll('[data-linked-ref]').forEach(el=>el.onclick=e=>{e.stopPropagation();const r=nwGetRecord(el.dataset.linkedRef);if(!r){toast('关联档案已不存在');return;}closeSheet();currentModule=r.module;currentItem=r.id;if(r.module==='manuscripts')newManuscript(r.item);else{route='detail';render();}});
};
handleAction = function(a,e){
  if(a==='delete-item'){
    const p=activeProject(),token=nwToken(currentModule,currentItem);
    confirmModal('删除档案','删除后，其他板块中指向它的链接会自动移除。此操作无法撤销。',()=>{p.modules[currentModule]=p.modules[currentModule].filter(x=>x.id!==currentItem);nwRemoveTokenEverywhere(token);save();route='module';currentItem=null;render();toast('档案和关联引用已删除');},'删除');return;
  }
  nwBaseHandleAction(a,e);
};
function nwRemoveTokenEverywhere(token){
  MODULES.forEach(m=>(activeProject().modules[m.key]||[]).forEach(item=>{
    Object.keys(item._refs||{}).forEach(k=>item._refs[k]=nwNormalizeRefs(item._refs[k]).filter(x=>x!==token));
    item._related=nwRelated(item).filter(x=>x!==token);
  }));
}

graphData = function(){
  const p=activeProject(),nodes=[],edges=[],nodeMap=new Map();
  const ensure=token=>{if(!token)return null;if(nodeMap.has(token))return token;const r=nwGetRecord(token);if(!r)return null;const n={id:token,label:r.item.title||'未命名',type:r.moduleDef.name,image:r.item.image,module:r.module};nodes.push(n);nodeMap.set(token,n);return token;};
  ['characters','organizations','geography','items'].forEach(k=>(p.modules[k]||[]).forEach(x=>ensure(nwToken(k,x.id))));
  p.modules.relationships.forEach(r=>{let s=nwRefs(r,'source')[0],t=nwRefs(r,'target')[0];if(!s&&r.source)s=nwFindByTitle(r.source,NW_ENTITY_MODULES);if(!t&&r.target)t=nwFindByTitle(r.target,NW_ENTITY_MODULES);s=ensure(s);t=ensure(t);if(s&&t)edges.push({s,t,label:r.relation||'关系'});});
  p.modules.bonds.forEach(r=>{const parts=nwRefs(r,'parties');for(let i=1;i<parts.length;i++){const s=ensure(parts[0]),t=ensure(parts[i]);if(s&&t)edges.push({s,t,label:r.kind||'羁绊'});}});
  return {nodes,edges};
};

renderEditor = function(id){
  const item=activeProject().modules.manuscripts.find(x=>x.id===id);if(!item){route='writing';return renderWritingHub();}
  const related=nwRelated(item);
  return `<div class="page"><div class="page-title"><button class="back-btn" data-route="writing">‹</button><div><h1>正文编辑</h1><p>自动保存到本机</p></div><button class="tiny-btn" data-action="delete-manuscript">删除</button></div><div class="editor-shell"><div class="editor-meta"><input id="msTitle" value="${esc(item.title)}" placeholder="章节标题"><input id="msChapter" value="${esc(item.chapter||'')}" placeholder="章序"></div><textarea class="editor" id="msContent" placeholder="从一个画面、一句话或一个冲突开始……">${esc(item.content||'')}</textarea><div class="editor-foot"><span id="saveStatus">已保存</span><span id="wordStatus">${wordCount(item.content)} 字</span></div><section class="editor-links"><div><b>关联档案</b><small>本章节涉及的人物、地点、道具和剧情线</small></div><div class="ref-chip-box">${related.length?related.map(t=>nwMakeRefChip(t)).join(''):'<span class="ref-empty">尚未关联</span>'}</div><button class="secondary" data-action="edit-manuscript-links">管理关联</button></section></div></div>`;
};
bindEditor = function(){nwBaseBindEditor();bindInteractions($('#view'));};
function nwEditManuscriptLinks(){
  const item=activeProject().modules.manuscripts.find(x=>x.id===currentItem);if(!item)return;
  sheetState={type:'manuscript-links',key:'manuscripts',itemId:item.id,refs:{},related:nwRelated(item),tags:[],image:''};
  showSheet('章节关联档案','选择本章节涉及的人物、地点、组织、道具、剧情线或事件',`<div class="form-grid">${nwRenderGeneralRelated(item)}</div>`,`<button class="secondary" data-action="close-sheet">取消</button><button class="primary" data-action="save-manuscript-links">保存</button>`);bindFormExtras();
}
const nwHandleAfter = handleAction;
handleAction = function(a,e){
  if(a==='edit-manuscript-links'){nwEditManuscriptLinks();return;}
  if(a==='save-manuscript-links'){const item=activeProject().modules.manuscripts.find(x=>x.id===sheetState.itemId);if(item){item._related=nwNormalizeRefs(sheetState.related);item.updatedAt=nowISO();save();closeSheet();render();toast('章节关联已保存');}return;}
  nwHandleAfter(a,e);
};

function nwFindByTitle(text,modules=NW_ALL_LINKABLE){
  const q=String(text||'').trim().toLowerCase();if(!q)return'';
  for(const k of modules){for(const item of activeProject().modules[k]||[]){const names=[item.title,...String(item.alias||'').split(/[，,、/]/)].map(x=>String(x||'').trim().toLowerCase());if(names.includes(q))return nwToken(k,item.id);}}
  return'';
}
function nwMigrateLinks(){
  let changed=false;state.version=Math.max(Number(state.version)||3,4);
  state.projects.forEach(project=>{
    const previous=state.activeProjectId;state.activeProjectId=project.id;
    Object.entries(NW_LINK_RULES).forEach(([moduleKey,fields])=>(project.modules[moduleKey]||[]).forEach(item=>{
      item._refs=item._refs||{};item._related=nwRelated(item);
      Object.entries(fields).forEach(([field,rule])=>{if(nwNormalizeRefs(item._refs[field]).length)return;const raw=String(item[field]||'').trim();if(!raw)return;const parts=rule.multiple?raw.split(/[、,，/&与\n]/).map(x=>x.trim()).filter(Boolean):[raw];const found=parts.map(x=>nwFindByTitle(x,rule.modules)).filter(Boolean);if(found.length){item._refs[field]=rule.multiple?found:[found[0]];changed=true;}});
    }));
    state.activeProjectId=previous;
  });
  return changed;
}

(function nwInstallStyles(){
  if(document.getElementById('linked-world-styles'))return;const style=document.createElement('style');style.id='linked-world-styles';style.textContent=`
  .ref-control{border:1px solid var(--line);border-radius:16px;padding:10px;background:rgba(255,255,255,.65)}
  .ref-chip-box{display:flex;flex-wrap:wrap;gap:7px;min-height:32px;align-items:center}.ref-empty{color:var(--muted);font-size:12px;line-height:1.6}
  .ref-chip{display:inline-flex;align-items:center;gap:6px;max-width:100%;border:1px solid rgba(117,103,248,.18);background:linear-gradient(135deg,rgba(255,183,213,.24),rgba(156,202,255,.25));border-radius:999px;padding:6px 9px;color:var(--ink);text-align:left}
  .ref-chip i{font-style:normal}.ref-chip span{font-size:12px;font-weight:700;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ref-chip small{font-size:9px;color:var(--muted)}.ref-chip b{font-size:14px;color:var(--danger);margin-left:2px}.ref-chip.broken{opacity:.55}
  .ref-pick-btn{width:100%;margin-top:9px;border:1px dashed rgba(117,103,248,.35);background:rgba(117,103,248,.06);color:var(--violet);border-radius:12px;padding:10px;font-weight:700}.legacy-ref,.ref-hint{display:block;margin-top:7px;color:var(--muted);font-size:11px}.linked-field{padding-top:12px;border-top:1px dashed var(--line)}
  .nested-picker{position:fixed;inset:0;z-index:9999;display:flex;align-items:flex-end}.nested-backdrop{position:absolute;inset:0;background:rgba(32,27,58,.42);backdrop-filter:blur(4px)}.picker-card{position:relative;width:100%;max-height:88vh;background:#faf9ff;border-radius:26px 26px 0 0;padding:18px 16px calc(14px + env(safe-area-inset-bottom));box-shadow:0 -16px 50px rgba(49,37,100,.2);display:flex;flex-direction:column}.picker-card header{display:flex;justify-content:space-between;align-items:flex-start}.picker-card h3{margin:0;font-size:18px}.picker-card header p{margin:4px 0 0;color:var(--muted);font-size:12px}.picker-groups{overflow:auto;padding:4px 1px 14px}.picker-group h4{margin:14px 4px 7px;display:flex;gap:7px;align-items:center}.picker-group h4 small{margin-left:auto;color:var(--muted)}.picker-row{width:100%;display:grid;grid-template-columns:42px 1fr 28px;gap:9px;align-items:center;padding:10px;border-radius:14px;background:white;border:1px solid var(--line);margin-bottom:7px;text-align:left}.picker-row.selected{border-color:var(--violet);background:linear-gradient(135deg,rgba(255,183,213,.18),rgba(156,202,255,.18))}.picker-row>span{width:42px;height:42px;border-radius:13px;background:#f3f0ff;display:grid;place-items:center;overflow:hidden}.picker-row img{width:100%;height:100%;object-fit:cover}.picker-row b{font-size:13px}.picker-row small{display:block;color:var(--muted);font-size:10px;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.picker-row i{font-style:normal;color:var(--violet);font-weight:800}.picker-card footer{display:flex;align-items:center;gap:12px;border-top:1px solid var(--line);padding-top:10px}.picker-card footer span{font-size:12px;color:var(--muted);flex:1}.picker-empty{padding:30px 12px;text-align:center;color:var(--muted)}
  .linked-section{margin-top:12px}.section-title-line{display:flex;justify-content:space-between;align-items:center}.section-title-line button{color:var(--violet);background:none;font-weight:700}.link-group{margin-top:14px}.link-group>b{display:block;font-size:12px;color:var(--muted);margin-bottom:7px}.linked-list{display:grid;gap:7px}.linked-list button{display:grid;grid-template-columns:34px 1fr 16px;gap:9px;align-items:center;text-align:left;background:#faf9ff;border:1px solid var(--line);border-radius:13px;padding:9px}.linked-list button>i{width:34px;height:34px;border-radius:10px;background:linear-gradient(135deg,var(--pink),var(--blue));display:grid;place-items:center;font-style:normal;color:white}.linked-list strong{display:block;font-size:12px}.linked-list small{display:block;font-size:10px;color:var(--muted);margin-top:2px}.linked-list em{font-style:normal;color:var(--muted)}
  .editor-links{margin-top:12px;padding:14px;border:1px solid var(--line);background:rgba(255,255,255,.78);border-radius:18px}.editor-links>div:first-child{display:flex;justify-content:space-between;gap:10px;margin-bottom:9px}.editor-links small{color:var(--muted);font-size:10px}.editor-links>button{width:100%;margin-top:9px}
  `;document.head.appendChild(style);
})();

if(nwMigrateLinks())save();
setTimeout(()=>render(),0);
