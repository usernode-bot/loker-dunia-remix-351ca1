'use strict';
// End-to-end API tests against a real Postgres. Each run creates a throwaway
// database, boots server.js on it in staging mode, and signs test identities
// with a keypair generated here (never a platform key).
//
//   TEST_DATABASE_URL=postgres://user:pass@host:5432/postgres npm test
//
// INLOOP_DATABASE_URL (set in Homeroom build workers) is used when
// TEST_DATABASE_URL is absent. With neither, the suite is skipped.

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const path = require('path');
const { spawn } = require('child_process');
const jwt = require('jsonwebtoken');
const { Client, Pool } = require('pg');

const BASE_URL = process.env.TEST_DATABASE_URL || process.env.INLOOP_DATABASE_URL;
const APP_ID = '4242';
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048, publicKeyEncoding: { type: 'spki', format: 'pem' }, privateKeyEncoding: { type: 'pkcs8', format: 'pem' } });

function token(id, username) {
  return jwt.sign({ id, username, usernode_pubkey: null, locale: null, pur: 'iframe' }, privateKey,
    { algorithm: 'RS256', issuer: 'usernode', audience: 'usernode:app:' + APP_ID, expiresIn: '1h' });
}

let dbUrl, dbName, server, port;

async function call(user, method, p, body) {
  const headers = { 'content-type': 'application/json' };
  if (user) headers['x-usernode-token'] = token(user.id, user.username);
  const res = await fetch(`http://127.0.0.1:${port}/api${p}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await res.json(); } catch (e) {}
  return { status: res.status, data };
}

function startServer() {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
      env: { ...process.env, PORT: String(port), DATABASE_URL: dbUrl, USERNODE_ENV: 'staging', USERNODE_APP_ID: APP_ID, USERNODE_JWT_PUBLIC_KEY: publicKey },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let log = '';
    const onData = d => { log += d; if (/Listening on/.test(log)) resolve(child); };
    child.stdout.on('data', onData); child.stderr.on('data', onData);
    child.on('exit', code => reject(new Error('server exited ' + code + '\n' + log)));
  });
}

const seeker = { id: 101, username: 'test-seeker' };
const employer = { id: 202, username: 'test-employer' };
const stranger = { id: 303, username: 'test-stranger' };
const profileBody = (overrides) => ({
  bio: { photo: '', fullName: 'Test Seeker', birthDate: '1995-05-05', gender: 'female', country: 'ID', city: 'Bandung', nationality: 'ID',
    email: 'seeker@example.com', phoneCode: 'ID', phone: '81200001111', summary: 'Pengembang web dengan pengalaman membangun aplikasi React.' },
  education: [{ level: 's1', institution: 'Universitas Contoh', major: 'Informatika', year: '2017' }],
  experience: [], languages: [{ code: 'id', level: 'native' }],
  skills: [{ name: 'React', level: 3, years: 4 }, { name: 'TypeScript', level: 2, years: 2 }],
  certificates: [{ name: 'React Developer', issuer: 'Contoh Academy', issueDate: '2022-01-01', expiryDate: '', verify: 'RD-1', skills: ['React'],
    file: { url: 'https://platform.example/app-files/abc123', id: 'abc123', type: 'image/png', name: 'react.png', size: 1234 } }],
  ...overrides,
});

test('Loker Dunia API on Postgres', { skip: !BASE_URL && 'no TEST_DATABASE_URL or INLOOP_DATABASE_URL' }, async (t) => {
  dbName = 'lokerdunia_test_' + crypto.randomBytes(4).toString('hex');
  const admin = new Client({ connectionString: BASE_URL });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${dbName}`);
  const u = new URL(BASE_URL); u.pathname = '/' + dbName; dbUrl = u.toString();
  port = 3900 + Math.floor(Math.random() * 500);
  server = await startServer();

  t.after(async () => {
    server.kill('SIGTERM');
    await new Promise(r => server.once('exit', r));
    await admin.query(`DROP DATABASE IF EXISTS ${dbName}`);
    await admin.end();
  });

  await t.test('unauthenticated API calls are refused', async () => {
    assert.equal((await call(null, 'GET', '/bootstrap')).status, 401);
  });

  await t.test('staging seed provides the sample board and demo employer', async () => {
    const { status, data } = await call(stranger, 'GET', '/bootstrap');
    assert.equal(status, 200);
    assert.equal(data.jobs.length, 37);
    assert.ok(data.me.demoCompanyIds.includes('nusantara'));
    assert.equal(data.profile, null, 'nobody is seeded as the visitor');
  });

  await t.test('seeding twice is idempotent', async () => {
    const { migrate } = require('../lib/schema');
    const { seedStaging } = require('../lib/seed');
    const pool = new Pool({ connectionString: dbUrl });
    await migrate(pool); await seedStaging(pool);
    const { rows } = await pool.query('SELECT (SELECT COUNT(*) FROM jobs)::int AS jobs, (SELECT COUNT(*) FROM applications)::int AS apps, (SELECT COUNT(*) FROM profiles)::int AS profiles');
    await pool.end();
    assert.deepEqual(rows[0], { jobs: 37, apps: 7, profiles: 3 });
  });

  await t.test('personal tables are marked staging:private', async () => {
    const pool = new Pool({ connectionString: dbUrl });
    const { rows } = await pool.query(`SELECT c.relname FROM pg_class c JOIN pg_description d ON d.objoid = c.oid AND d.objsubid = 0
      WHERE d.description = 'staging:private' ORDER BY 1`);
    await pool.end();
    assert.deepEqual(rows.map(r => r.relname), ['applications', 'certificates', 'profiles', 'saved_jobs', 'skills']);
  });

  let companyId, jobId, certId;
  await t.test('an employer creates a company and posts a job', async () => {
    const c = await call(employer, 'POST', '/companies', { name: 'Test Employer Ltd', country: 'ID', city: 'Jakarta', industry: 'it' });
    assert.equal(c.status, 201);
    companyId = c.data.company.id;
    const j = await call(employer, 'POST', '/jobs', { companyId, title: 'React Developer', category: 'it', country: 'ID', city: 'Jakarta', currency: 'IDR',
      salaryMin: 10e6, salaryMax: 15e6, period: 'month', type: 'fulltime', model: 'hybrid', required: [{ name: 'React', level: 2 }], nice: [],
      languages: [{ code: 'id', level: 'fluent' }], description: 'Bangun aplikasi web.', qualifications: [], benefits: [] });
    assert.equal(j.status, 201);
    jobId = j.data.job.id;
    assert.equal((await call(stranger, 'POST', '/jobs', { ...j.data.job, companyId })).status, 403, 'only the owner posts for a company');
    assert.equal((await call(stranger, 'POST', '/companies', { name: 'test employer ltd', country: 'ID', city: 'Jakarta' })).status, 409);
  });

  await t.test('a seeker saves a profile and applies with a certificate', async () => {
    const bad = await call(seeker, 'PUT', '/profile', profileBody({ bio: { ...profileBody().bio, photo: 'data:image/png;base64,AAAA' } }));
    assert.equal(bad.status, 200);
    assert.equal(bad.data.profile.photo, '', 'image bytes are never stored, only storage URLs');
    const p = await call(seeker, 'PUT', '/profile', profileBody());
    assert.equal(p.status, 200);
    certId = p.data.profile.certificates[0].id;
    assert.equal(p.data.profile.skills.find(s => s.name === 'React').proof, 'certified');
    const a = await call(seeker, 'POST', `/jobs/${jobId}/apply`, { certIds: [certId, 'someone-elses-cert'], message: 'Halo' });
    assert.equal(a.status, 201);
    assert.deepEqual(a.data.application.certIds, [certId]);
    assert.equal((await call(seeker, 'POST', `/jobs/${jobId}/apply`, { certIds: [] })).status, 409);
    // Re-saving keeps the certificate id the application points at.
    const again = await call(seeker, 'PUT', '/profile', profileBody({ certificates: [{ ...profileBody().certificates[0], id: certId }] }));
    assert.equal(again.data.profile.certificates[0].id, certId);
  });

  await t.test('the employer sees the application from another account, with privacy enforced', async () => {
    let r = await call(employer, 'GET', `/companies/${companyId}/applications`);
    assert.equal(r.status, 200);
    assert.equal(r.data.applications.length, 1);
    let prof = r.data.profiles[0];
    assert.equal(prof.fullName, 'Test Seeker');
    assert.equal(prof.phone, '81200001111');
    assert.equal(prof.certificates.length, 1);

    assert.equal((await call(seeker, 'PUT', '/profile/privacy', { showPhone: false, showCerts: false })).status, 200);
    r = await call(employer, 'GET', `/companies/${companyId}/applications`);
    prof = r.data.profiles[0];
    assert.equal(prof.phone, '', 'phone hidden by the candidate');
    assert.deepEqual(prof.certificates, [], 'certificates hidden by the candidate');
    assert.equal(prof.certCount, 1);
    assert.equal(prof.skills.find(s => s.name === 'React').proof, 'certified');
    const shared = await call(stranger, 'GET', `/profiles/${prof.id}`);
    assert.equal(shared.data.profile.phone, '');
    const own = await call(seeker, 'GET', `/profiles/${prof.id}`);
    assert.equal(own.data.profile.phone, '81200001111', 'the owner always sees everything');
  });

  await t.test('only the employer can read or change those applications', async () => {
    assert.equal((await call(stranger, 'GET', `/companies/${companyId}/applications`)).status, 403);
    const { data } = await call(employer, 'GET', `/companies/${companyId}/applications`);
    const appId = data.applications[0].id;
    assert.equal((await call(stranger, 'PATCH', `/applications/${appId}`, { status: 'accepted' })).status, 404);
    assert.equal((await call(employer, 'PATCH', `/applications/${appId}`, { status: 'interview' })).status, 200);
    const mine = await call(seeker, 'GET', '/bootstrap');
    assert.equal(mine.data.applications[0].status, 'interview', 'the seeker sees the new status');
  });

  await t.test('the demo employer shows the 3 seeded applicants with their privacy settings', async () => {
    const { status, data } = await call(stranger, 'GET', '/companies/nusantara/applications');
    assert.equal(status, 200);
    assert.equal(new Set(data.applications.map(a => a.profileId)).size, 3);
    const amara = data.profiles.find(p => p.fullName === 'Amara Okafor');
    assert.equal(amara.phone, '');
    const ayu = data.profiles.find(p => p.fullName === 'Ayu Kartika Sari');
    assert.deepEqual(ayu.certificates, []);
    assert.equal(ayu.certCount, 2);
  });

  await t.test('saved jobs are stored per user', async () => {
    assert.equal((await call(seeker, 'PUT', `/saved/${jobId}`)).status, 200);
    assert.deepEqual((await call(seeker, 'GET', '/bootstrap')).data.savedJobIds, [jobId]);
    assert.deepEqual((await call(stranger, 'GET', '/bootstrap')).data.savedJobIds, []);
    await call(seeker, 'DELETE', `/saved/${jobId}`);
    assert.deepEqual((await call(seeker, 'GET', '/bootstrap')).data.savedJobIds, []);
  });
});
