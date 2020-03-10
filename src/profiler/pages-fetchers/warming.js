const { fetchPages } = require('./core-fetcher.js');
const cache = require('../cache.js');

const warming = async (config, browsersThreads, percentCost) => {
  const { checkStatus, logger, proxy } = config;

  if (proxy) {
    const warmingConfig = {
      ...config,
      count: 1,
      throttling: null
    };

    cache.clear();

    try {
      await logger('restart proxy');
      await proxy.restart();
      await logger('proxy restarted');
    } catch (e) {
      await logger(`cannot restart proxy\n${e.stack}`);
    }

    try {
      await logger('start cache warming');

      await fetchPages({
        config: warmingConfig,
        percentCost,
        checkStatus,
        browsersThreads,
      });

      await logger(`warming done!`);
    } catch (e) {
      await logger(`cannot warm pages!\n${e.stack}`);
    }
  }
};

module.exports = warming;
