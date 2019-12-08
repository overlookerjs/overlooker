const listen = require('./measurable-project/server/index');
const { check, checkPage, compare, comparePages, profile, merge } = require('./../src');
const compile = require('../src/ui/builder');

const thresholds = {
  'percent.stats.timings.firstPaint.median': 0.05,
  [`percent.stats.timings.{
    domContentLoadedEventStart, 
    domContentLoadedEventEnd, 
    loadEventStart, 
    loadEventEnd
  }.median`]: 0.05
};

jest.setTimeout(60000);

describe('main tests', () => {
  const config = {
    pages: [{
      name: 'main',
      url: 'http://localhost:3000',
      heroElement: '#hero-element',
      actions: [{
        name: 'test-action',
        action: async (page) => {
          await page.waitForSelector('button');
          await page.click('button');
          await page.evaluate(() => performance.mark('overlooker.metrics.mark:main-button.click'));

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
      url: 'http://localhost:3000'
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

  let server;
  let data1;
  let data2;

  test('compile measurable project', async () => {
    await compile('./measurable-project/client');
  });

  test('start server', async () => {
    server = listen();
  });

  test('profile', async () => {
    data1 = await profile(config);
    data2 = await profile(config);

    server.close()
  });

  describe('audits tests', () => {
    let compared;
    let checked;

    test('compare audits', async () => {
      compared = compare(data1, data2);
    });

    test('check compared audits', async () => {
      checked = check(compared, thresholds);
    });
  });

  describe('selected pages tests', () => {
    let compared;
    let checked;
    let firstMerge;
    let secondMerge;

    test('merge some pages', async () => {
      firstMerge = merge(data1);
      secondMerge = merge(data2);
    });

    test('compare merged pages', async () => {
      compared = comparePages(firstMerge, secondMerge);
    });

    test('check merged pages', async () => {
      checked = checkPage(compared, thresholds);
    });
  });
});
