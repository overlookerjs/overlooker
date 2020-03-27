# overlooker

[![Build Status](https://travis-ci.com/overlookerjs/overlooker.svg?branch=master)](https://travis-ci.com/pyatyispyatil/overlooker) [![npm overlooker package](https://img.shields.io/npm/v/overlooker)](https://www.npmjs.com/package/overlooker)

### Install
```
npm i overlooker
```

### Usage
```js
const { profile, comparePages, checkPages } = require('overlooker');

const start = async () => {
  const config = {
    pages: [{
      name: 'main',
      url: '/',
      heroElements: {
        main: '#hero-element'
      },
      actions: [{
        name: 'test-action',
        action: async (page) => {
          await page.waitForSelector('button');
          await page.click('button');
          await page.evaluate(() => performance.mark('overlooker.metrics.timing:main-button.click'));
   
          await page.evaluate(() => performance.mark('overlooker.metrics.duration.start:image-loading'));
          await page.waitForSelector('#loaded-image');
          await page.evaluate(() => {
            const image = document.querySelector('#loaded-image');
   
            if (!image.complete) {
              return new Promise((resolve) => image.addEventListener('load', resolve));
            }
          });
          await page.evaluate(() => performance.mark('overlooker.metrics.duration.end:image-loading'));
         }
      }]
    }, {
      name: 'category',
      url: '/'
    }],
    count: 1,
    throttling: {
      cpu: 1,
      network: 'WiFi'
    },
    logger: () => null,
    buildData: {
      url: '/build.json',
    }
  };
  const dataStaging = await profile({
    ...config,
    host: 'https://staging.example.com'
  });
  const dataFeature = await profile({
    ...config,
    host: 'https://feature.example.com'
  });

  const comparison = comparePages(dataStaging, dataFeature);

  const check = checkPages(comparison, {
    default: {
        'percent.stats.timings.firstPaint.median': 0.05
    }
  });
};

start();
```

### [Types](https://github.com/pyatyispyatil/overlooker/blob/master/src/types.d.ts)

### Tool for getting build data
[Bundle Internals Plugin](https://github.com/smelukov/bundle-internals)
