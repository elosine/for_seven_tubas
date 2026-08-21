// transport.js — V2: THE CLOCK INTERFACE (D47 invariant 2).
// The ONLY module in the notation stratum allowed to read a time source
// (performance.now / audio.currentTime) — enforced by source scan in
// tools/test_animobj.js. Everything downstream (cursor, system turns,
// animated objects) consumes `t` in S1 SECONDS and never touches a clock.
// Implementations swap per realization: this one is LOCAL (audio-slaved
// when a Reaper render is attached, free-running otherwise); D45's future
// performance project implements the same interface over networked sync.
//
//   makeTransport(opts?) -> { now, play, pause, seek, attachAudio,
//                             detachAudio, isPlaying, setOffset }
//   · now()        current position, S1 seconds
//   · seek(t)      jump (works playing or paused)
//   · attachAudio(el, offset?)  slave the clock: S1 t = currentTime+offset
//   · opts.timebase {now()->seconds}  injectable for tests (fake time)
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NotationTransport = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  function makeTransport(opts) {
    const o = opts || {};
    const tb = o.timebase || { now: () => performance.now() / 1000 };
    let audio = null;
    let offset = o.audioOffset || 0;   // S1 t = audio.currentTime + offset
    let playing = false;               // free-run state (audio keeps its own)
    let base = 0;                      // S1 seconds at last play/seek/pause
    let mark = 0;                      // timebase seconds at last play/seek

    function now() {
      if (audio) return audio.currentTime + offset;
      return playing ? base + (tb.now() - mark) : base;
    }
    function play() {
      if (audio) { audio.play(); return; }
      if (!playing) { mark = tb.now(); playing = true; }
    }
    function pause() {
      if (audio) { audio.pause(); return; }
      if (playing) { base = base + (tb.now() - mark); playing = false; }
    }
    function seek(t) {
      if (audio) { audio.currentTime = Math.max(0, t - offset); return; }
      base = t; mark = tb.now();
    }
    function attachAudio(el, off) { audio = el; if (off !== undefined) offset = off; }
    function detachAudio() { const t = now(); audio = null; base = t; mark = tb.now(); playing = false; }
    function isPlaying() { return audio ? !audio.paused : playing; }
    function setOffset(v) { offset = v; }

    return { now, play, pause, seek, attachAudio, detachAudio, isPlaying, setOffset };
  }

  return { makeTransport };
});
