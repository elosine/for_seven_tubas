#!/usr/bin/env node
// export_print.js — THE PRINT SCORE. Paginated, static, vector PDF.
//
// Day 37. The print score was parked on day 36 with its format decided
// (`docs/PRINT_AND_COVER.md`: TABLOID LANDSCAPE 17 x 11) and nothing built.
//
// WHY THIS IS SMALL: the notation engine is already resolution-independent.
// `Layout.layoutSection` returns a model in STAFF-SPACE units and
// `Coords.makeView` maps it onto a canvas, so a print page is the same model
// at a different view — not a second engine. The page itself comes from
// `notation/lib/static_page.js`, the SAME module the video exporter draws
// through, so the printed page and the approved film cannot drift.
//
// WHAT PRINT ADDS that the video does not have:
//   1. a TIME RULER. The video has a moving cursor; paper does not. This is a
//      proportional score, so without a time reference the page cannot be read
//      in time at all. Ticks every second, numbered every five.
//   2. SECTION MARKS. Derived from the score's own ACT- markers, never from the
//      raw working marks (which is what ir.hideMarkers exists to suppress).
//   3. FOLIOS, and an optional cover page from print/cover/.
//
// PDF: Chrome headless --print-to-pdf. Measured day 37 — MediaBox [0 0 1224
// 792] exactly, fonts embedded as FontFile2, ZERO raster images, real path
// operators. No new dependency; the repo still has exactly one (resvg, D77).
//
// usage:
//   node tools/export_print.js --ir db1 --out print/score/BCB-score.pdf
//   node tools/export_print.js --sec 15 --pages 1-4 --out proof.pdf
//   node tools/export_print.js --htmlOnly --out proof.html
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const ROOT = path.join(__dirname, '..');
const Coords = require(path.join(ROOT, 'notation', 'lib', 'coords.js'));
const Layout = require(path.join(ROOT, 'notation', 'lib', 'layout.js'));
const Splice = require(path.join(ROOT, 'notation', 'lib', 'splice.js'));
const StaticPage = require(path.join(ROOT, 'notation', 'lib', 'static_page.js'));

// ---------------------------------------------------------------- args
function arg(name, def) { const i = process.argv.indexOf('--' + name); return i >= 0 ? process.argv[i + 1] : def; }
function flag(name) { return process.argv.indexOf('--' + name) >= 0; }
const irId = arg('ir', 'db1');
const outFile = arg('out', null);
const formatName = arg('format', 'tabloid-landscape');
const marginIn = parseFloat(arg('margin', '0.5'));
const secArg = arg('sec', null);
const pagesArg = arg('pages', null);
const atArg = arg('at', null);        // select the page CONTAINING this second
const wantRuler = arg('ruler', 'on') !== 'off';
const wantMarks = arg('marks', 'on') !== 'off';
const wantCover = arg('cover', 'off') !== 'off';
const htmlOnly = flag('htmlOnly');
const quiet = flag('quiet');

if (!outFile) {
  console.error('usage: export_print.js --out <file.pdf> [--ir db1] [--sec N] [--pages a-b] [--at SEC]');
  console.error('       [--format tabloid-landscape|letter-landscape] [--margin 0.5]');
  console.error('       [--ruler on|off] [--marks on|off] [--cover on|off] [--htmlOnly]');
  process.exit(2);
}

// UNIT BASIS = CSS PIXELS AT 96/inch, not points.
// An SVG's width/height attributes are UNITLESS, which means CSS px. Page
// geometry in pt therefore rendered the music at 72/96 = 75 % of the block
// while pt-measured furniture (the folio) spanned it fully — caught on the
// first screenshot, not by reading. @page still carries the physical size in
// inches, so the PDF is a true 17 x 11 regardless.
const PX = 96;
const FORMATS = {
  // name                    w x h INCHES, landscape
  'tabloid-landscape': { w: 17, h: 11, label: 'Tabloid landscape 17 x 11 in' },
  'letter-landscape': { w: 11, h: 8.5, label: 'Letter landscape 11 x 8.5 in' },
};
const FMT = FORMATS[formatName];
if (!FMT) { console.error('unknown --format ' + formatName + '; have: ' + Object.keys(FORMATS).join(', ')); process.exit(2); }

// ---------------------------------------------------------------- load
const rd = p => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const glyphs = rd('notation/lib/glyphs.json');
const pageRules = rd('notation/registry/page_rules.json');
const C = rd('notation/registry/container.json');
const ir = rd(path.join('notation', 'ir', irId + '.ir.json'));
let score = null;
try { score = rd(path.join('scores', ir.source.score + '.json')); } catch (e) { score = null; }

const FRAME_PARTS = ir.source.parts.slice();
const model = Layout.layoutSection(ir, glyphs, Object.assign(
  { m4AttackLines: false, frameParts: FRAME_PARTS },
  (C.engraving && C.engraving.layout) || {}));
const srcEnd = ir.source.window[1];

// ------------------------------------------------- geometry
// The lane proportions come from the SAME registry block the video uses, so a
// printed lane is the video lane scaled — not a second set of numbers to keep
// in sync. Verified day 37: this derivation reproduces PRINT_AND_COVER's
// measured 26.7 mm lane and ~8 mm staff without either being typed in here.
const rz = (C.realizations || {})['video-jury'] || {};
const lanes = rz.lanes || { padTopPx: 8, padBotPx: 8, gapPx: 4 };
const VH = (C.frame && C.frame.heightPx) || 1080;
const VW = (C.frame && C.frame.widthPx) || 1920;
const staffHeightPx = (C.staff && C.staff.staffHeightPx) || 31.6;
const videoPageSeconds = (C.timeScale && C.timeScale.defaults && C.timeScale.defaults.trance) || 12;

const pageW = FMT.w * PX, pageH = FMT.h * PX;
const margin = marginIn * PX;
const headerPx = wantRuler || wantMarks ? 32 : 0;      // ruler + section marks strip
const footerPx = 19;                                   // folio
const blockW = pageW - 2 * margin;
const blockH = pageH - 2 * margin - headerPx - footerPx;
if (!(blockW > 0 && blockH > 0)) { console.error('margins leave no room for music'); process.exit(2); }

// lane fractions: identical proportions to the video frame
const N = FRAME_PARTS.length;
let topPad = lanes.padTopPx / VH, botPad = lanes.padBotPx / VH;
const gap = lanes.gapPx / VH;
const laneFrac = (1 - topPad - botPad - gap * (N - 1)) / N;
const systems = Coords.systemsForParts(FRAME_PARTS, { topPad, botPad, gap, weights: lanes.weights });
// ssPerSystem is a RATIO (lane height / one staff space), so it carries across
// resolutions untouched — this is what keeps the printed staff proportional.
const ssPerSystem = (laneFrac * VH) / (staffHeightPx / 4);
const lanePx = laneFrac * blockH;
const ssPx = lanePx / ssPerSystem;
const staffPx = 4 * ssPx;
const mm = px => px / PX * 25.4;

// SECONDS PER PAGE. Default = the density the composer approved on screen:
// the video lays down (pxPerSecond / ssPx) staff-spaces per second, and we hold
// that constant so a printed bar looks like the filmed bar, only larger.
const videoDensitySsPerSec = (VW / videoPageSeconds) / ((laneFrac * VH) / ssPerSystem);
const defaultSec = blockW / (videoDensitySsPerSec * ssPx);
const pageSeconds = secArg != null ? parseFloat(secArg) : defaultSec;
if (!(pageSeconds > 0)) { console.error('--sec must be positive'); process.exit(2); }

// ------------------------------------------------- IR-vs-score staleness HINT
// The print score is drawn from the IR, not from the save file. So editing the
// score and re-running THIS tool renders the OLD notation, silently. That is the
// failure this notice exists to prevent.
//
// It is a HINT, not a verdict, and deliberately so: D75 records that a save
// file's timestamp is NOT evidence of its currency (a `-work` copy was three
// days NEWER than the archive and missing an entire playability pass). A newer
// mtime here means "check", never "stale".
try {
  const irPath = path.join(ROOT, 'notation', 'ir', irId + '.ir.json');
  const scPath = path.join(ROOT, 'scores', ir.source.score + '.json');
  if (fs.existsSync(scPath)) {
    const irM = fs.statSync(irPath).mtimeMs, scM = fs.statSync(scPath).mtimeMs;
    if (scM > irM) {
      console.log('  ! NOTE  ' + ir.source.score + '.json is NEWER than ' + irId + '.ir.json.');
      console.log('          The print score is drawn from the IR, so score edits do not appear');
      console.log('          until the IR is rebuilt:   bash print/score/build.sh --rebuild-ir');
      console.log('          (a timestamp is a hint, not proof — D75. Rebuild to be sure.)');
    }
  }
} catch (e) { /* a missing score is not an error; marks just go quiet */ }

// ---------------------------------------------------------------- pages
const pages = Splice.planPages(ir, pageRules, pageSeconds);
let sel = pages.map((_, i) => i);
if (atArg != null) {
  // the page containing a given second — the page plan changes with --sec, so
  // a fixed --pages number does NOT show the same music at two densities.
  const t = parseFloat(atArg);
  let best = 0;
  for (let i = 0; i < pages.length; i++) if (pages[i].t0 <= t) best = i; else break;
  sel = [best];
}
if (pagesArg) {
  const m = /^(\d+)(?:-(\d+))?$/.exec(pagesArg.trim());
  if (!m) { console.error('--pages wants N or A-B (1-indexed)'); process.exit(2); }
  const a = parseInt(m[1], 10), b = m[2] ? parseInt(m[2], 10) : a;
  sel = sel.filter(i => i + 1 >= a && i + 1 <= b);
  if (!sel.length) { console.error('--pages ' + pagesArg + ' selects nothing (have 1-' + pages.length + ')'); process.exit(2); }
}

function viewFor(i) {
  // THE LAST PAGE REACHES THE PIECE'S END. Measured day 37: with the default
  // density the last window ended at 752.92 against srcEnd 753, so the true
  // final barline fell 0.08 s outside the page and the score would have ended
  // with no final bar once the right-edge bar was removed. The last page's
  // window is therefore stretched to srcEnd — 11.49 s instead of 11.41, a 0.7 %
  // spacing difference on one page, in exchange for a correct final barline.
  const isLast = i === pages.length - 1;
  const w1 = isLast ? Math.max(pages[i].t0 + pageSeconds, srcEnd) : pages[i].t0 + pageSeconds;
  return Coords.makeView({
    widthPx: blockW, heightPx: blockH,
    window: [pages[i].t0, w1],
    gutterPx: (C.prefatory && C.prefatory.gutterPx) || 0,
    systems, ssPerSystem,
  });
}

// ------------------------------------------------- section marks
// Derived, not typed: the score's ACT- markers are the three named sections and
// they are unambiguous. The raw working marks ("S009 ch03 V2", "CG001") are
// exactly what ir.hideMarkers suppresses and they never reach paper.
function sectionMarks() {
  if (!wantMarks || !score) return [];
  const out = [];
  for (const o of (score.objects || [])) {
    const label = o.label || o.text || o.name;
    if (!label || o.time == null) continue;
    const m = /^ACT-([A-Z]+)/.exec(String(label));
    // The score's internal tag is abbreviated ("ACT-CONVERGE-01"); the printed
    // mark uses the TITLE's word, because the title IS the three sections
    // ("Bloom - Convergence - Balance", day 35). Anything unmapped prints its
    // own tag rather than being dropped.
    if (m) out.push({ time: +o.time, label: ({ CONVERGE: 'CONVERGENCE' })[m[1]] || m[1] });
  }
  // the trance is the one section with no ACT- marker: it announces itself with
  // bar-number marks, so its start is the first purely-numeric mark after the
  // last ACT-. Reported below, never silent.
  const lastAct = out.length ? Math.max(...out.map(x => x.time)) : 0;
  let trance = null;
  for (const o of (score.objects || [])) {
    const label = String(o.label || o.text || o.name || '');
    if (o.time == null || !/^\d+$/.test(label)) continue;
    if (+o.time > lastAct && (trance == null || +o.time < trance)) trance = +o.time;
  }
  if (trance != null) out.push({ time: trance, label: 'TRANCE' });
  out.sort((a, b) => a.time - b.time);
  return out;
}
const MARKS = sectionMarks();

// ------------------------------------------------- furniture
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clock = t => {
  const s = Math.round(t);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
};
// The ruler is drawn in its own strip but shares the music view's x mapping, so
// a tick and the note under it cannot disagree.
function rulerSvg(view) {
  const [t0, t1] = view.window;
  const p = ['<svg xmlns="http://www.w3.org/2000/svg" width="' + blockW.toFixed(2) + '" height="' + headerPx +
    '" viewBox="0 0 ' + blockW.toFixed(2) + ' ' + headerPx + '">'];
  const yBase = headerPx - 0.5;
  if (wantRuler) {
    p.push('<line x1="0" y1="' + yBase + '" x2="' + blockW.toFixed(2) + '" y2="' + yBase + '" stroke="#8a8a8a" stroke-width="0.4"/>');
    const first = Math.ceil(t0), last = Math.floor(Math.min(t1, srcEnd));
    for (let t = first; t <= last; t++) {
      const x = view.xOfSeconds(t);
      if (x < 0 || x > blockW) continue;
      const five = t % 5 === 0;
      p.push('<line x1="' + x.toFixed(2) + '" y1="' + (yBase - (five ? 5 : 2.5)).toFixed(2) + '" x2="' + x.toFixed(2) +
        '" y2="' + yBase + '" stroke="#8a8a8a" stroke-width="' + (five ? 0.6 : 0.35) + '"/>');
      if (five) p.push('<text x="' + x.toFixed(2) + '" y="' + (yBase - 7).toFixed(2) +
        '" font-size="6.5" font-family="\'Crimson Pro Light\', serif" fill="#8a8a8a" text-anchor="middle">' + clock(t) + '</text>');
    }
  }
  for (const mk of MARKS) {
    if (mk.time < t0 || mk.time >= t1) continue;
    const x = view.xOfSeconds(mk.time);
    p.push('<line x1="' + x.toFixed(2) + '" y1="0" x2="' + x.toFixed(2) + '" y2="' + yBase + '" stroke="#111" stroke-width="0.8"/>');
    p.push('<text x="' + (x + 3).toFixed(2) + '" y="9" font-size="9" font-family="\'Crimson Pro Light\', serif" fill="#111" letter-spacing="1">' + esc(mk.label) + '</text>');
  }
  p.push('</svg>');
  return p.join('');
}

// ---------------------------------------------------------------- html
const fontB64 = f => fs.readFileSync(path.join(ROOT, 'notation', 'app', 'fonts', f)).toString('base64');
const faces = [
  { file: 'CrimsonPro-Light.ttf', style: 'normal' },
  { file: 'CrimsonPro-LightItalic.ttf', style: 'italic' },
].map(f => "@font-face{font-family:'Crimson Pro Light';font-style:" + f.style +
  ";src:url(data:font/ttf;base64," + fontB64(f.file) + ") format('truetype');}").join('\n');

function coverSvg() {
  if (!wantCover) return null;
  const p = path.join(ROOT, 'print', 'cover', 'cover-D-tabloid-landscape-1line.svg');
  if (!fs.existsSync(p)) { console.error('  ! --cover on but ' + path.relative(ROOT, p) + ' is missing; skipping cover'); return null; }
  return fs.readFileSync(p, 'utf8');
}

function buildHtml() {
  const out = [];
  out.push('<!doctype html><meta charset="utf-8"><title>' + esc(irId) + ' — print score</title>');
  out.push('<style>' + faces + '\n' +
    '@page{size:' + FMT.w + 'in ' + FMT.h + 'in;margin:0;}\n' +
    'html,body{margin:0;padding:0;background:#fff;}\n' +
    '.page{position:relative;width:' + pageW + 'px;height:' + pageH + 'px;overflow:hidden;break-after:page;page-break-after:always;background:#fff;}\n' +
    '.page:last-child{break-after:auto;page-break-after:auto;}\n' +
    '.hdr{position:absolute;left:' + margin + 'px;top:' + margin + 'px;}\n' +
    '.mus{position:absolute;left:' + margin + 'px;top:' + (margin + headerPx) + 'px;}\n' +
    '.fol{position:absolute;left:' + margin + 'px;width:' + blockW + 'px;top:' + (pageH - margin - footerPx + 3) + 'px;' +
    'font:11px "Crimson Pro Light",serif;color:#8a8a8a;display:flex;justify-content:space-between;}\n' +
    '.cov svg{display:block;}\n' +
    '</style>');

  const cov = coverSvg();
  if (cov) out.push('<div class="page cov">' + cov + '</div>');

  sel.forEach((i, n) => {
    const view = viewFor(i);
    const svg = StaticPage.staticPageSvg({
      model, view, glyphs, C, srcEnd,
      reshow: pages[i].reshow, ownsEnd: i === pages.length - 1,
      // composer, day 37: no bar line at the right of every page. On paper the
      // page edge is not a musical event; the bar draws only at the true end.
      edgeBar: false,
    });
    const t0 = pages[i].t0, t1 = Math.min(view.window[1], srcEnd);
    out.push('<div class="page">');
    if (headerPx) out.push('<div class="hdr">' + rulerSvg(view) + '</div>');
    out.push('<div class="mus">' + svg + '</div>');
    out.push('<div class="fol"><span>' + esc(clock(t0)) + ' – ' + esc(clock(t1)) + '</span>' +
      '<span>' + (i + 1) + '</span></div>');
    out.push('</div>');
  });
  return out.join('\n');
}

// ---------------------------------------------------------------- chrome
function findChrome() {
  const envd = process.env.CHROME_PATH;
  const cands = [envd,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA ? process.env.LOCALAPPDATA + '/Google/Chrome/Application/chrome.exe' : null,
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  for (const c of cands) { try { if (fs.existsSync(c)) return c; } catch (e) { } }
  return null;
}

// ---------------------------------------------------------------- go
const outAbs = path.isAbsolute(outFile) ? outFile : path.join(ROOT, outFile);
fs.mkdirSync(path.dirname(outAbs), { recursive: true });
const html = buildHtml();

if (!quiet) {
  console.log('export_print: ' + irId + ' · ' + FMT.label);
  console.log('  page      ' + FMT.w + ' x ' + FMT.h + ' in · margin ' + marginIn + ' in');
  console.log('  music     ' + mm(blockW).toFixed(0) + ' x ' + mm(blockH).toFixed(0) + ' mm');
  console.log('  ' + N + ' lanes  lane ' + mm(lanePx).toFixed(1) + ' mm  STAFF ' + mm(staffPx).toFixed(2) + ' mm');
  console.log('  ' + pageSeconds.toFixed(2) + ' s/page' + (secArg == null ? '  [default = the video\'s approved density]' : '') +
    ' → ' + pages.length + ' pages for ' + srcEnd + ' s');
  if (wantMarks) console.log('  marks     ' + (MARKS.length ? MARKS.map(m => m.label + '@' + m.time.toFixed(2)).join(' · ') : 'NONE FOUND'));
  if (sel.length !== pages.length) console.log('  writing   pages ' + (sel[0] + 1) + '-' + (sel[sel.length - 1] + 1) + ' only (' + sel.length + ')');
}

if (htmlOnly || /\.html?$/i.test(outAbs)) {
  fs.writeFileSync(outAbs, html);
  console.log('wrote ' + path.relative(ROOT, outAbs) + '  (' + (fs.statSync(outAbs).size / 1024).toFixed(0) + ' KB)');
  process.exit(0);
}

const chrome = findChrome();
if (!chrome) {
  const alt = outAbs.replace(/\.pdf$/i, '.html');
  fs.writeFileSync(alt, html);
  console.error('Chrome not found (set CHROME_PATH). Wrote HTML instead: ' + path.relative(ROOT, alt));
  console.error('Open it and print to PDF, or install Chrome and re-run.');
  process.exit(3);
}
const tmpHtml = outAbs.replace(/\.pdf$/i, '') + '.__print.html';
fs.writeFileSync(tmpHtml, html);
const r = spawnSync(chrome, ['--headless', '--disable-gpu', '--no-pdf-header-footer',
  '--print-to-pdf=' + outAbs, 'file:///' + tmpHtml.replace(/\\/g, '/')], { encoding: 'utf8' });
try { fs.unlinkSync(tmpHtml); } catch (e) { }
if (!fs.existsSync(outAbs)) {
  console.error('chrome did not write a pdf');
  console.error((r.stderr || '').split('\n').slice(-6).join('\n'));
  process.exit(1);
}
console.log('wrote ' + path.relative(ROOT, outAbs) + '  (' + (fs.statSync(outAbs).size / 1024 / 1024).toFixed(1) + ' MB, ' +
  (sel.length + (wantCover && coverSvg() ? 1 : 0)) + ' pages)');
