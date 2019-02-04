const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const PATH = 'trace.json';
const URL = 'https://habr.ru';

const getContext = async (cb) => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    ignoreHTTPSErrors: true
  });

  const context = await browser.createIncognitoBrowserContext();

  await cb(context);

  await context.close();
  await browser.close();
};

const getProfile = async (url, filePath) => getContext(async (context) => {
  const page = await context.newPage();

  const client = await page.target().createCDPSession();

  await client.send('Network.clearBrowserCache');
  await client.send('Network.clearBrowserCookies');
  await client.send('Performance.enable');

  await page.setViewport({width: 1280, height: 720});
  await page.tracing.start({});

  try {
    await page.goto(url, {timeout: 60000, waitUntil: ["load"]});

    const traceData = (await page.tracing.stop()).toString();

    await page.close();

    fs.writeFileSync(path.resolve(__dirname, filePath), traceData);
  } catch (e) {
    console.error(`Cannot get page ${url}:`, e);
  }
});

getProfile(URL, PATH).then(() => console.log(`Tracing of ${URL} was saved to ${PATH}`));
