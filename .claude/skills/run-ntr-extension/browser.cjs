// Code that driver.cjs and bench.cjs both need goes here.
// NTR_BROWSER picks the driver's browser: chromium (default), firefox or webkit (Safari's engine); bench.cjs stays on
// Chromium.
// NTR_PHONE=1 (or landscape) makes the page a phone; bench.cjs uses the same phone through its own option.
const path = require('path');

const BROWSER = process.env.NTR_BROWSER || 'chromium';
const PHONE = process.env.NTR_PHONE || '';
const MODE = !PHONE ? 'desktop' : PHONE === 'landscape' ? 'phone landscape' : 'phone';
const ST_URL = process.env.ST_URL || 'http://127.0.0.1:8000/';
// Without internet, SillyTavern's own AI Horde lookup fails with these; they aren't the extension's. A failed load
// only counts as noise by its address, so a missing NTR image still shows up. Firefox and WebKit word the Horde error
// differently, so theirs is told apart by horde.js in its stack. WebKit also warns about SillyTavern's viewport tag.
const NOISE = /Internal S.*not valid JSON|\(horde\.js\)$|\/api\/horde\/|favicon|Viewport argument key "interactive-widget"/i;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadPlaywright() {
  try { return require('playwright'); } catch (e) { /* try the global install below */ }
  try {
    const root = require('child_process').execSync('npm root -g').toString().trim();
    return require(path.join(root, 'playwright'));
  } catch (e) {
    console.error('Playwright (with Chromium) is needed and wasn\'t found.');
    process.exit(2);
  }
}

async function launch(name = BROWSER) {
  if (!['chromium', 'firefox', 'webkit'].includes(name)) { console.error(`NTR_BROWSER must be chromium, firefox or webkit, not ${name}`); process.exit(2); }
  if (!['', '1', 'landscape'].includes(PHONE)) { console.error(`NTR_PHONE must be 1 or landscape, not ${PHONE}`); process.exit(2); }
  const pw = loadPlaywright();
  try {
    return await pw[name].launch(name === 'chromium' ? { args: ['--no-sandbox'] } : {});
  } catch (e) {
    console.error(`${name} didn't start. Firefox and WebKit come from 'st.sh browsers'.\n${e.message}`);
    process.exit(2);
  }
}

// The page's screen. A phone is 390x844 by touch (844x390 sideways), and says it's a phone, because SillyTavern tells
// phones apart by their user agent: an iPhone in WebKit, Android in Chromium and Firefox.
function contextOptions(browser, mode = MODE) {
  if (mode === 'desktop') return { viewport: { width: 1400, height: 1000 } };
  const devices = loadPlaywright().devices;
  const name = browser.browserType().name();
  const v = browser.version().split('.')[0];
  const userAgent = name === 'webkit' ? devices['iPhone 13'].userAgent
    : name === 'firefox' ? `Mozilla/5.0 (Android 14; Mobile; rv:${v}.0) Gecko/${v}.0 Firefox/${v}.0`
      : devices['Pixel 7'].userAgent;
  const viewport = mode === 'phone landscape' ? { width: 844, height: 390 } : { width: 390, height: 844 };
  return { viewport, userAgent, isMobile: true, hasTouch: true, deviceScaleFactor: 2 };
}

// Keeps NOISE matches; callers filter them. Browser dialogs are accepted.
function watchPage(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + (/\/horde\.js:/.test(e.stack || '') ? ' (horde.js)' : '')));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    // "Failed to load resource" doesn't say which one; the address comes with the message.
    const url = m.text().startsWith('Failed to load resource') ? m.location()?.url : '';
    errors.push('console: ' + m.text() + (url ? ' (' + url + ')' : ''));
  });
  page.on('dialog', (d) => d.accept());
  return errors;
}

async function openST(page, timeout = 60000) {
  await page.goto(ST_URL);
  await page.waitForFunction(() => window.SillyTavern?.getContext && SillyTavern.getContext().characters.length > 0, null, { timeout });
}

module.exports = { launch, contextOptions, MODE, ST_URL, NOISE, sleep, watchPage, openST };
