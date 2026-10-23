import { LAYERS } from './hazard.js?v=44-walk46';
export const NAMES = {1:'洪水',2:'土砂災害',3:'高潮',5:'津波',7:'内水'};
// Separate bounded cache: full image data, no guesses from colours or depth.
const cache = new Map();
function pixels(url) {
  if(cache.has(url)) return cache.get(url);
  const task=(async()=>{
    const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),8000);
    try {
      const response=await fetch(url,{mode:'cors',signal:controller.signal});
      if(!response.ok) return null;
      const bitmap=await createImageBitmap(await response.blob());
      const canvas=document.createElement('canvas'); canvas.width=canvas.height=256;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      ctx.drawImage(bitmap,0,0); bitmap.close?.();
      return ctx.getImageData(0,0,256,256).data;
    } catch { return null; } finally {clearTimeout(timer);}
  })();
  cache.set(url,task);
  if(cache.size>128) cache.delete(cache.keys().next().value);
  return task;
}
export function clearWalkHazards() {cache.clear();}
export async function checkWalkPoint(point) {
  const z=17,n=2**z, x=(point.longitude+180)/360*n;
  const lat=Math.max(-85.0511,Math.min(85.0511,point.latitude));
  const y=(1-Math.asinh(Math.tan(lat*Math.PI/180))/Math.PI)/2*n;
  const px=Math.floor((x-Math.floor(x))*256), py=Math.floor((y-Math.floor(y))*256);
  return Promise.all(Object.entries(LAYERS).map(async([type,urls])=>{
    const data=await Promise.all(urls.map(template=>pixels(template.replace('{z}',z).replace('{x}',Math.floor(x)).replace('{y}',Math.floor(y)))));
    const hit=data.some(p=>p && p[(py*256+px)*4+3]>20);
    return {type:Number(type),status:hit?'hit':data.every(Boolean)?'uncoloured':'unknown',incomplete:data.some(p=>!p)};
  }));
}
