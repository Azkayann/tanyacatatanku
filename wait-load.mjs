import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('console', msg => console.log('LOG:', msg.text()));
page.on('response', resp => {
  if (resp.url().includes('/api/v1/')) {
    console.log(`[${resp.status()}] ${resp.url().replace('http://localhost:8000/api/v1', '')}`);
  }
});

try {
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'user123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  
  console.log('Waiting for skeleton to disappear...');
  const t0 = Date.now();
  await page.waitForSelector('.animate-pulse', { state: 'detached', timeout: 15000 });
  console.log(`Skeleton disappeared after ${Date.now() - t0}ms!`);
  
  await page.screenshot({ path: 'qa-test-results/dashboard-screens/dashboard-loaded.png', fullPage: true });
  console.log('Saved loaded screenshot!');
} catch (err) {
  console.error('Wait failed:', err.message);
  await page.screenshot({ path: 'qa-test-results/dashboard-screens/dashboard-failed.png', fullPage: true });
} finally {
  await browser.close();
}
