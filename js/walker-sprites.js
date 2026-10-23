import {createSpritePackLoader} from './walker-sprite-pack.js?v=44-walk46';
import {advanceHeading} from './walker-3d.js?v=44-walk46';

export const SPRITE_LAYOUT=Object.freeze({directions:128,frames:48,columns:7,rows:7,width:162,height:246,standingFrame:48,phaseSpeed:4.8,cacheLimit:4});
const TAU=Math.PI*2,base=new URL('../assets/walker-sprites/',import.meta.url);
const asset=name=>new URL(name,base).href+'?v=44-walk46';

// Same rendered model, without rebuilding or rasterizing its mesh on the device.
export function createWalkerSprites(canvas){
 const L=SPRITE_LAYOUT,ctx=canvas.getContext('2d');canvas.width=L.width;canvas.height=L.height;
 const loader=createSpritePackLoader(asset);
 const cache=new Map();let clock=0,heading=null,phase=0,last=null,posed=false,disposed=false;
 let needed=new Set(),lastPaint=null,draws=0,misses=0;
 const reduced=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
 const fallback=new Image();fallback.decoding='async';fallback.onload=()=>paint();fallback.src=asset('standing.png');
 const ready=new Promise(resolve=>{if(fallback.complete&&fallback.naturalWidth)resolve();else{fallback.addEventListener('load',resolve,{once:true});fallback.addEventListener('error',resolve,{once:true});}});
 function request(index){
  if(cache.has(index)){const e=cache.get(index);e.used=++clock;return e;}
  while(cache.size>=L.cacheLimit){
   const candidate=[...cache].filter(([key])=>!needed.has(key)).sort((a,b)=>a[1].used-b[1].used)[0];
   if(!candidate)break;
   const [key,e]=candidate;cache.delete(key);e.image.onload=e.image.onerror=null;e.image.src='';
  }
  const image=new Image(),entry={image,ready:false,used:++clock};image.decoding='async';cache.set(index,entry);misses++;
  image.onload=()=>{if(disposed||cache.get(index)!==entry)return;entry.ready=image.naturalWidth===L.width*L.columns&&image.naturalHeight===L.height*L.rows;if(entry.url){URL.revokeObjectURL(entry.url);entry.url=null;}paint();};
  image.onerror=()=>{entry.failed=true;if(entry.url){URL.revokeObjectURL(entry.url);entry.url=null;}};
  loader.direction(index).then(blob=>{if(disposed||cache.get(index)!==entry)return;entry.url=URL.createObjectURL(blob);image.src=entry.url;}).catch(()=>{entry.failed=true;});return entry;
 }
 function paint(){
  if(disposed||heading===null)return;
  const position=((heading/TAU%1)+1)%1*L.directions,i=Math.floor(position)%L.directions,j=(i+1)%L.directions,t=position-Math.floor(position);
  needed=new Set([i,j]);
  const a=request(i),b=request(j),available=[];
  if(a.ready)available.push([a.image,1-t]);if(b.ready)available.push([b.image,t]);
  // Keep the previous complete frame while a new direction loads.
  if(!available.length){if(!lastPaint&&fallback.complete&&fallback.naturalWidth){ctx.clearRect(0,0,L.width,L.height);ctx.drawImage(fallback,0,0);lastPaint='fallback';}return;}
  const f=posed?phase/TAU*L.frames:L.standingFrame,f0=Math.floor(f),f1=posed?(f0+1)%L.frames:f0,u=posed?f-f0:0;
  const sum=available.reduce((n,v)=>n+v[1],0);
  // At an exact heading its weighted image may still be loading.
  if(sum<1e-8){available[0][1]=1;}
  const weight=available.reduce((n,v)=>n+v[1],0),key=position.toFixed(4)+','+f.toFixed(4)+','+available.map(v=>v[0].src).join('|');
  if(lastPaint===key)return;
  ctx.clearRect(0,0,L.width,L.height);ctx.globalCompositeOperation='lighter';
  const cell=(image,frame,alpha)=>{if(alpha<.00001)return;ctx.globalAlpha=alpha;ctx.drawImage(image,(frame%L.columns)*L.width,Math.floor(frame/L.columns)*L.height,L.width,L.height,0,0,L.width,L.height);};
  for(const [image,w] of available){cell(image,f0,w/weight*(1-u));cell(image,f1,w/weight*u);}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';lastPaint=key;draws++;
 }
 function draw(target,walking,now=performance.now()){
  const dt=last===null?0:Math.min(.05,Math.max(0,(now-last)/1000));last=now;
  heading=heading===null||reduced?.matches?target:advanceHeading(heading,target,dt);
  if(walking&&!reduced?.matches){posed=true;phase=(phase+dt*L.phaseSpeed)%TAU;}
  canvas.dataset.heading=String(heading);canvas.dataset.phase=String(phase);canvas.dataset.renderer='sprites';paint();
 }
 function dispose(){disposed=true;for(const e of cache.values()){e.image.onload=e.image.onerror=null;e.image.src='';if(e.url)URL.revokeObjectURL(e.url);}cache.clear();loader.clear();fallback.onload=null;fallback.src='';}
 return {draw,ready,dispose,stats:()=>({cachedDirections:cache.size,cachedPacks:loader.size(),readyDirections:[...cache.values()].filter(e=>e.ready).length,draws,misses,decodedBytesUpperBound:cache.size*L.width*L.height*L.columns*L.rows*4})};
}
