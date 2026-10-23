// Direction follows the projected map, with north at the top.
export const DIRECTION_COUNT=128;
const compass16=['north','north-northeast','northeast','east-northeast','east','east-southeast','southeast','south-southeast','south','south-southwest','southwest','west-southwest','west','west-northwest','northwest','north-northwest'];
export const DIRECTIONS=Array.from({length:DIRECTION_COUNT},(_,i)=>i%8===0?compass16[i/8]:`bearing-${i}`);
export function walkingDirection(dx,dy,previous='south') {
 if(Math.hypot(dx,dy)<.0001)return previous;
 const angle=(Math.atan2(dx,-dy)+Math.PI*2)%(Math.PI*2);
 return DIRECTIONS[Math.round(angle/(Math.PI*2/DIRECTION_COUNT))%DIRECTION_COUNT];
}
let walkerSequence=0;
export function walkerMarkup(){const instance=++walkerSequence;const original=`<svg class="walk-facing walker-view walker-side" width="54" height="82" viewBox="0 0 64 96" aria-hidden="true">
<defs><linearGradient id="walk-jacket" x1="0" x2="1"><stop stop-color="#12685f"/><stop offset=".6" stop-color="#39a295"/><stop offset="1" stop-color="#1f7d73"/></linearGradient><linearGradient id="walk-jeans" x1="0" x2="1"><stop stop-color="#27384e"/><stop offset="1" stop-color="#455e7a"/></linearGradient></defs>
<ellipse class="walker-shadow" cx="32" cy="90" rx="15" ry="3" fill="#243c51" opacity=".2"/>
<g class="walker-body" stroke-linejoin="round" stroke-linecap="round">
 <g class="walker-arm arm-back"><path d="M29 30 Q23 38 22 46" fill="none" stroke="#155f59" stroke-width="7"/><path d="M22 45 L25 56" fill="none" stroke="#d49c77" stroke-width="5"/><ellipse cx="25" cy="57" rx="3" ry="4" fill="#dca981"/></g>
 <g class="walker-leg leg-back"><path d="M30 47 L27 66" fill="none" stroke="#283c55" stroke-width="9"/><g class="walker-calf calf-back"><path d="M27 64 L25 83" fill="none" stroke="#2d435c" stroke-width="7"/><path d="M22 81 Q26 80 28 83 L33 85 Q35 88 31 89 L21 88 Z" fill="#25303c"/><path d="M21 88 L33 89" stroke="#e4e9e9" stroke-width="2"/></g></g>
 <path d="M29 22 L29 28 L36 29 L36 21" fill="#e3b28e"/>
 <path d="M26 26 Q30 24 36 26 Q40 28 40 34 L38 48 Q31 51 25 47 L24 34 Z" fill="url(#walk-jacket)" stroke="#12574f" stroke-width="1"/>
 <path d="M34 28 L35 44" stroke="#85cbc0" stroke-width="1.3" opacity=".75"/><path d="M25 47 Q32 50 38 47 L37 52 L26 51 Z" fill="#263b52"/>
 <g class="walker-leg leg-front"><path d="M33 50 L36 67" fill="none" stroke="url(#walk-jeans)" stroke-width="9"/><path d="M34 53 L37 64" stroke="#637c95" stroke-width="1" opacity=".65"/><g class="walker-calf calf-front"><path d="M36 65 L39 83" fill="none" stroke="url(#walk-jeans)" stroke-width="7"/><path d="M36 81 Q40 80 42 83 L48 85 Q50 88 46 89 L35 88 Z" fill="#24303e"/><path d="M35 88 L48 89" stroke="#f1f1ed" stroke-width="2"/><path d="M41 84 L44 85" stroke="#aab3bd" stroke-width="1"/></g></g>
 <g class="walker-arm arm-front"><path d="M35 30 Q40 35 39 43" fill="none" stroke="#258f83" stroke-width="8"/><path d="M39 41 Q41 46 45 48" fill="none" stroke="#efbf98" stroke-width="5"/><ellipse cx="46" cy="49" rx="3" ry="3.7" transform="rotate(-25 46 49)" fill="#efbf98"/><path d="M33 29 L36 36" stroke="#60b9ac" stroke-width="1.2"/></g>
 <path d="M27 11 Q30 5 37 9 Q41 11 40 16 L43 19 L40 21 Q39 26 34 25 L28 22 Z" fill="#efbf98" stroke="#c38c68" stroke-width=".7"/>
 <path d="M27 21 L25 17 L25 12 L27 9 L29 9 L30 6 L33 8 L35 6 L37 9 L39 9 L40 12 L35 11 L32 13 L30 16 L30 21 Z" fill="#303136"/>
 <ellipse cx="30" cy="18" rx="2" ry="2.6" fill="#e4aa83"/><circle cx="38" cy="16" r=".9" fill="#30313b"/><path d="M38 22 L40 21.5" stroke="#9d614d" stroke-width=".8"/>
</g></svg><svg class="walk-facing walker-view walker-front" width="54" height="82" viewBox="0 0 64 96" aria-hidden="true"><ellipse cx="32" cy="90" rx="15" ry="3" fill="#243c51" opacity=".2"/><g class="walker-body" stroke-linecap="round" stroke-linejoin="round">
 <g class="frontal-leg frontal-left"><path d="M28 48 L26 66 L25 84" fill="none" stroke="#344c68" stroke-width="8"/><path d="M28 52 L27 65" stroke="#617893" stroke-width="1"/><path d="M22 82 L28 82 L30 88 Q26 91 20 88Z" fill="#263343"/><path d="M20 88 Q25 90 30 88" fill="none" stroke="#e9edeb" stroke-width="1.6"/></g>
 <g class="frontal-leg frontal-right"><path d="M36 48 L38 66 L39 84" fill="none" stroke="#3e5773" stroke-width="8"/><path d="M36 52 L37 65" stroke="#71849a" stroke-width="1"/><path d="M36 82 L42 82 L44 88 Q39 91 34 88Z" fill="#263343"/><path d="M34 88 Q39 90 44 88" fill="none" stroke="#e9edeb" stroke-width="1.6"/></g>
 <path d="M28 22 L28 28 L36 28 L36 22" fill="#e3b28e"/>
 <g class="frontal-arm frontal-left-arm"><path d="M23 30 L20 42" fill="none" stroke="#228478" stroke-width="7"/><path d="M20 42 L21 54" fill="none" stroke="#e1ab85" stroke-width="5"/><ellipse cx="21" cy="56" rx="2.7" ry="3.8" fill="#e8b48e"/></g>
 <g class="frontal-arm frontal-right-arm"><path d="M41 30 L44 42" fill="none" stroke="#32998a" stroke-width="7"/><path d="M44 42 L43 54" fill="none" stroke="#efbf98" stroke-width="5"/><ellipse cx="43" cy="56" rx="2.7" ry="3.8" fill="#efbf98"/></g>
 <path d="M24 27 Q32 24 40 27 L42 33 L39 48 Q32 51 25 48 L22 33Z" fill="#2d9485" stroke="#145e54" stroke-width="1"/><path d="M25 29 L26 44" stroke="#60b9aa" stroke-width="1" opacity=".7"/><path d="M28 26 L32 30 L36 26" fill="#eff0e5" stroke="#17675e" stroke-width=".7"/><path d="M32 30 L32 47" stroke="#a0d2c7" stroke-width="1.1"/><path d="M26 39 L29 39 M35 39 L38 39" stroke="#145a54" stroke-width="1.3"/><path d="M25 47 Q32 49 39 47 L39 51 L25 51Z" fill="#2c4057"/><ellipse cx="32" cy="16" rx="8" ry="10" fill="#efbf98" stroke="#c99272" stroke-width=".7"/><ellipse cx="24" cy="17" rx="1.7" ry="2.6" fill="#e1aa84"/><ellipse cx="40" cy="17" rx="1.7" ry="2.6" fill="#e1aa84"/><path d="M24 17 L24 11 L26 9 L26 7 L29 8 L31 5 L33 7 L36 6 L37 9 L39 10 L40 16 L38 13 L35 12 L32 10 L29 13 L26 13 L25 18 Z" fill="#303136"/><path d="M27 16 L29 15.8 M35 15.8 L37 16" stroke="#4e3933" stroke-width="1"/><circle cx="28" cy="17.5" r=".8" fill="#30313b"/><circle cx="36" cy="17.5" r=".8" fill="#30313b"/><path d="M32 18 L31 21 L33 21" fill="none" stroke="#c38b68" stroke-width=".8"/><path d="M29.5 23 Q32 24 34.5 23" fill="none" stroke="#a36555" stroke-width=".8"/>
 </g></svg><svg class="walk-facing walker-view walker-back" width="54" height="82" viewBox="0 0 64 96" aria-hidden="true"><ellipse cx="32" cy="90" rx="15" ry="3" fill="#243c51" opacity=".2"/><g class="walker-body" stroke-linecap="round" stroke-linejoin="round">
 <g class="frontal-leg frontal-left"><path d="M28 48 L26 66 L25 84" fill="none" stroke="#344c68" stroke-width="8"/><path d="M28 52 L27 65" stroke="#617893" stroke-width="1"/><path d="M22 82 L28 82 L30 88 Q26 91 20 88Z" fill="#263343"/><path d="M20 88 Q25 90 30 88" fill="none" stroke="#e9edeb" stroke-width="1.6"/></g>
 <g class="frontal-leg frontal-right"><path d="M36 48 L38 66 L39 84" fill="none" stroke="#3e5773" stroke-width="8"/><path d="M36 52 L37 65" stroke="#71849a" stroke-width="1"/><path d="M36 82 L42 82 L44 88 Q39 91 34 88Z" fill="#263343"/><path d="M34 88 Q39 90 44 88" fill="none" stroke="#e9edeb" stroke-width="1.6"/></g>
 <path d="M28 22 L28 28 L36 28 L36 22" fill="#e3b28e"/>
 <g class="frontal-arm frontal-left-arm"><path d="M23 30 L20 42" fill="none" stroke="#228478" stroke-width="7"/><path d="M20 42 L21 54" fill="none" stroke="#e1ab85" stroke-width="5"/><ellipse cx="21" cy="56" rx="2.7" ry="3.8" fill="#e8b48e"/></g>
 <g class="frontal-arm frontal-right-arm"><path d="M41 30 L44 42" fill="none" stroke="#32998a" stroke-width="7"/><path d="M44 42 L43 54" fill="none" stroke="#efbf98" stroke-width="5"/><ellipse cx="43" cy="56" rx="2.7" ry="3.8" fill="#efbf98"/></g>
 <path d="M24 27 Q32 24 40 27 L42 33 L39 48 Q32 51 25 48 L22 33Z" fill="#258a7c" stroke="#145e54" stroke-width="1"/><path d="M25 29 L26 44" stroke="#60b9aa" stroke-width="1" opacity=".7"/><path d="M27 29 Q32 32 37 29 M32 32 L32 45" fill="none" stroke="#155c55" stroke-width="1"/><path d="M25 44 Q32 46 39 44" fill="none" stroke="#66afa3" stroke-width=".8"/><path d="M25 47 Q32 49 39 47 L39 51 L25 51Z" fill="#2c4057"/><path d="M24 14 L25 10 L27 9 L28 6 L31 8 L33 5 L35 8 L38 8 L39 11 L40 14 L39 21 L37 23 L35 22 L33 24 L31 23 L29 24 L27 21 L25 21Z" fill="#303136" stroke="#252931" stroke-width=".8"/><path d="M26 21 L28 25 L36 25 L38 21" fill="#dca982"/>
 </g></svg><svg class="walk-heading-arrow" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3 L23 19 L16 16 L9 19Z" fill="#7345ae" stroke="white" stroke-width="1.5"/></svg>`.replaceAll('walk-jacket',`walk-jacket-${instance}`).replaceAll('walk-jeans',`walk-jeans-${instance}`);
 const templates={};for(const match of original.matchAll(/<svg class="walk-facing walker-view walker-(side|front|back)"[\s\S]*?<\/svg>/g))templates[match[1]]=match[0].replace(/<defs>[\s\S]*?<\/defs>/,'');
 const baseIds={side:`walker-side-${instance}`,front:`walker-front-${instance}`,back:`walker-back-${instance}`};
 const bases=Object.entries(templates).map(([kind,svg])=>`<g id="${baseIds[kind]}">${svg.slice(svg.indexOf('>')+1,svg.lastIndexOf('</svg>'))}</g>`).join('');
 const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
 const views=DIRECTIONS.map((direction,i)=>{
  const angle=i*360/DIRECTION_COUNT, offset=Math.min(angle,360-angle), mirror=angle>180?-1:1;
  const sideAmount=smooth((offset-35)/40)*(1-smooth((offset-105)/40));
  const facing=offset<90?'back':'front';
  const kind=sideAmount>.5?'side':facing;
  const turn=offset<90?offset:180-offset;
  const narrow=1-.16*Math.sin(turn*Math.PI/180);
  const skew=(offset<90?1:-1)*Math.sin(turn*Math.PI/90)*5*mirror;
  const transform=`translate(32 0) skewX(${skew}) scale(${narrow*mirror} 1) translate(-32 0)`;
  return `<svg class="walk-facing walker-view walker-direction view-${direction}" width="54" height="82" viewBox="0 0 64 96" aria-hidden="true"><g transform="${transform}"><use href="#${baseIds[kind]}"/></g></svg>`;
 }).join('');
 const definitions=original.match(/<defs>[\s\S]*?<\/defs>/)?.[0]||'';
 return `<svg width="0" height="0" style="position:absolute" aria-hidden="true">${definitions}${bases}</svg>`+views+original.slice(original.indexOf('<svg class="walk-heading-arrow"'));
}

