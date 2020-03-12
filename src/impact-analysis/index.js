const { prepareConfig } = require('../profiler/preparing.js');
const { fetchBuildData } = require('../profiler/build-data.js');
const { content } = require('../profiler/pages-fetchers');
const { compareDescriptions } = require('./description-comparison.js');
const { describePages } = require('./description-builder.js');
const browsers = require('../profiler/browsers.js');
const { getImpactedPages, affectConfigByImpact } = require('./config-filtration.js');

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

  const profiles = await content(preparedConfig, wrappedBrowsers, buildData);

  await browsers.close(openedBrowsers);

  const descriptions = describePages(profiles, preparedConfig, elementsFilter);

  const difference = previousDescriptions && compareDescriptions(previousDescriptions, descriptions);

  await logger(`impact analysis done!`);

  return {
    difference,
    descriptions,
    pages: difference ? getImpactedPages(difference) : pages.map(({ name }) => name)
  };
};

module.exports = {
  impactAnalysis,
  affectConfigByImpact
};
