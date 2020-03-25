const { prepareResult } = require('../preparing.js');
const { fetchPages } = require('./core-fetcher.js');
const { getAllStats } = require('../../stats');

const describePerformance = async (config, percentCost, buildData) => {
  const { checkStatus, logger } = config;

  try {
    const result = await fetchPages({
      config,
      percentCost,
      checkStatus,
      prepare: (data) => getAllStats(data, config)
    });

    await logger(`fetching done!`);

    return await prepareResult(result, config, buildData);
  } catch (e) {
    await logger(`cannot fetch pages!\n${e.stack}`);
  }
};

module.exports = describePerformance;
