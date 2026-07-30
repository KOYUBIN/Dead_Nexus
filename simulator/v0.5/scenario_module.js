'use strict';
// ============================================================================
// scenario_module.js — v6.53 시나리오 룰 엔진 모듈
//
//   ▸ 담는 것
//     · S07 「블랙아웃 카스케이드」 정전 연쇄 엔진 (blackout_*) — 신규
//     · S06 재건왕/청산자 판정 헬퍼 (s06MarkCrashBottom / s06CheckReconstructor /
//       s06NoteLiquidation) — index.html babel 인라인에서 **이전**(동작·이름 불변)
//     · initGame 시작조건 훅 (applyScenarioInit / nearestUnownedZone) — 동일하게 이전
//
//   ▸ 이 파일이 babel 인라인 스크립트 밖에 있는 이유 (fx_module / rules_module 과 동일)
//     index.html 의 <script type="text/babel"> 본문이 Babel 코드 생성기의 500,000자
//     deopt 임계에 근접해 있다. JSX 가 필요 없는 순수 규칙 로직은 일반 스크립트로 빼서
//     인라인 블록을 줄인다. S07 신설분은 전량 이 파일에 두고, 기존 인라인 S06/init 훅까지
//     함께 옮겨 인라인 블록을 순감(net negative)시킨다.
//
//   ▸ 배선 패턴 (fx_module / rules_module 과 동일)
//     · <script src> 로드 + DOMContentLoaded 자가복구 heal 로더 등록(index.html)
//     · 전역 window 노출, 소비처는 typeof 가드 → 미로드 시 항등 폴백 + E13 배너 표기
//     · babel 인라인 전역(scenarioRule / recordHighlight / logEntry)은 호출 시점 지연
//       참조 — 로드 순서 무관, file:// 상대경로 일반 스크립트로 동작
//
//   ▸ 외부 요청 0 — 이 파일은 fetch/XHR/WebSocket 을 일절 쓰지 않는다.
// ============================================================================

// ============================================================================
// S07 「블랙아웃 카스케이드」 — 도시 인프라 붕괴 연쇄 (docs/14 확장 슬롯)
//
//   정체성: 무작위가 아니라 **공표된 시간표**대로 구역이 꺼진다. 순서를 아는 쪽이 도시를
//   갖는다 — S04(경찰 랜덤 배치)·S06(주가 붕괴)과 달리 S07 의 위협은 완전 결정론적이고
//   따라서 **계획 가능**하다. Ghost 는 어둠(방어 약화)을 타고, Bloc 은 복구 인프라를 쥔다.
//
//   [설계 판단 — 이동 차단을 넣지 않은 이유]
//     원안은 "정전 구역이 수입·이동·레이드를 막는다"였다. 이동 차단만 채택하지 않았다:
//     ① 봇 이동은 findRaidTargetZone/BFS 가 목표 좌표를 잡고 스텝 예산만큼 걸어가는 구조라,
//        셀을 통행 불가로 만들면 목표 도달 불능 상태에서 매 라운드 제자리 걸음이 발생한다
//        (경로 재탐색 계층이 없다).
//     ② docs/14 §S04 의 교훈 — 구출 퀘스트는 배선됐지만 봇이 목표화하지 않아 전원 구출 0%.
//        봇이 모델링하지 않는 **선택적·차단형** 시스템은 죽은 콘텐츠가 된다.
//     그래서 S07 의 모든 정체성 룰은 **자동·구조적**으로(수입 정산·방어 임계·라운드 훅)
//     작동하게 설계했다. 이동 축은 "정전 구역은 오히려 뚫린다"(방어 −2)로 뒤집어 표현한다.
//
//   [결정론적 캐스케이드 순서 — 18칸]
//     중앙(NEXUS F6)에서 시작해 NW/NE·SW/SE 를 **좌우 대칭 쌍**으로 번갈아 무너뜨린다.
//     대칭 = 특정 Bloc 만 얻어맞지 않는다는 밸런스 보증. 5개 Bloc 의 HQ·support 좌표
//     (C2·B2·C1 / I2·I1·J2 / F4·F3·E4 / C10·B10·C11 / I10·J10·I11)는 **전부 제외** —
//     시작 자산을 직접 깎지 않고 "확장 경로"만 압박한다.
// ============================================================================
var BLACKOUT_ORDER = [
  'F6', 'F5',    // R2 — 중앙 변전소(NEXUS)와 그 남측 무기고
  'C4', 'I4',    // R3 — NW/NE 유흥가 (대칭 쌍)
  'C8', 'I8',    // R4 — SW/SE 유흥가 (대칭 쌍)
  'F7', 'E6',    // R5 — 중앙 확산
  'B3', 'J3',    // R6 — NW/NE 공업지구
  'B9', 'J9',    // R7 — SW/SE 공업지구
  'F2', 'F10',   // R8 — 남북 축 주택가
  'A6', 'K6',    // R9 — 동서 축 금융가
  'D6', 'H6',    // R10 — 중앙 데이터허브 마무리
];

// 좌표(열문자+행숫자)의 4방 인접 칸 중 owner 소유가 하나라도 있는가 — 복구 자격 판정용.
function blackout_adjacentTo(map, coord, owner) {
  var col = coord.charCodeAt(0), row = parseInt(coord.slice(1), 10);
  var cand = [
    String.fromCharCode(col - 1) + row, String.fromCharCode(col + 1) + row,
    String.fromCharCode(col) + (row - 1), String.fromCharCode(col) + (row + 1),
  ];
  for (var i = 0; i < cand.length; i++) {
    var c = map[cand[i]];
    if (c && c.owner === owner) return true;
  }
  return false;
}

// 시나리오 룰 조회 — index.html 의 scenarioRule 을 호출 시점에 지연 참조(미로드 시 fallback).
function blackout_rule(state, key, fallback) {
  return (typeof scenarioRule === 'function') ? scenarioRule(state, key, fallback) : fallback;
}

// 이 판이 S07(정전 캐스케이드)인가. 타 시나리오는 blackoutCascade 미지정 → false → 전 헬퍼 항등.
function blackout_active(state) {
  return blackout_rule(state, 'blackoutCascade', false) === true;
}

// 캐스케이드 총 길이 — 셋업 안내 문구가 실제 상수를 참조하기 위한 노출점.
function blackout_orderLen() { return BLACKOUT_ORDER.length; }

// 라운드 R 종료 시점까지 "정전 예정"인 누적 칸 수 (복구·경화 반영 전 스케줄 값).
//   R < blackoutStart → 0. 이후 라운드당 blackoutPerRound 칸씩, 순서 배열 길이에서 캡.
function blackout_scheduled(state, round) {
  if (!blackout_active(state)) return 0;
  var start = blackout_rule(state, 'blackoutStart', 2);
  var per = blackout_rule(state, 'blackoutPerRound', 2);
  if (round < start) return 0;
  return Math.min(BLACKOUT_ORDER.length, (round - start + 1) * per);
}

// 현재 정전 중인 좌표 집합 { coord: true } — 없으면 null (호출부가 falsy 로 분기).
function blackout_darkSet(state) {
  var bo = state && state.meta && state.meta.blackout;
  return (bo && bo.dark && Object.keys(bo.dark).length) ? bo.dark : null;
}
function blackout_isDark(state, coord) {
  var d = blackout_darkSet(state);
  return !!(d && d[coord]);
}
function blackout_darkCount(state) {
  var d = blackout_darkSet(state);
  return d ? Object.keys(d).length : 0;
}
// 복구 완료(경화)된 좌표 수 — HUD·유닛 검증용.
function blackout_hardenedCount(state) {
  var bo = state && state.meta && state.meta.blackout;
  return (bo && bo.hardened) ? Object.keys(bo.hardened).length : 0;
}

// ----------------------------------------------------------------------------
// 라운드 훅 — NEXT_ROUND 에서 1회 호출. 세 가지를 순서대로 처리한다.
//   ① 캐스케이드 진행: 스케줄상 이번 라운드까지 꺼져야 할 칸을 순서대로 소등.
//      이미 복구(경화)된 칸은 건너뛴다 — "복구 인프라 장악"의 영속 보상.
//   ② Bloc 복구 정산: 정전 구역을 소유한 실참 Bloc 이 부품 blackoutRepairParts 를 보유하면
//      자동 지불하고 점등 + 크레딧 blackoutRepairCredit 획득 + 해당 칸 영구 경화.
//      (자동인 이유 = 위 §설계 판단 ② — 봇이 목표화하지 않는 선택 액션은 죽는다.)
//   ③ 붕괴 압력: 정전 칸이 blackoutHeatPer 의 새 배수를 넘을 때마다 공권력 +1 (계단식·상한 10).
//      복구로 정전이 줄면 다음 단계 상승이 막힌다 → Bloc 의 복구 동기가 도시 전체 이해와 정렬.
//
//   타 시나리오는 ①에서 blackout_active(false) → 인자 state 를 그대로 반환(참조 동일 항등).
//   소등 표기는 맵 셀에 직접 실어 둔다:
//     cell.blackout = true      → 수입 0 판정 · 맵 표시
//     cell.boDef    = <음수>    → raidDefenseBonus 가 그대로 합산 (표시=판정 단일 소스)
//   방어 델타를 셀에 싣는 이유: raidThreshold(cell) 은 state 를 받지 않는다. 셀에 실으면
//   판정 2경로(봇·카드효과)와 표시 3경로(모달·맵 프리뷰·우측 패널)가 **자동으로 같은 값**을
//   읽는다 — 호출부를 하나도 늘리지 않고 v6.51 표시=판정 계약을 구조적으로 만족.
// ----------------------------------------------------------------------------
function blackout_advance(state) {
  if (!blackout_active(state)) return state;
  var round = (state.meta && state.meta.round) || 0;
  var bo = (state.meta && state.meta.blackout) || { dark: {}, hardened: {}, repaired: 0 };
  var dark = Object.assign({}, bo.dark || {});
  var hardened = Object.assign({}, bo.hardened || {});
  var map = Object.assign({}, state.map);
  var defMod = blackout_rule(state, 'blackoutRaidMod', 0);
  var s = state;
  var lit = [];

  // ① 캐스케이드 — 스케줄 누적 칸 수만큼 순서대로 소등 (경화 칸은 건너뜀).
  var upto = blackout_scheduled(state, round);
  for (var i = 0; i < upto; i++) {
    var c = BLACKOUT_ORDER[i];
    if (hardened[c] || dark[c]) continue;
    if (!map[c]) continue;
    dark[c] = true;
    map[c] = Object.assign({}, map[c], { blackout: true, boDef: defMod });
    lit.push(c);
  }

  // ② Bloc 복구 — 자사 구역이거나 **자사 구역에 인접한** 정전 칸을 부품으로 점등·경화.
  //   [인접까지 넓힌 이유 — 측정 근거] 소유 칸으로만 제한한 1차 구현은 복구 발생 1.5회/판에
  //   그쳤다. 캐스케이드 18칸이 5 Bloc 의 HQ·support 를 의도적으로 비껴가므로(대칭 밸런스
  //   보증) Bloc 이 정전 칸을 소유하는 일 자체가 드물었던 것. docs/14 §S04 구출 퀘스트가
  //   0.26회/판으로 사실상 죽은 콘텐츠가 된 전례를 반복하지 않으려면 발화 조건을 Bloc 의
  //   자연스러운 반경 안에 둬야 한다 — "복구 인프라를 뻗는다"는 원안 서술과도 맞는다.
  //   [영토 획득] 복구한 칸이 무주공산이면 복구자가 가져간다. 원안 "정전 복구 = 자산 가치"의
  //   가장 직접적인 구현 — 구역은 곧 수입이고 수입은 곧 assetValue 다.
  //   [페이싱] 좌석당 라운드 1칸으로 제한. 부품이 쌓인 Bloc 이 한 라운드에 도시를 통째로
  //   되살려 캐스케이드를 무의미하게 만드는 폭주를 막는다.
  var needParts = blackout_rule(state, 'blackoutRepairParts', 0);
  var payCredit = blackout_rule(state, 'blackoutRepairCredit', 0);
  var players = state.players.slice();
  var fixed = [];
  if (needParts > 0) {
    for (var pi = 0; pi < players.length; pi++) {
      var p = players[pi];
      if (!p || p.role !== 'bloc' || p.defeated || p.isNpc) continue;
      var res = Object.assign({}, p.resources);
      if ((res.parts || 0) < needParts) continue;
      var darkKeys = Object.keys(dark);   // 스냅샷 — 아래에서 dark 를 지우므로 for-in 금지
      for (var di = 0; di < darkKeys.length; di++) {
        var coord = darkKeys[di];
        if (!dark[coord] || !map[coord]) continue;
        if (map[coord].owner !== pi && !blackout_adjacentTo(map, coord, pi)) continue;
        res.parts = (res.parts || 0) - needParts;
        res.credit = (res.credit || 0) + payCredit;
        delete dark[coord];
        hardened[coord] = true;
        var relit = { blackout: false, boDef: 0 };
        if (map[coord].owner == null) relit.owner = pi;   // 무주공산이면 복구자 귀속
        map[coord] = Object.assign({}, map[coord], relit);
        fixed.push('P' + pi + '→' + coord);
        players[pi] = Object.assign({}, p, { resources: res });
        break;   // 좌석당 라운드 1칸
      }
    }
  }

  var darkN = Object.keys(dark).length;

  // ③ 붕괴 압력 — 정전 칸이 heatPer 의 **새 배수를 넘을 때만** 공권력 +1 (계단식, 상한 10).
  //   [설계 근거] 최초 구현은 매 라운드 floor(darkN/heatPer) 를 가산했는데, 실측 결과 R6 에
  //   공권력이 10 에 고정돼 판 전체가 상시 계엄이 됐다 — S04(계엄의 밤)와 정체성이 겹치고
  //   base 의 heat9 경찰 스폰까지 상시 발동했다. 계단식으로 바꿔 게임 전체 기여를
  //   floor(18/4)=4 단계로 **유계**하게 만든다(시작 5 → 최대 9). heatSteps 는 단조 증가라
  //   복구로 정전이 줄면 다음 단계 상승이 막힐 뿐 이미 오른 공권력이 되돌아오지는 않는다.
  var heatPer = blackout_rule(state, 'blackoutHeatPer', 0);
  var steps = bo.heatSteps || 0;
  var heatAdd = 0;
  if (heatPer > 0) {
    var want = Math.floor(darkN / heatPer);
    if (want > steps) { heatAdd = want - steps; steps = want; }
  }

  s = Object.assign({}, state, {
    players: players,
    map: map,
    meta: Object.assign({}, state.meta, {
      blackout: { dark: dark, hardened: hardened, repaired: (bo.repaired || 0) + fixed.length, heatSteps: steps },
    }),
  });
  if (heatAdd > 0) s = Object.assign({}, s, { heat: Math.min(10, (s.heat || 0) + heatAdd) });

  if (typeof logEntry === 'function') {
    if (lit.length) s = logEntry(s, '⚡ 정전 확산 — ' + lit.join('·') + ' 소등 (수입 0 · 방어 ' + defMod + ')');
    if (fixed.length) s = logEntry(s, '🔌 그리드 복구 — ' + fixed.join(', ') + ' (⚙-' + needParts + ' → ₵+' + payCredit + ' · 영구 경화)');
    if (heatAdd > 0) s = logEntry(s, '🚨 도시 붕괴 압력 — 정전 ' + darkN + '구역 돌파 → 공권력 +' + heatAdd);
  }
  return s;
}

// ============================================================================
// v6.46 [69차] (S06): 원전 특수 승리 루트 — 재건왕/청산자 하이라이트 배선 (docs/14 §S06 원안)
//   ▸ v6.53: index.html babel 인라인에서 이 모듈로 **이전**. 로직·이름·수치 전부 불변
//     (인라인 블록 500,000자 임계 상쇄 목적). 소비처는 typeof 가드로 미로드 시 항등.
//   원전 인용: "재건왕(RECONSTRUCTOR): 파산(주가 0) 블록을 주가 10↑로 복구한 플레이어 ★ 타이틀 + 렙/자산 +5."
//              "청산자: 2개 이상 블록 파산 유도 Ghost 렙 +10."
//   전용 점수·타이틀 추적 엔티티 신설 대신 기존 하이라이트(recordHighlight) 재사용 = 경량 배선.
//   전부 scenarioRule 게이트(crashBottomThresh / reconstructThresh / liquidatorBlocs). 타 시나리오는
//   키 미지정 → 0 폴백 → 첫 줄에서 인자 state 를 그대로 반환(참조 동일 = byte 불변 항등).
// ----------------------------------------------------------------------------
// 붕괴 바닥(=파산) 도달 이력 기록. 주가는 전역 Math.max(1, …) 하한이라 원전 "주가 0"은 도달 불가 →
//   crashBottomThresh(S06=1) 이하를 "파산"으로 매핑. 원인 무관(뉴스·레이드·매도) — 복구 판정의 전제.
function s06MarkCrashBottom(state) {
  const bottom = blackout_rule(state, 'crashBottomThresh', 0);
  if (!bottom) return state;
  const cur = state.meta.s06CrashedBlocs || {};
  let next = null;
  for (const bl of Object.keys(state.stocks || {})) {
    if ((state.stocks[bl] ?? 99) <= bottom && !cur[bl]) { next = next || { ...cur }; next[bl] = true; }
  }
  return next ? { ...state, meta: { ...state.meta, s06CrashedBlocs: next } } : state;
}
// 재건왕 — 파산 이력이 있는 블록의 주가가 reconstructThresh(원전 10) 이상으로 회복되면 해당 블록의
//   Bloc 플레이어에게 하이라이트. 귀속 근거: 엔진에 "누가 주가를 올렸는가" 신호가 없고(뉴스·배당·다중 매수),
//   플레이어에 결정적으로 귀속되는 주가 상승 신호는 자사 매수(BUY_STOCK/봇 매집 = 주가 +1)뿐이므로
//   원전의 "복구한 플레이어"를 자사 블록 소유 Bloc 좌석으로 매핑한다. NPC Bloc·탈락 좌석 제외.
function s06CheckReconstructor(state) {
  const thresh = blackout_rule(state, 'reconstructThresh', 0);
  if (!thresh) return state;
  let s = s06MarkCrashBottom(state);
  const crashed = s.meta.s06CrashedBlocs || {};
  for (let i = 0; i < s.players.length; i++) {
    const p = s.players[i];
    if (!p || p.role !== 'bloc' || p.defeated || p.isNpc) continue;
    if (crashed[p.specific] && (s.stocks[p.specific] || 0) >= thresh && typeof recordHighlight === 'function') s = recordHighlight(s, 'reconstructor', i);
  }
  return s;
}
// 청산자 — 한 Ghost 의 행동 창(카드 해결 1회분 / 레이드 1회) 안에서 바닥 위 → 바닥 이하로 밀려난 블록만
//   그 Ghost 의 "파산 유도"로 귀속·누적. 누적 블록 수가 liquidatorBlocs(원전 2) 이상이면 하이라이트.
//   preStocks = 행동 직전 state.stocks 스냅샷. Bloc·NPC 는 role 게이트로 제외.
function s06NoteLiquidation(state, playerIdx, preStocks) {
  const need = blackout_rule(state, 'liquidatorBlocs', 0);
  if (!need || !preStocks) return state;
  const p = state.players[playerIdx];
  if (!p || p.role !== 'ghost') return state;
  const bottom = blackout_rule(state, 'crashBottomThresh', 1);
  const byP = state.meta.s06LiquidatedBy || {};
  const mine = byP[playerIdx] || [];
  let add = null;
  for (const bl of Object.keys(state.stocks || {})) {
    const before = preStocks[bl], after = state.stocks[bl];
    if (before != null && before > bottom && after <= bottom && mine.indexOf(bl) === -1 && !(add && add.indexOf(bl) !== -1)) {
      add = add || []; add.push(bl);
    }
  }
  if (!add) return state;
  const nextMine = [...mine, ...add];
  let s = { ...state, meta: { ...state.meta, s06LiquidatedBy: { ...byP, [playerIdx]: nextMine } } };
  s = s06MarkCrashBottom(s);
  if (nextMine.length >= need && typeof recordHighlight === 'function') s = recordHighlight(s, 'liquidator', playerIdx);
  return s;
}

// ----------------------------------------------------------------------------
// initGame 시작조건 훅 — v6.53 에 index.html babel 인라인에서 이전 (로직·이름 불변).
// ----------------------------------------------------------------------------
// 시작 구역 확장용: origin 좌표에서 가장 가까운 미소유 일반(비-NEXUS) 구역 1칸을 찾는다.
//   좌표 = 열문자(A..)+행숫자(1..). 맵에 존재·owner null·zone!=='nex' 조건.
function nearestUnownedZone(map, origin) {
  const parse = (c) => ({ col: c.charCodeAt(0) - 65, row: parseInt(c.slice(1), 10) });
  const o = parse(origin);
  let best = null, bestD = Infinity;
  for (const c of Object.keys(map)) {
    const cell = map[c];
    if (!cell || cell.owner != null || cell.zone === 'nex') continue;
    const p = parse(c);
    const d = Math.abs(p.col - o.col) + Math.abs(p.row - o.row);
    if (d > 0 && d < bestD) { bestD = d; best = c; }
  }
  return best;
}
// initGame 훅 — 시작 players/map 변형 (전원 Bloc 이미 배치·구역 소유 확정 후 호출).
//   startCredit(전원 Bloc 크레딧 보강) · extraSupport(HQ 인근 미소유 구역 추가 소유).
function applyScenarioInit(scen, players, map) {
  if (!scen) return;
  if (scen.startCredit) {
    players.forEach(p => {
      if (p.role === 'bloc') p.resources = { ...p.resources, credit: (p.resources.credit || 0) + scen.startCredit };
    });
  }
  // v6.19 (S03): Ghost 시작 렙/크레딧 보강 + (실참) Bloc 인플루언스 보강 (docs/14 S03).
  if (scen.ghostRepBonus || scen.ghostCreditBonus) {
    players.forEach(p => {
      if (p.role !== 'ghost') return;
      p.resources = { ...p.resources,
        rep:    (p.resources.rep || 0)    + (scen.ghostRepBonus || 0),
        credit: (p.resources.credit || 0) + (scen.ghostCreditBonus || 0) };
    });
  }
  if (scen.blocInfluenceBonus) {
    players.forEach(p => {
      if (p.role === 'bloc' && !p.isNpc) p.resources = { ...p.resources, influence: (p.resources.influence || 0) + scen.blocInfluenceBonus };
    });
  }
  // v6.20 (S05/S06): 전원 대상 시작 자원 델타 (docs/14 S05 크레딧 +5 · S06 크레딧 −3·인플루언스 −1).
  //   role 무관 전 좌석에 적용. 음수는 0 하한으로 클램프(자원 음수 방지).
  if (scen.startCreditAll) {
    players.forEach(p => { p.resources = { ...p.resources, credit: Math.max(0, (p.resources.credit || 0) + scen.startCreditAll) }; });
  }
  if (scen.startInfluenceAll) {
    players.forEach(p => { p.resources = { ...p.resources, influence: Math.max(0, (p.resources.influence || 0) + scen.startInfluenceAll) }; });
  }
  // v6.20 (S06): 모든 블록 스캔들 카드 1장씩 덱 오염 상태로 시작 (docs/14 S06).
  //   insertScandal 코어와 동일하게 'SCANDAL' 카드를 discard 에 선삽입 (런타임 오염 카드).
  if (scen.startScandalEach) {
    players.forEach(p => { if (p.role === 'bloc') p.discard = [...(p.discard || []), 'SCANDAL']; });
  }
  if (scen.extraSupport) {
    players.forEach(p => {
      if (p.role !== 'bloc' || p.position == null) return;
      for (let n = 0; n < scen.extraSupport; n++) {
        const coord = nearestUnownedZone(map, p.position);
        if (coord) map[coord] = { ...map[coord], owner: p.id };
      }
    });
  }
  // v6.21 (S04): 전원 무기 델타 (docs/14 S04 무기 −2 압수). 0 하한 클램프.
  if (scen.startWeaponsAll) {
    players.forEach(p => { p.resources = { ...p.resources, weapons: Math.max(0, (p.resources.weapons || 0) + scen.startWeaponsAll) }; });
  }
  // v6.53 (S07): 정전 캐스케이드 초기 상태 — 시작 시점은 전 구역 점등(스케줄 R<blackoutStart).
  //   meta 초기화는 buildInitial 이 아니라 첫 blackout_advance 가 맡는다(항등 폴백 유지).
}

// HTML 글로벌 노출 (fx_module / rules_module 패턴)
if (typeof window !== 'undefined') {
  window.BLACKOUT_ORDER = BLACKOUT_ORDER;
  window.blackout_active = blackout_active;
  window.blackout_orderLen = blackout_orderLen;
  window.blackout_scheduled = blackout_scheduled;
  window.blackout_darkSet = blackout_darkSet;
  window.blackout_isDark = blackout_isDark;
  window.blackout_darkCount = blackout_darkCount;
  window.blackout_hardenedCount = blackout_hardenedCount;
  window.blackout_advance = blackout_advance;
  window.blackout_adjacentTo = blackout_adjacentTo;
  window.s06MarkCrashBottom = s06MarkCrashBottom;
  window.s06CheckReconstructor = s06CheckReconstructor;
  window.s06NoteLiquidation = s06NoteLiquidation;
  window.nearestUnownedZone = nearestUnownedZone;
  window.applyScenarioInit = applyScenarioInit;
}
