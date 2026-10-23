// Four original PNG sheets in one static file; no image recompression.
export function spriteFromPack(buffer,index){
 const bytes=new Uint8Array(buffer),view=new DataView(buffer);
 if(bytes.length<20||bytes[0]!==87||bytes[1]!==83||bytes[2]!==80||bytes[3]!==49||!Number.isInteger(index)||index<0||index>3)throw Error('Invalid sprite pack');
 let offset=20;const ranges=[];
 for(let i=0;i<4;i++){const size=view.getUint32(4+i*4,true);if(size<8||offset+size>bytes.length)throw Error('Invalid sprite length');ranges.push([offset,offset+size]);offset+=size;}
 if(offset!==bytes.length)throw Error('Invalid sprite pack size');
 const [start,end]=ranges[index],signature=[137,80,78,71,13,10,26,10];
 const png=signature.every((v,i)=>bytes[start+i]===v);
 const webp=end-start>=12&&[82,73,70,70].every((v,i)=>bytes[start+i]===v)&&[87,69,66,80].every((v,i)=>bytes[start+8+i]===v);
 if(!png&&!webp)throw Error('Invalid sprite sheet');
 return new Blob([bytes.subarray(start,end)],{type:webp?'image/webp':'image/png'});
}
export function createSpritePackLoader(asset){
 const packs=new Map();
 async function direction(index){
  const key=Math.floor(index/4);
  let pending=packs.get(key);
  if(pending){packs.delete(key);packs.set(key,pending);}else{
   pending=fetch(asset('pack-'+String(key).padStart(2,'0')+'.bin')).then(response=>{if(!response.ok)throw Error('Sprite pack unavailable');return response.arrayBuffer();});
   packs.set(key,pending);
   while(packs.size>2)packs.delete(packs.keys().next().value);
   pending.catch(()=>{if(packs.get(key)===pending)packs.delete(key);});
  }
  return spriteFromPack(await pending,index%4);
 }
 return {direction,clear:()=>packs.clear(),size:()=>packs.size};
}
