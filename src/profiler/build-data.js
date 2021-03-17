const axios = require('axios');
const { isRelativeUrl, getHost } = require('./../utils.js');
const https = require('https');

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

const fetchBuildData = async (config) => {
  const {
    buildData,
    pages: [{ url }],
    logger,
    progress,
    host
  } = config;

  if (buildData) {
    const {
      url: buildDataUrl,
      getter
    } = buildData;
    let complete = 0;
    const axiosConfig = {
      onUploadProgress: async (progressEvent) => {
        const oldComplete = complete;

        complete = Math.round((progressEvent.loaded / progressEvent.total) / 100);

        await progress(complete - oldComplete);
      }
    };

    await logger('request build data');

    try {
      let data;

      if (getter) {
        data = await getter(url);
      } else if (buildDataUrl) {
        const response = await (
          isRelativeUrl(buildDataUrl) ? (
            instance.get((host || getHost(url)) + buildDataUrl, axiosConfig)
          ) : (
            instance.get(buildDataUrl, axiosConfig)
          )
        );

        data = response.data;
      }

      await progress(0.01);

      await logger('build data received');

      return data;
    } catch (e) {
      await logger(`cannot receive build data\n${e.stack}`);

      return null;
    }
  } else {
    await logger(`Build data not found`);

    return null;
  }
};

module.exports = {
  fetchBuildData
};
