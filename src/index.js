const { profile } = require('./profiler');
const { compare } = require('./comparing');
const { check } = require('./checker');

module.exports = {
  profile,
  compare,
  check
};

const start = async () => {
  const defaultConfig = {
    count: 1,
    pages: [{
      name: 'main',
      url: 'https://master-www.k.avito.ru/rossiya',
      actions: []
    }],
    threads: 1,
    platform: 'mobile',
    throttling: {
      cpu: 1,
      network: 'WiFi'
    },
    buildDataUrl: '/build-debug.json',
    // requests: {
    //   ignore: (url) => false,
    //   merge: (url) => false,
    //   internalTest: (url) => false
    // }
  };

  const data1 = await profile(defaultConfig);
  const data2 = await profile(defaultConfig);

  const compared = compare(data2, data1);

  const checked = check(compared, {
    'percent.stats.timings.firstPaint.median': 0.005
  });

  debugger;
};

start();
