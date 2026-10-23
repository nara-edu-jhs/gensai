import {projectWalk,unprojectWalk} from './geo.js?v=44-walk46';

// Pan the existing map layer, then commit its displayed center in one paint.
// Walking keeps updating inside the moving layer throughout the transition.
export function createMapFollower({layer,getView,setCenter,redraw,prepare=()=>{},duration=550,reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches}) {
 let active=null;
 function finish(commitTarget=false){
  const a=active;if(!a)return;active=null;cancelAnimationFrame(a.frame);
  const center=commitTarget?a.target:unprojectWalk(640+a.dx*a.progress,640+a.dy*a.progress,a.start,a.zoom);
  layer.style.transform='';delete layer.dataset.walkFollowing;
  setCenter(center);redraw();a.resolve();
 }
 function follow(target){
  finish();
  const {center,zoom}=getView();
  if(!center||reduceMotion()){setCenter(target);redraw();return Promise.resolve();}
  const point=projectWalk(target,center,zoom);
  prepare(target);
  return new Promise(resolve=>{
   const a={start:center,target,zoom,dx:point.x-640,dy:point.y-640,progress:0,frame:0,resolve,time:null};
   active=a;layer.dataset.walkFollowing='true';
   const tick=now=>{
    if(active!==a)return;
    const view=getView();
    if(view.zoom!==a.zoom||view.center?.latitude!==a.start.latitude||view.center?.longitude!==a.start.longitude){
      active=null;layer.style.transform='';delete layer.dataset.walkFollowing;redraw();a.resolve();return;
    }
    if(a.time===null)a.time=now;
    const t=Math.min(1,(now-a.time)/duration);a.progress=t*t*(3-2*t);
    if(t===1){finish(true);return;}
    layer.style.transform=`translate3d(calc(-50% - ${a.dx*a.progress}px), calc(-50% - ${a.dy*a.progress}px), 0)`;
    a.frame=requestAnimationFrame(tick);
   };
   a.frame=requestAnimationFrame(tick);
  });
 }
 follow.cancel=()=>finish();
 return follow;
}
