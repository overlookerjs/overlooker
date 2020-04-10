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

const getLayerPaints = (events) => events.length ? {
  firstPaint: events[0].ts,
  lastPaint: events[events.length - 1].ts,
} : {};

const getLayersPaints = (layersPaintEvents) => map(
  layersPaintEvents,
  getLayerPaints
);

const prepareLayersPaints = (layersPaints, firstEvent) => (
  getLayersPaints(
    map(
      layersPaints,
      (layerPaints) => makeEventsRelative(layerPaints, firstEvent)
    )
  )
);

const prepareElementsTimings = (elementsTimings, navigationStartDelta) => map(
  elementsTimings
    .reduce((acc, et) => {
      acc[et.name] = {
        visiblePercent: et.view.visiblePercent,
        timings: map(
          et.timings,
          (value, name) => name === 'duration' ? value * 1000 : value * 1000 + navigationStartDelta
        )
      };

      return acc;
    }, {}),
  (value) => value
);

module.exports = {
  getSpeedIndex,
  prepareLayersPaints,
  prepareElementsTimings
};
