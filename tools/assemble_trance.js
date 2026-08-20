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

// The running assembly order. Override with ASM_PLAN="phase:1,chord:9" to
// regenerate an earlier version — the seeds are consumed in PLAN order, so a
// prefix plan reproduces that version's material exactly.
const PLAN = (process.env.ASM_PLAN || 'phase:1,chord:9,phase:2,chord:10,mt:B,chord:11,phase:3,chord:12:1:4:2+4,phase:4')
    .split(',').map(x => { const [k,v] = x.trim().split(':');
        if (k==='mt') return {k, m:v, secs:10};
        const parts = x.trim().split(':');
        const it = {k, n:+parts[1]};
        if (parts[2]) it.from = +parts[2];
        if (parts[3]) it.to = +parts[3];
        if (parts[4]) it.cuivre = parts[4].split('+').map(Number);
        return it; });
// SRC = the file the ORIGINAL trance material comes from; OUT = where the
// assembled version is written. Each new letter is a new version (003b -> 003c).
const SRC = process.env.ASM_SRC || 'scores/tranceA003b.json';
const OUT = process.env.ASM_OUT || 'scores/tranceA003c.json';

// phaseSeq-01, as performed (RUNNING_LOG day 21 / params live.saved)
const STEPS = [
    {bpm:87,   off:0.469,  dur:5.4},
    {bpm:93.6, off:0.384,  dur:4.9},
    {bpm:100.2,off:0.2,    dur:5.2},
    {bpm:106.8,off:0.286,  dur:7.1},
    {bpm:113.4,off:0.2805, dur:7.9},
    {bpm:120,  off:0.1835, dur:10.3},
];
// PHASE PITCH: insert N takes ROW 7's Nth pitch, as octaves inside the
// staccato window 30-65. Row 7 = G# D# G D A E B F# A# F C# G# C.
const ROW7 = [8,3,7,2,9,4,11,6,10,5,1,8,0];
const octavesOf = pc => { const o=[]; for(let k=pc;k<=65;k+=12) if(k>=30) o.push(k); return o; };

// OCTAVE SCRAMBLE (composer, day 21): in the PHASE segments each player keeps
// its single steady tempo and single pitch CLASS, but each attack takes a
// different octave of it — no immediate repeat, so the octave always moves.
// (The multitempo sections already behave this way; measured 2026-08-20.)
let OS = 8021 >>> 0;
const osRnd = () => (OS = (OS * 1664525 + 1013904223) >>> 0) / 4294967296;
const scrambleOct = (oct, prev) => {
    if (oct.length < 2) return oct[0];
    let k;
    do { k = oct[(osRnd()*oct.length)|0]; } while (k === prev);
    return k;
};

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

// CUIVRE VERSIONS (composer, day 21): same species, the bank's `stdCuivre`
// notes played CUIVRE instead of staccato — which is how the taxonomy's own
// sonorities record them (`cuivreConverted`). Cuivre sounds MIDI 60-67, so it
// also reaches the 66/67 tops that staccato cannot.
const TAX = JSON.parse(fs.readFileSync(path.join(ROOT,'bank/blast_taxonomy.json'),'utf8'));
const SL_ALL = JSON.parse(fs.readFileSync(path.join(ROOT,'bank/sample_lengths.json'),'utf8'));
// COMPOSER, day 21: cuivre is written SHORT inside a blast - see 18.0 s in
// tranceA003*, where a cuivre note is drawn 0.2 s like its neighbours. The
// measured 1.0-1.35 s ring is the sample's own length (a CEILING, PLAN 2o),
// not what the blast should show.
const CUIVRE_LEN = 0.2;
const cuivreLen = () => CUIVRE_LEN;
const STD_CUIVRE = {};
for (const n of ['16','03','28','12','18','27'])
    STD_CUIVRE[n] = ((TAX.harmonies['VERT01-'+n]||{}).stdCuivre || []).filter(k=>k>=60&&k<=67);
// the base chord has no bank cuivre entry — its top note is the parallel move
const BASE_CUIVRE = [65];

// split a chord into {stac, cuiv} for a given cuivre flag
const voice = (h, useCuivre) => {
    const key = h==='base' ? null : String(h).padStart(2,'0');
    const all = h==='base' ? BASE : SPECIES[key];
    if (!useCuivre) return { stac: all, cuiv: [] };
    const cu = h==='base' ? BASE_CUIVRE : STD_CUIVRE[key];
    return { stac: all.filter(k=>cu.indexOf(k)<0), cuiv: cu };
};

const j = JSON.parse(fs.readFileSync(path.join(ROOT,SRC),'utf8'));
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
const mark = (t,label,color,detail) => j.objects.push({
    id:'mk-asm-'+(id++), type:'marker', layer:10, time:+t.toFixed(3),
    label, color, performanceNotes:detail||'', properties:{gen:'asm-mark'} });

// MULTITEMPO: lifted VERBATIM from the audition score (composer: "just as
// written in the aud file") — the generator already did the part assignment
// (4 pairs 5 tubas apart + 2 solos) and the per-attack octave draw, so nothing
// is re-shuffled here. Only the time base moves.
const GA = JSON.parse(fs.readFileSync(path.join(ROOT,'scores/gen-aud-05.json'),'utf8'));
const MT_SEG = { A:2, B:7, C:12, D:17, E:22, F:27, G:32 };   // the OCT segment per model
const mtNotes = (model, secs) => {
    const idx = MT_SEG[model];
    const w = GA.objects.filter(o=>o.type==='waveCurve' && o.properties && o.properties.idx===idx);
    if (!w.length) throw new Error('multitempo segment for model '+model+' not found');
    const t0 = Math.min(...w.map(x=>x.startSeconds));
    return { t0, notes: w.filter(x=>x.startSeconds < t0 + secs - 1e-9)
                          .sort((a,b)=>a.startSeconds-b.startSeconds),
             ratios: w[0].properties.ratios, sub: w[0].properties.sub };
};

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
        const pc = ROW7[item.n-1];                     // insert N -> row 7 pitch N
        const OCT = octavesOf(pc);
        mark(t, 'PS'+item.n+' '+PC[pc]+' oct', '#3F7D5A',
             s.bpm+' BPM · offset '+s.off+' · '+s.dur+'s · oct '+OCT.map(NAME).join('/'));
        const T = 60/s.bpm;
        let n = 0;
        const lastOct = new Array(10).fill(null);      // per-player, for no-repeat
        for (let c = t; c < end - 1e-9; c += T)
            for (let lane=0; lane<10; lane++) {
                const at = c + ((lane*s.off)%1)*T;
                if (at >= end - 1e-9) continue;
                const pitch = scrambleOct(OCT, lastOct[lane]);
                lastOct[lane] = pitch;
                note(at, lane, pitch, 0.12, '#3F7D5A', 'PH'+item.n+' '+NAME(pitch), 'asm-phase', 95);
                n++;
            }
        log.push('phase step '+item.n+'  '+t.toFixed(1)+' -> '+end.toFixed(1)+'s  ('+s.dur+'s, '+
                 PC[pc]+' oct '+OCT.map(NAME).join('/')+', '+n+' notes)');
        t = end;
    } else if (item.k === 'mt') {
        const secs = item.secs || 10;
        const g = mtNotes(item.m, secs), t0 = t;
        mark(t, 'MT '+item.m+' oct '+g.sub, '#c08fd6',
             g.ratios+' · '+secs+'s · verbatim from gen-aud-05');
        g.notes.forEach(x => note(t + (x.startSeconds - g.t0), x.layer, x.sonifyNote,
            +(x.endSeconds - x.startSeconds).toFixed(3), '#c08fd6',
            'MT'+item.m+' '+NAME(x.sonifyNote), 'asm-mt', x.recVel || 112));
        t = t0 + secs;
        log.push('multitempo '+item.m+'  '+t0.toFixed(1)+' -> '+t.toFixed(1)+'s  ('+secs+'s, '+
                 g.ratios+' oct '+g.sub+', '+g.notes.length+' notes)');
    } else {
        // BLAST-LEVEL addressing (composer, day 21): a chord insert can take a
        // sub-range of a pattern's blasts, and name which of them are cuivre.
        // `from`/`to` are 1-based blast numbers within the pattern.
        const p = patOf(item.n), t0 = t;
        const from = item.from || 1, to = item.to || p.draws.length;
        const cu = item.cuivre || [];
        const draws = p.draws.slice(from-1, to);
        mark(t, 'P'+item.n+' b'+from+'-'+to+(cu.length?' cu'+cu.join('+'):''), '#8a8ac0',
             draws.map((h,i)=>h+(cu.indexOf(from+i)>=0?'(cuiv)':'')).join(' '));
        draws.forEach((h, i) => {
            const bn = from + i;                          // this blast's number
            const v = voice(h, cu.indexOf(bn) >= 0);
            const lanes = pickLanes(v.stac.length + v.cuiv.length);
            v.stac.forEach((pitch,vi)=> note(t, lanes[vi], pitch, 0.15,
                h==='base'?'#3F7D5A':'#8a8ac0', 'P'+item.n+'b'+bn+' '+h+' '+NAME(pitch), 'asm-chord', 100));
            v.cuiv.forEach((pitch,ci)=> {
                const o = { id:'wc-asm-'+(id++), type:'waveCurve', layer:lanes[v.stac.length+ci],
                    startSeconds:+t.toFixed(4), endSeconds:+(t+cuivreLen(pitch)).toFixed(4),
                    nodes:[{pos:0,y:8,smooth:0.25},{pos:1,y:8,smooth:0.25}],
                    segments:[{model:'power',slope:0}], color:'#d68f8f', fillMode:'bottom', opacity:0.55,
                    performanceNotes:'P'+item.n+'b'+bn+' '+h+' CUIVRE '+NAME(pitch),
                    properties:{gen:'asm-chord'},
                    sonifyNote:pitch, technique:'cuivre', sonifyMode:'plain', recVel:110 };
                j.objects.push(o);
            });
            t += BEAT;
        });
        log.push('chord P'+item.n+' b'+from+'-'+to+'  '+t0.toFixed(1)+' -> '+t.toFixed(1)+'s  ('+
            draws.map((h,i)=>h+(cu.indexOf(from+i)>=0?'*':'')).join(' ')+'   * = cuivre)');
    }
});
mark(t, 'asm end', '#8a8ac0');
j.nextId = id + 1;
if (j.metadata) j.metadata.name = path.basename(OUT).replace(/\.json$/,'');
fs.writeFileSync(path.join(ROOT,OUT), JSON.stringify(j,null,2)+'\n');
console.log('wrote '+OUT);
log.forEach(l=>console.log(l));
const added = j.objects.filter(o=>o.type==='waveCurve' && /^asm-/.test((o.properties||{}).gen||'')).length;
console.log('added '+added+' notes · score ends '+t.toFixed(1)+'s · original intact: '+
    j.objects.filter(o=>o.type==='waveCurve' && !/^asm-/.test((o.properties||{}).gen||'')).length+' notes');
