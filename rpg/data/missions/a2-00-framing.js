;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-00-framing.js — ACT 2 프레이밍 미션 "AFTER ZERO DAY"
  //   (Act 2 도입 · 엔진 무편집 콘텐츠. 포맷 정본 = ch01/side-06. 순수 리터럴.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (act2_plan.md §1·§2):
  //   서사 기점        [계승] docs/25 §9.2 후크 + chapter-08 §봉인 후 "After Zero Day" +
  //                    ending.js nexus-reborn "다음을 위한 문 하나가 남는다" — 제로데이
  //                    이후 등장한 "외부 위협"(원전 엔딩3 각주)을 Act2 공통 소재로 계승.
  //   신규 세력 MERIDIAN [신규 61차] 애시그리드 성벽 너머(비통제구역 외곽)에서 온 외부 기업
  //                    연합. 제로데이로 무방비해진 도시를 노린다. data/enemies.js MERIDIAN_*
  //                    7종 계보 주석 참조. Act2 창작분은 전부 [신규] 태그 전제.
  //   의뢰인 SILK       [계승] lore_module.snapshot BROKER=SILK(Sera Holt) "해결사·중개인" —
  //                    docs 미등장 고스트(발화자 미사용)를 Act2 의뢰인 허브로 첫 승격.
  //                    quote:'BROKER' → lore-adapter loreQuote 가 SILK 명대사 버블 삽입.
  //   무대(성벽 접경)    [신규 · 비통제구역 접경 전초] Act2 미사용 무대축(Ring5 외곽) 도입부.
  //   MFU 접근 3출구     [계승 docs/25 §4.4 · ch01~08 관례] 전투 / [SPD4] 정찰 우회 /
  //                    [flag zeroDayBreached] 제로데이 지식 지름길 — 셋 다 outro 합류.
  //   단일 소형 전투     [act2_plan.md §6] 프레이밍은 2연전 아님 — MERIDIAN 정찰대(STALKER×2
  //                    + DRONE×1) 소형 단일 인카운터로 위협 "소개". 본편 2연전은 62차.
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: MISSION.kind='act2' / MISSION.unlock 은 61차 campaign.js 레지스트리가 소비.
  //   해금 = missionsDone ch08-zero-day (엔딩 무관) — 어느 엔딩으로 완주해도 Act2 도입은 열린다.
  // SIMPLIFIED: [flag zeroDayBreached] 게이트는 ch08 coreBreach onEnter 가 세우는 계승 flag —
  //   이 미션에서 set 하지 않으므로 검증기 info("계승 플래그로 가정") 예상. ch08 완주가 해금
  //   전제라 실전에서는 항상 참(지름길 상시 개방) — 폴백 전투 경로도 상존(MFU 완주 보장).
  // ==========================================================================

  // ---- 원전 산문 앵커 (docs/25 §9.2 후크 + chapter-08 §봉인 후, Act2 도입) ----------
  var OPENING = [
    '제로데이가 지나갔다. 도시의 시계는 다시 움직인다 — 그러나 성벽 밖의 시선까지 멈춘 것은 아니었다.', // [계승] chapter-08 봉인 후
    '[SILK] "네 이름을 들었어. 도시의 마지막 이름을 정한 그 손." 중개인의 목소리가 메시를 타고 낮게 깔린다.', // [계승] lore SILK 의뢰인 승격
    '"문제는 그 도시를 노리는 게 이제 블록만이 아니라는 거야. 성벽 너머에서 뭔가 올라오고 있어 — MERIDIAN."', // [신규] MERIDIAN 소개
    'MERIDIAN. 애시그리드 어느 블록의 이름도 아니다. 비통제구역 외곽, 도시가 무방비해진 틈을 노리고 온 외부 연합.', // [신규] 세력 정의
    '"접경 전초에 정찰대가 붙었어. 규모를 재러 온 거지. 네가 그 정찰대를 걷어내 주면 — 우리는 저들이 무엇을 아는지 알게 돼."', // [신규] 의뢰
    '이건 청부가 아니라 서막이다. 제로데이 이후의 도시가 처음으로 바깥과 마주하는 밤.', // [계승] After Zero Day 프레이밍
  ];
  var STORY_CARD = 'MERIDIAN 정찰대가 접경에서 물러난다. 그러나 그들이 남긴 좌표는 하나의 사실을 확정한다 — 그들은 다시 온다, 이번엔 규모를 알고서.';
  var REFRAIN = '도시의 마지막 이름을 정한 손이, 이제 도시의 첫 번째 바깥을 마주한다.';

  // ---- 전투 인카운터 (성벽 접경 전초 6열 × 7행, 소형 단일 — 프레이밍) --------------
  //  좌표 {x:열 0..5, y:행 0..6}. row0=상단(MERIDIAN 정찰 신호기), row6=하단(진입로).
  //  [신규] 성벽 접경 전초 무대. wall=무너진 방벽, cover=잔해/컨테이너 엄폐.
  var COMBAT = {
    cols: 6, rows: 7,
    playerStart: { x: 3, y: 6 },
    // 오브젝티브 = MERIDIAN 정찰 신호기(threshold 누적 차감). [계승 store applyHackObjective]
    //   인접 유닛 max(HACK,ATK) 자동축 → 4클래스 모두 다른 축으로 완주(부가 승리 경로).
    //   threshold 7 = 프레이밍 소형(ch01~side 밴드) · 저HP 해커 오브젝티브 러시 생존창.
    objective: { x: 3, y: 0, threshold: 7, veil: 0, label: 'MERIDIAN 정찰 신호기', dataTB: 1.0 },
    // [계승 G10, 각색 raidThreshold] 위협 임계 + 증원(경보 1회 스폰) — 소형 페이싱.
    threatCap: 8,
    reinforcement: { key: 'MERIDIAN_DRONE', x: 5, y: 1 },
    // [신규] 무너진 방벽 1개 — 좌측 통로 차단(우회 유도), 중앙 x=3 러시 레인은 개방.
    walls: [
      { x: 1, y: 3 },
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1. 접경 잔해/컨테이너 3곳.
    cover: [
      { x: 2, y: 4, type: 'light' }, { x: 4, y: 4, type: 'light' }, { x: 3, y: 5, type: 'light' },
    ],
    // 적 배치 — MERIDIAN 정찰대(act2_plan.md §2/§6). STALKER×2 = SHADE 저격(코어 압박),
    //   DRONE×1 = VOLT 기계(DATA SPIKE 대상 · BLADE 물리 완주 보장). 전 적 killable → 전멸/
    //   오브젝티브 이중 승리(MFU). 소형 구성으로 4클래스 완주 여유.
    enemies: [
      { key: 'MERIDIAN_STALKER', x: 2, y: 2 },
      { key: 'MERIDIAN_STALKER', x: 4, y: 2 },
      { key: 'MERIDIAN_DRONE',   x: 3, y: 3 },
    ],
  };

  // ---- 대화 그래프 (MFU §2.0 · 프레이밍 단일 전투) ----------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'SILK', portrait: 'ghost',
        quote: 'BROKER',                       // loreQuote(BROKER) → SILK 명대사 버블(어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: '접경 전초로 향한다 — MERIDIAN 정찰대를 마주한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 전투 / [SPD4] 정찰 우회 / [flag] 제로데이 지식 세 출구가 모두 outro 합류.
      approach: {
        id: 'approach', speaker: 'SILK', portrait: 'ghost',
        text: '성벽 접경 전초. 무너진 방벽 사이로 낯선 장구가 번뜩인다 — 애시그리드 어느 블록의 문장도 아니다.\n' +
              'MERIDIAN 저격수 둘이 잔해에 몸을 숨기고, 정찰 드론 하나가 신호기 위를 맴돈다. 저들은 규모를 재고 있다.',
        choices: [
          { label: '정찰대를 정면으로 걷어낸다',
            effect: { startCombat: { onWin: 'outro' } },
            setFlags: { meridianEngaged: true },
            desc: 'MERIDIAN 정찰대(STALKER×2 + DRONE)와 전투 → 신호기 확보 (공통 폴백, 4클래스 완주 가능)',
          },
          { label: '[SPD 4] 잔해 사이로 우회해 신호기만 조용히 뽑는다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { meridianRecon: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: '고SPD(SILK식 회피 기동) → 교전 없이 신호기 회수(지름길). 저SPD 클래스는 잠김 → 전투로 폴백',
          },
          { label: '[flag zeroDayBreached] 제로데이 코어 지식으로 신호기 프로토콜을 즉시 역해독한다',
            gate: { flag: 'zeroDayBreached' }, show: 'gray',
            setFlags: { meridianDecoded: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'ch08 코어 돌파(zeroDayBreached 계승) → 신호기 프로토콜 즉시 해독(지름길). 항상 참(ch08 완주 해금 전제)',
          },
        ],
      },
      // 세 출구 공통 아웃트로 — 전투/우회/역해독 어느 경로든 결과는 같다(정찰대 축출·좌표 확보).
      outro: {
        id: 'outro', speaker: 'SILK', portrait: 'ghost',
        text: 'MERIDIAN 정찰대가 물러난다. 신호기에서 뽑아낸 좌표가 SILK의 장부에 얹힌다.\n' +
              '"고마워. 이제 우리는 저들이 무엇을 봤는지 알아. 그리고 저들이 다시 온다는 것도." SILK의 목소리가 잠깐 멈춘다.\n' + STORY_CARD,
        onEnter: { setFlags: { meridianKnown: true, act2Framed: true } }, checkpoint: true,
        choices: [ { label: '좌표를 받아 든다', goto: 'settle' } ],
      },
      settle: {
        id: 'settle', speaker: 'SILK', portrait: 'ghost',
        text: 'Act 2 — After Zero Day. 성벽 밖의 시선이 도시를 향해 돌아섰다.\n' +
              '어느 엔딩으로 도시의 이름을 정했든, MERIDIAN은 그 이름을 알 바 아니다. 저들에게 애시그리드는 그저 뜯어갈 잔해다.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (프레이밍 — 사이드~메인 사이 소형 스케일) --------------------
  var REWARDS = {
    rep: 4,
    karma: 1,
    nuyen: 8,
    unlocks: [],
  };

  var MISSION = {
    id: 'a2-00-framing',
    title: 'Act 2 — After Zero Day',
    subtitle: 'ACT 2 프레이밍 — MERIDIAN 첫 접촉 (성벽 접경 · 의뢰인 SILK)',
    kind: 'act2',                                             // 61차 campaign.js 레지스트리 소비(ACT 2 보드 섹션).
    unlock: { missionsDone: ['ch08-zero-day'] },              // 엔딩 무관 — ch08 완주만으로 해금.
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
    nextHint: 'ACT 2 본편(4갈래×2 메인 2연전 + 클래스 사이드 4)은 62차 — 엔딩 게이트로 갈래 개방.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_00_FRAMING = API;
})();
