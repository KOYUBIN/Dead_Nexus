// Probe: verify CDN load + window globals exposure for the DEAD NEXUS web sim.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json' };

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const fp = path.join(ROOT, p);
      if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
        res.writeHead(404); res.end('not found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
      fs.createReadStream(fp).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve(server));
  });
}

(async () => {
  const server = await startServer();
  const port = server.address().port;
  console.log('server port', port);
  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  const logs = [];
  page.on('console', m => logs.push('[console.' + m.type() + '] ' + m.text()));
  page.on('pageerror', e => logs.push('[pageerror] ' + e.message));
  page.on('requestfailed', r => logs.push('[reqfail] ' + r.url() + ' :: ' + (r.failure() && r.failure().errorText)));
  const url = `http://127.0.0.1:${port}/simulator/v0.5/`;
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000 });
  } catch (e) { console.log('goto error:', e.message); }
  // Wait up to 25s for globals from Babel-compiled inline script
  let globals = null;
  try {
    await page.waitForFunction(() => typeof window.reducer === 'function' && typeof window.buildInitial === 'function', { timeout: 25000 });
  } catch (e) { console.log('waitForFunction failed:', e.message); }
  globals = await page.evaluate(() => ({
    reducer: typeof window.reducer,
    buildInitial: typeof window.buildInitial,
    initGame: typeof window.initGame,
    botPickCards: typeof window.botPickCards,
    checkInstantVictory: typeof window.checkInstantVictory,
    euro_applyAll: typeof window.euro_applyAll,
    euro_declareMnaBots: typeof window.euro_declareMnaBots,
    React: typeof window.React,
    Babel: typeof window.Babel,
    rootHtmlLen: (document.getElementById('root') || {}).innerHTML ? document.getElementById('root').innerHTML.length : 0,
  }));
  console.log('GLOBALS:', JSON.stringify(globals, null, 2));
  console.log('LOGS (' + logs.length + '):');
  logs.slice(0, 40).forEach(l => console.log('  ' + l));
  await browser.close();
  server.close();
})();
