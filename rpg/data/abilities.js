;(function () {
  'use strict';
  // ==========================================================================
  // data/abilities.js — CIPHER 4-액션 히어로 킷 [G6] (데이터 드리븐, 순수 리터럴)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §3.6):
  //   해킹샷    [각색 docs/07 §5.2]  기본공격이 HACK를 공격치로 사용
  //   GLITCH    [각색 docs/07 §3 STEP D] "MESH 풀 2↑ → 적 DEF-1" 을 시그니처로 강화
  //   DATA SPIKE[각색 docs/04 카드명 + docs/07 §5.2] 기계(IRON) 관통·STUN
  //   ZERO TRACE[각색 LOSS 카드 계보] 미션당 1회 은신 궁극
  //   BACKDOOR  [계승 chapter-01 봉투 A] First Blood 보상 해금 (지속 해킹)
  // 필드 규약:
  //   type   : 'attack' | 'objective' 표적 성격 (UI 라우팅용)
  //   useHack: true 면 공격치 = HACK, false 면 ATK  [계승 docs/07 §5.2]
  //   ap/cooldown/range: 액션 이코노미  [신규 docs/25 §3.2]
  //   effect : 순수 데이터 서술 (해석은 resolve/reducer 가 담당)
  // ==========================================================================

  var ABILITIES = {
    HACK_SHOT: {
      key: 'HACK_SHOT', name: '해킹샷', icon: '🔓', attr: 'MESH',
      kind: 'RANGED', useHack: true, ap: 1, cooldown: 0, range: 5,
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
      kind: 'RANGED', useHack: true, ap: 2, cooldown: 4, range: 5,
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
  };

  // 슬라이스 CIPHER 기본 장착 킷 (BACKDOOR 는 보상 해금 전까지 제외).
  var CIPHER_KIT = ['HACK_SHOT', 'GLITCH', 'DATA_SPIKE', 'ZERO_TRACE'];

  var API = { ABILITIES: ABILITIES, CIPHER_KIT: CIPHER_KIT };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_ABILITIES = API;
})();
