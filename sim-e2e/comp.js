#!/usr/bin/env node
// =============================================================================
// DEAD NEXUS — Composition-controlled balance runner (diagnosis for docs/23 gap #1)
//
// Usage:  node comp.js [games=150] [comp=1g3b] [scenario=S01]
//   comp ∈ { 1g3b, 3g1b, 2g2b, 3g1b, 1b3g, ... }  (Ng M b form)
//
// Unlike run.js (which drives the SOLO roster and only sets P0's role), this
// forces an EXACT faction composition and reports MINORITY-faction win rate +
// win-route breakdown + timing, so we can (a) reproduce the audit's
// 1g3b→bloc 99% / 3g1b→ghost 89% determinism and (b) measure any fix.
//
// Faithfulness: P0 stays kind='human' (matches solo); seats 1..N are forced to
// kind='bot' (so euro_grantSuppression, which only acts from bots, fires exactly
// as in a real solo game). All seats are planned by botPickCards.
//
// Writes only under sim-e2e/. No commit/push.
// =============================================================================
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const VENDOR = path.join(__dirname, 'vendor');
const RESULTS_DIR = path.join(__dirname, 'results');
const PER_GAME_TIMEOUT_MS = 90_000;
const GLOBALS_TIMEOUT_MS = 45_000;
const ROUND_GUARD = 40;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

const N = Math.max(1, parseInt(process.argv[2] || '150', 10));
const COMP = (process.argv[3] || '1g3b').toLowerCase();
const SCENARIO = process.argv[4] || 'S01';

const GHOST_CLASSES = ['CIPHER', 'BLADE', 'BROKER', 'RIGGER', 'DRIFTER', 'MOLE'];
const BLOC_CLASSES = ['VANTA', 'IRONWALL', 'HELIX', 'AXIOM', 'CARBON'];

// parse "1g3b" → { ghost:1, bloc:3 }
function parseComp(str) {
  const g = /(\d+)g/.exec(str); const b = /(\d+)b/.exec(str);
  const ghost = g ? parseInt(g[1], 10) : 0; const bloc = b ? parseInt(b[1], 10) : 0;
  if (ghost + bloc < 2 || ghost + bloc > 5) throw new Error(`bad comp "${str}" (need 2..5 seats)`);
  return { ghost, bloc };
}
const { ghost: NG, bloc: NB } = parseComp(COMP);
const minorityRole = NG < NB ? 'ghost' : NB < NG ? 'bloc' : null; // null = balanced

function shuffle(a) { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; }

// Build a humans list for the target composition. Interleave so P0's role
// alternates run-to-run (fairness) — but keep ghost-first for determinism of
// which seat is P0. We randomize class picks and seat order per game.
function buildComp() {
  const gs = shuffle(GHOST_CLASSES).slice(0, NG).map(sp => ({ role: 'ghost', specific: sp }));
  const bs = shuffle(BLOC_CLASSES).slice(0, NB).map(sp => ({ role: 'bloc', specific: sp }));
  return shuffle([...gs, ...bs]);
}

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const fp = path.join(ROOT, p);
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

async function installRoutes(page) {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    const send = (file) => route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: fs.readFileSync(path.join(VENDOR, file)) });
    if (url.includes('unpkg.com') && url.includes('react-dom')) return send('react-dom.production.min.js');
    if (url.includes('unpkg.com') && url.includes('/react@')) return send('react.production.min.js');
    if (url.includes('unpkg.com') && url.includes('babel')) return send('babel.min.js');
    if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    return route.continue();
  });
}

function inPageGame(cfg) {
  try {
    const R = window.reducer, BP = window.botPickCards, CIV = window.checkInstantVictory;
    if (typeof R !== 'function' || typeof BP !== 'function' || typeof CIV !== 'function' || typeof window.buildInitial !== 'function')
      return { ok: false, error: 'engine globals missing' };

    // Faithful reproduction of the audit:
    //  - 1v3 compositions ARE the real solo product scenario → drive SOLO with
    //    P0 = the lone minority human + 3 opposite bots (initGame forces this).
    //  - balanced (2:2) has no solo equivalent → build via multi humans list and
    //    re-mark seats 1..N as bots so suppression (bot-only) fires as in solo.
    let s;
    if (cfg.soloRole) {
      s = window.buildInitial({ mode: 'solo', mapSize: cfg.mapSize, difficulty: 'normal', role: cfg.soloRole, specific: cfg.soloSpecific, scenario: cfg.scenario || 'S01' });
    } else {
      s = window.buildInitial({ mode: 'multi', mapSize: cfg.mapSize, difficulty: 'normal', humans: cfg.comp, scenario: cfg.scenario || 'S01' });
      for (let i = 1; i < s.players.length; i++) { if (!s.players[i].isNpc) s.players[i].kind = 'bot'; }
    }

    const field = s.players.filter(p => !p.isNpc).map(p => p.role);

    let guard = 0;
    while (!s.meta.gameOver && guard < cfg.roundGuard) {
      guard++;
      s = R(s, { type: 'SET_PHASE', phase: 1 });
      s = R(s, { type: 'DRAW_NEWS' });
      s = R(s, { type: 'BOT_MARKET' });
      s = R(s, { type: 'SET_PHASE', phase: 2 });
      for (let i = 0; i < s.players.length; i++) {
        const p = s.players[i];
        if (p.defeated || p.isNpc) continue;
        s = R(s, { type: 'PLAN_CARDS', playerIdx: i, cards: BP(s, i) });
      }
      s = R(s, { type: 'SET_PHASE', phase: 3 });
      s = R(s, { type: 'SNAPSHOT_TURN' });
      s = R(s, { type: 'EXECUTE_TURN' });
      s = R(s, { type: 'COMPUTE_TURN_DIFF' });
      s = R(s, { type: 'SET_PHASE', phase: 4 });
      s = R(s, { type: 'COLLECT_INCOME' });
      s = R(s, { type: 'SET_PHASE', phase: 5 });
      s = R(s, { type: 'RESEARCH_PHASE' });
      s = R(s, { type: 'SET_PHASE', phase: 6 });
      const after = CIV(s);
      if (after.meta.gameOver) { s = R(s, { type: 'VICTORY', winner: after.meta.winner, reason: after.meta.winReason }); break; }
      s = R(s, { type: 'NEXT_ROUND' });
    }

    const w = s.meta.winner;
    const winnerRole = (w != null && s.players[w]) ? s.players[w].role : null;
    const reason = s.meta.winReason || '';
    let route = 'other';
    if (/자산/.test(reason)) route = 'asset';
    else if (/전투/.test(reason)) route = 'repBattle';
    else if (/평판/.test(reason)) route = 'repOnly';
    else if (/시간|점수/.test(reason)) route = 'timeout';
    // capture minority-faction best asset/rep vs goal, for margin diagnosis
    const goals = (typeof window.getVictoryGoals === 'function') ? window.getVictoryGoals(s) : null;
    const seats = s.players.filter(p => !p.isNpc);
    const minRole = cfg.minorityRole;
    let minBestAsset = 0, minBestRep = 0, majBestAsset = 0, majBestRep = 0;
    for (const p of seats) {
      const av = (typeof window.assetValue === 'function') ? window.assetValue(p, s.stocks, s) : 0;
      const rp = p.resources.rep || 0;
      if (minRole && p.role === minRole) { minBestAsset = Math.max(minBestAsset, av); minBestRep = Math.max(minBestRep, rp); }
      else { majBestAsset = Math.max(majBestAsset, av); majBestRep = Math.max(majBestRep, rp); }
    }
    return {
      ok: true, gameOver: s.meta.gameOver, round: s.meta.round,
      winner: w, winnerRole, winnerClass: (w != null && s.players[w]) ? s.players[w].specific : null,
      reason, route, field,
      goals: goals ? { blocAsset: goals.blocAsset, ghostRepBattle: goals.ghostRepBattle, ghostRepOnly: goals.ghostRepOnly } : null,
      minBestAsset, minBestRep, majBestAsset, majBestRep,
      guardHit: guard >= cfg.roundGuard,
    };
  } catch (e) { return { ok: false, error: String((e && e.stack) || e) }; }
}

async function makePage(browser, port) {
  const page = await browser.newPage();
  await installRoutes(page);
  const buf = { console: [], pageerror: [] };
  page.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning') buf.console.push({ type: t, text: m.text() }); });
  page.on('pageerror', (e) => buf.pageerror.push(String(e && e.message || e)));
  await page.goto(`http://127.0.0.1:${port}/simulator/v0.5/`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForFunction(
    () => typeof window.reducer === 'function' && typeof window.buildInitial === 'function' && typeof window.botPickCards === 'function' && typeof window.euro_applyAll === 'function',
    { timeout: GLOBALS_TIMEOUT_MS }
  );
  return { page, buf };
}
const BENIGN = (t) => t.includes('in-browser Babel transformer');

(async () => {
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const server = await startServer();
  const port = server.address().port;
  console.log(`[comp] serving on :${port}  games=${N} comp=${COMP} (${NG}g/${NB}b, minority=${minorityRole || 'none'}) scenario=${SCENARIO}`);

  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium' });
  let pg = await makePage(browser, port);

  const games = [];
  const t0 = Date.now();
  const is1v3 = (NG === 1 && NB === 3) || (NB === 1 && NG === 3);
  for (let k = 0; k < N; k++) {
    const comp = buildComp();
    // 1v3 → drive SOLO with P0 = minority (exact audit/product path)
    const soloRole = is1v3 ? minorityRole : null;
    const soloSpecific = soloRole ? (comp.find(c => c.role === soloRole) || {}).specific : null;
    const cfg = { mapSize: '11x11', comp, minorityRole, soloRole, soloSpecific, roundGuard: ROUND_GUARD, scenario: SCENARIO };
    const startConsole = pg.buf.console.length, startErr = pg.buf.pageerror.length;
    let rec;
    try {
      const res = await Promise.race([
        pg.page.evaluate(inPageGame, cfg),
        new Promise((_, rej) => setTimeout(() => rej(new Error('__timeout__')), PER_GAME_TIMEOUT_MS)),
      ]);
      const consoleNew = pg.buf.console.slice(startConsole).filter(c => !BENIGN(c.text));
      const errNew = pg.buf.pageerror.slice(startErr);
      rec = res.ok ? { index: k + 1, status: 'ok', ...res, consoleErrors: consoleNew, pageErrors: errNew }
                   : { index: k + 1, status: 'error', error: res.error, consoleErrors: consoleNew, pageErrors: errNew };
    } catch (e) {
      const timedOut = e && e.message === '__timeout__';
      rec = { index: k + 1, status: timedOut ? 'timeout' : 'error', error: timedOut ? null : String(e.message || e), consoleErrors: [], pageErrors: [] };
      try { await pg.page.close(); } catch (_) {}
      try { pg = await makePage(browser, port); } catch (_) {}
    }
    games.push(rec);
    if ((k + 1) % 25 === 0 || k === N - 1) {
      const okc = games.filter(g => g.status === 'ok');
      const gw = okc.filter(g => g.winnerRole === 'ghost').length;
      const bw = okc.filter(g => g.winnerRole === 'bloc').length;
      process.stdout.write(`  [${k + 1}/${N}] ghost ${gw} bloc ${bw}\n`);
    }
  }
  try { await pg.page.close(); } catch (_) {}
  await browser.close();
  server.close();

  const ok = games.filter(g => g.status === 'ok');
  const nOk = ok.length || 1;
  const gw = ok.filter(g => g.winnerRole === 'ghost').length;
  const bw = ok.filter(g => g.winnerRole === 'bloc').length;
  const nw = ok.filter(g => !g.winnerRole).length;
  const routes = {}; ok.forEach(g => { routes[g.route] = (routes[g.route] || 0) + 1; });
  const avgRound = +(ok.reduce((a, g) => a + g.round, 0) / nOk).toFixed(2);
  const minRole = minorityRole;
  const minWins = minRole ? ok.filter(g => g.winnerRole === minRole).length : 0;
  const minWinRate = minRole ? +(minWins / nOk).toFixed(3) : null;
  const errs = [];
  games.forEach(g => { (g.consoleErrors || []).forEach(c => errs.push(`g${g.index} console.${c.type} ${c.text.slice(0, 160)}`)); (g.pageErrors || []).forEach(t => errs.push(`g${g.index} pageerror ${t.slice(0, 160)}`)); if (g.status === 'error' && g.error) errs.push(`g${g.index} exc ${String(g.error).slice(0, 160)}`); });
  const avg = (f) => +(ok.reduce((a, g) => a + (f(g) || 0), 0) / nOk).toFixed(1);

  const summary = {
    meta: { generatedAt: new Date().toISOString(), games: N, comp: COMP, ghost: NG, bloc: NB, minorityRole, scenario: SCENARIO, elapsedMs: Date.now() - t0 },
    outcomes: {
      completed: ok.length, timeouts: games.filter(g => g.status === 'timeout').length, errors: games.filter(g => g.status === 'error').length,
      ghostWins: gw, blocWins: bw, noWin: nw,
      ghostWinRate: +(gw / nOk).toFixed(3), blocWinRate: +(bw / nOk).toFixed(3),
      minorityRole: minRole, minorityWins: minWins, minorityWinRate: minWinRate,
      routes, avgRound,
      minBestAssetAvg: avg(g => g.minBestAsset), minBestRepAvg: avg(g => g.minBestRep),
      majBestAssetAvg: avg(g => g.majBestAsset), majBestRepAvg: avg(g => g.majBestRep),
      goalsSample: ok[0] ? ok[0].goals : null,
    },
    errors: errs, games,
  };
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(RESULTS_DIR, `comp-${COMP}-${SCENARIO}-${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));

  const o = summary.outcomes;
  console.log('\n' + '='.repeat(60));
  console.log(`  COMP ${COMP} (${NG}g/${NB}b) · ${SCENARIO} · ${N} games · ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log('='.repeat(60));
  console.log(`  completed ${o.completed}  timeouts ${o.timeouts}  errors ${o.errors}`);
  console.log(`  ghost  ${o.ghostWins}  (${(o.ghostWinRate * 100).toFixed(1)}%)`);
  console.log(`  bloc   ${o.blocWins}  (${(o.blocWinRate * 100).toFixed(1)}%)`);
  if (minRole) console.log(`  >> MINORITY (${minRole}) win rate: ${(o.minorityWinRate * 100).toFixed(1)}%  (target 25~45%)`);
  console.log(`  avg round ${o.avgRound}`);
  console.log(`  routes: ${Object.entries(o.routes).map(([r, n]) => `${r}:${n}`).join('  ')}`);
  console.log(`  minority best: asset ${o.minBestAssetAvg} / rep ${o.minBestRepAvg}   |   majority best: asset ${o.majBestAssetAvg} / rep ${o.majBestRepAvg}`);
  console.log(`  goals: ${JSON.stringify(o.goalsSample)}`);
  console.log(`  errors: ${errs.length === 0 ? '(none) 🟢' : errs.length}`);
  if (errs.length) errs.slice(0, 10).forEach(e => console.log('    ' + e));
  console.log(`  saved → ${outFile}`);
})().catch((e) => { console.error('[comp] fatal:', e); process.exit(1); });
