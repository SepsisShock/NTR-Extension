// Loading and starting Playwright's browser, shared by driver.cjs and scenarios.cjs (bench.cjs stays on Chromium).
// NTR_BROWSER picks the browser: chromium (default), firefox or webkit (Safari's engine).
const path = require('path');

const BROWSER = process.env.NTR_BROWSER || 'chromium';

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
  const pw = loadPlaywright();
  try {
    return await pw[BROWSER].launch(BROWSER === 'chromium' ? { args: ['--no-sandbox'] } : {});
  } catch (e) {
    console.error(`${BROWSER} didn't start. The session start hook downloads Firefox and WebKit (log: /tmp/ntr-browsers.log).\n${e.message}`);
    process.exit(2);
  }
}

module.exports = { launch };
