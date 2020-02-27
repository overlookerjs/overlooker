const { prepareResult } = require('../preparing.js');
const { fetchPages } = require('./core-fetcher.js');
const { getAllStats } = require('../../stats');
const { makeInternalTest } = require('../../utils.js');
const { map } = require('../../objects-utils.js');

const content = async (config, browsersThreads, buildData) => {
  const { checkStatus, logger, requests, firstEvent, pages } = config;

  if (config.impactAnalysis) {
    const impactConfig = {
      ...config,
      count: 1,
      throttling: null
    };

    try {
      await logger('start impact analysis');

      const profiles = await fetchPages({
        config: impactConfig,
        percentCost: 0,
        checkStatus,
        browsersThreads,
        prepare: (pageName) => {
          const isInternal = requests && requests.internalTest ? (
            requests.internalTest
          ) : (
            makeInternalTest(pages.find(({ name }) => pageName === name).url)
          );

          return (data) => ({
            profile: getAllStats(data, isInternal, firstEvent),
            content: {
              load: data.content,
              actions: map(data, ({ content }) => content)
            }
          });
        }
      });

      const preparedProfiles = await prepareResult(
        map(profiles, ({ profile }) => profile),
        config,
        buildData
      );

      await logger(`impact analysis done!`);

      return map(
        preparedProfiles,
        (profile, pageName) => ({
          profile,
          content: profiles[pageName].content
        })
      );
    } catch (e) {
      await logger(`cannot analyse impact!\n${e.stack}`);

      return config;
    }
  }
};

module.exports = content;
