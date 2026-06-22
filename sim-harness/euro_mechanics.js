// ============================================================================
// DEAD NEXUS — 유로 메커닉 모듈 (v5.0+)
// core.js 다음에 concat되어 같은 스코프에서 실행됨
// core.js를 동결한 상태에서 새 유로 메커닉 (자원 변환, 동적 시장 등) 추가용
// 새 함수는 core.js 기존 함수와 이름 충돌 없도록 접두사 euro_ 사용
// ============================================================================

// ============================================================================
// v6.0 — 모드 설정 단일 소스 (Item 1: 11×11 / 5×5 인터페이스 통합)
// 이전: mapSize === '5x5' 분기 검사가 core/euro/balance_test에 흩어져 있었음.
// 지금: 모드별 파라미터를 한 곳(MODE_CONFIG)에 모으고 euro_mode()로 조회.
//   - balance_test.js의 THRESHOLDS, 견제 발동 확률, 클래스 승률 허용폭이 모두 여기서 파생
//   - core.js의 maxRounds(10/7)도 동일 값 — core는 동결이라 직접 참조는 못 하지만
//     값이 일치하도록 doc 주석으로 고정 (변경 시 양쪽 동시 수정)
// ============================================================================
const MODE_CONFIG = {
  '11x11': {
    label: '11×11 (정식)',
    maxRounds: 10,          // core.js NEXT_ROUND과 일치 (변경 시 동시 수정)
    safetyRounds: 12,       // batchRun while 루프 안전 상한 (게임은 maxRounds에서 종료)
    suppressionProb: 0.30,  // 매 R 견제 발동 확률
    faction: { ghost: { min: 40, max: 65, target: 50 }, bloc: { min: 35, max: 60, target: 50 } },
    avgRound: { min: 8.0, max: 11.0, target: 10 },
    classWinRate: { min: 5, max: 60 },
  },
  '5x5': {
    label: '5×5 (튜토리얼)',
    maxRounds: 7,           // core.js NEXT_ROUND과 일치 (변경 시 동시 수정)
    safetyRounds: 8,
    suppressionProb: 0.15,  // 작은 보드: 견제가 Ghost를 과도하게 약화 → 절반으로 너프
    faction: { ghost: { min: 40, max: 65, target: 50 }, bloc: { min: 35, max: 60, target: 50 } },
    avgRound: { min: 5.0, max: 8.0, target: 7 },
    classWinRate: { min: 5, max: 55 },  // 작은 보드 분산 큼 → 상한 약간 낮춤
  },
};
// 모드 조회 헬퍼 — 미지정/오타 시 11×11로 폴백
function euro_mode(mapSize) {
  return MODE_CONFIG[mapSize] || MODE_CONFIG['11x11'];
}

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

// ============================================================================
// v5.1: 자원 변환 점수 통합 + 하이라이트 30종 + DRIFTER 5×5 너프
// ============================================================================

// v5.1.0a: DRIFTER 5×5 너프 — 매 R 이동 시 평판 -1 (작은 보드 이동 우위 상쇄)
function euro_drifterNerf5x5(state) {
  if (state.meta.mapSize !== '5x5') return state;
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'DRIFTER') continue;
    // v5.1.1: 매R 적용 (이전 격R, DRIFTER 62.5% 폭주 추가 너프)
    {
      const ps = [...s.players];
      const newRep = Math.max(0, (ps[pi].resources.rep || 0) - 1);
      ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, rep: newRep } };
      s = { ...s, players: ps };
      s = logEntry(s, `🌃 P${pi} DRIFTER · 5×5 이동 페널티 ★-1`);
    }
  }
  return s;
}

// v5.1.0b: 자원 변환 점수 보너스 — computeFinalScore 후처리
// gear/intel 보유당 +1pt 게임 끝에 가산
function euro_finalBonus(finalState) {
  if (!finalState.meta.finalScores) return finalState;
  const newScores = finalState.meta.finalScores.map(sc => {
    const p = finalState.players[sc.pi];
    const gear = (p.converted && p.converted.gear) || 0;
    const intel = (p.converted && p.converted.intel) || 0;
    const convBonus = gear + intel;
    if (convBonus === 0) return sc;
    return { ...sc, total: sc.total + convBonus, breakdown: { ...sc.breakdown, convert: `+${convBonus}(gear${gear}/intel${intel})` } };
  });
  // 패배 시 절반 페널티 다시 적용
  newScores.forEach(sc => { if (sc.defeated && !sc._defeated_applied) { sc.total = sc.total; sc._defeated_applied = true; } });
  newScores.sort((a, b) => b.total - a.total);
  const winner = newScores[0];
  const reasonParts = Object.entries(winner.breakdown).map(([k, v]) => `${k}:${v}`).join(' / ');
  return { ...finalState, meta: {
    ...finalState.meta,
    winner: winner.pi,
    winReason: `점수 ${winner.total}pt (${reasonParts})`,
    finalScores: newScores,
  }};
}

// v5.1.0c: 하이라이트 30종 — 매 R 트리거 체크, 점수 보너스
// 디자인 사양의 18종 신규 + 기존 12종 일부 재정의
const EURO_HIGHLIGHTS = {
  // Ghost 특화
  hp_one_raid: { name: '🤕 역전 한 수', pts: 5, check: (p, s, pi) => p.role === 'ghost' && p.hp === 1 && (s.meta.raidsThisR?.[pi] || 0) > 0 },
  triple_raid: { name: '🗡 삼연속 레이드', pts: 4, check: (p, s, pi) => p.role === 'ghost' && (s.meta.raidsThisGame?.[pi] || 0) >= 3 },
  zero_wanted: { name: '👻 무흔적', pts: 3, check: (p, s) => p.role === 'ghost' && (p.wanted || 0) === 0 && s.meta.round >= 5 },
  // Bloc 특화
  imperium: { name: '🏙 임페륨', pts: 3, check: (p, s, pi) => p.role === 'bloc' && Object.values(s.map).filter(c => c.owner === pi).length >= 5 },
  stock_legend: { name: '💰 상장', pts: 3, check: (p, s) => p.role === 'bloc' && (s.stocks[p.specific] || 0) >= 15 },
  // 공용
  // v5.2.5: 외교 고수 4→3pt (BROKER 메모5 자동 도달 — 사실상 보장 점수라 폭주 원인)
  diplomat_master: { name: '🤝 외교 고수', pts: 3, check: (p, s) => (p.tradeMemo || 0) >= 5 },
  hack_god: { name: '💾 해킹 신', pts: 3, check: (p, s) => p.specific === 'CIPHER' && (p.hackNodes || 0) >= 3 },
  cyber_full: { name: '⚛ 사이버웨어 풀', pts: 3, check: (p, s) => (p.cyberware || []).length >= 3 },
  ten_zone: { name: '🏗 10구역', pts: 3, check: (p, s, pi) => p.role === 'bloc' && Object.values(s.map).filter(c => c.owner === pi).length >= 10 },
  rep_legend: { name: '⭐ 거리 전설', pts: 3, check: (p) => (p.resources.rep || 0) >= 18 },
  asset_tycoon: { name: '💎 자산가', pts: 3, check: (p, s) => p.role === 'bloc' && assetValue(p, s.stocks, s) >= 60 },
};

// 매 R 끝에 하이라이트 체크 (1회성 — 한번 받으면 중복 X)
function euro_checkHighlights(state) {
  let s = state;
  const claimed = s.meta.highlightsClaimed || {};
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated) continue;
    for (const [key, hl] of Object.entries(EURO_HIGHLIGHTS)) {
      if (claimed[key]) continue;
      try {
        if (hl.check(p, s, pi)) {
          const ps = [...s.players];
          // 보너스 점수는 finalScore에서 합산하기 위해 player에 저장
          ps[pi] = { ...ps[pi], highlightPoints: (ps[pi].highlightPoints || 0) + hl.pts };
          s = { ...s, players: ps, meta: { ...s.meta, highlightsClaimed: { ...claimed, [key]: pi } } };
          s = logEntry(s, `✨ P${pi} ${p.specific} · 하이라이트 [${hl.name}] +${hl.pts}pt`);
          break;
        }
      } catch (e) { /* check 에러는 무시 */ }
    }
  }
  return s;
}

// euro_finalBonus를 확장 — 하이라이트 점수도 합산
const euro_finalBonus_orig = euro_finalBonus;
function euro_finalBonus_v51(finalState) {
  let s = euro_finalBonus_orig(finalState);
  if (!s.meta.finalScores) return s;
  const newScores = s.meta.finalScores.map(sc => {
    const p = s.players[sc.pi];
    const hl = p.highlightPoints || 0;
    if (hl === 0) return sc;
    return { ...sc, total: sc.total + hl, breakdown: { ...sc.breakdown, highlights: `+${hl}` } };
  });
  newScores.sort((a, b) => b.total - a.total);
  const winner = newScores[0];
  const reasonParts = Object.entries(winner.breakdown).map(([k, v]) => `${k}:${v}`).join(' / ');
  return { ...s, meta: {
    ...s.meta,
    winner: winner.pi,
    winReason: `점수 ${winner.total}pt (${reasonParts})`,
    finalScores: newScores,
  }};
}

// ============================================================================
// v5.2: 잔여 밸런스 수정 + 트레이스 카운터
// ============================================================================

// v5.2.0: 트레이스 카운터 — 게임 1판 동안 시그니처/하이라이트/견제 발동 누적
// harness_body.js runOneGame 시작 시 euro_resetTrace() 호출, 결과에 복사
// v6.0: EURO_TRACE_DETAIL=true (--trace 모드)면 발동 타임라인을 라운드별로 기록
var EURO_TRACE_DETAIL = false;
var EURO_TRACE = { signatureTriggers: {}, highlightTriggers: 0, suppressionCount: 0, timeline: [] };
function euro_resetTrace() {
  EURO_TRACE = { signatureTriggers: {}, highlightTriggers: 0, suppressionCount: 0, timeline: [] };
}

// v5.2.0: logEntry 오버라이드 (core.js 동결 유지 — 같은 스코프 후순위 선언이 이김)
// core.js 원본과 동일 동작 + 로그 메시지 패턴으로 트레이스 카운터 누적
const EURO_SIG_PATTERNS = [
  ['BLADE', /BLADE · (표적 지정|표적 처치|표적 만료)/],
  ['MOLE', /MOLE · 위장/],
  ['AXIOM', /AXIOM · 마켓 틱/],
  ['CIPHER', /CIPHER · (해킹 노드|백그라운드 크롤러)/],
  ['CARBON', /CARBON · 그리드/],
  ['VANTA', /VANTA · .*veil/],
  ['IRONWALL', /IRONWALL · .*주둔/],
  ['HELIX', /HELIX · 클론/],
  ['BROKER', /BROKER · 메모/],
  ['RIGGER', /RIGGER · 함정/],
];
function logEntry(s, msg) {
  if (typeof EURO_TRACE !== 'undefined' && EURO_TRACE) {
    let kind = null;
    if (msg.includes('하이라이트')) { EURO_TRACE.highlightTriggers++; kind = 'highlight'; }
    else if (msg.includes('견제 (₵')) { EURO_TRACE.suppressionCount++; kind = 'suppression'; }
    else {
      for (const [cls, re] of EURO_SIG_PATTERNS) {
        if (re.test(msg)) {
          EURO_TRACE.signatureTriggers[cls] = (EURO_TRACE.signatureTriggers[cls] || 0) + 1;
          kind = 'signature';
          break;
        }
      }
    }
    // v6.0: --trace 모드면 발동 타임라인 기록 (라운드 + 종류 + 메시지)
    if (kind && EURO_TRACE_DETAIL) {
      EURO_TRACE.timeline.push({ round: s.meta.round, kind, msg });
    }
  }
  return { ...s, log: [...s.log, { round: s.meta.round, phase: s.meta.phase, message: msg }].slice(-150) };
}

// ============================================================================
// 견제(Suppression) 토큰 시스템 — applySuppression 오버라이드
// ----------------------------------------------------------------------------
// 매 R 봇 1명이 가장 위협적인 적에게 견제 토큰 1개를 부여(₵-5). 토큰은 다음 R
// 시작 시 core.js applyClassSignatures에서 소비되어 해당 자원을 깎는다.
//
// 흐름 4단계 (각 단계 = 함수 1개, RNG 호출 순서는 core.js v4.0.3a 원본과 동일):
//   1) selectSuppressionActor  — 누가 견제하나 (확률 게이트 포함)
//   2) selectSuppressionTarget — 누구를 견제하나 (위협도 최고 적)
//   3) selectSuppressionType   — 어떤 토큰을 쓰나 (무력/정보/외교)
//   4) applySuppressionImpl    — ₵ 차감 + 토큰 부여 + 로그
//
// 토큰 3종 단일 명세 (SUPPRESSION_SPEC) — 부여(아래)와 소비(core.js 2562~)가
// 같은 의미를 공유하도록 한 곳에 정의. 효과 컬럼은 소비 시 깎이는 자원이다.
const SUPPRESSION_SPEC = {
  combat:     { ko: '무력', icon: '🔥', drains: 'rep',       sym: '★' },  // 평판 -N
  info:       { ko: '정보', icon: '📡', drains: 'data',      sym: '📡' }, // 데이터 -N
  diplomacy:  { ko: '외교', icon: '🤝', drains: 'influence', sym: '🎙' }, // 인플루언스 -N
};
// v5.2.1: 5×5 견제 너프 — 발동 확률 30%→15% (작은 보드에서 Ghost 과약화 방지)
// v6.0: 확률은 MODE_CONFIG.suppressionProb에서 조회 (단일 소스)

// 1) 견제 시전자 선정 — ₵5 이상 보유자 중 최다 크레딧 + 확률 게이트
// 발동 안 하면 null 반환
function selectSuppressionActor(state) {
  const candidates = state.players
    .map((p, pi) => ({ pi, p, credit: p.resources.credit || 0 }))
    .filter(x => !x.p.defeated && x.credit >= 5);
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => b.credit - a.credit);
  // v6.0: 발동 확률을 MODE_CONFIG에서 조회 (5×5=15%, 11×11=30%)
  const prob = euro_mode(state.meta.mapSize).suppressionProb;
  if (Math.random() >= prob) return null;
  return candidates[0].pi;
}

// 2) 표적 선정 — 위협도 = 평판 + raid 누적×2 + 자산/10, 최고 위협 적 반환 ({pi, pp} 또는 null)
function selectSuppressionTarget(state, pi) {
  const s = state;
  const enemies = s.players.map((pp, ppi) => ({ pi: ppi, pp })).filter(x => x.pi !== pi && !x.pp.defeated);
  if (enemies.length === 0) return null;
  enemies.sort((a, b) => {
    const tA = (a.pp.resources.rep || 0) + (s.meta.raidsThisGame?.[a.pi] || 0) * 2 + Math.floor(assetValue(a.pp, s.stocks, s) / 10);
    const tB = (b.pp.resources.rep || 0) + (s.meta.raidsThisGame?.[b.pi] || 0) * 2 + Math.floor(assetValue(b.pp, s.stocks, s) / 10);
    return tB - tA;
  });
  return enemies[0];
}

// 3) 토큰 타입 휴리스틱 — Bloc 표적 + 시전자 raid 경험 부족 → info, 20% diplomacy, 기본 combat
function selectSuppressionType(state, attackerPi, target) {
  if (target.pp.role === 'bloc' && (state.meta.raidsThisGame?.[attackerPi] || 0) < 2) return 'info';
  if (Math.random() < 0.2) return 'diplomacy';
  return 'combat';
}

// 4) 실행 — 시전자 ₵-5 차감 + 표적에 토큰 부여 + 로그
function applySuppressionImpl(state, pi, target, tokenType) {
  let s = state;
  const ps = [...s.players];
  ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, credit: (ps[pi].resources.credit || 0) - 5 } };
  const curTok = target.pp.suppressionTokens || { combat: 0, info: 0, diplomacy: 0 };
  ps[target.pi] = { ...ps[target.pi], suppressionTokens: { ...curTok, [tokenType]: (curTok[tokenType] || 0) + 1 } };
  s = { ...s, players: ps };
  const spec = SUPPRESSION_SPEC[tokenType];
  return logEntry(s, `${spec.icon} P${pi} → P${target.pi} ${target.pp.specific} ${spec.ko} 견제 (₵-5)`);
}

// 통합 진입점 — 시전자 → 표적 → 타입 → 실행 순서로 호출
function applySuppression(state) {
  const pi = selectSuppressionActor(state);
  if (pi == null) return state;
  const target = selectSuppressionTarget(state, pi);
  if (target == null) return state;
  const tokenType = selectSuppressionType(state, pi, target);
  return applySuppressionImpl(state, pi, target, tokenType);
}

// v5.2.2: CARBON 11×11 강화 — 전력 그리드 확장
// core.js 시그니처(3구역+ ₵+2)에 더해 11×11 한정: 2구역+ ₵+1, 3구역+ ₵+2, 4구역+ ₵+3 추가
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
      s = logEntry(s, `⚡ P${pi} CARBON · 그리드 확장 (11×11, ${ownCount}구역) → ₵+${bonus}`);
    }
  }
  return s;
}

// v5.2.3: CIPHER 5×5 강화 — 해킹 노드가 5×5에서 안 발동 (HQ 인접 기회 부족)
// 5×5 한정: HQ 인접 여부 무관하게 매 R 데이터+1 기본 (백그라운드 크롤러)
function euro_cipher5x5(state) {
  if (state.meta.mapSize !== '5x5') return state;
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'CIPHER') continue;
    const ps = [...s.players];
    ps[pi] = { ...ps[pi], resources: { ...ps[pi].resources, data: (ps[pi].resources.data || 0) + 1 } };
    s = { ...s, players: ps };
    s = logEntry(s, `💾 P${pi} CIPHER · 백그라운드 크롤러 (5×5) → 📡+1`);
  }
  return s;
}

// v5.2.4: Ghost 허슬 — 진영 균형 보정 (측정: Ghost 11×11 34% / 5×5 24%)
// euro_marketCycle의 Bloc 자기주가+1 (매R 자산+보유주식수)과 대칭되는 Ghost 소득
// 매 R Ghost 평판 +1 (거리 평판 누적 — Bloc 자산 성장 속도와 균형)
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

// v6.0: RIGGER 시그니처 — 유일하게 시그니처가 없던 클래스
// (N=600 측정: 11×11 20% / 5×5 12%로 양 모드 최저 + applyClassSignatures에 RIGGER 항목 부재)
// 정체성: 자동 함정/터렛 리거(PATCH). 매 R 부품 축적(→장비 변환→raid 보너스),
// 함정 누적 시 평판 보상(함정이 라이벌을 포착 = 거리 명성). 약클래스 버프라 보수적으로.
function euro_riggerSignature(state) {
  let s = state;
  for (let pi = 0; pi < s.players.length; pi++) {
    const p = s.players[pi];
    if (p.defeated || p.specific !== 'RIGGER') continue;
    const ps = [...s.players];
    const traps = (ps[pi].rigTraps || 0) + 1;          // 매 R 함정 +1
    let newRes = { ...ps[pi].resources, parts: (ps[pi].resources.parts || 0) + 1 };
    let bonus = '';
    if (traps % 3 === 0) { newRes.rep = (newRes.rep || 0) + 2; bonus = ' · 함정 발동 ★+2'; }  // 3개마다 평판 +2
    ps[pi] = { ...ps[pi], resources: newRes, rigTraps: traps };
    s = { ...s, players: ps };
    s = logEntry(s, `🪤 P${pi} RIGGER · 함정망 전개 (⚙+1${bonus})`);
  }
  return s;
}

// ============================================================================
// v6.0 — 결정(Decision) 모달 골격 (Item 6 / v4.0.2)
// 의미 있는 선택 지점을 구조화. UI는 pendingDecision을 모달로 띄우고, 헤드리스/봇은
// euro_autoResolveDecision으로 자동 선택. "결정 깊이(decision depth)" 확장의 토대.
//
// 기본은 inert(라이브 트리거 없음) — 인프라 + 자기검증만 제공해 밸런스 불변 유지.
// 실제 결정 지점 연결은 다음 사이클(결정 깊이) 작업이며 재측정 필요.
//
// 흐름:
//   euro_requestDecision(state, templateId, pi) → state.meta.pendingDecision 설정
//   (UI)        모달 표시 → euro_resolveDecision(state, optionId)
//   (헤드리스)  euro_autoResolveDecision(state) → weight 최고 옵션 자동 선택
// option = { id, label, weight(s,pi)→봇 선호도, apply(s,pi)→새 state }
// ============================================================================
const DECISION_TEMPLATES = {
  // 레이드 성공 보상 — 명성 루트 vs 약탈(자원) 루트 (두 옵션 가치 대등 → 밸런스 중립적)
  raid_reward: {
    prompt: '레이드 성공 — 보상 선택',
    options: [
      { id: 'rep',  label: '★ 명성 +3 (평판 루트)',
        weight: (s, pi) => 5 + (((s.players[pi].resources.rep) || 0) < 15 ? 3 : 0),
        apply: (s, pi) => euro_addRes(s, pi, { rep: 3 }) },
      { id: 'loot', label: '₵+4, ⚙+2 (약탈 루트)',
        weight: (s, pi) => 5 + (((s.players[pi].resources.credit) || 0) < 5 ? 3 : 0),
        apply: (s, pi) => euro_addRes(s, pi, { credit: 4, parts: 2 }) },
    ],
  },
  // 잉여 자본 투자처 (Bloc) — 주가 부양 vs 운영비 비축
  bloc_invest: {
    prompt: '잉여 자본 투자처',
    options: [
      { id: 'stock',  label: '자사 주가 부양 (+2)',
        weight: (s, pi) => 5,
        apply: (s, pi) => {
          const sp = s.players[pi].specific;
          return (typeof euro_marketTradePrice === 'function' && s.stocks[sp] != null)
            ? euro_marketTradePrice(s, sp, 2) : s;
        } },
      { id: 'credit', label: '운영비 비축 (₵+3)',
        weight: (s, pi) => 4,
        apply: (s, pi) => euro_addRes(s, pi, { credit: 3 }) },
    ],
  },
};

// 자원 가산 헬퍼 (불변)
function euro_addRes(state, pi, delta) {
  const ps = [...state.players];
  const res = { ...ps[pi].resources };
  for (const [k, v] of Object.entries(delta)) res[k] = (res[k] || 0) + v;
  ps[pi] = { ...ps[pi], resources: res };
  return { ...state, players: ps };
}

// 결정 요청 — 한 번에 1개만 처리 (이미 있으면 무시)
function euro_requestDecision(state, templateId, playerIdx) {
  if (state.meta.pendingDecision) return state;
  const tmpl = DECISION_TEMPLATES[templateId];
  if (!tmpl) return state;
  return { ...state, meta: { ...state.meta, pendingDecision: {
    templateId, playerIdx, prompt: tmpl.prompt,
    options: tmpl.options.map(o => ({ id: o.id, label: o.label })),
  } } };
}

// 결정 해소 — 선택 옵션 apply + pendingDecision 해제
function euro_resolveDecision(state, optionId) {
  const pd = state.meta.pendingDecision;
  if (!pd) return state;
  const tmpl = DECISION_TEMPLATES[pd.templateId];
  const opt = tmpl && tmpl.options.find(o => o.id === optionId);
  let s = { ...state, meta: { ...state.meta, pendingDecision: null } };
  if (opt) {
    s = opt.apply(s, pd.playerIdx);
    s = logEntry(s, `🧭 P${pd.playerIdx} 결정: ${opt.label}`);
  }
  return s;
}

// 헤드리스/봇 자동 해소 — weight 최고 옵션 (동점 시 랜덤 타이브레이크)
function euro_autoResolveDecision(state) {
  const pd = state.meta.pendingDecision;
  if (!pd) return state;
  const tmpl = DECISION_TEMPLATES[pd.templateId];
  if (!tmpl) return { ...state, meta: { ...state.meta, pendingDecision: null } };
  const ranked = tmpl.options
    .map(o => ({ id: o.id, w: (o.weight ? o.weight(state, pd.playerIdx) : 1) + Math.random() }))
    .sort((a, b) => b.w - a.w);
  return euro_resolveDecision(state, ranked[0].id);
}

function euro_applyAll(state) {
  let s = state;
  s = euro_tryConvertResources(s);
  s = euro_marketCycle(s);
  s = euro_networkIncome(s);
  s = euro_drifterNerf5x5(s);
  s = euro_carbonGrid11x11(s);
  s = euro_cipher5x5(s);
  s = euro_ghostHustle(s);
  s = euro_riggerSignature(s);
  s = euro_checkHighlights(s);
  return s;
}
