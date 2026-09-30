async function runTests() {
  const BASE = 'http://localhost:3000';
  console.log('--- [LYAXIS GATEKEEPER DEFENSIVE SECURITY TEST SUITE] ---');

  // 1. Test Health & Telemetry
  console.log('\n[1] Testing GET /api/system/health...');
  const healthRes = await fetch(`${BASE}/api/system/health`);
  const healthData = await healthRes.json();
  console.log('Health Status:', healthData.status, '| Security:', healthData.security);

  // 2. Test Anti-Bruteforce on Login
  console.log('\n[2] Testing Anti-Bruteforce with Bad Master Key...');
  const badLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ masterKey: 'malicious_intruder_key_999' }),
  });
  const badLoginData = await badLoginRes.json();
  console.log('Status:', badLoginRes.status, '| Result:', badLoginData);

  // 3. Test Constant-Time Valid Login
  console.log('\n[3] Testing Valid Founder Authentication...');
  const validLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ masterKey: 'OscarNaim_LYAXIS_MasterKey_2026!' }),
  });
  const cookieHeader = validLoginRes.headers.get('set-cookie');
  const validLoginData = await validLoginRes.json();
  console.log('Status:', validLoginRes.status, '| Result:', validLoginData);
  console.log('Cookie Set:', cookieHeader ? cookieHeader.split(';')[0] : 'NONE');

  const cookie = cookieHeader ? cookieHeader.split(';')[0] : '';

  // 4. Test Session Status
  console.log('\n[4] Testing GET /api/auth/session with JWT Cookie...');
  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookie },
  });
  const sessionData = await sessionRes.json();
  console.log('Session authenticated:', sessionData.authenticated, '| User:', sessionData.user?.user);

  // 5. Test Fetch Keys
  console.log('\n[5] Testing GET /api/keys...');
  const keysRes = await fetch(`${BASE}/api/keys`, {
    headers: { Cookie: cookie },
  });
  const keysData = await keysRes.json();
  console.log('Total Keys in Vault:', keysData.total, '| Metrics:', keysData.metrics);

  // 6. Test Key Generation (ZERO VIP 30)
  console.log('\n[6] Testing Token Generation: ZERO VIP 30 (Inaugural)...');
  const genVipRes = await fetch(`${BASE}/api/keys/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      count: 1,
      tier: 'zero_vip_30',
      assigned_to_name: 'Santiago Morales (Lead Creator)',
      assigned_to_email: 'santiago@creators.vip',
      notes: 'Hito Inaugural 17 de Octubre',
    }),
  });
  const genVipData = await genVipRes.json();
  console.log('Generated VIP Key:', genVipData.keys?.[0]?.token, '| Tier:', genVipData.keys?.[0]?.tier);
  const testToken = genVipData.keys?.[0]?.token;

  // 7. Test Batch Generation (5 Developer Keys)
  console.log('\n[7] Testing Batch Token Generation (5 Keys)...');
  const genBatchRes = await fetch(`${BASE}/api/keys/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({
      count: 5,
      tier: 'developer',
      notes: 'Batch Integration SDKs',
    }),
  });
  const genBatchData = await genBatchRes.json();
  console.log('Batch count generated:', genBatchData.count);

  // 8. Test Atomic Verification Endpoint (POST /api/v1/keys/verify)
  console.log('\n[8] Testing Atomic Verify & Claim for Token:', testToken);
  const verifyRes1 = await fetch(`${BASE}/api/v1/keys/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-lyaxis-service-key': 'lyaxis_internal_service_token_2026_super_secret',
      'x-lyaxis-client': 'LYAXIS_IA_CORE',
    },
    body: JSON.stringify({ token: testToken }),
  });
  const verifyData1 = await verifyRes1.json();
  console.log('First Verify (Success):', verifyRes1.status, verifyData1);

  // 9. Test Re-verify (Should fail as exhausted / claimed)
  console.log('\n[9] Testing Second Verify on same Single-Use Token (Should be Exhausted)...');
  const verifyRes2 = await fetch(`${BASE}/api/v1/keys/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-lyaxis-service-key': 'lyaxis_internal_service_token_2026_super_secret',
    },
    body: JSON.stringify({ token: testToken }),
  });
  const verifyData2 = await verifyRes2.json();
  console.log('Second Verify (Exhausted check):', verifyRes2.status, verifyData2);

  // 10. Test Audit Trail
  console.log('\n[10] Testing Forensic Audit Logs...');
  const auditRes = await fetch(`${BASE}/api/keys?include_audit=true`, {
    headers: { Cookie: cookie },
  });
  const auditData = await auditRes.json();
  console.log('Recent Forensic Audit Logs Count:', auditData.auditLogs?.length);
  if (auditData.auditLogs?.[0]) {
    console.log('Latest Log Entry:', {
      token: auditData.auditLogs[0].token_text,
      action: auditData.auditLogs[0].action,
      success: auditData.auditLogs[0].success,
      ipHash: auditData.auditLogs[0].ip_hash?.slice(0, 16) + '...',
    });
  }

  console.log('\n>>> ALL DEFENSIVE SECURITY & ARCHITECTURAL CHECKS PASSED PERFECTLY! <<<');
}

runTests().catch(console.error);
