// Pure geometry in metres; no road matching or routing service.
export function metres(a, b) {
  const rad = Math.PI / 180, dlat = (b.latitude-a.latitude)*rad, dlon = (b.longitude-a.longitude)*rad;
  const h = Math.sin(dlat/2)**2 + Math.cos(a.latitude*rad)*Math.cos(b.latitude*rad)*Math.sin(dlon/2)**2;
  return 12742000 * Math.asin(Math.sqrt(Math.min(1,h)));
}
export function measure(points) {
  const lengths = [0];
  for (let i=1;i<points.length;i++) lengths.push(lengths[i-1]+metres(points[i-1],points[i]));
  return lengths;
}
export function atDistance(points, lengths, distance) {
  if (!points.length) return null;
  if (distance <= 0) return points[0];
  if (distance >= lengths.at(-1)) return points.at(-1);
  let lo=1, hi=lengths.length-1;
  while(lo<hi) { const mid=(lo+hi)>>1; if(lengths[mid]<distance) lo=mid+1; else hi=mid; }
  const t=(distance-lengths[lo-1])/(lengths[lo]-lengths[lo-1] || 1), a=points[lo-1], b=points[lo];
  let dl=b.longitude-a.longitude; if(dl>180) dl-=360; if(dl< -180) dl+=360;
  return {latitude:a.latitude+(b.latitude-a.latitude)*t,longitude:((a.longitude+dl*t+540)%360)-180};
}
export function samples(points, lengths, step=5) {
  const total=lengths.at(-1)||0, result=[];
  for(let d=0;d<total;d+=step) result.push({distance:d,point:atDistance(points,lengths,d)});
  result.push({distance:total,point:points.at(-1)});
  return result;
}
