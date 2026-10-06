'use strict';
// Staging-only sample data for Loker Dunia: 34 employers, 37 jobs on six
// continents, 3 fake applicants with certificates and their applications.
// Every row is flagged is_demo and owned by no real user. seedStaging() is
// idempotent (ON CONFLICT DO NOTHING) and server.js only calls it when
// USERNODE_ENV is 'staging', so production data is never touched.

const COUNTRY_TZ = {
  ID: 'WIB (UTC+7)', SG: 'SGT (UTC+8)', JP: 'JST (UTC+9)', DE: 'CET (UTC+1)', GB: 'GMT (UTC+0)',
  US: 'ET (UTC-5)', CA: 'ET (UTC-5)', AU: 'AEST (UTC+10)', AE: 'GST (UTC+4)', BR: 'BRT (UTC-3)',
  NG: 'WAT (UTC+1)', KE: 'EAT (UTC+3)', IN: 'IST (UTC+5:30)', NL: 'CET (UTC+1)', MY: 'MYT (UTC+8)',
  EE: 'EET (UTC+2)', PH: 'PHT (UTC+8)', KR: 'KST (UTC+9)', ZA: 'SAST (UTC+2)', CH: 'CET (UTC+1)',
  MX: 'CST (UTC-6)',
};
const DAY = 86400000;

// Sample employers. `nusantara` already has applicants, so its dashboard
// is never empty in a staging preview.
const SEED_COMPANIES = [
  ['nusantara', 'PT Nusantara Digital', 'ID', 'Jakarta', 'it'],
  ['harapan', 'RS Harapan Sehat', 'ID', 'Surabaya', 'health'],
  ['serenity', 'Bali Serenity Resort', 'ID', 'Denpasar', 'hospitality'],
  ['lumina', 'Lumina Analytics', 'SG', 'Singapore', 'it'],
  ['straits', 'Straits Capital', 'SG', 'Singapore', 'finance'],
  ['sakura', 'Sakura Mobility K.K.', 'JP', 'Tokyo', 'it'],
  ['kansai', 'Kansai Language School', 'JP', 'Osaka', 'education'],
  ['spree', 'Spree Cloud GmbH', 'DE', 'Berlin', 'it'],
  ['alpenwerk', 'Alpenwerk AG', 'DE', 'München', 'engineering'],
  ['thames', 'Thames Fintech Ltd', 'GB', 'London', 'finance'],
  ['northbridge', 'Northbridge Health NHS Trust', 'GB', 'Manchester', 'health'],
  ['goldengate', 'Golden Gate AI', 'US', 'San Francisco', 'it'],
  ['hudson', 'Hudson Creative Studio', 'US', 'New York', 'creative'],
  ['lonestar', 'Lone Star SaaS', 'US', 'Austin', 'sales'],
  ['mapleleaf', 'Maple Leaf Commerce', 'CA', 'Toronto', 'it'],
  ['pacific', 'Pacific Learning Academy', 'CA', 'Vancouver', 'education'],
  ['harbour', 'Harbour Infrastructure Pty Ltd', 'AU', 'Sydney', 'engineering'],
  ['laneway', 'Laneway Coffee Co.', 'AU', 'Melbourne', 'hospitality'],
  ['desertpearl', 'Desert Pearl Hospitality', 'AE', 'Dubai', 'hospitality'],
  ['gulfhorizon', 'Gulf Horizon Holdings', 'AE', 'Abu Dhabi', 'finance'],
  ['paulista', 'Paulista Pagamentos', 'BR', 'São Paulo', 'it'],
  ['carioca', 'Carioca Media', 'BR', 'Rio de Janeiro', 'marketing'],
  ['ekopay', 'Eko Pay', 'NG', 'Lagos', 'it'],
  ['savannah', 'Savannah Health Initiative', 'NG', 'Abuja', 'health'],
  ['riftvalley', 'Rift Valley AgriTech', 'KE', 'Nairobi', 'agriculture'],
  ['indus', 'Indus Softworks', 'IN', 'Bengaluru', 'it'],
  ['canal', 'Canal Logistics B.V.', 'NL', 'Amsterdam', 'logistics'],
  ['twintowers', 'Twin Towers Media', 'MY', 'Kuala Lumpur', 'creative'],
  ['balticdocs', 'Baltic Docs OÜ', 'EE', 'Tallinn', 'it'],
  ['pearl', 'Pearl Outsourcing Inc.', 'PH', 'Manila', 'sales'],
  ['hanriver', 'Han River Commerce', 'KR', 'Seoul', 'it'],
  ['tablemountain', 'Table Mountain Labs', 'ZA', 'Cape Town', 'creative'],
  ['lakeview', 'Lakeview Pharma AG', 'CH', 'Zürich', 'health'],
  ['aztec', 'Aztec Growth', 'MX', 'Mexico City', 'sales'],
].map(([id, name, country, city, industry]) => ({ id, name, country, city, industry }));

// Sample jobs. req/nice are "Skill:level" lists (1 Pemula, 2 Menengah, 3 Mahir);
// langs are "code:level"; days = posted N days ago.
const SEED_JOBS = [
  { id: 'j1', co: 'nusantara', c: 'ID', city: 'Jakarta', title: 'Senior Backend Engineer', cat: 'it', cur: 'IDR', min: 25e6, max: 40e6, per: 'month', type: 'fulltime', model: 'hybrid', days: 1,
    req: 'Go:3|PostgreSQL:2|Docker:2|REST API:3', nice: 'Kubernetes:2|AWS:1|Redis:2', exp: 4, edu: 's1', langs: 'id:fluent|en:intermediate',
    desc: 'Bangun layanan pembayaran dan katalog yang melayani jutaan transaksi per hari. Kamu akan merancang API, menjaga performa basis data, dan membimbing engineer junior.',
    quals: ['Minimal 4 tahun membangun layanan backend di produksi', 'Paham desain basis data relasional dan optimasi query', 'Terbiasa dengan code review dan pengujian otomatis'],
    ben: ['BPJS Kesehatan dan asuransi swasta', 'Kerja hybrid 3 hari di kantor', 'Anggaran belajar Rp 10 juta per tahun'] },
  { id: 'j2', co: 'nusantara', c: 'ID', city: 'Bandung', title: 'Frontend Developer (React)', cat: 'it', cur: 'IDR', min: 12e6, max: 20e6, per: 'month', type: 'fulltime', model: 'onsite', days: 3,
    req: 'React:3|TypeScript:2|JavaScript:3|CSS:2', nice: 'Next.js:2|Figma:1|Git:2', exp: 2, edu: 's1', langs: 'id:fluent|en:basic',
    desc: 'Kembangkan dasbor merchant dan aplikasi web pelanggan yang cepat dan mudah diakses. Bekerja dekat dengan tim desain di studio Bandung.',
    quals: ['Minimal 2 tahun pengalaman React', 'Paham aksesibilitas web dan desain responsif', 'Portofolio proyek web yang bisa dilihat'],
    ben: ['Makan siang gratis', 'Laptop kerja', 'Bonus kinerja tahunan'] },
  { id: 'j3', co: 'nusantara', c: 'ID', city: 'Yogyakarta', title: 'UI/UX Designer', cat: 'creative', cur: 'IDR', min: 9e6, max: 15e6, per: 'month', type: 'fulltime', model: 'hybrid', days: 5,
    req: 'Figma:3|UI Design:3|UX Research:2|Prototyping:2', nice: 'HTML:1|CSS:1|Usability Testing:2', exp: 2, edu: 's1', langs: 'id:fluent|en:intermediate',
    desc: 'Rancang alur aplikasi pembayaran yang sederhana untuk pengguna di seluruh Indonesia. Kamu akan memimpin riset pengguna dan menjaga design system.',
    quals: ['Portofolio studi kasus produk digital', 'Pengalaman melakukan wawancara dan uji kegunaan', 'Mampu presentasi ke pemangku kepentingan'],
    ben: ['Kerja hybrid', 'Langganan alat desain', 'Cuti 18 hari'] },
  { id: 'j4', co: 'harapan', c: 'ID', city: 'Surabaya', title: 'Perawat ICU', cat: 'health', cur: 'IDR', min: 7e6, max: 11e6, per: 'month', type: 'fulltime', model: 'onsite', days: 2,
    req: 'Keperawatan:3|Perawatan Intensif:2|BLS/CPR:3', nice: 'ACLS:2|Rekam Medis Elektronik:1', exp: 2, edu: 'd3', langs: 'id:fluent',
    desc: 'Bergabung dengan unit perawatan intensif dewasa berkapasitas 20 tempat tidur. Memberikan asuhan keperawatan dan berkoordinasi dengan dokter jaga.',
    quals: ['STR aktif', 'Minimal 2 tahun di ICU atau IGD', 'Bersedia bekerja dalam sistem shift'],
    ben: ['Tunjangan shift malam', 'BPJS Kesehatan dan Ketenagakerjaan', 'Pelatihan ACLS dibiayai'] },
  { id: 'j5', co: 'serenity', c: 'ID', city: 'Denpasar', title: 'Guest Relations Officer', cat: 'hospitality', cur: 'IDR', min: 6e6, max: 9e6, per: 'month', type: 'fulltime', model: 'onsite', days: 6, relo: 1, tz: 'WITA (UTC+8)',
    req: 'Layanan Pelanggan:3|Penanganan Keluhan:2|Manajemen Reservasi:2', nice: 'Opera PMS:1|Komunikasi:2', exp: 1, edu: 'd3', langs: 'en:fluent|id:fluent|ja:basic',
    desc: 'Sambut tamu internasional dan pastikan pengalaman menginap yang berkesan. Menangani permintaan khusus, keluhan, dan koordinasi antar departemen.',
    quals: ['Lulusan perhotelan atau pariwisata', 'Bahasa Inggris lancar', 'Ramah dan tenang di bawah tekanan'],
    ben: ['Akomodasi staf', 'Service charge bulanan', 'Makan saat bertugas'] },
  { id: 'j6', co: 'lumina', c: 'SG', city: 'Singapore', title: 'Data Scientist', cat: 'it', cur: 'SGD', min: 7000, max: 10000, per: 'month', type: 'fulltime', model: 'hybrid', days: 2, visa: 1,
    req: 'Python:3|Machine Learning:3|SQL:2|Statistics:3', nice: 'TensorFlow:2|Spark:1|Data Visualization:2', exp: 3, edu: 's2', langs: 'en:fluent',
    desc: 'Bangun model prediksi permintaan untuk klien ritel di Asia Tenggara. Kamu akan bekerja dari eksplorasi data hingga model berjalan di produksi.',
    quals: ['S2 bidang kuantitatif atau pengalaman setara', 'Pengalaman membawa model ML ke produksi', 'Mampu menjelaskan hasil ke klien non-teknis'],
    ben: ['Bantuan Employment Pass', 'Asuransi kesehatan keluarga', 'Bonus tahunan 2 bulan'] },
  { id: 'j7', co: 'straits', c: 'SG', city: 'Singapore', title: 'Financial Analyst', cat: 'finance', cur: 'SGD', min: 6000, max: 8500, per: 'month', type: 'fulltime', model: 'onsite', days: 9,
    req: 'Financial Modeling:3|Excel:3|Valuation:2|Bloomberg Terminal:2', nice: 'Power BI:1|Data Analysis:2', exp: 2, edu: 's1', langs: 'en:fluent|zh:intermediate',
    desc: 'Analisis peluang investasi di pasar ASEAN dan siapkan memo untuk komite investasi. Bekerja dengan tim portofolio senior.',
    quals: ['Gelar keuangan, ekonomi, atau akuntansi', 'Kandidat CFA menjadi nilai plus', 'Teliti dan kuat dalam analisis angka'],
    ben: ['Bonus kinerja', 'Dukungan ujian CFA', 'Asuransi kesehatan'] },
  { id: 'j8', co: 'sakura', c: 'JP', city: 'Tokyo', title: 'iOS Engineer', cat: 'it', cur: 'JPY', min: 7e6, max: 10e6, per: 'year', type: 'fulltime', model: 'hybrid', days: 4, visa: 1, relo: 1,
    req: 'Swift:3|iOS:3|REST API:2|Git:2', nice: 'Kotlin:1|CI/CD:1', exp: 3, edu: 's1', langs: 'en:fluent|ja:basic',
    desc: 'Kembangkan aplikasi mobilitas yang dipakai komuter di seluruh Jepang. Tim internasional dengan bahasa kerja Inggris.',
    quals: ['Minimal 3 tahun pengembangan iOS', 'Pernah merilis aplikasi di App Store', 'Mau belajar bahasa Jepang'],
    ben: ['Sponsor visa kerja', 'Paket relokasi dan apartemen sementara', 'Kursus bahasa Jepang gratis'] },
  { id: 'j9', co: 'kansai', c: 'JP', city: 'Osaka', title: 'English Teacher', cat: 'education', cur: 'JPY', min: 250000, max: 300000, per: 'month', type: 'contract', model: 'onsite', days: 12, visa: 1,
    req: 'Pengajaran Bahasa Inggris:2|Manajemen Kelas:2|Public Speaking:2', nice: 'Desain Kurikulum:1|Pendidikan Anak:1', exp: 1, edu: 's1', langs: 'en:native|ja:basic',
    desc: 'Mengajar bahasa Inggris untuk anak dan orang dewasa dalam kelas kecil. Kontrak 12 bulan dengan opsi perpanjangan.',
    quals: ['Gelar sarjana bidang apa pun', 'Sertifikat TEFL atau TESOL', 'Penutur asli atau setara C2'],
    ben: ['Sponsor visa', 'Bantuan mencari tempat tinggal', 'Tiket pesawat di akhir kontrak'] },
  { id: 'j10', co: 'spree', c: 'DE', city: 'Berlin', title: 'DevOps Engineer', cat: 'it', cur: 'EUR', min: 65000, max: 85000, per: 'year', type: 'fulltime', model: 'remote', days: 3, visa: 1,
    req: 'Kubernetes:3|Terraform:2|AWS:2|CI/CD:3|Linux:3', nice: 'Go:1|Prometheus:2', exp: 3, edu: 's1', langs: 'en:fluent|de:basic',
    desc: 'Kelola platform cloud yang menjalankan ratusan layanan pelanggan. Remote di zona waktu Eropa dengan pertemuan tim tiap kuartal di Berlin.',
    quals: ['Pengalaman mengelola klaster Kubernetes di produksi', 'Infrastructure as code dengan Terraform', 'Siap ikut rotasi on-call'],
    ben: ['30 hari cuti', 'Bantuan Blue Card EU', 'Anggaran perangkat kerja rumah'] },
  { id: 'j11', co: 'alpenwerk', c: 'DE', city: 'München', title: 'Mechanical Design Engineer', cat: 'engineering', cur: 'EUR', min: 58000, max: 72000, per: 'year', type: 'fulltime', model: 'onsite', days: 15, relo: 1,
    req: 'SolidWorks:3|CAD:3|FEA:2|GD&T:2', nice: 'Six Sigma:1|Python:1', exp: 3, edu: 's1', langs: 'de:intermediate|en:fluent',
    desc: 'Rancang komponen untuk mesin pengemasan otomatis. Dari konsep, simulasi, hingga dukungan produksi.',
    quals: ['Gelar teknik mesin', 'Pengalaman desain produk industri', 'Bahasa Jerman minimal B1'],
    ben: ['Bantuan relokasi', 'Tiket transportasi umum', 'Program pensiun perusahaan'] },
  { id: 'j12', co: 'thames', c: 'GB', city: 'London', title: 'Product Manager', cat: 'it', cur: 'GBP', min: 70000, max: 90000, per: 'year', type: 'fulltime', model: 'hybrid', days: 2, visa: 1,
    req: 'Product Management:3|Agile:2|Data Analysis:2|Stakeholder Management:3', nice: 'SQL:1|Figma:1', exp: 5, edu: 's1', langs: 'en:fluent',
    desc: 'Pimpin produk tabungan digital untuk 2 juta pengguna. Tentukan peta jalan bersama tim engineering, desain, dan kepatuhan.',
    quals: ['Minimal 5 tahun sebagai product manager', 'Pengalaman produk keuangan atau regulasi', 'Terbiasa mengambil keputusan berbasis data'],
    ben: ['Sponsor Skilled Worker visa', 'Saham karyawan', 'Asuransi kesehatan privat'] },
  { id: 'j13', co: 'northbridge', c: 'GB', city: 'Manchester', title: 'Registered Nurse', cat: 'health', cur: 'GBP', min: 29000, max: 36000, per: 'year', type: 'fulltime', model: 'onsite', days: 7, visa: 1, relo: 1,
    req: 'Keperawatan:3|BLS/CPR:3|Rekam Medis Elektronik:2|Perawatan Luka:2', nice: 'ACLS:1|Perawatan Intensif:1', exp: 1, edu: 's1', langs: 'en:fluent',
    desc: 'Perawat di bangsal penyakit dalam dengan program adaptasi untuk perawat internasional. Termasuk pendampingan hingga registrasi NMC.',
    quals: ['Lulusan keperawatan dengan registrasi aktif di negara asal', 'IELTS 7.0 atau OET B', 'Siap kerja shift'],
    ben: ['Sponsor Health and Care visa', 'Biaya ujian OSCE ditanggung', 'Akomodasi 3 bulan pertama'] },
  { id: 'j14', co: 'goldengate', c: 'US', city: 'San Francisco', title: 'Machine Learning Engineer', cat: 'it', cur: 'USD', min: 170000, max: 220000, per: 'year', type: 'fulltime', model: 'hybrid', days: 1, visa: 1, tz: 'PT (UTC-8)',
    req: 'Python:3|PyTorch:3|Machine Learning:3|MLOps:2|Docker:2', nice: 'Kubernetes:1|Spark:1|Deep Learning:2', exp: 4, edu: 's2', langs: 'en:fluent',
    desc: 'Latih dan sajikan model bahasa untuk asisten dokumen perusahaan. Fokus pada evaluasi, efisiensi inferensi, dan keandalan.',
    quals: ['Minimal 4 tahun ML terapan', 'Pengalaman pipeline pelatihan terdistribusi', 'Publikasi atau proyek open source menjadi nilai plus'],
    ben: ['Sponsor H-1B dan green card', 'Asuransi kesehatan penuh', 'Kepemilikan saham'] },
  { id: 'j15', co: 'hudson', c: 'US', city: 'New York', title: 'Graphic Designer', cat: 'creative', cur: 'USD', min: 45, max: 65, per: 'hour', type: 'contract', model: 'remote', days: 8,
    req: 'Adobe Illustrator:3|Photoshop:3|Branding:2|Typography:2', nice: 'Motion Graphics:1|Figma:2', exp: 3, edu: 'any', langs: 'en:fluent',
    desc: 'Kontrak 6 bulan untuk proyek identitas merek klien gaya hidup. Remote di zona waktu Amerika Serikat.',
    quals: ['Portofolio identitas merek', 'Bisa bekerja mandiri dengan tenggat ketat', 'Berdomisili di AS'],
    ben: ['Jam kerja fleksibel', 'Kemungkinan perpanjangan kontrak', 'Akses lisensi Adobe'] },
  { id: 'j16', co: 'lonestar', c: 'US', city: 'Austin', title: 'Customer Success Manager', cat: 'sales', cur: 'USD', min: 75000, max: 95000, per: 'year', type: 'fulltime', model: 'remote', days: 10, tz: 'CT (UTC-6)',
    req: 'Layanan Pelanggan:3|HubSpot CRM:2|Komunikasi:3|Negosiasi:2', nice: 'Data Analysis:1|Public Speaking:2', exp: 3, edu: 's1', langs: 'en:fluent|es:intermediate',
    desc: 'Dampingi 60 akun bisnis menengah agar sukses memakai platform penjadwalan kami. Mengurangi churn dan menemukan peluang perluasan.',
    quals: ['3 tahun di customer success SaaS', 'Terbiasa mengelola renewal', 'Bahasa Spanyol menjadi nilai plus'],
    ben: ['401(k) dengan matching', 'Cuti tanpa batas', 'Anggaran kerja rumah'] },
  { id: 'j17', co: 'mapleleaf', c: 'CA', city: 'Toronto', title: 'Full Stack Developer', cat: 'it', cur: 'CAD', min: 95000, max: 120000, per: 'year', type: 'fulltime', model: 'hybrid', days: 4, visa: 1,
    req: 'JavaScript:3|Node.js:3|React:2|PostgreSQL:2', nice: 'AWS:1|GraphQL:2|TypeScript:2', exp: 3, edu: 's1', langs: 'en:fluent',
    desc: 'Bangun fitur checkout dan manajemen inventaris untuk ribuan toko online di Kanada.',
    quals: ['Minimal 3 tahun full stack', 'Pengalaman dengan sistem e-commerce', 'Komunikasi tertulis yang baik'],
    ben: ['Dukungan Global Talent Stream', 'Asuransi kesehatan dan gigi', 'Saham karyawan'] },
  { id: 'j18', co: 'pacific', c: 'CA', city: 'Vancouver', title: 'Elementary School Teacher', cat: 'education', cur: 'CAD', min: 60000, max: 78000, per: 'year', type: 'fulltime', model: 'onsite', days: 18, tz: 'PT (UTC-8)',
    req: 'Manajemen Kelas:3|Desain Kurikulum:2|Pendidikan Anak:3', nice: 'Public Speaking:1|Komunikasi:2', exp: 2, edu: 's1', langs: 'en:fluent|fr:intermediate',
    desc: 'Mengajar kelas 3 di sekolah dasar bilingual. Merancang pembelajaran berbasis proyek bersama tim guru.',
    quals: ['Sertifikat mengajar BC atau setara', 'Pengalaman mengajar sekolah dasar', 'Bahasa Prancis menjadi nilai plus'],
    ben: ['Libur musim panas', 'Dana pengembangan profesional', 'Program pensiun'] },
  { id: 'j19', co: 'harbour', c: 'AU', city: 'Sydney', title: 'Civil Engineer', cat: 'engineering', cur: 'AUD', min: 105000, max: 130000, per: 'year', type: 'fulltime', model: 'onsite', days: 6, visa: 1, relo: 1,
    req: 'AutoCAD:3|Civil 3D:2|Manajemen Proyek:2|Structural Analysis:2', nice: 'Six Sigma:1', exp: 4, edu: 's1', langs: 'en:fluent',
    desc: 'Rancang dan awasi proyek jalan serta drainase untuk pemerintah daerah New South Wales.',
    quals: ['Gelar teknik sipil terakreditasi', 'Minimal 4 tahun pengalaman proyek infrastruktur', 'Bisa memperoleh status Chartered Engineer'],
    ben: ['Sponsor visa 482', 'Relokasi keluarga', 'Superannuation 11,5%'] },
  { id: 'j20', co: 'laneway', c: 'AU', city: 'Melbourne', title: 'Barista & Cafe Supervisor', cat: 'hospitality', cur: 'AUD', min: 30, max: 36, per: 'hour', type: 'parttime', model: 'onsite', days: 2,
    req: 'Barista:3|Layanan Pelanggan:2|Food Safety:2', nice: 'Manajemen Tim:1', exp: 1, edu: 'any', langs: 'en:intermediate',
    desc: 'Pimpin shift pagi di kafe specialty coffee yang ramai. 25 sampai 30 jam per minggu.',
    quals: ['Pengalaman barista minimal 1 tahun', 'Sertifikat Food Handler', 'Hak kerja di Australia'],
    ben: ['Kopi gratis tiap shift', 'Penalty rate akhir pekan', 'Pelatihan latte art'] },
  { id: 'j21', co: 'desertpearl', c: 'AE', city: 'Dubai', title: 'Hotel Operations Manager', cat: 'hospitality', cur: 'AED', min: 22000, max: 30000, per: 'month', type: 'fulltime', model: 'onsite', days: 5, visa: 1, relo: 1,
    req: 'Manajemen Operasional:3|Manajemen Tim:3|Opera PMS:2|Revenue Management:2', nice: 'Penanganan Keluhan:2|Six Sigma:1', exp: 6, edu: 's1', langs: 'en:fluent|ar:basic',
    desc: 'Kelola operasional harian hotel 300 kamar di Dubai Marina, mulai dari front office hingga housekeeping.',
    quals: ['Minimal 6 tahun di hotel bintang lima', '2 tahun di posisi manajerial', 'Bahasa Arab menjadi nilai plus'],
    ben: ['Visa kerja dan tiket tahunan', 'Akomodasi atau tunjangan perumahan', 'Bebas pajak penghasilan'] },
  { id: 'j22', co: 'gulfhorizon', c: 'AE', city: 'Abu Dhabi', title: 'Accountant', cat: 'finance', cur: 'AED', min: 14000, max: 19000, per: 'month', type: 'fulltime', model: 'onsite', days: 11, visa: 1,
    req: 'Akuntansi:3|IFRS:2|SAP:2|Excel:3', nice: 'Perpajakan:2|Audit:1', exp: 3, edu: 's1', langs: 'en:fluent',
    desc: 'Tangani pelaporan bulanan dan konsolidasi untuk grup perusahaan properti dan ritel.',
    quals: ['Gelar akuntansi', 'Sertifikasi ACCA atau CPA menjadi nilai plus', 'Pengalaman closing bulanan'],
    ben: ['Visa kerja', 'Asuransi kesehatan', 'Tunjangan pendidikan anak'] },
  { id: 'j23', co: 'paulista', c: 'BR', city: 'São Paulo', title: 'Backend Developer (Java)', cat: 'it', cur: 'BRL', min: 12000, max: 18000, per: 'month', type: 'fulltime', model: 'hybrid', days: 3,
    req: 'Java:3|Spring Boot:3|Microservices:2|PostgreSQL:2', nice: 'Kafka:2|Docker:1', exp: 3, edu: 's1', langs: 'pt:fluent|en:intermediate',
    desc: 'Kembangkan layanan Pix dan penyelesaian pembayaran untuk merchant di seluruh Brasil.',
    quals: ['3 tahun Java di produksi', 'Pengalaman sistem keuangan', 'Bahasa Portugis lancar'],
    ben: ['Vale refeição', 'Asuransi kesehatan', 'Gympass'] },
  { id: 'j24', co: 'carioca', c: 'BR', city: 'Rio de Janeiro', title: 'Digital Marketing Specialist', cat: 'marketing', cur: 'BRL', min: 6000, max: 9000, per: 'month', type: 'fulltime', model: 'remote', days: 14,
    req: 'SEO:2|Google Ads:3|Content Marketing:2|Google Analytics:2', nice: 'Copywriting:2|Social Media Marketing:2', exp: 2, edu: 's1', langs: 'pt:fluent|en:intermediate',
    desc: 'Jalankan kampanye akuisisi berbayar dan organik untuk portal berita dan podcast.',
    quals: ['2 tahun mengelola anggaran iklan digital', 'Paham analitik dan atribusi', 'Kreatif dan berorientasi data'],
    ben: ['Kerja remote penuh', 'Bonus kuartalan', 'Asuransi kesehatan'] },
  { id: 'j25', co: 'ekopay', c: 'NG', city: 'Lagos', title: 'Software Engineer (Fintech)', cat: 'it', cur: 'NGN', min: 900000, max: 1500000, per: 'month', type: 'fulltime', model: 'hybrid', days: 2,
    req: 'TypeScript:3|Node.js:3|REST API:2|PostgreSQL:2', nice: 'React Native:1|AWS:1|Docker:2', exp: 2, edu: 's1', langs: 'en:fluent',
    desc: 'Bangun layanan transfer dan dompet digital untuk UMKM di Afrika Barat.',
    quals: ['2 tahun pengembangan backend', 'Perhatian pada keamanan dan keandalan', 'Pengalaman fintech menjadi nilai plus'],
    ben: ['HMO kesehatan', 'Subsidi internet', 'Opsi saham'] },
  { id: 'j26', co: 'savannah', c: 'NG', city: 'Abuja', title: 'Public Health Officer', cat: 'health', cur: 'NGN', min: 600000, max: 900000, per: 'month', type: 'contract', model: 'onsite', days: 20,
    req: 'Epidemiologi:3|Data Analysis:2|Manajemen Program:2|Komunikasi:2', nice: 'Riset:2|Excel:2', exp: 3, edu: 's2', langs: 'en:fluent|ha:intermediate',
    desc: 'Koordinasikan program imunisasi dan surveilans penyakit di wilayah Federal Capital Territory.',
    quals: ['S2 kesehatan masyarakat', 'Pengalaman program lapangan', 'Bahasa Hausa menjadi nilai plus'],
    ben: ['Kontrak 18 bulan', 'Tunjangan transportasi', 'Asuransi kesehatan'] },
  { id: 'j27', co: 'riftvalley', c: 'KE', city: 'Nairobi', title: 'Agronomist', cat: 'agriculture', cur: 'KES', min: 180000, max: 260000, per: 'month', type: 'fulltime', model: 'onsite', days: 9,
    req: 'Agronomi:3|Analisis Tanah:2|Data Analysis:2', nice: 'Manajemen Proyek:1|Riset:2', exp: 3, edu: 's1', langs: 'en:fluent|sw:intermediate',
    desc: 'Dampingi petani mitra meningkatkan hasil panen dengan data tanah dan cuaca dari sensor lapangan.',
    quals: ['Gelar agronomi atau ilmu tanah', 'Siap perjalanan dinas ke lapangan', 'Bahasa Swahili menjadi nilai plus'],
    ben: ['Kendaraan dinas', 'Asuransi kesehatan', 'Bonus musim panen'] },
  { id: 'j28', co: 'indus', c: 'IN', city: 'Bengaluru', title: 'QA Automation Engineer', cat: 'it', cur: 'INR', min: 1400000, max: 2200000, per: 'year', type: 'fulltime', model: 'hybrid', days: 5,
    req: 'Selenium:3|Python:2|Test Automation:3|CI/CD:2', nice: 'Java:1|Docker:1', exp: 3, edu: 's1', langs: 'en:fluent',
    desc: 'Bangun kerangka uji otomatis untuk platform logistik yang dipakai ribuan pengemudi.',
    quals: ['3 tahun otomasi pengujian', 'Pengalaman uji API dan UI', 'Teliti terhadap detail'],
    ben: ['Asuransi kesehatan keluarga', 'Kerja hybrid', 'Bonus tahunan'] },
  { id: 'j29', co: 'canal', c: 'NL', city: 'Amsterdam', title: 'Supply Chain Analyst', cat: 'logistics', cur: 'EUR', min: 50000, max: 62000, per: 'year', type: 'fulltime', model: 'hybrid', days: 7, visa: 1,
    req: 'Supply Chain Management:3|Excel:3|SQL:2|SAP:2', nice: 'Power BI:2|Data Analysis:2', exp: 2, edu: 's1', langs: 'en:fluent|nl:basic',
    desc: 'Optimalkan aliran barang dari pelabuhan Rotterdam ke gudang di seluruh Eropa.',
    quals: ['Gelar logistik, teknik industri, atau ekonomi', '2 tahun analisis rantai pasok', 'Bahasa Belanda tidak wajib'],
    ben: ['Sponsor Highly Skilled Migrant', 'Fasilitas 30% ruling', 'Sepeda kantor'] },
  { id: 'j30', co: 'twintowers', c: 'MY', city: 'Kuala Lumpur', title: 'Content Writer (Melayu & English)', cat: 'creative', cur: 'MYR', min: 4500, max: 6500, per: 'month', type: 'fulltime', model: 'remote', days: 4,
    req: 'Copywriting:3|SEO:2|Content Marketing:2|Riset:2', nice: 'Social Media Marketing:1|Google Analytics:1', exp: 2, edu: 's1', langs: 'ms:fluent|en:fluent',
    desc: 'Tulis artikel, naskah video, dan konten media sosial untuk merek gaya hidup di Malaysia.',
    quals: ['Portofolio tulisan dua bahasa', 'Paham dasar SEO', 'Disiplin dengan tenggat'],
    ben: ['Kerja remote', 'EPF dan SOCSO', 'Laptop kerja'] },
  { id: 'j31', co: 'balticdocs', c: 'EE', city: 'Tallinn', title: 'Technical Writer', cat: 'it', cur: 'EUR', min: 3500, max: 5000, per: 'month', type: 'contract', model: 'remote', days: 3, rw: 1,
    req: 'Technical Writing:3|API Documentation:3|Markdown:2|Git:2', nice: 'REST API:1|Python:1', exp: 2, edu: 'any', langs: 'en:fluent',
    desc: 'Tulis dokumentasi API dan panduan pengembang untuk klien SaaS dari mana pun di dunia.',
    quals: ['Contoh dokumentasi teknis', 'Paham cara kerja API', 'Bahasa Inggris tulis setara C1'],
    ben: ['Remote dari negara mana pun', 'Tarif bulanan tetap', 'Jam kerja fleksibel'] },
  { id: 'j32', co: 'pearl', c: 'PH', city: 'Manila', title: 'Customer Support Specialist', cat: 'sales', cur: 'PHP', min: 28000, max: 38000, per: 'month', type: 'fulltime', model: 'onsite', days: 1,
    req: 'Layanan Pelanggan:2|Zendesk:2|Komunikasi:3|Penanganan Keluhan:2', nice: 'Excel:1', exp: 1, edu: 'sma', langs: 'en:fluent|tl:fluent',
    desc: 'Bantu pelanggan perusahaan perjalanan global lewat chat dan email. Shift malam waktu Manila.',
    quals: ['Bahasa Inggris lancar', 'Pengalaman layanan pelanggan', 'Bersedia shift malam'],
    ben: ['Tunjangan shift malam', 'HMO dari hari pertama', 'Antar jemput'] },
  { id: 'j33', co: 'hanriver', c: 'KR', city: 'Seoul', title: 'Data Engineer', cat: 'it', cur: 'KRW', min: 60e6, max: 85e6, per: 'year', type: 'fulltime', model: 'hybrid', days: 6, visa: 1,
    req: 'Python:3|SQL:3|Spark:2|Airflow:2', nice: 'AWS:2|Kafka:1', exp: 3, edu: 's1', langs: 'en:fluent|ko:basic',
    desc: 'Bangun pipeline data untuk rekomendasi produk di platform belanja dengan 10 juta pengguna.',
    quals: ['3 tahun data engineering', 'Pengalaman data warehouse skala besar', 'Bahasa Korea menjadi nilai plus'],
    ben: ['Sponsor visa E-7', 'Kelas bahasa Korea', 'Makan siang ditanggung'] },
  { id: 'j34', co: 'tablemountain', c: 'ZA', city: 'Cape Town', title: 'UX Researcher', cat: 'creative', cur: 'ZAR', min: 45000, max: 65000, per: 'month', type: 'fulltime', model: 'remote', days: 8, rw: 1,
    req: 'UX Research:3|Usability Testing:3|Figma:2|Data Analysis:2', nice: 'Prototyping:1|Public Speaking:1', exp: 3, edu: 's1', langs: 'en:fluent',
    desc: 'Pimpin riset untuk aplikasi kesehatan digital yang dipakai di 12 negara. Tim tersebar di seluruh dunia.',
    quals: ['3 tahun riset kualitatif dan kuantitatif', 'Pengalaman riset lintas budaya', 'Mampu menyusun laporan yang jelas'],
    ben: ['Remote dari mana pun', 'Anggaran coworking', 'Cuti 25 hari'] },
  { id: 'j35', co: 'lakeview', c: 'CH', city: 'Zürich', title: 'Clinical Research Associate', cat: 'health', cur: 'CHF', min: 95000, max: 120000, per: 'year', type: 'fulltime', model: 'hybrid', days: 13, visa: 1,
    req: 'Clinical Trials:3|Good Clinical Practice:3|Data Analysis:2', nice: 'Medical Writing:2|Statistics:1', exp: 3, edu: 's2', langs: 'en:fluent|de:intermediate',
    desc: 'Pantau uji klinis fase II dan III di rumah sakit mitra di Swiss dan Jerman.',
    quals: ['Latar belakang ilmu hayati', '3 tahun sebagai CRA', 'Bahasa Jerman B2'],
    ben: ['Bantuan izin kerja', 'Asuransi pensiun', 'Tunjangan transportasi'] },
  { id: 'j36', co: 'aztec', c: 'MX', city: 'Mexico City', title: 'Sales Development Representative', cat: 'sales', cur: 'MXN', min: 30000, max: 45000, per: 'month', type: 'fulltime', model: 'remote', days: 5, rw: 1,
    req: 'Penjualan B2B:2|HubSpot CRM:2|Komunikasi:3|Negosiasi:1', nice: 'Copywriting:1', exp: 1, edu: 'any', langs: 'en:fluent|es:fluent',
    desc: 'Hubungi calon klien di Amerika dan Eropa untuk perangkat lunak logistik. Remote dari mana pun dengan overlap jam kerja Amerika.',
    quals: ['Bilingual Inggris dan Spanyol', 'Pengalaman penjualan atau layanan pelanggan', 'Target oriented'],
    ben: ['Komisi tanpa batas', 'Remote dari mana pun', 'Pelatihan penjualan'] },
  { id: 'j37', co: 'nusantara', c: 'ID', city: 'Jakarta', title: 'Data Analyst Intern', cat: 'it', cur: 'IDR', min: 4e6, max: 5e6, per: 'month', type: 'internship', model: 'hybrid', days: 2,
    req: 'SQL:1|Excel:2|Data Visualization:1', nice: 'Python:1|Statistics:1|Power BI:1', exp: 0, edu: 's1', langs: 'id:fluent|en:basic',
    desc: 'Magang 6 bulan di tim analitik. Membuat dasbor dan analisis perilaku pengguna bersama mentor.',
    quals: ['Mahasiswa tingkat akhir atau lulusan baru', 'Minat kuat pada data', 'Bisa magang penuh waktu'],
    ben: ['Uang saku bulanan', 'Mentor khusus', 'Peluang menjadi karyawan tetap'] },
];

// Initials avatars and certificate previews for the sample profiles,
// drawn as SVG so the samples carry no image files.
function svgUri(svg) { return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }
function initialsAvatar(name, bg) {
  const ini = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" fill="${bg}"/><text x="48" y="60" font-family="system-ui,sans-serif" font-size="36" font-weight="700" fill="#fff" text-anchor="middle">${ini}</text></svg>`);
}
function certPreview(title, issuer, holder) {
  const e = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return svgUri(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 280"><rect width="400" height="280" fill="#eff6ff"/><rect x="12" y="12" width="376" height="256" fill="none" stroke="#2563eb" stroke-width="3"/><text x="200" y="70" font-family="Georgia,serif" font-size="14" fill="#1e3a8a" text-anchor="middle">CERTIFICATE</text><text x="200" y="118" font-family="system-ui,sans-serif" font-size="17" font-weight="700" fill="#0f172a" text-anchor="middle">${e(title.slice(0, 40))}</text><text x="200" y="160" font-family="system-ui,sans-serif" font-size="13" fill="#334155" text-anchor="middle">${e(holder)}</text><text x="200" y="220" font-family="system-ui,sans-serif" font-size="12" fill="#1d4ed8" text-anchor="middle">${e(issuer)}</text></svg>`);
}

const SEED_PROFILES = [
  { id: 'p1', bio: { fullName: 'Rizky Pratama', birthDate: '1994-03-12', gender: 'male', country: 'ID', city: 'Jakarta', nationality: 'ID', email: 'rizky.pratama@example.com', phoneCode: 'ID', phone: '81234567890',
      summary: 'Backend engineer dengan 6 tahun pengalaman membangun layanan pembayaran berskala besar. Suka merapikan arsitektur, menulis tes, dan membimbing engineer baru.', photo: initialsAvatar('Rizky Pratama', '#1d4ed8') },
    education: [{ level: 's1', institution: 'Universitas Indonesia', major: 'Ilmu Komputer', year: '2016' }],
    experience: [
      { position: 'Backend Engineer', company: 'Kopi Kilat', start: '2019-02', end: '', current: true, description: 'Memimpin migrasi layanan pembayaran ke Go dan menurunkan latensi 40%.' },
      { position: 'Software Engineer', company: 'Tokobaru', start: '2016-08', end: '2019-01', current: false, description: 'Membangun API katalog produk dan sistem pencarian.' }],
    skills: [['Go', 3, 5], ['PostgreSQL', 3, 6], ['Docker', 2, 4], ['REST API', 3, 6], ['Kubernetes', 2, 2], ['AWS', 1, 1], ['Redis', 2, 3]],
    languages: [['id', 'native'], ['en', 'fluent']],
    certs: [
      { name: 'Golang Backend Developer', issuer: 'Dicoding Indonesia', issueDate: '2022-05-10', expiryDate: '', verify: 'DCD-GO-22-81734', skills: ['Go', 'REST API'] },
      { name: 'PostgreSQL 14 Associate', issuer: 'EDB', issueDate: '2023-01-20', expiryDate: '2027-01-20', verify: 'https://example.com/verify/edb-55102', skills: ['PostgreSQL'] },
      { name: 'Certified Kubernetes Application Developer', issuer: 'The Linux Foundation', issueDate: '2022-06-01', expiryDate: '2025-06-01', verify: 'LF-CKAD-2206-1189', skills: ['Kubernetes', 'Docker'] }],
    privacy: { showPhone: true, showCerts: true } },
  { id: 'p2', bio: { fullName: 'Amara Okafor', birthDate: '1997-09-02', gender: 'female', country: 'NG', city: 'Lagos', nationality: 'NG', email: 'amara.okafor@example.com', phoneCode: 'NG', phone: '8031234567',
      summary: 'Frontend developer yang juga paham desain antarmuka. Senang membangun produk web yang cepat, mudah diakses, dan nyaman dipakai di ponsel.', photo: initialsAvatar('Amara Okafor', '#0369a1') },
    education: [{ level: 's1', institution: 'University of Lagos', major: 'Computer Engineering', year: '2019' }],
    experience: [
      { position: 'Frontend Developer', company: 'Paystream', start: '2020-01', end: '', current: true, description: 'Membangun dasbor merchant dengan React dan TypeScript.' },
      { position: 'UI Designer (Freelance)', company: 'Mandiri', start: '2018-06', end: '2019-12', current: false, description: 'Merancang situs dan aplikasi untuk UMKM.' }],
    skills: [['React', 3, 4], ['TypeScript', 2, 3], ['JavaScript', 3, 5], ['CSS', 3, 5], ['Figma', 2, 3], ['UI Design', 2, 3], ['Next.js', 2, 2]],
    languages: [['en', 'fluent'], ['yo', 'native']],
    certs: [
      { name: 'Meta Front-End Developer Professional Certificate', issuer: 'Meta (Coursera)', issueDate: '2023-03-15', expiryDate: '', verify: 'https://example.com/verify/meta-fe-7731', skills: ['React', 'JavaScript', 'CSS'] },
      { name: 'Google UX Design Certificate', issuer: 'Google (Coursera)', issueDate: '2021-11-08', expiryDate: '', verify: 'GUX-21-44890', skills: ['Figma', 'UI Design'] }],
    privacy: { showPhone: false, showCerts: true } },
  { id: 'p3', bio: { fullName: 'Ayu Kartika Sari', birthDate: '2001-07-25', gender: 'female', country: 'ID', city: 'Yogyakarta', nationality: 'ID', email: 'ayu.kartika@example.com', phoneCode: 'ID', phone: '85700112233',
      summary: 'Lulusan statistika yang suka mengubah data menjadi cerita. Berpengalaman membuat dasbor penjualan dan analisis survei untuk UMKM.', photo: initialsAvatar('Ayu Kartika Sari', '#2563eb') },
    education: [{ level: 's1', institution: 'Universitas Gadjah Mada', major: 'Statistika', year: '2023' }, { level: 'sma', institution: 'SMA Negeri 3 Yogyakarta', major: 'IPA', year: '2019' }],
    experience: [{ position: 'Data Analyst Intern', company: 'Rumah Batik Laras', start: '2022-07', end: '2022-12', current: false, description: 'Membuat dasbor penjualan bulanan dan analisis pelanggan.' }],
    skills: [['SQL', 2, 2], ['Python', 2, 2], ['Excel', 3, 4], ['Data Visualization', 2, 2], ['Statistics', 2, 3], ['Figma', 1, 1]],
    languages: [['id', 'native'], ['jv', 'fluent'], ['en', 'intermediate']],
    certs: [
      { name: 'Google Data Analytics Professional Certificate', issuer: 'Google (Coursera)', issueDate: '2023-04-02', expiryDate: '', verify: 'GDA-23-10293', skills: ['SQL', 'Data Visualization'] },
      { name: 'Microsoft Office Specialist: Excel Expert', issuer: 'Microsoft', issueDate: '2022-02-14', expiryDate: '', verify: 'MOS-EXP-220214', skills: ['Excel'] }],
    privacy: { showPhone: true, showCerts: false } },
];

// Sample applications so the sample employer's dashboard is never empty.
const SEED_APPLICATIONS = [
  ['a1', 'j1', 'p1', 'processing', 3, 'Saya tertarik membangun layanan pembayaran skala besar di Nusantara Digital.'],
  ['a2', 'j2', 'p1', 'new', 1, 'Saya ingin mencoba peran yang lebih dekat ke frontend.'],
  ['a3', 'j2', 'p2', 'interview', 2, 'Saya sudah 4 tahun membangun dasbor merchant dengan React.'],
  ['a4', 'j3', 'p2', 'new', 1, 'Desain dan kode adalah dua hal yang paling saya sukai.'],
  ['a5', 'j37', 'p3', 'new', 1, 'Saya lulusan statistika dan ingin belajar analitik produk.'],
  ['a6', 'j3', 'p3', 'rejected', 4, 'Saya tertarik dengan riset pengguna.'],
  ['a7', 'j10', 'p1', 'new', 2, 'Saya terbuka untuk bekerja remote di zona waktu Eropa.'],
];

function parseSkillList(s) {
  return (s || '').split('|').filter(Boolean).map(x => { const [name, lv] = x.split(':'); return { name, level: Number(lv) || 1 }; });
}

async function seedStaging(pool) {
  const now = Date.now();
  for (const c of SEED_COMPANIES) {
    await pool.query(
      `INSERT INTO companies (id, owner_user_id, name, country, city, industry, is_demo)
       VALUES ($1, NULL, $2, $3, $4, $5, TRUE) ON CONFLICT (id) DO NOTHING`,
      [c.id, c.name, c.country, c.city, c.industry]);
  }
  for (const j of SEED_JOBS) {
    await pool.query(
      `INSERT INTO jobs (id, company_id, title, category, country, city, currency, salary_min, salary_max, period,
         type, model, remote_worldwide, visa_sponsor, relocation, required, nice, min_exp, education, languages,
         description, qualifications, benefits, timezone, is_demo, posted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,TRUE,$25)
       ON CONFLICT (id) DO NOTHING`,
      [j.id, j.co, j.title, j.cat, j.c, j.city, j.cur, j.min, j.max, j.per, j.type, j.model, !!j.rw, !!j.visa, !!j.relo,
        JSON.stringify(parseSkillList(j.req)), JSON.stringify(parseSkillList(j.nice)), j.exp, j.edu,
        JSON.stringify(j.langs.split('|').map(x => { const [code, level] = x.split(':'); return { code, level }; })),
        j.desc, JSON.stringify(j.quals), JSON.stringify(j.ben), j.tz || COUNTRY_TZ[j.c] || '',
        new Date(now - j.days * DAY).toISOString()]);
  }
  for (const p of SEED_PROFILES) {
    const b = p.bio;
    const ins = await pool.query(
      `INSERT INTO profiles (id, user_id, is_demo, photo_url, full_name, birth_date, gender, country, city, nationality,
         email, phone_code, phone, summary, education, experience, languages, show_phone, show_certs)
       VALUES ($1, NULL, TRUE, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
       ON CONFLICT (id) DO NOTHING RETURNING id`,
      [p.id, b.photo, b.fullName, b.birthDate, b.gender, b.country, b.city, b.nationality, b.email, b.phoneCode, b.phone,
        b.summary, JSON.stringify(p.education.map((e, i) => ({ id: p.id + 'e' + i, ...e }))),
        JSON.stringify(p.experience.map((e, i) => ({ id: p.id + 'x' + i, ...e }))),
        JSON.stringify(p.languages.map(([code, level], i) => ({ id: p.id + 'l' + i, code, level }))),
        p.privacy.showPhone, p.privacy.showCerts]);
    if (!ins.rowCount) continue;
    for (const [i, [name, level, years]] of p.skills.entries()) {
      await pool.query(`INSERT INTO skills (id, profile_id, name, level, years) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (id) DO NOTHING`,
        [p.id + 's' + i, p.id, name, level, years]);
    }
    for (const [i, c] of p.certs.entries()) {
      await pool.query(
        `INSERT INTO certificates (id, profile_id, name, issuer, issue_date, expiry_date, verify, skills, file_url, file_type, file_name)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'image/svg+xml',$10) ON CONFLICT (id) DO NOTHING`,
        [p.id + 'c' + i, p.id, c.name, c.issuer, c.issueDate, c.expiryDate, c.verify, JSON.stringify(c.skills),
          certPreview(c.name, c.issuer, b.fullName), c.name + '.svg']);
    }
  }
  for (const [id, jobId, profileId, status, daysAgo, message] of SEED_APPLICATIONS) {
    const certs = SEED_PROFILES.find(p => p.id === profileId).certs.map((_, i) => profileId + 'c' + i);
    await pool.query(
      `INSERT INTO applications (id, job_id, profile_id, status, message, cert_ids, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
      [id, jobId, profileId, status, message, JSON.stringify(certs), new Date(now - daysAgo * DAY).toISOString()]);
  }
}

module.exports = { seedStaging, SEED_JOBS, SEED_PROFILES };
