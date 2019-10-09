const compile = require('./measurable-project/compiler');
const listen = require('./measurable-project/server');
const { check, compare, profile } = require('./../src');

let server;

describe('main tests', () => {
  const config = {
    pages: [{
      name: 'main',
      url: 'http://localhost:3000'
    }]
  };
  let data1, data2, compared, checked;

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

  test('compare', async () => {
    compared = compare(data1, data2);
  });

  test('check', async () => {
    checked = check(compared);
  });
});
