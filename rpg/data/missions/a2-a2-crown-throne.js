;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-a2-crown-throne.js — ACT 2 브랜치 A "IRON CROWN" A2
  //   "CROWN THRONE" — 블록 국가 조세·데이터 볼트 결전 (2연전 · MERIDIAN 보스전)
  //   (엔진 무편집 콘텐츠. 포맷 정본 = a2-00-framing / ch01-first-blood. 순수 리터럴.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (act2_plan.md §2 브랜치 A · §2.0 MFU 2연전 · 62차-W1):
  //   갈래 게이트        [계승 §2] endingSeen:['corporate-eternal'] + A1 선행(레지스트리 통합 담당).
  //                     원전 chapter-08 §엔딩1 "CORPORATE ETERNAL" 갈래의 2번째·종결 미션.
  //   엔딩 후일담 톤      [계승] chapter-08 §엔딩1 정합 — 단일 체제가 국가를 흡수한 도시. 그 국부
  //                     원장(조세·데이터)을 MERIDIAN 전쟁군주가 강탈하려 한다(§2 브랜치 A).
  //   신규 세력 MERIDIAN  [신규 61차] data/enemies.js MERIDIAN_* 계보 주석 참조. enc② 보스 =
  //                     MERIDIAN_WARLORD(ASH 전쟁군주 · Act2 외부 위협 보스). 창작분 [신규] 태그.
  //   의뢰인 AIDE        [계승 §2] A1 과 동일 이탈 임원(VANTA 계열) → quote:'VANTA' DIRECTOR 버블.
  //   무대(조세·데이터 볼트) [신규 · Ring1 넥서스 부속] 블록 국가 국부 원장 볼트. Act2 미사용 무대축.
  //   MFU 2연전          [계승 §2.0] intro→approach(2출구)→enc①→interlude(서사+2게이트)→enc②(보스)
  //                     →outro→choice→settle. enc①=MISSION.combat / enc②=MISSION.encounters.stage2.
  //   HP 풀회복          [계승 §3.1] buildCombat 인카운터마다 리필 — 보스전 진입 전 숨 고르기.
  //   대사 버블          [계승 lore] loreQuote(VANTA)=VERA ASHTON DIRECTOR / snapshot 원문 그대로.
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: enc① approach [DEF 3] · enc② interlude [SPD 4]/[VANTA tag] 게이트는 전부
  //   "지름길" — 각 인카운터에 무력 폴백(ungated startCombat) 상존 → 4클래스 전원 완주 보장(MFU).
  //   [DEF3]=BLADE/RIGGER/MOLE / [SPD4]=CIPHER / [VANTA tag]=MOLE(위장 신분) 지름길, 나머지는 폴백 전투.
  // SIMPLIFIED: [VANTA 태그] 는 data/classes.js MOLE.tags=[VANTA,IRONWALL,AXIOM] 만 보유 →
  //   MESH/VANTA 잠입 지름길. 그 외 클래스는 회색(폴백 전투 상존, ch01 [VANTA태그] 선례 준수).
  // ==========================================================================

  // ---- 원전 산문 앵커 (chapter-08 §엔딩1 정합 · Act2 브랜치 A 종결전) --------------
  var OPENING = [
    '상층은 지켰다. 그러나 왕관의 진짜 무게는 금고에 있다 — 도시를 삼킨 체제의 국부 원장.', // [계승] 왕관=체제
    '[AIDE] "조세와 데이터가 한 원장으로 흐르는 볼트야. 도시의 피가 도는 심장." AIDE가 설계도를 펼친다.', // [계승] 이탈 임원
    '"MERIDIAN이 서명으로 안 됐으니 이번엔 힘으로 가져가려 해. 저들이 전쟁군주를 보냈어 — WARLORD."', // [신규] MERIDIAN 무력 강탈
    'MERIDIAN WARLORD. 성벽 너머에서 온 것들 중 가장 큰 것. 협상이 끝난 자리에 남는 건 언제나 이것이다.', // [신규] 보스
    '"볼트 격벽을 뚫고, 원장 코어에 닿아야 해. 저 전쟁군주가 코어를 뜯어가기 전에."', // [신규] 2연전 오브젝티브
    '단일 체제의 금고. 도시를 삼킨 손이, 더 큰 손 앞에서 처음으로 떨린다.', // [계승] 후일담 톤
  ];
  var STORY_CARD = 'MERIDIAN 전쟁군주가 쓰러진다. 국부 원장은 도시에 남는다 — 그러나 원장이 기록한 숫자들은, 이 도시가 애초에 누구의 소유였는지를 말한다.';
  var REFRAIN = '왕관은 지켜졌다. 문제는, 그 왕관이 여전히 한 사람의 것이라는 데 있다.';

  // ---- enc① 인카운터 (조세·데이터 볼트 격벽 7열 × 8행) ---------------------------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(볼트 격벽), row7=하단(진입).
  //  [신규] 조세·데이터 볼트 무대. wall=격벽, cover=서버 캐비닛/기둥 엄폐.
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    // 오브젝티브 = 볼트 격벽(threshold 누적 차감). enc① 밴드 10(§5 이중 오브젝티브 8~10) · veil 0.
    objective: { x: 3, y: 0, threshold: 10, veil: 0, label: '볼트 격벽', dataTB: 1.6 },
    threatCap: 9,
    walls: [
      { x: 1, y: 4 }, { x: 5, y: 4 },
    ],
    cover: [
      { x: 2, y: 5, type: 'light' }, { x: 4, y: 5, type: 'light' }, { x: 3, y: 6, type: 'full' },
      { x: 1, y: 2, type: 'light' }, { x: 5, y: 2, type: 'light' },
    ],
    // enc① — VANGUARD×1(IRON 중장 전위) + STALKER×2(SHADE 저격, 격벽 압박). 전 적 killable(MFU).
    enemies: [
      { key: 'MERIDIAN_VANGUARD', x: 3, y: 2 },
      { key: 'MERIDIAN_STALKER',  x: 1, y: 2 },
      { key: 'MERIDIAN_STALKER',  x: 5, y: 2 },
    ],
  };

  // ---- enc② 인카운터 (국부 원장 코어 · MERIDIAN 보스전 7열 × 8행 · encounters.stage2) --
  //  [계승 §3.1] buildCombat opts.combat 오버라이드 소비. threshold 13 = enc② 최고 밴드(§5).
  var ENC2 = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    objective: { x: 3, y: 0, threshold: 13, veil: 0, label: '국부 원장 코어', dataTB: 3.0 },
    threatCap: 11,  // 보스전 상향 페이싱 + 증원.
    reinforcement: { key: 'MERIDIAN_VANGUARD', x: 0, y: 1 },  // [계승 §2 A2 증원 MERIDIAN_VANGUARD]
    walls: [
      { x: 2, y: 4 }, { x: 4, y: 4 },
    ],
    cover: [
      { x: 1, y: 5, type: 'light' }, { x: 5, y: 5, type: 'light' }, { x: 3, y: 6, type: 'full' },
      { x: 2, y: 3, type: 'light' }, { x: 4, y: 3, type: 'light' },
    ],
    // enc② — MERIDIAN_WARLORD(ASH hp24 보스, 중앙 전진) + DRONE×2(VOLT 기계, DATA SPIKE 대상 ·
    //   측면 사격). 보스 killable · 오브젝티브 코어 차감으로도 승리 가능(MFU 이중 경로).
    enemies: [
      { key: 'MERIDIAN_WARLORD', x: 3, y: 2 },
      { key: 'MERIDIAN_DRONE',   x: 1, y: 3 },
      { key: 'MERIDIAN_DRONE',   x: 5, y: 3 },
    ],
  };

  // ---- 대화 그래프 (MFU §2.0 2연전) ----------------------------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'AIDE', portrait: 'bloc',
        quote: 'VANTA',                        // loreQuote(VANTA)=VERA ASHTON DIRECTOR 버블
        text: OPENING.join('\n'),
        choices: [
          { label: '조세·데이터 볼트로 진입한다 — 격벽을 뚫는다', goto: 'approach' },
        ],
      },
      // ★enc① 심장 MFU 노드 — 무력 폴백 / [DEF3] 지름길 두 출구가 interlude 로 합류.
      approach: {
        id: 'approach', speaker: 'AIDE', portrait: 'bloc',
        text: '볼트 진입 구획. MERIDIAN 중장 전위 하나가 격벽 앞을 지키고, 저격수 둘이 서버 캐비닛 그늘에 숨었다.\n' +
              '격벽은 두껍다. 힘으로 견디며 밀고 들어가거나, 뚫고 나가거나.',
        choices: [
          { label: 'MERIDIAN 전위를 정면으로 밀어낸다',
            effect: { startCombat: { onWin: 'interlude' } },
            setFlags: { vaultBreachLoud: true },
            desc: 'MERIDIAN 격벽대(VANGUARD + STALKER×2)와 전투 → 격벽 돌파 (공통 폴백, 4클래스 완주 가능)',
          },
          { label: '[DEF 3] 격벽 파편을 버텨내며 저격 라인을 밀고 들어간다',
            gate: { attr: 'def', min: 3 }, show: 'gray',
            setFlags: { vaultBreachTanked: true },
            effect: { skipCombat: true }, goto: 'interlude',
            desc: '고DEF(BLADE/RIGGER/MOLE 축) → 저격 무릅쓰고 격벽 통과(지름길). 저DEF(CIPHER)는 잠김 → 전투로 폴백',
          },
        ],
      },
      // ★interlude — 서사 전환 + enc②(보스) 2번째 게이트.
      interlude: {
        id: 'interlude', speaker: 'AIDE', portrait: 'bloc',
        text: '격벽 너머, 볼트의 심장. 국부 원장 코어가 붉게 뛴다 — 그리고 그 앞에 MERIDIAN WARLORD가 서 있다.\n' +
              '"저건 협상하러 온 게 아니야. 코어를 통째로 뜯어가려는 거야. 정면으로는 오래 못 버텨."\n' +
              'AIDE가 숨을 고른다. "빠르게 파고들든, 위장으로 스치든 — 코어에 먼저 닿아."',
        onEnter: { setFlags: { vaultBreached: true } }, checkpoint: true,
        choices: [
          { label: 'WARLORD와 정면으로 맞선다',
            effect: { startCombat: { encounter: 'stage2', onWin: 'outro' } },
            setFlags: { throneBossLoud: true },
            desc: 'enc② 보스전 — MERIDIAN_WARLORD + DRONE×2와 전투 → 원장 코어 확보 (공통 폴백)',
          },
          { label: '[SPD 4] 전쟁군주의 사거리를 앞질러 코어로 파고든다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { throneRushed: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: '고SPD(CIPHER 축) → 보스 교전 회피, 코어 선점(지름길). 저SPD 클래스는 잠김 → 보스전으로 폴백',
          },
          { label: '[VANTA 태그] 체제 사원증을 위조해 볼트 관리자로 코어에 접근한다',
            gate: { tag: 'VANTA' }, show: 'gray',
            setFlags: { throneInfiltrated: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'MOLE 위장 신분(VANTA 태그) → 관리자 권한으로 코어 접근(지름길). 태그 미보유 클래스는 회색 → 보스전 폴백',
          },
        ],
      },
      // enc②/우회 공통 아웃트로.
      outro: {
        id: 'outro', speaker: 'AIDE', portrait: 'bloc',
        text: '원장 코어가 손안에 들어온다. MERIDIAN 전쟁군주의 강탈은 무산됐다.\n' +
              '"됐어. 도시의 심장은 도시에 남았어." AIDE가 코어 로그를 넘기다 멈춘다. "…그런데 이 숫자들. 도시는 처음부터 한 사람 거였어."\n' + STORY_CARD,
        onEnter: { setFlags: { throneSecured: true, ledgerSeen: true } }, checkpoint: true,
        choices: [ { label: '원장 로그를 확보한다', goto: 'choice' } ],
      },
      // ★플레이어 선택 [계승 §2.0 choice · 서사분기 setFlags].
      choice: {
        id: 'choice', speaker: 'AIDE', portrait: 'bloc',
        text: '"원장은 진실을 알아. 도시가 누구 것인지. 이걸 어떻게 쓸 거야?"',
        choices: [
          { label: 'A. 원장을 봉인해 체제의 질서를 지킨다',
            setFlags: { throneChoice: 'seal', throneSealed: true }, goto: 'settle',
            desc: '단일 체제 존속 · "ERA OF ONE" 유지 (영속 flag)',
          },
          { label: 'B. 원장을 공개해 도시가 자기 소유를 알게 한다',
            setFlags: { throneChoice: 'reveal', throneRevealed: true }, goto: 'settle',
            desc: '체제 정통성 균열 · 도시 각성 (영속 flag)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'AIDE', portrait: 'bloc',
        text: 'IRON CROWN — 왕관은 지켜졌다. MERIDIAN의 첫 인수 시도는 무산됐다.\n' +
              '그러나 성벽 너머의 시선은 물러나지 않았다. 저들은 값을 다시 부를 것이다. 도시는 여전히, 누군가의 것이다.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (act2_plan.md §2 A2: rep8 karma3 ₵15) --------------------------
  var REWARDS = {
    rep: 8,
    karma: 3,
    nuyen: 15,
    unlocks: [],
  };

  var MISSION = {
    id: 'a2-a2-crown-throne',
    title: 'IRON CROWN II — Crown Throne',
    subtitle: 'ACT 2 브랜치 A — 조세·데이터 볼트 결전 (2연전 · MERIDIAN 전쟁군주)',
    kind: 'act2',
    unlock: { missionsDone: ['ch08-zero-day', 'a2-a1-crown-breach'], endingSeen: ['corporate-eternal'] },
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,                                           // enc①
    encounters: { stage2: ENC2 },                             // enc② (보스)
    rewards: REWARDS,
    nextHint: 'IRON CROWN 갈래 종결. 다른 엔딩 갈래는 NG+ endingSeen 누적으로 개방.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_A2_CROWN_THRONE = API;
})();
