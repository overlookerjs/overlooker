const { makeEventsRelative } = require('./events-helpers.js');
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

const prepareHeroElementsPaints = (heroElementsPaints, firstEvent) => (
  getHeroElementsPaints(
    map(
      heroElementsPaints,
      (heroElementPaints) => makeEventsRelative(heroElementPaints, firstEvent)
    )
  )
);

const prepareElementsTimings = (elementsTimings, navigationStartDelta) => map(
  elementsTimings
    .reduce((acc, et) => {
      if (!acc[et.name]) {
        acc[et.name] = [];
      }

      acc[et.name].push({
        visiblePercent: elementsTimings.view.visiblePercent,
        timings: map(
          elementsTimings.timings,
          (value, name) => name === 'duration' ? value : value + navigationStartDelta
        )
      });

      return acc;
    }, {}),
  (value) => value
);

module.exports = {
  getSpeedIndex,
  prepareHeroElementsPaints,
  prepareElementsTimings
};
