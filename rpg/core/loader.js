;(function () {
  'use strict';
  // ==========================================================================
  // core/loader.js — window 전역 heal 로더 [G11] (시뮬 lore_module 패턴 계승)
  // ──────────────────────────────────────────────────────────────────────────
  // 호스팅이 /rpg (슬래시 없음)로 서빙하면 상대경로 src 가 상위로 풀려 404 → 모듈
  // 전역이 없으면 디렉토리 경로를 보정해 재주입. file://·정상 URL 에선 no-op.
  // core/ 는 combat/·data/ 순수성 grep 대상이 아니므로 DOM 접근 허용.
  // ==========================================================================

  function heal(relPath, marker) {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (typeof window[marker] !== 'undefined') return;
    // 이 페이지는 rpg/index.html → pathname 은 .../rpg | .../rpg/ | .../index(.html).
    var dir = location.pathname.replace(/index(\.html?)?$/, '');
    if (dir.charAt(dir.length - 1) !== '/') dir += '/';
    var s = document.createElement('script');
    s.src = dir + relPath;
    document.head.appendChild(s);
  }

  // 전 모듈 마커 목록 — 인덱스 셸이 DOMContentLoaded 에서 호출.
  function healAll() {
    heal('core/projection.js', 'RPG_PROJECTION');
    heal('data/attributes.js', 'RPG_ATTRS');
    heal('data/signal.js', 'RPG_SIGNAL');
    heal('data/classes.js', 'RPG_CLASSES');
    heal('data/abilities.js', 'RPG_ABILITIES');
    heal('data/enemies.js', 'RPG_ENEMIES');
    heal('data/weapons.js', 'RPG_WEAPONS');
    heal('data/missions/ch01-first-blood.js', 'RPG_MISSION_CH01');
    heal('systems/combat/grid.js', 'RPG_GRID');
    heal('systems/combat/resolve.js', 'RPG_RESOLVE');
    heal('systems/combat/ai.js', 'RPG_AI');
    heal('systems/dialogue.js', 'RPG_DIALOGUE');
    heal('systems/character.js', 'RPG_CHARACTER');
    heal('systems/campaign.js', 'RPG_CAMPAIGN');
    heal('state/save.js', 'RPG_SAVE');
    heal('state/store.js', 'RPG_STORE');
    heal('lore/lore_module.snapshot.js', 'loreEpilogue');
    heal('lore/lore-adapter.js', 'RPG_LORE');
  }

  if (typeof window !== 'undefined') { window.rpgHeal = heal; window.rpgHealAll = healAll; }
  if (typeof module !== 'undefined' && module.exports) module.exports = { heal: heal, healAll: healAll };
})();
