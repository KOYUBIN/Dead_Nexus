;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-side-broker-ledger.js — ACT 2 클래스 사이드 (BROKER 전용)
  //   "THE LEDGER" — 중개인 SILK 이 자신의 부채 원장을 이미 다 읽어버린 예언가를
  //   마주하는 개인 서사 매듭. (엔진 무편집 콘텐츠. 포맷 정본 = a2-side-mole-whoami.
  //   순수 리터럴 — DOM/리액트 참조 0.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (65차 · 카탈로그 없음 → 원전 broker.md 서사 소재 [신규]):
  //   클래스 BROKER     [계승 data/classes.js] BROKER = SILK(SERA HOLT) HP6/ATK2/DEF2/SPD5/
  //                    HACK2 · 주 SHADE / 부 GRID · 최고 SPD. 개인전 밀도 = 단일 대형 전투(2연전 아님).
  //                    해금 = classKey:'BROKER' + missionsDone:['ch08-zero-day'] (campaign.js §3.2).
  //   주인공 서사        [계승 cards/ghost/broker.md · lore GHOST_IDENTITY] "누가 누구에게 무엇을
  //                    빚졌는지 완벽한 장부를 쥔 중개인." + broker.md Card05 "Information is the only
  //                    currency that never inflates." / Card09 "Nothing personal. Just market
  //                    correction." — 정보·부채 원장 모티프 전면화.
  //                    quote:'BROKER' → loreQuote 가 SILK 명대사 버블("Everyone wants something.
  //                    I just help them want it faster." 원문).
  //   숙적 KAI_MORROW    [재사용 · lore AXIOM 수장 KAI MORROW] enemies.js 기존 정의 재사용(신규 0).
  //                    AXIOM 예언가 — "We already know what you'll do next." 정보를 파는 SILK 와
  //                    이미 다 아는 KAI 의 대결(예측 vs 중개). 무대 = AXIOM 데이터 타워 예측층.
  //   MFU 3출구          [계승 §4.4 · a2-side-mole-whoami 골격] 무력 / [SPD5] / [flag intelNetwork]
  //                    세 출구가 outro 합류. BROKER(SPD5)는 [SPD5] 지름길 개방 = 클래스 정체성 회피.
  //                    저SPD 클래스(RIGGER spd2 등)는 무력 폴백으로 완주(MFU 6클래스 완주 원칙).
  //   레거시 표식        [계승 broker.md §레거시 THE LEDGER(챕터3)] outro flag brokerLedger(산문 표식).
  //                    unlocks 는 빈 배열 — 클래스 시그니처(OLD DEBTS)는 ch01 UNLOCK_BY_CLASS 로 해금.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: [SPD 5] 게이트 — BROKER 만 기본 SPD5(classes.js). CIPHER spd4·DRIFTER spd4 이하
  //   전부 잠김(회색) → 무력 폴백 상존. RIGGER/MOLE 저SPD 도 무력 완주(단일 대형 전투는 killable
  //   로스터 + 오브젝티브 이중승리). a2-side-mole [SPD4] SIMPLIFIED 선례 준수(폴백 보장).
  // SIMPLIFIED: [flag intelNetwork] 게이트 — 이 미션에서 set 하지 않음 → 검증기 info("계승 플래그로
  //   가정") 예상. 정보상 계승 훅(broker.md NETWORK/INFO BROKER). 없으면 회색 → 무력 폴백.
  // SIMPLIFIED: 보스 KAI_MORROW + 호위 전원 killable(physImmune 없음) → 전멸/오브젝티브 이중승리(MFU).
  //   부채 원장 서버 objective-reduce(인접 max(HACK,ATK) 자동축)로 저ATK/HACK BROKER 포함 완주.
  // SIMPLIFIED: MISSION.kind='act2' / unlock.classKey 는 campaign.js §3.2 게이트가 소비(전투/대화/
  //   보상 계약 무영향 · 순수 메타).
  // ==========================================================================

  // ---- 원전 산문 앵커 (broker.md + lore BROKER 스냅샷, 정보·부채 서사) -----------
  var OPENING = [
    'AXIOM 데이터 타워 예측층. 애시그리드의 모든 거래가 흘러드는 서버 숲. SILK 는 이 층을 오래 노렸다.', // [신규 · AXIOM 예측층 무대]
    '[SILK] "다들 뭔가를 원하지. 나는 그저 더 빨리 원하게 도울 뿐이야."', // [계승] lore BROKER quote 원문 정신
    '그녀의 무기는 장부다 — 누가 누구에게 무엇을 빚졌는지, 애시그리드에서 그걸 완벽히 아는 건 SILK 뿐이었다.', // [계승] lore GHOST_IDENTITY
    '[KAI MORROW] "어서 와, 중개인. 네가 이 방에 들어올 걸 우리 모델은 3주 전에 알았다. 네 부채 원장까지도."', // [재사용] KAI_MORROW AXIOM 수장
    'KAI MORROW. AXIOM 의 예언가. 정보를 파는 SILK 와, 이미 모든 걸 안다고 믿는 남자.', // [신규] 숙적 정의
    '부채 원장 서버. 그 안에 SILK 자신의 이름으로 된 계정 하나가 있다. 오늘 밤, 중개인이 자신의 장부를 회수하러 왔다.', // [계승] broker.md Card05 정보 모티프
  ];
  var STORY_CARD = '부채 원장 서버가 열린다. 그 안엔 애시그리드 절반의 빚 — 그리고 그 맨 아래, SILK 자신의 계정. 그녀는 그것을 지우지 않는다. 대신, 자신의 이름 옆에 "정산 완료"라고 적고 나온다. — SILK (SERA HOLT), 부채 원장 앞에서';
  var REFRAIN = '정보는 인플레이션이 없는 유일한 통화다. 그리고 나는 언제나 이중 수수료를 받지.'; // [계승] broker.md Card05/Card07

  // ---- 전투 인카운터 (AXIOM 데이터 타워 예측층 7열 × 8행, 단일 대형 보스전) ------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(부채 원장 서버), row7=하단(SILK 진입).
  //  [신규 · AXIOM 예측층] 무대. wall=서버 랙 격벽 LoS 차단, cover=데이터 콘솔 엄폐(회피형 BROKER 은신 활용).
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    // 오브젝티브 = 부채 원장 서버(threshold 9 · objective-reduce). [계승 store applyHackObjective]
    //   인접 유닛 max(HACK,ATK) 자동축 → BROKER(HACK2/ATK2 저축)·타축 모두 완주(부가 승리 경로).
    objective: { x: 3, y: 0, threshold: 9, veil: 0, label: '부채 원장 서버', dataTB: 2.5 },
    threatCap: 9,
    reinforcement: { key: 'AXIOM_DRONE', x: 6, y: 1 },    // 예측층 정찰 드론 증원(페이싱 · AXIOM 로스터 정합)
    // [신규] 서버 랙 측면 격벽 — 중앙 x=3 러시 레인 개방(저HP BROKER 은신 러시 회로).
    walls: [
      { x: 1, y: 4 }, { x: 5, y: 4 },   // 예측층 서버 랙 — 측면 접근 통제
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1. 데이터 콘솔 — 회피형 BROKER 전진 거점 엄폐.
    //   [65차 밸런스] 상단 콘솔 (2,2)/(4,2) → (1,2)/(5,2) 측면 재배치 — 엄폐는 이동 차단이므로
    //   중앙(2,2)/(4,2) 배치가 저MOV 클래스(RIGGER mov2)의 서버 접근 레인을 완전 봉쇄했다(clearFail).
    //   측면 이동으로 x2/x4 접근 레인 개방 · 엄폐 기능(콘솔 5기) 유지.
    cover: [
      { x: 2, y: 5, type: 'light' }, { x: 4, y: 5, type: 'light' },
      { x: 3, y: 3, type: 'light' }, { x: 1, y: 2, type: 'light' }, { x: 5, y: 2, type: 'light' },
    ],
    // 로스터: KAI_MORROW(보스) + AXIOM_ANALYST×2 + AXIOM_DRONE. 전 적 killable → 전멸/오브젝티브 이중승리(MFU).
    //   KAI_MORROW = IRON 근접 보스(hp20), AXIOM_ANALYST×2 = 분석관, AXIOM_DRONE = 코어 수호(기계).
    //   보스는 원장 서버 수호(상단), 호위는 y3~4 중단(러시 BROKER 은신 대응 유도).
    enemies: [
      { key: 'AXIOM_DRONE',    x: 3, y: 1 },   // 부채 원장 서버 앞 수호(coverShooter · isMachine)
      { key: 'KAI_MORROW',     x: 3, y: 3 },   // ★숙적 보스 — AXIOM 예언가
      { key: 'AXIOM_ANALYST',  x: 1, y: 3 },
      { key: 'AXIOM_ANALYST',  x: 5, y: 4 },
    ],
  };

  // ---- 대화 그래프 (MFU §2.0 · 클래스 사이드 단일 전투 · mole/rigger 골격) --------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'SILK', portrait: 'ghost',
        quote: 'BROKER',                       // loreQuote(BROKER) → SILK 명대사 버블(어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: 'AXIOM 예측층 심부, 부채 원장 서버로 향한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 무력 / [SPD5] / [flag intelNetwork] 세 출구. BROKER(SPD5)는 회피 지름길
      //  개방 · 저SPD 클래스는 무력 폴백으로 완주(상단 SIMPLIFIED). 셋 다 outro/outroGhost 합류.
      approach: {
        id: 'approach', speaker: 'KAI MORROW', portrait: 'bloc',
        text: 'AXIOM 예측층 심부. 데이터 콘솔이 벽을 따라 늘어서고, 그 끝에 부채 원장 서버가 빛난다.\n' +
              'KAI MORROW 가 분석관들과 정찰 드론을 앞세운다. "네가 무슨 수를 쓸지 모델이 이미 계산했어. 그래도 하겠다면 — 데이터가 되어 다오."',
        choices: [
          { label: '예언가를 정면으로 상대하고 부채 원장을 회수한다',
            effect: { startCombat: { onWin: 'outro' } },
            setFlags: { kaiConfronted: true },
            desc: 'KAI_MORROW(보스) + AXIOM_ANALYST×2 + AXIOM_DRONE 와 전투 → 원장 확보 (공통 폴백, 6클래스 완주 경로)',
          },
          { label: '[SPD 5] 콘솔 사이를 실크처럼 빠져나가 서버에 먼저 닿는다',
            gate: { attr: 'spd', min: 5 }, show: 'gray',
            setFlags: { ledgerSlipped: true },
            effect: { skipCombat: true }, goto: 'outroGhost',
            desc: '최고 SPD5(SILK 회피 · BROKER 전용) → 교전 없이 서버 선점(지름길). CIPHER/DRIFTER spd4 이하는 잠김 → 무력 폴백',
          },
          { label: '[정보망 flag] 미리 심어둔 정보망으로 예측 모델에 거짓 신호를 흘린다',
            gate: { flag: 'intelNetwork' }, show: 'gray',
            setFlags: { modelSpoofed: true },
            effect: { skipCombat: true }, goto: 'outroGhost',
            desc: 'BROKER NETWORK/INFO BROKER 계승 flag(정보상 훅) → 모델 교란으로 전투 스킵(지름길). flag 없으면 잠김 → 무력 폴백',
          },
        ],
      },
      // 무력 아웃트로 — 예언가를 제압하고 원장 서버에 접속.
      outro: {
        id: 'outro', speaker: 'SILK', portrait: 'ghost',
        text: 'KAI MORROW 가 무너진다. 부채 원장 서버가 열린다 — 애시그리드 절반의 빚, 그리고 맨 아래 SILK 자신의 계정.\n' +
              '"모델이 다 안다고 했지." SILK 가 화면을 응시한다. "그런데 내가 내 이름을 어떻게 정산할지는, 못 맞췄네."\n' + STORY_CARD,
        onEnter: { setFlags: { theLedgerDone: true, kaiDefeated: true, brokerLedger: true } }, checkpoint: true,
        choices: [ { label: '원장을 마주한 채 선택한다', goto: 'choice' } ],
      },
      // 회피/교란 아웃트로 — 교전 없이 서버 선점.
      outroGhost: {
        id: 'outroGhost', speaker: 'SILK', portrait: 'ghost',
        text: '분석관들은 아무것도 보지 못했다. 부채 원장 서버 앞에 SILK 만이 서 있다 — 모델이 예측하지 못한 단 하나의 수로.\n' +
              '"예측이 완벽하려면 나를 계산에 넣었어야지. 하지만 나는 장부 밖에 있는 유일한 이름이거든."\n' + STORY_CARD,
        onEnter: { setFlags: { theLedgerDone: true, ledgerGhosted: true, brokerLedger: true } }, checkpoint: true,
        choices: [ { label: '원장을 마주한 채 선택한다', goto: 'choice' } ],
      },
      // ★플레이어 선택 [계승 broker.md Card09 "market correction" · THE LEDGER] — 부채의 매듭.
      choice: {
        id: 'choice', speaker: 'SILK', portrait: 'ghost',
        text: '"내 계정을 지울까 — 아니면 정산하고 남겨둘까?"\n' +
              '지우면 SILK 는 아무에게도 빚지지 않은 유령이 된다. 정산하면 그 빚의 이력이 그녀의 힘으로 남는다.\n' +
              '어느 쪽이든, 다음 거래의 가격을 매기는 건 이제 나다.',
        choices: [
          { label: 'A. 내 계정을 지운다 — 아무에게도 빚지지 않는 유령으로',
            setFlags: { ledgerChoice: 'erase', debtFree: true },
            effect: { karma: 1 }, goto: 'settle',
            desc: 'karma +1 · 모든 부채를 소각, 장부 밖의 자유를 택한다 (영속 flag)',
          },
          { label: 'B. 정산하고 남겨둔다 — 빚의 이력마저 거래의 지렛대로',
            setFlags: { ledgerChoice: 'settle', ownsLedger: true },
            effect: { rep: 2 }, goto: 'settle',
            desc: '렙 +2 · 부채의 역사까지 자신의 힘으로 끌어안는다 (영속 flag)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'SILK', portrait: 'ghost',
        text: 'SILK 가 예측층을 빠져나간다. 부채 원장은 그대로, 그러나 이제 그 가격표는 그녀가 매긴다.\n' +
              'THE LEDGER — 애시그리드의 모든 빚을 손안에 쥔 채, 아무것도 잃지 않고.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (클래스 사이드 · 단일 대형 전투 스케일) ------------------------
  var REWARDS = {
    rep: 5,
    karma: 2,
    nuyen: 10,
    unlocks: [],   // THE LEDGER 는 flag brokerLedger 표식(산문). 클래스 시그니처 OLD DEBTS 는 ch01 해금.
  };

  var MISSION = {
    id: 'a2-side-broker-ledger',
    title: 'Act 2·BROKER — The Ledger',
    subtitle: 'BROKER 전용 사이드 — 부채 원장 (AXIOM 예측층 · 숙적 KAI MORROW)',
    kind: 'act2',
    unlock: { missionsDone: ['ch08-zero-day'], classKey: 'BROKER' },  // §3.2 classKey 게이트 — BROKER 로 플레이 시만 노출.
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                                                    // 단일 대형 전투(2연전 아님).
    rewards: REWARDS,
    nextHint: '클래스 사이드는 selectClass 로 클래스 전환 시 순차 개방(… BROKER/DRIFTER).',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_SIDE_BROKER_LEDGER = API;
})();
