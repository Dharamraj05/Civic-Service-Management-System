const http = require('http');
const fs = require('fs');
const path = require('path');
const app = require('../app');
const { testConnection } = require('../config/db');

function request(server, { method = 'GET', url, token, body, headers = {} }) {
  return new Promise((resolve, reject) => {
    const payload = body && !Buffer.isBuffer(body) && typeof body !== 'string'
      ? JSON.stringify(body)
      : body;
    const req = http.request({
      hostname: '127.0.0.1',
      port: server.address().port,
      path: url,
      method,
      headers: {
        ...(payload && !Buffer.isBuffer(payload) && typeof payload === 'string' && !headers['Content-Type']
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
          : {}),
        ...(Buffer.isBuffer(payload) ? { 'Content-Length': payload.length } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers
      }
    }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        let json = null;
        try { json = JSON.parse(buf.toString('utf8')); } catch (error) { json = null; }
        resolve({ status: res.statusCode, json, buf, type: res.headers['content-type'] });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function login(server, email, password) {
  const res = await request(server, {
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password }
  });
  if (res.status !== 200) {
    throw new Error(`login ${email} ${res.status}`);
  }
  return res.json.data.token;
}

async function run() {
  await testConnection();
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const citizenToken = await login(server, 'ravi.kumar@example.com', 'Citizen@123');
    const adminToken = await login(server, 'admin@csms.gov.in', 'Admin@12345');

    const created = await request(server, {
      method: 'POST',
      url: '/api/complaints',
      token: citizenToken,
      body: {
        title: 'Blocked drain near gate',
        description: 'Water is overflowing onto the road after rain.',
        address: 'Lane 9 Kothrud',
        category_id: 3,
        priority: 4
      }
    });
    if (created.status !== 201) {
      throw new Error(`create ${created.status} ${JSON.stringify(created.json)}`);
    }
    const complaintId = created.json.data.complaint.complaint_id;

    const png = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a49444154789c63000100000500010d0a2db40000000049454e44ae426082',
      'hex'
    );
    const boundary = '----csmsboundary';
    const multipart = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="evidence"; filename="drain.png"\r\nContent-Type: image/png\r\n\r\n`),
      png,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);
    const evidence = await request(server, {
      method: 'POST',
      url: `/api/complaints/${complaintId}/evidence`,
      token: citizenToken,
      body: multipart,
      headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` }
    });
    if (evidence.status !== 201) {
      throw new Error(`evidence ${evidence.status} ${JSON.stringify(evidence.json)}`);
    }
    const evidenceId = evidence.json.data.evidence.evidence_id;

    const file = await request(server, {
      url: `/api/complaints/${complaintId}/evidence/${evidenceId}/file`,
      token: citizenToken
    });
    if (file.status !== 200 || !String(file.type).includes('image/png')) {
      throw new Error(`file ${file.status} ${file.type}`);
    }

    const unauth = await request(server, {
      url: `/api/complaints/${complaintId}/evidence/${evidenceId}/file`
    });
    if (unauth.status !== 401) {
      throw new Error(`unauth file ${unauth.status}`);
    }

    const concepts = await request(server, {
      url: '/api/admin/concepts',
      token: adminToken
    });
    if (concepts.status !== 200) {
      throw new Error(`concepts ${concepts.status} ${JSON.stringify(concepts.json)}`);
    }

    const flag = await request(server, {
      method: 'POST',
      url: `/api/complaints/${complaintId}/flags`,
      token: adminToken,
      body: {
        flag_type: 'WRONG_PHOTO',
        reason: 'The photo does not show the reported civic issue.'
      }
    });
    if (flag.status !== 201) {
      throw new Error(`flag ${flag.status} ${JSON.stringify(flag.json)}`);
    }

    const citizenFlag = await request(server, {
      method: 'POST',
      url: `/api/complaints/${complaintId}/flags`,
      token: citizenToken,
      body: {
        flag_type: 'WRONG_PHOTO',
        reason: 'The photo does not show the reported civic issue.'
      }
    });
    if (citizenFlag.status !== 403) {
      throw new Error(`citizen flag ${citizenFlag.status}`);
    }

    const logFile = path.join(__dirname, '..', 'logs', 'email-warnings.log');
    console.log(`PASS evidence+flag complaint=${complaintId} email_status=${flag.json.data.email_status} log=${fs.existsSync(logFile)}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

run().catch((error) => {
  console.error('FAIL', error.message);
  process.exit(1);
});
