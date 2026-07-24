;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-a1-crown-breach.js — ACT 2 브랜치 A "IRON CROWN" A1
  //   "CROWN BREACH" — 넥서스 상층 의장실 벨트 침투 (2연전 멀티 인카운터)
  //   (엔진 무편집 콘텐츠. 포맷 정본 = a2-00-framing / ch01-first-blood. 순수 리터럴.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (act2_plan.md §2 브랜치 A · §2.0 MFU 2연전 · 62차-W1):
  //   갈래 게이트        [계승 §2] endingSeen:['corporate-eternal'] + missionsDone:['ch08-zero-day']
  //                     — 원전 chapter-08 §엔딩1 "CORPORATE ETERNAL"(블록 하나가 국가를 흡수)
  //                     로 도시 이름을 정한 세이브에만 열리는 갈래. 레지스트리(통합 담당) 소비.
  //   엔딩 후일담 톤      [계승] chapter-08 §엔딩1 원문 정합 — "승자 블록이 애시그리드의 새
  //                     이름이 된다 / ERA OF ONE 스티커". 승자 체제를 MERIDIAN이 통째로 인수
  //                     하려 협상+무력 병행(§2 브랜치 A 프레이밍).
  //   신규 세력 MERIDIAN  [신규 61차] data/enemies.js MERIDIAN_* 계보 주석 참조. 창작분 [신규] 태그.
  //   의뢰인 AIDE        [계승 §2] 승자 블록 내부의 이탈 임원(VERA ASHTON 계열 aide). VANTA
  //                     계열 → quote:'VANTA'(loreQuote) 로 DIRECTOR 명대사 버블 병기(lore-adapter).
  //   무대(상층 의장실)   [신규 · Ring1 미사용 상층] 넥서스 상층 의장실 벨트 → 상층 관제. Act2 미사용 무대축.
  //   MFU 2연전          [계승 §2.0] intro→approach(3출구)→enc①→interlude(서사+2게이트)→enc②
  //                     →outro→choice→settle. enc①=MISSION.combat(하위호환·검증기 계약),
  //                     enc②=MISSION.encounters.stage2. interlude 가 startCombat{encounter:'stage2'}로 개시.
  //   HP 풀회복          [계승 §3.1] buildCombat 이 인카운터마다 eff.maxHp 리필 — interlude=숨 고르기 서사.
  //   대사 버블          [계승 lore] loreQuote(VANTA)=VERA ASHTON DIRECTOR / snapshot 원문 그대로.
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: enc① approach [ATK 5] · enc② interlude [HACK 5]/[flag endingTrack] 게이트는
  //   전부 "지름길" — 각 인카운터에 무력 폴백(ungated startCombat)이 상존하므로 4클래스 전원
  //   완주 보장(MFU). [ATK5]=BLADE / [HACK5]=CIPHER 전용 지름길, 나머지 클래스는 폴백 전투.
  // SIMPLIFIED: [flag endingTrack] 는 ch08 endingSplit 이 세우는 계승 flag — 이 미션에서 set 하지
  //   않으므로 검증기 info("계승 플래그로 가정") 예상. corporate-eternal 세이브 해금 전제라 실전 상시 참.
  // ==========================================================================

  // ---- 원전 산문 앵커 (chapter-08 §엔딩1 CORPORATE ETERNAL 정합 · Act2 브랜치 A) --------
  var OPENING = [
    '블록 하나가 국가를 흡수했다. 애시그리드는 이제 한 이름으로 불린다 — 승자의 이름으로.', // [계승] chapter-08 §엔딩1
    '"ERA OF ONE." 도시의 봉인 위에 박힌 스티커. 그 아래에서 사람들은 숨을 죽이고 산다.', // [계승] §엔딩1 스티커
    '[AIDE] "나는 그 체제 안쪽 사람이야. 그리고 그 체제가 팔려 나가는 걸 봤어." 이탈 임원의 목소리가 떨린다.', // [계승] 의뢰인 = 이탈 임원
    '"성벽 너머에서 MERIDIAN이 왔어. 저들은 이 도시를 정복하려는 게 아니야 — 통째로 인수하려는 거야."', // [신규] MERIDIAN 협상+무력
    '"이미 상층 의장실 벨트가 저들 손에 봉쇄됐어. 로비 코어를 뚫고 관제 단말까지 닿아야 해. 협상 서명 직전에."', // [신규] 2연전 오브젝티브
    '단일 체제의 심장부. 도시를 삼킨 왕관이, 이제 더 큰 손에 넘어가려 한다.', // [계승] 왕관=단일 체제
  ];
  var STORY_CARD = 'MERIDIAN의 봉쇄가 상층에서 걷힌다. 그러나 관제 단말이 뱉어낸 계약서는 하나의 사실을 확정한다 — 도시는 이미 매물로 올라 있었다.';
  var REFRAIN = '도시를 삼킨 왕관은, 더 큰 손이 오면 그저 전리품이 된다.';

  // ---- enc① 인카운터 (넥서스 상층 의장실 벨트 · 봉쇄 로비 코어 7열 × 8행) ----------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(로비 코어), row7=하단(진입 벨트).
  //  [신규] 상층 의장실 벨트 무대. wall=봉쇄 격벽, cover=대리석 기둥/컨테이너 엄폐.
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    // 오브젝티브 = 봉쇄 로비 코어(threshold 누적 차감). [계승 store applyHackObjective]
    //   인접 유닛 max(HACK,ATK) 자동축 → 4클래스 모두 다른 축으로 완주(부가 승리 경로).
    //   threshold 9 = enc① 밴드(낮음, §5 이중 오브젝티브 8~10) · veil 0.
    objective: { x: 3, y: 0, threshold: 9, veil: 0, label: '봉쇄 로비 코어', dataTB: 1.4 },
    threatCap: 8,   // [계승 G10 raidThreshold] enc① 소형 페이싱(증원은 enc②에 배치).
    // [신규] 봉쇄 격벽 2개 — 좌우 통로 부분 차단(중앙 x=3 러시 레인 개방).
    walls: [
      { x: 1, y: 4 }, { x: 5, y: 4 },
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1. 상층 대리석 기둥/잔해.
    cover: [
      { x: 2, y: 5, type: 'light' }, { x: 4, y: 5, type: 'light' }, { x: 3, y: 6, type: 'light' },
      { x: 1, y: 2, type: 'light' }, { x: 5, y: 2, type: 'light' },
    ],
    // 적 배치 — MERIDIAN 봉쇄대(act2_plan.md §2 A1 enc①). VANGUARD×2 = IRON 중장 돌격(전위),
    //   DRONE×1 = VOLT 기계(DATA SPIKE 대상 · BLADE 물리 완주 보장). 전 적 killable → 전멸/
    //   오브젝티브 이중 승리(MFU).
    enemies: [
      { key: 'MERIDIAN_VANGUARD', x: 2, y: 4 },   // [62차 밸런스] 전위 하향 배치 — 진입 벨트 압박(러시 클래스 R1 노출 → 은신 대응 유도)
      { key: 'MERIDIAN_VANGUARD', x: 4, y: 4 },
      { key: 'MERIDIAN_DRONE',    x: 3, y: 5 },
    ],
  };

  // ---- enc② 인카운터 (상층 관제 단말 7열 × 8행 · MISSION.encounters.stage2) ---------
  //  [계승 §3.1] buildCombat 이 opts.combat 오버라이드로 combat 과 동일 스키마 소비.
  //  veil 1 = 관제 단말 은폐층(Act2 veil 적극 사용, §5). WARD_NODE 가 코어를 물리무효 수호.
  var ENC2 = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    objective: { x: 3, y: 0, threshold: 7, veil: 1, label: '상층 관제 단말', dataTB: 2.1 },   // [62차 밸런스] eff 13→10 · [65차 밸런스] eff 10→8 (BROKER hack2 은신 3턴 창 내 완주 — R2 잠적 후 R3~R4 차감 4+4)
    threatCap: 10,  // enc② 상향 페이싱 + 증원.
    reinforcement: { key: 'MERIDIAN_DRONE', x: 6, y: 1 },  // [계승 §2 A1 증원 MERIDIAN_DRONE]
    walls: [
      { x: 2, y: 3 }, { x: 4, y: 3 },
    ],
    cover: [
      { x: 1, y: 5, type: 'light' }, { x: 5, y: 5, type: 'light' }, { x: 3, y: 6, type: 'full' },
      { x: 2, y: 4, type: 'light' }, { x: 4, y: 4, type: 'light' },
    ],
    // enc② — STALKER×2(SHADE 저격, 코어 압박) + VANTA_ELITE(잔존 체제 정예, 블록 유닛 보조 재활용)
    //   + WARD_NODE(GRID physImmune·hackOnly = 코어 앞 정적 수호 · HACK 축 시연 · ICE_NODE 차별).
    enemies: [
      { key: 'WARD_NODE',        x: 3, y: 1 },   // 코어 앞 정적 수호 (물리무효 · HACK 전용)
      { key: 'MERIDIAN_STALKER', x: 1, y: 2 },
      { key: 'MERIDIAN_STALKER', x: 5, y: 2 },
      { key: 'VANTA_ELITE',      x: 3, y: 4 },
    ],
  };

  // ---- 대화 그래프 (MFU §2.0 2연전: approach→enc①→interlude→enc②) ----------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'AIDE', portrait: 'bloc',
        quote: 'VANTA',                        // loreQuote(VANTA)=VERA ASHTON DIRECTOR 버블(어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: '상층 의장실 벨트로 진입한다 — 봉쇄 로비 코어를 뚫는다', goto: 'approach' },
        ],
      },
      // ★enc① 심장 MFU 노드 — 무력 폴백 / [ATK5] 지름길 두 출구가 interlude 로 합류.
      approach: {
        id: 'approach', speaker: 'AIDE', portrait: 'bloc',
        text: '상층 의장실 벨트. 봉쇄 격벽 사이로 MERIDIAN 중장 돌격대가 로비 코어를 틀어막고 있다.\n' +
              '정찰 드론 하나가 천장 벨트를 맴돈다. 협상 서명까지 남은 시간은 길지 않다.',
        choices: [
          { label: 'MERIDIAN 봉쇄대를 정면으로 돌파한다',
            effect: { startCombat: { onWin: 'interlude' } },
            setFlags: { crownBreachLoud: true },
            desc: 'MERIDIAN 봉쇄대(VANGUARD×2 + DRONE)와 전투 → 로비 코어 확보 (공통 폴백, 4클래스 완주 가능)',
          },
          { label: '[ATK 5] 격벽을 힘으로 밀어 열고 돌격로를 낸다',
            gate: { attr: 'atk', min: 5 }, show: 'gray',
            setFlags: { crownBreachForced: true },
            effect: { skipCombat: true }, goto: 'interlude',
            desc: '고ATK(BLADE 축) → 봉쇄대 우회, 로비 코어 직행(지름길). 저ATK 클래스는 잠김 → 전투로 폴백',
          },
        ],
      },
      // ★interlude — 서사 전환 + enc② 2번째 게이트. startCombat{encounter:'stage2'} 로 enc② 개시.
      interlude: {
        id: 'interlude', speaker: 'AIDE', portrait: 'bloc',
        text: '로비 코어가 열린다. 그 너머는 상층 관제 단말 — 도시의 조세와 데이터가 한 점으로 모이는 곳.\n' +
              '"저 단말에 서명이 얹히면 도시는 MERIDIAN 소유가 돼. STALKER 저격수들이 은폐 베일 뒤에 붙었어. 코어 앞엔 워드 노드 — 물리는 안 통해."\n' +
              '숨을 고른다. 여기서부터가 진짜다.',
        onEnter: { setFlags: { crownLobbyCleared: true } }, checkpoint: true,
        choices: [
          { label: '관제 단말로 강행 돌파한다',
            effect: { startCombat: { encounter: 'stage2', onWin: 'outro' } },
            setFlags: { crownThroneLoud: true },
            desc: 'enc② — STALKER×2 + VANTA_ELITE + WARD_NODE(HACK 전용 수호)와 전투 → 관제 단말 확보 (공통 폴백)',
          },
          { label: '[HACK 5] 관제 단말 프로토콜을 원격 역해독해 서명을 무력화한다',
            gate: { attr: 'hack', min: 5 }, show: 'gray',
            setFlags: { crownThroneHacked: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: '고HACK(CIPHER 축) → 워드 노드·베일 우회, 단말 즉시 무력화(지름길). 저HACK 클래스는 잠김 → 전투로 폴백',
          },
          { label: '[flag endingTrack] 승자 체제 관리자 권한으로 단말을 정지시킨다',
            gate: { flag: 'endingTrack' }, show: 'gray',
            setFlags: { crownThroneOverride: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'ch08 endingTrack(corporate-eternal 계승) → 체제 잔존 권한으로 단말 정지(지름길). 갈래 해금 전제라 상시 참',
          },
        ],
      },
      // enc②/우회 공통 아웃트로 — 어느 경로든 결과는 같다(관제 단말 확보·계약 저지).
      outro: {
        id: 'outro', speaker: 'AIDE', portrait: 'bloc',
        text: '관제 단말이 정지한다. 서명란은 비어 있다 — 오늘 밤만은.\n' +
              '"막았어. 하지만 여기 계약서를 봐. 도시는 이미 매물이었어. MERIDIAN은 사려던 거고." AIDE의 손이 떨린다.\n' + STORY_CARD,
        onEnter: { setFlags: { crownThroneStopped: true, meridianContractSeen: true } }, checkpoint: true,
        choices: [ { label: '계약서를 확보한다', goto: 'choice' } ],
      },
      // ★플레이어 선택 [계승 §2.0 choice · 서사분기 setFlags] — 승자 체제와 MERIDIAN 사이.
      choice: {
        id: 'choice', speaker: 'AIDE', portrait: 'bloc',
        text: '"이제 어쩌지? 이 계약서는 무기야. 체제를 지키는 데 쓸 수도, 무너뜨리는 데 쓸 수도 있어."',
        choices: [
          { label: 'A. 계약서를 승자 체제에 넘겨 방어를 굳힌다',
            setFlags: { crownChoice: 'fortify', crownFortified: true }, goto: 'settle',
            desc: '단일 체제 존속 강화 · MERIDIAN 인수 저지 (영속 flag)',
          },
          { label: 'B. 계약서를 유출해 체제와 MERIDIAN을 동시에 흔든다',
            setFlags: { crownChoice: 'leak', crownLeaked: true }, goto: 'settle',
            desc: '체제·MERIDIAN 양쪽 균열 · 다음 미션 정세 변동 (영속 flag)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'AIDE', portrait: 'bloc',
        text: 'IRON CROWN — 상층은 지켜졌다. 그러나 도시가 매물이었다는 사실은 지워지지 않는다.\n' +
              '"ERA OF ONE"의 봉인 아래, 이제 두 개의 손이 같은 왕관을 노린다. 다음은 조세·데이터 볼트다.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (act2_plan.md §2 A1: rep6 karma2 ₵12 · unlock A2) --------------
  //   A2 해금은 레지스트리 unlock(통합 담당) 소비 — rewards.unlocks(카드 해금)와 별개.
  var REWARDS = {
    rep: 6,
    karma: 2,
    nuyen: 12,
    unlocks: [],
  };

  var MISSION = {
    id: 'a2-a1-crown-breach',
    title: 'IRON CROWN I — Crown Breach',
    subtitle: 'ACT 2 브랜치 A — 넥서스 상층 의장실 벨트 (2연전 · 의뢰인 이탈 임원)',
    kind: 'act2',                                             // 61차 campaign.js 레지스트리 소비(ACT 2 보드 섹션).
    unlock: { missionsDone: ['ch08-zero-day'], endingSeen: ['corporate-eternal'] },
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                                           // enc① (하위호환 · startCombat→M.combat 계약)
    encounters: { stage2: ENC2 },                             // enc② (interlude startCombat{encounter:'stage2'})
    rewards: REWARDS,
    nextHint: 'IRON CROWN II: "Crown Throne" — 조세·데이터 볼트 (A1 완주 시 해금)',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_A1_CROWN_BREACH = API;
})();
