;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a3-side-rigger-relay.js — [신규 v6.54] ACT 3 클래스 사이드 (RIGGER)
  //   "RELAY" — 담보로 잡힌 중계망을, 담보가 될 수 없는 물건으로 고쳐 놓는다.
  //   (엔진 무편집 콘텐츠. 포맷 정본 = a2-side-rigger-build. 순수 리터럴.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표:
  //   [계승 lore GHOST_IDENTITY.RIGGER] PATCH(CASS WIRE) = "쓰레기더미에서 첫 드론을 조립한 손.
  //          부서진 모든 것을 더 나쁘게, 그다음 더 낫게 만들었다." + 명대사 "Give me twenty
  //          minutes and whatever's broken will be worse — then better." — 이 사이드의 해법이
  //          그 문장 그대로다: 규격품을 **고물로 만들어** 담보 목록에서 떨어뜨린다.
  //   [계승 data/classes.js] RIGGER = 설치·제어형 HP7/ATK3/DEF4/SPD2/HACK3 · 최고 DEF(4) ·
  //          "현장 정비 — 설치형 지역 장악·수비 특화". 개인전 밀도 = 단일 대형 전투.
  //          quote:'RIGGER' → loreQuote 가 PATCH 명대사 원문 버블 삽입.
  //   [계승 docs/01 §2080년대] "CARBON의 에너지 인프라가 노후화되며 정전 사고 빈발" —
  //          공업지구 중계탑이 낡아 있다는 무대 전제는 이 원전 서술의 직접 계승.
  //   [계승 docs/01 §2040년대] 인프라 매각사 → 담보 3번 항목(a3-01 "메시 중계망 전체")의 실물.
  //   [계승 a2-side-rigger-build] 전작 사이드 매듭 flag(riggerFinalBuild)를 지름길 게이트로 계승.
  //   [계승 ch06/side-03 CARBON 무대축] CARBON_DRONE 재사용 — 청산관리단이 현지 설비를 접수해
  //          그대로 굴린다는 설정(회수는 언제나 현지 자산을 쓴다). MERIDIAN_STALKER(재사용)는
  //          자산 감시 저격 — 정비 구역 외곽에서 '관리 대상'을 지킨다.
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: classKey:'RIGGER' 게이트라 실플레이는 RIGGER 뿐 → [DEF 3]이 PATCH 의 정본 해법
  //   (RIGGER def4 상시 충족). 무력 폴백(ungated startCombat) 상존 → 하네스 6클래스 완주 보장.
  // SIMPLIFIED: WARD_NODE(GRID·physImmune·hackOnly)는 제어 코어 옆 봉인 태그 — 필수 처치 대상
  //   아님(ai 'static'). 코어 인접 링 3타일 중 1타일만 점유 → **봉인 코어 아님**(물리 완주 가능).
  // SIMPLIFIED: [flag riggerFinalBuild] 는 a2-side-rigger-build outro 가 세우는 계승 flag —
  //   이 미션에서 set 하지 않으므로 검증기 info 예상. 미보유 회차에는 회색 → 전투 폴백.
  // ==========================================================================

  // ---- 원전 산문 앵커 (lore RIGGER 정체성 + docs/01 노후 인프라) ------------------
  var OPENING = [
    'CARBON 공업지구 34번 중계탑. 2081년에 이미 낡았고, 그 뒤로 아무도 고치지 않았다.', // [계승 docs/01 §2080년대] 노후 인프라
    '[PATCH] "20분만 줘. 부서진 건 뭐든 더 나빠졌다가 — 그다음 더 나아져." PATCH 가 공구 벨트를 조인다.', // [계승] lore RIGGER quote 원문
    '담보 목록 3번 항목: 메시 중계망 전체. 그 항목의 실물이 바로 이 탑이다.', // [계승] a3-01 담보 목록
    '이상한 건, 청산관리단이 이 탑을 부수지 않는다는 점이다. 오히려 정비하고 있다 — 담보물은 상태가 좋아야 하니까.', // [신규] 회수 논리
    '[PATCH] "저들이 관리하는 순간부터 이건 우리 탑이 아니야. 우리는 이걸 쓰는 게 아니라 빌려 쓰는 게 되는 거지."', // [신규] 주제
    '고물은 담보가 되지 않는다. 규격 밖 물건은 목록에 오르지 않는다. PATCH 는 그 사실을 공구로 증명하러 왔다.', // [계승] lore 정체성 → 해법
  ];
  var STORY_CARD = '중계탑 34번 정비 기록: "부품 규격 불일치 다수. 자산 등급 재산정 불가. 담보 목록에서 제외 권고." — MERIDIAN 청산관리단 감정서 (PATCH 가 만든 결과)';
  var REFRAIN = '부서진 건 뭐든 더 나빠졌다가, 그다음 더 나아진다. 목록에 오르지 않을 만큼만 나빠지면 된다.';

  // ---- 전투 인카운터 (CARBON 공업지구 34번 중계탑 6열 × 7행, 단일 대형 전투) -------
  //  좌표 {x:열 0..5, y:행 0..6}. row0=상단(중계탑 제어 코어), row6=하단(정비 통로 진입).
  //  [계승 ch06/side-03 CARBON 무대축] wall=냉각 배관 다발, cover=변압기함/부품 팔레트.
  var COMBAT = {
    cols: 6, rows: 7,
    playerStart: { x: 3, y: 6 },
    // 오브젝티브 = 중계탑 제어 코어(threshold 9 · objective-reduce). 인접 유닛 max(HACK,ATK) 자동축.
    objective: { x: 3, y: 0, threshold: 9, veil: 0, label: '중계탑 제어 코어', dataTB: 2.0 },
    threatCap: 10,
    reinforcement: { key: 'CARBON_DRONE', x: 0, y: 1 },   // 접수된 현지 설비 증원(페이싱)
    // [신규] 냉각 배관 다발 1개 — 좌측 통로 차단(우회 유도), 중앙 정비 레인 개방.
    walls: [
      { x: 1, y: 3 },
    ],
    cover: [
      { x: 2, y: 4, type: 'light' }, { x: 4, y: 4, type: 'light' },
      { x: 3, y: 5, type: 'full' }, { x: 1, y: 2, type: 'light' },
    ],
    // 로스터 — WARD_NODE(제어 코어 옆 봉인 태그 · physImmune·선택) + COLLECTOR(정비 감독 추심관 ·
    //   저속 근접, y=4 로 물림) + CARBON_DRONE(접수된 현지 설비 · 기계 → DATA SPIKE 대상) +
    //   STALKER(SHADE 감시 저격 · 정비 구역 외곽). 위협 적 전원 killable.
    //   [밸런스] 감시 저격 1기가 고DEF 클래스에도 관통 피해를 남겨 2R 무피해 러시(트리비얼)를 차단.
    enemies: [
      { key: 'WARD_NODE',          x: 3, y: 1 },
      { key: 'MERIDIAN_COLLECTOR', x: 3, y: 4 },
      { key: 'CARBON_DRONE',       x: 4, y: 2 },
      { key: 'MERIDIAN_STALKER',   x: 1, y: 2 },
    ],
  };

  // ---- 대화 그래프 (사이드 MFU: intro→approach 3출구→outro/outroGhost→choice→settle) --
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'PATCH', portrait: 'ghost',
        quote: 'RIGGER',                       // loreQuote(RIGGER) → PATCH 명대사 버블(어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: '34번 중계탑 정비 통로로 들어간다 — 20분이면 된다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 무력 / [DEF3] / [flag riggerFinalBuild] 세 출구.
      approach: {
        id: 'approach', speaker: 'PATCH', portrait: 'ghost',
        text: '중계탑 하부. 낡은 냉각 배관이 김을 뿜고, 그 너머 제어 코어가 새 부품으로 반짝인다 — 누군가 정성껏 갈아 끼웠다.\n' +
              '정비 감독을 맡은 추심관이 공정표를 확인하고, 접수된 CARBON 드론이 배선을 잇는다. 외곽에서는 감시 저격수 하나가 구역을 훑는다.\n' +
              '코어 옆엔 봉인 태그가 붙어 있다 — 관리 대상 자산 표식.\n' +
              '[COLLECTOR] "정비공이면 돌아가시오. 이 설비는 오늘부로 관리 대상 자산입니다."',
        choices: [
          { label: '정비반을 걷어내고 제어 코어를 손에 넣는다',
            effect: { startCombat: { onWin: 'outro' } },
            setFlags: { relayFought: true },
            desc: 'MERIDIAN_COLLECTOR + CARBON_DRONE + STALKER + WARD_NODE(증원 CARBON_DRONE)와 전투 → 제어 코어 확보 (공통 폴백, 6클래스 완주 가능)',
          },
          { label: '[DEF 3] 배관 파열을 몸으로 막아 서며 코어까지 밀고 들어간다',
            gate: { attr: 'def', min: 3 }, show: 'gray',
            setFlags: { relayBraced: true },
            effect: { skipCombat: true }, goto: 'outroGhost',
            desc: 'PATCH 정본 해법(RIGGER def4 · BLADE/MOLE 도 개방) → 화력·증기 무릅쓰고 코어 직행(지름길). 저DEF 클래스는 잠김 → 전투 폴백',
          },
          { label: '[flag riggerFinalBuild] 지난 제작물의 규격표를 코어 진단기에 물린다',
            gate: { flag: 'riggerFinalBuild' }, show: 'gray',
            setFlags: { relaySpoofed: true },
            effect: { skipCombat: true }, goto: 'outroGhost',
            desc: 'a2-side-rigger-build 매듭 flag 계승 → 규격 불일치 진단으로 정비반 철수(지름길). 미보유 회차에는 회색 → 전투 폴백',
          },
        ],
      },
      // 무력 아웃트로 — 정비반을 밀어내고 코어를 접수한 경로.
      outro: {
        id: 'outro', speaker: 'PATCH', portrait: 'ghost',
        text: '정비 감독이 공정표를 떨어뜨리고 물러난다. 제어 코어가 다시 도시 쪽 배선에 물린다.\n' +
              'PATCH 가 새 부품을 하나씩 뽑아내고, 그 자리에 폐기장에서 주워 온 것들을 끼운다. 탑이 한 번 크게 꺼졌다가, 다시 켜진다.\n' + STORY_CARD,
        onEnter: { setFlags: { relayDone: true, riggerRelay: true } }, checkpoint: true,
        choices: [ { label: '켜진 탑을 올려다본 채 선택한다', goto: 'choice' } ],
      },
      // 우회 아웃트로 — 교전 없이 코어를 접수한 경로.
      outroGhost: {
        id: 'outroGhost', speaker: 'PATCH', portrait: 'ghost',
        text: '진단기가 붉은 줄을 토해낸다 — 규격 불일치 열일곱 건. 정비반은 서류상 이 탑을 더 이상 관리할 수 없다.\n' +
              '"거봐. 20분도 안 걸렸잖아." PATCH 가 공구를 챙긴다. 탑은 여전히 낡았고, 여전히 도시 것이다.\n' + STORY_CARD,
        onEnter: { setFlags: { relayDone: true, relayGhosted: true, riggerRelay: true } }, checkpoint: true,
        choices: [ { label: '켜진 탑을 올려다본 채 선택한다', goto: 'choice' } ],
      },
      // ★플레이어 선택 [계승 §2.0 choice · 개인 서사 매듭] — 고친 탑을 어떻게 둘 것인가.
      choice: {
        id: 'choice', speaker: 'PATCH', portrait: 'ghost',
        text: '"이제 두 가지야. 이 탑을 거리에 열어서 아무나 쓰게 하거나 —"\n' +
              '"아니면 나머지 중계탑도 전부 이렇게 만들어서, 목록 3번 항목을 통째로 못 쓰게 만들거나."',
        choices: [
          { label: 'A. 탑을 거리에 개방한다 — 낡아도 우리 것이면 쓰면 된다',
            setFlags: { relayChoice: 'open', relayShared: true },
            effect: { rep: 3 }, goto: 'settle',
            desc: '렙 +3 · 중계 대역을 거리에 개방. 담보물이지만, 쓰는 건 도시다 (영속 flag)',
          },
          { label: 'B. 중계망 전체를 규격 밖으로 만든다 — 목록에서 떨어뜨린다',
            setFlags: { relayChoice: 'derate', relayDerated: true },
            effect: { karma: 2 }, goto: 'settle',
            desc: 'karma +2 · 담보 3번 항목의 자산 등급 붕괴. 도시는 느려지고, 팔리지 않는다 (영속 flag)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'PATCH', portrait: 'ghost',
        text: 'RELAY — 34번 중계탑은 다시 낡았다. 그리고 낡은 물건은 감정서에 오르지 않는다.\n' +
              '[PATCH] "제일 좋은 방어는 갖고 싶지 않게 만드는 거야. 그건 내가 제일 잘하는 일이고."\n' + REFRAIN,
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
    unlocks: [],   // 개인 서사 매듭 — flag riggerRelay 표식(산문). 클래스 시그니처는 ch01 해금.
  };

  var MISSION = {
    id: 'a3-side-rigger-relay',
    title: 'Act 3·RIGGER — Relay',
    subtitle: 'RIGGER 전용 사이드 — 34번 중계탑 (CARBON 공업지구 · 담보 3번 항목의 실물)',
    kind: 'act3',
    unlock: { missionsDone: ['a3-00-framing'], classKey: 'RIGGER' },
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                                   // 단일 대형 전투(연전 아님).
    rewards: REWARDS,
    nextHint: '클래스 사이드는 각 클래스 개인 서사 매듭 — 편성(크루/로스터) 전환 시 순차 개방.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A3_SIDE_RIGGER_RELAY = API;
})();
