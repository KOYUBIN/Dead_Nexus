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
// Usage: node run.js [games] [mapSize] [scenario]
//   scenario defaults to S01. e.g. `node run.js 100 11x11 S02`.
const N = Math.max(1, parseInt(process.argv[2] || '10', 10));
const MAP = process.argv[3] || '11x11';
const SCENARIO = process.argv[4] || 'S01';
if (!['5x5', '11x11'].includes(MAP)) { console.error(`mapSize must be 5x5 or 11x11 (got "${MAP}")`); process.exit(1); }
// v6.46 [66차, B-01]: 시나리오 레버 스윕 훅 — DN_SCEN_OVERRIDE=<JSON> 이 주어지면 매 판 buildInitial
//   직전에 in-page SCENARIOS[scenario] 위로 Object.assign 한다. 측정 전용(레포 기본값 불변);
//   미지정 시 완전 무영향(cfg.scenOverride === null → 분기 자체를 타지 않음).
let SCEN_OVERRIDE = null;
if (process.env.DN_SCEN_OVERRIDE) {
  try { SCEN_OVERRIDE = JSON.parse(process.env.DN_SCEN_OVERRIDE); }
  catch (e) { console.error(`DN_SCEN_OVERRIDE must be JSON (got "${process.env.DN_SCEN_OVERRIDE}")`); process.exit(1); }
}

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
// NOTE [54차]: v6.37에서 simulator/v0.5/index.html이 unpkg CDN 대신 ./vendor 로컬
//   3종(react·react-dom·babel)을 직접 로드하도록 전환됨 → 아래 unpkg 라우트는 이제
//   실제로 매칭될 요청이 없다(사문화). 무해하므로 유지하되, 로컬 전환의 회귀 방지용
//   가드로만 남긴다(혹시 CDN 참조가 되살아나면 여전히 오프라인 폴백). fonts 스텁은
//   index.html이 Google Fonts를 계속 link 하므로 유효 — 유지 필수.
async function installRoutes(page) {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    const send = (file) => route.fulfill({ status: 200, contentType: 'text/javascript; charset=utf-8', body: fs.readFileSync(path.join(VENDOR, file)) });
    if (url.includes('unpkg.com') && url.includes('react-dom')) return send('react-dom.production.min.js'); // dead (로컬 전환)
    if (url.includes('unpkg.com') && url.includes('/react@')) return send('react.production.min.js');       // dead (로컬 전환)
    if (url.includes('unpkg.com') && url.includes('babel')) return send('babel.min.js');                    // dead (로컬 전환)
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

    // v6.46 [66차, B-01]: 레버 스윕 오버라이드 (측정 전용). SCENARIOS 는 const 렉시컬 전역이라
    //   window 프로퍼티가 아니지만 같은 realm 의 evaluate 스코프에서 bare 이름으로 접근된다.
    if (cfg.scenOverride) {
      const SC = (typeof SCENARIOS !== 'undefined') ? SCENARIOS : null;
      const sid = cfg.scenario || 'S01';
      if (!SC || !SC[sid]) return { ok: false, error: 'SCENARIOS unavailable for override' };
      Object.assign(SC[sid], cfg.scenOverride);
    }
    let s = window.buildInitial({ mode: 'solo', mapSize: cfg.mapSize, difficulty: 'normal', role: cfg.role, specific: cfg.specific, humans: null, scenario: cfg.scenario || 'S01' });
    // v6.18: 시나리오 시작 조건 실측 캡처 (변형이 실제로 적용됐는지 확인용)
    const scenApplied = {
      scenario: s.meta.scenario,
      startHeat: s.heat,
      allBloc: s.players.every(p => p.role === 'bloc'),
      seatRoles: s.players.filter(p => !p.isNpc).map(p => p.role),
      npcBlocs: s.players.filter(p => p.isNpc).length,
      p0Zones: Object.keys(s.map).filter(c => s.map[c].owner === 0).length,
      mnaNoCooldown: !!s.meta.mnaNoCooldown,
      npcStart: (s.meta.npcs || []).length,          // v6.21: 시작 NPC 수 (S04=3 police +5 captive=8)
      policeSpawned: !!s.meta.policeSpawned,
      captiveStart: (s.meta.npcs || []).filter(n => n.type === 'captive').length,  // v6.23: 시작 구금 NPC 수 (S04=5)
    };

    // suppression grants can't be read from the 150-capped log at the end, so
    // tally per-round (max seen per round) as we go — cap-immune.
    const suppressByRound = {}, retalByRound = {}, mnaDeclByRound = {};
    const shortEntryByRound = {}, shortSettleByRound = {}, shortCreditByRound = {};
    const woundByRound = {}, scandalByRound = {};   // v6.13.1 (P1-1): 덱 오염 발생 빈도
    // v6.16 (P1-2): 클래스 개성 루프 — 시그니처 마일스톤 발동 빈도
    const rigByRound = {}, memoByRound = {}, hackByRound = {}, disgByRound = {};
    // v6.27 (B-07, docs/23 갭3): 종료 선언 라이프사이클 계측 — 선언·해제(역전)·확정 집계.
    //   선언/해제는 라운드당 최대 1건(applyVictoryDeclaration 단일 분기)이라 max-per-round tally 로 cap-immune.
    const declByRound = {}, releaseByRound = {};
    const tally = (st) => {
      const sup = {}, ret = {}, mna = {}, shE = {}, shS = {}, shC = {}, wo = {}, sc = {};
      const rg = {}, mo = {}, hk = {}, dg = {}, dc = {}, rl = {};
      for (const e of st.log) {
        const m = e.message || '';
        if (m.includes('견제 (₵')) { sup[e.round] = (sup[e.round] || 0) + 1; if (m.includes('(보복)')) ret[e.round] = (ret[e.round] || 0) + 1; }
        if (m.includes('인수 선언')) mna[e.round] = (mna[e.round] || 0) + 1;
        // v6.12 P0-4: 공매도 사용 빈도
        if (m.includes('숏') && m.includes('진입')) shE[e.round] = (shE[e.round] || 0) + 1;
        if (m.includes('숏 정산')) { shS[e.round] = (shS[e.round] || 0) + 1; const mm = m.match(/₵\+(\d+)/); if (mm) shC[e.round] = (shC[e.round] || 0) + parseInt(mm[1], 10); }
        // v6.13.1 (P1-1): 상처·스캔들 덱 오염 삽입
        if (m.includes('상처 카드 1장 덱 오염')) wo[e.round] = (wo[e.round] || 0) + 1;
        if (m.includes('스캔들 카드 1장 덱 오염')) sc[e.round] = (sc[e.round] || 0) + 1;
        // v6.16 (P1-2): 시그니처 마일스톤 (euro 틱 + 카드 훅 합산 발동)
        if (m.includes('함정 발동 ★+2')) rg[e.round] = (rg[e.round] || 0) + 1;   // RIGGER
        if (m.includes('메모 5 도달')) mo[e.round] = (mo[e.round] || 0) + 1;      // BROKER
        if (m.includes('해킹 노드')) hk[e.round] = (hk[e.round] || 0) + 1;        // CIPHER
        if (m.includes('위장 시작')) dg[e.round] = (dg[e.round] || 0) + 1;        // MOLE 위장 개시
        // v6.27 (B-07): 종료 선언 라이프사이클
        if (m.includes('승리 조건 도달')) dc[e.round] = (dc[e.round] || 0) + 1;    // 선언 (📢)
        if (m.includes('종료 선언 해제')) rl[e.round] = (rl[e.round] || 0) + 1;    // 해제=역전 (⚖ 견제 성공)
      }
      for (const r in sup) suppressByRound[r] = Math.max(suppressByRound[r] || 0, sup[r]);
      for (const r in ret) retalByRound[r] = Math.max(retalByRound[r] || 0, ret[r]);
      for (const r in mna) mnaDeclByRound[r] = Math.max(mnaDeclByRound[r] || 0, mna[r]);
      for (const r in shE) shortEntryByRound[r] = Math.max(shortEntryByRound[r] || 0, shE[r]);
      for (const r in shS) shortSettleByRound[r] = Math.max(shortSettleByRound[r] || 0, shS[r]);
      for (const r in shC) shortCreditByRound[r] = Math.max(shortCreditByRound[r] || 0, shC[r]);
      for (const r in wo) woundByRound[r] = Math.max(woundByRound[r] || 0, wo[r]);
      for (const r in sc) scandalByRound[r] = Math.max(scandalByRound[r] || 0, sc[r]);
      for (const r in rg) rigByRound[r] = Math.max(rigByRound[r] || 0, rg[r]);
      for (const r in mo) memoByRound[r] = Math.max(memoByRound[r] || 0, mo[r]);
      for (const r in hk) hackByRound[r] = Math.max(hackByRound[r] || 0, hk[r]);
      for (const r in dg) disgByRound[r] = Math.max(disgByRound[r] || 0, dg[r]);
      for (const r in dc) declByRound[r] = Math.max(declByRound[r] || 0, dc[r]);
      for (const r in rl) releaseByRound[r] = Math.max(releaseByRound[r] || 0, rl[r]);
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
    // v6.27 (B-07): 종료 선언 계측 + (B-06) highlightPoints 실측 (승리 환산 게이지)
    const reason0 = s.meta.winReason || '';
    const declConfirmed = /종료 선언 확정/.test(reason0);
    const hlPts = s.players.filter(p => !p.isNpc && !p.defeated).map(p => p.highlightPoints || 0);
    const hlPtsMax = hlPts.reduce((a, b) => Math.max(a, b), 0);
    const hlPtsSum = hlPts.reduce((a, b) => a + b, 0);
    const winnerHlPts = (w != null && s.players[w]) ? (s.players[w].highlightPoints || 0) : 0;
    const seats = s.players.filter(p => !p.isNpc);
    const seatTLs = seats.map(p => ({ role: p.role, cls: p.specific, tl: p.tl || 1, prog: p.tlProgress || 0 }));
    return {
      ok: true,
      gameOver: s.meta.gameOver,
      round: s.meta.round,
      scenApplied,
      seatTLs,
      maxTl: seatTLs.reduce((a, x) => Math.max(a, x.tl), 1),
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
      // v6.27 (B-07, docs/23 갭3): 종료 선언 라이프사이클
      victoryDeclares: sum(declByRound),       // 선언 총수 (📢 승리 조건 도달)
      victoryReleases: sum(releaseByRound),    // 해제=역전 총수 (⚖ 종료 선언 해제 — 견제 성공)
      declConfirmed,                           // 이 판이 "종료 선언 확정"으로 종료됐는가
      // v6.27 (B-06, docs/22 P1-6): highlightPoints 실측 (승리 환산 게이지)
      hlPtsMax, hlPtsSum, winnerHlPts,
      shortEntries: sum(shortEntryByRound),        // v6.12 P0-4: 숏 진입 횟수
      shortSettlements: sum(shortSettleByRound),   // 숏 정산 이벤트 수
      shortCredit: sum(shortCreditByRound),        // 숏 정산 총 ₵
      woundInserts: sum(woundByRound),             // v6.13.1 (P1-1): 상처 삽입 수
      scandalInserts: sum(scandalByRound),         // v6.13.1 (P1-1): 스캔들 삽입 수
      // v6.16 (P1-2): 클래스 개성 루프 측정
      // v6.21: 모바일 NPC 엔진 계측 (cap-immune meta 카운터)
      policeFights: s.meta.policeFights || 0,       // Ghost×경찰 자동전투(비격파) 누적
      policeKills: s.meta.policeKills || 0,         // 경찰 NPC 격파 누적
      // v6.23: 구출 퀘스트 계측 (docs/14 §S04)
      rescues: s.meta.rescues || 0,                 // 구금 NPC 구출 누적 (cap-immune meta counter)
      rescuedAll: Object.values(s.meta.captiveBonusAwarded || {}).some(Boolean),  // 전원(5) 구출 달성 여부
      captiveEnd: (s.meta.npcs || []).filter(n => n.type === 'captive').length,   // 종료 시 잔존 구금 NPC
      npcEnd: (s.meta.npcs || []).length,          // 종료 시점 잔존 NPC 수
      gaugeHooks: s.meta.gaugeHooks || 0,          // 카드→게이지 훅 발동 총수 (cap-immune meta counter)
      moleReveals: s.meta.moleReveals || 0,        // MOLE 위장 발각 총수
      // v6.46 [71차 M11]: meta.highlights 발동 계측 — HIGHLIGHT_DEFS 엔트리별 실제 발동 횟수.
      //   S06 특수 승리 루트(reconstructor/liquidator)가 실측 대역을 갖도록 하는 것이 1차 목적이나,
      //   지표는 키 무관 일반(모든 하이라이트 死엔트리 탐지에 재사용). recordHighlight 는 1회성이라
      //   판당 (key,playerIdx) 유일 → 키별 카운트 = "그 판에서 그 하이라이트를 받은 좌석 수".
      highlightKeys: (s.meta.highlights || []).map(h => h.key),
      rigMilestones: sum(rigByRound),              // RIGGER 함정 발동 ★+2 (euro+훅 합산)
      brokerMemo5: sum(memoByRound),               // BROKER 메모 5 도달
      cipherHackNodes: sum(hackByRound),           // CIPHER 해킹 노드 활성
      moleDisguises: sum(disgByRound),             // MOLE 위장 개시
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
  console.log(`[e2e] games=${N}  mapSize=${MAP}  scenario=${SCENARIO}  timeout=${PER_GAME_TIMEOUT_MS / 1000}s/game`);

  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium' });
  let pg = await makePage(browser, port);

  // v6.46 [71차 H8]: build 스탬프 동적화 — 구 'simulator/v0.5 v6.18' 하드코딩은 v6.4x 출하 후에도
  //   갱신되지 않아 결과 JSON 이 매 회차 오기재됐다. 페이지의 자체 버전 표기에서 추출하고,
  //   git rev-parse 로 커밋을 덧붙인다(둘 다 실패해도 러너는 계속 — 스탬프만 'unknown').
  //   추출 규칙: 페이지에 등장하는 v6.x[.y] 스탬프 중 **최댓값**(문서 순서 첫 매치가 아니라) —
  //   구버전 주석(v6.44 CSS 주석 등)이 앞에 오므로 first-match 는 오히려 오기재를 낳는다.
  const PAGE_BUILD = await pg.page.evaluate(() => {
    const all = document.documentElement.innerHTML.match(/v6\.\d+(?:\.\d+)?/g) || [];
    if (!all.length) return null;
    //   major/minor/patch 를 고정 자릿수로 정규화해 비교 — 자릿수가 다른 'v6.13.1' 이
    //   'v6.46' 보다 커 보이는 오비교를 막는다(누적 곱셈 방식의 함정).
    const key = (v) => { const p = v.slice(1).split('.').map(Number); return (p[0] || 0) * 1e6 + (p[1] || 0) * 1e3 + (p[2] || 0); };
    return all.reduce((a, b) => (key(b) > key(a) ? b : a));
  }).catch(() => null);
  const GIT_REV = (() => {
    try { return require('child_process').execSync('git rev-parse --short HEAD', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
    catch (_) { return null; }
  })();
  const BUILD_STAMP = `simulator/v0.5 ${PAGE_BUILD || 'unknown'}${GIT_REV ? ` @${GIT_REV}` : ''}`;
  console.log(`[e2e] build stamp: ${BUILD_STAMP}`);

  const games = [];
  const t0 = Date.now();
  for (let k = 0; k < N; k++) {
    // v6.18: allBloc 시나리오(S02)는 P0 를 항상 Bloc 으로 (initGame 이 강제하지만 명시).
    // v6.19: ghostRising 시나리오(S03)는 P0 를 Ghost 로 (protagonist; initGame 이 강제하지만 명시).
    const allBloc = SCENARIO === 'S02';
    const role = allBloc ? 'bloc' : (SCENARIO === 'S03' ? 'ghost' : (Math.random() < 0.5 ? 'ghost' : 'bloc'));
    const specific = pick(role === 'ghost' ? GHOST_CLASSES : BLOC_CLASSES);
    const cfg = { mapSize: MAP, role, specific, roundGuard: ROUND_GUARD, scenario: SCENARIO, scenOverride: SCEN_OVERRIDE };
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
  // v6.27 (B-07): 종료 선언 라이프사이클 집계
  let declTot = 0, releaseTot = 0, declGames = 0, releaseGames = 0, declConfirmedGames = 0;
  // v6.27 (B-06): highlightPoints 집계
  let hlMaxSum = 0, hlSumTot = 0, winnerHlSum = 0;
  let shEntry = 0, shSettle = 0, shCredit = 0, gamesWithShort = 0;
  let woundTot = 0, scandalTot = 0, gamesWithWound = 0, gamesWithScandal = 0;
  let gaugeTot = 0, moleRevTot = 0, rigMs = 0, memo5 = 0, hackTot = 0, disgTot = 0;
  let policeFightsTot = 0, policeKillsTot = 0, gamesWithPolice = 0, gamesWithFight = 0, npcStartSum = 0;
  let rescuesTot = 0, gamesWithRescue = 0, gamesAllRescued = 0, captiveGames = 0;   // v6.23: 구출 계측
  // v6.46 [71차 M11]: 하이라이트 발동 계측 — 키별 총 발동수 + 발동한 판 수(≥1).
  const hlFireTot = {}, hlFireGames = {};
  // TL distribution instrumentation
  const tlSeatDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };   // per-seat final TL histogram
  let tlSeatTotal = 0;
  let gamesTL3plus = 0, gamesTL4plus = 0, gamesTL5 = 0;   // games where SOME seat reached TL>=x
  const tlByRoleReach = { ghost: { 3: 0, 4: 0, 5: 0, seats: 0 }, bloc: { 3: 0, 4: 0, 5: 0, seats: 0 } };
  const allErrors = [];
  for (const g of games) {
    if (g.status === 'ok') {
      byFaction[g.winnerRole || 'none']++;
      if (g.winnerClass) byClass[g.winnerClass] = (byClass[g.winnerClass] || 0) + 1;
      rounds += g.round; mnaDecl += g.mnaDeclaresLog; mnaAcq += g.mnaAcquisitions; sup += g.suppressGrants; retal += g.suppressRetaliations;
      // v6.27 (B-07): 선언 라이프사이클
      declTot += (g.victoryDeclares || 0); releaseTot += (g.victoryReleases || 0);
      if ((g.victoryDeclares || 0) > 0) declGames++;
      if ((g.victoryReleases || 0) > 0) releaseGames++;
      if (g.declConfirmed) declConfirmedGames++;
      // v6.27 (B-06): highlightPoints
      hlMaxSum += (g.hlPtsMax || 0); hlSumTot += (g.hlPtsSum || 0); winnerHlSum += (g.winnerHlPts || 0);
      shEntry += (g.shortEntries || 0); shSettle += (g.shortSettlements || 0); shCredit += (g.shortCredit || 0);
      if ((g.shortEntries || 0) > 0) gamesWithShort++;
      woundTot += (g.woundInserts || 0); scandalTot += (g.scandalInserts || 0);
      if ((g.woundInserts || 0) > 0) gamesWithWound++;
      if ((g.scandalInserts || 0) > 0) gamesWithScandal++;
      policeFightsTot += (g.policeFights || 0); policeKillsTot += (g.policeKills || 0);
      if ((g.scenApplied?.npcStart || 0) > 0 || (g.scenApplied?.policeSpawned)) gamesWithPolice++;
      if (((g.policeFights || 0) + (g.policeKills || 0)) > 0) gamesWithFight++;
      npcStartSum += (g.scenApplied?.npcStart || 0);
      // v6.23: 구출 계측 — captive 있는 판(S04)만 분모로
      if ((g.scenApplied?.captiveStart || 0) > 0) {
        captiveGames++;
        rescuesTot += (g.rescues || 0);
        if ((g.rescues || 0) > 0) gamesWithRescue++;
        if (g.rescuedAll) gamesAllRescued++;
      }
      // v6.46 [71차 M11]: 하이라이트 발동 집계 (키별 총수 · 발동 판 수).
      const hlSeen = {};
      for (const hk of (g.highlightKeys || [])) { hlFireTot[hk] = (hlFireTot[hk] || 0) + 1; hlSeen[hk] = 1; }
      for (const hk of Object.keys(hlSeen)) hlFireGames[hk] = (hlFireGames[hk] || 0) + 1;
      gaugeTot += (g.gaugeHooks || 0); moleRevTot += (g.moleReveals || 0);
      rigMs += (g.rigMilestones || 0); memo5 += (g.brokerMemo5 || 0); hackTot += (g.cipherHackNodes || 0); disgTot += (g.moleDisguises || 0);
      // TL distribution
      const sts = g.seatTLs || [];
      if ((g.maxTl || 1) >= 3) gamesTL3plus++;
      if ((g.maxTl || 1) >= 4) gamesTL4plus++;
      if ((g.maxTl || 1) >= 5) gamesTL5++;
      for (const st of sts) {
        tlSeatDist[st.tl] = (tlSeatDist[st.tl] || 0) + 1; tlSeatTotal++;
        const r = tlByRoleReach[st.role]; if (r) { r.seats++; if (st.tl >= 3) r[3]++; if (st.tl >= 4) r[4]++; if (st.tl >= 5) r[5]++; }
      }
    }
    (g.consoleErrors || []).forEach(c => allErrors.push({ game: g.index, kind: 'console.' + c.type, text: c.text }));
    (g.pageErrors || []).forEach(t => allErrors.push({ game: g.index, kind: 'pageerror', text: t }));
    if (g.status === 'error' && g.error) allErrors.push({ game: g.index, kind: 'game-exception', text: g.error });
  }
  const nOk = ok.length || 1;
  const summary = {
    meta: { generatedAt: new Date().toISOString(), games: N, mapSize: MAP, scenario: SCENARIO, scenOverride: SCEN_OVERRIDE, elapsedMs: Date.now() - t0, engine: 'headless reducer drive (all seats botPickCards)', build: BUILD_STAMP },
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
      // v6.27 (B-07, docs/23 갭3): 종료 선언 라이프사이클 — 역전률 = 해제판 / 선언판
      victoryDeclaresTotal: declTot, declGames, declConfirmedGames,
      victoryReleasesTotal: releaseTot, releaseGames,
      reversalRateOfDecl: +(releaseGames / (declGames || 1)).toFixed(4),
      reversalRateOfAll: +(releaseGames / nOk).toFixed(4),
      // v6.46 [71차 M11]: 하이라이트 발동 계측 (키별 총 발동수 · 발동 판 수).
      highlightFires: hlFireTot, highlightFireGames: hlFireGames,
      // v6.27 (B-06, docs/22 P1-6): highlightPoints 실측
      hlPtsMaxAvg: +(hlMaxSum / nOk).toFixed(2), hlPtsSumAvg: +(hlSumTot / nOk).toFixed(2), winnerHlPtsAvg: +(winnerHlSum / nOk).toFixed(2),
      shortEntriesTotal: shEntry, shortEntriesPerGame: +(shEntry / nOk).toFixed(2),
      shortSettlementsTotal: shSettle, shortCreditTotal: shCredit, shortCreditPerGame: +(shCredit / nOk).toFixed(2),
      gamesWithShortPct: +(gamesWithShort / nOk).toFixed(3),
      woundInsertsTotal: woundTot, woundInsertsPerGame: +(woundTot / nOk).toFixed(2), gamesWithWoundPct: +(gamesWithWound / nOk).toFixed(3),
      scandalInsertsTotal: scandalTot, scandalInsertsPerGame: +(scandalTot / nOk).toFixed(2), gamesWithScandalPct: +(gamesWithScandal / nOk).toFixed(3),
      // v6.16 (P1-2): 클래스 개성 루프
      // v6.21: 모바일 NPC 엔진 계측
      npcStartAvg: +(npcStartSum / nOk).toFixed(2),
      gamesWithPolicePct: +(gamesWithPolice / nOk).toFixed(3),
      policeFightsTotal: policeFightsTot, policeFightsPerGame: +(policeFightsTot / nOk).toFixed(2),
      policeKillsTotal: policeKillsTot, policeKillsPerGame: +(policeKillsTot / nOk).toFixed(2),
      gamesWithFightPct: +(gamesWithFight / nOk).toFixed(3),
      // v6.23: 구출 퀘스트 (captive 있는 판 분모)
      captiveGames,
      rescuesTotal: rescuesTot, rescuesPerCaptiveGame: +(rescuesTot / (captiveGames || 1)).toFixed(2),
      rescueOccurRate: +(gamesWithRescue / (captiveGames || 1)).toFixed(3),
      allRescuedRate: +(gamesAllRescued / (captiveGames || 1)).toFixed(3),
      gaugeHooksTotal: gaugeTot, gaugeHooksPerGame: +(gaugeTot / nOk).toFixed(2),
      moleRevealsTotal: moleRevTot, moleDisguisesTotal: disgTot,
      rigMilestonesTotal: rigMs, rigMilestonesPerGame: +(rigMs / nOk).toFixed(2),
      brokerMemo5Total: memo5, brokerMemo5PerGame: +(memo5 / nOk).toFixed(2),
      cipherHackNodesTotal: hackTot, cipherHackNodesPerGame: +(hackTot / nOk).toFixed(2),
      // TL distribution (Tech Level 3~5 unlock)
      tlSeatHistogram: tlSeatDist,
      tlSeatTotal,
      gamesTL3plusPct: +(gamesTL3plus / nOk).toFixed(3),
      gamesTL4plusPct: +(gamesTL4plus / nOk).toFixed(3),
      gamesTL5Pct: +(gamesTL5 / nOk).toFixed(3),
      tlByRoleReach,
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
  console.log('  ---- victory declaration lifecycle (B-07 · docs/23 갭3) ----');
  console.log(`    declarations         ${o.victoryDeclaresTotal} total  · games w/ decl ${o.declGames}  · confirmed-win games ${o.declConfirmedGames}`);
  console.log(`    releases (reversal)  ${o.victoryReleasesTotal} total  · games w/ release ${o.releaseGames}`);
  console.log(`    REVERSAL RATE        ${(o.reversalRateOfDecl * 100).toFixed(1)}% of decl-games  ·  ${(o.reversalRateOfAll * 100).toFixed(1)}% of all`);
  console.log('  ---- highlightPoints victory conversion (B-06 · docs/22 P1-6) ----');
  console.log(`    pt  max/game ${o.hlPtsMaxAvg}  · sum/game ${o.hlPtsSumAvg}  · winner ${o.winnerHlPtsAvg}`);
  console.log('  ---- shorts (P0-4) ----');
  console.log(`    short entries        ${o.shortEntriesTotal} total  (${o.shortEntriesPerGame}/game)  · games w/ short ${(o.gamesWithShortPct * 100).toFixed(1)}%`);
  console.log(`    short settlements    ${o.shortSettlementsTotal} total  · payout credit ${o.shortCreditTotal}  (${o.shortCreditPerGame}/game)`);
  console.log('  ---- deck pollution (P1-1) ----');
  console.log(`    wound inserts        ${o.woundInsertsTotal} total  (${o.woundInsertsPerGame}/game)  · games w/ wound ${(o.gamesWithWoundPct * 100).toFixed(1)}%`);
  console.log(`    scandal inserts      ${o.scandalInsertsTotal} total  (${o.scandalInsertsPerGame}/game)  · games w/ scandal ${(o.gamesWithScandalPct * 100).toFixed(1)}%`);
  console.log('  ---- mobile NPC engine (v6.21) ----');
  console.log(`    avg start police     ${o.npcStartAvg}  · games w/ police ${(o.gamesWithPolicePct * 100).toFixed(1)}%`);
  console.log(`    police auto-fights   ${o.policeFightsTotal} total  (${o.policeFightsPerGame}/game)  · games w/ fight ${(o.gamesWithFightPct * 100).toFixed(1)}%`);
  console.log(`    police kills         ${o.policeKillsTotal} total  (${o.policeKillsPerGame}/game)`);
  if (o.captiveGames > 0) {
    console.log('  ---- rescue quest (v6.23 · S04) ----');
    console.log(`    captive games        ${o.captiveGames}  (분모)`);
    console.log(`    rescues              ${o.rescuesTotal} total  (${o.rescuesPerCaptiveGame}/game)`);
    console.log(`    rescue occur rate    ${(o.rescueOccurRate * 100).toFixed(1)}%  (≥1 구출)`);
    console.log(`    all-5 rescued rate   ${(o.allRescuedRate * 100).toFixed(1)}%  (렙+10 보너스)`);
  }
  // v6.46 [71차 M11]: 하이라이트 발동 계기판 — 死엔트리(0회) 를 숨기지 않고 함께 출력한다.
  //   S06 의 reconstructor/liquidator 는 이 대역으로만 실증된다(타 시나리오는 구조적 0 이 정상).
  console.log('  ---- highlight fires (meta.highlights · v6.46 [71차 M11]) ----');
  {
    const keys = Object.keys(hlFireTot).sort((a, b) => (hlFireTot[b] - hlFireTot[a]) || a.localeCompare(b));
    if (!keys.length) console.log('    (발동 0 — 이 시나리오/표본에서 어떤 하이라이트도 발동하지 않음)');
    for (const k of keys) {
      console.log(`    ${k.padEnd(22)} ${String(hlFireTot[k]).padStart(5)} fires  · ${String(hlFireGames[k]).padStart(4)} games (${((hlFireGames[k] / nOk) * 100).toFixed(1)}%)`);
    }
  }
  console.log('  ---- class personality loop (P1-2) ----');
  console.log(`    gauge hooks (card→gauge)  ${o.gaugeHooksTotal} total  (${o.gaugeHooksPerGame}/game)`);
  console.log(`    RIGGER trap-fire ★+2      ${o.rigMilestonesTotal} total  (${o.rigMilestonesPerGame}/game)`);
  console.log(`    BROKER memo-5 payout      ${o.brokerMemo5Total} total  (${o.brokerMemo5PerGame}/game)`);
  console.log(`    CIPHER hack-node activ.   ${o.cipherHackNodesTotal} total  (${o.cipherHackNodesPerGame}/game)`);
  console.log(`    MOLE disguises / reveals  ${o.moleDisguisesTotal} / ${o.moleRevealsTotal}`);
  console.log('  ---- tech level distribution (TL3~5 unlock) ----');
  console.log(`    seat TL histogram   TL1:${tlSeatDist[1]} TL2:${tlSeatDist[2]} TL3:${tlSeatDist[3]} TL4:${tlSeatDist[4]} TL5:${tlSeatDist[5]}  (n=${tlSeatTotal} seats)`);
  console.log(`    games w/ TL3+       ${gamesTL3plus}  (${(o.gamesTL3plusPct * 100).toFixed(1)}%)`);
  console.log(`    games w/ TL4+       ${gamesTL4plus}  (${(o.gamesTL4plusPct * 100).toFixed(1)}%)`);
  console.log(`    games w/ TL5        ${gamesTL5}  (${(o.gamesTL5Pct * 100).toFixed(1)}%)`);
  console.log(`    ghost seats TL3/4/5 ${tlByRoleReach.ghost[3]}/${tlByRoleReach.ghost[4]}/${tlByRoleReach.ghost[5]} of ${tlByRoleReach.ghost.seats}   ·   bloc seats TL3/4/5 ${tlByRoleReach.bloc[3]}/${tlByRoleReach.bloc[4]}/${tlByRoleReach.bloc[5]} of ${tlByRoleReach.bloc.seats}`);
  // v6.18: 시나리오 시작 조건 실측 검증 — 변형이 실제 판에 나타났는가.
  const okScen = ok.map(g => g.scenApplied).filter(Boolean);
  if (okScen.length) {
    const avg = (f) => +(okScen.reduce((a, x) => a + f(x), 0) / okScen.length).toFixed(2);
    const allBlocPct = +(okScen.filter(x => x.allBloc).length / okScen.length).toFixed(3);
    console.log('  ---- scenario applied (start-condition assertion) ----');
    console.log(`    scenario meta        ${okScen[0].scenario}  (mnaNoCooldown=${okScen[0].mnaNoCooldown})`);
    console.log(`    avg start heat       ${avg(x => x.startHeat)}`);
    console.log(`    all-bloc games       ${(allBlocPct * 100).toFixed(1)}%`);
    console.log(`    avg NPC blocs        ${avg(x => x.npcBlocs)}`);
    console.log(`    avg P0 start zones   ${avg(x => x.p0Zones)}`);
    console.log(`    avg non-NPC seats    ${avg(x => x.seatRoles.length)}`);
  }
  console.log('  ---- errors ----');
  if (allErrors.length === 0) console.log('    (none) 🟢');
  else allErrors.slice(0, 50).forEach(e => console.log(`    g${e.game} [${e.kind}] ${e.text.slice(0, 200)}`));
  if (allErrors.length > 50) console.log(`    ... +${allErrors.length - 50} more (see JSON)`);
  console.log('='.repeat(64));
  console.log(`  saved → ${outFile}`);
})().catch((e) => { console.error('[e2e] fatal:', e); process.exit(1); });
