;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/side-04-medbay-heist.js — 사이드 미션 "Medbay Heist"
  //   (사이드 = 챕터 밖 단편/중편 미션. ch01-first-blood.js 스키마 그대로 재사용,
  //    엔진 무편집으로 콘텐츠 추가 — docs/25 §5.1. 포맷 정본 = ch01/ch04/side-01/02.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문(청부 의뢰문)     [계승] cards/events/quest-deck.md Q28 "의료 시설
  //                                습격"(의뢰인 ❓익명 · 목표 "HELIX 의료구역 레이드" ·
  //                                주의 "공권력 +2") 발췌 — 목표문·주의문 구조를 그대로
  //                                가져오되 확보물만 "부품(스플라이스 획득)"→"스플라이스
  //                                연구 데이터"로 재서술(수집 임무 정렬, [각색]).
  //   "독 상태 치료" 모티프       [계승] cards/events/quest-deck.md Q33 "독 상태
  //                                치료"(의뢰인 🏢HELIX · "상처 카드 3장 이상 누적된
  //                                상태에서 완치") — 퀘스트 자체는 채택하지 않고, HELIX
  //                                의료구역의 본래 기능(치료)이 이번 습격에서는 뒤집혀
  //                                "치료제 대신 데이터"로 팔려나간다는 오프닝 대사의
  //                                모티프로만 인용(원문 문구 발췌 포함).
  //   "몸은 소모품이다. 시장은
  //    영원하다" 인용              [각색] cards/objectives/bloc.md B-T03 "스플라이스
  //                                패권"(조건 "Ghost에게 스플라이스 카드 5장 판매/공급
  //                                — 본인 또는 HELIX 경로" · 플레이버 원문) — 성취
  //                                조건 자체는 미채택, 플레이버만 각색 차용해 오프닝/
  //                                리프레인으로 사용(HELIX 의료동이 곧 스플라이스
  //                                공급망의 한 축이라는 전제 근거).
  //   HELIX 본원 의료동(업타운)   [계승] docs/10-map-zones.md §4 Ring2 업타운 표
  //                                "H5 | 의료구역 | HELIX | HELIX 지원" — ch04(다운타운
  //                                B6 슬럼 불법 시술소)와 다른 무대(업타운 본원)로 정렬.
  //   HELIX 스탯 라인 근거        [계승] docs/07-combat-stats.md §2 "Bloc 임원 스탯"
  //                                HELIX 8/3/3/2/3(HP/ATK/DEF/SPD/HACK) — 로스터
  //                                (HELIX_MEDIC) 수치 근거로만 인용, 실제 정의는
  //                                data/enemies.js(통합 단계) 소관.
  //   접근 대화 3출구 구조        [계승 docs/25 §4.4 MFU 패턴 · 각색 ch04 approach]
  //                                ch04 approach 노드의 "전투 / [HP16] 관통(→공유 outro)
  //                                / [HACK4] 우회(→별도 quiet outro)" 골격을 그대로
  //                                재사용 — HP 게이트는 BLADE 지름길, HACK 게이트는
  //                                CIPHER 지름길(docs/07 §2 CIPHER HACK5/유효HP12 vs
  //                                BLADE HACK1/유효HP20 그대로).
  //   오브젝티브 자동축 완주      [계승 store.js applyHackObjective 기존 계약, §MFU]
  //                                신규 메커닉 0 — objective-reduce 오브젝티브는
  //                                인접 유닛의 max(HACK,ATK) 축으로 자동 차감되므로,
  //                                전투 경로에서는 CIPHER=해킹·BLADE=강습으로 같은
  //                                목표(연구 캐시)를 다른 축으로 완주한다.
  //   적 상성                     [계승 docs/06 §6 · attributes.js BEATS] SPLICE_HOUND=
  //                                ASH → BLADE(IRON)▶ASH 상성+1 체감. 기계 아님 →
  //                                양 클래스 처치 가능.
  //   전투 인카운터 무대          [신규] HELIX 본원 의료동 6×7, 연구 캐시 오브젝티브 ·
  //                                격리 캡슐 엄폐(full) 신설.
  //   순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: MISSION.kind / MISSION.unlockRequires 는 ch01~ch08 엔진 계약에
  //   없던 신규 최상위 메타 필드다(side-01/02 와 동일 패턴). 현재 엔진
  //   (store.js/campaign.js)은 두 필드를 읽지 않으므로 전투/대화/보상 계약에는
  //   영향이 없다(순수 추가 데이터) — 사이드 미션 해금 조건("missionsDone 에
  //   ch04-price-of-splice 포함")을 문서화해 두는 용도이며, 실제 게이트 판정(허브
  //   미션보드 필터링)은 통합 단계에서 이 필드를 읽어 배선해야 한다.
  // [통합 노트] HELIX_MEDIC / SPLICE_HOUND 는 아직 data/enemies.js 에 없음(ch04와
  //   동일하게 통합 단계에서 추가 예정) — 이 파일은 계획 로스터 ID(HELIX_MEDIC,
  //   SPLICE_HOUND, ICE_NODE)만 참조한다(_missions_check.js PLANNED_ROSTER 화이트
  //   리스트 + ICE_NODE 는 이미 enemies.js 에 존재).
  // ==========================================================================

  // ---- 원전 산문 앵커 (quest-deck.md Q28+Q33, bloc.md B-T03 발췌·각색) ---------
  var OPENING = [
    '"몸은 소모품이다. 시장은 영원하다."', // [각색] bloc.md B-T03 "스플라이스 패권" 플레이버 원문 인용
    '거리의 암호화 채널에 의뢰 하나가 뜬다. 발신자는 없다.', // [계승] Q28 의뢰인 ❓ 익명
    '"목표 — HELIX 의료구역 레이드. 확보물은 스플라이스 연구 데이터. 공권력 대응은 각오하라."', // [계승/각색] Q28 목표문("HELIX 의료구역 레이드")+주의문("공권력 +2") 발췌·재서술(확보물만 부품→연구데이터로 정렬)
    '업타운 H5 — HELIX 본원 의료동. 이곳은 시술대보다 서버가 먼저 반응하는 구역이다.', // [계승] docs/10 §4 "H5 | 의료구역 | HELIX | HELIX 지원"
    '어딘가에서는 오늘도 "독 상태"를 치료제로 다스린다. 이곳에서는 그 치료제 데이터 자체가 상품이다.', // [계승] Q33 "독 상태 치료"(HELIX 의뢰) 모티프 인용 — 원 퀘스트 미채택, 대사 모티프만
    '오늘 밤, 그 데이터를 먼저 가져간다.',
  ];
  var STORY_CARD = '그날 밤, 이름 없는 의뢰 하나가 성사됐다. HELIX 장부는 아직 무엇을 잃었는지 모른다.';
  var REFRAIN = '몸은 소모품이다. 시장은 영원하다.';

  // ---- 전투 인카운터 (HELIX 본원 의료동 6열 × 7행, 중편) -----------------------
  //  좌표 {x:열 0..5, y:행 0..6}. row0=상단(연구 캐시), row6=하단(진입로).
  //  [계승 docs/10 §4 H5(의료구역·HELIX 지원)] 무대. [계승 docs/07 §2 HELIX 8/3/3/2/3] 적 축.
  //  wall  : 이동+LoS 완전 차단. cover : 이동 차단·LoS 투과, DEF 보정만.
  var COMBAT = {
    cols: 6, rows: 7,
    playerStart: { x: 2, y: 6 },
    // 오브젝티브 = 스플라이스 연구 데이터 수집(threshold 누적 차감 = objective-reduce).
    //  effective threshold = 8 + veil 1 = 9 (buildCombat 이 veil 를 가산).
    //  [계승 store.js applyHackObjective] 인접 유닛의 max(HACK,ATK) 축 자동 선택 —
    //  CIPHER(HACK5>ATK2)는 해킹, BLADE(ATK5>HACK1)는 강습으로 같은 캐시를 차감(MFU).
    // 51차 밸런스: 8+veil1(=9) → 7+0(=7) — MOLE 오브젝티브 소모전·CIPHER 완주 완화.
    objective: { x: 2, y: 0, threshold: 7, veil: 0, label: 'HELIX 연구 캐시', dataTB: 3.3 },
    // [계승 ch01/ch04, 각색 raidThreshold] 위협 임계 + 증원(경보 시 1회 스폰).
    threatCap: 8,
    reinforcement: { key: 'SPLICE_HOUND', x: 5, y: 2 },   // 경보 증원 (복도 반대편에서 합류)
    walls: [],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1, full=DEF+2. full=격리 캡슐(진정제 처치 구역).
    cover: [
      { x: 1, y: 2, type: 'light' }, { x: 4, y: 2, type: 'light' },
      { x: 1, y: 3, type: 'full'  }, { x: 4, y: 3, type: 'full'  },
    ],
    // 적 배치 — key 는 data/enemies.js 참조(통합 단계에서 HELIX_MEDIC/SPLICE_HOUND 추가,
    //   계획 로스터 ID만 인용). ICE_NODE 는 캐시 앞 정적 수호(HACK 전용 파괴, 선택 대상 —
    //   물리무효·atk0 이라 전멸전 없이도 승리 가능. BLADE는 우회, CIPHER는 파괴 가능).
    //   SPLICE_HOUND = ASH 근접(BLADE IRON▶ASH 상성+1 체감, 기계 아님 → 양 클래스 처치 가능).
    enemies: [
      { key: 'HELIX_MEDIC',  x: 1, y: 4 },   // 좌익 의무관 (BIO·저지)
      { key: 'HELIX_MEDIC',  x: 4, y: 4 },   // 우익 의무관 (BIO·저지)
      { key: 'SPLICE_HOUND', x: 2, y: 3 },   // 복도 중앙 경비 하운드 (ASH 근접)
      { key: 'ICE_NODE',     x: 2, y: 1 },   // 캐시 앞 정적 수호 (HACK만 파괴, 선택/CIPHER 전용)
    ],
  };

  // ---- 대화 그래프 (docs/25 §4.2 노드 스키마) ----------------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'STREET', portrait: 'ghost',
        quote: 'CIPHER',                       // 고스트 포트레이트 = 현재 클래스 명대사 (어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: 'HELIX 본원 의료동으로 향한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — HP/HACK 두 게이트가 각각 다른 클래스의 지름길 (docs/25 §1·§4.4,
      //  [각색 ch04 approach] 골격 재사용). HP16 은 정면 관통(공유 outro), HACK4 는 잠입
      //  우회(별도 quiet outroBypass) — ch04 와 동일한 "공유/분리" 비대칭 구조.
      approach: {
        id: 'approach', speaker: 'HELIX', portrait: 'bloc',
        quote: 'HELIX',
        text: 'H5 업타운, HELIX 본원 의료동 진입로. 스플라이스 하운드 한 마리와 의무관 둘이 복도를 지킨다. ' +
              '안쪽 격리 캡슐 너머로 연구 서버 캐시가 깜박이고, 통로에는 진정제 가스가 옅게 깔려 있다.',
        choices: [
          { label: '무력으로 의료동을 돌파한다',
            effect: { startCombat: { onWin: 'outro' } },
            desc: 'HELIX 의무관·스플라이스 하운드와 전투 → 연구 캐시 확보 (양 클래스 완주 · HACK/ATK 강습 자동축)',
          },
          { label: '[HP 16] 진정제 가스 구역을 버티며 관통한다',
            gate: { attr: 'hp', min: 16 }, show: 'gray',
            setFlags: { gasEndured: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'BLADE 유효HP20 통과 → 전투 스킵·정면 관통(전투 경로와 같은 outro). CIPHER 유효HP12 잠김 → 전투로 완주',
          },
          { label: '[HACK 4] 연구 서버 잠금을 우회한다',
            gate: { attr: 'hack', min: 4 }, show: 'gray',
            setFlags: { serverBypassed: true },
            effect: { skipCombat: true }, goto: 'outroBypass',
            desc: 'CIPHER HACK5 통과 → 전투 스킵·서버 직결(별도 quiet outro). BLADE HACK1 잠김 → 전투/HP관통으로 완주',
          },
        ],
      },
      // 정면 돌파 아웃트로 — 전투 강행(①) 과 HP 관통(②) 이 공유(둘 다 물리적 강습).
      //  (전투 경로는 오브젝티브 차감으로 캐시를 이미 확보한 뒤 진입.)
      outro: {
        id: 'outro', speaker: 'CIPHER', portrait: 'ghost',
        text: '경비가 쓰러지고 격리 캡슐 봉인이 풀린다. 연구 캐시가 열린다 — 3.3테라바이트, 진정제 가스 속에서.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { medbayHeistDone: true, extractionStyle: 'loud' } }, checkpoint: true,
        choices: [ { label: '거리로 빠져나간다', goto: 'settle' } ],
      },
      // 해킹 우회 아웃트로 — HACK 게이트(③) 전용. 전투 없이 서버만 조용히 딴다.
      outroBypass: {
        id: 'outroBypass', speaker: 'CIPHER', portrait: 'ghost',
        text: '서버 잠금이 조용히 풀린다. 격리 캡슐도, 하운드도 낌새를 못 챈다.\n' +
              '캐시에 접속한다 — 3.3테라바이트. 진정제 가스는 뿌려지지도 않았다.\n' + STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { medbayHeistDone: true, extractionStyle: 'quiet', serverGhosted: true } }, checkpoint: true,
        choices: [ { label: '거리로 빠져나간다', goto: 'settle' } ],
      },
      settle: {
        id: 'settle', speaker: 'CIPHER', portrait: 'ghost',
        text: '연구 데이터가 거리로 넘어간다. HELIX 장부에는 아직 아무 것도 적히지 않았다.\n' +
              '스플라이스 시장은 오늘 밤도 조용히 몸집을 불린다.',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (사이드 중편 — 챕터 대비 축소 보상) --------------------------
  var REWARDS = {
    rep: 2,
    karma: 2,
    nuyen: 7,
    unlocks: [],
  };

  var MISSION = {
    id: 'side-04-medbay-heist',
    title: 'Side — Medbay Heist',
    subtitle: '사이드 — 의료동 탈취 (HELIX 본원 의료동, 스플라이스 연구 데이터 확보)',
    kind: 'side',                                        // SIMPLIFIED 상단 주석 참고 — 신규 메타 필드, 엔진 미소비.
    unlockRequires: ['ch04-price-of-splice'],             // SIMPLIFIED 상단 주석 참고 — missionsDone 포함 조건(통합 단계 배선 대상).
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_SIDE04_MEDBAY_HEIST = API;
})();
