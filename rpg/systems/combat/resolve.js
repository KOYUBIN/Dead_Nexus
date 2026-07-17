;(function () {
  'use strict';
  // ==========================================================================
  // systems/combat/resolve.js — 결정론 피해·오브젝티브·상처 [G5]
  // ──────────────────────────────────────────────────────────────────────────
  // 순수 함수만. 리액트/DOM/문서객체 참조 0 (G2). 주사위 0 (G5 결정론).
  //   computeDamage : max(0, atkValue − (def+cover) + affinity + bonus)  [각색 docs/07 §3 STEP E]
  //                   결과 0 = "튕김"(빗맞음, HP 무변동)
  //   objectiveDamage: threshold 누적 차감 (adjacent HACK/ATK)          [각색 docs/07 §변경요약]
  //   bleedingTick  : HP<=50% → 턴당 -1                                 [계승 docs/07 §7]
  // affinity(±1)는 호출측이 data/attributes.affinityMod 로 계산해 주입 → resolve 는 데이터 무의존.
  // ==========================================================================

  // 결정론 피해식. 반환 { dmg, blocked }. blocked=true 면 튕김(피해 0).
  function computeDamage(opts) {
    var atkValue = opts.atkValue || 0;
    var def = opts.def || 0;
    var cover = opts.cover || 0;
    var affinity = opts.affinity || 0;   // -1 | 0 | +1 (호출측 주입)
    var bonus = opts.bonus || 0;          // 능력 dmgBonus 등
    var pierce = opts.pierce || 0;        // DEF 관통 (DATA SPIKE vs 기계)
    var crit = opts.crit || 1;            // ZERO TRACE 해제 후 첫 공격 ×2
    var effDef = Math.max(0, (def - pierce)) + cover;
    var raw = (atkValue + bonus + affinity) - effDef;
    var dmg = Math.max(0, raw) * crit;
    return { dmg: dmg, blocked: dmg <= 0 };
  }

  // 오브젝티브(서버랙/ICE) threshold 누적 차감. 인접 유닛의 HACK(또는 ATK) 액션.
  //   반환 { threshold(신규), reached(0 도달 여부), delta(실제 차감치) }.
  function objectiveDamage(objective, actorValue, extraBonus) {
    var cur = (objective.threshold || 0) + (objective.veil || 0);
    var delta = Math.max(0, actorValue + (extraBonus || 0));
    var next = Math.max(0, cur - delta);
    return { threshold: next, reached: next <= 0, delta: delta };
  }

  // [계승 docs/07 §7] 상처/BLEEDING: 유효HP 50% 이하면 턴 시작 -1 (0 미만 방지).
  function bleedingTick(unit) {
    if (unit.hp <= 0) return { hp: unit.hp, bleeding: false };
    var half = unit.maxHp * 0.5;
    if (unit.hp <= half) {
      return { hp: Math.max(0, unit.hp - 1), bleeding: true };
    }
    return { hp: unit.hp, bleeding: false };
  }

  // 사거리 내인가 (원거리 무기/능력). chebyshev 는 grid 에서 계산해 넘김.
  function inRange(distance, range) { return distance <= range; }

  var API = {
    computeDamage: computeDamage,
    objectiveDamage: objectiveDamage,
    bleedingTick: bleedingTick,
    inRange: inRange,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_RESOLVE = API;
})();
