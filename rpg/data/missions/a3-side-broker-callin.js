;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a3-side-broker-callin.js — [신규 v6.54] ACT 3 클래스 사이드 (BROKER)
  //   "CALL-IN" — 기한 이익 상실. 채권자 목록에서 SILK 자신의 이름을 발견한다.
  //   (엔진 무편집 콘텐츠. 포맷 정본 = a2-side-drifter-lastroad. 순수 리터럴.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표:
  //   [계승 lore GHOST_IDENTITY.BROKER] SILK(SERA HOLT) = "누가 누구에게 무엇을 빚졌는지
  //          완벽한 장부를 쥔 중개인. 애시그리드의 큰 거래는 그녀를 거쳤다." — **큰 거래는
  //          그녀를 거쳤다**는 원전 한 줄이 이 사이드의 전제다: MERIDIAN 의 침공 자금 조달도
  //          그 장부의 어느 페이지를 지나갔다. Act3 부채 아크가 개인 서사로 되돌아오는 지점.
  //   [계승 cards/ghost/broker.md · data/classes.js] BROKER = 협상·중개형 HP6/ATK2/DEF2/SPD5/
  //          HACK2 · 주 SHADE / 부 GRID · 최고 SPD(5) 회피형. 개인전 밀도 = 단일 대형 전투.
  //          quote:'BROKER' → loreQuote 가 SILK 명대사 원문 버블 삽입.
  //   [계승 a2-side-broker-ledger] 전작 사이드의 매듭 flag(brokerLedger · ownsLedger/debtFree)를
  //          지름길 게이트로 계승 — "장부를 인수한 자"만 열 수 있는 협상 경로.
  //   [계승 docs/01 §구역 종류 유흥가] "네온과 카지노. 주로 고스트들의 은신처" — SILK 장부실이
  //          유흥가 뒷골목에 있다는 배치는 이 원전 구역 성격의 직접 계승[신규 무대].
  //   [신규] 적대 = MERIDIAN 청산관리단 추심반(COLLECTOR/ASSESSOR) + 고용된 거리 추심꾼
  //          (GANG_THUG 재사용 — 회수는 언제나 현지 인력을 쓴다).
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: classKey:'BROKER' 게이트라 실플레이는 BROKER 뿐 → [SPD 4]가 SILK 의 정본 해법
  //   (BROKER spd5 상시 충족). 그럼에도 무력 폴백(ungated startCombat) 상존 → 하네스가 측정하는
  //   6클래스 전원 완주 보장(MFU 원칙).
  // SIMPLIFIED: [flag ownsLedger] 는 a2-side-broker-ledger 의 선택 B(장부 인수)가 세우는 계승
  //   flag — 이 미션에서 set 하지 않으므로 검증기 info 예상. 미보유 회차에는 회색 → 전투 폴백.
  // ==========================================================================

  // ---- 원전 산문 앵커 (lore BROKER 장부 정체성 + Act3 청구서) ---------------------
  var OPENING = [
    '애시그리드의 큰 거래는 전부 그녀를 거쳤다. 그게 SILK 의 자랑이었고, 오늘은 그게 문제다.', // [계승] lore GHOST_IDENTITY.BROKER
    '[SILK] "모두가 뭔가를 원해. 나는 그걸 더 빨리 원하게 도와줄 뿐이지." 그녀가 자기 명대사를 처음으로 씁쓸하게 말한다.', // [계승] lore BROKER quote 원문 각색
    '청산관리단의 채권자 명부. 3페이지, 열두 번째 줄 — 중개인 S. HOLT. 수수료 수취 기록 있음.', // [신규] 개인 연루
    '6년 전, 이름 없는 외부 연합의 자금 조달 건. 서류는 깨끗했고 수수료는 좋았다. 그 연합의 이름이 나중에 MERIDIAN 이 됐다.', // [신규] 과거 거래
    '[SILK] "내가 이 도시를 팔았다는 뜻은 아니야. 다만 — 파는 사람이 서류를 넘길 때, 그 서류를 정리해 준 사람이 나였어."', // [신규] 죄책의 정확한 크기
    '오늘 밤 추심반이 그 장부실 문을 두드린다. 기한 이익 상실 통보. 중개인에게도 청구서는 온다.', // [신규] CALL-IN
  ];
  var STORY_CARD = '추심 통보서: "중개인 S. HOLT — 수수료 반환 및 연대 책임 청구. 기한: 즉시." SILK 는 통보서를 읽고, 접어서, 장부 사이에 끼운다. 항목 하나가 늘었을 뿐이다.';
  var REFRAIN = '장부를 쥔 사람은 언젠가 자기 이름이 적힌 줄을 읽게 된다. 그때 도망치지 않는 것이 중개인의 자격이다.';

  // ---- 전투 인카운터 (유흥가 뒷골목 장부실 6열 × 7행, 단일 대형 전투) -------------
  //  좌표 {x:열 0..5, y:행 0..6}. row0=상단(장부 단말), row6=하단(뒷골목 진입).
  //  [신규] 네온 뒷골목 장부실 무대. wall=쓰러진 간판 구조물, cover=주류 케이스/발전기.
  var COMBAT = {
    cols: 6, rows: 7,
    playerStart: { x: 3, y: 6 },
    // 오브젝티브 = SILK 장부 단말(threshold 9 · objective-reduce). 인접 유닛 max(HACK,ATK) 자동축.
    objective: { x: 3, y: 0, threshold: 9, veil: 0, label: 'SILK 장부 단말', dataTB: 2.2 },
    threatCap: 10,
    reinforcement: { key: 'GANG_THUG', x: 5, y: 1 },   // 고용 추심꾼 증원(페이싱)
    // [신규] 쓰러진 간판 구조물 1개 — 좌측 진입로 차단(우회 유도), 중앙 러시 레인 개방.
    walls: [
      { x: 1, y: 3 },
    ],
    cover: [
      { x: 2, y: 4, type: 'light' }, { x: 4, y: 4, type: 'light' },
      { x: 3, y: 5, type: 'full' }, { x: 4, y: 2, type: 'light' },
      { x: 2, y: 0, type: 'light' }, { x: 3, y: 0, type: 'light' }, { x: 4, y: 0, type: 'light' },
    ],
    // 로스터 — COLLECTOR(추심 책임자 · ASH 중거리 근접) + ASSESSOR(MESH 사정관) +
    //   GANG_THUG×1(고용된 거리 추심꾼 · ASH 근접). 전 적 killable → 전멸/오브젝티브 이중 승리.
    enemies: [
      { key: 'MERIDIAN_COLLECTOR', x: 3, y: 4 },
      { key: 'MERIDIAN_ASSESSOR',  x: 3, y: 1 },
      { key: 'SPLICE_HOUND',       x: 1, y: 2 },
    ],
  };

  // ---- 대화 그래프 (사이드 MFU: intro→approach 3출구→outro/outroGhost→choice→settle) --
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'SILK', portrait: 'ghost',
        quote: 'BROKER',                       // loreQuote(BROKER) → SILK 명대사 버블(어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: '장부실로 돌아간다 — 내 이름이 적힌 줄을 직접 읽는다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 무력 / [SPD4] / [flag ownsLedger] 세 출구. 무력만 outro, 나머지는 outroGhost.
      approach: {
        id: 'approach', speaker: 'SILK', portrait: 'ghost',
        text: '네온 뒷골목. 장부실 문이 이미 열려 있다 — 부순 게 아니라, 열쇠로 연 것이다.\n' +
              '추심 책임자가 장부 단말 앞에 앉아 항목을 넘기고 있다. 사정관이 값을 매기고, 고용된 거리 추심꾼이 문가를 지킨다.\n' +
              '[COLLECTOR] "홀트 씨. 당신 장부는 정말 깔끔하군요. 덕분에 청구가 아주 쉬웠습니다."',
        choices: [
          { label: '추심반을 걷어내고 장부 단말을 되찾는다',
            effect: { startCombat: { onWin: 'outro' } },
            setFlags: { callInFought: true },
            desc: 'MERIDIAN_COLLECTOR + ASSESSOR + GANG_THUG(증원 THUG)와 전투 → 장부 단말 확보 (공통 폴백, 6클래스 완주 가능)',
          },
          { label: '[SPD 4] 뒷문 배선을 타고 추심반보다 먼저 단말에 닿는다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { callInSlipped: true },
            effect: { skipCombat: true }, goto: 'outroGhost',
            desc: 'SILK 정본 해법(BROKER spd5 · CIPHER/DRIFTER 도 개방) → 교전 없이 단말 선점(지름길). 저SPD 클래스는 잠김 → 전투 폴백',
          },
          { label: '[flag ownsLedger] 인수해 둔 장부 원본으로 청구 근거를 되받아친다',
            gate: { flag: 'ownsLedger' }, show: 'gray',
            setFlags: { callInCountered: true },
            effect: { skipCombat: true }, goto: 'outroGhost',
            desc: 'a2-side-broker-ledger 선택 B(장부 인수) 계승 flag → 역청구로 추심반 철수(지름길). 미보유 회차에는 회색 → 전투 폴백',
          },
        ],
      },
      // 무력 아웃트로 — 추심반을 물리적으로 밀어낸 경로.
      outro: {
        id: 'outro', speaker: 'SILK', portrait: 'ghost',
        text: '추심 책임자가 장부를 놓고 물러난다. 단말이 SILK 의 손으로 돌아온다 — 페이지는 그대로, 열두 번째 줄도 그대로.\n' +
              '[COLLECTOR] "…오늘은 물러가죠. 하지만 당신 이름은 지워지지 않습니다, 홀트 씨."\n' +
              '"알아." SILK 가 단말을 닫는다. "지울 생각도 없어."\n' + STORY_CARD,
        onEnter: { setFlags: { callInDone: true, brokerCallIn: true } }, checkpoint: true,
        choices: [ { label: '열두 번째 줄을 마주한 채 선택한다', goto: 'choice' } ],
      },
      // 우회 아웃트로 — 교전 없이 단말을 선점하거나 역청구로 되받은 경로.
      outroGhost: {
        id: 'outroGhost', speaker: 'SILK', portrait: 'ghost',
        text: '추심반이 항목을 넘기는 동안, 단말은 이미 SILK 쪽으로 넘어와 있었다. 협상은 3분 만에 끝났다.\n' +
              '[SILK] "청구는 성립해. 다만 순서가 틀렸을 뿐이야 — 나한테 받기 전에, 당신들이 나한테 갚아야 할 게 있거든."\n' +
              '추심 책임자가 서류를 접는다. 오늘 밤은 이걸로 끝이다.\n' + STORY_CARD,
        onEnter: { setFlags: { callInDone: true, callInGhosted: true, brokerCallIn: true } }, checkpoint: true,
        choices: [ { label: '열두 번째 줄을 마주한 채 선택한다', goto: 'choice' } ],
      },
      // ★플레이어 선택 [계승 §2.0 choice · 개인 서사 매듭] — 자기 이름이 적힌 줄을 어떻게 할 것인가.
      choice: {
        id: 'choice', speaker: 'SILK', portrait: 'ghost',
        text: '"열두 번째 줄. 지울 수도 있어 — 이 단말에서 내 손으로. 아무도 모를 거야."\n' +
              '"아니면 남겨 둘 수도 있지. 이 도시가 어떻게 팔렸는지, 누가 그 서류를 정리했는지 같이 적어서."',
        choices: [
          { label: 'A. 줄을 지운다 — 장부는 쓰는 사람의 것이다',
            setFlags: { callInChoice: 'erase', silkNameErased: true },
            effect: { nuyen: 8 }, goto: 'settle',
            desc: '₵ +8 · 수수료 기록 말소. 중개인은 깨끗해지고, 장부는 조금 덜 정확해진다 (영속 flag)',
          },
          { label: 'B. 줄을 남긴다 — 정확하지 않은 장부는 장부가 아니다',
            setFlags: { callInChoice: 'keep', silkNameKept: true },
            effect: { karma: 2 }, goto: 'settle',
            desc: 'karma +2 · 자기 이름을 그대로 둔다. 값을 치르더라도 장부는 정확해야 한다 (영속 flag)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'SILK', portrait: 'ghost',
        text: 'CALL-IN — 기한 이익 상실 통보는 취소되지 않았다. 다만 오늘은, 통보를 받은 쪽이 문을 닫았다.\n' +
              '[SILK] "다들 뭔가를 원해. 그리고 나는 여전히 그걸 더 빨리 원하게 도와주지. 이번엔 청구서를 읽는 쪽으로."\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (클래스 사이드 · Act2 사이드(rep5) 대비 Act3 소폭 상향) -----------
  var REWARDS = {
    rep: 6,
    karma: 2,
    nuyen: 12,
    unlocks: [],   // 개인 서사 매듭 — flag brokerCallIn 표식(산문). 클래스 시그니처는 ch01 해금.
  };

  var MISSION = {
    id: 'a3-side-broker-callin',
    title: 'Act 3·BROKER — Call-In',
    subtitle: 'BROKER 전용 사이드 — 기한 이익 상실 (유흥가 장부실 · 채권자 명부의 내 이름)',
    kind: 'act3',
    unlock: { missionsDone: ['a3-00-framing'], classKey: 'BROKER' },
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                                   // 단일 대형 전투(연전 아님).
    rewards: REWARDS,
    nextHint: '클래스 사이드는 각 클래스 개인 서사 매듭 — 편성(크루/로스터) 전환 시 순차 개방.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A3_SIDE_BROKER_CALLIN = API;
})();
