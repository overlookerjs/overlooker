const {
  findEventByName,
  getLastEvent,
  getEventsTimestamps,
  filterByFrame,
  getTimestamps
} = require('./events-helpers.js');

const getEventInMainFrame = (events, eventName) => {
  const mainNavigationStart = findEventByName(events, 'navigationStart');

  return events
    .find(({ name, args }) => name === eventName && args && args.frame === mainNavigationStart.args.frame)
};

const getUserCentricPaints = (events) => {
  const firstMeaningfulPaint = findEventByName(events, 'firstMeaningfulPaint')
    || getLastEvent(events, 'firstMeaningfulPaintCandidate');

  const largestContentfulPaint = getLastEvent(events, 'largestContentfulPaint::Candidate') || firstMeaningfulPaint;

  return getTimestamps({
    firstMeaningfulPaint,
    largestContentfulPaint
  });
};

const getMainEventsTimestamps = (events, frame) => {
  const frameEvents = filterByFrame(events, frame);

  return {
    ...getUserCentricPaints(frameEvents),
    ...getEventsTimestamps(frameEvents, [
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
    ])
  };
};

module.exports = {
  getEventInMainFrame,
  getMainEventsTimestamps
};

