;(function () {
  'use strict';
  // ==========================================================================
  // data/abilities.js — CIPHER 해킹 킷 + BLADE 근접 킷 [G6] (데이터 드리븐, 순수 리터럴)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 — CIPHER (docs/25 §3.6):
  //   해킹샷    [각색 docs/07 §5.2]  기본공격이 HACK를 공격치로 사용
  //   GLITCH    [각색 docs/07 §3 STEP D] "MESH 풀 2↑ → 적 DEF-1" 을 시그니처로 강화
  //   DATA SPIKE[각색 docs/04 카드명 + docs/07 §5.2] 기계(IRON) 관통·STUN
  //   ZERO TRACE[각색 LOSS 카드 계보] 미션당 1회 은신 궁극
  //   BACKDOOR  [계승 chapter-01 봉투 A] First Blood 보상 해금 (지속 해킹)
  // 계보 표 — BLADE 근접 킷 (Stage 2, cards/ghost/blade.md 원전 카드명 계승):
  //   POINT BLANK      [각색 blade.md Card07] 근접 기본공격(거리 0/사거리 1), ATK 사용
  //   SUPPRESSION FIRE [각색 blade.md Card02] "적 SPD−3 이동 저지" → DEF−1 & 이동 −2칸
  //   DOUBLE TAP       [각색 blade.md Card06] "ATK 2회, 2번째 DEF 무시" → 2연타 관통
  //   LAST STAND       [각색 blade.md Card09 [LOSS]] "DEF 무한 후 ATK×3 반격" → 2턴 무적 + 크리×3
  //   VENDETTA         [계승 blade.md 레거시 해금(챕터1)] First Blood 보상 해금 (무력 강습)
  // 계보 표 — RIGGER 설치·제어 킷 (48차, cards/ghost/rigger.md 원전 카드명 계승 · VOLT/IRON 축):
  //   정체성 = 트랩/설치형 지역 장악 (docs/07 §2 최고 DEF 4). 설치물은 기존 유닛 스폰 대신
  //   순수 데이터 필드로 추상화(신규 메커닉 0 — IRONWALL_TURRET 스폰 스키마 미사용, 리스크 최소).
  //   SENTRY GUN [각색 rigger.md Card08 SENTRY DEPLOY] 자율 센트리 자동사격 → VOLT 원거리 기본공격
  //   TRAP WIRE  [각색 rigger.md Card02 TRAP WIRE] "침입자 ATK−2·이동 저지" → DEF−1 & 이동−3칸(강한 고정)
  //   EMP PULSE  [각색 rigger.md Card07 EMP PULSE] "드론·자율경비 무력화(HACK 불요)" → 기계 관통+STUN 강공
  //   OVERLOAD   [각색 rigger.md Card09 OVERLOAD [LOSS]] "회로 연쇄 폭발" → 2턴 무적 + 해제 후 크리×2
  //   WORKSHOP   [계승 rigger.md 레거시 해금(챕터2)] 보상 해금 (현장 제작 → 오브젝티브 차감 +1)
  // 계보 표 — MOLE 위장·침투 킷 (48차, cards/ghost/mole.md 원전 카드명 계승 · SHADE/MESH 축):
  //   정체성 = 위장/침투형 (인물태그 게이트 통과 = 위장 태그 재활용 · 발각 리스크 관리 = loud:false 무소음).
  //   AUTH ABUSE   [각색 mole.md Card03 AUTH ABUSE] 권한 남용 시스템 타격 → HACK 무소음 기본공격
  //   CLEARANCE    [각색 mole.md Card04 CLEARANCE] "보안구역 접근·베일 무효" → DEF−2 & 엄폐 무효(내부 정보)
  //   BOARD MANIP  [각색 mole.md Card05 BOARD MANIPULATION] 내부 조작 표적 장악 → HACK 관통 무소음 강공
  //   IDENTITY COLLAPSE [각색 mole.md Card09 IDENTITY COLLAPSE [LOSS]] 정체성 붕괴 → 2턴 은신 + 급습 크리×3
  //   TRIPLE AGENT [계승 mole.md 레거시 해금(챕터2)] 보상 해금 (삼중 첩자 → 오브젝티브 차감 +1)
  // 필드 규약:
  //   kind   : RANGED|MELEE|DEBUFF|ULTIMATE|PASSIVE (UI 라우팅·표적 성격)
  //   useHack: true 면 공격치 = HACK, false 면 ATK  [계승 docs/07 §5.2]
  //   ap/cooldown/range: 액션 이코노미  [신규 docs/25 §3.2]
  //   loud   : 소음 액션 여부 → 위협/노출 게이지 가산 [G10]
  //   multiHit/applyStatus: 순수 데이터 서술 (해석은 resolve/reducer 가 담당)
  // ==========================================================================

  var ABILITIES = {
    HACK_SHOT: {
      key: 'HACK_SHOT', name: '해킹샷', icon: '🔓', attr: 'MESH',
      kind: 'RANGED', useHack: true, ap: 1, cooldown: 0, range: 5, loud: true,
      dmgBonus: 0, pierce: 0,
      desc: '기본 공격. dmg = max(0, HACK − DEF − 엄폐). HACK를 공격치로 사용.',
      lineage: '[각색 docs/07 §5.2]',
    },
    GLITCH: {
      key: 'GLITCH', name: 'GLITCH', icon: '🌀', attr: 'MESH',
      kind: 'DEBUFF', useHack: true, ap: 1, cooldown: 3, range: 5,
      applyStatus: { defDown: 2, coverNull: true, turns: 2 },
      desc: '대상 DEF−2 & 엄폐 무효 2턴.',
      lineage: '[각색 docs/07 §3 STEP D]',
    },
    DATA_SPIKE: {
      key: 'DATA_SPIKE', name: 'DATA SPIKE', icon: '⚡', attr: 'MESH',
      kind: 'RANGED', useHack: true, ap: 2, cooldown: 4, range: 5, loud: true,
      dmgBonus: 2, pierce: 0,
      vsMachine: { pierce: 2, stunTurns: 1 },
      desc: 'dmg = (HACK+2) − DEF. 기계(IRON)면 +2 관통 & 1턴 STUN.',
      lineage: '[각색 docs/04 + docs/07 §5.2]',
    },
    ZERO_TRACE: {
      key: 'ZERO_TRACE', name: 'ZERO TRACE', icon: '👻', attr: 'SHADE',
      kind: 'ULTIMATE', useHack: false, ap: 2, cooldown: 0, oncePerMission: true, range: 0,
      applyStatus: { stealth: true, turns: 2, nextCrit: 2 },
      desc: '2턴 은신(피격 불가) + 해제 후 첫 공격 크리 ×2. 미션당 1회.',
      lineage: '[각색 LOSS 카드 계보]',
    },
    BACKDOOR: {
      key: 'BACKDOOR', name: 'BACKDOOR', icon: '🚪', attr: 'MESH',
      kind: 'PASSIVE', useHack: true, ap: 0, cooldown: 0, range: 0, rewardUnlock: true,
      desc: '지속 해킹 유지 (First Blood 보상 해금). 오브젝티브 차감치 +1.',
      objectiveBonus: 1,
      lineage: '[계승 chapter-01 봉투 A]',
    },

    // ── BLADE 근접 킷 (Stage 2) — cards/ghost/blade.md 원전 카드명 계승, 수치 각색 ──
    POINT_BLANK: {
      key: 'POINT_BLANK', name: 'POINT BLANK', icon: '🔪', attr: 'IRON',
      kind: 'MELEE', useHack: false, ap: 1, cooldown: 0, range: 1, loud: true,
      dmgBonus: 0, pierce: 0,
      desc: '근접 기본 공격. dmg = max(0, ATK − DEF − 엄폐). 사거리 1.',
      lineage: '[각색 blade.md Card07 POINT BLANK · 근접(거리0)]',
    },
    SUPPRESSION_FIRE: {
      key: 'SUPPRESSION_FIRE', name: 'SUPPRESSION', icon: '🚫', attr: 'IRON',
      kind: 'DEBUFF', useHack: false, ap: 1, cooldown: 3, range: 2, loud: true,
      applyStatus: { defDown: 1, movDown: 2, turns: 2 },
      desc: '대상 DEF−1 & 이동 −2칸(이동 저지) 2턴. 사거리 2.',
      lineage: '[각색 blade.md Card02 SUPPRESSION FIRE · 적 SPD−3 이동저지]',
    },
    DOUBLE_TAP: {
      key: 'DOUBLE_TAP', name: 'DOUBLE TAP', icon: '🔫', attr: 'IRON',
      kind: 'MELEE', useHack: false, ap: 2, cooldown: 4, range: 1, loud: true,
      multiHit: { hits: 2, lastHitPierceAll: true },
      desc: '2회 연속 근접 타격. 2번째는 DEF 무시. 사거리 1.',
      lineage: '[각색 blade.md Card06 DOUBLE TAP · ATK 2회·2번째 DEF무시]',
    },
    LAST_STAND: {
      key: 'LAST_STAND', name: 'LAST STAND', icon: '🛡', attr: 'ASH',
      kind: 'ULTIMATE', useHack: false, ap: 2, cooldown: 0, oncePerMission: true, range: 0,
      applyStatus: { invuln: true, turns: 2, nextCrit: 3 },
      desc: '2턴 무적(피격 무효) + 해제 후 첫 공격 크리 ×3. 미션당 1회.',
      lineage: '[각색 blade.md Card09 LAST STAND [LOSS] · DEF무한 후 ATK×3]',
    },
    VENDETTA: {
      key: 'VENDETTA', name: 'VENDETTA', icon: '🩸', attr: 'ASH',
      kind: 'PASSIVE', useHack: false, ap: 0, cooldown: 0, range: 0, rewardUnlock: true,
      objectiveBonus: 1,
      desc: '이전 의뢰인에게 렙 손실 없이 강습. 오브젝티브 무력 차감치 +1 (First Blood 보상 해금).',
      lineage: '[계승 blade.md 레거시 해금 VENDETTA(챕터1)]',
    },

    // ── RIGGER 설치·제어 킷 (48차) — cards/ghost/rigger.md 원전 카드명 계승, 수치 각색 ──
    SENTRY_GUN: {
      key: 'SENTRY_GUN', name: 'SENTRY GUN', icon: '🔫', attr: 'VOLT',
      kind: 'RANGED', useHack: false, ap: 1, cooldown: 0, range: 4, loud: true,
      dmgBonus: 0, pierce: 0,
      desc: '자율 센트리 자동사격. dmg = max(0, ATK − DEF − 엄폐). 사거리 4 (VOLT).',
      lineage: '[각색 rigger.md Card08 SENTRY DEPLOY · 자율 센트리 자동공격]',
    },
    TRAP_WIRE: {
      key: 'TRAP_WIRE', name: 'TRAP WIRE', icon: '🪤', attr: 'IRON',
      kind: 'DEBUFF', useHack: false, ap: 1, cooldown: 3, range: 2, loud: false,
      applyStatus: { defDown: 1, movDown: 3, turns: 2 },
      desc: '함정 설치 → 대상 DEF−1 & 이동 −3칸(강한 고정) 2턴. 지역 장악. 사거리 2.',
      lineage: '[각색 rigger.md Card02 TRAP WIRE · 침입자 ATK−2·이동저지]',
    },
    EMP_PULSE: {
      key: 'EMP_PULSE', name: 'EMP PULSE', icon: '⚡', attr: 'VOLT',
      kind: 'RANGED', useHack: false, ap: 2, cooldown: 4, range: 4, loud: true,
      dmgBonus: 1, pierce: 0,
      vsMachine: { pierce: 2, stunTurns: 1 },
      desc: 'dmg = (ATK+1) − DEF. 기계·드론(IRON)이면 +2 관통 & 1턴 STUN. HACK 불요.',
      lineage: '[각색 rigger.md Card07 EMP PULSE · 드론·자율경비 무력화]',
    },
    OVERLOAD: {
      key: 'OVERLOAD', name: 'OVERLOAD', icon: '💥', attr: 'VOLT',
      kind: 'ULTIMATE', useHack: false, ap: 2, cooldown: 0, oncePerMission: true, range: 0,
      applyStatus: { invuln: true, turns: 2, nextCrit: 2 },
      desc: '회로 과부하 — 2턴 무적(피격 무효) + 해제 후 첫 공격 크리 ×2. 미션당 1회.',
      lineage: '[각색 rigger.md Card09 OVERLOAD [LOSS] · 함정·센트리 연쇄 폭발]',
    },
    WORKSHOP: {
      key: 'WORKSHOP', name: 'WORKSHOP', icon: '🛠', attr: 'IRON',
      kind: 'PASSIVE', useHack: false, ap: 0, cooldown: 0, range: 0, rewardUnlock: true,
      objectiveBonus: 1,
      desc: '거점 현장 제작 유지. 오브젝티브 무력 차감치 +1 (챕터 보상 해금).',
      lineage: '[계승 rigger.md 레거시 해금 WORKSHOP(챕터2)]',
    },

    // ── MOLE 위장·침투 킷 (48차) — cards/ghost/mole.md 원전 카드명 계승, 수치 각색 ──
    //   무소음(loud:false) = 위협/노출 게이지 미가산 → "발각 리스크 관리" 정체성.
    AUTH_ABUSE: {
      key: 'AUTH_ABUSE', name: 'AUTH ABUSE', icon: '🗝', attr: 'SHADE',
      kind: 'RANGED', useHack: true, ap: 1, cooldown: 0, range: 3, loud: false,
      dmgBonus: 0, pierce: 0,
      desc: '권한 남용 원격 사보타주. dmg = max(0, HACK − DEF − 엄폐). 무소음. 사거리 3.',
      lineage: '[각색 mole.md Card03 AUTH ABUSE · 위장 권한 악용]',
    },
    CLEARANCE: {
      key: 'CLEARANCE', name: 'CLEARANCE', icon: '🪪', attr: 'MESH',
      kind: 'DEBUFF', useHack: true, ap: 1, cooldown: 3, range: 4, loud: false,
      applyStatus: { defDown: 2, coverNull: true, turns: 2 },
      desc: '내부 보안 정보 악용 → 대상 DEF−2 & 엄폐 무효(베일 무시) 2턴. 무소음. 사거리 4.',
      lineage: '[각색 mole.md Card04 CLEARANCE · 보안구역 접근·베일 무효]',
    },
    BOARD_MANIP: {
      key: 'BOARD_MANIP', name: 'BOARD MANIP', icon: '♟', attr: 'SHADE',
      kind: 'RANGED', useHack: true, ap: 2, cooldown: 4, range: 3, loud: false,
      dmgBonus: 2, pierce: 2,
      desc: '내부 조작으로 표적 시스템 장악. dmg = (HACK+2) − max(0, DEF−2). 무소음. 사거리 3.',
      lineage: '[각색 mole.md Card05 BOARD MANIPULATION · 내부 조작]',
    },
    IDENTITY_COLLAPSE: {
      key: 'IDENTITY_COLLAPSE', name: 'IDENTITY COLLAPSE', icon: '🎭', attr: 'SHADE',
      kind: 'ULTIMATE', useHack: false, ap: 2, cooldown: 0, oncePerMission: true, range: 0,
      applyStatus: { stealth: true, turns: 2, nextCrit: 3 },
      desc: '정체성 붕괴 — 2턴 은신(피격 불가) + 재등장 첫 공격 급습 크리 ×3. 미션당 1회.',
      lineage: '[각색 mole.md Card09 IDENTITY COLLAPSE [LOSS] · 위장신분 소각 잠적]',
    },
    TRIPLE_AGENT: {
      key: 'TRIPLE_AGENT', name: 'TRIPLE AGENT', icon: '🕴', attr: 'SHADE',
      kind: 'PASSIVE', useHack: true, ap: 0, cooldown: 0, range: 0, rewardUnlock: true,
      objectiveBonus: 1,
      desc: '삼중 첩자 — 내부 접근 유지. 오브젝티브 차감치 +1 (챕터 보상 해금).',
      lineage: '[계승 mole.md 레거시 해금 TRIPLE AGENT(챕터2)]',
    },
  };

  // 기본 장착 킷 (보상 해금 카드 BACKDOOR/VENDETTA/WORKSHOP/TRIPLE_AGENT 는 해금 전까지 제외).
  var CIPHER_KIT = ['HACK_SHOT', 'GLITCH', 'DATA_SPIKE', 'ZERO_TRACE'];
  var BLADE_KIT  = ['POINT_BLANK', 'SUPPRESSION_FIRE', 'DOUBLE_TAP', 'LAST_STAND'];
  var RIGGER_KIT = ['SENTRY_GUN', 'TRAP_WIRE', 'EMP_PULSE', 'OVERLOAD'];
  var MOLE_KIT   = ['AUTH_ABUSE', 'CLEARANCE', 'BOARD_MANIP', 'IDENTITY_COLLAPSE'];

  // 클래스 → 기본 킷 + 보상 해금 시그니처 매핑 (campaign 이 클래스별 해금 선택).
  var KIT_BY_CLASS = { CIPHER: CIPHER_KIT, BLADE: BLADE_KIT, RIGGER: RIGGER_KIT, MOLE: MOLE_KIT };
  var UNLOCK_BY_CLASS = { CIPHER: 'BACKDOOR', BLADE: 'VENDETTA', RIGGER: 'WORKSHOP', MOLE: 'TRIPLE_AGENT' };

  var API = { ABILITIES: ABILITIES, CIPHER_KIT: CIPHER_KIT, BLADE_KIT: BLADE_KIT,
    RIGGER_KIT: RIGGER_KIT, MOLE_KIT: MOLE_KIT,
    KIT_BY_CLASS: KIT_BY_CLASS, UNLOCK_BY_CLASS: UNLOCK_BY_CLASS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_ABILITIES = API;
})();
