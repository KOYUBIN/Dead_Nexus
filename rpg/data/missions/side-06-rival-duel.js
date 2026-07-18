;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/side-06-rival-duel.js — 사이드 미션 "Rival's End"
  //   (사이드 = 챕터 밖 단편 미션. ch01-first-blood.js 스키마 그대로 재사용,
  //    엔진 무편집으로 콘텐츠 추가 — docs/25 §5.1. 포맷 정본 = ch01/side-01~05.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문(청부 훅)          [계승] cards/events/quest-deck.md Q07 "경쟁 고스트
  //                                제거"(의뢰인 🌃거리 · 목표문 "지정 Ghost(랜덤, 본인
  //                                제외) 제거" · 주의문 "게임 내 다른 플레이어를 공격해야
  //                                함(PVP 유발)") 발췌 — 랜덤 PVP 대상 대신 "같은 거리에서
  //                                자란 라이벌"로 인물화(각색 아님, 원 카드에 이미 있는
  //                                "경쟁 고스트" 설정을 그대로 계승해 이름만 부여).
  //   결투 동기(플래이버 원문)      [그대로] cards/objectives/ghost.md G-R03 "경쟁 청산"
  //                                (조건: 지정 Ghost 1명 HP 0 도달 유도 · 보너스 렙+10)
  //                                플래이버 원문 "같은 거리에서 자랐지만, 같은 거리에서
  //                                죽지는 않는다." 인용 — OPENING·REFRAIN 양쪽에 그대로 사용.
  //   Ghost vs Ghost 결투 모티프    [계승, SIMPLIFIED] docs/07-combat-stats.md §5.1
  //                                "Ghost vs Ghost PvP"(같은 구역 조우 시 d6+ATK/DEF
  //                                대결, 2점차 이상 승/패 판정) — 엔진(store.js/buildCombat)
  //                                에는 이 추상 d6 대결 리졸버가 없고 기존 그리드 인카운터
  //                                하나뿐이므로(엔진 무편집 원칙), 결투를 "라이벌+갱단
  //                                지원"이 있는 buildCombat 인카운터로 극화한다. §5.1 의
  //                                "결투" 서사 프레임과 승자/패자 구도만 계승하고, 주사위
  //                                판정 자체는 신규 로직 없이 기존 전투 계약으로 대체.
  //   무대(폐허)                    [계승] docs/10-map-zones.md §6 Ring4 다운타운 표
  //                                "B9 | 폐허 |" (계획 인용은 §7 Ring5 폐허 archetype —
  //                                §6/§7 모두 폐허가 "거점 건설 불가·추적 불가·ASH 속성
  //                                생산" 동일 규칙 §11.4 적용 지역이라 동일 원전 유형으로
  //                                간주, B9 좌표 자체는 §6 표가 근거).
  //   접근 대화 3출구 구조          [계승 docs/25 §4.4 MFU 패턴, 각색 side-05 단일 outro
  //                                합류 골격] 전투/ATK게이트/flag게이트 세 출구가 모두
  //                                같은 outro 로 합류하는 최단편 배선(side-05와 동일 구조).
  //   ATK5 "선공 결투 종결" 게이트  [각색] docs/07-combat-stats.md §2 BLADE 기본 ATK5 +
  //                                data/classes.js BLADE.passive "동점 자동 선공"[계승
  //                                docs/07 §3 STEP B(3항)] — 그 패시브 정체성을 대화
  //                                플래이버로 확장해 "선공으로 결투를 끝낸다"는 스킵 경로로
  //                                구현(신규 메커닉 0, 기존 attr 게이트 필드만 소비).
  //   ch01 영웅 분기 계승 게이트    [계승] ch01-first-blood.js §플레이어 선택 "A. 영웅 —
  //                                정체를 공개한다"(setFlags: heroChoice:'hero',
  //                                allBlocsHostile:true) — evalGate 의 flag 게이트는
  //                                존재/불리언만 판정하고 문자열 값(heroChoice==='hero')은
  //                                비교하지 못하므로(systems/dialogue.js evalGate), hero
  //                                분기에서만 켜지는 동반 flag `allBlocsHostile` 를 대신
  //                                게이트로 사용한다 — ch08-zero-day.js "[flag
  //                                allBlocsHostile] 거리가 도시를 되찾는다"(desc: "ch01
  //                                영웅 선택 heroChoice=hero 파생") 선례를 그대로 재사용한
  //                                동일 패턴(신규 게이트 문법 없음).
  //   오브젝티브 "경쟁자 아지트"    [계승 store.js applyHackObjective 기존 계약, side-03/
  //   (decoy)                      04/05 관례 재사용] checkOutcome 은 objective.done 과
  //                                aliveEnemies.length===0 을 이미 동등 승리 조건으로 취급
  //                                (신규 로직 0) — 라이벌 전멸이 정규 결투 승리 경로이고,
  //                                은신처 표식 해킹/강습 차감은 부가 승리 경로로 자연 공존.
  //   순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: MISSION.kind / MISSION.unlock 는 ch01~ch08 엔진 계약에 없던 신규
  //   최상위 메타 필드다(side-01~05 와 동일 패턴). 현재 엔진(store.js/campaign.js)은
  //   두 필드를 읽지 않으므로 전투/대화/보상 계약에는 영향이 없다(순수 추가 데이터).
  //   unlock.flagsSet 은 이 미션에서 처음 쓰는 부속 키다 — missionsDone 배열(기존 다수
  //   관례)에 더해 "true 여야 하는 세이브 flag 목록"을 병기하기 위한 확장이며, evalGate
  //   의 flag 게이트(!!flags[key])와 동일한 불리언 존재 판정 의미로 맞췄다(신규 판정
  //   로직 없음). 실제 게이트 판정(허브 미션보드 필터링: missionsDone 에
  //   ch05-mesh-ghost 포함 AND flags.heroChoice 가 참)은 통합 단계에서 이 필드를 읽어
  //   배선해야 한다.
  // SIMPLIFIED: combat.objective("경쟁자 아지트")는 라이벌 본체가 아니라 라이벌이
  //   남긴 은신처 표식(decoy) 콘솔이다 — side-05 "밀고 단말"과 동일한 이중 승리 조건
  //   패턴(전멸전이 정규 경로, 콘솔 해킹/강습 차감이 부가 경로).
  // [통합 노트] RIVAL_GHOST / GANG_THUG 는 아직 data/enemies.js 에 없음 — 이 파일은
  //   계획 로스터 ID(RIVAL_GHOST, GANG_THUG)만 참조한다(_missions_check.js
  //   PLANNED_ROSTER 화이트리스트에 이미 포함). RIVAL_GHOST 는 계획상 hp14·spd5·
  //   ai:'advance'(공격적 전진형, docs/25 §3.7 AI 태그 어휘 참고) — 실제 정의는
  //   통합 단계 data/enemies.js 소관.
  // ==========================================================================

  // ---- 원전 산문 앵커 (quest-deck.md Q07 + ghost.md G-R03, 발췌·그대로) ---------
  var OPENING = [
    '"같은 거리에서 자랐지만, 같은 거리에서 죽지는 않는다."', // [그대로] ghost.md G-R03 "경쟁 청산" 플래이버 원문
    '거리의 계약판에 이름 하나가 걸린다: 지정 Ghost 제거. 의뢰인 — 🌃거리.', // [계승] quest-deck.md Q07 목표문("지정 Ghost(랜덤, 본인 제외) 제거") + 의뢰인(🌃거리) 발췌
    '그런데 이번엔 랜덤이 아니다. 이름을 보는 순간 알아본다 — 같은 블록, 같은 폐허에서 함께 자란 얼굴.', // [계승] Q07 "경쟁 고스트" 설정을 인물화(원 카드 설정 계승, 이름만 부여)
    '그날 밤 이후로 소문이 갈렸다. 같은 이름을 놓고 두 갈래로 자란 두 고스트 — 이제 거리는 하나만 기억하려 한다.',
    '좌표는 폐허 B9. 무너진 벽과 잔해 사이, 아무도 신고하지 않는 구역.', // [계승] docs/10 §6 Ring4 다운타운 "B9 | 폐허" 표
    '주의: 이건 청부가 아니라 결투다. 게임 내 다른 플레이어를 직접 상대해야 한다.', // [계승] Q07 주의문("게임 내 다른 플레이어를 공격해야 함") 발췌
  ];
  var STORY_CARD = '그날 밤, 같은 거리에서 자란 두 이름 중 하나만 남았다. 나머지 하나는 폐허 B9에 묻혔다.';
  var REFRAIN = '같은 거리에서 자랐지만, 같은 거리에서 죽지는 않는다.'; // [그대로] G-R03 플래이버 원문 재인용

  // ---- 전투 인카운터 (폐허 B9 6열 × 7행, 단편) --------------------------------
  //  좌표 {x:열 0..5, y:행 0..6}. row0=상단(은신처 표식), row6=하단(진입로).
  //  [계승 docs/10 §6 B9 폐허] 무대. wall=무너진 벽 LoS 완전 차단, cover=잔해 엄폐.
  var COMBAT = {
    cols: 6, rows: 7,
    playerStart: { x: 3, y: 6 },
    // 오브젝티브 = 경쟁자 은신처 표식(decoy, 상단 SIMPLIFIED 참고) — threshold 누적 차감.
    //  [계승 store.js applyHackObjective] 인접 유닛의 max(HACK,ATK) 축 자동 선택으로
    //  CIPHER/BLADE 모두 같은 표식을 다른 축으로 차감 가능(부가 승리 경로).
    objective: { x: 3, y: 0, threshold: 7, veil: 0, label: '경쟁자 아지트', dataTB: 0 },
    // [계승 G10, 각색 raidThreshold] 위협 임계 + 증원(경보 시 1회 스폰) — 단편 페이싱.
    threatCap: 7,
    reinforcement: { key: 'GANG_THUG', x: 5, y: 1 },
    // [신규] 무너진 벽 1개 — 중앙 통로를 끊어 좌우 우회를 강제.
    walls: [
      { x: 2, y: 4 },   // 무너진 벽(중앙, 라이벌 쪽 정면 접근 차단)
    ],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1. 폐허 잔해 3곳.
    cover: [
      { x: 1, y: 2, type: 'light' }, { x: 4, y: 2, type: 'light' }, { x: 2, y: 5, type: 'light' },
    ],
    // 적 배치 — key 는 data/enemies.js 참조(통합 단계에서 추가, 계획 로스터
    //   RIVAL_GHOST/GANG_THUG 인용). RIVAL_GHOST = 결투 본체(계획 hp14·spd5·
    //   ai:'advance', 상단 [통합 노트] 참고), GANG_THUG ×2 = 라이벌의 지원 갱단.
    //   전 적 killable → 전멸전만으로도 완주 가능(MFU, 상단 SIMPLIFIED 참고).
    enemies: [
      { key: 'RIVAL_GHOST', x: 3, y: 2 },   // ★결투 본체 — 같은 거리에서 자란 라이벌
      { key: 'GANG_THUG',   x: 1, y: 3 },
      { key: 'GANG_THUG',   x: 4, y: 3 },
    ],
  };

  // ---- 대화 그래프 (docs/25 §4.2 노드 스키마, 단편 — 분기 1개) -----------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'STREET', portrait: 'ghost',
        quote: 'CIPHER',                       // loreQuote(CIPHER) 버블 삽입 (어댑터)
        text: OPENING.join('\n'),
        choices: [
          { label: '폐허 B9, 경쟁자가 기다리는 곳으로 향한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — ATK 게이트(BLADE 지름길)와 ch01 영웅 분기 계승 flag 게이트가
      //  전투를 대체하는 두 경로를 연다(docs/25 §1·§4.4). 셋 다 동일한 'outro' 로
      //  합류 — 단편 대화(side-05와 동일 "3출구→단일 outro" 배선).
      approach: {
        id: 'approach', speaker: 'GHOST', portrait: 'ghost',
        text: '폐허 B9. 무너진 벽 사이로 그림자 하나가 걸어 나온다. 같은 억양, 같은 걸음걸이 — 낯익은 얼굴이 이름을 부른다.\n' +
              '"오랜만이다. 이 거리는 이름 하나만 기억해." 뒤로 갱단 둘이 따라붙는다.',
        choices: [
          { label: '결투에 응한다',
            effect: { startCombat: { onWin: 'outro' } },
            desc: 'RIVAL_GHOST + 갱단 2 와 전투 → 라이벌 제압 (전투 경로, 양 클래스 완주 가능)',
          },
          { label: '[ATK 5] 선공으로 결투를 끝낸다',
            gate: { attr: 'atk', min: 5 }, show: 'gray',
            setFlags: { duelFirstStrike: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'BLADE(기본 ATK5)·"동점 자동 선공" 패시브 시너지 → 전투 스킵, 일격에 결투 종결. CIPHER(ATK2)는 미충족 → ①로 폴백',
          },
          { label: '[flag allBlocsHostile] 정체 공개 소문을 앞세워 경쟁자를 먼저 도발시킨다',
            gate: { flag: 'allBlocsHostile' }, show: 'gray',
            setFlags: { rivalProvokedFirst: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'ch01 영웅 선택(정체 공개, heroChoice=hero 파생 flag) 계승 — 소문이 먼저 퍼지며 경쟁자가 선제 도발 → 명분 확보, 전투 스킵. flag 없으면 잠김 → ①로 폴백',
          },
        ],
      },
      // 세 출구 공통 아웃트로 — 전투/선공/도발유도 어느 경로든 결과는 같다(라이벌 청산).
      outro: {
        id: 'outro', speaker: 'CIPHER', portrait: 'ghost',
        text: '결투가 끝난다. 낯익은 얼굴이 잔해 위로 쓰러진다.\n' +
              '은신처 표식이 꺼진다 — 경쟁자 아지트는 더 이상 그 이름을 감추지 않는다.\n' + STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { rivalDuelDone: true } }, checkpoint: true,
        choices: [ { label: '폐허를 떠난다', goto: 'settle' } ],
      },
      settle: {
        id: 'settle', speaker: 'CIPHER', portrait: 'ghost',
        text: '같은 거리에서 자란 두 이름 중, 이제 하나만 걷는다.\n' +
              '렙과 대금이 계좌로 흘러든다. 거리는 벌써 다음 이름을 준비하고 있다.',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (사이드 단편 — 챕터 대비 축소 보상) --------------------------
  var REWARDS = {
    rep: 2,
    karma: 1,
    nuyen: 6,
    unlocks: [],
  };

  var MISSION = {
    id: 'side-06-rival-duel',
    title: "Side — Rival's End",
    subtitle: '사이드 — 경쟁자의 끝 (폐허 B9, 라이벌 고스트 결투)',
    kind: 'side',                                                              // SIMPLIFIED 상단 주석 참고 — 신규 메타 필드, 엔진 미소비.
    unlock: { missionsDone: ['ch05-mesh-ghost'], flagsSet: ['heroChoice'] },    // SIMPLIFIED 상단 주석 참고 — missionsDone 포함 + flag 존재 조건 병기(통합 단계 배선 대상).
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_SIDE06_RIVAL_DUEL = API;
})();
