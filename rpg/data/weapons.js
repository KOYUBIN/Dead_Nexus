;(function () {
  'use strict';
  // ==========================================================================
  // data/weapons.js — 무기/방어구/소모품 (슬라이스 최소 세트, 순수 리터럴)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표:
  //   [각색 docs/07 §5.2] CIPHER 물리 ATK 는 약함이 정체성 → 무기는 보조.
  //   [계승 docs/07 §6] 소모품 회복 (거점/의료 계열) — 상점 스텁용.
  //   슬라이스 상점은 표시 스텁이므로 품목은 최소. karma 성장이 주 성장축.
  // ==========================================================================

  var WEAPONS = {
    NEURAL_SPIKE: { key: 'NEURAL_SPIKE', name: 'Neural Spike', slot: 'weapon', hackBonus: 0, atkBonus: 0, note: 'CIPHER 기본 인터페이스(장착 상시)' },
  };

  var ITEMS = {
    STIM_PATCH: { key: 'STIM_PATCH', name: 'Stim Patch', slot: 'consumable', heal: 4, cost: 3, note: 'HP +4 [계승 docs/07 §6]' },
  };

  var API = { WEAPONS: WEAPONS, ITEMS: ITEMS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_WEAPONS = API;
})();
