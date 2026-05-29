// ============================================================================
// DEAD NEXUS — 유로 메커닉 모듈 (v5.0+)
// core.js 다음에 concat되어 같은 스코프에서 실행됨
// core.js를 동결한 상태에서 새 유로 메커닉 (자원 변환, 동적 시장 등) 추가용
// 새 함수는 core.js 기존 함수와 이름 충돌 없도록 접두사 euro_ 사용
// ============================================================================

// v5.0.3: 동적 시장 가격 — 주식 매도 시 가격 하락, 매수 시 상승 (공급/수요)
// 양 진영 모두 주식 거래 가능하므로 비대칭 영향 적음
// state.stocks를 직접 변동시키는 헬퍼
function euro_marketTradePrice(state, blocName, delta) {
  // delta > 0: 매수 압력 (가격 상승), delta < 0: 매도 압력 (가격 하락)
  const newStocks = { ...state.stocks };
  const cur = newStocks[blocName] || 5;
  newStocks[blocName] = Math.max(1, Math.min(20, cur + delta));
  return { ...state, stocks: newStocks };
}

// v5.0.1: 자원 변환 체인 (브라스 산업 체인 스타일)
// 기존 자원(부품/데이터)을 중간재(장비/인텔)로 변환 → 점수/효과 증폭
// state.players[pi].converted = { gear: N, intel: N } 누적
//
// 변환 비용:
//   부품 2개 → 장비 1개 (제조 LV1)
//   데이터 2개 → 인텔 1개 (정보 LV1)
// 보너스:
//   장비: raidBonus +1 per piece (최대 +3) — raidBonus 함수와 별개
//   인텔: 마일스톤 청구 시 ₵5 → ₵3 할인 (인텔 1개 사용)
//
// 봇은 R 시작 시 자동 변환 (자원 충분하면)
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
    // 부품 2개 → 장비 1개 (장비 최대 3개까지)
    while (parts >= 2 && gear < 3) {
      parts -= 2;
      gear += 1;
      changed = true;
    }
    // 데이터 2개 → 인텔 1개 (인텔 최대 3개)
    while (data >= 2 && intel < 3) {
      data -= 2;
      intel += 1;
      changed = true;
    }
    if (changed) {
      const ps = [...s.players];
      ps[pi] = {
        ...ps[pi],
        resources: { ...ps[pi].resources, parts, data },
        converted: { gear, intel },
      };
      s = { ...s, players: ps };
      s = logEntry(s, `🔧 P${pi} ${p.specific} · 자원 변환 (장비 ${gear}, 인텔 ${intel})`);
    }
  }
  return s;
}

// v5.0.1: 장비 보너스 raid 시 호출 — raidBonus 함수와 합산
// core.js의 raidBonus(p) = 3 + min(3, weapons/3) 와 합쳐 사용
function euro_gearBonus(p) {
  const gear = (p.converted && p.converted.gear) || 0;
  return Math.min(3, gear);
}

// v5.0.1: 인텔 보너스 마일스톤 청구 비용 할인
// 마일스톤 청구 시 인텔 1개 사용하면 ₵3만 들고, 인텔도 차감
function euro_intelDiscount(p) {
  return (p.converted && p.converted.intel) || 0;
}

// v5.0.3: 시장 페이즈 — R 시작 시 자동 시장 사이클
// Bloc은 자기 주식 1주 가격 +1 (자기 호재), Ghost는 자기가 raid한 Bloc 주가 -1 추가
// 게임 중 자연스러운 가격 변동 → 예측 가능한 시장 사이클 (유로식)
function euro_marketCycle(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated) continue;
    // Bloc 자기 주식 +1 (자기 회사 마케팅 효과)
    if (p.role === 'bloc' && s.stocks[p.specific] != null) {
      s = euro_marketTradePrice(s, p.specific, 1);
    }
    // Ghost는 raid 누적이 있으면 가장 많이 친 Bloc 주가 -1 (이미 raid가 함, 추가는 안 함)
  }
  return s;
}

// v5.0.2: 네트워크 점수 보너스 — 게임 중 수익 보너스 (점수 직결 X)
// Bloc이 인접 자사 구역 3개+ 연결 시 매 R ₵+1 보너스
// 비대칭 게임에서 Ghost에 영향 없음 (Ghost는 구역 미소유)
function euro_networkIncome(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.role !== 'bloc') continue;
    // 인접 체인 크기 계산 (core.js computeNetworkScore의 BFS 재사용 불가하므로 inline)
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
        for (const adj of coordsAdj(cur)) {
          if (owned.has(adj) && !visited.has(adj)) {
            visited.add(adj);
            queue.push(adj);
          }
        }
      }
      if (size > maxChain) maxChain = size;
    }
    if (maxChain >= 3) {
      const bonus = Math.min(3, maxChain - 2); // 체인 3=+1, 4=+2, 5+=+3
      const ps = [...s.players];
      ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, credit: (ps[pi].resources.credit || 0) + bonus } };
      s = { ...s, players: ps };
      s = logEntry(s, `🌐 P${pi} ${p.specific} · 네트워크 수익 ₵+${bonus} (체인 ${maxChain})`);
    }
  }
  return s;
}

// v5.0+: 통합 유로 메커닉 hook — NEXT_ROUND마다 호출
// core.js reducer NEXT_ROUND case에서 applySuppression 다음에 호출하도록 추가
function euro_applyAll(state) {
  let s = state;
  s = euro_tryConvertResources(s);
  s = euro_marketCycle(s);
  s = euro_networkIncome(s);
  return s;
}
