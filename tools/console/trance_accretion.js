// Reference console script for the trance section (day 18, 2026-08-18).
// Paste into the composer console with a SCRATCH score loaded (e.g. "aud").
// See README.md in this folder for the rules this follows and why.
(() => {
'use strict';
// ---- CONFIG ----
const SECTIONS=[
  {label:'UP', order:[31,45,52,59,65]}     // G1 A2 E3 B3 F4 — order the notes JOIN
];
const BPM=150, MIN_REP=4, MAX_REP=7, TOGETHER=8, GAP=0, SEED=3, VEL=112;
// ----------------
const PROTECTED=/^(tranceSB|piece-s|A1-|A2-|dens|clust|sl0|sc4|7tubas|tranceA001$)/i;
if(typeof Composer==='undefined'){console.error('open composer.html first');return;}
if(PROTECTED.test(Composer.sessionName)){console.error('Refusing to clear "'+Composer.sessionName+'" — load a scratch score first.');return;}
const PULSE=60/BPM, NOTELEN=PULSE/2, TAG='accTwo';
const NAMES=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const nm=m=>NAMES[m%12]+(Math.floor(m/12)-1);
function mulberry32(a){return function(){a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^(a>>>15),1|a)>>>0;t=(t+(Math.imul(t^(t>>>7),61|t)>>>0))>>>0;return((t^(t>>>14))>>>0)/4294967296;};}
const rnd=mulberry32(SEED), ri=(lo,hi)=>lo+Math.floor(rnd()*(hi-lo+1));
const LANE=[...new Set(SECTIONS.flatMap(s=>s.order))].sort((a,b)=>a-b);  // lane = pitch rank

Composer.pushUndoState();
Composer.objects=[];
let col=0; const rows=[], bounds=[], ents=[];
SECTIONS.forEach((sec,si)=>{
  const entry=[0];
  for(let i=1;i<sec.order.length;i++) entry.push(entry[i-1]+ri(MIN_REP,MAX_REP));
  const allIn=entry[entry.length-1], len=allIn+TOGETHER, base=col;
  bounds.push({col:base,label:sec.label});
  sec.order.forEach((midi,vi)=>{
    ents.push({col:base+entry[vi],midi});
    for(let p=entry[vi];p<len;p++) Composer.objects.push({
      id:Composer.generateId('wc'),type:'waveCurve',layer:LANE.indexOf(midi),
      startSeconds:+((base+p)*PULSE).toFixed(4),endSeconds:+((base+p)*PULSE+NOTELEN).toFixed(4),
      nodes:[{pos:0,y:8.8,smooth:0.25},{pos:1,y:8.8,smooth:0.25}],
      segments:[{model:'power',slope:0}],color:si?'#6D4C41':'#607D8B',
      fillMode:'bottom',opacity:0.55,performanceNotes:sec.label+' '+nm(midi),
      properties:{gen:TAG,sec:sec.label},sonifyNote:midi,technique:'staccato',
      sonifyMode:'plain',recVel:VEL});
    rows.push({section:sec.label,voice:vi+1,note:nm(midi),'joins at col':base+entry[vi]+1,
      'reps before next':vi<sec.order.length-1?entry[vi+1]-entry[vi]:TOGETHER+' (tail)'});
  });
  col=base+len+(si<SECTIONS.length-1?GAP:0);
});
const TOTAL=col;

// column numbers: ONE row on META, placed by collision test (see README rule 3)
const meta=document.getElementById('laneMeta'); if(meta) meta.classList.add('open');
const colPx=PULSE*Composer.pixelsPerSecond, CH=6.2, PAD=3, placed=[];
const put=(p,text,color)=>{const x=p*colPx+4,w=text.length*CH;
  if(!placed.every(q=>x+w+PAD<q.x||x>q.x+q.w+PAD))return false;
  placed.push({x,w});
  Composer.objects.push({id:Composer.generateId('mk'),type:'marker',layer:10,
    time:+(p*PULSE).toFixed(4),label:text,color,performanceNotes:'',properties:{gen:TAG}});
  return true;};
const wide=colPx*MIN_REP>=34;
bounds.forEach(b=>put(b.col,(b.col+1)+' '+b.label,'#C62828'));
ents.forEach(e=>put(e.col,wide?(e.col+1)+' '+nm(e.midi):String(e.col+1),'#00695C'));
for(let p=0;p<TOTAL;p++) put(p,String(p+1),'#1A237E');

Composer.renderAll(); Composer.markDirty();
console.log('%cACCRETION — '+BPM+' bpm · lanes by pitch '+LANE.map(nm).join(' '),'font-weight:bold;color:#C62828');
console.table(rows);
console.log(`columns ${TOTAL} · ${(TOTAL*PULSE).toFixed(2)}s · sections at col ${bounds.map(b=>b.col+1).join(', ')}`);
})();
