const { fill } = require('./../objects-utils.js');

const defaultHash = 'nearest-marks';

const getCustomMetrics = (events, customMetrics) => {
  const { timing, durationStart, durationEnd } = customMetrics;
  const timings = fill(
    events
      .filter((event) => timing.test(event.name))
      .map((event) => [event.name.match(timing)[1].split('.'), event.ts])
  );
  const durations = fill(
    Object.entries(
      Object.entries(
        fill(
          events
            .filter((event) => durationStart.test(event.name) || durationEnd.test(event.name))
            .map((event) => {
              const start = event.name.match(durationStart);
              const end = event.name.match(durationEnd);
              const [, name, hash = defaultHash] = start || end;

              return [
                [
                  hash,
                  name,
                  start ? 'start' : 'end',
                ],
                event.ts
              ];
            })
        )
      )
        .reduce((acc, [hash, event]) => (
          Object.entries(event)
            .reduce((acc, [name, { start, end }]) => {
              if (hash !== defaultHash) {
                if (acc[name]) {
                  acc[name] = {
                    total: acc[name].total + (end - start),
                    count: acc[name].count + 1
                  };
                } else {
                  acc[name] = {
                    total: (end - start),
                    count: 1
                  };
                }
              } else {
                acc[name] = end - start;
              }

              return acc;
            }, acc)
        ), {})
    )
      .map(([name, value]) => [name.split('.'), value])
  );

  return {
    timings,
    durations
  }
};

module.exports = {
  getCustomMetrics
};
