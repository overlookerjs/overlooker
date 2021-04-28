const puppeteer = require('puppeteer');

const pixel2 = puppeteer.devices['Pixel 2'];

module.exports = {
  devices: {
    mobile: pixel2
  },
  userAgents: {
    mobile: 'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3765.0 Mobile Safari/537.36',
    desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36'
  },
  viewports: {
    mobile: pixel2.viewport,
    desktop: {
      width: 1366,
      height: 768
    }
  }
};
