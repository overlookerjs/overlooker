const puppeteer = require('puppeteer');
const networkPresets = require('../network-presets.js');
const devices = require('puppeteer/DeviceDescriptors');
const cache = require('./cache.js');
const { getPaintEventsBySelector } = require('./hero-elements.js');
const { watch } = require('./watching.js');
const { ACTION_START, ACTION_END } = require('./../constants.js');
const { make } = require('./../objects-utils.js');

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
    defaultViewport: viewports[config.platform],
    headless: !config.debug,
    handleSIGINT: config.gracefulShutdown
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

const setupPageConfig = async (context, page, client, config, pageConfig) => {
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

  if (config.cookies || pageConfig.cookies) {
    const cookies = []
      .concat(config.cookies || [])
      .concat(pageConfig.cookies || []);

    if (cookies && cookies.length) {
      await Promise.all(cookies.map((cookie) => client.send('Network.setCookie', cookie)));
    }
  }

  if (config.requests) {
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
              await config.logger(e.stack);
            }
          }
        }
      });
    }
  }
};

const profileActions = async (page, config, pageConfig, client) => {
  const res = {};
  const { logger } = config;
  const pages = make(config.pages.map(({ name, url }) => [name, url]));

  if (pageConfig.actions && pageConfig.actions.length) {
    for (const { name, action } of pageConfig.actions) {
      await logger(`action "${name}" started`);

      const getWatchingResult = await watch(page, client);

      /* istanbul ignore next */
      await page.evaluate((as) => window.performance.mark(as), ACTION_START);
      await action(page, pages);
      /* istanbul ignore next */
      await page.evaluate((ae) => window.performance.mark(ae), ACTION_END);

      res[name] = await getWatchingResult();

      await logger(`action "${name}" completed`);
    }
  }

  return res;
};

const profileUrl = async (context, config, pageConfig) => {
  const { url, heroElement } = pageConfig;

  const page = await context.newPage();

  try {
    const client = await page.target().createCDPSession();

    await client.send('Network.clearBrowserCache');
    await client.send('Network.clearBrowserCookies');

    await setupPageConfig(context, page, client, config, pageConfig);

    const getWatchingResult = await watch(page, client);

    await page.goto(url, { timeout: 60000, waitUntil: ["load", "networkidle2"] });

    const watchingResult = await getWatchingResult();

    const heroElementPaints = await getPaintEventsBySelector(client, watchingResult.tracing, heroElement);

    const actions = await profileActions(page, config, pageConfig);

    await page.close();

    return {
      ...watchingResult,
      actions,
      heroElementPaints
    };
  } catch (error) {
    await page.close();

    throw error;
  }
};

module.exports = {
  getContext,
  profileUrl
};
