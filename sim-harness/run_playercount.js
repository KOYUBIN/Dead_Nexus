// v0.5.26: 인원수별 배치 시뮬 (2~5인, 각 100판)
global.localStorage = { _store: {}, getItem(k){return this._store[k]||null;}, setItem(k,v){this._store[k]=String(v);}, removeItem(k){delete this._store[k];} };
const fs = require('fs');
const core = fs.readFileSync(__dirname + '/core.js', 'utf8');
const harness = fs.readFileSync(__dirname + '/harness_body.js', 'utf8');
eval(core + '\n\n' + harness);

// runOneGame 래퍼: playerCount 전달
function runOneGameN(opts, playerCount) {
  let state = initGame(opts.humanRole, opts.humanSpecific, playerCount);
  state = reducer(state, { type: 'DRAW_INITIAL' });
  let safety = 0;
  const maxRounds = 10;
  while (!state.meta.gameOver && state.meta.round <= maxRounds && safety < 500) {
    safety++;
    state = reducer(state, { type: 'SET_PHASE', phase: 1 });
    state = reducer(state, { type: 'DRAW_NEWS' });
    state = reducer(state, { type: 'BOT_MARKET' });
    state = reducer(state, { type: 'BOT_SHOP' });
    state = reducer(state, { type: 'SET_PHASE', phase: 2 });
    for (let i = 0; i < state.players.length; i++) {
      const p = state.players[i];
      if (p.defeated || p.isNpc) continue;
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
    if (state.meta.pendingRaid) {
      const p0 = state.players[0];
      let raidType = 'violent';
      if (p0.specific === 'MOLE') raidType = 'infiltrate';
      else if (p0.specific === 'RIGGER' && (p0.resources.parts || 0) >= 2) raidType = 'drone';
      else if (p0.specific === 'RIGGER') raidType = 'hack';
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
    state = reducer(state, { type: 'SET_PHASE', phase: 4 });
    state = reducer(state, { type: 'COLLECT_INCOME' });
    state = reducer(state, { type: 'SET_PHASE', phase: 5 });
    state = reducer(state, { type: 'RESEARCH_PHASE' });
    state = reducer(state, { type: 'SET_PHASE', phase: 6 });
    const after = checkInstantVictory(state);
    if (after.meta.gameOver) {
      state = reducer(state, { type: 'VICTORY', winner: after.meta.winner, reason: after.meta.winReason });
      break;
    }
    state = reducer(state, { type: 'NEXT_ROUND' });
  }
  if (!state.meta.gameOver) state = checkVictoryByPoints(state);
  return {
    winner: state.meta.winner,
    winnerRole: state.meta.winner != null ? state.players[state.meta.winner].role : null,
    round: state.meta.round,
    p0Role: state.players[0].role,
    p0Specific: state.players[0].specific,
    p0Won: state.meta.winner === 0,
    p0Defeated: state.players[0].defeated,
    totalPlayers: state.players.length,
  };
}

const ghostClasses = ['CIPHER', 'BLADE', 'BROKER', 'RIGGER', 'DRIFTER', 'MOLE'];
const blocs = ['VANTA', 'IRONWALL', 'HELIX', 'AXIOM', 'CARBON'];

function runBatch(playerCount, N) {
  const results = [];
  let errors = 0;
  for (let i = 0; i < N; i++) {
    const humanRole = i % 2 === 0 ? 'ghost' : 'bloc';
    const slot = Math.floor(i / 2);
    const humanSpecific = humanRole === 'ghost' ? ghostClasses[slot % 6] : blocs[slot % 5];
    try {
      const r = runOneGameN({ humanRole, humanSpecific }, playerCount);
      results.push(r);
    } catch (e) {
      errors++;
      if (errors <= 2) console.error(`[N=${playerCount}]`, e.message);
    }
  }
  return { results, errors };
}

function summarize(label, results) {
  const total = results.length;
  const ghostWins = results.filter(r => r.winnerRole === 'ghost').length;
  const blocWins = results.filter(r => r.winnerRole === 'bloc').length;
  const none = total - ghostWins - blocWins;
  const p0Wins = results.filter(r => r.p0Won).length;
  const rounds = results.map(r => r.round);
  const avgRound = (rounds.reduce((a,b)=>a+b,0)/rounds.length).toFixed(2);
  const p0Role = { ghost: { w:0, t:0 }, bloc: { w:0, t:0 } };
  results.forEach(r => {
    p0Role[r.p0Role].t++;
    if (r.p0Won) p0Role[r.p0Role].w++;
  });
  const bySpec = {};
  results.forEach(r => {
    bySpec[r.p0Specific] = bySpec[r.p0Specific] || { w:0, t:0 };
    bySpec[r.p0Specific].t++;
    if (r.p0Won) bySpec[r.p0Specific].w++;
  });
  console.log(`\n=== ${label} (${total}판) ===`);
  console.log(`  라운드 평균 ${avgRound}, 범위 ${Math.min(...rounds)}~${Math.max(...rounds)}`);
  console.log(`  승자 역할 Ghost ${ghostWins} / Bloc ${blocWins} / 없음 ${none}`);
  console.log(`  P0 전체 승률: ${(p0Wins/total*100).toFixed(1)}%`);
  console.log(`  P0 Ghost ${(p0Role.ghost.w/Math.max(1,p0Role.ghost.t)*100).toFixed(1)}% | P0 Bloc ${(p0Role.bloc.w/Math.max(1,p0Role.bloc.t)*100).toFixed(1)}%`);
  const sorted = Object.entries(bySpec).sort((a,b) => (b[1].w/b[1].t) - (a[1].w/a[1].t));
  sorted.forEach(([k, v]) => {
    if (v.t > 0) console.log(`    ${k.padEnd(9)} ${(v.w/v.t*100).toFixed(1).padStart(5)}%  (${v.w}/${v.t})`);
  });
}

// 2~5인, 각 100판
for (const N of [2, 3, 4, 5]) {
  const { results, errors } = runBatch(N, 100);
  summarize(`${N}인 플레이`, results);
  if (errors > 0) console.log(`  ⚠ 에러 ${errors}건`);
}
