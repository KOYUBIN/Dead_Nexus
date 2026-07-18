;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/ch03-martial-night.js — 챕터 3 "Martial Night" 미션 데이터
  //   (챕터 = 데이터 파일 1개. 엔진 무편집으로 챕터 추가 — docs/25 §5.1)
  //   포맷 정본 = ch01-first-blood.js (IIFE·window 등록·순수 리터럴·계보 주석).
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문           [그대로] cards/legacy/chapter-03-martial-night.md §오프닝 내러티브 원문 고정
  //   "블록보다 강한 것은 국가다…" 리프레인  [그대로] chapter-03 §오프닝 원전 인용
  //   스토리 카드           [그대로] chapter-03 §5 "계엄은 임시 조치라고 한다…"
  //   다음 챕터 힌트        [그대로] chapter-03 §다음 챕터 힌트 "거리가 잠잠해지자…"
  //   의뢰 훅(지하 저항소)  [계승 chapter-03 §봉투 C-1 지하 저항소] + [각색 quest-deck Q32 계엄 밤 생존(익명)]
  //   무대(검문소·병영)     [계승 chapter-03 §봉투 C-1 병영 구역·검문소 토큰] + [계승 docs/10 §5 경찰서 F3 십자방어선]
  //   공권력=IRONWALL 외주   [각색 docs/01 §2040년대 "공권력은 민영화되어 IRONWALL에 외주"] → 검문소 병력 IRONWALL 진압대
  //   DRONE OVERRIDE 모티프  [계승 chapter-03 §봉투 C-2 CIPHER 카드] → 통제 단말 무력화 시 드론 스웜 명령 상실(산문)
  //   CHECKPOINT BRIBE 모티프 [계승 chapter-03 §봉투 C-2 BROKER 카드] → 병영 검문 뇌물(산문/미래 사회축, 이 슬라이스 미구현)
  //   접근 대화 3출구       [계승 chapter-01/02 §접근 + docs/25 §4.4] 전투 / [DEF3] 검문선 붕괴 / [flag 계승] 잠김
  //   잠행/저항 선택        [각색 chapter-03 §플레이어 선택 Ghost A 잠행 / B 저항] 현상수배 리셋 / 렙 대규모+계엄 해제
  //   챕터 효과(귀환 정산)  [계승 chapter-03 §챕터 효과 "공권력 트랙 최대치 12로 상향" · ch01/02 스케일 유지] heatCapDelta+1
  //   Heat 반영             [계승 docs/07 §8 공권력(Heat)] 계엄 트랙 상향
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  //
  // [SIMPLIFIED — 보고] approach 選 ③ 게이트: 계획은 flag extractionStyle=='loud'(前 미션 소란 흔적).
  //   그러나 엔진 evalGate(dialogue.js)의 flag 게이트는 값비교가 없는 !!flags[flag](참 여부)뿐이다.
  //   ch02 는 loud 경로에 extractionStyle:'loud', quiet 경로에 'quiet' 를 넣을 뿐 loud 전용 boolean 이 없다.
  //   → 값비교(=='loud')는 엔진 미지원 새 메커닉이므로, extractionStyle 존재(=ch02 완주로 추출 흔적 기록)로
  //     근사한다. 결과: ③ 은 loud/quiet 무관하게 ch02 를 완주한 빌드에 열린다(loud 한정 아님).
  //     "前 미션 분기가 후속을 실제로 바꿈"의 영속 flag 시연은 유지되되, loud 한정 세분화만 SIMPLIFIED.
  //
  // [통합 노트] 메인 해금 = missionsDone 에 'ch02-insider-game' 포함(직전 챕터 클리어).
  //   현 store.js 는 단일 하드코딩 → 미션 레지스트리 필요. 아래 unlock 필드는 레지스트리 도입 전까지
  //   미소비 메타데이터(엔진 무편집). 적 로스터(POLICE_*·RIOT_ENFORCER)는 통합 단계에서 enemies.js 추가.
  // ==========================================================================

  // ---- 원전 산문 앵커 (cards/legacy/chapter-03-martial-night.md, 원문 고정) ------
  // [그대로] §오프닝 내러티브 — 원문 문장·순서 유지.
  var OPENING = [
    '2091년 7월 19일 00:04.',
    '도시 전역의 공공 디스플레이가 동시에 꺼진다. 3초 후 다시 켜진다.',
    '국장의 얼굴. 국장의 목소리. 국장이 입을 여는데, 그 입이 국장의 얼굴과 미묘하게 어긋난다.',
    '"본 시각부로 애시그리드 전역에 계엄을 선포한다."',
    '거리에는 시민이 없었다. 자정 이전에 이미 없었다.',
    '거리에는 사이렌과 장갑차와 드론 스웜만 있었다.',
    '세 번째로 도시가 배운 사실:',
    '블록보다 강한 것은 국가다. 아주 가끔, 잠깐 동안만.',
  ];
  // [그대로] chapter-03 §5 스토리 카드 원문.
  var STORY_CARD = '계엄은 임시 조치라고 한다. 시민들은 그 말을 자주 듣는다. 그래서 그 말을 믿지 않는다.';
  // [그대로] chapter-03 §오프닝 리프레인.
  var REFRAIN = '블록보다 강한 것은 국가다. 아주 가끔, 잠깐 동안만.';

  // ---- 전투 인카운터 (미드타운 병영 검문소 6열 × 8행) --------------------------
  //  좌표 {x:열 0..5, y:행 0..7}. row0=상단(계엄 통제 단말), row7=하단(고스트 진입).
  //  [계승 docs/10 §5 미드타운 F3 북 경찰서 인접 병영 · 십자방어선] 무대.
  //  [각색 docs/01] 검문소 병력 = IRONWALL 외주 진압대(POLICE_*·RIOT_ENFORCER).
  //  wall  : 이동+LoS 완전 차단(불투명). cover : 이동 차단·LoS 투과, DEF 보정만.
  var COMBAT = {
    cols: 6, rows: 8,
    playerStart: { x: 2, y: 7 },
    // 오브젝티브 = 계엄 통제 단말 무력화(threshold 누적 차감 = objective-reduce = CIPHER 대체 승리).
    //  effective threshold = 9 + veil 0 = 9. dataTB 0 = 데이터 탈취가 아닌 '무력화' 표기.
    objective: { x: 2, y: 0, threshold: 9, veil: 0, label: '계엄 통제 단말', dataTB: 0 },
    // [계승 ch01/02 · 각색 chapter-03 계엄 압박] 위협 임계 낮은 cap → 증원 빠름(계엄 페이싱).
    threatCap: 6,
    reinforcement: { key: 'POLICE_DRONE', x: 5, y: 1 },
    // [계승 chapter-03 §봉투 C-1 검문소 토큰] 장갑 바리케이드 2개 → 중앙 통로 차단(측면 우회 강제).
    walls: [
      { x: 2, y: 5 }, { x: 3, y: 5 },
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1. 열 0·5(측면 우회로)는 비워 도달성 보장.
    cover: [
      { x: 1, y: 3, type: 'light' }, { x: 4, y: 3, type: 'light' },
      { x: 1, y: 6, type: 'light' }, { x: 4, y: 6, type: 'light' },
    ],
    // 적 배치 — key 는 data/enemies.js 참조(통합 단계에서 POLICE_*·RIOT_ENFORCER 추가).
    //  전 적 물리 피해 가능(physImmune 없음) → 전멸=승리(BLADE 정면) MFU 보장.
    //  RIOT_ENFORCER = DEF5 방패·advance(진압 지휘관), 중앙 저지. 드론 2기 측면 사수.
    enemies: [
      { key: 'POLICE_OFFICER', x: 1, y: 4 },   // 좌 진압병
      { key: 'POLICE_OFFICER', x: 4, y: 4 },   // 우 진압병
      { key: 'POLICE_DRONE',   x: 0, y: 2 },   // 좌 정찰 드론(사수)
      { key: 'POLICE_DRONE',   x: 5, y: 2 },   // 우 정찰 드론(사수)
      { key: 'RIOT_ENFORCER',  x: 2, y: 2 },   // 방패 지휘관(DEF5·advance) — 단말 앞 저지
    ],
  };

  // ---- 대화 그래프 (docs/25 §4.2 노드 스키마) ----------------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      // 오프닝 — 계엄 선포(도시 전역). 고스트 시점 서술.
      intro: {
        id: 'intro', speaker: 'GHOST', portrait: 'ghost',
        text: OPENING.join('\n'),
        choices: [
          { label: '지하 저항소의 신호에 응한다', goto: 'brief' },
        ],
      },
      // 의뢰 브리핑 — [계승 chapter-03 §지하 저항소] Ghost 전용 안전지대·정보 거점(블록 감지 불가).
      //  [각색 quest-deck Q32 계엄 밤 생존] 의뢰인 익명. 계엄 통제 단말을 내리거나 검문선을 무너뜨려 봉쇄 해제.
      brief: {
        id: 'brief', speaker: 'RESISTANCE', portrait: 'ghost',
        text: '폐허 아래, 블록의 눈이 닿지 않는 지하 저항소. 얼굴 없는 목소리가 접선한다.\n' +
              '"봉쇄를 풀 방법은 둘. 미드타운 북 경찰서 옆 병영의 계엄 통제 단말을 내리거나, 검문선 자체를 무너뜨리는 것."\n' +
              '"검문소를 지키는 건 IRONWALL 외주 진압대다. 국가는 이미 오래전에 그들에게 외주를 줬지."',
        choices: [
          { label: '미드타운 검문소로 향한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — DEF 게이트가 전투를 실제로 제거, 전투는 이중 승리(전멸/단말 해킹).
      //  [계승 docs/10 §5 십자방어선] 병영 검문소 묘사.
      approach: {
        id: 'approach', speaker: 'IRONWALL', portrait: 'bloc',
        text: '미드타운 북 경찰서 인접 병영. 장갑 바리케이드가 도로를 가르고, 방패를 든 진압 지휘관 뒤로 ' +
              '진압병과 정찰 드론이 십자 방어선을 편다. 벽면의 계엄 통제 단말이 붉게 깜박인다.',
        choices: [
          { label: '진압 분대와 정면으로 교전한다',
            effect: { startCombat: { onWin: 'outro' } },
            desc: '전투 개시 → 분대 전멸(BLADE 정면) 또는 통제 단말 해킹(CIPHER objective-reduce). 이중 승리, 양 클래스 완주.',
          },
          { label: '[DEF 3] 방패 벽을 밀어붙여 검문선을 붕괴시킨다',
            gate: { attr: 'def', min: 3 }, show: 'gray',
            setFlags: { shieldBreach: true },
            effect: { skipCombat: true }, goto: 'outroBreach',
            desc: 'BLADE DEF3 통과 → 전투 스킵(지름길). CIPHER DEF1 잠김 → 위 정면 교전으로 완주.',
          },
          { label: '[flag 계승] 지난 침투의 흔적을 역이용한다',
            gate: { flag: 'extractionStyle' }, show: 'gray',
            setFlags: { martialFeint: true },
            effect: { skipCombat: true }, goto: 'trace',
            desc: 'ch02 완주로 남긴 추출 흔적이 이 선택지를 연다 — 前 미션 분기가 후속을 실제로 바꿈(영속 flag). ' +
                  '(SIMPLIFIED: 엔진 flag 게이트는 참 여부뿐 → loud 한정 아닌 흔적 존재로 근사)',
          },
        ],
      },
      // 전투 승리 후 아웃트로 — 전멸(BLADE)·단말 해킹(CIPHER) 양 승리가 이 노드로 수렴(onWin).
      //  [계승 DRONE OVERRIDE] 단말이 꺼지면 드론 스웜이 명령을 잃는다.
      outro: {
        id: 'outro', speaker: 'GHOST', portrait: 'ghost',
        text: '검문선이 무너진다. 진압 분대는 제압됐고, 계엄 통제 단말은 침묵한다.\n' +
              '단말이 꺼지자 드론 스웜이 명령을 잃고 허공에서 표류한다. 봉쇄 격자에 구멍이 뚫린다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { martialBreached: true } }, checkpoint: true,
        choices: [ { label: '봉쇄가 풀린 틈으로 빠져나온다', goto: 'choice' } ],
      },
      // DEF 게이트 우회 아웃트로 — 방패 벽을 밀어붙여 검문선 붕괴(전투 스킵).
      outroBreach: {
        id: 'outroBreach', speaker: 'GHOST', portrait: 'ghost',
        text: '어깨로 방패 벽을 받아 안쪽으로 접는다. 진압대가 대열을 잃고, 검문선이 통째로 무너진다.\n' +
              '지휘관이 균형을 잡기 전에, 계엄 통제 단말은 무방비로 남는다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { martialBreached: true } }, checkpoint: true,
        choices: [ { label: '무너진 검문선을 넘어간다', goto: 'choice' } ],
      },
      // 계승 flag 우회 아웃트로 — 前 미션 흔적을 미끼로 순찰 유인(전투 스킵). 분기 영속 시연.
      trace: {
        id: 'trace', speaker: 'GHOST', portrait: 'ghost',
        text: '지난 침투가 병영 통신망에 남긴 서명 — IRONWALL은 그것을 추적 표식으로 걸어두었다.\n' +
              '그 표식을 스스로 미끼로 흘려, 순찰을 검문소 반대편으로 유인한다.\n' +
              '검문소가 잠시 비는 그 틈에, 계엄 통제 단말을 조용히 내린다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { martialBreached: true } }, checkpoint: true,
        choices: [ { label: '유인이 끝나기 전에 빠져나온다', goto: 'choice' } ],
      },
      // ★플레이어 선택 [각색 chapter-03 §플레이어 선택 Ghost] — "잠행할 것인가, 맞설 것인가?"
      choice: {
        id: 'choice', speaker: 'GHOST', portrait: 'ghost',
        text: '"항복도 도주도 대항도 오늘 밤의 선택이다. — 잠행할 것인가, 계엄에 맞설 것인가?"',
        choices: [
          { label: 'A. 잠행 — 흔적을 지우고 지하로 사라진다',
            setFlags: { curfewChoice: 'evade', wantedReset: true },
            effect: { wantedZero: true }, goto: 'settle',
            desc: '[각색 §Ghost A 잠행] 현상수배 리셋 · 지하 저항소 자유 이용',
          },
          { label: 'B. 저항 — 계엄 해제를 시도한다',
            setFlags: { curfewChoice: 'resist', martialResist: true },
            effect: { rep: 10 }, goto: 'settle',
            desc: '[각색 §Ghost B 저항] 렙 +10 대규모(영속) · 계엄 해제 퀘스트 해금',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'GHOST', portrait: 'ghost',
        text: '계엄의 밤이 지난다. 공권력 트랙 최대치가 한 칸 더 올라, 도시는 더 오래 병영으로 남는다.\n' +
              '지하 저항소는 오늘 밤을 일지에 기록한다. 계엄은 임시 조치였다 — 자주 듣던 그 말.\n' +
              '거리가 잠잠해지자, 사람들이 자신의 몸을 개조하기 시작했다. → Chapter 04: "Price of Splice"',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 [계승 chapter-03 §챕터 효과 · ch01/02 스케일 유지] --------------
  var REWARDS = {
    rep: 4,               // 챕터 클리어 영구 렙 +4 (계엄 밤 · ch02 3 → 4)
    heatCapDelta: 1,      // [계승 chapter-03 §챕터 효과] 공권력 트랙 최대치 +1 (계엄 트랙 상향)
    karma: 2,             // 성장 소비용 karma
    nuyen: 10,            // ₵ 보상 (Q32 계열, ch02 9 → 10)
    // unlocks 없음 — 신규 능력 카드 없음(DRONE OVERRIDE/CHECKPOINT BRIBE 는 산문 모티프).
  };

  var MISSION = {
    id: 'ch03-martial-night',
    title: 'Chapter 03 — Martial Night',
    subtitle: '미드타운 검문소 돌파 — 계엄 통제 단말 무력화',
    envelope: 'C',
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
    // [통합 메타데이터] 미션 레지스트리 도입 전까지 미소비 — 직전 챕터 클리어 요구.
    unlock: { missionsDone: ['ch02-insider-game'] },
    nextHint: 'Chapter 04: "Price of Splice" — 누적 TL 4 달성 시 해금',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_CH03 = API;
})();
