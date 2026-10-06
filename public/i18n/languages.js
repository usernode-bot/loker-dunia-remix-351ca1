/* Loker Dunia interface languages: the single list the language picker,
 * the header badge and the page direction read from.
 *
 * Each entry has a matching file public/i18n/<code>.js, loaded only when
 * someone picks that language. English is the default and the fallback for
 * a missing key; it is always loaded.
 *   name   : the language's own name, as its speakers write it
 *   short  : the code shown on the header button
 *   locale : what Intl uses for dates, numbers and currencies
 *   dir    : 'rtl' for right-to-left scripts, otherwise 'ltr'
 */
window.LOKER_LANGS = [
  { code: 'en', name: 'English', short: 'EN', locale: 'en-US', dir: 'ltr' },
  { code: 'id', name: 'Bahasa Indonesia', short: 'ID', locale: 'id-ID', dir: 'ltr' },
  { code: 'zh-Hans', name: '简体中文', short: 'ZH', locale: 'zh-CN', dir: 'ltr' },
  { code: 'zh-Hant', name: '繁體中文', short: 'ZHT', locale: 'zh-TW', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', short: 'HI', locale: 'hi-IN', dir: 'ltr' },
  { code: 'es', name: 'Español', short: 'ES', locale: 'es-ES', dir: 'ltr' },
  { code: 'fr', name: 'Français', short: 'FR', locale: 'fr-FR', dir: 'ltr' },
  { code: 'ar', name: 'العربية', short: 'AR', locale: 'ar', dir: 'rtl' },
  { code: 'bn', name: 'বাংলা', short: 'BN', locale: 'bn-BD', dir: 'ltr' },
  { code: 'pt', name: 'Português', short: 'PT', locale: 'pt-BR', dir: 'ltr' },
  { code: 'ru', name: 'Русский', short: 'RU', locale: 'ru-RU', dir: 'ltr' },
  { code: 'ur', name: 'اردو', short: 'UR', locale: 'ur-PK', dir: 'rtl' },
  { code: 'de', name: 'Deutsch', short: 'DE', locale: 'de-DE', dir: 'ltr' },
  { code: 'ja', name: '日本語', short: 'JA', locale: 'ja-JP', dir: 'ltr' },
  { code: 'sw', name: 'Kiswahili', short: 'SW', locale: 'sw-KE', dir: 'ltr' },
  { code: 'mr', name: 'मराठी', short: 'MR', locale: 'mr-IN', dir: 'ltr' },
  { code: 'te', name: 'తెలుగు', short: 'TE', locale: 'te-IN', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', short: 'TR', locale: 'tr-TR', dir: 'ltr' },
  { code: 'ta', name: 'தமிழ்', short: 'TA', locale: 'ta-IN', dir: 'ltr' },
  { code: 'vi', name: 'Tiếng Việt', short: 'VI', locale: 'vi-VN', dir: 'ltr' },
  { code: 'ko', name: '한국어', short: 'KO', locale: 'ko-KR', dir: 'ltr' },
  { code: 'fa', name: 'فارسی', short: 'FA', locale: 'fa-IR', dir: 'rtl' },
  { code: 'ha', name: 'Hausa', short: 'HA', locale: 'ha-NG', dir: 'ltr' },
  { code: 'it', name: 'Italiano', short: 'IT', locale: 'it-IT', dir: 'ltr' },
  { code: 'th', name: 'ไทย', short: 'TH', locale: 'th-TH', dir: 'ltr' },
  { code: 'gu', name: 'ગુજરાતી', short: 'GU', locale: 'gu-IN', dir: 'ltr' },
  { code: 'jv', name: 'Basa Jawa', short: 'JV', locale: 'jv-ID', dir: 'ltr' },
  { code: 'pl', name: 'Polski', short: 'PL', locale: 'pl-PL', dir: 'ltr' },
  { code: 'uk', name: 'Українська', short: 'UK', locale: 'uk-UA', dir: 'ltr' },
  { code: 'ms', name: 'Bahasa Melayu', short: 'MS', locale: 'ms-MY', dir: 'ltr' },
  { code: 'fil', name: 'Filipino', short: 'FIL', locale: 'fil-PH', dir: 'ltr' },
  { code: 'kn', name: 'ಕನ್ನಡ', short: 'KN', locale: 'kn-IN', dir: 'ltr' },
  { code: 'ml', name: 'മലയാളം', short: 'ML', locale: 'ml-IN', dir: 'ltr' },
  { code: 'pa', name: 'ਪੰਜਾਬੀ', short: 'PA', locale: 'pa-IN', dir: 'ltr' },
  { code: 'my', name: 'မြန်မာ', short: 'MY', locale: 'my-MM', dir: 'ltr' },
  { code: 'am', name: 'አማርኛ', short: 'AM', locale: 'am-ET', dir: 'ltr' },
  { code: 'yo', name: 'Yorùbá', short: 'YO', locale: 'yo-NG', dir: 'ltr' },
  { code: 'ig', name: 'Igbo', short: 'IG', locale: 'ig-NG', dir: 'ltr' },
  { code: 'nl', name: 'Nederlands', short: 'NL', locale: 'nl-NL', dir: 'ltr' },
  { code: 'ro', name: 'Română', short: 'RO', locale: 'ro-RO', dir: 'ltr' },
  { code: 'el', name: 'Ελληνικά', short: 'EL', locale: 'el-GR', dir: 'ltr' },
  { code: 'cs', name: 'Čeština', short: 'CS', locale: 'cs-CZ', dir: 'ltr' },
  { code: 'hu', name: 'Magyar', short: 'HU', locale: 'hu-HU', dir: 'ltr' },
  { code: 'sv', name: 'Svenska', short: 'SV', locale: 'sv-SE', dir: 'ltr' },
  { code: 'he', name: 'עברית', short: 'HE', locale: 'he-IL', dir: 'rtl' },
  { code: 'ne', name: 'नेपाली', short: 'NE', locale: 'ne-NP', dir: 'ltr' },
  { code: 'si', name: 'සිංහල', short: 'SI', locale: 'si-LK', dir: 'ltr' },
  { code: 'km', name: 'ខ្មែរ', short: 'KM', locale: 'km-KH', dir: 'ltr' },
  { code: 'uz', name: 'Oʻzbekcha', short: 'UZ', locale: 'uz-UZ', dir: 'ltr' },
  { code: 'su', name: 'Basa Sunda', short: 'SU', locale: 'su-ID', dir: 'ltr' },
];
