import { chromium } from 'playwright';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 375, height: 667 } });

try {
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', 'user@example.com');
  await page.fill('input[type="password"]', 'user123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  
  await page.goto('http://localhost:3000/dashboard/transactions', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  
  const culprits = await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*')).filter(el => {
      const rect = el.getBoundingClientRect();
      return el.scrollWidth > window.innerWidth || rect.right > window.innerWidth;
    });
    
    return els.slice(0, 15).map(el => ({
      tag: el.tagName,
      className: el.className.substring(0, 60),
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      rectRight: Math.round(el.getBoundingClientRect().right),
      overflowX: window.getComputedStyle(el).overflowX
    }));
  });
  
  console.log('Elements causing overflow on 375px viewport:');
  console.log(JSON.stringify(culprits, null, 2));
  
} finally {
  await browser.close();
}
