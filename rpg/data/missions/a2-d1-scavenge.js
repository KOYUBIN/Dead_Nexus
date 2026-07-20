;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-d1-scavenge.js — ACT 2 브랜치 D "RUIN SURVIVORS" D1
  //   "SCAVENGE" — 무너진 넥서스 잔해에서 살아남은 자들의 첫 발굴.
  //   (엔진 무편집 콘텐츠. 포맷 정본 = ch01/a2-00-framing/side-06. 순수 리터럴.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (act2_plan.md §2 브랜치 D · §2.0 MFU 2연전):
  //   갈래 정체성 dead-nexus [계승 ending.js 'dead-nexus'] "아무도 승리하지 못한다.
  //                    애시그리드는 도시이기를 멈춘다 … 그러나 이것은 실패가 아니라 선택이었다"
  //                    (chapter-08 §엔딩4 발췌) — 폐허 생존 시나리오를 Act2 무대로 계승.
  //                    해금 = endingSeen:['dead-nexus'] (campaign.js §3.2 소비).
  //   신규 세력 MERIDIAN [신규 61차] 성벽 너머 외부 기업 연합 — 시체가 된 도시를 뜯어간다.
  //                    data/enemies.js MERIDIAN_* 계보 주석 참조.
  //   의뢰인 FLINT       [계승] lore_module.snapshot GHOSTS.DRIFTER = FLINT(Dane Cross)
  //                    "멈추면 표적이 되는 밀수 루트의 운전자 … 좋은 조명 아래서 끝내 살아남았다"
  //                    — 미등장 고스트를 Act2 폐허 생존 밀수단 의뢰인으로 첫 승격.
  //                    quote:'DRIFTER' → lore-adapter loreQuote 가 FLINT 명대사 버블 삽입
  //                    ("Ashgrid isn't a city. It's a cage with good lighting." 원문).
  //   무대(넥서스 잔해)   [신규 · F6 폐허화] Act2 미사용 무대축 — ch08 무너진 넥서스의 사후.
  //   MFU 2연전          [act2_plan.md §2.0] intro → approach(enc①) → interlude(enc②) →
  //                    outro → choice → settle. enc① = MISSION.combat, enc② =
  //                    MISSION.encounters.stage2, interlude 가 startCombat.encounter:'stage2'.
  //   HP16 게이트        [카탈로그 §2 D1 ①[HP 16]] 폐허 생존 = 맷집 지름길. VALID_GATE_ATTRS
  //                    'hp' 준수. 저HP 클래스는 미충족 → 무력 전투 폴백(MFU 4클래스 완주 보장).
  //   실패=선택 리프레인  [발췌 chapter-08 §엔딩4 · ending.js dead-nexus] choice 노드에서 인용.
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: MISSION.kind='act2' / MISSION.unlock 은 61차 campaign.js 레지스트리가 소비.
  //   unlock.endingSeen:['dead-nexus'] = §3.2 확장 게이트(NG+ 누적). missionsDone 병기.
  // SIMPLIFIED: enc② interlude 무력 선택지의 [flag puristFlag] 지름길은 dead-nexus 엔딩
  //   flag(ending.js DERIVE_ORDER puristFlag→dead-nexus) — 이 미션에서 set 하지 않으므로
  //   검증기 info("계승 플래그로 가정"). 해금 전제(dead-nexus 완주)라 실전 항상 참.
  // ==========================================================================

  // ---- 원전 산문 앵커 (chapter-08 §엔딩4 + lore FLINT, Act2 폐허 생존) ------------
  var OPENING = [
    '애시그리드는 도시이기를 멈췄다. 제로데이 코어가 무너진 자리에, 넥서스의 잔해가 산맥처럼 누워 있다.', // [발췌] ending.js dead-nexus
    '[FLINT] "이름 좋아하는 놈들은 다 떠났어. 남은 건 우리 같은 것들 — 뜯어먹고 사는 자들이지."', // [계승] lore FLINT 의뢰인 승격
    'FLINT. 멈추면 표적이 되는 밀수 루트의 운전자. 폐허에서 살아남은 밀수단을 몰고 다닌다.', // [계승] lore snapshot DRIFTER
    '"넥서스 잔해 깊은 곳에 코어 조각이 하나 남았어. 아직 숨을 쉬는 데이터야. 그게 있으면 우리는 한 계절 더 버텨."', // [신규] 발굴 의뢰
    '"문제는 우리만 그걸 노리는 게 아니라는 거지. MERIDIAN 수확대가 벌써 붙었어. 저들은 시체를 뜯으러 왔거든."', // [신규] MERIDIAN 위협
    '이건 청부가 아니라 생존이다. 도시가 죽은 밤에도, 누군가는 그 위에서 숨을 쉰다.', // [계승] 폐허 생존 프레이밍
  ];
  var STORY_CARD = '넥서스 잔해에서 코어 조각을 뽑아낸다. 아직 온기가 남은 데이터 — 죽은 도시의 마지막 심장 박동. MERIDIAN 수확대는 물러났지만, 저들은 규모를 알고 다시 온다.';
  var REFRAIN = '이것은 실패가 아니라 선택이었다 — 어떤 이름에도 굴하지 않은 마지막 선택.'; // [발췌] chapter-08 §엔딩4

  // ---- enc① = MISSION.combat (넥서스 잔해 붕괴 통로 6열 × 8행) ------------------
  //  좌표 {x:열 0..5, y:행 0..7}. row0=상단(붕괴 통로 관제), row7=하단(밀수단 진입).
  //  [신규 · F6 폐허화] 무대. wall=무너진 대들보 LoS 차단, cover=넥서스 잔해 엄폐.
  var COMBAT = {
    cols: 6, rows: 8,
    playerStart: { x: 3, y: 7 },
    // 오브젝티브 = 붕괴 통로 관제 단말(threshold 8, enc① 낮은 밴드). [계승 applyHackObjective]
    //   인접 유닛 max(HACK,ATK) 자동축 → 4클래스 다른 축으로 완주(부가 승리 경로).
    objective: { x: 3, y: 0, threshold: 8, veil: 0, label: '붕괴 통로 관제', dataTB: 0 },
    // [계승 G10, 각색 raidThreshold] 위협 임계 — enc① 은 증원 없음(증원 GANG_THUG 는 enc②).
    threatCap: 8,
    walls: [
      { x: 1, y: 3 }, { x: 4, y: 4 },   // 무너진 대들보 2개 — 좌우 우회 강제
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1. 넥서스 잔해 3곳.
    cover: [
      { x: 2, y: 5, type: 'light' }, { x: 3, y: 5, type: 'light' }, { x: 4, y: 2, type: 'light' },
    ],
    // 적 배치 — 카탈로그 §2 D1 enc①: GANG_THUG×2(약탈자) + MERIDIAN_DRONE.
    //   GANG_THUG = ASH 근접 약탈자(폐허 재활용), MERIDIAN_DRONE = VOLT 기계(DATA SPIKE 대상).
    //   전 적 killable → 전멸/오브젝티브 이중 승리(MFU 4클래스 완주).
    enemies: [
      { key: 'GANG_THUG',      x: 2, y: 3 },
      { key: 'GANG_THUG',      x: 4, y: 3 },
      { key: 'MERIDIAN_DRONE', x: 3, y: 2 },
    ],
  };

  // ---- enc② = MISSION.encounters.stage2 (잔해 코어 발굴 6열 × 8행) --------------
  //  interlude 노드의 startCombat.encounter:'stage2' 가 이 config 를 buildCombat 오버라이드.
  //  [act2_plan.md §3.1] MISSION.combat 과 동일 스키마 · HP 풀회복 기본(숨 고르기 서사).
  var ENCOUNTERS = {
    stage2: {
      cols: 6, rows: 8,
      playerStart: { x: 3, y: 7 },
      // enc② 오브젝티브 = 잔해 코어 발굴(threshold 11, enc② 높은 밴드 — 카탈로그 §2 D1 ②).
      objective: { x: 3, y: 0, threshold: 11, veil: 0, label: '잔해 코어 발굴', dataTB: 0 },
      threatCap: 9,
      reinforcement: { key: 'GANG_THUG', x: 5, y: 1 },   // 카탈로그 §2 D1 enc② 증원 GANG_THUG
      walls: [
        { x: 2, y: 4 }, { x: 3, y: 4 },   // 코어실 격벽 잔해 — 중앙 정면 차단
      ],
      cover: [
        { x: 1, y: 5, type: 'light' }, { x: 4, y: 5, type: 'light' }, { x: 3, y: 6, type: 'full' },
      ],
      // 카탈로그 §2 D1 enc②: MERIDIAN_VANGUARD×2 + MERIDIAN_STALKER (증원 GANG_THUG).
      //   VANGUARD = IRON 중장 돌격(저속 고DEF), STALKER = SHADE 저격(코어 압박).
      enemies: [
        { key: 'MERIDIAN_VANGUARD', x: 2, y: 3 },
        { key: 'MERIDIAN_VANGUARD', x: 4, y: 3 },
        { key: 'MERIDIAN_STALKER',  x: 3, y: 1 },
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
          { label: '넥서스 잔해로 내려간다 — 붕괴 통로를 연다', goto: 'approach' },
        ],
      },
      // ★enc① approach — 무력 / [HP16] 두 출구가 interlude 로 합류 (2연전 1단).
      approach: {
        id: 'approach', speaker: 'FLINT', portrait: 'ghost',
        text: '무너진 넥서스의 배 속. 대들보가 산맥처럼 얽히고, 그 사이로 약탈자들이 먼저 자리를 잡았다.\n' +
              'MERIDIAN 정찰 드론 하나가 붕괴 통로 관제 위를 맴돈다. 길을 열려면 저들을 걷어내야 한다.',
        choices: [
          { label: '붕괴 통로를 정면으로 뚫는다',
            effect: { startCombat: { onWin: 'interlude' } },
            setFlags: { ruinBreached: true },
            desc: 'enc① 약탈자(GANG_THUG×2) + MERIDIAN_DRONE 와 전투 → 통로 확보 (공통 폴백, 4클래스 완주)',
          },
          { label: '[HP 16] 무너진 잔해를 몸으로 밀어내며 통로를 억지로 연다',
            gate: { attr: 'hp', min: 16 }, show: 'gray',
            setFlags: { ruinForced: true },
            effect: { skipCombat: true }, goto: 'interlude',
            desc: '폐허 생존 맷집(HP16↑) → 교전 없이 통로 개방(지름길). 저HP 클래스는 잠김 → enc① 전투로 폴백',
          },
        ],
      },
      // ★interlude — 서사 전환 + enc② approach 게이트. startCombat.encounter:'stage2' 소비.
      interlude: {
        id: 'interlude', speaker: 'FLINT', portrait: 'ghost',
        text: '통로 너머, 코어실이 열린다 — 죽은 넥서스의 심장. 아직 희미한 온기가 데이터 잔광으로 흐른다.\n' +
              '"저기다. 그런데 MERIDIAN 수확대가 벌써 코어를 둘러쌌어. 중장 돌격대야. 숨 한 번 고르고 — 마지막이다."',
        choices: [
          { label: '수확대를 돌파하고 코어를 발굴한다',
            effect: { startCombat: { encounter: 'stage2', onWin: 'outro' } },
            setFlags: { coreContested: true },
            desc: 'enc② MERIDIAN 수확대(VANGUARD×2 + STALKER, 증원 GANG_THUG)와 전투 → 코어 발굴 (공통 폴백)',
          },
          { label: '[ATK 5] 중장 돌격대의 진형을 한 점으로 무너뜨리고 코어를 낚아챈다',
            gate: { attr: 'atk', min: 5 }, show: 'gray',
            setFlags: { coreSeized: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: '고ATK(BLADE 축) → 진형 붕괴, 전투 스킵 코어 확보(지름길). 저ATK 클래스는 잠김 → enc② 전투로 폴백',
          },
          { label: '[flag puristFlag] 도시를 죽인 자의 이름으로 수확대의 접근 권한을 위조해 코어를 조용히 뽑는다',
            gate: { flag: 'puristFlag' }, show: 'gray',
            setFlags: { coreGhosted: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'dead-nexus 엔딩(puristFlag 계승) → 죽은 도시의 마지막 이름이 곧 통행증. 전투 스킵. flag 없으면 잠김 → enc② 전투로 폴백',
          },
        ],
      },
      // 2연전 공통 아웃트로 — 전투/스킵 어느 경로든 결과는 같다(코어 발굴).
      outro: {
        id: 'outro', speaker: 'FLINT', portrait: 'ghost',
        text: '코어 조각이 손 안에서 낮게 진동한다. 죽은 도시의 마지막 심장 박동.\n' +
              '"됐어. 이걸로 한 계절은 더 버텨." FLINT의 목소리가 잠깐 흔들린다. "…근데 저놈들, 규모를 알고 갔어. 다시 온다."\n' + STORY_CARD,
        onEnter: { setFlags: { ruinCoreData: true, meridianHarvestKnown: true } }, checkpoint: true,
        choices: [ { label: '코어를 챙기고 밀수단으로 돌아간다', goto: 'choice' } ],
      },
      // ★플레이어 선택 [계승 chapter-01 §플레이어 선택 · dead-nexus 톤] — "실패가 아니라 선택"
      choice: {
        id: 'choice', speaker: 'FLINT', portrait: 'ghost',
        text: '"이 코어, 밀수단이 나눠 쓸까 — 아니면 성벽 밖으로 팔아넘겨 다들 여길 뜰까?"\n' +
              '도시는 죽었다. 그러나 그 위에서 어떻게 살아남을지는, 아직 우리 손에 있다.',
        choices: [
          { label: 'A. 폐허에 남는다 — 코어를 나눠 밀수단을 먹인다',
            setFlags: { ruinChoice: 'stay', ruinCommune: true },
            effect: { rep: 3 }, goto: 'settle',
            desc: '렙 +3 · 폐허 공동체 유지 (영속 flag)',
          },
          { label: 'B. 성벽 밖을 노린다 — 코어를 팔아 탈출 자금을 만든다',
            setFlags: { ruinChoice: 'leave', ruinExitFund: true },
            effect: { nuyen: 6 }, goto: 'settle',
            desc: '₵ +6 · 탈출 루트 자금 (영속 flag)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'FLINT', portrait: 'ghost',
        text: '죽은 넥서스 위로 밀수단의 불빛이 하나둘 켜진다. 도시의 이름은 사라졌지만, 사람들은 남았다.\n' +
              'MERIDIAN 수확기의 그림자가 성벽 너머에서 길어진다. → D2: "LAST SIGNAL" — 저들이 도시를 통째로 뜯기 전에.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '밀수단 은신처로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (Act2 메인 2연전 1단 — 카탈로그 §2 D1) ------------------------
  var REWARDS = {
    rep: 6,
    karma: 2,
    nuyen: 12,
    unlocks: [],                                              // D2 해금은 campaign.js unlock 배선(nextHint).
  };

  var MISSION = {
    id: 'a2-d1-scavenge',
    title: 'Act 2·D1 — Scavenge',
    subtitle: 'RUIN SURVIVORS — 넥서스 잔해 발굴 (폐허 · 의뢰인 FLINT · 2연전)',
    kind: 'act2',                                             // 61차 campaign.js 레지스트리 소비(ACT 2 보드 · 브랜치 D).
    unlock: { missionsDone: ['ch08-zero-day'], endingSeen: ['dead-nexus'] }, // §3.2 엔딩 게이트(NG+ 누적).
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                                           // enc①
    encounters: ENCOUNTERS,                                   // enc②(stage2) — 2연전 §3.1
    rewards: REWARDS,
    nextHint: 'Act 2·D2: "LAST SIGNAL" — a2-d1-scavenge 완료 시 해금 (브랜치 D 2연전).',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_D1_SCAVENGE = API;
})();
