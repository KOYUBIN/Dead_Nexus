// Mobile-layout verification for DEAD NEXUS web simulator (v6.25 mobile fix).
// Serves repo root, intercepts CDN → local vendor, drives the setup UI to start a
// solo 5×5 game, then asserts core controls are reachable at 390×844 and captures
// screenshots (mobile + desktop 1280×800 regression).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const VENDOR = path.join(__dirname, 'vendor');
const OUT = path.join(__dirname, 'results');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml' };

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

async function startSolo5x5(page) {
  // default state: mode=solo, mapSize=11x11, tutorial ON. Click the 5×5 card,
  // turn tutorial OFF (clean shot), then START.
  await page.getByText('5×5 튜토리얼').click();
  // tutorial toggle row appears for solo+5x5; click its label to disable overlay
  try { await page.getByText('🎓 가이드 튜토리얼', { exact: false }).first().click({ timeout: 1500 }); } catch (e) {}
  await page.getByRole('button', { name: /START/ }).click();
  await page.waitForSelector('.game', { timeout: 10000 });
  await page.waitForSelector('.map-board', { timeout: 10000 });
}

async function main() {
  const server = await startServer();
  const port = server.address().port;
  const errors = [];
  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium' });
  const report = {};

  // ---------- MOBILE 390×844 ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console:' + m.text()); });
    page.on('pageerror', (e) => errors.push('pageerror:' + (e.message || e)));
    await installRoutes(page);
    await page.goto(`http://127.0.0.1:${port}/simulator/v0.5/`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => typeof window.reducer === 'function', { timeout: 20000 });
    await startSolo5x5(page);
    await page.waitForTimeout(600);
    await page.evaluate(() => window.scrollTo(0, 0));

    // (a) map visible with positive width
    const mapBox = await page.locator('.map-board').first().boundingBox();
    report.mapBox = mapBox;

    // no horizontal page overflow
    const hOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    report.horizontalOverflowPx = hOverflow;

    // .game is vertically stacked (single column)
    report.gameCols = await page.evaluate(() => getComputedStyle(document.querySelector('.game')).gridTemplateColumns);

    // panel stack order (top of each area's y)
    report.areaTops = await page.evaluate(() => {
      const y = (s) => { const e = document.querySelector(s); return e ? Math.round(e.getBoundingClientRect().top + window.scrollY) : null; };
      return { top: y('.top-bar'), center: y('.center-panel'), left: y('.left-panel'), right: y('.right-panel') };
    });

    const mobileShot = path.join(OUT, 'mobile-390-5x5.png');
    await page.screenshot({ path: mobileShot, fullPage: true });
    report.mobileShot = mobileShot;
    const mobileViewShot = path.join(OUT, 'mobile-390-5x5-viewport.png');
    await page.screenshot({ path: mobileViewShot, fullPage: false });
    report.mobileViewShot = mobileViewShot;

    // (b) phase-advance button ("거래 끝" / phase button) reachable
    // scroll center-panel actions into view and probe the phase-actions buttons
    const paButtons = page.locator('.phase-actions .pa-btn');
    const paCount = await paButtons.count();
    const paInfo = [];
    for (let i = 0; i < paCount; i++) {
      const b = paButtons.nth(i);
      paInfo.push({ text: (await b.innerText()).trim().replace(/\s+/g, ' '), visible: await b.isVisible(), enabled: await b.isEnabled() });
    }
    report.phaseActions = paInfo;

    // (c) buy/sell buttons — advance into the market phase where trade controls render.
    // Click the primary phase button up to a few times until 매수 appears.
    for (let i = 0; i < 5; i++) {
      if (await page.getByRole('button', { name: /매수/ }).count() > 0) break;
      const primary = page.locator('.phase-actions .pa-btn').first();
      if (await primary.isVisible() && await primary.isEnabled()) {
        await primary.scrollIntoViewIfNeeded();
        await primary.click();
        await page.waitForTimeout(500);
      } else break;
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    // "거래 끝" presence (market-phase advance button)
    const tradeEnd = page.getByRole('button', { name: /거래 끝/ });
    report.tradeEndCount = await tradeEnd.count();
    if (report.tradeEndCount > 0) {
      const t = tradeEnd.first();
      await t.scrollIntoViewIfNeeded();
      report.tradeEndSample = { visible: await t.isVisible(), enabled: await t.isEnabled(), box: await t.boundingBox() };
    }
    const marketShot = path.join(OUT, 'mobile-390-market.png');
    await page.screenshot({ path: marketShot, fullPage: true });
    report.marketShot = marketShot;

    // The right panel market list has 매수/매도 buttons; probe presence + tappability.
    const buyBtns = page.getByRole('button', { name: /매수/ });
    const sellBtns = page.getByRole('button', { name: /매도/ });
    report.buyCount = await buyBtns.count();
    report.sellCount = await sellBtns.count();
    // layout check: every buy/sell button visible and fully within the 390px viewport (no clipping)
    const VW = 390;
    const inBounds = (bx) => bx && bx.x >= -1 && (bx.x + bx.width) <= VW + 1;
    let buyAllInBounds = report.buyCount > 0, buyAnyEnabled = false, buyHeights = [];
    for (let i = 0; i < report.buyCount; i++) {
      const b = buyBtns.nth(i);
      const bx = await b.boundingBox();
      if (!(await b.isVisible()) || !inBounds(bx)) buyAllInBounds = false;
      if (await b.isEnabled()) buyAnyEnabled = true;
      if (bx) buyHeights.push(Math.round(bx.height));
    }
    report.buyAllInBounds = buyAllInBounds;
    report.buyAnyEnabled = buyAnyEnabled;
    report.buyHeights = buyHeights;
    report.buySample = { visible: await buyBtns.first().isVisible(), box: await buyBtns.first().boundingBox() };
    report.sellSample = report.sellCount > 0 ? { visible: await sellBtns.first().isVisible(), box: await sellBtns.first().boundingBox() } : null;
    // prove tappable: click an enabled buy button if the economy allows one
    if (buyAnyEnabled) {
      for (let i = 0; i < report.buyCount; i++) {
        const b = buyBtns.nth(i);
        if (await b.isEnabled()) { await b.scrollIntoViewIfNeeded(); await b.click(); report.buyClicked = true; break; }
      }
    }

    // map cell tappable (min tap target check on first real cell)
    const cellBox = await page.locator('.map-cell:not(.label):not(.corner)').first().boundingBox();
    report.cellBox = cellBox;

    await ctx.close();
  }

  // ---------- DESKTOP 1280×800 regression ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    await installRoutes(page);
    await page.goto(`http://127.0.0.1:${port}/simulator/v0.5/`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => typeof window.reducer === 'function', { timeout: 20000 });
    await startSolo5x5(page);
    await page.waitForTimeout(500);
    report.desktopCols = await page.evaluate(() => getComputedStyle(document.querySelector('.game')).gridTemplateColumns);
    const deskShot = path.join(OUT, 'desktop-1280-5x5.png');
    await page.screenshot({ path: deskShot, fullPage: false });
    report.desktopShot = deskShot;
    await ctx.close();
  }

  await browser.close();
  server.close();
  report.consoleErrors = errors;
  console.log(JSON.stringify(report, null, 2));

  // pass/fail summary
  const pass =
    report.mapBox && report.mapBox.width > 0 &&
    report.horizontalOverflowPx <= 2 &&
    report.gameCols && report.gameCols.trim().split(/\s+/).length === 1 &&
    report.phaseActions.some(b => b.visible && b.enabled) &&
    report.tradeEndCount > 0 && report.tradeEndSample && report.tradeEndSample.visible && report.tradeEndSample.enabled &&
    report.buyCount > 0 && report.buyAllInBounds && report.sellCount > 0 &&
    report.desktopCols && report.desktopCols.split(' ').length === 3 &&
    errors.length === 0;
  console.log('\nSINGLE-COLUMN(mobile):', report.gameCols.split(' ').length === 1);
  console.log('DESKTOP-3COL:', report.desktopCols.split(' ').length === 3);
  console.log('OVERALL PASS:', !!pass);
  process.exit(pass ? 0 : 2);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
