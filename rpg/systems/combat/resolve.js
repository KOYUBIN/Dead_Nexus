;(function () {
  'use strict';
  // ==========================================================================
  // systems/combat/resolve.js — 결정론 피해·오브젝티브·상처 [G5]
  // ──────────────────────────────────────────────────────────────────────────
  // 순수 함수만. 리액트/DOM/문서객체 참조 0 (G2). 주사위 0 (G5 결정론).
  //   computeDamage : max(0, atkValue − (def+cover) + affinity + bonus)  [각색 docs/07 §3 STEP E]
  //                   결과 0 = "튕김"(빗맞음, HP 무변동)
  //   objectiveDamage: threshold 누적 차감 (adjacent HACK/ATK)          [각색 docs/07 §변경요약]
  //   surviveReached: 생존형 승리 (survive:N 라운드 사수)               [신규 68차 · 데이터 구동]
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

  // [각색 blade.md Card06 DOUBLE TAP] 결정론 다연타. hits 회 연속 타격, lastHitPierceAll 이면
  //   마지막 타격은 DEF 무시(관통). 각 타격은 computeDamage 재사용 → 순수·결정론.
  //   opts = { atkValue, def, cover, affinity, bonus, crit, hits, lastHitPierceAll }.
  //   반환 { dmg(합계), hits:[각 타격 dmg], blocked(전타 튕김 여부) }.
  function multiStrike(opts) {
    var hits = Math.max(1, opts.hits || 1);
    var detail = [], total = 0, anyLanded = false;
    for (var i = 0; i < hits; i++) {
      var last = (i === hits - 1);
      var pierce = (last && opts.lastHitPierceAll) ? (opts.def || 0) : (opts.pierce || 0);
      var res = computeDamage({ atkValue: opts.atkValue, def: opts.def, cover: opts.cover,
        affinity: opts.affinity, bonus: opts.bonus, pierce: pierce, crit: opts.crit });
      detail.push(res.dmg); total += res.dmg;
      if (!res.blocked) anyLanded = true;
    }
    return { dmg: total, hits: detail, blocked: !anyLanded };
  }

  // 오브젝티브(서버랙/ICE) threshold 누적 차감. 인접 유닛의 HACK(또는 ATK) 액션.
  //   반환 { threshold(신규), reached(0 도달 여부), delta(실제 차감치) }.
  function objectiveDamage(objective, actorValue, extraBonus) {
    var cur = (objective.threshold || 0) + (objective.veil || 0);
    var delta = Math.max(0, actorValue + (extraBonus || 0));
    var next = Math.max(0, cur - delta);
    return { threshold: next, reached: next <= 0, delta: delta };
  }

  // [신규 68차] 생존형 승리 판정 — 데이터 구동 win-condition (오브젝티브 차감 단일형 해소).
  //   surviveRounds = 인카운터 데이터 `survive: N`. N라운드를 버텨내면(=라운드 카운터가
  //   N을 넘어서면) 승리. 방어전/농성전 변주의 유일한 엔진 확장 지점.
  //   ★하위 호환 불변식: surviveRounds 가 falsy(미지정/0/null)면 항상 false →
  //     기존 30미션의 판정 경로는 byte 단위로 무변경(호출측이 이 false 로 단락).
  function surviveReached(round, surviveRounds) {
    if (!surviveRounds || surviveRounds <= 0) return false;
    return (round || 0) > surviveRounds;
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

  // [M7 v6.46] inRange(distance, range) 제거 — 소비처 0(리포 전역 grep). 사거리 판정은
  //   호출부가 grid.chebyshev(...) <= range 로 직접 수행한다. 죽은 export 를 남겨두면
  //   "여기가 사거리 정본" 이라는 잘못된 신호를 준다.

  var API = {
    computeDamage: computeDamage,
    multiStrike: multiStrike,
    objectiveDamage: objectiveDamage,
    surviveReached: surviveReached,
    bleedingTick: bleedingTick,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_RESOLVE = API;
})();
