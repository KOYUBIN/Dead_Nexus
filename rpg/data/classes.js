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
  //   [신규 파생 docs/25 §3.1] MOV = SPD 파생 (SPD<=2→2 / 3→3 / >=4→4)
  //   [신규 docs/25 §3.2] AP 단일 풀 기본 2
  // 슬라이스 플레이어블 = CIPHER 단독. 나머지 5클래스는 후속 로스터용 데이터 상비.
  // ==========================================================================

  // [계승 docs/07 §2] — 표기 순서 HP/ATK/DEF/SPD/HACK
  var CLASSES = {
    CIPHER:  { key: 'CIPHER',  hp: 6,  atk: 2, def: 1, spd: 4, hack: 5, primary: 'MESH',  secondary: 'SHADE', note: 'HACK 특화, 최저 HP' },
    BLADE:   { key: 'BLADE',   hp: 10, atk: 5, def: 3, spd: 3, hack: 1, primary: 'IRON',  secondary: 'ASH',   note: '최고 HP·ATK, 자동 선공' },
    RIGGER:  { key: 'RIGGER',  hp: 7,  atk: 3, def: 4, spd: 2, hack: 3, primary: 'VOLT',  secondary: 'IRON',  note: '최고 DEF, 균형형' },
    BROKER:  { key: 'BROKER',  hp: 6,  atk: 2, def: 2, spd: 5, hack: 2, primary: 'SHADE', secondary: 'GRID',  note: '최고 SPD, 전투 회피형' },
    DRIFTER: { key: 'DRIFTER', hp: 9,  atk: 4, def: 2, spd: 4, hack: 1, primary: 'ASH',   secondary: 'GRID',  note: '고 HP + 고 SPD, 기동형' },
    MOLE:    { key: 'MOLE',    hp: 7,  atk: 2, def: 3, spd: 3, hack: 3, primary: 'SHADE', secondary: 'MESH',  note: '균형, 유연성' },
  };

  // [신규 파생 docs/25 §3.1] SPD → MOV(칸). 1 AP = MOV칸.
  function movFromSpd(spd) {
    if (spd <= 2) return 2;
    if (spd === 3) return 3;
    return 4; // spd >= 4
  }

  // [계승 docs/07 §10] 유효 HP = 기본 × 2.
  function effectiveMaxHp(baseHp) { return baseHp * 2; }

  var API = { CLASSES: CLASSES, movFromSpd: movFromSpd, effectiveMaxHp: effectiveMaxHp };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_CLASSES = API;
})();
