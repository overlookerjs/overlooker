const puppeteer = require('puppeteer');
const networkPresets = require('./network-presets.js');
const devices = require('puppeteer/DeviceDescriptors');

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
      await client.send('Network.emulateNetworkConditions', networkPresets[config.network]);
    }

    if (config.throttling.cpu) {
      await client.send('Emulation.setCPUThrottlingRate', { rate: config.cpu });
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
  await client.send('Performance.enable');

  await setupPageConfig(page, client, config);

  await page.tracing.start({});

  try {
    await page.goto(url, { timeout: 60000, waitUntil: ["load"] });

    const { traceEvents } = JSON.parse((await page.tracing.stop()).toString());

    await page.close();

    return traceEvents;
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
