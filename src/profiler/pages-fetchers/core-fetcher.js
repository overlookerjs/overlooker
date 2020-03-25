const { loadPage } = require('../page-loader.js');
const { parallelizeObject } = require('../threads.js');
const browsers = require('./../browsers.js');

const fetchPages = async ({
                      config,
                      percentCost,
                      prepare = (data) => data,
                      checkStatus = async () => true
                    }) => {
  const { count, logger, progress, pages } = config;
  let isRunning = checkStatus();

  const openedBrowsers = await browsers.open(config);
  const wrappedBrowsers = browsers.wrap(openedBrowsers);

  const functions = pages.reduce((acc, page) => ({
    ...acc,
    [page.name]: Array(count).fill(async (stop, browser) => {
      const nowRunning = await checkStatus();

      if (nowRunning !== isRunning && !nowRunning) {
        isRunning = nowRunning;
        await runner.stop();
        await logger(`fetching stopped`);
      }

      await logger(`start fetching: ${page.url}`);

      try {
        const pageStartTime = Date.now();

        const data = await loadPage(
          browser.context,
          config,
          page
        );

        const pageEndTime = Date.now();

        await logger(`fetch page ${page.url} in ${Math.floor((pageEndTime - pageStartTime) / 1000)}s`);
        await progress(percentCost);

        return await prepare(data);
      } catch (error) {
        await logger(`fetch failed: ${error.stack}`);
        await logger(`try to retry: ${page.url}`);

        throw error;
      }
    })
  }), {});

  const runner = parallelizeObject(functions, wrappedBrowsers, 5000, async (e) => {
    await logger(`error while fetching: ${e.stack}`);
  });

  const data = await runner;

  await browsers.close(openedBrowsers);

  return data;
};

module.exports = {
  fetchPages
};
