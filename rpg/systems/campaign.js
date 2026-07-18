;(function () {
  'use strict';
  // ==========================================================================
  // systems/campaign.js — 미션 레지스트리 · 허브 라우터 · 보상 · 위협 게이지 [G10]
  // ──────────────────────────────────────────────────────────────────────────
  // 순수 함수 (DOM/React 무의존).
  //   MISSIONS     : 미션 레지스트리 (메인 8 + 사이드 8 = 16). id·kind·chapter·
  //                  order·global(전역명)·module(require 경로)·unlock(해금조건).
  //   missionData  : id → MISSION 데이터 객체 (window 전역 or require 해석)
  //   isUnlocked   : 해금 조건(missionsDone/flagsSet) 판정 — 해금 그래프 배선
  //   applyRewards : 챕터 효과 정산. ★최초 클리어=전액+챕터효과+해금 /
  //                  재클리어=₵·렙 50%·karma 0·챕터효과/해금 없음 (세이브 missionsDone 기록)
  //   threatGauge  : 중앙 위협/노출 게이지 [G10, 각색 raidThreshold + docs/07 §8 Heat]
  //   HUB_NODES    : 허브 4노드 (미션보드·시트·크루·상점)
  // ==========================================================================

  function getCharacter() {
    if (typeof window !== 'undefined' && window.RPG_CHARACTER) return window.RPG_CHARACTER;
    return require('./character.js');
  }
  function getAbilities() {
    if (typeof window !== 'undefined' && window.RPG_ABILITIES) return window.RPG_ABILITIES;
    return require('../data/abilities.js');
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ==========================================================================
  // 미션 레지스트리 — 전 미션 등록 (통합 배선 정본). 미션 파일의 unlock 메타와 일치.
  //   kind    : 'main'(챕터 체인) | 'side'(사이드 보드)
  //   chapter : 메인 체인 순번(1..8) / side 는 order 로 정렬
  //   global  : 브라우저 window 전역명 (미션 파일이 등록)
  //   module  : node require 경로 (campaign.js 기준 상대)
  //   unlock  : null = 상시 개방 / { missionsDone:[...], flagsSet:[...] } (AND 조건)
  // ==========================================================================
  var MISSIONS = [
    { id: 'ch01-first-blood',       kind: 'main', chapter: 1, order: 1,
      global: 'RPG_MISSION_CH01', module: '../data/missions/ch01-first-blood.js', unlock: null },
    { id: 'ch02-insider-game',      kind: 'main', chapter: 2, order: 2,
      global: 'RPG_MISSION_CH02', module: '../data/missions/ch02-insider-game.js',
      unlock: { missionsDone: ['ch01-first-blood'] } },
    { id: 'ch03-martial-night',     kind: 'main', chapter: 3, order: 3,
      global: 'RPG_MISSION_CH03', module: '../data/missions/ch03-martial-night.js',
      unlock: { missionsDone: ['ch02-insider-game'] } },
    { id: 'ch04-price-of-splice',   kind: 'main', chapter: 4, order: 4,
      global: 'RPG_MISSION_CH04', module: '../data/missions/ch04-price-of-splice.js',
      unlock: { missionsDone: ['ch03-martial-night'] } },
    { id: 'ch05-mesh-ghost',        kind: 'main', chapter: 5, order: 5,
      global: 'RPG_MISSION_CH05', module: '../data/missions/ch05-mesh-ghost.js',
      unlock: { missionsDone: ['ch04-price-of-splice'] } },
    { id: 'ch06-bloc-acquisition',  kind: 'main', chapter: 6, order: 6,
      global: 'RPG_MISSION_CH06', module: '../data/missions/ch06-bloc-acquisition.js',
      unlock: { missionsDone: ['ch05-mesh-ghost'] } },
    { id: 'ch07-heart-of-city',     kind: 'main', chapter: 7, order: 7,
      global: 'RPG_MISSION_CH07', module: '../data/missions/ch07-heart-of-city.js',
      unlock: { missionsDone: ['ch06-bloc-acquisition'] } },
    { id: 'ch08-zero-day',          kind: 'main', chapter: 8, order: 8,
      global: 'RPG_MISSION_CH08', module: '../data/missions/ch08-zero-day.js',
      unlock: { missionsDone: ['ch07-heart-of-city'] } },

    // ── 사이드 보드 (해금 조건 충족 시 노출) ──
    { id: 'side-01-traitor-contract', kind: 'side', chapter: null, order: 11,
      global: 'RPG_MISSION_SIDE01_TRAITOR_CONTRACT', module: '../data/missions/side-01-traitor-contract.js',
      unlock: { missionsDone: ['ch01-first-blood'] } },
    { id: 'side-02-corp-breach',      kind: 'side', chapter: null, order: 12,
      global: 'RPG_MISSION_SIDE02_CORP_BREACH', module: '../data/missions/side-02-corp-breach.js',
      unlock: { missionsDone: ['ch02-insider-game'] } },
    { id: 'side-05-informant-hit',    kind: 'side', chapter: null, order: 13,
      global: 'RPG_MISSION_SIDE05_INFORMANT_HIT', module: '../data/missions/side-05-informant-hit.js',
      unlock: { missionsDone: ['ch02-insider-game'] } },
    { id: 'side-03-chemical-raid',    kind: 'side', chapter: null, order: 14,
      global: 'RPG_MISSION_SIDE03_CHEMICAL_RAID', module: '../data/missions/side-03-chemical-raid.js',
      unlock: { missionsDone: ['ch03-martial-night'] } },
    { id: 'side-08-harbor-run',       kind: 'side', chapter: null, order: 15,
      global: 'RPG_MISSION_SIDE08_HARBOR_RUN', module: '../data/missions/side-08-harbor-run.js',
      unlock: { missionsDone: ['ch03-martial-night'] } },
    { id: 'side-04-medbay-heist',     kind: 'side', chapter: null, order: 16,
      global: 'RPG_MISSION_SIDE04_MEDBAY_HEIST', module: '../data/missions/side-04-medbay-heist.js',
      unlock: { missionsDone: ['ch04-price-of-splice'] } },
    { id: 'side-06-rival-duel',       kind: 'side', chapter: null, order: 17,
      global: 'RPG_MISSION_SIDE06_RIVAL_DUEL', module: '../data/missions/side-06-rival-duel.js',
      unlock: { missionsDone: ['ch05-mesh-ghost'], flagsSet: ['heroChoice'] } },
    { id: 'side-07-server-zero',      kind: 'side', chapter: null, order: 18,
      global: 'RPG_MISSION_SIDE07_SERVER_ZERO', module: '../data/missions/side-07-server-zero.js',
      unlock: { missionsDone: ['ch06-bloc-acquisition'] } },
  ];

  var BY_ID = {};
  for (var mi = 0; mi < MISSIONS.length; mi++) BY_ID[MISSIONS[mi].id] = MISSIONS[mi];

  function missionById(id) { return BY_ID[id] || null; }

  // id → MISSION 데이터 객체. 브라우저=window 전역, node=require. 없으면 null.
  function missionData(id) {
    var e = BY_ID[id];
    if (!e) return null;
    if (typeof window !== 'undefined' && window[e.global] && window[e.global].MISSION) {
      return window[e.global].MISSION;
    }
    if (typeof require !== 'undefined') {
      try { return require(e.module).MISSION; } catch (x) { return null; }
    }
    return null;
  }

  // 해금 판정 — unlock.missionsDone(전부 완료) AND unlock.flagsSet(전부 참).
  function isUnlocked(entry, save) {
    if (!entry) return false;
    var u = entry.unlock;
    if (!u) return true;
    var done = (save && save.missionsDone) || [];
    var flags = (save && save.flags) || {};
    var i;
    if (u.missionsDone) for (i = 0; i < u.missionsDone.length; i++) {
      if (done.indexOf(u.missionsDone[i]) < 0) return false;
    }
    if (u.flagsSet) for (i = 0; i < u.flagsSet.length; i++) {
      if (!flags[u.flagsSet[i]]) return false;
    }
    return true;
  }

  function isCleared(id, save) { return ((save && save.missionsDone) || []).indexOf(id) >= 0; }

  // 잠금 힌트 문자열 (미해금 사이드 = ??? + 힌트). 선행 미션 제목/플래그 요구를 서술.
  function unlockHint(entry) {
    var u = entry && entry.unlock;
    if (!u) return '상시 개방';
    var parts = [];
    if (u.missionsDone) {
      var titles = u.missionsDone.map(function (id) {
        var m = BY_ID[id]; return m ? shortTitle(m) : id;
      });
      parts.push(titles.join(' · ') + ' 클리어');
    }
    if (u.flagsSet) {
      var fl = u.flagsSet.map(function (f) { return FLAG_HINT[f] || ('플래그 ' + f); });
      parts.push(fl.join(' · '));
    }
    return '요구: ' + parts.join(' + ');
  }
  var FLAG_HINT = { heroChoice: '영웅/유령 선택 완료' };
  function shortTitle(entry) {
    if (entry.chapter) return 'CH' + (entry.chapter < 10 ? '0' + entry.chapter : entry.chapter);
    return entry.id;
  }

  // 진행 상태 요약 — 허브/유닛 테스트가 소비. mains/sides 정렬 + 해금·클리어 플래그.
  function boardState(save) {
    var mains = [], sides = [];
    for (var i = 0; i < MISSIONS.length; i++) {
      var e = MISSIONS[i];
      var row = { id: e.id, kind: e.kind, chapter: e.chapter, order: e.order,
        unlocked: isUnlocked(e, save), cleared: isCleared(e.id, save), hint: unlockHint(e) };
      if (e.kind === 'main') mains.push(row); else sides.push(row);
    }
    mains.sort(function (a, b) { return a.order - b.order; });
    sides.sort(function (a, b) { return a.order - b.order; });
    // 현재 진행 챕터 = 첫 미클리어 메인 (강조용).
    var current = null;
    for (var j = 0; j < mains.length; j++) { if (mains[j].unlocked && !mains[j].cleared) { current = mains[j].id; break; } }
    return { mains: mains, sides: sides, current: current };
  }

  var HUB_NODES = [
    { key: 'missions', icon: '🎯', label: '미션 보드', stub: false },
    { key: 'sheet',    icon: '📋', label: '캐릭터 시트', stub: false },
    { key: 'shop',     icon: '🛒', label: '상점 / 의료', stub: true, note: 'HELIX 회복 계승 (Stage 3)' },
    { key: 'crew',     icon: '👥', label: '크루 / 로스터', stub: true, note: '후속 로스터 (Stage 2)' },
  ];

  // ==========================================================================
  // 미션 보상 정산. save-state(character, heat, heatCap, flags, missionsDone)에 병합.
  //   ★최초 클리어  : 전액(렙/karma/₵) + 챕터효과(heatCapDelta) + 해금(unlocks).
  //   재클리어      : 렙·₵ 50%(내림) · karma 0 · 챕터효과/해금 없음. (missionsDone 기록)
  //   반환 { character, heat, heatCap, missionsDone, log, firstClear }.
  // ==========================================================================
  function applyRewards(saveState, mission) {
    var CH = getCharacter();
    var r = mission.rewards;
    var log = [];
    var ch = clone(saveState.character);
    var md = (saveState.missionsDone || []).slice();
    var firstClear = md.indexOf(mission.id) < 0;

    var repGain, karmaGain, nuyenGain, heatCapDelta;
    if (firstClear) {
      repGain = r.rep; karmaGain = r.karma; nuyenGain = r.nuyen; heatCapDelta = (r.heatCapDelta || 0);
    } else {
      repGain = Math.floor(r.rep / 2); karmaGain = 0; nuyenGain = Math.floor(r.nuyen / 2); heatCapDelta = 0;
      log.push('↻ 재클리어 — 축소 보상 (렙·₵ 50%, karma 0, 챕터 효과·해금 제외)');
    }
    ch.rep += repGain; log.push('렙 +' + repGain + ' (→' + ch.rep + ')');
    ch.karma += karmaGain; log.push('karma +' + karmaGain + ' (→' + ch.karma + ')');
    ch.nuyen += nuyenGain; log.push('₵ +' + nuyenGain + ' (→' + ch.nuyen + ')');
    var heatCap = (saveState.heatCap || 10) + heatCapDelta;
    if (heatCapDelta) log.push('공권력 트랙 최대치 +' + heatCapDelta + ' (→' + heatCap + ')');

    // 보상 해금은 최초 클리어에만. 클래스별 시그니처로 치환 [계승 chapter-01 봉투 A].
    //   CIPHER → BACKDOOR, BLADE → VENDETTA (UNLOCK_BY_CLASS 매핑).
    if (firstClear && r.unlocks) {
      var AB = getAbilities();
      var byClass = (AB.UNLOCK_BY_CLASS && AB.UNLOCK_BY_CLASS[ch.classKey]) || null;
      for (var i = 0; i < r.unlocks.length; i++) {
        var unlockKey = (r.unlocks[i] === 'BACKDOOR' && byClass) ? byClass : r.unlocks[i];
        ch = CH.unlockAbility(ch, unlockKey);
        log.push(unlockKey + ' 해금');
      }
    }
    if (md.indexOf(mission.id) < 0) md.push(mission.id);
    return {
      character: ch, heat: saveState.heat || 0, heatCap: heatCap,
      missionsDone: md, log: log, firstClear: firstClear,
    };
  }

  // [G10] 위협/노출 게이지: 노출 이벤트마다 +1, 임계(cap)에서 경보. 슬라이스는 표시만.
  function threatGauge(current, delta, cap) {
    var v = Math.max(0, (current || 0) + (delta || 0));
    return { value: v, cap: cap || 10, alarm: v >= (cap || 10) };
  }

  var API = {
    MISSIONS: MISSIONS, HUB_NODES: HUB_NODES,
    missionById: missionById, missionData: missionData,
    isUnlocked: isUnlocked, isCleared: isCleared, unlockHint: unlockHint, boardState: boardState,
    applyRewards: applyRewards, threatGauge: threatGauge,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_CAMPAIGN = API;
})();
