;(function () {
  'use strict';
  // ==========================================================================
  // systems/dialogue.js — 대화 노드 그래프 러너 · 결정론 스탯 게이트 · 플래그
  // ──────────────────────────────────────────────────────────────────────────
  // 순수 함수 (DOM/React 무의존). 주사위 0 (docs/25 §4.2 결정론 게이트).
  //   evalGate    : { attr, min } | { tag } | { flag } → { ok, reason }
  //   choiceState : 선택지 표시 상태 (available | gray | hidden)
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

  // 선택지 표시 상태 — 미충족 게이트는 gray(광고) 또는 hidden.
  function choiceState(choice, ctx) {
    var g = evalGate(choice.gate, ctx);
    if (g.ok) return 'available';
    return choice.show === 'hide' ? 'hidden' : 'gray';
  }

  // 노드 진입 효과(onEnter) 적용 — setFlags 반환 (호출측이 state 병합).
  function onEnterFlags(node) {
    if (node && node.onEnter && node.onEnter.setFlags) return node.onEnter.setFlags;
    return null;
  }

  // 선택 적용. 반환 { goto, setFlags, effect }. 게이트 미충족 시 { blocked:true }.
  function applyChoice(choice, ctx) {
    var g = evalGate(choice.gate, ctx);
    if (!g.ok) return { blocked: true, reason: g.reason };
    return {
      blocked: false,
      goto: choice.goto || null,
      setFlags: choice.setFlags || null,
      effect: choice.effect || null,
    };
  }

  var API = { evalGate: evalGate, choiceState: choiceState, applyChoice: applyChoice, onEnterFlags: onEnterFlags };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_DIALOGUE = API;
})();
