#!/usr/bin/env node
// =============================================================================
// DEAD NEXUS — Web Simulator E2E Balance Runner (bots-only)
//
// Usage:  node run.js [games=10] [mapSize=11x11]
//   e.g.  node run.js 3 5x5
//         node run.js 20 11x11
//
// What it does
//   1. Serves the repo root over a random local port (node http, no deps).
//   2. Loads /simulator/v0.5/ in headless Chromium. The three CDN libs
//      (React / ReactDOM / Babel-standalone) are unreachable from the sandbox,
//      so they are fulfilled from ./vendor via request interception; Google
//      Fonts are stubbed out.
//   3. The v6.11.2 build has NO "bots-only" UI mode (only solo/hot-seat, both
//      seat P0 as a human). So instead of clicking through a non-existent mode,
//      the runner drives the *actual deployed* game engine head-less: it calls
//      the page's own global functions (buildInitial / reducer / botPickCards /
//      checkInstantVictory + euro_module's euro_applyAll pipeline) and replays
//      the exact phase-dispatch sequence the React app's auto-advance effect
//      uses — with every seat (incl. P0) planned by botPickCards. This runs the
//      real M&A / suppression / victory logic, incl. euro_module's autonomous
//      bot M&A (euro_declareMnaBots) and bot suppression (euro_grantSuppression).
//   4. Per game it records winner faction/class, final round, M&A declares,
//      M&A completed acquisitions, suppression grants (+ retaliations), and ALL
//      console errors / pageerrors captured off the live page.
//
// Constraints honoured: does not touch simulator/ or sim-harness/; writes only
// under sim-e2e/. No commit/push.
// =============================================================================
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');          // repo root
const VENDOR = path.join(__dirname, 'vendor');
const RESULTS_DIR = path.join(__dirname, 'results');
const PER_GAME_TIMEOUT_MS = 90_000;
const GLOBALS_TIMEOUT_MS = 45_000;
const ROUND_GUARD = 40;                               // hard cap on round-iterations / game

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

// ---- args ------------------------------------------------------------------
const N = Math.max(1, parseInt(process.argv[2] || '10', 10));
const MAP = process.argv[3] || '11x11';
if (!['5x5', '11x11'].includes(MAP)) { console.error(`mapSize must be 5x5 or 11x11 (got "${MAP}")`); process.exit(1); }

const GHOST_CLASSES = ['CIPHER', 'BLADE', 'BROKER', 'RIGGER', 'DRIFTER', 'MOLE'];
const BLOC_CLASSES = ['VANTA', 'IRONWALL', 'HELIX', 'AXIOM', 'CARBON'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ---- static server ---------------------------------------------------------
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

// ---- CDN interception (offline vendor libs) --------------------------------
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

// ---- the head-less game loop (runs inside the page) ------------------------
// Mirrors GameScreen's auto-advance effect (index.html) but synchronous and
// with every seat planned by botPickCards. Returns a plain summary object.
function inPageGame(cfg) {
  try {
    const R = window.reducer, BP = window.botPickCards, CIV = window.checkInstantVictory;
    if (typeof R !== 'function' || typeof BP !== 'function' || typeof CIV !== 'function' || typeof window.buildInitial !== 'function')
      return { ok: false, error: 'engine globals missing' };

    let s = window.buildInitial({ mode: 'solo', mapSize: cfg.mapSize, difficulty: 'normal', role: cfg.role, specific: cfg.specific, humans: null });

    // suppression grants can't be read from the 150-capped log at the end, so
    // tally per-round (max seen per round) as we go — cap-immune.
    const suppressByRound = {}, retalByRound = {}, mnaDeclByRound = {};
    const shortEntryByRound = {}, shortSettleByRound = {}, shortCreditByRound = {};
    const tally = (st) => {
      const sup = {}, ret = {}, mna = {}, shE = {}, shS = {}, shC = {};
      for (const e of st.log) {
        const m = e.message || '';
        if (m.includes('견제 (₵')) { sup[e.round] = (sup[e.round] || 0) + 1; if (m.includes('(보복)')) ret[e.round] = (ret[e.round] || 0) + 1; }
        if (m.includes('인수 선언')) mna[e.round] = (mna[e.round] || 0) + 1;
        // v6.12 P0-4: 공매도 사용 빈도
        if (m.includes('숏') && m.includes('진입')) shE[e.round] = (shE[e.round] || 0) + 1;
        if (m.includes('숏 정산')) { shS[e.round] = (shS[e.round] || 0) + 1; const mm = m.match(/₵\+(\d+)/); if (mm) shC[e.round] = (shC[e.round] || 0) + parseInt(mm[1], 10); }
      }
      for (const r in sup) suppressByRound[r] = Math.max(suppressByRound[r] || 0, sup[r]);
      for (const r in ret) retalByRound[r] = Math.max(retalByRound[r] || 0, ret[r]);
      for (const r in mna) mnaDeclByRound[r] = Math.max(mnaDeclByRound[r] || 0, mna[r]);
      for (const r in shE) shortEntryByRound[r] = Math.max(shortEntryByRound[r] || 0, shE[r]);
      for (const r in shS) shortSettleByRound[r] = Math.max(shortSettleByRound[r] || 0, shS[r]);
      for (const r in shC) shortCreditByRound[r] = Math.max(shortCreditByRound[r] || 0, shC[r]);
    };

    let guard = 0;
    while (!s.meta.gameOver && guard < cfg.roundGuard) {
      guard++;
      // Phase 1 — market (news + bot trading)
      s = R(s, { type: 'SET_PHASE', phase: 1 });
      s = R(s, { type: 'DRAW_NEWS' });
      s = R(s, { type: 'BOT_MARKET' });
      // Phase 2 — every living, non-NPC seat plans via the bot AI
      s = R(s, { type: 'SET_PHASE', phase: 2 });
      for (let i = 0; i < s.players.length; i++) {
        const p = s.players[i];
        if (p.defeated || p.isNpc) continue;
        s = R(s, { type: 'PLAN_CARDS', playerIdx: i, cards: BP(s, i) });
      }
      // Phase 3 — execute
      s = R(s, { type: 'SET_PHASE', phase: 3 });
      s = R(s, { type: 'SNAPSHOT_TURN' });
      s = R(s, { type: 'EXECUTE_TURN' });
      s = R(s, { type: 'COMPUTE_TURN_DIFF' });
      // Phase 4 — income
      s = R(s, { type: 'SET_PHASE', phase: 4 });
      s = R(s, { type: 'COLLECT_INCOME' });
      // Phase 5 — research
      s = R(s, { type: 'SET_PHASE', phase: 5 });
      s = R(s, { type: 'RESEARCH_PHASE' });
      // Phase 6 — victory check → next round (NEXT_ROUND runs euro_applyAll:
      //   bot suppression + bot M&A declare + M&A resolve/judge)
      s = R(s, { type: 'SET_PHASE', phase: 6 });
      const after = CIV(s);
      if (after.meta.gameOver) { s = R(s, { type: 'VICTORY', winner: after.meta.winner, reason: after.meta.winReason }); tally(s); break; }
      s = R(s, { type: 'NEXT_ROUND' });
      tally(s);
    }
    tally(s);

    const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0);
    const w = s.meta.winner;
    const acquisitions = s.meta.acquisitions || {};
    const acqCount = Object.values(acquisitions).reduce((a, l) => a + (Array.isArray(l) ? l.length : 0), 0);
    const mnaCountMeta = Object.values(s.meta.mnaCount || {}).reduce((a, b) => a + b, 0);
    const field = s.players.filter(p => !p.isNpc).map(p => p.role);
    return {
      ok: true,
      gameOver: s.meta.gameOver,
      round: s.meta.round,
      winner: w,
      winnerRole: (w != null && s.players[w]) ? s.players[w].role : null,
      winnerClass: (w != null && s.players[w]) ? s.players[w].specific : null,
      reason: s.meta.winReason || null,
      field,                                   // roles of the 4 non-NPC seats
      mnaDeclaresLog: sum(mnaDeclByRound),     // task metric: log "인수 선언" count
      mnaDeclaresMeta: mnaCountMeta,           // cross-check via meta.mnaCount
      mnaAcquisitions: acqCount,               // completed hostile takeovers
      suppressGrants: sum(suppressByRound),    // 견제 grants
      suppressRetaliations: sum(retalByRound), // of which retaliation (보복)
      shortEntries: sum(shortEntryByRound),        // v6.12 P0-4: 숏 진입 횟수
      shortSettlements: sum(shortSettleByRound),   // 숏 정산 이벤트 수
      shortCredit: sum(shortCreditByRound),        // 숏 정산 총 ₵
      guardHit: guard >= cfg.roundGuard,
    };
  } catch (e) { return { ok: false, error: String((e && e.stack) || e) }; }
}

// ---- page lifecycle (reused; recreated after a wedge) ----------------------
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

const BENIGN = (t) => t.includes('in-browser Babel transformer'); // known dev-mode notice

(async () => {
  if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const server = await startServer();
  const port = server.address().port;
  console.log(`[e2e] serving ${ROOT} on http://127.0.0.1:${port}`);
  console.log(`[e2e] games=${N}  mapSize=${MAP}  timeout=${PER_GAME_TIMEOUT_MS / 1000}s/game`);

  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium' });
  let pg = await makePage(browser, port);

  const games = [];
  const t0 = Date.now();
  for (let k = 0; k < N; k++) {
    const role = Math.random() < 0.5 ? 'ghost' : 'bloc';
    const specific = pick(role === 'ghost' ? GHOST_CLASSES : BLOC_CLASSES);
    const cfg = { mapSize: MAP, role, specific, roundGuard: ROUND_GUARD };
    const startConsole = pg.buf.console.length, startErr = pg.buf.pageerror.length;
    const gStart = Date.now();

    let rec;
    try {
      const res = await Promise.race([
        pg.page.evaluate(inPageGame, cfg),
        new Promise((_, rej) => setTimeout(() => rej(new Error('__timeout__')), PER_GAME_TIMEOUT_MS)),
      ]);
      const consoleNew = pg.buf.console.slice(startConsole).filter(c => !BENIGN(c.text));
      const errNew = pg.buf.pageerror.slice(startErr);
      if (res.ok) {
        rec = { index: k + 1, status: 'ok', p0Role: role, p0Class: specific, ...res, ms: Date.now() - gStart, consoleErrors: consoleNew, pageErrors: errNew };
      } else {
        rec = { index: k + 1, status: 'error', p0Role: role, p0Class: specific, error: res.error, ms: Date.now() - gStart, consoleErrors: consoleNew, pageErrors: errNew };
      }
    } catch (e) {
      const timedOut = e && e.message === '__timeout__';
      const consoleNew = pg.buf.console.slice(startConsole).filter(c => !BENIGN(c.text));
      const errNew = pg.buf.pageerror.slice(startErr);
      rec = { index: k + 1, status: timedOut ? 'timeout' : 'error', p0Role: role, p0Class: specific, error: timedOut ? null : String(e.message || e), ms: Date.now() - gStart, consoleErrors: consoleNew, pageErrors: errNew };
      // a wedged / errored page may be unusable → rebuild it for the next game
      try { await pg.page.close(); } catch (_) {}
      try { pg = await makePage(browser, port); } catch (e2) { console.error('[e2e] page rebuild failed:', e2.message); }
    }
    games.push(rec);
    const w = rec.winnerRole ? `${rec.winnerRole}/${rec.winnerClass}` : '—';
    console.log(`[game ${String(k + 1).padStart(3)}/${N}] ${rec.status.padEnd(7)} R${rec.round ?? '?'} win=${w.padEnd(14)} p0=${role}/${specific} mna=${rec.mnaDeclaresLog ?? 0} sup=${rec.suppressGrants ?? 0} err=${(rec.consoleErrors?.length || 0) + (rec.pageErrors?.length || 0)} ${rec.ms}ms`);
  }

  try { await pg.page.close(); } catch (_) {}
  await browser.close();
  server.close();

  // ---- aggregate -----------------------------------------------------------
  const ok = games.filter(g => g.status === 'ok');
  const byFaction = { ghost: 0, bloc: 0, none: 0 };
  const byClass = {};
  let rounds = 0, mnaDecl = 0, mnaAcq = 0, sup = 0, retal = 0;
  let shEntry = 0, shSettle = 0, shCredit = 0, gamesWithShort = 0;
  const allErrors = [];
  for (const g of games) {
    if (g.status === 'ok') {
      byFaction[g.winnerRole || 'none']++;
      if (g.winnerClass) byClass[g.winnerClass] = (byClass[g.winnerClass] || 0) + 1;
      rounds += g.round; mnaDecl += g.mnaDeclaresLog; mnaAcq += g.mnaAcquisitions; sup += g.suppressGrants; retal += g.suppressRetaliations;
      shEntry += (g.shortEntries || 0); shSettle += (g.shortSettlements || 0); shCredit += (g.shortCredit || 0);
      if ((g.shortEntries || 0) > 0) gamesWithShort++;
    }
    (g.consoleErrors || []).forEach(c => allErrors.push({ game: g.index, kind: 'console.' + c.type, text: c.text }));
    (g.pageErrors || []).forEach(t => allErrors.push({ game: g.index, kind: 'pageerror', text: t }));
    if (g.status === 'error' && g.error) allErrors.push({ game: g.index, kind: 'game-exception', text: g.error });
  }
  const nOk = ok.length || 1;
  const summary = {
    meta: { generatedAt: new Date().toISOString(), games: N, mapSize: MAP, elapsedMs: Date.now() - t0, engine: 'headless reducer drive (all seats botPickCards)', build: 'simulator/v0.5 v6.11.2' },
    outcomes: {
      completed: ok.length,
      timeouts: games.filter(g => g.status === 'timeout').length,
      errors: games.filter(g => g.status === 'error').length,
      factionWins: byFaction,
      factionWinRate: { ghost: +(byFaction.ghost / nOk).toFixed(3), bloc: +(byFaction.bloc / nOk).toFixed(3) },
      classWins: byClass,
      avgRound: +(rounds / nOk).toFixed(2),
      mnaDeclaresTotal: mnaDecl, mnaDeclaresPerGame: +(mnaDecl / nOk).toFixed(2),
      mnaAcquisitionsTotal: mnaAcq,
      suppressGrantsTotal: sup, suppressGrantsPerGame: +(sup / nOk).toFixed(2), suppressRetaliations: retal,
      shortEntriesTotal: shEntry, shortEntriesPerGame: +(shEntry / nOk).toFixed(2),
      shortSettlementsTotal: shSettle, shortCreditTotal: shCredit, shortCreditPerGame: +(shCredit / nOk).toFixed(2),
      gamesWithShortPct: +(gamesWithShort / nOk).toFixed(3),
    },
    errors: allErrors,
    games,
  };

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(RESULTS_DIR, `${stamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(summary, null, 2));

  // ---- console report ------------------------------------------------------
  const o = summary.outcomes;
  console.log('\n' + '='.repeat(64));
  console.log(`  DEAD NEXUS E2E BALANCE  ·  ${MAP}  ·  ${N} games  ·  ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  console.log('='.repeat(64));
  console.log(`  completed ${o.completed}   timeouts ${o.timeouts}   errors ${o.errors}`);
  console.log('  ---- faction win rate (of completed) ----');
  console.log(`    ghost  ${byFaction.ghost}  (${(o.factionWinRate.ghost * 100).toFixed(1)}%)`);
  console.log(`    bloc   ${byFaction.bloc}  (${(o.factionWinRate.bloc * 100).toFixed(1)}%)`);
  if (byFaction.none) console.log(`    none   ${byFaction.none}`);
  console.log('  ---- class wins ----');
  Object.entries(byClass).sort((a, b) => b[1] - a[1]).forEach(([c, n]) => console.log(`    ${c.padEnd(9)} ${n}`));
  console.log('  ---- dynamics ----');
  console.log(`    avg round            ${o.avgRound}`);
  console.log(`    M&A declares         ${o.mnaDeclaresTotal} total  (${o.mnaDeclaresPerGame}/game)`);
  console.log(`    M&A acquisitions     ${o.mnaAcquisitionsTotal} total`);
  console.log(`    suppression grants   ${o.suppressGrantsTotal} total  (${o.suppressGrantsPerGame}/game)  · retaliations ${o.suppressRetaliations}`);
  console.log('  ---- shorts (P0-4) ----');
  console.log(`    short entries        ${o.shortEntriesTotal} total  (${o.shortEntriesPerGame}/game)  · games w/ short ${(o.gamesWithShortPct * 100).toFixed(1)}%`);
  console.log(`    short settlements    ${o.shortSettlementsTotal} total  · payout credit ${o.shortCreditTotal}  (${o.shortCreditPerGame}/game)`);
  console.log('  ---- errors ----');
  if (allErrors.length === 0) console.log('    (none) 🟢');
  else allErrors.slice(0, 50).forEach(e => console.log(`    g${e.game} [${e.kind}] ${e.text.slice(0, 200)}`));
  if (allErrors.length > 50) console.log(`    ... +${allErrors.length - 50} more (see JSON)`);
  console.log('='.repeat(64));
  console.log(`  saved → ${outFile}`);
})().catch((e) => { console.error('[e2e] fatal:', e); process.exit(1); });
