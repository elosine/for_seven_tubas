// tranceA003b assembly — ALTERNATION model (composer, day 21).
// Two streams, each advancing one item per insertion:
//   phase  : phaseSeq-01 steps 1..6, at the composer's PERFORMED durations
//   chords : row-fifths-01 patterns P9, P10, P11, ...
// PLAN[] below is the running assembly order. Append to it to extend.
const fs = require('fs'), path = require('path');
const ROOT = process.cwd();
const PC = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const NAME = m => PC[m%12] + (Math.floor(m/12)-1);
const BEAT = 0.4;                                   // 150 BPM, the file's grid
const START = 66.8;                                 // first beat after 66.45
// snap to the grid: if t is already (essentially) on a beat, keep it —
// a plain ceil+epsilon pushed 66.8 to 67.2 on the first insert
const nextBeat = t => {
    const q = t / BEAT, r = Math.round(q);
    return (Math.abs(q - r) < 1e-6 ? r : Math.ceil(q)) * BEAT;
};

const PLAN = [ {k:'phase', n:1}, {k:'chord', n:9} ];

// phaseSeq-01, as performed (RUNNING_LOG day 21 / params live.saved)
const STEPS = [
    {bpm:87,   off:0.469,  dur:5.4},
    {bpm:93.6, off:0.384,  dur:4.9},
    {bpm:100.2,off:0.2,    dur:5.2},
    {bpm:106.8,off:0.286,  dur:7.1},
    {bpm:113.4,off:0.2805, dur:7.9},
    {bpm:120,  off:0.1835, dur:10.3},
];
// octaves of ROW 7's first pitch (G#, pc 8) inside the staccato window 30-65
const ROOTPC = 8;
const OCT = []; for (let k=ROOTPC+24;k<=65;k+=12) if (k>=30) OCT.push(k);
const laneP = []; for (let x=0;x<10;x++) laneP.push(OCT[Math.floor(x*OCT.length/10)]);

// PER-BEAT RESHUFFLE (composer, day 21) — the standing rule for every chord
// set: each beat re-voices the chord onto a fresh random set of parts, rather
// than the whole run sitting on one fixed five. Also spreads the load: with a
// fixed voicing every player re-attacks every 0.4 s, which over-rings.
let RS = 90210 >>> 0;
const rsRnd = () => (RS = (RS * 1664525 + 1013904223) >>> 0) / 4294967296;
const pickLanes = n => {
    const a = [0,1,2,3,4,5,6,7,8,9];
    for (let i = 9; i > 0; i--) { const k = (rsRnd()*(i+1))|0; const t=a[i]; a[i]=a[k]; a[k]=t; }
    return a.slice(0, n);
};

const BASE = [31,45,52,59,65];
const SPECIES = {};
for (const n of ['16','03','28','12','18','27'])
    SPECIES[n] = JSON.parse(fs.readFileSync(path.join(ROOT,'bank/VERT01-'+n+'.json'),'utf8'))
        .pitches.filter(k=>k>=30&&k<=65);

const j = JSON.parse(fs.readFileSync(path.join(ROOT,'scores/tranceA003b.json'),'utf8'));
// re-runnable: strip only what this script wrote
j.objects = j.objects.filter(o => !(o.properties && /^asm-/.test(o.properties.gen || ''))
                              && !/^ASM /.test(o.label || ''));
let id = (j.nextId || 1) + 1;
const note = (t,layer,pitch,dur,color,label,gen,vel) => j.objects.push({
    id:'wc-asm-'+(id++), type:'waveCurve', layer,
    startSeconds:+t.toFixed(4), endSeconds:+(t+dur).toFixed(4),
    nodes:[{pos:0,y:8,smooth:0.25},{pos:1,y:8,smooth:0.25}],
    segments:[{model:'power',slope:0}], color, fillMode:'bottom', opacity:0.55,
    performanceNotes:label, properties:{gen},
    sonifyNote:pitch, technique:'staccato', sonifyMode:'plain', recVel:vel });
const mark = (t,label,color) => j.objects.push({
    id:'mk-asm-'+(id++), type:'marker', layer:0, time:+t.toFixed(3),
    label, color, performanceNotes:'', properties:{gen:'asm-mark'} });

const rf = JSON.parse(fs.readFileSync(path.join(ROOT,'scores/row-fifths-01.json'),'utf8'));
const patOf = num => {
    const m = rf.objects.find(o=>o.type==='marker' && (o.label||'').indexOf('P'+num+' [') === 0);
    if (!m) throw new Error('pattern P'+num+' not found');
    return { kind:m.label.match(/\[(\w)\]/)[1], draws:m.label.split(': ')[1].trim().split(/\s+/) };
};

let t = START, log = [];
PLAN.forEach(item => {
    t = nextBeat(t);                          // every insert opens on a beat
    if (item.k === 'phase') {
        const s = STEPS[item.n-1], end = t + s.dur;
        mark(t, 'ASM phase step '+item.n+' · '+s.bpm+' BPM · offset '+s.off+' · '+s.dur+'s · oct G# '+OCT.join('/'), '#3F7D5A');
        const T = 60/s.bpm;
        let n = 0;
        for (let c = t; c < end - 1e-9; c += T)
            for (let lane=0; lane<10; lane++) {
                const at = c + ((lane*s.off)%1)*T;
                if (at >= end - 1e-9) continue;
                note(at, lane, laneP[lane], 0.12, '#3F7D5A', 'PH'+item.n+' '+NAME(laneP[lane]), 'asm-phase', 95);
                n++;
            }
        log.push('phase step '+item.n+'  '+t.toFixed(1)+' -> '+end.toFixed(1)+'s  ('+s.dur+'s, '+n+' notes)');
        t = end;
    } else {
        const p = patOf(item.n), t0 = t;
        mark(t, 'ASM P'+item.n+' ['+p.kind+'] x'+p.draws.length+': '+p.draws.join(' '), '#8a8ac0');
        p.draws.forEach(h => {
            const chord = h==='base' ? BASE : SPECIES[String(h).padStart(2,'0')];
            const lanes = pickLanes(chord.length);       // fresh voicing every beat
            chord.forEach((pitch,vi)=> note(t, lanes[vi], pitch, 0.15,
                h==='base'?'#3F7D5A':'#8a8ac0', 'P'+item.n+' '+h+' '+NAME(pitch), 'asm-chord', 100));
            t += BEAT;
        });
        log.push('chord P'+item.n+'    '+t0.toFixed(1)+' -> '+t.toFixed(1)+'s  ('+p.draws.length+' beats: '+p.draws.join(' ')+')');
    }
});
mark(t, 'ASM - end -', '#8a8ac0');
j.nextId = id + 1;
fs.writeFileSync(path.join(ROOT,'scores/tranceA003b.json'), JSON.stringify(j,null,2)+'\n');
log.forEach(l=>console.log(l));
const added = j.objects.filter(o=>o.type==='waveCurve' && /^asm-/.test((o.properties||{}).gen||'')).length;
console.log('added '+added+' notes · score ends '+t.toFixed(1)+'s · original intact: '+
    j.objects.filter(o=>o.type==='waveCurve' && !/^asm-/.test((o.properties||{}).gen||'')).length+' notes');
