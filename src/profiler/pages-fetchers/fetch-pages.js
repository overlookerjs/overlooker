const { makeFetchPageWorkersPool } = require('./fetch-page-workers-pool.js');
const { make } = require('./../../objects-utils.js');
const messages = require('./worker-messages.js');

const serializePages = (pages) => (
  pages
    .map(({ actions, ...rest }, index) => ({
      ...rest,
      index,
      actions: actions && actions
        .map(({ action, ...rest }) => ({
          action: action.toString(),
          ...rest
        }))
    }))
)

const cleanConfig = (config) => ({
  ...config,
  pages: serializePages(config.pages),
  cache: config.cache ? ({
    type: config.cache.type,
    host: config.cache.host,
    postDataHandler: config.cache.postDataHandler && config.cache.postDataHandler.toString(),
    responseDataHandler: config.cache.responseDataHandler && config.cache.responseDataHandler.toString()
  }) : config.cache,
  logger: null,
  progress: null,
  checkStatus: null,
  buildData: null
})

const runFetchPagesQueue = async ({ workers, pages, count, checkStatus, logger, dataCb }) => {
  return new Promise((resolve, reject) => {
    let queue = Array(pages.length * count)
      .fill(null)
      .map((a, index) => index % pages.length);
    let expectedResultsCount = queue.length;
    const pagesWithError = new Set();
    const pagesAttempts = make(pages.map(({ name }) => [name, 15]));

    if (!queue.length) {
      reject(new Error('Noting to profile'));
    }

    workers.forEach((worker) => {
      let attemptTimeout = 5000;

      if (queue.length) {
        worker.postMessage({
          type: messages.LOAD_PAGE_START,
          payload: pages[queue.shift()]
        });
      }

      worker.on('message', async ({ type, payload }) => {
        if (type === messages.LOAD_PAGE_COMPLETE) {
          if (queue.length && await checkStatus()) {
            worker.postMessage({
              type: messages.LOAD_PAGE_START,
              payload: pages[queue.shift()]
            });
          }

          expectedResultsCount--;

          await dataCb(payload);

          if (!expectedResultsCount || !(await checkStatus())) {
            resolve();
          }
        } else if (type === messages.LOAD_PAGE_ERROR) {
          if (pagesAttempts[payload.page.name] > 0) {
            if (await checkStatus()) {
              pagesAttempts[payload.page.name] -= 1;

              await logger(`try to retry: ${payload.page.url}`);

              setTimeout(() => {
                worker.postMessage({
                  type: messages.LOAD_PAGE_START,
                  payload: payload.page
                });
              }, attemptTimeout);
            } else {
              resolve();
            }
          } else {
            const newQueue = queue.filter((index) => payload.page.index !== index);
            const delta = queue.length - newQueue.length;

            pagesWithError.add(payload.page.name);

            queue = newQueue;
            expectedResultsCount -= delta + 1;

            if (!expectedResultsCount || !(await checkStatus())) {
              await logger(`Attempts limit reached for page: ${payload.page.name} - ${payload.page.url}`);

              const pagesWithErrorArray = [...pagesWithError];

              if (pagesWithErrorArray.length === pages.length) {
                reject(new Error(`All pages in profile reached attempts limit: ${pagesWithErrorArray.join(', ')}`));
              } else {
                resolve();
              }
            }
          }
        }
      });
    });
  });
}

const fetchPages = async ({
                            config,
                            cacheBandwidthConfig,
                            percentCost,
                            prepare = (data) => data,
                            onePort
                          }) => {
  const { count, logger, progress, checkStatus } = config;
  const cleanedConfig = cleanConfig(config);

  const { workers, close } = await makeFetchPageWorkersPool({
    config: cleanedConfig,
    cacheBandwidthConfig,
    onePort,
    functions: {
      checkStatus,
      logger
    }
  });

  const pagesResults = {};

  try {
    await runFetchPagesQueue({
      workers,
      pages: cleanedConfig.pages,
      count,
      checkStatus,
      logger,
      dataCb: async ({ page, result }) => {
        if (!pagesResults[page]) {
          pagesResults[page] = [];
        }

        pagesResults[page].push(await prepare(result)); // ToDo preparing on another worker
        await progress(percentCost);
      }
    });

    close();
    return pagesResults;
  } catch (e) {
    close();
    throw e;
  }
};

module.exports = {
  fetchPages
};
