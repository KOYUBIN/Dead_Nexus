;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-d2-last-signal.js — ACT 2 브랜치 D "RUIN SURVIVORS" D2
  //   "LAST SIGNAL" — 죽은 도시를 통째로 뜯어가려는 MERIDIAN 수확기를 멈춘다.
  //   (엔진 무편집 콘텐츠. 포맷 정본 = ch01/a2-00-framing/a2-d1-scavenge. 순수 리터럴.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (act2_plan.md §2 브랜치 D · §2.0 MFU 2연전):
  //   갈래 정체성 dead-nexus [계승 ending.js 'dead-nexus'] 폐허 생존 시나리오 — D1 계승.
  //                    해금 = endingSeen:['dead-nexus'] + missionsDone:['a2-d1-scavenge'].
  //   신규 세력 MERIDIAN [신규 61차] 수확기(Warlord 지휘)로 죽은 도시를 성벽 밖으로 실어간다.
  //   의뢰인 FLINT       [계승] lore_module.snapshot GHOSTS.DRIFTER = FLINT(Dane Cross).
  //                    quote:'DRIFTER' → FLINT 명대사 버블("Ashgrid isn't a city. It's a
  //                    cage with good lighting." 원문). D1 의뢰인 연속성.
  //   무대(무법지대)     [신규 · Ring5 F1/F11 미사용] 비통제구역 접경 무법지대 — 성벽 출입구.
  //   MFU 2연전          [act2_plan.md §2.0] enc① = MISSION.combat(탈출로 게이트),
  //                    enc② = MISSION.encounters.stage2(수확기 코어 · MERIDIAN_WARLORD 보스).
  //   보스 MERIDIAN_WARLORD [신규 61차 · enemies.js] ASH 전쟁군주 hp24 — Act2 외부 위협 보스.
  //   [flag ruinCoreData] 게이트 [계승 D1] a2-d1-scavenge outro 가 세우는 계승 flag —
  //                    D1 에서 확보한 잔해 코어 데이터로 수확기 프로토콜을 역이용(연속성).
  //   실패=선택 리프레인  [발췌 chapter-08 §엔딩4 · ending.js dead-nexus] REFRAIN 재인용.
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: MISSION.kind='act2' / unlock.endingSeen·missionsDone 는 campaign.js §3.2 소비.
  // SIMPLIFIED: enc② [flag ruinCoreData] 는 D1 이 세우는 계승 flag — 이 미션에서 set 안 함 →
  //   검증기 info("계승 플래그로 가정"). D1 완주가 해금 전제라 실전 항상 참(지름길 상시).
  // ==========================================================================

  // ---- 원전 산문 앵커 (chapter-08 §엔딩4 + lore FLINT, Act2 폐허 생존 D2) ---------
  var OPENING = [
    '성벽 접경. 비통제구역으로 넘어가는 마지막 출입구. 죽은 도시의 잔해가 컨베이어에 실려 성벽 밖으로 흘러 나간다.', // [신규 · Ring5 무법지대]
    '[FLINT] "저게 MERIDIAN 수확기야. 도시를 통째로 뜯어서 실어가는 기계. 넥서스도, 우리 집도, 전부 저 벨트 위에 있어."', // [계승] lore FLINT
    'FLINT의 손이 운전대를 놓지 않는다. 멈추면 표적이 되니까 — 애시그리드는 도시가 아니라, 조명 좋은 우리였을 뿐이니까.', // [계승] lore snapshot DRIFTER 명대사 정신
    '"수확기 코어를 멈추면 저들의 벨트가 선다. 그러면 우리는 폐허를 우리 손에 남겨둘 수 있어. 죽은 채로라도, 우리 것으로."', // [신규] 의뢰
    '"근데 코어를 지키는 놈이 있어. MERIDIAN 전쟁군주. 저놈은 이름 같은 건 안 믿어. 뜯어갈 잔해만 보지."', // [신규] MERIDIAN_WARLORD 보스
    '이건 탈환이 아니다 — 죽은 도시를 죽은 채로 지키는 마지막 신호다.', // [계승] 폐허 생존 프레이밍
  ];
  var STORY_CARD = 'MERIDIAN 수확기 코어가 멈춘다. 컨베이어가 서고, 성벽 밖으로 흐르던 도시의 잔해가 제자리에 남는다. 죽은 애시그리드는 이제 죽은 채로, 그러나 우리 것으로 남는다.';
  var REFRAIN = '이것은 실패가 아니라 선택이었다 — 어떤 이름에도 굴하지 않은 마지막 선택.'; // [발췌] chapter-08 §엔딩4

  // ---- enc① = MISSION.combat (무법지대 탈출로 게이트 7열 × 8행) -----------------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(탈출로 게이트), row7=하단(밀수단 진입).
  //  [신규 · Ring5 F1/F11 무법지대] 무대. wall=성벽 잔해, cover=컨테이너/차량 엄폐.
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    // enc① 오브젝티브 = 탈출로 게이트(threshold 10, enc① 밴드 — 카탈로그 §2 D2 ①).
    objective: { x: 3, y: 0, threshold: 10, veil: 0, label: '탈출로 게이트', dataTB: 0 },
    threatCap: 8,
    walls: [
      { x: 1, y: 3 }, { x: 5, y: 3 },   // 성벽 잔해 2개 — 좌우 사각 형성
    ],
    cover: [
      { x: 2, y: 5, type: 'light' }, { x: 4, y: 5, type: 'light' }, { x: 3, y: 4, type: 'light' },
    ],
    // 카탈로그 §2 D2 enc①: MERIDIAN_STALKER×2 + MERIDIAN_DRONE.
    //   STALKER = SHADE 저격(게이트 압박), DRONE = VOLT 기계(DATA SPIKE 대상).
    enemies: [
      { key: 'MERIDIAN_STALKER', x: 2, y: 2 },
      { key: 'MERIDIAN_STALKER', x: 4, y: 2 },
      { key: 'MERIDIAN_DRONE',   x: 3, y: 3 },
    ],
  };

  // ---- enc② = MISSION.encounters.stage2 (수확기 코어 · WARLORD 보스 7열 × 8행) ---
  var ENCOUNTERS = {
    stage2: {
      cols: 7, rows: 8,
      playerStart: { x: 3, y: 7 },
      // enc② 오브젝티브 = MERIDIAN 수확기 코어(threshold 12, enc② 높은 밴드 — 카탈로그 §2 D2 ②).
      objective: { x: 3, y: 0, threshold: 12, veil: 0, label: 'MERIDIAN 수확기 코어', dataTB: 0 },
      threatCap: 9,
      reinforcement: { key: 'MERIDIAN_DRONE', x: 6, y: 1 },   // 카탈로그 §2 D2 enc② 증원 MERIDIAN_DRONE
      walls: [
        { x: 2, y: 4 }, { x: 4, y: 4 },   // 코어 격벽 — 전쟁군주 정면 접근 통제
      ],
      cover: [
        { x: 1, y: 5, type: 'light' }, { x: 5, y: 5, type: 'light' }, { x: 3, y: 6, type: 'full' },
      ],
      // 카탈로그 §2 D2 enc②: MERIDIAN_WARLORD(보스) + MERIDIAN_VANGUARD×2 (증원 MERIDIAN_DRONE).
      //   WARLORD = ASH 전쟁군주 보스(hp24), VANGUARD×2 = IRON 중장 호위.
      enemies: [
        { key: 'MERIDIAN_WARLORD',  x: 3, y: 1 },   // ★보스 — 코어 수호
        { key: 'MERIDIAN_VANGUARD', x: 2, y: 3 },
        { key: 'MERIDIAN_VANGUARD', x: 4, y: 3 },
      ],
    },
  };

  // ---- 대화 그래프 (MFU §2.0 2연전) --------------------------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'FLINT', portrait: 'ghost',
        quote: 'DRIFTER',                      // loreQuote(DRIFTER) → FLINT 명대사 버블(어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: '무법지대 접경으로 향한다 — 탈출로 게이트를 연다', goto: 'approach' },
        ],
      },
      // ★enc① approach — 무력 / [DEF3] 두 출구가 interlude 로 합류 (2연전 1단).
      approach: {
        id: 'approach', speaker: 'FLINT', portrait: 'ghost',
        text: '성벽 잔해 사이로 MERIDIAN 저격수 둘이 탈출로 게이트를 봉쇄했다. 드론 하나가 상공에서 표적을 훑는다.\n' +
              '벨트는 아직 돌아간다 — 도시의 잔해가 성벽 밖으로 실려 나가는 소리가 멈추지 않는다.',
        choices: [
          { label: '탈출로 게이트를 정면으로 돌파한다',
            effect: { startCombat: { onWin: 'interlude' } },
            setFlags: { gateBreached: true },
            desc: 'enc① MERIDIAN_STALKER×2 + MERIDIAN_DRONE 와 전투 → 게이트 확보 (공통 폴백, 4클래스 완주)',
          },
          { label: '[DEF 3] 저격 사선을 방벽으로 버티며 게이트를 강행 개방한다',
            gate: { attr: 'def', min: 3 }, show: 'gray',
            setFlags: { gateHeld: true },
            effect: { skipCombat: true }, goto: 'interlude',
            desc: '고DEF(RIGGER/MOLE 축) → 저격을 견디고 게이트 개방(지름길). 저DEF 클래스는 잠김 → enc① 전투로 폴백',
          },
        ],
      },
      // ★interlude — 서사 전환 + enc② approach 게이트. startCombat.encounter:'stage2' 소비.
      interlude: {
        id: 'interlude', speaker: 'FLINT', portrait: 'ghost',
        text: '게이트 너머, 수확기 코어가 심장처럼 뛴다. 그 앞을 MERIDIAN 전쟁군주가 가로막는다 — 도끼처럼 넓은 어깨, 이름을 믿지 않는 눈.\n' +
              '"저놈이 코어야. 저놈을 멈추면 벨트가 선다. 숨 한 번 고르고 — 이게 마지막 신호다."',
        choices: [
          { label: '전쟁군주를 돌파하고 수확기 코어를 멈춘다',
            effect: { startCombat: { encounter: 'stage2', onWin: 'outro' } },
            setFlags: { warlordEngaged: true },
            desc: 'enc② MERIDIAN_WARLORD(보스) + VANGUARD×2 (증원 DRONE)와 전투 → 코어 정지 (공통 폴백)',
          },
          { label: '[HACK 4] 코어 프로토콜에 직접 침투해 수확기를 안에서 정지시킨다',
            gate: { attr: 'hack', min: 4 }, show: 'gray',
            setFlags: { coreHacked: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: '고HACK(CIPHER 축) → 코어 직결 정지, 전투 스킵(지름길). 저HACK 클래스는 잠김 → enc② 전투로 폴백',
          },
          { label: '[flag ruinCoreData] D1의 잔해 코어 데이터로 수확기 인증을 역이용해 벨트를 역회전시킨다',
            gate: { flag: 'ruinCoreData' }, show: 'gray',
            setFlags: { harvesterReversed: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'D1(a2-d1-scavenge) 잔해 코어 데이터 계승 → 수확기 인증 역이용, 전투 스킵. flag 없으면 잠김 → enc② 전투로 폴백',
          },
        ],
      },
      // 2연전 공통 아웃트로 — 전투/스킵 어느 경로든 결과는 같다(수확기 정지).
      outro: {
        id: 'outro', speaker: 'FLINT', portrait: 'ghost',
        text: '코어가 꺼진다. 컨베이어가 비명처럼 멈추고, 성벽 밖으로 흐르던 도시가 제자리에 얼어붙는다.\n' +
              '"멈췄어." FLINT가 처음으로 운전대를 놓는다. "도시는 죽었지만 — 적어도 우리 손에 죽은 채로 남았어."\n' + STORY_CARD,
        onEnter: { setFlags: { harvesterStopped: true, ruinHeld: true } }, checkpoint: true,
        choices: [ { label: '멈춘 수확기를 뒤로하고 물러선다', goto: 'choice' } ],
      },
      // ★플레이어 선택 [계승 chapter-01 §플레이어 선택 · dead-nexus 톤] — "실패가 아니라 선택"
      choice: {
        id: 'choice', speaker: 'FLINT', portrait: 'ghost',
        text: '"수확기는 멈췄어. 이제 저 코어를 부술까 — 아니면 남겨서 성벽 밖 놈들에게 경고로 걸어둘까?"\n' +
              '도시를 되살릴 수는 없다. 그러나 죽은 도시를 어떻게 지킬지는, 끝까지 우리 선택이다.',
        choices: [
          { label: 'A. 수확기를 완전히 파괴한다 — 두 번 다시 도시를 뜯지 못하게',
            setFlags: { harvesterChoice: 'destroy', ruinSealed: true },
            effect: { rep: 4 }, goto: 'settle',
            desc: '렙 +4 · 폐허를 봉인 (영속 flag)',
          },
          { label: 'B. 코어를 경고로 걸어둔다 — 성벽 밖 MERIDIAN에게 값을 알린다',
            setFlags: { harvesterChoice: 'warn', ruinDeterrent: true },
            effect: { karma: 1 }, goto: 'settle',
            desc: 'karma +1 · 억지력 확보 (영속 flag)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'FLINT', portrait: 'ghost',
        text: '멈춘 수확기 위로 폐허의 밤이 내려앉는다. 애시그리드는 도시가 아니었다 — 조명 좋은 우리였을 뿐. 그러나 이 밤엔, 그 우리마저 우리 것이다.\n' +
              'MERIDIAN은 다시 온다. 그러나 오늘 밤, 죽은 도시는 스스로의 이름으로 남았다.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '밀수단 은신처로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (Act2 메인 2연전 2단 · 보스전 — 카탈로그 §2 D2) ---------------
  var REWARDS = {
    rep: 8,
    karma: 3,
    nuyen: 15,
    unlocks: [],
  };

  var MISSION = {
    id: 'a2-d2-last-signal',
    title: 'Act 2·D2 — Last Signal',
    subtitle: 'RUIN SURVIVORS — MERIDIAN 수확기 정지 (무법지대 · 의뢰인 FLINT · 2연전 보스)',
    kind: 'act2',
    unlock: { missionsDone: ['ch08-zero-day', 'a2-d1-scavenge'], endingSeen: ['dead-nexus'] }, // §3.2 · D1 선행.
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                                           // enc①
    encounters: ENCOUNTERS,                                   // enc②(stage2) — 2연전 §3.1
    rewards: REWARDS,
    nextHint: '브랜치 D "RUIN SURVIVORS" 완주. 다른 엔딩 갈래는 NG+ endingSeen 누적으로 개방.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_D2_LAST_SIGNAL = API;
})();
