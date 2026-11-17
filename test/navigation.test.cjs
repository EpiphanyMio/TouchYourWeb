const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeHttpUrl, isHttpUrl } = require('../src/navigation.cjs');

test('normalizes a domain to HTTPS and preserves explicit HTTP', () => {
  assert.equal(normalizeHttpUrl('example.com'), 'https://example.com/');
  assert.equal(normalizeHttpUrl(' http://example.com/path '), 'http://example.com/path');
});

test('rejects empty, privileged, and credential-bearing addresses', () => {
  for (const value of ['', 'file:///etc/passwd', 'javascript:alert(1)', 'https://user:secret@example.com']) {
    assert.throws(() => normalizeHttpUrl(value));
  }
  assert.equal(isHttpUrl('https://example.com'), true);
  assert.equal(isHttpUrl('file:///etc/passwd'), false);
});
