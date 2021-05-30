const path = require('path');
const { Worker } = require('worker_threads');
const constants = require('../constants.js');
const messages = require('./worker-messages.js');

const makeFetchPageWorkersPool = async ({
                                          config,
                                          cacheBandwidthConfig,
                                          onePort,
                                          functions
                                        }) => {
  const { threads } = config;

  let httpPort = constants.HTTP_PORT;
  let httpsPort = constants.HTTPS_PORT;

  const workers = await Promise.all(Array(threads).fill(null).map(async (t, index) => {
    if (!onePort) {
      httpPort = httpPort + 1;
      httpsPort = httpsPort + 1;
    }

    const worker = new Worker(path.join(__dirname, './fetch-page-worker.js'), {
      workerData: {
        config,
        index,
        httpPort,
        httpsPort,
        cacheBandwidthConfig,
        functions: Object.keys(functions),
      }
    });

    worker.on('message', async ({ type, payload }) => {
      if (type === messages.FUNCTION_CALL) {
        const {
          args,
          functionName,
          id
        } = payload;

        const result = await functions[functionName](...args);

        worker.postMessage({
          type: messages.FUNCTION_RESULT,
          payload: {
            id,
            functionName,
            result
          }
        });
      }
    });

    await new Promise((resolve) => {
      const readyListener = async ({ type }) => {
        if (type === messages.WORKER_READY) {
          resolve();

          worker.removeListener('message', readyListener);
        }
      };

      worker.on('message', readyListener);
    });

    return worker;
  }));

  return {
    workers,
    close: () => workers.forEach((worker) => worker.postMessage({ type: messages.WORKER_KILL }))
  };
}

module.exports = {
  makeFetchPageWorkersPool
};
