import ApiClient from './frontend/lib/api.ts';

// Or run curl / fetch against backend
const token = 'catatan_sk_3114e8fbc4e4bba71ce9521d6f3e99e0'; // user 2

async function testApi() {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };

  const endpoints = [
    'http://localhost:8000/api/v1/summary?from=2026-10-01&to=2026-10-31',
    'http://localhost:8000/api/v1/transactions?per_page=10',
    'http://localhost:8000/api/v1/categories',
    'http://localhost:8000/api/v1/api-tokens',
    'http://localhost:8000/api/v1/accounts',
    'http://localhost:8000/api/v1/stats/trend?range=6m',
    'http://localhost:8000/api/v1/stats/by-category?month=2026-10&type=expense',
    'http://localhost:8000/api/v1/stats/top-expenses?month=2026-10&limit=5'
  ];

  for (const url of endpoints) {
    const t0 = Date.now();
    try {
      const res = await fetch(url, { headers });
      console.log(`[${res.status}] in ${Date.now() - t0}ms: ${url}`);
      if (res.status !== 200) {
        console.log('  Response:', await res.text());
      }
    } catch (e) {
      console.error(`FAILED in ${Date.now() - t0}ms: ${url}`, e.message);
    }
  }
}

testApi();
