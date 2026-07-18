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
  function migrate(save) {
    if (!save || typeof save !== 'object') throw new Error('세이브 형식 오류');
    if (save.version == null) save.version = CURRENT_VERSION;
    if (!save.flags || typeof save.flags !== 'object') save.flags = {};
    if (!Array.isArray(save.missionsDone)) save.missionsDone = [];
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
