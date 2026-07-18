;(function () {
  'use strict';
  // ==========================================================================
  // data/signal.js — 시그널 다이 4상태 전체 [계승 docs/06 §7] (순수 리터럴 + 헬퍼)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §3.1 시그널 다이 · docs/06 §7 메시 상태):
  //   [계승 docs/06 §7] 4상태 🔵UP / 🔴DOWN / ⚡SURGE / ⚫BLACKOUT + 6면 분포(1-2/3-4/5/6)
  //   [계승 docs/06 §7] UP=CIPHER·RIGGER·AXIOM +1 / DOWN=BLADE·DRIFTER·IRONWALL +1
  //   [계승 docs/06 §7] SURGE=모든 조합 2배 / BLACKOUT=HACK 불가·CIPHER 이니셔티브 +20
  //   [각색 G5 결정론] "매 라운드 다이 굴림"을 주사위 0(결정론)으로 각색 → round 파생.
  //                    docs/25 §8 비-목표 "주사위 굴림 연출" 금지와 정합(세이브 재현성).
  //   [각색 docs/25 §3.2] "이니셔티브 +20" → RPG 액션 이코노미의 AP +1 로 각색(BLACKOUT).
  // 순수 데이터 — DOM/리액트/문서객체 참조 0. 전투 로직은 store 가 modifiers 로 소비.
  // ==========================================================================

  // [계승 docs/06 §7] 4상태 정의. favor: 이 상태가 이득 주는 signalFavor 축.
  var STATES = {
    UP:       { key: 'UP',       sym: '🔵', label: 'MESH UP',   color: '#185FA5', favor: 'mesh',
                desc: '메시 활성 — HACK/MESH 축 공격·오브젝티브 +1',
                lineage: '[계승 docs/06 §7] CIPHER·RIGGER·AXIOM +1' },
    DOWN:     { key: 'DOWN',     sym: '🔴', label: 'MESH DOWN', color: '#C04828', favor: 'iron',
                desc: '메시 불안정 — 물리/IRON 축 공격 +1',
                lineage: '[계승 docs/06 §7] BLADE·DRIFTER·IRONWALL +1' },
    SURGE:    { key: 'SURGE',    sym: '⚡', label: 'SURGE',     color: '#ffd700', favor: null,
                desc: '메시 과부하 — 상성 보정 2배 · 노출 가속(2배)',
                lineage: '[계승 docs/06 §7] 모든 카드 조합 2배 · 상처/스캔들 2배' },
    BLACKOUT: { key: 'BLACKOUT', sym: '⚫', label: 'BLACKOUT',  color: '#534AB7', favor: null,
                desc: '메시 차단 — HACK 행동 전부 불가 · CIPHER AP +1',
                lineage: '[계승 docs/06 §7 → 각색 docs/25 §3.2] HACK 불가 · 이니셔티브 +20 → AP +1' },
  };

  // [계승 docs/06 §7] 6면 분포: 1-2 UP / 3-4 DOWN / 5 SURGE / 6 BLACKOUT.
  var FACES = ['UP', 'UP', 'DOWN', 'DOWN', 'SURGE', 'BLACKOUT'];

  // [각색 G5 결정론] 라운드 파생 상태(주사위 0). 매 라운드 다이면(面)을 순환 소비 →
  //   4상태 전체가 라운드 진행에 걸쳐 반드시 노출되며, 세이브/로드 재현성 자명.
  function rollForRound(round) {
    var r = Math.max(1, round | 0);
    return STATES[FACES[(r - 1) % FACES.length]];
  }

  // 전투 modifier 산출. 소비처(store)가 능력·favor·상성을 넘기면 보정치 반환.
  //   opts = { stateKey, useHack(bool), favor('mesh'|'iron'), affinity(-1|0|1) }
  //   반환 { dmgBonus, objectiveBonus, affinityMult, apBonus, hackDisabled }.
  function modifiers(stateKey, opts) {
    opts = opts || {};
    var m = { dmgBonus: 0, objectiveBonus: 0, affinityMult: 1, apBonus: 0, hackDisabled: false };
    if (stateKey === 'UP') {
      if (opts.useHack && opts.favor === 'mesh') { m.dmgBonus += 1; m.objectiveBonus += 1; }
    } else if (stateKey === 'DOWN') {
      if (!opts.useHack && opts.favor === 'iron') { m.dmgBonus += 1; }
    } else if (stateKey === 'SURGE') {
      m.affinityMult = 2;                 // 상성 ±1 → ±2 (조합 2배)
    } else if (stateKey === 'BLACKOUT') {
      if (opts.useHack) m.hackDisabled = true;   // HACK 기반 행동 불가
      if (opts.favor === 'mesh') m.apBonus = 1;  // CIPHER 이니셔티브 +20 → AP +1 각색
    }
    return m;
  }

  var API = { STATES: STATES, FACES: FACES, rollForRound: rollForRound, modifiers: modifiers };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_SIGNAL = API;
})();
