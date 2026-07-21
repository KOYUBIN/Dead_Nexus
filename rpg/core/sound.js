;(function () {
  'use strict';
  // ==========================================================================
  // core/sound.js — 경량 사운드 매니저 [v6.44 B1] (window 전역 window.RPG_SOUND)
  // ──────────────────────────────────────────────────────────────────────────
  // 표시층 전용 SFX 재생 계층. <audio> 엘리먼트 풀 방식 (Web Audio 미사용 →
  // decodeAudioData/fetch 없이 file:// 호환 · CSP 무관). 브라우저 autoplay 정책
  // 준수: 최초 사용자 제스처 전에는 무음(정책상 자연), 제스처 후 활성. 모든 재생
  // 실패는 무해(no-op) — 사운드는 순수 표시 장식이며 게임 로직/결정론에 무영향.
  //
  // 순수성: core/ 는 combat/·data/ grep 대상이 아니므로 DOM/Audio 접근 허용
  //   (loader.js·projection.js 와 동일 계층). combat/·data/ 는 사운드 코드 0 —
  //   엔진 순수성 유지 (전투 결정론 불변).
  // node 환경(유닛 테스트)에서 require 되어도 안전: window/Audio 부재 시 no-op 스텁.
  // ==========================================================================

  var LS_KEY = 'dn_rpg_sound';          // 'on' | 'off' (기본 on)
  var POOL_SIZE = 3;                    // 사운드별 동시 재생 풀 (연타/중첩 대비)
  var VOLUME = 0.55;                    // 전 SFX 공통 볼륨 (과하지 않게)

  // SFX 키 → 파일명 (rpg/assets/audio/*.ogg). LICENSE.md 표와 1:1.
  var FILES = {
    hit:     'hit.ogg',
    crit:    'crit.ogg',
    hack:    'hack.ogg',
    kill:    'kill.ogg',
    move:    'move.ogg',
    ui:      'ui.ogg',
    select:  'select.ogg',
    mission: 'mission.ogg',
    victory: 'victory.ogg',
    defeat:  'defeat.ogg',
    ending:  'ending.ogg',
    toggle:  'toggle.ogg'
  };

  var hasDOM   = (typeof window !== 'undefined' && typeof document !== 'undefined');
  var hasAudio = (hasDOM && typeof window.Audio !== 'undefined');

  // node/비브라우저: 무해 스텁만 노출하고 종료.
  if (!hasAudio) {
    var stub = {
      enabled: function () { return false; },
      setEnabled: function () {},
      toggle: function () { return false; },
      play: function () {},
      unlock: function () {},
      ready: false,
      FILES: FILES
    };
    if (typeof window !== 'undefined') window.RPG_SOUND = window.RPG_SOUND || stub;
    if (typeof module !== 'undefined' && module.exports) module.exports = stub;
    return;
  }

  // 오디오 디렉토리 = 이 페이지의 rpg 디렉토리 기준 (loader.js heal 과 동일 규칙).
  function baseDir() {
    var dir = location.pathname.replace(/index(\.html?)?$/, '');
    if (dir.charAt(dir.length - 1) !== '/') dir += '/';
    return dir + 'assets/audio/';
  }

  var enabled = readEnabled();   // localStorage 영속 (기본 ON)
  var ready = false;             // 최초 제스처 후 true (autoplay 언락)
  var pools = {};                // name → [HTMLAudioElement...]
  var rr = {};                   // name → round-robin 인덱스

  function readEnabled() {
    try {
      var v = window.localStorage.getItem(LS_KEY);
      return v === null ? true : (v === 'on');  // 기본 ON
    } catch (e) { return true; }
  }
  function writeEnabled(b) {
    try { window.localStorage.setItem(LS_KEY, b ? 'on' : 'off'); } catch (e) {}
  }

  function ensurePool(name) {
    if (pools[name]) return pools[name];
    var file = FILES[name];
    if (!file) return null;
    var arr = [];
    for (var i = 0; i < POOL_SIZE; i++) {
      var a = new window.Audio(baseDir() + file);
      a.preload = 'auto';
      a.volume = VOLUME;
      arr.push(a);
    }
    pools[name] = arr; rr[name] = 0;
    return arr;
  }

  // 최초 사용자 제스처에 언락 — 정책상 이때부터 재생 가능.
  function unlock() {
    if (ready) return;
    ready = true;
    detach();
  }
  function detach() {
    try {
      window.removeEventListener('pointerdown', unlock, true);
      window.removeEventListener('keydown', unlock, true);
      window.removeEventListener('touchstart', unlock, true);
    } catch (e) {}
  }
  try {
    window.addEventListener('pointerdown', unlock, true);
    window.addEventListener('keydown', unlock, true);
    window.addEventListener('touchstart', unlock, true);
  } catch (e) {}

  // SFX 재생 — 비활성/미언락/미지원이면 무해 no-op. 실패(Promise reject)도 무시.
  function play(name) {
    if (!enabled || !ready) return;
    var arr = ensurePool(name);
    if (!arr) return;
    var i = rr[name] % arr.length; rr[name] = (rr[name] + 1) % arr.length;
    var a = arr[i];
    try {
      a.currentTime = 0;
      var pr = a.play();
      if (pr && typeof pr.catch === 'function') pr.catch(function () {}); // autoplay/decoding 실패 무해
    } catch (e) { /* 무해 */ }
  }

  function setEnabled(b) {
    enabled = !!b;
    writeEnabled(enabled);
  }
  function toggle() {
    setEnabled(!enabled);
    if (enabled) play('toggle');   // ON 전환 시 청각 피드백 (이미 제스처 후 → 재생됨)
    return enabled;
  }

  window.RPG_SOUND = {
    enabled: function () { return enabled; },
    setEnabled: setEnabled,
    toggle: toggle,
    play: play,
    unlock: unlock,
    get ready() { return ready; },
    FILES: FILES
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = window.RPG_SOUND;
})();
