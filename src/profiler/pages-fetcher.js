const { parallelizeObject } = require('./threads.js');

const fetchPages = ({
                      profiler,
                      browsersThreads,
                      config,
                      percentCost,
                      prepare = () => (data) => data,
                      checkStatus = async () => true
                    }) => {
  const { count, logger, progress } = config;
  let isRunning = checkStatus();

  const functions = config.pages.reduce((acc, page) => {
    const preparing = prepare(page.name);

    return ({
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

          const data = await profiler(
            browser.context,
            config,
            page
          );

          const pageEndTime = Date.now();

          await logger(`fetch page ${page.url} in ${Math.floor((pageEndTime - pageStartTime) / 1000)}s`);
          await progress(percentCost);

          return preparing(data);
        } catch (error) {
          await logger(`fetch failed: ${error.stack}`);
          await logger(`try to retry: ${page.url}`);

          throw error;
        }
      })
    })
  }, {});

  const runner = parallelizeObject(functions, browsersThreads, 5000, async (e) => {
    await logger(`error while fetching: ${e.stack}`);
  });

  return runner;
};

module.exports = {
  fetchPages
};
