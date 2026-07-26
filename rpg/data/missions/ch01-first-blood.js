;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/ch01-first-blood.js — 챕터 1 "First Blood" 미션 데이터
  //   (챕터 = 데이터 파일 1개. 엔진 무편집으로 챕터 추가 가능 — docs/25 §5.1)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝/스토리 산문   [그대로] cards/legacy/chapter-01-first-blood.md 원문 고정
  //   "블록은 불사신이 아니다" 리프레인  [그대로] 원전 인용
  //   접근 대화 3출구       [계승 SR + docs/25 §4.4] 전투 / [HACK4] 우회 / [VANTA태그] 잠김
  //   영웅/유령 선택        [계승 chapter-01 §플레이어 선택] 렙+5·적대 / 현상수배0·레이드+50%
  //   챕터 효과(귀환 정산)  [계승 chapter-01 §챕터 효과] 렙+3·공권력최대+1·BACKDOOR 해금
  //   전투 인카운터         [신규 무대 · docs/25 §3.7] VANTA 서버룸 6×8, 서버랙 오브젝티브
  //   대사 버블             [계승 lore] loreQuote(CIPHER)/loreQuote(VANTA) 어댑터 경유
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ==========================================================================

  // ---- 원전 산문 앵커 (cards/legacy/chapter-01-first-blood.md, 원문 고정) --------
  var OPENING = [
    '2091년 3월 14일. 애시그리드의 공기는 평소와 같았다.',
    '메시는 웅웅거리고, 네온은 깜박이고, 블록의 광고가 건물 벽에 투사되고 있었다.',
    '그리고 누군가, 무언가가 달라졌다.',
    'VANTA 금융가 구역의 서브 서버가 해킹당했다.',
    '데이터 유출량: 2.7테라바이트. 공격자 신원: 알 수 없음. 피해액: 추산 불가.',
    '도시가 처음으로 한 가지를 깨달았다:',
    '블록은 불사신이 아니다.',
  ];
  var STORY_CARD = '그날 밤, 어떤 이름 없는 고스트가 VANTA의 방화벽을 뚫었다. 이름이 알려졌을 때는 이미 너무 늦었다.';
  var REFRAIN = '블록은 불사신이 아니다.';

  // ---- 전투 인카운터 (VANTA 서버룸 6열 × 8행) ---------------------------------
  //  좌표 {x:열 0..5, y:행 0..7}. row0=상단(서버랙), row7=하단(CIPHER 진입).
  //  wall  : 이동+LoS 완전 차단(불투명). cover : 이동 차단·LoS 투과, DEF 보정만.
  var COMBAT = {
    cols: 6, rows: 8,
    playerStart: { x: 2, y: 7 },
    objective: { x: 2, y: 0, threshold: 6, veil: 0, label: 'VANTA 서버 랙', dataTB: 2.7 },
    // [G10, 각색 raidThreshold] 위협/노출 임계 + 증원(경보 시 1회 스폰) — 전투 페이싱 실동.
    threatCap: 8,
    reinforcement: { key: 'VANTA_DRONE', x: 5, y: 1 },
    walls: [],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1, full=DEF+2
    cover: [
      { x: 1, y: 3, type: 'light' }, { x: 4, y: 3, type: 'light' },
      { x: 1, y: 5, type: 'light' }, { x: 4, y: 5, type: 'light' },
      { x: 2, y: 6, type: 'full'  }, { x: 3, y: 6, type: 'full'  },
    ],
    // 적 배치 — key 는 data/enemies.js 참조. ICE Node 는 서버랙 수호(HACK 전용 시연).
    enemies: [
      { key: 'VANTA_DRONE',    x: 0, y: 2 },
      { key: 'VANTA_DRONE',    x: 4, y: 2 },
      { key: 'VANTA_SECURITY', x: 2, y: 4 },   // ★대화 우회 시 이 조우 전체가 스킵됨
      { key: 'ICE_NODE',       x: 2, y: 1 },   // 서버랙 앞 정적 수호 (SHADE, MESH▶SHADE +1)
    ],
  };

  // ---- 대화 그래프 (docs/25 §4.2 노드 스키마) ----------------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'CIPHER', portrait: 'ghost',
        quote: 'CIPHER',                       // loreQuote(CIPHER) 버블 삽입 (어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: 'VANTA 서브 서버로 접근한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 사회/해킹 게이트가 전투를 실제로 제거 (docs/25 §1·§4.4)
      approach: {
        id: 'approach', speaker: 'VANTA', portrait: 'bloc',
        quote: 'VANTA',
        text: 'VANTA 서버룸 입구. 경비 드론과 사설 보안이 통로를 지킨다. 잠금 패널이 벽에서 희미하게 깜박인다.',
        choices: [
          { label: '무력으로 돌파한다',
            effect: { startCombat: { onWin: 'outro' } },
            desc: 'VANTA 경비와 전투 → 서버룸 진입',
          },
          { label: '[HACK 4] 문 잠금장치를 태우고 우회한다',
            gate: { attr: 'hack', min: 4 }, show: 'gray',
            setFlags: { skipGuardFight: true },
            effect: { skipCombat: true }, goto: 'outroStealth',
            desc: 'CIPHER HACK5 → 개방. 경비 조우 스킵, 서버룸 직행',
          },
          { label: '[VANTA 태그] 사원증을 위조해 통과한다',
            gate: { tag: 'VANTA' }, show: 'gray',
            setFlags: { forgedPass: true },
            effect: { skipCombat: true }, goto: 'outroStealth',
            desc: '사회/BROKER 빌드 축 (슬라이스 CIPHER 로는 잠김)',
          },
        ],
      },
      // 전투 승리 후 아웃트로 (오브젝티브 = 전투 중 서버랙 차감으로 이미 추출)
      outro: {
        id: 'outro', speaker: 'CIPHER', portrait: 'ghost',
        text: '방화벽이 무너진다. 2.7테라바이트가 어둠 속으로 흘러나간다.\n' + STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { firstBlood: true } }, checkpoint: true,
        choices: [ { label: '탈출한다', goto: 'aftermathLoud' } ],
      },
      // 해킹 우회 아웃트로 (전투 없이 잠입 추출)
      outroStealth: {
        id: 'outroStealth', speaker: 'CIPHER', portrait: 'ghost',
        text: '잠금장치가 조용히 열린다. 경비는 아무것도 보지 못했다.\n' +
              '서버 랙에 접속한다 — 2.7테라바이트. 신호 하나 남기지 않고.\n' + STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { firstBlood: true, ghostedExtraction: true } }, checkpoint: true,
        choices: [ { label: '탈출한다', goto: 'aftermathQuiet' } ],
      },
      // ── 후일담 분기 (다중 노드 심화) — 완주 방식이 다음 상태에 영속 반영 ──
      // 무력 돌파/강습 경로 → 소란한 흔적.
      aftermathLoud: {
        id: 'aftermathLoud', speaker: 'CIPHER', portrait: 'ghost',
        text: '경보가 울렸고, 바닥엔 쓰러진 경비가 남았다. VANTA는 오늘을 잊지 않을 것이다.\n' +
              '거리는 이런 밤을 "소란"이라 부른다. 그리고 소란은 이름을 만든다.',
        choices: [
          { label: '흔적을 남긴 채 빠져나간다',
            setFlags: { extractionStyle: 'loud' }, goto: 'choice',
            desc: '위협 상승 · 다음 미션 경계 강화 (영속 flag)' },
        ],
      },
      // 잠입 추출 경로 → 조용한 흔적. skipGuardFight flag 가 후속 선택지를 해금(분기 영속 시연).
      aftermathQuiet: {
        id: 'aftermathQuiet', speaker: 'CIPHER', portrait: 'ghost',
        text: '문은 열린 적도 없던 것처럼 닫혔다. 로그 어디에도 오늘 밤은 없다.\n' +
              '완벽한 침묵. 하지만 침묵도 하나의 서명이다.',
        choices: [
          { label: '신호 하나 남기지 않는다',
            setFlags: { extractionStyle: 'quiet' }, goto: 'choice',
            desc: '위협 최소 · 유령 평판 (영속 flag)' },
          { label: '[flag skipGuardFight] 백도어를 심어둔다',
            gate: { flag: 'skipGuardFight' }, show: 'gray',
            setFlags: { extractionStyle: 'quiet', plantedBackdoor: true }, goto: 'choice',
            desc: '해킹 우회로 진입한 자만 가능 — 앞선 선택이 뒤 노드를 연다(분기 영속)' },
        ],
      },
      // ★플레이어 선택 [계승 chapter-01 §플레이어 선택] — 15분 안에 "내 선택이 남는다"
      choice: {
        id: 'choice', speaker: 'CIPHER', portrait: 'ghost',
        text: '"영웅이 되겠는가, 유령이 되겠는가?"',
        choices: [
          { label: 'A. 영웅 — 정체를 공개한다',
            setFlags: { heroChoice: 'hero', allBlocsHostile: true },
            effect: { rep: 5 }, goto: 'settle',
            desc: '렙 +5 (영구), 모든 블록 적대',
          },
          { label: 'B. 유령 — 정체를 은폐한다',
            setFlags: { heroChoice: 'ghost', raidBonusFlag: true },
            effect: { wantedZero: true }, goto: 'settle',
            // [3차 발굴 F5] "레이드 보상 +50%" 미이행 약속 정정 — 실효과(wantedZero = Heat 소거)만 서술.
            desc: '현상수배 0 유지 — 공권력(Heat) 트랙 소거',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'CIPHER', portrait: 'ghost',
        text: '첫 레이드가 성공했다. 공권력 트랙 최대치가 11로 올랐다. BACKDOOR 카드가 해금된다.\n' +
              '누군가는 복수를 시작한다. 누군가는 투자를 시작한다.\n' +
              '다음 전쟁은 이사회에서 시작될 것이다. → Chapter 02: "Insider Game"',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 [계승 chapter-01 §챕터 효과] ---------------------------------
  var REWARDS = {
    rep: 3,               // 첫 레이드 영구 렙 +3
    heatCapDelta: 1,      // 공권력 트랙 최대치 +1 (→ 11)
    karma: 2,             // 성장 소비용 karma (슬라이스: 1점만 써도 전투 반영)
    nuyen: 8,             // ₵ 보상
    unlocks: ['BACKDOOR'],// CIPHER BACKDOOR 카드 해금 (봉투 A)
  };

  var MISSION = {
    id: 'ch01-first-blood',
    title: 'Chapter 01 — First Blood',
    subtitle: 'VANTA 서브 서버 침투',
    envelope: 'A',
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
    nextHint: 'Chapter 02: "Insider Game" — 최초 M&A 선언 시 해금',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_CH01 = API;
})();
