const { makeFetchPageWorkersPool } = require('./fetch-page-workers-pool.js');
const messages = require('./worker-messages.js');

const serializeArgs = (args) => args.map((arg) => {
  const argType = typeof arg;
  let serializedArg;

  switch(argType) {
    case 'function':
      serializedArg = arg.toString();
      break;
    default:
      serializedArg = arg;
      break;
  }

  return {
    type: argType,
    value: serializedArg
  }
})

const preparePages = (pages) => {
  const actionsMap = new Map();

  const preparedPages = pages.map(({
                                     actions,
                                     name,
                                     ...rest
                                   }) => {
    const wrappedActions = actions && actions.map(({
                                                     action,
                                                     name: actionName,
                                                     ...rest
                                                   }, index) => {
      const actionId = `${name}-${actionName}-${index}`;

      actionsMap.set(actionId, action);

      return ({
        actionId: actionId,
        name: actionName,
        ...rest
      });
    });

    return {
      ...rest,
      name,
      actions: wrappedActions
    }
  }, {});

  return {
    actionsMap,
    preparedPages
  }
}

const cleanConfig = (config) => {
  const { preparedPages, actionsMap } = preparePages(config.pages);

  return {
    actionsMap,
    cleanedConfig: ({
      ...config,
      pages: preparedPages,
      cache: config.cache ? ({
        ...config.cache,
        postDataHandler: config.cache.postDataHandler && config.cache.postDataHandler.toString(),
        responseDataHandler: config.cache.responseDataHandler && config.cache.responseDataHandler.toString()
      }) : config.cache,
      logger: null,
      progress: null,
      checkStatus: null,
      buildData: null
    })
  }
}

const runFetchPagesQueue = async ({ workers, pages, count, checkStatus, logger, dataCb }) => {
  return new Promise((resolve, reject) => {
    const queue = Array(pages.length * count)
      .fill(null)
      .map((a, index) => index % pages.length);
    let expectedResultsCount = queue.length;
    let attemptsCount = 15;
    let attemptTimeout = 5000;

    workers.forEach((worker) => {
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
          if (attemptsCount) {
            if (await checkStatus()) {
              attemptsCount--;

              await logger(`try to retry: ${payload.page.url}`);

              setTimeout(() => {
                worker.postMessage({
                  type: messages.LOAD_PAGE_START,
                  payload: payload.page
                });
              }, attemptTimeout);
            }
          } else {
            reject(new Error('Attempts limit reached.'));
          }
        }
      })
    });
  });
}

const bindActionsToWorkers = (workers, actionsMap) => {
  const pageCallsMap = new Map();

  workers.forEach((worker) => {
    let counter = 0;

    worker.on('message', async ({
                                  type,
                                  payload
                                }) => {
      if (type === messages.ACTION_CALL) {
        const { actionId, actionAdditionArgs, actionCallId } = payload;
        const action = actionsMap.get(actionId);

        await action(new Proxy({}, {
          get: (target, property) => {
            return async (...args) => {
              const id = counter++;

              if (counter === Number.MAX_SAFE_INTEGER) {
                counter = 0;
              }

              const pageCallId = actionCallId + property + id;

              worker.postMessage({
                type: messages.ACTION_PAGE_CALL,
                payload: {
                  actionCallId,
                  pageCallId,
                  functionName: property,
                  args: serializeArgs(args)
                }
              });

              return await new Promise((resolve, reject) => pageCallsMap.set(pageCallId, { resolve, reject }));
            }
          }
        }), ...actionAdditionArgs);

        worker.postMessage({
          type: messages.ACTION_END,
          payload: {
            actionCallId
          }
        });
      } else if (type === messages.ACTION_PAGE_CALL_RESULT) {
        const {
          pageCallId,
          result,
          error
        } = payload;

        const pageCall = pageCallsMap.get(pageCallId);

        if (error) {
          pageCall.reject(error);
        } else {
          pageCall.resolve(result);
        }

        pageCallsMap.delete(pageCallId);
      }
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
  const { actionsMap, cleanedConfig } = cleanConfig(config);

  const { workers, close } = await makeFetchPageWorkersPool({
    config: cleanedConfig,
    cacheBandwidthConfig,
    onePort,
    functions: {
      checkStatus,
      logger
    }
  });

  bindActionsToWorkers(workers, actionsMap);

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
    await logger(e.stack);

    close();
    return null;
  }
};

module.exports = {
  fetchPages
};
