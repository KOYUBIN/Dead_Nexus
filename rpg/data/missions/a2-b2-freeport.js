;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-b2-freeport.js — ACT 2 브랜치 B "ASH REPUBLIC" B2
  //   "FREEPORT" (2연전 멀티 인카운터 · 보스전 · 엔진 무편집 콘텐츠)
  //   포맷 정본 = ch01-first-blood.js / a2-b1-barricade.js. 순수 리터럴.
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (act2_plan.md §1·§2 브랜치 B):
  //   서사 갈래 street-rising [계승] ending.js 'street-rising' — 자유도시. B1 에서 첫 파도를
  //                    막은 뒤, MERIDIAN 약탈 기함이 비통제구역 항구를 직접 친다.
  //   의뢰인 FLINT      [계승] lore_module DRIFTER=FLINT(Dane Cross) — 밀수 루트 운전자,
  //                    비통제구역 생존자. quote:'DRIFTER' → loreQuote 가 FLINT 명대사 버블.
  //   무대(비통제구역 항구) [신규 · Ring5 출입구 A6/K6 항구] Act2 미사용 무대축(무법 접경).
  //   2연전 (61차 스키마) [신규] enc① = MISSION.combat(항만 셔터 th10) → interlude → enc② =
  //                    encounters.stage2(약탈 기함 코어 th12 · MERIDIAN_WARLORD 보스).
  //   보스 MERIDIAN_WARLORD [신규 61차] ASH 전쟁군주(hp24) — Act2 외부 위협 메인 보스.
  //                    enc②에서 첫 등장. data/enemies.js MERIDIAN_WARLORD 계보 주석 참조.
  //   MFU 게이트 다양   [계승] enc① [DEF3] 방패 돌파 / enc② [HACK5]·[flag flintRouteOpen]
  //                    두 지름길. 무력 전투 경로 상시 개방 → 4클래스 완주 보장.
  //   flag flintRouteOpen [계승 · Act2 자체] B1(a2-b1-barricade) outro 가 세우는 계승 flag —
  //                    SILK 가 FLINT 밀수 루트를 넘긴 상태. 미설정 시 검증기 info(계승 가정),
  //                    지름길만 잠기고 전투 폴백 상존. B2 해금 자체는 missionsDone:['a2-b1'].
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ==========================================================================

  // ---- 산문 앵커 (street-rising 후일담 · MERIDIAN 기함 · FLINT 의뢰인) ---------
  var OPENING = [
    '자유도시는 첫 밤을 넘겼다. 그러나 성벽 밖 항구에서, 더 큰 그림자가 닻을 내렸다.', // [계승] B1 후일담
    '[FLINT] "여긴 도시가 아니야. 좋은 조명 달린 우리지 — 그리고 그 우리 문이 지금 뜯기는 중이야."', // [계승] FLINT 명대사 톤
    'FLINT. 비통제구역 밀수 루트를 몰던 운전자. 이제 그 루트가 MERIDIAN 약탈 기함의 사정권에 들었다.', // [계승] FLINT 정의
    '"항만 셔터부터 열어야 해. 안 그러면 물자도 사람도 다 갇혀. 셔터를 뚫고 — 기함 코어까지 가서 꺼."', // [신규] 2연전 의뢰
    '기함 코어를 지키는 건 저들의 우두머리다. MERIDIAN 전쟁군주 — 성벽 밖에서 온 첫 번째 이름.', // [신규] 보스 프레이밍
    '이건 밀수가 아니라 문을 지키는 일이다. 자유도시가 바깥으로 뚫려 있으려면, 이 항구가 살아야 한다.', // [계승] ASH REPUBLIC 톤
  ];
  var STORY_CARD = 'MERIDIAN 기함이 항구에서 물러난다. 전쟁군주는 쓰러졌고, 밀수 루트는 다시 숨을 쉰다 — 자유도시가 바깥으로 낸 첫 문이 열린 채 남는다.';
  var REFRAIN = '우리 문이 뜯긴 게 아니라, 우리가 문을 열어 둔 것이다.';

  // ---- enc① 인카운터 (비통제구역 항구 셔터 7열 × 8행) -------------------------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(항만 셔터), row7=하단(부두 진입).
  //  [신규] 항구 무대. wall=컨테이너 벽(LoS 차단), cover=화물/크레인 잔해 엄폐.
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    objective: { x: 3, y: 0, threshold: 10, veil: 0, label: '항만 셔터', dataTB: 0 },
    threatCap: 9,
    reinforcement: { key: 'MERIDIAN_DRONE', x: 6, y: 1 },
    walls: [
      { x: 2, y: 4 }, { x: 4, y: 4 },   // 컨테이너 2열(중앙 통로 협착 → 좌우 우회)
    ],
    cover: [
      { x: 2, y: 2, type: 'light' }, { x: 4, y: 2, type: 'light' },
      { x: 1, y: 5, type: 'light' }, { x: 5, y: 5, type: 'light' },
    ],
    // MERIDIAN_DRONE×2(VOLT 기계 · DATA SPIKE 대상) + MERIDIAN_VANGUARD(IRON 중장).
    //   전 적 killable → 전멸/오브젝티브 이중 승리(MFU).
    enemies: [
      { key: 'MERIDIAN_DRONE',    x: 1, y: 2 },
      { key: 'MERIDIAN_DRONE',    x: 5, y: 2 },
      { key: 'MERIDIAN_VANGUARD', x: 3, y: 3 },
    ],
  };

  // ---- enc② 인카운터 (약탈 기함 코어 7열 × 8행 · 보스전 · encounters.stage2) ---
  var STAGE2 = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    objective: { x: 3, y: 0, threshold: 8, veil: 0, label: '약탈 기함 코어', dataTB: 0 },   // [62차 밸런스] 12→10 · [65차 밸런스] 10→8 (BROKER hack2 은신 3턴 창 내 완주 — R2 잠적 후 R3~R4 차감 4+4)
    threatCap: 10,
    reinforcement: { key: 'MERIDIAN_DRONE', x: 0, y: 1 },   // 증원(경보 1회) — 카탈로그 지정
    walls: [
      { x: 1, y: 4 }, { x: 5, y: 4 },   // 기함 격벽 2개(측면 차단 → 중앙 보스 대치 유도)
    ],
    cover: [
      { x: 2, y: 5, type: 'light' }, { x: 4, y: 5, type: 'light' },
      { x: 3, y: 6, type: 'full'  },   // 부두 크레인 잔해(진입 엄폐)
    ],
    // ★보스 MERIDIAN_WARLORD(ASH hp24) + MERIDIAN_STALKER×2(SHADE 저격 호위).
    //   [62차 밸런스] 저격 호위 y4 하향 배치 — 진입 압박(러시 클래스 R1 은신 대응 유도) · 보스는 코어 수호.
    enemies: [
      { key: 'MERIDIAN_WARLORD', x: 3, y: 1 },   // ★전쟁군주 — 성벽 밖 첫 우두머리
      { key: 'MERIDIAN_STALKER', x: 2, y: 4 },
      { key: 'MERIDIAN_STALKER', x: 4, y: 4 },
    ],
  };

  // ---- 대화 그래프 (MFU §2.0 2연전) -------------------------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'FLINT', portrait: 'ghost',
        quote: 'DRIFTER',                      // loreQuote(DRIFTER) → FLINT 명대사 버블
        text: OPENING.join('\n'),
        choices: [
          { label: '비통제구역 항구로 향한다', goto: 'approach' },
        ],
      },
      // ★enc① 진입 — 전투 / [DEF3] 방패 돌파 두 출구가 interlude 합류.
      approach: {
        id: 'approach', speaker: 'FLINT', portrait: 'ghost',
        text: '부두에 MERIDIAN 정찰 드론 둘이 셔터를 물고, 중장 전위 하나가 통로를 막는다.\n' +
              '항만 셔터는 반쯤 내려앉아 물자를 가둔다. 먼저 셔터를 열어야 안으로 들어간다.',
        choices: [
          { label: '정면으로 셔터를 돌파한다',
            effect: { startCombat: { onWin: 'interlude' } },
            setFlags: { shutterContested: true },
            desc: 'enc① MERIDIAN 드론 2 + 중장 전위와 전투 → 항만 셔터 개방 (공통 폴백, 4클래스 완주 가능)',
          },
          { label: '[DEF 3] 화물을 방패 삼아 밀어붙여 셔터 제어반을 연다',
            gate: { attr: 'def', min: 3 }, show: 'gray',
            setFlags: { shutterShielded: true },
            effect: { skipCombat: true }, goto: 'interlude',
            desc: '고DEF 엄폐 전진 → enc① 교전 없이 셔터 개방(지름길). 저DEF 클래스는 잠김 → 전투로 폴백',
          },
        ],
      },
      // ★interlude — 숨 고르기(HP 풀회복) + enc② 보스전 진입.
      interlude: {
        id: 'interlude', speaker: 'FLINT', portrait: 'ghost',
        text: '셔터가 올라간다. 항구 안쪽에 약탈 기함이 정박해 있다 — 코어 앞에 전쟁군주가 버티고 섰다.\n' +
              '[FLINT] "저놈이 우두머리야. 저놈만 꺼지면 함대는 닻을 못 내려." 엔진 소음 사이로 숨을 고른다.',
        choices: [
          { label: '기함 코어로 돌입한다 — 전쟁군주와 맞선다',
            effect: { startCombat: { encounter: 'stage2', onWin: 'outro' } },
            setFlags: { warlordEngaged: true },
            desc: 'enc② MERIDIAN_WARLORD(보스) + 저격 호위 2와 전투 → 기함 코어 파괴 (공통 폴백, HP 풀회복 후 개시)',
          },
          { label: '[HACK 5] 기함 코어 프로토콜을 직접 역해독해 함대를 마비시킨다',
            gate: { attr: 'hack', min: 5 }, show: 'gray',
            setFlags: { coreDecoded: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: '고HACK 코어 직결 → enc② 교전 없이 기함 마비(지름길). 저HACK 클래스는 잠김 → 전투로 폴백',
          },
          { label: '[flag flintRouteOpen] 밀수 루트로 기함 아래를 파고들어 코어를 폭파한다',
            gate: { flag: 'flintRouteOpen' }, show: 'gray',
            setFlags: { coreScuttled: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'B1 계승 flag(FLINT 밀수 루트 개방) — 루트로 잠입해 코어 폭파, 전투 스킵. flag 없으면 잠김 → 전투로 폴백',
          },
        ],
      },
      // 2연전 아웃트로 — 전투/역해독/폭파 어느 경로든 결과는 같다(기함 축출·전쟁군주 제거).
      outro: {
        id: 'outro', speaker: 'FLINT', portrait: 'ghost',
        text: '기함 코어가 무너진다. 전쟁군주가 부두 위로 쓰러지고, 함대는 닻을 올린다.\n' +
              '[FLINT] "문이 아직 우리 거야. 열어 둔 채로." FLINT가 낮게 웃는다.\n' + STORY_CARD,
        onEnter: { setFlags: { flagshipDown: true, warlordFelled: true } }, checkpoint: true,
        choices: [ { label: '항구를 정비한다', goto: 'choice' } ],
      },
      choice: {
        id: 'choice', speaker: 'FLINT', portrait: 'ghost',
        text: '"이 항구를 어떻게 남길래? 밀수의 문으로, 아니면 자유도시의 관문으로?"',
        choices: [
          { label: 'A. 관문을 공개한다 — 자유도시는 바깥과 거래한다',
            setFlags: { freeportStance: 'open' }, effect: { rep: 3 }, goto: 'settle',
            desc: '렙 +3 (영구) · 공개 교역 관문 (영속 flag)' },
          { label: 'B. 밀수 루트로 남긴다 — 문은 아는 자에게만 열린다',
            setFlags: { freeportStance: 'smuggle' }, goto: 'settle',
            desc: '은밀 루트 유지 · FLINT 신뢰 (영속 flag)' },
        ],
      },
      settle: {
        id: 'settle', speaker: 'FLINT', portrait: 'ghost',
        text: '항구가 다시 숨을 쉰다. 렙과 대금이 밀수 장부를 거쳐 계좌로 흘러든다.\n' +
              'MERIDIAN 의 첫 이름이 쓰러졌다 — 그러나 성벽 밖에는 아직 많은 이름이 남았다.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (Act2 메인 2연전 B2 · 보스전 — 카탈로그 수치) -----------------
  var REWARDS = {
    rep: 8,
    karma: 3,
    nuyen: 15,
    unlocks: [],
  };

  var MISSION = {
    id: 'a2-b2-freeport',
    title: 'ASH REPUBLIC — Freeport',
    subtitle: 'ACT 2 브랜치 B · B2 — 비통제구역 항구 (2연전 보스전 · 의뢰인 FLINT)',
    kind: 'act2',
    unlock: { endingSeen: ['street-rising'], missionsDone: ['a2-b1-barricade'] },   // 갈래 개방 + B1 클리어(§3.2).
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                                           // enc① (기존 스키마 · startCombat→combat 계약)
    encounters: { stage2: STAGE2 },                           // enc② 보스전 (61차 멀티 인카운터 스키마)
    rewards: REWARDS,
    nextHint: 'ASH REPUBLIC 갈래 완료 — 다른 엔딩(NG+)으로 타 갈래 개방 · 클래스 사이드 별도.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_B2_FREEPORT = API;
})();
