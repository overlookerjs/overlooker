const puppeteer = require('puppeteer');
const networkPresets = require('./network-presets.js');
const devices = require('puppeteer/DeviceDescriptors');
const fs = require('fs');
const path = require('path');

const IS_DEBUG = process.argv.some((arg) => arg === '--debug');

const pixel2 = devices['Pixel 2'];

const getContext = async (additionArgs = []) => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'].concat(additionArgs),
    ignoreHTTPSErrors: true
  });

  const context = await browser.createIncognitoBrowserContext();

  return {
    context,
    close: async () => {
      await context.close();
      await browser.close();
    }
  };
};

const setupPageConfig = async (page, client, config) => {
  if (config.platform && config.platform === 'mobile') {
    await page.emulate(pixel2);
  } else {
    await page.setViewport({ width: 1366, height: 768 });
  }

  if (config.throttling) {
    if (config.throttling.network) {
      await client.send('Network.emulateNetworkConditions', networkPresets[config.throttling.network]);
    }

    if (config.throttling.cpu) {
      await client.send('Emulation.setCPUThrottlingRate', { rate: config.throttling.cpu });
    }
  }

  if (config.requests && config.requests.ignore) {
    await page.setRequestInterception(true);

    page.on('request', (interceptedRequest) => {
      const url = interceptedRequest.url();

      if (config.requests.ignore(url)) {
        interceptedRequest.abort();
        return;
      }

      interceptedRequest.continue();
    });
  }
};

const profileUrl = async (context, config) => {
  const { url } = config;

  const page = await context.newPage();

  const client = await page.target().createCDPSession();

  await client.send('Network.clearBrowserCache');
  await client.send('Network.clearBrowserCookies');

  await setupPageConfig(page, client, config);

  await page.tracing.start({
    categories: [
      '-*',
      'blink.user_timing',
      'blink.user_timing,rail',
      'devtools.timeline',
      'loading,rail,devtools.timeline'
    ]
  });

  try {
    await page.goto(url, { timeout: 60000, waitUntil: ["load"] });

    const tracing = JSON.parse((await page.tracing.stop()).toString());

    if (IS_DEBUG) {
      fs.writeFileSync(path.resolve(__dirname, './tracing.json'), JSON.stringify(tracing));
    }

    await page.close();

    return tracing.traceEvents;
  } catch (e) {
    console.error(`Cannot get page ${url}:`, e);
  }

  await close();

  return null;
};

module.exports = {
  getContext,
  profileUrl
};
