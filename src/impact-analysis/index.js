const { prepareConfig } = require('../profiler/preparing.js');
const { fetchBuildData } = require('../profiler/build-data.js');
const { content } = require('../profiler/pages-fetchers');
const { checkDescriptions } = require('./description-checker.js');
const { describePages } = require('./description-builder.js');
const browsers = require('../profiler/browsers.js');

const impactAnalysis = async (previousDescriptions, config, elementsFilter) => {
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

  // const profilesArray = Promise.all(Array(10).fill(null).map(() => content(preparedConfig, wrappedBrowsers, buildData)));

  const profiles = await content(preparedConfig, wrappedBrowsers, buildData);

  const profiles2 = await content(preparedConfig, wrappedBrowsers, buildData);

  // const profiles3 = await content(preparedConfig, wrappedBrowsers, buildData);

  await browsers.close(openedBrowsers);

  const descriptions = describePages(profiles, elementsFilter, preparedConfig);
  const descriptions2 = describePages(profiles2, elementsFilter, preparedConfig);

  const impact = descriptions ? checkDescriptions(descriptions, descriptions2) : preparedConfig;

  await logger(`impact analysis done!`);

  return {
    ...impact,
    descriptions
  };
};

module.exports = {
  impactAnalysis
};
