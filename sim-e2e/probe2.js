// Probe v2: serve CDN libs via route interception (offline), verify globals + one game.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const VENDOR = path.join(__dirname, 'vendor');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json' };

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const fp = path.join(ROOT, p);
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('nf'); return; }
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

(async () => {
  const server = await startServer();
  const port = server.address().port;
  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await installRoutes(page);
  const logs = [];
  page.on('console', m => logs.push('[c.' + m.type() + '] ' + m.text()));
  page.on('pageerror', e => logs.push('[pageerror] ' + e.message));
  await page.goto(`http://127.0.0.1:${port}/simulator/v0.5/`, { waitUntil: 'load', timeout: 30000 }).catch(e => console.log('goto:', e.message));
  try {
    await page.waitForFunction(() => typeof window.reducer === 'function' && typeof window.buildInitial === 'function', { timeout: 25000 });
    console.log('GLOBALS READY');
  } catch (e) { console.log('waitForFunction failed:', e.message); }
  const g = await page.evaluate(() => ({
    reducer: typeof window.reducer, buildInitial: typeof window.buildInitial, initGame: typeof window.initGame,
    botPickCards: typeof window.botPickCards, checkInstantVictory: typeof window.checkInstantVictory,
    euro_applyAll: typeof window.euro_applyAll, React: typeof window.React,
  }));
  console.log('GLOBALS:', JSON.stringify(g));

  const result = await page.evaluate((mapSize) => {
    try {
      const R = window.reducer, BP = window.botPickCards, CIV = window.checkInstantVictory;
      let s = window.buildInitial({ mode: 'solo', mapSize, difficulty: 'normal', role: 'ghost', specific: 'CIPHER', humans: null });
      let guard = 0;
      while (!s.meta.gameOver && guard < 40) {
        guard++;
        s = R(s, { type: 'SET_PHASE', phase: 1 });
        s = R(s, { type: 'DRAW_NEWS' });
        s = R(s, { type: 'BOT_MARKET' });
        s = R(s, { type: 'SET_PHASE', phase: 2 });
        for (let i = 0; i < s.players.length; i++) { const p = s.players[i]; if (p.defeated || p.isNpc) continue; s = R(s, { type: 'PLAN_CARDS', playerIdx: i, cards: BP(s, i) }); }
        s = R(s, { type: 'SET_PHASE', phase: 3 });
        s = R(s, { type: 'SNAPSHOT_TURN' }); s = R(s, { type: 'EXECUTE_TURN' }); s = R(s, { type: 'COMPUTE_TURN_DIFF' });
        s = R(s, { type: 'SET_PHASE', phase: 4 }); s = R(s, { type: 'COLLECT_INCOME' });
        s = R(s, { type: 'SET_PHASE', phase: 5 }); s = R(s, { type: 'RESEARCH_PHASE' });
        s = R(s, { type: 'SET_PHASE', phase: 6 });
        const after = CIV(s);
        if (after.meta.gameOver) { s = R(s, { type: 'VICTORY', winner: after.meta.winner, reason: after.meta.winReason }); break; }
        s = R(s, { type: 'NEXT_ROUND' });
      }
      const w = s.meta.winner;
      const mna = s.log.filter(l => (l.message || '').includes('인수 선언')).length;
      return { ok: true, round: s.meta.round, gameOver: s.meta.gameOver, winner: w, winnerRole: w != null ? s.players[w].role : null, winnerSpec: w != null ? s.players[w].specific : null, reason: s.meta.winReason, mnaDeclares: mna, logLen: s.log.length };
    } catch (e) { return { ok: false, error: String(e && e.stack || e) }; }
  }, '5x5');
  console.log('GAME RESULT:', JSON.stringify(result, null, 2));
  console.log('LOGS (' + logs.length + '):'); logs.slice(0, 30).forEach(l => console.log('  ' + l));
  await browser.close();
  server.close();
})();
