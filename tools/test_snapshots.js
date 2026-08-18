#!/usr/bin/env node
// test_snapshots.js — PLAN 2ab §5. Pins score/snapshots.js.
//
//   node tools/test_snapshots.js
//
// The last block is a MUTATION TEST: it deliberately breaks the deep copy and
// asserts that the deep-copy check above would have caught it. A test that
// cannot fail is not a test — day 16 mutation-tested test_pulse.js the same
// way, and the habit is why the cuivre bug did not ship.

'use strict';

const S = require('../score/snapshots.js');

let pass = 0, fail = 0;
function ok(cond, what) {
    if (cond) { pass++; }
    else { fail++; console.error('  FAIL: ' + what); }
}
function eq(a, b, what) {
    ok(a === b, what + ' — expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a));
}
function deepEq(a, b, what) {
    ok(JSON.stringify(a) === JSON.stringify(b),
       what + ' — expected ' + JSON.stringify(b) + ', got ' + JSON.stringify(a));
}
function seed() {
    return { _version: 1, panels: { pulse: {}, multitempo: {}, phase: {} } };
}
const NOW = '2026-08-17T12:00:00.000Z';
const LATER = '2026-08-18T09:30:00.000Z';

// A realistic pulse payload: exactly what pulse_seq_panel.js save() writes.
function pulseState() {
    return {
        grid: { bpm: 150, columns: 32, noteLen: 0.25,
                cells: ['FIFTHS', 'CLUST10', null, 'S047'] },
        loopOn: true, brush: 'FIFTHS',
    };
}

console.log('snapshots — save');
{
    const f = seed();
    const st = pulseState();
    const r = S.merge(f, { panel: 'pulse', name: 'take-01-fifths', comment: 'nice', state: st }, NOW);
    ok(r.ok, 'save returns ok');
    eq(r.action, 'save', 'action is save');
    eq(r.existed, false, 'a new name did not exist');
    eq(r.count, 1, 'count is 1');
    const e = f.panels.pulse['take-01-fifths'];
    ok(!!e, 'the entry landed under its name');
    deepEq(e.state, pulseState(), 'state round-trips deep-equal');
    eq(e.comment, 'nice', 'comment stored');
    eq(e.saved, NOW, 'saved is stamped from the injected clock');
}

console.log('snapshots — the stamp is the server\'s, not the client\'s');
{
    const f = seed();
    // A client that tries to set its own date must not win.
    S.merge(f, { panel: 'pulse', name: 'a', state: {}, saved: '1999-01-01T00:00:00.000Z' }, NOW);
    eq(f.panels.pulse.a.saved, NOW, 'client-supplied saved is ignored');
    const f2 = seed();
    S.merge(f2, { panel: 'pulse', name: 'b', state: {} });
    ok(/^\d{4}-\d{2}-\d{2}T/.test(f2.panels.pulse.b.saved), 'default clock produces an ISO stamp');
}

console.log('snapshots — same name replaces');
{
    const f = seed();
    S.merge(f, { panel: 'pulse', name: 'dup', comment: 'first', state: { v: 1 } }, NOW);
    const r = S.merge(f, { panel: 'pulse', name: 'dup', comment: 'second', state: { v: 2 } }, LATER);
    ok(r.ok, 'replace returns ok');
    eq(r.existed, true, 'replace reports that it existed');
    eq(r.count, 1, 'replacing does not add a second entry');
    eq(f.panels.pulse.dup.state.v, 2, 'state replaced');
    eq(f.panels.pulse.dup.comment, 'second', 'comment replaced');
    eq(f.panels.pulse.dup.saved, LATER, 'stamp refreshed');
}

console.log('snapshots — delete');
{
    const f = seed();
    S.merge(f, { panel: 'pulse', name: 'gone', state: { v: 1 } }, NOW);
    S.merge(f, { panel: 'pulse', name: 'stays', state: { v: 2 } }, NOW);
    const r = S.merge(f, { panel: 'pulse', name: 'gone', delete: true }, NOW);
    ok(r.ok, 'delete returns ok');
    eq(r.existed, true, 'delete of a present name reports existed');
    eq(r.count, 1, 'count drops to 1');
    ok(!('gone' in f.panels.pulse), 'the name is gone');
    ok('stays' in f.panels.pulse, 'the other name survives');
}

console.log('snapshots — delete of a missing name is a SUCCESS');
{
    const f = seed();
    let threw = null;
    let r = null;
    try { r = S.merge(f, { panel: 'pulse', name: 'never-existed', delete: true }, NOW); }
    catch (e) { threw = e; }
    ok(!threw, 'delete of a missing name does not throw');
    ok(r && r.ok === true, 'ok is true');
    eq(r && r.existed, false, 'existed is false');
    eq(r && r.count, 0, 'count is 0');
    // and it must not have invented the entry on the way past
    ok(!('never-existed' in f.panels.pulse), 'no ghost entry created');
}

console.log('snapshots — an unknown panel is CREATED, not rejected');
{
    const f = seed();
    const r = S.merge(f, { panel: 'brandnew', name: 'x', state: { a: 1 } }, NOW);
    ok(r.ok, 'unknown panel accepted');
    eq(r.count, 1, 'count for the new panel');
    ok(!!f.panels.brandnew.x, 'the bucket was created');
    // the pre-existing panels are untouched
    deepEq(Object.keys(f.panels).sort(), ['brandnew', 'multitempo', 'phase', 'pulse'],
           'existing panels survive');
}
{
    // a file with no panels key at all
    const f = { _version: 1 };
    const r = S.merge(f, { panel: 'pulse', name: 'x', state: {} }, NOW);
    ok(r.ok, 'a file missing `panels` is repaired, not rejected');
    ok(!!f.panels.pulse.x, 'entry landed');
}

console.log('snapshots — bad names are refused LOUDLY');
{
    const bad = ['', 'a/b', 'a\\b', '..\\x', 'x'.repeat(65), 'tab\there', 'nl\nhere', 'e#1', 'q?'];
    bad.forEach(n => {
        const f = seed();
        const r = S.merge(f, { panel: 'pulse', name: n, state: {} }, NOW);
        ok(r.ok === false, 'name ' + JSON.stringify(n) + ' rejected');
        ok(typeof r.error === 'string' && r.error.length > 10,
           'name ' + JSON.stringify(n) + ' carries an explanatory error');
        eq(Object.keys(f.panels.pulse).length, 0, 'nothing written for ' + JSON.stringify(n));
    });
    // and the boundary that must PASS
    const good = ['a', 'x'.repeat(64), 'take-01_fifths.v2 final'];
    good.forEach(n => {
        const f = seed();
        const r = S.merge(f, { panel: 'pulse', name: n, state: {} }, NOW);
        ok(r.ok === true, 'name ' + JSON.stringify(n) + ' accepted');
    });
    // a missing name is refused too
    const f = seed();
    ok(S.merge(f, { panel: 'pulse', state: {} }, NOW).ok === false, 'missing name refused');
    ok(S.merge(f, { name: 'x', state: {} }, NOW).ok === false, 'missing panel refused');
    ok(S.merge(f, { panel: 'p', name: 'x' }, NOW).ok === false, 'missing state refused');
    ok(S.merge(f, { panel: 'p', name: 'x', state: 'nope' }, NOW).ok === false, 'string state refused');
    ok(S.merge(f, { panel: 'p', name: 'x', state: [1, 2] }, NOW).ok === false, 'array state refused');
    ok(S.merge(f, { panel: 'p', name: 'x', state: null }, NOW).ok === false, 'null state refused');
}

console.log('snapshots — the file is not an object');
{
    ok(S.merge(null, { panel: 'p', name: 'x', state: {} }, NOW).ok === false, 'null file refused');
    ok(S.merge([], { panel: 'p', name: 'x', state: {} }, NOW).ok === false, 'array file refused');
}

console.log('snapshots — DEEP COPY: mutating the caller\'s state does not reach the file');
let deepCopyHeld = false;
{
    const f = seed();
    const live = pulseState();
    S.merge(f, { panel: 'pulse', name: 'dc', state: live }, NOW);

    // The browser keeps using its live object after POSTing it.
    live.grid.bpm = 999;
    live.grid.cells[0] = 'MUTATED';
    live.grid.cells.push('EXTRA');
    live.loopOn = false;

    const stored = f.panels.pulse.dc.state;
    deepCopyHeld = (stored.grid.bpm === 150 &&
                    stored.grid.cells[0] === 'FIFTHS' &&
                    stored.grid.cells.length === 4 &&
                    stored.loopOn === true);
    ok(deepCopyHeld, 'the stored snapshot is insulated from later mutation');
    // nested identity, not just value
    ok(stored.grid !== live.grid, 'nested objects are copies, not references');
    ok(stored.grid.cells !== live.grid.cells, 'nested arrays are copies, not references');
}

console.log('snapshots — MUTATION TEST: break the deep copy, confirm the check catches it');
{
    // A merge that stores state BY REFERENCE — the bug the check above exists
    // to catch. If the assertions pass against this, they were never testing
    // anything.
    function brokenMerge(file, req, now) {
        file.panels[req.panel] = file.panels[req.panel] || {};
        file.panels[req.panel][req.name] = { saved: now, comment: '', state: req.state };
        return { ok: true };
    }
    const f = seed();
    const live = pulseState();
    brokenMerge(f, { panel: 'pulse', name: 'dc', state: live }, NOW);
    live.grid.bpm = 999;
    live.grid.cells[0] = 'MUTATED';

    const stored = f.panels.pulse.dc.state;
    const wouldHavePassed = (stored.grid.bpm === 150 && stored.grid.cells[0] === 'FIFTHS');
    ok(wouldHavePassed === false, 'the deep-copy check FAILS against a by-reference merge');
    ok(deepCopyHeld === true, 'and PASSES against the real one — so it discriminates');
}

console.log('');
console.log(pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
