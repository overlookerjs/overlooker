const { prepareResult } = require('../preparing.js');
const { fetchPages } = require('./core-fetcher.js');
const { getAllStats } = require('../../stats');
const { map } = require('../../objects-utils.js');

const content = async (config, buildData) => {
  const { checkStatus, logger } = config;

  const impactConfig = {
    ...config,
    count: 1,
    throttling: null
  };

  try {
    await logger('request page content');

    const profiles = await fetchPages({
      config: impactConfig,
      percentCost: 0,
      checkStatus,
      prepare: async (data) => ({
        profile: await getAllStats(data, impactConfig),
        content: {
          load: data.content,
          actions: map(data.actions, ({ content }) => content)
        }
      })
    });

    const preparedProfiles = await prepareResult(
      map(profiles, (profilesArray) => profilesArray.map(({ profile }) => profile)),
      config,
      buildData
    );

    await logger(`page content received!`);

    return map(
      preparedProfiles,
      (profile, pageName) => ({
        profile,
        content: profiles[pageName][0].content
      })
    );
  } catch (e) {
    await logger(`cannot analyse impact!\n${e.stack}`);

    return null;
  }
};

module.exports = content;
