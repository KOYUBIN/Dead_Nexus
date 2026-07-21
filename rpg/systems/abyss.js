;(function () {
  'use strict';
  // ==========================================================================
  // systems/abyss.js — [신규 v6.44 · 과제 A1] 무한 상승 계약 "심연 프로토콜"
  // ──────────────────────────────────────────────────────────────────────────
  // 캡스톤(a2-99-flagship) 클리어 후 해금되는 무한 웨이브 결정론 전투.
  //   · 신규 씬 0 — 기존 전투 엔진(store.buildCombat + 전투 스텝) 완전 재사용.
  //   · 웨이브 N 은 기존 미션 인카운터를 N 기반으로 순환 선택(POOL) + 적 스탯 스케일 1+0.05N.
  //     (스케일은 store.spawnEnemy 의 scale 인자 재사용 — 신규 메커닉 0, 전투 결정론 유지.)
  //   · 로컬 최고 웨이브 기록은 save.abyss.best(세이브). 패배해도 페널티 없음(store.resolveAbyss).
  // 순수 함수 (DOM/React 무의존) — campaign.missionData 로 기존 인카운터 config 만 해석한다.
  //   POOL/스케일/선택은 전부 결정론 → 같은 N 은 항상 같은 인카운터·배율(유닛 테스트 핀 고정).
  // ==========================================================================

  function deps() {
    var w = (typeof window !== 'undefined') ? window : null;
    if (w && w.RPG_CAMPAIGN) return { CAMP: w.RPG_CAMPAIGN };
    return { CAMP: require('./campaign.js') };
  }

  // 결정론 웨이브 풀 — 기존 Act2 2연전 인카운터(enc①/enc②) + 캡스톤 stage2/stage3 재사용.
  //   key=null → mission.combat(enc①), 문자열 → mission.encounters[key]. 신규 무대 0.
  var POOL = [
    { id: 'a2-a2-crown-throne', key: null,     label: '조세·데이터 볼트' },
    { id: 'a2-a2-crown-throne', key: 'stage2', label: '국부 원장 코어' },
    { id: 'a2-b2-freeport',     key: null,     label: '자유항 셔터' },
    { id: 'a2-b2-freeport',     key: 'stage2', label: '기함 코어' },
    { id: 'a2-c2-signal-war',   key: null,     label: '메시 게이트' },
    { id: 'a2-c2-signal-war',   key: 'stage2', label: '근원 코어' },
    { id: 'a2-d2-last-signal',  key: null,     label: '폐허 관문' },
    { id: 'a2-d2-last-signal',  key: 'stage2', label: '하베스터 코어' },
    { id: 'a2-99-flagship',     key: 'stage2', label: 'OVERLORD 근위' },
    { id: 'a2-99-flagship',     key: 'stage3', label: 'OVERLORD 결전' },
  ];

  // 웨이브 N (1-base) → 적 스탯 배율. spawnEnemy(store.js) 의 scale 로 소비(hp/maxHp/atk ×ceil).
  function waveScale(n) { return 1 + 0.05 * n; }
  // 웨이브 N → POOL 순환 인덱스(음수/0 방어).
  function poolIndex(n) { return (((n - 1) % POOL.length) + POOL.length) % POOL.length; }
  // 웨이브 N → 계획(무대 id·인카운터 키·라벨·스케일). 순수 결정론.
  function wavePlan(n) {
    var e = POOL[poolIndex(n)];
    return { wave: n, missionId: e.id, encKey: e.key, label: e.label, scale: waveScale(n) };
  }
  // 웨이브 N → 인카운터 config 해석(mission.combat 또는 mission.encounters[key]). 미해석 시 null.
  function waveEncounter(n) {
    var D = deps();
    var plan = wavePlan(n);
    var m = D.CAMP.missionData(plan.missionId);
    if (!m) return null;
    var cfg = plan.encKey ? (m.encounters && m.encounters[plan.encKey]) : m.combat;
    return cfg || null;
  }

  var API = {
    POOL: POOL, waveScale: waveScale, poolIndex: poolIndex,
    wavePlan: wavePlan, waveEncounter: waveEncounter,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_ABYSS = API;
})();
