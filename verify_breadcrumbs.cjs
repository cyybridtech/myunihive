const { chromium, devices } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext(devices['iPhone 13']);
  const page = await context.newPage();
  const BASE_URL = 'http://localhost:5175';

  console.log('Navigating to Hostel Details...');
  // Since we don't know a valid ID without the app running, we'll try to find one from the listing
  await page.goto(`${BASE_URL}/hostels?university=1`);
  await page.waitForSelector('a[href^="/hostels/"]');
  const hostelLink = await page.getAttribute('a[href^="/hostels/"]:first-of-type', 'href');

  await page.goto(`${BASE_URL}${hostelLink}`);
  await page.waitForLoadState('networkidle');

  console.log('Taking screenshot of Hostel Details with breadcrumbs...');
  await page.screenshot({ path: 'mobile_details_breadcrumbs.png' });

  // Now check Room Details
  await page.waitForSelector('a[href^="/rooms/"]');
  const roomLink = await page.getAttribute('a[href^="/rooms/"]:first-of-type', 'href');
  await page.goto(`${BASE_URL}${roomLink}`);
  await page.waitForLoadState('networkidle');

  console.log('Taking screenshot of Room Details with breadcrumbs...');
  await page.screenshot({ path: 'mobile_room_breadcrumbs.png' });

  await browser.close();
})();
