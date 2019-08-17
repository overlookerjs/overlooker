const puppeteer = require('puppeteer');
const networkPresets = require('./network-presets.js');
const devices = require('puppeteer/DeviceDescriptors');
const fs = require('fs');
const path = require('path');

const IS_DEBUG = process.argv.some((arg) => arg === '--debug');

const pixel2 = devices['Pixel 2'];

const viewports = {
  mobile: pixel2.viewport,
  desktop: {
    width: 1366,
    height: 768
  }
};

const getContext = async (config) => {
  const browser = await puppeteer.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--ignore-urlfetcher-cert-requests'
    ]
      .concat(config.browserArgs),
    ignoreHTTPSErrors: true,
    defaultViewport: viewports[config.platform]
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

const setupPageConfig = async (context, page, client, config) => {
  if (config.platform === 'mobile') {
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

  if (config.requests.ignore) {
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

const writeTracing = async (page) => {
  await page.tracing.start({
    categories: [
      '-*',
      'blink.user_timing',
      'blink.user_timing,rail',
      'devtools.timeline',
      'loading,rail,devtools.timeline',
      'disabled-by-default-devtools.screenshot'
    ]
  });

  return async () => {
    const tracing = JSON.parse((await page.tracing.stop()).toString());

    if (IS_DEBUG) {
      fs.writeFileSync(path.resolve(__dirname, './tracing.json'), JSON.stringify(tracing));
    }

    return tracing.traceEvents;
  }
};

const profileActions = async (page, config) => {
  const res = {};

  if (config.actions && Object.keys(config.actions)) {
    const actionsEntries = Object.entries(config.actions);

    for (const [name, action] of actionsEntries) {
      console.log(`action "${name}" started`);

      const getTracing = await writeTracing(page);

      await page.evaluate(() => window.performance.mark(`action_start`));
      await action(page);
      await page.evaluate(() => window.performance.mark(`action_end`));

      res[name] = await getTracing();

      console.log(`action "${name}" completed`);
    }
  }

  return res;
};

const profileUrl = async (context, config) => {
  const { url } = config;

  const page = await context.newPage();

  const client = await page.target().createCDPSession();

  await client.send('Network.clearBrowserCache');
  await client.send('Network.clearBrowserCookies');

  await setupPageConfig(context, page, client, config);

  const getTracing = await writeTracing(page);

  try {
    await page.goto(url, { timeout: 60000, waitUntil: ["load"] });

    const main = await getTracing();

    const actions = await profileActions(page, config);

    await page.close();

    return {
      main,
      actions
    };
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
