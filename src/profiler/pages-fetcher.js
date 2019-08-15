const { parallelizeObject } = require('./threads.js');

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

        const data = await profiler(
          browser.context,
          {
            url: host,
            actions: config.actions && config.actions[pageName] ? config.actions[pageName] : null,
            ...config
          });

        const pageEndTime = Date.now();

        console.log(`fetch page ${host} in ${Math.floor((pageEndTime - pageStartTime) / 1000)}s`);

        return data;
      } catch (error) {
        console.log(`fetch failed: ${error}`);
        console.log(`try to retry: ${host}`);

        throw error;
      }
    })
  }), {});

  return await parallelizeObject(functions, browsersThreads, 5000);
};

module.exports = {
  fetchPages
};
