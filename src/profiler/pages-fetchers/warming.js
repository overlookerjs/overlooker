const { fetchPages } = require('./core-fetcher.js');
const wpr = require('./../../wpr');
const constants = require('./../constants.js');
const cache = require('../cache.js');

const warmingWpr = async (config, percentCost) => {
  const { checkStatus, logger, cacheLogger, threads } = config;

  const mainWprInstance = wpr(cacheLogger, constants.HTTP_PORT, constants.HTTPS_PORT);

  await mainWprInstance.clean();
  await mainWprInstance.start('record');

  await logger(`wpr in record mode`);

  const warmingConfig = {
    ...config,
    count: 2,
    throttling: null,
    threads: 1
  };

  let wrpInstances = [];

  try {
    await logger('start cache warming');

    await fetchPages({
      config: warmingConfig,
      percentCost,
      checkStatus,
      onePort: true
    });

    await logger(`warming done!`);

    await mainWprInstance.stop();

    let httpPort = constants.HTTP_PORT;
    let httpsPort = constants.HTTPS_PORT;

    wrpInstances = await Promise.all(Array(threads)
      .fill(null)
      .map(async () => {
        httpPort = httpPort + 1;
        httpsPort = httpsPort + 1;

        const wprInstanceByPort = wpr(cacheLogger, httpPort, httpsPort);

        await logger(`create wpr on 80:${httpPort}, 443:${httpsPort} ports`);

        await wprInstanceByPort.start('replay');

        return wprInstanceByPort;
      }));

    await logger(`wpr in replay mode`);
  } catch (e) {
    await logger(`cannot warm pages!\n${e.stack}`);
  }

  return async () => {
    await Promise.all(wrpInstances.map(async (wrpInstance) => {
      await wrpInstance.stop();
    }));

    await mainWprInstance.clean();
  }
};

const warmingProxy = async (config, percentCost) => {
  const { checkStatus, logger, cache: {restart} } = config;

  const warmingConfig = {
    ...config,
    count: 1,
    throttling: null
  };

  cache.clear();

  if (restart && typeof restart === 'function') {
    try {
      await logger('restart proxy');
      await restart();
      await logger('proxy restarted');
    } catch (e) {
      await logger(`cannot restart proxy\n${e.stack}`);
    }
  }

  try {
    await logger('start cache warming');

    await fetchPages({
      config: warmingConfig,
      percentCost,
      checkStatus
    });

    await logger(`warming done!`);
  } catch (e) {
    await logger(`cannot warm pages!\n${e.stack}`);
  }
};

const warming = async (config, percentCost) => {
  switch (config.cache.type) {
    case 'wpr':
      return await warmingWpr(config, percentCost);
    case 'proxy':
      return await warmingProxy(config, percentCost);
    default:
      return null;
  }
};

module.exports = warming;
