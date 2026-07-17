;(function () {
  'use strict';
  // ==========================================================================
  // lore/lore-adapter.js — window.RPG_LORE: 스냅샷 → RPG 정규화 (유일한 결합 seam) [G3]
  // ──────────────────────────────────────────────────────────────────────────
  // RPG 코드는 시뮬 전역을 직접 접촉하지 않고 이 어댑터만 경유한다.
  // ★실측 정정(docs/25 §4.3): 원본 lore_module 은 window 에 LORE_GHOSTS·LORE_BLOCS·
  //   loreTag·loreQuote·loreEpilogue·loreRouteFromReason 6개만 노출. BLOC_IDENTITY·
  //   GHOST_IDENTITY 는 미노출(undefined) → 스냅샷 복제본에서 재노출한 전역을 사용.
  // 전 필드 null 가드 — 미노출 전역 가정 금지.
  // ==========================================================================

  function src() {
    if (typeof window !== 'undefined' && window.loreEpilogue) {
      return {
        GHOSTS: window.LORE_GHOSTS || {}, BLOCS: window.LORE_BLOCS || {},
        tag: window.loreTag, quote: window.loreQuote, epilogue: window.loreEpilogue,
        route: window.loreRouteFromReason,
        blocId: window.LORE_BLOC_IDENTITY || {}, ghostId: window.LORE_GHOST_IDENTITY || {},
      };
    }
    var m = require('./lore_module.snapshot.js');
    return {
      GHOSTS: m.LORE_GHOSTS || {}, BLOCS: m.LORE_BLOCS || {},
      tag: m.loreTag, quote: m.loreQuote, epilogue: m.loreEpilogue, route: m.loreRouteFromReason,
      blocId: m.LORE_BLOC_IDENTITY || {}, ghostId: m.LORE_GHOST_IDENTITY || {},
    };
  }

  // 발화자 라벨 (고스트=코드네임, 블록=수장). null 가드.
  function tag(spec) { var s = src(); return (s.tag && s.tag(spec)) || null; }

  // 명대사 버블 { by, line } 또는 null.
  function quote(spec) { var s = src(); return (s.quote && s.quote(spec)) || null; }

  // 인물 카드 정보 { codename/realName/quote } (고스트) 또는 { leader/title/slogan/quote } (블록).
  function person(spec) {
    var s = src();
    if (s.GHOSTS[spec]) return { kind: 'ghost', spec: spec, data: s.GHOSTS[spec], identity: s.ghostId[spec] || '' };
    if (s.BLOCS[spec]) return { kind: 'bloc', spec: spec, data: s.BLOCS[spec], identity: s.blocId[spec] || '' };
    return null;
  }

  function epilogue(role, spec, route) { var s = src(); return (s.epilogue && s.epilogue(role, spec, route)) || null; }

  var API = { tag: tag, quote: quote, person: person, epilogue: epilogue };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_LORE = API;
})();
