const puppeteer = require('puppeteer');

const pixel2 = puppeteer.devices['Pixel 2'];

module.exports = {
  devices: {
    mobile: pixel2
  },
  viewports: {
    mobile: pixel2.viewport,
    desktop: {
      width: 1366,
      height: 768
    }
  }
};
