'use strict';
// ============================================================================
// rules_module.js — v6.51 [3차 감사 1파] 엔진 코어 규칙 모듈
//
//   3차 감사(E1·E3·E4·E6·E7)로 적발된 시뮬 코어 결함의 수정 로직을 담는다:
//     · E1  타임아웃 승자 판정(rules_victoryByPoints) — 진영별 목표 대비 정규화 진척 비교
//     · E3  인간 협상 라운드당 캡(rules_negoCapInfo/Note) — 봇 NEGO_MAX 와 동일
//     · E4  truce 위반 판정 공통 헬퍼(rules_truceViolationFx) — (attacker, victim) 인자화
//     · E7  레이드 성공 부작용 공통화(rules_raidSuccessFx) — 3경로(인간·봇 이동·카드효과) 동일
//     · E8  동일 쌍 truce 활성 중복 감지(rules_truceActiveBetween)
//
//   ▸ 배선 패턴 (fx_module / euro_module 과 동일)
//     · <script src> 로드 + DOMContentLoaded 자가복구 heal 로더 등록(index.html)
//     · 전역 window 노출, 소비처는 typeof 가드 → 미로드 시 축소 폴백 + E13 배너 표기
//     · babel 인라인 블록의 전역(logEntry/insertScandal/recordHighlight/getVictoryGoals/
//       assetValue/euro_hlVictoryBonus)은 호출 시점 지연 참조 — 로드 순서 무관, file:// 호환.
//
//   ▸ 이 파일이 babel 인라인 스크립트 밖에 있는 이유 (fx_module 과 동일)
//     index.html 의 <script type="text/babel"> 본문이 Babel 코드 생성기의 500,000자
//     deopt 임계에 근접해 있다. JSX 가 필요 없는 순수 규칙 로직은 일반 스크립트로 빼서
//     인라인 블록을 오히려 줄인다.
// ============================================================================

// E3: 라운드당 협상 제안 캡 — 봇 경로(NEGOTIATE_PHASE)의 NEGO_MAX 와 동일 값(단일 소스).
var RULES_NEGO_MAX = 2;

// E3: 인간 좌석의 라운드당 제안 사용량 조회 — { ok, used, max, reason }.
//   UI 버튼 disabled + 사유 표기, 리듀서 PROPOSE_NEGOTIATION 게이트가 그대로 사용.
function rules_negoCapInfo(state, playerIdx) {
  var round = (state.meta && state.meta.round) || 0;
  var cap = (state.meta && state.meta.negoCap) || null;
  var used = (cap && cap.round === round && cap.counts && cap.counts[playerIdx]) || 0;
  var ok = used < RULES_NEGO_MAX;
  return {
    ok: ok, used: used, max: RULES_NEGO_MAX,
    reason: ok ? '' : ('협상 캡 도달 — 라운드당 ' + RULES_NEGO_MAX + '회 (' + used + '/' + RULES_NEGO_MAX + ')'),
  };
}

// E3: 제안 1회 사용 기록 (불변 갱신). 라운드가 바뀌면 카운터 자동 리셋.
function rules_negoCapNote(state, playerIdx) {
  var round = (state.meta && state.meta.round) || 0;
  var cap = (state.meta && state.meta.negoCap) || null;
  var counts = (cap && cap.round === round) ? Object.assign({}, cap.counts) : {};
  counts[playerIdx] = (counts[playerIdx] || 0) + 1;
  return Object.assign({}, state, {
    meta: Object.assign({}, state.meta, { negoCap: { round: round, counts: counts } }),
  });
}

// E8: (a,b) 사이 활성 truce 존재 여부 — 재등록 거부 판정용 (방향 무관).
function rules_truceActiveBetween(state, a, b) {
  var proms = (state.meta && state.meta.promises) || [];
  var round = (state.meta && state.meta.round) || 0;
  return proms.some(function (pm) {
    return pm && pm.status === 'active' && pm.type === 'truce' && pm.expiresR >= round &&
      ((pm.from === a && pm.to === b) || (pm.from === b && pm.to === a));
  });
}

// E4: truce 위반 판정·집행 공통 헬퍼 — (attacker, victim) 쌍의 활성 truce 를 broken 처리하고
//   공격자 ★-2 / 피해자 ★+2 (기존 인간 경로 3650-3662 의 수치·로그 형식 그대로).
//   인간·봇 이동·카드효과 3경로 + 봇↔봇 truce 전부 이 함수 하나로 판정한다.
function rules_truceViolationFx(state, attackerIdx, victimIdx) {
  if (attackerIdx == null || victimIdx == null) return state;
  if (attackerIdx < 0 || victimIdx < 0 || attackerIdx === victimIdx) return state;
  var proms = (state.meta && state.meta.promises) || [];
  var round = (state.meta && state.meta.round) || 0;
  var hits = proms.filter(function (pm) {
    return pm && pm.status === 'active' && pm.type === 'truce' && pm.expiresR >= round &&
      ((pm.from === attackerIdx && pm.to === victimIdx) || (pm.from === victimIdx && pm.to === attackerIdx));
  });
  if (hits.length === 0) return state;
  var ps = state.players.slice();
  if (ps[attackerIdx]) {
    var ar = Object.assign({}, ps[attackerIdx].resources);
    ar.rep = Math.max(0, (ar.rep || 0) - 2);
    ps[attackerIdx] = Object.assign({}, ps[attackerIdx], { resources: ar });
  }
  if (ps[victimIdx]) {
    var vr = Object.assign({}, ps[victimIdx].resources);
    vr.rep = (vr.rep || 0) + 2;
    ps[victimIdx] = Object.assign({}, ps[victimIdx], { resources: vr });
  }
  var newProms = proms.map(function (pm) {
    return hits.indexOf(pm) >= 0 ? Object.assign({}, pm, { status: 'broken' }) : pm;
  });
  var s = Object.assign({}, state, { players: ps, meta: Object.assign({}, state.meta, { promises: newProms }) });
  if (typeof logEntry === 'function')
    s = logEntry(s, '⚠ 약속 위반! P' + attackerIdx + ' → P' + victimIdx + ' truce 무시 raid · P' + attackerIdx + ' ★-2, P' + victimIdx + ' ★+2');
  return s;
}

// E7: 레이드 성공 공통 부작용 — 3경로(인간 RESOLVE_RAID · 봇 이동 자동 레이드 · 카드효과 레이드)
//   가 동일하게 거치는 단일 지점. 포함: ① 레이드/블록 피해 카운터(불변 갱신 — E6)
//   ② 스캔들 덱 오염(insertScandal) ③ truce 위반 판정(E4) ④ 첫 레이드 하이라이트.
//   blocOwnerIdx: 피해 Bloc 좌석 인덱스 (없으면 -1/null — 카운터만 기록).
function rules_raidSuccessFx(state, attackerIdx, blocOwnerIdx, blocName) {
  var raids = Object.assign({}, (state.meta && state.meta.raidsThisGame) || {});
  raids[attackerIdx] = (raids[attackerIdx] || 0) + 1;
  var dmg = Object.assign({}, (state.meta && state.meta.raidDmgByBloc) || {});
  if (blocName) dmg[blocName] = (dmg[blocName] || 0) + 1;   // v6.24 (레거시): 도시 흉터 집계
  var s = Object.assign({}, state, {
    meta: Object.assign({}, state.meta, { raidsThisGame: raids, raidDmgByBloc: dmg }),
  });
  var hasOwner = blocOwnerIdx != null && blocOwnerIdx >= 0;
  if (hasOwner && typeof insertScandal === 'function')
    s = insertScandal(s, blocOwnerIdx, '레이드로 구역 상실');   // v6.13.1 (P1-1): 스캔들 덱 오염
  if (hasOwner) s = rules_truceViolationFx(s, attackerIdx, blocOwnerIdx);
  if (typeof recordHighlight === 'function')
    s = recordHighlight(s, 'first_raid_success', attackerIdx);  // 1회성 — 재발동 없음
  return s;
}

// ============================================================================
// E1: 타임아웃(라운드 상한) 승자 판정 — "HUD 숫자 = 판정 숫자" 정직성 계약 유지.
//   진척 비율은 hudRaceProgress(index.html)와 동일 소스·동일 수학을 쓰되
//   반올림·100 캡 없이 원시 비율로 비교한다 (동률 오판 방지).
//   필터: defeated/isNpc 제외. 달성값에 euro_hlVictoryBonus 가산 (B-06 역할 대칭).
// ============================================================================
function rules_victoryRatio(p, idx, state, goals) {
  if (!p || p.defeated || p.isNpc) return -Infinity;
  var hl = (typeof euro_hlVictoryBonus === 'function') ? euro_hlVictoryBonus(p) : 0;
  if (p.role === 'bloc') {
    var av = ((typeof assetValue === 'function') ? assetValue(p, state.stocks, state) : ((p.resources && p.resources.credit) || 0)) + hl;
    return goals.blocAsset > 0 ? av / goals.blocAsset : 0;
  }
  var rep = ((p.resources && p.resources.rep) || 0) + hl;
  var raidCnt = ((state.meta && state.meta.raidsThisGame) || {})[idx] || 0;
  // 렙배틀 경로: 렙·레이드 동시 게이트 → min 성분 (hudRaceProgress 와 동일).
  var battleRep  = goals.ghostRepBattle > 0 ? rep / goals.ghostRepBattle : 1;
  var battleRaid = goals.ghostRaids     > 0 ? raidCnt / goals.ghostRaids : 1;
  var battle = Math.min(battleRep, battleRaid);
  // 렙온리 경로.
  var only = goals.ghostRepOnly > 0 ? rep / goals.ghostRepOnly : 0;
  return Math.max(battle, only);
}

// 승자 = 정규화 진척(목표 대비 %)이 가장 높은 비탈락·비NPC 플레이어.
// [동률 규칙] 최고 진척이 1e-9 이내로 같으면 승자 없음 = 무승부 (배열 순서로 갈리지 않음).
function rules_victoryByPoints(state) {
  var goals = (typeof getVictoryGoals === 'function') ? getVictoryGoals(state) : { blocAsset: 100, ghostRepBattle: 45, ghostRepOnly: 70, ghostRaids: 3 };
  var best = null;   // { idx, r }
  var tie = false;
  state.players.forEach(function (p, i) {
    if (!p || p.defeated || p.isNpc) return;
    var r = rules_victoryRatio(p, i, state, goals);
    if (best === null || r > best.r + 1e-9) { best = { idx: i, r: r }; tie = false; }
    else if (Math.abs(r - best.r) <= 1e-9) tie = true;
  });
  var winner = null, reason;
  if (!best || tie) {
    reason = best ? ('시간 종료 · 무승부 (목표 진척 동률 ' + Math.round(best.r * 100) + '%)') : '무승부';
  } else {
    winner = best.idx;
    var wp = state.players[best.idx];
    reason = '시간 종료 · 목표 진척 1위 ' + Math.round(best.r * 100) + '% (' + (wp.role === 'bloc' ? '자산' : '평판') + ' 레이스)';
  }
  return Object.assign({}, state, {
    meta: Object.assign({}, state.meta, { gameOver: true, winner: winner, winReason: reason }),
  });
}

// ============================================================================
// v6.44 (A2) → v6.51 이전: 협상 페이즈 (Phase 1.5) 공용 헬퍼 — docs/17 §2 원전 배선
//   (index.html babel 인라인에서 그대로 이전 — logEntry/raiseTrack 은 호출 시점 전역 참조)
// 원전 §2.1 거래 3종만 생성: 자원 스왑 / 비공격 약속(truce) / BROKER 중개.
// EV-중립(지배 전략 금지): 봇 수락은 net-value ≥ 0 문턱. 지속·보상·위반은 기존 채널 재사용
// (truce 만료 ★+1 = NEXT_ROUND, truce 위반 ★-2/피해자 ★+2 = 레이드 판정, 인맥 트랙 = raiseTrack).
function negoTypeLabel(t) { return t === 'swap' ? '자원 스왑' : t === 'truce' ? '비공격 약속' : t === 'broker_deal' ? 'BROKER 중개' : t; }
function negoResAbbr(k) { return ({ credit: '₵', weapons: '🔩', data: '📡', parts: '⚙', rep: '★' })[k] || (k.charAt(0).toUpperCase()); }

// 원전 §2.1 3종 거래 후보 생성. from 이 남는 자원 ↔ to 가 남는 자원 = 양측 부족분 보충(win-win, EV-중립).
function negoBuildCandidates(fromP, from, toP, to, round) {
  const cands = [];
  const fr = fromP.resources || {}, tr = toP.resources || {};
  // (1) 자원 스왑 — 원전 §2.1 "크레딧↔무기, 데이터↔부품 등. 즉시 자원 교환"
  if ((fr.credit || 0) >= 4 && (tr.weapons || 0) >= 2 && (fr.weapons || 0) < 2)
    cands.push({ from, to, type: 'swap', give: { credit: 4 }, get: { weapons: 2 }, value: 5 });
  if ((fr.weapons || 0) >= 2 && (tr.credit || 0) >= 4 && (fr.credit || 0) < 4)
    cands.push({ from, to, type: 'swap', give: { weapons: 2 }, get: { credit: 4 }, value: 5 });
  if ((fr.data || 0) >= 2 && (tr.parts || 0) >= 2 && (fr.parts || 0) < 2)
    cands.push({ from, to, type: 'swap', give: { data: 2 }, get: { parts: 2 }, value: 4 });
  // (2) 비공격 약속 truce — 원전 §2.1 "1R 동안 서로 raid 안 한다" (진영 다를 때만 의미)
  if (fromP.role !== toP.role)
    cands.push({ from, to, type: 'truce', give: {}, get: {}, expiresR: round + 1, value: 3 });
  // (3) BROKER 중개 — 원전 §2.1/§2.3 "BROKER 클래스 한정. 매 R ★+1 ₵+1"
  if (fromP.specific === 'BROKER')
    cands.push({ from, to, type: 'broker_deal', give: {}, get: { rep: 1, credit: 1 }, value: 3 });
  return cands;
}

// EV-중립 봇 수락 판정. acceptValue = (to 가 받는 것) − (to 가 내주는 것) + 관계가치.
// prop.give = from→to 이전분(=to 수령), prop.get = to→from 이전분(=to 지불). net ≥ 0 이면 수락.
// 지배 전략 방지: 스왑은 부족분 보충 시에만 +, truce 는 소폭 +(만료 ★+1 기대), broker 는 to 무손실.
function negoEvalAccept(prop, toP) {
  let acceptValue = 0;
  for (const [, v] of Object.entries(prop.give || {})) acceptValue += v;   // to 가 수령
  for (const [, v] of Object.entries(prop.get || {})) acceptValue -= v;    // to 가 지불
  if (prop.type === 'truce') acceptValue += 2;        // 비공격 약속 자체 가치
  if (prop.type === 'broker_deal') acceptValue = 1;   // 중개는 to 무손실 → 수락 (BROKER 정체성, to 지불 없음)
  let canAfford = true;   // 스왑만 to 가 get(지불분)을 실제 보유해야 성립 (broker 의 get 은 from 보너스라 to 무지불)
  if (prop.type === 'swap' && prop.get) for (const [k, v] of Object.entries(prop.get)) if ((toP.resources[k] || 0) < v) canAfford = false;
  return { accept: canAfford && acceptValue >= 0, acceptValue, canAfford };
}

// 협상 처리 — 봇↔봇 자동·인간→봇 UI 공용. 발생 로그 + cap-immune 계측(meta.negoStats). 조용한 실패 금지.
function negoApply(s, prop) {
  const fromP = s.players[prop.from], toP = s.players[prop.to];
  if (!fromP || !toP || fromP.defeated || toP.defeated) return s;
  const stats = { proposed: 0, accepted: 0, rejected: 0, swaps: 0, truces: 0, broker: 0, ...(s.meta.negoStats || {}) };
  stats.proposed += 1;
  const evl = negoEvalAccept(prop, toP);
  if (!evl.accept) {
    stats.rejected += 1;
    s = logEntry(s, `🤝 협상 거절: P${prop.from} [${fromP.specific}] → P${prop.to} [${toP.specific}] (${negoTypeLabel(prop.type)}) · EV ${evl.acceptValue}`);
    return { ...s, meta: { ...s.meta, negoStats: stats } };
  }
  // v6.52: from 측 give 보유량 검사 — 후보 생성 시점과 적용 시점 사이에 자원이 바뀌어도 음수 차감 불가 (방어층)
  if (prop.type === 'swap' && prop.give) {
    for (const [k, v] of Object.entries(prop.give)) {
      if ((fromP.resources[k] || 0) < v) {
        stats.rejected += 1;
        s = logEntry(s, `🤝 협상 무산: P${prop.from} [${fromP.specific}] 지불분 부족 (${v}${negoResAbbr(k)} 필요) — 제안 철회`);
        return { ...s, meta: { ...s.meta, negoStats: stats } };
      }
    }
  }
  // v6.51 (E8): 동일 쌍 활성 truce 중복 등록 거부 — 수락 전 게이트 (거부 로그 + 계측, 조용한 중복 금지)
  if (prop.type === 'truce' && typeof rules_truceActiveBetween === 'function' && rules_truceActiveBetween(s, prop.from, prop.to)) {
    stats.rejected += 1;
    s = logEntry(s, `🕊 비공격 약속 중복: P${prop.from} ↔ P${prop.to} 이미 활성 — 재등록 거부`);
    return { ...s, meta: { ...s.meta, negoStats: stats } };
  }
  stats.accepted += 1;
  const ps = [...s.players];
  if (prop.type === 'swap') {
    stats.swaps += 1;
    const frr = { ...fromP.resources }, trr = { ...toP.resources };
    for (const [k, v] of Object.entries(prop.give)) { frr[k] = (frr[k] || 0) - v; trr[k] = (trr[k] || 0) + v; }
    for (const [k, v] of Object.entries(prop.get)) { trr[k] = (trr[k] || 0) - v; frr[k] = (frr[k] || 0) + v; }
    ps[prop.from] = { ...fromP, resources: frr };
    ps[prop.to] = { ...toP, resources: trr };
    s = { ...s, players: ps };
    const gs = Object.entries(prop.give).map(([k, v]) => `${v}${negoResAbbr(k)}`).join(' ');
    const gt = Object.entries(prop.get).map(([k, v]) => `${v}${negoResAbbr(k)}`).join(' ');
    s = logEntry(s, `🤝 거래 성사: P${prop.from} [${fromP.specific}] (${gs}) ↔ P${prop.to} [${toP.specific}] (${gt})`);
    s = raiseTrack(s, prop.from, 'party', 1, '거래');
  } else if (prop.type === 'truce') {
    stats.truces += 1;
    const newPromises = [...(s.meta.promises || []), { from: prop.from, to: prop.to, type: 'truce', expiresR: prop.expiresR, status: 'active' }];
    s = { ...s, meta: { ...s.meta, promises: newPromises } };
    s = logEntry(s, `🕊 비공격 약속: P${prop.from} ↔ P${prop.to} (R${prop.expiresR}까지 · 지킴 양측 ★+1 / 위반 ★-2·피해자 ★+2)`);
  } else if (prop.type === 'broker_deal') {
    stats.broker += 1;
    const frr = { ...fromP.resources, rep: (fromP.resources.rep || 0) + 1, credit: (fromP.resources.credit || 0) + 1 };
    ps[prop.from] = { ...fromP, resources: frr };
    s = { ...s, players: ps };
    s = logEntry(s, `🎙 BROKER 중개: P${prop.from} ★+1 ₵+1 (P${prop.to} 중개 성사 · 원전 §2.3)`);
    s = raiseTrack(s, prop.from, 'party', 1, 'BROKER 중개');
  }
  return { ...s, meta: { ...s.meta, negoStats: stats } };
}

// ============================================================================
// v6.52 [3차 감사 2파] 표시↔판정 정직화 — 표시가 판정 식에서 파생되는 공용 함수
// ============================================================================
// V2: 레이드 「실행」 성공률 단일 소스 — RESOLVE_RAID 실판정과 동일한 성분 합산.
//   실판정: execTotal = d6 + stat + track + weapons + counter + pool + atkOnce − allPlus
//           (접근 성공 가정 — 접근 실패 -2 는 사전 표시 불가한 별도 주사위라 제외, 기존 표기와 동일)
//   성공 눈: (눈 ≠ 1 || critImmune) && 눈 ≥ needed — 크리티컬 실패(d6=1) 면역이면 상한 6/6, 아니면 5/6.
//   threshold 는 최종 임계(방어·토큰·MOLE 위장 -2 반영 후)를 받는다.
//   소비처: 레이드 모달 estPct/판정식 문구 · 맵 셀 프리뷰 · 우측 패널 프리뷰 (index.html raidExecPctView).
function rules_raidExecEst(o) {
  o = o || {};
  var bonus = (o.stat || 0) + (o.track || 0) + (o.weapons || 0) + (o.counter || 0) +
              (o.pool || 0) + (o.atkOnce || 0) - (o.allPlus || 0);
  var needed = (o.threshold || 0) - bonus;
  var faces = 0;
  for (var r = 1; r <= 6; r++) if ((r !== 1 || o.critImmune) && r >= needed) faces++;
  return { bonus: bonus, needed: needed, faces: faces, pct: Math.round(faces / 6 * 100) };
}

// V6: 숏 정산 배수 단일 소스 — settleShortPositions(정산)와 마켓 틱커 평가손익(표시)이 같은 식을 쓴다.
//   mult = 시장 변동성 뉴스(short_settle_mult, 해당 R 한정) · crashBonus = S06 저가(≤threshold) 정산 배수.
//   scenarioRule 은 호출 시점 지연 참조(전역) — 미로드 시 항등(×1) 폴백.
function rules_shortPayout(state, bloc, drop, qty, payoutPerPt) {
  var meta = (state && state.meta) || {};
  var mult = (meta.shortMultRound === meta.round) ? (meta.shortMultVal || 1) : 1;
  var lowMult = 1, lowThresh = 5;
  if (typeof scenarioRule === 'function') {
    lowMult = scenarioRule(state, 'shortLowPriceMult', 1);
    lowThresh = scenarioRule(state, 'shortLowPriceThresh', 5);
  }
  var price = (state && state.stocks && state.stocks[bloc] != null) ? state.stocks[bloc] : 0;
  var crashBonus = price <= lowThresh ? lowMult : 1;
  return { mult: mult, crashBonus: crashBonus, payout: drop * qty * payoutPerPt * mult * crashBonus };
}

// HTML 글로벌 노출 (fx_module 패턴)
if (typeof window !== 'undefined') {
  window.rules_raidExecEst = rules_raidExecEst;
  window.rules_shortPayout = rules_shortPayout;
  window.RULES_NEGO_MAX = RULES_NEGO_MAX;
  window.rules_negoCapInfo = rules_negoCapInfo;
  window.rules_negoCapNote = rules_negoCapNote;
  window.rules_truceActiveBetween = rules_truceActiveBetween;
  window.rules_truceViolationFx = rules_truceViolationFx;
  window.rules_raidSuccessFx = rules_raidSuccessFx;
  window.rules_victoryRatio = rules_victoryRatio;
  window.rules_victoryByPoints = rules_victoryByPoints;
  window.negoTypeLabel = negoTypeLabel;
  window.negoResAbbr = negoResAbbr;
  window.negoBuildCandidates = negoBuildCandidates;
  window.negoEvalAccept = negoEvalAccept;
  window.negoApply = negoApply;
}
