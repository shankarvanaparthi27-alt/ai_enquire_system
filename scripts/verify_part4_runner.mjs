// ==============================================================================
// UniVerse AI — Part 4 Comprehensive Verification Test Suite
// ==============================================================================

import { spawn } from 'child_process';
import http from 'http';

const PORT = 3055;
const BASE_URL = `http://127.0.0.1:${PORT}`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  } else {
    data = await res.text();
  }

  return { status: res.status, ok: res.ok, data };
}

async function waitForServer(maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${BASE_URL}/`, { signal: AbortSignal.timeout(2000) });
      if (res.status >= 200 && res.status < 500) {
        return true;
      }
    } catch (e) {
      console.log(`Waiting for server on ${BASE_URL}... attempt ${i + 1}/${maxAttempts} (${e.message})`);
    }
    await sleep(1000);
  }
  return false;
}

async function runTests() {
  console.log('\n================================================================');
  console.log('UniVerse AI — PART 4 AUTOMATED VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      if (details) console.error(`         Details: ${details}`);
      failed++;
    }
  }

  // TEST 1: Unauthenticated RBAC Protection
  console.log('[SECTION 1: Role-Based Access Control Security]');
  {
    const r1 = await request('/api/admin/metrics');
    assert(r1.status === 401, 'Unauthenticated request to /api/admin/metrics returns 401 Unauthorized', `Got ${r1.status}`);

    const r2 = await request('/api/admin/institutions');
    assert(r2.status === 401, 'Unauthenticated request to /api/admin/institutions returns 401 Unauthorized', `Got ${r2.status}`);

    const r3 = await request('/api/admin/representatives');
    assert(r3.status === 401, 'Unauthenticated request to /api/admin/representatives returns 401 Unauthorized', `Got ${r3.status}`);

    const r4 = await request('/api/admin/users');
    assert(r4.status === 401, 'Unauthenticated request to /api/admin/users returns 401 Unauthorized', `Got ${r4.status}`);

    const r5 = await request('/api/admin/audit-logs');
    assert(r5.status === 401, 'Unauthenticated request to /api/admin/audit-logs returns 401 Unauthorized', `Got ${r5.status}`);

    const r6 = await request('/api/admin/settings');
    assert(r6.status === 401, 'Unauthenticated request to /api/admin/settings returns 401 Unauthorized', `Got ${r6.status}`);

    const r7 = await request('/api/institution/portal');
    assert(r7.status === 401, 'Unauthenticated request to /api/institution/portal returns 401 Unauthorized', `Got ${r7.status}`);
  }

  // TEST 2: Student Token Access Blocked
  console.log('\n[SECTION 2: Student Token Privilege Elevation Prevention]');
  {
    const studentHeaders = { Authorization: 'Bearer mock-token-student-test-uid' };

    const r1 = await request('/api/admin/metrics', { headers: studentHeaders });
    assert(r1.status === 403, 'Student token to /api/admin/metrics blocked with 403 Forbidden', `Got ${r1.status}`);

    const r2 = await request('/api/admin/institutions', { headers: studentHeaders });
    assert(r2.status === 403, 'Student token to /api/admin/institutions blocked with 403 Forbidden', `Got ${r2.status}`);

    const r3 = await request('/api/admin/users', { headers: studentHeaders });
    assert(r3.status === 403, 'Student token to /api/admin/users blocked with 403 Forbidden', `Got ${r3.status}`);

    const r4 = await request('/api/institution/portal', { headers: studentHeaders });
    assert(r4.status === 403, 'Student token to /api/institution/portal blocked with 403 Forbidden', `Got ${r4.status}`);
  }

  // TEST 3: Admin vs Super Admin Separation of Duties
  console.log('\n[SECTION 3: Admin vs Super Admin Separation of Duties]');
  {
    const adminHeaders = { Authorization: 'Bearer mock-token-admin-regular-test' };
    const superAdminHeaders = { Authorization: 'Bearer mock-token-super_admin-root-test' };

    // Regular admin CAN read metrics
    const r1 = await request('/api/admin/metrics', { headers: adminHeaders });
    assert(r1.status === 200, 'Regular Admin can read /api/admin/metrics (200 OK)', `Got ${r1.status}`);

    // Regular admin CANNOT promote/demote users (Super Admin only)
    const r2 = await request('/api/admin/users', {
      method: 'PATCH',
      headers: adminHeaders,
      body: { targetUid: 'some-user', email: 'user@test.edu', role: 'admin' },
    });
    assert(r2.status === 403, 'Regular Admin CANNOT promote/demote users (403 Forbidden)', `Got ${r2.status}`);

    // Super admin CAN access user management endpoint
    const r3 = await request('/api/admin/users', { headers: superAdminHeaders });
    assert(r3.status === 200, 'Super Admin can access user management directory (200 OK)', `Got ${r3.status}`);

    // Regular admin CANNOT update platform settings
    const r4 = await request('/api/admin/settings', {
      method: 'PUT',
      headers: adminHeaders,
      body: { key: 'platform_name', value: { name: 'Hacked' } },
    });
    assert(r4.status === 403, 'Regular Admin CANNOT update platform settings (403 Forbidden)', `Got ${r4.status}`);

    // Regular admin CAN read platform settings
    const r5 = await request('/api/admin/settings', { headers: adminHeaders });
    assert(r5.status === 200, 'Regular Admin can read platform settings (200 OK)', `Got ${r5.status}`);
  }

  // TEST 4: Institution Representative Portal Security
  console.log('\n[SECTION 4: Institution Representative Portal Security]');
  {
    const instAdminHeaders = { Authorization: 'Bearer mock-token-inst_admin-rep-test' };

    const r1 = await request('/api/institution/portal', { headers: instAdminHeaders });
    // inst_admin has role, but if no rep profile in DB returns 404 with representative profile not found
    assert(
      r1.status === 200 || r1.status === 404,
      'Institution representative role authenticated at /api/institution/portal (non-403)',
      `Got ${r1.status}`
    );
  }

  // TEST 5: Bootstrap Endpoint Verification
  console.log('\n[SECTION 5: Super Admin Bootstrap Endpoint Verification]');
  {
    const r1 = await request('/api/admin/bootstrap');
    assert(r1.status === 200, 'Bootstrap status check returns 200 OK', `Got ${r1.status}`);
    assert(
      r1.data?.data && typeof r1.data.data.bootstrapAllowed === 'boolean',
      'Bootstrap response has bootstrapAllowed flag'
    );
  }

  // TEST 6: Parts 1, 2, 3 Regression Verification
  console.log('\n[SECTION 6: Parts 1, 2, 3 Regressions Check]');
  {
    // Part 1: Public Colleges Directory
    const rColleges = await request('/api/colleges?limit=5');
    assert(rColleges.status === 200, 'Colleges Directory API returns 200 OK', `Got ${rColleges.status}`);
    const collegesList = rColleges.data?.data?.data || rColleges.data?.data?.colleges || rColleges.data?.data;
    assert(Array.isArray(collegesList), 'Colleges API returns structured college list');

    // Part 2: Predictor validation
    const rPredict = await request('/api/predictor/predict', {
      method: 'POST',
      body: {}, // Missing required fields
    });
    assert(
      rPredict.status === 400 || rPredict.status === 422,
      'Predictor API enforces strict input validation',
      `Got ${rPredict.status}`
    );

    // Part 3: Deadlines API
    const rDeadlines = await request('/api/deadlines');
    assert(rDeadlines.status === 200, 'Admission Deadlines API returns 200 OK', `Got ${rDeadlines.status}`);

    // Part 3: Enquiries requires auth
    const rEnquiries = await request('/api/enquiries');
    assert(rEnquiries.status === 401, 'Student Enquiries API strictly requires authentication', `Got ${rEnquiries.status}`);

    // Part 3: Applications requires auth
    const rApps = await request('/api/applications');
    assert(rApps.status === 401, 'Application Tracker API strictly requires authentication', `Got ${rApps.status}`);
  }

  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

async function main() {
  console.log(`Starting Next.js production server on port ${PORT}...`);
  const server = spawn('node', ['node_modules/next/dist/bin/next', 'start', '-H', '127.0.0.1', '-p', String(PORT)], {
    stdio: 'inherit',
    env: { ...process.env, PORT: String(PORT), HOSTNAME: '127.0.0.1', ALLOW_DEV_TEST_TOKENS: 'true' },
  });

  const ready = await waitForServer(40);
  if (!ready) {
    console.error('Server failed to start within timeout');
    server.kill();
    process.exit(1);
  }

  console.log('Server is online and responding.');

  try {
    await runTests();
  } finally {
    console.log('Shutting down test server...');
    server.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
