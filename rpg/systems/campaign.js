;(function () {
  'use strict';
  // ==========================================================================
  // systems/campaign.js — 허브·미션 라우터·보상·위협 게이지 [G10]
  // ──────────────────────────────────────────────────────────────────────────
  // 순수 함수 (DOM/React 무의존).
  //   applyRewards : 챕터 효과 정산 [계승 chapter-01 §챕터 효과]
  //                  렙+3 · 공권력 최대치+1 · karma · ₵ · BACKDOOR 해금
  //   threatGauge  : 중앙 위협/노출 게이지 [G10, 각색 raidThreshold + docs/07 §8 Heat]
  //   HUB_NODES    : 허브 4노드 (미션보드·상점·크루·시트) — 상점/크루 스텁
  // ==========================================================================

  function getCharacter() {
    if (typeof window !== 'undefined' && window.RPG_CHARACTER) return window.RPG_CHARACTER;
    return require('./character.js');
  }
  function getAbilities() {
    if (typeof window !== 'undefined' && window.RPG_ABILITIES) return window.RPG_ABILITIES;
    return require('../data/abilities.js');
  }

  var HUB_NODES = [
    { key: 'missions', icon: '🎯', label: '미션 보드', stub: false },
    { key: 'sheet',    icon: '📋', label: '캐릭터 시트', stub: false },
    { key: 'shop',     icon: '🛒', label: '상점 / 의료', stub: true, note: 'HELIX 회복 계승 (Stage 2)' },
    { key: 'crew',     icon: '👥', label: '크루 / 로스터', stub: true, note: '후속 로스터 (Stage 2)' },
  ];

  // 미션 보상 정산. save-state(character, heat, heatCap, flags, missionsDone)에 병합.
  //   반환 { character, heat, heatCap, nuyen, missionsDone, log }.
  function applyRewards(saveState, mission) {
    var CH = getCharacter();
    var r = mission.rewards;
    var log = [];
    var ch = JSON.parse(JSON.stringify(saveState.character));
    ch.rep += r.rep; log.push('렙 +' + r.rep + ' (→' + ch.rep + ')');
    ch.karma += r.karma; log.push('karma +' + r.karma + ' (→' + ch.karma + ')');
    ch.nuyen += r.nuyen; log.push('₵ +' + r.nuyen + ' (→' + ch.nuyen + ')');
    var heatCap = (saveState.heatCap || 10) + (r.heatCapDelta || 0);
    if (r.heatCapDelta) log.push('공권력 트랙 최대치 +' + r.heatCapDelta + ' (→' + heatCap + ')');
    // 보상 해금은 클래스별 시그니처로 치환 [계승 chapter-01 봉투 A / blade.md 레거시 해금].
    //   CIPHER → BACKDOOR, BLADE → VENDETTA (KIT/UNLOCK_BY_CLASS 매핑).
    if (r.unlocks) {
      var AB = getAbilities();
      var byClass = (AB.UNLOCK_BY_CLASS && AB.UNLOCK_BY_CLASS[ch.classKey]) || null;
      for (var i = 0; i < r.unlocks.length; i++) {
        var unlockKey = (r.unlocks[i] === 'BACKDOOR' && byClass) ? byClass : r.unlocks[i];
        ch = CH.unlockAbility(ch, unlockKey);
        log.push(unlockKey + ' 해금');
      }
    }
    var md = (saveState.missionsDone || []).slice();
    if (md.indexOf(mission.id) < 0) md.push(mission.id);
    return {
      character: ch, heat: saveState.heat || 0, heatCap: heatCap,
      missionsDone: md, log: log,
    };
  }

  // [G10] 위협/노출 게이지: 노출 이벤트마다 +1, 임계(cap)에서 경보. 슬라이스는 표시만.
  function threatGauge(current, delta, cap) {
    var v = Math.max(0, (current || 0) + (delta || 0));
    return { value: v, cap: cap || 10, alarm: v >= (cap || 10) };
  }

  var API = { HUB_NODES: HUB_NODES, applyRewards: applyRewards, threatGauge: threatGauge };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_CAMPAIGN = API;
})();
