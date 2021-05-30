const { prepareRequestsConfig } = require('./../preparing.js');
const { openBrowser } = require('./browsers.js');
const { loadPage } = require('./../page-loader.js');
const {
  parentPort, workerData
} = require('worker_threads');
const messages = require('./worker-messages.js');

const deserializeArgs = (args) => args.map(({ type, value }) => {
  switch (type) {
    case 'function':
      return new Function('return ' + value)();
    default:
      return value;
  }
});

const wrapFunctions = (functions) => {
  const callsMap = new Map();

  parentPort.on('message', async ({ type, payload }) => {
    if (type === messages.FUNCTION_RESULT) {
      const {
        result,
        functionName,
        id
      } = payload;

      callsMap.get(functionName + id)(result);
    }
  });

  return functions.reduce((acc, functionName) => {
    let counter = 0;

    acc[functionName] = async (...args) => {
      const id = counter++;

      if (counter === Number.MAX_SAFE_INTEGER) {
        counter = 0;
      }

      parentPort.postMessage({
        type: messages.FUNCTION_CALL,
        payload: {
          args,
          functionName,
          id
        }
      });

      return await new Promise((resolve) => {
        callsMap.set(functionName + id, resolve);
      });
    }

    return acc;
  }, {});
}

const wrapPagesActions = (pages) => {
  const callsMap = new Map();

  parentPort.on('message', async ({ type, payload }) => {
    if (type === messages.ACTION_PAGE_CALL) {
      const {
        actionCallId,
        pageCallId,
        functionName,
        args
      } = payload;

      const { page } = callsMap.get(actionCallId);

      try {
        await page[functionName](...deserializeArgs(args));

        parentPort.postMessage({
          type: messages.ACTION_PAGE_CALL_RESULT,
          payload: {
            pageCallId
          }
        });
      } catch (error) {
        parentPort.postMessage({
          type: messages.ACTION_PAGE_CALL_RESULT,
          payload: {
            pageCallId,
            error
          }
        });
      }
    } else if (type === messages.ACTION_END) {
      const {
        actionCallId
      } = payload;

      callsMap.get(actionCallId).resolve();
      callsMap.delete(actionCallId);
    }
  });

  return pages.map(({ actions, ...rest }) => {
    const wrappedActions = actions && actions.map(({ actionId, ...actionRest }) => {
      let counter = 0;

      return {
        ...actionRest,
        action: async (page, pages) => {
          const id = counter++;

          if (counter === Number.MAX_SAFE_INTEGER) {
            counter = 0;
          }

          const actionCallId = actionId + '-' + id;

          parentPort.postMessage({
            type: messages.ACTION_CALL,
            payload: {
              actionId,
              actionAdditionArgs: [pages],
              actionCallId
            }
          });

          return await new Promise((resolve) => {
            callsMap.set(actionCallId, {
              page,
              resolve
            });
          });
        }
      }
    });

    return {
      ...rest,
      actions: wrappedActions
    }
  });
}

const fetchPage = async (browser,
                         {
                           cacheBandwidthConfig,
                           page,
                           config
                         }) => {
  const { logger } = config;

  await logger(`start fetching: ${page.url}`);

  try {
    const pageStartTime = Date.now();

    const data = await loadPage(
      browser.context,
      config,
      page,
      cacheBandwidthConfig
    );

    const pageEndTime = Date.now();

    await logger(`fetch page ${page.url} in ${Math.floor((pageEndTime - pageStartTime) / 1000)}s`);

    return data;
  } catch (error) {
    await logger(`fetch failed: ${page.url} ${error.stack}`);

    throw error;
  }
};

const runWorker = async () => {
  const {
    cacheBandwidthConfig,
    config,
    index,
    httpPort,
    httpsPort,
    functions
  } = workerData;
  const wrappedFunctions = wrapFunctions(functions);
  const preparedConfig = {
    ...config,
    requests: prepareRequestsConfig(config.requests, config.host, config.pages),
    logger: wrappedFunctions.logger,
    pages: wrapPagesActions(config.pages)
  };

  const browser = await openBrowser({
    config: preparedConfig,
    index,
    httpPort,
    httpsPort
  });

  if (browser) {
    parentPort.on('message', async ({ type, payload }) => {
      if (type === messages.LOAD_PAGE_START) {
        try {
          const result = await fetchPage(
            browser,
            {
              cacheBandwidthConfig: cacheBandwidthConfig && {
                ...cacheBandwidthConfig,
                resources: cacheBandwidthConfig.resources[payload.name]
              },
              page: preparedConfig.pages.find(({ name }) => payload.name === name),
              config: preparedConfig
            }
          );

          parentPort.postMessage({
            type: messages.LOAD_PAGE_COMPLETE,
            payload: {
              page: payload.name,
              result
            }
          });
        } catch (error) {
          parentPort.postMessage(({
            type: messages.LOAD_PAGE_ERROR,
            payload: {
              page: payload,
              error
            }
          }));
        }
      } else if (type === messages.WORKER_KILL) {
        await browser.close();

        process.exit(0);
      }
    });

    parentPort.postMessage({ type: messages.WORKER_READY });
  }
};

runWorker();
