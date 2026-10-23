import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'user@example.com';
const PASSWORD = 'user123';
const RESULTS_DIR = './qa-test-results';

const report = {
  loginSuccess: false,
  pagesAccessed: [],
  errors: [],
  screenshots: [],
  consoleErrors: [],
  warnings: [],
  interactions: []
};

async function run() {
  await mkdir(join(RESULTS_DIR, 'dashboard-screens'), { recursive: true });
  
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true
  });
  const page = await context.newPage();

  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    if (type === 'error') report.consoleErrors.push(text);
    if (type === 'warning') report.warnings.push(text);
  });

  page.on('pageerror', err => {
    report.errors.push(`Page error: ${err.message}`);
  });

  page.on('response', resp => {
    if (resp.status() >= 400) {
      report.errors.push(`HTTP ${resp.status()} on ${resp.url()}`);
    }
  });

  try {
    console.log('1. Login flow...');
    const startLogin = Date.now();
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', EMAIL);
    await page.fill('input[type="password"], input[name="password"]', PASSWORD);
    
    const loginBtn = page.locator('button[type="submit"]').first();
    await loginBtn.click();
    
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    const loginDuration = Date.now() - startLogin;
    report.loginSuccess = true;
    console.log(`✅ Login success in ${loginDuration}ms`);

    // Tunggu skeleton loading selesai
    console.log('⏳ Waiting for dashboard to load...');
    await page.waitForSelector('.animate-pulse', { state: 'detached', timeout: 20000 }).catch(() => {
      console.log('⚠️  Skeleton timeout, taking screenshot anyway');
    });
    await page.waitForTimeout(500);
    const dashPath = join(RESULTS_DIR, 'dashboard-screens', 'dashboard-desktop.png');
    await page.screenshot({ path: dashPath, fullPage: true });
    report.screenshots.push(dashPath);
    report.pagesAccessed.push('/dashboard');

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    const tabletPath = join(RESULTS_DIR, 'dashboard-screens', 'dashboard-tablet.png');
    await page.screenshot({ path: tabletPath, fullPage: true });
    report.screenshots.push(tabletPath);

    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    const mobilePath = join(RESULTS_DIR, 'dashboard-screens', 'dashboard-mobile.png');
    await page.screenshot({ path: mobilePath, fullPage: true });
    report.screenshots.push(mobilePath);

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);

    console.log('2. Menu navigation test...');
    const menuRoutes = [
      '/dashboard/transactions',
      '/dashboard/accounts',
      '/dashboard/transfers',
      '/dashboard/budgets',
      '/dashboard/recurring',
      '/dashboard/reports',
      '/dashboard/categories',
      '/dashboard/api-tokens',
      '/dashboard/notifications',
      '/dashboard/settings'
    ];

    for (const route of menuRoutes) {
      try {
        await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
        await page.waitForTimeout(1500);
        const title = await page.title();
        console.log(`  ✅ ${route} → ${title}`);
        report.pagesAccessed.push(route);
        
        const screenPath = join(RESULTS_DIR, 'dashboard-screens', `${route.replace(/\//g, '-').slice(1)}.png`);
        await page.screenshot({ path: screenPath });
        report.screenshots.push(screenPath);
      } catch (err) {
        console.log(`  ❌ ${route} → ${err.message}`);
        report.errors.push(`Failed to access ${route}: ${err.message}`);
      }
    }

    console.log('3. Interaction test...');
    
    // Dashboard: toggle timeframe
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const weekBtn = page.locator('button:has-text("Mingguan"), button:has-text("week")').first();
    const weekVisible = await weekBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (weekVisible) {
      await weekBtn.click();
      await page.waitForTimeout(800);
      console.log('  ✅ Dashboard timeframe toggle responsive');
      report.interactions.push('Dashboard timeframe toggle: SUCCESS');
    } else {
      console.log('  ⚠️  Dashboard timeframe toggle not found');
    }

    // Transactions: add button
    await page.goto(`${BASE_URL}/dashboard/transactions`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const addTxBtn = page.locator('button:has-text("Tambah"), button:has-text("Catat"), button:has-text("+")').first();
    const addTxVisible = await addTxBtn.isVisible({ timeout: 2000 }).catch(() => false);
    if (addTxVisible) {
      await addTxBtn.click();
      await page.waitForTimeout(800);
      console.log('  ✅ Transactions add button responsive');
      report.interactions.push('Transactions add button: SUCCESS');
    } else {
      console.log('  ⚠️  Transactions add button not found');
    }

    // Accounts: check add button
    await page.goto(`${BASE_URL}/dashboard/accounts`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const addAccBtn = page.locator('button:has-text("Tambah"), button:has-text("Buat")').first();
    const addAccVisible = await addAccBtn.isVisible({ timeout: 1500 }).catch(() => false);
    if (addAccVisible) {
      console.log('  ✅ Accounts add button visible');
      report.interactions.push('Accounts add button: VISIBLE');
    } else {
      console.log('  ⚠️  Accounts add button not found');
    }

    console.log('4. Mobile responsiveness check...');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    
    const bodyOverflow = await page.evaluate(() => {
      const body = document.body;
      return { 
        bodyWidth: body.scrollWidth, 
        windowWidth: window.innerWidth, 
        hasOverflow: body.scrollWidth > window.innerWidth 
      };
    });
    console.log(`  Mobile dashboard overflow: ${bodyOverflow.hasOverflow ? '❌ YES' : '✅ NO'}`);
    if (bodyOverflow.hasOverflow) {
      report.warnings.push(`Mobile overflow: body ${bodyOverflow.bodyWidth}px > window ${bodyOverflow.windowWidth}px`);
    }

    const mobilePages = ['/dashboard/transactions', '/dashboard/accounts'];
    for (const route of mobilePages) {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(800);
      const screenPath = join(RESULTS_DIR, 'dashboard-screens', `mobile-${route.split('/').pop()}.png`);
      await page.screenshot({ path: screenPath, fullPage: true });
      report.screenshots.push(screenPath);
      
      const overflow = await page.evaluate(() => ({
        scroll: document.body.scrollWidth > window.innerWidth,
        width: document.body.scrollWidth
      }));
      if (overflow.scroll) {
        report.warnings.push(`Mobile page ${route}: scrollWidth ${overflow.width}px`);
      }
    }

    await page.setViewportSize({ width: 1920, height: 1080 });

  } catch (err) {
    console.error('❌ Test failed:', err.message);
    report.errors.push(`Critical: ${err.message}`);
  } finally {
    await browser.close();
  }

  const reportPath = join(RESULTS_DIR, 'test-report.json');
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📋 Test Report:');
  console.log(`✅ Login: ${report.loginSuccess ? 'SUCCESS' : 'FAILED'}`);
  console.log(`📄 Pages accessed: ${report.pagesAccessed.length}`);
  console.log(`🖼️  Screenshots: ${report.screenshots.length}`);
  console.log(`🎮 Interactions tested: ${report.interactions.length}`);
  console.log(`❌ Errors: ${report.errors.length}`);
  console.log(`⚠️  Console errors: ${report.consoleErrors.length}`);
  console.log(`⚠️  Warnings: ${report.warnings.length}`);
  console.log(`\nFull report: ${reportPath}`);

  if (report.interactions.length > 0) {
    console.log('\n🎮 Interactions:');
    report.interactions.forEach(i => console.log(`  - ${i}`));
  }

  if (report.errors.length > 0) {
    console.log('\n🐛 Errors found:');
    report.errors.slice(0, 10).forEach(e => console.log(`  - ${e}`));
  }

  if (report.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    report.warnings.slice(0, 10).forEach(w => console.log(`  - ${w}`));
  }
}

run().catch(console.error);
