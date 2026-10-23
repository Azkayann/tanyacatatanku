import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
page.on('requestfailed', req => console.error('REQ FAILED:', req.url(), req.failure()?.errorText));
page.on('response', resp => {
  if (resp.url().includes('/api/')) {
    console.log(`API [${resp.status()}] ${resp.url()}`);
  }
});

try {
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'user123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
  
  // Wait up to 5 seconds and see what API calls happen
  await page.waitForTimeout(4000);
  
  await page.screenshot({ path: 'qa-test-results/dashboard-screens/dashboard-after-wait.png', fullPage: true });
  console.log('Done screenshot');
} finally {
  await browser.close();
}
