const { prepareConfig } = require('./preparing.js');
const { fetchBuildData } = require('./build-data.js');
const { describePerformance, warming } = require('./pages-fetchers');
const networkPresets = require('../network-presets.js');
const CacheBandwidth = require('./cache-bandwidth.js');

const profile = async (config) => {
  const preparedConfig = prepareConfig(config);
  const { pages, logger, proxy, cache, count } = preparedConfig;
  const percentCost = 0.99 / (count * pages.length + (proxy || cache ? pages.length : 0));
  let stopCache;

  if (!pages.length) {
    await logger('Nothing to profile');

    return {};
  }

  const {
    downloadThroughput,
    latency
  } = networkPresets[config.throttling.network];

  const cacheBandwidth = cache ? new CacheBandwidth(downloadThroughput, latency) : null;

  const buildData = await fetchBuildData(preparedConfig);

  if (cache) {
    stopCache = await warming(preparedConfig, percentCost);
  }

  const result = await describePerformance(preparedConfig, cacheBandwidth, percentCost, buildData);

  if (cache && stopCache) {
      await stopCache();
  }

  return result;
};

module.exports = {
  profile
};
