'use strict';

function bindInteractions(root=document){
 root.querySelectorAll('[data-route]').forEach(el=>el.onclick=()=>{route=el.dataset.route;currentItem=null;render();});
 root.querySelectorAll('[data-open-module]').forEach(el=>el.onclick=()=>openModule(el.dataset.openModule));
 root.querySelectorAll('[data-item]').forEach(el=>el.onclick=()=>{currentModule=el.dataset.module;currentItem=el.dataset.item;if(currentModule==='manuscripts'){newManuscript(activeProject().modules.manuscripts.find(x=>x.id===currentItem));}else{route='detail';render();}});
 root.querySelectorAll('[data-action]').forEach(el=>el.onclick=e=>handleAction(el.dataset.action,e));
 root.querySelectorAll('[data-map-tool]').forEach(el=>el.onclick=()=>{mapTool=el.dataset.mapTool;render();});
 root.querySelectorAll('[data-select-map]').forEach(el=>el.onclick=()=>{selectedMapId=el.dataset.selectMap;closeSheet();route='map';render();});
 const s=$('#moduleSearch',root);if(s)s.oninput=()=>{const q=s.value.trim().toLowerCase();const items=activeProject().modules[currentModule].filter(x=>JSON.stringify(x).toLowerCase().includes(q));$('#moduleList').innerHTML=items.length?`<div class="list">${items.map(x=>renderListItem({...x,_module:currentModule})).join('')}</div>`:renderEmpty(moduleMap[currentModule]);bindInteractions($('#moduleList'));};
}
function handleAction(a,e){
 const p=activeProject();
 if(a==='quick-add'){showQuickAdd();}
 else if(a==='projects')showProjects();
 else if(a==='search')showSearch();
 else if(a==='add-item')openForm(currentModule);
 else if(a==='edit-item')openForm(currentModule,p.modules[currentModule].find(x=>x.id===currentItem));
 else if(a==='save-form')saveForm();
 else if(a==='close-sheet')closeSheet();
 else if(a==='pick-image')pickImage(data=>{sheetState.image=data;$('.image-picker').innerHTML=`<img src="${data}" alt="已选择图片">`;});
 else if(a==='delete-item')confirmModal('删除档案','这条内容将从当前设备删除，无法撤销。',()=>{p.modules[currentModule]=p.modules[currentModule].filter(x=>x.id!==currentItem);save();route='module';currentItem=null;render();toast('已删除');},'删除');
 else if(a==='duplicate-item'){const old=p.modules[currentModule].find(x=>x.id===currentItem);const copy={...old,id:uid(),title:(old.title||'未命名')+' · 副本',createdAt:nowISO(),updatedAt:nowISO()};p.modules[currentModule].unshift(copy);save();currentItem=copy.id;render();toast('已复制');}
 else if(a==='new-manuscript')newManuscript();
 else if(a==='delete-manuscript')confirmModal('删除稿件','正文删除后无法恢复，请确认已经导出备份。',()=>{p.modules.manuscripts=p.modules.manuscripts.filter(x=>x.id!==currentItem);save();route='writing';render();},'删除稿件');
 else if(a==='map-upload')pickImage(data=>{currentMap().background=data;save();render();});
 else if(a==='map-delete-selected'){if(!selectedMapItem){toast('请先点选一个地图元素');return;}currentMap().items=currentMap().items.filter(x=>x.id!==selectedMapItem);selectedMapItem=null;save();render();}
 else if(a==='map-menu')mapMenu();
 else if(a==='new-map'){const name=prompt('地图名称','新区域地图');if(name){const m={id:uid(),name,theme:'grid',background:'',items:[]};p.maps.push(m);selectedMapId=m.id;save();closeSheet();render();}}
 else if(a==='map-help')showInfo('地图编辑说明','选择“城市、山脉、森林”等插件后，轻触地图即可插入。点选已有元素后可拖动；“底图”可从相册插入自制地图或参考图。所有坐标与图片只保存在本机。');
 else if(a==='graph-reset'){graphPositions={};render();}
 else if(a==='edit-calendar'){openForm('calendar',p.modules.calendar[0]);}
 else if(a==='export')exportBackup(false);
 else if(a==='export-encrypted')exportBackup(true);
 else if(a==='import')importBackup();
 else if(a==='install-help')showInstallHelp();
 else if(a==='privacy-info')showInfo('数据保存说明','GitHub 只保存这个工具的网页代码，不保存你填写的角色、剧情、地图和正文。创作数据保存在当前 iPhone / iPad 浏览器的 IndexedDB 中。清除 Safari 网站数据、换手机或删除主屏幕 App 都可能导致本机资料丢失，因此请定期导出加密备份到“文件”或 iCloud Drive。');
 else if(a==='rename-project')renameProject();
 else if(a==='pin')setPin();
 else if(a==='clear-data')confirmModal('清空当前作品','这会删除当前作品的全部设定、地图和正文。请先导出备份。',()=>{const fresh=blankProject(p.title);fresh.id=p.id;state.projects[state.projects.findIndex(x=>x.id===p.id)]=fresh;save();route='home';render();},'全部清空');
}

function showQuickAdd(){const keys=['characters','relationships','organizations','worldPlot','geography','items','plotLines','stories','manuscripts','reminders'];showSheet('快速新建','选择要创建的内容',`<div class="module-grid">${keys.map(k=>{const m=moduleMap[k];return`<button class="card module-card" data-quick-module="${k}"><span class="module-icon">${m.icon}</span><b>${m.name}</b><p>${m.desc}</p></button>`}).join('')}</div>`);$$('[data-quick-module]').forEach(b=>b.onclick=()=>{closeSheet();if(b.dataset.quickModule==='manuscripts')newManuscript();else{currentModule=b.dataset.quickModule;openForm(currentModule);}});}
function showProjects(){showSheet('作品空间','每个世界的数据相互独立',`<div class="list">${state.projects.map(p=>`<button class="card list-item" data-project-id="${p.id}"><span class="thumb">${esc((p.title||'世')[0])}</span><span class="list-main"><b>${esc(p.title)}</b><p>${esc(p.subtitle||'私人创作空间')} · ${fmtDate(p.updatedAt)}</p></span>${p.id===state.activeProjectId?'<i class="chip">当前</i>':'<span class="chev">›</span>'}</button>`).join('')}</div><button class="primary" style="width:100%;margin-top:12px" id="newProjectBtn">＋ 新建作品</button>`);$$('[data-project-id]').forEach(b=>b.onclick=()=>{state.activeProjectId=b.dataset.projectId;selectedMapId=null;save();closeSheet();route='home';render();});$('#newProjectBtn').onclick=()=>{const n=prompt('新作品名称','未命名世界');if(n){const p=blankProject(n);state.projects.push(p);state.activeProjectId=p.id;save();closeSheet();route='home';render();}};}
function showSearch(){showSheet('全局搜索','搜索角色、设定、剧情、正文和标签',`<div class="searchbar"><input id="globalSearch" autofocus placeholder="输入至少一个关键词"></div><div id="searchResults" class="list"></div>`);const input=$('#globalSearch');setTimeout(()=>input.focus(),50);input.oninput=()=>{const q=input.value.trim().toLowerCase();const rs=q?allItems().filter(x=>JSON.stringify(x).toLowerCase().includes(q)).slice(0,40):[];$('#searchResults').innerHTML=rs.length?rs.map(renderListItem).join(''):(q?'<div class="empty"><p>没有找到匹配内容</p></div>':'');bindInteractions($('#searchResults'));};}
function renameProject(){const p=activeProject();showSheet('修改作品信息','用于首页和主屏幕显示',`<div class="form-grid"><div class="field full"><label>作品名称</label><input id="projectName" value="${esc(p.title)}"></div><div class="field full"><label>副标题</label><input id="projectSub" value="${esc(p.subtitle||'')}"></div></div>`,`<button class="secondary" data-action="close-sheet">取消</button><button class="primary" id="saveProject">保存</button>`);$('#saveProject').onclick=()=>{p.title=$('#projectName').value.trim()||'未命名世界';p.subtitle=$('#projectSub').value.trim();save();closeSheet();render();};}
function setPin(){if(state.settings.pinHash){const choice=confirm('确定关闭应用锁吗？点击“取消”可改为新的 PIN。');if(choice){state.settings.pinHash='';save();render();toast('应用锁已关闭');return;}}const pin=prompt('设置 4–12 位 PIN（请牢记）','');if(!pin)return;if(!/^\d{4,12}$/.test(pin)){toast('请输入 4–12 位数字');return;}hashText(pin).then(h=>{state.settings.pinHash=h;unlocked=true;save();toast('应用锁已设置');});}
function showInfo(title,text){showSheet(title,'',`<div class="card detail-section"><div style="white-space:pre-wrap;font-size:13px;line-height:1.8">${esc(text)}</div></div><button class="primary" style="width:100%;margin-top:12px" data-action="close-sheet">知道了</button>`);}
function showInstallHelp(){showInfo('添加到 iPhone 主屏幕','1. 请使用 Safari 打开本网页。\n2. 点击 Safari 底部的“分享”按钮。\n3. 向下滑，选择“添加到主屏幕”。\n4. 名称保持“世界观工坊”，点击右上角“添加”。\n\n之后从主屏幕图标打开，会以全屏 App 方式运行。首次打开后即可离线使用。');}
function pickImage(cb){const input=$('#filePicker');input.accept='image/*';input.onchange=()=>{const f=input.files[0];if(!f)return;if(f.size>8*1024*1024){toast('图片过大，请选择 8MB 以下图片');return;}const r=new FileReader();r.onload=()=>cb(r.result);r.readAsDataURL(f);input.value='';};input.click();}
function checkDueReminders(){const due=activeProject().modules.reminders.filter(r=>r.status!=='已完成'&&r.due&&new Date(r.due)<=new Date());if(due.length)toast(`有 ${due.length} 条提醒已到期`);}

async function exportBackup(encrypted){try{const data=JSON.stringify({format:'NovelWorldBackup',version:3,exportedAt:nowISO(),state});let content=data,name=`世界观工坊-${safeName(activeProject().title)}-${new Date().toISOString().slice(0,10)}.json`;if(encrypted){const pwd=prompt('设置备份密码（导入时必须使用）','');if(!pwd)return;content=JSON.stringify(await encryptText(data,pwd));name=name.replace('.json','.nwbackup');}downloadText(content,name);state.settings.lastBackup=nowISO();save();toast(encrypted?'加密备份已导出':'备份已导出');}catch(e){console.error(e);toast('导出失败');}}
function importBackup(){const input=$('#filePicker');input.accept='.json,.nwbackup,application/json';input.onchange=async()=>{try{const text=await input.files[0].text();let obj=JSON.parse(text);if(obj.salt&&obj.iv&&obj.data){const pwd=prompt('输入备份密码','');if(!pwd)return;obj=JSON.parse(await decryptText(obj,pwd));}if(obj.format!=='NovelWorldBackup'||!obj.state)throw new Error('格式错误');confirmModal('导入备份','导入将覆盖当前所有本机作品与设置。',()=>{state=obj.state;normalizeState();dbSet(STATE_KEY,state);selectedMapId=null;route='home';render();toast('备份已导入');},'覆盖导入');}catch(e){console.error(e);toast('无法读取备份，可能密码或文件不正确');}finally{input.value='';}};input.click();}
function safeName(v){return String(v||'作品').replace(/[\\/:*?"<>|]/g,'-').slice(0,40);}
function downloadText(text,name){const blob=new Blob([text],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function b64(buf){return btoa(String.fromCharCode(...new Uint8Array(buf)));}function unb64(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0));}
async function deriveKey(password,salt){const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(password),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:180000,hash:'SHA-256'},base,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);}
async function encryptText(text,password){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),key=await deriveKey(password,salt),data=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(text));return{format:'NovelWorldEncryptedBackup',salt:b64(salt),iv:b64(iv),data:b64(data)};}
async function decryptText(obj,password){const salt=unb64(obj.salt),iv=unb64(obj.iv),key=await deriveKey(password,salt),data=await crypto.subtle.decrypt({name:'AES-GCM',iv},key,unb64(obj.data));return new TextDecoder().decode(data);}

init();
