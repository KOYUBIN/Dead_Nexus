;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-side-blade-vendetta.js — ACT 2 클래스 사이드 (BLADE)
  //   "NAME IN BLOOD" (단일 대형 보스전 · 숙적 MARCUS_CRANE · 엔진 무편집)
  //   포맷 정본 = ch01-first-blood.js / side-06-rival-duel.js. 순수 리터럴.
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (act2_plan.md §1·§2 클래스 사이드 S-BLADE):
  //   클래스 게이트     [계승 61차 campaign.js §3.2] unlock.classKey:'BLADE' — BLADE 로 편성
  //                    시에만 보드 노출(selectClass 로 전환 시 개방). + missionsDone ch08.
  //   대표 인물 RUST    [계승] lore_module BLADE=RUST(Cole Harker) "집행관 출신 고스트".
  //                    quote:'BLADE' → loreQuote 가 RUST 명대사 버블("I don't pick sides.
  //                    I pick rates."). GHOST_IDENTITY: "243건을 처리하고 244번째에 표적이
  //                    됐던 집행관. 이제 그의 이름값은 거리가 매긴다." — 이 미션의 서사 근간.
  //   숙적 MARCUS_CRANE [계승] enemies.js MARCUS_CRANE(기존 정의 그대로 재사용) · lore_module
  //                    IRONWALL 수장 MARCUS CRANE(GENERAL-DIRECTOR) 발화자 첫 등장.
  //                    quote:'IRONWALL' → loreQuote 가 CRANE 명대사("The negotiation table
  //                    is just another name for the battlefield.") 버블 삽입.
  //   무대(무기고 심부)  [신규 · IRONWALL HQ 무기고 심부] 244번째 표적의 진실 — RUST 를 표적으로
  //                    돌린 처형 계약 원본이 잠긴 곳. Act2 미사용 무대축.
  //   단일 대형 보스전   [act2_plan.md §2 클래스 사이드] 2연전 아님 — 개인전 밀도의 단일 인카운터
  //                    (MARCUS_CRANE 보스 + IRONWALL 호위). side-06 결투 구조 계승.
  //   MFU 게이트 다양   [계승] 전투 / [ATK5] BLADE 정체성 지름길 / [IRONWALL tag] 위장 지름길.
  //                    무력 전투 경로 상시 개방 → 무력 폴백 완주 보장(4클래스 폴백 원칙).
  //   [IRONWALL tag]    [계승 SIMPLIFIED · Act1 side-08 선례] IRONWALL 태그는 MOLE 위장 태그
  //                    (data/classes.js MOLE.tags)만 보유 → BLADE 는 미보유 = 이 지름길 잠김
  //                    (show:'gray' 폴백). 신규 태그 문법 0, 기존 tag 게이트 필드만 소비.
  //   보상 NAME IN BLOOD [계승] cards/ghost/blade.md 레거시 해금 카드 "NAME IN BLOOD"(챕터7):
  //                    "사망한 적의 이름을 카드에 새김, 영구 ATK +0.5". rewards.unlocks 로 해금.
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ==========================================================================

  // ---- 산문 앵커 (street-rising 후일담 톤 · RUST 244번째 표적의 진실) ----------
  var OPENING = [
    '[RUST] "난 편을 고르지 않아. 요율을 고르지." 낡은 규칙 하나로 243건을 처리한 집행관의 말이었다.', // [계승] RUST 명대사
    '243건. 그리고 244번째 계약서에 적힌 표적의 이름은 — 콜 하커, 자기 자신이었다.', // [계승] GHOST_IDENTITY 244번째 표적
    '그 계약을 발주한 손이 IRONWALL 무기고 심부에 원본을 봉인해 두었다. 누가, 왜 자신을 지웠는지.', // [신규] 무대·동기
    '봉인을 지키는 건 그 손의 주인이다 — MARCUS CRANE, IRONWALL 장군-이사. 협상 테이블을 전장이라 부르는 남자.', // [계승] MARCUS CRANE
    '제로데이가 지나고 도시가 다시 숨 쉬는 지금, RUST 는 마지막 계약 하나를 스스로 발주한다 — 자기 이름값을 되찾는 계약.', // [계승] After Zero Day 프레이밍
  ];
  var STORY_CARD = '244번째 계약의 원본이 열린다. RUST 는 자신을 지운 이름을 읽고 — 그 이름을 피로 새긴다. 이제 그 이름값은 거리가 매긴다.';
  var REFRAIN = '난 편을 고르지 않아. 요율을 고르지 — 그리고 이번 요율은 내 이름이다.';

  // ---- 전투 인카운터 (IRONWALL 무기고 심부 7열 × 8행 · 단일 대형 보스전) -------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(처형 단말), row7=하단(무기고 진입).
  //  [신규] 무기고 심부 무대. wall=무기 격납 격벽(LoS 차단), cover=탄약고/방벽 엄폐.
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    // 오브젝티브 = 처형 단말(244번째 계약 원본). [계승 store applyHackObjective]
    //   인접 유닛 max(HACK,ATK) 자동축 → BLADE 는 ATK5 축으로 차감(부가 승리 경로).
    objective: { x: 3, y: 0, threshold: 9, veil: 0, label: '처형 단말', dataTB: 0 },
    threatCap: 9,
    reinforcement: { key: 'IRONWALL_ENFORCER', x: 6, y: 1 },   // 집행관 증원(경보 1회)
    walls: [
      { x: 2, y: 4 }, { x: 4, y: 4 },   // 무기 격납 격벽 2개(중앙 대치 유도)
    ],
    cover: [
      { x: 1, y: 5, type: 'light' }, { x: 5, y: 5, type: 'light' },
      { x: 3, y: 5, type: 'full'  },   // 탄약고 방벽(진입 엄폐)
    ],
    // ★보스 MARCUS_CRANE(VOLT hp18) + IRONWALL_ENFORCER×2(집행관 호위) + IRONWALL_TURRET
    //   (고정포탑 · mov0 제자리 사수). 전 적 killable → 전멸/오브젝티브 이중 승리(MFU).
    //   BLADE 근접(ATK5) 밀도에 맞춘 단일 대형 결전 — 개인전 밀도(2연전 아님).
    enemies: [
      { key: 'MARCUS_CRANE',      x: 3, y: 1 },   // ★숙적 — IRONWALL 장군-이사
      { key: 'IRONWALL_ENFORCER', x: 1, y: 2 },
      { key: 'IRONWALL_ENFORCER', x: 5, y: 2 },
      { key: 'IRONWALL_TURRET',   x: 3, y: 3 },   // 처형 단말 앞 고정포탑(정적 수호)
    ],
  };

  // ---- 대화 그래프 (MFU §2.0 단편: intro→approach→[전투]→outro→choice→settle) --
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'BLADE', portrait: 'ghost',
        quote: 'BLADE',                        // loreQuote(BLADE) → RUST 명대사 버블
        text: OPENING.join('\n'),
        choices: [
          { label: 'IRONWALL 무기고 심부로 향한다 — 244번째 계약의 원본을 연다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 전투 / [ATK5] BLADE 지름길 / [IRONWALL 태그] 위장 지름길, 셋 다 outro 합류.
      approach: {
        id: 'approach', speaker: 'IRONWALL', portrait: 'bloc',
        quote: 'IRONWALL',                     // loreQuote(IRONWALL) → MARCUS CRANE 명대사 버블
        text: '무기고 심부. 처형 단말 앞에 MARCUS CRANE 이 서 있다 — 집행관 둘과 고정포탑이 단말을 에워쌌다.\n' +
              '[CRANE] "협상 테이블은 전장의 다른 이름일 뿐이야, 하커. 네 마지막 계약도 여기서 끝나." 그가 손을 든다.',
        choices: [
          { label: '숙적을 정면으로 벤다',
            effect: { startCombat: { onWin: 'outro' } },
            setFlags: { craneEngaged: true },
            desc: 'MARCUS_CRANE(보스) + 집행관 2 + 포탑과 전투 → 처형 단말 확보 (공통 폴백, 무력 완주 보장)',
          },
          { label: '[ATK 5] 선공으로 CRANE 의 호위를 가르고 단말까지 돌파한다',
            gate: { attr: 'atk', min: 5 }, show: 'gray',
            setFlags: { craneCleaved: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'BLADE(기본 ATK5)·"동점 자동 선공" 패시브 시너지 → 전투 스킵, 일격에 호위 돌파(지름길). 저ATK 폴백 → 전투',
          },
          { label: '[IRONWALL 태그] 옛 집행관 인장을 앞세워 무기고를 무혈 통과한다',
            gate: { tag: 'IRONWALL' }, show: 'gray',
            setFlags: { craneBypassed: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: '위장/MOLE 축 태그(SIMPLIFIED · Act1 side-08 선례) — BLADE 로스터엔 IRONWALL 태그 없음 → 잠김, 전투로 폴백',
          },
        ],
      },
      // 세 출구 공통 아웃트로 — 전투/선공/무혈 어느 경로든 결과는 같다(단말 확보·진실 개봉).
      outro: {
        id: 'outro', speaker: 'BLADE', portrait: 'ghost',
        text: '처형 단말이 열린다. 244번째 계약의 원본이 화면을 채운다 — 자신을 지운 이름과, 그 요율까지.\n' +
              '[RUST] "이제 요율을 갚을 차례군." RUST 는 그 이름을 카드에 새긴다.\n' + STORY_CARD,
        onEnter: { setFlags: { vendettaClosed: true } }, checkpoint: true,
        choices: [ { label: '이름을 확인한다', goto: 'choice' } ],
      },
      // 후일담 분기 — 완주 방식이 다음 상태에 영속 반영(BLADE 개인 서사 매듭).
      choice: {
        id: 'choice', speaker: 'BLADE', portrait: 'ghost',
        text: '"244번째 이름을 어떻게 새길까?"',
        choices: [
          { label: 'A. 피로 새긴다 — 이 이름값은 내가 매긴다',
            setFlags: { nameInBlood: true }, effect: { rep: 3 }, goto: 'settle',
            desc: '렙 +3 (영구) · 숙적 청산, 이름을 카드에 새김 (영속 flag)' },
          { label: 'B. 계약서를 태운다 — 요율을 끝내고 떠난다',
            setFlags: { contractBurned: true }, goto: 'settle',
            desc: '조용한 매듭 · 집행관의 마지막 계약 종결 (영속 flag)' },
        ],
      },
      settle: {
        id: 'settle', speaker: 'BLADE', portrait: 'ghost',
        text: '243건을 처리한 손이, 244번째로 자기 이름을 되찾았다. NAME IN BLOOD 카드가 덱에 새겨진다.\n' +
              '이제 그 이름값은 IRONWALL 이 아니라 거리가 매긴다.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (클래스 사이드 — 카탈로그 수치 · BLADE 레거시 카드 해금) -------
  var REWARDS = {
    rep: 5,
    karma: 2,
    nuyen: 10,
    unlocks: ['NAME IN BLOOD'],   // [계승 blade.md 챕터7 레거시] 사망한 적의 이름 새김, 영구 ATK +0.5
  };

  var MISSION = {
    id: 'a2-side-blade-vendetta',
    title: 'BLADE — Name in Blood',
    subtitle: 'ACT 2 클래스 사이드(BLADE) — IRONWALL 무기고 심부 (숙적 MARCUS CRANE)',
    kind: 'act2',                                            // 61차 campaign.js 레지스트리 소비(ACT2 보드).
    unlock: { classKey: 'BLADE', missionsDone: ['ch08-zero-day'] },   // BLADE 편성 시에만 노출(§3.2).
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                                          // 단일 대형 보스전(encounters 없음 · 2연전 아님).
    rewards: REWARDS,
    nextHint: '클래스 사이드 — 타 클래스(CIPHER/RIGGER/MOLE) 편성 시 각자의 숙적 사이드 개방.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_SIDE_BLADE_VENDETTA = API;
})();
