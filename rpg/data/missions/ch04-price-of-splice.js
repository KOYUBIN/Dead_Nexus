;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/ch04-price-of-splice.js — 챕터 4 "Price of Splice" 미션 데이터
  //   (챕터 = 데이터 파일 1개. 엔진 무편집으로 챕터 추가 — docs/25 §5.1)
  //   포맷 정본 = ch01-first-blood.js (IIFE·window 등록·순수 리터럴·계보 주석).
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문           [계승/각색] cards/legacy/chapter-04-price-of-splice.md §오프닝
  //                          발췌 — 원문 구조·문장 유지, 무대만 B8→B6 [각색] (전제 정렬)
  //   "몸이 무기가 되면, 몸도 적이 된다" 리프레인  [그대로] chapter-04 §오프닝 원문 고정
  //   스토리 카드           [그대로] chapter-04 §6 "칩이 생각한다. 철이 꿈을 꾼다…" 원문
  //   의뢰 훅 (Q-D2)        [계승] chapter-04 §4 "Q-D2: 불법 시술소 습격" — B6 파괴+구조
  //   의뢰인 HELIX/DR.VOSS  [계승] chapter-04 §3 "VOSS 박사의 경고" + docs/07 §2 HELIX
  //   폭주체(사이버사이코시스 3호)  [계승] chapter-04 §오프닝 + docs/01 §스플라이스·사이버사이코시스
  //   접근 대화 3출구       [계승 ch01 §접근 + docs/25 §4.4] 전투 / [HACK4] 진정 / [HP16] 관통
  //                          — 두 게이트가 각각 다른 클래스를 위한 지름길(MFU 균형)
  //   개조/저항 선택        [계승 chapter-04 §Ghost 플레이어 선택] A.개조 splice / B.저항 PURIST
  //                          — 챕터 8 엔딩축 해금, 영속 flag ("내 선택이 남는다")
  //   전투 무대             [계승 docs/10 §6 다운타운 슬럼 의료(B6) + docs/07 §2 HELIX 8/3/3/2/3]
  //                          B6 슬럼 불법 시술소 6×7, 시술 코어 파괴 오브젝티브
  //   적 상성               [계승 docs/06 §6 · attributes.js BEATS] SPLICE_HOUND=ASH →
  //                          BLADE(IRON)▶ASH 상성+1 체감. 기계 아님 → 양 클래스 처치 가능
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  //
  // [통합 노트] 메인 해금 = missionsDone 에 'ch03-martial-night' 포함(직전 챕터 클리어).
  //   현 store.js 는 단일 하드코딩 → 미션 레지스트리 필요. 아래 unlock 필드는
  //   레지스트리 도입 전까지 소비되지 않는 메타데이터(엔진 무편집).
  // [SIMPLIFIED] 챕터 4 스플라이스 강화 카드(NEURAL LACE 등)는 신규 ABILITIES 정의가
  //   필요 → 미션 파일 범위 밖. 보상 unlocks 는 빈 배열로 미채택. 개조 선택은
  //   전투력 상승을 spliceEquipped 영속 flag 로만 표기(후속 시스템 소비 메타데이터).
  // ==========================================================================

  // ---- 원전 산문 앵커 (cards/legacy/chapter-04-price-of-splice.md) ------------
  // [계승/각색] §오프닝 발췌 — 원문 순서·핵심 문장 유지. 무대 B8→B6 만 [각색]
  //   (전제 = 다운타운 슬럼 의료 B6, docs/10 §6). 마지막 줄 리프레인은 [그대로].
  var OPENING = [
    '2091년 9월 8일. HELIX 사내 광고가 도시의 벽을 덮는다.',
    '"당신의 한계는 이제 선택입니다."',
    '같은 날 새벽, B6 슬럼의 불법 시술소에서 시술받던 여성 하나가 수술대에서 일어났다.',
    '그녀는 벽을 뜯어내고 걸어나갔다. 그녀의 눈은 자신의 눈이 아니었다. 몸도 자신의 몸이 아니었다.',
    '언론은 이것을 "스플라이스 오작동 사례 3호"라 불렀다.',
    '도시가 네 번째로 알게 된 사실:',
    '몸이 무기가 되면, 몸도 적이 된다.',
  ];
  // [그대로] chapter-04 §6 스토리 카드 원문.
  var STORY_CARD = '칩이 생각한다. 철이 꿈을 꾼다. 문제는 둘 다 내 것이 아니라는 점이다.';
  // [그대로] chapter-04 §오프닝 리프레인.
  var REFRAIN = '몸이 무기가 되면, 몸도 적이 된다.';

  // ---- 전투 인카운터 (B6 슬럼 불법 시술소 6열 × 7행) --------------------------
  //  좌표 {x:열 0..5, y:행 0..6}. row0=상단(시술 코어), row6=하단(고스트 진입).
  //  [계승 docs/10 §6 다운타운 슬럼 의료(B6)] 무대. [계승 docs/07 §2 HELIX 8/3/3/2/3] 적 축.
  //  wall  : 이동+LoS 완전 차단. cover : 이동 차단·LoS 투과, DEF 보정만.
  var COMBAT = {
    cols: 6, rows: 7,
    playerStart: { x: 3, y: 6 },
    // 오브젝티브 = 시술 코어 파괴(threshold 누적 차감 = objective-reduce).
    //  effective threshold = 10 + veil 2 = 12 (buildCombat 이 veil 를 가산).
    //  dataTB 0 = 추출이 아닌 파괴(로그 표기용, 유출량 없음).
    //  [계승 store applyHackObjective] CIPHER=HACK5 해킹 / BLADE=ATK5 강습 → 양 축 완주.
    objective: { x: 2, y: 0, threshold: 10, veil: 2, label: 'HELIX 시술 코어', dataTB: 0 },
    // [계승 ch01 · 각색 raidThreshold] 위협 임계 + 증원(폭주 시 1회 스폰) — 페이싱 실동.
    threatCap: 8,
    reinforcement: { key: 'SPLICE_HOUND', x: 5, y: 5 },   // 폭주 증원 (코어가 계속 찍어냄)
    walls: [],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1, full=DEF+2. full=수술대(2·3열 5행).
    cover: [
      { x: 1, y: 3, type: 'light' }, { x: 4, y: 4, type: 'light' },
      { x: 2, y: 5, type: 'full'  }, { x: 3, y: 5, type: 'full'  },
    ],
    // 적 배치 — key 는 data/enemies.js 참조(로스터 통합 단계에서 SPLICE_HOUND/HELIX_MEDIC 추가).
    //  SPLICE_HOUND = ASH 근접(BLADE IRON▶ASH 상성+1 체감, 기계 아님 → 양 클래스 처치 가능).
    //  ICE_NODE = 코어 수호(정적·물리무효·HACK만 파괴, 선택/CIPHER 전용 — atk0 이라 BLADE 우회 가능).
    enemies: [
      { key: 'SPLICE_HOUND', x: 1, y: 4 },   // 좌익 폭주체 (ASH 근접)
      { key: 'SPLICE_HOUND', x: 4, y: 3 },   // 우익 폭주체 (ASH 근접)
      { key: 'HELIX_MEDIC',  x: 2, y: 3 },   // 중앙 시술 의무관 (BIO·저지)
      { key: 'ICE_NODE',     x: 2, y: 1 },   // 코어 앞 정적 수호 (HACK만 파괴, 선택/CIPHER 전용)
    ],
  };

  // ---- 대화 그래프 (docs/25 §4.2 노드 스키마) ----------------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'CIPHER', portrait: 'ghost',
        quote: 'CIPHER',                       // loreQuote(CIPHER) 버블 (어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: 'B6 슬럼 시술소로 진입한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 두 게이트가 각각 다른 클래스의 지름길 (docs/25 §1·§4.4).
      //  [계승 chapter-04 Q-D2] HELIX(DR. VOSS 대리) 의뢰: 코어를 멈춰 폭주를 끝내라.
      approach: {
        id: 'approach', speaker: 'HELIX', portrait: 'bloc',
        quote: 'HELIX',
        text: 'B6 슬럼, 불법 시술소 입구. 안에서 폭주체 — 사이버사이코시스 3호 — 가 쏟아진다. ' +
              'HELIX 시술 코어가 수술대 위에서 새 폭주체를 계속 찍어낸다. ' +
              'DR. VOSS의 대리인이 통신으로 지시한다 — "코어를 멈춰라. 방법은 묻지 않겠다."',
        choices: [
          { label: '폭주체를 뚫고 코어까지 밀어붙인다',
            effect: { startCombat: { onWin: 'outro' } },
            desc: '스플라이스 하운드·의무관과 전투 → 코어 파괴 (양 클래스 완주 · HACK/ATK 강습 자동축)',
          },
          { label: '[HACK 4] 시술 제어 서버를 태워 폭주를 진정시킨다',
            gate: { attr: 'hack', min: 4 }, show: 'gray',
            setFlags: { coreServerBurned: true },
            effect: { skipCombat: true }, goto: 'outroCalm',
            desc: 'CIPHER HACK5 통과 → 전투 스킵·코어 진정. BLADE HACK1 잠김 → 전투로 완주',
          },
          { label: '[HP 16] 약물 부하를 버티며 정면으로 코어를 관통한다',
            gate: { attr: 'hp', min: 16 }, show: 'gray',
            setFlags: { splicePush: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'BLADE 유효HP20 통과 → 전투 스킵·코어 관통. CIPHER 유효HP12 잠김 → 전투/해킹으로 완주',
          },
        ],
      },
      // 파괴 아웃트로 — 전투 강행(①) 과 HP 관통(③) 이 공유. 코어가 터지고 폭주가 끝난다.
      //  (전투 경로는 오브젝티브 차감으로 코어를 이미 파괴한 뒤 진입.)
      outro: {
        id: 'outro', speaker: 'CIPHER', portrait: 'ghost',
        text: '시술 코어가 터진다. 새 폭주체는 더 이상 찍혀 나오지 않는다.\n' +
              '하지만 수술대 위의 여성은 코어와 함께 멈췄다. 몸이 무기가 된 순간, 몸도 적이 되었으므로.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { coreShattered: true } }, checkpoint: true,
        choices: [ { label: '잔해를 뒤로하고 빠져나간다', goto: 'aftermathShatter' } ],
      },
      // 진정 아웃트로 — HACK 게이트(②) 전용. 코어를 태워 폭주를 잠재우고 환자를 살린다.
      //  [계승 chapter-04 Q-D2 "NPC 구조"] 파괴 대신 진정 → 여성 생존.
      outroCalm: {
        id: 'outroCalm', speaker: 'CIPHER', portrait: 'ghost',
        text: '제어 서버가 불탄다. 코어는 폭주체를 찍어내던 리듬을 잃고 잦아든다.\n' +
              '수술대 위의 여성이 숨을 되찾는다 — 폭주가 멈췄다. 몸은 아직 그녀의 것이다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { psychosisContained: true, patientSaved: true } }, checkpoint: true,
        choices: [ { label: '살아난 여성을 데리고 빠져나간다', goto: 'aftermathContain' } ],
      },
      // ── 후일담 분기 (완주 방식이 다음 상태에 영속 반영) ──
      // 파괴 경로 → 폭주는 끝났으나 환자를 잃는다. HELIX 는 깨끗한 코어 데이터를 회수.
      //  splicePush flag 가 후속 선택지를 해금(정면 관통한 자만 = 분기 영속).
      aftermathShatter: {
        id: 'aftermathShatter', speaker: 'CIPHER', portrait: 'ghost',
        text: '코어 잔해에서 아직 열이 오른다. HELIX 회수팀이 데이터를 긁어간다.\n' +
              '폭주는 끝났다. 대가는 수술대 위에 남았다.',
        choices: [
          { label: '잔해를 남긴 채 빠져나간다',
            setFlags: { spliceOutcome: 'shatter' }, goto: 'choice',
            desc: '폭주 종식 · 환자 상실 (영속 flag)' },
          { label: '[flag splicePush] 몸이 흡수한 약물 부하에서 스플라이스 조각을 긁어낸다',
            gate: { flag: 'splicePush' }, show: 'gray',
            setFlags: { spliceOutcome: 'shatter', spliceShard: true }, goto: 'choice',
            desc: '정면 관통한 자만 가능 — 약물 부하가 남긴 스플라이스 조각 회수(분기 영속)' },
        ],
      },
      // 진정 경로 → 폭주 억제 + 환자 구조. 단 HELIX 는 코어 데이터를 얻지 못한다.
      aftermathContain: {
        id: 'aftermathContain', speaker: 'CIPHER', portrait: 'ghost',
        text: '여성은 걷는다. 자기 다리로. 코어는 재가 됐고, HELIX 회수팀은 빈손이다.\n' +
              '누군가는 이것을 실패라 부를 것이다. 그녀는 그렇게 부르지 않을 것이다.',
        choices: [
          { label: '그녀를 슬럼 밖으로 데려간다',
            setFlags: { spliceOutcome: 'contain' }, goto: 'choice',
            desc: '폭주 억제 · 환자 구조 · HELIX 데이터 상실 (영속 flag)' },
        ],
      },
      // ★플레이어 선택 [계승 chapter-04 §Ghost 플레이어 선택] — "내 선택이 남는다".
      //  A/B 는 캐릭터 카드에 영속 반영(splice 축 vs PURIST 축, 챕터 8 엔딩 조건 해금).
      choice: {
        id: 'choice', speaker: 'CIPHER', portrait: 'ghost',
        text: '"몸을 버릴 것인가, 몸을 지킬 것인가?"',
        choices: [
          { label: 'A. 개조 — 스플라이스를 즉시 장착한다',
            setFlags: { spliceChoice: 'graft', spliceEquipped: true },
            goto: 'settle',
            desc: '전투력 상승(영속 splice flag) · 사이버사이코시스 부담 누적',
          },
          { label: 'B. 저항 — 몸을 지킨다',
            setFlags: { spliceChoice: 'purist', puristFlag: true, ch8EndingUnlocked: true },
            goto: 'settle',
            desc: 'PURIST 낙인(영속) · 사이코시스 면역 · 챕터 8 추가 엔딩축 해금',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'CIPHER', portrait: 'ghost',
        text: '스플라이스가 지하에서 대중 시장으로 넘어왔다. 사이버사이코시스가 도시의 상수가 된다.\n' +
              '네 몸에도, 도시의 몸에도 대가가 쌓이기 시작한다.\n' +
              '다음 마음은 몸을 버리고 메시 속에서 다시 깨어날 것이다. → Chapter 05: "Mesh Ghost"',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 [계승 chapter-04 §챕터 효과 · ch01 스케일 유지] ----------------
  var REWARDS = {
    rep: 4,               // 챕터 클리어 영구 렙 +4 (Q-D2 위험 반영, ch02 3 → 4)
    heatCapDelta: 0,      // 공권력 트랙 최대치 변동 없음 (이번 챕터는 의료구역 내부 사건)
    karma: 3,             // 성장 소비용 karma (스플라이스 개조 축 반영)
    nuyen: 10,            // ₵ 보상 (HELIX 의뢰, ch02 9 → 10)
    unlocks: [],          // [SIMPLIFIED] 스플라이스 강화 카드는 신규 ABILITIES 필요 → 미채택
  };

  var MISSION = {
    id: 'ch04-price-of-splice',
    title: 'Chapter 04 — Price of Splice',
    subtitle: '챕터 04 — 스플라이스의 대가 · B6 슬럼 시술소 습격, 시술 코어 파괴',
    envelope: 'D',
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
    // [통합 메타데이터] 미션 레지스트리 도입 전까지 미소비 — 직전 챕터 클리어 요구.
    unlock: { missionsDone: ['ch03-martial-night'] },
    nextHint: 'Chapter 05: "Mesh Ghost" — CIPHER TL5 또는 메시 침입 성공 시 해금',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_CH04 = API;
})();
