;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a3-01-collateral.js — [신규 v6.54] ACT 3 메인 1 "COLLATERAL"
  //   담보 — 넥서스 지하 원장고에서 애시그리드가 무엇으로 잡혀 있는지를 확인한다.
  //   (엔진 무편집 콘텐츠. 포맷 정본 = a2-c2-signal-war(2연전). 순수 리터럴.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표:
  //   [신규] Act 3 메인 체인 1번 — a3-00-framing 이 확인한 "청구서"의 근거 문서를 회수하는 장.
  //   [계승 docs/01 §2040년대] "CARBON이 도시 전력망·수도·통신 인프라를 매입한다. 정부가 팔
  //          수밖에 없었다." — 애시그리드는 처음부터 **매각된 도시**였고, 매각된 것은 다시
  //          담보로 잡힌다. Act3 의 적대는 침공이 아니라 이 계약사의 연장선이다.
  //   [계승 docs/01 §2060년대] 넥서스 타워 = 5대 블록 공동 이사회 본부 · 메시 구축 —
  //          지하 원장고는 그 이사회가 서명한 담보 계약이 물리적으로 잠들어 있는 층[신규 무대].
  //   [계승 docs/12 §봉투 B "최초 M&A 선언" · docs/08 주식·M&A] 블록 세계의 갈등이 총이 아니라
  //          지분·계약으로 진행된다는 원전 규율을 RPG 전투 무대로 각색.
  //   [계승 §3.1 · a2 메인 관례] 2연전 — enc① = MISSION.combat / enc② = MISSION.encounters.stage2.
  //          interlude 노드 effect.startCombat:{encounter:'stage2', onWin:'outro'} 소비.
  //   [신규] 적대 = MERIDIAN 청산관리단(COLLECTOR/ASSESSOR) + STALKER·DRONE(Act2 로스터 재사용) +
  //          WARD_NODE(GRID 정적 수호, 재사용).
  //   [계승 lore GHOST_IDENTITY.BROKER] 화자 SILK — "누가 누구에게 무엇을 빚졌는지 완벽한 장부".
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: WARD_NODE×2(GRID·physImmune·hackOnly)는 원장 노드 수호 정적 유닛 — a2-c2 선례처럼
  //   "필수 처치 대상 아님"(ai 'static' → 전멸 판정 제외). 물리 클래스는 파괴 불가하나 코어
  //   objective-reduce(인접 max(HACK,ATK) 자동축)로 완주 → 하드락 없음.
  // SIMPLIFIED: [VANTA 태그] 게이트 — MOLE 위장 신분(classes.js tags)만 통과. 그 외 클래스는
  //   상시 회색 → 폴백 전투 상존(ch01/a2-99 선례 준수).
  // ==========================================================================

  // ---- 원전 산문 앵커 (docs/01 계약사 + a3-00 원장 사본, 계승/각색) ---------------
  var OPENING = [
    '[SILK] "원장 사본을 다 읽었어. 나쁜 소식은, 저들이 위조한 게 하나도 없다는 거야."', // [신규] Act3 전제 확정
    '2043년, 정부는 도시의 전력망과 통신 인프라를 팔았다. 팔린 것은 언젠가 담보로 잡힌다 — 계약은 그렇게 생겨먹었다.', // [계승 docs/01 §2040년대]
    '[SILK] "넥서스 지하에 원장고가 있어. 5대 블록이 서명한 담보 계약이 물리적으로 잠들어 있는 층."', // [계승 docs/01 §2060년대 넥서스 · 신규 무대]
    '[SILK] "MERIDIAN 은 그 계약서에 자기 채권을 얹었어. 그리고 지금, 청산관리단이 그 층을 접수하는 중이야."', // [신규] 청산관리단
    '[SIGNAL] "저 아래에 내 대역 기록도 있어. 내가 기함을 떨어뜨리려고 이 도시에서 얼마를 당겨 썼는지 — 정확한 숫자로."', // [계승] a2-99 SIGNAL 부채
    '담보란 결국 이런 뜻이다: 갚지 못하면 가져간다. 오늘 밤 확인해야 하는 건, 가져갈 것이 무엇인지다.', // [신규] 주제 진술
  ];
  var STORY_CARD = '"이 도시는 한 번도 자기 것이었던 적이 없다. 다만 누구의 것인지가 자주 바뀌었을 뿐이다." — 담보 원장 서문, 2043년 서명본 (SILK 낭독)';
  var REFRAIN = '총은 막을 수 있다. 장부는 못 막는다. 장부는 읽거나, 다시 쓰거나, 둘 중 하나다.';

  // ---- 전투 인카운터 ① = MISSION.combat (원장고 접근층 7열 × 8행) ----------------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(담보 인증 게이트), row7=하단(하강 진입).
  //  [신규] 지하 원장고 접근층 무대. wall=봉인 격벽, cover=문서 캐비닛/보관 랙.
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    // 오브젝티브 = 담보 인증 게이트(threshold 9 · objective-reduce). [계승 store applyHackObjective]
    objective: { x: 3, y: 0, threshold: 9, veil: 0, label: '담보 인증 게이트', dataTB: 2.2 },
    threatCap: 9,
    // enc① 증원 없음(카탈로그 관례: 증원은 enc②).
    walls: [
      { x: 1, y: 4 }, { x: 5, y: 4 },
    ],
    cover: [
      { x: 2, y: 5, type: 'light' }, { x: 4, y: 5, type: 'light' }, { x: 3, y: 6, type: 'full' },
      { x: 1, y: 2, type: 'light' }, { x: 5, y: 2, type: 'light' },
      // [Act3 서명] 코어 앞 차폐 격벽 — 오브젝티브 남쪽 인접 3타일(grid.coverBonus 는
      //   '대상에 직교 인접 + 공격자 방향' 엄폐만 계산 → 코어에 붙은 유닛의 실효 엄폐).
      { x: 2, y: 1, type: 'light' }, { x: 3, y: 1, type: 'light' }, { x: 4, y: 1, type: 'light' },
    ],
    // 적 배치 — 접수반. COLLECTOR(ASH 추심관 · 저속 근접 문지기) + STALKER(SHADE 저격) +
    //   DRONE(VOLT 기계 · DATA SPIKE 대상). 전 적 killable → 전멸/오브젝티브 이중 승리(MFU).
    //   [밸런스] a2-99 enc① 과 동일 배치 골격(중장 1 + 저격 1 + 드론 1) — 하네스 재측정 근거.
    enemies: [
      { key: 'MERIDIAN_COLLECTOR', x: 3, y: 4 },
      { key: 'MERIDIAN_STALKER',   x: 1, y: 3 },
      { key: 'MERIDIAN_DRONE',     x: 5, y: 3 },
    ],
  };

  // ---- 전투 인카운터 ② = MISSION.encounters.stage2 (담보 원장 노드 · 봉인 코어) ----
  //  [계승 §3.1] 2연전 2번째 무대. combat 동일 스키마. HP 리필(interlude 숨 고르기).
  var ENCOUNTERS = {
    stage2: {
      cols: 7, rows: 8,
      playerStart: { x: 3, y: 7 },
      // 오브젝티브 = 담보 원장 노드(threshold 10 · veil 1 = 유효 임계 11). Act3 메인 1 상한.
      objective: { x: 3, y: 0, threshold: 10, veil: 1, label: '담보 원장 노드', dataTB: 4.5 },
      threatCap: 10,
      // [카탈로그] 증원 MERIDIAN_ASSESSOR(경보 1회 스폰) — 원격 감정 압박 지속.
      reinforcement: { key: 'MERIDIAN_ASSESSOR', x: 0, y: 1 },
      walls: [
        { x: 2, y: 4 }, { x: 4, y: 4 },
      ],
      cover: [
        { x: 1, y: 5, type: 'light' }, { x: 5, y: 5, type: 'light' },
        { x: 2, y: 6, type: 'light' }, { x: 4, y: 6, type: 'light' },
        { x: 3, y: 6, type: 'full' },
        { x: 2, y: 3, type: 'light' }, { x: 4, y: 3, type: 'light' },
      ],
      // 적 배치 — COLLECTOR(추심관 · killable) + WARD_NODE×2(GRID physImmune·선택 수호).
      //   원장 노드 objective-reduce 로 전 클래스 완주(WARD_NODE 미처치 무관, a2-c2 선례).
      enemies: [
        { key: 'WARD_NODE',          x: 2, y: 1 },   // 원장 노드 좌 수호(physImmune·선택)
        { key: 'WARD_NODE',          x: 4, y: 1 },   // 원장 노드 우 수호(physImmune·선택)
        { key: 'MERIDIAN_COLLECTOR', x: 3, y: 2 },   // ★접수 책임자
      ],
    },
  };

  // ---- 대화 그래프 (2연전: approach→[전투①]→interlude→[전투②]→outro→choice→settle) --
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'SILK', portrait: 'ghost',
        quote: 'BROKER',                       // loreQuote(BROKER) → SILK 명대사 버블(어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: '넥서스 지하 원장고로 내려간다 — 담보 목록을 직접 읽는다', goto: 'approach' },
        ],
      },
      // ★enc① MFU 노드 — 전투① / [SPD 4] 지름길. 둘 다 interlude 합류.
      approach: {
        id: 'approach', speaker: 'SILK', portrait: 'ghost',
        text: '원장고 접근층. 문서 캐비닛이 벽처럼 늘어선 복도 끝에 담보 인증 게이트가 붉게 뛴다.\n' +
              '추심관 하나가 통로 한가운데를 막고 서 있다 — 무장한 회계원. 저격수와 드론이 좌우를 잡는다.\n' +
              '[SILK] "저 게이트를 열어야 목록을 읽어. 저들은 목록을 읽히지 않으려고 서 있는 거고."',
        choices: [
          { label: '접수반을 정면으로 밀어내고 게이트를 연다',
            effect: { startCombat: { onWin: 'interlude' } },
            setFlags: { vaultForced: true },
            desc: 'enc① COLLECTOR + STALKER + DRONE 와 전투 → 인증 게이트 확보 (공통 폴백, 6클래스 완주 가능)',
          },
          { label: '[SPD 4] 캐비닛 열 사이를 앞질러 게이트를 선점한다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { vaultOutpaced: true },
            effect: { skipCombat: true }, goto: 'interlude',
            desc: '고SPD(CIPHER/BROKER/DRIFTER) → 접수반 교전 회피, 게이트 선점(지름길). 저SPD 클래스는 잠김 → 전투 폴백',
          },
        ],
      },
      // ★2연전 전환 interlude — 서사 전환 + enc② 게이트. [계승 §3.1] encounter:'stage2' 소비.
      interlude: {
        id: 'interlude', speaker: 'SILK', portrait: 'ghost',
        text: '게이트가 열린다. 그 너머, 원장 노드가 GRID 수호 격자에 감싸인 채 도시 전체의 담보 목록을 돌린다.\n' +
              '[SILK] "…봤어? 3번 항목. 메시 중계망 전체. 4번, 코어텍스 인증 인프라. 5번은 — 사람이야. 등록 시민 전원의 접속 권한."\n' +
              STORY_CARD + '\n' +
              '[SIGNAL] "그리고 8번 항목이 나야. 자산 분류: **가동 중인 도시 관리 지능**. 담보 가치, 산정 완료."',
        choices: [
          { label: '접수 책임자를 밀어내고 원장 노드에 닿는다',
            effect: { startCombat: { encounter: 'stage2', onWin: 'outro' } },
            setFlags: { ledgerEngaged: true },
            desc: 'enc② COLLECTOR + WARD_NODE×2(증원 ASSESSOR)와 전투 → 원장 노드 확보 (공통 폴백, 6클래스 완주)',
          },
          { label: '[HACK 5] 수호 격자를 우회해 원장 노드를 통째로 복제한다',
            gate: { attr: 'hack', min: 5 }, show: 'gray',
            setFlags: { ledgerCopied: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'HACK5(CIPHER) → WARD_NODE 격자 우회, 원장 즉시 복제(지름길). 저HACK 클래스는 잠김 → 전투 폴백',
          },
          { label: '[VANTA 태그] 원장 열람 권한을 가진 신분으로 정문 절차를 밟는다',
            gate: { tag: 'VANTA' }, show: 'gray',
            setFlags: { ledgerRequisitioned: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'MOLE 위장 신분(VANTA 태그) → 정규 열람 절차로 전투 회피(지름길). 태그 미보유 클래스는 회색 → 전투 폴백',
          },
        ],
      },
      // 전투②/우회 공통 아웃트로 — 담보 목록 전문 확보.
      outro: {
        id: 'outro', speaker: 'SILK', portrait: 'ghost',
        text: '원장 노드가 손안에 들어온다. 목록은 짧고, 그래서 더 나쁘다 — 인프라, 인증망, 시민, 그리고 SIGNAL.\n' +
              '[SILK] "저들은 도시를 침공할 필요가 없어. 서류상 이미 저들 거니까. 남은 절차는 인도(引渡)뿐이야."\n' +
              '[SIGNAL] "…그래도 아직 서명 하나가 비어 있어. 인도 확인. 그건 도시 쪽에서 해야 해."\n',
        onEnter: { setFlags: { collateralListSeen: true, act3Collateral: true } }, checkpoint: true,
        choices: [ { label: '목록을 손에 쥔 채 결정한다', goto: 'choice' } ],
      },
      // ★플레이어 선택 [계승 §2.0 choice 관례] — 담보 목록을 어떻게 다룰 것인가.
      choice: {
        id: 'choice', speaker: 'SILK', portrait: 'ghost',
        text: '"두 가지 길이 있어. 목록을 도시 전체에 뿌리거나, 내 장부 안에 봉인하거나."\n' +
              '뿌리면 사람들은 자기가 담보라는 걸 알게 된다 — 공포는 저항의 연료이자 폭동의 연료다.\n' +
              '봉인하면 도시는 모른 채로 남는다. 그리고 협상 카드 하나가 우리 손에 남는다.',
        choices: [
          { label: 'A. 목록을 공개한다 — 도시는 자기 값을 알 자격이 있다',
            setFlags: { collateralChoice: 'publish', ledgerPublished: true },
            effect: { rep: 2 }, goto: 'settle',
            desc: '렙 +2 · 담보 목록 전면 공개, 도시가 자기 부채를 안다 (영속 flag)',
          },
          { label: 'B. 목록을 봉인한다 — 읽을 수 있는 자가 쥐고 있는 편이 낫다',
            setFlags: { collateralChoice: 'seal', ledgerSealed: true },
            effect: { karma: 1 }, goto: 'settle',
            desc: 'karma +1 · SILK 장부에 봉인, 협상 카드로 보존 (영속 flag · a3-03 지름길 개방)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'SILK', portrait: 'ghost',
        text: 'Act 3 — Collateral. 담보 목록이 확보됐다. 이제 도시는 자기가 무엇으로 잡혀 있는지 안다 — 적어도 우리는.\n' +
              '[SILK] "다음은 이자야. 채권자는 원금부터 받지 않아. 원금은 도시를 통째로 가져가는 거고, 그전에 이자를 먼저 뜯지."\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (Act3 메인 1 · 2연전 스케일 — a2 메인 2연전 대비 소폭 상향) --------
  var REWARDS = {
    rep: 9,
    karma: 3,
    nuyen: 17,
    unlocks: [],
  };

  var MISSION = {
    id: 'a3-01-collateral',
    title: 'Act 3 — Collateral',
    subtitle: 'ACT 3 메인 1 — 담보 원장고 (넥서스 지하 · 2연전 · 청산관리단 접수반)',
    kind: 'act3',
    unlock: { missionsDone: ['a3-00-framing'] },
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,           // enc①
    encounters: ENCOUNTERS,   // enc②(stage2) — 봉인 코어 · 원장 노드
    rewards: REWARDS,
    nextHint: '다음: Act 3 메인 2 "Interest" — 상환 청구가 코어텍스 인증망으로 내려온다.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A3_01_COLLATERAL = API;
})();
