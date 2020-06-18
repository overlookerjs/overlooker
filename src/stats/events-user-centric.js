const { makeEventsRelative, getLastEvent } = require('./events-helpers.js');
const { map, expandFlat } = require('./../objects-utils.js');
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

const prepareElementsTimings = (elementsTimings, navigationStartDelta) => expandFlat(
  elementsTimings
    .reduce((acc, et) => {
      acc[et.name] = map(
        et.timings,
        (value) => value * 1000 + navigationStartDelta
      );

      return acc;
    }, {})
);

const getCumulativeLayoutShift = (events) => {
  const lastEvent = getLastEvent(events, 'LayoutShift', evt => evt.args && evt.args.data && evt.args.data.is_main_frame)

  return lastEvent ? lastEvent.args.data.cumulative_score : 0;
}

module.exports = {
  getSpeedIndex,
  prepareLayersPaints,
  prepareElementsTimings,
  getCumulativeLayoutShift
};
