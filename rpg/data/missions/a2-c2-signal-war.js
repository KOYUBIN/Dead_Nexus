;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a2-c2-signal-war.js — ACT 2 브랜치 C "COUNCIL OF ASH" C2
  //   "SIGNAL WAR" (엔진 무편집 콘텐츠. 포맷 정본 = a2-00-framing / ch05-mesh-ghost.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (act2_plan.md §1·§2 브랜치 C · 원전 정본 After Zero Day):
  //   서사 기점        [계승] ending.js nexus-reborn "다음을 위한 문 하나가 남는다" +
  //                    chapter-08 §엔딩3 — 원전이 명시한 "외부 위협"의 근원을 SIGNAL 과 함께
  //                    메시 심층에서 끊는 결전(브랜치 C 종막). C1 앵커 추적의 귀결.
  //   해금 조건        [계승 §3.2] endingSeen:['nexus-reborn'] + missionsDone:['a2-c1-first-contact']
  //                    — C1 완주 시 REWARDS.unlocks 로 순차 개방. 61차 campaign.js 레지스트리 소비.
  //   신규 세력 MERIDIAN [신규 61차] MERIDIAN_WARLORD(ASH 전쟁군주 · Act2 외부 위협 보스) 결전.
  //   의뢰인/화자 SIGNAL [계승 chapter-05 §2 · ending.js endReborn speaker:SIGNAL] AI 의식체.
  //                    SIGNAL 발화 [각색](§SIGNAL 정체·기억 톤) · MERIDIAN 발화 [신규](냉담 어조).
  //   무대(메시 심층)   [계승 심화 · ch05-mesh-ghost 메시 무대 심화] docs/10 §13 메시 레이어를
  //                    심층 결전 규모(8×8)로 확장. ch05 SIGNAL 강림 노드 → C2 근원 코어.
  //   2연전 (61차 확정) [신규 §3.1] enc① = MISSION.combat / enc② = MISSION.encounters.stage2.
  //                    interlude 노드 effect.startCombat:{encounter:'stage2', onWin:'outro'} 소비.
  //                    HP 리필(풀회복) · 하드모드 자동 스케일.
  //   MFU 접근 게이트   [계승 docs/25 §4.4] enc① [SPD 4] / enc② [HACK 5]·[MESH tag] — 전투 폴백
  //                    상존(4클래스 무력 완주 보장).
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: WARD_NODE×2(GRID·physImmune·hackOnly)는 근원 코어 수호 정적 노드 — ch05
  //   SIGNAL_ICE 선례처럼 "필수 처치 대상 아님". BLADE 는 물리 무효로 파괴 불가하나, 코어
  //   objective-reduce(인접 max(HACK,ATK) 자동축) 경로가 전 클래스 완주 보장 → 하드락 없음.
  //   MERIDIAN_WARLORD(보스)는 killable → 전멸/오브젝티브 이중 승리(MFU).
  // SIMPLIFIED: [MESH tag] 게이트 — data/classes.js 상 어느 플레이어블 클래스도 'MESH' 인물태그를
  //   보유하지 않는다(MOLE tags = VANTA/IRONWALL/AXIOM). 따라서 이 게이트는 상시 회색 → 항상
  //   전투 폴백으로 완주(Act1 side-08 SIMPLIFIED 태그게이트 선례 준수). "메시는 SIGNAL 의 영역"
  //   테마를 플래이버로만 표현하고, 실 진행은 [HACK 5](CIPHER) 또는 전투가 담당.
  // SIMPLIFIED: quote:'SIGNAL'→loreQuote null(무해). SIGNAL 발화는 산문 [각색].
  // ==========================================================================

  // ---- 원전 산문 앵커 (ch05 메시 심화 · ending.js nexus-reborn, 계승/각색) ----------
  var OPENING = [
    '메시 심층. C1 의 앵커가 가리킨 좌표는 이 아래로 이어졌다 — 도시의 신경망이 가장 깊이 가라앉는 층.', // [계승 심화] ch05 메시 무대
    '[SIGNAL] "여기까지 내려온 적은 나뿐이라고 믿었다. 그런데 저들은 이미 이 층에 근원을 심었어. 내 안뜰에."', // [각색] SIGNAL 정체·영역 톤
    '메시 관문 너머로, 애시그리드의 것이 아닌 코어가 맥동한다. 성벽 밖의 논리로 짜인 구조물.', // [신규] MERIDIAN 근원 코어
    '[MERIDIAN] "이 도시는 스스로를 재건했지. 우리는 그 재건의 설계도를 원한다. 살아 있는 도시는, 가장 비싼 부품이다."', // [신규] MERIDIAN 냉담 어조
    '[SIGNAL] "저 코어를 끄면, 저들의 발판은 이 도시에서 완전히 사라진다. 하지만 그 앞엔 저들이 세운 전쟁군주가 서 있어."', // [각색] 보스 예고
    'After Zero Day. 살아남은 도시의 가장 깊은 곳에서, SIGNAL 과 함께 그 삶을 끝내려는 손을 마주한다.', // [계승] 엔딩3 프레이밍
  ];
  var STORY_CARD = '"살아 있는 도시는, 가장 비싼 부품이다." — MERIDIAN, 근원 코어 송출 (SIGNAL 가로챔)';
  var REFRAIN = '메시는 SIGNAL 의 영역이다. 그 영역에 발을 들인 손은, 그 영역의 값을 치른다.';

  // ---- 전투 인카운터 ① = MISSION.combat (메시 관문 · 메시 심층 8열 × 8행) -----------
  //  좌표 {x:열 0..7, y:행 0..7}. row0=상단(메시 관문), row7=하단(다이브 진입).
  //  [계승 심화 docs/10 §13 메시 레이어] 개활 오버레이 — 노드 도달성 보장(장벽 최소).
  var COMBAT = {
    cols: 8, rows: 8,
    playerStart: { x: 4, y: 7 },
    // 오브젝티브 = 메시 관문(threshold 10 · objective-reduce). [계승 store applyHackObjective]
    objective: { x: 4, y: 0, threshold: 10, veil: 0, label: '메시 관문', dataTB: 3.0 },
    threatCap: 10,
    // enc① 증원 없음(카탈로그: 증원은 enc②).
    walls: [],
    cover: [
      { x: 2, y: 3, type: 'light' }, { x: 5, y: 3, type: 'light' },
      { x: 2, y: 5, type: 'light' }, { x: 5, y: 5, type: 'light' },
    ],
    // 적 배치 — MERIDIAN_STALKER(SHADE 저격) + MESH_WISP×2(SIGNAL 잔존 방어 재활용 · isMachine).
    //  전 적 killable → 전멸(BLADE) / 관문 objective-reduce(전 클래스) 이중 승리.
    enemies: [
      { key: 'MERIDIAN_STALKER', x: 4, y: 2 },
      { key: 'MESH_WISP',        x: 1, y: 3 },
      { key: 'MESH_WISP',        x: 6, y: 3 },
    ],
  };

  // ---- 전투 인카운터 ② = MISSION.encounters.stage2 (근원 코어 · 보스전) ------------
  //  [신규 §3.1] 2연전 2번째 무대. combat 동일 스키마. HP 리필(interlude 숨 고르기).
  var ENCOUNTERS = {
    stage2: {
      cols: 8, rows: 8,
      playerStart: { x: 4, y: 7 },
      // 오브젝티브 = 외부 위협 근원 코어(threshold 13 · veil 1 = 유효 임계 14). 브랜치 C 최고 임계.
      objective: { x: 4, y: 0, threshold: 13, veil: 1, label: '외부 위협 근원 코어', dataTB: 6.0 },
      threatCap: 11,
      // [카탈로그] 증원 MERIDIAN_STALKER(경보 1회 스폰) — SHADE 저격 압박 지속.
      reinforcement: { key: 'MERIDIAN_STALKER', x: 6, y: 2 },
      walls: [
        { x: 3, y: 4 }, { x: 5, y: 4 },
      ],
      cover: [
        { x: 1, y: 3, type: 'light' }, { x: 6, y: 3, type: 'light' },
        { x: 3, y: 6, type: 'light' }, { x: 5, y: 6, type: 'light' },
      ],
      // 적 배치 — MERIDIAN_WARLORD(ASH 보스 hp24 · killable) + WARD_NODE×2(GRID physImmune·optional 수호).
      //  코어 objective-reduce 로 전 클래스 완주(WARD_NODE 미처치 무관). 보스는 전멸 부가 경로.
      enemies: [
        { key: 'WARD_NODE',        x: 2, y: 1 },   // 근원 코어 좌 수호(physImmune·optional)
        { key: 'WARD_NODE',        x: 6, y: 1 },   // 근원 코어 우 수호(physImmune·optional)
        { key: 'MERIDIAN_WARLORD', x: 4, y: 2 },   // ★보스 — MERIDIAN 전쟁군주
      ],
    },
  };

  // ---- 대화 그래프 (MFU §2.0 · 2연전: approach→[전투①]→interlude→[전투②]→outro) ---
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'SIGNAL', portrait: 'ghost',
        quote: 'SIGNAL',                       // loreQuote(SIGNAL)→null(무해). 발화는 산문 [각색].
        text: OPENING.join('\n'),
        choices: [
          { label: '메시 심층으로 다이브한다 — SIGNAL 의 안뜰로', goto: 'approach' },
        ],
      },
      // ★enc① MFU 노드 — 전투① / [SPD 4] 메시 급기동 우회(지름길). 둘 다 interlude 합류.
      approach: {
        id: 'approach', speaker: 'SIGNAL', portrait: 'ghost',
        text: '메시 관문. SIGNAL 의 옛 방어 위습들이 낯선 저격수 하나를 에워싸고 관문을 지킨다.\n' +
              '[SIGNAL] "이 관문은 내가 만든 거야. 하지만 지금은 저들이 열쇠를 쥐고 있지. 함께 되찾자."',
        choices: [
          { label: '관문 수비를 돌파한다',
            effect: { startCombat: { onWin: 'interlude' } },
            setFlags: { meshGateEngaged: true },
            desc: 'enc① MERIDIAN_STALKER + MESH_WISP×2 와 전투 → 관문 확보 (공통 폴백, 4클래스 완주 가능)',
          },
          { label: '[SPD 4] 메시 급기동으로 관문을 스쳐 지나 심층으로 내려간다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { meshGateSlipped: true },
            effect: { skipCombat: true }, goto: 'interlude',
            desc: 'SPD4(CIPHER/…) → 메시 급기동으로 enc① 전투 스킵(지름길). 저SPD 클래스는 잠김 → 전투로 폴백',
          },
        ],
      },
      // ★2연전 전환 interlude — 서사 전환 + enc② approach 게이트. [61차 §3.1] encounter:'stage2' 소비.
      interlude: {
        id: 'interlude', speaker: 'SIGNAL', portrait: 'ghost',
        text: '관문이 열린다. 그 너머로 근원 코어가 온전히 드러난다 — 성벽 밖의 논리로 짜인, 도시 아닌 것.\n' +
              '[SIGNAL] "저게 저들의 심장이야. 저걸 끄면 앵커도, 발판도, 전부 이 도시에서 사라져. 하지만 앞을 봐."\n' +
              STORY_CARD + '\n' +
              '코어 앞에 MERIDIAN 전쟁군주가 선다. 좌우로 GRID 수호 노드가 코어를 감싸고, 베일이 그 위에 드리운다.',
        choices: [
          { label: '전쟁군주를 넘어 근원 코어로 돌입한다',
            effect: { startCombat: { encounter: 'stage2', onWin: 'outro' } },
            setFlags: { meridianCoreEngaged: true },
            desc: 'enc② MERIDIAN_WARLORD(보스) + WARD_NODE×2(증원 STALKER)와 전투 → 코어 정지 (공통 폴백, 4클래스 완주)',
          },
          { label: '[HACK 5] SIGNAL 과 동조해 코어 논리를 통째로 역해독한다',
            gate: { attr: 'hack', min: 5 }, show: 'gray',
            setFlags: { meridianCoreDecoded: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'HACK5(CIPHER) → SIGNAL 동조로 코어 역해독, enc② 전투 스킵(지름길). 저HACK 클래스는 잠김 → 전투로 폴백',
          },
          { label: '[MESH tag] 메시 원주민 신호로 위장해 코어 방어를 통과한다',
            gate: { tag: 'MESH' }, show: 'gray',
            setFlags: { meridianCoreSpoofed: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: '[SIMPLIFIED] 메시 태그 위장 지름길 — 어느 클래스도 MESH 인물태그 미보유(상시 회색) → 항상 전투 폴백. "메시는 SIGNAL 의 영역" 테마 플래이버.',
          },
        ],
      },
      // 전투②/우회 공통 아웃트로 — 근원 코어가 멈추고, MERIDIAN 의 발판이 도시에서 사라진다.
      outro: {
        id: 'outro', speaker: 'SIGNAL', portrait: 'ghost',
        text: '근원 코어가 맥동을 멈춘다. 성벽 밖의 논리가 메시 심층에서 지워지고, 베일이 걷힌다.\n' +
              '[SIGNAL] "끝났어 — 이 발판은. 저들은 도시가 살아 있는 한 다시 올 거야. 하지만 오늘 밤, 도시는 스스로를 지켜냈지."\n' + REFRAIN,
        onEnter: { setFlags: { meridianCoreStopped: true, signalWarCleared: true } }, checkpoint: true,
        choices: [ { label: 'SIGNAL 과 함께 심층에서 빠져나온다', goto: 'settle' } ],
      },
      settle: {
        id: 'settle', speaker: 'SIGNAL', portrait: 'ghost',
        text: 'Act 2 — Council of Ash, 마무리. 재건된 도시는 첫 번째 외부의 손을 밀어냈다.\n' +
              '[SIGNAL] "완벽한 승리는 아니야. 저들은 값을 알아버렸으니까. 하지만 오늘, 우리는 이 도시가 지킬 가치가 있다는 걸 증명했어."\n' +
              'After Zero Day 의 문 하나가, 이렇게 닫히고 또 열린다.\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (브랜치 C 메인 2 · 2연전 보스 스케일) --------------------------
  var REWARDS = {
    rep: 8,
    karma: 3,
    nuyen: 15,
    unlocks: [],   // 브랜치 C 종막 — 후속 해금 없음.
  };

  var MISSION = {
    id: 'a2-c2-signal-war',
    title: 'Act 2 — Signal War',
    subtitle: 'ACT 2 · COUNCIL OF ASH C2 — 근원 코어 결전 (메시 심층 레이어 · 화자 SIGNAL · MERIDIAN_WARLORD 보스)',
    kind: 'act2',
    unlock: { missionsDone: ['a2-c1-first-contact'], endingSeen: ['nexus-reborn'] },   // C1 완주 후 순차 개방.
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,           // enc①
    encounters: ENCOUNTERS,   // enc②(stage2) — 2연전 보스
    rewards: REWARDS,
    nextHint: '브랜치 C "Council of Ash" 완주. 다른 엔딩 갈래는 endingSeen 누적(NG+)으로 개방.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A2_C2_SIGNAL_WAR = API;
})();
