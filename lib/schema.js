// Database schema for Loker Dunia. Applied idempotently on every boot.
//
// Public tables (copied to staging with their rows): app_users, companies, jobs.
// Private tables (staging gets the schema only): profiles, skills,
// certificates, applications, saved_jobs. They hold personal data: contact
// details, CVs, certificate files and who applied where.

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS app_users (
    user_id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    active_role TEXT,
    active_company_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS companies (
    id TEXT PRIMARY KEY,
    owner_user_id INTEGER,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    industry TEXT NOT NULL DEFAULT 'it',
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS companies_owner_idx ON companies (owner_user_id)`,
  `CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    currency TEXT NOT NULL,
    salary_min NUMERIC NOT NULL,
    salary_max NUMERIC NOT NULL,
    period TEXT NOT NULL,
    type TEXT NOT NULL,
    model TEXT NOT NULL,
    remote_worldwide BOOLEAN NOT NULL DEFAULT FALSE,
    visa_sponsor BOOLEAN NOT NULL DEFAULT FALSE,
    relocation BOOLEAN NOT NULL DEFAULT FALSE,
    required JSONB NOT NULL DEFAULT '[]',
    nice JSONB NOT NULL DEFAULT '[]',
    min_exp NUMERIC NOT NULL DEFAULT 0,
    education TEXT NOT NULL DEFAULT 'any',
    languages JSONB NOT NULL DEFAULT '[]',
    description TEXT NOT NULL DEFAULT '',
    qualifications JSONB NOT NULL DEFAULT '[]',
    benefits JSONB NOT NULL DEFAULT '[]',
    visa_note TEXT NOT NULL DEFAULT '',
    timezone TEXT NOT NULL DEFAULT '',
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS jobs_company_idx ON jobs (company_id)`,
  `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    user_id INTEGER UNIQUE,
    is_demo BOOLEAN NOT NULL DEFAULT FALSE,
    photo_url TEXT NOT NULL DEFAULT '',
    full_name TEXT NOT NULL,
    birth_date TEXT NOT NULL DEFAULT '',
    gender TEXT NOT NULL DEFAULT '',
    country TEXT NOT NULL DEFAULT '',
    city TEXT NOT NULL DEFAULT '',
    nationality TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL DEFAULT '',
    phone_code TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    summary TEXT NOT NULL DEFAULT '',
    education JSONB NOT NULL DEFAULT '[]',
    experience JSONB NOT NULL DEFAULT '[]',
    languages JSONB NOT NULL DEFAULT '[]',
    show_phone BOOLEAN NOT NULL DEFAULT TRUE,
    show_certs BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `COMMENT ON TABLE profiles IS 'staging:private'`,
  `CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    level INTEGER NOT NULL,
    years NUMERIC NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS skills_profile_idx ON skills (profile_id)`,
  `COMMENT ON TABLE skills IS 'staging:private'`,
  `CREATE TABLE IF NOT EXISTS certificates (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    issuer TEXT NOT NULL,
    issue_date TEXT NOT NULL,
    expiry_date TEXT NOT NULL DEFAULT '',
    verify TEXT NOT NULL DEFAULT '',
    skills JSONB NOT NULL DEFAULT '[]',
    file_url TEXT NOT NULL DEFAULT '',
    file_id TEXT NOT NULL DEFAULT '',
    file_type TEXT NOT NULL DEFAULT '',
    file_name TEXT NOT NULL DEFAULT '',
    file_size INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE INDEX IF NOT EXISTS certificates_profile_idx ON certificates (profile_id)`,
  `COMMENT ON TABLE certificates IS 'staging:private'`,
  `CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    profile_id TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'new',
    message TEXT NOT NULL DEFAULT '',
    cert_ids JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (job_id, profile_id)
  )`,
  `CREATE INDEX IF NOT EXISTS applications_profile_idx ON applications (profile_id)`,
  `COMMENT ON TABLE applications IS 'staging:private'`,
  `CREATE TABLE IF NOT EXISTS saved_jobs (
    user_id INTEGER NOT NULL,
    job_id TEXT NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, job_id)
  )`,
  `COMMENT ON TABLE saved_jobs IS 'staging:private'`,
];

async function migrate(pool) {
  for (const sql of STATEMENTS) await pool.query(sql);
}

module.exports = { migrate };
