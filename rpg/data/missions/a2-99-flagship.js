;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-99-flagship.js — [신규 v6.44 · 과제 A1] ACT 2 캡스톤
  //   "MERIDIAN FLAGSHIP" — 4갈래 종결전이 수렴하는 최종 결전 (3연전 · OVERLORD 보스)
  //   (엔진 무편집 콘텐츠. 포맷 정본 = a2-a2-crown-throne. 순수 리터럴.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (과제 A1 · act2_plan.md §2 계승):
  //   해금 게이트        [신규] 4갈래 종결 미션 전부 클리어 —
  //                     missionsDone:['a2-a2-crown-throne','a2-b2-freeport','a2-c2-signal-war',
  //                     'a2-d2-last-signal'] (campaign.isUnlocked AND 게이트 기지원).
  //   수렴 서사          [신규] 네 전선(왕관·자유항·재건 넥서스·폐허)에서 세운 종결 flag 를
  //                     회고 노드(muster)의 flag 게이트 선택으로 반영 — 지난 선택이 vanguard 를 정한다.
  //   신규 보스 OVERLORD [신규] data/enemies.js MERIDIAN_OVERLORD (WARLORD 상위 · GRID 사령관).
  //   3연전 구조         [계승 §3.1 확장] intro→muster(회고)→approach(enc①)→bridge1(interlude)→
  //                     enc②→bridge2(interlude2)→enc③(OVERLORD)→outro→settle→캡스톤 에필로그.
  //                     enc①=MISSION.combat / enc②=encounters.stage2 / enc③=encounters.stage3.
  //                     (store.dialogueChoose 가 startCombat.encounter 로 임의 키 소비 — stage3 지원 확인.)
  //   캡스톤 에필로그     [신규 — 리프레인 "블록은 불사신이 아니다" 변주] ending.js CAPSTONE
  //                     "ASHGRID PREVAILS". 4엔딩 기록과 별개(endings.capstone) — settle 이
  //                     effect.capstoneEpilogue 로 라우팅(store 확장).
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: 각 인카운터에 무력 폴백(ungated startCombat) 상존 → 4클래스 전원 완주 보장(MFU).
  //   지름길: approach [SPD4]=CIPHER · bridge1 [DEF3]=BLADE/RIGGER/MOLE · bridge2 [HACK5]=CIPHER /
  //   [VANTA tag]=MOLE. 나머지는 폴백 전투. OVERLORD(DEF5)는 저ATK 직접 격파 난망 → enc③ 은
  //   오브젝티브(사령 코어) 차감 경로가 4클래스 공통 완주선(밸런스 하네스 재측정 근거).
  // ==========================================================================

  // ---- 원전 산문 앵커 (4갈래 수렴 · 리프레인 변주) --------------------------------
  var OPENING = [
    '네 개의 밤이 하나로 접힌다. 왕관을 지킨 자, 자유항을 연 자, 넥서스를 재건한 자, 폐허를 지킨 자 — 오늘 같은 하늘 아래 선다.', // [신규] 4갈래 수렴
    '[SIGNAL] "저들이 다 왔어. 정찰도, 전위도, 전쟁군주도 아니야 — 기함이야. MERIDIAN 함대의 심장이 애시그리드 상공에 떴어."', // [신규] 기함
    '[SIGNAL] "그리고 그 안에 OVERLORD 가 있어. 성벽 너머 논리의 정점. 협상이 끝난 자리에 남는 것들 중, 가장 큰 것."', // [신규] OVERLORD
    '기함이 스카이라인을 가른다. 도시를 삼킨 체제도, 도시를 되찾은 거리도, 오늘 밤은 같은 편에서 고개를 든다.', // [신규] 수렴 톤
    '[SIGNAL] "착륙 격벽을 뚫고, 근위를 걷어내고, 사령 코어에 닿아. 세 겹이야. 저 기함을 도시 위로 떨어뜨리자."', // [신규] 3연전 오브젝티브
  ];
  var STORY_CARD = 'MERIDIAN 기함이 스카이라인 아래로 가라앉는다. 네 전선에서 온 유령들이 같은 재를 밟고 선다 — 승리가 아니라, 생존의 재를.';
  var REFRAIN = '블록은 불사신이 아니었다. 그리고 오늘, 성벽 너머의 것들도 불사신이 아니라는 것이 증명됐다.';

  // ---- enc① 인카운터 (기함 착륙 격벽 7열 × 8행 · 침공 전위) -----------------------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(착륙 격벽), row7=하단(진입).
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    objective: { x: 3, y: 0, threshold: 9, veil: 0, label: '기함 착륙 격벽', dataTB: 2.0 },
    threatCap: 9,
    walls: [
      { x: 1, y: 4 }, { x: 5, y: 4 },
    ],
    cover: [
      { x: 2, y: 5, type: 'light' }, { x: 4, y: 5, type: 'light' }, { x: 3, y: 6, type: 'full' },
      { x: 1, y: 2, type: 'light' }, { x: 5, y: 2, type: 'light' },
    ],
    // enc① — 침공 전위. VANGUARD(IRON 중장) + STALKER(SHADE 저격) + DRONE(VOLT 기계). 전 적 killable.
    enemies: [
      { key: 'MERIDIAN_VANGUARD', x: 3, y: 4 },
      { key: 'MERIDIAN_STALKER',  x: 1, y: 3 },
      { key: 'MERIDIAN_DRONE',    x: 5, y: 3 },
    ],
  };

  // ---- enc② 인카운터 (OVERLORD 근위 관제 · WARLORD 전초 · encounters.stage2) --------
  var ENC2 = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    objective: { x: 3, y: 0, threshold: 10, veil: 0, label: 'OVERLORD 근위 관제', dataTB: 2.6 },
    threatCap: 10,
    reinforcement: { key: 'MERIDIAN_STALKER', x: 0, y: 1 },
    walls: [
      { x: 2, y: 4 }, { x: 4, y: 4 },
    ],
    cover: [
      { x: 1, y: 5, type: 'light' }, { x: 5, y: 5, type: 'light' },
      { x: 2, y: 6, type: 'light' }, { x: 4, y: 6, type: 'light' },
      { x: 2, y: 3, type: 'light' }, { x: 4, y: 3, type: 'light' },
    ],
    // enc② — WARLORD(ASH 전초 보스) + DRONE×2(VOLT 기계 · DATA SPIKE 대상). 이중 승리(전멸/오브젝티브).
    enemies: [
      { key: 'MERIDIAN_WARLORD', x: 3, y: 2 },
      { key: 'MERIDIAN_DRONE',   x: 2, y: 5 },
      { key: 'MERIDIAN_DRONE',   x: 4, y: 5 },
    ],
  };

  // ---- enc③ 인카운터 (넥서스 사령 코어 · OVERLORD 결전 · encounters.stage3) ---------
  //  OVERLORD(DEF5)는 저ATK 직접 격파 난망 → 사령 코어(오브젝티브) 차감이 4클래스 공통 완주선.
  //  WARD_NODE = 정적·물리무효·HACK만(선택 목표, ai static → 전멸 승리 판정 무관). 진입 압박은
  //  STALKER 1기로 억제(저HP 해커 과확장 방지) + 접근로 full 엄폐로 결전 진입 생존 보장.
  var ENC3 = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    objective: { x: 3, y: 0, threshold: 9, veil: 0, label: '넥서스 사령 코어', dataTB: 4.0 },
    threatCap: 12,
    walls: [
      { x: 2, y: 4 }, { x: 4, y: 4 },
    ],
    cover: [
      { x: 3, y: 6, type: 'full' }, { x: 2, y: 6, type: 'light' }, { x: 4, y: 6, type: 'light' },
      { x: 1, y: 5, type: 'light' }, { x: 5, y: 5, type: 'light' },
      { x: 2, y: 2, type: 'light' }, { x: 4, y: 2, type: 'light' },
    ],
    // enc③ — OVERLORD(GRID 사령관 hp30/def5, 중앙) + WARD_NODE(정적 수호, 선택) + STALKER(측면 압박).
    enemies: [
      { key: 'MERIDIAN_OVERLORD', x: 3, y: 2 },
      { key: 'WARD_NODE',         x: 3, y: 1 },
      { key: 'MERIDIAN_STALKER',  x: 1, y: 4 },
    ],
  };

  // ---- 대화 그래프 (3연전 · 회고 muster + 3 인카운터 체인) ------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'SIGNAL', portrait: 'ghost',
        text: OPENING.join('\n'),
        choices: [
          { label: '기함이 스카이라인을 넘었다 — 응답한다', goto: 'muster' },
        ],
      },
      // ★muster — 회고 노드. 4갈래 종결 flag 게이트로 지난 선택을 반영(전선의 유령을 선봉에 세운다).
      //   4갈래 전부 클리어해야 이 미션이 해금되므로 종결 flag 4종은 전부 참(모두 선택 가능).
      //   각 선택 = 어느 전선의 기억으로 결전을 시작할지(vanguard flag). 서사 회고 · 진행 무변경.
      muster: {
        id: 'muster', speaker: 'SIGNAL', portrait: 'ghost',
        text: '착륙 전, SIGNAL 이 네 전선의 기록을 불러낸다. "누구를 선봉에 세울 거야? 지난 밤들이 오늘의 첫 발을 정해."\n' +
              '네 개의 문이 열려 있다 — 각각 네가 이미 걸어온 길이다.',
        choices: [
          { label: '👑 IRON CROWN — 왕관을 지킨 손을 선봉에 세운다',
            gate: { flag: 'throneSecured' }, show: 'gray',
            setFlags: { flagshipVanguard: 'A' }, goto: 'approach',
            desc: '브랜치 A 종결(throneSecured) 회고 — 조세·데이터 볼트를 지킨 전선의 유령이 앞선다',
          },
          { label: '🏴 ASH REPUBLIC — 자유항을 연 손을 선봉에 세운다',
            gate: { flag: 'flagshipDown' }, show: 'gray',
            setFlags: { flagshipVanguard: 'B' }, goto: 'approach',
            desc: '브랜치 B 종결(flagshipDown) 회고 — 자유항 기함을 떨군 전선의 유령이 앞선다',
          },
          { label: '🕊️ COUNCIL OF ASH — 넥서스를 재건한 손을 선봉에 세운다',
            gate: { flag: 'signalWarCleared' }, show: 'gray',
            setFlags: { flagshipVanguard: 'C' }, goto: 'approach',
            desc: '브랜치 C 종결(signalWarCleared) 회고 — 근원 코어를 멈춘 전선의 유령이 앞선다',
          },
          { label: '💀 RUIN SURVIVORS — 폐허를 지킨 손을 선봉에 세운다',
            gate: { flag: 'harvesterStopped' }, show: 'gray',
            setFlags: { flagshipVanguard: 'D' }, goto: 'approach',
            desc: '브랜치 D 종결(harvesterStopped) 회고 — 하베스터를 멈춘 전선의 유령이 앞선다',
          },
        ],
      },
      // ★enc① 심장 MFU 노드 — 무력 폴백 / [SPD4] 지름길.
      approach: {
        id: 'approach', speaker: 'SIGNAL', portrait: 'ghost',
        text: '기함이 착륙한다. 격벽이 열리기 전에, 침공 전위가 쏟아진다 — 중장 전위 하나, 저격 하나, 정찰 드론 하나.\n' +
              '격벽까지는 멀다. 밀고 들어가거나, 앞질러 파고들거나.',
        onEnter: { setFlags: { flagshipEngaged: true } }, checkpoint: true,
        choices: [
          { label: '침공 전위를 정면으로 밀어낸다',
            effect: { startCombat: { onWin: 'bridge1' } },
            setFlags: { vanguardLoud: true },
            desc: 'MERIDIAN 전위(VANGUARD + STALKER + DRONE)와 전투 → 착륙 격벽 돌파 (공통 폴백, 4클래스 완주)',
          },
          { label: '[SPD 4] 전위의 사거리를 앞질러 격벽으로 파고든다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { vanguardOutpaced: true },
            effect: { skipCombat: true }, goto: 'bridge1',
            desc: '고SPD(CIPHER 축) → 전위 교전 회피, 격벽 선점(지름길). 저SPD 클래스는 잠김 → 전투 폴백',
          },
        ],
      },
      // ★bridge1 (interlude → enc②) — 무력 폴백 / [DEF3] 지름길.
      bridge1: {
        id: 'bridge1', speaker: 'SIGNAL', portrait: 'ghost',
        text: '격벽 너머, 기함 내부. OVERLORD 의 근위 관제층이다 — MERIDIAN WARLORD 가 드론 둘을 거느리고 길목을 지킨다.\n' +
              '[SIGNAL] "저 전쟁군주는 관제층 문지기일 뿐이야. 하지만 문지기치고는 너무 커. 버텨내든, 밀어내든."',
        onEnter: { setFlags: { flagshipBreached: true } }, checkpoint: true,
        choices: [
          { label: 'WARLORD 근위를 정면으로 돌파한다',
            effect: { startCombat: { encounter: 'stage2', onWin: 'bridge2' } },
            setFlags: { guardLoud: true },
            desc: 'enc② 전초 보스전 — MERIDIAN_WARLORD + DRONE×2와 전투 → 근위 관제 확보 (공통 폴백)',
          },
          { label: '[DEF 3] 근위의 화력을 버텨내며 관제층을 통과한다',
            gate: { attr: 'def', min: 3 }, show: 'gray',
            setFlags: { guardTanked: true },
            effect: { skipCombat: true }, goto: 'bridge2',
            desc: '고DEF(BLADE/RIGGER/MOLE 축) → 근위 화력 무릅쓰고 통과(지름길). 저DEF(CIPHER)는 잠김 → 전투 폴백',
          },
        ],
      },
      // ★bridge2 (interlude2 → enc③) — 무력 폴백 / [HACK5] · [VANTA tag] 지름길.
      bridge2: {
        id: 'bridge2', speaker: 'SIGNAL', portrait: 'ghost',
        text: '관제층 심부. 사령 코어가 붉게 뛰고, 그 앞에 MERIDIAN OVERLORD 가 서 있다 — 성벽 너머 논리의 정점.\n' +
              '[SIGNAL] "저건 격파하는 게 아니야. 저 코어를 끊으면 기함째로 떨어져. 정면으로 오래 버티지 마 — 코어에 닿아."\n' +
              'OVERLORD 의 시선이 이쪽을 향한다. 도시의 이름조차 발음하지 못하는 것.',
        onEnter: { setFlags: { overlordReached: true } }, checkpoint: true,
        choices: [
          { label: 'OVERLORD 를 마주하고 사령 코어로 밀어붙인다',
            effect: { startCombat: { encounter: 'stage3', onWin: 'outro' } },
            setFlags: { overlordLoud: true },
            desc: 'enc③ 결전 — MERIDIAN_OVERLORD + 근위와 전투 · 사령 코어 차감으로 기함 격추 (공통 폴백)',
          },
          { label: '[HACK 5] 사령 코어에 직접 침습해 기함 논리를 끊는다',
            gate: { attr: 'hack', min: 5 }, show: 'gray',
            setFlags: { overlordHacked: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'HACK5(CIPHER) → OVERLORD 교전 회피, 코어 직접 차단(지름길). 저HACK 클래스는 잠김 → 결전 폴백',
          },
          { label: '[VANTA 태그] 함대 관리자 권한을 위조해 코어에 접근한다',
            gate: { tag: 'VANTA' }, show: 'gray',
            setFlags: { overlordInfiltrated: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'MOLE 위장 신분(VANTA 태그) → 관리자 권한으로 코어 접근(지름길). 태그 미보유 클래스는 회색 → 결전 폴백',
          },
        ],
      },
      // enc③/우회 공통 아웃트로.
      outro: {
        id: 'outro', speaker: 'SIGNAL', portrait: 'ghost',
        text: '사령 코어가 맥동을 멈춘다. 기함의 논리가 꺼지고, 강철의 산이 스카이라인 아래로 기울기 시작한다.\n' +
              '[SIGNAL] "떨어진다 — 도시 위로가 아니라, 도시 곁으로. 우리가 계산한 그대로." OVERLORD 는 도시의 이름조차 말하지 못한 채 꺼졌다.\n' + STORY_CARD,
        onEnter: { setFlags: { overlordFelled: true, flagshipSunk: true } }, checkpoint: true,
        choices: [ { label: '기함이 가라앉는 것을 지켜본다', goto: 'settle' } ],
      },
      settle: {
        id: 'settle', speaker: 'SIGNAL', portrait: 'ghost',
        text: 'MERIDIAN FLAGSHIP — 침공의 심장이 멈췄다. 네 전선에서 온 유령들이 같은 재를 밟고 선다.\n' +
              '[SIGNAL] "이건 승리가 아니야. 이건… 우리가 아직 여기 있다는 뜻이야." 하늘이 다시 애시그리드의 것이 된다.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '애시그리드의 하늘을 올려다본다', effect: { capstoneEpilogue: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (캡스톤 apex — Act2 종결 대비 상향) ------------------------------
  var REWARDS = {
    rep: 12,
    karma: 4,
    nuyen: 24,
    unlocks: [],   // 캡스톤 — 후속 미션 해금 없음(심연 프로토콜은 endings.capstone 게이트로 허브 개방).
  };

  var MISSION = {
    id: 'a2-99-flagship',
    title: 'MERIDIAN FLAGSHIP — 최종 결전',
    subtitle: 'ACT 2 캡스톤 — 4갈래 수렴 · 3연전 · OVERLORD 결전',
    kind: 'act2',
    unlock: { missionsDone: ['a2-a2-crown-throne', 'a2-b2-freeport', 'a2-c2-signal-war', 'a2-d2-last-signal'] },
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                                            // enc①
    encounters: { stage2: ENC2, stage3: ENC3 },               // enc②(전초) · enc③(OVERLORD 결전)
    rewards: REWARDS,
    capstone: true,                                           // [신규 v6.44] 캡스톤 표식(보드/에필로그 분기)
    nextHint: '심연 프로토콜 해금 — 허브에서 무한 상승 계약(웨이브 결정론 전투) 개방.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_99_FLAGSHIP = API;
})();
