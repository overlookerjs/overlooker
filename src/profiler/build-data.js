const axios = require('axios');
const { isRelativeUrl, getHost } = require('./../utils.js');
const https = require('https');

const instance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
});

const fetchBuildData = async (config) => {
  const { buildDataUrl, pages: [{ url }], logger } = config;

  if (buildDataUrl) {
    try {
      const { data } = await (
        isRelativeUrl(buildDataUrl) ? (
          instance.get(getHost(url) + buildDataUrl)
        ) : (
          instance.get(buildDataUrl)
        )
      );

      return data;
    } catch (e) {
      await logger('cannot receive build data', e);

      return null;
    }
  }
};

module.exports = {
  fetchBuildData
};
