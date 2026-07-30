;(function () {
  'use strict';
  // ==========================================================================
  // data/missions/a3-02-interest.js — [신규 v6.54] ACT 3 메인 2 "INTEREST"
  //   이자 — 상환 청구가 코어텍스 인증망으로 내려온다. 값은 사람 단위로 매겨진다.
  //   (엔진 무편집 콘텐츠. 포맷 정본 = a2-c2-signal-war(2연전). 순수 리터럴.)
  // ──────────────────────────────────────────────────────────────────────────
  // 계보 표:
  //   [신규] Act 3 메인 체인 2번 — a3-01 이 확인한 담보 목록의 5번 항목("등록 시민 전원의
  //          접속 권한")에 실제로 청구가 걸리는 장. 부채가 추상에서 신체로 내려온다.
  //   [계승 docs/01 §2060년대] "모든 시민은 코어텍스 와이어 이식을 의무화받는다 (HELIX 계약).
  //          메시를 통해 신원·자산·의료·위치가 상시 추적된다." — 상환 청구가 HELIX 인증망을
  //          타고 집행된다는 설정은 이 원전 계약 구조의 직접 귀결이다.
  //   [계승 docs/01 §스플라이스 부작용] 과도한 부하 → 정체성 붕괴(사이버사이코시스) 모티프를
  //          "대역 압류로 인한 인지 지연"으로 각색(신규 메커닉 0 · 산문 표현만).
  //   [계승 ch04-price-of-splice · a2-side-mole-whoami] HELIX 무대·로스터(HELIX_MEDIC/
  //          SPLICE_HOUND) 재사용 — Act1 의 시술소 무대축을 Act3 상환 창구로 재조명.
  //   [계승 §3.1 · a2 메인 관례] 2연전 — enc① = MISSION.combat / enc② = encounters.stage2.
  //   [계승 chapter-05 §2 · ending.js] 화자 SIGNAL — 이번엔 조력자가 아니라 **채무 항목**.
  // 순수 데이터 — DOM/리액트 참조 0. 텍스트/좌표/수치 리터럴만.
  // ──────────────────────────────────────────────────────────────────────────
  // SIMPLIFIED: SIGNAL_ICE(SHADE·physImmune·hackOnly)는 상환 코어 앞 정적 방벽 — 필수 처치 대상
  //   아님(ai 'static'). 코어 인접 링 4타일 중 1타일만 점유하므로 **봉인 코어가 아니다**
  //   (물리 클래스도 인접 진입 가능 → objective-reduce 완주). side-02 의 봉인 격자와 구분.
  // SIMPLIFIED: [HELIX 태그] 게이트 — classes.js MOLE tags 에 HELIX 존재(67차) → MOLE 실개방.
  //   그 외 클래스는 회색 → 폴백 전투 상존(6클래스 완주 보장).
  // SIMPLIFIED: 상환 방식 선택(interestChoice)은 flag 영속만 — 엔진 자원/스탯에 영향 없음.
  // ==========================================================================

  // ---- 원전 산문 앵커 (docs/01 코어텍스 의무 이식 + a3-01 담보 5번 항목) ----------
  var OPENING = [
    '이자는 원금보다 먼저 온다. 그리고 이자는 언제나 가장 약한 항목부터 뜯는다.', // [신규] 주제 진술
    '[SILK] "담보 목록 5번 — 등록 시민 전원의 접속 권한. 오늘 아침부터 그 항목에 청구가 걸렸어."', // [계승] a3-01 목록
    '2065년 이후 애시그리드의 모든 시민은 코어텍스 와이어를 이식받는다. HELIX 계약. 거부는 선택지에 없었다.', // [계승 docs/01 §2060년대]
    '[SILK] "그 인증망이 지금 상환 창구로 돌아가고 있어. 시민 한 명당 대역을 조금씩 걷어서 채권자한테 넘기는 중이야."', // [신규] 상환 집행
    '슬럼의 진료소 대기줄이 길다. 사람들은 이유를 모른 채 어지럽고, 말이 늦고, 자기 이름을 한 박자 늦게 떠올린다.', // [계승 docs/01 §스플라이스 부작용] 각색
    '[SIGNAL] "저건 내 빚이야." SIGNAL 의 목소리가 갈라진다. "내가 당겨 쓴 대역을, 저들이 사람들한테서 회수하고 있어."', // [계승] a2-99 SIGNAL 부채
  ];
  var STORY_CARD = '상환 창구 로그: "회수 단위 = 시민 1인. 회수 방식 = 인지 대역 0.4%. 대상자 통지 = 불필요." — HELIX 인증망 집행 기록 (SIGNAL 가로챔)';
  var REFRAIN = '값은 언제나 사람 단위로 매겨진다. 장부가 사람을 항목으로 적는 순간, 이미 절반은 팔린 것이다.';

  // ---- 전투 인카운터 ① = MISSION.combat (HELIX 상환 창구 7열 × 8행) --------------
  //  좌표 {x:열 0..6, y:행 0..7}. row0=상단(상환 창구 단말), row7=하단(대기줄 진입).
  //  [계승 ch04 HELIX 시술소 무대축] wall=격리 커튼 레일, cover=진료 카트/약품 캐비닛.
  var COMBAT = {
    cols: 7, rows: 8,
    playerStart: { x: 3, y: 7 },
    objective: { x: 3, y: 0, threshold: 9, veil: 0, label: '코어텍스 상환 창구', dataTB: 2.4 },
    threatCap: 9,
    walls: [
      { x: 1, y: 4 }, { x: 5, y: 4 },
    ],
    cover: [
      { x: 2, y: 5, type: 'light' }, { x: 4, y: 5, type: 'light' }, { x: 3, y: 6, type: 'full' },
      { x: 2, y: 3, type: 'light' }, { x: 4, y: 3, type: 'light' }, { x: 3, y: 0, type: 'light' },
    ],
    // 적 배치 — 집행 창구. HELIX_MEDIC(BIO 집행 의료병) + SPLICE_HOUND(BIO 고속 근접) +
    //   ASSESSOR(MESH 사정관 · 회수량 감정). 전 적 killable → 전멸/오브젝티브 이중 승리(MFU).
    enemies: [
      { key: 'HELIX_MEDIC',       x: 3, y: 3 },
      { key: 'SPLICE_HOUND',      x: 1, y: 2 },
      { key: 'MERIDIAN_ASSESSOR', x: 5, y: 2 },
    ],
  };

  // ---- 전투 인카운터 ② = MISSION.encounters.stage2 (코어텍스 상환 코어) -----------
  //  [계승 §3.1] 2연전 2번째 무대. combat 동일 스키마. HP 리필(interlude 숨 고르기).
  var ENCOUNTERS = {
    stage2: {
      cols: 7, rows: 8,
      playerStart: { x: 3, y: 7 },
      // 오브젝티브 = 상환 코어(threshold 10 · veil 1 = 유효 임계 11).
      objective: { x: 3, y: 0, threshold: 10, veil: 1, label: '코어텍스 상환 코어', dataTB: 5.0 },
      threatCap: 11,
      // [카탈로그] 증원 MERIDIAN_DRONE(경보 1회 스폰) — 회수 라인 보호.
      reinforcement: { key: 'MERIDIAN_DRONE', x: 6, y: 1 },
      walls: [
        { x: 2, y: 4 }, { x: 4, y: 4 },
      ],
      cover: [
        { x: 1, y: 5, type: 'light' }, { x: 5, y: 5, type: 'light' },
        { x: 3, y: 6, type: 'full' }, { x: 2, y: 6, type: 'light' }, { x: 4, y: 6, type: 'light' },
        { x: 1, y: 2, type: 'light' }, { x: 5, y: 2, type: 'light' },
      ],
      // 적 배치 — SIGNAL_ICE(코어 앞 정적 방벽 · HACK 전용 · 링 1타일만 점유 = 봉인 아님) +
      //   COLLECTOR(추심관 · killable) + HELIX_MEDIC(집행 의료병). 코어 objective-reduce 로 전 클래스 완주.
      enemies: [
        { key: 'SIGNAL_ICE',         x: 3, y: 1 },
        { key: 'MERIDIAN_COLLECTOR', x: 3, y: 2 },
        { key: 'HELIX_MEDIC',        x: 5, y: 3 },
      ],
    },
  };

  // ---- 대화 그래프 (2연전: approach→[전투①]→interlude→[전투②]→outro→choice→settle) --
  var DIALOGUE = {
    start: 'intro',
    nodes: {
      intro: {
        id: 'intro', speaker: 'SIGNAL', portrait: 'ghost',
        quote: 'SIGNAL',                       // loreQuote(SIGNAL)→null(무해). 발화는 산문 [각색].
        text: OPENING.join('\n'),
        choices: [
          { label: '슬럼 진료소 상환 창구로 들어간다 — 청구를 멈춘다', goto: 'approach' },
        ],
      },
      // ★enc① MFU 노드 — 전투① / [DEF 3] 지름길. 둘 다 interlude 합류.
      approach: {
        id: 'approach', speaker: 'SIGNAL', portrait: 'ghost',
        text: '진료소 안쪽, 상환 창구 단말이 대기줄을 한 명씩 삼킨다. 삼킨 뒤 돌려보내는데, 돌아 나오는 사람들은 조금씩 느리다.\n' +
              'HELIX 집행 의료병이 줄을 관리하고, 스플라이스 하운드가 이탈자를 쫓는다. 사정관은 회수량을 세고 있다.\n' +
              '[SIGNAL] "저 단말을 멈춰. 저건 치료 기계 껍데기를 쓰고 있지만, 안에서 도는 건 회수 코드야."',
        choices: [
          { label: '집행 인원을 밀어내고 창구 단말을 끊는다',
            effect: { startCombat: { onWin: 'interlude' } },
            setFlags: { counterForced: true },
            desc: 'enc① HELIX_MEDIC + SPLICE_HOUND + ASSESSOR 와 전투 → 상환 창구 정지 (공통 폴백, 6클래스 완주 가능)',
          },
          { label: '[DEF 3] 대기줄에 섞여 하운드의 추격을 몸으로 흘리며 단말에 닿는다',
            gate: { attr: 'def', min: 3 }, show: 'gray',
            setFlags: { counterEndured: true },
            effect: { skipCombat: true }, goto: 'interlude',
            desc: '고DEF(BLADE/RIGGER/MOLE) → 추격 화력을 흘리며 단말 직행(지름길). 저DEF(CIPHER/BROKER/DRIFTER)는 잠김 → 전투 폴백',
          },
        ],
      },
      // ★2연전 전환 interlude — 서사 전환 + enc② 게이트. [계승 §3.1] encounter:'stage2' 소비.
      interlude: {
        id: 'interlude', speaker: 'SIGNAL', portrait: 'ghost',
        text: '창구 하나를 끊자 로그가 통째로 열린다. 창구는 말단이었다 — 회수는 인증망 상환 코어에서 돌고 있었다.\n' +
              STORY_CARD + '\n' +
              '[SILK] "1인당 0.4%. 사람들은 눈치도 못 채. 그게 이 방식의 요점이야 — 아무도 항의하지 않는 크기로 뜯는 것."\n' +
              '[SIGNAL] "코어 앞에 신호 얼음이 있어. 그리고 추심관 하나. 저건 내 몫의 빚을 사람들한테 나눠 넣는 손이야."',
        choices: [
          { label: '추심관을 넘어 상환 코어를 정지시킨다',
            effect: { startCombat: { encounter: 'stage2', onWin: 'outro' } },
            setFlags: { repaymentEngaged: true },
            desc: 'enc② SIGNAL_ICE + COLLECTOR + HELIX_MEDIC(증원 DRONE)와 전투 → 상환 코어 정지 (공통 폴백, 6클래스 완주)',
          },
          { label: '[HACK 5] 신호 얼음을 판독해 상환 코어의 회수 코드를 직접 뒤집는다',
            gate: { attr: 'hack', min: 5 }, show: 'gray',
            setFlags: { repaymentDecoded: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'HACK5(CIPHER) → SIGNAL_ICE 판독 후 회수 코드 역전(지름길). 저HACK 클래스는 잠김 → 전투 폴백',
          },
          { label: '[HELIX 태그] 인증망 원본 신분으로 상환 절차를 정지 처리한다',
            gate: { tag: 'HELIX' }, show: 'gray',
            setFlags: { repaymentSuspended: true },
            effect: { skipCombat: true }, goto: 'outro',
            desc: 'MOLE 원본 신분(HELIX 태그 · 67차) → 정규 절차로 상환 정지(지름길). 태그 미보유 클래스는 회색 → 전투 폴백',
          },
        ],
      },
      // 전투②/우회 공통 아웃트로 — 상환 코어 정지, 그러나 부채는 남는다.
      outro: {
        id: 'outro', speaker: 'SIGNAL', portrait: 'ghost',
        text: '상환 코어가 멈춘다. 인증망 전체에서 회수 라인이 한 줄씩 끊기고, 대기줄의 사람들이 조금씩 제 속도를 되찾는다.\n' +
              '[SILK] "멈춘 건 회수야. 채무가 아니라. 이자는 계속 붙어 — 어디선가는 갚아야 해."\n' +
              '[SIGNAL] "그럼 내가 갚을게. 원래 내 빚이야." 도시 관리 지능이, 처음으로 자기 몫을 말한다.',
        onEnter: { setFlags: { repaymentStopped: true, act3Interest: true } }, checkpoint: true,
        choices: [ { label: '누가 이자를 지불할지 정한다', goto: 'choice' } ],
      },
      // ★플레이어 선택 — 이자의 지불 주체. 영속 flag(엔진 자원 무영향).
      choice: {
        id: 'choice', speaker: 'SILK', portrait: 'ghost',
        text: '"이자는 사라지지 않아. 옮겨질 뿐이지. 두 가지 방법이 있어."\n' +
              '분산: 도시 전체가 아주 조금씩 나눠 낸다. 아무도 크게 다치지 않지만, 모두가 조금씩 느려진다.\n' +
              '절단: SIGNAL 의 대역을 잘라 그 몫으로 갚는다. 도시는 온전하고, SIGNAL 은 작아진다.',
        choices: [
          { label: 'A. 도시 전체에 분산한다 — 모두가 조금씩 진다',
            setFlags: { interestChoice: 'spread', debtSpread: true },
            effect: { rep: 2 }, goto: 'settle',
            desc: '렙 +2 · 부담을 도시가 공유한다. 아무도 혼자 무너지지 않는다 (영속 flag)',
          },
          { label: 'B. SIGNAL 의 대역을 잘라 갚는다 — 빚진 자가 낸다',
            setFlags: { interestChoice: 'sever', signalThrottled: true },
            effect: { karma: 1 }, goto: 'settle',
            desc: 'karma +1 · SIGNAL 이 자기 몫을 진다. 도시는 온전하고, 목소리는 작아진다 (영속 flag)',
          },
        ],
      },
      settle: {
        id: 'settle', speaker: 'SILK', portrait: 'ghost',
        text: 'Act 3 — Interest. 이자 청구가 멈췄다. 진료소 대기줄이 짧아지고, 사람들이 자기 이름을 제때 떠올린다.\n' +
              '[SILK] "이제 원금이 남았어. 원금 회수는 조용하지 않아 — 저들은 도시를 통째로 인도받으러 올 거야."\n' +
              '[SIGNAL] "그럼 결제일에 만나야겠네."\n' + REFRAIN,
        onEnter: { applyRewards: true }, checkpoint: true,
        choices: [ { label: '안전가옥으로 귀환한다', effect: { returnHub: true } } ],
      },
    },
  };

  // ---- 귀환 정산 (Act3 메인 2 · 2연전 스케일) ------------------------------------
  var REWARDS = {
    rep: 9,
    karma: 3,
    nuyen: 18,
    unlocks: [],
  };

  var MISSION = {
    id: 'a3-02-interest',
    title: 'Act 3 — Interest',
    subtitle: 'ACT 3 메인 2 — 코어텍스 상환망 (HELIX 슬럼 진료소 · 2연전 · 회수 집행)',
    kind: 'act3',
    unlock: { missionsDone: ['a3-01-collateral'] },
    opening: OPENING, storyCard: STORY_CARD, refrain: REFRAIN,
    dialogue: DIALOGUE,
    combat: COMBAT,           // enc①
    encounters: ENCOUNTERS,   // enc②(stage2) — 상환 코어
    rewards: REWARDS,
    nextHint: '다음: Act 3 종결 "Settlement Day" — 원금 회수. 청산인이 인도 서명을 받으러 온다.',
  };

  var API = { MISSION: MISSION };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (typeof window !== 'undefined') window.RPG_MISSION_A3_02_INTEREST = API;
})();
