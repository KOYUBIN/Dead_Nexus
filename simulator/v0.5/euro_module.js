// ============================================================================
// DEAD NEXUS — simulator/v0.5 유로 메커닉 모듈 (v5.2.1+)
// sim-harness/euro_mechanics.js의 simulator 버전
// HTML <script src> 로 로드. simulator 글로벌 스코프에서 작동
// simulator의 coordsAdj, logEntry, assetValue, raiseTrack 함수에 의존
// ============================================================================

// v6.2 (web 포팅): sim-harness의 MODE_CONFIG 단일 소스 (mapSize별 파라미터)
// core.js의 maxRounds(10/7)와 일치해야 함 — 변경 시 양쪽 동시 수정
const MODE_CONFIG = {
  '11x11': {
    label: '11×11 (정식)',
    maxRounds: 10,
    safetyRounds: 12,
    suppressionProb: 0.30,
    faction: { ghost: { min: 40, max: 65, target: 50 }, bloc: { min: 35, max: 60, target: 50 } },
    avgRound: { min: 8.0, max: 11.0, target: 10 },
    classWinRate: { min: 5, max: 60 },
  },
  '5x5': {
    label: '5×5 (튜토리얼)',
    maxRounds: 7,
    safetyRounds: 8,
    suppressionProb: 0.15,
    faction: { ghost: { min: 40, max: 65, target: 50 }, bloc: { min: 35, max: 60, target: 50 } },
    avgRound: { min: 5.0, max: 8.0, target: 7 },
    classWinRate: { min: 5, max: 55 },
  },
};
function euro_mode(mapSize) {
  return MODE_CONFIG[mapSize] || MODE_CONFIG['11x11'];
}

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

// v6.0 (web 포팅): RIGGER 시그니처 — 함정망 전개
// 매R 부품 +1, 함정 3개마다 평판 +2. sim-harness/euro_mechanics.js와 동일 공식
function euro_riggerSignature(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'RIGGER') continue;
    const ps = [...s.players];
    const traps = (ps[pi].rigTraps || 0) + 1;
    let newRes = { ...ps[pi].resources, parts: (ps[pi].resources.parts || 0) + 1 };
    let bonus = '';
    if (traps % 3 === 0) { newRes.rep = (newRes.rep || 0) + 2; bonus = ' · 함정 발동 ★+2'; }
    ps[pi] = { ...ps[pi], resources: newRes, rigTraps: traps };
    s = { ...s, players: ps };
    if (typeof logEntry === 'function') s = logEntry(s, `🪤 P${pi} RIGGER · 함정망 전개 (⚙+1${bonus})`);
  }
  return s;
}

// v6.1 (web 포팅): HELIX 시그니처 — 클론 뱅크 복원
// core.js의 hp<maxHp 게이트는 Bloc에서 死문이라 점수 직결 보상으로 대체:
// 매R 클론+1·🎙+1, 3개마다 타사 최저가 주식 1주 자동 매집 (저속 누적형, AXIOM 차익거래와 구분)
function euro_helixSignature(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'HELIX' || p.role !== 'bloc') continue;
    const ps = [...s.players];
    const clones = (ps[pi].helixClones || 0) + 1;
    const newRes = { ...ps[pi].resources, influence: (ps[pi].resources.influence || 0) + 1 };
    const newStocks = { ...(ps[pi].stocks || {}) };
    let bonus = '';
    if (clones % 3 === 0) {
      const others = Object.keys(s.stocks).filter(b => b !== p.specific);
      others.sort((a, b) => (s.stocks[a] || 0) - (s.stocks[b] || 0));
      if (others.length) {
        const cheapest = others[0];
        newStocks[cheapest] = (newStocks[cheapest] || 0) + 1;
        bonus = ` · 클론 3개 → ${cheapest} 주식 매집`;
      }
    }
    ps[pi] = { ...ps[pi], resources: newRes, stocks: newStocks, helixClones: clones };
    s = { ...s, players: ps };
    if (typeof logEntry === 'function') s = logEntry(s, `🧬 P${pi} HELIX · 클론 뱅크 (🎙+1${bonus})`);
  }
  return s;
}

// v6.2 (web 포팅): CARBON 11×11 그리드 확장
// 11×11에서 CARBON Bloc 보유 구역 수에 따라 ₵ +1/+2/+3 (2/3/4+ 구역)
function euro_carbonGrid11x11(state) {
  if (state.meta.mapSize !== '11x11') return state;
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'CARBON' || p.role !== 'bloc') continue;
    const ownCount = Object.values(s.map).filter(c => c.owner === pi).length;
    const bonus = ownCount >= 4 ? 3 : ownCount >= 3 ? 2 : ownCount >= 2 ? 1 : 0;
    if (bonus > 0) {
      const ps = [...s.players];
      ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, credit: (ps[pi].resources.credit || 0) + bonus } };
      s = { ...s, players: ps };
      if (typeof logEntry === 'function') s = logEntry(s, `⚡ P${pi} CARBON · 그리드 확장 (11×11, ${ownCount}구역) → ₵+${bonus}`);
    }
  }
  return s;
}

// v6.2 (web 포팅): CIPHER 5×5 백그라운드 크롤러
// 5×5에서 해킹 노드 발동률 부족 보정 — 매R 📡(data) +1 자동
function euro_cipher5x5(state) {
  if (state.meta.mapSize !== '5x5') return state;
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'CIPHER') continue;
    const ps = [...s.players];
    ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, data: (ps[pi].resources.data || 0) + 1 } };
    s = { ...s, players: ps };
    if (typeof logEntry === 'function') s = logEntry(s, `💾 P${pi} CIPHER · 백그라운드 크롤러 (5×5) → 📡+1`);
  }
  return s;
}

// v6.2 (web 포팅): Ghost 허슬 — 진영 균형 보정
// euro_marketCycle의 Bloc 자기주가+1과 대칭. 매 R Ghost 평판 +1.
// 11×11에선 격R (BROKER 제외 — 자체 메모 시스템으로 평판 누적)
function euro_ghostHustle(state) {
  let s = state;
  if (state.meta.mapSize === '11x11' && state.meta.round % 2 === 0) return state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.role !== 'ghost') continue;
    if (s.meta.mapSize === '11x11' && p.specific === 'BROKER') continue;
    const ps = [...s.players];
    ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, rep: (ps[pi].resources.rep || 0) + 1 } };
    s = { ...s, players: ps };
  }
  return s;
}

// ============================================================================
// v6.3 (web 포팅, 3차): core.js applyClassSignatures의 6개 클래스 시그니처
// sim-harness 측은 core.js 동결이라 그 안에 살아있음. web 시뮬레이터는 자체
// 구현 부재(grep 확인) — 클래스별 특징을 sim-harness 공식 그대로 이식.
// 매R 효과로 euro_applyAll에 연결. simulator의 highlight(hackNodes/tradeMemo)
// 트리거와 호환.
// ============================================================================

// BLADE 시그니처 — 표적 시스템
// 1) 이전 R 표적이 처치됐으면 ★+8, 만료(2R 경과)면 ★-3
// 2) R 시작 시 가장 평판 높은 적을 새 표적으로 지정
function euro_bladeSignature(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'BLADE') continue;
    // 표적 결산
    if (p.target) {
      const tgt = s.players[p.target.playerIdx];
      if (tgt && tgt.defeated && p.target.round < s.meta.round) {
        const ps = [...s.players];
        ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, rep: (ps[pi].resources.rep || 0) + 8 }, target: null };
        s = { ...s, players: ps };
        if (typeof logEntry === 'function') s = logEntry(s, `🗡 P${pi} BLADE · 표적 처치 보상 → ★+8`);
      } else if (p.target.round < s.meta.round - 1) {
        const ps = [...s.players];
        ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, rep: Math.max(0, (ps[pi].resources.rep || 0) - 3) }, target: null };
        s = { ...s, players: ps };
        if (typeof logEntry === 'function') s = logEntry(s, `🗡 P${pi} BLADE · 표적 만료 → ★-3 (계약 실패)`);
      }
    }
    // 새 표적 지정
    const cur = s.players[pi];
    if (!cur.target) {
      const enemies = s.players.map((pp, ppi) => ({ pi: ppi, pp }))
        .filter(x => x.pi !== pi && !x.pp.defeated);
      if (enemies.length > 0) {
        enemies.sort((a, b) => (b.pp.resources.rep || 0) - (a.pp.resources.rep || 0));
        const target = enemies[0];
        const ps = [...s.players];
        ps[pi] = { ...ps[pi], target: { playerIdx: target.pi, round: s.meta.round } };
        s = { ...s, players: ps };
        if (typeof logEntry === 'function') s = logEntry(s, `🗡 P${pi} BLADE · 표적 지정 → P${target.pi} ${target.pp.specific} (처치 시 ★+8)`);
      }
    }
  }
  return s;
}

// BROKER 시그니처 — 메모 누적
// 매R 메모 +1. 5 도달 시 ₵+5·★+3 1회 보너스. simulator highlight diplomat_master(≥5)와 연동
function euro_brokerSignature(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'BROKER') continue;
    let ps = [...s.players];
    const newMemo = (ps[pi].tradeMemo || 0) + 1;
    ps[pi] = { ...ps[pi], tradeMemo: newMemo };
    s = { ...s, players: ps };
    if (newMemo === 5) {
      ps = [...s.players];
      ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, credit: (ps[pi].resources.credit || 0) + 5, rep: (ps[pi].resources.rep || 0) + 3 } };
      s = { ...s, players: ps };
      if (typeof logEntry === 'function') s = logEntry(s, `🤝 P${pi} BROKER · 메모 5 도달 → ₵+5, ★+3 (외교 능숙도)`);
    }
  }
  return s;
}

// CIPHER 시그니처 (11×11 — 해킹 노드) — Bloc HQ 인접 시 자동 발동
// simulator highlight hack_god(hackNodes ≥ 3)와 연동. 5×5는 별도 euro_cipher5x5 사용
function euro_cipherSignature(state) {
  if (state.meta.mapSize !== '11x11') return state;
  if (typeof coordsAdj !== 'function') return state;
  let s = state;
  // simulator는 window.BLOC_SETUP_11x11 / BLOC_SETUP 글로벌. 둘 다 미정의면 미발동.
  const setup11 = (typeof BLOC_SETUP_11x11 !== 'undefined') ? BLOC_SETUP_11x11 : (typeof window !== 'undefined' && window.BLOC_SETUP_11x11) || null;
  if (!setup11) return state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'CIPHER' || !p.position) continue;
    const adj = coordsAdj(p.position).concat([p.position]);
    const hqAdj = adj.find(c => {
      const cell = s.map[c];
      if (!cell || cell.owner == null) return false;
      const owner = s.players[cell.owner];
      if (!owner || owner.role !== 'bloc') return false;
      return setup11[owner.specific] && setup11[owner.specific].hq === c;
    });
    if (hqAdj) {
      const ownerIdx = s.map[hqAdj].owner;
      const bloc = s.players[ownerIdx].specific;
      const newStocks = { ...s.stocks, [bloc]: Math.max(1, (s.stocks[bloc] || 5) - 1) };
      const ps = [...s.players];
      ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, data: (ps[pi].resources.data || 0) + 2 }, hackNodes: (ps[pi].hackNodes || 0) + 1 };
      s = { ...s, players: ps, stocks: newStocks };
      if (typeof logEntry === 'function') s = logEntry(s, `💾 P${pi} CIPHER · 해킹 노드 활성 (${bloc} HQ 인접) → ${bloc} 주가-1, 자기 📡+2`);
    }
  }
  return s;
}

// MOLE 시그니처 — R2에 가장 약한 Bloc(주가 최저)으로 위장 (1회)
function euro_moleSignature(state) {
  if (state.meta.round !== 2) return state;
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'MOLE' || p.disguiseBloc) continue;
    const blocs = Object.entries(s.stocks).sort((a, b) => a[1] - b[1]);
    if (!blocs.length) continue;
    const disguise = blocs[0][0];
    const ps = [...s.players];
    ps[pi] = { ...ps[pi], disguiseBloc: disguise };
    s = { ...s, players: ps };
    if (typeof logEntry === 'function') s = logEntry(s, `🕷 P${pi} MOLE · 위장 시작 → ${disguise} 블록으로 위장`);
  }
  return s;
}

// VANTA 시그니처 — 자사 구역 veil 토큰 +1 (최대 3, 가장 적은 곳)
function euro_vantaSignature(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'VANTA' || p.role !== 'bloc') continue;
    const ownZones = Object.entries(s.map).filter(([c, cell]) => cell.owner === pi);
    if (!ownZones.length) continue;
    ownZones.sort((a, b) => (a[1].veil || 0) - (b[1].veil || 0));
    const [coord, cell] = ownZones[0];
    if ((cell.veil || 0) >= 3) continue;
    const newMap = { ...s.map, [coord]: { ...cell, veil: (cell.veil || 0) + 1 } };
    s = { ...s, map: newMap };
    if (typeof logEntry === 'function') s = logEntry(s, `🥷 P${pi} VANTA · ${coord} veil 토큰 +1 (Ghost 정찰 차단)`);
  }
  return s;
}

// IRONWALL 시그니처 — 자사 구역 garrison +1 (최대 3, 가장 적은 곳)
function euro_ironwallSignature(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'IRONWALL' || p.role !== 'bloc') continue;
    const ownZones = Object.entries(s.map).filter(([c, cell]) => cell.owner === pi);
    if (!ownZones.length) continue;
    ownZones.sort((a, b) => (a[1].garrison || 0) - (b[1].garrison || 0));
    const [coord, cell] = ownZones[0];
    if ((cell.garrison || 0) >= 3) continue;
    const newMap = { ...s.map, [coord]: { ...cell, garrison: (cell.garrison || 0) + 1 } };
    s = { ...s, map: newMap };
    if (typeof logEntry === 'function') s = logEntry(s, `⚔️ P${pi} IRONWALL · ${coord} 주둔 유닛 배치 (Ghost raid 시 자동 반격)`);
  }
  return s;
}

// AXIOM 시그니처 — 마켓 틱 (자동 매도/매수)
// 가장 비싼 비자사 주식 1주 매도 + 가장 싼 1주 매수 (algo trade)
function euro_axiomSignature(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'AXIOM' || p.role !== 'bloc') continue;
    const blocs = Object.keys(s.stocks).filter(b => b !== p.specific);
    if (blocs.length < 2) continue;
    blocs.sort((a, b) => (s.stocks[a] || 0) - (s.stocks[b] || 0));
    const cheapest = blocs[0];
    const expensive = blocs[blocs.length - 1];
    const myStocks = p.stocks || {};
    const ps = [...s.players];
    let newRes = { ...p.resources };
    let newStocksOwned = { ...myStocks };
    if ((newStocksOwned[expensive] || 0) > 0) {
      newStocksOwned[expensive] -= 1;
      newRes.credit = (newRes.credit || 0) + (s.stocks[expensive] || 0);
    }
    if (newRes.credit >= (s.stocks[cheapest] || 0)) {
      newStocksOwned[cheapest] = (newStocksOwned[cheapest] || 0) + 1;
      newRes.credit -= (s.stocks[cheapest] || 0);
    }
    ps[pi] = { ...ps[pi], resources: newRes, stocks: newStocksOwned };
    s = { ...s, players: ps };
    if (typeof logEntry === 'function') s = logEntry(s, `📈 P${pi} AXIOM · 마켓 틱 (${expensive} 매도 → ${cheapest} 매수)`);
  }
  return s;
}

// 견제 토큰 단일 명세 — sim-harness/euro_mechanics.js와 동일
const SUPPRESSION_SPEC = {
  combat:     { icon: '🔥', label: '무력',   resource: 'rep',       resIcon: '★'  },
  info:       { icon: '📡', label: '정보',   resource: 'data',      resIcon: '📡' },
  diplomacy:  { icon: '🤝', label: '외교',   resource: 'influence', resIcon: '🎙' },
};

// 견제 토큰 효과 적용 — R 시작 시 토큰 수만큼 해당 자원 깎고 토큰 소진
// (부여 로직은 봇 AI 측 별도 작업. 적용만 web에 추가 — 외부에서 토큰을 심으면 발동)
function euro_applySuppression(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated) continue;
    const tok = p.suppressionTokens;
    if (!tok || !(tok.combat || tok.info || tok.diplomacy)) continue;
    const ps = [...s.players];
    let newRes = { ...ps[pi].resources };
    let penalties = [];
    for (const [type, spec] of Object.entries(SUPPRESSION_SPEC)) {
      const cnt = tok[type] || 0;
      if (cnt > 0) {
        newRes[spec.resource] = Math.max(0, (newRes[spec.resource] || 0) - cnt);
        penalties.push(`${spec.resIcon}-${cnt}`);
      }
    }
    ps[pi] = { ...ps[pi], resources: newRes, suppressionTokens: { combat: 0, info: 0, diplomacy: 0 } };
    s = { ...s, players: ps };
    if (typeof logEntry === 'function') s = logEntry(s, `🚧 P${pi} ${p.specific} · 견제 효과 적용 ${penalties.join(' ')}`);
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

// ============================================================================
// v4.0.2 (모듈 v5.3.2): 결정 모달 골격 — P0 결정 큐
// state.meta.pendingDecisions[] 에 P0가 결정해야 할 사항 누적.
// React 모달은 v5.3.3에서 이 배열을 읽어 표시 + euro_resolvePendingDecision 호출.
// 봇(pi > 0)은 기존 휴리스틱으로 자동 결정 유지.
// ============================================================================

// 마일스톤 6종 (sim-harness/core.js MILESTONES_TM 포팅)
const EURO_MILESTONES_TM = {
  city_conqueror: {
    name: '🏙 도시 정복자', desc: '5구역 동시 점유 (Bloc)',
    check: (p, s, pIdx) => p.role === 'bloc' && Object.values(s.map).filter(c => c.owner === pIdx).length >= 5,
  },
  bounty_hunter: {
    name: '🎯 현상금 사냥꾼', desc: 'Bloc 평판 ≥ 8',
    check: (p, s) => p.role === 'bloc' && (p.resources.rep || 0) >= 8,
  },
  shadow_blade: {
    name: '🗡 그림자 칼날', desc: 'Ghost 평판 12 + 레이드 2회',
    check: (p, s, pIdx) => p.role === 'ghost' && (p.resources.rep || 0) >= 12 && (s.meta.raidsThisGame?.[pIdx] || 0) >= 2,
  },
  veteran: {
    name: '🌐 베테랑', desc: 'TL 4 + 자원 풀 합 5+',
    check: (p, s) => (p.tl || 1) >= 4 && ['M','I','V','S','B','A','GRID'].reduce((a, k) => a + (p.pool?.[k] || 0), 0) >= 5,
  },
  data_god: {
    name: '💾 데이터 신', desc: 'TL 3 + data 8+',
    check: (p, s) => (p.tl || 1) >= 3 && (p.resources.data || 0) >= 8,
  },
  diplomat: {
    name: '🤝 외교가', desc: 'influence 5+ (Bloc) / ₵20+ (Ghost)',
    check: (p, s) => p.role === 'bloc' ? (p.resources.influence || 0) >= 5 : (p.resources.credit || 0) >= 20,
  },
};
const EURO_MILESTONE_COST = 5;
const EURO_MILESTONE_POINTS = 5;
const EURO_MAX_MILESTONES = 3;

// 어워드 5종 (sim-harness/core.js AWARDS_TM 포팅)
const EURO_AWARDS_TM = {
  warrior: {
    name: '🔥 전사', desc: '레이드 수 + 무기 자원',
    measure: (p, s, pIdx) => (s.meta.raidsThisGame?.[pIdx] || 0) * 3 + (p.resources.weapons || 0),
  },
  asset_lord: {
    name: '💰 자산가', desc: '총 자산 (₵+주식 가치)',
    measure: (p, s) => {
      if (p.role === 'bloc' && typeof assetValue === 'function') return assetValue(p, s.stocks, s);
      return (p.resources.credit || 0) + Object.entries(p.stocks || {}).reduce((a, [b, n]) => a + n * (s.stocks[b] || 1), 0);
    },
  },
  explorer: {
    name: '🌃 탐험가', desc: '방문 구역 수 + 부품 자원',
    measure: (p, s, pIdx) => (s.meta.zonesVisited?.[pIdx]?.size || 0) * 2 + (p.resources.parts || 0),
  },
  info_king: {
    name: '📡 정보왕', desc: 'data + influence×2 + TL×2',
    measure: (p, s) => (p.resources.data || 0) + (p.resources.influence || 0) * 2 + (p.tl || 1) * 2,
  },
  street_legend: {
    name: '⭐ 거리 명성', desc: '평판 (Ghost) / 평판+influence×2 (Bloc)',
    measure: (p, s) => p.role === 'ghost' ? (p.resources.rep || 0) : ((p.resources.rep || 0) + (p.resources.influence || 0) * 2),
  },
};
const EURO_AWARD_COSTS = [8, 14, 20];
const EURO_AWARD_COST_LABELS = ['8₵ 펀딩 (1순위)', '14₵ 펀딩 (2순위)', '20₵ 펀딩 (3순위)'];
const EURO_MAX_AWARDS = 3;

// 게임 시작 시 풀 시드 (마일스톤 6→3종, 어워드 5→3종 랜덤)
function euro_initTMPools(state) {
  if (state.meta.euroMilestonesPool && state.meta.euroAwardsPool) return state;
  const pick3 = (keys) => [...keys].sort(() => Math.random() - 0.5).slice(0, 3);
  return {
    ...state,
    meta: {
      ...state.meta,
      euroMilestonesPool: state.meta.euroMilestonesPool || pick3(Object.keys(EURO_MILESTONES_TM)),
      euroAwardsPool: state.meta.euroAwardsPool || pick3(Object.keys(EURO_AWARDS_TM)),
      euroMilestonesClaimed: state.meta.euroMilestonesClaimed || {},
      euroMilestonesSkipped: state.meta.euroMilestonesSkipped || {},
      euroAwardsFunded: state.meta.euroAwardsFunded || [],
      pendingDecisions: state.meta.pendingDecisions || [],
    },
  };
}

// 결정 큐에 추가 — P0(playerIdx 0)만, 동일 id 중복 방지
function euro_addPendingDecision(state, decision) {
  if (!decision || decision.playerIdx !== 0) return state; // P0만 큐 대상
  const pending = state.meta.pendingDecisions || [];
  if (pending.some(d => d.id === decision.id)) return state;
  return { ...state, meta: { ...state.meta, pendingDecisions: [...pending, decision] } };
}

// 사용자 응답 처리 — React 모달(v5.3.3)이 호출
function euro_resolvePendingDecision(state, decisionId, choice) {
  const pending = state.meta.pendingDecisions || [];
  const decision = pending.find(d => d.id === decisionId);
  if (!decision) return state;
  let s = { ...state, meta: { ...state.meta, pendingDecisions: pending.filter(d => d.id !== decisionId) } };
  if (decision.type === 'milestone') s = euro_applyMilestoneChoice(s, decision, choice);
  else if (decision.type === 'award') s = euro_applyAwardChoice(s, decision, choice);
  // type 'negotiation'은 index.html 기존 협상 핸들러가 처리 (v5.3.3에서 연결)
  return s;
}

function euro_applyMilestoneChoice(state, decision, choice) {
  const key = decision.context.milestoneKey;
  let s = state;
  if (choice === 'claim') {
    const p = s.players[0];
    if ((p.resources.credit || 0) < EURO_MILESTONE_COST || s.meta.euroMilestonesClaimed[key] != null) return s;
    const ps = [...s.players];
    ps[0] = {
      ...p,
      resources: { ...p.resources, credit: (p.resources.credit || 0) - EURO_MILESTONE_COST },
      highlightPoints: (p.highlightPoints || 0) + EURO_MILESTONE_POINTS,
    };
    s = { ...s, players: ps, meta: { ...s.meta, euroMilestonesClaimed: { ...s.meta.euroMilestonesClaimed, [key]: 0 } } };
    if (typeof logEntry === 'function') s = logEntry(s, `🏆 P0 · 마일스톤 청구: ${EURO_MILESTONES_TM[key].name} (₵-${EURO_MILESTONE_COST}, +${EURO_MILESTONE_POINTS}pt)`);
  } else if (choice === 'skip') {
    s = { ...s, meta: { ...s.meta, euroMilestonesSkipped: { ...s.meta.euroMilestonesSkipped, [key]: true } } };
    if (typeof logEntry === 'function') s = logEntry(s, `🏆 P0 · 마일스톤 포기: ${EURO_MILESTONES_TM[key].name}`);
  }
  // choice === 'defer': 아무것도 안 함 → 다음 라운드에 재생성됨
  return s;
}

function euro_applyAwardChoice(state, decision, choice) {
  if (choice === 'pass' || !choice || !choice.startsWith('fund')) return state;
  let s = state;
  const key = decision.context.awardKey;
  const funded = s.meta.euroAwardsFunded || [];
  if (funded.length >= EURO_MAX_AWARDS || funded.some(f => f.key === key)) return s;
  const cost = EURO_AWARD_COSTS[funded.length]; // 펀딩 순서가 비용 결정
  const p = s.players[0];
  if ((p.resources.credit || 0) < cost) return s;
  const ps = [...s.players];
  ps[0] = { ...p, resources: { ...p.resources, credit: (p.resources.credit || 0) - cost } };
  s = { ...s, players: ps, meta: { ...s.meta, euroAwardsFunded: [...funded, { key, playerIdx: 0, cost }] } };
  if (typeof logEntry === 'function') s = logEntry(s, `🥇 P0 · 어워드 펀딩: ${EURO_AWARDS_TM[key].name} (₵-${cost})`);
  return s;
}

// 마일스톤: P0 조건 달성 시 결정 큐 추가, 봇은 자동 청구
function euro_checkMilestoneDecisions(state) {
  let s = state;
  for (const mKey of (s.meta.euroMilestonesPool || [])) {
    if (s.meta.euroMilestonesClaimed?.[mKey] != null) continue;
    if (Object.keys(s.meta.euroMilestonesClaimed || {}).length >= EURO_MAX_MILESTONES) break;
    const ms = EURO_MILESTONES_TM[mKey];
    if (!ms) continue;
    const eligible = s.players
      .map((p, pi) => ({ p, pi }))
      .filter(x => !x.p.defeated && (x.p.resources.credit || 0) >= EURO_MILESTONE_COST && ms.check(x.p, s, x.pi));
    const p0Eligible = eligible.some(x => x.pi === 0) && !s.meta.euroMilestonesSkipped?.[mKey];
    if (p0Eligible) {
      // P0 결정 대기 — 이번 R엔 봇 청구 보류 (모달 응답 기회), 경고로 경쟁 노출
      const otherClaimers = eligible.filter(x => x.pi !== 0).map(x => `P${x.pi}`);
      s = euro_addPendingDecision(s, {
        id: `milestone_${mKey}_r${s.meta.round}`,
        type: 'milestone',
        playerIdx: 0,
        prompt: `${ms.name} 청구하시겠습니까?${otherClaimers.length ? ` ⚠ 다른 봇도 조건 달성 (${otherClaimers.join(', ')})` : ''}`,
        options: [
          { id: 'claim', label: `지금 청구 (₵-${EURO_MILESTONE_COST}, +${EURO_MILESTONE_POINTS}pt)`, effect: 'apply_milestone' },
          { id: 'defer', label: '보류 (다음 R에 재결정)', effect: 'next_round' },
          { id: 'skip',  label: '포기 (이번 게임 청구 X)', effect: 'skip_forever' },
        ],
        context: { milestoneKey: mKey, round: s.meta.round, otherClaimers },
      });
    } else {
      // 봇 자동 청구 (기존 휴리스틱: 첫 적격자)
      const bot = eligible.find(x => x.pi !== 0);
      if (bot) {
        const ps = [...s.players];
        ps[bot.pi] = {
          ...bot.p,
          resources: { ...bot.p.resources, credit: (bot.p.resources.credit || 0) - EURO_MILESTONE_COST },
          highlightPoints: (bot.p.highlightPoints || 0) + EURO_MILESTONE_POINTS,
        };
        s = { ...s, players: ps, meta: { ...s.meta, euroMilestonesClaimed: { ...s.meta.euroMilestonesClaimed, [mKey]: bot.pi } } };
        if (typeof logEntry === 'function') s = logEntry(s, `🏆 P${bot.pi} ${bot.p.specific} · 마일스톤 청구: ${ms.name} (₵-${EURO_MILESTONE_COST}, +${EURO_MILESTONE_POINTS}pt)`);
      }
    }
  }
  return s;
}

// 어워드: P0가 1~2위 예상 + 자원 충분 시 결정 큐 추가, 봇은 자동 펀딩 (R당 1건)
function euro_checkAwardDecisions(state) {
  let s = state;
  const funded = s.meta.euroAwardsFunded || [];
  if (funded.length >= EURO_MAX_AWARDS) return s;
  const nextCost = EURO_AWARD_COSTS[funded.length];

  for (const aKey of (s.meta.euroAwardsPool || [])) {
    if ((s.meta.euroAwardsFunded || []).some(f => f.key === aKey)) continue;
    const award = EURO_AWARDS_TM[aKey];
    if (!award) continue;
    const scores = s.players
      .map((p, pi) => ({ pi, score: award.measure(p, s, pi), credit: p.resources.credit || 0, defeated: p.defeated }))
      .filter(x => !x.defeated)
      .sort((a, b) => b.score - a.score);
    const top2 = scores.slice(0, 2);
    const p0Top = top2.find(x => x.pi === 0 && x.credit >= nextCost);
    if (p0Top) {
      // 3개 어워드 풀 + 현재 1~2위 예측을 context로 노출 (모달이 표시)
      const poolPreview = (s.meta.euroAwardsPool || []).map(k => {
        const a = EURO_AWARDS_TM[k];
        const ranked = s.players.map((p, pi) => ({ pi, score: a.measure(p, s, pi) })).sort((x, y) => y.score - x.score);
        return { awardKey: k, name: a.name, top2: ranked.slice(0, 2).map(r => `P${r.pi}(${r.score})`) };
      });
      s = euro_addPendingDecision(s, {
        id: `award_${aKey}_r${s.meta.round}`,
        type: 'award',
        playerIdx: 0,
        prompt: `${award.name} 어워드를 펀딩하시겠습니까? (현재 ${funded.length + 1}순위 — ₵${nextCost})`,
        options: [
          ...EURO_AWARD_COSTS.map((c, i) => ({
            id: `fund_${i}`,
            label: EURO_AWARD_COST_LABELS[i],
            effect: 'fund_award',
            enabled: i === funded.length, // 펀딩 순서상 현재 슬롯만 활성
          })),
          { id: 'pass', label: '패스', effect: 'pass' },
        ],
        context: { awardKey: aKey, round: s.meta.round, nextCost, poolPreview },
      });
      break; // R당 1건만 질문
    }
    // 봇 자동 펀딩 (기존 휴리스틱: 1~2위 중 자원 충분한 봇)
    const bot = top2.find(x => x.pi !== 0 && x.credit >= nextCost);
    if (bot) {
      const p = s.players[bot.pi];
      const ps = [...s.players];
      ps[bot.pi] = { ...p, resources: { ...p.resources, credit: (p.resources.credit || 0) - nextCost } };
      s = { ...s, players: ps, meta: { ...s.meta, euroAwardsFunded: [...(s.meta.euroAwardsFunded || []), { key: aKey, playerIdx: bot.pi, cost: nextCost }] } };
      if (typeof logEntry === 'function') s = logEntry(s, `🥇 P${bot.pi} ${p.specific} · 어워드 펀딩: ${award.name} (₵-${nextCost})`);
      break; // R당 1건만
    }
  }
  return s;
}

// 라운드 전환 시 만료된 결정 제거 (defer 의미론: 다음 R에 조건 충족 시 재생성)
function euro_expireStaleDecisions(state) {
  const pending = state.meta.pendingDecisions || [];
  if (!pending.length) return state;
  const fresh = pending.filter(d => d.type === 'negotiation' || (d.context?.round ?? 0) >= state.meta.round);
  if (fresh.length === pending.length) return state;
  return { ...state, meta: { ...state.meta, pendingDecisions: fresh } };
}

// 결정 시스템 통합 hook
function euro_checkTMDecisions(state) {
  let s = euro_initTMPools(state);
  s = euro_expireStaleDecisions(s);
  s = euro_checkMilestoneDecisions(s);
  s = euro_checkAwardDecisions(s);
  return s;
}

// 통합 hook — NEXT_ROUND마다 호출
function euro_applyAll(state) {
  let s = state;
  s = euro_applySuppression(s);    // v6.3 (web 포팅) — 견제 토큰 페널티 (자원 +효과보다 먼저)
  s = euro_tryConvertResources(s);
  s = euro_marketCycle(s);
  s = euro_networkIncome(s);
  s = euro_drifterNerf5x5(s);
  s = euro_riggerSignature(s);     // v6.0 (web 포팅) — 함정망
  s = euro_helixSignature(s);      // v6.1 (web 포팅) — 클론 뱅크
  s = euro_carbonGrid11x11(s);     // v6.2 (web 포팅) — 11×11 그리드
  s = euro_cipher5x5(s);           // v6.2 (web 포팅) — 5×5 크롤러
  s = euro_ghostHustle(s);         // v6.2 (web 포팅) — 진영 균형
  s = euro_bladeSignature(s);      // v6.3 (web 포팅) — BLADE 표적
  s = euro_brokerSignature(s);     // v6.3 (web 포팅) — BROKER 메모
  s = euro_cipherSignature(s);     // v6.3 (web 포팅) — CIPHER 11×11 해킹 노드
  s = euro_moleSignature(s);       // v6.3 (web 포팅) — MOLE R2 위장
  s = euro_vantaSignature(s);      // v6.3 (web 포팅) — VANTA veil
  s = euro_ironwallSignature(s);   // v6.3 (web 포팅) — IRONWALL garrison
  s = euro_axiomSignature(s);      // v6.3 (web 포팅) — AXIOM 마켓 틱
  s = euro_checkHighlights(s);
  s = euro_checkTMDecisions(s);    // v4.0.2: 마일스톤/어워드 결정 큐
  return s;
}

// HTML 글로벌 노출
if (typeof window !== 'undefined') {
  window.euro_applyAll = euro_applyAll;
  window.euro_gearBonus = euro_gearBonus;
  window.EURO_HIGHLIGHTS = EURO_HIGHLIGHTS;
  window.MODE_CONFIG = MODE_CONFIG;          // v6.2 (web 포팅)
  window.euro_mode = euro_mode;
  window.SUPPRESSION_SPEC = SUPPRESSION_SPEC; // v6.3 (web 포팅)
  // v4.0.2: 결정 모달 골격
  window.EURO_MILESTONES_TM = EURO_MILESTONES_TM;
  window.EURO_AWARDS_TM = EURO_AWARDS_TM;
  window.euro_addPendingDecision = euro_addPendingDecision;
  window.euro_resolvePendingDecision = euro_resolvePendingDecision;
  window.euro_checkTMDecisions = euro_checkTMDecisions;
}
