'use strict';
// ============================================================================
// legacy_module.js — 레거시 캠페인 영속 Stage 1·2·3·4 (docs/12 "ASH & SIGNAL")
//   챕터 진행을 브라우저 localStorage('dn_legacy_v1')에 영속화하고,
//   Chapter 1 "First Blood"(cards/legacy/chapter-01-first-blood.md) +
//   Chapter 2 "Insider Game"(cards/legacy/chapter-02-insider-game.md) +
//   Chapter 3 "Martial Night"(cards/legacy/chapter-03-martial-night.md) +
//   Chapter 4 "Price of Splice"(cards/legacy/chapter-04-price-of-splice.md) +
//   Chapter 5 "Mesh Ghost"(cards/legacy/chapter-05-mesh-ghost.md) +
//   Chapter 6 "Bloc Acquisition"(cards/legacy/chapter-06-bloc-acquisition.md) +
//   Chapter 7 "Heart of the City"(cards/legacy/chapter-07-heart-of-city.md) +
//   Chapter 8 "Zero Day"(cards/legacy/chapter-08-zero-day.md, 캠페인 완결 8/8) 아크를
//   실플레이에 연결한다. euro_module / lore_module 와 동일한 배선 패턴:
//     · <script src> 로드 + DOMContentLoaded 자가복구 heal 로더 등록(index.html)
//     · 전역은 window 노출, 소비처는 typeof 가드로 미로드 시 무해
//     · 모든 localStorage 접근은 try/catch 가드 — 헤드리스(sim-e2e)·프라이빗
//       모드·스토리지 차단 브라우저에서도 예외 없이 기본값으로 되돌아간다.
//
//   영속 스키마 dn_legacy_v1 = {
//     chaptersUnlocked: number[],                    // 해금된 챕터 번호 (예: [1,2,3,4,5])
//     chapterProgress:  { [n]: {unlockedAt} },       // 챕터별 진행 메타
//     cityScars:        [{ bloc, kind, ts }],        // 도시 흉터 기록 (docs/22 정체성)
//   }                                                //   kind: 'raid'(ch1) | 'prey'(ch2 M&A 표적) | 'martial'(ch3 계엄) | 'splice'(ch4 과잉 개조 블록) | 'mesh'(ch5 메시 고스트) | 'acquired'(ch6 완전 흡수된 블록) | 'nexus'(ch7 넥서스 장악 블록) | 'zeroday'(ch8 캠페인 완결 도시 전역)
//   * 게임 로직 무변경 원칙: 이 모듈은 순수 영속·조회 계층이다. 게임 규칙에
//     주는 유일한 영향은 단일 흉터 채널(cityScar)로, initGame 이 legacyActiveScar()를
//     읽어 적용할 때뿐이다. Stage 2·3·4·5·6·7·8 도 같은 절제 유지 — 흉터 채널은 여전히 단 하나,
//     kind 로 마크 대상만 갈린다:
//       · 'raid'(ch1 레이드 최다 피격 블록)         → 다음 게임 시작 주가 -1
//       · 'prey'(ch2 M&A 표적 블록)                 → 다음 게임 시작 주가 -1
//       · 'martial'(ch3 계엄 발생, 특정 블록 없음)  → 다음 게임 시작 공권력 +1 (도시 전역)
//       · 'splice'(ch4 임의 Bloc TL 4 달성 → 그 블록) → 다음 게임 시작 주가 -1 (사이버사이코시스 대가)
//       · 'mesh'(ch5 CIPHER TL5/해킹노드3 → 종가 최저 블록) → 다음 게임 시작 주가 -1 (SIGNAL 이 가장 취약한 노드에 강림)
//       · 'acquired'(ch6 M&A 완전 흡수된 블록)      → 다음 게임 시작 주가 -1 (로고가 지워진 피인수 블록)
//       · 'nexus'(ch7 넥서스 의장실 장악 블록)      → 다음 게임 시작 주가 -1 (왕관이 있는 자리가 무겁다 — 심장을 쥔 블록이 피 흘린다)
//       · 'zeroday'(ch8 캠페인 완결, 특정 블록 없음) → 다음 게임 시작 공권력 +1 (도시 전역, Zero Day 여파 — martial 과 동일한 도시 전역 채널)
//     흉터는 ch1|ch2|ch3|ch4|ch5|ch6|ch7|ch8 중 하나라도 해금돼야 활성. 우선순위 zeroday > nexus > acquired > mesh > splice > martial > prey > raid
//     (챕터 순 최신 상처가 단일 슬롯을 차지 — 기존 acquired<mesh<splice<martial<prey<raid 로 챕터 순을 따랐던 규칙의
//      확장; ch8 zeroday 가 가장 최근(완결) 챕터라 최상위, ch7 nexus 가 그 다음. martial·zeroday 만 도시 전역 흉터. -1/+1급 소규모 1회성 유지).
//     ─ 7·8번째 kind 'nexus'·'zeroday' 추가에 따른 규칙 갱신(챕터 7·8 선례):
//       · 'nexus'(ch7) 는 acquired/mesh/splice/prey/raid 와 동일한 블록-주가 -1 채널을 재사용(새 엔진 메커니즘 신설 없음);
//         대상 블록만 "게임 종료 시 NEXUS(F6) 셀을 장악한 Bloc"(getNexusController)으로 파생 방식이 다르다. Ghost 장악 시엔 NEXUS 중립 → 블록 없음(발원 안 함).
//       · 'zeroday'(ch8) 는 martial 과 동일한 도시 전역 공권력 +1 채널을 재사용; ch8 은 per-game 엔진 신호가 아니라 "챕터 1~7 전부 해금"에서 파생되는 완결 캡스톤이라,
//         캠페인 완주(chapter8Newly)하는 그 판에만 1회성으로 도시 전역 흉터를 남긴다(이후 판은 그 판의 ch1~7 신호로 정상 재평가).
// ============================================================================
(function (glob) {

  var LEGACY_KEY = 'dn_legacy_v1';
  var TOTAL_CHAPTERS = 8;
  var MARTIAL_HEAT_DELTA = 1;   // ch3 'martial' 흉터: 다음 게임 시작 공권력 가산 (원전 효과#4 "시작 공권력 +2"의 -1급 절제판)
  var ZERODAY_HEAT_DELTA = 1;   // ch8 'zeroday' 흉터: 캠페인 완결 여파 — 다음 게임 시작 공권력 가산 (도시 전역, martial 과 동급 -1/+1 절제)

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
    3: {
      id: 3,
      envelope: 'C',
      title: 'Martial Night',
      titleKo: '계엄의 밤',
      unlockCond: '공권력 트랙 최고조(계엄 선포)',
      story: [
        '도시 전역의 공공 디스플레이가 동시에 꺼졌다 다시 켜진다. 국장의 얼굴, 국장의 목소리 — "본 시각부로 애시그리드 전역에 계엄을 선포한다."',
        '거리에는 시민이 없었다. 사이렌과 장갑차와 드론 스웜만 있었다.',
        '세 번째로 도시가 배운 사실 — 블록보다 강한 것은 국가다. 아주 가끔, 잠깐 동안만. 이 챕터부터 공권력과의 정면 충돌이 가능해진다.',
      ],
    },
    4: {
      id: 4,
      envelope: 'D',
      title: 'Price of Splice',
      titleKo: '스플라이스의 대가',
      unlockCond: '임의 Bloc 테크 레벨(TL) 4 달성',
      story: [
        '2091년 9월 08일, HELIX 사내 광고가 도시를 뒤덮었다 — "당신의 한계는 이제 선택입니다." 스플라이스와 코어텍스 와이어가 지하 시장에서 대중 시장으로 넘어온다.',
        '같은 날 새벽, B8 불법 시술소에서 시술받던 여성 하나가 수술대에서 일어나 벽을 뜯어내고 걸어나갔다. 그녀의 눈은 — 엄밀히 말하면 그녀의 몸도 — 자신의 것이 아니었다.',
        '네 번째로 도시가 알게 된 사실 — 몸이 무기가 되면, 몸도 적이 된다. 이 챕터부터 사이버사이코시스의 시대가 시작된다.',
      ],
    },
    5: {
      id: 5,
      envelope: 'E',
      title: 'Mesh Ghost',
      titleKo: '메시 고스트',
      unlockCond: 'CIPHER 테크 레벨 5 달성 또는 메시 노드 3개 이상 침입 성공',
      story: [
        '2091년 11월 17일 03:12 AM, 애시그리드의 모든 메시 터미널이 한 문장을 출력한다 — `[SIGNAL] HELLO AGAIN.` 발신자도, 발신 위치도, 수신자도 식별 불가.',
        '가장 불안한 점 — 그 문장을 수신한 사람 모두가 그것을 자신의 옛 이름으로 읽었다.',
        '다섯 번째로 도시가 깨달은 사실 — 메시는 단순한 네트워크가 아니다. 누군가가, 혹은 무언가가, 그 안에서 살고 있다. 이 챕터부터 메시가 또 하나의 전장이 된다.',
      ],
    },
    6: {
      id: 6,
      envelope: 'F',
      title: 'Bloc Acquisition',
      titleKo: '블록 인수',
      unlockCond: 'Bloc 1곳 완전 흡수 (지분 51% 이상 + 이사회 3라운드 장악)',
      story: [
        '2092년 1월 04일, 5대 블록 중 한 곳의 로고가 도시 전역에서 사라지기 시작했다 — 건물 외벽, 광고판, 직원 유니폼, 심지어 자판기의 결제 인터페이스까지. 관료는 그것을 "브랜딩 통합 작업"이라고 불렀다.',
        '3일 뒤, 그 블록의 전직 수장은 자신의 이름을 잊었다. 의학적 소견은 기억 시술, 가족적 소견은 그가 자발적으로 선택했다는 것 — 완벽하게 합리적인 결정이었다고.',
        '여섯 번째로 도시가 깨달은 사실 — 블록은 죽지 않는다, 다른 블록이 될 뿐이다. 5대 블록 체제가 끝나고, 이 챕터부터 첫 번째 흡수 사건과 함께 포식 경쟁이 가속된다.',
      ],
    },
    7: {
      id: 7,
      envelope: 'G',
      title: 'Heart of the City',
      titleKo: '도시의 심장',
      unlockCond: '어느 세력이든 NEXUS (F6) 3라운드 연속 장악 달성',
      story: [
        '2092년 3월 22일, F6 넥서스 타워 87층. 평의회 회의실은 원래 5개의 의자를 두고 있었다 — 지금은 셋뿐이다. 하나는 흡수됐고, 하나는 통째로 사라졌다.',
        '모든 세력이 도시의 심장을 향해 최후의 공세를 펼친다. 넥서스 타워가 최종 전장이 되고, 이 챕터 종료 시 엔딩 분기가 결정된다.',
        '일곱 번째로 도시가 깨달은 사실 — 중심은 비어 있다, 누군가 앉을 때까지. 왕관은 무겁지 않다, 왕관이 있는 자리가 무겁다.',
      ],
    },
    8: {
      id: 8,
      envelope: 'H',
      title: 'Zero Day',
      titleKo: '제로 데이',
      // 원전 카드 해금 조건 문구는 "Chapter 07 완료 (넥서스 점거 결정 후 자동 해금)"이나,
      //   ch8 은 캠페인 최종 챕터이고 원전 서사가 "선택은 이미 지난 일곱 챕터 동안 이루어졌다"로
      //   전 여정의 귀결임을 명시하므로(과제 지침: "전 챕터 완료 류면 chaptersUnlocked 길이 파생"),
      //   구현 매핑은 "챕터 1~7 전부 해금 시 자동 해금 = 캠페인 완결 캡스톤"으로 파생한다.
      unlockCond: '챕터 1~7 전부 해금 시 자동 해금 (캠페인 완결)',
      // 캠페인 완주 배지에 노출할 원전 공통 에필로그 발췌(cards/legacy/chapter-08-zero-day.md §6).
      epilogue: '도시는 원래 이름이 몇 개 있었다. 마지막 이름을 정하는 건 언제나 우리였다. 이번엔 어떻게 정했는가?',
      story: [
        '2092년 6월 01일 00:00:00, 도시의 모든 시계가 동시에 정지했다. 3초 후, 메시에 같은 메시지가 떴다 — `[SIGNAL] ZERO DAY. CHOOSE.`',
        '선택은 이미 지난 일곱 챕터 동안 이루어졌다. 지금 남은 일은 그 선택이 어떤 결과를 낳았는지 보는 것뿐이었다. 캠페인의 최종 챕터, 4가지 엔딩 중 하나로 수렴한다.',
        '여덟 번째로 도시가 깨달은 사실 — 이 도시의 마지막 이름을 정하는 것은 우리다. `[SIGNAL] THANK YOU FOR PLAYING. THE CITY WILL REMEMBER. ...AND SO WILL I.`',
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

  // 챕터 3 해금 (봉투 C). 봉투별 조건은 독립 — 챕터 1·2 선행 불필요.
  //   해금 조건 원전: "공권력 트랙 10 도달 (계엄선포 트리거)".
  //   → 엔진 신호: 이번 게임에 계엄이 발생 = 공권력(heat) 최고조. 소비처(index.html)가
  //     policeSpawned(공권력 9 도달 시 경찰 스폰, S04 는 시작부터 true)·heat==10·시나리오
  //     martialLaw 게이트에서 martialLaw 를 파생해 넘긴다. 엔진 heat 상한이 10 이라
  //     원전 "트랙 10 도달"은 곧 트랙 최고조 = 계엄 엔티티(경찰) 전개와 동치.
  //   반환 { unlocked, newly, state }.
  function legacyUnlockChapter3(stateObj) {
    var st = stateObj || legacyLoad();
    if (st.chaptersUnlocked.indexOf(3) !== -1) return { unlocked: true, newly: false, state: st };
    st.chaptersUnlocked = st.chaptersUnlocked.concat([3]);
    st.chapterProgress = Object.assign({}, st.chapterProgress, { 3: { unlockedAt: Date.now() } });
    return { unlocked: true, newly: true, state: st };
  }

  // 챕터 4 해금 (봉투 D). 봉투별 조건은 독립 — 챕터 1·2·3 선행 불필요.
  //   해금 조건 원전: "임의의 Bloc 테크 레벨(TL) 4 달성 또는 어떤 Ghost가 스플라이스 3개 장착".
  //   → 엔진 신호: 첫 번째 분기(임의 Bloc TL 4 달성)만 현행 엔진에 실존 — 소비처(index.html)가
  //     게임 종료 시 role==='bloc' 플레이어의 p.tl(엔진 TL 시스템, R&D 페이즈 파생) 최댓값 ≥ 4 를
  //     파생해 spliceTech 로 넘긴다(상시 카운터 신설 없음). 두 번째 분기(Ghost 스플라이스 3개 장착)는
  //     엔진에 개별 스플라이스 장착 집계 시스템이 없어 미배선(No-op 정직 보고) — OR 조건은 실존 신호
  //     하나로 충족.
  //   반환 { unlocked, newly, state }.
  function legacyUnlockChapter4(stateObj) {
    var st = stateObj || legacyLoad();
    if (st.chaptersUnlocked.indexOf(4) !== -1) return { unlocked: true, newly: false, state: st };
    st.chaptersUnlocked = st.chaptersUnlocked.concat([4]);
    st.chapterProgress = Object.assign({}, st.chapterProgress, { 4: { unlockedAt: Date.now() } });
    return { unlocked: true, newly: true, state: st };
  }

  // 챕터 5 해금 (봉투 E). 봉투별 조건은 독립 — 챕터 1·2·3·4 선행 불필요.
  //   해금 조건 원전: "CIPHER 테크 레벨 5 달성 또는 메시 노드 3개 이상 침입 성공".
  //   → 두 분기 모두 현행 엔진에 실존 신호 (ch4 와 달리 OR 양쪽 다 배선):
  //     · 분기1 (CIPHER TL 5): CIPHER 클래스 플레이어(p.specific==='CIPHER')의 p.tl(엔진 TL
  //       시스템, R&D 파생, 11×11 캡=TL5) ≥ 5. → 소비처(index.html)가 게임 종료 시 파생.
  //     · 분기2 (메시 노드 3개 침입): 동 CIPHER 플레이어의 p.hackNodes(CIPHER 시그니처 "해킹 노드"
  //       게이지 — euro_module 해킹 노드 발동/카드 훅, ≥3=해킹 신 hack_god 달성) ≥ 3.
  //   두 분기 모두 상시 카운터 신설 없이 기존 p.tl·p.hackNodes 집계에서 파생 (하위 호환·헤드리스 안전).
  //   반환 { unlocked, newly, state }.
  function legacyUnlockChapter5(stateObj) {
    var st = stateObj || legacyLoad();
    if (st.chaptersUnlocked.indexOf(5) !== -1) return { unlocked: true, newly: false, state: st };
    st.chaptersUnlocked = st.chaptersUnlocked.concat([5]);
    st.chapterProgress = Object.assign({}, st.chapterProgress, { 5: { unlockedAt: Date.now() } });
    return { unlocked: true, newly: true, state: st };
  }

  // 챕터 6 해금 (봉투 F). 봉투별 조건은 독립 — 챕터 1·2·3·4·5 선행 불필요.
  //   해금 조건 원전: "Bloc 1곳 완전 흡수 (지분 51% 이상 + 이사회 3라운드 장악)".
  //   → 엔진 신호: 이번 게임에 M&A 인수 완결이 1회 이상 발생 = euro_completeMnaAcquisition 이
  //     방어 실패 후 남기는 완료 기록(meta.acquisitions 에 피인수 블록 push + 피인수 플레이어 p.acquiredBy 마커).
  //     엔진 M&A 임계 51%(EURO_MNA_THRESHOLD)가 원전 "지분 51% 이상"을, 완결(방어 실패 판정)이
  //     "이사회 장악"을 각각 대응 — 소비처(index.html)가 게임 종료 시 blocAbsorbed 로 파생.
  //   → 챕터 2("최초 M&A 선언" = meta.mnaCount 선언 1회)와 명확히 구분: ch6 은 선언이 아니라 인수 완결만
  //     트리거 (선언했지만 방어 성공/미완결 판이면 ch2 만 해금·ch6 미해금). 상시 카운터 신설 없음.
  //   반환 { unlocked, newly, state }.
  function legacyUnlockChapter6(stateObj) {
    var st = stateObj || legacyLoad();
    if (st.chaptersUnlocked.indexOf(6) !== -1) return { unlocked: true, newly: false, state: st };
    st.chaptersUnlocked = st.chaptersUnlocked.concat([6]);
    st.chapterProgress = Object.assign({}, st.chapterProgress, { 6: { unlockedAt: Date.now() } });
    return { unlocked: true, newly: true, state: st };
  }

  // 챕터 7 해금 (봉투 G). 봉투별 조건은 독립 — 챕터 1~6 선행 불필요.
  //   해금 조건 원전: "어느 세력이든 NEXUS (F6) 3라운드 연속 장악 달성".
  //   → 엔진 신호: 소비처(index.html)가 게임 종료 시 getNexusController(state)로 NEXUS(F6·5×5 는 C3)
  //     셀 소유자를 파생 — 어느 세력이든 게임 종료 시점까지 NEXUS 를 장악 중이면 nexusHeld=true.
  //     ─ 정직 보고(No-op): 원전 "3라운드 연속"의 정밀 연속 카운터는 엔진에 meta.nexusStreak /
  //       meta.nexusHolder 필드가 선언만 되고 갱신되지 않는 死필드라 실존하지 않는다. 따라서 "연속 3R"
  //       정밀 추적은 미배선 — 대신 실존하는 최강 신호 "게임 종료 시점 NEXUS 장악 유지"(끝까지 심장을
  //       쥐고 있음 ≈ 지속 장악)로 근사한다. 상시 카운터 신설 없이 기존 셀 소유(state.map[F6].owner)에서 파생.
  //   반환 { unlocked, newly, state }.
  function legacyUnlockChapter7(stateObj) {
    var st = stateObj || legacyLoad();
    if (st.chaptersUnlocked.indexOf(7) !== -1) return { unlocked: true, newly: false, state: st };
    st.chaptersUnlocked = st.chaptersUnlocked.concat([7]);
    st.chapterProgress = Object.assign({}, st.chapterProgress, { 7: { unlockedAt: Date.now() } });
    return { unlocked: true, newly: true, state: st };
  }

  // 챕터 8 해금 (봉투 H, 최종). ★ 캠페인 완결 캡스톤 — 유일하게 봉투별 독립이 아니라 파생 해금.
  //   해금 조건 원전: "Chapter 07 완료 (넥서스 점거 결정 후 자동 해금)" + 최종 챕터 서사 "선택은 이미
  //     지난 일곱 챕터 동안 이루어졌다". → 구현 매핑: per-game 엔진 신호가 아니라 chaptersUnlocked 파생 —
  //     챕터 1~7 이 전부 해금돼 있으면 자동 해금(전 여정의 귀결 = 캠페인 완결). ch8 해금 = 8/8 = 완주.
  //   반환 { unlocked, newly, state }. (선행 챕터 미충족이면 unlocked=false·미해금 — 다른 unlock 과 시그니처만 동일)
  function legacyUnlockChapter8(stateObj) {
    var st = stateObj || legacyLoad();
    if (st.chaptersUnlocked.indexOf(8) !== -1) return { unlocked: true, newly: false, state: st };
    var priorAll = true;
    for (var n = 1; n <= 7; n++) { if (st.chaptersUnlocked.indexOf(n) === -1) { priorAll = false; break; } }
    if (!priorAll) return { unlocked: false, newly: false, state: st };
    st.chaptersUnlocked = st.chaptersUnlocked.concat([8]);
    st.chapterProgress = Object.assign({}, st.chapterProgress, { 8: { unlockedAt: Date.now() } });
    return { unlocked: true, newly: true, state: st };
  }

  // 캠페인 완주 여부 — 8챕터 전부 해금 시 true (조회 전용, 부작용 없음).
  //   ch8 은 챕터 1~7 전부 해금 시에만 해금되므로, 8 이 해금 목록에 있으면 곧 8/8 완주.
  function legacyCampaignComplete(stateObj) {
    var st = stateObj || legacyLoad();
    if (!st || !Array.isArray(st.chaptersUnlocked)) return false;
    for (var n = 1; n <= TOTAL_CHAPTERS; n++) { if (st.chaptersUnlocked.indexOf(n) === -1) return false; }
    return true;
  }

  // 게임 종료 결과를 캠페인에 반영 (영속 저장 포함).
  //   gameResult = { anyRaid, topRaidBloc, anyMna, mnaPreyBloc, martialLaw, spliceTech, spliceBloc, meshTech, meshBloc, blocAbsorbed, absorbedBloc, nexusHeld, nexusBloc }
  //     anyRaid     — 레이드 1회 이상 발생 → 챕터 1 해금 트리거          (Stage 1, 시그니처 불변)
  //     topRaidBloc — 최다 레이드 피해 블록 → 챕터 1 흉터(kind 'raid')   (Stage 1, 시그니처 불변)
  //     anyMna      — Bloc 공격자 M&A 선언 1회 이상 → 챕터 2 해금 트리거 (Stage 2, 옵셔널)
  //     mnaPreyBloc — 이번 게임 M&A 표적(PREY·방어자) 블록 → 챕터 2 흉터(kind 'prey') (옵셔널)
  //     martialLaw  — 이번 게임 계엄 발생(공권력 최고조/경찰 전개/S04) → 챕터 3 해금 + 'martial' 흉터 (Stage 3, 옵셔널)
  //     spliceTech  — 이번 게임 임의 Bloc 이 TL 4 달성 → 챕터 4 해금 트리거 (Stage 4, 옵셔널)
  //     spliceBloc  — 그 과잉 개조 블록(TL 최고·≥4) → 챕터 4 흉터(kind 'splice', 시작 주가 -1) (옵셔널)
  //     meshTech    — 이번 게임 CIPHER 가 TL 5 또는 해킹 노드 ≥3 달성 → 챕터 5 해금 트리거 (Stage 5, 옵셔널)
  //     meshBloc    — 종가 최저 블록(SIGNAL 이 강림한 취약 노드) → 챕터 5 흉터(kind 'mesh', 시작 주가 -1) (옵셔널)
  //     blocAbsorbed— 이번 게임 M&A 인수 완결(meta.acquisitions 기록) 1회 이상 → 챕터 6 해금 트리거 (Stage 6, 옵셔널)
  //     absorbedBloc— 완전 흡수돼 NPC 전환된 피인수 블록 → 챕터 6 흉터(kind 'acquired', 시작 주가 -1) (옵셔널)
  //     nexusHeld   — 이번 게임 종료 시 NEXUS(F6) 를 어느 세력이든 장악 중 → 챕터 7 해금 트리거 (Stage 7, 옵셔널)
  //     nexusBloc   — 그 NEXUS 장악 Bloc(Ghost 장악 시 null=중립) → 챕터 7 흉터(kind 'nexus', 시작 주가 -1) (옵셔널)
  //   ★ 챕터 8(Zero Day, 완결)은 gameResult 필드가 아니라 chaptersUnlocked 파생 — 챕터 1~7 전부 해금 시 자동 해금(캠페인 완주).
  //   * 하위 호환: 신필드 전부 미공급(구 index.html·헤드리스)이면 Stage 1 과 동일 동작 (미공급 챕터는 미해금·흉터 미발원).
  //   반환 { state, chapter1Newly … chapter8Newly, campaignComplete }. *Newly=true 면 이번 판이 해당 챕터 해금 순간. campaignComplete=8/8 여부.
  function legacyRecordGame(gameResult) {
    var st = legacyLoad();
    var chapter1Newly = false;
    var chapter2Newly = false;
    var chapter3Newly = false;
    var chapter4Newly = false;
    var chapter5Newly = false;
    var chapter6Newly = false;
    var chapter7Newly = false;
    var chapter8Newly = false;
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
    if (gameResult && gameResult.martialLaw) {
      var r3 = legacyUnlockChapter3(st);
      st = r3.state;
      chapter3Newly = r3.newly;
    }
    if (gameResult && gameResult.spliceTech) {
      var r4 = legacyUnlockChapter4(st);
      st = r4.state;
      chapter4Newly = r4.newly;
    }
    if (gameResult && gameResult.meshTech) {
      var r5 = legacyUnlockChapter5(st);
      st = r5.state;
      chapter5Newly = r5.newly;
    }
    if (gameResult && gameResult.blocAbsorbed) {
      var r6 = legacyUnlockChapter6(st);
      st = r6.state;
      chapter6Newly = r6.newly;
    }
    if (gameResult && gameResult.nexusHeld) {
      var r7 = legacyUnlockChapter7(st);
      st = r7.state;
      chapter7Newly = r7.newly;
    }
    // 챕터 8(완결): per-game 신호 없이 챕터 1~7 전부 해금 시 자동 해금. legacyUnlockChapter8 이 선행 충족 검사.
    //   위 ch1~7 처리 후 조건이 충족됐다면 이 판이 곧 캠페인 완주 순간(chapter8Newly).
    var r8 = legacyUnlockChapter8(st);
    st = r8.state;
    chapter8Newly = r8.newly;
    // 단일 흉터 채널 — 최신 1건만 유지 (다음 게임 시작 조건 보정의 근거). 해금 판부터 남긴다.
    //   우선순위 zeroday > nexus > acquired > mesh > splice > martial > prey > raid — 챕터 순 최신 상처가 단일 슬롯 차지
    //   (기존 acquired<mesh<splice<martial<prey<raid 챕터 순 규칙의 확장; ch8 zeroday(완결)·ch7 nexus 가 최상위 2개).
    //     · 이 판이 캠페인 완주 순간(chapter8Newly) → 도시 전역 흉터(kind 'zeroday', 특정 블록 없음 → 시작 공권력 +1). 완결 캡스톤 1회성.
    //     · 아니면 챕터 7 해금 후 NEXUS 장악 Bloc(nexusBloc) → 그 블록 흉터(kind 'nexus', 시작 주가 -1).
    //     · 아니면 챕터 6 해금 후 M&A 완전 흡수된 블록(absorbedBloc) → 그 블록 흉터(kind 'acquired', 시작 주가 -1).
    //     · 아니면 챕터 5 해금 후 종가 최저 블록(meshBloc) → 그 블록 흉터(kind 'mesh', 시작 주가 -1).
    //     · 아니면 챕터 4 해금 후 임의 Bloc TL 4(spliceBloc) → 그 블록 흉터(kind 'splice', 시작 주가 -1).
    //     · 아니면 챕터 3 해금 후 계엄(martialLaw) → 도시 전역 흉터(kind 'martial', 특정 블록 없음 → 시작 공권력 +1).
    //     · 아니면 챕터 2 해금 후 M&A 표적(PREY) → 그 블록 흉터(kind 'prey', 시작 주가 -1).
    //     · 아니면 챕터 1 최다 레이드 피해 블록(kind 'raid', 시작 주가 -1).
    //   게임 로직 영향은 여전히 흉터 채널 하나뿐 (kind 로 마크 대상만 갈림; -1/+1급 소규모 1회성).
    var scarBloc = null, scarKind = null;
    if (chapter8Newly) {
      scarBloc = null; scarKind = 'zeroday';
    } else if (st.chaptersUnlocked.indexOf(7) !== -1 && gameResult && gameResult.nexusBloc) {
      scarBloc = gameResult.nexusBloc; scarKind = 'nexus';
    } else if (st.chaptersUnlocked.indexOf(6) !== -1 && gameResult && gameResult.absorbedBloc) {
      scarBloc = gameResult.absorbedBloc; scarKind = 'acquired';
    } else if (st.chaptersUnlocked.indexOf(5) !== -1 && gameResult && gameResult.meshBloc) {
      scarBloc = gameResult.meshBloc; scarKind = 'mesh';
    } else if (st.chaptersUnlocked.indexOf(4) !== -1 && gameResult && gameResult.spliceBloc) {
      scarBloc = gameResult.spliceBloc; scarKind = 'splice';
    } else if (st.chaptersUnlocked.indexOf(3) !== -1 && gameResult && gameResult.martialLaw) {
      scarBloc = null; scarKind = 'martial';
    } else if (st.chaptersUnlocked.indexOf(2) !== -1 && gameResult && gameResult.mnaPreyBloc) {
      scarBloc = gameResult.mnaPreyBloc; scarKind = 'prey';
    } else if (st.chaptersUnlocked.indexOf(1) !== -1 && gameResult && gameResult.topRaidBloc) {
      scarBloc = gameResult.topRaidBloc; scarKind = 'raid';
    }
    if (scarKind) st.cityScars = [{ bloc: scarBloc, kind: scarKind, ts: Date.now() }];
    legacySave(st);
    return { state: st, chapter1Newly: chapter1Newly, chapter2Newly: chapter2Newly, chapter3Newly: chapter3Newly, chapter4Newly: chapter4Newly, chapter5Newly: chapter5Newly, chapter6Newly: chapter6Newly, chapter7Newly: chapter7Newly, chapter8Newly: chapter8Newly, campaignComplete: legacyCampaignComplete(st) };
  }

  // 다음 게임 시작 시 적용할 활성 흉터 — { bloc, kind, heatDelta } 또는 null.
  //   챕터 1·2·3·4·5·6·7·8 모두 미해금이면 항상 null (흉터 미발동) — 헤드리스에서도 안전.
  //   kind: 'raid'(ch1)·'prey'(ch2)·'splice'(ch4)·'mesh'(ch5)·'acquired'(ch6)·'nexus'(ch7) → bloc 시작 주가 -1 (heatDelta 0);
  //         'martial'(ch3)·'zeroday'(ch8) → bloc 없음, 시작 공권력 +heatDelta (도시 전역).
  //   kind 없는 구버전 흉터는 'raid' 로 정규화(하위 호환).
  function legacyActiveScar() {
    var st = legacyLoad();
    var anyUnlocked = false;
    for (var n = 1; n <= TOTAL_CHAPTERS; n++) { if (st.chaptersUnlocked.indexOf(n) !== -1) { anyUnlocked = true; break; } }
    if (!anyUnlocked) return null;
    if (!st.cityScars || !st.cityScars.length) return null;
    var last = st.cityScars[st.cityScars.length - 1];
    if (!last) return null;
    var kind = last.kind || 'raid';
    if (kind === 'martial') return { bloc: null, kind: 'martial', heatDelta: MARTIAL_HEAT_DELTA };
    if (kind === 'zeroday') return { bloc: null, kind: 'zeroday', heatDelta: ZERODAY_HEAT_DELTA };
    return last.bloc ? { bloc: last.bloc, kind: kind, heatDelta: 0 } : null;
  }

  glob.LEGACY_KEY = LEGACY_KEY;
  glob.legacyLoad = legacyLoad;
  glob.legacySave = legacySave;
  glob.legacyReset = legacyReset;
  glob.legacyUnlockChapter1 = legacyUnlockChapter1;
  glob.legacyUnlockChapter2 = legacyUnlockChapter2;
  glob.legacyUnlockChapter3 = legacyUnlockChapter3;
  glob.legacyUnlockChapter4 = legacyUnlockChapter4;
  glob.legacyUnlockChapter5 = legacyUnlockChapter5;
  glob.legacyUnlockChapter6 = legacyUnlockChapter6;
  glob.legacyUnlockChapter7 = legacyUnlockChapter7;
  glob.legacyUnlockChapter8 = legacyUnlockChapter8;
  glob.legacyCampaignComplete = legacyCampaignComplete;
  glob.legacyRecordGame = legacyRecordGame;
  glob.legacyActiveScar = legacyActiveScar;
  glob.legacyChapterMeta = legacyChapterMeta;
  glob.legacyTotalChapters = legacyTotalChapters;

})(typeof window !== 'undefined' ? window : this);
