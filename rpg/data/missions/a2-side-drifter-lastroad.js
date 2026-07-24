;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-side-drifter-lastroad.js — ACT 2 클래스 사이드 (DRIFTER 전용)
  //   "LAST ROAD" — 운전자 FLINT 이 성벽 너머 마지막 밀수 루트를 두고 외부 군주와
  //   부딪치는 개인 서사 매듭. (엔진 무편집 콘텐츠. 포맷 정본 = a2-side-rigger-build.
  //   순수 리터럴 — DOM/리액트 참조 0.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (65차 · 카탈로그 없음 → 원전 drifter.md 서사 소재 [신규]):
  //   클래스 DRIFTER    [계승 data/classes.js] DRIFTER = FLINT(DANE CROSS) HP9/ATK4/DEF2/SPD4/
  //                    HACK1 · 주 ASH / 부 GRID · 고 HP+고 SPD. 개인전 밀도 = 단일 대형 전투(2연전 아님).
  //                    해금 = classKey:'DRIFTER' + missionsDone:['ch08-zero-day'] (campaign.js §3.2).
  //   주인공 서사        [계승 cards/ghost/drifter.md · lore GHOST_IDENTITY] "멈추면 표적이 되는
  //                    밀수 루트의 운전자." + drifter.md Card01 "Keep moving. Still kills faster than
  //                    hunger does." / Card09 "I was never here. Neither was the road." — 기동·밀수 모티프.
  //                    quote:'DRIFTER' → loreQuote 가 FLINT 명대사 버블("Ashgrid isn't a city. It's
  //                    a cage with good lighting." 원문).
  //   숙적 WARLORD      [재사용 · MERIDIAN 외부 위협 보스 MERIDIAN_WARLORD] enemies.js 기존 정의 재사용(신규 0).
  //                    ASH 전쟁군주 — 성벽 너머 비통제구역의 라이벌 로드 워리어. FLINT 의 마지막 밀수
  //                    루트를 자기 것으로 삼으려는 외부 세력. 무대 = 접경 무법지대 봉쇄 루트.
  //   MFU 3출구          [계승 §4.4 · a2-side-rigger-build 골격] 무력 / [SPD4] / [flag smuggleRoute]
  //                    세 출구가 outro 합류. DRIFTER(SPD4)는 [SPD4] 지름길 개방 = 클래스 정체성 기동.
  //                    저SPD 클래스(RIGGER spd2 등)는 무력 폴백으로 완주(MFU 6클래스 완주 원칙).
  //   레거시 표식        [계승 drifter.md §레거시 LAST ROAD(챕터8)] outro flag drifterLastRoad(산문 표식).
  //                    unlocks 는 빈 배열 — 클래스 시그니처(OLD ROUTES)는 ch01 UNLOCK_BY_CLASS 로 해금.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: [SPD 4] 게이트 — DRIFTER(spd4)·CIPHER(spd4) 통과, BLADE/RIGGER/MOLE 저SPD 잠김(회색)
  //   → 무력 폴백 상존. 기동 클래스 지름길이자, 전투 폴백이 저SPD 완주 보장. a2-side-mole [SPD4]
  //   SIMPLIFIED 선례 준수(폴백 보장 · 카탈로그 게이트 수치 그대로).
  // SIMPLIFIED: [flag smuggleRoute] 게이트 — 이 미션에서 set 하지 않음 → 검증기 info("계승 플래그로
  //   가정") 예상. drifter.md SMUGGLE ROUTE/BACKROAD 계승 훅. 없으면 회색 → 무력 폴백.
  // SIMPLIFIED: 보스 MERIDIAN_WARLORD + 호위 전원 killable(physImmune 없음) → 전멸/오브젝티브 이중
  //   승리(MFU). 마지막 루트 관제 코어 objective-reduce(인접 max(HACK,ATK) 자동축)로 전 클래스 완주.
  // SIMPLIFIED: MISSION.kind='act2' / unlock.classKey 는 campaign.js §3.2 게이트가 소비(전투/대화/
  //   보상 계약 무영향 · 순수 메타).
  // ==========================================================================

  // ---- 원전 산문 앵커 (drifter.md + lore DRIFTER 스냅샷, 기동·밀수 서사) ---------
  var OPENING = [
    '접경 무법지대. 애시그리드 성벽 너머, 지도에 없는 마지막 밀수 루트. FLINT 은 이 길을 직접 냈다.', // [신규 · 접경 봉쇄 루트 무대]
    '[FLINT] "애시그리드는 도시가 아니야. 조명 좋은 우리(cage)지. 그래도 밖으로 나가는 길은 내가 안다."', // [계승] lore DRIFTER quote 원문
    '멈추면 표적이 된다. FLINT 은 그렇게 살아남았고, 그래서 이 루트가 그의 전부였다.', // [계승] lore GHOST_IDENTITY
    '[WARLORD] "좋은 길이군, 운전자. 그래서 내가 가져간다. 성벽 밖은 이제 내 영토야."', // [재사용] MERIDIAN_WARLORD 외부 군주
    'MERIDIAN 전쟁군주. 성벽 너머에서 온 라이벌 로드 워리어 — FLINT 의 마지막 루트를 자기 것으로 삼으려는 손.', // [신규] 숙적 정의
    '루트 관제 코어. 그 봉쇄를 풀면 길은 다시 FLINT 의 것이 된다. 오늘 밤, 운전자가 마지막 길을 되찾으러 왔다.', // [계승] drifter.md LAST ROAD 모티프
  ];
  var STORY_CARD = '루트 관제 코어가 풀린다. 봉쇄가 걷히고, 지도에 없던 길이 다시 열린다. FLINT 은 뒤돌아보지 않는다 — "나는 여기 없었어. 이 길도 없었고." — FLINT (DANE CROSS), 마지막 루트 위에서';
  var REFRAIN = '계속 달려. 멈추는 것보다 굶주림이 더 빨리 죽인다. 이번엔, 마지막 길 하나를.'; // [계승] drifter.md Card01/Card09

  // ---- 전투 인카운터 (접경 무법지대 봉쇄 루트 6열 × 7행, 단일 대형 보스전) -------
  //  좌표 {x:열 0..5, y:행 0..6}. row0=상단(루트 관제 코어), row6=하단(FLINT 진입).
  //  [신규 · 접경 봉쇄 루트] 무대. wall=바리케이드 차량 잔해 LoS 차단, cover=연료 드럼/모래둑 엄폐.
  var COMBAT = {
    cols: 6, rows: 7,
    playerStart: { x: 3, y: 6 },
    // 오브젝티브 = 루트 관제 코어(threshold 9 · objective-reduce). [계승 store applyHackObjective]
    //   인접 유닛 max(HACK,ATK) 자동축 → DRIFTER(ATK4)·타축 모두 완주(부가 승리 경로).
    objective: { x: 3, y: 0, threshold: 9, veil: 0, label: '루트 관제 코어', dataTB: 2.0 },
    threatCap: 10,
    reinforcement: { key: 'MERIDIAN_DRONE', x: 5, y: 1 },  // 외부 세력 정찰 드론 증원(페이싱 · MERIDIAN 로스터 정합)
    // [신규] 바리케이드 차량 잔해 — 중앙 정면 접근을 끊어 좌우 우회 유도(기동 DRIFTER 서사).
    walls: [
      { x: 2, y: 4 },
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1. 연료 드럼/모래둑 3곳.
    cover: [
      { x: 1, y: 2, type: 'light' }, { x: 4, y: 2, type: 'light' }, { x: 3, y: 5, type: 'light' },
    ],
    // 로스터: MERIDIAN_WARLORD(보스) + MERIDIAN_STALKER×2(호위) + MERIDIAN_DRONE(코어 수호).
    //   전 적 killable → 전멸(DRIFTER 근접) / 관제 코어 objective-reduce(전 클래스) 이중 승리(MFU).
    enemies: [
      { key: 'MERIDIAN_DRONE',   x: 3, y: 1 },   // 루트 관제 코어 앞 수호(coverShooter · isMachine)
      { key: 'MERIDIAN_WARLORD', x: 3, y: 3 },   // ★숙적 보스 — 외부 로드 워리어
      { key: 'MERIDIAN_STALKER', x: 1, y: 3 },
      { key: 'MERIDIAN_STALKER', x: 4, y: 2 },
    ],
  };

  // ---- 대화 그래프 (rigger/mole 단일 전투 · 3출구→outro 배선) --------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'FLINT', portrait: 'ghost',
        quote: 'DRIFTER',                      // loreQuote(DRIFTER) → FLINT 명대사 버블(어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: '접경 봉쇄 루트로 들어선다 — 루트 관제 코어로', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 무력 / [SPD4] / [flag smuggleRoute] 세 출구. DRIFTER(SPD4)는 기동 지름길
      //  개방 · 저SPD 클래스는 무력 폴백으로 완주(상단 SIMPLIFIED). 셋 다 outro/outroGhost 합류.
      approach: {
        id: 'approach', speaker: 'WARLORD', portrait: 'bloc',
        text: '접경 무법지대 심부. 차량 잔해가 바리케이드를 이루고, 그 끝에 루트 관제 코어가 봉쇄를 붙든다.\n' +
              'MERIDIAN 전쟁군주가 스토커들과 정찰 드론을 앞세운다. "이 길은 내 거야, 운전자. 지나가려면 시체가 되어 지나가."',
        choices: [
          { label: '전쟁군주를 정면으로 들이받고 관제 코어를 되찾는다',
            effect: { startCombat: { onWin: 'outro' } },
            setFlags: { warlordEngaged: true },
            desc: 'MERIDIAN_WARLORD(보스) + MERIDIAN_STALKER×2 + MERIDIAN_DRONE 와 전투 → 코어 확보 (공통 폴백, 6클래스 완주 경로)',
          },
          { label: '[SPD 4] 바리케이드 사이를 전속력으로 뚫고 코어에 먼저 닿는다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { routeRushed: true },
            effect: { skipCombat: true }, goto: 'outroGhost',
            desc: '고SPD4(FLINT 기동 · DRIFTER/CIPHER) → 교전 없이 코어 선점(지름길). 저SPD(BLADE/RIGGER/MOLE)는 잠김 → 무력 폴백',
          },
          { label: '[밀수 루트 flag] 미리 파둔 우회 뒷길로 봉쇄를 통째로 돌아 나간다',
            gate: { flag: 'smuggleRoute' }, show: 'gray',
            setFlags: { backroadTaken: true },
            effect: { skipCombat: true }, goto: 'outroGhost',
            desc: 'DRIFTER SMUGGLE ROUTE/BACKROAD 계승 flag → 봉쇄 우회로 전투 스킵(지름길). flag 없으면 잠김 → 무력 폴백',
          },
        ],
      },
      // 무력 아웃트로 — 전쟁군주를 제압하고 관제 코어 봉쇄 해제.
      outro: {
        id: 'outro', speaker: 'FLINT', portrait: 'ghost',
        text: 'MERIDIAN 전쟁군주가 잔해 위로 나뒹군다. 루트 관제 코어의 봉쇄가 풀리고, 지도에 없던 길이 다시 열린다.\n' +
              '[WARLORD] "…길은 다시 막힌다, 운전자. 언제나." FLINT 은 대답 대신 엔진을 건다. "그럼 또 뚫지 뭐."\n' + STORY_CARD,
        onEnter: { setFlags: { lastRoadDone: true, warlordDefeated: true, drifterLastRoad: true } }, checkpoint: true,
        choices: [ { label: '풀린 루트를 마주한 채 선택한다', goto: 'choice' } ],
      },
      // 기동/우회 아웃트로 — 교전 없이 코어 선점.
      outroGhost: {
        id: 'outroGhost', speaker: 'FLINT', portrait: 'ghost',
        text: '스토커들은 흙먼지만 붙잡았다. 루트 관제 코어 앞에 FLINT 만이 서 있다 — 아무도 따라오지 못한 길 끝에서.\n' +
              '"나는 여기 없었어. 이 길도 없었고." 봉쇄가 풀린다. 지도에 없던 길이 조용히 다시 열린다.\n' + STORY_CARD,
        onEnter: { setFlags: { lastRoadDone: true, roadGhosted: true, drifterLastRoad: true } }, checkpoint: true,
        choices: [ { label: '풀린 루트를 마주한 채 선택한다', goto: 'choice' } ],
      },
      // ★플레이어 선택 [계승 drifter.md LAST ROAD "지도상 모든 구역 무료 이동"] — 루트의 매듭.
      choice: {
        id: 'choice', speaker: 'FLINT', portrait: 'ghost',
        text: '"이 길을 남들에게 열까 — 아니면 나만 아는 길로 봉인할까?"\n' +
              '열면 성벽 밖으로 나가려는 이들이 이 루트를 쓴다. 봉인하면 FLINT 만의 마지막 탈출로가 된다.\n' +
              '어느 쪽이든, 다음 목적지를 정하는 건 이제 나다.',
        choices: [
          { label: 'A. 길을 연다 — 우리(cage)를 벗어나려는 모두를 위해',
            setFlags: { roadChoice: 'open', roadShared: true },
            effect: { rep: 2 }, goto: 'settle',
            desc: '렙 +2 · 탈출로를 거리에 넘긴다, 조명 좋은 우리를 함께 벗어나기 위해 (영속 flag)',
          },
          { label: 'B. 나만의 길로 봉인한다 — 마지막 탈출로는 운전자의 것',
            setFlags: { roadChoice: 'seal', ownsRoad: true },
            effect: { karma: 1 }, goto: 'settle',
            desc: 'karma +1 · 지도에 없는 길을 자기 손에만 쥔다, 멈추지 않기 위해 (영속 flag)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'FLINT', portrait: 'ghost',
        text: 'FLINT 이 접경을 빠져나간다. 성벽은 그대로, 그러나 이제 그 너머로 나가는 길은 그가 정한다.\n' +
              'LAST ROAD — 지도에 없는 마지막 길을 손안에 쥔 채, 멈추지 않고.\n' + REFRAIN,
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
    unlocks: [],   // LAST ROAD 는 flag drifterLastRoad 표식(산문). 클래스 시그니처 OLD ROUTES 는 ch01 해금.
  };

  var MISSION = {
    id: 'a2-side-drifter-lastroad',
    title: 'Act 2·DRIFTER — Last Road',
    subtitle: 'DRIFTER 전용 사이드 — 마지막 루트 (접경 무법지대 · 숙적 MERIDIAN WARLORD)',
    kind: 'act2',
    unlock: { missionsDone: ['ch08-zero-day'], classKey: 'DRIFTER' },  // §3.2 classKey 게이트 — DRIFTER 로 플레이 시만 노출.
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                                                     // 단일 대형 전투(2연전 아님).
    rewards: REWARDS,
    nextHint: '클래스 사이드는 selectClass 로 클래스 전환 시 순차 개방(… BROKER/DRIFTER).',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_SIDE_DRIFTER_LASTROAD = API;
})();
