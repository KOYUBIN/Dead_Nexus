;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/side-05-informant-hit.js — 사이드 미션 "Informant"
  //   (사이드 = 챕터 밖 단편 미션. ch01-first-blood.js 스키마 그대로 재사용,
  //    엔진 무편집으로 콘텐츠 추가 — docs/25 §5.1. 포맷 정본 = ch01/side-01~03.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문(청부 의뢰문)     [계승] cards/events/quest-deck.md Q08 "밀고자
  //                                처단"(의뢰인 ❓익명 · 목표문 "슬럼 구역의 NPC 1명
  //                                제거" 발췌·각색) — 원전 보상문("렙4+무기3+SHADE
  //                                속성2")은 카드 표기 그대로의 텍스트 자원이 아니라
  //                                엔진이 소비 못 하는 아이템/속성 보상이므로 서사에는
  //                                인용하지 않고, 실제 REWARDS 는 사이드 단편 규모로
  //                                축소 재산정(아래 REWARDS 참고).
  //   "밀고자 처단" 카드 표제 인용 [계승] quest-deck.md Q08 카드 제목 원문 인용
  //                                (STORY_CARD/REFRAIN 서사 축)
  //   유흥가 뒷골목 무대 좌표      [계승] docs/10-map-zones.md §5 Ring3 미드타운
  //                                C8(유흥가) + §6 Ring4 다운타운 B8(유흥가) — 두
  //                                표 모두 "유흥가" 태그, 다운타운 링은 "서민·슬럼"
  //                                성격(§6 서두)이라 Q08 "슬럼 구역" 서사와 정합.
  //   유흥가=고스트 은신처 플레이버 [계승] docs/01-worldbuilding.md §자원표 "유흥가:
  //                                네온과 카지노. 주로 고스트들의 은신처" 원문 발췌
  //                                — 밀고자가 바로 그 은신처를 팔아넘긴다는 반전 각색.
  //   밀고자 설정(정보상 배신)     [각색] Q08 "밀고자 처단" 표제 서사화 — "이름들을
  //                                판다"는 구체 동기는 신규 서술(원전은 표제·목표문·
  //                                보상만 명시, 동기 서술은 각색으로 보충).
  //   접근 대화 3출구 구조         [계승 docs/25 §4.4 MFU 패턴] ch01-first-blood.js
  //                                approach 노드의 "전투/게이트 우회×2" 골격 재사용,
  //                                단 이번엔 세 출구 모두 단일 outro 로 합류시켜
  //                                최단편 구조(노드 4개, 분기 1개)로 편성 — side-01~03
  //                                (출구별 별도 outroX 노드)과 의도적으로 다른 배선.
  //   ATK 게이트 처형 플래이버     [각색] docs/07-combat-stats.md §5.3 "처형 시도" +
  //                                side-01-traitor-contract.js 의 ATK5 게이트 패턴을
  //                                그대로 재사용(원전은 SPD 판정 즉사 카드 효과, 본
  //                                미션은 엔진 지원 결정론 attr 게이트(atk≥5)로
  //                                SIMPLIFIED — side-01 과 동일 근거, 신규 메커닉 0).
  //   SPD 게이트 기습 플래이버     [신규 서술] "갱단 눈을 피해 기습 즉결" — CIPHER
  //                                기본 SPD4(docs/07 §2)를 그대로 게이트 임계로 사용,
  //                                신규 메커닉 없이 기존 attr 게이트 필드만 소비.
  //   전투 인카운터 무대           [신규] 유흥가 뒷골목 6×6(최단편), 밀고 단말
  //                                오브젝티브 + 갱단 3인.
  //   순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: MISSION.kind / MISSION.unlock 는 ch01~ch08 엔진 계약에 없던 신규
  //   최상위 메타 필드다(side-01~03 과 동일 패턴). 현재 엔진(store.js/campaign.js)은
  //   두 필드를 읽지 않으므로 전투/대화/보상 계약에는 영향이 없다(순수 추가 데이터)
  //   — 사이드 미션 해금 조건("missionsDone 에 ch02-insider-game 포함")을 문서화해
  //   두는 용도이며, 실제 게이트 판정(허브 미션보드 필터링)은 통합 단계에서 이
  //   필드를 읽어 배선해야 한다.
  // SIMPLIFIED: combat.objective("밀고 단말")는 실제 처단 대상이 아니라 밀고자가
  //   팔아넘긴 정보 목록을 담은 부속 콘솔(decoy)이다. store.js checkOutcome 은
  //   objective.done 과 aliveEnemies.length===0 을 이미 동등한 승리 조건으로 취급
  //   하므로(기존 계약, 신규 로직 0), 실제 처단(적 3인 전멸)이 정규 승리 경로이고
  //   콘솔 해킹은 부가 승리 경로로 자연히 공존한다 — 신규 메커닉 없이 기존 이중
  //   승리 조건을 그대로 재사용.
  // ==========================================================================

  // ---- 원전 산문 앵커 (quest-deck.md Q08 발췌·각색 + docs/10 §5·§6 + docs/01) ---
  var OPENING = [
    '"슬럼 구역의 NPC 1명 제거." 의뢰인 표시란은 비어 있다 — ❓익명.', // [계승] quest-deck.md Q08 목표문 발췌 + 의뢰인 유형(❓익명)
    '좌표 하나만 찍힌다. 유흥가 뒷골목 — 미드타운 C8, 혹은 다운타운 B8.', // [계승] docs/10-map-zones.md §5 Ring3 C8(유흥가) · §6 Ring4 B8(유흥가)
    '네온과 카지노 뒤편. 원래는 고스트들의 은신처였다.', // [계승] docs/01-worldbuilding.md §자원표 "유흥가: 네온과 카지노. 주로 고스트들의 은신처" 원문 발췌
    '그런데 그 은신처 안에서, 누군가 이름들을 팔고 있다.', // [각색] Q08 표제 "밀고자 처단" 서사화 — 동기 신규 서술
    '갱단이 골목 입구를 지킨다. 계약금은 이미 걸려 있다. 취소는 없다.',
    '거리는 이런 밤을 그렇게 부른다 — 밀고자 처단.', // [계승] quest-deck.md Q08 카드 표제 원문 인용
  ];
  var STORY_CARD = '그날 밤, 이름 없는 밀고자 하나가 조용히 사라졌다. 갱단의 장부에는 아무것도 남지 않았다.';
  var REFRAIN = '이름을 판 값은, 이름으로 갚는다.';

  // ---- 전투 인카운터 (유흥가 뒷골목 6열 × 6행, 최단편) -------------------------
  //  좌표 {x:열 0..5, y:행 0..5}. row0=상단(밀고 단말), row5=하단(골목 입구·진입로).
  //  wall  : 이동+LoS 완전 차단(불투명). cover : 이동 차단·LoS 투과, DEF 보정만.
  var COMBAT = {
    cols: 6, rows: 6,
    playerStart: { x: 2, y: 5 },
    // 오브젝티브 = 밀고자 은신 콘솔(decoy, 상단 SIMPLIFIED 참고) — threshold 누적 차감.
    objective: { x: 2, y: 0, threshold: 6, veil: 0, label: '밀고 단말', dataTB: 0 },
    // [계승 G10] 위협 임계 — 최단편이라 증원 없음(아래 reinforcement 필드 생략).
    threatCap: 6,
    walls: [],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1. 뒷골목 쓰레기더미 2곳.
    cover: [
      { x: 0, y: 3, type: 'light' }, { x: 5, y: 3, type: 'light' },
    ],
    // 적 배치 — key 는 data/enemies.js 참조(통합 단계에서 추가, 계획 로스터 GANG_THUG 인용).
    //   갱단 3인이 골목을 지키며, 가운데(3,2) 개체가 곧 밀고자 본인(표적) — 로스터에
    //   전용 INFORMANT 유닛이 없어 GANG_THUG 로 재사용(신규 스탯 0, 순수 배치 표기).
    //   전 적 killable → 전멸전만으로도 완주 가능(MFU, 상단 SIMPLIFIED 참고).
    enemies: [
      { key: 'GANG_THUG', x: 1, y: 3 },
      { key: 'GANG_THUG', x: 3, y: 2 },   // ★밀고자 본인(표적) — 이 유닛이 곧 처단 대상
      { key: 'GANG_THUG', x: 4, y: 3 },
    ],
  };

  // ---- 대화 그래프 (docs/25 §4.2 노드 스키마, 최단편 — 분기 1개) ---------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'ANON', portrait: 'ghost',
        text: OPENING.join('\n'),
        choices: [
          { label: '유흥가 뒷골목으로 향한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — SPD(CIPHER)/ATK(BLADE) 게이트 2종이 각 클래스의 전투 지름길을
      // 대칭으로 연다(docs/25 §1·§4.4). 셋 다 동일한 'outro' 로 합류 — 최단 대화(1분기).
      approach: {
        id: 'approach', speaker: 'GANG', portrait: 'ghost',
        text: '유흥가 뒷골목. 쓰레기더미 사이로 갱단 셋이 입구와 안쪽을 지킨다. ' +
              '안쪽 어둠 속에서 밀고 단말 하나가 깜박인다 — 밀고자가 남긴 흔적.',
        choices: [
          { label: '무력으로 갱단을 제압한다',
            effect: { startCombat: { onWin: 'outro' } },
            desc: '갱단 3인 전멸전 → 밀고자 제압 (전투 경로, 양 클래스 완주 가능)',
          },
          { label: '[SPD 4] 갱단 눈을 피해 기습 즉결한다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { ambushKill: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'CIPHER(기본 SPD4) 직행 지름길 — BLADE(SPD3)는 미충족 → 전투 경로로 폴백',
          },
          { label: '[ATK 5] 골목 입구를 힘으로 밀고 정면 처리한다',
            gate: { attr: 'atk', min: 5 }, show: 'gray',
            setFlags: { forceEntry: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'BLADE(기본 ATK5) 직행 지름길 — CIPHER(ATK2)는 미충족 → 전투 경로로 폴백',
          },
        ],
      },
      // 세 출구 공통 아웃트로 — 전투/기습/강습 어느 경로든 결과는 같다(밀고자 처단).
      outro: {
        id: 'outro', speaker: 'CIPHER', portrait: 'ghost',
        text: '뒷골목이 조용해진다. 밀고자는 더 이상 이름을 팔지 못한다.\n' +
              '밀고 단말이 꺼진다 — 남은 흔적은 없다.\n' + STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { informantHitDone: true } }, checkpoint: true,
        choices: [ { label: '현장을 빠져나간다', goto: 'settle' } ],
      },
      settle: {
        id: 'settle', speaker: 'CIPHER', portrait: 'ghost',
        text: '청부가 끝났다. 갱단은 아무 일도 없었다는 듯 골목을 정리한다.\n' +
              '렙과 대금이 계좌로 흘러든다. 이름은 남지 않는다.',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (사이드 최단편 — 챕터/타 사이드 대비 최소 보상) ---------------
  var REWARDS = {
    rep: 1,
    karma: 1,
    nuyen: 5,
    unlocks: [],
  };

  var MISSION = {
    id: 'side-05-informant-hit',
    title: 'Side — Informant',
    subtitle: '사이드 — 밀고자 (유흥가 뒷골목 밀고자 처단)',
    kind: 'side',                                     // SIMPLIFIED 상단 주석 참고 — 신규 메타 필드, 엔진 미소비.
    unlock: { missionsDone: ['ch02-insider-game'] },   // SIMPLIFIED 상단 주석 참고 — missionsDone 포함 조건(통합 단계 배선 대상).
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_SIDE05_INFORMANT_HIT = API;
})();
