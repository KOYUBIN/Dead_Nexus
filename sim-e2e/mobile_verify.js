// Mobile-layout verification for DEAD NEXUS web simulator (v6.25 mobile fix).
// Serves repo root, intercepts CDN → local vendor, drives the setup UI to start a
// solo 5×5 game, then asserts core controls are reachable at 390×844 and captures
// screenshots (mobile + desktop 1280×800 regression).
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

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
  await page.locator('.step-next').click();
  await page.getByRole('button', { name: /5×5 튜토리얼/ }).click();
  await page.getByRole('checkbox').uncheck();
  await page.locator('.step-next').click();
  await page.locator('.setup .start-btn').click();
  await page.waitForSelector('.game', { timeout: 10000 });
  await page.waitForSelector('.map-board', { timeout: 10000 });
}


// Portal and setup regression suite. Use DN_BASE_URL to reuse a running preview.
// Optional CHROMIUM_PATH; otherwise use the locally installed Playwright browser.
async function verifyPortal(browser, base, errors) {
  let checks = 0;
  function check(condition, message) { assert.ok(condition, message); checks++; }
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  const external = [];
  page.on('pageerror', e => errors.push('portal:' + e.message));
  page.on('request', req => { if (/^https?:/.test(req.url()) && !req.url().startsWith(base)) external.push(req.url()); });
  await page.goto(base + '/');
  check(await page.title().then(t => t.includes('DEAD NEXUS')), 'Portal title');
  check(await page.locator('.tracks .card').count() === 3, 'Three working track links');
  for (const width of [320, 390, 768, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No portal overflow at ${width}`);
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: path.join(OUT, 'portal-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(OUT, 'portal-mobile.png'), fullPage: true });
  for (const mode of ['tutorial', 'multi', 'coop']) {
    await page.locator(`[data-launch="${mode}"]`).click();
    check(await page.locator('#launch-link').getAttribute('href') === `simulator/v0.5/index.html?mode=${mode}`, `Launcher ${mode} URL`);
    check(await page.locator(`[data-launch="${mode}"]`).getAttribute('aria-pressed') === 'true', `Launcher ${mode} selection`);
  }
  await page.locator('.faq summary').first().click();
  check(await page.locator('.faq details').first().getAttribute('open') !== null, 'FAQ expands');
  await page.locator('#motion-toggle').click();
  await page.reload();
  check(await page.locator('html').getAttribute('class').then(c => c.includes('motion-off')), 'Motion preference persists');
  await page.evaluate(() => localStorage.setItem('dead_nexus_rpg_save_v1', JSON.stringify({ missionsDone: ['ch01-first-blood'], endings: { seen: {} } })));
  const saved = await page.evaluate(() => localStorage.getItem('dead_nexus_rpg_save_v1'));
  await page.reload();
  check(await page.locator('#ob-title').innerText().then(t => t.includes('Insider Game')), 'Save-aware next chapter');
  check(await page.evaluate(() => localStorage.getItem('dead_nexus_rpg_save_v1')) === saved, 'Portal does not mutate RPG save');
  check(await page.locator('#prog-rpg').isVisible(), 'Saved progress shown');
  await page.evaluate(() => localStorage.setItem('dead_nexus_rpg_save_v1', '{broken'));
  await page.reload();
  check(await page.locator('#ob-kicker').innerText() === '처음이라면', 'Corrupt save falls back safely');
  check(await page.evaluate(() => localStorage.getItem('dead_nexus_rpg_save_v1')) === '{broken', 'Corrupt save not overwritten');
  await page.evaluate(() => localStorage.clear());
  // Actual UI launch, injected finished state, then actual retry button.
  for (const [mode, expected] of [['tutorial', { mode: 'solo', mapSize: '5x5', difficulty: 'easy', specific: 'BLADE' }], ['coop', { mode: 'coop', scenario: 'C01' }], ['multi', { mode: 'multi' }], ['unknown', { mode: 'solo', scenario: 'S01' }]]) {
    await page.goto(base + '/simulator/v0.5/index.html?mode=' + mode);
    await page.waitForSelector('.setup');
    check(await page.evaluate(() => !document.querySelector('.game')), `${mode}: no automatic start`);
    if (mode === 'coop') {
      const locked = page.getByRole('button', { name: /C03 정산일/ });
      check(await locked.getAttribute('aria-disabled') === 'true', 'C03 unlock respected');
      check(await locked.getAttribute('tabindex') === '-1', 'Locked scenario excluded from keyboard focus');
      await page.getByRole('button', { name: /C02 압류 집행/ }).focus();
      await page.keyboard.press('Enter');
      expected.scenario = 'C02';
      await page.screenshot({ path: path.join(OUT, 'setup-mobile.png'), fullPage: true });
    }
    await page.evaluate(() => {
      const build = window.buildInitial;
      window.buildInitial = function (opts) {
        window.__qaOptions = JSON.parse(JSON.stringify(opts));
        window.__qaInitial = build(opts);
        return window.__qaInitial;
      };
    });
    await page.locator('.step-next').click();
    if (mode === 'tutorial') await page.getByRole('checkbox').uncheck();
    if (mode === 'coop') {
      check(await page.locator('.class-grid').isVisible() === false, 'No unused solo class selector in co-op');
      await page.getByRole('button', { name: /인간 추가/ }).click();
      await page.getByLabel('P2 클래스 또는 블록').selectOption('CARBON');
    }
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${mode}: setup fits mobile`);
    await page.locator('.step-next').click();
    await page.locator('.setup .start-btn').click();
    await page.waitForSelector('.game');
    const before = await page.evaluate(() => window.__qaOptions);
    for (const [key, value] of Object.entries(expected)) check(before[key] === value, `${mode}: correct ${key}`);
    if (mode === 'coop') {
      check(before.humans.length === 2 && before.humans[1].specific === 'CARBON', 'Co-op human roster applied');
      check(await page.locator('.coop-objective-card').innerText().then(t => t.includes('사수 0/10R')), 'Co-op sidebar shows canonical team goal');
      check(await page.locator('.right-panel').innerText().then(t => !t.includes('승리 조건 (Ghost)')), 'Competitive goals hidden in co-op');
    }
    await page.evaluate(() => {
      const state = structuredClone(window.__qaInitial);
      state.meta.gameOver = true;
      state.meta.winner = -1;
      state.meta.winReason = 'Regression fixture';
      window.__dnInject(state);
    });
    await page.waitForSelector('.gameover');
    await page.getByRole('button', { name: '같은 설정으로 재도전' }).click();
    await page.waitForSelector('.game');
    check(JSON.stringify(await page.evaluate(() => window.__qaOptions)) === JSON.stringify(before), `${mode}: retry preserves entire configuration`);
    check(await page.evaluate(() => window.__qaInitial.meta.round === 1 && !window.__qaInitial.meta.gameOver), `${mode}: retry creates fresh game`);
    await page.evaluate(() => { const state=structuredClone(window.__qaInitial); state.meta.gameOver=true; state.meta.winner=-1; window.__dnInject(state); });
    await page.waitForSelector('.gameover');
    await page.getByRole('button', { name: /메뉴 & 히스토리/ }).click();
    await page.waitForSelector('.setup');
    await page.locator('.step-next').click();
    await page.locator('.step-next').click();
    check(await page.locator('.launch-summary').innerText().then(t => t.includes(before.scenario)), `${mode}: menu preserves scenario`);
  }
  // Switching from one-human co-op to hotseat must restore the two-human minimum.
  await page.goto(base + '/simulator/v0.5/index.html?mode=coop');
  await page.waitForSelector('.setup');
  await page.getByRole('button', { name: /핫시트 \(2~5인\)/ }).click();
  await page.locator('.step-next').click();
  check(await page.getByLabel('P2 역할').count() === 1, 'Co-op to hotseat restores minimum roster');
  await page.goto(base + '/rpg/index.html');
  await page.waitForFunction(() => (document.querySelector('#root')?.textContent || '').length > 100);
  check(await page.locator('#root').innerText().then(t => t.length > 100), 'RPG still boots');
  await page.goto(base + '/print-kit/index.html');
  check(await page.title().then(t => t.length > 0), 'Print kit still opens');
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href);
  check(await page.locator('.tracks .card').count() === 3, 'Offline file portal');
  await page.goto(pathToFileURL(path.join(ROOT, 'simulator/v0.5/index.html')).href + '?mode=coop');
  await page.waitForSelector('.setup');
  check(await page.getByRole('button', { name: /협동 \(INCURSION\)/ }).getAttribute('aria-pressed') === 'true', 'Offline file launch preset');
  check(external.length === 0, 'No external network asset requests');
  await ctx.close();
  const noJs = await browser.newContext({ javaScriptEnabled: false });
  const staticPage = await noJs.newPage();
  await staticPage.goto(base + '/');
  check(await staticPage.locator('#card-sim').getAttribute('href') === 'simulator/v0.5/index.html', 'No-JS game navigation');
  check(await staticPage.locator('[data-metric="rpg-missions"]').innerText() === '38', 'No-JS content metrics');
  await noJs.close();
  const reduced = await browser.newContext({ reducedMotion: 'reduce' });
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(base + '/');
  check(await reducedPage.locator('#motion-toggle').getAttribute('aria-pressed') === 'true', 'System reduced-motion respected');
  check(await reducedPage.locator('.map-pulse').evaluate(e => getComputedStyle(e).animationName) === 'none', 'Beacon stops under reduced-motion');
  await reduced.close();
  console.log('Portal / launch / retry checks passed:', checks);
  return checks;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const server = process.env.DN_BASE_URL ? null : await startServer();
  const base = (process.env.DN_BASE_URL || `http://127.0.0.1:${server.address().port}`).replace(/\/$/, '');
  const errors = [];
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const report = {};
  report.portalChecks = await verifyPortal(browser, base, errors);

  // ---------- MOBILE 390×844 ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console:' + m.text()); });
    page.on('pageerror', (e) => errors.push('pageerror:' + (e.message || e)));
    await installRoutes(page);
    await page.goto(`${base}/simulator/v0.5/`, { waitUntil: 'load', timeout: 30000 });
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
    await page.goto(`${base}/simulator/v0.5/`, { waitUntil: 'load', timeout: 30000 });
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
  if (server) server.close();
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
