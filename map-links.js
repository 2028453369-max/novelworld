'use strict';

const nwMapBaseHandleAction=handleAction;
const nwMapBaseBindInteractions=bindInteractions;
const nwMapBaseRenderLinkSection=nwRenderLinkSection;

renderMap=function(){
  const p=activeProject();if(!selectedMapId)selectedMapId=p.maps[0]?.id;const map=p.maps.find(x=>x.id===selectedMapId)||p.maps[0];if(!map)return'';
  const tools=[['select','↖','选择'],['city','🏙️','城市'],['village','🏠','村镇'],['castle','🏰','城堡'],['mountain','⛰️','山脉'],['forest','🌲','森林'],['water','💧','水域'],['ruin','🏛️','遗迹'],['portal','✦','秘境'],['label','●','标记']];
  const chosen=map.items.find(x=>x.id===selectedMapItem);
  return `<div class="page"><div class="page-title"><button class="back-btn" data-route="visual">‹</button><div><h1>⌖ ${esc(map.name)}</h1><p>地图元素可与地理档案双向联通</p></div><button class="tiny-btn" data-action="map-menu">地图管理</button></div><div class="map-tools">${tools.map(t=>`<button class="tool-chip ${mapTool===t[0]?'active':''}" data-map-tool="${t[0]}">${t[1]} ${t[2]}</button>`).join('')}<button class="tool-chip" data-action="map-upload">▧ 底图</button><button class="tool-chip" data-action="map-delete-selected">⌫ 删除</button></div><div class="canvas-wrap"><div class="map-canvas" id="mapCanvas">${map.background?`<img class="map-bg" src="${map.background}" alt="地图底图">`:''}${map.items.map(renderMapItem).join('')}</div><div class="zoom-stack"><button data-action="map-help">?</button></div></div>${chosen?nwMapItemPanel(map,chosen):'<section class="card map-link-panel"><b>地图与档案联动</b><p>点选一个地图元素，可将它连接到“地理与环境”中的城市、区域、山脉、河流或遗迹档案。</p></section>'}</div>`;
};
renderMapItem=function(it){
  const icons={city:'🏙️',village:'🏠',castle:'🏰',mountain:'⛰️',forest:'🌲',water:'💧',ruin:'🏛️',portal:'✦'};const linked=it.ref&&nwGetRecord(it.ref);const label=linked?.item?.title||it.label||'';const content=it.type==='label'?`<span class="pin">${esc((label||'标')[0])}</span>`:`<span class="stamp">${icons[it.type]||'●'}</span>`;
  return `<div class="map-item ${selectedMapItem===it.id?'selected':''} ${linked?'linked':''}" data-map-item="${it.id}" style="left:${it.x}%;top:${it.y}%">${content}${label?`<span class="map-label">${esc(label)}</span>`:''}${linked?'<i class="map-linked-dot">↗</i>':''}</div>`;
};
function nwMapItemPanel(map,it){
  const linked=it.ref&&nwGetRecord(it.ref);return `<section class="card map-link-panel"><div class="map-link-head"><div><b>${esc(linked?.item?.title||it.label||'未命名地图元素')}</b><small>${esc(map.name)} · ${esc(it.type)}</small></div><button class="tiny-btn" data-action="map-edit-label">改名</button></div>${linked?`<div class="ref-chip-box">${nwMakeRefChip(it.ref)}</div><div class="map-link-actions"><button class="secondary" data-action="map-link-archive">更换档案</button><button class="secondary" data-action="map-unlink-archive">解除关联</button></div>`:`<p>尚未关联地理档案。关联后，名称会自动同步，并能从档案页反向跳回此地图位置。</p><div class="map-link-actions"><button class="primary" data-action="map-link-archive">选择已有地理档案</button><button class="secondary" data-action="map-create-archive">新建地理档案并关联</button></div>`}</section>`;
}
mapPointerDown=function(e){
  const item=e.target.closest('[data-map-item]');if(item){e.preventDefault();selectedMapItem=item.dataset.mapItem;render();setTimeout(()=>startDragMapItem(e,selectedMapItem),0);return;}if(mapTool==='select')return;
  const rect=e.currentTarget.getBoundingClientRect();const x=((e.clientX-rect.left)/rect.width*100).toFixed(2),y=((e.clientY-rect.top)/rect.height*100).toFixed(2);let label='';if(['city','village','castle','ruin','portal','label'].includes(mapTool))label=prompt('标记名称（可留空）','')||'';
  const rec={id:uid(),type:mapTool,label,x,y,ref:''};currentMap().items.push(rec);selectedMapItem=rec.id;save();render();
};
function nwSelectedMapItem(){return currentMap()?.items.find(x=>x.id===selectedMapItem)||null;}
function nwOpenMapArchivePicker(){
  const it=nwSelectedMapItem();if(!it)return;const choices=nwItemsForModules(['geography']);let selected=it.ref||'';
  const picker=document.createElement('div');picker.className='nested-picker';picker.innerHTML=`<div class="nested-backdrop"></div><section class="picker-card"><header><div><h3>关联地理档案</h3><p>城市、地区、山脉、河流、海洋、遗迹等</p></div><button type="button" class="close-btn" data-picker-close>×</button></header><div class="searchbar"><input data-picker-search placeholder="搜索地理档案"></div><div class="picker-groups" data-picker-list>${nwMapPickerRows(choices,selected)}</div><footer><span>${choices.length} 个可选档案</span><button type="button" class="primary" data-picker-done>完成</button></footer></section>`;$('#portal').appendChild(picker);
  const close=()=>picker.remove();picker.querySelector('[data-picker-close]').onclick=close;picker.querySelector('.nested-backdrop').onclick=close;const list=picker.querySelector('[data-picker-list]');
  const bind=()=>list.querySelectorAll('[data-map-ref-choice]').forEach(b=>b.onclick=()=>{selected=b.dataset.mapRefChoice;list.innerHTML=nwMapPickerRows(choices,selected);bind();});bind();
  picker.querySelector('[data-picker-search]').oninput=e=>{const q=e.target.value.toLowerCase();list.innerHTML=nwMapPickerRows(choices.filter(x=>JSON.stringify(x.item).toLowerCase().includes(q)),selected);bind();};
  picker.querySelector('[data-picker-done]').onclick=()=>{if(selected){it.ref=selected;it.label=nwTitle(selected);save();render();}close();};
}
function nwMapPickerRows(choices,selected){return choices.length?`<section class="picker-group"><h4>△ 地理与环境<small>${choices.length}</small></h4>${choices.map(x=>`<button type="button" class="picker-row ${selected===x.token?'selected':''}" data-map-ref-choice="${esc(x.token)}"><span>${x.item.image?`<img src="${x.item.image}" alt="">`:'△'}</span><div><b>${esc(x.item.title||'未命名')}</b><small>${esc(x.item.type||x.item.parent||'地理档案')}</small></div><i>${selected===x.token?'✓':'＋'}</i></button>`).join('')}</section>`:'<div class="picker-empty">还没有地理档案。关闭后点击“新建地理档案并关联”。</div>';}
function nwCreateGeographyFromMap(){
  const it=nwSelectedMapItem();if(!it)return;const typeMap={city:'城市',village:'村镇',castle:'城市',mountain:'山脉',forest:'地区',water:'河流',ruin:'遗迹',portal:'特殊空间',label:'其他'};const title=prompt('地理档案名称',it.label||'未命名地点');if(!title)return;
  const rec={id:uid(),title,type:typeMap[it.type]||'其他',summary:`来自地图“${currentMap().name}”的${typeMap[it.type]||'地点'}标记`,coordinates:`地图坐标 ${it.x}%, ${it.y}%`,_refs:{},_related:[],tags:['地图标记'],createdAt:nowISO(),updatedAt:nowISO()};activeProject().modules.geography.unshift(rec);it.ref=nwToken('geography',rec.id);it.label=title;save();render();toast('地理档案已创建并关联');
}
handleAction=function(a,e){
  if(a==='map-link-archive'){nwOpenMapArchivePicker();return;}
  if(a==='map-unlink-archive'){const it=nwSelectedMapItem();if(it){it.ref='';save();render();toast('已解除地图关联');}return;}
  if(a==='map-create-archive'){nwCreateGeographyFromMap();return;}
  if(a==='map-edit-label'){const it=nwSelectedMapItem();if(it){const v=prompt('地图元素名称',it.label||'');if(v!==null){it.label=v.trim();save();render();}}return;}
  nwMapBaseHandleAction(a,e);
};
bindInteractions=function(root=document){
  nwMapBaseBindInteractions(root);root.querySelectorAll('[data-linked-map]').forEach(b=>b.onclick=()=>{selectedMapId=b.dataset.linkedMap;selectedMapItem=b.dataset.mapItem;route='map';render();});
};
nwRenderLinkSection=function(item){
  const base=nwMapBaseRenderLinkSection(item);if(currentModule!=='geography')return base;const token=nwToken('geography',item.id),places=[];activeProject().maps.forEach(map=>map.items.filter(x=>x.ref===token).forEach(marker=>places.push({map,marker})));
  if(!places.length)return base;return base+`<section class="card detail-section linked-section"><h3>地图位置</h3><div class="linked-list">${places.map(x=>`<button data-linked-map="${esc(x.map.id)}" data-map-item="${esc(x.marker.id)}"><i>⌖</i><span><strong>${esc(x.marker.label||item.title)}</strong><small>${esc(x.map.name)} · 坐标 ${esc(x.marker.x)}%, ${esc(x.marker.y)}%</small></span><em>›</em></button>`).join('')}</div></section>`;
};
(function(){const s=document.createElement('style');s.textContent=`.map-link-panel{margin-top:12px}.map-link-head{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.map-link-head small{display:block;color:var(--muted);font-size:10px;margin-top:3px}.map-link-panel>p{color:var(--muted);font-size:12px;line-height:1.7}.map-link-actions{display:flex;gap:8px;margin-top:10px}.map-link-actions button{flex:1}.map-linked-dot{position:absolute;right:-5px;top:-7px;width:17px;height:17px;border-radius:50%;background:var(--violet);color:white;display:grid;place-items:center;font-size:9px;font-style:normal;box-shadow:0 4px 10px rgba(60,50,130,.25)}`;document.head.appendChild(s);})();
setTimeout(()=>render(),0);
