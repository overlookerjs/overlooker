const speedline = require('speedline/core');

const getSpeedIndex = async (events) => {
  try {
    const { speedIndex } = await speedline(events);

    return speedIndex;
  } catch (e) {
    return 0;
  }
};

module.exports = {
  getSpeedIndex
};
