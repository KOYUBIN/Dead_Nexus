;(function () {
  'use strict';
  // ==========================================================================
  // data/enemies.js — 적 로스터 (블록 임원 베이스 + 유닛 템플릿, 순수 리터럴)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §3.7 · docs/07 §2 Bloc 임원 베이스 계승):
  //   블록 임원 베이스   [계승 docs/07 §2] VANTA 7/2/2/3/5 · IRONWALL 10/5/4/3/1 등 (원전 그대로)
  //   VANTA_DRONE        [신규 스탯 · VANTA 무대 계승] IRON 기계, 엄폐 사수
  //   VANTA_SECURITY     [신규 스탯 · VANTA 무대 계승] VOLT, ★대화로 회피 가능
  //   ICE_NODE           [각색 docs/07 §5.2] 정적·물리무효·HACK만 (오브젝티브 수호)
  //   ── 통합 로스터 (미션 15종 소비 · docs/07 §2 블록 축 파생) ──
  //   AXIOM_*            [계승 docs/07 §2 AXIOM 6/2/2/4/5] MESH·SPD 축 (해커/드론)
  //   POLICE_*/RIOT      [신규 · docs/07 §8 Heat 공권력] 계엄 순찰·진압
  //   HELIX_*/SPLICE     [계승 docs/07 §2 HELIX 8/3/3/2/3] BIO 축 (의료·시술 산물)
  //   IRONWALL_*         [계승 docs/07 §2 IRONWALL 10/5/4/3/1] IRON 축 (집행관·포탑)
  //   CARBON_*           [계승 docs/07 §2 CARBON 9/3/4/2/2] VOLT 축 (경비·드론)
  //   VANTA_ELITE/WISP   [계승 docs/07 §2 VANTA] MESH 정예·정령
  //   SIGNAL_ICE         [각색 docs/07 §5.2 · ICE 계열] 신호 얼음 방벽 (HACK 전용)
  //   GANG_THUG          [신규 · 거리 갱] ASH 근접
  //   네임드 보스         [신규/계승] RIVAL_GHOST·KAI_MORROW·MARCUS_CRANE·VERA_ASHTON·NEXUS_WARDEN
  //   AI 태그: 'coverShooter'|'advance'|'static' (해석은 systems/combat/ai.js)
  //   SIMPLIFIED: HELIX_MEDIC 회복·POLICE 소환 등 특수 메커닉은 엔진 미지원 →
  //               전투원 스탯으로 리플레이버(무편집 원칙 ②). 오브젝티브/전멸 이중승리 유지.
  // ==========================================================================

  // [계승 docs/07 §2 Bloc 임원] — 후속 챕터 적대 베이스 (표기 HP/ATK/DEF/SPD/HACK).
  var BLOC_EXEC = {
    VANTA:    { hp: 7,  atk: 2, def: 2, spd: 3, hack: 5, attr: 'MESH' },
    IRONWALL: { hp: 10, atk: 5, def: 4, spd: 3, hack: 1, attr: 'IRON' },
    HELIX:    { hp: 8,  atk: 3, def: 3, spd: 2, hack: 3, attr: 'BIO'  },
    AXIOM:    { hp: 6,  atk: 2, def: 2, spd: 4, hack: 5, attr: 'MESH' },
    CARBON:   { hp: 9,  atk: 3, def: 4, spd: 2, hack: 2, attr: 'VOLT' },
  };

  // 적 유닛 템플릿. mov 은 데이터로 고정(순수) — SPD 파생과 일치하도록 표기.
  //   spawnEnemy(store.js) 소비 필드: hp/atk/def/spd/hack/mov/ap/attr/range/ai +
  //   isMachine/physImmune/hackOnly. bloc/avoidable/lineage 는 메타(로그·계보).
  var ENEMIES = {
    // ── VANTA (MESH) — 챕터 1 무대 정본 ──
    VANTA_DRONE: {
      key: 'VANTA_DRONE', name: 'VANTA Sentry Drone', icon: '🛸',
      hp: 5, atk: 3, def: 1, spd: 4, hack: 0, mov: 4, ap: 2,
      attr: 'IRON', range: 4, ai: 'coverShooter', isMachine: true, bloc: 'VANTA',
      lineage: '[신규 스탯 · VANTA 무대 계승] 기계 → DATA SPIKE 보너스 대상',
    },
    VANTA_SECURITY: {
      key: 'VANTA_SECURITY', name: 'VANTA Corp Security', icon: '🔫',
      hp: 12, atk: 4, def: 3, spd: 3, hack: 0, mov: 3, ap: 2,
      attr: 'VOLT', range: 3, ai: 'advance', isMachine: false, bloc: 'VANTA', avoidable: true,
      lineage: '[신규 스탯 · VANTA 무대 계승] ★대화에서 회피 가능한 전투',
    },
    VANTA_ELITE: {
      key: 'VANTA_ELITE', name: 'VANTA Elite Agent', icon: '🕴',
      hp: 16, atk: 5, def: 3, spd: 3, hack: 5, mov: 3, ap: 2,
      attr: 'MESH', range: 3, ai: 'advance', isMachine: false, bloc: 'VANTA',
      lineage: '[계승 docs/07 §2 VANTA 7/2/2/3/5 → 정예 강화] 후반 정예 요원',
    },
    MESH_WISP: {
      key: 'MESH_WISP', name: 'Mesh Wisp', icon: '🌐',
      hp: 5, atk: 3, def: 1, spd: 5, hack: 2, mov: 4, ap: 2,
      attr: 'MESH', range: 4, ai: 'coverShooter', isMachine: false, bloc: 'VANTA',
      lineage: '[신규 · 메시 정령] 고속 MESH 원거리 (SHADE 상성 취약)',
    },

    // ── AXIOM (MESH · SPD 축) — 챕터 2 무대 ──
    AXIOM_DRONE: {
      key: 'AXIOM_DRONE', name: 'AXIOM Recon Drone', icon: '🛩',
      hp: 5, atk: 3, def: 1, spd: 4, hack: 0, mov: 4, ap: 2,
      attr: 'MESH', range: 4, ai: 'coverShooter', isMachine: true, bloc: 'AXIOM',
      lineage: '[신규 스탯 · docs/07 §2 AXIOM 6/2/2/4/5 파생] 경량 정찰 드론(기계)',
    },
    AXIOM_ANALYST: {
      key: 'AXIOM_ANALYST', name: 'AXIOM Analyst', icon: '👔',
      hp: 8, atk: 3, def: 2, spd: 4, hack: 5, mov: 4, ap: 2,
      attr: 'MESH', range: 3, ai: 'advance', isMachine: false, bloc: 'AXIOM', avoidable: true,
      lineage: '[계승 docs/07 §2 AXIOM 6/2/2/4/5] 분석관 · ★대화 우회 가능',
    },

    // ── 공권력 (docs/07 §8 Heat) — 챕터 3 계엄 무대 ──
    POLICE_OFFICER: {
      key: 'POLICE_OFFICER', name: 'Martial Officer', icon: '👮',
      hp: 12, atk: 4, def: 3, spd: 3, hack: 0, mov: 3, ap: 2,
      attr: 'VOLT', range: 3, ai: 'advance', isMachine: false, bloc: 'POLICE',
      lineage: '[신규 스탯 · docs/07 §8 Heat 공권력] 계엄 순찰',
    },
    POLICE_DRONE: {
      key: 'POLICE_DRONE', name: 'Patrol Drone', icon: '🚁',
      hp: 6, atk: 3, def: 2, spd: 4, hack: 0, mov: 4, ap: 2,
      attr: 'IRON', range: 4, ai: 'coverShooter', isMachine: true, bloc: 'POLICE',
      lineage: '[신규 · 공권력 드론] 기계 → DATA SPIKE 대상',
    },
    RIOT_ENFORCER: {
      key: 'RIOT_ENFORCER', name: 'Riot Enforcer', icon: '🛡',
      hp: 16, atk: 5, def: 4, spd: 2, hack: 0, mov: 2, ap: 2,
      attr: 'IRON', range: 1, ai: 'advance', isMachine: false, bloc: 'POLICE',
      lineage: '[신규 · 진압] 중장갑 근접, 저속 고DEF',
    },

    // ── HELIX (BIO) — 챕터 4 / 사이드 의료동 ──
    HELIX_MEDIC: {
      key: 'HELIX_MEDIC', name: 'HELIX Medic', icon: '⚕',
      hp: 10, atk: 3, def: 3, spd: 2, hack: 3, mov: 2, ap: 2,
      attr: 'BIO', range: 3, ai: 'advance', isMachine: false, bloc: 'HELIX',
      lineage: '[계승 docs/07 §2 HELIX 8/3/3/2/3] 의료병 (회복 미지원 → 전투원 SIMPLIFIED)',
    },
    SPLICE_HOUND: {
      key: 'SPLICE_HOUND', name: 'Splice Hound', icon: '🐺',
      hp: 8, atk: 4, def: 1, spd: 5, hack: 0, mov: 4, ap: 2,
      attr: 'BIO', range: 1, ai: 'advance', isMachine: false, bloc: 'HELIX',
      lineage: '[신규 · 스플라이스 산물] 고속 근접 야수 (IRON 상성 취약)',
    },

    // ── IRONWALL (IRON) — 사이드 무기고 / 후반 봉쇄 ──
    IRONWALL_ENFORCER: {
      key: 'IRONWALL_ENFORCER', name: 'IRONWALL Enforcer', icon: '🦾',
      hp: 12, atk: 5, def: 4, spd: 3, hack: 1, mov: 3, ap: 2,
      attr: 'IRON', range: 2, ai: 'advance', isMachine: false, bloc: 'IRONWALL',
      lineage: '[계승 docs/07 §2 IRONWALL 10/5/4/3/1] 집행관',
    },
    IRONWALL_TURRET: {
      key: 'IRONWALL_TURRET', name: 'IRONWALL Turret', icon: '🔩',
      hp: 10, atk: 4, def: 5, spd: 0, hack: 0, mov: 0, ap: 2,
      attr: 'IRON', range: 5, ai: 'coverShooter', isMachine: true, bloc: 'IRONWALL',
      lineage: '[신규 · IRONWALL 고정포탑] 기계·이동0 = 제자리 사수 (ai 트리 mov0 소비)',
    },

    // ── CARBON (VOLT) — 챕터 6 HQ / 사이드 공업지구 ──
    CARBON_GUARD: {
      key: 'CARBON_GUARD', name: 'CARBON Guard', icon: '⚙',
      hp: 10, atk: 3, def: 4, spd: 2, hack: 2, mov: 2, ap: 2,
      attr: 'VOLT', range: 3, ai: 'advance', isMachine: false, bloc: 'CARBON',
      lineage: '[계승 docs/07 §2 CARBON 9/3/4/2/2] 경비',
    },
    CARBON_DRONE: {
      key: 'CARBON_DRONE', name: 'CARBON Drone', icon: '🤖',
      hp: 6, atk: 3, def: 2, spd: 3, hack: 0, mov: 3, ap: 2,
      attr: 'VOLT', range: 4, ai: 'coverShooter', isMachine: true, bloc: 'CARBON',
      lineage: '[신규 · CARBON 드론] 기계 → DATA SPIKE 대상',
    },

    // ── 거리 / 정적 오브젝티브 수호 ──
    GANG_THUG: {
      key: 'GANG_THUG', name: 'Street Thug', icon: '🔨',
      hp: 8, atk: 4, def: 2, spd: 3, hack: 0, mov: 3, ap: 2,
      attr: 'ASH', range: 1, ai: 'advance', isMachine: false, bloc: 'STREET',
      lineage: '[신규 · 거리 갱] ASH 근접 (VOLT 상성 취약)',
    },
    ICE_NODE: {
      key: 'ICE_NODE', name: 'ICE Node', icon: '▦',
      hp: 3, atk: 0, def: 0, spd: 0, hack: 0, mov: 0, ap: 0,
      attr: 'SHADE', range: 0, ai: 'static', isMachine: false,
      physImmune: true, hackOnly: true, bloc: 'VANTA',
      lineage: '[각색 docs/07 §5.2] 정적 오브젝티브 수호, HACK만 파괴 (선택)',
    },
    SIGNAL_ICE: {
      key: 'SIGNAL_ICE', name: 'Signal ICE', icon: '❄',
      hp: 5, atk: 0, def: 0, spd: 0, hack: 0, mov: 0, ap: 0,
      attr: 'SHADE', range: 0, ai: 'static', isMachine: false,
      physImmune: true, hackOnly: true, bloc: 'NEXUS',
      lineage: '[각색 docs/07 §5.2 · ICE 계열 강화] 신호 얼음 방벽, HACK 전용 (선택/CIPHER 축)',
    },

    // ── 네임드 보스 (사이드/후반 결전) ──
    RIVAL_GHOST: {
      key: 'RIVAL_GHOST', name: 'Rival Ghost', icon: '🎭',
      hp: 18, atk: 4, def: 3, spd: 4, hack: 6, mov: 4, ap: 2,
      attr: 'SHADE', range: 4, ai: 'advance', isMachine: false, bloc: 'STREET',
      lineage: '[신규 · 라이벌 고스트 보스] SHADE 원거리 해커 (side-06 결투)',
    },
    KAI_MORROW: {
      key: 'KAI_MORROW', name: 'Kai Morrow', icon: '🗡',
      hp: 20, atk: 6, def: 4, spd: 3, hack: 3, mov: 3, ap: 2,
      attr: 'IRON', range: 2, ai: 'advance', isMachine: false, bloc: 'NEXUS',
      lineage: '[신규 · 네임드 KAI MORROW] IRON 근접 보스',
    },
    MARCUS_CRANE: {
      key: 'MARCUS_CRANE', name: 'Marcus Crane', icon: '💼',
      hp: 18, atk: 5, def: 4, spd: 3, hack: 4, mov: 3, ap: 2,
      attr: 'VOLT', range: 3, ai: 'advance', isMachine: false, bloc: 'CARBON',
      lineage: '[신규 · 네임드 MARCUS CRANE] CARBON 계열 임원 보스',
    },
    VERA_ASHTON: {
      key: 'VERA_ASHTON', name: 'Vera Ashton', icon: '🎙',
      hp: 18, atk: 4, def: 3, spd: 3, hack: 6, mov: 3, ap: 2,
      attr: 'MESH', range: 4, ai: 'advance', isMachine: false, bloc: 'VANTA',
      lineage: '[계승 docs/07 §2 VANTA 임원 · VERA ASHTON DIRECTOR] MESH 해커 보스',
    },
    NEXUS_WARDEN: {
      key: 'NEXUS_WARDEN', name: 'Nexus Warden', icon: '👁',
      hp: 22, atk: 6, def: 5, spd: 3, hack: 6, mov: 3, ap: 2,
      attr: 'GRID', range: 4, ai: 'advance', isMachine: false, bloc: 'NEXUS',
      lineage: '[신규 · NEXUS 수호자 최종 보스] GRID 코어 (ch08 결전)',
    },
  };

  var API = { BLOC_EXEC: BLOC_EXEC, ENEMIES: ENEMIES };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_ENEMIES = API;
})();
