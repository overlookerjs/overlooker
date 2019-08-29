const puppeteer = require('puppeteer');
const networkPresets = require('./network-presets.js');
const devices = require('puppeteer/DeviceDescriptors');
const cache = require('./cache.js');
const fs = require('fs');
const path = require('path');
const { getPaintEventsBySelector } = require('./hero-elements.js');

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
      .concat(config.browserArgs)
      .concat(config.proxy && config.proxy.address ? `--proxy-server=${config.proxy.address}` : []),
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

  if (config.cookies) {
    await page.setCookie(config.cookies);
  }

  if (config.requests) {
    await page.setRequestInterception(true);

    page.on('request', (interceptedRequest) => {
      const url = interceptedRequest.url();

      if (config.requests.ignore && config.requests.ignore(url)) {
        interceptedRequest.abort();
        return;
      }

      if (config.proxy && interceptedRequest.method() === 'POST') {
        const postData = interceptedRequest.postData();

        const cachedObject = cache.get(url + postData);

        if (cachedObject) {
          setTimeout(() => {
            interceptedRequest.respond(cachedObject);
          }, 500);

          return;
        }
      }

      interceptedRequest.continue();
    });

    if (config.proxy) {
      page.on('requestfinished', async (interceptedRequest) => {
        if (interceptedRequest.method() === 'POST') {
          const resourceUrl = interceptedRequest.url();
          const postData = interceptedRequest.postData();
          const key = resourceUrl + postData;

          const cachedObject = cache.has(key);

          if (!cachedObject) {
            try {
              const response = interceptedRequest.response();

              const body = await response.text();
              const headers = response.headers();
              const status = response.status();

              const data = {
                body,
                headers,
                status,
                contentType: headers['content-type']
              };

              cache.set(key, data);
            } catch (e) {
              console.log(e);
            }
          }
        }
      });
    }
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

  if (config.actions && config.actions.length) {
    for (const { name, action } of config.actions) {
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
  const { url, heroElement } = config;

  const page = await context.newPage();

  const client = await page.target().createCDPSession();

  await client.send('Network.clearBrowserCache');
  await client.send('Network.clearBrowserCookies');

  await setupPageConfig(context, page, client, config);

  const getTracing = await writeTracing(page);

  try {
    await page.goto(url, { timeout: 60000, waitUntil: ["load"] });

    const main = await getTracing();

    const heroElementPaints = await getPaintEventsBySelector(client, main, heroElement);

    const actions = await profileActions(page, config);

    await page.close();

    return {
      main,
      actions,
      heroElementPaints
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
