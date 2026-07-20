;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-side-cipher-static.js — ACT 2 클래스 사이드 (CIPHER)
  //   "STATIC" — VANTA HQ 심층 아카이브: 삭제된 신원 원본 회수 (단일 대형 보스전)
  //   (엔진 무편집 콘텐츠. 포맷 정본 = a2-00-framing / ch01-first-blood. 순수 리터럴.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (act2_plan.md §2 클래스 사이드 · 62차-W1):
  //   클래스 게이트       [계승 §2] classKey:'CIPHER' + missionsDone:['ch08-zero-day'] — CIPHER 로
  //                     플레이 시에만 노출(레지스트리 통합 담당). selectClass 전환 시 순차 개방.
  //   대표 인물 STATIC    [계승] lore_module.snapshot LORE_GHOSTS.CIPHER = STATIC(LENA GREY) ·
  //                     명대사 원문 "The Veil doesn't hide you. It just tells me where to look."
  //                     GHOST_IDENTITY.CIPHER "VANTA가 지운 이름이 거리의 전설로 되살아났다" —
  //                     이 사이드가 그 "지워진 이름"의 원본을 회수하는 개인 서사 매듭.
  //   숙적 VERA_ASHTON    [계승] data/enemies.js VERA_ASHTON(VANTA DIRECTOR · MESH 해커 보스, 스탯
  //                     존재하나 발화자 미사용) 첫 발화 등장. quote:'VANTA' = DIRECTOR 명대사 버블.
  //   무대(심층 아카이브)  [신규 · VANTA HQ 심층] 삭제된 신원 원본이 잠든 원장. Act2 미사용 무대축.
  //   단일 대형 전투      [계승 §2 사이드] 2연전 아님 — 개인전 밀도. 단일 인카운터 보스+호위+ICE.
  //                     intro→approach(3출구)→outro→choice→settle (사이드 MFU).
  //   보상 해금          [계승 §2] NEXUS BREAK(cipher.md ch8 "게임 최종 순간 모든 베일·방어 무효화").
  //   대사 버블          [계승 lore] loreQuote(CIPHER)=STATIC / loreQuote(VANTA)=VERA ASHTON, 원문.
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: approach [HACK 5] · [SHADE 태그] 게이트는 "지름길" — 무력 폴백(ungated startCombat)
  //   상존 → 4클래스 전원 완주 보장(MFU). 단 본 사이드는 classKey:'CIPHER' 게이트라 실플레이는
  //   CIPHER 뿐 → [HACK 5]가 STATIC 의 정본 해법(CIPHER hack5 상시 충족).
  // SIMPLIFIED: [SHADE 태그] 는 data/classes.js 어느 playable(CIPHER/BLADE/RIGGER/MOLE) tags 에도
  //   없음(태그 게이트는 MOLE 의 VANTA/IRONWALL/AXIOM 만) → 상시 회색 = 빌드축 플레이버 지름길.
  //   ch01 [VANTA태그]·side-08 SIMPLIFIED 선례 준수(폴백 전투 상존으로 무해). 검증기 tag 문자열 통과.
  // ==========================================================================

  // ---- 원전 산문 앵커 (lore GHOST_IDENTITY.CIPHER · STATIC 개인 서사) --------------
  var OPENING = [
    'VANTA는 사람을 죽이지 않는다. 이름을 지운다. 그게 더 깨끗하니까.', // [계승] VANTA "We don\'t watch. We remember."
    'LENA GREY. 27년 전 VANTA가 원장에서 삭제한 이름. 그 이름은 죽지 않고 거리로 흘러 — STATIC이 됐다.', // [계승] GHOST_IDENTITY.CIPHER
    '[STATIC] "베일은 사람을 숨기지 못해. 어디를 봐야 하는지 알려줄 뿐이지." 나는 언제나 남을 찾았다. 오늘은 나를 찾는다.', // [계승] STATIC 명대사
    '제로데이가 VANTA HQ 심층 아카이브의 봉인을 흔들었다. 삭제된 신원 원본이, 처음으로 손 닿는 곳에 있다.', // [신규] 제로데이 후 아카이브 개방
    '그리고 그 원장 앞에는 VERA ASHTON이 서 있다. 내 이름을 지운 손. VANTA의 DIRECTOR.', // [계승] 숙적 VERA_ASHTON 첫 등장
    '이건 청부가 아니다. 이건 내가 누구였는지를 되찾는 밤이다.', // [계승] 개인 서사 매듭
  ];
  var STORY_CARD = 'VERA ASHTON이 물러난다. 신원 원본이 STATIC의 손에 남는다 — LENA GREY라는 이름. 거리는 이름을 지워도, 원본은 되살아난다.';
  var REFRAIN = 'VANTA가 지운 이름이, 거리의 전설로 되살아났다.';

  // ---- 전투 인카운터 (VANTA HQ 심층 아카이브 7열 × 8행 · 단일 대형 보스전) ---------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(신원 원장 코어), row7=하단(STATIC 진입).
  //  [신규] 심층 아카이브 무대. wall=봉인 격벽, cover=원장 스택/서버 기둥. veil 1 = 아카이브 은폐층.
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    // 오브젝티브 = 신원 원장 코어(threshold 누적 차감). th10 veil1 (§2 사이드 · Act2 veil 사용).
    //   인접 유닛 max(HACK,ATK) 자동축 → CIPHER 는 HACK 축으로 코어 완주(정체성 = 해킹 회수).
    objective: { x: 3, y: 0, threshold: 10, veil: 1, label: '신원 원장 코어', dataTB: 2.7 },
    threatCap: 9,
    // [신규] 봉인 격벽 2개 — 좌우 통로 부분 차단(중앙 코어 접근 레인 개방).
    walls: [
      { x: 1, y: 4 }, { x: 5, y: 4 },
    ],
    cover: [
      { x: 2, y: 5, type: 'light' }, { x: 4, y: 5, type: 'light' }, { x: 3, y: 6, type: 'full' },
      { x: 2, y: 3, type: 'light' }, { x: 4, y: 3, type: 'light' },
    ],
    // 적 배치 — VERA_ASHTON(MESH 해커 보스, 중앙) + MESH_WISP×2(고속 MESH 원거리 호위) +
    //   SIGNAL_ICE(SHADE physImmune·hackOnly = 코어 앞 정적 방벽, HACK 전용 시연 · CIPHER 축).
    //   보스 killable · 코어 차감으로도 승리(MFU 이중 경로).
    enemies: [
      { key: 'SIGNAL_ICE',  x: 3, y: 1 },   // 코어 앞 정적 방벽 (물리무효 · HACK 전용)
      { key: 'VERA_ASHTON', x: 3, y: 2 },   // 숙적 보스
      { key: 'MESH_WISP',   x: 1, y: 2 },
      { key: 'MESH_WISP',   x: 5, y: 2 },
    ],
  };

  // ---- 대화 그래프 (사이드 MFU: intro→approach 3출구→outro→choice→settle) ----------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'STATIC', portrait: 'ghost',
        quote: 'CIPHER',                       // loreQuote(CIPHER)=STATIC(LENA GREY) 명대사 버블
        text: OPENING.join('\n'),
        choices: [
          { label: 'VANTA HQ 심층 아카이브로 내려간다 — 내 이름을 되찾는다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 무력 폴백 / [HACK5] 정본 해법 / [SHADE] 빌드축 지름길, 모두 outro 합류.
      approach: {
        id: 'approach', speaker: 'VERA_ASHTON', portrait: 'bloc',
        quote: 'VANTA',                        // loreQuote(VANTA)=VERA ASHTON DIRECTOR 명대사 버블
        text: '심층 아카이브. 신원 원장 코어가 은폐 베일 뒤에서 붉게 뛴다. 앞에는 VERA ASHTON, 그리고 메시 정령 둘.\n' +
              '"비밀은 없어, STATIC. 아직 값이 치러지지 않은 가격이 있을 뿐이지." 그녀가 코어에 손을 얹는다. "이 이름의 값을, 오늘 치르게 될 거야."',
        choices: [
          { label: 'VERA ASHTON을 정면으로 상대한다',
            effect: { startCombat: { onWin: 'outro' } },
            setFlags: { staticFought: true },
            desc: 'VERA_ASHTON + MESH_WISP×2 + SIGNAL_ICE(HACK 전용 방벽)와 전투 → 신원 원본 회수 (공통 폴백, 4클래스 완주 가능)',
          },
          { label: '[HACK 5] 베일을 판독해 원장 코어를 직접 뽑아낸다',
            gate: { attr: 'hack', min: 5 }, show: 'gray',
            setFlags: { staticHacked: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'STATIC 정본 해법(CIPHER HACK5) → SIGNAL_ICE·베일 우회, 코어 즉시 추출(지름길). 저HACK 클래스는 잠김 → 전투 폴백',
          },
          { label: '[SHADE 태그] 그림자 프로토콜로 아카이브 로그에서 지워진 채 접근한다',
            gate: { tag: 'SHADE' }, show: 'gray',
            setFlags: { staticShaded: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'SHADE 은폐축 빌드 지름길 → 로그 미기록 접근(SIMPLIFIED: 현 playable 로스터 미보유=상시 회색, 폴백 전투 상존)',
          },
        ],
      },
      // 세 출구 공통 아웃트로 — 어느 경로든 결과는 같다(신원 원본 회수).
      outro: {
        id: 'outro', speaker: 'STATIC', portrait: 'ghost',
        text: '원장 코어가 열린다. 삭제된 줄 알았던 이름이 화면에 떠오른다 — LENA GREY.\n' +
              '"찾았어." 27년 만에, 나는 내가 누구였는지를 손에 쥔다. VERA ASHTON의 그림자가 아카이브에서 물러난다.\n' + STORY_CARD,
        onEnter: { setFlags: { staticIdentityRecovered: true } }, checkpoint: true,
        choices: [ { label: '신원 원본을 손에 쥔다', goto: 'choice' } ],
      },
      // ★플레이어 선택 [계승 §2.0 choice · 개인 서사 매듭] — 되찾은 이름을 어떻게 할 것인가.
      choice: {
        id: 'choice', speaker: 'STATIC', portrait: 'ghost',
        text: '"LENA GREY로 돌아갈 수도 있어. 아니면 STATIC으로 남을 수도 있고. 어느 쪽이 진짜지?"',
        choices: [
          { label: 'A. 원본을 봉인한다 — STATIC으로 남는다',
            setFlags: { staticChoice: 'ghost', staticStaysGhost: true }, goto: 'settle',
            desc: '거리의 전설 유지 · 과거를 도구로 (영속 flag)',
          },
          { label: 'B. 이름을 되살린다 — LENA GREY를 세상에 되돌린다',
            setFlags: { staticChoice: 'reclaim', staticReclaimsName: true }, goto: 'settle',
            desc: '지워진 신원 복원 · VANTA 원장에 균열 (영속 flag)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'STATIC', portrait: 'ghost',
        text: 'VANTA는 이름을 지웠지만, 원본은 남았다. 그리고 나는 그것을 되찾았다.\n' +
              'NEXUS BREAK 프로토콜이 손끝에 잡힌다 — 최종 순간, 모든 베일과 방어를 무효화하는 마지막 열쇠.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (act2_plan.md §2 S-CIPHER: rep5 karma2 ₵10 · NEXUS BREAK 해금) -----
  var REWARDS = {
    rep: 5,
    karma: 2,
    nuyen: 10,
    unlocks: ['NEXUS BREAK'],   // cipher.md ch8 — 게임 최종 순간 모든 베일·방어 무효화
  };

  var MISSION = {
    id: 'a2-side-cipher-static',
    title: 'STATIC — The Erased Name',
    subtitle: 'ACT 2 CIPHER 사이드 — VANTA HQ 심층 아카이브 (숙적 VERA ASHTON)',
    kind: 'act2',
    unlock: { missionsDone: ['ch08-zero-day'], classKey: 'CIPHER' },
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                                           // 단일 대형 보스전 (2연전 아님)
    rewards: REWARDS,
    nextHint: '클래스 사이드는 각 클래스 개인 서사 매듭 — selectClass 전환 시 순차 개방.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_SIDE_CIPHER_STATIC = API;
})();
