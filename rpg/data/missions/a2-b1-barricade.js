;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-b1-barricade.js — ACT 2 브랜치 B "ASH REPUBLIC" B1
  //   "THE BARRICADE" (2연전 멀티 인카운터 · 엔진 무편집 콘텐츠)
  //   포맷 정본 = ch01-first-blood.js / a2-00-framing.js. 순수 리터럴.
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (act2_plan.md §1·§2 브랜치 B):
  //   서사 갈래 street-rising [계승] ending.js 'street-rising' — 블록 체제 해체, 고스트의
  //                    무정부/협동 도시("ASH REPUBLIC"). 어린 자유도시를 MERIDIAN 약탈대가
  //                    시험한다. unlock.endingSeen:['street-rising'] 로 이 갈래만 개방(§3.2).
  //   신규 세력 MERIDIAN [신규 61차] 성벽 너머 외부 기업 연합. data/enemies.js MERIDIAN_* 참조.
  //   의뢰인 SILK       [계승] lore_module BROKER=SILK(Sera Holt) — 거리 평의회 해결사.
  //                    quote:'BROKER' → loreQuote 가 SILK 명대사 버블 삽입(어댑터).
  //   무대(다운타운 폐허) [신규 · Ring4 ASH 밀집 다운타운 폐허 바리케이드] Act2 미사용 무대축.
  //   2연전 (61차 스키마) [신규] enc① = MISSION.combat(바리케이드 관제 th8) → interlude(중간
  //                    대화·숨 고르기) → enc② = MISSION.encounters.stage2(약탈대 신호탑 th11).
  //                    interlude 노드 effect.startCombat:{encounter:'stage2',onWin:'outro'} 로
  //                    store.dialogueChoose 가 encounters.stage2 를 buildCombat 오버라이드 소비.
  //                    HP 는 인카운터마다 buildCombat 풀회복(중간 대화 = 재정비 서사). 하드모드
  //                    적 스탯 +25% 는 store enemyScale 로 두 인카운터 모두 자동 전파(엔진).
  //   MFU 게이트 다양   [계승 docs/25 §4.4] enc① [SPD4] 측면 우회 / enc② [ATK5]·[flag
  //                    allBlocsHostile] 두 지름길. 무력 전투 경로가 항상 열려 4클래스 완주 보장.
  //   flag allBlocsHostile [계승] ch01 영웅 선택 파생 flag(street-rising 정체성). 미설정 시
  //                    검증기 info(계승 가정) — 지름길만 잠기고 전투 폴백 상존(MFU).
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: MISSION.kind='act2' / MISSION.unlock 은 61차 campaign.js 레지스트리 소비.
  //   B2 해금은 이 미션 클리어(missionsDone) → B2.unlock.missionsDone:['a2-b1-barricade'].
  // ==========================================================================

  // ---- 산문 앵커 (street-rising 후일담 톤 · MERIDIAN [신규] 소개) --------------
  var OPENING = [
    '블록은 무너졌다. 그 자리에 이름 없는 자유도시가 섰다 — 거리가 스스로를 다스리는, 아직 어린 애시그리드.', // [계승] street-rising 엔딩
    '[SILK] "축하는 짧았어. 성벽 밖에서 벌써 시험이 왔거든." 중개인의 목소리가 메시를 타고 낮게 깔린다.', // [계승] SILK 의뢰인
    '"MERIDIAN 약탈대가 다운타운 폐허 경계까지 밀고 들어왔어. 바리케이드가 흔들려. 관제부터 되찾아 줘."', // [신규] MERIDIAN 위협
    'MERIDIAN. 어느 블록의 문장도 아니다. 죽은 도시를 뜯어가려는 외부의 손 — 그리고 자유도시가 얼마나 무른지 재고 있다.', // [신규] 세력 정의
    '"바리케이드를 다시 세우면 끝이 아니야. 저들은 신호탑으로 다음 파도를 부르거든. 둘 다 꺼야 해." SILK가 잠깐 멈춘다.', // [신규] 2연전 프레이밍
    '이건 방어가 아니라 선언이다 — 이 거리는 아직 누구의 잔해도 아니라는.', // [계승] ASH REPUBLIC 톤
  ];
  var STORY_CARD = '바리케이드가 다시 선다. 약탈대의 신호탑이 침묵한다. 자유도시는 첫 밤을 버텼다 — 그러나 성벽 밖의 계산은 이제 시작이다.';
  var REFRAIN = '이 거리는 아직 누구의 잔해도 아니다.';

  // ---- enc① 인카운터 (다운타운 폐허 바리케이드 6열 × 8행) ---------------------
  //  좌표 {x:열 0..5, y:행 0..7}. row0=상단(바리케이드 관제), row7=하단(진입로).
  //  [신규] 폐허 바리케이드 무대. wall=무너진 방벽(LoS 차단), cover=잔해/컨테이너 엄폐.
  var COMBAT = {
    cols: 6, rows: 8,
    playerStart: { x: 2, y: 7 },
    // 오브젝티브 = 바리케이드 관제 콘솔(threshold 누적 차감). [계승 store applyHackObjective]
    //   인접 유닛 max(HACK,ATK) 자동축 → 4클래스 모두 다른 축으로 완주(부가 승리 경로).
    objective: { x: 2, y: 0, threshold: 8, veil: 0, label: '바리케이드 관제', dataTB: 0 },
    threatCap: 8,
    reinforcement: { key: 'GANG_THUG', x: 5, y: 1 },   // 거리 자경/약탈 잔당 재활용(경보 1회)
    walls: [
      { x: 1, y: 4 },   // 무너진 방벽(좌측 통로 차단 → 우회 유도)
    ],
    cover: [
      { x: 1, y: 3, type: 'light' }, { x: 4, y: 3, type: 'light' },
      { x: 2, y: 5, type: 'light' }, { x: 3, y: 5, type: 'light' },
    ],
    // 적 배치 — MERIDIAN_STALKER×2(SHADE 저격) + GANG_THUG(거리 갱 재활용).
    //   전 적 killable → 전멸/오브젝티브 이중 승리(MFU). 소~중형 구성으로 4클래스 완주 여유.
    enemies: [
      { key: 'MERIDIAN_STALKER', x: 1, y: 2 },
      { key: 'MERIDIAN_STALKER', x: 4, y: 2 },
      { key: 'GANG_THUG',        x: 2, y: 3 },
    ],
  };

  // ---- enc② 인카운터 (약탈대 신호탑 6열 × 8행 · MISSION.encounters.stage2) -----
  //  interlude 노드가 startCombat:{encounter:'stage2'} 로 소비. HP 는 이 시점 풀회복.
  var STAGE2 = {
    cols: 6, rows: 8,
    playerStart: { x: 2, y: 7 },
    objective: { x: 3, y: 0, threshold: 11, veil: 0, label: '약탈대 신호탑', dataTB: 0 },
    threatCap: 9,
    reinforcement: { key: 'MERIDIAN_STALKER', x: 0, y: 1 },   // 증원(경보 1회) — 카탈로그 지정
    walls: [
      { x: 4, y: 4 },   // 무너진 방벽(우측 차단 → 좌측 압박 레인)
    ],
    cover: [
      { x: 2, y: 3, type: 'light' }, { x: 3, y: 3, type: 'light' },
      { x: 1, y: 5, type: 'light' }, { x: 4, y: 5, type: 'light' },
    ],
    // MERIDIAN_VANGUARD×2(IRON 중장 전위) + MERIDIAN_DRONE(VOLT 기계, DATA SPIKE 대상 ·
    //   BLADE 물리 완주 보장). enc①보다 threshold·중장 밀도 상향(2연전 페이싱).
    enemies: [
      { key: 'MERIDIAN_VANGUARD', x: 1, y: 2 },
      { key: 'MERIDIAN_VANGUARD', x: 4, y: 2 },
      { key: 'MERIDIAN_DRONE',    x: 2, y: 1 },
    ],
  };

  // ---- 대화 그래프 (MFU §2.0 2연전: intro→approach→[enc①]→interlude→[enc②]→outro→choice→settle)
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'SILK', portrait: 'ghost',
        quote: 'BROKER',                       // loreQuote(BROKER) → SILK 명대사 버블
        text: OPENING.join('\n'),
        choices: [
          { label: '다운타운 폐허 바리케이드로 향한다', goto: 'approach' },
        ],
      },
      // ★enc① 진입 MFU 노드 — 전투 / [SPD4] 측면 우회 두 출구가 모두 interlude 합류.
      approach: {
        id: 'approach', speaker: 'SILK', portrait: 'ghost',
        text: '무너진 방벽 사이로 약탈대가 붙었다 — MERIDIAN 저격수 둘이 잔해에 몸을 숨기고, 거리 갱 하나가 앞을 막는다.\n' +
              '바리케이드 관제 콘솔은 저 위, 신호가 끊겼다 깜박인다. 먼저 관제를 되찾아야 한다.',
        choices: [
          { label: '정면으로 관제를 탈환한다',
            effect: { startCombat: { onWin: 'interlude' } },
            setFlags: { barricadeContested: true },
            desc: 'enc① MERIDIAN 저격수 2 + 거리 갱과 전투 → 바리케이드 관제 확보 (공통 폴백, 4클래스 완주 가능)',
          },
          { label: '[SPD 4] 잔해 사이로 측면을 돌아 관제 콘솔만 조용히 되살린다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { barricadeFlanked: true },
            effect: { skipCombat: true }, goto: 'interlude',
            desc: '고SPD 측면 기동 → enc① 교전 없이 관제 복구(지름길). 저SPD 클래스는 잠김 → 전투로 폴백',
          },
        ],
      },
      // ★interlude — 숨 고르기(HP 풀회복 서사 정당화) + enc② 진입. combat 선택지가 stage2 를 소비.
      interlude: {
        id: 'interlude', speaker: 'SILK', portrait: 'ghost',
        text: '관제 화면이 되살아난다. 바리케이드가 다시 선다 — 그러나 저 너머, 약탈대 신호탑이 새 파도를 부르고 있다.\n' +
              '[SILK] "숨 돌릴 틈은 지금뿐이야. 신호탑을 끄지 않으면 오늘 밤 내내 몰려와." 거리가 잠시 숨을 고른다.',
        choices: [
          { label: '신호탑으로 밀고 올라간다',
            effect: { startCombat: { encounter: 'stage2', onWin: 'outro' } },
            setFlags: { towerAssault: true },
            desc: 'enc② MERIDIAN 중장 전위 2 + 정찰 드론과 전투 → 신호탑 침묵 (공통 폴백, HP 풀회복 후 개시)',
          },
          { label: '[ATK 5] 신호탑 지주를 힘으로 무너뜨린다',
            gate: { attr: 'atk', min: 5 }, show: 'gray',
            setFlags: { towerToppled: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: '고ATK 강습 → enc② 교전 없이 신호탑 파괴(지름길). 저ATK 클래스는 잠김 → 전투로 폴백',
          },
          { label: '[flag allBlocsHostile] 거리 전체를 규합해 신호탑을 포위한다',
            gate: { flag: 'allBlocsHostile' }, show: 'gray',
            setFlags: { towerSurrounded: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'ch01 영웅 선택(정체 공개 파생 flag) 계승 — 자유도시가 규합해 신호탑 포위, 전투 스킵. flag 없으면 잠김 → 전투로 폴백',
          },
        ],
      },
      // 2연전 아웃트로 — 전투/우회/규합 어느 경로든 결과는 같다(바리케이드 사수·신호탑 침묵).
      outro: {
        id: 'outro', speaker: 'SILK', portrait: 'ghost',
        text: '신호탑이 꺼진다. 약탈대가 폐허 밖으로 물러난다.\n' +
              '[SILK] "버텼어. 자유도시가 첫 밤을 넘겼어." SILK의 목소리에 안도와 경계가 함께 실린다.\n' + STORY_CARD,
        onEnter: { setFlags: { barricadeHeld: true, flintRouteOpen: true } }, checkpoint: true,
        choices: [ { label: '거리를 정비한다', goto: 'choice' } ],
      },
      // 후일담 분기 — 완주 방식이 다음 상태에 영속 반영(street-rising 정체성 강화).
      choice: {
        id: 'choice', speaker: 'SILK', portrait: 'ghost',
        text: '"저들은 다시 와. 자유도시는 어떤 얼굴로 저들을 맞을까?"',
        choices: [
          { label: 'A. 방어를 공표한다 — 이 거리는 굴복하지 않는다',
            setFlags: { ashStance: 'defiant' }, effect: { rep: 2 }, goto: 'settle',
            desc: '렙 +2 (영구) · 자유도시 결의 표명 (영속 flag)' },
          { label: 'B. 신호탑을 조용히 장악한다 — 거리는 유령처럼 지킨다',
            setFlags: { ashStance: 'shadow' }, goto: 'settle',
            desc: '무소음 사수 · 유령 평판 (영속 flag)' },
        ],
      },
      settle: {
        id: 'settle', speaker: 'SILK', portrait: 'ghost',
        text: '바리케이드는 다시 거리의 것이다. 렙과 대금이 평의회 장부를 거쳐 흘러든다.\n' +
              'SILK는 다음 좌표를 넘긴다 — 성벽 밖 항구, FLINT의 밀수 루트가 위험하다. → a2-b2 "FREEPORT"\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (Act2 메인 2연전 B1 — 카탈로그 수치) --------------------------
  var REWARDS = {
    rep: 6,
    karma: 2,
    nuyen: 12,
    unlocks: [],
  };

  var MISSION = {
    id: 'a2-b1-barricade',
    title: 'ASH REPUBLIC — The Barricade',
    subtitle: 'ACT 2 브랜치 B · B1 — 다운타운 폐허 바리케이드 (2연전 · 의뢰인 SILK)',
    kind: 'act2',                                             // 61차 campaign.js 레지스트리 소비(ACT2 보드).
    unlock: { endingSeen: ['street-rising'] },                // street-rising 엔딩 열람 시 갈래 개방(§3.2).
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                                           // enc① (기존 스키마 · startCombat→combat 계약)
    encounters: { stage2: STAGE2 },                           // enc② (61차 멀티 인카운터 스키마)
    rewards: REWARDS,
    nextHint: 'a2-b2 "FREEPORT" — B1 클리어 시 해금 (FLINT 밀수 루트 · 약탈 기함).',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_B1_BARRICADE = API;
})();
