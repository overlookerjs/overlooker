const { profile } = require('./profiler');
const { compare } = require('./comparing');


const start = async () => {
  const defaultConfig = {
    count: 1,
    pages: {
      main: 'https://www.avito.ru'
    },
    threads: 1,
    platform: 'desktop',
    throttling: {
      cpu: 1,
      network: 'WiFi'
    },
    // requests: {
    //   ignore: (url) => false,
    //   merge: (url) => false,
    //   internalTest: (url) => false
    // }
  };

  const data1 = await profile(defaultConfig);
  const data2 = await profile(defaultConfig);

  const compared = compare(data2, data1);

  debugger;
};

start();

module.exports = {
  profile,
  compare
};
