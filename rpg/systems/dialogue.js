;(function () {
  'use strict';
  // ==========================================================================
  // systems/dialogue.js — 대화 노드 그래프 러너 · 결정론 스탯 게이트 · 플래그
  // ──────────────────────────────────────────────────────────────────────────
  // 순수 함수 (DOM/React 무의존). 주사위 0 (docs/25 §4.2 결정론 게이트).
  //   evalGate    : { attr, min } | { tag } | { flag } → { ok, reason }
  //   evalCost    : effect.spendKarma / effect.spendNuyen(자원 비용) → { ok, reason }  [72차 #14 · 73차]
  //   choiceState : 선택지 표시 상태 (available | gray | hidden)
  //   choiceReason: 미충족 사유 1줄 (게이트 우선 → 비용). 충족 시 null
  //   applyChoice : setFlags/effect 를 상태에 적용, 다음 노드 id 반환
  // MFU (docs/25 §1): 스탯 게이트 하나가 전투를 실제로 제거/축소함을 증명.
  // ==========================================================================

  // 게이트 판정. character.attrs = { hack, atk, ... }, flags, tags(배열).
  function evalGate(gate, ctx) {
    if (!gate) return { ok: true, reason: null };
    if (gate.attr) {
      var have = (ctx.attrs && ctx.attrs[gate.attr]) || 0;
      return { ok: have >= gate.min, reason: '[' + gate.attr.toUpperCase() + ' ' + gate.min + '] (보유 ' + have + ')' };
    }
    if (gate.tag) {
      var tags = ctx.tags || [];
      return { ok: tags.indexOf(gate.tag) >= 0, reason: '[' + gate.tag + ' 태그]' };
    }
    if (gate.flag) {
      var flags = ctx.flags || {};
      return { ok: !!flags[gate.flag], reason: '[flag ' + gate.flag + ']' };
    }
    return { ok: true, reason: null };
  }

  // [72차 · d45 #14 · 73차 확장] 선택지 자원 비용 판정 — effect.spendKarma / effect.spendNuyen 을
  //   게이트와 동일 계약으로 평가한다(미충족 → gray + 사유 1줄, 반려 시 효과 무적용).
  //   비용 미선언 선택지는 항상 ok(무해) → 32미션의 비용 미선언 선택지 판정 byte 불변(_unit 336).
  //   ctx.karma/ctx.nuyen 미제공(구 컨텍스트) 시 0 으로 간주 → 부족 판정(조용한 차감 실패보다 차단이 안전).
  //   COST_KEYS 순서 = 사유 표시 우선순위. 신규 자원은 이 배열 1줄 추가로 확장된다.
  var COST_KEYS = [
    { key: 'spendKarma', ctx: 'karma', res: 'karma', label: 'karma' },
    { key: 'spendNuyen', ctx: 'nuyen', res: 'nuyen', label: '₵' },
  ];

  function evalCost(choice, ctx) {
    var eff = (choice && choice.effect) || {};
    var c = ctx || {};
    var cost = { karma: 0, nuyen: 0 };
    var first = null, short = null;
    for (var i = 0; i < COST_KEYS.length; i++) {
      var k = COST_KEYS[i];
      var need = eff[k.key];
      if (!need) continue;
      var have = (typeof c[k.ctx] === 'number') ? c[k.ctx] : 0;
      cost[k.res] = need;
      var entry = { label: k.label, need: need, have: have };
      if (!first) first = entry;
      if (have < need && !short) short = entry;
    }
    if (!first) return { ok: true, reason: null, need: 0, cost: cost };
    var e = short || first;
    // 사유 문자열은 72차 karma 표기와 byte 동일 — '[karma 1 지출] (보유 0)'.
    var reason = '[' + e.label + ' ' + e.need + ' 지출] (보유 ' + e.have + ')';
    return { ok: !short, reason: reason, need: e.need, have: e.have, cost: cost };
  }

  // 선택지 표시 상태 — 미충족 게이트/비용은 gray(광고) 또는 hidden.
  function choiceState(choice, ctx) {
    var g = evalGate(choice.gate, ctx);
    if (!g.ok) return choice.show === 'hide' ? 'hidden' : 'gray';
    var c = evalCost(choice, ctx);
    if (!c.ok) return choice.show === 'hide' ? 'hidden' : 'gray';
    return 'available';
  }

  // 미충족 사유 1줄 — UI 회색 선택지의 '왜 잠겼는가' 표시용. 충족 시 null.
  function choiceReason(choice, ctx) {
    var g = evalGate(choice.gate, ctx);
    if (!g.ok) return g.reason;
    var c = evalCost(choice, ctx);
    if (!c.ok) return c.reason;
    return null;
  }

  // 노드 진입 효과(onEnter) 적용 — setFlags 반환 (호출측이 state 병합).
  function onEnterFlags(node) {
    if (node && node.onEnter && node.onEnter.setFlags) return node.onEnter.setFlags;
    return null;
  }

  // 선택 적용. 반환 { goto, setFlags, effect, cost }. 게이트/비용 미충족 시 { blocked:true }.
  //   [72차] 비용 미충족도 blocked — 자원이 모자란 채로 효과만 적용되는 '조용한 차감 실패'를 원천 차단한다.
  //   cost.karma / cost.nuyen 은 호출측(store.dialogueChoose)이 실제 차감할 금액(0 = 무비용, 기존 선택지 전량).
  function applyChoice(choice, ctx) {
    var g = evalGate(choice.gate, ctx);
    if (!g.ok) return { blocked: true, reason: g.reason };
    var c = evalCost(choice, ctx);
    if (!c.ok) return { blocked: true, reason: c.reason };
    return {
      blocked: false,
      goto: choice.goto || null,
      setFlags: choice.setFlags || null,
      effect: choice.effect || null,
      cost: { karma: c.cost.karma || 0, nuyen: c.cost.nuyen || 0 },
    };
  }

  var API = { evalGate: evalGate, evalCost: evalCost, choiceState: choiceState,
    choiceReason: choiceReason, applyChoice: applyChoice, onEnterFlags: onEnterFlags,
    COST_KEYS: COST_KEYS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_DIALOGUE = API;
})();
