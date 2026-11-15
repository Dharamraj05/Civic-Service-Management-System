/**
 * Non-destructive API smoke test for a live demo.
 * Does not allocate, complete, insert, or delete anything.
 *
 * Usage (MySQL and API must already be running, or this script starts nothing):
 *   cd server
 *   node tests/smoke.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = require('../app');
const { testConnection } = require('../config/db');
const http = require('http');

function request(server, { method = 'GET', url, token, body } = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: server.address().port,
      path: url,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (error) { json = { raw: data }; }
        resolve({ status: res.statusCode, json });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function login(server, email, password) {
  const res = await request(server, {
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password }
  });
  assert(res.status === 200, `Login failed for ${email}: HTTP ${res.status} ${res.json.message}`);
  assert(res.json.data?.token, `No token for ${email}`);
  assert(!JSON.stringify(res.json).includes('password_hash'), 'password_hash leaked in login response');
  return res.json.data;
}

async function run() {
  await testConnection();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));

  const failures = [];
  const check = async (name, fn) => {
    try {
      await fn();
      console.log(`PASS  ${name}`);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
      console.log(`FAIL  ${name}: ${error.message}`);
    }
  };

  try {
    await check('GET /api/health', async () => {
      const res = await request(server, { url: '/api/health' });
      assert(res.status === 200, `HTTP ${res.status}`);
      assert(res.json.data?.database === 'connected', 'database not connected');
    });

    await check('GET /api/complaints/my without token is 401', async () => {
      const res = await request(server, { url: '/api/complaints/my' });
      assert(res.status === 401, `expected 401, got ${res.status}`);
    });

    await check('Wrong password is 401', async () => {
      const res = await request(server, {
        method: 'POST',
        url: '/api/auth/login',
        body: { email: 'admin@csms.gov.in', password: 'WrongPass123' }
      });
      assert(res.status === 401, `expected 401, got ${res.status}`);
    });

    let admin;
    await check('Admin login', async () => {
      admin = await login(server, 'admin@csms.gov.in', 'Admin@12345');
      assert(admin.user.role === 'ADMIN', `role ${admin.user.role}`);
    });

    let citizen;
    await check('Citizen login', async () => {
      citizen = await login(server, 'ravi.kumar@example.com', 'Citizen@123');
      assert(citizen.user.role === 'CITIZEN', `role ${citizen.user.role}`);
    });

    await check('GET /api/complaints/my as citizen', async () => {
      const res = await request(server, { url: '/api/complaints/my', token: citizen.token });
      assert(res.status === 200, `HTTP ${res.status} ${res.json.message}`);
      assert(Array.isArray(res.json.data.complaints), 'complaints is not an array');
      assert(res.json.data.summary && typeof res.json.data.summary.total === 'number', 'summary.total missing');
      const foreign = res.json.data.complaints.filter((row) => row.citizen_id !== citizen.user.user_id);
      assert(foreign.length === 0, 'citizen saw another user\'s complaints');
    });

    await check('Citizen cannot open admin dashboard', async () => {
      const res = await request(server, { url: '/api/admin/dashboard', token: citizen.token });
      assert(res.status === 403, `expected 403, got ${res.status}`);
    });

    await check('GET /api/admin/dashboard', async () => {
      const res = await request(server, { url: '/api/admin/dashboard', token: admin.token });
      assert(res.status === 200, `HTTP ${res.status} ${res.json.message}`);
      assert(res.json.data.stats?.complaints, 'stats.complaints missing');
    });

    await check('GET /api/admin/complaints/queue order', async () => {
      const res = await request(server, { url: '/api/admin/complaints/queue', token: admin.token });
      assert(res.status === 200, `HTTP ${res.status} ${res.json.message}`);
      const queue = res.json.data.queue;
      assert(Array.isArray(queue), 'queue is not an array');
      for (let i = 1; i < queue.length; i += 1) {
        const prev = queue[i - 1];
        const curr = queue[i];
        const ok = prev.priority < curr.priority
          || (prev.priority === curr.priority && String(prev.created_at) <= String(curr.created_at));
        assert(ok, `queue out of order at ${i}: #${prev.complaint_id} then #${curr.complaint_id}`);
      }
    });

    await check('GET /api/resources', async () => {
      const res = await request(server, { url: '/api/resources', token: admin.token });
      assert(res.status === 200, `HTTP ${res.status} ${res.json.message}`);
      assert(Array.isArray(res.json.data.resources), 'resources is not an array');
    });

    await check('GET /api/admin/reports', async () => {
      const res = await request(server, { url: '/api/admin/reports', token: admin.token });
      assert(res.status === 200, `HTTP ${res.status} ${res.json.message}`);
      assert(Array.isArray(res.json.data.by_category), 'by_category missing');
    });

    await check('GET /api/departments', async () => {
      const res = await request(server, { url: '/api/departments', token: admin.token });
      assert(res.status === 200, `HTTP ${res.status}`);
      assert(Array.isArray(res.json.data.departments), 'departments missing');
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }

  if (failures.length) {
    console.error(`\n${failures.length} smoke check(s) failed.`);
    process.exit(1);
  }
  console.log('\nSmoke tests passed.');
}

run().catch((error) => {
  console.error('Smoke test could not run:', error.message);
  process.exit(1);
});
