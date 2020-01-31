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
    buildData: {
      url: buildDataUrl,
      getter
    },
    pages: [{ url }],
    logger,
    progress
  } = config;
  let complete = 0;
  const axiosConfig = {
    onUploadProgress: (progressEvent) => {
      const oldComplete = complete;

      complete = Math.round((progressEvent.loaded / progressEvent.total) / 100);

      progress(complete - oldComplete);
    }
  };

  try {
    if (getter) {
      const data = await getter(url);

      progress(0.01);

      return data;
    } else if (buildDataUrl) {
      const { data } = await (
        isRelativeUrl(buildDataUrl) ? (
          instance.get(getHost(url) + buildDataUrl, axiosConfig)
        ) : (
          instance.get(buildDataUrl, axiosConfig)
        )
      );

      return data;
    }
  } catch (e) {
    await logger(`cannot receive build data\n${e.stack}`);

    return null;
  }
};

module.exports = {
  fetchBuildData
};
