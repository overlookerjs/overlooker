const { aggregateProfiles } = require('../../aggregation');
const { fetchPages } = require('./fetch-pages.js');
const { getAllStats } = require('../../stats');
const { prepareRequestsConfig } = require('./../preparing.js');

const describePerformance = async (config, cacheBandwidthConfig, percentCost, buildData) => {
  const { logger } = config;
  const configWithRequests = {
    ...config,
    requests: prepareRequestsConfig(config.requests, config.host, config.pages)
  };

  try {
    const result = await fetchPages({
      config,
      cacheBandwidthConfig,
      prepare: (data) => getAllStats(data, configWithRequests),
      percentCost
    });

    await logger(`fetching done!`);

    return await aggregateProfiles(
      result,
      configWithRequests,
      buildData
    );
  } catch (e) {
    await logger(`cannot fetch pages!\n${e.stack}`);
  }

  return null;
};

module.exports = describePerformance;
