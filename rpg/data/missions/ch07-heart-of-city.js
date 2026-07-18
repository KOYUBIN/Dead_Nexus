;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/ch07-heart-of-city.js — 챕터 7 "Heart of the City" 미션 데이터
  //   (챕터 = 데이터 파일 1개. 엔진 무편집으로 챕터 추가 — docs/25 §5.1)
  //   포맷 정본 = ch01-first-blood.js (IIFE·window 등록·순수 리터럴·계보 주석).
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문 '2092.3.22 F6 87층…셋뿐이다'          [그대로] cards/legacy/chapter-07-heart-of-city.md §오프닝 내러티브 원문 고정
  //   리프레인 '중심은 비어 있다. 누군가 앉을 때까지.'    [그대로] chapter-07 §오프닝 원전 인용
  //   스토리 카드 '왕관은 무겁지 않다…자리가 무겁다'      [그대로] chapter-07 §6 스토리 카드 원문
  //   다음 챕터 힌트 '누군가는 왕이 된다…'                [그대로] chapter-07 §다음 챕터 힌트
  //   의뢰인/인물 SIGNAL (간접 개입 · 엘리베이터 카드 키)  [계승 chapter-07 §개요 'SIGNAL 간접 개입' · §오프닝 '카드 키를 준…SIGNAL']
  //   무대 넥서스 타워 3구획(B1/M3/TOP)·M3 중앙 집행부     [계승 chapter-07 §2 넥서스 층별 전투 구조 · docs/10 §2 NEXUS(F6)]
  //   보스 KAI MORROW (AXIOM 보스)                        [계승 chapter-07 §1 블록 보스 카드 — KAI MORROW / 공통 보스 스탯 HP20/ATK6/DEF5/SPD3/HACK4]
  //   보스 특성 '용병 NPC 자동 동반'(증원)                [각색 chapter-07 §1 MARCUS CRANE(IRONWALL) 용병 동반 → 증원 유닛으로 각색]
  //   SIGNAL'S CHOSEN (속성 판정 +2 · 상층 잠금 해제)      [계승 chapter-07 §3 SIGNAL'S CHOSEN 레거시 카드 → flag signalChosen 게이트]
  //   기여 트랙(블록지배/혁명/평의회재건/공멸)             [계승 chapter-07 §챕터 7 플레이어 선택 — 기여 트랙 4종 → endingTrack flag]
  //   대사 버블                                           [계승 lore] loreQuote(CIPHER)/loreQuote(AXIOM) 어댑터 경유
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  //
  // [SIMPLIFIED — 보고] ① effect.spendKarma 핸들러 부재 → HACK4 게이트 폴백.
  //   접근 출구 ②('SIGNAL 카드 키 대가로 최상층 직행')의 설계 의도는 karma 1 자원 지출 게이트다.
  //   그러나 store.js 의 대화 effect 소비 목록은 {rep, startCombat, returnHub}(+goto 라우팅)뿐이며
  //   karma 지출은 SPEND_KARMA 액션(성장 소비) 전용이라 대화 선택지에서 소비되지 않는다.
  //   → 이 출구는 실제로는 gate{attr:'hack',min:4} 로 판정(CIPHER 지름길, 엔진 무편집). effect.spendKarma:1 은
  //     향후 대화용 karma-지출 핸들러가 추가되면 자동 결선되는 전방 호환 훅(현재 store 무시·무해)으로만 둔다.
  //     karma-지출 대화 게이트 = 신규 메커닉(엔진 편집 필요) → 통합 단계 보고 대상.
  // [SIMPLIFIED — 보고] ② 넥서스 3구획(B1 로비·M3 중앙 집행부·TOP 의장실)을 표준 단일 7×8 전투 스키마로 렌더.
  //   chapter-07 §2 는 구획별 별개 소규모 맵을 규정하나, 미션 파일은 기존 buildCombat 스키마(단일 그리드)만
  //   사용한다(엔진 무편집). 무대는 M3 중앙 집행부로 고정하고, TOP 의장실은 objective(대체승리 단말)로 근사한다.
  //   B1 로비/구획 간 이동(◈M/◈I 소비)은 산문 모티프로만 반영.
  //
  // [통합 노트] 메인 해금 = missionsDone 에 'ch06-bloc-acquisition' 포함(직전 챕터 클리어).
  //   현 store.js 는 단일 하드코딩 → 미션 레지스트리 필요. 아래 unlock 필드는 레지스트리 도입 전까지
  //   미소비 메타데이터(엔진 무편집). 적 로스터(KAI_MORROW·AXIOM_ANALYST·AXIOM_DRONE·IRONWALL_ENFORCER)는
  //   통합 단계에서 enemies.js 추가 — 여기서는 계획 로스터 ID를 참조만 한다(보스 KAI 공통 스탯 HP20/ATK6/DEF5/
  //   SPD3/HACK4, physImmune 아님 → 물리·해킹 모두 유효, 양 클래스 전멸 완주 가능).
  // ==========================================================================

  // ---- 원전 산문 앵커 (cards/legacy/chapter-07-heart-of-city.md, 원문 고정) ------
  // [그대로] §오프닝 내러티브 — 원문 문장·순서 유지.
  var OPENING = [
    '2092년 3월 22일. F6 넥서스 타워 87층.',
    '평의회 회의실은 원래 5개의 의자를 두고 있었다. 지금은 셋뿐이다.',
    '하나는 흡수됐고, 하나는 통째로 사라졌다.',
    '남은 세 의자에 앉을 권리를 놓고 도시가 무너진다.',
    '타워 로비에서는 고스트 한 명이 이미 엘리베이터 카드 키를 꺼내들었다.',
    '카드 키를 준 사람은 정체불명의 AI였다. 그것은 자신을 SIGNAL이라고 불렀다.',
    '일곱 번째로 도시가 깨달은 사실:',
    '중심은 비어 있다. 누군가 앉을 때까지.',
  ];
  // [그대로] chapter-07 §6 스토리 카드 원문.
  var STORY_CARD = '"왕관은 무겁지 않다. 왕관이 있는 자리가 무겁다."';
  // [그대로] chapter-07 §오프닝 리프레인.
  var REFRAIN = '중심은 비어 있다. 누군가 앉을 때까지.';

  // ---- 전투 인카운터 (넥서스 M3 중앙 집행부 7열 × 8행) --------------------------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(TOP 의장실 방면·잠금 단말), row7=하단(고스트 진입).
  //  [SIMPLIFIED ②] 3구획 중 M3 를 표준 7×8 로 렌더, TOP 의장실은 objective(대체승리 단말)로 근사.
  //  wall  : 이동+LoS 완전 차단(불투명). cover : 이동 차단·LoS 투과, DEF 보정만.
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    // 오브젝티브 = 의장실 잠금 단말(대체승리·decoy). threshold 누적 차감 = objective-reduce.
    //  veil 2 = 넥서스 최강 방어(docs/10 §2 방어 +3) 근사 → 유효 임계 = 12 + 2 = 14.
    //  CIPHER 는 단말 무력화(objective-reduce, HACK)로, BLADE 는 KAI+경비 전멸로 승리 → 양 클래스 완주.
    //  dataTB 0 — 데이터 추출이 아닌 물리 잠금 단말(왕좌 접근)이므로 유출량 0.
    objective: { x: 3, y: 0, threshold: 12, veil: 2, label: '의장실 단말', dataTB: 0 },
    // [계승 ch01~05] 위협 임계 + 증원(경보 시 1회 스폰) — 전투 페이싱 실동. 최종 전장이라 여유 10.
    threatCap: 10,
    // [각색 chapter-07 §1] IRONWALL 보스(MARCUS CRANE) '용병 NPC 자동 동반' 특성을 증원 유닛으로 각색.
    reinforcement: { key: 'IRONWALL_ENFORCER', x: 6, y: 1 },
    // 집행부 기둥 2 — 중앙 왕좌(단상 {3,2}) 접근선을 좌우로 좁힌다.
    walls: [
      { x: 2, y: 4 }, { x: 4, y: 4 },
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: full=DEF+2. 집행 데스크 4기 — 진입선 엄폐·전진 거점.
    cover: [
      { x: 1, y: 5, type: 'full' }, { x: 5, y: 5, type: 'full' },
      { x: 2, y: 6, type: 'full' }, { x: 4, y: 6, type: 'full' },
    ],
    // 적 배치 — key 는 data/enemies.js 참조(통합 단계에서 로스터 추가).
    //  KAI_MORROW = AXIOM 보스(HP20/ATK6/DEF5/SPD3/HACK4, 이니셔티브 0·항상 선공). physImmune 아님 →
    //    물리(BLADE)·해킹(CIPHER) 모두 유효, 필수 처치 대상이자 전멸 MFU 성립. 왕좌 단상 {3,2}.
    //  AXIOM_ANALYST ×2 = 집행부 상주 관료(측면). AXIOM_DRONE = 상단 순찰 드론.
    //  전 적 killable → 전멸(주 경로 제압) 또는 단말 무력화(대체승리) 어느 쪽이든 승리.
    enemies: [
      { key: 'KAI_MORROW',    x: 3, y: 2 },   // ★보스 — 왕좌 단상. 물리·해킹 모두 유효(physImmune 아님)
      { key: 'AXIOM_ANALYST', x: 1, y: 3 },   // 좌 관료
      { key: 'AXIOM_ANALYST', x: 5, y: 3 },   // 우 관료
      { key: 'AXIOM_DRONE',   x: 0, y: 1 },   // 상단 순찰 드론
    ],
  };

  // ---- 대화 그래프 (docs/25 §4.2 노드 스키마) ----------------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      // 오프닝 — F6 넥서스 87층. 다섯 의자 중 셋만 남았다. 도시의 심장으로 최후 공세.
      intro: {
        id: 'intro', speaker: 'CIPHER', portrait: 'ghost',
        quote: 'CIPHER',                       // loreQuote(CIPHER) 버블 삽입 (어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: '엘리베이터 카드 키로 중앙 집행부(M3)로 오른다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 3출구. ①전투(양 클래스) ②HACK4 카드 키 직행(폴백) ③계승 flag 잠금 해제.
      //  approach 에서 왕좌를 노리는 KAI MORROW 가 발화 — AXIOM 보스 버블(loreQuote hook).
      approach: {
        id: 'approach', speaker: 'AXIOM', portrait: 'bloc',
        quote: 'AXIOM',                        // loreQuote(AXIOM) — 미등록 시 null(무해). 전방 호환 훅.
        text: 'M3 중앙 집행부. 다섯 의자의 방, 이제 셋만 남은 왕좌들 사이에 KAI MORROW 가 앉아 있다.\n' +
              'AXIOM 관료와 순찰 드론이 집행 데스크 사이를 지키고, 상단엔 의장실로 통하는 잠금 단말이 맥동한다.\n' +
              STORY_CARD,
        choices: [
          { label: '집행부 경비와 보스 KAI 를 정면 제압한다',
            effect: { startCombat: { onWin: 'outro' } },
            desc: '전투 개시 → KAI+경비 전멸(BLADE 정면·CIPHER 해킹 모두 유효, 보스 physImmune 아님) 또는 의장실 단말 무력화(CIPHER objective-reduce). 이중 승리, 양 클래스 완주.',
          },
          { label: '[HACK 4] SIGNAL 카드 키로 엘리베이터를 오버라이드해 최상층 직행한다',
            gate: { attr: 'hack', min: 4 }, show: 'gray',
            setFlags: { signalCardKey: true },
            // [SIMPLIFIED ①] 실판정=gate hack4(폴백). effect.spendKarma:1 = 향후 대화 karma-지출 핸들러용
            //   전방 호환 훅(현 store 무시). 라우팅은 goto 가 담당(skipCombat 은 문서 필드).
            effect: { skipCombat: true, spendKarma: 1 }, goto: 'outroChosen',
            desc: 'SIGNAL 이 건넨 카드 키의 대가로 최상층 직행(설계 의도=karma 1 지출). 현 엔진에선 CIPHER HACK4 오버라이드로 폴백 → 전투 스킵. BLADE HACK 잠김 → 위 전투로 완주.',
          },
          { label: '[flag signalChosen] SIGNAL 이 선택한 자만 상층 잠금을 해제한다',
            gate: { flag: 'signalChosen' }, show: 'gray',
            setFlags: { signalThrone: true },
            effect: { skipCombat: true }, goto: 'outroThrone',
            desc: '[계승 §3 SIGNAL\'S CHOSEN] SIGNAL 이 이 챕터에서 선택한 자만 상층 잠금 해제 — 챕터 8 특수 엔딩 경로 연결(영속 flag). 미선택자는 위 전투/카드 키로 완주.',
          },
        ],
      },
      // 전투 승리 후 아웃트로 — KAI 제압(BLADE)·단말 무력화(CIPHER) 양 승리가 이 노드로 수렴(onWin).
      outro: {
        id: 'outro', speaker: 'CIPHER', portrait: 'ghost',
        text: 'KAI MORROW 가 왕좌에서 무너진다. 집행부의 방어선이 함께 꺼진다.\n' +
              '의장실 단말의 봉인이 풀리고, 도시의 심장이 손 닿는 거리에 놓인다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { heartTaken: true, kaiDefeated: true } }, checkpoint: true,
        choices: [ { label: '의장실로 올라선다', goto: 'choice' } ],
      },
      // HACK4 카드 키 우회 아웃트로 — 전투 없이 최상층 직행(CIPHER 지름길·SIGNAL 카드 키).
      outroChosen: {
        id: 'outroChosen', speaker: 'CIPHER', portrait: 'ghost',
        text: 'SIGNAL 의 카드 키. 엘리베이터 오버라이드가 조용히 통과하고, 집행부를 거치지 않고 최상층에 선다.\n' +
              'KAI 는 내가 이미 위에 있다는 걸 알기도 전이다. 심장은 싸움 없이 열렸다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { heartTaken: true, cardKeyAscend: true } }, checkpoint: true,
        choices: [ { label: '의장실로 올라선다', goto: 'choice' } ],
      },
      // 계승 flag 잠금 해제 아웃트로 — SIGNAL 이 선택한 자만. 챕터 8 특수 엔딩 영속 시연.
      outroThrone: {
        id: 'outroThrone', speaker: 'CIPHER', portrait: 'ghost',
        text: 'SIGNAL 이 나를 골랐다. 상층 잠금이 나만을 위해 풀린다 — 도시의 신경이 내 판정을 편든다.\n' +
              '왕좌 앞에 서는 것은 이번엔 싸움도 우회도 아니다. 선택받았다는 것, 그 자체다.\n' +
              '이 통로는 챕터 8 이후에도 나를 위해 열려 있을 것이다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { heartTaken: true, signalEndingUnlocked: true } }, checkpoint: true,
        choices: [ { label: '의장실로 올라선다', goto: 'choice' } ],
      },
      // ★기여 트랙 선택 [계승 chapter-07 §챕터 7 플레이어 선택] — "선택지보다 달성 결과가 엔딩에 반영된다".
      //  네 트랙 중 하나에 기여(setFlags endingTrack:*) → 챕터 8 주 엔딩 후보 결정(영속).
      choice: {
        id: 'choice', speaker: 'CIPHER', portrait: 'ghost',
        text: '왕좌 앞에서, 어떤 도시를 남길지 정해야 한다.\n' +
              '"이 심장은 무엇을 위해 뛸 것인가?"',
        choices: [
          { label: 'A. 블록 지배 — 한 블록의 왕좌로 넥서스를 장악한다',
            setFlags: { endingTrack: 'domination', contribDomination: true },
            goto: 'settle',
            desc: '[계승 §기여 트랙 블록 지배] 엔딩 1 후보 — 블록 1곳 주가 80+ · 넥서스 장악(영속 flag).',
          },
          { label: 'B. 혁명 — 고스트가 블록 본사 구역들을 무너뜨린다',
            setFlags: { endingTrack: 'revolution', contribRevolution: true },
            goto: 'settle',
            desc: '[계승 §기여 트랙 혁명] 엔딩 2 후보 — 2개 이상 블록 본사 점거(영속 flag).',
          },
          { label: 'C. 평의회 재건 — 세 의자를 살려 평화 협상을 연다',
            setFlags: { endingTrack: 'council', contribCouncil: true },
            goto: 'settle',
            desc: '[계승 §기여 트랙 평의회 재건] 엔딩 3 후보 — 3개 이상 블록 생존 · 평화 협상(영속 flag).',
          },
          { label: 'D. 공멸 — 심장을 부수고 도시를 함께 재운다',
            setFlags: { endingTrack: 'collapse', contribCollapse: true },
            goto: 'settle',
            desc: '[계승 §기여 트랙 공멸] 엔딩 4(도시 죽음) 후보 — 공권력 10+ · 블록 파산 · 넥서스 파괴(영속 flag).',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'CIPHER', portrait: 'ghost',
        text: '도시의 심장이 멈췄다가, 내가 정한 박자로 다시 뛴다. 이 챕터가 엔딩 분기를 확정한다.\n' +
              '누군가는 왕이 된다. 누군가는 길거리로 돌아간다. 누군가는 메시 속으로 사라진다.\n' +
              '누군가는 이 도시와 함께 사라진다. 모두가 동시에 일어나지는 않을 것이다.\n' +
              '→ Chapter 08: "Zero Day"',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 [계승 chapter-07 §챕터 효과 · 최종 전장 스케일 상향] --------------
  var REWARDS = {
    rep: 6,               // 최종 전장 클리어 영구 렙 +6 (ch05 5 → 6)
    heatCapDelta: 1,      // 공권력 트랙 최대치 +1 (스케일 유지)
    karma: 3,             // 성장 소비용 karma (보스전 보상 상향)
    nuyen: 13,            // ₵ 보상 (ch05 11 → 13)
    // unlocks 없음 — 넥서스 카드(NEXUS OVERRIDE/FINAL BREACH 등)는 이 슬라이스에서 산문 모티프.
  };

  var MISSION = {
    id: 'ch07-heart-of-city',
    title: 'Chapter 07 — Heart of the City',
    subtitle: '챕터 07 — 도시의 심장 · 넥서스 M3 중앙 집행부',
    envelope: 'G',
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
    // [통합 메타데이터] 미션 레지스트리 도입 전까지 미소비 — 직전 챕터 클리어 요구.
    unlock: { missionsDone: ['ch06-bloc-acquisition'] },
    nextHint: 'Chapter 08: "Zero Day" — 챕터 7 종료 시 자동 해금',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_CH07 = API;
})();
