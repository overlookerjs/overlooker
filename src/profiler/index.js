const puppeteer = require('puppeteer');
const { aggregateProfiles } = require('../aggregation');
const { parallelizeObject, makeInternalTest, isRelativeUrl, getHost, objMap, makeRule } = require('./../utils.js');
const { getAllStats } = require('../events');
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

const fetchPages = async ({
                            profiler,
                            pagesEntries,
                            browsersThreads,
                            config
                          }) => {
  const { count } = config;

  const functions = pagesEntries.reduce((acc, [pageName, host]) => ({
    ...acc,
    [pageName]: Array(count).fill(async (stop, browser) => {
      console.log(`start fetching: ${host}`);

      try {
        const pageStartTime = Date.now();

        const tracing = await profiler(
          browser.context,
          {
            url: host,
            ...config
          });

        const pageEndTime = Date.now();

        console.log(`fetch page ${host} in ${Math.floor((pageEndTime - pageStartTime) / 1000)}s`);

        return tracing;
      } catch (error) {
        console.log(`fetch failed: ${error}`);
        console.log(`try to retry: ${host}`);

        throw error;
      }
    })
  }), {});

  return await parallelizeObject(functions, browsersThreads, 5000);
};

const prepareConfig = ({
                         requests,
                         count,
                         threads,
                         platform,
                         ...rest
                       }) => ({
  requests: objMap(requests, makeRule),
  count: count || 5,
  threads: threads || 1,
  platform: platform || 'desktop',
  ...rest
});

/**
 * @param {Object} config.pages
 * @param {Object} [config]
 * @param {Object} [config.throttling]
 * @param {number} [config.throttling.cpu]
 * @param {string} [config.throttling.network]
 * @param {number} [config.count]
 * @param {number} [config.threads]
 * @param {string} [config.platform]
 * @param {string} [config.browserArgs]
 * @param {Object} [config.requests]
 * @param {string|RegExp|Function} [config.requests.ignore]
 * @param {string|RegExp|Function} [config.requests.merge]
 * @param {string|RegExp|Function} [config.requests.internalTest]
 * */

const profile = async (config) => {
  const { pages, threads } = prepareConfig(config);

  const pagesEntries = Object.entries(pages);

  if (!pagesEntries.length) {
    console.log('Nothing to profile');
    return;
  }

  let browsers;
  let browsersThreads;
  let res;

  try {
    console.log(`opening browsers`);

    browsers = await Promise.all(Array(threads).fill(null).map(() => getContext(config.browserArgs)));
    browsersThreads = browsers.map((browser) => (fn) => fn(browser));

    console.log('browsers are open');
  } catch (e) {
    console.log('error while opening browsers', e.stack);

    return {};
  }

  try {
    res = await fetchPages({
      profiler: profileUrl,
      config,
      pagesEntries,
      browsersThreads,
    });

    console.log(`fetching done!`);
  } catch (e) {
    console.log(`cannot fetch pages!`, e.stack);
  }

  if (browsers) {
    await Promise.all(browsers.map(({ close }) => close()));
  }

  console.log('request build data');

  let buildData;

  if (config.buildDataUrl) {
    try {
      const { data } = await (
        isRelativeUrl(config.buildDataUrl) ? (
          fetch(config.buildDataUrl)
        ) : (
          fetch(getHost(Object.values(pages)[0]) + config.buildDataUrl)
        )
      );

      buildData = data;
    } catch (e) {
      console.log('cannot receive build data', e);
    }
  }

  return Object.entries(res)
    .reduce((acc, [pageName, pageData]) => {
      const isInternal = config.requests && config.request.internalTest ? (
        makeInternalTest(pages[pageName])
      ) : (
        config.request.internalTest
      );

      acc[pageName] = aggregateProfiles(
        pageData.map((tracing) => getAllStats(tracing, isInternal)),
        buildData,
        config.requests ? config.requests.merge : null
      );

      return acc;
    }, {});
};

module.exports = {
  profile
};
