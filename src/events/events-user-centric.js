const speedline = require('speedline/core');

const getSpeedIndex = async (events) => {
  const { speedIndex } = await speedline(events);

  return speedIndex;
};

module.exports = {
  getSpeedIndex
};
