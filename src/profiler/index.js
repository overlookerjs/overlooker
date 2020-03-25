const { prepareConfig } = require('./preparing.js');
const { fetchBuildData } = require('./build-data.js');
const { describePerformance, warming } = require('./pages-fetchers');

const profile = async (config) => {
  const preparedConfig = prepareConfig(config);
  const { pages, logger, proxy, count } = preparedConfig;
  const percentCost = 0.99 / (count * pages.length + (proxy ? pages.length : 0));

  if (!pages.length) {
    await logger('Nothing to profile');

    return {};
  }

  const buildData = await fetchBuildData(preparedConfig);

  const warmingResult = await warming(preparedConfig, percentCost);

  return await describePerformance(preparedConfig, percentCost, buildData);
};

module.exports = {
  profile
};
