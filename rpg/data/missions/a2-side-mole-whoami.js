;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-side-mole-whoami.js — ACT 2 클래스 사이드 (MOLE 전용)
  //   "WHO AM I" — 침투 요원 ECHO 가 자신이 "제품"이었음을 마주하는 개인 서사 매듭.
  //   (엔진 무편집 콘텐츠. 포맷 정본 = ch01/side-06/a2-00-framing. 순수 리터럴.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (act2_plan.md §2 클래스 사이드 S-MOLE):
  //   클래스 MOLE       [계승 data/classes.js] MOLE = ECHO(MIRA SHADE) HP7/ATK2/DEF3/SPD3/
  //                    HACK3 · tags:[VANTA,IRONWALL,AXIOM]. 개인전 밀도 = 단일 대형 전투(2연전 아님).
  //                    해금 = classKey:'MOLE' + missionsDone:['ch08-zero-day'] (campaign.js §3.2).
  //   주인공 서사        [계승 cards/ghost/mole.md · lore_module.snapshot] MOLE 스냅샷
  //                    "자신이 제품이었음을 깨닫고 사라진 침투 요원. 다섯 개의 얼굴 중 어느 것도
  //                    거짓이 아니었다." + mole.md Card09 "Which one was I? Which one am I now?"
  //                    Card06 "The old me? Dead, I think." — 정체성 붕괴 모티프 전면화.
  //                    quote:'MOLE' → loreQuote 가 ECHO 명대사 버블("I've been five different
  //                    people this week. None of them were lying." 원문).
  //   숙적 ELIA_VOSS    [신규 61차 · enemies.js] HELIX Dr. 첫 등장 — BIO 보스 hp18. ECHO 를
  //                    "양성 프로그램의 산물(제품)"로 설계·관리해온 인물(mole.md "자신이 제품임").
  //   무대(HELIX HQ)    [신규 · HELIX G6 HQ 양성 프로그램 시설] Act2 미사용 무대축.
  //   레거시 해금        [계승 mole.md §레거시] rewards.unlocks:['WHO AM I'] — mole.md ch8
  //                    "캠페인 종료 시점 본명·과거 밝히지 않고 엔딩" 카드.
  //   MFU 3출구          [계승 §4.4 · side-06 골격] 무력 / [SPD4] / [HELIX tag] 세 출구가 outro
  //                    합류. MOLE(SPD3·HELIX 미보유)은 두 지름길 모두 미충족 → 무력 폴백으로
  //                    완주(MFU 4클래스 완주 원칙 · 카탈로그 게이트 수치 그대로).
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: [HELIX tag] 게이트 — MOLE tags 는 VANTA/IRONWALL/AXIOM 뿐(classes.js), HELIX
  //   미보유 → MOLE 기본 빌드는 이 지름길 잠김(회색), 무력/[SPD4↑ 성장] 폴백 상존. Act1
  //   side-08 CHECKPOINT BRIBE 태그게이트 SIMPLIFIED 선례 준수(신규 태그축, 폴백 보장).
  // SIMPLIFIED: [SPD 4] 게이트 — MOLE 기본 SPD3 < 4 → 잠김. karma 성장으로 SPD4 도달 시 개방.
  //   미충족 시 무력 전투 폴백(단일 대형 전투는 killable 로스터 + 오브젝티브 이중승리).
  // SIMPLIFIED: MISSION.kind='act2' / unlock.classKey 는 campaign.js §3.2 확장 게이트가 소비
  //   (classKey 일치 시에만 보드 노출). 전투/대화/보상 계약에는 무영향(순수 메타).
  // ==========================================================================

  // ---- 원전 산문 앵커 (mole.md + lore MOLE 스냅샷, 정체성 서사) -------------------
  var OPENING = [
    'HELIX G6 HQ. 겉은 병원, 속은 양성 프로그램 시설. ECHO 는 이 건물을 안다 — 너무 잘 안다.', // [신규 · HELIX HQ 무대]
    '[ECHO] "이번 주에 다섯 사람으로 살았어. 그런데 그중 누구도 거짓말은 아니었지."', // [계승] lore MOLE quote 정신
    '다섯 개의 얼굴. 다섯 개의 신분. 그런데 그 밑에 원본이 있었나? ECHO 는 처음으로 그 질문을 멈추지 못한다.', // [계승] mole.md Card09 "Which one am I now?"
    '[ELIA VOSS] "돌아왔구나, 검체 E-7. 아니 — 요즘은 ECHO라고 부른다고 들었다. 이름을 참 잘 고르는구나. 우리가 그렇게 설계했으니까."', // [신규] ELIA_VOSS 숙적
    'ELIA VOSS. HELIX 박사. ECHO 를 만든 손 — 다섯 개의 얼굴을 심고, "제품"이라 부른 사람.', // [신규] 숙적 정의
    '정체성 원본 서버. 그 안에 ECHO 가 아닌 무언가의 첫 기록이 있다. 오늘 밤, ECHO 는 자신의 원본을 마주하러 왔다.', // [계승] mole.md "자신이 제품임"
  ];
  var STORY_CARD = '정체성 원본 서버가 열린다. 그 안엔 이름 없는 검체 하나의 기록 — 그리고 그 위에 덧씌운 다섯 개의 삶. ECHO 는 원본을 지우지 않는다. 대신, 그 위에 자신이 쓴 것들을 마지막 신분으로 남긴다.';
  var REFRAIN = '다섯 개의 얼굴 중 어느 것도 거짓이 아니었다.'; // [계승] lore MOLE 스냅샷

  // ---- 전투 인카운터 (HELIX HQ 양성 시설 7열 × 8행, 단일 대형 보스전) ------------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(정체성 원본 서버), row7=하단(ECHO 진입).
  //  [신규 · HELIX G6 HQ] 무대. wall=시술실 격벽 LoS 차단, cover=검체 캡슐/장비 엄폐.
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    // 오브젝티브 = 정체성 원본 서버(threshold 8, 카탈로그 §2 S-MOLE). [계승 applyHackObjective]
    //   인접 유닛 max(HACK,ATK) 자동축 → MOLE(HACK3)·타축 모두 완주(부가 승리 경로).
    objective: { x: 3, y: 0, threshold: 8, veil: 0, label: '정체성 원본 서버', dataTB: 0 },
    threatCap: 8,
    reinforcement: { key: 'SPLICE_HOUND', x: 6, y: 1 },    // 시설 경비 산물 증원(페이싱 · HELIX 로스터 정합)
    // [62차 밸런스] 측면 격벽(중앙 x=3 러시 레인 개방).
    walls: [
      { x: 1, y: 4 }, { x: 5, y: 4 },   // 시술실 격벽 — 측면 접근 통제
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1, full=DEF+2. 검체 캡슐/장비.
    //   [62차 밸런스] 진입 정면 full 엄폐 제거 — 시술병 진입 압박 노출(러시 클래스 R1 은신 대응 유도).
    cover: [
      { x: 1, y: 5, type: 'light' }, { x: 5, y: 5, type: 'light' },
      { x: 2, y: 6, type: 'light' }, { x: 4, y: 6, type: 'light' },
    ],
    // 카탈로그 §2 S-MOLE 로스터: ELIA_VOSS(보스) + HELIX_MEDIC×2 + SPLICE_HOUND.
    //   ELIA_VOSS = BIO 보스(hp18, ECHO 를 만든 박사), HELIX_MEDIC×2 = 시술병,
    //   SPLICE_HOUND = 고속 근접 야수. 전 적 killable → 전멸/오브젝티브 이중 승리(MFU).
    //   [62차 밸런스] 시술병·야수 y4~5 하향 배치(진입 압박 · 러시 은신 대응) · 보스는 서버 수호.
    enemies: [
      { key: 'ELIA_VOSS',    x: 3, y: 1 },   // ★숙적 보스 — ECHO 를 설계한 손
      { key: 'HELIX_MEDIC',  x: 2, y: 5 },
      { key: 'HELIX_MEDIC',  x: 4, y: 5 },
      { key: 'SPLICE_HOUND', x: 3, y: 4 },
    ],
  };

  // ---- 대화 그래프 (MFU §2.0 · 클래스 사이드 단일 전투 · side-06 골격) ----------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'ECHO', portrait: 'ghost',
        quote: 'MOLE',                         // loreQuote(MOLE) → ECHO 명대사 버블(어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: '양성 시설 심부, 정체성 원본 서버로 향한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — 무력 / [SPD4] / [HELIX tag] 세 출구. MOLE 기본 빌드는 두 지름길
      //  미충족 → 무력 폴백으로 완주(상단 SIMPLIFIED 참고). 셋 다 outro/outroGhost 합류.
      approach: {
        id: 'approach', speaker: 'ELIA_VOSS', portrait: 'bloc',
        text: 'HELIX 양성 시설 심부. 검체 캡슐이 벽을 따라 늘어서고, 그 끝에 원본 서버가 빛난다.\n' +
              'ELIA VOSS 가 시술병들과 스플라이스 야수를 앞세운다. "네가 지우려는 그 원본이, 사실 진짜 너란다. 나머지는 전부 우리가 입힌 옷이지."',
        choices: [
          { label: '박사를 정면으로 상대하고 원본 서버를 연다',
            effect: { startCombat: { onWin: 'outro' } },
            setFlags: { vossConfronted: true },
            desc: 'ELIA_VOSS(보스) + HELIX_MEDIC×2 + SPLICE_HOUND 와 전투 → 서버 확보 (공통 폴백, MOLE 완주 경로)',
          },
          { label: '[SPD 4] 캡슐 사이를 그림자처럼 가로질러 서버에 먼저 닿는다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { serverSlipped: true },
            effect: { skipCombat: true }, goto: 'outroGhost',
            desc: '고SPD(SILK식 회피 · MOLE 성장 SPD4↑) → 교전 없이 서버 선점(지름길). MOLE 기본 SPD3 은 잠김 → 무력 폴백',
          },
          { label: '[HELIX 태그] HELIX 연구원 신분으로 위장해 시술병을 그대로 통과한다',
            gate: { tag: 'HELIX' }, show: 'gray',
            setFlags: { helixForged: true },
            effect: { skipCombat: true }, goto: 'outroGhost',
            desc: 'HELIX 위장신분(mole.md COVER IDENTITY 확장 태그축) → 전투 스킵. MOLE 기본 태그(VANTA/IRONWALL/AXIOM) 미보유 → 잠김 → 무력 폴백',
          },
        ],
      },
      // 무력 아웃트로 — 박사를 제압하고 원본 서버에 접속.
      outro: {
        id: 'outro', speaker: 'ECHO', portrait: 'ghost',
        text: 'ELIA VOSS 가 무너진다. 원본 서버가 열린다 — 이름 없는 검체 하나의 첫 기록.\n' +
              '"제품이었다고?" ECHO 가 화면을 응시한다. "그럴지도. 하지만 그 위에 쓴 다섯 개의 삶은, 내가 골랐어."\n' + STORY_CARD,
        onEnter: { setFlags: { whoAmIDone: true, voussDefeated: true } }, checkpoint: true,
        choices: [ { label: '원본을 마주한 채 선택한다', goto: 'choice' } ],
      },
      // 잠입/위장 아웃트로 — 교전 없이 서버 선점.
      outroGhost: {
        id: 'outroGhost', speaker: 'ECHO', portrait: 'ghost',
        text: '시술병들은 아무것도 보지 못했다. 원본 서버 앞에 ECHO 만이 서 있다 — 다섯 번째 얼굴로, 조용히.\n' +
              '"박사님은 나를 만들었다고 믿겠지. 하지만 오늘은 내가 나를 지나갔어. 흔적 하나 없이."\n' + STORY_CARD,
        onEnter: { setFlags: { whoAmIDone: true, ghostedIdentity: true } }, checkpoint: true,
        choices: [ { label: '원본을 마주한 채 선택한다', goto: 'choice' } ],
      },
      // ★플레이어 선택 [계승 mole.md WHO AM I "본명·과거 밝히지 않고 엔딩"] — 정체성의 매듭.
      choice: {
        id: 'choice', speaker: 'ECHO', portrait: 'ghost',
        text: '"원본을 지울까 — 아니면 남겨둘까?"\n' +
              '지우면 검체 E-7 은 사라진다. 남기면 그 위에 쓴 다섯 개의 삶도 함께 남는다.\n' +
              '어느 쪽이든, 다음 얼굴을 고르는 건 이제 나다.',
        choices: [
          { label: 'A. 원본을 지운다 — 검체 E-7 은 없던 것으로',
            setFlags: { originChoice: 'erase', selfMade: true },
            effect: { karma: 1 }, goto: 'settle',
            desc: 'karma +1 · 과거를 소각, 자기 손으로 쓴 신분만 남긴다 (영속 flag)',
          },
          { label: 'B. 원본을 남긴다 — 다섯 개의 얼굴이 어디서 왔는지 잊지 않기 위해',
            setFlags: { originChoice: 'keep', ownsPast: true },
            effect: { rep: 2 }, goto: 'settle',
            desc: '렙 +2 · 제품이었던 기억까지 자기 것으로 끌어안는다 (영속 flag)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'ECHO', portrait: 'ghost',
        text: 'ECHO 가 시설을 빠져나간다. 다섯 개의 얼굴은 그대로, 그러나 이제 여섯 번째는 스스로 고른다.\n' +
              'WHO AM I — 본명도 과거도 밝히지 않은 채, 그 물음을 자기 손에 쥔 채로.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (클래스 사이드 — 카탈로그 §2 S-MOLE · WHO AM I 해금) ------------
  var REWARDS = {
    rep: 5,
    karma: 2,
    nuyen: 10,
    unlocks: ['WHO AM I'],                                    // mole.md ch8 레거시 카드 해금.
  };

  var MISSION = {
    id: 'a2-side-mole-whoami',
    title: 'Act 2·MOLE — Who Am I',
    subtitle: 'MOLE 전용 사이드 — 정체성 원본 (HELIX HQ · 숙적 ELIA VOSS)',
    kind: 'act2',
    unlock: { missionsDone: ['ch08-zero-day'], classKey: 'MOLE' },  // §3.2 classKey 게이트 — MOLE 로 플레이 시만 노출.
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                                           // 단일 대형 전투(2연전 아님).
    rewards: REWARDS,
    nextHint: '클래스 사이드는 selectClass 로 클래스 전환 시 순차 개방(CIPHER/BLADE/RIGGER/MOLE).',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_SIDE_MOLE_WHOAMI = API;
})();
