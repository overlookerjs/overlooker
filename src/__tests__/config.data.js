module.exports = {
  host: 'http://localhost:3000',
  pages: [{
    name: 'main',
    url: '/',
    heroElements: {
      main: '#hero-element'
    },
    actions: [{
      name: 'test-action',
      action: async (page) => {
        await page.waitForSelector('button');
        await page.click('button');
        await page.evaluate(() => performance.mark('overlooker.metrics.timing:main-button.click'));

        await page.evaluate(() => performance.mark('overlooker.metrics.duration.start:image-loading'));
        await page.waitForSelector('#loaded-image');
        await page.evaluate(() => {
          const image = document.querySelector('#loaded-image');

          if (!image.complete) {
            return new Promise((resolve) => image.addEventListener('load', resolve));
          }
        });
        await page.evaluate(() => performance.mark('overlooker.metrics.duration.end:image-loading'));
      }
    }]
  }, {
    name: 'category',
    url: '/'
  }],
  count: 5,
  throttling: {
    cpu: 1,
    network: 'WiFi'
  },
  logger: (msg) => console.log(msg),
  buildData: {
    url: '/build.json',
  }
};