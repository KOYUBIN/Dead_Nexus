;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a3-03-finale.js — [신규 v6.54] ACT 3 종결 "SETTLEMENT DAY"
  //   결제일 — 원금 회수. 청산인이 인도(引渡) 서명을 받으러 온다. (3연전)
  //   (엔진 무편집 콘텐츠. 포맷 정본 = a2-99-flagship(3연전). 순수 리터럴.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표:
  //   [신규] Act 3 종결 — 담보(a3-01) → 이자(a3-02) → **원금**(본 미션) 3단 구성의 마지막.
  //   [계승 docs/01 §2091년] "넥서스 평의회가 결렬 상태" · 넥서스 타워 = 5대 블록 공동 이사회
  //          본부 — 그 결렬된 회의실이 Act3 에서 **청산 법정**으로 전용된다[신규 무대].
  //   [계승 docs/12 §봉투 H · chapter-08] "조건부 해금 최종 챕터" 구조를 Act3 규모로 각색:
  //          회고(recall) → 3연전 → 서명 선택 → 정산.
  //   [계승 a2-99-flagship] 3연전 골격(enc①=MISSION.combat / enc②=encounters.stage2 /
  //          enc③=encounters.stage3) + 회고 노드로 지난 선택을 선봉에 세우는 관례.
  //   [신규] 최종 보스 MERIDIAN_LIQUIDATOR(data/enemies.js) — 침공이 아니라 회수를 집행하는
  //          청산인. 체급은 OVERLORD 미만(HP26/ATK5/DEF4)이며, 위력은 개인 무력이 아니라
  //          **원장**(오브젝티브 · 수호 격자)에 있다는 것이 Act2 결전과의 설계 대비.
  //   [계승·하위호환] 4엔딩 계약 무변경 — ending.js ENDINGS/ORDER/DERIVE_ORDER 를 건드리지
  //          않는다. 본 미션이 세우는 flag(act3Settled·settlementChoice·debtBurned·debtAssumed)는
  //          resolveEnding 의 파생 flag 집합(endingTrack/allBlocsHostile/ascendEnding/puristFlag/
  //          ending)과 이름이 겹치지 않으므로, 어떤 엔딩 판정에도 영향을 주지 않는다.
  //          종결도 effect.returnHub — epilogue/capstoneEpilogue 를 쓰지 않으므로 4엔딩 기록
  //          (endings.seen/runs)과 캡스톤 기록(endings.capstone)도 불변이다.
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: 각 인카운터에 무력 폴백(ungated startCombat) 상존 → 6클래스 전원 완주 보장(MFU).
  //   지름길: approach [SPD4] · bridge1 [HACK5]/[AXIOM 태그] · bridge2 [DEF3]/[flag ledgerSealed].
  // SIMPLIFIED: recall 노드는 a3-01/a3-02 선택 flag 게이트 4종 + **무게이트 폴백 1종**을 둔다.
  //   체인상 각 쌍에서 정확히 하나씩(총 2종)이 항상 열리지만, 폴백을 두어 소프트락 가능성을 0으로
  //   만든다(a2-99 muster 는 폴백 없음 — 본 미션이 더 보수적).
  // SIMPLIFIED: WARD_NODE×2 는 인도 코어 링 5타일 중 2타일만 점유 → **봉인 코어 아님**
  //   (물리 클래스도 인접 진입 가능). side-02 의 봉인 격자와 구분된다.
  // ==========================================================================

  // ---- 원전 산문 앵커 (docs/01 §2091 넥서스 결렬 + a3-01/02 귀결) -----------------
  var OPENING = [
    '넥서스 최상층. 3개월째 소집되지 않았던 공동 이사회 회의실에, 오늘은 불이 켜져 있다.', // [계승 docs/01 §2091] 결렬된 평의회
    '켠 것은 블록이 아니다. MERIDIAN 청산관리단이 그 방을 **청산 법정**으로 등록했다.', // [신규] 무대 전용
    '[SILK] "원금 회수야. 이자는 조용히 뜯지만 원금은 절차를 밟아. 인도 확인, 원장 대조, 그리고 서명."', // [신규] 3연전 구조 예고
    '[SILK] "세 겹이야. 인도 게이트, 원장 관제, 그리고 청산인 본인. 마지막 서명란만 비어 있어."', // [계승 a2-99] 3연전 예고 관례
    '[SIGNAL] "서명은 도시 쪽에서 해야 해. 저들이 총을 들고 오지 않은 이유가 그거야 — 필요한 게 손이니까."', // [계승] a3-01 outro
    '기함은 하늘에서 왔고, 청산인은 엘리베이터로 온다. 어느 쪽이 도시를 더 확실히 가져가는지는, 오늘 밤 결정된다.', // [신규] Act2 대비 톤
  ];
  var STORY_CARD = '청산 법정 회의록: "채무자 애시그리드. 인도 대상: 전부. 이의 제기 창구: 없음. 남은 절차: 서명 1건." — MERIDIAN 청산관리단, 결제일 0시';
  var REFRAIN = '도시를 빼앗는 데 함대는 필요 없다. 필요한 건 서명 하나와, 그것을 받아낼 만큼의 인내다.';

  // ---- enc① = MISSION.combat (인도 게이트 · 청산 법정 진입층 7열 × 8행) -----------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(인도 확인 게이트), row7=하단(승강기 진입).
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    objective: { x: 3, y: 0, threshold: 9, veil: 0, label: '인도 확인 게이트', dataTB: 2.6 },
    threatCap: 10,
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
    // enc① — 인도 전위. COLLECTOR(추심관) + ASSESSOR(사정관) + STALKER(SHADE 저격). 전 적 killable.
    enemies: [
      { key: 'MERIDIAN_COLLECTOR', x: 3, y: 4 },
      { key: 'MERIDIAN_ASSESSOR',  x: 1, y: 3 },
      { key: 'MERIDIAN_STALKER',   x: 5, y: 3 },
    ],
  };

  // ---- enc② = encounters.stage2 (청산 원장 관제층) -------------------------------
  var ENC2 = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    objective: { x: 3, y: 0, threshold: 10, veil: 0, label: '청산 원장 관제', dataTB: 3.4 },
    threatCap: 11,
    reinforcement: { key: 'MERIDIAN_DRONE', x: 0, y: 1 },
    walls: [
      { x: 2, y: 4 }, { x: 4, y: 4 },
    ],
    cover: [
      { x: 1, y: 5, type: 'light' }, { x: 5, y: 5, type: 'light' },
      { x: 3, y: 6, type: 'full' }, { x: 2, y: 6, type: 'light' }, { x: 4, y: 6, type: 'light' },
      { x: 2, y: 3, type: 'light' }, { x: 4, y: 3, type: 'light' },
      // [Act3 서명] 코어 앞 차폐 격벽 — 오브젝티브 남쪽 인접 3타일(grid.coverBonus 는
      //   '대상에 직교 인접 + 공격자 방향' 엄폐만 계산 → 코어에 붙은 유닛의 실효 엄폐).
      { x: 2, y: 1, type: 'light' }, { x: 3, y: 1, type: 'light' }, { x: 4, y: 1, type: 'light' },
    ],
    // enc② — 관제 책임자 COLLECTOR + 원격 감정 ASSESSOR + 정찰 DRONE(기계). 이중 승리(전멸/오브젝티브).
    enemies: [
      { key: 'MERIDIAN_COLLECTOR', x: 3, y: 2 },
      { key: 'MERIDIAN_ASSESSOR',  x: 2, y: 5 },
      { key: 'MERIDIAN_DRONE',     x: 4, y: 5 },
    ],
  };

  // ---- enc③ = encounters.stage3 (청산인 결전 · 인도 코어) -------------------------
  //  LIQUIDATOR(DEF4·range3)는 killable 이나, 4클래스 공통 완주선은 인도 코어(오브젝티브) 차감이다.
  //  WARD_NODE×2 = 정적·물리무효·HACK 전용(선택 목표 · ai static → 전멸 판정 무관).
  //  진입 압박은 STALKER 1기로 억제하고 접근로에 full 엄폐를 둬 결전 진입 생존을 보장한다.
  var ENC3 = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    objective: { x: 3, y: 0, threshold: 10, veil: 0, label: '청산 인도 코어', dataTB: 6.0 },
    threatCap: 12,
    walls: [
      { x: 2, y: 4 }, { x: 4, y: 4 },
    ],
    cover: [
      { x: 3, y: 6, type: 'full' }, { x: 2, y: 6, type: 'light' }, { x: 4, y: 6, type: 'light' },
      { x: 1, y: 5, type: 'light' }, { x: 5, y: 5, type: 'light' },
      { x: 2, y: 2, type: 'light' }, { x: 4, y: 2, type: 'light' },
      // [Act3 서명] 코어 앞 차폐 격벽 — 오브젝티브 남쪽 인접 3타일(grid.coverBonus 는
      //   '대상에 직교 인접 + 공격자 방향' 엄폐만 계산 → 코어에 붙은 유닛의 실효 엄폐).
      { x: 2, y: 1, type: 'light' }, { x: 3, y: 1, type: 'light' }, { x: 4, y: 1, type: 'light' },
    ],
    // enc③ — MERIDIAN_LIQUIDATOR(SHADE 청산인 hp26/def4, 중앙) + WARD_NODE×2(원장 수호, 선택) +
    //   STALKER(측면 압박). 코어 차감이 공통 완주선, 보스 격파는 부가 승리축.
    enemies: [
      { key: 'MERIDIAN_LIQUIDATOR', x: 3, y: 2 },
      { key: 'WARD_NODE',           x: 2, y: 1 },
      { key: 'WARD_NODE',           x: 4, y: 1 },
      { key: 'MERIDIAN_STALKER',    x: 1, y: 4 },
    ],
  };

  // ---- 대화 그래프 (3연전 · 회고 recall + 3 인카운터 체인 + 서명 선택) --------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'SILK', portrait: 'ghost',
        quote: 'BROKER',                       // loreQuote(BROKER) → SILK 명대사 버블(어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: '청산 법정으로 올라간다 — 결제일에 응한다', goto: 'recall' },
        ],
      },
      // ★recall — 회고 노드. a3-01/a3-02 선택 flag 게이트로 지난 결정을 오늘의 첫 수로 반영.
      //   각 쌍에서 정확히 하나가 열린다(체인 강제) + 무게이트 폴백 1종(소프트락 0).
      recall: {
        id: 'recall', speaker: 'SILK', portrait: 'ghost',
        text: '승강기가 최상층으로 올라가는 40초. SILK 가 장부를 덮는다. "올라가기 전에 하나만 정하자 — 오늘 우리가 뭘 들고 들어가는지."\n' +
              '지난 두 밤의 결정이, 이 방에서 우리가 설 자리를 정한다.',
        choices: [
          { label: '📜 공개한 목록을 들고 들어간다 — 도시가 이미 알고 있다',
            gate: { flag: 'ledgerPublished' }, show: 'gray',
            setFlags: { settlementStance: 'public' }, goto: 'approach',
            desc: 'a3-01 A(목록 공개) 회고 — 여론이 이미 서 있는 자리에서 시작한다',
          },
          { label: '🗄 봉인한 장부를 들고 들어간다 — 우리만 전문을 안다',
            gate: { flag: 'ledgerSealed' }, show: 'gray',
            setFlags: { settlementStance: 'sealed' }, goto: 'approach',
            desc: 'a3-01 B(목록 봉인) 회고 — 협상 카드를 손에 쥔 채 시작한다 (bridge2 지름길 연동)',
          },
          { label: '🏙 분산된 이자를 들고 들어간다 — 도시가 함께 지고 있다',
            gate: { flag: 'debtSpread' }, show: 'gray',
            setFlags: { settlementBacking: 'city' }, goto: 'approach',
            desc: 'a3-02 A(부담 분산) 회고 — 도시 전체가 채무를 나눈 상태로 선다',
          },
          { label: '📡 잘라낸 대역을 들고 들어간다 — SIGNAL 이 이미 자기 몫을 냈다',
            gate: { flag: 'signalThrottled' }, show: 'gray',
            setFlags: { settlementBacking: 'signal' }, goto: 'approach',
            desc: 'a3-02 B(SIGNAL 절단) 회고 — 채무자가 이미 일부를 상환한 상태로 선다',
          },
          { label: '아무것도 들지 않는다 — 빈손으로 서명란 앞에 선다',
            setFlags: { settlementStance: 'bare' }, goto: 'approach',
            desc: '무게이트 폴백 — 회고 없이 결전으로 (소프트락 방지 · 진행 무영향)',
          },
        ],
      },
      // ★enc① MFU 노드 — 무력 폴백 / [SPD4] 지름길.
      approach: {
        id: 'approach', speaker: 'SILK', portrait: 'ghost',
        text: '법정 진입층. 인도 확인 게이트가 승강기 출구를 막고, 추심관·사정관·저격수가 세 방향을 잡는다.\n' +
              '[SILK] "저 게이트를 통과 못 하면 우리는 오늘 여기 없었던 사람이 돼. 그럼 서명은 저들 마음대로야."',
        onEnter: { setFlags: { settlementEngaged: true } }, checkpoint: true,
        choices: [
          { label: '인도 전위를 정면으로 밀어낸다',
            effect: { startCombat: { onWin: 'bridge1' } },
            setFlags: { deliveryForced: true },
            desc: 'enc① COLLECTOR + ASSESSOR + STALKER 와 전투 → 인도 게이트 돌파 (공통 폴백, 6클래스 완주)',
          },
          { label: '[SPD 4] 저격선이 잡히기 전에 게이트로 파고든다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { deliveryOutpaced: true },
            effect: { skipCombat: true }, goto: 'bridge1',
            desc: '고SPD(CIPHER/BROKER/DRIFTER) → 전위 교전 회피, 게이트 선점(지름길). 저SPD 클래스는 잠김 → 전투 폴백',
          },
        ],
      },
      // ★bridge1 (interlude → enc②) — 무력 폴백 / [HACK5] · [AXIOM 태그] 지름길.
      bridge1: {
        id: 'bridge1', speaker: 'SILK', portrait: 'ghost',
        text: '게이트 너머는 원장 관제층이다. 도시 전체의 자산 항목이 벽면을 타고 흐르고, 관제 책임자가 그 흐름을 지킨다.\n' +
              STORY_CARD + '\n' +
              '[SIGNAL] "여기서 대조가 끝나면 서명란이 열려. 대조를 멈추면, 저들은 오늘 밤 안에 절차를 못 끝내."',
        onEnter: { setFlags: { settlementBreached: true } }, checkpoint: true,
        choices: [
          { label: '관제 책임자를 밀어내고 대조를 끊는다',
            effect: { startCombat: { encounter: 'stage2', onWin: 'bridge2' } },
            setFlags: { auditForced: true },
            desc: 'enc② COLLECTOR + ASSESSOR + DRONE(증원 DRONE)와 전투 → 원장 대조 중단 (공통 폴백)',
          },
          { label: '[HACK 5] 대조 흐름에 끼어들어 항목을 뒤섞는다',
            gate: { attr: 'hack', min: 5 }, show: 'gray',
            setFlags: { auditScrambled: true },
            effect: { skipCombat: true }, goto: 'bridge2',
            desc: 'HACK5(CIPHER) → 대조 항목 교란으로 enc② 전투 스킵(지름길). 저HACK 클래스는 잠김 → 전투 폴백',
          },
          { label: '[AXIOM 태그] 대조 입회인 자격으로 절차를 중단시킨다',
            gate: { tag: 'AXIOM' }, show: 'gray',
            setFlags: { auditSuspended: true },
            effect: { skipCombat: true }, goto: 'bridge2',
            desc: 'MOLE 위장 신분(AXIOM 태그) → 입회인 권한으로 절차 중단(지름길). 태그 미보유 클래스는 회색 → 전투 폴백',
          },
        ],
      },
      // ★bridge2 (interlude2 → enc③) — 무력 폴백 / [DEF3] · [flag ledgerSealed] 지름길.
      bridge2: {
        id: 'bridge2', speaker: 'SILK', portrait: 'ghost',
        text: '법정 본실. 인도 코어가 방 한가운데서 낮게 돈다. 그 앞에 청산인이 서 있다 — 무장이 아니라 정장 차림으로.\n' +
              '[LIQUIDATOR] "당신들은 계속 이걸 전투로 오해하는군요. 나는 이기러 온 게 아닙니다. **받으러** 왔습니다."\n' +
              '[SILK] "그 말 그대로 돌려주지. 우리도 이기러 온 게 아니야. 안 주러 왔어."',
        onEnter: { setFlags: { liquidatorReached: true } }, checkpoint: true,
        choices: [
          { label: '청산인을 마주하고 인도 코어로 밀어붙인다',
            effect: { startCombat: { encounter: 'stage3', onWin: 'outro' } },
            setFlags: { liquidatorEngaged: true },
            desc: 'enc③ 결전 — LIQUIDATOR + WARD_NODE×2 + STALKER 와 전투 · 인도 코어 차감 (공통 폴백)',
          },
          { label: '[DEF 3] 청산인의 사격선을 버텨내며 코어에 붙는다',
            gate: { attr: 'def', min: 3 }, show: 'gray',
            setFlags: { liquidatorTanked: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: '고DEF(BLADE/RIGGER/MOLE) → 화력을 무릅쓰고 코어 직행(지름길). 저DEF 클래스는 잠김 → 결전 폴백',
          },
          { label: '[flag ledgerSealed] 봉인해 둔 원장 전문을 협상 테이블에 올린다',
            gate: { flag: 'ledgerSealed' }, show: 'gray',
            setFlags: { liquidatorNegotiated: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'a3-01 B(목록 봉인) 계승 flag → 원장 전문을 카드로 써 결전 회피(지름길). 목록을 공개한 회차에는 회색 → 결전 폴백',
          },
        ],
      },
      // enc③/우회 공통 아웃트로 — 인도 절차 정지. 부채는 남는다.
      outro: {
        id: 'outro', speaker: 'SILK', portrait: 'ghost',
        text: '인도 코어가 멈춘다. 벽면을 흐르던 도시의 자산 항목이 한 줄씩 정지하고, 서명란이 빈 채로 굳는다.\n' +
              '[LIQUIDATOR] "…절차는 연기될 뿐입니다. 채권은 소멸하지 않아요." 청산인은 물러나면서도 서류를 놓지 않는다.\n' +
              '[SILK] "알아. 그러니까 이제 우리가 정하자 — 이 빚을 어떻게 끝낼지."\n' + STORY_CARD,
        onEnter: { setFlags: { liquidatorStopped: true, act3Settled: true } }, checkpoint: true,
        choices: [ { label: '빈 서명란 앞에 선다', goto: 'choice' } ],
      },
      // ★플레이어 선택 — 부채의 종결 방식. 영속 flag(4엔딩 판정 무관 · ending.js 무편집).
      choice: {
        id: 'choice', speaker: 'SILK', portrait: 'ghost',
        text: '"두 가지야. 원장을 태우거나, 우리 이름으로 인수하거나."\n' +
              '태우면 채권은 근거를 잃는다. 대신 애시그리드는 어떤 계약서에도 오르지 못하는 도시가 된다 — 신용 밖의 도시.\n' +
              '인수하면 부채는 남는다. 대신 채무자는 MERIDIAN 이 아니라 애시그리드가 된다 — 자기 빚을 자기 이름으로 지는 도시.',
        choices: [
          { label: 'A. 원장을 태운다 — 근거가 없으면 청구도 없다',
            setFlags: { settlementChoice: 'burn', debtBurned: true },
            effect: { karma: 2 }, goto: 'settle',
            desc: 'karma +2 · 채권의 근거 소각. 도시는 신용 밖으로 나가되, 누구의 담보도 아니게 된다 (영속 flag)',
          },
          { label: 'B. 도시 이름으로 인수한다 — 빚은 남기되 주인은 바꾼다',
            setFlags: { settlementChoice: 'assume', debtAssumed: true },
            effect: { rep: 3 }, goto: 'settle',
            desc: '렙 +3 · 채무자를 애시그리드로 이전. 부채는 남지만 도시는 계약의 당사자가 된다 (영속 flag)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'SILK', portrait: 'ghost',
        text: 'Act 3 — Settlement Day. 청산 법정의 불이 꺼진다. 결제일이 지나갔고, 도시는 여전히 여기 있다.\n' +
              '[SIGNAL] "빚은 총보다 오래 남아. 하지만 오늘은, 갚는 방식을 우리가 골랐어."\n' +
              '[SILK] "장부는 다시 쓸 수 있어. 그게 총이랑 다른 점이야." 그녀가 처음으로 장부를 덮고 웃는다.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (Act3 종결 apex — 캡스톤(rep12/karma4/₵24) 아래, 메인(rep9) 위) ------
  var REWARDS = {
    rep: 11,
    karma: 4,
    nuyen: 22,
    unlocks: [],   // Act3 종결 — 후속 해금 없음(4엔딩·캡스톤 기록 계약 무변경).
  };

  var MISSION = {
    id: 'a3-03-finale',
    title: 'Act 3 — Settlement Day',
    subtitle: 'ACT 3 종결 — 청산 법정 (넥서스 최상층 · 3연전 · MERIDIAN LIQUIDATOR 결전)',
    kind: 'act3',
    unlock: { missionsDone: ['a3-02-interest'] },
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                              // enc①
    encounters: { stage2: ENC2, stage3: ENC3 },  // enc②(원장 관제) · enc③(청산인 결전)
    rewards: REWARDS,
    nextHint: 'Act 3 완주 — 4엔딩·캡스톤 기록은 불변(Act 3 는 후일담 아크). 남은 클래스 사이드는 편성 전환 시 개방.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A3_03_FINALE = API;
})();
