;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/ch02-insider-game.js — 챕터 2 "Insider Game" 미션 데이터
  //   (챕터 = 데이터 파일 1개. 엔진 무편집으로 챕터 추가 — docs/25 §5.1)
  //   포맷 정본 = ch01-first-blood.js (IIFE·window 등록·순수 리터럴·계보 주석).
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문           [각색] cards/legacy/chapter-02-insider-game.md §오프닝 발췌·각색
  //   "블록끼리도 블록을 먹는다" 리프레인  [그대로] 원전 인용 (chapter-02 §오프닝)
  //   스토리 카드           [그대로] chapter-02 §6 "회의록은 언제나 깨끗하게 남는다…"
  //   BOARDROOM BACKDOOR    [계승] chapter-02 §3 CIPHER 카드 → 잠입 백도어 산문 모티프
  //   LEVERAGE DOSSIER      [계승] chapter-02 §2 VANTA 카드 → 잠입 분기 배신기록 회수
  //   접근 대화 3출구       [계승 chapter-01 §접근 + docs/25 §4.4] 전투 / [SPD4] 우회 / [AXIOM태그] 잠김
  //   내부자/유령 선택      [각색 chapter-02 §플레이어 선택] 유출공개 렙+ / 은폐·레이드보너스
  //   챕터 효과(귀환 정산)  [계승 chapter-02 §챕터 효과 · ch01 스케일 유지] 렙+3·공권력최대+1
  //   전투 무대             [계승 docs/10 §4 Ring2 금융가 E4 + docs/07 §2 AXIOM 6/2/2/4/5]
  //                          이사회 타워 서버룸 6×7, 회의록 데이터 코어 오브젝티브
  //   의뢰 훅               [각색 cards/events/quest-deck.md Q12 주가 조작(익명·BROKER 경유)]
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  //
  // [통합 노트] 메인 해금 = missionsDone 에 'ch01-first-blood' 포함(직전 챕터 클리어).
  //   현 store.js 는 단일 하드코딩 → 미션 레지스트리 필요. 아래 unlock 필드는
  //   레지스트리 도입 전까지 소비되지 않는 메타데이터(엔진 무편집).
  // ==========================================================================

  // ---- 원전 산문 앵커 (cards/legacy/chapter-02-insider-game.md) --------------
  // [각색] §오프닝 발췌 — 원문 순서·문장 유지, 전제(인턴 "넘긴")에 맞춘 최소 어미 조정.
  var OPENING = [
    '2091년 5월 2일. 주가판이 붉게 점등한다.',
    '"VANTA-AXIOM 전략적 제휴" — 뉴스에는 그렇게 떴다.',
    '실상은 AXIOM이 VANTA 지분을 31% 확보한 사건이었다.',
    '이사회 회의록은 새벽에 유출됐다.',
    '두 시간 뒤, 그 회의록을 넘긴 인턴은 교통사고로 죽었다.',
    '도시가 두 번째로 깨달은 사실:',
    '블록끼리도 블록을 먹는다.',
  ];
  // [그대로] chapter-02 §6 스토리 카드 원문.
  var STORY_CARD = '회의록은 언제나 깨끗하게 남는다. 진짜 결정은 그 옆 방에서 이뤄진다. 우리는 그 옆 방에서 만난다.';
  // [그대로] chapter-02 §오프닝 리프레인.
  var REFRAIN = '블록끼리도 블록을 먹는다.';

  // ---- 전투 인카운터 (AXIOM 이사회 타워 서버룸 6열 × 7행) ---------------------
  //  좌표 {x:열 0..5, y:행 0..6}. row0=상단(회의록 코어), row6=하단(고스트 진입).
  //  [계승 docs/10 §4 Ring2 금융가 E4] 무대. [계승 docs/07 §2 AXIOM 6/2/2/4/5] 적 축.
  //  wall  : 이동+LoS 완전 차단. cover : 이동 차단·LoS 투과, DEF 보정만.
  var COMBAT = {
    cols: 6, rows: 7,
    playerStart: { x: 2, y: 6 },
    // 오브젝티브 = 이사회 데이터 코어 수집(threshold 누적 차감 = objective-reduce).
    //  effective threshold = 8 + veil 0 = 8 (51차 밸런스: 8+1 → 8+0 — 초반 챕터 난이도 램프 정렬).
    objective: { x: 2, y: 0, threshold: 8, veil: 0, label: 'AXIOM 회의록 코어', dataTB: 3.1 },
    // [계승 ch01 · 각색 raidThreshold] 위협 임계 + 증원(경보 시 1회 스폰) — 페이싱 실동.
    threatCap: 8,
    reinforcement: { key: 'AXIOM_DRONE', x: 5, y: 1 },
    // [71차 L5] 이사회 격벽 2개 — 트리비얼 이상치(BLADE 2R 무피해 러시) 해소용 배치 레버.
    //   BLADE 는 mov3×ap2 = 라운드당 6칸이라 시작(2,6)→코어(2,0) 체비쇼프 6 을 R1 에 주파했다
    //   (코어는 이미 그리드 최원거리라 '코어 이설' 로는 해소 불가 — 측정 확인). 좌측 직선 레인을
    //   막아 우회를 강제하면 러시가 R3 로 늘어 트리비얼 밴드(≤2R·무피해)를 벗어난다.
    //   실측 파급: 이 미션 3셀만 변동(BLADE 2R→3R · RIGGER 3R→5R · MOLE 2R79%→5R100%),
    //   신규 clearFail/attrition 0 · 타 미션 0 셀.
    walls: [
      { x: 1, y: 2 }, { x: 2, y: 2 },   // 이사회층 격벽 — 중앙 직선 접근 차단(우측 우회 강제)
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1, full=DEF+2
    cover: [
      { x: 1, y: 3, type: 'light' }, { x: 4, y: 3, type: 'light' },
      { x: 1, y: 4, type: 'light' }, { x: 4, y: 4, type: 'light' },
      { x: 2, y: 5, type: 'full'  }, { x: 3, y: 5, type: 'full'  },
    ],
    // 적 배치 — key 는 data/enemies.js 참조(로스터 통합 단계에서 AXIOM_* 추가).
    //  ICE Node 는 코어 수호(정적·물리무효·HACK 전용 = CIPHER 전용 처리, 선택 대상).
    enemies: [
      { key: 'AXIOM_ANALYST', x: 2, y: 3 },   // 중앙 저지 (MESH/spd4 계열)
      { key: 'AXIOM_DRONE',   x: 0, y: 2 },
      { key: 'AXIOM_DRONE',   x: 4, y: 2 },
      { key: 'ICE_NODE',      x: 2, y: 1 },   // 코어 앞 정적 수호 (HACK만 파괴, 선택/CIPHER 전용)
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
          { label: 'AXIOM 이사회 타워로 접근한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — SPD 게이트가 전투를 실제로 제거 (docs/25 §1·§4.4).
      //  [각색 quest-deck Q12] 의뢰는 익명(BROKER 경유) — 회의록 코어 확보로 내분 증폭.
      approach: {
        id: 'approach', speaker: 'AXIOM', portrait: 'bloc',
        quote: 'AXIOM',
        text: '금융가 E4, AXIOM 이사회 타워 서버층. 자율 경비 드론과 분석관이 코어 룸을 지킨다. ' +
              '인턴 교대 로그가 벽면 패널에서 붉게 깜박인다.',
        choices: [
          { label: '경비를 뚫고 강행 돌파한다',
            effect: { startCombat: { onWin: 'outroLoud' } },
            desc: 'AXIOM 경비와 전투 → 코어 룸 진입 (양 클래스 완주 · BLADE 폴백)',
          },
          { label: '[SPD 4] 인턴 교대 타이밍에 위장 잠입한다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { stealthEntry: true },
            effect: { skipCombat: true }, goto: 'outroStealth',
            desc: 'CIPHER SPD4 통과 → 경비 조우 스킵. BLADE SPD3 잠김 → 강행 돌파로 완주',
          },
          { label: '[AXIOM 태그] 사원증을 위조해 통과한다',
            gate: { tag: 'AXIOM' }, show: 'gray',
            setFlags: { forgedPass: true },
            effect: { skipCombat: true }, goto: 'outroStealth',
            desc: '사회/내부자 빌드 축 (현 빌드 미보유 = 미래 사회축 광고, 잠김)',
          },
        ],
      },
      // 전투 승리 후 아웃트로 (오브젝티브 = 전투 중 코어 차감으로 이미 추출).
      outroLoud: {
        id: 'outroLoud', speaker: 'CIPHER', portrait: 'ghost',
        text: '코어가 뽑힌다. 3.1테라바이트 — 이사회가 옆 방에서 내린 진짜 결정이 어둠으로 흘러나간다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { insiderBreach: true } }, checkpoint: true,
        choices: [ { label: '탈출한다', goto: 'aftermathLoud' } ],
      },
      // SPD/사원증 우회 아웃트로 (전투 없이 잠입 추출).
      //  [계승 BOARDROOM BACKDOOR] 신호 하나 없이 코어에 접속.
      outroStealth: {
        id: 'outroStealth', speaker: 'CIPHER', portrait: 'ghost',
        text: '교대의 틈으로 미끄러져 들어간다. 분석관은 아무것도 보지 못했다.\n' +
              '회의록 코어에 접속한다 — 3.1테라바이트. 로그에 오늘 밤은 없다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { insiderBreach: true, ghostedExtraction: true } }, checkpoint: true,
        choices: [ { label: '탈출한다', goto: 'aftermathQuiet' } ],
      },
      // ── 후일담 분기 (완주 방식이 다음 상태에 영속 반영) ──
      // 강행 돌파 경로 → 소란한 흔적.
      aftermathLoud: {
        id: 'aftermathLoud', speaker: 'CIPHER', portrait: 'ghost',
        text: '경보가 울렸고, 서버층엔 쓰러진 경비가 남았다. AXIOM은 침입을 알았다.\n' +
              '이사회는 서로를 의심하기 시작한다. 소란은 내분을 앞당긴다.',
        choices: [
          { label: '흔적을 남긴 채 빠져나간다',
            setFlags: { extractionStyle: 'loud' }, goto: 'choice',
            desc: '위협 상승 · 다음 미션 경계 강화 (영속 flag)' },
        ],
      },
      // 잠입 추출 경로 → 조용한 흔적. stealthEntry flag 가 후속 선택지를 해금(분기 영속).
      aftermathQuiet: {
        id: 'aftermathQuiet', speaker: 'CIPHER', portrait: 'ghost',
        text: '문은 열린 적도 없던 것처럼 닫혔다. AXIOM은 자기 이사회를 의심할 것이다.\n' +
              '완벽한 침묵. 하지만 침묵도 하나의 서명이다.',
        choices: [
          { label: '신호 하나 남기지 않는다',
            setFlags: { extractionStyle: 'quiet', boardroomGhost: true }, goto: 'choice',
            desc: '위협 최소 · 유령 평판 (영속 flag)' },
          { label: '[flag stealthEntry] LEVERAGE DOSSIER를 회수한다',
            gate: { flag: 'stealthEntry' }, show: 'gray',
            setFlags: { extractionStyle: 'quiet', boardroomGhost: true, leverageDossier: true }, goto: 'choice',
            desc: '[계승 VANTA 카드] 위장 잠입한 자만 가능 — 배신 기록 확보(분기 영속)' },
        ],
      },
      // ★플레이어 선택 [각색 chapter-02 §플레이어 선택] — "내 선택이 남는다".
      choice: {
        id: 'choice', speaker: 'CIPHER', portrait: 'ghost',
        text: '"회의록을 세상에 던지겠는가, 손안에 쥐겠는가?"',
        choices: [
          { label: 'A. 유출 공개 — 회의록을 거리에 뿌린다',
            setFlags: { insiderChoice: 'expose', mnaExposed: true },
            effect: { rep: 4 }, goto: 'settle',
            desc: '렙 +4 (영구), 내분 공론화 — AXIOM 적대',
          },
          { label: 'B. 은폐 — 코어를 손안에 쥔다',
            setFlags: { insiderChoice: 'cover', raidBonusFlag: true },
            effect: { wantedZero: true }, goto: 'settle',
            // [3차 발굴 F5] "레이드 보상 +50%" 미이행 약속 정정 — 실효과(wantedZero = Heat 소거)만 서술.
            desc: '현상수배 0 유지 — 공권력(Heat) 트랙 소거 (내분 비공개)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'CIPHER', portrait: 'ghost',
        text: '두 번째 균열이 안쪽에서 열렸다. 공권력 트랙 최대치가 한 칸 더 올랐다.\n' +
              '누군가는 동맹을 배신하고, 누군가는 포식자가 된다.\n' +
              '길에서 피가 흘렀고, 이사회에서 돈이 흐른다. 다음에 움직이는 건 군인일 것이다. → Chapter 03: "Martial Night"',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 [계승 chapter-02 §챕터 효과 · ch01 스케일 유지] ---------------
  var REWARDS = {
    rep: 3,               // 챕터 클리어 영구 렙 +3
    heatCapDelta: 1,      // 공권력 트랙 최대치 +1
    karma: 2,             // 성장 소비용 karma
    nuyen: 9,             // ₵ 보상 (Q12 계열, ch01 8 → 9)
    unlocks: [],          // 신규 능력 없음 (BOARDROOM BACKDOOR/LEVERAGE DOSSIER 는 산문 모티프)
  };

  var MISSION = {
    id: 'ch02-insider-game',
    title: 'Chapter 02 — Insider Game',
    subtitle: 'AXIOM 이사회 타워 침투 — 회의록 코어 탈취',
    envelope: 'B',
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
    // [통합 메타데이터] 미션 레지스트리 도입 전까지 미소비 — 직전 챕터 클리어 요구.
    unlock: { missionsDone: ['ch01-first-blood'] },
    nextHint: 'Chapter 03: "Martial Night" — 공권력 트랙 10 도달 시 해금',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_CH02 = API;
})();
