const { getEventsTimestamps } = require('./events-helpers.js');

const getFetchStart = (events) => events
  .find(({ name }) => name === 'fetchStart');

const getMainEventsTimestamps = (events) => getEventsTimestamps(events, [
  'firstMeaningfulPaint',
  'firstMeaningfulPaintCandidate',
  'firstPaint',
  'firstTextPaint',
  'firstImagePaint',
  'firstContentfulPaint',
  'domContentLoadedEventStart',
  'domContentLoadedEventEnd',
  'onLoadEventStart',
  'onLoadEventEnd'
]);


module.exports = {
  getFetchStart,
  getMainEventsTimestamps
};

