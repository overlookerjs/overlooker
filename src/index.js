const { profile } = require('./profiler');
const { compare } = require('./comparing');


const start = async () => {
  const data = await profile({
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
  });

  debugger;
};

start();

module.exports = {
  profile,
  compare
};
