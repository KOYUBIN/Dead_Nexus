;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/side-02-corp-breach.js — 사이드 미션 "Corporate Breach"
  //   (사이드 = 챕터 밖 단편/중편 미션. ch01-first-blood.js 스키마 그대로 재사용,
  //    엔진 무편집으로 콘텐츠 추가 — docs/25 §5.1. 포맷 정본 = ch01/side-01.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문(청부 의뢰문)     [계승] cards/events/quest-deck.md Q11 "기업 비밀
  //                                탈취"(의뢰인 🌃 거리 · 목표 "블록 구역의 베일 레벨
  //                                3 이상 해제" 발췌) — G4 데이터허브 안쪽 "설계도
  //                                캐시" 탈취 목표문형은 [계승] Q14 "군사 기밀 유출"
  //                                ("데이터허브 침투하여 설계도 탈취") 구조를 그대로
  //                                가져오되, 대상 블록만 IRONWALL→AXIOM 치환(docs/10
  //                                §4 G4 데이터허브=AXIOM 지원 구역과 정합, 의뢰인도
  //                                Q11 쪽 🌃 거리·익명 유지 — Q14 원문의 AXIOM 발주·
  //                                IRONWALL 적대 조항은 채택하지 않음).
  //   "가격은 필요에 비례한다" 인용 [각색] cards/objectives/ghost.md G-A02 "블랙마켓
  //                                왕" 플레이버 원문("정식 가격표는 없다. 가격은
  //                                필요에 비례한다.") — 원전은 블랙마켓 카드 5장
  //                                구매 달성 조건의 플레이버이나, 본 미션은 거리
  //                                의뢰의 익명 거래 원칙 대사로 각색 차용(성취 조건
  //                                자체는 미채택 — 대사 인용만).
  //   AXIOM 데이터허브 무대       [계승] docs/10-map-zones.md §4 Ring 2 업타운 표
  //                                G4(데이터허브 · AXIOM 지원) + 업타운 특수 규칙
  //                                ("블록 소유 구역의 베일 기본 강도 +1") — 접근
  //                                대화의 "베일 강도 3 우회" HACK 게이트 근거.
  //   AXIOM 스탯 라인 근거        [계승] docs/07-combat-stats.md §2 "Bloc 임원 스탯"
  //                                AXIOM 6/2/2/4/5(HP/ATK/DEF/SPD/HACK) — 로스터
  //                                (AXIOM_DRONE/ICE_NODE) 수치 근거로만 인용, 실제
  //                                정의는 data/enemies.js(통합 단계) 소관.
  //   접근 대화 3출구 구조        [계승 docs/25 §4.4 MFU 패턴] ch01/ch02 approach
  //                                노드의 "전투 / attr 게이트 우회×2" 골격 재사용,
  //                                HACK4·SPD4 두 축을 한 노드에 병렬 배치(서로 다른
  //                                축이지만 둘 다 CIPHER 유리 스탯 — docs/07 §2
  //                                CIPHER HACK5/SPD4 vs BLADE HACK1/SPD3 그대로).
  //   오브젝티브 자동축 완주      [계승 store.js applyHackObjective 기존 계약, §MFU]
  //                                신규 메커닉 0 — objective-reduce 오브젝티브는
  //                                인접 유닛의 max(HACK,ATK) 축으로 자동 차감되므로,
  //                                전투 경로에서는 CIPHER=해킹·BLADE=강습으로 같은
  //                                목표(설계도 캐시)를 다른 축으로 완주한다.
  //   전투 인카운터 무대          [신규] AXIOM 데이터허브 6×6, 설계도 캐시 오브젝티브.
  //   순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: MISSION.kind / MISSION.unlockRequires 는 ch01~ch08 엔진 계약에
  //   없던 신규 최상위 메타 필드다(side-01-traitor-contract.js 와 동일 패턴).
  //   현재 엔진(store.js/campaign.js)은 두 필드를 읽지 않으므로 전투/대화/보상
  //   계약에는 영향이 없다(순수 추가 데이터) — 사이드 미션 해금 조건("missionsDone
  //   에 ch02-insider-game 포함")을 문서화해 두는 용도이며, 실제 게이트 판정(허브
  //   미션보드 필터링)은 통합 단계에서 이 필드를 읽어 배선해야 한다.
  // ==========================================================================

  // ---- 원전 산문 앵커 (quest-deck.md Q11+Q14 발췌·결합, ghost.md G-A02 각색) ---
  var OPENING = [
    '"정식 가격표는 없다. 가격은 필요에 비례한다."', // [각색] ghost.md G-A02 플레이버 원문 인용
    '거리의 중개인이 암호화 메시지 한 줄을 띄운다. 발신자는 없다.', // [계승] Q11 의뢰인 🌃 거리(익명)
    '"목표 — 블록 구역의 베일 레벨 3 이상 해제. 데이터허브 내부, 설계도 캐시를 확보하라."', // [계승] Q11 목표문(베일 레벨3 해제) + Q14 목표문형(데이터허브 침투·설계도 탈취) 결합
    '의뢰인은 이름을 남기지 않는다. 대금은 이미 걸려 있다. 취소는 없다.',
    '업타운 G4 — AXIOM 지원 데이터허브. 블록 구역이라 베일 기본 강도가 한 단계 더 걸려 있다.', // [계승] docs/10 §4 G4(데이터허브·AXIOM 지원) + 업타운 특수규칙(베일 기본강도+1)
    '오늘 밤, 그 베일을 뚫는다.',
  ];
  var STORY_CARD = '그날 밤, 이름 없는 거래 하나가 성사됐다. 대금은 이미 걸려 있었고, 질문은 없었다.';
  var REFRAIN = '가격은 필요에 비례한다.';

  // ---- 전투 인카운터 (AXIOM 데이터허브 6열 × 6행, 중편) -----------------------
  //  좌표 {x:열 0..5, y:행 0..5}. row0=상단(설계도 캐시), row5=하단(진입로).
  //  wall  : 이동+LoS 완전 차단. cover : 이동 차단·LoS 투과, DEF 보정만.
  var COMBAT = {
    cols: 6, rows: 6,
    playerStart: { x: 2, y: 5 },
    // 오브젝티브 = 설계도 데이터 수집(threshold 누적 차감 = objective-reduce).
    //  effective threshold = 6 + veil 1 = 7 (buildCombat 이 veil 를 가산).
    //  [계승 store.js applyHackObjective] 인접 유닛의 max(HACK,ATK) 축 자동 선택 —
    //  CIPHER(HACK5>ATK2)는 해킹, BLADE(ATK5>HACK1)는 강습으로 같은 캐시를 차감(MFU).
    // 51차 밸런스: 6+veil1(=7) → 11+veil0(=11) — 무피해 2R 러시(트리비얼) 방지(BLADE 2해킹턴 강제).
    objective: { x: 2, y: 0, threshold: 11, veil: 0, label: 'AXIOM 설계도 캐시', dataTB: 2.2 },
    // [계승 G10, 각색 raidThreshold] 위협/노출 임계 + 증원(경보 시 1회 스폰).
    threatCap: 8,
    reinforcement: { key: 'AXIOM_DRONE', x: 5, y: 1 },
    walls: [],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1.
    cover: [
      { x: 0, y: 2, type: 'light' }, { x: 5, y: 2, type: 'light' },
      { x: 1, y: 4, type: 'light' }, { x: 4, y: 4, type: 'light' },
    ],
    // 적 배치 — key 는 data/enemies.js 참조(통합 단계에서 추가, 계획 로스터 ID만 인용).
    //   ICE Node 는 캐시 앞 정적 수호(HACK 전용 파괴, 선택 대상 — 전멸전 없이도 승리 가능).
    enemies: [
      { key: 'AXIOM_DRONE', x: 1, y: 3 },
      { key: 'AXIOM_DRONE', x: 4, y: 3 },
      { key: 'ICE_NODE',    x: 2, y: 1 },   // 캐시 앞 정적 수호 (SHADE, 물리무효·HACK만)
    ],
  };

  // ---- 대화 그래프 (docs/25 §4.2 노드 스키마) ----------------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'STREET', portrait: 'ghost',
        quote: 'CIPHER',                       // 고스트 포트레이트 = 현재 클래스 명대사 (어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: 'AXIOM 데이터허브로 향한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — HACK/SPD 두 게이트가 서로 다른 축으로 전투를 실제 제거
      // (docs/25 §1·§4.4). 둘 다 CIPHER 유리(HACK5·SPD4) 스탯이지만 축이 다르고,
      // BLADE(HACK1·SPD3)는 둘 다 잠겨 전투 경로로 완주 — 심장 MFU 그대로 재확인.
      approach: {
        id: 'approach', speaker: 'AXIOM', portrait: 'bloc',
        quote: 'AXIOM',
        text: '업타운 G4, AXIOM 데이터허브 진입로. 자율 경비 드론 두 기가 통로를 돌고, ' +
              '안쪽 캐시 앞엔 정적 ICE 노드가 버틴다. 베일 게이지가 3단으로 걸려 있다.',
        choices: [
          { label: '무력으로 데이터허브를 돌파한다',
            effect: { startCombat: { onWin: 'outro' } },
            desc: 'AXIOM 경비 드론과 전투 → 캐시 확보 (양 클래스 완주 · BLADE 강습 폴백)',
          },
          { label: '[HACK 4] 베일 강도 3을 우회한다',
            gate: { attr: 'hack', min: 4 }, show: 'gray',
            setFlags: { veilBypassed: true },
            effect: { skipCombat: true }, goto: 'outroBypass', // 라우팅은 goto 담당, skipCombat 은 문서 필드(전방 호환 훅)
            desc: 'CIPHER HACK5 → 베일 무력화, 경비 조우 스킵. BLADE HACK1 잠김 → 전투 경로로 폴백',
          },
          { label: '[SPD 4] 순찰 사이 빈틈으로 잠입한다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { patrolGapUsed: true },
            effect: { skipCombat: true }, goto: 'outroInfiltrate',
            desc: 'CIPHER SPD4 통과 → 순찰 루프 사이로 잠입. BLADE SPD3 잠김 → 전투 경로로 폴백',
          },
        ],
      },
      // 전투 승리 후 아웃트로 (오브젝티브 = 전투 중 캐시 차감으로 이미 추출).
      outro: {
        id: 'outro', speaker: 'CIPHER', portrait: 'ghost',
        text: '드론이 쓰러지고 ICE 노드가 꺼진다. 설계도 캐시가 열린다 — 2.2테라바이트, 경보와 함께.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { corpBreachDone: true, extractionStyle: 'loud' } }, checkpoint: true,
        choices: [ { label: '거리로 빠져나간다', goto: 'settle' } ],
      },
      // HACK 우회 아웃트로 (전투 없이 베일 무력화 → 잠입 추출).
      outroBypass: {
        id: 'outroBypass', speaker: 'CIPHER', portrait: 'ghost',
        text: '베일 게이지가 조용히 풀린다. 드론은 아무것도 감지하지 못한다.\n' +
              '캐시에 접속한다 — 2.2테라바이트. 로그 한 줄 남기지 않고.\n' + STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { corpBreachDone: true, extractionStyle: 'quiet', ghostedExtraction: true } }, checkpoint: true,
        choices: [ { label: '거리로 빠져나간다', goto: 'settle' } ],
      },
      // SPD 우회 아웃트로 (전투 없이 순찰 틈새 잠입 → 잠입 추출).
      outroInfiltrate: {
        id: 'outroInfiltrate', speaker: 'CIPHER', portrait: 'ghost',
        text: '순찰 루프의 3초 틈으로 미끄러져 들어간다. 카메라는 벽만 봤다.\n' +
              '캐시가 열린다 — 2.2테라바이트. 발소리 하나 남기지 않고.\n' + STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { corpBreachDone: true, extractionStyle: 'quiet', patrolGhosted: true } }, checkpoint: true,
        choices: [ { label: '거리로 빠져나간다', goto: 'settle' } ],
      },
      settle: {
        id: 'settle', speaker: 'CIPHER', portrait: 'ghost',
        text: '설계도가 거리로 넘어간다. 의뢰인은 이름을 남기지 않았고, 대금은 소리 없이 정산됐다.\n' +
              '블록은 오늘 밤 자신이 무엇을 잃었는지도 모른다.',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (사이드 중편 — 챕터 대비 축소 보상) --------------------------
  var REWARDS = {
    rep: 2,
    karma: 1,
    nuyen: 7,
    unlocks: [],
  };

  var MISSION = {
    id: 'side-02-corp-breach',
    title: 'Side — Corporate Breach',
    subtitle: '사이드 — 기업 침투 (AXIOM 데이터허브 설계도 탈취)',
    kind: 'side',                                     // SIMPLIFIED 상단 주석 참고 — 신규 메타 필드, 엔진 미소비.
    unlockRequires: ['ch02-insider-game'],             // SIMPLIFIED 상단 주석 참고 — missionsDone 포함 조건(통합 단계 배선 대상).
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_SIDE02_CORP_BREACH = API;
})();
