'use strict';
// Loker Dunia API. Every route sits behind the auth middleware in server.js,
// so req.user is the Homeroom user making the call. All writes are scoped to
// that user: their own profile, their own saved jobs, and companies they own
// (or the staging-only demo companies, which belong to nobody).

const crypto = require('crypto');
const express = require('express');

const ROLES = new Set(['seeker', 'company']);
const STATUSES = new Set(['new', 'processing', 'interview', 'accepted', 'rejected']);
const CATEGORIES = new Set(['it', 'health', 'education', 'finance', 'engineering', 'creative', 'marketing', 'sales', 'hospitality', 'logistics', 'agriculture']);
const JOB_TYPES = new Set(['fulltime', 'parttime', 'internship', 'contract']);
const WORK_MODELS = new Set(['onsite', 'hybrid', 'remote']);
const PERIODS = new Set(['month', 'year', 'hour']);
const EDU = new Set(['any', 'sma', 'd3', 's1', 's2', 's3']);
const LANG_LEVELS = new Set(['basic', 'intermediate', 'fluent', 'native']);
// Uploaded files live in platform storage; only its https URL is stored here.
const FILE_URL = /^https?:\/\/[^\s"'<>]+$/;

const newId = p => p + crypto.randomBytes(8).toString('hex');
const str = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
const bool = v => v === true;
const num = (v, lo, hi) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : lo; };
const today = () => new Date().toISOString().slice(0, 10);

class HttpError extends Error { constructor(status, code) { super(code); this.status = status; this.code = code; } }

function jobOut(r) {
  return {
    id: r.id, companyId: r.company_id, title: r.title, category: r.category, country: r.country, city: r.city,
    currency: r.currency, salaryMin: Number(r.salary_min), salaryMax: Number(r.salary_max), period: r.period,
    type: r.type, model: r.model, remoteWorldwide: r.remote_worldwide, visaSponsor: r.visa_sponsor,
    relocation: r.relocation, postedAt: new Date(r.posted_at).toISOString(), required: r.required, nice: r.nice,
    minExp: Number(r.min_exp), education: r.education, languages: r.languages, description: r.description,
    qualifications: r.qualifications, benefits: r.benefits, visaNote: r.visa_note, timezone: r.timezone, isDemo: r.is_demo,
  };
}
function companyOut(r) {
  return { id: r.id, name: r.name, country: r.country, city: r.city, industry: r.industry, isDemo: r.is_demo };
}
function appOut(r) {
  return { id: r.id, jobId: r.job_id, profileId: r.profile_id, status: r.status, message: r.message,
    certIds: r.cert_ids, createdAt: new Date(r.created_at).toISOString() };
}
function certOut(c) {
  return { id: c.id, profileId: c.profile_id, name: c.name, issuer: c.issuer, issueDate: c.issue_date,
    expiryDate: c.expiry_date, verify: c.verify, skills: c.skills,
    file: c.file_url || c.file_type ? { url: c.file_url, id: c.file_id, type: c.file_type, name: c.file_name, size: c.file_size } : null };
}

// The one place a profile leaves the server. `full` is true only for the
// owner; everyone else (companies reviewing applicants, a shared link) gets
// the phone number and certificates only when the owner allows it.
function profileOut(row, skills, certs, full) {
  const showPhone = full || row.show_phone;
  const showCerts = full || row.show_certs;
  const now = today();
  const proof = name => {
    const n = name.toLowerCase();
    const cs = certs.filter(c => (c.skills || []).some(s => String(s).toLowerCase() === n));
    if (!cs.length) return 'none';
    return cs.some(c => !c.expiry_date || c.expiry_date >= now) ? 'certified' : 'expired';
  };
  return {
    id: row.id, isDemo: row.is_demo, photo: row.photo_url, fullName: row.full_name, birthDate: row.birth_date,
    gender: row.gender, country: row.country, city: row.city, nationality: row.nationality, email: row.email,
    phoneCode: showPhone ? row.phone_code : '', phone: showPhone ? row.phone : '',
    summary: row.summary, education: row.education, experience: row.experience, languages: row.languages,
    privacy: { showPhone: row.show_phone, showCerts: row.show_certs },
    certCount: certs.length,
    skills: skills.map(s => ({ id: s.id, profileId: s.profile_id, name: s.name, level: s.level, years: Number(s.years), proof: proof(s.name) })),
    certificates: showCerts ? certs.map(certOut) : [],
  };
}

async function loadProfiles(db, ids, fullFor) {
  if (!ids.length) return [];
  const [p, s, c] = await Promise.all([
    db.query('SELECT * FROM profiles WHERE id = ANY($1)', [ids]),
    db.query('SELECT * FROM skills WHERE profile_id = ANY($1) ORDER BY level DESC, years DESC, name', [ids]),
    db.query('SELECT * FROM certificates WHERE profile_id = ANY($1) ORDER BY issue_date DESC', [ids]),
  ]);
  return p.rows.map(row => profileOut(row,
    s.rows.filter(x => x.profile_id === row.id), c.rows.filter(x => x.profile_id === row.id), row.id === fullFor));
}

async function ownProfileId(db, userId) {
  const { rows } = await db.query('SELECT id FROM profiles WHERE user_id = $1', [userId]);
  return rows[0] ? rows[0].id : null;
}
async function canManage(db, userId, companyId) {
  const { rows } = await db.query('SELECT 1 FROM companies WHERE id = $1 AND (owner_user_id = $2 OR is_demo)', [companyId, userId]);
  return rows.length > 0;
}

function cleanEntries(list, max, fn) { return (Array.isArray(list) ? list : []).slice(0, max).map(fn); }
function cleanProfileBody(b) {
  const bio = b.bio || {};
  const out = {
    photo: str(bio.photo, 1000), fullName: str(bio.fullName, 120), birthDate: str(bio.birthDate, 10), gender: str(bio.gender, 10),
    country: str(bio.country, 2), city: str(bio.city, 80), nationality: str(bio.nationality, 2), email: str(bio.email, 160),
    phoneCode: str(bio.phoneCode, 2), phone: str(bio.phone, 20).replace(/\s+/g, ''), summary: str(bio.summary, 600),
    education: cleanEntries(b.education, 20, e => ({ id: str(e.id, 40) || newId('e'), level: str(e.level, 4), institution: str(e.institution, 160), major: str(e.major, 160), year: str(e.year, 4) })),
    experience: cleanEntries(b.experience, 30, x => ({ id: str(x.id, 40) || newId('x'), position: str(x.position, 120), company: str(x.company, 120), start: str(x.start, 7), end: str(x.end, 7), current: bool(x.current), description: str(x.description, 400) })),
    languages: cleanEntries(b.languages, 20, l => ({ id: str(l.id, 40) || newId('l'), code: str(l.code, 8), level: LANG_LEVELS.has(l.level) ? l.level : 'intermediate' })),
    skills: cleanEntries(b.skills, 60, s => ({ id: str(s.id, 40), name: str(s.name, 60), level: Math.round(num(s.level, 1, 3)), years: num(s.years, 0, 50) })).filter(s => s.name),
    certificates: cleanEntries(b.certificates, 30, c => {
      const f = c.file || {};
      return { id: str(c.id, 40), name: str(c.name, 160), issuer: str(c.issuer, 160), issueDate: str(c.issueDate, 10), expiryDate: str(c.expiryDate, 10),
        verify: str(c.verify, 300), skills: cleanEntries(c.skills, 20, s => str(s, 60)).filter(Boolean),
        fileUrl: FILE_URL.test(f.url || '') ? f.url : '', fileId: str(f.id, 64), fileType: str(f.type, 60), fileName: str(f.name, 160), fileSize: Math.round(num(f.size, 0, 50e6)) };
    }).filter(c => c.name && c.issuer && c.issueDate),
  };
  if (out.photo && !FILE_URL.test(out.photo)) out.photo = '';
  if (out.fullName.length < 3) throw new HttpError(400, 'invalid_name');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(out.email)) throw new HttpError(400, 'invalid_email');
  if (!out.education.length) throw new HttpError(400, 'education_required');
  if (!out.skills.length) throw new HttpError(400, 'skills_required');
  return out;
}

function cleanJobBody(b) {
  const skillList = l => cleanEntries(l, 20, s => ({ name: str(s.name, 60), level: Math.round(num(s.level, 1, 3)) })).filter(s => s.name);
  const lines = l => cleanEntries(l, 20, x => str(x, 300)).filter(Boolean);
  const j = {
    title: str(b.title, 120), category: CATEGORIES.has(b.category) ? b.category : 'it', country: str(b.country, 2).toUpperCase(),
    city: str(b.city, 80), currency: str(b.currency, 3).toUpperCase(), salaryMin: num(b.salaryMin, 0, 1e12), salaryMax: num(b.salaryMax, 0, 1e12),
    period: PERIODS.has(b.period) ? b.period : 'month', type: JOB_TYPES.has(b.type) ? b.type : 'fulltime',
    model: WORK_MODELS.has(b.model) ? b.model : 'onsite', visaSponsor: bool(b.visaSponsor), relocation: bool(b.relocation),
    required: skillList(b.required), nice: skillList(b.nice), minExp: num(b.minExp, 0, 30), education: EDU.has(b.education) ? b.education : 'any',
    languages: cleanEntries(b.languages, 10, l => ({ code: str(l.code, 8), level: LANG_LEVELS.has(l.level) ? l.level : 'intermediate' })).filter(l => l.code),
    description: str(b.description, 4000), qualifications: lines(b.qualifications), benefits: lines(b.benefits),
    visaNote: str(b.visaNote, 300), timezone: str(b.timezone, 60),
  };
  j.remoteWorldwide = bool(b.remoteWorldwide) && j.model === 'remote';
  if (!j.title || !/^[A-Z]{2}$/.test(j.country) || !j.city || !/^[A-Z]{3}$/.test(j.currency) || !j.description) throw new HttpError(400, 'invalid_job');
  if (j.salaryMax < j.salaryMin) throw new HttpError(400, 'invalid_salary');
  if (!j.required.length) throw new HttpError(400, 'required_skill_missing');
  return j;
}

function buildRouter(pool) {
  const r = express.Router();
  const wrap = fn => (req, res) => fn(req, res).catch(err => {
    if (err instanceof HttpError) return res.status(err.status).json({ error: err.code });
    console.error('[api]', req.method, req.path, err);
    res.status(500).json({ error: 'server_error' });
  });

  r.get('/bootstrap', wrap(async (req, res) => {
    const uidN = req.user.id;
    await pool.query(
      `INSERT INTO app_users (user_id, username) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET username = EXCLUDED.username`, [uidN, req.user.username || '']);
    const [me, companies, jobs, saved, demo] = await Promise.all([
      pool.query('SELECT * FROM app_users WHERE user_id = $1', [uidN]),
      pool.query('SELECT * FROM companies ORDER BY name'),
      pool.query('SELECT * FROM jobs ORDER BY posted_at DESC'),
      pool.query('SELECT job_id FROM saved_jobs WHERE user_id = $1 ORDER BY created_at DESC', [uidN]),
      pool.query(`SELECT DISTINCT c.id FROM companies c JOIN jobs j ON j.company_id = c.id JOIN applications a ON a.job_id = j.id WHERE c.is_demo`),
    ]);
    const profileId = await ownProfileId(pool, uidN);
    const [profile] = profileId ? await loadProfiles(pool, [profileId], profileId) : [];
    const apps = profileId ? await pool.query('SELECT * FROM applications WHERE profile_id = $1 ORDER BY created_at DESC', [profileId]) : { rows: [] };
    const u = me.rows[0];
    res.json({
      me: { userId: uidN, username: u.username, role: u.active_role, activeCompanyId: u.active_company_id, profileId,
        ownedCompanyIds: companies.rows.filter(c => c.owner_user_id === uidN).map(c => c.id), demoCompanyIds: demo.rows.map(x => x.id) },
      companies: companies.rows.map(companyOut), jobs: jobs.rows.map(jobOut), profile: profile || null,
      applications: apps.rows.map(appOut), savedJobIds: saved.rows.map(x => x.job_id),
    });
  }));

  r.post('/me/role', wrap(async (req, res) => {
    const role = req.body.role == null ? null : String(req.body.role);
    if (role !== null && !ROLES.has(role)) throw new HttpError(400, 'invalid_role');
    let companyId = null;
    if (role === 'company') {
      companyId = str(req.body.companyId, 40);
      if (!(await canManage(pool, req.user.id, companyId))) throw new HttpError(403, 'not_your_company');
    }
    await pool.query('UPDATE app_users SET active_role = $2, active_company_id = $3 WHERE user_id = $1', [req.user.id, role, companyId]);
    res.json({ role, activeCompanyId: companyId });
  }));

  r.post('/companies', wrap(async (req, res) => {
    const name = str(req.body.name, 120), country = str(req.body.country, 2).toUpperCase(), city = str(req.body.city, 80);
    const industry = CATEGORIES.has(req.body.industry) ? req.body.industry : 'it';
    if (!name || !/^[A-Z]{2}$/.test(country) || !city) throw new HttpError(400, 'invalid_company');
    const taken = await pool.query('SELECT 1 FROM companies WHERE lower(name) = lower($1) AND owner_user_id IS DISTINCT FROM $2 AND NOT is_demo', [name, req.user.id]);
    if (taken.rows.length) throw new HttpError(409, 'name_taken');
    const { rows } = await pool.query(
      `INSERT INTO companies (id, owner_user_id, name, country, city, industry) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [newId('co'), req.user.id, name, country, city, industry]);
    await pool.query(`UPDATE app_users SET active_role = 'company', active_company_id = $2 WHERE user_id = $1`, [req.user.id, rows[0].id]);
    res.status(201).json({ company: companyOut(rows[0]) });
  }));

  r.put('/profile', wrap(async (req, res) => {
    const p = cleanProfileBody(req.body || {});
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      let pid = await ownProfileId(client, req.user.id);
      const cols = [p.photo, p.fullName, p.birthDate, p.gender, p.country, p.city, p.nationality, p.email, p.phoneCode, p.phone, p.summary,
        JSON.stringify(p.education), JSON.stringify(p.experience), JSON.stringify(p.languages)];
      if (pid) {
        await client.query(
          `UPDATE profiles SET photo_url=$2, full_name=$3, birth_date=$4, gender=$5, country=$6, city=$7, nationality=$8, email=$9,
             phone_code=$10, phone=$11, summary=$12, education=$13, experience=$14, languages=$15, updated_at=NOW() WHERE id=$1`, [pid, ...cols]);
      } else {
        pid = newId('p');
        await client.query(
          `INSERT INTO profiles (id, user_id, photo_url, full_name, birth_date, gender, country, city, nationality, email, phone_code, phone,
             summary, education, experience, languages) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`, [pid, req.user.id, ...cols]);
      }
      // Keep the ids of certificates that already exist so applications that
      // attached them still point at them.
      const existing = new Set((await client.query('SELECT id FROM certificates WHERE profile_id = $1', [pid])).rows.map(x => x.id));
      const keep = p.certificates.map(c => existing.has(c.id) ? c.id : newId('c'));
      await client.query('DELETE FROM skills WHERE profile_id = $1', [pid]);
      await client.query('DELETE FROM certificates WHERE profile_id = $1 AND NOT (id = ANY($2))', [pid, keep]);
      for (const s of p.skills) {
        await client.query('INSERT INTO skills (id, profile_id, name, level, years) VALUES ($1,$2,$3,$4,$5)', [newId('s'), pid, s.name, s.level, s.years]);
      }
      for (const [i, c] of p.certificates.entries()) {
        await client.query(
          `INSERT INTO certificates (id, profile_id, name, issuer, issue_date, expiry_date, verify, skills, file_url, file_id, file_type, file_name, file_size)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
           ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, issuer=EXCLUDED.issuer, issue_date=EXCLUDED.issue_date, expiry_date=EXCLUDED.expiry_date,
             verify=EXCLUDED.verify, skills=EXCLUDED.skills, file_url=EXCLUDED.file_url, file_id=EXCLUDED.file_id, file_type=EXCLUDED.file_type,
             file_name=EXCLUDED.file_name, file_size=EXCLUDED.file_size`,
          [keep[i], pid, c.name, c.issuer, c.issueDate, c.expiryDate, c.verify, JSON.stringify(c.skills), c.fileUrl, c.fileId, c.fileType, c.fileName, c.fileSize]);
      }
      await client.query(`UPDATE app_users SET active_role = 'seeker', active_company_id = NULL WHERE user_id = $1`, [req.user.id]);
      await client.query('COMMIT');
      const [profile] = await loadProfiles(pool, [pid], pid);
      res.json({ profile });
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally { client.release(); }
  }));

  r.put('/profile/privacy', wrap(async (req, res) => {
    const { rows } = await pool.query(
      'UPDATE profiles SET show_phone = $2, show_certs = $3 WHERE user_id = $1 RETURNING show_phone, show_certs',
      [req.user.id, bool(req.body.showPhone), bool(req.body.showCerts)]);
    if (!rows.length) throw new HttpError(404, 'no_profile');
    res.json({ privacy: { showPhone: rows[0].show_phone, showCerts: rows[0].show_certs } });
  }));

  r.get('/profiles/:id', wrap(async (req, res) => {
    const mine = await ownProfileId(pool, req.user.id);
    const [profile] = await loadProfiles(pool, [String(req.params.id)], mine);
    if (!profile) throw new HttpError(404, 'not_found');
    res.json({ profile });
  }));

  r.post('/jobs', wrap(async (req, res) => {
    const companyId = str(req.body.companyId, 40);
    if (!(await canManage(pool, req.user.id, companyId))) throw new HttpError(403, 'not_your_company');
    const j = cleanJobBody(req.body);
    const { rows } = await pool.query(
      `INSERT INTO jobs (id, company_id, title, category, country, city, currency, salary_min, salary_max, period, type, model,
         remote_worldwide, visa_sponsor, relocation, required, nice, min_exp, education, languages, description, qualifications,
         benefits, visa_note, timezone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25) RETURNING *`,
      [newId('j'), companyId, j.title, j.category, j.country, j.city, j.currency, j.salaryMin, j.salaryMax, j.period, j.type, j.model,
        j.remoteWorldwide, j.visaSponsor, j.relocation, JSON.stringify(j.required), JSON.stringify(j.nice), j.minExp, j.education,
        JSON.stringify(j.languages), j.description, JSON.stringify(j.qualifications), JSON.stringify(j.benefits), j.visaNote, j.timezone]);
    res.status(201).json({ job: jobOut(rows[0]) });
  }));

  r.post('/jobs/:id/apply', wrap(async (req, res) => {
    const pid = await ownProfileId(pool, req.user.id);
    if (!pid) throw new HttpError(400, 'no_profile');
    const job = await pool.query('SELECT 1 FROM jobs WHERE id = $1', [String(req.params.id)]);
    if (!job.rows.length) throw new HttpError(404, 'not_found');
    const asked = Array.isArray(req.body.certIds) ? req.body.certIds.map(String).slice(0, 30) : [];
    const own = (await pool.query('SELECT id FROM certificates WHERE profile_id = $1 AND id = ANY($2)', [pid, asked])).rows.map(x => x.id);
    const { rows } = await pool.query(
      `INSERT INTO applications (id, job_id, profile_id, message, cert_ids) VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (job_id, profile_id) DO NOTHING RETURNING *`,
      [newId('a'), String(req.params.id), pid, str(req.body.message, 500), JSON.stringify(own)]);
    if (!rows.length) throw new HttpError(409, 'already_applied');
    res.status(201).json({ application: appOut(rows[0]) });
  }));

  r.put('/saved/:jobId', wrap(async (req, res) => {
    await pool.query(
      `INSERT INTO saved_jobs (user_id, job_id) SELECT $1, id FROM jobs WHERE id = $2 ON CONFLICT DO NOTHING`, [req.user.id, String(req.params.jobId)]);
    res.json({ saved: true });
  }));
  r.delete('/saved/:jobId', wrap(async (req, res) => {
    await pool.query('DELETE FROM saved_jobs WHERE user_id = $1 AND job_id = $2', [req.user.id, String(req.params.jobId)]);
    res.json({ saved: false });
  }));

  // Every application to this company's jobs, with each applicant's profile
  // filtered by that applicant's privacy settings.
  r.get('/companies/:id/applications', wrap(async (req, res) => {
    const companyId = String(req.params.id);
    if (!(await canManage(pool, req.user.id, companyId))) throw new HttpError(403, 'not_your_company');
    const { rows } = await pool.query(
      `SELECT a.* FROM applications a JOIN jobs j ON j.id = a.job_id WHERE j.company_id = $1 ORDER BY a.created_at DESC`, [companyId]);
    const profiles = await loadProfiles(pool, Array.from(new Set(rows.map(a => a.profile_id))), null);
    res.json({ applications: rows.map(appOut), profiles });
  }));

  r.patch('/applications/:id', wrap(async (req, res) => {
    const status = String(req.body.status || '');
    if (!STATUSES.has(status)) throw new HttpError(400, 'invalid_status');
    const { rows } = await pool.query(
      `UPDATE applications a SET status = $3 FROM jobs j, companies c
       WHERE a.id = $1 AND j.id = a.job_id AND c.id = j.company_id AND (c.owner_user_id = $2 OR c.is_demo)
       RETURNING a.*`, [String(req.params.id), req.user.id, status]);
    if (!rows.length) throw new HttpError(404, 'not_found');
    res.json({ application: appOut(rows[0]) });
  }));

  return r;
}

module.exports = { buildRouter, profileOut };
