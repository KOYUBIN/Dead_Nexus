'use strict';
// ============================================================================
// legacy_module.js — 레거시 캠페인 영속 Stage 1 (docs/12 "ASH & SIGNAL")
//   챕터 진행을 브라우저 localStorage('dn_legacy_v1')에 영속화하고,
//   Chapter 1 "First Blood" 아크(cards/legacy/chapter-01-first-blood.md)를
//   실플레이에 연결한다. euro_module / lore_module 와 동일한 배선 패턴:
//     · <script src> 로드 + DOMContentLoaded 자가복구 heal 로더 등록(index.html)
//     · 전역은 window 노출, 소비처는 typeof 가드로 미로드 시 무해
//     · 모든 localStorage 접근은 try/catch 가드 — 헤드리스(sim-e2e)·프라이빗
//       모드·스토리지 차단 브라우저에서도 예외 없이 기본값으로 되돌아간다.
//
//   영속 스키마 dn_legacy_v1 = {
//     chaptersUnlocked: number[],              // 해금된 챕터 번호 (예: [1])
//     chapterProgress:  { [n]: {unlockedAt} }, // 챕터별 진행 메타
//     cityScars:        [{ bloc, ts }],        // 도시 흉터 기록 (docs/22 정체성)
//   }
//   * 게임 로직 무변경 원칙: 이 모듈은 순수 영속·조회 계층이다. 게임 규칙에
//     주는 유일한 영향은 흉터(cityScar)로, initGame 이 legacyActiveScar()를
//     읽어 시작 주가 -1 을 적용할 때뿐이다(챕터 1 해금 이후에만 활성).
// ============================================================================
(function (glob) {

  var LEGACY_KEY = 'dn_legacy_v1';
  var TOTAL_CHAPTERS = 8;

  // localStorage 가용성 — 헤드리스/차단 환경에서 접근 자체가 던질 수 있어 가드.
  function hasStorage() {
    try { return (typeof localStorage !== 'undefined') && localStorage != null; }
    catch (e) { return false; }
  }

  function defaultState() {
    return { chaptersUnlocked: [], chapterProgress: {}, cityScars: [] };
  }

  // 저장된 값을 방어적으로 정규화해 로드 (손상/구버전 값도 기본형으로 흡수).
  function legacyLoad() {
    if (!hasStorage()) return defaultState();
    try {
      var raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) return defaultState();
      var obj = JSON.parse(raw) || {};
      return {
        chaptersUnlocked: Array.isArray(obj.chaptersUnlocked) ? obj.chaptersUnlocked.slice() : [],
        chapterProgress: (obj.chapterProgress && typeof obj.chapterProgress === 'object') ? obj.chapterProgress : {},
        cityScars: Array.isArray(obj.cityScars) ? obj.cityScars.slice() : [],
      };
    } catch (e) { return defaultState(); }
  }

  function legacySave(stateObj) {
    if (!hasStorage()) return false;
    try {
      localStorage.setItem(LEGACY_KEY, JSON.stringify(stateObj || defaultState()));
      return true;
    } catch (e) { return false; }
  }

  function legacyReset() {
    if (!hasStorage()) return false;
    try { localStorage.removeItem(LEGACY_KEY); return true; } catch (e) { return false; }
  }

  // ---- 챕터 원전 메타 (cards/legacy/chapter-01-first-blood.md 발췌·요약) -------
  //   story: 오프닝 내러티브 + 챕터 개요에서 원문 그대로 발췌한 3문장 (창작 금지).
  var CHAPTER_META = {
    1: {
      id: 1,
      envelope: 'A',
      title: 'First Blood',
      titleKo: '첫 번째 피',
      unlockCond: '최초 레이드 발생',
      story: [
        'VANTA 금융가 구역의 서브 서버가 해킹당했다. 데이터 유출량 2.7테라바이트, 공격자 신원 불명.',
        '도시가 처음으로 한 가지를 깨달았다 — 블록은 불사신이 아니다.',
        '최초의 레이드가 성공한다. 지금까지의 암묵적 균형이 깨지고, 이 챕터부터 공격과 방어의 시대가 시작된다.',
      ],
    },
  };

  function legacyChapterMeta(n) { return CHAPTER_META[n] || null; }
  function legacyTotalChapters() { return TOTAL_CHAPTERS; }

  // 챕터 1 해금 (봉투 A). 반환 { unlocked, newly, state }.
  function legacyUnlockChapter1(stateObj) {
    var st = stateObj || legacyLoad();
    if (st.chaptersUnlocked.indexOf(1) !== -1) return { unlocked: true, newly: false, state: st };
    st.chaptersUnlocked = st.chaptersUnlocked.concat([1]);
    st.chapterProgress = Object.assign({}, st.chapterProgress, { 1: { unlockedAt: Date.now() } });
    return { unlocked: true, newly: true, state: st };
  }

  // 게임 종료 결과를 캠페인에 반영 (영속 저장 포함).
  //   gameResult = { anyRaid: bool, topRaidBloc: string|null }
  //     anyRaid     — 이번 게임에서 레이드가 최소 1회 발생 → 챕터 1 해금 트리거
  //     topRaidBloc — 이번 게임 최다 레이드 피해 블록 → 다음 게임 도시 흉터
  //   반환 { state, chapter1Newly }. chapter1Newly=true 면 이번 판이 해금 순간.
  function legacyRecordGame(gameResult) {
    var st = legacyLoad();
    var chapter1Newly = false;
    if (gameResult && gameResult.anyRaid) {
      var r = legacyUnlockChapter1(st);
      st = r.state;
      chapter1Newly = r.newly;
    }
    // 흉터는 챕터 1 해금 이후에만 기록 (해금 판부터 다음 판에 흉터를 남긴다).
    // Stage 1 은 최신 1건만 유지 — 다음 게임 시작 주가 -1 의 근거.
    if (st.chaptersUnlocked.indexOf(1) !== -1 && gameResult && gameResult.topRaidBloc) {
      st.cityScars = [{ bloc: gameResult.topRaidBloc, ts: Date.now() }];
    }
    legacySave(st);
    return { state: st, chapter1Newly: chapter1Newly };
  }

  // 다음 게임 시작 시 적용할 활성 흉터 — { bloc } 또는 null.
  //   챕터 1 미해금 시엔 항상 null (흉터 미발동) — 헤드리스에서도 안전.
  function legacyActiveScar() {
    var st = legacyLoad();
    if (st.chaptersUnlocked.indexOf(1) === -1) return null;
    if (!st.cityScars || !st.cityScars.length) return null;
    var last = st.cityScars[st.cityScars.length - 1];
    return (last && last.bloc) ? { bloc: last.bloc } : null;
  }

  glob.LEGACY_KEY = LEGACY_KEY;
  glob.legacyLoad = legacyLoad;
  glob.legacySave = legacySave;
  glob.legacyReset = legacyReset;
  glob.legacyUnlockChapter1 = legacyUnlockChapter1;
  glob.legacyRecordGame = legacyRecordGame;
  glob.legacyActiveScar = legacyActiveScar;
  glob.legacyChapterMeta = legacyChapterMeta;
  glob.legacyTotalChapters = legacyTotalChapters;

})(typeof window !== 'undefined' ? window : this);
