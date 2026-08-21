#!/usr/bin/env node
// ir_validate.js — validate a notation IR document (schema v0).
// Usage: node tools/ir_validate.js <file.ir.json> [--against-source]
//
// Read-only: reports and exits, never writes. The orphaned flag is owned by
// a future re-attachment maintenance pass, never by hand and never by this
// tool; this tool errors on unresolved overlay targets (unless flagged) AND
// on stale flags (orphaned:true whose target resolves).
//
// Three layers:
//  1. Schema conformance — interprets notation/schema/ir_v0.schema.json
//     directly (ONE source of truth; no re-stated rules to drift, Principle 5).
//  2. Referential integrity — unique ids · refs resolve · deterministic ids
//     for derived events AND derived chunks · exclusivity (an event lives in
//     at most one chunk; same-part chunks are disjoint) · spans nest ·
//     spelled pitch equals midi · tempo self-consistent · chunk.class exists
//     in the registry · strategy-overlay values legal · no layout-unit or
//     curve-data keys anywhere (finite blocklists — a heuristic, not proof).
//  3. --against-source — copied sounding facts (onset/pitch/technique) still
//     match the S1 score object, cross-score refs included; the source must
//     be a waveCurve; the containing chunk's part must equal the source
//     object's layer (identity mapping — revisit if a score ever diverges).
//     Duration is deliberately NOT checked: fixed one-shots carry
//     sample-true length, which diverges from the drawn block by design (D9).
// Exit 0 clean; exit 1 with findings.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCHEMA = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'schema', 'ir_v0.schema.json'), 'utf8'));
const REGISTRY = JSON.parse(fs.readFileSync(path.join(ROOT, 'notation', 'registry', 'classes.json'), 'utf8'));
const CLASS_NAMES = new Set(REGISTRY.classes.map(c => c.class));
const STRATEGY_ENUM = SCHEMA.definitions.chunk.properties.strategy.enum;

// ---------- layer 1: JSON-Schema subset interpreter ----------
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function deref(s) {
  if (s && s.$ref) {
    const m = s.$ref.match(/^#\/definitions\/(.+)$/);
    if (!m) throw new Error('unsupported $ref ' + s.$ref);
    return SCHEMA.definitions[m[1]];
  }
  return s;
}
function typeOk(t, v) {
  if (t === 'object') return v !== null && typeof v === 'object' && !Array.isArray(v);
  if (t === 'array') return Array.isArray(v);
  if (t === 'string') return typeof v === 'string';
  if (t === 'number') return typeof v === 'number' && isFinite(v);
  if (t === 'integer') return typeof v === 'number' && Number.isInteger(v);
  if (t === 'boolean') return typeof v === 'boolean';
  if (t === 'null') return v === null;
  return false;
}
function validate(schemaIn, v, p, errs) {
  const s = deref(schemaIn);
  if (!s || Object.keys(s).length === 0) return; // {} = anything
  if (s.const !== undefined && v !== s.const) errs.push(`${p}: expected const ${JSON.stringify(s.const)}`);
  if (s.enum && !s.enum.includes(v)) errs.push(`${p}: ${JSON.stringify(v)} not in enum [${s.enum.join(', ')}]`);
  if (s.type) {
    const types = Array.isArray(s.type) ? s.type : [s.type];
    if (!types.some(t => typeOk(t, v))) { errs.push(`${p}: expected ${types.join('|')}, got ${Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v}`); return; }
  }
  if (typeof v === 'string' && s.pattern && !new RegExp(s.pattern).test(v)) errs.push(`${p}: "${v}" fails pattern ${s.pattern}`);
  if (typeof v === 'number') {
    if (s.minimum !== undefined && v < s.minimum) errs.push(`${p}: ${v} < minimum ${s.minimum}`);
    if (s.maximum !== undefined && v > s.maximum) errs.push(`${p}: ${v} > maximum ${s.maximum}`);
    if (s.exclusiveMinimum !== undefined && v <= s.exclusiveMinimum) errs.push(`${p}: ${v} <= exclusiveMinimum ${s.exclusiveMinimum}`);
    if (s.multipleOf !== undefined && Math.abs(v / s.multipleOf - Math.round(v / s.multipleOf)) > 1e-9) errs.push(`${p}: ${v} not a multiple of ${s.multipleOf}`);
  }
  if (Array.isArray(v)) {
    if (s.minItems !== undefined && v.length < s.minItems) errs.push(`${p}: ${v.length} items < minItems ${s.minItems}`);
    if (s.maxItems !== undefined && v.length > s.maxItems) errs.push(`${p}: ${v.length} items > maxItems ${s.maxItems}`);
    if (s.items) v.forEach((x, i) => validate(s.items, x, `${p}[${i}]`, errs));
  }
  if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
    if (s.minProperties !== undefined && Object.keys(v).length < s.minProperties) errs.push(`${p}: fewer than ${s.minProperties} properties`);
    for (const r of s.required || []) if (!hasOwn(v, r)) errs.push(`${p}: missing required "${r}"`);
    for (const [k, val] of Object.entries(v)) {
      if (s.properties && hasOwn(s.properties, k)) validate(s.properties[k], val, `${p}.${k}`, errs);
      else if (s.additionalProperties === false) errs.push(`${p}: unknown property "${k}"`);
    }
  }
}

// ---------- layer 2: referential integrity ----------
const LAYOUT_KEYS = new Set(['x', 'y', 'px', 'pixelX', 'pixelY', 'pageX', 'pageY', 'left', 'top', 'right', 'bottom',
  'width', 'height', 'cx', 'cy', 'translateX', 'translateY', 'laneFraction', 'laneHeightPx', 'staffSpaces', 'ss']);
const CURVE_KEYS = new Set(['nodes', 'segments', 'morphBend', 'envShape']);
function scanForbidden(v, p, errs) {
  if (Array.isArray(v)) v.forEach((x, i) => scanForbidden(x, `${p}[${i}]`, errs));
  else if (v && typeof v === 'object') for (const [k, val] of Object.entries(v)) {
    if (LAYOUT_KEYS.has(k) || /Px$/.test(k)) errs.push(`${p}.${k}: layout-unit key in IR — the IR is semantic; layout units are a bug here`);
    if (CURVE_KEYS.has(k)) errs.push(`${p}.${k}: curve-data key in IR — reference S1, never copy the continuous (spec §2)`);
    scanForbidden(val, `${p}.${k}`, errs);
  }
}
const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function dupCheck(ids, label, errs) {
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) errs.push(`duplicate ${label} "${id}" — ids are unique within the file (spec §1 rule 1)`);
    seen.add(id);
  }
}
function integrity(doc, errs) {
  // unique ids across ALL node kinds
  const allIds = [];
  for (const e of doc.events) allIds.push(e.id);
  for (const c of doc.chunks) {
    allIds.push(c.id);
    for (const g of c.groups || []) allIds.push(g.id);
    for (const d of c.devices || []) allIds.push(d.id);
  }
  for (const o of doc.overlays) allIds.push(o.id);
  dupCheck(allIds, 'node id', errs);
  if (errs.length) return; // ref checks against ambiguous maps prove nothing

  const evById = new Map(doc.events.map(e => [e.id, e]));
  const chById = new Map(doc.chunks.map(c => [c.id, c]));
  const [w0, w1] = doc.source.window;
  if (!(w1 > w0)) errs.push(`source.window: [${w0}, ${w1}] not increasing`);

  for (const e of doc.events) {
    if (e.source && e.id !== 'ev-' + e.source.objectId)
      errs.push(`${e.id}: deterministic-id rule — event with source ${e.source.objectId} must be id "ev-${e.source.objectId}"`);
    if (!e.source && e.provenance === 'derived')
      errs.push(`${e.id}: derived event with no source ref`);
    if (e.onset < w0 || e.onset > w1) errs.push(`${e.id}: onset ${e.onset} outside source.window [${w0}, ${w1}]`);
    const sp = e.pitch.spelled;
    const midiFromSpelled = PC[sp.step] + sp.alter + 12 * (sp.octave + 1);
    if (Math.abs(midiFromSpelled - e.pitch.midi) > 1e-9)
      errs.push(`${e.id}: spelled ${sp.step}${sp.alter >= 0 ? '+' + sp.alter : sp.alter}/${sp.octave} = midi ${midiFromSpelled}, but pitch.midi = ${e.pitch.midi}`);
    if (e.metric) {
      const ch = chById.get(e.metric.chunk);
      if (!ch) errs.push(`${e.id}: metric.chunk "${e.metric.chunk}" does not exist`);
      else if (!ch.events.includes(e.id)) errs.push(`${e.id}: metric.chunk ${ch.id} does not list this event`);
      for (let i = 1; i < e.metric.grid.length; i++)
        if (e.metric.grid[i] < e.metric.grid[i - 1]) errs.push(`${e.id}: metric.grid not non-decreasing`);
    }
  }

  const memberOf = new Map(); // eventId -> chunkId (exclusivity)
  const byPart = new Map();   // part -> [chunk] (same-part disjointness)
  for (const c of doc.chunks) {
    if (!(c.span[1] > c.span[0])) errs.push(`${c.id}: span not increasing`);
    if (c.span[0] < w0 || c.span[1] > w1) errs.push(`${c.id}: span outside source.window`);
    if (!doc.source.parts.includes(c.part)) errs.push(`${c.id}: part ${c.part} not in source.parts`);
    if (!CLASS_NAMES.has(c.class)) errs.push(`${c.id}: class "${c.class}" not in notation/registry/classes.json — unknown never passes silently (A1 §2)`);
    dupCheck(c.events, `event ref in ${c.id}`, errs);
    for (const ref of c.events) {
      const e = evById.get(ref);
      if (!e) { errs.push(`${c.id}: event ref "${ref}" does not exist`); continue; }
      if (memberOf.has(ref)) errs.push(`${ref}: member of both ${memberOf.get(ref)} and ${c.id} — an event lives in at most one chunk (spec §5)`);
      memberOf.set(ref, c.id);
      if (e.onset < c.span[0] || e.onset >= c.span[1]) errs.push(`${c.id}: event ${ref} onset ${e.onset} outside chunk span [${c.span[0]}, ${c.span[1]})`);
    }
    for (const g of c.groups || []) {
      dupCheck(g.events, `event ref in ${c.id}/${g.id}`, errs);
      for (const ref of g.events)
        if (!c.events.includes(ref)) errs.push(`${c.id}/${g.id}: beam event "${ref}" not in chunk.events`);
    }
    for (const d of c.devices || [])
      if (d.at < c.span[0] || d.at > c.span[1]) errs.push(`${c.id}/${d.id}: at ${d.at} outside chunk span (device "at" is absolute seconds within the span)`);
    if (c.tempo) {
      if (c.tempo.anchorSeconds < c.span[0] || c.tempo.anchorSeconds > c.span[1])
        errs.push(`${c.id}: tempo.anchorSeconds ${c.tempo.anchorSeconds} outside span`);
      if (c.tempo.subdivision !== undefined && Math.abs(c.tempo.subdivision * c.tempo.unitSeconds - c.tempo.beatSeconds) > 1e-9)
        errs.push(`${c.id}: tempo inconsistent — subdivision ${c.tempo.subdivision} × unitSeconds ${c.tempo.unitSeconds} != beatSeconds ${c.tempo.beatSeconds}`);
    }
    // deterministic chunk id (derived chunks with a sourced earliest event)
    if (c.provenance === 'derived' && c.events.length) {
      const members = c.events.map(r => evById.get(r)).filter(Boolean);
      if (members.length) {
        const first = members.reduce((a, b) => (b.onset < a.onset ? b : a));
        if (first.source) {
          const want = `ch-${c.part}-${first.source.objectId}`;
          if (c.id !== want)
            errs.push(`${c.id}: deterministic-id rule — derived chunk (part ${c.part}, earliest member ${first.id}) must be id "${want}" so authored overlays orphan loudly instead of re-binding silently`);
        }
      }
    }
    if (!byPart.has(c.part)) byPart.set(c.part, []);
    byPart.get(c.part).push(c);
  }
  for (const [part, chunks] of byPart) {
    const sorted = [...chunks].sort((a, b) => a.span[0] - b.span[0]);
    for (let i = 1; i < sorted.length; i++)
      if (sorted[i].span[0] < sorted[i - 1].span[1])
        errs.push(`part ${part}: chunks ${sorted[i - 1].id} and ${sorted[i].id} overlap — same-part chunks are disjoint (spec §5)`);
  }

  for (const o of doc.overlays) {
    const t = o.target;
    let resolves = true;
    if (t.event) { if (!evById.has(t.event)) resolves = false; }
    if (t.chunk) { if (!chById.has(t.chunk)) resolves = false; }
    if (t.part !== undefined && !doc.source.parts.includes(t.part)) errs.push(`${o.id}: target part ${t.part} not in source.parts`);
    if (t.parts) for (const p of t.parts) if (!doc.source.parts.includes(p)) errs.push(`${o.id}: target parts includes ${p}, not in source.parts`);
    if (t.span) {
      if (!(t.span[1] > t.span[0])) errs.push(`${o.id}: target span not increasing`);
      if (t.span[0] < w0 || t.span[1] > w1) errs.push(`${o.id}: target span outside source.window`);
    }
    if (!resolves && !o.orphaned) errs.push(`${o.id}: target does not resolve (the re-attachment maintenance pass sets "orphaned": true; never drop silently)`);
    if (resolves && o.orphaned) errs.push(`${o.id}: stale orphaned flag — target resolves; clear the flag`);
    if (o.provenance === 'authored-override' && (o.contradicts === undefined || o.contradicts === null))
      errs.push(`${o.id}: authored-override must record what it contradicts`);
    if (o.kind === 'strategy') {
      if (!STRATEGY_ENUM.includes(o.value))
        errs.push(`${o.id}: strategy overlay value ${JSON.stringify(o.value)} not in strategy enum [${STRATEGY_ENUM.join(', ')}]`);
      if (!t.chunk && !t.span)
        errs.push(`${o.id}: strategy overlay must target a chunk or a span`);
    }
    if (o.kind === 'spelling' && t.event && evById.has(t.event)) {
      const v = o.value, e = evById.get(t.event);
      if (!v || typeof v !== 'object' || !(v.step in PC) || typeof v.alter !== 'number' || !Number.isInteger(v.octave))
        errs.push(`${o.id}: spelling overlay value must be a {step, alter, octave} object`);
      else {
        const m = PC[v.step] + v.alter + 12 * (v.octave + 1);
        if (Math.abs(m - e.pitch.midi) > 1e-9)
          errs.push(`${o.id}: respell ${v.step}${v.alter >= 0 ? '+' + v.alter : v.alter}/${v.octave} = midi ${m}, but ${t.event} sounds midi ${e.pitch.midi} — a spelling overlay renames, never re-pitches`);
      }
    }
  }
}

// ---------- layer 3: against-source ----------
function againstSource(doc, errs) {
  const cache = new Map();
  function loadScore(name) {
    if (cache.has(name)) return cache.get(name);
    const f = path.join(ROOT, 'scores', name + '.json');
    if (!fs.existsSync(f)) { cache.set(name, null); return null; }
    const s = JSON.parse(fs.readFileSync(f, 'utf8'));
    cache.set(name, new Map((s.objects || []).map(o => [o.id, o])));
    return cache.get(name);
  }
  const partOf = new Map();
  for (const c of doc.chunks) for (const ref of c.events) partOf.set(ref, c.part);
  for (const e of doc.events) {
    if (!e.source) continue;
    const byId = loadScore(e.source.score);
    if (!byId) { errs.push(`${e.id}: source score "${e.source.score}" not found in scores/`); continue; }
    const o = byId.get(e.source.objectId);
    if (!o) { errs.push(`${e.id}: source object ${e.source.objectId} not in ${e.source.score}`); continue; }
    if (o.type !== 'waveCurve' || o.startSeconds === undefined) {
      errs.push(`${e.id}: source object ${e.source.objectId} is not a waveCurve — a sounding event never sources a ${o.type}`);
      continue;
    }
    if (Math.abs(e.onset - o.startSeconds) > 1e-9) errs.push(`${e.id}: onset ${e.onset} != source startSeconds ${o.startSeconds}`);
    if (o.sonifyNote !== undefined && e.pitch.midi !== o.sonifyNote) errs.push(`${e.id}: midi ${e.pitch.midi} != source sonifyNote ${o.sonifyNote}`);
    if (o.technique !== undefined && e.technique !== o.technique) errs.push(`${e.id}: technique "${e.technique}" != source "${o.technique}"`);
    const part = partOf.get(e.id);
    if (part !== undefined && o.layer !== undefined && o.layer !== part)
      errs.push(`${e.id}: containing chunk part ${part} != source object layer ${o.layer} (identity mapping; add a per-score map if a score ever diverges)`);
  }
}

// ---------- --complete: every S1 onset in window×parts has an event ----------
// Opt-in: only extractor-produced documents claim completeness (spec §7);
// hand-worked partial docs stay legal without it.
function completeness(doc, errs) {
  const f = path.join(ROOT, 'scores', doc.source.score + '.json');
  if (!fs.existsSync(f)) { errs.push(`--complete: ${f} not found`); return; }
  const score = JSON.parse(fs.readFileSync(f, 'utf8'));
  const have = new Set(doc.events.filter(e => e.source).map(e => e.source.objectId));
  const [w0, w1] = doc.source.window;
  for (const o of score.objects || []) {
    if (o.type !== 'waveCurve' || o.layer === 10) continue;
    if (!doc.source.parts.includes(o.layer)) continue;
    if (o.startSeconds < w0 || o.startSeconds >= w1) continue; // half-open (A3 ownership law)
    if (!have.has(o.id)) errs.push(`--complete: S1 object ${o.id} (layer ${o.layer}, t=${o.startSeconds}) has no event in this document`);
  }
}

// ---------- main ----------
const args = process.argv.slice(2);
const file = args.find(a => !a.startsWith('--'));
if (!file) { console.error('usage: node tools/ir_validate.js <file.ir.json> [--against-source] [--complete]'); process.exit(2); }
const doc = JSON.parse(fs.readFileSync(file, 'utf8'));
const errs = [];
validate(SCHEMA, doc, '$', errs);
if (errs.length === 0) { // integrity only meaningful on a well-formed doc
  scanForbidden(doc, '$', errs);
  if (errs.length === 0) integrity(doc, errs);
  if (errs.length === 0 && args.includes('--against-source')) againstSource(doc, errs);
  if (errs.length === 0 && args.includes('--complete')) completeness(doc, errs);
}
if (errs.length) {
  console.error(`INVALID — ${errs.length} finding(s) in ${file}:`);
  for (const e of errs) console.error('  · ' + e);
  process.exit(1);
}
console.log(`VALID: ${file} (${doc.events.length} events, ${doc.chunks.length} chunks, ${doc.overlays.length} overlays${args.includes('--against-source') ? '; against-source checked' : ''}${args.includes('--complete') ? '; completeness checked' : ''})`);
