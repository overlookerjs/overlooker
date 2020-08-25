const { fetchPages } = require('./core-fetcher.js');
const wpr = require('./../../wpr');
const constants = require('./../constants.js');

const warming = async (config, percentCost) => {
  const { checkStatus, logger, cacheLogger } = config;

  const wprInstance = wpr(cacheLogger, constants.HTTP_PORT, constants.HTTPS_PORT);

  await wprInstance.clean();
  await wprInstance.start('record');

  await logger(`wpr in record mode`);

  const warmingConfig = {
    ...config,
    count: 1,
    throttling: null
  };

  try {
    await logger('start cache warming');

    await fetchPages({
      config: warmingConfig,
      percentCost,
      checkStatus
    });

    await logger(`warming done!`);

    await wprInstance.stop();
    await wprInstance.start('replay');

    await logger(`wpr in replay mode`);
  } catch (e) {
    await logger(`cannot warm pages!\n${e.stack}`);
  }

  return async () => {
    await wprInstance.stop();
    await wprInstance.clean();
  }
};

module.exports = warming;
