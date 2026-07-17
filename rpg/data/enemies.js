;(function () {
  'use strict';
  // ==========================================================================
  // data/enemies.js — 적 2~3종 + 블록 임원 베이스 스탯 (순수 리터럴)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §3.7):
  //   블록 임원 베이스   [계승 docs/07 §2] VANTA 7/2/2/3/5 등 (원전 그대로)
  //   Sentry Drone       [신규 스탯 · VANTA 무대 계승] IRON, 엄폐 사수 (슬라이스 필수)
  //   Corp Security      [신규 스탯 · VANTA 무대 계승] VOLT, ★대화로 회피 가능
  //   ICE Node           [각색 docs/07 §5.2] 정적·물리무효·HACK만 (선택)
  //   AI 태그: 'coverShooter'|'advance'|'static' (해석은 ai.js)
  // ==========================================================================

  // [계승 docs/07 §2 Bloc 임원] — 후속 챕터 적대 베이스, 슬라이스는 VANTA 만 사용.
  var BLOC_EXEC = {
    VANTA:    { hp: 7,  atk: 2, def: 2, spd: 3, hack: 5, attr: 'MESH' },
    IRONWALL: { hp: 10, atk: 5, def: 4, spd: 3, hack: 1, attr: 'IRON' },
    HELIX:    { hp: 8,  atk: 3, def: 3, spd: 2, hack: 3, attr: 'BIO'  },
    AXIOM:    { hp: 6,  atk: 2, def: 2, spd: 4, hack: 5, attr: 'MESH' },
    CARBON:   { hp: 9,  atk: 3, def: 4, spd: 2, hack: 2, attr: 'VOLT' },
  };

  // 적 유닛 템플릿. mov 은 데이터로 고정(순수) — SPD 파생과 일치하도록 표기.
  var ENEMIES = {
    VANTA_DRONE: {
      key: 'VANTA_DRONE', name: 'VANTA Sentry Drone', icon: '🛸',
      hp: 5, atk: 3, def: 1, spd: 4, hack: 0, mov: 4, ap: 2,
      attr: 'IRON', range: 4, ai: 'coverShooter', isMachine: true,
      bloc: 'VANTA',
      lineage: '[신규 스탯 · VANTA 무대 계승] 기계 → DATA SPIKE 보너스 대상',
    },
    VANTA_SECURITY: {
      key: 'VANTA_SECURITY', name: 'VANTA Corp Security', icon: '🔫',
      hp: 12, atk: 4, def: 3, spd: 3, hack: 0, mov: 3, ap: 2,
      attr: 'VOLT', range: 3, ai: 'advance', isMachine: false,
      bloc: 'VANTA', avoidable: true,
      lineage: '[신규 스탯 · VANTA 무대 계승] ★대화에서 회피 가능한 전투',
    },
    ICE_NODE: {
      key: 'ICE_NODE', name: 'ICE Node', icon: '▦',
      hp: 3, atk: 0, def: 0, spd: 0, hack: 0, mov: 0, ap: 0,
      attr: 'SHADE', range: 0, ai: 'static', isMachine: false,
      physImmune: true, hackOnly: true, bloc: 'VANTA',
      lineage: '[각색 docs/07 §5.2] 정적 오브젝티브 수호, HACK만 파괴 (선택)',
    },
  };

  var API = { BLOC_EXEC: BLOC_EXEC, ENEMIES: ENEMIES };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_ENEMIES = API;
})();
