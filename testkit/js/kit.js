// kit.js — the page: buttons, the results store, the report cards, save/copy.
(function (root) {
  'use strict';
  const TK = root.TK = root.TK || {};
  const S = TK.stats;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? '—' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (v, unit) => (v == null || (typeof v === 'number' && !isFinite(v))) ? '—' : v + (unit || '');

  const R = { kit: { version: 'kit-1' }, device: {}, tests: {} };
  let running = false;

  // ------------------------------------------------------------ small ui
  function status(s, cls) { const el = $('#status'); el.textContent = s; el.className = cls || ''; }
  function label() { return ($('#label').value || '').trim(); }
  function mode() { return $('#full').checked ? 'full' : 'quick'; }
  let wl = null;
  async function keepAwake(on) {
    try {
      if (on && 'wakeLock' in navigator && !wl) wl = await navigator.wakeLock.request('screen');
      if (!on && wl) { await wl.release(); wl = null; }
    } catch (e) { wl = null; }
  }
  async function guard(name, fn) {
    if (running) return;
    if (!label()) { status('Name this device first (top of the page) — the results are filed under it.', 'warn'); $('#label').focus(); return; }
    running = true;
    document.body.classList.add('running');
    await keepAwake(true);
    try {
      if (!(await S.framesFlowing(2500))) throw new Error(S.NO_FRAMES);
      await fn();
    }
    catch (e) { status(name + ' stopped: ' + (e && e.message || e), 'warn'); R.tests[name] = Object.assign(R.tests[name] || {}, { error: String(e && e.message || e) }); render(); }
    finally {
      running = false;
      document.body.classList.remove('running');
      await keepAwake(false);
    }
  }
  function stamp(key, val) {
    R.device.label = label();
    R.device.when = new Date().toISOString();
    R.tests[key] = val;
    try { localStorage.setItem('tk-results', JSON.stringify(R)); } catch (e) { /* private mode */ }
    render();
  }

  // ------------------------------------------------------------ the tests
  const run = {
    async T5() { status('T5 · reading the device…'); stamp('T5', await TK.device.runT5()); status('T5 done.', 'ok'); },
    async T1() { status('T1 · frame health…'); stamp('T1', await TK.device.runT1({ quick: mode() === 'quick' })); status('T1 done.', 'ok'); },
    async T2() {
      status('T2 · the renderer shoot-out — keep this screen on and untouched…');
      const r = await TK.lanes.runT2({ seconds: mode() === 'quick' ? 15 : 55 }, s => status(s));
      stamp('T2', r); status('T2 done.', 'ok');
    },
    async T4() {
      status('T4 · the video stand…');
      const r = await TK.video.runT4({ quick: mode() === 'quick', withNetwork: $('#t4net').checked }, s => status(s));
      stamp('T4', r); status('T4 done.', 'ok');
    },
    async T3() {
      const live = $('#t3live');
      live.hidden = false;
      const cv = $('#t3chart'), logEl = $('#t3log'), ph = $('#t3phase'), ct = $('#t3count');
      logEl.innerHTML = '';
      let aborted = false;
      $('#t3stop').onclick = () => { aborted = true; };
      const lines = [];
      const r = await TK.clock.runT3({ quick: mode() === 'quick' }, {
        aborted: () => aborted,
        phase(name, lie, secs, what) { ph.innerHTML = '<b>' + esc(name) + '</b>' + (secs ? ' · ' + secs + ' s' : '') + ' — ' + esc(what || ''); status('T3 · ' + name + ' — ' + (what || '')); },
        sample(s, room) {
          const tf = room.truth(Math.max(0, room.samples.length - 150));
          TK.clock.drawChart(cv, room.samples, tf, 300000);
          if (tf) {
            const st = room.clock.status(performance.now());
            ct.textContent = 'state ' + st.state + (st.calibrated ? ' (calibrated ' + st.clockPpm.toFixed(1) + ' ppm)' : '') +
              ' · floor-rule error ' + (s.applied - tf.at(s.mid)).toFixed(1) + ' ms · plain sync ' + (s.naive - tf.at(s.mid)).toFixed(1) + ' ms · rtt ' + s.rtt.toFixed(1) +
              ' ms · refused: jump ' + st.refuse.jump + ', quorum ' + st.refuse.quorum + ', rate ' + st.refuse.rate + ', holdover ' + st.refuse.holdover;
          }
        },
        log(e) {
          if (e.kind === 'correct') return;
          lines.unshift('<li><b>' + esc(e.kind) + '</b> ' + esc(e.msg) + '</li>');
          if (lines.length > 14) lines.pop();
          logEl.innerHTML = lines.join('');
        },
      });
      stamp('T3', r);
      status('T3 done.', 'ok');
    },
    async all() {
      const q = mode() === 'quick';
      status('Running everything (' + (q ? 'quick, about 10 minutes' : 'full, about 40 minutes') + ') — keep this screen on and untouched.');
      for (const k of ['T5', 'T1', 'T2', 'T4', 'T3']) await run[k]();
      status('All tests done — press SAVE TO SERVER (or Copy JSON).', 'ok');
    },
  };

  // ------------------------------------------------------------ cards
  function row(k, v) { return '<tr><th>' + esc(k) + '</th><td>' + v + '</td></tr>'; }
  function card(title, sub, body, key) {
    return '<section class="card"><h3>' + esc(title) + '</h3><p class="sub">' + esc(sub) + '</p>' + body +
      '<details><summary>the numbers (JSON)</summary><pre>' + esc(JSON.stringify(R.tests[key], null, 1)).slice(0, 60000) + '</pre></details></section>';
  }
  // colour only the unloaded runs: under the synthetic load the missed frames
  // are the stalls the test injects on purpose, and red there would mislead
  function frameCells(f, colour) {
    if (!f) return '<td colspan="4">—</td>';
    if (f.error) return '<td colspan="4">' + esc(f.error) + '</td>';
    const bad = colour === false ? '' : (f.missedPct > 1 ? ' class="bad"' : (f.missedPct > 0.2 ? ' class="meh"' : ' class="good"'));
    return '<td' + bad + '>' + fmt(f.onTimePct, '%') + '</td><td>' + fmt(f.missedFrames) + ' (' + fmt(f.missedPct, '%') + ')</td><td>' + fmt(f.p99, ' ms') + '</td><td>' + fmt(f.stalls) + '</td>';
  }
  const renderers = {
    T5(r) {
      const d = r.decoding && r.decoding['H.264 1080p60 (the kit\'s clip)'] || {};
      return card('T5 · this device', 'what the machine is, and what it can do', '<table>' +
        row('screen', r.screen.width + '×' + r.screen.height + ' @' + r.screen.dpr + 'x · ' + fmt(r.screen.refreshHz, ' Hz')) +
        row('processor', fmt(r.cores, ' cores') + (r.memoryGB ? ' · ' + r.memoryGB + ' GB' : '')) +
        row('graphics', esc(r.gpu && (r.gpu.renderer || (r.gpu.webgl ? 'webgl' : 'no webgl')))) +
        row('video 1080p60', esc(d.canPlay) + (d.supported != null ? ' · smooth ' + d.smooth + ' · hardware (power-efficient) ' + d.powerEfficient : '')) +
        row('frame callbacks (for the servo)', r.requestVideoFrameCallback ? 'yes' : '<b class="bad">no</b>') +
        row('keep-screen-on (wake lock)', r.wakeLock.available ? (r.wakeLock.works ? 'works' : esc(r.wakeLock.why)) : esc(r.wakeLock.why)) +
        row('offline cache', esc(r.serviceWorker) + (r.storage.available ? ' · ' + r.storage.quotaMB + ' MB quota' : '')) +
        row('browser', '<small>' + esc(r.userAgent) + '</small>') + '</table>', 'T5');
    },
    T1(r) {
      const h = '<table class="grid"><tr><th></th><th>frames on time</th><th>missed frames</th><th>worst 1%</th><th>stalls</th></tr>' +
        '<tr><th>idle</th>' + frameCells(r.idle) + '</tr><tr><th>under load</th>' + frameCells(r.heavyLoad, false) + '</tr></table>' +
        '<p class="note">refresh ' + fmt(r.idle && r.idle.refreshHz, ' Hz') + ' · "under load" = 8 ms of busy work every frame + a 60 ms stall every 2 s</p>';
      return card('T1 · frame health', 'an empty animation loop — the floor every renderer stands on', h, 'T1');
    },
    T2(r) {
      let h = '<table class="grid"><tr><th>renderer</th><th>load</th><th>frames on time</th><th>missed frames</th><th>worst 1%</th><th>stalls</th><th>main-thread cost per frame (typical · 95%)</th><th>video: frames/s · repeats+skips · decoder drops</th></tr>';
      for (const [id, ln] of Object.entries(r.lanes || {})) {
        for (const [load, run2] of Object.entries(ln.runs || {})) {
          const p = run2.presentation, dec = run2.decoder;
          const mt = run2.frames && run2.frames.mainThreadFrameMs;
          h += '<tr><th title="' + esc(ln.desc) + '">' + esc(ln.label) + '</th><td>' + esc(load) + '</td>' + (run2.error ? '<td colspan="4">' + esc(run2.error) + '</td>' : frameCells(run2.frames, load === 'off')) +
            '<td>' + (mt ? fmt(mt.p50, ' ms') + ' · ' + fmt(mt.p95, ' ms') : '') + '</td>' +
            '<td>' + (p ? fmt(p.framesShownPerSec) + ' · ' + fmt(p.skips + p.holds) + ' (' + fmt(p.eventsPerMin, '/min') + ')' + (dec ? ' · ' + dec.dropped : '') : '') + '</td></tr>';
        }
      }
      h += '</table><p class="note">every lane plays the same music: ' + r.seconds + ' s of the busiest minute of the piece, from ' + r.window[0].toFixed(1) +
        ' s. The cost column is the one that travels to other devices: a tablet 5× slower than this one pays 5× the cost, against a 16.7 ms budget per frame at 60 Hz. For C the main thread draws nothing — its smoothness is the last column.</p>';
      return card('T2 · the renderer shoot-out', 'A0 today\'s engine · A1 retained SVG · A2 GPU layers · B canvas · C video', h, 'T2');
    },
    T3(r) {
      let h = '<table>' + row('this clock', r.drift ? esc(r.drift.meaning) + ' (± ' + r.drift.sigmaPpm + ' ppm)' : 'not enough data') +
        row('network round trip', 'median ' + r.rttMs.median + ' ms · worst ' + r.rttMs.max + ' ms') + '</table>';
      h += '<table class="grid"><tr><th>phase</th><th>what the server did</th><th>plain sync — worst error</th><th>floor rule — worst error</th><th>refused</th></tr>';
      for (const e of r.episodes) {
        const ref = Object.entries(e.refused).filter(([k, v]) => v > 0).map(([k, v]) => k + ' ' + v).join(', ') || '—';
        const good = e.mode === 'none' ? '' : (e.floorMaxMs <= 10 ? ' class="good"' : ' class="meh"');
        h += '<tr><th>' + esc(e.name) + '</th><td>' + esc(TK.clock.WHAT[e.name] || '') + '</td><td>' + fmt(e.naiveMaxMs, ' ms') + '</td><td' + good + '>' + fmt(e.floorMaxMs, ' ms') + '</td><td>' + esc(ref) + (e.trips ? ' · holdover ×' + e.trips : '') + '</td></tr>';
      }
      h += '</table><p class="note">errors are against the server\'s HONEST time, which the clock under test never sees. Uncalibrated, a refused lie costs what free-running costs (the crystal\'s drift); calibrated, the floor is tight.</p>';
      return card('T3 · the clock and the floor rule', 'this stand\'s drift, then the server lies to it', h, 'T3');
    },
    T4(r) {
      if (r.error) return card('T4 · the video stand', '', '<p class="bad">' + esc(r.error) + '</p>', 'T4');
      const fr = r.freeRun || {}, p = fr.presentation || {};
      let h = '<table>' +
        row('seek (exporter encode)', r.seek && r.seek[0] ? 'median ' + fmt(r.seek[0].seekedMs.median, ' ms') + ' · worst ' + fmt(r.seek[0].seekedMs.max, ' ms') : '—') +
        row('seek (1-s keyframes)', r.seek && r.seek[1] ? 'median ' + fmt(r.seek[1].seekedMs.median, ' ms') + ' · worst ' + fmt(r.seek[1].seekedMs.max, ' ms') : '—') +
        row('playing on its own', fmt(p.framesShownPerSec, ' frames/s') + ' · repeats+skips ' + fmt(p.skips + p.holds) + ' (' + fmt(p.eventsPerMin, '/min') + ')' + (fr.decoder ? ' · decoder drops ' + fr.decoder.dropped : '')) +
        row('player drift vs this clock', fmt(fr.playerDriftFromCurrentTimePpm != null ? fr.playerDriftFromCurrentTimePpm : fr.playerDriftPpm, ' ppm')) +
        row('video.currentTime', fr.currentTime ? esc(fr.currentTime.meaning) : '—') +
        row('1 % speed changes', (r.rate || []).map(x => x.requested + '× → ' + fmt(x.achieved) + ' (' + x.frameEvents + ' frame events)').join(' · ')) + '</table>';
      const sv = (name, s) => {
        if (!s) return '';
        return '<h4>' + esc(name) + ' — servo mode: ' + esc(s.mode) + ' · this browser shows the ' + esc(s.framePolicy) + ' frame</h4><table>' +
          row('the +80 ms wrong-clock step', s.step ? 'closed in ' + fmt(s.step.closedAfterS, ' s') + ' · overshoot ' + fmt(s.step.overshootMs, ' ms') + ' · cost ' + s.step.frameEvents + ' repeated/skipped frames (on a 60 Hz screen 80 ms is ' + s.step.expectedFrameEvents + ' frames)' : '—') +
          row('steady state: shown error', 'typical ' + fmt(s.shownErrorMs.p50, ' ms') + ' · 95% within ' + fmt(s.shownErrorMs.p95, ' ms') + ' (half a frame = ' + s.halfFrameMs + ' ms)') +
          row('steady state: frames the servo cost', fmt(s.steady.skips + s.steady.holds) + ' in ' + fmt(s.steady.minutes, ' min') + ' (' + fmt(s.steady.frameEventsPerMin, '/min') + ')') +
          row('servo', s.servo.rateChanges + ' rate changes · engaged ' + s.servo.engagedPct + '% of frames · learned player drift ' + s.servo.learnedPlayerDriftPpm + ' ppm') + '</table>';
      };
      h += sv('servo on the local clock', r.servoLocal) + sv('servo on the room clock (network)', r.servoRoom);
      return card('T4 · the video stand', 'seeks, the player on its own, speed changes, and the frame servo', h, 'T4');
    },
  };
  function render() {
    const out = [];
    for (const k of ['T5', 'T1', 'T2', 'T3', 'T4']) {
      const r = R.tests[k];
      if (!r) continue;
      try { out.push(r.error && Object.keys(r).length === 1 ? card(k, 'stopped', '<p class="bad">' + esc(r.error) + '</p>', k) : renderers[k](r)); }
      catch (e) { out.push(card(k, 'could not draw this card: ' + e.message, '', k)); }
    }
    $('#cards').innerHTML = out.join('') || '<p class="empty">No results yet on this device.</p>';
    $('#save').disabled = $('#copy').disabled = !Object.keys(R.tests).length;
  }

  // ------------------------------------------------------------ save / copy
  async function save() {
    R.device.label = label();
    try {
      const r = await fetch('api/results', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(R) });
      const j = await r.json();
      status(j.saved ? 'Saved on the computer running the kit: ' + j.saved : 'Save failed: ' + (j.error || r.status), j.saved ? 'ok' : 'warn');
    } catch (e) { status('Save failed (' + e.message + ') — use Copy JSON instead.', 'warn'); }
  }
  async function copy() {
    const txt = JSON.stringify(R);
    try { await navigator.clipboard.writeText(txt); status('Copied ' + Math.round(txt.length / 1024) + ' KB of results to the clipboard.', 'ok'); }
    catch (e) {
      const ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); status('Copied.', 'ok'); } catch (e2) { status('Copy blocked — the JSON is in each card\'s "the numbers".', 'warn'); }
      ta.remove();
    }
  }

  // ------------------------------------------------------------ boot
  async function boot() {
    try { $('#label').value = localStorage.getItem('tk-label') || ''; } catch (e) { /* private mode */ }
    $('#label').addEventListener('input', () => { try { localStorage.setItem('tk-label', label()); } catch (e) { /* */ } });
    try { const old = JSON.parse(localStorage.getItem('tk-results') || 'null'); if (old && old.tests) Object.assign(R, old); } catch (e) { /* */ }
    for (const b of document.querySelectorAll('[data-run]')) b.addEventListener('click', () => guard(b.dataset.run, run[b.dataset.run]));
    $('#beacon').addEventListener('click', async () => { if (running) return; try { await TK.clock.beacon(s => status(s)); status('Beacon closed.'); } catch (e) { status('Beacon: ' + e.message, 'warn'); } });
    $('#save').addEventListener('click', save);
    $('#copy').addEventListener('click', copy);
    $('#clear').addEventListener('click', () => { if (!confirm('Clear this device\'s results from this page? (Saved files on the computer are not touched.)')) return; R.tests = {}; try { localStorage.removeItem('tk-results'); } catch (e) { /* */ } render(); });
    render();
    try {
      const m = await (await fetch('assets/manifest.json', { cache: 'no-cache' })).json();
      R.kit.assets = { built: m.built, gitHead: m.gitHead, ir: m.ir, window: m.window, fps: m.fps, instancesAll: m.instancesAll };
      $('#assets').textContent = 'content: ' + m.ir + ' ' + m.window.map(x => x.toFixed(1)).join('–') + ' s (the busiest minute of the piece) · built ' + m.built.slice(0, 16).replace('T', ' ') + (m.gitHead ? ' @' + m.gitHead : '');
    } catch (e) { $('#assets').innerHTML = '<b class="bad">no assets — on the computer run: node testkit/build_assets.js</b>'; }
    try {
      const info = await (await fetch('api/info', { cache: 'no-store' })).json();
      $('#lan').textContent = info.lan.length ? 'other devices on this network: ' + info.lan.join('  ·  ') : '';
    } catch (e) { $('#lan').textContent = 'the kit server is not answering — clock tests (T3) and SAVE need it'; }
    if (!isSecureContext) $('#insecure').hidden = false;
  }
  addEventListener('DOMContentLoaded', boot);
  TK.kit = { R, run, render };
})(typeof self !== 'undefined' ? self : this);
