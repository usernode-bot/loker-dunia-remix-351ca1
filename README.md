# Loker Dunia

A mobile-first global job board that runs on Homeroom. The interface comes in
50 languages (English by default, picked from the header's language button;
Arabic, Persian, Urdu and Hebrew lay out right to left), in light and dark mode.
Interface text lives in `public/i18n/<code>.js`, one file per language, listed
in `public/i18n/languages.js`; to add a language, copy `en.js`, translate it and
add an entry to that list. A missing key falls back to English.

- **Job seekers** build a CV-style profile in a 4-step sign-up (biodata,
  education and experience, skills and languages, certificates). Skills show
  whether a certificate proves them, and "Match My Skills" scores every
  job against the profile, weighting certified skills higher.
- **Companies** post jobs ("Post a Job"), see applicants per job with their
  match score and certificates, filter them and move them through
  New, In review, Interview, Accepted and Rejected.
- **Everyone** can search and filter jobs from every continent,
  convert salaries with static exchange rates, bookmark jobs, and browse the
  most wanted skills and jobs per country.

## How it is built

The interface is the single page `public/index.html`. All data lives in the
app's Postgres database and is served by authenticated `/api` routes
(`lib/routes.js`), scoped to the signed-in Homeroom user:

- `lib/schema.js` creates the tables on boot: `app_users`, `companies`,
  `jobs` (public) and `profiles`, `skills`, `certificates`, `applications`,
  `saved_jobs` (marked `staging:private`, so staging previews get them empty).
- Privacy is enforced on the server: a company reviewing an applicant, or
  anyone opening a shared profile, only receives the phone number and the
  certificates when the applicant allows it.
- Certificate images and profile photos are uploaded to the platform's file
  storage through the bridge; only the returned URL is stored. Platform
  storage accepts images only, so a PDF certificate is saved without its file.
- `lib/seed.js` fills staging previews (never production) with 37 sample
  jobs, 34 sample employers, 3 fake applicants and their applications. The
  demo employer "PT Nusantara Digital" can be opened from "Masuk" by any
  tester. Production starts with an empty board.

Sign-in uses the Homeroom account the app is opened with; choosing
"Pencari Kerja" or "Perusahaan" sets the role, with no passwords.

`npm test` runs the API against a real Postgres (`TEST_DATABASE_URL`, or
`INLOOP_DATABASE_URL` in Homeroom build workers) on a throwaway database.
Tailwind is precompiled by `npm run build` during the image build.
