const token = 'catatan_sk_3114e8fbc4e4bba71ce9521d6f3e99e0';

const res = await fetch('http://tanya_catatanku.test/api/v1/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'user123'
  })
});
console.log('Login status:', res.status);
if (res.ok) {
  const data = await res.json();
  console.log('Token:', data.token?.substring(0, 20));
}

const resMe = await fetch('http://tanya_catatanku.test/api/v1/me', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Accept': 'application/json'
  }
});
console.log('Me status:', resMe.status);
