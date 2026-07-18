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
  };

  // 기본 장착 킷 (보상 해금 카드 BACKDOOR/VENDETTA 는 해금 전까지 제외).
  var CIPHER_KIT = ['HACK_SHOT', 'GLITCH', 'DATA_SPIKE', 'ZERO_TRACE'];
  var BLADE_KIT  = ['POINT_BLANK', 'SUPPRESSION_FIRE', 'DOUBLE_TAP', 'LAST_STAND'];

  // 클래스 → 기본 킷 + 보상 해금 시그니처 매핑 (campaign 이 클래스별 해금 선택).
  var KIT_BY_CLASS = { CIPHER: CIPHER_KIT, BLADE: BLADE_KIT };
  var UNLOCK_BY_CLASS = { CIPHER: 'BACKDOOR', BLADE: 'VENDETTA' };

  var API = { ABILITIES: ABILITIES, CIPHER_KIT: CIPHER_KIT, BLADE_KIT: BLADE_KIT,
    KIT_BY_CLASS: KIT_BY_CLASS, UNLOCK_BY_CLASS: UNLOCK_BY_CLASS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_ABILITIES = API;
})();
