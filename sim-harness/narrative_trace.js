// ============================================================================
// DEAD NEXUS — Narrative Trace 모드 (v1.6)
// 한 판의 전 과정을 사람이 읽기 좋은 markdown으로 stdout에 출력.
// 사용법:
//   node narrative_trace.js [humanRole] [humanSpecific] [mapSize] [seed]
//   예: node narrative_trace.js ghost BLADE 11x11 42
//   예: node narrative_trace.js bloc HELIX 5x5
// 결과 markdown은 docs/19-sample-game-narrative.md 같이 저장 가능:
//   node narrative_trace.js ghost BLADE 11x11 42 > ../docs/19-sample-game-narrative.md
// ============================================================================

global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
};

const fs = require('fs');
const core = fs.readFileSync(__dirname + '/core.js', 'utf8');

// 시드 가능 RNG (Mulberry32)
function makeSeededRng(seed) {
  let s = seed >>> 0;
  return function() {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const argRole = process.argv[2] || 'ghost';
const argSpecific = process.argv[3] || 'BLADE';
const argMapSize = process.argv[4] || '11x11';
const argSeed = parseInt(process.argv[5]) || Math.floor(Math.random() * 100000);

if (argSeed) {
  const rng = makeSeededRng(argSeed);
  Math.random = rng;
}

// runNarrative + helper 함수를 eval 스코프에 같이 넣기 위해 문자열로 첨부
const narrativeBody = `
const ICON = {
  ghost: '👻', bloc: '🏢',
  CIPHER: '💾', BLADE: '⚔', BROKER: '🤝', RIGGER: '🛰', DRIFTER: '🚛', MOLE: '🕷',
  VANTA: '🎭', IRONWALL: '⚔', HELIX: '🧬', AXIOM: '📊', CARBON: '⛽',
};
const HUMAN_ROLE = ${JSON.stringify(argRole)};
const HUMAN_SPECIFIC = ${JSON.stringify(argSpecific)};
const MAP_SIZE = ${JSON.stringify(argMapSize)};
const SEED = ${argSeed};

function nameOf(p, idx) {
  return \`**P\${idx}** \${ICON[p.specific] || ''} \${p.specific}\${idx === 0 ? ' ★' : ''}\`;
}

function summarizePlayers(state) {
  return state.players.map((p, i) => {
    const role = p.role === 'ghost' ? '독립' : '메가기업';
    const stat = p.role === 'ghost'
      ? \`평판 \${p.resources.rep || 0} · HP \${p.hp ?? '?'}\`
      : \`자산 \${assetValue(p, state.stocks, state)} · NEXUS \${state.meta.nexusHolder === i ? '점유' : '-'}\`;
    const pos = p.position || '?';
    const tl = \`TL \${p.tl || 1}\`;
    return \`- \${nameOf(p, i)} (\${role}) — 좌표 \\\`\${pos}\\\` · \${stat} · \${tl}\`;
  }).join('\\n');
}

function trackInfoOf(p) {
  return \`TL \${p.tl || 1} (\${p.tlProgress || 0}xp)\`;
}

function describeNews(news) {
  if (!news) return '';
  return \`📰 **\${news.title}** — \${news.flavor || news.subtitle || '시장에 새 바람이 분다.'}\`;
}

function out(s) { process.stdout.write(s + '\\n'); }

function runNarrative() {
  const meta = {
    mapSize: MAP_SIZE === '5x5' ? '5x5' : '11x11',
    scenario: MAP_SIZE === '5x5' ? 'S01 (튜토리얼)' : 'S07 (정식 도전)',
  };

  out('# DEAD NEXUS — 예시 게임 narrative');
  out('');
  out(\`> **시드**: \\\`\${SEED}\\\` · **맵**: \${meta.mapSize} · **시나리오**: \${meta.scenario}\`);
  out(\`> **시점 인간 (P0)**: \${HUMAN_ROLE === 'ghost' ? '독립 용병' : '메가기업'} · \${ICON[HUMAN_SPECIFIC] || ''} **\${HUMAN_SPECIFIC}**\`);
  out('> 이 문서는 \`sim-harness/narrative_trace.js\`로 생성된 자동 narrative다.');
  out('> 룰을 글로 읽기 어려울 때, 한 판의 흐름을 따라가며 시스템 감각을 익히기 위한 학습 자료.');
  out('');
  out('---');
  out('');

  let state = initGame(HUMAN_ROLE, HUMAN_SPECIFIC);
  state = reducer(state, { type: 'DRAW_INITIAL' });

  out('## 🎬 R0 — 게임 시작');
  out('');
  out('**플레이어 명단**');
  out('');
  out(summarizePlayers(state));
  out('');
  const hand0 = state.players[0].hand.map(cid => {
    const c = getCard(cid);
    return (c && (c.name || cid)) || cid;
  }).slice(0, 6);
  out(\`**P0 시작 손패** (\${state.players[0].hand.length}장): \${hand0.join(', ')}\`);
  out('');
  out('---');
  out('');

  let safety = 0;
  let prevLogLen = state.log.length;

  while (!state.meta.gameOver && state.meta.round <= 8 && safety < 500) {
    safety++;
    const R = state.meta.round;

    out(\`## R\${R}\`);
    out('');

    // Phase 1: 시장 + 뉴스
    state = reducer(state, { type: 'SET_PHASE', phase: 1 });
    state = reducer(state, { type: 'DRAW_NEWS' });
    const recentNewsLog = state.log.slice(prevLogLen).find(l => /📰/.test(l.message));
    if (recentNewsLog) {
      out('### 📰 시장 / 뉴스');
      out('');
      out('> ' + recentNewsLog.message.slice(0, 200));
      out('');
    }
    state = reducer(state, { type: 'BOT_MARKET' });
    const marketLogs = state.log.slice(prevLogLen).filter(l => l.phase === 1 && (l.message.includes('매수') || l.message.includes('매도')));
    if (marketLogs.length > 0) {
      out('**봇 거래**');
      out('');
      marketLogs.slice(0, 3).forEach(l => out('- ' + l.message.slice(0, 90)));
      out('');
    }
    prevLogLen = state.log.length;

    // Phase 2: 계획
    state = reducer(state, { type: 'SET_PHASE', phase: 2 });
    out('### 🃏 계획');
    out('');
    out('*각 플레이어가 손패에서 카드 2장을 골라 TOP/BOT(혹은 MAIN/SIDE) 영역으로 배치.*');
    out('');
    const plans = [];
    for (let i = 0; i < state.players.length; i++) {
      const p = state.players[i];
      if (p.defeated) continue;
      const cards = botPickCards(state, i);
      const halves = cards.map((_, idx) => {
        if (p.role === 'ghost') return idx === 0 ? 'top' : 'bot';
        return idx === 0 ? 'main' : 'side';
      });
      const cardNames = cards.map(cid => {
        const c = getCard(cid);
        return (c && (c.name || cid)) || cid || '?';
      }).slice(0, 2);
      const halvesStr = halves.slice(0, 2).map(h => h.toUpperCase()).join('/');
      // narrative이므로 모두 공개 — 학습 목적
      plans.push(\`- \${nameOf(p, i)}: **\${cardNames.join(' + ')}** (\${halvesStr})\`);
      state = reducer(state, { type: 'PLAN_CARDS', playerIdx: i, cards, halves });
    }
    out(plans.join('\\n'));
    out('');

    state = reducer(state, { type: 'SNAPSHOT_TURN' });

    // Phase 3: 실행
    state = reducer(state, { type: 'SET_PHASE', phase: 3 });
    state = reducer(state, { type: 'EXECUTE_TURN' });
    if (state.meta.pendingRaid) state = reducer(state, { type: 'RESOLVE_RAID_YES' });
    if (state.meta.pendingGhostDuel) state = reducer(state, { type: 'RESOLVE_DUEL_YES' });
    if (state.meta.zoneBonusPending) {
      const opt = state.meta.zoneBonusPending.options[0];
      state = reducer(state, { type: 'APPLY_ZONE_BONUS', opt });
    }
    state = reducer(state, { type: 'COMPUTE_TURN_DIFF' });

    const execLogs = state.log.slice(prevLogLen).filter(l => l.phase === 3);
    if (execLogs.length > 0) {
      out('### ⚡ 실행 — 주요 사건');
      out('');
      const interesting = execLogs.filter(l => {
        const m = l.message;
        return /레이드|raid|🗡|점령|중립화|이동|→|처형|mini-raid|드론|해킹|truce|약속|HP|사망|부활|⚔|💥|🎭|🤝/i.test(m);
      });
      if (interesting.length === 0) {
        out('*조용한 라운드 — 주요 액션 없음.*');
      } else {
        interesting.slice(0, 10).forEach(l => out('- ' + l.message.slice(0, 130)));
      }
      out('');
    }
    prevLogLen = state.log.length;

    // Phase 4: 수익
    state = reducer(state, { type: 'SET_PHASE', phase: 4 });
    state = reducer(state, { type: 'COLLECT_INCOME' });
    const incomeLogs = state.log.slice(prevLogLen).filter(l => l.phase === 4 && /수익|자원|₵|\\+\\d/.test(l.message));
    if (incomeLogs.length > 0) {
      out('### 💰 수익');
      out('');
      incomeLogs.slice(0, 4).forEach(l => out('- ' + l.message.slice(0, 100)));
      out('');
    }
    prevLogLen = state.log.length;

    // Phase 5: R&D
    state = reducer(state, { type: 'SET_PHASE', phase: 5 });
    state = reducer(state, { type: 'RESEARCH_PHASE' });
    const rdLogs = state.log.slice(prevLogLen).filter(l => l.phase === 5);
    if (rdLogs.length > 0) {
      const rdInteresting = rdLogs.filter(l => /TL|🔬|R&D|화력|코드|그리드|인맥|그림자|Cyberware|장착|기술|레벨|업그레이드/i.test(l.message)).slice(0, 6);
      if (rdInteresting.length > 0) {
        out('### 🔬 R&D');
        out('');
        rdInteresting.forEach(l => out('- ' + l.message.slice(0, 100)));
        out('');
      }
    }
    prevLogLen = state.log.length;

    // Phase 6: 결산 + 즉시 승리 체크
    state = reducer(state, { type: 'SET_PHASE', phase: 6 });
    const after = checkInstantVictory(state);
    if (after.meta.gameOver) {
      state = reducer(state, { type: 'VICTORY', winner: after.meta.winner, reason: after.meta.winReason });
      out('### 🏆 즉시 승리!');
      out('');
      out(\`**\${nameOf(state.players[state.meta.winner], state.meta.winner)}** — \${state.meta.winReason}\`);
      out('');
      break;
    }

    out(\`### 📊 R\${R} 종료 시점 스냅샷\`);
    out('');
    state.players.forEach((p, i) => {
      const stat = p.role === 'ghost'
        ? \`평판 **\${p.resources.rep || 0}** · HP \${p.hp} · 레이드 \${(state.meta.raidsThisGame?.[i] || 0)}회\`
        : \`자산 **\${assetValue(p, state.stocks, state)}** · NEXUS \${state.meta.nexusHolder === i ? '👑점유' : '-'}\`;
      out(\`- \${nameOf(p, i)}: \${stat} · \${trackInfoOf(p)}\`);
    });
    out('');
    out('---');
    out('');

    state = reducer(state, { type: 'NEXT_ROUND' });
  }

  if (!state.meta.gameOver) {
    state = checkVictoryByPoints(state);
  }

  out('## 🏁 게임 종료');
  out('');
  if (state.meta.winner != null) {
    const w = state.players[state.meta.winner];
    out(\`**승자**: \${nameOf(w, state.meta.winner)} (\${w.role === 'ghost' ? '독립' : '메가기업'})\`);
    out('');
    out(\`**사유**: \${state.meta.winReason || '점수 기반 판정'}\`);
    out('');
  } else {
    out('*무승부 — 8라운드 내 승리 조건 미달.*');
    out('');
  }

  out('### 최종 상태');
  out('');
  out(summarizePlayers(state));
  out('');

  // 하이라이트
  const hl = state.meta?.highlightsThisGame || state.meta?.claimedAchievements || {};
  const allKeys = Object.keys(hl);
  if (allKeys.length > 0) {
    out('### 하이라이트 모먼트 / 업적');
    out('');
    allKeys.slice(0, 20).forEach(k => {
      const v = hl[k];
      const detail = typeof v === 'object' ? \`P\${v.playerIdx ?? v}\` : \`P\${v}\`;
      out(\`- **\${k}** — \${detail}\`);
    });
    out('');
  }

  out('---');
  out('');
  out('### 이 문서 다시 생성하기');
  out('');
  out('\\\`\\\`\\\`bash');
  out('cd sim-harness/');
  out(\`node narrative_trace.js \${HUMAN_ROLE} \${HUMAN_SPECIFIC} \${MAP_SIZE} \${SEED} > ../docs/19-sample-game-narrative.md\`);
  out('\\\`\\\`\\\`');
  out('');
  out('*⚙ 이 narrative는 결정론적이다 — 같은 시드는 같은 게임을 재생성한다.*');
}

runNarrative();
`;

const code = core + '\n\n' + narrativeBody;
eval(code);
