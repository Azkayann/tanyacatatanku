import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

page.on('console', msg => {
  if (msg.type() === 'error' || msg.type() === 'warning' || msg.text().includes('Error') || msg.text().includes('error') || msg.text().includes('Gagal')) {
    console.log(`[${msg.type()}] ${msg.text()}`);
  }
});
page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

try {
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'user123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  
  await page.waitForTimeout(6000);
  
  // Check if error state is shown
  const errorVisible = await page.evaluate(() => {
    const body = document.body.innerText;
    if (body.includes('Gagal')) return body.substring(body.indexOf('Gagal'), body.indexOf('Gagal') + 200);
    return null;
  });
  console.log('Error state:', errorVisible);
  
  // Check if loading skeleton is still showing
  const pulsingElements = await page.evaluate(() => {
    return document.querySelectorAll('.animate-pulse').length;
  });
  console.log('Pulsing skeleton elements:', pulsingElements);
  
  // Check page state
  const pageText = await page.evaluate(() => document.body.innerText.substring(0, 500));
  console.log('Page text (first 500):', pageText);
  
} finally {
  await browser.close();
}
