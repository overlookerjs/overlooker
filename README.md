# overlooker

### Install
```
npm i overlooker
```

### Usage
```js
const { profile, compare, check } = require('overlooker');

const start = async () => {
  const actions = [{
    name: 'test-action',
    action: async (page) => {
      await page.click('.button');
      await page.waitForSelector('.new-content');
    }
  }];
  const data1 = await profile({
    pages: [{
      name: 'main',
      url: 'https://example.com',
      actions
    }]
  });
  const data2 = await profile({
    pages: [{
      name: 'main',
      url: 'https://example.com/test',
      actions
    }]
  });

  const compared = compare(data2, data1);

  const checked = check(compared, {
    'percent.stats.timings.firstPaint.median': 0.05
  });
};

start();
```

### Profile configuration
```js
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
```

### [Types](https://github.com/pyatyispyatil/overlooker/blob/master/src/index.d.ts)

### Tool for getting build data
[Bundle Internals Plugin](https://github.com/smelukov/bundle-internals)
