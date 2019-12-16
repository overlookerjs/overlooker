const { fill } = require('./../objects-utils.js');

const defaultHash = 'nearest-marks';

const timingRegExp = /^overlooker\.metrics\.timing:(.*?)$/i;
const durationRegExp = /^overlooker\.metrics\.duration\.(start|end):(.*?)(?:#(.*?))?$/i;

const getCustomMetrics = (events) => {
  const timings = fill(
    events
      .filter((event) => timingRegExp.test(event.name))
      .map((event) => [event.name.match(timingRegExp)[1].split('.'), event.ts])
  );
  const durations = fill(
    Object.entries(
      Object.entries(
        fill(
          events
            .filter((event) => durationRegExp.test(event.name))
            .map((event) => {
              const [, type, name, hash = defaultHash] = event.name.match(durationRegExp);

              return [
                [
                  hash,
                  name,
                  type,
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
