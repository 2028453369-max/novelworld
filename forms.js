'use strict';

function openForm(key,item=null){const m=moduleMap[key];if(m.special==='writing'){newManuscript(item);return;}sheetState={type:'form',key,itemId:item?.id||null,image:item?.image||'',tags:parseTags(item?.tags)};showSheet(item?`编辑${m.name}`:`新建${m.name}`,m.desc,renderForm(m,item),`<button class="secondary" data-action="close-sheet">取消</button><button class="primary" data-action="save-form">保存</button>`);bindFormExtras();}
function renderForm(m,item={}){return`<form id="itemForm" class="form-grid">${m.fields.map(f=>renderField(f,item?.[f.key])).join('')}</form>`;}
function renderField(f,val=''){
 const full=['textarea','image','tags'].includes(f.type);const req=f.required?' *':'';let control='';
 if(f.type==='textarea')control=`<textarea name="${f.key}" placeholder="${esc(f.placeholder||'')}">${esc(val)}</textarea>`;
 else if(f.type==='select')control=`<select name="${f.key}"><option value="">请选择</option>${f.options.map(o=>`<option ${val===o?'selected':''}>${esc(o)}</option>`).join('')}</select>`;
 else if(f.type==='image')control=`<button type="button" class="image-picker" data-action="pick-image">${val?`<img src="${val}" alt="已选择图片">`:'<span>＋ 插入照片、角色立绘或参考图</span>'}</button>`;
 else if(f.type==='tags')control=`<div class="tag-input" id="tagBox">${parseTags(val).map(t=>`<span>${esc(t)} ×</span>`).join('')}<input id="tagEntry" placeholder="输入标签后回车"></div>`;
 else control=`<input name="${f.key}" type="${f.type||'text'}" value="${esc(val)}" placeholder="${esc(f.placeholder||'')}" ${f.min?`min="${f.min}"`:''} ${f.max?`max="${f.max}"`:''}>`;
 return`<div class="field ${full?'full':''}"><label>${esc(f.label)}${req}</label>${control}${f.hint?`<small>${esc(f.hint)}</small>`:''}</div>`;
}
function bindFormExtras(){
 const tagEntry=$('#tagEntry');if(tagEntry){tagEntry.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const v=e.target.value.trim();if(v&&!sheetState.tags.includes(v)){sheetState.tags.push(v);e.target.value='';refreshTagBox();}}});$('#tagBox').addEventListener('click',e=>{if(e.target.tagName==='SPAN'){sheetState.tags=sheetState.tags.filter(t=>!e.target.textContent.startsWith(t));refreshTagBox();}});}
}
function refreshTagBox(){const box=$('#tagBox');if(!box)return;box.innerHTML=sheetState.tags.map(t=>`<span>${esc(t)} ×</span>`).join('')+'<input id="tagEntry" placeholder="输入标签后回车">';bindFormExtras();}
function saveForm(){const {key,itemId}=sheetState;const m=moduleMap[key];const form=$('#itemForm');const data={};new FormData(form).forEach((v,k)=>data[k]=v);data.image=sheetState.image;data.tags=sheetState.tags;const missing=m.fields.find(f=>f.required&&!String(data[f.key]||'').trim());if(missing){toast(`请填写：${missing.label}`);return;}const arr=activeProject().modules[key];if(itemId){const old=arr.find(x=>x.id===itemId);Object.assign(old,data,{updatedAt:nowISO()});currentItem=itemId;}else{const rec={id:uid(),...data,createdAt:nowISO(),updatedAt:nowISO()};arr.unshift(rec);currentItem=rec.id;}save();closeSheet();route='detail';currentModule=key;render();toast('已保存到本机');}

function showSheet(title,hint,body,footer=''){const portal=$('#portal');portal.innerHTML=`<div class="overlay" data-action="close-sheet"></div><section class="sheet"><div class="sheet-handle"></div><header class="sheet-head"><div><h2>${esc(title)}</h2><p>${esc(hint||'')}</p></div><button class="close-btn" data-action="close-sheet">×</button></header><div class="sheet-body">${body}</div>${footer?`<footer class="sheet-footer">${footer}</footer>`:''}</section>`;bindInteractions(portal);}
function closeSheet(){sheetState=null;const p=$('#portal');if(p)p.innerHTML='';}
function toast(msg){let t=$('.toast');if(t)t.remove();t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2200);}
function confirmModal(title,text,onConfirm,label='确认'){const p=$('#portal');p.innerHTML=`<div class="overlay"></div><div class="modal-center"><h2>${esc(title)}</h2><p>${esc(text)}</p><div class="modal-actions"><button class="secondary" data-action="close-sheet">取消</button><button class="danger-btn" id="modalConfirm">${esc(label)}</button></div></div>`;bindInteractions(p);$('#modalConfirm').onclick=()=>{closeSheet();onConfirm();};}
