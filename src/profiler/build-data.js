const { isRelativeUrl, getHost } = require('./../utils.js');

const fetchBuildData = async (buildDataUrl, host) => {
  if (buildDataUrl) {
    try {
      const { data } = await (
        isRelativeUrl(buildDataUrl) ? (
          fetch(buildDataUrl)
        ) : (
          fetch(getHost(host) + buildDataUrl)
        )
      );

      return data;
    } catch (e) {
      console.log('cannot receive build data', e);

      return null;
    }
  }
};

module.exports = {
  fetchBuildData
};
