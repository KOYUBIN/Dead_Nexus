;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/side-07-server-zero.js — 사이드 미션 "Server Zero"
  //   (사이드 = 챕터 밖 단편/장편 미션. ch01-first-blood.js 스키마 그대로 재사용,
  //    엔진 무편집으로 콘텐츠 추가 — docs/25 §5.1. 포맷 정본 = ch01/side-03/side-04.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문(청부 의뢰문)      [계승] cards/events/quest-deck.md Q30 "중앙 데이터
  //                                 서버 파괴"(의뢰인 🏚️ 비통제구역 · 목표 "데이터허브
  //                                 구역 1곳 완전 파괴 (점령 아님)" · 주의 "매우 어려움,
  //                                 공권력 +4") 목표문·주의문 원문 발췌. side-03-chemical-
  //                                 raid.js 는 Q30 의 "의뢰인축(🏚️비통제구역)"만 차용하고
  //                                 실제 파괴 목표문은 미사용이었으므로("목표 자체는
  //                                 Q38/Q29 계열로 재구성"), 이 미션이 Q30 의 원 목표문을
  //                                 최초로 정면 채택한다(중복 없음).
  //   원 보상문("렙8+레거시 토큰2") [미채택] 레거시 토큰은 엔진이 소비 못 하는 자원 —
  //                                 side-05-informant-hit.js 와 동일 근거로 서사에는
  //                                 인용하되(브리핑 대사) 실제 REWARDS 는 사이드 규모로
  //                                 축소 재산정(아래 REWARDS 참고).
  //   무대(넥서스 부속 지하 서버팜) [계승] docs/10-map-zones.md §3 Ring1 배치표 "남서
  //                                 (SW) | E7 | 넥서스 부속 | 공용 (지하 서버팜)" +
  //                                 §11.2 "넥서스 부속 (E5, E7, G7) — 3구역. 공용 Ring1.
  //                                 3곳 동시 장악 시 NEXUS 공격 +1 보정." 원문 발췌 —
  //                                 5대 블록 공용 시설이라는 설정 그대로 사용.
  //   "파괴 = 점령 아님" 반-주권    [각색] cards/objectives/bloc.md B-T04 "데이터 주권"
  //                                 (조건: 자사 데이터허브 구역 3곳 이상 게임 종료 시
  //                                 보유 · 보너스 자산+10/데이터+5 · 플레이버 "그들의
  //                                 기억 위에 앉는다.") — Bloc 의 "보유·주권" 성취축을
  //                                 반전시켜, Ghost 가 그 주권의 물리적 기반(공용 중앙
  //                                 서버) 자체를 파괴하는 반-주권 미션으로 재구성.
  //                                 리프레인도 원 플레이버를 반전 각색.
  //   ICE 다중 노드 방어            [계승] docs/07-combat-stats.md §5.2 "메시 전투" —
  //                                 "HACK 스탯이 주 판정 수치(ATK 대체) · 물리 ATK·DEF
  //                                 무효 · 베일 레벨이 핵심 방어 요소" 원문 발췌.
  //                                 SIGNAL_ICE 2기 = 물리무효·정적 수호(docs/25 §3.5
  //                                 "ICE/베일 노드: 정적·물리무효·HACK로만 파괴" 각색
  //                                 계승 그대로) + objective.veil 가산(§3.5 "베일 레벨이
  //                                 threshold 가산, 최대 +3" 기존 계약, veil=2 사용).
  //   접근 대화 3출구 MFU 구조      [계승 docs/25 §4.4·§1 MFU] ch01/side-03/side-04
  //                                 approach 노드의 "전투 공통 폴백 + 클래스별 attr
  //                                 게이트 지름길 2종" 골격 재사용 — HACK 게이트=CIPHER
  //                                 지름길, DEF 게이트=BLADE 지름길(대칭 배치).
  //   objective-reduce 자동축 완주  [계승 store.js applyHackObjective 기존 계약, §MFU]
  //                                 신규 로직 0 — 전투 경로에서도 인접 유닛의
  //                                 max(HACK,ATK) 축이 자동 선택되어 CIPHER=해킹,
  //                                 BLADE=강습으로 같은 코어를 다른 축으로 파괴한다.
  //   엘리트 로스터 스탯 근거       [계승] docs/07-combat-stats.md §2 "Bloc 임원 스탯"
  //                                 VANTA 7/2/2/3/5, AXIOM 6/2/2/4/5(HP/ATK/DEF/SPD/HACK)
  //                                 — VANTA_ELITE(VANTA 상위 리스킨)·AXIOM_ANALYST·
  //                                 AXIOM_DRONE(AXIOM 리스킨) 수치 근거로만 인용, 실제
  //                                 정의는 data/enemies.js(통합 단계) 소관. 이 파일은
  //                                 계획 로스터 ID만 참조한다(_missions_check.js
  //                                 PLANNED_ROSTER 화이트리스트에 4종 모두 이미 등재).
  //   전투 인카운터 무대            [신규] 지하 서버팜 6×8(장편·최난도), 중앙 서버 코어
  //                                 파괴 오브젝티브 + 엘리트 경비 3인 + ICE 이중 수호 +
  //                                 증원 1기 — side-03(장편, 저장고 파괴)보다 threshold·
  //                                 threatCap·veil 을 모두 상향해 시리즈 최고난도로 편성.
  //   순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: MISSION.kind / MISSION.unlock 는 ch01~ch08 엔진 계약에 없던 신규
  //   최상위 메타 필드다(side-03 이후 "다수 관례" — unlock:{missionsDone:[...]}).
  //   현재 엔진(store.js/campaign.js)은 두 필드를 읽지 않으므로 전투/대화/보상 계약에는
  //   영향이 없다(순수 추가 데이터) — 사이드 미션 해금 조건("missionsDone 에
  //   ch06-bloc-acquisition 포함")을 문서화해 두는 용도이며, 실제 게이트 판정(허브
  //   미션보드 필터링)은 통합 단계에서 이 필드를 읽어 배선해야 한다.
  // SIMPLIFIED: 계획서상 approach 출구 ③은 "[karma 2 지출 게이트] 지하 통로 매수로
  //   경비 우회"였다. 그러나 evalGate(systems/dialogue.js)는 gate.attr/tag/flag 3종만
  //   판정하고(ctx.attrs = hack/atk/def/spd/hp 뿐), dialogueChoose(state/store.js)가
  //   소비하는 effect 필드도 rep/startCombat/returnHub 뿐이라 "karma N점을 실제로
  //   차감하며 그 지출량으로 게이트를 여는" 메커닉은 (a) 신규 게이트 판정 분기와
  //   (b) 신규 효과 핸들러(effect.spendKarma) 둘 다 요구한다 — 엔진 무편집 원칙상
  //   구현 불가. 폴백으로 기존 attr 게이트 5종 중 DEF 를 사용해 "몸으로 짓눌러 매수
  //   협상을 강제로 관철시키는 배짱(DEF 3)" 게이트로 대체했다 — 신규 메커닉 0.
  //   BLADE(기본 DEF3)에게는 그대로 지름길로 기능하고, MFU 자체는 startCombat 경로
  //   (무조건 완주 가능)로 이미 보장되므로 이 대체는 부가 지름길일 뿐 완주성에 영향 없음.
  // SIMPLIFIED: combat.objective("중앙 서버 코어")는 side-05 의 decoy 콘솔과 달리 실제
  //   파괴 대상 그 자체다. store.js checkOutcome 은 objective.done→win 과
  //   aliveEnemies.length===0→win 을 이미 동등한 승리 조건으로 취급하므로(기존 계약,
  //   신규 로직 0), "엘리트 경비 전멸 후 코어 파괴"든 "ICE 우회 후 코어만 저격"이든
  //   둘 다 유효한 정규 승리 동선이다.
  // [통합 노트] VANTA_ELITE / AXIOM_ANALYST / AXIOM_DRONE / SIGNAL_ICE 는 아직
  //   data/enemies.js 에 없음(통합 단계에서 추가 예정) — 이 파일은 계획 로스터 ID만
  //   참조한다. SIGNAL_ICE 는 기존 ICE_NODE(static·physImmune·hackOnly, docs/07 §5.2)와
  //   동일 스펙의 별도 리스킨으로 설계 의도됨(코어 이중 수호용 2체 배치, 전멸 불필수).
  // ==========================================================================

  // ---- 원전 산문 앵커 (quest-deck.md Q30 + docs/10 §3/§11.2 + bloc.md B-T04 발췌·각색) ---
  var OPENING = [
    '비통제구역의 접선 신호가 뜬다. 의뢰인 표시란에는 낡은 아이콘 하나뿐 — 🏚️ 비통제구역.', // [계승] quest-deck.md Q30 의뢰인 🏚️ 비통제구역
    '"목표: 데이터허브 구역 1곳 완전 파괴. 점령이 아니다." 문장이 두 번 반복해서 뜬다.', // [계승] Q30 목표문 "데이터허브 구역 1곳 완전 파괴 (점령 아님)" 원문 발췌
    '좌표는 넥서스 부속 남서, E7 — 지하 서버팜. 5대 블록이 공용으로 나눠 쓰는 마지막 중립지.', // [계승] docs/10 §3 배치표 "남서(SW) E7 | 넥서스 부속 | 공용 (지하 서버팜)"
    '그 지하에서 다섯 블록의 데이터가 한 코어를 거쳐 흐른다. 누군가는 그것을 "데이터 주권"이라 부른다.', // [각색] bloc.md B-T04 "데이터 주권"(자사 데이터허브 3곳 이상 보유) 조건문 반전 — 다중 블록이 겹쳐 의존하는 지점으로 재서술
    '오늘 밤, 그 주권의 밑동을 자른다.', // [각색] B-T04 반전 서술
    '"주의: 매우 어려움. 공권력 +4." 문장 끝에 경고가 붙는다.', // [계승] Q30 주의문 "매우 어려움, 공권력 +4" 원문 발췌
  ];
  var STORY_CARD = '그날 밤, 넥서스 부속 지하 서버팜의 중앙 코어 하나가 완전히 꺼졌다. 다섯 블록의 장부 모두가 그 시각을 그저 "정전"이라고만 기록했다.';
  var REFRAIN = '그들의 기억 위에 앉는 대신, 그 기억을 태운다.'; // [각색] bloc.md B-T04 플레이버 "그들의 기억 위에 앉는다." 반전 인용

  // ---- 전투 인카운터 (넥서스 부속 지하 서버팜 6열 × 8행, 장편·시리즈 최난도) --------
  //  좌표 {x:열 0..5, y:행 0..7}. row0=상단(중앙 서버 코어), row7=하단(진입로).
  //  [계승 docs/10 §3/§11.2 E7 지하 서버팜] 무대. wall=서버랙 통로 LoS 완전 차단, cover=엄폐.
  var COMBAT = {
    cols: 6, rows: 8,
    playerStart: { x: 3, y: 7 },
    // 오브젝티브 = 중앙 서버 코어 완전 파괴(threshold 누적 차감 = objective-reduce).
    //  effective threshold = 12 + veil 2 = 14(buildCombat 이 veil 가산, docs/25 §3.5 "최대 +3" 이내).
    //  veil 2 = ICE 이중 수호(SIGNAL_ICE ×2)가 코어 방어도에 얹는 베일 값을 서사적으로 반영.
    //  [계승 store.js applyHackObjective] 인접 유닛의 max(HACK,ATK) 축 자동 선택 —
    //  CIPHER(HACK5>ATK2)는 해킹, BLADE(ATK5>HACK1)는 강습으로 같은 코어를 다른 축으로 파괴(MFU).
    // 51차 밸런스: 12+veil2(=14) → 10+0(=10) — 엘리트+ICE 이중 수호에 저HP 클래스 완주 창 확보.
    objective: { x: 3, y: 0, threshold: 10, veil: 0, label: '중앙 서버 코어', dataTB: 8.0 },
    // [계승 G10, 각색 raidThreshold] 위협 임계 + 증원(경보 시 1회 스폰) — 시리즈 최고 threatCap.
    threatCap: 9,
    reinforcement: { key: 'VANTA_ELITE', x: 5, y: 1 },   // 경보 증원 — 상단 우측 통로에서 합류
    // [신규] 서버랙 통로 구조물 3개 — 코어 정면 접근을 차단해 좌우 측면 우회를 강제.
    walls: [
      { x: 1, y: 2 }, { x: 4, y: 2 },   // 코어 직하부 랙 통로(row2) — 중앙(x2·x3)만 개방, 좌우 측면 차단
      { x: 2, y: 5 },                    // 중간 통로 랙(row5) — 정면 직선 돌파를 끊어 측면 우회 유도
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1, full=DEF+2. 코어 앞 랙 차폐물.
    cover: [
      { x: 1, y: 3, type: 'full'  }, { x: 4, y: 3, type: 'full'  },
      { x: 1, y: 6, type: 'light' }, { x: 4, y: 6, type: 'light' },
    ],
    // 적 배치 — key 는 data/enemies.js 참조(통합 단계에서 추가, 계획 로스터 ID만 인용).
    //  엘리트 경비 라인(VANTA_ELITE·AXIOM_ANALYST·AXIOM_DRONE) + ICE 이중 수호(SIGNAL_ICE×2),
    //  증원 VANTA_ELITE 1기. SIGNAL_ICE 는 ICE_NODE 와 동일 스펙 예정(static·physImmune·
    //  hackOnly) — BLADE 는 처치 불필요(우회만으로 완주), CIPHER 는 HACK 파괴 가능(선택).
    //  경비 3인 전멸전 또는 objective-reduce 어느 쪽이 먼저 와도 승리(MFU, 상단 SIMPLIFIED 참고).
    enemies: [
      { key: 'VANTA_ELITE',    x: 1, y: 4 },   // 좌 엘리트 경비 라인
      { key: 'AXIOM_ANALYST',  x: 4, y: 4 },   // 우 데이터 분석관(HACK 축 지원)
      { key: 'AXIOM_DRONE',    x: 0, y: 2 },   // 좌상단 정찰 드론
      { key: 'SIGNAL_ICE',     x: 2, y: 1 },   // 코어 좌 정적 수호 (물리무효·HACK만 파괴, 선택)
      { key: 'SIGNAL_ICE',     x: 4, y: 1 },   // 코어 우 정적 수호 (물리무효·HACK만 파괴, 선택)
    ],
  };

  // ---- 대화 그래프 (docs/25 §4.2 노드 스키마) ----------------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'GHOST', portrait: 'ghost',
        text: OPENING.join('\n'),
        choices: [
          { label: '접선 신호에 응답한다', goto: 'brief' },
        ],
      },
      // 의뢰 브리핑 — [계승 Q30 의뢰인축, side-03 관례 재사용] 비통제구역 접선책.
      //  원 보상문("렙8+레거시 토큰2")은 엔진 미소비 자원 — 서사 대사에만 인용(상단 SIMPLIFIED 참고).
      brief: {
        id: 'brief', speaker: 'CONTACT', portrait: 'ghost',
        text: '비통제구역 접선책이 신호를 보낸다. "E7 지하 서버팜 — 코어 하나만 태우면 다섯 장부가 동시에 흔들린다."\n' +
              '"경고해두지. 이건 레거시 토큰급 의뢰야 — 엘리트 경비에 ICE까지 겹겹이 깔렸다. 지금까지완 격이 다르다."',
        choices: [
          { label: '지하 서버팜으로 향한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — HACK 게이트(CIPHER 지름길) / DEF 게이트(BLADE 지름길)가 대칭
      //  배치되어 전투를 실제로 제거한다(docs/25 §1·§4.4). 셋 다 각기 다른 outro 로 갈라졌다가
      //  settle 에서 합류 — side-03/04 와 동일한 "공유 폴백 + 분리 우회" 골격.
      approach: {
        id: 'approach', speaker: 'AXIOM', portrait: 'bloc', quote: 'AXIOM',
        text: 'E7 지하 서버팜 진입로. 엘리트 경비 라인이 서버랙 통로 곳곳에 흩어져 있고, ' +
              'ICE 노드 두 기가 코어 앞을 겹겹이 막아선다. 벽면 랙 사이로 붉은 경고등이 점멸한다.',
        choices: [
          { label: '무력으로 경비 라인을 돌파한다',
            effect: { startCombat: { onWin: 'outroBreach' } },
            desc: 'VANTA_ELITE·AXIOM 경비 전멸전 또는 코어 파괴(objective-reduce) → 이중 승리. 양 클래스 완주 가능.',
          },
          { label: '[HACK 5] ICE 다중 노드를 무력화하고 코어에 직결한다',
            gate: { attr: 'hack', min: 5 }, show: 'gray',
            setFlags: { iceBypassed: true },
            effect: { skipCombat: true }, goto: 'outroHack',
            desc: 'CIPHER(기본 HACK5) 직행 지름길 — BLADE(HACK1)는 미충족 → 위 전투 경로로 폴백',
          },
          { label: '[DEF 3] 지하 통로 경비를 몸으로 짓누르며 매수 협상을 강제한다',
            gate: { attr: 'def', min: 3 }, show: 'gray',
            setFlags: { tunnelBribed: true },
            effect: { skipCombat: true }, goto: 'outroBribe',
            desc: 'BLADE(기본 DEF3) 직행 지름길 — CIPHER(DEF1)는 미충족 → 위 전투 경로로 폴백. ' +
                  '[SIMPLIFIED] 원 설계는 karma 2 지출 게이트(매수)였으나 엔진이 자원-소비 게이트를 ' +
                  '지원하지 않아(상단 SIMPLIFIED 참고) 기존 attr 게이트로 대체.',
          },
        ],
      },
      // 전투 승리 후 아웃트로 (오브젝티브 = 전투 중 코어 차감 또는 경비 전멸로 이미 달성).
      outroBreach: {
        id: 'outroBreach', speaker: 'GHOST', portrait: 'ghost',
        text: '경비 라인이 무너지고 ICE 노드 두 기가 스파크를 튀기며 꺼진다. 코어 격벽이 뜯겨나간다 — 8.0테라바이트가 잿더미가 된다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { serverZeroDone: true, extractionStyle: 'loud' } }, checkpoint: true,
        choices: [ { label: '현장을 빠져나간다', goto: 'settle' } ],
      },
      // HACK 게이트 우회 아웃트로 — ICE 무력화 후 코어 직결(전투 없이, 조용한 파괴).
      outroHack: {
        id: 'outroHack', speaker: 'GHOST', portrait: 'ghost',
        text: 'ICE 두 노드의 방화벽을 차례로 태운다. 경비가 이상을 감지하기도 전에 코어에 직결한다.\n' +
              '코어가 조용히 죽는다 — 8.0테라바이트, 로그 한 줄 남기지 않고.\n' + STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { serverZeroDone: true, extractionStyle: 'quiet', iceGhosted: true } }, checkpoint: true,
        choices: [ { label: '신호 하나 남기지 않고 빠져나간다', goto: 'settle' } ],
      },
      // DEF 게이트 우회 아웃트로 — 지하 통로 매수/강제 통과(전투 없이, 물리적이지만 조용한 파괴).
      outroBribe: {
        id: 'outroBribe', speaker: 'GHOST', portrait: 'ghost',
        text: '지하 정비 통로 경비 반장의 어깨를 짓누르며 통로를 연다. 아무도 막지 않는다.\n' +
              '통로 끝에서 코어까지, 아무도 마주치지 않는다. 코어가 무너진다 — 8.0테라바이트, 장부에는 "설비 사고"로만 남는다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { serverZeroDone: true, extractionStyle: 'quiet', tunnelBribed: true } }, checkpoint: true,
        choices: [ { label: '통로로 유유히 빠져나간다', goto: 'settle' } ],
      },
      settle: {
        id: 'settle', speaker: 'GHOST', portrait: 'ghost',
        text: '코어가 꺼졌다. 다섯 블록의 장부가 동시에 흔들린다. 비통제구역은 오늘 밤을 기록하지 않는다 — 이름은 남지 않는다.\n' +
              '렙과 karma 가 계좌로 흘러든다.',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (사이드 장편·최난도 — 시리즈 최고 사이드 보상) ------------------
  var REWARDS = {
    rep: 3,
    karma: 2,
    nuyen: 9,
    unlocks: [],
  };

  var MISSION = {
    id: 'side-07-server-zero',
    title: 'Side — Server Zero',
    subtitle: '사이드 — 서버 제로 (넥서스 부속 지하 서버팜 E7, 중앙 서버 코어 완전 파괴)',
    kind: 'side',                                          // SIMPLIFIED 상단 주석 참고 — 신규 메타 필드, 엔진 미소비.
    unlock: { missionsDone: ['ch06-bloc-acquisition'] },   // SIMPLIFIED 상단 주석 참고 — ch02~ch08 다수 관례 채택(통합 단계 배선 대상).
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_SIDE07_SERVER_ZERO = API;
})();
