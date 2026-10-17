import { ui } from './ui-language.js?v=43-map-first-fix57';
const ROOT = 'https://disaportal.gsi.go.jp';
const HISTORY = `${ROOT}/hazardmap/maps/config/kakosaigai.geojson`;
const names = {history:'過去の代表的な災害事例',lore:'自然災害伝承碑',underpass:'道路冠水想定箇所'};
const symbols = {history:'歴',lore:'碑',underpass:'低'};
function world(lat,lon,z) {const size=256*2**z; return {x:(lon+180)/360*size,y:(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*size};}
function clean(value) {const node=document.createElement('div');node.innerHTML=String(value??'');return node.textContent.trim();}
export function createContextLayers() {
 const root=document.querySelector('#map-layer'),status=document.querySelector('#context-status'),detail=document.querySelector('#context-detail');
 const toggles={history:document.querySelector('#show-history'),lore:document.querySelector('#show-lore'),underpass:document.querySelector('#show-underpass')};
 let center=null,zoom=15,revision=0,timer;
 const cache=new Map();
 async function load(url) {
  if(cache.has(url))return cache.get(url);
  const promise=(async()=>{const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),12000);try{const response=await fetch(url,{signal:controller.signal});if(response.status===404)return {features:[],missing:true};if(!response.ok)throw Error('HTTP '+response.status);const data=await response.json();if(!Array.isArray(data.features))throw Error('Invalid GeoJSON');return data;}finally{clearTimeout(timeout);}})();
  cache.set(url,promise);promise.catch(()=>cache.delete(url));if(cache.size>120)cache.delete(cache.keys().next().value);return promise;
 }
 function show(feature,type) {
  const p=feature.properties||{},coords=feature.geometry.coordinates;
  detail.replaceChildren();detail.hidden=false;
  const heading=document.createElement('h3');heading.dataset.noRuby='';heading.textContent=clean(p.LoreName||p.title||p.name||p['箇所名']||names[type]);detail.append(heading);
  const fields=type==='lore'?['DisasterName','DisasterKind','DisasterInfo','Address','ModifyReleaseDate','ReleaseDate']:Object.keys(p).filter(key=>!key.startsWith('_')&&!['layers','hiddenLayers','zl','title','style'].includes(key));
  fields.forEach(key=>{if(p[key]==null||typeof p[key]==='object')return;const line=document.createElement('p');const labels={DisasterName:'災害名',DisasterKind:'災害の種類',DisasterInfo:'伝承内容',Address:'所在地',ModifyReleaseDate:'情報更新',ReleaseDate:'公開日'};line.append(document.createTextNode(`${ui(labels[key]||key)}：`));const value=document.createElement('span');value.dataset.noRuby='';value.dataset.publicName='';value.textContent=clean(p[key]);line.append(value);detail.append(line);});
  const link=document.createElement('a');link.target='_blank';link.rel='noopener';link.textContent=ui('公的地図で確認 ↗');
  link.href=type==='lore'?`https://maps.gsi.go.jp/#15/${coords[1]}/${coords[0]}/&base=std&ls=std%7Cdisaster_lore_all&disp=11`:`${ROOT}/maps/?ll=${coords[1]},${coords[0]}&z=15&ls=${type==='underpass'?'kansui_multi':'kakosaigai'}&base=pale`;
  const close=document.createElement('button');close.type='button';close.textContent=ui('閉じる');close.addEventListener('click',()=>{detail.hidden=true;});detail.append(link,document.createTextNode('　'),close);
  document.dispatchEvent(new Event('context-detail-open'));
  detail.scrollIntoView({block:'nearest',behavior:'smooth'});
 }
 function draw(features,type,c,z) {
  const origin=world(c.latitude,c.longitude,z),seen=new Set();let count=0;
  for(const f of features) {
   const coords=f.geometry?.coordinates;if(f.geometry?.type!=='Point'||!Number.isFinite(coords?.[0])||!Number.isFinite(coords?.[1]))continue;
   const key=JSON.stringify(coords)+JSON.stringify(f.properties);if(seen.has(key))continue;seen.add(key);
   const point=world(coords[1],coords[0],z),x=640+point.x-origin.x,y=640+point.y-origin.y;
   if(x<0||x>1280||y<0||y>1280)continue;
   const marker=document.createElement('button');marker.type='button';marker.className=`context-marker ${type}`;marker.textContent=document.documentElement.lang==='ja'?symbols[type]:({history:'H',lore:'M',underpass:'L'})[type];marker.style.left=x+'px';marker.style.top=y+'px';marker.setAttribute('aria-label',`${names[type]}：${clean(f.properties?.LoreName||f.properties?.title||f.properties?.name||'詳細を見る')}`);marker.addEventListener('click',()=>show(f,type));root.append(marker);count++;
  }return count;
 }
 async function vectors(type,c,z) {
  if(type==='history')return [await load(HISTORY)];
  const native=type==='lore'?7:15,point=world(c.latitude,c.longitude,native),x=Math.floor(point.x/256),y=Math.floor(point.y/256);
  const radius=type==='lore'?1:Math.ceil(640/(256*2**(z-native)))+1,urls=[];
  for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++) {
   const tx=x+dx,ty=y+dy;if(tx<0||ty<0||tx>=2**native||ty>=2**native)continue;
   urls.push(type==='lore'?`https://maps.gsi.go.jp/xyz/disaster_lore_all/7/${tx}/${ty}.geojson`:`${ROOT}/data/vector/10_kansui/15/${tx}/${ty}.geojson`);
  }
  return Promise.allSettled(urls.map(load));
 }
 async function render() {
  if(!center)return;const id=++revision,c={...center},z=zoom;
  root.querySelectorAll('.context-marker,.context-raster').forEach(e=>e.remove());
  const active=Object.keys(toggles).filter(type=>toggles[type].checked);if(!active.length){status.textContent='';return;}
  status.textContent=ui('追加情報を読み込み中…');const messages={};
  await Promise.all(active.map(async type=>{
   try {
    if(type==='underpass'&&z<15) {
     const point=world(c.latitude,c.longitude,z),tx=Math.floor(point.x/256),ty=Math.floor(point.y/256);let ok=0,failed=0;
     await Promise.all(Array.from({length:25},(_,i)=>new Promise(resolve=>{
      const dx=i%5-2,dy=Math.floor(i/5)-2,img=document.createElement('img');img.className='map-tile context-raster';img.alt='';img.style.zIndex='2';img.style.left=(640-point.x%256+dx*256)+'px';img.style.top=(640-point.y%256+dy*256)+'px';
      const timer=setTimeout(()=>{failed++;img.remove();resolve();},12000);
      img.onload=()=>{clearTimeout(timer);ok++;resolve();};img.onerror=()=>{clearTimeout(timer);failed++;img.remove();resolve();};
      img.src=`${ROOT}/data/raster/10_kansui/${z}/${tx+dx}/${ty+dy}.png`;if(id===revision)root.append(img);
     })));
     messages[type]=ok?'広域表示中。拡大すると地点の詳細を確認できます。':'この範囲は未収録または取得できませんでした。';
    } else {
     const result=await vectors(type,c,z);if(id!==revision)return;
     const sets=type==='history'?result:result.filter(r=>r.status==='fulfilled').map(r=>r.value);
     const errors=type==='history'?0:result.filter(r=>r.status==='rejected').length;
     const count=draw(sets.flatMap(s=>s.features),type,c,z);
     messages[type]=`${count}地点（地図周辺）${errors?'・一部取得失敗':''}${!count?'・未収録または該当情報なし':''}`;
    }
   } catch {messages[type]='取得できませんでした。通信を確認し、表示を切り替えて再試行してください。';}
  }));
  if(id===revision)status.textContent=active.map(type=>`${ui(names[type])}：${ui(messages[type])}`).join(' ／ ');
 }
 for(const toggle of Object.values(toggles))toggle.addEventListener('change',()=>{detail.hidden=true;clearTimeout(timer);render();});
 return {update(c,z){center=c;zoom=z;revision++;root.querySelectorAll('.context-marker,.context-raster').forEach(e=>e.remove());clearTimeout(timer);timer=setTimeout(render,180);}};
}
