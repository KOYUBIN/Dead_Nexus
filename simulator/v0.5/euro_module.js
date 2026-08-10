'use strict';
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
    mnaEnabled: true, // v6.9 (web 포팅): M&A Stage 1 — 11×11만 지분 인수 게이트 활성
  },
  '5x5': {
    label: '5×5 (튜토리얼)',
    maxRounds: 7,
    safetyRounds: 8,
    suppressionProb: 0.15,
    faction: { ghost: { min: 40, max: 65, target: 50 }, bloc: { min: 35, max: 60, target: 50 } },
    avgRound: { min: 5.0, max: 8.0, target: 7 },
    classWinRate: { min: 5, max: 55 },
    mnaEnabled: false, // v6.9 (web 포팅): 5×5 튜토리얼은 M&A 비활성
  },
};
function euro_mode(mapSize) {
  return MODE_CONFIG[mapSize] || MODE_CONFIG['11x11'];
}

// v6.9 (web 포팅): M&A Stage 1 — 지분 모델 + 11×11 게이트 (읽기 전용 표면화)
const NPC_MNA_FLOAT = 10; // 공개 미거래 float — 지분 분모 안정화 (Stage 2의 51% 임계와 직결)

// 블록 총 발행주식 = 비패배 플레이어 보유 합 + NPC float + 백기사 추가 float(Stage 3)
// v6.11 (Stage 3): meta.whiteKnight[bloc] = 백기사 방어로 제3자가 인수한 추가 발행주.
//   분모에 가산 → 공격자 지분율 희석. 홀딩 기반이 아니라 총발행 분모만 늘려
//   assetValue(가격×보유 기반)엔 영향 없고 M&A 지분 게이트에만 작용.
function euro_totalShares(state, bloc) {
  const players = (state && state.players) || [];
  let sum = 0;
  for (const p of players) {
    if (!p || p.defeated) continue;
    sum += (p.stocks && p.stocks[bloc]) || 0;
  }
  const wk = (state && state.meta && state.meta.whiteKnight && state.meta.whiteKnight[bloc]) || 0;
  // v6.19 (S02 밸런스): 시나리오별 float 오버라이드 (scenarioRule 게이팅). S02(코프 대전)는
  //   2~3 실참 Bloc + NPC 충원 소규모판 → 기본 float 10은 51% 게이트를 사실상 불가로 만든다
  //   (측정: 20R 자유주행에도 지분 ~54% 정체). float 하향으로 과반 인수 창을 실효화한다.
  //   외부 시그니처 불변 — index.html scenarioRule 플래그만 읽음(미지정/미로드 시 NPC_MNA_FLOAT).
  const float = (typeof scenarioRule === 'function') ? scenarioRule(state, 'mnaFloat', NPC_MNA_FLOAT) : NPC_MNA_FLOAT;
  return sum + float + wk;
}

// 특정 플레이어의 블록 지분율(%, 내림)
function euro_equityPct(state, playerIdx, bloc) {
  const p = state && state.players && state.players[playerIdx];
  if (!p) return 0;
  const total = euro_totalShares(state, bloc);
  if (!total) return 0;
  return Math.floor(((p.stocks && p.stocks[bloc]) || 0) / total * 100);
}

// M&A 인수 게이트가 이 맵 사이즈에서 활성인지 (11×11만 true)
function euro_mnaEnabled(state) {
  const mapSize = state && state.meta && state.meta.mapSize;
  const mode = euro_mode(mapSize);
  if (mode && typeof mode.mnaEnabled === 'boolean') return mode.mnaEnabled;
  return mapSize === '11x11';
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
// v6.7: 인간(P0) Bloc이 "잉여 자본" 조건이면 매R 자동 자사주가+1을 선택 결정(bloc_invest)으로 전환.
//       봇·NPC Bloc, 비잉여 인간, 모듈 미로드 시엔 기존 자동 자사주가+1 그대로 (봇 무변경).
function euro_marketCycle(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated) continue;
    if (p.role === 'bloc' && s.stocks[p.specific] != null) {
      if (pi === 0 && euro_shouldOfferBlocInvest(s, pi)) {
        // 인간 Bloc 잉여 자본 → 자동 혜택 유보, 결정 큐에 등록 (기본/만료 시 'stock'으로 원상 복구)
        s = euro_addPendingDecision(s, euro_makeBlocInvestDecision(s, pi));
      } else {
        s = euro_marketTradePrice(s, p.specific, 1);
      }
    }
  }
  return s;
}

// v6.7: Bloc 잉여 자본 투자 결정 트리거 게이트
// 잉여 조건 = ₵ ≥ EURO_BLOC_INVEST_SURPLUS. 라운드당 1회(euro_marketCycle이 R당 1회) +
// 큐에 bloc_invest 대기 중이면 스킵 → 모달 피로 방지.
const EURO_BLOC_INVEST_SURPLUS = 12;
function euro_shouldOfferBlocInvest(state, pi) {
  const p = state.players[pi];
  if (!p || p.defeated || p.role !== 'bloc') return false;
  if (typeof euro_addPendingDecision !== 'function') return false;
  if ((p.resources.credit || 0) < EURO_BLOC_INVEST_SURPLUS) return false; // 잉여 자본 조건
  const pending = state.meta.pendingDecisions || [];
  if (pending.some(d => d.type === 'bloc_invest')) return false;           // 같은 타입 대기 중이면 스킵
  return true;
}

function euro_makeBlocInvestDecision(state, pi) {
  const bloc = state.players[pi].specific;
  return {
    id: `bloc_invest_r${state.meta.round}`,
    type: 'bloc_invest',
    playerIdx: pi,
    prompt: '잉여 자본 투자처',
    options: [
      { id: 'stock',  label: `자사 주가 부양 (${bloc} +1)` },
      { id: 'credit', label: '운영비 비축 (₵+1)' },
    ],
    context: { round: state.meta.round, bloc },
  };
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
// v6.12: 11×11도 매R로 상향 (진영 균형 튜닝 — 격R 시 Ghost 과너프). BROKER 제외(자체 메모 시스템으로 평판 누적).
function euro_ghostHustle(state) {
  let s = state;
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
    // v6.11.3 (P0-3): veil이 레이드 threshold에도 가산됨을 로그에 반영
    if (typeof logEntry === 'function') s = logEntry(s, `🥷 P${pi} VANTA · ${coord} veil 토큰 +1 (Ghost 레이드 방어 +${(cell.veil || 0) + 1})`);
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
    // v6.11.3 (P0-3): garrison이 실제로 레이드 threshold에 가산되므로 허위 "자동 반격" → "방어 +N"로 정정
    if (typeof logEntry === 'function') s = logEntry(s, `⚔️ P${pi} IRONWALL · ${coord} 주둔 유닛 +1 (Ghost 레이드 방어 +${(cell.garrison || 0) + 1})`);
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

// v6.6: 견제 보복 메모리 (grudge) 튜닝 상수
// EURO_GRUDGE_BONUS — "나를 최근 견제한 자"에게 부여하는 위협도 가산치.
//   위협도 기본항(rep + raids×2 + asset/10)의 전형적 분산과 같은 스케일로 골랐다.
//   봇 평판은 초중반 3~10, 레이드 0~3(×2=0~6), 자산 항 0~5 정도라 위협도 차이가
//   보통 4~8 안에서 갈린다. +6은 "동급 위협이면 보복이 우선하지만, 명백히 더 위험한
//   제3자(예: rep 18 전설급)가 있으면 그쪽이 이긴다"는 확률적 우선을 만든다.
//   결정적(무한대)이 아니라 편향 — 요구사항 2와 일치.
// EURO_GRUDGE_WINDOW — 견제 기억 유효 라운드 수. 부여 라운드 R 기준 R..R+2까지 활성,
//   R+3(3라운드 경과)부터 소멸. 유로 게임 총 라운드가 7/10으로 짧아 3R 이상 끌면
//   보복이 게임 후반 전략을 왜곡하므로 2R로 단기 억제 루프에 한정.
const EURO_GRUDGE_BONUS = 6;
const EURO_GRUDGE_WINDOW = 2;
// v6.12 P0-3: 리더 브레이크 — 자산 단독 1위(선두) 견제 위협도 가산.
//   grudge(+6) 미만의 온건 상수라 "명백한 보복" 은 여전히 선두보다 우선하되,
//   동급 위협이면 선두가 눌린다. 결정론이 아닌 확률적 편향(발동은 suppressionProb 게이트).
const EURO_LEADER_BONUS = 4;

// v6.12 P0-1: 종료 선언자 = 봇 견제 최우선 타겟. grudge(+6)·leader(+4)보다 큰 상수라
//   유예 라운드 동안 선언자를 확실히 끌어내리려는 압력이 형성된다 (킹메이킹 방지엔
//   선언이 명시적 신호이므로 과대 편향 허용). 발동 확률·비용·토큰 수는 불변, "타겟 선정"만.
const EURO_DECLARER_BONUS = 10;

// v6.4 (web 포팅): 견제 토큰 봇 AI 부여 로직
// core.js applySuppression 이식. 매R 확률적으로 가장 부유한 봇 1명이 가장 위협적인
// 상대(인간 포함)에게 견제 토큰 1개 부여 (₵-5). 부여 직후 euro_applySuppression이
// 같은 R에 페널티 적용 (harness 즉시 효과 시맨틱과 동일).
// 웹 특화: (1) 부여 주체를 봇으로 제한 — 인간 ₵ 자동 소비 방지
//          (2) 확률은 MODE_CONFIG.suppressionProb 단일 소스 (11×11 0.30 / 5×5 0.15)
//          (3) 인간(P0) 타겟 시 lastTargetedBy 알림 배너
// v6.6: (4) 보복 편향 — 최근 EURO_GRUDGE_WINDOW라운드 내 나(부여 봇)를 견제한 상대는
//           위협도 +EURO_GRUDGE_BONUS. 발동 확률·비용·토큰 수는 불변, "타겟 선정"만 변화.
function euro_grantSuppression(state) {
  // v6.55 (협동): 전 좌석 한 팀 — 봇 견제 발동 금지 (coop_module 게이트, 비협동 false → 불변)
  if (typeof coop_pvpBlocked === 'function' && coop_pvpBlocked(state)) return state;
  const mode = (typeof euro_mode === 'function') ? euro_mode(state.meta.mapSize) : null;
  const prob = (mode && mode.suppressionProb != null) ? mode.suppressionProb : 0.3;
  if (Math.random() >= prob) return state;
  let s = state;
  // 부여 주체: 봇 · 미탈락 · ₵≥5 중 가장 부유한 1명
  const actors = s.players
    .map((p, pi) => ({ pi, p, credit: p.resources.credit || 0 }))
    .filter(x => x.p.kind === 'bot' && !x.p.defeated && x.credit >= 5);
  if (!actors.length) return s;
  actors.sort((a, b) => b.credit - a.credit);
  const pi = actors[0].pi;
  // v6.6: 보복 판정 — 이 봇(pi)이 최근 EURO_GRUDGE_WINDOW라운드 내에 견제당했고,
  // 그 가해자가 후보 적 ppi이면 grudge 활성. 기억은 피견제자(=현 부여 봇)에 저장된
  // lastSuppressedBy에서 읽는다.
  const round = (s.meta && s.meta.round) || 0;
  const myGrudge = s.players[pi].lastSuppressedBy;
  const isGrudgeTarget = (ppi) => !!myGrudge && myGrudge.by === ppi
    && (round - (myGrudge.round || 0)) >= 0
    && (round - (myGrudge.round || 0)) <= EURO_GRUDGE_WINDOW;
  // v6.12 P0-3: 자산 단독 1위(선두) 인덱스 — 동률·부재 시 -1 (편향 미적용)
  let leaderIdx = -1, leaderVal = -Infinity, leaderTie = false;
  for (let li = 0; li < s.players.length; li++) {
    const lp = s.players[li];
    if (!lp || lp.defeated) continue;
    const lv = (typeof assetValue === 'function') ? assetValue(lp, s.stocks, s) : 0;
    if (lv > leaderVal) { leaderVal = lv; leaderIdx = li; leaderTie = false; }
    else if (lv === leaderVal) leaderTie = true;
  }
  if (leaderTie) leaderIdx = -1;
  // v6.12 P0-1: 종료 선언자 인덱스 (활성 선언 있으면 최우선 견제)
  const declarerIdx = (s.meta && s.meta.victoryDeclaration) ? s.meta.victoryDeclaration.idx : -1;
  // 타겟: 가장 위협적인 상대 (평판 + 레이드×2 + 자산/10 + 보복 편향 + 선두 편향 + 선언자 편향)
  const threat = (pp, ppi) => (pp.resources.rep || 0)
    + (((s.meta.raidsThisGame || {})[ppi]) || 0) * 2
    + Math.floor((typeof assetValue === 'function' ? assetValue(pp, s.stocks, s) : 0) / 10)
    + (isGrudgeTarget(ppi) ? EURO_GRUDGE_BONUS : 0)
    + (ppi === leaderIdx ? EURO_LEADER_BONUS : 0)
    + (ppi === declarerIdx ? EURO_DECLARER_BONUS : 0);
  const enemies = s.players
    .map((pp, ppi) => ({ pi: ppi, pp }))
    .filter(x => x.pi !== pi && !x.pp.defeated);
  if (!enemies.length) return s;
  enemies.sort((a, b) => threat(b.pp, b.pi) - threat(a.pp, a.pi));
  const target = enemies[0];
  // 토큰 종류: 기본 무력, Bloc 상대+자기 레이드<2면 정보, 20% 외교
  let tokenType = 'combat';
  if (target.pp.role === 'bloc' && (((s.meta.raidsThisGame || {})[pi]) || 0) < 2) tokenType = 'info';
  else if (Math.random() < 0.2) tokenType = 'diplomacy';
  const spec = SUPPRESSION_SPEC[tokenType];
  const ps = [...s.players];
  ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, credit: (ps[pi].resources.credit || 0) - 5 } };
  const curTok = target.pp.suppressionTokens || { combat: 0, info: 0, diplomacy: 0 };
  // v6.6: 타겟에 보복 메모리 기록 (JSON 직렬화 가능 — LocalStorage 히스토리 호환)
  ps[target.pi] = {
    ...ps[target.pi],
    suppressionTokens: { ...curTok, [tokenType]: (curTok[tokenType] || 0) + 1 },
    lastSuppressedBy: { by: pi, round: round },
  };
  s = { ...s, players: ps };
  // v6.6: 이 타겟이 보복 편향으로 선택됐는지 (grudge 활성 상대)
  const isRetaliation = isGrudgeTarget(target.pi);
  // 인간(P0) 타겟 시 알림 배너
  if (target.pi === 0) {
    s = { ...s, meta: { ...s.meta, lastTargetedBy: { attacker: pi, effectKey: 'suppression', detail: `${spec.label} 견제 (${spec.resIcon}-1)${isRetaliation ? ' (보복)' : ''}` } } };
  }
  if (typeof logEntry === 'function') s = logEntry(s, `${spec.icon} P${pi} → P${target.pi} ${target.pp.specific} ${spec.label} 견제 (₵-5)${isRetaliation ? ' (보복)' : ''}`);
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
  else if (decision.type === 'raid_reward') s = euro_applyRaidRewardChoice(s, decision, choice);
  else if (decision.type === 'bloc_invest') s = euro_applyBlocInvestChoice(s, decision, choice);
  else if (decision.type === 'mna_defense') s = euro_applyMnaDefenseChoice(s, decision, choice); // v6.11 Stage 3
  // v6.52 (V12): 'negotiation'은 예약 타입 — 현재 생산자 0·resolve 분기 없음 (협상은 negoApply 직접 경로).
  //   도입 시 여기에 분기 추가 + euro_expireStaleDecisions 의 비만료 유지 조항이 함께 활성화된다.
  return s;
}

// v6.7: Bloc 잉여 자본 투자 — 자사 주가 부양(status quo) vs 운영비 비축(₵)
// [웹 경제 조사] 자사 주가는 승리 지표 assetValue에서 제외(isOwn continue)되고, 자사주 매도 불가·
// 주가 연동 배당 없음 → 자사주가+1의 점수 EV = 0. 크레딧 역시 assetValue 미포함(타 블록 주식+구역+건물만).
// ∴ 두 옵션 모두 assetValue Δ=0 → 승리 기대값 불변. 기본/만료 = 'stock'(euro_marketCycle의 기존 자동 혜택 그대로).
function euro_applyBlocInvestChoice(state, decision, choice) {
  const pi = decision.playerIdx || 0;
  const p = state.players[pi];
  if (!p) return state;
  let s = state;
  if (choice === 'credit') {
    const ps = [...state.players];
    ps[pi] = { ...p, resources: { ...p.resources, credit: (p.resources.credit || 0) + 1 } };
    s = { ...state, players: ps };
    if (typeof logEntry === 'function') s = logEntry(s, `🏦 P${pi} · 잉여 자본: 운영비 비축 (₵+1)`);
  } else {
    // 'stock' 및 기본값(만료 자동해소 포함) — 자사 주가 부양 (기존 자동 혜택과 동일 → 봇 대비 손해 없음)
    const bloc = (decision.context && decision.context.bloc) || p.specific;
    if (typeof euro_marketTradePrice === 'function' && s.stocks[bloc] != null) {
      s = euro_marketTradePrice(s, bloc, 1);
    }
    if (typeof logEntry === 'function') s = logEntry(s, `🏦 P${pi} · 잉여 자본: 자사 주가 부양 (${bloc} +1)`);
  }
  return s;
}

// v6.5: 레이드 성공 보상 — 평판 루트(★+rep) vs 약탈 루트(등가 자원)
// 밸런스 중립: rep 1개 = 2 units, credit·parts 각 1 unit (sim-harness 템플릿 3rep=4₵+2⚙ 기준).
// 약탈 번들은 rep의 총 가치를 그대로 자원으로 환산 → 총 기대값 불변.
function euro_raidLootBundle(rep) {
  const units = 2 * (rep || 0);           // rep 1개 = 2 units
  const parts = Math.round(units / 3);    // ⚙ 비율 ≈ credit 절반 (템플릿 4:2)
  const credit = units - parts;           // units 보존 → EV 중립
  return { credit, parts };
}

function euro_applyRaidRewardChoice(state, decision, choice) {
  const rep = (decision.context && decision.context.rep) || 0;
  const pi = decision.playerIdx || 0;
  const p = state.players[pi];
  if (!p) return state;
  const ps = [...state.players];
  let s = state;
  if (choice === 'loot') {
    const { credit, parts } = euro_raidLootBundle(rep);
    ps[pi] = { ...p, resources: { ...p.resources, credit: (p.resources.credit || 0) + credit, parts: (p.resources.parts || 0) + parts } };
    s = { ...state, players: ps };
    if (typeof logEntry === 'function') s = logEntry(s, `🧭 P${pi} · 레이드 보상: 약탈 루트 (₵+${credit}, ⚙+${parts})`);
  } else {
    // 'rep' 및 기본값(만료 자동해소 포함) — 평판 루트
    ps[pi] = { ...p, resources: { ...p.resources, rep: (p.resources.rep || 0) + rep } };
    s = { ...state, players: ps };
    if (typeof logEntry === 'function') s = logEntry(s, `🧭 P${pi} · 레이드 보상: 평판 루트 (★+${rep})`);
  }
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
  // v6.52 (V12): 'negotiation' 은 예약 타입(생산자 0) — 도입 시 비만료 유지용 데드 브랜치를 주석으로 명기.
  const keep = (d) => d.type === 'negotiation' || (d.context?.round ?? 0) >= state.meta.round;
  const fresh = pending.filter(keep);
  if (fresh.length === pending.length) return state;
  let s = { ...state, meta: { ...state.meta, pendingDecisions: fresh } };
  // v6.5: 만료되는 raid_reward 결정은 증발 방지 — 기본 옵션(평판 루트) 자동 적용
  for (const d of pending) {
    if (!keep(d) && d.type === 'raid_reward') s = euro_applyRaidRewardChoice(s, d, 'rep');
    // v6.7: 만료된 bloc_invest → 기본 옵션('stock') 자동 적용 = 기존 자동 자사주가+1 원상 복구.
    // (순수 소멸 시 인간 Bloc이 봇보다 손해 — 봇은 매R 자동 +1 수령 → 봇 파리티 유지 위해 기본 적용)
    if (!keep(d) && d.type === 'bloc_invest') s = euro_applyBlocInvestChoice(s, d, 'stock');
    // v6.11 Stage 3: 만료된 mna_defense → 기본 방어(재매입 가능→재매입, 아니면 상호 파괴) 자동 적용.
    if (!keep(d) && d.type === 'mna_defense') s = euro_applyMnaDefenseDefault(s, d);
  }
  return s;
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
  s = euro_grantSuppression(s);    // v6.4 (web 포팅) — 봇 AI 견제 토큰 부여 (적용보다 먼저 = 즉시 효과)
  s = euro_applySuppression(s);    // v6.3 (web 포팅) — 견제 토큰 페널티 (자원 +효과보다 먼저)
  s = euro_resolveMna(s);          // v6.10 (web 포팅) — M&A 방어(자동)+판정 (라운드 시작 시 1회)
  if (s.meta && s.meta.gameOver) return s; // M&A 즉시 승리면 이후 R 효과 스킵
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
  s = euro_declareMnaBots(s);      // v6.11 (web 포팅) — 봇 능동 M&A 선언 (Stage 3)
  s = euro_checkHighlights(s);
  s = euro_checkTMDecisions(s);    // v4.0.2: 마일스톤/어워드 결정 큐
  return s;
}

// ============================================================================
// v6.10 (web 포팅): M&A Stage 2 — 인간(P0) 적대적 인수 루프
// 선언(Phase1) → 방어(봇/NPC 자동) → 판정 → 자산 30% 흡수 · NPC 관리 전환 → 2블록 즉시 승리.
// 절차·수치는 docs/08-stock-mna.md §6·§9·§10 기준. 판정 타이밍 = "방어 직후"(§6 STEP3 허용):
//   선언 다음 NEXT_ROUND의 euro_applyAll 1회 pass 안에서 방어(자동)+판정을 함께 처리한다.
//   근거: 방어 주체가 전부 봇/NPC 자동이라 플레이어 개입용 라운드 간격이 불필요하고,
//   유로 게임(7~10R)에서 pendingMna를 여러 R 끌면 선언 2R 간격 규칙과 얽혀 상태가 취약해진다.
//   ∴ pendingMna 수명 = 정확히 1회 라운드 전환. 로직은 전부 이 모듈에, index.html은 리듀서+UI만.
// ============================================================================
const EURO_MNA_MAX_DECLARES = 3;      // docs §10: 게임당 선언 최대 3회/플레이어
const EURO_MNA_MIN_GAP = 2;           // docs §10: 선언 간 최소 2라운드 간격
const EURO_MNA_THRESHOLD = 51;        // docs §3: 51% 과반 = 적대적 인수 가능
const EURO_MNA_ABSORB = 0.30;         // docs §6: 인수 완료 시 자산 30% 흡수
const EURO_MNA_REBUY_PCT = 0.05;      // docs §6 STEP2: 재매입 방어 = 공격자 지분 5% 강제 매도
const EURO_MNA_SUCCESS_SELLOFF = 0.10;// docs §6 STEP3: 방어 성공 시 공격자 지분 5~10% 강제 매도(상한 채택)
const EURO_MNA_WIN_COUNT = 2;         // docs §9: 타 블록 2곳 완전 인수 = 즉시 승리

function euro_mnaCountFor(state, idx) {
  const m = (state.meta && state.meta.mnaCount) || {};
  return m[idx] || 0;
}
function euro_mnaLastRoundFor(state, idx) {
  const m = (state.meta && state.meta.mnaLastRound) || {};
  return (m[idx] == null) ? -Infinity : m[idx];
}
function euro_acquisitionsFor(state, idx) {
  const a = (state.meta && state.meta.acquisitions) || {};
  return a[idx] || [];
}

// 선언 게이트 — { ok, reason }. UI 버튼 활성/비활성 + 사유 표기에 그대로 사용.
function euro_declareMnaCheck(state, attackerIdx, bloc) {
  // v6.55 (협동): 적대 M&A 금지 — 인간 UI 버튼(사유 표기)·봇 선언(euro_declareMnaBots) 공용 게이트
  if (typeof coop_pvpBlocked === 'function' && coop_pvpBlocked(state))
    return { ok: false, reason: '협동전 — 적대 M&A 금지 (전 좌석 한 팀)' };
  if (typeof euro_mnaEnabled !== 'function' || !euro_mnaEnabled(state))
    return { ok: false, reason: '이 맵에선 M&A 비활성' };
  const attacker = state.players && state.players[attackerIdx];
  if (!attacker || attacker.defeated) return { ok: false, reason: '공격자 없음' };
  if (attacker.role === 'bloc' && attacker.specific === bloc)
    return { ok: false, reason: '자기 블록은 인수 불가' };
  if (state.meta && state.meta.pendingMna)
    return { ok: false, reason: '진행 중인 M&A 있음' };
  // v6.51 (E5): mna_freeze 뉴스 게이트를 check 로 이동 — UI 버튼이 자동 비활성+사유 표기.
  //   euro_declareMna 의 동일 검사는 이중 안전판으로 유지.
  if (state.meta && state.meta.mnaFrozenRound === state.meta.round)
    return { ok: false, reason: '블록 감독 위원회 — 이번 라운드 인수 불가' };
  if (euro_acquisitionsFor(state, attackerIdx).includes(bloc))
    return { ok: false, reason: '이미 인수한 블록' };
  // v6.51 (E14ⓓ): 유효 대상 검사 — resolveMna(대상 탐색)와 동일 기준. 해당 블록 좌석이 이미
  //   타 플레이어에게 흡수(acquiredBy)됐으면 재인수 경로 차단 (무주공 보상 반복 착취 방지).
  {
    const ownerP = state.players && state.players.find(p => p && p.role === 'bloc' && p.specific === bloc);
    if (ownerP && ownerP.acquiredBy != null)
      return { ok: false, reason: '이미 흡수된 블록 (재인수 불가)' };
  }
  if (euro_mnaCountFor(state, attackerIdx) >= EURO_MNA_MAX_DECLARES)
    return { ok: false, reason: `선언 횟수 소진 (${EURO_MNA_MAX_DECLARES}/${EURO_MNA_MAX_DECLARES})` };
  const round = (state.meta && state.meta.round) || 0;
  const last = euro_mnaLastRoundFor(state, attackerIdx);
  // v6.18: 시나리오 S02(코프 대전) — meta.mnaNoCooldown 이면 선언 간 2R 간격 게이트 무시(연속 M&A 허용).
  const noCd = !!(state.meta && state.meta.mnaNoCooldown);
  if (!noCd && last !== -Infinity && (round - last) < EURO_MNA_MIN_GAP)
    return { ok: false, reason: `선언 간 ${EURO_MNA_MIN_GAP}R 대기 (${EURO_MNA_MIN_GAP - (round - last)}R 남음)` };
  const eq = (typeof euro_equityPct === 'function') ? euro_equityPct(state, attackerIdx, bloc) : 0;
  if (eq < EURO_MNA_THRESHOLD)
    return { ok: false, reason: `지분 ${eq}% < ${EURO_MNA_THRESHOLD}%` };
  return { ok: true, reason: '' };
}

// 선언 적용 — 리듀서 DECLARE_MNA가 호출. 게이트 통과 시 pendingMna 설정 + 카운트/간격 트래킹.
function euro_declareMna(state, attackerIdx, bloc) {
  // v6.15: 블록 감독 위원회 뉴스(mna_freeze) — 이번 라운드 M&A 선언 전면 금지 (원전 003). 인간·봇 공통 단일 게이트, 시그니처 불변.
  if (state.meta && state.meta.mnaFrozenRound === state.meta.round) {
    if (typeof logEntry === 'function') return logEntry(state, `🚫 M&A 선언 거부: 블록 감독 위원회 (이번 라운드 인수 불가)`);
    return state;
  }
  const chk = euro_declareMnaCheck(state, attackerIdx, bloc);
  if (!chk.ok) {
    if (typeof logEntry === 'function') return logEntry(state, `🚫 M&A 선언 거부: ${chk.reason}`);
    return state;
  }
  const round = (state.meta && state.meta.round) || 0;
  const cnt = { ...((state.meta && state.meta.mnaCount) || {}) };
  const lr  = { ...((state.meta && state.meta.mnaLastRound) || {}) };
  cnt[attackerIdx] = (cnt[attackerIdx] || 0) + 1;
  lr[attackerIdx] = round;
  let s = {
    ...state,
    meta: {
      ...state.meta,
      pendingMna: { attacker: attackerIdx, target: bloc, declaredRound: round, defense: null },
      mnaCount: cnt,
      mnaLastRound: lr,
    },
  };
  const eq = (typeof euro_equityPct === 'function') ? euro_equityPct(s, attackerIdx, bloc) : 0;
  if (typeof logEntry === 'function')
    s = logEntry(s, `🎯 P${attackerIdx} · ${bloc} 적대적 인수 선언! (지분 ${eq}% · 선언 ${cnt[attackerIdx]}/${EURO_MNA_MAX_DECLARES}) — 다음 라운드 방어`);
  return s;
}

// 2블록 인수 즉시 승리 스캔 — gameOver/winner/winReason(기존 승리 처리 패턴)로 세팅.
function euro_checkMnaVictory(state) {
  if (state.meta && state.meta.gameOver) return state;
  const acqs = (state.meta && state.meta.acquisitions) || {};
  for (const k of Object.keys(acqs)) {
    const idx = Number(k);
    const list = acqs[k] || [];
    if (list.length >= EURO_MNA_WIN_COUNT) {
      const p = state.players[idx];
      const sp = p ? p.specific : `P${idx}`;
      let s = { ...state, meta: { ...state.meta, gameOver: true, winner: idx, winReason: `M&A 승리: ${list.join(' + ')} 2블록 완전 인수 (${sp})` } };
      if (typeof logEntry === 'function') s = logEntry(s, `👑 P${idx} ${sp} · M&A 승리! (${list.join(', ')} 인수 완료)`);
      return s;
    }
  }
  return state;
}

// 인수 완료(방어 실패) 효과 — 자산 30% 흡수 + acquisitions 기록 + 즉시 승리 체크.
function euro_completeMnaAcquisition(state, attackerIdx, targetIdx, bloc) {
  let s = state;
  const target = targetIdx >= 0 ? s.players[targetIdx] : null;
  if (target) {
    // 봇 블록: 크레딧 30%(내림) + 보유 구역 30%(내림) 이전. defeated/isNpc 미설정 —
    // 봇 루프(signal 등) 파손 방지 위해 acquiredBy 마커만 부착(= NPC 관리 전환의 안전 구현).
    const tcredit = target.resources.credit || 0;
    const grab = Math.floor(tcredit * EURO_MNA_ABSORB);
    const ownedZones = Object.keys(s.map).filter(c => s.map[c].owner === targetIdx);
    const takeN = Math.floor(ownedZones.length * EURO_MNA_ABSORB);
    const takeZones = ownedZones.slice(0, takeN);
    const newMap = { ...s.map };
    for (const c of takeZones) newMap[c] = { ...newMap[c], owner: attackerIdx };
    const ps = [...s.players];
    ps[targetIdx] = {
      ...ps[targetIdx],
      resources: { ...ps[targetIdx].resources, credit: tcredit - grab },
      acquiredBy: attackerIdx,
    };
    ps[attackerIdx] = {
      ...ps[attackerIdx],
      resources: { ...ps[attackerIdx].resources, credit: (ps[attackerIdx].resources.credit || 0) + grab },
    };
    s = { ...s, players: ps, map: newMap };
    if (typeof logEntry === 'function') s = logEntry(s, `🏴 M&A 완료! P${attackerIdx} → ${bloc} 인수 — 자산 30% 흡수 (₵+${grab}, 구역 ${takeN}곳 이전) · ${bloc} NPC 관리 전환`);
    // v6.13.1 (P1-1 / docs/05 §2.7): M&A 방어 실패 → 피인수 Bloc 덱 스캔들 오염 (인수 후 존속: acquiredBy 마커만).
    if (typeof insertScandal === 'function') s = insertScandal(s, targetIdx, 'M&A 방어 실패');
  } else {
    // NPC 블록(플레이어 없음): 상징 보상 ₵+10 + 해당 블록 주가 폭락 -5 (껍데기 흡수)
    const ps = [...s.players];
    ps[attackerIdx] = { ...ps[attackerIdx], resources: { ...ps[attackerIdx].resources, credit: (ps[attackerIdx].resources.credit || 0) + 10 } };
    s = { ...s, players: ps };
    if (typeof euro_marketTradePrice === 'function') s = euro_marketTradePrice(s, bloc, -5);
    if (typeof logEntry === 'function') s = logEntry(s, `🏴 M&A 완료! P${attackerIdx} → 무주공 ${bloc} 흡수 — 상징 보상 ₵+10, ${bloc} 주가 -5`);
  }
  const acq = { ...((s.meta && s.meta.acquisitions) || {}) };
  acq[attackerIdx] = [...(acq[attackerIdx] || []), bloc];
  s = { ...s, meta: { ...s.meta, acquisitions: acq, pendingMna: null } };
  s = euro_checkMnaVictory(s);
  return s;
}

// 방어(자동) + 판정 — euro_applyAll에서 매 NEXT_ROUND 전환 시 1회 호출.
function euro_resolveMna(state) {
  const pm = state.meta && state.meta.pendingMna;
  if (!pm) return state;
  let s = state;
  const attackerIdx = pm.attacker;
  const bloc = pm.target;
  const attacker = s.players[attackerIdx];
  if (!attacker || attacker.defeated) {
    if (typeof logEntry === 'function') s = logEntry(s, `⚖ M&A 무산: 공격자 부재 (${bloc})`);
    return { ...s, meta: { ...s.meta, pendingMna: null } };
  }
  // 대상 = 해당 블록을 소유한 미인수·미탈락 봇 Bloc 플레이어. 없으면 NPC 블록(무방어).
  const targetIdx = s.players.findIndex(p => p && !p.defeated && !p.acquiredBy && p.role === 'bloc' && p.specific === bloc);
  const target = targetIdx >= 0 ? s.players[targetIdx] : null;

  // === Stage 3: 법적 대응(지연) 판정 — 지연 만료 라운드 도달 시 재방어 없이 판정 ===
  if (pm.defense === 'legal') {
    if ((s.meta.round || 0) >= (pm.delayedUntil || 0)) {
      // 지연 소진 — 그 사이 인간이 매집했으면 지분<51로 방어 성공 가능
      return euro_mnaJudge(s, attackerIdx, targetIdx, bloc);
    }
    return s; // 아직 지연 중 — pendingMna 유지, 이번 R은 대기
  }

  // === Stage 3: 인간(P0) 타겟 — 자동 방어 금지. 방어 결정 모달 대기 ===
  // 선언 시점(euro_declareMnaBots)에 mna_defense 결정 큐 등록 + awaitingHuman 마킹 완료.
  // 응답이 오면 euro_applyMnaDefenseChoice가 즉시 판정, 무응답이면 euro_expireStaleDecisions가
  // 기본 방어(재매입 가능→재매입, 아니면 상호 파괴)를 적용한다. 여기선 대기만.
  if (target && target.kind === 'human') {
    return s;
  }

  // === STEP2: 방어 라운드 (봇/NPC 자동) ===
  let defense = 'none';
  if (target && target.kind === 'bot') {
    const credit = target.resources.credit || 0;
    if (credit >= 10) {
      // 주식 재매입: 대상 ₵-10, 공격자 총발행주 5%(내림,최소1) 강제 매도 → 시장가 환급
      const total = euro_totalShares(s, bloc);
      let qty = Math.floor(total * EURO_MNA_REBUY_PCT);
      if (qty < 1) qty = 1;
      const held = (attacker.stocks && attacker.stocks[bloc]) || 0;
      qty = Math.min(qty, held);
      const price = s.stocks[bloc] || 5;
      const ps = [...s.players];
      ps[targetIdx] = { ...ps[targetIdx], resources: { ...ps[targetIdx].resources, credit: credit - 10 } };
      ps[attackerIdx] = {
        ...ps[attackerIdx],
        resources: { ...ps[attackerIdx].resources, credit: (ps[attackerIdx].resources.credit || 0) + price * qty },
        stocks: { ...ps[attackerIdx].stocks, [bloc]: held - qty },
      };
      s = { ...s, players: ps };
      defense = 'rebuy';
      if (typeof logEntry === 'function') s = logEntry(s, `🛡 P${targetIdx} ${bloc} · 주식 재매입 방어 (₵-10) → 공격자 ${qty}주 강제 매도 (₵+${price * qty} 환급)`);
    } else {
      // 상호 파괴: 자사 주가 -3 (min1). 지분율(주 수 기준)엔 영향 없으나 지분 가치 급락.
      if (typeof euro_marketTradePrice === 'function') s = euro_marketTradePrice(s, bloc, -3);
      defense = 'scorched';
      if (typeof logEntry === 'function') s = logEntry(s, `💥 P${targetIdx} ${bloc} · 상호 파괴 방어 → ${bloc} 주가 -3 (지분 가치 급락)`);
    }
  } else {
    defense = 'none';
    if (typeof logEntry === 'function') s = logEntry(s, `🏳 ${bloc} · 무방어 (${target ? '방어 자원 없음' : 'NPC 블록'})`);
  }
  s = { ...s, meta: { ...s.meta, pendingMna: { ...pm, defense } } };

  // === STEP3: 판정 (공유 헬퍼) ===
  return euro_mnaJudge(s, attackerIdx, targetIdx, bloc);
}

// STEP3 판정 — 공격자 지분 재확인 후 방어 성공(<51%) 또는 인수 완료.
// Stage 2(봇/NPC 자동)·Stage 3(인간 방어/지연/만료 기본) 전 경로 공유. pendingMna는 이 함수가 소거.
function euro_mnaJudge(state, attackerIdx, targetIdx, bloc) {
  let s = state;
  const eqNow = (typeof euro_equityPct === 'function') ? euro_equityPct(s, attackerIdx, bloc) : 0;
  if (eqNow < EURO_MNA_THRESHOLD) {
    const held = (s.players[attackerIdx].stocks && s.players[attackerIdx].stocks[bloc]) || 0;
    let qty = Math.floor(euro_totalShares(s, bloc) * EURO_MNA_SUCCESS_SELLOFF);
    if (qty < 1) qty = 1;
    qty = Math.min(qty, held);
    const price = s.stocks[bloc] || 5;
    const ps = [...s.players];
    ps[attackerIdx] = {
      ...ps[attackerIdx],
      resources: { ...ps[attackerIdx].resources, credit: (ps[attackerIdx].resources.credit || 0) + price * qty },
      stocks: { ...ps[attackerIdx].stocks, [bloc]: held - qty },
    };
    s = { ...s, players: ps };
    if (typeof euro_marketTradePrice === 'function') s = euro_marketTradePrice(s, bloc, 2); // 방어 성공 보너스 +2
    s = { ...s, meta: { ...s.meta, pendingMna: null } };
    if (typeof logEntry === 'function') s = logEntry(s, `⚖ M&A 방어 성공! ${bloc} 인수 무산 — 공격자 지분 ${eqNow}%(<51), ${qty}주 강제 매도(₵+${price * qty}), ${bloc} 주가 +2`);
    return s;
  }
  // 방어 실패 → 인수 완료
  return euro_completeMnaAcquisition(s, attackerIdx, targetIdx, bloc);
}

// ============================================================================
// v6.11 (web 포팅): M&A Stage 3 — 봇 능동 인수 + 인간 방어 결정 모달 + 백기사
// 봇 Bloc이 51%+ 타 블록 보유 && 게이트 통과 시 매R 확률적 M&A 선언(보수적 heuristic).
// 봇→봇은 Stage 2 자동 방어·판정(euro_resolveMna) 그대로 재사용. 봇→인간(P0)이면
// mna_defense 결정 큐(4옵션) + lastTargetedBy 배너. 방어 선택 반영 후 euro_mnaJudge 판정.
// ============================================================================
const EURO_MNA_BOT_THRESHOLD = 55;    // 봇 선언 heuristic 1차 임계 — 55%+면 조건 무관 선언 후보
const EURO_MNA_BOT_PROB = 0.5;        // 적격 시 R당 선언 확률 (보수적 cadence — 2R 간격·3회 상한과 중첩)
const EURO_MNA_WK_HOLD_PCT = 0.20;    // 백기사: 제3자가 새 총발행의 20% 인수 → 분모 가산 wk = ceil(total/4)

// 자산 단독 선두 봇 Bloc 인덱스 (동률·부재 시 -1). 51~54% 선언 보조 조건.
function euro_botAssetLeader(state) {
  let best = -1, bestVal = -Infinity, tie = false;
  for (let pi = 0; pi < state.players.length; pi++) {
    const p = state.players[pi];
    if (!p || p.defeated || p.role !== 'bloc') continue;
    const v = (typeof assetValue === 'function') ? assetValue(p, state.stocks, state) : 0;
    if (v > bestVal) { bestVal = v; best = pi; tie = false; }
    else if (v === bestVal) { tie = true; }
  }
  return tie ? -1 : best;
}

// 봇 능동 M&A 선언 — euro_applyAll 후반에 1회. pendingMna 있으면 스킵(동시 1건).
// heuristic: 게이트 통과(≥51%) + (지분 ≥55% OR (≥51% && 자산 단독 선두)). 적격 중 최고 지분 선택,
// 확률 EURO_MNA_BOT_PROB로 실제 선언. 봇→인간이면 방어 결정 큐 + 배너.
function euro_declareMnaBots(state) {
  if (typeof euro_mnaEnabled !== 'function' || !euro_mnaEnabled(state)) return state;
  if (state.meta && state.meta.pendingMna) return state;
  let s = state;
  const leader = euro_botAssetLeader(s);
  const cands = [];
  for (let pi = 0; pi < s.players.length; pi++) {
    const atk = s.players[pi];
    if (!atk || atk.kind !== 'bot' || atk.defeated || atk.role !== 'bloc') continue;
    for (const bloc of Object.keys(s.stocks || {})) {
      if (bloc === atk.specific) continue;
      const chk = (typeof euro_declareMnaCheck === 'function') ? euro_declareMnaCheck(s, pi, bloc) : { ok: false };
      if (!chk.ok) continue; // 게이트: ≥51%, 간격, 횟수, 중복, 진행중 등 전부 포함
      const eq = (typeof euro_equityPct === 'function') ? euro_equityPct(s, pi, bloc) : 0;
      const heuristicOk = eq >= EURO_MNA_BOT_THRESHOLD || (eq >= EURO_MNA_THRESHOLD && pi === leader);
      if (!heuristicOk) continue;
      cands.push({ pi, bloc, eq });
    }
  }
  if (!cands.length) return s;
  cands.sort((a, b) => b.eq - a.eq);
  // v6.19 (S02 밸런스): 선언 cadence 시나리오 오버라이드 — 단일 pendingMna 슬롯이
  //   전역 병목(라운드당 인수 ≤1)이라, S02(2곳 인수 승리)는 cadence 를 높여 선두 봇의 연속 인수를 가속.
  const botProb = (typeof scenarioRule === 'function') ? scenarioRule(s, 'mnaBotProb', EURO_MNA_BOT_PROB) : EURO_MNA_BOT_PROB;
  if (Math.random() >= botProb) return s; // 보수적 cadence (S02 는 상향)
  const pick = cands[0];
  s = euro_declareMna(s, pick.pi, pick.bloc);
  if (!(s.meta && s.meta.pendingMna)) return s; // 방어적: 선언 거부됐으면 종료
  // 봇→인간(P0) 타겟이면 방어 결정 큐 + 피격 배너
  const tIdx = s.players.findIndex(p => p && !p.defeated && p.role === 'bloc' && p.specific === pick.bloc);
  if (tIdx === 0 && s.players[0] && s.players[0].kind === 'human') {
    s = euro_queueMnaDefense(s, pick.pi, pick.bloc);
  }
  return s;
}

// 봇→인간 방어 결정 큐 등록 + lastTargetedBy 배너 + pendingMna.awaitingHuman 마킹.
function euro_queueMnaDefense(state, attackerIdx, bloc) {
  let s = state;
  const p0 = s.players[0];
  const credit = (p0.resources && p0.resources.credit) || 0;
  const infl = (p0.resources && p0.resources.influence) || 0;
  const decision = {
    id: `mna_defense_${bloc}_r${s.meta.round}`,
    type: 'mna_defense',
    playerIdx: 0,
    prompt: `P${attackerIdx}가 ${bloc} 적대적 인수 선언! 방어 수단을 선택하라 (미응답 시 자동 방어)`,
    options: [
      { id: 'rebuy',       label: `주식 재매입 (₵10) — 공격자 지분 5% 강제 매도`, enabled: credit >= 10, keepDisabled: true },
      { id: 'whiteknight', label: `백기사 동맹 (🎙3) — 제3자 20% 인수로 공격자 지분 희석`, enabled: infl >= 3, keepDisabled: true },
      { id: 'legal',       label: `법적 대응 (🎙5) — 인수 1R 지연 (그 사이 주식 매집 방어)`, enabled: infl >= 5, keepDisabled: true },
      { id: 'scorched',    label: `상호 파괴 (자사 주가 -3) — 인수 진행되나 흡수 가치 하락` },
    ],
    context: { round: s.meta.round, bloc, attacker: attackerIdx },
  };
  s = euro_addPendingDecision(s, decision);
  s = { ...s, meta: { ...s.meta,
    pendingMna: { ...s.meta.pendingMna, awaitingHuman: true },
    lastTargetedBy: { attacker: attackerIdx, effectKey: 'mna', detail: `${bloc} 적대적 인수 — 방어 결정 필요` },
  } };
  if (typeof logEntry === 'function') s = logEntry(s, `🎯 P${attackerIdx} → 당신(${bloc}) 적대적 인수 선언! 방어 수단 선택 대기`);
  return s;
}

// 인간 방어 선택 적용 — euro_resolvePendingDecision(mna_defense) + 만료 기본이 호출.
// 재매입/백기사/상호파괴는 즉시 판정, 법적 대응은 1R 지연(판정 보류).
function euro_applyMnaDefenseChoice(state, decision, choice) {
  const pm = state.meta && state.meta.pendingMna;
  const bloc = (decision.context && decision.context.bloc);
  const attackerIdx = (decision.context && decision.context.attacker);
  if (!pm || pm.target !== bloc || pm.attacker !== attackerIdx) return state; // 정합 가드
  let s = state;
  const attacker = s.players[attackerIdx];
  const targetIdx = s.players.findIndex(p => p && !p.defeated && p.role === 'bloc' && p.specific === bloc);
  if (!attacker || attacker.defeated) {
    if (typeof logEntry === 'function') s = logEntry(s, `⚖ M&A 무산: 공격자 부재 (${bloc})`);
    return { ...s, meta: { ...s.meta, pendingMna: null } };
  }
  const p0 = s.players[0];
  const credit = (p0.resources && p0.resources.credit) || 0;
  const infl = (p0.resources && p0.resources.influence) || 0;

  // 주식 재매입 (₵10 → 공격자 총발행 5%(최소1) 강제 매도, 시장가 환급)
  if (choice === 'rebuy' && credit >= 10) {
    const total = euro_totalShares(s, bloc);
    let qty = Math.floor(total * EURO_MNA_REBUY_PCT);
    if (qty < 1) qty = 1;
    const held = (attacker.stocks && attacker.stocks[bloc]) || 0;
    qty = Math.min(qty, held);
    const price = s.stocks[bloc] || 5;
    const ps = [...s.players];
    ps[0] = { ...ps[0], resources: { ...ps[0].resources, credit: credit - 10 } };
    ps[attackerIdx] = { ...ps[attackerIdx],
      resources: { ...ps[attackerIdx].resources, credit: (ps[attackerIdx].resources.credit || 0) + price * qty },
      stocks: { ...ps[attackerIdx].stocks, [bloc]: held - qty } };
    s = { ...s, players: ps, meta: { ...s.meta, pendingMna: { ...pm, defense: 'rebuy', awaitingHuman: false } } };
    if (typeof logEntry === 'function') s = logEntry(s, `🛡 당신(${bloc}) · 주식 재매입 방어 (₵-10) → 공격자 ${qty}주 강제 매도`);
    return euro_mnaJudge(s, attackerIdx, targetIdx, bloc);
  }

  // 백기사 동맹 (🎙3 → 제3자가 새 총발행의 20% 인수 = 분모 +ceil(total/4), 공격자 지분 희석)
  if (choice === 'whiteknight' && infl >= 3) {
    const total = euro_totalShares(s, bloc);
    // wk/(total+wk) = 0.20 → wk = total/4 (올림)
    const wk = Math.max(1, Math.ceil(total * EURO_MNA_WK_HOLD_PCT / (1 - EURO_MNA_WK_HOLD_PCT)));
    const cur = { ...((s.meta && s.meta.whiteKnight) || {}) };
    cur[bloc] = (cur[bloc] || 0) + wk;
    const ps = [...s.players];
    ps[0] = { ...ps[0], resources: { ...ps[0].resources, influence: infl - 3 } };
    s = { ...s, players: ps, meta: { ...s.meta, whiteKnight: cur, pendingMna: { ...pm, defense: 'whiteknight', awaitingHuman: false } } };
    if (typeof logEntry === 'function') s = logEntry(s, `🎙 당신(${bloc}) · 백기사 동맹 (🎙-3) → 제3자 ${wk}주 인수, 공격자 지분 희석`);
    return euro_mnaJudge(s, attackerIdx, targetIdx, bloc);
  }

  // 법적 대응 (🎙5 → 판정 1R 지연. 그 사이 인간이 매집해 스스로 방어 가능)
  if (choice === 'legal' && infl >= 5) {
    const ps = [...s.players];
    ps[0] = { ...ps[0], resources: { ...ps[0].resources, influence: infl - 5 } };
    s = { ...s, players: ps, meta: { ...s.meta, pendingMna: { ...pm, defense: 'legal', awaitingHuman: false, delayedUntil: (s.meta.round || 0) + 1 } } };
    if (typeof logEntry === 'function') s = logEntry(s, `⚖ 당신(${bloc}) · 법적 대응 (🎙-5) → 인수 1R 지연 (다음 R 판정, 그 전에 매집 방어 가능)`);
    return s; // 판정 보류 — euro_resolveMna가 지연 만료 시 판정
  }

  // 상호 파괴 (자사 주가 -3. 지분 불변, 인수 진행되나 흡수 가치 하락) — 기본/폴백
  s = (typeof euro_marketTradePrice === 'function') ? euro_marketTradePrice(s, bloc, -3) : s;
  s = { ...s, meta: { ...s.meta, pendingMna: { ...pm, defense: 'scorched', awaitingHuman: false } } };
  if (typeof logEntry === 'function') s = logEntry(s, `💥 당신(${bloc}) · 상호 파괴 방어 → ${bloc} 주가 -3 (지분 가치 급락)`);
  return euro_mnaJudge(s, attackerIdx, targetIdx, bloc);
}

// 만료 기본 방어 — 재매입 가능하면 재매입, 아니면 상호 파괴. euro_expireStaleDecisions가 호출.
function euro_applyMnaDefenseDefault(state, decision) {
  const p0 = state.players[0];
  const credit = (p0 && p0.resources && p0.resources.credit) || 0;
  const choice = credit >= 10 ? 'rebuy' : 'scorched';
  // v6.51 (E14ⓒ): 빈 if 블록 삭제 — 로그는 euro_applyMnaDefenseChoice 내부에서 남음
  return euro_applyMnaDefenseChoice(state, decision, choice);
}

// HTML 글로벌 노출
if (typeof window !== 'undefined') {
  window.euro_applyAll = euro_applyAll;
  window.euro_gearBonus = euro_gearBonus;
  window.EURO_HIGHLIGHTS = EURO_HIGHLIGHTS;
  window.MODE_CONFIG = MODE_CONFIG;          // v6.2 (web 포팅)
  window.euro_mode = euro_mode;
  window.SUPPRESSION_SPEC = SUPPRESSION_SPEC; // v6.3 (web 포팅)
  window.euro_grantSuppression = euro_grantSuppression; // v6.4 (web 포팅)
  // v4.0.2: 결정 모달 골격
  window.EURO_MILESTONES_TM = EURO_MILESTONES_TM;
  window.EURO_AWARDS_TM = EURO_AWARDS_TM;
  window.euro_addPendingDecision = euro_addPendingDecision;
  window.euro_resolvePendingDecision = euro_resolvePendingDecision;
  window.euro_checkTMDecisions = euro_checkTMDecisions;
  window.euro_raidLootBundle = euro_raidLootBundle;   // v6.5: 레이드 보상 약탈 번들 계산
  // v6.9 (web 포팅): M&A Stage 1 — 지분 모델 + 11×11 게이트
  window.euro_equityPct = euro_equityPct;
  window.euro_mnaEnabled = euro_mnaEnabled;
  window.euro_totalShares = euro_totalShares;
  // v6.10 (web 포팅): M&A Stage 2 — 인간 공격자 인수 루프
  window.euro_declareMnaCheck = euro_declareMnaCheck;
  window.euro_declareMna = euro_declareMna;
  window.euro_resolveMna = euro_resolveMna;
  window.euro_checkMnaVictory = euro_checkMnaVictory;
  // v6.11 (web 포팅): M&A Stage 3 — 봇 능동 인수 + 인간 방어 + 백기사
  window.euro_declareMnaBots = euro_declareMnaBots;
  window.euro_queueMnaDefense = euro_queueMnaDefense;
  window.euro_applyMnaDefenseChoice = euro_applyMnaDefenseChoice;
  window.euro_mnaJudge = euro_mnaJudge;
}
