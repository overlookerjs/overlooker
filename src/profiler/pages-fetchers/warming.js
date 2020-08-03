const { fetchPages } = require('./core-fetcher.js');

const warming = async (config, bandwidth, percentCost) => {
  const { checkStatus, logger, proxy } = config;

  if (proxy) {
    const warmingConfig = {
      ...config,
      count: 1,
      throttling: null
    };

    try {
      await logger('start cache warming');

      await fetchPages({
        config: warmingConfig,
        bandwidth,
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
