const { prepareConfig } = require('./preparing.js');
const { getContext, profileUrl } = require('./browser.js');
const { fetchPages } = require('./pages-fetcher.js');
const { fetchBuildData } = require('./build-data.js');
const { prepareResult } = require('./preparing.js');

/**
 * @param {Object} config
 * @param {Object[]} config.pages - an array of page objects for the profile
 * @param {string} config.pages.$.name - page name
 * @param {string} config.pages.$.url - page url
 * @param {Object[]} [config.pages.$.actions] - array of actions that are executed after the onLoad event
 * @param {Function} [config.pages.$.actions.$.action] - the function receives an instance of the page in arguments and should return a promise
 * @param {string} [config.pages.$.actions.$.name] - action name
 * @param {Object} [config.throttling] - throttling object
 * @param {number} [config.throttling.cpu] - cpu throttling (higher - worst)
 * @param {string} [config.throttling.network] - network throttling (GPRS|Regular2G|Good2G|Regular3G|Good3G|Regular4G|DSL|WiFi)
 * @param {number} [config.count] - the number of measurements for each page
 * @param {number} [config.threads] - the number of browser instances for profiling (higher - measurement will be faster, but less accurate)
 * @param {string} [config.platform] - platform for profile (desktop|mobile)
 * @param {string} [config.browserArgs] - browser arguments
 * @param {string} [config.buildDataUrl] - build data for chunks meta info
 * @param {Object} [config.requests] - object for manipulate network requests
 * @param {string|RegExp|Function|Array} [config.requests.ignore] - for ignore requests
 * @param {string|RegExp|Function|Array} [config.requests.merge] - for merge requests while aggregation
 * @param {string|RegExp|Function|Array} [config.requests.internalTest] - mark each request as internal / external
 * */

const profile = async (config) => {
  const preparedConfig = prepareConfig(config);
  const { pages, threads } = preparedConfig;

  if (!pages.length) {
    console.log('Nothing to profile');
    return;
  }

  let browsers;
  let browsersThreads;
  let result;

  try {
    console.log(`opening browsers`);

    browsers = await Promise.all(Array(threads).fill(null).map(() => getContext(preparedConfig)));
    browsersThreads = browsers.map((browser) => (fn) => fn(browser));

    console.log('browsers are open');
  } catch (e) {
    console.log('error while opening browsers', e.stack);

    return {};
  }

  try {
    result = await fetchPages({
      profiler: profileUrl,
      config: preparedConfig,
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

  const buildData = await fetchBuildData(config.buildDataUrl, pages[0].url);

  return await prepareResult(result, config, buildData);
};

module.exports = {
  profile
};
