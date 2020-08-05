const { fetchPages } = require('./core-fetcher.js');

const warming = async (config, cacheBandwidth, percentCost) => {
  const { checkStatus, logger, proxy, cache } = config;

  if (proxy || cache) {
    const warmingConfig = {
      ...config,
      count: 1,
      throttling: null
    };

    if (proxy && proxy.restart) {
      try {
        await logger('restart proxy');
        await proxy.restart();
        await logger('proxy restarted');
      } catch (e) {
        await logger(`cannot restart proxy\n${e.stack}`);
      }
    }

    try {
      await logger('start cache warming');

      await fetchPages({
        config: warmingConfig,
        cacheBandwidth,
        percentCost,
        checkStatus
      });

      await logger(`warming done!`);
    } catch (e) {
      await logger(`cannot warm pages!\n${e.stack}`);
    }
  }
};

module.exports = warming;
