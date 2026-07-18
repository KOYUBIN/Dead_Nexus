;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/side-08-harbor-run.js — 사이드 미션 "Harbor Run"
  //   (사이드 = 챕터 밖 단편 미션. ch01-first-blood.js 스키마 그대로 재사용,
  //    엔진 무편집으로 콘텐츠 추가 — docs/25 §5.1. 포맷 정본 = ch01/side-01~06.)
  //   장르 태그: 중편(mid-length) 탈출-돌파(escape-breakthrough) — 남항 검문 봉쇄를
  //   강행 돌파해 NPC 호송 대상을 비통제구역 경계로 빼낸다.
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표 (docs/25 §5.4):
  //   오프닝 산문(호송 훅)          [계승] cards/events/quest-deck.md §8 밀수(Smuggle)
  //                                Q40 "인간 밀입국"(의뢰인 🏚️비통제구역·목표문 "NPC 1명을
  //                                맵 외부로 호송(비통제구역 경계까지)"·주의문 "발각 시
  //                                캐릭터 현상수배 +3") 발췌·각색을 대화 뼈대로 사용.
  //   호송 대상의 화물(플래이버)    [계승] quest-deck.md Q40 과 같은 §8 밀수 카테고리
  //                                Q39 "정보 유출 파일"(의뢰인 🌃거리·목표문 "물리적 저장
  //                                매체(USB 등)를 VANTA 감시 회피하며 운반") 발췌 — 호송
  //                                대상이 그 유출 파일을 함께 나른다는 설정으로 Q40과 결합
  //                                (같은 밀수 덱 카테고리 두 장을 한 장면에 계승).
  //   탈출 동기(플래이버 원문)      [그대로] cards/objectives/ghost.md G-E01 "그리드 탈출"
  //                                플래이버 원문 "누군가 묻는다: 어디 갔니? 그 질문이 내가
  //                                잘 갔다는 증거다." — OPENING·REFRAIN 양쪽에 그대로 인용.
  //   탈출-돌파 오브젝티브 골격     [각색] ghost.md G-E01 조건("비통제구역 경계 탈출,
  //                                항구 F1/F11/A6/K6 중 하나 경유 + 현상수배 3 이상 상태 →
  //                                대체 승리") — 엔진에 현상수배 추적/대체승리 판정이 없어
  //                                (하단 SIMPLIFIED 참고) "항구를 통한 탈출"이라는 설정만
  //                                계승하고, 실제 판정은 기존 buildCombat objective-reduce
  //                                (게이트 돌파)로 근사한다.
  //   무대(남항 F10 검문 게이트)    [계승] docs/10-map-zones.md §6 다운타운 표
  //                                "F10 | 항구(남항) | 남 관문" + §11.5 "항구(F2,D10,F10,
  //                                H10,F1,F11,A6,K6) — 8구역: 무기 거래 활성화·지하 루트
  //                                연결·밀수 퀘스트 시작점·비통제구역 탈출 가능" — F10 이
  //                                남항이라는 이름과 함께 비통제구역 탈출 가능 8구역 중
  //                                하나로 명시됨(§7 Ring5 "비통제구역 출입구 4곳" F1/F11/
  //                                A6/K6 자체는 아니나, §11.5 규칙상 동일하게 탈출 가능한
  //                                항구 구역이라 무대로 계승).
  //   검문 병력(IRONWALL 외주)      [계승 ch03-martial-night.js §접근 정황 + docs/01
  //                                "공권력은 민영화되어 IRONWALL에 외주"] 검문 게이트 =
  //                                IRONWALL 외주 진압대(POLICE_OFFICER/POLICE_DRONE) —
  //                                ch03 과 동일 계획 로스터 ID 재사용(적 축 일관성).
  //   접근 대화 3출구 구조          [계승 docs/25 §4.4 MFU 패턴, side-06 "3출구→단일
  //                                outro 합류" 골격 재사용] 전투 / [SPD4] 질주 우회 /
  //                                [DEF3 폴백] CHECKPOINT BRIBE 모티프.
  //   SPD4 "검문 교대 타이밍 질주" [각색] docs/07-combat-stats.md §2 CIPHER 기본 SPD4 —
  //   게이트                       그 기동력을 "교대 타이밍에 호송 대상과 함께 질주해
  //                                통과"하는 대화 지름길로 확장(신규 메커닉 0, 기존 attr
  //                                게이트 필드만 소비). CIPHER 전용 지름길(BLADE SPD3 잠김).
  //   CHECKPOINT BRIBE 모티프       [계승] cards/legacy/chapter-03-martial-night.md
  //   → DEF3 폴백 게이트             §2 새 행동 카드 "CHECKPOINT BRIBE(BROKER 해금):
  //                                ₵ 3로 검문소 1회 무력화" — 설계 의도는 ₵3 지출 게이트지만
  //                                엔진 미지원(하단 SIMPLIFIED 참고) → BLADE 기본 DEF3
  //                                "몸으로 검문을 무력화" 폴백 게이트로 실체화(BLADE 전용
  //                                지름길, CIPHER DEF1 잠김).
  //   전투 인카운터 무대            [신규] 남항 검문 게이트 6×7(중편), 봉쇄 게이트 돌파
  //                                오브젝티브. 검문 순찰 3기 + 증원 드론 1기.
  //   이중 승리(게이트 돌파/전멸)   [계승 store.js checkOutcome native 조건, ch06/side-03
  //                                선례와 동일 패턴] objective.done→win, aliveEnemies
  //                                ===0→win 두 native 조건이 그대로 공존(신규 로직 0).
  //   순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED — 보고 ①: approach 선택지 ③('CHECKPOINT BRIBE로 검문 1회 무력화')의
  //   설계 의도는 ₵(nuyen) 3 지출 게이트다. 그러나 _missions_check.js VALID_GATE_ATTRS
  //   와 store.js dialogueCtx.attrs 는 {hack, atk, def, spd, hp} 5종만 게이트로 지원하고,
  //   대화 selection 의 effect 소비 목록도 {rep, startCombat, returnHub}(+goto 라우팅)뿐이라
  //   nuyen 지출은 대화 선택지에서 소비되지 않는다(ch07-heart-of-city.js effect.spendKarma
  //   SIMPLIFIED 선례와 동일 계약 한계). → 이 출구는 실제로는 gate{attr:'def',min:3} 로
  //   판정(BLADE 기본 DEF3 지름길, 엔진 무편집)한다. effect.spendNuyen:3 은 향후 대화용
  //   nuyen-지출 핸들러가 추가되면 자동 결선되는 전방 호환 훅(현재 store 무시·무해)으로만
  //   둔다. nuyen-지출 대화 게이트 = 신규 메커닉(엔진 편집 필요) → 통합 단계 보고 대상.
  // SIMPLIFIED — 보고 ②: ghost.md G-E01 "그리드 탈출"의 실제 메타 승리조건(현상수배 3
  //   이상 상태에서 항구 경유 비통제구역 탈출 → 대체 승리, 메타 "OFF THE GRID")은 엔진에
  //   현상수배 누적 추적도, combat 밖 대체승리 판정도 없어 이 미션 범위에서 구현하지 않는다.
  //   여기서는 그 설정(항구를 통한 탈출)과 플래이버 원문만 각색해 표준 buildCombat
  //   objective-reduce(게이트 돌파)로 근사했다 — 실제 G-E01 메타 목표 판정 배선은
  //   캠페인 시스템 소관(미션 파일 범위 밖).
  // SIMPLIFIED — 관례: MISSION.kind/unlock 는 ch01~ch08·side-01~06 관례를 그대로 따르는
  //   신규 최상위 메타 필드(엔진 store.js/campaign.js 미소비, 순수 추가 데이터).
  // [통합 노트] 해금 = missionsDone 에 'ch03-martial-night' 포함. 적 로스터
  //   (POLICE_OFFICER/POLICE_DRONE)는 ch03-martial-night.js 와 동일한 계획 로스터 ID —
  //   아직 data/enemies.js 에 없음(통합 단계 소관), 이 파일은 계획 로스터 ID만 참조한다.
  // ==========================================================================

  // ---- 원전 산문 앵커 (quest-deck.md Q40/Q39 + ghost.md G-E01, 발췌·각색) -------
  var OPENING = [
    '비통제구역의 전언은 짧았다: "인간 밀입국 계약. NPC 한 명, 남항 F10 관문까지 살아서."', // [계승] Q40 의뢰인(비통제구역) + 목표문("NPC 1명을 맵 외부로 호송") 발췌
    '호송 대상은 손목에 낡은 저장매체 하나를 감고 있었다 — VANTA 감시망을 피해 여기까지 온 유출 파일이라고 했다.', // [계승] Q39 "정보 유출 파일" 목표문("물리적 저장 매체를 VANTA 감시 회피하며 운반") 결합
    '"발각되면 현상수배가 오른다." 접선책은 그렇게만 말했다. 이미 알고 있던 사실이었다.', // [계승] Q40 주의문("발각 시 캐릭터 현상수배 +3") 발췌
    '남항 F10. 도시가 끝나고 비통제구역이 시작되는 관문 중 하나.', // [계승] docs/10 §6 F10 "항구(남항)" 표 + §11.5 항구 8구역 "비통제구역 탈출 가능"
    '오늘 밤 그 관문이 봉쇄됐다. IRONWALL 외주 검문 순찰이 부두 전체를 메운다.', // [계승 ch03 정황] 공권력=IRONWALL 외주 → 검문 병력
    '누군가 묻는다: 어디 갔니? 그 질문이 내가 잘 갔다는 증거다.', // [그대로] ghost.md G-E01 "그리드 탈출" 플래이버 원문
    '거리는 이런 밤을 그렇게 부른다 — 항구 탈출로.',
  ];
  var STORY_CARD = '그날 밤, 남항 F10 관문이 뚫렸다. 기록엔 아무것도 남지 않았다 — 관문도, 이름도.';
  var REFRAIN = '누군가 묻는다: 어디 갔니? 그 질문이 내가 잘 갔다는 증거다.'; // [그대로] G-E01 플래이버 원문 재인용

  // ---- 전투 인카운터 (남항 F10 검문 게이트 6열 × 7행, 중편) ---------------------
  //  좌표 {x:열 0..5, y:행 0..6}. row0=상단(봉쇄 검문 게이트), row6=하단(부두 진입로).
  //  [계승 docs/10 §6/§11.5 F10 남항] 무대. cover=컨테이너·세관 부스 엄폐(wall 없음).
  var COMBAT = {
    cols: 6, rows: 7,
    playerStart: { x: 3, y: 6 },
    // 오브젝티브 = 봉쇄된 남항 검문 게이트 강행 돌파(threshold 누적 차감 = objective-reduce
    //  = 탈출-돌파). [계승 store applyHackObjective] CIPHER=HACK 해킹 / BLADE=ATK 강습 →
    //  둘 중 강한 축 자동 선택으로 양 클래스 완주. dataTB 0 = 추출이 아닌 돌파(로그 표기용).
    // 51차 밸런스: threshold 8→11 — 무피해 2R 러시(트리비얼) 방지(BLADE 2해킹턴 강제). 검문 순찰 3기라 위협 낮아 저HP 완주.
    objective: { x: 3, y: 0, threshold: 11, veil: 0, label: '남항 검문 게이트', dataTB: 0 },
    // [계승 G10 · 각색 raidThreshold] 위협 임계 + 증원(경보 시 1회 스폰) — 중편 페이싱. 51차: 7→8.
    threatCap: 8,
    reinforcement: { key: 'POLICE_DRONE', x: 0, y: 1 },
    walls: [],
    // [신규 docs/25 §3.4] 엄폐 플랫 보정: light=DEF+1, full=DEF+2. 부두 컨테이너 3 + 세관 부스 1(게이트 앞).
    cover: [
      { x: 1, y: 3, type: 'light' }, { x: 4, y: 3, type: 'light' }, { x: 2, y: 5, type: 'light' },
      { x: 3, y: 1, type: 'full'  },   // 게이트 직전 세관 부스 — 검문 최종 저지선 완전 엄폐
    ],
    // 적 배치 — key 는 data/enemies.js 참조(통합 단계에서 추가, ch03-martial-night.js
    //  와 동일 계획 로스터 ID 재사용). 전 적 물리 피해 가능(physImmune 없음) → 전멸=승리
    //  (BLADE 정면) MFU 보장, CIPHER 는 objective-reduce 로 게이트 돌파(대체 승리).
    enemies: [
      { key: 'POLICE_OFFICER', x: 1, y: 4 },   // 좌 검문 순찰
      { key: 'POLICE_OFFICER', x: 4, y: 4 },   // 우 검문 순찰
      { key: 'POLICE_DRONE',   x: 5, y: 2 },   // 상단 정찰 드론(게이트 사수)
    ],
  };

  // ---- 대화 그래프 (docs/25 §4.2 노드 스키마) ----------------------------------
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'CONTACT', portrait: 'ghost',
        text: OPENING.join('\n'),
        choices: [
          { label: '남항 F10 검문 게이트로 향한다', goto: 'approach' },
        ],
      },
      // ★심장 MFU 노드 — SPD 게이트(CIPHER 지름길) / DEF 게이트(BLADE 지름길, CHECKPOINT
      //  BRIBE 폴백)가 전투를 실제로 제거, 전투는 이중 승리(게이트 돌파/순찰 전멸) — 상단
      //  SIMPLIFIED·이중 승리 계보 참고.
      approach: {
        id: 'approach', speaker: 'IRONWALL', portrait: 'bloc',
        text: '남항 F10. 봉쇄 게이트 앞으로 컨테이너가 늘어서 있고, IRONWALL 외주 검문 순찰 둘이 ' +
              '통로를 막는다. 상공엔 정찰 드론 한 기가 부두 전체를 훑는다. 세관 부스 너머로 게이트 잠금 표시등이 붉게 깜박인다.\n' +
              '호송 대상이 뒤에서 낮게 숨을 고른다.',
        choices: [
          { label: '순찰을 제압하고 게이트를 강행 돌파한다',
            effect: { startCombat: { onWin: 'outro' } },
            desc: '검문 순찰과 전투 → 게이트 강행 돌파 (양 클래스 완주 · BLADE 강습/CIPHER 해킹 자동축, 이중 승리)',
          },
          { label: '[SPD 4] 검문 교대 타이밍에 호송 대상과 함께 질주한다',
            gate: { attr: 'spd', min: 4 }, show: 'gray',
            setFlags: { checkpointSprint: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'CIPHER(기본 SPD4) 직행 지름길 — 순찰 교대 틈으로 질주 통과, 전투 스킵. BLADE(SPD3)는 미충족 → 위 전투 경로로 폴백',
          },
          { label: '[CHECKPOINT BRIBE] ₵ 3로 검문을 1회 무력화한다',
            gate: { attr: 'def', min: 3 }, show: 'gray',
            setFlags: { checkpointBribed: true },
            // [SIMPLIFIED 보고①] 실판정=gate def3(폴백, BLADE 지름길). effect.spendNuyen:3 은
            //   향후 대화용 nuyen-지출 핸들러용 전방 호환 훅(현 store 무시). 라우팅은 goto 담당.
            effect: { skipCombat: true, spendNuyen: 3 }, goto: 'outro',
            desc: '[계승 chapter-03 CHECKPOINT BRIBE(₵3 검문 1회 무력화)] 설계 의도=₵3 지출. 현 엔진에선 BLADE 기본 DEF3 "몸으로 무력화" 폴백으로 대체(전투 스킵). CIPHER(DEF1)는 미충족 → 위 전투 경로로 폴백',
          },
        ],
      },
      // 세 출구 공통 아웃트로 — 전투/질주/뇌물 폴백 어느 경로든 결과는 같다(게이트 돌파).
      outro: {
        id: 'outro', speaker: 'GHOST', portrait: 'ghost',
        text: '게이트가 뚫린다. 호송 대상이 무너진 봉쇄선을 넘어 비통제구역 어둠 속으로 사라진다.\n' +
              STORY_CARD + '\n' + REFRAIN,
        onEnter: { setFlags: { harborRunDone: true } }, checkpoint: true,
        choices: [ { label: '비통제구역 경계를 넘어간다', goto: 'settle' } ],
      },
      settle: {
        id: 'settle', speaker: 'GHOST', portrait: 'ghost',
        text: '호송이 끝난다. 남항 F10의 기록엔 오늘 밤이 남지 않는다 — 게이트도, 이름도, 호송 대상도.\n' +
              '비통제구역은 새 얼굴 하나를 조용히 삼킨다. 거리는 벌써 다음 계약을 준비하고 있다.',
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (사이드 단편 — 챕터 대비 축소 보상) --------------------------
  var REWARDS = {
    rep: 2,
    karma: 1,
    nuyen: 8,
    unlocks: [],
  };

  var MISSION = {
    id: 'side-08-harbor-run',
    title: 'Side — Harbor Run',
    subtitle: '사이드 — 항구 탈출로 (남항 F10 검문 게이트 강행 돌파)',
    kind: 'side',                                     // SIMPLIFIED 상단 주석 참고 — 신규 메타 필드, 엔진 미소비.
    unlock: { missionsDone: ['ch03-martial-night'] },  // SIMPLIFIED 상단 주석 참고 — ch02~ch08/side-03 다수 관례 채택(통합 단계 배선 대상).
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,
    rewards: REWARDS,
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_SIDE08_HARBOR_RUN = API;
})();
