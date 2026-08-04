'use strict';

/* NovelWorld visual rebuild: dashboard, relationship network and swimlane timeline. */
let nwGraphFilter='all';
let nwGraphFocus='';
let nwTimelineFilter='all';

function nwArray(v){return Array.isArray(v)?v:[];}
function nwSplitNames(v){return String(v||'').split(/[、,，/&与；;\n]/).map(x=>x.trim()).filter(Boolean);}
function nwFirstText(...vals){return vals.find(v=>String(v||'').trim())||'';}
function nwClamp(n,min,max){return Math.max(min,Math.min(max,n));}
function nwTone(label,source=''){
  const s=`${label||''} ${source||''}`;
  if(/恋人|朋友|亲属|家人|守护|师徒|盟友|依赖|恩情|承诺|挚友|爱/.test(s))return'emotion';
  if(/宿敌|仇敌|敌对|血仇|背叛|竞争|恶化|断裂|战争|冲突/.test(s))return'hostile';
  if(/羁绊|债务|共同秘密|误解|宿命/.test(s))return'bond';
  if(/持有|归属|领袖|成员|隶属|位于|常驻|出生/.test(s))return'link';
  return'neutral';
}
function nwKindIcon(kind){return({角色:'♙',组织:'⌂',道具:'◇',地点:'⌖',关联对象:'•'})[kind]||'•';}
function nwKindClass(kind){return({角色:'character',组织:'organization',道具:'item',地点:'place',关联对象:'other'})[kind]||'other';}

function nwGraphData(){
  const p=activeProject();
  const nodes=[];const edges=[];const nameMap=new Map();const nodeMap=new Map();
  const addNode=(id,label,kind,module='',itemId='',image='',aliases='')=>{
    label=String(label||'未命名').trim()||'未命名';
    if(nodeMap.has(id))return nodeMap.get(id);
    const n={id,label,kind,module,itemId,image:image||''};nodes.push(n);nodeMap.set(id,n);
    [label,...nwSplitNames(aliases)].forEach(name=>{const k=name.toLowerCase();if(k&&!nameMap.has(k))nameMap.set(k,id);});
    return n;
  };
  nwArray(p.modules.characters).forEach(x=>addNode(`characters:${x.id}`,x.title,'角色','characters',x.id,x.image,x.alias));
  nwArray(p.modules.organizations).forEach(x=>addNode(`organizations:${x.id}`,x.title,'组织','organizations',x.id,x.image,x.alias));
  nwArray(p.modules.items).forEach(x=>addNode(`items:${x.id}`,x.title,'道具','items',x.id,x.image));
  nwArray(p.modules.geography).forEach(x=>addNode(`geography:${x.id}`,x.title,'地点','geography',x.id,x.image));
  nwArray(p.maps).forEach(map=>nwArray(map.items).forEach(x=>{if(!x.label)return;const known=nameMap.get(String(x.label).trim().toLowerCase());if(!known)addNode(`map:${map.id}:${x.id}`,x.label,'地点','','','');}));
  const resolve=(name,kind='关联对象')=>{
    name=String(name||'').trim();if(!name)return'';
    const direct=nameMap.get(name.toLowerCase());if(direct)return direct;
    const id=`other:${name.toLowerCase().replace(/\s+/g,'-')}`;addNode(id,name,kind);return id;
  };
  const addEdge=(s,t,label,source,meta={})=>{
    if(!s||!t||s===t)return;
    const key=[s,t,label].join('|');if(edges.some(e=>e.key===key))return;
    edges.push({key,s,t,label:label||'关系',source,tone:nwTone(label,source),...meta});
  };
  nwArray(p.modules.relationships).forEach(r=>{
    const s=resolve(r.source),t=resolve(r.target);
    addEdge(s,t,r.relation||r.title||'关系','关系',{strength:Number(r.strength)||0,status:r.status||'',direction:r.direction||'双向',itemId:r.id,module:'relationships'});
  });
  nwArray(p.modules.bonds).forEach(r=>{
    const parts=nwSplitNames(r.parties);if(parts.length<2)return;
    const base=resolve(parts[0]);parts.slice(1).forEach(name=>addEdge(base,resolve(name),r.kind||r.title||'羁绊','羁绊',{itemId:r.id,module:'bonds'}));
  });
  nwArray(p.modules.items).forEach(x=>nwSplitNames(x.owner).forEach(owner=>addEdge(resolve(owner),`items:${x.id}`,'持有 / 归属','道具')));
  nwArray(p.modules.characters).forEach(x=>{
    nwSplitNames(x.location).slice(0,2).forEach(place=>addEdge(`characters:${x.id}`,resolve(place,'地点'),'常驻 / 出生','地点'));
  });
  nwArray(p.modules.organizations).forEach(x=>{
    nwSplitNames(x.leader).slice(0,3).forEach(name=>addEdge(resolve(name),`organizations:${x.id}`,'领袖 / 核心','组织'));
  });
  return{nodes,edges,nodeMap};
}

function nwGraphSubset(data){
  let edges=data.edges.slice();let nodes=data.nodes.slice();
  if(nwGraphFilter==='character')edges=edges.filter(e=>data.nodeMap.get(e.s)?.kind==='角色'||data.nodeMap.get(e.t)?.kind==='角色');
  else if(nwGraphFilter==='organization')edges=edges.filter(e=>data.nodeMap.get(e.s)?.kind==='组织'||data.nodeMap.get(e.t)?.kind==='组织');
  else if(nwGraphFilter==='item')edges=edges.filter(e=>data.nodeMap.get(e.s)?.kind==='道具'||data.nodeMap.get(e.t)?.kind==='道具');
  else if(nwGraphFilter==='place')edges=edges.filter(e=>data.nodeMap.get(e.s)?.kind==='地点'||data.nodeMap.get(e.t)?.kind==='地点');
  else if(['emotion','hostile','bond'].includes(nwGraphFilter))edges=edges.filter(e=>e.tone===nwGraphFilter);
  if(nwGraphFocus&&data.nodeMap.has(nwGraphFocus))edges=edges.filter(e=>e.s===nwGraphFocus||e.t===nwGraphFocus);
  const ids=new Set(edges.flatMap(e=>[e.s,e.t]));
  if(nwGraphFocus)ids.add(nwGraphFocus);
  if(nwGraphFilter==='all'&&!nwGraphFocus)nodes=data.nodes;
  else if(['character','organization','item','place'].includes(nwGraphFilter)&&!edges.length){
    const kind={character:'角色',organization:'组织',item:'道具',place:'地点'}[nwGraphFilter];nodes=data.nodes.filter(n=>n.kind===kind);
  }else nodes=data.nodes.filter(n=>ids.has(n.id));
  return{nodes,edges};
}
function nwEnsureGraphLayout(nodes,edges){
  const W=1200,H=760;
  const focus=nwGraphFocus&&nodes.find(n=>n.id===nwGraphFocus);
  if(focus){graphPositions[focus.id]={x:600,y:370};const others=nodes.filter(n=>n.id!==focus.id);others.forEach((n,i)=>{if(!graphPositions[n.id]||graphPositions[n.id].x===600){const a=(Math.PI*2*i/Math.max(others.length,1))-Math.PI/2;const ring=others.length>10?(i%2?285:210):255;graphPositions[n.id]={x:600+ring*Math.cos(a),y:370+ring*.72*Math.sin(a)};}});return;}
  const groups={角色:[],组织:[],道具:[],地点:[],关联对象:[]};nodes.forEach(n=>(groups[n.kind]||groups.关联对象).push(n));
  const centers={角色:[330,310],组织:[870,285],道具:[835,590],地点:[350,590],关联对象:[600,390]};
  Object.entries(groups).forEach(([kind,arr])=>{const [cx,cy]=centers[kind];arr.forEach((n,i)=>{if(graphPositions[n.id])return;const a=(Math.PI*2*i/Math.max(arr.length,1))-Math.PI/2;const ring=arr.length<=1?0:Math.min(190,75+arr.length*11);graphPositions[n.id]={x:nwClamp(cx+ring*Math.cos(a),75,W-75),y:nwClamp(cy+ring*.68*Math.sin(a),70,H-70)};});});
}
function nwGraphFocusCard(data,subset){
  const node=data.nodeMap.get(nwGraphFocus);if(!node)return'';
  const links=data.edges.filter(e=>e.s===node.id||e.t===node.id);
  return`<section class="nw-focus-card"><div class="nw-focus-avatar ${nwKindClass(node.kind)}">${node.image?`<img src="${node.image}" alt="">`:nwKindIcon(node.kind)}</div><div class="nw-focus-copy"><small>${esc(node.kind)}中心关系</small><h3>${esc(node.label)}</h3><p>${links.length?`直接关联 ${links.length} 条 · 当前显示 ${subset.edges.length} 条`:'暂时没有直接关系'}</p></div>${node.module&&node.itemId?`<button class="nw-open-btn" data-item="${esc(node.itemId)}" data-module="${esc(node.module)}">打开档案</button>`:''}</section>`;
}
function renderGraph(){
  const data=nwGraphData();const subset=nwGraphSubset(data);const {nodes,edges}=subset;const W=1200,H=760;nwEnsureGraphLayout(nodes,edges);
  const filters=[['all','全部'],['character','角色'],['organization','组织'],['item','道具'],['place','地点'],['emotion','感情'],['hostile','敌对'],['bond','羁绊']];
  const options=data.nodes.slice().sort((a,b)=>a.kind.localeCompare(b.kind,'zh-CN')||a.label.localeCompare(b.label,'zh-CN'));
  return`<div class="page nw-graph-page"><div class="page-title"><button class="back-btn" data-route="visual">‹</button><div><h1>⌬ 关系网络</h1><p>${data.nodes.length} 个对象 · ${data.edges.length} 条关联，可筛选或聚焦任一对象</p></div><button class="tiny-btn" data-open-module="relationships">编辑关系</button></div>
  <section class="nw-graph-control"><div class="nw-chip-scroll">${filters.map(([k,t])=>`<button class="nw-filter-chip ${nwGraphFilter===k?'active':''}" data-nw-graph-filter="${k}">${t}</button>`).join('')}</div><div class="nw-focus-row"><label>聚焦</label><select id="nwGraphFocus"><option value="">查看全部对象</option>${options.map(n=>`<option value="${esc(n.id)}" ${nwGraphFocus===n.id?'selected':''}>${esc(n.kind)} · ${esc(n.label)}</option>`).join('')}</select><button class="nw-layout-btn" data-action="graph-reset">自动排布</button></div></section>
  ${nwGraphFocusCard(data,subset)}
  ${nodes.length?`<div class="nw-graph-legend"><span><i class="character"></i>角色</span><span><i class="organization"></i>组织</span><span><i class="item"></i>道具</span><span><i class="place"></i>地点</span></div><div class="nw-graph-wrap"><div class="nw-graph-canvas" id="graphCanvas"><svg class="nw-graph-svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none"><defs><marker id="nwArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z"></path></marker></defs>${edges.map(e=>{const a=graphPositions[e.s],b=graphPositions[e.t];if(!a||!b)return'';const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;const arrow=e.direction&&e.direction!=='双向'?' marker-end="url(#nwArrow)"':'';return`<g class="nw-edge tone-${e.tone}"><line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"${arrow}></line><text x="${mx}" y="${my-10}" text-anchor="middle">${esc(e.label)}${e.strength?` · ${e.strength}`:''}</text></g>`}).join('')}</svg>${nodes.map(n=>{const p=graphPositions[n.id]||{x:600,y:370};return`<div class="nw-graph-node ${nwKindClass(n.kind)} ${nwGraphFocus===n.id?'focused':''}" data-nw-node="${esc(n.id)}" style="left:${p.x/W*100}%;top:${p.y/H*100}%"><span class="nw-node-avatar">${n.image?`<img src="${n.image}" alt="">`:nwKindIcon(n.kind)}</span><b>${esc(n.label)}</b><small>${esc(n.kind)}</small></div>`}).join('')}</div></div>`:`<div class="card empty"><div class="empty-icon">⌬</div><h3>当前筛选没有可显示的关系</h3><p>可切换“全部”，或先在关系、羁绊恩怨中建立关联。</p><button class="primary" data-open-module="relationships">新建关系</button></div>`}</div>`;
}
function bindGraph(){
  const canvas=$('#graphCanvas');
  $$('[data-nw-graph-filter]').forEach(b=>b.onclick=()=>{nwGraphFilter=b.dataset.nwGraphFilter;render();});
  const focus=$('#nwGraphFocus');if(focus)focus.onchange=()=>{nwGraphFocus=focus.value;graphPositions={};render();};
  if(!canvas)return;
  canvas.addEventListener('pointerdown',e=>{
    const node=e.target.closest('[data-nw-node]');if(!node)return;e.preventDefault();
    const id=node.dataset.nwNode;let moved=false;const startX=e.clientX,startY=e.clientY;node.setPointerCapture?.(e.pointerId);
    const move=ev=>{if(Math.abs(ev.clientX-startX)+Math.abs(ev.clientY-startY)>7)moved=true;const r=canvas.getBoundingClientRect();const x=nwClamp((ev.clientX-r.left)/r.width*1200,60,1140);const y=nwClamp((ev.clientY-r.top)/r.height*760,60,700);node.style.left=(x/12)+'%';node.style.top=(y/7.6)+'%';graphPositions[id]={x,y};const svg=$('.nw-graph-svg',canvas);if(svg)svg.style.opacity='.45';};
    const up=()=>{window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);if(moved)render();else{nwGraphFocus=nwGraphFocus===id?'':id;graphPositions={};render();}};
    window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true});
  });
}

function nwNumericTime(v,fallback){
  if(v!==''&&v!=null&&Number.isFinite(Number(v)))return Number(v);
  const m=String(v||'').match(/-?\d+(?:\.\d+)?/);return m?Number(m[0]):fallback;
}
function nwTimelineData(mode,items){
  const p=activeProject();const events=[];let fallback=1;
  const push=(lane,module,item,time,label,desc,kind)=>{events.push({lane,module,item,time:time||'',label:label||'未命名事件',desc:desc||'',kind,pos:nwNumericTime(item.order||time,fallback++)});};
  if(mode==='worldPlot'){
    nwArray(p.modules.worldPlot).forEach(x=>push('世界事件','worldPlot',x,x.era,x.title,nwFirstText(x.process,x.cause,x.result),'world'));
    nwArray(p.modules.characterJourney).forEach(x=>push(`角色 · ${x.character||'未指定'}`,'characterJourney',x,x.date,x.title,nwFirstText(x.event,x.change,x.choice),'character'));
    nwArray(p.modules.organizations).filter(x=>x.founding||x.riseFall).forEach(x=>push('组织兴衰','organizations',x,x.founding,x.title,nwFirstText(x.riseFall,x.summary,x.goal),'organization'));
    nwArray(p.modules.plotLines).forEach(x=>push('剧情线','plotLines',x,x.start||x.order,x.title,nwFirstText(x.goal,x.beats,x.status),'plot'));
  }else if(mode==='characterJourney'){
    nwArray(items).forEach(x=>push(`角色 · ${x.character||'未指定'}`,'characterJourney',x,x.date,x.title,nwFirstText(x.event,x.change,x.choice),'character'));
  }else nwArray(items).forEach(x=>push('时间线',mode,x,x.date||x.era,x.title,nwFirstText(x.event,x.process,x.summary),'world'));
  if(nwTimelineFilter!=='all')return events.filter(e=>e.kind===nwTimelineFilter);
  return events;
}
function nwTimelineBoard(events){
  if(!events.length)return`<div class="card empty"><div class="empty-icon">⌁</div><h3>当前筛选没有事件</h3><p>切换“全部”，或新建一条带日期或排序数字的记录。</p></div>`;
  const sorted=events.slice().sort((a,b)=>a.pos-b.pos||a.lane.localeCompare(b.lane,'zh-CN'));
  const slots=[];sorted.forEach(e=>{const key=String(e.pos);if(!slots.some(s=>s.key===key))slots.push({key,pos:e.pos,label:e.time||`阶段 ${slots.length+1}`});});
  const slotIndex=new Map(slots.map((s,i)=>[s.key,i]));const laneMap=new Map();sorted.forEach(e=>{if(!laneMap.has(e.lane))laneMap.set(e.lane,[]);laneMap.get(e.lane).push(e);});
  const width=Math.max(760,170*slots.length+160);
  const lanes=[...laneMap.entries()].map(([lane,arr])=>{
    const collisions=new Map();const bars=arr.map(e=>{const idx=slotIndex.get(String(e.pos))||0;const c=collisions.get(idx)||0;collisions.set(idx,c+1);return{...e,idx,stack:c};});
    const maxStack=Math.max(1,...collisions.values());const height=Math.max(76,28+maxStack*54);
    return`<div class="nw-lane" style="height:${height}px"><div class="nw-lane-label"><b>${esc(lane)}</b><small>${arr.length} 条</small></div><div class="nw-lane-track">${bars.map(e=>`<button class="nw-time-bar ${e.kind}" style="left:${145+e.idx*170}px;top:${12+e.stack*54}px" data-item="${esc(e.item.id)}" data-module="${esc(e.module)}"><small>${esc(e.time||`顺序 ${e.pos}`)}</small><b>${esc(e.label)}</b><span>${esc(e.desc)}</span></button>`).join('')}</div></div>`;
  }).join('');
  return`<div class="nw-timeline-scroll"><div class="nw-timeline-board" style="width:${width}px"><div class="nw-axis"><div class="nw-axis-label">时间</div>${slots.map((s,i)=>`<div class="nw-tick" style="left:${145+i*170}px"><i></i><span>${esc(s.label)}</span></div>`).join('')}</div>${lanes}</div></div>`;
}
function renderTimeline(items,m){
  const filters=m.key==='worldPlot'?[['all','全部'],['world','世界事件'],['character','角色经历'],['organization','组织兴衰'],['plot','剧情线']]:[['all','全部角色'],['character','角色经历']];
  const events=nwTimelineData(m.key,items);
  return`<section class="nw-timeline-intro"><div><small>${m.key==='worldPlot'?'综合世界线':'角色时间线'}</small><h3>${m.key==='worldPlot'?'把同时发生的事情放在同一张图上':'按角色分泳道查看经历与变化'}</h3><p>左右滑动查看时间跨度；点按条状事件可打开原档案。</p></div><span>${events.length}</span></section><div class="nw-chip-scroll nw-timeline-filters">${filters.map(([k,t])=>`<button class="nw-filter-chip ${nwTimelineFilter===k?'active':''}" data-nw-timeline-filter="${k}">${t}</button>`).join('')}</div>${nwTimelineBoard(events)}`;
}
function renderModulePage(key){
  const m=moduleMap[key];const items=activeProject().modules[key].slice().sort((a,b)=>m.timeline?(Number(a.order||9999)-Number(b.order||9999)):sortUpdated(a,b));
  const timelineHasData=m.timeline&&nwTimelineData(key,items).length>0;const body=(items.length||timelineHasData)?(m.timeline?renderTimeline(items,m):`<div class="list">${items.map(x=>renderListItem({...x,_module:key})).join('')}</div>`):renderEmpty(m);
  return`<div class="page"><div class="page-title"><button class="back-btn" data-route="library">‹</button><div><h1>${m.icon} ${m.name}</h1><p>${m.desc}</p></div><button class="tiny-btn" data-action="add-item">＋ 新建</button></div><div class="searchbar"><input id="moduleSearch" placeholder="搜索${m.name}…"><button class="filter-btn" data-action="add-item">＋</button></div><div id="moduleList">${body}</div></div>`;
}

function nwCompletion(){
  const items=allItems();if(!items.length)return 0;let filled=0,possible=0;
  items.forEach(x=>{const m=moduleMap[x._module];nwArray(m?.fields).forEach(f=>{if(['image','notes'].includes(f.key))return;possible++;if(String(x[f.key]??'').trim())filled++;});});
  return possible?Math.min(100,Math.round(filled/possible*100)):0;
}
function nwMiniGraph(){
  const data=nwGraphData();const nodes=data.nodes.slice(0,8);const ids=new Set(nodes.map(n=>n.id));const edges=data.edges.filter(e=>ids.has(e.s)&&ids.has(e.t)).slice(0,10);if(!nodes.length)return`<div class="nw-preview-empty">建立角色和关系后，这里会出现关系网预览</div>`;
  const pos=new Map(nodes.map((n,i)=>[n.id,{x:50+40*Math.cos(Math.PI*2*i/nodes.length),y:50+34*Math.sin(Math.PI*2*i/nodes.length)}]));
  return`<div class="nw-mini-graph"><svg viewBox="0 0 100 100">${edges.map(e=>{const a=pos.get(e.s),b=pos.get(e.t);return`<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"></line>`}).join('')}</svg>${nodes.map(n=>{const p=pos.get(n.id);return`<span class="${nwKindClass(n.kind)}" style="left:${p.x}%;top:${p.y}%">${nwKindIcon(n.kind)}<b>${esc(n.label)}</b></span>`}).join('')}</div>`;
}
function nwMiniTimeline(){
  const events=nwTimelineData('worldPlot',activeProject().modules.worldPlot).slice().sort((a,b)=>a.pos-b.pos).slice(0,5);if(!events.length)return`<div class="nw-preview-empty">记录世界剧情或角色历程后，这里会出现时间线预览</div>`;
  return`<div class="nw-mini-timeline">${events.map((e,i)=>`<div><i class="${e.kind}"></i><span><small>${esc(e.time||`阶段 ${i+1}`)}</small><b>${esc(e.label)}</b></span></div>`).join('')}</div>`;
}
function renderHome(){
  const p=activeProject();const all=allItems();const total=all.length;const words=nwArray(p.modules.manuscripts).reduce((n,x)=>n+wordCount(x.content),0);const completion=nwCompletion();
  const bible=nwArray(p.modules.worldBible)[0]||{};const recent=all.slice().sort(sortUpdated).slice(0,4);const manuscript=nwArray(p.modules.manuscripts).slice().sort(sortUpdated)[0];const reminders=nwArray(p.modules.reminders).filter(x=>x.status!=='已完成');const missing=MODULES.filter(m=>!m.special&&countFor(m.key)===0).slice(0,3);
  const continueBtn=manuscript?`<button class="nw-hero-primary" data-item="${esc(manuscript.id)}" data-module="manuscripts">继续写《${esc(manuscript.title||'未命名稿件')}》</button>`:`<button class="nw-hero-primary" data-action="new-manuscript">开始第一章</button>`;
  return`<div class="page nw-home"><section class="nw-home-hero" ${bible.image?`style="--nw-cover:url('${bible.image.replace(/'/g,"\\'")}')"`:''}><div class="nw-hero-glow"></div><div class="nw-hero-copy"><small>WORLD STUDIO · 私人创作空间</small><h1>${esc(p.title||'我的世界')}</h1><p>${esc(nwFirstText(bible.premise,bible.summary,p.subtitle,'从世界总纲开始，逐步建立人物、历史与故事。'))}</p><div class="nw-hero-actions">${continueBtn}<button class="nw-hero-secondary" data-open-module="worldBible">编辑世界总纲</button></div></div><div class="nw-progress-orb" style="--p:${completion}"><b>${completion}%</b><span>设定完成度</span></div></section>
  <div class="nw-metric-grid"><button data-open-module="characters"><b>${countFor('characters')}</b><span>角色</span><i>♙</i></button><button data-open-module="worldPlot"><b>${countFor('worldPlot')+countFor('characterJourney')}</b><span>时间事件</span><i>⌁</i></button><button data-open-module="manuscripts"><b>${words.toLocaleString()}</b><span>正文字符</span><i>✎</i></button><button data-open-module="reminders"><b>${reminders.length}</b><span>待处理</span><i>◷</i></button></div>
  <div class="section-head nw-home-head"><h2>世界全景</h2><span>实时读取当前设定</span></div><div class="nw-preview-grid"><button class="nw-preview-card" data-open-module="graphs"><div class="nw-preview-title"><span><i>⌬</i><b>关系网络</b></span><em>${nwGraphData().edges.length} 条关联</em></div>${nwMiniGraph()}<footer>打开完整关系网 <b>›</b></footer></button><button class="nw-preview-card" data-open-module="worldPlot"><div class="nw-preview-title"><span><i>⌁</i><b>综合时间线</b></span><em>多泳道视图</em></div>${nwMiniTimeline()}<footer>打开条状时间线 <b>›</b></footer></button></div>
  <div class="section-head nw-home-head"><h2>创作工作台</h2><button data-route="library">全部 28 个板块</button></div><div class="nw-work-grid"><button data-open-module="mapCenter"><i>⌖</i><b>地图中心</b><span>${nwArray(p.maps).reduce((n,m)=>n+nwArray(m.items).length,0)} 个地图标记</span></button><button data-open-module="plotLines"><i>≋</i><b>剧情线</b><span>${countFor('plotLines')} 条主线与支线</span></button><button data-open-module="archiveAudit"><i>✓</i><b>补档案</b><span>${missing.length?`${missing.length} 个优先空白板块`:'主要板块已有内容'}</span></button><button data-action="export-encrypted"><i>⇩</i><b>加密备份</b><span>保存到 iCloud Drive</span></button></div>
  <div class="section-head nw-home-head"><h2>最近编辑</h2><button data-action="search">搜索全部</button></div>${recent.length?`<div class="list">${recent.map(renderListItem).join('')}</div>`:`<div class="card empty"><div class="empty-icon">✦</div><h3>从第一条设定开始</h3><p>建议先写世界总纲，再建立核心角色与冲突。</p><button class="primary" data-open-module="worldBible">新建世界总纲</button></div>`}</div>`;
}

document.addEventListener('click',e=>{
  const f=e.target.closest('[data-nw-timeline-filter]');if(f){nwTimelineFilter=f.dataset.nwTimelineFilter;render();}
});
setTimeout(()=>{try{if(typeof state!=='undefined'&&state)render();}catch(_e){}},0);
