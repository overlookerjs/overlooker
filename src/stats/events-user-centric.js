const { map } = require('./../objects-utils.js');
const speedline = require('speedline/core');

const getSpeedIndex = async (events) => {
  try {
    const { speedIndex } = await speedline(events);

    return speedIndex * 1000;
  } catch (e) {
    return 0;
  }
};

const getHeroElementPaints = (events) => events.length ? {
  firstPaint: events[0].ts,
  lastPaint: events[events.length - 1].ts,
} : {};

const getHeroElementsPaints = (heroElementsPaintEvents) => map(
  heroElementsPaintEvents,
  getHeroElementPaints
);

module.exports = {
  getSpeedIndex,
  getHeroElementsPaints
};
