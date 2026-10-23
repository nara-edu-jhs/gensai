import { ui } from './ui-language.js?v=44-walk46';
const GSI='https://cyberjapandata.gsi.go.jp/xyz';
const MAP_CENTER=640,TILE_RADIUS=2;
const HAZARD_OVERLAYS={
  1:['https://disaportaldata.gsi.go.jp/raster/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png'],
  7:['https://disaportaldata.gsi.go.jp/raster/02_naisui_data/{z}/{x}/{y}.png'],
  3:['https://disaportaldata.gsi.go.jp/raster/03_hightide_l2_shinsuishin_data/{z}/{x}/{y}.png'],
  5:['https://disaportaldata.gsi.go.jp/raster/04_tsunami_newlegend_data/{z}/{x}/{y}.png'],
  2:['https://disaportaldata.gsi.go.jp/raster/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png','https://disaportaldata.gsi.go.jp/raster/05_kyukeishakeikaikuiki/{z}/{x}/{y}.png','https://disaportaldata.gsi.go.jp/raster/05_jisuberikeikaikuiki/{z}/{x}/{y}.png']
};
export const DISASTER={1:'洪水',2:'土砂災害',4:'地震',5:'津波',6:'大規模火災'};
function world(lat,lon,z){const n=2**z;return{x:(lon+180)/360*n*256,y:(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*n*256}}
function unworld(x,y,z){const size=2**z*256,longitude=x/size*360-180,n=Math.PI-2*Math.PI*y/size,latitude=180/Math.PI*Math.atan(Math.sinh(n));return{latitude:Math.max(-85.0511,Math.min(85.0511,latitude)),longitude:((longitude+540)%360)-180}}
function tile(lat,lon,z){const p=world(lat,lon,z);return{x:Math.floor(p.x/256),y:Math.floor(p.y/256),px:p.x%256,py:p.y%256}}
export function panMapCenter(center,deltaX,deltaY,z=15){const point=world(center.latitude,center.longitude,z);return unworld(point.x-deltaX,point.y-deltaY,z)}
export function distance(a,b){const r=6371,dLat=(b[1]-a[1])*Math.PI/180,dLon=(b[0]-a[0])*Math.PI/180,s=Math.sin(dLat/2)**2+Math.cos(a[1]*Math.PI/180)*Math.cos(b[1]*Math.PI/180)*Math.sin(dLon/2)**2;return 2*r*Math.asin(Math.sqrt(s))}
export function bearing(a,b){const p1=a[1]*Math.PI/180,p2=b[1]*Math.PI/180,l=(b[0]-a[0])*Math.PI/180,y=Math.sin(l)*Math.cos(p2),x=Math.cos(p1)*Math.sin(p2)-Math.sin(p1)*Math.cos(p2)*Math.cos(l),d=(Math.atan2(y,x)*180/Math.PI+360)%360;return Math.round(d/45)%8}
export function renderBaseMap(root,location,onUnavailable,z=15,alsoCover=null){
 const c=tile(location.latitude,location.longitude,z),radius=Math.max(TILE_RADIUS,Math.ceil(Math.max(root.parentElement?.clientWidth||0,root.parentElement?.clientHeight||0)/512));
 const wanted=new Map(),existing=new Map([...root.querySelectorAll('.map-tile:not(.hazard-tile):not(.context-raster)')].map(img=>[img.src,img]));
 for(const center of [c,...(alsoCover?[tile(alsoCover.latitude,alsoCover.longitude,z)]:[])])
  for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
   const x=center.x+dx,y=center.y+dy;wanted.set(`${GSI}/pale/${z}/${x}/${y}.png`,{x,y});
  }
 let finished=0,loaded=0;
 const done=ok=>{finished++;if(ok)loaded++;if(finished===wanted.size&&!loaded)onUnavailable?.();};
 for(const [src,{x,y}] of wanted){
  let img=existing.get(src);
  if(img)existing.delete(src);else{img=document.createElement('img');img.className='map-tile';img.alt='';img.decoding='async';img.draggable=false;img.src=src;root.prepend(img);}
  img.style.left=`${MAP_CENTER-c.px+(x-c.x)*256}px`;img.style.top=`${MAP_CENTER-c.py+(y-c.y)*256}px`;
  if(img.complete&&img.naturalWidth)done(true);else{
   img.addEventListener('load',()=>done(true),{once:true});
   img.addEventListener('error',()=>{img.remove();done(false);},{once:true});
  }
 }
 for(const img of existing.values())img.remove();
}
export function renderHazardOverlay(root,location,type,enabled,onStatus,z=15){
 root.querySelectorAll('.hazard-tile').forEach(element=>element.remove());
 const revision=Symbol();root.hazardOverlayRevision=revision;
 if(!enabled){onStatus?.('off');return;}
 const layers=HAZARD_OVERLAYS[type];if(!layers){onStatus?.('unsupported');return;}
 const c=tile(location.latitude,location.longitude,z),radius=Math.max(TILE_RADIUS,Math.ceil(Math.max(root.parentElement?.clientWidth||0,root.parentElement?.clientHeight||0)/512));
 const offsetX=MAP_CENTER-c.px,offsetY=MAP_CENTER-c.py,size=(radius*2+1)*256;
 const surface=document.createElement('canvas');surface.className='hazard-tile hazard-mosaic';surface.setAttribute('aria-hidden','true');
 surface.width=surface.height=size;Object.assign(surface.style,{position:'absolute',left:(offsetX-radius*256)+'px',top:(offsetY-radius*256)+'px',width:size+'px',height:size+'px',opacity:'1'});
 const ctx=surface.getContext('2d');ctx.globalAlpha=.72;root.append(surface);
 const total=layers.length*(radius*2+1)**2;let finished=0,loaded=0;
 for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
  const images=new Array(layers.length);let remaining=layers.length;
  const finish=(index,image,url)=>{
   if(root.hazardOverlayRevision!==revision)return;
   finished++;if(image)loaded++;
   images[index]=image?{image,url}:null;
   // Keep source-layer order even if network responses arrive out of order.
   if(--remaining===0){
    for(const entry of images){if(!entry)continue;
     ctx.drawImage(entry.image,(dx+radius)*256,(dy+radius)*256,256,256);
     // PNG export keeps the original source URLs, without visible IMG boxes
     // or a permanent second copy of each decoded tile on the page.
     const source=document.createElement('span');source.hidden=true;source.className='hazard-tile hazard-export-tile';source.dataset.src=entry.url;
     source.style.left=(offsetX+dx*256)+'px';source.style.top=(offsetY+dy*256)+'px';root.append(source);
    }
    images.fill(null);
   }
   if(finished===total)onStatus?.(loaded?'visible':'failed');
  };
  layers.forEach((template,index)=>{
   const url=template.replace('{z}',z).replace('{x}',c.x+dx).replace('{y}',c.y+dy),image=new Image();image.decoding='async';
   image.onload=()=>{image.onload=image.onerror=null;finish(index,image,url);};
   image.onerror=()=>{image.onload=image.onerror=null;finish(index,null,url);};
   image.src=url;
  });
 }
}
export function renderMarkers(root,centerLocation,shelters,onSelect,z=15){const center=world(centerLocation.latitude,centerLocation.longitude,z);root.querySelectorAll('.map-marker').forEach(e=>e.remove());shelters.slice(0,8).forEach((s,i)=>{const p=world(s.coordinates[1],s.coordinates[0],z),m=document.createElement('button');m.type='button';m.className='map-marker';m.textContent=String(i+1);m.setAttribute('aria-label',`${i+1}. ${s.name}`);m.style.left=`${MAP_CENTER+p.x-center.x}px`;m.style.top=`${MAP_CENTER+p.y-center.y}px`;m.addEventListener('mousedown',event=>event.preventDefault());m.addEventListener('click',()=>{m.focus({preventScroll:true});onSelect?.(i)});root.append(m)})}
export function positionCurrentMarker(root,centerLocation,currentLocation,z=15){const marker=root.querySelector('.you-marker');if(!marker)return;const center=world(centerLocation.latitude,centerLocation.longitude,z),point=world(currentLocation.latitude,currentLocation.longitude,z);marker.style.left=`${MAP_CENTER+point.x-center.x}px`;marker.style.top=`${MAP_CENTER+point.y-center.y}px`}
export async function getShelters(location,type){const z=10,c=tile(location.latitude,location.longitude,z),jobs=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)jobs.push(fetch(`${GSI}/skhb0${type}/${z}/${c.x+dx}/${c.y+dy}.geojson`).then(r=>r.ok?r.json():null).catch(()=>null));const sets=await Promise.all(jobs),seen=new Set(),items=[];for(const data of sets){for(const f of data?.features||[]){const p=f.properties||{},coords=f.geometry?.coordinates;if(!Array.isArray(coords)||!Number.isFinite(coords[0]))continue;const key=`${p.name}|${coords.join(',')}`;if(seen.has(key))continue;seen.add(key);const km=distance([location.longitude,location.latitude],coords);if(km<=20)items.push({name:p.name||'名称未登録',address:p.address||'',remarks:p.remarks||'',coordinates:coords,distance:km,direction:bearing([location.longitude,location.latitude],coords)})}}return items.sort((a,b)=>a.distance-b.distance)}
export function gsiMapUrl(location,type){return `https://maps.gsi.go.jp/#15/${location.latitude}/${location.longitude}/&base=std&ls=std%7Cskhb0${type}&disp=11&vs=c1g1j0h0k0l0u0t0z0r0s0m0f1`}

export function fitRouteEndpoints(origin, destination, width, height) {
  const a = world(origin.latitude, origin.longitude, 0);
  const b = world(destination.latitude, destination.longitude, 0);
  let dx = b.x - a.x;
  if (dx > 128) dx -= 256;
  if (dx < -128) dx += 256;
  const dy = b.y - a.y;
  const center = unworld(a.x + dx / 2, a.y + dy / 2, 0);
  const availableWidth = Math.max(40, width - 90);
  const availableHeight = Math.max(40, height - 110);
  let zoom = 17;
  while (zoom > 3 && (Math.abs(dx) * 2 ** zoom > availableWidth || Math.abs(dy) * 2 ** zoom > availableHeight)) zoom--;
  return { center, zoom };
}
export function renderRouteEndpoints(root, centerLocation, origin, destination, z = 15) {
  root.querySelectorAll('.route-endpoint').forEach(el => el.remove());
  if (!origin || !centerLocation) return;
  const center = world(centerLocation.latitude, centerLocation.longitude, z);
  for (const [kind, point, label] of [['origin', origin, '出発地'], ['destination', destination, '目的地']]) {
    if (!point) continue;
    const pos = world(point.latitude, point.longitude, z);
    let dx = pos.x - center.x;
    const size = 256 * 2 ** z;
    if (dx > size / 2) dx -= size;
    if (dx < -size / 2) dx += size;
    const marker = document.createElement('span');
    marker.className = `route-endpoint route-${kind}`;

    marker.textContent = ui(label);
    marker.setAttribute('aria-label', `${label}：${point.name || label}`);
    marker.title = `${label}：${point.name || label}`;
    marker.style.left = `${MAP_CENTER + dx}px`;
    marker.style.top = `${MAP_CENTER + pos.y - center.y}px`;
    root.append(marker);
  }
}

export function projectWalk(point, center, zoom) {
  const p = world(point.latitude, point.longitude, zoom), c = world(center.latitude, center.longitude, zoom);
  const size = 256 * 2 ** zoom;
  let dx = p.x - c.x;
  if (dx > size / 2) dx -= size;
  if (dx < -size / 2) dx += size;
  return {x:640 + dx, y:640 + p.y - c.y};
}
export function unprojectWalk(x, y, center, zoom) {
  const c = world(center.latitude, center.longitude, zoom);
  return unworld(c.x + x - 640, c.y + y - 640, zoom);
}
