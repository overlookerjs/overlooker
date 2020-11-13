const fs = require('fs');
const { fetchPages } = require('./core-fetcher.js');
const { cacheProxy } = require('../../cache-proxy');
const { resolveExternalResource } = require('./../../utils.js');
const constants = require('./../constants.js');
const cache = require('../cache.js');

const warmingCacheProxy = async (config, percentCost) => {
  const { checkStatus, logger, threads, cache: { type, data, logger: cacheLogger } } = config;
  const isMitmdump = type === 'mitmdump';
  const mainCacheProxyInstance = cacheProxy(type, cacheLogger, constants.HTTP_PORT, isMitmdump ? constants.HTTP_PORT : constants.HTTPS_PORT);

  let cacheProxyInstances = [];

  try {
    if (!data) {
      const warmingConfig = {
        ...config,
        count: 2,
        throttling: null,
        threads: 1
      };

      await logger('start cache warming');

      await mainCacheProxyInstance.clean();
      await mainCacheProxyInstance.start('record');

      await logger(`cache proxy in record mode`);

      await fetchPages({
        config: warmingConfig,
        percentCost,
        checkStatus,
        onePort: true
      });

      await mainCacheProxyInstance.stop();

      await logger(`warming done!`);
    } else {
      const resolvedData = await resolveExternalResource(data);

      fs.writeFileSync(mainCacheProxyInstance.getCacheFile(), resolvedData);
    }

    let httpPort = constants.HTTP_PORT;
    let httpsPort = isMitmdump ? constants.HTTP_PORT : constants.HTTPS_PORT;

    cacheProxyInstances = await Promise.all(Array(threads)
      .fill(null)
      .map(async () => {
        httpPort = httpPort + 1;
        httpsPort = httpsPort + 1;

        const cacheProxyInstanceByPort = cacheProxy(type, cacheLogger, httpPort, httpsPort);

        await logger(`create cache proxy on 80:${httpPort}, 443:${httpsPort} ports`);

        await cacheProxyInstanceByPort.start('replay');

        return cacheProxyInstanceByPort;
      }));

    await logger(`cache proxy in replay mode`);
  } catch (e) {
    await logger(`cannot warm pages!\n${e.stack}`);
  }

  return async () => {
    await Promise.all(cacheProxyInstances.map(async (cacheProxyInstance) => {
      await cacheProxyInstance.stop();
    }));

    await mainCacheProxyInstance.clean();
  }
};

const warmingProxy = async (config, percentCost) => {
  const { checkStatus, logger, cache: { start, stop } } = config;

  const warmingConfig = {
    ...config,
    count: 1,
    throttling: null
  };

  cache.clear();

  if (start && typeof start === 'function') {
    try {
      await logger('start proxy');
      await start();
      await logger('proxy started');
    } catch (e) {
      await logger(`cannot start proxy\n${e.stack}`);
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

  return async () => {
    if (stop && typeof stop === 'function') {
      try {
        await logger('stop proxy');
        await stop();
        await logger('proxy stopped');
      } catch (e) {
        await logger(`cannot stop proxy\n${e.stack}`);
      }
    }
  }
};

const warming = async (config, percentCost) => {
  switch (config.cache.type) {
    case 'wpr':
    case 'mitmdump':
      return await warmingCacheProxy(config, percentCost);
    case 'proxy':
      return await warmingProxy(config, percentCost);
    default:
      return null;
  }
};

module.exports = warming;
