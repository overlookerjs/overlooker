const devices = require('puppeteer/DeviceDescriptors');

const pixel2 = devices['Pixel 2'];

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
