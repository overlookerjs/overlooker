const networkPresets = require('../network-presets.js');
const {
  injectElementTimingObserver,
  getElementsTimings,
  injectElementTimingHandler,
  getPaintEventsBySelectors,
  waitForElementTiming
} = require('./hero-elements.js');
const { injectLongTasksObserver, getTti } = require('./tti.js');
const { watch } = require('./watching.js');
const { ACTION_START, ACTION_END } = require('./../constants.js');
const { make } = require('./../objects-utils.js');
const { devices, viewports } = require('./viewports.js');
const { RequestsTracker } = require('./requests-tracker.js');

const setupPageConfig = async (context, page, client, config, pageConfig) => {
  const { logger, throttling } = config;

  if (config.platform === 'mobile') {
    await page.emulate(devices.mobile);
  } else {
    await page.setViewport(viewports.desktop);
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

      try {
        await interceptedRequest.continue();
      } catch (e) {
        logger(e.stack);
      }
    });
  }
};

const profileActions = async (page, client, config, pageConfig) => {
  const res = {};
  const { logger } = config;
  const pages = make(config.pages.map(({ name, url }) => [name, url]));

  if (pageConfig.actions && pageConfig.actions.length) {
    for (const { name, action, layers } of pageConfig.actions) {
      await logger(`action "${name}" started`);

      const getWatchingResult = await watch(page);

      /* istanbul ignore next */
      await page.evaluate((as) => window.performance.mark(as), ACTION_START);
      await action(page, pages, {
        waitForElementTiming
      });
      /* istanbul ignore next */
      await page.evaluate((ae) => window.performance.mark(ae), ACTION_END);

      const content = await page.content();

      const watchingResult = await getWatchingResult();

      const layersPaints = await getPaintEventsBySelectors(client, watchingResult.tracing, layers);
      const elementsTimings = await getElementsTimings(page);

      res[name] = {
        ...watchingResult,
        elementsTimings,
        layersPaints,
        content
      };

      await logger(`action "${name}" completed`);
    }
  }

  return res;
};

const loadPage = async (context, config, pageConfig) => {
  const { url, layers } = pageConfig;

  const page = await context.newPage();

  try {
    const client = await page.target().createCDPSession();

    await client.send('Network.clearBrowserCache');
    await client.send('Network.clearBrowserCookies');

    await setupPageConfig(context, page, client, config, pageConfig);

    const getWatchingResult = await watch(page, client);

    await injectLongTasksObserver(page);
    await injectElementTimingObserver(page);

    const tracker = new RequestsTracker();
    tracker.init(page);

    await page.goto(url, { timeout: 60000, waitUntil: ['load', 'networkidle2'] }).catch((e) => {
      const { failed, inflight } = tracker.getRequests();

      tracker.dispose(page);

      throw new Error(`${e.message}\n\nInflight requests:\n${inflight.join('\n')}\n\nFailed requests:\n${failed.join('\n')}`);
    });

    tracker.dispose(page);

    const watchingResult = await getWatchingResult();
    const timeToInteractive = await getTti(page, config.logger, config.firstEvent);

    const content = await page.content();

    const layersPaints = await getPaintEventsBySelectors(client, watchingResult.tracing, layers);

    await injectElementTimingHandler(page);
    const elementsTimings = await getElementsTimings(page);

    const actions = await profileActions(page, client, config, pageConfig);

    await page.close();

    return {
      ...watchingResult,
      content,
      actions,
      timeToInteractive,
      layersPaints,
      elementsTimings
    };
  } catch (error) {
    await page.close();

    throw error;
  }
};

module.exports = {
  loadPage
};
