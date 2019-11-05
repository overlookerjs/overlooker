const { prepareConfig } = require('./preparing.js');
const { getContext, profileUrl } = require('./browser.js');
const { fetchPages } = require('./pages-fetcher.js');
const { fetchBuildData } = require('./build-data.js');
const { prepareResult } = require('./preparing.js');
const { getAllStats } = require('../stats');
const { makeInternalTest } = require('./../utils.js');
const cache = require('./cache.js');

/**
 * @typedef {Object} Cookie
 * @property {string} name
 * @property {string} domain
 * @property {string} value
 */

/**
 * @typedef {Object} Action
 * @property {Function} action - the function receives an instance of the page in arguments and should return a promise
 * @property {string} name - action name
 */

/**
 * @typedef {Object} Page
 * @property {string} name - page name
 * @property {string} url - page url
 * @property {string} [heroElement] - page hero element selector for checking paint time
 * @property {Cookie[]} [cookies] - cookies objects for page
 * @property {Action[]} [actions] - actions objects for page
 */

/**
 * @param {Object} config
 * @param {Page[]} config.pages - an array of page objects for the profile
 * @param {Object} [config.throttling] - throttling object
 * @param {number} [config.throttling.cpu] - cpu throttling (higher - worst)
 * @param {string} [config.throttling.network] - network throttling (GPRS|Regular2G|Good2G|Regular3G|Good3G|Regular4G|DSL|WiFi)
 * @param {number} [config.count] - the number of measurements for each page
 * @param {number} [config.threads] - the number of browser instances for profiling (higher - measurement will be faster, but less accurate)
 * @param {string} [config.platform] - platform for profile (desktop|mobile)
 * @param {string} [config.browserArgs] - browser arguments
 * @param {string} [config.firstEvent] - an name of event from which to count time (default: responseEnd)
 * @param {Function} [config.logger] - logger function
 * @param {object} [config.proxy] - proxy configuration
 * @param {string} [config.proxy.address] - address and port of the proxy (localhost:3128)
 * @param {Function} [config.proxy.restart] - function for restarting external proxy service
 * @param {Object} [config.buildData] - config for requesting build data for chunks meta info
 * @param {string} [config.buildData.url] - url of build data
 * @param {Function} [config.buildData.getter] - getter for requesting build data
 * @param {Object[]} [config.cookies] - main cookies objects
 * @param {string} [config.cookies.$.name] - cookie name
 * @param {string} [config.cookies.$.value] - cookie value
 * @param {string} [config.cookies.$.domain] - cookie domain
 * @param {Object} [config.requests] - object for manipulate network requests
 * @param {string|RegExp|Function|Array} [config.requests.ignore] - for ignore requests
 * @param {string|RegExp|Function|Array} [config.requests.merge] - for merge requests while aggregation
 * @param {string|RegExp|Function|Array} [config.requests.internalTest] - mark each request as internal / external
 * */
const profile = async (config) => {
  const preparedConfig = prepareConfig(config);
  const { pages, threads, logger } = preparedConfig;

  if (!pages.length) {
    await logger('Nothing to profile');
    return;
  }

  let browsers;
  let browsersThreads;
  let result;

  try {
    await logger(`opening browsers`);

    browsers = await Promise.all(Array(threads).fill(null).map(() => getContext(preparedConfig)));
    browsersThreads = browsers.map((browser) => (fn) => fn(browser));

    await logger('browsers are open');
  } catch (e) {
    await logger('error while opening browsers', e.stack);

    return {};
  }

  if (preparedConfig.proxy) {
    const warmingConfig = {
      ...preparedConfig,
      count: 1,
      throttling: null
    };

    cache.clear();

    try {
      await logger('restart proxy');
      await preparedConfig.proxy.restart();
      await logger('proxy restarted');
    } catch (e) {
      await logger(`cannot restart proxy: ${e.stack}`);
    }

    try {
      await logger('start cache warming');

      await fetchPages({
        profiler: profileUrl,
        config: warmingConfig,
        browsersThreads,
      });

      await logger(`warming done!`);
    } catch (e) {
      await logger(`cannot warm pages!`, e.stack);
    }
  }

  await logger('request build data');
  const buildData = await fetchBuildData(preparedConfig);

  const requests = preparedConfig.requests;

  try {
    result = await fetchPages({
      profiler: profileUrl,
      config: preparedConfig,
      browsersThreads,
      prepare: (pageName) => {
        const isInternal = requests && requests.internalTest ? (
          requests.internalTest
        ) : (
          makeInternalTest(preparedConfig.pages.find(({ name }) => pageName === name).url)
        );

        return (data) => getAllStats(data, isInternal, preparedConfig.firstEvent);
      }
    });

    await logger(`fetching done!`);
  } catch (e) {
    await logger(`cannot fetch pages!`, e.stack);
  }

  if (browsers) {
    await Promise.all(browsers.map(({ close }) => close()));
  }

  return await prepareResult(result, preparedConfig, buildData);
};

module.exports = {
  profile
};
