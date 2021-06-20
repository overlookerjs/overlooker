const { prepareConfig, prepareRequestsConfig } = require('./preparing.js');
const { fetchBuildData } = require('./build-data.js');
const { aggregateProfiles } = require('../aggregation');
const { describePerformance, warming } = require('./pages-fetchers');
const networkPresets = require('../network-presets.js');
const { map } = require('./../objects-utils.js');

const getSyntheticCache = (config) => {
  const isSyntheticCache = config.cache && config.cache.type === 'synthetic';
  const {
    downloadThroughput,
    latency
  } = networkPresets[config.throttling.network];

  return isSyntheticCache ? {
    latency,
    throughput: downloadThroughput,
    writeMode: true,
    resources: {}
  } : null;
}

const profile = async (config, skipAggregation) => {
  let preparedConfig = prepareConfig(config);
  const { pages, logger, count, cache } = preparedConfig;
  const percentCost = 0.99 / (count * pages.length + (cache ? pages.length : 0));
  let stopCache;
  let cacheResources;

  if (!pages.length) {
    await logger('Nothing to profile');

    return {};
  }

  const cacheBandwidthConfig = getSyntheticCache(preparedConfig);

  const buildData = !skipAggregation ? await fetchBuildData(preparedConfig) : null;

  if (cache) {
    let result;

    if (!cache.resources) {
      result = await warming(config, percentCost, cacheBandwidthConfig);
    } else {
      await logger('Use cached resources from config');

      result = map(cache.resources, (resourcesByPage) => new Map(Object.entries(resourcesByPage)));
    }

    if (cacheBandwidthConfig) {
      cacheResources = result;
      preparedConfig = {
        ...preparedConfig,
        pages: preparedConfig.pages.filter(({ name }) => !!cacheResources && cacheResources[name])
      };
    } else {
      stopCache = result;
    }
  }

  const result = await describePerformance(
    preparedConfig,
    cacheBandwidthConfig ? {
      ...cacheBandwidthConfig,
      resources: cacheResources,
      writeMode: false
    } : null,
    percentCost,
    buildData,
    skipAggregation
  );

  if (cache && stopCache) {
    await stopCache();
  }

  return result;
};

const profileWarming = async (config) => {
  const preparedConfig = prepareConfig(config);
  const cacheBandwidthConfig = getSyntheticCache(preparedConfig);
  const { pages, count, cache } = preparedConfig;
  const percentCost = 0.99 / (count * pages.length + (cache ? pages.length : 0));

  return await warming(config, percentCost, cacheBandwidthConfig);
}

const profileAggregate = async (config, profiles) => {
  const preparedConfig = prepareConfig(config);
  const buildData = await fetchBuildData(preparedConfig);

  const configWithRequests = {
    ...config,
    requests: prepareRequestsConfig(config.requests, config.host, config.pages)
  };

  return await aggregateProfiles(
    profiles,
    configWithRequests,
    buildData
  );
}

const profileRaw = async (config) => await profile(config, true);

module.exports = {
  profile,
  profileRaw,
  profileAggregate,
  profileWarming
};
