// classify.js — pass-1 object classification (NOTATION_ARCHITECTURE §2/§4).
// Pure, dual-load (node + browser). Rules are code in v0 (DB-7), but every
// class name this module can emit is pinned against the registry at load —
// it cannot invent a class. Unknown THROWS with diagnostics (CL-5), never a
// silent bucket.
//
// Object-level classes only. Stream membership (fixed-oneshot → trance-stream
// promotion) is decided by segmentation in extract_core.js — class from
// BEHAVIOR (a run sharing a pulse unit), not from a mode flag (DB-6).
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.NotationClassify = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  // Names this module can emit — verified against registry/classes.json by
  // assertRegistry() (the extractor calls it; the browser build may too).
  const EMITTABLE = [
    'meta-shape', 'marker-label', 'morph-note', 'drawn-crescendo-curve',
    'ord-sustained', 'fixed-oneshot',
  ];

  function classify(obj) {
    if (obj.type === 'marker') return 'marker-label';
    if (obj.type === 'waveCurve') {
      if (obj.layer === 10) return 'meta-shape';
      if ('morphBend' in obj) return 'morph-note';
      const t = obj.technique;
      if (t === 'ord') {
        // multi-node level envelope = hand-drawn crescendo material (CC7);
        // flat 2-node envelope = plain sustained note.
        return (obj.nodes && obj.nodes.length > 2) ? 'drawn-crescendo-curve' : 'ord-sustained';
      }
      if (t === 'staccato' || t === 'cuivre' || t === 'fortepiano') return 'fixed-oneshot';
    }
    const feat = {
      type: obj.type, layer: obj.layer, technique: obj.technique,
      hasMorphBend: 'morphBend' in obj, nodes: obj.nodes ? obj.nodes.length : 0,
      id: obj.id,
    };
    throw new Error('classify: no rule claims object ' + obj.id +
      ' — feature vector ' + JSON.stringify(feat) +
      '. Add a registry class + rule; never a silent unknown (CL-5).');
  }

  // Assert every emittable name exists in the registry (call with the parsed
  // registry object). Throws on drift.
  function assertRegistry(registry) {
    const names = new Set(registry.classes.map(c => c.class));
    for (const n of EMITTABLE) {
      if (!names.has(n)) throw new Error('classify: emittable class "' + n + '" missing from registry/classes.json');
    }
    // trance-stream is emitted by segmentation, not here, but must exist too:
    if (!names.has('trance-stream')) throw new Error('classify: registry missing "trance-stream" (promotion target)');
  }

  return { classify, assertRegistry, EMITTABLE };
});
