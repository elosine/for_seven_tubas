#!/usr/bin/env node
// Playability audit over saved scores (PLAN 2r).
//
// Same rule as Composer.CONFLICT in score/public/composer.html — HARD = two
// notes sounding at once on one player (physics); SOFT = a real gap that is too
// short to re-tongue / leap (estimates). Kept in sync by hand; the browser
// engine is the authority, and this tool is cross-checked against it.
//
//   node tools/audit_playability.js [glob-ish substring ...]
//
// No args = every scores/*.json.

const fs = require('fs');
const path = require('path');

const META_LAYER = 10;
const TONGUE_RESET = 0.03;
const MIN_ATTACK = 0.11;
const PER_SEMITONE = 0.0093;
const MAX_LEAP_ADD = 0.22;
const WINDOW = MIN_ATTACK + MAX_LEAP_ADD;

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const pn = m => (m == null ? '?' : NAMES[((m % 12) + 12) % 12] + (Math.floor(m / 12) - 1));

function requiredAttack(prev, next) {
    const leap = Math.abs((next.sonifyNote || 0) - (prev.sonifyNote || 0));
    return MIN_ATTACK + Math.min(MAX_LEAP_ADD, leap * PER_SEMITONE);
}
function pairTier(a, b) {
    if (b.startSeconds < a.endSeconds - 1e-6) return 'hard';
    if (b.startSeconds - a.endSeconds < TONGUE_RESET - 1e-6) return 'soft';
    return (b.startSeconds - a.startSeconds) < requiredAttack(a, b) - 1e-6 ? 'soft' : 'free';
}

function noteEvents(objects) {
    return objects.filter(o =>
        o && o.type === 'waveCurve' && o.sonifyNote != null &&
        o.layer >= 0 && o.layer < META_LAYER &&
        o.startSeconds != null && o.endSeconds != null);
}

function analyze(objects) {
    const lanes = new Map();
    for (const o of noteEvents(objects)) {
        if (!lanes.has(o.layer)) lanes.set(o.layer, []);
        lanes.get(o.layer).push(o);
    }
    const pairs = [];
    for (const [layer, list] of lanes) {
        list.sort((a, b) => a.startSeconds - b.startSeconds || a.endSeconds - b.endSeconds);
        for (let i = 0; i < list.length; i++) {
            for (let j = i + 1; j < list.length; j++) {
                const a = list[i], b = list[j];
                if (b.startSeconds - a.endSeconds > WINDOW) break;
                const tier = pairTier(a, b);
                if (tier === 'free') continue;
                pairs.push({
                    tier, layer, at: a.startSeconds,
                    gap: +(b.startSeconds - a.endSeconds).toFixed(3),
                    attack: +(b.startSeconds - a.startSeconds).toFixed(3),
                    need: +requiredAttack(a, b).toFixed(3),
                    a: pn(a.sonifyNote) + ' ' + (a.technique || '?'),
                    b: pn(b.sonifyNote) + ' ' + (b.technique || '?'),
                    overlapBy: +(a.endSeconds - b.startSeconds).toFixed(3),
                });
            }
        }
    }
    return { notes: noteEvents(objects).length, lanes: lanes.size, pairs };
}

function loadScore(file) {
    const j = JSON.parse(fs.readFileSync(file, 'utf8'));
    return j.objects || (j.data && j.data.objects) || [];
}

const dir = path.join(__dirname, '..', 'scores');
const filters = process.argv.slice(2);
let files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
if (filters.length) files = files.filter(f => filters.some(s => f.includes(s)));
files.sort();

const rows = [];
for (const f of files) {
    let r;
    try { r = analyze(loadScore(path.join(dir, f))); }
    catch (e) { rows.push({ f, err: e.message }); continue; }
    const hard = r.pairs.filter(p => p.tier === 'hard');
    const soft = r.pairs.filter(p => p.tier === 'soft');
    rows.push({ f, notes: r.notes, lanes: r.lanes, hard: hard.length, soft: soft.length, pairs: r.pairs });
}

const dirty = rows.filter(r => r.hard > 0).sort((a, b) => b.hard - a.hard);
const clean = rows.filter(r => !r.err && r.hard === 0);

console.log('=== PLAYABILITY AUDIT — ' + rows.length + ' scores ===\n');
console.log('HARD = two notes at once on ONE player (impossible).');
console.log('SOFT = playable-but-tight re-attack/leap (estimated thresholds).\n');

console.log('--- scores WITH hard conflicts (' + dirty.length + ') ---');
if (!dirty.length) console.log('  none.');
for (const r of dirty) {
    const worst = r.pairs.filter(p => p.tier === 'hard')
        .sort((a, b) => b.overlapBy - a.overlapBy)[0];
    console.log('  ' + r.f.padEnd(30) + String(r.hard).padStart(5) + ' hard  ' +
        String(r.soft).padStart(4) + ' soft   (' + r.notes + ' notes) ' +
        ' worst overlap ' + worst.overlapBy.toFixed(2) + 's on lane ' + worst.layer +
        ' @ ' + worst.at.toFixed(1) + 's: ' + worst.a + ' vs ' + worst.b);
}

console.log('\n--- clean scores: ' + clean.length + ' (of which ' +
    clean.filter(r => r.soft > 0).length + ' have soft-only flags) ---');

const errs = rows.filter(r => r.err);
if (errs.length) {
    console.log('\n--- unreadable (' + errs.length + ') ---');
    errs.forEach(r => console.log('  ' + r.f + ': ' + r.err));
}

if (process.env.DETAIL) {
    const t = rows.find(r => r.f.includes(process.env.DETAIL));
    if (t) {
        console.log('\n=== DETAIL: ' + t.f + ' ===');
        t.pairs.filter(p => p.tier === 'hard').slice(0, 40).forEach(p =>
            console.log('  lane ' + p.layer + ' @ ' + p.at.toFixed(2) + 's  ' +
                p.a + '  vs  ' + p.b + '   overlap ' + p.overlapBy.toFixed(3) + 's'));
    }
}
