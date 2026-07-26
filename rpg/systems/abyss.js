;(function () {
  'use strict';
  // ==========================================================================
  // systems/abyss.js — [신규 v6.44 · 과제 A1] 무한 상승 계약 "심연 프로토콜"
  // ──────────────────────────────────────────────────────────────────────────
  // 캡스톤(a2-99-flagship) 클리어 후 해금되는 무한 웨이브 결정론 전투.
  //   · 신규 씬 0 — 기존 전투 엔진(store.buildCombat + 전투 스텝) 완전 재사용.
  //   · 웨이브 N 은 기존 미션 인카운터를 N 기반으로 순환 선택(POOL) + 적 스탯 스케일 1+0.05N.
  //     (스케일은 store.spawnEnemy 의 scale 인자 재사용 — 신규 메커닉 0, 전투 결정론 유지.)
  //   · 로컬 최고 웨이브 기록은 save.abyss(세이브). 패배해도 페널티 없음(store.resolveAbyss).
  // 순수 함수 (DOM/React 무의존) — campaign.missionData 로 기존 인카운터 config 만 해석한다.
  //   POOL/스케일/선택은 전부 결정론 → 같은 N 은 항상 같은 인카운터·배율(유닛 테스트 핀 고정).
  //
  // [72차 · d45 #4] 기록 스키마 확장 — { best } 단일 스칼라 → { best, byClass, lastRun }.
  //   migrateAbyss : 구세이브 백필(멱등). 구 { best:N } 은 best 유지 + byClass {} + lastRun null.
  //   recordAbyss  : 런 1회 기록(전체·클래스별 최고 갱신 + 직전 런). 순수(새 객체 반환).
  //   bestByClass  : 6클래스 리플레이 후크 — 클래스별 최고 웨이브 표(허브 심연 카드).
  // ==========================================================================

  function deps() {
    var w = (typeof window !== 'undefined') ? window : null;
    if (w && w.RPG_CAMPAIGN) return { CAMP: w.RPG_CAMPAIGN, CL: w.RPG_CLASSES };
    return { CAMP: require('./campaign.js'), CL: require('../data/classes.js') };
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

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

  // ---- [72차 · d45 #4] 심연 기록 스키마 { best, byClass, lastRun } ------------------
  //   ending.js 의 migrateEndings/recordEnding 선례와 동일 계약(멱등 백필 + 순수 기록).
  //   구세이브({best:N} 또는 abyss 자체 부재)는 무손실로 확장된다 — best 는 그대로 보존하고
  //   byClass 는 빈 표로 시작한다(어느 클래스로 낸 기록인지 구세이브가 알지 못하므로 날조하지 않는다).
  function migrateAbyss(abyss) {
    var a = (abyss && typeof abyss === 'object' && !Array.isArray(abyss)) ? clone(abyss) : {};
    if (typeof a.best !== 'number' || !isFinite(a.best) || a.best < 0) a.best = 0;
    if (!a.byClass || typeof a.byClass !== 'object' || Array.isArray(a.byClass)) a.byClass = {};
    // 클래스별 값 정규화 — 숫자 아닌/음수 항목 제거(오염 세이브 방어). best 는 전체 최고 상한을 유지.
    for (var k in a.byClass) {
      if (!Object.prototype.hasOwnProperty.call(a.byClass, k)) continue;
      var v = a.byClass[k];
      if (typeof v !== 'number' || !isFinite(v) || v <= 0) { delete a.byClass[k]; continue; }
      a.byClass[k] = Math.floor(v);
      if (a.byClass[k] > a.best) a.best = a.byClass[k];   // 불변식: best >= max(byClass)
    }
    var lr = a.lastRun;
    if (!lr || typeof lr !== 'object' || Array.isArray(lr) || typeof lr.wave !== 'number' || !isFinite(lr.wave)) a.lastRun = null;
    else a.lastRun = { classKey: lr.classKey || null, wave: Math.floor(lr.wave), cleared: !!lr.cleared };
    return a;
  }

  // 심연 런 1회 기록. wave = 그 런의 해당 웨이브, cleared = 그 웨이브를 돌파했는가.
  //   돌파(cleared)일 때만 최고 기록(전체·클래스별)을 갱신한다 — 패배 웨이브는 '완주'가 아니다.
  //   lastRun 은 승패와 무관하게 항상 갱신(직전 런 표시용). 순수 — 인자 무변경, 새 객체 반환.
  function recordAbyss(abyss, classKey, wave, cleared) {
    var a = migrateAbyss(abyss);
    var w = (typeof wave === 'number' && isFinite(wave)) ? Math.floor(wave) : 0;
    if (cleared && w > 0) {
      if (w > a.best) a.best = w;
      if (classKey && w > (a.byClass[classKey] || 0)) a.byClass[classKey] = w;
    }
    a.lastRun = { classKey: classKey || null, wave: w, cleared: !!cleared };
    return a;
  }

  // 6클래스 리플레이 후크 — 플레이어블 클래스 전량 × 최고 웨이브 표(미기록 0). 표시 순서 = PLAYABLE 고정.
  function bestByClass(abyss) {
    var a = migrateAbyss(abyss);
    var D = deps();
    var playable = (D.CL && D.CL.PLAYABLE) || ['CIPHER', 'BLADE'];
    return playable.map(function (k) {
      var b = a.byClass[k] || 0;
      return { classKey: k, best: b, played: b > 0 };
    });
  }

  var API = {
    POOL: POOL, waveScale: waveScale, poolIndex: poolIndex,
    wavePlan: wavePlan, waveEncounter: waveEncounter,
    migrateAbyss: migrateAbyss, recordAbyss: recordAbyss, bestByClass: bestByClass,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_ABYSS = API;
})();
