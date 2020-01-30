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

  if (getter) {
    return await getter(url);
  } else if (buildDataUrl) {
    try {
      const { data } = await (
        isRelativeUrl(buildDataUrl) ? (
          instance.get(getHost(url) + buildDataUrl, axiosConfig)
        ) : (
          instance.get(buildDataUrl, axiosConfig)
        )
      );

      return data;
    } catch (e) {
      await logger(`cannot receive build data ${e}`);

      return null;
    }
  }
};

module.exports = {
  fetchBuildData
};
