export function rasterizeProjected(triangles,w,h){
 const pixels=new Uint8ClampedArray(w*h*4),depth=new Float32Array(w*h);depth.fill(-Infinity);
  for(const t of triangles){
   const v=t.v;
   const [a,b,c]=v,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-8)continue;
   const left=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),right=Math.min(w-1,Math.ceil(Math.max(a[0],b[0],c[0]))),top=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),bottom=Math.min(h-1,Math.ceil(Math.max(a[1],b[1],c[1])));
   for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
    const px=x+.5,py=y+.5,u=((b[1]-c[1])*(px-c[0])+(c[0]-b[0])*(py-c[1]))/den,vv=((c[1]-a[1])*(px-c[0])+(a[0]-c[0])*(py-c[1]))/den,ww=1-u-vv;
    if(u<-.00001||vv<-.00001||ww<-.00001)continue;
    const z=u*a[2]+vv*b[2]+ww*c[2],idx=y*w+x;if(z<=depth[idx])continue;
    depth[idx]=z;const k=idx*4;for(let ch=0;ch<3;ch++)pixels[k+ch]=t.colors?u*t.colors[0][ch]+vv*t.colors[1][ch]+ww*t.colors[2][ch]:t.rgb[ch];pixels[k+3]=255;
   }
  }
 return pixels;
}
// Small self-contained 3D mesh renderer. No remote library, textures or frame images.
const TAU=Math.PI*2;
export function shortestTurn(from,to){return Math.atan2(Math.sin(to-from),Math.cos(to-from));}
export function advanceHeading(from,to,dt){const delta=shortestTurn(from,to),step=Math.min(Math.abs(delta)*(1-Math.exp(-10*dt)),2.8*dt);return from+Math.sign(delta)*step;}
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]);
const mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const normal=a=>mul(a,1/(Math.hypot(...a)||1));
// Two-bone leg: the knee always bends toward the person's forward (+Z) side.
// Prescribe a small, constant support-knee bend. Derive the pelvis and feet
// from the same leg length so that support transfer cannot drop the pelvis.
// The swing knee bends with zero first/second derivatives at contact.
export function gaitPose(phase,moving=true){
 if(!moving)return {pelvis:[0,.971,0],feet:[-1,1].map(side=>({side,ankle:[side*.112,.112,0],pitch:0,stance:true,t:0}))};
 const pelvisX=.004*Math.sin(phase),stride=.125,standingReach=.86*Math.cos(.12/2);
 const pelvisY=.112+Math.sqrt(standingReach**2-(stride*Math.cos(phase))**2-pelvisX**2);
 const feet=[-1,1].map(side=>{
  const cycle=(((phase/TAU)+(side<0?.5:0))%1+1)%1,stance=cycle<.5,t=stance?cycle*2:(cycle-.5)*2;
  const z=stride*Math.cos(TAU*cycle),bend=.12+(stance?0:.75*Math.sin(Math.PI*t)**4);
  const reach=.86*Math.cos(bend/2);
  const ankleY=pelvisY-Math.sqrt(reach**2-pelvisX**2-z*z);
  return {side,ankle:[side*.112,ankleY,z],pitch:-.075*Math.cos(TAU*cycle),stance,t};
 });
 return {pelvis:[pelvisX,pelvisY,0],feet};
}
export function legPose(side,phase,moving=true){
 const gait=gaitPose(phase,moving),foot=gait.feet.find(f=>f.side===side),hip=[side*.112+gait.pelvis[0],gait.pelvis[1],gait.pelvis[2]],ankle=foot.ankle;
 const delta=sub(ankle,hip),d=Math.hypot(...delta),axis=normal(delta),length=.43,reach=Math.min(d,length*2-.00001),height=Math.sqrt(Math.max(0,length*length-(reach/2)**2));
 const pole=normal(sub([0,0,1],mul(axis,dot([0,0,1],axis))));
 const knee=add(add(hip,mul(axis,reach/2)),mul(pole,height));
 return {hip,knee,ankle,stance:foot.stance,pitch:foot.pitch,pelvis:gait.pelvis};
}
export function armPose(side,phase,moving=true){
 const leg=legPose(side,phase,moving),angle=moving?-.27*leg.ankle[2]/.14:0,bend=.25;
 const shoulder=[side*.23,1.435,0],upper=Math.sqrt(.25**2-.02**2);
 const elbow=[side*.25,shoulder[1]-upper*Math.cos(angle),upper*Math.sin(angle)];
 const wrist=[elbow[0],elbow[1]-.23*Math.cos(angle+bend),elbow[2]+.23*Math.sin(angle+bend)];
 return {shoulder,elbow,wrist};
}
const sphere=[];
for(let j=0;j<6;j++)for(let i=0;i<10;i++){
 const v=(u,w)=>[Math.sin(w)*Math.cos(u),Math.cos(w),Math.sin(w)*Math.sin(u)];
 const a=v(i*TAU/10,j*Math.PI/6),b=v((i+1)*TAU/10,j*Math.PI/6),c=v((i+1)*TAU/10,(j+1)*Math.PI/6),d=v(i*TAU/10,(j+1)*Math.PI/6);
 sphere.push([a,b,c],[a,c,d]);
}
const ellipsoidGeometry=new Map();
export function createWalker3D(canvas){
 const ctx=canvas.getContext('2d');canvas.width=162;canvas.height=246;
 let heading=null,last=0,phase=0,cachedHead=null;
 const reduced=typeof matchMedia==='function'?matchMedia('(prefers-reduced-motion: reduce)'):null;
 function draw(target,walking,now=performance.now()){
  const dt=last?Math.min(.05,Math.max(0,(now-last)/1000)):0;last=now;
  if(heading===null)heading=target;else heading=reduced?.matches?target:advanceHeading(heading,target,dt);
  if(walking&&!reduced?.matches)phase=(phase+dt*4.8)%TAU;
  const moving=walking||phase!==0,gait=gaitPose(phase,moving),bob=0;
  const meshes=[],swing=walking||phase?Math.sin(phase):0;
  function triangle(vertices,color,normals=null){meshes.push({vertices,color,normals});}
  function ellipsoid(center,radii,color,filter){
   const key=radii.join(',');let geometry=ellipsoidGeometry.get(key);
   if(!geometry){geometry=sphere.map(tri=>({unit:tri,offsets:tri.map(v=>v.map((x,i)=>x*radii[i])),normals:tri.map(v=>normal(v.map((x,i)=>x/radii[i])))}));ellipsoidGeometry.set(key,geometry);}
   for(const tri of geometry){if(filter&&!filter(tri.unit.reduce((s,p)=>add(s,p),[0,0,0]).map(v=>v/3)))continue;
    triangle(tri.offsets.map(v=>add(center,v)),color,tri.normals);
   }
  }
  function bone(a,b,r1,r2,color){
   const axis=normal(sub(b,a)),u=normal(cross(axis,Math.abs(axis[1])<.9?[0,1,0]:[1,0,0])),v=cross(axis,u);
   for(let i=0;i<12;i++){
    const ring=(p,r,t)=>add(p,add(mul(u,Math.cos(t)*r),mul(v,Math.sin(t)*r)));
    const p=ring(a,r1,i*TAU/12),q=ring(a,r1,(i+1)*TAU/12),r=ring(b,r2,(i+1)*TAU/12),s=ring(b,r2,i*TAU/12);
    const slope=(r1-r2)/(Math.hypot(...sub(b,a))||1),ringNormal=t=>normal(add(add(mul(u,Math.cos(t)),mul(v,Math.sin(t))),mul(axis,slope)));
    const n1=ringNormal(i*TAU/12),n2=ringNormal((i+1)*TAU/12);
    triangle([p,q,r],color,[n1,n2,n2]);triangle([p,r,s],color,[n1,n2,n1]);
   }
   ellipsoid(a,[r1,r1,r1],color);ellipsoid(b,[r2,r2,r2],color);
  }
  const skin=[247,207,170],teal=[246,247,242],navy=[73,99,120],shoe=[104,66,43],hair=[68,47,34];
  for(const side of [-1,1]){
   const gait=side*swing;
   const legStart=meshes.length;
   const {hip,knee,ankle,pitch}=legPose(side,phase,moving);
   bone(hip,knee,.093,.073,navy);bone(knee,ankle,.072,.05,navy);
   const footStart=meshes.length;
   ellipsoid(add(ankle,[0,-.038,.055]),[.072,.047,.132],shoe);
   ellipsoid(add(ankle,[0,-.07,.06]),[.075,.018,.137],[75,48,33]);
   const cp=Math.cos(pitch),sp=Math.sin(pitch);
   for(let j=footStart;j<meshes.length;j++){
    meshes[j].vertices=meshes[j].vertices.map(p=>{const d=sub(p,ankle);return [p[0],ankle[1]+d[1]*cp-d[2]*sp,ankle[2]+d[1]*sp+d[2]*cp];});
    if(meshes[j].normals)meshes[j].normals=meshes[j].normals.map(n=>[n[0],n[1]*cp-n[2]*sp,n[1]*sp+n[2]*cp]);
   }
   for(let j=legStart;j<meshes.length;j++)meshes[j].world=true;
   const {shoulder,elbow,wrist}=armPose(side,phase,walking||phase!==0);
   bone(shoulder,elbow,.066,.049,teal);bone(elbow,wrist,.049,.036,teal);
   ellipsoid(add(wrist,[0,.025,0]),[.043,.025,.043],[227,232,229]);ellipsoid(add(wrist,[0,-.035,0]),[.036,.055,.031],skin);
  }
  ellipsoid([0,1.22,0],[.23,.285,.132],teal);
  ellipsoid([0,.985,0],[.189,.065,.125],navy);
  // Shirt placket, open collar, belt and a small chest pocket.
  ellipsoid([0,1.001,0],[.192,.028,.13],[110,72,48]);
  triangle([[-.03,.98,.134],[.03,.98,.134],[.03,1.025,.134]],[192,185,157]);triangle([[-.03,.98,.134],[.03,1.025,.134],[-.03,1.025,.134]],[192,185,157]);
  bone([.085,1.29,.116],[.15,1.29,.101],.003,.003,[208,216,215]);

  bone([0,1.03,.13],[0,1.43,.105],.005,.005,[212,220,220]);
  bone([-.07,1.477,.065],[0,1.435,.118],.015,.009,[253,253,247]);
  bone([.07,1.477,.065],[0,1.435,.118],.015,.009,[253,253,247]);
  bone([0,1.06,-.13],[0,1.42,-.103],.003,.003,[218,224,222]);
  ellipsoid([0,1.51,0],[.06,.075,.06],skin);

  const headStart=meshes.length;
  if(cachedHead)meshes.push(...cachedHead.map(m=>({...m})));else {
  for(const side of [-1,1]){
   ellipsoid([side*.117,1.677,0],[.021,.035,.025],skin);
   ellipsoid([side*.043,1.709,.099],[.026,.026,.013],[255,254,245]);
   ellipsoid([side*.043,1.708,.115],[.017,.021,.008],[104,68,43]);
   ellipsoid([side*.043,1.708,.121],[.010,.016,.005],[39,32,28]);
   ellipsoid([side*.039,1.718,.125],[.005,.006,.003],[255,255,250]);
   bone([side*.025,1.733,.099],[side*.062,1.735,.091],.005,.005,hair);
  }
  ellipsoid([0,1.672,.11],[.014,.018,.014],[242,192,151]);
  bone([-.028,1.632,.101],[0,1.622,.109],.003,.003,[163,103,75]);
  bone([0,1.622,.109],[.028,1.632,.101],.003,.003,[163,103,75]);

  // One watertight head surface with two materials. Hair is not a second shell:
  // overlapping scalp and skull previously caused the skin to cut through the hair.
  const headPoint=(angle,t,cap)=>{
   const front=Math.max(0,Math.sin(angle)),back=Math.max(0,-Math.sin(angle));
   const fringe=front*.27*(.55+.45*Math.cos((angle-Math.PI/2)*10));
   const edge=Math.acos(Math.max(-.9,Math.min(.9,-.18+.70*front-.43*back-fringe)));
   const polar=cap?edge*t:edge+(Math.PI-edge)*t;
   const strand=cap?1+.06*Math.sin(angle*11+polar*2)*Math.sin(polar):1;
   return [.116*Math.sin(polar)*Math.cos(angle)*strand,1.685+.151*Math.cos(polar)*strand,.106*Math.sin(polar)*Math.sin(angle)*strand];
  };
  const headNormal=(angle,t,cap)=>{
   const p=headPoint(angle,t,cap),da=sub(headPoint(angle+.0005,t,cap),headPoint(angle-.0005,t,cap)),dt=sub(headPoint(angle,Math.min(.99999,t+.0005),cap),headPoint(angle,Math.max(.00001,t-.0005),cap));
   let n=normal(cross(da,dt));if(dot(n,[p[0],p[1]-1.685,p[2]])<0)n=mul(n,-1);
   if(Math.hypot(...n)<.1)n=[0,t<.5?1:-1,0];return n;
  };
  for(const cap of [true,false])for(let row=0;row<16;row++)for(let col=0;col<48;col++){
   const u=col*TAU/48,v=(col+1)*TAU/48,t=row/16,q=(row+1)/16;
   const a=headPoint(u,t,cap),b=headPoint(v,t,cap),c=headPoint(v,q,cap),d=headPoint(u,q,cap);
   const na=headNormal(u,t,cap),nb=headNormal(v,t,cap),nc=headNormal(v,q,cap),nd=headNormal(u,q,cap);
   triangle([a,b,c],cap?hair:skin,[na,nb,nc]);triangle([a,c,d],cap?hair:skin,[na,nc,nd]);
  }
  }
  // Compact, illustrated proportions. Transform the entire head and its features
  // together, keeping occlusion and anatomical leg calculations intact.
  for(let i=0;i<meshes.length;i++){
   const head=i>=headStart;if(head&&cachedHead)continue;
   if(meshes[i].normals)meshes[i].normals=meshes[i].normals.map((n,j)=>{
    const y=meshes[i].vertices[j][1];return normal([n[0]/(head?2.1:1),n[1]/((head?1.85:1)*(y<=1?.83:.88)),n[2]/(head?1.9:1)]);
   });
   meshes[i].vertices=meshes[i].vertices.map(p=>{let [x,y,z]=p;if(head){x*=2.1;y=1.78+(y-1.685)*1.85;z*=1.9;}return [x,y<=1?y*.83:.83+(y-1)*.88,z];});
  }
  if(!cachedHead)cachedHead=meshes.slice(headStart).map(m=>({...m}));
  const theta=Math.PI-heading,co=Math.cos(theta),si=Math.sin(theta);
  const rotate=(p,world=false)=>{
   const x=p[0]+(world?0:gait.pelvis[0]),y=p[1]+(world?0:(gait.pelvis[1]-.954)*.83),z=p[2]+(world?0:gait.pelvis[2]);
   return [x*co+z*si,y+bob,-x*si+z*co];
  };
  const project=p=>[32+p[0]*45,90-p[1]*45+p[2]*5];
  const light=normal([-.4,.75,1]);
  const rotateNormal=n=>[n[0]*co+n[2]*si,n[1],-n[0]*si+n[2]*co];
  const shadeColor=(color,n)=>color.map(c=>Math.round(c*(.78+.22*Math.max(0,dot(n,light)))));
  const triangles=meshes.map(({vertices,color,normals,world})=>{
   const v=vertices.map(p=>rotate(p,world)),n=normal(cross(sub(v[1],v[0]),sub(v[2],v[0])));
   return {v,rgb:shadeColor(color,n),colors:normals?.map(n=>shadeColor(color,rotateNormal(n)))};
  });
  ctx.setTransform(canvas.width/64,0,0,canvas.height/96,0,0);ctx.clearRect(0,0,64,96);
  // Per-pixel depth, rather than triangle-centroid sorting. Hidden ears, hair
  // and facial features cannot bleed through the surface of the head.
  const w=canvas.width,h=canvas.height,pixels=ctx.createImageData(w,h);
  const projected=triangles.map(t=>({rgb:t.rgb,colors:t.colors,v:t.v.map(p=>{const q=project(p);return [q[0]*w/64,q[1]*h/96,p[2]+p[1]*.11];})}));
  pixels.data.set(rasterizeProjected(projected,w,h));
  ctx.putImageData(pixels,0,0);
  ctx.save();ctx.globalCompositeOperation='destination-over';ctx.fillStyle='rgba(28,49,57,.18)';ctx.beginPath();ctx.ellipse(32,90,11,2.7,0,0,TAU);ctx.fill();ctx.restore();
  // A small ground arrow is separate from the upright person.
  ctx.save();ctx.translate(32,91);ctx.rotate(heading);ctx.fillStyle='#7445aa';ctx.beginPath();ctx.moveTo(0,-5);ctx.lineTo(3,2);ctx.lineTo(0,0);ctx.lineTo(-3,2);ctx.fill();ctx.restore();
  canvas.dataset.heading=String(heading);canvas.dataset.phase=String(phase);
 }
 return {draw};
}
