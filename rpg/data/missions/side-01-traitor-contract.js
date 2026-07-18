;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/side-01-traitor-contract.js — 사이드 미션 "Traitor's Contract"
  //   (사이드 = 챕터 밖 단편 미션. ch01-first-blood.js 스키마 그대로 재사용,
  //    엔진 무편집으로 콘텐츠 추가 — docs/25 §5.1)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문(청부 의뢰문)     [계승] cards/events/quest-deck.md Q06 "배신자 처리"
  //                                (의뢰인 IRONWALL · 목표 "지정 NPC(전직 IRONWALL
  //                                직원) 제거" 발췌·각색)
  //   G-R01 플래이버 인용         [계승] cards/objectives/ghost.md G-R01 "표적 처리"
  //                                원문 인용("내 형제가 그 건물에서 뛰어내렸다...")
  //   무기고 구역 무대            [계승] docs/10-map-zones.md §3(Ring 2 업타운 표)
  //                                IRONWALL HQ F7(무기고 본사) · 지원 E8/F8(무기고)
  //   IRONWALL 스탯 라인 근거      [계승] docs/07-combat-stats.md §2 "Bloc 임원 스탯"
  //                                IRONWALL 10/5/4/3/1 (HP/ATK/DEF/SPD/HACK) —
  //                                적 로스터(IRONWALL_ENFORCER/TURRET) 수치 근거로만
  //                                인용, 실제 정의는 data/enemies.js(통합 단계) 소관
  //   접근 대화 3출구 구조        [계승 docs/25 §4.4 MFU 패턴] ch01-first-blood.js
  //                                approach 노드의 "전투/게이트 우회×2" 골격 재사용
  //   ATK 게이트 처형 플래이버    [각색] docs/07-combat-stats.md §5.3 "처형 시도(계약
  //                                처형)" + cards/ghost/blade.md Card04 CONTRACT KILL
  //                                Flavor("Contract accepted. No further questions.")
  //                                — 원전은 SPD 판정 즉사 카드 효과, 본 미션은 엔진이
  //                                지원하는 결정론 attr 게이트(atk≥5)로 SIMPLIFIED하여
  //                                "정면 처형" 분기의 플레이버로만 차용(신규 메커닉 0).
  //   전투 인카운터 무대          [신규] IRONWALL 무기고 6×6, 표적 신원 콘솔 오브젝티브
  //   순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: MISSION.kind / MISSION.unlockRequires 는 ch01~ch07 에 없던 신규
  //   최상위 메타 필드다. 현재 엔진(store.js/campaign.js)은 두 필드를 읽지 않으므로
  //   전투/대화/보상 계약에는 영향이 없다(순수 추가 데이터) — 사이드 미션 해금 조건
  //   ("missionsDone 에 ch01-first-blood 포함")을 문서화해 두는 용도이며, 실제 게이트
  //   판정(허브 미션보드 필터링)은 통합 단계에서 이 필드를 읽어 배선해야 한다.
  // ==========================================================================

  // ---- 원전 산문 앵커 (quest-deck.md Q06 + ghost.md G-R01, 발췌·각색) ---------
  var OPENING = [
    'IRONWALL은 배신자를 공개 재판에 세우지 않는다.', // [각색] Q06 의뢰 성격 재서술
    '익명 중개인의 메시지 한 줄: "지정 대상 — 전직 자사 직원. 사유는 묻지 마라. 처리만 확인한다."', // [계승 Q06 목표문 발췌·각색]
    '계약금은 이미 입금됐다. 취소는 없다.',
    '"내 형제가 그 건물에서 뛰어내렸다. 아니, 던져졌다."', // [계승] ghost.md G-R01 플래이버 원문 인용
    '거리는 이런 계약을 그렇게 부른다 — 표적 처리.',
    '오늘 밤, 무기고 구역. IRONWALL 지원 구역 E8 인근에서 표적이 마지막으로 포착됐다.', // [계승] docs/10 §3 IRONWALL E8
  ];
  var STORY_CARD = '그날 밤, 이름 없는 청부 하나가 처리됐다. IRONWALL 장부에는 그저 "해결됨"이라 적혔다.';
  var REFRAIN = '계약은 깨지지 않는다. 사람만 깨질 뿐이다.';

  // ---- 전투 인카운터 (IRONWALL 무기고 6열 × 6행, 단편) ------------------------
  //  좌표 {x:열 0..5, y:행 0..5}. row0=상단(표적 신원 콘솔), row5=하단(진입로).
  var COMBAT = {
    cols: 6, rows: 6,
    playerStart: { x: 2, y: 5 },
    // 51차 밸런스: threshold 8→9 + threatCap 7→8 — 무피해 2R 러시(트리비얼) 방지 & 조기 증원 완화.
    //  IRONWALL 이중 집행관은 저HP 클래스가 은신 러시(objective-reduce)로 우회 완주(전멸 불요).
    objective: { x: 2, y: 0, threshold: 9, veil: 0, label: '표적 신원 콘솔', dataTB: 0 },
    // [계승 G10] 위협 임계 + 증원(경보 시 1회 스폰). 51차: 7→8 조기 증원 완화.
    threatCap: 8,
    reinforcement: { key: 'IRONWALL_ENFORCER', x: 5, y: 1 },
    walls: [],
    // [계승 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1.
    cover: [
      { x: 0, y: 3, type: 'light' },
      { x: 5, y: 3, type: 'light' },
      { x: 2, y: 4, type: 'light' },
    ],
    // 적 배치 — key 는 data/enemies.js 참조(통합 단계에서 추가, 계획 로스터 ID만 인용).
    //   IRONWALL_TURRET 의도 특성(고정 포탑·coverShooter·mov0·isMachine)은
    //   enemies.js 정의 소관 — 이 파일은 key/x/y 만 소비(buildCombat 계약).
    //   전 적(포탑 포함) killable → CIPHER/BLADE 양쪽 전멸전으로 완주 가능(MFU).
    enemies: [
      { key: 'IRONWALL_ENFORCER', x: 1, y: 3 },
      { key: 'IRONWALL_ENFORCER', x: 4, y: 3 },
      { key: 'IRONWALL_TURRET',   x: 2, y: 1 },
    ],
  };

  // ---- 대화 그래프 (docs/25 §4.2 노드 스키마, 짧은 단편 — 분기 최소) -----------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'IRONWALL', portrait: 'bloc',
        quote: 'IRONWALL',
        text: OPENING.join('\n'),
        choices: [
          { label: '무기고 구역으로 향한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 전투 / ATK 게이트(BLADE 지름길) / 태그 게이트(미보유 광고).
      approach: {
        id: 'approach', speaker: 'IRONWALL', portrait: 'bloc',
        quote: 'IRONWALL',
        text: 'F7 무기고 담벼락. IRONWALL 정예 두 명과 고정 감시 포탑이 통로를 지킨다. 안쪽에서 표적 신원 확인 콘솔이 깜박인다.',
        choices: [
          { label: '무력으로 표적 분대를 제압한다',
            effect: { startCombat: { onWin: 'outro' } },
            desc: 'IRONWALL 경비 전멸전 → 콘솔 확보 (전투 경로, 양 클래스 완주 가능)',
          },
          { label: '[ATK 5] 정면 처형으로 즉결한다',
            gate: { attr: 'atk', min: 5 }, show: 'gray',
            setFlags: { executionStyle: 'contract' },
            effect: { skipCombat: true }, goto: 'outroExecution',
            desc: 'BLADE(기본 ATK5) 직행 지름길 — CIPHER(ATK2)는 미충족 → 전투 경로로 폴백',
          },
          { label: '[IRONWALL 태그] 용병 위장으로 접근한다',
            gate: { tag: 'IRONWALL' }, show: 'gray',
            setFlags: { executionStyle: 'infiltration' },
            effect: { skipCombat: true }, goto: 'outroDisguise',
            desc: '사회/BROKER 빌드 축(위장 태그) — 현재 CIPHER/BLADE 로스터에는 없음, 후속 확장 시 해금(광고)',
          },
        ],
      },
      // 전투 승리 후 아웃트로.
      outro: {
        id: 'outro', speaker: 'CIPHER', portrait: 'ghost',
        text: '정예가 쓰러지고 콘솔이 표적 신원을 토해낸다. IRONWALL 무기고 한 켠에서, 계약이 이행됐다.\n' + STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { traitorContractDone: true } }, checkpoint: true,
        choices: [ { label: '현장을 빠져나간다', goto: 'settle' } ],
      },
      // ATK 게이트 처형 아웃트로 — [각색] docs/07 §5.3 CONTRACT KILL 플래이버.
      outroExecution: {
        id: 'outroExecution', speaker: 'CIPHER', portrait: 'ghost',
        text: '표적이 대응하기도 전에 끝난다. "계약 수락. 추가 질문 없음."\n전투는 없었다 — 필요하지도 않았다.\n' + STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { traitorContractDone: true, cleanExecution: true } }, checkpoint: true,
        choices: [ { label: '현장을 빠져나간다', goto: 'settle' } ],
      },
      // 태그 게이트 위장 아웃트로 — 현재 빌드 미보유(구조상 존재, 실질 도달 불가).
      outroDisguise: {
        id: 'outroDisguise', speaker: 'CIPHER', portrait: 'ghost',
        text: '위장 완장이 감시망을 속인다. 표적은 낯선 얼굴이 아니라 익숙한 계급장을 본다.\n방아쇠를 당기는 손은 동료의 손이 아니었다.\n' + STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { traitorContractDone: true, cleanExecution: true } }, checkpoint: true,
        choices: [ { label: '현장을 빠져나간다', goto: 'settle' } ],
      },
      settle: {
        id: 'settle', speaker: 'CIPHER', portrait: 'ghost',
        text: '청부가 완료됐다. IRONWALL 장부에는 그저 "해결됨"이라 적힌다.\n렙과 대금이 계좌로 흘러든다. 이름은 남지 않는다.',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (사이드 단편 — 챕터 대비 축소 보상) --------------------------
  var REWARDS = {
    rep: 2,
    karma: 1,
    nuyen: 6,
    unlocks: [],
  };

  var MISSION = {
    id: 'side-01-traitor-contract',
    title: 'Side — Traitor\'s Contract',
    subtitle: '사이드 — 배신자 청부 (IRONWALL 무기고 표적 처리)',
    kind: 'side',                                // SIMPLIFIED 상단 주석 참고 — 신규 메타 필드, 엔진 미소비.
    unlockRequires: ['ch01-first-blood'],         // SIMPLIFIED 상단 주석 참고 — missionsDone 포함 조건(통합 단계 배선 대상).
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_SIDE01_TRAITOR_CONTRACT = API;
})();
