;(function () {
  'use strict';
  // ==========================================================================
  // state/save.js — localStorage 세이브 + base64 문자열 export/import [G11]
  // ──────────────────────────────────────────────────────────────────────────
  // §5.3 안전판(슬라이스부터 필수): 일부 브라우저가 file:// 오리진 localStorage 를
  // 비움 → 세이브 문자열 export/import 로 복사·붙여넣기·다운로드 복원.
  // version 필드로 스키마 마이그레이션 대비. 서버 0, 오프라인 OK.
  // ==========================================================================

  var KEY = 'dead_nexus_rpg_save_v1';
  var CURRENT_VERSION = 1;

  // [72차 · d45 #4] 심연 기록 마이그레이션 위임 대상. 미로드 환경에선 null → 최소 백필 폴백.
  function getAbyss() {
    if (typeof window !== 'undefined' && window.RPG_ABYSS) return window.RPG_ABYSS;
    try { return require('../systems/abyss.js'); } catch (e) { return null; }
  }

  function b64encode(str) {
    if (typeof btoa !== 'undefined') return btoa(unescape(encodeURIComponent(str)));
    return Buffer.from(str, 'utf8').toString('base64'); // node
  }
  function b64decode(b64) {
    if (typeof atob !== 'undefined') return decodeURIComponent(escape(atob(b64)));
    return Buffer.from(b64, 'base64').toString('utf8'); // node
  }

  // 세이브 → base64 문자열 (export).
  function exportString(save) { return b64encode(JSON.stringify(save)); }

  // base64 문자열 → 세이브 (import). 실패 시 { ok:false }.
  function importString(str) {
    try {
      var save = JSON.parse(b64decode(String(str).trim()));
      var migrated = migrate(save);
      return { ok: true, save: migrated };
    } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
  }

  // 스키마 마이그레이션 — 레거시(챕터1 전용 시절) 세이브를 무손실 보정.
  //   멱등(idempotent): 신 세이브에 재적용해도 no-op. version 유지(v1 스키마 확장).
  //   ① missionsDone/flags/openingsSeen 필드 보장(누락 시 기본값).
  //   ② firstBlood 플래그 → ch01 클리어로 추론(챕터1만 있던 시절 missionsDone 미기록 대비).
  //   ③ 클리어한 미션의 오프닝은 이미 열람한 것으로 간주(openingsSeen 병합).
  //   ④ [B1] 장비 경제 필드 보장 — character.equipment/gearOwned · save.intel (구세이브 하위 호환).
  function migrate(save) {
    if (!save || typeof save !== 'object' || Array.isArray(save)) throw new Error('세이브 형식 오류'); // v6.53: 배열 거부 (abyss.js Array.isArray 방어 선례 — 배열이면 백필 속성이 재직렬화에서 전부 소실)
    if (save.version == null) save.version = CURRENT_VERSION;
    if (!save.flags || typeof save.flags !== 'object') save.flags = {};
    if (!Array.isArray(save.missionsDone)) save.missionsDone = [];
    // [B1] 장비 경제 스키마 백필 (멱등). 구세이브엔 equipment/gearOwned/intel 없음 → 무장비 기본.
    if (save.character && typeof save.character === 'object') {
      var eqp = save.character.equipment;
      if (!eqp || typeof eqp !== 'object') save.character.equipment = { weapon: null, cyberware: null };
      else { if (!('weapon' in eqp)) eqp.weapon = null; if (!('cyberware' in eqp)) eqp.cyberware = null; }
      if (!Array.isArray(save.character.gearOwned)) save.character.gearOwned = [];
    }
    if (!save.intel || typeof save.intel !== 'object') save.intel = {};
    // [3차 발굴 F3] 공권력(Heat) 트랙 백필(멱등) — 구세이브 heat/heatCap 부재 시 기본값(0/10),
    //   음수 방어 + cap 클램프(허브 게이지 "96/10" 류 초과 표기 원천 차단).
    if (typeof save.heat !== 'number' || !isFinite(save.heat)) save.heat = 0;
    if (typeof save.heatCap !== 'number' || !isFinite(save.heatCap) || save.heatCap <= 0) save.heatCap = 10;
    if (save.heat < 0) save.heat = 0;
    if (save.heat > save.heatCap) save.heat = save.heatCap;
    // [57차] 엔딩 기록 스키마 백필 (멱등). 구세이브엔 endings 없음 → 빈 기록(회차 0).
    //   endings = { seen:{key:count}, byClass:{CLS:true}, runs:N }. 회차 리셋 시에도 영속.
    if (!save.endings || typeof save.endings !== 'object') save.endings = { seen: {}, byClass: {}, runs: 0, capstone: 0, capstoneByClass: {} };
    else {
      if (!save.endings.seen || typeof save.endings.seen !== 'object') save.endings.seen = {};
      if (!save.endings.byClass || typeof save.endings.byClass !== 'object') save.endings.byClass = {};
      if (typeof save.endings.runs !== 'number' || !isFinite(save.endings.runs)) save.endings.runs = 0;
      // [v6.44] 캡스톤 기록 백필(멱등) — 구세이브엔 capstone/capstoneByClass 없음 → 0/{}.
      if (typeof save.endings.capstone !== 'number' || !isFinite(save.endings.capstone)) save.endings.capstone = 0;
      if (!save.endings.capstoneByClass || typeof save.endings.capstoneByClass !== 'object') save.endings.capstoneByClass = {};
    }
    // [v6.44 · 과제 A1] 심연 프로토콜 최고 웨이브 기록 백필(멱등) — 구세이브엔 abyss 없음 → best 0.
    //   [72차 · d45 #4] 스키마 확장 { best } → { best, byClass, lastRun }. 백필 규칙은
    //   systems/abyss.migrateAbyss 단일 출처(멱등·구세이브 무손상: best 보존 · byClass {} · lastRun null).
    //   abyss.js 미로드 환경(격리 import 테스트)에선 최소 백필로 폴백 — 구 계약 그대로.
    var ABX = getAbyss();
    if (ABX && ABX.migrateAbyss) save.abyss = ABX.migrateAbyss(save.abyss);
    else if (!save.abyss || typeof save.abyss !== 'object') save.abyss = { best: 0, byClass: {}, lastRun: null };
    else if (typeof save.abyss.best !== 'number' || !isFinite(save.abyss.best)) save.abyss.best = 0;
    // firstBlood(레거시 챕터1 클리어 플래그) → ch01 클리어 기록으로 추론.
    if (save.flags.firstBlood && save.missionsDone.indexOf('ch01-first-blood') < 0) {
      save.missionsDone.push('ch01-first-blood');
    }
    // 오프닝 열람 기록 — 클리어한 미션은 이미 오프닝을 본 것으로 병합(중복 열람 방지).
    if (!Array.isArray(save.openingsSeen)) save.openingsSeen = [];
    for (var i = 0; i < save.missionsDone.length; i++) {
      if (save.openingsSeen.indexOf(save.missionsDone[i]) < 0) save.openingsSeen.push(save.missionsDone[i]);
    }
    return save;
  }

  function hasLocal() { try { return typeof localStorage !== 'undefined' && localStorage !== null; } catch (e) { return false; } }

  function saveLocal(save) {
    if (!hasLocal()) return false;
    try { localStorage.setItem(KEY, JSON.stringify(save)); return true; } catch (e) { return false; }
  }
  function loadLocal() {
    if (!hasLocal()) return null;
    try { var raw = localStorage.getItem(KEY); if (!raw) return null; return migrate(JSON.parse(raw)); } catch (e) { return null; }
  }
  function clearLocal() { if (hasLocal()) { try { localStorage.removeItem(KEY); } catch (e) {} } }

  var API = {
    KEY: KEY, CURRENT_VERSION: CURRENT_VERSION,
    exportString: exportString, importString: importString, migrate: migrate,
    saveLocal: saveLocal, loadLocal: loadLocal, clearLocal: clearLocal, hasLocal: hasLocal,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_SAVE = API;
})();
