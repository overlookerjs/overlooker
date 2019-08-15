const { findEventByName } = require('./events-helpers.js');
const { getEventsTimestamps, filterByFrame } = require('./events-helpers.js');

const getResponseEndEvent = (events) => {
  const mainNavigationStart = findEventByName(events, 'navigationStart');

  return events
    .find(({ name, args }) => name === 'responseEnd' && args && args.frame === mainNavigationStart.args.frame)
};

const getMainEventsTimestamps = (events, frame) => getEventsTimestamps(filterByFrame(events, frame), [
  'firstMeaningfulPaint',
  'firstMeaningfulPaintCandidate',
  'firstPaint',
  'firstTextPaint',
  'firstImagePaint',
  'firstContentfulPaint',
  'domContentLoadedEventStart',
  'domContentLoadedEventEnd',
  'loadEventStart',
  'loadEventEnd',
  'domInteractive',
  'domComplete'
]);


module.exports = {
  getResponseEndEvent,
  getMainEventsTimestamps
};

