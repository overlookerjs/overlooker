### Install
```
npm i overlooker
```

### Usage
```js
const { profile, compare } = require('overlooker');

const start = async () => {
  const data1 = await profile({
    pages: [{
        name: 'main',
        url: 'https://example.com',
        actions: {
          'test-action': async (page) => {
            page.click('.button');
            page.waitForSelector('.new-content');
          }
        }
      }]
  });
  const data2 = await profile({
    pages: [{
        name: 'main',
        url: 'https://example.com/test',
        actions: {
          'test-action': async (page) => {
            page.click('.button');
            page.waitForSelector('.new-content');
          }
        }
      }]
  });

  const compared = compare(data2, data1);
};

start();
```

### Profile configuration
```js
/**
 * @param {Object} config
 * @param {Object[]} config.pages - array of pages objects to profile
 * @param {string} config.pages.$.name - name of page
 * @param {string} config.pages.$.url - url of page
 * @param {Object} [config.pages.$.actions] - actions array, which executed after onLoad event
 * @param {Function} [config.pages.$.actions.actionName] - function receive instance of page in arguments and must return promise 
 * @param {Object} [config.throttling] - throttling object
 * @param {number} [config.throttling.cpu] - throttling of the cpu (higher - worst)
 * @param {string} [config.throttling.network] - throttling of the network (GPRS|Regular2G|Good2G|Regular3G|Good3G|Regular4G|DSL|WiFi)
 * @param {number} [config.count] - the number of measurements for each page
 * @param {number} [config.threads] - the number of browser instances for profiling (higher - measurement will be faster, but less accurate)
 * @param {string} [config.platform] - platform for profile (desktop|mobile)
 * @param {string} [config.browserArgs] - browser arguments
 * @param {Object} [config.requests] - object for manipulate network requests
 * @param {string|RegExp|Function|Array} [config.requests.ignore] - for ignore something
 * @param {string|RegExp|Function|Array} [config.requests.merge] - for merge requests while aggregation
 * @param {string|RegExp|Function|Array} [config.requests.internalTest] - to mark every request as internal/external
 * */
```
