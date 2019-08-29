const speedline = require('speedline/core');

const getSpeedIndex = async (events) => {
  try {
    const { speedIndex } = await speedline(events);

    return speedIndex;
  } catch (e) {
    return 0;
  }
};

const getHeroElementPaints = (events) => ({
  heroElementFirstPaint: events[0].ts,
  heroElementLastPaint: events[events.length - 1].ts,
});

module.exports = {
  getSpeedIndex,
  getHeroElementPaints
};
