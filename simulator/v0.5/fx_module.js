'use strict';
// ============================================================================
// fx_module.js — v6.50 [75차] 이벤트 연출(표시층) 로직 모듈
//
//   협상 플래시 / S06 타이틀 스팅 / 레이스 HUD 추월·위험존 / NEXUS BAR 숫자 틱 의
//   "무엇을 언제 번쩍일지" 판별 로직만 담는다. 애니 자체는 index.html <style> 의
//   CSS(@keyframes negoFlash / titleStingIn / rmBump / rmHot / tickUp·tickDown)가 담당.
//
//   ▸ 표시층 계약 (엄수)
//     · 게임 상태를 절대 바꾸지 않는다 — dispatch·리듀서·판정 함수 호출 0.
//       입력 state 는 읽기 전용이고, 출력은 React setState(연출 플래그)뿐이다.
//     · 관찰 소스는 전부 이미 렌더가 쓰는 값 (state.log / meta.highlights /
//       hudRaceProgress / assetValue) — 새 계측·새 통화·새 수치 신설 없음.
//     · 따라서 sim-e2e/_unit.js 350건(규칙·판정 계약)은 이 파일과 무관하게 불변이다.
//
//   ▸ 배선 패턴 (euro_module / lore_module / legacy_module 과 동일)
//     · <script src> 로드 + DOMContentLoaded 자가복구 heal 로더 등록(index.html)
//     · 전역 window 노출, 소비처는 typeof 가드 → 미로드 시 연출만 빠지고 게임은 정상
//     · React 훅 호출(useState/useRef/useEffect)은 index.html 에 남겨 훅 순서를 고정.
//       이 모듈은 "이펙트 본문"만 제공하므로 미로드 시에도 훅 개수·순서가 변하지 않는다.
//
//   ▸ 이 파일이 babel 인라인 스크립트 밖에 있는 이유
//     index.html 의 <script type="text/babel"> 본문이 Babel 코드 생성기의 500,000자
//     임계에 근접해 있다(초과 시 "code generator has deoptimised" 콘솔 노티스 발생).
//     JSX 가 필요 없는 순수 로직은 일반 스크립트로 빼서 임계 여유를 되돌려 놓는다.
// ============================================================================

// 풀와이드 스팅으로 표면화할 하이라이트 키 — docs/14 §S06 특수 승리 루트(재건왕/청산자).
// 발동률이 1%대라 기존 하이라이트 로그 줄에 묻히던 것을 배너로 끌어올린다.
var DNFX_STING_KEYS = ['reconstructor', 'liquidator'];
function dnfx_isStingKey(k) { return DNFX_STING_KEYS.indexOf(k) >= 0; }

// 스팅 배너 페이로드 — 라벨·아이콘·보상 표기는 HIGHLIGHT_DEFS 단일 소스에서 읽는다
// (보상 ★ 지급은 recordHighlight 가 이미 수행 — 여기서는 그 결과를 표시만 한다).
function dnfx_stingPayload(key, playerIdx) {
  var d = (typeof HIGHLIGHT_DEFS !== 'undefined' && HIGHLIGHT_DEFS[key]) || {};
  return { key: key, icon: d.icon || '★', label: d.label || key, desc: d.desc || '', rep: d.rep || 0, playerIdx: playerIdx };
}

// ① 협상 성사/거절 플래시.
//   negoApply 가 남기는 로그 4종(거래 성사 / 비공격 약속 / BROKER 중개 / 협상 거절)에서
//   참여 좌석 번호를 뽑아 해당 카드에 단발 플래시를 건다. 성사=시안, 거절=마젠타.
//   로그는 이미 화면에 뿌려지는 값이라 새 계측을 만들지 않는다(계기판 정직화 유지).
function dnfx_nego(state, logRef, setNegoFx, later) {
  var log = state.log || [];
  if (!log.length) return;
  var top = log[log.length - 1];
  if (top === logRef.current) return;
  var at = log.indexOf(logRef.current);
  var fresh = at >= 0 ? log.slice(at + 1) : log.slice(-8);   // 참조 유실 시 최근 8건만 훑음
  logRef.current = top;
  var marks = {};
  for (var i = 0; i < fresh.length; i++) {
    var msg = (fresh[i] && fresh[i].message) || '';
    var no = msg.indexOf('협상 거절:') >= 0;
    if (!no && !/거래 성사:|비공격 약속:|BROKER 중개:/.test(msg)) continue;
    var toks = msg.match(/P\d+/g) || [];
    for (var j = 0; j < toks.length; j++) {
      var si = +toks[j].slice(1);
      if (state.players[si] && (no || !marks[si])) marks[si] = no ? 'no' : 'ok';
    }
  }
  var keys = Object.keys(marks);
  if (!keys.length) return;
  setNegoFx(function (p) { return { n: p.n + 1, marks: Object.assign({}, p.marks, marks) }; });
  later(function () {
    setNegoFx(function (p) {
      var m = Object.assign({}, p.marks);
      keys.forEach(function (k) { delete m[k]; });
      return { n: p.n, marks: m };
    });
  }, 900);
}

// ② S06 타이틀 스팅 — meta.highlights 에 재건왕/청산자가 새로 추가된 순간만 잡는다.
//   길이가 줄면(신규 판) 기준선만 갱신하고 발동하지 않는다.
function dnfx_sting(state, lenRef, show) {
  var hl = state.meta.highlights || [];
  var n0 = lenRef.current;
  lenRef.current = hl.length;
  if (hl.length <= n0) return;
  var fresh = hl.slice(n0).filter(function (h) { return h && dnfx_isStingKey(h.key); });
  if (fresh.length) show(fresh[fresh.length - 1].key, fresh[fresh.length - 1].playerIdx);
}

// ③ 레이스 HUD — 추월(순위 상승) 바운스 · 90%+ 위험 존 진입 순간 1회 펄스.
//   진척%는 상단 Race HUD 가 이미 쓰는 hudRaceProgress 그대로 — 별도 계산식 없음.
function dnfx_race(state, pctRef, setRaceFx, later) {
  if (state.meta.gameOver) return;
  if (typeof getVictoryGoals !== 'function' || typeof hudRaceProgress !== 'function') return;
  var vG = getVictoryGoals(state);
  var cur = {};
  state.players.forEach(function (p, i) { if (p && !p.isNpc && !p.defeated) cur[i] = hudRaceProgress(p, i, state, vG); });
  var prev = pctRef.current;
  pctRef.current = cur;
  if (!prev) return;
  // 동률 노이즈 방지: (진척% 내림차순, 좌석 오름차순) 결정적 정렬 → 실제 역전만 순위 변동으로 잡힌다.
  var rankOf = function (m) {
    var r = {};
    Object.keys(m).sort(function (a, b) { return m[b] - m[a] || (+a) - (+b); }).forEach(function (k, i) { r[k] = i; });
    return r;
  };
  var rp = rankOf(prev), rc = rankOf(cur), bump = {}, hot = {};
  Object.keys(cur).forEach(function (k) {
    if (prev[k] == null) return;
    if (rp[k] != null && rc[k] < rp[k]) bump[k] = true;      // 순위 상승 = 추월 발생
    if (cur[k] >= 90 && prev[k] < 90) hot[k] = true;         // 위험 존 진입 순간 (1회)
  });
  if (!Object.keys(bump).length && !Object.keys(hot).length) return;
  setRaceFx(function (p) { return { n: p.n + 1, bump: bump, hot: hot }; });
  later(function () { setRaceFx(function (p) { return { n: p.n, bump: {}, hot: {} }; }); }, 950);
}

// ④ NEXUS BAR 숫자 틱 — 크레딧·핵심지표(고스트 렙 / 블록 자산) 변동 방향 플래시(+녹/−적).
//   핵심지표 소스는 NEXUS BAR 가 표시하는 값과 동일(assetValue / resources.rep) — 정직성 유지.
function dnfx_bar(state, me, meIdx, prevRef, setBarFx, later) {
  if (!me) return;
  var cr = me.resources.credit || 0;
  var kv = me.role === 'ghost'
    ? (me.resources.rep || 0)
    : (typeof assetValue === 'function' ? assetValue(me, state.stocks, state) : 0);
  var prev = prevRef.current;
  prevRef.current = { cr: cr, kv: kv, idx: meIdx };
  if (!prev || prev.idx !== meIdx) return;                   // 핫시트 좌석 교대는 변동으로 치지 않음
  var dc = cr > prev.cr ? 'bb-up' : cr < prev.cr ? 'bb-dn' : null;
  var dk = kv > prev.kv ? 'bb-up' : kv < prev.kv ? 'bb-dn' : null;
  if (!dc && !dk) return;
  setBarFx(function (p) { return { n: p.n + 1, cr: dc, key: dk }; });
  later(function () { setBarFx(function (p) { return { n: p.n, cr: null, key: null }; }); }, 850);
}

if (typeof window !== 'undefined') {
  window.DNFX_STING_KEYS = DNFX_STING_KEYS;
  window.dnfx_isStingKey = dnfx_isStingKey;
  window.dnfx_stingPayload = dnfx_stingPayload;
  window.dnfx_nego = dnfx_nego;
  window.dnfx_sting = dnfx_sting;
  window.dnfx_race = dnfx_race;
  window.dnfx_bar = dnfx_bar;
}
