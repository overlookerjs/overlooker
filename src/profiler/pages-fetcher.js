const { parallelizeObject } = require('./threads.js');

const fetchPages = async ({
                            profiler,
                            browsersThreads,
                            config
                          }) => {
  const { count, logger } = config;

  const functions = config.pages.reduce((acc, page) => ({
    ...acc,
    [page.name]: Array(count).fill(async (stop, browser) => {
      await logger(`start fetching: ${page.url}`);

      try {
        const pageStartTime = Date.now();

        const data = await profiler(
          browser.context,
          config,
          page
        );

        const pageEndTime = Date.now();

        await logger(`fetch page ${page.url} in ${Math.floor((pageEndTime - pageStartTime) / 1000)}s`);

        return data;
      } catch (error) {
        await logger(`fetch failed: ${error}`);
        await logger(`try to retry: ${page.url}`);

        throw error;
      }
    })
  }), {});

  return await parallelizeObject(functions, browsersThreads, 5000);
};

module.exports = {
  fetchPages
};
