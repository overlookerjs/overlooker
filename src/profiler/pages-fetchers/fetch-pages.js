const { makeFetchPageWorkersPool } = require('./fetch-page-workers-pool.js');
const { make } = require('./../../objects-utils.js');
const messages = require('./worker-messages.js');

const ATTEMPTS_COUNT = 15;

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
    let expectedResultsCounter = queue.length;
    const pagesWithError = new Set();
    const pagesAttempts = make(pages.map(({ name }) => [name, ATTEMPTS_COUNT]));

    if (!queue.length) {
      reject(new Error('Noting to profile'));
    }

    const isFetchingEnded = async () => !(await checkStatus()) || expectedResultsCounter <= 0;

    workers.forEach((worker) => {
      let attemptTimeout = 5000;

      if (queue.length) {
        worker.postMessage({
          type: messages.LOAD_PAGE_START,
          payload: pages[queue.shift()]
        });
      }

      worker.on('message', async ({ type, payload }) => {
        const sendPageToWorker = async () => {
          if (!(await isFetchingEnded()) && queue.length) {
            const queueItem = queue.shift();

            if (typeof queueItem === 'number') {
              worker.postMessage({
                type: messages.LOAD_PAGE_START,
                payload: pages[queueItem]
              });
            } else {
              await logger('Shift empty queue item');
            }
          }
        }

        if (type === messages.LOAD_PAGE_COMPLETE) {
          expectedResultsCounter--;

          await sendPageToWorker();

          await dataCb(payload);

          if (await isFetchingEnded()) {
            resolve();
          }
        } else if (type === messages.LOAD_PAGE_ERROR) {
          if (!payload.page) {
            await logger(`Something wrong with worker: ${JSON.stringify(payload, null, '  ')}`);

            if (await isFetchingEnded()) {
              resolve();
            }
          } else if (pagesAttempts[payload.page.name] > 0) {
            if (await checkStatus()) {
              pagesAttempts[payload.page.name] -= 1;

              await logger(`try to retry: ${payload.page.url} (attempts: ${pagesAttempts[payload.page.name]})`);

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
            expectedResultsCounter -= delta + 1;

            if (await isFetchingEnded()) {
              await logger(`Attempts limit reached for page: ${payload.page.name} - ${payload.page.url}`);

              const pagesWithErrorArray = [...pagesWithError];

              if (pagesWithErrorArray.length === pages.length) {
                reject(new Error(`All pages in profile reached attempts limit: ${pagesWithErrorArray.join(', ')}`));
              } else {
                resolve();
              }
            } else {
              await sendPageToWorker();
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
