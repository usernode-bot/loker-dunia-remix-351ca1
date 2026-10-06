'use strict';
// Interface text: every language listed in public/i18n/languages.js has a
// file with exactly the English keys and the same {placeholders}, and the
// page only asks for keys English defines.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'i18n');
global.window = {};
require(path.join(DIR, 'languages.js'));
const LANGS = window.LOKER_LANGS;
for (const l of LANGS) if (fs.existsSync(path.join(DIR, l.code + '.js'))) require(path.join(DIR, l.code + '.js'));
const EN = window.LOKER_I18N.en.strings;
const placeholders = s => (String(s).match(/\{[a-zA-Z]+\}/g) || []).sort().join(',');

test('fifty languages, English first, no duplicates', () => {
  assert.equal(LANGS.length, 50);
  assert.equal(new Set(LANGS.map(l => l.code)).size, 50);
  assert.equal(LANGS[0].code, 'en');
});

test('right-to-left exactly for Arabic, Persian, Urdu and Hebrew', () => {
  assert.deepEqual(LANGS.filter(l => l.dir === 'rtl').map(l => l.code).sort(), ['ar', 'fa', 'he', 'ur']);
  for (const l of LANGS) assert.ok(l.dir === 'ltr' || l.dir === 'rtl', l.code);
});

test('every listed language has a file, and every file is listed', () => {
  const files = fs.readdirSync(DIR).filter(f => f.endsWith('.js') && f !== 'languages.js').map(f => f.slice(0, -3)).sort();
  assert.deepEqual(files, LANGS.map(l => l.code).sort());
});

for (const l of LANGS) {
  test('language file ' + l.code + ' matches English', () => {
    const file = window.LOKER_I18N[l.code];
    assert.ok(file, l.code + ' registers under its own code');
    assert.equal(file.name, l.name);
    assert.equal(file.locale, l.locale);
    assert.deepEqual(Object.keys(file.strings).sort(), Object.keys(EN).sort());
    for (const k in EN) {
      const v = file.strings[k];
      assert.ok(typeof v === 'string' && v.trim(), l.code + '.' + k + ' is empty');
      assert.equal(placeholders(v), placeholders(EN[k]), l.code + '.' + k + ' placeholders');
      assert.ok(!v.includes('—'), l.code + '.' + k + ' has an em dash');
    }
  });
}

test('every literal t() key in the page exists in English', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
  // Keys built by concatenation (t('cat_' + x)) end in "_" and are skipped.
  const keys = [...html.matchAll(/\bt\('([A-Za-z0-9]+)'[,)]/g)].map(m => m[1]);
  assert.ok(keys.length > 300);
  assert.deepEqual([...new Set(keys)].filter(k => !(k in EN)), []);
});
