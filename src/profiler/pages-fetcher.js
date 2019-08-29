const { parallelizeObject } = require('./threads.js');

const fetchPages = async ({
                            profiler,
                            browsersThreads,
                            config
                          }) => {
  const { count } = config;

  const functions = config.pages.reduce((acc, { url, name, actions, heroElement }) => ({
    ...acc,
    [name]: Array(count).fill(async (stop, browser) => {
      console.log(`start fetching: ${url}`);

      try {
        const pageStartTime = Date.now();

        const data = await profiler(
          browser.context,
          {
            ...config,
            url,
            heroElement,
            actions
          });

        const pageEndTime = Date.now();

        console.log(`fetch page ${url} in ${Math.floor((pageEndTime - pageStartTime) / 1000)}s`);

        return data;
      } catch (error) {
        console.log(`fetch failed: ${error}`);
        console.log(`try to retry: ${url}`);

        throw error;
      }
    })
  }), {});

  return await parallelizeObject(functions, browsersThreads, 5000);
};

module.exports = {
  fetchPages
};
