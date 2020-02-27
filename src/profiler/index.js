const { prepareConfig } = require('./preparing.js');
const { fetchBuildData } = require('./build-data.js');
const { describePerformance, warming } = require('./pages-fetchers');
const browsers = require('./browsers.js');

const profile = async (config) => {
  const preparedConfig = prepareConfig(config);
  const { pages, logger, proxy, count } = preparedConfig;
  const percentCost = 0.99 / (count * pages.length + (proxy ? pages.length : 0));

  if (!pages.length) {
    await logger('Nothing to profile');

    return {};
  }

  const openedBrowsers = await browsers.open(preparedConfig);
  const wrappedBrowsers = browsers.wrap(openedBrowsers);

  const buildData = await fetchBuildData(preparedConfig);

  const warmingResult = await warming(preparedConfig, wrappedBrowsers, percentCost);
  const result = await describePerformance(preparedConfig, wrappedBrowsers, percentCost, buildData);

  await browsers.close(openedBrowsers);

  return result;
};

module.exports = {
  profile
};
