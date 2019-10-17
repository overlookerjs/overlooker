const compile = require('./measurable-project/compiler');
const listen = require('./measurable-project/server/index');
const { check, checkPage, compare, comparePages, profile, merge } = require('./../src');

const thresholds = {
  'percent.stats.timings.firstPaint.median': 0.05
};

jest.setTimeout(30000);

describe('main tests', () => {
  const config = {
    pages: [{
      name: 'main',
      url: 'http://localhost:3000'
    }, {
      name: 'category',
      url: 'http://localhost:3000'
    }],
    count: 1,
    logger: () => null
  };

  let server;
  let data1;
  let data2;

  test('compile measurable project', async () => {
    await compile();
  });

  test('start server', async () => {
    server = listen();
  });

  test('profile', async () => {
    data1 = await profile(config);
    data2 = await profile(config);
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
      compared = comparePages(data1, data2);
    });

    test('check merged pages', async () => {
      checked = checkPage(compared, thresholds);
    });
  });

  afterAll(() => server.close());
});
