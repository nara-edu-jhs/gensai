const BASE='https://disaportaldata.gsi.go.jp/raster';
const LAYERS={
  1:[`${BASE}/01_flood_l2_shinsuishin_data/{z}/{x}/{y}.png`],
  7:[`${BASE}/02_naisui_data/{z}/{x}/{y}.png`],
  3:[`${BASE}/03_hightide_l2_shinsuishin_data/{z}/{x}/{y}.png`],
  5:[`${BASE}/04_tsunami_newlegend_data/{z}/{x}/{y}.png`],
  2:[`${BASE}/05_dosekiryukeikaikuiki/{z}/{x}/{y}.png`,`${BASE}/05_kyukeishakeikaikuiki/{z}/{x}/{y}.png`,`${BASE}/05_jisuberikeikaikuiki/{z}/{x}/{y}.png`]
};
const cache=new Map();
function tilePoint(location,z=15){const n=2**z,x=(location.longitude+180)/360*n,y=(1-Math.asinh(Math.tan(location.latitude*Math.PI/180))/Math.PI)/2*n;return{x:Math.floor(x),y:Math.floor(y),px:Math.floor((x-Math.floor(x))*256),py:Math.floor((y-Math.floor(y))*256),z}}
async function loadPixels(url){if(cache.has(url))return cache.get(url);const task=fetch(url).then(async response=>{if(!response.ok)return null;const bitmap=await createImageBitmap(await response.blob());const canvas=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(256,256):document.createElement('canvas');canvas.width=256;canvas.height=256;const context=canvas.getContext('2d',{willReadFrequently:true});context.drawImage(bitmap,0,0,256,256);bitmap.close?.();return context}).catch(()=>null);cache.set(url,task);return task}
async function probe(urlTemplate,location){const p=tilePoint(location),url=urlTemplate.replace('{z}',p.z).replace('{x}',p.x).replace('{y}',p.y),context=await loadPixels(url);if(!context)return{available:false,hit:false};const alpha=context.getImageData(p.px,p.py,1,1).data[3];return{available:true,hit:alpha>20}}
async function probeType(type,location){const results=await Promise.all(LAYERS[type].map(url=>probe(url,location)));return{available:results.some(x=>x.available),hit:results.some(x=>x.hit)}}
function nearbyPoints(location){const latStep=0.0045,lonStep=latStep/Math.max(.25,Math.cos(location.latitude*Math.PI/180));return[{latitude:location.latitude+latStep,longitude:location.longitude},{latitude:location.latitude-latStep,longitude:location.longitude},{latitude:location.latitude,longitude:location.longitude+lonStep},{latitude:location.latitude,longitude:location.longitude-lonStep}]}
export async function analyzeHazards(location){const types=[5,2,1,3,7],current=await Promise.all(types.map(type=>probeType(type,location))),risks=[];for(let i=0;i<types.length;i++){const type=types[i],here=current[i];if(here.hit){risks.push({type,status:'inside'});continue}if(!here.available){risks.push({type,status:'unknown'});continue}const near=await Promise.all(nearbyPoints(location).map(point=>probeType(type,point)));risks.push({type,status:near.some(x=>x.hit)?'nearby':'notDetected'})}risks.push({type:4,status:'always'});risks.push({type:6,status:'realtime'});return risks}
export function choosePriority(risks){return risks.find(x=>x.status==='inside')?.type??risks.find(x=>x.status==='nearby')?.type??4}
