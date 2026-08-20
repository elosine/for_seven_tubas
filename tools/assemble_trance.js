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
// Token forms ('-' skips an optional slot):
//   phase:N[:dur][:PC]      phase:4 · phase:4:6.5 · phase:4:-:F  (pc override)
//   chord:N[:from][:to][:cuivre]   chord:12:1:4:2+4
//   mt:M[:secs]             mt:B · mt:B:15
const PLAN = (process.env.ASM_PLAN || 'phase:1,chord:9,phase:2,chord:10,mt:B,chord:11,phase:3,chord:12:1:4:2+4,phase:4')
    .split(',').map(x => {
        const tok = x.trim(), parts = tok.split(':'), k = parts[0];
        if (k==='r27') return {k, tok};
        if (k==='r17') return {k, tok};
        if (k==='phasearc') return {k, tok, n:+parts[1], dur: parts[2] ? +parts[2] : null,
            // composer's PS1 arc: ~50% the current G#-rooted fifths chain, then
            // the chain a half step up, last ~20% the F-A cluster
            arc: [
                {frac:5, set:[32,39,46,53,60], label:'5ths G#'},
                {frac:3, set:[33,40,47,54,61], label:'5ths A', detail:'half step up'},
                {frac:2, set:[30,31,33,41,42,44,45,53,55,57], label:'cluFA'},
            ]};
        if (k==='mtdiv') return {k, tok, m:parts[1], secs: parts[2] ? +parts[2] : 10,
            // the composer's 4:3:2 arc for this insert: A# octaves -> B octaves
            // (transpose +1) -> the C-ROOTED fifths chain (C2 G2 D3 A3 E4)
            parts: [
                {frac:4, mode:'verbatim',            label:'A# oct'},
                {frac:3, mode:'transpose', by:1,     label:'B oct',  detail:'A# oct +1'},
                {frac:2, mode:'set', set:[36,43,50,57,64], label:'5ths C', detail:'C2 G2 D3 A3 E4'},
            ]};
        if (k==='mt') return {k, tok, m:parts[1], secs: parts[2] ? +parts[2] : 10};
        if (k==='phase') {
            const it = {k, tok, n:+parts[1]};
            if (parts[2] && parts[2] !== '-') it.dur = +parts[2];
            if (parts[3] && parts[3] !== '-') {
                if (['fifths','cluFA','sp27','sp30'].indexOf(parts[3]) >= 0 || /^ga[0-9]+$/.test(parts[3])) it.set = parts[3];
                else it.pc = PC.indexOf(parts[3]);
            }
            return it;
        }
        const it = {k, tok, n:+parts[1]};
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
// PHASE PITCH SETS beyond octaves (composer, day 21) - the live rig's presets:
// fifths = +7 chain from the row pitch's lowest in-range instance; cluFA = the
// F-A three-octave cluster; spNN = that species' in-window played pitches.
const CLU_FA = [30,31,33,41,42,44,45,53,55,57];
const phaseSet = (item, pc) => {
    if (item.set === 'fifths') { let k = pc; while (k < 30) k += 12;
        const o = []; for (; k <= 65; k += 7) o.push(k); return o; }
    if (item.set === 'cluFA') return CLU_FA;
    if (item.set === 'sp27') return SPECIES['27'];
    if (item.set === 'sp30') return SPECIES['30'];
    if (/^ga[0-9]+$/.test(item.set || '')) {
        const idx = +item.set.slice(2);
        const w = GA.objects.filter(o=>o.type==='waveCurve' && o.properties && o.properties.idx===idx);
        const set = [...new Set(w.map(x=>x.sonifyNote))].filter(k=>k>=30&&k<=65).sort((a,b)=>a-b);
        if (!set.length) throw new Error('ga'+idx+': no pitches found');
        return set;
    }
    return octavesOf(pc);
};
// label for a ga set = the aud5 marker's own name, condensed ('04 mes6 T2' -> mes6T2)
const gaLabel = set => {
    const idx = +set.slice(2);
    const m = GA.objects.find(o=>o.type==='marker' && new RegExp('^0?'+idx+' ').test(o.label||''));
    return m ? m.label.replace(/^[0-9]+ /,'').replace(/ /g,'') : set;
};

// PER-CHUNK SEEDS (composer, day 21 — the facile-permutation fix): every
// chunk's dice come from ITS OWN token, so editing chunk 3 cannot re-deal
// chunk 5. Identical tokens repeated in the plan get their occurrence number
// mixed in, so a literal repeat still draws fresh. One-time cost: this
// migration re-dealt all voicings/octaves once (structure unchanged).
const lcg = seed => { let s = seed >>> 0;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; };
const hashStr = str => { let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h * 33) ^ str.charCodeAt(i)) >>> 0;
    return h >>> 0; };

// OCTAVE SCRAMBLE (composer, day 21): in the PHASE segments each player keeps
// its single steady tempo and single pitch CLASS, but each attack takes a
// different octave of it — no immediate repeat, so the octave always moves.
// (The multitempo sections already behave this way; measured 2026-08-20.)
const scrambleOct = (rnd, oct, prev) => {
    if (oct.length < 2) return oct[0];
    let k;
    do { k = oct[(rnd()*oct.length)|0]; } while (k === prev);
    return k;
};

// PER-BEAT RESHUFFLE (composer, day 21) — the standing rule for every chord
// set: each beat re-voices the chord onto a fresh random set of parts, rather
// than the whole run sitting on one fixed five. Also spreads the load: with a
// fixed voicing every player re-attacks every 0.4 s, which over-rings.
const pickLanes = (rnd, n) => {
    const a = [0,1,2,3,4,5,6,7,8,9];
    for (let i = 9; i > 0; i--) { const k = (rnd()*(i+1))|0; const t=a[i]; a[i]=a[k]; a[k]=t; }
    return a.slice(0, n);
};

const BASE = [31,45,52,59,65];
const SPECIES = {};
for (const n of ['16','03','28','12','18','27','30'])
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
const occ = {};                               // occurrence count per identical token
PLAN.forEach(item => {
    occ[item.tok] = (occ[item.tok] || 0) + 1;
    const rnd = lcg(hashStr(item.tok + '#' + occ[item.tok]));   // this chunk's own dice
    t = nextBeat(t);                          // every insert opens on a beat
    if (item.k === 'phase') {
        const s = STEPS[item.n-1];
        const dur = item.dur != null ? item.dur : s.dur;
        const end = t + dur;
        const pc = item.pc != null ? item.pc : ROW7[item.n-1]; // insert N -> row 7 pitch N
        const OCT = phaseSet(item, pc);
        const setName = item.set ? (/^ga/.test(item.set) ? gaLabel(item.set) : item.set.replace('fifths','5ths')) : PC[pc]+' oct';
        mark(t, 'PS'+item.n+' '+setName, '#3F7D5A',
             s.bpm+' BPM · offset '+s.off+' · '+dur+'s · oct '+OCT.map(NAME).join('/'));
        const T = 60/s.bpm;
        let n = 0;
        const lastOct = new Array(10).fill(null);      // per-player, for no-repeat
        for (let c = t; c < end - 1e-9; c += T)
            for (let lane=0; lane<10; lane++) {
                const at = c + ((lane*s.off)%1)*T;
                if (at >= end - 1e-9) continue;
                const pitch = scrambleOct(rnd, OCT, lastOct[lane]);
                lastOct[lane] = pitch;
                note(at, lane, pitch, 0.12, '#3F7D5A', 'PH'+item.n+' '+NAME(pitch), 'asm-phase', 95);
                n++;
            }
        log.push('phase step '+item.n+'  '+t.toFixed(1)+' -> '+end.toFixed(1)+'s  ('+dur+'s, '+
                 setName+' '+OCT.map(NAME).join('/')+', '+n+' notes)');
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
    } else if (item.k === 'mtdiv') {
        // DIVIDED multitempo (composer, day 21): one MT segment whose pitch
        // world changes across sub-parts in a duration ratio. Rhythm/parts
        // stay the segment's own; part 2 transposes (A#→B = +1); part 3+
        // re-draws each attack from a named set (no immediate repeat/player).
        const secs = item.secs || 10;
        const g = mtNotes(item.m, secs), t0 = t;
        const parts = item.parts;                        // [{frac,mode,...}]
        const total = parts.reduce((a,p)=>a+p.frac,0);
        let acc = 0;
        const bounds = parts.map(p => { acc += p.frac; return secs * acc / total; });
        const lastP = new Array(10).fill(null);
        parts.forEach((p,pi) => mark(t + (pi ? bounds[pi-1] : 0),
            'MT '+item.m+' '+p.label, '#c08fd6', p.detail || ''));
        g.notes.forEach(x => {
            const rel = x.startSeconds - g.t0;
            const pi = bounds.findIndex(b => rel < b - 1e-9);
            const p = parts[pi < 0 ? parts.length-1 : pi];
            let pitch = x.sonifyNote;
            if (p.mode === 'transpose') pitch = x.sonifyNote + p.by;
            else if (p.mode === 'set') {
                let k;
                do { k = p.set[(rnd()*p.set.length)|0]; } while (k === lastP[x.layer] && p.set.length > 1);
                pitch = k; lastP[x.layer] = k;
            }
            note(t + rel, x.layer, pitch, +(x.endSeconds - x.startSeconds).toFixed(3),
                '#c08fd6', 'MT'+item.m+' '+NAME(pitch), 'asm-mt', x.recVel || 112);
        });
        t = t0 + secs;
        log.push('mtdiv '+item.m+'  '+t0.toFixed(1)+' -> '+t.toFixed(1)+'s  ('+
            parts.map((p,i)=>p.label+' '+((i?bounds[i]-bounds[i-1]:bounds[0])).toFixed(1)+'s').join(' | ')+')');
    } else if (item.k === 'phasearc') {
        // PHASE with a pitch ARC: same rotor rhythm as a phase step, but the
        // pitch SET changes across sub-parts (fractions of the duration).
        const s = STEPS[item.n-1];
        const dur = item.dur != null ? item.dur : s.dur;
        const end = t + dur;
        const total = item.arc.reduce((a,p)=>a+p.frac,0);
        let acc = 0;
        const bounds = item.arc.map(p => { acc += p.frac; return t + dur*acc/total; });
        item.arc.forEach((p,pi) => mark(pi ? bounds[pi-1] : t,
            'PS'+item.n+' '+p.label, '#3F7D5A', (p.detail||'')+' · '+s.bpm+' BPM · offset '+s.off));
        const T = 60/s.bpm;
        let n = 0;
        const lastOct = new Array(10).fill(null);
        for (let c = t; c < end - 1e-9; c += T)
            for (let lane=0; lane<10; lane++) {
                const at = c + ((lane*s.off)%1)*T;
                if (at >= end - 1e-9) continue;
                const pi = bounds.findIndex(b => at < b - 1e-9);
                const set = item.arc[pi < 0 ? item.arc.length-1 : pi].set;
                const pitch = scrambleOct(rnd, set, lastOct[lane]);
                lastOct[lane] = pitch;
                note(at, lane, pitch, 0.12, '#3F7D5A', 'PH'+item.n+' '+NAME(pitch), 'asm-phase', 95);
                n++;
            }
        log.push('phasearc '+item.n+'  '+t.toFixed(1)+' -> '+end.toFixed(1)+'s  ('+dur+'s, '+
                 item.arc.map(p=>p.label).join(' > ')+', '+n+' notes)');
        t = end;
    } else if (item.k === 'r17') {
        // RE-PITCH THE ORIGINAL "17 oct A#" SECTION (composer, day 21 — the
        // correction: the 4:3:2 arc belongs on the EXISTING section at ~36 s,
        // not on an inserted chunk): A# octaves as written | B octaves
        // (transpose +1) | re-draw from the C-rooted fifths chain.
        const F5_C = [36,43,50,57,64];                   // C2 G2 D3 A3 E4
        const w = j.objects.filter(o => o.type==='waveCurve' &&
            (o.performanceNotes||'').indexOf('D oct A#') === 0 && !/^asm-/.test((o.properties||{}).gen||''));
        const a = Math.min(...w.map(x=>x.startSeconds)), b = Math.max(...w.map(x=>x.startSeconds));
        const span = b - a, b1 = a + span*4/9, b2 = a + span*7/9;
        const lastP = new Array(10).fill(null);
        const draw = (set, layer) => { let k;
            do { k = set[(rnd()*set.length)|0]; } while (k === lastP[layer] && set.length > 1);
            lastP[layer] = k; return k; };
        let n2=0, n3=0;
        w.sort((x,y)=>x.startSeconds-y.startSeconds).forEach(x => {
            if (x.startSeconds < b1) return;             // part 1: A# octaves as written
            if (x.startSeconds < b2) { x.sonifyNote = x.sonifyNote + 1; n2++; }   // B octaves
            else { x.sonifyNote = draw(F5_C, x.layer); n3++; }
        });
        mark(b1, '17→B oct', '#C62828', '4:3:2 repitch, part 2 (+1)');
        mark(b2, '17→5ths C', '#C62828', '4:3:2 repitch, part 3 (C2 G2 D3 A3 E4)');
        log.push('r17: '+a.toFixed(1)+'-'+b.toFixed(1)+'s  A# oct to '+b1.toFixed(1)+' | B oct '+n2+' notes to '+b2.toFixed(1)+' | 5thsC '+n3+' notes');
    } else if (item.k === 'r27') {
        // RE-PITCH THE ORIGINAL "27 oct B" SECTION (composer, day 21):
        // reversed ratio 2:3:4 across its span — B octaves stay | re-draw from
        // the C#-rooted fifths chain | re-draw from species 30. Rhythm, parts
        // and dynamics untouched; only sonifyNote moves. Idempotent because
        // every run re-reads pristine SRC (003b) before transforming.
        const F5_CS = [37,44,51,58,65];                  // C#2 G#2 D#3 A#3 F4
        const w = j.objects.filter(o => o.type==='waveCurve' &&
            (o.performanceNotes||'').indexOf('F oct B') === 0 && !/^asm-/.test((o.properties||{}).gen||''));
        const a = Math.min(...w.map(x=>x.startSeconds)), b = Math.max(...w.map(x=>x.startSeconds));
        const span = b - a, b1 = a + span*2/9, b2 = a + span*5/9;
        const lastP = new Array(10).fill(null);
        const draw = (set, layer) => { let k;
            do { k = set[(rnd()*set.length)|0]; } while (k === lastP[layer] && set.length > 1);
            lastP[layer] = k; return k; };
        let n2=0, n3=0;
        w.sort((x,y)=>x.startSeconds-y.startSeconds).forEach(x => {
            if (x.startSeconds < b1) return;             // part 1: B octaves as written
            if (x.startSeconds < b2) { x.sonifyNote = draw(F5_CS, x.layer); n2++; }
            else { x.sonifyNote = draw(SPECIES['30'], x.layer); n3++; }
        });
        mark(b1, '27→5ths C#', '#C62828', 'reversed 2:3:4 repitch, part 2');
        mark(b2, '27→sp30', '#C62828', 'reversed 2:3:4 repitch, part 3');
        log.push('r27: '+a.toFixed(1)+'-'+b.toFixed(1)+'s  B oct to '+b1.toFixed(1)+' | 5thsC# '+n2+' notes to '+b2.toFixed(1)+' | sp30 '+n3+' notes');
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
            const lanes = pickLanes(rnd, v.stac.length + v.cuiv.length);
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
