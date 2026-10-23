/* Practice uses the real application in a separate frame with memory-only storage. */
(() => {
  'use strict';
  if (window.__imakokoTutorialDemo) return;
  const key = 'imakoko:tutorial:practice-v3:seen';
  const alwaysKey = 'imakoko:tutorial:always-show';
  const readings = {"目的地": "もくてきち", "目的": "もくてき", "現在地": "げんざいち", "自治体": "じちたい", "現在": "げんざい", "減災": "げんさい", "災害": "さいがい", "洪水": "こうずい", "安全": "あんぜん", "確認": "かくにん", "情報": "じょうほう", "場所": "ばしょ", "区域": "くいき", "地図": "ちず", "表示": "ひょうじ", "経路": "けいろ", "読み上げ": "よみあげ", "実際": "じっさい", "結果": "けっか", "保存": "ほぞん", "通信": "つうしん", "想定": "そうてい", "東京駅": "とうきょうえき", "注意": "ちゅうい", "画面": "がめん", "案内": "あんない", "設定": "せってい", "判断": "はんだん", "一度": "いちど", "自分": "じぶん", "見": "み", "使": "つか", "人": "ひと", "今": "いま", "重": "かさ", "開": "あ", "選": "えら", "道": "みち", "示": "しめ", "歩": "ある", "目": "め", "出": "で", "場": "ば", "図": "ず", "戻": "もど", "駅": "えき", "守": "まも", "手": "て", "所": "ところ", "上": "うえ", "身": "み", "体": "からだ", "端末": "たんまつ", "東": "ひがし", "読": "よ", "分": "ぶん", "保証": "ほしょう", "方": "かた", "聞": "き", "一": "ひと", "時": "とき", "本": "ほん", "色": "いろ", "意味": "いみ", "水": "みず", "開き": "ひらき", "開け": "ひらけ", "開い": "ひらい", "開いて": "あいて", "徒歩": "とほ", "判定": "はんてい", "操作": "そうさ", "押": "お", "指": "ゆび", "次": "つぎ", "調べ": "しらべ", "閉じ": "とじ", "戻る": "もどる", "上の": "うえの", "直": "なお", "使い方": "つかいかた", "練習": "れんしゅう", "毎回": "まいかい", "完了": "かんりょう", "確定": "かくてい", "不明": "ふめい", "手本": "てほん", "線": "せん", "描": "えが", "動": "うご", "変": "か", "周り": "まわり", "確かめ": "たしかめ", "危ない": "あぶない", "知": "し", "待": "ま", "今回": "こんかい", "警告": "けいこく", "停止": "ていし", "先": "さき", "少": "すこ", "沿": "そ", "用": "よう", "行": "い", "足": "あし", "通": "とお", "進": "すす", "回": "かい", "出す": "だす"};
  const words=Object.keys(readings).sort((a,b)=>b.length-a.length);
  const rubyPattern=new RegExp(words.join('|'),'g');
  function rubyize(root) {
    const owner=root.ownerDocument;
    const walker=owner.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode(node){return node.parentElement.closest('ruby,rt,script,style,iframe')?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      const text=node.nodeValue,matches=[...text.matchAll(rubyPattern)];if(!matches.length)continue;
      const phrase=owner.createElement('span');phrase.className='tutorial-ruby-phrase';let at=0;
      for(const match of matches){
        phrase.append(owner.createTextNode(text.slice(at,match.index)));
        const ruby=owner.createElement('ruby'),rt=owner.createElement('rt');
        ruby.append(owner.createTextNode(match[0]));rt.textContent=readings[match[0]];ruby.append(rt);phrase.append(ruby);at=match.index+match[0].length;
      }
      phrase.append(owner.createTextNode(text.slice(at)));node.replaceWith(phrase);
    }
  }
  const launch = document.createElement('button');
  launch.id = 'tutorial-open'; launch.type = 'button'; launch.textContent = '使い方';
  launch.setAttribute('aria-haspopup', 'dialog'); launch.setAttribute('aria-controls', 'tutorial-dialog');
  document.querySelector('header .header-actions').prepend(launch);
  const dialog = document.createElement('dialog');
  dialog.id = 'tutorial-dialog'; dialog.lang = 'ja'; dialog.dataset.noRuby = '';
  dialog.setAttribute('aria-labelledby', 'tutorial-title');
  dialog.innerHTML = `<section id="tutorial-welcome" hidden>
    <span class="tutorial-welcome-label">チュートリアル · 使い方の練習</span>
    <div class="tutorial-welcome-icon" aria-hidden="true">☝</div>
    <h2 id="tutorial-welcome-title" tabindex="-1">使い方を<br>いっしょに練習しよう</h2>
    <p id="tutorial-welcome-copy">実際の画面をさわりながら、<br>ひとつずつ やってみましょう。</p>
    <ul class="tutorial-welcome-preview" aria-label="練習できること"><li><span aria-hidden="true">☝</span>押してみる</li><li><span aria-hidden="true">〰</span>なぞってみる</li><li><span aria-hidden="true">🚶</span>歩かせてみる</li></ul>
    <button id="tutorial-welcome-speak" type="button">▶ 読み上げ</button>
    <p class="tutorial-welcome-note">現在地や保存した情報は変わりません。</p>
    <div class="tutorial-welcome-actions"><button id="tutorial-start" type="button">はじめる</button><button id="tutorial-later" type="button">あとで</button></div>
    <p class="tutorial-welcome-note">いつでも「使い方」から開けます。</p>
    <p id="tutorial-welcome-status" role="status"></p>
    <label class="tutorial-repeat"><input id="tutorial-repeat" type="checkbox"><span>この端末では、毎回はじめに案内を出す</span></label>
  </section><div class="tutorial-bar"><b>さわって やってみよう</b><span>練習用の画面</span><button id="tutorial-skip" type="button">スキップ</button></div>
    <div class="tutorial-stage"><iframe id="tutorial-frame" title="いまここ減災ナビの練習画面" sandbox="allow-scripts allow-same-origin" allow="geolocation 'none'; camera 'none'; microphone 'none'"></iframe><div id="tutorial-loading" role="status">練習画面を開いています…</div></div>
    <section class="tutorial-coach" aria-label="操作の案内"><div class="tutorial-progress-row"><span id="tutorial-progress" role="status" aria-live="polite" aria-atomic="true"></span><button id="tutorial-speak" type="button">▶ 読み上げ</button></div>
    <div id="tutorial-dots" aria-hidden="true"></div><h2 id="tutorial-title" tabindex="-1"></h2><p id="tutorial-copy"></p>
    <div id="tutorial-meaning" hidden><span>△ 色あり<br><small>想定区域に注意</small></span><span>？ 不明<br><small>確認できない</small></span><span>○ 色なし<br><small>安全の保証なし</small></span></div>
    <div class="tutorial-actions"><button id="tutorial-back" type="button">戻る</button><button id="tutorial-example" type="button" hidden>お手本の線を使う</button><button id="tutorial-next" type="button">次へ</button></div><span id="tutorial-feedback" role="status" aria-live="polite"></span></section>`;
  document.body.append(dialog);
  const replay = document.createElement('button'); replay.type='button'; replay.id='tutorial-replay';
  replay.textContent='使い方・練習をもう一度'; replay.setAttribute('aria-haspopup','dialog'); replay.setAttribute('aria-controls','tutorial-dialog');
  document.querySelector('#language-gate .purpose-choices').after(replay);

  const $ = id => document.getElementById(id);
  const frame = $('tutorial-frame');
  let doc, win, phase = 0, active = false, started = false, previousFocus, currentTarget, observer, raf, readyTimer, shields = [], label, hand, advancing = false, internal = false, inerted = [];
  const phases = [
    {step:1,title:'ここを タップ',copy:'まず「目的地への経路」を選びます。',target:'[data-purpose="home"]',action:'click'},
    {step:1,title:'練習の場所を 選ぼう',copy:'今回は東京駅。あなたの現在地は使いません。',target:'#use-sample',action:'click'},
    {step:1,title:'目的地は ここから',copy:'このボタンで、行きたい場所を選べます。',target:'#choose-home',action:'click'},
    {step:2,title:'災害リスクを 開こう',copy:'地図のボタンを タップ。',target:'#risk-menu-trigger',action:'click'},
    {step:2,title:'「洪水」を タップ',copy:'地図に重なる色を見てみよう。色は想定区域です。',target:'[data-map-hazard="1"]',action:'click'},
    {step:3,title:'徒歩シミュレーターを 開こう',copy:'足あとのボタンを タップ。',target:'#walk-toggle',action:'click'},
    {step:3,title:'「線を描く」を タップ',copy:'次に、地図の上をなぞります。',target:'#walk-draw',action:'click'},
    {step:3,title:'地図を なぞってみよう',copy:'指やマウスで線を描こう。描きにくければ「お手本の線を使う」。',target:'#gsi-map',action:'draw'},
    {step:3,title:'「経路確定」を タップ',copy:'線の上のハザード情報を調べます。少し待つことがあります。',target:'#walk-confirm',action:'confirm'},
    {step:3,title:'「歩く」を タップ',copy:'人が線に沿って動きます。実際の道を通れるかは判定しません。',target:'.walking-workspace',action:'click'},
    {step:4,title:'警告は ここに出ます',copy:'「不明」も「色なし」も、安全という意味ではありません。',target:'#walk-warning'},
    {step:5,title:'画面の先も 確かめよう',copy:'周りを見る。自治体の情報を聞く。危ないときは身を守る。',target:'#gsi-map'}
  ];
  function visible(el) { return !!(el && el.getClientRects().length && el.getBoundingClientRect().height); }
  function click(selector) { const el = doc.querySelector(selector); if(el && !el.disabled) { internal=true; try { el.click(); } finally { internal=false; } } }
  function closePicker() { if(visible(doc.querySelector('#location-panel'))) click('#close-place-picker'); }
  function collapseRisk() { if(doc.querySelector('#risk-menu-trigger')?.getAttribute('aria-expanded') === 'true') click('#risk-menu-trigger'); }
  function ensureWorkspace() { if(visible(doc.querySelector('#language-gate'))) click('[data-purpose="home"]'); }
  function prepare() {
    ensureWorkspace();
    if(phase === 0) return;
    if(phase === 1) {
      if(!visible(doc.querySelector('#location-panel'))) click('#choose-origin');
      doc.querySelector('#location-fallback').open = true;
      const sample = doc.querySelector('#use-sample'); sample.textContent = '練習：東京駅を選ぶ';
    }
    if(phase >= 2) { if(!doc.querySelector('#map-layer .you-marker') || !win.__tutorialLocationSet) {click('#use-sample');win.__tutorialLocationSet = true;} closePicker(); }
    if(phase >= 3) closePicker();
    if(phase === 4 && doc.querySelector('#risk-menu-trigger').getAttribute('aria-expanded') !== 'true') click('#risk-menu-trigger');
    if(phase >= 5) collapseRisk();
    if(phase >= 6 && doc.querySelector('#walking-panel').hidden) click('#walk-toggle');
    if(phase === 7 && doc.querySelector('#toggle-map-controls')?.getAttribute('aria-expanded') === 'true') click('#toggle-map-controls');
    if(phase === 7 && doc.querySelector('#walk-draw').getAttribute('aria-pressed') !== 'true') click('#walk-draw');
    if(phase >= 10 && doc.querySelector('#walk-draw').getAttribute('aria-pressed') === 'true') click('#walk-draw');
    if(phase === 10) { if(doc.querySelector('#walk-play').textContent === '一時停止') click('#walk-play'); const warning=doc.querySelector('#walk-warning'); if(!warning.textContent)warning.textContent='【表示場所の案内】経路を確認すると、ここに結果が出ます。'; }
  }
  function position() {
    if(!active || !doc || !currentTarget) return;
    const r = currentTarget.getBoundingClientRect(), w = win.innerWidth, h = win.innerHeight;
    const left = Math.max(0,r.left-5), top = Math.max(0,r.top-5), right = Math.min(w,r.right+5), bottom = Math.min(h,r.bottom+5);
    const rects = [[0,0,w,top],[0,top,left,bottom-top],[right,top,w-right,bottom-top],[0,bottom,w,h-bottom]];
    shields.forEach((el,i)=>{const [x,y,width,height]=rects[i];Object.assign(el.style,{left:x+'px',top:y+'px',width:Math.max(0,width)+'px',height:Math.max(0,height)+'px'});});
    const anchor=phase===9?doc.querySelector('#walk-play').getBoundingClientRect():r;
    label.style.left = Math.min(Math.max(8,anchor.left),Math.max(8,w-150))+'px';
    label.style.top = (anchor.top>42 ? anchor.top-38 : Math.min(h-36,anchor.bottom+6))+'px';
    label.textContent = phases[phase].action === 'draw' ? '☟ なぞってみよう' : phases[phase].action ? '☟ ここをタップ' : 'ここを見てね';
    rubyize(label);
    hand.hidden = phases[phase].action !== 'draw';
    hand.style.left = (left+(right-left)*.38)+'px'; hand.style.top = (top+(bottom-top)*.55)+'px';
  }
  function schedule() { cancelAnimationFrame(raf); raf = requestAnimationFrame(position); }
  function render() {
    if(!active || !doc) return;
    advancing = false;
    if('speechSynthesis' in window) speechSynthesis.cancel();
    inerted.forEach(el=>el.inert=false);inerted=[];
    doc.querySelectorAll('.tutorial-spotlight').forEach(el=>el.classList.remove('tutorial-spotlight'));
    // Let the first step use the real purpose screen. Later steps prepare only the practice copy.
    if(phase > 0) prepare();
    const p = phases[phase];
    dialog.setAttribute('aria-label',p.title);dialog.removeAttribute('aria-labelledby');
    $('tutorial-title').textContent = p.title; $('tutorial-copy').textContent = p.copy;
    $('tutorial-progress').textContent = `${p.step} / 5　${['場所を選ぶ','ハザードを見る','歩いてみる','警告を知る','自分で判断'][p.step-1]}`;
    $('tutorial-dots').innerHTML = [1,2,3,4,5].map(n=>`<i class="${n<=p.step?'done':''}"></i>`).join('');
    $('tutorial-back').disabled = phase === 0;
    $('tutorial-next').textContent = phase === phases.length-1 ? '完了' : p.action ? '操作せず 次へ' : '次へ';
    $('tutorial-example').hidden = p.action !== 'draw'; $('tutorial-meaning').hidden = p.step !== 4;
    $('tutorial-feedback').textContent = '';
    currentTarget = doc.querySelector(p.target);
    if(currentTarget) {
      let branch=currentTarget; while(branch && branch!==doc.body) { for(const sibling of branch.parentElement.children) {if(sibling!==branch&&!sibling.inert&&!sibling.matches('style,script,.tutorial-shield,.tutorial-pointer,.tutorial-hand')){sibling.inert=true;inerted.push(sibling);}} branch=branch.parentElement;}
      if(p.action==='draw' || p.step===5) {for(const el of currentTarget.querySelectorAll('button,input,select,a,summary')){if(!el.inert){el.inert=true;inerted.push(el);}}}
      currentTarget.classList.add('tutorial-spotlight');currentTarget.scrollIntoView({block:'center',behavior:'instant'});}
    rubyize(dialog);
    if(phase===9) doc.querySelector('#walk-play').focus({preventScroll:true});
    else if(currentTarget && p.action === 'click') currentTarget.focus({preventScroll:true}); else $('tutorial-title').focus({preventScroll:true});
    position();
  }
  function next() { if(!active) return; if(phase === phases.length-1) close(); else {phase++;render();} }
  function advanceAfterAction() {
    if(advancing) return; advancing = true;
    // Delay one frame so the application's own click handler finishes first.
    requestAnimationFrame(()=>{if(!active)return; if(phase===1)win.__tutorialLocationSet=true; next();});
  }
  function sampleRoute() {
    if(!doc || !active) return;
    doc.dispatchEvent(new win.Event('tutorial-sample-route'));
    if(!doc.querySelector('#walk-confirm').disabled) {phase=8;render();}
  }
  function wirePractice() {
    const style = doc.createElement('style');
    style.textContent = `.tutorial-spotlight{outline:4px solid #ffcf33!important;outline-offset:2px!important;scroll-margin:50px!important}.tutorial-shield{position:fixed;z-index:2147483600;background:rgb(13 29 42 / .58);touch-action:none}.tutorial-pointer{position:fixed;z-index:2147483601;background:#ffdf55;color:#172e3b;padding:4px 10px;border-radius:20px;font:700 15px/1.6 sans-serif;pointer-events:none;max-width:90vw}.tutorial-hand{position:fixed;z-index:2147483601;pointer-events:none;font-size:38px;animation:tutorial-trace 2.5s infinite}@keyframes tutorial-trace{0%,100%{transform:translate(0,20px)}60%{transform:translate(65px,-35px)}}@media(prefers-reduced-motion:reduce){.tutorial-hand{animation:none}}`;
    doc.head.append(style);
    shields = Array.from({length:4},()=>{const el=doc.createElement('div');el.className='tutorial-shield';el.setAttribute('aria-hidden','true');doc.body.append(el);return el;});
    label = doc.createElement('div');label.className='tutorial-pointer';label.setAttribute('aria-hidden','true');doc.body.append(label);
    hand = doc.createElement('div');hand.className='tutorial-hand';hand.textContent='☝';hand.setAttribute('aria-hidden','true');doc.body.append(hand);
    // Permit only the highlighted practice action; keyboard users can also use Next.
    doc.addEventListener('click',event=>{
      if(!active || internal)return;
      if(!currentTarget?.contains(event.target)){event.preventDefault();event.stopImmediatePropagation();return;}
      if(phase===9 && !event.target.closest('#walk-play')) {event.preventDefault();event.stopImmediatePropagation();return;}
      const action=phases[phase].action;
      if(action==='click' && phase!==9) advanceAfterAction();
      if(phase===9) { $('tutorial-feedback').textContent='人が動くところを見てから「次へ」。'; $('tutorial-next').textContent='警告を見る'; }
      if(action==='confirm') $('tutorial-feedback').textContent='確認しています…「次へ」でも進めます。';
    },true);
    doc.addEventListener('focusin',event=>{
      if(!internal && !currentTarget?.contains(event.target)) $('tutorial-next').focus({preventScroll:true});
    });
    doc.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}});
    doc.addEventListener('pointerup',()=>{if(phases[phase]?.action==='draw')requestAnimationFrame(()=>{if(active&&!doc.querySelector('#walk-confirm').disabled){phase=8;render();}});},true);
    observer = new MutationObserver(()=>{
      schedule();
      if(active && phases[phase]?.action==='confirm' && !doc.querySelector('#walk-play').disabled) advanceAfterAction();
    });
    observer.observe(doc.querySelector('#walking-panel'),{subtree:true,attributes:true,childList:true,characterData:true});
    win.addEventListener('scroll',schedule,{passive:true});win.addEventListener('resize',schedule);
    $('tutorial-loading').hidden=true; render();
  }
  function onLoad() {
    if(!active || !started)return;
    try {doc=frame.contentDocument;win=frame.contentWindow;} catch {return;}
    const loadStartedAt=Date.now();
    const check=()=>{
      if(!active || !started)return;
      if(doc.querySelector('#walk-toggle')&&doc.querySelector('#choose-origin')) {clearTimeout(readyTimer);wirePractice();}
      else if(Date.now()-loadStartedAt<15000) readyTimer=setTimeout(check,100);
      else {$('tutorial-loading').textContent='練習画面を開けませんでした。「スキップ」で閉じ、通信できる場所で「使い方」から開き直してください。';}
    };check();
  }
  frame.addEventListener('load',onLoad);
  function open() {
    if(active)return;
    active=true;started=false;phase=0;inerted=[];doc=null;currentTarget=null;previousFocus=document.activeElement;
    dialog.classList.add('tutorial-intro');
    dialog.setAttribute('aria-label','使い方をいっしょに練習しよう');dialog.removeAttribute('aria-labelledby');
    dialog.setAttribute('aria-describedby','tutorial-welcome-copy');
    try { $('tutorial-repeat').checked=localStorage.getItem(alwaysKey)==='1'; } catch { $('tutorial-repeat').checked=false; }
    rubyize(dialog);
    $('tutorial-welcome').hidden=false; $('tutorial-welcome-status').textContent='';
    dialog.showModal();document.documentElement.classList.add('tutorial-active');
    $('tutorial-welcome-title').focus({preventScroll:true});
  }
  function start() {
    if(!active || started)return;
    started=true;
    if('speechSynthesis' in window) speechSynthesis.cancel();
    $('tutorial-welcome').hidden=true;dialog.classList.remove('tutorial-intro');
    dialog.setAttribute('aria-label','使い方の練習');dialog.removeAttribute('aria-labelledby');dialog.removeAttribute('aria-describedby');
    $('tutorial-loading').hidden=false; $('tutorial-loading').textContent='練習画面を開いています…';
    $('tutorial-title').textContent='練習画面を開いています…';
    $('tutorial-copy').textContent='東京駅で練習します。';
    rubyize(dialog);$('tutorial-title').focus({preventScroll:true});frame.src='./tutorial-demo.html?v=practice15';
  }
  function read(text, status) {
    if(!('speechSynthesis' in window)){status.textContent='この端末では読み上げを使えません。';return;}
    speechSynthesis.cancel();const speech=new SpeechSynthesisUtterance(text);speech.lang='ja-JP';speech.rate=.85;speechSynthesis.speak(speech);
  }
  function close() {
    if(!active)return; active=false;started=false;clearTimeout(readyTimer);cancelAnimationFrame(raf);observer?.disconnect();
    if('speechSynthesis' in window) speechSynthesis.cancel();
    try{localStorage.setItem(key,'1');}catch{}
    frame.src='about:blank';doc=null;win=null;currentTarget=null;
    dialog.close();document.documentElement.classList.remove('tutorial-active');
    (previousFocus?.isConnected&&previousFocus!==document.body?previousFocus:launch).focus({preventScroll:true});
  }
  replay.addEventListener('click',open);
  $('tutorial-repeat').addEventListener('change',()=>{try{localStorage.setItem(alwaysKey,$('tutorial-repeat').checked?'1':'0');}catch{ $('tutorial-welcome-status').textContent='設定を保存できません。「使い方」からいつでも開けます。'; }});
  $('tutorial-start').addEventListener('click',start);
  $('tutorial-later').addEventListener('click',close);
  $('tutorial-welcome-speak').addEventListener('click',()=>read('使い方の練習です。実際の画面をさわりながら、ひとつずつやってみましょう。はじめる、または、あとで、を選べます。', $('tutorial-welcome-status')));
  launch.addEventListener('click',open);$('tutorial-skip').addEventListener('click',close);
  $('tutorial-back').addEventListener('click',()=>{if(phase>0){phase--; if(phase===0)click('#choose-purpose');render();}});
  $('tutorial-next').addEventListener('click',()=>{
    if(!doc)return;
    if(phase===0)click('[data-purpose="home"]');
    if(phase===7||phase===8||phase===9){phase=10;render();}else next();
  });
  $('tutorial-example').addEventListener('click',sampleRoute);
  $('tutorial-speak').addEventListener('click',()=>{
    const p=phases[phase];read(p.title+'。'+p.copy,$('tutorial-feedback'));
  });
  dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
  let rubyQueued=false;
  new MutationObserver(()=>{if(rubyQueued)return;rubyQueued=true;requestAnimationFrame(()=>{rubyQueued=false;rubyize(dialog);});}).observe(dialog,{childList:true,subtree:true});
  rubyize(dialog);rubyize(launch);rubyize(replay);
  let seen=false;try{seen=localStorage.getItem(key)==='1';}catch{}
  let always=false;try{always=localStorage.getItem(alwaysKey)==='1';}catch{}
  if(!seen || always || new URLSearchParams(location.search).get('tutorial')==='1') open();
})();
