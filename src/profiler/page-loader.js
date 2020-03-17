const networkPresets = require('../network-presets.js');
const cache = require('./cache.js');
const { getPaintEventsBySelectors } = require('./hero-elements.js');
const { injectLongTasksObserver, getTti } = require('./tti.js');
const { watch } = require('./watching.js');
const { ACTION_START, ACTION_END } = require('./../constants.js');
const { make } = require('./../objects-utils.js');
const devices = require('puppeteer/DeviceDescriptors');
const pixel2 = devices['Pixel 2'];

const setupPageConfig = async (context, page, client, config, pageConfig) => {
  const { logger, throttling } = config;

  if (config.platform === 'mobile') {
    await page.emulate(pixel2);
  } else {
    await page.setViewport({ width: 1366, height: 768 });
  }

  if (throttling) {
    if (throttling.network) {
      await client.send('Network.emulateNetworkConditions', networkPresets[throttling.network]);
    }

    if (throttling.cpu) {
      await client.send('Emulation.setCPUThrottlingRate', { rate: throttling.cpu });
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
    page.on('request', async (interceptedRequest) => {
      const url = interceptedRequest.url();

      if (config.requests.ignore && config.requests.ignore(url)) {
        try {
          await interceptedRequest.abort();
        } catch (e) {
          logger(e.stack);
        }

        return;
      }

      if (config.proxy && interceptedRequest.method() === 'POST') {
        const postData = interceptedRequest.postData();

        const cachedObject = cache.get(url + postData);

        if (cachedObject) {
          setTimeout(async () => {
            try {
              await interceptedRequest.respond(cachedObject);
            } catch (e) {
              logger(e.stack);
            }
          }, 500);

          return;
        }
      }

      try {
        await interceptedRequest.continue();
      } catch (e) {
        logger(e.stack);
      }
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
              await logger(e.stack);
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

      const content = await page.content();

      res[name] = {
        ...await getWatchingResult(),
        content
      };

      await logger(`action "${name}" completed`);
    }
  }

  return res;
};

const loadPage = async (context, config, pageConfig) => {
  const { url, heroElements } = pageConfig;

  const page = await context.newPage();

  try {
    const client = await page.target().createCDPSession();

    await client.send('Network.clearBrowserCache');
    await client.send('Network.clearBrowserCookies');

    await setupPageConfig(context, page, client, config, pageConfig);

    const getWatchingResult = await watch(page, client);

    await injectLongTasksObserver(page);
    await page.goto(url, { timeout: 60000, waitUntil: ["load", "networkidle2"] });

    const watchingResult = await getWatchingResult();
    const content = await page.content();

    const heroElementsPaints = await getPaintEventsBySelectors(client, watchingResult.tracing, heroElements);

    const timeToInteractive = await getTti(page, config.logger);
    
    const actions = await profileActions(page, config, pageConfig);

    
    await page.close();

    return {
      ...watchingResult,
      content,
      actions,
      heroElementsPaints,
      timeToInteractive
    };
  } catch (error) {
    await page.close();

    throw error;
  }
};

module.exports = {
  loadPage
};
