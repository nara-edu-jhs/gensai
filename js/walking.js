import { createWalkerSprites } from './walker-sprites.js?v=44-walk46';
import { walkingDirection, DIRECTIONS } from './walker.js?v=44-walk46';
import { projectWalk, unprojectWalk } from './geo.js?v=44-walk46';
import { metres, measure, atDistance, samples } from './walk-core.js?v=44-walk46';
import { checkWalkPoint, clearWalkHazards, NAMES } from './walk-hazards.js?v=44-walk46';

export function initWalking(getView, followView) {
  const map=document.querySelector('#gsi-map'), layer=document.querySelector('#map-layer');
  const panel=document.createElement('section'); panel.id='walking-panel'; panel.className='map-control-panel'; panel.dataset.noRuby='';
  panel.innerHTML=`<div class="walking-controls"><strong id="walk-heading">🚶 徒歩シミュレーター</strong>
    <div class="walk-toolbar">
      <div class="walk-actions walk-edit-group" role="group" aria-label="経路を描き直す"><button type="button" id="walk-draw" aria-pressed="false">線を描く</button><button type="button" id="walk-undo">ひと筆戻す</button><button type="button" id="walk-clear">消す</button></div>
      <div class="walk-actions walk-play-group" role="group" aria-label="歩行の再生"><button type="button" id="walk-confirm">経路確定</button><button type="button" id="walk-play">歩く</button></div>
      <output id="walk-metrics" aria-live="off">距離 0 m · 徒歩 約0分</output>
    </div>
    <p id="walk-status" role="status" aria-live="polite">「線を描く」で地図をなぞり、「経路確定」→「歩く」。</p>
    <p id="walk-warning" role="status" aria-live="polite"></p>
    <details class="walk-options"><summary>使い方・速度設定</summary><p>「線を描く」→ 地図を指でなぞる →「経路確定」→「歩く」。複数回なぞると末尾からつながります。地図移動は「地図操作に戻る」から。「ひと筆戻す」で直前の線、「消す」で全部を消せます。</p><div class="walk-settings"><label>歩く速さ <select id="walk-speed"><option value="3">3 km/h</option><option value="4" selected>4 km/h</option><option value="5">5 km/h</option></select></label><label>再生速度 <select id="walk-rate"><option value="1">1倍</option><option value="10">10倍</option><option value="60" selected>60倍</option></select></label></div></details>
    <details><summary>警告の根拠と限界（必ず確認）</summary><p>出典：国土地理院「重ねるハザードマップ」。洪水・内水・高潮・津波・土砂災害の画像の着色を約5 m間隔で確認します。警告は想定区域の着色検出であり、現在の災害や危険度・浸水深の判定ではありません。細い区域や境界を見落とす場合があります。未着色でも未調査・未提供の場合があり、安全とは限りません。取得失敗・オフラインは「不明」です。全国の地図で利用できますが、ハザードデータの整備・公開範囲は地域と種類により異なります。</p><p>地震の揺れ、火災、道路の通行可否、橋・建物の倒壊、避難先の開設状況は自動判定しません。経路は道路に補正しません。学習用のシミュレーションで、現地の状況や自治体の避難情報を優先してください。1経路は10 km・3000点まで。推定時間には信号・坂・混雑・休憩を含みません。経路の保存・送信はしません（地図タイルは配信元から取得します）。追加APIキー・課金サービスは不要です。過去の災害・道路の注意箇所などの参考レイヤーからの自動判定は行いません。経路は既存の「表示の保存」やPNG出力には含まれません。</p></details>
  </div>`;
  const workspace=document.createElement('div');
  workspace.className='walking-workspace';
  map.before(workspace);
  const toggleBar=document.createElement('div');toggleBar.className='walk-toggle-bar';
  const toggle=document.createElement('button');toggle.type='button';toggle.id='walk-toggle';toggle.setAttribute('aria-controls','walking-panel');toggle.setAttribute('aria-expanded','false');const refreshToggle=open=>{
    toggle.setAttribute('aria-label',open?'徒歩シミュレーターを閉じる':'徒歩シミュレーターを開く');
    toggle.innerHTML=`<span class="walk-launch-icon" aria-hidden="true"><svg viewBox="0 0 28 28" fill="none"><ellipse cx="9" cy="8" rx="3" ry="5" transform="rotate(-20 9 8)" fill="currentColor"/><ellipse cx="18" cy="17" rx="3" ry="5" transform="rotate(20 18 17)" fill="currentColor"/><circle cx="8" cy="16" r="2.1" fill="currentColor"/><circle cx="19" cy="25" r="2.1" fill="currentColor"/></svg></span><span class="walk-launch-copy"><strong>徒歩シミュレーター</strong><small>${open?'経路・歩行の操作を表示中':'指で道をなぞって、歩いてみよう'}</small></span><span class="walk-launch-action" aria-hidden="true">${open?'閉じる ▴':'開く ▾'}</span>`;
  };refreshToggle(false);
  toggleBar.append(toggle);panel.hidden=true;workspace.append(map,toggleBar,panel);
  const header=document.querySelector('#header-information');
  const placeToggle=()=>{
    const fullscreen=workspace.classList.contains('walking-fullscreen');
    if(header&&!fullscreen)header.prepend(toggleBar);else panel.before(toggleBar);
    document.dispatchEvent(new Event('walking-panel-resize'));
  };
  placeToggle();
  new MutationObserver(placeToggle).observe(workspace,{attributes:true,attributeFilter:['class']});

  toggle.addEventListener('click',()=>{
    const open=panel.hidden;panel.hidden=!open;toggle.setAttribute('aria-expanded',String(open));refreshToggle(open);
    if(!open)mode(false);
    updateLauncher();
    document.dispatchEvent(new Event('walking-panel-resize'));
  });
  const $=id=>panel.querySelector('#'+id), status=$('walk-status'), warning=$('walk-warning');
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.classList.add('walk-overlay'); svg.setAttribute('viewBox','0 0 1280 1280'); svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS(svg.namespaceURI,'polyline'); svg.append(path);
  const person=document.createElement('span'); person.className='walk-person';person.innerHTML='<canvas class="walker-canvas" width="162" height="246" aria-hidden="true"></canvas>';const actor=createWalkerSprites(person.querySelector('canvas'));let targetHeading=Math.PI;person.setAttribute('role','img');person.setAttribute('aria-label','シミュレーション中の歩行者');person.hidden=true;
  layer.append(svg,person);
  let pathKey='',following=false;
  const liveState=document.createElement('span');liveState.className='walk-live-state';liveState.dataset.noRuby='';
  const liveWarning=document.createElement('span');liveWarning.className='walk-live-warning';liveWarning.dataset.noRuby='';liveWarning.setAttribute('role','status');workspace.append(liveWarning);
  let points=[], lengths=[0], strokes=[], drawing=false, pointer=null, strokeStart=0;
  let confirmed=false, results=[], revision=0, checking=false, playing=false, frame=0, travelled=0, previous=0, reportAt=-Infinity, limit=false;
  const total=()=>lengths.at(-1)||0;
  function updateLauncher() {
    toggle.classList.toggle('walk-playing',playing);
    if(!toggle.contains(liveState))toggle.append(liveState);
    liveState.hidden=!playing;
    const stateText=playing?(warning.textContent.includes('着色を検出')?'歩行中 ⚠':warning.textContent.includes('不明')?'歩行中・不明あり':'歩行中'):'';
    if(liveState.textContent!==stateText)liveState.textContent=stateText;
    toggle.title=playing?`歩行再生中。操作欄を閉じても歩行は続きます。${warning.textContent}`:'';
    const message=panel.hidden&&playing?warning.textContent:'';
    if(liveWarning.textContent!==message)liveWarning.textContent=message;
  }
  function keepPersonVisible(center,zoom) {
    if(!playing||!followView||following||map.classList.contains('dragging'))return;
    const m=map.getBoundingClientRect(),p=person.getBoundingClientRect(),l=layer.getBoundingClientRect();
    if(!m.width||!m.height||!l.width||!l.height)return;
    const padX=Math.min(100,m.width/4),padY=Math.min(80,m.height/5);
    const dx=p.left<m.left+padX||p.right>m.right-padX?(p.left+p.right-m.left-m.right)/2:0;
    const dy=p.top<m.top+padY||p.bottom>m.bottom-padY?(p.top+p.bottom-m.top-m.bottom)/2:0;
    if(Math.abs(dx)<.5&&Math.abs(dy)<.5)return;
    const next=unprojectWalk(640+dx*1280/l.width,640+dy*1280/l.height,center,zoom);
    following=true;
    try{
      const pending=followView(next);
      if(pending?.then)pending.finally(()=>{following=false;});else following=false;
    }catch(error){following=false;throw error;}
  }
  function metrics() {
    const minutes=total()/(Number($('walk-speed').value)*1000/60);
    $('walk-metrics').textContent=`距離 ${Math.round(total())} m · 徒歩 約${minutes?Math.max(1,Math.ceil(minutes)):0}分（${$('walk-speed').value} km/h） · 移動 ${Math.round(travelled)} m`;
    $('walk-confirm').disabled=points.length<2||checking||confirmed||pointer!==null;
    $('walk-play').disabled=!confirmed||checking;
    $('walk-undo').disabled=!strokes.length||checking||pointer!==null;
  }
  function render() {
    const {center,zoom}=getView(); if(!center) return;
    const key=`${center.latitude},${center.longitude},${zoom},${points.length},${total()}`;
    if(pathKey!==key){path.setAttribute('points',points.map(p=>{const q=projectWalk(p,center,zoom);return `${q.x},${q.y}`;}).join(' '));pathKey=key;}
    person.hidden=!confirmed||!points.length;
    if(!person.hidden) {const q=projectWalk(atDistance(points,lengths,travelled),center,zoom);person.style.left=q.x+'px';person.style.top=q.y+'px';
      const next=projectWalk(atDistance(points,lengths,Math.min(total(),travelled+2)),center,zoom);
      const direction=walkingDirection(next.x-q.x,next.y-q.y,person.dataset.direction||'south');
      person.dataset.direction=direction;
      const degrees=DIRECTIONS.indexOf(direction)*360/DIRECTIONS.length;
      person.setAttribute('aria-label',`シミュレーション中の歩行者：北から時計回りに${degrees.toFixed(1)}度向き`);
      if(Math.hypot(next.x-q.x,next.y-q.y)>.0001)targetHeading=Math.atan2(next.x-q.x,-(next.y-q.y));
      actor.draw(targetHeading,playing);
      keepPersonVisible(center,zoom);
    }
  }
  function stop() {playing=false;followView?.cancel?.();actor.draw(targetHeading,false);person.classList.remove('is-walking');cancelAnimationFrame(frame);$('walk-play').textContent='歩く';updateLauncher();}
  function mode(enabled) {
    drawing=enabled;map.classList.toggle('walk-drawing',enabled);
    $('walk-draw').setAttribute('aria-pressed',String(enabled));$('walk-draw').textContent=enabled?'地図操作に戻る':'線を描く';
  }
  function invalidate() {pathKey='';revision++;stop();confirmed=false;checking=false;results=[];travelled=0;reportAt=-Infinity;warning.textContent='';$('walk-heading').textContent='🚶 徒歩シミュレーター';metrics();render();}
  function reset() {invalidate();points=[];strokes=[];lengths=[0];pointer=null;mode(false);clearWalkHazards();status.textContent='経路を消去しました。';metrics();render();}
  $('walk-clear').onclick=reset;
  $('walk-draw').onclick=()=>{
    if(!getView().center){status.textContent='先に地図の場所を選んでください。';return;}
    if(!drawing){invalidate();status.textContent='描画中：地図を指でなぞってください。';}
    mode(!drawing);
  };
  $('walk-undo').onclick=()=>{invalidate();points.length=strokes.pop()??0;lengths=measure(points);status.textContent='ひと筆戻しました。';metrics();render();};
  function add(event) {
    if(points.length>=3000){limit=true;return;}
    const {center,zoom}=getView(), rect=layer.getBoundingClientRect(), mapRect=map.getBoundingClientRect();
    const cx=Math.max(mapRect.left,Math.min(mapRect.right,event.clientX)),cy=Math.max(mapRect.top,Math.min(mapRect.bottom,event.clientY));
    const p=unprojectWalk((cx-rect.left)*1280/rect.width,(cy-rect.top)*1280/rect.height,center,zoom);
    const step=points.length?metres(points.at(-1),p):0;
    if(points.length && step<1) return;
    if(total()+step>10000){limit=true;return;}
    points.push(p);lengths.push(total()+step);
    // Initial cumulative entry corresponds to the first vertex.
    if(points.length===1) lengths=[0];
    render();metrics();
  }
  // Capture avoids interfering with existing mouse and touch map navigation.
  for(const type of ['pointerdown','pointermove','pointerup','pointercancel']) map.addEventListener(type,event=>{
    if(!drawing)return;
    if(event.target.closest('button,select,a,summary,.map-control-panel')) return;
    event.preventDefault();event.stopImmediatePropagation();
    if(type==='pointerdown'){
      if(pointer!==null||event.button!==0||event.isPrimary===false)return;
      invalidate();pointer=event.pointerId;strokeStart=points.length;limit=false;map.setPointerCapture(pointer);add(event);
    } else if(event.pointerId===pointer){
      if(type==='pointermove')add(event);
      else {
        if(type==='pointercancel'){points.length=strokeStart;lengths=measure(points);status.textContent='描画が中断されたため、このひと筆を取り消しました。';}
        else {add(event);if(points.length>strokeStart)strokes.push(strokeStart);status.textContent=limit?'上限（10 km・3000点）に達しました。経路を確定するか描き直してください。':'線を追加しました。経路確定、または続きをなぞれます。';}
        if(map.hasPointerCapture(pointer))map.releasePointerCapture(pointer);pointer=null;metrics();render();
      }
    }
  },{capture:true,passive:false});
  for(const type of ['touchstart','touchmove','touchend','touchcancel','wheel']) map.addEventListener(type,event=>{
    if(!drawing||event.target.closest('button,select,a,summary,.map-control-panel'))return;
    event.preventDefault();event.stopImmediatePropagation();
  },{capture:true,passive:false});
  map.addEventListener('keydown',event=>{if(drawing&&event.target===map&&event.key.startsWith('Arrow')){event.preventDefault();event.stopImmediatePropagation();}},{capture:true});
  function describe(rows,prefix) {
    const hits=new Set(),unknown=new Set();
    for(const row of rows)for(const r of row.risks){if(r.status==='hit')hits.add(NAMES[r.type]);if(r.status==='unknown'||r.incomplete)unknown.add(NAMES[r.type]);}
    const heading=hits.size?'🚶 ⚠ '+[...hits].join('・'):unknown.size?'🚶 ハザード不明あり':'🚶 徒歩（安全の保証なし）';
    if($('walk-heading').textContent!==heading)$('walk-heading').textContent=heading;
    return `${prefix}：${hits.size?'⚠ 着色を検出：'+[...hits].join('・')+'。経路と自治体の情報を確認してください。':'着色の検出なし（安全を意味しません）。'}${unknown.size?' 取得できず不明：'+[...unknown].join('・')+'。':''}`;
  }
  $('walk-confirm').onclick=async()=>{
    if(points.length<2||!total())return;
    mode(false);invalidate();clearWalkHazards();checking=true;metrics();
    const token=revision, pending=samples(points,lengths), rows=new Array(pending.length);let next=0,done=0;
    status.textContent=`経路のハザードを確認中 0/${pending.length}点…`;
    async function worker(){while(next<pending.length && token===revision){const i=next++,sample=pending[i];const risks=await checkWalkPoint(sample.point);if(token!==revision)return;rows[i]={...sample,risks};done++;if(done%20===0)status.textContent=`経路のハザードを確認中 ${done}/${pending.length}点…`;}}
    try {
      await Promise.all(Array.from({length:4},worker));
      if(token!==revision)return;
      results=rows;confirmed=true;checking=false;
      status.textContent=`経路確定：${rows.length}点を約5 m間隔で確認しました。「歩く」で開始します。`;
      warning.textContent=describe(rows,'経路全体');metrics();render();
    } catch {if(token===revision){checking=false;status.textContent='確認を完了できませんでした。再度「経路確定」を押してください。';metrics();}}
  };
  function tick(now) {
    if(!playing)return;
    if(previous) travelled=Math.min(total(),travelled+Math.min((now-previous)/1000,.25)*Number($('walk-speed').value)*1000/3600*Number($('walk-rate').value));
    previous=now;render();metrics();
    if(travelled-reportAt>=5||travelled===total()){
      const from=Math.max(0,reportAt),near=results.filter(r=>r.distance>=from&&r.distance<=travelled+5);
      const message=describe(near,'歩行位置付近・通過区間');if(warning.textContent!==message)warning.textContent=message;reportAt=travelled;
    }
    updateLauncher();
    if(travelled>=total()){stop();status.textContent='終点に到着しました。';warning.textContent=describe(results,'経路全体（歩行終了）');}
    else frame=requestAnimationFrame(tick);
  }
  $('walk-play').onclick=()=>{
    if(playing){stop();status.textContent='一時停止中です。';return;}
    if(!confirmed)return;
    if(travelled>=total()){travelled=0;reportAt=-Infinity;}
    playing=true;person.classList.add('is-walking');previous=0;$('walk-play').textContent='一時停止';status.textContent='歩行再生中（実際の現在地ではありません）';updateLauncher();render();frame=requestAnimationFrame(tick);
  };
  $('walk-speed').onchange=metrics;
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing){stop();status.textContent='画面を離れたため一時停止しました。';}});
  document.querySelector('#choose-purpose')?.addEventListener('click',reset);
  new ResizeObserver(render).observe(map);
  new ResizeObserver(()=>document.dispatchEvent(new Event('walking-panel-resize'))).observe(panel);
  for(const id of ['risk-menu-trigger','context-menu-trigger','shelter-menu-trigger','transit-trigger']) document.querySelector('#'+id)?.addEventListener('click',()=>{mode(false);});
  // Practice-only alternative to a pointer gesture; never changes the parent application's route.
  document.addEventListener('tutorial-sample-route', () => {
    if (!window.__imakokoTutorialDemo) return;
    const {center, zoom} = getView(); if (!center) return;
    invalidate(); mode(false);
    points = [[580,680],[610,650],[655,650],[690,620]].map(([x,y]) => unprojectWalk(x,y,center,zoom));
    lengths = measure(points); strokes = [0];
    status.textContent = '練習用のお手本の線です。実際に通れる道路を示すものではありません。';
    metrics(); render();
  });
  metrics();return {render,reset};
}
