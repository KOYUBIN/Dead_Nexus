;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-side-rigger-build.js — ACT 2 클래스 사이드 "FINAL BUILD"
  //   RIGGER 전용 개인 서사 (엔진 무편집 콘텐츠. 포맷 정본 = side-06 / a2-00-framing.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (act2_plan.md §2 클래스 사이드 · S-RIGGER):
  //   클래스/대표 인물  [계승 cards/ghost/rigger.md] RIGGER = PATCH(CASS WIRE, 22세) ·
  //                    주 VOLT / 부 IRON · 스탯 HP7/ATK3/DEF4/SPD2/HACK3 · 최고 DEF.
  //                    "구역 제어 + 장비 제작" 정체성 — 트랩/센트리/살비지 모티프 계승.
  //   해금 조건        [계승 §3.2] classKey:'RIGGER' + missionsDone:['ch08-zero-day']
  //                    — RIGGER 로 플레이할 때만 노출(selectClass 전환 시 개방). 레지스트리 소비.
  //   숙적 보스        [신규] HARLAN_VOSS(CARBON Elder) — data/enemies.js 신규 정의 첫 등장.
  //                    VOLT hp20/atk5/def5 · CARBON 심부의 옛 장인. PATCH 와 같은 기술 계보의 노년.
  //   무대(공장 심부)   [신규 · CARBON E6 공장 심부] docs/10 미사용 무대. "죽은 넥서스 테크 회수".
  //   단일 대형 전투    [act2_plan.md §2] 클래스 사이드는 2연전 아님 — 보스+호위 단일 인카운터
  //                    (개인전 밀도). enc②/encounters 없음(MISSION.combat 하나).
  //   보상·해금 카드    [계승 rigger.md §레거시 해금] FINAL BUILD(챕터 8) — "게임 종료 직전 모든
  //                    자원으로 궁극 장비 제작". 카드 해금은 setFlags(riggerFinalBuild)로 표식(산문).
  //   MFU 접근 게이트   [계승 docs/25 §4.4 · side-06 3출구→단일 outro] 전투 / [DEF 3] 방어진지
  //                    제압 / [flag salvage] SALVAGE 계승 지름길 — 전투 폴백 상존(4클래스 완주).
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: [DEF 3] 게이트 — RIGGER(DEF4)·BLADE(DEF3)·MOLE(DEF3) 통과, CIPHER(DEF1) 잠김.
  //   RIGGER 정체성(최고 DEF·수비 특화) 지름길이자, 전투 폴백이 CIPHER 등 저DEF 완주 보장.
  // SIMPLIFIED: [flag salvage] 게이트는 RIGGER SALVAGE 카드/Act2 salvage 플래그의 계승 훅 —
  //   이 미션에서 set 하지 않으므로 검증기 info("계승 플래그로 가정") 예상. 없으면 회색 → 전투 폴백.
  // SIMPLIFIED: 보스 HARLAN_VOSS + 호위 전원 killable(physImmune 없음) → 전멸/오브젝티브 이중
  //   승리(MFU). 최종 조립 코어 objective-reduce(인접 max(HACK,ATK) 자동축)로 전 클래스 완주.
  // SIMPLIFIED: MISSION.kind/unlock 은 61차 campaign.js 레지스트리 소비 메타(전투/대화/보상 무영향).
  // ==========================================================================

  // ---- 원전 산문 앵커 (rigger.md PATCH 정체성 · Flavor 인용, 계승/각색) --------------
  var OPENING = [
    '제로데이가 지나갔다. 죽은 넥서스가 남긴 테크는 이제 잔해가 되어 CARBON E6 공장 심부에 쌓여 있다.', // [계승] After Zero Day 프레이밍
    '[PATCH] "부서진 건 전부 위장한 키트일 뿐이야." 케이스 와이어는 잔해 더미를 훑으며 중얼거린다.', // [계승·각색] rigger.md SALVAGE Flavor "Everything broken is just a kit in disguise."
    '그 잔해를 노리는 건 PATCH 만이 아니다. 공장 심부엔 옛 장인이 하나 앉아 있다 — HARLAN VOSS, CARBON 의 원로.', // [신규] 숙적 소개
    '[HARLAN] "젊은 정비공. 넌 이 도시의 시체에서 부품을 훔치러 왔지. 나는 그 시체를 통째로 다시 세우려 한다."', // [신규] HARLAN 어조
    '두 기술자, 하나의 코어. 죽은 넥서스의 마지막 조립 코어를 두고, 스크랩이 무기가 되는 밤.', // [계승·각색] rigger.md FIELD CRAFT "Give me scrap. I'll give you a weapon."
    '이건 청부가 아니라 완성이다 — PATCH 가 오래 미뤄온, 자신의 마지막 조립.', // [계승] FINAL BUILD 모티프
  ];
  var STORY_CARD = '"부서진 건 전부 위장한 키트일 뿐이야." — PATCH (CASS WIRE), 최종 조립 코어 앞에서';
  var REFRAIN = '스크랩을 다오. 무기로 돌려주마. 이번엔, 마지막 하나를.';

  // ---- 전투 인카운터 (CARBON E6 공장 심부 6열 × 7행, 단일 대형 보스전) --------------
  //  좌표 {x:열 0..5, y:행 0..6}. row0=상단(최종 조립 코어), row6=하단(공장 진입).
  //  [신규] CARBON E6 공장 심부 무대. wall=조립 라인 격벽 LoS 차단, cover=부품 컨테이너 엄폐.
  var COMBAT = {
    cols: 6, rows: 7,
    playerStart: { x: 3, y: 6 },
    // 오브젝티브 = 최종 조립 코어(threshold 11 · objective-reduce). [계승 store applyHackObjective]
    //  인접 유닛 max(HACK,ATK) 자동축 → RIGGER(HACK3/ATK3) 포함 4클래스 다른 축으로 완주.
    objective: { x: 3, y: 0, threshold: 11, veil: 0, label: '최종 조립 코어', dataTB: 3.0 },
    threatCap: 10,
    // [카탈로그 · 각색 raidThreshold] 위협 임계 + 증원(경보 1회 스폰) — CARBON 드론 예비 라인.
    reinforcement: { key: 'CARBON_DRONE', x: 5, y: 1 },
    // [신규] 조립 라인 격벽 — 중앙 정면 접근을 끊어 좌우 우회 유도(RIGGER 지역 장악 서사).
    walls: [
      { x: 2, y: 4 },
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1. 부품 컨테이너 3곳.
    cover: [
      { x: 1, y: 2, type: 'light' }, { x: 4, y: 2, type: 'light' }, { x: 3, y: 5, type: 'light' },
    ],
    // 적 배치 — HARLAN_VOSS(보스) + CARBON_GUARD×2(호위) + CARBON_DRONE(코어 수호).
    //  전 적 killable → 전멸(BLADE) / 조립 코어 objective-reduce(전 클래스) 이중 승리(MFU).
    enemies: [
      { key: 'CARBON_DRONE', x: 3, y: 1 },   // 최종 조립 코어 앞 수호(coverShooter · isMachine)
      { key: 'HARLAN_VOSS',  x: 3, y: 3 },   // ★보스 — CARBON Elder, 옛 장인
      { key: 'CARBON_GUARD', x: 1, y: 3 },
      { key: 'CARBON_GUARD', x: 4, y: 2 },
    ],
  };

  // ---- 대화 그래프 (side-06 단일 전투 · 3출구→단일 outro 배선) -------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'PATCH', portrait: 'ghost',
        quote: 'RIGGER',                       // loreQuote(RIGGER)→어댑터 미등록시 null(무해). 발화는 산문.
        text: OPENING.join('\n'),
        choices: [
          { label: 'CARBON E6 공장 심부로 내려간다 — 최종 조립 코어로', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 전투 / [DEF 3] 방어진지 제압 / [flag salvage] SALVAGE 계승. 셋 다 outro 합류.
      approach: {
        id: 'approach', speaker: 'HARLAN', portrait: 'ghost',
        text: 'CARBON E6 공장 심부. 조립 라인 사이로 옛 장인이 걸어 나온다. 손엔 직접 벼린 VOLT 장구.\n' +
              '"넌 부품을 줍고, 나는 도시를 다시 조립한다. 우리 중 하나만 이 코어를 가질 수 있어." 뒤로 CARBON 경비 둘과 드론이 라인을 지킨다.',
        choices: [
          { label: '조립 코어를 두고 정면으로 부딪친다',
            effect: { startCombat: { onWin: 'outro' } },
            setFlags: { harlanEngaged: true },
            desc: 'HARLAN_VOSS + CARBON_GUARD×2 + CARBON_DRONE 와 전투 → 코어 확보 (공통 폴백, 4클래스 완주 가능)',
          },
          { label: '[DEF 3] 방어 진지를 세워 라인을 틀어막고 장인을 제압한다',
            gate: { attr: 'def', min: 3 }, show: 'gray',
            setFlags: { harlanBraced: true, riggerHold: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'DEF3(RIGGER/BLADE/MOLE) · RIGGER "현장 정비·지역 장악" 시너지 → 진지 제압으로 전투 스킵(지름길). CIPHER(DEF1) 잠김 → 전투로 폴백',
          },
          { label: '[flag salvage] 회수해 둔 살비지 부품으로 조립 라인을 역가동시킨다',
            gate: { flag: 'salvage' }, show: 'gray',
            setFlags: { harlanSalvaged: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'RIGGER SALVAGE(회수 부품 계승 flag) → 라인 역가동으로 장인을 무력화, 전투 스킵(지름길). flag 없으면 잠김 → 전투로 폴백',
          },
        ],
      },
      // 세 출구 공통 아웃트로 — 전투/진지제압/살비지 어느 경로든 결과는 같다(코어 확보).
      outro: {
        id: 'outro', speaker: 'PATCH', portrait: 'ghost',
        text: '조립 라인이 멈추고, 옛 장인이 잔해 위로 물러앉는다. 최종 조립 코어가 PATCH 의 손안으로 넘어온다.\n' +
              '[HARLAN] "…네 손도 늙을 거다, 정비공. 그때 이 코어가 무엇이었는지 기억해라." PATCH 는 대답 대신 코어를 챙긴다.\n' + STORY_CARD,
        onEnter: { setFlags: { harlanDefeated: true, riggerFinalBuild: true } }, checkpoint: true,
        choices: [ { label: '코어를 들고 조립대로 향한다', goto: 'settle' } ],
      },
      settle: {
        id: 'settle', speaker: 'PATCH', portrait: 'ghost',
        text: '조립대 위, 죽은 넥서스의 마지막 코어와 회수한 스크랩이 하나로 맞물린다.\n' +
              'FINAL BUILD — 미뤄온 마지막 조립이 완성된다. 케이스 와이어의 손이, 이번만은 아무것도 부수지 않는다.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (클래스 사이드 · 단일 대형 전투 스케일) ------------------------
  var REWARDS = {
    rep: 5,
    karma: 2,
    nuyen: 10,
    unlocks: [],   // FINAL BUILD 는 카드 해금(rigger.md ch8) — riggerFinalBuild flag 표식(산문).
  };

  var MISSION = {
    id: 'a2-side-rigger-build',
    title: 'Act 2 Side — Final Build',
    subtitle: 'ACT 2 · RIGGER 사이드 — 최종 조립 (CARBON E6 공장 심부 · PATCH vs HARLAN VOSS)',
    kind: 'side',
    unlock: { missionsDone: ['ch08-zero-day'], classKey: 'RIGGER' },   // RIGGER 로 플레이 시만 노출.
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,   // 단일 대형 전투 — 2연전 아님(encounters 없음).
    rewards: REWARDS,
    nextHint: 'RIGGER 개인 서사 매듭 — 레거시 카드 FINAL BUILD 해금(rigger.md 챕터 8).',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_SIDE_RIGGER_BUILD = API;
})();
