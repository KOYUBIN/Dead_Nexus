;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/ch08-zero-day.js — 챕터 8 "Zero Day" 미션 데이터 (최종 챕터)
  //   (챕터 = 데이터 파일 1개. 엔진 무편집으로 챕터 추가 — docs/25 §5.1)
  //   포맷 정본 = ch01-first-blood.js (IIFE·window 등록·순수 리터럴·계보 주석).
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문 '[SIGNAL] ZERO DAY. CHOOSE.'·'이 도시의 마지막 이름을
  //     정하는 것은 우리다'                    [그대로] cards/legacy/chapter-08-zero-day.md §오프닝 내러티브 원문 고정
  //   리프레인 '이 도시의 마지막 이름을 정하는 것은 우리다'  [그대로] chapter-08 §오프닝 원전 인용
  //   스토리 카드(공통 에필로그) '도시는 원래 이름이…'       [그대로] chapter-08 §6 스토리 카드 원문
  //   SIGNAL 최종 출력 'THANK YOU FOR PLAYING…'            [계승] chapter-08 §SIGNAL의 최종 출력 3행(원문 인용)
  //   4엔딩 분기 CORPORATE ETERNAL/STREET RISING/          [계승] chapter-08 §봉투 H 엔딩 카드 4종 + §최종 선택 절차
  //     NEXUS REBORN/DEAD NEXUS                                (조건·서사 요지 각색, 최후 선택 구조 계승)
  //   최후 선택(누적 flag 가 최종 서사를 결정)              [계승] chapter-08 §엔딩 확정 절차 "선택은 이미 지난 일곱 챕터 동안"
  //   무대(넥서스 코어/의장실 F6)                          [계승] docs/10 §2 NEXUS 코어 + chapter-07 §2 TOP 의장실
  //   의뢰인/최종 출력 SIGNAL                              [계승] chapter-08 §SIGNAL의 마지막 메시지
  //   접근 대화 3출구      [계승 ch01~06 §접근 + docs/25 §4.4] 전투 / [HACK5] 제로데이 서명 직결 / [ATK5] 격벽 관통
  //                          — 두 게이트가 각각 CIPHER·BLADE 지름길, 전투는 공통 폴백(MFU 균형)
  //   전투 무대            [계승 docs/10 §2 NEXUS 코어] 7×8 코어 챔버, 제로데이 코어 파괴/수집 오브젝티브
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  //
  // [SIMPLIFIED — 보고] ① endingSplit 의 4엔딩 분기는 "누적 flag 조합 판정"이지만, 엔진의
  //   evalGate 는 flag 게이트를 단일 boolean 존재 판정만 지원한다(값 비교·논리조합 미지원).
  //   따라서 4엔딩을 각 1개의 계승 boolean flag 로 게이트하고, 항상 선택 가능한 ungated 폴백
  //   1개(→ DEAD NEXUS)를 둔다. 이는 chapter-08 §최종 선택 절차의 "SIGNAL 선택자도 없으면
  //   → 도시의 죽음(엔딩 4)" 기본값 규칙과 정합하며, 동시에 MFU 완주 폴백을 보장한다(엔진 무편집).
  //   계획의 4개 판정축 → 실제 계승 boolean flag 매핑:
  //     endingTrack(ch07)  → flag 'endingTrack'      → CORPORATE ETERNAL
  //     heroChoice(ch01)   → flag 'allBlocsHostile'  → STREET RISING
  //                          (heroChoice 는 'hero'/'ghost' 값 모두 truthy → boolean 게이트로
  //                           英雄 경로만 구분하려면 hero 전용 flag 'allBlocsHostile' 사용)
  //     ascend(ch05)       → flag 'ascendEnding'     → NEXUS REBORN
  //     purist(ch04)       → flag 'puristFlag'       → DEAD NEXUS(선택으로서의 죽음)
  //   위 4 flag 는 모두 前 챕터(ch01/04/05/07)에서 세워지는 계승 flag — 이 파일에서는 set 하지
  //   않음(검증기 info 예상: "이 미션에서 설정되지 않음 — 계승 플래그로 가정").
  // [SIMPLIFIED — 보고] ② intro 의 quote:'SIGNAL' 은 현 lore 어댑터에 SIGNAL 항목이 없어
  //   loreQuote 가 null 을 반환(무해·무버블). SIGNAL 발화는 산문 [그대로]로 실었고, quote 키는
  //   향후 SIGNAL lore 항목 추가 시 자동 결선되는 전방 호환 훅으로만 남긴다(ch05 선례).
  //
  // [통합 노트] 메인 해금 = missionsDone 에 'ch07-heart-of-city' 포함(챕터7 종료 시 자동 해금).
  //   현 store.js 는 단일 하드코딩 → 미션 레지스트리 필요. 아래 unlock 필드는 레지스트리 도입
  //   전까지 미소비 메타데이터(엔진 무편집). 적 로스터(NEXUS_WARDEN·VANTA_ELITE·MESH_WISP·
  //   SIGNAL_ICE)는 통합 단계에서 enemies.js 추가 — 이 파일은 계획 로스터 ID 를 참조만 한다.
  // ==========================================================================

  // ---- 원전 산문 앵커 (cards/legacy/chapter-08-zero-day.md, 원문 고정) ----------
  // [그대로] §오프닝 내러티브 — 원문 문장·순서 유지.
  var OPENING = [
    '2092년 6월 01일. 00:00:00.',
    '도시의 모든 시계가 동시에 정지했다.',
    '3초 후, 메시에 같은 메시지가 떴다.',
    '[SIGNAL] ZERO DAY. CHOOSE.',
    '선택은 네 가지였다.',
    '아니, 정확히는 네 가지 결과였다.',
    '선택은 이미 지난 일곱 챕터 동안 이루어졌다.',
    '지금 남은 일은 그 선택이 어떤 결과를 낳았는지 보는 것뿐이었다.',
    '여덟 번째로 도시가 깨달은 사실:',
    '이 도시의 마지막 이름을 정하는 것은 우리다.',
  ];
  // [그대로] chapter-08 §6 스토리 카드 — 공통 에필로그 원문.
  var STORY_CARD = '"도시는 원래 이름이 몇 개 있었다. 마지막 이름을 정하는 건 언제나 우리였다. 이번엔 어떻게 정했는가?"';
  // [그대로] chapter-08 §오프닝 리프레인.
  var REFRAIN = '이 도시의 마지막 이름을 정하는 것은 우리다.';
  // [계승/그대로] chapter-08 §SIGNAL의 최종 출력 3행 — 원문 인용.
  var SIGNAL_FINAL = [
    '[SIGNAL] THANK YOU FOR PLAYING.',
    '[SIGNAL] THE CITY WILL REMEMBER.',
    '[SIGNAL] ...AND SO WILL I.',
  ];

  // ---- 전투 인카운터 (NEXUS 코어 챔버 7열 × 8행 — F6 의장실) --------------------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(제로데이 코어), row7=하단(고스트 진입).
  //  [계승 docs/10 §2 NEXUS 코어 · chapter-07 §2 TOP 의장실] 무대(최종 전장).
  //  wall  : 이동+LoS 완전 차단(코어 지지 기둥). cover : 이동 차단·LoS 투과, DEF 보정만.
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    // 오브젝티브 = 제로데이 코어 파괴 겸 수집(threshold 누적 차감 = objective-reduce).
    //  effective threshold = 10 + veil 0 = 10 (51차 밸런스: 14+2 → 10+0 — 저HP 해커(CIPHER 12HP)가
    //  NEXUS 알파 아래 은신 러시로 코어를 완주할 수 있는 상한. 최종 난이도는 임계가 아니라 적 구성
    //  (NEXUS_WARDEN HP22/DEF5 = 시리즈 최강, 4클래스 전원 전멸 불가 → 오브젝티브 러시 강제)으로 성립).
    //  dataTB 9.9 = 도시 그 자체(로그 표기). [계승 store applyHackObjective] CIPHER=HACK 해킹 /
    //  BLADE=ATK 강습 → 코어 돌파 자동축으로 양 클래스 완주(파괴/수집 hybrid).
    objective: { x: 3, y: 0, threshold: 10, veil: 0, label: '제로데이 코어', dataTB: 9.9 },
    // [계승 ch01~06 · 각색 raidThreshold] 위협 임계 + 증원 — 최종 챕터 최대치 12.
    threatCap: 12,
    reinforcement: { key: 'NEXUS_WARDEN', x: 6, y: 1 },   // 코어 증원 (최후 수호 추가 투입)
    // [신규 docs/25 §3.4] wall×2 — 코어 지지 기둥이 게이트로의 LoS 를 일부 차단(우회 유도).
    walls: [
      { x: 1, y: 1 }, { x: 5, y: 1 },   // 코어 챔버 좌·우 지지 기둥 (중앙 x=3 접근선은 개방)
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1, full=DEF+2. full×4=코어 콘솔·격벽 잔해.
    cover: [
      { x: 2, y: 4, type: 'full'  }, { x: 4, y: 4, type: 'full'  },   // 코어 콘솔 라인
      { x: 2, y: 6, type: 'full'  }, { x: 4, y: 6, type: 'full'  },   // 진입 전방 격벽 잔해
      { x: 1, y: 5, type: 'light' }, { x: 5, y: 5, type: 'light' },   // 측면 데이터 스택
    ],
    // 적 배치 — key 는 data/enemies.js 참조(통합 단계에서 추가). 계획 로스터 ID 참조만.
    //  NEXUS_WARDEN = 최종 수호(고DEF, 기계 아님 → 양 클래스 처치 가능).
    //  VANTA_ELITE  = 정예 근접·엄폐 활용(양 클래스 처치 가능).
    //  MESH_WISP    = isMachine → 물리로도 처치 가능(BLADE 완주 보장).
    //  SIGNAL_ICE   = static·physImmune·optional → 코어 앞 정적 수호. 물리 무효지만 필수 처치
    //    아님(오브젝티브 차감/전멸 무관하게 승리 가능) → BLADE 하드락 없음(MFU). "코어는 신호의
    //    영역" 테마만 유지 — 물리무효 수호는 오직 static 이 담당.
    //  51차 밸런스: 정예 2→1 감축 + 위습 우측 이설 — 저HP 해커가 NEXUS 알파 아래 코어 러시 생존
    //  가능하도록(코어 threshold 도 14→10). 최종 난이도는 NEXUS(hp22/def5, 시리즈 최강)로 유지.
    enemies: [
      { key: 'NEXUS_WARDEN', x: 3, y: 2 },   // 중앙 최종 수호 (코어 정면 저지)
      { key: 'VANTA_ELITE',  x: 5, y: 3 },   // 우익 정예
      { key: 'MESH_WISP',    x: 5, y: 6 },   // 우측 순찰 위습 (isMachine) — 중앙 진입선(2,5)→우측 이설
      { key: 'SIGNAL_ICE',   x: 3, y: 1 },   // 코어 앞 정적 수호 (physImmune·optional)
    ],
  };

  // ---- 대화 그래프 (docs/25 §4.2 노드 스키마) ----------------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      // 오프닝 — 2092.06.01 00:00:00, 모든 시계가 멈추고 SIGNAL 이 'ZERO DAY. CHOOSE.' 를 띄운다.
      //  [SIMPLIFIED ②] SIGNAL lore 미등록 → loreQuote null(무해). 발화는 산문 [그대로].
      intro: {
        id: 'intro', speaker: 'SIGNAL', portrait: 'ghost',
        quote: 'SIGNAL',
        text: OPENING.join('\n'),
        choices: [
          { label: '넥서스 코어(F6 의장실)로 향한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 두 게이트가 각각 CIPHER·BLADE 지름길, 전투는 공통 폴백 (docs/25 §1·§4.4).
      //  세 출구 모두 coreBreach 로 수렴(전투는 onWin, 게이트는 skipCombat→goto).
      approach: {
        id: 'approach', speaker: 'SIGNAL', portrait: 'ghost',
        quote: 'SIGNAL',
        text: '넥서스 코어, F6 의장실 — 도시의 심장부. 제로데이 코어가 방 중앙에서 멈춘 시간을 붙들고 있다.\n' +
              '마지막 수호 — NEXUS 워든, VANTA 정예, 메시 위습 — 이 코어를 둘러싼다. 코어 바로 앞엔 정적 수호 ICE 가 서 있다.\n' +
              '제로데이 서명이 공기 중에 떠 있고, 물리 격벽이 코어를 감싼다. SIGNAL 의 마지막 프롬프트가 깜박인다 — CHOOSE.',
        choices: [
          { label: '넥서스 수호와 정면으로 결전한다',
            effect: { startCombat: { onWin: 'coreBreach' } },
            setFlags: { breachMethod: 'assault' },
            desc: 'NEXUS 수호와 전투 → 코어 돌파 (양 클래스 공통 폴백 · HACK/ATK 강습 자동축)',
          },
          { label: '[HACK 5] 제로데이 서명으로 코어에 직결한다',
            gate: { attr: 'hack', min: 5 }, show: 'gray',
            setFlags: { breachMethod: 'signature', zeroDaySignature: true },
            effect: { skipCombat: true }, goto: 'coreBreach',
            desc: 'CIPHER HACK5 통과 → 전투 스킵·서명 직결(지름길). BLADE HACK1 잠김 → 전투로 완주',
          },
          { label: '[ATK 5] 코어 격벽을 물리로 관통한다',
            gate: { attr: 'atk', min: 5 }, show: 'gray',
            setFlags: { breachMethod: 'breach', bulkheadBroken: true },
            effect: { skipCombat: true }, goto: 'coreBreach',
            desc: 'BLADE ATK5 통과 → 전투 스킵·격벽 관통(지름길). CIPHER ATK2 잠김 → 전투로 완주',
          },
        ],
      },
      // 코어 돌파 — 세 접근이 수렴(파괴/수집 hybrid). 전투 경로는 오브젝티브 차감으로 코어를 이미
      //  돌파한 뒤 진입. 여기서 지난 일곱 챕터의 누적 선택을 코어에 입력한다 → endingSplit.
      coreBreach: {
        id: 'coreBreach', speaker: 'CIPHER', portrait: 'ghost',
        text: '제로데이 코어가 열린다. NEXUS 코어 — 도시의 모든 시계를 멈춘 그 심장 — 이 손안에서 맥동한다.\n' +
              '파괴할 것인가, 장악할 것인가. 코어는 9.9테라바이트의 도시 그 자체를 담고 있다.\n' +
              '하지만 진짜 선택은 이미 지난 일곱 챕터 동안 내려졌다. 남은 건 그 선택을 확정하는 일뿐이다.',
        onEnter: { setFlags: { zeroDayBreached: true } }, checkpoint: true,
        choices: [ { label: '누적된 선택을 코어에 입력한다', goto: 'endingSplit' } ],
      },
      // ★엔딩 분기 노드 [계승 chapter-08 §최종 선택 절차] — 누적 flag 가 최종 서사를 실제로 결정.
      //  [SIMPLIFIED ①] 4엔딩 = 각 1개 계승 boolean flag 게이트 + ungated 폴백(→ DEAD NEXUS).
      //  ungated 폴백은 카드의 "기본값=도시의 죽음" 규칙과 정합하며 MFU 완주를 상시 보장(양 클래스).
      endingSplit: {
        id: 'endingSplit', speaker: 'SIGNAL', portrait: 'ghost',
        quote: 'SIGNAL',
        text: '"이 도시의 마지막 이름을 정하는 것은 우리다."\n' +
              '코어가 되묻는다 — 지난 일곱 챕터의 선택이 어떤 결과를 낳았는가.',
        choices: [
          { label: '[flag endingTrack] 기여 트랙이 확정한 이름 — 승자 블록이 국가가 된다',
            gate: { flag: 'endingTrack' }, show: 'gray',
            setFlags: { endingChoice: 'corporate' }, goto: 'endCorporate',
            desc: 'ch07 블록 지배 트랙(endingTrack) → CORPORATE ETERNAL (누적 flag 가 서사 확정)',
          },
          { label: '[flag allBlocsHostile] 거리가 도시를 되찾는다',
            gate: { flag: 'allBlocsHostile' }, show: 'gray',
            setFlags: { endingChoice: 'street' }, goto: 'endStreet',
            desc: 'ch01 영웅 선택(정체 공개·전 블록 적대, heroChoice=hero 파생) → STREET RISING',
          },
          { label: '[flag ascendEnding] SIGNAL 과 합일해 평의회를 재건한다',
            gate: { flag: 'ascendEnding' }, show: 'gray',
            setFlags: { endingChoice: 'reborn' }, goto: 'endReborn',
            desc: 'ch05 ASCEND(SIGNAL 합일·우호) → NEXUS REBORN (유일한 전원 생존 엔딩)',
          },
          { label: '[flag puristFlag] 어떤 이름에도 굴하지 않고 코어를 무너뜨린다',
            gate: { flag: 'puristFlag' }, show: 'gray',
            setFlags: { endingChoice: 'dead' }, goto: 'endDead',
            desc: 'ch04 PURIST(모든 타협 거부) → DEAD NEXUS (실패가 아닌 선택으로서의 죽음)',
          },
          { label: '누구도 왕관을 쓰지 못한 채, 코어를 멈춘 자리에 둔다',
            setFlags: { endingChoice: 'dead' }, goto: 'endDead',
            desc: '누적 flag 없음 → 카드 확정 절차 기본값(DEAD NEXUS). 상시 선택 = MFU 폴백(양 클래스 완주 보장)',
          },
        ],
      },
      // 🏙️ 엔딩 1 — CORPORATE ETERNAL (블록 체제 유지) [계승 chapter-08 §엔딩1]
      endCorporate: {
        id: 'endCorporate', speaker: 'CIPHER', portrait: 'ghost',
        text: '승자 블록의 로고가 도시의 새 이름이 된다. 넥서스 의장실의 불은 다시는 꺼지지 않는다 — 그 방에 주인이 생겼다.\n' +
              '블록 하나가 국가를 삼켰다. 남은 블록은 강제 합병되고, 거리는 지하로 잠복한다.\n' +
              '레거시 상자에 "ERA OF ONE" 스티커가 영구히 부착된다.',
        onEnter: { setFlags: { ending: 'corporate-eternal' } }, checkpoint: true,
        choices: [ { label: '새 이름 아래의 도시를 뒤로한다', goto: 'settle' } ],
      },
      // 🔥 엔딩 2 — STREET RISING (고스트 혁명) [계승 chapter-08 §엔딩2]
      endStreet: {
        id: 'endStreet', speaker: 'CIPHER', portrait: 'ghost',
        text: '거리가 도시를 되찾는다. 네가 이름을 공개한 그 밤부터 모든 블록이 너를 적으로 삼았고 — 그 적의가 오늘 도시 전체의 봉기가 되었다.\n' +
              '블록 체제가 해체된다. 넥서스 코어는 이제 누구의 것도 아니다.\n' +
              '레거시 상자에 "NEW CITY" 스티커가 부착된다.',
        onEnter: { setFlags: { ending: 'street-rising' } }, checkpoint: true,
        choices: [ { label: '봉기의 한복판을 걸어 나간다', goto: 'settle' } ],
      },
      // 🕊️ 엔딩 3 — NEXUS REBORN (평의회 재건) [계승 chapter-08 §엔딩3]
      endReborn: {
        id: 'endReborn', speaker: 'SIGNAL', portrait: 'ghost',
        text: '평의회가 다시 구성된다. 완벽한 해피엔딩은 아니지만, 도시는 살아남는다.\n' +
              '메시로 올라간 네 의식이 SIGNAL 과 합일했고 — 그 우호가 코어를 파괴가 아닌 재건으로 돌렸다.\n' +
              '레거시 상자에 "BALANCED" 스티커가 부착된다. 다음을 위한 문 하나가 남는다.',
        onEnter: { setFlags: { ending: 'nexus-reborn' } }, checkpoint: true,
        choices: [ { label: '재건되는 도시를 지켜본다', goto: 'settle' } ],
      },
      // 💀 엔딩 4 — DEAD NEXUS (도시의 죽음) [계승 chapter-08 §엔딩4]
      endDead: {
        id: 'endDead', speaker: 'CIPHER', portrait: 'ghost',
        text: '아무도 승리하지 못한다. 애시그리드는 도시이기를 멈춘다.\n' +
              '그러나 이것은 실패가 아니라 선택이었다 — 어떤 체제에도, 어떤 이름에도 굴하지 않은 마지막 선택.\n' +
              '제로데이 코어가 무너지고, 그 위로 도시의 불빛이 하나씩 꺼진다.\n' +
              '레거시 상자에 "DEAD NEXUS" 스티커가 영구히 부착된다 — 게임의 제목과 같은 이름으로.',
        onEnter: { setFlags: { ending: 'dead-nexus' } }, checkpoint: true,
        choices: [ { label: '꺼져가는 불빛을 등지고 선다', goto: 'settle' } ],
      },
      // 캠페인 봉인 정산 [계승 chapter-08 §캠페인 종료 의례 · §SIGNAL의 최종 출력].
      settle: {
        id: 'settle', speaker: 'SIGNAL', portrait: 'ghost',
        text: '제로데이가 지나갔다. 도시의 시계가 다시 움직이기 시작한다 — 이제 다른 시간을 가리키며.\n' +
              STORY_CARD + '\n' +
              SIGNAL_FINAL.join('\n') + '\n' +
              REFRAIN + '\n' +
              '캠페인 일지가 마지막으로 갱신되고, 봉인된다.',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '캠페인을 봉인한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 [계승 chapter-08 §캠페인 종료 · 최종 스케일] ---------------------
  var REWARDS = {
    rep: 7,               // 최종 챕터 영구 렙 +7 (ch06 5 → 최종 최대)
    heatCapDelta: 0,      // 최종 — 공권력 트랙 최대치 변동 없음(캠페인 종료)
    karma: 3,             // 성장 소비용 karma
    nuyen: 14,            // ₵ 보상 (최종 정산)
    unlocks: [],          // 최종 — 신규 해금 없음(캠페인 봉인)
  };

  var MISSION = {
    id: 'ch08-zero-day',
    title: 'Chapter 08 — Zero Day',
    subtitle: '챕터 08 — 제로 데이 · NEXUS 코어/의장실(F6) 최종 결전, 4엔딩 분기',
    envelope: 'H',
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
    // [통합 메타데이터] 미션 레지스트리 도입 전까지 미소비 — 챕터7 종료 시 자동 해금.
    unlock: { missionsDone: ['ch07-heart-of-city'] },
    nextHint: 'CAMPAIGN COMPLETE — 캠페인 봉인. 변형 시나리오 / "After Zero Day" 확장은 별도 박스.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_CH08 = API;
})();
