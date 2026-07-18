'use strict';
// ============================================================================
// legacy_module.js — 레거시 캠페인 영속 Stage 1·2 (docs/12 "ASH & SIGNAL")
//   챕터 진행을 브라우저 localStorage('dn_legacy_v1')에 영속화하고,
//   Chapter 1 "First Blood"(cards/legacy/chapter-01-first-blood.md) +
//   Chapter 2 "Insider Game"(cards/legacy/chapter-02-insider-game.md) 아크를
//   실플레이에 연결한다. euro_module / lore_module 와 동일한 배선 패턴:
//     · <script src> 로드 + DOMContentLoaded 자가복구 heal 로더 등록(index.html)
//     · 전역은 window 노출, 소비처는 typeof 가드로 미로드 시 무해
//     · 모든 localStorage 접근은 try/catch 가드 — 헤드리스(sim-e2e)·프라이빗
//       모드·스토리지 차단 브라우저에서도 예외 없이 기본값으로 되돌아간다.
//
//   영속 스키마 dn_legacy_v1 = {
//     chaptersUnlocked: number[],                    // 해금된 챕터 번호 (예: [1,2])
//     chapterProgress:  { [n]: {unlockedAt} },       // 챕터별 진행 메타
//     cityScars:        [{ bloc, kind, ts }],        // 도시 흉터 기록 (docs/22 정체성)
//   }                                                //   kind: 'raid'(ch1) | 'prey'(ch2 M&A 표적)
//   * 게임 로직 무변경 원칙: 이 모듈은 순수 영속·조회 계층이다. 게임 규칙에
//     주는 유일한 영향은 단일 흉터 채널(cityScar)로, initGame 이 legacyActiveScar()를
//     읽어 시작 주가 -1 을 적용할 때뿐이다. Stage 2 도 같은 절제 유지 — 흉터를 새로
//     늘리지 않고, 챕터 2 해금 후엔 같은 -1 흉터를 M&A 표적(PREY) 블록으로도 발원시킨다
//     (챕터 1 레이드 최다 피격 = 'raid', 챕터 2 M&A 표적 = 'prey'; 흉터는 ch1|ch2 중
//     하나라도 해금돼야 활성).
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

  // ---- 챕터 원전 메타 (cards/legacy/chapter-0N-*.md 오프닝 내러티브·챕터 개요 발췌) ----
  //   story: 원문 그대로 발췌·압축한 3문장 (창작 금지). 봉투 내용물(타일·카드·스티커·
  //   시스템)은 디지털 매체에 엔진 시스템이 없어 미배선(docs/22: 물리 레거시 봉투는 폐기,
  //   캠페인 서사만 디지털로) — 배선은 스토리 발췌 + 해금 트리거 + 단일 흉터에 한정.
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
    2: {
      id: 2,
      envelope: 'B',
      title: 'Insider Game',
      titleKo: '내부자 게임',
      unlockCond: '최초 M&A 선언',
      story: [
        '"VANTA-AXIOM 전략적 제휴" — 뉴스에는 그렇게 떴다. 실상은 AXIOM이 VANTA 지분을 31% 확보한 사건이었다.',
        '도시가 두 번째로 깨달은 사실 — 블록끼리도 블록을 먹는다.',
        '두 번째 균열은 내부에서 열린다. 이 챕터부터 금융 전쟁의 시대가 시작된다.',
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

  // 챕터 2 해금 (봉투 B). 봉투별 조건은 독립 — 챕터 1(레이드) 선행 불필요.
  //   해금 조건 원전: "최초 M&A 선언 (Bloc가 타 Bloc 지분 30% 초과 매입 시도)"
  //   → 엔진 신호: 이번 게임에 Bloc 공격자가 M&A 선언(meta.mnaCount) 1회 이상.
  //     엔진 M&A 임계는 51%(EURO_MNA_THRESHOLD)로 원전 30% 초과 조건을 이미 포함.
  //   반환 { unlocked, newly, state }.
  function legacyUnlockChapter2(stateObj) {
    var st = stateObj || legacyLoad();
    if (st.chaptersUnlocked.indexOf(2) !== -1) return { unlocked: true, newly: false, state: st };
    st.chaptersUnlocked = st.chaptersUnlocked.concat([2]);
    st.chapterProgress = Object.assign({}, st.chapterProgress, { 2: { unlockedAt: Date.now() } });
    return { unlocked: true, newly: true, state: st };
  }

  // 게임 종료 결과를 캠페인에 반영 (영속 저장 포함).
  //   gameResult = { anyRaid, topRaidBloc, anyMna, mnaPreyBloc }
  //     anyRaid     — 레이드 1회 이상 발생 → 챕터 1 해금 트리거          (Stage 1, 시그니처 불변)
  //     topRaidBloc — 최다 레이드 피해 블록 → 챕터 1 흉터(kind 'raid')   (Stage 1, 시그니처 불변)
  //     anyMna      — Bloc 공격자 M&A 선언 1회 이상 → 챕터 2 해금 트리거 (Stage 2, 옵셔널)
  //     mnaPreyBloc — 이번 게임 M&A 표적(PREY·방어자) 블록 → 챕터 2 흉터(kind 'prey') (옵셔널)
  //   * 하위 호환: anyMna/mnaPreyBloc 미공급(구 index.html·헤드리스)이면 Stage 1 과 동일 동작.
  //   반환 { state, chapter1Newly, chapter2Newly }. *Newly=true 면 이번 판이 해당 챕터 해금 순간.
  function legacyRecordGame(gameResult) {
    var st = legacyLoad();
    var chapter1Newly = false;
    var chapter2Newly = false;
    if (gameResult && gameResult.anyRaid) {
      var r1 = legacyUnlockChapter1(st);
      st = r1.state;
      chapter1Newly = r1.newly;
    }
    if (gameResult && gameResult.anyMna) {
      var r2 = legacyUnlockChapter2(st);
      st = r2.state;
      chapter2Newly = r2.newly;
    }
    // 단일 흉터 채널 — 최신 1건만 유지 (다음 게임 시작 주가 -1 의 근거). 해금 판부터 남긴다.
    //   챕터 2 해금 후 M&A 표적(PREY)이 있으면 그 블록이 가장 신선한 상처 → 우선(kind 'prey').
    //   아니면 챕터 1 최다 레이드 피해 블록(kind 'raid'). 게임 로직 영향은 여전히 -1 흉터 하나뿐.
    var scarBloc = null, scarKind = null;
    if (st.chaptersUnlocked.indexOf(2) !== -1 && gameResult && gameResult.mnaPreyBloc) {
      scarBloc = gameResult.mnaPreyBloc; scarKind = 'prey';
    } else if (st.chaptersUnlocked.indexOf(1) !== -1 && gameResult && gameResult.topRaidBloc) {
      scarBloc = gameResult.topRaidBloc; scarKind = 'raid';
    }
    if (scarBloc) st.cityScars = [{ bloc: scarBloc, kind: scarKind, ts: Date.now() }];
    legacySave(st);
    return { state: st, chapter1Newly: chapter1Newly, chapter2Newly: chapter2Newly };
  }

  // 다음 게임 시작 시 적용할 활성 흉터 — { bloc, kind } 또는 null.
  //   챕터 1·2 둘 다 미해금이면 항상 null (흉터 미발동) — 헤드리스에서도 안전.
  //   kind: 'raid'(ch1) | 'prey'(ch2). kind 없는 구버전 흉터는 'raid' 로 정규화.
  function legacyActiveScar() {
    var st = legacyLoad();
    if (st.chaptersUnlocked.indexOf(1) === -1 && st.chaptersUnlocked.indexOf(2) === -1) return null;
    if (!st.cityScars || !st.cityScars.length) return null;
    var last = st.cityScars[st.cityScars.length - 1];
    return (last && last.bloc) ? { bloc: last.bloc, kind: last.kind || 'raid' } : null;
  }

  glob.LEGACY_KEY = LEGACY_KEY;
  glob.legacyLoad = legacyLoad;
  glob.legacySave = legacySave;
  glob.legacyReset = legacyReset;
  glob.legacyUnlockChapter1 = legacyUnlockChapter1;
  glob.legacyUnlockChapter2 = legacyUnlockChapter2;
  glob.legacyRecordGame = legacyRecordGame;
  glob.legacyActiveScar = legacyActiveScar;
  glob.legacyChapterMeta = legacyChapterMeta;
  glob.legacyTotalChapters = legacyTotalChapters;

})(typeof window !== 'undefined' ? window : this);
