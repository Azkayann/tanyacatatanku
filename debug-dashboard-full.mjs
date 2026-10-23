import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const apiCalls = [];

page.on('response', resp => {
  if (resp.url().includes('/api/v1/')) {
    apiCalls.push({ url: resp.url(), status: resp.status() });
    console.log(`[${resp.status()}] ${resp.url()}`);
  }
});

try {
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'user123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  
  // Wait for API calls to complete
  await page.waitForTimeout(5000);
  
  console.log('\n=== All API calls ===');
  apiCalls.forEach(c => console.log(`[${c.status}] ${c.url}`));
  
  await page.screenshot({ path: 'qa-test-results/dashboard-screens/dashboard-full-debug.png', fullPage: true });
} finally {
  await browser.close();
}
