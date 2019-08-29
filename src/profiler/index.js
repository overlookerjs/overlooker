const { prepareConfig } = require('./preparing.js');
const { getContext, profileUrl } = require('./browser.js');
const { fetchPages } = require('./pages-fetcher.js');
const { fetchBuildData } = require('./build-data.js');
const { prepareResult } = require('./preparing.js');
const cache = require('./cache.js');

/**
 * @param {Object} config
 * @param {Object[]} config.pages - an array of page objects for the profile
 * @param {string} config.pages.$.name - page name
 * @param {string} config.pages.$.url - page url
 * @param {string} config.pages.$.heroElement - page hero element selector for checking paint time
 * @param {Object[]} [config.pages.$.cookies] - cookies objects for page
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
 * @param {string} [config.firstEvent] - an name of event from which to count time (default: responseEnd)
 * @param {Function} [config.logger] - logger function
 * @param {object} [config.proxy] - proxy configuration
 * @param {string} [config.proxy.address] - address and port of the proxy (localhost:3128)
 * @param {Function} [config.proxy.restart] - function for restarting external proxy service
 * @param {string} [config.buildDataUrl] - build data for chunks meta info
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

  try {
    result = await fetchPages({
      profiler: profileUrl,
      config: preparedConfig,
      browsersThreads,
    });

    await logger(`fetching done!`);
  } catch (e) {
    await logger(`cannot fetch pages!`, e.stack);
  }

  if (browsers) {
    await Promise.all(browsers.map(({ close }) => close()));
  }

  await logger('request build data');

  const buildData = await fetchBuildData(preparedConfig);

  return await prepareResult(result, preparedConfig, buildData);
};

module.exports = {
  profile
};
