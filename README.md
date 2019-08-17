### Install
```
npm i overlooker
```

### Usage
```js
const { profile, compare } = require('overlooker');

const start = async () => {
  const data1 = await profile({
    pages: {
      main: 'https://example.com'
    }
  });
  const data2 = await profile({
    pages: {
      main: 'https://example.com/test'
    }
  });

  const compared = compare(data2, data1);
};

start();
```

### Profile configuration
```js
/**
 * @param {Object} config
 * @param {Object[]} config.pages
 * @param {string} config.pages.$.name
 * @param {string} config.pages.$.url
 * @param {Object} [config.pages.$.actions]
 * @param {Function[]} [config.pages.$.actions.actionName]
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
```
