const compile = require('../../measurable-project/compiler.js');
const listen = require('../../measurable-project/server');
const { check, checkPages, compare, comparePages, profile, merge, impactAnalysis } = require('../index.js');
const config = require('./config.data.js');

const thresholds = {
  'default': {
    'percent.stats.timings.firstPaint.median': 0.05,
    [`percent.stats.timings.{
    domContentLoadedEventStart, 
    domContentLoadedEventEnd, 
    loadEventStart, 
    loadEventEnd
  }.median`]: 0.05
  }
};

jest.setTimeout(150000);

const hasProfile = (profile) => {
  expect(profile).toBeTruthy();
  expect(profile.main).toBeTruthy();
  expect(profile.category).toBeTruthy();
};

describe('main integration tests', () => {
  let server;
  let data1;
  let data2;

  test('compile measurable project', async () => {
    await compile();
  });

  test('start server', async () => {
    server = listen();
  });

  test('impact analysis', async () => {
    const impact1 = await impactAnalysis(null, config);
    const impact2 = await impactAnalysis(impact1.descriptions, config);
  });

  test('profile', async () => {
    data1 = await profile(config);
    data2 = await profile(config);

    hasProfile(data1);
    hasProfile(data2);
  });

  test('cache wpr', async () => {
    const cacheData = await profile({ ...config, count: 1, cache: { type: 'wpr' } });

   hasProfile(cacheData);
  });

  test('cache mitmdump', async () => {
    const cacheData = await profile({ ...config, count: 1, cache: { type: 'mitmdump' } });

    hasProfile(cacheData);
  });

  describe('audits tests', () => {
    let compared;
    let checked;

    test('compare audits', async () => {
      compared = comparePages(data1, data2);
    });

    test('check compared audits', async () => {
      checked = checkPages(compared, thresholds);
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
      compared = compare(firstMerge, secondMerge);
    });

    test('check merged pages', async () => {
      checked = check(compared, thresholds.default);
    });
  });

  afterAll(() => server.close());
});
