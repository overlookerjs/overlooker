const { prepareConfig } = require('../profiler/preparing.js');
const { fetchBuildData } = require('../profiler/build-data.js');
const { content } = require('../profiler/pages-fetchers');
const { checkDescriptions } = require('./description-checker.js');
const { describePages } = require('./description-builder.js');
const browsers = require('../profiler/browsers.js');

const impactAnalysis = async (previousDescriptions, config, strategy) => {
  const preparedConfig = prepareConfig(config);
  const { pages, logger } = preparedConfig;

  if (!pages.length) {
    await logger('Nothing to profile');

    return {};
  }

  await logger('start impact analysis');

  const openedBrowsers = await browsers.open(preparedConfig);
  const wrappedBrowsers = browsers.wrap(openedBrowsers);

  const buildData = await fetchBuildData(preparedConfig);

  const profiles = await content(preparedConfig, wrappedBrowsers, buildData);

  await browsers.close(openedBrowsers);

  const descriptions = describePages(profiles);
  const impactConfig = previousDescriptions ? checkDescriptions(previousDescriptions, descriptions, config) : config;

  await logger(`impact analysis done!`);

  return {
    config: impactConfig,
    descriptions
  };
};

module.exports = {
  impactAnalysis
};
