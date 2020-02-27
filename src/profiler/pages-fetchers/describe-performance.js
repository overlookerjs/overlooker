const { prepareResult } = require('../preparing.js');
const { fetchPages } = require('./core-fetcher.js');
const { getAllStats } = require('../../stats');
const { makeInternalTest } = require('../../utils.js');

const describePerformance = async (config, browsersThreads, percentCost, buildData) => {
  const { pages, checkStatus, logger, requests, firstEvent } = config;

  try {
    const result = await fetchPages({
      config,
      browsersThreads,
      percentCost,
      checkStatus,
      prepare: (pageName) => {
        const isInternal = requests && requests.internalTest ? (
          requests.internalTest
        ) : (
          makeInternalTest(pages.find(({ name }) => pageName === name).url)
        );

        return (data) => getAllStats(data, isInternal, firstEvent);
      }
    });

    await logger(`fetching done!`);

    return await prepareResult(result, config, buildData);
  } catch (e) {
    await logger(`cannot fetch pages!\n${e.stack}`);
  }
};

module.exports = describePerformance;
