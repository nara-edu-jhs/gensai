import { ui } from './ui-language.js?v=44-walk46';
import { getText } from './i18n.js?v=44-walk46';
const EXPORT_CACHE = 'imakoko-png-tiles-v1';
function plainText(element) {
  const clone = element.cloneNode(true);
  clone.querySelectorAll('rt').forEach(rt => rt.remove());
  return clone.textContent.trim();
}
export function captureMapForPng(map, saved) {
  const width = map.clientWidth, height = map.clientHeight;
  const root = map.querySelector('#map-layer');
  const tiles = [...root.querySelectorAll('img.map-tile,.hazard-export-tile')].map(img => ({
    url:img.src||img.dataset.src,x:width/2 + parseFloat(img.style.left)-640,y:height/2 + parseFloat(img.style.top)-640,
    layer:img.classList.contains('hazard-tile') ? 1 : img.classList.contains('context-raster') ? 2 : 0
  })).filter(tile => tile.x < width && tile.y < height && tile.x+256 > 0 && tile.y+256 > 0).sort((a,b)=>a.layer-b.layer);
  const markers = [...root.querySelectorAll('.map-marker,.you-marker,.route-endpoint,.context-marker')].filter(el=>!el.hidden).map(el=>({
    x:width/2 + (parseFloat(el.style.left)||640)-640,y:height/2 + (parseFloat(el.style.top)||640)-640,
    text:plainText(el),kind:el.classList.contains('route-origin')?'origin':el.classList.contains('route-destination')?'destination':el.classList.contains('you-marker')?'here':el.classList.contains('context-marker')?'context':'shelter',
    selected:el.classList.contains('active-choice')
  }));
  return {language:document.documentElement.lang,width,height,tiles,markers,name:saved.name,savedAt:saved.savedAt,location:saved.state.location,placeName:saved.state.placeName,purpose:saved.purpose,destination:saved.homeDestination,shelters:saved.state.shelters,hasShelters:saved.shelterMarkersEnabled,hazard:saved.state.mapHazard};
}
async function readableTile(url) {
  const cache = 'caches' in window ? await caches.open(EXPORT_CACHE) : null;
  let response = cache ? await cache.match(url) : null;
  if (!response || response.type === 'opaque') {
    response = await fetch(url, {mode:'cors',credentials:'omit',signal:AbortSignal.timeout(12000)});
    if (!response.ok || response.type === 'opaque') throw Error('画像を取得できません');
    if (cache) await cache.put(url, response.clone());
  }
  return createImageBitmap(await response.blob());
}
function wrap(ctx, text, maxWidth) {
  const lines=[]; let line='';
  for (const character of String(text)) {
    if (character==='\n' || (line && ctx.measureText(line+character).width>maxWidth)) {lines.push(line);line=character==='\n'?'':character;}
    else line+=character;
  }
  if(line)lines.push(line);
  return lines;
}
export async function createMapPng(snapshot) {
  const tr = value => ui(value,snapshot.language);
  const words = getText(snapshot.language);
  if (!snapshot.tiles.some(tile=>tile.layer===0)) throw Error(tr('地図の読み込み後に、もう一度PNGを保存してください。'));
  const bitmaps = new Map();
  const queue = [...new Set(snapshot.tiles.map(tile=>tile.url))];
  await Promise.all(Array.from({length:Math.min(4,queue.length)},async()=>{
    while(queue.length){const url=queue.shift();try{bitmaps.set(url,await readableTile(url));}catch{bitmaps.set(url,null);}}
  }));
  const missing = snapshot.tiles.filter(tile=>!bitmaps.get(tile.url)).length;
  const canvas=document.createElement('canvas');
  const scale=Math.min(2,2400/snapshot.width);
  const w=snapshot.width, pad=20, textWidth=w-pad*2;
  const measure=canvas.getContext('2d'); measure.font='16px sans-serif';
  const headerLines=wrap(measure,`${words.appName} / ${snapshot.name}`,textWidth);
  const header=32+headerLines.length*24+30;
  const time=new Intl.DateTimeFormat(snapshot.language || 'ja',{dateStyle:'medium',timeStyle:'short'}).format(snapshot.savedAt);
  const hazardNames={1:'洪水',2:'土砂災害',3:'高潮',5:'津波',7:'内水氾濫'};
  const descriptions={1:'川の水があふれた場合の浸水想定区域',2:'土砂災害の警戒区域・特別警戒区域',3:'高潮の浸水想定区域',5:'津波の浸水想定区域',7:'下水や水路等があふれた場合の浸水想定区域'};
  const rows=[`${tr('出発地・調べた場所')}：${snapshot.placeName || tr('選択した場所')}（${snapshot.location.latitude.toFixed(5)}, ${snapshot.location.longitude.toFixed(5)}）`];
  if(snapshot.destination)rows.push(`${tr('目的地')}：${snapshot.destination.name}（${snapshot.destination.latitude.toFixed(5)}, ${snapshot.destination.longitude.toFixed(5)}）`);
  if(snapshot.hazard)rows.push(`${tr(hazardNames[snapshot.hazard])}：${tr(descriptions[snapshot.hazard])} / ${tr('色は想定区域で、現在の発生状況ではありません。')}`);
  if(snapshot.hasShelters)snapshot.shelters.forEach((s,i)=>rows.push(`${i+1}. ${s.name} / ${tr('直線距離')} ${s.distance<1?Math.round(s.distance*1000)+'m':s.distance.toFixed(1)+'km'}${s.address?' ／ '+s.address:''}`));
  if(missing)rows.push(`注意：地図画像${missing}枚をPNGに取り込めませんでした。空白部分は情報がありません。`);
  rows.push('保存時の情報です。避難場所の開設・道路の安全は未確認です。自治体等の最新情報を優先してください。');
  rows.push('出典：地理院タイル（国土地理院）、ハザードマップポータルサイト');
  rows.push('©︎ 奈良教育大学附属中学校 2026年度前期生徒会');
  measure.font='14px sans-serif';
  const lines=rows.flatMap(row=>[...wrap(measure,tr(row),textWidth),'']);
  const footer=24+lines.length*21+(snapshot.hazard?100:0);
  canvas.width=Math.round(w*scale);canvas.height=Math.round((header+snapshot.height+footer)*scale);
  const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,canvas.height/scale);
  ctx.fillStyle='#102421';ctx.font='bold 16px sans-serif';
  headerLines.forEach((line,i)=>ctx.fillText(line,pad,26+i*24));
  ctx.font='13px sans-serif';ctx.fillText(`${tr('画像の保存日時')}：${time} / ${tr('保存した範囲の地図')}`,pad,header-14);
  ctx.save();ctx.beginPath();ctx.rect(0,header,w,snapshot.height);ctx.clip();ctx.fillStyle='#e8ece9';ctx.fillRect(0,header,w,snapshot.height);
  for(const tile of snapshot.tiles){const bitmap=bitmaps.get(tile.url);if(bitmap)ctx.drawImage(bitmap,tile.x,header+tile.y,256,256);}
  for(const m of snapshot.markers){
    if(m.x<0||m.x>w||m.y<0||m.y>snapshot.height)continue;
    const x=m.x,y=header+m.y;
    ctx.font='bold 15px sans-serif';ctx.lineWidth=3;
    if(['origin','destination','here'].includes(m.kind)){
      const color=m.kind==='origin'?'#155bb5':m.kind==='destination'?'#b72f25':'#b72f25';
      const label=m.text;const width=Math.max(64,ctx.measureText(label).width+22);
      ctx.fillStyle=color;ctx.strokeStyle='#fff';ctx.beginPath();ctx.rect(x-width/2,y-46,width,32);ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(x-8,y-14);ctx.lineTo(x,y);ctx.lineTo(x+8,y-14);ctx.fill();
      ctx.fillStyle='#fff';ctx.textAlign='center';ctx.fillText(label,x,y-24);ctx.textAlign='left';
    }else{
      ctx.fillStyle=m.selected?'#f5a623':m.kind==='context'?'#79519a':'#fff';ctx.strokeStyle='#123a2d';ctx.beginPath();ctx.arc(x,y,17,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=m.kind==='context'?'#fff':'#102421';ctx.textAlign='center';ctx.fillText(m.text,x,y+5);ctx.textAlign='left';
    }
  }
  // Map tiles always use a north-up projection; this arrow needs no live sensors.
  ctx.save();ctx.translate(38,header+48);ctx.fillStyle='#fffffff2';ctx.strokeStyle='#9dafa6';ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,28,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#b93731';ctx.beginPath();ctx.moveTo(0,-16);ctx.lineTo(9,9);ctx.lineTo(0,4);ctx.closePath();ctx.fill();
  ctx.fillStyle='#183d38';ctx.beginPath();ctx.moveTo(0,19);ctx.lineTo(-9,-6);ctx.lineTo(0,-1);ctx.closePath();ctx.fill();
  ctx.textAlign='center';ctx.font='bold 12px sans-serif';ctx.fillStyle='#a42b25';ctx.fillText('N',0,-30);ctx.restore();
  ctx.restore();let y=header+snapshot.height+24;ctx.font='14px sans-serif';ctx.fillStyle='#102421';
  for(const line of lines){if(line)ctx.fillText(line,pad,y);y+=21;}
  if(snapshot.hazard){
    const landslide=snapshot.hazard===2;
    const labels=landslide?['警戒区域','特別警戒区域']:snapshot.hazard===7?['0.1–0.5m','0.5–3m','3–5m','5–10m','10–20m','20m以上']:['0.5m未満','0.5–3m','3–5m','5–10m','10–20m','20m以上'];
    const colors=landslide?['#ffff00','#ff0000']:['#f7f5a9','#ffd8c0','#ffb7b7','#ff9191','#f285c9','#dc7adc'];
    let x=pad;ctx.font='12px sans-serif';
    labels.forEach((label,i)=>{label=tr(label);if(x+125>w-pad){x=pad;y+=25;}ctx.fillStyle=colors[i];ctx.fillRect(x,y-12,18,16);ctx.strokeStyle='#666';ctx.lineWidth=1;ctx.strokeRect(x,y-12,18,16);ctx.fillStyle='#102421';ctx.fillText(label,x+24,y);x+=125;});
  }
  bitmaps.forEach(bitmap=>bitmap?.close());
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('PNG画像を作成できませんでした。')),'image/png'));
  return {blob,missing};
}
export function downloadPng(blob,name) {
  const url=URL.createObjectURL(blob);const a=document.createElement('a');
  const now=new Date();const date=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  a.href=url;a.download=`${name.replace(/[\\/:*?"<>|]/g,'_').slice(0,70)}_${date}.png`;
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
