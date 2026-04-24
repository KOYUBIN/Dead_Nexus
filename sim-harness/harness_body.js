// ============================================================================
// 헤드리스 배치 시뮬 본체 (core.js 뒤에 붙어서 같은 스코프 내에서 실행)
// ============================================================================

function runOneGame({ humanRole = 'ghost', humanSpecific = 'BLADE', maxRounds = 8, trace = false } = {}) {
  let state = initGame(humanRole, humanSpecific);
  state = reducer(state, { type: 'DRAW_INITIAL' });

  let safety = 0;
  while (!state.meta.gameOver && state.meta.round <= maxRounds && safety < 500) {
    safety++;

    // Phase 0 → 1
    state = reducer(state, { type: 'SET_PHASE', phase: 1 });

    // Phase 1: 뉴스 + 봇 거래 + 봇 상점
    state = reducer(state, { type: 'DRAW_NEWS' });
    state = reducer(state, { type: 'BOT_MARKET' });
    state = reducer(state, { type: 'BOT_SHOP' });

    // Phase 2 계획
    state = reducer(state, { type: 'SET_PHASE', phase: 2 });
    for (let i = 0; i < state.players.length; i++) {
      const p = state.players[i];
      if (p.defeated) continue;
      const cards = botPickCards(state, i);
      const halves = cards.map((_, idx) => {
        if (p.role === 'ghost') return idx === 0 ? 'top' : 'bot';
        return idx === 0 ? 'main' : 'side';
      });
      state = reducer(state, { type: 'PLAN_CARDS', playerIdx: i, cards, halves });
    }

    state = reducer(state, { type: 'SNAPSHOT_TURN' });
    state = reducer(state, { type: 'SET_PHASE', phase: 3 });
    state = reducer(state, { type: 'EXECUTE_TURN' });

    // P0용 모달 자동 결정 — 클래스·상황별 타입 선택
    if (state.meta.pendingRaid) {
      const p0 = state.players[0];
      let raidType = 'violent';
      // 클래스 전용 타입 우선 (v0.6.0: RIGGER drone 추가)
      if (p0.specific === 'MOLE') raidType = 'infiltrate';
      else if (p0.specific === 'RIGGER' && (p0.resources.parts || 0) >= 2) raidType = 'drone';
      else if (p0.specific === 'RIGGER') raidType = 'hack';  // parts 부족 시 hack
      else if (p0.specific === 'BROKER' && (p0.resources.credit || 0) >= 4) raidType = 'negotiate';
      else if (p0.specific === 'BROKER') raidType = 'stealth';
      else if (p0.hp < p0.maxHp * 0.4) raidType = 'stealth';
      else if (p0.stats.hack >= 3) raidType = 'hack';
      state = reducer(state, { type: 'RAID_SELECT_TYPE', raidType });
      state = reducer(state, { type: 'RAID_EXECUTE' });
    }
    if (state.meta.pendingGhostDuel) state = reducer(state, { type: 'RESOLVE_DUEL_YES' });
    if (state.meta.zoneBonusPending) {
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

    // Phase 6 결산
    state = reducer(state, { type: 'SET_PHASE', phase: 6 });
    const after = checkInstantVictory(state);
    if (after.meta.gameOver) {
      state = reducer(state, { type: 'VICTORY', winner: after.meta.winner, reason: after.meta.winReason });
      break;
    }

    if (trace) {
      console.log(`R${state.meta.round}: ${state.players.map((p, i) => `P${i}${p.role==='ghost'?'👻':'🏢'}${p.specific} ${p.role==='ghost'?'렙'+p.resources.rep:'자산'+assetValue(p, state.stocks, state)}`).join(' | ')}`);
    }

    state = reducer(state, { type: 'NEXT_ROUND' });
  }

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
    finalState: state,
  };
}

function batchRun(N = 100) {
  const ghostClasses = ['CIPHER', 'BLADE', 'BROKER', 'RIGGER', 'DRIFTER', 'MOLE'];
  const blocs = ['VANTA', 'IRONWALL', 'HELIX', 'AXIOM', 'CARBON'];

  const results = [];
  let errors = 0;
  const errorList = [];
  for (let i = 0; i < N; i++) {
    const humanRole = i % 2 === 0 ? 'ghost' : 'bloc';
    // FIX: i/2 used so all 6 Ghost classes + 5 Blocs cycle properly
    const slot = Math.floor(i / 2);
    const humanSpecific = humanRole === 'ghost' ? ghostClasses[slot % ghostClasses.length] : blocs[slot % blocs.length];
    try {
      const r = runOneGame({ humanRole, humanSpecific });
      results.push(r);
    } catch (e) {
      errors++;
      errorList.push({ i, humanRole, humanSpecific, msg: e.message });
    }
  }
  return { results, errors, errorList };
}

function analyze(results) {
  const byRole = {
    ghost: { total: 0, wins: 0, roundSum: 0, repSum: 0, raidSum: 0, tlSum: 0 },
    bloc: { total: 0, wins: 0, roundSum: 0, assetSum: 0, tlSum: 0 },
  };
  const bySpecific = {};
  const winnerRoles = { ghost: 0, bloc: 0, null: 0 };
  const reasons = {};
  const rounds = [];
  const defeats = [];

  for (const r of results) {
    const rk = r.p0Role;
    byRole[rk].total++;
    byRole[rk].roundSum += r.round;
    byRole[rk].tlSum += r.p0Tl;
    if (r.winner === 0) byRole[rk].wins++;
    if (rk === 'ghost') { byRole[rk].repSum += r.p0Rep; byRole[rk].raidSum += r.p0Raids; }
    else byRole[rk].assetSum += r.p0Asset;

    bySpecific[r.p0Specific] = bySpecific[r.p0Specific] || { total: 0, wins: 0 };
    bySpecific[r.p0Specific].total++;
    if (r.winner === 0) bySpecific[r.p0Specific].wins++;

    winnerRoles[r.winnerRole || 'null']++;
    const reasonKey = (r.reason || '무승부').slice(0, 40);
    reasons[reasonKey] = (reasons[reasonKey] || 0) + 1;
    rounds.push(r.round);
    if (r.p0Defeated) defeats.push(r.p0Specific);
  }

  const out = { N: results.length, winnerRoles, byRole: {}, bySpecific: {}, rounds: { avg: (rounds.reduce((a,b)=>a+b,0)/rounds.length).toFixed(2), min: Math.min(...rounds), max: Math.max(...rounds) }, topReasons: Object.entries(reasons).sort((a,b)=>b[1]-a[1]).slice(0,10), defeatCount: defeats.length };
  for (const rk of ['ghost', 'bloc']) {
    const b = byRole[rk];
    if (b.total === 0) continue;
    out.byRole[rk] = {
      total: b.total, wins: b.wins,
      winRate: (b.wins / b.total * 100).toFixed(1) + '%',
      avgRound: (b.roundSum / b.total).toFixed(1),
      avgTl: (b.tlSum / b.total).toFixed(1),
    };
    if (rk === 'ghost') { out.byRole[rk].avgRep = (b.repSum / b.total).toFixed(1); out.byRole[rk].avgRaids = (b.raidSum / b.total).toFixed(2); }
    else out.byRole[rk].avgAsset = (b.assetSum / b.total).toFixed(1);
  }
  for (const k of Object.keys(bySpecific)) {
    out.bySpecific[k] = { ...bySpecific[k], winRate: (bySpecific[k].wins / bySpecific[k].total * 100).toFixed(1) + '%' };
  }
  return out;
}

const N = parseInt(process.argv[2]) || 50;
console.log(`\n=== DEAD NEXUS 헤드리스 시뮬 · ${N}판 ===\n`);
const { results, errors, errorList } = batchRun(N);

if (errors > 0) {
  console.log(`⚠ 에러 ${errors}판`);
  errorList.slice(0, 3).forEach(e => console.log(`  ${e.humanRole}/${e.humanSpecific}: ${e.msg}`));
  console.log('');
}

const a = analyze(results);
console.log(`판수: ${a.N}`);
console.log(`라운드: 평균 ${a.rounds.avg} (${a.rounds.min}~${a.rounds.max})`);
console.log(`승자 역할: Ghost ${a.winnerRoles.ghost} / Bloc ${a.winnerRoles.bloc} / 없음 ${a.winnerRoles.null}`);
console.log('');
console.log('역할별 P0 성적:');
console.log('  Ghost:', JSON.stringify(a.byRole.ghost));
console.log('  Bloc :', JSON.stringify(a.byRole.bloc));
console.log('');
console.log('클래스/블록별 P0 승률 (승률 순):');
Object.entries(a.bySpecific).sort((a, b) => parseFloat(b[1].winRate) - parseFloat(a[1].winRate)).forEach(([k, v]) => {
  console.log(`  ${k.padEnd(8)} ${v.winRate.padStart(6)}  (${v.wins}/${v.total})`);
});
console.log('');
console.log('주요 승리 사유 Top 10:');
a.topReasons.forEach(([r, c]) => console.log(`  [${String(c).padStart(3)}] ${r}`));
console.log('');
console.log(`P0 패배(사망): ${a.defeatCount}판`);
