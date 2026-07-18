;(function () {
  'use strict';
  // ==========================================================================
  // data/classes.js — 6클래스 기본 스탯 + 클래스×속성 친화 (순수 리터럴)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표:
  //   [계승 docs/07 §2] 6클래스 기본 스탯 HP/ATK/DEF/SPD/HACK (원전 수치 그대로)
  //   [계승 docs/07 §11] 스탯 합계 17~22 밸런스 (원전 준수)
  //   [계승 docs/07 §10] 유효 HP = 기본 HP × 2 상한 (CIPHER 6→12)
  //   [계승 docs/06 §9] 클래스 주/부 속성
  //   [계승 docs/06 §7] 시그널 다이 정렬 (🔵UP=MESH계 CIPHER/RIGGER/AXIOM / 🔴DOWN=IRON계 BLADE/DRIFTER)
  //   [계승 docs/07 §3 STEP B(3항)] BLADE 동점 자동 선공 패시브
  //   [신규 파생 docs/25 §3.1] MOV = SPD 파생 (SPD<=2→2 / 3→3 / >=4→4)
  //   [신규 docs/25 §3.2] AP 단일 풀 기본 2
  // Stage 2 플레이어블 = CIPHER(해킹) + BLADE(근접). 나머지 4클래스는 후속 로스터 데이터.
  // ==========================================================================

  // [계승 docs/07 §2] — 표기 순서 HP/ATK/DEF/SPD/HACK
  //   signalFavor: [계승 docs/06 §7] 🔵UP 이득=mesh(CIPHER/RIGGER/AXIOM) / 🔴DOWN 이득=iron(BLADE/DRIFTER)
  //   passive    : [계승 docs/07 §3 STEP B(3항)] 클래스 고정 패시브 (표시·정체성)
  var CLASSES = {
    CIPHER:  { key: 'CIPHER',  hp: 6,  atk: 2, def: 1, spd: 4, hack: 5, primary: 'MESH',  secondary: 'SHADE', signalFavor: 'mesh', icon: '👤', codename: 'STATIC', passive: '베일 판독 — 오브젝티브 해킹 특화', note: 'HACK 특화, 최저 HP' },
    BLADE:   { key: 'BLADE',   hp: 10, atk: 5, def: 3, spd: 3, hack: 1, primary: 'IRON',  secondary: 'ASH',   signalFavor: 'iron', icon: '🗡', codename: 'RUST',   passive: '동점 자동 선공 [계승 docs/07 §3 STEP B]', note: '최고 HP·ATK, 자동 선공' },
    RIGGER:  { key: 'RIGGER',  hp: 7,  atk: 3, def: 4, spd: 2, hack: 3, primary: 'VOLT',  secondary: 'IRON',  signalFavor: 'mesh', icon: '🔧', codename: 'PATCH',  note: '최고 DEF, 균형형' },
    BROKER:  { key: 'BROKER',  hp: 6,  atk: 2, def: 2, spd: 5, hack: 2, primary: 'SHADE', secondary: 'GRID',  signalFavor: 'iron', icon: '🎭', codename: 'SILK',   note: '최고 SPD, 전투 회피형' },
    DRIFTER: { key: 'DRIFTER', hp: 9,  atk: 4, def: 2, spd: 4, hack: 1, primary: 'ASH',   secondary: 'GRID',  signalFavor: 'iron', icon: '🚗', codename: 'FLINT',  note: '고 HP + 고 SPD, 기동형' },
    MOLE:    { key: 'MOLE',    hp: 7,  atk: 2, def: 3, spd: 3, hack: 3, primary: 'SHADE', secondary: 'MESH',  signalFavor: 'mesh', icon: '🕵', codename: 'ECHO',   note: '균형, 유연성' },
  };

  // Stage 2 플레이어블 로스터 (허브 크루/로스터에서 선택 가능).
  var PLAYABLE = ['CIPHER', 'BLADE'];

  // [신규 파생 docs/25 §3.1] SPD → MOV(칸). 1 AP = MOV칸.
  function movFromSpd(spd) {
    if (spd <= 2) return 2;
    if (spd === 3) return 3;
    return 4; // spd >= 4
  }

  // [계승 docs/07 §10] 유효 HP = 기본 × 2.
  function effectiveMaxHp(baseHp) { return baseHp * 2; }

  var API = { CLASSES: CLASSES, PLAYABLE: PLAYABLE, movFromSpd: movFromSpd, effectiveMaxHp: effectiveMaxHp };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_CLASSES = API;
})();
