;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/ch06-bloc-acquisition.js — 챕터 6 "Bloc Acquisition" 미션 데이터
  //   (챕터 = 데이터 파일 1개. 엔진 무편집으로 챕터 추가 — docs/25 §5.1)
  //   포맷 정본 = ch01-first-blood.js (IIFE·window 등록·순수 리터럴·계보 주석).
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문           [그대로/계승] cards/legacy/chapter-06-bloc-acquisition.md §오프닝
  //                          "블록은 죽지 않는다. 다른 블록이 된다" 리프레인 [그대로],
  //                          기억 시술·"브랜딩 통합"·자판기 결제 인터페이스 [그대로],
  //                          블록명 CARBON 특정 [각색] (전제 정렬 — 흡수 대상 고정)
  //   스토리 카드           [그대로] chapter-06 §6 "그는 한때 제너럴-디렉터였다…" 원문
  //   의뢰인 ORPHANED CREW  [계승] chapter-06 §2 새 카드 "ORPHANED CREW" + §개요
  //                          "흡수된 블록의 옛 직원" — 봉쇄된 CARBON HQ 잔류 직원 구출 훅
  //   접근 대화 3출구       [계승 ch01 §접근 + docs/25 §4.4] 전투 / [ATK5] 셔터 강행 /
  //                          [flag boardroomGhost] ch02 이사회 내부자 코드 — 클래스 지름길 분화
  //   과거/흡수자 선택      [계승 chapter-06 §Ghost 플레이어 선택] A.과거 회수(전직 직원 동맹)
  //                          / B.흡수자 교란(rep+) — 영속 flag ("내 선택이 남는다")
  //   전투 무대             [계승 docs/10 §3/§8 CARBON HQ 공업지구 E6] 6×8 봉쇄구,
  //                          봉쇄 게이트 강행 돌파 오브젝티브(objective-reduce)
  //   적 축                 [계승 docs/07 §2 CARBON 9/3/4/2/2] CARBON_GUARD/CARBON_DRONE
  //                          — 고DEF·저SPD 통합 경비. BLADE 강습/CIPHER 해킹 양 축 완주
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  //
  // [통합 노트] 메인 해금 = missionsDone 에 'ch05-mesh-ghost' 포함(직전 챕터 클리어).
  //   현 store.js 는 단일 하드코딩 → 미션 레지스트리 필요. 아래 unlock 필드는
  //   레지스트리 도입 전까지 소비되지 않는 메타데이터(엔진 무편집).
  // [계승 플래그] approach 출구 ③ gate {flag:'boardroomGhost'} 는 ch02 잠입 완주
  //   분기에서만 세워지는 계승 플래그 — 이 파일에서는 set 하지 않음(검증기 info 예상).
  // [SIMPLIFIED] 봉투 F 흡수 보드 메커닉(LEGACY MERGER·DEADWEIGHT PURGE·ACQUIRED 스티커·
  //   VOSS DOSSIER 등 M&A 카드층, chapter-06 §봉투 F)은 신규 시스템/ABILITIES 정의가
  //   필요 → 미션 파일 범위 밖. RPG 미션에서는 산문 + 영속 flag 로만 표기하고 보상
  //   unlocks 는 빈 배열로 미채택(ORPHANED CREW 동맹도 orphanedCrewAllied flag 메타데이터).
  // [엔진 근거] 이중 승리(게이트 돌파 or 경비 전멸)는 store.js checkWin 의 native 조건
  //   (objective.done → win, aliveEnemies===0 → win) — 신규 필드 없이 기존 계약만 사용.
  // ==========================================================================

  // ---- 원전 산문 앵커 (cards/legacy/chapter-06-bloc-acquisition.md §오프닝) -----
  // [그대로] 핵심 문장·리프레인 원문 고정. [각색] 사라지는 블록을 CARBON 으로 특정
  //   (전제 = CARBON 흡수 진행). 마지막 두 줄 리프레인은 [그대로].
  var OPENING = [
    '2092년 1월 04일.',
    '5대 블록 중 한 곳 — CARBON — 의 로고가 도시 전역에서 사라지기 시작했다.',
    '건물 외벽, 광고판, 직원 유니폼, 심지어 자판기의 결제 인터페이스까지.',
    '관료는 "브랜딩 통합 작업"이라고 불렀다.',
    '3일 뒤, CARBON의 전직 수장은 자신의 이름을 잊었다. 의학적 소견: 기억 시술.',
    '여섯 번째로 도시가 깨달은 사실:',
    '블록은 죽지 않는다.',
    '다른 블록이 된다.',
  ];
  // [그대로] chapter-06 §6 스토리 카드 원문.
  var STORY_CARD = '그는 한때 제너럴-디렉터였다. 지금은 AXIOM 콜센터의 상담원이다. ' +
    '그는 매일 자신의 과거 회사에 전화를 건다. 자신이 누구였는지 기억나지 않아서.';
  // [그대로] chapter-06 §오프닝 리프레인.
  var REFRAIN = '블록은 죽지 않는다. 다른 블록이 된다.';

  // ---- 전투 인카운터 (CARBON HQ 공업 봉쇄구 6열 × 8행) ------------------------
  //  좌표 {x:열 0..5, y:행 0..7}. row0=상단(봉쇄 게이트), row7=하단(고스트 진입).
  //  [계승 docs/10 §3/§8 CARBON HQ 공업지구 E6] 무대. [계승 docs/07 §2 CARBON 9/3/4/2/2] 적 축.
  //  wall  : 이동+LoS 완전 차단(컨베이어·기계). cover : 이동 차단·LoS 투과, DEF 보정만.
  var COMBAT = {
    cols: 6, rows: 8,
    playerStart: { x: 3, y: 7 },
    // 오브젝티브 = CARBON 봉쇄 게이트 강행 돌파(threshold 누적 차감 = objective-reduce).
    //  effective threshold = 12 + veil 0 = 12 (buildCombat 이 veil 를 가산).
    //  dataTB 0 = 추출이 아닌 강행 돌파(로그 표기용, 유출량 없음).
    //  [계승 store applyHackObjective] CIPHER=HACK 해킹 / BLADE=ATK 강습 → 양 축 완주.
    objective: { x: 3, y: 0, threshold: 12, veil: 0, label: 'CARBON 봉쇄 게이트', dataTB: 0 },
    // [계승 ch01 · 각색 raidThreshold] 위협 임계 + 증원(경보 시 1회 스폰) — 페이싱 실동.
    threatCap: 8,
    reinforcement: { key: 'CARBON_GUARD', x: 5, y: 1 },   // 봉쇄 증원 (통합 경비 추가 투입)
    // [신규 docs/25 §3.4] wall×3 — 컨베이어·기계가 게이트로의 LoS 를 차단(우회 강제).
    walls: [
      { x: 2, y: 3 }, { x: 3, y: 3 },   // 컨베이어 적재 라인 (게이트 전방 LoS 차단)
      { x: 2, y: 5 },                   // 정지한 프레스 기계 (중앙 시야 차단)
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1, full=DEF+2.
    cover: [
      { x: 2, y: 6, type: 'full'  }, { x: 3, y: 6, type: 'full'  },   // 전방 컨베이어 적재대
      { x: 1, y: 3, type: 'light' }, { x: 4, y: 5, type: 'light' },   // 측면 기계 잔해
    ],
    // 적 배치 — key 는 data/enemies.js 참조(로스터 통합 단계에서 CARBON_GUARD/CARBON_DRONE 추가).
    //  CARBON_GUARD = 고DEF·저SPD 통합 경비(기계 아님 → 양 클래스 처치 가능).
    //  CARBON_DRONE = 순찰 드론(HACK 상성 체감, BLADE 물리 처치 가능).
    enemies: [
      { key: 'CARBON_GUARD', x: 1, y: 4 },   // 좌익 통합 경비
      { key: 'CARBON_GUARD', x: 4, y: 4 },   // 우익 통합 경비
      { key: 'CARBON_DRONE', x: 0, y: 2 },   // 좌측 순찰 드론
      { key: 'CARBON_DRONE', x: 5, y: 3 },   // 우측 순찰 드론
    ],
  };

  // ---- 대화 그래프 (docs/25 §4.2 노드 스키마) ----------------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'CIPHER', portrait: 'ghost',
        quote: 'CIPHER',                       // loreQuote(CIPHER) 버블 (어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: '봉쇄된 CARBON HQ(E6)로 접근한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 세 출구가 각각 다른 완주 축 (docs/25 §1·§4.4).
      //  [계승 chapter-06 ORPHANED CREW] 흡수 진행 중 봉쇄된 본사에 갇힌 옛 직원 구출.
      approach: {
        id: 'approach', speaker: 'CARBON', portrait: 'bloc',
        quote: 'CARBON',
        text: '공업지구 E6, CARBON HQ 봉쇄 게이트. 로고가 절반쯤 지워진 셔터 뒤로 통합 경비가 통로를 메운다. ' +
              '안쪽 어딘가에 ORPHANED CREW — 흡수에서 아직 이름을 잃지 않은 CARBON 전직 직원 — 이 갇혀 있다. ' +
              '봉쇄 블라스트 셔터가 게이트를 덮고, 통합 접근 코드 없이는 열리지 않는다.',
        choices: [
          { label: '통합 경비를 전멸시키고 봉쇄 게이트로 진입한다',
            effect: { startCombat: { onWin: 'outro' } },
            setFlags: { entryMethod: 'assault' },
            desc: 'CARBON 경비와 전투 → 게이트 돌파 (양 클래스 완주 · BLADE 강습/CIPHER 해킹 자동축)',
          },
          { label: '[ATK 5] 봉쇄 셔터를 맨손으로 뜯어 강행 돌파한다',
            gate: { attr: 'atk', min: 5 }, show: 'gray',
            setFlags: { blastShutterTorn: true, entryMethod: 'breach' },
            effect: { skipCombat: true }, goto: 'outroBreach',
            desc: 'BLADE ATK5 통과 → 전투 스킵·셔터 강행. CIPHER ATK2 잠김 → 전투(①)로 완주',
          },
          { label: '[flag boardroomGhost] ch02 이사회 내부자 정보로 통합 접근 코드를 확보한다',
            gate: { flag: 'boardroomGhost' }, show: 'gray',
            setFlags: { insiderCode: true, entryMethod: 'code' },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'ch02 잠입 완주자만 가능(영속 계승 flag) — 코드로 게이트 개방, 전투 스킵',
          },
        ],
      },
      // 돌파 아웃트로 — 전투 강행(①) 과 내부자 코드(③) 가 공유. 게이트가 열리고 직원을 빼낸다.
      //  (전투 경로는 오브젝티브 차감으로 게이트를 이미 돌파한 뒤 진입.)
      outro: {
        id: 'outro', speaker: 'CIPHER', portrait: 'ghost',
        text: '봉쇄 게이트가 열린다. 반쯤 지워진 CARBON 로고 아래로 통로가 드러난다.\n' +
              '안쪽에 ORPHANED CREW가 있다 — 아직 자기 이름을 기억하는 CARBON 직원. 흡수의 손이 닿기 전에 데리고 나온다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { gatePassed: true } }, checkpoint: true,
        choices: [ { label: 'ORPHANED CREW를 데리고 게이트를 넘는다', goto: 'choice' } ],
      },
      // 셔터 강행 아웃트로 — ATK 게이트(②) 전용. 봉쇄 셔터를 힘으로 찢고 직원을 빼낸다.
      outroBreach: {
        id: 'outroBreach', speaker: 'CIPHER', portrait: 'ghost',
        text: '블라스트 셔터가 금속 비명을 지르며 찢어진다. 통합 코드는 필요 없었다 — 힘이 코드였다.\n' +
              '찢긴 틈으로 ORPHANED CREW를 끌어낸다. 흡수는 아직 이 사람만은 삼키지 못했다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { gatePassed: true } }, checkpoint: true,
        choices: [ { label: '찢긴 셔터 밖으로 함께 빠져나간다', goto: 'choice' } ],
      },
      // ★플레이어 선택 [계승 chapter-06 §Ghost 플레이어 선택] — "내 선택이 남는다".
      //  A/B 는 캐릭터 카드에 영속 반영(과거 회수 동맹 축 vs 흡수자 교란 축).
      choice: {
        id: 'choice', speaker: 'CIPHER', portrait: 'ghost',
        text: '"과거를 먹을 것인가, 미래를 먹을 것인가?"',
        choices: [
          { label: 'A. 과거 회수 — 흡수된 CARBON 전직 직원 2명을 동맹으로 거둔다',
            setFlags: { acquisitionChoice: 'reclaim', orphanedCrewAllied: true, crewAllies: 2 },
            goto: 'settle',
            desc: '전직 CARBON 직원 2명 영구 동맹 · 구 자산 일부 획득 (영속 flag)',
          },
          { label: 'B. 흡수자 교란 — 흡수자 블록에 흠집을 남긴다',
            setFlags: { acquisitionChoice: 'disrupt', acquirerDisruptFlag: true },
            effect: { rep: 5 }, goto: 'settle',
            desc: '렙 +5 (영구) · 흡수자 구역 공격 +2 (영속 flag)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'CIPHER', portrait: 'ghost',
        text: '첫 흡수가 완료됐다. CARBON은 보드에서 지워지고, 그 자산·직원·구역은 흡수자에게 통합된다.\n' +
              '5대 블록 체제가 끝났다. 남은 넷은 이제 가속되는 포식 경쟁 속으로 들어간다.\n' +
              '남은 블록들은 넥서스를 노린다. 마지막 왕관을 위해. → Chapter 07: "Heart of the City"',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 [계승 chapter-06 §챕터 효과 · ch01 스케일 유지] ----------------
  var REWARDS = {
    rep: 5,               // 챕터 클리어 영구 렙 +5 (봉쇄 강행·흡수 개입 반영)
    heatCapDelta: 0,      // 공권력 트랙 최대치 변동 없음 (공업구역 내부 봉쇄전)
    karma: 3,             // 성장 소비용 karma
    nuyen: 12,            // ₵ 보상 (ORPHANED CREW 구출 의뢰)
    unlocks: [],          // [SIMPLIFIED] 봉투 F 흡수 카드는 신규 시스템 필요 → 미채택
  };

  var MISSION = {
    id: 'ch06-bloc-acquisition',
    title: 'Chapter 06 — Bloc Acquisition',
    subtitle: '챕터 06 — 블록 흡수 · CARBON HQ(E6) 봉쇄 게이트 강행 돌파',
    envelope: 'F',
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
    // [통합 메타데이터] 미션 레지스트리 도입 전까지 미소비 — 직전 챕터 클리어 요구.
    unlock: { missionsDone: ['ch05-mesh-ghost'] },
    nextHint: 'Chapter 07: "Heart of the City" — 넥서스 3라운드 연속 장악 시 해금',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_CH06 = API;
})();
