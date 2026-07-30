;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a3-00-framing.js — [신규 v6.54] ACT 3 프레이밍 "SIGNAL DEBT"
  //   (Act 3 도입 · 엔진 무편집 콘텐츠. 포맷 정본 = a2-00-framing. 순수 리터럴.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표:
  //   [신규] Act 3 아크 자체 — docs/25 §9.2 가 "캡스톤 이후(Act 3 등)에 대한 데이터 파일·
  //          계획은 리포에 없다"고 명시한 미개척 구간을, 엔진 무편집 데이터 확장으로 신설.
  //   [계승] 서사 기점 = a2-99-flagship outro/settle + ending.js CAPSTONE "도시는 승리하지
  //          않았다 — 도시는 살아남았다" · SIGNAL "이건 승리가 아니야. 이건… 우리가 아직
  //          여기 있다는 뜻이야." → 그 생존에 **값이 붙었다**는 것이 Act 3 의 전제.
  //   [계승 docs/01 §2040년대·§메시] CARBON 이 도시 전력·통신 인프라를 '매입'했고, 코어텍스
  //          와이어는 HELIX 계약으로 전 시민 의무 이식이다 — 즉 애시그리드의 메시 인프라는
  //          처음부터 담보로 잡힐 수 있는 자산이었다. MERIDIAN(외부 기업 "연합", a2-00 계보)이
  //          청산되자 그 담보권이 채권자에게 넘어간다.
  //   [계승 lore GHOST_IDENTITY.BROKER] SILK(SERA HOLT) = "누가 누구에게 무엇을 빚졌는지
  //          완벽한 장부를 쥔 중개인" — Act 2 의뢰인이 Act 3 에서 **장부의 주인**으로 승격.
  //          quote:'BROKER' → lore-adapter loreQuote 가 SILK 명대사 버블 삽입.
  //   [신규] 적대 = MERIDIAN 청산관리단(data/enemies.js MERIDIAN_ASSESSOR/COLLECTOR/LIQUIDATOR).
  //          침공군이 아니라 회수반 — 같은 세력의 다른 부서라는 점이 Act 2 와의 톤 차이.
  //   [계승 docs/25 §4.4 · a2-00 관례] MFU 접근 3출구: 전투 / [SPD 4] 정찰 우회 /
  //          [flag overlordHacked] 캡스톤 코어 침습 이력 — 셋 다 outro 합류.
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: MISSION.kind='act3' / MISSION.unlock 은 campaign.js 레지스트리가 소비.
  //   해금 = missionsDone a2-99-flagship (캡스톤 클리어) — 엔딩 종류와 무관.
  // SIMPLIFIED: [flag overlordHacked] 는 a2-99 bridge2 [HACK 5] 지름길이 세우는 계승 flag —
  //   이 미션에서 set 하지 않으므로 검증기 info("계승 플래그로 가정") 예상. **항상 참이 아니다**
  //   (캡스톤을 전투로 넘긴 회차에는 회색) → 지난 회차의 해법이 이번 회차의 지름길이 되는 설계.
  //   폴백 전투가 상존하므로 6클래스 완주 보장(MFU).
  // ==========================================================================

  // ---- 원전 산문 앵커 (a2-99 settle + ending.js CAPSTONE, 계승/각색) --------------
  var OPENING = [
    '기함이 가라앉은 지 아흐레. 애시그리드는 여전히 애시그리드다 — 그리고 그 사실에 값이 매겨졌다.', // [계승] CAPSTONE "THE CITY REMAINS"
    '[SILK] "축하는 짧게 하자. 나는 장부를 보는 사람이고, 지금 장부가 이상해."', // [계승] lore BROKER 장부 정체성
    '[SILK] "MERIDIAN 은 함대가 아니라 연합이었어. 연합이 무너지면 남는 건 시체가 아니라 **채권**이야."', // [신규] Act3 전제
    'MERIDIAN 은 침공 자금을 담보로 조달했다. 그 담보 목록 맨 아래 줄에, 애시그리드의 메시 인프라가 적혀 있다.', // [계승 docs/01] 인프라=자산
    '[SIGNAL] "…나도 계산에 들어가 있어." SIGNAL 의 목소리가 처음으로 느리다. "기함을 떨어뜨리려고, 나는 이 도시의 대역폭을 당겨 썼어."', // [계승] a2-99 SIGNAL 톤
    '[SILK] "그러니까 빚이 두 개야. 저들이 도시에 건 담보권, 그리고 네 친구가 도시에서 끌어다 쓴 신호. 오늘 밤 첫 번째 청구서가 도착했어."', // [신규] SIGNAL DEBT 정의
  ];
  var STORY_CARD = 'MERIDIAN 채권 인증 노드가 침묵한다. 회수반의 선발대는 물러났지만, 청구서는 취소되지 않는다 — 다만 발신인이 누구인지가 확정됐을 뿐이다.';
  var REFRAIN = '도시는 승리하지 않았다. 도시는 살아남았고, 살아남은 것에는 값이 붙는다.';

  // ---- 전투 인카운터 (넥서스 하부 메시 중계탑 6열 × 7행, 소형 단일 — 프레이밍) ----
  //  좌표 {x:열 0..5, y:행 0..6}. row0=상단(채권 인증 노드), row6=하단(진입 통로).
  //  [신규] 중계탑 하부 무대. wall=붕괴한 냉각 덕트, cover=중계 캐비닛/케이블 드럼.
  var COMBAT = {
    cols: 6, rows: 7,
    playerStart: { x: 3, y: 6 },
    // 오브젝티브 = MERIDIAN 채권 인증 노드(threshold 누적 차감). [계승 store applyHackObjective]
    //   인접 유닛 max(HACK,ATK) 자동축 → 6클래스 전원 다른 축으로 완주(부가 승리 경로).
    //   threshold 8 = Act2 프레이밍(7) 대비 +1 — Act3 진입 지점의 완만한 상향.
    objective: { x: 3, y: 0, threshold: 8, veil: 0, label: 'MERIDIAN 채권 인증 노드', dataTB: 1.4 },
    // [계승 G10, 각색 raidThreshold] 위협 임계 + 증원(경보 1회 스폰) — 소형 페이싱.
    threatCap: 8,
    reinforcement: { key: 'MERIDIAN_DRONE', x: 5, y: 1 },
    // [신규] 붕괴한 냉각 덕트 1개 — 좌측 통로 차단(우회 유도), 중앙 x=3 러시 레인은 개방.
    walls: [
      { x: 1, y: 3 },
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1 / full=DEF+2. 중계 캐비닛 3 + 케이블 드럼 1.
    cover: [
      { x: 2, y: 4, type: 'light' }, { x: 4, y: 4, type: 'light' },
      { x: 3, y: 5, type: 'full' }, { x: 4, y: 2, type: 'light' },
    ],
    // 적 배치 — 회수 선발대. ASSESSOR(MESH 사정관 · 값매김) + STALKER(SHADE 저격) +
    //   DRONE(VOLT 기계 · DATA SPIKE 대상). 전 적 killable → 전멸/오브젝티브 이중 승리(MFU).
    enemies: [
      { key: 'MERIDIAN_ASSESSOR', x: 3, y: 2 },
      { key: 'MERIDIAN_STALKER',  x: 1, y: 2 },
      { key: 'MERIDIAN_DRONE',    x: 4, y: 3 },
    ],
  };

  // ---- 대화 그래프 (MFU §2.0 · 프레이밍 단일 전투) ----------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'SILK', portrait: 'ghost',
        quote: 'BROKER',                       // loreQuote(BROKER) → SILK 명대사 버블(어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: '중계탑 하부로 내려간다 — 청구서의 발신인을 확인한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 전투 / [SPD4] 우회 / [flag] 캡스톤 이력, 세 출구가 모두 outro 합류.
      approach: {
        id: 'approach', speaker: 'SILK', portrait: 'ghost',
        text: '넥서스 하부 메시 중계탑. 케이블 드럼 사이로 낯선 단말이 서 있다 — 무기가 아니라 **계측기**다.\n' +
              'MERIDIAN 사정관 하나가 중계 대역을 값매기고, 저격수와 드론이 그 주위를 지킨다.\n' +
              '[SILK] "저건 정찰이 아니야. 감정평가야. 저들은 이 도시를 얼마에 뜯어갈지 계산하는 중이야."',
        choices: [
          { label: '회수 선발대를 걷어내고 인증 노드를 끊는다',
            effect: { startCombat: { onWin: 'outro' } },
            setFlags: { receiversEngaged: true },
            desc: 'MERIDIAN 회수 선발대(ASSESSOR + STALKER + DRONE)와 전투 → 인증 노드 확보 (공통 폴백, 6클래스 완주 가능)',
          },
          { label: '[SPD 4] 계측 사각으로 파고들어 인증 노드만 조용히 뽑는다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { receiversSlipped: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: '고SPD(CIPHER/BROKER/DRIFTER) → 교전 없이 인증 노드 회수(지름길). 저SPD 클래스는 잠김 → 전투로 폴백',
          },
          { label: '[flag overlordHacked] 기함 코어에 남긴 침습 흔적으로 인증 서명을 위조한다',
            gate: { flag: 'overlordHacked' }, show: 'gray',
            setFlags: { receiptForged: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: '캡스톤에서 [HACK 5]로 사령 코어를 직접 끊은 이력(overlordHacked 계승) → 인증 서명 위조(지름길). 캡스톤을 전투로 넘긴 회차에는 회색 → 전투 폴백',
          },
        ],
      },
      // 세 출구 공통 아웃트로 — 어느 경로든 결과는 같다(선발대 축출·채권 원장 사본 확보).
      outro: {
        id: 'outro', speaker: 'SILK', portrait: 'ghost',
        text: '인증 노드가 꺼진다. 그 안에서 뽑아낸 것은 병력 배치도가 아니라 **원장 사본**이다.\n' +
              '[SILK] "…채권자가 하나가 아니야. 청산관리단이야. 저들은 싸우러 오는 게 아니라, 받으러 와."\n' +
              '[SIGNAL] "그리고 내 이름도 그 목록에 있어. 채무자 쪽에." SIGNAL 이 잠깐 말을 멈춘다. "미안해."\n' + STORY_CARD,
        onEnter: { setFlags: { signalDebtKnown: true, act3Framed: true } }, checkpoint: true,
        choices: [ { label: '원장 사본을 SILK 의 장부에 얹는다', goto: 'settle' } ],
      },
      settle: {
        id: 'settle', speaker: 'SILK', portrait: 'ghost',
        text: 'Act 3 — Signal Debt. 성벽 밖의 군대는 물러갔고, 성벽 밖의 회계가 도착했다.\n' +
              '[SILK] "총은 막을 수 있어. 장부는 못 막아. 장부는 읽거나, 다시 쓰거나, 둘 중 하나야."\n' +
              '어느 엔딩으로 이 도시의 이름을 정했든, 청구서에 적힌 주소는 같다 — 애시그리드.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (프레이밍 — Act2 프레이밍 대비 소폭 상향) ----------------------
  var REWARDS = {
    rep: 5,
    karma: 1,
    nuyen: 10,
    unlocks: [],
  };

  var MISSION = {
    id: 'a3-00-framing',
    title: 'Act 3 — Signal Debt',
    subtitle: 'ACT 3 프레이밍 — 청산관리단 첫 접촉 (넥서스 하부 중계탑 · 장부의 주인 SILK)',
    kind: 'act3',                                             // campaign.js 레지스트리 소비(ACT 3 보드 섹션).
    unlock: { missionsDone: ['a2-99-flagship'] },              // 캡스톤 클리어로 해금(엔딩 무관).
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
    nextHint: 'ACT 3 본편 — 담보(a3-01) → 이자(a3-02) → 결제일(a3-03) 순차 해금. 클래스 사이드 2종은 프레이밍 완주 + 해당 클래스 편성 시 개방.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A3_00_FRAMING = API;
})();
