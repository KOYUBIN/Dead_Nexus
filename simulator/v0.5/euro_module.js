// ============================================================================
// DEAD NEXUS — simulator/v0.5 유로 메커닉 모듈 (v5.2.1+)
// sim-harness/euro_mechanics.js의 simulator 버전
// HTML <script src> 로 로드. simulator 글로벌 스코프에서 작동
// simulator의 coordsAdj, logEntry, assetValue, raiseTrack 함수에 의존
// ============================================================================

// v5.0.3: 동적 시장 가격 헬퍼
function euro_marketTradePrice(state, blocName, delta) {
  const newStocks = { ...state.stocks };
  const cur = newStocks[blocName] || 5;
  newStocks[blocName] = Math.max(1, Math.min(20, cur + delta));
  return { ...state, stocks: newStocks };
}

// v5.0.1: 자원 변환 체인
function euro_tryConvertResources(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated) continue;
    let parts = p.resources.parts || 0;
    let data = p.resources.data || 0;
    let conv = p.converted || { gear: 0, intel: 0 };
    let gear = conv.gear || 0;
    let intel = conv.intel || 0;
    let changed = false;
    while (parts >= 2 && gear < 3) { parts -= 2; gear += 1; changed = true; }
    while (data >= 2 && intel < 3) { data -= 2; intel += 1; changed = true; }
    if (changed) {
      const ps = [...s.players];
      ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, parts, data }, converted: { gear, intel } };
      s = { ...s, players: ps };
      if (typeof logEntry === 'function') s = logEntry(s, `🔧 P${pi} ${p.specific} · 자원 변환 (장비 ${gear}, 인텔 ${intel})`);
    }
  }
  return s;
}

function euro_gearBonus(p) {
  const gear = (p.converted && p.converted.gear) || 0;
  return Math.min(3, gear);
}

// v5.0.3: 시장 사이클
function euro_marketCycle(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated) continue;
    if (p.role === 'bloc' && s.stocks[p.specific] != null) {
      s = euro_marketTradePrice(s, p.specific, 1);
    }
  }
  return s;
}

// v5.0.2: 네트워크 수익 보너스 (Bloc 전용, 점수 직결 X)
function euro_networkIncome(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.role !== 'bloc') continue;
    const owned = new Set(Object.entries(s.map).filter(([c, cell]) => cell.owner === pi).map(([c]) => c));
    if (owned.size < 3) continue;
    const visited = new Set();
    let maxChain = 0;
    for (const start of owned) {
      if (visited.has(start)) continue;
      let size = 0;
      const queue = [start];
      visited.add(start);
      while (queue.length) {
        const cur = queue.shift();
        size++;
        if (typeof coordsAdj === 'function') {
          for (const adj of coordsAdj(cur)) {
            if (owned.has(adj) && !visited.has(adj)) {
              visited.add(adj);
              queue.push(adj);
            }
          }
        }
      }
      if (size > maxChain) maxChain = size;
    }
    if (maxChain >= 3) {
      const bonus = Math.min(3, maxChain - 2);
      const ps = [...s.players];
      ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, credit: (ps[pi].resources.credit || 0) + bonus } };
      s = { ...s, players: ps };
      if (typeof logEntry === 'function') s = logEntry(s, `🌐 P${pi} ${p.specific} · 네트워크 수익 ₵+${bonus} (체인 ${maxChain})`);
    }
  }
  return s;
}

// v5.1.0a: DRIFTER 5×5 너프
function euro_drifterNerf5x5(state) {
  if (state.meta.mapSize !== '5x5') return state;
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'DRIFTER') continue;
    const ps = [...s.players];
    const newRep = Math.max(0, (ps[pi].resources.rep || 0) - 1);
    ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, rep: newRep } };
    s = { ...s, players: ps };
    if (typeof logEntry === 'function') s = logEntry(s, `🌃 P${pi} DRIFTER · 5×5 이동 페널티 ★-1`);
  }
  return s;
}

// v5.1.0c: 하이라이트 11종 (simulator HIGHLIGHT_DEFS와 별개)
const EURO_HIGHLIGHTS = {
  hp_one_raid:     { name: '🤕 역전 한 수',   pts: 5, check: (p, s, pi) => p.role === 'ghost' && p.hp === 1 },
  triple_raid:     { name: '🗡 삼연속 레이드', pts: 4, check: (p, s, pi) => p.role === 'ghost' && (s.meta.raidsThisGame?.[pi] || 0) >= 3 },
  zero_wanted:     { name: '👻 무흔적',        pts: 3, check: (p, s) => p.role === 'ghost' && (p.wanted || 0) === 0 && s.meta.round >= 5 },
  imperium:        { name: '🏙 임페륨',        pts: 3, check: (p, s, pi) => p.role === 'bloc' && Object.values(s.map).filter(c => c.owner === pi).length >= 5 },
  stock_legend:    { name: '💰 상장',          pts: 3, check: (p, s) => p.role === 'bloc' && (s.stocks[p.specific] || 0) >= 15 },
  hack_god:        { name: '💾 해킹 신',       pts: 3, check: (p) => p.specific === 'CIPHER' && (p.hackNodes || 0) >= 3 },
  cyber_full:      { name: '⚛ 사이버웨어 풀',  pts: 3, check: (p) => (p.cyberware || []).length >= 3 },
  rep_legend:      { name: '⭐ 거리 전설',     pts: 3, check: (p) => (p.resources.rep || 0) >= 18 },
};

function euro_checkHighlights(state) {
  let s = state;
  const claimed = s.meta.euroHighlightsClaimed || {};
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated) continue;
    for (const [key, hl] of Object.entries(EURO_HIGHLIGHTS)) {
      if (claimed[key]) continue;
      try {
        if (hl.check(p, s, pi)) {
          const ps = [...s.players];
          ps[pi] = { ...ps[pi], highlightPoints: (ps[pi].highlightPoints || 0) + hl.pts };
          s = { ...s, players: ps, meta: { ...s.meta, euroHighlightsClaimed: { ...claimed, [key]: pi } } };
          if (typeof logEntry === 'function') s = logEntry(s, `✨ P${pi} ${p.specific} · 유로 하이라이트 [${hl.name}] +${hl.pts}pt`);
          break;
        }
      } catch (e) { /* skip */ }
    }
  }
  return s;
}

// 통합 hook — NEXT_ROUND마다 호출
function euro_applyAll(state) {
  let s = state;
  s = euro_tryConvertResources(s);
  s = euro_marketCycle(s);
  s = euro_networkIncome(s);
  s = euro_drifterNerf5x5(s);
  s = euro_checkHighlights(s);
  return s;
}

// HTML 글로벌 노출
if (typeof window !== 'undefined') {
  window.euro_applyAll = euro_applyAll;
  window.euro_gearBonus = euro_gearBonus;
  window.EURO_HIGHLIGHTS = EURO_HIGHLIGHTS;
}
