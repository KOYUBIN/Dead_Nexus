;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/side-03-chemical-raid.js — 사이드 미션 "Chemical Raid"
  //   (사이드 = 챕터 밖 단편 미션. ch01-first-blood.js 스키마 그대로 재사용,
  //    엔진 무편집으로 콘텐츠 추가 — docs/25 §5.1)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문(운송/파괴 훅)     [각색] cards/events/quest-deck.md Q38 "화학 물질
  //                                운송"(의뢰인 CARBON·"위험 화학품을 공업지구까지
  //                                운반. 경로에 폐허 경유 필수" 발췌) — 본 미션은 그
  //                                화물의 종착점(저장고)을 파괴하는 반대 축으로 각색.
  //   레이드 목표 구조             [각색] quest-deck.md Q29 "금융 거점 공격"(의뢰인
  //                                🌃거리·"CARBON 또는 VANTA 금융가 구역 레이드")의
  //                                레이드 목표문 골격을 저장고 파괴로 재서술.
  //   의뢰인(비통제구역) 브리핑    [각색] quest-deck.md Q30 "중앙 데이터 서버 파괴"
  //                                (의뢰인 🏚️비통제구역) 의뢰인 축만 차용 — 목표 자체는
  //                                Q38/Q29 계열로 재구성.
  //   파산 유도 동기(플래이버)     [각색] cards/objectives/ghost.md G-K05 "해방자"
  //                                (조건: 블록 1곳 파산 유도) — 엔진에 주가/파산 판정이
  //                                없으므로 실제 판정이 아닌 서사적 동기(장부에 손실
  //                                기록)로 SIMPLIFIED. 플래이버 원문("이 건물이 무너진다.
  //                                안의 사람들은 낙하산이 없다. 그건 설계자 책임이다.")은
  //                                [그대로] 인용.
  //   무대(CARBON 공업지구)        [계승] docs/10-map-zones.md §4 Ring 2 업타운 표
  //                                D6(공업지구·CARBON 지원)·D7(공업지구·SW 경계).
  //   CARBON 전력 근거(로스터 기준)[계승] docs/07-combat-stats.md §2 "Bloc 임원 스탯"
  //                                CARBON 9/3/4/2/2 (HP/ATK/DEF/SPD/HACK) — 적 로스터
  //                                (CARBON_GUARD/CARBON_DRONE) 수치 근거로만 인용,
  //                                실제 정의는 data/enemies.js(통합 단계) 소관.
  //   접근 대화 3출구 구조         [계승 docs/25 §4.4 MFU 패턴] ch01-first-blood.js
  //                                approach 노드의 "전투/게이트 우회×2" 골격 재사용.
  //   전투 인카운터 무대           [신규] CARBON 공업 저장고 6×8(장편), 저장탱크 파괴
  //                                오브젝티브. 중장 경비 4기 + 증원 1기.
  //   순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: MISSION.kind / MISSION.unlock 는 ch01~ch08 의 관례를 다음처럼 병용한다 —
  //   kind:'side' 는 side-01-traitor-contract.js 관례를 따르고, unlock.missionsDone
  //   필드명은 ch02~ch08 다수 관례(챕터 파일 7개가 모두 unlock:{missionsDone:[...]})를
  //   따른다(side-01 만 unlockRequires 라는 다른 키를 씀 — 표기 통일을 위해 다수 관례 채택).
  //   두 필드 모두 현재 엔진(store.js/campaign.js)이 읽지 않는 순수 추가 메타데이터라
  //   전투/대화/보상 계약에는 영향이 없다 — 미션보드 필터링 배선은 통합 단계 소관.
  // ==========================================================================

  // ---- 원전 산문 앵커 (quest-deck.md Q38/Q29/Q30 + ghost.md G-K05, 발췌·각색) ---
  var OPENING = [
    '비통제구역의 전언은 짧았다: "CARBON 공업지구, D6/D7. 저장고 하나면 충분하다."', // [각색] Q30 의뢰인(비통제구역) 축 + docs/10 §4 D6/D7
    '매달 그 저장고를 거쳐야 공업지구 라인이 돌아간다 — 위험 화학품이 폐허를 끼고 도는 경로로 반입된다.', // [각색] Q38 목표문 "위험 화학품을 공업지구까지 운반. 경로에 폐허 경유 필수" 재서술
    '이번엔 반대다. 반입이 아니라 종착점을 끊는다.', // [신규] 반대 축 전환 서술
    '누군가 저장탱크에 불을 놓으면, CARBON의 장부는 다음 분기에 피를 흘린다.', // [각색] G-K05 "파산 유도" 동기 서사화(SIMPLIFIED — 실제 판정 없음)
    '"이 건물이 무너진다. 안의 사람들은 낙하산이 없다. 그건 설계자 책임이다."', // [그대로] ghost.md G-K05 플래이버 원문 인용
    '경비는 두껍다. 중장 경비 라인이 저장고 전체를 감싸고 있다.',
    '거리는 이런 계약을 그렇게 부른다 — 화학 저장고 습격.',
  ];
  var STORY_CARD = '그날 밤, CARBON 공업지구 저장탱크 하나가 조용히 무너졌다. 장부에는 그저 "설비 손실"이라 적혔다.';
  var REFRAIN = '낙하산은 없다. 그건 설계자 책임이다.';

  // ---- 전투 인카운터 (CARBON 공업 저장고 6열 × 8행, 장편 — 중장 경비) -----------
  //  좌표 {x:열 0..5, y:행 0..7}. row0=상단(저장탱크), row7=하단(진입로).
  //  [계승 docs/10 §4 D6/D7 공업지구] 무대. wall=탱크·배관 LoS 완전 차단, cover=엄폐.
  var COMBAT = {
    cols: 6, rows: 8,
    playerStart: { x: 3, y: 7 },
    // 오브젝티브 = 화학 저장탱크 파괴(threshold 누적 차감 = objective-reduce, CIPHER/BLADE
    //  중 강한 축(HACK/ATK) 자동 선택 — 이중 승리 경로, 전멸도 별도 승리 조건).
    // 51차 밸런스: 11+veil1(=12) → 11+0(=11) — 무피해 2R 러시 방지 + CARBON 고DEF 라인에 오브젝티브 완주 여유.
    objective: { x: 3, y: 0, threshold: 11, veil: 0, label: 'CARBON 저장탱크', dataTB: 0 },
    // [계승 G10] 위협 임계 + 증원(경보 시 1회 스폰) — 장편 페이싱.
    threatCap: 8,
    reinforcement: { key: 'CARBON_DRONE', x: 5, y: 1 },
    // [신규] 저장탱크·배관 구조물 3개 — 중앙 통로를 끊어 좌우 측면 우회를 강제.
    walls: [
      { x: 2, y: 3 }, { x: 3, y: 3 },   // 화학 드럼 적재대(중앙, row3) — 좌표 2·3만 막고 0·1·4·5 는 개방
      { x: 3, y: 1 },                    // 탱크 직하부 배관 — 탱크 바로 아래 정면 접근 차단(측면 인접 타일은 개방)
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1, full=DEF+2. 경비 대형 앞 차폐물.
    cover: [
      { x: 1, y: 5, type: 'full'  }, { x: 4, y: 5, type: 'full'  },
      { x: 0, y: 4, type: 'light' }, { x: 5, y: 4, type: 'light' },
    ],
    // 적 배치 — key 는 data/enemies.js 참조(통합 단계에서 추가, 계획 로스터 ID만 인용).
    //  중장 경비 라인: 경비 2 + 드론 2, 증원 드론 1(경보 시). 전 적 killable → 전멸전으로도
    //  완주 가능(MFU) — objective-reduce 와 전멸 중 어느 쪽이 먼저 와도 승리.
    enemies: [
      { key: 'CARBON_GUARD', x: 1, y: 4 },   // 좌 중장 경비
      { key: 'CARBON_GUARD', x: 4, y: 4 },   // 우 중장 경비
      { key: 'CARBON_DRONE', x: 0, y: 2 },   // 좌 정찰 드론
      { key: 'CARBON_DRONE', x: 5, y: 3 },   // 우 정찰 드론
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
      // 의뢰 브리핑 — [각색 Q30 의뢰인축] 비통제구역 접선책. 파괴 임무 규모(중장 경비) 경고.
      brief: {
        id: 'brief', speaker: 'CONTACT', portrait: 'ghost',
        text: '비통제구역 접선책이 신호를 보낸다. "CARBON 공업지구 D6/D7, 저장고 하나. ' +
              '이번 분기 장부에 구멍을 낼 절호의 기회다."\n' +
              '"경고해두지 — 중장 경비가 저장고 전체를 감싸고 있다. 가볍게 볼 상대가 아니야."',
        choices: [
          { label: '공업지구 저장고로 향한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — DEF 게이트(BLADE 지름길) / HACK 게이트(CIPHER 지름길)가 전투를 실제로 제거.
      approach: {
        id: 'approach', speaker: 'CARBON', portrait: 'bloc', quote: 'CARBON',
        text: 'CARBON 공업지구 D6/D7. 저장탱크 구획을 감싸는 중장 경비 라인 — 경비병과 정찰 드론이 ' +
              '배관 사이사이를 순찰한다. 벽 너머로 압력 밸브 판넬이 붉게 점멸한다.',
        choices: [
          { label: '무력으로 경비 라인을 돌파한다',
            effect: { startCombat: { onWin: 'outro' } },
            desc: 'CARBON 경비 전멸전 또는 저장탱크 파괴(objective-reduce) → 이중 승리. 양 클래스 완주 가능.',
          },
          { label: '[DEF 3] 엄폐 없이 방열복으로 정면 돌파한다',
            gate: { attr: 'def', min: 3 }, show: 'gray',
            setFlags: { thermalBreach: true },
            effect: { skipCombat: true }, goto: 'outroBreach',
            desc: 'BLADE(기본 DEF3) 직행 지름길 — CIPHER(DEF1)는 미충족 → 위 전투 경로로 폴백',
          },
          { label: '[HACK 4] 저장탱크 압력 밸브를 오버라이드해 자폭을 유도한다',
            gate: { attr: 'hack', min: 4 }, show: 'gray',
            setFlags: { valveOverride: true },
            effect: { skipCombat: true }, goto: 'outroValve',
            desc: 'CIPHER(기본 HACK5) 직행 지름길 — BLADE(HACK1)는 미충족 → 위 전투 경로로 폴백',
          },
        ],
      },
      // 전투 승리 후 아웃트로 (오브젝티브 = 전투 중 저장탱크 차감 또는 전멸로 이미 달성).
      outro: {
        id: 'outro', speaker: 'GHOST', portrait: 'ghost',
        text: '저장탱크가 굉음과 함께 무너진다. 경비 라인은 전멸했고, 화학 물질이 파열구 밖으로 쏟아진다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { chemicalRaidDone: true } }, checkpoint: true,
        choices: [ { label: '현장을 빠져나간다', goto: 'settle' } ],
      },
      // DEF 게이트 우회 아웃트로 — 방열복 정면 돌파로 전투 없이 탱크 직행.
      outroBreach: {
        id: 'outroBreach', speaker: 'GHOST', portrait: 'ghost',
        text: '방열복이 화염을 튕겨낸다. 경비 라인을 어깨로 밀어붙이며 저장탱크 밸브까지 직행한다.\n' +
              '한 번의 강타로 압력 격벽이 뜯겨나간다. 저장탱크가 스스로 무너진다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { chemicalRaidDone: true, extractionMethod: 'thermalBreach' } }, checkpoint: true,
        choices: [ { label: '화염이 번지기 전에 빠져나간다', goto: 'settle' } ],
      },
      // HACK 게이트 우회 아웃트로 — 압력 밸브 오버라이드로 자폭 유도(전투 없이).
      outroValve: {
        id: 'outroValve', speaker: 'GHOST', portrait: 'ghost',
        text: '압력 밸브 제어 신호에 침투한다. 안전장치를 하나씩 무력화하고, 마지막 밸브를 강제로 연다.\n' +
              '경비가 이상을 감지하기도 전에, 저장탱크 내부 압력이 임계를 넘는다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { chemicalRaidDone: true, extractionMethod: 'valveOverride' } }, checkpoint: true,
        choices: [ { label: '폭발 반경 밖으로 빠져나간다', goto: 'settle' } ],
      },
      settle: {
        id: 'settle', speaker: 'GHOST', portrait: 'ghost',
        text: '저장탱크가 무너지며 CARBON 공업지구 라인 하나가 멈춘다. 다음 분기 장부에는 "설비 손실"이라 적힐 뿐이다.\n' +
              '비통제구역은 오늘 밤을 기록하지 않는다. 이름은 남지 않는다.',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (사이드 단편 — 챕터 대비 축소 보상) --------------------------
  var REWARDS = {
    rep: 3,
    karma: 2,
    nuyen: 8,
    unlocks: [],
  };

  var MISSION = {
    id: 'side-03-chemical-raid',
    title: 'Side — Chemical Raid',
    subtitle: '사이드 — 화학 저장고 습격 (CARBON 공업지구 D6/D7 파괴 임무)',
    kind: 'side',                                    // SIMPLIFIED 상단 주석 참고 — 신규 메타 필드, 엔진 미소비.
    unlock: { missionsDone: ['ch03-martial-night'] }, // SIMPLIFIED 상단 주석 참고 — ch02~ch08 다수 관례 채택(통합 단계 배선 대상).
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_SIDE03_CHEMICAL_RAID = API;
})();
