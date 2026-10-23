const token = 'catatan_sk_3114e8fbc4e4bba71ce9521d6f3e99e0';

async function testParallel() {
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  };

  const endpoints = [
    'http://tanya_catatanku.test/api/v1/summary?from=2026-10-01&to=2026-10-31',
    'http://tanya_catatanku.test/api/v1/transactions?per_page=10',
    'http://tanya_catatanku.test/api/v1/categories',
    'http://tanya_catatanku.test/api/v1/api-tokens',
    'http://tanya_catatanku.test/api/v1/accounts',
    'http://tanya_catatanku.test/api/v1/stats/trend?range=6m',
    'http://tanya_catatanku.test/api/v1/stats/by-category?month=2026-10&type=expense',
    'http://tanya_catatanku.test/api/v1/stats/top-expenses?month=2026-10&limit=5'
  ];

  console.log('Sending 8 requests in parallel to Apache...');
  const t0 = Date.now();
  const results = await Promise.all(
    endpoints.map(async (url) => {
      const start = Date.now();
      const res = await fetch(url, { headers });
      return { url: url.split('/api/v1')[1], status: res.status, time: Date.now() - start };
    })
  );

  console.log(`ALL COMPLETED in ${Date.now() - t0}ms!`);
  results.forEach(r => console.log(`  [${r.status}] ${r.time}ms ${r.url}`));
}

testParallel();
