const { prepareConfig } = require('./preparing.js');
const { getContext, profileUrl } = require('./browser.js');
const { fetchPages } = require('./pages-fetcher.js');
const { fetchBuildData } = require('./build-data.js');
const { prepareResult } = require('./preparing.js');

/**
 * @param {Object} config
 * @param {Object} config.pages
 * @param {Object} [config.throttling]
 * @param {number} [config.throttling.cpu]
 * @param {string} [config.throttling.network]
 * @param {number} [config.count]
 * @param {number} [config.threads]
 * @param {string} [config.platform]
 * @param {string} [config.browserArgs]
 * @param {Object} [config.requests]
 * @param {string|RegExp|Function|Array} [config.requests.ignore]
 * @param {string|RegExp|Function|Array} [config.requests.merge]
 * @param {string|RegExp|Function|Array} [config.requests.internalTest]
 * */

const profile = async (config) => {
  const { pages, threads } = prepareConfig(config);

  const pagesEntries = Object.entries(pages);

  if (!pagesEntries.length) {
    console.log('Nothing to profile');
    return;
  }

  let browsers;
  let browsersThreads;
  let result;

  try {
    console.log(`opening browsers`);

    browsers = await Promise.all(Array(threads).fill(null).map(() => getContext(config.browserArgs)));
    browsersThreads = browsers.map((browser) => (fn) => fn(browser));

    console.log('browsers are open');
  } catch (e) {
    console.log('error while opening browsers', e.stack);

    return {};
  }

  try {
    result = await fetchPages({
      profiler: profileUrl,
      config,
      pagesEntries,
      browsersThreads,
    });

    console.log(`fetching done!`);
  } catch (e) {
    console.log(`cannot fetch pages!`, e.stack);
  }

  if (browsers) {
    await Promise.all(browsers.map(({ close }) => close()));
  }

  console.log('request build data');

  const buildData = await fetchBuildData(config.buildDataUrl, Object.values(pages)[0]);
  return prepareResult(result, config, buildData, pages);
};

module.exports = {
  profile
};
