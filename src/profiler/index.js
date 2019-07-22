const puppeteer = require('puppeteer');
const { parallelizeObject } = require('./../utils.js');

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

const profileUrl = async (context, { url }) => {
  const page = await context.newPage();

  const client = await page.target().createCDPSession();

  await client.send('Network.clearBrowserCache');
  await client.send('Network.clearBrowserCookies');
  await client.send('Performance.enable');
  await client.send('Profiler.enable');

  await page.setViewport({ width: 1280, height: 720 });
  await page.tracing.start({});

  try {
    await page.goto(url, { timeout: 60000, waitUntil: ["load"] });

    const traceData = JSON.parse((await page.tracing.stop()).toString());

    await page.close();

    return traceData;
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
  const functions = pagesEntries.reduce((acc, [pageName, host]) => ({
    ...acc,
    [pageName]: Array(count).fill(async (stop, browser) => {
      console.log(`start fetching: ${host}`, { [host]: 0 });

      try {
        const pageStartTime = Date.now();

        const stats = await profiler(
          browser.context,
          {
            url: host,
            ...config
          });

        const pageEndTime = Date.now();

        console.log(`fetch page ${host} in ${Math.floor((pageEndTime - pageStartTime) / 1000)}s`);

        return stats;
      } catch (error) {
        console.log(`fetch failed: ${error}`);
        console.log(`try to retry: ${host}`);

        throw error;
      }
    })
  }), {});

  return await parallelizeObject(functions, browsersThreads, 5000);
};

const runner = async (config) => {
  const { pages, count, threads, platform = 'desktop' } = config;

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
    console.log('error while opening browsers');
    console.log(e.stack);

    return null;
  }

  try {
    const res = await fetchPages({
      profiler: profileUrl,
      config,
      pagesEntries,
      browsersThreads,
    });

    console.log(`fetching done!`, {}, 1);

    return res;
  } catch (e) {
    console.log(`cannot fetch pages!`);
    console.log(e.stack);
  }

  if (browsers) {
    await Promise.all(browsers.map(({ close }) => close()));
  }

  return res;
};

module.exports = {
  runner
};
