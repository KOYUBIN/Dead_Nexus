;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-c1-first-contact.js — ACT 2 브랜치 C "COUNCIL OF ASH" C1
  //   "FIRST CONTACT" (엔진 무편집 콘텐츠. 포맷 정본 = a2-00-framing / ch05-mesh-ghost.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (act2_plan.md §1·§2 브랜치 C · 원전 정본 After Zero Day):
  //   서사 기점        [계승] ending.js nexus-reborn "다음을 위한 문 하나가 남는다" +
  //                    chapter-08 §엔딩3(평의회 재건 · 유일한 전원 생존) — 원전이 명시한
  //                    "새로운 외부 위협"(엔딩3 각주)이 재건된 넥서스를 직접 노린다.
  //   해금 조건        [계승 §3.2] endingSeen:['nexus-reborn'] + missionsDone:['ch08-zero-day']
  //                    — nexus-reborn 엔딩(ascendEnding→nexus-reborn, ending.js DERIVE_ORDER)을
  //                    본 세이브에만 브랜치 C가 열린다. 61차 campaign.js 레지스트리가 소비.
  //   신규 세력 MERIDIAN [신규 61차] 성벽 너머 외부 기업 연합. data/enemies.js MERIDIAN_* 계보 주석 참조.
  //   의뢰인/화자 SIGNAL [계승 chapter-05 §2 · ending.js endReborn speaker:SIGNAL] AI 의식체.
  //                    브랜치 C의 능동 화자 — SIGNAL 발화는 원전 §SIGNAL 스타일 [각색](정체·기억
  //                    질문 톤). MERIDIAN 발화는 [신규](냉담한 외부 기업 어조).
  //   무대(관제층)      [신규 · 재건된 넥서스 관제층 F6 상층] docs/10 미사용 상층 무대축.
  //   2연전 (61차 확정) [신규 §3.1] enc① = MISSION.combat / enc② = MISSION.encounters.stage2.
  //                    interlude 노드 effect.startCombat:{encounter:'stage2', onWin:'outro'} 소비.
  //                    HP 는 buildCombat 이 매 인카운터 리필(풀회복) · 하드모드 자동 스케일.
  //   MFU 접근 게이트   [계승 docs/25 §4.4 · a2-00 관례] enc① [HACK 4] / enc② [DEF 3]·[flag
  //                    ascendEnding] — 전부 전투 폴백 상존(4클래스 무력 완주 보장).
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: WARD_NODE(GRID·physImmune·hackOnly)는 오브젝티브 수호 정적 노드다 — ch05
  //   SIGNAL_ICE 선례와 동일하게 "필수 처치 대상 아님"(전멸/오브젝티브 차감 무관 승리 가능).
  //   물리 무효라 BLADE 는 파괴 불가하나, 오브젝티브 objective-reduce(인접 max(HACK,ATK) 자동축)
  //   경로가 전 클래스 완주를 보장 → BLADE/RIGGER/MOLE 하드락 없음.
  // SIMPLIFIED: [flag ascendEnding] 게이트는 ch05 ASCEND(SIGNAL 합일)이 세우는 계승 flag —
  //   nexus-reborn 엔딩의 근원 flag(ending.js DERIVE_ORDER). 이 미션에서 set 하지 않으므로
  //   검증기 info("계승 플래그로 가정") 예상. NG+ 에서 flags 리셋 시 게이트는 회색 → 전투 폴백.
  // SIMPLIFIED: intro/interlude 의 quote:'SIGNAL' 은 현 lore 어댑터에 SIGNAL 항목이 없어
  //   loreQuote 가 null(무해·무버블). SIGNAL 실제 발화는 산문 [각색]. 향후 lore 등록 시 자동 결선.
  // ==========================================================================

  // ---- 원전 산문 앵커 (ending.js nexus-reborn · chapter-08 §엔딩3, 계승/각색) --------
  var OPENING = [
    '평의회가 다시 섰다. 재건된 넥서스의 관제층에 불이 들어오고, 도시의 시계는 제 박자를 되찾는다.', // [계승] endReborn "도시는 살아남는다"
    '[SIGNAL] "나는 이 도시를 파괴가 아닌 재건으로 돌린 그 우호를 기억한다. 그런데 지금 — 그 기억 바깥에서 무언가가 문을 두드린다."', // [각색] SIGNAL 정체·기억 톤
    '메시 전역에 낯선 지문이 번진다. 애시그리드 어느 블록의 서명도, SIGNAL 의 것도 아니다.', // [신규] 외부 위협 감지
    '[MERIDIAN] "재건된 도시. 방어망 하나. 흥미롭군. 우리는 무너진 것을 사지 않는다 — 우리는 살아 있는 것을 접수한다."', // [신규] MERIDIAN 냉담 어조
    '[SIGNAL] "저들은 외벽 방어망부터 시험할 것이다. 나와 함께, 도시가 처음으로 바깥의 손을 마주하는 이 밤을 지켜다오."', // [각색] 의뢰
    'After Zero Day. 유일하게 살아남은 도시가, 그 삶을 노리는 첫 번째 외부의 시선을 마주한다.', // [계승] 엔딩3 "문 하나가 남는다"
  ];
  var STORY_CARD = '"살아남은 것에는 값이 매겨진다." — MERIDIAN, 접경 송출 (SIGNAL 가로챔)';
  var REFRAIN = '재건된 도시가 처음으로 배운다 — 살아남는 일과, 살아남은 것을 지키는 일은 다른 싸움이라는 걸.';

  // ---- 전투 인카운터 ① = MISSION.combat (외벽 방어망 · 관제층 7열 × 8행) -----------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(외벽 방어망 노드), row7=하단(관제층 진입).
  //  [신규] 재건된 넥서스 관제층 무대. wall=붕괴 잔존 격벽, cover=관제 콘솔 엄폐.
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    // 오브젝티브 = 외벽 방어망(threshold 누적 차감 = objective-reduce). [계승 store applyHackObjective]
    //  인접 유닛 max(HACK,ATK) 자동축 → 4클래스 모두 다른 축으로 완주(부가 승리 경로).
    objective: { x: 3, y: 0, threshold: 9, veil: 0, label: '외벽 방어망', dataTB: 2.0 },
    threatCap: 9,
    // enc① 증원 없음(카탈로그: 증원은 enc②). MERIDIAN 정찰 압박은 STALKER 없는 소규모 탐색.
    walls: [
      { x: 2, y: 4 },
    ],
    cover: [
      { x: 1, y: 3, type: 'light' }, { x: 5, y: 3, type: 'light' }, { x: 3, y: 5, type: 'light' },
    ],
    // 적 배치 — MERIDIAN_DRONE×2(VOLT 기계 · DATA SPIKE 대상) + WARD_NODE(GRID physImmune 수호).
    //  드론은 killable → 물리/해킹 처치 가능(BLADE 완주). WARD_NODE 는 optional 수호(SIMPLIFIED).
    enemies: [
      { key: 'WARD_NODE',      x: 3, y: 1 },   // 외벽 방어망 앞 정적 수호(physImmune·optional)
      { key: 'MERIDIAN_DRONE', x: 1, y: 3 },
      { key: 'MERIDIAN_DRONE', x: 5, y: 3 },
    ],
  };

  // ---- 전투 인카운터 ② = MISSION.encounters.stage2 (침입 앵커 노드 · 동 무대 심층) --
  //  [신규 §3.1] 2연전 2번째 무대. combat 과 동일 스키마. buildCombat 이 opts.combat 오버라이드로 소비.
  //  HP 는 리필(풀회복) — interlude "숨 고르기" 서사로 정당화(§3.4 기본 풀회복).
  var ENCOUNTERS = {
    stage2: {
      cols: 7, rows: 8,
      playerStart: { x: 3, y: 7 },
      // 오브젝티브 = 침입 앵커 노드(threshold 11 · veil 1 = 유효 임계 12). enc①보다 상향.
      objective: { x: 3, y: 0, threshold: 11, veil: 1, label: '침입 앵커 노드', dataTB: 4.0 },
      threatCap: 10,
      // [카탈로그] 증원 MERIDIAN_VANGUARD(경보 1회 스폰) — 중장 돌격 전위.
      reinforcement: { key: 'MERIDIAN_VANGUARD', x: 5, y: 1 },
      walls: [
        { x: 4, y: 4 },
      ],
      cover: [
        { x: 1, y: 3, type: 'light' }, { x: 5, y: 3, type: 'light' },
        { x: 2, y: 5, type: 'light' }, { x: 4, y: 5, type: 'light' },
      ],
      // 적 배치 — MERIDIAN_STALKER×2(SHADE 저격 · 코어 압박) + MESH_WISP×1(SIGNAL 잔존 방어 재활용).
      //  MESH_WISP = isMachine(물리 처치 가능) → BLADE 완주 보장. 앵커 노드는 objective-reduce 로 전 클래스 완주.
      enemies: [
        { key: 'MERIDIAN_STALKER', x: 1, y: 2 },
        { key: 'MERIDIAN_STALKER', x: 5, y: 2 },
        { key: 'MESH_WISP',        x: 3, y: 3 },
      ],
    },
  };

  // ---- 대화 그래프 (MFU §2.0 · 2연전: approach→[전투①]→interlude→[전투②]→outro) ---
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'SIGNAL', portrait: 'ghost',
        quote: 'SIGNAL',                       // loreQuote(SIGNAL)→null(무해). 발화는 산문 [각색].
        text: OPENING.join('\n'),
        choices: [
          { label: '관제층으로 오른다 — MERIDIAN 의 첫 접촉을 마주한다', goto: 'approach' },
        ],
      },
      // ★enc① MFU 노드 — 전투① / [HACK 4] 방어망 직접 재장전(지름길). 둘 다 interlude 합류.
      approach: {
        id: 'approach', speaker: 'SIGNAL', portrait: 'ghost',
        text: '재건된 넥서스 관제층. 외벽 방어망 노드가 붉게 점멸한다 — 바깥의 손이 그 위에 얹혀 있다.\n' +
              'MERIDIAN 정찰 드론 둘이 콘솔 사이를 훑고, 방어망 앞엔 낯선 GRID 수호 노드가 박혀 있다.',
        choices: [
          { label: '드론을 걷어내고 외벽 방어망을 사수한다',
            effect: { startCombat: { onWin: 'interlude' } },
            setFlags: { meridianWallEngaged: true },
            desc: 'enc① MERIDIAN_DRONE×2 + WARD_NODE 와 전투 → 방어망 사수 (공통 폴백, 4클래스 완주 가능)',
          },
          { label: '[HACK 4] 방어망 프로토콜을 직접 재장전해 드론을 밀어낸다',
            gate: { attr: 'hack', min: 4 }, show: 'gray',
            setFlags: { meridianWallHacked: true },
            effect: { skipCombat: true }, goto: 'interlude',
            desc: 'HACK4(CIPHER/…) → 방어망 재장전으로 enc① 전투 스킵(지름길). 저HACK 클래스는 잠김 → 전투로 폴백',
          },
        ],
      },
      // ★2연전 전환 interlude — 서사 전환 + enc② approach 게이트. [61차 §3.1] encounter:'stage2' 소비.
      interlude: {
        id: 'interlude', speaker: 'SIGNAL', portrait: 'ghost',
        text: '외벽이 버텼다. 그러나 방어망 로그가 더 깊은 것을 토해낸다 — 저들은 이미 성벽 안쪽에 앵커를 박아 두었다.\n' +
              '[SIGNAL] "저건 정찰이 아니었어. 발판이었지. 앵커 노드를 뽑지 않으면, 저들은 언제든 이 도시로 되돌아온다."\n' +
              STORY_CARD + '\n' +
              '앵커 노드로 향하는 격자 위를, MERIDIAN 저격수 둘과 SIGNAL 의 옛 방어 위습 하나가 지킨다. 베일이 노드를 감싼다.',
        choices: [
          { label: '앵커 노드로 돌입한다',
            effect: { startCombat: { encounter: 'stage2', onWin: 'outro' } },
            setFlags: { meridianAnchorEngaged: true },
            desc: 'enc② MERIDIAN_STALKER×2 + MESH_WISP(증원 VANGUARD)와 전투 → 앵커 노드 제거 (공통 폴백, 4클래스 완주)',
          },
          { label: '[DEF 3] 방어 진형으로 저격선을 버티며 앵커에 접근한다',
            gate: { attr: 'def', min: 3 }, show: 'gray',
            setFlags: { meridianAnchorBraced: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'DEF3(BLADE/RIGGER/MOLE) → 저격 압박을 버텨 enc② 전투 스킵(지름길). 저DEF(CIPHER)는 잠김 → 전투로 폴백',
          },
          { label: '[flag ascendEnding] SIGNAL 과의 합일 채널로 앵커를 역추적해 무력화한다',
            gate: { flag: 'ascendEnding' }, show: 'gray',
            setFlags: { meridianAnchorSevered: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'ch05 ASCEND(SIGNAL 합일 · nexus-reborn 근원 flag) 계승 → 합일 채널로 앵커 역추적(지름길). flag 없으면 잠김 → 전투로 폴백',
          },
        ],
      },
      // 전투②/우회 공통 아웃트로 — 앵커 노드가 뽑히고, MERIDIAN 의 첫 발판이 끊긴다.
      outro: {
        id: 'outro', speaker: 'SIGNAL', portrait: 'ghost',
        text: 'MERIDIAN 저격선이 흩어지고, 앵커 노드가 베일과 함께 꺼진다. 성벽 안쪽에 박혀 있던 손 하나가 뽑혀 나간다.\n' +
              '[SIGNAL] "고맙다. 하지만 이건 발판 하나였을 뿐이야. 저들이 앵커를 던진 방향 — 그 끝에 근원이 있다."\n' + REFRAIN,
        onEnter: { setFlags: { meridianFirstContact: true, a2CouncilOpened: true } }, checkpoint: true,
        choices: [ { label: 'SIGNAL 이 가리키는 방향을 응시한다', goto: 'choice' } ],
      },
      // 서사 분기 — 재건 도시의 대응 노선(setFlags). 양쪽 모두 settle 합류(MFU 폴백).
      choice: {
        id: 'choice', speaker: 'SIGNAL', portrait: 'ghost',
        text: '[SIGNAL] "저 근원을 어떻게 마주할까. 도시를 지키는 방패로 남을까, 아니면 먼저 성벽 밖으로 손을 뻗을까?"',
        choices: [
          { label: 'A. 방패 — 재건된 넥서스의 방어를 굳힌다',
            setFlags: { councilStance: 'shield', councilShield: true },
            goto: 'settle',
            desc: '방어 노선 — 도시 사수에 집중(플래이버 분기). enc② 심층전(C2)의 방어 서사 계승.',
          },
          { label: 'B. 추적 — 앵커의 좌표를 따라 근원으로 향한다',
            setFlags: { councilStance: 'hunt', councilHunt: true },
            goto: 'settle',
            desc: '추적 노선 — 외부 위협 근원 선제(플래이버 분기). C2 "근원 코어"로의 능동 진입 서사 계승.',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'SIGNAL', portrait: 'ghost',
        text: 'Act 2 — Council of Ash. 평의회가 지킨 도시가, 이제 그 도시를 지키는 법을 배운다.\n' +
              '[SIGNAL] "다음 신호는 더 깊은 곳에서 올 거야. 메시 심층 — 저들이 앵커를 던진 그 끝에서." SIGNAL 의 목소리가 잠깐 멈춘다.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (브랜치 C 메인 1 · 2연전 스케일) ------------------------------
  var REWARDS = {
    rep: 6,
    karma: 2,
    nuyen: 12,
    unlocks: ['a2-c2-signal-war'],   // C2 해금(브랜치 C 순차 개방).
  };

  var MISSION = {
    id: 'a2-c1-first-contact',
    title: 'Act 2 — First Contact',
    subtitle: 'ACT 2 · COUNCIL OF ASH C1 — MERIDIAN 첫 접촉 (재건된 넥서스 관제층 · 화자 SIGNAL)',
    kind: 'act2',
    unlock: { missionsDone: ['ch08-zero-day'], endingSeen: ['nexus-reborn'] },   // 브랜치 C = nexus-reborn 엔딩 게이트.
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,           // enc①
    encounters: ENCOUNTERS,   // enc②(stage2) — 2연전
    rewards: REWARDS,
    nextHint: 'C2 "Signal War" — 메시 심층 레이어에서 외부 위협의 근원 코어와 결전(2연전 · MERIDIAN_WARLORD 보스).',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_C1_FIRST_CONTACT = API;
})();
