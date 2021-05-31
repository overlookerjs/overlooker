const { aggregateProfiles } = require('../../aggregation');
const { fetchPages } = require('./fetch-pages.js');
const { getAllStats } = require('../../stats');
const { map, filter } = require('../../objects-utils.js');
const { prepareRequestsConfig } = require('./../preparing.js');

const content = async (config, buildData) => {
  const { checkStatus, logger } = config;

  const impactConfig = {
    ...config,
    cache: false,
    count: 1,
    throttling: null
  };
  const configWithRequests = {
    ...impactConfig,
    requests: prepareRequestsConfig(config.requests, config.host, config.pages)
  };

  try {
    await logger('request page content');

    const result = await fetchPages({
      config: impactConfig,
      percentCost: 0,
      checkStatus,
      prepare: async (data) => ({
        profile: await getAllStats(data, configWithRequests),
        content: {
          load: data.content,
          actions: map(data.actions, ({ content }) => content)
        }
      })
    });

    const preparedProfiles = await aggregateProfiles(
      map(result, (profilesArray) => profilesArray.map(({ profile }) => profile)),
      configWithRequests,
      buildData
    );

    await logger(`page content received!`);

    return map(
      filter(
        preparedProfiles,
        (p, pageName) => result[pageName][0]
      ),
      (profile, pageName) => ({
        profile,
        content: result[pageName][0].content
      })
    );
  } catch (e) {
    await logger(`cannot collect content!\n${e.stack}`);

    return null;
  }
};

module.exports = content;
