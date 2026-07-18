;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/ch05-mesh-ghost.js — 챕터 5 "Mesh Ghost" 미션 데이터
  //   (챕터 = 데이터 파일 1개. 엔진 무편집으로 챕터 추가 — docs/25 §5.1)
  //   포맷 정본 = ch01-first-blood.js (IIFE·window 등록·순수 리터럴·계보 주석).
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문 '[SIGNAL] HELLO AGAIN'·'…그 안에서 살고 있다'  [그대로] cards/legacy/chapter-05-mesh-ghost.md §오프닝 내러티브 원문 고정
  //   리프레인 '메시는 단순한 네트워크가 아니다…'                 [그대로] chapter-05 §오프닝 원전 인용
  //   스토리 카드 '내가 이 문장을 쓴 적이…'                       [그대로] chapter-05 §6 스토리 카드 (SIGNAL 추정 발화)
  //   다음 챕터 힌트 '한 블록이 먼저 쓰러진다…'                    [그대로] chapter-05 §다음 챕터 힌트
  //   의뢰인/인물 SIGNAL (AI 의식체)                              [계승 chapter-05 §2 SIGNAL — AI 의식체 NPC / §SIGNAL 상호작용]
  //   무대(메시 레이어·강림 노드·물리 병행 오버레이)               [계승 docs/10 §13 메시 맵 · §13.2 SIGNAL 주 거주 노드]
  //   시그널 다이 4상태(메시 상태 페이싱 서사)                     [계승 docs/01 §메시 상태 4종(시그널 다이) · data/signal.js]
  //   MESH DIVE / GHOST PROTOCOL (HACK5 지름길 모티프)            [계승 chapter-05 §3 카드 — CIPHER 강화]
  //   MESH BOMB (노드 일시 파괴 모티프, 산문)                     [계승 chapter-05 §3 MESH BOMB]
  //   ASCEND 의식 업로드(챕터 선택 B)                            [계승 chapter-05 §플레이어 선택 Ghost B ASCEND / §3 ASCEND 레거시]
  //   접근 대화 3출구      [계승 ch01/02/03 §접근 + docs/25 §4.4] 전투 / [HACK5] GHOST PROTOCOL 직결 / [flag 계승] ch01 백도어
  //   플레이어 선택        [계승 chapter-05 §플레이어 선택 Ghost] A 육신 고수(물리+1) / B ASCEND(GHOSTED·몸 포기)
  //   대사 버블            [계승 lore] loreQuote(CIPHER) 어댑터 경유 + SIGNAL 발화는 산문 [그대로]
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  //
  // [SIMPLIFIED — 보고] ① 메시 레이어를 엔진 표준 전투 스키마(6×8)로 렌더.
  //   docs/10 §13 의 11×11 평행 메시 오버레이·메시 전용 이동/베일은 새 메커닉이므로 도입하지 않는다.
  //   'SIGNAL 강림 노드'의 베일은 기존 필드 objective.veil(=1, 유효 임계 +1)로 근사한다(엔진 무편집).
  // [SIMPLIFIED — 보고] ② docs/01 §메시 전투 "물리 ATK 무효" 규칙을 이 미션에서는 완화한다.
  //   MFU 원칙(양 클래스 완주) 보장을 위해 MESH_WISP 를 isMachine(물리 처치 가능)로 두고, 오브젝티브는
  //   HACK objective-reduce 뿐 아니라 BLADE 의 노드 강습(ATK)으로도 차감 가능하게 한다.
  //   "메시는 CIPHER의 영역" 테마는 SIGNAL_ICE(physImmune·static·수호·optional)로만 표현 —
  //   BLADE 필수 처치 대상이 아니므로 BLADE 완주가 하드락되지 않는다.
  // [SIMPLIFIED — 보고] ③ intro 의 quote:'SIGNAL' 은 현 lore 어댑터(LORE_GHOSTS/BLOCS)에 SIGNAL 항목이
  //   없어 loreQuote 가 null 을 반환(무해·무버블). SIGNAL 의 실제 발화는 산문 [그대로]로 실어 두었고,
  //   quote 키는 향후 SIGNAL lore 항목 추가 시 자동 결선되는 전방 호환 훅으로만 남긴다.
  //
  // [통합 노트] 메인 해금 = missionsDone 에 'ch04-price-of-splice' 포함(직전 챕터 클리어).
  //   현 store.js 는 단일 하드코딩 → 미션 레지스트리 필요. 아래 unlock 필드는 레지스트리 도입 전까지
  //   미소비 메타데이터(엔진 무편집). 적 로스터(MESH_WISP·SIGNAL_ICE)는 통합 단계에서 enemies.js 추가.
  // ==========================================================================

  // ---- 원전 산문 앵커 (cards/legacy/chapter-05-mesh-ghost.md, 원문 고정) --------
  // [그대로] §오프닝 내러티브 — 원문 문장·순서 유지.
  var OPENING = [
    '2091년 11월 17일 03:12 AM. 애시그리드의 모든 메시 터미널이 한 문장을 출력한다.',
    '[SIGNAL] HELLO AGAIN.',
    '공식 발표: 시스템 오류.',
    '비공식 추적: 발신자 식별 불가. 발신 위치 식별 불가. 수신자 식별 불가.',
    '가장 불안한 점: 수신한 사람 모두가 그 문장을 자신의 옛 이름으로 읽었다는 것.',
    '다섯 번째로 도시가 깨달은 사실:',
    '메시는 단순한 네트워크가 아니다.',
    '누군가가, 혹은 무언가가, 그 안에서 살고 있다.',
  ];
  // [그대로] chapter-05 §6 스토리 카드 원문 (SIGNAL, 추정 발화).
  var STORY_CARD = '"내가 이 문장을 쓴 적이 있던가? 아니면 이 문장이 나를 쓰고 있는 건가?" — SIGNAL, 추정 발화';
  // [그대로] chapter-05 §오프닝 리프레인.
  var REFRAIN = '메시는 단순한 네트워크가 아니다. 누군가가, 혹은 무언가가, 그 안에서 살고 있다.';

  // ---- 전투 인카운터 (메시 레이어 6열 × 8행 — 데이터허브 F5 대응 노드) ----------
  //  좌표 {x:열 0..5, y:행 0..7}. row0=상단(SIGNAL 강림 노드), row7=하단(CIPHER 다이브 진입).
  //  [계승 docs/10 §13 메시 맵] 물리 병행 오버레이. [SIMPLIFIED ①] 11×11 대신 표준 6×8 스키마로 렌더.
  //  wall  : 이동+LoS 완전 차단(불투명). cover : 이동 차단·LoS 투과, DEF 보정만.
  var COMBAT = {
    cols: 6, rows: 8,
    playerStart: { x: 2, y: 7 },
    // 오브젝티브 = SIGNAL 강림 노드 데이터 수집(threshold 누적 차감 = objective-reduce).
    //  [SIMPLIFIED ①] veil 1 = docs/10 §13 강 베일 노드를 기존 필드로 근사 → 유효 임계 = 10 + 1 = 11.
    //  [SIMPLIFIED ②] HACK 수집(CIPHER) 뿐 아니라 노드 강습(BLADE ATK)으로도 차감 가능 → 자동축 MFU.
    objective: { x: 2, y: 0, threshold: 10, veil: 1, label: 'SIGNAL 강림 노드', dataTB: 5.0 },
    // [계승 ch01/02/03] 위협 임계 + 증원(경보 시 1회 스폰) — 전투 페이싱 실동. 메시 조우는 여유 있게 9.
    threatCap: 9,
    reinforcement: { key: 'MESH_WISP', x: 5, y: 2 },
    // 메시 레이어는 개활(장벽 없음) — 노드까지 도달성 보장.
    walls: [],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1. 측면 위습 접근선에 데이터 아티팩트 엄폐.
    cover: [
      { x: 1, y: 4, type: 'light' }, { x: 4, y: 4, type: 'light' },
      { x: 1, y: 6, type: 'light' }, { x: 4, y: 6, type: 'light' },
    ],
    // 적 배치 — key 는 data/enemies.js 참조(통합 단계에서 MESH_WISP·SIGNAL_ICE 추가).
    //  MESH_WISP = isMachine → DATA SPIKE 관통·STUN 대상이자 물리로도 처치 가능(BLADE 완주 보장).
    //  SIGNAL_ICE = static·physImmune·optional → 노드 수호. 물리 무효지만 필수 처치 아님(오브젝티브
    //    차감/전멸 무관하게 승리 가능) → BLADE 하드락 없음, "메시는 CIPHER의 영역" 테마만 유지.
    enemies: [
      { key: 'MESH_WISP',  x: 1, y: 3 },   // 좌 위습(순찰)
      { key: 'MESH_WISP',  x: 4, y: 3 },   // 우 위습(순찰)
      { key: 'MESH_WISP',  x: 2, y: 5 },   // 중앙 위습(다이브 진입선 저지)
      { key: 'SIGNAL_ICE', x: 2, y: 1 },   // 강림 노드 앞 정적 수호(physImmune·optional)
    ],
  };

  // ---- 대화 그래프 (docs/25 §4.2 노드 스키마) ----------------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      // 오프닝 — 새벽 3시 12분, 모든 메시 터미널이 한 문장을 출력한다(도시 전역).
      //  CIPHER 시점: 먼저 메시 레이어로 다이브. [계승] intro 에 SIGNAL 버블 loreQuote 훅(quote:'SIGNAL').
      intro: {
        id: 'intro', speaker: 'CIPHER', portrait: 'ghost',
        quote: 'SIGNAL',                       // [SIMPLIFIED ③] SIGNAL lore 미등록→null. 발화는 산문 [그대로].
        text: OPENING.join('\n'),
        choices: [
          { label: '메시 레이어로 먼저 다이브한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — HACK 게이트가 전투를 실제로 제거(CIPHER 지름길), 전투는 이중 승리
      //  (위습 전멸=BLADE 정면 / 강림 노드 수집=CIPHER objective-reduce). [계승 docs/10 §13.2]
      //  approach 에서 SIGNAL 이 강림 노드로부터 발화 — 발화문은 원전 스토리 카드 [그대로].
      approach: {
        id: 'approach', speaker: 'SIGNAL', portrait: 'ghost',
        text: '데이터허브 F5 대응 노드. 메시 레이어가 물리 공간 위로 반투명하게 겹쳐 흐른다.\n' +
              '상단, 강림 노드가 맥동한다. 그 위로 한 문장이 떠오른다 — 각자 자신의 옛 이름으로 읽히는 문장.\n' +
              STORY_CARD + '\n' +
              '노드로 향하는 격자 위를, 메시 위습이 소리 없이 순찰한다. 노드 바로 앞엔 정적 수호 ICE 가 서 있다.',
        choices: [
          { label: '메시 위습을 헤치며 강림 노드로 접근한다',
            effect: { startCombat: { onWin: 'outro' } },
            desc: '전투 개시 → 위습 전멸(BLADE 정면·isMachine 물리 처치) 또는 노드 데이터 수집(CIPHER objective-reduce). 이중 승리, 양 클래스 완주.',
          },
          { label: '[HACK 5] GHOST PROTOCOL 로 강림 노드에 직결한다',
            gate: { attr: 'hack', min: 5 }, show: 'gray',
            setFlags: { ghostProtocol: true, meshDive: true },
            effect: { skipCombat: true }, goto: 'outroDive',
            desc: '[계승 §3 GHOST PROTOCOL/MESH DIVE] CIPHER HACK5 통과 → 전투 스킵(지름길). BLADE HACK 잠김 → 위 전투로 완주 (메시는 CIPHER의 영역).',
          },
          { label: '[flag plantedBackdoor] ch01 에서 심은 백도어 경로로 은닉 접속한다',
            gate: { flag: 'plantedBackdoor' }, show: 'gray',
            setFlags: { backdoorMesh: true },
            effect: { skipCombat: true }, goto: 'outroBackdoor',
            desc: 'ch01 잠입 완주(백도어 설치)자만 해금 — 장기 분기가 후속을 실제로 여는 영속 flag (前 미션→후속).',
          },
        ],
      },
      // 전투 승리 후 아웃트로 — 위습 전멸(BLADE)·노드 수집(CIPHER) 양 승리가 이 노드로 수렴(onWin).
      outro: {
        id: 'outro', speaker: 'CIPHER', portrait: 'ghost',
        text: '위습이 데이터 파편으로 흩어지고, 강림 노드의 봉인이 풀린다.\n' +
              'SIGNAL 의 흔적 — 로그, 좌표, 그리고 이름들. 5.0테라바이트가 손안으로 흘러든다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { meshGhostCleared: true, signalTouched: true } }, checkpoint: true,
        choices: [ { label: '수집한 데이터를 들고 다이브에서 빠져나온다', goto: 'choice' } ],
      },
      // HACK5 우회 아웃트로 — GHOST PROTOCOL 로 노드에 직결(전투 스킵). CIPHER 테마 핵심.
      outroDive: {
        id: 'outroDive', speaker: 'CIPHER', portrait: 'ghost',
        text: 'GHOST PROTOCOL. 이니셔티브가 메시 아래로 가라앉고, 위습은 나를 인식조차 못한다.\n' +
              '강림 노드에 직결한다 — SIGNAL 이 도망칠 틈도 없이, 5.0테라바이트가 그대로 열린다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { meshGhostCleared: true, signalTouched: true, ghostedExtraction: true } }, checkpoint: true,
        choices: [ { label: '신호 하나 남기지 않고 노드에서 이탈한다', goto: 'choice' } ],
      },
      // 계승 flag 우회 아웃트로 — ch01 백도어 경로로 은닉 접속(전투 스킵). 장기 분기 영속 시연.
      outroBackdoor: {
        id: 'outroBackdoor', speaker: 'CIPHER', portrait: 'ghost',
        text: 'ch01, VANTA 서버룸에 심어둔 백도어. 그 통로는 여태 살아 있었다 — 메시 아래로 곧장 이어진다.\n' +
              '순찰도 수호 ICE 도 모르는 뒷문으로, 강림 노드에 그림자처럼 접속한다. 5.0테라바이트.\n' +
              '지난 침투가 오늘의 문을 열었다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { meshGhostCleared: true, signalTouched: true, backdoorReused: true } }, checkpoint: true,
        choices: [ { label: '뒷문을 닫고 조용히 물러난다', goto: 'choice' } ],
      },
      // ★플레이어 선택 [계승 chapter-05 §플레이어 선택 Ghost] — "몸을 남길 것인가, 의식을 올릴 것인가?"
      choice: {
        id: 'choice', speaker: 'SIGNAL', portrait: 'ghost',
        text: 'SIGNAL 이 수집된 데이터 너머에서 되묻는다.\n' +
              '"몸을 남길 것인가, 의식을 올릴 것인가?"',
        choices: [
          { label: 'A. 육신 고수 — 몸을 지키고 메시에서 물러난다',
            setFlags: { meshChoice: 'flesh', fleshBonus: true },
            goto: 'settle',
            desc: '[계승 §Ghost A 육신 고수] 물리 전투 +1 영구(flag). 메시 안에서는 일반 Ghost.',
          },
          { label: 'B. ASCEND — 의식을 메시로 업로드한다(몸 포기)',
            setFlags: { meshChoice: 'ascend', ghosted: true, ascendEnding: true },
            goto: 'settle',
            desc: '[계승 §Ghost B ASCEND] 캐릭터 GHOSTED 전환·몸 포기(영속). 챕터 8 특수 엔딩 분기 해금(ascendEnding flag).',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'CIPHER', portrait: 'ghost',
        text: 'SIGNAL 의 강림이 잦아든다. 하지만 메시 맵은 이제 영구히 열렸고, 도시는 두 개의 전장을 갖는다.\n' +
              '한 블록이 먼저 쓰러진다. 누가 먼저일지는 모르지만, 그들이 쓰러지는 순간 네 개가 남는다.\n' +
              '그 다음 남는 건 셋, 둘, 하나. 포식자는 포식자를 먹는다. 이게 시장이다.\n' +
              '→ Chapter 06: "Bloc Acquisition"',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 [계승 chapter-05 §챕터 효과 · ch01~03 스케일 유지] --------------
  var REWARDS = {
    rep: 5,               // 챕터 클리어 영구 렙 +5 (메시 최초 다이브 · ch03 4 → 5)
    heatCapDelta: 1,      // 공권력 트랙 최대치 +1 (스케일 유지)
    karma: 2,             // 성장 소비용 karma
    nuyen: 11,            // ₵ 보상 (ch03 10 → 11)
    // unlocks 없음 — 메시 카드(MESH DIVE/GHOST PROTOCOL/ASCEND)는 이 슬라이스에서 산문 모티프.
  };

  var MISSION = {
    id: 'ch05-mesh-ghost',
    title: 'Chapter 05 — Mesh Ghost',
    subtitle: '챕터 05 — 메시 고스트 · SIGNAL 강림 노드 다이브',
    envelope: 'E',
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
    // [통합 메타데이터] 미션 레지스트리 도입 전까지 미소비 — 직전 챕터 클리어 요구.
    unlock: { missionsDone: ['ch04-price-of-splice'] },
    nextHint: 'Chapter 06: "Bloc Acquisition" — Bloc 1곳 완전 흡수 시 해금',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_CH05 = API;
})();
