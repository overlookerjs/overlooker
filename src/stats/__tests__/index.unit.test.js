const config = require('../../__tests__/config.data.js');
const { prepareConfig } = require('../../profiler/preparing.js');
const { getAllStats } = require('../index.js');

describe('Stats unit tests', () => {
  const input  = require('./stats-input.data.js');
  const output  = require('./stats-output.data.js');

  const preparedConfig = prepareConfig(config);

  test('Check getAllStats', async () => {
    const result = await getAllStats(input, preparedConfig);

    expect(result).toEqual({
      stats: expect.any(Object),
      network: expect.any(Array),
      coverage: expect.any(Array),
      actions: expect.any(Object)
    });

    expect(result.stats).toEqual(output.stats);

    expect(result.coverage).toEqual(output.coverage);

    expect(result.network).toEqual(output.network);

    expect(result.actions).toHaveProperty('test-action');

    expect(result.actions['test-action']).toEqual({
      stats: expect.any(Object),
      network: expect.any(Array),
      coverage: expect.any(Array)
    });

    expect(result.actions['test-action'].stats).toEqual(output.testActionStats);

    expect(result.actions['test-action'].coverage).toEqual(output.testActionCoverage);

    expect(result.actions['test-action'].network).toEqual(output.testActionNetwork);
  });
});

