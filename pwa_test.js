const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const cdpSession = await page.target().createCDPSession();
  
  await page.goto('http://localhost:3000');
  
  // Wait a bit for SW to register
  await new Promise(r => setTimeout(r, 2000));

  const manifest = await cdpSession.send('Page.getAppManifest');
  console.log(JSON.stringify(manifest, null, 2));

  await browser.close();
})();
