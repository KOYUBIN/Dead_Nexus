// ============================================================================
// DEAD NEXUS — simulator/v0.5 인터랙티브 가이드 튜토리얼 모듈 (BGA 스타일)
// HTML <script src> 로 로드. euro_module.js 와 동일한 글로벌 스코프 패턴.
//
// 순수 "표시 레이어": 게임 리듀서/규칙은 절대 변경하지 않는다. 이 모듈은
//   1) 현재 게임 상태(state)를 읽어 "지금 보여줄 코치마크 스텝"을 골라주고
//   2) 완료/스킵 여부를 localStorage 에 기록할 뿐이다.
//
// index.html 의 <TutorialOverlay/> 컴포넌트가 이 모듈의 데이터를 렌더만 한다.
// 모듈 미로드 시: index.html 은 typeof 가드로 아무것도 렌더하지 않음(무해).
//
// 발동 조건: 5×5 튜토리얼 맵 + 솔로 모드 + localStorage 'dn_tutorial_done' 없음.
//   11×11 · 핫시트(multi) · 봇 전용(bots)에서는 절대 발동하지 않는다.
// ============================================================================

// v6.10.1: 완료/스킵 플래그 저장 키
var TUTORIAL_KEY = 'dn_tutorial_done';

// localStorage 접근은 항상 try/catch (file:// · 프라이버시 모드 대비 — loadHistory 패턴)
function tutorial_isDone() {
  try {
    return !!localStorage.getItem(TUTORIAL_KEY);
  } catch (e) { return false; }
}
function tutorial_markDone() {
  try {
    localStorage.setItem(TUTORIAL_KEY, String(Date.now()));
  } catch (e) { /* 저장 실패해도 이번 세션 내부 상태로 계속 억제됨 */ }
}
// (테스트/개발용) 플래그 제거
function tutorial_reset() {
  try { localStorage.removeItem(TUTORIAL_KEY); } catch (e) {}
}

// 이 게임이 튜토리얼 대상인가? — 5×5 + 솔로 에서만 true (그 외 절대 미발동)
function tutorial_enabledFor(state) {
  var meta = state && state.meta;
  if (!meta) return false;
  return meta.mapSize === '5x5' && meta.mode === 'solo';
}

// 셋업 opts 로 자동 시작해야 하는지 (셋업 화면 → App.startGame 에서 사용)
//   5×5 + 솔로 + 사용자가 토글 끄지 않음 + 아직 완료/스킵 안 함
function tutorial_shouldAutoStart(opts) {
  if (!opts) return false;
  if (opts.mapSize !== '5x5' || opts.mode !== 'solo') return false;
  if (opts.tutorial === false) return false; // 셋업 토글 OFF
  return !tutorial_isDone();
}

// 안전한 상태 접근 헬퍼
function tut_round(s) { return (s && s.meta && s.meta.round) || 0; }
function tut_phase(s) { return (s && s.meta && s.meta.phase) || 0; }
function tut_me(s) { return (s && s.players && s.players[0]) || null; }
function tut_hasModal(s) {
  if (!s || !s.meta) return false;
  if (s.meta.pendingRaid) return true;
  var pd = s.meta.pendingDecisions;
  return !!(pd && pd.length > 0);
}
function tut_awaitingMove(s) { return !!(s && s.meta && s.meta.awaitingMoveTarget); }

// 내 역할별 승리 조건 문구 (5×5 기준 UI 표기값 — 렙 16 / 레이드 2 / 자산 55)
function tutorial_roleWinText(state) {
  var me = tut_me(state);
  var role = me && me.role;
  if (role === 'bloc') {
    return '당신은 🏢 BLOC — 메가기업입니다. 자산(📊)을 키워 55에 먼저 도달하면 승리해요. 자산 = 보유 현금 + 구역 가치 + 타 블록 주식 평가액.';
  }
  // ghost 기본
  return '당신은 👻 GHOST — 독립 용병입니다. 평판(★) 16 + 레이드 2회 성공을 모두 채우면 승리해요.';
}

// ============================================================================
// 스텝 정의 — 최소 8개. 순서대로 정의(먼저 정의된 스텝이 먼저 노출됨).
//   { id, trigger(state)->bool, title, body(문자열 | (state)->문자열), anchor, final? }
//   anchor: 화면 "영역" 프리셋 — 'center' | 'bottom' | 'left' | 'right' | 'map'
//     (취약한 요소 좌표 측정 대신 고정 프리셋 위치 사용)
//   final: true 인 스텝을 [다음]으로 닫으면 튜토리얼 완료 처리(localStorage 기록).
// 각 스텝은 "한 번만" 노출된다(오버레이가 seen 집합으로 관리).
// ============================================================================
var TUTORIAL_STEPS = [
  {
    id: 'welcome',
    anchor: 'center',
    trigger: function (s) { return tut_round(s) === 1; },
    title: '🎓 DEAD NEXUS 첫 판 가이드',
    body: function (s) {
      return tutorial_roleWinText(s) +
        '\n\n첫 판을 함께 진행하며 필요한 순간마다 짧게 설명할게요. 오른쪽 아래 [건너뛰기]로 언제든 종료할 수 있어요.';
    },
  },
  {
    id: 'market',
    anchor: 'bottom',
    trigger: function (s) { return tut_round(s) === 1 && tut_phase(s) === 1; },
    title: '📊 시장 페이즈',
    body: '아래 시장에서 각 블록 주식을 매수/매도할 수 있어요.\n\n핵심: 자산으로 인정되는 건 "타 블록" 주식뿐이에요. 자사(★) 주식은 거래할 수 없습니다. 거래를 마치면 [▶ 거래 끝 / 계획 단계로]를 누르세요.',
  },
  {
    id: 'plan',
    anchor: 'bottom',
    trigger: function (s) { return tut_round(s) === 1 && tut_phase(s) === 2; },
    title: '🗂 계획 페이즈',
    body: '손패에서 카드 2장을 고르세요. 각 카드는 위/아래 두 반쪽으로 나뉘어요.\n\n▲ TOP(윗반쪽) 또는 ▼ BOT(아랫반쪽) 중 하나만 사용됩니다. 원하는 반쪽을 눌러 선택한 뒤 계획을 확정하세요.',
  },
  {
    id: 'move',
    anchor: 'map',
    trigger: function (s) { return tut_awaitingMove(s); },
    title: '🎯 이동',
    body: '지도에서 노란 ◎ 표시가 이동 가능한 칸이에요. 원하는 칸을 클릭해 이동하세요.\n\n직접 정하기 어렵다면 [AI에게 맡기기]를 눌러도 됩니다.',
  },
  {
    id: 'modal',
    anchor: 'bottom',
    trigger: function (s) { return tut_hasModal(s); },
    title: '🎲 판정 · 선택',
    body: '레이드·결투·보상처럼 결과가 갈리는 상황이에요. 자원을 더 투자하면 성공 확률이 오르지만, 그만큼 소모도 커집니다.\n\n표시된 확률과 트레이드오프를 보고 선택하세요. 안전과 기대값 사이의 판단이 이 게임의 핵심이에요.',
  },
  {
    id: 'income',
    anchor: 'right',
    trigger: function (s) { return tut_round(s) === 1 && tut_phase(s) === 4; },
    title: '💰 수익 페이즈',
    body: '이번 라운드 수입이 정산돼요. 점유한 구역에서 수입이 들어오고, 카드로 모은 개인 속성 풀(◈)도 여기 반영됩니다.\n\n오른쪽 패널에서 내 자원과 풀 변화를 확인하세요.',
  },
  {
    id: 'progress',
    anchor: 'left',
    // 수익(phase 4)은 ~1.2초 뒤 자동 진행되므로 창을 넓게 잡아 income 직후 확실히 이어짐.
    // R2 시작 시점(round>=2)까지 열어두어 놓쳐도 wrap 직전에 반드시 1회 노출.
    trigger: function (s) { return (tut_round(s) === 1 && tut_phase(s) >= 4) || tut_round(s) >= 2; },
    title: '🏁 승리 진척',
    body: '왼쪽 P0(=나) 카드의 진척 바에서 남은 목표를 항상 확인할 수 있어요.\n\nGhost는 "렙 x/16 · 레이드 x/2", Bloc은 "자산 x/55"로 표시됩니다. 매 라운드 이 수치를 보며 무엇에 집중할지 정하세요.',
  },
  {
    id: 'wrap',
    anchor: 'center',
    final: true,
    trigger: function (s) { return tut_round(s) >= 2; },
    title: '🎉 기본은 다 배웠어요',
    body: function (s) {
      var me = tut_me(s);
      var goal = (me && me.role === 'bloc')
        ? '남은 라운드 동안 자산 55 도달을 노리세요.'
        : '남은 라운드 동안 평판 16 + 레이드 2회를 완성하세요.';
      return '시장 → 계획 → 이동 → 판정 → 수익의 한 라운드를 마쳤어요. 이제 흐름은 반복됩니다.\n\n' + goal + '\n\n행운을 빌어요! (이 가이드는 다시 표시되지 않습니다.)';
    },
  },
];

// 현재 상태에서 "아직 안 본" 스텝 중 trigger 가 참인 첫 스텝을 반환 (없으면 null)
//   seenIds: Set 또는 배열 (id 목록). 5×5 솔로가 아니거나 완료됐으면 항상 null.
function tutorial_pickStep(state, seenIds) {
  if (!tutorial_enabledFor(state)) return null;
  if (tutorial_isDone()) return null;
  var has = function (id) {
    if (!seenIds) return false;
    if (typeof seenIds.has === 'function') return seenIds.has(id);
    return seenIds.indexOf(id) !== -1;
  };
  for (var i = 0; i < TUTORIAL_STEPS.length; i++) {
    var step = TUTORIAL_STEPS[i];
    if (has(step.id)) continue;
    var ok = false;
    try { ok = !!step.trigger(state); } catch (e) { ok = false; }
    if (ok) return step;
  }
  return null;
}

// 스텝 본문/제목을 실제 문자열로 (body 가 함수면 state 적용)
function tutorial_resolveText(step, state) {
  if (!step) return '';
  return (typeof step.body === 'function') ? step.body(state) : step.body;
}

// ---- export: 브라우저(window) + node(module.exports) 양쪽 ----
if (typeof window !== 'undefined') {
  window.TUTORIAL_STEPS = TUTORIAL_STEPS;
  window.tutorial_pickStep = tutorial_pickStep;
  window.tutorial_resolveText = tutorial_resolveText;
  window.tutorial_enabledFor = tutorial_enabledFor;
  window.tutorial_shouldAutoStart = tutorial_shouldAutoStart;
  window.tutorial_isDone = tutorial_isDone;
  window.tutorial_markDone = tutorial_markDone;
  window.tutorial_reset = tutorial_reset;
  window.tutorial_roleWinText = tutorial_roleWinText;
  window.TUTORIAL_KEY = TUTORIAL_KEY;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    TUTORIAL_STEPS: TUTORIAL_STEPS,
    tutorial_pickStep: tutorial_pickStep,
    tutorial_resolveText: tutorial_resolveText,
    tutorial_enabledFor: tutorial_enabledFor,
    tutorial_shouldAutoStart: tutorial_shouldAutoStart,
    tutorial_isDone: tutorial_isDone,
    tutorial_markDone: tutorial_markDone,
    tutorial_reset: tutorial_reset,
    tutorial_roleWinText: tutorial_roleWinText,
    TUTORIAL_KEY: TUTORIAL_KEY,
  };
}
