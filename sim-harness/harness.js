// ============================================================================
// DEAD NEXUS 헤드리스 시뮬 하네스
// 봇 4명(또는 4 블록)으로 N판 돌려 승률·라운드·밸런스 데이터 수집
// ============================================================================

// localStorage 스텁
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
};

// core.js를 전역에 펼쳐서 로드
const fs = require('fs');
const coreJs = fs.readFileSync(__dirname + '/core.js', 'utf8');
// eval 후 필요한 심볼을 global에 추출
eval(coreJs);

// 시뮬 한 판 실행
function runOneGame({ humanRole = 'ghost', humanSpecific = 'BLADE', maxRounds = 8, trace = false } = {}) {
  let state = initGame(humanRole, humanSpecific);
  // 초기 덱: DRAW_INITIAL 액션 에뮬레이트
  state = reducer(state, { type: 'DRAW_INITIAL' });

  let safety = 0;
  while (!state.meta.gameOver && state.meta.round <= maxRounds && safety < 500) {
    safety++;
    // Phase 0 → 1: 시작
    state = reducer(state, { type: 'SET_PHASE', phase: 1 });

    // Phase 1: 뉴스 + 봇 거래
    state = reducer(state, { type: 'DRAW_NEWS' });
    state = reducer(state, { type: 'BOT_MARKET' });

    // Phase 2 계획: 모든 플레이어 카드 선택 (AI 공통)
    state = reducer(state, { type: 'SET_PHASE', phase: 2 });
    for (let i = 0; i < state.players.length; i++) {
      const p = state.players[i];
      if (p.defeated) continue;
      const cards = botPickCards(state, i);
      // 기본 반쪽: 0번째=top/main, 1번째=bot/side
      const halves = cards.map((_, idx) => {
        if (p.role === 'ghost') return idx === 0 ? 'top' : 'bot';
        return idx === 0 ? 'main' : 'side';
      });
      state = reducer(state, { type: 'PLAN_CARDS', playerIdx: i, cards, halves });
    }

    // 스냅샷 + 실행 + 디프
    state = reducer(state, { type: 'SNAPSHOT_TURN' });
    state = reducer(state, { type: 'SET_PHASE', phase: 3 });
    state = reducer(state, { type: 'EXECUTE_TURN' });

    // Ghost 결투 모달·레이드 모달 자동 해결 (헤드리스: YES 기본)
    if (state.meta.pendingRaid) state = reducer(state, { type: 'RESOLVE_RAID_YES' });
    if (state.meta.pendingGhostDuel) state = reducer(state, { type: 'RESOLVE_DUEL_YES' });
    if (state.meta.zoneBonusPending) {
      // 첫 옵션 자동 선택
      const opt = state.meta.zoneBonusPending.options[0];
      state = reducer(state, { type: 'APPLY_ZONE_BONUS', opt });
    }

    state = reducer(state, { type: 'COMPUTE_TURN_DIFF' });

    // Phase 4 수익
    state = reducer(state, { type: 'SET_PHASE', phase: 4 });
    state = reducer(state, { type: 'COLLECT_INCOME' });

    // Phase 5 R&D
    state = reducer(state, { type: 'SET_PHASE', phase: 5 });
    state = reducer(state, { type: 'RESEARCH_PHASE' });

    // Phase 6 결산 - 즉시 승리 체크
    state = reducer(state, { type: 'SET_PHASE', phase: 6 });
    const after = checkInstantVictory(state);
    if (after.meta.gameOver) {
      state = reducer(state, { type: 'VICTORY', winner: after.meta.winner, reason: after.meta.winReason });
      break;
    }

    if (trace) {
      console.log(`R${state.meta.round}: P0 ${state.players[0].specific} ${state.players[0].role === 'ghost' ? '렙' + state.players[0].resources.rep : '자산' + assetValue(state.players[0], state.stocks, state)} · P1 ${state.players[1].specific} ${state.players[1].role === 'ghost' ? '렙' + state.players[1].resources.rep : '자산' + assetValue(state.players[1], state.stocks, state)} · P2 ${state.players[2].specific} · P3 ${state.players[3].specific}`);
    }

    state = reducer(state, { type: 'NEXT_ROUND' });
  }

  // 만약 라운드 상한 초과로 끝났으면 점수로 결정
  if (!state.meta.gameOver) {
    state = checkVictoryByPoints(state);
  }

  return {
    winner: state.meta.winner,
    winnerRole: state.meta.winner != null ? state.players[state.meta.winner].role : null,
    winnerSpecific: state.meta.winner != null ? state.players[state.meta.winner].specific : null,
    reason: state.meta.winReason,
    round: state.meta.round,
    p0Rep: state.players[0].resources.rep,
    p0Asset: assetValue(state.players[0], state.stocks, state),
    p0Raids: state.meta.raidsThisGame[0] || 0,
    p0Tl: state.players[0].tl,
    p0Hp: state.players[0].hp,
    p0Defeated: state.players[0].defeated,
    p0Role: state.players[0].role,
    p0Specific: state.players[0].specific,
    p0Pool: { ...state.players[0].pool },
    heat: state.heat,
    finalState: state,
  };
}

// 배치 실행
function batchRun(N = 100) {
  const ghostClasses = ['CIPHER', 'BLADE', 'BROKER', 'RIGGER', 'DRIFTER', 'MOLE'];
  const blocs = ['VANTA', 'IRONWALL', 'HELIX', 'AXIOM', 'CARBON'];

  const results = [];
  let errors = 0;
  for (let i = 0; i < N; i++) {
    const humanRole = i % 2 === 0 ? 'ghost' : 'bloc';
    const humanSpecific = humanRole === 'ghost' ? ghostClasses[i % ghostClasses.length] : blocs[i % blocs.length];
    try {
      const r = runOneGame({ humanRole, humanSpecific });
      results.push(r);
    } catch (e) {
      errors++;
      if (errors <= 3) console.error(`Game ${i} error:`, e.message);
    }
  }
  return { results, errors };
}

// 분석
function analyze(results) {
  const byRole = { ghost: { total: 0, wins: 0, avgRound: 0, avgRep: 0, avgRaids: 0, avgTl: 0 }, bloc: { total: 0, wins: 0, avgRound: 0, avgAsset: 0, avgTl: 0 } };
  const bySpecific = {};
  const winnerRoles = { ghost: 0, bloc: 0, null: 0 };
  const reasons = {};
  const rounds = [];
  const ghostDefeats = [];

  for (const r of results) {
    const rk = r.p0Role;
    byRole[rk].total++;
    if (r.winner === 0) byRole[rk].wins++;
    byRole[rk].avgRound += r.round;
    byRole[rk].avgTl += r.p0Tl;
    if (rk === 'ghost') { byRole[rk].avgRep += r.p0Rep; byRole[rk].avgRaids += r.p0Raids; }
    else byRole[rk].avgAsset += r.p0Asset;

    bySpecific[r.p0Specific] = bySpecific[r.p0Specific] || { total: 0, wins: 0 };
    bySpecific[r.p0Specific].total++;
    if (r.winner === 0) bySpecific[r.p0Specific].wins++;

    winnerRoles[r.winnerRole || 'null']++;
    const reasonKey = (r.reason || '무승부').slice(0, 30);
    reasons[reasonKey] = (reasons[reasonKey] || 0) + 1;
    rounds.push(r.round);
    if (r.p0Defeated) ghostDefeats.push(r.p0Specific);
  }

  for (const rk of ['ghost', 'bloc']) {
    const b = byRole[rk];
    if (b.total > 0) {
      b.winRate = (b.wins / b.total * 100).toFixed(1) + '%';
      b.avgRound = (b.avgRound / b.total).toFixed(1);
      b.avgTl = (b.avgTl / b.total).toFixed(1);
      if (rk === 'ghost') { b.avgRep = (b.avgRep / b.total).toFixed(1); b.avgRaids = (b.avgRaids / b.total).toFixed(2); }
      else b.avgAsset = (b.avgAsset / b.total).toFixed(1);
    }
  }

  for (const k of Object.keys(bySpecific)) {
    bySpecific[k].winRate = (bySpecific[k].wins / bySpecific[k].total * 100).toFixed(1) + '%';
  }

  return {
    N: results.length,
    byRole,
    bySpecific,
    winnerRoles,
    topReasons: Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 8),
    avgRound: (rounds.reduce((a, b) => a + b, 0) / rounds.length).toFixed(2),
    minRound: Math.min(...rounds),
    maxRound: Math.max(...rounds),
    ghostDefeatCount: ghostDefeats.length,
  };
}

// 실행
const N = parseInt(process.argv[2]) || 50;
console.log(`\n=== DEAD NEXUS 헤드리스 시뮬 · ${N}판 ===\n`);
const { results, errors } = batchRun(N);
const a = analyze(results);

console.log(`판수: ${a.N} (에러 ${errors})`);
console.log(`평균 라운드: ${a.avgRound} (최소 ${a.minRound}, 최대 ${a.maxRound})`);
console.log(`승자 역할: Ghost ${a.winnerRoles.ghost} / Bloc ${a.winnerRoles.bloc} / 없음 ${a.winnerRoles.null}`);
console.log('');
console.log('역할별 P0 성적:');
console.log('  Ghost:', a.byRole.ghost);
console.log('  Bloc: ', a.byRole.bloc);
console.log('');
console.log('클래스/블록별 승률:');
Object.entries(a.bySpecific).sort((a, b) => parseFloat(b[1].winRate) - parseFloat(a[1].winRate)).forEach(([k, v]) => {
  console.log(`  ${k}: ${v.winRate} (${v.wins}/${v.total})`);
});
console.log('');
console.log('주요 승리 사유 Top 8:');
a.topReasons.forEach(([r, c]) => console.log(`  [${c}] ${r}`));
console.log('');
console.log(`P0 패배(사망): ${a.ghostDefeatCount}판`);
