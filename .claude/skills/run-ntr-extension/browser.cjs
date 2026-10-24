// Loading and starting Playwright's browser, shared by driver.cjs and scenarios.cjs (bench.cjs stays on Chromium).
// NTR_BROWSER picks the browser: chromium (default), firefox or webkit (Safari's engine).
// NTR_PHONE=1 (or landscape) makes the page a phone; bench.cjs uses the same phone through its own option.
const path = require('path');

const BROWSER = process.env.NTR_BROWSER || 'chromium';
const PHONE = process.env.NTR_PHONE || '';
const MODE = !PHONE ? 'desktop' : PHONE === 'landscape' ? 'phone landscape' : 'phone';

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

async function launch() {
  if (!['chromium', 'firefox', 'webkit'].includes(BROWSER)) { console.error(`NTR_BROWSER must be chromium, firefox or webkit, not ${BROWSER}`); process.exit(2); }
  if (!['', '1', 'landscape'].includes(PHONE)) { console.error(`NTR_PHONE must be 1 or landscape, not ${PHONE}`); process.exit(2); }
  const pw = loadPlaywright();
  try {
    return await pw[BROWSER].launch(BROWSER === 'chromium' ? { args: ['--no-sandbox'] } : {});
  } catch (e) {
    console.error(`${BROWSER} didn't start. The session start hook downloads Firefox and WebKit (log: /tmp/ntr-browsers.log).\n${e.message}`);
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

module.exports = { launch, contextOptions, MODE };
