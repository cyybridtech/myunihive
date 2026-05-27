import { test, expect } from '@playwright/test';

test('audit mobile responsiveness', async ({ page }) => {
  // Use iPhone 13 viewport
  await page.setViewportSize({ width: 390, height: 844 });

  const BASE_URL = 'http://localhost:5175';

  // Home Page
  await page.goto(`${BASE_URL}/`);
  await page.screenshot({ path: 'mobile_home.png' });

  // Hostel Listing
  await page.goto(`${BASE_URL}/hostels`);
  await page.waitForTimeout(2000); // Wait for data
  await page.screenshot({ path: 'mobile_listing.png' });

  // Login Page
  await page.goto(`${BASE_URL}/login`);
  await page.screenshot({ path: 'mobile_login.png' });

  // Check Navbar Mobile Menu
  await page.goto(`${BASE_URL}/`);
  // Try common selectors for hamburger menu
  const menuButton = page.locator('button').filter({ has: page.locator('.lucide-menu, .lucide-align-justify') });
  if (await menuButton.isVisible()) {
    await menuButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'mobile_navbar_open.png' });
  }
});
